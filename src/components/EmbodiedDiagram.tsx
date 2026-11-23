import type { Lang } from "@/lib/i18n";

const COPY = {
  ko: {
    title: "디저리두 기반 체화된 경청",
    subtitle: "호흡 · 소리 · 진동 · 알아차림",
    venn: {
      awareness: ["Awareness", "알아차림", "감각, 감정, 신체적 반응을 알아차림"],
      listening: ["Listening", "듣기", "소리와 진동을 통해 지금 이 순간에 머묾"],
      breath: ["Breath & Vibration", "호흡과 진동", "디저리두의 드론 소리와 함께 이완된 호흡과 진동을 경험"],
      center: ["EMBODIED", "LISTENING", "체화된 경청"],
    },
    processTitle: "체화된 경청의 과정",
    steps: [
      ["BREATH", "호흡", "호흡과 함께 움직이는 신체를 알아차립니다."],
      ["SOUND", "소리", "호흡을 통해 만들어지는 소리에 귀 기울입니다."],
      ["VIBRATION", "진동", "신체를 통해 전해지는 진동을 느낍니다."],
      ["AWARENESS", "알아차림", "감각, 감정, 신체적 반응을 알아차립니다."],
      ["EMBODIED LISTENING", "체화된 경청", "소리와 신체를 함께 듣고 경험합니다."],
    ],
    benefitsTitle: "프로그램의 이점",
    benefits: ["알아차림", "이완", "신체 감각 인식", "현재에 머무는 경청"],
  },
  en: {
    title: "Didgeridoo-based Embodied Listening",
    subtitle: "Breath · Sound · Vibration · Awareness",
    venn: {
      awareness: ["Awareness", "알아차림", "Notice your sensations, emotions and bodily responses."],
      listening: ["Listening", "듣기", "Open to the sound, vibration and the present moments."],
      breath: ["Breath & Vibration", "호흡과 진동", "Connect through your breath, sounds and bodily resonance."],
      center: ["EMBODIED", "LISTENING", "체화된 경청"],
    },
    processTitle: "The Process of Embodied Listening",
    steps: [
      ["BREATH", "호흡", "Notice how the body moves with the breath."],
      ["SOUND", "소리", "Listen to the sound created through the breath."],
      ["VIBRATION", "진동", "Feel the vibration through the body."],
      ["AWARENESS", "알아차림", "Notice sensations, emotions and bodily responses."],
      ["EMBODIED LISTENING", "체화된 경청", "Listen to the sound and the body together."],
    ],
    benefitsTitle: "Program Benefits",
    benefits: ["Awareness", "Relaxation", "Body Awareness", "Present-Moment Listening"],
  },
} as const;

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Pictogram({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden className="shrink-0 text-brown/70">
      <circle cx="28" cy="28" r="26" {...stroke} />
      {i === 0 && (
        <g {...stroke}>
          <path d="M14 22c4-4 7 4 14 0s10 4 14 0" />
          <path d="M14 29c4-4 7 4 14 0s10 4 14 0" />
          <path d="M14 36c4-4 7 4 14 0s10 4 14 0" />
        </g>
      )}
      {i === 1 && (
        <g {...stroke}>
          {[15, 20, 25, 30, 35, 40].map((x, k) => {
            const h = [4, 9, 14, 8, 11, 5][k];
            return <path key={x} d={`M${x} ${28 - h}v${h * 2}`} />;
          })}
        </g>
      )}
      {i === 2 && (
        <g {...stroke}>
          <circle cx="28" cy="28" r="4" />
          <circle cx="28" cy="28" r="9" />
          <circle cx="28" cy="28" r="14" />
        </g>
      )}
      {i === 3 && (
        <g {...stroke}>
          <circle cx="28" cy="21" r="6" />
          <path d="M15 43c1-8 6-12 13-12s12 4 13 12" />
        </g>
      )}
      {i === 4 && (
        <g {...stroke}>
          <path d="M28 18c4 4 4 12 0 16c-4-4-4-12 0-16z" />
          <path d="M28 34c-6 0-11-4-12-11c6 0 10 3 12 8" />
          <path d="M28 34c6 0 11-4 12-11c-6 0-10 3-12 8" />
          <path d="M14 36c4 5 9 6 14 6s10-1 14-6" />
        </g>
      )}
    </svg>
  );
}

/** Original pictogram-style redraw of the "Embodied Listening" diagram (vector, bilingual, responsive). */
export function EmbodiedDiagram({ lang, className = "" }: { lang: Lang; className?: string }) {
  const c = COPY[lang];
  const isKo = lang === "ko";
  const label = (en: string, ko: string, x: number, y: number) => (
    <text x={x} y={y} textAnchor="middle" fill="currentColor">
      <tspan fontFamily="var(--f-display)" fontSize="18" fontStyle="italic" x={x} dy="0">{en}</tspan>
      <tspan fontFamily="var(--f-sans)" fontSize="14" fontWeight="700" x={x} dy="20">{ko}</tspan>
    </text>
  );
  return (
    <figure className={`text-brown ${className}`} aria-label={c.title}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-title text-[clamp(1.2rem,2.6vw,1.7rem)]">Didgeridoo-based Embodied Listening</p>
        {isKo && <p className="font-title-kr mt-1 text-[clamp(1rem,2vw,1.3rem)]">{c.title}</p>}
        <p className="mt-2 text-[0.85rem] tracking-[0.14em] text-brown/70">{c.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div>
          <svg viewBox="0 0 520 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Awareness · Listening · Breath & Vibration" className="mx-auto w-full max-w-lg overflow-visible text-brown/70">
            <g fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="170" cy="150" r="118" />
              <circle cx="350" cy="150" r="118" />
              <circle cx="260" cy="280" r="118" />
            </g>
            <path d="M260 105c-28 22-43 50-43 78 0 33 16 58 43 70 27-12 43-37 43-70 0-28-15-56-43-78z" fill="rgb(246 169 194 / .16)" stroke="currentColor" strokeWidth="1.3" />
            <g className="text-brown">
              {label(c.venn.awareness[0], c.venn.awareness[1], 122, 104)}
              {label(c.venn.listening[0], c.venn.listening[1], 398, 104)}
              {label(c.venn.breath[0], c.venn.breath[1], 260, 370)}
              <text x="260" y="188" textAnchor="middle" fill="currentColor">
                <tspan fontFamily="var(--f-display)" fontSize="13" letterSpacing="1.4" x="260">{c.venn.center[0]}</tspan>
                <tspan fontFamily="var(--f-display)" fontSize="13" letterSpacing="1.4" x="260" dy="16">{c.venn.center[1]}</tspan>
                <tspan fontFamily="var(--f-sans)" fontSize="12" fontWeight="700" x="260" dy="18">{c.venn.center[2]}</tspan>
              </text>
            </g>
          </svg>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-[0.85rem] leading-relaxed text-brown/80">
            {[c.venn.awareness, c.venn.listening, c.venn.breath].map(([en, , d]) => (
              <li key={en}>
                <span className="font-title mr-2 text-[0.95rem] italic">{en}</span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={isKo ? "font-title-kr text-[1.05rem]" : "font-title text-[1.15rem] italic"}>{c.processTitle}</p>
          <ol className="mt-4 border-t border-[var(--rule)]">
            {c.steps.map(([en, ko, d], i) => (
              <li key={en} className="flex items-center gap-4 border-b border-[var(--rule)] py-3">
                <Pictogram i={i} />
                <div className="min-w-0">
                  <p className="text-[0.82rem] tracking-[0.14em] text-brown/70">
                    <span className="font-title mr-2 text-[1rem]">{i + 1}.</span>
                    {en} <span className="ml-1 font-bold tracking-normal text-brown">{ko}</span>
                  </p>
                  <p className="mt-0.5 text-[0.88rem] leading-snug text-brown/80">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--rule)] pt-5 text-center">
        <p className="font-title text-[1.05rem]">{c.benefitsTitle}</p>
        <p className="mt-1 text-[0.85rem] text-brown/80">{c.benefits.join("  ·  ")}</p>
      </div>
    </figure>
  );
}
