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
        <Chapter no="04" label={t.workshops.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(2.8rem,7vw,5.5rem)]`}>{t.workshops.heading}</h1>
      </header>
      <ol className="mt-16">
        {t.workshops.items.map((item, i) => {
          const below = "captionBelow" in item && item.captionBelow;
          const images = item.images;
          const gallery = (
            <div className={`grid gap-4 ${images.length > 1 ? "sm:grid-cols-2" : ""} ${images.length === 3 ? "[&>*:first-child]:sm:col-span-2" : ""}`}>
              {images.map((src, k) => (
                <Photo key={src} src={src} alt={`${item.title} ${k + 1}`} sizes={images.length > 1 ? "(min-width:768px) 28vw, 100vw" : "(min-width:768px) 50vw, 100vw"} />
              ))}
            </div>
          );
          const text = (
            <>
              <span className="font-title text-2xl text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
              <h2 className={`${titleFont} mt-3 text-[clamp(1.6rem,2.8vw,2.3rem)]`}>{item.title}</h2>
              <Paragraphs text={item.description} className="mt-5 max-w-xl" />
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
