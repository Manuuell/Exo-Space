// A model with its clips, as the game plays them: one clip at a time with a
// fade between them, and the speed of a clip set apart from which clip it is.
//
// Two things used to make the movement jump: every change of clip started
// the new one from its first frame, so going from Walk to Run (or to the
// same legs while aiming) put the feet back to the start of the stride; and
// every change faded over the same 0.15 s, too slow for a blow and too quick
// for one gait into another. Now a loop that follows a loop carries on from
// the same point of its stride, and the fade depends on the change.

import * as THREE from 'three';
import type { Model } from '../models/kit.ts';

/** Clips that walk, run or stand: they loop and fade slowly into each other. */
const GAITS = new Set(['Idle', 'Walk', 'Run', 'Aim', 'WalkAim', 'RunAim', 'Move', 'Fly']);
/** Strides: one of these into another goes on from the same point of the step. */
export const STRIDES = new Set(['Walk', 'Run', 'WalkAim', 'RunAim']);

/** Seconds of fade from one clip to the next, when the caller does not say. */
export function fadeFor(from: string, to: string): number {
  if (!from) return 0;
  if (GAITS.has(from) && GAITS.has(to)) {
    // Standing still into moving, or back, is quicker than one gait into another.
    return from === 'Idle' || to === 'Idle' || from === 'Aim' || to === 'Aim' ? 0.2 : 0.25;
  }
  if (to === 'Hit') return 0.05;
  if (to.startsWith('Jump')) return 0.08;
  if (to === 'Land' || to === 'JumpLand') return 0.05;
  if (to.startsWith('Attack') || to === 'Wake' || to === 'Die') return 0.1;
  // Out of a one-off clip (a blow, an attack, a landing) back into a gait.
  if (GAITS.has(to)) return 0.18;
  return 0.15;
}

export class Animated {
  readonly mixer: THREE.AnimationMixer;
  readonly model: Model;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  current = '';

  constructor(model: Model) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model.root);
    for (const clip of model.clips) this.actions.set(clip.name, this.mixer.clipAction(clip));
  }

  /** The playing state of a clip, for checking. */
  action(name: string): THREE.AnimationAction | undefined {
    return this.actions.get(name);
  }

  length(name: string) {
    return this.actions.get(name)?.getClip().duration ?? 0;
  }

  /** Adds a clip made in the game (a part of another, say), to play like the model's own. */
  add(clip: THREE.AnimationClip, blendMode: THREE.AnimationBlendMode = THREE.NormalAnimationBlendMode) {
    const action = this.mixer.clipAction(clip);
    action.blendMode = blendMode;
    this.actions.set(clip.name, action);
  }

  /**
   * Plays a clip, fading from the one before. A stride that follows another
   * (walk into run, or into the same legs while aiming) carries on from the
   * same share of its length, so the feet do not jump back to the start. `restart` plays it again from the start even if it is the
   * current one; `fade` overrides the fade the change would get.
   */
  play(name: string, once = false, restart = false, fade?: number) {
    if (name === this.current && !restart) return;
    const next = this.actions.get(name);
    if (!next) return;
    const previous = this.actions.get(this.current);
    const carry = !once && !restart && previous && previous !== next && STRIDES.has(this.current) && STRIDES.has(name);
    const phase = carry ? (previous.time % previous.getClip().duration) / previous.getClip().duration : 0;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    if (carry) next.time = phase * next.getClip().duration;
    next.play();
    if (previous && previous !== next) next.crossFadeFrom(previous, fade ?? fadeFor(this.current, name), false);
    this.current = name;
  }

  /**
   * Sets how fast a clip plays, 1 being its own speed: a walk played at the
   * speed she really walks, so the feet do not slide.
   */
  pace(name: string, scale: number) {
    const action = this.actions.get(name);
    if (action) action.timeScale = scale;
  }

  /**
   * Plays a one-off clip on top of whatever plays, without stopping it: an
   * additive clip (a shot's kick) moves the body by how much it differs from
   * its own first frame.
   */
  overlay(name: string) {
    const action = this.actions.get(name);
    if (!action) return;
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    action.play();
  }
}
