import "server-only";
import { PANEL, bandFor, nearestShows, percentile } from "./backtest";
import { TOUR_MARKETS, distanceKm } from "./cities";
import { callQloo, type Candidate, type QlooCall } from "./qloo";

// Domain steps the agent can take. Each one is a small chain of Qloo MCP
// calls; every call is reported through `onCall` so the UI can show evidence.

type OnCall = (call: QlooCall) => void;

export type Film = { id: string; name: string; year?: number; description?: string };

type QlooEntity = {
  entity_id: string;
  name: string;
  popularity?: number;
  affinity?: number;
  properties?: { release_year?: number; description?: string };
};

const panelIds = PANEL.map((p) => p.id);

export type Resolution =
  | { input: string; status: "resolved"; film: Film }
  | { input: string; status: "ambiguous"; choices: Film[] }
  | { input: string; status: "not_found" };

export async function resolveTitle(input: string, year: number | undefined, onCall?: OnCall): Promise<Resolution> {
  const env = await callQloo("qloo_describe", { entity: input, type: "movie" }, onCall);
  if (env.status === "ok" && env.results?.length) {
    const e = env.results[0] as QlooEntity;
    return {
      input,
      status: "resolved",
      film: { id: e.entity_id, name: e.name, year: e.properties?.release_year, description: e.properties?.description },
    };
  }
  const choices: Film[] = (env.resolution?.issues?.[0]?.candidates ?? []).map((c: Candidate) => ({
    id: c.id,
    name: c.name,
    year: c.release_year,
    description: c.description,
  }));
  const byYear = year ? choices.find((c) => c.year === year) : undefined;
  if (byYear) return { input, status: "resolved", film: byYear };
  if (choices.length === 1) return { input, status: "resolved", film: choices[0] };
  if (choices.length) return { input, status: "ambiguous", choices: choices.slice(0, 5) };
  return { input, status: "not_found" };
}

export type Score = {
  film: Film;
  affinity: number;
  popularity: number;
  percentile: number;
  band: { key: string; label: string; medianRun: number; longRunShare: number };
  comparables: { show: string; performances: number }[];
  // Qloo tags the film with stage-musical concepts, so a stage version likely
  // exists and its fans may inflate the score (the back-test excluded these).
  alreadyOnStage: string[];
};

const STAGE_TAG = /broadway|musical theat|stage musical|west end/i;

async function stageTags(film: Film, onCall?: OnCall) {
  const env = await callQloo("qloo_entity_tags", { entities: [film.id], entity_type: "movie", limit: 20 }, onCall);
  return [...new Set(((env.results ?? []) as { name: string }[]).map((t) => t.name).filter((n) => STAGE_TAG.test(n)))];
}

// Qloo ranks the candidates for the musical-fan panel used in the back-test.
// Scores stay comparable across calls because the panel never changes.
export async function scoreFilms(films: Film[], onCall?: OnCall): Promise<Score[]> {
  const out: Score[] = [];
  for (let i = 0; i < films.length; i += 10) {
    const batch = films.slice(i, i + 10);
    const env = await callQloo(
      "qloo_rank",
      { options: batch.map((f) => f.id), option_type: "movie", signals: panelIds },
      onCall,
    );
    for (const e of (env.results ?? []) as QlooEntity[]) {
      const film = batch.find((f) => f.id === e.entity_id);
      if (!film || e.affinity == null) continue;
      const band = bandFor(e.affinity);
      out.push({
        film,
        affinity: e.affinity,
        popularity: e.popularity ?? 0,
        percentile: percentile(e.affinity),
        band: { key: band.key, label: band.label, medianRun: band.medianRun, longRunShare: band.longRunShare },
        comparables: nearestShows(e.affinity).map((s) => ({ show: s.show, performances: s.performances })),
        alreadyOnStage: await stageTags(film, onCall),
      });
    }
  }
  return out.sort((a, b) => b.affinity - a.affinity);
}

export async function audienceProfile(film: Film, onCall?: OnCall) {
  const [demo, tags, contrast] = await Promise.all([
    callQloo("qloo_audience_demographics", { entity: film.id, entity_type: "movie" }, onCall),
    callQloo("qloo_entity_tags", { entities: [film.id], entity_type: "movie", limit: 20 }, onCall),
    callQloo("qloo_compare_audiences", { group_a: [film.id], group_b: panelIds, limit: 10 }, onCall),
  ]);
  const d = (demo.results?.[0] ?? {}) as { query?: { age?: Record<string, number>; gender?: Record<string, number> } };
  type Tag = { id?: string; tag_id?: string; name: string; query?: { score?: number } };
  const contrastTags = ((contrast.results as unknown as { tags?: Tag[] })?.tags ?? []) as Tag[];
  return {
    age: d.query?.age ?? {},
    gender: d.query?.gender ?? {},
    themes: [...new Set(((tags.results ?? []) as Tag[]).map((t) => t.name).filter((n) => !STAGE_TAG.test(n)))].slice(0, 12),
    sharedWithMusicalFans: [...new Set(contrastTags.map((t) => t.name))],
  };
}

type HeatCell = { location: { latitude: number; longitude: number }; query: { affinity: number; popularity?: number } };

// Qloo returns geohash cells; we roll them up to the nearest touring market.
export async function tourMarkets(film: Film, onCall?: OnCall) {
  const env = await callQloo(
    "qloo_where_popular",
    { entity: film.id, entity_type: "movie", within: "United States", limit: 20 },
    onCall,
  );
  const cells = (env.results ?? []) as HeatCell[];
  const markets = new Map<string, { name: string; lat: number; lon: number; score: number; cells: number }>();
  for (const c of cells) {
    const p = { lat: c.location.latitude, lon: c.location.longitude };
    const near = TOUR_MARKETS.map((m) => ({ m, d: distanceKm(m, p) })).sort((a, b) => a.d - b.d)[0];
    if (!near || near.d > 120) continue;
    const cur = markets.get(near.m.name) ?? { ...near.m, score: 0, cells: 0 };
    cur.score = Math.max(cur.score, c.query.affinity);
    cur.cells += 1;
    markets.set(near.m.name, cur);
  }
  return {
    cells: cells.map((c) => ({ lat: c.location.latitude, lon: c.location.longitude, affinity: c.query.affinity })),
    markets: [...markets.values()].sort((a, b) => b.score - a.score || b.cells - a.cells).slice(0, 10),
  };
}

// Recommendations for the combined film + musical-fan audience. Very famous
// names get recommended for almost any audience, so we keep the ones whose
// affinity stands out against their popularity.
async function recommendFor(film: Film, target: string, limit: number, onCall?: OnCall) {
  const env = await callQloo(
    "qloo_recommend",
    { target_type: target, signals: [film.id, ...panelIds.slice(0, 4)], limit: 20 },
    onCall,
  );
  // Entries without a popularity value are mis-typed in the data (a person
  // listed as a brand), so they are dropped.
  return ((env.results ?? []) as QlooEntity[])
    .filter((e) => e.popularity != null)
    .map((e) => ({
      id: e.entity_id,
      name: e.name,
      affinity: e.affinity ?? 0,
      lift: (e.affinity ?? 0) - (e.popularity ?? 0) * 0.5,
    }))
    .sort((a, b) => b.lift - a.lift)
    .slice(0, limit);
}

export async function creativeTeam(film: Film, onCall?: OnCall) {
  const [performers, musicians] = await Promise.all([
    recommendFor(film, "person", 6, onCall),
    recommendFor(film, "artist", 6, onCall),
  ]);
  return { performers, musicians };
}

export async function marketingPartners(film: Film, onCall?: OnCall) {
  const [brands, podcasts, shows] = await Promise.all([
    recommendFor(film, "brand", 6, onCall),
    recommendFor(film, "podcast", 5, onCall),
    recommendFor(film, "tv_show", 5, onCall),
  ]);
  return { brands, podcasts, tvShows: shows };
}
