import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

import {
  cloneMallAsset,
  type MallAssetLibrary,
} from "./art/mallAssetLibrary.ts";

function toon(
  color: number,
  gradientMap: THREE.Texture,
  name: string,
  outlined = true,
) {
  const material = new THREE.MeshToonMaterial({ color, gradientMap });
  material.name = name;
  material.userData.outlineParameters = { visible: outlined };
  return material;
}

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const value = new THREE.Mesh(geometry, material);
  value.position.set(...position);
  value.rotation.set(...rotation);
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function poseRider(rider: THREE.Group) {
  const pose = (
    name: string,
    rotation: Partial<{ x: number; y: number; z: number }>,
  ) => {
    const bone = rider.getObjectByName(name);
    if (!bone) return;
    // Preserve the donor rig's bind rotation and layer a seated pose over it.
    if (rotation.x !== undefined) bone.rotation.x += rotation.x;
    if (rotation.y !== undefined) bone.rotation.y += rotation.y;
    if (rotation.z !== undefined) bone.rotation.z += rotation.z;
  };

  pose("Torso", { x: -0.13 });
  pose("Chest", { x: -0.16 });
  pose("UpperLegL", { x: -1.08, z: 0.08 });
  pose("UpperLegR", { x: -1.08, z: -0.08 });
  pose("LowerLegL", { x: 1.34 });
  pose("LowerLegR", { x: 1.34 });
  pose("UpperArmL", { y: -0.86, z: -0.34 });
  pose("UpperArmR", { y: 0.86, z: 0.34 });
  pose("LowerArmL", { y: -0.42, z: -0.32 });
  pose("LowerArmR", { y: 0.42, z: 0.32 });
}

function addGlasses(rider: THREE.Group, ink: THREE.Material) {
  const head = rider.getObjectByName("Head");
  if (!head) return;
  const glasses = new THREE.Group();
  glasses.name = "meio-oversized-glasses";
  glasses.position.set(0, 0.09, 0.19);

  const lensGeometry = new THREE.TorusGeometry(0.13, 0.025, 5, 12);
  glasses.add(
    mesh(lensGeometry, ink, [-0.135, 0, 0]),
    mesh(lensGeometry, ink, [0.135, 0, 0]),
    mesh(new THREE.BoxGeometry(0.08, 0.025, 0.025), ink, [0, 0, 0]),
  );
  head.add(glasses);
}

export type VehicleVisual = {
  root: THREE.Group;
  lean: THREE.Group;
  body: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  dispose(): void;
};

export function createVehicleVisual(assets: MallAssetLibrary): VehicleVisual {
  const root = new THREE.Group();
  root.name = "moped-root";
  const lean = new THREE.Group();
  lean.name = "moped-visual-lean";
  root.add(lean);
  const body = new THREE.Group();
  body.name = "moped-sprung-body";
  lean.add(body);

  const gradientMap = new THREE.DataTexture(
    new Uint8Array([10, 116, 255]),
    3,
    1,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  gradientMap.name = "vehicle-three-band-toon-ramp";
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.colorSpace = THREE.NoColorSpace;
  gradientMap.needsUpdate = true;

  const ink = toon(0x080808, gradientMap, "vehicle.ink");
  const hotPink = toon(0xf23f78, gradientMap, "vehicle.hot-pink");
  const cream = toon(0xe9d9b7, gradientMap, "rider.cream");
  const cyan = toon(0x58dbe0, gradientMap, "rider.cyan");
  const skin = toon(0xb96f4d, gradientMap, "rider.skin");
  const acid = toon(0xc8f23d, gradientMap, "vehicle.acid");
  const contactInk = new THREE.MeshBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  contactInk.name = "vehicle.authored-contact-shadow";
  contactInk.userData.outlineParameters = { visible: false };
  const materials = [ink, hotPink, cream, cyan, skin, acid, contactInk];

  const scooter = cloneMallAsset(
    assets.scooter,
    "styloo-scooter-curated",
  );
  scooter.position.set(0.08, 0, 0);
  // The donor mesh's nose points down local -X; the vehicle contract uses +X.
  scooter.rotation.y = Math.PI;
  scooter.scale.setScalar(0.36);
  scooter.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry = object.geometry.clone();
    object.material = hotPink;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  body.add(scooter);

  // The donor scooter is deliberately flattened to a project material. These
  // authored wheels and seat restore the black graphic read and keep the
  // animation pivots stable for the physics visual contract.
  const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.145, 14);
  const frontWheel = new THREE.Group();
  const rearWheel = new THREE.Group();
  frontWheel.position.set(0.66, -0.39, 0);
  rearWheel.position.set(-0.67, -0.39, 0);
  frontWheel.add(
    mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]),
  );
  rearWheel.add(
    mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]),
  );
  lean.add(frontWheel, rearWheel);
  body.add(
    mesh(new THREE.BoxGeometry(0.56, 0.12, 0.33), ink, [-0.27, 0.16, 0]),
    mesh(new THREE.SphereGeometry(0.115, 10, 7), acid, [0.72, 0.15, 0]),
  );

  const rider = cloneSkeleton(assets.rider) as THREE.Group;
  rider.name = "meio-rider-from-quaternius-donor";
  rider.position.set(-0.2, -0.14, 0);
  rider.rotation.y = Math.PI / 2;
  rider.scale.set(0.54, 0.42, 0.47);
  rider.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry = object.geometry.clone();
    const chooseMaterial = (source: THREE.Material) => {
      const name = source.name.toLowerCase();
      if (name.includes("skin")) return skin;
      if (
        name.includes("hair") ||
        name.includes("eye") ||
        name.includes("eyebrow")
      ) {
        return ink;
      }
      if (name.includes("red") || name.includes("lightbrown")) return cyan;
      if (name.includes("white")) return cream;
      return hotPink;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(chooseMaterial)
      : chooseMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  poseRider(rider);
  addGlasses(rider, ink);
  body.add(rider);

  const contactShadow = mesh(
    new THREE.CircleGeometry(0.82, 18),
    contactInk,
    [0, -0.79, 0],
    [-Math.PI / 2, 0, 0],
  );
  contactShadow.name = "moped-authored-contact-shadow";
  contactShadow.scale.set(1.45, 0.52, 1);
  contactShadow.castShadow = false;
  contactShadow.receiveShadow = false;
  contactShadow.renderOrder = 2;
  root.add(contactShadow);

  return {
    root,
    lean,
    body,
    frontWheel,
    rearWheel,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const skeletons = new Set<THREE.Skeleton>();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
        if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const skeleton of skeletons) skeleton.dispose();
      for (const material of materials) material.dispose();
      gradientMap.dispose();
      root.removeFromParent();
      root.clear();
    },
  };
}

export function createProceduralVehicleVisual(): VehicleVisual {
  const root = new THREE.Group();
  root.name = "moped-root";
  const lean = new THREE.Group();
  lean.name = "moped-visual-lean";
  root.add(lean);
  const body = new THREE.Group();
  body.name = "moped-sprung-body";
  lean.add(body);

  const ink = new THREE.MeshToonMaterial({ color: 0x19132d });
  const hotPink = new THREE.MeshToonMaterial({ color: 0xff3d81 });
  const cream = new THREE.MeshToonMaterial({ color: 0xffe7c7 });
  const cyan = new THREE.MeshToonMaterial({ color: 0x34d7da });
  const skin = new THREE.MeshToonMaterial({ color: 0xc87952 });
  const visor = new THREE.MeshToonMaterial({
    color: 0xb9f7ff,
    emissive: 0x193c49,
  });
  const materials = [ink, hotPink, cream, cyan, skin, visor];

  const wheelGeometry = new THREE.CylinderGeometry(0.33, 0.33, 0.13, 12);
  const frontWheel = new THREE.Group();
  const rearWheel = new THREE.Group();
  frontWheel.position.set(0.68, -0.37, 0);
  rearWheel.position.set(-0.66, -0.37, 0);
  frontWheel.add(mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]));
  rearWheel.add(mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]));
  lean.add(frontWheel, rearWheel);

  body.add(
    mesh(
      new THREE.CapsuleGeometry(0.25, 0.85, 3, 8),
      hotPink,
      [-0.05, -0.04, 0],
      [0, 0, Math.PI / 2],
    ),
    mesh(new THREE.BoxGeometry(0.5, 0.12, 0.34), ink, [-0.3, 0.18, 0]),
    mesh(
      new THREE.BoxGeometry(0.08, 0.62, 0.08),
      ink,
      [0.5, 0.25, 0],
      [0, 0, -0.18],
    ),
    mesh(new THREE.BoxGeometry(0.11, 0.08, 0.72), ink, [0.48, 0.51, 0]),
    mesh(new THREE.SphereGeometry(0.12, 10, 8), cyan, [0.72, 0.14, 0]),
  );

  const rider = new THREE.Group();
  rider.name = "rider";
  rider.position.set(-0.18, 0.35, 0);
  rider.add(
    mesh(
      new THREE.CapsuleGeometry(0.17, 0.45, 3, 7),
      cyan,
      [0, 0.37, 0],
      [0, 0, -0.18],
    ),
    mesh(new THREE.SphereGeometry(0.2, 10, 7), skin, [0.06, 0.81, 0]),
    mesh(
      new THREE.SphereGeometry(0.23, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62),
      cream,
      [0.06, 0.88, 0],
    ),
    mesh(new THREE.BoxGeometry(0.06, 0.14, 0.36), visor, [0.22, 0.83, 0]),
  );
  const armGeometry = new THREE.CapsuleGeometry(0.055, 0.46, 2, 6);
  rider.add(
    mesh(armGeometry, skin, [0.22, 0.48, 0.24], [0, 0, -1.08]),
    mesh(armGeometry, skin, [0.22, 0.48, -0.24], [0, 0, -1.08]),
  );
  const legGeometry = new THREE.CapsuleGeometry(0.065, 0.44, 2, 6);
  rider.add(
    mesh(legGeometry, ink, [-0.06, 0.02, 0.16], [0, 0, 0.65]),
    mesh(legGeometry, ink, [-0.06, 0.02, -0.16], [0, 0, 0.65]),
  );
  body.add(rider);

  return {
    root,
    lean,
    body,
    frontWheel,
    rearWheel,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      root.removeFromParent();
      root.clear();
    },
  };
}
