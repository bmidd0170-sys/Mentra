import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

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

    const prompt = `You are an expert curriculum designer. Based on the following organization description, generate 5-8 clear, measurable grading criteria/rules.

Organization: ${organizationName}
Description: ${description}

Each rule should be:
- Specific and measurable
- Focused on a key aspect of quality work
- Appropriate for evaluating student submissions in this context

Return the rules as a JSON array of strings:
["Rule 1", "Rule 2", "Rule 3", ...]

Only return valid JSON, no additional text.`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const content_text = response.choices[0].message.content || ""

    // Parse the JSON response
    const rules = JSON.parse(content_text)

    if (!Array.isArray(rules)) {
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

    return NextResponse.json(
      { error: "Failed to generate rules. Please try again." },
      { status: 500 }
    )
  }
}
