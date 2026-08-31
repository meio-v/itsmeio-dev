# Ride Lab rider pipeline

> **Authoring decision:** `docs/adr/0001-blender-mcp-native-asset-authoring.md`
> supersedes the prototype's headless-builder and runtime-base-pose workflow.
> The reviewed Blender MCP scene now owns production geometry, rigging, and the
> canonical seated pose; Three.js owns bounded gameplay response only.

This note records the working Kenney rider before the streetwear kitbash. The
Kenney output is the compatibility target; the kitbash changes visual geometry,
not the Ride Lab character system.

## Measured baseline

`assets/authoring/ride-lab/kenney-runtime-rig.glb` is a 104,928-byte GLB converted
from Kenney Animated Characters 1.0 `Model/characterMedium.fbx`. Its selected
colour map is retained as the authoring-only 1024² indexed PNG
`kenney-runtime-rig.png`.

| Property | Kenney baseline |
| --- | ---: |
| Scene nodes | 61 |
| Skinned mesh nodes | 1 (`characterMedium`) |
| Mesh primitives | 1 |
| Vertices | 1,029 |
| Triangles | 1,604 |
| Source materials | 1 |
| Runtime rider materials | 2 (toon surface + inverted-hull outline) |
| Textures | 1 external colour map + shared generated toon ramp |
| Skins | 1 |
| Skin joints | 45 |
| Animation clips | 0 |
| Approximate rider draw calls | 2 (surface + outline) |
| Full measured Ride Lab draw calls | 70 |

Geometry is intentionally small. Streetwear geometry may spend more triangles
on the five dominant silhouette shapes, but should remain in the same runtime
class and avoid importing complete donor kits.

## Hierarchy and axes

The GLB scene root is `RootNode`. It owns the armature/control hierarchy and the
single `characterMedium` skinned mesh. The exported mesh node carries the FBX
normalization transform (X rotation approximately -90 degrees and scale 100);
the scene root itself is identity.

The runtime-required deform chain is:

```text
Hips
├── Spine → Chest → UpperChest → Neck → Head
├── LeftUpLeg → LeftLeg → LeftFoot → LeftToes
├── RightUpLeg → RightLeg → RightFoot → RightToes
└── Chest
    ├── LeftShoulder → LeftArm → LeftForeArm → LeftHand
    └── RightShoulder → RightArm → RightForeArm → RightHand
```

The skin also retains Kenney's foot, knee, hips, and roll control nodes. Runtime
code addresses deform bones by stable names rather than joint indices. Ride Lab
uses Three.js Y-up coordinates and vehicle-forward +Z after normalization.

## Runtime attachment and pose controller

`rideLabVehicleVisual.ts` loads the scooter GLB, rider GLB, and rider texture in
parallel. The parent chain is:

```text
vehiclePose (Jolt chassis transform)
└── ride-lab-curated-vehicle
    └── ride-lab-vehicle-lean
        └── ride-lab-sprung-body
            └── curated-rider-placement
                └── Kenney rider scene
```

`curated-rider-placement` uses scale `0.48` and X rotation `0.72` radians. Its
translation is computed at load time by moving `Hips` to the scooter seat anchor
`(0, 0.43, -0.24)`. These are model-specific normalization values, not physics
or collider changes.

There is no `AnimationMixer`, clip state machine, or root motion. Each rendered
frame derives a bounded pose from Ride Lab input and physical presentation:

- hips/spine/chest/head receive lean, shoulder yaw, counter-lean, and throttle tuck;
- arm and forearm rest quaternions receive steering and preload offsets;
- thigh and lower-leg rest quaternions receive the seated pose;
- a short CCD solve places both hands on moving handlebar anchors and both feet
  on fixed scooter anchors.

The Jolt chassis, wheels, ramp, wall, hitboxes, and collider assumptions remain
owned by `JoltRidePhysics.ts`. Render meshes never supply collision. Controls,
camera presentation, physics stepping, and lifecycle remain owned by
`RideLabRuntime.ts`; the visual adapter only consumes snapshots and returns
contact/presentation telemetry.

## Materials, import, and teardown

The source material is replaced at runtime by one nearest-filtered toon material
using the selected colour map and the shared four-band ramp. The single skinned
mesh is cloned once for the thin inverted-hull outline. Geometry, materials,
texture, generated ramp, and each unique skeleton are explicitly disposed on
teardown.

The current asset was converted with `fbx2gltf@0.9.7-p1`; unused source clips
were omitted. Exact archive and output checksums live in
`docs/assets/mall-asset-provenance.md` and are enforced by
`scripts/verify-ride-lab-assets.mjs`.

## Streetwear integration contract

The streetwear output will preserve the Kenney scene orientation, 45-joint skin,
stable deform-bone names, bind-space scale, scooter parent chain, seat/grip/foot
anchors, direct pose controller, and disposal ownership. Girush and the approved
CC0 clothing are geometry donors only.

Authoring meshes remain logically modular as `body`, `hair`, `hoodie`,
`undershirt`, `cargo-shorts`, `left-calf`, `right-calf`, `left-shoe`, and
`right-shoe`. They bind to the existing Kenney-compatible armature. No second
animation system, root-motion layer, collider, or character controller is added.
Hidden body faces are removed only after the seated deformation is stable.

## Repeatable visual validation

Each kitbash stage is captured from the actual Ride Lab camera with
`scripts/capture-streetwear-rider.mjs <stage-label>`. The capture set contains
idle, right turn, left turn, and acceleration views plus the runtime seat, hand,
elbow, head-tuck, and speed telemetry for those exact frames. A generated
contact sheet keeps camera, viewport, and comparison order fixed between stages.
The positioning sheet freezes the actual runtime pose and renders fixed rear,
front, left-profile, right-profile, and elevated three-quarter cameras for idle,
right steering, and acceleration. It is the required check for hip placement,
knee bend, footboard contact, wrist reach, torso pitch, and scooter/rider scale;
the ordinary gameplay camera remains the silhouette authority.

These captures can prove contact stability, symmetry, deformation regressions,
and whether the five dominant shapes remain readable at gameplay distance. They
cannot approve taste: hair, oversized hoodie, huge shorts, skinny calves, giant
shoes, and any remaining clipping are explicit human review gates.

The side-profile positioning target is a rider seated into the scooter: hips over
the forward half of the seat, a slight forward torso pitch, knees dropping
forward around the leg shield, feet planted on the floorboard, and relaxed elbows
reaching down toward the grips. Oversized clothes and shoes may exaggerate the
outline but may not erase those underlying contact relationships.
