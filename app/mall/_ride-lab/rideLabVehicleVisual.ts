import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  createProceduralVehicleVisual,
  type VehicleVisual,
} from "../_runtime/vehicleVisual.ts";
import type { RideLabSnapshot } from "./rideLabTypes.ts";

const SCOOTER_URL = "/mall/ride-lab/styloo-simple-scooter.glb";
const SCOOTER_BOOSTER_STICKER_URL = "/mall/ride-lab/scooter-booster-sticker.png";
const RIDER_URL = "/mall/ride-lab/streetwear-rider.glb";

const FRONT_WHEEL_NODE = "wheelfront.001";
const REAR_WHEEL_NODE = "wheell  back";
const FRONT_ASSEMBLY_NODE = "wheelfront.002";
const HANDLEBAR_NODE = "guide";

export const RIDE_LAB_VEHICLE_ALIGNMENT = Object.freeze({
  scooterScale: 1.56 / 2.6811,
  scooterYOffset: 0.074,
  scooterZOffset: -0.177,
  riderScale: 0.52,
  seatAnchor: Object.freeze({ x: 0, y: 0.34, z: -0.31 }),
  pelvisAnchor: Object.freeze({ x: 0, y: 0.43, z: -0.31 }),
  leftHandAnchor: Object.freeze({ x: 0.265, y: 0.67, z: 0.28 }),
  rightHandAnchor: Object.freeze({ x: -0.265, y: 0.67, z: 0.28 }),
  leftGripOffset: Object.freeze({ x: 0.315, y: 0.225, z: -0.145 }),
  rightGripOffset: Object.freeze({ x: -0.315, y: 0.225, z: -0.145 }),
  leftFootAnchor: Object.freeze({ x: 0.22, y: 0, z: 0.02 }),
  rightFootAnchor: Object.freeze({ x: -0.22, y: 0, z: 0.02 }),
  leftKneePole: Object.freeze({ x: 0.46, y: 0.22, z: 0.52 }),
  rightKneePole: Object.freeze({ x: -0.46, y: 0.22, z: 0.52 }),
  leftElbowPole: Object.freeze({ x: 0.48, y: 0.5, z: 0.02 }),
  rightElbowPole: Object.freeze({ x: -0.48, y: 0.5, z: 0.02 }),
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

const SCOOTER_EXACT_MATERIAL_ROLES = new Map<string, ScooterMaterialRole>(([
  ["SM_Scooter_SteeringNeck_LowerAdapter", "cream"],
  ["SM_Scooter_SteeringNeck_RootGasket", "ink"],
  ["SM_Scooter_SteeringNeck_FixedBearingHousing", "cream"],
  ["SM_Scooter_SteeringNeck_RotatingStem", "ink"],
  ["SM_Scooter_SteeringNeck_RotatingCollar", "ink"],
  ["SM_Scooter_SteeringNeck_UpperMount", "cream"],
  ["SM_Scooter_BrakeLever_R", "ink"],
  ["SM_Scooter_Handlebar_AccentRing_L", "cyan"],
  ["SM_Scooter_Handlebar_AccentRing_R", "cyan"],
  ["SM_Scooter_Handlebar_Bar_L", "mechanical"],
  ["SM_Scooter_Handlebar_Bar_R", "mechanical"],
  ["SM_Scooter_Handlebar_ControlPodSleeve_L", "ink"],
  ["SM_Scooter_Handlebar_ControlPodSleeve_R", "ink"],
  ["SM_Scooter_Handlebar_Grip_L", "ink"],
  ["SM_Scooter_Handlebar_Grip_R", "ink"],
  ["SM_Scooter_Handlebar_Sleeve_L", "ink"],
  ["SM_Scooter_Handlebar_Sleeve_R", "ink"],
  ["SM_Scooter_Headlamp_Bezel", "ink"],
  ["SM_Scooter_Headlamp_Cross", "chrome"],
  ["SM_Scooter_Headlamp_Lens", "headlight"],
  ["SM_Scooter_Headlamp_Reflector", "chrome"],
  ["SM_Scooter_SteeringNacelle_Pod_L", "cream"],
  ["SM_Scooter_SteeringNacelle_Pod_R", "cream"],
  ["SM_Scooter_SteeringNacelle_RearFastener_L_Hi", "chrome"],
  ["SM_Scooter_SteeringNacelle_RearFastener_L_Lo", "chrome"],
  ["SM_Scooter_SteeringNacelle_RearFastener_R_Hi", "chrome"],
  ["SM_Scooter_SteeringNacelle_RearFastener_R_Lo", "chrome"],
  ["SM_Scooter_SteeringNacelle_RearServiceCavity", "mechanical"],
  ["SM_Scooter_SteeringNacelle_RearServiceCover", "cream"],
  ["SM_Scooter_SteeringNacelle_RearServiceFrame", "ink"],
  ["SM_Scooter_SteeringNacelle_RearServiceRib", "ink"],
  ["SM_Scooter_SteeringNacelle_Shell", "cream"],
  ["SM_Scooter_SteeringNacelle_Throat", "cream"],
] satisfies ReadonlyArray<readonly [string, ScooterMaterialRole]>).map(([name, role]) => [normalizedMeshName(name), role] as const));

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

export type RiderMaterialRole = "skin" | "hair" | "eye" | "hoodie" | "undershirt" | "shorts" | "calf" | "shoe" | "accent";

export function resolveRiderMaterialRole(path: string): RiderMaterialRole {
  const normalized = path.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/hair/.test(normalized)) return "hair";
  if (/eye/.test(normalized)) return "eye";
  if (/hoodie/.test(normalized)) return "hoodie";
  if (/undershirt|tshirt/.test(normalized)) return "undershirt";
  if (/shorts|cargo/.test(normalized)) return "shorts";
  if (/calf/.test(normalized)) return "calf";
  if (/shoe|sneaker/.test(normalized)) return "shoe";
  if (/accent|chain|pocket/.test(normalized)) return "accent";
  return "skin";
}

export function resolveScooterMaterialRole(path: string): ScooterMaterialRole {
  const normalized = path.toLowerCase().replace(/[^a-z0-9]/g, "");
  const exactRole = SCOOTER_EXACT_MATERIAL_ROLES.get(normalized);
  if (exactRole) return exactRole;
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

export const SCOOTER_SURFACE_DETAIL_BUDGET = Object.freeze({
  drawCalls: 0,
  maximumTriangles: 1_000,
  textures: 0,
});

export const SCOOTER_BOOSTER_BUDGET = Object.freeze({
  drawCalls: 3,
  maximumTriangles: 4_000,
  textures: 1,
});

export const SCOOTER_ROUNDED_SEAT_BUDGET = Object.freeze({
  drawCalls: 2,
  maximumTriangles: 1_500,
  textures: 0,
});

export type RideLabVehicleMetrics = RideLabVehiclePose & {
  asset: "streetwear" | "procedural-fallback";
  handlebarSteerRadians: number;
  wheelSpinRadians: number;
  seatErrorMeters: number;
  leftHandErrorMeters: number;
  rightHandErrorMeters: number;
  leftFootErrorMeters: number;
  rightFootErrorMeters: number;
  leftHandPosition: { x: number; y: number; z: number };
  rightHandPosition: { x: number; y: number; z: number };
  leftFootPosition: { x: number; y: number; z: number };
  rightFootPosition: { x: number; y: number; z: number };
};

export type RideLabVehicleVisual = VehicleVisual & {
  readonly asset: RideLabVehicleMetrics["asset"];
  update(snapshot: RideLabSnapshot, delta: number): RideLabVehicleMetrics;
};

type BonePose = { bone: THREE.Bone; rest: THREE.Quaternion };
type TerminalFrame = {
  bone: THREE.Bone;
  forwardLocal: THREE.Vector3;
  upLocal: THREE.Vector3;
};

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

function createScooterCelGradient() {
  const gradient = new THREE.DataTexture(new Uint8Array([
    0, 0, 0, 255,
    82, 82, 82, 255,
    255, 255, 255, 255,
  ]), 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

function toonMaterial(color: number, gradientMap: THREE.Texture) {
  return new THREE.MeshToonMaterial({ color, gradientMap });
}

function vertexColorToonMaterial(gradientMap: THREE.Texture) {
  return new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap, vertexColors: true });
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

type ScooterSurfaceGuide = {
  closed?: boolean;
  points: ReadonlyArray<Readonly<{ x: number; y: number }>>;
  segments?: number;
};

const SCOOTER_SURFACE_GUIDES: readonly ScooterSurfaceGuide[] = [
  // Front apron inset: a broad construction break rather than traced topology.
  { points: [
    { x: -1.30, y: -0.10 },
    { x: -1.28, y: 0.18 },
    { x: -1.20, y: 0.46 },
    { x: -1.10, y: 0.66 },
    { x: -1.00, y: 0.38 },
    { x: -0.92, y: 0.10 },
  ] },
  // Rear cowling shoulder and floorboard/body break.
  { points: [
    { x: -0.05, y: 0.18 },
    { x: 0.35, y: 0.24 },
    { x: 0.78, y: 0.23 },
    { x: 1.15, y: 0.16 },
    { x: 1.38, y: 0.04 },
  ] },
  { points: [
    { x: -0.05, y: -0.20 },
    { x: 0.35, y: -0.24 },
    { x: 0.78, y: -0.23 },
    { x: 1.18, y: -0.16 },
  ] },
];

function createScooterSurfaceDetails(scooter: THREE.Object3D, surface: THREE.Object3D, inkCarrier: THREE.Mesh) {
  scooter.updateWorldMatrix(true, true);
  const raycaster = new THREE.Raycaster();
  const geometries: THREE.BufferGeometry[] = [];
  const localDirection = new THREE.Vector3();

  function addProjectedGuide<Point>(
    points: readonly Point[],
    projection: (point: Point) => {
      origin: THREE.Vector3Tuple;
      direction: THREE.Vector3Tuple;
      offset: THREE.Vector3Tuple;
    },
    closed = false,
    segments = 12,
  ) {
    const wrapped = points.flatMap((guidePoint) => {
      const projected = projection(guidePoint);
      const origin = scooter.localToWorld(new THREE.Vector3(...projected.origin));
      const direction = localDirection.set(...projected.direction).transformDirection(scooter.matrixWorld);
      raycaster.set(origin, direction);
      const hit = raycaster.intersectObject(surface, false)[0];
      if (!hit) return [];
      return [scooter.worldToLocal(hit.point.clone()).add(new THREE.Vector3(...projected.offset))];
    });
    if (wrapped.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(wrapped, closed, "centripetal");
    geometries.push(new THREE.TubeGeometry(curve, segments, 0.009, 3, closed));
  }

  for (const side of [-1, 1] as const) {
    for (const guide of SCOOTER_SURFACE_GUIDES) {
      addProjectedGuide(
        guide.points,
        ({ x, y }) => ({
          origin: [x, y, side * 2],
          direction: [0, 0, -side],
          offset: [0, 0, side * 0.018],
        }),
        guide.closed,
        guide.segments,
      );
    }
  }

  const endGuides: ReadonlyArray<{
    end: -1 | 1;
    points: ReadonlyArray<Readonly<{ y: number; z: number }>>;
  }> = [
    { end: -1, points: [
      { y: 0.12, z: -0.34 },
      { y: 0.08, z: -0.17 },
      { y: 0.06, z: 0 },
      { y: 0.08, z: 0.17 },
      { y: 0.12, z: 0.34 },
    ] },
    { end: 1, points: [
      { y: -0.12, z: -0.34 },
      { y: -0.16, z: -0.17 },
      { y: -0.18, z: 0 },
      { y: -0.16, z: 0.17 },
      { y: -0.12, z: 0.34 },
    ] },
  ];
  for (const guide of endGuides) {
    addProjectedGuide(guide.points, ({ y, z }) => ({
      origin: [guide.end * 2, y, z],
      direction: [-guide.end, 0, 0],
      offset: [guide.end * 0.018, 0, 0],
    }));
  }

  if (geometries.length === 0) throw new Error("Curated scooter surface rejected every authored detail guide");
  const geometry = mergeGeometries(geometries);
  for (const source of geometries) source.dispose();
  geometry.name = "ride-lab-scooter-projected-surface-details";
  geometry.computeBoundingSphere();
  const triangles = (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
  if (triangles > SCOOTER_SURFACE_DETAIL_BUDGET.maximumTriangles) {
    geometry.dispose();
    throw new Error(`Curated scooter surface details exceed ${SCOOTER_SURFACE_DETAIL_BUDGET.maximumTriangles} triangles`);
  }
  inkCarrier.updateWorldMatrix(true, false);
  geometry.deleteAttribute("uv");
  geometry.applyMatrix4(new THREE.Matrix4().copy(inkCarrier.matrixWorld).invert().multiply(scooter.matrixWorld));
  const sourceGeometry = inkCarrier.geometry;
  for (const candidate of [sourceGeometry, geometry]) {
    for (const [name, attribute] of Object.entries(candidate.attributes)) {
      candidate.setAttribute(name, new THREE.Float32BufferAttribute(
        Float32Array.from(attribute.array),
        attribute.itemSize,
        attribute.normalized,
      ));
    }
  }
  const merged = mergeGeometries([sourceGeometry, geometry]);
  if (!merged) throw new Error("Curated scooter ink and projected surface details could not be merged");
  geometry.dispose();
  sourceGeometry.dispose();
  merged.name = "ride-lab-scooter-ink-with-projected-surface-details";
  inkCarrier.geometry = merged;
  // The carrier is a thin floor mat; keeping the wrapped ink out of the shadow
  // map avoids paying the detail triangle budget a second time.
  inkCarrier.castShadow = false;
  inkCarrier.userData.surfaceDetailTriangles = triangles;
  return triangles;
}

type BoosterBandPalette = Readonly<{
  deep: number;
  shadow: number;
  base: number;
}>;

const BOOSTER_BANDS = Object.freeze({
  lime: Object.freeze({ deep: 0x08070c, shadow: 0x34451d, base: 0xbdf574 }),
  mechanical: Object.freeze({ deep: 0x08070c, shadow: 0x22212a, base: 0x4b4c57 }),
  seat: Object.freeze({ deep: 0x08070c, shadow: 0x1e1b25, base: 0x3a3542 }),
  red: Object.freeze({ deep: 0x08070c, shadow: 0x701428, base: 0xf23852 }),
});

function boosterGeometryWithAuthoredBands(source: THREE.BufferGeometry, palette: BoosterBandPalette) {
  const geometry = source.index ? source.toNonIndexed() : source;
  if (geometry !== source) source.dispose();
  geometry.computeVertexNormals();
  geometry.deleteAttribute("uv");
  geometry.deleteAttribute("uv1");
  const normals = geometry.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  const authoredLight = new THREE.Vector3(-0.35, 0.82, 0.45).normalize();
  const faceNormal = new THREE.Vector3();
  const color = new THREE.Color();
  for (let vertex = 0; vertex < normals.count; vertex += 3) {
    faceNormal.set(
      normals.getX(vertex) + normals.getX(vertex + 1) + normals.getX(vertex + 2),
      normals.getY(vertex) + normals.getY(vertex + 1) + normals.getY(vertex + 2),
      normals.getZ(vertex) + normals.getZ(vertex + 1) + normals.getZ(vertex + 2),
    ).normalize();
    const facing = faceNormal.dot(authoredLight);
    color.setHex(facing < -0.28 ? palette.deep : facing < 0.34 ? palette.shadow : palette.base);
    for (let corner = 0; corner < 3; corner += 1) {
      const offset = (vertex + corner) * 3;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function boosterCylinderBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  radialSegments: number,
  palette: BoosterBandPalette,
) {
  const direction = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments, 1, false);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  geometry.applyMatrix4(new THREE.Matrix4().compose(
    start.clone().add(end).multiplyScalar(0.5),
    rotation,
    new THREE.Vector3(1, 1, 1),
  ));
  return boosterGeometryWithAuthoredBands(geometry, palette);
}

function boosterHelixBetween(start: THREE.Vector3, end: THREE.Vector3, palette: BoosterBandPalette) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const points = Array.from({ length: 37 }, (_, index) => {
    const progress = index / 36;
    const angle = progress * Math.PI * 9;
    return new THREE.Vector3(Math.cos(angle) * 0.075, progress * length - length / 2, Math.sin(angle) * 0.075);
  });
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, 0.023, 4, false);
  const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  geometry.applyMatrix4(new THREE.Matrix4().compose(
    start.clone().add(end).multiplyScalar(0.5),
    rotation,
    new THREE.Vector3(1, 1, 1),
  ));
  return boosterGeometryWithAuthoredBands(geometry, palette);
}

function createScooterJumpBooster(stickerTexture: THREE.Texture) {
  const triangleCount = (geometry: THREE.BufferGeometry) => (
    geometry.index?.count ?? geometry.getAttribute("position").count
  ) / 3;
  const geometries: THREE.BufferGeometry[] = [];
  const cagePoints = [
    new THREE.Vector2(0.22, -0.18),
    new THREE.Vector2(0.30, 0.25),
    new THREE.Vector2(1.08, 0.25),
    new THREE.Vector2(1.18, 0.10),
    new THREE.Vector2(1.10, -0.20),
  ];
  for (const side of [-1, 1] as const) {
    const podZ = side * 0.61;
    geometries.push(
      boosterCylinderBetween(new THREE.Vector3(0.35, 0.04, podZ), new THREE.Vector3(1.02, 0.04, podZ), 0.20, 10, BOOSTER_BANDS.lime),
      boosterCylinderBetween(new THREE.Vector3(0.27, 0.04, podZ), new THREE.Vector3(0.38, 0.04, podZ), 0.225, 10, BOOSTER_BANDS.mechanical),
      boosterCylinderBetween(new THREE.Vector3(0.99, 0.04, podZ), new THREE.Vector3(1.10, 0.04, podZ), 0.225, 10, BOOSTER_BANDS.mechanical),
    );
    for (let index = 0; index < cagePoints.length; index += 1) {
      const current = cagePoints[index];
      const next = cagePoints[(index + 1) % cagePoints.length];
      geometries.push(boosterCylinderBetween(
        new THREE.Vector3(current.x, current.y, side * 0.72),
        new THREE.Vector3(next.x, next.y, side * 0.72),
        0.035,
        6,
        BOOSTER_BANDS.lime,
      ));
    }
    const shockTop = new THREE.Vector3(0.91, -0.16, side * 0.55);
    const shockBottom = new THREE.Vector3(0.96, -0.67, side * 0.47);
    geometries.push(
      boosterCylinderBetween(shockTop, shockBottom, 0.035, 8, BOOSTER_BANDS.mechanical),
      boosterHelixBetween(shockTop, shockBottom, BOOSTER_BANDS.lime),
    );

    const rockerShape = new THREE.Shape();
    rockerShape.moveTo(0.65, -0.22);
    rockerShape.lineTo(1.08, -0.22);
    rockerShape.lineTo(0.96, -0.52);
    rockerShape.closePath();
    const rocker = new THREE.ExtrudeGeometry(rockerShape, { depth: 0.09, steps: 1, bevelEnabled: false });
    rocker.translate(0, 0, side * 0.55 - 0.045);
    geometries.push(boosterGeometryWithAuthoredBands(rocker, BOOSTER_BANDS.mechanical));
    geometries.push(boosterCylinderBetween(
      new THREE.Vector3(0.88, -0.35, side * 0.48),
      new THREE.Vector3(0.88, -0.35, side * 0.65),
      0.09,
      10,
      BOOSTER_BANDS.mechanical,
    ));

    const lock = new THREE.BoxGeometry(0.14, 0.08, 0.055);
    lock.translate(0.62, 0.29, side * 0.725);
    geometries.push(boosterGeometryWithAuthoredBands(lock, BOOSTER_BANDS.red));
  }

  const geometry = mergeGeometries(geometries);
  for (const source of geometries) source.dispose();
  if (!geometry) throw new Error("Ride Lab jump booster geometry could not be merged");
  geometry.name = "ride-lab-sci-fi-punk-jump-booster";
  geometry.computeBoundingSphere();
  const triangles = triangleCount(geometry);
  if (triangles > SCOOTER_BOOSTER_BUDGET.maximumTriangles) {
    geometry.dispose();
    throw new Error(`Ride Lab jump booster exceeds ${SCOOTER_BOOSTER_BUDGET.maximumTriangles} triangles`);
  }

  const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const booster = new THREE.Mesh(geometry, material);
  booster.name = "ride-lab-sci-fi-punk-jump-booster";
  booster.castShadow = false;
  booster.receiveShadow = false;

  const outline = booster.clone(false);
  outline.name = "ride-lab-sci-fi-punk-jump-booster-outline";
  outline.material = new THREE.MeshBasicMaterial({ color: 0x08070c, side: THREE.BackSide, toneMapped: false });
  outline.material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      "transformed += objectNormal * 0.018;\n#include <project_vertex>",
    );
  };
  outline.material.customProgramCacheKey = () => "ride-lab-flat-booster-outline-v1";
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;

  const decalGeometries = [-1, 1].map((side) => {
    const decal = new THREE.PlaneGeometry(0.38, 0.38);
    if (side < 0) decal.rotateY(Math.PI);
    decal.translate(0.68, 0.04, side * 0.748);
    return decal;
  });
  const decalGeometry = mergeGeometries(decalGeometries);
  for (const source of decalGeometries) source.dispose();
  if (!decalGeometry) throw new Error("Ride Lab booster sticker geometry could not be merged");
  const decalMaterial = new THREE.MeshBasicMaterial({
    map: stickerTexture,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const decal = new THREE.Mesh(decalGeometry, decalMaterial);
  decal.name = "ride-lab-sci-fi-punk-booster-sticker";
  decal.castShadow = false;
  decal.receiveShadow = false;
  decal.renderOrder = 2;

  const group = new THREE.Group();
  group.name = "ride-lab-sci-fi-punk-booster-assembly";
  group.add(outline, booster, decal);
  group.userData.boosterTriangles = triangles + triangleCount(decalGeometry);
  group.userData.boosterDrawCalls = SCOOTER_BOOSTER_BUDGET.drawCalls;
  group.userData.boosterTextures = SCOOTER_BOOSTER_BUDGET.textures;
  return { group, materials: [material, outline.material, decalMaterial] as THREE.Material[] };
}

function createRoundedScooterSeat() {
  const sections = [
    { x: 0.17, radius: 0.36, length: 0.15, heightScale: 0.42, widthScale: 1.05 },
    { x: 0.82, radius: 0.34, length: 0.08, heightScale: 0.44, widthScale: 1.08 },
  ].map(({ x, radius, length, heightScale, widthScale }) => {
    const section = new THREE.CapsuleGeometry(radius, length, 4, 8);
    section.rotateZ(Math.PI / 2);
    section.scale(1, heightScale, widthScale);
    section.translate(x, 0.50, 0);
    return boosterGeometryWithAuthoredBands(section, BOOSTER_BANDS.seat);
  });
  const geometry = mergeGeometries(sections);
  for (const section of sections) section.dispose();
  if (!geometry) throw new Error("Ride Lab rounded scooter seat could not be merged");
  geometry.name = "ride-lab-rounded-two-piece-seat";
  const triangles = (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
  if (triangles > SCOOTER_ROUNDED_SEAT_BUDGET.maximumTriangles) {
    geometry.dispose();
    throw new Error(`Ride Lab rounded seat exceeds ${SCOOTER_ROUNDED_SEAT_BUDGET.maximumTriangles} triangles`);
  }

  const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const seat = new THREE.Mesh(geometry, material);
  seat.name = "ride-lab-rounded-two-piece-seat";
  seat.castShadow = false;
  seat.receiveShadow = false;
  const outline = seat.clone(false);
  outline.name = "ride-lab-rounded-two-piece-seat-outline";
  outline.material = new THREE.MeshBasicMaterial({ color: 0x08070c, side: THREE.BackSide, toneMapped: false });
  outline.material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      "transformed += objectNormal * 0.015;\n#include <project_vertex>",
    );
  };
  outline.material.customProgramCacheKey = () => "ride-lab-flat-rounded-seat-outline-v1";
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;

  const group = new THREE.Group();
  group.name = "ride-lab-rounded-two-piece-seat-assembly";
  group.add(outline, seat);
  group.userData.seatTriangles = triangles;
  group.userData.seatDrawCalls = SCOOTER_ROUNDED_SEAT_BUDGET.drawCalls;
  return { group, materials: [material, outline.material] as THREE.Material[] };
}

function captureBone(root: THREE.Object3D, name: string): BonePose {
  const bone = requiredObject(root, name);
  if (!(bone instanceof THREE.Bone)) throw new Error(`Curated rider node is not a bone: ${name}`);
  return { bone, rest: bone.quaternion.clone() };
}

function applyBonePose(pose: BonePose, rotation: THREE.Euler) {
  pose.bone.quaternion.copy(pose.rest).multiply(new THREE.Quaternion().setFromEuler(rotation));
}

function setBoneWorldQuaternion(bone: THREE.Bone, worldQuaternion: THREE.Quaternion) {
  const parentWorld = new THREE.Quaternion();
  bone.parent?.getWorldQuaternion(parentWorld);
  bone.quaternion.copy(parentWorld.invert().multiply(worldQuaternion)).normalize();
}

function rotateBoneWorldDirection(
  root: THREE.Object3D,
  bone: THREE.Bone,
  from: THREE.Vector3,
  to: THREE.Vector3,
) {
  if (from.lengthSq() < 1e-10 || to.lengthSq() < 1e-10) return;
  const world = new THREE.Quaternion();
  bone.getWorldQuaternion(world);
  const correction = new THREE.Quaternion().setFromUnitVectors(from.normalize(), to.normalize());
  setBoneWorldQuaternion(bone, correction.multiply(world));
  root.updateMatrixWorld(true);
}

function solveTwoBoneIK(
  root: THREE.Object3D,
  upper: THREE.Bone,
  lower: THREE.Bone,
  effector: THREE.Bone,
  target: THREE.Vector3,
  pole: THREE.Vector3,
) {
  root.updateMatrixWorld(true);
  const rootPosition = upper.getWorldPosition(new THREE.Vector3());
  const jointPosition = lower.getWorldPosition(new THREE.Vector3());
  const effectorPosition = effector.getWorldPosition(new THREE.Vector3());
  const upperLength = rootPosition.distanceTo(jointPosition);
  const lowerLength = jointPosition.distanceTo(effectorPosition);
  if (upperLength < 1e-5 || lowerLength < 1e-5) return;

  const targetDirection = target.clone().sub(rootPosition);
  const unclampedDistance = targetDirection.length();
  if (unclampedDistance < 1e-5) return;
  targetDirection.normalize();
  const minimumReach = Math.abs(upperLength - lowerLength) + 1e-4;
  const maximumReach = upperLength + lowerLength - 1e-4;
  const reach = THREE.MathUtils.clamp(unclampedDistance, minimumReach, maximumReach);
  const reachableTarget = rootPosition.clone().addScaledVector(targetDirection, reach);

  const poleDirection = pole.clone().sub(rootPosition);
  poleDirection.addScaledVector(targetDirection, -poleDirection.dot(targetDirection));
  if (poleDirection.lengthSq() < 1e-8) {
    poleDirection.copy(jointPosition).sub(rootPosition);
    poleDirection.addScaledVector(targetDirection, -poleDirection.dot(targetDirection));
  }
  poleDirection.normalize();

  const along = (upperLength * upperLength + reach * reach - lowerLength * lowerLength) / (2 * reach);
  const away = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
  const desiredJoint = rootPosition.clone()
    .addScaledVector(targetDirection, along)
    .addScaledVector(poleDirection, away);

  rotateBoneWorldDirection(
    root,
    upper,
    jointPosition.clone().sub(rootPosition),
    desiredJoint.clone().sub(rootPosition),
  );

  const solvedJoint = lower.getWorldPosition(new THREE.Vector3());
  const solvedEffector = effector.getWorldPosition(new THREE.Vector3());
  rotateBoneWorldDirection(
    root,
    lower,
    solvedEffector.sub(solvedJoint),
    reachableTarget.sub(solvedJoint),
  );
}

function captureTerminalFrame(
  root: THREE.Object3D,
  terminal: THREE.Bone,
  child: THREE.Bone,
): TerminalFrame {
  root.updateMatrixWorld(true);
  const origin = terminal.getWorldPosition(new THREE.Vector3());
  const childPosition = child.getWorldPosition(new THREE.Vector3());
  const terminalWorldInverse = terminal.getWorldQuaternion(new THREE.Quaternion()).invert();
  const forwardLocal = childPosition.sub(origin).normalize().applyQuaternion(terminalWorldInverse);
  const rootOrigin = root.localToWorld(new THREE.Vector3());
  const rootUp = root.localToWorld(new THREE.Vector3(0, 1, 0)).sub(rootOrigin).normalize();
  const upLocal = rootUp.applyQuaternion(terminalWorldInverse);
  upLocal.addScaledVector(forwardLocal, -upLocal.dot(forwardLocal)).normalize();
  return { bone: terminal, forwardLocal, upLocal };
}

function orientTerminalFrame(
  frame: TerminalFrame,
  targetForward: THREE.Vector3,
  targetUp: THREE.Vector3,
) {
  const sourceForward = frame.forwardLocal.clone().normalize();
  const sourceUp = frame.upLocal.clone()
    .addScaledVector(sourceForward, -frame.upLocal.dot(sourceForward))
    .normalize();
  const sourceRight = new THREE.Vector3().crossVectors(sourceUp, sourceForward).normalize();
  const sourceBasis = new THREE.Matrix4().makeBasis(sourceRight, sourceUp, sourceForward);

  const forward = targetForward.clone().normalize();
  const up = targetUp.clone().addScaledVector(forward, -targetUp.dot(forward)).normalize();
  const right = new THREE.Vector3().crossVectors(up, forward).normalize();
  const targetBasis = new THREE.Matrix4().makeBasis(right, up, forward);
  const world = new THREE.Quaternion().setFromRotationMatrix(targetBasis.multiply(sourceBasis.invert()));
  setBoneWorldQuaternion(frame.bone, world);
}

function worldAnchor(parent: THREE.Object3D, anchor: Readonly<{ x: number; y: number; z: number }>) {
  return parent.localToWorld(new THREE.Vector3(anchor.x, anchor.y, anchor.z));
}

async function createCuratedVehicleVisual(): Promise<RideLabVehicleVisual> {
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  const [scooterGltf, riderGltf, boosterSticker] = await Promise.all([
    loader.loadAsync(SCOOTER_URL),
    loader.loadAsync(RIDER_URL),
    textureLoader.loadAsync(SCOOTER_BOOSTER_STICKER_URL),
  ]);

  boosterSticker.colorSpace = THREE.SRGBColorSpace;
  boosterSticker.minFilter = THREE.NearestFilter;
  boosterSticker.magFilter = THREE.NearestFilter;
  boosterSticker.generateMipmaps = false;
  const celGradient = createCelGradient();
  const scooterCelGradient = createScooterCelGradient();

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
    ink: toonMaterial(0x171321, scooterCelGradient),
    tire: toonMaterial(0x09080d, scooterCelGradient),
    mechanical: toonMaterial(0x41444d, scooterCelGradient),
    seat: toonMaterial(0x322e3a, scooterCelGradient),
    cream: toonMaterial(0xa6dc6f, scooterCelGradient),
    cyan: toonMaterial(0x45dfe3, scooterCelGradient),
    chrome: toonMaterial(0xd9edf0, scooterCelGradient),
    headlight: new THREE.MeshToonMaterial({
      color: 0xfff1c7,
      emissive: 0x5c431d,
      emissiveIntensity: 0.28,
      gradientMap: scooterCelGradient,
    }),
    orange: toonMaterial(0xff8a4c, scooterCelGradient),
    red: new THREE.MeshToonMaterial({
      color: 0xff365e,
      emissive: 0x7a071f,
      emissiveIntensity: 0.45,
      gradientMap: scooterCelGradient,
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
  const scooterBodySurface = requiredObject(scooter, "lowpolybase.004");
  const scooterInkCarrier = requiredObject(scooter, "tapislowpoly.002");
  if (!(scooterInkCarrier instanceof THREE.Mesh)) throw new Error("Curated scooter ink carrier is not a mesh");
  createScooterSurfaceDetails(scooter, scooterBodySurface, scooterInkCarrier);
  const booster = createScooterJumpBooster(boosterSticker);
  scooter.add(booster.group);
  for (const material of booster.materials) scooterMaterials.add(material);
  const roundedSeat = createRoundedScooterSeat();
  scooter.add(roundedSeat.group);
  for (const material of roundedSeat.materials) scooterMaterials.add(material);
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
  rider.name = "girush-streetwear-rider";
  const riderPalette: Record<RiderMaterialRole, THREE.MeshToonMaterial> = {
    skin: toonMaterial(0xd98f70, celGradient),
    hair: toonMaterial(0x251c35, celGradient),
    eye: toonMaterial(0x08070c, celGradient),
    hoodie: toonMaterial(0xf16f52, celGradient),
    undershirt: toonMaterial(0xf3e9cf, celGradient),
    shorts: toonMaterial(0x254f72, celGradient),
    calf: toonMaterial(0xd98f70, celGradient),
    shoe: toonMaterial(0x282537, celGradient),
    accent: toonMaterial(0xbfd3a9, celGradient),
  };
  const riderVertexMaterial = vertexColorToonMaterial(celGradient);
  const riderMaterials = new Set<THREE.Material>([...Object.values(riderPalette), riderVertexMaterial]);
  const riderMeshes: THREE.SkinnedMesh[] = [];
  const replacedRiderMaterials = new Set<THREE.Material>();
  rider.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object instanceof THREE.SkinnedMesh) riderMeshes.push(object);
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of sourceMaterials) replacedRiderMaterials.add(material);
    object.material = object.geometry.hasAttribute("color")
      ? riderVertexMaterial
      : riderPalette[resolveRiderMaterialRole(object.name)];
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
  riderPlacement.rotation.x = 0.7;
  riderPlacement.add(rider);
  body.add(riderPlacement);

  const hips = captureBone(rider, "Hips");
  const spine = captureBone(rider, "Spine");
  const chest = captureBone(rider, "Chest");
  const head = captureBone(rider, "Head");
  const leftShoulder = captureBone(rider, "LeftShoulder");
  const leftArm = captureBone(rider, "LeftArm");
  const leftForeArm = captureBone(rider, "LeftForeArm");
  const leftHand = captureBone(rider, "LeftHand");
  const rightShoulder = captureBone(rider, "RightShoulder");
  const rightArm = captureBone(rider, "RightArm");
  const rightForeArm = captureBone(rider, "RightForeArm");
  const rightHand = captureBone(rider, "RightHand");
  const leftUpLeg = captureBone(rider, "LeftUpLeg");
  const leftLeg = captureBone(rider, "LeftLeg");
  const leftFoot = captureBone(rider, "LeftFoot");
  const leftToes = captureBone(rider, "LeftToes");
  const rightUpLeg = captureBone(rider, "RightUpLeg");
  const rightLeg = captureBone(rider, "RightLeg");
  const rightFoot = captureBone(rider, "RightFoot");
  const rightToes = captureBone(rider, "RightToes");

  root.updateMatrixWorld(true);
  const hipsBeforeAlignment = hips.bone.getWorldPosition(new THREE.Vector3());
  const pelvisTarget = worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.pelvisAnchor);
  riderPlacement.position.add(pelvisTarget.sub(hipsBeforeAlignment));
  const leftFootFrame = captureTerminalFrame(rider, leftFoot.bone, leftToes.bone);
  const rightFootFrame = captureTerminalFrame(rider, rightFoot.bone, rightToes.bone);

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
    applyBonePose(spine, new THREE.Euler(-0.24, 0, pose.riderLeanRadians * 0.55));
    applyBonePose(chest, new THREE.Euler(0, pose.shoulderYawRadians, pose.riderLeanRadians * 0.35));
    applyBonePose(head, new THREE.Euler(pose.headTuckRadians, 0, pose.headCounterLeanRadians));
    applyBonePose(leftShoulder, new THREE.Euler(0, 0, 0));
    applyBonePose(leftArm, new THREE.Euler(-0.55, 0.2, -0.12 - pose.leftElbowFlareRadians));
    applyBonePose(rightShoulder, new THREE.Euler(0, 0, 0));
    applyBonePose(rightArm, new THREE.Euler(-0.55, -0.2, 0.12 + pose.rightElbowFlareRadians));
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
    solveTwoBoneIK(root, leftArm.bone, leftForeArm.bone, leftHand.bone, leftHandTarget, worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.leftElbowPole));
    solveTwoBoneIK(root, rightArm.bone, rightForeArm.bone, rightHand.bone, rightHandTarget, worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.rightElbowPole));
    solveTwoBoneIK(root, leftUpLeg.bone, leftLeg.bone, leftFoot.bone, leftFootTarget, worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.leftKneePole));
    solveTwoBoneIK(root, rightUpLeg.bone, rightLeg.bone, rightFoot.bone, rightFootTarget, worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.rightKneePole));
    const floorboardForward = worldAnchor(body, { x: 0, y: 0, z: 1 })
      .sub(worldAnchor(body, { x: 0, y: 0, z: 0 }))
      .normalize();
    const floorboardUp = worldAnchor(body, { x: 0, y: 1, z: 0 })
      .sub(worldAnchor(body, { x: 0, y: 0, z: 0 }))
      .normalize();
    orientTerminalFrame(leftFootFrame, floorboardForward, floorboardUp);
    orientTerminalFrame(rightFootFrame, floorboardForward, floorboardUp);
    // The IK targets wrist positions; orient the terminal hand bones so the
    // palms rest across the grips instead of leaving straight fingers hanging
    // beneath them.
    applyBonePose(leftHand, new THREE.Euler(0, 0, -Math.PI * 0.5));
    applyBonePose(rightHand, new THREE.Euler(0, 0, Math.PI * 0.5));
    root.updateMatrixWorld(true);

    const leftHandPosition = leftHand.bone.getWorldPosition(new THREE.Vector3());
    const rightHandPosition = rightHand.bone.getWorldPosition(new THREE.Vector3());
    const leftFootPosition = leftFoot.bone.getWorldPosition(new THREE.Vector3());
    const rightFootPosition = rightFoot.bone.getWorldPosition(new THREE.Vector3());
    return {
      ...pose,
      asset: "streetwear",
      handlebarSteerRadians: handlebarSteer.rotation.y,
      wheelSpinRadians,
      seatErrorMeters: hips.bone.getWorldPosition(new THREE.Vector3()).distanceTo(worldAnchor(body, RIDE_LAB_VEHICLE_ALIGNMENT.pelvisAnchor)),
      leftHandErrorMeters: leftHandPosition.distanceTo(leftHandTarget),
      rightHandErrorMeters: rightHandPosition.distanceTo(rightHandTarget),
      leftFootErrorMeters: leftFootPosition.distanceTo(leftFootTarget),
      rightFootErrorMeters: rightFootPosition.distanceTo(rightFootTarget),
      leftHandPosition,
      rightHandPosition,
      leftFootPosition,
      rightFootPosition,
    };
  }

  return {
    root,
    lean,
    body,
    frontWheel,
    rearWheel,
    asset: "streetwear",
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
      for (const material of riderMaterials) material.dispose();
      riderOutlineMaterial.dispose();
      tailGlowTexture.dispose();
      boosterSticker.dispose();
      scooterCelGradient.dispose();
      celGradient.dispose();
      root.removeFromParent();
      root.clear();
    },
  };
}

export function createFallbackVehicleVisual(): RideLabVehicleVisual {
  const fallback = createProceduralVehicleVisual();
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
        leftFootErrorMeters: 0,
        rightFootErrorMeters: 0,
        leftHandPosition: { x: 0, y: 0, z: 0 },
        rightHandPosition: { x: 0, y: 0, z: 0 },
        leftFootPosition: { x: 0, y: 0, z: 0 },
        rightFootPosition: { x: 0, y: 0, z: 0 },
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
