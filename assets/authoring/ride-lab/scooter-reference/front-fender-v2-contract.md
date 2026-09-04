# Ride Lab front fender V2 modeling contract

This contract and `front-fender-focused-v2.png` are the accepted-authority
candidate for the front fender. The PNG owns exterior silhouette and panel
language. This contract owns numeric registration, attachment, topology, and
clearance requirements. Where raster labels are abbreviated or ambiguous,
this contract wins.

## Scope and ownership

- Deliver one lightweight, closed-manifold fender shell with one preview
  material region for the dark underside. The underside is not separate
  production geometry.
- Deliver exactly two fender-owned mating interfaces: one for
  `SM_Scooter_FrontFork_FenderEar_Brake` and one for
  `SM_Scooter_FrontFork_FenderEar_NonBrake`.
- The two dark lower rectangles visible in the V2 underside panel are ghosted
  accepted fork ears, not additional fender pads. No other fork tabs, mount
  stations, brackets, or drivetrain parts may be authored.
- Preserve the V2 shallow crown, directional leading lip, shorter tucked
  trailing return, subtle center spine, and restrained rolled edge.

## Registration

- Direct parent: `wheelfront.002`.
- Location: `(-0.008075118, -0.002037917, +0.687800467)`.
- Rotation XYZ radians: `(-1.570796371, +1.261589050, 0)`.
- Scale: `(1, 1, 1)`.
- Parent inverse and delta transforms: identity.
- Axle datum is the accepted `wheelfront.002` local origin. The
  `wheelfront.001` raster label is a non-binding image typo.
- Shell is symmetric about local Z = 0. Mount seats inherit the accepted
  8 mm side asymmetry.

Accepted ear centers in the `wheelfront.002` local frame:

| Side | X | Y | Z | Seat bounds Z |
| --- | ---: | ---: | ---: | ---: |
| Non-brake | 0.189877696 | 0.055002771 | -0.217000000 | [-0.222, -0.212] |
| Brake | 0.189877696 | 0.055002771 | +0.225000000 | [+0.220, +0.230] |

Only the two named ear-to-seat contact pairs may overlap in BVH checks.

## Dimensions

- Accepted V08 tire: 0.8704 m outside diameter, 0.2750 m width.
- Fore-aft fender chord from locked axle-datum endpoints: 0.760 m. This is
  not arc length and not transverse width.
- Outer fender width: 0.335 m maximum.
- Inner tunnel clear width: 0.305 m minimum.
- Skin: 3.5 mm uniform.
- Rolled perimeter lip: 8 mm deep, 4 mm radius.
- Center spine: 7 mm high by 32 mm wide.
- Underside return: 18 mm.
- Static design gap: 20-30 mm at centerline and both shoulders.
- Hard clearance: 15 mm minimum all around.

## Mechanical QA

Test the fender with the accepted wheel, brake, fork, and apron only.

- Static: zero unintended BVH overlaps; at least 15 mm tire clearance
  everywhere.
- Full-bump QA: apply the declared 0.080 m fork travel state and retain at
  least 15 mm everywhere. Do not bake this pose.
- Runtime steer: rotate the front assembly about the exact Ride Lab pivot
  `(-1.443669200, 0, -0.036091730)` through -0.22, 0, and +0.22 rad.
  Retain zero unintended overlaps and at least 15 mm clearance. Do not bake
  these poses.
- The fender follows the accepted fork assembly; no physics, collision,
  handling, rider, anchor, IK, or animation data changes are permitted.

## Topology and budget

The raster wire is topology intent, not literal loop count.

- Shell, returns, spine, and rolled lips: at most 312 evaluated triangles.
- Brake-side mating interface: at most 24 evaluated triangles.
- Non-brake mating interface: at most 24 evaluated triangles.
- Total front fender package: at most 360 evaluated triangles.
- Use approximately 18 fore-aft silhouette stations and 8 cross-width
  silhouette stations, concentrating edges at the lip, spine, attachment
  transitions, and end silhouettes.
- Use one shared closed shell. Do not duplicate dense inner and outer grids.
- Stable production names and material names are required for GLB export.

## Promotion gate

Promotion requires matching shaded and actual wireframe evidence from fixed
side, front, rear, high three-quarter, top, underside, through-mount, and
clearance-section cameras, plus static, full-bump, and all three runtime-steer
clearance results. Preserve provisional versions until visual and technical
approvers return SHIP.
