# Rider Lab character context

## Purpose

This document records Rider Lab-specific decisions for the playable mascot and
tracks the visual baselines used to build it. Reusable generation and modeling
procedure belongs in `$reference-factory` and `$sculpt-a-thing`, not here.

The existing mall donor at `public/mall/assets/rider.glb` and the RideLab rider
at `public/mall/ride-lab/streetwear-rider.glb` are runtime artifacts, not the
newly approved character source. Neither is replaced by this authoring update.

## Current approved character — v052

On 2026-09-13, the user approved and froze the complete modeled character and
identified it as the intended scooter rider for RideLab. The
[v052 approval record](../../assets/authoring/ride-lab/character-2026-09/model-freeze-v052/README.md)
identifies the exact local Blender checkpoint, checksum, publication hold and
rigging handoff.

The approved model has black hair and glasses, a yellow/charcoal jacket with a
yellow hood and grey inner lining, a coral shirt with an enlarged orange-cat
graphic, loose dark trousers, and cream/black/gum shoes. The jacket may partly
occlude the shirt graphic while its face and ears remain legible. Preserve the
approved face, silhouette, clothing fit, palette and line art when rigging.

This is approval of the modeled authoring result, not a newly generated concept
sheet or a runtime-ready character. Rigging is authorized in a separate copy;
the canonical scooter pose and subsequent runtime delivery still need their
own verification. The source `.blend` remains local pending shoe-donor license
verification. Do not use the older helmet/half-zip direction below to redesign
this frozen model.

## Historical character direction — August 2026

The following direction and image registry are retained for provenance. They
describe the earlier design, not the authority for the v052 rigging pass.

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

At that checkpoint, the whole-character direction was approved but its
whole-model golden screenshot baseline had not been generated. The helmet was
the first approved isolated-part gold and is registered below.

## Visual-baseline contract

An approved image set is the expected visual result (the **gold**). A Blender
render made from the working model is the **actual**. Fixed views let the actual
be reviewed against the gold like a screenshot assertion. The comparison is
judgment-based—silhouette, proportion, construction, negative space, color and
material boundaries—not literal pixel equality.

Gold changes only through a newly approved `$reference-factory` baseline. Model
iterations and actual renders must not silently redefine it. `$sculpt-a-thing`
owns convergence of an isolated model part against the registered gold.

## Historical image-baseline registry

Use one row for the complete character and one row for each independently
reviewed part. A direction can be approved before its golden images exist.

| Baseline ID | Scope | Status | Reference path | Notes |
| --- | --- | --- | --- | --- |
| `rider-character` | Complete character | Superseded | — | Replaced for current authoring by the user-approved modeled checkpoint `character-v052`; see the v052 record above. |
| `rider-helmet` | Complete helmet assembly | Gold approved | `docs/art/ride-lab/baselines/rider-helmet/v001/` | Approved 2026-08-31. Fixed views: front, left side, top, and rear-left isometric. `sheet.png` preserves the approved composite. |
| `rider-head` | Bare head, face, ears, scalp, and neck connection | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-head/v001/sheet.png` | Review facial identity and scalp fit under the separate hair and helmet. |
| `rider-hair` | Complete hair assembly | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-hair/v001/sheet.png` | Crown and rear construction were hidden in the character authority and require explicit approval. |
| `rider-jacket` | Jacket torso and blue underlayer | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-jacket/v001/sheet.png` | Sleeves are a separate approval unit. |
| `rider-sleeves` | Paired asymmetric sleeves | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-sleeves/v001/sheet.png` | Includes the approved cat patch placement on the coral sleeve. |
| `rider-hands-gloves` | Paired forearms, hands, and fingerless gloves | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-hands-gloves/v001/sheet.png` | Review sleeve-cuff interfaces and finger proportions. |
| `rider-trousers` | Complete paired trouser garment | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-trousers/v001/sheet.png` | Waist utility is a separate approval unit. |
| `rider-waist-utility` | Belt, buckle, and pouch assembly | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-waist-utility/v001/sheet.png` | Belt closure and pouch construction require explicit approval. |
| `rider-footwear` | Paired shoes | Gold candidate | `docs/art/ride-lab/baseline-candidates/rider-footwear/v001/sheet.png` | Review ankle and trouser-cuff interfaces. |

Do not add a part row until that part has been deliberately selected for an
isolated baseline. Do not mark a row `Gold approved` without explicit approval
of its complete fixed-view image set.

The retained part-image statuses record their historical reviews; they do not
reopen or override the later whole-model v052 approval.

Allowed status values:

- `Direction approved; gold not generated`
- `Gold candidate`
- `Gold approved`
- `Superseded` (retain the replacement baseline ID in Notes)

## Naming and paths

Store unapproved candidates under:

```text
docs/art/ride-lab/baseline-candidates/<baseline-id>/<revision>/
```

Candidate directories preserve generated sheets for review but are not valid
`$sculpt-a-thing` gold. Promote an explicitly approved set into the approved
baseline path and add its fixed-view files before modeling against it.

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
