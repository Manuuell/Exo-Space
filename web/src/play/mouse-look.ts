// Mouse look for the camera on foot. The browser's mouse events are gathered
// as they come and spent once a frame, so the camera turns by the same rule
// however many events a frame gets.
//
// Under pointer lock, browsers now and then report a movement of hundreds of
// pixels that the hand never made (Chrome on Windows does it on fast turns
// and at the edge of the window). One such event used to throw the camera
// round in a single frame. An event far larger than the movement just before
// it is dropped; a real fast turn grows over a few events and passes.
//
// Pure data, no DOM and no Three.js: the tests load this file in Node.

import type { Settings } from './settings.ts';

export const LOOK = {
  /** Radians of turn per pixel of mouse at sensitivity 1 (the game's speed before this file). */
  yawPerPixel: 0.0026,
  pitchPerPixel: 0.0022,
  /** How far the camera may look down onto her (negative) or up from below. */
  pitchMin: -0.6,
  pitchMax: 1.1,
  /** An event can only be a spike above this many pixels… */
  spikeMin: 180,
  /** …and only when it is this many times the recent movement. */
  spikeRatio: 6,
  /** Above this many pixels in one event, it is always a spike. */
  spikeMax: 1200,
  /** How quickly the recent movement forgets (0 to 1, share kept per event). */
  memory: 0.7,
  /** With smoothing on, how fast the camera catches up with the mouse, per second. */
  smoothingRate: 28,
} as const;

export interface Look {
  yaw: number;
  pitch: number;
  /** Mouse movement gathered since the last frame, in pixels. */
  pendingX: number;
  pendingY: number;
  /** Recent size of the mouse's events, in pixels. */
  recent: number;
  /** Events dropped as spikes, for checking. */
  dropped: number;
}

export function newLook(yaw: number, pitch: number): Look {
  return { yaw, pitch, pendingX: 0, pendingY: 0, recent: 0, dropped: 0 };
}

/** Whether one event of the mouse is a spike the hand did not make. */
export function isSpike(dx: number, dy: number, recent: number): boolean {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return true;
  const size = Math.hypot(dx, dy);
  if (size > LOOK.spikeMax) return true;
  return size > LOOK.spikeMin && size > LOOK.spikeRatio * Math.max(recent, 1);
}

/** Takes one mouse event; returns false when it was dropped as a spike. */
export function feedLook(look: Look, dx: number, dy: number): boolean {
  if (isSpike(dx, dy, look.recent)) {
    look.dropped++;
    // The spike still says the mouse is moving: let the next real event through.
    look.recent = Math.max(look.recent, LOOK.spikeMin / LOOK.spikeRatio);
    return false;
  }
  look.pendingX += dx;
  look.pendingY += dy;
  look.recent = look.recent * LOOK.memory + Math.hypot(dx, dy) * (1 - LOOK.memory);
  return true;
}

/** Spends the gathered movement on the camera, once a frame. */
export function stepLook(look: Look, settings: Pick<Settings, 'sensitivity' | 'invertY' | 'smoothing'>, dt: number): void {
  const share = settings.smoothing ? 1 - Math.exp(-LOOK.smoothingRate * Math.max(0, dt)) : 1;
  const dx = look.pendingX * share;
  const dy = look.pendingY * share;
  look.pendingX -= dx;
  look.pendingY -= dy;
  look.yaw -= dx * LOOK.yawPerPixel * settings.sensitivity;
  look.pitch += dy * LOOK.pitchPerPixel * settings.sensitivity * (settings.invertY ? -1 : 1);
  look.pitch = Math.min(LOOK.pitchMax, Math.max(LOOK.pitchMin, look.pitch));
}

/** Forgets the gathered movement, when the camera is set by the game (a dungeon door, the ship). */
export function settleLook(look: Look, yaw: number, pitch: number): void {
  look.yaw = yaw;
  look.pitch = pitch;
  look.pendingX = 0;
  look.pendingY = 0;
}
