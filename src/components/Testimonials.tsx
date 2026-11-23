"use client";

import { useState } from "react";

type Quote = { en: string; ko: string };
type Item = { number: number; name: string; location: string | null; quotes: Quote[] };

export function Testimonials({ items, isKo }: { items: Item[]; isKo: boolean }) {
  const [index, setIndex] = useState(0);
  const item = items[index];

  if (!item) return null;

  const move = (delta: number) => setIndex((index + delta + items.length) % items.length);

  return (
    <div className="mt-14">
      <article className="border-t border-bronze/50 pt-6">
        <p className="font-title text-lg text-bronze">
          {String(item.number).padStart(2, "0")} — {item.name}
          {item.location ? <span className="text-paper/70">, {item.location}</span> : null}
        </p>
        {item.quotes.map((q, k) => {
          const primary = isKo ? { text: q.ko, lang: "ko" } : { text: q.en, lang: "en" };
          const secondary = isKo ? { text: q.en, lang: "en" } : { text: q.ko, lang: "ko" };
          return (
            <blockquote key={k} className="mt-4">
              <p lang={primary.lang} className={`${primary.lang === "en" ? "font-title text-[1.15rem] italic" : "font-serif-kr text-[1.0rem]"} leading-relaxed`}>
                &ldquo;{primary.text}&rdquo;
              </p>
              <p lang={secondary.lang} className="mt-2 text-[0.92rem] leading-relaxed text-paper/65">{secondary.text}</p>
            </blockquote>
          );
        })}
      </article>
      {items.length > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <button type="button" className="btn btn-light btn-sm" onClick={() => move(-1)} aria-label="Previous testimonial">←</button>
          <p className="font-title text-sm text-paper/70">{index + 1} / {items.length}</p>
          <button type="button" className="btn btn-light btn-sm" onClick={() => move(1)} aria-label="Next testimonial">→</button>
        </div>
      )}
    </div>
  );
}
