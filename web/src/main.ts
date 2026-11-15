import * as THREE from 'three';
import { derive, isComplete } from './data/derived.ts';
import { loadCatalog } from './data/exoplanets.ts';
import './style.css';

// The catalog is loaded once, at start, and stays in memory for the whole
// game: later calls to loadCatalog() get the same list.
loadCatalog()
  .then((planets) => {
    const complete = planets.filter((planet) => isComplete(derive(planet))).length;
    console.info(`Exoplanet catalog: ${planets.length} planets, ${complete} with every derived value.`);
  })
  .catch((error: unknown) => console.error(error));

// Starting point: an empty scene that proves the base runs. The game is
// built from here (see HANDOFF.md, "Build order").
const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070d');

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(0, 0, 5);

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(() => renderer.render(scene, camera));
