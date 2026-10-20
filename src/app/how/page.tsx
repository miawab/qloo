import Link from "next/link";
import { PANEL, STATS } from "@/lib/backtest";

const FLOW = [
  ["Brief", "The producer lists films and a goal in plain words."],
  ["Agent", "Gemini plans the steps and calls tools. It can only state what a tool returned."],
  ["Qloo", "Every audience question goes through Qloo's official MCP server, from the server side."],
  ["Evidence", "Results are scored against 58 past Broadway shows and shown with their source."],
  ["Memo", "A one-page greenlight memo, with the evidence behind each claim."],
];

const TOOLS = [
  ["qloo_describe", "Match each title to one exact film", "Ambiguous titles like Ghost come back with choices. The agent picks the likely one and says so."],
  ["qloo_rank", "Score audience fit", "Ranks the films for fans of six hit movie musicals. Scores are stable across calls, so they sit on the back-test scale."],
  ["qloo_entity_tags", "Themes and stage check", "What the film means to its fans, and a flag when Qloo already links it to Broadway."],
  ["qloo_audience_demographics", "Who the audience is", "Age and gender lean, shown as over or under the average."],
  ["qloo_compare_audiences", "Common ground", "What the film's fans share with musical-theatre fans."],
  ["qloo_where_popular", "Where to tour", "Heatmap cells across the US, rolled up to touring markets."],
  ["qloo_recommend", "Talent and partners", "Performers, musicians, brands, podcasts and TV the combined audience loves."],
];

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto bg-black/60 p-5 font-mono text-sm leading-relaxed text-ink">{children}</pre>;
}

export default function HowPage() {
  return (
    <main className="curtain-top mx-auto max-w-6xl px-5 pb-16 pt-32">
      <p className="label text-accent">How it works</p>
      <h1 className="mt-4 max-w-5xl font-display text-5xl sm:text-8xl">An agent with an audience behind it.</h1>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
        A language model on its own can only guess which film would make a hit musical. Overture gives it Qloo&apos;s taste data, a score
        tested on {STATS.n} real shows, and strict rules about what it can claim.
      </p>

      <ol className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-5">
        {FLOW.map(([t, d], i) => (
          <li key={t} className="bg-bg p-6">
            <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-3 font-display text-3xl">{t}</p>
            <p className="mt-3 text-base leading-relaxed text-muted">{d}</p>
          </li>
        ))}
      </ol>

      <section className="mt-20">
        <h2 className="font-display text-4xl sm:text-5xl">The Qloo tools it uses</h2>
        <div className="mt-8 border-t border-line">
          {TOOLS.map(([tool, what, why]) => (
            <div key={tool} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[16rem_14rem_1fr] sm:gap-6">
              <span className="font-mono text-sm text-accent">{tool}</span>
              <span className="text-lg">{what}</span>
              <span className="text-lg text-muted">{why}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="font-display text-4xl">One real request</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            The scoring step from the example run. The options are the producer&apos;s eight films; the signals are the six musical-fan
            films: {PANEL.map((p) => p.name).join(", ")}. IDs are shortened here.
          </p>
          <p className="mt-6 font-mono text-xs uppercase text-muted">Request</p>
          <Code>{`qloo_rank {
  "option_type": "movie",
  "options": ["48788AF8…", "DEF93FF9…", …8 films],
  "signals": ["A572B5F1…", "B8A7FAAA…", …6 films]
}`}</Code>
          <p className="mt-6 font-mono text-xs uppercase text-muted">Result, then placed on the back-test scale</p>
          <Code>{`Notting Hill  affinity 0.862  -> beats 97%
Clueless      affinity 0.858  -> beats 93%
...
Groundhog Day affinity 0.749  -> beats 24%`}</Code>
        </div>
        <div>
          <h2 className="font-display text-4xl">Data and trust</h2>
          <ul className="mt-6 space-y-5 text-lg leading-relaxed">
            <li>
              <span className="text-accent">Key stays on the server.</span> The browser never sees the Qloo or Gemini key.
            </li>
            <li>
              <span className="text-accent">No personal data.</span> Only film titles and public names go to Qloo. Results describe groups,
              never one person.
            </li>
            <li>
              <span className="text-accent">Claims need evidence.</span> The agent is told to state only what a tool returned, and every
              Qloo call is listed in the run&apos;s cue sheet.
            </li>
            <li>
              <span className="text-accent">Light on the API.</span> Calls run one at a time and answers are cached, so a saved run replays
              without new requests.
            </li>
            <li>
              <span className="text-accent">Limits are stated.</span> The score is one input, not a forecast.{" "}
              <Link href="/proof" className="underline underline-offset-4 hover:text-accent">
                See the back-test
              </Link>
              .
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
