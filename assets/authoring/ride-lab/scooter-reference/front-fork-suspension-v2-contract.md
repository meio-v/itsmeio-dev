# Front Fork and Suspension Pair V2 Contract

Status: accepted after primary visual, independent visual, and technical authority gates  
Primary visual authority: `front-assembly.png`  
Focused topology-intent authority: `front-fork-suspension-pair-focused-v2.png`  
Context authorities: `front-wheel-brake-package-v3.png`, accepted front-wheel meshes in `ride-lab-scooter.blend`, and `turnaround-three-band.png`

## Scope and ownership

This package resolves the conventional paired telescopic front fork. It owns:

- brake-side and non-brake-side upper stanchions;
- brake-side and non-brake-side lower sliders and axle clamps;
- restrained suspension collars or boots;
- a hidden/internal crown or receiver only where required structurally;
- paired fork-owned fender-mount tabs;
- one brake-side-only caliper or torque-link interface.

The pale-green apron, visible exterior body shell, fender skin, accepted wheel, rotor, caliper, hub, axle, spacers, caps, steering nacelle, and headlamp are context only and are not delivery geometry. The fender is a separate later package. The generated wire lines describe topology intent, not a production loop count.

## Coordinate and node contract

- Blender vehicle axes are `+X` rearward, `+Y` scooter-left, and `+Z` up.
- Author in the accepted wheel-local frame: axle axis local `Z`, radial plane local `XY`, and wheel center local `(0, 0, 0)`.
- Positive wheel-local `Z` is the brake side and corresponds to world `+Y`.
- Every delivered fork, crown, suspension, clamp, and fork-owned interface object is a direct child of exact node `wheelfront.002`.
- Parent inverse, delta transforms, and scale are identity.
- Registration under `wheelfront.002` is binding and is not zero local location:
  - location `(-0.008075118, -0.002037917, +0.687800467)`;
  - rotation XYZ `(-1.570796371, +1.261589050, 0)` radians;
  - scale `(1, 1, 1)`.
- The resulting world frame must match `wheelfront.001` and the accepted stationary brake frame with maximum absolute matrix-element delta `<= 1e-6`.
- Preserve `wheelfront.001`, `wheelfront.002`, `guide`, `master`, `wheell  back`, and every existing anchor exactly.

## Axle and clearance contract

- Both lower axle-clamp bores are concentric on local `X = 0`, `Y = 0` along local `Z`; no vertical or fore-aft mismatch is allowed.
- Accepted tire maximum radius is `0.4352 m`, OD `0.8704 m`, and width `0.2750 m`.
- Accepted complete front-wheel package world-Y envelope is `[-0.139552, +0.143948] m`, equivalent to wheel-local Z approximately `[-0.137500, +0.146000] m`.
- Except for explicitly reviewed axle-interface solids:
  - non-brake fork inner faces stay at or below local `Z = -0.1475 m`;
  - brake-side fork inner faces stay at or above local `Z = +0.1560 m`.
- Minimum clear inner span is therefore `0.3035 m`, with deliberate extra brake-side accommodation.
- Tire, rim, spokes, hub, rotor, and accepted brake package must have zero BVH overlap with fork delivery geometry. The only exceptions are intentional contact between a named fork-owned axle bore or clamp and its named axle datum, plus the named brake-side interface and the specific accepted boss/contact it mates to. No exception permits overlap with tire, rim, spokes, rotor, caliper bodies, or unrelated brake geometry.
- Future fender target gap is `20–30 mm`; hard minimum is `15 mm` over the swept tire crown.
- Verify neutral steering and Ride Lab runtime steering at `-0.22`, `0`, and `+0.22` radians because wheel, fork, and handlebar runtime pivots differ.

The focused PNG's travel inset text `>= 10 mm` is superseded by this contract wherever it could be read as tire-to-fender clearance. The binding tire-to-fender requirement is `15 mm` hard minimum and `20–30 mm` target. The PNG's `10 mm` value applies only to the fork/package inner-face clearance described above.

## Suspension stroke and full-bump QA

- Binding design stroke is `0.080 m` measured along the shared fork centerline from the axle toward the upper receiver.
- Both legs use the same normalized travel axis and the same stroke. The V01 blockout must record the two upper-receiver centers and the shared normalized travel vector in its manifest; that vector is frozen for every later version.
- `Static` is zero compression. `Full bump` is exactly `0.080 m` compression along the frozen axis.
- This is a clearance-only Blender and Ride Lab QA state. It must not add or alter a bone, animation, gameplay node, runtime suspension transform, physics, handling, or collision behavior.
- Full-bump evidence uses temporary QA transforms or duplicated context only. Do not bake the full-bump pose into delivery meshes or existing anchors.

## Visual and construction contract

- Use a balanced twin telescopic silhouette with equal rake and a coherent paired load path.
- Fork tops disappear independently into the dark apron opening. Any crown or cross-brace remains internal/ghosted and may not change the canonical front silhouette.
- Stanchion, slider, collar, and travel axis must read functionally; do not model decorative stacked tubes.
- Use fender-mount tabs on both legs and a separate brake-only interface on the brake-side leg. The opposite leg stays clean apart from its fender mount.
- Keep detail restrained: no noisy micro-greebles, exposed drivetrain, or unnecessary fastener fields.
- Suggested stable names begin with `SM_Scooter_FrontFork_` and `SM_Scooter_FrontSuspension_`.
- Use stable preview-role materials; Three.js may replace them later.

## Triangle allocation

Combined fork, suspension, axle clamps, any explicitly delivered stationary axle hardware, and later separate fender:

- target: `<= 1,400` evaluated triangles;
- hard cap: `<= 1,600` evaluated triangles.

Target allocation:

- fork pair, internal crown, and axle clamps: `<= 600`;
- suspension sleeves or boots: `<= 280`;
- declared stationary axle hardware, brace, and functional interfaces: `<= 120`;
- later fender: `<= 360`;
- unallocated target reserve: `40`;
- hard-cap reserve above target: `200`.

For allocation accounting, the buckets are bindingly classified as follows:

- core fork: axle lugs or clamps, lower castings, and lower sliders;
- suspension: upper stanchions, collars or boots, and compact upper receivers;
- functional interfaces: paired fender ears and the named brake-side spacer or interface.

This clarification changes no geometry, ownership, clearance, registration, or total triangle limit.

The accepted front wheel's remaining `132`-triangle reserve is restricted to the wheel and may not fund this package.

## Object quality

- Delivery meshes are closed, manifold, positive-volume, outward-facing, and free of duplicate or degenerate geometry unless an intentionally open collar is explicitly declared and approved.
- Preserve stable object and material names and direct-parent ownership.
- Do not alter body/apron, accepted wheel/brake, steering/headlamp, anchors, physics, collision, handling, rider geometry, rider pose, runtime IK, or NPR materials.

## Approval evidence

Capture matched shaded and actual-topology views from identical cameras:

- brake-side axle-normal orthographic;
- non-brake-side axle-normal orthographic;
- true front and true rear orthographic;
- high brake-side and high non-brake-side three-quarter;
- top plan proving leg spacing;
- full through-axle section proving concentric bores and brake-side clearance;
- side overlay along the suspension axis;
- static and declared full-bump clearance views.

The manifest must report object names, direct parents, transforms, bounds, evaluated triangles, manifold state, signed volumes, wheel/brake BVH overlaps, inner-face planes, and neutral plus `+/-0.22` runtime clearance results.

It must also report fork-only evaluated triangles, the remaining reserved fender budget, the frozen suspension-axis vector and receiver centers, and static/full-bump clearance at the exact `0.080 m` stroke. Once V01 is accepted, legacy `devantrouelowpoly.002` and `Cylinder.003` must be excluded from render and delivery while remaining recoverably preserved until final cleanup.
