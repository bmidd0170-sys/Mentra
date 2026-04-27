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
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X, Sparkles, Upload } from "lucide-react"
import { GradingTable, type GradeEntry } from "@/components/GradingTable"

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
  const [gradingRubric, setGradingRubric] = useState<GradeEntry[]>([])
  const [ruleInput, setRuleInput] = useState("")
  const [rules, setRules] = useState<string[]>([])
  const [useAI, setUseAI] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadedRulesFile, setUploadedRulesFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        throw new Error(await getErrorMessage(response, "Failed to generate rules"))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gradingSystem.trim() || rules.length === 0 || gradingRubric.length === 0) return

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddRule()
    }
  }

  const mergeRules = (incomingRules: string[]) => {
    if (incomingRules.length === 0) {
      return
    }

    setRules((prevRules) => {
      const nextRules = [...prevRules]

      for (const rule of incomingRules) {
        if (!nextRules.includes(rule)) {
          nextRules.push(rule)
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

    if (file.type === "text/plain") {
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
    <>
      <style>{`
        #description::-webkit-scrollbar {
          width: 8px;
        }
        
        #description::-webkit-scrollbar-track {
          background: transparent;
        }
        
        #description::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        
        #description::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
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
                className="h-40 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Descriptions over 500 characters are supported. AI rule generation will analyze the full text in chunks.
              </p>
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
                className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                      TXT files are auto-imported into rules. PDF and DOCX are accepted for attachment only.
                    </p>
                  )}
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
            disabled={!name.trim() || !gradingSystem.trim() || rules.length === 0 || gradingRubric.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </form>
      </div>
    </>
  )
}
