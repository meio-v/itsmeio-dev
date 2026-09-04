# Front apron isolated proposal — manufactured-normal and shoulder-flow correction r6

Recovery state: the interrupted correction had written nothing. Blender was open on the step-floor proposal; this task explicitly reopened only `assets/authoring/ride-lab/proposals/front-apron/ride-lab-front-apron-proposal.blend`. Production was never reopened or saved.

Authority order: `body-shell.png` is canonical. The three detail authorities are subordinate and independent: `body-shell-part-front-apron-center-insert-v2.png`, `body-shell-part-front-apron-upper-vents-v2.png`, and `body-shell-part-front-apron-lower-cheeks-v2.png`. The combined correction sheet was not used for acceptance. `body-shell-part-front-apron-v1.png` is the final whole-apron focused reference.

## Stable evaluated proposal objects

| Object | Vertices | Edges | Faces | Role |
|---|---:|---:|---:|---|
| `PROPOSAL_SM_Scooter_BodyShell_FrontApron` | 594 | 1218 | 568 | Boolean-evaluated vents, arched crowned cage, continuous cheeks, selective two-segment edge bevel, smooth-by-angle and weighted manufactured-panel normals |
| `PROPOSAL_SM_Scooter_BodyShell_FrontApron_InnerReturn` | 40 | 68 | 34 | Separate black upper return and recessed cheek lips following the same sweep |
| `PROPOSAL_SM_Scooter_BodyShell_FrontApron_CenterInsert` | 72 | 164 | 82 | Shallow 18 mm tapered conformal center insert with integrated lower termination and real perimeter thickness |
| `PROPOSAL_SM_Scooter_BodyShell_FrontApron_Vent_L` | 16 | 28 | 13 | Left framed aperture, short return, dark recessed back |
| `PROPOSAL_SM_Scooter_BodyShell_FrontApron_Vent_R` | 16 | 28 | 13 | Mirrored right aperture |
| **Total** | **738** | **1506** | **710** | Under the r6 target of 800 evaluated vertices / 800 faces |

All proposal objects have identity transforms and exist only in `COL_Proposal_BodyShell_FrontApron`. No `PROPOSAL_*` object is linked to `COL_Geo_Authored`; no protected seat, hoop, or anchor object is linked into the proposal collection. `REVIEW_WIRE_*` and `REVIEW_VERTS_*` are evidence-only curves generated from the live depsgraph-evaluated meshes.

## Four-image gate reviews

Each gate was reviewed in one loaded-together four-image inspection. Generated wireframes are relative density/flow guidance, not exact polygon-count specifications.

### 1. Center insert/spine — PASS

Paths loaded together:

1. `assets/authoring/ride-lab/scooter-reference/body-shell.png`
2. `assets/authoring/ride-lab/scooter-reference/body-shell-part-front-apron-center-insert-v2.png`
3. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-center-insert-shaded-vs-evaluated-topology.png`
4. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-center-insert-evaluated-vertices-counted.png`

Finding: the insert is a shallow 18 mm relief rather than a tall rail, tapers from a broader integrated lower termination to the upper neck, and has real perimeter thickness. Its front skin now carries a shallow 12 mm transverse crown and weighted manufactured-panel normals so it visibly conforms to the curved host instead of reading as a box-flat rail. Five sparse longitudinal stations retain the reference density intent. **PASS.**

### 2. Paired upper vents — PASS

Paths loaded together:

1. `assets/authoring/ride-lab/scooter-reference/body-shell.png`
2. `assets/authoring/ride-lab/scooter-reference/body-shell-part-front-apron-upper-vents-v2.png`
3. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-upper-vents-shaded-vs-evaluated-topology.png`
4. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-upper-vents-evaluated-vertices-counted.png`

Finding: the shell uses two exact Boolean Difference apertures before its bevel; no green face remains behind either opening. Each opening has a flush green perimeter, four short inward return walls, and a dark recessed back. Live edges concentrate at the functional opening boundary and recess, while the surrounding shell stays broad. `front-apron-upper-vents-rear-proof-{shaded,topology}.png` proves the open/recessed construction from behind. **PASS.**

### 3. Lower cheeks/side returns — PASS

Paths loaded together:

1. `assets/authoring/ride-lab/scooter-reference/body-shell.png`
2. `assets/authoring/ride-lab/scooter-reference/body-shell-part-front-apron-lower-cheeks-v2.png`
3. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-lower-cheeks-shaded-vs-evaluated-topology.png`
4. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-lower-cheeks-evaluated-vertices-counted.png`

Finding: the former rectangular prongs were reshaped into continuous shoulder extensions with four controlled stations. Their front skin remains continuous with the shield; their back edge sweeps rearward and slightly inward around the opening, and the heel narrows without collapsing wall thickness. Separate black lips are recessed and follow the same station curve. Compared with the denser generated wire guide, the live mesh deliberately uses fewer broad bands, but the functional transitions correspond and there is no material topology/shading mismatch. The wheel opening remains clear and the cheeks do not absorb the floorboard. **PASS.**

### 4. Full front skirt — PASS

Paths loaded together:

1. `assets/authoring/ride-lab/scooter-reference/body-shell.png`
2. `assets/authoring/ride-lab/scooter-reference/body-shell-part-front-apron-v1.png`
3. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-full-skirt-shaded-vs-evaluated-topology.png`
4. `docs/testing/ride-lab-scooter-captures/body-shell/front-apron/front-apron-full-skirt-evaluated-vertices-counted.png`

Finding: exact four-image review shows the prior vertical highlight bands were primarily split/flat-normal artifacts rather than missing crown sections. Smooth-by-angle plus weighted normals now produces one continuous neutral-studio highlight across the upper crown while keeping vent, seam, perimeter, and return boundaries sharp. Eight controlled height stations and nine half-width bands retain the visible center-third crown, arched top, and rounded upper shoulders. The three existing cheek stations were retuned to continue the lower host tangent, and lower manifold normals were softened; the profile no longer pauses on a horizontal shelf before the cheek. A selective two-segment bevel affects only primary edges above 43 degrees and does not blanket-subdivide broad panels. No Subdivision Surface or extra decorative loops were added. **PASS.**

Supporting final evidence includes clean shaded and evaluated-topology front, rear, left, right, top, underside, and hero views; wheel-opening front/profile/underside/hero closeups; and `front-apron-reference-vs-{shaded,topology}.png`.

## Assembly-interface review — PASS FOR INTEGRATOR REVIEW

- Upper termination remains below the excluded steering/headlamp housing.
- The central U-shaped keep-out remains clear of the front wheel, fender, and fork; the shell remains behind the front-wheel anchor at X -1.6459 m.
- Cheeks terminate before the step/floor package and use separate inward black lips; no floorboard surface is absorbed.
- Symmetry remains centered at Y=0. Rider, mechanics, protected seat/hoop, armature, physics, collision, gameplay anchors, and rear systems remain excluded.
- The three `*-overlay-context.png` captures are explicitly labeled overlay checks. Cyan wire is the untouched placeholder/source, while clean views hide it.
- Integration must suppress/replace only the front-apron faces of monolithic placeholder `lowpolybase.004`: upper neck termination, both inner-shield seams, and both lower shield heels. Leaving that region visible causes known clipping. The integrator must preserve neighboring floor/inner-liner/rear-body faces.

Final verdicts: **individual-reference PASS FOR INTEGRATOR REVIEW**; **assembly-interface PASS FOR INTEGRATOR REVIEW**. This remains an isolated proposal and is not integrated.
