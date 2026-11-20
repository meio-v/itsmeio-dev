# Manga rider and scooter epic

Created 2026-10-14. Fit the existing manga character to the accepted green scooter, make the rider respond naturally to turns and riding, and bring the combined result into a working local Ride Lab browser preview for the personal homepage's playable mall.

Each task is one focused bite of work. Split a task if it grows beyond that; keep its parent ID so progress remains readable. This map is the temporary working tracker and will be tidied and archived at the end.

## Resume entry point

Request **“Resume the rider epic”**. Start at [the Ride Lab entry point](README.md), read this resume state, and continue the next unfinished task.

## Resume state

- Status: planned; 0 of 15 tasks complete. The map and source recovery are ready; fitting has not started.
- Current task: **R01 — Prepare the fitting scene**.
- Last verified result: scooter v012 appearance accepted; saved native and recovery copy have matching checksums. Full v052 character rig and older v002 riding pose recovered.
- Current working assembly and review evidence: none yet.
- Exact next action: inspect the recovered riding pose, then create a new fitting copy containing the character and accepted scooter. Preserve both source assets.
- Known issues: the old pose used a smaller scooter reference and a separately lowered saddle. Contact positions need refitting. Jacket elbow pinching and a thigh/seat fold need checking after contact is settled. Browser shading and rig compatibility remain to be proved.
- Active execution owner/process: none. The 3D Artist (teammates/roles/3d-artist.md) is the sole Blender operator and records any live process before handoff.

At every handoff, update these fields and the task statuses. Record the actual saved file and evidence, not just what was attempted. Check the open Blender file and unsaved work before loading or changing an assembly.

## Bite sized task map

Work in order; later tasks inherit the accepted pose and source versions.

| ID | Task | Done when | Status |
| --- | --- | --- | --- |
| R01 | Prepare the fitting scene | New working copy with named, separate scooter/rider/control collections; legacy trials hidden and source collections preserved. | Next |
| R02 | Seat the rider | Overall scale and pelvis position give visible cushion contact and a believable posture. | Planned |
| R03 | Fit feet and knees | Both soles sit within the floorboard; knees clear the skirt with natural bends. | Planned |
| R04 | Fit hands and arms | Palms/fingers wrap the grips, elbows relax, and grip targets follow steering. | Planned |
| R05 | Prove a basic browser import | One temporary seated export loads with correct scale, axes and skeleton; a viable toon/ink route is identified. | Planned |
| R06 | Repair seated clothing | Local weights/correctives resolve visible elbow, hip and knee pinching while preserving the character design. | Planned |
| R07 | Review the neutral riding pose | User accepts the combined silhouette and visible contacts from both profiles, front and gameplay view. | Planned |
| R08 | Add left and right turn response | Smooth weight shifts, torso balance and head direction; hands and feet retain contact through both turn extremes. | Planned |
| R09 | Add other riding reactions | Acceleration, braking and airborne/landing response return cleanly to the accepted neutral pose. | Planned |
| R10 | Match the browser appearance | Toon bands, shimmer, panel ink and manga accents remain readable in the intended browser camera. | Planned |
| R11 | Prepare the runtime asset | Separate delivery copy has consolidated meshes/materials, documented rig/scale, packaged dependencies and usable exports. | Planned |
| R12 | Connect rider motion in Ride Lab | Existing steering, speed, lean and riding states drive the exported rider; contact stays stable in motion. | Planned |
| R13 | Review the playable result | User checks the actual browser ride for appearance, turns, response and contact; performance and lifecycle checks pass. | Planned |
| R14 | Package the final handoff | Final editable native, exports, evidence, launch instructions and open follow-ups are recorded together. | Planned |
| R15 | Close and tidy the epic | Final files and acceptance are reconciled, temporary tracking is archived, and the entry point points to the final handoff. | Planned |

R05 is a small feasibility check, not a demand for finished browser art. R10 handles visual parity. R09 responds to existing gameplay mechanics; it does not add new physics or tricks. If a task needs user visual review, return a concrete saved result and matching evidence.

## Sources and boundaries

- Accepted scooter: [v012 native](/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-accepted-2026-10-13/v012/scooter-orbit-lines-clean.blend). SHA256: `f4befb9d29b35c2b0c0e1329885b995e52c77f652e767113d2d3636ea49926a7`. [Recovery receipt](/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-accepted-2026-10-13/v012/manifest.json).
- Existing riding candidate: [v052 riding pose](/Users/jeromeiovelarde/.codex/ride-lab-pre-remodel-20260914-fCoCMH/rigging-v001/seated-v002/character-v052-v002-riding.blend).
- Neutral recovery source: [v052 body and hand rig](/Users/jeromeiovelarde/.codex/ride-lab-pre-remodel-20260914-fCoCMH/rigging-v001/character-v052-rigged-v001.blend). [Rig notes](/Users/jeromeiovelarde/.codex/ride-lab-pre-remodel-20260914-fCoCMH/rigging-v001/README.md), [pose notes](/Users/jeromeiovelarde/.codex/ride-lab-pre-remodel-20260914-fCoCMH/rigging-v001/seated-v002/README.md).

Keep those originals unchanged. Reuse the actual character rig; inspect its mapping to the browser rather than substituting the old donor avatar. Keep the accepted scooter appearance and character proportions unless a fitting problem is demonstrated and discussed. Preserve the existing gameplay physics/colliders. Live deployment and promotion into the homepage are separate decisions after this local preview.

## End of epic cleanup

Keep the final native, exports, dependencies, source checkpoints and useful review evidence. Consolidate decisions and any remaining work into `RIDER_HANDOFF.md`. Archive this completed map under `epics/archive/`, remove stale tracking references, and update `README.md` to point to the handoff and archive. Recoverable hiding/archiving is the default; unique model sources are not deleted as routine cleanup.
