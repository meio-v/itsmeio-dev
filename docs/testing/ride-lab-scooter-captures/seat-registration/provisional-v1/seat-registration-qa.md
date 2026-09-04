# Ride Lab scooter seat registration — provisional v1

Status: `PROVISIONAL_NOT_USER_APPROVED`

The approved seat and grab-hoop geometry remains untouched in `COL_Geo_Authored`. The visible candidate is a separate 45-object duplicate in `COL_SeatRegistration_Provisional_v1`, driven by `CTRL_SeatRegistration_Provisional_v1`.

## Authorities reopened for this pass

- Whole-scooter canonical: `assets/authoring/ride-lab/scooter-reference/turnaround-three-band.png`
- Focused seat construction and topology intent: `assets/authoring/ride-lab/scooter-reference/seat-construction-parts-v1.png`
- Seat assembly reference: `assets/authoring/ride-lab/scooter-reference/seat.png`
- User-supplied live side evidence: `C:\Users\Meio\AppData\Local\Temp\codex-clipboard-c94876ef-79d2-4cf0-99af-445ace87744c.png`

## Provisional transform

- Translation: `(+0.120000 m, 0.000000 m, 0.000000 m)`
- Direction: world `+X`, the scooter's rearward direction
- Rotation change: none
- Scale change: none
- Geometry, modifiers, materials, pivots, and approved mesh data: unchanged

## Geometry and topology preservation

- Accepted objects: 45
- Provisional objects: 45
- Mesh hash mismatches: 0
- Vertex/edge/face count mismatches: 0
- Maximum matrix error versus `Translation(+0.12 X) × accepted world matrix`: `1.69e-7`
- Actual evaluated provisional topology: 3,544 vertices, 6,988 edges, 3,526 faces
- Accepted seat/body triangle overlaps: 0
- Provisional seat/body triangle overlaps: 0

The shift adds no topology. Cushion density, edge flow, face distribution, underside ribs, hoop curvature, and mounting hardware remain exactly those of the accepted seat milestone.

## Registration gates

| Gate | Baseline | Provisional +0.12 m X | Verdict |
|---|---:|---:|---|
| Front cushion overhang ahead of rear-cowling envelope | 376.3 mm | 256.3 mm | Improved |
| Front cushion overhang ahead of upper-deck start | 529.8 mm | 409.8 mm | Improved, still visually forward |
| Rear cushion clearance to cowling tail | 267.4 mm | 147.4 mm | Pass |
| Grab-hoop clearance to cowling tail | 132.2 mm | 12.2 mm | Pass, tight; do not move farther rearward |
| Grab-hoop lateral clearance inside cowling envelope | — | 161.6 mm | Pass |
| Rear pair of front-base bosses to authored shell | 38.2 mm gap | 18.4–18.6 mm gap | Improved |
| Forward pair of front-base bosses to authored shell | No supporting top surface at probe location | Still no supporting top surface | Hold |
| Rear-base mounting ears to authored shell | 63.1 mm gap | 60.4–60.5 mm gap | Hold; existing gap remains |
| Hoop feet to authored shell | 55.8–56.0 mm gap | 54.5–55.5 mm gap | Hold; existing gap remains |
| `ANCHOR_Seat` location | `(0.12, 0, 0.6)` | unchanged | Pass |
| `ANCHOR_Seat` inside front cushion | yes; 32.7 mm rear margin | yes; 152.7 mm rear margin | Pass/improved |
| Rider/contact geometry | none present in this Blender scene | none altered | Not directly testable |

## Visual and assembly verdict

- Individual seat reference/topology gate: **PASS (unchanged approved geometry)**.
- Registration direction: **IMPROVED** against the canonical and user side evidence.
- Assembly-interface gate: **HOLD**. The translation reduces the forward-looking overhang, but it does not resolve the visible body-side support and mounting gaps. Moving farther rearward is unsafe because the grab hoop is already within 12.2 mm of the cowling tail envelope.
- Promotion gate: **NOT RUN / USER APPROVAL REQUIRED**. The accepted assembly remains preserved and hidden; provisional v1 is visible for review.

If the registration is visually accepted, body-side mounting saddles or interface surfaces should be reviewed separately without reshaping the committed seat or hoop. A larger rearward seat translation is not recommended.

## Evidence

Matched whole-scooter context:

- `baseline-solid/`
- `provisional-solid/`
- `provisional-topology/`

Matched seat-focused context and isolated solid/topology:

- `focus-solid/`
- `focus-isolated-solid/`
- `focus-topology/`

Each directory contains side, front, rear, top, high-three-quarter, and chase/gameplay views. Focus isolated solids and focus topology images use the same six camera transforms and framing. Cyan lines are derived from every evaluated mesh edge; orange markers are derived from every evaluated mesh vertex.
