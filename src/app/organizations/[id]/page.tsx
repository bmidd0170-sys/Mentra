import { redirect } from "next/navigation";

type OrganizationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { id } = await params;
  redirect(`/dashboard/organizations/${id}`);
}
