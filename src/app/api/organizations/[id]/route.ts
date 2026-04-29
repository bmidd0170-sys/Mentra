import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function normalizeRules(rules: unknown): string[] {
  if (!Array.isArray(rules)) return []

  return Array.from(
    new Set(
      rules
        .filter((rule): rule is string => typeof rule === "string")
        .map((rule) => rule.trim())
        .filter(Boolean)
    )
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        rules: true,
        assignments: {
          include: {
            rules: {
              include: {
                rule: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
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
        gradingSystem: organization.gradingSystem,
        rules: organization.rules.map((rule: { title: string }) => rule.title),
      },
      assignments: organization.assignments.map((assignment: {
        id: string
        title: string
        updatedAt: Date
        rules: Array<{ rule: { title: string } }>
      }) => ({
        id: assignment.id,
        name: assignment.title,
        organizationId: organization.id,
        organizationName: organization.name,
        rules: assignment.rules.map((assignmentRule: { rule: { title: string } }) => assignmentRule.rule.title),
        status: "pending",
        updatedAt: assignment.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Failed to fetch organization:", error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : null
    const gradingSystem = typeof body.gradingSystem === "string" ? body.gradingSystem.trim() : ""
    const rules = normalizeRules(body.rules)

    if (!name || !gradingSystem || rules.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, gradingSystem, rules" },
        { status: 400 }
      )
    }

    const organization = await prisma.$transaction(async (tx) => {
      const existing = await tx.organization.findUnique({
        where: { id },
        select: { id: true },
      })

      if (!existing) {
        return null
      }

      await tx.rule.deleteMany({ where: { organizationId: id } })

      return tx.organization.update({
        where: { id },
        data: {
          name,
          description,
          gradingSystem,
          rules: {
            create: rules.map((rule) => ({
              title: rule,
              description: rule,
            })),
          },
        },
        include: {
          rules: true,
        },
      })
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        gradingSystem: organization.gradingSystem,
        rules: organization.rules.map((rule: { title: string }) => rule.title),
        createdAt: organization.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to update organization:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    await prisma.organization.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
