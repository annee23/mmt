"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AdminProfile } from "@/lib/admin";

const NAV = [
  ["/admin", "대시보드"],
  ["/admin/applications", "신청자"],
  ["/admin/programs", "프로그램·일정"],
  ["/admin/content", "콘텐츠"],
  ["/admin/subscribers", "구독자"],
  ["/admin/import", "CSV 가져오기"],
  ["/admin/settings", "신청서·개인정보"],
] as const;

const ROLE: Record<AdminProfile["role"], string> = { owner: "소유자", manager: "매니저", viewer: "조회 전용" };

export function AdminShell({ profile, children }: { profile: Pick<AdminProfile, "email" | "role" | "can_view_sensitive" | "display_name">; children: React.ReactNode }) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-[var(--rule)] bg-paper md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-5 md:block">
          <Link href="/admin" className="font-title text-2xl">
            Jin Sarang <span className="block text-sm italic text-bronze-deep">Admin</span>
          </Link>
          <Link href="/ko" className="link-u text-sm md:mt-3 md:inline-block" target="_blank">
            사이트 보기 ↗
          </Link>
        </div>
        <nav aria-label="관리자 메뉴" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
          {NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`block whitespace-nowrap px-3 py-2 text-[0.95rem] ${active(href) ? "bg-brown text-paper" : "hover:bg-bronze/15"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden p-5 text-sm md:block">
          <p className="font-semibold">{profile.display_name || profile.email}</p>
          <p className="text-brown/65">{profile.email}</p>
          <p className="mt-1 text-brown/65">
            {ROLE[profile.role]}
            {profile.can_view_sensitive ? " · 민감정보 열람" : ""}
          </p>
          <button type="button" onClick={logout} disabled={busy} className="btn btn-sm mt-4">
            로그아웃
          </button>
        </div>
      </aside>
      <div className="min-w-0 p-5 md:p-10">
        {children}
        <div className="mt-10 md:hidden">
          <button type="button" onClick={logout} disabled={busy} className="btn btn-sm">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
