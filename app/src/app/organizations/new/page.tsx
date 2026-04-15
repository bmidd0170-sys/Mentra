import { redirect } from "next/navigation";

export default function AddOrganizationPage() {
  redirect("/dashboard/organizations/new");
}
