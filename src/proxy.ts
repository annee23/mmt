import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["ko", "en"];

function preferredLang(req: NextRequest): string {
  const saved = req.cookies.get("lang")?.value;
  if (saved && LANGS.includes(saved)) return saved;
  const accept = req.headers.get("accept-language")?.toLowerCase() ?? "";
  const first = accept.split(",")[0] ?? "";
  return first.startsWith("ko") ? "ko" : accept ? "en" : "ko";
}

/** Keeps the Supabase auth cookie fresh for /admin and sends signed-out visitors to the login page. */
async function adminSession(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;
  const isPage = pathname.startsWith("/admin");
  if (isPage && pathname !== "/admin/login" && !data.user) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return adminSession(req);
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
