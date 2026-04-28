import OpenAI from "openai"
import { assertValidRubric, type RubricCriterionInput } from "@/lib/rubric"

type AIGradeResult = {
  level: string
  reason: string
  improvements: string[]
  confidence: number
}

function parseJsonFromModelOutput(raw: string) {
  const trimmed = raw.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (fencedMatch?.[1]) {
      return JSON.parse(fencedMatch[1])
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/)
    if (objectMatch?.[0]) {
      return JSON.parse(objectMatch[0])
    }

    throw new SyntaxError("Model response did not contain valid JSON")
  }
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured")
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function normalizeAIGradeResult(value: unknown): AIGradeResult {
  if (!value || typeof value !== "object") {
    throw new Error("Model response is not a JSON object")
  }

  const candidate = value as {
    level?: unknown
    reason?: unknown
    improvements?: unknown
    confidence?: unknown
  }

  const level = typeof candidate.level === "string" ? candidate.level.trim() : ""
  const reason = typeof candidate.reason === "string" ? candidate.reason.trim() : ""
  const improvements = Array.isArray(candidate.improvements)
    ? candidate.improvements.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : []

  const confidenceRaw =
    typeof candidate.confidence === "number"
      ? candidate.confidence
      : typeof candidate.confidence === "string"
        ? Number(candidate.confidence)
        : NaN

  if (!level || !reason || improvements.length === 0 || Number.isNaN(confidenceRaw)) {
    throw new Error("Model returned invalid grading payload")
  }

  return {
    level,
    reason,
    improvements,
    confidence: Math.max(0, Math.min(1, confidenceRaw)),
  }
}

function resolveLevelByLabel(levelLabel: string, levels: RubricCriterionInput["levels"]) {
  const normalized = levelLabel.trim().toLowerCase()
  const byExact = levels.find((level) => level.label.trim().toLowerCase() === normalized)
  if (byExact) {
    return byExact
  }

  return levels[0]
}

export async function generateRubricFromRules(rules: string[]) {
  const normalizedRules = Array.from(
    new Set(
      rules
        .filter((rule): rule is string => typeof rule === "string")
        .map((rule) => rule.trim())
        .filter(Boolean)
    )
  )

  if (normalizedRules.length === 0) {
    return [] satisfies RubricCriterionInput[]
  }

  const client = getOpenAIClient()

  const prompt = `You are an expert instructional designer.
Convert these grading rules into a structured rubric.

Rules:
${normalizedRules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}

Return JSON with this structure:
{
  "criteria": [
    {
      "name": "Criterion name",
      "description": "Optional criterion description",
      "levels": [
        {
          "label": "Exemplary",
          "score": 4,
          "description": "Clear description"
        }
      ]
    }
  ]
}

Requirements:
- Expand each input rule into one criterion.
- Each criterion must have 3 to 4 levels.
- Every level description must be clear, specific, and non-empty.
- Keep scores numeric and descending from strongest to weakest level.
- Output only valid JSON.`

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "generated_rubric",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            criteria: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  levels: {
                    type: "array",
                    minItems: 3,
                    maxItems: 4,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        label: { type: "string" },
                        score: { type: "number" },
                        description: { type: "string" },
                      },
                      required: ["label", "score", "description"],
                    },
                  },
                },
                required: ["name", "description", "levels"],
              },
            },
          },
          required: ["criteria"],
        },
      },
    },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content || ""
  const parsed = parseJsonFromModelOutput(raw) as { criteria?: RubricCriterionInput[] }

  const criteria = Array.isArray(parsed.criteria) ? parsed.criteria : []
  assertValidRubric(criteria)

  return criteria
}

export async function gradeSubmissionWithRubric(params: {
  submissionText: string
  criteria: RubricCriterionInput[]
}) {
  const { submissionText, criteria } = params
  assertValidRubric(criteria)

  const client = getOpenAIClient()
  const results: Array<{
    criterionName: string
    level: string
    reason: string
    improvements: string[]
    confidence: number
  }> = []

  for (const criterion of criteria) {
    const levelsText = criterion.levels
      .map((level) => `- ${level.label} (score: ${level.score}): ${level.description}`)
      .join("\n")

    const prompt = `You are grading a student submission using a rubric.

Criterion: ${criterion.name}

Levels:
${levelsText}

Student submission:
${submissionText}

Return JSON:
{
  "level": "string",
  "reason": "string",
  "improvements": ["string"],
  "confidence": 0.0
}

Rules:
- level must be exactly one of the level labels provided.
- confidence must be between 0 and 1.
- improvements must contain at least one actionable suggestion.
- Output only valid JSON.`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "criterion_grade",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              level: { type: "string" },
              reason: { type: "string" },
              improvements: {
                type: "array",
                minItems: 1,
                items: { type: "string" },
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["level", "reason", "improvements", "confidence"],
          },
        },
      },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content || ""
    const parsed = parseJsonFromModelOutput(raw)
    const normalized = normalizeAIGradeResult(parsed)
    const level = resolveLevelByLabel(normalized.level, criterion.levels)

    results.push({
      criterionName: criterion.name,
      level: level.label,
      reason: normalized.reason,
      improvements: normalized.improvements,
      confidence: normalized.confidence,
    })
  }

  return results
}
