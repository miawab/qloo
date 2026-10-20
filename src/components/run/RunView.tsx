"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AudiencePanel, CreativePanel, MemoPanel, PartnersPanel, TourPanel, Trace } from "./Panels";
import { Scoreboard } from "./Scoreboard";
import { useRun } from "./state";

export function RunView() {
  const params = useSearchParams();
  // Read the URL once: the page rewrites it to ?id= when a live run starts,
  // and that must not restart the run.
  const [{ brief, replayId }] = useState(() => ({
    brief: params.get("brief") ?? undefined,
    replayId: params.get("id") ?? undefined,
  }));
  const s = useRun({ brief, replayId });
  const pick = s.scores?.find((r) => r.film.id === s.pickId) ?? s.scores?.[0];

  return (
    <main className="curtain-top mx-auto max-w-6xl px-5 pb-10 pt-32">
      <div className="no-print flex flex-wrap items-baseline justify-between gap-3">
        <p className="max-w-3xl text-muted">{brief ?? (replayId ? "Replaying a saved run" : "")}</p>
        {s.id && s.status !== "running" && (
          <span className="text-sm text-muted">
            Run {s.id}, <Link className="underline hover:text-ink" href={`/run?id=${s.id}`}>link to share</Link>
          </span>
        )}
      </div>

      {pick && (
        <h1 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          {pick.film.name} <span className="text-muted">leads with</span>{" "}
          <span className={pick.band.key === "strong" ? "text-strong" : pick.band.key === "middle" ? "text-middle" : "text-weak"}>
            {pick.band.label.toLowerCase()}
          </span>
        </h1>
      )}
      {!pick && s.status === "running" && <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">The agent is reading the brief</h1>}
      {s.status === "error" && <p className="mt-6 rounded-xl border border-weak/50 p-4 text-weak">{s.error}</p>}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {s.scores && <Scoreboard rows={s.scores} pickId={s.pickId} />}
          {s.memo && <MemoPanel m={s.memo} />}
          {s.tour && <TourPanel t={s.tour} />}
          <div className="grid gap-6 xl:grid-cols-2">
            {s.audience && <AudiencePanel a={s.audience} />}
            {s.creative && <CreativePanel c={s.creative} />}
          </div>
          {s.partners && <PartnersPanel p={s.partners} />}
        </div>
        <div className="no-print lg:sticky lg:top-6 lg:self-start">
          <Trace s={s} />
        </div>
      </div>
    </main>
  );
}
