import "server-only";

export type MediumPost = { title: string; url: string; image: string | null };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** Latest posts from the author's public Medium RSS feed (cached for an hour). */
export async function getMediumPosts(profileUrl: string, limit = 6): Promise<MediumPost[]> {
  const handle = profileUrl.match(/medium\.com\/(@[\w.-]+)/)?.[1];
  if (!handle) return [];
  try {
    const res = await fetch(`https://medium.com/feed/${handle}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, limit)
      .map(([, item]) => {
        const title = decode(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
        const url = decode(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").split("?")[0].trim();
        const image = item.match(/<img[^>]+src="(https:\/\/cdn-images-1\.medium\.com[^"]+)"/)?.[1] ?? null;
        return { title, url, image };
      })
      .filter((p) => p.title && p.url.startsWith("https://medium.com/"));
  } catch {
    return [];
  }
}
