import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { RideLabSnapshot } from "./rideLabTypes";
import { createRideLabVehicleVisual, RIDE_LAB_VEHICLE_ALIGNMENT, type RideLabVehicleMetrics, type RideLabVehicleVisual } from "./rideLabVehicleVisual";

export type CharacterPrototypeVariant = "A" | "B" | "C";
export type CharacterPrototypePose = "idle" | "turn-left" | "turn-right" | "accelerate" | "brake";
export type CharacterPrototypeView = "rear" | "front" | "left" | "right" | "high";

type CharacterPrototypeRuntimeOptions = {
  canvas: HTMLCanvasElement;
  onMetrics(metrics: CharacterPrototypeMetrics): void;
};

export type CharacterPrototypeMetrics = {
  drawCalls: number;
  triangles: number;
  seatErrorMeters: number;
  leftHandErrorMeters: number;
  rightHandErrorMeters: number;
  leftFootErrorMeters: number;
  rightFootErrorMeters: number;
};

const CAMERA_OFFSETS: Record<CharacterPrototypeView, THREE.Vector3Tuple> = {
  rear: [0, 1.55, -3.2],
  front: [0, 1.45, 3.2],
  left: [-3.8, 1.25, 0],
  right: [3.8, 1.25, 0],
  high: [-2.7, 2.3, -2.7],
};

const BASE_SNAPSHOT: RideLabSnapshot = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  speedMps: 0,
  horizontalSpeedMps: 0,
  accelerationMps2: 0,
  verticalSpeedMps: 0,
  leanRadians: 0,
  grounded: true,
  wheelContacts: 2,
  frontSuspensionLoad: 0,
  rearSuspensionLoad: 0,
  rearSlip: 0,
  preload: 0,
  hoverEnergy: 1,
  airtimeSeconds: 0,
  aerialPhase: "grounded",
  grinding: false,
  grindReleaseSpeedMps: 0,
  acceptedInput: { throttle: 0, brake: 0, steer: 0, reset: false, aerialAction: false },
  eventPulse: "idle",
  movementTransition: "idle",
  intent: { throttle: 0, brake: 0, steer: 0 },
};

function snapshotForPose(pose: CharacterPrototypePose): RideLabSnapshot {
  const steer = pose === "turn-left" ? -1 : pose === "turn-right" ? 1 : 0;
  const throttle = pose === "accelerate" ? 1 : 0;
  const brake = pose === "brake" ? 1 : 0;
  return {
    ...BASE_SNAPSHOT,
    accelerationMps2: throttle ? 3 : brake ? -5 : 0,
    acceptedInput: { ...BASE_SNAPSHOT.acceptedInput, throttle, brake, steer },
    eventPulse: throttle ? "throttle" : brake ? "brake" : steer ? "steer" : "idle",
    intent: { throttle, brake, steer },
  };
}

function isInside(object: THREE.Object3D, ancestor: THREE.Object3D) {
  for (let candidate: THREE.Object3D | null = object; candidate; candidate = candidate.parent) {
    if (candidate === ancestor) return true;
  }
  return false;
}

type SkinAttribute = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
type BoneEdge = readonly [parent: THREE.Bone, child: THREE.Bone];

function skinComponent(attribute: SkinAttribute, vertexIndex: number, componentIndex: number) {
  if (componentIndex === 0) return attribute.getX(vertexIndex);
  if (componentIndex === 1) return attribute.getY(vertexIndex);
  if (componentIndex === 2) return attribute.getZ(vertexIndex);
  return attribute.getW(vertexIndex);
}

function collectUsedSkinBones(root: THREE.Object3D) {
  const usedBones = new Set<THREE.Bone>();
  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    const skinIndex = object.geometry.getAttribute("skinIndex");
    const skinWeight = object.geometry.getAttribute("skinWeight");
    if (!skinIndex || !skinWeight) return;

    const componentCount = Math.min(4, skinIndex.itemSize, skinWeight.itemSize);
    for (let vertexIndex = 0; vertexIndex < skinWeight.count; vertexIndex += 1) {
      for (let componentIndex = 0; componentIndex < componentCount; componentIndex += 1) {
        if (skinComponent(skinWeight, vertexIndex, componentIndex) <= 1e-5) continue;
        const boneIndex = Math.trunc(skinComponent(skinIndex, vertexIndex, componentIndex));
        const bone = object.skeleton.bones[boneIndex];
        if (bone) usedBones.add(bone);
      }
    }
  });
  return usedBones;
}

function connectUsedSkinBones(usedBones: ReadonlySet<THREE.Bone>) {
  const edges: BoneEdge[] = [];
  for (const child of usedBones) {
    let ancestor: THREE.Object3D | null = child.parent;
    while (ancestor && (!(ancestor instanceof THREE.Bone) || !usedBones.has(ancestor))) {
      ancestor = ancestor.parent;
    }
    if (ancestor instanceof THREE.Bone) edges.push([ancestor, child]);
  }
  return edges;
}

class UsedSkinBoneOverlay extends THREE.LineSegments {
  private readonly edges: BoneEdge[];
  private readonly positions: THREE.BufferAttribute;
  private readonly worldPosition = new THREE.Vector3();

  constructor(root: THREE.Object3D) {
    const edges = connectUsedSkinBones(collectUsedSkinBones(root));
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3);
    positions.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("position", positions);
    const material = new THREE.LineBasicMaterial({
      color: 0x54d8ff,
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    super(geometry, material);
    this.edges = edges;
    this.positions = positions;
    this.frustumCulled = false;
    this.renderOrder = 20;
    this.name = "used-skin-bone-overlay";
    this.update();
  }

  update() {
    for (let edgeIndex = 0; edgeIndex < this.edges.length; edgeIndex += 1) {
      const [parent, child] = this.edges[edgeIndex];
      parent.getWorldPosition(this.worldPosition);
      this.positions.setXYZ(edgeIndex * 2, this.worldPosition.x, this.worldPosition.y, this.worldPosition.z);
      child.getWorldPosition(this.worldPosition);
      this.positions.setXYZ(edgeIndex * 2 + 1, this.worldPosition.x, this.worldPosition.y, this.worldPosition.z);
    }
    this.positions.needsUpdate = true;
  }

  dispose() {
    this.geometry.dispose();
    const materials = Array.isArray(this.material) ? this.material : [this.material];
    for (const material of materials) material.dispose();
  }
}

export class CharacterPrototypeRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.05, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly resizeObserver: ResizeObserver;
  private readonly vehicle: RideLabVehicleVisual;
  private readonly rider: THREE.Object3D;
  private readonly riderPlacement: THREE.Object3D;
  private readonly skeletonOverlay: UsedSkinBoneOverlay;
  private readonly anchorHelpers = new THREE.Group();
  private readonly gripHelpers = new THREE.Group();
  private readonly restBones = new Map<THREE.Bone, THREE.Quaternion>();
  private readonly placementPosition: THREE.Vector3;
  private readonly placementQuaternion: THREE.Quaternion;
  private readonly placementScale: THREE.Vector3;
  private animationFrame = 0;
  private disposed = false;
  private variant: CharacterPrototypeVariant = "A";
  private pose: CharacterPrototypePose = "idle";
  private metrics: RideLabVehicleMetrics | null = null;

  private constructor(options: CharacterPrototypeRuntimeOptions, vehicle: RideLabVehicleVisual) {
    this.options = options;
    this.vehicle = vehicle;
    this.rider = vehicle.root.getObjectByName("girush-streetwear-rider") ?? (() => { throw new Error("Streetwear rider is missing from the character prototype"); })();
    this.riderPlacement = vehicle.root.getObjectByName("curated-rider-placement") ?? (() => { throw new Error("Rider placement is missing from the character prototype"); })();
    this.placementPosition = this.riderPlacement.position.clone();
    this.placementQuaternion = this.riderPlacement.quaternion.clone();
    this.placementScale = this.riderPlacement.scale.clone();
    this.rider.traverse((object) => {
      if (object instanceof THREE.Bone) this.restBones.set(object, object.quaternion.clone());
    });

    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color(0x140f24);
    this.scene.fog = new THREE.Fog(0x140f24, 12, 30);
    this.scene.add(vehicle.root);

    const hemi = new THREE.HemisphereLight(0xfff0d0, 0x171126, 2.1);
    const key = new THREE.DirectionalLight(0xffe6c5, 4.2);
    key.position.set(-4, 7, 4);
    key.castShadow = true;
    this.scene.add(hemi, key);
    const grid = new THREE.GridHelper(20, 40, 0xff4f98, 0x51466e);
    grid.position.y = -0.02;
    this.scene.add(grid);

    this.skeletonOverlay = new UsedSkinBoneOverlay(this.rider);
    this.scene.add(this.skeletonOverlay);
    this.createAnchorHelpers();
    vehicle.body.add(this.anchorHelpers);
    const handlebar = vehicle.root.getObjectByName("curated-handlebar-steer");
    if (!handlebar) throw new Error("Handlebar reference is missing from the character prototype");
    handlebar.add(this.gripHelpers);

    this.controls = new OrbitControls(this.camera, options.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 10;
    this.controls.minDistance = 1.4;
    this.camera.position.set(...CAMERA_OFFSETS.front);
    this.controls.target.set(0, 1.25, 0);
    this.controls.update();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(options.canvas);
    this.resize();
    this.setVariant("A");
  }

  private readonly options: CharacterPrototypeRuntimeOptions;

  static async create(options: CharacterPrototypeRuntimeOptions) {
    const vehicle = await createRideLabVehicleVisual();
    if (vehicle.asset !== "streetwear") {
      vehicle.dispose();
      throw new Error("The streetwear rider could not be loaded");
    }
    return new CharacterPrototypeRuntime(options, vehicle);
  }

  private createAnchorHelpers() {
    const anchors = [
      [RIDE_LAB_VEHICLE_ALIGNMENT.seatAnchor, 0xffee75],
      [RIDE_LAB_VEHICLE_ALIGNMENT.leftFootAnchor, 0xff6ca8],
      [RIDE_LAB_VEHICLE_ALIGNMENT.rightFootAnchor, 0xff6ca8],
    ] as const;
    for (const [anchor, color] of anchors) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 10, 8),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.9 }),
      );
      marker.position.set(anchor.x, anchor.y, anchor.z);
      marker.renderOrder = 30;
      this.anchorHelpers.add(marker);
    }
    for (const anchor of [RIDE_LAB_VEHICLE_ALIGNMENT.leftGripOffset, RIDE_LAB_VEHICLE_ALIGNMENT.rightGripOffset]) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x54d8ff, depthTest: false, transparent: true, opacity: 0.9 }),
      );
      marker.position.set(anchor.x, anchor.y, anchor.z);
      marker.renderOrder = 30;
      this.gripHelpers.add(marker);
    }
  }

  private restoreRestPose() {
    for (const [bone, quaternion] of this.restBones) bone.quaternion.copy(quaternion);
    this.rider.updateMatrixWorld(true);
  }

  private setScooterVisibility(visible: boolean) {
    this.vehicle.root.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        object.visible = isInside(object, this.rider) || visible;
      }
    });
  }

  setVariant(variant: CharacterPrototypeVariant) {
    this.variant = variant;
    this.restoreRestPose();
    if (variant === "A") {
      this.setScooterVisibility(false);
      this.riderPlacement.position.set(0, 0, 0);
      this.riderPlacement.quaternion.identity();
      this.riderPlacement.scale.copy(this.placementScale);
      this.skeletonOverlay.visible = true;
      this.anchorHelpers.visible = false;
      this.gripHelpers.visible = false;
      this.pose = "idle";
      this.controls.target.set(0, 0.9, 0);
      this.camera.position.set(0, 1.05, 3.2);
    } else {
      this.setScooterVisibility(true);
      this.riderPlacement.position.copy(this.placementPosition);
      this.riderPlacement.quaternion.copy(this.placementQuaternion);
      this.riderPlacement.scale.copy(this.placementScale);
      this.skeletonOverlay.visible = variant === "B";
      this.anchorHelpers.visible = variant === "B";
      this.gripHelpers.visible = variant === "B";
      this.applyPose(this.pose);
      this.controls.target.set(0, 0.78, 0);
      this.camera.position.set(...CAMERA_OFFSETS.left);
    }
    this.controls.update();
  }

  setPose(pose: CharacterPrototypePose) {
    this.pose = pose;
    if (this.variant !== "A") this.applyPose(pose);
  }

  private applyPose(pose: CharacterPrototypePose) {
    this.restoreRestPose();
    this.metrics = this.vehicle.update(snapshotForPose(pose), 3);
  }

  setView(view: CharacterPrototypeView) {
    const offset = CAMERA_OFFSETS[view];
    this.camera.position.set(offset[0], offset[1], offset[2]);
    this.controls.target.set(0, this.variant === "A" ? 0.9 : 0.78, 0);
    this.controls.update();
  }

  start() {
    const frame = () => {
      if (this.disposed) return;
      this.controls.update();
      this.skeletonOverlay.update();
      this.renderer.render(this.scene, this.camera);
      this.options.onMetrics({
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        seatErrorMeters: this.metrics?.seatErrorMeters ?? 0,
        leftHandErrorMeters: this.metrics?.leftHandErrorMeters ?? 0,
        rightHandErrorMeters: this.metrics?.rightHandErrorMeters ?? 0,
        leftFootErrorMeters: this.metrics?.leftFootErrorMeters ?? 0,
        rightFootErrorMeters: this.metrics?.rightFootErrorMeters ?? 0,
      });
      this.animationFrame = requestAnimationFrame(frame);
    };
    this.animationFrame = requestAnimationFrame(frame);
  }

  private resize() {
    const width = Math.max(1, this.options.canvas.clientWidth);
    const height = Math.max(1, this.options.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.skeletonOverlay.dispose();
    this.anchorHelpers.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    this.gripHelpers.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    this.vehicle.dispose();
    this.renderer.dispose();
  }
}
