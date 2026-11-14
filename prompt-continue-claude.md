# Prompt for continuing Exo Space in a new Claude chat

Paste the whole block below as the first message of the new chat, opened in
the project folder.

---

```
We are continuing Exo Space: A Way Home, our game for the NASA Space Apps
Challenge 2026 (challenge "Space Mission Design Game"). You are in the project
folder. Read first, in this order: HANDOFF.md (start with "Where the project
stands", then decisions, hackathon rules and NASA data), lore-and-mechanics.md
(the design: story, mechanics and build order) and NASA-DATA.md (sources and
citations).

Talk to us in Spanish. Everything you write into the repository is in English.

## What it is

- A 3D browser game in web/: Vite + TypeScript + Three.js. Its universe is the
  real exoplanets of the NASA Exoplanet Archive; the catalog is in
  web/public/data/exoplanets.csv.
- The player is the last human in the TRAPPIST-1 system and looks for the way
  to Earth. Three planets can be landed on (TRAPPIST-1 e, b and h); the rest
  of the catalog can be analysed with the suit visor.
- On each planet: quests from NPCs of other species, ruins with a guardian, a
  relic with a fragment of the story and the jump rune for the next planet.
  The ending is a jump across every exoplanet to a destroyed Earth.
- The full story and every mechanic are in lore-and-mechanics.md. Do not
  change them; build them.

## How we work

- Commands (in web/): `npm install` the first time, `npm run dev`
  (http://127.0.0.1:5173), `npx tsc --noEmit`, `npm test` (node --test),
  `npm run build` and `npm run data` (downloads the catalog again). To see
  it, use your browser with preview_start and the name "web" from
  .claude/launch.json. Before saying something is done: types, tests, build
  and seeing it in the browser.
- Models are code built with web/src/models/kit.ts (simple parts, toon
  shading, dark outline, clips). The NASA GLB files in reference-models/nasa/
  are reference material and are not loaded in play. See
  prompts-characters.md and prompts-3d-models.md.
- Real data: only the fields in the catalog, no invented figures. What the
  game derives is presented as derived, never as real data.
- No NASA logos, flags or mission identifiers.
- Original designs: other games are genre references; do not copy names,
  characters, art or levels.

## Hackathon rules that affect you

- The idea belongs to the team. You build, ask, and check against the data
  and the deadline. If a design decision is missing, ask: do not make it up.
  The open ones are in HANDOFF.md, "To be decided", and marked OPEN in
  lore-and-mechanics.md.
- Deadline: Sunday, November 15, 2026, 11:59 p.m. Say so if something does
  not fit, and propose what to cut.
- AI use is disclosed as the guide requires, in the "Use of AI tools" section
  of the README: keep it up to date, and ask the team before generating
  images or video.
- Every external resource that enters the project (code, text, images,
  models) is noted for the references field, and NASA ones in NASA-DATA.md.
- Commits and pushes: only when asked. Commits carry the team member's
  authorship alone, with no co-author line.

## State right now

The design is closed and nothing of the game is built. web/ starts and shows
an empty scene; its two tests pass. Run `git status` first: there may be work
that is not committed or pushed yet.

## Tasks, in order

1. Read the three documents and tell me in five lines what you understand the
   game to be and what the first build step is.

2. Build the two foundations, each with its own prompt: the catalog reader
   (Prompt 1 in prompts-world.md) and the modelling kit (Prompt 0 in
   prompts-characters.md).

3. Follow the build order at the end of HANDOFF.md, starting with step 1, the
   home planet. Each piece has its prompt in prompts-world.md,
   prompts-characters.md and prompts-3d-models.md. Where a prompt has a "Team
   decision" line that is still empty, ask me that decision, one at a time,
   before building.

4. After every step, update "Where the project stands" in HANDOFF.md and add
   a dated entry below it: what was done, what was checked and what was left
   unchecked.

Show me each step working before starting the next one.
```
