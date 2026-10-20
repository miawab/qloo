import Link from "next/link";
import { BriefForm } from "@/components/BriefForm";
import { BANDS, STATS } from "@/lib/backtest";
import { listSeedRuns } from "@/lib/runs";

export default async function Home() {
  const seeds = await listSeedRuns();
  const strong = BANDS[0];
  const weak = BANDS[BANDS.length - 1];
  return (
    <main>
      <section className="curtain relative overflow-hidden">
        <div className="spot pointer-events-none absolute -top-24 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2" />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-28 sm:pt-36">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_22rem]">
            <div>
              <p className="label text-accent">A greenlight agent for theatre producers</p>
              <h1 className="mt-6 font-display text-6xl sm:text-8xl">Greenlight the right musical.</h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
                A Broadway musical is a multi-million-dollar bet, and the source film is usually picked on gut feel. Overture checks how
                much musical-theatre fans already love each film, then plans the audience, tour, talent shortlist and marketing, with
                evidence behind every call.
              </p>
            </div>
            {seeds[0]?.top.length ? (
              <Link href={`/run?id=${seeds[0].id}`} className="plot hidden bg-black/50 backdrop-blur hover:border-accent lg:block">
                <div className="ruler" />
                <div className="p-6">
                  <span className="tag">Example run</span>
                  <ol className="mt-5">
                    {seeds[0].top.map((r, i) => (
                      <li key={r.film.name} className="flex items-baseline justify-between gap-3 border-t border-line py-3">
                        <span className={`font-display ${i === 0 ? "text-3xl" : "text-xl text-muted"}`}>{r.film.name}</span>
                        <span className="shrink-0 font-mono text-xs text-muted">beats {r.percentile}%</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 font-mono text-xs uppercase text-accent">Open the full run &rarr;</p>
                </div>
              </Link>
            ) : null}
          </div>
          <div className="mt-14">
            <BriefForm />
          </div>
          {seeds.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="label text-muted">Or open a finished run</p>
              {seeds.map((r) => (
                <Link key={r.id} href={`/run?id=${r.id}`} className="border border-line bg-panel px-4 py-2.5 text-base hover:border-accent">
                  {r.brief.length > 64 ? r.brief.slice(0, 64) + "..." : r.brief}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-accent">The proof</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl sm:text-6xl">
              Tested on {STATS.n} Broadway musicals adapted from films.
            </h2>
          </div>
          <Link href="/proof" className="label text-muted hover:text-ink">See the back-test and its limits</Link>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
          {[
            [`${(strong.medianRun / weak.medianRun).toFixed(1)}x`, `longer median run for the films Qloo scored in the top third (${strong.medianRun} vs ${weak.medianRun} performances)`],
            [STATS.rho.toFixed(2), `rank correlation between the score and run length, against ${STATS.fameRho.toFixed(2)} for fame alone`],
            [`${Math.round(strong.longRunShare * 100)}%`, `of top-third shows passed 500 performances, against ${Math.round(weak.longRunShare * 100)}% of the bottom third`],
          ].map(([big, small]) => (
            <div key={small} className="bg-bg p-8">
              <p className="font-display text-6xl sm:text-7xl">{big}</p>
              <p className="mt-3 text-lg leading-relaxed text-muted">{small}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p className="label text-accent">What the agent does</p>
        <ol className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Matches every title", "Finds the exact film in Qloo and flags titles that could mean more than one film.", "describe"],
            ["Scores audience fit", "Ranks the films for fans of six hit movie musicals, on the same scale as the back-test.", "rank, entity_tags"],
            ["Profiles the audience", "Age and gender lean, themes, and common ground with musical fans.", "audience_demographics, compare_audiences"],
            ["Plans the tour", "US areas where the audience over-indexes, matched to touring markets.", "where_popular"],
            ["Shortlists talent", "Performers and musicians the audience already loves.", "recommend"],
            ["Writes the memo", "A one-page greenlight memo for investors, with evidence for every claim.", "Gemini, from the results above"],
          ].map(([t, d, tools], i) => (
            <li key={t} className="bg-bg p-8">
              <p className="font-mono text-xs text-accent">0{i + 1}</p>
              <p className="mt-4 font-display text-3xl">{t}</p>
              <p className="mt-3 text-lg leading-relaxed text-muted">{d}</p>
              <p className="mt-5 font-mono text-xs text-muted">{tools}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
