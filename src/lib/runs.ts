import "server-only";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import type { AgentEvent } from "./agent";
import { DATA_DIR } from "./paths";

// Finished runs are saved so they can be replayed without new Qloo calls.
const DIR = path.join(DATA_DIR, "runs");
const SEED_DIR = path.join(process.cwd(), "src", "data", "runs");

export type SavedRun = { id: string; brief: string; created: string; events: { t: number; e: AgentEvent }[] };

// On a host with Vercel Blob configured, runs go there so share links survive
// across serverless instances; otherwise they are plain files.
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function saveRun(run: SavedRun) {
  if (blobEnabled()) {
    await put(`runs/${run.id}.json`, JSON.stringify(run), { access: "private", contentType: "application/json", allowOverwrite: true });
    return;
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, run.id + ".json"), JSON.stringify(run));
}

export async function loadRun(id: string): Promise<SavedRun | null> {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  for (const dir of [SEED_DIR, DIR]) {
    try {
      return JSON.parse(await readFile(path.join(dir, id + ".json"), "utf8"));
    } catch {}
  }
  if (blobEnabled()) {
    try {
      const res = await get(`runs/${id}.json`, { access: "private" });
      if (res) return JSON.parse(await new Response(res.stream).text());
    } catch {}
  }
  return null;
}

export async function listSeedRuns() {
  try {
    const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith(".json"));
    return Promise.all(files.map(async (f) => {
      const run: SavedRun = JSON.parse(await readFile(path.join(SEED_DIR, f), "utf8"));
      const scored = run.events.find((x) => x.e.type === "result" && x.e.tool === "score_films")?.e;
      const rows = (scored && "data" in scored ? scored.data : []) as {
        film: { name: string; year?: number };
        percentile: number;
        band: { key: string; label: string; medianRun: number };
      }[];
      return { id: run.id, brief: run.brief, top: rows.slice(0, 4) };
    }));
  } catch {
    return [];
  }
}
