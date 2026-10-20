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
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-40">
          <p className="label text-accent">A greenlight agent for theatre producers</p>
          <h1 className="mt-6 max-w-4xl font-display text-6xl font-semibold leading-[0.98] tracking-tight sm:text-8xl">
            Greenlight the right musical.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
            A Broadway musical is a multi-million-dollar bet, and the source film is usually picked on gut feel. Overture checks how much
            musical-theatre fans already love each film, then plans the audience, tour, talent shortlist and marketing, with evidence
            behind every call.
          </p>
          <div className="mt-12 max-w-4xl">
            <BriefForm />
          </div>
          {seeds.length > 0 && (
            <div className="mt-6 max-w-4xl">
              <p className="label text-muted">Or open a finished run</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {seeds.map((r) => (
                  <Link key={r.id} href={`/run?id=${r.id}`} className="rounded-full border border-line bg-panel px-4 py-2 text-sm hover:border-accent">
                    {r.brief.length > 64 ? r.brief.slice(0, 64) + "..." : r.brief}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-accent">The proof</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Tested on {STATS.n} Broadway musicals adapted from films.
            </h2>
          </div>
          <Link href="/proof" className="label text-muted hover:text-ink">See the back-test and its limits</Link>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            [`${(strong.medianRun / weak.medianRun).toFixed(1)}x`, `longer median run for the films Qloo scored in the top third (${strong.medianRun} vs ${weak.medianRun} performances)`],
            [STATS.rho.toFixed(2), `rank correlation between the score and run length, against ${STATS.fameRho.toFixed(2)} for fame alone`],
            [`${Math.round(strong.longRunShare * 100)}%`, `of top-third shows passed 500 performances, against ${Math.round(weak.longRunShare * 100)}% of the bottom third`],
          ].map(([big, small]) => (
            <div key={small} className="bg-bg p-8">
              <p className="font-display text-6xl font-semibold tracking-tight">{big}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{small}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p className="label text-accent">What the agent does</p>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              <p className="mt-5 font-mono text-xs text-muted">{tools}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
