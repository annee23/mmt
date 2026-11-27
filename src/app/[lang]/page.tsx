import Image from "next/image";
import Link from "next/link";
import { STATIC_SITE } from "@/lib/static-mode";
import { ApplyLink } from "@/components/ApplyLink";
import { notFound } from "next/navigation";
import { Chapter, Paragraphs, Rich, safeHref } from "@/components/ui";
import { Photo } from "@/components/Photo";
import { Newsletter } from "@/components/Newsletter";
import { LegacyHashRedirect } from "@/components/LegacyHashRedirect";
import { getContent } from "@/lib/content";
import { getUI, isLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/env";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = await getContent(lang);
  const ui = getUI(lang);
  const isKo = lang === "ko";
  const ch = ui.chapters;
  const titleFont = isKo ? "font-title-kr" : "font-title";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jin Sarang",
    alternateName: "진사랑",
    jobTitle: ["Music Therapist", "Didgeridoo Artist"],
    url: `${siteUrl()}/${lang}`,
    image: `${siteUrl()}/images/videos/instrument.jpg`,
    email: t.contact.email,
    sameAs: [t.contact.instagramUrl, t.research.writing.href],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <LegacyHashRedirect lang={lang} />

      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-brown text-paper md:min-h-[calc(100svh-4.75rem)]">
        <Photo
          src="/images/videos/instrument.jpg"
          alt={isKo ? "지하철 승강장에서 디저리두를 든 진사랑의 뒷모습" : "Jin Sarang from behind, holding her didgeridoo on a station platform"}
          priority
          sizes="100vw"
          ratio="16/9"
          position="75% 40%"
          className="!absolute inset-0 -z-10 !aspect-auto h-full w-full"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#241b15]/85 via-[#241b15]/35 to-[#241b15]/5 md:bg-gradient-to-r md:from-[#241b15]/80 md:via-[#241b15]/30 md:to-transparent" />
        <Image
          src="/images/brand/heart-snake.png"
          alt=""
          width={700}
          height={700}
          sizes="72px"
          priority
          className="absolute left-1/2 top-5 z-20 h-16 w-16 -translate-x-1/2 object-contain brightness-0 invert md:top-8 md:h-20 md:w-20"
        />
        <div className="wrap w-full pb-12 pt-32 md:pb-20">
          <p className="rise font-title text-[0.8rem] tracking-[0.2em] text-paper/80 uppercase sm:text-[0.95rem] sm:tracking-[0.3em]">{ui.heroNote}</p>
          <h1 id="hero-title" className="rise rise-2 font-title mt-5 max-w-[16em] text-right text-[clamp(1.75rem,3.8vw,3.25rem)] leading-[1.08] italic font-medium md:text-left">
            {t.hero.philosophy.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h1>
          <div className="rise rise-3 mt-8 flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className={`${titleFont} text-2xl md:text-2xl`}>{t.hero.name}</p>
              <p className="mt-1 text-[0.98rem] text-paper/85">{t.hero.role}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/program`} className="btn btn-light">
                {ui.explorePrograms}
              </Link>
              <ApplyLink lang={lang} className="btn btn-light-solid">
                {ui.apply}
              </ApplyLink>
            </div>
          </div>
        </div>
      </section>
      <div className="border-b border-[var(--rule)] bg-paper">
        <ul className="wrap flex flex-wrap gap-x-8 gap-y-1 py-3 font-title text-[0.95rem] tracking-[0.12em] text-brown/80">
          {t.hero.meta.map((m) => (
            <li key={m.label} className={"dim" in m && m.dim ? "text-brown/55" : ""}>
              {m.label}
            </li>
          ))}
        </ul>
      </div>

      {/* 01 ABOUT */}
      <section id="journey" aria-labelledby="journey-title" className="wrap scroll-mt-24 py-20 md:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-28">
              <Photo src="/images/performances/perf-19.jpg" alt={isKo ? "연주 중인 진사랑" : "Jin Sarang playing the didgeridoo"} ratio="4/5" sizes="(min-width:768px) 40vw, 100vw" />
              <p className="plate-caption mt-3">
                {ui.plate} I — {t.hero.name}
              </p>
            </div>
          </div>
          <div className="md:col-span-7 md:pt-6">
            <Chapter no="01" label={ch.journey} />
            <h2 id="journey-title" className={`${titleFont} mt-6 text-[clamp(1.41rem,2.9vw,2.3rem)]`}>
              {t.hero.name}
              <span className="mt-2 block font-title text-[0.5em] italic font-normal text-bronze-deep">{t.hero.role}</span>
            </h2>
            <div className="prose-body mt-10 max-w-[38rem] text-[0.97rem] leading-[1.95]">
              {t.hero.bio.map((p, i) => (
                <p key={i} className={i === 0 && !isKo ? "dropcap" : i === 0 ? "text-[1.05rem]" : ""}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 md:gap-8">
          {t.videos.map((v) => (
            <a key={v.href} href={safeHref(v.href)} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="film relative aspect-video">
                <Image src={v.image} alt={v.alt} fill sizes="(min-width:768px) 45vw, 100vw" quality={75} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <span aria-hidden className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 text-paper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </div>
              <p className={`${titleFont} mt-4 text-xl`}>
                {v.title} <span className="font-[family-name:var(--f-sans)] text-sm text-bronze-deep">{ui.watch}</span>
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* 03 RESEARCH */}
      <section id="research" aria-labelledby="research-title" className="wrap scroll-mt-24 py-20 md:py-32">
        <div className="grid gap-12 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-4">
            <Chapter no="02" label={ch.research} />
            <h2 id="research-title" className={`${titleFont} mt-6 text-[clamp(1.34rem,2.6vw,2.11rem)]`}>
              {t.research.heading}
            </h2>
            <figure className="mt-10 max-w-xs">
              <Photo src={t.thesis.photo} alt={ui.thesisNote} sizes="(min-width:768px) 25vw, 70vw" />
              <figcaption className="plate-caption mt-3">
                {ui.plate} III — {t.thesis.heading}
              </figcaption>
            </figure>
            {t.thesis.summary && <Paragraphs text={t.thesis.summary} className="mt-6" />}
          </div>
          <div className="md:col-span-8">
            <ol className="border-t border-[var(--rule-strong)]">
              {t.research.items.map((item, i) => (
                <li key={item.title} className="grid gap-3 border-b border-[var(--rule)] py-8 md:grid-cols-[4rem_1fr]">
                  <span className="font-title text-xl text-bronze-deep">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className={`${titleFont} text-xl`}>{item.title}</h3>
                    <Paragraphs text={item.description} className="mt-3 max-w-2xl" />
                    {"link" in item && item.link && (
                      <a href={safeHref(item.link.href)} target="_blank" rel="noopener noreferrer" className="link-u mt-3 inline-block text-[0.95rem] text-burgundy">
                        {item.link.label} ↗
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <Link href={`/${lang}/research`} className="btn mt-10">
              {t.nav.research} →
            </Link>
          </div>
        </div>
      </section>

      {/* recommendations and advisory board */}
      <section id="recommendations" aria-labelledby="recommendations-title" className="wrap scroll-mt-24 py-20 md:py-32">
        <Chapter no="04" label={isKo ? "RECOMMENDATION" : "RECOMMENDATIONS"} />
        <h2 id="recommendations-title" className={`${titleFont} mt-6 text-[clamp(1.34rem,2.6vw,2.11rem)]`}>
          {t.recommendation.heading}
        </h2>
        <p className="mt-5 max-w-3xl text-brown/80">{t.recommendation.intro}</p>
        <div className="mt-12 space-y-14">
          {t.recommendation.letters.map((letter, i) => {
            const paragraphs = isKo ? letter.paragraphsKo : letter.paragraphs;
            const name = isKo ? letter.nameKo : letter.name;
            const role = isKo ? letter.titleKo : letter.title;
            const affiliation = isKo ? letter.affiliationKo : letter.affiliation;
            return (
              <article key={i} className="grid gap-8 border-t border-[var(--rule-strong)] pt-8 md:grid-cols-12 md:gap-12">
                <header className="md:col-span-3">
                  {letter.photo && <Photo src={letter.photo} alt={name} ratio="1/1" sizes="(min-width:768px) 20vw, 60vw" className="mb-5 max-w-[14rem]" />}
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

        <div className="mt-20 border-t border-[var(--rule-strong)] pt-10">
          <Chapter no="05" label="ADVISORY BOARD" />
          <h3 className={`${titleFont} mt-6 text-[clamp(1.34rem,2.6vw,2.11rem)]`}>{t.advisoryBoard.heading}</h3>
          <p className="mt-5 max-w-3xl text-brown/80">{t.advisoryBoard.description}</p>
          <ul className="mt-10 grid gap-10 md:grid-cols-3">
            {t.advisoryBoard.members.map((member, i) => (
              <li key={i} className="border-t border-[var(--rule)] pt-6">
                <span className="font-title text-lg text-glow-pink">{String(i + 1).padStart(2, "0")}</span>
                <p className={`${titleFont} mt-3 text-xl`} lang="ko">{member.linesKo[0]}</p>
                <p className="mt-1 font-title text-base text-brown/65" lang="en">{member.linesEn[0]}</p>
                <ul className="mt-4 space-y-1.5 text-[0.95rem] text-brown/80">
                  {member.linesKo.slice(1).map((line, k) => (
                    <li key={`ko-${k}`} lang="ko">
                      {line}
                      {member.linesEn[k + 1] && <span lang="en" className="mt-1 block text-brown/60">{member.linesEn[k + 1]}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* gratitude */}
      <section aria-label={isKo ? t.culturalRespect.titleKo : t.culturalRespect.titleEn} className="wrap py-20 text-center md:py-28">
        <p className="font-title text-base tracking-[0.2em] text-bronze-deep uppercase">
          {t.culturalRespect.titleKo} / {t.culturalRespect.titleEn}
        </p>
        <div className="font-title mx-auto mt-5 max-w-3xl space-y-2 text-[1.05rem] italic leading-[1.45]">
          {t.culturalRespect.bodyKo.map((line, i) => (
            <div key={line}>
              <p lang="ko">{line}</p>
              {t.culturalRespect.bodyEn[i] && (
                <p lang="en" className="mt-1 text-[0.72em] not-italic text-brown/70">{t.culturalRespect.bodyEn[i]}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 07 NEWSLETTER + 08 CONTACT */}
      <section id="contact" aria-label={`${ch.newsletter} / ${ch.contact}`} className="wrap grid scroll-mt-24 gap-16 border-t border-[var(--rule-strong)] py-20 md:grid-cols-2 md:py-28">
        {!STATIC_SITE && (
        <div id="newsletter" className="scroll-mt-24">
          <Chapter no="07" label={ch.newsletter} />
          <div className="mt-8">
            <Newsletter copy={t.hero.subscribeButton} lang={lang} />
          </div>
        </div>
        )}
        <div>
          <Chapter no={STATIC_SITE ? "07" : "08"} label={ch.contact} />
          <h2 className={`${titleFont} mt-8 text-2xl md:text-2xl`}>{t.contact.heading}</h2>
          <dl className="mt-6 space-y-4">
            <div>
              <dt className="text-sm text-bronze-deep">{ui.contact.email}</dt>
              <dd>
                <a className="link-u font-title text-xl" href={`mailto:${t.contact.email}`}>{t.contact.email}</a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-bronze-deep">{ui.contact.instagram}</dt>
              <dd>
                <a className="link-u font-title text-xl" href={safeHref(t.contact.instagramUrl)} target="_blank" rel="noopener noreferrer">
                  @{t.contact.instagramHandle} ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
