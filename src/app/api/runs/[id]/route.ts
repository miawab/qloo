import { loadRun } from "@/lib/runs";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const run = await loadRun((await params).id);
  return run ? Response.json(run) : Response.json({ error: "Not found" }, { status: 404 });
}
