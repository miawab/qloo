import "server-only";

// A small per-instance guard so one visitor can't burn the shared Qloo and
// Gemini quota. Serverless instances don't share memory, so this is a soft limit.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_RUNS = 4;
const hits = new Map<string, number[]>();

export function allowRun(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_RUNS) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}
