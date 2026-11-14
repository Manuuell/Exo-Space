# EXO SPACE: A WAY HOME — Design document

Status on 2026-11-14: starting point. Every section says whether it is
**DECIDED** by the team or **OPEN**. Open items are the team's to decide; an AI
may ask and check, never fill them in on its own.

---

## PART 1 — LORE

### Premise `DECIDED`

The player is far from home, among real worlds: the planets humanity has
confirmed around other stars. They want to go back.

"Home" has a real position. The catalog gives every planet's distance from
Earth, from 1.3 to 8,500 parsecs, so on each world the game can say how far
away home is.

### To be written `OPEN`

- Who is the player? Do they travel alone?
- Why are they far from home and what stops them from going back?
- What or who stands in the way? Where do the dungeon enemies come from?
- Who are the NPCs that give quests and what are they doing on those planets?
- What counts as "getting home" and how does the game end?

### Tone `OPEN`

To be decided: bright adventure, loneliness in space, humour. It shapes the
palette, the music and the way NPCs talk.

---

## PART 2 — MECHANICS

### 1. A universe of real planets `DECIDED`

The game's map is the catalog of confirmed exoplanets. Every planet carries
its real name, its star and its figures, and the player can see them.

### 2. Every planet, a different experience `DECIDED`

The planet's real characteristics decide how it looks, how it plays and which
enemies it has. The catalog holds numbers only, so colours and terrain are
derived from them.

Starting proposal for that derivation, pending the team's validation:

| Real data | What it can decide |
|---|---|
| Temperature of the star (`st_teff`) | Colour of the light and the sky: red, orange, yellow or white |
| Temperature of the planet (`pl_eqt`) | Palette and biome: frozen, temperate, warm, scorched |
| Radius and mass (`pl_rade`, `pl_bmasse`) | Surface gravity (mass divided by radius squared) and type of planet |
| Light it receives (`pl_insol`) | Brightness of the day and harshness of the weather |
| Orbit (`pl_orbper`, `pl_orbeccen`) | Length of the day or the year in the game, seasons |
| A combination of the above | Family and trait of the planet's enemies |

So that 6,470 planets do not repeat, the palette should be tinted continuously
by the numbers, not picked from a handful of fixed biomes.

When a planet is missing a value, the game says so and uses a neutral one. No
figures are made up.

### 3. Loading by proximity `DECIDED`

A planet is loaded only when the player gets close. The whole catalog weighs
0.4 MB compressed and can stay in memory; what loads on approach is what the
game generates for that planet: terrain, models, quests.

What "getting close" means depends on section 7.

### 4. No hordes `DECIDED`

Enemies do not arrive in waves. They are in the dungeons and appear on the map
only when a quest brings them.

### 5. Dungeons `DECIDED`

Separate interiors. There is a door on the map; going in loads another scene
with rooms, enemies waiting inside and a reward at the end. On the way out the
player returns to the same spot on the planet and finds the surface as they
left it.

Still to settle: how many rooms, what reward, whether the dungeon changes with
the planet's data and whether it can be replayed.

### 6. NPC quests `DECIDED`

On the map there are NPCs who give quests: the player accepts, fulfils an
objective and collects a reward. Enemies that appear outside the dungeons do
so because of a quest.

Still to settle: types of quest, how the objective is tracked on screen and
what is earned.

### 7. Travel between planets `OPEN`

Two paths: pick a destination on a star map and land, or fly the ship through
space. The first fits the deadline; the second is a whole new layer.

### 8. Mission design `OPEN`

This is what the challenge asks for and it has no place in the game yet:
deciding before departure which spacecraft, which instruments and on what
budget, and having those decisions change what happens next.

### 9. Base gameplay `DECIDED` in general, `OPEN` in detail

Third-person action and exploration. Still to settle what makes it in by
Sunday: type of combat, character progression, loot and whether the player
builds or upgrades their ship.

### 10. Models from NASA `DECIDED`

Spacecraft, rovers, antennas and tools start from the real models of NASA 3D
Resources and are rebuilt in the game's style, with no logos or flags.

---

## What the challenge asks and where it stands

| The challenge asks for | Today in the design |
|---|---|
| Defining the mission objective | Open (section 8) |
| Designing the spacecraft and choosing instruments | Open (sections 8 and 9) |
| Choosing a launch vehicle and an orbit | No place yet |
| Managing mass, power, budget, data, communications, time | No place yet |
| Every decision having consequences | Real gravity and weather can provide them (section 2) |
| Simulating the mission and explaining why it succeeds or fails | No place yet |
| Playing alone or in a team of up to four | Open |
| Using NASA data as a core component | Covered (sections 1, 2 and 10) |

---

## PART 3 — PRIORITIES

With the deadline on Sunday the 15th at 11:59 p.m., one piece of each kind
fits:

1. Catalog loaded, pick a planet and land.
2. Real data decides palette, gravity and enemies.
3. One type of NPC quest.
4. One dungeon template.
5. Two or three models adapted from NASA.
6. Demo and form, on Sunday afternoon.

### Known risks

- **Relevance.** Without section 8, the game is about exploration and action,
  not mission design.
- **Scope.** Flying between planets, networked co-op and dungeons as interiors
  are the three most expensive pieces.
- **Giant and scorched planets.** They are most of the catalog: 2,494 with no
  ground and 1,831 above 1,000 K. What to do with them has to be decided.
- **Language.** Everything the player sees has to be in English.
