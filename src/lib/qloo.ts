import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Every Qloo call goes through the canonical `qloo mcp` server from
// @qloo/qloo-harness. The API key stays in this process's environment.

export type QlooTool =
  | "qloo_describe"
  | "qloo_rank"
  | "qloo_recommend"
  | "qloo_where_popular"
  | "qloo_compare_audiences"
  | "qloo_entity_tags"
  | "qloo_audience_demographics"
  | "qloo_trends"
  | "qloo_find_tags";

export type Candidate = {
  id: string;
  name: string;
  release_year?: number;
  description?: string;
  popularity?: number;
};

export type Envelope = {
  status: "ok" | "needs_input" | "error" | string;
  summary?: string;
  results?: unknown[];
  resolution?: { issues?: { input: string; kind: string; candidates?: Candidate[] }[] };
  error?: { code?: string; retryable?: boolean; recovery?: string };
  query_intent?: unknown;
};

export type QlooCall = {
  id: string;
  tool: QlooTool;
  args: Record<string, unknown>;
  status: string;
  summary?: string;
  ms: number;
  cached: boolean;
  resultCount: number;
};

const CACHE_DIR = path.join(process.cwd(), ".cache", "qloo");
const HARNESS_BIN = path.join(process.cwd(), "node_modules", "@qloo", "qloo-harness", "dist", "bin.js");

let clientPromise: Promise<Client> | null = null;

function connect(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({ name: "overture", version: "0.1.0" });
      // The SDK forwards only a few variables by default; QLOO_API_KEY and
      // QLOO_BASE_URL must reach the server.
      const env = Object.fromEntries(
        Object.entries(process.env).filter((e): e is [string, string] => typeof e[1] === "string"),
      );
      await client.connect(new StdioClientTransport({ command: process.execPath, args: [HARNESS_BIN, "mcp"], env }));
      return client;
    })().catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

function cacheKey(tool: string, args: unknown) {
  return createHash("sha256").update(tool + JSON.stringify(args)).digest("hex").slice(0, 32);
}

async function readCache(key: string): Promise<Envelope | null> {
  try {
    return JSON.parse(await readFile(path.join(CACHE_DIR, key + ".json"), "utf8"));
  } catch {
    return null;
  }
}

async function writeCache(key: string, env: Envelope) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, key + ".json"), JSON.stringify(env));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Calls are serialized so one run never bursts past the event rate limit.
let queue: Promise<unknown> = Promise.resolve();

export async function callQloo(
  tool: QlooTool,
  args: Record<string, unknown>,
  onCall?: (call: QlooCall) => void,
): Promise<Envelope> {
  const key = cacheKey(tool, args);
  const started = Date.now();
  const report = (env: Envelope, cached: boolean) =>
    onCall?.({
      id: key.slice(0, 8),
      tool,
      args,
      status: env.status,
      summary: env.summary,
      ms: Date.now() - started,
      cached,
      resultCount: env.results?.length ?? 0,
    });

  const hit = await readCache(key);
  if (hit) {
    report(hit, true);
    return hit;
  }

  const run = async () => {
    const client = await connect();
    for (let attempt = 0; ; attempt++) {
      const res = await client.callTool({ name: tool, arguments: args });
      const env = (res.structuredContent ?? { status: "error", summary: "No structured result" }) as Envelope;
      if (env.status === "error" && env.error?.retryable && attempt < 3) {
        await sleep(4000 * (attempt + 1));
        continue;
      }
      return env;
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  const env = await next;

  // Only successful answers are cached; errors should be retried later.
  if (env.status === "ok") await writeCache(key, env);
  report(env, false);
  return env;
}
