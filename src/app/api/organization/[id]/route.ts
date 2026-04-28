import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        criteria: {
          include: {
            levels: {
              orderBy: { score: "desc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            submissions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        criteria: organization.criteria,
        assignments: organization.assignments.map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
          latestSubmissionStatus: assignment.submissions[0]?.status ?? "not_submitted",
          createdAt: assignment.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error("Failed to fetch organization detail:", error)
    return NextResponse.json({ error: "Failed to fetch organization detail" }, { status: 500 })
  }
}
