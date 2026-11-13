import { ApplicationDetail } from "@/components/admin/ApplicationDetail";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "신청 상세" };

export default async function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const { role, can_view_sensitive } = admin.profile;
  return <ApplicationDetail id={id} canWrite={role !== "viewer"} canViewSensitive={can_view_sensitive} isOwner={role === "owner"} />;
}
