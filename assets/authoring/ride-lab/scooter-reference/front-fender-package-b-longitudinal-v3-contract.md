# Ride Lab front-fender Package B longitudinal V3 contract

This contract and `front-fender-package-b-longitudinal-v3.png` are the binding
post-V08 decomposition authority for **Package B only**: the fore-aft arc,
projected chord, and distinct leading and trailing shell-end transitions of the
Ride Lab front fender.

The canonical identity remains `front-assembly.png`. The accepted whole-fender
context remains `front-fender-focused-v3.png`, with runtime ownership corrected
by `front-fender-v4-contract.md`. Package A is controlled by
`front-fender-package-a-crown-roll-v1-contract.md`; Package C is controlled by
`front-fender-package-c-saddle-contact-v1-contract.md`. If the small generated
station labels in the PNG are ambiguous, the exact station list below controls.

## Package B scope and boundaries

Package B owns only:

- the registered fore-aft projected shell chord;
- the production-smooth shallow longitudinal scooter arc;
- the longer, clean, swept leading lip at vehicle front;
- the shorter, tucked trailing return at vehicle rear; and
- the fore-aft distribution of longitudinal ring stations needed to hold those
  silhouettes.

Package B does **not** own or alter:

- Package A's 0.335 m outer width, 0.305 m minimum tunnel width, 3.5 mm skin,
  transverse crown, 7 mm by 32 mm center spine, or 8 mm-deep/4 mm-radius lateral
  roll section;
- Package C's two saddle solids, fork-ear contact polygons, Z envelopes,
  handedness, attachment load paths, or accepted fork geometry;
- shell registration, parent, axle datum, tire clearance, suspension travel,
  runtime steering, apron, body, wheel, brake, materials beyond preview regions,
  or any rider/gameplay data.

Package A may be swept along Package B, but its section must remain unchanged at
every longitudinal station. Package C may later meet the completed underside,
but Package B must not create pads, brackets, blades, bosses, bores, caps,
fasteners, contact faces, or attachment clearances.

## Frozen registration and projected chord

Use the accepted registered fender mesh-local frame:

- direct parent: `wheelfront.002`
- axle datum: exact node `wheelfront.001`
- location: `(-0.008075118, -0.002037917, +0.687800467)` m
- rotation XYZ radians: `(-1.570796371, +1.261589050, 0)`
- scale: `(1, 1, 1)`
- parent inverse and delta transforms: identity

Let `O` be the registered mesh-local axle datum. Let `F` be the normalized
registered mesh-local vehicle fore-aft axis pointing toward vehicle front, as
shown by the leftward vehicle-front arrows in all Package B V3 side and top
views. Freeze `F` before sculpting and record it to at least nine decimal places
as `fore_aft_axis_local` in every evidence manifest; it may not change between
versions.

The leading and trailing witness planes are perpendicular to `F` and are
centered on `O`:

- leading plane: `dot(P - O, F) = +0.380000000 m`
- trailing plane: `dot(P - O, F) = -0.380000000 m`
- projected outermost shell-endpoint chord: `0.760000000 m` exactly

For every evaluated vertex `P` belonging to the shell, skin, center spine,
rolled perimeter, underside region, or end closure:

`-0.380000000 <= dot(P - O, F) <= +0.380000000`.

Acceptance tolerance at each witness plane is `+/- 0.000100 m`; the measured
leading-to-trailing projected chord must be `0.760000 m +/- 0.000100 m`. At
least one complete-shell vertex must lie on each witness plane within that
tolerance. No shell, roll, skin, spine, underside, end cap, bevel, modifier
result, or shading-support geometry may extend beyond either plane.

This is a projected chord, not arc length, center-spine-only length, width, or
distance between construction-object origins.

## Direction and form gates

Package B passes only when all of the following are true:

1. Vehicle right is the brake side; vehicle left is the non-brake side. Vehicle
   front points left in the fixed side and top evidence, exactly as in the V3
   sheet.
2. The center longitudinal silhouette is one continuous, shallow, production-
   smooth scooter arc with no inflection, flat apex, corner, kink, polygonal
   stepping, or shading ripple.
3. The leading end is visibly longer and cleaner in side and high-front
   three-quarter views. It sweeps gradually into a lightly rolled lip and ends
   exactly at the leading witness plane.
4. The trailing end is visibly shorter and tucked. Its side and top silhouettes
   differ clearly from the leading end and terminate exactly at the trailing
   witness plane.
5. Both ends remain shell-only transitions. They contain no circular boss,
   ring, eye, hole, hardware, terminal block, separate trim, underside feature,
   or Package C attachment decision.
6. Package A's transverse section remains unchanged through the complete arc.
   The narrow spine rides on the accepted crown and never becomes a gable;
   the lateral roll remains continuous through both end transitions.
7. Brake-side and non-brake-side orthographic silhouettes agree in arc and end
   placement. Only later Package C attachment geometry may introduce the
   accepted side asymmetry.
8. The result reads as the light directional fender in `front-assembly.png`,
   not a symmetric capsule, generic motorcycle mudguard, mirrored guillotine
   cut, or heavy full-coverage arch.

## Topology and budget allocation

The PNG wire and station graph are topology intent, not proof of a production
mesh. The binding longitudinal QA scaffold uses **13 stations including both
endpoints**, at these projected percentages of the 0.760 m chord measured from
the leading witness plane toward the trailing witness plane:

`0, 8, 17, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100` percent.

- Keep the endpoint stations on the exact witness planes.
- Preserve ordered, non-crossing ring flow. Concentrate curvature through the
  leading sweep and trailing tuck without adding a second shell or dense hidden
  underside grid.
- A provisional may add local support, but promotion must return to no more
  than **16 longitudinal ring stations total**, including end-support stations.
- The isolated Package B center-ribbon QA artifact is capped at **64 evaluated
  triangles**, including temporary end closure. It is non-production geometry.
- Package B receives no separate production object or triangle allowance. The
  integrated Package A+B main shell, skin, spine, rolls, underside region and
  end closures remain capped at **312 evaluated triangles**.
- The complete later A+B+C front-fender package remains capped at **360
  evaluated triangles**. Package B may not borrow Package C's 48-triangle cap.
- The final shell must be one positive-volume closed manifold with no boundary
  edges, non-manifold edges, duplicate inner shell, or unapplied topology-
  changing modifier hidden from evaluated counts.

Recommended isolated ownership:

- collection: `COL_Proposal_FrontFender_PackageB_Longitudinal_V01`
- object: `PROPOSAL_SM_Scooter_FrontFender_PackageB_Longitudinal_V01`
- preview materials: `MAT_Preview_FenderShell` and, only on the same test
  shell/ribbon, `MAT_Preview_FenderUnderside`
- provisional properties: `status = PROVISIONAL`,
  `package = Ride Lab front fender Package B`, `export_exclude = true`

Do not overwrite or promote the whole production fender during Package B
approval.

## Fixed evidence cameras

Capture shaded and literal actual-vertex/edge/face evidence from identical live
geometry, transform, camera, orthographic scale or lens, resolution, and frame.
Diagram wire or reconstructed proxy geometry is not acceptable.

Required cameras:

1. `brake_side_ortho` - vehicle-right orthographic side, vehicle front left;
   show both witness planes and the axle datum.
2. `nonbrake_side_ortho` - exact opposite orthographic side at identical scale;
   show the same witness planes and axle datum.
3. `top_plan_ortho` - registered orthographic top, vehicle front left; prove
   outermost endpoints, asymmetric end plans, and zero witness-plane extension.
4. `high_front_threequarter` - fixed high vehicle-right/front view proving the
   clean leading sweep, shorter rear tuck, and continuous inherited roll.
5. `center_longitudinal_section` - orthographic section through mesh-local
   `Z = 0`, showing outer surface, inner surface, uniform skin and complete arc.
6. `center_longitudinal_overlay` - the identical section camera with the V3
   silhouette, axle datum, `F`, and both `+/-0.380 m` witness planes overlaid.
7. `leading_end_close` - grazing close-up proving a clean shell-only rolled end
   on the leading witness plane.
8. `trailing_end_close` - grazing close-up proving the shorter tucked shell-only
   return on the trailing witness plane.

Cameras 1-6 require matched shaded and literal-wire pairs. Cameras 7-8 require
shaded close-ups and may share one matched wire close-up if both complete end
transitions and their witness planes remain legible.

## Evidence manifest and promotion

The evidence manifest must report:

- object and collection names, status, parent, transforms, and axle datum;
- the frozen `fore_aft_axis_local` and axle-datum origin used by measurement;
- leading and trailing projected extrema, total chord and per-plane errors;
- evaluated vertices, edges, faces, triangles, components, boundary edges,
  non-manifold edges, signed volume, and modifier state;
- station count and projected station percentages;
- Package A section comparison at leading, center, and trailing samples; and
- confirmation that no Package C or unrelated geometry is present.

Package B is approved only after the same provisional version passes primary
visual, independent visual, and technical review from the complete fixed camera
set. Approval authorizes handoff to later A+B integration; it does not approve
Package C, a whole fender, or production promotion.
