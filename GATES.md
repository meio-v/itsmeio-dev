# Gates: Jolt rideLab phases 1–2

OWNS: app/mall/ride-lab/**, app/mall/_ride-lab/**, app/mall/_runtime/vehicleVisual.ts, public/mall/ride-lab/**, lib/ride-lab-feature.ts, lib/ride-lab-feature.test.ts, proxy.ts, docs/assets/mall-asset-provenance.md, docs/design/ride-feedback-points.md, docs/testing/ride-lab-phase-1.md, docs/testing/ride-lab-aerial.md, docs/testing/ride-lab-measurements.json, scripts/verify-ride-lab-assets.mjs, scripts/verify-ride-lab-browser.mjs, scripts/verify-ride-lab-production-gate.mjs, scripts/verify-ride-lab-evidence.mjs, package.json, package-lock.json

Scope: deliver a development-only Jolt motorcycle test arena that leaves the authored Rapier mall ride unchanged and makes foundational handling plus the agreed preload/ollie/hover/grind sequence measurable and tunable.

- [x] G0: this ledger states outcome checks that can fail
  CHECK: node /Users/jeromeiovelarde/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=1b7cccd68f673aaa14281c0be39203ce0431ecda493d90298a0312619aad548a; output-bytes=151

- [x] G1: native Jolt handling plus preload release, ollie, hover depletion, ground recharge, and wall-grind state behave deterministically under focused tests
  CHECK: npm run test:ride-lab
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=ebb96d4f5aa4f3a7d729f7a6213ceacb2e4d3017b240f99c94a9a716ca058295; output-bytes=13641

- [x] G2: the mall and rideLab TypeScript surfaces are type-safe
  CHECK: npm run typecheck
  EXPECT: /tsc --noEmit/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=76c5748b9208229a6d3347a925044c51802a8b7bd742d4064fe648f99b03e4e5; output-bytes=47

- [x] G3: targeted lint accepts every rideLab and adjacent mall file changed by this task
  CHECK: npm run lint:ride-lab
  EXPECT: /eslint app\/mall\/ride-lab app\/mall\/_ride-lab lib\/ride-lab-feature.ts/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=662faa2a5340ff578c1fd3c860e9659679ead666212df853dc374f6cea282713; output-bytes=296

- [x] G4: existing mall tests and a production build pass while both optional routes remain closed
  CHECK: npm run test:mall && npm run build && npm run verify:ride-lab:production
  EXPECT: rideLab production gate verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=6c1b2efefd42ff9a0a3dee0f5a94ef11fb9649909a89374412c9b2b8e2ea1af0; output-bytes=8235

- [x] G5: browser verification covers the complete preload-to-ollie-to-hover-to-recharge journey, wall grind, first-frame feedback, tuning, reload, context loss, reduced motion, and mobile layout
  CHECK: npm run verify:ride-lab
  EXPECT: rideLab browser verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=f9444836223a035943a060ec88e727bc59a97d8ac5c27b8774e6282faddb6a34; output-bytes=618

- [x] G6: measured startup, render, geometry, transfer, and lifecycle evidence stays within named budgets
  CHECK: node scripts/verify-ride-lab-evidence.mjs
  EXPECT: rideLab evidence verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=428a602ea8d1dabf353bfdd44de237c3134dcf4ece54be1650b84e6ba481a223; output-bytes=37

## Promotion gate (not a completion claim)

- [x] G7: straight acceleration presents suspension load as pitch, and mirrored turns remain symmetric below the assisted lean ceiling
  CHECK: node --experimental-strip-types --test --test-reporter=tap app/mall/_ride-lab/rideLabModel.test.ts app/mall/_ride-lab/JoltRidePhysics.test.ts
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=6a74883a47932def735c96219e743fa75ce497c2e59a66f8fd3ea763b1e17c01; output-bytes=6571

- [x] G8: speed lines remain off below 100 km/h and steering intent resolves to an explicit 80% rider-shift / 20% handlebar blend
  CHECK: npm run test:ride-lab
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=834f76328eaab1fd723364c997961d4578e71faa8d33de5e3333cb64981f4181; output-bytes=9838

- [x] G9: sustained throttle plus steering remains bounded by the tuned lean and yaw-rate ceilings within solver tolerance while preserving a rightward path
  CHECK: node --experimental-strip-types --test --test-reporter=tap --test-name-pattern='sustained throttle' app/mall/_ride-lab/JoltRidePhysics.test.ts
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=bb3f38468f2d44a91f68cf07a1329a2693969acdac67705864843bcaaff6be9c; output-bytes=875

A human must approve subjective motorcycle handling, camera feel, visual feedback,
and authored direction before any behavior is promoted into `/mall`. Automated
completion of this development lab does not claim that approval.

## Curated moped and articulated rider slice

- [x] G10: only curated CC0 scooter and skater-male rider runtime assets ship, with exact source provenance, stable named nodes, bounded geometry, and no source archive or uncurated texture payload
  CHECK: node scripts/verify-ride-lab-assets.mjs
  EXPECT: curated rideLab vehicle asset verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=ede50eac2aea6bb57fbd1696f5ffae66b3d24baa752aa475ee3689fb8c31d29e; output-bytes=50

- [x] G11: the Ride Lab visual adapter exposes independently disposable scooter, rider, outlined materials, steering assemblies, and rider-bone ownership with deterministic seated and asymmetric steering poses
  CHECK: node --experimental-strip-types --test --test-reporter=tap app/mall/_ride-lab/rideLabVehicleVisual.test.ts
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=4890fc7c18e3e0ef88a376d028de6e4b0bd6567fee2b824445ce74397281d4d0; output-bytes=1441

- [x] G12: focused Ride Lab tests, TypeScript, and targeted lint accept the curated vehicle integration without changing physics behavior
  CHECK: npm run test:ride-lab && npm run typecheck && npm run lint:ride-lab
  EXPECT: /eslint app\/mall\/ride-lab app\/mall\/_ride-lab/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=188e87e37d852b1b7b214c4813fbd4ef5fae950869e56a4796462abbddf6b38d; output-bytes=13980

- [x] G13: browser verification observes the curated scooter/rider, three-band palette, seated and moving-grip contact, outside-elbow/shoulder/head response, gradual mirrored recovery, aligned handlebar/front-wheel steering, wheel spin, repeat reload, reduced motion, and teardown with one live runtime
  CHECK: npm run verify:ride-lab
  EXPECT: rideLab browser verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=551026d0ba9a07b272c7b8f87be4a4422285e3627796922f576033e0ddafa944; output-bytes=618

- [x] G14: the production build and disabled-by-default route gate pass with curated assets remaining inside the optional Ride Lab boundary
  CHECK: npm run build && npm run verify:ride-lab:production
  EXPECT: rideLab production gate verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=3f1351cc094c95e9cbb89dd72605267a21888db1a08c2491198d11ab5d160c49; output-bytes=2273

- [x] G15: refreshed startup, render, geometry, transfer, and lifecycle measurements remain within the named Ride Lab budgets
  CHECK: node scripts/verify-ride-lab-evidence.mjs
  EXPECT: rideLab evidence verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=428a602ea8d1dabf353bfdd44de237c3134dcf4ece54be1650b84e6ba481a223; output-bytes=37

- [ ] G16: the user approves the scooter scale and orientation, seated rider contact points, steering pose, wheel motion, rematerialized art direction, and overall silhouette in the live Ride Lab
  EVIDENCE: pending

## Streetwear rider kitbash

- [ ] G17: this extended ledger states streetwear-rider outcomes with checks that can fail
  CHECK: node /Users/jeromeiovelarde/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: pending

- [ ] G18: the implementation note records the current Kenney mesh, skeleton hierarchy, pose controller, scooter attachment, axes, offsets, materials, geometry, and runtime assumptions from measured source evidence
  CHECK: node scripts/verify-streetwear-rider-baseline.mjs
  EXPECT: streetwear rider baseline verification passed
  EVIDENCE: pending

- [ ] G19: every shipped streetwear rider component has an approved CC0 source, exact provenance, bounded geometry, and no unused source archive or donor payload in the runtime bundle
  CHECK: node scripts/verify-streetwear-rider-assets.mjs
  EXPECT: streetwear rider asset verification passed
  EVIDENCE: pending

- [ ] G20: the runtime rider preserves the Kenney-compatible skeleton and scooter integration while exposing modular body, hair, hoodie, undershirt, cargo shorts, calves, and oversized shoes with deterministic seated and mirrored steering deformation
  CHECK: node --experimental-strip-types --test --test-reporter=tap app/mall/_ride-lab/rideLabVehicleVisual.test.ts
  EXPECT: /# fail 0/
  EVIDENCE: pending

- [ ] G21: focused Ride Lab tests, TypeScript, and targeted lint accept the streetwear rider without changing controls, camera, physics, collider, route, or teardown behavior
  CHECK: npm run test:ride-lab && npm run typecheck && npm run lint:ride-lab
  EXPECT: /eslint app\/mall\/ride-lab app\/mall\/_ride-lab/
  EVIDENCE: pending

- [ ] G22: browser verification observes the streetwear rider through idle, acceleration, braking, mirrored turns, preload, ollie, hover, grind, recovery, reload, reduced motion, and mobile layout with bounded hand, foot, seat, and clothing contact telemetry
  CHECK: npm run verify:ride-lab
  EXPECT: rideLab browser verification passed
  EVIDENCE: pending

- [ ] G23: the streetwear rider stays in the optimized Kenney performance class and the optional Ride Lab remains disabled by default in a production build
  CHECK: npm run build && node scripts/verify-ride-lab-evidence.mjs && npm run verify:ride-lab:production
  EXPECT: rideLab production gate verification passed
  EVIDENCE: pending

- [ ] G24: at the actual gameplay camera the user approves the five dominant shapes—hair, oversized hoodie, baggy cargo shorts, skinny calves, and enormous shoes—and fixed rear, front, both profile, and elevated three-quarter views show credible scooter positioning with no major visible clipping
  EVIDENCE: pending

## Blender MCP-native streetwear refinement

- [ ] G25: Codex can successfully inspect the open rider scene through the configured Blender MCP bridge after the required desktop refresh
  EVIDENCE: pending

- [ ] G26: the reviewed Blender scene is the production source of truth; Blender MCP exports the rider GLB from that scene and the repository independently verifies the locked eye assembly, modular garment/shoe meshes, Kenney-compatible rig, bounded geometry, baked canonical seated pose, and export metadata
  CHECK: node scripts/verify-streetwear-rider-assets.mjs
  EXPECT: streetwear rider asset verification passed
  EVIDENCE: pending

  AUTHORING: follow `docs/adr/0001-blender-mcp-native-asset-authoring.md`; do not regenerate the production rider or scooter through a headless Python builder

- [ ] G27: fixed standalone-character T-pose front, rear, both profile, and elevated three-quarter captures provide a stable visual comparison set for the refinement pass
  CHECK: node scripts/verify-streetwear-rider-captures.mjs
  EXPECT: streetwear rider capture verification passed
  EVIDENCE: pending

- [ ] G28: the user visually approves the standalone character's refined oversized streetwear silhouette, appealing face, continuous dropped-seam hoodie, thin layered undershirt, reference-shaped low-crotch cargo shorts, and forward-oriented enclosed structured skate shoes
  EVIDENCE: pending

- [ ] G29: orthographic front, both profile, and elevated three-quarter diagnostic overlays compare the generated target section-by-section and distinguish torso width from depth before the correction pass
  EVIDENCE: pending

- [ ] G30: the correction pass resolves shoe orientation and enclosure first, then hoodie/sleeve continuity, torso proportions and undershirt layering, shorts silhouette, and face appeal without changing the locked rig/runtime contract
  EVIDENCE: pending
