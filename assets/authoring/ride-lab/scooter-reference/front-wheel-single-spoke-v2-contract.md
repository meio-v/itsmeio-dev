# Front wheel single structural spoke V2 binding contract

This Reference Factory correction resolves the V01–V02 conflict between the accepted soft root/tip transitions and the former `16–20` triangle prism cap. The accepted `front-wheel-single-spoke-joints-decomposed-v1.png` remains visual authority; this file supersedes its per-spoke topology budget and supplies an exact economical footprint.

## Registration

- Direct parent: `wheelfront.001`
- Object local transform: identity
- Face plane: local wheel `X/Y`; axial thickness: `Z = -0.024 .. +0.024 m`
- Root begins at `R = 0.092 m`
- Tip extends to `R = 0.288 m` and is buried inside the accepted rim barrel
- Preferred face lean: approximately `1.5 degrees`; hard maximum `8 degrees`

## Ordered ten-point face footprint `(R,T)`

1. `(0.092, -0.012)` lower root seat
2. `(0.105, -0.009)` lower soft shoulder
3. `(0.125, -0.0055)` lower shaft
4. `(0.275, +0.000)` lower tip neck
5. `(0.288, +0.002)` lower buried tongue
6. `(0.288, +0.008)` upper buried tongue
7. `(0.275, +0.008)` upper tip neck
8. `(0.125, +0.0055)` upper shaft
9. `(0.105, +0.009)` upper soft shoulder
10. `(0.092, +0.012)` upper root seat

The asymmetric neck/tongue center produces restrained positive-T lean. The root uses two paired silhouette transitions before the shaft; the tip uses paired neck and tongue stations so the buried end has finite width and cannot collapse into a one-sided wedge.

## Topology and budget

- Closed ten-point axial prism: `20 vertices`, `12 polygon faces`, `36 evaluated triangles`, one positive manifold.
- Per-spoke hard cap: `40 evaluated triangles`.
- Final repetition: exactly `24` copies at `15 degrees`, first spoke at `+X`, every second station of the accepted 48-station rim.
- Repeated production target: `864 evaluated triangles`; hard cap: `960`.
- The former `16–20` per-spoke target and `<=480` repeated-spoke allowance are superseded because they cannot model both accepted joint transitions.

## Visual gate

- Root must read as a restrained two-stage shoulder seated into the hub, never as a broad triangular foot.
- Shaft must remain narrow and structural, with the approximately 1.5-degree lean visible but subtle.
- Tip must show a distinct neck at R=.275 and a narrow buried tongue at R=.288; no broad slab, exposed wedge, or floating contact.
- Root-close and tip-close evidence must use isolated solid context sections, not tangled full-ring ghost wires.
- V01 and V02 live spokes remain failed provisional history and must not be promoted.
