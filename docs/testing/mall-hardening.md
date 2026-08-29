# Mall hardening contract

The `/mall` route is an optional HTML-first vertical slice. Its ordinary links,
copy, currently-playing content, and fallback poster must remain usable without
WebGL. Production keeps the route closed unless `MALL_ENABLED=true` is set.

## Runtime boundaries

- `ridePhysics.ts` owns the fixed-step Rapier world, vehicle forces, collision
  filtering, reset behavior, and idempotent release. It has no renderer or DOM
  dependency, so Node tests exercise the same dynamics used in production.
- `MallRideRuntime.ts` owns Three.js rendering, camera composition, input
  coordination, runtime events, resize/visibility handling, and WebGL lifecycle.
- A lost WebGL context pauses the ride and preserves its resume mode. Restoration
  resets renderer state and resumes the interrupted attract or driving mode.
- Runtime disposal stops the animation loop, disconnects observers/listeners,
  releases Rapier, deduplicates geometry/material disposal, clears the scene,
  and is safe to call more than once.
- The authored mall environment opts out of `OutlineEffect`; its existing
  inverted-hull accents remain, while the moving moped keeps the hero outline.

## Deterministic handling envelope

`npm run test:mall` advances the production fixed-step world at 60 Hz and fails
when these measured handling characteristics drift:

| Benchmark | Required envelope | Reference run |
| --- | --- | --- |
| Two-second full-throttle speed | 6.7–7.0 m/s | 6.85 m/s |
| Two-second distance | 6.9–7.4 m | 7.13 m |
| Brake-to-stop distance from that speed | at most 2.5 m | 2.43 m |
| Equal/opposite 0.75 s judging turns | 2.5–2.8 m lateral; under 1 mm asymmetry | 2.64 m |

The suite also checks exact repeat-run determinism, frame-partition-independent
camera damping, context-interruption resume state, and idempotent teardown.
These figures are regression oracles, not a claim that the ride feels approved.

## Production verification

Run in this order:

```text
npm run test:mall
node scripts/run-mall-check.mjs typecheck
node scripts/run-mall-check.mjs lint
node scripts/run-mall-check.mjs build
node scripts/verify-mall-browser.mjs
node scripts/verify-mall-performance.mjs
node scripts/verify-mall-scope.mjs <mall-base-commit>
```

The build check compiles with production defaults and proves `/mall` responds
with 404 while the home page remains available. The browser check starts the
built app with the route explicitly enabled and covers control, arcade
open/close/resume, context loss/restore, repeated disposal and reload, reduced
motion, no-WebGL fallback, desktop, and 375×812 touch layout.

The performance check enforces 5.5 MB transferred, 5 s to first rendered frame,
150 draw calls, 300k triangles, 16.7 ms average render work, and 50 ms peak
render work. A local headless Chromium reference run on 2026-08-28 measured
1.48 MB, 294 ms, 15 calls, 964 triangles, 2.08 ms average, and 3.4 ms peak.

## Human gates

Automation does not approve handling feel, chase-camera composition, visual art
direction, or prose. A human reviewer must drive the route on desktop and touch
hardware, review reduced motion, and compare desktop/mobile captures before the
slice is treated as product-approved. Do not tune thresholds to manufacture that
approval; update them only after an intentional handling decision.

## Durable agent context

Future work should preserve the `/mall` optional-route boundary, authored copy
and destinations, HTML-first fallback, and open-license asset ledger. It should
run the verification sequence above after runtime changes and report subjective
handling, camera, art, and copy decisions as human gates. New destinations,
features, deployment, and production enablement are separate scopes.
