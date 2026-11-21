import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "mmt_admin_session";

export type AdminCookiePayload = {
  userId: string;
  profileEmail: string;
  expiresAt: number;
};

export function signAdminCookie(payload: AdminCookiePayload): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("Missing ADMIN_PASSWORD");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyAdminCookie(value: string | undefined): AdminCookiePayload | null {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminCookiePayload;
    if (!payload.userId || !payload.profileEmail || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readAdminCookie(store: { get(name: string): { value: string } | undefined }): AdminCookiePayload | null {
  return verifyAdminCookie(store.get(ADMIN_COOKIE)?.value);
}
