# Exo Space: A Way Home

A 3D browser game set among the real exoplanets of the NASA Exoplanet Archive.
Every world in the game is a planet that actually exists, shaped by its real
radius, mass, temperature and host star. You travel across them looking for a
way home.

Built for the NASA Space Apps Challenge 2026, challenge "Space Mission Design
Game".

> **Status (2026-11-14):** project setup. The web app starts and shows an empty
> scene; there is no gameplay yet.

## Run it

Requires Node.js 22.18 or newer.

```bash
cd web
npm install
npm run dev
```

Then open http://127.0.0.1:5173.

| Command (inside `web/`) | What it does |
|---|---|
| `npm run dev` | Starts the development server |
| `npm test` | Runs the tests |
| `npm run build` | Type-checks and builds to `web/dist/` |
| `npm run datos` | Downloads a fresh copy of the exoplanet catalog |

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
- **Code:** the starter code in `web/` (scene setup, catalog download script
  and tests) was generated with AI assistance.
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
- **Images, video and audio:** none generated with AI so far. Any added later
  will carry a visible watermark (images and video) or an acknowledgment in
  its description and metadata (audio).

Keep this section up to date as the project grows.

## Project layout

| Path | What it holds |
|---|---|
| `web/` | The game: Vite, TypeScript and Three.js |
| `web/public/datos/` | Local copy of the exoplanet catalog |
| `NASA-DATA.md` | NASA sources and how they are credited |
| `referencias-modelos/` | Reference sheets and source models |
| `docs/media/` | Screenshots and clips |
