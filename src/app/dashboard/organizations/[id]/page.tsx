"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
} from "lucide-react"

interface OrganizationDetail {
  id: string
  name: string
  description?: string | null
  gradingSystem?: string | null
  rules: string[]
}

interface Assignment {
  id: string
  name: string
  organizationId: string
  organizationName: string
  rules: string[]
  status: "pending" | "reviewed" | "submitted"
  grade?: string
  updatedAt: string
}

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [organization, setOrganization] = useState<OrganizationDetail | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteAssignments, setDeleteAssignments] = useState<Assignment[] | null>(null)

  useEffect(() => {
    let active = true

    const loadOrganization = async () => {
      setIsLoading(true)
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
          setAssignments(data.assignments || [])
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

  const filteredAssignments = assignments.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssignments.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAssignments.map((a) => a.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = () => {
    const selected = assignments.filter((a) => selectedIds.includes(a.id))
    setDeleteAssignments(selected)
  }

  const confirmDelete = () => {
    if (deleteAssignments) {
      const idsToDelete = deleteAssignments.map((a) => a.id)
      setAssignments(assignments.filter((a) => !idsToDelete.includes(a.id)))
      setSelectedIds([])
      setDeleteAssignments(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reviewed":
        return <Badge variant="secondary" className="bg-primary/10 text-primary">Reviewed</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>
      default:
        return <Badge variant="secondary">Submitted</Badge>
    }
  }

  // Mock performance data
  const avgScore = assignments.filter((a) => a.grade).length > 0 ? "B+" : "N/A"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{organization.name}</h1>
            {organization.description && (
              <p className="text-muted-foreground">{organization.description}</p>
            )}
            {organization.gradingSystem && (
              <p className="text-sm text-muted-foreground">Grading system: {organization.gradingSystem}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/organizations/${id}/edit`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/organizations/${id}/assignments/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {assignments.filter((a) => a.status === "reviewed").length}
              </p>
              <p className="text-sm text-muted-foreground">Reviewed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgScore}</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Rules</CardTitle>
          <CardDescription>Criteria used to evaluate assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {organization.rules.map((rule, index) => (
              <Badge key={index} variant="outline">
                {rule}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Over Time</CardTitle>
          <CardDescription>Track your progress across assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-border">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Performance graph will appear here</p>
              <p className="text-xs">Submit more assignments to see your progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Assignments</CardTitle>
              <CardDescription>{assignments.length} total assignments</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              {selectedIds.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedIds.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No assignments found</p>
              <Link href={`/dashboard/organizations/${id}/assignments/new`} className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Assignment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-2">
                <Checkbox
                  checked={selectedIds.length === filteredAssignments.length && filteredAssignments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium text-muted-foreground">Select All</span>
              </div>

              {/* Assignment List */}
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.includes(assignment.id)}
                    onCheckedChange={() => handleSelect(assignment.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    className="flex flex-1 cursor-pointer items-center justify-between"
                    onClick={() => router.push(`/dashboard/assignments/${assignment.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(assignment.status)}
                      <div>
                        <p className="font-medium text-foreground">{assignment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(assignment.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {assignment.grade && (
                        <span className="font-semibold text-foreground">{assignment.grade}</span>
                      )}
                      {getStatusBadge(assignment.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/assignments/${assignment.id}`)
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteAssignments([assignment])
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAssignments} onOpenChange={() => setDeleteAssignments(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment{deleteAssignments && deleteAssignments.length > 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              {deleteAssignments && deleteAssignments.length === 1
                ? `"${deleteAssignments[0].name}"`
                : `${deleteAssignments?.length} assignments`}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
