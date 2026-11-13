import type { Metadata } from "next";
import "../globals.css";
import { fontVars } from "@/fonts";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdmin } from "@/lib/admin";


export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "관리자 | Jin Sarang", template: "%s | 관리자" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.png" },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdmin();
  const profile = admin && {
    email: admin.profile.email,
    role: admin.profile.role,
    can_view_sensitive: admin.profile.can_view_sensitive,
    display_name: admin.profile.display_name,
  };
  return (
    <html lang="ko" className={fontVars}>
      <body>{profile ? <AdminShell profile={profile}>{children}</AdminShell> : children}</body>
    </html>
  );
}
