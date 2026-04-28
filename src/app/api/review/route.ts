import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import * as mammoth from "mammoth"

type ReviewPayload = {
  grade: string
  score: number
  feedback: string[]
}

async function extractDocumentText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    } catch (error) {
      throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    try {
      const text = new TextDecoder().decode(buffer)
      return text
    } catch (error) {
      throw new Error(`Failed to parse TXT: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error(
      "PDF parsing requires additional setup. Please upload a DOCX or TXT file, or paste your content directly."
    )
  }

  throw new Error(`Unsupported file type: ${file.type}`)
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

function normalizeReviewPayload(value: unknown): ReviewPayload | null {
  if (!value || typeof value !== "object") return null

  const candidate = value as { grade?: unknown; score?: unknown; feedback?: unknown }
  const grade = typeof candidate.grade === "string" ? candidate.grade.trim() : ""

  const numericScore =
    typeof candidate.score === "number"
      ? candidate.score
      : typeof candidate.score === "string"
        ? Number(candidate.score)
        : NaN

  const feedback = Array.isArray(candidate.feedback)
    ? candidate.feedback
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
    : []

  if (!grade || Number.isNaN(numericScore) || feedback.length === 0) {
    return null
  }

  return {
    grade,
    score: Math.max(0, Math.min(100, Math.round(numericScore))),
    feedback,
  }
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

  return "Failed to generate AI review. Please try again."
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")
    let content: string = ""
    let screenshotDataUrl: string | undefined
    let rules: string[] = []
    let assignmentName: string = ""
    let organizationName: string = ""

    if (contentType?.includes("application/json")) {
      const { content: jsonContent, screenshotDataUrl: jsonScreenshot, rules: jsonRules, assignmentName: jsonAssignmentName, organizationName: jsonOrganizationName } = await request.json()
      content = jsonContent
      screenshotDataUrl = jsonScreenshot
      rules = jsonRules
      assignmentName = jsonAssignmentName
      organizationName = jsonOrganizationName
    } else if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData()

      const contentField = formData.get("content")
      const fileField = formData.get("file")
      const screenshotField = formData.get("screenshot")
      const rulesField = formData.get("rules")
      const assignmentNameField = formData.get("assignmentName")
      const organizationNameField = formData.get("organizationName")

      if (contentField && typeof contentField === "string") {
        content = contentField
      }

      if (fileField instanceof File) {
        try {
          content = await extractDocumentText(fileField)
        } catch (error) {
          return NextResponse.json(
            { error: `Document parsing failed: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 400 }
          )
        }
      }

      if (screenshotField && typeof screenshotField === "string") {
        screenshotDataUrl = screenshotField
      }

      if (rulesField && typeof rulesField === "string") {
        try {
          rules = JSON.parse(rulesField)
        } catch {
          rules = []
        }
      }

      if (assignmentNameField && typeof assignmentNameField === "string") {
        assignmentName = assignmentNameField
      }

      if (organizationNameField && typeof organizationNameField === "string") {
        organizationName = organizationNameField
      }
    }

    if (!content || !rules || rules.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: content, rules" },
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

    const prompt = `You are an expert academic grader evaluating student work. 

Assignment: ${assignmentName}
Organization/Course: ${organizationName}

Grading Criteria (Rules):
${rules.map((rule: string, i: number) => `${i + 1}. ${rule}`).join("\n")}

Student Submission:
${content}

${typeof screenshotDataUrl === "string" && screenshotDataUrl ? "A screenshot of the submitted page is also attached. Use it as additional context for your review." : ""}

Please carefully review the student's submission against each grading criterion. Consider how well the submission addresses or satisfies each rule. Segment your feedback to reference specific parts of the submission when relevant.

Provide:
1. A letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F)
2. A numeric score (0-100)
3. 4-5 specific pieces of feedback (mix of strengths and improvement areas)

Format your response as JSON with this structure:
{
  "grade": "B+",
  "score": 87,
  "feedback": [
    "Strength or area for improvement 1",
    "Strength or area for improvement 2",
    "etc"
  ]
}

Only return valid JSON, no additional text.`

    const hasScreenshot =
      typeof screenshotDataUrl === "string" && screenshotDataUrl.startsWith("data:image/")

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

    if (hasScreenshot) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: screenshotDataUrl,
            },
          },
        ],
      } as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam)
    } else {
      messages.push({
        role: "user",
        content: prompt,
      })
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "assignment_review",
          schema: {
            type: "object",
            properties: {
              grade: {
                type: "string",
              },
              score: {
                type: "number",
              },
              feedback: {
                type: "array",
                minItems: 3,
                maxItems: 6,
                items: {
                  type: "string",
                },
              },
            },
            required: ["grade", "score", "feedback"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      messages,
    })

    const contentText = response.choices[0].message.content || ""

    // Parse the JSON response
    const parsed = parseJsonFromModelOutput(contentText)
    const result = normalizeReviewPayload(parsed)

    if (!result) {
      throw new Error("Model returned an invalid review payload")
    }

    return NextResponse.json({
      grade: result.grade,
      score: result.score,
      feedback: result.feedback,
    })
  } catch (error) {
    console.error("Error during AI review:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: getOpenAIErrorMessage(error) }, { status: 500 })
  }
}
