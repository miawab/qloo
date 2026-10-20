import { BANDS, SHOWS, STATS, bandFor } from "@/lib/backtest";
import robustness from "@/data/robustness.json";

const W = 1000;
const H = 560;
const PAD = { l: 52, r: 20, t: 40, b: 28 };

const COLOR: Record<string, string> = { strong: "var(--strong)", middle: "var(--middle)", weak: "var(--weak)" };
// Shows worth naming on the chart, most important first. Labels that would
// collide with a dot or another label are skipped; every dot has a tooltip.
const HIGHLIGHT: [string, string][] = [
  ["Billy Elliot the Musical", "Billy Elliot"],
  ["Waitress", "Waitress"],
  ["Legally Blonde", "Legally Blonde"],
  ["Big Fish", "Big Fish"],
  ["Mrs. Doubtfire", "Mrs. Doubtfire"],
  ["School of Rock", "School of Rock"],
  ["Ghost", "Ghost"],
  ["Carrie", "Carrie"],
];

type Box = { x: number; y: number; w: number; h: number };
const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function Scatter() {
  const xs = SHOWS.map((s) => s.affinity);
  const x0 = Math.min(...xs) - 0.008;
  const x1 = Math.max(...xs) + 0.008;
  const y0 = Math.log10(3);
  const y1 = Math.log10(4000);
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((Math.log10(v) - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const cuts = [BANDS[1].min, BANDS[0].min];
  const edges = [PAD.l, sx(cuts[0]), sx(cuts[1]), W - PAD.r];
  const bandsLeftToRight = [BANDS[2], BANDS[1], BANDS[0]];

  const dots = SHOWS.map((s) => ({ s, x: sx(s.affinity), y: sy(s.performances) }));
  const taken: Box[] = dots.map((d) => ({ x: d.x - 6, y: d.y - 6, w: 12, h: 12 }));
  const labels: { x: number; y: number; text: string; anchor: "start" | "end"; dx: number; dy: number; px: number; py: number }[] = [];
  for (const [name, text] of HIGHLIGHT) {
    const d = dots.find((p) => p.s.show === name);
    if (!d) continue;
    const w = text.length * 7.4 + 6;
    const tries = [
      { dx: 12, dy: 0, anchor: "start" as const },
      { dx: -12, dy: 0, anchor: "end" as const },
      { dx: 12, dy: -18, anchor: "start" as const },
      { dx: -12, dy: -18, anchor: "end" as const },
      { dx: 12, dy: 18, anchor: "start" as const },
      { dx: -12, dy: 18, anchor: "end" as const },
    ];
    for (const t of tries) {
      const x = d.x + t.dx;
      const y = d.y + t.dy;
      const box = { x: t.anchor === "start" ? x : x - w, y: y - 9, w, h: 18 };
      if (box.x < PAD.l || box.x + box.w > W - PAD.r || box.y < PAD.t || box.y + box.h > H - PAD.b) continue;
      if (taken.some((b) => hit(b, box))) continue;
      taken.push(box);
      labels.push({ x, y, text, anchor: t.anchor, dx: t.dx, dy: t.dy, px: d.x, py: d.y });
      break;
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Qloo score against Broadway run length for 58 shows">
      {[10, 100, 1000].map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
          <text x={PAD.l - 10} y={sy(v) + 4} textAnchor="end" fontSize={13} fill="var(--muted)">
            {v.toLocaleString("en-US")}
          </text>
        </g>
      ))}
      {cuts.map((c) => (
        <line key={c} x1={sx(c)} x2={sx(c)} y1={PAD.t - 30} y2={H - PAD.b} stroke="var(--muted)" strokeDasharray="3 6" opacity={0.45} />
      ))}
      {bandsLeftToRight.map((b, i) => {
        const a = edges[i];
        const z = edges[i + 1];
        const my = sy(b.medianRun);
        return (
          <g key={b.key}>
            <text x={(a + z) / 2} y={PAD.t - 14} textAnchor="middle" fontSize={13} fontWeight={600} fill={COLOR[b.key]}>
              {b.label.toUpperCase()}
            </text>
            <line x1={a + 6} x2={z - 6} y1={my} y2={my} stroke={COLOR[b.key]} strokeWidth={2} opacity={0.6} />
            <text x={z - 8} y={my - 7} textAnchor="end" fontSize={12} fill={COLOR[b.key]}>
              median {b.medianRun}
            </text>
          </g>
        );
      })}
      {dots.map(({ s, x, y }) => (
        <circle key={s.show} cx={x} cy={y} r={5} fill={COLOR[bandFor(s.affinity).key]} opacity={0.8}>
          <title>{`${s.show}: ${s.performances} performances`}</title>
        </circle>
      ))}
      {labels.map((l) => (
        <g key={l.text}>
          {l.dy !== 0 && <line x1={l.px} y1={l.py} x2={l.x} y2={l.y} stroke="var(--muted)" strokeWidth={0.8} />}
          <text x={l.x} y={l.y + 4} textAnchor={l.anchor} fontSize={13} fill="var(--ink)">
            {l.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ProofPage() {
  return (
    <main className="curtain-top mx-auto max-w-6xl px-5 pb-16 pt-32">
      <p className="label text-accent">The proof</p>
      <h1 className="mt-4 max-w-5xl font-display text-5xl sm:text-8xl">
        Films musical fans love made longer-running musicals.
      </h1>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
        Before building Overture we checked whether its core score means anything. We took every Broadway musical adapted from a film
        that opened between 1985 and 2023, asked Qloo how much musical-theatre fans love each source film, and compared that with how
        long the original production ran.
      </p>

      <section className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        {[
          [String(STATS.n), "shows in the test"],
          [STATS.rho.toFixed(2), "rank correlation with run length"],
          [STATS.fameRho.toFixed(2), "the same for fame alone"],
          ["< 0.001", "chance of a correlation this strong at random (5,000 shuffles)"],
        ].map(([a, b]) => (
          <div key={b} className="bg-bg p-7">
            <p className="font-display text-5xl">{a}</p>
            <p className="mt-2 text-lg text-muted">{b}</p>
          </div>
        ))}
      </section>

      <section className="plot mt-10">
        <div className="ruler" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs uppercase text-muted">
            <span>Original Broadway performances (log scale)</span>
            <span>Each dot is one show. Hover for its name.</span>
          </div>
          <div className="-mx-6 mt-4 overflow-x-auto px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[640px]">
              <Scatter />
            </div>
          </div>
          <p className="mt-2 text-right font-mono text-xs uppercase text-muted">Qloo score of the source film among musical fans &rarr;</p>
        </div>
      </section>

      <section className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
        {BANDS.map((b) => (
          <div key={b.key} className="bg-bg p-7">
            <p className="label" style={{ color: COLOR[b.key] }}>
              {b.label}
            </p>
            <p className="mt-3 font-display text-5xl">{b.medianRun}</p>
            <p className="mt-1 text-lg text-muted">median performances</p>
            <p className="mt-4 text-lg">{Math.round(b.longRunShare * 100)}% ran 500 or more</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl">It isn&apos;t the fan panel we picked</h2>
          <p className="mt-3 text-lg text-muted">{robustness.note}</p>
          <table className="mt-6 w-full text-lg">
            <tbody>
              {robustness.panels.map((p) => (
                <tr key={p.label} className="border-t border-line align-top">
                  <td className="py-4 pr-4">
                    <p>{p.label}</p>
                    <p className="mt-1 text-base text-muted">{p.films}</p>
                  </td>
                  <td className={`py-3 text-right font-display text-2xl ${p.rho < 0.1 ? "text-muted" : ""}`}>{p.rho.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-lg text-muted">
            Any group of musical fans finds the signal. Action fans don&apos;t, which is what you&apos;d expect if the score measures
            musical-theatre taste.
          </p>
        </div>
        <div>
          <h2 className="font-display text-4xl">How it was done</h2>
          <ol className="mt-6 list-decimal space-y-4 pl-6 text-lg leading-relaxed">
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

      <section className="plot mt-16 p-8 sm:p-10">
        <h2 className="font-display text-4xl">What this does not show</h2>
        <ul className="mt-6 grid gap-6 text-lg leading-relaxed sm:grid-cols-2">
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
