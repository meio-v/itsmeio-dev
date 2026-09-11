# Upper body v001 — frozen modeling checkpoint

Approved September 11, 2026. Final shirt refinement adds a narrow crew band and restrained interior folds. Preserve this version; create v002 for any future geometry changes.

## Keep in Git

- `upper-body-v001.blend`: editable, compressed authoring scene; all image dependencies packed. Existing modifiers, shape keys, and hidden recovery objects retained.
- `references/`: approved concept and generated A-pose guide (the guide is not a calibrated multiview projection).
- `review/`: final front, side, rear, three-quarter and neckline views.
- `validate.py`, `validation.json`, `manifest.json`: reproducible geometry/dependency checks and checkpoint hashes.

This is an authoring asset, not a runtime asset. Do not load it from Next.js or replace the current public GLB. UV completion, NPR shading, rigging, and runtime export remain separate future work. The shirt mesh currently has no finished UV layout.

## Validation

Run `blender -b --python validate.py` from this directory. Optionally append `-- /path/to/approved-pre-refinement.blend` to check approved geometry preservation. The recorded run preserved 639 visible baseline meshes excluding the intentionally refined shirt, found no nonmanifold evaluated edges in the five garment meshes, and confirmed packed image dependencies. This is not general self-intersection or deformation certification.

## Local recovery and cleanup

Recovery files are outside Git at `~/.codex/art-checkpoints/character-2026-09/upper-body-v001/`:

- `upper-body-v001.blend`: exact frozen copy.
- `approved-pre-refinement.blend`: last approved fit before the final shirt detail pass.
- `head-master-v009.blend`: retained head authoring master.
- `authoring-history.zip`: scripts, references, textures, notes and JSON audit records from the working folders. Historical scripts are archival and may reference deleted intermediate scenes.
- `cleanup-inventory.json`: list of removed working files and sizes.

Superseded scene versions, candidate folders, old review pages, renders and logs from `neck-torso-v001/` and `refinement-npr-v004/` were removed after verification and recovery-copy checks. Original source assets outside those two temporary folders were not touched.
