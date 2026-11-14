# Prompt for continuing Exo Space in a new Claude chat

Paste the whole block below as the first message of the new chat, opened in
the project folder.

---

```
We are continuing Exo Space: A Way Home, our game for the NASA Space Apps
Challenge 2026 (challenge "Space Mission Design Game"). You are in the project
folder. Read first, in this order: HANDOFF.md (context, decisions, hackathon
rules and NASA data), lore-and-mechanics.md (the design, with what is decided
and what is open) and NASA-DATA.md (sources and citations).

Talk to us in Spanish. Everything you write into the repository is in English.

## What it is and how we work

- A browser game in web/: Vite + TypeScript + Three.js. The universe is the
  real exoplanets of the NASA Exoplanet Archive; the catalog is in
  web/public/data/exoplanets.csv.
- Commands (in web/): `npm install` the first time, `npm run dev`
  (http://127.0.0.1:5173), `npx tsc --noEmit`, `npm test` (node --test),
  `npm run build` and `npm run data` (downloads the catalog again). To see
  it, use your browser with preview_start and the name "web" from
  .claude/launch.json. Before saying something is done: types, tests, build
  and seeing it in the browser.
- Models are code built with web/src/models/kit.ts (simple parts, toon
  shading, dark outline, clips). NASA GLB files are reference material and
  are not loaded in play. See prompts-characters.md and prompts-3d-models.md.
- Real data: only the fields in the catalog, no invented figures. What the
  game derives is presented as derived, never as real data.
- No NASA logos, flags or mission identifiers.
- Original designs: other games are genre references; do not copy names,
  characters, art or levels.

## Hackathon rules that affect you

- The idea belongs to the team. You build, ask, and check against the data
  and the deadline. If a design decision is missing, ask: do not make it up.
  The open ones are in HANDOFF.md, "To be decided".
- Deadline: Sunday, November 15, 2026, 11:59 p.m. Say so if something does
  not fit.
- AI use is disclosed as the guide requires. The README has a "Use of AI
  tools" section: keep it up to date, and ask the team before generating
  images or video.
- Every external resource that enters the project (code, text, images,
  models) is noted for the references field, and NASA ones in NASA-DATA.md.
- Commits and pushes: only when asked.

## State right now

Starting point. There is a structure, context, prompts and the downloaded
catalog. web/ starts and shows an empty scene. There is no gameplay.

## Tasks, in order

1. Read the three documents and tell me in five lines what you understand the
   game to be and which decisions are still open.

2. Ask me, one at a time, the open decisions that block the first step: how
   the player travels between planets and what to do with giant planets.

3. Follow the build order in HANDOFF.md. Each step has its prompt in
   prompts-world.md, prompts-characters.md and prompts-3d-models.md: start
   with Prompt 1 of prompts-world.md (catalog) and Prompt 0 of
   prompts-characters.md (modelling kit).

4. After every step, add a dated entry at the top of HANDOFF.md: what was
   done, what was checked and what was left unchecked.

Show me each step working before starting the next one.
```
