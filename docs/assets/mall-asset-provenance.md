# Mall slice asset provenance

Audit date: 2026-08-28

## Runtime policy

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
| `public/mall/textures/control-deck.png` | User-provided original illustration | `ac947d0388e19a132702a32d351512659f6054cc736dbc1dcfc4002cd75150f3` | Cropped to the physical panel bounds and mounted as decorative cabinet hardware; the real ride controls and semantics remain separate HTML. |
| `public/mall/textures/coin-door.png` | User-provided original illustration | `61da7713a511acd640bfd796cd20c3549fe7dfe79f80c45bdfb5db28abf609e8` | Cropped nondestructively from the supplied transparent source. The `FREE / 1 PLAY` denomination plate and interactive aperture are layered in HTML so state and accessibility remain intact. |

## Shipped file checksums

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
