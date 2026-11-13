import Link from "next/link";
import type { Lang, UI } from "@/lib/i18n";
import type { ProgramView, SessionView } from "@/lib/programs";

export function StateBadge({ state, ui }: { state: ProgramView["state"] | SessionView["state"]; ui: UI }) {
  const map = {
    open: [ui.program.open, "text-olive"],
    full: [ui.program.seatsFull, "text-bronze-deep"],
    closed: [ui.program.closed, "text-brown/55"],
    upcoming: [ui.program.upcoming, "text-bronze-deep"],
  } as const;
  const [label, tone] = map[state];
  return <span className={`badge ${tone}`}>{label}</span>;
}

export function SessionList({ lang, program, ui }: { lang: Lang; program: ProgramView; ui: UI }) {
  if (program.sessions.length === 0) return <p className="text-brown/70">{ui.program.noSchedule}</p>;
  return (
    <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
      {program.sessions.map((s) => (
        <li key={s.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-title-kr text-xl">
              {s.dateText}
              {s.title && <span className="ml-3 text-base text-brown/70">{s.title}</span>}
            </p>
            <p className="mt-1 text-[0.95rem] text-brown/80">
              {[s.timeText, s.location, s.fee].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StateBadge state={s.state} ui={ui} />
              {s.state !== "closed" && s.remaining !== null && s.remaining > 0 && (
                <span className="text-brown/70">{ui.program.seatsLeft(s.remaining)}</span>
              )}
              {s.deadlineText && s.state !== "closed" && (
                <span className="text-brown/60">
                  {ui.program.deadline} {s.deadlineText}
                </span>
              )}
            </p>
          </div>
          {s.state !== "closed" && program.state === "open" && (
            <Link href={`/${lang}/apply?program=${program.slug}&session=${s.id}`} className="btn btn-sm">
              {s.state === "full" ? ui.applyForm.sessionFull : ui.applyShort}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
