import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs, safeHref } from "@/components/ui";
import { dimsOf, Photo } from "@/components/Photo";
import { getContent } from "@/lib/content";
import { isLang } from "@/lib/i18n";
import { getMediumPosts } from "@/lib/medium";

export async function generateMetadata({ params }: PageProps<"/[lang]/research">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return { title: t.research.heading, alternates: { canonical: `/${lang}/research`, languages: { ko: "/ko/research", en: "/en/research" } } };
}

export default async function ResearchPage({ params }: PageProps<"/[lang]/research">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const titleFont = lang === "ko" ? "font-title-kr" : "font-title";
  const posts = await getMediumPosts(t.research.writing.href);

  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="03" label={t.research.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(1.62rem,4.1vw,3.19rem)]`}>{t.research.heading}</h1>
      </header>

      <ol className="mt-12">
        {t.research.items.map((item) => {
          const images = item.images;
          const captionBelow = "captionBelow" in item && item.captionBelow;
          const galleryImages = captionBelow
            ? images.map((src) => {
                const [width, height] = dimsOf(src);
                return { src, width, height };
              })
            : [];
          const galleryStyle: CSSProperties & { "--research-gallery-columns": string } = {
            "--research-gallery-columns": galleryImages.map(({ width, height }) => `${width / height}fr`).join(" "),
          };
          return (
            <li key={item.title} className="mt-16 border-t border-[var(--rule-strong)] pt-10">
              {captionBelow ? (
                <>
                  <div className="research-gallery" style={galleryStyle}>
                    {galleryImages.map(({ src, width, height }, k) => (
                      <Photo
                        key={src}
                        src={src}
                        alt={`${item.title} ${k + 1}`}
                        sizes="(min-width:768px) 40vw, 100vw"
                        ratio={`${width}/${height}`}
                        plain
                        contain
                        className="p-0"
                      />
                    ))}
                  </div>
                  <div className="mt-8">
                    <h2 className={`${titleFont} text-2xl`}>{item.title}</h2>
                    <Paragraphs text={item.description} className="mt-5" />
                  </div>
                </>
              ) : (
                <div className="grid gap-8 md:grid-cols-[minmax(0,36fr)_minmax(0,64fr)] md:gap-5">
                  <div>
                    {images.map((src, k) => (
                      <Photo key={src} src={src} alt={`${item.title} ${k + 1}`} sizes="(min-width:768px) 35vw, 100vw" plain className="p-0" />
                    ))}
                  </div>
                  <div>
                    <h2 className={`${titleFont} text-2xl`}>{item.title}</h2>
                    <Paragraphs text={item.description} className="mt-5" />
                    {"link" in item && item.link && (
                      <a href={safeHref(item.link.href)} target="_blank" rel="noopener noreferrer" className="link-u mt-5 inline-block text-[0.95rem] text-burgundy">
                        {item.link.label} ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="medium" className="mt-20 border-t border-[var(--rule-strong)] pt-10">
        <h2 id="medium" className="font-title text-2xl">
          {t.research.writing.title}
        </h2>
        {posts.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.url}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="film film--plain relative aspect-[16/10] p-0">
                    {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" quality={60} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                  </div>
                  <p className="font-title mt-3 text-xl leading-snug group-hover:text-burgundy">{p.title}</p>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
          <a href={safeHref(t.research.writing.href)} target="_blank" rel="noopener noreferrer" className="btn">
            {t.research.writing.cta} ↗
          </a>
          {"naverHref" in t.research.writing && t.research.writing.naverHref && (
            <a href={safeHref(t.research.writing.naverHref)} target="_blank" rel="noopener noreferrer" className="btn">
              {t.research.writing.naverCta} ↗
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
