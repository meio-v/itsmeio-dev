# Front brake caliper split A1/A2 V4 binding contract

This revision supersedes V3. It keeps the accepted four-pad decomposition, shortens the C-body arms so the assembly reads as a compact caliper rather than a tuning fork, and adds an explicit handedness gate after V03 was mirrored in live Blender space.

## Shared registration and handedness

- Stationary parent: `wheelfront.002`
- Local coordinate convention: `T` tangent/right, `R_AXIS` radial/up, `Z` axial
- The live inverse-registered footprint must recover `T_live = T_contract` and `R_live = R_contract`; `T_live = -T_contract` is a hard failure.
- Rotor: `Z = +0.096 .. +0.108 m`, direct child of `wheelfront.001`
- Stationary surfaces occupying the rotor Z slab must satisfy `sqrt(T^2 + R_AXIS^2) >= 0.178 m`
- Rotor-versus-caliper BVH overlaps: `0`

## A1 compact side-open C-body

- Material: `MAT_Preview_BrakeBridge`
- Z slab: `+0.078 .. +0.126 m`
- Ordered footprint `(T, R_AXIS)` in meters:
  1. `(+0.075, 0.180)`
  2. `(+0.015, 0.180)`
  3. `(+0.000, 0.190)`
  4. `(-0.005, 0.200)`
  5. `(-0.005, 0.245)`
  6. `(+0.000, 0.252)`
  7. `(+0.015, 0.258)`
  8. `(+0.075, 0.258)`
  9. `(+0.050, 0.245)`
  10. `(+0.025, 0.225)`
  11. `(+0.025, 0.205)`
  12. `(+0.050, 0.195)`
- The open mouth faces `+T`.
- Overall tangential extent is `0.080 m`, reduced by half from V3's `0.160 m`.
- Clear throat depth is approximately `0.050 m`, comparable to the visible upper/lower opening rather than a long slot.
- Mesh target: `24 vertices`, `44 evaluated triangles`, one positive manifold, no modifiers.

## A2 four compact pad blocks

- Keep the V3 lower footprint unchanged: `(+.045,.185)`, `(+.080,.185)`, `(+.085,.210)`, `(+.045,.210)`.
- Keep the V3 upper footprint unchanged: `(+.045,.225)`, `(+.085,.225)`, `(+.080,.255)`, `(+.045,.255)`.
- Inner pad Z slab: `+0.078 .. +0.093 m`; outer pad Z slab: `+0.111 .. +0.126 m`.
- Exact rotor face gap on each side: `0.003 m`.
- Keep four stable objects: `JawInnerLower`, `JawInnerUpper`, `JawOuterLower`, `JawOuterUpper`.
- `JawInnerLower` and `JawInnerUpper` use `MAT_Preview_BrakeJawInner`.
- `JawOuterLower` and `JawOuterUpper` use `MAT_Preview_BrakeJawOuter`.
- Each pad: `8 vertices`, `12 evaluated triangles`; four-pad total: `48 evaluated triangles`.

## Coordinated gate

- A1 + A2 target: `92 evaluated triangles`; hard cap: `96`.
- Side view must read as one compact side-open C with two small pad masses at its arm tips.
- Preserve at least `0.015 m` visible mouth gap between lower and upper pads.
- Three-quarter and axial evidence must use dark enough exposure to distinguish the C-body, all four pads, rotor slab, and both 3 mm gaps.
- V02 and V03 live geometry remain failed provisionals and must not be promoted.
