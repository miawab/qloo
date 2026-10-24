import "server-only";
import type { Content, FunctionDeclaration, Part } from "@google/genai";

// Backup model for when Gemini can't answer (out of credits, quota used up, bad key).
// Groq's free plan runs open-weight models with the OpenAI chat format; no card, so the worst case is its daily limit.
export const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
export const groqOn = () => Boolean(process.env.GROQ_API_KEY);

// Errors that a retry on Gemini won't fix: switch to Groq for the rest of the run.
export function geminiDown(err: unknown) {
  const e = err as { status?: number; message?: string };
  const status = e.status ?? Number(String(e.message ?? "").match(/"code":\s*(\d{3})/)?.[1]);
  return [401, 402, 403, 429].includes(status) || /RESOURCE_EXHAUSTED|prepayment|API key not valid/i.test(String(e.message));
}

// The free plan allows 8,000 tokens a minute, so tool results are cut down before they're sent:
// the newest ones a little, older ones (already acted on) more.
const clip = (v: unknown, max: number) => {
  const s = JSON.stringify(v);
  return s.length > max ? s.slice(0, max) + ' …"(cut short)"' : s;
};

type Msg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

// Gemini's conversation -> OpenAI messages. Tool replies are matched to calls by position, so runs that
// started on Gemini (whose calls may have no ids) carry on cleanly.
function toMessages(system: string, contents: Content[]): Msg[] {
  const out: Msg[] = [{ role: "system", content: system }];
  let lastIds: string[] = [];
  contents.forEach((c, i) => {
    const parts = c.parts ?? [];
    if (c.role === "model") {
      const calls = parts.filter((p) => p.functionCall);
      lastIds = calls.map((p, j) => p.functionCall!.id || `call_${i}_${j}`);
      const text = parts.map((p) => p.text ?? "").join("").trim();
      out.push({
        role: "assistant",
        content: text || null,
        ...(calls.length && {
          tool_calls: calls.map((p, j) => ({
            id: lastIds[j],
            type: "function" as const,
            function: { name: p.functionCall!.name ?? "", arguments: JSON.stringify(p.functionCall!.args ?? {}) },
          })),
        }),
      });
    } else {
      const replies = parts.filter((p) => p.functionResponse);
      const max = i >= contents.length - 2 ? 2500 : 1000;
      replies.forEach((p, j) => out.push({ role: "tool", tool_call_id: lastIds[j] ?? `call_${i}_${j}`, content: clip(p.functionResponse!.response, max) }));
      const text = parts.map((p) => p.text ?? "").join("").trim();
      if (text) out.push({ role: "user", content: text });
    }
  });
  return out;
}

// The free plan's 8,000-tokens-a-minute limit is per model, so when one is busy the next open model takes the turn,
// and only when all of them are busy does it wait (the run route allows 5 minutes).
const MODELS = [GROQ_MODEL, "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter((m, i, a) => a.indexOf(m) === i);

async function chat(body: Record<string, unknown>) {
  for (let round = 0; round < 4; round++) {
    let wait = 60;
    for (const model of MODELS) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model, temperature: 0.2, max_completion_tokens: 2048, ...body }),
        signal: AbortSignal.timeout(90_000),
      });
      if (r.ok) return r.json();
      const text = await r.text();
      // A garbled tool call ("Parsing failed") is a one-off: the next model tries the same turn.
      if (r.status === 400 && /failed_generation|Parsing failed/i.test(text)) continue;
      if (r.status !== 429 && r.status !== 413) throw new Error(`Backup model (Groq) ${r.status}: ${text.slice(0, 160)}`);
      const after = Number(r.headers.get("retry-after")) || Number(text.match(/try again in ([\d.]+)s/)?.[1]) || 20;
      wait = Math.min(wait, after);
    }
    await new Promise((res) => setTimeout(res, (Math.min(wait, 60) + 1) * 1000));
  }
  throw new Error("The backup model is busy right now. Try again in a minute, or open a saved run.");
}

// One agent turn on Groq, returned in Gemini's shape so the loop in agent.ts doesn't change.
// `force` names a tool the model must call this turn.
export async function groqTurn(system: string, contents: Content[], tools: FunctionDeclaration[], force?: string) {
  const data = await chat({
    messages: toMessages(system, contents),
    ...(force && { tool_choice: { type: "function", function: { name: force } } }),
    tools: tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parametersJsonSchema } })),
  });
  const m = data.choices?.[0]?.message ?? {};
  const functionCalls = ((m.tool_calls ?? []) as { id: string; function: { name: string; arguments: string } }[]).map((c) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(c.function.arguments || "{}");
    } catch {}
    return { id: c.id, name: c.function.name, args };
  });
  const parts: Part[] = [...(m.content ? [{ text: m.content as string }] : []), ...functionCalls.map((fc) => ({ functionCall: fc }))];
  return { parts, functionCalls };
}

// A single JSON answer (the no-Qloo baseline).
export async function groqJson(prompt: string) {
  const data = await chat({ messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } });
  return String(data.choices?.[0]?.message?.content ?? "");
}
