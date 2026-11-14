# Handoff — Exo Space: A Way Home

Read this first, before touching anything. New entries go at the top, with a
date. Then read [lore-and-mechanics.md](lore-and-mechanics.md) (the design) and
the build prompts (`prompts-*.md`).

---

## Starting point (2026-11-14)

The project starts today, from scratch, for the **NASA Space Apps Challenge
2026**, challenge "Space Mission Design Game". There is no game yet: there is a
structure, context, prompts and the exoplanet catalog, downloaded and checked.

### What it is

A 3D browser game whose universe is the real exoplanets of the NASA Exoplanet
Archive. The player travels across those worlds looking for the way back home.

### Team decisions (2026-11-14)

| Topic | Decision |
|---|---|
| Name | "Exo Space: A Way Home", provisional (see [names.md](names.md)) |
| Platform | Browser game |
| Technology | Vite + TypeScript + Three.js |
| Universe | The confirmed planets of the NASA Exoplanet Archive |
| Variety | Every planet gives a different experience, derived from its real data |
| Look | The planet's real characteristics decide how it looks and which enemies it has |
| Loading | By proximity: a planet is loaded only when the player gets close |
| Models | Start from NASA 3D Resources and rebuild them in the game's own style |
| Gameplay | Third-person action and exploration |
| Enemies | No hordes. They live in dungeons and appear on the map only because of a quest |
| Dungeons | Separate interiors: a door leads to another scene with rooms and a reward |
| Quests | Given by the NPCs on the map |
| Story | Finding the way home |

### To be decided (by the team, not by an AI)

1. **How the player travels between planets.** Picking a destination on a star
   map and landing is cheap; flying the ship through space is a whole new
   layer. What "loading by proximity" means depends on this.
2. **Who the player is and why they are far from home.**
3. **What happens with giant planets.** 2,494 of the 6,470 are four Earth radii
   or larger and have no ground to land on.
4. **Where the mission design the challenge asks for fits** (spacecraft,
   instruments, budget, mass, power, data, communications). The NPC quests
   decided so far are tasks inside the map.
5. **Which parts of the base gameplay make it in by Sunday:** combat,
   progression, loot, a ship of your own.
6. **Whether NPCs talk from a fixed script or through AI.** AI needs a server
   and a key.
7. **Single player or co-op.** The challenge values up to four players with
   roles; networked play is the riskiest piece.
8. **The final name.**

---

## The hackathon

- **Challenge:** "Space Mission Design Game". An interactive game where the
  player designs, manages and simulates a complete space mission, makes
  engineering decisions with limited resources and sees how each decision
  changes the outcome.
- **Deadline:** Sunday, November 15, 2026 at 11:59 p.m., local event time.
  "Submit for Judging" must be clicked before then; resubmitting is allowed.
- **Criteria (1 to 5 each):** impact, creativity, validity, relevance and
  presentation. Relevance measures answering the challenge and using NASA data
  as a core component, not as an add-on.

### What gets submitted

| Form field | What goes in it |
|---|---|
| Project Name | The game's name |
| High-Level Project Summary | What it is, how it answers the challenge, why it matters |
| Link to Project Demo | A video of 30 seconds at most, or up to 7 slides |
| Link to Final Project | A public link, no login |
| Detailed Project Description | What it does, how it works, tools used |
| Use of Super Intelligence (SI) | Which AI tools were used and how |
| NASA Data | See [NASA-DATA.md](NASA-DATA.md) |
| Space Agency Partner Data and Other References | Every external resource: code, text, images |

Going over 30 seconds or 7 slides makes the project ineligible for Global
Judging.

### Rules that shape the work

- **Everything in English:** the form and any linked material, including the
  text the player sees. A video may be spoken in another language if it has
  English subtitles.
- **The idea belongs to the team.** The guide allows AI to speed up the work,
  not to come up with how the challenge is solved.
- **AI use is disclosed.** Generated images and videos carry a visible
  watermark; audio and code are acknowledged in descriptive text and metadata.
- **No NASA branding in generated content:** no logos, flags or mission
  identifiers.
- **Complete references.** Every external resource used is listed in the
  references field, even if it is free. That includes code, text or models
  brought in from earlier projects.
- **Work from the weekend.** The FAQs say teams may not start on the challenge
  before the hackathon.
- **At least one NASA data set or resource** to be eligible for a Global Award.
- **No images or voices of people under 18.**

Sources: Project Submission Guide, Judging & Awards Guide and Participant FAQs
on spaceappschallenge.org, read on 2026-11-14.

### Official challenge resources

Listed on the challenge's Resources tab, read on 2026-11-14. All of them are
about the process of designing a mission, which is open item 4 above.

| Resource | What it offers |
|---|---|
| [Design and Develop Science Missions](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf) | How a mission goes from a science need to a design, and its four segments: launch, space, ground and user |
| [A Learning Game About Telescopes](https://science.nasa.gov/mission/webb/game-build-it-yourself/) | A NASA game: pick science goals, then wavelengths, instruments and optics under constraints; launch, see results and the real missions that resemble your design |
| [Mission Design Lab](https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/) | How NASA Goddard studies a concept, from brainstorming to trade studies and point design, and the disciplines it weighs: power, propulsion, thermal, communications, cost, risk |
| [Concept Maturity Levels](https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299) | JPL's scale for how mature a mission concept is, from a first idea to detailed engineering |
| [CubeSat 101](https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf) | Every phase of a small satellite mission, from concept of operations to launch and operation |
| [General Mission Analysis Tool](https://software.nasa.gov/software/GSC-19468-1) | NASA's open-source software for designing and analysing trajectories |
| [NASA Mission Viz](https://nasa.github.io/mission-viz/) | Interactive 3D view of mission trajectories in the browser |
| [CSA Digital Games and Activities](https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp) | The Canadian Space Agency's educational games |

The page also points to a 2023 Space Apps challenge, "Visualize a Space
Mission Using Virtual Reality", as a reference.

The NASA Exoplanet Archive and NASA 3D Resources are not on that list. They
still count as NASA data; using one of the listed resources as well ties the
game more closely to the challenge.

---

## NASA data

Figures checked on 2026-11-14. Citations and links are in
[NASA-DATA.md](NASA-DATA.md).

### NASA Exoplanet Archive, `pscomppars` table

- **6,470 confirmed planets** around **4,862 stars**.
- **Local copy:** `web/public/data/exoplanets.csv` (1.2 MB; 0.4 MB
  compressed). Regenerate it with `npm run data` inside `web/`.
- **It cannot be queried from the browser** (the service sends no CORS
  headers): that is why the game ships its own copy.
- **Numbers only.** There are no surfaces, images or colours; the game derives
  how each planet looks.

| Field | What it is | Planets that have it |
|---|---|---|
| `pl_name`, `hostname` | Name of the planet and of its star | 6,470 |
| `pl_rade` | Radius, in Earth radii | 6,420 |
| `pl_bmasse` | Mass, in Earth masses | 6,439 |
| `pl_eqt` | Equilibrium temperature, in kelvin | 5,930 |
| `st_teff` | Temperature of the star, in kelvin | 6,161 |
| `sy_dist` | Distance from Earth, in parsecs | 6,442 |
| `ra`, `dec` | Position in the sky | 6,470 |

Other fields in the copy: `sy_pnum`, `discoverymethod`, `disc_year`, `pl_dens`,
`pl_insol`, `pl_orbper`, `pl_orbsmax`, `pl_orbeccen`, `st_rad`, `st_mass`,
`st_spectype`.

How they are distributed (useful for deciding biomes and enemies):

| Split | Figures |
|---|---|
| By size | 1,201 rocky (under 1.6 radii) · 2,725 intermediate · 2,494 giants (4 or more) |
| By temperature | 331 under 200 K · 490 between 200 and 350 K · 3,278 between 350 and 1,000 K · 1,831 above 1,000 K |
| By star | 616 red (under 3,900 K) · 1,803 orange · 2,563 yellow · 1,179 white (6,000 K or more) |
| By distance | From 1.3 to 8,500 parsecs · 1,615 closer than 100 |
| With radius, mass, temperature and distance | 5,845 |

### NASA 3D Resources

- 227 models; 219 include a GLB file and almost all are under 5 MB.
- No GLB: Curiosity and the SLS rocket. Too heavy: Gateway (63 MB) and Space
  Exploration Vehicle (21 MB).
- Use is allowed when NASA is credited and nothing implies NASA endorses the
  project.

---

## Where everything is

```
Exo Space/
├── HANDOFF.md                  This file
├── lore-and-mechanics.md       Design document
├── names.md                    The name and the discarded ones
├── NASA-DATA.md                NASA sources and how to credit them
├── README.md                   Public presentation
├── prompt-continue-claude.md   To open a new chat with all the context
├── prompts-world.md            Catalog, planets, loading, dungeons, quests
├── prompts-characters.md       Modelling kit, player, NPCs and enemies
├── prompts-3d-models.md        Style, 3D models and adapting NASA models
├── reference-models/           Reference sheets and source GLB files
├── docs/media/                 Screenshots and clips for the README
├── video/                      Demo material
└── web/                        The game
    ├── index.html
    ├── package.json            dev · build · test · preview · data
    ├── public/data/            Exoplanet catalog and its source record
    ├── scripts/                Catalog download
    ├── src/                    Game code
    │   ├── main.ts             Entry point (today, an empty scene)
    │   ├── content/            Pure data, no Three.js
    │   ├── data/               Catalog reading and derived values
    │   └── models/             One file per model, built in code
    └── test/                   Tests run with node --test
```

---

## How we work

- **Commands**, inside `web/`: `npm install` the first time, `npm run dev`
  (http://127.0.0.1:5173), `npx tsc --noEmit`, `npm test`, `npm run build` and
  `npm run data` to download the catalog again.
- **Before calling something done:** types, tests, build and seeing it in the
  browser.
- **Language:** everything in the repository is in English: documents, code,
  comments and what the player sees. The team talks in Spanish.
- **Models:** built in code from simple parts; no imported 3D files in the
  game. NASA GLB files are reference material and are not loaded in play.
- **Pure data kept apart:** anything that does not need Three.js goes in files
  without Three.js so the tests can load it in Node.
- **Original designs:** other games are genre references; names, characters,
  art and levels are never copied.
- **Folder in iCloud:** `node_modules` holds thousands of files and iCloud
  syncs all of them. If that gets in the way, move the project out of iCloud.

---

## Build order

1. Base: catalog loaded, pick a planet and land on it.
2. Real data decides palette, gravity and enemies.
3. One type of NPC quest.
4. One dungeon template.
5. Two or three models adapted from NASA 3D Resources.
6. A 30-second demo or 7 slides, and the form. Keep Sunday afternoon free for
   this.

Each step has its prompt in `prompts-world.md`, `prompts-characters.md` and
`prompts-3d-models.md`.
