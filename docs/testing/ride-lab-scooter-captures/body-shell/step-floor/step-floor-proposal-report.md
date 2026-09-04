# Ride Lab step-through and floor proposal review — refinement 2

## Authority and scope

- Canonical authority: `assets/authoring/ride-lab/scooter-reference/body-shell.png`
- Focused authority: `assets/authoring/ride-lab/scooter-reference/body-shell-part-step-floor-v1.png`
- Secondary whole-scooter consistency: `assets/authoring/ride-lab/scooter-reference/turnaround-three-band.png`
- Isolated proposal: `assets/authoring/ride-lab/proposals/step-floor/ride-lab-step-floor-proposal.blend`
- Proposal collection: `COL_Proposal_BodyShell_StepFloor`
- Axes: +X rearward, +Y scooter-left, +Z up; meters; Y=0 center plane.

This pass replaces the rejected flat-slab cage. The focused wireframe remains relative density guidance rather than literal topology.

## Manufactured-surface resolution

- The black inner shield now has seven routed width bands, a gentle transverse crown, modeled thickness, raised perimeter return, and three shallow structural bands.
- The floorboard has seven routed width bands, controlled transverse crown, modeled thickness, a subtle center channel, two shallow raised pads, and a rounded perimeter rise while retaining a broad clear rider-foot area.
- The green rocker uses tapered transverse sections, softened front/rear chamfer transitions, a deliberate lower step, and a nested black underside return.
- Front and rear terminations are clean inward returns intended for supervisor seam resolution; neither absorbs the apron nor rear cowling.
- No blanket Subsurf or unrelated mechanical detail was added. Selective angle-limited one-segment bevels are restricted to manufactured edges.

## Evaluated topology

Dependency-graph evaluated totals: **690 vertices, 716 faces**, below the 900/900 package ceiling.

| Stable object | Vertices | Faces | World bounds X / Y / Z (m) |
| --- | ---: | ---: | --- |
| `SM_Proposal_Scooter_StepFloor_InnerShield` | 154 | 156 | -1.2557..-0.7105 / -0.3946..0.3946 / -0.4151..0.7697 |
| `SM_Proposal_Scooter_StepFloor_Floorboard` | 150 | 154 | -0.7353..0.2567 / -0.4200..0.4200 / -0.4596..-0.2411 |
| `SM_Proposal_Scooter_StepFloor_Rocker` | 128 | 132 | -0.9584..0.4034 / -0.4850..0.4850 / -0.6467..-0.3339 |
| `SM_Proposal_Scooter_StepFloor_Underside` | 90 | 92 | -0.7637..0.2609 / -0.4350..0.4350 / -0.5540..-0.4193 |
| `SM_Proposal_Scooter_StepFloor_Pad_L` | 24 | 26 | -0.5800..0.0800 / 0.1600..0.3000 / -0.3790..-0.3650 |
| `SM_Proposal_Scooter_StepFloor_Pad_R` | 24 | 26 | -0.5800..0.0800 / -0.3000..-0.1600 / -0.3790..-0.3650 |
| `SM_Proposal_Scooter_StepFloor_CenterChannel` | 24 | 26 | -0.6000..0.1000 / -0.0550..0.0550 / -0.4160..-0.4070 |
| `SM_Proposal_Scooter_StepFloor_ShieldPanel_Upper` | 24 | 26 | -1.1950..-1.1650 / -0.2350..0.2350 / 0.4200..0.4900 |
| `SM_Proposal_Scooter_StepFloor_ShieldPanel_Mid` | 24 | 26 | -1.1050..-1.0750 / -0.2550..0.2550 / 0.1400..0.2200 |
| `SM_Proposal_Scooter_StepFloor_ShieldPanel_Lower` | 24 | 26 | -0.9650..-0.9250 / -0.2700..0.2700 / -0.1200..-0.0500 |
| `SM_Proposal_Scooter_StepFloor_LowerStep` | 24 | 26 | -0.3800..-0.0300 / -0.4300..0.4300 / -0.5550..-0.5300 |

All proposal objects retain identity transforms and the existing preview material classifications: black liner/floor/underside features use `MAT_Preview_Ink`; the sill and deliberate lower step use `MAT_Preview_Cream`.

## Mandatory four-image reference gate

The gate was reviewed with exactly these four images loaded together:

1. `assets/authoring/ride-lab/scooter-reference/body-shell.png`
2. `assets/authoring/ride-lab/scooter-reference/body-shell-part-step-floor-v1.png`
3. `step-floor-gate-live-shaded-evaluated-faces.png`
4. `step-floor-gate-live-evaluated-vertices-count.png`

The comparison covered face bands, edge routing, vertex concentration, panel relief, wall thickness, returns, and shaded highlights. Evaluated edges are dependency-graph-derived curve overlays; orange markers are placed at every actual dependency-graph evaluated vertex. The count is rendered in the vertex evidence image.

Additional clean shaded evidence: `step-floor-shaded-hero.png`, `step-floor-shaded-side.png`, `step-floor-shaded-front.png`, `step-floor-shaded-rear.png`, `step-floor-shaded-top.png`, and `step-floor-shaded-underside.png`.

Additional evidence: `step-floor-evaluated-faces-side.png`, `step-floor-evaluated-vertices-side.png`, `step-floor-placeholder-context-hero.png`, and `step-floor-placeholder-context-side.png`. Cyan context cages are explicitly labeled non-production placeholders copied from source geometry and excluded from all counts.

## Interface and protection checks

- `ANCHOR_Footboard_L` (-0.36, +0.29, -0.40) and `ANCHOR_Footboard_R` (-0.36, -0.29, -0.40) remain within the tread envelope and unchanged.
- The front return remains inside the apron interface and does not include the outer apron.
- The rear rise stops as an inward return for later cowling resolution.
- The sill remains centered and continuous; underside layers are intentionally depth-separated rather than coplanar.
- No front/rear outer shell, fender, wheel/fork, mechanical, exhaust, rider, collision, physics, gameplay, booster, light, seat, or hoop geometry is included.
- `lowpolybase.004`, protected seat/hoop objects, anchors, armature, pivots, source collections, and `COL_Geo_Authored` were not edited, moved, renamed, or deleted.

## QA verdicts

- **Individual reference gate: PASS.** The refined cage now carries sufficient manufactured-surface definition while preserving the canonical U silhouette, black/green classification, economical topology, foot space, thickness, and panel-flow hierarchy.
- **Assembly-interface gate: PASS WITH INTEGRATOR CHECK.** Isolated keep-outs, anchors, return directions, and ownership pass. The supervisor must perform the final shared-seam gap/intersection check against the accepted front apron and later rear cowling before integration.

