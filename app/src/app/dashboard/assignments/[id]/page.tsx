"use client"

import { useState, use } from "react"
import Link from "next/link"
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

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const assignment = mockAssignments.find((a) => a.id === id)

  const [textContent, setTextContent] = useState("")
  const [linkContent, setLinkContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedback, setShowFeedback] = useState(assignment?.status === "reviewed")

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

  const handleSubmit = () => {
    setIsSubmitting(true)
    // Mock AI review
    setTimeout(() => {
      setIsSubmitting(false)
      setShowFeedback(true)
    }, 2000)
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

  // Mock grade data based on assignment
  const mockGrade = assignment.grade || "B+"
  const mockScore = assignment.grade === "A-" ? 92 : assignment.grade === "B+" ? 87 : 85
  const mockFeedback = assignment.feedback || [
    "Good overall structure and organization",
    "Consider adding more specific examples",
    "The introduction could be more engaging",
    "Sources are well-cited and relevant",
  ]

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
                {mockFeedback.map((feedback, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {index < 2 ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                    )}
                    <span className="text-foreground">{feedback}</span>
                  </li>
                ))}
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
            <Tabs defaultValue="text" className="w-full">
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
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center">
                    <span className="font-medium text-primary cursor-pointer">Click to upload</span>{" "}
                    <span className="text-muted-foreground">or drag and drop</span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PDF, DOCX, TXT up to 10MB
                  </p>
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

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!textContent && !linkContent)}
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
                    Submit for Review
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
