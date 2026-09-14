# Blender skill routing

Before rider/scooter work, read [the current project state](docs/ride-lab/PROJECT_STATE.md).

For Blender and character-art requests in this repo, identify whether the user wants a review, an implementation, or runtime delivery before choosing skills. Read the selected `SKILL.md` files before acting; use the smallest set that covers the request. A review request alone does not authorize model edits.

Resolve skills from the session's skill catalog. Personal skills normally live under `~/.codex/skills`; `unlazy` lives under `~/.agents/skills`. If a needed skill is absent from the catalog, check its known local path rather than assuming it is unavailable.

| Request | Route |
| --- | --- |
| Model/refine geometry, profile, hair, cel shading, normals, eye ink or textures | `meio-blender-npr`; load only its relevant references. Use `refinement-loop.md` for iterative corrections, `profile-refinement.md` for facial depth/contour, `stylized-hair.md` for clumps, and `npr-techniques.md` for shading/line-art implementation. |
| Assess anatomy, silhouette, proportions, facial landmarks, attachments or likeness | `critique-character-form`. For implementation plus review, combine with `meio-blender-npr`. |
| “What do you think?” or a broad design critique | `wdyt-the-design`, routing character form to `critique-character-form`; synthesize one opinion rather than repeating specialist reports. |
| Choose between stylistic directions or decide the appropriate level of finish | `taste`, grounded in the approved reference and intended camera. Do not load it automatically for mechanical edits. |
| Sustained autonomous refinement, explicit convergence gates or completion loops | `unlazy` for completion tracking, with the Blender refinement-loop guidance for efficient visual diagnosis. Treat `unlazy` as third-party: do not modify it as part of repo or personal-skill improvements. |
| Generate a concept, paintover or raster target | `imagegen`. Label generated imagery as a target, not evidence of a Blender geometry change. |

Preserve explicitly requested skills and scope. Do not load every skill or every reference for each pass. Blender preview work does not implicitly include UV production, rigging, export or runtime integration; apply those workflows when requested. A texture/UV request does authorize the corresponding eye or surface authoring work within that scope.
