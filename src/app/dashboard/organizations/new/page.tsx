"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Sparkles, Upload } from "lucide-react"

export default function NewOrganizationPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [gradingSystem, setGradingSystem] = useState("")
  const [ruleInput, setRuleInput] = useState("")
  const [rules, setRules] = useState<string[]>([])
  const [useAI, setUseAI] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddRule = () => {
    if (ruleInput.trim()) {
      // Split by comma or newline and add multiple rules
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

  const handleGenerateAIRules = async () => {
    if (!name.trim() || !description.trim()) {
      alert("Please enter both organization name and description to generate AI rules")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationName: name,
          description: description,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate rules")
      }

      const data = await response.json()
      // Add AI-generated rules to existing rules, avoiding duplicates
      const newRules = data.rules.filter((r: string) => !rules.includes(r))
      setRules([...rules, ...newRules])
      setUseAI(false)
    } catch (error) {
      console.error("Error generating rules:", error)
      alert(`Failed to generate rules: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gradingSystem.trim() || rules.length === 0) return

    setIsSubmitting(true)
    // Mock submission
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
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
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Organization</h1>
          <p className="text-muted-foreground">Set up a new class or project with custom rules</p>
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
            <div className="space-y-2">
              <Label htmlFor="link">Organization Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com/syllabus"
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

            {/* AI Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Use AI to Generate Rules</p>
                  <p className="text-sm text-muted-foreground">
                    Let AI suggest common grading criteria
                  </p>
                </div>
              </div>
              <Switch checked={useAI} onCheckedChange={setUseAI} />
            </div>

            {useAI && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateAIRules}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>Generating rules...</>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Rules
                  </>
                )}
              </Button>
            )}

            {/* Manual Rule Input */}
            <div className="space-y-2">
              <Label htmlFor="rules">Add Rules Manually</Label>
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

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Rules File (Optional)</Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">
                    <span className="font-medium text-primary cursor-pointer">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs">TXT, PDF, or DOCX (max 10MB)</p>
                </div>
              </div>
            </div>

            {/* Rules List */}
            {rules.length > 0 && (
              <div className="space-y-2">
                <Label>Added Rules ({rules.length})</Label>
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
          <Link href="/dashboard" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={!name.trim() || !gradingSystem.trim() || rules.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </form>
    </div>
  )
}
