import { Suspense } from "react";
import { ApplicationsView } from "@/components/admin/ApplicationsView";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "신청자" };

export default async function ApplicationsPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">신청자</h1>
      <div className="mt-8">
        <Suspense fallback={null}>
          <ApplicationsView canExportHealth={admin.profile.can_view_sensitive} />
        </Suspense>
      </div>
    </>
  );
}
