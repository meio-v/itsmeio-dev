# Scooter build history

Prepared 2026-11-20 by the Art Director as a research handoff to the PM. No Blender/MCP, new rendering, checkpoint change, deletion, archive extraction, commit or publication was performed. Only this ledger, its representative-image folder and the companion keep-list were written.

## Evidence and reading conventions

This ledger uses the [3D Artist’s audit](../../ride-lab/checkpoint-audit-2026-11-20.md), rather than repeating its archive-wide classification/checksum survey. The [exact preservation manifest](scooter-build-history-keep.md) identifies the files that must survive before any parent deletion. No backup, LFS upload or dependency-open check is claimed here. Retaining a listed descendant inside a subsequently deleted parent is not preservation: the PM needs a verified surviving destination and source-to-destination map.

Versions belong to their named part: front-mechanism v034, bodykit C82, rear-reset V031, NPR V034 and accepted v012 are different namespaces. Stages group overlapping work chronologically; uncertain dates and missing trial detail are explicit. Exact quoted human words below are reproduced in the cited project records, not independently verified conversation transcripts. Reported approvals without surviving words stay unquoted. A historical PASS can be superseded by later rejection.

Source aliases below are absolute paths; each stage names the records actually read. Their exact bytes and hashes are preserved in the keep-list. An inventoried recipe is not a claim that its content was reviewed or that all its dependencies resolve.

- **A:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild`
- **C:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-clean`
- **J:** `C/docs/ride-lab/PROJECT_HISTORY-pre-cleanup-2026-10-05.md` (107,102-byte historical journal; not current authority).
- **W5:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05`
- **W6:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06`
- **W7:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001`
- **W8:** `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-08/model-compaction-v001`
- **P:** within a named checkpoint/delivery, `packages/scooter-blender`.

ImageMagick `montage` was absent; Pillow was unavailable in the checked system/Homebrew Python installations. The requested fallback is used: at most two existing PNGs per evidenced stage, copied and downscaled by macOS `sips` to a 900-pixel maximum dimension. Stage/version labels are in filenames and captions. These are representative fallback images, not claimed contact sheets. There are no new renders or generated views. v012 has no matching supplied render, so an earlier version is not relabelled as accepted v012.

## Antecedent: runtime prototype and native ownership

The repo surface-detail note records disposable projected seam guides merged into the existing ink carrier (576 triangles), booster and seat prototypes, and hard color regions. Automatic open/hard-edge drawing was rejected because split topology produced noisy triangulation. The August 30 seat-sculpt QA records a separate earlier accepted seat, not later V074 or scooter v012. ADR 0001 makes the reviewed native the editable source of truth and GLB the delivery artifact. Historical headless recipes are provenance, not authorization to repeat that workflow for new production art.

Read sources: `docs/design/ride-lab-scooter-surface-detail.md`; `docs/testing/ride-lab-scooter-captures/seat-sculpt-final/README.md`; `docs/adr/0001-blender-mcp-native-asset-authoring.md`. These repo files/captures are outside the checkpoint deletion scope.

## 01. Concept, fit scaffold and actual-rider blockout

**Dates:** 2026-09-14–15; the brief contains both dates, and exact per-save dates are unresolved. **Versions:** Mode A v004 B; blockout v001–v003; model v001–v002.

The selected design was a utilitarian green retro scooter with black stripe, box boosters, fixed housings and hinged rectangular tips. Larger orange, outline-free graphic flames superseded cyan outlined exhaust. A measured mannequin established seat/deck/reach while the real character and original body/hand rigs stayed preserved. This scaffold was not an approved silhouette. Blockout v002 brought the bars closer but left horizontal forearms and tight elbows; v003 moved them 0.30 units back and 0.25 down. Later actual-rider model-v002 eased its tight elbows by moving grips 0.28 forward and 0.22 lower. These were different trials.

Rig-derived segment lengths and reopened side/quarter evidence worked for packaging. Mannequin contact could not certify real garment clearance. Primitive bodywork was superseded; model-v002’s seat was identified as a regression and was not carried forward as accepted.

**Meio, exact recorded approval:** “thats the one” for `A/mode-a-v004/B-hinged-tip.png` (rebuild brief opening). This selects the concept, not a blockout mesh. No blockout acceptance sentence was found.

Read sources: `C/docs/ride-lab/SCOOTER_REBUILD_BRIEF.md`; `A/blockout-v001/README.md`; `A/blockout-v003/README.md`; J, “Previous bodywork checkpoints.”

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/blockout-v003/scooter-fit-blockout-v003.blend` | `f4587ba46c6bb3011ea034e4474a51b63a1d313510c0a3b7d50aeaa7cce1f1ba` | Superseded native: proposed retirement after evidence preservation |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/model-v002/scooter-rider-review.blend` | `45a3423d43c6fb6bac9adf7a59f0da5f61ec3dbf17c66926a10be4ec9da77593` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [blockout-v003-side](scooter-build-history/01--blockout-v003-side.png) — stage 01; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/blockout-v003/side.png`; original SHA256 `01031c6f262f3d2e8d1644a803ec3eda900c28546a9bfd8d9fa1a5b9724158d1`; fallback PNG SHA256 `4d14a0cd557ea01ae262f6910120404686b43296d5fcec09c598b1adac8eb831`.
- [blockout-v003-three-quarter](scooter-build-history/01--blockout-v003-three-quarter.png) — stage 01; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/blockout-v003/three-quarter.png`; original SHA256 `a8ba17a6a1f2a357d9075afdb3d4363ddc61f23afa375499ed797c8684ae5d3a`; fallback PNG SHA256 `735230473b8177d5b58a49aace2bdc55e22465d0efcdf65025c4a7d7a5888805`.

## 02. Front planes, arch, mechanisms and cockpit

**Dates:** 2026-09-14–28, bounded by the brief and subsequent seat journal; individual save dates are not all recoverable. **Versions:** bodywork-depth v002; skirt-angles v002; front-skirt convergence v004; fender/signals v002; front-mechanism v034; cockpit v001–v003; cockpit-ink v003.

The front moved from a thick, over-blended shell to separate broad face/chamfer/sidewall planes: straight upper run, localized knee, long lower diagonal and compact floor elbow. Closed backing replaced open/thin trials. Clay/toggle diagnosis identified redundant green fork rods intersecting real shocks; those rods were hidden rather than changing the skirt to conceal the suspension. Surface-fitted strokes had to be refitted when their physical owner changed.

The heavy cap fender was reopened and replaced by a hollow swept boomerang and recessed amber signals. Fork splay and separate skirt clearance notches were rejected. Front-mechanism v034 restored full-length parallel forks and enlarged the whole arch with a fitted closed wheelwell. V027 cut too far into lower vents, V029 misclassified materials, V031 had a bad union seam and V032–33 were intermediate wheelwell fits. These local front numbers are unrelated to rear-reset V031.

Chrome experiments gave way to red enamel springs, matte rods and crisp cyan without bloom. Cockpit v001’s wedge/thickness-only shape, dangling cables and threshold patches were superseded by a fuller pod. V002 moved grips independently of old rider anchors and recessed the dash; its deep gasket barrel caused scalloped bites, corrected by v007. Cockpit v003 shortened stems, softened controls and replaced sharp fin ribs with rounded ribs. Cockpit-ink v001–v002 removed needed aperture backfaces and broke the pale contour; v003 restored a narrow boundary return while keeping the instrument pocket open.

Local visual and source/rig checks passed within their declared scope. Overall front-skirt convergence earned reviewer likeness acceptance; generated sheets remained provisional. **Meio, exact recorded approvals:** “dang love it” for fender/signals trial-v002 and “yay” for front-mechanism candidate-v034’s physical arrangement (J, respective accepted checkpoint sections). No exact final cockpit approval sentence was found. Runtime delivery was not claimed.

Read sources: J, “Current cockpit outlines” through “Previous bodywork checkpoints”; `C/docs/ride-lab/SCOOTER_FORM_GOLD.md`; rebuild brief.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-skirt-convergence-v001/candidate-v004/scooter-front-skirt.blend` | `9058fb60ab269a0fc57d4cb2ee559939ddbb4c83f5dcb7653946f63f815a127c` | Superseded native: proposed retirement after evidence preservation |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/fender-signals-v001/trial-v002/scooter-fender-signals.blend` | `0928446991cfbe13f9e46a2c2dd0258e89fdf61f8e5b84c68406ce966feaf6a8` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-mechanism-v001/candidate-v034/scooter-front-mechanism.blend` | `f176fcf79b3dc3d74885a1fa0418eb7257da92bad47a3043360079b2e02b82a2` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/cockpit-ink-v001/candidate-v003/scooter-cockpit.blend` | `bf6925faa2c7fc637bf7c34efe6022cb7cc90a3e903dfddc49207c1bb3fa1b4b` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [front-skirt-v004-three-quarter](scooter-build-history/02--front-skirt-v004-three-quarter.png) — stage 02; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-skirt-convergence-v001/candidate-v004/three-quarter.png`; original SHA256 `f92d9b8d5423356b1f5cd7a6830c8f08c8360e44509f6bac5d7bedf4d2ae7f0d`; fallback PNG SHA256 `9e6a7cf40e09b715a0e6803ccda3ece3df19a2290f08cdf42c209e2bef95bfd7`.
- [front-mechanism-v034-detail-side](scooter-build-history/02--front-mechanism-v034-detail-side.png) — stage 02; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-mechanism-v001/candidate-v034/detail-side.png`; original SHA256 `57d2ff481322c55586e6e2a2760f08b1db40eb54023efaf2f84b0478a837d45d`; fallback PNG SHA256 `b8adb5ea8f52ab0bb86d0f7dc5b3da7eea61d0081ef32e6019929ca6ef926e11`.

## 03. Front kick shield, wrapped return and floor detail

**Dates:** before 2026-09-28; the cited V028 approval gate has no exact acceptance date. **Versions:** Direction B baseline; floor v020/v023–v028; front-kick-finish v002–v011.

Direction B defined one kick/floor assembly: two-plane shield, rectangular cassette, green rails, sparse covers/fasteners. Its later stud-heavy proposal was rejected. V020’s shield direction was accepted, but V023’s strips, exposed dark slabs, crown tabs and abrupt floor joins were visually rejected despite technical passes.

V028 united swept solid returns with a copied skirt shell using exact Boolean unions, broad primary chamfers, smaller easing, explicit material transfer and outward normals. V024’s full hull across concave union seams caused scribbles, isolated by a no-ink comparison. V025 inherited the wrong dark Boolean slot; V026–27 exposed pale buried-seam wedges. V028 omitted hull expansion at the new concave joins while retaining exterior coverage. Pixel ownership identified the visible dark crown rectangle as the closed shield top, not daylight.

The separate finish added two covers/eight fasteners/nine ribs and native grain. V001 clipping was fixed in V002. Deformation trials V003–07 made waves/folds; bounded cap construction in V008–10 fixed geometry, and V011 restored the proper paint response without another geometry edit. Native preservation and sampled pose checks passed; no runtime delivery followed.

**Meio, exact recorded approval:** “thats better. mark that done and proceed with detail pass” (`A/front-kick-floor-v001/GATES.md`, reopened correction). This later gate supersedes the candidate’s older pending-human note. It approves V028 silhouette, not every subsequent finish.

Read sources: the gate above; `A/front-kick-floor-v001/candidate-v028/visual-review.md`; J, floor/detail/crown sections; `W8/README.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-kick-floor-v001/candidate-v028/scooter-front-kick-floor.blend` | `c67d576414ab252adba2cf65cca76e92672fcd871520aca57de423e59fb22947` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-kick-finish-v001/candidate-v011/scooter-front-kick-finish.blend` | `75339eaf9217ea5f4ab4fa1940e06c64a93014c02f6560c68cdb3cf0037a55d7` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [floor-v028-rider](scooter-build-history/03--floor-v028-rider.png) — stage 03; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-kick-floor-v001/candidate-v028/local-rider.png`; original SHA256 `06bb621e2f2ec7461b262664ea5110fa913058b60ebf37dab607c2a44e1ee827`; fallback PNG SHA256 `217476dc78b2583c065ba71a789adbb13b7a3c47e56e9a664a49081b068a60b2`.
- [floor-v028-profile](scooter-build-history/03--floor-v028-profile.png) — stage 03; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/front-kick-floor-v001/candidate-v028/local-profile.png`; original SHA256 `b3d78d78c5620be8cfa58a83d5986e0d5b4138b6c4d3324dcbeeedb6a425fe95`; fallback PNG SHA256 `e66c36b5b3015c0dab7ce37ea4201c0fd224a617b40de8ffe06a84b1b07664c6`.

## 04. Seat silhouette, supported transition and finish

**Dates:** 2026-09-28–2026-10-02; exact V074 save date not isolated. **Versions:** seat-assembly v004; seat-transition v005–v011; seat-form v074; seat-finish v007.

Meio rejected V004’s unsupported projecting nose on September 29 despite technical review passes. V005/06 black inserts read as attached slabs; V007 flattened the passenger pad and let the rail overtake it. V008–11 established a green cheek, fitted dark liner and shoulder band. Their cushions were later replaced by the seat-form loop.

Side/top references controlled proportions/division; conflicting generated three-quarter division was guidance only. After a long loop, V074 raised only the rail’s upper U by .055 units, preserving its feet and V073’s repaired cushions. Nominal rail-gap discrepancy changed from +38.4% to −1.59%; independent strict form review reported PASS, with source/rig checks held. It is reported evidence, not a new review performed here.

Finish v007 added restrained vinyl grain, slim welt, transverse binding and selective ink. Toggle/ray diagnosis found near-collapsed terminal hull rings behind rear slashes/nose scratches; removing them and fading terminal/contact ink fixed the marks without changing physical form. Hard rubber thresholds amplified earlier normal-angle oscillation. Local finish review passed; final human finish approval stayed separate.

**Meio, exact recorded authorization:** “resume blender modeling and local renders” (J, V074 section). That authorizes execution. The later detail request is paraphrased; no verbatim V074/final-finish acceptance was found. V074 remains one of the eight protected sources.

Read source: J, “Seat assembly,” “Seat-to-body transition,” “Seat form,” and “Seat upholstery and lineart.”

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/seat-form-v001/candidate-v074/scooter-seat-form.blend` | `325f31e14b1955b6da520c1c34689e0879a8b66adf3aa02d4e5519258ef301ed` | KEEP: exact manifest |

### Existing render evidence

- [seat-form-v074-side](scooter-build-history/04--seat-form-v074-side.png) — stage 04; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/seat-form-v001/candidate-v074/seat-side.png`; original SHA256 `c6c4662f97f7334fb5bc32d5f1a6c448a9a44114c67a7a65d372b648a1f2333d`; fallback PNG SHA256 `f6452cf7c6e313eaeee4df1f2b5a30cb8953cca302332249aa435aeba611e094`.
- [seat-form-v074-top](scooter-build-history/04--seat-form-v074-top.png) — stage 04; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/seat-form-v001/candidate-v074/seat-top.png`; original SHA256 `12d185e03bf41f0252d2739e3d9ee18c00a056871204cc281b1bd5c0d409573a`; fallback PNG SHA256 `c0ff5cf3f7ceb87ed6fcb32e639b137addf413a124fa846be04caa72a581ac4e`.

## 05. Rear cowl, two-piece bodykit and failed fitting

**Dates:** 2026-10-02–04. **Versions:** cowl v009/v017; underseat-booster v004/v013; bodykit C13–C82; fitting v001–v022.

Cowl V009 closed gaps and simplified the crown. Booster V004 added a fitted cover, hinges, slots and cyan nozzles, but read as a rectangular appliance. V013 improved shoulders, fitted hinge surround and tapered nozzles and earned scoped strict PASS. On October 3 Meio rejected cowl/bodykit and boosters, superseding favorable V017/V013 aesthetic statuses.

Combined-owner clay exposed two-piece construction missing from the isolated-shell/installed evidence. C13’s PASS was withdrawn. Outer ratios within 5% did not prove inner field, knee, arch, tail or installed seating. C41’s fit KEEP was revoked because its return visibly floated despite zero intersections. C49’s visible-seat check also superseded tentative completion.

C75’s coherent cover and C80/C82 repairs were local keeps, never whole-form approval. C82 moved four frame coordinates but retained 342 fore-frame crossing pairs and major whole-form failures. Its C49 libraries and C75/C80/C82 natives are protected reconstruction sources, not final targets. Fitting V012 stopped on invalid inward offsets and real boundary crossings. Exact unions of bent/nonplanar faces failed; adding triangles alone did not repair them. A MANIFOLD discriminator helped one construction defect but did not establish likeness. Repeated tiny bevel/offset patches around incompatible layout authority were abandoned in favor of a rear reset.

**Meio, exact recorded direction:** “allright. lets do it loop over the brief” (J, fitting-reference section), authorizing that brief, not its failed outputs. Later rejection/reset is reported in J without a verbatim sentence. The eight protected sources are not eight approved finals.

Read sources: J, October 2–4 cowl/bodykit/fitting/C82 sections; `W5/obsolete-native-prune-v001.json`, protected rows and authority.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/rear-cowl-v001/bodykit-form-v001/model/candidate-v082-aft-draft/scooter-rear-cowl.blend` | `60de5f50404f427090a2958ca4080c0756175c4a4c62eb139a22a349e1896fce` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/rear-cowl-v001/candidate-v017/scooter-rear-cowl.blend` | `0dcdeac7eeafc1d10d28dfb62753f82843ef9eb5bfdaf9ab4b71c1088b394094` | KEEP: exact manifest |

### Existing render evidence

- [bodykit-C82-context-side](scooter-build-history/05--bodykit-C82-context-side.png) — stage 05; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/rear-cowl-v001/bodykit-form-v001/model/candidate-v082-aft-draft/fit-context-side.png`; original SHA256 `251da8064899635e889f8c338e4930fe601bf38a50e73e79dd526fe5a101ccb4`; fallback PNG SHA256 `139a9eceb12d3d645fd0876d477392174e49e5170837a39cc0b3168ffe1ac2e5`.
- [bodykit-C82-clay-side](scooter-build-history/05--bodykit-C82-clay-side.png) — stage 05; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/archive/history/assets/authoring/ride-lab/scooter-rebuild/rear-cowl-v001/bodykit-form-v001/model/candidate-v082-aft-draft/saved-clear-clay-side.png`; original SHA256 `a4da2b4f1a75018304baadd3b8c98714f9a0d556dd877e05c112f994a496a51b`; fallback PNG SHA256 `5802f4f52c328d987b997b5d4c9742f4ee653cb358a9337c98bc93f11b97bee6`.

## 06. Rear reset and clean V008 baseline

**Dates:** 2026-10-04–05. **Versions:** rear-assembly-reset; rear-reset V008; working-clean.

The rejected fitting loop gave way to a fresh rear direction from the original goal. Front, seat, footrest and seat height were fixed; rider placement, rear wheel and booster integration stayed provisional, retaining booster preference. Seven selected views drove the reset: six human-approved and rear-quarter V003 director-approved under explicit delegation. Exact native anchors governed generated microdetail conflicts.

V008 earned seven-view local form PASS, then Meio reopened the green/floor junction and black return. Cleanup reduced 3,333 objects/105 collections to 683/9 and about 191 MB to 20 MB, preserving 646 visible geometry owners and 465 locked owners/materials. Two diagnostic renders were visually equivalent with small disclosed pixel differences. C82 became an owner-verification dependency, not a shape target.

**Approval evidence:** reference approval/delegation is recorded, but no verbatim human sentence is supplied. V008 native acceptance is not inferred; its junction issues stayed open.

Read sources: J opening/reset sections; `C/P/docs/CURRENT.md`; `C/assets/authoring/ride-lab/scooter-rebuild/rear-assembly-reset-v001/CURRENT.md`; `W5/RESTORE.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-clean/packages/scooter-blender/models/rear-reset/candidate-v008/scooter-rear-reset.blend` | `6ade160d27f99c0d5eea254637bd5b7f715da658720add0474418bf1c45b2a61` | Superseded native: proposed retirement after evidence preservation |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-clean/packages/scooter-blender/models/rear-reset/working-clean/scooter-rear-reset.blend` | `e97002225d9db9da83667a5559acf3feed34d0491ec4129970a423c18f3451c2` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [rear-reset-V008-side](scooter-build-history/06--rear-reset-V008-side.png) — stage 06; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-clean/packages/scooter-blender/renders/rear-reset/candidate-v008/side.png`; original SHA256 `f356d3e30e2ad069b213ffed72c7b76be959042d61cfae762191d738fea3cc8e`; fallback PNG SHA256 `309c5f8ac7d8de23a602f20b2370804117c6eef06168f4d69d5b8e6d2f5fe531`.
- [rear-reset-V008-rear3quarter](scooter-build-history/06--rear-reset-V008-rear3quarter.png) — stage 06; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-clean/packages/scooter-blender/renders/rear-reset/candidate-v008/rear3quarter.png`; original SHA256 `7614d613dffeb52337bc32772ff10a86fa50af7c4c41ed6e503865b63f1cd4b5`; fallback PNG SHA256 `666ef5485fc052a11371ad4075f85792d7fc19c03c0c22034757ba838acef0d2`.

## 07. Junction trials and shared knee/floor

**Date:** 2026-10-05. **Versions:** rear-reset V009–V014.

V014’s final authority records a shared green/black knee and continuous floor transition, removing notch/block, upper stalk and bright floor gap. Broad planes replaced the paint-mask patch. Six declared owners changed; three break curves and two local rail materials were added. All 465 C82 locks/materials and 640 unaffected working-clean owners stayed exact.

Seven-view independent local KEEP had no critical/major findings; the short black foot remained slightly more angular. Reopened evidence had 11 opposite-side and 16 front-quarter differing pixels with small documented values: visual equivalence, not file identity. V009–13 were superseded trials; the final authority does not explain each variant, so individual failure stories are not invented.

**Meio approval:** pending at this delivery; no exact V014 acceptance quote was found. This was a local correction checkpoint.

Read sources: `W5/current-junction-v014/P/docs/CURRENT.md`; its `docs/ride-lab/PROJECT_STATE.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-junction-v014/packages/scooter-blender/models/rear-reset/candidate-v014/scooter-rear-reset.blend` | `4128f49cd3ddb7815d808444eb8b2a2426134997cd5c5679ff20c9998a24162c` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [junction-V014-before-after](scooter-build-history/07--junction-V014-before-after.png) — stage 07; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-junction-v014/packages/scooter-blender/renders/rear-reset/candidate-v014/junction-before-after.png`; original SHA256 `63291fe8135db1acb023df5cf68b9eab54557c14a199b4520bcd80c99b456fce`; fallback PNG SHA256 `a8c8e2eabed46a8fa81dd445eb23135d929f3ca5b7d1d1b0ab6327534eec1580`.
- [junction-V014-opposite-side](scooter-build-history/07--junction-V014-opposite-side.png) — stage 07; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/current-junction-v014/packages/scooter-blender/renders/rear-reset/candidate-v014/opposite-side.png`; original SHA256 `086035dda764f12d916de8048aacae472f9c22e884546743e31a8fd043fc7c4c`; fallback PNG SHA256 `20bb76c20b5520f711143986fd7738340efa84c8749016f65354c28bcd2a522f`.

## 08. Combined shoulder, seat contact and tail

**Date:** 2026-10-05. **Versions:** rear-reset V015–V022.

V022 composed V021 junction, selected tail V004 settings and contiguous-ring seat work. A rounded shoulder/floor join, fuller cheek, near-parallel black field, seated lower cushion/outline, rounded rail/cap and layered lamp replaced gaps, scallops and spikes. The full upper seat/roll/height stayed exact. Authorization covered only the lower seat band; 463 other C82 locks remained exact.

Eighteen owners changed and one lens owner was added. Seven-view local KEEP marked nine issues fixed; strict global reference verdict stayed FAIL because compatible registered 5% evidence was unavailable. Four reopened views matched RGBA pixels despite different PNG encodings. Individual V015–21 decisions are not fully reconstructed here.

**Meio approval:** bounded seat-edit authorization and held accepted local work are reported, but no exact acceptance quote or whole-asset promotion is supplied.

Read sources: `W5/combined-mesh-v022/P/docs/CURRENT.md`; its `docs/ride-lab/PROJECT_STATE.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/combined-mesh-v022/packages/scooter-blender/models/rear-reset/candidate-v022/scooter-rear-reset.blend` | `0c40872709fe89074b39e2c8363679cb614288ccd25e949b2dba1c1a16094f3c` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [combined-V022-side](scooter-build-history/08--combined-V022-side.png) — stage 08; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/combined-mesh-v022/packages/scooter-blender/renders/rear-reset/candidate-v022/side.png`; original SHA256 `f31d273937fe2344beaa089392945301b4cf11e43ebc5cb7e116cc42f338aef8`; fallback PNG SHA256 `a5407c7d6e35e0b1e75206524ce166bda37d8eeba6699576fb722343cbb4d70e`.
- [combined-V022-rear3quarter](scooter-build-history/08--combined-V022-rear3quarter.png) — stage 08; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/combined-mesh-v022/packages/scooter-blender/renders/rear-reset/candidate-v022/rear3quarter.png`; original SHA256 `e609e791dfc7b477cd504765a1cf5972b1f55ecdf1a6b316446cc8ea01180512`; fallback PNG SHA256 `4cbe844f232f38962db61b3a3cbad92b0c1e77a40ea83f0831c8388bcaeacb6f`.

## 09. Industrial artwork and detail meshes

**Date:** 2026-10-05. **Versions:** V023 rejected; V024 detail candidate.

V024 built a thin recessed industrial front panel, four channels, two fasteners, angular CAUTION and white `BTRCUP-MEIO-MACHINE-01` stencil. Approved artwork was packed unchanged; generated neighboring geometry was not authority. Rear finish was subdued; boosters gained softer contours, modest taper and recessed hardware while retaining dark/cyan depth. Twenty vanes kept topology/count/palette with one shared .0625 setback.

V023’s richer tip detail was liked, but case, straight tip and hardware were rejected. V024 fixed 12 named local findings and earned KEEP, with one optional inherited microfinish difference. Original material graphs held and four reopened views matched pixels. Global registered conformance stayed unverified/FAIL; V024’s boosters were later replaced by Turbine Drums.

**Meio approval:** scoped artwork approval is reported; no exact V024 native approval quote is supplied. Local 12/12 fixes did not promote the asset.

Read sources: `W5/detail-mesh-v024/P/docs/CURRENT.md`; its `docs/ride-lab/PROJECT_STATE.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/detail-mesh-v024/packages/scooter-blender/models/rear-reset/candidate-v024/scooter-rear-reset.blend` | `4b6698da562d0a434d546aed1ba9ded7f50e4601a9510084c7f2b5e6dd8c6e74` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [detail-V024-industrial-panel](scooter-build-history/09--detail-V024-industrial-panel.png) — stage 09; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/detail-mesh-v024/packages/scooter-blender/renders/rear-reset/candidate-v024/inside-panel.png`; original SHA256 `aa36cd967feae002e9d9fd1541778df542e074ba816feaba02c9ba7e32bcd862`; fallback PNG SHA256 `674b0ce4ea0d2d322d0ddeac843671ed4d5ab2c554e1df34a00d3a23fd739b57`.
- [detail-V024-rear3quarter](scooter-build-history/09--detail-V024-rear3quarter.png) — stage 09; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/detail-mesh-v024/packages/scooter-blender/renders/rear-reset/candidate-v024/rear3quarter.png`; original SHA256 `e29d34740730cc95adaec9e6f4c17b68a7ef530d8cf335d25a82afa49540eeaf`; fallback PNG SHA256 `374ca934dbc0b6d456ea59ffb2315cb29bc07275d6a443f5babcc6b37cab6a5d`.

## 10. Hinged Turbine Drum meshes

**Date:** 2026-10-06, stored in the October 5 root. **Versions:** rear-reset V025; Turbine Drum A hinge concept.

Meio selected Turbine Drum A, approved the hinge edit and requested its mesh. V025 replaced only boosters: charcoal drums, steel belts, shallow lime saddles, circular cyan outlets, swivels and restrained warnings. Complete pods turn from 0° rearward to −90° downward about transverse roots; inboard mounts remain fixed. All 625 nonbooster owners and original graphs/rig remained held.

Initial P01 overcovered the drum and missed its cyan ring. Final construction corrected those, unsafe tiny bevels and mismatched right stators. Saved construction/symmetric parenting/five pose samples passed; three reopened views matched pixels. This did not certify continuous clearance, flight or runtime motion. The approved perspective sheet controls boosters only.

**Meio approval:** selection/hinge approval and build request are reported, without exact words. Native V025 remained a review candidate; concept approval did not automatically approve its mesh.

Read sources: `W5/turbine-mesh-v025/P/docs/CURRENT.md`; its `docs/ride-lab/PROJECT_STATE.md` dated October 6.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/turbine-mesh-v025/packages/scooter-blender/models/rear-reset/candidate-v025/scooter-rear-reset.blend` | `c41f00f9c9179fb4321f621f627d3b3769000f338aab65d2bd2f6cf8a8f3d056` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [turbine-V025-rear3quarter](scooter-build-history/10--turbine-V025-rear3quarter.png) — stage 10; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/turbine-mesh-v025/packages/scooter-blender/renders/rear-reset/candidate-v025/rear3quarter.png`; original SHA256 `ea1ce2eaabd5eefe3fb34ccd7b2d4354e34fbbcf7d0c2e3ac8889ca5753b5d95`; fallback PNG SHA256 `0c518ed8ef442d4a1e6b692a6c78f26d0fb529affea03806391285b0d2b4cac9`.
- [turbine-V025-down](scooter-build-history/10--turbine-V025-down.png) — stage 10; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-05/turbine-mesh-v025/packages/scooter-blender/renders/rear-reset/candidate-v025-down/rear3quarter.png`; original SHA256 `00a0bbbbfe2e3b6b13ae14b2bb158d0a25a1c848ea6067fb56027d77dd4415b7`; fallback PNG SHA256 `9979124f7c19f6cfbe6ba0e8b7972f3c99038f1704e6625ea6d1e7486493bb33`.

## 11. Rear wheel, metal, mudguard and drive pocket

**Date:** 2026-10-06. **Versions:** rear-reset V026–V030.

V026 added layered wheel/hub, brake/drive faces, cast arm, four shocks, compact case and curved guard while preserving the tire. Initial review passed with pale shock feet and secondary housing detail open. Meio then accepted the main wheel form and requested red suspension, mounts, cover detail and a booster harness.

V027 added that finish/cradle and checked 0/−45/−90° hinge samples. V028 separated red enamel, dark damper zones and narrow front-derived steel layers, holding physical envelopes; its review recommended keeping the metal budget restrained. V029 changed six stay/mount/fastener meshes so mudguard support read from below; P02 metadata failures remained recorded. V030 fabricated an approved recessed gunmetal cassette, ribbed drum, service face and thick collared return behind the arm. Fifteen new solids, finite contact seats and protected-tire mutation rejection/restoration passed recorded checks.

Readable support mattered beyond physical contact. Hidden joining paths and wide-view fine detail remained limited. Reopened frozen natives, explicit scope exceptions and affected whole views worked; static samples did not certify engineering function or motion.

**Meio approval:** V027 CURRENT reports V026 main-form acceptance; V029 CURRENT reports drive-pocket proposal approval. Neither supplies exact human wording. Later V031 whole-design acceptance covers the resulting visible design.

Read sources: `W6/rear-wheel-v026/delivery/P/docs/CURRENT.md`; corresponding CURRENT files in `wheel-finish-harness-v027/delivery`, `shock-metal-v028/delivery`, `mudguard-v029/delivery`; `W6/acceptance-v031/docs/ride-lab/PROJECT_STATE.md` describing V030.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/rear-wheel-v026/delivery/packages/scooter-blender/models/rear-reset/candidate-v026/scooter-rear-reset.blend` | `2cd85fae4e8ec9588fe64d8b7e4899bcc3e52fe9befcfcdc7862962842734a6a` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/drive-pocket-v030/delivery/packages/scooter-blender/models/rear-reset/candidate-v030/scooter-rear-reset.blend` | `6b01083cff153acd607838a0553091fa5d96b1c795135814d0d162a02ba31526` | Superseded native: proposed retirement after evidence preservation |

### Existing render evidence

- [wheel-V029-underside](scooter-build-history/11--wheel-V029-underside.png) — stage 11; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/mudguard-v029/delivery/packages/scooter-blender/renders/rear-reset/candidate-v029/rear-bottom3quarter.png`; original SHA256 `5d2b3e99d5e14db0852661fa90dbc348178479af7b6abf37104da71caa2b2c6d`; fallback PNG SHA256 `2964e3349e38c720fae5668d3b46223fb761ba10a80d238627ce9748a66080a5`.
- [drive-V030-wheel-side](scooter-build-history/11--drive-V030-wheel-side.png) — stage 11; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/rim-opening-v031/packages/scooter-blender/renders/rear-reset/candidate-v030/wheel-side.png`; original SHA256 `6212ec7db5277a93772f730ad77e8336645aa20aeb79de92cae7c031fee4bbdf`; fallback PNG SHA256 `55667c82d1a9c107bfc8abbc2cd81f78311f588d174b5d2999faa20c567a9881`.

## 12. Rim openings and V031 acceptance

**Date:** 2026-10-06. **Versions:** rear-reset V031; acceptance overlay.

V031 removed the interior web from two deep rim dishes, reopening spoke sectors. Outer shoulder rings/surfaces, spokes, tire, hub, rotor, arms, suspension, mudguard and V030 machinery remained protected: only two dish owners changed, 870 others held. The recorded audit passed two annular solids, clear dish-only rays, ten outer spoke seats and protected-tire mutation rejection/restoration.

Nine-view independent local KEEP covered exposed scope. Opposite rotor/arm/cover occlusion was legitimate; there was no unobscured opposite reference. A simpler opposite housing was a recommendation, not pending modeling. BMesh-order/Freestyle source variants survive by filename in the manifest; their exact failure causes are not inferred from filenames.

**Meio, exact final visual-design approval:** “i think we're done.” He requested the entire scooter and saw the saved V031 rear-quarter render (`W6/acceptance-v031/P/reviews/rear-reset/acceptance-v031/ACCEPTANCE.md`). This later sign-off supersedes pending-human delivery notes. It completes visual modeling, not runtime/export, continuous motion, registered 5% equivalence or engineering validity.

Read sources: acceptance above; `W6/acceptance-v031/docs/ride-lab/PROJECT_STATE.md`; `W6/rim-opening-v031/recovery-manifest.json`. The audit already checked all 52 recovery-manifest entries.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/rim-opening-v031/packages/scooter-blender/models/rear-reset/candidate-v031/scooter-rear-reset.blend` | `a1a3aee3881a4269efc5cb494d3dac95986eaaf430463c8891e446de1191d727` | KEEP: exact manifest |

### Existing render evidence

- [accepted-V031-rear3quarter](scooter-build-history/12--accepted-V031-rear3quarter.png) — stage 12; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/rim-opening-v031/packages/scooter-blender/renders/rear-reset/candidate-v031/rear3quarter.png`; original SHA256 `a9703a0f56a8168e1f35ba7aca3af2ab8cad46d84e9c0ffec48a8f55a9ef4aa8`; fallback PNG SHA256 `e175f1e8a99385aae6a2125c9a271c61f02946d0d111a5e189b51feec7e25afe`.
- [rim-V031-wheel-side](scooter-build-history/12--rim-V031-wheel-side.png) — stage 12; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-06/rim-opening-v031/packages/scooter-blender/renders/rear-reset/candidate-v031/wheel-side.png`; original SHA256 `98bb391a745fc342e37d710ff65e34f6953708dd80a746d756c2622a8e83078f`; fallback PNG SHA256 `09000cd2d122484511201f196d4cbfe2f099d1dcfe55af9ec8b41f64a5234475`.

## 13. NPR, manga targets and P05 elbow result

**Dates:** 2026-10-06–07. **Versions:** NPR V032 P01–P05; manga target V002.

V032 started from immutable V031. P01’s Glossy BSDF/Shader-to-RGB washed lime and fractured highlights; unbound original graphs disappeared on save without retention. P02’s image KEEP failed saved audit because nested snapshots captured runtime addresses. P03 recursively recorded authored RNA, retained orphan graphs and expanded material state; seven images earned KEEP but the elbow remained. P04’s 22 consented sparse edits/custom normals did not eliminate the shadow fork. Its tuple/list comparison was repaired with canonical JSON, not tolerance widening.

P05 added a shared bounded cel-key normal field. Its two-view independent review accepted the elbow/ink/cavities/artwork locally. Full context remained open: profiles had steering forks and rear-close had tail dashes. The paint-with-baseline-ink diagnostic changed two systems, so it could not isolate ownership. Its authored key was fixed in world space at frame 1, not driven by scene lights; movement/light invariance was never established.

Process review proposed one owner per silhouette/seam/hatch/shadow/highlight, actual single-system toggles, purposeful internal feature lines and sparse art. Dense hatching could compete with industrial graphics. Weighted normals alone had not produced the intended elbow shadow.

**Meio, exact recorded resume/selection:** “go accepted” (`W7/historical-npr-v032/PAUSED.md` opening, October 7), freezing V002 and resuming native pilots. This did not approve P05 as a finished whole-asset appearance. Original P05 bytes were later lost; the replay below is a distinct lineage.

Read sources: `W7/historical-npr-v032/SOURCE_HISTORY.md`, `PAUSED.md`, `PROCESS_REVIEW.md`, `P05_VISUAL_REVIEW.md`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/replay-v032-p05-v001/p05.blend` | `62fee6fe2ae18781f419c5093b43f3155df82922b688fac730c5e227cbca524f` | KEEP: exact manifest |

Lost historical V032 P05 hash: `82f9a131a64a3fe15d77cbc1b42bef80de19839f6d529c76fc48425ffb2bc9c9`. The stage witness is the reconstructed replay, not those original bytes.

### Existing render evidence

- [NPR-V032-elbow-trials](scooter-build-history/13--NPR-V032-elbow-trials.png) — stage 13; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/historical-npr-v032/comparison/elbow-trials.png`; original SHA256 `b60c01808f9b33976bd11f3f6d7c6302eebb0fd17979642c9aec5a88c434e939`; fallback PNG SHA256 `49c5893788cb844d0d5e52fb55bd766307260bbd25064dc232f15d31bbc618d7`.
- [NPR-V032-P05-elbow](scooter-build-history/13--NPR-V032-P05-elbow.png) — stage 13; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/historical-npr-v032/comparison/elbow-p05.png`; original SHA256 `ce04e8e868a95979905b78b03290ae708d8d61f027fd43dee829937e1c602ac0`; fallback PNG SHA256 `56ee6de38feb789f288af19d3af0f7318c868e75aed8e318ebd864491278c46a`.

## 14. Lost workspace, reconstruction and later finish hypotheses

**Dates:** October 7–8 recovery; exact dates of later P92/P95/P98 saves unresolved. **Versions:** V032 replay, V033/V034 reconstruction, P17/P18, P19 N7/N8, P92/P95/P98.

The recovery audit attributes workspace loss to forced startup cleanup on October 7, 22:39 Manila. Git retained source/reviews but no package natives or full-size render PNGs. The separate earlier autosave retirement did not cause this. External V031 survived; historical V032/V033/V034 native bytes and full-size V033 seven-view PNGs were not recovered.

Exact V032 recipe replay matched covered reopened state across 874 objects/150 materials and supplemental attributes/normals/keys while producing a different native hash. This proved covered-state equality, not byte recovery or appearance approval. V033 and P17 were reconstructed with fresh evidence; P17 appearance stayed REWORK. P18 trimmed a terminal highlight footprint after five-case proof, changed nine bands and held eight others. Three primaries still required REWORK: apron bands traced the wrong turn/U and the side seat band missed the nose. Further views were not earned by that candidate.

P19 diagnosis separated exterior geometric turns from material-boundary shortcuts. Near-coincident repair strips/opposed normals defeated naive clearance gates; finite principal-sheet/closure guards were explored. N7 side improved apron/seat but left a dominant handlebar patch. Its failed-audit front PNG was diagnostic only. Instance-coverage and MaterialSlot API mistakes stopped later diagnostics; D3’s expanded typed comparison passed but did not reproduce or erase the earlier cold failure. N8 proposed four bounded shoulder graph exceptions; the final summary entry records a launch, not a healthy result.

Later records extend beyond SUMMARY.md: P92 suppresses a rear enhancement; P95 suppresses an apron enhancement at saved strength zero; P98 marks named KFF_CrownRepairShell polygons in material slots 6/7 smooth. Parent links are P92→P95→P98. Their records report held invariants/save-reopen verification, but `gate_pass=false` and `appearance_approval=false`. P98 explicitly calls this a local smoothing hypothesis, not a GPU-pixel cause. Its 333 MB build record was streamed for selected top-level/target fields; the enormous observed-state subtree was not semantically reviewed.

**Meio approval:** none quoted in these records. The summary leaves full 31-item/70-gate finish closure open. No causal bridge to accepted v012 was found. Intermediate P19–P90 trials and exact late dates are incomplete; terminal witnesses and cheap recovery prose/recipes are retained rather than silently discarded.

Read sources: `W7/SUMMARY.md`; `RECOVERY_FEASIBILITY_AUDIT.md`; `ROOT_V032_RECOVERY_VERIFICATION.json`; `p92-rear-coat-enhancement-suppression-v001/build-record.json`; `p95-apron-enhancement-suppression-v002/build-record.json`; selected fields of `p98-kff-smoothing-saved-child-v001/build-record.json`.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/p18-incremental-build-preparation-v001/native/p18.blend` | `d02ef69e2bec7830c0e582aa50a24510b1d28b6b20f72ffb5df031d4d04f517a` | KEEP: exact manifest |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/p98-kff-smoothing-saved-child-v001/native/p98.blend` | `4f41a3828449cdd797ff7d283ae3e17d00efd8ac8787db2d8f15ca8d99ea361c` | KEEP: exact manifest |

### Existing render evidence

- [reconstructed-P18-side](scooter-build-history/14--reconstructed-P18-side.png) — stage 14; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/p18-incremental-build-preparation-v001/renders/side.png`; original SHA256 `75fdc5a0d306c341f0b01b8cf5f346c8619b42e3f44da5701d3c0e5ebc220a1b`; fallback PNG SHA256 `af5d9c80f962beb227f8df61d1eb67997f0b90e93176a0012214811cc7138a91`.
- [late-P98-side-unaccepted](scooter-build-history/14--late-P98-side-unaccepted.png) — stage 14; original `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-workspace-2026-10-07/startup-recovery-v001/p98-kff-smoothing-saved-child-v001/fresh-four-view-v003/review-800/side.png`; original SHA256 `7996f59c5b6440190a542ede4b3a7b744fa6e0d7278b9d500910a5e0db6d44c8`; fallback PNG SHA256 `d224b925b8c8807bf3bf8a19a6b288aea4713c57b5f142a27bfcd72ca4136e58`.

## 15. v012 acceptance and rider-epic handoff

**Dates:** accepted 2026-10-13; epic October 14; integrity receipt October 15. **Version:** apron-manga-weight-20261013-v012 / scooter-orbit-lines-clean.

The epic identifies v012 as accepted scooter appearance and pins the external native. Its manifest records an unchanged copy from that study. October 15 cleanup rechecked the same accepted hash while repacking Git/caches and preserving rider sources; it deleted no art checkpoint/worktree. The November 20 audit reports another historical hash match.

**Human-wording gap:** the epic records acceptance without a quote. The manifest’s `acceptance_note` points to `USER_ACCEPTANCE.md` under the now-absent source study; that path was checked and is missing. No October 13 sentence is invented or borrowed from V031. No v012 render was located in the supplied accepted/October 5–8 roots or requested repo capture set. The exact finish delta/trial sequence from reconstructed V034/P98 to v012 remains unresolved.

R01 must create a new fitting copy with this scooter and the actual v052 character/rig/poses, preserving originals. The old pose used a smaller scooter/lowered saddle; contacts, garment deformation, GLB export and browser shading remain to be proved. Appearance acceptance is not runtime completion.

Read sources: `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-accepted-2026-10-13/v012/manifest.json`; `docs/ride-lab/RIDER_EPIC.md`; `docs/ride-lab/cleanup-2026-10-15/GATES.md` and `final-verification.json`; November 20 audit.

### Stage artifacts and SHA256

| Absolute source file | SHA256 | After deletion |
| --- | --- | --- |
| `/Users/jeromeiovelarde/.codex/art-checkpoints/scooter-accepted-2026-10-13/v012/scooter-orbit-lines-clean.blend` | `f4befb9d29b35c2b0c0e1329885b995e52c77f652e767113d2d3636ea49926a7` | KEEP: exact manifest |

### Existing render evidence

Gap: no matching accepted v012 render located. No substitute is labelled v012.

## Retirements already performed

October 5 RESTORE and prune receipts record 152 obsolete rear/seat trial natives and 24 archived autosaves already retired. Exact recorded authority: “ok own the prune” (`W5/obsolete-native-prune-v001.json`, authority; also RESTORE). Eight protected sources remained. October 8 retired another 28 booster/footwell trials, keeping six gzip representatives and approved/final checkpoints. Historical manifests intentionally still name retired originals; those are not missing survivors or new deletion candidates.

The October 15 summaries report 18,615 original loose Git objects still accessible after packing, held protected hashes, and no checkpoint/model/worktree deletion. Logical bytes, allocated storage and filesystem free-space changes differ. APFS clones mean logical sums do not predict reclamation.

## Gaps for the PM

- The exact v012 acceptance words, accepted render and final finish lineage are missing. Seek them from the owning conversation or another backup; no chat history was accessed here. The accepted native/receipt survive.
- Lost historical V032/V033/V034 originals and V033 full-size seven views cannot be recreated from their hashes. Replays establish only the documented state/fidelity scope.
- Late P19–P98 fine history and per-save dates remain incomplete; P92/P95/P98 explicitly deny approval. Keep their listed terminal witnesses and recovery records until reconciled. The summary’s N8 launch is not final acceptance.
- Early dates/quotes are often consolidated or paraphrased. V009–13 junction and V015–21 combined individual trials are represented by final authority records; this is not a per-save reconstruction.
- No packed dependencies or native scene were opened. The 3D Artist must verify a surviving working copy before cleanup; listed libraries and authority images must survive parent deletion.

## Lessons proposed for the 3D Artist role

These are proposals; no role or skill was edited.

- Freeze design hierarchy, controlling views, native anchors, allowed exceptions and delivery scale before part work. Generated orthographs do not become metric gold through convenience.
- Keep separate verdicts for preservation, topology/contact, likeness, local review, whole review and Meio approval. Later human rejection supersedes local PASS; retire misleading status language.
- After two unsuccessful variants of one hypothesis, use a distinguishing diagnostic. Matched clay, owner colors/rays and single-system toggles beat repeated tiny offsets/bevels.
- Review the whole installed assembly and every owner of its visible form. Outer ratios and zero crossings cannot clear a floating return, missing two-piece joint or unreadable support.
- Give each mark one owner/purpose. Avoid hulls through concave union seams, collapsed terminal rings and duplicate GP/legacy/painted edges. Separate normal-driven shadow, illustration, gloss and cast-shadow tests.
- Prefer shared profiles/receivers and finite sections for connected forms. Invalid offsets, thin-shell cutters and nonplanar Boolean faces produced real crossings; extra triangulation alone did not fix construction.
- Earn broad review from decisive primary views. Bind evidence to reopened frozen natives; distinguish RGBA equality from file hashes. An image followed by a failed audit is diagnostic, not healthy acceptance evidence.
- Static samples are not continuous motion proof. Fixed world-space cel fields need an explicit deformation/light strategy for moving assets.
- Immediately preserve accepted native, libraries/artwork, fixed renders, manifests and exact human quote outside managed worktrees. Git snapshots excluding natives/renders cannot recover them after forced cleanup.
- Retire with explicit overlay ledgers and verified surviving copies. Keep old maps, name intentional losses and retained representatives. A checksum is identity, not a backup.

## What is kept after deletion

The companion keep-list gives exact paths, sizes, SHA256 and reasons. It retains:

- Accepted v012 and receipt; all 17 audit Section 6 canonical binaries, including character/helmet/pose sources outside scooter cleanup.
- Eight protected source meshes: two C49 libraries, C75/C80/C82, cowl V009/V017 and seat V074.
- Historical footwell V028; full V031 recovery/sign-off; accepted fender V002, front-mechanism V034 and rear wheel V026.
- Six previously retained gzip representatives and their restore/retirement maps.
- Four permanent recovery scopes (V032 replay, V033, P17, P18); P92/P95/P98 terminal native/build witnesses pending finish-lineage reconciliation.
- Design/authority images, approved rear-reset view authority, selected original renders, cited primary records and small recovery-era prose/recipes.
- This ledger, bounded fallback PNG folder and exact keep manifest. Existing repo ADR, surface note, capture sets and cleanup summaries remain in place.

Excluded editable intermediates can be uniquely lost on deletion; the ledger does not claim every rejected trial can be rebuilt. Character originals, pre-remodel rider recovery/autosaves, unaccepted character candidates and unrelated roots are outside this task and retain the audit’s existing holds. The keep manifest’s scope is preservation, not a new whole-directory deletion instruction.
