"use client";

export type ApiResult<T> = { ok: boolean; status: number; data: T & { ok?: boolean; error?: string } };

/** Fetch helper for /api/admin/*. A 401 means the session ended – go back to the login page. */
export async function api<T = Record<string, unknown>>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
  if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
    window.location.href = "/admin/login";
  }
  return { ok: res.ok, status: res.status, data };
}

export const ERROR_TEXT: Record<string, string> = {
  unauthorized: "로그인이 필요합니다.",
  forbidden: "이 작업을 수행할 권한이 없습니다.",
  sensitive_forbidden: "민감정보 열람 권한이 없습니다.",
  forbidden_origin: "허용되지 않은 요청입니다.",
  validation: "입력값을 확인해 주세요.",
  slug_taken: "이미 사용 중인 주소(slug)입니다.",
  has_applications: "신청 내역이 있는 프로그램은 삭제할 수 없습니다. 대신 '비공개'로 전환해 주세요.",
  not_found: "대상을 찾을 수 없습니다.",
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  not_an_admin: "관리자 권한이 없는 계정입니다.",
  missing_columns: "CSV에서 필수 열(연령대·성별·연락처)을 찾을 수 없습니다.",
  server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};
export const errorText = (code?: string) => (code && ERROR_TEXT[code]) || "요청을 처리하지 못했습니다.";

export const fmtDateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso))
    : "";
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)) : "";

/** <input type="datetime-local"> ⇄ ISO string, always in Korea Standard Time. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return d.toISOString().slice(0, 16);
}
export const localInputToIso = (v: string): string | null => (v ? new Date(`${v}:00+09:00`).toISOString() : null);
