# Preferred skills

Skills a role should reach for first. Read a skill before using it. Skills cannot expand a role's authority or waive evidence.

Harness key: **Codex** = `~/.codex/skills`. **Claude** = `~/.claude/skills` (most also in `~/.agents/skills`). All entries verified present on 2026-11-20.

★ = Meio's own skill. Prefer it over a third-party equivalent.

Do not use BuildPass skills here (`genesis-*`, `work-in-scheduling`, `scheduling-*`, `support-triage-briefs`, `write-changelog`, `buildpass:*`).

## PM (Claude)

- `grilling` — stress-test a plan with Meio.
- `wayfinder` — shared map for a large effort; the project tracker still owns status.
- `taste` — when a report feels generic or over-complete.

## Architect (Claude)

- `grilling` — unresolved decisions, one question at a time.
- `codebase-design` — ownership, interfaces, seams (e.g. the asset contract between GLB and runtime).
- `domain-modeling` — terminology and decision records.
- `to-spec`, `to-tickets` — capture agreed scope and propose slices. Output goes to the project files, not an issue tracker, unless Meio asks.
- `research` — primary-source investigation saved as Markdown.

## Developer (Codex)

- `tdd` (Claude) — test-first behavior. Not in Codex skills; follow its approach if unavailable.
- `diagnosing-bugs` (Claude) — hard bugs and performance regressions.
- `resolving-merge-conflicts` (Claude).
- `picaboo` (Claude) — only when sharing screenshot or video evidence in a PR Meio asked for.
- Browser: Playwright (`playwright` npm dev dependency) and the repo's `verify:ride-lab` script. There is no Playwright skill.

## QA (Codex)

- `diagnosing-bugs` (Claude) — to pin down a reproducible failure, without fixing it.
- Browser: Playwright and the repo's `verify:ride-lab*` scripts.
- `qa-review` (Codex) — when verifying an exported asset's browser fit against its contract.

## 3D Artist (Codex)

Primary:

- ★ `sculpt-a-thing` — part-by-part modeling against gold.
- ★ `meio-blender-npr` — toon/ink appearance.
- ★ `blender-posing` — rider poses and contact.
- ★ `visual-to-blender` — turning visual feedback into Blender edits.
- `blender-director`, `blender-modeler`, `character-artist` — scene direction and modeling.
- `export-pipeline` — GLB export.
- `blender-motion-state-inspection` — checking pose and motion states.

As needed: `retopology`, `uv-workflow`, `materials`, `lookdev`, `asset-optimization`, `stylized-style`. Prefer mesh hair clumps over `hair-groom` and modeled coat volumes over `cloth-sim` for the current character.

Do not use `blender-3d-modeling`: generic headless authoring, judged unsuitable under ADR 0001 (see `docs/art/ride-lab/character-2026-09/PLAN.md`).

## Art Director (Codex)

- ★ `reference-factory` — Mode A candidates, Mode B gold sheets.
- ★ `visual-to-blender` — instructions for the 3D Artist.
- ★ `critique-character-form` (Codex only).
- `stylized-style` — style vocabulary.

Review panel (each reviewer separate; two model families):

| Reviewer | Codex | Claude |
| --- | --- | --- |
| `wdyt-the-design` | yes | yes |
| `taste` | yes | yes |
| ★ `critique-character-form` | yes | no |
| `qa-review` | yes | no |
| `critique-composition`, `critique-color` | yes | yes |

`critique-character-form` and `qa-review` exist only in Codex, so Claude reviewers use `wdyt-the-design`, `taste` and the general `critique-*` skills.

## Any role

- `impeccable` (both) — site UI work outside the 3D assets.
- `critique-*` (both) — rendered UI screens.
