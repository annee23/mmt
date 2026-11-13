import Image from "next/image";
import Link from "next/link";
import type { Content } from "@/lib/content";
import type { Lang, UI } from "@/lib/i18n";
import { safeHref } from "@/components/ui";

export function Footer({ lang, t, ui }: { lang: Lang; t: Content; ui: UI }) {
  const nav = [
    [t.nav.program, `/${lang}/program`],
    [t.nav.research, `/${lang}/research`],
    [t.nav.workshops, `/${lang}/workshops`],
    [t.nav.performances, `/${lang}/performances`],
  ] as const;
  return (
    <footer className="mt-24 bg-olive text-paper">
      <div className="wrap grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Image src="/images/name.png" alt={t.hero.name} width={1084} height={439} sizes="160px" className="h-16 w-auto brightness-0 invert" />
          <p className="font-title mt-6 text-xl italic text-bronze">{ui.footer.archive}</p>
          <p className="mt-3 text-sm text-paper/70">{t.hero.role}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <p className="chapter !text-bronze">Index</p>
          <ul className="mt-5 space-y-2">
            {nav.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="link-u font-title text-xl tracking-wide">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`/${lang}/apply`} className="link-u font-title text-xl tracking-wide">
                {ui.applyShort}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="chapter !text-bronze">{t.contact.heading}</p>
          <ul className="mt-5 space-y-2 text-[0.98rem]">
            <li>
              <a className="link-u" href={`mailto:${t.contact.email}`}>
                {t.contact.email}
              </a>
            </li>
            <li>
              <a className="link-u" href={safeHref(t.contact.instagramUrl)} target="_blank" rel="noopener noreferrer">
                @{t.contact.instagramHandle} ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <div className="wrap space-y-3 py-6 text-sm text-paper/65">
          <div className="space-y-1 text-xs leading-relaxed text-paper/55">
            <p>© 2025 Sarang Jin. All rights reserved.</p>
            {ui.footer.notice.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            {t.footer.copyright} · {ui.footer.rights}
          </p>
          <Link href="/admin" className="hover:text-paper" rel="nofollow">
            {ui.footer.admin}
          </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
