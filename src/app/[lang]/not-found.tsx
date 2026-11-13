import Link from "next/link";
import { getUI } from "@/lib/i18n";

// Rendered for unknown routes inside /[lang]; the language comes from the URL segment when present.
export default function NotFound() {
  const ui = getUI("ko");
  return (
    <div className="wrap py-32 text-center">
      <p className="chapter justify-center"><b>404</b></p>
      <h1 className="font-title-kr mt-6 text-4xl">{ui.notFound.title}</h1>
      <p className="font-title mt-2 text-xl italic text-bronze-deep">Page not found</p>
      <Link href="/" className="btn mt-10">
        {ui.notFound.back} / Home
      </Link>
    </div>
  );
}
