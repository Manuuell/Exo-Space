// The modelling kit. Every model in the game is code that assembles these
// parts: chunky shapes, three-tone toon shading, a thick dark outline, and
// clips that move whole nodes (position, rotation, scale), never vertices.
//
// Conventions for every model:
// - Units in metres, origin at ground level, facing +Z. The character's left
//   is +X.
// - A hierarchy of rigid nodes with names that are unique in the whole model.
//   The game animates nodes by name; parts inside a node never move alone.
// - Materials only from this kit (toon and glow), so models share them and
//   the renderer can batch.
// - Rotations are written in degrees.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AttackTiming, ModelType, PlanetLook } from './contract.ts';

export type Vec3 = readonly [number, number, number];
export type Colour = string | number;

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------

/** The game's base colours. Planet palettes are derived on top of these. */
export const PALETTE = {
  /** Outline and the darkest details. */
  ink: '#1b1726',
  coal: '#2b2838',
  slate: '#4a4860',
  steel: '#7c7f99',
  cloud: '#c9cde0',
  snow: '#f3f4fa',
  navy: '#1f2a4a',
  cyan: '#5ce1ff',
  mint: '#5be3a8',
  moss: '#5f9c4a',
  sand: '#e8c37e',
  rust: '#b5562f',
  ember: '#ff8a3d',
  sun: '#ffd23f',
  red: '#ff4b3e',
  pink: '#ff7eb6',
  violet: '#8d4bff',
  lilac: '#c58bff',
} as const;

/** Default outline width, in metres, for a model about a person's size. */
export const OUTLINE = 0.022;

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

/** Three light steps: shadow, middle and lit. */
const GRADIENT = (() => {
  const texture = new THREE.DataTexture(new Uint8Array([0, 110, 255]), 3, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

const materials = new Map<string, THREE.Material>();

function hex(colour: Colour): string {
  return new THREE.Color(colour).getHexString();
}

/** Three-tone toon shading in a flat colour. Shared by every model. */
export function toon(colour: Colour): THREE.MeshToonMaterial {
  const key = `toon:${hex(colour)}`;
  let material = materials.get(key) as THREE.MeshToonMaterial | undefined;
  if (!material) {
    material = new THREE.MeshToonMaterial({ color: colour, gradientMap: GRADIENT });
    material.name = key;
    material.userData.kit = 'toon';
    materials.set(key, material);
  }
  return material;
}

/** A smooth ramp of light, from a bright shadow side to the lit side. */
const SOFT_RAMP = (() => {
  const size = 32;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const u = Math.min(Math.max((i / (size - 1) - 0.2) / 0.6, 0), 1);
    data[i] = Math.round(255 * (0.46 + 0.54 * u * u * (3 - 2 * u)));
  }
  const texture = new THREE.DataTexture(data, size, 1, THREE.RedFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

/**
 * The soft cartoon look: a flat colour under a smooth ramp of light, with a
 * pale glow along the edges that face away from the camera. No outline.
 * `rim` is how strong that glow is, from 0 to 1.
 */
export function soft(colour: Colour, rim = 0.4): THREE.MeshToonMaterial {
  const key = `soft:${hex(colour)}:${rim}`;
  let material = materials.get(key) as THREE.MeshToonMaterial | undefined;
  if (!material) {
    const created = new THREE.MeshToonMaterial({ color: colour, gradientMap: SOFT_RAMP });
    created.name = key;
    created.userData.kit = 'soft';
    const glowColour = new THREE.Color(colour).lerp(new THREE.Color('#ffffff'), 0.6).multiplyScalar(rim);
    created.onBeforeCompile = (shader) => {
      shader.uniforms.softRim = { value: glowColour };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 softRim;')
        .replace(
          '#include <opaque_fragment>',
          'outgoingLight += softRim * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 2.4 );\n#include <opaque_fragment>',
        );
    };
    created.customProgramCacheKey = () => 'kit-soft';
    materials.set(key, created);
    material = created;
  }
  return material;
}

/** Unshaded colour for whatever gives off light: eyes, crystals, cores. */
export function glow(colour: Colour): THREE.MeshBasicMaterial {
  const key = `glow:${hex(colour)}`;
  let material = materials.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: colour, toneMapped: false });
    material.name = key;
    material.userData.kit = 'glow';
    materials.set(key, material);
  }
  return material;
}

// Realistic surfaces: physically based, lit by the environment, with no
// outline. Shared by every model like the toon ones.

function standard(key: string, kind: string, make: () => THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  let material = materials.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!material) {
    material = make();
    material.name = key;
    material.userData.kit = kind;
    materials.set(key, material);
  }
  return material;
}

/** Physically based surface: metalness and roughness from 0 to 1. */
export function pbr(colour: Colour, metalness = 0, roughness = 0.6): THREE.MeshStandardMaterial {
  return standard(`pbr:${hex(colour)}:${metalness}:${roughness}`, 'pbr', () =>
    new THREE.MeshStandardMaterial({ color: colour, metalness, roughness }));
}

/** Suit cloth and padding. */
export const fabric = (colour: Colour) => pbr(colour, 0, 0.9);
/** Hard shells, plates and casings. */
export const plastic = (colour: Colour) => pbr(colour, 0, 0.35);
/** Rings, bearings, canisters and tools. */
export const metal = (colour: Colour) => pbr(colour, 0.9, 0.3);
/** Gloves, soles, seals and hoses. */
export const rubber = (colour: Colour) => pbr(colour, 0, 0.95);

/** Lacquered armour: a hard, polished coat that catches the light. */
export function lacquer(colour: Colour): THREE.MeshStandardMaterial {
  return standard(`lacquer:${hex(colour)}`, 'lacquer', () =>
    new THREE.MeshPhysicalMaterial({ color: colour, metalness: 0.1, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.22 }));
}

/** Satin suit cloth: woven, with a sheen that follows the light. */
export function satin(colour: Colour): THREE.MeshStandardMaterial {
  return standard(`satin:${hex(colour)}`, 'satin', () =>
    new THREE.MeshPhysicalMaterial({
      color: colour, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4,
      sheen: 0.7, sheenRoughness: 0.4, sheenColor: new THREE.Color(colour).lerp(new THREE.Color('#ffffff'), 0.35),
    }));
}

/** A helmet visor: dark, glossy and reflective. */
export function visor(colour: Colour = '#0c1a2e'): THREE.MeshStandardMaterial {
  return standard(`visor:${hex(colour)}`, 'visor', () =>
    new THREE.MeshPhysicalMaterial({ color: colour, metalness: 0.55, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }));
}

/** A light that is part of the model: shines by itself and blooms. */
export function lamp(colour: Colour, intensity = 2.5): THREE.MeshStandardMaterial {
  return standard(`lamp:${hex(colour)}:${intensity}`, 'lamp', () =>
    new THREE.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: intensity, roughness: 0.4 }));
}

/**
 * A soft glow around a light: unshaded and added on top of what is behind
 * it. Wrap a lit part in a slightly bigger one painted with this.
 */
export function halo(colour: Colour, opacity = 0.3): THREE.MeshBasicMaterial {
  const key = `halo:${hex(colour)}:${opacity}`;
  let material = materials.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: colour, toneMapped: false, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    material.name = key;
    material.userData.kit = 'halo';
    materials.set(key, material);
  }
  return material;
}

/**
 * See-through glass for helmet bubbles and lenses: toon-shaded so it still
 * shows its shape, without outline (it would show through the glass).
 */
export function glass(colour: Colour = '#bfe6ff', opacity = 0.25): THREE.MeshToonMaterial {
  const key = `glass:${hex(colour)}:${opacity}`;
  let material = materials.get(key) as THREE.MeshToonMaterial | undefined;
  if (!material) {
    material = new THREE.MeshToonMaterial({ color: colour, gradientMap: GRADIENT, transparent: true, opacity, depthWrite: false });
    material.name = key;
    material.userData.kit = 'glass';
    materials.set(key, material);
  }
  return material;
}

/**
 * The dark outline: the back faces of each part, pushed out along its
 * smoothed normals. Added by model() to every part that asks for it.
 */
function outlineMaterial(width: number): THREE.MeshBasicMaterial {
  const key = `outline:${width.toFixed(4)}`;
  let material = materials.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!material) {
    const created = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide });
    created.name = key;
    created.userData.kit = 'outline';
    created.userData.width = width;
    created.onBeforeCompile = (shader) => {
      shader.uniforms.outlineWidth = { value: width };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute vec3 smoothNormal;\nuniform float outlineWidth;',
        )
        .replace(
          '#include <begin_vertex>',
          'vec3 transformed = position + normalize(smoothNormal) * outlineWidth;',
        );
    };
    created.customProgramCacheKey = () => 'kit-outline';
    materials.set(key, created);
    material = created;
  }
  return material;
}

/** True for materials made by this kit. */
export function isKitMaterial(material: THREE.Material): boolean {
  return typeof material.userData.kit === 'string';
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------
// Shapes are cached geometries: the same call twice gives the same geometry.
// They are centred on the origin, except cone, spike and dome, which grow
// up from y = 0.

const geometries = new Map<string, THREE.BufferGeometry>();

function shape(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geometry = geometries.get(key);
  if (!geometry) {
    geometry = prepare(make());
    geometry.name = key;
    geometries.set(key, geometry);
  }
  return geometry;
}

/** Keeps position and normal only, and adds the outline's smoothed normals. */
function prepare(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(geometry.attributes)) {
    if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
  }
  if (!geometry.index) {
    const count = geometry.attributes.position.count;
    geometry.setIndex(Array.from({ length: count }, (_, i) => i));
  }
  geometry.setAttribute('smoothNormal', smoothNormals(geometry));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Normals averaged over every vertex at the same position, so the outline
 * pushes out without opening gaps at seams and hard edges.
 */
function smoothNormals(geometry: THREE.BufferGeometry): THREE.BufferAttribute {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const sums = new Map<string, number[]>();
  const keys: string[] = [];
  for (let i = 0; i < position.count; i++) {
    const key = `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
    keys.push(key);
    const sum = sums.get(key) ?? [0, 0, 0];
    sum[0] += normal.getX(i);
    sum[1] += normal.getY(i);
    sum[2] += normal.getZ(i);
    sums.set(key, sum);
  }
  const out = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const [x, y, z] = sums.get(keys[i])!;
    const length = Math.hypot(x, y, z);
    if (length > 1e-6) {
      out.set([x / length, y / length, z / length], i * 3);
    } else {
      out.set([normal.getX(i), normal.getY(i), normal.getZ(i)], i * 3);
    }
  }
  return new THREE.BufferAttribute(out, 3);
}

/**
 * Box with rounded edges. `rounding` is how many steps round each edge:
 * 1 is a simple bevel, for big chunky stones where triangles count.
 */
export function box(width: number, height: number, depth: number, radius = Math.min(width, height, depth) * 0.2, rounding?: number): THREE.BufferGeometry {
  const r = Math.max(0.001, Math.min(radius, Math.min(width, height, depth) / 2 - 0.0005));
  // Small boxes (lights, rivets, vents) need fewer rounding steps.
  const steps = rounding ?? (Math.min(width, height, depth) < 0.06 ? 1 : 2);
  return shape(`box:${width}:${height}:${depth}:${r}:${steps}`, () => new RoundedBoxGeometry(width, height, depth, steps, r));
}

/** Sphere. Squash it with the part's scale. */
export function sphere(radius: number, detail = 1): THREE.BufferGeometry {
  const small = radius < 0.03 ? 0.6 : 1;
  return shape(`sphere:${radius}:${detail}`, () =>
    new THREE.SphereGeometry(radius, Math.max(6, Math.round(18 * detail * small)), Math.max(4, Math.round(12 * detail * small))));
}

/** Capsule along Y; height includes both rounded ends. */
export function capsule(radius: number, height: number, detail = 1): THREE.BufferGeometry {
  return shape(`capsule:${radius}:${height}:${detail}`, () =>
    new THREE.CapsuleGeometry(radius, Math.max(height - radius * 2, 0), Math.round((radius < 0.03 ? 2 : 4) * detail), Math.round((radius < 0.03 ? 8 : 14) * detail)));
}

/** Arc of points around a centre, from one angle to another, in radians. */
function arc(cx: number, cy: number, r: number, from: number, to: number, steps: number): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    points.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return points;
}

const HALF_PI = Math.PI / 2;

/**
 * Barrel along Y with rounded rims: a cylinder when both radii match, a
 * bell or a bucket when they do not.
 */
export function barrel(radiusTop: number, radiusBottom: number, height: number, bevel = Math.min(radiusTop, radiusBottom, height) * 0.25, detail = 1): THREE.BufferGeometry {
  return shape(`barrel:${radiusTop}:${radiusBottom}:${height}:${bevel}:${detail}`, () => {
    const b = Math.max(0.001, Math.min(bevel, radiusTop * 0.9, radiusBottom * 0.9, height * 0.45));
    const h = height / 2;
    const points = [
      new THREE.Vector2(0, -h),
      ...arc(radiusBottom - b, -h + b, b, -HALF_PI, 0, 3),
      ...arc(radiusTop - b, h - b, b, 0, HALF_PI, 3),
      new THREE.Vector2(0, h),
    ];
    // Thin limbs and cuffs read round with fewer sides under the outline.
    return new THREE.LatheGeometry(points, Math.round((Math.max(radiusTop, radiusBottom) < 0.12 ? 12 : 16) * detail));
  });
}

/** Ring lying flat (around the Y axis): belts, rims, halos. */
export function torus(radius: number, tube: number, detail = 1): THREE.BufferGeometry {
  return shape(`torus:${radius}:${tube}:${detail}`, () =>
    new THREE.TorusGeometry(radius, tube, Math.round((tube < 0.02 ? 6 : 8) * detail), Math.round((radius < 0.08 ? 16 : 22) * detail)).rotateX(HALF_PI));
}

/** A hose or cable through the given points, with a smooth curve between them. */
export function tube(points: readonly Vec3[], radius: number, detail = 1): THREE.BufferGeometry {
  return shape(`tube:${points.map((point) => point.join(',')).join(';')}:${radius}:${detail}`, () => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, Math.max(8, Math.round(points.length * 8 * detail)), radius, Math.max(5, Math.round(10 * detail)), false);
  });
}

/**
 * A profile of [radius, height] points, from the bottom up, turned around Y:
 * any round, sculpted piece (a torso, a boot cuff, a ribbed joint). With
 * `smooth`, the profile is a curve through the points, sampled that many
 * times; without it, the points are joined by straight lines.
 */
export function lathe(profile: readonly (readonly [number, number])[], sides = 16, smooth = 0): THREE.BufferGeometry {
  return shape(`lathe:${profile.map((point) => point.join(',')).join(';')}:${sides}:${smooth}`, () => {
    let points = profile.map(([r, y]) => new THREE.Vector2(r, y));
    if (smooth > 0) points = new THREE.SplineCurve(points).getPoints(smooth);
    for (const point of points) point.x = Math.max(point.x, 0);
    return new THREE.LatheGeometry(points, sides);
  });
}

export interface PatchOptions {
  /** 0 keeps square corners, 1 turns the patch into an ellipse. */
  round?: number;
  /** Thickness of the rim, in metres, so the patch reads as a plate. */
  depth?: number;
  /** Quads across and up, when the default is too coarse or too fine. */
  steps?: readonly [number, number];
  /** Degrees the patch is turned around Y from +Z, before the part is placed. */
  turn?: number;
  /** For plate(): the stretch of the profile it covers, from 0 (bottom) to 1. */
  span?: readonly [number, number];
}

interface SkinPoint {
  at: THREE.Vector3;
  normal: THREE.Vector3;
}

/**
 * A piece of any surface given over a square from -1 to 1, with rounded
 * corners and, when it has depth, a rim around its edge.
 */
function skin(nu: number, nv: number, round: number, depth: number, surface: (x: number, y: number) => SkinPoint): THREE.BufferGeometry {
  const sample = (i: number, j: number) => {
    const u = -1 + (2 * i) / nu;
    const v = -1 + (2 * j) / nv;
    // The square is pulled towards a disc, which rounds its corners.
    return surface(u * Math.sqrt(1 - (round * v * v) / 2), v * Math.sqrt(1 - (round * u * u) / 2));
  };
  const positions: number[] = [];
  const normals: number[] = [];
  const index: number[] = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const { at, normal } = sample(i, j);
      positions.push(at.x, at.y, at.z);
      normals.push(normal.x, normal.y, normal.z);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      index.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
    }
  }
  if (depth > 0) {
    // A wall around the edge, walked anticlockwise as seen from outside.
    const edge: [number, number][] = [];
    for (let i = 0; i < nu; i++) edge.push([i, 0]);
    for (let j = 0; j < nv; j++) edge.push([nu, j]);
    for (let i = nu; i > 0; i--) edge.push([i, nv]);
    for (let j = nv; j > 0; j--) edge.push([0, j]);
    const centre = surface(0, 0).at;
    const start = positions.length / 3;
    for (const [i, j] of edge) {
      const { at, normal } = sample(i, j);
      const out = at.clone().sub(centre);
      out.addScaledVector(normal, -out.dot(normal)).normalize();
      const inner = at.clone().addScaledVector(normal, -depth);
      positions.push(at.x, at.y, at.z, inner.x, inner.y, inner.z);
      normals.push(out.x, out.y, out.z, out.x, out.y, out.z);
    }
    for (let k = 0; k < edge.length; k++) {
      const top = start + k * 2;
      const next = start + ((k + 1) % edge.length) * 2;
      index.push(top, top + 1, next, next, top + 1, next + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(index);
  return geometry;
}

/**
 * A piece of the skin of a sphere, facing +Z: visors, plates and stripes
 * that hug a round shell. `yaw` is half its width and `pitch` its lower and
 * upper edges, in degrees. Scale the part to wrap an ellipsoid.
 */
export function patch(radius: number, yaw: number, pitch: readonly [number, number], options: PatchOptions = {}): THREE.BufferGeometry {
  const round = options.round ?? 0.7;
  const depth = options.depth ?? 0;
  const turn = options.turn ?? 0;
  const nu = options.steps?.[0] ?? Math.max(4, Math.round(yaw / 6));
  const nv = options.steps?.[1] ?? Math.max(3, Math.round((pitch[1] - pitch[0]) / 10));
  return shape(`patch:${radius}:${yaw}:${pitch.join(',')}:${round}:${depth}:${nu}:${nv}:${turn}`, () => {
    const mid = (pitch[0] + pitch[1]) / 2;
    const half = (pitch[1] - pitch[0]) / 2;
    return skin(nu, nv, round, depth, (x, y) => {
      const a = (turn + x * yaw) * DEG;
      const b = (mid + y * half) * DEG;
      const normal = new THREE.Vector3(Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b));
      return { at: normal.clone().multiplyScalar(radius), normal };
    });
  });
}

/**
 * A piece of the skin of a lathe, facing +Z: armour that follows a limb
 * without sinking into it. `profile` is a curve through [radius, height]
 * points, from the bottom up, and `arc` half the plate's width in degrees.
 */
export function plate(profile: readonly (readonly [number, number])[], arc: number, options: PatchOptions = {}): THREE.BufferGeometry {
  const round = options.round ?? 0.7;
  const depth = options.depth ?? 0;
  const turn = options.turn ?? 0;
  const [from, to] = options.span ?? [0, 1];
  const nu = options.steps?.[0] ?? Math.max(3, Math.round(arc / 7));
  const nv = options.steps?.[1] ?? 7;
  return shape(`plate:${profile.map((point) => point.join(',')).join(';')}:${arc}:${round}:${depth}:${nu}:${nv}:${turn}:${from}:${to}`, () => {
    const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
    return skin(nu, nv, round, depth, (x, y) => {
      const t = Math.min(Math.max(from + ((to - from) * (y + 1)) / 2, 0), 1);
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const phi = (turn + x * arc) * DEG;
      const normal = new THREE.Vector3(tangent.y * Math.sin(phi), -tangent.x, tangent.y * Math.cos(phi)).normalize();
      return { at: new THREE.Vector3(point.x * Math.sin(phi), point.y, point.x * Math.cos(phi)), normal };
    });
  });
}

/**
 * A flat band through the given points: harness straps and belts. `side` is
 * the direction its width runs along.
 */
export function strap(points: readonly Vec3[], width: number, thickness: number, side: Vec3 = [1, 0, 0], detail = 1): THREE.BufferGeometry {
  return shape(`strap:${points.map((point) => point.join(',')).join(';')}:${width}:${thickness}:${side.join(',')}:${detail}`, () => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const rings = Math.max(6, Math.round(points.length * 5 * detail));
    const around = 8;
    const positions: number[] = [];
    const normals: number[] = [];
    const index: number[] = [];
    const across = new THREE.Vector3();
    const lift = new THREE.Vector3();
    for (let s = 0; s <= rings; s++) {
      const centre = curve.getPoint(s / rings);
      const along = curve.getTangent(s / rings);
      across.set(...side).addScaledVector(along, -along.dot(across)).normalize();
      lift.crossVectors(along, across);
      for (let k = 0; k < around; k++) {
        const angle = (k / around) * TAU;
        // A squared-off oval: flat faces with soft edges.
        const cx = Math.sign(Math.cos(angle)) * Math.sqrt(Math.abs(Math.cos(angle)));
        const cy = Math.sign(Math.sin(angle)) * Math.sqrt(Math.abs(Math.sin(angle)));
        const p = centre.clone().addScaledVector(across, (cx * width) / 2).addScaledVector(lift, (cy * thickness) / 2);
        const n = across.clone().multiplyScalar(cx / width).addScaledVector(lift, cy / thickness).normalize();
        positions.push(p.x, p.y, p.z);
        normals.push(n.x, n.y, n.z);
      }
    }
    for (let s = 0; s < rings; s++) {
      for (let k = 0; k < around; k++) {
        const a = s * around + k;
        const b = s * around + ((k + 1) % around);
        index.push(a, b, a + around, b, b + around, a + around);
      }
    }
    // Flat caps at both ends.
    for (const [s, flip] of [[0, false], [rings, true]] as const) {
      const centre = curve.getPoint(s / rings);
      const along = curve.getTangent(s / rings).multiplyScalar(flip ? 1 : -1);
      const hub = positions.length / 3;
      positions.push(centre.x, centre.y, centre.z);
      normals.push(along.x, along.y, along.z);
      for (let k = 0; k < around; k++) {
        const a = s * around + k;
        const b = s * around + ((k + 1) % around);
        if (flip) index.push(hub, a, b);
        else index.push(hub, b, a);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(index);
    return geometry;
  });
}

/**
 * A flat plate cut to an outline of [x, z] points, lying in the X–Z plane and
 * centred on y = 0, with rounded edges: wings, fins, blades and painted
 * stripes.
 */
export function slab(outline: readonly (readonly [number, number])[], thickness: number, bevel = thickness * 0.35): THREE.BufferGeometry {
  return shape(`slab:${outline.map((point) => point.join(',')).join(';')}:${thickness}:${bevel}`, () => {
    const b = Math.max(0.001, Math.min(bevel, thickness * 0.45));
    const depth = Math.max(0.001, thickness - 2 * b);
    const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, z))), {
      depth, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4,
    });
    // The outline is drawn in X–Y and pushed along +Z: lay it flat (its y
    // becomes z) and centre it on y = 0.
    geometry.rotateX(HALF_PI);
    geometry.translate(0, depth / 2, 0);
    return geometry;
  });
}

/** Cone from a rounded base at y = 0 to a blunt tip at y = height. */
export function cone(radius: number, height: number): THREE.BufferGeometry {
  return shape(`cone:${radius}:${height}`, () => {
    const b = Math.min(radius, height) * 0.15;
    const tip = Math.min(radius, height) * 0.12;
    const points = [
      new THREE.Vector2(0, 0),
      ...arc(radius - b, b, b, -HALF_PI, 0, 2),
      new THREE.Vector2(tip, height - tip * 0.6),
      new THREE.Vector2(0, height),
    ];
    return new THREE.LatheGeometry(points, 14);
  });
}

/**
 * Sharp spike from y = 0 to y = height. bend curves the tip towards +X by
 * that fraction of the height, for horns and claws.
 */
export function spike(radius: number, height: number, bend = 0): THREE.BufferGeometry {
  return shape(`spike:${radius}:${height}:${bend}`, () => {
    const b = radius * 0.2;
    const points = [
      new THREE.Vector2(0, 0),
      ...arc(radius - b, b, b, -HALF_PI, 0, 2),
      new THREE.Vector2(radius * 0.45, height * 0.6),
      new THREE.Vector2(0, height),
    ];
    const geometry = new THREE.LatheGeometry(points, 10);
    if (bend !== 0) {
      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const t = position.getY(i) / height;
        position.setX(i, position.getX(i) + bend * height * t * t);
      }
      geometry.computeVertexNormals();
      geometry.setAttribute('normal', smoothNormals(geometry));
    }
    return geometry;
  });
}

/** Closed half sphere, flat side down at y = 0: lids, domes, helmets. */
export function dome(radius: number): THREE.BufferGeometry {
  return shape(`dome:${radius}`, () => {
    const b = radius * 0.08;
    const points = [
      new THREE.Vector2(0, 0),
      ...arc(radius - b, b, b, -HALF_PI, 0, 2),
      ...arc(0, b, radius, 0, HALF_PI, 8).slice(1).map((p) => new THREE.Vector2(p.x, b + (p.y - b) * ((radius - b) / radius))),
    ];
    points[points.length - 1].x = 0;
    return new THREE.LatheGeometry(points, 18);
  });
}

// ---------------------------------------------------------------------------
// Parts and nodes
// ---------------------------------------------------------------------------

/** Where a node or a part sits inside its parent. Rotation in degrees. */
export interface Place {
  at?: Vec3;
  rot?: Vec3;
  scale?: Vec3 | number;
  /** Turns the piece so its +Z points this way; `rot` then only rolls it. */
  face?: Vec3;
  /** Turns the piece so its +Y points this way; `rot` then only rolls it. */
  up?: Vec3;
}

export interface PartOptions extends Place {
  /** false for no outline; a number for a width other than the model's. */
  outline?: boolean | number;
}

/** A colour (painted with toon) or a material made by this kit. */
export type Look = Colour | THREE.Material;

const DEG = Math.PI / 180;

function applyPlace(object: THREE.Object3D, place: Place): void {
  if (place.at) object.position.set(...place.at);
  if (place.rot) object.rotation.set(place.rot[0] * DEG, place.rot[1] * DEG, place.rot[2] * DEG);
  const towards = place.face ?? place.up;
  if (towards) {
    const from = place.face ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    object.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(from, new THREE.Vector3(...towards).normalize()));
  }
  if (place.scale !== undefined) {
    if (typeof place.scale === 'number') object.scale.setScalar(place.scale);
    else object.scale.set(...place.scale);
  }
}

function material(look: Look): THREE.Material {
  if (look instanceof THREE.Material) {
    if (!isKitMaterial(look)) throw new Error('Parts take kit materials only: toon() or glow().');
    return look;
  }
  return toon(look);
}

/**
 * A named group. Nodes are what the game animates and finds by name, so
 * every name must be unique in the model.
 */
export function node(name: string, place: Place = {}, ...children: THREE.Object3D[]): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  applyPlace(group, place);
  if (children.length > 0) group.add(...children);
  return group;
}

/** A solid piece: a shape painted with a kit material. It never moves alone. */
export function part(geometry: THREE.BufferGeometry, look: Look, options: PartOptions = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material(look));
  applyPlace(mesh, options);
  mesh.userData.kitPart = true;
  const kind = mesh.material.userData.kit;
  mesh.userData.outline = options.outline ?? (kind === 'toon' || kind === 'glow');
  return mesh;
}

/** A rod with rounded ends from one point to another: limbs, struts, pipes. */
export function bar(from: Vec3, to: Vec3, radius: number, look: Look, options: Omit<PartOptions, 'at' | 'rot'> = {}): THREE.Mesh {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const length = a.distanceTo(b);
  const mesh = part(capsule(radius, length + radius * 2), look, options);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  if (length > 1e-6) {
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  }
  return mesh;
}

export interface EyeOptions extends Place {
  radius: number;
  /** White of the eye. */
  white?: Colour;
  /** Colour of the iris. */
  iris?: Colour;
  /** Iris radius as a fraction of the eye radius. */
  irisSize?: number;
  /** Colour of the pupil, or null for none. */
  pupil?: Colour | null;
  /** The iris gives off light (unshaded). */
  glow?: boolean;
  /** Where the eye looks: x and y from -1 to 1. */
  look?: readonly [number, number];
  /** Colour of the upper lid; no lid when missing. */
  lid?: Colour;
  /** How far the lid is rolled back, in degrees: 0 covers the top half, 90 leaves the eye open. */
  lidOpen?: number;
  /** Lid tilt in degrees; positive lowers the inner corner, for an angry look. */
  lidAngle?: number;
  /** Which eye it is, to tilt the lid the right way: 'l' sits at +X. */
  side?: 'l' | 'r';
}

/**
 * A big cartoon eye facing +Z. The lid, when there is one, is the node
 * `<name>_lid`: rotate it on X to blink (+90 closes it).
 */
export function eye(name: string, options: EyeOptions): THREE.Group {
  const r = options.radius;
  const irisR = r * (options.irisSize ?? 0.55);
  const [lx, ly] = options.look ?? [0, 0];
  const ix = lx * r * 0.35;
  const iy = ly * r * 0.35;
  // Height of the white under the iris. Iris, pupil and glint are layered
  // just in front of it and stay under the lid (1.1 × radius), so a closing
  // lid covers them all.
  const iz = Math.sqrt(Math.max(r * r - ix * ix - iy * iy, 0));
  const irisLook = options.glow ? glow(options.iris ?? PALETTE.cyan) : toon(options.iris ?? PALETTE.navy);
  const group = node(name, options,
    part(sphere(r), options.white ?? PALETTE.snow),
    part(sphere(irisR, 0.75), irisLook, { at: [ix, iy, iz * 0.855], scale: [1, 1, 0.3], outline: false }),
    part(sphere(r * 0.12, 0.5), glow(PALETTE.snow), { at: [ix + irisR * 0.45, iy + irisR * 0.45, iz * 0.97], scale: [1, 1, 0.4], outline: false }),
  );
  if (options.pupil !== null) {
    group.add(part(sphere(irisR * 0.5, 0.6), options.pupil ?? PALETTE.ink, {
      at: [ix, iy, iz * 1.004], scale: [1, 1, 0.15], outline: false,
    }));
  }
  if (options.lid !== undefined) {
    const tilt = (options.lidAngle ?? 0) * (options.side === 'r' ? -1 : 1);
    group.add(node(`${name}_lid`, { rot: [-(options.lidOpen ?? 45), 0, tilt] },
      part(dome(r * 1.1), options.lid)));
  }
  return group;
}

// ---------------------------------------------------------------------------
// Voxels
// ---------------------------------------------------------------------------
// The voxel look: sharp cubes in many close shades, small blocks in relief
// for texture, details drawn as pixels, and lights that glow with a halo.
// Every block carries its colour in its vertices, so all the blocks of a
// node merge into one mesh: one draw call, whatever the number of colours.

function voxelMaterial(kind: string, make: () => THREE.Material): THREE.Material {
  let material = materials.get(kind);
  if (!material) {
    material = make();
    material.name = kind;
    material.userData.kit = kind;
    materials.set(kind, material);
  }
  return material;
}

const VOXEL = () => voxelMaterial('voxel', () => new THREE.MeshLambertMaterial({ vertexColors: true }));
const VOXEL_GLOW = () => voxelMaterial('voxel-glow', () => new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
const VOXEL_HALO = () => voxelMaterial('voxel-halo', () =>
  new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));

/** A sharp-edged box. */
export function cube(width: number, height: number, depth: number): THREE.BufferGeometry {
  return shape(`cube:${width}:${height}:${depth}`, () => new THREE.BoxGeometry(width, height, depth));
}

/** One solid voxel block in a colour. */
export function block(width: number, height: number, depth: number, colour: Colour, place: Place = {}): THREE.Mesh {
  if (colour === undefined || colour === null) throw new Error('A block needs a colour');
  const mesh = part(cube(width, height, depth), VOXEL(), place);
  mesh.userData.colour = colour;
  return mesh;
}

/** A block that gives off light, wrapped in a soft halo that much bigger. */
export function light(width: number, height: number, depth: number, colour: Colour, place: Place = {}, halo = 1.7): THREE.Mesh[] {
  const core = part(cube(width, height, depth), VOXEL_GLOW(), place);
  core.userData.colour = colour;
  if (halo <= 1) return [core];
  const aura = part(cube(width * halo, height * halo, depth * halo), VOXEL_HALO(), place);
  aura.userData.colour = colour;
  return [core, aura];
}

/** A shade of a colour: positive amounts lighten, negative ones darken. */
export function tint(colour: Colour, amount: number): string {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(colour).getHSL(hsl);
  return `#${new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount))).getHexString()}`;
}

/** A repeatable random sequence: same seed, same numbers. */
export function seeded(seed: number): () => number {
  // Always a positive state, also for negative seeds.
  let state = ((Math.floor(seed * 9973) % 4294967296) + 4294967296) % 4294967296;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export interface PixelOptions extends Place {
  /** Side of one pixel, in metres. */
  size: number;
  /** How far each pixel stands out of the panel, in metres. */
  depth?: number;
  /** Extra relief for some characters, in metres. */
  depths?: Record<string, number>;
  /** Characters whose pixels give off light. */
  glow?: string;
}

/**
 * A panel drawn as pixel art, facing +Z: one string per row, top to bottom,
 * one character per pixel, a space or a dot for none. It is a node of its
 * own, so its name must be unique.
 */
export function pixels(name: string, rows: readonly string[], colours: Record<string, Colour>, options: PixelOptions): THREE.Group {
  const { size } = options;
  const depth = options.depth ?? size;
  const blocks: THREE.Mesh[] = [];
  rows.forEach((row, r) => {
    [...row].forEach((char, c) => {
      if (char === ' ' || char === '.') return;
      const colour = colours[char];
      if (colour === undefined) throw new Error(`Pixel "${char}" in ${name} has no colour`);
      const d = depth + (options.depths?.[char] ?? 0);
      const at: Vec3 = [(c - (row.length - 1) / 2) * size, ((rows.length - 1) / 2 - r) * size, d / 2];
      if (options.glow?.includes(char)) blocks.push(...light(size, size, d, colour, { at }, 1));
      else blocks.push(block(size, size, d, colour, { at }));
    });
  });
  return node(name, options, ...blocks);
}

export interface SpeckleOptions {
  /** The box the specks sit on: its size and centre. */
  box: Vec3;
  at?: Vec3;
  /** Faces to cover: f(ront), b(ack), l(eft, +X), r(ight), t(op). */
  faces?: string;
  count: number;
  /** Side of a speck, in metres. */
  size: number;
  seed: number;
}

/** Small blocks in relief, in a few shades, scattered over a box: texture. */
export function speckle(colours: readonly Colour[], options: SpeckleOptions): THREE.Mesh[] {
  const rand = seeded(options.seed);
  const [w, h, d] = options.box;
  const [cx, cy, cz] = options.at ?? [0, 0, 0];
  const faces = options.faces ?? 'fblrt';
  const s = options.size;
  const snap = (value: number, span: number) => Math.round((value * (span - s)) / s) * s / 1;
  const blocks: THREE.Mesh[] = [];
  for (let i = 0; i < options.count; i++) {
    const face = faces[Math.floor(rand() * faces.length)];
    const u = rand() - 0.5;
    const v = rand() - 0.5;
    const out = s * (0.25 + rand() * 0.35);
    let at: Vec3;
    if (face === 'f') at = [cx + snap(u, w), cy + snap(v, h), cz + d / 2 + out / 2];
    else if (face === 'b') at = [cx + snap(u, w), cy + snap(v, h), cz - d / 2 - out / 2];
    else if (face === 'l') at = [cx + w / 2 + out / 2, cy + snap(v, h), cz + snap(u, d)];
    else if (face === 'r') at = [cx - w / 2 - out / 2, cy + snap(v, h), cz + snap(u, d)];
    else at = [cx + snap(u, w), cy + h / 2 + out / 2, cz + snap(v, d)];
    const sideways = face === 'l' || face === 'r';
    const up = face === 't';
    const size: Vec3 = sideways ? [out, s, s] : up ? [s, out, s] : [s, s, out];
    blocks.push(block(...size, colours[Math.floor(rand() * colours.length)], { at }));
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------
// Clips are ordinary AnimationClip objects over node names, so they play with
// AnimationMixer and export to GLB. Tracks are written as offsets from the
// node's rest pose: rot adds degrees, mov adds metres, scl multiplies.

export const FPS = 30;
export const TAU = Math.PI * 2;

type Value = number | Vec3;

export interface Sampler {
  /** True when made with loop(): the track closes on itself. */
  loops: boolean;
  sample(duration: number): { times: number[]; values: Value[] };
}

/**
 * A loop: fn gets the phase, from 0 to 1, and its last frame is the first
 * one again, so the clip closes by itself.
 */
export function loop(fn: (phase: number) => Value, steps?: number): Sampler {
  return {
    loops: true,
    sample(duration) {
      const n = steps ?? Math.max(8, Math.round(duration * FPS));
      const times: number[] = [];
      const values: Value[] = [];
      for (let i = 0; i < n; i++) {
        times.push((duration * i) / n);
        values.push(fn(i / n));
      }
      times.push(duration);
      values.push(values[0]);
      return { times, values };
    },
  };
}

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'snap';

const EASES: Record<Ease, (u: number) => number> = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - (1 - u) ** 3,
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2),
  back: (u) => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2,
  snap: (u) => 1 - (1 - u) ** 5,
};

/** A key: [time in seconds, value] or [time, value, how it arrives there]. */
export type Key = readonly [number, Value] | readonly [number, Value, Ease];

/**
 * Loose keyframes at times in seconds, eased between them (inOut unless the
 * key says otherwise). Before the first key and after the last one, the
 * value holds.
 */
export function poses(...keys: Key[]): Sampler {
  const sorted = [...keys].sort((a, b) => a[0] - b[0]);
  return {
    loops: false,
    sample(duration) {
      const set = new Set<number>();
      for (let i = 0; i <= Math.round(duration * FPS); i++) set.add(Math.min(i / FPS, duration));
      for (const key of sorted) if (key[0] >= 0 && key[0] <= duration) set.add(key[0]);
      const times = [...set].sort((a, b) => a - b);
      const values = times.map((t) => valueAt(sorted, t));
      return { times, values };
    },
  };
}

function valueAt(keys: Key[], t: number): Value {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = t1 > t0 ? EASES[ease ?? 'inOut']((t - t0) / (t1 - t0)) : 1;
      return mix(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

function mix(a: Value, b: Value, u: number): Value {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  const va = vec(a);
  const vb = vec(b);
  return [va[0] + (vb[0] - va[0]) * u, va[1] + (vb[1] - va[1]) * u, va[2] + (vb[2] - va[2]) * u];
}

function vec(value: Value): Vec3 {
  return typeof value === 'number' ? [value, value, value] : value;
}

/** A track not yet tied to a clip length. */
export interface Track {
  loops: boolean;
  build(duration: number): THREE.KeyframeTrack;
}

/**
 * The track builders for one model: rot, mov and scl by node name, as
 * offsets from that node's rest pose.
 */
export function rig(root: THREE.Object3D) {
  const find = (name: string): THREE.Object3D => {
    const found = root.getObjectByName(name);
    if (!found) throw new Error(`No node named "${name}" in ${root.name}`);
    return found;
  };
  return {
    /** Rotation offset in degrees, applied on top of the rest rotation. */
    rot(name: string, sampler: Sampler): Track {
      const rest = find(name).quaternion.clone();
      return {
        loops: sampler.loops,
        build(duration) {
          const { times, values } = sampler.sample(duration);
          const out: number[] = [];
          const q = new THREE.Quaternion();
          const previous = new THREE.Quaternion();
          const euler = new THREE.Euler();
          values.forEach((value, i) => {
            const [x, y, z] = vec(value);
            euler.set(x * DEG, y * DEG, z * DEG);
            q.copy(rest).multiply(new THREE.Quaternion().setFromEuler(euler));
            if (i > 0 && q.dot(previous) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
            previous.copy(q);
            out.push(q.x, q.y, q.z, q.w);
          });
          return new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, out);
        },
      };
    },
    /** Position offset in metres, added to the rest position. */
    mov(name: string, sampler: Sampler): Track {
      const rest = find(name).position.clone();
      return {
        loops: sampler.loops,
        build(duration) {
          const { times, values } = sampler.sample(duration);
          const out = values.flatMap((value) => {
            const [x, y, z] = vec(value);
            return [rest.x + x, rest.y + y, rest.z + z];
          });
          return new THREE.VectorKeyframeTrack(`${name}.position`, times, out);
        },
      };
    },
    /** Scale factor (one number or per axis), multiplied by the rest scale. */
    scl(name: string, sampler: Sampler): Track {
      const rest = find(name).scale.clone();
      return {
        loops: sampler.loops,
        build(duration) {
          const { times, values } = sampler.sample(duration);
          const out = values.flatMap((value) => {
            const [x, y, z] = vec(value);
            return [rest.x * x, rest.y * y, rest.z * z];
          });
          return new THREE.VectorKeyframeTrack(`${name}.scale`, times, out);
        },
      };
    },
  };
}

/** A clip of the given length, in seconds, from its tracks. */
/** A clip of the given length, in seconds. It is marked as a loop when every track loops. */
export function animation(name: string, duration: number, tracks: Track[]): THREE.AnimationClip {
  const clip = new THREE.AnimationClip(name, duration, tracks.map((track) => track.build(duration)));
  clip.userData.loop = tracks.length > 0 && tracks.every((track) => track.loops);
  return clip;
}

// ---------------------------------------------------------------------------
// Finished models
// ---------------------------------------------------------------------------

export interface Model {
  /** The root node: add it to the scene and give it to an AnimationMixer. */
  root: THREE.Group;
  clips: THREE.AnimationClip[];
  /** When each Attack… clip warns and hits, in seconds. */
  attacks: Record<string, AttackTiming>;
}

/** An entry of the model catalog (web/src/models/index.ts). */
export interface ModelEntry {
  id: string;
  /** Name shown in the viewers. */
  name: string;
  type: ModelType;
  /** True when the model changes with the planet it is on. */
  planetary?: boolean;
  /**
   * A design proposal for the team to choose from: checked like the rest,
   * except that it does not need every node and clip of its type yet.
   */
  draft?: boolean;
  /** A flying model: it hovers above its origin, which stays at ground level. */
  flies?: boolean;
  create(planet?: PlanetLook): Model;
}

export interface ModelOptions {
  /** Outline width in metres for this model (bosses want a thicker one). */
  outline?: number;
  attacks?: Record<string, AttackTiming>;
}

/**
 * Finishes a model: inside every node, parts with the same material are
 * merged into one mesh (one draw call) with its outline. Then the model is
 * ready to play.
 */
export function model(root: THREE.Group, clips: THREE.AnimationClip[], options: ModelOptions = {}): Model {
  finish(root, options.outline ?? OUTLINE);
  return { root, clips, attacks: options.attacks ?? {} };
}

function finish(root: THREE.Object3D, defaultWidth: number): void {
  if (root.userData.finished) return;
  root.userData.finished = true;
  const holders: THREE.Object3D[] = [];
  root.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) holders.push(object);
  });
  for (const holder of holders) {
    const parts = holder.children.filter((child) => child.userData.kitPart) as THREE.Mesh[];
    if (parts.length === 0) continue;
    const buckets = new Map<string, { material: THREE.Material; width: number; meshes: THREE.Mesh[] }>();
    for (const mesh of parts) {
      const setting = mesh.userData.outline as boolean | number;
      const width = setting === false ? 0 : setting === true ? defaultWidth : setting;
      const meshMaterial = mesh.material as THREE.Material;
      const key = `${meshMaterial.uuid}|${width}`;
      const bucket = buckets.get(key) ?? { material: meshMaterial, width, meshes: [] };
      bucket.meshes.push(mesh);
      buckets.set(key, bucket);
    }
    for (const { material: bucketMaterial, width, meshes } of buckets.values()) {
      const merged = mergeGeometries(meshes.map(bake), false);
      if (!merged) throw new Error(`Could not merge the parts of ${holder.name}`);
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, bucketMaterial);
      mesh.userData.kitPart = true;
      const see = !['glass', 'glow', 'halo', 'voxel-glow', 'voxel-halo'].includes(bucketMaterial.userData.kit);
      mesh.castShadow = see;
      mesh.receiveShadow = see;
      if (width > 0) {
        const outline = new THREE.Mesh(merged, outlineMaterial(width));
        outline.userData.outline = true;
        mesh.add(outline);
      }
      holder.remove(...meshes);
      holder.add(mesh);
    }
  }
}

/** The part's geometry moved into its node's space. */
function bake(mesh: THREE.Mesh): THREE.BufferGeometry {
  mesh.updateMatrix();
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrix);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrix);
  const smooth = geometry.attributes.smoothNormal as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < smooth.count; i++) {
    v.fromBufferAttribute(smooth, i).applyMatrix3(normalMatrix).normalize();
    smooth.setXYZ(i, v.x, v.y, v.z);
  }
  if (mesh.userData.colour !== undefined) {
    const colour = new THREE.Color(mesh.userData.colour as Colour);
    const count = geometry.attributes.position.count;
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colours.set([colour.r, colour.g, colour.b], i * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  }
  if (mesh.matrix.determinant() < 0 && geometry.index) {
    const index = geometry.index;
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, b);
    }
  }
  return geometry;
}

// ---------------------------------------------------------------------------
// Measuring
// ---------------------------------------------------------------------------

/** Triangles of the model itself, without the outline pass. */
export function countTriangles(root: THREE.Object3D): number {
  let total = 0;
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.outline) return;
    const geometry = mesh.geometry;
    total += (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
  });
  return total;
}

/** Meshes drawn, outlines included: roughly the draw calls of one copy. */
export function countDrawCalls(root: THREE.Object3D): number {
  let total = 0;
  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) total++;
  });
  return total;
}

/**
 * A copy ready for GLB export: no outlines (glTF cannot draw inside-out
 * hulls) and toon materials turned into matte standard ones of the same
 * colour. Glow materials export as unlit.
 */
export function exportable(root: THREE.Object3D): THREE.Object3D {
  const copy = root.clone(true);
  const hulls: THREE.Object3D[] = [];
  const matte = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  copy.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (object.userData.outline || (mesh.isMesh && ['halo', 'voxel-halo'].includes((mesh.material as THREE.Material).userData.kit))) {
      hulls.push(object);
      return;
    }
    if (mesh.isMesh && mesh.material instanceof THREE.MeshLambertMaterial) {
      mesh.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    }
    if (mesh.isMesh) {
      // The outline's normals are not needed outside the game.
      mesh.geometry = mesh.geometry.clone();
      mesh.geometry.deleteAttribute('smoothNormal');
    }
    if (mesh.isMesh && mesh.material instanceof THREE.MeshToonMaterial) {
      const source = mesh.material;
      let standard = matte.get(source);
      if (!standard) {
        standard = new THREE.MeshStandardMaterial({ color: source.color, roughness: 1, metalness: 0 });
        standard.name = source.name;
        matte.set(source, standard);
      }
      mesh.material = standard;
    }
  });
  for (const hull of hulls) hull.removeFromParent();
  return copy;
}

// ---------------------------------------------------------------------------
// Light
// ---------------------------------------------------------------------------

/**
 * Lighting for the realistic look: filmic tone mapping, soft shadows, a
 * studio environment for reflections, a fill and one key light. The game may
 * tint the key with the colour of the star.
 */
export function addRealLights(renderer: THREE.WebGLRenderer, scene: THREE.Scene, keyColour: Colour = '#ffffff'): THREE.DirectionalLight {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const environment = new THREE.PMREMGenerator(renderer);
  scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;
  scene.add(new THREE.HemisphereLight('#e2e9ff', '#4a4452', 0.7));
  const key = new THREE.DirectionalLight(keyColour, 2.6);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  return key;
}

/**
 * The lights the style is tuned for: a sky and ground fill plus one key
 * light. The game may tint the key with the colour of the star.
 */
export function addStyleLights(scene: THREE.Scene, keyColour: Colour = '#ffffff', renderer?: THREE.WebGLRenderer): THREE.DirectionalLight {
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b6d0', 1.6));
  const key = new THREE.DirectionalLight(keyColour, 2.2);
  key.position.set(3, 6, 5);
  scene.add(key);
  if (renderer) {
    // Flat colours stay true without tone mapping; cast shadows read as cel shading.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.02;
    // Something to reflect for the glossy surfaces (visors, armour, metal).
    // Toon and voxel materials do not read it, so their look stays the same.
    const environment = new THREE.PMREMGenerator(renderer);
    scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    environment.dispose();
  }
  return key;
}
