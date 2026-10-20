import data from "@/data/backtest.json";

export type HistoricShow = (typeof data.shows)[number];

export const PANEL = data.panel;
export const SHOWS: HistoricShow[] = data.shows;

const byAffinity = [...SHOWS].sort((a, b) => b.affinity - a.affinity);
const third = Math.floor(SHOWS.length / 3);

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export const BANDS = [
  { key: "strong", label: "Strong fit", shows: byAffinity.slice(0, third) },
  { key: "middle", label: "Middle", shows: byAffinity.slice(third, 2 * third) },
  { key: "weak", label: "Weak fit", shows: byAffinity.slice(2 * third) },
].map((b) => ({
  ...b,
  min: Math.min(...b.shows.map((s) => s.affinity)),
  medianRun: median(b.shows.map((s) => s.performances)),
  longRunShare: b.shows.filter((s) => s.performances >= 500).length / b.shows.length,
}));

export type Band = (typeof BANDS)[number];

export function bandFor(affinity: number): Band {
  return BANDS.find((b) => affinity >= b.min) ?? BANDS[BANDS.length - 1];
}

// Share of historical source films this one beats, 0..100.
export function percentile(affinity: number) {
  return Math.round((SHOWS.filter((s) => s.affinity < affinity).length / SHOWS.length) * 100);
}

// The historical shows whose source films scored closest to this one.
export function nearestShows(affinity: number, n = 3) {
  return [...SHOWS].sort((a, b) => Math.abs(a.affinity - affinity) - Math.abs(b.affinity - affinity)).slice(0, n);
}

function ranks(xs: number[]) {
  const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r: number[] = [];
  order.forEach(([, i], k) => (r[i] = k));
  return r;
}

export function spearman(x: number[], y: number[]) {
  const rx = ranks(x);
  const ry = ranks(y);
  const n = x.length;
  const m = (n - 1) / 2;
  let a = 0;
  let b = 0;
  let c = 0;
  for (let i = 0; i < n; i++) {
    a += (rx[i] - m) * (ry[i] - m);
    b += (rx[i] - m) ** 2;
    c += (ry[i] - m) ** 2;
  }
  return a / Math.sqrt(b * c);
}

export const STATS = {
  n: SHOWS.length,
  rho: spearman(SHOWS.map((s) => s.affinity), SHOWS.map((s) => s.performances)),
  fameRho: spearman(SHOWS.map((s) => s.popularity), SHOWS.map((s) => s.performances)),
};
