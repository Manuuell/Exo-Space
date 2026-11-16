// How the camera on foot moves between its distances: closer when she aims,
// further when she glides, closer when a tree or the land stands between it
// and her. Every change used to happen in one frame, which read as a jump;
// now each one eases at its own rate.
//
// Pure data, no DOM and no Three.js: the tests load this file in Node.

/** Moves `current` towards `target` by a share of the gap that does not depend on the frame rate. */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * Math.max(0, dt));
}

export const FOLLOW = {
  /** Distance behind her, in metres. */
  zoom: { walk: 6.5, aim: 3.2, glide: 9 },
  /** How far right of her the camera looks over her shoulder, in metres. */
  shoulder: { walk: 0.6, aim: 0.9 },
  /** Aiming narrows the view to this share of the field of view. */
  aimFov: 0.75,
  /** Rates per second: how fast each eases. */
  zoomRate: 9,
  shoulderRate: 12,
  fovRate: 10,
  /** Coming in when something blocks the view is quick, going back out is slow. */
  reachIn: 22,
  reachOut: 3.5,
  /** Seconds the view must stay clear before the camera goes back out. */
  reachHold: 0.25,
  /** Closest the camera comes to her, in metres. */
  reachMin: 1.2,
} as const;

export interface Follow {
  zoom: number;
  shoulder: number;
  /** How far back the camera is now: the zoom, or less when something is in the way. */
  reach: number;
  /** Seconds the view has been clear while the camera is in closer than the zoom. */
  clearFor: number;
}

export function newFollow(): Follow {
  return { zoom: FOLLOW.zoom.walk, shoulder: FOLLOW.shoulder.walk, reach: FOLLOW.zoom.walk, clearFor: 0 };
}

/**
 * One frame of the camera's distances. `clear` is where the camera should
 * rest, a little short of the first thing in the way (the zoom when nothing
 * is); `limit` is the thing itself, which the camera never goes behind, so
 * it is never inside a wall or a tree while it eases in.
 */
export function stepFollow(follow: Follow, state: { aiming: boolean; gliding: boolean }, clear: number, dt: number, limit = Infinity): Follow {
  const zoomGoal = state.aiming ? FOLLOW.zoom.aim : state.gliding ? FOLLOW.zoom.glide : FOLLOW.zoom.walk;
  const zoom = damp(follow.zoom, zoomGoal, FOLLOW.zoomRate, dt);
  const shoulder = damp(follow.shoulder, state.aiming ? FOLLOW.shoulder.aim : FOLLOW.shoulder.walk, FOLLOW.shoulderRate, dt);
  const goal = Math.max(FOLLOW.reachMin, Math.min(zoom, clear));
  let reach = follow.reach;
  let clearFor = follow.clearFor;
  if (goal < reach) {
    reach = damp(reach, goal, FOLLOW.reachIn, dt);
    clearFor = 0;
  } else {
    clearFor += dt;
    if (clearFor >= FOLLOW.reachHold) reach = damp(reach, goal, FOLLOW.reachOut, dt);
  }
  // Never further back than the zoom itself, so aiming comes in at once with it.
  reach = Math.max(FOLLOW.reachMin, Math.min(reach, zoom, limit));
  return { zoom, shoulder, reach, clearFor };
}
