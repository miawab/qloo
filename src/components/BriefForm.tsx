"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [
  "Clueless, Ghost, Groundhog Day, Notting Hill, Hidden Figures, The Princess Bride, Sister Act 2, The Wedding Planner",
  "Mamma Mia-sized family hit for a national tour: Paddington, The Parent Trap, Night at the Museum, Freaky Friday, Hairspray",
  "A date-night crowd pleaser: When Harry Met Sally, Crazy Rich Asians, 13 Going on 30, Sleepless in Seattle, Bridget Jones's Diary",
];

export function BriefForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const go = (brief: string) => brief.trim() && router.push(`/run?brief=${encodeURIComponent(brief.trim())}`);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(text);
      }}
      className="rounded-2xl border border-line bg-black/40 p-5 backdrop-blur"
    >
      <label htmlFor="brief" className="text-sm text-muted">
        List the films you&apos;re considering, and anything about your goal
      </label>
      <textarea
        id="brief"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. Clueless, Ghost, Groundhog Day, Notting Hill. We want a long Broadway run."
        className="mt-2 w-full resize-none rounded-xl bg-black/40 p-4 text-lg outline-none ring-1 ring-line focus:ring-accent"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button key={i} type="button" onClick={() => setText(ex)} className="rounded-full bg-panel-2 px-3 py-1 text-xs text-muted hover:text-ink">
              Example {i + 1}
            </button>
          ))}
        </div>
        <button type="submit" className="rounded-full bg-accent px-7 py-3 font-semibold text-white shadow-[0_0_30px_-5px_#ff4d4f] hover:brightness-110">
          Run the agent
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">A live run makes about 20 Qloo calls and takes one to two minutes.</p>
    </form>
  );
}
