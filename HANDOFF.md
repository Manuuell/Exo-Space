# Handoff — Exo Space: A Way Home

Read this first, before touching anything. New entries go at the top, with a
date. Then read [lore-and-mechanics.md](lore-and-mechanics.md) (the design) and
the build prompts (`prompts-*.md`).

---

## Where the project stands (2026-11-15)

Keep this section up to date after every step.

- **Decided:** the story from start to finish, the scope and the mechanics
  in general. See the decisions table below and
  [lore-and-mechanics.md](lore-and-mechanics.md).
- **Scope changed (team decision, 2026-11-15):** one planet instead of
  three. TRAPPIST-1 e is developed in full as an open world, and the ship
  goes out to space to gather materials: it shoots asteroids apart for ore
  and crystal and flies through motes of solar energy. `lore-and-mechanics.md`
  (sections on the three planets, the jump runes and the ship) still
  describes the old three-planet scope and needs updating by the team. See
  "Open world and space mining".
- **The way home and the end (team decision, 2026-11-15):** a task bar at
  the top of `/play.html` shows what the ship needs to leave and how much
  of it is aboard: hull plates from the dungeons, ore, crystal, solar
  energy, the beacons lit and the colonists helped. T says where each is
  and why the ship needs it, from the catalog. The valley is the last
  habitable place on TRAPPIST-1 e; beyond its mountains the land burns.
  With everything aboard, J in space leaves, and the world is destroyed:
  that is the end. Mission control (an earlier try) was dropped by the
  team. See "The last valley, and the end of the world".
- **In the repository:** the documents, the build prompts, the exoplanet
  catalog (6,470 planets), 23 NASA reference models and the web app.
- **Built:** the catalog reader with its derived values (Prompt 1 in
  `prompts-world.md`) and the modelling kit with its viewers and tests
  (Prompt 0 in `prompts-characters.md`), and the protagonist: the soft
  cartoon `hero-cartoon`, approved by the team and animated with the seven
  clips of a player. Two earlier drafts stay in the catalog for reference:
  the voxel `hero` (idle clip only) and the detailed `hero-explorer` (no
  clips). Nine enemies are built (seven kinds of fauna that change with the
  planet, two machines of the depots); see "A bestiary of nine enemies".
  Four NPC species are built in voxel with kind faces; see "Four NPC
  species, in voxel". The first guardian, Rootmaw (TRAPPIST-1 e), is built;
  see "Guardian of e: Rootmaw". Four sub-bosses are built; see "Four
  sub-bosses". The guardian of b, Ashen Bastion, is built; see "Guardian of
  b: Ashen Bastion". The guardian of h, Veilkeeper, is built; see "Guardian
  of h: Veilkeeper". The last boss, Exodus Engine, is built; see "Last boss:
  Exodus Engine".
  The protagonist has four shooting weapons (`weapon-plasma`,
  `weapon-gravity`, `weapon-ion`, `weapon-fusion`), the shot each one fires
  (`shot-*`) and the clips to aim and shoot them. The game itself still shows an empty scene.
- **Flight and planet logic:** built as pure data with a test page,
  `/flight.html`: the ship flown in third person over the three planets and
  into space, real gravity, the sky from the catalog and the jump runes.
  Not wired into the game yet, and its controls await the team. See "Planet
  logic and flying the ship".
- **The ship and the look of the planets:** the ship model, Homeward, and
  the planets drawn from their data (land, liquid, scenery, sky, and the
  globe seen from space) are built and shown on `/flight.html`. See "The
  ship and the planets".
- **Style (team decision, 2026-11-15):** from now on everything is drawn in
  the protagonist's soft cartoon style. The world, the ship and the new
  models already are; the voxel enemies, NPCs and bosses made before are
  not yet. See "TRAPPIST-1 e: dungeons, giant trees, flora and fauna".
- **Next:** step 1 of the build order at the end of this file, the home
  planet. It starts with Prompt 2 in `prompts-world.md`, which needs the team
  to validate the table in section 2 of
  [lore-and-mechanics.md](lore-and-mechanics.md) first.
- **Two chats work in parallel.** A separate chat handles all the visual
  design: the modelling kit, the characters, the bosses, the structures and
  the look of the map, inside `web/src/models/`, `web/models.html`,
  `web/references.html`, `web/scripts/` and `reference-models/`. The main chat
  builds everything else, places the models and does not write a kit of its
  own.
- **Next in the design chat:** the NPCs' settlement on TRAPPIST-1 e; then
  whether the voxel enemies, NPCs and bosses are redrawn in the cartoon
  style (the team's call); then the depots of b and the lava of b, which
  reads too flat.
  The image script waits for the team's go-ahead before the first paid
  image.
- **Deadline:** Sunday, November 15, 2026, 11:59 p.m.

---

## The last valley, and the end of the world (2026-11-15)

The team did not like mission control ("no me gusta ese mission control").
They asked for:
- a task bar showing what to gather all over the map;
- an apocalyptic world outside the map, so that the valley is the last
  habitable zone;
- the world destroyed when she gathers everything and leaves, as the end.

Mission control is gone: its page, its rules (`mission.ts`) and its tests.
On `/play.html`:

- **Task bar** (top centre, `src/play/way-home.ts`): what the ship needs to
  leave, with how much is aboard:
  - hull plates: the reward of each dungeon, 0/3;
  - ore 0/30 and crystal 0/6: asteroids, chests, dungeon rewards, the
    world boss;
  - solar energy 0/100 kWh: golden motes in orbit;
  - beacons lit 0/6;
  - colonists 0/4: the village's quests.

  T opens the details: where each one is, and why the ship needs it, with
  the catalog's values when it has them: 0.82 g and 9.7 km/s to leave,
  65% of Earth's light, a 2,566 K star, 40.5 light years to Earth. The
  tracker on the left names the next thing missing. With everything aboard
  the bar turns gold.
- **The wasteland** (`wasteland()` and `LAST_VALLEY` in `planet-look.ts`):
  the valley ends about 780–1,000 m from the landing site, just past its
  ring of mountains, with a wandering border. Beyond it:
  - the land is black ash split by glowing cracks;
  - the low ground is a sea of lava;
  - 120 columns of smoke rise over fires;
  - no tree, plant or grass grows;
  - the air is thick red smoke.

  The horizon glows red all around, even from the valley, and the clouds
  are grey with ash. From space the whole planet is burnt but for the
  green valley. On foot out there she burns, with a warning to turn back.
  The map draws it in ash and lava.
- **The end** (`src/play/ending.ts`): J in space with everything aboard
  leaves for good. The camera looks across the valley as the fires reach
  it: it chars, and smoke rises in it. Then it pulls back until the whole
  planet shows, which glows red, shakes and breaks apart in a flash, with a
  ring and 160 pieces. A white fade leads to the end card: "The end", how
  long she stayed, the beacons lit, the colonists saved, and "Play again".
  Captions tell it: "The fires of the wasteland reach the last valley",
  "Behind her, TRAPPIST-1 e burns", "Nothing is left of it. Everyone it
  had is aboard". J before everything is aboard says what is still
  missing.
- The opening line says it: "TRAPPIST-1 e is dying. This valley is the last
  place where anyone can live…"

Checked: `npx tsc --noEmit`, `npm test` (593 tests), `npm run build`, and in
the browser:
- the bar and its details;
- burning in the wasteland, with the warning;
- the wasteland from the ship and from space;
- the whole end, from the burning valley to the card;
- J refused while things are missing.

Not done: the team may want to tune what the ship needs and how much.

---

## Mission control: planning the way home (2026-11-15, dropped)

Dropped the same day by the team; kept here as a record.

The team asked to focus on what the challenge asks ("vamos a centrarnos en
cumplir ahora lo que pide el reto") and chose, of three options, to answer
it with the mission home. On `/play.html`, P (or the rocket button at the top
right) opens mission control and pauses the world. There are four steps.

1. **Objective.**
   - Get home.
   - Bring home the answer: which worlds of TRAPPIST-1 are rocky, which
     needs both size and mass.
   - Leave a lifeline: a relay the colony can reach a quarter of the time.

   Under them, what the catalog says about where she is.
2. **Spacecraft.**
   - Hull: light, or shielded against flares.
   - Solar panels: silicon or infrared-tuned, 20 or 40 m².
   - Battery for the planet's shadow: 1 or 4 kWh.
   - Antenna: low-gain or high-gain.
   - A payload bay of three slots: transit photometer, spectrograph,
     thermal imager, star tracker, relay beacon.

   Each card shows its mass, power and cost.
3. **Launch and orbit.**
   - Three boosters, each showing what it lifts from this planet.
   - A low or high orbit, each showing Δv, shadow and how long the colony
     sees it.
4. **Fly the mission.** Seven phases, each saying why it went well or
   badly: lift-off, a flare, power in orbit, the survey of the system, the
   link with the colony and navigation, the jump, and the arrival. A phase
   that fails ends the mission there. Then a verdict, a score out of 100
   and what is left for the colonists. The score counts the objective, the
   science, the margins and the thrift, which answers the lore's planner
   that spent everything.

A panel on the right checks the design live: ore and crystal against the
budget, mass against the booster's lift, average power against the load,
the shadow against the battery, jump energy, and how the ship finds the
way.

**Budget.** The budget is her cargo: ore and crystal, and solar energy in
kWh. Chests (2–8 ore, up to 2 crystal), dungeon rewards (10 ore,
3 crystal), the world boss (4 crystal) and space mining fill it. A
practice budget (45 ore, 10 crystal, 100 kWh) lets anyone try designs at
once. Only her own cargo can make the jump. A success then spends what
the mission cost and shows the ending, and the tracker's main quest is
now "The way home".

**What comes from NASA data** (`src/play/mission.ts`, from the catalog row
of TRAPPIST-1 e and its system):
- the planet's gravity (0.82 g) and radius, for the Δv to orbit:
  8.0 km/s to 300 km, against 9.4 from Earth, so the same booster lifts
  more;
- the rocket equation for what each booster lifts;
- each orbit's period, shadow (40% low, 23% high) and time in view of the
  colony;
- the light it gets (65% of Earth's) and the star's temperature (2,566 K),
  for what silicon or infrared-tuned cells give;
- the distance to Earth (12.43 pc), for the jump's energy;
- the seven planets' radii, masses, years and temperatures, shown by the
  survey;
- density from radius and mass, to tell which are rocky.

**The game's own figures**, for the team to tune in `mission.ts`: part
masses, costs, power draws, the jump drive's 2.4 kWh per tonne and parsec,
and the flare that burns the most fragile instrument of an unshielded
ship. The starting design fails for lack of power on purpose, and its
phase says what to change.

Checked: `npx tsc --noEmit`, `npm test` (601 tests, 13 new in
`test/mission.test.ts`), `npm run build`, and in the browser:
- the four steps;
- the bay closing at three;
- the launch blocked when over budget;
- a shielded survey mission with its real values and 7 of 7 worlds rocky;
- the starting design failing on power, with the reason;
- a flight with her own cargo: the ending, and the cargo spent;
- Escape closing the screen.

Not done:
- the jump animation through the catalog (section 13);
- `lore-and-mechanics.md` still needs the team's word on the details.

---

## Getting out of the ship (2026-11-15)

The team could not get out of the ship ("no se puede bajar de la nave"): F
only worked once landed, and landing with L needed her under 60 m and
20 m/s first, with nothing on screen to say so. On `/play.html` now:

- **F while flying over the valley** brings the ship down on its own and
  she steps out once it is down. **L** does the same without stepping out.
  From high up the ship dives nose down with the boost, then levels out,
  brakes and lands. Pressing again, climbing (Space) or speeding up (W)
  calls it off.
- **In space**, L takes her back down and lands (F still fires there).
- While flying, the bottom of the screen always shows the keys:
  - "F Land and get out · L Land";
  - "Coming down to land…" while it lands;
  - "L Go back down and land" in space.

  The controls panel says the same.

Checked: `npx tsc --noEmit`, `npm test` (588 tests), `npm run build`, and in
the browser:
- F at full speed near the ground: out in 1.5 s;
- F from 560 m: out in 13 s;
- L from space at 2,200 m: landed in 22.5 s;
- F then Space: it keeps flying.

---

## Guardians that warn before they strike, a smaller valley full of enemies (2026-11-15)

The team asked for boss fights like Meta Space's ("cópiate del combate en
metaspace de los jefes"), a smaller world, enemies in the forest ("no
spawnean en el bosque"), and then harder enemies ("no son nada difíciles").
Meta Space was looked at in images only; nothing of its code was used. On
`/play.html`:

- **Guardians** (the three dungeon guardians and the Broodmother) now fight
  with attacks shown on the ground first: a red mark that fills from the
  centre until the blow lands, with a banner naming it and what to do.
  - fire breath: a 64° cone 15 m long in front of it, 24 damage;
  - shockwave: a 10 m circle all around it, 22;
  - falling stars: four 3.8 m circles on and around her (six when
    enraged), 20, once even where they overlap. It uses these when she
    keeps her distance.

  The marks lie on the slope in the open world. Below half health it is
  enraged: a banner, two guards called in, faster attacks that hurt a
  quarter more. If she runs more than 60 m from its lair or is knocked out,
  it goes back and recovers. Health: guardians 1100, the Broodmother 1500,
  shown as numbers on its bar. No patrol wanders into the Broodmother's
  lair.
- **A smaller valley:** everything lies within about 620 m of the landing
  site. Gates are at 220–520 m, the camps at 160–430 m and beacons
  within 620 m.
- **Enemies everywhere:** 30 packs (`features.packs` in `planet-look.ts`),
  ten each at 80–260 m, 260–440 m and 440–620 m, in the forest and the
  meadows alike. Each pack has two or three enemies, tougher the further
  out, and every fourth pack is led by an elite (bigger, 2.5× health, five
  ranks up). A pack wiped out comes back 75 s later, once she is 90 m
  away.
- **Harder enemies:**
  - twice the health, damage 8 + rank (elites 1.4×);
  - a quarter faster, attacking again after 0.8 s, noticing her from 34 m;
  - stinglash, drones, skyrays and gorgemaws also fire glowing orbs at
    6–26 m (10 damage, slow enough to dodge);
  - health comes back slower (4 a second after 7 s without a hit).
- **Trees:** trunks block her. The camera comes in closer when a crown or a
  trunk stands between it and her, and eases back out after
  (`blocked`/`inCrown` on the forest in `planet-scene.ts`).

Checked: `npx tsc --noEmit`, `npm test` (588 tests), `npm run build`, and in
the browser:
- a pack catching her within 4 s;
- the Broodmother's cone on its hillside;
- Rootmaw's cone and the falling stars in the arena;
- its rage at half health, with two guards called in;
- its going home and healing when she was knocked out;
- the camera under a pine with her in view;
- game logic about 0.3 ms a frame with 110 enemies.

Not done:
- the enemies and guardians are still voxel;
- props in the open world do not block her yet;
- the attack names in the banners are placeholders for the team to rename.

---

## Dungeons you can enter, and weapons that fight their own way (2026-11-15)

The team asked whether the enemies and dungeons worked ("tienen que
transportarte a una dungeon y vencer enemigos") and for flashier weapons,
like the skills in Genshin Impact. On `/play.html`:

- **Dungeons** (`src/play/dungeon.ts`, a scene of their own): F at a gate
  takes her down, with a fade. Inside, the first colonists' ruins in the
  cartoon style: an entrance hall, a larger hall and an arena, joined by
  corridors; stone floors, mossy walls, pillars, braziers of cyan fire with
  their light, runes and crystals. A curtain of energy closes each corridor
  until the hall before it is cleared. In the arena a guardian sleeps until
  she comes in (it wakes with its `Wake` clip and a shake), then fights
  with both its attacks; the second strikes all around it. Its name and
  health run across the top of the screen. When it falls, a reward chest
  (a relic and parts) and the far portal light up; the portal (or the one
  by the entrance, any time) takes her back to the gate. The tracker shows
  the hall and how many guards are left; the minimap shows the halls.
  Guardians: Rootmaw in the main ruin, the Lander Overseer in dungeon 2,
  the Cinder Hermit in dungeon 3. Wisp's quest is now to clear the main
  ruin.
- **Weapons:** plasma fires rapid bolts with glowing trails that burst in
  rings; the gravity gun's orb opens a vortex for 1.8 s that draws enemies
  in, hurts them as it turns and collapses in a blast; the ion rifle's
  lightning strikes what she aims at and leaps to up to three more enemies
  near it; the fusion cannon lobs a shell in an arc that blows up in a big
  flash with two rings and a camera shake. Every shot has a muzzle flash.
- **More on the map:** patrols of two enemies along the paths, and a world
  boss (the Broodmother) past the farthest camp, marked on the map and the
  minimap with its own badge.
- Enemies hit softer (dungeon guards about 15, guardians 18).

Checked: `npx tsc --noEmit`, `npm test` (588 tests), `npm run build`, and in
the browser: going down into the main ruin, the chain lightning across
three guards, the halls opening, Rootmaw waking with its bar, a fusion
shell on it, the reward chest, the portal back out to the gate, and the
gravity vortex at a camp. Not done: dungeon guards still voxel; collisions
with props in the open world.

---

## Forests, paths and a map that reads (2026-11-15)

The team found the world still empty next to their Genshin Impact
references, and the map unreadable. Changes:

- **Forests** (`ForestField` in `planet-scene.ts`, `forestDensity` in
  `planet-look.ts`): trees one by one within about 430 m of the camera
  (pines of stacked cones, round oaks, and the planet's umbrella and bulb
  trees), up to one every 9 m in deep forest, and masses of canopy out to
  3.6 km. Forests gather on hills and plateaus and leave the landing site,
  the village, the paths, the water and the bare heights clear. The sparse
  trees of the old scatter are gone; it now scatters many more boulders and
  the first colonists' ruins: broken pillars and walls.
- **Dirt paths** (`planetPaths`): from the landing site to the village, and
  to every dungeon gate, camp and beacon, wandering a little; drawn as
  ribbons on the land; the grass and the trees keep off them.
- **Cliffs of pale grey stone** and bluer water on temperate land; stone
  shows on gentler slopes than before.
- **The map, redrawn like a map:** flat colour bands by height with a line
  where they meet (shores, plateaus, cliffs), water with its shore,
  forests stippled, the paths, round badges with a symbol for each kind of
  place (house, arched door, tent, chest, beacon, ship) and names, a
  compass, and the region's name. The minimap uses the same drawing.

Checked: `npx tsc --noEmit`, `npm test` (588 tests), `npm run build`, and in
the browser: the forest around the landing site and near the village, the
map and the minimap. The game's own work per frame stays under half a
millisecond, running; the drawing cost of the forests was not measured.

---

## An action-RPG interface and a lusher land (2026-11-15)

The team showed two screenshots of Genshin Impact and asked for "la interfaz
de genshin y el mapa". The play page now uses the usual layout of an action
RPG, drawn in the game's own colours and shapes (nothing copied from that
game's art):

- **Top left:** a round minimap (heading up, with N), the land under it
  (water, meadows, heights, snow) and diamond marks for places; under it the
  quest being followed, the other quests and the jump drive.
- **Top right:** round menu buttons, Map (M) and Controls (H).
- **Right:** the four weapons as slots with their keys; in the ship, the
  hold (ore, crystal, solar) instead.
- **Bottom:** level and health bar in the middle; the skills bottom right.
- **Skills:** E, a gravity pulse around her (22 damage within 8 m, throws
  enemies back, 6 s); Q, a starfall (75 damage within 13 m), charged by the
  damage she deals. Both show their cooldown and charge.
- **In combat:** damage numbers rise from what is hit; enemies show their
  level and health when near (the level grows with distance from the
  landing site).
- **F** is now the key to talk, open, board and get out (E and Q are the
  skills); in the ship, click or F fires the lasers.
- **The map (M):** the region seen from above, shaded by its slopes, on a
  parchment frame, with the village, dungeons, camps, chests, beacons, the
  ship, her, and the active quest's target; a click on a lit beacon travels
  there.

**The land, closer to the reference:** tall, thick grass around the camera
that sways in the wind (`GrassField` in `planet-scene.ts`, instanced clumps,
only near the ground and on temperate land); a bright daytime sky (blue
overhead, pale at the horizon, still warmed by the star) with bigger white
clouds; and sharper cliffs between the terraces. The sky's blue is a
stylistic choice of the cartoon look, not a value from the catalog.

Checked: `npx tsc --noEmit`, `npm test` (587 tests), `npm run build`, and in
the browser: the HUD at the landing pad, the map, and a fight at a camp
with the pulse, levels and health bars.

---

## Open world and space mining (2026-11-15)

The team found the world flat, too big and empty ("un mundo abierto como
Genshin Impact, que haya muchas cosas que hacer"; "imposible encontrar las
dungeon"), and then changed the scope: **one planet, and the ship goes to
space for materials, shooting asteroids and gathering solar energy**. All of
it plays on `/play.html` (the page is still separate from `src/main.ts`).

**The land** (`planet-look.ts`): temperate land now has tall mountain
ranges (always some around the landing site, 0.6–2.6 km out), plateaus
stepped into terraces with cliffs, and river valleys cut below the water.
Heights on e run from about -90 to over 300 m. It is drawn as two patches
(`planet-scene.ts`): a fine one (16 m squares, 2.5 km) around the camera for
walking, and a coarse one (64 m, 11.5 km) to the horizon that sinks out of
sight under the fine one. The land has its own deeper light ramp so hills
and cliffs read.

**Compact:** everything is within about a kilometre of the landing site:
the village (~200 m), five enemy camps (350–670 m), the dungeon gates
(550–1,080 m), six beacons on the heights (~1 km), 14 chests and 45 star
shards (`planetFeatures`, tested).

**New models** (`props-world.ts`, cartoon): `prop-beacon` (a stone pillar
with a floating crystal; lit, it glows and sends a beam up), `prop-chest`
(clip `Open`), `prop-hut` (a mushroom-roofed house), `prop-campfire`,
`prop-glider`. The village is six huts around a square with the four NPC
species (still voxel).

**To do on the planet:**
- Quests from the four folk of the village: Petal (gather 8 star shards),
  Anvil (clear the nearest camp), Lumi (light 3 beacons), Wisp (find the
  main ruin). Talk with E; a dialog, a quest list with progress, and
  "Quest complete".
- Camps of 2–3 enemies guard a chest that only opens once they are down.
  Other chests are free. Shards are taken by walking into them; beacons
  light when she reaches them, and T travels between lit beacons.
- A glider: Space again in the air opens it (slow fall, forward glide).
  Steep ground is a slow climb.
- A minimap (heading up) and markers on screen with the distance to the
  village, the dungeons, the beacons, nearby camps and chests, the ship,
  and the active quest's target (outlined in gold).

**In space** (`space-field.ts`): over the planet, from where space starts,
a belt of 70 cartoon asteroids with glowing veins (18 % rich in crystal)
and 45 golden motes of solar energy, all within about 3.5 km. The ship
fires twin lasers (F or click); a broken asteroid flings out chunks that
are drawn in to the ship (ore 3 each, crystal 1); motes give 10 solar
energy each. Broken asteroids come back after a minute, motes after 25 s.
The goal on the quest list: repair the jump drive with 30 ore, 6 crystal
and 100 solar energy. The numbers are a proposal.

Checked: `npx tsc --noEmit`, `npm test` (587 tests), `npm run build`, and
in the browser: the land and its mountains, a quest taken from Petal with
its dialog, list and marker, an asteroid shot apart and its ore gathered
(9 ore), two solar motes gathered. `__play.advance(seconds)` runs the game
in steps, for a page in the background. Not done: entering the dungeons,
collisions with props, sound, and the voxel enemies and NPCs still to
redraw in cartoon.

---

## Play test: TRAPPIST-1 e played (2026-11-15)

The team asked to try it in game with everything together: the ship, the
weapons and the enemies. Built by the design chat as a page of its own,
`/play.html?planet=e` (`web/play.html`, `web/src/play/`), so that it does
not touch the game's entry, `src/main.ts`, which is still the empty scene;
the main chat can take it from here into the game.

- **On foot:** the protagonist in third person, mouse look (pointer lock,
  or drag), WASD, Shift to run, Space to jump under the planet's real
  gravity (from the catalog), deep water stops her. She stands on the land
  as it is drawn: `planetWorld(...).surface(x, z)` is new, the height of the
  drawn triangles, which on rolling ground differs a little from `ground`.
- **Weapons:** the four weapons in her hand, keys 1–4; click to shoot,
  right click to aim (closer camera, over the shoulder). Shots fly to the
  first thing under the crosshair and burst on enemies and on the ground.
  Proposed numbers in `ARSENAL`: plasma 14 damage every 0.22 s, gravity 20
  and a push, ion 7 every 0.1 s, fusion 40 with a 5 m splash.
- **Enemies:** spinebacks and a twinfang near the landing site, guards at
  each dungeon gate (golem, stinglash, gorgemaw, rover, drone) and a
  skyray; the fauna enemies take the planet's look. They notice her within
  32 m, chase, attack with their clip's own warn and hit times, take hits
  (`Hit`), die (`Die`) and go home when she is gone. Health bars over the
  hurt ones. When all are down: "All clear" and her `Victory`.
- **Health:** 100; it comes back after 5 s without a hit. Knocked out, R
  gets her up at the landing pad.
- **The ship:** parked on the pad. E within 12 m boards it; then the flight
  of `src/content/flight.ts` unchanged (L, W/S, A/D, arrows, Space/C,
  Shift), out to space and back; E once landed gets her out beside it.

Not done: collisions with trees, rocks and gates; entering the dungeons;
sound. The enemies are still voxel next to the cartoon world. The numbers
are a proposal for the team. Checked: `npx tsc --noEmit`, `npm test` (546
tests), `npm run build`, and in the browser: walking, shooting a spineback
down, being attacked, boarding, taking off, flying, landing and getting
out.

---

## TRAPPIST-1 e: dungeons, giant trees, flora and fauna (2026-11-15)

Team decisions: **the game's drawing style is now the protagonist's soft
cartoon**, for everything from here on; and work goes one planet at a time,
starting with the home, TRAPPIST-1 e, which must have dungeons, giant and
medium trees, flora and fauna.

- **Cartoon only.** The low-poly world and the lacquered ship are gone:
  `planetWorld(planet)` draws in the soft cartoon light (smooth land,
  rounded props, lively colours, puffy clouds) and `ship-homeward` wears the
  protagonist's `soft` paint.
- **Dungeon gate** (`prop-ruin-gate`, 11,922 triangles): the way into a
  dungeon. The first colonists' ruins half sunk in a mossy mound: an arch of
  big rounded stones, a crest with a ring of runes (the star and its seven
  planets), a portal that turns, two braziers of cyan fire, vines with
  flowers, crystals, fallen blocks and a flagstone path. About 10 m tall,
  door along +Z. Clip `Idle`.
- **Giant tree** (`prop-giant-tree`, the "skyshade", 11,460 triangles):
  about 67 m tall, seen from the air: roots arching into the ground, a
  flared trunk with spiralling bark and a glowing hollow, four branches with
  umbrella crowns and pink lantern-pods on vines. Clip `Idle` (crowns sway).
- **Medium trees** (instanced, 6–22 m): umbrella trees and new bulb trees
  with glowing fruit, gathered in forests with clearings between them.
- **Flora** (instanced around the camera, 0.3–2.6 m): grass, flowers in
  five colours, bushes, ferns and mushrooms with glowing caps. Only on
  temperate land.
- **Fauna**, a new type in `contract.ts`: `fauna` (nodes `body`, `head`;
  clips `Idle`, `Move`; 8,000 triangles). Peaceful animals with kind faces
  (`fauna-face.ts`): `fauna-mossback` (a grazer with a mossy, flowering
  back, 3.4 m), `fauna-puffhop` (a small hopping critter, 0.7 m) and
  `fauna-skyfin` (a flier with wide fins, 3 m across, `flies`). In the
  world they walk loops around their herd, graze, hop or glide.
- **Where things stand**: `planetFeatures(planet)` in `planet-look.ts`
  places, always the same for the same planet, three dungeon gates on dry,
  flat ground facing the landing site (the first is the main ruin, with
  the relic and the rune), and on temperate land a dozen giant trees (one
  close to the landing site) and herds of the three species.
  `floraInCell` scatters the flora. `planet-scene.ts` draws all of it,
  moving the models down along the curve of the world.
- **A new viewer**, `/planet.html?planet=e`: the planet on foot with the
  protagonist for scale and buttons for the landing site, the main ruin,
  the other two dungeons, a giant tree, each herd and the view from above.
  `/flight.html` shows the same world from the ship.

Not done: the inside of the dungeons (a separate scene, Prompt 4), the
NPCs' settlement, and redrawing the earlier voxel models in the cartoon
style. Checked: `npx tsc --noEmit`, `npm test` (546 tests), `npm run build`,
and in the browser every spot of `/planet.html?planet=e` and the line-up of
the new animals with the protagonist.

---

## The ship and the planets (2026-11-15)

Made by the design chat. The team asked that the ship can take off from a
planet and fly out to space; it can, on `/flight.html?planet=e|b|h`.

**The ship, Homeward** (`web/src/models/ship-homeward.ts`, type `ship`).
Smooth and realistic, not voxel, after the team pointed at the ship of Meta
Space as the bar; its own design, no logos. A long cream hull with a
pointed orange nose, blue and orange stripes in the protagonist's colours,
a dark glossy canopy with orange frames, double-delta wings with canards, a
canted twin tail and a main engine. Its own two features: an engine pod at
each wing tip that points at the ground on the pad and swings back to fly,
and a glass dome on its back where the jump rune glows while the player
holds one. About 12 m long, 10 m across, 18,378 triangles.

- A new type in `contract.ts`: `ship`, with the nodes `body`, `engine`
  (the game scales it with speed) and `rune` (shown while a rune is held),
  and the clips `Idle` (landed), `Takeoff` (legs fold, pods swing back),
  `Fly` and `Land`. Origin on the ground under it, nose along +Z, as
  `web/src/content/flight.ts` expects.
- A new shape in the kit: `slab(outline, thickness)`, a flat plate cut to
  an outline with rounded edges, for wings and fins.

**The planets, from their data.** Two new files in `web/src/models/`:

- `planet-look.ts` (pure data, tested in `web/test/planet-look.test.ts`):
  `planetScenery(planet)` gives the colours of the ground, rock, peaks,
  liquid and sky, how high the land rises and how big the globe is;
  `planetGround(planet)` gives the height of the land at any point;
  `propsInCell(...)` what stands on it. It follows the table of section 2
  of `lore-and-mechanics.md`: the temperature tints the palette on a
  continuous ramp (snow, moss, rust, basalt) and blends three kinds of land
  (ice: smooth snow and spires; moss: hills, ranges and lakes; lava: flat
  mesas cut by lava channels); the star colours the light, sky and glows;
  low gravity raises the land and the spires, high gravity flattens it; the
  radius sizes the globe. The landing site is flat and dry. Same planet,
  same land: the seed is its name. A missing value takes a neutral one.
- `planet-scene.ts` (Three.js): `planetWorld(planet)` draws it: the land
  around the ship, the liquid (water, lava that glows, or ice), umbrella
  trees, boulders, crystals, basalt columns, vents and ice spires, a
  landing pad, the sky dome, and the globe with its air for space. The
  land curves away with distance in the shaders, so climbing out shows a
  round planet; the flight's ground stays flat and matches under the ship.

| Planet | Land | Liquid | Relief | Globe |
|---|---|---|---|---|
| TRAPPIST-1 e | Moss-green hills, ranges, umbrella trees | Water | 129 m | 18.4 km |
| TRAPPIST-1 b | Rust and basalt mesas, columns, vents | Lava | 102 m | 22.3 km |
| TRAPPIST-1 h | Snow, ice spires, blue crystals | Ice | 172 m | 15.1 km |

The globe size is a game scale, not the real radius (it is the real ratio
between the three).

**`/flight.html` now shows them** (edits to `web/src/flight/main.ts`, the
other chat's test page; the flight logic is untouched): Homeward with its
clips following the flight mode, the planet from its catalog values, the
sister planets each in the colour of its own land, a logarithmic depth
buffer, and a room environment so the polished hull is not dark against
the star. `web/src/flight/stand-ins.ts` is no longer used by anything; it
is left for whoever owns it to remove.

Checked: `npx tsc --noEmit`, `npm test` (503 tests), `npm run build`, and
in the browser: the ship's sheet and clips, take-off from the pad on e, a
climb over e's lakes and out to space (the round planet with its air at
10 km), and the ground of b and h. Not checked in the browser: landing
again, and the jump between planets with the new look.

**A second style, to compare (same day).** The team did not like the
look and asked to see it in the protagonist's style. `planetWorld(planet,
style)` now takes `'lowpoly'` (the one above, the default) or `'cartoon'`:
the protagonist's soft ramp of light with a pale glow on the edges, smooth
land, rounded props (puffy umbrella trees, round boulders and volcanoes,
capsule columns, smooth spires), livelier colours and puffy clouds above
the highest land (smoke on hot worlds). The ship has the same two finishes:
`ship-homeward` (lacquer) and `ship-homeward-cartoon` (the protagonist's
`soft` paint), both in the catalog. Try it on
`/flight.html?planet=e&style=cartoon`. Waiting for the team to choose one;
the other goes. 511 tests pass and the build works.

---

## Last boss: Exodus Engine (2026-11-15)

Proposed and built by the design chat; who the last boss is was the team's
call, so the team can change it. The planner AI's last great machine, built
from the colony ship's own engine: a heavy walking tripod 5.8 m tall with a
white ceramic hull, black joints and gold trim. Three armoured legs with
pistons and clawed feet, a collar of eight red eyes that turns under a
spiked crown, a cannon for its left arm, a three-clawed grapple for its
right, and the colony ship's twin engine burning orange on its back. Weak
point: the mega-rune, locked in a gold cage in its open core; when it dies
the rune is left free and blazing, the reward for the final jump. Its own
silhouette (the only tripod) and palette (white, black, gold, red). 2,052
triangles. File: `web/src/models/boss-exodus.ts`.

Clips: Idle, Wake (crouched and dark; the engine coughs alight at 0.7 s, the
eye collar lights and spins up at 1.2 s, it rises and spreads its arms),
Move (one leg after another), `Attack` (cannon: aims and charges red, then
fires, 0.50 → 1.40 → 1.60 s), `Attack_grapple` (the claw rises and slams
forward, 0.40 → 1.10 → 1.35 s), Hit, Die (the legs buckle, the hub crashes
on its belly, eyes and engine go out, the rune blazes).

Each leg hangs from a `hip_N` node that holds its yaw, so `leg_N` swings
about its own axis; the crouch lowers the hub as far as the bent legs lift
the feet, so the feet stay on the ground.

Checked: `npx tsc --noEmit`, `npm test` (487 tests), `npm run build`, and in
the browser: the sheet, a line-up with the protagonist and Veilkeeper, and
the Wake, Move, Attack, grapple and Die frames.

---

## Planet logic and flying the ship (2026-11-14)

Team request, to the chat "Diseño de astronauta principal": the logic behind
the planets and the ship flown in third person, with no visual design. It is
all in new files; `main.ts`, `index.html` and `src/data/` are untouched.

**Not confirmed by the team yet:** the controls, how the flight feels, that
the jump is made from space, and how the sky is turned. Section 7 of
`lore-and-mechanics.md` still lists "how the ship is flown" as open. What is
below is a first proposal to fly and correct.

Pure data, in `web/src/content/`, each with tests:

- `playable.ts`: the three planets that can be landed on and their order
  (e, b, h), and the one a jump leads to.
- `system.ts`: a planet's system from the catalog, in kilometres: radii,
  orbits, the closest two planets get, how wide a body looks, and
  `skyFrom(home, catalog, days)`, the star and the sisters as seen from a
  planet. Its tests reach the figures of section 7 from the catalog alone:
  the system inside 0.062 au; d, f, b and h within 1.0, 1.4, 2.65 and 4.9
  million km of e; the star four times wider than our Sun; d and f a little
  larger than the full Moon. Derived, not real: where each planet starts on
  its orbit (from its name; the catalog has no phase), and orbits as circles.
- `planet-physics.ts`: real gravity (kept between 0.3 and 2 g for play, and
  flagged when capped), the height of the air if it were like Earth's (the
  catalog says nothing about any planet's air), and from it the height where
  space starts. A missing value is named and replaced by a neutral one.
  Not `planet.ts`: that name is for the planet description of Prompt 2.

  | Planet | Gravity | Space starts at | Climb / sink |
  |---|---|---|---|
  | TRAPPIST-1 e | 0.82 g | 1,797 m | 28.8 / 19.9 m/s |
  | TRAPPIST-1 b | 1.10 g | 2,120 m | 24.8 / 23.1 m/s |
  | TRAPPIST-1 h | 0.57 g | 1,766 m | 34.4 / 16.6 m/s |

- `ship.ts`: the ship's log and the rules of the jump (Prompt 9, step 1).
  The ruins of a planet give its rune once; that rune fuels the jump from
  that planet to the next, and is spent by it; the jump home needs only the
  mega-rune. A refused jump comes with the sentence to show the player.
  Saved to and read from the browser's storage; a save that cannot be read
  starts a new game.
- `flight.ts`: the flight. `stepFlight(state, input, dt, world)` gives the
  ship a moment later, always the same for the same inputs. The ship goes
  where its nose points, banks into turns, holds its height by itself, and
  takes off and lands on its own once asked: landing needs it under 60 m and
  20 m/s, and says why when it is not. Gravity makes it climb slower and
  sink faster; above the ceiling it is in space, faster and with nothing to
  land on. Every number is in `TUNING`.
- `chase-camera.ts`: the third-person camera, behind and above the ship,
  looking ahead of its nose, trailing it and pulling back with speed.

To try it: `/flight.html?planet=e|b|h` (development only, like the model
viewers). Stand-ins, not design: hills, pillars to tell speed by, and a plain
ship. The card separates real data from derived. The star and the sister
planets are drawn at their real apparent sizes, with name, distance and
width in Moons. Keys: L takes off and lands, W and S speed, Shift boost, A
and D turn, the arrows lift and lower the nose, Space and C rise and sink,
J jumps (from space), R earns the planet's rune (a stand-in for its ruins).

For whoever wires it into the game:

- Step the flight at a fixed 1/60 s and the camera once a frame.
- `world` is `{ gravity, ceiling }` from `planetPhysics(planet)` plus
  `ground(x, z)`, the height of the terrain.
- A ship model has its nose along +Z and its origin on the ground under it.
  Turn it with `rotation.set(-pitch, yaw, -roll, 'YXZ')`.
- A right turn makes the yaw smaller: a ship that looks along +Z has its
  right wing towards -X.

Still open, for the team: the controls and the feel; whether the jump can
only be made from space; what there is to do in space; fuel; and how the sky
turns (the test page keeps the star still overhead, as if the planet always
showed it the same face, which the catalog does not say).

Checked: `npx tsc --noEmit`, `npm test` (407 tests, 36 of them new),
`npm run build`, and in the browser: take-off, a banked turn, the climb to
space, a jump refused without a rune, a jump to TRAPPIST-1 b with one, and
the sky from space. Not checked: landing in the browser (only in the tests).
While another chat saves files, the development server reloads every page,
this one included, and the flight starts over.

---

## Guardian of h: Veilkeeper (2026-11-14)

Proposed and built by the design chat; the team can change it. The keeper of
the deepest ruins, where the colonists sealed their archive: a hooded figure
about 4.5 m tall floating in h's low gravity (`flies`), a tattered midnight
blue robe with frost-silver trim, an ivory mask with four eyes in the star's
orange, four long bony arms with claws and a ring of magenta glyphs circling
it. Weak point: the archive core, a glowing magenta cube inside its open
ribcage. Its own palette (midnight blue, ivory, magenta). 1,776 triangles.
File: `web/src/models/guardian-veilkeeper.ts`.

Clips: Idle, Wake (a heap of robe on the floor; the eyes ignite at 1.2 s, it
rises and spreads its arms), Move (gliding), `Attack` (four-armed grasp,
0.40 → 1.20 → 1.45 s), `Attack_glyphs` (the ring blasts outwards,
0.50 → 1.40 → 1.90 s), Hit, Die (the core shatters and the robe sinks).

Checked: `npx tsc --noEmit`, `npm test` (477 tests), `npm run build`, a
line-up with the protagonist and the other two guardians in the browser.
Still to do: the last boss.

---

## Guardian of b: Ashen Bastion (2026-11-14)

The team approved going on to the guardian of b. The design chat proposed it
with its own silhouette and colours, unlike any other model; the team can
change it.

- **Who:** a colossal sentinel the first colonists built to guard their
  archive, running on the planet's heat.
- **Look:** an upright armoured knight, 5.6 m tall: a crest of blades, a
  T-shaped visor that burns, spiked pauldrons, a tattered crimson cape, a 2 m
  tower shield carved with the colonists' cyan rune and a great glaive with a
  glowing edge. Blackened bronze, dark iron and crimson, seams glowing in the
  star's orange. 1,920 triangles. File: `web/src/models/guardian-bastion.ts`.
- **Weak point:** the white-hot furnace grate in its belly.
- **Clips:** Idle; Wake (a kneeling statue with its glaive planted, the visor
  ignites at 1.2 s, it stands at 2.4 s and lifts the glaive); Move (a heavy
  march); two attacks; Hit; Die (the furnace bursts, it drops the glaive and
  topples forward).

| Attack | Tell | Warn → hit → end (s) |
|---|---|---|
| `Attack`, overhead cleave | The glaive rises high, the visor flares | 0.40 → 1.35 → 1.60 |
| `Attack_charge`, shield charge | It crouches behind its shield, the furnace roars | 0.30 → 1.00 → 1.30 |

Checked: `npx tsc --noEmit`, `npm test` (467 tests), the view sheet and a
line-up with the protagonist and Rootmaw in the browser.

---

## Four sub-bosses (2026-11-14)

The team asked for several sub-bosses besides the main boss of each ruin:
room bosses halfway through a dungeon. They follow the guardian contract
(type `guardian`: Wake, a visible `weak_point`, 3 to 6 m, every attack
announced with its timing) in detailed voxel.

Team rule from now on: **no boss or creature repeats another's silhouette or
colours.** Rootmaw stays for now, but it looks too much like the green Crag
Golem; the next ones each have their own body plan and their own palette,
taking only accents from their planet.

| Sub-boss | File | Dungeon | Look | Weak point | Attacks (warn → hit → end, s) |
|---|---|---|---|---|---|
| Broodmother | `subboss-broodmother.ts` | Ruins of e | Giant spider, 3.3 m, 4.4 m leg span; near-black violet with e's moss, six orange eyes, great fangs | Green venom sac on the front of the abdomen | Pounce bite 0.4 → 1.0 → 1.2; venom spit 0.3 → 1.0 → 1.4 |
| Lander Overseer | `subboss-overseer.ts` | Depots of b (a machine) | After NASA's Apollo Lunar Module: gold-foil descent stage, silver cabin whose two windows glow red like angry eyes, dish, thrusters, four walking legs with footpads, a claw arm; 4.4 m | Red core in the descent engine underneath | Claw slam 0.4 → 1.0 → 1.2; engine blast 0.4 → 1.1 → 1.6 |
| Cinder Hermit | `subboss-cinderhermit.ts` | Ruins of b | Giant hermit crab carrying a volcano for a shell: obsidian cone with lava streaks and a crater, orange-red plates, one giant claw, eye stalks; 3.7 m | Molten heart in the mouth of the shell | Claw smash 0.4 → 1.1 → 1.3; eruption 0.5 → 1.3 → 1.9 |
| Frost Wyrm | `subboss-frostwyrm.ts` | Ruins of h | Serpent rising 5.7 m from a coil in the ice: deep navy scales with frost, cyan crystal spines and horns, ice fangs | Warm core between the ice plates of its chest | Lunge bite 0.4 → 1.0 → 1.2; freezing breath 0.4 → 0.95 → 1.8 |

- Each has Idle, Wake (asleep, folded, buried or under the ice, then rising),
  Move, two attacks, Hit and Die; between 1,400 and 1,950 triangles.
- The Lander Overseer is credited in [NASA-DATA.md](NASA-DATA.md).
- Still open: which main bosses go with them (the guardians of b and h and
  the last boss), and how many sub-bosses each dungeon has.

Checked: `npx tsc --noEmit`, `npm test` (457 tests), `npm run build`, and the
four in a line-up next to the protagonist in the browser. Not checked: each
clip played in the viewer.

---

## Guardian of e: Rootmaw (2026-11-14)

The team asked for guardians that are big and make the player afraid. The
design chat proposed the first one and built it; the team can change it.

- **Who:** a titan of TRAPPIST-1 e that the first colonists bound to guard
  their sealed archive. That ties it to the story: the colonists' shackles
  (a collar and manacles of rune metal glowing cyan, with hanging chains)
  and, as its **weak point**, the rune seal on its chest that keeps it bound.
- **Look:** 5.3 m tall, 4.5 m wide; hunched, with arms that nearly reach the
  ground, a horned skull with a jaw of fangs, eyes burning in the star's
  colour, a back of moss and great crystal spikes. Detailed voxel, TRAPPIST-1
  e's look from the fauna table (moss, 0.82 g, orange glow). 3,084
  triangles (budget 30,000). File: `web/src/models/guardian-rootmaw.ts`.
- **Clips:** Idle; Wake (asleep and hunched with dark eyes, the eyes ignite
  at 1.0 s, it rises and roars from 2.2 s); Move; two attacks; Hit; Die (the
  seal breaks, it falls to its knees and collapses).

| Attack | Tell | Warn → hit → end (s) |
|---|---|---|
| `Attack`, double slam | Both fists rise and hang, the seal blazes | 0.40 → 1.30 → 1.60 (shockwave) |
| `Attack_sweep`, arm sweep | The right arm draws back across the body | 0.30 → 1.00 → 1.20 |

Checked: `npx tsc --noEmit`, `npm test` (417 tests, including the guardian
checks: 3 to 6 m tall, a visible `weak_point`, timings inside each clip),
the view sheet, the Wake clip asleep and roaring, and a line-up with the
protagonist in the browser.

---

## Four NPC species, in voxel (2026-11-14)

Team decision, the same day: the NPCs take the detailed voxel style of the
enemies ("like the golem of Meta Space or the cerberus, but NPCs"), not the
protagonist's soft cartoon one, which they had for a first version. They
are still people of different non-human species, never hostile. What tells
them apart from a monster: a kind pixel face (eyes with a sparkle, brows
that rise in the middle, blush, a smile; no teeth, no angry brows), warm or
cool colours with cyan, gold and teal lights instead of the star-coloured
glow of the fauna, and the tools of their trade.

The design chat proposed the four species, one for each planet and a
traveller; the team can change any of them. Each has the NPC contract
(nodes `body` and `head`, clips Idle, Talk and Wave) and blinking eyes.

| Species | File | Where and role | Look |
|---|---|---|---|
| Bloomkin | `npc-bloomkin.ts` | TRAPPIST-1 e, the settlement's elder who gives quests | 2 m old tree-folk: bark trunk with moss, a moss beard, a three-tier mushroom crown with glowing spots and a sprout, branch arms with leaves, glowing mushrooms on its shoulders, a staff with a lantern |
| Forgeback | `npc-forgeback.ts` | TRAPPIST-1 b, the smith near the depots | 1.5 m, 1.3 m wide shell-folk: a stepped stone shell with warm glowing seams and a forge chimney, a leather apron with tools, goggles with cyan lenses, a snout, a hammer over its shoulder |
| Lumen | `npc-lumen.ts` | TRAPPIST-1 h, the archivist of the ruins | 2.2 m moth-sage: stepped lilac robe with gold trim and glowing runes, a white ruff, crystal wings with glowing veins, feathery antennae, a small beak, a glowing book |
| Drifter | `npc-drifter.ts` | Travels between the planets, a trader | A floating jellyfish merchant: a four-tier pink bell with glowing spots and a frill, a top hat, tentacles of blocks with glowing tips, a lantern and a satchel of goods; hovers about 1.2 m up (`flies`) |

- Between 1,150 and 1,700 triangles each (budget 12,000).
- The kind voxel face is `pixelFace()` in `web/src/models/folk.ts`, with a
  blink helper.
- Still open in [lore-and-mechanics.md](lore-and-mechanics.md): whether
  these are the species, and what each one asks and pays.

Checked: `npx tsc --noEmit`, `npm test` (407 tests), `npm run build`, and the
four in a line-up next to the Crag Golem in the browser.

---

## A bestiary of nine enemies (2026-11-14)

The team asked for many more enemies, more terrifying, "like the golem, the
cerberus and the dragon", with flyers among them. All in detailed voxel, all
with Idle, Move, Attack, Hit and Die and the timing of each attack (when the
tell starts, when the blow lands, when it ends). Fauna changes with the
planet through the validated table; machines glow red, the planner AI's
colour.

| Enemy | File | Kind | Attack (warn → hit → end, s) |
|---|---|---|---|
| Spineback | `enemy-spineback.ts` | Fauna, dragon-lizard, 3.3 m long | Rears and bites (0.20 → 0.72 → 0.95) |
| Crag Golem | `enemy-golem.ts` | Fauna, living rock, 2.6 m tall, glowing core | Two-fisted overhead smash (0.30 → 1.05 → 1.30) |
| Twinfang | `enemy-twinfang.ts` | Fauna, two-headed hound with glowing ribs | Crouches, pounces, both heads bite (0.20 → 0.88 → 1.05) |
| Stinglash | `enemy-stinglash.ts` | Fauna, scorpion, six legs, two pincers | Tail coils, then whips the stinger (0.30 → 0.75 → 0.95) |
| Gorgemaw | `enemy-gorgemaw.ts` | Fauna, rooted maw-plant, 2.1 m, three eyes | Spits a glowing glob (0.30 → 0.80 → 1.00) |
| Skyray | `enemy-skyray.ts` | Flying fauna, toothed manta, 5 m wingspan | Climbs, then dives with the stinger (0.25 → 0.82 → 1.00) |
| Wyvern | `enemy-wyvern.ts` | Flying fauna, dragon, up to 6.5 m wingspan | Fire breath in the star's colour (0.30 → 0.85 → 1.50) |
| Warden Rover | `enemy-rover.ts` | Machine, after NASA's Perseverance | Drill thrust (0.30 → 0.70 → 1.00) |
| Hornet Drone | `enemy-drone.ts` | Flying machine, after NASA's Ingenuity | Fires its gun (0.25 → 0.60 → 0.70) |

- Between 360 and 2,050 triangles each (budget 8,000), 8 to 31 draw calls.
- Flying enemies hover above their origin, which stays at ground level;
  `flies: true` in the catalog lets the ground test accept that.
- Shared details live in `web/src/models/beasts.ts` (angry glowing eyes,
  jagged teeth, glowing cracks); every enemy keeps its own silhouette.
- The two machines are credited in [NASA-DATA.md](NASA-DATA.md), "Models
  adapted so far". They were rebuilt from the vehicles' layout and have not
  been compared side by side with the GLB files yet.
- See them: `/references.html?view=lineup&models=<ids>&planet=e|b|h`, or one
  enemy on the three planets with `?model=<id>&view=planets`.

Checked: `npx tsc --noEmit`, `npm test` (311 tests), `npm run build`, line-ups
on e, b and h and three-quarter views in the browser. Not checked: each
clip of the new enemies played in the viewer (the tests check that they
close, stay under 4 s and move existing nodes).

---

## Enemies, NPC style and the fauna table (2026-11-14)

Team decisions:

- **Enemies** keep the detailed voxel style: the voxel dragon among the
  team's references and the bosses of Meta Space (dark blocks, glowing eyes
  and cracks, spikes, teeth).
- **NPCs** take the soft cartoon style of the protagonist, and are people of
  different non-human species.
- **Variety**, flying enemies included. The roster the design chat is
  building: four kinds of fauna that change with the planet (Spineback, a
  dragon-lizard that bites; Skyray, a flyer that dives; Shellcrab, a small
  armoured charger; Spitter, a rooted creature that shoots) and two machines
  of the depots (a rover sentinel after NASA's Perseverance, a flying rotor
  drone after Ingenuity). The team can change any of them.
- **The fauna table is validated** (it was the starting proposal in
  `prompts-characters.md`, part 3): temperature decides the family (cold:
  ice, temperate: moss, hot: lava), gravity the build (high: short and wide,
  low: tall and light), the star's colour whatever glows, and the planet's
  size class the overall size. In code: `web/src/models/fauna.ts`, pure data,
  with tests in `web/test/fauna.test.ts`. The planets now also carry their
  radius (`radiusEarth`, catalog field `pl_rade`).

Built: **Spineback** (`web/src/models/enemy-spineback.ts`), four-legged,
with a row of spines, angry glowing eyes, teeth, a jaw that opens and
glowing cracks on its flanks. Moss on e, basalt with glowing spine tips on
b (shorter and wider), ice with crystal spines on h (taller). About 1.5 m
tall and 3.3 m long, 2,000 triangles, 14 to 18 draw calls. Clips Idle, Move
(a trot), Attack, Hit and Die. Attack timing: the tell starts at 0.20 s
(it rears back with the jaw open), the bite lands at 0.72 s and ends at
0.95 s.

Also: `/references.html?model=<id>&view=planets` shows a model on e, b and
h side by side; the kit's `seeded` no longer breaks with negative seeds.

Checked: `npx tsc --noEmit`, `npm test` (131 tests), the three-planet view
and the Attack clip with its timeline in the browser.

---

## Shots (2026-11-14)

Approved by the team after the weapons: what each weapon fires.

- **Models** (in `web/src/models/weapons.ts`), type `shot`, in the voxel
  look, made of lights: `shot-plasma` (a bright bar with a tail),
  `shot-gravity` (a dark core in a violet glow, three moons going round
  it), `shot-ion` (a zigzag of lightning that flickers between two shapes)
  and `shot-fusion` (a white-hot core held by four bars, with embers). 250
  to 470 triangles and 14 to 20 draw calls each.
- **Contract** (`contract.ts`): a new type `shot` with the clips `Fly` (a
  loop) and `Burst`. Its origin is its centre, so the "stands on the
  ground" test skips shots.
- **How the game uses them:** `weapon-x` fires `shot-x`; `shotFor(weaponId)`
  in `weapons.ts` gives the entry. Put a new shot at the world position of
  the weapon's `muzzle` and send it along the direction the player aims.
  Take that direction from the game's aim, not from the muzzle: `Shoot` and
  `Fire` kick the muzzle up within the first frames. Play `Fly` while it
  travels. When it hits something or runs out of range, stop moving it,
  play `Burst` once (0.28 to 0.55 s) and remove it when the clip ends: the
  clip finishes with nothing left to see.
- **Viewer:** in `/models.html`, with a weapon in the hand, `Shoot` now
  launches its shot from the muzzle, which flies and bursts. Its speed
  (9 m/s) and range (5 m) are the viewer's own, to see the shot: the game
  sets the real ones.

Still open, for the team: speed, range and damage of each shot, and whether
any of them does something other than damage (the gravity orb pulling
enemies in, for one).

Checked: `npx tsc --noEmit`, `npm test` (339 tests, the other design chat's
enemies included), `npm run build`, each shot in the line-up, a frame of
each `Burst`, and a shot fired from the hand in the "In game" scene.

---

## Weapons (2026-11-14)

Team request: the weapons the protagonist defends itself with are shooting
weapons, in a blocky look ("less cartoon", after a voxel weapon from another
game, as an idea of the look only) and by kind of energy: "plasma,
gravitational, etc.". What each one does in play (damage, rate, range,
which is unlocked when) is not decided.

- **Models** (`web/src/models/weapons.ts`), type `weapon`, in the voxel look:
  dark metal blocks, lighter plates, panels drawn in pixels, strips of
  light. `weapon-plasma` (Plasma blaster, cyan, the small one),
  `weapon-gravity` (Gravity gun, violet: three prongs around a dark core),
  `weapon-ion` (Ion rifle, yellow: a bolt caught between two rails) and
  `weapon-fusion` (Fusion cannon, orange: a glowing reactor band and two
  barrels). 1,850 to 3,060 triangles each (budget 4,000).
- **Contract** (`contract.ts`): a new type `weapon` with the node `muzzle`
  and the clip `Fire`; `player` now also needs the node `hold`.
- **How the game uses them:** a weapon is held by the foot of its grip,
  which is its origin, and shoots along +Z. Add its root to the player's
  `hold` node (inside `hand_r`) and it lands in the palm, pointing where
  the forearm points. Spawn the shot at the world position of `muzzle`.
  Play the weapon's `Fire` with its own mixer (0.28 to 0.6 s: a kick, a
  flash, and what moves inside). Weapon node names start with `weapon_` or
  `muzzle`, so they do not clash with the holder's.
- **The protagonist** got four more clips: `Aim` (1.8 s, loop), `WalkAim`
  (0.9 s, loop), `RunAim` (0.56 s, loop) and `Shoot` (0.3 s, one kick from
  the aim and back). The aim holds the weapon level and ahead, out to the
  right so it shows from behind; measured, it stays within 0.5° of straight
  ahead standing, 4.5° walking and 7° running. `WalkAim` and `RunAim` are
  the legs of Walk and Run with the arms of Aim; `Shoot` only moves the
  right arm, the chest, the head and the eyes, so it can play over any of
  the three.
- **Viewers:** `/models.html` has an "In hand" selector for any model with a
  `hold` node, and the weapon fires when `Shoot` plays; its "In game" camera
  now sits over the right shoulder, the side the weapon is on.
  `/references.html` takes `&hold=<weapon id>`.

Still open, for the team: names and roles of the weapons, how many there
are, how the player gets them (the 3D printer is an option), and what a
shot looks like in the air (no projectile models yet).

Checked: `npx tsc --noEmit`, `npm test` (131 tests, the other design chat's
enemies included), `npm run build`, each weapon on its sheet, in the hand in
Aim, RunAim and Shoot, a frame of Fire, and from the "In game" camera.

---

## The protagonist moves (2026-11-14)

The team approved the soft cartoon protagonist ("Sí, animarlo"), so
`hero-cartoon` is no longer a draft: it has the seven clips of a player and
passes the contract test.

- **Clips:** Idle (3.6 s, loop: breathing, a slow look around, blinks),
  Walk (0.9 s, loop: a waddle), Run (0.56 s, loop: leaning in, knees high),
  Jump (1.2 s), Hit (0.5 s), Victory (2.4 s: a jump for joy, then the right
  hand held high) and Defeat (2.4 s: a stagger, a bump onto the ground, a
  slump). Victory and Defeat end on a pose that holds.
- **For the game:** the clips stay on the spot; the game moves the
  character. The exception is the hop of Jump, Victory and Defeat, which is
  the `body.position` track: a game that lifts the character itself can
  drop that track from the clip. `hand_r` is where the tool goes.
- **Nodes added for movement:** `eyes` (squash it to blink), `antenna`,
  `scarf_tails` and `orb`. They lag behind the body in every clip.
- **Ground contact** was measured at 30 frames a second in every clip: the
  soles go at most 3 cm under the ground (they are 4 cm thick).
- **Viewer:** `/references.html?...&clip=<name>&t=<seconds>` now shows the
  last pose when `t` is the length of the clip, instead of wrapping to the
  first one.

Still open, for the team: whether the whole game moves to this style. The
preview scenes are still voxel, and no NPC or enemy exists yet.

Checked: `npx tsc --noEmit`, `npm test` (62 tests), `npm run build`, key
poses of every clip on the view sheet, and the clips playing in
`/models.html`.

---

## Soft cartoon protagonist (2026-11-14)

Team request, after the explorer below: the protagonist in a soft cartoon
look, the kind of stylised 3D with round, simple shapes, bright colours,
smooth shading and no outline. A style direction only: no character of
another game is copied.

- **Model:** `hero-cartoon` (`web/src/models/hero-cartoon.ts`), a draft with
  no clips yet. A big blue helmet with a round window rimmed in gold and a
  face behind the glass (big eyes, blush, a smile, brown hair), an orange
  scarf, a chest light, chunky arms and legs, mittens, big boots with cream
  cuffs and toes, a belt with a round buckle, a pouch and a canteen. Behind,
  a round pack with a glowing ring, two hoses, thrusters, a bedroll and a
  sensor orb on an arm. Rings of light on the cuffs and the boots. About
  3.3 heads tall: 1.62 m to the top of the helmet, 1.81 m with the antenna.
  23,000 triangles (budget 30,000), 67 draw calls. Nodes: body, chest, head,
  helmet, arm/forearm/hand, leg/shin/foot and backpack.
- **Kit:** the `soft` material, a flat colour under a smooth ramp of light
  with a pale glow along the edges that face away from the camera (toon
  shading with a soft ramp and a rim term added to the shader). It needs no
  environment map and works with `addStyleLights` as it is.
- **If the team keeps this style**, the voxel preview scenes, the NPCs and
  the enemies would need the same treatment to match; nothing else has been
  restyled yet.

Still open, for the team: which of the three drafts stays.

Checked: `npx tsc --noEmit`, `npm test` (61 tests), `npm run build`, the
view sheet, close-ups, the line-up of the three drafts and the TRAPPIST-1 e
preview scene in the browser.

---

## Explorer protagonist, smooth look (2026-11-14)

Team request: a proposal for the protagonist outside the voxel style, after
key art of space explorers from another game (ideas only, nothing copied).
It is "not an astronaut", and the suit shines. It does not replace the voxel
`hero`: both are in the catalog for the team to compare and choose.

- **Model:** `hero-explorer` (`web/src/models/hero-explorer.ts`), a draft
  with no clips yet. Royal blue satin cloth, navy lacquered armour with gold
  edges and dark ribbed joints. A helmet with a wrap-around amber visor, a
  breather with two filters and a crest; an orange scarf; a chest rig with a
  glowing lens and canvas pouches; a big pauldron on the left and a small
  one on the right. A pack with a glowing reactor, two hoses, thrusters, a
  bedroll, a whip antenna with a pennant and a sensor orb on an arm. A
  lantern and a coil of rope on the belt, a holster with the multitool, a
  wrist computer. Strips of light on the helmet, the bracers, the legs, the
  boots and the pack. 1.93 m with the antenna, 29,408 triangles (budget
  30,000), 132 draw calls. The nodes of `hero` (body, chest, head, helmet,
  arm/forearm/hand, leg/shin, backpack) plus `foot_l`, `foot_r` and
  `chest_unit`.
- **Kit:** `lathe` (any profile turned around Y), `patch` (a rounded piece
  of the skin of a sphere), `plate` (the same on a lathe profile: armour
  that follows a limb), `strap` (flat bands), the `halo`, `lacquer` and
  `satin` materials, `face` and `up` to aim a part, and a detail setting on
  `tube`. `addStyleLights` now also sets an environment map when it gets the
  renderer, so glossy materials have something to reflect; voxel and toon
  materials do not read it and look the same as before.
- **Viewer:** `/references.html` takes `&zoom=` and `&at=` for close-ups.
- **Dev server:** `.claude/launch.json` has a second entry, `web-design`, on
  port 5183, so the design chat runs its own server next to the main one.

Still open, for the team: which protagonist stays, and the colour of the
suit (one constant in the file).

Checked: `npx tsc --noEmit`, `npm test` (54 tests), `npm run build`, the
view sheet, close-ups and the TRAPPIST-1 e preview scene in the browser.

---

## Voxel style (2026-11-14)

Team decision, replacing the cel-shaded one below the same day: the game's
look is **detailed voxel**, after a voxel creature reference the team chose
("hagámoslo así") and the blocky bosses of Meta Space. The smooth toon
models looked too plain.

- **Kit:** `cube`, `block` (a sharp box in a colour), `light` (a glowing
  block with an additive halo), `pixels` (a panel drawn as pixel art from
  strings), `speckle` (small blocks in relief, for texture), `tint` and
  `seeded`. Blocks carry their colour in their vertices, so every block of a
  node merges into one mesh: one draw call per node, whatever the colours.
  Lit with Lambert shading, no outline, cast shadows.
- **Protagonist** (`hero`, still a draft with Idle only): royal blue armour
  with gold trim, white stepped pauldrons and bracers, a black undersuit, a
  face drawn in pixels behind the helmet glass, a chest light with a halo, a
  side lamp, two antennas and a jet pack. 4,152 triangles and 36 draw calls.
- **Preview scenes** in `/models.html` are voxel too: tiled ground in close
  shades, stepped hills, block rocks, and per planet glowing plants (e),
  glowing cracks (b) or ice spikes (h), under a square sun in the star's
  real colour.
- For the game: `addStyleLights(scene, starColour, renderer)` lights voxel
  models as well; the main chat was told.

Checked: `npx tsc --noEmit`, `npm test` (47 tests), `npm run build`, the
view sheet and the three scenes in the browser.

---

## Design style and the protagonist (2026-11-14)

Team decision: the design style changes. The first models with simple,
chunky parts looked too thin and plain ("palitos"). The style is now:

- **Cel-shaded with the thick outline**, as before: three-tone toon shading
  and flat colours.
- **Heavy and detailed designs:** bulky silhouettes, layered armour, trim,
  lights and gear. The team's concept art for the protagonist (an armoured
  astronaut in blue, white and gold) and the bosses of the team's earlier
  game Meta Space (blocky, dark, with glowing cracks and spikes) set the
  level of detail. Looked at as images only, not as code.
- **A realistic look (PBR) was tried and dropped.** The kit keeps those
  materials and `addRealLights` in case a prop needs metal, but models use
  the toon look and the viewers use `addStyleLights` with cast shadows.
- **Reference images from other games** (the team shared No Man's Sky key
  art, among others) are style ideas only: none of their suits or characters
  is copied. They stay local in `reference-models/inspiration/`.

The protagonist, `web/src/models/hero.ts`, follows the team's concept: a
black undersuit under royal blue armour with orange-gold trim, big white
pauldrons and bracers, a white-and-blue helmet with a violet visor, a side
lamp and an ear disc, a chest ring light and a jet pack with two tanks.
1.9 m with the helmet, 29,328 triangles (budget 30,000), nodes body, chest,
head, helmet, arm/forearm/hand and leg/shin for each side, and backpack.
It is a draft: it has Idle only, and the contract test for its other clips
is skipped until the team approves it.

Kit changes for it: shapes use fewer sides when they are small or thin;
`tube` (hoses); `glass`, `pbr`, `fabric`, `plastic`, `metal`, `rubber`,
`visor` and `lamp` materials; shadows on every model; `draft` entries in the
catalog.

Viewer: `/models.html` has a Scene selector with a mock-up surface of each
TRAPPIST-1 planet (sky, ground, rocks, plants or crystals, the star in its
real colour from `starColor()`) and the game's third-person camera behind
the character, to judge how a model reads in play. It is a design preview,
not the game's terrain.

Checked: `npx tsc --noEmit`, `npm test` (47 tests), `npm run build`, the
view sheet and the three preview scenes in the browser.

---

## Modelling kit (2026-11-14)

Built by the characters chat, following Prompt 0 in `prompts-characters.md`.
It replaces the first kit the main chat had written; the viewers and tests of
that kit were adapted and moved into `web/src/models/`.

- **Kit** (`web/src/models/kit.ts`): the shapes box, sphere, capsule, barrel,
  torus, cone, spike and dome, with rounded rims; `part`, `node`, `bar` and a
  cartoon `eye` with an optional lid that tilts for an angry look and closes
  to blink. Materials `toon` (three tones) and `glow` (unshaded), shared by
  every model; the dark outline is drawn from each part's back faces.
- **One draw call per colour per node.** `model()` merges the parts of the
  same material inside each node, so a model costs a few draw calls instead
  of two per part.
- **Clips:** `rig(root)` gives `rot`, `mov` and `scl` by node name, as
  offsets from the rest pose; `loop` closes by itself and `poses` takes keys
  in seconds with easing. Clips made only of loops are marked as loops.
- **Contract** (`web/src/models/contract.ts`, pure data): nodes, clips and
  triangle budgets per type, the clips that loop, the 3 to 6 m height of a
  guardian, attack timings (when an attack warns, hits and ends, so the game
  can sync damage) and the planet values a model may read (`PlanetLook`),
  with TRAPPIST-1 e, b and h checked against the catalog in the tests.
- **Viewers** (development only, not in the build): `/models.html` (clips,
  speed, planet, attack timeline, triangles, draw calls, GLB download) and
  `/references.html` (front, side, back, three-quarter, the four-view sheet
  and a line-up of every model at the same scale).
- **Models for now:** `test-cube` (Idle and Jump) and `kit-shapes`, a row of
  every shape to look at. Both go once real characters exist.

Team decisions:

- **Style stays** as decided: rounded, chunky parts, three-tone toon shading
  and a thick outline. The reference images the team shares from other games
  (voxel creatures, ruin gates, crystals) give ideas only.
- **Those reference images stay on this machine**, in
  `reference-models/inspiration/`, kept out of git by the local exclude file:
  they are screenshots of other creators' work.
- **Triangle budget for guardians and the last boss:** 30,000.
- **The design chat does all the visual design**, structures and the look of
  the map included, from reference images the team sends.

Checked: `npx tsc --noEmit`, `npm test` (40 tests: 14 for the catalog, 8
for the kit and 18 for the contract and the models), `npm run build`, both viewers in
the browser, the Jump and blink clips, and the GLB export in memory (7 named
nodes, both clips). Not checked: the Download GLB button itself, which saves a
file.

---

## Catalog reader (2026-11-14)

Built by the main chat, following Prompt 1 in `prompts-world.md`.

- **What:** `web/src/data/exoplanets.ts` reads the CSV (quoted text, empty
  cells) into typed planets and keeps the list in memory; the game loads it
  at start. `web/src/data/derived.ts` computes gravity, escape velocity, size
  class, thermal band, star colour, distance in light-years and position in
  space, with null when an input is missing. Models that need a planet's
  gravity or star colour can import it from there.
- **Figures:** 5,837 planets have every derived value and 633 do not. Missing
  inputs: 540 without planet temperature, 309 without star temperature, 74
  without mass or radius, 28 without distance. The size and temperature
  splits match the ones under "NASA data" below.
- **Star colour:** a real blackbody computation (Planck's law and the CIE
  colour matching functions), checked in the tests against the Planckian
  locus. TRAPPIST-1 (2,566 K) comes out orange, `#ffa94f`. Credited under
  "Other references" in [NASA-DATA.md](NASA-DATA.md).
- **Checked:** `npx tsc --noEmit`, `npm test` (14 catalog tests),
  `npm run build` and the catalog loading in the browser.
- **Modelling kit:** before the split into two chats was written down, this
  chat also built a kit, viewers and model tests. Team decision: the
  characters chat keeps the kit and takes over those files, adapting what is
  useful; the main chat no longer touches `web/src/models/`,
  `web/models.html`, `web/references.html` or `web/test/models.test.ts`.

---

## Characters and bosses (2026-11-14)

Team decisions:

- **Design style.** Characters and bosses follow the team's own design style:
  simple, chunky parts, three-tone toon shading and a thick dark outline.
  Everything is written new for this game; no code or models are brought in
  from earlier projects.
- **Modelling kit.** Built with Prompt 0 in `prompts-characters.md`.
- **Bosses.** New and original: a guardian for the ruins of each planet and a
  last boss that gives the mega-rune. Who each one is, is still open.
- **Concept images.** Generated with the Muse image API and used as references
  for modelling. The key lives in `web/.env.local`, which git ignores; see
  `web/.env.example`. Every generated image carries a visible watermark and is
  listed in the README.

A separate chat does this work. Nothing is built yet.

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
| Design style | The protagonist is soft cartoon (`hero-cartoon`, approved): round, simple, saturated shapes with soft shading and a rim glow, no outline. Enemies, NPCs and weapons are detailed voxel: sharp blocks in close shades, relief specks, pixel details, lights with a halo. NPCs keep kind faces and friendly colours so they never read as enemies. Everything is written new for this game |
| Bosses | New and original: a guardian for the ruins of each planet and a last boss that gives the mega-rune |
| Concept images | Generated with the Muse image API, watermarked, used as modelling references |
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
    ├── models.html             Model viewer (development only)
    ├── references.html         Reference views (development only)
    ├── package.json            dev · build · test · preview · data
    ├── public/data/            Exoplanet catalog and its source record
    ├── scripts/                Catalog download
    ├── src/                    Game code
    │   ├── main.ts             Entry point: loads the catalog, empty scene
    │   ├── content/            Pure data, no Three.js
    │   ├── data/               Catalog reading and derived values
    │   └── models/             The kit, the CATALOG, one file per model and the viewers
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
