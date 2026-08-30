import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ASSET_DIRECTORY = path.resolve("public/mall/ride-lab");
const AUTHORING_DIRECTORY = path.resolve("assets/authoring/ride-lab");
const EXPECTED_RUNTIME = {
  "styloo-simple-scooter.glb": "fba92c3768c82442aa2298413a52d560804d94ba76fa097e660d3c9034f51239",
  "streetwear-rider.glb": "37f3511e865a0c92ccbf479c64ba6c1c1b621b5061843814cad1ae30dde0818e",
  "scooter-booster-sticker.png": "00d2e0e085e7b5233584f10638d2018ec7980fa54e758c3babecb29c77e80819",
};
const EXPECTED_AUTHORING = {
  "kenney-runtime-rig.glb": "e3f7fc437cfbdda07236ddbc44e367cf8b8ae4bdf73c2dd718d6f301ff78d5e3",
  "kenney-runtime-rig.png": "cabeed9d1be58037cc1cf3e29fdb42a0cb6af15bebeed877c41a758a932d14f8",
};

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

const entries = (await readdir(ASSET_DIRECTORY)).sort();
assert.deepEqual(entries, Object.keys(EXPECTED_RUNTIME).sort(), "only curated runtime files may ship in the Ride Lab asset directory");

for (const [name, checksum] of Object.entries(EXPECTED_RUNTIME)) {
  const file = await readFile(path.join(ASSET_DIRECTORY, name));
  assert.equal(createHash("sha256").update(file).digest("hex"), checksum, `${name} checksum drifted from the reviewed output`);
  const budget = name === "styloo-simple-scooter.glb" ? 200_000 : 500_000;
  assert.ok((await stat(path.join(ASSET_DIRECTORY, name))).size < budget, `${name} exceeds its ${budget} byte transfer budget`);
}

for (const [name, checksum] of Object.entries(EXPECTED_AUTHORING)) {
  const file = await readFile(path.join(AUTHORING_DIRECTORY, name));
  assert.equal(createHash("sha256").update(file).digest("hex"), checksum, `${name} checksum drifted from the reviewed authoring reference`);
}

const scooter = parseGlbJson(await readFile(path.join(ASSET_DIRECTORY, "styloo-simple-scooter.glb")));
const scooterNodes = new Set(scooter.nodes.map((node) => node.name));
for (const name of ["wheelfront.001", "wheell  back", "wheelfront.002", "guide", "master"]) {
  assert.ok(scooterNodes.has(name), `scooter is missing movable node ${name}`);
}
assert.equal(scooter.images?.length ?? 0, 0, "scooter source textures must be removed before runtime");
assert.equal(scooter.textures?.length ?? 0, 0, "scooter source textures must be removed before runtime");
assert.ok(scooter.meshes.length <= 24);

const rider = parseGlbJson(await readFile(path.join(ASSET_DIRECTORY, "streetwear-rider.glb")));
const riderNodes = new Set(rider.nodes.map((node) => node.name));
for (const name of ["Hips", "Spine", "LeftArm", "LeftForeArm", "LeftHand", "RightArm", "RightForeArm", "RightHand"]) {
  assert.ok(riderNodes.has(name), `rider is missing articulation bone ${name}`);
}
assert.equal(rider.skins.length, 1);
assert.equal(rider.skins[0].joints.length, 45);
assert.equal(rider.animations?.length ?? 0, 0, "unused source animation clips must not ship");
assert.equal(rider.images?.length ?? 0, 0, "streetwear rider source textures must not ship");
assert.equal(rider.textures?.length ?? 0, 0, "streetwear rider source textures must not ship");

const provenance = await readFile(path.resolve("docs/assets/mall-asset-provenance.md"), "utf8");
for (const checksum of [...Object.values(EXPECTED_RUNTIME), ...Object.values(EXPECTED_AUTHORING)]) {
  assert.match(provenance, new RegExp(checksum));
}
assert.match(provenance, /ec3787de70fa2200256848d74201b10f6b6c3126594e9857bf989753312c2b84/);
assert.match(provenance, /fbx2gltf@0\.9\.7-p1/);
assert.match(provenance, /@gltf-transform\/core@4\.4\.2/);

console.log("curated rideLab vehicle asset verification passed");
