import * as THREE from "three";

export const MALL_SWATCHES = {
  ink: 0x090909,
  deepIndigo: 0x27282b,
  floorSlate: 0x777a70,
  tileLight: 0xd5caa9,
  plaster: 0xe2d8b9,
  coral: 0xf23f78,
  acid: 0xc8f23d,
  screenCyan: 0x60dce2,
  shadow: 0x050505,
} as const;

export type MallMaterialRole =
  | "toon.environment.dark"
  | "toon.environment.floor"
  | "toon.environment.light"
  | "toon.hero.coral"
  | "toon.interactive.acid"
  | "unlit.screen"
  | "decal.print"
  | "shadow.contact"
  | "outline.ink";

export type MallMaterialRegistry = Record<MallMaterialRole, THREE.Material> & {
  gradientMap: THREE.DataTexture;
  dispose(): void;
};

function toon(
  color: number,
  gradientMap: THREE.Texture,
  name: MallMaterialRole,
) {
  const material = new THREE.MeshToonMaterial({ color, gradientMap });
  material.name = name;
  material.userData.outlineParameters = {
    visible: name === "toon.hero.coral" || name === "toon.interactive.acid",
  };
  return material;
}

export function createMallMaterialRegistry(): MallMaterialRegistry {
  // Three abrupt values retain a near-black floor under hard light instead of
  // smoothing every imported asset back into generic low-poly rendering.
  const gradientMap = new THREE.DataTexture(
    new Uint8Array([12, 118, 255]),
    3,
    1,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  gradientMap.name = "mall-three-band-toon-ramp";
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.colorSpace = THREE.NoColorSpace;
  gradientMap.needsUpdate = true;

  const materials = {
    "toon.environment.dark": toon(
      MALL_SWATCHES.deepIndigo,
      gradientMap,
      "toon.environment.dark",
    ),
    "toon.environment.floor": toon(
      MALL_SWATCHES.floorSlate,
      gradientMap,
      "toon.environment.floor",
    ),
    "toon.environment.light": toon(
      MALL_SWATCHES.plaster,
      gradientMap,
      "toon.environment.light",
    ),
    "toon.hero.coral": toon(
      MALL_SWATCHES.coral,
      gradientMap,
      "toon.hero.coral",
    ),
    "toon.interactive.acid": toon(
      MALL_SWATCHES.acid,
      gradientMap,
      "toon.interactive.acid",
    ),
    "unlit.screen": new THREE.MeshBasicMaterial({
      color: MALL_SWATCHES.screenCyan,
    }),
    "decal.print": new THREE.MeshBasicMaterial({
      color: MALL_SWATCHES.tileLight,
      side: THREE.DoubleSide,
    }),
    "shadow.contact": new THREE.MeshBasicMaterial({
      color: MALL_SWATCHES.shadow,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
    "outline.ink": new THREE.MeshBasicMaterial({
      color: MALL_SWATCHES.ink,
      side: THREE.BackSide,
    }),
  } satisfies Record<MallMaterialRole, THREE.Material>;

  for (const [role, material] of Object.entries(materials)) {
    material.name = role;
    material.userData.outlineParameters ??= { visible: false };
  }

  return {
    ...materials,
    gradientMap,
    dispose() {
      for (const material of Object.values(materials)) material.dispose();
      gradientMap.dispose();
    },
  };
}
