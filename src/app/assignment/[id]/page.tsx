"use client"

import { useEffect, useMemo, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type SubmissionResult = {
  id: string
  criterionName: string
  selectedLevelLabel: string
  selectedLevelScore: number
  reasoning: string
  improvementSuggestions: unknown
  confidence: number
}

type Submission = {
  id: string
  content: string
  aiScore: number | null
  status: string
  createdAt: string
  results: SubmissionResult[]
}

type AssignmentPayload = {
  id: string
  title: string
  instructions?: string | null
  organization: {
    id: string
    name: string
  }
  submissions: Submission[]
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value.filter((item): item is string => typeof item === "string")
}

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [assignment, setAssignment] = useState<AssignmentPayload | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latestSubmission = useMemo(() => assignment?.submissions?.[0], [assignment])

  const loadAssignment = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assignment/${id}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to load assignment")
      }

      const data = await response.json()
      setAssignment(data.assignment)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load assignment")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAssignment()
  }, [id])

  const submitAssignment = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/submitAssignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: id,
          content: content.trim(),
          autoGrade: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to submit assignment")
      }

      setContent("")
      await loadAssignment()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit assignment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="p-6 text-sm text-muted-foreground">Loading assignment...</main>
  }

  if (!assignment) {
    return <main className="p-6 text-sm text-destructive">{error || "Assignment not found"}</main>
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{assignment.title}</h1>
          <p className="text-sm text-muted-foreground">{assignment.organization.name}</p>
        </div>
        <Link href={`/organization/${assignment.organization.id}`}>
          <Button variant="outline">Back to Organization</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Work</CardTitle>
          <CardDescription>Text submissions only for MVP.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitAssignment}>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste your submission text here..."
              rows={8}
              required
            />
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? "Submitting and grading..." : "Submit and Grade"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {latestSubmission && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Feedback</CardTitle>
            <CardDescription>
              Status: {latestSubmission.status} | AI Score: {latestSubmission.aiScore ?? "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestSubmission.results.length === 0 && (
              <p className="text-sm text-muted-foreground">No per-criterion results yet.</p>
            )}
            {latestSubmission.results.map((result) => (
              <div key={result.id} className="rounded border p-3">
                <p className="font-medium">{result.criterionName}</p>
                <p className="text-sm text-muted-foreground">
                  Level: {result.selectedLevelLabel} ({result.selectedLevelScore}) | Confidence: {result.confidence.toFixed(2)}
                </p>
                <p className="mt-2 text-sm">{result.reasoning}</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {toStringArray(result.improvementSuggestions).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
