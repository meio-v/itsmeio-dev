# Ride Lab authoring references

These files are build-time references and are not served by Next.js.

- `kenney-runtime-rig.glb` is the measured 45-joint compatibility target used
  when building `public/mall/ride-lab/streetwear-rider.glb`.
- `kenney-runtime-rig.png` preserves the former Kenney colour-map reference for
  provenance comparison; the streetwear rider does not load it at runtime.

The source Kenney archive and all third-party donor archives remain local audit
inputs and are not committed. Only curated output geometry belongs under
`public/mall/ride-lab`.

## Scooter modeling references

`scooter-reference/` contains project-authored image-generation outputs copied
into the repository for portable Blender authoring. They are reference-only and
must not be loaded by the Ride Lab runtime:

- `turnaround-three-band.png`: canonical side/front/rear profile and hard-band
  color target.
- `body-shell.png`, `front-assembly.png`, `rear-mechanical.png`, and `seat.png`:
  focused proportion and panel-flow sheets.
- `jump-booster.png` and `assembled-booster.png`: exaggerated sci-fi-punk
  booster shape and installed relationship.
- `booster-ragdoll-cat-sticker.png`: fresh ragdoll-cat decal target with an
  eyepatch, blue visible eye, and inverted-V forehead marking.

These references were generated in the project session through the Character
Reference Factory workflow. They contain no third-party source assets and have
no runtime texture-memory cost.

## Character modeling checkpoint

[Complete character v052](character-2026-09/model-freeze-v052/README.md) records
the user-approved, frozen character intended to ride the RideLab scooter. This
repository contains its approval record and checksum, not the local Blender
file: shoe-donor reuse licensing remains unverified, so source and runtime asset
publication are on hold. Rigging proceeds in a separate copy; the existing
runtime rider is unchanged.

[Upper body v001](character-2026-09/upper-body-v001/README.md) remains a historical,
editable checkpoint. Its packed Blender scene, reference images, review views
and validation manifest are kept together, but it is not the latest approved
whole-character source. Neither checkpoint is served at runtime.
