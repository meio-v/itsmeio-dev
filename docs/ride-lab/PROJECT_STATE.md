# RideLab state — pre-scooter-remodel (2026-09-14)

Next: rough scooter layout around a rider mannequin; approve seat/deck/handlebar fit before detailed bodywork. Keep the existing character rig. Jacket repair is paused until seating is settled.

## Saved checkpoints

All paths below are under `assets/authoring/ride-lab/character-2026-09/rigging-v001/`:

- `character-v052-rigged-v001.blend` — neutral recovery rig; 22 body bones and original 26-bone hand rigs per side.
- `seated-v002/character-v052-v002-{riding,stopped}.blend` — working poses, improved IK/hand fitting, stable jacket colour masks. Not approved final proportions or garment deformation.
- `scooter-layout-v003/scooter-layout-v003.blend` — experimental deeper footwell; rider unchanged and feet not refitted. Not the remodel baseline by default.
- `jacket-diagnostic-v003/review.html` — elbow pinch survives smoothing/shape-key toggles. Next jacket trial: local weights, then corrective shapes if needed.

Build scripts, verification reports and detailed notes live alongside these files. No runtime export yet. Preserve the frozen v052 character; do not overwrite recovery files.

## Backup

Local pre-remodel copy outside the worktree:
`/Users/jeromeiovelarde/.codex/ride-lab-pre-remodel-20260914-fCoCMH/`

Contains the entire `rigging-v001` folder (copy verified against source) and `character-v052-FROZEN.blend`. This is a local backup, not remote storage. The rigging folder is still untracked in Git; this note does not commit it.
