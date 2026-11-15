// How the ship flies: what the pilot asks for, what the planet allows, and
// where the ship is a moment later. An arcade model: the ship moves where
// its nose points, banks into its turns, holds its height by itself and
// lands and takes off on its own once asked. The planet shows in three
// places: its gravity makes the ship climb slower and sink faster, its
// ceiling is where space starts, and its ground is in the way.
//
// The controls and the numbers in TUNING are a first proposal for the team:
// section 7 of lore-and-mechanics.md leaves "how the ship is flown" open.
//
// Pure data, no Three.js: the tests load this file in Node. Units are metres,
// seconds and radians. +Y is up; a yaw of 0 looks along +Z and grows towards
// +X; a positive pitch lifts the nose. A ship looking along +Z has its right
// wing towards -X, so a turn to the right makes the yaw smaller.

import { EARTH_GRAVITY } from './planet-physics.ts';
import type { Vec3 } from './system.ts';

export type FlightMode = 'landed' | 'takeoff' | 'flight' | 'landing' | 'space';

/** What the pilot asks for in one step. Axes run from -1 to 1. */
export interface FlightInput {
  /** Nose down (-1) or up (1). */
  pitch: number;
  /** Turn left (-1) or right (1). */
  turn: number;
  /** Brake (-1) or accelerate (1). */
  throttle: number;
  /** The thrusters under the ship: down (-1) or up (1). */
  lift: number;
  boost: boolean;
  /** Asked in this step: land when flying, take off when landed. */
  toggleLanding: boolean;
}

export const NO_INPUT: FlightInput = { pitch: 0, turn: 0, throttle: 0, lift: 0, boost: false, toggleLanding: false };

export interface FlightState {
  mode: FlightMode;
  position: Vec3;
  yaw: number;
  pitch: number;
  /** The bank of the ship, for show: it does not change where it goes. */
  roll: number;
  /** Speed along the nose, in m/s. */
  speed: number;
  /** Speed straight up or down from the thrusters, in m/s. */
  vertical: number;
  /** Why the last thing asked could not be done; empty when nothing to say. */
  notice: string;
  /** Seconds the notice still has to stay on screen. */
  noticeFor: number;
}

/** What the flight needs to know about the planet. */
export interface FlightWorld {
  /** Gravity in m/s² (see planetPhysics). */
  gravity: number;
  /** Height, in metres, above which the ship is in space. */
  ceiling: number;
  /** Height of the ground at a point, in metres. */
  ground(x: number, z: number): number;
}

export interface FlightTuning {
  /** Top speed in the air, with and without boost, and in space, in m/s. */
  cruise: number;
  boost: number;
  space: number;
  spaceBoost: number;
  /** How fast the ship gains and loses speed, in m/s². */
  acceleration: number;
  braking: number;
  /** What it loses by itself with the throttle let go, in m/s². */
  drag: number;
  /** How fast it turns and noses up or down, in radians a second. */
  turnRate: number;
  pitchRate: number;
  /** How far the nose can go up or down, in the air and in space. */
  maxPitch: number;
  maxPitchSpace: number;
  /** How far it banks in a turn, and how quickly it gets there. */
  maxBank: number;
  bankRate: number;
  /** How quickly the nose comes back level with the stick let go, in the air. */
  levelRate: number;
  /** Thrusters: climb and sink speeds on Earth, in m/s, and how quickly they answer. */
  climb: number;
  sink: number;
  thrusterRate: number;
  /** The closest the ship flies to the ground, and where take-off leaves it. */
  clearance: number;
  hoverHeight: number;
  /** Landing is allowed below this height over the ground and this speed. */
  landHeight: number;
  landSpeed: number;
  /** Coming back from space happens this far under the ceiling, so it does not flicker. */
  reentry: number;
  /** Seconds a notice stays up. */
  noticeTime: number;
}

export const TUNING: FlightTuning = {
  cruise: 70,
  boost: 150,
  space: 320,
  spaceBoost: 700,
  acceleration: 38,
  braking: 60,
  drag: 6,
  turnRate: 1.25,
  pitchRate: 0.9,
  maxPitch: 0.87,
  maxPitchSpace: 1.4,
  maxBank: 0.7,
  bankRate: 3.2,
  levelRate: 0.5,
  climb: 26,
  sink: 22,
  thrusterRate: 4,
  clearance: 2.5,
  hoverHeight: 8,
  landHeight: 60,
  landSpeed: 20,
  reentry: 60,
  noticeTime: 2.5,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Moves a value towards a goal by at most `step`. */
const approach = (value: number, goal: number, step: number) => (value < goal ? Math.min(goal, value + step) : Math.max(goal, value - step));

/** Where the nose points. */
export function forward(state: Pick<FlightState, 'yaw' | 'pitch'>): Vec3 {
  const flat = Math.cos(state.pitch);
  return { x: Math.sin(state.yaw) * flat, y: Math.sin(state.pitch), z: Math.cos(state.yaw) * flat };
}

/** Height of the ship over the ground under it. */
export function altitude(state: Pick<FlightState, 'position'>, world: FlightWorld): number {
  return state.position.y - world.ground(state.position.x, state.position.z);
}

/** The ship sitting on the ground at a point, facing a heading. */
export function landedAt(x: number, z: number, world: FlightWorld, yaw = 0): FlightState {
  return { mode: 'landed', position: { x, y: world.ground(x, z), z }, yaw, pitch: 0, roll: 0, speed: 0, vertical: 0, notice: '', noticeFor: 0 };
}

/**
 * Climb and sink speeds on this planet, in m/s. Heavier worlds are slower to
 * rise from and quicker to fall on, with the square root of their gravity.
 */
export function thrusters(world: FlightWorld, tuning: FlightTuning = TUNING): { climb: number; sink: number } {
  const pull = Math.sqrt(world.gravity / EARTH_GRAVITY);
  return { climb: tuning.climb / pull, sink: tuning.sink * pull };
}

/** The ship one step later. `dt` is in seconds; long steps are cut to 0.1 s. */
export function stepFlight(state: FlightState, input: FlightInput, dt: number, world: FlightWorld, tuning: FlightTuning = TUNING): FlightState {
  const step = clamp(dt, 0, 0.1);
  const next: FlightState = { ...state, position: { ...state.position }, noticeFor: Math.max(0, state.noticeFor - step) };
  if (next.noticeFor === 0) next.notice = '';
  const say = (notice: string) => {
    next.notice = notice;
    next.noticeFor = tuning.noticeTime;
  };
  const { climb, sink } = thrusters(world, tuning);
  const groundHere = () => world.ground(next.position.x, next.position.z);

  if (state.mode === 'landed') {
    next.speed = 0;
    next.vertical = 0;
    next.position.y = groundHere();
    if (input.toggleLanding || input.lift > 0.5) next.mode = 'takeoff';
    return next;
  }

  if (state.mode === 'takeoff') {
    // Straight up to hover height; the pilot can already turn.
    next.yaw -= input.turn * tuning.turnRate * 0.6 * step;
    next.vertical = approach(state.vertical, climb * 0.6, climb * tuning.thrusterRate * step);
    next.position.y += next.vertical * step;
    if (next.position.y - groundHere() >= tuning.hoverHeight) next.mode = 'flight';
    return next;
  }

  if (state.mode === 'landing') {
    // Stop, level out and come straight down. Pulling up calls it off.
    if (input.toggleLanding || input.lift > 0.5) {
      next.mode = 'flight';
      return next;
    }
    next.speed = approach(state.speed, 0, tuning.braking * step);
    next.pitch = approach(state.pitch, 0, tuning.pitchRate * step);
    next.roll = approach(state.roll, 0, tuning.bankRate * step);
    next.vertical = approach(state.vertical, -sink * 0.6, sink * tuning.thrusterRate * step);
    const nose = forward(next);
    next.position.x += nose.x * next.speed * step;
    next.position.z += nose.z * next.speed * step;
    next.position.y += next.vertical * step;
    const ground = groundHere();
    if (next.position.y <= ground) {
      next.position.y = ground;
      next.mode = 'landed';
      next.speed = 0;
      next.vertical = 0;
      next.pitch = 0;
      next.roll = 0;
    }
    return next;
  }

  // Flying, in the air or in space.
  const inSpace = state.mode === 'space';
  const top = inSpace ? (input.boost ? tuning.spaceBoost : tuning.space) : input.boost ? tuning.boost : tuning.cruise;
  if (input.throttle > 0) next.speed = state.speed + tuning.acceleration * (inSpace ? 3 : 1) * (input.boost ? 1.6 : 1) * input.throttle * step;
  else if (input.throttle < 0) next.speed = state.speed + tuning.braking * (inSpace ? 3 : 1) * input.throttle * step;
  else next.speed = state.speed - (inSpace ? 0 : tuning.drag) * step;
  // Over the top speed (the boost was let go, or the ship came down from
  // space) it sheds speed quickly instead of stopping dead.
  next.speed = next.speed > top ? Math.max(top, next.speed - tuning.braking * 2 * step) : Math.max(0, next.speed);

  // Slower turns at full speed; a bank that follows the turn.
  const agility = 1 - 0.4 * clamp(next.speed / tuning.boost, 0, 1);
  next.yaw -= input.turn * tuning.turnRate * agility * step;
  // `|| 0`: with no turn asked the goal is -0, and the bank has to end at 0.
  next.roll = approach(state.roll, -input.turn * tuning.maxBank || 0, tuning.bankRate * step);

  const maxPitch = inSpace ? tuning.maxPitchSpace : tuning.maxPitch;
  next.pitch = clamp(state.pitch + input.pitch * tuning.pitchRate * step, -maxPitch, maxPitch);
  if (!inSpace && input.pitch === 0) next.pitch = approach(next.pitch, 0, tuning.levelRate * step);

  const thrust = inSpace ? { climb: tuning.climb * 2, sink: tuning.climb * 2 } : { climb, sink };
  const wanted = input.lift > 0 ? input.lift * thrust.climb : input.lift * thrust.sink;
  next.vertical = approach(state.vertical, wanted, Math.max(thrust.climb, thrust.sink) * tuning.thrusterRate * step);

  const nose = forward(next);
  next.position.x += nose.x * next.speed * step;
  next.position.y += (nose.y * next.speed + next.vertical) * step;
  next.position.z += nose.z * next.speed * step;

  // The ground: the ship skims it instead of going through.
  const floor = groundHere() + tuning.clearance;
  if (next.position.y < floor) {
    next.position.y = floor;
    next.vertical = Math.max(0, next.vertical);
    if (next.pitch < 0) next.pitch = approach(next.pitch, 0, tuning.pitchRate * 2 * step);
  }

  if (!inSpace && next.position.y >= world.ceiling) next.mode = 'space';
  else if (inSpace && next.position.y < world.ceiling - tuning.reentry) next.mode = 'flight';

  if (input.toggleLanding && next.mode === 'flight') {
    const height = next.position.y - groundHere();
    if (height > tuning.landHeight) say(`Too high to land: come down below ${tuning.landHeight} m.`);
    else if (next.speed > tuning.landSpeed) say(`Too fast to land: slow down below ${tuning.landSpeed} m/s.`);
    else next.mode = 'landing';
  } else if (input.toggleLanding && next.mode === 'space') {
    say('Nothing to land on out here: go back down first.');
  }
  return next;
}
