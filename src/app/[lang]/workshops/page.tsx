import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs } from "@/components/ui";
import { Photo, dimsOf } from "@/components/Photo";
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
          // Portrait documents (e.g. certificate letters) stay small next to the larger photos.
          const gallery = (
            <div className="flex flex-wrap items-start gap-3 md:gap-4">
              {images.map((src, k) => {
                const [w, h] = dimsOf(src);
                const portrait = h / w > 1.2;
                const cls = images.length > 1
                  ? (portrait ? "w-full sm:max-w-md sm:basis-80" : "min-w-[14rem] flex-1 basis-64")
                  : portrait ? "w-full max-w-md" : "w-full";
                return (
                  <div key={src} className={cls}>
                    <Photo src={src} alt={`${item.title} ${k + 1}`} sizes={portrait ? "200px" : "(min-width:768px) 40vw, 100vw"} />
                  </div>
                );
              })}
            </div>
          );
          const text = (
            <>
              <span className="font-title text-xl text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
              <h2 className={`${titleFont} mt-3 text-[clamp(1.15rem,2.0vw,1.66rem)]`}>{item.title}</h2>
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
