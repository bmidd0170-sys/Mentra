import OpenAI from "openai"
import * as mammoth from "mammoth"
import { pathToFileURL } from "url"
import path from "path"

type ExtractedRuleCategory = {
  name: string
  description: string
  rules: string[]
}

type DocumentRulesResponse = {
  categories: ExtractedRuleCategory[]
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

function configurePdfWorker(PDFParse: typeof import("pdf-parse").PDFParse) {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdf-parse",
    "dist",
    "pdf-parse",
    "web",
    "pdf.worker.mjs"
  )

  PDFParse.setWorker(pathToFileURL(workerPath).href)
}

export async function extractDocumentText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  }

  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    return new TextDecoder().decode(buffer)
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfParseModule = await import("pdf-parse")
    const PdfParse = pdfParseModule.PDFParse

    if (typeof PdfParse !== "function") {
      throw new Error("PDF parser is not available")
    }

    configurePdfWorker(PdfParse)

    const parser = new PdfParse({ data: Buffer.from(buffer) })
    const result = await parser.getText()
    const text = result.pages.map((page) => page.text).join("\n")
    await parser.destroy()
    return text
  }

  throw new Error(`Unsupported file type: ${file.type}`)
}

function normalizeDocumentRules(value: unknown): DocumentRulesResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Model response is not a JSON object")
  }

  const candidate = value as { categories?: unknown }
  if (!Array.isArray(candidate.categories)) {
    throw new Error("Model response is missing categories")
  }

  const categories = candidate.categories
    .filter((category): category is ExtractedRuleCategory => Boolean(category && typeof category === "object"))
    .map((category) => {
      const candidateCategory = category as {
        name?: unknown
        description?: unknown
        rules?: unknown
      }

      return {
        name: typeof candidateCategory.name === "string" ? candidateCategory.name.trim() : "",
        description:
          typeof candidateCategory.description === "string"
            ? candidateCategory.description.trim()
            : "",
        rules: Array.isArray(candidateCategory.rules)
          ? candidateCategory.rules
              .filter((rule): rule is string => typeof rule === "string")
              .map((rule) => rule.trim())
              .filter(Boolean)
          : [],
      }
    })
    .filter((category) => category.name.length > 0 && category.rules.length > 0)

  if (categories.length === 0) {
    throw new Error("Model returned no document rule categories")
  }

  return { categories }
}

function normalizeDescription(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed || fallback
}

export async function extractRulesFromDocument(params: {
  documentText: string
  organizationName?: string
  description?: string | null
}) {
  const { documentText, organizationName, description } = params
  const client = getOpenAIClient()
  const text = documentText.trim()

  if (!text) {
    return [] as Array<{ title: string; description: string; weight: number }>
  }

  const prompt = `You are an expert curriculum designer. Analyze the document below and extract the grading rules it describes.

Organization: ${organizationName?.trim() || "Unknown"}
Organization description: ${description?.trim() || "N/A"}

Document:
${text}

Group related rules into clear categories that reflect the document's own structure.
Return JSON in this exact format:
{
  "categories": [
    {
      "name": "Category name",
      "description": "Brief category description",
      "rules": ["Rule 1", "Rule 2"]
    }
  ]
}

Requirements:
- Return 3 to 8 categories when possible.
- Each category should contain 1 or more rules.
- Keep each rule concise, specific, and readable.
- If the document contains headings or sections, preserve them when they clearly represent categories.
- Output only valid JSON.`

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_rules",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            categories: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  rules: {
                    type: "array",
                    minItems: 1,
                    items: { type: "string" },
                  },
                },
                required: ["name", "description", "rules"],
              },
            },
          },
          required: ["categories"],
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
  const normalized = normalizeDocumentRules(parsed)

  return normalized.categories.flatMap((category) =>
    category.rules.map((rule) => ({
      title: rule,
      description: normalizeDescription(`${category.name}: ${category.description}`, category.name),
      weight: 1,
    }))
  )
}