import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { getContent } from "@/lib/content";
import { isLang } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/workshops">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return { title: t.workshops.heading, alternates: { canonical: `/${lang}/workshops`, languages: { ko: "/ko/workshops", en: "/en/workshops" } } };
}

export default async function WorkshopsPage({ params }: PageProps<"/[lang]/workshops">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const titleFont = lang === "ko" ? "font-title-kr" : "font-title";

  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="07" label={t.workshops.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(1.62rem,4.1vw,3.19rem)]`}>{t.workshops.heading}</h1>
      </header>
      <ol className="mt-16">
        {t.workshops.items.map((item, i) => {
          const below = "captionBelow" in item && item.captionBelow;
          const images = item.images;
          const gallery = (
            <div className={below ? "grid gap-6 md:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
              {images.map((src, k) => {
                return (
                  <div key={src}>
                    <Photo src={src} alt={`${item.title} ${k + 1}`} sizes="(min-width:768px) 40vw, 100vw" plain />
                  </div>
                );
              })}
            </div>
          );
          const text = (
            <>
              <span
                aria-label={String(i + 1).padStart(2, "0")}
                className="block font-title text-[clamp(64px,9vw,120px)] font-light leading-[0.9] text-transparent [-webkit-text-stroke:1px_var(--text-display)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className={`${titleFont} mt-8 text-[28px] leading-[1.2]`}>{item.title}</h2>
              <Paragraphs text={item.description} className="mt-6 max-w-[62ch] text-[13.5px] leading-[1.45]" />
            </>
          );
          return (
            <li key={item.title} className="border-t border-[var(--rule-strong)] py-12 md:py-16">
              {below ? (
                <div className="mx-auto max-w-5xl">
                  {gallery}
                  <div className="mt-8 max-w-2xl">{text}</div>
                </div>
              ) : (
                <div className={`grid gap-10 md:grid-cols-12 md:gap-14 ${i % 2 ? "" : ""}`}>
                  <div className={`md:col-span-5 ${i % 2 ? "md:order-2 md:col-start-8" : ""}`}>{text}</div>
                  <div className={`md:col-span-7 ${i % 2 ? "md:order-1 md:col-start-1" : ""}`}>{gallery}</div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
