"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import LoadingOverlay from "@/components/ui/loading-overlay"

type LevelDraft = {
  label: string
  score: string
  description: string
}

type CriterionDraft = {
  name: string
  description: string
  levels: LevelDraft[]
}

function defaultLevels(): LevelDraft[] {
  return [
    { label: "Excellent", score: "4", description: "Exceeds expectations" },
    { label: "Developing", score: "2", description: "Meets some expectations" },
  ]
}

export default function AddOrganizationPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [ruleSeed, setRuleSeed] = useState("")
  const [criteria, setCriteria] = useState<CriterionDraft[]>([
    {
      name: "",
      description: "",
      levels: defaultLevels(),
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const overlayTimerRef = useRef<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      { name: "", description: "", levels: defaultLevels() },
    ])
  }

  const updateCriterion = (index: number, field: "name" | "description", value: string) => {
    setCriteria((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  const addLevel = (criterionIndex: number) => {
    setCriteria((prev) =>
      prev.map((criterion, itemIndex) =>
        itemIndex === criterionIndex
          ? {
              ...criterion,
              levels: [
                ...criterion.levels,
                { label: "", score: "", description: "" },
              ],
            }
          : criterion
      )
    )
  }

  const updateLevel = (
    criterionIndex: number,
    levelIndex: number,
    field: "label" | "score" | "description",
    value: string
  ) => {
    setCriteria((prev) =>
      prev.map((criterion, itemIndex) => {
        if (itemIndex !== criterionIndex) {
          return criterion
        }

        return {
          ...criterion,
          levels: criterion.levels.map((level, currentLevelIndex) =>
            currentLevelIndex === levelIndex ? { ...level, [field]: value } : level
          ),
        }
      })
    )
  }

  const generateFromRules = async () => {
    const rules = ruleSeed
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (rules.length === 0) {
      setError("Enter at least one rule before generating a rubric.")
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch("/api/generateRubricFromRules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error || "Failed to generate rubric from rules")
        return
      }

      const data = await response.json()
      setCriteria(
        (data.criteria || []).map((criterion: {
          name: string
          description?: string
          levels: Array<{ label: string; score: number; description: string }>
        }) => ({
          name: criterion.name,
          description: criterion.description || "",
          levels: criterion.levels.map((level) => ({
            label: level.label,
            score: String(level.score),
            description: level.description,
          })),
        }))
      )
    } catch {
      setError("Failed to generate rubric from rules")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setShowOverlay(false)
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current)
      overlayTimerRef.current = null
    }
    overlayTimerRef.current = window.setTimeout(() => setShowOverlay(true), 250)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        criteria: criteria.map((criterion) => ({
          name: criterion.name.trim(),
          description: criterion.description.trim(),
          levels: criterion.levels.map((level) => ({
            label: level.label.trim(),
            score: Number(level.score),
            description: level.description.trim(),
          })),
        })),
      }

      const response = await fetch("/api/createOrganization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to create organization")
      }

      const data = await response.json()
      router.push(`/organization/${data.organization.id}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create organization")
    } finally {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current)
        overlayTimerRef.current = null
      }
      setShowOverlay(false)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6 py-6">
      {(showOverlay || isGenerating) && (
        <LoadingOverlay message={isGenerating ? "Generating rubric..." : "Creating organization..."} />
      )}
      <div>
        <h1 className="text-2xl font-semibold">Create Organization</h1>
        <p className="text-sm text-muted-foreground">Build a flexible rubric for AI grading.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Generate Rubric (Optional)</CardTitle>
            <CardDescription>Paste basic rules and let AI expand them into criteria and levels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Example: Clarity, Grammar, Evidence"
              rows={3}
              value={ruleSeed}
              onChange={(e) => setRuleSeed(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={generateFromRules} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate Rubric"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              AI generation may take some time, especially for longer rule lists.
            </p>
          </CardContent>
        </Card>

        {criteria.map((criterion, criterionIndex) => (
          <Card key={criterionIndex}>
            <CardHeader>
              <CardTitle>Criterion {criterionIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Criterion name"
                value={criterion.name}
                onChange={(e) => updateCriterion(criterionIndex, "name", e.target.value)}
              />
              <Textarea
                placeholder="Criterion description (optional)"
                value={criterion.description}
                onChange={(e) => updateCriterion(criterionIndex, "description", e.target.value)}
                rows={2}
              />

              <div className="space-y-3">
                {criterion.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className="grid gap-2 rounded border p-3 md:grid-cols-3">
                    <Input
                      placeholder="Level label"
                      value={level.label}
                      onChange={(e) =>
                        updateLevel(criterionIndex, levelIndex, "label", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Score"
                      type="number"
                      step="0.1"
                      value={level.score}
                      onChange={(e) =>
                        updateLevel(criterionIndex, levelIndex, "score", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={level.description}
                      onChange={(e) =>
                        updateLevel(criterionIndex, levelIndex, "description", e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>

              <Button type="button" variant="secondary" onClick={() => addLevel(criterionIndex)}>
                Add Level
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={addCriterion}>
            Add Criterion
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        </fieldset>
      </form>
    </main>
  )
}
