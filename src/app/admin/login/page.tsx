import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/admin";
import { supabaseConfigured } from "@/lib/env";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="chapter">Admin</p>
      <h1 className="font-title mt-6 text-5xl">Jin Sarang</h1>
      <p className="mt-2 text-brown/70">사이트 관리자 로그인</p>
      {!supabaseConfigured() && (
        <p role="alert" className="mt-6 border border-burgundy p-3 text-sm text-burgundy">
          Supabase 환경 변수가 설정되지 않았습니다. README의 배포 안내를 확인해 주세요.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
