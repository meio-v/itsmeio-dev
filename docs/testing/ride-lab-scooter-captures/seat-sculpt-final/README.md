# Ride Lab seat sculpt final QA

The reviewed Blender scene is `assets/authoring/ride-lab/ride-lab-scooter.blend`.
The user passed the final visual gate on 2026-08-30. The final automated Blender
audit also passed.

## Final measurements

- Production seat meshes: 45; all audited meshes are closed and manifold.
- Cushion proportions: 33.293% front and 66.580% rear over the preserved 1.6 m span.
- Cushion seam gap: 2.033 mm.
- Seam-side half-width difference: 0.240 mm.
- Grab hoop translation: rigid +30.000 mm rearward with no cage deformation.
- Minimum hoop-to-cushion clearance: 71.006 mm.
- Left and right foot-to-mount distance: 0.000 mm.

The completion audit found four front-base bosses that shared a multiply transformed
mesh. They were restored exactly from the approved ratio proposal before these final
captures were regenerated. The final audit found no stray seat parts.

## Evidence

Shaded views: `hero.png`, `side.png`, `front.png`, `rear.png`, `top.png`, and
`underside.png`.

Topology views: matching `topology-*` captures show all 3,544 evaluated vertices in
magenta and evaluated face edges in cyan.

The seat pass did not alter rider geometry or pose, physics, collision, handling,
wheel pivots, gameplay anchors, fenders, or unrelated scooter systems.
