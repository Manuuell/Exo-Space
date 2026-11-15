// A planet drawn from its look (planet-look.ts): the land around the ship,
// the liquid in its low places, what stands on it, the landing pad, the sky,
// and the globe that shows once the ship climbs out to space. In the
// protagonist's soft cartoon style, the game's style since 2026-11-15: a
// smooth ramp of light with a pale glow on the edges, rounded shapes,
// lively colours and puffy clouds.
//
// The land curves away with distance from the camera, as on a small round
// world, so that climbing out of the air shows the planet as a ball under
// the ship. The curve is drawn by the shaders; the ground the ship flies and
// lands on (planetGround) stays flat, and under the ship the two match.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { PlanetLook } from './contract.ts';
import { FLORA_CELL, LAST_VALLEY, PROP_CELL, fbm, floraInCell, forestDensity, hash2, mix, nameSeed, planetFeatures, planetGround, planetPaths, planetScenery, propsInCell, wasteland } from './planet-look.ts';
import type { PlanetPaths } from './planet-look.ts';
import type { Flora, FloraKind, PlanetScenery, Prop, PropKind, Species } from './planet-look.ts';
import type { ModelEntry } from './kit.ts';
import { giantTree } from './prop-giant-tree.ts';
import { ruinGate } from './prop-ruin-gate.ts';
import { dragonNest } from './prop-dragon-nest.ts';
import { mossback } from './fauna-mossback.ts';
import { puffhop } from './fauna-puffhop.ts';
import { skyfin } from './fauna-skyfin.ts';
import { beacon, campfire, chest, hut } from './props-world.ts';
import { bloomkin } from './npc-bloomkin.ts';
import { drifter } from './npc-drifter.ts';
import { forgeback } from './npc-forgeback.ts';
import { lumen } from './npc-lumen.ts';
import type { PlanetFeatures } from './planet-look.ts';

type Planet = Partial<PlanetLook> & { name?: string };

/**
 * The land is drawn as two patches that follow the camera: a fine one close
 * by, for walking, and a coarse one out to the horizon. Side of a square of
 * each, in metres, and squares across it.
 */
const NEAR = { cell: 16, cells: 160 };
const FAR = { cell: 64, cells: 180 };
/** Half the width of the coarse patch: how far the land is drawn. */
const HALF = (FAR.cell * FAR.cells) / 2;
/** Around the camera the coarse patch sinks this far out of sight, under the fine one. */
const HOLE = 900;
/** How many prop cells around the ship are filled, each way. */
const PROP_REACH = 9;
const PROP_CAPACITY = 5000;
/** How far under the liquid the rim of the land sinks, in metres. */
const SUNK = 160;
/** From 0 in the middle to 1 at the rim: how far a point of the land has sunk. */
const rimSink = (fromMiddle: number) => smooth(0.66, 0.97, fromMiddle);

const colour = (hex: string) => new THREE.Color(hex);
/** The dead land beyond the last valley: ash, and embers in its cracks. */
const ASH_LOW = colour('#2c201d');
const ASH_HIGH = colour('#15100f');
const ASH = new THREE.Color();
const EMBER = colour('#ff6a26');
const SMOKE = colour('#5a2a1c');
function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// --- Materials -----------------------------------------------------------------

/** The protagonist's light ramp: a bright shadow side rising smoothly to the lit side. */
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

/** The land's light ramp: deeper shadows than the characters', so hills and cliffs read. */
const LAND_RAMP = (() => {
  const size = 32;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const u = Math.min(Math.max((i / (size - 1) - 0.15) / 0.65, 0), 1);
    data[i] = Math.round(255 * (0.3 + 0.7 * u * u * (3 - 2 * u)));
  }
  const texture = new THREE.DataTexture(data, size, 1, THREE.RedFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

/**
 * Makes a material bend the world down with distance from the camera, and,
 * with `rim`, glow softly along the edges that turn away from it.
 */
function curved<T extends THREE.Material>(material: T, radius: { value: number }, rim = 0, hole = 0, wind?: { value: number }): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.curveRadius = radius;
    if (wind) shader.uniforms.windTime = wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float curveRadius;${wind ? '\nuniform float windTime;' : ''}`)
      .replace('#include <project_vertex>', `${wind ? `
#ifdef USE_INSTANCING
  float sway = sin( windTime * 1.8 + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27 );
  transformed.x += sway * 0.22 * transformed.y * transformed.y;
  transformed.z += cos( windTime * 1.3 + instanceMatrix[3].z * 0.31 ) * 0.12 * transformed.y * transformed.y;
#endif` : ''}
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
vec4 curvedWorld = modelMatrix * mvPosition;
vec2 curveOffset = curvedWorld.xz - cameraPosition.xz;
curvedWorld.y -= dot( curveOffset, curveOffset ) / ( 2.0 * curveRadius );
${hole > 0 ? `curvedWorld.y -= 90.0 * ( 1.0 - smoothstep( ${(hole - 120).toFixed(1)}, ${hole.toFixed(1)}, length( curveOffset ) ) );` : ''}
mvPosition = viewMatrix * curvedWorld;
gl_Position = projectionMatrix * mvPosition;
`);
    if (rim > 0) {
      shader.uniforms.softRim = { value: rim };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float softRim;')
        .replace('#include <opaque_fragment>', 'outgoingLight += mix( vec3( 1.0 ), diffuseColor.rgb, 0.5 ) * softRim * pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 2.4 );\n#include <opaque_fragment>');
    }
  };
  material.customProgramCacheKey = () => `planet-curved${rim > 0 ? '-soft' : ''}${hole > 0 ? `-hole${hole}` : ''}${wind ? '-wind' : ''}`;
  return material;
}

interface Paint {
  vertexColors?: boolean;
  colour?: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  /** How strong the edge glow is. */
  rim?: number;
  /** Sinks the land around the camera, out to this many metres. */
  hole?: number;
  /** The land's deeper light ramp instead of the characters'. */
  land?: boolean;
}

/** A material for the world, in the soft cartoon light, bent with the world. */
function paint(radius: { value: number }, p: Paint): THREE.Material {
  const base: THREE.MeshToonMaterialParameters = { vertexColors: p.vertexColors ?? false };
  if (p.colour) base.color = p.colour;
  if (p.emissive) Object.assign(base, { emissive: p.emissive, emissiveIntensity: p.emissiveIntensity ?? 1 });
  if (p.opacity !== undefined && p.opacity < 1) Object.assign(base, { transparent: true, opacity: p.opacity });
  return curved(new THREE.MeshToonMaterial({ ...base, gradientMap: p.land ? LAND_RAMP : SOFT_RAMP }), radius, p.rim ?? 0.3, p.hole ?? 0);
}

/** Livelier colours for the cartoon look: more saturated, a little lighter. */
function lively(hex: string): string {
  const tone = colour(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  tone.getHSL(hsl);
  tone.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.06), Math.min(0.93, hsl.l * 1.05 + 0.05));
  return `#${tone.getHexString()}`;
}

/** The planet's look in the cartoon's colours. */
function styled(scenery: PlanetScenery): PlanetScenery {
  const { ground, liquid, sky } = scenery;
  // A bright daytime sky, as in the reference the team chose: blue overhead
  // and pale at the horizon, still warmed a little by the star. Hot worlds
  // keep their smoky sky.
  const day = 1 - scenery.weights.lava;
  return {
    ...scenery,
    // Cliffs of pale grey stone, as in the reference, on temperate worlds.
    ground: { low: lively(ground.low), high: lively(ground.high), peak: lively(ground.peak), rock: mix(lively(ground.rock), '#cfc8b8', 0.6 * scenery.weights.moss) },
    accent: lively(scenery.accent),
    liquid: { ...liquid, colour: mix(lively(liquid.colour), '#3fa8e0', 0.5 * scenery.weights.moss) },
    sky: { ...sky, zenith: mix(lively(sky.zenith), '#3f86e8', 0.75 * day), horizon: mix(lively(sky.horizon), '#d6efff', 0.6 * day) },
    sun: mix(scenery.sun, '#fff6e6', 0.5 * day),
    fill: [mix(lively(scenery.fill[0]), '#e3f2ff', 0.4 * day), lively(scenery.fill[1])],
  };
}

// --- The land ------------------------------------------------------------------

interface PatchOptions {
  cell: number;
  cells: number;
  /** Redrawn once the camera is this many squares from its middle. */
  lag: number;
  /** Where its rim starts and ends sinking, as fractions of its half width. */
  rim: readonly [number, number];
  /** How high a sunk point of the rim ends up, from its true height. */
  sinkTo: (height: number) => number;
  /** Metres it is drawn under the true land, so the finer patch wins where both are. */
  under: number;
  /** A hole around the camera, for the coarse patch. */
  hole: number;
}

/** A round patch of land that stays under the camera, redrawn as it moves on. */
class LandPatch {
  readonly mesh: THREE.Mesh;
  private readonly heights: Float32Array;
  private centre = { i: NaN, k: NaN };
  private readonly ground: (x: number, z: number) => number;
  private readonly scenery: PlanetScenery;
  private readonly seed: number;
  private readonly options: PatchOptions;
  private readonly grain = 0.05;
  private readonly dead: (x: number, z: number) => number;

  constructor(ground: (x: number, z: number) => number, scenery: PlanetScenery, seed: number, radius: { value: number }, options: PatchOptions, dead: (x: number, z: number) => number) {
    this.ground = ground;
    this.dead = dead;
    this.scenery = scenery;
    this.seed = seed;
    this.options = options;
    const { cell, cells } = options;
    this.heights = new Float32Array((cells + 1) * (cells + 1));
    const geometry = new THREE.PlaneGeometry(cell * cells, cell * cells, cells, cells).rotateX(-Math.PI / 2);
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
    this.mesh = new THREE.Mesh(geometry, paint(radius, { vertexColors: true, rim: 0.18, hole: options.hole, land: true }));
    this.mesh.frustumCulled = false;
  }

  follow(x: number, z: number): void {
    const { cell, cells, lag, rim, sinkTo, under } = this.options;
    const i = Math.round(x / cell);
    const k = Math.round(z / cell);
    if (Math.abs(i - this.centre.i) <= lag && Math.abs(k - this.centre.k) <= lag) return;
    this.centre = { i, k };
    const { ground, scenery, heights } = this;
    const { low, high, peak, rock } = scenery.ground;
    const level = scenery.liquid.level;
    const relief = scenery.relief;
    const tones = { low: colour(low), high: colour(high), peak: colour(peak), rock: colour(rock) };
    const shore = colour(scenery.liquid.kind === 'lava' ? mix(rock, '#140c0c', 0.55) : scenery.liquid.kind === 'ice' ? mix(low, '#ffffff', 0.5) : mix(low, '#e8d6a0', 0.55));
    const row = cells + 1;
    const truth = new Float32Array(heights.length);
    for (let r = 0; r <= cells; r++) {
      for (let c = 0; c <= cells; c++) {
        const wx = (i - cells / 2 + c) * cell;
        const wz = (k - cells / 2 + r) * cell;
        const height = ground(wx, wz);
        truth[r * row + c] = height;
        // Towards its rim the patch sinks out of sight: under the coarse
        // patch, or under the globe. Seen from far, it has no edge.
        const edge = smooth(rim[0], rim[1], Math.hypot(c - cells / 2, r - cells / 2) / (cells / 2));
        heights[r * row + c] = height * (1 - edge) + sinkTo(height) * edge - under;
      }
    }
    const position = this.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const colours = this.mesh.geometry.attributes.color as THREE.BufferAttribute;
    const tone = new THREE.Color();
    for (let r = 0; r <= cells; r++) {
      for (let c = 0; c <= cells; c++) {
        const v = r * row + c;
        const height = truth[v];
        const wx = (i - cells / 2 + c) * cell;
        const wz = (k - cells / 2 + r) * cell;
        position.setXYZ(v, wx, heights[v], wz);
        const right = truth[r * row + Math.min(cells, c + 1)];
        const down = truth[Math.min(cells, r + 1) * row + c];
        const slope = (Math.abs(right - height) + Math.abs(down - height)) / cell;
        tone.copy(tones.low).lerp(tones.high, smooth(relief * 0.15, relief * 0.9, height));
        tone.lerp(tones.peak, smooth(relief * 2.2, relief * 3.0, height));
        tone.lerp(tones.rock, smooth(0.35, 0.8, slope));
        tone.lerp(shore, 1 - smooth(level + 1, level + 6, height));
        // Beyond the last valley the land is ash, split by glowing cracks.
        const burnt = Math.hypot(wx, wz) < LAST_VALLEY.inner - 130 ? 0 : this.dead(wx, wz);
        if (burnt > 0) {
          tone.lerp(ASH.copy(ASH_LOW).lerp(ASH_HIGH, smooth(0, relief * 2, height)), burnt * 0.93);
          const crack = Math.max(1 - smooth(0.01, 0.05, Math.abs(fbm(wx / 110, wz / 110, this.seed + 71, 2))), (1 - smooth(0.005, 0.03, Math.abs(fbm(wx / 37, wz / 37, this.seed + 73, 2)))) * 0.6);
          const speck = hash2(Math.round(wx / 16) + 7, Math.round(wz / 16) - 3, this.seed) > 0.95 ? 0.5 : 0;
          tone.lerp(EMBER, Math.max(crack, speck) * burnt * 0.95);
        }
        // A little grain, so the land reads.
        tone.multiplyScalar(1 - this.grain / 2 + this.grain * hash2(Math.round(wx / 16), Math.round(wz / 16), this.seed));
        colours.setXYZ(v, tone.r, tone.g, tone.b);
      }
    }
    position.needsUpdate = true;
    colours.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}

/**
 * The height of the drawn land at a point: the fine patch's squares, each
 * cut into two flat triangles along the same diagonal as its geometry (from
 * the corner at -X +Z to the one at +X -Z).
 */
function drawnSurface(ground: (x: number, z: number) => number, x: number, z: number): number {
  const size = NEAR.cell;
  const x0 = Math.floor(x / size) * size;
  const z0 = Math.floor(z / size) * size;
  const u = (x - x0) / size;
  const v = (z - z0) / size;
  const a = ground(x0, z0);
  const b = ground(x0, z0 + size);
  const c = ground(x0 + size, z0 + size);
  const d = ground(x0 + size, z0);
  return u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v);
}

/** The liquid in the low places: a round sheet at its level that follows the ship and sinks with the land's rim. */
function liquidSheet(scenery: PlanetScenery, radius: { value: number }): THREE.Mesh {
  const { liquid } = scenery;
  const material = liquid.glows
    ? paint(radius, { colour: liquid.colour, emissive: liquid.colour, emissiveIntensity: 0.85, rim: 0.4 })
    : liquid.kind === 'ice'
      ? paint(radius, { colour: liquid.colour, rim: 0.45 })
      : paint(radius, { colour: liquid.colour, opacity: 0.92, rim: 0.4 });
  const geometry = new THREE.RingGeometry(0, HALF, 72, 48).rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let v = 0; v < position.count; v++) {
    position.setY(v, -(SUNK - 20) * rimSink(Math.hypot(position.getX(v), position.getZ(v)) / HALF));
  }
  geometry.computeVertexNormals();
  const sheet = new THREE.Mesh(geometry, material);
  sheet.name = 'liquid';
  sheet.frustumCulled = false;
  sheet.position.y = liquid.level;
  return sheet;
}

// --- What stands on the land ---------------------------------------------------

/** A shape painted in one colour, for merging into a prop. */
function painted(geometry: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const tone = colour(hex);
  const colours = new Float32Array(flat.attributes.position.count * 3);
  for (let v = 0; v < colours.length; v += 3) colours.set([tone.r, tone.g, tone.b], v);
  flat.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  flat.deleteAttribute('uv');
  return flat;
}

const at = (geometry: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, rz = 0) =>
  geometry.rotateX(rx).rotateZ(rz).translate(x, y, z);
const merge = (...parts: THREE.BufferGeometry[]) => mergeGeometries(parts, false)!;

interface PropShape {
  /** The solid part, one unit tall, painted; and an optional glowing part. */
  solid: THREE.BufferGeometry;
  glow?: { geometry: THREE.BufferGeometry; colour: string };
  /** How much of its size it sinks into the ground, so it sits on slopes. */
  sink: number;
}

/** Rounded, chunky shapes for what stands on the land. */
function propShapes(scenery: PlanetScenery): Record<PropKind, PropShape> {
  const { rock, high, low } = scenery.ground;
  const { accent } = scenery;
  const blob = (r: number, sx: number, sy: number, sz: number) => new THREE.SphereGeometry(r, 16, 10).scale(sx, sy, sz);
  return {
    // The umbrella tree, puffed up: a tapering trunk and soft round caps.
    tree: {
      solid: merge(
        painted(at(new THREE.CylinderGeometry(0.04, 0.08, 0.8, 10), 0, 0.4, 0), mix(rock, '#5a3d3a', 0.5)),
        painted(at(blob(0.38, 1, 0.38, 1), 0, 0.8, 0), lively(mix(high, '#2fc7a8', 0.55))),
        painted(at(blob(0.24, 1, 0.5, 1), 0.03, 0.93, 0.02), lively(mix(low, '#9af0c8', 0.45))),
        painted(at(blob(0.19, 1, 0.42, 1), -0.18, 0.6, 0.08), lively(mix(high, '#2fc7a8', 0.4))),
      ),
      glow: { geometry: pods(new THREE.SphereGeometry(0.045, 8, 6)), colour: accent },
      sink: 0.03,
    },
    // A bulb tree: a short trunk under a cluster of round puffs of leaves,
    // with glowing fruit.
    bulbtree: {
      solid: merge(
        painted(at(new THREE.CylinderGeometry(0.05, 0.09, 0.6, 10), 0, 0.3, 0), mix(rock, '#5a3d3a', 0.5)),
        painted(at(blob(0.3, 1, 0.9, 1), 0, 0.72, 0), lively(mix(high, '#5fd18a', 0.6))),
        painted(at(blob(0.22, 1, 0.9, 1), 0.2, 0.62, 0.08), lively(mix(high, '#7fe08a', 0.5))),
        painted(at(blob(0.2, 1, 0.9, 1), -0.17, 0.66, -0.1), lively(mix(low, '#4fc07a', 0.5))),
        painted(at(blob(0.18, 1, 0.9, 1), 0.02, 0.92, -0.05), lively(mix(low, '#9af0a8', 0.5))),
      ),
      glow: {
        geometry: merge(...[[0.25, 0.55, 0.2], [-0.22, 0.52, 0.15], [0.05, 0.6, -0.28], [0.12, 0.85, 0.2]].map(([x, y, z]) =>
          painted(at(new THREE.SphereGeometry(0.045, 8, 6), x, y, z), '#ffffff'))),
        colour: '#ffd23f',
      },
      sink: 0.03,
    },
    boulder: {
      solid: merge(
        painted(at(blob(0.5, 1, 0.62, 0.82), 0, 0.22, 0), rock),
        painted(at(blob(0.28, 1, 0.75, 0.9), 0.45, 0.1, 0.18), mix(rock, low, 0.3)),
      ),
      sink: 0.12,
    },
    crystal: {
      solid: painted(at(blob(0.4, 1, 0.3, 1), 0, 0.03, 0), rock),
      glow: { geometry: gems(), colour: accent },
      sink: 0.02,
    },
    // Basalt columns with rounded tops.
    column: {
      solid: merge(...COLUMNS.map(([x, z, h], n) =>
        painted(at(new THREE.CapsuleGeometry(0.11, Math.max(0.01, h - 0.22), 4, 10), x, h / 2, z), mix(rock, n % 2 ? '#000000' : low, 0.18)))),
      sink: 0.05,
    },
    // A round little volcano with a glowing mouth.
    vent: {
      solid: painted(new THREE.LatheGeometry([[0.66, 0], [0.56, 0.1], [0.36, 0.38], [0.2, 0.58], [0.15, 0.6], [0.12, 0.55]].map(([x, y]) => new THREE.Vector2(x, y)), 18), mix(rock, '#1a1010', 0.25)),
      glow: { geometry: painted(at(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 14), 0, 0.57, 0), '#ffffff'), colour: scenery.liquid.colour },
      sink: 0.04,
    },
    // A ruin of the first colonists: a standing column with its capital,
    // a broken one beside it and a fallen drum, with moss on top.
    pillar: {
      solid: merge(
        painted(at(new THREE.CylinderGeometry(0.12, 0.14, 0.95, 10), 0, 0.47, 0), '#d4cdbb'),
        painted(at(new THREE.BoxGeometry(0.34, 0.08, 0.34), 0, 0.98, 0), '#c4bca8'),
        painted(at(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 10), 0.32, 0.25, 0.1), '#cfc8b6'),
        painted(at(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 10), -0.3, 0.12, 0.25, 0, Math.PI / 2), '#c4bca8'),
        painted(at(blob(0.16, 1, 0.35, 1), 0, 1.04, 0), '#6fbf4e'),
        painted(at(blob(0.13, 1, 0.4, 1), 0.32, 0.51, 0.1), '#5fae46'),
      ),
      sink: 0.02,
    },
    // A broken wall of big stones, mossy along its top.
    wall: {
      solid: merge(
        painted(at(new THREE.BoxGeometry(1, 0.32, 0.3), 0, 0.16, 0), '#d4cdbb'),
        painted(at(new THREE.BoxGeometry(0.62, 0.3, 0.28), -0.18, 0.47, 0), '#c8c0ad'),
        painted(at(new THREE.BoxGeometry(0.3, 0.28, 0.26), -0.3, 0.76, 0.01), '#d4cdbb'),
        painted(at(new THREE.BoxGeometry(0.26, 0.18, 0.24), 0.62, 0.09, 0.2), '#c8c0ad'),
        painted(at(blob(0.22, 1, 0.3, 0.7), -0.2, 0.64, 0), '#6fbf4e'),
      ),
      sink: 0.03,
    },
    // Smooth ice spires.
    spire: {
      solid: merge(
        painted(at(new THREE.ConeGeometry(0.17, 1, 14), 0, 0.5, 0), mix(rock, '#eef7ff', 0.6)),
        painted(at(new THREE.ConeGeometry(0.1, 0.5, 12), 0.13, 0.22, 0.02, 0, -0.35), mix(rock, '#ffffff', 0.75)),
        painted(at(new THREE.ConeGeometry(0.08, 0.38, 12), -0.11, 0.17, -0.06, 0.2, 0.4), mix(rock, '#d8eeff', 0.55)),
      ),
      sink: 0.03,
    },
  };
}

/** Basalt columns: [x, z, height]. */
const COLUMNS: readonly (readonly [number, number, number])[] = [[0, 0, 1], [0.2, 0.1, 0.7], [-0.18, 0.12, 0.82], [0.05, -0.2, 0.55], [-0.15, -0.16, 0.4]];

/** The glowing pods hanging under a tree's caps. */
function pods(shape: THREE.BufferGeometry): THREE.BufferGeometry {
  return merge(...[[0.22, 0.68, 0.05], [-0.18, 0.69, -0.14], [0.02, 0.68, 0.25], [-0.25, 0.53, 0.1]].map(([x, y, z]) =>
    painted(at(shape.clone(), x, y, z), '#ffffff')));
}

/** A cluster of three glowing gems. */
function gems(): THREE.BufferGeometry {
  return merge(
    painted(at(new THREE.OctahedronGeometry(0.16, 0).scale(1, 3.2, 1), 0, 0.5, 0), '#ffffff'),
    painted(at(new THREE.OctahedronGeometry(0.11, 0).scale(1, 3, 1), 0.17, 0.3, 0.05, 0, -0.45), '#ffffff'),
    painted(at(new THREE.OctahedronGeometry(0.1, 0).scale(1, 2.6, 1), -0.14, 0.27, -0.1, 0.3, 0.5), '#ffffff'),
  );
}

/** Props around the ship, as one batch per kind, refilled as it moves on. */
class PropField {
  readonly group = new THREE.Group();
  private readonly solids = new Map<PropKind, THREE.InstancedMesh>();
  private readonly glows = new Map<PropKind, THREE.InstancedMesh>();
  private readonly cells = new Map<string, Prop[]>();
  private readonly sinks = new Map<PropKind, number>();
  private centre = { i: NaN, k: NaN };
  private readonly planet: Planet;
  private readonly ground: (x: number, z: number) => number;

  constructor(planet: Planet, ground: (x: number, z: number) => number, scenery: PlanetScenery, radius: { value: number }) {
    this.planet = planet;
    this.ground = ground;
    const shapes = propShapes(scenery);
    const solid = paint(radius, { vertexColors: true, rim: 0.35 });
    for (const kind of Object.keys(shapes) as PropKind[]) {
      const shape = shapes[kind];
      this.sinks.set(kind, shape.sink);
      const mesh = new THREE.InstancedMesh(shape.solid, solid, PROP_CAPACITY);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.solids.set(kind, mesh);
      this.group.add(mesh);
      if (shape.glow) {
        const lit = curved(new THREE.MeshBasicMaterial({ color: shape.glow.colour, vertexColors: true }), radius);
        const glowing = new THREE.InstancedMesh(shape.glow.geometry, lit, PROP_CAPACITY);
        glowing.frustumCulled = false;
        glowing.count = 0;
        this.glows.set(kind, glowing);
        this.group.add(glowing);
      }
    }
  }

  private cell(ci: number, ck: number): Prop[] {
    const key = `${ci},${ck}`;
    let props = this.cells.get(key);
    if (!props) {
      if (this.cells.size > 4000) this.cells.clear();
      props = propsInCell(this.planet, ci, ck, this.ground);
      this.cells.set(key, props);
    }
    return props;
  }

  follow(x: number, z: number): void {
    const i = Math.floor(x / PROP_CELL);
    const k = Math.floor(z / PROP_CELL);
    if (i === this.centre.i && k === this.centre.k) return;
    this.centre = { i, k };
    const counts = new Map<PropKind, number>();
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3();
    const place = new THREE.Vector3();
    const shade = new THREE.Color();
    for (let ci = i - PROP_REACH; ci <= i + PROP_REACH; ci++) {
      for (let ck = k - PROP_REACH; ck <= k + PROP_REACH; ck++) {
        for (const prop of this.cell(ci, ck)) {
          const n = counts.get(prop.kind) ?? 0;
          if (n >= PROP_CAPACITY) continue;
          counts.set(prop.kind, n + 1);
          turn.setFromAxisAngle(up, prop.yaw);
          scale.setScalar(prop.size);
          place.set(prop.x, this.ground(prop.x, prop.z) - prop.size * (this.sinks.get(prop.kind) ?? 0), prop.z);
          matrix.compose(place, turn, scale);
          const solid = this.solids.get(prop.kind)!;
          solid.setMatrixAt(n, matrix);
          solid.setColorAt(n, shade.setScalar(0.85 + 0.3 * ((prop.yaw * 7.13) % 1)));
          this.glows.get(prop.kind)?.setMatrixAt(n, matrix);
        }
      }
    }
    for (const [kind, mesh] of this.solids) {
      mesh.count = counts.get(kind) ?? 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      const glowing = this.glows.get(kind);
      if (glowing) {
        glowing.count = mesh.count;
        glowing.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

/** Side of the square cells clouds are scattered in, in metres, and how many cells each way. */
const CLOUD_CELL = 1400;
const CLOUD_REACH = 4;
const CLOUD_CAPACITY = (CLOUD_REACH * 2 + 1) ** 2 * 3 * 7;

/** Puffy clouds well above the highest land: white on cold and mild worlds, smoke on hot ones. */
class CloudField {
  readonly mesh: THREE.InstancedMesh;
  private centre = { i: NaN, k: NaN };
  private readonly seed: number;
  private readonly height: number;

  constructor(scenery: PlanetScenery, seed: number, radius: { value: number }) {
    this.seed = seed + 5113;
    this.height = scenery.relief * 3 + 420;
    // A dying world: even the clouds are grey with ash.
    const tone = mix(mix(mix('#ffffff', scenery.sky.horizon, 0.06), mix('#4a3330', scenery.sky.horizon, 0.3), scenery.weights.lava), '#8a7672', 0.5);
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), paint(radius, { colour: tone, rim: 0.55 }), CLOUD_CAPACITY);
    this.mesh.name = 'clouds';
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
  }

  follow(x: number, z: number): void {
    const i = Math.floor(x / CLOUD_CELL);
    const k = Math.floor(z / CLOUD_CELL);
    if (i === this.centre.i && k === this.centre.k) return;
    this.centre = { i, k };
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const place = new THREE.Vector3();
    let n = 0;
    for (let ci = i - CLOUD_REACH; ci <= i + CLOUD_REACH; ci++) {
      for (let ck = k - CLOUD_REACH; ck <= k + CLOUD_REACH; ck++) {
        let draw = 0;
        const next = () => hash2(ci * 92821 + draw, ck * 68917 - draw++, this.seed);
        const clouds = Math.floor(next() * 2.6);
        for (let c = 0; c < clouds; c++) {
          const cx = (ci + next()) * CLOUD_CELL;
          const cz = (ck + next()) * CLOUD_CELL;
          const cy = this.height + next() * 320;
          const puffs = 4 + Math.floor(next() * 4);
          const size = 55 + next() * 70;
          for (let p = 0; p < puffs && n < CLOUD_CAPACITY; p++) {
            const r = size * (0.6 + next() * 0.7);
            place.set(cx + (next() - 0.5) * size * 4, cy + (next() - 0.3) * size * 0.5, cz + (next() - 0.5) * size * 1.8);
            scale.set(r * 1.2, r * 0.75, r);
            matrix.compose(place, turn, scale);
            this.mesh.setMatrixAt(n++, matrix);
          }
        }
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/** The landing pad at the origin: a hexagon with a ring of lights. */
function landingPad(radius: { value: number }): THREE.Group {
  const pad = new THREE.Group();
  const solid = (hex: string) => paint(radius, { colour: hex, rim: 0.3 });
  const lit = (hex: string) => curved(new THREE.MeshBasicMaterial({ color: hex }), radius);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(16, 17, 0.6, 32), solid('#5b6072'));
  base.position.y = 0.3;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 14.5, 0.1, 32), solid('#7c8296'));
  deck.position.y = 0.62;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.25, 8, 48).rotateX(Math.PI / 2), solid('#ff8b2c'));
  ring.position.y = 0.68;
  const inner = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.18, 4, 40).rotateX(Math.PI / 2), lit('#63e9ff'));
  inner.position.y = 0.68;
  pad.add(base, deck, ring, inner);
  const lampGeometry = new THREE.CapsuleGeometry(0.32, 0.6, 4, 10);
  for (let n = 0; n < 6; n++) {
    const angle = (n / 6) * Math.PI * 2 + Math.PI / 6;
    const post = new THREE.Mesh(lampGeometry, lit(n % 2 ? '#ff8b2c' : '#63e9ff'));
    post.position.set(Math.cos(angle) * 14.6, 1.1, Math.sin(angle) * 14.6);
    pad.add(post);
  }
  return pad;
}

// --- Flora around the player ----------------------------------------------------

/** How many flora cells around the camera are filled, each way. */
const FLORA_REACH = 7;
const FLORA_CAPACITY = 6000;

/** Small rounded plants, one unit tall, painted white: each one takes its colour per plant. */
function floraShapes(): Record<FloraKind, THREE.BufferGeometry> {
  const blade = (lean: number, turn: number) => at(new THREE.ConeGeometry(0.06, 1, 5).translate(0, 0.5, 0).rotateY(turn), 0, 0, 0, lean, lean * 0.6);
  return {
    grass: merge(...[[0, 0], [0.25, 1.3], [-0.3, 2.5], [0.15, 3.6], [-0.2, 4.8]].map(([lean, turn]) => painted(blade(lean, turn), '#ffffff'))),
    // A flower: a stem and a round blossom with a pale heart.
    flower: merge(
      painted(new THREE.CylinderGeometry(0.02, 0.025, 0.8, 5).translate(0, 0.4, 0), '#4f9a3c'),
      painted(new THREE.SphereGeometry(0.16, 10, 6).scale(1, 0.45, 1).translate(0, 0.85, 0), '#ffffff'),
      painted(new THREE.SphereGeometry(0.07, 8, 5).translate(0, 0.9, 0.02), '#fff1a8'),
    ),
    bush: merge(
      painted(new THREE.SphereGeometry(0.5, 12, 8).scale(1, 0.75, 1).translate(0, 0.38, 0), '#ffffff'),
      painted(new THREE.SphereGeometry(0.34, 10, 7).scale(1, 0.8, 1).translate(0.32, 0.3, 0.12), '#ffffff'),
      painted(new THREE.SphereGeometry(0.3, 10, 7).scale(1, 0.8, 1).translate(-0.3, 0.28, -0.1), '#ffffff'),
    ),
    // A fern: leaning fronds around a heart.
    fern: merge(...Array.from({ length: 6 }, (_, k) =>
      painted(new THREE.SphereGeometry(0.5, 8, 5).scale(0.18, 0.06, 1).translate(0, 0, 0.5).rotateX(-0.7).translate(0, 0.35, 0).rotateY((k / 6) * Math.PI * 2), '#ffffff'))),
    // A mushroom: a pale stalk under a round cap (the cap glows, apart).
    mushroom: painted(new THREE.CylinderGeometry(0.08, 0.11, 0.7, 8).translate(0, 0.35, 0), '#fff1e0'),
  };
}

/** Colours each kind of plant takes, picked by the plant's tint. */
function floraColours(scenery: PlanetScenery): Record<FloraKind, string[]> {
  const { low, high } = scenery.ground;
  return {
    grass: [lively(mix(low, '#7fd45a', 0.4)), lively(mix(high, '#5fbf4a', 0.4)), lively(mix(low, '#a8e06a', 0.5))],
    flower: ['#ff8fc4', '#ffd23f', '#ffffff', '#c58bff', '#ff8b2c'],
    bush: [lively(mix(high, '#3fae6a', 0.5)), lively(mix(low, '#5fc78a', 0.5)), lively(mix(high, '#2f9a7a', 0.5))],
    fern: [lively(mix(low, '#4fbf6a', 0.5)), lively(mix(high, '#7fd47a', 0.5))],
    mushroom: ['#fff1e0'],
  };
}

/** The small plants around the camera, refilled as it moves on. */
class FloraField {
  readonly group = new THREE.Group();
  private readonly meshes = new Map<FloraKind, THREE.InstancedMesh>();
  private readonly caps: THREE.InstancedMesh;
  private readonly cells = new Map<string, Flora[]>();
  private readonly colours: Record<FloraKind, string[]>;
  private centre = { i: NaN, k: NaN };
  private readonly planet: Planet;
  private readonly ground: (x: number, z: number) => number;

  constructor(planet: Planet, ground: (x: number, z: number) => number, scenery: PlanetScenery, radius: { value: number }) {
    this.planet = planet;
    this.ground = ground;
    this.colours = floraColours(scenery);
    const shapes = floraShapes();
    const material = paint(radius, { vertexColors: true, rim: 0.4 });
    for (const kind of Object.keys(shapes) as FloraKind[]) {
      const mesh = new THREE.InstancedMesh(shapes[kind], material, FLORA_CAPACITY);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.meshes.set(kind, mesh);
      this.group.add(mesh);
    }
    // The glowing caps of the mushrooms.
    const cap = painted(new THREE.SphereGeometry(0.34, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.75, 1).translate(0, 0.66, 0), '#ffffff');
    this.caps = new THREE.InstancedMesh(cap, curved(new THREE.MeshBasicMaterial({ vertexColors: true }), radius), FLORA_CAPACITY);
    this.caps.frustumCulled = false;
    this.caps.count = 0;
    this.group.add(this.caps);
  }

  private cell(ci: number, ck: number): Flora[] {
    const key = `${ci},${ck}`;
    let flora = this.cells.get(key);
    if (!flora) {
      if (this.cells.size > 3000) this.cells.clear();
      flora = floraInCell(this.planet, ci, ck, this.ground);
      this.cells.set(key, flora);
    }
    return flora;
  }

  follow(x: number, z: number): void {
    const i = Math.floor(x / FLORA_CELL);
    const k = Math.floor(z / FLORA_CELL);
    if (i === this.centre.i && k === this.centre.k) return;
    this.centre = { i, k };
    const counts = new Map<FloraKind, number>();
    let caps = 0;
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3();
    const place = new THREE.Vector3();
    const tone = new THREE.Color();
    const glows = ['#7ff7e0', '#ff8fc4', '#c58bff'];
    for (let ci = i - FLORA_REACH; ci <= i + FLORA_REACH; ci++) {
      for (let ck = k - FLORA_REACH; ck <= k + FLORA_REACH; ck++) {
        for (const plant of this.cell(ci, ck)) {
          const n = counts.get(plant.kind) ?? 0;
          if (n >= FLORA_CAPACITY) continue;
          counts.set(plant.kind, n + 1);
          turn.setFromAxisAngle(up, plant.yaw);
          scale.setScalar(plant.size);
          place.set(plant.x, this.ground(plant.x, plant.z) - plant.size * 0.04, plant.z);
          matrix.compose(place, turn, scale);
          const mesh = this.meshes.get(plant.kind)!;
          mesh.setMatrixAt(n, matrix);
          const palette = this.colours[plant.kind];
          mesh.setColorAt(n, tone.set(palette[Math.floor(plant.tint * palette.length) % palette.length]));
          if (plant.kind === 'mushroom') {
            this.caps.setMatrixAt(caps, matrix);
            this.caps.setColorAt(caps++, tone.set(glows[Math.floor(plant.tint * glows.length) % glows.length]));
          }
        }
      }
    }
    for (const [kind, mesh] of this.meshes) {
      mesh.count = counts.get(kind) ?? 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.caps.count = caps;
    this.caps.instanceMatrix.needsUpdate = true;
    if (this.caps.instanceColor) this.caps.instanceColor.needsUpdate = true;
  }
}

// --- Forests and paths -----------------------------------------------------------------

/** Trees one by one around the camera, and as masses of canopy further out. */
const TREES_NEAR = { step: 9, radius: 430, redraw: 40 };
const TREES_FAR = { step: 70, radius: 3600, redraw: 220 };
type TreeKind = 'pine' | 'oak' | 'umbrella' | 'bulb';

/** Trees one unit tall, painted: a pine of stacked cones and a round oak. */
function treeShapes(scenery: PlanetScenery): Record<TreeKind, THREE.BufferGeometry> {
  const trunk = mix(scenery.ground.rock, '#6a4632', 0.6);
  const props = propShapes(scenery);
  return {
    pine: merge(
      painted(at(new THREE.CylinderGeometry(0.035, 0.06, 0.32, 7), 0, 0.16, 0), trunk),
      painted(at(new THREE.ConeGeometry(0.3, 0.42, 9), 0, 0.42, 0), '#2f8a5a'),
      painted(at(new THREE.ConeGeometry(0.23, 0.38, 9), 0, 0.64, 0), '#37996a'),
      painted(at(new THREE.ConeGeometry(0.15, 0.34, 9), 0, 0.84, 0), '#45ac74'),
    ),
    oak: merge(
      painted(at(new THREE.CylinderGeometry(0.05, 0.08, 0.5, 7), 0, 0.25, 0), trunk),
      painted(at(new THREE.IcosahedronGeometry(0.33, 1), 0, 0.64, 0), '#58b64a'),
      painted(at(new THREE.IcosahedronGeometry(0.24, 1), 0.22, 0.55, 0.08), '#4ca542'),
      painted(at(new THREE.IcosahedronGeometry(0.25, 1), -0.2, 0.58, -0.06), '#64c254'),
      painted(at(new THREE.IcosahedronGeometry(0.22, 1), 0.03, 0.82, 0.02), '#72ce5e'),
    ),
    umbrella: props.tree.solid,
    bulb: props.bulbtree.solid,
  };
}

class ForestField {
  readonly group = new THREE.Group();
  private readonly near = new Map<TreeKind, THREE.InstancedMesh>();
  private readonly far: THREE.InstancedMesh;
  private nearCentre = new THREE.Vector2(Infinity, Infinity);
  private farCentre = new THREE.Vector2(Infinity, Infinity);
  private readonly density: (x: number, z: number) => number;
  private readonly ground: (x: number, z: number) => number;
  private readonly seed: number;
  /** The trees near the camera, filed in 20 m squares: x, y, z, size, kind. */
  private trees = new Map<string, [number, number, number, number, TreeKind][]>();

  /** Whether a circle of `radius` at a point runs into a trunk. */
  blocked(x: number, z: number, radius: number): boolean {
    for (const [tx, , tz, size, kind] of this.near20(x, z)) {
      const trunk = size * (kind === 'pine' ? 0.05 : kind === 'oak' ? 0.07 : 0.06);
      if (Math.hypot(tx - x, tz - z) < trunk + radius) return true;
    }
    return false;
  }

  /** Whether a point is inside a tree's crown (for the camera). */
  inCrown(x: number, y: number, z: number): boolean {
    for (const [tx, ty, tz, size, kind] of this.near20(x, z)) {
      const out = Math.hypot(tx - x, tz - z);
      const h = (y - ty) / size;
      if (kind === 'pine' && h > 0.2 && h < 1 && out < 0.32 * size * (1 - (h - 0.2) / 0.8) + 0.4) return true;
      if (kind === 'oak' && Math.hypot(out, (h - 0.65) * size) < 0.42 * size) return true;
      if ((kind === 'umbrella' || kind === 'bulb') && h > 0.55 && h < 1 && out < 0.36 * size) return true;
    }
    return false;
  }

  private near20(x: number, z: number) {
    const gi = Math.floor(x / 20);
    const gk = Math.floor(z / 20);
    const list: [number, number, number, number, TreeKind][] = [];
    for (let i = gi - 1; i <= gi + 1; i++) for (let k = gk - 1; k <= gk + 1; k++) list.push(...(this.trees.get(`${i},${k}`) ?? []));
    return list;
  }

  constructor(planet: Planet, ground: (x: number, z: number) => number, scenery: PlanetScenery, radius: { value: number }, seed: number, paths: PlanetPaths) {
    this.ground = ground;
    this.seed = seed + 1203;
    this.density = forestDensity(planet, ground, paths);
    const look = paint(radius, { vertexColors: true, rim: 0.32 });
    const shapes = treeShapes(scenery);
    for (const kind of Object.keys(shapes) as TreeKind[]) {
      const mesh = new THREE.InstancedMesh(shapes[kind], look, 6000);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.near.set(kind, mesh);
      this.group.add(mesh);
    }
    // Far away, a forest is a mass of round canopy.
    const canopy = merge(
      painted(at(new THREE.IcosahedronGeometry(0.42, 1), 0, 0.5, 0), '#4ca542'),
      painted(at(new THREE.IcosahedronGeometry(0.32, 1), 0.3, 0.42, 0.15), '#3f9a4a'),
      painted(at(new THREE.IcosahedronGeometry(0.3, 1), -0.28, 0.45, -0.12), '#58b64a'),
      painted(at(new THREE.CylinderGeometry(0.5, 0.55, 0.3, 8), 0, 0.15, 0), '#3a7a3a'),
    );
    this.far = new THREE.InstancedMesh(canopy, look, 9000);
    this.far.frustumCulled = false;
    this.far.count = 0;
    this.group.add(this.far);
  }

  follow(x: number, z: number, height: number): void {
    const here = new THREE.Vector2(x, z);
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3();
    const place = new THREE.Vector3();
    const tint = new THREE.Color();
    // Close by: tree by tree, unless high up in the air.
    if (height > 350) {
      for (const mesh of this.near.values()) mesh.count = 0;
      this.nearCentre.set(Infinity, Infinity);
    } else if (this.nearCentre.distanceTo(here) > TREES_NEAR.redraw) {
      this.nearCentre.copy(here);
      this.trees = new Map();
      const counts = new Map<TreeKind, number>();
      const { step, radius } = TREES_NEAR;
      const reach = Math.ceil(radius / step);
      const gi = Math.round(x / step);
      const gk = Math.round(z / step);
      for (let i = gi - reach; i <= gi + reach; i++) {
        for (let k = gk - reach; k <= gk + reach; k++) {
          const r = hash2(i, k, this.seed);
          const px = (i + hash2(k, i, this.seed + 1) - 0.5) * step;
          const pz = (k + hash2(i * 3, k * 5, this.seed + 2) - 0.5) * step;
          if (Math.hypot(px - x, pz - z) > radius) continue;
          const thick = this.density(px, pz);
          if (r > thick * 0.9) continue;
          const pick = hash2(i * 7, k * 11, this.seed + 3);
          const kind: TreeKind = pick < 0.38 + 0.2 * thick ? 'pine' : pick < 0.78 ? 'oak' : pick < 0.9 ? 'umbrella' : 'bulb';
          const n = counts.get(kind) ?? 0;
          if (n >= 6000) continue;
          counts.set(kind, n + 1);
          const size = { pine: 10 + 9 * pick, oak: 7 + 7 * r, umbrella: 9 + 8 * r, bulb: 6 + 5 * r }[kind];
          turn.setFromAxisAngle(up, r * 40);
          scale.set(size * (0.9 + 0.2 * pick), size, size * (0.9 + 0.2 * r));
          place.set(px, drawnSurface(this.ground, px, pz) - size * 0.02, pz);
          matrix.compose(place, turn, scale);
          const key = `${Math.floor(px / 20)},${Math.floor(pz / 20)}`;
          const filed = this.trees.get(key) ?? [];
          filed.push([px, place.y, pz, size, kind]);
          this.trees.set(key, filed);
          const mesh = this.near.get(kind)!;
          mesh.setMatrixAt(n, matrix);
          mesh.setColorAt(n, tint.setScalar(0.88 + 0.24 * pick));
        }
      }
      for (const [kind, mesh] of this.near) {
        mesh.count = counts.get(kind) ?? 0;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
    // Further out: masses of canopy, redrawn less often, and not from space.
    if (height < 1500 && this.farCentre.distanceTo(here) > TREES_FAR.redraw) {
      this.farCentre.copy(here);
      const { step, radius } = TREES_FAR;
      const from = height > 350 ? 0 : TREES_NEAR.radius - 30;
      const reach = Math.ceil(radius / step);
      const gi = Math.round(x / step);
      const gk = Math.round(z / step);
      let n = 0;
      for (let i = gi - reach; i <= gi + reach && n < 9000; i++) {
        for (let k = gk - reach; k <= gk + reach && n < 9000; k++) {
          const px = (i + hash2(k, i, this.seed + 5) - 0.5) * step;
          const pz = (k + hash2(i, k, this.seed + 6) - 0.5) * step;
          const distance = Math.hypot(px - x, pz - z);
          if (distance > radius || distance < from) continue;
          const thick = this.density(px, pz);
          if (thick < 0.35) continue;
          const r = hash2(i * 13, k * 17, this.seed + 7);
          const wide = 26 + 18 * thick + 8 * r;
          turn.setFromAxisAngle(up, r * 40);
          scale.set(wide, 14 + 10 * thick, wide);
          place.set(px, this.ground(px, pz) - 2, pz);
          matrix.compose(place, turn, scale);
          this.far.setMatrixAt(n, matrix);
          this.far.setColorAt(n++, tint.setScalar(0.85 + 0.25 * r));
        }
      }
      this.far.count = n;
      this.far.instanceMatrix.needsUpdate = true;
      if (this.far.instanceColor) this.far.instanceColor.needsUpdate = true;
    }
  }
}

/** The dirt paths, laid on the drawn land as ribbons. */
function pathRibbons(paths: PlanetPaths, ground: (x: number, z: number) => number, level: number, radius: { value: number }): THREE.Mesh {
  const positions: number[] = [];
  const index: number[] = [];
  const HALF_WIDTH = 2.3;
  for (const line of paths.lines) {
    // Every 4 m along the path.
    const points: [number, number][] = [];
    for (let i = 1; i < line.length; i++) {
      const [x0, z0] = line[i - 1];
      const [x1, z1] = line[i];
      const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 4));
      for (let s = 0; s < steps; s++) points.push([x0 + ((x1 - x0) * s) / steps, z0 + ((z1 - z0) * s) / steps]);
    }
    points.push(line[line.length - 1]);
    const start = positions.length / 3;
    points.forEach(([x, z], i) => {
      const [ax, az] = points[Math.max(0, i - 1)];
      const [bx, bz] = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(bx - ax, bz - az) || 1;
      const nx = -(bz - az) / length;
      const nz = (bx - ax) / length;
      for (const side of [1, -1]) {
        const px = x + nx * HALF_WIDTH * side;
        const pz = z + nz * HALF_WIDTH * side;
        positions.push(px, Math.max(drawnSurface(ground, px, pz), level + 0.3) + 0.2, pz);
      }
      if (i > 0) {
        const a = start + (i - 1) * 2;
        index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const material = paint(radius, { colour: '#dcc394', rim: 0.15 });
  material.polygonOffset = true;
  material.polygonOffsetFactor = -2;
  material.polygonOffsetUnits = -2;
  material.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.name = 'paths';
  return mesh;
}

// --- Tall grass around the player ----------------------------------------------------

/** Metres between clumps of grass, and how far around the camera it grows. */
const GRASS_STEP = 1.05;
const GRASS_RADIUS = 40;
const GRASS_CAPACITY = Math.ceil(Math.PI * (GRASS_RADIUS / GRASS_STEP) ** 2 * 1.05);

/** A clump of five blades, one unit tall, dark at the root and light at the tip. */
function grassClump(): THREE.BufferGeometry {
  const blades = [[0, 0, 0, 1], [0.18, 0.08, 0.5, 0.85], [-0.15, 0.12, 1.7, 0.92], [0.05, -0.17, 3, 0.78], [-0.1, -0.08, 4.4, 0.7]].map(([x, z, turn, tall]) => {
    const blade = new THREE.ConeGeometry(0.07, 1, 3, 1, true).translate(0, 0.5, 0).scale(1, tall, 1).rotateY(turn).rotateX(0.18).rotateY(turn * 0.7).translate(x, 0, z);
    return blade.index ? blade.toNonIndexed() : blade;
  });
  const clump = mergeGeometries(blades, false)!;
  const position = clump.attributes.position;
  const colours = new Float32Array(position.count * 3);
  for (let v = 0; v < position.count; v++) {
    const shade = 0.5 + 0.5 * Math.min(1, position.getY(v));
    colours.set([shade, shade, shade], v * 3);
  }
  clump.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  clump.deleteAttribute('uv');
  return clump;
}

/** Thick, tall grass around the camera that sways in the wind, on temperate land. */
class GrassField {
  readonly mesh: THREE.InstancedMesh;
  readonly wind = { value: 0 };
  private centre = new THREE.Vector2(Infinity, Infinity);
  private readonly ground: (x: number, z: number) => number;
  private readonly scenery: PlanetScenery;
  private readonly seed: number;
  private readonly tones: THREE.Color[];

  private readonly paths: PlanetPaths;
  private readonly dead: (x: number, z: number) => number;

  constructor(ground: (x: number, z: number) => number, scenery: PlanetScenery, seed: number, radius: { value: number }, paths: PlanetPaths, dead: (x: number, z: number) => number) {
    this.ground = ground;
    this.scenery = scenery;
    this.paths = paths;
    this.dead = dead;
    this.seed = seed + 707;
    const material = curved(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: SOFT_RAMP, side: THREE.DoubleSide }), radius, 0.25, 0, this.wind);
    this.mesh = new THREE.InstancedMesh(grassClump(), material, GRASS_CAPACITY);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    const { low, high } = scenery.ground;
    this.tones = [mix(low, '#8fe05a', 0.45), mix(low, '#6fd04a', 0.35), mix(high, '#a8e86a', 0.4), mix(low, '#c8f07a', 0.3)].map((hex) => colour(lively(hex)));
  }

  follow(x: number, z: number, height: number, seconds: number): void {
    this.wind.value = seconds;
    // Up high it cannot be seen: no grass.
    if (height > 60 || this.scenery.weights.moss < 0.3) {
      this.mesh.count = 0;
      this.centre.set(Infinity, Infinity);
      return;
    }
    if (this.centre.distanceTo(new THREE.Vector2(x, z)) < 5) return;
    this.centre.set(x, z);
    // Heights of the drawn land at the corners of its squares, kept while filling.
    const corners = new Map<number, number>();
    const corner = (i: number, k: number) => {
      const key = i * 100_003 + k;
      let h = corners.get(key);
      if (h === undefined) {
        h = this.ground(i * NEAR.cell, k * NEAR.cell);
        corners.set(key, h);
      }
      return h;
    };
    const surface = (px: number, pz: number) => {
      const i = Math.floor(px / NEAR.cell);
      const k = Math.floor(pz / NEAR.cell);
      const u = px / NEAR.cell - i;
      const v = pz / NEAR.cell - k;
      const a = corner(i, k);
      const b = corner(i, k + 1);
      const c = corner(i + 1, k + 1);
      const d = corner(i + 1, k);
      const h = u + v <= 1 ? a + (d - a) * u + (b - a) * v : c + (b - c) * (1 - u) + (d - c) * (1 - v);
      const slope = u + v <= 1 ? Math.hypot(d - a, b - a) : Math.hypot(b - c, d - c);
      return [h, slope / NEAR.cell] as const;
    };
    const matrix = new THREE.Matrix4();
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const scale = new THREE.Vector3();
    const place = new THREE.Vector3();
    const level = this.scenery.liquid.level;
    let n = 0;
    const reach = Math.ceil(GRASS_RADIUS / GRASS_STEP);
    const gi = Math.round(x / GRASS_STEP);
    const gk = Math.round(z / GRASS_STEP);
    for (let i = gi - reach; i <= gi + reach && n < GRASS_CAPACITY; i++) {
      for (let k = gk - reach; k <= gk + reach && n < GRASS_CAPACITY; k++) {
        const px = (i + hash2(i, k, this.seed) - 0.5) * GRASS_STEP;
        const pz = (k + hash2(k, i, this.seed + 1) - 0.5) * GRASS_STEP;
        const distance = Math.hypot(px - x, pz - z);
        const fromHome = Math.hypot(px, pz);
        if (distance > GRASS_RADIUS || fromHome < 17) continue;
        if (fromHome > LAST_VALLEY.inner - 130 && this.dead(px, pz) > 0.25) continue;
        const [h, slope] = surface(px, pz);
        if (h < level + 0.8 || slope > 0.9 || this.paths.distance(px, pz) < 2.8) continue;
        const r = hash2(i * 3, k * 7, this.seed + 2);
        // Shorter towards the edge, so the field fades into the land.
        const tall = (0.55 + 0.75 * r) * (1 - 0.6 * smooth(GRASS_RADIUS * 0.6, GRASS_RADIUS, distance));
        turn.setFromAxisAngle(up, r * 6.28);
        scale.set(1 + r * 0.6, tall, 1 + r * 0.6);
        place.set(px, h - 0.05, pz);
        matrix.compose(place, turn, scale);
        this.mesh.setMatrixAt(n, matrix);
        this.mesh.setColorAt(n, this.tones[Math.floor(r * this.tones.length) % this.tones.length]);
        n++;
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// --- Landmarks and fauna -----------------------------------------------------------

const SPECIES: Record<Species, ModelEntry> = { mossback, puffhop, skyfin };

/** A model placed on the land, drawn on the curve of the world by moving it down. */
interface Placed {
  object: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  x: number;
  z: number;
  /** Extra height over the ground (fliers). */
  lift: number;
  /** Farthest it is drawn, in metres. */
  reach: number;
}

/** One animal of a herd: it walks a loop around the herd's middle, or rests. */
interface Animal extends Placed {
  centre: { x: number; z: number };
  roam: number;
  angle: number;
  speed: number;
  walking: boolean;
}

/** Clones a model with its own mixer, playing a clip in a loop. */
function instance(entry: ModelEntry, built: Map<string, { root: THREE.Object3D; clips: THREE.AnimationClip[] }>, clip: string, offset: number) {
  let model = built.get(entry.id);
  if (!model) {
    model = entry.create();
    built.set(entry.id, model);
  }
  const object = model.root.clone();
  const mixer = new THREE.AnimationMixer(object);
  const found = model.clips.find((candidate) => candidate.name === clip);
  if (found) mixer.clipAction(found).play().time = offset * found.duration;
  return { object, mixer, clips: model.clips };
}

/** The village's folk, in the order of `village.folk`: they give the quests. */
export const FOLK: readonly ModelEntry[] = [bloomkin, forgeback, lumen, drifter];

/** A placed thing the game can find again and act on: light a beacon, open a chest, take a shard. */
interface Item extends Placed {
  clips: THREE.AnimationClip[];
}

class Landmarks {
  readonly group = new THREE.Group();
  readonly features: PlanetFeatures;
  readonly items = new Map<string, Item>();
  private readonly fixed: Placed[] = [];
  private readonly shards: Placed[] = [];
  private readonly animals: Animal[] = [];
  private readonly ground: (x: number, z: number) => number;
  private readonly radius: { value: number };

  constructor(planet: Planet, ground: (x: number, z: number) => number, radius: { value: number }) {
    this.ground = ground;
    this.radius = radius;
    const features = planetFeatures(planet, ground);
    this.features = features;
    const built = new Map<string, { root: THREE.Object3D; clips: THREE.AnimationClip[] }>();
    const fix = (entry: ModelEntry, x: number, z: number, yaw: number, reach: number, kind?: string, index = 0) => {
      const { object, mixer, clips } = instance(entry, built, 'Idle', Math.abs(x * 0.013) % 1);
      object.rotation.y = yaw;
      this.group.add(object);
      const item = { object, mixer, x, z, lift: 0, reach, clips };
      this.fixed.push(item);
      if (kind) this.items.set(`${kind}:${index}`, item);
    };
    for (const [k, gate] of features.gates.entries()) fix(ruinGate, gate.x, gate.z, gate.yaw, 6000, 'gate', k);
    for (const tree of features.giants) fix(giantTree, tree.x, tree.z, tree.yaw, 12000);
    if (features.nest) fix(dragonNest, features.nest.x, features.nest.z, features.nest.yaw, 9000, 'nest', 0);
    for (const [k, spot] of features.beacons.entries()) fix(beacon, spot.x, spot.z, spot.yaw, 9000, 'beacon', k);
    for (const [k, spot] of features.chests.entries()) fix(chest, spot.x, spot.z, spot.yaw, 900, 'chest', k);
    for (const camp of features.camps) fix(campfire, camp.x + Math.sin(camp.yaw) * 5, camp.z + Math.cos(camp.yaw) * 5, 0, 1500);
    if (features.village) {
      for (const spot of features.village.huts) fix(hut, spot.x, spot.z, spot.yaw, 3000);
      for (const [k, spot] of features.village.folk.entries()) fix(FOLK[k % FOLK.length], spot.x, spot.z, spot.yaw + Math.PI, 600, 'folk', k);
    }
    // Star shards: a glowing gem in a halo, floating and turning.
    const gem = new THREE.OctahedronGeometry(0.32, 0).scale(1, 1.6, 1);
    const gemLook = curved(new THREE.MeshBasicMaterial({ color: '#c8f4ff' }), radius);
    const aura = new THREE.SphereGeometry(0.75, 12, 8);
    const auraLook = curved(new THREE.MeshBasicMaterial({ color: '#7ff7e0', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), radius);
    for (const [k, spot] of features.shards.entries()) {
      const object = new THREE.Group();
      object.add(new THREE.Mesh(gem, gemLook), new THREE.Mesh(aura, auraLook));
      this.group.add(object);
      const item = { object, mixer: new THREE.AnimationMixer(object), x: spot.x, z: spot.z, lift: 1.3, reach: 700, clips: [] };
      this.shards.push(item);
      this.items.set(`shard:${k}`, item);
    }
    let n = 0;
    for (const herd of features.herds) {
      for (let k = 0; k < herd.count; k++) {
        const r = hash2(n, k, 77);
        const flies = herd.species === 'skyfin';
        // Fliers always glide; on the ground about half the herd walks.
        const walking = flies || r > 0.45;
        const entry = SPECIES[herd.species];
        const { object, mixer } = instance(entry, built, walking ? 'Move' : 'Idle', r);
        this.group.add(object);
        const angle = (k / herd.count) * Math.PI * 2 + r;
        const roam = herd.roam * (0.5 + 0.5 * hash2(k, n, 91));
        this.animals.push({
          object, mixer, x: herd.x, z: herd.z, lift: flies ? 18 + 25 * r : 0, reach: flies ? 1800 : 900,
          centre: { x: herd.x, z: herd.z }, roam, angle, walking,
          speed: (herd.species === 'mossback' ? 1.6 : herd.species === 'puffhop' ? 2.4 : 7) * (0.8 + 0.4 * r) / roam,
        });
        n++;
      }
    }
  }

  update(camera: THREE.Camera, dt: number): void {
    const eye = camera.position;
    const drop = (x: number, z: number) => ((x - eye.x) ** 2 + (z - eye.z) ** 2) / (2 * this.radius.value);
    const show = (item: Placed) => {
      const far = Math.hypot(item.x - eye.x, item.z - eye.z);
      item.object.visible = far < item.reach;
      if (!item.object.visible) return;
      item.object.position.set(item.x, this.ground(item.x, item.z) + item.lift - drop(item.x, item.z), item.z);
      item.mixer.update(dt);
    };
    for (const item of this.fixed) show(item);
    for (const shard of this.shards) {
      if (shard.object.userData.taken) {
        shard.object.visible = false;
        continue;
      }
      show(shard);
      shard.object.rotation.y += dt * 1.6;
      shard.object.position.y += 0.15 * Math.sin(performance.now() / 500 + shard.x);
    }
    for (const animal of this.animals) {
      if (animal.walking) {
        animal.angle += animal.speed * dt;
        animal.x = animal.centre.x + Math.sin(animal.angle) * animal.roam;
        animal.z = animal.centre.z + Math.cos(animal.angle) * animal.roam;
        // Facing along the loop.
        animal.object.rotation.y = animal.angle + Math.PI / 2;
      } else {
        animal.x = animal.centre.x + Math.sin(animal.angle) * animal.roam;
        animal.z = animal.centre.z + Math.cos(animal.angle) * animal.roam;
        animal.object.rotation.y = animal.angle * 3;
      }
      show(animal);
    }
  }
}

// --- The sky and the globe -----------------------------------------------------

/** A dome of sky around the camera: the zenith, the horizon, and space as the ship climbs. */
function skyDome(scenery: PlanetScenery): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      zenith: { value: colour(scenery.sky.zenith) },
      horizon: { value: colour(scenery.sky.horizon) },
      space: { value: colour(scenery.sky.space) },
      airOut: { value: 0 },
      ember: { value: colour('#ff5a2a') },
      burn: { value: 0 },
    },
    vertexShader: 'varying vec3 vDirection; void main() { vDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 space; uniform float airOut;
uniform vec3 ember; uniform float burn;
varying vec3 vDirection;
void main() {
  float up = clamp(vDirection.y, -1.0, 1.0);
  vec3 air = mix(horizon, zenith, pow(smoothstep(-0.05, 0.75, up), 0.7));
  // All around, past the mountains, the world is burning: the horizon glows.
  air = mix(air, ember, (1.0 - smoothstep(-0.04, 0.3, up)) * 0.6);
  // And at the end the whole sky does.
  air = mix(air, mix(ember, vec3(0.16, 0.04, 0.03), smoothstep(-0.1, 0.8, up)), burn);
  // Climbing out, the air thins to space from the top down.
  float thin = clamp(airOut * 1.6 - (1.0 - smoothstep(-0.25, 0.4, up)) * (1.0 - airOut) * 0.9, 0.0, 1.0);
  gl_FragColor = vec4(mix(air, space, thin), 1.0);
}`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(30_000, 32, 16), material);
  dome.name = 'sky';
  dome.renderOrder = -10;
  dome.frustumCulled = false;
  return dome;
}

/** The planet as a ball under the ship, and the glow of its air around it. */
function globe(scenery: PlanetScenery, seed: number): THREE.Group {
  const radius = scenery.globeRadius;
  const geometry = new THREE.IcosahedronGeometry(radius, 6);
  const position = geometry.attributes.position;
  const colours = new Float32Array(position.count * 3);
  const tones = { low: colour(scenery.ground.low), high: colour(scenery.ground.high), peak: colour(scenery.ground.peak), liquid: colour(scenery.liquid.colour) };
  const shore = colour(scenery.liquid.kind === 'water' ? mix(scenery.ground.low, '#e8d6a0', 0.55) : mix(scenery.liquid.colour, scenery.ground.low, 0.5));
  const tone = new THREE.Color();
  const point = new THREE.Vector3();
  // Continents, coasts and ranges from smooth noise over the sphere, in the
  // same colours as the land near the ship.
  for (let v = 0; v < position.count; v++) {
    point.fromBufferAttribute(position, v).normalize();
    const height = fbm(point.x * 3.2 + point.y * 1.9, point.z * 3.2 - point.y * 1.4, seed, 5);
    tone.copy(tones.low).lerp(tones.high, smooth(0.02, 0.32, height)).lerp(tones.peak, smooth(0.38, 0.5, height));
    tone.lerp(shore, 1 - smooth(-0.06, -0.02, height));
    tone.lerp(tones.liquid, 1 - smooth(-0.1, -0.07, height));
    // The whole planet is burnt but for the last valley, at the top.
    const alive = smooth(Math.cos(0.13), Math.cos(0.06), point.y);
    const crack = 1 - smooth(0, 0.07, Math.abs(fbm(point.x * 7 + point.y * 3, point.z * 7 - point.y * 2, seed + 71, 3)));
    const dead = ASH.copy(ASH_LOW).lerp(ASH_HIGH, smooth(-0.1, 0.4, height)).lerp(EMBER, crack * 0.85);
    tone.lerp(dead, 1 - alive);
    colours.set([tone.r, tone.g, tone.b], v * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const glowing = scenery.liquid.glows ? mix(scenery.liquid.colour, '#000000', 0.85) : '#2a0a02';
  const material = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: SOFT_RAMP, fog: false, emissive: glowing });
  const ball = new THREE.Mesh(geometry, material);
  const air = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.018, 64, 32), new THREE.ShaderMaterial({
    uniforms: { glow: { value: colour(mix(scenery.sky.horizon, '#ffffff', 0.15)) } },
    vertexShader: 'varying vec3 vNormal; varying vec3 vView; void main() { vec4 world = modelMatrix * vec4(position, 1.0); vNormal = normalize(mat3(modelMatrix) * normal); vView = normalize(cameraPosition - world.xyz); gl_Position = projectionMatrix * viewMatrix * world; }',
    fragmentShader: 'uniform vec3 glow; varying vec3 vNormal; varying vec3 vView; void main() { float rim = pow(1.0 - abs(dot(vNormal, vView)), 5.0); gl_FragColor = vec4(glow * rim * 1.6, rim); }',
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  }));
  const group = new THREE.Group();
  group.name = 'globe';
  ball.frustumCulled = false;
  air.frustumCulled = false;
  group.add(ball, air);
  return group;
}

// --- The wasteland: seas of lava and columns of smoke -----------------------------------

/** Past the valley, the low ground has turned to lava: a glowing sheet over the water. */
function lavaSea(scenery: PlanetScenery, radius: { value: number }): THREE.Mesh {
  const geometry = new THREE.RingGeometry(LAST_VALLEY.inner + 60, HALF - 1200, 120, 6).rotateX(-Math.PI / 2);
  const sea = new THREE.Mesh(geometry, paint(radius, { colour: '#ff5a1f', emissive: '#ff3a0c', emissiveIntensity: 0.85, rim: 0.3 }));
  sea.name = 'lava-sea';
  sea.position.y = scenery.liquid.level + 0.4;
  sea.frustumCulled = false;
  return sea;
}

const PLUMES = { wasteland: 120, valley: 36, puffs: 7, rise: 420 };

/**
 * Columns of smoke over the burning land, each over a glowing fire. Those in
 * the valley only show when it burns too, at the end.
 */
class SmokeField {
  readonly group = new THREE.Group();
  private readonly smoke: THREE.InstancedMesh;
  private readonly fires: THREE.InstancedMesh;
  private readonly spots: { x: number; y: number; z: number; size: number; phase: number; valley: boolean }[] = [];
  private burning = 0;

  constructor(ground: (x: number, z: number) => number, scenery: PlanetScenery, seed: number, radius: { value: number }) {
    const level = scenery.liquid.level;
    let n = 0;
    const next = () => hash2(n * 31, n++ * 17, seed + 919);
    const add = (count: number, near: number, far: number, valley: boolean) => {
      for (let k = 0; k < count; k++) {
        const angle = next() * Math.PI * 2;
        const reach = near + (far - near) * Math.sqrt(next());
        const x = Math.sin(angle) * reach;
        const z = Math.cos(angle) * reach;
        this.spots.push({ x, y: Math.max(level, ground(x, z)), z, size: 0.6 + next() * 0.9, phase: next(), valley });
      }
    };
    add(PLUMES.wasteland, LAST_VALLEY.outer - 20, HALF - 1800, false);
    add(PLUMES.valley, 90, LAST_VALLEY.inner - 120, true);
    const count = this.spots.length;
    this.smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), paint(radius, { colour: '#4a3c3a', opacity: 0.62, rim: 0.15 }), count * PLUMES.puffs);
    this.fires = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), paint(radius, { colour: '#ff7a2a', emissive: '#ff5a1a', emissiveIntensity: 1, rim: 0 }), count);
    for (const mesh of [this.smoke, this.fires]) {
      mesh.frustumCulled = false;
      this.group.add(mesh);
    }
    const tint = new THREE.Color();
    for (let i = 0; i < count * PLUMES.puffs; i++) this.smoke.setColorAt(i, tint.setScalar(0.55 + 0.45 * hash2(i, 3, seed)));
  }

  /** How much the valley burns too, from 0 to 1. */
  burn(amount: number): void {
    this.burning = amount;
  }

  update(seconds: number): void {
    const matrix = new THREE.Matrix4();
    const place = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    this.spots.forEach((spot, k) => {
      const shown = spot.valley ? this.burning : 1;
      for (let p = 0; p < PLUMES.puffs; p++) {
        const t = (seconds * 0.05 + spot.phase + p / PLUMES.puffs) % 1;
        const size = (20 + t * 95) * spot.size * shown;
        place.set(spot.x + Math.sin(t * 5 + k) * 12 * t, spot.y + 10 + t * PLUMES.rise * spot.size, spot.z + t * 40);
        matrix.compose(place, turn, scale.setScalar(Math.max(0.001, size * (1 - t * 0.35))));
        this.smoke.setMatrixAt(k * PLUMES.puffs + p, matrix);
      }
      const flicker = (0.85 + 0.25 * Math.sin(seconds * 7 + k * 1.7)) * 26 * spot.size * shown;
      matrix.compose(place.set(spot.x, spot.y + 2, spot.z), turn, scale.set(flicker * 1.6, Math.max(0.001, flicker * 0.7), flicker * 1.6));
      this.fires.setMatrixAt(k, matrix);
    });
    this.smoke.instanceMatrix.needsUpdate = true;
    this.fires.instanceMatrix.needsUpdate = true;
  }
}

// --- All of it -------------------------------------------------------------------

export interface PlanetWorld {
  /** Add it to the scene. */
  group: THREE.Group;
  /** The planet's look, in the cartoon's colours. */
  scenery: PlanetScenery;
  /** Height of the land, for the flight. */
  ground: (x: number, z: number) => number;
  /**
   * Height of the land as it is drawn: the flat triangles between the
   * points of the land, which on rolling ground can sit a little over or
   * under `ground`. What walks or lands near the camera stands on this.
   */
  surface: (x: number, z: number) => number;
  /**
   * Call once a frame with where the camera and the ship are, how far into
   * space the ship is (0 on the ground, 1 at the ceiling) and the time.
   */
  update(camera: THREE.Camera, ship: THREE.Vector3Like, out: number, seconds: number): void;
  /** The colour of the air where the camera is: for the fog and the background. Out in the wasteland it is smoke. */
  haze(out: number, x?: number, z?: number): THREE.Color;
  /** Where the dungeons, the village, the camps, the beacons, the chests and the shards are. */
  features: PlanetFeatures;
  /** The dirt paths between them. */
  paths: PlanetPaths;
  /** Whether a circle at a point runs into a tree trunk. */
  blocked(x: number, z: number, radius: number): boolean;
  /** Whether a point is inside a tree's crown. */
  inCrown(x: number, y: number, z: number): boolean;
  /** A placed thing, by kind ('gate', 'beacon', 'chest', 'folk', 'shard') and number. */
  item(kind: string, index: number): THREE.Object3D | undefined;
  /** Plays a clip on a placed thing: 'Open' on a chest, 'Talk' on one of the folk. */
  play(kind: string, index: number, clip: string, once?: boolean): void;
  /** 0 in the last valley, 1 in the burning wasteland beyond it. */
  wasteland: (x: number, z: number) => number;
  /** The end of the world: 0 as it is, 1 all burnt, the valley too. */
  burn(amount: number): void;
  /** The ball of the planet, for the end. */
  globe: THREE.Object3D;
  /** Holds the ball under the valley instead of under the camera, and shows or hides the land. */
  hold(globeStill: boolean, landShown: boolean): void;
}

export function planetWorld(planet: Planet): PlanetWorld {
  const scenery = styled(planetScenery(planet));
  const ground = planetGround(planet);
  const seed = nameSeed(planet.name ?? 'neutral');
  // The land curves like the globe, so it meets the ball at its edge.
  const radius = { value: scenery.globeRadius };
  const level = scenery.liquid.level;
  const dead = wasteland(planet);
  const near = new LandPatch(ground, scenery, seed, radius, { ...NEAR, lag: 6, rim: [0.86, 1], sinkTo: (height) => height - 80, under: 0, hole: 0 }, dead);
  const far = new LandPatch(ground, scenery, seed, radius, { ...FAR, lag: 5, rim: [0.66, 0.97], sinkTo: () => level - SUNK, under: 1.5, hole: HOLE }, dead);
  const liquid = liquidSheet(scenery, radius);
  const props = new PropField(planet, ground, scenery, radius);
  const clouds = new CloudField(scenery, seed, radius);
  const sky = skyDome(scenery);
  const ball = globe(scenery, seed);
  const group = new THREE.Group();
  group.name = 'planet';
  const flora = new FloraField(planet, ground, scenery, radius);
  const features = planetFeatures(planet, ground);
  const paths = planetPaths(planet, features);
  const grass = new GrassField(ground, scenery, seed, radius, paths, dead);
  const smoke = new SmokeField(ground, scenery, seed, radius);
  const lava = lavaSea(scenery, radius);
  const forest = new ForestField(planet, ground, scenery, radius, seed, paths);
  const landmarks = new Landmarks(planet, ground, radius);
  group.add(sky, near.mesh, far.mesh, liquid, props.group, flora.group, grass.mesh, forest.group, pathRibbons(paths, ground, scenery.liquid.level, radius), landmarks.group, landingPad(radius), ball, clouds.mesh, lava, smoke.group);
  // The end of the world: every material darkens to char and glows like embers.
  const burnable: { material: THREE.Material & { color?: THREE.Color; emissive?: THREE.Color }; color?: THREE.Color; emissive?: THREE.Color }[] = [];
  const CHAR = colour('#2a1210');
  const FIRE = colour('#ff4a14');
  let globeStill = false;
  let before = 0;
  const horizon = colour(scenery.sky.horizon);
  const space = colour(scenery.sky.space);
  const lavaGlow = colour(scenery.liquid.colour);
  const ember = colour('#ff5a2a');

  return {
    group,
    scenery,
    ground,
    surface: (x, z) => drawnSurface(ground, x, z),
    update(camera, ship, out, seconds) {
      near.follow(camera.position.x, camera.position.z);
      far.follow(camera.position.x, camera.position.z);
      props.follow(ship.x, ship.z);
      clouds.follow(ship.x, ship.z);
      flora.follow(camera.position.x, camera.position.z);
      const above = camera.position.y - ground(camera.position.x, camera.position.z);
      grass.follow(camera.position.x, camera.position.z, above, seconds);
      forest.follow(camera.position.x, camera.position.z, above);
      landmarks.update(camera, Math.min(0.1, Math.max(0, seconds - before)));
      before = seconds;
      liquid.position.set(Math.round(camera.position.x / FAR.cell) * FAR.cell, scenery.liquid.level, Math.round(camera.position.z / FAR.cell) * FAR.cell);
      sky.position.copy(camera.position);
      (sky.material as THREE.ShaderMaterial).uniforms.airOut.value = out;
      // The ball sits just under the lowest land, below the camera. On the
      // ground the land hides it; it shows as the ship climbs.
      smoke.update(seconds);
      if (globeStill) {
        ball.position.set(0, scenery.liquid.level - 30 - scenery.globeRadius, 0);
        ball.rotation.set(0, 0, 0);
      } else {
        ball.position.set(camera.position.x, scenery.liquid.level - 30 - scenery.globeRadius, camera.position.z);
        // Turned so the living valley stays where it is on the ball.
        ball.rotation.set(-camera.position.z / scenery.globeRadius, 0, camera.position.x / scenery.globeRadius);
        ball.visible = out > 0.02;
      }
      if (scenery.liquid.glows) {
        const material = liquid.material as THREE.MeshToonMaterial;
        material.emissiveIntensity = 0.75 + 0.15 * Math.sin(seconds * 1.7);
        material.emissive.copy(lavaGlow);
      }
    },
    haze(out, x = 0, z = 0) {
      // A dying world: the air is tinged with the fires past the mountains,
      // and out in the wasteland it is thick, dark smoke.
      return horizon.clone().lerp(ember, 0.22).lerp(SMOKE, dead(x, z) * 0.75).lerp(space, out);
    },
    wasteland: dead,
    globe: ball,
    hold(still, landShown) {
      globeStill = still;
      if (still) ball.visible = true;
      for (const child of group.children) if (child !== sky && child !== ball) child.visible = landShown;
    },
    burn(amount) {
      if (burnable.length === 0) {
        group.traverse((object) => {
          if (object === sky || !(object instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            const m = material as THREE.Material & { color?: THREE.Color; emissive?: THREE.Color };
            if (burnable.some((entry) => entry.material === m)) continue;
            burnable.push({ material: m, color: m.color?.clone(), emissive: m.emissive?.clone() });
          }
        });
      }
      for (const entry of burnable) {
        if (entry.color && entry.material.color) entry.material.color.copy(entry.color).lerp(CHAR, amount * 0.85);
        if (entry.emissive && entry.material.emissive) entry.material.emissive.copy(entry.emissive).lerp(FIRE, amount * 0.55);
      }
      smoke.burn(amount);
      (sky.material as THREE.ShaderMaterial).uniforms.burn.value = amount;
    },
    features: landmarks.features,
    paths,
    blocked: (x, z, r) => forest.blocked(x, z, r),
    inCrown: (x, y, z) => forest.inCrown(x, y, z),
    item: (kind, index) => landmarks.items.get(`${kind}:${index}`)?.object,
    play(kind, index, name, once = false) {
      const item = landmarks.items.get(`${kind}:${index}`);
      const clip = item?.clips.find((candidate) => candidate.name === name);
      if (!item || !clip) return;
      item.mixer.stopAllAction();
      const action = item.mixer.clipAction(clip).reset();
      action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = once;
      action.play();
    },
  };
}
