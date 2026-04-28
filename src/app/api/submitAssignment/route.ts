import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { gradeAndPersistSubmission } from "@/lib/submission-grading"
import { validateRubric } from "@/lib/rubric"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const assignmentId = typeof body.assignmentId === "string" ? body.assignmentId.trim() : ""
    const content = typeof body.content === "string" ? body.content.trim() : ""
    const userId = typeof body.userId === "string" ? body.userId.trim() : null
    const autoGrade = body.autoGrade !== false

    if (!assignmentId || !content) {
      return NextResponse.json(
        { error: "Missing required fields: assignmentId, content" },
        { status: 400 }
      )
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        organization: {
          include: {
            criteria: {
              include: { levels: true },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const rubric = assignment.organization.criteria.map((criterion) => ({
      name: criterion.name,
      description: criterion.description,
      levels: criterion.levels.map((level) => ({
        label: level.label,
        score: level.score,
        description: level.description,
      })),
    }))

    const validation = validateRubric(rubric)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        userId,
        content,
        status: autoGrade ? "processing" : "submitted",
      },
    })

    if (!autoGrade) {
      return NextResponse.json(
        {
          submission: {
            id: submission.id,
            assignmentId: submission.assignmentId,
            status: submission.status,
            createdAt: submission.createdAt.toISOString(),
          },
        },
        { status: 201 }
      )
    }

    const graded = await gradeAndPersistSubmission(submission.id)

    return NextResponse.json(
      {
        submission: {
          id: submission.id,
          assignmentId: submission.assignmentId,
          status: "reviewed",
          aiScore: graded.aiScore,
          results: graded.results,
          createdAt: submission.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to submit assignment:", error)

    const message = error instanceof Error ? error.message : "Failed to submit assignment"
    if (message.includes("Rubric is invalid")) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to submit assignment" }, { status: 500 })
  }
}
