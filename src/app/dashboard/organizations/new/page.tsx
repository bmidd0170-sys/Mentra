"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, X, Sparkles, Upload } from "lucide-react"

type RuleDraft = {
  title: string
  description: string
  weight: number
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (data && typeof data.error === "string") {
      return data.error
    }
  } catch {
    // Ignore JSON parsing errors and fall back to response text.
  }

  const text = await response.text()
  return text || fallback
}

export default function NewOrganizationPage() {
  const RULE_FILE_INPUT_ID = "organization-rules-file-upload"
  const MAX_RULE_FILE_BYTES = 10 * 1024 * 1024
  const ALLOWED_RULE_EXTENSIONS = ["txt", "pdf", "docx"]

  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [gradingSystem, setGradingSystem] = useState("")
  const [ruleTitleInput, setRuleTitleInput] = useState("")
  const [ruleDescriptionInput, setRuleDescriptionInput] = useState("")
  const [ruleWeightInput, setRuleWeightInput] = useState("1")
  const [rules, setRules] = useState<RuleDraft[]>([])
  const [useAI, setUseAI] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadedRulesFile, setUploadedRulesFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const parseWeight = (value: string) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1
    }

    return Math.round(parsed)
  }

  const handleAddRule = () => {
    const title = ruleTitleInput.trim()
    if (!title) return

    const descriptionValue = ruleDescriptionInput.trim() || title
    const weight = parseWeight(ruleWeightInput)
    const titleKey = title.toLowerCase()

    if (rules.some((rule) => rule.title.toLowerCase() === titleKey)) {
      setSubmitError("That rule title already exists.")
      return
    }

    setRules([...rules, { title, description: descriptionValue, weight }])
    setRuleTitleInput("")
    setRuleDescriptionInput("")
    setRuleWeightInput("1")
    setSubmitError(null)
  }

  const handleRemoveRule = (ruleTitle: string) => {
    setRules(rules.filter((rule) => rule.title !== ruleTitle))
  }

  const handleRuleChange = (ruleTitle: string, field: "title" | "description" | "weight", value: string) => {
    setRules((prevRules) => {
      const currentRule = prevRules.find((rule) => rule.title === ruleTitle)
      if (!currentRule) {
        return prevRules
      }

      const nextRules = prevRules.map((rule) => {
        if (rule.title !== ruleTitle) {
          return rule
        }

        if (field === "weight") {
          return {
            ...rule,
            weight: parseWeight(value),
          }
        }

        const nextText = value.trim()
        if (field === "title") {
          return {
            ...rule,
            title: nextText,
            description: rule.description || nextText,
          }
        }

        return {
          ...rule,
          description: nextText,
        }
      })

      const duplicateTitles = new Set<string>()
      for (const rule of nextRules) {
        const key = rule.title.trim().toLowerCase()
        if (!key) {
          setSubmitError("Rule title cannot be empty.")
          return prevRules
        }

        if (duplicateTitles.has(key)) {
          setSubmitError("Rule titles must be unique.")
          return prevRules
        }

        duplicateTitles.add(key)
      }

      setSubmitError(null)
      return nextRules
    })
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
        throw new Error(await getErrorMessage(response, "Failed to generate rules"))
      }

      const data = await response.json()
      // Add AI-generated rules to existing rules, avoiding duplicates
      mergeRules(data.rules)
      setUseAI(false)
    } catch (error) {
      console.error("Error generating rules:", error)
      alert(`Failed to generate rules: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gradingSystem.trim() || (rules.length === 0 && !uploadedRulesFile)) return

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        name,
        description,
        gradingSystem,
        rules: rules.map((rule) => ({
          title: rule.title,
          description: rule.description,
          weight: rule.weight,
        })),
      }

      let response: Response

      if (uploadedRulesFile) {
        const formData = new FormData()
        formData.append("name", name)
        if (description.trim()) formData.append("description", description)
        formData.append("gradingSystem", gradingSystem)
        formData.append("rules", JSON.stringify(payload.rules))
        formData.append("documentFile", uploadedRulesFile)

        response = await fetch("/api/organizations", {
          method: "POST",
          body: formData,
        })
      } else {
        response = await fetch("/api/organizations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create organization")
      }

      const data = await response.json()
      router.push(`/dashboard/organizations/${data.organization.id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  const mergeRules = (incomingRules: string[]) => {
    if (incomingRules.length === 0) {
      return
    }

    setRules((prevRules) => {
      const nextRules = [...prevRules]
      const existingTitles = new Set(prevRules.map((rule) => rule.title.toLowerCase()))

      for (const rule of incomingRules) {
        const normalizedTitle = rule.trim()
        const key = normalizedTitle.toLowerCase()
        if (normalizedTitle && !existingTitles.has(key)) {
          nextRules.push({
            title: normalizedTitle,
            description: normalizedTitle,
            weight: 1,
          })
          existingTitles.add(key)
        }
      }

      return nextRules
    })
  }

  const validateRulesFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || ""

    if (!ALLOWED_RULE_EXTENSIONS.includes(extension)) {
      setSubmitError("Unsupported file type. Please upload a TXT, PDF, or DOCX file.")
      return false
    }

    if (file.size > MAX_RULE_FILE_BYTES) {
      setSubmitError("File is too large. Maximum allowed size is 10MB.")
      return false
    }

    return true
  }

  const handleRulesFile = async (file: File) => {
    if (!validateRulesFile(file)) {
      return
    }

    setUploadedRulesFile(file)
    setSubmitError(null)

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text()
      const parsedRules = text
        .split(/[\n,]/)
        .map((line) => line.trim())
        .filter(Boolean)

      mergeRules(parsedRules)
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    await handleRulesFile(file)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) {
      return
    }

    await handleRulesFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isDragOver) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const openRulesFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openRulesFilePicker()
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
              <p className="text-xs text-muted-foreground">
                Descriptions over 500 characters are supported. AI rule generation will analyze the full text in chunks.
              </p>
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
              <Label htmlFor="ruleTitle">Add Rule</Label>
              <div className="grid gap-2 md:grid-cols-12">
                <Input
                  id="ruleTitle"
                  placeholder="Rule title"
                  value={ruleTitleInput}
                  onChange={(e) => setRuleTitleInput(e.target.value)}
                  className="md:col-span-4"
                />
                <Input
                  id="ruleDescription"
                  placeholder="Rule description"
                  value={ruleDescriptionInput}
                  onChange={(e) => setRuleDescriptionInput(e.target.value)}
                  className="md:col-span-5"
                />
                <Input
                  id="ruleWeight"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Weight"
                  value={ruleWeightInput}
                  onChange={(e) => setRuleWeightInput(e.target.value)}
                  className="md:col-span-2"
                />
                <Button type="button" onClick={handleAddRule} variant="outline" className="md:col-span-1">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Rule fields map directly to the schema: <span className="font-medium">title</span>, <span className="font-medium">description</span>, and <span className="font-medium">weight</span>.
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Rules File (Optional)</Label>
              <Input
                id={RULE_FILE_INPUT_ID}
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  void handleFileInputChange(e)
                }}
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload organization rules file"
                onClick={openRulesFilePicker}
                onKeyDown={handleDropzoneKeyDown}
                onDrop={(e) => {
                  void handleDrop(e)
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs">TXT, PDF, or DOCX (max 10MB)</p>
                  {uploadedRulesFile && (
                    <p className="text-xs text-foreground">
                      Selected: {uploadedRulesFile.name} ({(uploadedRulesFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {uploadedRulesFile?.type !== "text/plain" && uploadedRulesFile && (
                    <p className="text-xs text-muted-foreground">
                        The uploaded document will be submitted with the organization so AI can organize the rules into categories.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rules Table */}
            {rules.length > 0 && (
              <div className="space-y-2">
                <Label>Rubric Builder ({rules.length} rules)</Label>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Title</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Description</th>
                        <th className="px-3 py-2 text-left font-medium text-foreground">Weight</th>
                        <th className="px-3 py-2 text-right font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.title} className="border-t border-border align-top">
                          <td className="px-3 py-2">
                            <Input
                              value={rule.title}
                              onChange={(e) => handleRuleChange(rule.title, "title", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={rule.description}
                              onChange={(e) => handleRuleChange(rule.title, "description", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              value={rule.weight}
                              onChange={(e) => handleRuleChange(rule.title, "weight", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRule(rule.title)}
                              aria-label={`Remove ${rule.title}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1"
            disabled={!name.trim() || !gradingSystem.trim() || (rules.length === 0 && !uploadedRulesFile) || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </form>
    </div>
  )
}
