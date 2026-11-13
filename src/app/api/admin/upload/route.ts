import { randomUUID } from "node:crypto";
import { fail, json } from "@/lib/api";
import { audit, withAdmin } from "@/lib/admin";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 8 * 1024 * 1024;

/** Images are uploaded to the public `site-images` bucket by the server on behalf of an authorised editor. */
export const POST = withAdmin({ write: true }, async (req, ctx) => {
  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = TYPES[type];
  if (!ext) return fail(415, "unsupported_type");
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return fail(413, "too_large");

  const path = `uploads/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;
  const { error } = await ctx.svc.storage.from("site-images").upload(path, bytes, { contentType: type, cacheControl: "31536000" });
  if (error) {
    console.error("upload failed", error);
    return fail(500, "upload_failed");
  }
  const { data } = ctx.svc.storage.from("site-images").getPublicUrl(path);
  await audit(ctx, "image_upload", "storage", path);
  return json({ ok: true, url: data.publicUrl });
});
