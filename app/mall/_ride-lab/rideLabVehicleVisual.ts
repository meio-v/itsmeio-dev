import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { createVehicleVisual, type VehicleVisual } from "../_runtime/vehicleVisual.ts";
import type { RideLabSnapshot } from "./rideLabTypes.ts";

const SCOOTER_URL = "/mall/ride-lab/styloo-simple-scooter.glb";
const RIDER_URL = "/mall/ride-lab/kenney-skater-male.glb";
const RIDER_TEXTURE_URL = "/mall/ride-lab/kenney-skater-male.png";

const FRONT_WHEEL_NODE = "wheelfront.001";
const REAR_WHEEL_NODE = "wheell  back";
const FRONT_ASSEMBLY_NODE = "wheelfront.002";
const HANDLEBAR_NODE = "guide";

export const RIDE_LAB_VEHICLE_ALIGNMENT = Object.freeze({
  scooterScale: 1.56 / 2.6811,
  scooterYOffset: 0.074,
  scooterZOffset: -0.177,
  riderScale: 0.48,
  seatAnchor: Object.freeze({ x: 0, y: 0.43, z: -0.24 }),
  leftHandAnchor: Object.freeze({ x: 0.265, y: 0.67, z: 0.28 }),
  rightHandAnchor: Object.freeze({ x: -0.265, y: 0.67, z: 0.28 }),
  leftGripOffset: Object.freeze({ x: 0.315, y: 0.225, z: -0.145 }),
  rightGripOffset: Object.freeze({ x: -0.315, y: 0.225, z: -0.145 }),
  leftFootAnchor: Object.freeze({ x: 0.19, y: 0.02, z: -0.34 }),
  rightFootAnchor: Object.freeze({ x: -0.19, y: 0.02, z: -0.34 }),
  wheelRadius: 0.33,
  maxVisualSteerRadians: 0.22,
});

export type RideLabVehiclePose = {
  frontSteerRadians: number;
  riderLeanRadians: number;
  leftElbowRadians: number;
  rightElbowRadians: number;
  elbowFlareRadians: number;
  leftElbowFlareRadians: number;
  rightElbowFlareRadians: number;
  shoulderYawRadians: number;
  headCounterLeanRadians: number;
  headTuckRadians: number;
};

export function advanceRiderBodySteer(current: number, target: number, delta: number) {
  const boundedCurrent = THREE.MathUtils.clamp(current, -1, 1);
  const boundedTarget = THREE.MathUtils.clamp(target, -1, 1);
  const engaging = Math.sign(boundedCurrent) === Math.sign(boundedTarget)
    && Math.abs(boundedTarget) > Math.abs(boundedCurrent);
  const response = engaging ? 1.8 : 1.2;
  return THREE.MathUtils.lerp(
    boundedCurrent,
    boundedTarget,
    1 - Math.exp(-response * Math.max(0, delta)),
  );
}

export function resolveRideLabVehiclePose(steer: number, preload: number, throttle = 0, bodySteer = steer): RideLabVehiclePose {
  const boundedSteer = THREE.MathUtils.clamp(steer, -1, 1);
  const boundedBodySteer = THREE.MathUtils.clamp(bodySteer, -1, 1);
  const boundedPreload = THREE.MathUtils.clamp(preload, 0, 1);
  const boundedThrottle = THREE.MathUtils.clamp(throttle, 0, 1);
  const rightTurn = Math.max(0, boundedSteer);
  const leftTurn = Math.max(0, -boundedSteer);
  const progressiveLean = Math.sign(boundedBodySteer) * Math.pow(Math.abs(boundedBodySteer), 1.6);
  const leftElbowFlareRadians = rightTurn * 0.5 + leftTurn * 0.12;
  const rightElbowFlareRadians = leftTurn * 0.5 + rightTurn * 0.12;
  return {
    frontSteerRadians: -boundedSteer * RIDE_LAB_VEHICLE_ALIGNMENT.maxVisualSteerRadians,
    riderLeanRadians: -progressiveLean * 0.14,
    leftElbowRadians: 0.72 + boundedSteer * 0.3 + boundedPreload * 0.08,
    rightElbowRadians: 0.72 - boundedSteer * 0.3 + boundedPreload * 0.08,
    elbowFlareRadians: Math.max(leftElbowFlareRadians, rightElbowFlareRadians),
    leftElbowFlareRadians,
    rightElbowFlareRadians,
    shoulderYawRadians: -boundedBodySteer * 0.12,
    headCounterLeanRadians: boundedBodySteer * 0.08,
    headTuckRadians: boundedThrottle * 0.26,
  };
}

export type ScooterMaterialRole = "ink" | "tire" | "mechanical" | "seat" | "cream" | "cyan" | "chrome" | "headlight" | "orange" | "red";

export type ScooterIsolatedPartRole = "tire" | "rim" | "axle" | "hub" | "headlight-lens" | "headlight-housing";

type ScooterGeometryIslandSignature = {
  vertexCount: number;
  localYCenter: number;
  localYSpan: number;
  maximumLocalXZRadius: number;
};

export const SCOOTER_ISOLATED_MESHES = Object.freeze({
  wheels: ["wheellowpoly.004", "wheellowpoly.005"] as const,
  headlight: "devantlowpoly.002",
});

const CURATED_ISLAND_SIGNATURES = Object.freeze({
  tire: Object.freeze({ vertexCount: 45, minimumRadius: 0.37, maximumRadius: 0.44 }),
  rim: Object.freeze({ vertexCounts: [4, 6] as const, minimumRadius: 0.29, maximumRadius: 0.31 }),
  axle: Object.freeze({ vertexCount: 57, minimumCenter: 0.08, maximumCenter: 0.09, minimumSpan: 0.03, maximumSpan: 0.04, minimumRadius: 0.11, maximumRadius: 0.12 }),
  hub: Object.freeze({ vertexCount: 112, maximumCenter: 0.01, minimumSpan: 0.18, maximumSpan: 0.20, minimumRadius: 0.11, maximumRadius: 0.12 }),
  headlight: Object.freeze({ vertexCount: 120, minimumCenter: 0.35, maximumCenter: 0.36, minimumSpan: 0.22, maximumSpan: 0.24, minimumRadius: 0.12, maximumRadius: 0.14, housingNormalX: -0.65 }),
});

function normalizedMeshName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isBetween(value: number, minimum: number, maximum: number) {
  return value >= minimum && value <= maximum;
}

export function resolveScooterIsolatedPartRole(
  meshName: string,
  island: ScooterGeometryIslandSignature,
  faceNormalX?: number,
): ScooterIsolatedPartRole | null {
  const normalized = normalizedMeshName(meshName);
  const wheelNames = SCOOTER_ISOLATED_MESHES.wheels.map(normalizedMeshName);
  if (wheelNames.includes(normalized as (typeof wheelNames)[number])) {
    const radius = island.maximumLocalXZRadius;
    const absoluteCenter = Math.abs(island.localYCenter);
    const tire = CURATED_ISLAND_SIGNATURES.tire;
    if (island.vertexCount === tire.vertexCount && isBetween(radius, tire.minimumRadius, tire.maximumRadius)) return "tire";
    const rim = CURATED_ISLAND_SIGNATURES.rim;
    if (rim.vertexCounts.includes(island.vertexCount as (typeof rim.vertexCounts)[number]) && isBetween(radius, rim.minimumRadius, rim.maximumRadius)) return "rim";
    const axle = CURATED_ISLAND_SIGNATURES.axle;
    if (island.vertexCount === axle.vertexCount
      && isBetween(absoluteCenter, axle.minimumCenter, axle.maximumCenter)
      && isBetween(island.localYSpan, axle.minimumSpan, axle.maximumSpan)
      && isBetween(radius, axle.minimumRadius, axle.maximumRadius)) return "axle";
    const hub = CURATED_ISLAND_SIGNATURES.hub;
    if (island.vertexCount === hub.vertexCount
      && absoluteCenter <= hub.maximumCenter
      && isBetween(island.localYSpan, hub.minimumSpan, hub.maximumSpan)
      && isBetween(radius, hub.minimumRadius, hub.maximumRadius)) return "hub";
    return null;
  }
  const headlight = CURATED_ISLAND_SIGNATURES.headlight;
  if (normalized === normalizedMeshName(SCOOTER_ISOLATED_MESHES.headlight)
    && island.vertexCount === headlight.vertexCount
    && isBetween(island.localYCenter, headlight.minimumCenter, headlight.maximumCenter)
    && isBetween(island.localYSpan, headlight.minimumSpan, headlight.maximumSpan)
    && isBetween(island.maximumLocalXZRadius, headlight.minimumRadius, headlight.maximumRadius)) {
    return faceNormalX !== undefined && faceNormalX > headlight.housingNormalX ? "headlight-housing" : "headlight-lens";
  }
  return null;
}


export function resolveScooterMaterialRole(path: string): ScooterMaterialRole {
  const normalized = path.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^lowpolybase005/.test(normalized)) return "seat";
  if (/^derrierelowpoly/.test(normalized)) return "chrome";
  if (/^plane002|lumiererouge|rouge/.test(normalized)) return "red";
  if (/lumiereorange|orange/.test(normalized)) return "orange";
  if (/guidon/.test(normalized)) return "cyan";
  if (/wheellowpoly/.test(normalized)) return "tire";
  if (/echaplowpoly/.test(normalized)) return "chrome";
  if (/moteurlowpoly|ventilolowpoly/.test(normalized)) return "mechanical";
  if (/frein|retro|tapis|cube00[45]/.test(normalized)) return "ink";
  if (/devantroue|cylinder003|trucderriere|trucderrire|lowpolybase004/.test(normalized)) return "cream";
  if (/devant|derriere/.test(normalized)) return "cream";
  return "cream";
}

export function shouldOutlineScooterMesh(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /wheellowpoly|devantlowpoly|devantrouelowpoly|derrierelowpoly|lowpolybase00[45]|echaplowpoly|moteurlowpoly|ventilolowpoly|trucderrirerelowpoly/.test(normalized);
}

function isolatedPartMaterialRole(role: ScooterIsolatedPartRole): ScooterMaterialRole {
  if (role === "tire") return "tire";
  if (role === "hub") return "mechanical";
  if (role === "headlight-lens") return "headlight";
  return "chrome";
}

function isolateScooterMeshMaterials(mesh: THREE.Mesh): ScooterMaterialRole[] | null {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  const index = geometry.index;
  if (!position || !index) return null;

  const parent = Array.from({ length: position.count }, (_, vertex) => vertex);
  const find = (vertex: number): number => parent[vertex] === vertex
    ? vertex
    : (parent[vertex] = find(parent[vertex]));
  const join = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  for (let offset = 0; offset < index.count; offset += 3) {
    join(index.getX(offset), index.getX(offset + 1));
    join(index.getX(offset + 1), index.getX(offset + 2));
  }

  const islandVertices = new Map<number, Set<number>>();
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const root = find(vertex);
    const vertices = islandVertices.get(root) ?? new Set<number>();
    vertices.add(vertex);
    islandVertices.set(root, vertices);
  }
  const islandSignatures = new Map<number, ScooterGeometryIslandSignature>();
  for (const [root, vertices] of islandVertices) {
    let minimumLocalY = Infinity;
    let maximumLocalY = -Infinity;
    let maximumLocalXZRadius = 0;
    for (const vertex of vertices) {
      const x = position.getX(vertex);
      const y = position.getY(vertex);
      const z = position.getZ(vertex);
      minimumLocalY = Math.min(minimumLocalY, y);
      maximumLocalY = Math.max(maximumLocalY, y);
      maximumLocalXZRadius = Math.max(maximumLocalXZRadius, Math.hypot(x, z));
    }
    islandSignatures.set(root, {
      vertexCount: vertices.size,
      localYCenter: (minimumLocalY + maximumLocalY) / 2,
      localYSpan: maximumLocalY - minimumLocalY,
      maximumLocalXZRadius,
    });
  }

  const baseRole = resolveScooterMaterialRole(mesh.name);
  const indicesByRole = new Map<ScooterMaterialRole, number[]>();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const vertexA = new THREE.Vector3();
  const vertexB = new THREE.Vector3();
  const vertexC = new THREE.Vector3();
  let isolated = false;
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    vertexA.fromBufferAttribute(position, a);
    vertexB.fromBufferAttribute(position, b);
    vertexC.fromBufferAttribute(position, c);
    const faceNormalX = edgeA.subVectors(vertexB, vertexA).cross(edgeB.subVectors(vertexC, vertexA)).normalize().x;
    const partRole = resolveScooterIsolatedPartRole(mesh.name, islandSignatures.get(find(a))!, faceNormalX);
    isolated ||= partRole !== null;
    const materialRole = partRole === null ? baseRole : isolatedPartMaterialRole(partRole);
    const indices = indicesByRole.get(materialRole) ?? [];
    indices.push(a, b, c);
    indicesByRole.set(materialRole, indices);
  }
  if (!isolated) return null;

  const roles = [...indicesByRole.keys()];
  geometry.setIndex(roles.flatMap((role) => indicesByRole.get(role)!));
  geometry.clearGroups();
  let groupStart = 0;
  roles.forEach((role, materialIndex) => {
    const groupCount = indicesByRole.get(role)!.length;
    geometry.addGroup(groupStart, groupCount, materialIndex);
    groupStart += groupCount;
  });
  return roles;
}


export type RideLabVehicleMetrics = RideLabVehiclePose & {
  asset: "curated" | "procedural-fallback";
  handlebarSteerRadians: number;
  wheelSpinRadians: number;
  seatErrorMeters: number;
  leftHandErrorMeters: number;
  rightHandErrorMeters: number;
  leftHandPosition: { x: number; y: number; z: number };
  rightHandPosition: { x: number; y: number; z: number };
};

export type RideLabVehicleVisual = VehicleVisual & {
  readonly asset: RideLabVehicleMetrics["asset"];
  update(snapshot: RideLabSnapshot, delta: number): RideLabVehicleMetrics;
};

type BonePose = { bone: THREE.Bone; rest: THREE.Quaternion };

function requiredObject(root: THREE.Object3D, name: string) {
  const normalizedName = name.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const object = root.getObjectByName(name) ?? (() => {
    let match: THREE.Object3D | undefined;
    root.traverse((candidate) => {
      if (candidate.name.replace(/[^a-z0-9]/gi, "").toLowerCase() === normalizedName) match ??= candidate;
    });
    return match;
  })();
  if (!object) throw new Error(`Curated Ride Lab asset is missing required node: ${name}`);
  return object;
}

function createCelGradient() {
  const gradient = new THREE.DataTexture(new Uint8Array([
    0, 0, 0, 255,
    2, 2, 2, 255,
    40, 40, 40, 255,
    210, 210, 210, 255,
  ]), 4, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

function toonMaterial(color: number, gradientMap: THREE.Texture) {
  return new THREE.MeshToonMaterial({ color, gradientMap });
}

function createGlowTexture() {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const distance = Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2) / (size / 2);
      const alpha = Math.max(0, 1 - distance);
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = Math.round(alpha * alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function outlineMaterial(extrusion: number, cacheKey: string) {
  const material = new THREE.MeshToonMaterial({
    color: 0x08070c,
    side: THREE.BackSide,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `transformed += objectNormal * ${extrusion};\n#include <project_vertex>`,
    );
  };
  material.customProgramCacheKey = () => cacheKey;
  return material;
}

function captureBone(root: THREE.Object3D, name: string): BonePose {
  const bone = requiredObject(root, name);
  if (!(bone instanceof THREE.Bone)) throw new Error(`Curated rider node is not a bone: ${name}`);
  return { bone, rest: bone.quaternion.clone() };
}

function applyBonePose(pose: BonePose, rotation: THREE.Euler) {
  pose.bone.quaternion.copy(pose.rest).multiply(new THREE.Quaternion().setFromEuler(rotation));
}

function solveChain(
  root: THREE.Object3D,
  chain: THREE.Bone[],
  effector: THREE.Bone,
  target: THREE.Vector3,
  passes = 4,
) {
  const jointPosition = new THREE.Vector3();
  const effectorPosition = new THREE.Vector3();
  const toEffector = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const worldCorrection = new THREE.Quaternion();
  const parentWorld = new THREE.Quaternion();
  const boneWorld = new THREE.Quaternion();

  for (let pass = 0; pass < passes; pass += 1) {
    for (const bone of chain) {
      root.updateMatrixWorld(true);
      bone.getWorldPosition(jointPosition);
      effector.getWorldPosition(effectorPosition);
      toEffector.copy(effectorPosition).sub(jointPosition).normalize();
      toTarget.copy(target).sub(jointPosition).normalize();
      if (toEffector.lengthSq() === 0 || toTarget.lengthSq() === 0) continue;
      worldCorrection.setFromUnitVectors(toEffector, toTarget);
      bone.getWorldQuaternion(boneWorld);
      worldCorrection.multiply(boneWorld);
      bone.parent?.getWorldQuaternion(parentWorld);
      bone.quaternion.copy(parentWorld.invert().multiply(worldCorrection)).normalize();
    }
  }
}

function worldAnchor(parent: THREE.Object3D, anchor: Readonly<{ x: number; y: number; z: number }>) {
  return parent.localToWorld(new THREE.Vector3(anchor.x, anchor.y, anchor.z));
}

async function createCuratedVehicleVisual(): Promise<RideLabVehicleVisual> {
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  const [scooterGltf, riderGltf, riderTexture] = await Promise.all([
    loader.loadAsync(SCOOTER_URL),
    loader.loadAsync(RIDER_URL),
    textureLoader.loadAsync(RIDER_TEXTURE_URL),
  ]);

  riderTexture.colorSpace = THREE.SRGBColorSpace;
  riderTexture.flipY = false;
  riderTexture.magFilter = THREE.NearestFilter;
  const celGradient = createCelGradient();

  const root = new THREE.Group();
  root.name = "ride-lab-curated-vehicle";
  const lean = new THREE.Group();
  lean.name = "ride-lab-vehicle-lean";
  root.add(lean);
  const body = new THREE.Group();
  body.name = "ride-lab-sprung-body";
  lean.add(body);

  const scooter = scooterGltf.scene;
  scooter.name = "styloo-simple-scooter";
  scooter.scale.setScalar(RIDE_LAB_VEHICLE_ALIGNMENT.scooterScale);
  scooter.rotation.y = Math.PI / 2;
  scooter.position.set(0, RIDE_LAB_VEHICLE_ALIGNMENT.scooterYOffset, RIDE_LAB_VEHICLE_ALIGNMENT.scooterZOffset);
  body.add(scooter);

  const frontWheelSource = requiredObject(scooter, FRONT_WHEEL_NODE);
  const rearWheelSource = requiredObject(scooter, REAR_WHEEL_NODE);
  const frontAssembly = requiredObject(scooter, FRONT_ASSEMBLY_NODE);
  const handlebar = requiredObject(scooter, HANDLEBAR_NODE);
  const frontSteer = new THREE.Group();
  frontSteer.name = "curated-front-wheel-steer";
  frontSteer.position.set(0, -0.33, 0.78);
  const frontWheel = new THREE.Group();
  frontWheel.name = "curated-front-wheel-spin";
  frontSteer.add(frontWheel);
  const rearWheel = new THREE.Group();
  rearWheel.name = "curated-rear-wheel-spin";
  rearWheel.position.set(0, -0.33, -0.78);
  const forkSteer = new THREE.Group();
  forkSteer.name = "curated-front-fork-steer";
  forkSteer.position.set(0, 0.053, 0.663);
  body.add(forkSteer);
  const handlebarSteer = new THREE.Group();
  handlebarSteer.name = "curated-handlebar-steer";
  handlebarSteer.position.set(0, 0.497, 0.411);
  body.add(handlebarSteer);
  lean.add(frontSteer, rearWheel);
  root.updateMatrixWorld(true);
  frontWheel.attach(frontWheelSource);
  rearWheel.attach(rearWheelSource);
  forkSteer.attach(frontAssembly);
  handlebarSteer.attach(handlebar);

  const scooterPalette = {
    ink: toonMaterial(0x171321, celGradient),
    tire: toonMaterial(0x09080d, celGradient),
    mechanical: toonMaterial(0x41444d, celGradient),
    seat: toonMaterial(0x322e3a, celGradient),
    cream: toonMaterial(0xa6dc6f, celGradient),
    cyan: toonMaterial(0x45dfe3, celGradient),
    chrome: toonMaterial(0xd9edf0, celGradient),
    headlight: new THREE.MeshToonMaterial({
      color: 0xfff1c7,
      emissive: 0x5c431d,
      emissiveIntensity: 0.28,
      gradientMap: celGradient,
    }),
    orange: toonMaterial(0xff8a4c, celGradient),
    red: new THREE.MeshToonMaterial({
      color: 0xff365e,
      emissive: 0x7a071f,
      emissiveIntensity: 0.45,
      gradientMap: celGradient,
    }),
  };
  const scooterMaterials = new Set<THREE.Material>(Object.values(scooterPalette));
  const scooterOutlineMaterial = outlineMaterial(0.024, "ride-lab-scooter-outline-v5");
  scooterMaterials.add(scooterOutlineMaterial);
  const replacedScooterMaterials = new Set<THREE.Material>();
  const scooterMeshes: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    scooterMeshes.push(object);
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of sourceMaterials) replacedScooterMaterials.add(material);
    const isolatedRoles = isolateScooterMeshMaterials(object);
    object.material = isolatedRoles
      ? isolatedRoles.map((role) => scooterPalette[role])
      : scooterPalette[resolveScooterMaterialRole(object.name)];
    object.castShadow = true;
    object.receiveShadow = true;
  });
  for (const mesh of scooterMeshes.filter((candidate) => shouldOutlineScooterMesh(candidate.name))) {
    const outline = mesh.clone(false);
    outline.name = `${mesh.name}-cel-outline`;
    outline.material = scooterOutlineMaterial;
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.renderOrder = -1;
    mesh.parent?.add(outline);
  }
  const tailLamp = requiredObject(scooter, "petitelumiererouge.002");
  const tailGlowTexture = createGlowTexture();
  const tailGlowMaterial = new THREE.SpriteMaterial({
    map: tailGlowTexture,
    color: 0xff365e,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const tailGlow = new THREE.Sprite(tailGlowMaterial);
  tailGlow.name = "ride-lab-tail-lamp-glow";
  tailGlow.scale.setScalar(0.22);
  if (tailLamp instanceof THREE.Mesh) {
    tailLamp.geometry.computeBoundingSphere();
    tailGlow.position.copy(tailLamp.geometry.boundingSphere?.center ?? new THREE.Vector3());
  }
  tailLamp.add(tailGlow);
  scooterMaterials.add(tailGlowMaterial);
  for (const material of replacedScooterMaterials) material.dispose();

  const rider = riderGltf.scene;
  rider.name = "kenney-skater-male-rider";
  const riderMaterial = new THREE.MeshToonMaterial({ color: 0xffffff, map: riderTexture, gradientMap: celGradient });
  const riderMeshes: THREE.SkinnedMesh[] = [];
  const replacedRiderMaterials = new Set<THREE.Material>();
  rider.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object instanceof THREE.SkinnedMesh) riderMeshes.push(object);
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of sourceMaterials) replacedRiderMaterials.add(material);
    object.material = riderMaterial;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  for (const material of replacedRiderMaterials) material.dispose();
  const riderOutlineMaterial = outlineMaterial(0.0002695, "ride-lab-rider-outline-v5");
  for (const mesh of riderMeshes) {
    const outline = mesh.clone(false);
    outline.name = `${mesh.name}-cel-outline`;
    outline.material = riderOutlineMaterial;
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.renderOrder = -1;
    mesh.parent?.add(outline);
  }
  const riderPlacement = new THREE.Group();
  riderPlacement.name = "curated-rider-placement";
  riderPlacement.scale.setScalar(RIDE_LAB_VEHICLE_ALIGNMENT.riderScale);
  riderPlacement.rotation.x = 0.72;
  riderPlacement.add(rider);
  body.add(riderPlacement);

  const hips = captureBone(rider, "Hips");
  const spine = captureBone(rider, "Spine");
  const chest = captureBone(rider, "Chest");
  const head = captureBone(rider, "Head");
  const leftArm = captureBone(rider, "LeftArm");
  const leftForeArm = captureBone(rider, "LeftForeArm");
  const leftHand = captureBone(rider, "LeftHand");
  const rightArm = captureBone(rider, "RightArm");
  const rightForeArm = captureBone(rider, "RightForeArm");
  const rightHand = captureBone(rider, "RightHand");
  const leftUpLeg = captureBone(rider, "LeftUpLeg");
  const leftLeg = captureBone(rider, "LeftLeg");
  const leftFoot = captureBone(rider, "LeftFoot");
  const rightUpLeg = captureBone(rider, "RightUpLeg");
  const rightLeg = captureBone(rider, "RightLeg");
  const rightFoot = captureBone(rider, "RightFoot");

  root.updateMatrixWorld(true);
  const hipsBeforeAlignment = hips.bone.getWorldPosition(new THREE.Vector3());
  const seatTarget = worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.seatAnchor);
  riderPlacement.position.add(seatTarget.sub(hipsBeforeAlignment));

  let wheelSpinRadians = 0;
  let presentedBodySteer = 0;
  let disposed = false;

  function update(snapshot: RideLabSnapshot, delta: number): RideLabVehicleMetrics {
    presentedBodySteer = advanceRiderBodySteer(presentedBodySteer, snapshot.intent.steer, delta);
    const pose = resolveRideLabVehiclePose(snapshot.intent.steer, snapshot.preload, snapshot.intent.throttle, presentedBodySteer);
    wheelSpinRadians = (wheelSpinRadians + snapshot.horizontalSpeedMps * Math.max(0, delta) / RIDE_LAB_VEHICLE_ALIGNMENT.wheelRadius) % (Math.PI * 2);
    frontWheel.rotation.x = wheelSpinRadians;
    frontSteer.rotation.y = pose.frontSteerRadians;
    rearWheel.rotation.x = wheelSpinRadians;
    forkSteer.rotation.y = pose.frontSteerRadians;
    handlebarSteer.rotation.y = pose.frontSteerRadians;

    applyBonePose(hips, new THREE.Euler(-0.08, 0, pose.riderLeanRadians));
    applyBonePose(spine, new THREE.Euler(-0.42, 0, pose.riderLeanRadians * 0.55));
    applyBonePose(chest, new THREE.Euler(-0.18, pose.shoulderYawRadians, pose.riderLeanRadians * 0.35));
    applyBonePose(head, new THREE.Euler(pose.headTuckRadians, 0, pose.headCounterLeanRadians));
    applyBonePose(leftArm, new THREE.Euler(-0.55, 0.2, -0.35 - pose.leftElbowFlareRadians));
    applyBonePose(rightArm, new THREE.Euler(-0.55, -0.2, 0.35 + pose.rightElbowFlareRadians));
    applyBonePose(leftForeArm, new THREE.Euler(pose.leftElbowRadians, 0, 0));
    applyBonePose(rightForeArm, new THREE.Euler(pose.rightElbowRadians, 0, 0));
    applyBonePose(leftUpLeg, new THREE.Euler(-1.08, 0.08, 0));
    applyBonePose(rightUpLeg, new THREE.Euler(-1.08, -0.08, 0));
    applyBonePose(leftLeg, new THREE.Euler(1.42, 0, 0));
    applyBonePose(rightLeg, new THREE.Euler(1.42, 0, 0));

    root.updateMatrixWorld(true);
    const leftHandTarget = worldAnchor(handlebarSteer, RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset);
    const rightHandTarget = worldAnchor(handlebarSteer, RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset);
    const leftFootTarget = worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.leftFootAnchor);
    const rightFootTarget = worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.rightFootAnchor);
    solveChain(root, [leftForeArm.bone, leftArm.bone], leftHand.bone, leftHandTarget, 6);
    solveChain(root, [rightForeArm.bone, rightArm.bone], rightHand.bone, rightHandTarget);
    solveChain(root, [leftLeg.bone, leftUpLeg.bone], leftFoot.bone, leftFootTarget, 2);
    solveChain(root, [rightLeg.bone, rightUpLeg.bone], rightFoot.bone, rightFootTarget, 2);
    root.updateMatrixWorld(true);

    const leftHandPosition = leftHand.bone.getWorldPosition(new THREE.Vector3());
    const rightHandPosition = rightHand.bone.getWorldPosition(new THREE.Vector3());
    return {
      ...pose,
      asset: "curated",
      handlebarSteerRadians: handlebarSteer.rotation.y,
      wheelSpinRadians,
      seatErrorMeters: hips.bone.getWorldPosition(new THREE.Vector3()).distanceTo(worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.seatAnchor)),
      leftHandErrorMeters: leftHandPosition.distanceTo(leftHandTarget),
      rightHandErrorMeters: rightHandPosition.distanceTo(rightHandTarget),
      leftHandPosition,
      rightHandPosition,
    };
  }

  return {
    root,
    lean,
    body,
    frontWheel,
    rearWheel,
    asset: "curated",
    update,
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set<THREE.BufferGeometry>();
      const skeletons = new Set<THREE.Skeleton>();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
        if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const skeleton of skeletons) skeleton.dispose();
      for (const material of scooterMaterials) material.dispose();
      riderMaterial.dispose();
      riderOutlineMaterial.dispose();
      riderTexture.dispose();
      tailGlowTexture.dispose();
      celGradient.dispose();
      root.removeFromParent();
      root.clear();
    },
  };
}

export function createFallbackVehicleVisual(): RideLabVehicleVisual {
  const fallback = createVehicleVisual();
  fallback.root.rotation.y = -Math.PI / 2;
  let wheelSpinRadians = 0;
  return {
    ...fallback,
    asset: "procedural-fallback",
    update(snapshot, delta) {
      const pose = resolveRideLabVehiclePose(snapshot.intent.steer, snapshot.preload, snapshot.intent.throttle);
      wheelSpinRadians = (wheelSpinRadians + snapshot.horizontalSpeedMps * Math.max(0, delta) / RIDE_LAB_VEHICLE_ALIGNMENT.wheelRadius) % (Math.PI * 2);
      fallback.frontWheel.rotation.y = pose.frontSteerRadians;
      fallback.frontWheel.children[0]?.rotation.set(Math.PI / 2, wheelSpinRadians, 0);
      fallback.rearWheel.children[0]?.rotation.set(Math.PI / 2, wheelSpinRadians, 0);
      return {
        ...pose,
        asset: "procedural-fallback",
        handlebarSteerRadians: pose.frontSteerRadians,
        wheelSpinRadians,
        seatErrorMeters: 0,
        leftHandErrorMeters: 0,
        rightHandErrorMeters: 0,
        leftHandPosition: { x: 0, y: 0, z: 0 },
        rightHandPosition: { x: 0, y: 0, z: 0 },
      };
    },
  };
}

export async function createRideLabVehicleVisual(): Promise<RideLabVehicleVisual> {
  try {
    return await createCuratedVehicleVisual();
  } catch (error) {
    console.error("Curated Ride Lab vehicle failed to load; using procedural fallback.", error);
    return createFallbackVehicleVisual();
  }
}
