import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs, safeHref } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { getContent } from "@/lib/content";
import { getUI, isLang } from "@/lib/i18n";
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
  const ui = getUI(lang);
  const titleFont = lang === "ko" ? "font-title-kr" : "font-title";
  const posts = await getMediumPosts(t.research.writing.href);

  return (
    <div className="wrap pb-24 pt-14 md:pt-24">
      <header>
        <Chapter no="03" label={t.research.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(2.8rem,7vw,5.5rem)]`}>{t.research.heading}</h1>
      </header>

      <section aria-label={t.thesis.heading} className="mt-16 grid gap-10 border-t border-[var(--rule-strong)] pt-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-4">
          <h2 className={`${titleFont} text-3xl`}>{t.thesis.heading}</h2>
          {t.thesis.eyebrow && <p className="font-title mt-2 tracking-[0.2em] text-bronze-deep uppercase">{t.thesis.eyebrow}</p>}
          {t.thesis.summary && <Paragraphs text={t.thesis.summary} className="mt-5" />}
        </div>
        <div className="md:col-span-5 md:col-start-6">
          <Photo src={t.thesis.photo} alt={ui.thesisNote} sizes="(min-width:768px) 40vw, 100vw" />
        </div>
      </section>

      <ol className="mt-4">
        {t.research.items.map((item, i) => {
          const images = item.images;
          return (
            <li key={item.title} className="mt-16 border-t border-[var(--rule-strong)] pt-10">
              <div className="grid gap-10 md:grid-cols-12 md:gap-14">
                <div className="md:col-span-5">
                  <span className="font-title text-2xl text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className={`${titleFont} mt-3 text-[clamp(1.7rem,3vw,2.4rem)]`}>{item.title}</h2>
                  <Paragraphs text={item.description} className="mt-5" />
                  {"link" in item && item.link && (
                    <a href={safeHref(item.link.href)} target="_blank" rel="noopener noreferrer" className="link-u mt-5 inline-block text-[0.95rem] text-burgundy">
                      {item.link.label} ↗
                    </a>
                  )}
                </div>
                <div className={`grid gap-4 md:col-span-7 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {images.map((src, k) => (
                    <Photo key={src} src={src} alt={`${item.title} ${k + 1}`} sizes="(min-width:768px) 30vw, 100vw" />
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="medium" className="mt-20 border-t border-[var(--rule-strong)] pt-10">
        <h2 id="medium" className="font-title text-3xl">
          {t.research.writing.title}
        </h2>
        {posts.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.url}>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="film relative aspect-[16/10]">
                    {p.image && <Image src={p.image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" quality={60} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                  </div>
                  <p className="font-title mt-3 text-xl leading-snug group-hover:text-burgundy">{p.title}</p>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <a href={safeHref(t.research.writing.href)} target="_blank" rel="noopener noreferrer" className="btn mt-8">
          {t.research.writing.cta} ↗
        </a>
      </section>
    </div>
  );
}
