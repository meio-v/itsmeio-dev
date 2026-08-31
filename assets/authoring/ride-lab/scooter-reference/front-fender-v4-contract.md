# Ride Lab front fender V4 contract correction

This correction supersedes only the runtime-steering section and dual-pivot
diagram of `front-fender-v3-contract.md` and
`front-fender-focused-v3.png`. All V3 exterior, registration, solid-saddle,
dimension, topology, static-clearance, full-bump, naming, and promotion
requirements remain binding.

## Why the correction is required

The previous dual-pivot test rotated the fork/fender and wheel carrier by the
same angle about different origins. Those origins do not define one rigid
transform, so they create lateral tire-to-fender displacement at steer. No
close-fitting fender can satisfy the 15 mm clearance gate under that
presentation hierarchy.

## Binding runtime ownership

- The Blender fender remains a direct child of `wheelfront.002` using the
  accepted registration transform.
- `wheelfront.001` remains the exact axle datum and wheel-spin pivot.
- Ride Lab applies steering yaw to the fork/fender and front-wheel carrier as
  one rigid visual transform about the existing fork steering-head pivot
  `(-1.443669200, 0, -0.036091730)` in Blender asset coordinates.
- The front-wheel carrier may remain under the unsprung runtime parent, but
  its position must orbit around that same steering-head pivot while its yaw
  changes. This preserves the existing sprung/unsprung parent separation.
- Wheel spin remains nested at the unchanged `wheelfront.001` axle pivot.
- Do not independently rotate the fork/fender and wheel carrier about their
  separate neutral origins. Do not reparent the fender to the spinning wheel.
- This is a visual integration correction only. It changes no physics,
  collision, handling, GLB node, Blender pivot, runtime anchor, or rider data.

## Corrected steering QA

At `-0.22`, `0`, and `+0.22` rad:

1. Apply one common rigid world-Z rotation about
   `(-1.443669200, 0, -0.036091730)` to the accepted fork, fender,
   front-wheel carrier, tire, brake pieces owned by the wheel/lower fork, and
   their unchanged local axle-spin hierarchy.
2. Require tire-to-fender clearance to remain at least 15 mm everywhere.
   Because the relationship is rigid, the neutral tire-to-fender clearance
   must remain invariant.
3. Require zero unintended BVH overlaps between the steered rigid assembly
   and the fixed apron/body context.
4. Restore the neutral pose; never bake the QA transform.

The V3 full-bump ownership remains valid: co-translate tire/wheel, fender,
lower legs, ears, and their lower-mounted brake pieces by exactly 0.080 m
along the frozen travel axis while upper stanchions, receivers, and apron
remain fixed.
