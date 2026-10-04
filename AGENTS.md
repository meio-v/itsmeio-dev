# Blender skill routing

Before rider/scooter work, read [the current project state](docs/ride-lab/PROJECT_STATE.md).

New scooter Blender work belongs in the private [scooter package](packages/scooter-blender/README.md). For implementer/reviewer sessions, use its [skill guidance map](packages/scooter-blender/docs/SKILL_GUIDANCE.md). Existing authoring checkpoints remain recovery sources; a new folder does not promote an old model or reference.

For Blender and character-art requests in this repo, identify whether the user wants a review, an implementation, or runtime delivery before choosing skills. Read the selected `SKILL.md` files before acting; use the smallest set that covers the request. A review request alone does not authorize model edits.

Resolve skills from the session's skill catalog. Personal skills normally live under `~/.codex/skills`; `unlazy` lives under `~/.agents/skills`. If a needed skill is absent from the catalog, check its known local path rather than assuming it is unavailable.

| Request | Route |
| --- | --- |
| Model/refine geometry, profile, hair, cel shading, normals, eye ink or textures | `meio-blender-npr`; load only relevant references. Use `refinement-loop.md` plus `form-convergence.md` for sustained silhouette matching; use region and NPR references when that phase is authorized. |
| Review a scooter/prop silhouette | The package's strict silhouette protocol plus `form-convergence.md`; use matched frozen evidence and independent review. |
| Assess character anatomy, facial landmarks, attachments or likeness | `critique-character-form`. For implementation plus review, combine with `meio-blender-npr`. |
| Translate informal visual feedback into a modeling brief | `visual-to-blender`; the director produces one bounded instruction without inventing hidden construction. |
| “What do you think?” or a broad design critique | `wdyt-the-design`, routing character form to `critique-character-form`; synthesize one opinion rather than repeating specialist reports. |
| Choose between stylistic directions or decide the appropriate level of finish | `taste`, grounded in the approved reference and intended camera. Do not load it automatically for mechanical edits. |
| Sustained autonomous refinement, explicit convergence gates or completion loops | `unlazy` for completion tracking, with the Blender refinement-loop guidance for efficient visual diagnosis. Treat `unlazy` as third-party: do not modify it as part of repo or personal-skill improvements. |
| Generate a concept, paintover or raster target | `imagegen`. Label generated imagery as a target, not evidence of a Blender geometry change. |

Preserve explicitly requested skills and scope. Do not load every skill or every reference for each pass. Blender preview work does not implicitly include UV production, rigging, export or runtime integration; apply those workflows when requested. A texture/UV request does authorize the corresponding eye or surface authoring work within that scope.
