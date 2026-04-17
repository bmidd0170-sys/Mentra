"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { mockOrganizations, mockAssignments, type Organization } from "@/lib/mock-data"
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(mockOrganizations)
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null)

  const pendingAssignments = mockAssignments.filter((a) => a.status === "pending")

  const handleDeleteOrg = (org: Organization) => {
    setOrganizations(organizations.filter((o) => o.id !== org.id))
    setDeleteOrg(null)
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
        return <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Reviewed</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pending Review</Badge>
      default:
        return <Badge variant="secondary">Submitted</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your organizations and track assignments</p>
        </div>
        <Link href="/dashboard/organizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Organization
          </Button>
        </Link>
      </div>

      {/* Assignments Needing Review */}
      {pendingAssignments.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Assignments Needing Review</h2>
            <Badge variant="secondary">{pendingAssignments.length} pending</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => router.push(`/dashboard/assignments/${assignment.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assignment.status)}
                      <CardTitle className="text-base">{assignment.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-xs">{assignment.organizationName}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(assignment.status)}
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      Submit for Review
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Organizations */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Organizations</h2>
          <p className="text-sm text-muted-foreground">Manage classes and projects with custom grading rules</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{org.name}</CardTitle>
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
                          router.push(`/dashboard/organizations/${org.id}/edit`)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteOrg(org)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {org.description && (
                  <CardDescription className="text-xs line-clamp-2">{org.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{org.assignmentCount} assignments</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {org.rules.length} rules
                  </Badge>
                </div>
                {org.gradingSystem && (
                  <p className="mt-2 text-xs text-muted-foreground">Grading: {org.gradingSystem}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add New Organization Card */}
          <Link href="/dashboard/organizations/new">
            <Card className="flex h-full min-h-[140px] cursor-pointer items-center justify-center border-dashed transition-all hover:border-primary hover:bg-primary/5">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Create Organization</span>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrg} onOpenChange={() => setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteOrg?.name}&quot;? This will also delete all
              assignments within this organization. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrg && handleDeleteOrg(deleteOrg)}
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
