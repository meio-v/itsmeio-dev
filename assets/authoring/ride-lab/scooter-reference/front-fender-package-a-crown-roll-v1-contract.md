# Ride Lab front fender Package A crown/roll contract

This contract and `front-fender-package-a-crown-roll-v1.png` are the binding
post-V08 decomposition authority for **Package A only**: the transverse crown,
local center spine, uniform skin, and lateral rolled perimeter section of the
Ride Lab front fender.

The canonical identity remains `front-assembly.png`. The accepted whole-fender
context remains `front-fender-focused-v3.png`, with runtime ownership corrected
by `front-fender-v4-contract.md`. If an older whole-fender image conflicts with
the Package A transverse form, this Package A sheet and contract control.

## Ownership and handoff boundary

Package A owns:

- the symmetric cross-width exterior crown profile;
- the corresponding inner tunnel profile and uniform 3.5 mm skin;
- the 7 mm by 32 mm local center spine riding on that crown; and
- the continuous 8 mm-deep, 4 mm-radius rolled return at both lateral edges.

Package A does **not** own or decide:

- fore-aft arc, chord, station placement, leading lip, trailing return, or end
  cuts;
- saddle shape, fork-ear contact, brake-side offset, bores, caps, or fasteners;
- registration, steering, suspension travel, tire clearance, materials beyond
  preview regions, or any body/apron/fork/wheel geometry.

For isolated sculpting, build a short neutral straight test strip from the
accepted transverse section. Its fore-aft depth and temporary end caps are QA
scaffolding only and must not be promoted as Package B geometry. Package B may
sweep the accepted Package A section along its own longitudinal authority, but
may not reshape the crown, spine, skin, or roll section. Package C may attach
under the shell but may not cut, flatten, thicken, or extend Package A.

## Exact dimensions and tolerances

All dimensions are meters in the registered fender mesh-local frame.

| Feature | Binding value | Acceptance tolerance |
| --- | ---: | ---: |
| Outer width | 0.335 | +/- 0.0005 |
| Inner tunnel clear width | 0.305 minimum | no negative tolerance |
| Uniform skin thickness | 0.0035 | +/- 0.00025 |
| Center-spine height above reconstructed crown | 0.007 | +/- 0.00025 |
| Center-spine width | 0.032 | +/- 0.0005 |
| Rolled-return depth | 0.008 | +/- 0.0005 |
| Rolled-return radius | 0.004 | +/- 0.0005 |

The section is symmetric about mesh-local `Z = 0`. The sheet's enlarged
transverse section is the silhouette authority: after scaling it to the exact
0.335 m outer width, the submitted outer and inner section overlays must remain
within 0.003 m of the depicted curves outside the intentionally raised spine.

## Form acceptance gates

Package A is acceptable only when all of the following are true:

1. The base crown is one broad, shallow, continuous scooter section from left
   roll shoulder to right roll shoulder. Removing the local spine in a QA copy
   must reveal an uninterrupted smooth crown beneath it.
2. The spine is a narrow local feature exactly 32 mm wide and 7 mm high. Its
   shoulders blend into the crown; it must not become the apex of two roof
   planes or flatten the surrounding crown.
3. The outer and inner crown read as parallel surfaces at the uniform 3.5 mm
   skin thickness, excluding the intentionally thickened rolled-return path.
4. Both lateral edges terminate in the same continuous light rolled section:
   approximately one 4 mm-radius turn producing 8 mm total depth. The return
   must be visibly rounded in transverse section and high three-quarter view.
5. The rolled section joins the crown and inner tunnel without a knife edge,
   flat flange, pinched vertex, open border, or abrupt normal break.
6. Shaded front and rear views agree exactly in silhouette. Actual-wire front
   and rear views prove the same live geometry and show symmetric edge flow.
7. The high three-quarter view reads as the light Ride Lab scooter fender in
   `front-assembly.png`, not as a heavy motorcycle mudguard.
8. The underside contains no ribs, grooves, mounting features, bores, or other
   Package C decisions. A dark underside preview material is allowed only as a
   material region on the same shell.

## Anti-targets

Reject Package A if any fixed view shows:

- a gabled or tent crown;
- a broad roof apex or a full-width center plateau;
- two planar slopes using the spine as their shared ridge;
- a ballooned semicircle, squared tunnel, or heavy motorcycle-mudguard section;
- a knife edge, flat skirt, separate trim strip, dangling flange, or broken
  rolled return;
- visible faceting, pinching, shading ripples, uneven station spacing, or a
  discontinuity where the spine meets the crown;
- asymmetric crown/roll geometry; or
- any longitudinal end styling or saddle/contact geometry presented as part of
  the Package A deliverable.

## Topology and budget allocation

The raster wire is form intent, not a literal loop count.

- Use a quad-led transverse flow with explicit support for crown curvature,
  both spine shoulders, and both rolled returns. No n-gons on the evaluated
  surface.
- Keep left/right topology mirrored about mesh-local `Z = 0`.
- Use enough transverse stations to hold the 4 mm roll radius and the 32 mm
  spine cleanly in both shaded and literal-wire evidence. Do not spend loops on
  a featureless underside.
- The isolated neutral Package A test strip is capped at **192 evaluated
  triangles**, including QA end closure. Temporary labels, ghosts, overlay
  curves, and section planes are excluded but must remain non-rendering and
  outside the deliverable collection.
- Package A does not raise the accepted final production shell cap. After
  integration with Package B, the complete shell, crown, spine, skin, and
  returns must still fit within the existing **312 evaluated-triangle** shell
  budget. The complete fender remains capped at **360 evaluated triangles**
  including the two future Package C saddles.
- A higher-resolution provisional may be used to establish the accepted form,
  but promotion requires an in-budget retopology that passes the same cameras
  and overlay gate. Preserve the last visually accepted provisional until that
  retopology is approved.

Recommended isolated ownership:

- collection: `COL_Proposal_FrontFender_PackageA_CrownRoll_V01`
- object: `PROPOSAL_SM_Scooter_FrontFender_PackageA_CrownRoll_V01`
- preview materials: `MAT_Preview_FenderShell` and an optional underside region
  using `MAT_Preview_FenderUnderside`

Do not overwrite or promote the production fender during Package A approval.

## Fixed evidence cameras

Capture shaded and literal actual-edge wire images from the same object,
transform, camera, lens/orthographic scale, and resolution. Wire evidence must
show the live mesh edges and vertices, not a diagram or reconstructed proxy.

Required cameras:

1. `true_front` - orthographic vehicle-front view centered on the transverse
   section; tire/fork may appear only as faint context.
2. `true_rear` - exact opposite orthographic view at the same scale.
3. `high_front_threequarter` - fixed high right-front three-quarter view proving
   the broad crown, local spine, and both rolled edges.
4. `transverse_section` - orthographic enlarged cut at the strip centerline,
   showing the actual outer surface, inner surface, skin, spine, and both rolls.
5. `transverse_section_overlay` - the identical section camera with the accepted
   sheet curve registered to 0.335 m and the 3 mm tolerance band visible.
6. `left_roll_grazing` and `right_roll_grazing` - mirrored close grazing views
   proving the 4 mm-radius/8 mm-depth return and tangent transitions.
7. `crown_grazing` - a shallow grazing view across the center proving that the
   spine locally rides on a continuous crown without a tent ridge or pinch.

At minimum, cameras 1-5 require matched shaded and actual-wire pairs. Cameras
6-7 require shaded images and may share a single matched wire close-up if both
rolls and the spine-support loops are legible.

## Promotion and handoff

Package A may be handed to Package B only after:

- all dimensional, overlay, form, anti-target, topology, and budget gates pass;
- primary visual, independent visual, and technical reviewers approve the same
  version;
- the accepted Blender object and its evidence manifest identify identical
  geometry and evaluated triangle counts; and
- the approved Package A object remains preserved while downstream work uses a
  duplicate or derived sweep.

Package A approval does not approve a whole fender. Do not add or evaluate
Package B longitudinal ends or Package C saddles in this sculpt pass.
