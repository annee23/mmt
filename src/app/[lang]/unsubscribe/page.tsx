import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnsubscribeForm } from "@/components/UnsubscribeForm";
import { getUI, isLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ params, searchParams }: PageProps<"/[lang]/unsubscribe">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const token = (await searchParams).token;
  const ui = getUI(lang);
  return (
    <div className="wrap py-24 md:py-32">
      <UnsubscribeForm token={typeof token === "string" ? token : ""} copy={ui.newsletter} />
    </div>
  );
}
