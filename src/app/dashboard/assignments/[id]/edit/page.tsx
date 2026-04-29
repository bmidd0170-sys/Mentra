"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/firebase-auth-provider"
import { fetchWithAuth } from "@/lib/api-client"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (data && typeof data.error === "string") {
      return data.error
    }
  } catch {
    // Fall back to the raw response text.
  }

  const text = await response.text()
  return text || fallback
}

type AssignmentDetails = {
  id: string
  title: string
  instructions?: string | null
  rules?: string[]
  organization: {
    id: string
    name: string
  }
  organizationRules?: string[]
}

export default function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null)
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadAssignment = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchWithAuth(user, `/api/assignment/${id}`)
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Failed to load assignment"))
        }

        const data = await response.json()
        const loadedAssignment = data.assignment as AssignmentDetails

        if (!active) return

        setAssignment(loadedAssignment)
        setTitle(loadedAssignment.title)
        setInstructions(loadedAssignment.instructions || "")
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load assignment")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadAssignment()

    return () => {
      active = false
    }
  }, [id, user])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetchWithAuth(user, `/api/assignment/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          instructions,
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to update assignment"))
      }

      router.push(`/dashboard/assignments/${id}`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update assignment")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading assignment...</div>
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Assignment not found</h1>
        <p className="mt-2 text-muted-foreground">The assignment you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="mt-4">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const appliedRules =
    (assignment.rules && assignment.rules.length > 0
      ? assignment.rules
      : assignment.organizationRules && assignment.organizationRules.length > 0
        ? assignment.organizationRules
        : [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/assignments/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Assignment</h1>
          <p className="text-muted-foreground">{assignment.organization.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Update the assignment name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter assignment name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Assignment Description</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Describe the assignment goals, expected deliverables, and constraints."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applied Rules</CardTitle>
            <CardDescription>
              {assignment.rules && assignment.rules.length > 0
                ? "Rules linked directly to this assignment"
                : "No assignment-specific rules were saved, so the organization rules are shown here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {appliedRules.map((rule, index) => (
                <span
                  key={index}
                  className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
                >
                  {rule}
                </span>
              ))}
              {appliedRules.length === 0 && (
                <p className="text-sm text-muted-foreground">No rules are currently attached to this assignment.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Link href={`/dashboard/assignments/${id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={!title.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
