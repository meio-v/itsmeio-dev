# Complete character v052 — approved local authoring checkpoint

The user approved and froze the entire character on 2026-09-13 after the v051
trouser finish, then selected it as the character intended to ride the scooter
in RideLab. This record supersedes upper-body-v001 as the latest approved
whole-character authoring checkpoint. It does not replace a runtime asset.

## Source identity and verification

The authoritative local artifact is `character-v052-FROZEN.blend`, captured
from the actual live Blender scene rather than inferred from its older working
document title. It is **not included in this repository**. The local source is
read-only; rigging must use a separate copy.

- SHA256: `eb7b22ea4f2f4413483ca443739e2c60e675b9e25f240dabdba5e4e5ae38a0eb`
- File size: 86,297,673 bytes.
- Saved-scene inventory: 1,703 objects, 1,014 meshes, 102 materials, 43 images.
- All 43 images are packed; no linked libraries.
- The source task reopened the saved file and matched it against its captured
  live-scene snapshot. The checksum was rechecked during the repository handoff.

[manifest.json](manifest.json) is the portable checkpoint record. The inventory
includes hidden archives and is not a runtime mesh count or performance budget.
The full local snapshot and inspection evidence are not reproduced here, so a
fresh checkout alone cannot repeat the Blender reopen verification. Given the
local source, `shasum -a 256 character-v052-FROZEN.blend` checks its identity.

The local freeze script imports earlier audit helpers. It has deliberately not
been copied here as if it were a self-contained verifier. A later distributable
source bundle needs a portable verifier and its actual dependencies.

## Preserve the approved model

The freeze covers the face, hair, glasses, neck, hood, grey interior lining,
jacket panels and fastenings, sleeves, both hands, enlarged cat shirt graphic,
trousers, shoes, shading and authored line art. Do not reopen cosmetic modeling
as incidental rig preparation. Isolate and explain any necessary topology or
rest-pose changes in the rigging copy for review.

Do not flatten active modeling shape keys, indiscriminately apply modifiers,
join everything, or reset the existing hand rigs. Hidden trial objects are not
automatically rigging targets.

## Rigging handoff

The user authorized rigging in a separate task after the freeze. At handoff:

- No body armature exists. `RIG_Hand_L` and `RIG_Hand_R` each contain 26 bones
  and drive their hand meshes and matching outline shells. Preserve their
  existing weights, pose and transform registration.
- The jacket, trousers, head and neck are not body-bound. Existing jacket
  construction groups do not establish a working body rig.
- Trousers and their hull share active approved shape keys. Their raw mesh
  coordinates differ from the shape-key Basis; inspect evaluated appearance.
  Preserve `TF51_Outline_Weight` and the `TF51_Trouser_Outline` node group.
- Bind clothing, flexible ink and hulls deliberately so they follow their
  surfaces; automatic weighting of the whole scene is not an accepted result.

Follow the repository's
[native-authoring decision](../../../../../docs/adr/0001-blender-mcp-native-asset-authoring.md)
and inspect the current
[runtime bone contract](../../../../../app/mall/_ride-lab/rideLabVehicleVisual.ts)
before choosing exported bone names. Blender owns the canonical seated pose;
Three.js owns bounded secondary response. Use the actual scooter source to
establish scale and visible seat, grip and floorboard contact.

Verify neutral appearance, shoulder raises, elbow/knee bends, wrist rotation,
head turns and a seated scooter pose. Inspect the hands, clothing, hulls and
ink together from the relevant fixed views. A skeleton-only scaffold is not a
finished deforming rig. Rig completion is separate from shader portability,
optimization, export and runtime integration.

## Publication hold and later repository delivery

The accepted Top Ten shoe donor's included source notice identifies inciprocal
Inc., copyright 2021, all rights reserved; no reuse license was included. The
local shoe provenance record explicitly leaves reuse licensing unverified.
Verify the original download-page license or obtain a cleared replacement
before publishing/distributing the source or runtime geometry. This is an
unresolved provenance check, not a finding that every possible use is prohibited.
Do not silently replace the approved shoes during rigging.

The frozen scene also retains hidden donor assets and packed images. Inventory
those before curating a distributable source: hiding an object does not remove
it from a `.blend`. Preserve the frozen local original while doing that work.

This documentation checkpoint contains no Blender binaries, donor archives,
textures, rendered previews or GLB changes. Later delivery should include only
cleared, curated source and required evidence—not the full trial history—and
the separately verified runtime export. The live RideLab continues to use
`public/mall/ride-lab/streetwear-rider.glb` until that integration is authorized.
