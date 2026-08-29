import * as THREE from "three";

import { STATIC_BOXES } from "../mallPhysics";
import {
  createMallMaterialRegistry,
  type MallMaterialRegistry,
  type MallMaterialRole,
} from "./mallMaterials";
import { cloneMallAsset, type MallAssetLibrary } from "./mallAssetLibrary";

export type MallArtScene = {
  root: THREE.Group;
  dispose(): void;
};

type BoxOptions = {
  position: [number, number, number];
  size: [number, number, number];
  material: MallMaterialRole;
  rotationY?: number;
  name?: string;
};

type AssetPlacement = {
  position: [number, number, number];
  scale: number | [number, number, number];
  rotationY?: number;
  material?: MallMaterialRole;
};

const FLOOR_Y = 0.012;

function addBox(
  parent: THREE.Object3D,
  materials: MallMaterialRegistry,
  options: BoxOptions,
) {
  const geometry = new THREE.BoxGeometry(...options.size);
  const mesh = new THREE.Mesh(geometry, materials[options.material]);
  mesh.name = options.name ?? options.material;
  mesh.position.set(...options.position);
  mesh.rotation.y = options.rotationY ?? 0;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addFloorPrint(
  parent: THREE.Object3D,
  materials: MallMaterialRegistry,
  geometry: THREE.BufferGeometry,
  position: [number, number, number],
  rotationZ = 0,
  material: MallMaterialRole = "decal.print",
) {
  const mesh = new THREE.Mesh(geometry, materials[material]);
  mesh.position.set(...position);
  mesh.rotation.set(-Math.PI / 2, 0, rotationZ);
  mesh.renderOrder = 1;
  parent.add(mesh);
  return mesh;
}

function addOutlinedBox(
  parent: THREE.Object3D,
  materials: MallMaterialRegistry,
  options: BoxOptions,
) {
  const group = new THREE.Group();
  group.name = `${options.name ?? "hero"}-outlined`;
  group.position.set(...options.position);
  group.rotation.y = options.rotationY ?? 0;

  const geometry = new THREE.BoxGeometry(...options.size);
  const outline = new THREE.Mesh(geometry, materials["outline.ink"]);
  outline.scale.setScalar(1.055);
  outline.renderOrder = -1;
  const surface = new THREE.Mesh(geometry, materials[options.material]);
  group.add(outline, surface);
  parent.add(group);
  return group;
}

function assetMaterialRole(
  source: THREE.Material,
  fallback: MallMaterialRole,
): MallMaterialRole {
  const name = source.name.toLowerCase();
  if (name.includes("screen")) return "unlit.screen";
  if (name.includes("black") || name.includes("dark")) {
    return "toon.environment.dark";
  }
  if (name.includes("button") || name.includes("accept")) {
    return "toon.interactive.acid";
  }
  if (name.includes("decline") || name.includes("red")) {
    return "toon.hero.coral";
  }
  return fallback;
}

function addAsset(
  parent: THREE.Object3D,
  materials: MallMaterialRegistry,
  source: THREE.Group,
  name: string,
  placement: AssetPlacement,
) {
  const asset = cloneMallAsset(source, name);
  asset.position.set(...placement.position);
  asset.rotation.y = placement.rotationY ?? 0;
  if (typeof placement.scale === "number") {
    asset.scale.setScalar(placement.scale);
  } else {
    asset.scale.set(...placement.scale);
  }
  asset.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const sourceMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const replacements = sourceMaterials.map(
      (material) =>
        materials[
          assetMaterialRole(
            material,
            placement.material ?? "toon.environment.light",
          )
        ],
    );
    object.material = Array.isArray(object.material)
      ? replacements
      : replacements[0];
    object.castShadow = true;
    object.receiveShadow = true;
  });
  parent.add(asset);
  return asset;
}

function addBoundaryArchitecture(
  root: THREE.Group,
  materials: MallMaterialRegistry,
  assets: MallAssetLibrary,
) {
  const boundaryBoxes = STATIC_BOXES.slice(1, 8);
  boundaryBoxes.forEach((box, index) => {
    addBox(root, materials, {
      position: box.center,
      size: box.halfExtents.map((value) => value * 2) as [
        number,
        number,
        number,
      ],
      material:
        index === boundaryBoxes.length - 1
          ? "toon.environment.dark"
          : "toon.environment.light",
      name: `collider-aligned-boundary-${index + 1}`,
    });
  });

  // Repeating upper fascia gives the wing a mall rhythm without putting
  // collision-detail geometry into the route.
  for (const z of [-8.92, 8.92]) {
    for (let x = -14; x <= 14; x += 7) {
      addBox(root, materials, {
        position: [x, 2.18, z],
        size: [5.4, 0.78, 0.08],
        material: "toon.environment.dark",
        name: "storefront-fascia",
      });
      addBox(root, materials, {
        position: [x, 2.22, z + (z > 0 ? -0.05 : 0.05)],
        size: [2.7, 0.2, 0.035],
        material: x % 14 === 0 ? "toon.hero.coral" : "decal.print",
        name: "storefront-sign",
      });
    }
  }

  for (let x = -14; x <= 14; x += 7) {
    addBox(root, materials, {
      position: [x, 4.05, 0],
      size: [0.18, 0.2, 17.65],
      material: "toon.environment.dark",
      name: "ceiling-rib",
    });
  }

  // A few curated kit pieces break up the procedural shell without taking
  // ownership of the collision route.
  for (const [index, x] of [-11.5, -2.5, 6.5].entries()) {
    addAsset(root, materials, assets.wallPanel, `aged-store-panel-${index + 1}`, {
      position: [x, 1.18, 8.74],
      rotationY: Math.PI,
      scale: [2.45, 1.2, 0.62],
      material: "toon.environment.light",
    });
  }
  addAsset(root, materials, assets.wallDoorway, "shuttered-retail-doorway", {
    position: [5.8, 0.02, -8.78],
    scale: [2.1, 1.65, 0.72],
    material: "toon.environment.dark",
  });
}

function addFloorAndRoute(
  root: THREE.Group,
  materials: MallMaterialRegistry,
) {
  const floorCollider = STATIC_BOXES[0];
  addBox(root, materials, {
    position: floorCollider.center,
    size: floorCollider.halfExtents.map((value) => value * 2) as [
      number,
      number,
      number,
    ],
    material: "toon.environment.floor",
    name: "mall-floor",
  });

  // Broad inlaid bands make the floor feel authored while also revealing
  // speed and braking distance to the rider.
  for (let x = -15; x <= 15; x += 2) {
    addFloorPrint(
      root,
      materials,
      new THREE.PlaneGeometry(0.045, 17.5),
      [x, FLOOR_Y, 0],
      0,
      "shadow.contact",
    );
  }
  addFloorPrint(
    root,
    materials,
    new THREE.PlaneGeometry(13.5, 0.12),
    [-7.1, FLOOR_Y + 0.003, 4.8],
  ).name = "start-straight-inlay";

  for (let x = -12.5; x <= -1; x += 2.3) {
    addFloorPrint(
      root,
      materials,
      new THREE.PlaneGeometry(0.7, 0.16),
      [x, FLOOR_Y + 0.005, 4.8],
    ).name = "braking-distance-seam";
  }

  // Hairpin judging bands: the inner radius is intentionally coral, while
  // the wider five-metre line stays quiet.
  addFloorPrint(
    root,
    materials,
    new THREE.RingGeometry(2.42, 2.55, 48, 1, Math.PI * 0.48, Math.PI * 1.12),
    [12.8, FLOOR_Y + 0.007, 0],
    0,
    "toon.hero.coral",
  ).name = "hairpin-inner-band";
  addFloorPrint(
    root,
    materials,
    new THREE.RingGeometry(4.9, 5.03, 64, 1, Math.PI * 0.47, Math.PI * 1.08),
    [12.8, FLOOR_Y + 0.006, 0],
  ).name = "hairpin-outer-band";

  // Station four: shallow threshold plus a visibly distinct grip surface.
  addBox(root, materials, {
    position: [7.5, 0.035, -4.75],
    size: [0.18, 0.07, 2.55],
    material: "toon.environment.light",
    name: "surface-threshold",
  });
  addFloorPrint(
    root,
    materials,
    new THREE.PlaneGeometry(3.1, 2.5),
    [5.85, FLOOR_Y + 0.009, -4.75],
    0,
    "toon.environment.dark",
  ).name = "alternate-friction-surface";

  // Graphic route chevrons lead to the arcade but remain decoration, not UI.
  for (const x of [-13, -8.5, -4, 0.5]) {
    const chevron = new THREE.Shape();
    chevron.moveTo(-0.45, -0.22);
    chevron.lineTo(0.15, 0);
    chevron.lineTo(-0.45, 0.22);
    chevron.lineTo(-0.25, 0);
    chevron.closePath();
    addFloorPrint(
      root,
      materials,
      new THREE.ShapeGeometry(chevron),
      [x, FLOOR_Y + 0.008, -4.8],
    );
  }
}

function addSlalomAndAtrium(
  root: THREE.Group,
  materials: MallMaterialRegistry,
  assets: MallAssetLibrary,
) {
  const obstacles = STATIC_BOXES.slice(8, 13);
  obstacles.forEach((box, index) => {
    const [x, y, z] = box.center;
    const [hx, hy, hz] = box.halfExtents;
    const isPlanter = index % 2 === 0;
    addBox(root, materials, {
      position: [x, y, z],
      size: [hx * 2, hy * 2, hz * 2],
      material: isPlanter
        ? "toon.environment.light"
        : "toon.hero.coral",
      name: isPlanter ? "slalom-planter" : "slalom-kiosk",
    });
    if (isPlanter) {
      addAsset(
        root,
        materials,
        assets.pottedPlant,
        index === 4 ? "atrium-hero-plant" : "slalom-potted-plant",
        {
          position: [x, y + hy, z],
          scale: index === 4 ? 1.55 : 0.62,
          rotationY: index * 0.73,
          material: "toon.interactive.acid",
        },
      );
    } else {
      addBox(root, materials, {
        position: [x, y + hy * 0.65, z],
        size: [hx * 1.65, 0.16, hz * 1.65],
        material: "toon.environment.dark",
        name: "kiosk-counter",
      });
      addBox(root, materials, {
        position: [x, y + hy * 0.82, z - hz - 0.012],
        size: [hx * 1.2, 0.24, 0.025],
        material: "unlit.screen",
        name: "kiosk-screen",
      });
    }
  });

  for (const [index, position] of [
    [-13.9, 0, -7.9],
    [-4.9, 0, 7.85],
    [7.8, 0, 7.85],
  ].entries()) {
    addAsset(root, materials, assets.trashcan, `mall-bin-${index + 1}`, {
      position: position as [number, number, number],
      scale: 0.72,
      rotationY: index * 0.55,
      material: "toon.environment.dark",
    });
  }

  addAsset(root, materials, assets.cardboardBoxClosed, "maintenance-box-closed", {
    position: [-5.25, 0, -7.55],
    scale: 0.72,
    rotationY: 0.18,
    material: "toon.environment.light",
  });
  addAsset(root, materials, assets.cardboardBoxOpen, "maintenance-box-open", {
    position: [-4.55, 0, -7.72],
    scale: 0.56,
    rotationY: -0.25,
    material: "toon.environment.light",
  });
}

function addCameraPinchAndImpactCorner(
  root: THREE.Group,
  materials: MallMaterialRegistry,
  assets: MallAssetLibrary,
) {
  STATIC_BOXES.slice(13, 15).forEach((box, index) => {
    const [x, y, z] = box.center;
    const [hx, hy, hz] = box.halfExtents;
    addBox(root, materials, {
      position: [x, y, z],
      size: [hx * 2, hy * 2, hz * 2],
      material: "toon.environment.light",
      name: `camera-pinch-column-${index + 1}`,
    });
    addBox(root, materials, {
      position: [x, y * 2 + 0.28, z],
      size: [1.25, 0.42, 1.25],
      material: "toon.environment.dark",
      name: "camera-pinch-soffit",
    });
    addAsset(root, materials, assets.column, `kit-column-${index + 1}`, {
      position: [x, 0, z],
      scale: [1.02, 1.42, 1.02],
      rotationY: index * (Math.PI / 2),
      material: "toon.environment.light",
    });
  });

  const impact = STATIC_BOXES[15];
  addBox(root, materials, {
    position: impact.center,
    size: impact.halfExtents.map((value) => value * 2) as [
      number,
      number,
      number,
    ],
    material: "toon.hero.coral",
    name: "impact-recovery-wall",
  });
  addBox(root, materials, {
    position: [-4.18, 0.7, -6.05],
    size: [0.3, 1.4, 2.45],
    material: "toon.environment.dark",
    name: "concave-storefront-return",
  });
  addBox(root, materials, {
    position: [-3.1, 1.7, -6.05],
    size: [2.45, 0.42, 0.14],
    material: "decal.print",
    name: "impact-corner-sign",
  });
}

function addArcadeArrival(
  root: THREE.Group,
  materials: MallMaterialRegistry,
  assets: MallAssetLibrary,
) {
  const arcade = new THREE.Group();
  arcade.name = "arcade-arrival";

  // The 1.8 m clear opening begins at x=9.5 and captures the vehicle around
  // the authored trigger at (13.1, -4.8).
  addBox(arcade, materials, {
    position: [9.62, 1.25, -3.72],
    size: [0.24, 2.5, 0.24],
    material: "toon.environment.dark",
    name: "arcade-entry-post-north",
  });
  addBox(arcade, materials, {
    position: [9.62, 1.25, -5.88],
    size: [0.24, 2.5, 0.24],
    material: "toon.environment.dark",
    name: "arcade-entry-post-south",
  });
  addOutlinedBox(arcade, materials, {
    position: [9.64, 2.5, -4.8],
    size: [0.28, 0.8, 2.5],
    material: "toon.interactive.acid",
    name: "arcade-marquee",
  });

  addAsset(arcade, materials, assets.arcadeMachine, "arcade-cabinet-01", {
    position: [11.05, 0, -7.18],
    scale: 0.92,
    rotationY: Math.PI / 2,
    material: "toon.hero.coral",
  });
  addAsset(arcade, materials, assets.clawMachine, "arcade-claw-machine", {
    position: [13.0, 0, -7.16],
    scale: 0.84,
    rotationY: Math.PI / 2,
    material: "toon.interactive.acid",
  });
  addAsset(arcade, materials, assets.vendingMachine, "arcade-vending-machine", {
    position: [14.9, 0, -7.18],
    scale: 0.95,
    rotationY: Math.PI / 2,
    material: "toon.environment.dark",
  });

  addFloorPrint(
    arcade,
    materials,
    new THREE.RingGeometry(1.05, 1.23, 28),
    [13.1, FLOOR_Y + 0.012, -4.8],
    0,
    "toon.interactive.acid",
  ).name = "arcade-capture-zone";
  root.add(arcade);
}

function addEntranceAssets(
  root: THREE.Group,
  materials: MallMaterialRegistry,
  assets: MallAssetLibrary,
) {
  for (const [index, x] of [-14.1, -12.95, -11.8].entries()) {
    addAsset(root, materials, assets.atm, `atm-bank-${index + 1}`, {
      position: [x, 0.69, 7.78],
      scale: 0.55,
      rotationY: Math.PI,
      material: "toon.environment.light",
    });
  }
}

function addLighting(root: THREE.Group) {
  const fill = new THREE.HemisphereLight(0xdce1c5, 0x171813, 0.34);
  fill.name = "mall-hemisphere-fill";
  root.add(fill);

  const key = new THREE.DirectionalLight(0xe8efd5, 1.45);
  key.name = "mall-directional-key";
  key.position.set(-10, 13, 7);
  key.target.position.set(3, 0, -1);
  root.add(key, key.target);

  const arcadeSpill = new THREE.PointLight(0xff8b49, 13, 12, 2.1);
  arcadeSpill.name = "arcade-warm-spill";
  arcadeSpill.position.set(13.2, 2.1, -6.6);
  root.add(arcadeSpill);
}

/**
 * Builds the authored visual layer for the 35×18 m benchmark. Physics and
 * interaction remain owned by the parent runtime; this group shares its world
 * coordinates and can be mounted or disposed independently.
 */
export function createMallArtScene(assets: MallAssetLibrary): MallArtScene {
  const root = new THREE.Group();
  root.name = "mall-art-scene";
  const materials = createMallMaterialRegistry();

  addLighting(root);
  addFloorAndRoute(root, materials);
  addBoundaryArchitecture(root, materials, assets);
  addEntranceAssets(root, materials, assets);
  addSlalomAndAtrium(root, materials, assets);
  addCameraPinchAndImpactCorner(root, materials, assets);
  addArcadeArrival(root, materials, assets);

  root.userData.route = {
    dimensions: [35, 18],
    stations: [
      "start-straight",
      "slalom",
      "atrium-hairpin",
      "surface-threshold",
      "camera-pinch",
      "impact-recovery",
      "arcade-capture",
      "return-lane",
    ],
    arcadeTrigger: [13.1, -4.8],
  };

  return {
    root,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      });
      for (const geometry of geometries) geometry.dispose();
      materials.dispose();
      root.removeFromParent();
      root.clear();
    },
  };
}
