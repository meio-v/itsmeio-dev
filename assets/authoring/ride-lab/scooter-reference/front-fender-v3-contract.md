# Ride Lab front fender V3 modeling contract

This contract and `front-fender-focused-v3.png` form the front-fender
authority candidate. The PNG owns exterior silhouette and panel language.
This contract owns exact registration, attachment, topology, and mechanical
QA. This contract supersedes all V1/V2 fender contract statements.

## Scope and ownership

- Deliver one lightweight, closed-manifold fender shell with one preview
  material region for the dark underside. The underside is not separate
  production geometry.
- Deliver exactly two solid fender-owned mating saddles: one for
  `SM_Scooter_FrontFork_FenderEar_Brake` and one for
  `SM_Scooter_FrontFork_FenderEar_NonBrake`.
- Each saddle makes planar solid contact with the existing solid accepted ear.
  No bore, drilling, through-fastener, penetration, or fork-ear modification
  is permitted. A non-penetrating fender-owned cosmetic cap is optional.
- Preserve the V3 shallow crown, directional leading lip, shorter tucked
  trailing return, subtle center spine, and restrained rolled edge.

## Registration and axle datum

- Direct parent: `wheelfront.002`.
- Location: `(-0.008075118, -0.002037917, +0.687800467)`.
- Rotation XYZ radians: `(-1.570796371, +1.261589050, 0)`.
- Scale: `(1, 1, 1)`.
- Parent inverse and delta transforms: identity.
- Axle datum: exact node `wheelfront.001`.
- The registered fender mesh-local origin coincides with
  `wheelfront.001` through the binding transform above. The
  `wheelfront.002` parent origin is not the axle datum.
- Shell is symmetric about mesh-local Z = 0. Saddles inherit the accepted
  8 mm side asymmetry.

Accepted ear centers in the registered fender mesh-local frame:

| Side | X | Y | Z | Seat bounds Z |
| --- | ---: | ---: | ---: | ---: |
| Non-brake | 0.189877696 | 0.055002771 | -0.217000000 | [-0.222, -0.212] |
| Brake | 0.189877696 | 0.055002771 | +0.225000000 | [+0.220, +0.230] |

Only the two named ear-to-saddle contact pairs may touch in BVH checks.

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

Test only the accepted tire/wheel, brake, fork, fender, and apron context.
All QA transforms are transient and must be restored before saving.

### Static

- Zero unintended BVH overlaps.
- At least 15 mm tire clearance everywhere, with 20-30 mm at the intended
  centerline and shoulder design samples.

### Full bump

- Co-translate the tire/wheel, fender, lower fork legs, and fork ears together
  by exactly 0.080 m along the frozen declared travel axis.
- Keep upper stanchions, receivers, and apron fixed.
- Require at least 15 mm tire-to-fender clearance and zero unintended BVH
  overlaps against fixed upper fork and apron.
- Do not test or imply tire-only motion relative to the fender.

### Runtime steering

Apply the same angle simultaneously to the two runtime groups:

- Fork/fender pivot: `(-1.443669200, 0, -0.036091730)`.
- Tire/wheel pivot: `(-1.644751668, 0, -0.694336236)`.
- Angles: `-0.22`, `0`, and `+0.22` rad about world Z.

At every state require at least 15 mm tire-to-fender clearance and zero
unintended BVH overlaps. Do not bake these poses.

No physics, collision, handling, rider, anchor, IK, or animation data changes
are permitted.

## Topology and budget

The raster wire is topology intent, not literal loop count.

- Use approximately 12 fore-aft ring stations and 8 cross-width silhouette
  stations, concentrating edges at the lip, spine, attachment transitions,
  and end silhouettes.
- Shell, returns, spine, and rolled lips: at most 312 evaluated triangles.
- Brake-side saddle: at most 24 evaluated triangles.
- Non-brake saddle: at most 24 evaluated triangles.
- Total front-fender package: at most 360 evaluated triangles.
- Use one shared closed shell. Do not duplicate dense inner and outer grids.
- Stable production object and preview-material names are required.

## Promotion gate

Promotion requires matching shaded and actual wireframe evidence from fixed
side, front, rear, high three-quarter, top, underside, solid-contact, and
clearance-section cameras, plus static, full-bump, and all three dual-pivot
runtime-steer results. Preserve provisional versions until primary visual,
independent visual, and technical approvers all return SHIP.
