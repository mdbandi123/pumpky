import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStatue } from '../public/web-ar/statue.js';

// Texture loading is stubbed only for the geometry test; browser tests load the real PNG.
const statue = await createStatue({ ...THREE, TextureLoader: class {
  async loadAsync() { return new THREE.Texture({ width: 985, height: 1596 }); }
} }, 'test.png');
const { group } = statue;
group.updateMatrixWorld(true);
const plinth = group.getObjectByName('statue-plinth');
const box = new THREE.Box3().setFromObject(plinth);
assert(Math.abs(box.min.z) < 1e-7, 'Plinth bottom must rest on the badge plane, not below it');
assert(Math.abs(box.max.z - 0.1) < 1e-7);
assert(box.max.x - box.min.x <= 1, 'Plinth footprint must fit within the badge width');
const facing = group.getObjectByName('statue-facing');
const feet = facing.getWorldPosition(new THREE.Vector3());
assert(Math.abs(feet.x) < 1e-7 && Math.abs(feet.y) < 1e-7 && Math.abs(feet.z - 0.1) < 1e-7,
  'Feet must sit at the centre of the plinth top');
const up = new THREE.Vector3(0, 1, 0).transformDirection(group.matrixWorld);
assert(up.distanceTo(new THREE.Vector3(0, 0, 1)) < 1e-7, 'Statue must rise along the badge normal');
const camera = new THREE.PerspectiveCamera();
for (const position of [[0, -3, 3], [3, 0, 3], [-3, 2, 3], [0, 0, 4]]) {
  camera.position.set(...position);
  statue.faceCamera(camera);
  group.updateMatrixWorld(true);
  const movedFeet = facing.getWorldPosition(new THREE.Vector3());
  assert(movedFeet.distanceTo(feet) < 1e-7, 'Facing camera must not move the feet off the badge');
  const raised = new THREE.Vector3(0, 1, 0).transformDirection(facing.matrixWorld);
  assert(raised.distanceTo(up) < 1e-7, 'Facing camera must not tip the statue over');
}
console.log('PASS: badge-plane grounding, upright tabletop orientation, and camera-facing feet pivot');
