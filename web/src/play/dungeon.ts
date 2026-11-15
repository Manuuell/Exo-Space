// The inside of a dungeon: a ruined temple of the first colonists under the
// gate, in the game's soft cartoon style. Three halls in a line joined by
// passages: an entrance hall, a great hall and the sanctuary where the
// guardian waits. Massive walls of worn stone with broken tops, pilasters,
// niches with statues and torn banners; colonnades down both sides, some
// columns fallen; a broken roof of beams and slabs, with shafts of light
// through its holes; worn flagstones, a crimson runner and a ring of runes in
// every hall; braziers of fire. Each passage is closed by stone doors sealed
// with runes, which swing open once the hall before is cleared. A portal by
// the entrance leads back out; another, between two seated colossi at the
// end of the sanctuary, lights up once the guardian falls. A scene of its
// own, in metres, the entrance at the origin and the halls going along +Z.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
const glowing = (colour: string, opacity = 1) => new THREE.MeshBasicMaterial({ color: colour, transparent: opacity < 1, opacity, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacity === 1, side: THREE.DoubleSide });

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
  /** Where the reward chest stands, in the sanctuary. */
  chest: THREE.Vector3;
  /** Whether she (or a guard) can stand at a point: inside a hall, or a passage whose doors are open. */
  walkable(x: number, z: number): boolean;
  /** Opens the doors after hall k. */
  open(k: number): void;
  /** Lights the far portal once the guardian is down. */
  finish(): void;
  update(dt: number, seconds: number): void;
}

const STONE = ['#b7ab94', '#a69b85', '#c3b8a1', '#9a8f7b'];
const FLOOR = ['#8f8573', '#857b69', '#978d7a', '#7c7362'];
const WALL_H = 11;
const PASSAGE = 3.5;
/** Rune colours: the entrance, the great hall, the sanctuary. */
const RUNES = ['#7ff7e0', '#9fc8ff', '#ff8fc4'];

export function buildDungeon(index: number): Dungeon {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120e18');
  scene.fog = new THREE.Fog('#120e18', 22, 120);
  scene.add(new THREE.HemisphereLight('#a596c8', '#1c1626', 1.05));
  // Daylight falling through the broken roof.
  const sunlight = new THREE.DirectionalLight('#ffe7c4', 0.75);
  sunlight.position.set(14, 60, 30);
  scene.add(sunlight);

  // A little random that is always the same for the same dungeon.
  let seed = 1 + index * 977;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Three halls, a little different in each dungeon.
  const grow = [0, 4, 8][index % 3];
  const halls: DungeonHall[] = [
    { bounds: { x0: -12, x1: 12, z0: 0, z1: 26 }, spawns: [[-5, 18], [5, 18], [0, 22]] },
    { bounds: { x0: -16 - grow / 2, x1: 16 + grow / 2, z0: 38, z1: 72 + grow }, spawns: [[-7, 52], [7, 52], [-6, 64], [6, 64], [0, 58]] },
    { bounds: { x0: -22, x1: 22, z0: 84 + grow, z1: 130 + grow }, spawns: [[-12, 112 + grow], [12, 112 + grow]], boss: [0, 112 + grow] },
  ];
  const passages: Rect[] = [
    { x0: -PASSAGE, x1: PASSAGE, z0: halls[0].bounds.z1, z1: halls[1].bounds.z0 },
    { x0: -PASSAGE, x1: PASSAGE, z0: halls[1].bounds.z1, z1: halls[2].bounds.z0 },
  ];
  const opened = [false, false];

  // Most of the stone is merged into a few meshes, one per material.
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const put = (geometry: THREE.BufferGeometry, look: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0) => {
    const shape = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    shape.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)));
    for (const name of Object.keys(shape.attributes)) if (name !== 'position' && name !== 'normal') shape.deleteAttribute(name);
    const list = batches.get(look) ?? [];
    list.push(shape);
    batches.set(look, list);
  };
  const stoneLook = STONE.map((colour) => toon(colour));
  const darkLook = toon('#6e6558');
  const mossLook = toon('#5fa846');
  const vineLook = toon('#4c8f3c');
  const bronzeLook = toon('#b9853a');
  const clothLook = toon('#8e2a3a', { side: THREE.DoubleSide });
  const goldLook = toon('#f2b84b');
  const flames: THREE.Object3D[] = [];

  // --- Floors: worn flagstones, a crimson runner, a ring of runes ----------------------
  const floor = (rect: Rect, runner: boolean, rune: string | null) => {
    const w = rect.x1 - rect.x0;
    const d = rect.z1 - rect.z0;
    const tiles = new THREE.PlaneGeometry(w, d, Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(d / 3))).rotateX(-Math.PI / 2).toNonIndexed();
    const colours = new Float32Array(tiles.attributes.position.count * 3);
    const tone = new THREE.Color();
    for (let t = 0; t < tiles.attributes.position.count; t += 6) {
      tone.set(FLOOR[Math.floor(rand() * FLOOR.length)]).multiplyScalar(0.85 + rand() * 0.2);
      for (let v = 0; v < 6; v++) colours.set([tone.r, tone.g, tone.b], (t + v) * 3);
    }
    tiles.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    const mesh = new THREE.Mesh(tiles, toon('#ffffff', { vertexColors: true }));
    mesh.position.set((rect.x0 + rect.x1) / 2, 0, (rect.z0 + rect.z1) / 2);
    scene.add(mesh);
    if (runner) {
      const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, d - 2).rotateX(-Math.PI / 2), toon('#7a2430'));
      carpet.position.set(0, 0.02, (rect.z0 + rect.z1) / 2);
      for (const side of [-1, 1]) {
        const trim = new THREE.Mesh(new THREE.PlaneGeometry(0.3, d - 2).rotateX(-Math.PI / 2), goldLook);
        trim.position.set(side * 2.25, 0.025, (rect.z0 + rect.z1) / 2);
        scene.add(trim);
      }
      scene.add(carpet);
    }
    if (rune) {
      const cz = (rect.z0 + rect.z1) / 2;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(6.5, 48).rotateX(-Math.PI / 2), toon('#5d5548'));
      disc.position.set(0, 0.03, cz);
      const outer = new THREE.Mesh(new THREE.RingGeometry(5.6, 6.1, 64).rotateX(-Math.PI / 2), glowing(rune, 0.75));
      outer.position.set(0, 0.04, cz);
      const inner = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.9, 6).rotateX(-Math.PI / 2), glowing(rune, 0.75));
      inner.position.set(0, 0.04, cz);
      scene.add(disc, outer, inner);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.2).rotateX(-Math.PI / 2), glowing(rune, 0.8));
        mark.position.set(Math.sin(a) * 4.3, 0.045, cz + Math.cos(a) * 4.3);
        mark.rotation.y = a;
        scene.add(mark);
      }
    }
  };
  halls.forEach((hall, k) => floor(hall.bounds, k < 2, RUNES[k]));
  for (const passage of passages) floor(passage, false, null);

  // --- Walls: huge worn blocks, broken at the top, with pilasters -----------------------
  const blockShape = new THREE.BoxGeometry(1, 1, 1);
  const wall = (x0: number, z0: number, x1: number, z1: number, height: number, broken: boolean) => {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const yaw = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
    const blocks = Math.max(1, Math.round(length / 3.2));
    const rows = Math.round(height / 1.9);
    for (let b = 0; b < blocks; b++) {
      const t = (b + 0.5) / blocks;
      // The top rows crumble here and there.
      const top = broken ? rows - Math.floor(rand() * rand() * 3) : rows;
      for (let row = 0; row < top; row++) {
        const shape = blockShape.clone().scale(length / blocks + 0.12, 1.92, 1.8 + (row % 2) * 0.15);
        put(shape, stoneLook[Math.floor(rand() * stoneLook.length)], x0 + (x1 - x0) * t, 0.95 + row * 1.9, z0 + (z1 - z0) * t, yaw + (rand() - 0.5) * 0.02);
      }
      if (rand() < 0.45) put(new THREE.SphereGeometry(1, 8, 5).scale(length / blocks / 2.2, 0.35, 1), mossLook, x0 + (x1 - x0) * t, top * 1.9 + 0.05, z0 + (z1 - z0) * t, yaw);
      // Vines hanging from the broken top.
      if (rand() < 0.3) put(blockShape.clone().scale(0.25, 2 + rand() * 3, 0.12), vineLook, x0 + (x1 - x0) * t + (rand() - 0.5), top * 1.9 - 2, z0 + (z1 - z0) * t, yaw);
    }
  };

  // A statue of the first colonists: a robed figure holding a staff, on a plinth.
  const statue = (x: number, z: number, yaw: number, scale = 1) => {
    const g = (geometry: THREE.BufferGeometry, look: THREE.Material, px: number, py: number, pz: number) =>
      put(geometry.scale(scale, scale, scale), look, x + (px * Math.cos(yaw) + pz * Math.sin(yaw)) * scale, py * scale, z + (-px * Math.sin(yaw) + pz * Math.cos(yaw)) * scale, yaw);
    g(new THREE.BoxGeometry(2, 1, 2), darkLook, 0, 0.5, 0);
    g(new THREE.CylinderGeometry(0.55, 1.0, 3.2, 10), stoneLook[2], 0, 2.6, 0);
    g(new THREE.SphereGeometry(0.5, 12, 8), stoneLook[2], 0, 4.55, 0);
    g(new THREE.CylinderGeometry(0.55, 0.7, 0.5, 10), stoneLook[1], 0, 4.95, -0.05);
    g(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 6), bronzeLook, 0.75, 3.0, 0.35);
    g(new THREE.SphereGeometry(0.28, 10, 8), goldLook, 0.75, 5.2, 0.35);
    g(new THREE.BoxGeometry(0.3, 1.4, 0.3), stoneLook[2], 0.55, 3.4, 0.2);
  };

  // A brazier of fire on a bronze stand.
  const brazier = (x: number, z: number, light: string | null) => {
    put(new THREE.CylinderGeometry(0.25, 0.45, 2.2, 8), bronzeLook, x, 1.1, z);
    put(new THREE.CylinderGeometry(0.85, 0.4, 0.7, 12), bronzeLook, x, 2.5, z);
    const flame = new THREE.Group();
    flame.add(
      new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8).scale(1, 1.6, 1), glowing('#ffd36b')),
      new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8).scale(1, 1.5, 1), glowing('#ff7a2a', 0.3)),
    );
    flame.position.set(x, 3.05, z);
    flames.push(flame);
    scene.add(flame);
    if (light) {
      const lamp = new THREE.PointLight(light, 26, 34, 1.6);
      lamp.position.set(x, 4.2, z);
      scene.add(lamp);
    }
  };

  // A column: base, fluted shaft, capital. Broken ones stop short, a drum fallen beside.
  const column = (x: number, z: number, broken: boolean) => {
    const height = broken ? 2.5 + rand() * 3.5 : WALL_H - 0.6;
    put(new THREE.BoxGeometry(2.2, 0.6, 2.2), darkLook, x, 0.3, z);
    put(new THREE.CylinderGeometry(0.85, 0.95, height, 12), stoneLook[0], x, 0.6 + height / 2, z);
    if (broken) {
      put(new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12), stoneLook[3], x + (rand() - 0.5) * 3, 0.85, z + (rand() - 0.5) * 3, rand() * 3, Math.PI / 2);
      for (let r = 0; r < 4; r++) put(new THREE.DodecahedronGeometry(0.3 + rand() * 0.4, 0), stoneLook[1], x + (rand() - 0.5) * 3, 0.25, z + (rand() - 0.5) * 3, rand() * 3);
    } else {
      put(new THREE.BoxGeometry(2.3, 0.7, 2.3), stoneLook[2], x, 0.6 + height + 0.35, z);
    }
  };

  halls.forEach((hall, k) => {
    const { x0, x1, z0, z1 } = hall.bounds;
    const last = k === halls.length - 1;
    // Side walls, with the end walls open where the passages meet.
    wall(x0, z0, x0, z1, WALL_H, true);
    wall(x1, z0, x1, z1, WALL_H, true);
    if (k === 0) wall(x0, z0, x1, z0, WALL_H, true);
    else {
      wall(x0, z0, -PASSAGE - 1, z0, WALL_H, true);
      wall(PASSAGE + 1, z0, x1, z0, WALL_H, true);
    }
    if (last) wall(x0, z1, x1, z1, WALL_H + 2, false);
    else {
      wall(x0, z1, -PASSAGE - 1, z1, WALL_H, true);
      wall(PASSAGE + 1, z1, x1, z1, WALL_H, true);
    }

    // Pilasters along the side walls, banners and niches with statues between them.
    for (let z = z0 + 5; z < z1 - 3; z += 7) {
      for (const side of [-1, 1]) {
        const wx = side < 0 ? x0 + 0.9 : x1 - 0.9;
        put(new THREE.BoxGeometry(1.4, WALL_H + 0.5, 1.6), stoneLook[3], wx, (WALL_H + 0.5) / 2, z);
        if (rand() < 0.55) {
          const banner = new THREE.PlaneGeometry(1.8, 4.2, 1, 4);
          const position = banner.attributes.position;
          for (let v = 0; v < position.count; v++) if (position.getY(v) < -1.5) position.setX(v, position.getX(v) + (rand() - 0.5) * 0.4);
          put(banner, clothLook, wx - side * 0.85, WALL_H - 3.6, z + 2.2, side < 0 ? Math.PI / 2 : -Math.PI / 2);
          put(new THREE.CircleGeometry(0.45, 16), goldLook, wx - side * 0.87, WALL_H - 3.0, z + 2.2, side < 0 ? Math.PI / 2 : -Math.PI / 2);
        }
      }
    }
    for (const side of [-1, 1]) statue(side < 0 ? x0 + 2.2 : x1 - 2.2, (z0 + z1) / 2 + 3.5, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0.85);

    // Colonnades down both sides, a quarter of the columns fallen.
    const inset = Math.min(5.5, (x1 - x0) / 2 - 4.5);
    for (let z = z0 + 4; z <= z1 - 4; z += 7) {
      for (const side of [-1, 1]) column(side * ((x1 - x0) / 2 - inset), z, rand() < 0.25);
    }

    // The broken roof: beams across, slabs between some of them, light through the gaps.
    for (let z = z0 + 2; z <= z1 - 1; z += 6) {
      if (rand() < 0.8) put(new THREE.BoxGeometry(x1 - x0 + 2, 1, 1), darkLook, (x0 + x1) / 2, WALL_H + 0.5, z);
      if (rand() < 0.55) put(new THREE.BoxGeometry((x1 - x0) / 2 + 2, 0.6, 5), stoneLook[1], rand() < 0.5 ? x0 + (x1 - x0) / 4 : x1 - (x1 - x0) / 4, WALL_H + 1.2, z + 3);
      else if (z + 3 < z1 - 2) {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, WALL_H + 1, 16, 1, true), glowing('#fff1d0', 0.1));
        shaft.position.set((rand() - 0.5) * (x1 - x0) * 0.4, (WALL_H + 1) / 2, z + 3);
        shaft.renderOrder = 3;
        scene.add(shaft);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(3.1, 24).rotateX(-Math.PI / 2), glowing('#fff1d0', 0.12));
        pool.position.set(shaft.position.x, 0.05, z + 3);
        scene.add(pool);
      }
    }

    // Braziers down the hall, two of them lit.
    for (const side of [-1, 1]) {
      for (const t of [0.3, 0.72]) brazier(side * ((x1 - x0) / 2 - 2.6), z0 + (z1 - z0) * t, t === 0.3 ? (last ? '#ff9ad8' : '#ffb46b') : null);
    }
    // Rubble along the walls.
    for (let r = 0; r < 10; r++) {
      const side = rand() < 0.5 ? -1 : 1;
      put(new THREE.DodecahedronGeometry(0.35 + rand() * 0.6, 0), stoneLook[Math.floor(rand() * 4)], side * ((x1 - x0) / 2 - 1.6 - rand()), 0.3, z0 + 2 + rand() * (z1 - z0 - 4), rand() * 3, rand());
    }
    if (last) {
      // Two seated colossi watch over the far portal, and fires ring the sanctuary.
      for (const side of [-1, 1]) {
        const cx = side * 9;
        const cz = z1 - 4;
        put(new THREE.BoxGeometry(5, 2.5, 5), darkLook, cx, 1.25, cz);
        put(new THREE.BoxGeometry(4, 2.4, 3.6), stoneLook[2], cx, 3.7, cz + 0.6);
        put(new THREE.BoxGeometry(3.4, 5, 2.6), stoneLook[2], cx, 7.4, cz - 0.4);
        put(new THREE.SphereGeometry(1.3, 14, 10), stoneLook[2], cx, 10.8, cz - 0.2);
        put(new THREE.CylinderGeometry(1.4, 1.6, 1.2, 12), goldLook, cx, 12.2, cz - 0.2);
        for (const arm of [-1, 1]) put(new THREE.BoxGeometry(0.9, 0.9, 3.2), stoneLook[1], cx + arm * 1.9, 5.3, cz + 0.9);
      }
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * Math.PI * 2 + Math.PI / 6;
        brazier(Math.sin(a) * 14, (z0 + z1) / 2 + 2 + Math.cos(a) * 14, null);
      }
    }
  });

  // --- Passages: arched tunnels, closed by stone doors sealed with runes -----------------
  const doors = passages.map((passage, k) => {
    wall(passage.x0 - 0.9, passage.z0, passage.x0 - 0.9, passage.z1, 7, false);
    wall(passage.x1 + 0.9, passage.z0, passage.x1 + 0.9, passage.z1, 7, false);
    put(new THREE.BoxGeometry(PASSAGE * 2 + 4, 1.2, passage.z1 - passage.z0), darkLook, 0, 7.6, (passage.z0 + passage.z1) / 2);
    // The arch where the passage leaves the hall.
    for (const z of [passage.z0, passage.z1]) {
      for (const side of [-1, 1]) put(new THREE.BoxGeometry(1.6, 7, 2.2), stoneLook[3], side * (PASSAGE + 0.8), 3.5, z);
      put(new THREE.TorusGeometry(PASSAGE + 0.8, 0.8, 8, 20, Math.PI), stoneLook[3], 0, 7, z);
    }
    brazier(-PASSAGE + 0.6, passage.z0 + 4, null);
    brazier(PASSAGE - 0.6, passage.z1 - 4, null);
    // Two stone leaves, hinged at the sides, with a ring of runes across them.
    const leaves = [-1, 1].map((side) => {
      const hinge = new THREE.Group();
      hinge.position.set(side * PASSAGE, 0, passage.z0 + 1.2);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(PASSAGE, 6.4, 0.6), toon('#8a806e'));
      leaf.position.set(-side * PASSAGE / 2, 3.2, 0);
      const rune = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.14, 6, 32, Math.PI), glowing(RUNES[k + 1]));
      rune.position.set(-side * PASSAGE, 3.4, -0.34);
      rune.rotation.z = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      const studs = [1.2, 3.2, 5.2].map((y) => {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), toon('#b9853a'));
        stud.position.set(-side * PASSAGE * 0.3, y, -0.32);
        return stud;
      });
      hinge.add(leaf, rune, ...studs);
      scene.add(hinge);
      return { hinge, rune, side };
    });
    return { leaves, swing: 0 };
  });

  // --- Portals: one by the entrance, always open; one between the colossi, lit at the end --
  const portal = (z: number, lit: boolean) => {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.4, 10, 40), toon('#c3b8a1'));
    const runes = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.08, 6, 40), glowing('#9ff0ff', lit ? 1 : 0.3));
    runes.position.z = -0.42;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), glowing('#9ff0ff', lit ? 0.8 : 0.12));
    disc.name = 'disc';
    group.add(ring, runes, disc);
    group.position.set(0, 2.7, z);
    scene.add(group);
    return group;
  };
  const entrancePortal = portal(1.2, true);
  const last = halls[2].bounds;
  const exitPortal = portal(last.z1 - 1.2, false);
  exitPortal.rotation.y = Math.PI;

  // All the stone, merged.
  for (const [look, list] of batches) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    merged.computeVertexNormals();
    scene.add(new THREE.Mesh(merged, look));
  }

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
      return passages.some((passage, k) => opened[k] && x > passage.x0 + 0.8 && x < passage.x1 - 0.8 && z > passage.z0 - 1 && z < passage.z1 + 1);
    },
    open(k) {
      if (opened[k]) return;
      opened[k] = true;
    },
    finish() {
      ((exitPortal.getObjectByName('disc') as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.85;
      ((exitPortal.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1;
    },
    update(dt, seconds) {
      flames.forEach((flame, k) => flame.scale.set(1 + 0.08 * Math.sin(seconds * 9 + k), 1 + 0.15 * Math.sin(seconds * 12 + k * 2), 1));
      // The doors of a cleared hall swing open, and their runes go dark.
      doors.forEach((door, k) => {
        if (!opened[k] || door.swing >= 1) return;
        door.swing = Math.min(1, door.swing + dt / 1.4);
        const ease = door.swing * door.swing * (3 - 2 * door.swing);
        for (const leaf of door.leaves) {
          leaf.hinge.rotation.y = leaf.side * ease * 1.75;
          (leaf.rune.material as THREE.MeshBasicMaterial).color.set(RUNES[k + 1]).multiplyScalar(1 - ease * 0.85);
        }
      });
      entrancePortal.children[2].rotation.z += dt;
      exitPortal.children[2].rotation.z += dt;
    },
  };
}
