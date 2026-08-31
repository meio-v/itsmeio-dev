# Ride Lab front-fender Package C saddle-contact V1 contract

This contract and `front-fender-package-c-saddle-contact-v1.png` form the
Package C authority. The PNG owns the compact saddle visual language and the
requirement for a hidden, full-surface load path. This contract owns exact
registration, live accepted-V06 ear geometry, contact handedness, the allowable
pad envelope, topology allocation, and mechanical QA. Where a tiny raster label
is ambiguous, this contract is binding.

## Package C scope only

Package C delivers exactly two fender-owned closed solids:

- `PROPOSAL_SM_Scooter_FrontFender_Saddle_NonBrake_PackageC_V01`
- `PROPOSAL_SM_Scooter_FrontFender_Saddle_Brake_PackageC_V01`

Package C owns no main shell, crown, center spine, leading or trailing arc,
rolled lip, inner tunnel, underside skin, underside return, cosmetic cap,
wheel, tire, brake, fork, body, or apron geometry. It must not modify either
accepted fork ear. A later shell/return package may meet Package C's outboard
terminal faces, but that joining geometry is outside this contract.

The saddles are attachment solids, so the main-shell `0.335 m` exterior-width
limit does not move or crop the accepted ear contact planes. The attachment
locations remain controlled by the accepted V06 fork ears.

## Frozen registration

Both Package C objects use the same accepted stationary-frame registration as
the ears:

- direct parent: `wheelfront.002`
- location: `(-0.008075118, -0.002037917, +0.687800467)`
- rotation XYZ radians: `(-1.570796371, +1.261589050, 0)`
- scale: `(1, 1, 1)`
- parent inverse: identity
- delta location and rotation: zero
- delta scale: `(1, 1, 1)`
- axle datum: exact node `wheelfront.001`
- maximum accepted world-matrix delta from `wheelfront.001`: `1e-6`

All coordinates below are in this registered fender/fork mesh-local frame.

## Live accepted V06 ear authority

The inspected accepted objects are:

- `SM_Scooter_FrontFork_FenderEar_NonBrake`
- `SM_Scooter_FrontFork_FenderEar_Brake`

Each ear is an eight-vertex closed prism. Both use the same XY contact polygon,
listed counter-clockwise as viewed from local `+Z`:

| Point | X | Y |
| --- | ---: | ---: |
| `P0` | `0.178000897` | `0.036955126` |
| `P1` | `0.207705379` | `0.049228847` |
| `P2` | `0.203518152` | `0.073050417` |
| `P3` | `0.172050014` | `0.066511631` |

Contact-polygon facts from the live mesh:

- area: `0.000864000 m^2`
- face centroid: `(0.190318614, 0.056436503)`
- XY bounds: `X [0.172050014, 0.207705379]`,
  `Y [0.036955126, 0.073050417]`
- bounding-box center: `(0.189877696, 0.055002771)`

The V3 contract's reported ear center is the bounding-box center. It is not the
irregular quadrilateral's area centroid; both values above are intentional.

### Non-brake ear

- live ear Z bounds: `[-0.222000003, -0.211999997]`
- ear outboard contact face: `Z = -0.222000003`
- ear outboard-face normal: local `-Z`
- saddle contact-face normal: local `+Z`
- saddle occupies only the more-negative-Z side of the contact plane

### Brake ear

- live ear Z bounds: `[+0.219999999, +0.230000004]`
- ear outboard contact face: `Z = +0.230000004`
- ear outboard-face normal: local `+Z`
- saddle contact-face normal: local `-Z`
- saddle occupies only the more-positive-Z side of the contact plane

The inboard ear faces at approximately `Z=-0.212` and `Z=+0.220` are not
Package C contact faces. Inward extrusion from those planes enters the accepted
slider envelope and is prohibited.

## Binding compact-pad envelope

Use the exact four-point contact polygon above for each saddle's ear-facing
face. The complete face must be coplanar with and coincident to the matching
ear outboard face. No portion of the saddle contact face may project outside
the polygon, and the contact polygon may not be scaled, mirrored in XY,
rotated, or replaced by its rectangular bounds.

The allowable V1 core envelopes are:

| Side | Contact plane | Outboard terminal plane | Depth | Allowed Z interval |
| --- | ---: | ---: | ---: | ---: |
| Non-brake | `-0.222000003` | `-0.234000003` | `0.012000000` | `[-0.234000003, -0.222000003]` |
| Brake | `+0.230000004` | `+0.242000004` | `0.012000000` | `[+0.230000004, +0.242000004]` |

For the V1 core, duplicate `P0..P3` at the two listed Z planes and connect the
corresponding edges. This is an irregular quadrilateral prism, not a generic
box. The outboard terminal face is the only Package C-to-later-package
interface. Do not add an inboard blade, wraparound bracket, terminal cube,
fastener, bore, countersink, slot, adhesive pad, or fork-side geometry.

The exact outboard placement preserves the accepted side asymmetry. Do not
mirror by object scale. Author both sides explicitly from the same XY polygon
and their side-specific Z values.

## Contact and ownership rules

- The saddle contact face must cover the complete live ear outboard polygon.
- The paired faces are coincident within `1e-6 m` and have opposing normals.
- Zero gap is required across all four vertices and both constituent contact
  triangles.
- Zero Z-thickness penetration into the accepted ear is required.
- Coplanar BVH contact with the corresponding named ear is the only allowed
  Package C contact.
- The saddle remains a fender-owned object. It is not joined to, parented to,
  booleaned into, or exported as part of the fork ear.
- The accepted V06 fork-ear objects and their vertices, faces, transforms,
  names, materials, and custom properties remain unchanged.
- Use stable preview material `MAT_Preview_FrontFender_Body_V01`.
- While provisional, set `status = PROVISIONAL`, `version = V01`,
  `package = Ride Lab front fender Package C`, and `export_exclude = true`.

## Topology allocation

The deterministic V1 core is:

- per saddle: `8 vertices / 12 edges / 6 quads / 12 evaluated triangles`
- Package C target: `24 evaluated triangles`
- per-saddle hard cap: `24 evaluated triangles`
- Package C hard cap: `48 evaluated triangles`

The parent front-fender contract still caps the complete fender package at
`360` evaluated triangles and the main shell at `312`. Package C does not
borrow main-shell triangles. Any optional refinement remains provisional and
must stay inside the exact contact polygon and Z envelope, preserve a closed
positive-volume manifold, and remain within `24` triangles per saddle.

## Required mechanical QA

All tests are read-only or transient. Restore neutral state and never bake a
QA transform.

### Static

At neutral:

1. Require exact contact-polygon equality and opposing face normals.
2. Require zero gap and zero volumetric penetration against the corresponding
   accepted ear.
3. Require zero BVH overlaps against every other accepted V06 fork mesh,
   accepted wheel/brake mesh, tire, apron, and body context.
4. Require tire clearance of at least `0.015 m`.

The exact 12 mm envelope was analytically checked against the live scene with:

- non-brake pad-to-tire minimum: `0.138051301 m`
- brake pad-to-tire minimum: `0.144127458 m`
- unintended accepted-fork overlap pairs: `0` on both sides

Coplanar contact detection may report zero or a small number of triangle pairs
depending on BVH triangulation. Polygon equality, opposing normals, zero gap,
and zero signed penetration are the binding contact proof.

### Full bump

Use the frozen accepted travel axis:

- local axis: `(0.955822229, 0.293945342, 0)`
- stroke: `+0.080000000 m`
- registered world delta:
  `(0.023515616, -0.000000010, 0.076465778)`

Co-translate each saddle with its accepted ear, fender, tire/wheel, lower fork,
and lower-mounted brake pieces. Keep upper stanchions, receivers, and apron
fixed. The saddle-to-ear relationship must remain invariant. Require zero BVH
overlaps against the fixed upper stanchions, receivers, and apron. The exact
12 mm envelope produced zero fixed-context overlap pairs in the live V06
scene.

### Shared runtime steer

At `-0.22`, `0`, and `+0.22` radians, apply the V4 common rigid world-Z
rotation about `(-1.443669200, 0, -0.036091730)` to the complete moving front
assembly. The saddle-to-ear relationship and tire clearance must remain
invariant. Require zero unintended BVH overlaps against the fixed apron and
visible body context. The exact 12 mm envelope produced zero overlaps against
all 25 visible body-shell meshes at all three angles.

## Evidence and acceptance

Technical promotion requires:

- isolated shaded and actual vertices/edges/faces views from underside,
  brake-side section, non-brake-side section, and high three-quarter cameras;
- an installed context view for each side;
- a true section proving the exact contact polygon, plane, opposing normals,
  zero gap, zero penetration, and 12 mm outboard depth;
- static, exact full-bump, and all three shared-steer QA captures;
- a manifest reporting names, parents, matrices, topology, signed volumes,
  contact-plane equality, contact-polygon coordinates, BVH results, and tire
  clearances.

The sheet is technically usable only with this contract. It remains a
provisional reference until the user explicitly approves it; this contract
does not itself promote or modify Blender geometry.
