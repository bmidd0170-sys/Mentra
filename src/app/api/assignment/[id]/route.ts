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
        organization: {
          include: {
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
        organization: {
          id: assignment.organization.id,
          name: assignment.organization.name,
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
