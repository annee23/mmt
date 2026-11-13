import { ProgramsManager } from "@/components/admin/ProgramsManager";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "프로그램·일정" };

export default async function ProgramsPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">프로그램 · 일정</h1>
      <p className="mt-3 max-w-2xl text-brown/70">프로그램 정보, 일정, 정원, 참가비, 모집 상태와 신청 마감일을 관리합니다. 모집 마감일이 지나거나 모든 회차가 마감되면 사이트에 자동으로 &lsquo;모집 마감&rsquo;이 표시됩니다.</p>
      <div className="mt-10">
        <ProgramsManager canWrite={admin.profile.role !== "viewer"} />
      </div>
    </>
  );
}
