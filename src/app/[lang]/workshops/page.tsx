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
      <ol className="mt-16 flex flex-col gap-[104px] md:mt-[104px]">
        {t.workshops.items.map((item, i) => {
          const images = item.images;
          const stacked = images.length >= 3;
          const wide = images.length > 1 && !stacked;
          const reverse = i % 2 === 1;

          const media = stacked ? (
            <div className="flex flex-col gap-6">
              {(() => {
                const largestIndex = images.reduce((best, src, k) => {
                  const [bw, bh] = dimsOf(images[best]);
                  const [w, h] = dimsOf(src);
                  return w * h > bw * bh ? k : best;
                }, 0);
                const smaller = images.filter((_, k) => k !== largestIndex);
                return (
                  <>
                    {smaller.length > 1 && (
                      <div className="grid grid-cols-2 gap-6">
                        {smaller.map((src, k) => (
                          <Photo key={src} src={src} alt={`${item.title} ${k + 1}`} sizes="(min-width:768px) 22vw, 50vw" plain />
                        ))}
                      </div>
                    )}
                    <Photo src={images[largestIndex]} alt={`${item.title} ${largestIndex + 1}`} sizes="(min-width:768px) 40vw, 100vw" plain />
                  </>
                );
              })()}
            </div>
          ) : (
            <div className={wide ? "flex items-start gap-6" : ""}>
              {images.map((src, k) => (
                <div key={src} className={wide ? "min-w-0 flex-1" : ""}>
                  <Photo src={src} alt={`${item.title} ${k + 1}`} sizes="(min-width:768px) 40vw, 100vw" plain />
                </div>
              ))}
            </div>
          );
          const text = (
            <>
              <span
                aria-label={String(i + 1).padStart(2, "0")}
                className="block font-title text-[clamp(64px,9vw,120px)] font-light leading-[0.9] text-transparent [-webkit-text-stroke:1px_var(--color-brown)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className={`${titleFont} mt-8 text-[28px] leading-[1.2]`}>{item.title}</h2>
              <Paragraphs text={item.description} className="mt-6 max-w-[62ch] text-[13.5px] leading-[1.45]" />
            </>
          );
          return (
            <li key={item.title} className="grid items-center gap-8 md:grid-cols-12">
              <div className={
                reverse
                  ? `order-2 md:order-none md:col-start-7 ${wide ? "md:col-span-7" : "md:col-span-6"}`
                  : `order-2 md:order-none ${wide ? "md:col-span-7" : "md:col-span-6"}`
              }>
                {media}
              </div>
              <div className={
                reverse
                  ? "order-1 md:order-none md:col-start-1 md:col-span-4 md:row-start-1"
                  : `order-1 md:order-none ${wide ? "md:col-start-9 md:col-span-3" : "md:col-start-8 md:col-span-4"}`
              }>
                {text}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
