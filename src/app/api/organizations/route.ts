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

export async function GET(request: NextRequest) {
  try {
    const includeAssignments = request.nextUrl.searchParams.get("includeAssignments") === "true"

    if (includeAssignments) {
      const organizations = await prisma.organization.findMany({
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
          },
        },
        orderBy: { createdAt: "desc" },
      })

      return NextResponse.json({
        organizations: organizations.map((org: {
          id: string
          name: string
          description: string | null
          gradingSystem: string | null
          createdAt: Date
          rules: Array<{ title: string }>
          assignments: Array<{
            id: string
            title: string
            updatedAt: Date
            rules: Array<{ rule: { title: string } }>
          }>
        }) => ({
          id: org.id,
          name: org.name,
          description: org.description,
          gradingSystem: org.gradingSystem,
          rules: org.rules.map((rule: { title: string }) => rule.title),
          assignmentCount: org.assignments.length,
          createdAt: org.createdAt.toISOString(),
          assignments: org.assignments.map((assignment: {
            id: string
            title: string
            updatedAt: Date
            rules: Array<{ rule: { title: string } }>
          }) => ({
            id: assignment.id,
            name: assignment.title,
            organizationId: org.id,
            organizationName: org.name,
            rules: assignment.rules.map((assignmentRule: { rule: { title: string } }) => assignmentRule.rule.title),
            status: "pending",
            updatedAt: assignment.updatedAt.toISOString(),
          })),
        })),
      })
    }

    const organizations = await prisma.organization.findMany({
      include: {
        rules: true,
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      organizations: organizations.map((org: {
        id: string
        name: string
        description: string | null
        gradingSystem: string | null
        createdAt: Date
        rules: Array<{ title: string }>
        _count: { assignments: number }
      }) => ({
        id: org.id,
        name: org.name,
        description: org.description,
        gradingSystem: org.gradingSystem,
        rules: org.rules.map((rule: { title: string }) => rule.title),
        assignmentCount: org._count.assignments,
        createdAt: org.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Failed to fetch organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : null
    const gradingSystem = typeof body.gradingSystem === "string" ? body.gradingSystem.trim() : ""
    const rules = normalizeRules(body.rules)
    const gradingRubric = Array.isArray(body.gradingRubric) ? body.gradingRubric : []

    if (!name || !gradingSystem || rules.length === 0 || gradingRubric.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, gradingSystem, rules, gradingRubric" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        gradingSystem,
        gradingRubric: JSON.stringify(gradingRubric),
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

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          description: organization.description,
          gradingSystem: organization.gradingSystem,
          gradingRubric: JSON.parse(organization.gradingRubric || "[]"),
          rules: organization.rules.map((rule: { title: string }) => rule.title),
          createdAt: organization.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create organization:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
