import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SAVE_KEY, checkJump, checkJumpHome, grantMegaRune, grantRune, jump, loadShip, newShip, saveShip } from '../src/content/ship.ts';
import type { Storage } from '../src/content/ship.ts';

function memory(): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
}

test('a new game starts at home with no runes', () => {
  const log = newShip();
  assert.equal(log.at, 'TRAPPIST-1 e');
  assert.deepEqual(log.runes, []);
  assert.deepEqual(log.visited, ['TRAPPIST-1 e']);
});

test('no jump without a rune, and the game says why', () => {
  const check = checkJump(newShip());
  assert.equal(check.ok, false);
  assert.ok(!check.ok && check.reason.includes('TRAPPIST-1 e') && check.reason.includes('TRAPPIST-1 b'));
  assert.throws(() => jump(newShip()));
});

test('the rune of a planet takes the ship to the next one, and is spent exactly once', () => {
  let log = grantRune(newShip(), 'TRAPPIST-1 e');
  assert.deepEqual(checkJump(log), { ok: true, to: 'TRAPPIST-1 b' });
  log = jump(log);
  assert.equal(log.at, 'TRAPPIST-1 b');
  assert.deepEqual(log.runes, []);
  assert.deepEqual(log.visited, ['TRAPPIST-1 e', 'TRAPPIST-1 b']);
  assert.equal(checkJump(log).ok, false);
  assert.throws(() => jump(log));
});

test('the ruins of a planet give their rune once', () => {
  let log = grantRune(newShip(), 'TRAPPIST-1 e');
  log = grantRune(log, 'TRAPPIST-1 e');
  assert.deepEqual(log.runes, ['TRAPPIST-1 e']);
  log = jump(log);
  log = grantRune(log, 'TRAPPIST-1 e');
  assert.deepEqual(log.runes, [], 'a spent rune does not come back');
  assert.deepEqual(grantRune(log, 'Kepler-22 b').runes, [], 'only playable planets have runes');
});

test('a rune only fuels the jump from its own planet', () => {
  const log = grantRune(newShip(), 'TRAPPIST-1 b');
  assert.equal(checkJump(log).ok, false);
});

test('the route ends at the third planet; the jump home needs only the mega-rune', () => {
  let log = jump(grantRune(newShip(), 'TRAPPIST-1 e'));
  log = jump(grantRune(log, 'TRAPPIST-1 b'));
  assert.equal(log.at, 'TRAPPIST-1 h');
  const last = checkJump(grantRune(log, 'TRAPPIST-1 h'));
  assert.ok(!last.ok && last.reason.includes('mega-rune'));
  assert.equal(checkJumpHome(log).ok, false);
  assert.deepEqual(checkJumpHome(grantMegaRune(log)), { ok: true, to: 'Earth' });
  assert.deepEqual(checkJumpHome(grantMegaRune(newShip())), { ok: true, to: 'Earth' });
});

test('the log is saved and read back', () => {
  const storage = memory();
  assert.deepEqual(loadShip(storage), newShip());
  const log = jump(grantRune(newShip(), 'TRAPPIST-1 e'));
  saveShip(storage, log);
  assert.ok(storage.data.has(SAVE_KEY));
  assert.deepEqual(loadShip(storage), log);
});

test('a save that cannot be read starts a new game instead of failing', () => {
  for (const text of ['', 'not json', '{"at":"Mars"}', '[]', 'null']) {
    const storage = memory();
    storage.setItem(SAVE_KEY, text);
    assert.deepEqual(loadShip(storage), newShip(), JSON.stringify(text));
  }
  const storage = memory();
  storage.setItem(SAVE_KEY, '{"at":"TRAPPIST-1 b","runes":["TRAPPIST-1 b","Mars",7]}');
  assert.deepEqual(loadShip(storage).runes, ['TRAPPIST-1 b']);
});
