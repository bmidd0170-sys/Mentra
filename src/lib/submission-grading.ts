import { prisma } from "@/lib/prisma"
import { gradeSubmissionWithRubric } from "@/lib/grading"
import { validateRubric } from "@/lib/rubric"

export async function gradeAndPersistSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
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
        },
      },
    },
  })

  if (!submission) {
    throw new Error("Submission not found")
  }

  const criteria = submission.assignment.organization.criteria.map((criterion) => ({
    name: criterion.name,
    description: criterion.description,
    levels: criterion.levels.map((level) => ({
      label: level.label,
      score: level.score,
      description: level.description,
    })),
  }))

  const rubricValidation = validateRubric(criteria)
  if (!rubricValidation.valid) {
    throw new Error(rubricValidation.error)
  }

  const aiResults = await gradeSubmissionWithRubric({
    submissionText: submission.content,
    criteria,
  })

  let totalScore = 0
  let scoredCount = 0

  for (const result of aiResults) {
    const criterionRecord = submission.assignment.organization.criteria.find(
      (criterion) => criterion.name === result.criterionName
    )

    if (!criterionRecord) {
      continue
    }

    const selectedLevel = criterionRecord.levels.find(
      (level) => level.label.toLowerCase() === result.level.toLowerCase()
    )

    if (!selectedLevel) {
      continue
    }

    totalScore += selectedLevel.score
    scoredCount += 1

    await prisma.result.upsert({
      where: {
        submissionId_criterionId: {
          submissionId,
          criterionId: criterionRecord.id,
        },
      },
      create: {
        submissionId,
        criterionId: criterionRecord.id,
        selectedLevelId: selectedLevel.id,
        reasoning: result.reason,
        improvementSuggestions: result.improvements,
        confidence: result.confidence,
      },
      update: {
        selectedLevelId: selectedLevel.id,
        reasoning: result.reason,
        improvementSuggestions: result.improvements,
        confidence: result.confidence,
      },
    })
  }

  const averageScore = scoredCount > 0 ? totalScore / scoredCount : null

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      aiScore: averageScore,
      status: "reviewed",
    },
  })

  const storedResults = await prisma.result.findMany({
    where: { submissionId },
    include: {
      criterion: true,
      selectedLevel: true,
    },
    orderBy: {
      criterion: {
        createdAt: "asc",
      },
    },
  })

  return {
    submissionId,
    aiScore: averageScore,
    results: storedResults.map((item) => ({
      criterionId: item.criterionId,
      criterionName: item.criterion.name,
      selectedLevelId: item.selectedLevelId,
      selectedLevelLabel: item.selectedLevel.label,
      selectedLevelScore: item.selectedLevel.score,
      reasoning: item.reasoning,
      improvementSuggestions: item.improvementSuggestions,
      confidence: item.confidence,
    })),
  }
}
