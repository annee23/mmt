import { SettingsView } from "@/components/admin/SettingsView";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "신청서·개인정보" };

export default async function SettingsPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">신청서 · 개인정보 설정</h1>
      <div className="mt-10"><SettingsView canWrite={admin.profile.role !== "viewer"} isOwner={admin.profile.role === "owner"} /></div>
    </>
  );
}
