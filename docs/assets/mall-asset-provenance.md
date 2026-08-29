# Mall slice asset provenance

Audit date: 2026-08-28

## Runtime contents in this slice

The authored `/mall` vertical slice still ships **authored procedural Three.js
geometry only** for its architecture, arcade props, signage, route marks, and
moped/rider. No third-party mesh or texture is loaded by that route. The
development-only `/mall/ride-lab` route has a separately curated CC0 vehicle
payload under `public/mall/ride-lab`; it is not imported by the mall runtime.

The procedural environment is original project code. Its material replacement,
world scale, pivots, geometry construction, and disposal rules live in
`app/mall/_runtime/art`. The moving low-poly moped/rider is likewise authored in
the runtime by the vehicle slice. Render geometry is not used as collision
geometry; `mallPhysics.ts` remains the collider source of truth.

## Approved CC0 foundations retained for later curation

| Asset | Creator/source | Inspected archive SHA-256 | License | Runtime status |
| --- | --- | --- | --- | --- |
| [Simple Scooter](https://styloo.itch.io/scooter) | Styloo | `10b41fbe6d7ee337806272a10d42c3c013213d892006f237fce55bc624b88ef4` | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Curated red GLB ships only in Ride Lab |
| [Animated Characters 1.0](https://kenney.nl/assets/animated-characters) | Kenney | `ec3787de70fa2200256848d74201b10f6b6c3126594e9857bf989753312c2b84` | CC0 1.0, bundled `License.txt` | Curated `characterMedium` rig and `skaterMaleA` skin ship only in Ride Lab |
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

## Ride Lab curated vehicle outputs

The source archives are local audit inputs and are not committed. The exact
Simple Scooter archive above supplied
`StylooSimpleScooterAssetPack_GLTF/StylooSimpleScooterAssetPack/scooterred.glb`.
The exact Kenney archive above supplied `Model/characterMedium.fbx` and
`Skins/skaterMaleA.png`.

The rider was converted with `fbx2gltf@0.9.7-p1` using its documented Node API:
`convert("Model/characterMedium.fbx", "kenney-skater-male.glb", [])`. The
scooter was read and rewritten with `@gltf-transform/core@4.4.2` and
`@gltf-transform/functions@4.4.2`, applying `dedup()`, `weld()`, and `prune()`
after disposing its embedded textures. The selected Kenney PNG is already a
41 KB 1024² indexed source and is retained as the only curated character map.

| Runtime file | SHA-256 | Role |
| --- | --- | --- |
| `styloo-simple-scooter.glb` | `fba92c3768c82442aa2298413a52d560804d94ba76fa097e660d3c9034f51239` | 24-mesh scooter with source textures removed |
| `kenney-skater-male.glb` | `e3f7fc437cfbdda07236ddbc44e367cf8b8ae4bdf73c2dd718d6f301ff78d5e3` | 1,029-vertex humanoid and 45-joint skin; unused clips omitted |
| `kenney-skater-male.png` | `cabeed9d1be58037cc1cf3e29fdb42a0cb6af15bebeed877c41a758a932d14f8` | Selected skater colour map used by a toon material |

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
the rider hull is 51% thinner than its first approved pass. The rider uses the
selected map through its toon material, so its authored colour regions remain
intact.
Render geometry never supplies collision: `JoltRidePhysics.ts` remains the sole
arena, chassis, wheel, ramp, and wall collision source.
