# rideLab aerial mechanic contract

This extends the development-only Jolt laboratory without promoting behavior
into `/mall`. Space is one contextual action with a readable three-beat rhythm:

1. Hold Space while grounded to visibly compress the suspension. Preload grows
   continuously to a bounded maximum and remains compressed until release.
2. Release Space to convert the stored preload into a physical upward impulse.
   Longer preload produces a stronger ollie within named minimum/maximum bounds.
3. Hold Space again while airborne. Away from a wall this spends hover energy
   on upward force; inside a valid wall capture zone it spends the same resource
   on a grind that preserves tangential entry momentum and limits falling speed.

Space is sampled as held state, so browser key repeat cannot create extra
transitions. An ollie requires a grounded hold followed by release; hover/grind
therefore requires a later repress after takeoff. Inside a valid wall zone,
grind takes precedence over hover. Landing while Space remains held begins a new
preload. Reset, pause, visibility loss, and WebGL context loss release the action.

Hover energy recharges automatically while grounded. A visible meter always
shows the current resource. Releasing Space ends hover or grind immediately and
returns control to ordinary Jolt motion; no action teleports the moped or cancels
its tangential momentum.

Preload applies downward Jolt chassis force as well as visible compression. It
grows monotonically, remains bounded, and cannot add upward velocity before
release. Hover applies the named upward force rather than promising a perfectly
stationary altitude: values above the bike's weight permit bounded ascent until
the shared meter depletes. Hover and grind consume at the same rate; any
upward-facing wheel contact begins recharge.

A grind is eligible on either side of an arena wall when the bike is airborne,
inside the capture distance, moving tangentially at least 2 m/s, and Space is
held. The latch persists inside a wider release tolerance, removes only outward
normal velocity, limits falling speed, and preserves at least 90% of tangential
speed in the automated envelope. Release, depletion, ground contact, leaving the
wall span, or losing minimum speed exits the grind. Direct airborne trick
pitch/roll controls remain deferred to preserve the simple one-action control
ceiling; ordinary steering remains available.

## Observable signals

The canonical snapshot publishes preload, hover energy, airtime, aerial phase,
grind state, accepted Space state, and the existing physical signals. Input acknowledgement is visible
within one rendered frame. Observable feedback states distinguish preload,
hover, grind, and depleted resource; one-shot event pulses distinguish ollie,
takeoff, and landing.

## Tuning budget

The open `Aerial & grind` group exposes nine semantic controls: charge time,
visible compression, minimum/maximum ollie impulse, hover force, hover duration,
ground recharge time, grind capture distance, and grind fall speed. Derived
forces and bookkeeping remain implementation details so the player-facing lab
does not accumulate interdependent low-level knobs.

## Automated proof

Focused tests cover the state/resource envelope and exact repeatability. Browser
verification must hold and release Space through the rendered surface, observe
compression and an ollie, drain hover energy while airborne, observe recharge on
the ground, and exercise a deterministic wall-grind setup without bypassing the
public runtime input/snapshot seams.

The arena walls provide 12 m of vertical clearance and have no artificial roof;
the camera follows the full simulated height. The verifier reruns route isolation,
the unchanged `/mall` tests, reduced-motion acknowledgement, configuration
backfill for old version-one saves, and one-world/one-loop teardown checks.

Handling weight, jump timing, hover generosity, grind readability, camera feel,
and fit with future authored assets remain explicit human review gates.
