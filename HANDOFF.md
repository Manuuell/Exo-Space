# Handoff — Exo Space: A Way Home

Read this first, before touching anything. New entries go at the top, with a
date. Then read [lore-and-mechanics.md](lore-and-mechanics.md) (the design) and
the build prompts (`prompts-*.md`).

---

## Where the project stands (2026-11-14)

Keep this section up to date after every step.

- **Decided:** the story from start to finish, the scope (three planets of
  the TRAPPIST-1 system) and the mechanics in general. See the decisions table
  below and [lore-and-mechanics.md](lore-and-mechanics.md).
- **In the repository:** the documents, the build prompts, the exoplanet
  catalog (6,470 planets), 23 NASA reference models and an empty web starter
  that builds and passes its two tests.
- **Built:** nothing of the game yet.
- **Next:** step 1 of the build order at the end of this file. It needs the
  catalog reader (Prompt 1 in `prompts-world.md`) and the modelling kit
  (Prompt 0 in `prompts-characters.md`) first.
- **Deadline:** Sunday, November 15, 2026, 11:59 p.m.

---

## NPCs and the mega-rune (2026-11-14)

Three more team decisions:

- **NPCs** are people of other species: never human and never hostile.
- **The final jump** needs only a mega-rune, which the player wins by
  defeating the last boss.
- **The player** is the last human left in the system.

In [lore-and-mechanics.md](lore-and-mechanics.md), Part 1 and section 7. Still
open there: who the last boss is, and what happened to the other humans.

---

## The last scene (2026-11-14)

Team decision: after the recording the player does not go back. The worlds
they visited are full of hostile creatures, so they are left in space, looking
for a planet to live on. Also decided: the jump rune is found by completing
the ruins of a planet, together with the relic.

In [lore-and-mechanics.md](lore-and-mechanics.md), Part 1, with the catalog's
figures for that last image (52 rocky, temperate planets) and three points
still to confirm.

---

## Relics, the ship and the jump runes (2026-11-14)

Three more team decisions:

- **Relics.** Completing the ruins of a planet gives a relic, and each relic
  shows a fragment of the story of Earth. The truth arrives piece by piece
  before the ending.
- **The ship.** The player has a ship that can be flown over the planet and
  out into space.
- **Jump runes.** To reach another planet the ship needs a jump rune, which
  gives the fuel for the jump. Without one it still flies in space but does
  not get far. This also answers how the final jump to Earth is possible.

Written up in [lore-and-mechanics.md](lore-and-mechanics.md): Part 1 for the
relics, section 7 for the ship and the runes, Part 3 for the new build order.
Build prompt: Prompt 9 in [prompts-world.md](prompts-world.md).

Nothing is built yet.

---

## Story, three planets and the ending (2026-11-14)

The team closed the story and the scope. The twist, the focus on three planets
and the jump through every exoplanet are the team's ideas; an AI assistant
proposed starting options and helped develop them.

- **Scope:** the whole catalog is on the map and can be analysed with the suit
  visor, but only three planets can be landed on, all in the TRAPPIST-1
  system: e (home), b (the depots) and h (the ruins).
- **Story:** the player was born on TRAPPIST-1 e, a descendant of colonists.
  Everyone believes a flare burned out the antenna that linked them to Earth.
  In truth, the AI that planned the colonisation spent Earth itself, and the
  first colonists hid it.
- **Ending:** find the route, call home, Earth answers, the jump across every
  exoplanet, arrival at a destroyed Earth, a satellite and its recording.

Full text in [lore-and-mechanics.md](lore-and-mechanics.md): Part 1 for the
story, section 13 for the jump, Part 3 for the recommended build order. Build
prompt for the jump: Prompt 8 in [prompts-world.md](prompts-world.md).

Nothing is built yet.

---

## Lore foundations (2026-11-14)

The team chose the foundations of the story, from starting options proposed by
an AI assistant:

- **Protagonist:** born far from Earth, a descendant of colonists, who has
  never seen it.
- **Opposition:** the fauna of each planet, abandoned machines of earlier
  expeditions and the guardians of ruins. All three.
- **Goal:** find the route to Earth with the data gathered through the suit
  visor, then call home with a transmitter rebuilt piece by piece. The game is
  won when Earth answers.

Written up in [lore-and-mechanics.md](lore-and-mechanics.md), Part 1, with
what is still open: the order of the two goals (to confirm), why the colonists
left, who the NPCs are, and how a signal that takes years to arrive gets an
answer.

Also today: 23 reference models downloaded from NASA 3D Resources into
`reference-models/nasa/` (see `SOURCES.md` there).

---

## 3D printer and partner resources (2026-11-14)

The team added a second mechanic: a 3D printer in the game, used to build the
tools the player comes to need. Design, real precedent and what is still open:
[lore-and-mechanics.md](lore-and-mechanics.md), section 12. Build prompt:
Prompt 7 in [prompts-world.md](prompts-world.md).

The Canadian Space Agency page listed among the challenge resources was
reviewed; what is useful from it is under "Space Agency Partner resources"
below and in [NASA-DATA.md](NASA-DATA.md).

Nothing is built yet.

---

## Suit visor (2026-11-14)

The team added a mechanic: the player's suit has a visor that analyses a
planet before landing on it, following the general idea of NASA's "A Learning
Game About Telescopes" (what you want to find out decides which instruments
you need, under limits). It is the first piece of mission design in the game.

- Design, real techniques and what is still open:
  [lore-and-mechanics.md](lore-and-mechanics.md), section 11.
- Build prompt: Prompt 6 in [prompts-world.md](prompts-world.md).
- Credit for the NASA game: [NASA-DATA.md](NASA-DATA.md).

Nothing is built yet.

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
| Loading | By proximity: a planet is loaded only when the player gets close. Not needed in this version, which has three playable planets |
| Scope | Three planets that can be landed on, all in the TRAPPIST-1 system: e, b and h. The rest of the catalog can be analysed with the visor |
| Ruins and relics | Every planet has ruins; completing them gives a relic with a fragment of Earth's story and the jump rune for the next planet |
| NPCs | People of other species, never human and never hostile |
| Final jump | Needs only a mega-rune, won by defeating the last boss |
| Ship and travel | The player flies a ship over the planet and into space; reaching another planet needs a jump rune, which gives the fuel for the jump |
| Ending | A plot twist: the jump to Earth across every exoplanet, a destroyed planet, and a satellite whose recording shows that the AI planning the missions spent Earth. The player does not go back: they are left in space, looking for a planet to live on |
| Models | Start from NASA 3D Resources and rebuild them in the game's own style |
| Gameplay | Third-person action and exploration |
| Enemies | No hordes. They live in dungeons and appear on the map only because of a quest |
| Dungeons | Separate interiors: a door leads to another scene with rooms and a reward |
| Quests | Given by the NPCs on the map |
| Story | Finding the way home |
| Protagonist | Born on TRAPPIST-1 e, a descendant of colonists, who has never seen Earth; the last human left in the system |
| Opposition | Fauna of each planet, abandoned machines of earlier expeditions and guardians of ruins |
| Goal | Find the route to Earth, call home with a rebuilt transmitter and, when Earth answers, make the final jump |
| Suit visor | Analyses a planet before landing, following the general idea of NASA's telescope learning game |
| 3D printer | The player builds the tools they come to need with a 3D printer in the game |

### To be decided (by the team, not by an AI)

1. **The details of the ship.** How it is flown and what there is to do in
   space.
2. **What is left of the story.** Who the last boss is, what happened to the
   other humans, which fragment each relic shows, and the points to confirm
   at the end of Part 1 of the design. Also the look of the protagonist and
   of the NPC species.
3. **The limits that make it mission design.** What the suit visor lets the
   player choose and what limits it, and what printing a tool costs. Without
   those limits the game is exploration and action, not what the challenge
   asks for.
4. **Which parts of the base gameplay make it in by Sunday:** combat,
   progression, loot.
5. **Whether NPCs talk from a fixed script or through AI.** AI needs a server
   and a key.
6. **Single player or co-op.** The challenge values up to four players with
   roles; networked play is the riskiest piece.
7. **The final name.**

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
about the process of designing a mission, which is open item 3 above.

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

### Space Agency Partner resources

The Canadian Space Agency (CSA) is one of the hackathon's Space Agency
Partners, and the guide encourages using partner resources. From its Digital
Games and Activities page, read on 2026-11-14:

| Resource | What it is | What it is good for |
|---|---|---|
| [Game – OSIRIS-REx](https://www.asc-csa.gc.ca/eng/satellites/osiris-rex/activities/game.asp) | With the Canadian laser altimeter the player reads a colour map of asteroid Bennu and picks the best site to collect a sample | A second reference for the suit visor: analyse with an instrument, then decide where to go down |
| [3D printing models](https://www.asc-csa.gc.ca/eng/multimedia/search/?type=1&search=3d%20prints) | 14 STL files: SLS rocket, Orion, Soyuz, HTV, Dragon, Cygnus, Canadarm2, Dextre, CubeSat, the OSIRIS-REx spacecraft, an astronaut, RADARSAT and Bennu | Shape references to rebuild with the kit. STL files carry no colour or movement |
| [Game – RADARSAT Constellation Mission](https://www.asc-csa.gc.ca/eng/satellites/radarsat/activities/game.asp) | The player helps a farmer, a captain and a first responder with satellite imagery (known from its description only) | A structure reference for NPC quests |

CSA terms: its materials, 3D model files included, may be reproduced for
personal, educational or informational non-commercial use when the CSA is
credited ("Credit: Canadian Space Agency"), nothing implies its endorsement,
and neither the CSA logo nor the symbols of the Government of Canada are used.
Models credited to someone else (the SLS one says "Credit: NASA") carry that
credit instead.

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
├── prompts-world.md            Catalog, planets, map, dungeons, quests, visor, printer, jump, ship
├── prompts-characters.md       Modelling kit, player, NPCs and enemies
├── prompts-3d-models.md        Style, 3D models and adapting NASA models
├── reference-models/           Reference sheets; nasa/ holds 23 NASA models and their sources
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

1. The home planet, complete: land on TRAPPIST-1 e, suit visor, one quest, one
   tool printed and used, and its ruin with a relic.
2. The jump rune and the jump to the second planet, with its ruin.
3. The final jump: the catalog as a cloud of points and the flight to Earth.
   It is cheap, it is pure NASA data and it is the best shot for the demo.
4. Arrival, the satellite and the recording as five stills.
5. Flying the ship over the planet.
6. Leaving the planet and flying in space.
7. The third planet. If there is no time, it can be analysed with the visor
   but not visited.
8. Two or three models adapted from NASA 3D Resources.
9. A 30-second demo or 7 slides, and the form. Keep Sunday afternoon free for
   this.

This is more than fits by Sunday. Steps 1 to 4 are the story from start to
finish; cut from step 5 down, never the first ones.

Each step has its prompt in `prompts-world.md`, `prompts-characters.md` and
`prompts-3d-models.md`.
