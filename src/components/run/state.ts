"use client";
import { useEffect, useReducer } from "react";
import type { AgentEvent, Memo } from "@/lib/agent";
import type { QlooCall } from "@/lib/qloo";

// Client-side view of a run, built up from the agent's event stream.

export type ScoreRow = {
  film: { id: string; name: string; year?: number; description?: string };
  affinity: number;
  popularity: number;
  percentile: number;
  band: { key: string; label: string; medianRun: number; longRunShare: number };
  comparables: { show: string; performances: number }[];
  alreadyOnStage: string[];
};

export type Ranked = { id: string; name: string; affinity: number };

export type RunState = {
  id?: string;
  status: "idle" | "running" | "done" | "error";
  thoughts: string[];
  steps: { tool: string; args: Record<string, unknown>; calls: QlooCall[]; done: boolean }[];
  resolutions?: { input: string; status: string; film?: { name: string; year?: number }; choices?: { name: string; year?: number }[] }[];
  scores?: ScoreRow[];
  pickId?: string;
  audience?: { age: Record<string, number>; gender: Record<string, number>; themes: string[]; sharedWithMusicalFans: string[] };
  tour?: { cells: { lat: number; lon: number; affinity: number }[]; markets: { name: string; lat: number; lon: number; score: number }[] };
  creative?: { performers: Ranked[]; musicians: Ranked[] };
  partners?: { brands: Ranked[]; podcasts: Ranked[]; tvShows: Ranked[] };
  memo?: Memo;
  error?: string;
};

type Action = { kind: "event"; e: AgentEvent } | { kind: "reset" } | { kind: "id"; id: string };

const initial: RunState = { status: "idle", thoughts: [], steps: [] };

function reduce(s: RunState, a: Action): RunState {
  if (a.kind === "reset") return { ...initial, status: "running" };
  if (a.kind === "id") return { ...s, id: a.id };
  const e = a.e;
  switch (e.type) {
    case "thought":
      return e.text.startsWith("Run ") ? s : { ...s, thoughts: [...s.thoughts, e.text] };
    case "step":
      return { ...s, steps: [...s.steps, { tool: e.tool, args: e.args, calls: [], done: false }] };
    case "qloo": {
      const steps = [...s.steps];
      const last = steps[steps.length - 1];
      if (last) steps[steps.length - 1] = { ...last, calls: [...last.calls, e.call] };
      return { ...s, steps };
    }
    case "result": {
      const steps = s.steps.map((st, i) => (i === s.steps.length - 1 ? { ...st, done: true } : st));
      const next = { ...s, steps };
      const filmId = steps[steps.length - 1]?.args.film_id as string | undefined;
      if (e.tool === "resolve_films") next.resolutions = e.data as RunState["resolutions"];
      if (e.tool === "score_films") next.scores = e.data as ScoreRow[];
      if (e.tool === "audience_profile") next.audience = e.data as RunState["audience"];
      if (e.tool === "tour_markets") next.tour = e.data as RunState["tour"];
      if (e.tool === "creative_team") next.creative = e.data as RunState["creative"];
      if (e.tool === "marketing_partners") next.partners = e.data as RunState["partners"];
      if (filmId) next.pickId = filmId;
      return next;
    }
    case "memo":
      return { ...s, memo: e.memo };
    case "error":
      return { ...s, status: "error", error: e.message };
    case "done":
      return { ...s, status: s.status === "error" ? "error" : "done" };
  }
}

export function useRun(opts: { brief?: string; replayId?: string; speed?: number }) {
  const [state, dispatch] = useReducer(reduce, initial);
  useEffect(() => {
    // Each effect run owns its own stream; a cleanup (or React's dev-mode
    // double mount) aborts the old one so events never mix.
    const ctrl = new AbortController();
    const send = (a: Action) => {
      if (!ctrl.signal.aborted) dispatch(a);
    };
    send({ kind: "reset" });

    if (opts.replayId) {
      (async () => {
        const res = await fetch(`/api/runs/${opts.replayId}`, { signal: ctrl.signal });
        if (!res.ok) return send({ kind: "event", e: { type: "error", message: "Saved run not found." } });
        const run = (await res.json()) as { id: string; events: { t: number; e: AgentEvent }[] };
        send({ kind: "id", id: run.id });
        const speed = opts.speed ?? 6;
        let prev = 0;
        for (const { t, e } of run.events) {
          await new Promise((r) => setTimeout(r, Math.min(450, (t - prev) / speed)));
          prev = t;
          if (ctrl.signal.aborted) return;
          send({ kind: "event", e });
        }
      })().catch(() => {});
      return () => ctrl.abort();
    }

    if (opts.brief) {
      (async () => {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ brief: opts.brief }),
          signal: ctrl.signal,
        });
        const id = res.headers.get("x-run-id");
        if (id) {
          send({ kind: "id", id });
          window.history.replaceState(null, "", `/run?id=${id}`);
        }
        if (!res.ok || !res.body) {
          return send({ kind: "event", e: { type: "error", message: "The run could not start." } });
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) send({ kind: "event", e: JSON.parse(line) });
        }
      })().catch(() => {});
    }
    return () => ctrl.abort();
  }, [opts.brief, opts.replayId, opts.speed]);

  return state;
}
