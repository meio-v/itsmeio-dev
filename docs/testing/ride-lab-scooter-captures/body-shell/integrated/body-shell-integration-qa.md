# Ride Lab body-shell integration QA

Status: **PASS — ready for user visual review**

## Authority and scope

- Primary authority: `assets/authoring/ride-lab/scooter-reference/body-shell.png`
- Secondary consistency authority: `assets/authoring/ride-lab/scooter-reference/turnaround-three-band.png`
- Package sheets: front apron, step/floor, and rear cowling v1 sheets, plus the accepted front-apron detail sheets.
- Production source of truth: `assets/authoring/ride-lab/ride-lab-scooter.blend`
- Approved seat/hoop geometry from milestone `e17286d` remained protected.

## Integrated result

- Front apron is a controlled crowned/tapered quad shell with real paired vent apertures, a flush center-panel seam, deep side returns, and a continuous front-to-floor heel.
- Step/floor retains the accepted black inner shield, floorboard, channel/pads, underside, and lower-step geometry.
- Rear cowling retains the accepted deck, side cowls, tail opening, and wheel-arch returns.
- Integrator-owned continuous sill sections, green side shoulders, and a black sloped inner riser close both package interfaces with manufactured overlaps and inward returns.
- Legacy placeholder body objects remain hidden and recoverable; they were not deleted.
- Booster reserve remains hidden metadata/helper geometry. No booster, fender, wheel, light, rider, or mechanical-detail work was started.

## Evaluated topology

- Vertices: **3,077**
- Edges: **6,119**
- Faces: **3,076**
- No Subdivision Surface modifiers are present on the active body shell.
- Vertex density is localized to vent apertures, bevel support, panel seams, sill bends, wheel-arch curvature, and the rear closure. Broad surfaces remain comparatively sparse.

## Protection and scene audit

- Compared 48 protected seat/hoop/anchor objects against `ride-lab-scooter-pre-silhouette-refine-20260831.blend`.
- Parent relationships, local transforms, mesh vertices/edges/faces, modifier name/type, and material slots: **0 mismatches**.
- World-space BVH overlap groups between the active body shell and 45 protected seat meshes: **0**.
- Active visible shell materials are limited to `MAT_Preview_Cream` and `MAT_Preview_Ink`.
- Review meshes, cutters, and booster-reserve helpers are hidden from viewport and render.
- `lowpolybase.004`, `tapislowpoly.002`, and rejected v1 seam/apron objects are hidden, not removed.

## Independent review

All three package reviewers loaded the same four-image gate together — primary reference, turnaround, live hero, and evaluated topology — then inspected side, front, rear, top, underside, topology-side, and topology-front views.

- Front-apron reviewer: **PASS**
- Step/floor reviewer: **PASS / ship for user visual review**
- Rear-cowling reviewer: **PASS**

Minor non-blocking note: the rear shoulder is intentionally more faceted than the painted reference, consistent with the game-ready low-poly surface language.

## Evidence

- `body-shell-integrated-hero.png`
- `body-shell-integrated-side.png`
- `body-shell-integrated-front.png`
- `body-shell-integrated-rear.png`
- `body-shell-integrated-top.png`
- `body-shell-integrated-underside.png`
- `body-shell-integrated-topology-combined.png`
- `body-shell-integrated-topology-side.png`
- `body-shell-integrated-topology-front.png`

No commit, push, export integration, NPR, posing, fender work, rear mechanical work, or booster work was performed.
