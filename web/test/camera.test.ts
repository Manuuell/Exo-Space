import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FOLLOW, damp, newFollow, stepFollow } from '../src/play/camera-follow.ts';
import { LOOK, feedLook, isSpike, newLook, settleLook, stepLook } from '../src/play/mouse-look.ts';
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, sanitizeSettings, saveSettings } from '../src/play/settings.ts';

// The camera on foot: the mouse turns it without jumps, and its distances
// ease instead of changing in one frame.

const plain = { sensitivity: 1, invertY: false, smoothing: false };

test('a normal mouse movement turns the camera at the game’s own speed', () => {
  const look = newLook(0, 0);
  feedLook(look, 10, 5);
  stepLook(look, plain, 1 / 60);
  assert.ok(Math.abs(look.yaw - -10 * LOOK.yawPerPixel) < 1e-12);
  assert.ok(Math.abs(look.pitch - 5 * LOOK.pitchPerPixel) < 1e-12);
});

test('a lone spike of hundreds of pixels is dropped', () => {
  const look = newLook(0, 0);
  for (let i = 0; i < 10; i++) feedLook(look, 8, 0);
  assert.equal(feedLook(look, 640, 0), false);
  assert.equal(look.dropped, 1);
  stepLook(look, plain, 1 / 60);
  assert.ok(Math.abs(look.yaw - -80 * LOOK.yawPerPixel) < 1e-9, `${look.yaw}`);
});

test('a real fast turn grows over a few events and passes whole', () => {
  const look = newLook(0, 0);
  const flick = [20, 60, 140, 260, 340, 300, 180, 60];
  for (const dx of flick) assert.equal(feedLook(look, dx, 0), true, `${dx}`);
  stepLook(look, plain, 1 / 60);
  const total = flick.reduce((sum, dx) => sum + dx, 0);
  assert.ok(Math.abs(look.yaw - -total * LOOK.yawPerPixel) < 1e-9);
});

test('impossible values are always spikes', () => {
  assert.equal(isSpike(5000, 0, 500), true);
  assert.equal(isSpike(Number.NaN, 0, 10), true);
  assert.equal(isSpike(Infinity, 0, 10), true);
  assert.equal(isSpike(3, 2, 0), false);
});

test('after a spike the next real movement is not dropped too', () => {
  const look = newLook(0, 0);
  feedLook(look, 900, 0);
  assert.equal(feedLook(look, 150, 0), true);
});

test('sensitivity scales the turn and invert swaps up and down', () => {
  const fast = newLook(0, 0);
  feedLook(fast, 10, 10);
  stepLook(fast, { sensitivity: 2, invertY: true, smoothing: false }, 1 / 60);
  assert.ok(Math.abs(fast.yaw - -20 * LOOK.yawPerPixel) < 1e-12);
  assert.ok(Math.abs(fast.pitch - -20 * LOOK.pitchPerPixel) < 1e-12);
});

test('the pitch stays within its limits', () => {
  const look = newLook(0, 0);
  for (let i = 0; i < 200; i++) feedLook(look, 0, 20);
  stepLook(look, plain, 1 / 60);
  assert.equal(look.pitch, LOOK.pitchMax);
});

test('smoothing spends the movement over a few frames and loses none of it', () => {
  const look = newLook(0, 0);
  feedLook(look, 100, 0);
  stepLook(look, { ...plain, smoothing: true }, 1 / 60);
  const first = -look.yaw;
  assert.ok(first > 0 && first < 100 * LOOK.yawPerPixel);
  for (let i = 0; i < 120; i++) stepLook(look, { ...plain, smoothing: true }, 1 / 60);
  assert.ok(Math.abs(look.yaw - -100 * LOOK.yawPerPixel) < 1e-6);
});

test('setting the camera forgets the movement still gathered', () => {
  const look = newLook(0, 0);
  feedLook(look, 50, 50);
  settleLook(look, 1, 0.2);
  stepLook(look, plain, 1 / 60);
  assert.deepEqual([look.yaw, look.pitch], [1, 0.2]);
});

test('damp eases the same way at any frame rate', () => {
  let at30 = 0;
  let at120 = 0;
  for (let i = 0; i < 30; i++) at30 = damp(at30, 10, 5, 1 / 30);
  for (let i = 0; i < 120; i++) at120 = damp(at120, 10, 5, 1 / 120);
  assert.ok(Math.abs(at30 - at120) < 1e-9);
});

test('aiming brings the camera in over a few frames, not in one', () => {
  let follow = newFollow();
  follow = stepFollow(follow, { aiming: true, gliding: false }, 99, 1 / 60);
  assert.ok(follow.zoom < FOLLOW.zoom.walk && follow.zoom > FOLLOW.zoom.aim + 1, `${follow.zoom}`);
  for (let i = 0; i < 60; i++) follow = stepFollow(follow, { aiming: true, gliding: false }, 99, 1 / 60);
  assert.ok(Math.abs(follow.zoom - FOLLOW.zoom.aim) < 0.01);
  assert.ok(Math.abs(follow.shoulder - FOLLOW.shoulder.aim) < 0.01);
});

test('a tree in the way brings the camera in quickly, and it waits before going back', () => {
  let follow = newFollow();
  for (let i = 0; i < 12; i++) follow = stepFollow(follow, { aiming: false, gliding: false }, 2, 1 / 60);
  assert.ok(follow.reach < 2.3, `${follow.reach}`);
  follow = stepFollow(follow, { aiming: false, gliding: false }, 99, 0.1);
  const held = follow.reach;
  assert.ok(held < 2.3);
  for (let i = 0; i < 180; i++) follow = stepFollow(follow, { aiming: false, gliding: false }, 99, 1 / 60);
  assert.ok(follow.reach > held && Math.abs(follow.reach - FOLLOW.zoom.walk) < 0.1, `${follow.reach}`);
});

test('while it eases in, the camera never goes behind what is in the way', () => {
  let follow = newFollow();
  follow = stepFollow(follow, { aiming: false, gliding: false }, 2, 1 / 60, 2.5);
  assert.ok(follow.reach <= 2.5, `${follow.reach}`);
  assert.ok(follow.reach > 2, 'it still eases the last stretch');
});

test('the camera never comes closer than its minimum', () => {
  let follow = newFollow();
  for (let i = 0; i < 120; i++) follow = stepFollow(follow, { aiming: false, gliding: false }, 0, 1 / 60);
  assert.ok(follow.reach >= FOLLOW.reachMin - 1e-9);
});

test('settings take defaults for what is missing or wrong, and clamp the rest', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  const odd = sanitizeSettings({ sensitivity: 99, fov: 'wide', invertY: true, smoothing: 1 });
  assert.equal(odd.sensitivity, 3);
  assert.equal(odd.fov, DEFAULT_SETTINGS.fov);
  assert.equal(odd.invertY, true);
  assert.equal(odd.smoothing, DEFAULT_SETTINGS.smoothing);
  assert.equal(DEFAULT_SETTINGS.rawInput, true);
  assert.equal(DEFAULT_SETTINGS.smoothing, false);
});

test('settings are saved and read back; a broken save gives the defaults', () => {
  const box = new Map<string, string>();
  const storage = { getItem: (key: string) => box.get(key) ?? null, setItem: (key: string, value: string) => void box.set(key, value) };
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
  saveSettings(storage, { ...DEFAULT_SETTINGS, sensitivity: 1.6, invertY: true });
  assert.equal(loadSettings(storage).sensitivity, 1.6);
  assert.equal(loadSettings(storage).invertY, true);
  box.set(SETTINGS_KEY, '{not json');
  assert.deepEqual(loadSettings(storage), DEFAULT_SETTINGS);
  const refusing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(loadSettings(refusing), DEFAULT_SETTINGS);
  assert.doesNotThrow(() => saveSettings(refusing, DEFAULT_SETTINGS));
});
