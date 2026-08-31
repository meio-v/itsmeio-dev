# Mall slice asset provenance

Audit date: 2026-08-28

## Runtime policy

Production rider and scooter authoring follows
[ADR 0001](../adr/0001-blender-mcp-native-asset-authoring.md): the reviewed
Blender scene edited through Blender MCP is the source of truth, while runtime
code owns bounded presentation and validation rather than primary modeling or
the canonical seated pose.

The development-only `/mall/ride-lab` route has a separately curated vehicle
payload under `public/mall/ride-lab`; it is documented independently below.

The mall now ships a curated 1.4 MB GLB set under `public/mall/assets`. Third-
party meshes are geometry donors: source palettes, PBR textures, unused clips,
and pack-level scene assembly are not shipped. Runtime code supplies the toon
palette, hard shadows, selective outlines, placement, and animation pivots.

The original procedural layer remains the source of truth for the 35×18 m
driving benchmark and invisible Rapier colliders. Imported geometry is visual
only, so asset iteration cannot silently change braking distance, lane width,
camera collision, safe reset anchors, or the arcade trigger.

All third-party sources below are CC0. Attribution is retained voluntarily.

## Sources and transformations

| Runtime files | Creator/source | Inspected source SHA-256 | Changes |
| --- | --- | --- | --- |
| `scooter.glb` | [Styloo Simple Scooter](https://styloo.itch.io/scooter) | `10b41fbe6d7ee337806272a10d42c3c013213d892006f237fce55bc624b88ef4` | Selected black GLB; removed three embedded 2048² PBR textures; removed unused skin metadata; deduplicated and pruned. Runtime supplies pink toon body, black wheels/seat, headlight, wheel pivots, and hard shadows. |
| `rider.glb` | [Quaternius Ultimate Modular Men Pack](https://quaternius.com/packs/ultimatemodularcharacters.html), Beach character | `76e001ea131fd76a1bd938a7862606cb8037f7049b632783580b9bf4da2371a8` | Removed 24 unused clips and orphaned accessors; retained rig and flat material roles. Runtime compresses the proportions, poses the rig on the scooter, recolors the clothes, and adds oversized glasses. |
| `arcade-machine.glb`, `claw-machine.glb`, `vending-machine.glb` | [Kenney Mini Arcade 1.2](https://kenney.nl/assets/mini-arcade) | `2acfe5cb44d392e834f77cf5488528c7cd45427cdf5fb941ce99856276158c19` | Selected three destination props; removed shared source colormap and unused UV accessors; replaced materials at runtime. |
| `column.glb`, `wall-doorway.glb`, `wall-panel.glb` | [Kenney Building Kit 1.0](https://kenney.nl/assets/building-kit) | `2740ef5772fb5fb3d7aab881db22d129f6b68afe711b1a79e6d5e9e19cf3eec6` | Selected three shell-breakup pieces; removed shared colormap and unused UV accessors; scaled and placed against the existing procedural architecture. |
| `potted-plant.glb`, `trashcan.glb`, `cardboard-box-closed.glb`, `cardboard-box-open.glb` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | `e67652d0932cee41683f74711c03d3e192a2af9979ef8e6b237711f5482d46b0` | Selected four mundane props; pruned unused accessors; recolored and clustered away from the driving line. |
| `atm.glb` | [pixelmannen Low-Poly ATMs](https://opengameart.org/content/low-poly-atms) | `fc1a7cb87067516269e095617077e8fa5df542a9715e575d5299a26aa66c523f` | Selected `ATM_NORMAL.obj`; converted to binary glTF with `obj2gltf`; retained material names so screens, controls, and body can receive semantic runtime materials. |
| Redaction 20 Italic font bundle | [Forest Young and Jeremy Mickel](https://usemodify.com/fonts/redaction/) via `@fontsource/redaction-20@5.3.0` | Package lock is the build input | SIL Open Font License 1.1. Self-hosted and used for the mall wordmark. |
| Goldman font bundle | [Jaikishan Patel / MagicType](https://github.com/magictype/goldman) via `@fontsource/goldman@5.3.0` | Package lock is the build input | SIL Open Font License 1.1. Self-hosted for mall display labels; the slant is an intentional CSS oblique because the family ships Regular and Bold only. |
| WDXL Lubrifont JP N font bundle | [Google Fonts](https://fonts.google.com/specimen/WDXL+Lubrifont+JP+N) via `@fontsource/wdxl-lubrifont-jp-n@5.3.0` | Package lock is the build input | SIL Open Font License 1.1. Self-hosted for Japanese signage, with DotGothic16 retained as the rollback fallback. |
| `public/mall/fonts/graffiti-xenoa-regular.otf` | Nirmana Visual, user-provided Graffiti Xenoa demo bundle | `dd2d027019fd2b8a2c5687f3698b24ab752280b7e0c38d92499598d110effc68` | Personal-use demo license. Self-hosted only for the decorative `01`–`03` section numerals; CSS tracking is widened to compensate for the display face's naturally tight spacing. |
| `public/mall/textures/control-deck-panel-full.png` | User-provided original illustration | `d5b337a59b54e83d9a006c2438bf31595e7f1530bd7069b70ba82beae6c22208` | Rebuilt from the untouched source alpha bounds with transparent safety padding around the complete casing, then given a cache-safe asset URL. The real ride controls and semantics remain separate HTML. |
| `public/mall/textures/coin-door.png` | User-provided original illustration | `61da7713a511acd640bfd796cd20c3549fe7dfe79f80c45bdfb5db28abf609e8` | Cropped nondestructively from the supplied transparent source. The `FREE / 1 PLAY` denomination plate and interactive aperture are layered in HTML so state and accessibility remain intact. |
| `public/mall/stickers/doodles/memory-card.png` | User-provided original illustration | `6f380d81839be51e92d1f047695ee096676b22b3b8d72db36180c3799f647113` | Shipped unchanged as a decorative sticker in the Currently Playing poster wall. |

## Ride Lab curated vehicle outputs

The complete source inspection and rationale are preserved in
[issue #13](https://github.com/meio-v/itsmeio-dev/issues/13) and the
[approved CC0 asset audit](https://gist.github.com/meio-v/238bf922a60a12471a40007eb6c4c3b5).

The source archives are local audit inputs and are not committed. The exact
Styloo Simple Scooter archive above supplied
`StylooSimpleScooterAssetPack_GLTF/StylooSimpleScooterAssetPack/scooterred.glb`.
The [Kenney Animated Characters 1.0](https://kenney.nl/assets/animated-characters)
archive supplied `Model/characterMedium.fbx` and `Skins/skaterMaleA.png`; its
inspected SHA-256 is
`ec3787de70fa2200256848d74201b10f6b6c3126594e9857bf989753312c2b84`.

The former Kenney authoring reference was converted with `fbx2gltf@0.9.7-p1` using its documented Node API:
`convert("Model/characterMedium.fbx", "kenney-skater-male.glb", [])`. The
scooter was read and rewritten with `@gltf-transform/core@4.4.2` and
`@gltf-transform/functions@4.4.2`, applying `dedup()`, `weld()`, and `prune()`
after disposing its embedded textures. The selected 41 KB Kenney PNG is retained
outside `public` only as an authoring reference; the runtime rider is texture-free.

| Runtime file | SHA-256 | Role |
| --- | --- | --- |
| `styloo-simple-scooter.glb` | `fba92c3768c82442aa2298413a52d560804d94ba76fa097e660d3c9034f51239` | 24-mesh scooter with source textures removed |
| `streetwear-rider.glb` | `37f3511e865a0c92ccbf479c64ba6c1c1b621b5061843814cad1ae30dde0818e` | Merged Girush-derived streetwear rider on the 45-joint Kenney-compatible skin; 3,279 uploaded vertices, 5,882 triangles, 382,940 bytes, no textures or clips |

The former runtime Kenney files are retained outside `public` as measured
authoring references. `assets/authoring/ride-lab/kenney-runtime-rig.glb` has
SHA-256 `e3f7fc437cfbdda07236ddbc44e367cf8b8ae4bdf73c2dd718d6f301ff78d5e3`;
`kenney-runtime-rig.png` has SHA-256
`cabeed9d1be58037cc1cf3e29fdb42a0cb6af15bebeed877c41a758a932d14f8`.
Neither is served by the application.

## Streetwear rider source ledger

[Base Rigged Stylized Humanoid Character (YW)](https://opengameart.org/content/base-rigged-stylized-humanoid-character-yw)
by Girush is dedicated to CC0/public domain. The inspected source archive
`basemesh_a1_human_yw_by_girush_2.7z` is 4,577,846 bytes with SHA-256
`89b885ce4acb7663c236d4602b4f6e44e3384e153049f897f9b383ceee16aacb`;
its bundled readme repeats the public-domain grant. The source archive remains a
local audit input. The runtime output retains the Girush body, head, eye, and
hair geometry but replaces the source armature with the established
Kenney-compatible 45-joint runtime skin and strips textures and animations.

[Basic Hoodie](https://blendswap.com/blend/21443) by acstrider is CC0. The
authenticated `Basic Hoodie.zip` download is 3,566,882 bytes with SHA-256
`1c246e6c36ac070197756b141fd59cca472b50bbfaf471ea9de192d42505c26c`.
The `Basic guy hoodie` supplied proportion and construction reference during
the authored silhouette pass. Its mesh, redundant solidify/subdivision stack,
materials, textures, scene objects, and source archive are excluded from
runtime; the shipped hoodie is deterministic project-authored geometry.

[Clothing and Character Kit 1.0](https://sketchfab.com/3d-models/clothing-and-character-kit-10-cc0-7c733dceb2e04c4fb7e7dbd85316c1e7)
by Britdawgmasterfunk states the creator's CC0 intent. The authenticated source
archive is 22,469,133 bytes with SHA-256
`0e4c91dea3f687ecb1c2d74d5fdea130384df930b0c3be475cf256da92faedb7`.
The kit supplied proportion and construction reference for the cream shirt
tail, dropped-crotch cargo shorts, and broad skate-shoe termination. No donor
mesh ships: those garments are deterministic project-authored geometry with a
separate sole volume and shallow attached cargo pockets. All donor materials,
textures, unused meshes, and source archives are excluded. Credit is retained
voluntarily even where CC0 attribution is not required.

The current pre-MCP pilot GLB was generated by
`scripts/build-streetwear-rider.py` under Blender 5.2.1 LTS. That historical
builder retargeted the reviewed Girush anatomy onto Kenney-compatible pivots,
assigned at most four blended weights per authored garment vertex, kept shoes
foot-rigid, and emitted the measured single-draw runtime GLB recorded in
`docs/testing/streetwear-rider-asset-metrics.json`.

It is not the production authoring source going forward. Per
`docs/adr/0001-blender-mcp-native-asset-authoring.md`, the reviewed Blender scene
edited through Blender MCP is the source of truth for rider and scooter
geometry, rigging, posing, and visual refinement. Repository scripts validate
the exported artifact but do not replace visible Blender authoring or review.

Runtime normalization is owned by `rideLabVehicleVisual.ts`: Y is up, vehicle
forward is +Z, the scooter scale is `1.56 / 2.6811` to match the Jolt wheelbase,
and wheel centers are aligned at Z ±0.78 m. Stable movable nodes are
`wheelfront.001`, `wheell  back`, `wheelfront.002`, and `guide`; stable rider
bones include hips, spine, paired arm/forearm/hand chains, and paired leg/foot
chains. Explicit normalized scooter mesh-name roles rematerialize tires as deep
black, the muffler as chrome, the drivetrain as cool gunmetal, the seat as
very dark charcoal, primary structure and former accent panels as saturated
pastel green, controls as cyan, hardware as chrome, and lamps as orange/red.
Scooter and rider share a nearest-filtered four-band toon ramp with two near-black
shadow bands, unfiltered hard-edged shadow maps, and an inverted-hull ink silhouette. The
scooter hull covers its outer body, seat, fender, wheel, muffler, and drivetrain
meshes while excluding lamps and tiny fasteners from duplicate geometry;
the rider hull is 51% thinner than its first approved pass. Rider colours are
assigned by semantic modular mesh name through the texture-free toon palette.
Render geometry never supplies collision: `JoltRidePhysics.ts` remains the sole
arena, chassis, wheel, ramp, and wall collision source.

## Project-authored scooter detail

`public/mall/ride-lab/scooter-booster-sticker.png` is a 512 x 512 RGBA runtime
decal generated and composited for this project. It depicts the approved
ragdoll-cat mascot with an eyepatch, blue visible eye, and inverted-V forehead
marking; no third-party source asset is embedded. Its SHA-256 is
`00d2e0e085e7b5233584f10638d2018ec7980fa54e758c3babecb29c77e80819`.

The full-resolution Character Reference Factory sheets are retained as
authoring-only files under `assets/authoring/ride-lab/scooter-reference/` and
are not loaded by the application.

## Mall shipped file checksums

| File | SHA-256 |
| --- | --- |
| `arcade-machine.glb` | `c9ecd0d8a0ded997e9e6a4847f13ef012e2af1193db52713b3365d89ec4eb16e` |
| `atm.glb` | `eef829040259b75022535c65adcd328fdbbf2be67a28a836b9b35d298ecd8e69` |
| `cardboard-box-closed.glb` | `f2c019f2988de7960440207e245750fb45185d01ff93e2f1bf018db7f475bfc4` |
| `cardboard-box-open.glb` | `fe41f4bf62bf0fe7846ea3624b165e1d5d827c3f2080957fead5f0dea79488d2` |
| `claw-machine.glb` | `245ae420398f639d6f0271de1a37fe5423468956e704aafd229a0ce4a9bb6d59` |
| `column.glb` | `6e2d1bf801cfcfecb47848214767e6898108bd5e8dc9edb91312066f00aac6f5` |
| `potted-plant.glb` | `db4a1ae8413b4f4a2807ae6dfe44f46eb8260a422608c3e4e801af38429921fa` |
| `rider.glb` | `65f9166e848b17bc33ab6fc7d5c52cb37d00b90394055bad13391da1fa87b25b` |
| `scooter.glb` | `d793962749d9b02301f542b59478562e93daafb19d77bb8cf8e034b42b556c92` |
| `trashcan.glb` | `8049bd11d4344b88372a60ae04c09b03d98d5422e815ae9181cd97ad0f49dc4d` |
| `vending-machine.glb` | `2a343347d019b1063e59f4326c99a71aed9fb7bb0adcc4e1b22809d648dde334` |
| `wall-doorway.glb` | `5a00fbbc246cb99f270d4b5c2dda8b381b6578edef736105830577b75c503bae` |
| `wall-panel.glb` | `e6738f4ba4ecd6b986ca6c2c5988b653e1307dbd62cc98b050453d2d86c4a5a2` |

The broader source inspection remains in [issue #13](https://github.com/meio-v/itsmeio-dev/issues/13)
and the [approved CC0 asset audit](https://gist.github.com/meio-v/238bf922a60a12471a40007eb6c4c3b5).
