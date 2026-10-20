"use client";
import type { Memo } from "@/lib/agent";
import type { QlooCall } from "@/lib/qloo";
import type { Ranked, RunState } from "./state";
import { UsMap } from "./UsMap";

export function Frame({
  id,
  index,
  title,
  note,
  children,
  className = "",
}: {
  id?: string;
  index?: string;
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`plot scroll-mt-24 ${className}`}>
      <div className="ruler" />
      <div className="p-6 sm:p-10">
        <div className="flex items-baseline gap-4">
          {index && <span className="font-mono text-xs text-accent">{index}</span>}
          <h3 className="font-display text-3xl sm:text-4xl">{title}</h3>
        </div>
        {note && <p className="mt-3 max-w-2xl text-lg text-muted">{note}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const AGE_LABEL: Record<string, string> = {
  "24_and_younger": "Under 25",
  "25_to_29": "25 to 29",
  "30_to_34": "30 to 34",
  "35_to_44": "35 to 44",
  "45_to_54": "45 to 54",
  "55_and_older": "55+",
};

function Lean({ label, value }: { label: string; value: number }) {
  const w = Math.min(50, Math.abs(value) * 50);
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3 text-base">
      <span className="font-mono text-xs uppercase text-muted">{label}</span>
      <div className="relative h-2">
        <div className="absolute inset-y-0 left-1/2 w-px bg-muted/50" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <div
          className={`absolute top-0 h-full ${value >= 0 ? "bg-accent" : "bg-muted/40"}`}
          style={value >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
        />
      </div>
      <span className="text-right font-mono text-xs tabular-nums">
        {value > 0 ? "+" : ""}
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function Chips({ items, hot }: { items: string[]; hot?: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className={`border px-3 py-1.5 text-sm ${hot ? "border-accent/60 text-ink" : "border-line text-muted"}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

export function AudiencePanel({ a }: { a: NonNullable<RunState["audience"]> }) {
  return (
    <Frame id="audience" index="03" title="The audience" note="Lean against the average Qloo audience. Right of centre means over-represented.">
      <div className="space-y-2.5">
        {Object.entries(a.age).map(([k, v]) => (
          <Lean key={k} label={AGE_LABEL[k] ?? k} value={v} />
        ))}
        <div className="h-2" />
        {Object.entries(a.gender).map(([k, v]) => (
          <Lean key={k} label={k} value={v} />
        ))}
      </div>
      {a.sharedWithMusicalFans.length > 0 && (
        <div className="mt-7">
          <span className="tag">Common ground with musical fans</span>
          <Chips items={a.sharedWithMusicalFans} hot />
        </div>
      )}
      {a.themes.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-xs uppercase text-muted">What the film means to them</p>
          <Chips items={a.themes} />
        </div>
      )}
    </Frame>
  );
}

export function TourPanel({ t }: { t: NonNullable<RunState["tour"]> }) {
  return (
    <Frame id="tour" index="04" title="Where to tour" note="US areas where this film's audience over-indexes, matched to touring markets.">
      <UsMap cells={t.cells} markets={t.markets} />
      <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {t.markets.map((m, i) => (
          <li key={m.name} className="flex items-baseline gap-3 border-t border-line pt-2">
            <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-lg">{m.name}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function NameList({ label, items }: { label: string; items: Ranked[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-mono text-xs uppercase text-muted">{label}</p>
      <ul className="mt-3">
        {items.map((x) => (
          <li key={x.id} className="flex items-baseline justify-between gap-3 border-t border-line py-2.5">
            <span className="text-lg">{x.name}</span>
            <span className="font-mono text-xs tabular-nums text-muted">{x.affinity.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CreativePanel({ c }: { c: NonNullable<RunState["creative"]> }) {
  return (
    <Frame id="talent" index="05" title="Who they'd come to see" note="Performers and musicians this audience loves. A starting list for casting and the score.">
      <div className="grid gap-8 sm:grid-cols-2">
        <NameList label="Performers" items={c.performers} />
        <NameList label="Musicians" items={c.musicians} />
      </div>
    </Frame>
  );
}

export function PartnersPanel({ p }: { p: NonNullable<RunState["partners"]> }) {
  return (
    <Frame id="partners" index="06" title="Where to reach them" note="Brands, podcasts and TV this audience over-indexes on, for sponsorship and media buys.">
      <div className="grid gap-8 sm:grid-cols-3">
        <NameList label="Brands" items={p.brands} />
        <NameList label="Podcasts" items={p.podcasts} />
        <NameList label="TV" items={p.tvShows} />
      </div>
    </Frame>
  );
}

export function MemoPanel({ m }: { m: Memo }) {
  return (
    <section id="memo" className="plot scroll-mt-24 border-accent/50">
      <div className="ruler" />
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs text-accent">02</span>
            <span className="tag">Greenlight memo</span>
          </div>
          <button onClick={() => window.print()} className="no-print font-mono text-xs uppercase text-muted hover:text-ink">
            Print / save PDF
          </button>
        </div>
        <h2 className="mt-6 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{m.headline}</h2>
        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted">{m.recommendation}</p>
        <ol className="mt-8 grid gap-px bg-line sm:grid-cols-2">
          {m.reasons.map((r, i) => (
            <li key={i} className="bg-bg p-6">
              <span className="font-mono text-xs text-accent">R{i + 1}</span>
              <p className="mt-2 text-lg font-medium leading-snug">{r.claim}</p>
              <p className="mt-2 text-base leading-relaxed text-muted">{r.evidence}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {([["Audience", m.audience], ["Tour", m.tour], ["Creative", m.creative], ["Marketing", m.marketing]] as const).map(([k, v]) => (
            <div key={k} className="border-t border-line pt-3">
              <p className="font-mono text-xs uppercase text-accent">{k}</p>
              <p className="mt-2 text-lg leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="border-t border-line pt-3">
            <p className="font-mono text-xs uppercase text-accent">Risks</p>
            <ul className="mt-2 space-y-2 text-lg leading-relaxed">
              {m.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-line pt-3">
            <p className="font-mono text-xs uppercase text-accent">Next steps</p>
            <ul className="mt-2 space-y-2 text-lg leading-relaxed">
              {m.nextSteps.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const TOOL_LABEL: Record<string, string> = {
  resolve_films: "Match titles",
  score_films: "Score audience fit",
  audience_profile: "Profile the audience",
  tour_markets: "Find touring markets",
  creative_team: "Find performers",
  marketing_partners: "Find partners",
};

function CallLine({ c }: { c: QlooCall }) {
  return (
    <li className="flex justify-between gap-2 font-mono text-xs text-muted">
      <span className="truncate">
        {c.tool.replace("qloo_", "")} <span className={c.status === "ok" ? "text-strong" : "text-middle"}>{c.status}</span>
      </span>
      <span className="shrink-0 tabular-nums">{c.cached ? "cache" : `${c.ms}ms`}</span>
    </li>
  );
}

// The agent trace, written like a stage manager's cue sheet.
export function CueSheet({ s }: { s: RunState }) {
  const total = s.steps.reduce((n, st) => n + st.calls.length, 0);
  return (
    <aside className="plot">
      <div className="ruler" />
      <div className="p-5">
        <div className="flex items-baseline justify-between">
          <span className="tag">Cue sheet</span>
          <span className="font-mono text-xs text-muted">{total} Qloo calls</span>
        </div>
        <ol className="mt-5 space-y-4">
          {s.steps.map((st, i) => (
            <li key={i}>
              <div className="flex items-center justify-between font-mono text-xs uppercase">
                <span>
                  <span className="text-accent">Cue {String(i + 1).padStart(2, "0")}</span> {TOOL_LABEL[st.tool] ?? st.tool}
                </span>
                <span className={st.done ? "text-strong" : "animate-pulse text-middle"}>{st.done ? "Go" : "Standby"}</span>
              </div>
              <ul className="mt-1.5 space-y-0.5 border-l border-line pl-3">
                {st.calls.map((c, j) => (
                  <CallLine key={j} c={c} />
                ))}
              </ul>
            </li>
          ))}
          {s.status === "running" && <li className="animate-pulse font-mono text-xs uppercase text-middle">Standby: agent thinking</li>}
          {s.memo && (
            <li className="flex justify-between font-mono text-xs uppercase">
              <span>
                <span className="text-accent">Cue {String(s.steps.length + 1).padStart(2, "0")}</span> Write the memo
              </span>
              <span className="text-strong">Go</span>
            </li>
          )}
        </ol>
      </div>
    </aside>
  );
}
