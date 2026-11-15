// The third-person camera that follows the ship: behind it and a little
// above, looking ahead of its nose. It trails the ship instead of being
// bolted to it, so turns and speed can be felt, and it pulls back as the
// ship goes faster.
//
// Pure data, no Three.js: the tests load this file in Node.

import { forward } from './flight.ts';
import type { FlightState, FlightWorld } from './flight.ts';
import type { Vec3 } from './system.ts';

export interface ChaseCamera {
  position: Vec3;
  /** The point the camera looks at. */
  target: Vec3;
  /** Field of view, in degrees. */
  fov: number;
}

export interface CameraTuning {
  /** How far behind the ship and how far above it the camera sits, in metres. */
  distance: number;
  height: number;
  /** Extra distance for each m/s of speed. */
  speedPull: number;
  /** How far ahead of the nose it looks. */
  lookAhead: number;
  /** How quickly it catches up: higher is stiffer. */
  stiffness: number;
  /** Field of view at rest, and the degrees added at top speed. */
  fov: number;
  fovAtSpeed: number;
  /** The speed at which the field of view is fully open, in m/s. */
  topSpeed: number;
  /** The closest the camera gets to the ground. */
  clearance: number;
}

export const CAMERA: CameraTuning = {
  distance: 16,
  height: 5.5,
  speedPull: 0.05,
  lookAhead: 14,
  stiffness: 4.5,
  fov: 58,
  fovAtSpeed: 14,
  topSpeed: 150,
  clearance: 1.5,
};

type Ship = Pick<FlightState, 'position' | 'yaw' | 'pitch' | 'speed'>;

/** Where the camera wants to be for a ship that keeps doing what it does. */
export function restCamera(ship: Ship, tuning: CameraTuning = CAMERA): ChaseCamera {
  const back = tuning.distance + ship.speed * tuning.speedPull;
  const nose = forward(ship);
  // Behind along the heading, and lower when the nose is up, so the sky the
  // ship climbs into stays in view.
  const position = {
    x: ship.position.x - Math.sin(ship.yaw) * back,
    y: ship.position.y + tuning.height - Math.sin(ship.pitch) * back * 0.6,
    z: ship.position.z - Math.cos(ship.yaw) * back,
  };
  const target = {
    x: ship.position.x + nose.x * tuning.lookAhead,
    y: ship.position.y + 1.5 + nose.y * tuning.lookAhead,
    z: ship.position.z + nose.z * tuning.lookAhead,
  };
  const fov = tuning.fov + tuning.fovAtSpeed * Math.min(1, ship.speed / tuning.topSpeed);
  return { position, target, fov };
}

/** The camera one step later, catching up with where it wants to be. */
export function stepCamera(camera: ChaseCamera, ship: Ship, dt: number, world?: Pick<FlightWorld, 'ground'>, tuning: CameraTuning = CAMERA): ChaseCamera {
  const goal = restCamera(ship, tuning);
  const pull = 1 - Math.exp(-tuning.stiffness * Math.max(0, dt));
  const blend = (from: Vec3, to: Vec3, amount: number): Vec3 => ({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
    z: from.z + (to.z - from.z) * amount,
  });
  const position = blend(camera.position, goal.position, pull);
  // The target catches up faster than the position: the ship stays in frame.
  const target = blend(camera.target, goal.target, Math.min(1, pull * 2));
  if (world) position.y = Math.max(position.y, world.ground(position.x, position.z) + tuning.clearance);
  return { position, target, fov: camera.fov + (goal.fov - camera.fov) * pull };
}
