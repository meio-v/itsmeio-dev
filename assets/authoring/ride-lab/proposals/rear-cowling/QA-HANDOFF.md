# Rear cowling isolated proposal QA handoff

## Proposal

- File: `rear-cowling-proposal.blend`
- Collection: `COL_Proposal_BodyShell_RearCowling`
- Outer mesh: `PROPOSAL_SM_Scooter_BodyShell_RearCowling`
- Inner returns: `PROPOSAL_SM_Scooter_BodyShell_RearCowling_InnerReturn`
- Upper deck: `PROPOSAL_SM_Scooter_BodyShell_RearCowling_UpperDeck`
- Booster reserve face: `PROPOSAL_SM_Scooter_BodyShell_RearCowling_BoosterReserve`
- Integration status: proposal only; the production collection and production `.blend` were not edited.

The proposal owns the continuous upper deck, mirrored side cowls, open tail aperture, shaped lower wheel-arch edges, dark inward arch/tail returns, and a deliberately unoccupied booster region. It excludes the protected seat/hoop, fender, wheel, rear mechanicals, exhaust, booster, lamps, rider, physics, and anchors.

## Evaluated topology

| Object | Vertices | Edges | Faces | Triangles |
| --- | ---: | ---: | ---: | ---: |
| Outer rear cowling | 476 | 948 | 474 | 948 |
| Inner returns | 244 | 476 | 238 | 476 |
| Upper deck | 118 | 236 | 120 | 232 |
| Booster reserve face | 4 | 4 | 1 | 2 |
| Total | 842 | 1,664 | 833 | 1,658 |

The closed outer and inner-return evaluated meshes report zero boundary edges and zero edges shared by more than two faces. The upper deck and booster reserve are intentionally open manufactured surface layers. The outer mesh uses Solidify, a selective one-segment angle bevel, and weighted normals. The inner return uses Solidify, a selective two-segment bevel, and weighted normals. The upper deck uses thin Solidify, one-segment edge softening, and weighted normals. There is no Subdivision Surface modifier.

## Reference gate

**Result: PASS**

The mandatory comparison was performed with exactly these four images loaded together:

1. canonical `scooter-reference/body-shell.png`;
2. focused `scooter-reference/body-shell-part-rear-cowling-v1.png`;
3. live `rear-cowling-live-evaluated-faces-edges.png`;
4. live `rear-cowling-live-evaluated-vertices-count.png`.

The supervisor-rejected rectangular-cap draft was replaced. The current evaluated longitudinal and cross-shell bands are concentrated at the inset under-seat deck, tapered crown, swept shoulder/chine, framed tail aperture, seven-station wheel-arch curvature, substantial lower returns, and inward black lip. Broad manufactured panels stay sparse. The shaded and topology evidence show a distinct shallow deck, top-view taper, convex side volume, diagonal character band, deliberate wall thickness, clean open tail, and separate dark returns without invented lamps, ribs, vents, or mechanical detail.

## Assembly-interface gate

**Result: PASS**

- Front boundary is an open, centered rising seam at approximately `X=0`, reserved for supervisor resolution against the step/floor rear wall and sill return.
- Depsgraph BVH checks report zero overlap pairs against the protected front seat, rear seat, rear seat base, grab rail, both grab-rail feet, and both grab-rail supports.
- `ANCHOR_Seat`, `ANCHOR_Wheel_Rear`, and `ANCHOR_Booster` remain unchanged.
- The booster-side region remains unoccupied. A clean planar reserve face is present without holes, fasteners, mount bosses, or booster geometry.
- The rear aperture and arch stay open for excluded tail hardware, fender, wheel, and mechanical systems.

## Evidence

Clean views and topology evidence are under `docs/testing/ride-lab-scooter-captures/body-shell/rear-cowling/`:

- `rear-cowling-hero.png`
- `rear-cowling-left.png`
- `rear-cowling-right.png`
- `rear-cowling-front.png`
- `rear-cowling-rear.png`
- `rear-cowling-top.png`
- `rear-cowling-underside.png`
- `rear-cowling-seat-hoop-context.png`
- `rear-cowling-live-evaluated-faces-edges.png`
- `rear-cowling-live-evaluated-vertices-count.png`

## Integrator note

Only the supervisor may copy approved proposal meshes into `COL_Geo_Authored`, rename them for production, and resolve the front seam against the step/floor package. The proposal does not authorize edits to the committed seat/hoop milestone or any protected anchor/system.
