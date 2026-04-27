"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OrganizationSummary {
  id: string;
  name: string;
  rules: string[];
}

export default function NewAssignmentPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load organizations");
        }

        const data = await response.json();
        if (active) {
          setOrganizations(data.organizations || []);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load organizations");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadOrganizations();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Assignment</h1>
        <p className="text-muted-foreground">
          Select an organization first, then create the assignment with its rule set.
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading organizations...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {organizations.map((organization) => (
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
