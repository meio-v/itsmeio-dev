# Gates

What "accepted" and "ready" mean. The PM checks these; missing or stale evidence is not a pass.

## Art accepted (part or asset)
1. Gold baseline for the part is approved by Meio (registry: docs/art/ride-lab-character-context.md).
2. 3D Artist hands over frozen renders from the gold's fixed views, the saved `.blend` path and SHA256, and what still looks wrong.
3. Art Director's review panel ran on those renders: separate reviewers, two model families, plus a synthesis.
4. Meio's acceptance in his own words ("better" or "close" is not acceptance), recorded in the project's decisions.md.
5. Checkpoint committed with Git LFS; path, SHA256, date and quote added to docs/art/accepted-assets.md.

## Runtime asset ready (GLB)
1. Art accepted for the source `.blend`.
2. Export path and SHA256, plus the asset contract (scale, axes, pivots, anchors).
3. Browser fit check from the fixed views and the gameplay camera.

## Code ready for Meio review
1. `npm run lint`, `npm run typecheck`, and affected `test:*` / `verify:ride-lab*` pass on the current revision.
2. QA's independent verdict on the current revision.
3. For anything visible: executed browser journey and before/after screenshots.
4. Handover: before, after, why; risks; checks for Meio.

## Never without Meio's explicit word for that action
Merge, deploy, promotion to the homepage, deletion, gold changes, LFS migration.
