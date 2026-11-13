import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getPrograms } from "@/lib/programs";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages = ["", "/program", "/research", "/workshops", "/performances", "/apply"];
  const programs = await getPrograms("ko");
  const entry = (path: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}/ko${path}`,
    alternates: { languages: { ko: `${base}/ko${path}`, en: `${base}/en${path}` } },
  });
  return [...pages.map(entry), ...programs.map((p) => entry(`/program/${p.slug}`))];
}
