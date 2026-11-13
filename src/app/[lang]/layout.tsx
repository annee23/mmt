import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontVars } from "@/fonts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content";
import { LANGS, getUI, isLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/env";

// Content, programs and seat counts are editable in /admin, so pages are rendered per request.
export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getContent(lang);
  const title = lang === "ko" ? "진사랑 | 메디컬 음악치료사 · 디저리두 연주자" : "Jin Sarang | Music Therapist & Didgeridoo Artist";
  const description =
    lang === "ko"
      ? "메디컬 음악치료사이자 디저리두 연주자 진사랑의 연구, 임상, 공연 아카이브와 프로그램 신청."
      : "An archive of sound, breath and healing — research, clinical work, performances and programs by Jin Sarang, medical music therapist and didgeridoo artist.";
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${t.hero.name}` },
    description,
    alternates: { languages: { ko: "/ko", en: "/en" } },
    openGraph: {
      type: "website",
      siteName: "Jin Sarang",
      title,
      description,
      locale: lang === "ko" ? "ko_KR" : "en_US",
      images: [{ url: "/images/videos/instrument.jpg", width: 1600, height: 900 }],
    },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/favicon.png" },
  };
}

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [t, ui] = [await getContent(lang), getUI(lang)];
  const nav = [
    { key: "program", label: t.nav.program, href: `/${lang}/program` },
    { key: "research", label: t.nav.research, href: `/${lang}/research` },
    { key: "workshops", label: t.nav.workshops, href: `/${lang}/workshops` },
    { key: "performances", label: t.nav.performances, href: `/${lang}/performances` },
  ];
  return (
    <html lang={lang} className={fontVars}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2"
        >
          {ui.skip}
        </a>
        <Header
          lang={lang}
          nav={nav}
          brand={t.nav.name}
          menuLabel={ui.menu}
          closeLabel={ui.close}
          switchLabel={ui.language}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer lang={lang} t={t} ui={ui} />
      </body>
    </html>
  );
}
