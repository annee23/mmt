 "use client";

import { useState } from "react";

type Quote = { en: string; ko: string };
type Item = { number: number; name: string; location: string | null; reversed?: boolean; quotes: Quote[] };

export function Testimonials({ items, isKo }: { items: Item[]; isKo: boolean }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const item = items[index];
  const previous = () => setIndex((index - 1 + items.length) % items.length);
  const next = () => setIndex((index + 1) % items.length);

  return (
    <div className="mt-12">
      <article className="border-t border-bronze/50 pt-6">
        <p className="font-title text-lg text-bronze">
          {String(item.number).padStart(2, "0")} — {item.name}
          {item.location ? <span className="text-paper/70">, {item.location}</span> : null}
        </p>
        {item.quotes.map((q, k) => {
          const koreanSpeaker = item.reversed;
          const primary = koreanSpeaker ? { text: q.ko, lang: "ko" } : { text: q.en, lang: "en" };
          const secondary = koreanSpeaker ? { text: q.en, lang: "en" } : { text: q.ko, lang: "ko" };
          return (
            <blockquote key={k} className="mt-4">
              <p lang={primary.lang} className={`${primary.lang === "en" ? "font-title text-[1.15rem] italic" : "font-serif-kr text-[1.0rem]"} leading-relaxed`}>“{primary.text}”</p>
              <p lang={secondary.lang} className="mt-2 text-[0.92rem] leading-relaxed text-paper/65">{secondary.text}</p>
            </blockquote>
          );
        })}
      </article>
      <div className="mt-8 flex items-center justify-between">
        <span className="text-sm text-paper/60">{index + 1} / {items.length}</span>
        <div className="flex gap-3">
          <button type="button" onClick={previous} className="btn btn-light h-11 min-h-11 px-4" aria-label={isKo ? "이전 후기" : "Previous testimonial"}>←</button>
          <button type="button" onClick={next} className="btn btn-light h-11 min-h-11 px-4" aria-label={isKo ? "다음 후기" : "Next testimonial"}>→</button>
        </div>
      </div>
    </div>
  );
}