import { SubscribersView } from "@/components/admin/SubscribersView";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "구독자" };

export default async function SubscribersPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">이메일 구독자</h1>
      <p className="mt-3 text-brown/70">이메일은 중복 등록되지 않으며, 구독자는 안내 메일의 링크로 직접 구독을 취소할 수 있습니다. 관리자도 구독 상태를 변경할 수 있습니다.</p>
      <div className="mt-10"><SubscribersView canWrite={admin.profile.role !== "viewer"} /></div>
    </>
  );
}
