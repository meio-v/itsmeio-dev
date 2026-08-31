import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function parseGlbJson(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  let offset = 12;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString().trim());
    offset += 8 + length;
  }
  assert.fail("GLB JSON chunk was not found.");
}

const riderBuffer = await readFile("assets/authoring/ride-lab/kenney-runtime-rig.glb");
const rider = parseGlbJson(riderBuffer);
const accessor = (index) => rider.accessors[index];
const primitives = rider.meshes.flatMap((mesh) => mesh.primitives);
const vertices = primitives.reduce((total, primitive) => total + accessor(primitive.attributes.POSITION).count, 0);
const triangles = primitives.reduce((total, primitive) => {
  assert.equal(primitive.mode ?? 4, 4, "baseline rider must use triangle primitives");
  const indexCount = primitive.indices === undefined
    ? accessor(primitive.attributes.POSITION).count
    : accessor(primitive.indices).count;
  return total + indexCount / 3;
}, 0);
const skinnedMeshNodes = rider.nodes.filter((node) => node.mesh !== undefined && node.skin !== undefined);
const nodeNames = new Set(rider.nodes.map((node) => node.name));

assert.equal(riderBuffer.length, 104_928);
assert.equal(rider.nodes.length, 61);
assert.equal(skinnedMeshNodes.length, 1);
assert.equal(skinnedMeshNodes[0].name, "characterMedium");
assert.equal(primitives.length, 1);
assert.equal(vertices, 1_029);
assert.equal(triangles, 1_604);
assert.equal(rider.materials.length, 1);
assert.equal(rider.skins.length, 1);
assert.equal(rider.skins[0].joints.length, 45);
assert.equal(rider.animations?.length ?? 0, 0);
for (const name of ["Hips", "Spine", "Chest", "Head", "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand", "LeftUpLeg", "LeftLeg", "LeftFoot", "RightUpLeg", "RightLeg", "RightFoot"]) {
  assert.ok(nodeNames.has(name), `baseline rider is missing ${name}`);
}

const runtime = await readFile("app/mall/_ride-lab/rideLabVehicleVisual.ts", "utf8");
assert.match(runtime, /riderScale: 0\.48/);
assert.match(runtime, /seatAnchor: Object\.freeze\(\{ x: 0, y: 0\.34, z: -0\.31 \}\)/);
assert.match(runtime, /pelvisAnchor: Object\.freeze\(\{ x: 0, y: 0\.43, z: -0\.31 \}\)/);
assert.match(runtime, /riderPlacement\.rotation\.x = 0\.72/);
assert.match(runtime, /captureBone\(rider, "Hips"\)/);
assert.match(runtime, /solveTwoBoneIK\(root, leftArm\.bone, leftForeArm\.bone, leftHand\.bone/);
assert.match(runtime, /solveTwoBoneIK\(root, leftUpLeg\.bone, leftLeg\.bone, leftFoot\.bone/);
assert.doesNotMatch(runtime, /AnimationMixer/);

const physics = await readFile("app/mall/_ride-lab/JoltRidePhysics.ts", "utf8");
assert.doesNotMatch(physics, /\.glb|SkinnedMesh|Object3D|THREE|kenney|streetwear/i, "physics must not depend on rider render geometry");

const note = await readFile("docs/design/ride-lab-rider-pipeline.md", "utf8");
for (const fact of ["1,029", "1,604", "45", "AnimationMixer", "root motion", "scale `0.48`", "X rotation `0.72`", "Girush", "geometry donors only"]) {
  assert.ok(note.includes(fact), `implementation note is missing baseline fact: ${fact}`);
}

console.log("streetwear rider baseline verification passed");
