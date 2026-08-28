# Mall slice asset provenance

Audit date: 2026-08-28

## Runtime contents in this slice

The first vertical slice currently ships **authored procedural Three.js
geometry only** for the mall architecture, arcade props, signage, and route
marks. No third-party mesh, texture, source archive, or font is copied into
`public/mall`. This substitution keeps the first scene reviewable without
waiting for a Blender/glTF preprocessing toolchain and avoids shipping uncurated
source packs.

The procedural environment is original project code. Its material replacement,
world scale, pivots, geometry construction, and disposal rules live in
`app/mall/_runtime/art`. The moving low-poly moped/rider is likewise authored in
the runtime by the vehicle slice. Render geometry is not used as collision
geometry; `mallPhysics.ts` remains the collider source of truth.

## Approved CC0 foundations retained for later curation

| Asset | Creator/source | Inspected archive SHA-256 | License | Runtime status |
| --- | --- | --- | --- | --- |
| [Simple Scooter](https://styloo.itch.io/scooter) | Styloo | `10b41fbe6d7ee337806272a10d42c3c013213d892006f237fce55bc624b88ef4` | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Approved source; not vendored or shipped |
| [Building Kit 1.0](https://kenney.nl/assets/building-kit) | Kenney | `2740ef5772fb5fb3d7aab881db22d129f6b68afe711b1a79e6d5e9e19cf3eec6` | CC0 1.0, bundled `License.txt` | Approved source; replaced by authored procedural shell for this slice |
| [Mini Arcade 1.2](https://kenney.nl/assets/mini-arcade) | Kenney; additional contributors Fleur Keijsers and Guus Vermeulen | `2acfe5cb44d392e834f77cf5488528c7cd45427cdf5fb941ce99856276158c19` | CC0 1.0, bundled `License.txt` | Approved source; replaced by authored procedural cabinets for this slice |
| [Redaction 20 Italic](https://usemodify.com/fonts/redaction/) | Forest Young and Jeremy Mickel | Fontsource package `@fontsource/redaction-20@5.3.0` | SIL Open Font License 1.1 | Self-hosted through the application bundle; used only for the mall header wordmark |

Attribution is not required by CC0. The project retains these credits
voluntarily. Checksums identify the exact archives inspected in issue #13; they
are evidence, not build inputs.

## Required modification before any approved pack enters runtime

- Curate individual source files; never commit or serve whole pack archives.
- Normalize Y-up, metre-like scale and ground-aligned placement origins.
- Preserve explicit movable pivots and replace generated node names with stable
  runtime names.
- Replace embedded PBR/palette materials with the semantic toon registry.
- Reduce the scooter from three embedded 2048² maps to at most one authored
  1024² base/mask texture, if any texture detail survives the art pass.
- Merge or instance repeated static architecture while keeping moving parts
  separate.
- Validate curated GLBs and record source file, tool versions, commands,
  modifications, output checksum, scale, axes, named nodes, clips, material
  roles, and collision source here before commit.

The complete source inspection and rationale are preserved in
[issue #13](https://github.com/meio-v/itsmeio-dev/issues/13) and the
[approved CC0 asset audit](https://gist.github.com/meio-v/238bf922a60a12471a40007eb6c4c3b5).
