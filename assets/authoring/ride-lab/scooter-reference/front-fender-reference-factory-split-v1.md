# Ride Lab front fender reference-factory split V1

## Escalation reason

The whole-fender `sculpt-a-thing` loop reached eight rejected provisional
versions (`V01` through `V08`). Whole-part iteration is frozen. `V08` remains
preserved as rejected diagnostic geometry and is not an integration candidate.

The eighth gate failed both visual and mechanical contracts:

- the crown still read as a gabled motorcycle mudguard;
- the perimeter still read as a knife edge instead of a rolled return;
- the saddle solids read as freestanding blades and floated from the shell;
- the shell intersected the accepted tire and both upper stanchions;
- the static center and shoulder gaps missed the 20--30 mm target;
- the visible center-spine endpoint chord measured 0.760440702 m instead of
  exactly 0.760 m.

No `V09` whole-fender sculpt may begin until the three packages below have
independent accepted shaded and literal-wire authorities.

## Fixed context shared by every package

- Direct parent: `wheelfront.002`.
- Axle datum: `wheelfront.001`.
- Registered local transform:
  - location `(-0.008075118, -0.002037917, 0.687800467)` m;
  - rotation XYZ `(-1.570796371, 1.261589050, 0)` rad;
  - scale `(1, 1, 1)`;
  - identity parent inverse.
- Accepted tire OD: 0.8704 m.
- Accepted tire width: 0.2750 m.
- Hard tire clearance: at least 0.015 m everywhere.
- Static design gap: 0.020--0.030 m at the defined center and shoulder samples.
- Full-bump ownership: tire, wheel, fender, lower fork legs, ears, and their
  lower-mounted brake pieces translate together by +0.080 m along the frozen
  travel axis. Upper stanchions, receivers, and apron stay fixed.
- Shared steer QA remains the V4 single-rigid-transform contract at
  -0.22, 0, and +0.22 rad.
- No rider, booster, NPR, physics, collision, handling, or gameplay-anchor work
  is in scope.

## Package A -- exterior crown, center spine, and rolled perimeter

Authority image: `front-fender-package-a-crown-roll-v1.png`.

Package A owns only the transverse exterior and its local return:

- 0.335 m outer width;
- at least 0.305 m inner tunnel clear width;
- uniform 0.0035 m skin;
- a broad, shallow, continuously rounded scooter crown;
- a local 0.007 m high by 0.032 m wide center spine that rides on the crown;
- a continuous approximately 0.008 m deep, 0.004 m radius rolled perimeter;
- a stable dark underside material region.

It does not own the fore-aft arc, endpoint chord, end cuts, or saddles. Its
acceptance artifact is an isolated transverse slice with identical fixed front,
rear, high-three-quarter, shaded, and literal-wire views.

## Package B -- longitudinal arc and distinct end transitions

Authority image: `front-fender-package-b-longitudinal-v3.png`, governed by
`front-fender-package-b-longitudinal-v3-contract.md`. The rejected V1 and V2
sheets are retained only as failure history: V1 reversed handedness and
invented terminal bosses, while V2 still left the projected outermost endpoint
chord ambiguous.

Package B owns only the side/top silhouette using Package A as a locked section:

- exactly 0.760 m projected along the frozen vehicle fore-aft axis between the
  outermost visible leading and trailing shell endpoints after registration,
  with no geometry extending beyond either dimension line;
- one production-smooth shallow scooter arc;
- a longer clean swept leading lip at vehicle front;
- a shorter tucked trailing return with a visibly different side and top plan;
- continuous rolled-edge flow inherited from Package A;
- approximately 13 silhouette stations as topology intent, redistributed where
  fixed-camera silhouette requires them.

It does not alter Package A's transverse crown or Package C's contacts. Its
acceptance artifact is an isolated longitudinal ribbon/section with fixed side,
top, high-three-quarter, shaded, and literal-wire views.

## Package C -- compact saddle and accepted V06 fork-ear contact

Authority image: `front-fender-package-c-saddle-contact-v1.png`.

Package C owns exactly two mirrored fender-owned saddle solids:

- one compact broad pad per accepted V06 fork ear;
- full-surface planar, gap-free, non-penetrating contact;
- a load path tucked inside the fork-ear envelope and joined to the underside
  return without a floating gap;
- no long freestanding bracket, blade, terminal cube, bore, drilling, or
  fastener geometry;
- a non-penetrating cosmetic cap only.

Package C must be proven first on one side against the live accepted fork ear,
then mirrored only after the through-contact section passes. Required evidence
is underside, through-contact section, installed side/high-three-quarter, and
literal-wire from identical cameras, plus static and full-bump BVH results.

## Independent promotion gates

Each package uses a fresh provisional version sequence and the
`sculpt-a-thing` loop. A package may be promoted only after:

1. the package-specific focused sheet and contract pass visual review;
2. shaded and literal-wire evidence use identical fixed cameras;
3. primary visual, second visual, and technical approvers all return `SHIP`;
4. the last accepted package version remains preserved while new provisional
   work is attempted.

Only after A, B, and C are independently accepted may they be integrated into
one production fender shell and two saddle solids. The integrated fender must
then repeat the complete tire, stanchion, apron, full-bump, shared-steer,
topology, material, naming, parent, pivot, and export validation gates.
