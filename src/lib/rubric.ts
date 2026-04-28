export const RUBRIC_INVALID_MESSAGE =
  "Rubric is invalid. Each criterion must have at least 2 levels with descriptions."

export type RubricLevelInput = {
  label: string
  score: number
  description: string
}

export type RubricCriterionInput = {
  name: string
  description?: string | null
  levels: RubricLevelInput[]
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
}

export function validateRubric(criteria: RubricCriterionInput[]) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return {
      valid: false,
      error: RUBRIC_INVALID_MESSAGE,
    }
  }

  for (const criterion of criteria) {
    if (!criterion || typeof criterion.name !== "string" || !criterion.name.trim()) {
      return {
        valid: false,
        error: RUBRIC_INVALID_MESSAGE,
      }
    }

    if (!Array.isArray(criterion.levels) || criterion.levels.length < 2) {
      return {
        valid: false,
        error: RUBRIC_INVALID_MESSAGE,
      }
    }

    const seenDescriptions = new Set<string>()
  const seenLabels = new Set<string>()

    for (const level of criterion.levels) {
      if (!level || typeof level.label !== "string" || !level.label.trim()) {
        return {
          valid: false,
          error: RUBRIC_INVALID_MESSAGE,
        }
      }

      if (
        typeof level.description !== "string" ||
        !level.description.trim()
      ) {
        return {
          valid: false,
          error: RUBRIC_INVALID_MESSAGE,
        }
      }

      if (!isFiniteNumber(level.score)) {
        return {
          valid: false,
          error: RUBRIC_INVALID_MESSAGE,
        }
      }

      const normalizedDescription = normalizeText(level.description)
      if (seenDescriptions.has(normalizedDescription)) {
        return {
          valid: false,
          error: RUBRIC_INVALID_MESSAGE,
        }
      }

      const normalizedLabel = normalizeText(level.label)
      if (seenLabels.has(normalizedLabel)) {
        return {
          valid: false,
          error: RUBRIC_INVALID_MESSAGE,
        }
      }

      seenDescriptions.add(normalizedDescription)
      seenLabels.add(normalizedLabel)
    }
  }

  return {
    valid: true,
  }
}

export function assertValidRubric(criteria: RubricCriterionInput[]) {
  const validation = validateRubric(criteria)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
}
