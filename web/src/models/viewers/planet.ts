// Planet viewer: a planet of TRAPPIST-1 on foot, to judge its look at the
// protagonist's scale: the landing site, a dungeon gate, a giant tree, the
// herds and the view from above. Development only, like the model viewers.
// Open it with `npm run dev` at /planet.html?planet=e|b|h&spot=….

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TRAPPIST_1 } from '../contract.ts';
import { heroCartoon } from '../hero-cartoon.ts';
import { planetFeatures } from '../planet-look.ts';
import { planetWorld } from '../planet-scene.ts';
import './viewer.css';

type Key = keyof typeof TRAPPIST_1;
const params = new URLSearchParams(location.search);
const asked = params.get('planet');
const key: Key = asked === 'b' || asked === 'h' ? asked : 'e';
const planet = TRAPPIST_1[key];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.2, 60_000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;

const world = planetWorld(planet);
scene.add(world.group);
const { scenery, ground } = world;
scene.add(new THREE.HemisphereLight(scenery.fill[0], scenery.fill[1], 1.3));
const sun = new THREE.DirectionalLight(scenery.sun, 2);
sun.position.set(0.3, 0.38, 0.87).multiplyScalar(100);
scene.add(sun);
const haze = world.haze(0);
scene.background = haze;
scene.fog = new THREE.Fog(haze, scenery.haze * 0.18, scenery.haze);

// The protagonist, for scale.
const hero = heroCartoon.create();
scene.add(hero.root);
const heroMixer = new THREE.AnimationMixer(hero.root);
const idle = hero.clips.find((clip) => clip.name === 'Idle');
if (idle) heroMixer.clipAction(idle).play();

const features = planetFeatures(planet, ground);
const at = (x: number, z: number, up = 0) => new THREE.Vector3(x, ground(x, z) + up, z);

interface Spot {
  name: string;
  /** Where the protagonist stands, where the camera looks and where it is. */
  hero: THREE.Vector3;
  target: THREE.Vector3;
  eye: THREE.Vector3;
}

/** A spot in front of a landmark, looking at it past the protagonist. */
function before(name: string, x: number, z: number, yaw: number, stand: number, back: number, up: number, look: number): Spot {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const hero = at(x + fx * stand, z + fz * stand);
  return { name, hero, target: at(x, z, look), eye: at(x + fx * (stand + back) + fz * back * 0.35, z + fz * (stand + back) - fx * back * 0.35, up) };
}

const spots: Spot[] = [
  { name: 'Landing site', hero: at(4, 24), target: at(0, 0, 3), eye: at(16, 46, 7) },
];
features.gates.forEach((gate, k) => spots.push(before(k === 0 ? 'Main ruin' : `Dungeon ${k + 1}`, gate.x, gate.z, gate.yaw, 14, 14, 6, 5)));
if (features.giants[0]) {
  const tree = features.giants[0];
  spots.push(before('Giant tree', tree.x, tree.z, Math.atan2(-tree.x, -tree.z), 22, 75, 14, 30));
}
for (const species of ['mossback', 'puffhop', 'skyfin'] as const) {
  const herd = features.herds.find((candidate) => candidate.species === species);
  if (!herd) continue;
  const name = { mossback: 'Mossbacks', puffhop: 'Puffhops', skyfin: 'Skyfins' }[species];
  const toward = Math.atan2(-herd.x, -herd.z);
  const near = species === 'puffhop' ? 6 : species === 'mossback' ? 12 : 20;
  const spot = before(name, herd.x, herd.z, toward, herd.roam + near, species === 'puffhop' ? 7 : 16, species === 'skyfin' ? 3 : 5, species === 'skyfin' ? 25 : 1.5);
  spots.push(spot);
}
spots.push({ name: 'From above', hero: at(4, 24), target: at(0, 0, 0), eye: at(500, 900, 650) });

function go(spot: Spot) {
  hero.root.position.copy(spot.hero);
  hero.root.lookAt(spot.target.x, spot.hero.y, spot.target.z);
  controls.target.copy(spot.target);
  camera.position.copy(spot.eye);
  controls.update();
  $<HTMLParagraphElement>('info').textContent = `${planet.name} · ${spot.name} · the protagonist is 1.6 m tall`;
  const url = new URL(location.href);
  url.searchParams.set('spot', spot.name);
  history.replaceState(null, '', url);
}

const picker = $<HTMLSelectElement>('planet');
for (const option of ['e', 'b', 'h'] as const) picker.add(new Option(TRAPPIST_1[option].name, option, false, option === key));
picker.addEventListener('change', () => { location.search = `?planet=${picker.value}`; });
const buttons = $<HTMLDivElement>('spots');
for (const spot of spots) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = spot.name;
  button.addEventListener('click', () => go(spot));
  buttons.append(button);
}
go(spots.find((spot) => spot.name === params.get('spot')) ?? spots[0]);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let seconds = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(0.1, clock.getDelta());
  seconds += dt;
  controls.update();
  // Never under the ground.
  const floor = ground(camera.position.x, camera.position.z) + 1;
  if (camera.position.y < floor) camera.position.y = floor;
  camera.updateMatrixWorld();
  heroMixer.update(dt);
  // Up high the planet curves away and shows as a ball.
  const height = camera.position.y - ground(camera.position.x, camera.position.z);
  world.update(camera, controls.target, Math.min(1, Math.max(0, (height - 500) / 1500)), seconds);
  renderer.render(scene, camera);
});

Object.assign(window, { __planet: { spots: spots.map((spot) => spot.name), go: (name: string) => go(spots.find((spot) => spot.name === name) ?? spots[0]) } });
