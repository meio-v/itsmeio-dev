import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const runtimeDirectory = path.resolve("public/mall/ride-lab");
const riderPath = path.join(runtimeDirectory, "streetwear-rider.glb");
const expectedRiderChecksum = "37f3511e865a0c92ccbf479c64ba6c1c1b621b5061843814cad1ae30dde0818e";
const requiredMeshes = [
  "streetwear-body",
  "streetwear-head",
  "streetwear-hair",
  "streetwear-hoodie",
  "streetwear-undershirt",
  "streetwear-cargo-shorts",
  "streetwear-left-calf",
  "streetwear-right-calf",
  "streetwear-left-shoe-upper",
  "streetwear-left-sole",
  "streetwear-right-shoe-upper",
  "streetwear-right-sole",
];

function parseGlbJson(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "glTF");
  let offset = 12;
  while (offset < buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    if (type === 0x4e4f534a) return JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString().trim());
    offset += 8 + length;
  }
  assert.fail("GLB JSON chunk was not found");
}

const entries = await readdir(runtimeDirectory);
for (const name of entries) {
  assert.doesNotMatch(name, /\.(?:7z|blend|fbx|obj|zip)$/i, `${name} is an uncurated authoring payload in the runtime directory`);
}

const riderBuffer = await readFile(riderPath);
assert.equal(createHash("sha256").update(riderBuffer).digest("hex"), expectedRiderChecksum);
assert.ok((await stat(riderPath)).size < 500_000, "streetwear rider exceeds the 500 KB transfer ceiling");

const rider = parseGlbJson(riderBuffer);
const nodeNames = new Set(rider.nodes.map((node) => node.name));
for (const name of requiredMeshes) assert.ok(nodeNames.has(name), `streetwear rider is missing modular mesh ${name}`);
for (const name of ["Hips", "Spine", "Chest", "Head", "LeftHand", "RightHand", "LeftFoot", "RightFoot"]) {
  assert.ok(nodeNames.has(name), `streetwear rider is missing runtime bone ${name}`);
}
assert.equal(rider.skins?.length, 1);
assert.equal(rider.skins[0].joints.length, 45);
assert.equal(rider.animations?.length ?? 0, 0);
assert.equal(rider.images?.length ?? 0, 0);
assert.equal(rider.textures?.length ?? 0, 0);
assert.ok(rider.meshes.length <= 12, `streetwear rider has ${rider.meshes.length} meshes; expected at most 12 modular pieces`);

const accessors = rider.accessors ?? [];
const positionAccessors = new Set();
for (const mesh of rider.meshes) {
  for (const primitive of mesh.primitives) positionAccessors.add(primitive.attributes.POSITION);
}
const vertices = [...positionAccessors].reduce((total, index) => total + accessors[index].count, 0);
const triangles = rider.meshes.reduce((total, mesh) => total + mesh.primitives.reduce((meshTotal, primitive) => (
  meshTotal + (primitive.indices === undefined ? accessors[primitive.attributes.POSITION].count : accessors[primitive.indices].count) / 3
), 0), 0);
assert.ok(vertices <= 25_000, `streetwear rider has ${vertices} uploaded vertices; expected at most 25,000`);
assert.ok(triangles <= 50_000, `streetwear rider has ${triangles} triangles; expected at most 50,000`);

const provenance = await readFile(path.resolve("docs/assets/mall-asset-provenance.md"), "utf8");
assert.match(provenance, /89b885ce4acb7663c236d4602b4f6e44e3384e153049f897f9b383ceee16aacb/);
assert.match(provenance, /1c246e6c36ac070197756b141fd59cca472b50bbfaf471ea9de192d42505c26c/);
assert.match(provenance, /0e4c91dea3f687ecb1c2d74d5fdea130384df930b0c3be475cf256da92faedb7/);
assert.match(provenance, /Girush/);
assert.match(provenance, /CC0|public domain/);
assert.match(provenance, new RegExp(expectedRiderChecksum));

console.log("streetwear rider asset verification passed");
