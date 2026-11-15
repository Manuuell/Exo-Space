// Development viewer: pick a model, play each clip, change the speed, see
// when an attack warns and hits, and download the model as GLB.
// Open it with `npm run dev` at /models.html?model=<id>&planet=e|b|h.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { CONTRACT, TRAPPIST_1 } from '../contract.ts';
import type { PlanetLook } from '../contract.ts';
import { addStyleLights, countDrawCalls, countTriangles, exportable } from '../kit.ts';
import type { Model, ModelEntry } from '../kit.ts';
import { CATALOG, modelById } from '../index.ts';
import { shotFor } from '../weapons.ts';
import { buildStage, skyTexture } from './stage.ts';
import type { StageKey } from './stage.ts';
import './viewer.css';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('view');
const modelSelect = $<HTMLSelectElement>('model');
const planetLabel = $<HTMLLabelElement>('planet-label');
const planetSelect = $<HTMLSelectElement>('planet');
const holdLabel = $<HTMLLabelElement>('hold-label');
const holdSelect = $<HTMLSelectElement>('hold');
const clipButtons = $<HTMLDivElement>('clips');
const speed = $<HTMLInputElement>('speed');
const speedValue = $<HTMLSpanElement>('speed-value');
const timeline = $<HTMLDivElement>('timeline');
const playhead = $<HTMLDivElement>('playhead');
const timing = $<HTMLParagraphElement>('timing');
const info = $<HTMLParagraphElement>('info');
const sceneSelect = $<HTMLSelectElement>('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#5d6880');
const key = addStyleLights(scene, '#ffffff', renderer);
scene.add(key.target);
const fill = scene.children.find((child) => child instanceof THREE.HemisphereLight) as THREE.HemisphereLight;

const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: '#4f586c', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(12, 24, '#6a7489', '#5b6479');
grid.position.y = 0.002;
scene.add(grid);

const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Scenes: the neutral studio, or a mock-up of a planet's surface seen with
// the game's third-person camera, behind the character.
const STUDIO = { background: new THREE.Color('#5d6880'), sky: fill.color.clone(), ground: fill.groundColor.clone() };
let stage: THREE.Group | undefined;
sceneSelect.add(new Option('Studio', 'studio'));
for (const [key, planet] of Object.entries(TRAPPIST_1)) sceneSelect.add(new Option(`In game · ${planet.name}`, key));

function applyScene() {
  if (stage) scene.remove(stage);
  stage = undefined;
  const choice = sceneSelect.value;
  ground.visible = grid.visible = choice === 'studio';
  if (choice === 'studio') {
    scene.background = STUDIO.background;
    scene.fog = null;
    key.color.set('#ffffff');
    key.position.set(3, 6, 5);
    fill.color.copy(STUDIO.sky);
    fill.groundColor.copy(STUDIO.ground);
    return;
  }
  const built = buildStage(choice as StageKey);
  stage = built.group;
  scene.add(stage);
  scene.background = skyTexture(built.sky);
  scene.fog = new THREE.Fog(built.fog.colour, built.fog.near, built.fog.far);
  // The star's real colour, softened towards white so the suit stays readable.
  key.color.set(built.star).lerp(new THREE.Color('#ffffff'), 0.45);
  // The star's light, from behind and above the camera, so the character
  // reads against the sky (a usual cheat in third-person games).
  key.position.set(5, 8, -5);
  fill.color.set(built.fill[0]);
  fill.groundColor.set(built.fill[1]);
}

/** The game's camera: behind the character and a little above. */
function gameCamera(root: THREE.Object3D) {
  const height = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y;
  // Over the right shoulder, looking past the character towards the horizon:
  // the hand that holds the weapon is on that side.
  controls.target.set(0, height * 0.7, height * 1.6);
  camera.position.set(-height * 0.6, height * 1.15, -height * 3.1);
  camera.near = 0.05;
  camera.far = 400;
  camera.updateProjectionMatrix();
  controls.update();
}

let entry: ModelEntry | undefined;
let model: Model | undefined;
let mixer: THREE.AnimationMixer | undefined;
let action: THREE.AnimationAction | undefined;
// The weapon in the model's hand, when it can hold one and one is picked.
let held: Model | undefined;
let heldMixer: THREE.AnimationMixer | undefined;

// Shots in the air, to see a weapon fire. How fast and how far they fly here
// is the viewer's own choice, not the game's.
const SHOT_SPEED = 9;
const SHOT_RANGE = 5;
interface FlyingShot {
  shot: Model;
  mixer: THREE.AnimationMixer;
  velocity: THREE.Vector3;
  /** Seconds left: of flight first, then of its burst. */
  left: number;
  bursting: boolean;
}
const flying: FlyingShot[] = [];

function launch() {
  const entry = shotFor(holdSelect.value);
  const muzzle = held?.root.getObjectByName('muzzle');
  if (!entry || !muzzle) return;
  const shot = entry.create();
  muzzle.updateWorldMatrix(true, false);
  muzzle.getWorldPosition(shot.root.position);
  muzzle.getWorldQuaternion(shot.root.quaternion);
  scene.add(shot.root);
  const shotMixer = new THREE.AnimationMixer(shot.root);
  const fly = shot.clips.find((candidate) => candidate.name === 'Fly');
  if (fly) shotMixer.clipAction(fly).play();
  const velocity = new THREE.Vector3(0, 0, SHOT_SPEED).applyQuaternion(shot.root.quaternion);
  flying.push({ shot, mixer: shotMixer, velocity, left: SHOT_RANGE / SHOT_SPEED, bursting: false });
}

function clearShots() {
  for (const { shot } of flying) scene.remove(shot.root);
  flying.length = 0;
}

function updateShots(delta: number) {
  for (let i = flying.length - 1; i >= 0; i--) {
    const item = flying[i];
    item.mixer.update(delta);
    item.left -= delta;
    if (!item.bursting) {
      item.shot.root.position.addScaledVector(item.velocity, delta);
      if (item.left > 0) continue;
      // The end of its flight: it bursts where it is.
      const burst = item.shot.clips.find((candidate) => candidate.name === 'Burst');
      item.mixer.stopAllAction();
      item.bursting = true;
      item.left = burst?.duration ?? 0;
      if (burst) {
        const action = item.mixer.clipAction(burst).setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();
      }
    } else if (item.left <= 0) {
      scene.remove(item.shot.root);
      flying.splice(i, 1);
    }
  }
}

for (const candidate of CATALOG) modelSelect.add(new Option(`${candidate.name} (${candidate.type})`, candidate.id));
for (const [key, planet] of Object.entries(TRAPPIST_1)) {
  planetSelect.add(new Option(`${planet.name} · ${planet.eqTempK} K · ${planet.gravityG} g`, key));
}
holdSelect.add(new Option('Nothing', ''));
for (const candidate of CATALOG) {
  if (candidate.type === 'weapon') holdSelect.add(new Option(candidate.name, candidate.id));
}

function planet(): PlanetLook | undefined {
  return entry?.planetary ? TRAPPIST_1[planetSelect.value as keyof typeof TRAPPIST_1] : undefined;
}

function frame(root: THREE.Object3D): THREE.Vector3 {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const reach = Math.max(size.x, size.y, size.z, 0.5);
  // Room above the model, so jumps stay in frame.
  center.y += reach * 0.25;
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(0.8, 0.35, 1.6).multiplyScalar(reach * 1.9));
  camera.near = reach / 100;
  camera.far = reach * 100;
  camera.updateProjectionMatrix();
  controls.update();
  return size;
}

function showTiming(clip: THREE.AnimationClip) {
  const attack = model?.attacks[clip.name];
  timeline.querySelectorAll('.mark').forEach((mark) => mark.remove());
  timeline.hidden = !attack;
  timing.hidden = !attack;
  if (!attack) return;
  const marks: [string, number, number][] = [
    ['warn', attack.warn, attack.hit],
    ['hit', attack.hit, attack.end],
  ];
  for (const [kind, from, to] of marks) {
    const mark = document.createElement('div');
    mark.className = `mark ${kind}`;
    mark.style.left = `${(from / clip.duration) * 100}%`;
    mark.style.width = `${(Math.max(to - from, 0.02) / clip.duration) * 100}%`;
    timeline.append(mark);
  }
  timing.textContent = `warn ${attack.warn.toFixed(2)} s · hit ${attack.hit.toFixed(2)}–${attack.end.toFixed(2)} s · ${clip.duration.toFixed(2)} s`;
}

function play(clip: THREE.AnimationClip) {
  if (!mixer) return;
  action?.stop();
  action = mixer.clipAction(clip);
  action.reset();
  action.setLoop(clip.userData.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
  action.clampWhenFinished = !clip.userData.loop;
  action.play();
  // The weapon in the hand fires with the shot.
  const fire = clip.name === 'Shoot' ? held?.clips.find((candidate) => candidate.name === 'Fire') : undefined;
  if (fire && heldMixer) {
    heldMixer.stopAllAction();
    heldMixer.clipAction(fire).setLoop(THREE.LoopOnce, 1).reset().play();
    // The shot leaves along the aim, before the kick lifts the muzzle.
    mixer.update(0);
    launch();
  }
  for (const button of clipButtons.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.textContent === clip.name));
  }
  showTiming(clip);
}

function show(id: string) {
  entry = modelById(id) ?? CATALOG[0];
  if (!entry) return;
  if (model) scene.remove(model.root);
  modelSelect.value = entry.id;
  planetLabel.hidden = !entry.planetary;
  model = entry.create(planet());
  scene.add(model.root);
  mixer = new THREE.AnimationMixer(model.root);
  mixer.timeScale = Number(speed.value);
  action = undefined;

  const query = new URLSearchParams({ model: entry.id });
  const hold = model.root.getObjectByName('hold');
  holdLabel.hidden = !hold;
  if (hold && holdSelect.value) query.set('hold', holdSelect.value);
  if (entry.planetary) query.set('planet', planetSelect.value);
  if (sceneSelect.value !== 'studio') query.set('scene', sceneSelect.value);
  history.replaceState(null, '', `?${query}`);
  $<HTMLAnchorElement>('sheet').href = `references.html?${query}&view=sheet`;

  clipButtons.replaceChildren(
    ...model.clips.map((clip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = clip.name;
      button.title = `${clip.duration.toFixed(2)} s${clip.userData.loop ? ', loop' : ''}`;
      button.addEventListener('click', () => play(clip));
      return button;
    }),
  );
  timeline.hidden = true;
  timing.hidden = true;

  const size = frame(model.root);
  if (sceneSelect.value !== 'studio') gameCamera(model.root);
  const triangles = countTriangles(model.root);
  const budget = CONTRACT[entry.type].maxTriangles;
  info.textContent = [
    `${triangles.toLocaleString('en')} / ${budget.toLocaleString('en')} triangles`,
    `${countDrawCalls(model.root)} draw calls`,
    `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`,
    `${model.clips.length} clips`,
  ].join(' · ');
  info.classList.toggle('warning', triangles > budget);

  // Added after measuring, so the figures above are the model's own.
  clearShots();
  held = undefined;
  heldMixer = undefined;
  const weapon = hold && holdSelect.value ? modelById(holdSelect.value) : undefined;
  if (hold && weapon) {
    held = weapon.create();
    hold.add(held.root);
    heldMixer = new THREE.AnimationMixer(held.root);
    heldMixer.timeScale = Number(speed.value);
  }

  const idle = model.clips.find((clip) => clip.name === 'Idle') ?? model.clips[0];
  if (idle) play(idle);
}

function download() {
  if (!entry) return;
  // A fresh copy in its rest pose, not the one that is mid-animation.
  const fresh = entry.create(planet());
  const name = entry.planetary ? `${entry.id}-${planetSelect.value}` : entry.id;
  new GLTFExporter().parse(
    exportable(fresh.root),
    (result) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' }));
      link.download = `${name}.glb`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    (error) => {
      info.textContent = `Export failed: ${String(error)}`;
      info.classList.add('warning');
    },
    { binary: true, animations: fresh.clips },
  );
}

modelSelect.addEventListener('change', () => show(modelSelect.value));
planetSelect.addEventListener('change', () => show(modelSelect.value));
holdSelect.addEventListener('change', () => show(modelSelect.value));
sceneSelect.addEventListener('change', () => {
  applyScene();
  show(modelSelect.value);
});
speed.addEventListener('input', () => {
  speedValue.textContent = `${Number(speed.value).toFixed(2)}×`;
  if (mixer) mixer.timeScale = Number(speed.value);
  if (heldMixer) heldMixer.timeScale = Number(speed.value);
});
$<HTMLButtonElement>('download').addEventListener('click', download);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const params = new URLSearchParams(location.search);
if (params.get('planet') && params.get('planet')! in TRAPPIST_1) planetSelect.value = params.get('planet')!;
if (params.get('scene') && params.get('scene')! in TRAPPIST_1) sceneSelect.value = params.get('scene')!;
if (params.get('hold') && modelById(params.get('hold')!)?.type === 'weapon') holdSelect.value = params.get('hold')!;
applyScene();
if (params.get('clean') === '1') (document.querySelector('.panel') as HTMLElement).hidden = true;
show(params.get('model') ?? CATALOG[0]?.id ?? '');

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const delta = timer.getDelta();
  mixer?.update(delta);
  heldMixer?.update(delta);
  updateShots(delta * Number(speed.value));
  if (action && !timeline.hidden) {
    const clip = action.getClip();
    playhead.style.left = `${(Math.min(action.time, clip.duration) / clip.duration) * 100}%`;
  }
  controls.update();
  renderer.render(scene, camera);
});
