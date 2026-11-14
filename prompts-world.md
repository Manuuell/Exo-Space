# Prompts for building the world of Exo Space

Nine prompts, in order. Each one is pasted into an AI session opened in the
project folder, always with the **rules block** in front.

They are for building what the team has already decided. Where a decision is
missing there is a **"Team decision"** line: write it in before pasting the
prompt. If it is left blank, the AI has to ask, not choose.

---

## Rules block (paste in front of every prompt)

```
You are working on Exo Space: A Way Home, a browser game in web/ (Vite +
TypeScript + Three.js) for the NASA Space Apps Challenge 2026. The game's
universe is the real exoplanets of the NASA Exoplanet Archive. Read HANDOFF.md
and lore-and-mechanics.md first.

Rules:
- You build what the team decided. If a design decision is missing (story,
  mechanics, what happens on each planet), ask: do not make it up.
- Real data: use only the fields in web/public/data/exoplanets.csv. Do not
  invent figures. If a planet is missing a value, the game says so and uses a
  neutral one.
- Everything in the repository is in English: code, comments, documents and
  what the player sees. Planet and star names are shown exactly as they come
  in the catalog.
- What the game derives (colours, terrain, weather, creatures) is presented
  as derived from real data, never as real data.
- No NASA logos, flags or mission identifiers.
- Pure data goes in files without Three.js (src/content/, src/data/) so the
  tests can load it in Node.
- Original designs: other games are genre references; names, characters, art
  and levels are never copied.
- Before finishing: `npx tsc --noEmit`, `npm test` and `npm run build` in
  web/ with no errors, and see it in the browser with `npm run dev`.
```

---

## Prompt 1 — Exoplanet catalog

```
I want the game to read the exoplanet catalog and keep it in memory at all
times. Data only, no Three.js and nothing on screen yet.

1. web/src/data/exoplanets.ts: the Exoplanet type with the twenty fields of
   web/public/data/exoplanets.csv (numeric ones as number | null) and a
   function that turns the CSV text into the list. The CSV has quoted text
   and empty cells.

2. web/src/data/derived.ts: what is computed from the data, with null when
   an input is missing:
   - Surface gravity, in Earth g: mass / radius².
   - Escape velocity, in km/s: 11.19 × square root of (mass / radius).
   - Size class: rocky (under 1.6 Earth radii), intermediate (1.6 to 4) or
     giant (4 or more).
   - Thermal band: under 200 K, 200 to 350, 350 to 1,000, or 1,000 and
     above.
   - Colour of the star from its temperature, using a blackbody
     approximation.
   - Distance from Earth in light-years: parsecs × 3.26156.
   - Position in space from ra, dec and sy_dist, with Earth at the origin.

3. web/test/exoplanets.test.ts: the catalog loads, has more than 6,000
   planets, the nearest one is 1.30 parsecs away, Earth (mass 1, radius 1)
   gives gravity 1 and escape velocity 11.19, a 3,000 K star comes out
   redder than a 6,500 K one, and a planet with no mass gives null gravity.

When it is done, tell me how many planets have every derived value and how
many do not.
```

---

## Prompt 2 — A planet from its data

**Team decision** (see `lore-and-mechanics.md`, section 2): confirm or correct
the table that links each real value to what it decides in the game.

```
Table validated by the team:
[paste here the table from section 2 of lore-and-mechanics.md, once reviewed]
```

```
I want to land on an exoplanet from the catalog and have it look and play
differently depending on its real data.

1. web/src/content/planet.ts (pure data): a function that takes an Exoplanet
   and returns the description of the playable planet. The same input always
   gives the same planet: the seed comes from the planet's name.
   - Sky, light and ground palette tinted continuously by the temperature of
     the star and of the planet. I do not want a short list of fixed biomes:
     two planets with different figures have to look different.
   - Real gravity applied to jumping and falling, capped so it stays
     playable.
   - Terrain, weather and hazards according to the validated table.
   - The planet's enemy family, according to the validated table.

2. web/src/world.ts: builds the planet's scene from that description. Terrain
   and sky generated in code.

3. A planet card with two clearly separated columns: "Real data" (what comes
   from the catalog, with units) and "Derived" (what the game works out).

4. Tests in web/test/planet.test.ts: same planet, same description; a cold
   planet and a scorched one give different palettes; with incomplete data it
   does not fail and flags which value is missing.

Show me three very different planets (one cold, one temperate, one scorched)
in screenshots before going on.
```

---

## Prompt 3 — The map of known worlds and the three planets

```
I want a map where the player sees the whole catalog and finds the planets
that can be visited.

1. The whole catalog is always in memory (it weighs 0.4 MB compressed).

2. The map shows every planet that has a position at its real place, with
   Earth at the origin. It is the same cloud of points the jump uses
   (Prompt 8). Any planet can be selected to see its catalog values and to
   analyse it with the suit visor (Prompt 6).

3. Three planets can be landed on, all in the TRAPPIST-1 system and visited
   in this order: e, b and h. They are marked on the map. Every other planet
   says clearly that it can be analysed but not visited in this version.

4. Reaching another planet is done with the ship and a jump rune (Prompt 9),
   not from the map.

5. Pure data in web/src/content/playable.ts: which planets are playable and
   in what order. With tests in web/test/playable.test.ts: the three exist in
   the catalog and have every value the planet generator needs.

Loading by proximity is not needed in this version: one playable planet is
loaded at a time.

Show me the map with the three planets marked before going on.
```

---

## Prompt 4 — Dungeons

```
I want dungeons: interiors separate from the planet's map. There are two
kinds: the ruins, which every planet has, and the depots of the abandoned
machines. Start with the ruins.

1. There are doors on the planet's map. Going in loads another scene, closed
   in, with several rooms, enemies waiting inside and a reward at the end.

2. Dungeon enemies do not chase the player across the map: they stay in
   their room and wake up when the player comes in. In the ruins, a guardian
   waits in the last room.

3. On the way out the player returns to the same spot on the planet and finds
   it as they left it: position, items picked up, quests in progress.

4. The dungeon is generated in code from a template and from the planet's
   data (palette and enemy family). The same door always leads to the same
   dungeon.

5. Completing the ruins of a planet gives two things: a relic, which shows a
   fragment of the story of Earth, and the jump rune for the next planet.
   The last boss gives the mega-rune instead.

6. Pure template data in web/src/content/dungeon.ts, with tests: every room
   is connected, there is one entrance and one end, the reward is at the
   end, and a ruin gives its relic and its rune exactly once.

We take the structure of the genre (door, rooms, reward), not the names, art
or levels of any game.

Before starting, ask me how many rooms and whether it can be replayed. Show
me a whole dungeon in screenshots before going on.
```

---

## Prompt 5 — NPC quests

**Team decision** (open item 5 in `HANDOFF.md`): whether NPCs talk from a fixed
script or through AI.

```
Team decision on how NPCs talk:
[write here: fixed script, or AI with a fallback script]
```

```
I want the NPCs on the map to give quests. The NPCs are people of other
species: never human and never hostile.

1. A quest has: who gives it, what it asks for, how the game knows it is
   done and what reward it gives. Pure data in web/src/content/quests.ts.

2. The player walks up to the NPC, talks, accepts the quest, completes it and
   comes back to collect. The active quest and how much is left are always
   on screen.

3. There are no hordes. Enemies that appear outside the dungeons do so
   because a quest brings them, where the quest says and in the number it
   says.

4. Start with a single type of quest, complete from start to finish. The
   other types come later.

5. Tests in web/test/quests.test.ts: a quest cannot be collected without
   completing it, cannot be accepted twice, and its state is saved.

Before starting, ask me which type of quest comes first, who gives it and
what is earned.
```

---

## Prompt 6 — Suit visor

**Team decision** (see `lore-and-mechanics.md`, section 11): what the player
chooses, what limits it and what it costs to land without analysing.

```
Team decisions on the suit visor:
- What the player chooses: [write here]
- What limits the choice (power, number of instruments, data, time): [write here]
- What a poor or skipped analysis costs after landing: [write here]
- Where the analysis happens: [write here]
```

```
I want the player to analyse a planet with the suit visor before landing on
it.

1. Pure data in web/src/content/visor.ts: the instruments, what each one
   reveals and what it costs, following the team's decisions above. Each
   instrument reveals real catalog fields through the real technique that
   measures them (see the table in lore-and-mechanics.md, section 11). No
   instrument reveals something the catalog does not hold.

2. The visor screen: the planet's name and star; the values already
   revealed, with units; the ones still hidden; and the instruments
   available, with their cost. "Real data" and "Derived" stay clearly
   separated, as on the planet card.

3. The limit works: the player cannot reveal everything and has to choose.

4. What was revealed matters after landing, as the team decided.

5. Tests in web/test/visor.test.ts: an instrument only reveals its own
   fields, the limit cannot be exceeded, a missing value is reported as
   missing, and the same choices on the same planet give the same result.

We take the general idea of NASA's "A Learning Game About Telescopes" (what
you want to learn decides the instruments, under limits), not its text or
art.

Show me the visor on three different planets before going on.
```

---

## Prompt 7 — 3D printer

**Team decision** (see `lore-and-mechanics.md`, section 12): which tools
exist, what printing costs and where and when the player can print.

```
Team decisions on the 3D printer:
- Tools and what each one is for: [write here]
- What printing costs (material, power, time) and where the material comes
  from: [write here]
- Where the printer is (ship, suit or a base on the planet): [write here]
- When the player can print (any time, or only before landing): [write here]
- Whether the suit visor tells the player which tools a planet demands:
  [write here]
```

```
I want a 3D printer in the game that the player uses to build the tools they
need.

1. Pure data in web/src/content/tools.ts: the tools, what each one does and
   what it costs to print, following the team's decisions above.

2. The printer screen: the tools that can be printed, what each one costs,
   what the player has and what is missing. A tool that cannot be afforded
   shows why.

3. Printing spends what it costs and takes the time it takes. The player
   cannot print everything and has to choose.

4. Start with a single tool, complete from start to finish: print it, carry
   it and use it where it is needed. The others come later.

5. The tool's model is built with the kit from a real reference in NASA 3D
   Resources (see prompts-3d-models.md), with no logos, and its credit goes
   in NASA-DATA.md.

6. Tests in web/test/tools.test.ts: a tool cannot be printed without paying
   its cost, the cost is spent exactly once, and what the player holds is
   saved.

Show me a tool being printed and then used before going on.
```

---

## Prompt 8 — The jump home

**Team decision** (see `lore-and-mechanics.md`, section 13): how long the jump
lasts, how many planet cards it shows and whether the player can do anything
during it.

```
Team decisions on the jump:
- How long it lasts: [write here]
- How many planet cards it shows: [write here]
- What the player can do during it (nothing, skip, look around): [write here]
```

```
I want the animation of the jump to Earth: a flight through real space where
every exoplanet in the catalog is visible and some show their data on the
way.

1. Pure data in web/src/data/route.ts: from the positions computed in Prompt
   1 (Earth at the origin), the route from TRAPPIST-1 to Earth and the list
   of planets nearest to it, in the order the player passes them. With tests
   in web/test/route.test.ts: the route is 12.43 parsecs long, GJ 876 is the
   system closest to it, and planets without a position are left out and
   counted.

2. The cloud: every planet with a position drawn as a point at its real
   place, tinted by the colour of its star. One draw call, not one object per
   planet.

3. The flight: the camera first shows the whole cloud, then travels the
   route from TRAPPIST-1 to Earth. It has to read as a jump, not as a slow
   pan.

4. The cards: as the camera passes the planets nearest the route, a card
   shows the planet's name, its star, its distance from Earth and how and
   when it was discovered. Catalog values only.

5. It ends on arrival, handing over to the arrival scene.

6. It can be opened by itself from a development URL, to record the demo.

Show me the jump from start to finish before going on.
```

---

## Prompt 9 — The ship and the jump runes

**Team decision** (see `lore-and-mechanics.md`, section 7): how the ship is
flown and what there is to do in space. Already decided: a jump rune is found
by completing the ruins of a planet, together with the relic, and the final
jump to Earth needs only a mega-rune, won by defeating the last boss.

```
Team decisions on the ship:
- How the ship is flown (controls and camera): [write here]
- What there is to do in space: [write here]
```

```
I want the player to have a ship. Build it in this order and show me each
step before the next one.

1. The jump rune and the jump. Completing the ruins of a planet gives its
   jump rune. Pure data in web/src/content/ship.ts: the runes the player
   holds and which planet each jump leads to. With a rune, the player jumps
   to the next planet in a short animation; without one, the jump is refused
   and the game says why. Tests in web/test/ship.test.ts: no
   jump without a rune, a rune is spent exactly once, and the state is saved.

2. Flying over the planet. The player boards the ship, takes off, flies over
   the terrain and lands. On foot and in the ship have to feel like the same
   world.

3. Leaving the planet. Above a certain height the ship is in space: the
   planet below, the red star, and the sister planets at their real places
   and apparent sizes, from the catalog (see the figures in section 7).
   Without a rune the player can fly there, but the other planets do not get
   meaningfully closer.

The ship's model is built with the kit, original, with no logos.

If time runs short, step 1 alone keeps the story playable.
```
