import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrganizations } from "@/lib/mock-data";

export default function NewAssignmentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Assignment</h1>
        <p className="text-muted-foreground">
          Select an organization first, then create the assignment with its rule set.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockOrganizations.map((organization) => (
          <Card key={organization.id} className="transition-all hover:border-primary/50 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">{organization.name}</CardTitle>
              <CardDescription>{organization.rules.length} available rules</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/organizations/${organization.id}/assignments/new`}>
                <Button className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
