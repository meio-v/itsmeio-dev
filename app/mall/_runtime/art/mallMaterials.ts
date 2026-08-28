import * as THREE from "three";

export const MALL_SWATCHES = {
  ink: 0x17152a,
  deepIndigo: 0x292844,
  floorSlate: 0x686d88,
  tileLight: 0xdad0b6,
  plaster: 0xeee3c9,
  coral: 0xff5f72,
  acid: 0xb9e45a,
  screenCyan: 0x75e6e5,
  shadow: 0x242139,
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
  return material;
}

export function createMallMaterialRegistry(): MallMaterialRegistry {
  // Four values produce graphic lighting steps without baking a palette into
  // every asset. The texture is luminance data, not display colour data.
  const gradientMap = new THREE.DataTexture(
    new Uint8Array([38, 104, 181, 255]),
    4,
    1,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  gradientMap.name = "mall-four-band-toon-ramp";
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
      opacity: 0.38,
      depthWrite: false,
    }),
    "outline.ink": new THREE.MeshBasicMaterial({
      color: MALL_SWATCHES.ink,
      side: THREE.BackSide,
    }),
  } satisfies Record<MallMaterialRole, THREE.Material>;

  for (const [role, material] of Object.entries(materials)) {
    material.name = role;
    // The environment already uses authored inverted-hull accents. Excluding
    // its shared materials from OutlineEffect avoids a second full-scene pass;
    // the moving moped retains the effect's hero outline.
    material.userData.outlineParameters = { visible: false };
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
