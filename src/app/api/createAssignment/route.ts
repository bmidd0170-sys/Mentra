import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : ""
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : null

    if (!organizationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const assignment = await prisma.assignment.create({
      data: {
        organizationId,
        title,
        instructions,
      },
    })

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          organizationId: assignment.organizationId,
          title: assignment.title,
          instructions: assignment.instructions,
          createdAt: assignment.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create assignment:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}
