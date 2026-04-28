import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

function chunkText(text: string, chunkSize: number) {
  const chunks: string[] = []

  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize))
  }

  return chunks
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

    const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
    if (arrayMatch?.[0]) {
      return JSON.parse(arrayMatch[0])
    }

    throw new SyntaxError("Model response did not contain valid JSON")
  }
}

function normalizeRules(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter((rule): rule is string => typeof rule === "string")
    .map((rule) => rule.trim())
    .filter(Boolean)
}

function getOpenAIErrorMessage(error: unknown) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return "OpenAI authentication failed. Check OPENAI_API_KEY and restart the dev server."
    }

    if (error.status === 429) {
      return "OpenAI rate limit reached. Please wait a moment and try again."
    }

    if (error.status && error.status >= 500) {
      return "OpenAI is currently unavailable. Please retry shortly."
    }

    return error.message || "OpenAI request failed."
  }

  return "Failed to generate rules. Please try again."
}

export async function POST(request: NextRequest) {
  try {
    const { organizationName, description } = await request.json()

    if (!organizationName || !description) {
      return NextResponse.json(
        { error: "Missing required fields: organizationName, description" },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const descriptionText = typeof description === "string" ? description.trim() : ""
    const descriptionSections =
      descriptionText.length > 500
        ? chunkText(descriptionText, 500).map(
          (section, index) => `Section ${index + 1}: ${section}`
        )
        : [descriptionText]

    const prompt = `You are an expert curriculum designer. Based on the following organization description, generate 5-8 clear, measurable grading criteria/rules.

Organization: ${organizationName}
Description:
${descriptionSections.join("\n\n")}

If the description is longer than 500 characters, analyze all sections together and preserve the important themes across the full description.

Each rule should be:
- Specific and measurable
- Focused on a key aspect of quality work
- Appropriate for evaluating student submissions in this context

Return the rules as a JSON array of strings:
["Rule 1", "Rule 2", "Rule 3", ...]

Only return valid JSON, no additional text.`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_rules",
          schema: {
            type: "object",
            properties: {
              rules: {
                type: "array",
                minItems: 5,
                maxItems: 8,
                items: {
                  type: "string",
                },
              },
            },
            required: ["rules"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const contentText = response.choices[0].message.content || ""

    // Parse the JSON response
    const parsed = parseJsonFromModelOutput(contentText)
    const rules = normalizeRules(
      typeof parsed === "object" && parsed !== null && "rules" in parsed
        ? (parsed as { rules: unknown }).rules
        : parsed
    )

    if (rules.length === 0) {
      throw new Error("Expected array of rules from AI")
    }

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Error generating rules:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: getOpenAIErrorMessage(error) }, { status: 500 })
  }
}
