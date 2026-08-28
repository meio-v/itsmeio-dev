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
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=09424f742b16b50af9c7613d4445af2a745b5f029ddd0ca7a11aee07111c5457; output-bytes=8200

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
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=85bd8a236e4b0962aeca2a00846378fe5f4578e511ef2a2e0952f57e53a95e87; output-bytes=8233

- [x] G5: browser verification covers the complete preload-to-ollie-to-hover-to-recharge journey, wall grind, first-frame feedback, tuning, reload, context loss, reduced motion, and mobile layout
  CHECK: npm run verify:ride-lab
  EXPECT: rideLab browser verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=a30587e71ad935bcfe67b21d1d316fb5c2121ae037152148558d947a197d5c1a; output-bytes=117

- [x] G6: measured startup, render, geometry, transfer, and lifecycle evidence stays within named budgets
  CHECK: node scripts/verify-ride-lab-evidence.mjs
  EXPECT: rideLab evidence verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/jeromeiovelarde/Dev/itsmeio-dev-jolt-ridelab; path=cf8a55d24f3a/23 entries; EXPECT=matched; output-sha256=428a602ea8d1dabf353bfdd44de237c3134dcf4ece54be1650b84e6ba481a223; output-bytes=37

## Promotion gate (not a completion claim)

A human must approve subjective motorcycle handling, camera feel, visual feedback,
and authored direction before any behavior is promoted into `/mall`. Automated
completion of this development lab does not claim that approval.
