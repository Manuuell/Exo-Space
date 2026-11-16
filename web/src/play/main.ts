// Play test: TRAPPIST-1 e as an open world, in the game's cartoon style,
// with the interface of an action RPG. The protagonist on foot in third
// person with her four weapons, two skills and a glider; a village whose
// folk give quests; enemy camps guarding chests; beacons on high ground to
// light and travel between; star shards; the dungeon gates; the ship on the
// landing pad, and space over the planet with asteroids to mine and solar
// energy to gather. A minimap, a map of the region (M) and markers on screen
// show the way. Development only, a page of its own so that it does not
// touch the game's entry (src/main.ts); open it at /play.html.
//
// The numbers, the quests, the skills and the enemies' behaviour are a first
// proposal for the team. The flight is web/src/content/flight.ts, unchanged.

import * as THREE from 'three';
import { restCamera, stepCamera } from '../content/chase-camera.ts';
import { NO_INPUT, TUNING as FLIGHT, forward as noseOf, landedAt, stepFlight } from '../content/flight.ts';
import type { FlightInput, FlightState, FlightWorld } from '../content/flight.ts';
import { planetPhysics } from '../content/planet-physics.ts';
import { loadCatalog } from '../data/exoplanets.ts';
import { TRAPPIST_1 } from '../models/contract.ts';
import { drone } from '../models/enemy-drone.ts';
import { golem } from '../models/enemy-golem.ts';
import { gorgemaw } from '../models/enemy-gorgemaw.ts';
import { rover } from '../models/enemy-rover.ts';
import { skyray } from '../models/enemy-skyray.ts';
import { spineback } from '../models/enemy-spineback.ts';
import { stinglash } from '../models/enemy-stinglash.ts';
import { twinfang } from '../models/enemy-twinfang.ts';
import { heroCartoon } from '../models/hero-cartoon.ts';
import type { Model, ModelEntry } from '../models/kit.ts';
import { planetWorld } from '../models/planet-scene.ts';
import { forestDensity } from '../models/planet-look.ts';
import { glider } from '../models/props-world.ts';
import { homeward } from '../models/ship-homeward.ts';
import { chunk, spaceField } from '../models/space-field.ts';
import type { Material, Pickup } from '../models/space-field.ts';
import { shotFor, weapons } from '../models/weapons.ts';
import { rootmaw } from '../models/guardian-rootmaw.ts';
import { ashwing } from '../models/guardian-ashwing.ts';
import { cinderhermit } from '../models/subboss-cinderhermit.ts';
import { overseer } from '../models/subboss-overseer.ts';
import { chest as chestModel } from '../models/props-world.ts';
import { buildDungeon } from './dungeon.ts';
import type { Dungeon } from './dungeon.ts';
import { endOfTheWorld } from './ending.ts';
import type { Ending } from './ending.ts';
import { FOLLOW, damp, newFollow, stepFollow } from './camera-follow.ts';
import { feedLook, newLook, stepLook } from './mouse-look.ts';
import { DEFAULT_SETTINGS, SETTING_LIMITS, loadSettings, sanitizeSettings, saveSettings } from './settings.ts';
import type { Settings } from './settings.ts';
import { nextTask, ready, wayHome } from './way-home.ts';
import type { Progress, Task, TaskId } from './way-home.ts';
import { distanceLightYears } from '../data/derived.ts';
import type { Exoplanet } from '../data/exoplanets.ts';
import './play.css';

// --- Numbers (a first proposal) -------------------------------------------------

const WALK = 4.5;
const RUN = 8.5;
const JUMP = 5.6;
const GLIDE = 11;
const GLIDE_SINK = 2.2;
const MAX_HEALTH = 100;
/** Seconds without being hit before health comes back, and how fast. */
const REST = 7;
const REGEN = 4;
const SHOT_RANGE = 90;
/** How close she has to be to the ship, a chest or one of the folk to use them. */
const BOARD = 12;
const REACH = 3.5;
const LIGHT_BEACON = 9;
const TAKE_SHARD = 2.6;
/** Skills: the gravity pulse (E) and the starfall (Q), charged by the damage she deals. */
const PULSE = { cooldown: 6, radius: 8, damage: 22, push: 5 };
const STARFALL = { charge: 160, radius: 13, damage: 75 };

/**
 * The four weapons, each fighting its own way: rapid plasma bolts with
 * trails; a gravity orb that opens a crushing vortex; ion lightning that
 * leaps from enemy to enemy; and a fusion shell lobbed in an arc that blows
 * up all around.
 */
interface Arm { id: string; name: string; tint: string; style: 'bolt' | 'vortex' | 'chain' | 'mortar'; damage: number; cooldown: number; speed: number; splash: number; push: number }
const ARSENAL: Arm[] = [
  { id: 'weapon-plasma', name: 'Plasma blaster', tint: '#ff8b2c', style: 'bolt', damage: 14, cooldown: 0.18, speed: 80, splash: 0, push: 0 },
  { id: 'weapon-gravity', name: 'Gravity gun', tint: '#c58bff', style: 'vortex', damage: 12, cooldown: 0.9, speed: 40, splash: 0, push: 2 },
  { id: 'weapon-ion', name: 'Ion rifle', tint: '#63e9ff', style: 'chain', damage: 18, cooldown: 0.4, speed: 0, splash: 0, push: 0 },
  { id: 'weapon-fusion', name: 'Fusion cannon', tint: '#ffd23f', style: 'mortar', damage: 48, cooldown: 1.1, speed: 38, splash: 6.5, push: 0 },
];

// --- Scene ------------------------------------------------------------------------

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.2, 60_000);

const params = new URLSearchParams(location.search);
const asked = params.get('planet');
const key: keyof typeof TRAPPIST_1 = asked === 'b' || asked === 'h' ? asked : 'e';
const look = TRAPPIST_1[key];
const world = planetWorld(look);
scene.add(world.group);
const { scenery, features } = world;
const level = scenery.liquid.level;

// The landing pad stands on the ground: things on it stand on its deck.
// Everything else stands on the land as it is drawn.
const PAD_TOP = 0.65;
const worldGround = (x: number, z: number) => (Math.hypot(x, z) < 15.5 ? Math.max(PAD_TOP, world.surface(x, z)) : world.surface(x, z));
/** The floor where she is: the land, or a dungeon's flat floor. */
const ground = (x: number, z: number) => (place === 'world' ? worldGround(x, z) : 0);

// --- Places: the open world and the dungeons ------------------------------------------------

type Place = 'world' | number;
let place: Place = 'world';
interface Delve {
  dungeon: Dungeon;
  /** Which halls are cleared, whether the guardian is down, the reward chest. */
  cleared: boolean[];
  done: boolean;
  chest: Animated;
  opened: boolean;
  guardian: Enemy | null;
}
const delves = new Map<number, Delve>();
const dungeonOf = (k: number) => delves.get(k)!;
const activeScene = () => (place === 'world' ? scene : dungeonOf(place).dungeon.scene);
const playerNear = (enemy: Enemy, reach: number) => mode === 'foot' && !player.down && enemy.object.position.distanceTo(player.position) < reach;

const fill = new THREE.HemisphereLight(scenery.fill[0], scenery.fill[1], 1.35);
const sun = new THREE.DirectionalLight(scenery.sun, 2.1);
scene.add(fill, sun, sun.target);
const STAR_DIRECTION = new THREE.Vector3(0.3, 0.38, 0.87).normalize();

// The star, as big as it looks from the planet, and the stars of space.
const SKY = 20_000;
const star = new THREE.Mesh(new THREE.CircleGeometry(SKY * Math.tan((2.1 * Math.PI) / 180), 48), new THREE.MeshBasicMaterial({ color: scenery.star, fog: false }));
star.frustumCulled = false;
scene.add(star);
const stars = (() => {
  const positions = new Float32Array(1500 * 3);
  for (let n = 0; n < 1500; n++) {
    const y = 1 - (2 * (n + 0.5)) / 1500;
    const ring = Math.sqrt(1 - y * y);
    const angle = n * 2.399963;
    positions.set([Math.cos(angle) * ring * SKY * 1.4, y * SKY * 1.4, Math.sin(angle) * ring * SKY * 1.4], n * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  points.frustumCulled = false;
  return points;
})();
scene.add(stars);

// --- Playing clips ----------------------------------------------------------------

/** A model with its clips, playing one at a time with a short blend. */
class Animated {
  readonly mixer: THREE.AnimationMixer;
  readonly model: Model;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  current = '';

  constructor(model: Model) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model.root);
    for (const clip of model.clips) this.actions.set(clip.name, this.mixer.clipAction(clip));
  }

  length(name: string) {
    return this.actions.get(name)?.getClip().duration ?? 0;
  }

  play(name: string, once = false, restart = false, fade = 0.15) {
    if (name === this.current && !restart) return;
    const next = this.actions.get(name);
    if (!next) return;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = once;
    next.play();
    const previous = this.actions.get(this.current);
    if (previous && previous !== next) next.crossFadeFrom(previous, fade, false);
    this.current = name;
  }
}

// --- Input --------------------------------------------------------------------------

const held = new Set<string>();
const pressed = new Set<string>();
let firing = false;
let aiming = false;
window.addEventListener('keydown', (event) => {
  // The settings' sliders keep their own keys; only O (close) gets through.
  if (event.target instanceof HTMLInputElement) {
    if (event.code === 'KeyO') pressed.add('KeyO');
    return;
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (!held.has(event.code)) pressed.add(event.code);
  held.add(event.code);
});
window.addEventListener('keyup', (event) => held.delete(event.code));
window.addEventListener('blur', () => { held.clear(); firing = false; aiming = false; });
const axis = (plus: string[], minus: string[]) => (plus.some((k) => held.has(k)) ? 1 : 0) - (minus.some((k) => held.has(k)) ? 1 : 0);

// The camera's heading and tilt. The mouse feeds `mouse` (which drops the
// spikes some browsers send under pointer lock) and it is spent once a
// frame; the game may also set these directly (a dungeon door, the ship).
let camYaw = Math.PI;
let camPitch = 0.18;
const mouse = newLook(camYaw, camPitch);
/** The camera's distances on foot, eased: zoom, shoulder, and reach past trees and walls. */
let follow = newFollow();

// --- Settings (O) ---------------------------------------------------------------------

const browserStorage = (() => { try { return window.localStorage; } catch { return null; } })();
let settings: Settings = loadSettings(browserStorage);
const settingsPanel = $<HTMLDivElement>('settings');
const settingInputs = {
  sensitivity: $<HTMLInputElement>('set-sensitivity'),
  fov: $<HTMLInputElement>('set-fov'),
  invertY: $<HTMLInputElement>('set-invert'),
  smoothing: $<HTMLInputElement>('set-smoothing'),
  rawInput: $<HTMLInputElement>('set-raw'),
};
const settingValues = { sensitivity: $<HTMLSpanElement>('set-sensitivity-value'), fov: $<HTMLSpanElement>('set-fov-value') };
settingInputs.sensitivity.min = String(SETTING_LIMITS.sensitivity.min);
settingInputs.sensitivity.max = String(SETTING_LIMITS.sensitivity.max);
settingInputs.sensitivity.step = String(SETTING_LIMITS.sensitivity.step);
settingInputs.fov.min = String(SETTING_LIMITS.fov.min);
settingInputs.fov.max = String(SETTING_LIMITS.fov.max);
settingInputs.fov.step = String(SETTING_LIMITS.fov.step);
function showSettings() {
  settingInputs.sensitivity.value = String(settings.sensitivity);
  settingInputs.fov.value = String(settings.fov);
  settingInputs.invertY.checked = settings.invertY;
  settingInputs.smoothing.checked = settings.smoothing;
  settingInputs.rawInput.checked = settings.rawInput;
  settingValues.sensitivity.textContent = `${settings.sensitivity.toFixed(2)}×`;
  settingValues.fov.textContent = `${Math.round(settings.fov)}°`;
}
function changeSettings(change: Partial<Settings>) {
  const rawBefore = settings.rawInput;
  settings = sanitizeSettings({ ...settings, ...change });
  saveSettings(browserStorage, settings);
  showSettings();
  // Raw input is chosen when the pointer is locked: lock it again to apply it.
  if (settings.rawInput !== rawBefore && locked()) document.exitPointerLock?.();
}
settingInputs.sensitivity.addEventListener('input', () => changeSettings({ sensitivity: Number(settingInputs.sensitivity.value) }));
settingInputs.fov.addEventListener('input', () => changeSettings({ fov: Number(settingInputs.fov.value) }));
settingInputs.invertY.addEventListener('change', () => changeSettings({ invertY: settingInputs.invertY.checked }));
settingInputs.smoothing.addEventListener('change', () => changeSettings({ smoothing: settingInputs.smoothing.checked }));
settingInputs.rawInput.addEventListener('change', () => changeSettings({ rawInput: settingInputs.rawInput.checked }));
$<HTMLButtonElement>('set-reset').addEventListener('click', () => changeSettings({ ...DEFAULT_SETTINGS }));
function toggleSettings() {
  settingsPanel.hidden = !settingsPanel.hidden;
  if (!settingsPanel.hidden) {
    showSettings();
    document.exitPointerLock?.();
  }
}
showSettings();

const locked = () => document.pointerLockElement === canvas;
/**
 * Locks the pointer for mouse look. With raw input on, it asks for movement
 * without the system's pointer acceleration, so the camera turns by how far
 * the hand moves and not by how fast; a browser that cannot do that gets the
 * ordinary lock.
 */
function lockPointer() {
  const plain = () => { try { void canvas.requestPointerLock?.(); } catch { /* no pointer lock here */ } };
  if (!settings.rawInput) return plain();
  try {
    const asked = (canvas.requestPointerLock as (options?: { unadjustedMovement?: boolean }) => Promise<void> | void).call(canvas, { unadjustedMovement: true });
    if (asked && typeof asked.catch === 'function') asked.catch(plain);
  } catch {
    plain();
  }
}
const startScreen = $<HTMLDivElement>('start');
$<HTMLButtonElement>('start-button').addEventListener('click', () => {
  startScreen.hidden = true;
  lockPointer();
  say('TRAPPIST-1 e is dying. This valley is the last place where anyone can live: gather what the ship needs (T), and take its people home.', 8);
});
canvas.addEventListener('click', () => { if (!locked() && mapScreen.hidden && settingsPanel.hidden) lockPointer(); });
let dragging = false;
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0) firing = true;
  if (event.button === 2) aiming = true;
  if (!locked()) dragging = true;
});
window.addEventListener('mouseup', (event) => {
  if (event.button === 0) firing = false;
  if (event.button === 2) aiming = false;
  dragging = false;
});
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
window.addEventListener('mousemove', (event) => {
  if (!locked() && !dragging) return;
  feedLook(mouse, event.movementX, event.movementY);
});

// --- The protagonist -----------------------------------------------------------------

const hero = new Animated(heroCartoon.create());
scene.add(hero.model.root);
const hand = hero.model.root.getObjectByName('hold')!;
const wings = glider.create().root;
wings.position.set(0, 1.25, -0.28);
wings.visible = false;
hero.model.root.add(wings);
const HOME = new THREE.Vector3(6, PAD_TOP, 22);
const player = {
  position: HOME.clone(),
  velocityY: 0,
  grounded: true,
  gliding: false,
  facing: Math.PI,
  health: MAX_HEALTH,
  sinceHit: 99,
  /** Seconds left of a one-off clip (shoot, hit, jump) before the walk takes over again. */
  busy: 0,
  down: false,
  arm: 0,
  cooldown: 0,
  pulse: 0,
  charge: 0,
  /** A shove from a blow, in m/s, that dies away. */
  knock: new THREE.Vector3(),
};

/** A blow throws her back from where it came, and up if `up` > 0. */
function knockBack(from: THREE.Vector3Like, strength: number, up = 0) {
  const away = new THREE.Vector3(player.position.x - from.x, 0, player.position.z - from.z);
  if (away.lengthSq() < 1e-4) away.set(Math.sin(player.facing), 0, Math.cos(player.facing)).negate();
  player.knock.copy(away.normalize().multiplyScalar(strength));
  if (up > 0 && player.grounded) {
    player.velocityY = up;
    player.grounded = false;
  }
}

let weapon: Animated | null = null;
function equip(index: number) {
  if (weapon) hand.remove(weapon.model.root);
  player.arm = index;
  const entry = weapons.find((candidate) => candidate.id === ARSENAL[index].id)!;
  weapon = new Animated(entry.create());
  hand.add(weapon.model.root);
}
equip(0);

// --- Effects: rings, flashes and damage numbers -------------------------------------------

interface Effect { mesh: THREE.Mesh; age: number; life: number; grow: number }
const effects: Effect[] = [];
function ring(at: THREE.Vector3, colour: string, grow: number, life = 0.5) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: colour, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.position.copy(at);
  activeScene().add(mesh);
  effects.push({ mesh, age: 0, life, grow });
}
function flash(at: THREE.Vector3, colour: string, grow: number, life = 0.6) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: colour, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.position.copy(at);
  activeScene().add(mesh);
  effects.push({ mesh, age: 0, life, grow });
}
function updateEffects(dt: number) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.age += dt;
    const t = effect.age / effect.life;
    effect.mesh.scale.setScalar(1 + effect.grow * t);
    (effect.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
    if (t >= 1) {
      effect.mesh.parent?.remove(effect.mesh);
      effects.splice(i, 1);
    }
  }
}

const floaters = $<HTMLDivElement>('floaters');
function damageNumber(at: THREE.Vector3, amount: number, big = false) {
  const point = at.clone().project(camera);
  if (point.z > 1) return;
  const el = document.createElement('div');
  el.className = big ? 'floater big' : 'floater';
  el.textContent = String(Math.round(amount));
  el.style.left = `${((point.x + 1) / 2) * 100 + (Math.random() - 0.5) * 3}%`;
  el.style.top = `${((1 - point.y) / 2) * 100}%`;
  floaters.append(el);
  setTimeout(() => el.remove(), 900);
}

// --- Shots: each weapon fights its own way ------------------------------------------------

interface Flying { shot: Animated; velocity: THREE.Vector3; left: number; arm: Arm; bursting: boolean; trail: THREE.Mesh | null; gravity: number }
const flying: Flying[] = [];
/** Seconds of camera shake left, and how strong. */
let shake = 0;

/** What the crosshair is on: the first enemy or bit of ground along the camera's line of sight. */
function aimPoint(): THREE.Vector3 {
  const direction = camera.getWorldDirection(new THREE.Vector3());
  const point = new THREE.Vector3();
  for (let d = 4; d < SHOT_RANGE; d += 1) {
    point.copy(camera.position).addScaledVector(direction, d);
    if (here().some((enemy) => enemy.health > 0 && enemy.centre().distanceTo(point) < enemy.radius)) return point;
    if (point.y < ground(point.x, point.z)) return point;
  }
  return point;
}

/** The enemy under the crosshair, if any is within reach. */
function aimed(reach: number): Enemy | null {
  const origin = camera.position;
  const direction = camera.getWorldDirection(new THREE.Vector3());
  let best: Enemy | null = null;
  let bestAlong = Infinity;
  for (const enemy of here()) {
    if (enemy.health <= 0) continue;
    const toward = enemy.centre().sub(origin);
    const along = toward.dot(direction);
    if (along < 2 || along > reach) continue;
    const off = toward.addScaledVector(direction, -along).length();
    if (off < enemy.radius + 1.2 && along < bestAlong) {
      best = enemy;
      bestAlong = along;
    }
  }
  return best;
}

function muzzlePoint(): THREE.Vector3 {
  const muzzle = weapon?.model.root.getObjectByName('muzzle');
  const at = new THREE.Vector3();
  if (muzzle) {
    muzzle.updateWorldMatrix(true, false);
    muzzle.getWorldPosition(at);
  } else at.copy(player.position).setY(player.position.y + 1.3);
  return at;
}

function fire() {
  const arm = ARSENAL[player.arm];
  const from = muzzlePoint();
  flash(from, arm.tint, 1.4, 0.09);
  weapon?.play('Fire', true, true);
  if (arm.style === 'chain') {
    chainLightning(from);
    return;
  }
  const entry = shotFor(arm.id);
  if (!entry) return;
  const shot = new Animated(entry.create());
  shot.model.root.position.copy(from);
  const target = aimPoint();
  const direction = target.clone().sub(from).normalize();
  const velocity = direction.clone().multiplyScalar(arm.speed);
  let gravity = 0;
  if (arm.style === 'mortar') {
    // A heavy shell, lobbed in an arc to land where she aims.
    gravity = 20;
    const flat = Math.max(4, Math.hypot(target.x - from.x, target.z - from.z));
    const time = flat / arm.speed;
    velocity.set((target.x - from.x) / time, (target.y - from.y) / time + 0.5 * gravity * time, (target.z - from.z) / time);
  }
  shot.model.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), velocity.clone().normalize());
  shot.model.root.scale.setScalar(arm.style === 'mortar' ? 1.8 : arm.style === 'vortex' ? 1.6 : 1.3);
  activeScene().add(shot.model.root);
  shot.play('Fly');
  // A glowing trail behind it.
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(arm.style === 'bolt' ? 0.07 : 0.16, 0.01, 1, 6, 1, true).rotateX(Math.PI / 2).translate(0, 0, -0.5), new THREE.MeshBasicMaterial({ color: arm.tint, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  trail.scale.set(1, 1, arm.style === 'bolt' ? 3.5 : 2.2);
  shot.model.root.add(trail);
  flying.push({ shot, velocity, left: arm.style === 'mortar' ? 6 : SHOT_RANGE / arm.speed, arm, bursting: false, trail, gravity });
}

/** The ion rifle: lightning that strikes what she aims at and leaps to the enemies near it. */
function chainLightning(from: THREE.Vector3) {
  const arm = ARSENAL[player.arm];
  let target = aimed(70);
  const struck = new Set<Enemy>();
  let source = from;
  let damage = arm.damage;
  if (!target) {
    bolt(source, aimPoint(), arm.tint);
    flash(aimPoint(), arm.tint, 1.2, 0.15);
    return;
  }
  for (let jump = 0; jump < 4 && target; jump++) {
    const at = target.centre();
    bolt(source, at, arm.tint);
    flash(at, '#e8ffff', 1.6, 0.15);
    hurt(target, damage, at.clone().sub(source));
    struck.add(target);
    source = at;
    damage = Math.round(damage * 0.75);
    // The next: the nearest one not struck yet, within 11 m.
    target = here().filter((enemy) => enemy.health > 0 && !struck.has(enemy) && enemy.centre().distanceTo(at) < 11)
      .sort((a, b) => a.centre().distanceTo(at) - b.centre().distanceTo(at))[0] ?? null;
  }
}

interface Bolt { group: THREE.Group; age: number }
const bolts: Bolt[] = [];
/** A jagged bolt of lightning between two points, that flickers out. */
function bolt(from: THREE.Vector3, to: THREE.Vector3, colour: string) {
  const group = new THREE.Group();
  const points = [from.clone()];
  const steps = Math.max(3, Math.round(from.distanceTo(to) / 2.2));
  for (let i = 1; i < steps; i++) {
    points.push(from.clone().lerp(to, i / steps).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.4)));
  }
  points.push(to.clone());
  for (const [width, tint, opacity] of [[0.35, colour, 0.5], [0.12, '#ffffff', 1]] as const) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const piece = new THREE.Mesh(new THREE.CylinderGeometry(width, width, a.distanceTo(b), 5, 1, true), new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
      piece.position.copy(a).add(b).multiplyScalar(0.5);
      piece.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      group.add(piece);
    }
  }
  activeScene().add(group);
  bolts.push({ group, age: 0 });
}

interface Vortex { at: THREE.Vector3; age: number; group: THREE.Group; tick: number }
const vortices: Vortex[] = [];
/** The gravity gun's orb opens a vortex that draws enemies in, crushes them, and collapses. */
function vortex(at: THREE.Vector3) {
  const group = new THREE.Group();
  group.position.copy(at).setY(at.y + 0.8);
  for (const [radius, colour] of [[3.2, '#c58bff'], [2.2, '#8d4bff'], [1.3, '#e0c8ff']] as const) {
    group.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.14, 6, 36).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
  }
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: '#2a0f4a' })));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshBasicMaterial({ color: '#8d4bff', transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })));
  activeScene().add(group);
  vortices.push({ at: at.clone(), age: 0, group, tick: 0 });
}

function burst(item: Flying) {
  item.bursting = true;
  if (item.trail) item.trail.visible = false;
  item.shot.play('Burst', true, true, 0);
  item.left = item.shot.length('Burst') || 0.3;
  const at = item.shot.model.root.position.clone();
  const arm = item.arm;
  if (arm.style === 'bolt') {
    ring(at, arm.tint, 2.2, 0.3);
  } else if (arm.style === 'vortex') {
    vortex(at);
  } else if (arm.style === 'mortar') {
    // A big blast: a flash, two rings, a shake, and everything near is hurt.
    flash(at, '#ffd23f', 6, 0.55);
    flash(at, '#ff7a2a', 3.5, 0.8);
    ring(at.clone().setY(at.y + 0.3), '#ffb347', 8, 0.5);
    ring(at.clone().setY(at.y + 1.2), '#ff7a2a', 5, 0.7);
    shake = Math.max(shake, 0.4);
    for (const enemy of here()) {
      if (enemy.health > 0 && enemy.object.position.distanceTo(at) < arm.splash + enemy.radius) hurt(enemy, arm.damage, enemy.object.position.clone().sub(at), 3, true);
    }
  }
}

function updateShots(dt: number) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const item = flying[i];
    item.shot.mixer.update(dt);
    item.left -= dt;
    const at = item.shot.model.root.position;
    if (!item.bursting) {
      if (item.gravity) {
        item.velocity.y -= item.gravity * dt;
        item.shot.model.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), item.velocity.clone().normalize());
      }
      at.addScaledVector(item.velocity, dt);
      const hit = here().find((enemy) => enemy.health > 0 && enemy.centre().distanceTo(at) < enemy.radius + 0.5);
      if (hit) {
        if (item.arm.style !== 'mortar') hurt(hit, item.arm.damage, item.velocity, item.arm.push);
        burst(item);
      } else if (at.y < ground(at.x, at.z) || item.left <= 0) {
        burst(item);
      }
    } else if (item.left <= 0) {
      item.shot.model.root.parent?.remove(item.shot.model.root);
      flying.splice(i, 1);
    }
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const item = bolts[i];
    item.age += dt;
    item.group.visible = item.age < 0.22 && Math.random() > 0.15;
    if (item.age > 0.25) {
      item.group.parent?.remove(item.group);
      bolts.splice(i, 1);
    }
  }
  for (let i = vortices.length - 1; i >= 0; i--) {
    const item = vortices[i];
    item.age += dt;
    item.tick -= dt;
    item.group.children.forEach((child, k) => { child.rotation.y += dt * (3 + k * 2) * (k % 2 ? -1 : 1); });
    const life = 1.8;
    item.group.scale.setScalar(item.age < 0.2 ? item.age / 0.2 : item.age > life - 0.25 ? Math.max(0.05, (life - item.age) / 0.25) : 1 + 0.05 * Math.sin(item.age * 20));
    // Drawn in, and crushed a little at a time.
    for (const enemy of here()) {
      if (enemy.health <= 0) continue;
      const toward = item.at.clone().sub(enemy.object.position).setY(0);
      const distance = toward.length();
      if (distance < 9 && distance > 0.8 && !enemy.boss) enemy.object.position.addScaledVector(toward.normalize(), Math.min(distance - 0.8, 7 * dt));
      if (distance < 9 && item.tick <= 0) hurt(enemy, 6, toward);
    }
    if (item.tick <= 0) item.tick = 0.35;
    if (item.age >= life) {
      flash(item.at.clone().setY(item.at.y + 0.8), '#c58bff', 4, 0.4);
      for (const enemy of here()) if (enemy.health > 0 && enemy.object.position.distanceTo(item.at) < 6 + enemy.radius) hurt(enemy, 22, enemy.object.position.clone().sub(item.at), 4, true);
      item.group.parent?.remove(item.group);
      vortices.splice(i, 1);
    }
  }
}

function clearShots() {
  for (const item of flying) item.shot.model.root.parent?.remove(item.shot.model.root);
  for (const item of bolts) item.group.parent?.remove(item.group);
  for (const item of vortices) item.group.parent?.remove(item.group);
  for (const orb of orbs) orb.mesh.parent?.remove(orb.mesh);
  flying.length = 0;
  bolts.length = 0;
  vortices.length = 0;
  orbs.length = 0;
  // A guardian's marks stay behind with it.
  for (const enemy of enemies) dropPlan(enemy);
  dragonClear();
  warn('');
}

// --- Enemies ----------------------------------------------------------------------------

interface Enemy {
  entry: ModelEntry;
  body: Animated;
  object: THREE.Object3D;
  home: THREE.Vector3;
  /** Where it is: the open world, or a dungeon (by number), and which hall. */
  area: Place;
  hall: number;
  /** The camp it guards, or -1; the pack it roams with, or -1. */
  camp: number;
  pack: number;
  boss: boolean;
  /** Bigger and much tougher than the rest of its pack. */
  elite: boolean;
  /** It also shoots from afar, and when it may next. */
  ranged: boolean;
  shot: number;
  /** A guardian's attack in the making, when it may start the next, and whether it is enraged. */
  plan: BossPlan | null;
  next: number;
  enraged: boolean;
  attacks: number;
  /** A guardian waits, asleep, until she comes into its hall. */
  awake: boolean;
  rank: number;
  health: number;
  most: number;
  radius: number;
  height: number;
  speed: number;
  state: 'idle' | 'chase' | 'attack' | 'hit' | 'dead' | 'back' | 'waking';
  /** The attack it is making. */
  move: string;
  timer: number;
  struck: boolean;
  cooldown: number;
  bar: HTMLDivElement;
  centre(): THREE.Vector3;
}

const enemies: Enemy[] = [];
/** The enemies where she is now. */
const here = () => enemies.filter((enemy) => enemy.area === place);
const bars = $<HTMLDivElement>('bars');
const fallen = new Map<number, number>();

interface Spawn { camp?: number; pack?: number; area?: Place; hall?: number; boss?: boolean; elite?: boolean; name?: string }
/** The ones that also shoot from afar. */
const SHOOTERS = new Set(['stinglash', 'drone', 'skyray', 'gorgemaw']);
function spawn(entry: ModelEntry, x: number, z: number, options: Spawn = {}) {
  const area = options.area ?? 'world';
  const groundOf = (px: number, pz: number) => (area === 'world' ? worldGround(px, pz) : 0);
  // Out of the water: step back towards the landing site until dry.
  if (area === 'world') for (let k = 0; k < 20 && groundOf(x, z) < level + 1; k++) { x *= 0.9; z *= 0.9; }
  const model = entry.planetary ? entry.create(look) : entry.create();
  const body = new Animated(model);
  const elite = options.elite ?? false;
  if (elite) model.root.scale.setScalar(1.35);
  const box = new THREE.Box3().setFromObject(model.root);
  const size = box.getSize(new THREE.Vector3());
  const boss = options.boss ?? false;
  const radius = Math.max(0.6, Math.max(size.x, size.z) * (boss ? 0.42 : 0.38));
  const height = size.y;
  const health = boss ? (area === 'world' ? 1500 : 1100) : Math.round((30 + height * 22) * 2 * (elite ? 2.5 : 1));
  // Further from the landing site, stronger; dungeon guards are tougher.
  const rank = (boss ? 20 : area === 'world' ? 1 + Math.round(Math.hypot(x, z) / 90) + Math.round(height) : 10 + Math.round(height)) + (elite ? 5 : 0);
  model.root.position.set(x, groundOf(x, z), z);
  if (area !== 'world') model.root.rotation.y = Math.PI;
  (area === 'world' ? scene : dungeonOf(area).dungeon.scene).add(model.root);
  body.play('Idle');
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = `<div>${boss ? options.name ?? entry.name : `${elite ? 'Elite · ' : ''}Lv. ${rank}`}</div><div class="fill"><div></div></div>`;
  bar.hidden = true;
  bars.append(bar);
  const enemy: Enemy = {
    entry, body, object: model.root, home: new THREE.Vector3(x, 0, z), area, hall: options.hall ?? -1, camp: options.camp ?? -1, pack: options.pack ?? -1, boss, elite,
    ranged: SHOOTERS.has(entry.id), shot: 1 + Math.random() * 2, plan: null, next: 1.5, enraged: false, attacks: 0, awake: !boss, rank, health, most: health, radius, height,
    speed: (entry.flies ? 5.5 : boss ? 3.6 : 3.2 + 1.2 / Math.max(1, height)) * (boss ? 1 : 1.25), state: 'idle', move: 'Attack', timer: 0, struck: false, cooldown: 0, bar,
    centre() { return this.object.position.clone().setY(this.object.position.y + (entry.flies ? box.min.y + size.y / 2 : height / 2)); },
  };
  enemies.push(enemy);
  return enemy;
}

function hurt(enemy: Enemy, damage: number, push: THREE.Vector3, shove = 0, big = false) {
  if (enemy.health <= 0) return;
  enemy.health = Math.max(0, enemy.health - (enemy === worldBoss ? dragonTakes(damage) : damage));
  damageNumber(enemy.centre().setY(enemy.object.position.y + enemy.height + 0.4), damage, big);
  player.charge = Math.min(STARFALL.charge, player.charge + damage * 0.5);
  if (shove > 0 && !enemy.boss) enemy.object.position.addScaledVector(push.clone().setY(0).normalize(), shove * 0.4);
  // A guardian struck wakes up.
  if (!enemy.awake && enemy !== worldBoss) wake(enemy);
  if (enemy.health <= 0) {
    enemy.state = 'dead';
    enemy.timer = 3.5;
    enemy.body.play('Die', true, true);
    if (enemy.camp >= 0) {
      fallen.set(enemy.camp, (fallen.get(enemy.camp) ?? 0) + 1);
      if (campLeft(enemy.camp) === 0) say('Camp cleared! Its chest is free to open.', 3);
    }
    if (enemy === worldBoss) {
      cargo.crystal += 6;
      cargo.ore += 12;
      dragonClear();
      warn('');
      say(`${worldBossName} falls! Its hoard: 6 crystal and 12 ore for the ship. The valley's skies are safe.`, 5);
    }
    return;
  }
  // Shot at, it turns on the shooter.
  if (enemy.state !== 'attack' && enemy.state !== 'waking' && !enemy.boss) {
    enemy.state = 'hit';
    enemy.timer = enemy.body.length('Hit') || 0.4;
    enemy.body.play('Hit', true, true, 0.05);
  }
}

function wake(enemy: Enemy) {
  enemy.awake = true;
  enemy.state = 'waking';
  enemy.timer = enemy.body.length('Wake') || 1;
  enemy.body.play('Wake', true, true, 0.05);
  shake = Math.max(shake, 0.5);
}

/** How many guards of a camp are still standing. */
function campLeft(camp: number): number {
  return enemies.filter((enemy) => enemy.camp === camp && enemy.health > 0).length;
}

function updateEnemies(dt: number) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    // Only where she is: the others wait, unseen.
    if (enemy.area !== place) {
      enemy.bar.hidden = true;
      continue;
    }
    const at = enemy.object.position;
    const toPlayer = new THREE.Vector3(player.position.x - at.x, 0, player.position.z - at.z);
    const distance = toPlayer.length();
    // The dragon keeps its own time, near or far.
    if (enemy === worldBoss && enemy.state !== 'dead') {
      dragonBrain(enemy, dt);
      continue;
    }
    // Far away, they wait, and save the work.
    if (distance > 400 && enemy.state !== 'dead') {
      enemy.object.visible = false;
      enemy.bar.hidden = true;
      continue;
    }
    enemy.object.visible = true;
    enemy.body.mixer.update(dt);
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    const reach = enemy.radius + (enemy.boss ? 2.4 : 1.6);
    const timing = enemy.body.model.attacks[enemy.move] ?? { warn: 0.2, hit: 0.5, end: 0.8 };
    const playerHere = mode === 'foot' && !player.down;
    const face = (direction: THREE.Vector3, rate: number) => {
      const goal = Math.atan2(direction.x, direction.z);
      let turn = goal - enemy.object.rotation.y;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      enemy.object.rotation.y += THREE.MathUtils.clamp(turn, -rate * dt, rate * dt);
    };
    const step = (direction: THREE.Vector3, speed: number) => {
      const next = at.clone().addScaledVector(direction.clone().normalize(), speed * dt);
      const free = enemy.area === 'world' ? worldGround(next.x, next.z) > level + 0.5 || enemy.entry.flies : dungeonOf(enemy.area).dungeon.walkable(next.x, next.z);
      if (free) at.copy(next);
    };

    if (enemy.state === 'dead') {
      if (enemy.plan) {
        dropPlan(enemy);
        warn('');
      }
      // The dragon falls out of the sky.
      if (enemy === worldBoss && raid.alt > 0) {
        enemy.object.visible = true;
        enemy.body.mixer.update(dt);
        raid.alt = Math.max(0, raid.alt - 22 * dt);
        at.y = worldGround(at.x, at.z) + raid.alt;
      }
      enemy.timer -= dt;
      enemy.bar.hidden = true;
      if (enemy.timer <= 0) {
        enemy.object.parent?.remove(enemy.object);
        enemy.bar.remove();
        enemies.splice(i, 1);
      }
      continue;
    }
    // A guardian sleeps until she comes into its hall.
    if (!enemy.awake) {
      if (playerNear(enemy, 26)) wake(enemy);
      at.y = enemy.area === 'world' ? worldGround(at.x, at.z) : 0;
      continue;
    }
    if (enemy.boss && enemy.state !== 'waking') {
      bossBrain(enemy, dt, toPlayer, distance, face, step);
      at.y = enemy.area === 'world' ? worldGround(at.x, at.z) : 0;
      // A leap goes up and comes down on her.
      const leap = enemy.plan?.kind === 'leap' ? Math.min(1, enemy.plan.timer / enemy.plan.duration) : 0;
      if (leap > 0.15) at.y += Math.sin(((leap - 0.15) / 0.85) * Math.PI) * 7;
      continue;
    }
    enemy.shot -= dt;
    if (enemy.state === 'waking') {
      enemy.timer -= dt;
      face(toPlayer, 2);
      if (enemy.timer <= 0) enemy.state = 'chase';
    } else if (enemy.state === 'hit') {
      enemy.timer -= dt;
      if (enemy.timer <= 0) enemy.state = 'chase';
    } else if (enemy.state === 'attack') {
      const before = enemy.timer;
      enemy.timer += dt;
      face(toPlayer, 2);
      // The blow lands inside its window, if she is still in reach. A
      // guardian's second attack strikes all around it.
      const wide = enemy.move !== 'Attack';
      if (!enemy.struck && before < timing.hit && enemy.timer >= timing.hit) {
        enemy.struck = true;
        if (wide) {
          ring(at.clone().setY(at.y + 0.4), '#ff4b3e', 8, 0.45);
          shake = Math.max(shake, 0.3);
        }
        if (playerHere && distance < (wide ? 9 : reach + 1)) damagePlayer((8 + enemy.rank) * (enemy.elite ? 1.4 : 1));
      }
      if (enemy.timer >= Math.max(timing.end, enemy.body.length(enemy.move))) {
        enemy.state = 'chase';
        enemy.cooldown = 0.8;
      }
    } else if (playerHere && (distance < 34 || (enemy.state === 'chase' && distance < 60))) {
      enemy.state = 'chase';
      face(toPlayer, 4);
      // Shooters fire glowing orbs from afar as they come.
      if (enemy.ranged && distance > 6 && distance < 26 && enemy.shot <= 0) {
        enemy.shot = 2.4;
        enemyShot(enemy);
      }
      if (distance > reach) {
        step(toPlayer, enemy.speed);
        enemy.body.play('Move');
      } else if (enemy.cooldown <= 0) {
        enemy.state = 'attack';
        enemy.timer = 0;
        enemy.struck = false;
        // A guardian alternates its two attacks.
        const second = enemy.body.model.clips.find((clip) => clip.name.startsWith('Attack_'))?.name;
        enemy.move = enemy.boss && second && enemy.move === 'Attack' ? second : 'Attack';
        enemy.body.play(enemy.move, true, true, 0.08);
      } else {
        enemy.body.play('Idle');
      }
    } else {
      // Nothing to chase: back home, then rest.
      const toHome = new THREE.Vector3(enemy.home.x - at.x, 0, enemy.home.z - at.z);
      if (toHome.length() > 3) {
        enemy.state = 'back';
        face(toHome, 3);
        step(toHome, enemy.speed * 0.6);
        enemy.body.play('Move');
      } else {
        enemy.state = 'idle';
        enemy.body.play('Idle');
      }
    }
    at.y = enemy.area === 'world' ? worldGround(at.x, at.z) : 0;

    // Its level and health over its head, when near (a guardian's is at the top of the screen).
    if (enemy.boss) {
      enemy.bar.hidden = true;
      continue;
    }
    const top = at.clone().setY(at.y + (enemy.entry.flies ? enemy.height + 1 : enemy.height + 0.7)).project(camera);
    const seen = mode === 'foot' && top.z < 1 && Math.abs(top.x) < 1.1 && Math.abs(top.y) < 1.1 && camera.position.distanceTo(at) < 45;
    enemy.bar.hidden = !seen;
    if (seen) {
      enemy.bar.style.left = `${((top.x + 1) / 2) * 100}%`;
      enemy.bar.style.top = `${((1 - top.y) / 2) * 100}%`;
      (enemy.bar.querySelector('.fill > div') as HTMLDivElement).style.width = `${(enemy.health / enemy.most) * 100}%`;
    }
  }
}

function damagePlayer(amount: number) {
  if (player.down) return;
  player.health = Math.max(0, player.health - amount);
  player.sinceHit = 0;
  shake = Math.max(shake, 0.15);
  if (player.health <= 0) {
    player.down = true;
    player.gliding = false;
    hero.play('Defeat', true, true);
    say(place === 'world' ? 'Knocked out — press R to get up at the landing pad' : 'Knocked out — press R to get up at the dungeon entrance', 9999);
    return;
  }
  player.busy = hero.length('Hit') || 0.5;
  hero.play('Hit', true, true, 0.05);
}

// The guards of each camp and of the dungeon gates, patrols along the
// paths, a flier, and a world boss in the far hills.
const CAMP_GUARDS: readonly ModelEntry[][] = [[spineback, twinfang], [stinglash, spineback, spineback], [twinfang, gorgemaw], [golem, spineback], [stinglash, twinfang, twinfang]];
for (const [k, camp] of features.camps.entries()) {
  const guards = CAMP_GUARDS[k % CAMP_GUARDS.length];
  guards.forEach((entry, n) => {
    const a = camp.yaw + (n / guards.length) * Math.PI * 2;
    spawn(entry, camp.x + Math.sin(a) * 8, camp.z + Math.cos(a) * 8, { camp: k });
  });
}
for (const [k, gate] of features.gates.entries()) {
  const out = (d: number, side: number): [number, number] => [gate.x + Math.sin(gate.yaw) * d + Math.cos(gate.yaw) * side, gate.z + Math.cos(gate.yaw) * d - Math.sin(gate.yaw) * side];
  if (k === 0) { spawn(golem, ...out(24, 6)); }
  if (k === 1) { spawn(gorgemaw, ...out(22, 6)); }
  if (k === 2) { spawn(rover, ...out(22, 6)); spawn(drone, ...out(26, -6)); }
}
const PATROLS: readonly ModelEntry[][] = [[spineback, twinfang], [stinglash, spineback], [twinfang, twinfang], [spineback, stinglash], [golem], [gorgemaw, spineback]];
world.paths.lines.slice(1).forEach((line, k) => {
  if (k >= PATROLS.length * 2 || k % 2 === 1) return;
  const [x, z] = line[Math.floor(line.length * 0.55)];
  if (Math.hypot(x, z) < 160) return;
  PATROLS[(k / 2) % PATROLS.length].forEach((entry, n) => spawn(entry, x + (n - 0.5) * 7, z + 5));
});
if (features.beacons[0]) spawn(skyray, features.beacons[0].x * 0.6, features.beacons[0].z * 0.6);
const worldBossName = 'Ashwing';
const nestSpot = features.nest ?? features.beacons[0];
const worldBossAt = nestSpot ? { x: nestSpot.x, z: nestSpot.z } : (() => {
  const far = features.camps.reduce((best, camp) => (Math.hypot(camp.x, camp.z) > Math.hypot(best.x, best.z) ? camp : best), features.camps[0]);
  const reach = Math.hypot(far.x, far.z);
  return { x: (far.x / reach) * (reach + 110), z: (far.z / reach) * (reach + 110) };
})();
const worldBoss = spawn(ashwing, worldBossAt.x, worldBossAt.z, { boss: true, name: `${worldBossName} · the dragon` });
// No patrol or guard wanders into its lair: the fight is one on one.
for (let i = enemies.length - 1; i >= 0; i--) {
  const enemy = enemies[i];
  if (enemy === worldBoss || enemy.area !== 'world' || enemy.camp >= 0) continue;
  if (Math.hypot(enemy.home.x - worldBossAt.x, enemy.home.z - worldBossAt.z) > 50) continue;
  enemy.object.parent?.remove(enemy.object);
  enemy.bar.remove();
  enemies.splice(i, 1);
}

// --- Guardians: attacks shown on the ground before they land ---------------------------------

type Strike = 'cone' | 'ring' | 'rain' | 'charge' | 'leap' | 'rock';
interface Telegraph { group: THREE.Group; reach: { value: number }; radius: number }
interface BossPlan {
  kind: Strike;
  timer: number;
  /** When the mark is full, and when the blow lands: later, if it feints. */
  fill: number;
  duration: number;
  telegraphs: Telegraph[];
  targets: THREE.Vector3[];
  yaw: number;
  /** Where it started, for a leap; a thrown rock in the air. */
  from: THREE.Vector3;
  prop: THREE.Object3D | null;
}
/** Her speed, to throw rocks where she is going to be. */
const herVelocity = new THREE.Vector3();
const herBefore = new THREE.Vector3();
const CHARGE = { length: 24, width: 3.4 };
const LEAP_RADIUS = 6;
const ROCK_RADIUS = 3.2;
const rockLook = new THREE.MeshToonMaterial({ color: '#6b5a52' });

const CONE = { radius: 15, half: (32 * Math.PI) / 180 };
const RING_RADIUS = 10;
const RAIN_RADIUS = 3.8;
const warning = $<HTMLDivElement>('warning');
function warn(text: string) {
  warning.textContent = text;
  warning.hidden = text === '';
}

/**
 * A red mark on the ground where a blow will land, filling up from its
 * origin until it does. It lies on the slope. A circle or a cone of this
 * radius, or a strip this long and `width` wide, all pointing along `yaw`.
 */
function telegraph(kind: 'circle' | 'cone' | 'strip', at: THREE.Vector3, radius: number, yaw = 0, width = 0): Telegraph {
  const base = place === 'world' ? worldGround(at.x, at.z) : 0;
  const lift = (x: number, z: number) => (place === 'world' ? worldGround(at.x + x, at.z + z) - base + 0.3 : 0.06);
  const positions: number[] = [];
  const outline: number[] = [];
  const index: number[] = [];
  if (kind === 'strip') {
    const rows = 16;
    const cols = 4;
    const ahead = { x: Math.sin(yaw), z: Math.cos(yaw) };
    const side = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    const point = (d: number, w: number) => {
      const x = ahead.x * d + side.x * w;
      const z = ahead.z * d + side.z * w;
      return [x, lift(x, z), z];
    };
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) positions.push(...point((radius * r) / rows, width * (c / cols - 0.5)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = r * (cols + 1) + c;
        index.push(v, v + cols + 1, v + 1, v + 1, v + cols + 1, v + cols + 2);
      }
    }
    for (const [d, w] of [[0, -0.5], [1, -0.5], [1, 0.5], [0, 0.5], [0, -0.5]]) outline.push(...point(radius * d, width * w));
  } else {
    const rings = 10;
    const spokes = kind === 'circle' ? 48 : 20;
    const from = kind === 'circle' ? 0 : yaw - CONE.half;
    const span = kind === 'circle' ? Math.PI * 2 : 2 * CONE.half;
    positions.push(0, lift(0, 0), 0);
    if (kind === 'cone') outline.push(0, lift(0, 0), 0);
    for (let r = 1; r <= rings; r++) {
      const d = (radius * r) / rings;
      for (let k = 0; k <= spokes; k++) {
        const a = from + (span * k) / spokes;
        const x = Math.sin(a) * d;
        const z = Math.cos(a) * d;
        positions.push(x, lift(x, z), z);
        if (r === rings) outline.push(x, lift(x, z), z);
      }
    }
    if (kind === 'cone') outline.push(0, lift(0, 0), 0);
    const row = spokes + 1;
    const vertex = (r: number, k: number) => 1 + (r - 1) * row + k;
    for (let k = 0; k < spokes; k++) index.push(0, vertex(1, k), vertex(1, k + 1));
    for (let r = 1; r < rings; r++) {
      for (let k = 0; k < spokes; k++) index.push(vertex(r, k), vertex(r + 1, k), vertex(r, k + 1), vertex(r, k + 1), vertex(r + 1, k), vertex(r + 1, k + 1));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  const look = (opacity: number) => new THREE.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 });
  const area = new THREE.Mesh(geometry, look(0.3));
  // The fill grows outward: whatever lies past its reach is not drawn.
  const reach = { value: 0 };
  const filling = look(0.6);
  filling.onBeforeCompile = (shader) => {
    shader.uniforms.reach = reach;
    shader.vertexShader = `varying float vFrom;\n${shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFrom = length(position.xz);')}`;
    shader.fragmentShader = `uniform float reach;\nvarying float vFrom;\n${shader.fragmentShader.replace('void main() {', 'void main() {\nif (vFrom > reach) discard;')}`;
  };
  const fill = new THREE.Mesh(geometry, filling);
  const edgeLine = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(outline, 3)), new THREE.LineBasicMaterial({ color: '#ffd0c8' }));
  const group = new THREE.Group();
  group.add(area, fill, edgeLine);
  for (const child of group.children) child.renderOrder = 5;
  group.position.set(at.x, base, at.z);
  activeScene().add(group);
  return { group, reach, radius };
}

/** Takes a mark off the ground and frees what it used. */
function clearMark(mark: Telegraph) {
  mark.group.parent?.remove(mark.group);
  mark.group.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  });
}

function dropPlan(enemy: Enemy) {
  for (const mark of enemy.plan?.telegraphs ?? []) clearMark(mark);
  enemy.plan = null;
}

const nameOf = (enemy: Enemy) => (enemy.bar.firstElementChild?.textContent ?? enemy.entry.name).split(',')[0].split(' ·')[0];

/** A guardian's fight: it closes in, then marks the ground and strikes; at half health it is enraged and calls help. */
function bossBrain(enemy: Enemy, dt: number, toPlayer: THREE.Vector3, distance: number, face: (direction: THREE.Vector3, rate: number) => void, step: (direction: THREE.Vector3, speed: number) => void) {
  const at = enemy.object.position;
  enemy.next -= dt;
  if (!enemy.enraged && enemy.health < enemy.most * 0.5) {
    enemy.enraged = true;
    shake = Math.max(shake, 0.6);
    flash(enemy.centre(), '#ff2f6d', 5, 0.6);
    say(`${nameOf(enemy)} is enraged — and calls for help!`, 3);
    for (const side of [1, -1]) {
      const a = enemy.object.rotation.y + side * 1.2;
      spawn(side > 0 ? spineback : twinfang, at.x + Math.sin(a) * 6, at.z + Math.cos(a) * 6, { area: enemy.area, hall: enemy.hall });
    }
  }
  const plan = enemy.plan;
  if (plan) {
    plan.timer += dt;
    const progress = Math.min(1, plan.timer / plan.fill);
    for (const mark of plan.telegraphs) mark.reach.value = mark.radius * Math.max(0.04, progress);
    // A leap carries it through the air onto her mark; a rock flies at hers.
    const flight = Math.min(1, plan.timer / plan.duration);
    if (plan.kind === 'leap') at.lerpVectors(plan.from, plan.targets[0], THREE.MathUtils.smoothstep(flight, 0.15, 1));
    if (plan.prop) {
      plan.prop.position.lerpVectors(plan.from, plan.targets[0], flight);
      plan.prop.position.y = (place === 'world' ? worldGround(plan.prop.position.x, plan.prop.position.z) : 0) + 2 + Math.sin(flight * Math.PI) * 9;
      plan.prop.rotation.x += dt * 6;
    }
    if (plan.timer >= plan.duration) {
      strike(enemy, plan);
      plan.prop?.parent?.remove(plan.prop);
      for (const mark of plan.telegraphs) clearMark(mark);
      enemy.plan = null;
      enemy.next = enemy.enraged ? 1.0 : 1.9;
      warn('');
    }
    return;
  }
  // If she runs off or falls, it goes back to its lair and recovers.
  const fromHome = new THREE.Vector3(player.position.x - enemy.home.x, 0, player.position.z - enemy.home.z).length();
  if (fromHome > 60 || mode !== 'foot' || player.down) {
    const toHome = new THREE.Vector3(enemy.home.x - at.x, 0, enemy.home.z - at.z);
    if (toHome.length() > 1.5) {
      face(toHome, 3);
      step(toHome, enemy.speed * 1.4);
      enemy.body.play('Move');
    } else {
      enemy.body.play('Idle');
      enemy.health = enemy.most;
      enemy.enraged = false;
      enemy.attacks = 0;
    }
    return;
  }
  face(toPlayer, 3);
  if (distance > 7) {
    step(toPlayer, enemy.speed * (enemy.enraged ? 1.3 : 1));
    enemy.body.play('Move');
  } else enemy.body.play('Idle');
  if (enemy.next > 0 || !playerNear(enemy, 45)) return;

  // The next attack, in turn, from those that reach her: close by it stamps
  // and breathes; from afar it charges, leaps, throws rocks or calls stars.
  // Like the golem of Meta Space, every one is marked on the ground first.
  const near: Strike[] = ['ring', 'cone', 'charge', 'ring', 'leap', 'cone'];
  const far: Strike[] = ['charge', 'rock', 'leap', 'rain', 'rock', 'charge'];
  const order = distance > 9 ? far : near;
  const kind = order[enemy.attacks++ % order.length];
  const second = enemy.body.model.clips.find((clip) => clip.name.startsWith('Attack_'))?.name ?? 'Attack';
  const clip = kind === 'ring' || kind === 'leap' ? 'Attack' : second;
  const timing = enemy.body.model.attacks[clip];
  const fill = Math.max(1.1, timing?.hit ?? 1.2) * (enemy.enraged ? 0.85 : 1);
  // Now and then a stamp or a leap hangs a beat longer: whoever dodges too soon is caught.
  const feint = (kind === 'ring' || kind === 'leap') && Math.random() < 0.35 ? 0.45 : 0;
  const duration = fill + feint;
  enemy.body.play(clip, true, true, 0.08);
  const yaw = Math.atan2(toPlayer.x, toPlayer.z);
  enemy.object.rotation.y = yaw;
  const name = nameOf(enemy);
  const targets: THREE.Vector3[] = [];
  const telegraphs: Telegraph[] = [];
  if (kind === 'cone') {
    telegraphs.push(telegraph('cone', at, CONE.radius, yaw));
    warn(`⚠ ${name}: fire breath! Get out of the cone`);
  } else if (kind === 'ring') {
    telegraphs.push(telegraph('circle', at, RING_RADIUS));
    warn(`⚠ ${name}: shockwave! Get away from it`);
  } else if (kind === 'charge') {
    telegraphs.push(telegraph('strip', at, CHARGE.length, yaw, CHARGE.width));
    warn(`⚠ ${name}: it charges! Get off the strip`);
  } else if (kind === 'leap') {
    const spot = player.position.clone();
    targets.push(spot);
    telegraphs.push(telegraph('circle', spot, LEAP_RADIUS));
    warn(`⚠ ${name}: it leaps at you! Run`);
  } else if (kind === 'rock') {
    // Where she will be when it lands.
    const spot = player.position.clone().addScaledVector(herVelocity.clone().setY(0), duration * 0.8);
    targets.push(spot);
    telegraphs.push(telegraph('circle', spot, ROCK_RADIUS));
    warn(`⚠ ${name}: it throws a rock! Move`);
  } else {
    const count = enemy.enraged ? 6 : 4;
    for (let k = 0; k < count; k++) {
      const spot = player.position.clone().add(k === 0 ? new THREE.Vector3() : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(14));
      targets.push(spot);
      telegraphs.push(telegraph('circle', spot, RAIN_RADIUS));
    }
    warn(`⚠ ${name}: falling stars! Keep moving`);
  }
  let prop: THREE.Object3D | null = null;
  if (kind === 'rock') {
    prop = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 0), rockLook);
    prop.position.copy(at).setY(at.y + 3);
    activeScene().add(prop);
  }
  enemy.plan = { kind, timer: 0, fill, duration, telegraphs, targets, yaw, from: at.clone(), prop };
}

/** The blow lands: whoever is still in the red is hurt. */
function strike(enemy: Enemy, plan: BossPlan) {
  const at = enemy.object.position;
  const toHer = player.position.clone().sub(at).setY(0);
  const hit = (damage: number) => { if (mode === 'foot' && !player.down) damagePlayer(damage * (enemy.enraged ? 1.25 : 1)); };
  shake = Math.max(shake, 0.4);
  if (plan.kind === 'cone') {
    for (let k = 0; k < 9; k++) {
      const a = plan.yaw + (Math.random() - 0.5) * CONE.half * 1.6;
      const d = 3 + Math.random() * (CONE.radius - 4);
      flash(at.clone().add(new THREE.Vector3(Math.sin(a) * d, 1 + Math.random(), Math.cos(a) * d)), k % 2 ? '#ff7a2a' : '#ffd23f', 2 + Math.random() * 2, 0.5);
    }
    const angle = Math.abs(Math.atan2(Math.sin(Math.atan2(toHer.x, toHer.z) - plan.yaw), Math.cos(Math.atan2(toHer.x, toHer.z) - plan.yaw)));
    if (toHer.length() < CONE.radius && angle < CONE.half) {
      hit(24);
      knockBack(at, 6);
    }
  } else if (plan.kind === 'ring') {
    ring(at.clone().setY(at.y + 0.4), '#ff4b3e', RING_RADIUS, 0.45);
    ring(at.clone().setY(at.y + 1.2), '#ff9a3d', RING_RADIUS * 0.7, 0.55);
    flash(at.clone().setY(at.y + 1), '#ff4b3e', 4, 0.4);
    if (toHer.length() < RING_RADIUS) {
      hit(22);
      knockBack(at, 16, 5);
    }
  } else if (plan.kind === 'charge') {
    // It rushes down the strip, as far as the ground lets it.
    const ahead = new THREE.Vector3(Math.sin(plan.yaw), 0, Math.cos(plan.yaw));
    const start = at.clone();
    const sideOf = (point: THREE.Vector3) => {
      const rel = point.clone().sub(start).setY(0);
      return { along: rel.dot(ahead), across: Math.abs(rel.x * ahead.z - rel.z * ahead.x) };
    };
    const herLine = sideOf(player.position);
    for (let d = 1; d <= CHARGE.length; d += 1) {
      const next = start.clone().addScaledVector(ahead, d);
      const free = enemy.area === 'world' ? worldGround(next.x, next.z) > level + 0.5 : dungeonOf(enemy.area).dungeon.walkable(next.x, next.z);
      if (!free) break;
      at.copy(next);
      if (d % 4 === 0) flash(next.clone().setY(next.y + 1), '#ff9a3d', 2.2, 0.35);
    }
    if (herLine.along > -1 && herLine.along < CHARGE.length + 1 && herLine.across < CHARGE.width / 2 + 0.6) {
      hit(30);
      knockBack(start, 18, 4);
    }
  } else if (plan.kind === 'leap') {
    const spot = plan.targets[0];
    ring(at.clone().setY(at.y + 0.4), '#ff4b3e', LEAP_RADIUS, 0.45);
    flash(at.clone().setY(at.y + 1), '#ff9a3d', 4.5, 0.45);
    shake = Math.max(shake, 0.7);
    if (player.position.distanceTo(spot.clone().setY(player.position.y)) < LEAP_RADIUS) {
      hit(28);
      knockBack(spot, 16, 6);
    }
  } else if (plan.kind === 'rock') {
    const spot = plan.targets[0];
    const ground0 = place === 'world' ? worldGround(spot.x, spot.z) : 0;
    flash(spot.clone().setY(ground0 + 1), '#c9a27a', 3.4, 0.45);
    ring(spot.clone().setY(ground0 + 0.3), '#ff9a3d', ROCK_RADIUS, 0.4);
    if (player.position.distanceTo(spot.clone().setY(player.position.y)) < ROCK_RADIUS) {
      hit(26);
      knockBack(spot, 12, 3);
    }
  } else {
    // Overlapping stars hurt once, not once each.
    let caught = false;
    for (const spot of plan.targets) {
      const ground0 = place === 'world' ? worldGround(spot.x, spot.z) : 0;
      flash(spot.clone().setY(ground0 + 1), '#ffd23f', 3.2, 0.45);
      ring(spot.clone().setY(ground0 + 0.3), '#ff8fc4', RAIN_RADIUS, 0.4);
      if (player.position.distanceTo(spot.clone().setY(player.position.y)) < RAIN_RADIUS) caught = true;
    }
    if (caught) {
      hit(20);
      knockBack(plan.targets[0], 7, 3);
    }
  }
}

// --- Ashwing: the dragon that raids the valley from its nest --------------------------------
//
// Its fight follows the flying boss of the team's earlier game, Meta Space,
// rewritten here: it circles above her and attacks from the air, every blow
// marked on the ground first: a string of bombs as it passes over, fire
// poured from above in a cone, a dive along a strip. Every few minutes it
// leaves its nest to raid her; in the air it can only be driven off. At its
// nest it fights to the end, and lands now and then, which is when it is
// hurt the most.

type Flight = 'nest' | 'wake' | 'rise' | 'circle' | 'bombs' | 'breath' | 'dive' | 'landing' | 'landed' | 'home';
const DRAGON = {
  firstRaid: 75,
  raidEvery: [120, 170],
  orbit: 24,
  altitude: 16,
  speed: 22,
  rest: 1.9,
  attacksPerRaid: 4,
  /** Damage that drives it off in a raid. */
  scare: 320,
  /** She wakes it in its nest from this close. */
  nestReach: 75,
  /** In the air at its nest it takes this share of the damage; landed, all of it. */
  airDamage: 0.35,
  bombs: { count: 7, rage: 11, radius: 3, fall: 0.95, damage: 22, pass: 2.6 },
  breath: { length: 15, damage: 9, tick: 0.3, warn: 0.9, pour: 1.2 },
  dive: { width: 5.5, length: 46, speed: 38, warn: 0.85, damage: 32 },
  landing: { radius: 6.5, damage: 26, stay: 5.5, attacks: 5 },
};
interface Bomb { mesh: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; t: number; mark: Telegraph }
const raid = {
  state: 'nest' as Flight,
  timer: 0,
  next: DRAGON.firstRaid,
  alt: 0,
  angle: 0,
  attacks: 0,
  sinceLanding: 0,
  attacksSinceLanding: 0,
  scare: 0,
  /** Fighting at its nest, to the end, rather than raiding. */
  home: false,
  heading: new THREE.Vector3(0, 0, 1),
  start: new THREE.Vector3(),
  target: new THREE.Vector3(),
  dropped: 0,
  struck: false,
  tick: 0,
  marks: [] as Telegraph[],
  bombs: [] as Bomb[],
};
const dragonShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }));
dragonShadow.renderOrder = 4;
scene.add(dragonShadow);
const bombLook = new THREE.MeshBasicMaterial({ color: '#ffb347' });
const bombGlow = new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });

function begin(state: Flight) {
  raid.state = state;
  raid.timer = 0;
  raid.struck = false;
  raid.dropped = 0;
  raid.tick = 0;
}

function dragonClear() {
  for (const mark of raid.marks) clearMark(mark);
  raid.marks.length = 0;
  for (const bomb of raid.bombs) {
    bomb.mesh.parent?.remove(bomb.mesh);
    clearMark(bomb.mark);
  }
  raid.bombs.length = 0;
}

/** How much of a blow it takes: in a raid none (it is only driven off), in the air at its nest a share. */
function dragonTakes(damage: number): number {
  if (raid.state === 'nest') {
    raid.home = true;
    worldBoss.awake = true;
    begin('wake');
    worldBoss.body.play('Wake', true, true, 0.1);
    say(`${worldBossName} wakes in its nest!`, 3);
  }
  if (!raid.home) {
    raid.scare += damage;
    return 0;
  }
  const taken = raid.state === 'landed' || raid.state === 'landing' || raid.state === 'wake' ? damage : damage * DRAGON.airDamage;
  raid.sinceLanding += taken;
  return taken;
}

function dragonBrain(enemy: Enemy, dt: number) {
  const at = enemy.object.position;
  const her = player.position;
  const free = mode === 'foot' && !player.down && place === 'world';
  const rage = enemy.enraged ? 1.25 : 1;
  const nest = new THREE.Vector3(worldBossAt.x, 0, worldBossAt.z);
  const fromNest = Math.hypot(her.x - nest.x, her.z - nest.z);
  const toHer = new THREE.Vector3(her.x - at.x, 0, her.z - at.z);
  raid.timer += dt;
  enemy.object.visible = true;
  enemy.body.mixer.update(dt);
  enemy.cooldown = Math.max(0, enemy.cooldown - dt);

  const face = (direction: THREE.Vector3Like, rate = 3) => {
    if (direction.x * direction.x + direction.z * direction.z < 1e-4) return;
    let turn = Math.atan2(direction.x, direction.z) - enemy.object.rotation.y;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    enemy.object.rotation.y += THREE.MathUtils.clamp(turn, -rate * dt, rate * dt);
  };
  const flyTo = (x: number, z: number, altitude: number, speed: number) => {
    const way = new THREE.Vector3(x - at.x, 0, z - at.z);
    const length = way.length();
    if (length > 0.01) at.addScaledVector(way.normalize(), Math.min(length, speed * dt));
    raid.alt += THREE.MathUtils.clamp(altitude - raid.alt, -14 * dt, 14 * dt);
    face(way, 4);
    enemy.body.play('Move');
    return length;
  };
  const groundHere = worldGround(at.x, at.z);

  // The fight at its nest is called off if she leaves or falls: it heals and settles.
  if (raid.home && raid.state !== 'nest' && raid.state !== 'home' && (!free || fromNest > 160)) {
    dragonClear();
    warn('');
    begin('home');
  }
  // A raid ends when she is out of reach.
  if (!raid.home && !free && raid.state !== 'nest' && raid.state !== 'home') {
    dragonClear();
    warn('');
    begin('home');
  }
  // Below half health it is enraged.
  if (raid.home && !enemy.enraged && enemy.health < enemy.most * 0.5) {
    enemy.enraged = true;
    shake = Math.max(shake, 0.6);
    say(`${worldBossName} is enraged!`, 3);
  }

  switch (raid.state) {
    case 'nest': {
      at.set(nest.x, worldGround(nest.x, nest.z) + 1.2, nest.z);
      raid.alt = 0;
      enemy.object.rotation.y = nestSpot?.yaw ?? 0;
      enemy.body.play('Idle');
      enemy.awake = false;
      if (!free) break;
      if (fromNest < DRAGON.nestReach) {
        raid.home = true;
        enemy.awake = true;
        begin('wake');
        enemy.body.play('Wake', true, true, 0.1);
        shake = Math.max(shake, 0.5);
        say(`${worldBossName} wakes in its nest! Beat it here, and it will never raid again.`, 4);
        break;
      }
      raid.next -= dt;
      if (raid.next <= 0) {
        raid.home = false;
        raid.attacks = 0;
        raid.scare = 0;
        enemy.awake = true;
        begin('rise');
        warn(`⚠ ${worldBossName} has left its nest: it is coming for you!`);
        setTimeout(() => { if (warning.textContent?.includes('left its nest')) warn(''); }, 4000);
      }
      break;
    }
    case 'wake':
      face(toHer, 2);
      if (raid.timer > 2.2) begin('rise');
      break;
    case 'rise':
      raid.alt = Math.min(DRAGON.altitude + 8, raid.alt + 9 * dt);
      enemy.body.play('Move');
      face(toHer, 2);
      if (raid.alt >= DRAGON.altitude + 8) begin('circle');
      break;
    case 'circle': {
      // Still far off: it flies to her fast, and does not attack yet.
      if (toHer.length() > DRAGON.orbit + 14) {
        raid.angle = Math.atan2(at.z - her.z, at.x - her.x);
        flyTo(her.x + Math.cos(raid.angle) * DRAGON.orbit, her.z + Math.sin(raid.angle) * DRAGON.orbit, DRAGON.altitude + 6, 50);
        raid.timer = 0;
        break;
      }
      raid.angle += ((DRAGON.speed * rage) / DRAGON.orbit) * dt;
      flyTo(her.x + Math.cos(raid.angle) * DRAGON.orbit, her.z + Math.sin(raid.angle) * DRAGON.orbit, DRAGON.altitude, DRAGON.speed * rage * 1.3);
      face(toHer, 2);
      if (!raid.home && (raid.attacks >= DRAGON.attacksPerRaid || raid.scare >= DRAGON.scare)) {
        say(raid.scare >= DRAGON.scare ? `${worldBossName} is driven off! It flies back to its nest… for now.` : `${worldBossName} flies back to its nest. It will be back.`, 4);
        begin('home');
        break;
      }
      if (raid.home && (raid.sinceLanding >= enemy.most * 0.25 || raid.attacksSinceLanding >= DRAGON.landing.attacks)) {
        raid.target.set(her.x, 0, her.z);
        raid.marks.push(telegraph('circle', raid.target, DRAGON.landing.radius));
        warn(`⚠ ${worldBossName} is landing: get out of the circle!`);
        begin('landing');
        break;
      }
      if (raid.timer > DRAGON.rest / rage) startDragonAttack(enemy);
      break;
    }
    case 'bombs': {
      // A straight pass over her, dropping bombs where they will land.
      const speed = DRAGON.speed * 1.25 * rage;
      at.addScaledVector(raid.heading, speed * dt);
      raid.alt += THREE.MathUtils.clamp(DRAGON.altitude * 0.8 - raid.alt, -10 * dt, 10 * dt);
      face(raid.heading, 5);
      enemy.body.play('Move');
      const count = enemy.enraged ? DRAGON.bombs.rage : DRAGON.bombs.count;
      const every = (DRAGON.bombs.pass - 0.5) / count;
      while (raid.dropped < count && raid.timer > 0.25 + raid.dropped * every) {
        raid.dropped++;
        const drift = speed * DRAGON.bombs.fall * 0.6;
        const to = at.clone().addScaledVector(raid.heading, drift).add(new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5));
        to.y = worldGround(to.x, to.z);
        const mesh = new THREE.Group();
        mesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), bombLook), new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), bombGlow));
        mesh.position.copy(at);
        scene.add(mesh);
        raid.bombs.push({ mesh, from: at.clone().setY(at.y - 1), to, t: 0, mark: telegraph('circle', to, DRAGON.bombs.radius) });
      }
      if (raid.timer > DRAGON.bombs.pass) endDragonAttack();
      break;
    }
    case 'breath': {
      // It hovers low behind her, then pours fire down in a cone.
      if (raid.marks.length === 0) {
        const back = toHer.lengthSq() > 1 ? toHer.clone().normalize() : new THREE.Vector3(0, 0, 1);
        const close = flyTo(her.x - back.x * 7, her.z - back.z * 7, 9, DRAGON.speed * rage);
        if (close < 2 || raid.timer > 2.5) {
          raid.heading.copy(toHer.lengthSq() > 1 ? toHer.normalize() : back);
          raid.start.set(at.x, 0, at.z);
          raid.marks.push(telegraph('cone', raid.start, DRAGON.breath.length, Math.atan2(raid.heading.x, raid.heading.z)));
          enemy.body.play('Attack', true, true, 0.1);
          raid.timer = 0;
        }
        break;
      }
      face(raid.heading, 4);
      raid.alt += THREE.MathUtils.clamp(9 - raid.alt, -6 * dt, 6 * dt);
      const warnFor = DRAGON.breath.warn / rage;
      if (raid.timer < warnFor) {
        for (const mark of raid.marks) mark.reach.value = mark.radius * Math.max(0.04, raid.timer / warnFor);
        break;
      }
      for (const mark of raid.marks) mark.reach.value = mark.radius;
      raid.tick -= dt;
      if (raid.tick <= 0) {
        raid.tick = DRAGON.breath.tick;
        const mouth = enemy.object.getObjectByName('breath')?.getWorldPosition(new THREE.Vector3()) ?? at.clone();
        for (let k = 0; k < 4; k++) {
          const a = Math.atan2(raid.heading.x, raid.heading.z) + (Math.random() - 0.5) * CONE.half * 1.6;
          const d = 2 + Math.random() * (DRAGON.breath.length - 3);
          const spot = raid.start.clone().add(new THREE.Vector3(Math.sin(a) * d, 0, Math.cos(a) * d));
          spot.y = worldGround(spot.x, spot.z) + 1;
          flash(mouth.clone().lerp(spot, 0.5 + Math.random() * 0.5), k % 2 ? '#ff7a2a' : '#ffd23f', 2.4 + Math.random() * 1.6, 0.4);
        }
        const toHerNow = new THREE.Vector3(her.x - raid.start.x, 0, her.z - raid.start.z);
        const angle = Math.abs(Math.atan2(Math.sin(Math.atan2(toHerNow.x, toHerNow.z) - Math.atan2(raid.heading.x, raid.heading.z)), Math.cos(Math.atan2(toHerNow.x, toHerNow.z) - Math.atan2(raid.heading.x, raid.heading.z))));
        if (free && toHerNow.length() < DRAGON.breath.length && angle < CONE.half) damagePlayer(DRAGON.breath.damage * rage);
      }
      if (raid.timer > warnFor + DRAGON.breath.pour) endDragonAttack();
      break;
    }
    case 'dive': {
      const warnFor = DRAGON.dive.warn / rage;
      if (raid.timer < warnFor) {
        // Up high, it marks the strip it will dive along.
        raid.alt += THREE.MathUtils.clamp(DRAGON.altitude + 6 - raid.alt, -10 * dt, 10 * dt);
        face(raid.heading, 5);
        enemy.body.play('Move');
        for (const mark of raid.marks) mark.reach.value = mark.radius * Math.max(0.04, raid.timer / warnFor);
        break;
      }
      at.addScaledVector(raid.heading, DRAGON.dive.speed * rage * dt);
      raid.alt += THREE.MathUtils.clamp(2.5 - raid.alt, -40 * dt, 40 * dt);
      const along = new THREE.Vector3(at.x - raid.start.x, 0, at.z - raid.start.z).length();
      if (!raid.struck && free && Math.hypot(her.x - at.x, her.z - at.z) < 4 && Math.abs(her.y - (groundHere + raid.alt)) < 6) {
        raid.struck = true;
        damagePlayer(DRAGON.dive.damage * rage);
        knockBack(at, 18, 6);
        shake = Math.max(shake, 0.5);
      }
      if (along > DRAGON.dive.length) endDragonAttack();
      break;
    }
    case 'landing': {
      const landFor = 1.4;
      const left = flyTo(raid.target.x, raid.target.z, Math.max(0, DRAGON.altitude * (1 - raid.timer / landFor)), DRAGON.speed);
      for (const mark of raid.marks) mark.reach.value = mark.radius * Math.max(0.04, raid.timer / landFor);
      if (raid.timer > landFor - 0.9 && enemy.body.current !== 'Attack_slam') enemy.body.play('Attack_slam', true, true, 0.1);
      if (raid.timer >= landFor && left < 3) {
        at.set(raid.target.x, at.y, raid.target.z);
        raid.alt = 0;
        dragonClear();
        warn('');
        shake = Math.max(shake, 0.7);
        ring(at.clone().setY(groundHere + 0.4), '#ffd0a0', DRAGON.landing.radius, 0.5);
        flash(at.clone().setY(groundHere + 1), '#ff9a3d', 5, 0.5);
        if (free && Math.hypot(her.x - at.x, her.z - at.z) < DRAGON.landing.radius) {
          damagePlayer(DRAGON.landing.damage * rage);
          knockBack(at, 16, 6);
        }
        say(`${worldBossName} has landed: hit it now, it is open!`, 3);
        raid.sinceLanding = 0;
        raid.attacksSinceLanding = 0;
        begin('landed');
      }
      break;
    }
    case 'landed':
      raid.alt = 0;
      face(toHer, 1.5);
      if (enemy.body.current !== 'Attack_slam' || raid.timer > 1.2) enemy.body.play('Idle');
      // Too close, and its claws get her.
      if (free && toHer.length() < enemy.radius * 0.6 && enemy.cooldown <= 0) {
        enemy.cooldown = 1;
        damagePlayer(10);
        knockBack(at, 10);
      }
      if (raid.timer >= DRAGON.landing.stay) {
        say(`${worldBossName} takes off again!`, 2);
        begin('rise');
      }
      break;
    case 'home': {
      const left = flyTo(nest.x, nest.z, Math.hypot(at.x - nest.x, at.z - nest.z) > 6 ? 30 : 0, DRAGON.speed * 1.2);
      if (left < 3) {
        raid.alt = Math.max(0, raid.alt - 10 * dt);
        if (raid.alt <= 0.05) {
          // Back in its nest. A fight called off heals it; the next raid comes later.
          if (raid.home) {
            enemy.health = enemy.most;
            enemy.enraged = false;
          }
          raid.home = false;
          raid.next = DRAGON.raidEvery[0] + Math.random() * (DRAGON.raidEvery[1] - DRAGON.raidEvery[0]);
          begin('nest');
        }
      }
      break;
    }
  }
  if (raid.state !== 'nest') at.y = worldGround(at.x, at.z) + raid.alt;
  dragonShadow.visible = raid.alt > 1.5;
  dragonShadow.position.set(at.x, worldGround(at.x, at.z) + 0.15, at.z);
  dragonShadow.scale.setScalar(3 + raid.alt * 0.08);
  updateBombs(dt);
}

function startDragonAttack(enemy: Enemy) {
  const her = player.position;
  const at = enemy.object.position;
  const order: Flight[] = ['bombs', 'breath', 'dive'];
  const kind = order[raid.attacks % order.length];
  raid.attacks++;
  raid.attacksSinceLanding++;
  raid.heading.set(her.x - at.x, 0, her.z - at.z);
  if (raid.heading.lengthSq() < 1) raid.heading.set(0, 0, 1);
  raid.heading.normalize();
  if (kind === 'bombs') warn(`⚠ ${worldBossName}: bombs! Get out of the circles`);
  if (kind === 'breath') warn(`⚠ ${worldBossName}: fire from above! Get out of the cone`);
  if (kind === 'dive') {
    raid.start.set(at.x, 0, at.z);
    raid.marks.push(telegraph('strip', raid.start, DRAGON.dive.length, Math.atan2(raid.heading.x, raid.heading.z), DRAGON.dive.width));
    warn(`⚠ ${worldBossName}: it dives! Get off the strip`);
  }
  begin(kind);
}

function endDragonAttack() {
  for (const mark of raid.marks) clearMark(mark);
  raid.marks.length = 0;
  warn('');
  begin('circle');
}

/** Its bombs fall where their circles are, and burst. */
function updateBombs(dt: number) {
  for (let i = raid.bombs.length - 1; i >= 0; i--) {
    const bomb = raid.bombs[i];
    bomb.t += dt;
    const k = Math.min(1, bomb.t / DRAGON.bombs.fall);
    bomb.mesh.position.copy(bomb.from).lerp(bomb.to, k);
    bomb.mesh.position.y = bomb.from.y + (bomb.to.y - bomb.from.y) * k * k;
    bomb.mark.reach.value = bomb.mark.radius * Math.max(0.04, k);
    if (k >= 1) {
      flash(bomb.to.clone().setY(bomb.to.y + 1), '#ffb347', 3.2, 0.4);
      ring(bomb.to.clone().setY(bomb.to.y + 0.3), '#ff8a3a', DRAGON.bombs.radius, 0.35);
      const her = player.position;
      if (mode === 'foot' && !player.down && place === 'world' && Math.hypot(her.x - bomb.to.x, her.z - bomb.to.z) < DRAGON.bombs.radius && Math.abs(her.y - bomb.to.y) < 4) {
        damagePlayer(DRAGON.bombs.damage * (worldBoss.enraged ? 1.15 : 1));
        knockBack(bomb.to, 7, 3);
      }
      bomb.mesh.parent?.remove(bomb.mesh);
      clearMark(bomb.mark);
      raid.bombs.splice(i, 1);
    }
  }
}

// --- Enemy orbs -----------------------------------------------------------------------------

interface Orb { mesh: THREE.Group; velocity: THREE.Vector3; left: number }
const orbs: Orb[] = [];
/** A glowing orb fired at her, slow enough to dodge. */
function enemyShot(enemy: Enemy) {
  const from = enemy.centre();
  const target = player.position.clone().setY(player.position.y + 1);
  const mesh = new THREE.Group();
  mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff4b3e' })), new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff9a3d', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
  mesh.position.copy(from);
  activeScene().add(mesh);
  orbs.push({ mesh, velocity: target.sub(from).normalize().multiplyScalar(19), left: 2.6 });
}

function updateOrbs(dt: number) {
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    orb.left -= dt;
    orb.mesh.position.addScaledVector(orb.velocity, dt);
    const her = player.position.clone().setY(player.position.y + 1);
    const hitHer = mode === 'foot' && !player.down && orb.mesh.position.distanceTo(her) < 1.2;
    if (hitHer) {
      damagePlayer(10);
      flash(orb.mesh.position, '#ff4b3e', 1.5, 0.25);
    }
    if (hitHer || orb.left <= 0 || orb.mesh.position.y < ground(orb.mesh.position.x, orb.mesh.position.z)) {
      orb.mesh.parent?.remove(orb.mesh);
      orbs.splice(i, 1);
    }
  }
}

// --- Packs of enemies all over the valley ------------------------------------------------------

const PACKS: Record<'near' | 'mid' | 'far', readonly ModelEntry[][]> = {
  near: [[spineback, twinfang], [twinfang, twinfang, spineback], [spineback, spineback]],
  mid: [[stinglash, spineback, twinfang], [spineback, spineback, stinglash], [twinfang, stinglash, twinfang]],
  far: [[golem, stinglash], [gorgemaw, twinfang, twinfang], [golem, spineback, stinglash]],
};
function spawnPack(k: number) {
  const pack = features.packs[k];
  // The world boss fights alone.
  if (Math.hypot(pack.x - worldBossAt.x, pack.z - worldBossAt.z) < 50) return;
  const reach = Math.hypot(pack.x, pack.z);
  const choices = reach < 250 ? PACKS.near : reach < 450 ? PACKS.mid : PACKS.far;
  const members = choices[k % choices.length];
  members.forEach((entry, n) => {
    const a = pack.yaw + (n / members.length) * Math.PI * 2;
    spawn(entry, pack.x + Math.sin(a) * 5, pack.z + Math.cos(a) * 5, { pack: k, elite: k % 4 === 3 && n === 0 });
  });
}
features.packs.forEach((_, k) => spawnPack(k));
/** When each pack was wiped out: it comes back after a while, out of her sight. */
const wiped = new Map<number, number>();
function respawnPacks() {
  features.packs.forEach((pack, k) => {
    if (Math.hypot(pack.x - worldBossAt.x, pack.z - worldBossAt.z) < 50) return;
    if (enemies.some((enemy) => enemy.pack === k && enemy.health > 0)) return;
    const since = wiped.get(k);
    if (since === undefined) wiped.set(k, seconds);
    else if (seconds - since > 75 && Math.hypot(pack.x - player.position.x, pack.z - player.position.z) > 90) {
      wiped.delete(k);
      spawnPack(k);
    }
  });
}

// --- Skills ------------------------------------------------------------------------------

/** E: a pulse of gravity around her that hurts and throws back the enemies near. */
function pulse() {
  if (player.pulse > 0) return;
  player.pulse = PULSE.cooldown;
  const at = player.position.clone().setY(player.position.y + 1);
  ring(at, '#c58bff', PULSE.radius, 0.45);
  flash(at, '#8d4bff', 2.5, 0.35);
  hero.play('Shoot', true, true, 0.05);
  player.busy = 0.3;
  for (const enemy of here()) {
    if (enemy.health <= 0) continue;
    const away = enemy.object.position.clone().sub(player.position);
    if (away.length() < PULSE.radius + enemy.radius) hurt(enemy, PULSE.damage, away, PULSE.push * 2.5);
  }
}

/** Q: once charged, stars fall all around her. */
function starfall() {
  if (player.charge < STARFALL.charge) {
    say('Starfall is charging: hit enemies to charge it', 1.5);
    return;
  }
  player.charge = 0;
  const at = player.position.clone().setY(player.position.y + 1);
  flash(at, '#ffd23f', STARFALL.radius, 0.8);
  ring(at, '#ff8fc4', STARFALL.radius, 0.7);
  ring(at.clone().setY(at.y + 0.5), '#ffd23f', STARFALL.radius * 0.7, 0.9);
  hero.play('Victory', true, true, 0.05);
  player.busy = 0.6;
  shake = Math.max(shake, 0.45);
  for (const enemy of here()) {
    if (enemy.health <= 0) continue;
    const away = enemy.object.position.clone().sub(player.position);
    if (away.length() < STARFALL.radius + enemy.radius) hurt(enemy, STARFALL.damage, away, 2, true);
  }
}

// --- The ship ----------------------------------------------------------------------------

const ship = new Animated(homeward.create());
scene.add(ship.model.root);
ship.model.root.getObjectByName('rune')!.visible = false;
const CLIP_FOR: Record<FlightState['mode'], string> = { landed: 'Idle', takeoff: 'Takeoff', flight: 'Fly', landing: 'Land', space: 'Fly' };
let flightWorld: FlightWorld = { gravity: 9.81 * look.gravityG, ceiling: 1800, ground: worldGround };
// Parked in the middle of the landing pad.
let flight: FlightState = landedAt(0, 0, flightWorld, 0.6);
let chase = restCamera(flight);
let mode: 'foot' | 'ship' = 'foot';

// --- Space: asteroids to mine and solar energy to gather ------------------------------------

const space = spaceField(look.name, 1800);
scene.add(space.group);
/** What she has gathered (solar in kWh): part of what the ship needs to leave. */
const cargo = { ore: 0, crystal: 0, solar: 0 };

// --- The way home: what the ship needs, gathered all over the valley, and the end --------------

let catalogPlanet: Exoplanet | null = null;
let tasks: Task[] | null = null;
const taskList = () => (tasks ??= wayHome(catalogPlanet, { ruins: features.gates.length, beacons: features.beacons.length, folk: quests.length }));
const taskBar = $<HTMLDivElement>('tasks');
const taskDetail = $<HTMLDivElement>('tasks-detail');
const endingScreen = $<HTMLDivElement>('ending');
const caption = $<HTMLParagraphElement>('caption');
let allAboard = false;
let ending: Ending | null = null;
let over = false;

function progress(): Progress {
  return {
    plates: [...delves.values()].filter((delve) => delve.opened).length,
    ore: cargo.ore,
    crystal: cargo.crystal,
    solar: cargo.solar,
    beacons: found.beacons.size,
    colonists: quests.filter((quest) => quest.state === 'done').length,
  };
}

const TASK_ICONS: Record<TaskId, string> = {
  plates: '<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z" />',
  ore: '<path d="M5 14l3-7 7-2 4 6-3 7-8 1z" />',
  crystal: '<path d="M12 2l6 8-6 12-6-12z M6 10h12" />',
  solar: '<circle cx="12" cy="12" r="4" /><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2" />',
  beacons: '<path d="M12 2v4 M9 6h6 M10 21l1-12h2l1 12 M7 21h10" />',
  colonists: '<circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6 M15 14.6c3 0 6 2 6 5" />',
};

/** The bar of what the ship still needs, and its details (T). */
function updateTaskBar() {
  const list = taskList();
  const have = progress();
  const done = ready(list, have);
  taskBar.classList.toggle('ready', done);
  const chips = list.map((task) => {
    const full = have[task.id] >= task.need;
    return `<div class="task${full ? ' full' : ''}"><svg viewBox="0 0 24 24">${TASK_ICONS[task.id]}</svg><span>${task.name}</span><b>${full ? '✓' : `${have[task.id]}/${task.need}${task.unit}`}</b></div>`;
  });
  taskBar.innerHTML = `<p class="tasks-title">${done ? 'Everything is aboard: fly up to space and press <kbd>J</kbd> to leave' : 'What the ship needs to leave'} · <kbd>T</kbd> where</p><div class="chips">${chips.join('')}</div>`;
  if (!taskDetail.hidden) {
    taskDetail.innerHTML = `<h3>The way home</h3><p class="small">TRAPPIST-1 e is dying. This valley is the last place on it where anyone can live, and the fires of the wasteland are closing in.</p>${list.map((task) => {
      const full = have[task.id] >= task.need;
      return `<div class="task-row${full ? ' full' : ''}"><h4><svg viewBox="0 0 24 24">${TASK_ICONS[task.id]}</svg>${task.name}<b>${full ? '✓' : `${have[task.id]}/${task.need}${task.unit}`}</b></h4><p class="where">${task.where}</p><p class="why">${task.why}</p></div>`;
    }).join('')}<p class="small"><kbd>T</kbd> to close</p>`;
  }
  if (done && !allAboard) {
    allAboard = true;
    say('Everything the ship needs is aboard! Take it up to space and press J to leave TRAPPIST-1 e for good.', 7);
  }
}

/** J: leave for good, once everything is aboard and the ship is in space. */
function leave() {
  const list = taskList();
  const missing = nextTask(list, progress());
  if (missing) say(`Not yet: the ship still needs ${missing.name.toLowerCase()} (${progress()[missing.id]}/${missing.need}). T shows where.`, 3.5);
  else if (mode !== 'ship') say('Board the ship first, then take it up to space.', 3);
  else if (flight.mode !== 'space') say('Take the ship up to space first: hold Space to climb.', 3);
  else startEnding();
}

function startEnding() {
  document.body.classList.add('cinematic');
  taskDetail.hidden = true;
  hud.help.hidden = true;
  mapScreen.hidden = true;
  warn('');
  fadeScreen.style.transition = 'none';
  fadeScreen.style.background = '#ffffff';
  ending = endOfTheWorld({
    scene, camera, world, ship: ship.model.root,
    caption: (text) => {
      caption.textContent = text;
      caption.hidden = text === '';
    },
    whiteout: (amount) => { fadeScreen.style.opacity = String(amount); },
    onDone: showEnd,
  });
}

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
function showEnd() {
  over = true;
  document.exitPointerLock?.();
  const years = catalogPlanet ? distanceLightYears(catalogPlanet) : null;
  endingScreen.innerHTML = `<div class="ending-card"><p class="small">TRAPPIST-1 e → Earth${years ? ` · ${years.toFixed(1)} light years` : ''}</p><h2>The end</h2>
    <p>The last valley of TRAPPIST-1 e is gone, and the planet with it.</p>
    <p>Everyone it had is aboard, on the way home.</p>
    <p class="small">${count(Math.max(1, Math.round(seconds / 60)), 'minute')} in the last valley · ${count(found.beacons.size, 'beacon')} lit · ${count(quests.filter((quest) => quest.state === 'done').length, 'colonist')} saved</p>
    <button type="button" id="play-again">Play again</button></div>`;
  endingScreen.hidden = false;
  fadeScreen.style.transition = 'opacity 2s';
  fadeScreen.style.opacity = '0';
  $<HTMLButtonElement>('play-again').addEventListener('click', () => location.reload());
}

/** Out in the wasteland the air burns: she is hurt until she turns back. */
let scorchTimer = 0;
let scorchWarned = false;
function scorch(dt: number) {
  const burning = mode === 'foot' && place === 'world' && !player.down ? world.wasteland(player.position.x, player.position.z) : 0;
  if (burning > 0.35) {
    if (!scorchWarned) warn('⚠ The wasteland burns: nothing can live out here. Turn back to the valley!');
    scorchWarned = true;
    scorchTimer -= dt;
    if (scorchTimer <= 0) {
      scorchTimer = 0.8;
      damagePlayer(4 + burning * 6);
    }
  } else if (scorchWarned) {
    warn('');
    scorchWarned = false;
    scorchTimer = 0;
  }
}
const LASER_SPEED = 1400;
const laserLook = new THREE.MeshBasicMaterial({ color: '#7ff7e0' });
const laserShape = new THREE.CapsuleGeometry(0.35, 7, 2, 6).rotateX(Math.PI / 2);
interface Laser { mesh: THREE.Mesh; velocity: THREE.Vector3; left: number }
const lasers: Laser[] = [];
const chunks: Pickup[] = [];
let laserCooldown = 0;

/** Twin lasers from the wing pods, along the ship's nose. */
function fireLasers() {
  const nose = noseOf(flight);
  const direction = new THREE.Vector3(nose.x, nose.y, nose.z).normalize();
  const side = new THREE.Vector3(-Math.cos(flight.yaw), 0, Math.sin(flight.yaw));
  for (const s of [1, -1]) {
    const mesh = new THREE.Mesh(laserShape, laserLook);
    mesh.position.set(flight.position.x, flight.position.y + 2, flight.position.z).addScaledVector(side, s * 4).addScaledVector(direction, 6);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    scene.add(mesh);
    lasers.push({ mesh, velocity: direction.clone().multiplyScalar(LASER_SPEED + flight.speed), left: 1.6 });
  }
}

/** A rock breaks into chunks of what it holds, flung out to be gathered. */
function breakRock(rock: (typeof space.rocks)[number]) {
  rock.gone = 60;
  rock.object.visible = false;
  flash(rock.centre, '#ffb347', rock.radius * 0.8, 0.5);
  const count = 2 + Math.round(rock.radius / 6);
  for (let k = 0; k < count; k++) {
    const kind: Material = rock.yields === 'crystal' && k % 2 === 0 ? 'crystal' : 'ore';
    const object = chunk(kind);
    object.position.copy(rock.centre).add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(rock.radius));
    scene.add(object);
    chunks.push({ object, kind, velocity: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(30), gone: 45 });
  }
  say(`Asteroid broken: ${rock.yields === 'crystal' ? 'crystal and ore' : 'ore'}!`, 1.5);
}

function updateSpace(dt: number, seconds: number) {
  space.update(dt, seconds);
  laserCooldown = Math.max(0, laserCooldown - dt);
  // F fires too, but only out in space: over the valley it brings her down.
  if (mode === 'ship' && flight.mode !== 'landed' && (firing || (held.has('KeyF') && flight.mode === 'space')) && laserCooldown <= 0) {
    laserCooldown = 0.16;
    fireLasers();
  }
  const from = new THREE.Vector3();
  const closest = new THREE.Vector3();
  const segment = new THREE.Line3();
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    from.copy(laser.mesh.position);
    laser.mesh.position.addScaledVector(laser.velocity, dt);
    laser.left -= dt;
    segment.set(from, laser.mesh.position);
    const hit = space.rocks.find((rock) => rock.gone <= 0 && segment.closestPointToPoint(rock.centre, true, closest).distanceTo(rock.centre) < rock.radius * 0.95);
    if (hit) {
      hit.health -= 12;
      damageNumber(closest, 12);
      if (hit.health <= 0) breakRock(hit);
    }
    if (hit || laser.left <= 0) {
      scene.remove(laser.mesh);
      lasers.splice(i, 1);
    }
  }
  // Chunks drift, and are drawn in to the ship when it comes close.
  const shipAt = new THREE.Vector3(flight.position.x, flight.position.y + 2, flight.position.z);
  for (let i = chunks.length - 1; i >= 0; i--) {
    const item = chunks[i];
    item.gone -= dt;
    const toShip = shipAt.clone().sub(item.object.position);
    const distance = toShip.length();
    if (mode === 'ship' && distance < 120) item.velocity.lerp(toShip.normalize().multiplyScalar(90), Math.min(1, dt * 3));
    else item.velocity.multiplyScalar(1 - dt * 0.5);
    item.object.position.addScaledVector(item.velocity, dt);
    item.object.rotation.y += dt * 2;
    if (mode === 'ship' && distance < 14) {
      cargo[item.kind as Material] += item.kind === 'ore' ? 3 : 1;
      scene.remove(item.object);
      chunks.splice(i, 1);
    } else if (item.gone <= 0) {
      scene.remove(item.object);
      chunks.splice(i, 1);
    }
  }
  // Solar motes are gathered by flying through them.
  if (mode === 'ship') {
    for (const mote of space.motes) {
      if (mote.gone > 0) continue;
      if (mote.object.position.distanceTo(shipAt) < 28) {
        mote.gone = 25;
        mote.object.visible = false;
        cargo.solar += 10;
        say(`Solar energy +10 kWh (${cargo.solar})`, 1.2);
      }
    }
  }
}

/**
 * Asked to land (L) or to get out (F) while flying: the ship comes down on
 * its own, nose down from high up or from space, then brakes and lands, and
 * with F she steps out once it is down. Pressing again, climbing or speeding
 * up calls it off. In space F fires, so only L brings her down from there.
 */
let autoLand: 'land' | 'leave' | null = null;

function readFlight(): FlightInput {
  const pilot: FlightInput = {
    ...NO_INPUT,
    throttle: axis(['KeyW'], ['KeyS']),
    turn: axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']),
    pitch: axis(['ArrowUp'], ['ArrowDown']),
    lift: axis(['Space'], ['KeyC']),
    boost: held.has('ShiftLeft') || held.has('ShiftRight'),
    toggleLanding: pressed.has('KeyL'),
  };
  if (flight.mode === 'landing' && pressed.has('KeyF')) autoLand = 'leave';
  if (flight.mode !== 'flight' && flight.mode !== 'space') return pilot;
  const askF = pressed.has('KeyF') && flight.mode === 'flight';
  if (pressed.has('KeyL') || askF) autoLand = autoLand ? null : askF ? 'leave' : 'land';
  if (pilot.lift > 0.5 || pilot.throttle > 0) autoLand = null;
  if (!autoLand) return { ...pilot, toggleLanding: false };
  const height = flight.position.y - worldGround(flight.position.x, flight.position.z);
  const nose = (goal: number) => THREE.MathUtils.clamp((goal - flight.pitch) * 3, -1, 1);
  if (height > 200) return { ...pilot, pitch: nose(-0.8), throttle: flight.speed < 130 ? 1 : 0, boost: true, lift: -1, toggleLanding: false };
  const slow = flight.speed <= FLIGHT.landSpeed * 0.9;
  const low = height <= FLIGHT.landHeight * 0.9;
  return { ...pilot, pitch: nose(0), throttle: slow ? 0 : -1, lift: low ? 0 : -1, toggleLanding: flight.mode === 'flight' && slow && low };
}

// --- The open world: what has been found and done -------------------------------------------

const found = {
  shards: new Set<number>(),
  chests: new Set<number>(),
  beacons: new Set<number>(),
  ruin: false,
};
const NAMES = ['Petal', 'Anvil', 'Lumi', 'Wisp'];

interface Quest {
  giver: number;
  title: string;
  /** What to do, in a line, for the tracker. */
  todo: string;
  ask: string;
  thanks: string;
  goal: () => [number, number];
  where: () => THREE.Vector3 | null;
  state: 'offered' | 'active' | 'done';
}

const nearestCamp = (() => {
  const centre = features.village?.centre ?? { x: 0, z: 0 };
  let best = 0;
  features.camps.forEach((camp, k) => {
    if (Math.hypot(camp.x - centre.x, camp.z - centre.z) < Math.hypot(features.camps[best].x - centre.x, features.camps[best].z - centre.z)) best = k;
  });
  return best;
})();
const spotOf = (spot: { x: number; z: number } | undefined) => (spot ? new THREE.Vector3(spot.x, worldGround(spot.x, spot.z), spot.z) : null);
const nearestOf = (spots: { x: number; z: number }[], skip: Set<number>) => {
  let best: THREE.Vector3 | null = null;
  spots.forEach((spot, k) => {
    if (skip.has(k)) return;
    const candidate = spotOf(spot)!;
    if (!best || candidate.distanceTo(player.position) < best.distanceTo(player.position)) best = candidate;
  });
  return best;
};

const quests: Quest[] = [
  {
    giver: 0, title: 'Star shards', todo: 'Gather star shards in the meadows and on the peaks',
    ask: 'Star shards fell all over the meadows and the peaks. Bring me eight and I will make you a lamp that never goes out.',
    thanks: 'Eight shards! The lamp will be ready by nightfall. You have a good eye.',
    goal: () => [Math.min(8, found.shards.size), 8],
    where: () => nearestOf(features.shards, found.shards),
    state: 'offered',
  },
  {
    giver: 1, title: 'Clear the camp', todo: 'Defeat the raiders camped near the village',
    ask: 'Raiders set up camp near the village and sit on a chest of our parts. Chase them off, and the chest is yours.',
    thanks: 'The camp is quiet. Keep what you found in that chest — you earned it.',
    goal: () => {
      const total = enemies.filter((enemy) => enemy.camp === nearestCamp).length + (fallen.get(nearestCamp) ?? 0);
      return [fallen.get(nearestCamp) ?? 0, Math.max(1, total)];
    },
    where: () => spotOf(features.camps[nearestCamp]),
    state: 'offered',
  },
  {
    giver: 2, title: 'Light the way', todo: 'Light beacons on the heights',
    ask: 'The old beacons stand on the heights. Light three of them and travellers will find their way again — and so will you.',
    thanks: 'Three beacons alight! From the map you can travel between them.',
    goal: () => [Math.min(3, found.beacons.size), 3],
    where: () => nearestOf(features.beacons, found.beacons),
    state: 'offered',
  },
  {
    giver: 3, title: 'The old ruin', todo: 'Go down into the main ruin and defeat its guardian',
    ask: 'Past the hills stands the ruin of the first colonists. The way down is still open, but something guards it. Bring back what they left.',
    thanks: 'You beat the guardian and brought back the relic! The first colonists would be proud.',
    goal: () => [delves.get(0)?.done ? 1 : 0, 1],
    where: () => spotOf(features.gates[0]),
    state: 'offered',
  },
];

// --- Dungeons ---------------------------------------------------------------------------

/** What waits in each dungeon: the guards of its first two halls, and its guardian. */
const DUNGEONS = [
  { name: 'Main ruin', guards: [[spineback, twinfang, spineback], [stinglash, twinfang, golem, spineback, twinfang]], adds: [spineback, twinfang], boss: rootmaw, bossName: 'Rootmaw, guardian of the ruin' },
  { name: 'Dungeon 2', guards: [[twinfang, twinfang, stinglash], [gorgemaw, spineback, stinglash, twinfang, spineback]], adds: [drone, drone], boss: overseer, bossName: 'The Lander Overseer' },
  { name: 'Dungeon 3', guards: [[spineback, spineback, gorgemaw], [golem, stinglash, twinfang, twinfang, spineback]], adds: [stinglash, spineback], boss: cinderhermit, bossName: 'The Cinder Hermit' },
] as const;

/** A dungeon, built the first time she goes down into it. */
function delveInto(k: number): Delve {
  const known = delves.get(k);
  if (known) return known;
  const dungeon = buildDungeon(k);
  const chest = new Animated(chestModel.create());
  chest.model.root.position.copy(dungeon.chest);
  chest.model.root.rotation.y = Math.PI;
  chest.model.root.scale.setScalar(1.6);
  chest.model.root.visible = false;
  dungeon.scene.add(chest.model.root);
  chest.play('Idle');
  const delve: Delve = { dungeon, cleared: [false, false, false], done: false, chest, opened: false, guardian: null };
  delves.set(k, delve);
  const plan = DUNGEONS[k % DUNGEONS.length];
  dungeon.halls.forEach((hall, h) => {
    if (h < 2) {
      const guards = plan.guards[h];
      hall.spawns.forEach(([x, z], n) => spawn(guards[n % guards.length], x, z, { area: k, hall: h }));
    } else {
      hall.spawns.forEach(([x, z], n) => spawn(plan.adds[n % plan.adds.length], x, z, { area: k, hall: h }));
      delve.guardian = spawn(plan.boss, hall.boss![0], hall.boss![1], { area: k, hall: h, boss: true, name: plan.bossName });
    }
  });
  return delve;
}

const fadeScreen = $<HTMLDivElement>('fade');
/** A short fade to black and back, with the change of place in the middle. */
function transition(then: () => void) {
  fadeScreen.style.opacity = '1';
  setTimeout(() => {
    then();
    fadeScreen.style.opacity = '0';
  }, 380);
}

function enterDungeon(k: number) {
  transition(() => {
    clearShots();
    const delve = delveInto(k);
    place = k;
    delve.dungeon.scene.add(hero.model.root);
    player.position.copy(delve.dungeon.start);
    player.velocityY = 0;
    player.gliding = false;
    player.facing = 0;
    camYaw = 0;
    camPitch = 0.22;
    say(`${DUNGEONS[k].name}: defeat the guards of each hall to open the way`, 3.5);
  });
}

function leaveDungeon() {
  const k = place as number;
  transition(() => {
    clearShots();
    place = 'world';
    scene.add(hero.model.root);
    const gate = features.gates[k];
    player.position.set(gate.x + Math.sin(gate.yaw) * 12, 0, gate.z + Math.cos(gate.yaw) * 12);
    player.position.y = worldGround(player.position.x, player.position.z);
    player.facing = gate.yaw;
    camYaw = gate.yaw;
    camPitch = 0.18;
  });
}

/** Halls open as they are cleared; the guardian's fall ends the dungeon. */
function updateDungeon(dt: number, seconds: number) {
  const delve = dungeonOf(place as number);
  delve.dungeon.update(dt, seconds);
  delve.chest.mixer.update(dt);
  for (let h = 0; h < 3; h++) {
    if (delve.cleared[h]) continue;
    const left = enemies.filter((enemy) => enemy.area === place && enemy.hall === h && enemy.health > 0).length;
    if (left > 0) break;
    delve.cleared[h] = true;
    if (h < 2) {
      delve.dungeon.open(h);
      say('The way ahead opens!', 2.5);
    } else {
      delve.done = true;
      delve.dungeon.finish();
      delve.chest.model.root.visible = true;
      flash(delve.dungeon.chest.clone().setY(1), '#ffd23f', 4, 0.8);
      say('Dungeon cleared! Open the chest, then take the portal out.', 4.5);
    }
  }
}

// --- HUD --------------------------------------------------------------------------------

const hud = {
  planet: $<HTMLParagraphElement>('planet'),
  questTitle: $<HTMLParagraphElement>('quest-title'),
  questGoal: $<HTMLParagraphElement>('quest-goal'),
  questList: $<HTMLDivElement>('quest-list'),
  counters: $<HTMLParagraphElement>('counters'),
  health: $<HTMLDivElement>('health'),
  healthText: $<HTMLSpanElement>('health-text'),
  loadout: $<HTMLDivElement>('loadout'),
  cargo: $<HTMLDivElement>('cargo'),
  skillE: $<HTMLDivElement>('skill-e'),
  skillQ: $<HTMLDivElement>('skill-q'),
  prompt: $<HTMLParagraphElement>('prompt'),
  message: $<HTMLParagraphElement>('message'),
  help: $<HTMLDivElement>('help'),
  crosshair: $<HTMLDivElement>('crosshair'),
  dialog: $<HTMLDivElement>('dialog'),
  who: $<HTMLHeadingElement>('dialog-who'),
  line: $<HTMLParagraphElement>('dialog-line'),
  markers: $<HTMLDivElement>('markers'),
  minimap: $<HTMLCanvasElement>('minimap'),
};
const mapScreen = $<HTMLDivElement>('worldmap');
let messageFor = 0;
function say(text: string, seconds = 3) {
  hud.message.textContent = text;
  messageFor = seconds;
}
function talk(who: string, line: string) {
  hud.who.textContent = who;
  hud.line.textContent = line;
  hud.dialog.hidden = false;
}

// The four weapons, like a party on the right.
hud.loadout.innerHTML = ARSENAL.map((arm, k) => `<div class="slot" style="--tint: ${arm.tint}"><span class="name">${arm.name}</span><span class="icon"></span><kbd>${k + 1}</kbd></div>`).join('');
const slots = [...hud.loadout.querySelectorAll<HTMLDivElement>('.slot')];
$<HTMLButtonElement>('open-map').addEventListener('click', () => toggleMap());
$<HTMLButtonElement>('open-help').addEventListener('click', () => { hud.help.hidden = !hud.help.hidden; });

function updateQuests() {
  let html = '';
  for (const quest of quests) {
    if (quest.state === 'offered') continue;
    const [done, total] = quest.goal();
    if (quest.state === 'active' && done >= total) {
      quest.state = 'done';
      say(`Quest complete: ${quest.title}`, 4);
      talk(NAMES[quest.giver], quest.thanks);
    }
  }
  // The quest followed: the first one still open, shown big; in a dungeon, the dungeon.
  const followed = quests.find((quest) => quest.state === 'active');
  if (place !== 'world') {
    const delve = dungeonOf(place);
    const plan = DUNGEONS[place % DUNGEONS.length];
    const hall = delve.cleared.findIndex((cleared) => !cleared);
    const left = enemies.filter((enemy) => enemy.area === place && enemy.hall === hall && enemy.health > 0).length;
    hud.questTitle.textContent = plan.name;
    hud.questGoal.textContent = delve.done
      ? (delve.opened ? 'Cleared! Take the portal at the far end to leave.' : 'Cleared! Open the reward chest.')
      : hall < 2 ? `Hall ${hall + 1} of 3: defeat the guards (${left} left)` : `The arena: defeat ${plan.bossName}`;
  } else if (followed) {
    const [done, total] = followed.goal();
    hud.questTitle.textContent = followed.title;
    hud.questGoal.textContent = `${followed.todo} (${done}/${total})`;
  } else {
    const missing = nextTask(taskList(), progress());
    hud.questTitle.textContent = 'The way home';
    hud.questGoal.textContent = missing ? `Next: ${missing.name.toLowerCase()}. ${missing.where}` : 'Everything is aboard: fly up to space and press J.';
  }
  for (const quest of quests) {
    if (quest.state === 'offered' || quest === followed) continue;
    if (quest.state === 'done') html += `<p class="done">✓ ${quest.title}</p>`;
    else {
      const [done, total] = quest.goal();
      html += `<p>${quest.title} <span class="goal">${done}/${total}</span></p>`;
    }
  }
  const waiting = quests.filter((quest) => quest.state === 'offered').length;
  if (waiting > 0) html += `<p class="goal">${waiting} ${waiting === quests.length ? 'tasks wait' : 'more'} in the village</p>`;
  hud.questList.innerHTML = html;
  updateTaskBar();
}

// --- Markers and the minimap ---------------------------------------------------------------------

type Kind = 'village' | 'gate' | 'beacon' | 'camp' | 'chest' | 'ship' | 'quest' | 'boss';
interface Mark { kind: Kind; label: string; at: THREE.Vector3; tint: string; always?: boolean; target?: boolean; up: number; lit?: boolean }

const TINTS: Record<Kind, string> = { village: '#3fbf7f', gate: '#9a5bff', beacon: '#2fb8d8', camp: '#e8483c', chest: '#f0a92a', ship: '#2f7bff', quest: '#ffc533', boss: '#ff2f6d' };

function marks(): Mark[] {
  const list: Mark[] = [];
  const active = quests.find((quest) => quest.state === 'active');
  const target = active?.where() ?? null;
  const mark = (kind: Kind, label: string, at: THREE.Vector3, up: number, extra: Partial<Mark> = {}) => list.push({ kind, label, at, tint: TINTS[kind], up, ...extra });
  if (features.village) mark('village', 'Village', spotOf(features.village.centre)!, 9, { always: true });
  features.gates.forEach((gate, k) => mark('gate', k === 0 ? 'Main ruin' : `Dungeon ${k + 1}`, spotOf(gate)!, 12, { always: true }));
  features.beacons.forEach((spot, k) => mark('beacon', found.beacons.has(k) ? 'Beacon' : 'Beacon (unlit)', spotOf(spot)!, 9, { always: true, lit: found.beacons.has(k) }));
  features.camps.forEach((camp, k) => { if (campLeft(k) > 0) mark('camp', 'Camp', spotOf(camp)!, 4); });
  features.chests.forEach((spot, k) => { if (!found.chests.has(k)) mark('chest', 'Chest', spotOf(spot)!, 2); });
  mark('ship', 'Ship', new THREE.Vector3(flight.position.x, flight.position.y, flight.position.z), 5);
  if (worldBoss.health > 0) mark('boss', raid.state === 'nest' ? 'Dragon nest' : 'Ashwing', worldBoss.object.position.clone(), 7, { always: true });
  for (const item of list) if (target && item.at.distanceTo(target) < 3) item.target = true;
  if (target && !list.some((item) => item.target)) mark('quest', active!.title, target, 3, { always: true, target: true });
  return list;
}

const markPool: HTMLDivElement[] = [];
function drawMarks(list: Mark[]) {
  let used = 0;
  const point = new THREE.Vector3();
  for (const item of list) {
    const distance = item.at.distanceTo(player.position);
    if (mode === 'ship' && !item.always) continue;
    if (!item.always && !item.target && distance > 160) continue;
    if (distance < 6) continue;
    point.copy(item.at).setY(item.at.y + item.up).project(camera);
    // Behind the camera: kept at the bottom edge, on its side.
    if (point.z > 1) { point.x = -Math.sign(point.x || 1); point.y = -1; }
    const x = THREE.MathUtils.clamp(point.x, -0.94, 0.94);
    const y = THREE.MathUtils.clamp(point.y, -0.9, 0.92);
    const el = markPool[used] ?? hud.markers.appendChild(Object.assign(document.createElement('div'), { className: 'marker' }));
    markPool[used++] = el;
    el.hidden = false;
    el.className = item.target ? 'marker target' : 'marker';
    el.style.setProperty('--tint', item.tint);
    el.style.left = `${((x + 1) / 2) * 100}%`;
    el.style.top = `${((1 - y) / 2) * 100}%`;
    el.textContent = `${item.label} · ${Math.round(distance)} m`;
  }
  for (let k = used; k < markPool.length; k++) markPool[k].hidden = true;
}

/**
 * A map badge: a round coloured token with a white symbol, the way maps of
 * open worlds mark their places. `faded` draws it hollow (an unlit beacon).
 */
function badge(context: CanvasRenderingContext2D, kind: Kind, x: number, y: number, r: number, faded = false) {
  const tint = TINTS[kind];
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.arc(0, 0, r, 0, Math.PI * 2);
  context.fillStyle = faded ? 'rgba(255, 255, 255, 0.85)' : tint;
  context.fill();
  context.lineWidth = Math.max(1.5, r * 0.16);
  context.strokeStyle = faded ? tint : '#fffaf0';
  context.stroke();
  context.fillStyle = faded ? tint : '#ffffff';
  context.strokeStyle = faded ? tint : '#ffffff';
  context.lineWidth = Math.max(1.2, r * 0.14);
  context.lineJoin = 'round';
  const s = r * 0.55;
  context.beginPath();
  if (kind === 'village') {
    // A house.
    context.moveTo(-s, 0); context.lineTo(0, -s); context.lineTo(s, 0); context.lineTo(s * 0.7, 0); context.lineTo(s * 0.7, s * 0.8);
    context.lineTo(-s * 0.7, s * 0.8); context.lineTo(-s * 0.7, 0); context.closePath(); context.fill();
  } else if (kind === 'gate') {
    // An arched door.
    context.moveTo(-s * 0.7, s * 0.8); context.lineTo(-s * 0.7, -s * 0.1); context.arc(0, -s * 0.1, s * 0.7, Math.PI, 0); context.lineTo(s * 0.7, s * 0.8); context.closePath(); context.fill();
    context.beginPath(); context.fillStyle = faded ? '#ffffff' : tint; context.arc(0, s * 0.15, s * 0.32, 0, Math.PI * 2); context.fill();
  } else if (kind === 'beacon') {
    // A crystal over a pillar.
    context.moveTo(0, -s); context.lineTo(s * 0.45, -s * 0.35); context.lineTo(0, s * 0.2); context.lineTo(-s * 0.45, -s * 0.35); context.closePath(); context.fill();
    context.fillRect(-s * 0.2, s * 0.3, s * 0.4, s * 0.6);
  } else if (kind === 'camp') {
    // A tent.
    context.moveTo(-s, s * 0.7); context.lineTo(0, -s * 0.8); context.lineTo(s, s * 0.7); context.closePath(); context.fill();
    context.beginPath(); context.fillStyle = tint; context.moveTo(-s * 0.25, s * 0.7); context.lineTo(0, s * 0.1); context.lineTo(s * 0.25, s * 0.7); context.closePath(); context.fill();
  } else if (kind === 'chest') {
    context.fillRect(-s * 0.85, -s * 0.3, s * 1.7, s * 1.1);
    context.beginPath(); context.fillStyle = tint; context.fillRect(-s * 0.85, -s * 0.1, s * 1.7, s * 0.14); context.fillRect(-s * 0.12, -s * 0.1, s * 0.24, s * 0.45);
  } else if (kind === 'boss') {
    // Horns over a skull.
    context.moveTo(-s, -s * 0.9); context.lineTo(-s * 0.35, -s * 0.2); context.lineTo(s * 0.35, -s * 0.2); context.lineTo(s, -s * 0.9); context.lineTo(s * 0.6, s * 0.1);
    context.lineTo(s * 0.45, s * 0.85); context.lineTo(-s * 0.45, s * 0.85); context.lineTo(-s * 0.6, s * 0.1); context.closePath(); context.fill();
    context.beginPath(); context.fillStyle = tint; context.arc(-s * 0.25, s * 0.25, s * 0.16, 0, Math.PI * 2); context.arc(s * 0.25, s * 0.25, s * 0.16, 0, Math.PI * 2); context.fill();
  } else if (kind === 'ship') {
    context.moveTo(0, -s); context.lineTo(s * 0.75, s * 0.75); context.lineTo(0, s * 0.35); context.lineTo(-s * 0.75, s * 0.75); context.closePath(); context.fill();
  } else {
    context.arc(0, 0, s * 0.45, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

const map = hud.minimap.getContext('2d')!;
const MAP_RANGE = 380;
function drawMinimap(list: Mark[]) {
  const size = hud.minimap.width;
  const half = size / 2;
  if (place !== 'world') {
    drawDungeonMinimap(size, half);
    return;
  }
  const scale = (half - 16) / MAP_RANGE;
  map.clearRect(0, 0, size, size);
  map.save();
  map.beginPath();
  map.arc(half, half, half - 6, 0, Math.PI * 2);
  map.fillStyle = '#a8dc7a';
  map.fill();
  map.clip();
  const f = { x: Math.sin(camYaw), z: Math.cos(camYaw) };
  const r = { x: -Math.cos(camYaw), z: Math.sin(camYaw) };
  const toMap = (x: number, z: number, clamp: boolean) => {
    const dx = x - player.position.x;
    const dz = z - player.position.z;
    let sx = (dx * r.x + dz * r.z) * scale;
    let sy = -(dx * f.x + dz * f.z) * scale;
    const length = Math.hypot(sx, sy);
    if (length > half - 22) {
      if (!clamp) return null;
      sx *= (half - 22) / length;
      sy *= (half - 22) / length;
    }
    return [half + sx, half + sy] as const;
  };
  // The land around her, turned with the camera: the same drawing as the map.
  terrainTile ??= drawTerrain();
  {
    const metre = (2 * MAP_SPAN) / MAP_PIXELS;
    const m00 = r.x * scale;
    const m01 = r.z * scale;
    const m10 = -f.x * scale;
    const m11 = -f.z * scale;
    const ox = -MAP_SPAN - player.position.x;
    const oz = -MAP_SPAN - player.position.z;
    map.save();
    map.imageSmoothingEnabled = true;
    map.setTransform(m00 * metre, m10 * metre, m01 * metre, m11 * metre, half + m00 * ox + m01 * oz, half + m10 * ox + m11 * oz);
    map.drawImage(terrainTile, 0, 0);
    map.restore();
  }
  features.shards.forEach((spot, k) => {
    if (found.shards.has(k)) return;
    const at = toMap(spot.x, spot.z, false);
    if (!at) return;
    map.beginPath();
    map.arc(at[0], at[1], 4, 0, Math.PI * 2);
    map.fillStyle = '#ffffff';
    map.fill();
    map.strokeStyle = '#2fb8d8';
    map.lineWidth = 1.5;
    map.stroke();
  });
  for (const enemy of enemies) {
    if (enemy.health <= 0) continue;
    const at = toMap(enemy.object.position.x, enemy.object.position.z, false);
    if (!at) continue;
    map.beginPath();
    map.arc(at[0], at[1], 5, 0, Math.PI * 2);
    map.fillStyle = '#e8483c';
    map.fill();
  }
  for (const item of list) {
    const at = toMap(item.at.x, item.at.z, Boolean(item.always || item.target));
    if (!at) continue;
    badge(map, item.kind, at[0], at[1], item.kind === 'chest' ? 11 : 15, item.kind === 'beacon' && !item.lit);
    if (item.target) {
      map.beginPath();
      map.arc(at[0], at[1], 21, 0, Math.PI * 2);
      map.strokeStyle = '#ffc533';
      map.lineWidth = 4;
      map.stroke();
    }
  }
  map.restore();
  // The rim, the north and her, looking up the map.
  map.beginPath();
  map.arc(half, half, half - 6, 0, Math.PI * 2);
  map.strokeStyle = 'rgba(255, 241, 214, 0.95)';
  map.lineWidth = 6;
  map.stroke();
  const north = toMap(player.position.x, player.position.z + 1e6, true)!;
  map.beginPath();
  map.arc(north[0], north[1], 14, 0, Math.PI * 2);
  map.fillStyle = '#1b1726';
  map.fill();
  map.fillStyle = '#fff1d6';
  map.font = 'bold 18px system-ui';
  map.textAlign = 'center';
  map.textBaseline = 'middle';
  map.fillText('N', north[0], north[1] + 1);
  map.beginPath();
  map.moveTo(half, half - 16);
  map.lineTo(half - 11, half + 11);
  map.lineTo(half, half + 5);
  map.lineTo(half + 11, half + 11);
  map.closePath();
  map.fillStyle = '#ffffff';
  map.fill();
  map.strokeStyle = '#1b1726';
  map.lineWidth = 3;
  map.stroke();
}

/** In a dungeon, the minimap shows its halls and who is in them. */
function drawDungeonMinimap(size: number, half: number) {
  const delve = dungeonOf(place as number);
  const scale = (half - 16) / 60;
  const f = { x: Math.sin(camYaw), z: Math.cos(camYaw) };
  const r = { x: -Math.cos(camYaw), z: Math.sin(camYaw) };
  const toMap = (x: number, z: number) => {
    const dx = x - player.position.x;
    const dz = z - player.position.z;
    return [half + (dx * r.x + dz * r.z) * scale, half - (dx * f.x + dz * f.z) * scale] as const;
  };
  map.clearRect(0, 0, size, size);
  map.save();
  map.beginPath();
  map.arc(half, half, half - 6, 0, Math.PI * 2);
  map.fillStyle = '#211c38';
  map.fill();
  map.clip();
  map.fillStyle = '#5a5277';
  for (const hall of delve.dungeon.halls) {
    const { x0, x1, z0, z1 } = hall.bounds;
    const corners = [toMap(x0, z0), toMap(x1, z0), toMap(x1, z1), toMap(x0, z1)];
    map.beginPath();
    corners.forEach(([x, y], i) => (i === 0 ? map.moveTo(x, y) : map.lineTo(x, y)));
    map.closePath();
    map.fill();
  }
  for (const enemy of here()) {
    if (enemy.health <= 0) continue;
    const [x, y] = toMap(enemy.object.position.x, enemy.object.position.z);
    map.beginPath();
    map.arc(x, y, enemy.boss ? 10 : 5, 0, Math.PI * 2);
    map.fillStyle = enemy.boss ? '#ff2f6d' : '#e8483c';
    map.fill();
  }
  map.restore();
  map.beginPath();
  map.arc(half, half, half - 6, 0, Math.PI * 2);
  map.strokeStyle = 'rgba(255, 241, 214, 0.95)';
  map.lineWidth = 6;
  map.stroke();
  map.beginPath();
  map.moveTo(half, half - 16);
  map.lineTo(half - 11, half + 11);
  map.lineTo(half, half + 5);
  map.lineTo(half + 11, half + 11);
  map.closePath();
  map.fillStyle = '#ffffff';
  map.fill();
}

// --- The map of the region (M) ----------------------------------------------------------------

/** The map shows this many metres each way from the landing site, drawn at this many pixels. */
const MAP_SPAN = 1500;
const MAP_PIXELS = 375;
let terrainTile: HTMLCanvasElement | null = null;

/** Map colours: flat bands by height, as on a drawn map. */
const BANDS: readonly [number, string][] = [[-Infinity, '#5fb3e8'], [0, '#b6e08a'], [55, '#9ad070'], [130, '#c7d68e'], [215, '#d8cdb2'], [300, '#ece6da'], [370, '#ffffff']];

/**
 * The land seen from above, drawn like a map: flat colour bands by height
 * with a line where they meet, water with its shore, the forests stippled,
 * a soft light from the north-west, and the paths.
 */
const ASH_ON_MAP = new THREE.Color('#3a2a26');
const LAVA_ON_MAP = new THREE.Color('#e0501c');
function drawTerrain(): HTMLCanvasElement {
  const tile = document.createElement('canvas');
  tile.width = MAP_PIXELS;
  tile.height = MAP_PIXELS;
  const context = tile.getContext('2d')!;
  const image = context.createImageData(MAP_PIXELS, MAP_PIXELS);
  const metre = (2 * MAP_SPAN) / MAP_PIXELS;
  const heights = new Float32Array(MAP_PIXELS * MAP_PIXELS);
  const bands = new Uint8Array(MAP_PIXELS * MAP_PIXELS);
  const bandOf = (h: number) => {
    if (h < level) return 0;
    let band = 1;
    for (let b = 1; b < BANDS.length; b++) if (h >= BANDS[b][0]) band = b;
    return band;
  };
  for (let py = 0; py < MAP_PIXELS; py++) {
    for (let px = 0; px < MAP_PIXELS; px++) {
      const h = world.ground(-MAP_SPAN + px * metre, -MAP_SPAN + py * metre);
      heights[py * MAP_PIXELS + px] = h;
      bands[py * MAP_PIXELS + px] = bandOf(h);
    }
  }
  const tone = new THREE.Color();
  const edge = new THREE.Color('#5d6b4a');
  const shore = new THREE.Color('#2f6fa8');
  for (let py = 0; py < MAP_PIXELS; py++) {
    for (let px = 0; px < MAP_PIXELS; px++) {
      const v = py * MAP_PIXELS + px;
      const h = heights[v];
      const band = bands[v];
      tone.set(BANDS[band][1]);
      const east = heights[py * MAP_PIXELS + Math.min(MAP_PIXELS - 1, px + 1)];
      const south = heights[Math.min(MAP_PIXELS - 1, py + 1) * MAP_PIXELS + px];
      if (band > 0) tone.multiplyScalar(THREE.MathUtils.clamp(1 + ((h - east) + (h - south)) / metre * 0.12, 0.85, 1.1));
      // A line where two bands meet: shores, plateaus and cliffs.
      const neighbour = bands[Math.min(MAP_PIXELS - 1, py + 1) * MAP_PIXELS + px] !== band || bands[py * MAP_PIXELS + Math.min(MAP_PIXELS - 1, px + 1)] !== band;
      if (neighbour) tone.lerp(band === 0 || bands[v + 1] === 0 ? shore : edge, 0.55);
      // Past the last valley: the burning wasteland.
      const dead = world.wasteland(-MAP_SPAN + px * metre, -MAP_SPAN + py * metre);
      if (dead > 0) tone.lerp(band === 0 ? LAVA_ON_MAP : ASH_ON_MAP, dead * 0.85);
      const i = v * 4;
      image.data[i] = tone.r * 255;
      image.data[i + 1] = tone.g * 255;
      image.data[i + 2] = tone.b * 255;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  // Forests, as little dark green dots.
  for (let py = 1; py < MAP_PIXELS; py += 3) {
    for (let px = 1; px < MAP_PIXELS; px += 3) {
      const x = -MAP_SPAN + px * metre;
      const z = -MAP_SPAN + py * metre;
      if (woods(x, z) < 0.35) continue;
      context.beginPath();
      context.arc(px + (((px * 7 + py * 3) % 5) - 2) * 0.3, py, 1.15, 0, Math.PI * 2);
      context.fillStyle = 'rgba(47, 120, 70, 0.75)';
      context.fill();
    }
  }
  // The paths: a pale line with a darker edge.
  for (const [width, colour] of [[3.2, '#8a6a40'], [1.9, '#f4e2b8']] as const) {
    context.lineWidth = width;
    context.strokeStyle = colour;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const line of world.paths.lines) {
      context.beginPath();
      line.forEach(([x, z], i) => {
        const px = (x + MAP_SPAN) / metre;
        const py = (z + MAP_SPAN) / metre;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.stroke();
    }
  }
  return tile;
}
const woods = forestDensity(look, world.ground, world.paths);

const mapCanvas = $<HTMLCanvasElement>('map-canvas');
const mapContext = mapCanvas.getContext('2d')!;
/** Where a point of the land is on the big map, in its pixels. */
const onMap = (x: number, z: number) => [((x + MAP_SPAN) / (2 * MAP_SPAN)) * mapCanvas.width, ((z + MAP_SPAN) / (2 * MAP_SPAN)) * mapCanvas.height] as const;

function drawMap() {
  terrainTile ??= drawTerrain();
  const size = mapCanvas.width;
  mapContext.imageSmoothingEnabled = true;
  mapContext.drawImage(terrainTile, 0, 0, size, size);
  const label = (text: string, x: number, y: number, big = false) => {
    mapContext.font = `700 ${big ? 20 : 15}px system-ui`;
    mapContext.textAlign = 'center';
    mapContext.textBaseline = 'middle';
    mapContext.lineWidth = 5;
    mapContext.strokeStyle = 'rgba(255, 250, 238, 0.95)';
    mapContext.strokeText(text, x, y);
    mapContext.fillStyle = '#3a2a1a';
    mapContext.fillText(text, x, y);
  };
  for (const [k, spot] of features.chests.entries()) if (!found.chests.has(k)) badge(mapContext, 'chest', ...onMap(spot.x, spot.z), 10);
  for (const [k, camp] of features.camps.entries()) if (campLeft(k) > 0) badge(mapContext, 'camp', ...onMap(camp.x, camp.z), 14);
  for (const [k, spot] of features.beacons.entries()) {
    const [x, y] = onMap(spot.x, spot.z);
    badge(mapContext, 'beacon', x, y, 15, !found.beacons.has(k));
    label(found.beacons.has(k) ? 'Beacon · click to travel' : 'Beacon', x, y + 26);
  }
  for (const [k, gate] of features.gates.entries()) {
    const [x, y] = onMap(gate.x, gate.z);
    badge(mapContext, 'gate', x, y, 18);
    label(k === 0 ? 'Main ruin' : `Dungeon ${k + 1}`, x, y - 30);
  }
  if (features.village) {
    const [x, y] = onMap(features.village.centre.x, features.village.centre.z);
    badge(mapContext, 'village', x, y, 18);
    label('Village', x, y - 30, true);
  }
  if (worldBoss.health > 0) {
    const [x, y] = onMap(worldBoss.object.position.x, worldBoss.object.position.z);
    badge(mapContext, 'boss', x, y, 18);
    label(`${worldBossName}'s nest`, x, y - 30);
  }
  const [lx, ly] = onMap(0, 0);
  badge(mapContext, 'ship', ...onMap(flight.position.x, flight.position.z), 13);
  label('Landing pad', lx, ly + 28);
  const active = quests.find((quest) => quest.state === 'active')?.where();
  if (active) {
    const [x, y] = onMap(active.x, active.z);
    mapContext.beginPath();
    mapContext.arc(x, y, 28, 0, Math.PI * 2);
    mapContext.strokeStyle = '#ffc533';
    mapContext.lineWidth = 5;
    mapContext.stroke();
  }
  // Her, pointing where the camera looks.
  const [px, py] = onMap(player.position.x, player.position.z);
  mapContext.save();
  mapContext.translate(px, py);
  mapContext.rotate(-camYaw + Math.PI);
  mapContext.beginPath();
  mapContext.moveTo(0, -20);
  mapContext.lineTo(-14, 14);
  mapContext.lineTo(0, 6);
  mapContext.lineTo(14, 14);
  mapContext.closePath();
  mapContext.fillStyle = '#ffffff';
  mapContext.fill();
  mapContext.strokeStyle = '#1b1726';
  mapContext.lineWidth = 3;
  mapContext.stroke();
  mapContext.restore();
  // A compass rose in the corner, and the region's name.
  mapContext.save();
  mapContext.translate(size - 60, 60);
  mapContext.fillStyle = 'rgba(255, 250, 238, 0.85)';
  mapContext.beginPath();
  mapContext.arc(0, 0, 38, 0, Math.PI * 2);
  mapContext.fill();
  mapContext.fillStyle = '#3a2a1a';
  mapContext.beginPath();
  mapContext.moveTo(0, -30); mapContext.lineTo(8, 0); mapContext.lineTo(0, 30); mapContext.lineTo(-8, 0); mapContext.closePath();
  mapContext.fill();
  mapContext.font = '700 16px system-ui';
  mapContext.textAlign = 'center';
  mapContext.fillText('N', 0, -42 + 56 - 70);
  mapContext.restore();
  label(`${look.name} — the landing valley`, size / 2, 26, true);
}

function toggleMap() {
  mapScreen.hidden = !mapScreen.hidden;
  if (!mapScreen.hidden) {
    document.exitPointerLock?.();
    drawMap();
  }
}

mapCanvas.addEventListener('click', (event) => {
  const box = mapCanvas.getBoundingClientRect();
  const x = ((event.clientX - box.left) / box.width) * mapCanvas.width;
  const y = ((event.clientY - box.top) / box.height) * mapCanvas.height;
  const k = features.beacons.findIndex((spot) => {
    const [bx, by] = onMap(spot.x, spot.z);
    return Math.hypot(bx - x, by - y) < 22;
  });
  if (k < 0) return;
  if (!found.beacons.has(k)) {
    say('That beacon is not lit yet: walk up to it first', 2.5);
    return;
  }
  travelTo(k);
  mapScreen.hidden = true;
});

function travelTo(k: number) {
  if (mode !== 'foot') {
    say('Land and get out of the ship to travel', 2.5);
    return;
  }
  const spot = features.beacons[k];
  const back = Math.atan2(-spot.x, -spot.z);
  player.position.set(spot.x + Math.sin(back) * 6, 0, spot.z + Math.cos(back) * 6);
  player.position.y = ground(player.position.x, player.position.z);
  player.velocityY = 0;
  player.gliding = false;
  say(`Travelled to beacon ${k + 1}`, 2);
}

// --- One step ----------------------------------------------------------------------------

const forward = () => new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
const right = () => new THREE.Vector3(-Math.cos(camYaw), 0, Math.sin(camYaw));

type Usable = { kind: 'folk' | 'chest' | 'ship' | 'gate' | 'portal' | 'reward'; index: number };

/** What she can use from where she stands: one of the folk, a chest, the ship, a dungeon's way in or out. */
function nearby(): Usable | null {
  const p = player.position;
  if (place !== 'world') {
    const delve = dungeonOf(place);
    if (delve.done && !delve.opened && p.distanceTo(delve.dungeon.chest) < REACH + 1) return { kind: 'reward', index: place };
    if (p.distanceTo(delve.dungeon.entrance) < 4.5 || (delve.done && p.distanceTo(delve.dungeon.exit) < 4.5)) return { kind: 'portal', index: place };
    return null;
  }
  for (const [k, gate] of features.gates.entries()) if (Math.hypot(gate.x - p.x, gate.z - p.z) < 10) return { kind: 'gate', index: k };
  const folk = features.village?.folk ?? [];
  for (const [k, spot] of folk.entries()) if (Math.hypot(spot.x - p.x, spot.z - p.z) < REACH + 0.5) return { kind: 'folk', index: k };
  for (const [k, spot] of features.chests.entries()) if (!found.chests.has(k) && Math.hypot(spot.x - p.x, spot.z - p.z) < REACH) return { kind: 'chest', index: k };
  if (Math.hypot(flight.position.x - p.x, flight.position.z - p.z) < BOARD) return { kind: 'ship', index: 0 };
  return null;
}

function use(what: Usable) {
  if (what.kind === 'gate') {
    enterDungeon(what.index);
    return;
  }
  if (what.kind === 'portal') {
    leaveDungeon();
    return;
  }
  if (what.kind === 'reward') {
    const delve = dungeonOf(what.index);
    delve.opened = true;
    delve.chest.play('Open', true, true);
    flash(delve.dungeon.chest.clone().setY(1.5), '#ffd23f', 3, 0.6);
    cargo.ore += 10;
    cargo.crystal += 3;
    say(`${DUNGEONS[what.index].name}: a hull plate for the ship, 10 ore and 3 crystal!`, 4);
    return;
  }
  if (what.kind === 'folk') {
    const quest = quests.find((candidate) => candidate.giver === what.index);
    world.play('folk', what.index, 'Talk', false);
    if (!quest) return;
    if (quest.state === 'offered') {
      quest.state = 'active';
      talk(`${NAMES[what.index]} — ${quest.title}`, quest.ask);
      say(`New quest: ${quest.title}`, 2.5);
    } else if (quest.state === 'active') {
      const [done, total] = quest.goal();
      talk(NAMES[what.index], `${quest.title}: ${done} of ${total}. ${quest.ask}`);
    } else {
      talk(NAMES[what.index], quest.thanks);
    }
  } else if (what.kind === 'chest') {
    const camp = what.index < features.camps.length ? what.index : -1;
    if (camp >= 0 && campLeft(camp) > 0) {
      say('The camp still guards this chest: defeat its guards first.', 2.5);
      return;
    }
    found.chests.add(what.index);
    world.play('chest', what.index, 'Open', true);
    // Chests hold what the ship needs.
    const loot = [{ ore: 5, crystal: 1 }, { ore: 2, crystal: 2 }, { ore: 6, crystal: 0 }, { ore: 3, crystal: 1 }, { ore: 8, crystal: 1 }][what.index % 5];
    cargo.ore += loot.ore;
    cargo.crystal += loot.crystal;
    say(`Chest opened: ${loot.ore} ore${loot.crystal ? ` and ${loot.crystal} crystal` : ''}!`, 3);
  } else {
    mode = 'ship';
    player.gliding = false;
    hero.model.root.visible = false;
    chase = restCamera(flight);
    say('In the ship: L to take off', 2.5);
  }
}

function stepFoot(dt: number) {
  const p = player;
  p.sinceHit += dt;
  p.pulse = Math.max(0, p.pulse - dt);
  if (p.sinceHit > REST && !p.down) p.health = Math.min(MAX_HEALTH, p.health + REGEN * dt);
  if (p.down) {
    if (pressed.has('KeyR')) {
      p.down = false;
      p.health = MAX_HEALTH;
      p.position.copy(place === 'world' ? HOME : dungeonOf(place).dungeon.start);
      say('');
      hero.play('Idle', false, true);
    }
    return;
  }
  for (const [index, code] of ['Digit1', 'Digit2', 'Digit3', 'Digit4'].entries()) {
    if (pressed.has(code) && p.arm !== index) {
      equip(index);
      say(ARSENAL[index].name, 1.2);
    }
  }
  if (pressed.has('KeyE')) pulse();
  if (pressed.has('KeyQ')) starfall();

  // Walking, running and climbing; gliding in the air.
  const input = forward().multiplyScalar(axis(['KeyW'], ['KeyS'])).add(right().multiplyScalar(axis(['KeyD'], ['KeyA'])));
  const moving = input.lengthSq() > 0;
  const running = moving && (held.has('ShiftLeft') || held.has('ShiftRight')) && !aiming;
  const move = new THREE.Vector3();
  if (p.gliding) move.copy(forward()).multiplyScalar(GLIDE).addScaledVector(right(), axis(['KeyD'], ['KeyA']) * 3);
  else if (moving) move.copy(input).normalize().multiplyScalar(running ? RUN : WALK);
  // A blow's shove, dying away.
  move.add(p.knock);
  p.knock.multiplyScalar(Math.max(0, 1 - dt * 5));
  if (move.lengthSq() > 0) {
    const step = move.clone().multiplyScalar(dt);
    const next = p.position.clone().add(step);
    const rise = ground(next.x, next.z) - ground(p.position.x, p.position.z);
    // Steep ground is a slow climb.
    if (p.grounded && rise / Math.max(0.01, step.length()) > 1.2) next.copy(p.position).addScaledVector(step, 0.45);
    // Deep water and walls stop her; along a wall she slides.
    const free = (x: number, z: number) => (place === 'world' ? worldGround(x, z) > level - 0.6 && !world.blocked(x, z, 0.45) : dungeonOf(place).dungeon.walkable(x, z));
    if (free(next.x, next.z)) { p.position.x = next.x; p.position.z = next.z; }
    else if (free(next.x, p.position.z)) p.position.x = next.x;
    else if (free(p.position.x, next.z)) p.position.z = next.z;
  }

  const gravity = flightWorld.gravity;
  const floor = ground(p.position.x, p.position.z);
  if (pressed.has('Space')) {
    if (p.grounded) {
      p.velocityY = JUMP;
      p.grounded = false;
      p.busy = 0.9;
      hero.play('Jump', true, true, 0.08);
    } else if (!p.gliding && p.position.y - floor > 2.5) {
      p.gliding = true;
    } else if (p.gliding) {
      p.gliding = false;
    }
  }
  p.velocityY -= gravity * dt * (p.gliding ? 0.15 : 1);
  if (p.gliding) p.velocityY = Math.max(p.velocityY, -GLIDE_SINK);
  p.position.y += p.velocityY * dt;
  if (p.position.y <= floor) {
    p.position.y = floor;
    p.velocityY = 0;
    p.grounded = true;
    p.gliding = false;
  } else if (p.position.y > floor + 0.3) {
    p.grounded = false;
  }
  wings.visible = p.gliding;

  // Facing: where she aims or glides, or where she walks.
  const shooting = aiming || firing;
  const goal = shooting || p.gliding ? camYaw : moving ? Math.atan2(move.x, move.z) : p.facing;
  let turn = goal - p.facing;
  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  p.facing += turn * Math.min(1, dt * 12);

  p.cooldown = Math.max(0, p.cooldown - dt);
  if (firing && p.cooldown <= 0 && !p.gliding && mapScreen.hidden) {
    p.cooldown = ARSENAL[p.arm].cooldown;
    hero.play('Shoot', true, true, 0.05);
    hero.mixer.update(0);
    hero.model.root.updateMatrixWorld(true);
    fire();
    p.busy = Math.min(ARSENAL[p.arm].cooldown, hero.length('Shoot'));
  }

  p.busy = Math.max(0, p.busy - dt);
  if (p.busy <= 0) {
    if (p.gliding) hero.play('Aim');
    else if (!p.grounded) hero.play('Jump', true);
    else if (shooting) hero.play(moving ? (running ? 'RunAim' : 'WalkAim') : 'Aim');
    else hero.play(moving ? (running ? 'Run' : 'Walk') : 'Idle');
  }

  // Shards, beacons and the ruin, just by getting there.
  features.shards.forEach((spot, k) => {
    if (found.shards.has(k) || place !== 'world') return;
    if (Math.hypot(spot.x - p.position.x, spot.z - p.position.z) < TAKE_SHARD && Math.abs(ground(spot.x, spot.z) + 1.3 - p.position.y) < 3) {
      found.shards.add(k);
      const shard = world.item('shard', k);
      if (shard) shard.userData.taken = true;
      say(`Star shard ${found.shards.size}/${features.shards.length}`, 1.5);
    }
  });
  features.beacons.forEach((spot, k) => {
    if (found.beacons.has(k) || place !== 'world') return;
    if (Math.hypot(spot.x - p.position.x, spot.z - p.position.z) < LIGHT_BEACON) {
      found.beacons.add(k);
      const lit = world.item('beacon', k)?.getObjectByName('lit');
      if (lit) lit.visible = true;
      say(`Beacon lit (${found.beacons.size}/${features.beacons.length}) — travel to it from the map (M)`, 3.5);
    }
  });
  const ruin = features.gates[0];
  if (place === 'world' && ruin && !found.ruin && Math.hypot(ruin.x - p.position.x, ruin.z - p.position.z) < 18) {
    found.ruin = true;
    say('The main ruin: F at the door to go down', 3);
  }

  // Talk, open, board.
  const what = nearby();
  const PROMPTS = {
    folk: (k: number) => `Talk to ${NAMES[k]}`, chest: () => 'Open the chest', ship: () => 'Board the ship',
    gate: (k: number) => `Enter ${DUNGEONS[k].name}`, portal: () => 'Leave the dungeon', reward: () => 'Open the reward',
  };
  hud.prompt.innerHTML = what ? `<kbd>F</kbd> ${PROMPTS[what.kind](what.index)}` : '';
  if (pressed.has('KeyF')) {
    if (!hud.dialog.hidden) hud.dialog.hidden = true;
    else if (what) use(what);
  }
  if (!hud.dialog.hidden && what?.kind !== 'folk' && moving) hud.dialog.hidden = true;
}

let wasInSpace = false;
function stepShip(dt: number) {
  flight = stepFlight(flight, readFlight(), dt, flightWorld);
  const inSpace = flight.mode === 'space';
  if (inSpace && !wasInSpace) say('Space! Click or F fires · mine asteroids · fly through the golden motes', 5);
  wasInSpace = inSpace;
  if (flight.mode === 'takeoff') autoLand = null;
  const PROMPTS: Record<typeof flight.mode, string> = {
    landed: '<kbd>F</kbd> Get out · <kbd>L</kbd> Take off',
    takeoff: '',
    flight: autoLand ? `Coming down to land${autoLand === 'leave' ? ' and get out' : ''}… <kbd>${autoLand === 'leave' ? 'F' : 'L'}</kbd> cancel` : '<kbd>F</kbd> Land and get out · <kbd>L</kbd> Land',
    landing: autoLand === 'leave' ? 'Landing, then out…' : 'Landing… <kbd>F</kbd> get out once down · <kbd>Space</kbd> pull up',
    space: autoLand ? 'Going back down to land… <kbd>L</kbd> cancel' : allAboard ? '<kbd>J</kbd> Leave TRAPPIST-1 e for good · <kbd>L</kbd> Go back down' : '<kbd>L</kbd> Go back down and land',
  };
  hud.prompt.innerHTML = flight.notice || PROMPTS[flight.mode];
  const leave = flight.mode === 'landed' && (pressed.has('KeyF') || autoLand === 'leave');
  if (flight.mode === 'landed') autoLand = null;
  if (leave) {
    mode = 'foot';
    const side = new THREE.Vector3(-Math.cos(flight.yaw), 0, Math.sin(flight.yaw)).multiplyScalar(7);
    player.position.set(flight.position.x + side.x, 0, flight.position.z + side.z);
    player.position.y = ground(player.position.x, player.position.z);
    player.facing = flight.yaw;
    camYaw = flight.yaw;
    hero.model.root.visible = true;
  }
}

// --- Drawing ---------------------------------------------------------------------------------

function draw(dt: number, seconds: number) {
  const root = ship.model.root;
  root.position.set(flight.position.x, flight.position.y, flight.position.z);
  root.rotation.set(-flight.pitch, flight.yaw, -flight.roll, 'YXZ');
  ship.play(CLIP_FOR[flight.mode], flight.mode === 'takeoff' || flight.mode === 'landing');
  ship.mixer.update(dt);
  root.getObjectByName('engine')!.scale.setScalar(flight.mode === 'landed' ? 0.4 : 0.8 + flight.speed / 220);

  hero.model.root.position.copy(player.position);
  hero.model.root.rotation.y = player.facing;
  hero.mixer.update(dt);
  weapon?.mixer.update(dt);

  // The camera: over her shoulder on foot, behind the ship in it.
  let out = 0;
  if (mode === 'foot') {
    const direction = new THREE.Vector3(Math.sin(camYaw) * Math.cos(camPitch), -Math.sin(camPitch), Math.cos(camYaw) * Math.cos(camPitch));
    const target = player.position.clone().add(new THREE.Vector3(0, 1.6, 0)).addScaledVector(right(), follow.shoulder);
    // How far back the view is free: of walls in a dungeon; of trunks,
    // crowns and the land itself outside. The camera rests a little short of
    // the first thing in the way and never goes behind it; every change of
    // distance eases (camera-follow.ts) instead of jumping in one frame.
    const reachable = Math.max(follow.zoom, aiming ? FOLLOW.zoom.aim : player.gliding ? FOLLOW.zoom.glide : FOLLOW.zoom.walk);
    let clear = reachable;
    let limit = Infinity;
    const probe = new THREE.Vector3();
    const dungeon = place === 'world' ? null : dungeonOf(place).dungeon;
    for (let d = 0.8; d <= reachable; d += 0.35) {
      probe.copy(target).addScaledVector(direction, -d);
      const blocked = dungeon
        ? !dungeon.walkable(probe.x, probe.z)
        : world.inCrown(probe.x, probe.y, probe.z) || world.blocked(probe.x, probe.z, 0.25) || probe.y < worldGround(probe.x, probe.z) + 0.3;
      if (blocked) {
        clear = Math.max(FOLLOW.reachMin, d - 0.5);
        limit = Math.max(FOLLOW.reachMin, d - 0.15);
        break;
      }
    }
    follow = stepFollow(follow, { aiming, gliding: player.gliding }, clear, dt, limit);
    camera.position.copy(target).addScaledVector(direction, -follow.reach);
    const floor = ground(camera.position.x, camera.position.z) + 0.4;
    if (camera.position.y < floor) camera.position.y = floor;
    camera.lookAt(target.addScaledVector(direction, 10));
    camera.fov = damp(camera.fov, settings.fov * (aiming ? FOLLOW.aimFov : 1), FOLLOW.fovRate, dt);
  } else {
    chase = stepCamera(chase, flight, dt, flightWorld);
    camera.position.set(chase.position.x, chase.position.y, chase.position.z);
    camera.lookAt(chase.target.x, chase.target.y, chase.target.z);
    camera.fov = chase.fov;
    out = Math.min(1, Math.max(0, (flight.position.y - flightWorld.ceiling * 0.35) / (flightWorld.ceiling * 0.65)));
  }
  if (shake > 0) {
    camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(shake * 0.7));
    shake = Math.max(0, shake - dt * 1.5);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  hud.crosshair.hidden = mode !== 'foot';
  updateEffects(dt);
  drawBossBar();
  if (place !== 'world') {
    drawHud(dt, []);
    return;
  }

  const haze = world.haze(out, camera.position.x, camera.position.z);
  scene.background = haze;
  scene.fog = new THREE.Fog(haze, scenery.haze * 0.18, scenery.haze + out * 30_000);
  (stars.material as THREE.PointsMaterial).opacity = out;
  stars.position.copy(camera.position);
  star.position.copy(camera.position).addScaledVector(STAR_DIRECTION, SKY);
  star.lookAt(camera.position);
  const focus = mode === 'foot' ? player.position : root.position;
  sun.position.copy(focus).addScaledVector(STAR_DIRECTION, 100);
  sun.target.position.copy(focus);
  world.update(camera, focus, out, seconds);
  drawHud(dt, marks());
}

const bossBar = $<HTMLDivElement>('bossbar');
/** A guardian's name and health across the top of the screen, while it fights. */
function drawBossBar() {
  const boss = here().find((enemy) => enemy.boss && enemy.awake && enemy.health > 0 && enemy.object.position.distanceTo(player.position) < 70);
  bossBar.hidden = !boss;
  if (!boss) return;
  const raiding = boss === worldBoss && !raid.home;
  bossBar.querySelector('.name')!.textContent = `${boss.bar.firstElementChild?.textContent ?? boss.entry.name}${raiding ? ' — drive it off' : boss.enraged ? ' — enraged' : ''}`;
  bossBar.querySelector('.numbers')!.textContent = raiding ? `${Math.round(Math.min(raid.scare, DRAGON.scare))} / ${DRAGON.scare} to drive it off · beat it at its nest` : `${Math.ceil(boss.health)} / ${boss.most}`;
  (bossBar.querySelector('.fill > div') as HTMLDivElement).style.width = `${(raiding ? 1 - Math.min(1, raid.scare / DRAGON.scare) : boss.health / boss.most) * 100}%`;
}

function drawHud(dt: number, list: Mark[]) {
  // The HUD.
  hud.health.style.width = `${(player.health / MAX_HEALTH) * 100}%`;
  hud.healthText.textContent = `${Math.round(player.health)} / ${MAX_HEALTH}`;
  slots.forEach((slot, k) => slot.classList.toggle('active', k === player.arm));
  hud.loadout.hidden = mode !== 'foot';
  hud.cargo.hidden = mode === 'foot';
  if (mode === 'ship') {
    hud.cargo.innerHTML = `<p>Ore ${cargo.ore}</p><p>Crystal ${cargo.crystal}</p><p>Solar ${cargo.solar} kWh</p><p class="goal">${flight.mode} · ${Math.round(flight.speed)} m/s · ${Math.round(flight.position.y - ground(flight.position.x, flight.position.z))} m up</p>`;
  }
  hud.skillE.style.setProperty('--left', String(player.pulse / PULSE.cooldown));
  hud.skillQ.style.setProperty('--left', String(1 - player.charge / STARFALL.charge));
  hud.skillQ.classList.toggle('ready', player.charge >= STARFALL.charge);
  hud.counters.textContent = `Shards ${found.shards.size}/${features.shards.length} · Chests ${found.chests.size}/${features.chests.length} · Beacons ${found.beacons.size}/${features.beacons.length} · Dungeons ${[...delves.values()].filter((delve) => delve.done).length}/${features.gates.length}`;
  drawMarks(list);
  drawMinimap(list);
  messageFor = Math.max(0, messageFor - dt);
  if (messageFor === 0) hud.message.textContent = '';
}

// --- Loop -----------------------------------------------------------------------------------

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

hud.planet.textContent = look.name;
const clock = new THREE.Clock();
let seconds = 0;
let questTimer = 0;

/** One step of the game, `dt` seconds long. */
function frame(dt: number) {
  // The end of the world plays out on its own; after it, nothing moves.
  if (ending) {
    if (!ending.update(dt)) ending = null;
    pressed.clear();
    return;
  }
  if (over) {
    pressed.clear();
    return;
  }
  seconds += dt;
  if (dt > 0) {
    herVelocity.copy(player.position).sub(herBefore).divideScalar(dt);
    if (herVelocity.lengthSq() > 400) herVelocity.set(0, 0, 0);
    herBefore.copy(player.position);
  }
  if (pressed.has('KeyT')) {
    taskDetail.hidden = !taskDetail.hidden;
    updateTaskBar();
  }
  if (pressed.has('KeyJ')) leave();
  if (pressed.has('KeyH')) hud.help.hidden = !hud.help.hidden;
  if (pressed.has('KeyM')) toggleMap();
  if (pressed.has('KeyO')) toggleSettings();
  // The mouse turns the camera on foot; in the ship the flight sets it.
  mouse.yaw = camYaw;
  mouse.pitch = camPitch;
  if (mode === 'foot') stepLook(mouse, settings, dt);
  else mouse.pendingX = mouse.pendingY = 0;
  camYaw = mouse.yaw;
  camPitch = mouse.pitch;
  if (mode === 'foot') stepFoot(dt);
  else stepShip(dt);
  scorch(dt);
  updateShots(dt);
  updateOrbs(dt);
  updateEnemies(dt);
  if (place === 'world') updateSpace(dt, seconds);
  else updateDungeon(dt, seconds);
  draw(dt, seconds);
  questTimer -= dt;
  if (questTimer <= 0) {
    questTimer = 0.25;
    updateQuests();
    respawnPacks();
  }
  pressed.clear();
}
renderer.setAnimationLoop(() => {
  frame(Math.min(0.05, clock.getDelta()));
  renderer.render(activeScene(), camera);
});

// Real gravity and the height where space starts, from the catalog.
loadCatalog()
  .then((planets) => {
    const planet = planets.find((candidate) => candidate.pl_name === look.name);
    if (!planet) return;
    const physics = planetPhysics(planet);
    flightWorld = { gravity: physics.gravity, ceiling: physics.ceiling, ground: worldGround };
    catalogPlanet = planet;
    tasks = null;
    hud.planet.textContent = `${look.name} · ${physics.gravityG?.toFixed(2) ?? '1'} g`;
  })
  .catch(() => undefined);

// For checking the page from the console or from a test.
Object.assign(window, {
  __play: {
    get player() { return { ...player, position: player.position.toArray().map(Math.round) }; },
    get ship() { return { mode: flight.mode, y: Math.round(flight.position.y) }; },
    get mode() { return mode; },
    get place() { return place; },
    get delve() { if (place === 'world') return null; const d = dungeonOf(place); return { cleared: d.cleared, done: d.done, opened: d.opened, left: here().filter((e) => e.health > 0).map((e) => [e.entry.id, Math.round(e.health), e.state]) }; },
    enter: (k: number) => enterDungeon(k),
    /** How much of the ground near her is taken by tree trunks, and whether the camera is in a crown. */
    get forest() {
      let trunks = 0;
      for (let dx = -20; dx <= 20; dx += 0.5) for (let dz = -20; dz <= 20; dz += 0.5) if (world.blocked(player.position.x + dx, player.position.z + dz, 0.45)) trunks++;
      return { trunks, cameraInCrown: world.inCrown(camera.position.x, camera.position.y, camera.position.z), camera: camera.position.toArray().map(Math.round) };
    },
    /** Wounds the guardian where she is, to try its later phases. */
    hurtGuardian: (amount: number) => { const boss = enemies.find((enemy) => enemy.boss && enemy.area === place && enemy.health > 0); if (boss) hurt(boss, amount, new THREE.Vector3()); },
    killHall: () => { for (const enemy of here()) if (enemy.health > 0 && (enemy.hall === dungeonOf(place as number).cleared.findIndex((c) => !c))) hurt(enemy, 9999, new THREE.Vector3()); },
    weapon: (k: number) => equip(k),
    get found() { return { shards: found.shards.size, chests: found.chests.size, beacons: found.beacons.size, ruin: found.ruin }; },
    get cargo() { return { ...cargo }; },
    get dragon() { return { state: raid.state, alt: Math.round(raid.alt), home: raid.home, scare: Math.round(raid.scare), next: Math.round(raid.next), health: Math.round(worldBoss.health), at: worldBoss.object.position.toArray().map(Math.round), nest: worldBossAt }; },
    raidNow: () => { raid.next = 0; },
    get tasks() { return { progress: progress(), ready: ready(taskList(), progress()), ending: ending !== null, over }; },
    leave: () => startEnding(),
    burn: (amount: number) => world.burn(amount),
    give: (ore: number, crystal: number, solar: number) => { cargo.ore += ore; cargo.crystal += crystal; cargo.solar += solar; },
    get motes() { return space.motes.filter((mote) => mote.gone <= 0).map((mote) => mote.object.position.toArray().map(Math.round)); },
    get rocks() { return space.rocks.filter((rock) => rock.gone <= 0).map((rock) => ({ at: rock.centre.toArray().map(Math.round), radius: Math.round(rock.radius), health: rock.health })); },
    get quests() { return quests.map((quest) => ({ title: quest.title, state: quest.state, goal: quest.goal() })); },
    get features() { return features; },
    get enemies() { return enemies.map((enemy) => ({ id: enemy.entry.id, camp: enemy.camp, rank: enemy.rank, state: enemy.state, health: Math.round(enemy.health), at: enemy.object.position.toArray().map(Math.round) })); },
    hold: (...codes: string[]) => { held.clear(); for (const code of codes) held.add(code); },
    tap: (code: string) => pressed.add(code),
    look: (yaw: number, pitch = 0.15) => { camYaw = yaw; camPitch = pitch; },
    fire: (on: boolean) => { firing = on; },
    aim: (on: boolean) => { aiming = on; },
    start: () => { startScreen.hidden = true; },
    teleport: (x: number, z: number, up = 0) => { player.position.set(x, ground(x, z) + up, z); player.grounded = up === 0; },
    /** Runs the game this many seconds at once, for a page in the background. */
    advance: (time: number) => { for (let t = 0; t < time; t += 1 / 60) frame(1 / 60); },
    aimShip: (x: number, y: number, z: number) => {
      const dx = x - flight.position.x; const dy = y - flight.position.y; const dz = z - flight.position.z;
      flight = { ...flight, yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), speed: 0 };
    },
    placeShip: (x: number, y: number, z: number) => { flight = { ...flight, mode: 'space', position: { x, y, z }, speed: 0, vertical: 0 }; mode = 'ship'; hero.model.root.visible = false; },
    /** The camera on foot and the mouse filter, for checking the camera fixes. */
    get camera() { return { yaw: camYaw, pitch: camPitch, zoom: follow.zoom, shoulder: follow.shoulder, reach: follow.reach, fov: camera.fov, dropped: mouse.dropped, position: camera.position.toArray() }; },
    /** Feeds one mouse event as the browser would send it. */
    mouse: (dx: number, dy: number) => feedLook(mouse, dx, dy),
    get settings() { return { ...settings }; },
    set: (change: Partial<Settings>) => changeSettings(change),
  },
});

// Hooks for the develop-web-game skill's Playwright client: the state of the
// game as text, and a way to step it by a fixed time.
function renderGameToText(): string {
  const near = enemies
    .filter((enemy) => enemy.health > 0 && enemy.area === place && enemy.object.position.distanceTo(player.position) < 60)
    .sort((a, b) => a.object.position.distanceTo(player.position) - b.object.position.distanceTo(player.position))
    .slice(0, 8)
    .map((enemy) => ({ id: enemy.entry.id, state: enemy.state, health: Math.round(enemy.health), at: enemy.object.position.toArray().map((v) => Math.round(v * 10) / 10) }));
  return JSON.stringify({
    note: 'metres; +Y up; yaw 0 looks along +Z and grows towards +X; the landing pad is near the origin',
    mode,
    place,
    started: startScreen.hidden,
    pointerLocked: locked(),
    panels: { settings: !settingsPanel.hidden, map: !mapScreen.hidden, help: !hud.help.hidden },
    player: {
      at: player.position.toArray().map((v) => Math.round(v * 100) / 100),
      facing: Math.round(player.facing * 1000) / 1000,
      health: Math.round(player.health),
      grounded: player.grounded,
      gliding: player.gliding,
      down: player.down,
      weapon: ARSENAL[player.arm].name,
      clip: hero.current,
    },
    camera: {
      yaw: Math.round(camYaw * 1000) / 1000,
      pitch: Math.round(camPitch * 1000) / 1000,
      zoom: Math.round(follow.zoom * 100) / 100,
      reach: Math.round(follow.reach * 100) / 100,
      fov: Math.round(camera.fov * 10) / 10,
      at: camera.position.toArray().map((v) => Math.round(v * 100) / 100),
      spikesDropped: mouse.dropped,
    },
    settings,
    ship: { mode: flight.mode, altitude: Math.round(flight.position.y) },
    enemiesNear: near,
    tasks: progress(),
  });
}
Object.assign(window, {
  render_game_to_text: renderGameToText,
  advanceTime: (ms: number) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) frame(1 / 60);
    renderer.render(activeScene(), camera);
  },
});
