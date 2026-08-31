# Ride Lab rider internal line art

This note defines which small character details are intentionally deferred from
modeling to the rider's later NPR pass. It supplements, and does not override,
the Blender-native authoring decision in
`docs/adr/0001-blender-mcp-native-asset-authoring.md`.

## Ear modeling boundary

The production ear uses the following anatomical sculpt specification:

- **helix:** broad outer roll, strongest at the upper and posterior perimeter
  and tapering into the lower ear;
- **antihelix:** broad internal rise with a shallow upper fork, blended into the
  pinna rather than applied as a strip;
- **lobule:** soft attached lower mass, rounded and tapered rather than pointed;
- **tragus:** one small anterior projection overlapping the concha entrance;
- **concha:** one continuous offset bean/teardrop bowl, never two holes or a
  radial funnel.

The production ear mesh must therefore establish the form that line art cannot
repair:

- the outer pinna silhouette and forward-facing orientation;
- the root attachment, upper-posterior fullness, tragus projection, and
  attached lobe;
- the broad helix, antihelix, lobule, tragus, and concha relief required for the
  pinna to remain dimensional in profile and high-three-quarter views;
- correct mirrored chirality and clean Head-bone deformation.

Only the following fine graphic cues are deferred to internal line art after
those sculpted anatomical forms pass the modeling gate:

- the tapered C-shaped helix/rim cue;
- the concha boundary and its single continuous recessed-bean read;
- the forked antihelix Y.

These marks are not permission to ship a flat ear, hide a bad silhouette, omit
the antihelix or concha, or replace the tragus and lobule with drawn symbols.
The mesh supplies every anatomical mass; the ink clarifies their smallest edge
cues.

## Authored marks

The ear marks use the following semantic names in authoring notes and review:

| Mark | Required read | Exclusions |
| --- | --- | --- |
| `ear-helix-c` | Broad C following the upper and rear outer pinna, tapering before the anterior tragus and lower lobe | No closed oval, donut, uniform ring, or printed circuit path |
| `ear-concha` | One offset bean/teardrop boundary opening toward the tragus | No paired black triangles, center hole, or radial pinwheel |
| `ear-antihelix-y` | Broad Y shifted upper-posterior, with its fork above the concha | No centered rune, narrow glyph, or shape that partitions the bowl |

Line weight tapers at stroke ends. The helix is the strongest internal ear
stroke, the concha is slightly lighter, and the antihelix Y is lightest. All
three must remain subordinate to the outer head silhouette.

## Deferred implementation

Choose the line-art representation during the NPR pass, after the underlying
ear and face forms are approved. Prototype the simplest viable option in the
actual gameplay camera before committing to UV masks, mesh lines, or another
runtime technique. Preserve left/right chirality and keep internal marks
subordinate to the outer silhouette; otherwise the implementation remains open.
Whichever representation is selected, keep its editable source in the reviewed
Blender scene and deliver it through the asset handoff defined by the ADR.

## Review gate

Review the result in the gameplay camera and one close profile against the
canonical turnaround and accepted ear reference:

1. The ear still reads clearly when the ink is disabled.
2. The enabled marks clarify the forms without becoming the dominant feature.
3. The result remains stable in motion and preserves left/right chirality.

The user approves the final appeal and line weight.

This is a part-level aesthetic gate. It does not replace the ADR's final
fixed-view Blender and matching runtime handoff evidence.
