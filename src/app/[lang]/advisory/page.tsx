import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter } from "@/components/ui";
import { getContent } from "@/lib/content";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/advisory">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return {
    title: t.advisoryBoard.heading,
    alternates: { canonical: `/${lang}/advisory`, languages: { ko: "/ko/advisory", en: "/en/advisory" } },
  };
}

export default async function AdvisoryPage({ params }: PageProps<"/[lang]/advisory">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const isKo = lang === "ko";
  const titleFont = isKo ? "font-title-kr" : "font-title";

  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="05" label={t.advisoryBoard.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(2.8rem,7vw,5.5rem)]`}>{t.advisoryBoard.heading}</h1>
        <p className="mt-5 max-w-3xl text-brown/80">{t.advisoryBoard.description}</p>
      </header>
      <ul className="mt-14 grid gap-10 border-t border-[var(--rule-strong)] pt-10 md:grid-cols-3">
        {t.advisoryBoard.members.map((member, i) => {
          const [name, ...rest] = isKo ? member.linesKo : member.linesEn;
          return (
            <li key={i} className="border-t border-[var(--rule)] pt-6">
              <span className="font-title text-lg text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
              <p className={`${titleFont} mt-3 text-xl`}>{name}</p>
              <ul className="mt-4 space-y-1.5 text-[0.95rem] text-brown/80">
                {rest.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
