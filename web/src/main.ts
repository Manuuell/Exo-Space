import * as THREE from 'three';
import './style.css';

// Punto de partida: una escena vacía que demuestra que la base arranca.
// El juego se construye a partir de aquí (ver TRASPASO.md, «Orden de
// construcción»).
const lienzo = document.getElementById('game') as HTMLCanvasElement;
const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
render.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const escena = new THREE.Scene();
escena.background = new THREE.Color('#05070d');

const camara = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camara.position.set(0, 0, 5);

function ajustar() {
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  render.setSize(ancho, alto, false);
  camara.aspect = ancho / alto;
  camara.updateProjectionMatrix();
}

window.addEventListener('resize', ajustar);
ajustar();
render.setAnimationLoop(() => render.render(escena, camara));
