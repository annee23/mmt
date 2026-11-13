import Link from "next/link";
import type { ReactNode } from "react";
import { GOOGLE_FORM_URL, STATIC_SITE } from "@/lib/static-mode";

/** In-site apply page normally; the original Google Form in the static preview build. */
export function ApplyLink({ lang, query = "", className, children }: { lang: string; query?: string; className?: string; children: ReactNode }) {
  if (STATIC_SITE) {
    return (
      <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={`/${lang}/apply${query}`} className={className}>
      {children}
    </Link>
  );
}
