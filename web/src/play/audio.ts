// The game's sound, on the Web Audio API. Four buses under a master volume
// (music, effects, ambience), one-off sounds that can sit at a place in the
// world, loops that are kept and faded (the ship's engine, the glider, the
// vortex), and the ambiences of the places, cross-faded by where she is.
//
// Browsers only let a page make sound after the player does something, so
// nothing plays until start() is called from the "Click to play" button.
// Every sound is loaded once and kept; one that is not loaded yet when it is
// asked for is simply skipped, and one that cannot be loaded never plays.

import * as THREE from 'three';
import { AMBIENCES, SOUNDS, allFiles, soundFile } from './sounds.ts';
import type { AmbienceName, Bus, Sound, SoundName } from './sounds.ts';

export interface Volumes { master: number; music: number; sfx: number; ambience: number }

export interface PlayOptions {
  /** Where in the world it sounds; without it, it sounds in her ears. */
  at?: THREE.Vector3Like;
  /** From 0 to 1 (more is allowed, for a loud sound). */
  volume?: number;
  /** 1 is its own pitch; a little random spread keeps repeats alive. */
  rate?: number;
}

export interface Loop {
  /** Fades to this volume over `seconds`; false while its sound is not loaded yet. */
  volume(value: number, seconds?: number): boolean;
  rate(value: number): void;
  place(at: THREE.Vector3Like): void;
}

/** How a sound fades with distance, in metres. */
const HEARING = { near: 6, far: 140, rolloff: 1.2 };
/** Seconds the ambiences take to fade from one place to the next. */
const AMBIENCE_FADE = 1.6;

export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses = new Map<Bus, GainNode>();
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Set<string>();
  private loops = new Map<string, { gain: GainNode; source: AudioBufferSourceNode; panner: PannerNode | null }>();
  private readonly base: string;
  private volumes: Volumes;
  private ambience: Partial<Record<AmbienceName, number>> = {};
  private musicLevel = 1;

  constructor(volumes: Volumes, base = `${import.meta.env.BASE_URL}audio/`) {
    this.volumes = volumes;
    this.base = base;
  }

  get started(): boolean {
    return this.context !== null;
  }

  /** Opens the sound; call it from a click. Loads the effects first, then the ambiences and the music. */
  start(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    this.context = context;
    this.master = context.createGain();
    this.master.connect(context.destination);
    for (const bus of ['music', 'sfx', 'ambience'] as const) {
      const gain = context.createGain();
      gain.connect(this.master);
      this.buses.set(bus, gain);
    }
    this.setVolumes(this.volumes);
    const effects = allFiles().filter((file) => !file.startsWith('ambience/') && !file.startsWith('music/') && !file.includes('space_ambience'));
    const later = allFiles().filter((file) => !effects.includes(file));
    void Promise.all(effects.map((file) => this.load(file))).then(() => later.forEach((file) => void this.load(file)));
  }

  setVolumes(volumes: Volumes): void {
    this.volumes = volumes;
    const now = this.context?.currentTime ?? 0;
    this.master?.gain.setTargetAtTime(volumes.master, now, 0.05);
    this.buses.get('music')?.gain.setTargetAtTime(volumes.music * this.musicLevel, now, 0.05);
    this.buses.get('sfx')?.gain.setTargetAtTime(volumes.sfx, now, 0.05);
    this.buses.get('ambience')?.gain.setTargetAtTime(volumes.ambience, now, 0.05);
  }

  /** Places the listener where the camera is, facing where it looks. */
  listen(camera: THREE.Camera): void {
    const listener = this.context?.listener;
    if (!listener) return;
    const at = camera.getWorldPosition(new THREE.Vector3());
    const ahead = camera.getWorldDirection(new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    if (listener.positionX) {
      const t = this.context!.currentTime;
      listener.positionX.setTargetAtTime(at.x, t, 0.02);
      listener.positionY.setTargetAtTime(at.y, t, 0.02);
      listener.positionZ.setTargetAtTime(at.z, t, 0.02);
      listener.forwardX.setTargetAtTime(ahead.x, t, 0.02);
      listener.forwardY.setTargetAtTime(ahead.y, t, 0.02);
      listener.forwardZ.setTargetAtTime(ahead.z, t, 0.02);
      listener.upX.setTargetAtTime(up.x, t, 0.02);
      listener.upY.setTargetAtTime(up.y, t, 0.02);
      listener.upZ.setTargetAtTime(up.z, t, 0.02);
    } else {
      listener.setPosition(at.x, at.y, at.z);
      listener.setOrientation(ahead.x, ahead.y, ahead.z, up.x, up.y, up.z);
    }
  }

  /** Plays a sound once: a random version of it, at a place or in her ears. */
  play(name: SoundName, options: PlayOptions = {}): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const sound: Sound = SOUNDS[name];
    const buffer = this.buffers.get(soundFile(sound, Math.random()));
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = (options.rate ?? 1) * (sound.variants > 1 ? 1 : 0.96 + Math.random() * 0.08);
    const gain = context.createGain();
    gain.gain.value = options.volume ?? 1;
    source.connect(gain);
    this.route(gain, sound.bus, options.at);
    source.start();
  }

  /**
   * A loop kept by its name: the first call starts it (silent), later calls
   * give the same one. Fade it with volume(); at 0 it keeps running, quiet.
   */
  loop(name: SoundName, at?: THREE.Vector3Like): Loop {
    const self = this;
    const ensure = () => {
      const known = self.loops.get(name);
      if (known) return known;
      const context = self.context;
      const sound: Sound = SOUNDS[name];
      const buffer = self.buffers.get(soundFile(sound, 0));
      if (!context || !buffer) return null;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      const panner = self.route(gain, sound.bus, at);
      source.start(0, Math.random() * buffer.duration);
      const made = { gain, source, panner };
      self.loops.set(name, made);
      return made;
    };
    return {
      volume(value, seconds = 0.25) {
        const loop = value > 0 ? ensure() : self.loops.get(name);
        if (!self.context) return false;
        if (!loop) return value <= 0;
        loop.gain.gain.setTargetAtTime(Math.max(0, value), self.context.currentTime, Math.max(0.01, seconds / 3));
        return true;
      },
      rate(value) {
        const loop = self.loops.get(name);
        if (loop && self.context) loop.source.playbackRate.setTargetAtTime(value, self.context.currentTime, 0.1);
      },
      place(where) {
        const loop = self.loops.get(name);
        if (loop?.panner) setPannerPosition(loop.panner, where, self.context!.currentTime);
      },
    };
  }

  /** Fades the ambiences to these levels (0 to 1 each), as she moves between places. */
  surroundings(mix: Record<AmbienceName, number>): void {
    for (const name of AMBIENCES) {
      const level = mix[name] ?? 0;
      if (Math.abs((this.ambience[name] ?? 0) - level) < 0.02) continue;
      // Remembered only once it took: an ambience still loading is tried again.
      if (this.loop(name).volume(level, AMBIENCE_FADE)) this.ambience[name] = level;
    }
  }

  /** The music, softer in some places (the dungeons): 1 is its full level. */
  music(level: number): void {
    if (!this.loops.has('music')) this.loop('music').volume(1, 2);
    if (Math.abs(level - this.musicLevel) < 0.02) return;
    this.musicLevel = level;
    this.setVolumes(this.volumes);
  }

  private route(node: AudioNode, bus: Bus, at?: THREE.Vector3Like): PannerNode | null {
    const context = this.context!;
    const out = this.buses.get(bus)!;
    if (!at) {
      node.connect(out);
      return null;
    }
    const panner = context.createPanner();
    panner.panningModel = 'equalpower';
    panner.distanceModel = 'inverse';
    panner.refDistance = HEARING.near;
    panner.maxDistance = HEARING.far;
    panner.rolloffFactor = HEARING.rolloff;
    setPannerPosition(panner, at, context.currentTime);
    node.connect(panner);
    panner.connect(out);
    return panner;
  }

  private async load(file: string): Promise<void> {
    const context = this.context;
    if (!context || this.buffers.has(file) || this.loading.has(file)) return;
    this.loading.add(file);
    try {
      const response = await fetch(`${this.base}${file}`);
      if (!response.ok) return;
      this.buffers.set(file, await context.decodeAudioData(await response.arrayBuffer()));
    } catch {
      // A sound that cannot be loaded or decoded never plays.
    } finally {
      this.loading.delete(file);
    }
  }
}

function setPannerPosition(panner: PannerNode, at: THREE.Vector3Like, time: number) {
  if (panner.positionX) {
    panner.positionX.setValueAtTime(at.x, time);
    panner.positionY.setValueAtTime(at.y, time);
    panner.positionZ.setValueAtTime(at.z, time);
  } else {
    panner.setPosition(at.x, at.y, at.z);
  }
}
