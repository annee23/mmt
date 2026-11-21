import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["ko", "en"];

function preferredLang(req: NextRequest): string {
  const saved = req.cookies.get("lang")?.value;
  if (saved && LANGS.includes(saved)) return saved;
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  const first = accept.split(",")[0] ?? "";
  return first.startsWith("ko") ? "ko" : accept ? "en" : "ko";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const first = pathname.split("/")[1];
  if (LANGS.includes(first)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLang(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|images/|favicon|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
