import { BANDS, SHOWS, STATS, bandFor } from "@/lib/backtest";
import robustness from "@/data/robustness.json";

const W = 900;
const H = 460;
const PAD = { l: 64, r: 24, t: 20, b: 52 };

const COLOR: Record<string, string> = { strong: "var(--strong)", middle: "var(--middle)", weak: "var(--weak)" };
const LABELLED = new Set([
  "Waitress",
  "Billy Elliot the Musical",
  "School of Rock",
  "Big Fish",
  "Ghost",
  "Legally Blonde",
  "Catch Me If You Can",
  "Mrs. Doubtfire",
  "Newsies",
]);

function Scatter() {
  const xs = SHOWS.map((s) => s.affinity);
  const x0 = Math.min(...xs) - 0.01;
  const x1 = Math.max(...xs) + 0.01;
  const y0 = Math.log10(4);
  const y1 = Math.log10(3000);
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((Math.log10(v) - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const cuts = [BANDS[0].min, BANDS[1].min];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Qloo score against Broadway run length for 58 shows">
      {[10, 100, 1000].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
          <text x={PAD.l - 10} y={sy(v) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      {cuts.map((c) => (
        <line key={c} x1={sx(c)} x2={sx(c)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted)" strokeDasharray="4 5" opacity={0.5} />
      ))}
      <text x={sx(cuts[0]) + 8} y={PAD.t + 14} fontSize={12} fill="var(--strong)">Strong fit</text>
      <text x={sx(cuts[1]) + 8} y={PAD.t + 14} fontSize={12} fill="var(--middle)">Middle</text>
      <text x={PAD.l + 8} y={PAD.t + 14} fontSize={12} fill="var(--weak)">Weak fit</text>
      {SHOWS.map((s) => (
        <g key={s.show}>
          <circle cx={sx(s.affinity)} cy={sy(s.performances)} r={6} fill={COLOR[bandFor(s.affinity).key]} opacity={0.85}>
            <title>{`${s.show}: ${s.performances} performances, score ${s.affinity.toFixed(3)}`}</title>
          </circle>
          {LABELLED.has(s.show) && (
            <text x={sx(s.affinity) + 9} y={sy(s.performances) + 4} fontSize={12} fill="var(--ink)">
              {s.show}
            </text>
          )}
        </g>
      ))}
      <text x={(W + PAD.l) / 2} y={H - 12} textAnchor="middle" fontSize={13} fill="var(--muted)">
        Qloo score of the source film among musical fans
      </text>
      <text transform={`translate(18 ${(H - PAD.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={13} fill="var(--muted)">
        Original Broadway performances (log)
      </text>
    </svg>
  );
}

export default function ProofPage() {
  return (
    <main className="curtain-top mx-auto max-w-6xl px-5 pb-16 pt-32">
      <p className="label text-accent">The proof</p>
      <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] sm:text-7xl">
        Films musical fans love made longer-running musicals.
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">
        Before building Overture we checked whether its core score means anything. We took every Broadway musical adapted from a film
        that opened between 1985 and 2023, asked Qloo how much musical-theatre fans love each source film, and compared that with how
        long the original production ran.
      </p>

      <section className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {[
          [String(STATS.n), "shows in the test"],
          [STATS.rho.toFixed(2), "rank correlation with run length"],
          [STATS.fameRho.toFixed(2), "the same for fame alone"],
          ["< 0.001", "chance of a correlation this strong at random (5,000 shuffles)"],
        ].map(([a, b]) => (
          <div key={b} className="bg-bg p-7">
            <p className="font-display text-5xl">{a}</p>
            <p className="mt-2 text-sm text-muted">{b}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-line bg-panel p-6">
        <Scatter />
      </section>

      <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        {BANDS.map((b) => (
          <div key={b.key} className="bg-bg p-7">
            <p className="label" style={{ color: COLOR[b.key] }}>
              {b.label}
            </p>
            <p className="mt-3 font-display text-5xl">{b.medianRun}</p>
            <p className="mt-1 text-sm text-muted">median performances</p>
            <p className="mt-4 text-sm">{Math.round(b.longRunShare * 100)}% ran 500 or more</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">{b.shows.map((s) => s.show).join(", ")}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">It isn&apos;t the fan panel we picked</h2>
          <p className="mt-3 text-muted">{robustness.note}</p>
          <table className="mt-5 w-full text-sm">
            <tbody>
              {robustness.panels.map((p) => (
                <tr key={p.label} className="border-t border-line align-top">
                  <td className="py-3 pr-4">
                    <p>{p.label}</p>
                    <p className="text-xs text-muted">{p.films}</p>
                  </td>
                  <td className={`py-3 text-right font-display text-2xl ${p.rho < 0.1 ? "text-muted" : ""}`}>{p.rho.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted">
            Any group of musical fans finds the signal. Action fans don&apos;t, which is what you&apos;d expect if the score measures
            musical-theatre taste.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl">How it was done</h2>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            <li>
              Listed every Wikipedia article in both &ldquo;Broadway musicals&rdquo; and &ldquo;Musicals based on films&rdquo; (132), and
              read each one&apos;s original Broadway run length and source film.
            </li>
            <li>Kept shows that opened 1985 to 2023. Seasonal holiday shows were left out.</li>
            <li>
              Left out shows that were themselves filmed as musicals ({robustness.excluded.join(", ")}), because fans of the musical film
              could lift the source film&apos;s score. That would be circular.
            </li>
            <li>Scored every source film with Qloo rank calls through the official MCP server. Scores came back identical across batches.</li>
            <li>Compared scores with run lengths using rank correlation, with fame (Qloo popularity) as a check.</li>
          </ol>
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-line bg-panel p-8">
        <h2 className="font-display text-3xl">What this does not show</h2>
        <ul className="mt-5 grid gap-4 text-sm leading-relaxed sm:grid-cols-2">
          <li>58 shows is a small sample. The score shifts the odds; it does not predict one show&apos;s result.</li>
          <li>Run length is a stand-in for success. Some long runs lost money and some short ones toured profitably.</li>
          <li>
            Qloo&apos;s data is recent, so it measures how fans feel about these films today, not on opening night. Removing filmed musicals
            was our guard against the stage show changing the film&apos;s reputation.
          </li>
          <li>Book, score, cast, budget, theatre and timing all matter. Overture covers one input: whether the audience is already there.</li>
        </ul>
      </section>
    </main>
  );
}
