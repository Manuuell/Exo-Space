// What there is out in space over the planet, in the game's soft cartoon
// style: a belt of lumpy asteroids with glowing veins of ore (a few rich in
// crystal) to shoot apart and mine, and motes of solar energy drifting in the
// starlight to fly through and gather. Always the same for the same planet.
// Original designs.

import * as THREE from 'three';
import { hash2, nameSeed } from './planet-look.ts';

/** The protagonist's light ramp, for the rocks. */
const RAMP = (() => {
  const data = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const u = Math.min(Math.max((i / 31 - 0.15) / 0.65, 0), 1);
    data[i] = Math.round(255 * (0.32 + 0.68 * u * u * (3 - 2 * u)));
  }
  const texture = new THREE.DataTexture(data, 32, 1, THREE.RedFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
})();

export type Material = 'ore' | 'crystal';

export interface Rock {
  object: THREE.Group;
  centre: THREE.Vector3;
  radius: number;
  health: number;
  most: number;
  /** What it breaks into. */
  yields: Material;
  spin: THREE.Vector3;
  /** Seconds until it is back, once broken. */
  gone: number;
}

export interface Pickup {
  object: THREE.Object3D;
  kind: Material | 'solar';
  velocity: THREE.Vector3;
  /** Seconds until it is back (solar motes) or gone for good (chunks). */
  gone: number;
  home?: THREE.Vector3;
}

const ORE = '#ff9a3d';
const CRYSTAL = '#ff8fc4';
const SOLAR = '#ffd23f';

function rockGeometry(seed: number): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  const point = new THREE.Vector3();
  // Lumpy: each point pushed in or out by smooth bumps over the sphere.
  for (let v = 0; v < position.count; v++) {
    point.fromBufferAttribute(position, v);
    const bump = 0.18 * Math.sin(point.x * 3 + seed) * Math.cos(point.y * 2.5 - seed) + 0.12 * Math.sin(point.z * 4 + seed * 2);
    point.multiplyScalar(1 + bump);
    position.setXYZ(v, point.x, point.y * 0.82, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function glowing(colour: string, size: number): THREE.Group {
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(new THREE.OctahedronGeometry(size, 0).scale(1, 1.5, 1), new THREE.MeshBasicMaterial({ color: colour })),
    new THREE.Mesh(new THREE.SphereGeometry(size * 2.2, 10, 8), new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })),
  );
  return group;
}

/** A chunk of ore or crystal, broken off an asteroid, to collect. */
export function chunk(kind: Material): THREE.Group {
  return glowing(kind === 'ore' ? ORE : CRYSTAL, 1.4);
}

export interface SpaceField {
  group: THREE.Group;
  rocks: Rock[];
  motes: Pickup[];
  /** Turns the rocks and brings back what was broken or gathered, once its time is up. */
  update(dt: number, seconds: number): void;
}

/**
 * The belt over a planet, starting `floor` metres up (where space starts):
 * 70 asteroids and 45 solar motes within about 3.5 km of the landing site.
 */
export function spaceField(planetName: string, floor: number): SpaceField {
  const seed = nameSeed(planetName) + 3301;
  let n = 0;
  const next = () => hash2(n * 13, n++ * 7 + 3, seed);
  const group = new THREE.Group();
  group.name = 'space';
  const shapes = Array.from({ length: 5 }, (_, k) => rockGeometry(k * 1.7 + 0.3));
  const rockLook = new THREE.MeshToonMaterial({ color: '#8c84a8', gradientMap: RAMP });
  const richLook = new THREE.MeshToonMaterial({ color: '#7a6fa0', gradientMap: RAMP });
  const rocks: Rock[] = [];
  for (let k = 0; k < 70; k++) {
    const angle = next() * Math.PI * 2;
    const reach = 400 + 3100 * Math.sqrt(next());
    const radius = 7 + 26 * next() ** 2;
    const yields: Material = next() < 0.18 ? 'crystal' : 'ore';
    const object = new THREE.Group();
    object.add(new THREE.Mesh(shapes[k % shapes.length], yields === 'crystal' ? richLook : rockLook));
    // Veins: glowing crystals stuck in the surface.
    const veins = yields === 'crystal' ? 7 : 4;
    for (let v = 0; v < veins; v++) {
      const vein = glowing(yields === 'crystal' ? CRYSTAL : ORE, 0.12);
      const direction = new THREE.Vector3(next() - 0.5, (next() - 0.5) * 0.8, next() - 0.5).normalize();
      vein.position.copy(direction).multiplyScalar(0.92);
      vein.lookAt(direction.clone().multiplyScalar(2));
      object.add(vein);
    }
    object.scale.setScalar(radius);
    const centre = new THREE.Vector3(Math.sin(angle) * reach, floor + 250 + next() * 2200, Math.cos(angle) * reach);
    object.position.copy(centre);
    object.rotation.set(next() * 6, next() * 6, next() * 6);
    group.add(object);
    const most = Math.round(20 + radius * 6);
    rocks.push({ object, centre, radius, health: most, most, yields, spin: new THREE.Vector3(next() - 0.5, next() - 0.5, next() - 0.5).multiplyScalar(0.4), gone: 0 });
  }
  const motes: Pickup[] = [];
  for (let k = 0; k < 45; k++) {
    const object = glowing(SOLAR, 2.2);
    const home = new THREE.Vector3((next() - 0.5) * 6000, floor + 150 + next() * 2600, (next() - 0.5) * 6000);
    object.position.copy(home);
    group.add(object);
    motes.push({ object, kind: 'solar', velocity: new THREE.Vector3(), gone: 0, home });
  }
  return {
    group,
    rocks,
    motes,
    update(dt, seconds) {
      for (const rock of rocks) {
        if (rock.gone > 0) {
          rock.gone -= dt;
          if (rock.gone <= 0) {
            rock.health = rock.most;
            rock.object.visible = true;
          }
          continue;
        }
        rock.object.rotation.x += rock.spin.x * dt;
        rock.object.rotation.y += rock.spin.y * dt;
        rock.object.rotation.z += rock.spin.z * dt;
      }
      for (const mote of motes) {
        if (mote.gone > 0) {
          mote.gone -= dt;
          if (mote.gone <= 0) mote.object.visible = true;
          continue;
        }
        mote.object.position.copy(mote.home!).y += Math.sin(seconds + mote.home!.x) * 6;
        mote.object.rotation.y += dt;
      }
    },
  };
}
