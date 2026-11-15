// The inside of a dungeon: the first colonists' ruins under the gate, in the
// game's soft cartoon style. Three halls in a line joined by corridors: an
// entrance hall, a larger hall and the guardian's arena. Stone floors and
// mossy walls, pillars, braziers of cyan fire, glowing runes and crystals;
// a curtain of energy closes each corridor until the hall before it is
// cleared; a portal by the entrance leads back out, and another opens at the
// far end once the guardian falls. A scene of its own, in metres, the
// entrance at the origin and the halls going along +Z.

import * as THREE from 'three';

/** The protagonist's light ramp. */
const RAMP = (() => {
  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const u = Math.min(Math.max((i / 31 - 0.18) / 0.62, 0), 1);
    data[i] = Math.round(255 * (0.4 + 0.6 * u * u * (3 - 2 * u)));
  }
  const texture = new THREE.DataTexture(data, 32, 1, THREE.RedFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
})();
const toon = (colour: string, extra: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ color: colour, gradientMap: RAMP, ...extra });
const glowing = (colour: string, opacity = 1) => new THREE.MeshBasicMaterial({ color: colour, transparent: opacity < 1, opacity, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacity === 1 });

interface Rect { x0: number; x1: number; z0: number; z1: number }

export interface DungeonHall {
  bounds: Rect;
  /** Where its guards stand. */
  spawns: [number, number][];
  /** Where the guardian waits, in the last hall. */
  boss?: [number, number];
}

export interface Dungeon {
  scene: THREE.Scene;
  halls: DungeonHall[];
  /** Where she arrives, facing along +Z. */
  start: THREE.Vector3;
  /** The portal back out, by the entrance, and the one at the far end. */
  entrance: THREE.Vector3;
  exit: THREE.Vector3;
  /** Where the reward chest stands, in the arena. */
  chest: THREE.Vector3;
  /** Whether she (or a guard) can stand at a point: inside a hall, or a corridor that is open. */
  walkable(x: number, z: number): boolean;
  /** Opens the corridor after hall k. */
  open(k: number): void;
  /** Lights the far portal once the guardian is down. */
  finish(): void;
  update(dt: number, seconds: number): void;
}

const STONE = ['#d6cfbd', '#cbc3af', '#ddd6c5', '#c2baa5'];
const WALL_H = 7;

export function buildDungeon(index: number): Dungeon {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#151227');
  scene.fog = new THREE.Fog('#151227', 30, 150);
  scene.add(new THREE.HemisphereLight('#a99cf0', '#2c2540', 1.25));
  const key = new THREE.DirectionalLight('#ffe9c8', 0.9);
  key.position.set(20, 60, -10);
  scene.add(key);

  // Three halls, a little different in each dungeon.
  const grow = [0, 4, 8][index % 3];
  const halls: DungeonHall[] = [
    { bounds: { x0: -12, x1: 12, z0: 0, z1: 26 }, spawns: [[-5, 18], [5, 18], [0, 22]] },
    { bounds: { x0: -16 - grow / 2, x1: 16 + grow / 2, z0: 38, z1: 72 + grow }, spawns: [[-9, 52], [9, 52], [-6, 64], [6, 64], [0, 58]] },
    { bounds: { x0: -22, x1: 22, z0: 84 + grow, z1: 130 + grow }, spawns: [[-12, 112 + grow], [12, 112 + grow]], boss: [0, 112 + grow] },
  ];
  const corridors: Rect[] = [
    { x0: -3.5, x1: 3.5, z0: halls[0].bounds.z1, z1: halls[1].bounds.z0 },
    { x0: -3.5, x1: 3.5, z0: halls[1].bounds.z1, z1: halls[2].bounds.z0 },
  ];
  const open = [false, false];

  // Floors: stone tiles in a few shades.
  const floor = (rect: Rect) => {
    const w = rect.x1 - rect.x0;
    const d = rect.z1 - rect.z0;
    const tiles = new THREE.PlaneGeometry(w, d, Math.max(1, Math.round(w / 2.4)), Math.max(1, Math.round(d / 2.4))).rotateX(-Math.PI / 2).toNonIndexed();
    const colours = new Float32Array(tiles.attributes.position.count * 3);
    const tone = new THREE.Color();
    for (let t = 0; t < tiles.attributes.position.count; t += 6) {
      tone.set(STONE[(t / 6 * 7 + index) % STONE.length]).multiplyScalar(0.82);
      for (let v = 0; v < 6; v++) colours.set([tone.r, tone.g, tone.b], (t + v) * 3);
    }
    tiles.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    const mesh = new THREE.Mesh(tiles, toon('#ffffff', { vertexColors: true }));
    mesh.position.set((rect.x0 + rect.x1) / 2, 0, (rect.z0 + rect.z1) / 2);
    scene.add(mesh);
  };
  for (const hall of halls) floor(hall.bounds);
  for (const corridor of corridors) floor(corridor);

  // Walls: rows of big rounded stones, mossy on top; gaps where corridors meet.
  const stoneLook = STONE.map((colour) => toon(colour));
  const mossLook = toon('#6fbf4e');
  let n = 0;
  const wall = (x0: number, z0: number, x1: number, z1: number, height: number) => {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const blocks = Math.max(1, Math.round(length / 3));
    for (let b = 0; b < blocks; b++) {
      const t = (b + 0.5) / blocks;
      for (let row = 0; row < Math.round(height / 1.75); row++) {
        const block = new THREE.Mesh(new THREE.BoxGeometry(length / blocks + 0.1, 1.8, 1.6), stoneLook[(n++ * 5 + row) % stoneLook.length]);
        block.position.set(x0 + (x1 - x0) * t, 0.9 + row * 1.75, z0 + (z1 - z0) * t);
        block.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 + (((n * 13) % 7) - 3) * 0.008;
        scene.add(block);
      }
      const moss = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), mossLook);
      moss.scale.set(length / blocks / 2, 0.3, 0.9);
      moss.position.set(x0 + (x1 - x0) * t, height + 0.1, z0 + (z1 - z0) * t);
      moss.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
      scene.add(moss);
    }
  };
  halls.forEach((hall, k) => {
    const { x0, x1, z0, z1 } = hall.bounds;
    wall(x0, z0, x0, z1, WALL_H);
    wall(x1, z0, x1, z1, WALL_H);
    // The south wall: a gap for the corridor in, except the first hall.
    if (k === 0) wall(x0, z0, x1, z0, WALL_H);
    else { wall(x0, z0, -3.5, z0, WALL_H); wall(3.5, z0, x1, z0, WALL_H); }
    // The north wall: a gap for the corridor out, except the arena.
    if (k === halls.length - 1) wall(x0, z1, x1, z1, WALL_H);
    else { wall(x0, z1, -3.5, z1, WALL_H); wall(3.5, z1, x1, z1, WALL_H); }
  });
  for (const corridor of corridors) {
    wall(corridor.x0, corridor.z0, corridor.x0, corridor.z1, 5);
    wall(corridor.x1, corridor.z0, corridor.x1, corridor.z1, 5);
  }

  // Pillars, braziers with light, runes and crystals in each hall.
  const flames: THREE.Object3D[] = [];
  const pillarLook = toon('#e2dccb');
  const goldLook = toon('#f2b84b');
  halls.forEach((hall, k) => {
    const { x0, x1, z0, z1 } = hall.bounds;
    for (const [px, pz] of [[x0 + 3, z0 + 3], [x1 - 3, z0 + 3], [x0 + 3, z1 - 3], [x1 - 3, z1 - 3]]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, WALL_H + 1, 12), pillarLook);
      pillar.position.set(px, (WALL_H + 1) / 2, pz);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 2.3), goldLook);
      cap.position.set(px, WALL_H + 1, pz);
      scene.add(pillar, cap);
    }
    for (const side of [1, -1]) {
      for (const pz of [z0 + (z1 - z0) * 0.35, z0 + (z1 - z0) * 0.7]) {
        const px = side > 0 ? x1 - 1.6 : x0 + 1.6;
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.35, 0.6, 12), goldLook);
        bowl.position.set(px, 2.2, pz);
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.9, 8), pillarLook);
        stand.position.set(px, 0.95, pz);
        const flame = new THREE.Group();
        flame.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8).scale(1, 1.6, 1), glowing('#63e9ff')), new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8).scale(1, 1.5, 1), glowing('#63e9ff', 0.3)));
        flame.position.set(px, 2.9, pz);
        flames.push(flame);
        scene.add(bowl, stand, flame);
      }
      // A rune glowing on the wall.
      const rune = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 6, 28), glowing(k === 2 ? '#ff8fc4' : '#7ff7e0'));
      rune.position.set(side > 0 ? x1 - 0.85 : x0 + 0.85, 4.4, (z0 + z1) / 2);
      rune.rotation.y = Math.PI / 2;
      scene.add(rune);
    }
    // One light per side of each hall, warm-cool.
    for (const side of [1, -1]) {
      const lamp = new THREE.PointLight(k === 2 ? '#ff9ad8' : '#7ff7e0', 30, 40, 1.6);
      lamp.position.set(side * (x1 - 4), 5, (z0 + z1) / 2);
      scene.add(lamp);
    }
    // Crystals in two corners.
    for (const [cx, cz, colour] of [[x0 + 2.2, z1 - 6, '#ff9fd0'], [x1 - 2.2, z0 + 6, '#9fe8ff']] as const) {
      for (let c = 0; c < 3; c++) {
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0).scale(1, 2.6, 1), toon(colour, { emissive: colour, emissiveIntensity: 0.35 }));
        crystal.position.set(cx + (c - 1) * 0.7, 1.0 + (c % 2) * 0.3, cz + (c % 2) * 0.6);
        crystal.rotation.set((c - 1) * 0.3, c, (c - 1) * 0.25);
        scene.add(crystal);
      }
    }
  });

  // Curtains of energy across the corridors, until the hall before is clear.
  const curtains = corridors.map((corridor) => {
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), glowing('#63e9ff', 0.45));
    curtain.position.set(0, 2.5, corridor.z0 + 0.6);
    scene.add(curtain);
    return curtain;
  });

  // Portals: one by the entrance, always open; one at the far end, lit at the end.
  const portal = (z: number, lit: boolean) => {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 10, 40), toon('#e2dccb'));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), glowing('#9ff0ff', lit ? 0.8 : 0.15));
    disc.name = 'disc';
    group.add(ring, disc);
    group.position.set(0, 2.7, z);
    scene.add(group);
    return group;
  };
  const entrancePortal = portal(1.2, true);
  const last = halls[2].bounds;
  const exitPortal = portal(last.z1 - 1.2, false);
  exitPortal.rotation.y = Math.PI;

  const inside = (rect: Rect, x: number, z: number, margin: number) => x > rect.x0 + margin && x < rect.x1 - margin && z > rect.z0 + margin && z < rect.z1 - margin;
  return {
    scene,
    halls,
    start: new THREE.Vector3(0, 0, 8),
    entrance: entrancePortal.position.clone().setY(0),
    exit: exitPortal.position.clone().setY(0),
    chest: new THREE.Vector3(0, 0, last.z1 - 7),
    walkable(x, z) {
      if (halls.some((hall) => inside(hall.bounds, x, z, 0.9))) return true;
      return corridors.some((corridor, k) => open[k] && x > corridor.x0 + 0.8 && x < corridor.x1 - 0.8 && z > corridor.z0 - 1 && z < corridor.z1 + 1);
    },
    open(k) {
      if (open[k]) return;
      open[k] = true;
      curtains[k].visible = false;
    },
    finish() {
      ((exitPortal.getObjectByName('disc') as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85;
    },
    update(dt, seconds) {
      flames.forEach((flame, k) => flame.scale.set(1 + 0.08 * Math.sin(seconds * 9 + k), 1 + 0.15 * Math.sin(seconds * 12 + k * 2), 1));
      for (const curtain of curtains) (curtain.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.12 * Math.sin(seconds * 3);
      entrancePortal.children[1].rotation.z += dt;
      exitPortal.children[1].rotation.z += dt;
    },
  };
}
