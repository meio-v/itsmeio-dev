# Ride Lab rider: decisions

Durable ledger. Newest first within each date. Record what was decided, by whom, and its limits. Separate proposals from decisions.

## 2026-11-20 — Harness (approved by Meio)

1. **In-repo harness.** The agent harness lives in the repo at `teammates/` and is committed. `decisions.md` replaces a Linear decisions ledger; this repo has no Linear. `state.md` is disposable current state only.
2. **Separate role files.** Roles are standalone copies adapted for game dev, not overrides of the meio-skills roles. They keep: Meio approves scope, merges, releases and deployments; nothing ships until Meio has personally seen it; QA is independent of the Developer; never claim review that didn't happen. Evidence is local (lint, typecheck, `test:*`, `verify:ride-lab*`, Playwright journeys, before/after screenshots).
3. **Two art roles.** The 3D Artist is the sole Blender operator and owns everything up to a working, documented GLB. The Art Director never edits Blender scenes; owns references, gold baselines, registries, the two-family review panel and acceptance prep, and cannot approve.
4. **3D Artist ↔ Developer boundary.** The Developer owns runtime code (loading, mall placement, physics/colliders, shaders, bounded secondary motion). The Developer must not reshape or re-pose assets in code to hide a bad export (ADR 0001); asset fixes go back to the 3D Artist. Mall placement stays in code for now.
5. **Bindings.** As in [assignment.md](assignment.md). If a bound model is unavailable, tell Meio; never silently substitute.
6. **Skills.** Preferred skills per role in [skills.md](../../skills.md). Meio's own skills are preferred over third-party equivalents. `blender-3d-modeling` is not used. No BuildPass skills.
7. **First project.** This project covers R01–R15. The task map stays at `docs/ride-lab/RIDER_EPIC.md` as the only tracker.
8. **Accepted art in the repo.** Accepted and gold art goes in the repo via Git LFS (about 80 MB: scooter-accepted about 36 MB, character-2026-09 about 44 MB). Iterations stay local and disposable. The LFS migration itself still needs Meio's approval.
9. **Checkpoint cleanup.** Only after the 3D Artist's read-only audit and Meio's approval.

## Earlier accepted facts (from existing docs)

- **2026-10-13 — Scooter v012 appearance accepted.** Native file at `~/.codex/art-checkpoints/scooter-accepted-2026-10-13/v012/scooter-orbit-lines-clean.blend`, SHA256 `f4befb9d29b35c2b0c0e1329885b995e52c77f652e767113d2d3636ea49926a7`. Source: RIDER_EPIC.md.
- **2026-08-31 — `rider-helmet` gold v001 approved.** `docs/art/ride-lab/baselines/rider-helmet/v001/`. Source: docs/art/ride-lab-character-context.md.
- **2026-08-30 — ADR 0001 accepted.** Rider and scooter are authored natively in Blender via Blender MCP; the reviewed `.blend` is the source of truth and the GLB is the delivery artifact.

## 2026-11-20 — Independence from the BuildPass harness

- This harness stands alone. The entry point is `AGENTS.md` → `teammates/README.md`. It does not depend on `$ask-pm`, `~/Dev/meio-skills/teammates/` or `~/.teammates`, which are BuildPass-only.
- Correction (Meio-approved): `heavy-slot` is general machine-wide tooling, not BuildPass. Heavy jobs here use `heavy-slot --label <name> -- <command>` so every job on the shared 16 GB Mac shares one lock. Do not build a separate limiter. Exit 76 = stopped for memory: report it, don't retry right away.

## 2026-11-20 — Checkpoint cleanup

- Audit: docs/ride-lab/checkpoint-audit-2026-11-20.md (3D Artist). PM spot-checked v012 SHA256 `f4befb9d…26a7` (matches) and sizes.
- Meio: "i would like to delete scooter history", on condition of a written build ledger ("cant you write a ledger of how it was built"); approved the plan with "perfect". Plan: Art Director writes docs/art/ride-lab/scooter-build-history.md + per-stage contact sheets + a keep list → PM verifies → irreplaceable files committed with Git LFS on a branch and pushed as backup (merge separate) → delete the Oct 5–6 archive and Oct 7 experiments → PM re-verifies kept checksums.
- The deletion itself still waits for Meio's explicit "delete" after reading the history.
- LFS keep set is ~0.6 GB, not the earlier ~80 MB estimate (v052 rig and poses add ~360 MB). GitHub free LFS bandwidth is 1 GB/month.
- Meio: "happy for you to do the decisions for me" — taken as delegation for routine calls within this cleanup; deletions, merges and deploys still need his explicit word.
- Deferred: the eight character part candidates, rider autosaves and the `scooter-layout-v003` proposal stay until the epic reaches them.
- 2026-11-20 Meio: "delete", after reading the scooter build history (docs/art/ride-lab/scooter-build-history.md). Scope: delete ~/.codex/art-checkpoints/scooter-workspace-2026-10-05, -10-06 and -10-07 AFTER (1) the 17 core files are committed with Git LFS on branch `chore-preserve-accepted-art` and pushed, and (2) the rest of the 1,786-file keep list (docs/art/ride-lab/scooter-build-history-keep.md) is moved to ~/.codex/art-checkpoints/scooter-kept-2026-11-20/ and checksum-verified. Any mismatch stops the run. Merge of the branch is a separate decision. PM decision under Meio's delegation: only the 17 files go to LFS (GitHub free tier 1 GB); the other ~2.9 GB stays local, not backed up.
