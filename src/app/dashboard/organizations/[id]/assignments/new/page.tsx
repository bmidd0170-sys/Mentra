"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X } from "lucide-react"

interface OrganizationDetail {
  id: string
  name: string
  rules: string[]
}

export default function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [organization, setOrganization] = useState<OrganizationDetail | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [customRuleInput, setCustomRuleInput] = useState("")
  const [customRules, setCustomRules] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadOrganization = async () => {
      setIsLoadingOrg(true)
      setLoadError(null)

      try {
        const response = await fetch(`/api/organizations/${id}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to load organization")
        }

        const data = await response.json()
        if (active) {
          setOrganization(data.organization)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Failed to load organization")
          setOrganization(null)
        }
      } finally {
        if (active) {
          setIsLoadingOrg(false)
        }
      }
    }

    void loadOrganization()

    return () => {
      active = false
    }
  }, [id])

  if (isLoadingOrg) {
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

  const handleToggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    )
  }

  const handleSelectAllRules = () => {
    if (selectedRules.length === organization.rules.length) {
      setSelectedRules([])
    } else {
      setSelectedRules([...organization.rules])
    }
  }

  const handleAddCustomRule = () => {
    if (customRuleInput.trim() && !customRules.includes(customRuleInput.trim())) {
      setCustomRules([...customRules, customRuleInput.trim()])
      setCustomRuleInput("")
    }
  }

  const handleRemoveCustomRule = (rule: string) => {
    setCustomRules(customRules.filter((r) => r !== rule))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || (selectedRules.length === 0 && customRules.length === 0)) return

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/organizations/${id}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: name,
          selectedRules,
          customRules,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create assignment")
      }

      router.push(`/dashboard/organizations/${id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create assignment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCustomRule()
    }
  }

  const allRules = [...selectedRules, ...customRules]

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
          <h1 className="text-2xl font-bold text-foreground">Create Assignment</h1>
          <p className="text-muted-foreground">{organization.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Give your assignment a name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Assignment Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Binary Search Tree Implementation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Rules</CardTitle>
            <CardDescription>
              Choose which organization rules apply to this assignment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <Checkbox
                id="select-all"
                checked={selectedRules.length === organization.rules.length}
                onCheckedChange={handleSelectAllRules}
              />
              <Label htmlFor="select-all" className="cursor-pointer font-medium">
                Select All Rules
              </Label>
            </div>

            {/* Organization Rules */}
            <div className="space-y-2">
              {organization.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    id={`rule-${index}`}
                    checked={selectedRules.includes(rule)}
                    onCheckedChange={() => handleToggleRule(rule)}
                  />
                  <Label htmlFor={`rule-${index}`} className="flex-1 cursor-pointer">
                    {rule}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Rules</CardTitle>
            <CardDescription>Add additional rules specific to this assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom rule..."
                value={customRuleInput}
                onChange={(e) => setCustomRuleInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <Button type="button" onClick={handleAddCustomRule} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customRules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customRules.map((rule, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 pl-3 pr-1"
                  >
                    {rule}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomRule(rule)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {allRules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rules Summary</CardTitle>
              <CardDescription>{allRules.length} rules selected for this assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allRules.map((rule, index) => (
                  <Badge key={index} variant="outline">
                    {rule}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <div className="flex gap-3">
          <Link href={`/dashboard/organizations/${id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={!name.trim() || allRules.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </form>
    </div>
  )
}
