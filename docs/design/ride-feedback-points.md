# Ride feedback points

This is the living interaction contract for the development-only `rideLab`.
Jolt is the selected foundation for the lab. The existing Rapier `/mall` ride
remains the unchanged baseline until a human approves promoting a behavior.

## Guiding principle

Every valid input, contact, and state transition begins an acknowledgement
within one rendered frame. The physical consequence may build over time:
throttle can spool, suspension can load, and momentum persists after release.
Reduced-motion mode may suppress camera or screen motion but must retain a
non-motion acknowledgement through the vehicle, UI, color, text, or sound.

Feedback is system-wide. Input, moped motion, environment, camera, audio, VFX,
UI, and runtime state communicate the same event rather than inventing separate
interpretations.

Phase 1 implements input, moped motion, camera, speed-line VFX, UI, and
runtime-state feedback. Environment reactions and audio remain future channels;
neither is silently represented by an inactive knob.

## Canonical signals

The target feedback system reads a small normalized snapshot instead of reaching
into engine parameters. Phase 1 publishes the subset named in its interaction
contract below; the remaining signals are requirements for the later mechanics
that consume them:

- throttle and brake intent, resolved drive and braking force
- longitudinal speed and acceleration
- grounded state, wheel contacts, and suspension load
- lean, pitch, roll, and angular velocity
- vertical velocity, airtime, collision, and landing severity
- recovery, pause, reduced-motion, fallback, and context state

One owner defines each concept and unit. Derived diagnostics are read-only.
Every editable value has a bounded range, default, reset, and explanation.

## Phase 1 interaction contract

- Throttle press immediately acknowledges input while drive force spools up;
  release changes the transient immediately while momentum continues.
- Steering expresses desired travel direction. Jolt supplies motorcycle lean and
  balance; releasing steer requests assisted physical recovery, never a snap.
- Braking builds from a binary input into analog pressure, visibly transfers
  weight forward, permits rear slip, and restores grip progressively.
- Speed presentation separates acceleration feedback from sustained speed:
  suspension response and camera lag lead into follow distance, FOV, optic flow,
  and independently tunable speed lines.
- Normal riding is highly assisted by default. Assistance cannot teleport,
  cancel momentum, or manufacture traction.
- The lab publishes ground/air, suspension, lean, slip, acceleration, and
  lifecycle diagnostics so tuning changes can be measured rather than guessed.

Phase 2 implements ollie preload, hover, and wall grinding inside `rideLab` only.
Authored mall expansion remains outside the lab and these mechanics still require
human approval before any promotion.

The Space sequence is: hold on the ground for visible suspension preload,
release for an ollie, then hold again while airborne for resource-bound hover or
to latch a valid wall grind. Hover recharges on the ground. A grind
preserves entry momentum and releases back into flight. Those mechanics require
their own acceptance gates and human judgment before leaving `rideLab`.

## Tuning complexity budget

Phase 1 values are grouped into drivetrain, braking, steering/assist,
chassis/suspension, camera/feedback, and Jolt advanced settings. The UI starts
from named presets, keeps advanced groups collapsed, explains each value,
supports reset and JSON export/import, and stores only the lab configuration in
local browser storage. Presets own the complete versioned physics/presentation
configuration. Reduced motion remains an immediate runtime accessibility
override rather than a persisted preset preference.

## Human review gates

Numbers can prove response timing, envelopes, teardown, and performance. They
cannot approve whether handling feels weighty, whether the camera feels good,
or whether feedback suits the authored visual direction. Those judgments stay
explicit human gates before promotion into `/mall`.
