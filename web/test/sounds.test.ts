import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { AMBIENCES, SOUNDS, allFiles, ambienceMix, footfalls, soundFile } from '../src/play/sounds.ts';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/play/settings.ts';

// The game's sounds: every one is on disk, the right variant is picked, the
// feet are heard when they land, and the ambience follows where she is.

const audio = new URL('../public/audio/', import.meta.url);

test('every sound the game plays is a file in public/audio, and every file is played', () => {
  const files = allFiles();
  for (const file of files) assert.ok(existsSync(new URL(file, audio)), `missing ${file}`);
  const onDisk = readdirSync(audio, { recursive: true }).map(String).map((file) => file.replaceAll('\\', '/')).filter((file) => file.endsWith('.ogg'));
  for (const file of onDisk) assert.ok(files.includes(file), `${file} is never played`);
  assert.equal(onDisk.length, 87);
});

test('a sound with versions picks one of them, and a single one is itself', () => {
  assert.equal(soundFile(SOUNDS.stepGrass, 0), 'player/step_grass_1.ogg');
  assert.equal(soundFile(SOUNDS.stepGrass, 0.999), 'player/step_grass_4.ogg');
  assert.equal(soundFile(SOUNDS.stepGrass, 1), 'player/step_grass_4.ogg');
  assert.equal(soundFile(SOUNDS.music, 0.5), 'music/soundtrack.ogg');
  assert.equal(SOUNDS.music.bus, 'music');
  assert.equal(SOUNDS.valley.bus, 'ambience');
  assert.equal(SOUNDS.engineLoop.loop, true);
});

test('a foot is heard each time it lands: twice a stride', () => {
  assert.equal(footfalls(0.1, 0.4), 0);
  assert.equal(footfalls(0.4, 0.6), 1);
  assert.equal(footfalls(0.9, 0.05), 1, 'across the end of the stride');
  assert.equal(footfalls(0.45, 0.55), 1, 'a frame is far shorter than a stride');
  let total = 0;
  for (let t = 0; t < 3; t += 1 / 60) total += footfalls(t, t + 1 / 60);
  assert.equal(total, 6, 'three strides, six steps');
});

test('the ambience follows where she is', () => {
  const valley = { dungeon: false, space: 0, forest: 0, water: 0, village: Infinity, burnt: 0 };
  assert.deepEqual(Object.keys(ambienceMix(valley)), [...AMBIENCES]);
  assert.equal(ambienceMix(valley).valley, 1);
  assert.equal(ambienceMix({ ...valley, dungeon: true }).dungeon, 1);
  assert.equal(ambienceMix({ ...valley, dungeon: true }).valley, 0);
  assert.ok(ambienceMix({ ...valley, forest: 0.9 }).forest > 0.8);
  assert.ok(ambienceMix({ ...valley, village: 20 }).village === 1);
  assert.ok(ambienceMix({ ...valley, water: 0.5 }).river === 1);
  const burnt = ambienceMix({ ...valley, burnt: 1 });
  assert.equal(burnt.wasteland, 1);
  assert.equal(burnt.valley, 0);
  const up = ambienceMix({ ...valley, space: 1 });
  assert.equal(up.space, 1);
  assert.equal(up.valley, 0);
});

test('volumes are settings: saved, with defaults, from 0 to 1', () => {
  assert.equal(DEFAULT_SETTINGS.master, 0.8);
  const odd = sanitizeSettings({ master: 4, music: -1, sfx: 'loud' });
  assert.equal(odd.master, 1);
  assert.equal(odd.music, 0);
  assert.equal(odd.sfx, DEFAULT_SETTINGS.sfx);
  assert.equal(odd.ambience, DEFAULT_SETTINGS.ambience);
});
