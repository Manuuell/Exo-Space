# Characters of Exo Space

This document has four parts:

1. [How characters are made](#1-how-characters-are-made) in this project.
2. [The naming contract](#2-the-naming-contract) they share.
3. [The sheet](#3-the-sheet-for-each-character) the team writes for each one.
4. [The prompts](#4-prompts): the kit first, then one per type of character.

Who each character is gets decided by the team in its sheet. The prompts are
for building it, not for inventing it.

---

## 1. How characters are made

Exo Space has **no imported 3D files in play**: every model is TypeScript code
that assembles simple parts and defines its animations. That keeps them tiny,
makes them all look like one family and lets the tests check them in Node.

- **Where:** one file per character in `web/src/models/`.
- **With what:** the helpers in `web/src/models/kit.ts` (created by Prompt 0):
  - Parts: `node`, `part`, `bar`, `eye` and the shapes `box`, `sphere`,
    `capsule`, `barrel`, `torus`, `cone` and `spike`.
  - Materials: `toon(color)` (three-tone shading), `glow(color)` (unshaded,
    for lights) and the dark outline, which `part` adds by itself.
  - Colours: the game's `PALETTE`.
- **Animations:** clips made with `animation(name, duration, tracks)`. Tracks
  are built with `rot`, `mov` and `scl` from `rig(root)`, as offsets from the
  rest pose, and sampled with `loop` (loops that close by themselves) or
  `poses` (keys in seconds, eased).
- **Registry:** every model is added to `CATALOG` in
  `web/src/models/index.ts` with its `type` (`player`, `npc`, `enemy`,
  `guardian`, `prop`).
- **Automatic tests** (`web/test/models.test.ts`): node names do not repeat,
  clips last 4 seconds at most, loops close with no jump, the triangle budget
  is respected and the model has no invalid values.
- **Seeing it:** with `npm run dev`, at `/models.html` (one button per clip,
  speeds and GLB download) and at `/references.html?model=<id>&view=sheet`
  (front, side, back and three-quarter).

**Every character is a different model:** another silhouette, other
proportions, another head and another way of moving. If lining them up shows
the same puppet in a different colour, it is wrong.

---

## 2. The naming contract

The game animates by clip name and attaches things by node name. It is the
only thing the models share. They face +z; origin at ground level.

| Type | Required nodes | Required clips |
|---|---|---|
| `player` | `body`, `chest`, `head`, `leg_l`, `leg_r`, `hand_r` | `Idle`, `Walk`, `Run`, `Jump`, `Hit`, `Victory`, `Defeat` |
| `npc` | `body`, `head` | `Idle`, `Talk`, `Wave` |
| `enemy` | `body` | `Idle`, `Move`, `Attack`, `Hit`, `Die` |
| `guardian` | `body`, `weak_point` | `Idle`, `Wake`, `Move`, `Attack`, `Hit`, `Die` |

Triangle budget: 30,000 for the player, 12,000 for an NPC, 8,000 for an enemy,
30,000 for a guardian or the last boss (team decision, 2026-11-14).

---

## 3. The sheet for each character

Written by the team. It is pasted inside the character's prompt.

```
Name:
Type: player | npc | enemy | guardian
Role in the game (one sentence):
Look: silhouette, height in metres, head, clothes or parts, colours
How it moves (one sentence):
What it does: tool or attack, or which quest it gives
Where it appears: which kind of planet, map or dungeon
```

For enemies and guardians, the planet rules. Table for deriving them from
real data, validated by the team on 2026-11-14 (in code:
`web/src/models/fauna.ts`):

| Planet data | What changes in the enemy |
|---|---|
| Thermal band | Family: ice, temperate, heat or fire |
| Gravity | Build: under high gravity, short and wide; under low gravity, tall and light |
| Colour of the star | Colour of the glowing parts |
| Size class of the planet | Overall size of the fauna |

The story has three kinds of opposition (see `lore-and-mechanics.md`, Part 1):
the fauna of each planet, abandoned machines of earlier expeditions and the
guardians of ruins. The table above applies to the fauna; machines start from
real spacecraft and robots, and guardians use the `guardian` type.

---

## 4. Prompts

First **Prompt 0**, once. Then one prompt per character, in any order. Always
paste the **rules block** in front.

### Rules block (paste in front of every prompt)

```
You are working on Exo Space: A Way Home, a browser game in web/ (Vite +
TypeScript + Three.js) for the NASA Space Apps Challenge 2026. Read
HANDOFF.md, lore-and-mechanics.md and prompts-characters.md first.

Rules:
- Models are built in code with web/src/models/kit.ts. No downloaded 3D
  files or textures in play.
- Every character is a COMPLETELY DIFFERENT model: another silhouette, other
  proportions, another head. Starting from a shared base body and repainting
  it or adding accessories is forbidden. Only the node and clip names of the
  contract are shared.
- You build the character on the sheet. If the sheet is missing something,
  ask: do not make it up.
- Original designs: nothing that copies characters from other games, films
  or series.
- No NASA logos, flags or mission identifiers.
- Everything in the repository is in English: code, comments and what the
  player sees.
- Pure data goes in files without Three.js so the tests can load it in Node.
  In files the tests load, no constructor parameter properties (Node runs
  them without compiling).
- Before finishing: `npx tsc --noEmit`, `npm test` and `npm run build` in
  web/ with no errors, and look at it in the browser: /models.html for the
  model and /references.html for the view sheet.
```

### Prompt 0 — Modelling kit, viewers and tests (goes first)

```
Set up the system every model in the game will be made with.

1. web/src/models/kit.ts:
   - Parts: node (named group), part (mesh with toon material and its dark
     outline), bar (part between two points), eye.
   - Shapes: rounded box, sphere, capsule, barrel, torus, cone and spike.
   - Materials: toon(color), with three-tone shading; glow(color), unshaded,
     for lights.
   - PALETTE with the game's base colours.
   - Animation: animation(name, duration, tracks), the tracks rot, mov and
     scl, and the samplers loop (a loop that closes by itself) and poses
     (loose keyframes). Clips are ordinary AnimationClip objects over the
     node names, so they play with AnimationMixer and export to GLB.

2. web/src/models/index.ts: the CATALOG of models, each with id, type, a
   function that creates it and its clips.

3. A simple test model (a cube with eyes that jumps) to check everything
   works. Delete it once the first real character exists.

4. Viewers, for development only:
   - web/models.html: pick a model, one button per clip, speed and GLB
     download.
   - web/references.html: ?model=<id>&view=front|side|back|three-quarter|
     sheet, with a neutral background and an orthographic camera, to produce
     the reference sheets.

5. web/test/models.test.ts, for every model in the CATALOG: no repeated node
   names, the contract's nodes and clips for its type, clips of 4 seconds at
   most, loops that close with no jump, the triangle budget per type and no
   value that is not a number.

Show me the test model in both viewers before going on.
```

### Prompt 1 — The player

```
Character sheet:
[paste here the sheet written by the team]
```

```
Create the playable character on the sheet in web/src/models/<id>.ts and
register it in the CATALOG with type player.

- The camera sits behind: what is seen most is the back. It has to be
  recognisable from behind.
- The contract's clips for player, each with the character the sheet gives
  under "How it moves".
- The hand_r node is where the game attaches the tool.

Show me the view sheet and the Idle, Run and Jump clips before going on.
```

### Prompt 2 — An NPC that gives quests

```
Character sheet:
[paste here the sheet written by the team]
```

```
Create the NPC on the sheet in web/src/models/<id>.ts and register it in the
CATALOG with type npc.

- It is a person of another species: never human and never hostile.
- It has to be recognisable from afar on the map: a clear silhouette and
  something that sets it apart from enemies.
- Clips: Idle (it should look alive: breathing, looking around), Talk and
  Wave (when the player comes close).
- If there are other NPCs already, line it up with them: it cannot look
  alike.

Show me the view sheet before going on.
```

### Prompt 3 — An enemy shaped by the planet

```
Character sheet:
[paste here the sheet written by the team]

Table validated by the team for deriving enemies from planet data:
[paste here the table from part 3, once reviewed]
```

```
Create the enemy on the sheet in web/src/models/<id>.ts and register it in
the CATALOG with type enemy.

- The model receives the planet's description and changes with it according
  to the validated table: family, build, colour of what glows and size.
- It does not come in hordes: it waits in its dungeon room or appears
  because of a quest. Its Idle has to hold up to being seen up close for a
  good while.
- Attack has to warn before it hits, so the player can dodge.

Show me the same enemy on three different planets (one cold, one temperate
and one scorched) before going on.
```

### Prompt 4 — The guardian of a dungeon

```
Character sheet:
[paste here the sheet written by the team]
```

```
Create the guardian on the sheet in web/src/models/<id>.ts and register it in
the CATALOG with type guardian.

- It is what waits in the last room. Bigger than the player and with a
  silhouette that reads from the door.
- Wake: it starts still and reacts when the player comes in.
- The weak_point node marks where the player does the most damage; it has to
  be visible.
- Every attack is announced before it hits.

Show me the view sheet and the Wake and Attack clips before going on.
```
