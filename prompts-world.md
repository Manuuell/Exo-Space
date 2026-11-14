# Prompts for building the world of Exo Space

Five prompts, in order. Each one is pasted into an AI session opened in the
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

## Prompt 3 — Choosing a planet and loading by proximity

**Team decision** (open item 1 in `HANDOFF.md`): how the player travels between
planets.

```
Team decision on travel between planets:
[write here: star map and landing, or free flight with the ship]

Team decision on giant planets, which have no ground:
[write here]
```

```
I want the player to be able to reach any planet in the catalog without the
game loading more than it needs.

1. The whole catalog is always in memory (it weighs 0.4 MB compressed). What
   gets loaded and unloaded is what the game generates for each planet:
   terrain, models, quests and dungeons.

2. web/src/data/cells.ts (pure data): sorts the planets into cells of space
   by position, to find quickly which ones are near a point. With tests.

3. Loading by proximity: a planet is generated when the player enters its
   radius and released when they move away. A cap on planets loaded at once.
   Make it visible that something is loading, with no stutter.

4. The way of travelling and picking a destination, according to the
   decision above. On every planet the player sees its real name, its star
   and its distance from Earth.

Tell me how much memory a loaded planet takes and how many an ordinary laptop
can hold at once.
```

---

## Prompt 4 — Dungeons

```
I want dungeons: interiors separate from the planet's map.

1. There are doors on the planet's map. Going in loads another scene, closed
   in, with several rooms, enemies waiting inside and a reward at the end.

2. Dungeon enemies do not chase the player across the map: they stay in
   their room and wake up when the player comes in.

3. On the way out the player returns to the same spot on the planet and finds
   it as they left it: position, items picked up, quests in progress.

4. The dungeon is generated in code from a template and from the planet's
   data (palette and enemy family). The same door always leads to the same
   dungeon.

5. Pure template data in web/src/content/dungeon.ts, with tests: every room
   is connected, there is one entrance and one end, and the reward is at the
   end.

We take the structure of the genre (door, rooms, reward), not the names, art
or levels of any game.

Before starting, ask me how many rooms, what the reward is and whether it can
be replayed. Show me a whole dungeon in screenshots before going on.
```

---

## Prompt 5 — NPC quests

**Team decision** (open item 6 in `HANDOFF.md`): whether NPCs talk from a fixed
script or through AI.

```
Team decision on how NPCs talk:
[write here: fixed script, or AI with a fallback script]
```

```
I want the NPCs on the map to give quests.

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
