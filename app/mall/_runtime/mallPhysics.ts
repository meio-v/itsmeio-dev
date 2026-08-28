import type RAPIER from "@dimforge/rapier3d-compat";

export type StaticBox = {
  center: [number, number, number];
  halfExtents: [number, number, number];
  bevel?: boolean;
  friction?: number;
};

export const STATIC_BOXES: readonly StaticBox[] = [
  { center: [0, -0.25, 0], halfExtents: [17.5, 0.25, 9] },
  { center: [0, 1.5, 9.25], halfExtents: [17.5, 1.5, 0.25] },
  { center: [0, 1.5, -9.25], halfExtents: [17.5, 1.5, 0.25] },
  { center: [-17.75, 1.5, 0], halfExtents: [0.25, 1.5, 9.5] },
  { center: [17.75, 1.5, 4.8], halfExtents: [0.25, 1.5, 4.4] },
  { center: [17.75, 1.5, -7.4], halfExtents: [0.25, 1.5, 1.9] },
  { center: [13.6, 1.5, -7.8], halfExtents: [4.2, 1.5, 0.22] },
  { center: [9.5, 1.5, -6.5], halfExtents: [0.22, 1.5, 1.45] },
  { center: [2.8, 0.55, 4.8], halfExtents: [0.52, 0.55, 0.52], bevel: true },
  { center: [5.8, 0.55, 3.2], halfExtents: [0.52, 0.55, 0.52], bevel: true },
  { center: [8.6, 0.55, 4.8], halfExtents: [0.52, 0.55, 0.52], bevel: true },
  { center: [11.3, 0.55, 3.05], halfExtents: [0.52, 0.55, 0.52], bevel: true },
  { center: [12.8, 0.55, 0], halfExtents: [1.7, 0.55, 1.7], bevel: true },
  { center: [2.4, 1.3, -2.4], halfExtents: [0.42, 1.3, 0.42], bevel: true },
  { center: [5.7, 1.3, -4.2], halfExtents: [0.42, 1.3, 0.42], bevel: true },
  { center: [-2.2, 0.7, -4.7], halfExtents: [2.2, 0.7, 0.24] },
  { center: [7.5, 0.035, -4.75], halfExtents: [0.09, 0.035, 1.275], bevel: true },
  { center: [5.85, 0.005, -4.75], halfExtents: [1.55, 0.005, 1.25], friction: 0.45 },
  { center: [-4.18, 0.7, -6.05], halfExtents: [0.15, 0.7, 1.225] },
] as const;

export function createMallColliders(world: RAPIER.World, rapier: typeof RAPIER) {
  for (const box of STATIC_BOXES) {
    const body = world.createRigidBody(
      rapier.RigidBodyDesc.fixed().setTranslation(...box.center),
    );
    const descriptor = (box.bevel
      ? rapier.ColliderDesc.roundCuboid(...box.halfExtents, 0.12)
      : rapier.ColliderDesc.cuboid(...box.halfExtents))
      .setFriction(box.friction ?? 1.05)
      .setRestitution(0.02);
    world.createCollider(descriptor, body);
  }
}
