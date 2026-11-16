import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Animated, fadeFor } from '../src/play/animated.ts';
import { heroCartoon } from '../src/models/hero-cartoon.ts';

// How the game plays a model's clips: fades that suit the change, strides
// that carry on, and a clip's speed set apart.

test('the fade suits the change', () => {
  assert.equal(fadeFor('', 'Idle'), 0);
  assert.equal(fadeFor('Walk', 'Run'), 0.25);
  assert.equal(fadeFor('Idle', 'Walk'), 0.2);
  assert.equal(fadeFor('Run', 'Hit'), 0.05);
  assert.equal(fadeFor('Walk', 'Jump'), 0.08);
  assert.equal(fadeFor('Move', 'Attack_slam'), 0.1);
  assert.equal(fadeFor('Hit', 'Idle'), 0.18);
});

test('walk into run carries on from the same point of the stride', () => {
  const hero = new Animated(heroCartoon.create());
  hero.play('Walk');
  hero.mixer.update(0.45 * 0.9 + 1e-6);
  hero.play('Run');
  const run = hero.action('Run')!;
  assert.ok(Math.abs(run.time / run.getClip().duration - 0.45) < 0.02, `${run.time}`);
});

test('a one-off clip, or a gait out of a standstill, starts from its first frame', () => {
  const hero = new Animated(heroCartoon.create());
  hero.play('Idle');
  hero.mixer.update(1.3);
  hero.play('Walk');
  assert.equal(hero.action('Walk')!.time, 0);
  hero.play('Hit', true, true);
  assert.equal(hero.action('Hit')!.time, 0);
});

test('a clip plays at the pace it is given', () => {
  const hero = new Animated(heroCartoon.create());
  hero.play('Walk');
  hero.pace('Walk', 2);
  hero.mixer.update(0.1);
  assert.ok(Math.abs(hero.action('Walk')!.time - 0.2) < 1e-6);
});
