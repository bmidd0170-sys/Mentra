import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          criteria: true,
          assignments: true,
        },
      },
    },
  })

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Create rubric-driven organizations and assignments.
          </p>
        </div>
        <Link href="/organizations/new">
          <Button>Create Organization</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>{org.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{org._count.criteria} criteria</p>
              <p>{org._count.assignments} assignments</p>
              <Link href={`/organization/${org.id}`}>
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
