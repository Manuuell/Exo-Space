// Development viewer: reference sheets with an orthographic camera and a
// neutral background, to save as reference-models/<id>-*.png.
//
// /references.html?model=<id>&view=front|side|back|three-quarter|sheet
// /references.html?view=lineup[&models=a,b,c]  every model in a row, same scale
// /references.html?model=<id>&view=planets  a model on TRAPPIST-1 e, b and h
// Optional: &planet=e|b|h, &clip=<name>&t=<seconds> to pose it, &clean=1,
// &zoom=<times>&at=<height in metres> for a close-up of one part,
// &hold=<weapon id> to put a weapon in the hand of a model that can hold one.

import * as THREE from 'three';
import { TRAPPIST_1 } from '../contract.ts';
import type { PlanetLook } from '../contract.ts';
import { addStyleLights } from '../kit.ts';
import type { ModelEntry } from '../kit.ts';
import { CATALOG, modelById } from '../index.ts';
import './viewer.css';

const VIEWS = {
  front: new THREE.Vector3(0, 0, 1),
  side: new THREE.Vector3(1, 0, 0),
  back: new THREE.Vector3(0, 0, -1),
  'three-quarter': new THREE.Vector3(0.8, 0.3, 1).normalize(),
} as const;
type View = keyof typeof VIEWS;
type Mode = View | 'sheet' | 'lineup' | 'planets';
const MODES: Mode[] = ['sheet', 'front', 'side', 'back', 'three-quarter', 'lineup', 'planets'];
const LABELS: Record<View, string> = { front: 'FRONT', side: 'SIDE', back: 'BACK', 'three-quarter': '3/4' };
const SHEET: View[] = ['front', 'side', 'back', 'three-quarter'];
const TILE_W = 600;
const TILE_H = 860;
const LABEL_SPACE = 70;
const BACKGROUND = '#737c90';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('view');
const context = canvas.getContext('2d')!;
const modelSelect = $<HTMLSelectElement>('model');
const modeSelect = $<HTMLSelectElement>('mode');
const info = $<HTMLParagraphElement>('info');

// WebGL draws off screen; the visible canvas composes the views and labels.
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND);
const key = addStyleLights(scene, '#ffffff', renderer);
scene.add(key.target);
const camera = new THREE.OrthographicCamera();

for (const entry of CATALOG) modelSelect.add(new Option(`${entry.name} (${entry.type})`, entry.id));
for (const mode of MODES) modeSelect.add(new Option(mode, mode));

const params = new URLSearchParams(location.search);
const planetKey = params.get('planet') ?? 'e';
const planet = TRAPPIST_1[planetKey as keyof typeof TRAPPIST_1] ?? TRAPPIST_1.e;

/** Builds a model, posed at a moment of a clip when the URL asks for it. */
function build(entry: ModelEntry, look: PlanetLook = planet): THREE.Object3D {
  const { root, clips } = entry.create(entry.planetary ? look : undefined);
  const held = modelById(params.get('hold') ?? '');
  if (held?.type === 'weapon') root.getObjectByName('hold')?.add(held.create().root);
  const clip = clips.find((candidate) => candidate.name === params.get('clip'));
  if (clip) {
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clip).play();
    // Just short of the end: at the very end a looping action wraps to the start.
    mixer.setTime(Math.min(Number(params.get('t') ?? 0), clip.duration - 0.001));
  }
  root.updateMatrixWorld(true);
  return root;
}

function clearModels() {
  scene.children.filter((child) => child.userData.model).forEach((child) => scene.remove(child));
}

function aim(direction: THREE.Vector3, center: THREE.Vector3, distance: number) {
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // The key light comes from above and to the left of every view.
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion);
  key.position.copy(camera.position).addScaledVector(up, distance * 0.9).addScaledVector(left, distance * 0.6);
  key.target.position.copy(center);
}

function label(text: string, x: number, y: number) {
  context.fillStyle = '#eef0f6';
  context.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.letterSpacing = '4px';
  context.fillText(text, x, y);
}

function renderViews(entry: ModelEntry, views: View[]) {
  const root = build(entry);
  root.userData.model = true;
  scene.add(root);

  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  // One frame for every view, so all of them share one scale.
  const imageH = TILE_H - LABEL_SPACE;
  const halfW = (Math.max(size.x, size.z, Math.hypot(size.x, size.z) * 0.85) / 2) * 1.25;
  const fitH = (size.y / 2) * 1.2;
  // A sheet keeps four equal tiles; a single view widens for wide models.
  const tileW = views.length > 1 ? TILE_W : Math.min(Math.max(TILE_W, Math.round((imageH * halfW) / fitH)), 2400);
  const halfH = Math.max(fitH, (halfW * imageH) / tileW);
  const distance = Math.max(size.x, size.y, size.z) * 4 + 1;
  // A close-up: the same frame, that many times smaller, at a given height.
  const zoom = Math.max(Number(params.get('zoom')) || 1, 1);
  if (params.has('at')) center.y = Number(params.get('at'));
  camera.left = (-halfH * tileW) / imageH / zoom;
  camera.right = (halfH * tileW) / imageH / zoom;
  camera.top = halfH / zoom;
  camera.bottom = -halfH / zoom;
  camera.near = 0.01;
  camera.far = distance * 2;

  canvas.width = tileW * views.length;
  canvas.height = TILE_H;
  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  renderer.setSize(tileW, imageH, false);
  views.forEach((view, i) => {
    aim(VIEWS[view], center, distance);
    renderer.render(scene, camera);
    context.drawImage(renderer.domElement, i * tileW, 0);
    label(LABELS[view], i * tileW + tileW / 2, TILE_H - LABEL_SPACE / 2);
  });
  info.textContent = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`;
}

/** Models in a row at the same scale, each with a label under it. */
function renderRow(items: { label: string; root: THREE.Object3D }[]) {
  const gap = 0.5;
  let x = 0;
  const placed: { name: string; center: number }[] = [];
  let height = 0;
  for (const { label: name, root } of items) {
    const holder = new THREE.Group();
    holder.userData.model = true;
    // A quarter turn towards the camera shows the face and the profile.
    root.rotation.y = THREE.MathUtils.degToRad(-25);
    holder.add(root);
    holder.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(holder);
    const size = bounds.getSize(new THREE.Vector3());
    holder.position.x = x - bounds.min.x;
    placed.push({ name, center: x + size.x / 2 });
    x += size.x + gap;
    height = Math.max(height, size.y);
    scene.add(holder);
  }
  const width = Math.max(x - gap, 0.5);
  const imageH = TILE_H - LABEL_SPACE;
  const halfH = (height / 2) * 1.2 + 0.1;
  const halfW = Math.max(width / 2 + gap, (halfH * TILE_W) / imageH);
  const imageW = Math.round((imageH * halfW) / halfH);
  const center = new THREE.Vector3(width / 2, height / 2, 0);
  const distance = Math.max(width, height) * 4 + 1;
  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.near = 0.01;
  camera.far = distance * 2;
  aim(new THREE.Vector3(0, 0.12, 1).normalize(), center, distance);

  canvas.width = imageW;
  canvas.height = TILE_H;
  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  renderer.setSize(imageW, imageH, false);
  renderer.render(scene, camera);
  context.drawImage(renderer.domElement, 0, 0);
  for (const { name, center: at } of placed) {
    label(name, ((at - center.x + halfW) / (2 * halfW)) * imageW, TILE_H - LABEL_SPACE / 2);
  }
  info.textContent = `${items.length} models · tallest ${height.toFixed(2)} m`;
}

function fit() {
  // The whole image inside the window, keeping its proportions.
  const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height, 1);
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  canvas.style.margin = `${Math.max((window.innerHeight - canvas.height * scale) / 2, 0)}px auto 0`;
}

function render(id: string, mode: Mode) {
  clearModels();
  const entry = modelById(id) ?? CATALOG[0];
  if (mode === 'lineup') {
    const wanted = params.get('models')?.split(',');
    const list = wanted ? CATALOG.filter((candidate) => wanted.includes(candidate.id)) : [...CATALOG];
    renderRow(list.map((item) => ({ label: item.name.toUpperCase(), root: build(item) })));
  } else if (mode === 'planets' && entry) {
    // The same model on each of the three planets it can live on.
    renderRow(Object.values(TRAPPIST_1).map((look) => ({ label: look.name.toUpperCase(), root: build(entry, look) })));
    modelSelect.value = entry.id;
  } else if (entry) {
    renderViews(entry, mode === 'sheet' ? SHEET : [mode as View]);
    modelSelect.value = entry.id;
  }
  modeSelect.value = mode;
  modelSelect.disabled = mode === 'lineup';
  params.set('view', mode);
  if (entry && mode !== 'lineup') params.set('model', entry.id);
  history.replaceState(null, '', `?${params}`);
  $<HTMLAnchorElement>('viewer').href = `models.html?model=${encodeURIComponent(modelSelect.value)}`;
  fit();
}

function save() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = modeSelect.value === 'lineup' ? 'style-group.png' : `${modelSelect.value}-${modeSelect.value}.png`;
  link.click();
}

const requested = (params.get('view') ?? 'sheet') as Mode;
const initialMode: Mode = MODES.includes(requested) ? requested : 'sheet';
if (params.get('clean') === '1') $<HTMLDivElement>('panel').hidden = true;

modelSelect.addEventListener('change', () => render(modelSelect.value, modeSelect.value as Mode));
modeSelect.addEventListener('change', () => render(modelSelect.value, modeSelect.value as Mode));
$<HTMLButtonElement>('save').addEventListener('click', save);
window.addEventListener('resize', fit);

render(params.get('model') ?? CATALOG[0]?.id ?? '', initialMode);
