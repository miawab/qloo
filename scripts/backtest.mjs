// Re-scores the historical Broadway source films through `qloo mcp` (the same
// path the app uses) and writes src/data/backtest.json.
// Input: notes/research/broadway/scored.json (show, run length, Qloo film id).
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const client = new Client({ name: "overture-backtest", version: "0.1.0" });
await client.connect(new StdioClientTransport({
  command: process.execPath,
  args: [path.join("node_modules", "@qloo", "qloo-harness", "dist", "bin.js"), "mcp"],
  env: process.env,
}));
async function call(name, args) {
  for (let i = 0; i < 5; i++) {
    const env = (await client.callTool({ name, arguments: args })).structuredContent;
    if (env.status === "error" && env.error?.retryable) { await sleep(8000 * (i + 1)); continue; }
    await sleep(1200);
    return env;
  }
  throw new Error("rate limited: " + name);
}

const panelSeeds = [["The Greatest Showman", 2017], ["Les Misérables", 2012], ["Mamma Mia!", 2008], ["La La Land", 2016], ["Chicago", 2002], ["Into the Woods", 2014]];
const panel = [];
for (const [title, year] of panelSeeds) {
  const env = await call("qloo_describe", { entity: title, type: "movie" });
  const hit = env.status === "ok" ? env.results[0] : env.resolution.issues[0].candidates.find((c) => c.release_year === year);
  panel.push({ id: hit.entity_id ?? hit.id, name: hit.name, year });
}
console.log("panel", panel.map((p) => p.name + " " + p.year).join(", "));

const leak = /Hairspray|Producers|Mean Girls|Color Purple|Sunset|Mary Poppins|Spamalot|Moulin/;
const rows = JSON.parse(fs.readFileSync("notes/research/broadway/scored.json", "utf8"))
  .filter((r) => !leak.test(r.show) && !panel.some((p) => p.id === r.qid));

// Batches of 8 plus 2 fixed anchors, so we can check that scores are stable across calls.
const anchors = rows.slice(0, 2).map((r) => r.qid);
const rest = rows.slice(2);
const scores = {};
const anchorRuns = [];
for (let i = 0; i < rest.length; i += 8) {
  const ids = [...anchors, ...rest.slice(i, i + 8).map((r) => r.qid)];
  const env = await call("qloo_rank", { options: ids, option_type: "movie", signals: panel.map((p) => p.id) });
  if (env.status !== "ok") { console.log("batch", i, env.status, env.summary); continue; }
  for (const e of env.results) scores[e.entity_id] = { affinity: e.affinity, popularity: e.popularity };
  anchorRuns.push(anchors.map((a) => env.results.find((e) => e.entity_id === a)?.affinity));
}
console.log("anchor affinity per batch", anchorRuns.map((a) => a.map((x) => x?.toFixed(4)).join("/")).join("  "));

const shows = rows.filter((r) => scores[r.qid]).map((r) => ({
  show: r.show.replace(/ \((\d{4} )?musical\)$/, ""),
  film: r.qname, filmYear: r.film_year, opened: r.broadway_open_year, performances: r.broadway_performances,
  qlooId: r.qid, affinity: scores[r.qid].affinity, popularity: scores[r.qid].popularity,
}));
fs.writeFileSync("src/data/backtest.json", JSON.stringify({ panel, generated: new Date().toISOString().slice(0, 10), shows }, null, 1));
console.log("wrote", shows.length, "shows");
await client.close();
