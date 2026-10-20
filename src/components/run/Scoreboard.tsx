"use client";
import { Frame } from "./Panels";
import type { ScoreRow } from "./state";

const BAND_TEXT: Record<string, string> = { strong: "text-strong", middle: "text-middle", weak: "text-weak" };
const BAND_BG: Record<string, string> = { strong: "bg-strong", middle: "bg-middle", weak: "bg-weak" };

// Ranked like a show poster: the better the fit, the bigger the billing.
export function Scoreboard({ rows, pickId }: { rows: ScoreRow[]; pickId?: string }) {
  return (
    <Frame
      id="shortlist"
      index="01"
      title="The shortlist"
      note="How much musical-theatre fans love each film, placed against 58 past Broadway adaptations of films."
    >
      <ol>
        {rows.map((r, i) => {
          const size = Math.max(1.4, 3.4 - i * 0.28);
          return (
            <li key={r.film.id} className="group grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-line py-5 sm:grid-cols-[2.5rem_1fr_16rem]">
              <span className="pt-1 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display" style={{ fontSize: `${size}rem` }}>
                    {r.film.name}
                  </span>
                  {r.film.year && <span className="font-mono text-xs text-muted">{r.film.year}</span>}
                  {r.film.id === pickId && <span className="tag">Pick</span>}
                </div>
                <p className="mt-2 text-base text-muted">
                  Scores like {r.comparables.slice(0, 2).map((c) => `${c.show.replace(/ the Musical$/, "")} (${c.performances.toLocaleString("en-US")} perfs)`).join(" and ")}
                </p>
                {r.alreadyOnStage.length > 0 && (
                  <p className="mt-2 text-base text-middle">
                    Qloo links this film to {r.alreadyOnStage.join(", ").toLowerCase()}: a stage version may exist and can lift the score.
                  </p>
                )}
              </div>
              <div className="col-start-2 mt-3 sm:col-start-3 sm:mt-0 sm:text-right">
                <p className={`font-mono text-xs uppercase ${BAND_TEXT[r.band.key]}`}>{r.band.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">beats {r.percentile}%</p>
                <div className="mt-2 h-1 bg-line">
                  <div className={`h-full ${BAND_BG[r.band.key]}`} style={{ width: `${Math.max(3, r.percentile)}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  Past shows in this band: median {r.band.medianRun} performances
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Frame>
  );
}
