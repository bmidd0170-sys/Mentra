"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X } from "lucide-react"
import { GradingTable, type GradeEntry } from "@/components/GradingTable"

type OrganizationEditData = {
  id: string
  name: string
  description?: string | null
  gradingSystem?: string | null
  gradingRubric?: GradeEntry[]
  rules: string[]
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (data && typeof data.error === "string") {
      return data.error
    }
  } catch {
    // Fall back to plain text below.
  }

  const text = await response.text()
  return text || fallback
}

export default function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [organization, setOrganization] = useState<OrganizationEditData | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [gradingSystem, setGradingSystem] = useState("")
  const [gradingRubric, setGradingRubric] = useState<GradeEntry[]>([])
  const [ruleInput, setRuleInput] = useState("")
  const [rules, setRules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadOrganization = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const response = await fetch(`/api/organizations/${id}`)

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Failed to load organization"))
        }

        const data = await response.json()

        if (active) {
          const loadedOrganization: OrganizationEditData = data.organization
          setOrganization(loadedOrganization)
          setName(loadedOrganization.name || "")
          setDescription(loadedOrganization.description || "")
          setGradingSystem(loadedOrganization.gradingSystem || "")
          setGradingRubric(loadedOrganization.gradingRubric || [])
          setRules(loadedOrganization.rules || [])
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Failed to load organization")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadOrganization()

    return () => {
      active = false
    }
  }, [id])

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading organization...</div>
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Organization not found</h1>
        <p className="mt-2 text-muted-foreground">
          {loadError || "The organization you&apos;re looking for doesn&apos;t exist."}
        </p>
        <Link href="/dashboard" className="mt-4">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const handleAddRule = () => {
    if (ruleInput.trim()) {
      const newRules = ruleInput
        .split(/[,\n]/)
        .map((r) => r.trim())
        .filter((r) => r && !rules.includes(r))
      setRules([...rules, ...newRules])
      setRuleInput("")
    }
  }

  const handleRemoveRule = (rule: string) => {
    setRules(rules.filter((r) => r !== rule))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gradingSystem.trim() || rules.length === 0 || gradingRubric.length === 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          gradingSystem,
          rules,
          gradingRubric,
        }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to update organization"))
      }

      router.push(`/dashboard/organizations/${id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update organization")
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddRule()
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/organizations/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Organization</h1>
          <p className="text-muted-foreground">Update organization details and rules</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Basic information about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                placeholder="e.g., CS 301 - Data Structures"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading Rules</CardTitle>
            <CardDescription>
              Define the criteria that will be used to evaluate assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gradingSystem">Grading System *</Label>
              <Input
                id="gradingSystem"
                placeholder="e.g., Letter Grade (A-F), Percentage, GPA (4.0), Pass/Fail"
                value={gradingSystem}
                onChange={(e) => setGradingSystem(e.target.value)}
                required
              />
            </div>

            {/* Grading Table */}
            <GradingTable value={gradingRubric} onChange={setGradingRubric} />

            {/* Manual Rule Input */}
            <div className="space-y-2">
              <Label htmlFor="rules">Add Rules</Label>
              <div className="flex gap-2">
                <Textarea
                  id="rules"
                  placeholder="Enter rules (separate by comma or new line)"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={2}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddRule} variant="outline" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Rules List */}
            {rules.length > 0 && (
              <div className="space-y-2">
                <Label>Current Rules ({rules.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {rules.map((rule, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 py-1.5 pl-3 pr-1"
                    >
                      {rule}
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/dashboard/organizations/${id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={!name.trim() || !gradingSystem.trim() || rules.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
