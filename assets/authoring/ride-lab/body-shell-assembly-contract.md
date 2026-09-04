# Ride Lab body-shell part ownership and assembly contract

Authority order: `scooter-reference/body-shell.png` is canonical for the body shell. `scooter-reference/turnaround-three-band.png` is secondary for whole-scooter stance and palette consistency. The reviewed `ride-lab-scooter.blend` is the source of truth for scale, anchors, protected seat/hoop geometry, and final integration.

## Shared assembly contract

- Axes and scale: metric meters, +X rearward, +Y scooter-left, +Z up; center plane Y=0. Existing wheelbase, ground plane, object origins, armature, and runtime anchors are immutable.
- Silhouette envelope: preserve the canonical shield rake, narrow step-through waist, straight low sill, rising rear shoulder, seat-deck clearance, wheel-arch openings, and overall left/right symmetry. No package may extend into a wheel, fender, rider, handlebar/headlamp, mechanical, or protected seat/hoop envelope.
- Shared seams and returns: front-apron to step/floor seam follows the black inner-leg-shield lip and lower shield heel; step/floor to rear-cowling seam follows the rising rear step wall and underside rocker break. The outer/upper package owns the visible exterior edge; the inner/lower package owns the hidden inward return. Returns overlap inward without coplanar faces.
- Attachment landmarks: steering-neck base, front shield heel, floorboard front and rear corners, centerline, rear wheel-arch crown, tail opening, `ANCHOR_Seat`, seat-base perimeter, hoop feet, and existing authored anchors remain fixed.
- Keep-outs: wheels/forks/fenders; steering and headlamp housing; rider and all contacts; armature, physics, collision, pivots, and gameplay anchors; rear mechanicals and exhaust; approved seat, bases, ribs, mount ears, grab hoop, feet, supports, and bolts; reserved booster volume and mount region.
- Protected anchors: all current empties and armature data, especially `ANCHOR_Seat`; all approved `SM_Scooter_Seat*` and `SM_Scooter_SeatGrabRail*` production objects in `COL_Geo_Authored` are read-only.
- Integrator: the supervisor alone resolves shared boundaries, writes approved parts into `COL_Geo_Authored`, establishes stable production names, and saves the production `.blend`. Package agents author only isolated proposal collections/files.

## Package 1 — Front apron / leg shield

- Owns: outer green shield, steering-neck transition below the excluded housing, central front-facing panel, bilateral side returns, and inward seam lips required to meet the black inner shield.
- Excludes: handlebar/headlamp housing, front fender, front wheel/fork, floorboard, step-through inner liner, rear cowling, seat/hoop, mechanicals, and rider.
- Interfaces: upper termination beneath the steering housing; lower heel to front floor transition; paired inner edge to the black leg-shield liner. Maintain the canonical forward face width, convex crown, taper, rake, and wheel/fender clearance.

## Package 2 — Step-through and floor assembly

- Owns: black inner leg shield, horizontal floorboard and tread-bearing surface, lower green rocker/sill, underside skin, and front/rear transition returns.
- Excludes: front outer apron, rear outer cowling, fenders, wheels/forks, mechanicals, seat/hoop, rider, collision, and gameplay contacts.
- Interfaces: nest behind the apron edge with an inward black return; meet rear cowls at the rising rear step wall; preserve existing footboard contact and ground clearance. The visible sill stays continuous and centered.

## Package 3 — Rear cowling assembly

- Owns: upper deck beneath the seat, mirrored green side cowls, tail opening and bezel returns, lower rear wheel-arch returns, inner seat-deck support surface, and a reserved non-occupied booster mounting region.
- Excludes: approved seat/hoop and their mounts, rear fender, rear mechanicals/exhaust, booster, lights, wheels, rider, physics, and anchors.
- Interfaces: front edge meets the rear step wall and sill return; upper deck stays below and clear of the protected seat bases and hoop feet; rear opening preserves tail/light and wheel-arch clearances. Booster region is only a clean reserved mounting face, not a booster model.

## Acceptance gates

Each package must show the focused sheet beside current shaded geometry and actual evaluated vertices/faces. It passes only when (1) its silhouette, palette, panel flow, wall thickness, openings, seams, and owned/excluded split match the canonical/focused references, and (2) its shared interfaces align without gaps, intersections, absorbed neighbor surfaces, or protected-volume violations. Only passing parts may be integrated.
