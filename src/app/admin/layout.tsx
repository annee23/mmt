import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "../globals.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdmin } from "@/lib/admin";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const serifKr = Noto_Serif_KR({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-noto-serif-kr", display: "swap", preload: false });
const sansKr = Noto_Sans_KR({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-noto-sans-kr", display: "swap", preload: false });

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
    <html lang="ko" className={`${display.variable} ${serifKr.variable} ${sansKr.variable}`}>
      <body>{profile ? <AdminShell profile={profile}>{children}</AdminShell> : children}</body>
    </html>
  );
}
