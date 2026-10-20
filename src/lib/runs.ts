import "server-only";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentEvent } from "./agent";

// Finished runs are saved so they can be replayed without new Qloo calls.
const DIR = path.join(process.cwd(), ".cache", "runs");
const SEED_DIR = path.join(process.cwd(), "src", "data", "runs");

export type SavedRun = { id: string; brief: string; created: string; events: { t: number; e: AgentEvent }[] };

export async function saveRun(run: SavedRun) {
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
