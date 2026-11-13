import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { SessionList, StateBadge } from "@/components/program";
import { getContent } from "@/lib/content";
import { getUI, isLang } from "@/lib/i18n";
import { getProgram } from "@/lib/programs";

export async function generateMetadata({ params }: PageProps<"/[lang]/program/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const p = await getProgram(lang, slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/${lang}/program/${slug}`, languages: { ko: `/ko/program/${slug}`, en: `/en/program/${slug}` } },
    openGraph: { title: p.name, description: p.summary, images: [{ url: p.image }] },
  };
}

export default async function ProgramDetail({ params }: PageProps<"/[lang]/program/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const program = await getProgram(lang, slug);
  if (!program) notFound();
  const [t, ui] = [await getContent(lang), getUI(lang)];
  const na = <span className="text-brown/55">{ui.toBeAnnounced}</span>;

  const rows: [string, React.ReactNode][] = [
    [ui.program.format, program.format || na],
    [ui.program.composition, program.composition || na],
    [ui.program.target, program.target || na],
    [ui.program.duration, program.duration || na],
    [ui.program.location, program.location || na],
    [ui.program.fee, program.fee || na],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: program.name,
    description: program.summary,
    organizer: { "@type": "Person", name: "Jin Sarang" },
    ...(program.sessions[0] ? { eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode" } : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap pt-10 md:pt-16">
        <Link href={`/${lang}/program`} className="link-u font-title text-lg tracking-wide">
          {ui.program.back}
        </Link>
      </div>

      <header className="wrap grid gap-10 pb-14 pt-8 md:grid-cols-12 md:gap-14 md:pb-20">
        <div className="md:col-span-7 md:pt-6">
          <Chapter no="—" label={program.format || t.program.heading} />
          <h1 className="font-title mt-6 text-[clamp(2.4rem,6vw,4.8rem)]">{program.name}</h1>
          <p className="mt-6 max-w-xl text-[1.1rem] leading-[1.9]">{program.summary}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <StateBadge state={program.state} ui={ui} />
            {program.deadlineText && program.state === "open" && (
              <span className="text-sm text-brown/65">
                {ui.program.deadline} {program.deadlineText}
              </span>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {program.state === "open" ? (
              <Link href={`/${lang}/apply?program=${program.slug}`} className="btn btn-solid">
                {ui.apply}
              </Link>
            ) : (
              <span className="btn" aria-disabled="true">
                {program.state === "upcoming" ? ui.program.upcoming : ui.program.closed}
              </span>
            )}
          </div>
        </div>
        <div className="md:col-span-5">
          <Photo src={program.image} alt={program.name} ratio="4/5" priority sizes="(min-width:768px) 40vw, 100vw" />
        </div>
      </header>

      <section aria-labelledby="intro" className="wrap grid gap-10 border-t border-[var(--rule-strong)] py-14 md:grid-cols-12 md:gap-14 md:py-20">
        <h2 id="intro" className="font-title text-3xl md:col-span-4">
          {ui.program.intro}
        </h2>
        <div className="md:col-span-8">
          {program.description ? <Paragraphs text={program.description} className="max-w-2xl text-[1.04rem]" /> : <p className="max-w-2xl text-[1.04rem] leading-[1.95]">{program.summary}</p>}
          <dl className="mt-10 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-title text-lg text-bronze-deep">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {program.slug === "embodied-listening" && (
        <section aria-label={t.program.highlight.alt} className="wrap pb-14 md:pb-20">
          <div className="border border-bronze/60 bg-paper p-2 md:p-3">
            <Photo src={t.program.highlight.image} alt={t.program.highlight.alt} plain sizes="(min-width:1024px) 1100px, 100vw" />
          </div>
        </section>
      )}

      <section aria-labelledby="schedule" className="wrap grid gap-10 border-t border-[var(--rule-strong)] py-14 md:grid-cols-12 md:gap-14 md:py-20">
        <h2 id="schedule" className="font-title text-3xl md:col-span-4">
          {ui.program.schedule}
        </h2>
        <div className="md:col-span-8">
          <SessionList lang={lang} program={program} ui={ui} />
          <div className="mt-8">
            {program.state === "open" ? (
              <Link href={`/${lang}/apply?program=${program.slug}`} className="btn btn-solid">
                {ui.apply}
              </Link>
            ) : (
              <p className="text-brown/70">{program.state === "upcoming" ? ui.program.upcoming : ui.program.closed}</p>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
