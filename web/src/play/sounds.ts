// The game's sounds (web/public/audio/, made with AI: see docs/audio/
// SOURCES.md), which bus each one plays on, and the rules that choose them:
// which variant of a sound, when a foot touches the ground, and how much of
// each ambience plays where she is.
//
// Pure data, no DOM, no Web Audio and no Three.js: the tests load this file
// in Node.

export type Bus = 'music' | 'sfx' | 'ambience';

export interface Sound {
  /** Path under audio/, without the extension. */
  file: string;
  /** How many versions there are (`file_1` … `file_n`); 1 means just `file`. */
  variants: number;
  bus: Bus;
  /** Plays until stopped, looping without a gap. */
  loop?: boolean;
}

const one = (file: string, bus: Bus = 'sfx', loop = false): Sound => ({ file, variants: 1, bus, loop });
const many = (file: string, variants: number, bus: Bus = 'sfx'): Sound => ({ file, variants, bus });

export const SOUNDS = {
  // She.
  stepGrass: many('player/step_grass', 4),
  stepStone: many('player/step_stone', 4),
  stepDirt: many('player/step_dirt', 4),
  jump: many('player/jump', 2),
  land: many('player/land', 2),
  gliderOpen: one('player/glider_open'),
  gliderLoop: one('player/glider_loop', 'sfx', true),
  hurt: many('player/hurt', 3),
  knockedDown: one('player/knocked_down'),
  getUp: one('player/get_up'),
  lowHealthLoop: one('player/low_health_loop', 'sfx', true),
  burningLoop: one('player/burning_loop', 'sfx', true),
  // Weapons.
  plasmaFire: many('weapons/plasma_fire', 3),
  plasmaHit: many('weapons/plasma_hit', 2),
  gravityFire: one('weapons/gravity_fire'),
  gravityVortexLoop: one('weapons/gravity_vortex_loop', 'sfx', true),
  gravityCollapse: one('weapons/gravity_collapse'),
  ionFire: many('weapons/ion_fire', 2),
  ionChain: one('weapons/ion_chain'),
  fusionFire: one('weapons/fusion_fire'),
  fusionExplosion: many('weapons/fusion_explosion', 2),
  weaponSwitch: one('weapons/weapon_switch'),
  aimIn: one('weapons/aim_in'),
  aimOut: one('weapons/aim_out'),
  // Skills.
  pulse: one('skills/pulse'),
  starfallReady: one('skills/starfall_ready'),
  starfallCast: one('skills/starfall_cast'),
  cooldownReady: one('skills/cooldown_ready'),
  // The ship and space.
  engineLoop: one('ship/engine_loop', 'sfx', true),
  boost: one('ship/boost'),
  takeoff: one('ship/takeoff'),
  shipLand: one('ship/land'),
  laser: many('ship/laser', 3),
  asteroidHit: many('ship/asteroid_hit', 2),
  asteroidBreak: many('ship/asteroid_break', 2),
  jumpCharge: one('ship/jump_charge'),
  // Pickups and places.
  shard: one('pickups/shard'),
  ore: many('pickups/ore', 2),
  crystal: one('pickups/crystal'),
  solar: one('pickups/solar'),
  beaconLit: one('pickups/beacon_lit'),
  chestOpen: one('pickups/chest_open'),
  doorOpen: one('pickups/door_open'),
  portal: one('pickups/portal'),
  // The interface.
  taskProgress: one('ui/task_progress'),
  taskComplete: one('ui/task_complete'),
  questAccept: one('ui/quest_accept'),
  questComplete: one('ui/quest_complete'),
  talkBlip: many('ui/talk_blip', 3),
  uiHover: one('ui/ui_hover'),
  uiClick: one('ui/ui_click'),
  uiOpen: one('ui/ui_open'),
  uiClose: one('ui/ui_close'),
  travel: one('ui/travel'),
  // Ambience and music.
  valley: one('ambience/valley_day_loop', 'ambience', true),
  forest: one('ambience/forest_loop', 'ambience', true),
  river: one('ambience/river_loop', 'ambience', true),
  village: one('ambience/village_loop', 'ambience', true),
  wasteland: one('ambience/wasteland_loop', 'ambience', true),
  dungeon: one('ambience/dungeon_loop', 'ambience', true),
  space: one('ship/space_ambience_loop', 'ambience', true),
  music: one('music/soundtrack', 'music', true),
} as const satisfies Record<string, Sound>;

export type SoundName = keyof typeof SOUNDS;

/** The file of one version of a sound: a random one (from 0 to 1) picks which. */
export function soundFile(sound: Sound, random: number): string {
  if (sound.variants <= 1) return `${sound.file}.ogg`;
  const k = Math.min(sound.variants, 1 + Math.floor(Math.max(0, random) * sound.variants));
  return `${sound.file}_${k}.ogg`;
}

/** Every file the sounds use, for loading and for checking. */
export function allFiles(): string[] {
  return Object.values(SOUNDS as Record<string, Sound>).flatMap((sound) =>
    sound.variants <= 1 ? [`${sound.file}.ogg`] : Array.from({ length: sound.variants }, (_, k) => `${sound.file}_${k + 1}.ogg`));
}

/**
 * How many times a foot touched the ground between two points of a stride
 * (shares of its length, from 0 to 1): the left foot lands at 0 and the
 * right at 0.5. A stride that wrapped past its end counts across the wrap.
 */
export function footfalls(before: number, now: number): number {
  const a = before - Math.floor(before);
  let b = now - Math.floor(now);
  if (b < a) b += 1;
  let count = 0;
  for (const contact of [0, 0.5, 1, 1.5]) if (contact > a && contact <= b) count++;
  return count;
}

/** Where she is, for the ambience. */
export interface Surroundings {
  /** In a dungeon. */
  dungeon: boolean;
  /** How far out in space (0 on the ground, 1 well out of the air). */
  space: number;
  /** How thick the forest is around her (0 to 1). */
  forest: number;
  /** Share of the land around her under water (0 to 1). */
  water: number;
  /** Metres to the village, or Infinity without one. */
  village: number;
  /** How burnt the land is where she is (0 in the valley, 1 in the wasteland). */
  burnt: number;
}

export type AmbienceName = 'valley' | 'forest' | 'river' | 'village' | 'wasteland' | 'dungeon' | 'space';
export const AMBIENCES: readonly AmbienceName[] = ['valley', 'forest', 'river', 'village', 'wasteland', 'dungeon', 'space'];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** How loud each ambience plays where she is, from 0 to 1. */
export function ambienceMix(at: Surroundings): Record<AmbienceName, number> {
  const mix: Record<AmbienceName, number> = { valley: 0, forest: 0, river: 0, village: 0, wasteland: 0, dungeon: 0, space: 0 };
  if (at.dungeon) {
    mix.dungeon = 1;
    return mix;
  }
  const space = clamp01(at.space);
  const ground = 1 - space;
  const burnt = clamp01(at.burnt);
  const alive = (1 - burnt) * ground;
  mix.space = space;
  mix.wasteland = burnt * ground;
  mix.village = alive * clamp01(1 - (at.village - 40) / 120);
  mix.forest = alive * clamp01(at.forest) * (1 - mix.village);
  mix.river = alive * clamp01(at.water * 2.5);
  mix.valley = alive * (1 - 0.7 * Math.max(mix.forest, mix.village));
  return mix;
}
