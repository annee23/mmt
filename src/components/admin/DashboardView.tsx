"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, fmtDate } from "@/components/admin/api";
import { APPLICATION_STATUSES, STATUS_LABEL_KO, type ApplicationStatus } from "@/lib/application";

type Dashboard = {
  total: number;
  byStatus: Record<string, number>;
  programs: { id: string; name_ko: string; slug: string; recruit_status: string; applicants: number }[];
  sessions: { id: string; program_id: string; title_ko: string; starts_at: string; status: string; capacity: number | null; confirmed: number; applicants: number; remaining: number | null }[];
};

const CARDS: { key: "total" | ApplicationStatus; label: string; status?: ApplicationStatus }[] = [
  { key: "total", label: "전체 신청자" },
  { key: "new", label: "신규 신청자", status: "new" },
  { key: "reviewing", label: "검토 중", status: "reviewing" },
  { key: "confirmed", label: "참가 확정", status: "confirmed" },
  { key: "waitlist", label: "대기자", status: "waitlist" },
  { key: "cancelled", label: "취소자", status: "cancelled" },
];

export function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>("/api/admin/dashboard").then((r) => (r.ok ? setData(r.data) : setError(errorText(r.data.error))));
  }, []);

  if (error) return <p role="alert" className="error-text">{error}</p>;
  if (!data) return <p className="text-brown/60">불러오는 중…</p>;

  const programName = (id: string) => data.programs.find((p) => p.id === id)?.name_ko ?? "";
  return (
    <div className="space-y-14">
      <section aria-label="신청 현황">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {CARDS.map((c) => {
            const value = c.key === "total" ? data.total : data.byStatus[c.key] ?? 0;
            return (
              <li key={c.key}>
                <Link href={c.status ? `/admin/applications?status=${c.status}` : "/admin/applications"} className="block border border-[var(--rule)] bg-paper p-4 hover:border-brown">
                  <span className="text-sm text-bronze-deep">{c.label}</span>
                  <span className="font-title mt-1 block text-4xl">{value}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-brown/60">
          반려 {data.byStatus.rejected ?? 0}명 포함 · 상태 {APPLICATION_STATUSES.map((s) => `${STATUS_LABEL_KO[s]} ${data.byStatus[s] ?? 0}`).join(" / ")}
        </p>
      </section>

      <section aria-labelledby="by-program">
        <h2 id="by-program" className="font-title text-3xl">프로그램별 신청자 수</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="adm-table">
            <thead><tr><th>프로그램</th><th>모집 상태</th><th>신청자</th></tr></thead>
            <tbody>
              {data.programs.map((p) => (
                <tr key={p.id}>
                  <td><Link className="link-u" href={`/admin/applications?program=${p.id}`}>{p.name_ko}</Link></td>
                  <td>{{ open: "모집 중", closed: "마감", upcoming: "모집 예정" }[p.recruit_status] ?? p.recruit_status}</td>
                  <td className="font-semibold">{p.applicants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="by-session">
        <h2 id="by-session" className="font-title text-3xl">회차별 정원 및 잔여석</h2>
        <p className="mt-1 text-sm text-brown/60">잔여석은 &lsquo;참가 확정&rsquo; 인원 기준입니다.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="adm-table">
            <thead><tr><th>프로그램</th><th>회차</th><th>상태</th><th>신청</th><th>확정</th><th>정원</th><th>잔여</th></tr></thead>
            <tbody>
              {data.sessions.length === 0 && <tr><td colSpan={7} className="text-brown/60">등록된 회차가 없습니다. &lsquo;프로그램·일정&rsquo;에서 일정을 추가하세요.</td></tr>}
              {data.sessions.map((s) => (
                <tr key={s.id}>
                  <td>{programName(s.program_id)}</td>
                  <td><Link className="link-u" href={`/admin/applications?session=${s.id}`}>{fmtDate(s.starts_at)} {s.title_ko}</Link></td>
                  <td>{s.status === "open" ? "모집 중" : "마감"}</td>
                  <td>{s.applicants}</td>
                  <td>{s.confirmed}</td>
                  <td>{s.capacity ?? "제한 없음"}</td>
                  <td className={s.remaining !== null && s.remaining <= 0 ? "font-semibold text-burgundy" : "font-semibold"}>{s.remaining === null ? "—" : Math.max(0, s.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
