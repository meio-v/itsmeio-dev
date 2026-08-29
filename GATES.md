# Gates: Jolt rideLab phases 1–2

OWNS: app/mall/ride-lab/**, app/mall/_ride-lab/**, app/mall/_runtime/vehicleVisual.ts, lib/ride-lab-feature.ts, lib/ride-lab-feature.test.ts, proxy.ts, docs/design/ride-feedback-points.md, docs/testing/ride-lab-phase-1.md, docs/testing/ride-lab-aerial.md, docs/testing/ride-lab-measurements.json, scripts/verify-ride-lab-browser.mjs, scripts/verify-ride-lab-production-gate.mjs, scripts/verify-ride-lab-evidence.mjs, package.json, package-lock.json

Scope: deliver a development-only Jolt motorcycle test arena that leaves the authored Rapier mall ride unchanged and makes foundational handling plus the agreed preload/ollie/hover/grind sequence measurable and tunable.

- [x] G0: this ledger states outcome checks that can fail
  CHECK: node /Users/jeromeiovelarde/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8

- [x] G1: native Jolt handling plus preload release, ollie, hover depletion, ground recharge, and wall-grind state behave deterministically under focused tests
  CHECK: npm run test:ride-lab
  EXPECT: /# fail 0/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=23dc30ebe153440a16fa761ec7d1e5fdffdde03f1cff4ffa76aeb7acc9ca336c; output-bytes=8962

- [x] G2: the mall and rideLab TypeScript surfaces are type-safe
  CHECK: npm run typecheck
  EXPECT: /tsc --noEmit/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=76c5748b9208229a6d3347a925044c51802a8b7bd742d4064fe648f99b03e4e5; output-bytes=47

- [x] G3: targeted lint accepts every rideLab and adjacent mall file changed by this task
  CHECK: npm run lint:ride-lab
  EXPECT: /eslint app\/mall\/ride-lab app\/mall\/_ride-lab lib\/ride-lab-feature.ts/
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=fb1adfef026df7d3cd79c0fd1a3b5453c602ecedafbbfe2664cfc25e5fb5f0d2; output-bytes=261

- [x] G4: existing mall tests and a production build pass while both optional routes remain closed
  CHECK: npm run test:mall && npm run build && npm run verify:ride-lab:production
  EXPECT: rideLab production gate verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=e85d944b324c35bac0deed4e7fd5f1edba16717bee69b56fd578fa143b63ece8; output-bytes=7901

- [x] G5: browser verification covers the complete preload-to-ollie-to-hover-to-recharge journey, wall grind, first-frame feedback, tuning, reload, context loss, reduced motion, and mobile layout
  CHECK: npm run verify:ride-lab
  EXPECT: rideLab browser verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=a30587e71ad935bcfe67b21d1d316fb5c2121ae037152148558d947a197d5c1a; output-bytes=117

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

A human must approve subjective motorcycle handling, camera feel, visual feedback,
and authored direction before any behavior is promoted into `/mall`. Automated
completion of this development lab does not claim that approval.
