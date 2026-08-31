# Front wheel hub shell + non-brake dome cap V2 binding contract

This Reference Factory contract resolves the conflict exposed by live Hub/Cap V01–V03: the original `<=160` triangle cap forced visible 16-to-8 reductions and removed the accepted stepped ring hierarchy. The accepted `front-wheel-hub-cap-decomposed-v1.png` remains the visual authority; this file supersedes only its production triangle budget and makes its visible-ring topology explicit.

## Shared registration

- Direct parent: `wheelfront.001`
- Object local transform: identity
- Wheel axis: local `Z`
- Brake side: `+Z`; non-brake side: `-Z`
- Hub outer radius: `0.092 m`
- Central bore radius: `0.032 m`
- Hub axial range: `-0.078 .. +0.078 m`
- Cap exists only on `-Z` and projects to `Z = -0.108 m`

## Hub shell visible axial profile

- Use 16 circumferential stations on every visible circular boundary, including the bore lip, both end lands, both outer shoulders, and the cylindrical drum.
- Binding `(R,Z)` profile, ordered around the closed section:
  1. `(0.032, -0.070)` non-brake bore lip
  2. `(0.050, -0.078)` non-brake recessed land
  3. `(0.080, -0.072)` non-brake attachment ring
  4. `(0.092, -0.055)` outer root shoulder
  5. `(0.092, +0.055)` cylindrical drum
  6. `(0.080, +0.072)` brake attachment ring
  7. `(0.050, +0.078)` open rotor land
  8. `(0.032, +0.070)` brake bore lip
- Expected topology: `128 vertices`, `128 quads`, `256 evaluated triangles`, one positive closed manifold.
- Material hierarchy: cylindrical drum and bore wall use `MAT_Preview_WheelHub`; stepped lands and shoulders use `MAT_Preview_WheelMetal`.

## Non-brake shallow rolled dome

- Use 16 stations on perimeter, shoulder, and crown ring.
- Binding `(R,Z)` rings:
  - installed perimeter: `(0.050, -0.077)`; it must deliberately intersect the hub non-brake land and never float
  - rolled shoulder: `(0.042, -0.088)`
  - crown ring: `(0.020, -0.104)`
  - crown center: `(0.000, -0.108)`
- Expected topology: `49 vertices`, `32 quads + 16 triangles`, `80 evaluated triangles`, one intentional 16-edge installed boundary, outward normals.
- Material: `MAT_Preview_WheelCap_Cream`.

## Revised budget and gate

- Hub target: `256 evaluated triangles`.
- Cap target: `80 evaluated triangles`.
- Coordinated target: `336 evaluated triangles`; hard cap: `352`.
- The former `<=160` cap is superseded because it was proven incompatible with the accepted visible 16-station ring hierarchy.
- Brake-side orthographic must show an open bore lip, recessed rotor land, intermediate attachment ring, and outer root shoulder.
- Non-brake orthographic must show the smaller nested rolled dome, not a flat plate or cone.
- True installed axial section must show all hub steps and the seated perimeter/shoulder/crown profile without exploded offset.
- V01–V03 live hub/cap geometry remains failed provisional history and must not be promoted.
