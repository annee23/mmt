import type { Metadata } from "next";
import { ApplyLink } from "@/components/ApplyLink";
import { notFound } from "next/navigation";
import { Chapter, Rich } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { EmbodiedDiagram } from "@/components/EmbodiedDiagram";
import { StateBadge } from "@/components/program";
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

      {programs.map((p, i) => (
        <section key={p.id} id={p.slug} aria-labelledby={`${p.slug}-title`} className={`scroll-mt-24 border-t border-[var(--rule-strong)] ${i % 2 ? "bg-paper" : ""}`}>
          <div className={`wrap grid gap-10 py-16 md:grid-cols-12 md:gap-14 md:py-24`}>
            <div className={`md:col-span-5 ${i % 2 ? "md:order-2" : ""}`}>
              <Photo src={p.image} alt={p.name} ratio="4/5" sizes="(min-width:768px) 40vw, 100vw" />
            </div>
            <div className={`md:col-span-7 ${i % 2 ? "md:order-1" : ""} md:pt-4`}>
              <Chapter no="06" label={p.format} />
              <h2 id={`${p.slug}-title`} className="font-title mt-6 text-[clamp(1.28rem,2.7vw,2.18rem)]">{p.name}</h2>
              <p className="mt-6 max-w-xl text-[1.0rem] leading-[1.9]">{p.summary}</p>
              <dl className="mt-8 grid max-w-xl gap-x-8 gap-y-3 border-t border-[var(--rule)] pt-6 text-[0.95rem] sm:grid-cols-[8rem_1fr]">
                <dt className="text-bronze-deep">{ui.program.availability}</dt>
                <dd><StateBadge state={p.state} ui={ui} /></dd>
                <dt className="text-bronze-deep">{ui.program.schedule}</dt>
                <dd>{p.sessions.length ? p.sessions.slice(0, 3).map((s) => s.dateText).join(" · ") + (p.sessions.length > 3 ? " …" : "") : ui.toBeAnnounced}</dd>
                <dt className="text-bronze-deep">{ui.program.fee}</dt>
                <dd>{p.fee || ui.toBeAnnounced}</dd>
              </dl>
              <h3 className="sr-only">{p.name}</h3>
            </div>
          </div>
          {p.slug === "embodied-listening" && (
            <div className="wrap pb-16 md:pb-24">
              <div className="border border-bronze/60 bg-paper p-5 md:p-10">
                <EmbodiedDiagram lang={lang} />
              </div>
            </div>
          )}
        </section>
      ))}

      <section className="wrap py-14 text-center">
        <ApplyLink lang={lang} className="btn btn-solid">{t.program.highlight.applyLabel}</ApplyLink>
        <a href={`mailto:${t.contact.email}?subject=${subject}`} className="btn">
          {ui.inquiry}
        </a>
      </section>

      <section aria-labelledby="exp-title" className="bg-brown text-paper">
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
