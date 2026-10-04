# Scooter implementer and reviewer guidance

Start with [current project authority](../../../docs/ride-lab/PROJECT_STATE.md): identify the approved target, current artifact, visible locks and authorized phase. Historical fitting requirements do not override a newer design reset. Generated proposals become targets only after the user's approval; they are never evidence of a Blender edit.

Resolve skills from the session catalog and read their actual files. Paths below are relative to `~/.codex/skills/`, except `unlazy`, which lives under `~/.agents/skills/`. Check a known local path when a skill is absent from the catalog. Do not copy personal skills into this package.

## Role map

| Role / stage | Read | Guidance to apply |
| --- | --- | --- |
| Skill selection | `using-superpowers/SKILL.md` | Check which skills apply before assigning roles or acting. Read the selected guides and keep user instructions, project authority and the authorized phase in control. |
| Concept preparation | `.system/imagegen/SKILL.md` | Label each input's role, preserve approved anchors and generate the requested view. Keep proposals separate from accepted targets. |
| Implementer | `meio-blender-npr/SKILL.md`, then `references/refinement-loop.md` and `references/form-convergence.md` within that skill | Inspect the evaluated construction; distinguish geometry, normals, shadows and ink. Choose a bounded edit to the actual controlling surface, preserving approved neighboring forms. |
| Strict silhouette reviewer | `meio-blender-npr/references/form-convergence.md` and the protocol below | Describe reference and model independently, compare actual visible boundaries and report local deviations across required views. Missing evidence cannot establish a pass. |
| Overall design reviewer | `wdyt-the-design/SKILL.md`, its `references/reviewer-routing.md` and `references/nng-visual-principles.md` | Synthesize the few largest appeal, mass balance and surface-language issues. Distinguish aesthetic judgment from measured mismatch. This opinion does not grant strict silhouette acceptance. |
| Director / feedback translator | `visual-to-blender/SKILL.md` | Turn the largest finding into one instruction under 120 words: approval state, intended read, correction, preserved features and observable return-to-review condition. |
| Completion tracking | `unlazy/SKILL.md`; `references/token-economy.md` when cost is a concern | Record independently required outcomes and evidence. Use the smallest fitting mode; visual approval remains a manual gate. Follow its check-approval requirements if executing its gate checker. |

`critique-character-form` applies to character anatomy and likeness. Its evidence discipline can inform prop review, but human anatomy and facial checklists do not govern this scooter. UI-specific review lenses also do not belong in the prop loop.

## Strict silhouette protocol

Default verdict: FAIL. Use the user's requested six-step method:

1. Describe the reference alone: outline, major masses, negative spaces, dominant angles/curves and meaningful numerical ratios.
2. Describe the model independently using the same categories and ratios.
3. Compare every required region: proportions and percentage difference, contour, missing/extra shapes, negative spaces, and severity (`CRITICAL`, `MAJOR`, `MINOR`, `NONE`). A `NONE` finding must name what was checked and why it matches.
4. Check a shared-scale thumbnail near 64px, the three largest masses, and gesture/weight distribution.
5. Reconcile every previous issue as `FIXED`, `PARTIALLY FIXED`, `NOT FIXED` or `REGRESSED`, with evidence and nearby regression checks.
6. Rank issues by severity and give concrete move/scale/reshape directions. End exactly with `VERDICT: PASS` or `VERDICT: FAIL`.

PASS requires zero CRITICAL, zero MAJOR, every required proportion within the project's 5% tolerance, and every previous issue FIXED. Do not invent measurements, silently waive the tolerance or substitute bounding-box agreement for contour agreement. Record camera/registration uncertainty and occluded regions; unresolved evidence needed for acceptance prevents PASS. An agent PASS still does not replace the user's visual approval.

## Bounded loop

Director freezes the target, scope and comparison views → reviewer inspects frozen images before implementation commentary → director selects the highest-impact issue → implementer predicts a visible change and makes one bounded trial → reviewer compares target, retained baseline and candidate, then checks previous issues.

Keep stable issue IDs and record: evidence/owner, hypothesis, predicted change, preserved features, decisive views, result, failed attempts and next discriminator. After two failed attempts at one hypothesis, diagnose a different cause or change construction before another variant. Renaming an issue does not reset the count.

Render the cheapest decisive view first. A locally successful trial earns affected regression views; full requested views and reopened-file verification belong to a stable candidate. A local KEEP accepts only that named correction. Whole PASS covers all required regions on the same artifact.

## Load later, when the phase requires it

| Work | Additional `meio-blender-npr` reference |
| --- | --- |
| Outline ownership, selected internal seams and cavity artifacts | `references/anime-line-art.md` |
| Cel materials, normals and inverted-hull implementation | `references/npr-techniques.md` |
| UV and texture authoring | `references/uv-light-texture-planning.md` and `references/reference-led-anime-texturing.md` |
| Scripted merge into the live scene | `references/live-integration.md` |

Keep facial, hair and garment guidance out of scooter passes. Load motion inspection, rigging or runtime delivery guidance only for those requested outcomes. Preserve required finish standards while reducing redundant galleries, repeated context and unrelated checks.
