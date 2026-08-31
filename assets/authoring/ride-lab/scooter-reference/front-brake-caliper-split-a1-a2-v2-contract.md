# Front brake caliper split A1/A2 V2 binding contract

This machine-readable contract is authoritative when small generated labels in the coordinated visual sheets are ambiguous. The visual forms remain authoritative for silhouette and surface intent.

## Shared registration

- Stationary parent: `wheelfront.002`
- Local coordinate convention: `T` tangent, `R_AXIS` radial outward, `Z` axial
- Rotor ghost: `Z = +0.096 .. +0.108 m`, direct child of `wheelfront.001`
- Every stationary surface inside the rotor slab must satisfy `sqrt(T^2 + R_AXIS^2) >= 0.178 m`
- Rotor-versus-caliper BVH overlaps: `0`

## A1 compact C-body

- Material: `MAT_Preview_BrakeBridge`
- Z slab: `+0.078 .. +0.126 m`
- Ordered footprint `(T, R_AXIS)` in meters:
  1. `(-0.075, 0.163)`
  2. `(-0.050, 0.172)`
  3. `(-0.050, 0.225)`
  4. `(+0.050, 0.225)`
  5. `(+0.050, 0.172)`
  6. `(+0.075, 0.163)`
  7. `(+0.085, 0.185)`
  8. `(+0.075, 0.245)`
  9. `(+0.055, 0.258)`
  10. `(-0.055, 0.258)`
  11. `(-0.075, 0.245)`
  12. `(-0.085, 0.185)`
- Arm-tip seat planes: `T = -0.050 m` and `T = +0.050 m`
- Mesh target: `24 vertices`, `44 evaluated triangles`, one positive manifold, no modifiers

## A2 paired jaws

- Inner jaw material: `MAT_Preview_BrakeJawInner`
- Outer jaw material: `MAT_Preview_BrakeJawOuter`
- Inner jaw Z slab: `+0.078 .. +0.093 m`
- Outer jaw Z slab: `+0.111 .. +0.126 m`
- Each jaw uses the identical ordered footprint `(T, R_AXIS)` in meters:
  1. `(-0.028, 0.145)`
  2. `(+0.028, 0.145)`
  3. `(+0.052, 0.175)`
  4. `(+0.052, 0.195)`
  5. `(-0.052, 0.195)`
  6. `(-0.052, 0.175)`
- Inner rotor-face gap: `0.003 m`
- Outer rotor-face gap: `0.003 m`
- Rear tabs overlap the A1 arm-tip planes by `0.002 m` tangentially at each seat edge
- Mesh target per jaw: `12 vertices`, `20 evaluated triangles`, one positive manifold, no modifiers
- Pair target: `40 evaluated triangles`

## Coordinated cap

- A1 + A2 target: `84 evaluated triangles`
- Aggregate hard cap: `88 evaluated triangles`
- This contract and its two V2 visual sheets supersede the A1/A2 V1 registration.
