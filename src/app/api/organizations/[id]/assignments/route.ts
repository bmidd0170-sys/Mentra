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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
    const body = await request.json()

    const title = typeof body.title === "string" ? body.title.trim() : ""
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : null
    const selectedRules = normalizeRules(body.selectedRules)
    const customRules = normalizeRules(body.customRules)
    const allRuleTitles = Array.from(new Set([...selectedRules, ...customRules]))

    if (!title || allRuleTitles.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: title and at least one rule" },
        { status: 400 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { rules: true },
    })

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const ruleIds: string[] = []
    const existingRuleMap = new Map<string, string>(
      organization.rules.map((rule: { title: string; id: string }) => [rule.title.toLowerCase(), rule.id])
    )

    for (const ruleTitle of allRuleTitles) {
      const existingRuleId = existingRuleMap.get(ruleTitle.toLowerCase())
      if (existingRuleId) {
        ruleIds.push(existingRuleId)
        continue
      }

      const createdRule = await prisma.rule.create({
        data: {
          organizationId,
          title: ruleTitle,
          description: ruleTitle,
        },
      })

      ruleIds.push(createdRule.id)
      existingRuleMap.set(ruleTitle.toLowerCase(), createdRule.id)
    }

    const assignment = await prisma.assignment.create({
      data: {
        organizationId,
        title,
        instructions,
        rules: {
          create: ruleIds.map((ruleId) => ({ ruleId })),
        },
      },
      include: {
        organization: true,
        rules: {
          include: {
            rule: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          name: assignment.title,
          organizationId: assignment.organizationId,
          organizationName: assignment.organization.name,
          rules: assignment.rules.map((assignmentRule: { rule: { title: string } }) => assignmentRule.rule.title),
          status: "pending",
          updatedAt: assignment.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create assignment:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}
