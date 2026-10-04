# Nighty Akari

A daily light-relay puzzle built with React and Vite. The website runs on Cloudflare Pages; its public puzzle JSON is published separately to Cloudflare R2.

## Game rules

1. Lamps illuminate white squares horizontally and vertically until a wall or edge. Light passes through other lamps.
2. A new lamp can only be placed on an illuminated square.
3. A numbered wall counts all beams reaching it. Its capacity must never be exceeded and its target must be met to win.
4. Lamps can be extinguished to free wall capacity, including temporary lamps used to reach new areas.
5. The initial moon is permanent.
6. Win by illuminating every white square and meeting every numbered wall target.

Click to place or extinguish a lamp. `Z` or `U` undoes a move, `R` restarts, and `Esc` closes modals. Completed results and in-progress games are stored in the browser.

## Local development and authoring

Use Node.js 22.15+ (or 24+) and npm:

```bash
npm install
npm run puzzles:build
npm run dev
```

Each file in `puzzles/source/` contains only a board and its permanent moon position:

```json
{
  "rows": ["...10", "#1.0#", "....1", "...21", "3...."],
  "seed": [4, 1]
}
```

- `.` is a white cell; `#` is an unnumbered wall; `0`–`9` are beam-count targets. One character represents one cell. Targets above 9 are not supported by this format.
- `seed` is `[row, column]`, **one-indexed**.
- Files are sorted by filename (lexicographically). Use fixed-width names such as `001.json`, `002.json`, `003.json`, then append new files.
- IDs are generated as 1, 2, 3, …; dates are consecutive calendar days starting on `2026-10-01`, configured in `scripts/build-puzzles.ts`.
- There is no manual index or schedule. Inserting, deleting, or renaming files can renumber later puzzles. Browser records are matched by both ID and content hash; renumbered entries lose their old records unless the content at that ID is unchanged.

`npm run puzzles:build` writes a lightweight `puzzles/generated/index.json`, individual `boards/<id>.json` files containing only `rows` and `seed`, and a local `analysis.json` report. The index contains only `id`, `hash`, `date`, `difficulty`, `optimalMoves`, and a relative `file` address. `hash` is the lowercase SHA-256 of UTF-8 `JSON.stringify({ rows, seed })`, with that fixed property order; metadata and solver versions are excluded. The browser recomputes it before accepting a downloaded board. All source puzzles must be successfully analyzed before the generated directory is replaced; stale local outputs are removed. Successful calculations are cached in `.puzzle-cache/` by board contents and analysis version. The entire `puzzles/` directory (including sources and generated files) and `.puzzle-cache/` are ignored by Git. Source boards are local data, not versioned with the website code. Back up `puzzles/source/` separately; cloning this repository does not restore it. Publishing uploads only the index and board files.

Browser results and in-progress games store the content hash. After successfully loading the index and initial board, startup removes entries without a hash, entries whose ID/hash no longer matches the index, and malformed records. **The first upgrade to hash-aware storage clears all previous results and progress**, while language preferences are retained. Changing `rows` or `seed` resets that puzzle's data; changing date, difficulty, or optimal moves preserves it. Restored board and undo states must fit the current white-cell bitmask, contain the permanent moon, and respect numbered-wall capacities; invalid progress resets the entire game. Restarting clears progress but preserves a matching completed result. Hashes check version consistency, not cheating or authenticity; there is no cross-tab synchronization.

Local development fetches the generated index and current board, and shows **all** puzzles in the existing archive, including future dates. Opening the archive does not download boards; selecting a puzzle downloads only that board. Successfully loaded boards and pending requests are reused by URL and expected hash within the current page session. Browser hashing uses Web Crypto and requires HTTPS or localhost. Rebuild the puzzle data and refresh after editing sources. No editor or additional UI is provided.

### Calculation and difficulty

The solver returns exact minimum moves and the minimum extinguish count among all shortest solutions. Small boards use breadth-first search; larger boards use memory-saving iterative-deepening A* (IDA*).

```bash
npm run puzzles:build -- --algorithm ida
npm run puzzles:build -- --max-states 1000000 --timeout-seconds 300
```

`--algorithm bfs|ida` selects the solver explicitly. `--max-states` and `--timeout-seconds` accept non-negative integers; `0` means unlimited. Computation can take a long time on large boards, and available memory/stack still impose practical limits. An incomplete calculation is not classified as unsolvable and cannot be published. Cached successful results are reused regardless of the new budget or algorithm. Delete `.puzzle-cache/` when you want to recalculate; cache does not resume interrupted searches. Exact solutions are keyed by `SOLVER_VERSION`; difficulty has its own `ANALYSIS_VERSION`, so rating changes reuse exact solutions and recompute ratings on every build.

Difficulty combines estimated discovery effort with a smaller execution/planning component:

```text
score = 2 × log2(discoveryEffort)
      + 0.15 × optimalMoves
      + 0.6 × minimumExtinguishesAmongShortestSolutions
      + 0.5 × regressions
      + 0.5 × planningDepth

rejected: score < 5 (entire build/publication fails)
easy:     5 ≤ score < 15
medium:  15 ≤ score < 25
hard:    score ≥ 25
```

The score is rounded to one decimal before classification and minimum-score validation. Every puzzle must score at least 5; the build lists all below-minimum puzzles and aborts before changing any generated files. Publication runs this same validation before any upload. Sources are never automatically skipped or deleted. `discoveryEffort` is at least 1: the median number of unique states explored by eight deterministic, locally guided probes, divided by `optimalMoves + 1`. Probes prefer increasing illuminated area and satisfying numbered targets. They also apply basic final-lamp constraint propagation: a filled target excludes remaining lamps, a target that needs every remaining candidate forces them on, and an uncovered square with one remaining candidate forces that lamp on. These are **final-state** deductions; excluded lamps remain legal as temporary relays. Inferred final-lamp agreement is an additional move preference, not a legality constraint.

Each probe uses a different row/column order and axis direction to resolve ties. It may backtrack and explore solutions up to `optimalMoves + max(6, ceil(optimalMoves / 2))` moves, with caps of 4,000 unique states and 16,000 visits. An unfinished probe records its explored count and unsuccessful status; it neither proves unsolvability nor affects the exact solver's result. Capped scores can underestimate especially difficult boards. `probeSolved` and `probeStates` in the report make this limitation visible.

`regressions` counts moves in the representative shortest path that reduce combined visible progress (illuminated fraction plus mean positive-target completion). `planningDepth` is the longest interval without exceeding a previous progress peak. These are path-dependent proxies for temporary setbacks, not a mathematically proven minimum planning depth over all solutions. Extinguish count remains a modest signal because capacity changes can be difficult even when illumination is unchanged.

The thresholds are fixed, not percentile-based: adding boards does not reclassify earlier boards. The heuristic was inspected against sampled authored boards, but has **not** been calibrated to measured player performance. The rating implementation lives in `src/engine/difficulty.ts`; detailed metrics, probe completion, and a representative shortest path remain in local `analysis.json`, not the published game JSON.

## Public R2 setup

One-time setup in your Cloudflare account:

1. Create an R2 bucket and connect a subdomain of your existing Cloudflare-managed domain, such as `puzzles.example.com`. Use a custom domain for production, not `r2.dev`.
2. In the bucket's CORS settings, allow public JSON reads. Since this puzzle bank is public, the following dashboard policy permits reads from any origin:

   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"]
     }
   ]
   ```

3. Add a Cloudflare Cache Rule for the puzzle hostname covering `/index.json` and `/boards/` paths with **Bypass cache**. Purge any old cached objects after changing CORS/cache settings. Both the index and mutable board files are uploaded with `Cache-Control: no-cache, max-age=0, must-revalidate`.
4. Create an R2 **Object Read & Write** S3 token scoped to this bucket. Record its Access Key ID, Secret Access Key, and S3 endpoint.
5. Copy `.env.example` to `.env.local` and fill in your public URL and local upload credentials. The file is ignored by Git. Never put credentials in `VITE_` variables or a Cloudflare Pages frontend environment variable.

Official references: [public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/), [R2 credentials](https://developers.cloudflare.com/r2/api/tokens/).

## Publish puzzles independently

```bash
npm run puzzles:publish
# Solver flags also work when publishing:
npm run puzzles:publish -- --timeout-seconds 300
```

Publishing validates settings, analyzes all source puzzles (reusing cached analysis), uploads every `boards/<id>.json`, then uploads `index.json` **last**. Invalid, unsolvable, or incomplete puzzles abort publishing. A board upload failure prevents the index upload, and errors are reported in the terminal.

Board URLs are fixed and overwritten in place: publication is not atomic across files. During an update, an older index or an already open page can read newly overwritten boards; a failed upload can leave some boards replaced. There are no rollback tools, transactions, or server-side code. Hash checks reject a board that does not match the loaded index instead of applying the wrong puzzle or saved state, but do not make publication atomic. Remote old objects are not deleted, but the new index does not reference them.

All puzzle data is publicly readable, including future boards. Only the production archive UI hides future puzzles.

## Website deployment

Set **only** `VITE_PUZZLES_URL` in your Cloudflare Pages build environment to the full public object URL, for example `https://puzzles.example.com/index.json`.

```bash
npm run build
```

Use `npm run build` and output directory `dist` in Cloudflare Pages. No Functions or R2 binding are needed. `npm run preview` previews the production build and reads the same remote URL.

The website build does not calculate or embed puzzles. Before mounting the existing game, it fetches and validates the index, selects the current daily puzzle, and downloads only that board. Board addresses are resolved relative to the index URL. Historical boards are downloaded on selection, not when opening the archive. Large boards therefore do not increase startup downloads unless selected as the daily puzzle.

There is **no bundled puzzle bank, fallback data, loading/error UI, or automatic retry**. A failed startup request is recorded in the console and the game does not start. A failed archive selection keeps the current game and archive unchanged; selecting the entry again makes a new request. When selections overlap, only the latest selection is applied. If today's puzzle is absent, the latest released puzzle is selected with its actual date; puzzles do not loop.

For the first hash-aware rollout, publish puzzle data containing `hash` **before** deploying the updated website. The old website ignores the extra index field; the new website requires it and rejects old indexes. Confirm the public index has updated and purge any stale cached puzzle data if necessary. Subsequent content updates clear only mismatched puzzle data on the next successful startup.

Deploy the website once after configuring the public URL. Subsequent puzzle updates need only `npm run puzzles:publish`, not Git commits or a Pages deployment. Website code changes still require a normal deployment.

## Verification

```bash
npm run typecheck
npm run build
```

No test suite is included. Use actual batch analysis and manual gameplay to check authored puzzles.
