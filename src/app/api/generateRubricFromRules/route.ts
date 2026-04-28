import { NextRequest, NextResponse } from "next/server"
import { generateRubricFromRules } from "@/lib/grading"

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
    const body = await request.json()
    const rules = normalizeRules(body.rules)

    if (rules.length === 0) {
      return NextResponse.json({ error: "Missing required field: rules" }, { status: 400 })
    }

    const criteria = await generateRubricFromRules(rules)

    return NextResponse.json({ criteria })
  } catch (error) {
    console.error("Failed to generate rubric from rules:", error)
    return NextResponse.json({ error: "Failed to generate rubric from rules" }, { status: 500 })
  }
}
