import assert from 'node:assert/strict';
import { basketTransform, defaultCalibration, normalizeCalibration } from '../public/web-ar/basket-fit.js';

const baseline = basketTransform(1, defaultCalibration, 0.084);
assert.deepEqual(baseline.scale, [1, 1, 1]);
assert.deepEqual(baseline.rotation, [0, 0, 0]);
assert.deepEqual(baseline.position, [0, 0, -0.084]);
const edited = { width: 1.2, height: 0.8, depth: 1.5, offsetX: 0.01, offsetY: -0.005,
  offsetZ: 0.015, pitch: 15, yaw: -25, roll: 10 };
const world = basketTransform(1.1, edited, 0.084);
assert.deepEqual(world.rotation, [15, -25, 10]);
assert.deepEqual(world.scale, [1.1 * 1.2, 1.1 * 0.8, 1.1 * 1.5]);
assert.deepEqual(world.position, [0.01, -0.005, 0.015 - 0.084 * 1.1 * 1.5]);
const marker = basketTransform(1.1, edited, 0.084, 1 / 0.08);
for (const key of ['position', 'scale']) {
  marker[key].forEach((value, index) => assert(Math.abs(value * 0.08 - world[key][index]) < 1e-12));
}
assert.deepEqual(marker.rotation, world.rotation, 'Unit conversion must not change orientation');
assert.deepEqual(basketTransform(1, { yaw: 90 }, 0.084).position, baseline.position,
  'Turning must pivot at the basket centre, not swing around the marker');
assert.deepEqual(normalizeCalibration(null), defaultCalibration);
assert.deepEqual(normalizeCalibration({ width: NaN, pitch: '30' }), defaultCalibration);
assert.equal(normalizeCalibration({ width: 10 }).width, 2);
assert.equal(normalizeCalibration({ offsetX: -100 }).offsetX, -0.1);
assert.equal(normalizeCalibration({ roll: Infinity }).roll, 0);
assert.deepEqual(defaultCalibration, { width: 1, height: 1, depth: 1, offsetX: 0, offsetY: 0, offsetZ: 0,
  pitch: 0, yaw: 0, roll: 0 }, 'Normalization must not mutate defaults');
console.log('PASS: per-axis fit, marker/native unit conversion, centre pivot, and invalid-input bounds');
