import type { ReactNode } from "react";

/** Renders **bold** markers from the original content as <strong>. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <span key={i}>{p.slice(2, -2)}</span> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

/** Splits on blank lines so multi-paragraph descriptions keep their structure. */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  if (!text.trim()) return null;
  return (
    <div className={`prose-body ${className}`}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          <Rich text={p} />
        </p>
      ))}
    </div>
  );
}

export function Chapter({ no, label, children }: { no: string; label: string; children?: ReactNode }) {
  return (
    <p className="chapter">
      <span>{label}</span>
      {children}
    </p>
  );
}

/** Only allow safe link targets coming from editable content. */
export function safeHref(href: string | undefined | null): string {
  if (!href) return "#";
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href.trim()) ? href.trim() : "#";
}
