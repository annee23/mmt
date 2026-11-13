import { ImportView } from "@/components/admin/ImportView";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "CSV 가져오기" };

export default async function ImportPage() {
  const admin = await requireAdminPage();
  if (admin.profile.role === "viewer") {
    return <p className="text-brown/70">조회 전용 계정은 가져오기를 사용할 수 없습니다.</p>;
  }
  return (
    <>
      <h1 className="font-title text-5xl">Google Form CSV 가져오기</h1>
      <p className="mt-3 max-w-2xl text-brown/70">기존 Google Form에 접수된 응답을 안전하게 옮깁니다. 파일은 서버에서만 처리되며, 가져온 내용은 이 사이트의 데이터베이스에만 저장됩니다.</p>
      <div className="mt-10"><ImportView canViewSensitive={admin.profile.can_view_sensitive} /></div>
    </>
  );
}
