import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const { content, rules, assignmentName, organizationName } = await request.json()

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

Please provide:
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
    const result = JSON.parse(content_text)

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

    return NextResponse.json(
      { error: "Failed to generate AI review. Please try again." },
      { status: 500 }
    )
  }
}
