import { DashboardView } from "@/components/admin/DashboardView";
import { requireAdminPage } from "@/lib/admin";

export default async function AdminHome() {
  await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">대시보드</h1>
      <div className="mt-10">
        <DashboardView />
      </div>
    </>
  );
}
