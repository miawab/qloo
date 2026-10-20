"use client";
import type { ScoreRow } from "./state";

const BAND_COLOR: Record<string, string> = { strong: "bg-strong", middle: "bg-middle", weak: "bg-weak" };
const BAND_TEXT: Record<string, string> = { strong: "text-strong", middle: "text-middle", weak: "text-weak" };

export function Scoreboard({ rows, pickId }: { rows: ScoreRow[]; pickId?: string }) {
  const max = Math.max(...rows.map((r) => r.affinity));
  const min = Math.min(0.7, ...rows.map((r) => r.affinity));
  return (
    <section className="rounded-2xl border border-line bg-panel p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-3xl">Audience fit</h2>
        <p className="text-sm text-muted">How much musical-theatre fans love each film, placed against 58 past Broadway adaptations</p>
      </div>
      <ol className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.film.id} className={`rounded-xl p-4 ${r.film.id === pickId ? "bg-panel-2 ring-1 ring-accent/60" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <span className="w-6 text-right font-display text-xl text-muted">{i + 1}</span>
                <span className="font-display text-2xl">{r.film.name}</span>
                {r.film.year && <span className="text-sm text-muted">{r.film.year}</span>}
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold uppercase tracking-wide ${BAND_TEXT[r.band.key]}`}>{r.band.label}</span>
                <span className="ml-3 text-sm text-muted">beats {r.percentile}% of past adaptations</span>
              </div>
            </div>
            <div className="ml-9 mt-3 h-3 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full ${BAND_COLOR[r.band.key]} transition-all duration-700`}
                style={{ width: `${Math.max(4, ((r.affinity - min) / (max - min || 1)) * 100)}%` }}
              />
            </div>
            <div className="ml-9 mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
              <span>Qloo affinity {r.affinity.toFixed(3)}</span>
              <span>
                Shows in this band ran a median {r.band.medianRun} performances; {Math.round(r.band.longRunShare * 100)}% passed 500
              </span>
              <span>Closest past cases: {r.comparables.map((c) => `${c.show} (${c.performances})`).join(", ")}</span>
            </div>
            {r.alreadyOnStage.length > 0 && (
              <p className="ml-9 mt-2 text-sm text-accent">
                Qloo already links this film to {r.alreadyOnStage.join(", ").toLowerCase()}. A stage version may exist, and its fans can lift the score.
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
