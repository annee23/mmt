"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  lang: "ko" | "en";
  nav: { label: string; href: string; key: string }[];
  brand: string;
  menuLabel: string;
  closeLabel: string;
  switchLabel: string;
};

export function Header({ lang, nav, brand, menuLabel, closeLabel, switchLabel }: Props) {
  const pathname = usePathname() ?? `/${lang}`;
  const [open, setOpen] = useState(false);
  const rest = pathname.replace(/^\/(ko|en)/, "") || "";
  const other = lang === "ko" ? "en" : "ko";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === `/${lang}` ? pathname === href : pathname.startsWith(href));
  const remember = () => {
    document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
  };

  const langSwitch = (
    <Link
      href={`/${other}${rest}`}
      onClick={remember}
      hrefLang={other}
      lang={other}
      aria-label={switchLabel}
      className="font-title text-[1.05rem] tracking-[0.18em] text-brown"
    >
      <span className={lang === "ko" ? "text-burgundy" : "opacity-60"}>KO</span>
      <span className="mx-1.5 opacity-40">/</span>
      <span className={lang === "en" ? "text-burgundy" : "opacity-60"}>EN</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-ivory/92 backdrop-blur-sm">
      <div className="wrap flex h-16 items-center justify-between gap-6 md:h-[4.75rem]">
        <Link href={`/${lang}`} aria-label={brand} className="shrink-0">
          <Image src="/images/name.png" alt={brand} width={1084} height={439} sizes="120px" priority className="h-10 w-auto md:h-12" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`font-title text-[1.0rem] tracking-[0.14em] uppercase transition-colors hover:text-burgundy ${
                isActive(n.href) ? "text-burgundy" : "text-brown"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden lg:block">{langSwitch}</div>
          <button
            type="button"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={menuLabel}
            onClick={() => setOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M3 8h18M3 16h18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={menuLabel}
        hidden={!open}
        className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden"
      >
        <div className="wrap flex h-16 items-center justify-between">
          <span className="chapter">Index</span>
          <button type="button" className="-mr-2 inline-flex h-11 w-11 items-center justify-center" aria-label={closeLabel} onClick={() => setOpen(false)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile" className="wrap flex flex-1 flex-col justify-center gap-1">
          {nav.map((n, i) => (
            <Link
              key={n.key}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(n.href) ? "page" : undefined}
              className="flex items-baseline gap-4 border-b border-[var(--rule)] py-4 font-title-kr text-[1.35rem] text-brown"
            >
              <span className="font-title w-8 text-base text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="wrap flex items-center justify-between pb-10 pt-6">{langSwitch}</div>
      </div>
    </header>
  );
}
