import * as THREE from "three";

import { STATIC_BOXES } from "../mallPhysics";
import {
  createMallMaterialRegistry,
  type MallMaterialRegistry,
  type MallMaterialRole,
} from "./mallMaterials";

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

function addBoundaryArchitecture(
  root: THREE.Group,
  materials: MallMaterialRegistry,
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
      const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(index === 4 ? 1.28 : 0.48, 0),
        materials["toon.interactive.acid"],
      );
      leaves.name = "graphic-planter-canopy";
      leaves.position.set(x, y + hy + (index === 4 ? 0.82 : 0.32), z);
      root.add(leaves);
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
}

function addCameraPinchAndImpactCorner(
  root: THREE.Group,
  materials: MallMaterialRegistry,
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

  for (const x of [11.1, 13.0, 14.9]) {
    const cabinet = new THREE.Group();
    cabinet.position.set(x, 0, -7.15);
    cabinet.rotation.y = Math.PI / 2;
    addBox(cabinet, materials, {
      position: [0, 0.7, 0],
      size: [0.78, 1.4, 0.72],
      material: "toon.environment.dark",
      name: "arcade-cabinet",
    });
    addBox(cabinet, materials, {
      position: [-0.38, 0.91, 0],
      size: [0.035, 0.46, 0.5],
      material: "unlit.screen",
      name: "arcade-screen",
    });
    addBox(cabinet, materials, {
      position: [-0.43, 0.54, 0],
      size: [0.22, 0.08, 0.58],
      material: "toon.hero.coral",
      name: "arcade-control-deck",
    });
    arcade.add(cabinet);
  }

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

function addLighting(root: THREE.Group) {
  const fill = new THREE.HemisphereLight(0xf4edda, 0x28243e, 1.65);
  fill.name = "mall-hemisphere-fill";
  root.add(fill);

  const key = new THREE.DirectionalLight(0xfff0d2, 2.55);
  key.name = "mall-directional-key";
  key.position.set(-9, 14, 8);
  key.target.position.set(3, 0, -1);
  key.castShadow = false;
  root.add(key, key.target);
}

/**
 * Builds the authored visual layer for the 35×18 m benchmark. Physics and
 * interaction remain owned by the parent runtime; this group shares its world
 * coordinates and can be mounted or disposed independently.
 */
export function createMallArtScene(): MallArtScene {
  const root = new THREE.Group();
  root.name = "mall-art-scene";
  const materials = createMallMaterialRegistry();

  addLighting(root);
  addFloorAndRoute(root, materials);
  addBoundaryArchitecture(root, materials);
  addSlalomAndAtrium(root, materials);
  addCameraPinchAndImpactCorner(root, materials);
  addArcadeArrival(root, materials);

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
