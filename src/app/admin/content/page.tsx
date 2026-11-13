import { ContentEditor } from "@/components/admin/ContentEditor";
import { requireAdminPage } from "@/lib/admin";

export const metadata = { title: "콘텐츠" };

export default async function ContentPage() {
  const admin = await requireAdminPage();
  return (
    <>
      <h1 className="font-title text-5xl">콘텐츠</h1>
      <p className="mt-3 max-w-2xl text-brown/70">소개, 프로그램 설명, 연구 기록, 워크숍, 공연 이미지, 참가자 후기 등 사이트의 글과 사진을 한국어·영어로 수정합니다. 프로그램별 일정·참가비는 &lsquo;프로그램·일정&rsquo;에서 관리합니다.</p>
      <div className="mt-10">
        <ContentEditor canWrite={admin.profile.role !== "viewer"} />
      </div>
    </>
  );
}
