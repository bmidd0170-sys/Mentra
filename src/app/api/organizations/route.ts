import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateRubricFromRules } from "@/lib/grading"
import { validateRubric } from "@/lib/rubric"
import { extractDocumentText, extractRulesFromDocument } from "@/lib/document-rules"

type NormalizedRule = {
  title: string
  description: string
  weight: number
}

function normalizeRules(rules: unknown): NormalizedRule[] {
  if (!Array.isArray(rules)) return []

  const normalizedRules: NormalizedRule[] = []
  const seenTitles = new Set<string>()

  for (const rule of rules) {
    let title = ""
    let description = ""
    let weight = 1

    if (typeof rule === "string") {
      title = rule.trim()
      description = title
    } else if (rule && typeof rule === "object") {
      const maybeRule = rule as {
        title?: unknown
        description?: unknown
        weight?: unknown
      }

      title = typeof maybeRule.title === "string" ? maybeRule.title.trim() : ""
      description = typeof maybeRule.description === "string" ? maybeRule.description.trim() : ""

      if (typeof maybeRule.weight === "number" && Number.isFinite(maybeRule.weight) && maybeRule.weight > 0) {
        weight = Math.round(maybeRule.weight)
      }
    }

    if (!title) {
      continue
    }

    const key = title.toLowerCase()
    if (seenTitles.has(key)) {
      continue
    }

    seenTitles.add(key)
    normalizedRules.push({
      title,
      description: description || title,
      weight,
    })
  }

  return normalizedRules
}

function isDatabaseUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : ""

  if (message.includes("Can't reach database server")) {
    return true
  }

  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
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
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json({ organizations: [] })
    }

    console.error("Failed to fetch organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let name = ""
    let description: string | null = null
    let gradingSystem = ""
    let rules = [] as NormalizedRule[]
    let documentText = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const nameField = formData.get("name")
      const descriptionField = formData.get("description")
      const gradingSystemField = formData.get("gradingSystem")
      const rulesField = formData.get("rules")

      name = typeof nameField === "string" ? nameField.trim() : ""
      description = typeof descriptionField === "string" ? descriptionField.trim() : null
      gradingSystem = typeof gradingSystemField === "string" ? gradingSystemField.trim() : ""

      if (typeof rulesField === "string") {
        try {
          rules = normalizeRules(JSON.parse(rulesField))
        } catch {
          rules = []
        }
      }

      const documentFileField = formData.get("documentFile")
      if (documentFileField instanceof File) {
        documentText = (await extractDocumentText(documentFileField)).trim()
      }
    } else {
      const body = await request.json()
      name = typeof body.name === "string" ? body.name.trim() : ""
      description = typeof body.description === "string" ? body.description.trim() : null
      gradingSystem = typeof body.gradingSystem === "string" ? body.gradingSystem.trim() : ""
      rules = normalizeRules(body.rules)
    }

    const documentRules =
      documentText.length > 0
        ? await extractRulesFromDocument({
            documentText,
            organizationName: name,
            description,
          })
        : []

    const mergedRules = normalizeRules([
      ...rules,
      ...documentRules,
    ])

    const criteria = mergedRules.length > 0
      ? await generateRubricFromRules(mergedRules.map((rule) => rule.title))
      : []

    if (!name || !gradingSystem || mergedRules.length === 0 || criteria.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: name, gradingSystem, and at least one rule" },
        { status: 400 }
      )
    }

    const validation = validateRubric(criteria)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        gradingSystem,
        criteria: {
          create: criteria.map((criterion) => ({
            name: criterion.name,
            description: criterion.description,
            levels: {
              create: criterion.levels.map((level) => ({
                label: level.label,
                score: level.score,
                description: level.description,
              })),
            },
          })),
        },
        rules: {
          create: mergedRules.map((rule) => ({
            title: rule.title,
            description: rule.description,
            weight: rule.weight,
          })),
        },
      },
      include: {
        rules: true,
        criteria: {
          include: {
            levels: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          description: organization.description,
          gradingSystem: organization.gradingSystem,
          rules: organization.rules.map((rule: { title: string }) => rule.title),
          criteria: organization.criteria,
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
