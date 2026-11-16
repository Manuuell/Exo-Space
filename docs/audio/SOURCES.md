# Audio sources

Every sound in `web/public/audio/` was **generated with AI (Google Gemini)**
from the prompts in this folder, as the Space Apps submission guide asks to
disclose. Each file also says so in its own metadata (the Vorbis `comment`
and `description` tags: "Generated with AI (Google Gemini) for Exo Space: A
Way Home").

| Folder | Files | What |
|---|---|---|
| `player/` | 25 | Footsteps on grass, stone and dirt, jump, landing, glider, hurt, knocked down, getting up, low health and burning loops |
| `weapons/` | 17 | Plasma, gravity (with its vortex loop), ion and fusion shots and hits, weapon switch, aim in and out |
| `skills/` | 4 | Gravity pulse, starfall ready and cast, cooldown ready |
| `ship/` | 13 | Engine loop, boost, take-off, landing, lasers, asteroid hits and breaks, space ambience, jump charge |
| `pickups/` | 9 | Star shard, ore, crystal, solar energy, beacon lit, chest, stone door, portal |
| `ui/` | 12 | Task and quest chimes, talk blips, menu hover, click, open and close, fast travel |
| `ambience/` | 6 | Valley by day, forest, river, village, wasteland, dungeon (loops) |
| `music/` | 1 | `soundtrack.ogg`, the game's music (from the team's `Soundtrack.mp3`) |

How they were made into the game's files: the WAV files Gemini produced
(44.1 or 48 kHz, 16-bit, about -14 LUFS) were encoded to Ogg Vorbis with
ffmpeg (quality 5, ambience and music quality 4), their original metadata
removed and the AI note added. Names ending `_01` became `_1`.

The prompts, the style guide and the generator's manifests are kept here:

- `sfx_prompts_batch.csv` and `sfx_prompts_manifest.json`: the prompt for
  every sound;
- `style_guide_and_mastering.md`: the style prefix and suffixes used;
- `wav_pack_manifest.json`: durations, loudness and prompts of the pickups,
  interface and ambience pack.

No sound in the game is a recording of a person, and none has a voice.
