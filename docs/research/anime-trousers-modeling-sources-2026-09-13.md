# Anime trousers: creator-owned modeling references

Researched 2026-09-13. Scope: research only; no Blender model, material, rig, or skill edits. Public primary sources were read; no paid lessons were purchased or viewed. Video descriptions are not substitutes for watching footage, so no unverified timestamps or brush settings are supplied.

## 1. Blender Secrets — specific trouser construction workflow

The creator's [anime-character course syllabus](https://www.3dsecrets.com/anime-girl) is the strongest trouser-specific procedural source found. Lessons 11–14 progress from extracting body geometry and adapting its topology, through prepared extrusions and subdivision-edge control, to sculpted folds and separate pockets. Bevel and Loop Cut/Slide provide local control rather than relying on uniformly dense geometry. The sculpting lesson describes Draw-brush raised and recessed folds plus mask strokes that can be straight. An earlier masking exercise paints the intended deformation area, inflates it using Mesh Filter, then smooths. Pockets are first blocked in 2D, face-snapped onto the trousers, sharpened with extra geometry, and given folds informed by the underlying cloth.

**Application:** Treat folds as intentional changes of surface direction, with clean ridges and valleys, before deciding which edges deserve ink. Prepare the few locations requiring folds instead of scattering unrelated lines over an unchanged surface. This application is our inference, not a quoted course rule.

**Limit:** This is verified public syllabus content, not a review of the paid lesson footage. Its garment is garden/dungaree-style pants, not our exact loose cropped trousers.

## 2. 2AM — free anime-specific cloth-fold demonstration

[Anime Style Clothing — Folds](https://www.youtube.com/watch?v=ntDYLNcNQlg), published April 25, 2024, explicitly targets 3D folds that emulate 2D anime, using Blender 3.6.1/Goo. This is the closest freely accessible creator video to the requested visual style and a useful first watch.

**Limit:** The creator, title, date, and description were verified through the indexed YouTube page. Playback/transcript content could not be inspected, so a particular topology trick, operation sequence, or timestamp must not be attributed to this video yet.

## 3. CoderNunk — free written anime-character modeling walkthrough

The creator's [clothing and pants walkthrough](https://codernunk.com/tutorials/complete-3d-character-guide/#the-pants) gives directly inspectable steps: duplicate the body region, separate it, use Inflate and Grab to establish fabric volume, then add local edge loops for detail. The preceding clothing section identifies Crease and Cloth brushes as optional ways to form folds, with simulation optional rather than mandatory for simple clothing. It also checks outward-facing normals before garment work.

**Application:** Establish garment volume independently of ink/shadow styling. A slight silhouette or plane change can explain a fold better than adding another mark. **Limit:** The example pants are simple and puffy; this is a construction foundation, not an advanced male-trouser fold-design lesson.

## 4. Blender Secrets — cloth-assisted sculpting alternative

[Cloth Sim Pose Brush Longer Video](https://www.3dsecrets.com/secrets/realistic-cloth-wrinkles-and-folds-with-no-effort) describes using the Pose brush's Cloth Simulation mode to create clothing wrinkles and folds. This is a creator-owned free tutorial page with an embedded demonstration.

**Application/inference:** Use physically generated deformations as exploratory reference, then simplify into a small number of readable anime folds; do not assume raw simulation automatically produces the intended graphic design. **Limit:** The accessible page establishes the technique, but does not justify exact current-version settings, measured fold locations, or anime-specific simplification rules.

## Supporting source: modeling and painted shadows are separate stages

Grant Abbitt/GameDev.tv's [anime-character course](https://www.udemy.com/course/blender-anime-character/) publicly lists a trousers-modeling lesson and a separate trousers-painting lesson described as creating simple shadows. It advertises a box-modeling approach, not a sculpting course. This supports considering both geometry and authored shading, but the syllabus alone does not show exactly where to paint shadows or prove that surface-only changes will fix our model. Lesson durations are not timestamps within a freely watched video.

## Studio and drapery cross-check

Arc System Works' own [2018 anime character modeling slides](https://www.slideshare.net/slideshow/guilty-gear-xrdtips-124324946/124324946) explicitly describe a polygon-modeling workflow, prioritizing silhouette/reference comparison before detail. Their custom-normal methods separate lighting response from surface shape. This supports designing geometry and shading together, not requiring each painted shadow to correspond literally to a geometric trench. The slides demonstrate Softimage and are not current Blender API instructions. Read directly from the studio-uploaded Japanese slides.

The original [GDC session](https://www.gdcvault.com/play/1022031/Guilty-Gear-Xrd-s-Art) is an additional studio-led watch. Its [official slide PDF](https://www.ggxrd.com/Motomura_Junya_GuiltyGearXrd.pdf) was only partly retrievable via indexed extracts: slide 25 explains internal lines via axis-aligned texture strips and UV placement, separate from inverted-hull outlines. Full PDF opens timed out; no claim of viewing the full talk.

Steven Michael Hampton's [Drapery Fundamentals](https://www.proko.com/course/drapery-fundamentals) public course page emphasizes pull/pressure landmarks, tension points, compression and large light/shadow design. That is useful fold-design theory, not a Blender or anime-trouser tutorial; paid lesson footage was not inspected. Our application is to locate the support/compression cause of each important trouser fold before marking it.

## Suggested next experiment — not an implementation performed here

For the existing trousers, test one or two main fold ridges/valleys in a duplicate under neutral material and a fixed light. Approve those forms from front, side, and three-quarter views; then derive selective ink and simplified shadow boundaries from those same folds. Keep seam lines distinguishable from crease marks. This is a proposed synthesis, not evidence that the live trousers have already changed or that every anime production uses one universal workflow.
