import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { MODEL } from "@/lib/agent";
import { DATA_DIR } from "@/lib/paths";

export const runtime = "nodejs";

// The same question answered by the model alone, with no Qloo data, so the
// run page can show what Qloo changes.
export async function POST(req: Request) {
  const { films } = (await req.json()) as { films?: string[] };
  if (!films?.length || films.length > 10) return Response.json({ error: "Send 1 to 10 film names." }, { status: 400 });
  const dir = path.join(DATA_DIR, "baseline");
  const file = path.join(dir, createHash("sha256").update(films.join("|")).digest("hex").slice(0, 24) + ".json");
  try {
    return Response.json(JSON.parse(await readFile(file, "utf8")));
  } catch {}

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `A producer is choosing which film to adapt into a Broadway musical. Rank these films from best to worst bet, using only your own judgement: ${films.join("; ")}. Give each a one-sentence reason.`,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "array",
        items: {
          type: "object",
          properties: { film: { type: "string" }, reason: { type: "string" } },
          required: ["film", "reason"],
        },
      },
    },
  });
  try {
    const body = { model: MODEL, ranking: JSON.parse(res.text ?? "[]") };
    await mkdir(dir, { recursive: true });
    await writeFile(file, JSON.stringify(body));
    return Response.json(body);
  } catch {
    return Response.json({ error: "The model did not return a ranking." }, { status: 502 });
  }
}
