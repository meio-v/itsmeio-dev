# Scooter Blender package

Private npm workspace for the RideLab scooter's Blender authoring. Blender runs the modeling scripts; this package adds no website build hooks or runtime dependencies.

| Folder | Contents |
| --- | --- |
| `models/` | Local Blender sources, recoverable milestones and bounded trials. |
| `references/` | Selected source images and targets, with their approval status recorded. |
| `scripts/` | Reusable Blender authoring and evidence tools. |
| `renders/` | Local generated previews, grouped by study. |
| `reviews/` | Review findings, issue ledgers, evidence paths and acceptance records. |
| `docs/` | [Skill guidance and the strict review loop](docs/SKILL_GUIDANCE.md). |

Read [current project authority](../../docs/ride-lab/PROJECT_STATE.md) before choosing a model or target. At package creation, the rear assembly is in a design reset: a fresh side orthographic proposal precedes modeling and fitting. Follow newer project-state decisions when they supersede this note.

Historical sources remain under [RideLab authoring](../../assets/authoring/ride-lab/README.md), including `scooter-rebuild/`. They have not been moved, promoted or removed. Reference them by their existing paths while new studies use this package.

Native `.blend` files, Blender backups and generated renders are ignored by default; selected references, reusable scripts and review records can be committed. Local files need a separate backup if they must survive loss of the checkout. Publish approved runtime assets through the existing RideLab delivery workflow only when requested.
