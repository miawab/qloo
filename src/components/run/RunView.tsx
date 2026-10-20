"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Baseline } from "./Baseline";
import { AudiencePanel, CreativePanel, CueSheet, MemoPanel, PartnersPanel, TourPanel } from "./Panels";
import { Scoreboard } from "./Scoreboard";
import { useRun } from "./state";

const SECTIONS = [
  ["shortlist", "Shortlist"],
  ["memo", "Memo"],
  ["audience", "Audience"],
  ["tour", "Tour"],
  ["talent", "Talent"],
  ["partners", "Partners"],
  ["versus", "Vs. AI alone"],
] as const;

const BAND_TEXT: Record<string, string> = { strong: "text-strong", middle: "text-middle", weak: "text-weak" };

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
  const ready = new Set<string>(
    [
      s.scores && "shortlist",
      s.memo && "memo",
      s.audience && "audience",
      s.tour && "tour",
      s.creative && "talent",
      s.partners && "partners",
      s.scores && s.status === "done" && "versus",
    ].filter(Boolean) as string[],
  );

  return (
    <main>
      <section className="curtain relative overflow-hidden">
        <div className="spot pointer-events-none absolute -top-32 right-[10%] h-[30rem] w-[30rem]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-32">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase text-muted">
            <span>{replayId ? "Saved run" : "Live run"}{s.id ? ` / ${s.id}` : ""}</span>
            {s.id && s.status !== "running" && (
              <Link className="hover:text-ink" href={`/run?id=${s.id}`}>
                Share link
              </Link>
            )}
          </div>
          {pick ? (
            <>
              <p className="mt-8 font-mono text-xs uppercase text-accent">The agent recommends</p>
              <h1 className="mt-3 font-display text-6xl sm:text-8xl lg:text-9xl">{pick.film.name}</h1>
              <div className="mt-8 grid max-w-4xl grid-cols-2 gap-px bg-line sm:grid-cols-4">
                {[
                  [pick.band.label, "audience fit", BAND_TEXT[pick.band.key]],
                  [`${pick.percentile}%`, "of past adaptations beaten", ""],
                  [String(pick.band.medianRun), "median run in this band", ""],
                  [s.tour?.markets[0]?.name.split(",")[0] ?? "...", "top touring market", ""],
                ].map(([big, small, cls]) => (
                  <div key={small} className="bg-bg/80 p-5">
                    <p className={`text-2xl font-semibold ${cls}`}>{big}</p>
                    <p className="mt-1 font-mono text-xs uppercase text-muted">{small}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-8 font-mono text-xs uppercase text-accent">
                {s.status === "error" ? "The run stopped" : "Places, please"}
              </p>
              <h1 className="mt-3 font-display text-6xl sm:text-8xl">
                {s.status === "error" ? "Something went wrong" : "The agent is reading your brief"}
              </h1>
            </>
          )}
          {brief && <p className="mt-6 max-w-3xl text-base text-muted">Brief: {brief}</p>}
          {s.status === "error" && <p className="mt-6 max-w-3xl border border-weak/50 p-4 text-base text-weak">{s.error}</p>}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[10rem_1fr_19rem]">
        <nav className="no-print hidden lg:block">
          <ol className="sticky top-8 space-y-3 font-mono text-xs uppercase">
            {SECTIONS.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className={ready.has(id) ? "text-ink hover:text-accent" : "pointer-events-none text-muted/40"}>
                  <span className="text-accent">{String(i + 1).padStart(2, "0")}</span> {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-10">
          {s.scores && <Scoreboard rows={s.scores} pickId={s.pickId} />}
          {s.memo && <MemoPanel m={s.memo} />}
          <div className="grid gap-10 2xl:grid-cols-2">
            {s.audience && <AudiencePanel a={s.audience} />}
            {s.creative && <CreativePanel c={s.creative} />}
          </div>
          {s.tour && <TourPanel t={s.tour} />}
          {s.partners && <PartnersPanel p={s.partners} />}
          {s.scores && s.status === "done" && <Baseline rows={s.scores} />}
        </div>

        <div className="no-print lg:sticky lg:top-8 lg:self-start">
          <CueSheet s={s} />
        </div>
      </div>
    </main>
  );
}
