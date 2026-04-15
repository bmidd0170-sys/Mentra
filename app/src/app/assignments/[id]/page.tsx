import { redirect } from "next/navigation";

type AssignmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params;
  redirect(`/dashboard/assignments/${id}`);
}
