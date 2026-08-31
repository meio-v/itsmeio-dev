# Rider Lab character context

## Purpose

This document records Rider Lab-specific decisions for the playable mascot and
tracks the visual baselines used to build it. Reusable generation and modeling
procedure belongs in `$reference-factory` and `$sculpt-a-thing`, not here.

The current `public/mall/assets/rider.glb` is a donor asset used by the existing
mall runtime. It is not the approved target design or a visual baseline.

## Approved character direction

- Role: masculine playable mascot; agile all-rounder built around tricks.
- Proportions: compact, youthful, chibi-influenced body with an oversized head,
  thin limbs, large grounded footwear, and arms long enough to ride, pose, and
  expose a clean silhouette.
- Attitude: DIY garage-punk with some edge, but never edgelord, fantasy-led, or
  whimsical.
- Headgear: stylized half retro scooter helmet with a readable visor/goggle
  treatment.
- Top: half-zip garment carrying one simple gear-and-deadpan-ragdoll-cat emblem.
- Bottom: oversized trousers with strong garment mass and without patch-heavy
  decoration.
- Palette: colorful and designed to complement, rather than match, the pastel
  matcha-green moped. Black may anchor the palette but must not dominate it.
- Presentation: stylized 3D with NPR clarity, readable masses, and practical
  game-character construction. It must not read as painterly key art.

This whole-character direction is approved. No whole-model or isolated-part
golden screenshot baseline has been registered yet.

## Visual-baseline contract

An approved image set is the expected visual result (the **gold**). A Blender
render made from the working model is the **actual**. Fixed views let the actual
be reviewed against the gold like a screenshot assertion. The comparison is
judgment-based—silhouette, proportion, construction, negative space, color and
material boundaries—not literal pixel equality.

Gold changes only through a newly approved `$reference-factory` baseline. Model
iterations and actual renders must not silently redefine it. `$sculpt-a-thing`
owns convergence of an isolated model part against the registered gold.

## Baseline registry

Use one row for the complete character and one row for each independently
reviewed part. A direction can be approved before its golden images exist.

| Baseline ID | Scope | Status | Gold path | Notes |
| --- | --- | --- | --- | --- |
| `rider-character` | Complete character | Direction approved; gold not generated | — | Approved direction is recorded above. |
| `rider-helmet` | Complete helmet assembly | Gold approved | `docs/art/ride-lab/baselines/rider-helmet/v001/` | Approved 2026-08-31. Fixed views: front, left side, top, and rear-left isometric. `sheet.png` preserves the approved composite. |

Do not add a part row until that part has been deliberately selected for an
isolated baseline. Do not mark a row `Gold approved` without explicit approval
of its complete fixed-view image set.

Allowed status values:

- `Direction approved; gold not generated`
- `Gold candidate`
- `Gold approved`
- `Superseded` (retain the replacement baseline ID in Notes)

## Naming and paths

Store approved gold under:

```text
docs/art/ride-lab/baselines/<baseline-id>/<revision>/
```

Use a stable, descriptive baseline ID such as `rider-character`,
`rider-helmet`, or `rider-trousers`; use revisions such as `v001`. Each approved
set uses these filenames when the view applies:

```text
front.png
side.png
top.png
isometric.png
```

The complete-character gold uses a neutral, rig-friendly A-pose with the full
head, arm span, and footwear visible at one consistent scale. The front, side,
and top views are orthographic; isometric supplies the spatial read.

Part baselines may also include narrowly named views when needed to expose an
attachment, opening, rear surface, or negative space. Record any additional
view names in the registry Notes. Keep Blender actual renders outside the gold
directory so expected and actual images cannot be confused.
