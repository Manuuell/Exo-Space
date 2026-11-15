// Preview stages for the model viewer: a patch of ground on each of the three
// TRAPPIST-1 planets, in the voxel style, to see how a model reads in the
// game. A mock-up for the design, not the game's terrain (the main chat
// builds that from the planet's data). The star's colour comes from its real
// temperature.

import * as THREE from 'three';
import { rgbToHex, starColor } from '../../data/derived.ts';
import { TRAPPIST_1 } from '../contract.ts';
import { block, light, model, node, seeded, tint } from '../kit.ts';

export type StageKey = keyof typeof TRAPPIST_1;

export interface Stage {
  group: THREE.Group;
  /** Sky gradient, from the zenith to the horizon. */
  sky: [string, string];
  fog: { colour: string; near: number; far: number };
  star: string;
  /** Fill light: sky and ground colours. */
  fill: [string, string];
}

interface Palette {
  ground: string;
  hill: string;
  rock: string;
  accent: string;
  accentGlow: string;
  sky: [string, string];
  fog: string;
  fill: [string, string];
  starSize: number;
}

const PALETTES: Record<StageKey, Palette> = {
  // Temperate home: sage moss and ochre rock under a low orange-red sun.
  e: {
    ground: '#7f9a5e', hill: '#6d8a52', rock: '#8a7466', accent: '#d9578f', accentGlow: '#ff8fc4',
    sky: ['#3a2c5e', '#f0a07a'], fog: '#d9937c', fill: ['#ffd9c2', '#5a6a4a'], starSize: 16,
  },
  // Scorched and heavy: basalt with glowing cracks under a huge sun.
  b: {
    ground: '#3f3438', hill: '#4a3c40', rock: '#2c2427', accent: '#ff6a2a', accentGlow: '#ffb347',
    sky: ['#3d1717', '#d9603a'], fog: '#a8452c', fill: ['#ffb38a', '#3a2020'], starSize: 26,
  },
  // Glacial and light: snow and blue ice under a small, faint sun.
  h: {
    ground: '#e3ebf3', hill: '#d2deea', rock: '#9cc2e0', accent: '#7fe0ff', accentGlow: '#c8f4ff',
    sky: ['#18234a', '#c98d86'], fog: '#b9aab8', fill: ['#e8e4ff', '#8aa0bf'], starSize: 9,
  },
};

export function buildStage(key: StageKey): Stage {
  const look = TRAPPIST_1[key];
  const palette = PALETTES[key];
  const star = starColor({ st_teff: look.starTeffK });
  const starHex = star ? rgbToHex(star) : '#ffffff';
  const rand = seeded(key.charCodeAt(0));
  const group = new THREE.Group();
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  const shades = (colour: string) => [colour, tint(colour, 0.04), tint(colour, -0.04), tint(colour, 0.08)];

  // A flat base far out, and voxel tiles around the character.
  const base = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.MeshLambertMaterial({ color: palette.ground }));
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.1;
  base.receiveShadow = true;
  group.add(base);

  const tiles = node('tiles');
  const groundShades = shades(palette.ground);
  for (let x = -20; x <= 20; x++) {
    for (let z = -12; z <= 30; z++) {
      if (x * x + (z - 9) * (z - 9) > 26 * 26) continue;
      const h = 0.1 + Math.floor(rand() * 3) * 0.02;
      tiles.add(block(1, h, 1, pick(groundShades), { at: [x, h / 2 - 0.1, z] }));
    }
  }
  group.add(model(tiles, []).root);

  // Scatter mostly in front of the character, where the game camera looks.
  const spot = (min: number, max: number): [number, number] => {
    const angle = rand() < 0.8 ? Math.PI * (0.15 + rand() * 0.7) : rand() * Math.PI * 2;
    const distance = min + rand() * (max - min);
    return [Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance)];
  };

  const scenery = node('scenery');
  const hillShades = shades(palette.hill);
  for (let i = 0; i < 12; i++) {
    // Stepped hills: stacked layers, each smaller than the one below.
    const [x, z] = spot(16, 45);
    let w = 6 + Math.floor(rand() * 8);
    let d = 5 + Math.floor(rand() * 6);
    for (let y = 0; w > 1 && d > 1; y++) {
      scenery.add(block(w, 1, d, pick(hillShades), { at: [x, y + 0.4, z] }));
      w -= 1 + Math.floor(rand() * 3);
      d -= 1 + Math.floor(rand() * 2);
    }
  }
  const rockShades = shades(palette.rock);
  for (let i = 0; i < 26; i++) {
    const [x, z] = spot(3, 22);
    const n = 2 + Math.floor(rand() * 4);
    for (let j = 0; j < n; j++) {
      const s = 0.3 + rand() * 0.6;
      scenery.add(block(s, s * (0.6 + rand() * 0.8), s, pick(rockShades), { at: [x + (rand() - 0.5) * 0.8, s * 0.35, z + (rand() - 0.5) * 0.8], rot: [0, Math.floor(rand() * 4) * 15, 0] }));
    }
  }
  for (let i = 0; i < 22; i++) {
    const [x, z] = spot(2.5, 18);
    if (key === 'e') {
      // Alien plants: a stem of blocks and a glowing bulb.
      const h = 2 + Math.floor(rand() * 4);
      for (let y = 0; y < h; y++) scenery.add(block(0.12, 0.2, 0.12, tint(palette.hill, -0.08), { at: [x, y * 0.2 + 0.1, z] }));
      scenery.add(block(0.36, 0.3, 0.36, palette.accent, { at: [x, h * 0.2 + 0.15, z] }));
      scenery.add(...light(0.14, 0.14, 0.14, palette.accentGlow, { at: [x, h * 0.2 + 0.18, z + 0.12] }));
    } else if (key === 'b') {
      // A glowing crack: a jagged line of small lights.
      let cx = x;
      let cz = z;
      for (let j = 0; j < 8; j++) {
        scenery.add(...light(0.18, 0.04, 0.18, pick([palette.accent, palette.accentGlow]), { at: [cx, 0.0, cz] }, 1.6));
        cx += Math.round((rand() - 0.5) * 2) * 0.18;
        cz += 0.18;
      }
    } else {
      // Ice spikes: stacked blocks, each narrower than the last.
      let s = 0.4 + rand() * 0.3;
      for (let y = 0; s > 0.08; y++) {
        scenery.add(block(s, 0.25, s, y % 2 ? palette.accent : palette.rock, { at: [x, y * 0.25 + 0.12, z] }));
        s -= 0.08;
      }
      scenery.add(...light(0.06, 0.06, 0.06, palette.accentGlow, { at: [x, 1.4, z] }));
    }
  }
  group.add(model(scenery, []).root);

  // The sky: a square star (a voxel sun) with a halo, and two neighbouring
  // planets. Fog does not touch them.
  const skyObject = (size: number, colour: string, at: THREE.Vector3, opacity = 1) => {
    const material = new THREE.MeshBasicMaterial({ color: colour, fog: false, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size * 0.1), material);
    mesh.position.copy(at);
    mesh.lookAt(0, 2, 0);
    group.add(mesh);
  };
  skyObject(palette.starSize, starHex, new THREE.Vector3(38, 34, 150));
  skyObject(palette.starSize * 1.6, starHex, new THREE.Vector3(38, 34, 152), 0.25);
  skyObject(5, '#c9b8b0', new THREE.Vector3(-45, 48, 140));
  skyObject(3.6, '#9fb4c9', new THREE.Vector3(-18, 62, 160));

  return {
    group,
    sky: palette.sky,
    fog: { colour: palette.fog, near: 16, far: 80 },
    star: starHex,
    fill: palette.fill,
  };
}

/** A vertical gradient for the background. */
export function skyTexture([top, horizon]: [string, string]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, horizon);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 2, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
