import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { getContent } from "@/lib/content";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/recommendations">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return {
    title: t.recommendation.heading,
    alternates: { canonical: `/${lang}/recommendations`, languages: { ko: "/ko/recommendations", en: "/en/recommendations" } },
  };
}

export default async function RecommendationsPage({ params }: PageProps<"/[lang]/recommendations">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const isKo = lang === "ko";
  const titleFont = isKo ? "font-title-kr" : "font-title";

  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="04" label={t.recommendation.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(2.8rem,7vw,5.5rem)]`}>{t.recommendation.heading}</h1>
        <p className="mt-5 max-w-3xl text-brown/80">{t.recommendation.intro}</p>
      </header>

      <div className="mt-14 space-y-16">
        {t.recommendation.letters.map((letter, i) => {
          const name = isKo ? letter.nameKo : letter.name;
          const role = isKo ? letter.titleKo : letter.title;
          const affiliation = isKo ? letter.affiliationKo : letter.affiliation;
          const paragraphs = isKo ? letter.paragraphsKo : letter.paragraphs;
          return (
            <article key={i} className="grid gap-8 border-t border-[var(--rule-strong)] pt-10 md:grid-cols-12 md:gap-12">
              <header className="md:col-span-3">
                {letter.photo && (
                  <Photo src={letter.photo} alt={name} ratio="1/1" sizes="(min-width:768px) 20vw, 60vw" className="mb-5 max-w-[14rem]" />
                )}
                <p className={`${titleFont} text-xl`}>{name}</p>
                <p className="mt-2 text-sm text-brown/75">{role}</p>
                <p className="mt-1 text-sm text-brown/75">{affiliation}</p>
              </header>
              <div className={`prose-body md:col-span-9 md:max-w-3xl ${isKo ? "leading-[1.95]" : "font-title text-[1.15rem] leading-[1.7]"}`}>
                {paragraphs.map((paragraph, k) => <p key={k}>{paragraph}</p>)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
