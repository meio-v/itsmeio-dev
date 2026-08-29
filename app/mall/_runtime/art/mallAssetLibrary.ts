import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MALL_ASSET_URLS = {
  arcadeMachine: "/mall/assets/arcade-machine.glb",
  atm: "/mall/assets/atm.glb",
  cardboardBoxClosed: "/mall/assets/cardboard-box-closed.glb",
  cardboardBoxOpen: "/mall/assets/cardboard-box-open.glb",
  clawMachine: "/mall/assets/claw-machine.glb",
  column: "/mall/assets/column.glb",
  pottedPlant: "/mall/assets/potted-plant.glb",
  rider: "/mall/assets/rider.glb",
  scooter: "/mall/assets/scooter.glb",
  trashcan: "/mall/assets/trashcan.glb",
  vendingMachine: "/mall/assets/vending-machine.glb",
  wallDoorway: "/mall/assets/wall-doorway.glb",
  wallPanel: "/mall/assets/wall-panel.glb",
} as const;

export type MallAssetKey = keyof typeof MALL_ASSET_URLS;
export type MallAssetLibrary = Record<MallAssetKey, THREE.Group>;

export async function loadMallAssetLibrary(): Promise<MallAssetLibrary> {
  const loader = new GLTFLoader();
  const entries = await Promise.all(
    Object.entries(MALL_ASSET_URLS).map(async ([key, url]) => {
      const gltf = await loader.loadAsync(url);
      gltf.scene.name = `mall-asset:${key}`;
      return [key, gltf.scene] as const;
    }),
  );
  return Object.fromEntries(entries) as MallAssetLibrary;
}

export function cloneMallAsset(asset: THREE.Group, name: string) {
  const clone = asset.clone(true);
  clone.name = name;
  return clone;
}
