"use client";
import type { Memo } from "@/lib/agent";
import type { QlooCall } from "@/lib/qloo";
import type { Ranked, RunState } from "./state";
import { UsMap } from "./UsMap";

export function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-6">
      <h3 className="font-display text-2xl">{title}</h3>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
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
    <div className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <div className="relative h-2.5 rounded-full bg-line">
        <div className="absolute top-0 h-full w-px bg-muted/60" style={{ left: "50%" }} />
        <div
          className={`absolute top-0 h-full rounded-full ${value >= 0 ? "bg-accent" : "bg-muted/50"}`}
          style={value >= 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
        />
      </div>
      <span className="text-right tabular-nums">{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
    </div>
  );
}

export function AudiencePanel({ a }: { a: NonNullable<RunState["audience"]> }) {
  return (
    <Card title="Who the audience is" note="Lean versus the average Qloo audience. Plus means over-represented.">
      <div className="space-y-2">
        {Object.entries(a.age).map(([k, v]) => <Lean key={k} label={AGE_LABEL[k] ?? k} value={v} />)}
        {Object.entries(a.gender).map(([k, v]) => <Lean key={k} label={k[0].toUpperCase() + k.slice(1)} value={v} />)}
      </div>
      {a.themes.length > 0 && (
        <>
          <p className="mt-6 text-sm text-muted">What the film means to them</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.themes.map((t) => <span key={t} className="rounded-full bg-panel-2 px-3 py-1 text-sm">{t}</span>)}
          </div>
        </>
      )}
      {a.sharedWithMusicalFans.length > 0 && (
        <>
          <p className="mt-5 text-sm text-muted">Common ground with musical-theatre fans</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.sharedWithMusicalFans.map((t) => <span key={t} className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent">{t}</span>)}
          </div>
        </>
      )}
    </Card>
  );
}

export function TourPanel({ t }: { t: NonNullable<RunState["tour"]> }) {
  return (
    <Card title="Where to tour" note="US areas where this film's audience over-indexes, matched to touring markets.">
      <UsMap cells={t.cells} markets={t.markets} />
      <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {t.markets.map((m, i) => (
          <li key={m.name}><span className="text-muted">{i + 1}.</span> {m.name}</li>
        ))}
      </ol>
    </Card>
  );
}

function NameList({ label, items }: { label: string; items: Ranked[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((x) => (
          <li key={x.id} className="flex items-baseline justify-between gap-3">
            <span className="text-lg">{x.name}</span>
            <span className="text-sm tabular-nums text-muted">{x.affinity.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CreativePanel({ c }: { c: NonNullable<RunState["creative"]> }) {
  return (
    <Card title="Who they'd come to see" note="Performers and musicians this audience loves. A starting list for casting and the score, not an offer list.">
      <div className="grid gap-8 sm:grid-cols-2">
        <NameList label="Performers" items={c.performers} />
        <NameList label="Musicians" items={c.musicians} />
      </div>
    </Card>
  );
}

export function PartnersPanel({ p }: { p: NonNullable<RunState["partners"]> }) {
  return (
    <Card title="Where to reach them" note="Brands, podcasts and TV this audience over-indexes on, for sponsorship and ad buys.">
      <div className="grid gap-8 sm:grid-cols-3">
        <NameList label="Brands" items={p.brands} />
        <NameList label="Podcasts" items={p.podcasts} />
        <NameList label="TV" items={p.tvShows} />
      </div>
    </Card>
  );
}

export function MemoPanel({ m }: { m: Memo }) {
  return (
    <section className="rounded-2xl border border-accent/40 bg-panel p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm uppercase tracking-widest text-accent">Greenlight memo</p>
        <button onClick={() => window.print()} className="no-print rounded-full border border-line px-4 py-1.5 text-sm text-muted hover:text-ink">
          Print or save as PDF
        </button>
      </div>
      <h2 className="mt-3 font-display text-4xl leading-tight">{m.headline}</h2>
      <p className="mt-4 text-lg">{m.recommendation}</p>
      <h4 className="mt-8 font-display text-xl">Why</h4>
      <ul className="mt-3 space-y-3">
        {m.reasons.map((r, i) => (
          <li key={i}>
            <p>{r.claim}</p>
            <p className="text-sm text-muted">Evidence: {r.evidence}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {([["Audience", m.audience], ["Tour", m.tour], ["Creative", m.creative], ["Marketing", m.marketing]] as const).map(([k, v]) => (
          <div key={k}>
            <h4 className="font-display text-xl">{k}</h4>
            <p className="mt-1 text-sm leading-relaxed">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="font-display text-xl">Risks</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{m.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
        <div>
          <h4 className="font-display text-xl">Next steps</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{m.nextSteps.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

const TOOL_LABEL: Record<string, string> = {
  resolve_films: "Match titles to Qloo films",
  score_films: "Score audience fit",
  audience_profile: "Profile the audience",
  tour_markets: "Find touring markets",
  creative_team: "Find performers and musicians",
  marketing_partners: "Find marketing partners",
};

function CallLine({ c }: { c: QlooCall }) {
  return (
    <li className="flex justify-between gap-2 font-mono text-xs text-muted">
      <span className="truncate">
        {c.tool.replace("qloo_", "")}
        <span className={c.status === "ok" ? "text-strong" : "text-accent"}> {c.status}</span>
      </span>
      <span className="shrink-0 tabular-nums">{c.cached ? "cached" : `${c.ms} ms`}</span>
    </li>
  );
}

export function Trace({ s }: { s: RunState }) {
  const total = s.steps.reduce((n, st) => n + st.calls.length, 0);
  return (
    <aside className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl">Agent trace</h3>
        <span className="text-xs text-muted">{total} Qloo calls</span>
      </div>
      <ol className="mt-4 space-y-4">
        {s.steps.map((st, i) => (
          <li key={i}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${st.done ? "bg-strong" : "animate-pulse bg-accent"}`} />
              <span className="text-sm">{TOOL_LABEL[st.tool] ?? st.tool}</span>
            </div>
            <ul className="ml-4 mt-1.5 space-y-0.5 border-l border-line pl-3">
              {st.calls.map((c, j) => <CallLine key={j} c={c} />)}
            </ul>
          </li>
        ))}
        {s.status === "running" && (
          <li className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Thinking
          </li>
        )}
      </ol>
      {s.thoughts.length > 0 && (
        <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
          {s.thoughts.map((t, i) => <p key={i} className="mt-2">{t}</p>)}
        </div>
      )}
    </aside>
  );
}
