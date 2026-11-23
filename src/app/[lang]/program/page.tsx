import type { Metadata } from "next";
import { ApplyLink } from "@/components/ApplyLink";
import { notFound } from "next/navigation";
import { Chapter, Rich } from "@/components/ui";
import { EmbodiedDiagram } from "@/components/EmbodiedDiagram";
import { Testimonials } from "@/components/Testimonials";
import { getContent } from "@/lib/content";
import { getUI, isLang } from "@/lib/i18n";
import { getPrograms } from "@/lib/programs";

export async function generateMetadata({ params }: PageProps<"/[lang]/program">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  return { title: t.program.heading, alternates: { canonical: `/${lang}/program`, languages: { ko: "/ko/program", en: "/en/program" } } };
}

export default async function ProgramPage({ params }: PageProps<"/[lang]/program">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [t, programs] = [await getContent(lang), await getPrograms(lang)];
  const ui = getUI(lang);
  const isKo = lang === "ko";
  const titleFont = isKo ? "font-title-kr" : "font-title";
  const subject = encodeURIComponent(ui.inquirySubject);

  return (
    <>
      <header className="wrap pb-10 pt-14 md:pb-16 md:pt-24">
        <Chapter no="—" label={t.program.eyebrow} />
        <h1 className={`${titleFont} mt-6 text-[clamp(1.62rem,4.1vw,3.19rem)]`}>{t.program.heading}</h1>
      </header>

      <section aria-labelledby="approach" className="wrap pb-16 md:pb-24">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chapter no="00" label={t.program.approach.eyebrow} />
            <h2 id="approach" className={`${titleFont} mt-5 text-2xl`}>{t.program.approach.heading}</h2>
          </div>
          <div className="grid gap-10 md:col-span-8 md:grid-cols-2">
            <div>
              <h3 className="font-title text-xl italic text-burgundy">{t.program.approach.musicTherapyTitle}</h3>
              <div className="prose-body mt-3">
                {t.program.approach.musicTherapyBody.map((p, i) => <p key={i}><Rich text={p} /></p>)}
              </div>
            </div>
            <div>
              <h3 className="font-title text-xl italic text-burgundy">{t.program.approach.humanisticTitle}</h3>
              <div className="prose-body mt-3">
                {t.program.approach.humanisticBody.map((p, i) => <p key={i}><Rich text={p} /></p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t.program.heading} className="wrap py-14 md:py-20">
        <div className="border-t border-[var(--rule-strong)]">
          <div className="grid grid-cols-[1.2fr_1.1fr_1.7fr] gap-8 border-b border-[var(--rule)] py-4 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brown/60 max-md:hidden">
            <span>{t.program.heading}</span>
            <span>{ui.program.format}</span>
            <span>{isKo ? "프로그램 경험" : "Program experience"}</span>
          </div>
          {programs.map((p) => (
            <div key={p.id} className="grid gap-3 border-b border-[var(--rule)] py-6 md:grid-cols-[1.2fr_1.1fr_1.7fr] md:gap-8 md:py-2">
              <h2 className="font-title text-[22px] font-semibold">{p.name}</h2>
              <p className="text-[13.5px] font-semibold leading-[1.4]">{p.format}</p>
              <p className="text-[13.5px] leading-[1.45] text-brown/85">{p.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {programs.find((p) => p.slug === "embodied-listening") && (
        <section aria-label={t.program.highlight.alt} className="wrap pb-16 md:pb-24">
          <div className="border border-[var(--rule)] bg-paper p-5 md:p-10">
            <EmbodiedDiagram lang={lang} />
          </div>
        </section>
      )}

      <section className="wrap py-14 text-center">
        <ApplyLink lang={lang} className="btn btn-solid">{t.program.highlight.applyLabel}</ApplyLink>
        <a href={`mailto:${t.contact.email}?subject=${subject}`} className="btn">
          {ui.inquiry}
        </a>
      </section>

      <section aria-labelledby="exp-title" className="bg-white text-brown">
        <div className="wrap py-20 md:py-28">
          <Chapter no="07" label={ui.chapters.experiences} />
          <h2 id="exp-title" className={`${titleFont} mt-6 text-[clamp(1.34rem,2.6vw,2.11rem)]`}>{t.program.testimonials.heading}</h2>
          <p className="mt-4 max-w-2xl text-paper/80">{t.program.testimonials.intro}</p>
          <Testimonials items={t.program.testimonials.items} isKo={isKo} />
        </div>
      </section>
    </>
  );
}
