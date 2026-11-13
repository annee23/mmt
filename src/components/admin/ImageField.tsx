"use client";

import { useRef, useState } from "react";
import { api, errorText } from "@/components/admin/api";

const MAX_EDGE = 2000;

/** Downscales big photos in the browser before upload (keeps small files untouched). */
async function prepare(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88))) ?? file;
}

export function ImageField({ value, onChange, label = "이미지" }: { value: string | null; onChange: (url: string | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = await prepare(file);
      const res = await api<{ url: string }>("/api/admin/upload", { method: "POST", headers: { "Content-Type": body.type || file.type }, body });
      if (res.ok) onChange(res.data.url);
      else setError(res.status === 415 ? "JPG, PNG, WebP 형식만 올릴 수 있습니다." : res.status === 413 ? "파일이 너무 큽니다 (8MB 이하)." : errorText(res.data.error));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-[var(--rule)] bg-paper text-xs text-brown/50">
        {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={value} alt="" className="h-full w-full object-cover" /> : "없음"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? "올리는 중…" : value ? `${label} 교체` : `${label} 올리기`}
          </button>
          {value && <button type="button" className="btn btn-sm" onClick={() => onChange(null)}>제거</button>}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
        {value && <p className="mt-2 truncate text-xs text-brown/55">{value}</p>}
        {error && <p role="alert" className="error-text">{error}</p>}
      </div>
    </div>
  );
}
