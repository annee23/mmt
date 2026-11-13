import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs } from "@/components/ui";
import { Gallery } from "@/components/Gallery";
import { getContent } from "@/lib/content";
import { getUI, isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/performances">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return { title: t.performances.heading, alternates: { canonical: `/${lang}/performances`, languages: { ko: "/ko/performances", en: "/en/performances" } } };
}

export default async function PerformancesPage({ params }: PageProps<"/[lang]/performances">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const ui = getUI(lang);
  const titleFont = lang === "ko" ? "font-title-kr" : "font-title";
  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="05" label={t.performances.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(1.62rem,4.1vw,3.19rem)]`}>{t.performances.heading}</h1>
        {t.performances.intro && <Paragraphs text={t.performances.intro} className="mt-6 max-w-2xl" />}
      </header>
      <div className="mt-14 border-t border-[var(--rule-strong)] pt-10">
        <Gallery images={t.performances.images} alt={t.performances.heading} labels={ui.gallery} />
      </div>
    </div>
  );
}
