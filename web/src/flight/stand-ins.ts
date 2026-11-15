// Stand-ins for what the design chat and the planet generator will make: a
// ground to fly over, something to tell speed by, and a ship. They are here
// so the flight can be tried; none of this is the look of the game.

import * as THREE from 'three';
import { startingPhase } from '../content/system.ts';

/**
 * A ground of gentle hills, different for each planet name and flat around
 * the origin, where the ship starts.
 */
export function standInGround(name: string): (x: number, z: number) => number {
  const seed = startingPhase(name) * 1000;
  return (x, z) => {
    const hills = 46 * Math.sin(x / 260 + seed) * Math.cos(z / 310 + seed * 1.7)
      + 20 * Math.sin(x / 97 + z / 131 + seed * 0.3)
      + 7 * Math.sin(z / 43 - x / 57);
    const fromStart = Math.hypot(x, z);
    const rise = Math.min(1, Math.max(0, (fromStart - 70) / 260));
    return hills * rise * rise * (3 - 2 * rise);
  };
}

const CELL = 50;
const CELLS = 180;

/** A square of ground that stays under the ship: it is redrawn as the ship moves on. */
export class GroundPatch {
  readonly mesh: THREE.Mesh;
  private readonly ground: (x: number, z: number) => number;
  private centre = { i: NaN, k: NaN };

  constructor(ground: (x: number, z: number) => number) {
    this.ground = ground;
    const geometry = new THREE.PlaneGeometry(CELL * CELLS, CELL * CELLS, CELLS, CELLS).rotateX(-Math.PI / 2);
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
    this.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    this.mesh.frustumCulled = false;
  }

  /** Redraws the patch around a point, when the ship has left the cell it was drawn for. */
  follow(x: number, z: number): void {
    const i = Math.round(x / CELL);
    const k = Math.round(z / CELL);
    if (i === this.centre.i && k === this.centre.k) return;
    this.centre = { i, k };
    const position = this.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const colour = this.mesh.geometry.attributes.color as THREE.BufferAttribute;
    let vertex = 0;
    for (let row = 0; row <= CELLS; row++) {
      for (let column = 0; column <= CELLS; column++) {
        const cellX = i - CELLS / 2 + column;
        const cellZ = k - CELLS / 2 + row;
        const height = this.ground(cellX * CELL, cellZ * CELL);
        position.setXYZ(vertex, cellX * CELL, height, cellZ * CELL);
        // A checker in two greys, lighter on high ground: it reads as speed.
        const shade = ((cellX + cellZ) & 1 ? 0.5 : 0.42) + height / 400;
        colour.setXYZ(vertex, shade * 0.95, shade, shade * 1.02);
        vertex++;
      }
    }
    position.needsUpdate = true;
    colour.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}

/** Pillars scattered around the start, and a pad under the ship: things to fly past. */
export function landmarks(ground: (x: number, z: number) => number): THREE.Group {
  const group = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.4, 32), new THREE.MeshLambertMaterial({ color: '#8d93a6' }));
  pad.position.y = 0.2;
  group.add(pad);
  const count = 260;
  const pillars = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#9aa0b4' }), count);
  const place = new THREE.Matrix4();
  for (let n = 0; n < count; n++) {
    // The same pillars every time: positions from a fixed sequence.
    const angle = n * 2.399963;
    const reach = 120 + 28 * n;
    const x = Math.cos(angle) * reach;
    const z = Math.sin(angle) * reach;
    const height = 20 + ((n * 37) % 90);
    const width = 6 + ((n * 13) % 9);
    place.makeScale(width, height, width).setPosition(x, ground(x, z) + height / 2, z);
    pillars.setMatrixAt(n, place);
  }
  group.add(pillars);
  return group;
}

/**
 * A plain ship: a body, two wings, a fin and an engine light. Its nose points
 * along +Z and its origin is on the ground under it.
 */
export function standInShip(): THREE.Group {
  const hull = new THREE.MeshLambertMaterial({ color: '#d7dbe6', flatShading: true });
  const dark = new THREE.MeshLambertMaterial({ color: '#4a5068', flatShading: true });
  const ship = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 8), hull);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 1.9, 0.6);
  const wings = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.25, 2.4), hull);
  wings.position.set(0, 1.6, -1.6);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.8, 1.8), dark);
  fin.position.set(0, 2.9, -2.6);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), dark);
  canopy.scale.set(0.8, 0.6, 1.5);
  canopy.position.set(0, 2.5, 1);
  const skids = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 3.4), dark);
  skids.position.set(0, 0.45, -0.6);
  const engine = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: '#63e9ff' }));
  engine.name = 'engine';
  engine.position.set(0, 1.9, -3.5);
  ship.add(body, wings, fin, canopy, skids, engine);
  return ship;
}
