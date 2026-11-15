// The end: she leaves with everything aboard, and the world ends behind
// her. The fires of the wasteland reach the last valley, the camera pulls
// back until the whole planet shows, it glows red and breaks apart. Then
// the end card.

import * as THREE from 'three';
import type { PlanetWorld } from '../models/planet-scene.ts';

export interface Ending {
  /** Advances the end; false once it is over. */
  update(dt: number): boolean;
}

interface Parts {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  world: PlanetWorld;
  ship: THREE.Object3D;
  /** A line of text over the picture, or '' to clear it. */
  caption(text: string): void;
  /** The screen fading to white (0 to 1). */
  whiteout(amount: number): void;
  onDone(): void;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const TIMES = { burn: 5, pull: 9.5, glow: 11.5, blast: 11.5, white: 16.5, done: 18 };

export function endOfTheWorld(parts: Parts): Ending {
  const { scene, camera, world, ship } = parts;
  const radius = world.scenery.globeRadius;
  const centre = new THREE.Vector3(0, world.scenery.liquid.level - 30 - radius, 0);
  const start = camera.position.clone();
  const shipStart = ship.position.clone();
  // First a look across the valley as it burns, from above its rim.
  const overlook = new THREE.Vector3(700, 520, 1150);
  const clouds = world.group.getObjectByName('clouds');
  if (clouds) clouds.visible = false;
  scene.fog = new THREE.Fog('#3a1a12', 1400, 9000);
  scene.background = new THREE.Color('#3a1a12');
  // Where the camera ends up: far above the valley, a little to one side.
  const away = new THREE.Vector3(0.35, 1, 0.55).normalize().multiplyScalar(radius * 3.6).add(centre);
  const ball = world.globe;
  const ballLook = (ball.children[0] as THREE.Mesh).material as THREE.MeshToonMaterial;
  const glowFrom = ballLook.emissive.clone();
  const glowTo = new THREE.Color('#ff3a0a');
  let time = 0;
  let pulled = false;
  let blasted = false;
  let finished = false;
  let said = '';
  const say = (text: string) => {
    if (text !== said) parts.caption(text);
    said = text;
  };

  // The blast: a flash, a ring and the pieces of the planet.
  const blast = new THREE.Group();
  const flash = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.MeshBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius * 1.12, 96), new THREE.MeshBasicMaterial({ color: '#ff8a3a', transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2 + 0.35;
  const pieces: { mesh: THREE.Mesh; velocity: THREE.Vector3; spin: THREE.Vector3 }[] = [];
  const rock = new THREE.MeshToonMaterial({ color: '#3a2420', emissive: '#ff4a14', emissiveIntensity: 0.6 });
  const shape = new THREE.IcosahedronGeometry(1, 0);
  for (let k = 0; k < 160; k++) {
    const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    const mesh = new THREE.Mesh(shape, rock);
    mesh.scale.setScalar(radius * (0.025 + Math.random() * 0.08));
    mesh.position.copy(direction).multiplyScalar(radius * (0.6 + Math.random() * 0.35));
    pieces.push({ mesh, velocity: direction.multiplyScalar(radius * (0.25 + Math.random() * 0.55)), spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(2) });
    blast.add(mesh);
  }
  blast.add(flash, ring);
  blast.position.copy(centre);
  blast.visible = false;
  scene.add(blast);

  return {
    update(dt) {
      if (finished) return false;
      time += dt;
      const burning = smooth(0, TIMES.burn, time);
      world.burn(burning);

      // 1. The fires reach the valley, seen from the ship as it climbs away.
      // 2. The camera pulls back until the whole planet shows.
      const pull = smooth(TIMES.burn - 0.5, TIMES.pull, time);
      ship.position.copy(shipStart).add(new THREE.Vector3(0, time * 60, 0));
      camera.position.copy(start).lerp(overlook, smooth(0, 1.6, time)).lerp(away, pull * pull);
      if (pull > 0.12 && !pulled) {
        pulled = true;
        world.hold(true, false);
        scene.fog = null;
        scene.background = new THREE.Color('#04050a');
        camera.far = radius * 40;
        camera.updateProjectionMatrix();
      }
      const look = new THREE.Vector3(0, 40, 0).lerp(centre, smooth(0.05, 0.5, pull));
      camera.lookAt(look);
      world.update(camera, ship.position, 1, time);

      // 3. It glows red, shakes, and breaks apart.
      const glow = smooth(TIMES.pull - 1, TIMES.glow, time);
      ballLook.emissive.copy(glowFrom).lerp(glowTo, glow);
      ballLook.emissiveIntensity = 1 + glow * 0.7 + Math.sin(time * 18) * 0.25 * glow;
      if (glow > 0) camera.position.add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), 0).multiplyScalar(radius * 0.01 * glow));
      if (time >= TIMES.blast && !blasted) {
        blasted = true;
        ball.visible = false;
        blast.visible = true;
      }
      if (blasted) {
        const since = time - TIMES.blast;
        flash.scale.setScalar(1 + since * 1.8);
        (flash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - since / 1.1) ** 2;
        ring.scale.setScalar(1 + since * 1.4);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - since / 4);
        rock.emissiveIntensity = Math.max(0.15, 1.4 - since * 0.3);
        for (const piece of pieces) {
          piece.mesh.position.addScaledVector(piece.velocity, dt);
          piece.mesh.rotation.x += piece.spin.x * dt;
          piece.mesh.rotation.y += piece.spin.y * dt;
        }
      }

      if (time < TIMES.burn) say('The fires of the wasteland reach the last valley.');
      else if (time < TIMES.blast) say('Behind her, TRAPPIST-1 e burns.');
      else say('Nothing is left of it. Everyone it had is aboard.');
      parts.whiteout(smooth(TIMES.white - 1.5, TIMES.white, time));
      if (time >= TIMES.done) {
        finished = true;
        say('');
        parts.onDone();
      }
      return !finished;
    },
  };
}
