import { randomUUID } from "node:crypto";
import { runAgent, type AgentEvent } from "@/lib/agent";
import { allowRun } from "@/lib/limit";
import { saveRun } from "@/lib/runs";

export const runtime = "nodejs";
export const maxDuration = 300;

// Streams agent events as newline-delimited JSON.
export async function POST(req: Request) {
  const { brief } = (await req.json()) as { brief?: string };
  if (!brief || brief.length > 2000) return Response.json({ error: "Give a brief of up to 2000 characters." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRun(ip)) {
    return Response.json({ error: "That's a lot of runs. Open a saved run, or try again in a few minutes." }, { status: 429 });
  }

  const id = randomUUID().slice(0, 8);
  const started = Date.now();
  const events: { t: number; e: AgentEvent }[] = [];
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: AgentEvent) => {
        events.push({ t: Date.now() - started, e });
        controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      };
      emit({ type: "thought", text: `Run ${id}` });
      try {
        await runAgent(brief, emit);
      } catch (err) {
        emit({ type: "error", message: (err as Error).message });
        emit({ type: "done" });
      }
      await saveRun({ id, brief, created: new Date().toISOString(), events }).catch(() => {});
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson", "x-run-id": id } });
}
