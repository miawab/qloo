import "server-only";
import { GoogleGenAI, type Content, type FunctionDeclaration, type Part } from "@google/genai";
import { BANDS, PANEL, STATS } from "./backtest";
import {
  audienceProfile,
  creativeTeam,
  marketingPartners,
  resolveTitle,
  scoreFilms,
  tourMarkets,
  type Film,
} from "./overture";
import type { QlooCall } from "./qloo";

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
const MAX_TURNS = 12;

export type Memo = {
  headline: string;
  recommendation: string;
  pick: string;
  reasons: { claim: string; evidence: string }[];
  audience: string;
  tour: string;
  creative: string;
  marketing: string;
  risks: string[];
  nextSteps: string[];
};

export type AgentEvent =
  | { type: "thought"; text: string }
  | { type: "step"; tool: string; args: Record<string, unknown> }
  | { type: "qloo"; call: QlooCall }
  | { type: "result"; tool: string; data: unknown }
  | { type: "memo"; memo: Memo }
  | { type: "error"; message: string }
  | { type: "done" };

const tools: FunctionDeclaration[] = [
  {
    name: "resolve_films",
    description:
      "Match the producer's film titles to exact Qloo movie entities. Returns resolved films, and choices for ambiguous titles.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        films: {
          type: "array",
          items: {
            type: "object",
            properties: { title: { type: "string" }, year: { type: "integer" } },
            required: ["title"],
          },
        },
      },
      required: ["films"],
    },
  },
  {
    name: "score_films",
    description:
      "Score films by how much musical-theatre fans love them, calibrated against 58 past Broadway adaptations. Pass Qloo film ids.",
    parametersJsonSchema: {
      type: "object",
      properties: { film_ids: { type: "array", items: { type: "string" } } },
      required: ["film_ids"],
    },
  },
  ...(
    [
      ["audience_profile", "Who the film's audience is: age and gender lean, themes, and what it shares with musical-theatre fans."],
      ["tour_markets", "US touring markets where the film's audience over-indexes."],
      ["creative_team", "Performers and musicians the combined film and musical-fan audience loves."],
      ["marketing_partners", "Brands, podcasts and TV shows the combined audience over-indexes on."],
    ] as const
  ).map(([name, description]) => ({
    name,
    description,
    parametersJsonSchema: { type: "object", properties: { film_id: { type: "string" } }, required: ["film_id"] },
  })),
  {
    name: "write_memo",
    description: "Finish with a one-page greenlight memo for investors. Call exactly once, last.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        headline: { type: "string", description: "One sentence." },
        pick: { type: "string", description: "The film you recommend adapting." },
        recommendation: { type: "string", description: "Two or three sentences." },
        reasons: {
          type: "array",
          items: {
            type: "object",
            properties: {
              claim: { type: "string" },
              evidence: { type: "string", description: "The tool result and numbers behind the claim." },
            },
            required: ["claim", "evidence"],
          },
        },
        audience: { type: "string" },
        tour: { type: "string" },
        creative: { type: "string" },
        marketing: { type: "string" },
        risks: { type: "array", items: { type: "string" } },
        nextSteps: { type: "array", items: { type: "string" } },
      },
      required: ["headline", "pick", "recommendation", "reasons", "audience", "tour", "creative", "marketing", "risks", "nextSteps"],
    },
  },
];

const SYSTEM = `You are Overture, an analyst for theatre producers deciding which film to adapt into a stage musical.
You work only from tool results. Never state a number, name or ranking that a tool did not return.

Workflow:
1. resolve_films for every title. If a title is ambiguous, pick the choice the producer most likely meant (usually the best-known film) and say which one you assumed.
2. score_films for all resolved films in one call.
3. For the top-scoring film (or the one the producer asked about), call audience_profile, tour_markets, creative_team and marketing_partners.
4. write_memo. Every reason must cite the tool result behind it.

How to read the score: it is Qloo's affinity of the film among fans of ${PANEL.map((p) => p.name).join(", ")}.
In a back-test on ${STATS.n} Broadway musicals adapted from films (1985 to 2023), this score correlated with the original run length (Spearman ${STATS.rho.toFixed(2)}; fame alone ${STATS.fameRho.toFixed(2)}).
Bands: ${BANDS.map((b) => `${b.label}: median run ${b.medianRun} performances, ${Math.round(b.longRunShare * 100)}% ran 500+`).join("; ")}.
The score is evidence about audience fit, not a forecast of one show's result: book, score, cast, budget and timing matter too. Say so in the risks.
Films in the fan panel (${PANEL.map((p) => p.name).join(", ")}) cannot be scored, because the score is measured against them. If the producer lists one, say it was left out and why.
If a scored film has alreadyOnStage tags, a stage version probably exists: its score may be inflated and the rights may be taken. Say so, and prefer a film without that flag when scores are close.
Qloo describes groups of people, never individuals.

Memo style: write for a busy investor. Plain words, short sentences.
- Each field is one or two sentences. Three to four reasons, four risks at most, three next steps.
- Use few numbers and round them: "beats 97% of past adaptations", "median run 565 performances". Never list raw affinity decimals.
- Name at most three people, brands or places per field.
- Evidence is written for a reader, not a developer: say "Qloo's audience-fit score" or "Qloo's touring heatmap", never tool or field names like score_films or alreadyOnStage.`;

type Emit = (e: AgentEvent) => void;

export async function runAgent(brief: string, emit: Emit) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });
  const films = new Map<string, Film>();
  const onCall = (call: QlooCall) => emit({ type: "qloo", call });

  const filmFor = (id: string) => {
    const f = films.get(id);
    if (!f) throw new Error(`Unknown film id ${id}. Resolve it first.`);
    return f;
  };

  const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    resolve_films: async (args) => {
      const list = (args.films as { title: string; year?: number }[]).slice(0, 10);
      const out = [];
      for (const { title, year } of list) {
        const r = await resolveTitle(title, year, onCall);
        if (r.status === "resolved") films.set(r.film.id, r.film);
        if (r.status === "ambiguous") r.choices.forEach((c) => films.set(c.id, c));
        out.push(r);
      }
      return out;
    },
    score_films: async (args) => scoreFilms((args.film_ids as string[]).map(filmFor), onCall),
    audience_profile: async (args) => audienceProfile(filmFor(args.film_id as string), onCall),
    tour_markets: async (args) => tourMarkets(filmFor(args.film_id as string), onCall),
    creative_team: async (args) => creativeTeam(filmFor(args.film_id as string), onCall),
    marketing_partners: async (args) => marketingPartners(filmFor(args.film_id as string), onCall),
  };

  const contents: Content[] = [{ role: "user", parts: [{ text: brief }] }];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction: SYSTEM, tools: [{ functionDeclarations: tools }], temperature: 0.2 },
    });
    const parts = res.candidates?.[0]?.content?.parts ?? [];
    contents.push({ role: "model", parts });

    const text = parts.map((p) => p.text ?? "").join("").trim();
    if (text) emit({ type: "thought", text });

    const calls = res.functionCalls ?? [];
    if (!calls.length) break;

    const replies: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const args = (call.args ?? {}) as Record<string, unknown>;
      if (name === "write_memo") {
        emit({ type: "memo", memo: args as unknown as Memo });
        emit({ type: "done" });
        return;
      }
      emit({ type: "step", tool: name, args });
      let response: Record<string, unknown>;
      try {
        const data = await handlers[name](args);
        emit({ type: "result", tool: name, data });
        response = { output: data };
      } catch (err) {
        response = { error: (err as Error).message };
      }
      replies.push({ functionResponse: { id: call.id, name, response } });
    }
    contents.push({ role: "user", parts: replies });
  }
  emit({ type: "error", message: "The agent stopped before writing a memo." });
  emit({ type: "done" });
}
