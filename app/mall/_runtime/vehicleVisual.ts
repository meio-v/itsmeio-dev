import * as THREE from "three";

function toon(color: number) {
  return new THREE.MeshToonMaterial({ color });
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

export type VehicleVisual = {
  root: THREE.Group;
  lean: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  dispose(): void;
};

export function createVehicleVisual(): VehicleVisual {
  const root = new THREE.Group();
  root.name = "moped-root";
  const lean = new THREE.Group();
  lean.name = "moped-visual-lean";
  root.add(lean);

  const ink = toon(0x19132d);
  const hotPink = toon(0xff3d81);
  const cream = toon(0xffe7c7);
  const cyan = toon(0x34d7da);
  const skin = toon(0xc87952);
  const visor = new THREE.MeshToonMaterial({ color: 0xb9f7ff, emissive: 0x193c49 });
  const materials = [ink, hotPink, cream, cyan, skin, visor];

  const wheelGeometry = new THREE.CylinderGeometry(0.33, 0.33, 0.13, 12);
  const frontWheel = new THREE.Group();
  const rearWheel = new THREE.Group();
  frontWheel.position.set(0.68, -0.37, 0);
  rearWheel.position.set(-0.66, -0.37, 0);
  frontWheel.add(mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]));
  rearWheel.add(mesh(wheelGeometry, ink, [0, 0, 0], [Math.PI / 2, 0, 0]));
  lean.add(frontWheel, rearWheel);

  lean.add(
    mesh(new THREE.CapsuleGeometry(0.25, 0.85, 3, 8), hotPink, [-0.05, -0.04, 0], [0, 0, Math.PI / 2]),
    mesh(new THREE.BoxGeometry(0.5, 0.12, 0.34), ink, [-0.3, 0.18, 0]),
    mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), ink, [0.5, 0.25, 0], [0, 0, -0.18]),
    mesh(new THREE.BoxGeometry(0.11, 0.08, 0.72), ink, [0.48, 0.51, 0]),
    mesh(new THREE.SphereGeometry(0.12, 10, 8), cyan, [0.72, 0.14, 0]),
  );

  const rider = new THREE.Group();
  rider.name = "rider";
  rider.position.set(-0.18, 0.35, 0);
  rider.add(
    mesh(new THREE.CapsuleGeometry(0.17, 0.45, 3, 7), cyan, [0, 0.37, 0], [0, 0, -0.18]),
    mesh(new THREE.SphereGeometry(0.2, 10, 7), skin, [0.06, 0.81, 0]),
    mesh(new THREE.SphereGeometry(0.23, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), cream, [0.06, 0.88, 0]),
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
  lean.add(rider);

  return {
    root,
    lean,
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
