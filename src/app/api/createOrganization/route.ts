import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateRubricFromRules } from "@/lib/grading"
import { validateRubric } from "@/lib/rubric"
import { getUserIdFromRequest } from "@/lib/server-auth"

type CriterionInput = {
  name: string
  description?: string | null
  levels: Array<{
    label: string
    score: number
    description: string
  }>
}

function normalizeCriteria(value: unknown): CriterionInput[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((criterion): criterion is CriterionInput => Boolean(criterion && typeof criterion === "object"))
    .map((criterion) => ({
      name: typeof criterion.name === "string" ? criterion.name.trim() : "",
      description:
        typeof criterion.description === "string" && criterion.description.trim()
          ? criterion.description.trim()
          : undefined,
      levels: Array.isArray(criterion.levels)
        ? criterion.levels
            .filter((level): level is CriterionInput["levels"][number] => Boolean(level && typeof level === "object"))
            .map((level) => ({
              label: typeof level.label === "string" ? level.label.trim() : "",
              score: typeof level.score === "number" ? level.score : Number(level.score),
              description: typeof level.description === "string" ? level.description.trim() : "",
            }))
        : [],
    }))
}

function normalizeRules(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return Array.from(
    new Set(
      value
        .filter((rule): rule is string => typeof rule === "string")
        .map((rule) => rule.trim())
        .filter(Boolean)
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    // Require authentication for creating organizations
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to create organizations" },
        { status: 401 }
      )
    }

    const body = await request.json()

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const description = typeof body.description === "string" ? body.description.trim() : null
    const criteriaInput = normalizeCriteria(body.criteria)
    const rules = normalizeRules(body.rules)
    const shouldAutoGenerate = body.autoGenerateRubric === true

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 })
    }

    let criteria = criteriaInput

    if (criteria.length === 0 && shouldAutoGenerate && rules.length > 0) {
      criteria = await generateRubricFromRules(rules)
    }

    const validation = validateRubric(criteria)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        gradingSystem: body.gradingSystem?.trim?.() || null,
        createdByUserId: userId,
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
          create: criteria.map((criterion) => ({
            title: criterion.name,
            description: criterion.description || criterion.name,
          })),
        },
      },
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
    })

    return NextResponse.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          description: organization.description,
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
