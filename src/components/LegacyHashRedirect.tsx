"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = { program: "program", research: "research", workshops: "workshops", performances: "performances" };

/** Old links looked like /#/program (hash routing). Send them to the matching page. */
export function LegacyHashRedirect({ lang }: { lang: string }) {
  const router = useRouter();
  useEffect(() => {
    const m = window.location.hash.match(/^#\/(\w+)/);
    if (m && ROUTES[m[1]]) router.replace(`/${lang}/${ROUTES[m[1]]}`);
    else if (m && m[1] === "admin") router.replace("/admin");
  }, [lang, router]);
  return null;
}
