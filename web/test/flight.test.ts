import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMERA, restCamera, stepCamera } from '../src/content/chase-camera.ts';
import { NO_INPUT, TUNING, altitude, forward, landedAt, stepFlight, thrusters } from '../src/content/flight.ts';
import type { FlightInput, FlightState, FlightWorld } from '../src/content/flight.ts';
import { EARTH_GRAVITY } from '../src/content/planet-physics.ts';

const flat = (gravityG = 1, ceiling = 1500): FlightWorld => ({ gravity: gravityG * EARTH_GRAVITY, ceiling, ground: () => 0 });
const hills: FlightWorld = { gravity: EARTH_GRAVITY, ceiling: 1500, ground: (x, z) => 40 + 30 * Math.sin(x / 90) * Math.cos(z / 70) };
const DT = 1 / 60;
const press = (input: Partial<FlightInput>): FlightInput => ({ ...NO_INPUT, ...input });

/** Flies for some seconds with the same input; `once` is asked on the first step only. */
function fly(state: FlightState, seconds: number, world: FlightWorld, input: Partial<FlightInput> = {}, once: Partial<FlightInput> = {}): FlightState {
  let current = stepFlight(state, press({ ...input, ...once }), DT, world);
  for (let t = DT; t < seconds; t += DT) current = stepFlight(current, press(input), DT, world);
  return current;
}

/** In the air, level, at hover height. */
function airborne(world: FlightWorld): FlightState {
  const state = fly(landedAt(0, 0, world), 4, world, {}, { toggleLanding: true });
  assert.equal(state.mode, 'flight');
  return state;
}

test('the ship sits still until asked to take off, then rises to hover height', () => {
  const world = flat();
  const parked = fly(landedAt(10, 20, world), 2, world, { throttle: 1, turn: 1 });
  assert.equal(parked.mode, 'landed');
  assert.deepEqual(parked.position, { x: 10, y: 0, z: 20 });
  const up = airborne(world);
  assert.ok(altitude(up, world) >= TUNING.hoverHeight, `only ${altitude(up, world)} m up`);
});

test('it flies where its nose points, and never faster than its top speed', () => {
  const world = flat();
  const cruising = fly(airborne(world), 8, world, { throttle: 1 });
  assert.ok(Math.abs(cruising.speed - TUNING.cruise) < 0.5, `cruising at ${cruising.speed}`);
  assert.ok(cruising.position.z > 300 && Math.abs(cruising.position.x) < 1e-6, 'it should have gone straight along +Z');
  const boosting = fly(cruising, 8, world, { throttle: 1, boost: true });
  assert.ok(Math.abs(boosting.speed - TUNING.boost) < 0.5, `boosting at ${boosting.speed}`);
  const easing = fly(boosting, 3, world, { throttle: 1 });
  assert.ok(easing.speed <= TUNING.cruise + 0.5, 'without boost it comes back to cruise speed');
  const stopped = fly(easing, 4, world, { throttle: -1 });
  assert.equal(stopped.speed, 0, 'braking stops it, and never sends it backwards');
});

test('it turns towards the side asked, banking into the turn', () => {
  const world = flat();
  const moving = fly(airborne(world), 3, world, { throttle: 1 });
  const right = fly(moving, 1, world, { throttle: 1, turn: 1 });
  assert.ok(right.yaw < moving.yaw && forward(right).x < 0, 'a right turn heads towards -X, the right of a ship that looks along +Z');
  assert.ok(right.roll < -0.3, `it should bank, roll is ${right.roll}`);
  const left = fly(moving, 1, world, { throttle: 1, turn: -1 });
  assert.ok(left.yaw > moving.yaw && left.roll > 0.3);
  const straight = fly(right, 1, world, { throttle: 1 });
  assert.equal(straight.roll, 0, 'the bank comes back level');
});

test('the nose goes up and down within its limit, and comes back level by itself in the air', () => {
  const world = flat();
  const moving = fly(airborne(world), 3, world, { throttle: 1 });
  const climbing = fly(moving, 3, world, { throttle: 1, pitch: 1 });
  assert.ok(Math.abs(climbing.pitch - TUNING.maxPitch) < 1e-9);
  assert.ok(climbing.position.y > moving.position.y + 50, 'nose up at speed climbs');
  const levelled = fly(climbing, 3, world, { throttle: 1 });
  assert.equal(levelled.pitch, 0);
});

test('a heavier planet makes the ship slower to climb and quicker to sink', () => {
  const light = flat(0.57);
  const heavy = flat(1.1);
  assert.ok(thrusters(light).climb > thrusters(heavy).climb);
  assert.ok(thrusters(light).sink < thrusters(heavy).sink);
  const risen = (world: FlightWorld) => fly(airborne(world), 4, world, { lift: 1 }).position.y - airborne(world).position.y;
  assert.ok(risen(light) > risen(heavy) * 1.2, `${risen(light)} m on the light planet, ${risen(heavy)} m on the heavy one`);
  const takeoff = (world: FlightWorld) => {
    let state = stepFlight(landedAt(0, 0, world), press({ toggleLanding: true }), DT, world);
    let seconds = 0;
    while (state.mode === 'takeoff' && seconds < 10) {
      state = stepFlight(state, NO_INPUT, DT, world);
      seconds += DT;
    }
    return seconds;
  };
  assert.ok(takeoff(heavy) > takeoff(light), 'taking off takes longer on the heavy planet');
});

test('with nothing asked, the ship holds its height', () => {
  const world = flat();
  const before = fly(airborne(world), 2, world, { throttle: 1 });
  const after = fly(before, 5, world, { throttle: 1 });
  assert.ok(Math.abs(after.position.y - before.position.y) < 1e-6);
});

test('it never goes through the ground, over hills or diving at it', () => {
  let state = airborne(hills);
  for (let t = 0; t < 30; t += DT) {
    state = stepFlight(state, press({ throttle: 1, pitch: -1, lift: -1, turn: Math.sin(t) }), DT, hills);
    assert.ok(altitude(state, hills) >= TUNING.clearance - 1e-6, `at ${t.toFixed(2)} s the ship is ${altitude(state, hills)} m over the ground`);
  }
});

test('landing needs the ship to be low and slow, and says why when it is not', () => {
  const world = flat();
  const fast = fly(airborne(world), 4, world, { throttle: 1 });
  const refused = stepFlight(fast, press({ toggleLanding: true }), DT, world);
  assert.equal(refused.mode, 'flight');
  assert.match(refused.notice, /Too fast/);
  const high = fly(airborne(world), 5, world, { lift: 1 });
  const tooHigh = stepFlight(high, press({ toggleLanding: true }), DT, world);
  assert.equal(tooHigh.mode, 'flight');
  assert.match(tooHigh.notice, /Too high/);
  assert.equal(fly(tooHigh, TUNING.noticeTime + 0.1, world).notice, '', 'the notice goes away');
});

test('asked low and slow, it comes down by itself and ends up on the ground, level and still', () => {
  const slow = fly(fly(airborne(hills), 2, hills, { throttle: 1, turn: 1 }), 3, hills, { throttle: -1 });
  const landing = stepFlight(slow, press({ toggleLanding: true }), DT, hills);
  assert.equal(landing.mode, 'landing');
  const down = fly(landing, 6, hills);
  assert.equal(down.mode, 'landed');
  assert.equal(altitude(down, hills), 0);
  assert.deepEqual([down.speed, down.vertical, down.pitch, down.roll], [0, 0, 0, 0]);
});

test('a landing can be called off by pulling up', () => {
  const world = flat();
  const landing = stepFlight(airborne(world), press({ toggleLanding: true }), DT, world);
  assert.equal(landing.mode, 'landing');
  assert.equal(stepFlight(landing, press({ lift: 1 }), DT, world).mode, 'flight');
});

test('above the ceiling the ship is in space: faster, and with nothing to land on', () => {
  const world = flat(1, 400);
  const up = fly(airborne(world), 25, world, { throttle: 1, pitch: 1, lift: 1 });
  assert.equal(up.mode, 'space');
  const fast = fly(up, 6, world, { throttle: 1 });
  assert.ok(fast.speed > TUNING.boost, `in space it reaches ${fast.speed} m/s`);
  const refused = stepFlight(fast, press({ toggleLanding: true }), DT, world);
  assert.equal(refused.mode, 'space');
  assert.match(refused.notice, /Nothing to land on/);
});

test('coming back down, it is flying again, and sheds the speed it had in space', () => {
  const world = flat(1, 400);
  const up = fly(fly(airborne(world), 25, world, { throttle: 1, pitch: 1, lift: 1 }), 2, world, { throttle: 1 });
  let state = up;
  for (let t = 0; t < 60 && state.mode === 'space'; t += DT) state = stepFlight(state, press({ pitch: -1, lift: -1 }), DT, world);
  assert.equal(state.mode, 'flight');
  assert.ok(state.position.y < world.ceiling);
  assert.ok(fly(state, 4, world, { throttle: 1 }).speed <= TUNING.cruise + 0.5);
});

test('the same inputs always give the same flight', () => {
  const run = () => fly(fly(airborne(hills), 5, hills, { throttle: 1, turn: 0.4, pitch: 0.3 }), 3, hills, { throttle: 1, turn: -1, boost: true });
  assert.deepEqual(run(), run());
});

test('a long frame is cut short, so a stalled tab does not throw the ship away', () => {
  const world = flat();
  const moving = fly(airborne(world), 3, world, { throttle: 1 });
  const jumped = stepFlight(moving, press({ throttle: 1 }), 5, world);
  assert.ok(jumped.position.z - moving.position.z < TUNING.cruise * 0.11);
});

test('the camera rests behind and above the ship, looking ahead of it', () => {
  const world = flat();
  const ship = fly(airborne(world), 3, world, { throttle: 1 });
  const camera = restCamera(ship);
  assert.ok(camera.position.z < ship.position.z - CAMERA.distance, 'behind');
  assert.ok(camera.position.y > ship.position.y, 'above');
  assert.ok(camera.target.z > ship.position.z, 'looking ahead');
  assert.ok(camera.fov > CAMERA.fov, 'the view opens with speed');
  const turned = restCamera({ ...ship, yaw: Math.PI / 2 });
  assert.ok(turned.position.x < ship.position.x - CAMERA.distance, 'behind a ship heading +X is towards -X');
});

test('the camera catches up with the ship without snapping, and stays over the ground', () => {
  const ship = fly(airborne(hills), 3, hills, { throttle: 1 });
  let camera = restCamera(landedAt(0, 0, hills));
  const first = stepCamera(camera, ship, DT, hills);
  const gap = (c: typeof camera) => Math.hypot(c.position.x - restCamera(ship).position.x, c.position.z - restCamera(ship).position.z);
  assert.ok(gap(first) > 1, 'one frame is not enough to get there');
  for (let t = 0; t < 4; t += DT) {
    camera = stepCamera(camera, ship, DT, hills);
    assert.ok(camera.position.y >= hills.ground(camera.position.x, camera.position.z) + CAMERA.clearance - 1e-9);
  }
  assert.ok(gap(camera) < 0.05, `still ${gap(camera)} m away after 4 s`);
});
