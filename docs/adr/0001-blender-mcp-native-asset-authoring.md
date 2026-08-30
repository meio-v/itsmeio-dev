# ADR 0001: Blender MCP-native authoring for Ride Lab assets

- Status: Accepted
- Date: 2026-08-30
- Scope: Ride Lab rider, scooter, their rigs, contact pose, materials, and authored mesh detail

## Context

The first Ride Lab experiments used generated Blender Python geometry and
Three.js runtime posing to iterate quickly. Those approaches made numeric
outputs repeatable, but they split visual ownership across Python, Blender, and
Three.js. An endpoint could report correct contact while the visible knee,
sole, clothing, grip, or silhouette remained wrong.

The scooter also accumulated procedural runtime prototypes while the intended
production workflow was native Blender authoring. Continuing either pattern
would make direct visual correction and review unnecessarily difficult.

## Decision

Production rider and scooter assets are authored natively in the open Blender
scene through Blender MCP.

The reviewed `.blend` file is the editable source of truth. A GLB exported from
that reviewed scene is the runtime delivery artifact. Three.js consumes the
export and owns gameplay presentation, not primary modeling or the canonical
seated pose.

For the rider:

1. Blender owns body and garment geometry, weights, rig controls, pelvis/seat
   placement, readable knee bends, planted soles, torso posture, grip posture,
   corrective deformation, and the approved canonical seated pose.
2. The seated pose is created with Blender controls and constraints, reviewed
   from fixed front, rear, left, right, high-three-quarter, and gameplay views,
   then baked on an export duplicate or exported as a documented baked action.
3. Three.js may add bounded secondary response such as steering lean, elbow
   flare, head tuck, suspension, and moving-grip correction. It must not rebuild
   the base seated pose or compensate for broken weights or geometry.

For the scooter:

1. Blender owns silhouette, panel breaks, modeled surface detail, part
   separation, pivots, anchors, and authored material assignments.
2. Runtime-generated geometry may be used only as a disposable prototype. It
   must be removed when the equivalent reviewed Blender geometry is integrated.

Blender Python may still be used *inside the visible Blender MCP workflow* for
small, inspectable operations requested through Blender MCP. It may not be used
as a hidden headless replacement for modeling, posing, visual review, or asset
approval.

Repository scripts may validate exports, inspect metadata, capture browser
evidence, and verify deterministic runtime contracts. They must not be the
production authoring source for rider or scooter meshes and poses.

## Required handoff

Each production asset handoff includes:

- the reviewed `.blend` source;
- the exported GLB;
- fixed-view Blender captures;
- matching runtime captures;
- documented scale, axes, pivots, anchors, bones, actions, and export settings;
- automated contract-validation results;
- explicit unresolved human visual gates.

Bone-origin or anchor-distance measurements are diagnostic only. Visible mesh
contact—shorts on seat, knees reading in profile, soles on the floorboard, and
palms on grips—is the acceptance criterion.

## Consequences

- Visual iteration becomes slower to automate but substantially easier to
  inspect, correct, and teach.
- Blender MCP availability is a prerequisite for production asset changes.
- Existing headless asset builders are migration history only; production
  gates may not invoke them as the authoring source.
- Existing headless browser checks remain valid because they test the web
  runtime rather than authoring 3D assets.
- Any future agent that cannot access Blender MCP must stop at analysis,
  validation, or integration work and must not silently fall back to headless
  Blender generation.

## Superseded guidance

This decision supersedes repository language that treats generated Python
geometry as the production source of truth or asks Three.js to construct the
canonical rider pose. Historical provenance remains accurate for artifacts
created before this decision.
