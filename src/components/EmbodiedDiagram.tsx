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
  return (
    <figure className={`text-brown ${className}`} aria-label={c.title}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-title text-[clamp(1.2rem,2.6vw,1.7rem)]">Didgeridoo-based Embodied Listening</p>
        {isKo && <p className="font-title-kr mt-1 text-[clamp(1rem,2vw,1.3rem)]">{c.title}</p>}
        <p className="mt-2 text-[0.85rem] tracking-[0.14em] text-brown/70">{c.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div>
          <svg
            viewBox="0 0 520 500"
            role="img"
            aria-label={c.title}
            className="mx-auto h-auto w-full max-w-[720px] overflow-visible"
          >
            <g fill="none" stroke="#a78e6a" strokeWidth="2">
              <circle cx="165" cy="155" r="125" />
              <circle cx="355" cy="155" r="125" />
              <circle cx="260" cy="300" r="125" />
            </g>
            <g fill="#3e3129" textAnchor="middle">
              <text x="165" y="82" fontFamily="Cormorant Garamond, serif" fontSize="28">Awareness</text>
              <text x="165" y="112" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="22">알아차림</text>
              <text x="165" y="142" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="16" fill="#7d6a4b">감각, 감정, 신체적 반응을</text>
              <text x="165" y="162" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="16" fill="#7d6a4b">알아차림</text>
              <text x="165" y="202" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">Notice your sensations,</text>
              <text x="165" y="222" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">emotions and bodily</text>
              <text x="165" y="242" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">responses.</text>

              <text x="355" y="82" fontFamily="Cormorant Garamond, serif" fontSize="28">Listening</text>
              <text x="355" y="112" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="22">듣기</text>
              <text x="355" y="142" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="16" fill="#7d6a4b">소리와 진동을 통해</text>
              <text x="355" y="162" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="16" fill="#7d6a4b">지금 이 순간에 머묾</text>
              <text x="355" y="202" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">Open to the sound,</text>
              <text x="355" y="222" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">vibration and the</text>
              <text x="355" y="242" fontFamily="Cormorant Garamond, serif" fontSize="15" fontStyle="italic" fill="#7d6a4b">present moments.</text>

              <text x="260" y="350" fontFamily="Cormorant Garamond, serif" fontSize="19">Breath &amp; Vibration</text>
              <text x="260" y="372" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="17">호흡과 진동</text>
              <text x="260" y="396" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="12" fill="#7d6a4b">디저리두의 드론 소리와 함께</text>
              <text x="260" y="412" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="12" fill="#7d6a4b">이완된 호흡과 진동을 경험</text>
              <text x="260" y="438" fontFamily="Cormorant Garamond, serif" fontSize="11" fontStyle="italic" fill="#7d6a4b">Connect through breath, sound and resonance.</text>

              <text x="260" y="220" fontFamily="Cormorant Garamond, serif" fontSize="17" fontWeight="400" letterSpacing="1">EMBODIED</text>
              <text x="260" y="240" fontFamily="Cormorant Garamond, serif" fontSize="17" fontWeight="400" letterSpacing="1">LISTENING</text>
              <text x="260" y="264" fontFamily="Noto Serif KR, Pretendard Variable, sans-serif" fontSize="18" fontWeight="400">체화된 경청</text>
              <text x="260" y="284" fontFamily="Cormorant Garamond, serif" fontSize="13" fontStyle="italic" fill="#7d6a4b">Listening to sound and body.</text>
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
