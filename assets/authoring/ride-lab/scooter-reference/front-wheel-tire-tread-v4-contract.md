# Front Wheel Tire + Integrated Tread V4 Contract

Status: accepted for TireIntegratedTread V08 after technical, primary visual, independent visual, and evidence gates  
Authority: `front-wheel-focused-v3.png`, `front-wheel-tire-tread-breakdown-v3.png`, and accepted TireCarcass V04  
Scope: native Blender tire geometry only

## Reason for this contract

The V3 sheet's 1,700-triangle tire ceiling conflicts with its other binding requirements when the accepted V04 carcass profile is preserved and the V-chevron is delivered as physical recessed geometry. Tire V05 proved that reallocating the existing circumference samples into groove samples creates 10-degree land gaps, visible scallops, and a raised-tab read. V06/V06b preflights proved that deleting accepted axial profile controls narrows the crown by approximately 8-10 mm.

This contract resolves that conflict in favor of the accepted silhouette, exact recessed groove dimensions, a single manifold, and stable game shading. It changes topology ceilings only. It does not change orientation, scale, wheel anchors, physics, collision, or materials.

## Binding carcass profile

Preserve these local `(abs(Z), R)` controls and mirror them across Z:

- crown apex: `(0.0000, 0.4352)`
- crown plateau: `(0.0100, 0.4352)`
- upper crown: `(0.0520, 0.4270)`
- lower crown: `(0.0920, 0.4070)`
- full-depth arm control: `(0.1050, 0.393617647)`
- zero-depth fade control: `(0.1200, 0.378176471)`
- shoulder: `(0.1260, 0.3720)`
- maximum sidewall: `(0.1375, 0.3300)`
- inner bead: `(0.1050, 0.2920)`

Binding dimensions remain:

- outer diameter: `0.8704 m`
- maximum radius: `0.4352 m`
- axial width: `0.2750 m`
- bead inner radius: `0.2920 m`

## Binding tread law

- exactly 12 identical modules
- exact angular pitch: `30 degrees`
- front and rear orientation identical
- chevron phase: `theta(z) = theta_apex - 10 degrees * min(abs(z) / 0.105, 1)`
- both shoulders use the same phase sign
- flat groove-floor width: `0.0200 m`, measured on the recessed local floor radius
- support-mouth width: `0.0230 m`, providing `1.5 mm` beyond each floor edge
- radial floor depth: `0.0035 m` through `abs(Z) <= 0.105`
- width and depth taper to zero at `abs(Z) = 0.120`
- no displaced tread geometry beyond the zero-depth row
- no raised tabs, floating ribbons, star pits, or sidewall tread

## Binding production topology

Use 17 axial profile rings in this order around the closed section:

`Z = 0, +.010, +.052, +.092, +.105, +.120, +.126, +.1375, +.105 inner, -.105 inner, -.1375, -.126, -.120, -.105, -.092, -.052, -.010`

- nine grooved rows (`0`, `+/- .010`, `+/- .052`, `+/- .092`, `+/- .105`) use 96 vertices each
- each 96-vertex row contains a rotated uniform 60-station analytic scaffold plus three local samples per module
- one scaffold point supplies floor-left and is recessed; the three inserts supply floor-right, support-left, and support-right
- the remaining eight rows use a regular 60-station analytic scaffold
- land gaps may not exceed 6 degrees
- all land and support vertices stay on the analytic carcass baseline
- groove floor vertices move inward only
- all mixed rings use feature-tagged monotone stitching; no diagonal may cross a floor/wall/support boundary
- fully triangulate the delivery mesh
- expected final topology: `V = 1,344`, `E = 4,032`, `F = 2,688`, Euler characteristic `0`
- tire hard cap: `2,700 triangles`
- complete accepted front-wheel package hard cap: `6,200 triangles`

The topology increase is restricted to the tread-supporting front wheel. It does not authorize extra mechanical greebles or increases elsewhere.

## Shading and delivery

- one closed manifold tire object; no separate tread delivery meshes
- direct parent: `wheelfront.001`
- effective local transform and parent inverse: identity
- material: `MAT_Preview_Tire`
- analytic land remains smooth
- groove wall and floor boundaries use split/hard shading
- no vertex may exceed `R = 0.4352`
- preserve positive signed volume, outward normals, and exactly two incident faces per edge

## Approval evidence

Capture matched shaded and actual-topology views:

- true axle-normal side orthographic
- true front-tread orthographic
- true rear-tread orthographic
- controlled grazing three-quarter
- shoulder tangent proving zero-width/zero-depth fade
- radial cutaway through the apex and one arm proving the `0.0200 m` floor and `0.0035 m` recession
- one-object/manifold, dimensions, signed-volume, and evaluated-triangle manifest

Any raised-tab read, crown scallop, sidewall faceting, star/pinch apex, or front/rear handedness mismatch is a visual failure even when numeric checks pass.
