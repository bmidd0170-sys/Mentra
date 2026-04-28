"use client"

import { useEffect, useMemo, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Level = {
  id: string
  label: string
  score: number
  description: string
}

type Criterion = {
  id: string
  name: string
  description?: string | null
  levels: Level[]
}

type Assignment = {
  id: string
  title: string
  instructions?: string | null
  latestSubmissionStatus: string
}

type OrganizationPayload = {
  id: string
  name: string
  description?: string | null
  criteria: Criterion[]
  assignments: Assignment[]
}

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [organization, setOrganization] = useState<OrganizationPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const response = await fetch(`/api/organization/${id}`)
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error || "Failed to load organization")
        }

        const data = await response.json()
        if (active) {
          setOrganization(data.organization)
          setError(null)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load organization")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [id])

  const canCreateAssignment = useMemo(() => title.trim().length > 0, [title])

  const handleCreateAssignment = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/createAssignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: id,
          title: title.trim(),
          instructions: instructions.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Failed to create assignment")
      }

      const data = await response.json()
      window.location.href = `/assignment/${data.assignment.id}`
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create assignment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="p-6 text-sm text-muted-foreground">Loading organization...</main>
  }

  if (!organization) {
    return <main className="p-6 text-sm text-destructive">{error || "Organization not found"}</main>
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">{organization.description || "No description"}</p>
        </div>
        <Link href="/organizations">
          <Button variant="outline">Back to Organizations</Button>
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Rubric Criteria</CardTitle>
          <CardDescription>Dynamic rubric used for AI grading</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organization.criteria.map((criterion) => (
            <div key={criterion.id} className="rounded border p-4">
              <h3 className="font-medium">{criterion.name}</h3>
              {criterion.description && (
                <p className="text-sm text-muted-foreground">{criterion.description}</p>
              )}
              <ul className="mt-3 space-y-2 text-sm">
                {criterion.levels.map((level) => (
                  <li key={level.id} className="rounded bg-muted/40 p-2">
                    <strong>{level.label}</strong> ({level.score}): {level.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleCreateAssignment}>
            <Input
              placeholder="Assignment title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <Textarea
              placeholder="Instructions (optional)"
              rows={3}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
            <Button type="submit" disabled={!canCreateAssignment || submitting}>
              {submitting ? "Creating..." : "Create Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {organization.assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          )}
          {organization.assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{assignment.title}</p>
                <p className="text-xs text-muted-foreground">Status: {assignment.latestSubmissionStatus}</p>
              </div>
              <Link href={`/assignment/${assignment.id}`}>
                <Button size="sm" variant="outline">
                  Open
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
