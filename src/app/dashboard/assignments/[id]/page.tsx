"use client"

import { useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { mockAssignments } from "@/lib/mock-data"
import {
  ArrowLeft,
  Upload,
  Link2,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react"

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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("Unable to read selected file."))
    }
    reader.onerror = () => reject(new Error("Unable to read selected file."))
    reader.readAsDataURL(file)
  })
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignment = mockAssignments.find((a) => a.id === id)

  const [textContent, setTextContent] = useState("")
  const [linkContent, setLinkContent] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(assignment?.status === "reviewed")
  const [aiGrade, setAiGrade] = useState<string | null>(null)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const validateAndSetFile = async (file: File) => {
    const maxDocumentBytes = 10 * 1024 * 1024
    const maxImageBytes = 5 * 1024 * 1024
    const allowedExtensions = ["docx", "txt", "png", "jpg", "jpeg", "webp"]
    const extension = file.name.split(".").pop()?.toLowerCase() || ""
    const isImage = file.type.startsWith("image/")

    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported file type. Please upload DOCX, TXT, or screenshots (PNG/JPG/JPEG/WEBP).")
      return
    }

    if (isImage && file.size > maxImageBytes) {
      setError("Screenshot is too large. Maximum allowed screenshot size is 5MB.")
      return
    }

    if (!isImage && file.size > maxDocumentBytes) {
      setError("File is too large. Maximum allowed size is 10MB.")
      return
    }

    setUploadedFile(file)
    if (isImage) {
      setScreenshotDataUrl(await fileToDataUrl(file))
    } else {
      setScreenshotDataUrl(null)
    }
    setError(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    void validateAndSetFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    void validateAndSetFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      let submissionContent = textContent || linkContent
      let screenshotForReview = screenshotDataUrl

      if (!submissionContent && uploadedFile) {
        if (uploadedFile.type === "text/plain") {
          submissionContent = await uploadedFile.text()
        } else if (uploadedFile.type.startsWith("image/")) {
          if (!screenshotForReview) {
            screenshotForReview = await fileToDataUrl(uploadedFile)
          }
          submissionContent = `Submitted screenshot: ${uploadedFile.name}`
        } else {
          submissionContent = `Submitted document: ${uploadedFile.name}`
        }
      }

      if (!submissionContent) {
        throw new Error("Please upload a file, paste text, or provide a link before submitting.")
      }
      
      const formData = new FormData()

      if (textContent.trim()) {
        formData.append("content", textContent.trim())
      } else if (linkContent.trim()) {
        formData.append("content", linkContent.trim())
      } else if (uploadedFile) {
        formData.append("file", uploadedFile)
      }

      if (screenshotForReview) {
        formData.append("screenshot", screenshotForReview)
      }

      formData.append("rules", JSON.stringify(assignment.rules))
      formData.append("assignmentName", assignment.name)
      formData.append("organizationName", assignment.organizationName)

      const response = await fetch("/api/review", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to get AI review"))
      }

      const data = await response.json()
      setAiGrade(data.grade)
      setAiScore(data.score)
      setAiFeedback(data.feedback)
      setShowFeedback(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error submitting for review:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reviewed":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Reviewed</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending Review</Badge>
      default:
        return <Badge variant="secondary">Submitted</Badge>
    }
  }

  // Use AI-generated data if available, otherwise fall back to mock
  const mockGrade = aiGrade || assignment.grade || "B+"
  const mockScore = aiScore || (assignment.grade === "A-" ? 92 : assignment.grade === "B+" ? 87 : 85)
  const mockFeedback = aiFeedback.length > 0 ? aiFeedback : (assignment.feedback || [
    "Good overall structure and organization",
    "Consider adding more specific examples",
    "The introduction could be more engaging",
    "Sources are well-cited and relevant",
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/organizations/${assignment.organizationId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{assignment.name}</h1>
              {getStatusBadge(assignment.status)}
            </div>
            <p className="text-muted-foreground">{assignment.organizationName}</p>
          </div>
        </div>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applied Rules</CardTitle>
          <CardDescription>Criteria used to evaluate this assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {assignment.rules.map((rule, index) => (
              <Badge key={index} variant="outline">
                {rule}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback Section */}
      {showFeedback && (
        <div className="space-y-6">
          {error && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Grade Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-3xl font-bold">{mockGrade}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">AI Grade Estimate</h3>
                    <p className="text-muted-foreground">Based on {assignment.rules.length} grading criteria</p>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium text-foreground">{mockScore}/100</span>
                  </div>
                  <Progress value={mockScore} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Feedback</CardTitle>
              </div>
              <CardDescription>Areas of strength and improvement opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {mockFeedback.map((feedback, index) => {
                  // Detect if feedback is positive or negative based on keywords
                  const isPositive = /^(good|great|excellent|well|strong|positive|appropriate|effective|clear|thorough)/i.test(feedback)
                  return (
                    <li key={index} className="flex items-start gap-3">
                      {isPositive ? (
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                      )}
                      <span className="text-foreground">{feedback}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Progress Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance History</CardTitle>
              <CardDescription>Your progress on similar assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Performance graph will appear here</p>
                  <p className="text-xs">Complete more assignments to see trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submission Section */}
      {!showFeedback && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>Upload documents, share links, or paste text for AI review</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Link</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Text</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <input
                  id="assignment-file-upload"
                  type="file"
                  accept=".docx,.txt,.png,.jpg,.jpeg,.webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                    isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center">
                    <label htmlFor="assignment-file-upload" className="font-medium text-primary cursor-pointer">
                      Click to upload
                    </label>{" "}
                    <span className="text-muted-foreground">or drag and drop</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    DOCX, TXT up to 10MB. Screenshots (PNG/JPG/WEBP) up to 5MB.
                  </p>
                  {uploadedFile && (
                    <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-foreground">
                      Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                  {screenshotDataUrl && (
                    <div className="mt-4 w-full max-w-xl overflow-hidden rounded-md border border-border bg-background">
                      <Image
                        src={screenshotDataUrl}
                        alt="Uploaded screenshot preview"
                        width={1280}
                        height={720}
                        className="h-auto w-full"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="link" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link">Document URL</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://docs.google.com/document/..."
                    value={linkContent}
                    onChange={(e) => setLinkContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports Google Docs, Dropbox, and other shareable links
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Paste Your Content</Label>
                  <Textarea
                    id="text"
                    placeholder="Paste or type your assignment content here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={10}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {textContent.length} characters
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {(uploadedFile || linkContent.trim() || textContent.trim()) && (
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold text-foreground">Submission Source Preview</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is the content source that will be sent for AI review when you submit.
                </p>

                <div className="mt-3 grid gap-2 text-sm">
                  <div className="rounded-md bg-background px-3 py-2">
                    <span className="text-muted-foreground">Will submit from: </span>
                    <span className="font-medium text-foreground">
                      {textContent.trim()
                        ? "Pasted text"
                        : linkContent.trim()
                          ? "Shared link"
                          : "Uploaded file"}
                    </span>
                  </div>

                  {uploadedFile && (
                    <div className="rounded-md bg-background px-3 py-2">
                      <div className="font-medium text-foreground">
                        {uploadedFile.type.startsWith("image/") ? "Uploaded Screenshot" : "Uploaded File"}
                      </div>
                      <div className="text-muted-foreground">
                        {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    </div>
                  )}

                  {linkContent.trim() && (
                    <div className="rounded-md bg-background px-3 py-2">
                      <div className="font-medium text-foreground">Link</div>
                      <div className="truncate text-muted-foreground">{linkContent.trim()}</div>
                    </div>
                  )}

                  {textContent.trim() && (
                    <div className="rounded-md bg-background px-3 py-2">
                      <div className="font-medium text-foreground">Text ({textContent.trim().length} chars)</div>
                      <div className="text-muted-foreground">
                        {textContent.trim().slice(0, 220)}
                        {textContent.trim().length > 220 ? "..." : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!textContent && !linkContent && !uploadedFile)}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit for AI Review
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Again Button */}
      {showFeedback && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Want to improve your score?</h3>
                <p className="text-sm text-muted-foreground">
                  Make revisions based on the feedback and submit again
                </p>
              </div>
              <Button onClick={() => setShowFeedback(false)} variant="outline">
                Submit New Version
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
