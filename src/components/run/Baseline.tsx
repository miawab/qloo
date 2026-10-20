"use client";
import { useState } from "react";
import { Frame } from "./Panels";
import type { ScoreRow } from "./state";

type Pick = { film: string; reason: string };

// Overture's ranking next to the model's own ranking with no Qloo data.
export function Baseline({ rows }: { rows: ScoreRow[] }) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; ranking?: Pick[]; model?: string }>({ status: "idle" });

  const load = async () => {
    setState({ status: "loading" });
    const res = await fetch("/api/baseline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ films: rows.map((r) => `${r.film.name}${r.film.year ? ` (${r.film.year})` : ""}`) }),
    });
    const body = await res.json();
    setState(res.ok ? { status: "done", ranking: body.ranking, model: body.model } : { status: "error" });
  };

  return (
    <Frame id="versus" index="07" title="With Qloo vs. AI alone" note="The same films ranked by the language model on its own, with no audience data.">
      {state.status === "idle" && (
        <button onClick={load} className="no-print border border-accent px-5 py-2.5 font-mono text-xs uppercase hover:bg-accent">
          Ask the AI alone
        </button>
      )}
      {state.status === "loading" && <p className="mt-5 text-sm text-muted">Asking the model...</p>}
      {state.status === "error" && <p className="mt-5 text-sm text-weak">The model did not answer. Try again later.</p>}
      {state.status === "done" && state.ranking && (
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <span className="tag">Overture, with Qloo</span>
            <ol className="mt-3 space-y-2">
              {rows.map((r, i) => (
                <li key={r.film.id} className="flex gap-3">
                  <span className="w-5 text-right text-muted">{i + 1}</span>
                  <span>{r.film.name}</span>
                  <span className="ml-auto text-sm text-muted">beats {r.percentile}%</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">Grounded in measured audience affinity and checked against 58 past shows.</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-muted">{state.model} alone</p>
            <ol className="mt-3 space-y-2">
              {state.ranking.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 text-right text-muted">{i + 1}</span>
                  <span>
                    {p.film}
                    <span className="block text-xs text-muted">{p.reason}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">Opinion from training data. No numbers to check it against.</p>
          </div>
        </div>
      )}
    </Frame>
  );
}
