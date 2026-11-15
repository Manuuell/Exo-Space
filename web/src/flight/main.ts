// Flight test page: the ship flown in third person over one of the three
// planets and up into space, with the jump runes. Development only, like the
// model viewers; the game will take the same logic from src/content/.
// Open it with `npm run dev` at /flight.html?planet=e|b|h.

import * as THREE from 'three';
import { CAMERA, restCamera, stepCamera } from '../content/chase-camera.ts';
import { NO_INPUT, altitude, landedAt, stepFlight } from '../content/flight.ts';
import type { FlightInput, FlightState, FlightWorld } from '../content/flight.ts';
import { planetPhysics } from '../content/planet-physics.ts';
import type { PlanetPhysics } from '../content/planet-physics.ts';
import { PLAYABLE } from '../content/playable.ts';
import { checkJump, grantRune, jump, loadShip, saveShip } from '../content/ship.ts';
import { MOON_FROM_EARTH_DEG, skyFrom } from '../content/system.ts';
import type { SkyBody } from '../content/system.ts';
import { rgbToHex, starColor } from '../data/derived.ts';
import { loadCatalog } from '../data/exoplanets.ts';
import type { Exoplanet } from '../data/exoplanets.ts';
import { planetWorld } from '../models/planet-scene.ts';
import type { PlanetWorld } from '../models/planet-scene.ts';
import { mix, planetScenery } from '../models/planet-look.ts';
import { homeward } from '../models/ship-homeward.ts';
import './flight.css';

/** Days of the planet's year that pass in one second of flying. */
const DAYS_PER_SECOND = 0.01;
// The sky is drawn as if the planet always showed the same face to its star:
// the star stays at one place overhead and the sister planets drift around
// it along the line of their orbits. That is a choice of this page, not a
// catalog value: the catalog does not say how any planet spins.
const STAR_HEIGHT = (22 * Math.PI) / 180;
const ORBITS_SLANT = (25 * Math.PI) / 180;
/** Where the star is drawn: ahead of the ship at take-off, this high up. */
const STAR_AT = new THREE.Vector3(0, Math.sin(STAR_HEIGHT), Math.cos(STAR_HEIGHT));
/** The direction the line of the orbits leaves the star along. */
const ORBITS_ALONG = new THREE.Vector3(1, 0, 0).multiplyScalar(Math.cos(ORBITS_SLANT))
  .addScaledVector(new THREE.Vector3(0, Math.cos(STAR_HEIGHT), -Math.sin(STAR_HEIGHT)), Math.sin(ORBITS_SLANT));
/** How far away the star and the sister planets are drawn, in metres. */
const SKY_DISTANCE = 20_000;
const STEP = 1 / 60;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('view');
// A logarithmic depth buffer: the land, the liquid and the globe meet tens
// of kilometres away without flickering.
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.5, SKY_DISTANCE * 3);
const fill = new THREE.HemisphereLight('#ffffff', '#5b6072', 1.3);
const sun = new THREE.DirectionalLight('#ffffff', 2);
scene.add(fill, sun, sun.target);

// Keys held down, and keys pressed since the last step.
const held = new Set<string>();
const pressed = new Set<string>();
const GAME_KEYS = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyC', 'ShiftLeft', 'ShiftRight', 'KeyL', 'Enter', 'KeyJ', 'KeyR']);
window.addEventListener('keydown', (event) => {
  if (!GAME_KEYS.has(event.code)) return;
  event.preventDefault();
  if (!held.has(event.code)) pressed.add(event.code);
  held.add(event.code);
});
window.addEventListener('keyup', (event) => held.delete(event.code));
window.addEventListener('blur', () => held.clear());

const axis = (plus: string[], minus: string[]) => (plus.some((key) => held.has(key)) ? 1 : 0) - (minus.some((key) => held.has(key)) ? 1 : 0);

function readInput(): FlightInput {
  return {
    ...NO_INPUT,
    throttle: axis(['KeyW'], ['KeyS']),
    turn: axis(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']),
    pitch: axis(['ArrowUp'], ['ArrowDown']),
    lift: axis(['Space'], ['KeyC']),
    boost: held.has('ShiftLeft') || held.has('ShiftRight'),
    toggleLanding: pressed.has('KeyL') || pressed.has('Enter'),
  };
}

interface World {
  planet: Exoplanet;
  physics: PlanetPhysics;
  flight: FlightWorld;
  /** The planet drawn from its data: land, liquid, props, sky and globe. */
  view: PlanetWorld;
  bodies: { body: SkyBody; disc: THREE.Mesh; label: HTMLDivElement }[];
}

let catalog: Exoplanet[] = [];
let log = loadShip(window.localStorage);
let world: World;
let ship: FlightState;
let view = restCamera(landedAt(0, 0, { gravity: 9.8, ceiling: 1500, ground: () => 0 }));
let days = 0;
let message = '';
let messageFor = 0;
/** Seconds left of the jump's white-out, and the planet it leads to. */
let jumping = 0;
/** Seconds since the page started, for what moves on its own (the lava). */
let elapsed = 0;

// The ship, Homeward, and the clip it plays in each mode of the flight.
const shipBuilt = homeward.create();
const shipModel = shipBuilt.root;
scene.add(shipModel);
const shipMixer = new THREE.AnimationMixer(shipModel);
const shipActions = new Map(shipBuilt.clips.map((clip) => [clip.name, shipMixer.clipAction(clip)]));
const CLIP_FOR: Record<FlightState['mode'], string> = { landed: 'Idle', takeoff: 'Takeoff', flight: 'Fly', landing: 'Land', space: 'Fly' };
let shipClip = '';

function playShip(name: string) {
  if (name === shipClip) return;
  const next = shipActions.get(name);
  if (!next) return;
  // Taking off and landing play once and hold their last pose.
  const once = name === 'Takeoff' || name === 'Land';
  next.reset();
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
  next.clampWhenFinished = once;
  next.play();
  const previous = shipActions.get(shipClip);
  if (previous) next.crossFadeFrom(previous, 0.25, false);
  shipClip = name;
}
const stars = (() => {
  const positions = new Float32Array(1500 * 3);
  for (let n = 0; n < 1500; n++) {
    // Evenly over the sphere, from a fixed sequence: the same sky every time.
    const y = 1 - (2 * (n + 0.5)) / 1500;
    const ring = Math.sqrt(1 - y * y);
    const angle = n * 2.399963;
    positions.set([Math.cos(angle) * ring * SKY_DISTANCE * 1.5, y * SKY_DISTANCE * 1.5, Math.sin(angle) * ring * SKY_DISTANCE * 1.5], n * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  points.frustumCulled = false;
  return points;
})();
scene.add(stars);
const labels = $<HTMLDivElement>('labels');

function buildWorld(name: string): World {
  const planet = catalog.find((candidate) => candidate.pl_name === name);
  if (!planet) throw new Error(`${name} is not in the catalog`);
  const physics = planetPhysics(planet);
  // The planet's look comes from its catalog values; a missing one is
  // replaced by a neutral value inside planetScenery.
  const view = planetWorld({
    name,
    eqTempK: physics.temperatureK ?? Number.NaN,
    gravityG: physics.gravityG ?? Number.NaN,
    starTeffK: planet.st_teff ?? Number.NaN,
    radiusEarth: planet.pl_rade ?? Number.NaN,
  });
  const ground = view.ground;
  const { scenery } = view;
  sun.color.set(scenery.sun);
  fill.color.set(scenery.fill[0]);
  fill.groundColor.set(scenery.fill[1]);

  const light = starColor(planet);
  const starHex = light ? rgbToHex(light) : '#ffffff';
  const bodies = skyFrom(planet, catalog, 0).bodies.map((body) => {
    // Each sister planet in the colour of its own land, from its own data.
    const sister = catalog.find((candidate) => candidate.pl_name === body.name);
    const tone = body.kind === 'star' ? starHex : mix(planetScenery({ eqTempK: sister?.pl_eqt ?? Number.NaN }).ground.low, '#ffffff', 0.25);
    const material = new THREE.MeshBasicMaterial({ color: tone, fog: false, transparent: true });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), material);
    disc.frustumCulled = false;
    scene.add(disc);
    const label = document.createElement('div');
    label.className = 'body-label';
    labels.append(label);
    return { body, disc, label };
  });
  scene.add(view.group);
  return { planet, physics, flight: { gravity: physics.gravity, ceiling: physics.ceiling, ground }, view, bodies };
}

function leaveWorld(old: World) {
  scene.remove(old.view.group);
  for (const { disc, label } of old.bodies) {
    scene.remove(disc);
    label.remove();
  }
}

/**
 * Where a body is in the sky over the landing site: as far from the star,
 * along the line of the orbits, as it is in the system.
 */
function overhead(direction: SkyBody['direction'], star: SkyBody['direction']): THREE.Vector3 {
  const angle = Math.atan2(direction.x * star.z - direction.z * star.x, direction.x * star.x + direction.z * star.z);
  return STAR_AT.clone().multiplyScalar(Math.cos(angle)).addScaledVector(ORBITS_ALONG, Math.sin(angle));
}

/** The direction of the star among these bodies; any fixed one when the star is missing. */
function starOf(bodies: SkyBody[]): SkyBody['direction'] {
  return bodies.find((body) => body.kind === 'star')?.direction ?? { x: 1, y: 0, z: 0 };
}

function say(text: string) {
  message = text;
  messageFor = 3.5;
}

function tryJump() {
  if (ship.mode !== 'space') return say(`The jump is made from space: climb above ${world.physics.ceiling.toLocaleString('en')} m.`);
  const check = checkJump(log);
  if (!check.ok) return say(check.reason);
  jumping = 1.6;
}

function finishJump() {
  log = jump(log);
  saveShip(window.localStorage, log);
  leaveWorld(world);
  world = buildWorld(log.at);
  ship = { ...ship, position: { x: 0, y: world.physics.ceiling + 300, z: 0 }, mode: 'space', pitch: -0.3, speed: 120 };
  view = restCamera(ship);
  days = 0;
  say(`Arrived at ${log.at}.`);
}

function step() {
  if (pressed.has('KeyR')) {
    // A stand-in for completing the ruins of this planet.
    const before = log.runes.length;
    log = grantRune(log, log.at);
    saveShip(window.localStorage, log);
    say(log.runes.length > before ? `Jump rune of ${log.at} earned.` : `The ruins of ${log.at} have already given their rune.`);
  }
  if (pressed.has('KeyJ') && jumping === 0) tryJump();
  ship = stepFlight(ship, readInput(), STEP, world.flight);
  pressed.clear();
  days += STEP * DAYS_PER_SECOND;
  messageFor = Math.max(0, messageFor - STEP);
  if (jumping > 0) {
    jumping = Math.max(0, jumping - STEP);
    if (jumping === 0) finishJump();
  }
}

const hud = {
  planet: $<HTMLHeadingElement>('planet'),
  real: $<HTMLParagraphElement>('real'),
  derived: $<HTMLParagraphElement>('derived'),
  gauges: $<HTMLParagraphElement>('gauges'),
  rune: $<HTMLParagraphElement>('rune'),
  notice: $<HTMLParagraphElement>('notice'),
  flash: $<HTMLDivElement>('flash'),
};
const number = (value: number | null, digits = 2) => (value === null ? 'unknown' : value.toLocaleString('en', { maximumFractionDigits: digits }));
const MODES: Record<FlightState['mode'], string> = { landed: 'Landed', takeoff: 'Taking off', flight: 'Flying', landing: 'Landing', space: 'In space' };

function draw(frame: number) {
  const { physics, flight } = world;
  // How far into space the ship is: 0 on the ground, 1 at the ceiling.
  const out = Math.min(1, Math.max(0, (ship.position.y - flight.ceiling * 0.35) / (flight.ceiling * 0.65)));
  const haze = world.view.haze(out);
  scene.background = haze;
  const reach = world.view.scenery.haze;
  scene.fog = new THREE.Fog(haze, reach * 0.18, reach + out * 30_000);
  (stars.material as THREE.PointsMaterial).opacity = out;

  shipModel.position.set(ship.position.x, ship.position.y, ship.position.z);
  shipModel.rotation.set(-ship.pitch, ship.yaw, -ship.roll, 'YXZ');
  playShip(CLIP_FOR[ship.mode]);
  shipMixer.update(frame);
  const engine = shipModel.getObjectByName('engine')!;
  engine.scale.setScalar(ship.mode === 'landed' ? 0.4 : 0.8 + ship.speed / 220);
  // The rune glows in its dome while the ship holds one.
  shipModel.getObjectByName('rune')!.visible = log.runes.length > 0;

  view = stepCamera(view, ship, frame, flight);
  camera.position.set(view.position.x, view.position.y, view.position.z);
  camera.lookAt(view.target.x, view.target.y, view.target.z);
  camera.fov = view.fov;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  stars.position.copy(camera.position);
  elapsed += frame;
  world.view.update(camera, ship.position, out, elapsed);

  const moving = skyFrom(world.planet, catalog, days).bodies;
  const star = starOf(moving);
  const projected = new THREE.Vector3();
  for (const entry of world.bodies) {
    const body = moving.find((candidate) => candidate.name === entry.body.name) ?? entry.body;
    const direction = overhead(body.direction, star);
    entry.disc.position.copy(camera.position).addScaledVector(direction, SKY_DISTANCE);
    entry.disc.scale.setScalar(SKY_DISTANCE * Math.tan(((body.sizeDeg / 2) * Math.PI) / 180));
    entry.disc.lookAt(camera.position);
    // The star always shows; the planets come out as the air thins.
    (entry.disc.material as THREE.MeshBasicMaterial).opacity = body.kind === 'star' ? 1 : 0.25 + 0.75 * out;
    if (body.kind === 'star') {
      sun.position.copy(ship.position as THREE.Vector3Like).addScaledVector(direction, 100);
      sun.target.position.copy(ship.position as THREE.Vector3Like);
    }
    projected.copy(entry.disc.position).project(camera);
    const seen = projected.z < 1 && Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && direction.y > -0.02 && out > 0.3;
    entry.label.hidden = !seen;
    if (seen) {
      entry.label.style.left = `${((projected.x + 1) / 2) * 100}%`;
      entry.label.style.top = `${((1 - projected.y) / 2) * 100}%`;
      const wide = body.kind === 'star' ? '' : ` · ${number(body.sizeDeg / MOON_FROM_EARTH_DEG)} Moons wide`;
      entry.label.textContent = `${body.name} · ${number(body.distanceKm / 1e6)} million km${wide}`;
    }
  }

  hud.planet.textContent = physics.name;
  hud.real.textContent = `Real data: gravity ${number(physics.gravityG)} g · equilibrium temperature ${number(physics.temperatureK, 1)} K · year ${number(physics.yearDays)} days`;
  hud.derived.textContent = `Derived: space starts at ${number(physics.ceiling, 0)} m, if the air were like Earth's · day ${number(days)} of this flight`;
  hud.gauges.textContent = `${MODES[ship.mode]} · speed ${number(ship.speed, 0)} m/s · height ${number(altitude(ship, flight), 0)} m`;
  const check = checkJump(log);
  hud.rune.textContent = check.ok ? `Jump rune ready: ${check.to}` : log.runes.length > 0 ? `Runes held: ${log.runes.join(', ')}` : 'No jump rune';
  hud.notice.textContent = messageFor > 0 ? message : ship.notice;
  hud.flash.style.opacity = jumping > 0 ? String(Math.sin((1 - jumping / 1.6) * Math.PI) ** 0.5) : '0';

  renderer.render(scene, camera);
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

loadCatalog()
  .then((planets) => {
    catalog = planets;
    const asked = new URLSearchParams(location.search).get('planet');
    const start = PLAYABLE.find((name) => name.endsWith(` ${asked}`));
    if (start) log = { ...log, at: start };
    world = buildWorld(log.at);
    ship = landedAt(0, 0, world.flight);
    view = restCamera(ship);

    let before = performance.now();
    let owed = 0;
    renderer.setAnimationLoop((now) => {
      const frame = Math.min(0.1, (now - before) / 1000);
      before = now;
      owed += frame;
      while (owed >= STEP) {
        step();
        owed -= STEP;
      }
      draw(frame);
    });
    // For checking the page from the console or from a test.
    Object.assign(window, {
      __flight: {
        get ship() { return ship; },
        get log() { return log; },
        get world() { return world.physics; },
        /** Where each body of the sky is: compass heading and height over the horizon, in degrees. */
        get sky() {
          const bodies = skyFrom(world.planet, catalog, days).bodies;
          return bodies.map((body) => {
            const direction = overhead(body.direction, starOf(bodies));
            return {
              name: body.name,
              heading: Math.round((Math.atan2(direction.x, direction.z) * 180) / Math.PI),
              height: Math.round((Math.asin(direction.y) * 180) / Math.PI),
              sizeDeg: Number(body.sizeDeg.toFixed(2)),
              millionKm: Number((body.distanceKm / 1e6).toFixed(2)),
            };
          });
        },
        hold: (...keys: string[]) => { held.clear(); for (const key of keys) held.add(key); },
        tap: (key: string) => pressed.add(key),
      },
    });
  })
  .catch((error: unknown) => {
    hud.notice.textContent = `Could not start: ${String(error)}`;
  });
