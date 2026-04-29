import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        rules: {
          include: {
            rule: true,
          },
        },
        organization: {
          include: {
            rules: true,
            criteria: {
              include: {
                levels: {
                  orderBy: { score: "desc" },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
          include: {
            results: {
              include: {
                criterion: true,
                selectedLevel: true,
              },
              orderBy: {
                criterion: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        instructions: assignment.instructions,
        rules: assignment.rules.map((assignmentRule) => assignmentRule.rule.title),
        organizationRules: assignment.organization.rules.map((rule) => rule.title),
        organization: {
          id: assignment.organization.id,
          name: assignment.organization.name,
          gradingSystem: assignment.organization.gradingSystem,
        },
        criteria: assignment.organization.criteria,
        submissions: assignment.submissions.map((submission) => ({
          id: submission.id,
          content: submission.content,
          aiScore: submission.aiScore,
          status: submission.status,
          createdAt: submission.createdAt.toISOString(),
          results: submission.results.map((result) => ({
            id: result.id,
            criterionName: result.criterion.name,
            selectedLevelLabel: result.selectedLevel.label,
            selectedLevelScore: result.selectedLevel.score,
            reasoning: result.reasoning,
            improvementSuggestions: result.improvementSuggestions,
            confidence: result.confidence,
          })),
        })),
      },
    })
  } catch (error) {
    console.error("Failed to fetch assignment detail:", error)
    return NextResponse.json({ error: "Failed to fetch assignment detail" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const title = typeof body.title === "string" ? body.title.trim() : ""
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : null

    if (!title) {
      return NextResponse.json({ error: "Missing required field: title" }, { status: 400 })
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        title,
        instructions,
      },
    })

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to update assignment:", error)
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    await prisma.assignment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete assignment:", error)
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 })
  }
}
