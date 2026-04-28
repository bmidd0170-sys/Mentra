import { NextRequest, NextResponse } from "next/server"
import { gradeAndPersistSubmission } from "@/lib/submission-grading"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : ""

    if (!submissionId) {
      return NextResponse.json({ error: "Missing required field: submissionId" }, { status: 400 })
    }

    const graded = await gradeAndPersistSubmission(submissionId)

    return NextResponse.json({
      submissionId: graded.submissionId,
      aiScore: graded.aiScore,
      results: graded.results,
    })
  } catch (error) {
    console.error("Failed to grade submission:", error)

    const message = error instanceof Error ? error.message : "Failed to grade submission"
    if (message.includes("Rubric is invalid") || message.includes("Submission not found")) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 })
  }
}
