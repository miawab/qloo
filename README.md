# Overture

An agent that helps theatre producers decide which film to adapt into a stage musical, and how to launch it.

Give it the films you're considering. It matches each title to Qloo's taste graph, scores how much musical-theatre fans already love each film, and, for the strongest candidate, profiles the audience, finds the US touring markets where that audience over-indexes, shortlists performers and musicians the audience loves, and finds brands and media to reach them. It finishes with a one-page greenlight memo where every claim points to the result behind it.


## Why the score means something
The score is Qloo's affinity of a film among fans of six hit movie musicals. On 58 Broadway musicals adapted from films (1985 to 2023, leaving out shows whose stage version was itself filmed), it correlates with the original Broadway run length (Spearman 0.42, permutation p < 0.001). Fame alone correlates at 0.16. Shows whose source films scored in the top third ran a median of 565 performances; the bottom third ran 116. Details and limits are on the Proof page and in `scripts/backtest.mjs`.

## How it uses Qloo
All Qloo calls go through the `qloo mcp` server from `@qloo/qloo-harness`:
- `qloo_describe`: resolve each title to an exact film, and surface ambiguous titles
- `qloo_rank`: score the films for the musical-fan panel
- `qloo_entity_tags`: themes, and a check for films that already have a stage version
- `qloo_audience_demographics`, `qloo_compare_audiences`: who the audience is
- `qloo_where_popular`: where the audience over-indexes, rolled up to touring markets
- `qloo_recommend`: performers, musicians, brands, podcasts and TV

Qloo results describe what groups tend to like, not what any one person will do.

## Run it locally
Requires Node 20+, a Qloo API key and a Gemini API key (the free tier is enough).
```
npm install
export QLOO_API_KEY=...            # never commit this
export QLOO_BASE_URL=...           # the Qloo API base URL you were given
export GEMINI_API_KEY=...
npm run dev
```

## License
MIT
