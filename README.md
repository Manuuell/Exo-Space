# Exo Space: A Way Home

A 3D browser game set among the real exoplanets of the NASA Exoplanet Archive.
Every world in the game is a planet that actually exists, shaped by its real
radius, mass, temperature and host star. You travel across them looking for a
way home.

Built for the NASA Space Apps Challenge 2026, challenge "Space Mission Design
Game".

TRAPPIST-1 e is dying, and you are on it. One valley is still habitable;
beyond its mountains the land burns. The ship needs hull plates from the
ruins, ore, crystal and solar energy from orbit, the beacons lit to aim the
jump, and the colonists, so no one stays behind. A task bar shows what is
still missing and where to find it, and why the ship needs it, with the
planet's real values from the catalog. With everything aboard you leave,
and the world ends behind you.

> **Status (2026-11-15):** playable prototype, online at
> **https://exospace.sentralabs.co**: the last valley of TRAPPIST-1 e,
> dungeons, the ship, space mining, the task bar and the end.

## Run it

Requires Node.js 22.18 or newer.

```bash
cd web
npm install
npm run dev
```

Then open http://127.0.0.1:5173/play.html to play. T shows what the ship
needs and where, H the controls and M the map.

| Command (inside `web/`) | What it does |
|---|---|
| `npm run dev` | Starts the development server |
| `npm test` | Runs the tests |
| `npm run build` | Type-checks and builds to `web/dist/` |
| `npm run build:site` | Builds the game for the public site to `web/dist-site/`, with the game as its front page |
| `npm run data` | Downloads a fresh copy of the exoplanet catalog |

For development, with `npm run dev` running, `/models.html` plays each model's
clips and exports it as GLB, and `/references.html` draws its reference views.

## NASA data

- **NASA Exoplanet Archive**, Planetary Systems Composite Parameters table
  (DOI 10.26133/NEA13): every planet in the game.
- **NASA 3D Resources**: real spacecraft and equipment used as reference for
  models rebuilt in the game's own style.

Sources, credits and usage rules are in [NASA-DATA.md](NASA-DATA.md). Colours,
terrain and creatures are derived from the real numbers by the game; the
archive holds no surface data or images.

## Use of AI tools

This project uses AI assistance, disclosed as the NASA Space Apps submission
guide requires.

- **Tool:** Claude (Anthropic), through Claude Code.
- **Code:** the code in `web/` (scene setup, catalog download script, catalog
  reader and derived values, modelling kit, development viewers and tests)
  was generated with AI assistance.
- **Data:** the exoplanet catalog is an unmodified copy from the NASA Exoplanet
  Archive. It is not AI-generated.
- **Documents:** the working documents and build prompts in this repository
  were drafted with AI from the team's decisions.
- **Research:** AI was used to read the challenge rules, check which NASA data
  services respond and check name availability. It also suggested name
  options, including the working title.
- **Design:** design decisions are made by the team. AI proposals, such as the
  table that maps planet data to what it changes in the game, are marked as
  proposals in the design document until the team validates them.
- **Story:** for the foundations of the story (protagonist, opposition and
  goal), AI proposed starting options and the team chose and combined them.
  The twist ending, the focus on three planets and the jump across every
  exoplanet are the team's ideas; AI helped develop and write them up.
- **Audio:** every sound effect, ambience and the music in `web/public/audio/`
  were generated with AI (Google Gemini). Each file says so in its metadata;
  the prompts and the list are in [docs/audio/SOURCES.md](docs/audio/SOURCES.md).
- **Images and video:** none generated with AI so far. Any added later will
  carry a visible watermark.

Keep this section up to date as the project grows.

## Other references

- **Meta Space** (https://github.com/Manuuell/Meta-Space-, MIT licence, live
  at https://metaspace.sentralabs.co): an earlier game by the same team. The dragon Ashwing and the way the guardians
  fight follow the ideas of its bosses: attacks marked on the ground before
  they land, a flying boss that circles, bombs, breathes and dives and lands
  to be hurt, and feints and knockback. All of it was written anew for this
  game; no code or model was copied.

## Project layout

| Path | What it holds |
|---|---|
| `web/` | The game: Vite, TypeScript and Three.js |
| `web/public/data/` | Local copy of the exoplanet catalog |
| `NASA-DATA.md` | NASA sources and how they are credited |
| `HANDOFF.md` | Project context: decisions, open questions, hackathon rules |
| `lore-and-mechanics.md` | Design document |
| `prompts-*.md` | Build prompts for the world, the characters and the 3D models |
| `reference-models/` | Reference sheets and source models |
| `docs/media/` | Screenshots and clips |
