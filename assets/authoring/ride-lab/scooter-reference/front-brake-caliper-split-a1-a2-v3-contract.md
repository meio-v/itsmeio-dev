# Front brake caliper split A1/A2 V3 binding contract

This Reference Factory correction resolves the V2 authority conflict: the V2 coordinates produced a downward-open U even though the accepted visual form is a side-open compact C. The V2 PNGs remain visual style authorities only. This file is the binding coordinate, ownership, and topology authority and supersedes both V1 and V2 registration.

## Shared registration

- Stationary parent: `wheelfront.002`
- Local coordinate convention: `T` tangent/right, `R_AXIS` radial/up, `Z` axial
- Rotor: `Z = +0.096 .. +0.108 m`, direct child of `wheelfront.001`
- Stationary surfaces occupying the rotor Z slab must satisfy `sqrt(T^2 + R_AXIS^2) >= 0.178 m`
- Rotor-versus-caliper BVH overlaps: `0`

## A1 compact side-open C-body

- Material: `MAT_Preview_BrakeBridge`
- Z slab: `+0.078 .. +0.126 m`
- Ordered footprint `(T, R_AXIS)` in meters:
  1. `(+0.075, 0.180)`
  2. `(-0.055, 0.180)`
  3. `(-0.075, 0.190)`
  4. `(-0.085, 0.200)`
  5. `(-0.085, 0.245)`
  6. `(-0.075, 0.255)`
  7. `(-0.055, 0.258)`
  8. `(+0.075, 0.258)`
  9. `(+0.050, 0.245)`
  10. `(-0.050, 0.225)`
  11. `(-0.050, 0.205)`
  12. `(+0.050, 0.195)`
- The open mouth faces `+T`; never rotate or reinterpret this footprint as a downward-open U.
- Mesh target: `24 vertices`, `44 evaluated triangles`, one positive manifold, no modifiers.

## A2 four compact pad blocks

The former broad jaw slabs are decomposed into upper/lower pads on both axial sides so the mouth remains visibly open. Each pad is a separate positive manifold trapezoidal prism.

- Inner pad Z slab: `+0.078 .. +0.093 m`
- Outer pad Z slab: `+0.111 .. +0.126 m`
- Rotor face gaps: exactly `0.003 m` on each side
- Lower-pad footprint `(T, R_AXIS)`:
  1. `(+0.045, 0.185)`
  2. `(+0.080, 0.185)`
  3. `(+0.085, 0.210)`
  4. `(+0.045, 0.210)`
- Upper-pad footprint `(T, R_AXIS)`:
  1. `(+0.045, 0.225)`
  2. `(+0.085, 0.225)`
  3. `(+0.080, 0.255)`
  4. `(+0.045, 0.255)`
- Each pad target: `8 vertices`, `12 evaluated triangles`, no modifiers
- Four-pad target: `32 vertices`, `48 evaluated triangles`
- Inner materials: `MAT_Preview_BrakeJawInner`; outer materials: `MAT_Preview_BrakeJawOuter`
- Required stable objects: `JawInnerLower`, `JawInnerUpper`, `JawOuterLower`, `JawOuterUpper`

## Coordinated cap and visual gate

- A1 + A2 target: `92 evaluated triangles`
- Aggregate hard cap: `96 evaluated triangles`
- Side view must read as a compact C open toward `+T`, with two small pads seated at each arm tip; no pad may span or plug the mouth.
- Three-quarter and axial evidence must show two inner pads, two outer pads, the rotor between axial sides, and both 3 mm gaps.
- V02 live geometry is a failed provisional and must not be promoted.
