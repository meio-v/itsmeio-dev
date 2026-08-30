# Blender workflow for anchoring a rider to the Ride Lab scooter

Research date: 2026-08-30

## Outcome

The most reliable workflow is to author the rider's neutral seated pose in
Blender with a small scooter-specific control rig, then either bake that result
for glTF or reproduce only the contact-sensitive part of the solve at runtime.
The solve should be center-out:

1. establish visible pelvis-to-seat contact;
2. solve each leg independently to the floorboard with a knee pole;
3. pose the torso and head in FK;
4. solve each arm independently to a grip with an elbow pole;
5. orient each terminal hand around the grip;
6. fix clothing and body deformation;
7. accept or reject the result in fixed multi-angle views.

This is better suited to the current asset than adding more unconstrained CCD
iterations. The existing runtime reaches point targets, but neither endpoint
error nor a hip-bone-to-seat distance specifies a natural joint plane or visible
surface contact.

## What Blender establishes

The following are Blender facts, not project-specific design advice.

- An IK constraint rotates a chain of bones toward a target. `Chain Length`
  starts at the constraint owner and walks up its ancestors; `0` includes all
  ancestors. `Pole Target` determines the chain's roll, which is equivalently
  the elbow or knee position. Stretching can be disabled. IK evaluates after
  other constraints on the affected bones. [Blender IK constraint][b-ik]
- A pose bone's IK panel provides per-axis locks, stiffness, rotation limits,
  and stretch. An ordinary Limit Rotation constraint does not limit a bone that
  IK manipulates; Blender directs riggers to the bone's IK settings instead.
  [Blender IK posing][b-ik-pose] [PoseBone API][b-posebone]
  [Blender Limit Rotation][b-limit]
- `Child Of` makes an object or bone behave as if parented to a target, with an
  animatable influence. `Set Inverse` preserves an already-correct offset when
  the relationship is enabled. [Blender Child Of][b-child-of]
- `Copy Transforms` copies location, rotation, and scale from a target. Its
  owner/target spaces and mix mode are explicit; aligned or split-channel modes
  can avoid shear in some non-uniform-scale cases. [Blender Copy Transforms][b-copy]
- Constraint spaces are not interchangeable. World, pose, local, and local
  owner-orientation spaces describe different frames, and influence can be
  animated or blended. [Blender constraint spaces][b-space]
- A pose asset is a one-frame Action. Pose assets can be applied to only the
  selected bones and blended into the current pose, so full and partial rider
  poses can be reusable authoring assets. [Blender Pose Library][b-pose]
- Relative shape keys are intended for muscles, limb joints, and other
  corrective poses. Their value blends them against a reference shape and can
  be limited to a vertex group or driven. [Blender shape keys][b-shape]
  [Blender drivers][b-drivers]
- The Armature modifier's Preserve Volume option uses quaternion deformation to
  reduce volume collapse in some bends. Corrective Smooth is specifically
  intended to reduce mesh distortion after armature deformation when weighting
  alone is insufficient. [Blender Armature modifier][b-armature]
  [Blender Corrective Smooth][b-smooth]
- Bake Action can key the final visual transforms with constraints applied.
  Blender's glTF exporter supports object transforms, pose-bone transforms, and
  shape-key values as animation channels and provides sampling/baking options.
  Constraints should therefore be treated as authoring logic unless equivalent
  solver logic is implemented in the consumer. [Blender Bake Action API][b-bake]
  [Blender glTF exporter][b-gltf]

## What the repository currently does

These are observations from the current Ride Lab branch.

- [`rideLabVehicleVisual.ts`](../../app/mall/_ride-lab/rideLabVehicleVisual.ts)
  aligns the `Hips` bone origin to one seat point, applies generic local Euler
  offsets on top of captured rest quaternions, and runs a small CCD-like loop
  over the shoulders/arms and thighs/legs.
- The custom `solveChain` has no pole vector, bend-plane constraint, per-joint
  degrees of freedom, rotation bounds, or stretch/reach policy. It only rotates
  joints until the end bone approaches a point.
- The arm chains currently include the shoulder, while each leg chain includes
  the upper leg and lower leg. Terminal hands are rotated after positional IK;
  terminal feet receive no corresponding orientation pass.
- The exported rig has nontrivial, asymmetric rest orientations beneath an FBX
  normalization hierarchy. Generic mirrored Euler offsets are consequently not
  a dependable expression of a mirrored anatomical pose.
- [`CharacterPrototypeRuntime.ts`](../../app/mall/_ride-lab/CharacterPrototypeRuntime.ts)
  already provides useful anchor helpers, a deform-bone overlay, rest-pose
  restoration, and fixed front/rear/side/high camera positions.
- The `taste-v30` telemetry reports a zero hip-bone seat error, roughly 14–16 mm
  neutral hand errors, and roughly 42–44 mm neutral foot errors. The zero seat
  number does not prove that the buttocks or shorts touch the cushion because it
  measures the `Hips` bone origin, not visible mesh surfaces.
- [`scripts/build-streetwear-rider.py`](../../scripts/build-streetwear-rider.py)
  currently exports with `export_animations=False`, so no Blender-authored pose
  Action or corrective animation is delivered to Three.js today.

The conclusion that a Blender-authored base pose should replace guessed
symmetric Euler values is a repository-specific inference, not a Blender rule.

## Recommended Blender pilot

Everything in this section is an implementation recommendation inferred from
the cited Blender capabilities.

### 1. Put the actual scooter and actual rider in one authoring scene

Import the production scooter and `streetwear-rider.glb` without manually
normalizing their bones. Preserve the current node names and bind pose. Build a
non-deforming control layer around the existing 45-bone deform rig rather than
renaming or replacing the deform skeleton.

Create these controls:

```text
scooter_root
├── seat_contact
├── foot.L_contact
├── foot.R_contact
└── handlebar_steer
    ├── grip.L_contact
    └── grip.R_contact

rider controls
├── rider_root / pelvis_ctrl
├── foot.L_ik + knee.L_pole
├── foot.R_ik + knee.R_pole
├── wrist.L_ik + elbow.L_pole
└── wrist.R_ik + elbow.R_pole
```

The grip controls should inherit the handlebar's steering transform. Seat and
footboard controls should inherit the scooter body. Use simple Empty objects or
non-deforming control bones. Give each contact control a meaningful orientation,
not just a location: the seat normal, board plane, and grip axis will later
drive pelvis, foot, and hand orientation.

### 2. Define the rider triangle as surfaces and frames

The rider triangle is the pelvis/seat, two wrists/grips, and two soles/board
relationship. It should be authored before fine posing.

Do not represent the seat with only the `Hips` origin. Add two visible contact
landmarks on the shorts/body underside, or a small non-rendered pelvis contact
plane, and compare those with the cushion surface. Similarly, use sole contact
landmarks rather than the `LeftFoot`/`RightFoot` bone origins alone. This is an
inference: Blender's targets constrain origins, while visible geometry can have
an arbitrary offset from those origins.

### 3. Configure the limb IK chains

- Put leg IK on each lower-leg bone with `Chain Length = 2`, reaching an ankle
  target. This limits the solve to thigh and shin and prevents the pelvis from
  being dragged off the seat. Set IK Stretch to zero unless the art direction
  explicitly accepts limb scaling.
- Put each knee pole slightly forward and outboard in the intended bend plane.
  Begin with a visibly pre-bent knee, then tune `Pole Angle` so the knee faces
  the pole without flipping.
- Put arm IK on each forearm with `Chain Length = 2`, reaching a wrist target.
  Keep shoulder/clavicle posture in FK unless reach testing proves it needs a
  controlled additional degree of freedom.
- Put elbow poles slightly down/back and outboard for a relaxed scooter posture.
  Begin with bent elbows, then tune `Pole Angle` independently on left and right.
- Set bone IK locks/limits/stiffness in each bone's own local axes. Do not copy
  numeric X/Y/Z limits from one side to the other until the local bone axes have
  been inspected; this rig's rest orientations are asymmetric.
- Orient the terminal foot to the board plane and the terminal hand to the grip
  frame separately from the two-bone positional solve. A Copy Rotation or Copy
  Transforms constraint on the terminal bone/control is suitable when its spaces
  are deliberately chosen. This keeps a correct wrist position from implying an
  arbitrary palm roll.

For a static mounted pose, the IK targets may simply be parented to the scooter
controls. For mounting/dismounting or switching a hand between free and gripped,
use `Child Of`, call `Set Inverse` at the intended handoff pose, and animate the
constraint influence.

## Primary game-development evidence and translation

Blender remains the concrete implementation below. These additional primary
sources show that the proposed levers and solve order also appear in published
IK work and production game-animation systems.

| Production source or technique | Documented lever | Blender equivalent | Exact scooter use | Runtime implication |
| --- | --- | --- | --- | --- |
| Aristidou and Lasenby's original FABRIK paper | Iterative forward/backward reaching operates on joint positions and describes constraints and multiple-chain cases. [FABRIK paper][p-fabrik] | IK target, finite chain, iterations, pole, and Bone IK limits | Reach each wrist and ankle without allowing its chain to consume the pelvis | A positional iterative solver still needs explicit joint/bend constraints; increasing passes alone does not define a natural pose. |
| Ubisoft's *In Your Hands* GDC 2015 production talk | The weapon stack applies body/additive motion and then resolves both hands with two-bone IK in a later animation pass. [Ubisoft GDC slides][g-ubisoft] | Pose root/torso first; run two-bone arm IK afterward | Complete pelvis/spine/chest posture before solving wrists to the handlebar | Preserve this order in `update`: base pose and steering-body modifications first, contact IK second, terminal hand roll last. |
| Unreal Control Rig Full-Body IK | Effectors have independent position/rotation strengths; bones expose stiffness, limits, and preferred angles; the root can be pinned to input. [Unreal FBIK][u-fbik] | Separate IK targets, Bone IK limits/stiffness, poles/pre-bend, and fixed `HipsCtrl` ownership | Pin seat contact while hands and feet reach; give knees/elbows a preferred plane | A multi-effector runtime solver must explicitly keep the pelvis fixed or highly stiff. Contact goals alone should not redistribute error through the whole rider. |
| Unreal IK Rig limb solver | Hinge axis, reach precision, max iterations, joint angle limit, and twist correction are separate settings. [Unreal IK solvers][u-solvers] | Pole target/angle, Blender Bone IK limits, IK iterations, terminal Copy Rotation | Keep knee/elbow hinge direction independent from endpoint precision and hand/foot roll | Position tolerance, bend plane, joint bounds, and twist are separate runtime responsibilities and should have separate telemetry. |
| Unity Animation Rigging Two Bone IK | A two-bone constraint has a target and a hint, with separate target-position, target-rotation, and hint weights. [Unity Two Bone IK API][y-two-bone] | Target, Pole Target, IK influence/use rotation, terminal Copy Rotation | Treat knee/elbow poles as first-class controls; do not let palm/sole rotation be an accidental by-product of reaching | A custom Three.js two-bone solver can expose the same semantic inputs even if `CCDIKSolver` does not. |
| Unity Multi-Parent Constraint | A constrained object can follow one or more source transforms with weights without changing the hierarchy. [Unity Multi-Parent][y-parent] | `Child Of` constraints with animated Influence | Switch a wrist between free motion and a grip, or attach an ankle target to the board | Runtime space switching needs offset-preserving parent transforms or blending; it is separate from limb IK. |
| Three.js `CCDIKSolver` | CCD links support axis limitation, Euler min/max rotation, iterations, step angles, and blend. No pole target is documented. [Three.js CCDIKSolver][t-ccd] | Blender IK is the authoring reference; link limits approximate only part of it | Use CCD only for small moving-contact correction around an already approved bent pose | For deterministic knees/elbows, add pole-plane logic or use an analytical two-bone solve rather than relying on CCD convergence. |

The production inference is consistent across the sources: solve a credible base
pose first, partition the contact chains, state preferred bend direction and
joint limits explicitly, and apply contact IK after upstream body motion.

## Exact Blender recipe cards

The **Documented operation** column describes Blender behavior from the linked
manual/API. The **Ride Lab recipe** column contains inferred control names and
starting values for this scooter. Those values are proposals to validate, not
Blender defaults.

### Pelvis and visible seat contact

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | Constraints can be placed on pose bones and target objects; their owner/target spaces determine how transforms are interpreted. [Constraint spaces][b-space] | In Pose Mode select existing control bone `HipsCtrl` under `Root`. Do not select or directly move the deform `Hips` bone for global placement. |
| Required control | `Child Of` makes the owner follow an object/bone target; `Set Inverse` preserves the owner's current world placement. [Child Of][b-child-of] | Create Empty `SCOOTER_SeatContact`, parent it to the scooter body, and orient its local Z to the cushion normal. Add two non-rendered mesh landmarks `CONTACT_Butt.L/R` on the underside of body/shorts for validation. |
| Key fields | `Target`, affected Location/Rotation/Scale axes, `Set Inverse`, `Influence`; normally keep all transform channels enabled. | Bone Constraints > Add Bone Constraint > **Child Of**. Target `SCOOTER_SeatContact`; all axes on; Influence `1.0`. Position the rider visibly first, then click **Set Inverse** so enabling the relationship does not jump the rider. |
| Ordered setup | The target must exist; adding Child Of changes the owner's parent space unless its inverse is set. | 1. Put scooter and rider at production scale. 2. Move/rotate `HipsCtrl` until both visible butt landmarks rest on the front half of the cushion. 3. Add Child Of. 4. Set Target. 5. Click Set Inverse while the visible pose is correct. 6. Move/rotate scooter root to verify attachment. |
| Visible effect | Influence `1` fully applies the relationship; `0` disables it; values between interpolate. Clearing inverse removes the preserved offset. | Lowering Influence releases the rider toward its unconstrained pose. Clearing inverse will usually snap `HipsCtrl` to the seat control's frame; use this only when intentionally rebuilding the offset. |
| Common failure and recovery | Wrong owner/target space or an unset inverse causes snapping; Child Of should not be used to build a connected bone chain. | If the rider jumps, undo, disable other constraints on `HipsCtrl`, restore the approved world pose, then click Set Inverse once. If the butt still floats while `HipsCtrl` is aligned, move the visible contact landmarks/body relative to the hip or revise the seat offset; do not call the hip-origin metric “contact.” |
| Fixed-view acceptance | — | Both side profiles: no daylight between shorts/body and cushion. Elevated three-quarter: contact occurs on the intended seat region. Front/rear: pelvis is centered and not rolled. Scooter-root motion: contact remains invariant. |

### Left and right legs, knee direction, and planted feet

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | An IK constraint on an owner bone affects that bone and the configured number of ancestors. A Pole Target controls chain roll/knee direction. [IK constraint][b-ik] | Pose Mode: select `LeftLeg` for the left setup and `RightLeg` for the right. Do one side completely, then repeat with side-specific controls. |
| Required controls | IK needs a Target; a Pole Target plus Pole Angle defines bend-plane orientation. The API fields are `target`, `pole_target`, `chain_count`, `pole_angle`, `iterations`, `use_stretch`, and `use_rotation`. [KinematicConstraint API][b-ik-api] | Create `CTL_Ankle.L/R` and `Pole_Knee.L/R`. Create scooter-body children `SCOOTER_Foot.L/R`. Give each board contact the sole-plane orientation. Parent or Child-Of each ankle control to its board contact. Place knee poles forward and slightly outboard. |
| Key IK fields | `Target`, `Pole Target`, `Chain Length`, `Pole Angle`, `Iterations`, `Use Tail`, `Stretch`, and optionally target Rotation. | On `LeftLeg`/`RightLeg`: Target corresponding `CTL_Ankle`; Pole Target corresponding `Pole_Knee`; Chain Length `2`; Stretch off; initial Iterations `16`; use target Rotation off for the leg solve. Tune each Pole Angle separately; do not assume `0` or mirrored signs. |
| Bone-limit fields | IK-driven bones use Bone Properties > Inverse Kinematics locks, stiffness, and limits; a Limit Rotation constraint does not govern them. [Bone IK panel][b-ik-pose] [PoseBone API][b-posebone] [Limit Rotation][b-limit] | Inspect local axes on `LeftUpLeg`, `LeftLeg`, `RightUpLeg`, `RightLeg`. Lock axes that are not anatomical hinge/twist axes, enable the appropriate `use_ik_limit_*`, and set `ik_min_*`/`ik_max_*` around the approved range. Start from the approved neutral bend plus roughly 15–25 degrees of required steering/pose margin, then test; do not mirror axis numbers blindly. Set `ik_stretch = 0`. |
| Terminal foot orientation | A Copy Rotation/Copy Transforms constraint can copy a target's orientation in specified spaces. [Copy Rotation][b-copy-rotation] | On `LeftFoot`/`RightFoot`, add Copy Rotation targeting `SCOOTER_Foot.L/R`. Start Target Space = World, Owner Space = World, Mix = Replace; rotate the contact Empty, not the deform bone, to calibrate the sole. If the rest axes introduce offset, add an intermediate `CTL_FootOrient.L/R` and put the offset there. |
| Ordered setup | — | 1. Approve pass-1 pelvis. 2. Pre-bend each knee in FK. 3. Place ankle target on board. 4. Place knee pole. 5. Add two-bone IK. 6. Tune Pole Angle. 7. Set IK-specific axis locks/limits. 8. Add terminal foot orientation. 9. Test neutral and both steering extremes. |
| Visible effect | Moving Target changes endpoint reach; moving Pole Target rotates the chain plane; Pole Angle offsets that plane; higher Iterations can improve convergence but does not define anatomy; Stretch permits bone scale. | Moving `Pole_Knee` forward moves the knee forward without moving the ankle goal. Moving it outward opens stance. Bad Pole Angle flips/twists the knee. Rotation on the foot contact changes sole pitch/roll without authorizing the thigh chain to move the pelvis. |
| Common failure and recovery | Chain Length `0` includes all ancestors; wrong pole placement or a straight initial chain is ambiguous; ordinary Limit Rotation is ignored by IK bones. | If pelvis moves, set Chain Length back to `2` and restore pass 1. If knee flips, disable IK Influence, restore a pre-bent pose, move the pole away from the chain line, retune Pole Angle, then re-enable. If a limit seems ineffective, remove/ignore Limit Rotation and edit the Bone IK panel instead. `Alt-R` clears a selected pose bone rotation when rebuilding the pre-bend. |
| Fixed-view acceptance | — | Profiles: knees descend forward and feet sit on board. Front/rear: knees are slightly outboard and symmetric by intent, not by Euler number. High view: soles do not cross or penetrate the leg shield. All views: no visible stretch and seat contact changes no more than 2 mm. |

### Spine, chest, neck, and head in FK

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | Pose Mode transforms operate on pose bones; Clear Transform restores location/rotation/scale channels. [Blender pose clear][b-clear] | Select in order `Spine`, `Chest`, `UpperChest`, `Neck`, `Head`; treat `LeftShoulder`/`RightShoulder` as the final FK shoulder controls of this pass. |
| Required control | No IK target is required for an authored neutral torso. A pose asset can later store the result. [Pose Library][b-pose] | Use Local transform orientation and the actual bone axes. Keep `HipsCtrl`, `Hips`, both legs, and all scooter contacts locked/unselected. |
| Key fields | Pose bone rotation mode and rotation channels; no constraint fields are required. | Start with a small forward lumbar/chest pitch distributed across `Spine` and `Chest`, then compensate minimally at `Neck`/`Head`. Keep shoulder protraction in `LeftShoulder`/`RightShoulder`; do not reach the bar yet. |
| Ordered setup | — | 1. Lock/approve pelvis and legs. 2. Rotate `Spine`, then `Chest`, then `UpperChest` in local axes. 3. Set neck/head gaze. 4. Place shoulders for relaxed reach origin. 5. Check gameplay camera. 6. Only then start arm IK. |
| Visible effect | FK changes propagate to descendants, so torso edits move shoulder origins and invalidate prior arm contact. | More chest pitch shortens the apparent grip reach but can make the rider collapse. More head counter-rotation keeps gaze level but can kink the neck. Shoulder FK changes elbow reach without sacrificing seat contact. |
| Common failure and recovery | Clearing a pose bone's rotation returns that channel to its unposed value. | If posture becomes cumulative or twisted, select only the failing bone and `Alt-R`, then rebuild center-out. Never repair grip reach by translating `HipsCtrl` after seat approval. Any torso edit requires rerunning both arm solves. |
| Fixed-view acceptance | — | Profiles: one readable forward arc, no collapsed abdomen. Front/rear: shoulders and head sit over the pelvis. High/gameplay: hoodie/head silhouette stays readable and does not hide handlebar contact. |

### Left and right arms, elbow poles, and terminal hands

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | Chain Length counts from the IK owner upward; Pole Target defines elbow direction. [IK constraint][b-ik] | Select `LeftForeArm` and later `RightForeArm`. Keep `LeftShoulder`/`RightShoulder` out of the IK chain by using Chain Length `2`; their FK pose belongs to the torso pass. |
| Required controls | Same Target/Pole mechanism as the legs. Separate target position and terminal orientation is also reflected in Unity's documented position/rotation weights. [Unity Two Bone IK API][y-two-bone] | Create `CTL_Wrist.L/R`, `Pole_Elbow.L/R`, and grip-frame objects `SCOOTER_Grip.L/R` parented to the steering handlebar. Child-Of each wrist control to its grip. Put elbow poles down/back and slightly outboard. |
| Key fields | `Target`, `Pole Target`, `Chain Length`, `Pole Angle`, `Iterations`, `Stretch`, IK-specific bone limits. | On each forearm: Target corresponding wrist control; Pole corresponding elbow control; Chain Length `2`; Stretch off; initial Iterations `16`; target Rotation off. Tune Pole Angle independently. Set Bone IK locks/limits on upper arm and forearm in their real local axes. |
| Terminal hand fields | Copy Rotation copies target orientation with selectable axes, mix mode, and spaces. [Copy Rotation][b-copy-rotation] | On `LeftHand`/`RightHand`, Copy Rotation from `SCOOTER_Grip.L/R`; begin World-to-World, Replace. Calibrate an intermediate hand-orientation control so the palm faces the grip and fingers wrap around its axis. Do not hard-code mirrored `±π/2` until both bone spaces have been verified. |
| Ordered setup | — | 1. Approve torso. 2. Pre-bend one elbow. 3. Place wrist control at grip. 4. Place pole. 5. Add two-bone IK. 6. Tune pole and IK limits. 7. Add hand orientation. 8. Repeat other side. 9. Rotate handlebar through full steering range. |
| Visible effect | Target moves wrist; Pole Target changes elbow plane; terminal Copy Rotation rolls the palm without changing the wrist origin. | Moving elbow pole out opens the silhouette; moving back/down relaxes the arm. Rotating grip frame aligns palm/fingers. More IK iterations reduces endpoint residual but cannot cure a wrong pole or shoulder pose. |
| Common failure and recovery | Pole ambiguity and wrong spaces cause flips; constraints on connected bones can interact with inherited parent transforms. | If elbow flips, disable IK, restore pre-bend, move pole away from shoulder–wrist line, retune Pole Angle. If palm rotates around the wrong axis, disable Copy Rotation Influence, restore hand with `Alt-R`, insert/rotate an intermediate orientation control, then re-enable. If reach needs the shoulder, return to pass 3 rather than changing Chain Length to `3` silently. |
| Fixed-view acceptance | — | Front/rear: elbows remain outside torso. Profiles: wrists are not hyperflexed. High view: palms overlap grips. Neutral/left/right steering: no elbow inversion, shoulder jump, wrist detachment, or bar-through-hand penetration. |

### Contact parenting and attach/detach behavior

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | `Child Of` is intended for parent-like following and has animatable Influence; it is not a replacement for connected armature chains. [Child Of][b-child-of] | Select control bones `HipsCtrl`, `CTL_Ankle.L/R`, or `CTL_Wrist.L/R`, never the deform limb chain itself. |
| Required targets | Target can be an object or bone. `Set Inverse` preserves current placement. | Seat target is `SCOOTER_SeatContact`; ankles target `SCOOTER_Foot.L/R`; wrists target `SCOOTER_Grip.L/R`. Grip targets are children of handlebar steering; others are children of scooter body. |
| Key fields | Target, transform-axis toggles, Set/Clear Inverse, Influence. | Enable all channels initially. At the exact handoff pose, set the target and click Set Inverse. Key Influence `0` one frame before attach and `1` at/after attach only if a transition is needed. |
| Ordered setup | — | 1. Pose control at desired contact. 2. Add Child Of. 3. Assign target. 4. Disable unrelated constraints. 5. Set Inverse once. 6. Re-enable stack. 7. Scrub Influence. 8. Verify no pop. |
| Visible effect | Influence interpolates parent effect; Clear Inverse removes stored offset. | Wrist follows handlebar as it steers; ankle stays on body-relative board; pelvis follows body/seat. A free hand uses Influence `0`. |
| Common failure and recovery | Multiple active parents can blend or conflict; Set Inverse with other constraints active can preserve an unintended evaluated transform. | If contact pops, return Influence to `0`, restore the control's approved world transform, mute other Child Of constraints, Set Inverse on the intended target, then blend. If two contacts fight, inspect which control owns each Child Of—never put competing parents on the same deform bone. |
| Fixed-view acceptance | — | Animate/rotate scooter body and handlebar. Contact controls remain attached in all views; attach/detach has no single-frame pop; upstream seat remains fixed while wrists steer. |

### Corrective deformation and clothing contact

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | Armature deformation uses vertex groups; Preserve Volume can reduce bend collapse. Corrective Smooth is normally placed after Armature to reduce residual joint distortion. [Armature modifier][b-armature] [Corrective Smooth][b-smooth] | Inspect exact meshes `streetwear-body`, `streetwear-cargo-shorts`, `streetwear-hoodie`, calves, and shoes in that order. Correct weights before adding correctives. |
| Required data | Relative shape keys store a shape relative to Basis/reference, have a Value, and can be restricted with a Vertex Group; Value is keyable/drivable. [Shape Keys][b-shape] [Shape Key panel][b-shape-panel] | Add localized vertex groups `Corrective_Seat`, `Corrective_Knee.L/R`, `Corrective_Elbow.L/R`, `Corrective_Wrist.L/R`. Proposed keys: `SeatCompression`, `KneeBend.L/R`, `ElbowBend.L/R`, `GripWrist.L/R`. |
| Key fields | Armature `Preserve Volume`; Corrective Smooth Factor, Repeat, Vertex Group, Rest Source; shape-key `Value`, `Vertex Group`, `Relative To`; driver variable transform channel/space. [Drivers][b-drivers] | Try Preserve Volume per mesh, not globally by assumption. Put Corrective Smooth after Armature and restrict it to the failing region. For a shape key, add Basis then named relative key, assign its corrective vertex group, sculpt/edit the smallest region, and drive or key Value from 0 to 1. |
| Ordered setup | — | 1. Freeze approved bones. 2. Fix vertex weights. 3. Compare Preserve Volume off/on. 4. Add localized Corrective Smooth only where broad collapse remains. 5. Add a relative key only for pose-specific shape. 6. Right-click Value > Add Driver or key it. 7. Use the actual local joint rotation/custom property as driver input. 8. Recheck every camera. |
| Visible effect | Higher shape-key Value blends toward corrective; Corrective Smooth factor/repeat increases smoothing and may lose volume; Preserve Volume changes armature interpolation. | `SeatCompression` should remove a gap/rigid shorts shelf without moving bones. Knee/elbow keys restore folds and volume. Wrist key prevents sleeve/palm collapse at the grip. |
| Common failure and recovery | Excess Corrective Smooth distorts or shrinks; wrong modifier order/rest source gives unexpected results; replacing Basis changes relative offsets. | Toggle the newest modifier/key off to isolate it. If topology/Basis changed, restore the pre-corrective mesh; do not keep sculpting against a moving reference. If a key fixes only one camera, reduce its vertex group/value or delete and recreate it. Never let a corrective conceal wrong seat or joint placement. |
| Fixed-view acceptance | — | Compare each corrective at Value `0` and `1` in all fixed views. It must improve the target region without adding a new gap, penetration, silhouette lump, or triangle/topology change. |

### Save poses, bake constraints, and export

| Item | Documented operation | Ride Lab recipe |
| --- | --- | --- |
| Select | Pose assets are one-frame Actions created from the current values of selected pose bones and can be applied/blended from the Asset Shelf. [Pose Library][b-pose] | Pose Mode: select only the deform bones required by the asset. Full asset: all runtime deform bones. Partial assets: legs only, torso/head only, or one hand. Keep controls out unless the `.blend` library needs them for authoring. |
| Save operation | Pose menu/Action Editor exposes Create Pose Asset; assets can have names, previews, and catalogs. | Create `RideLab/ScooterIdle`, then optional `ScooterLegs`, `ScooterTorso`, `Grip.L`, `Grip.R`. Render previews from the fixed three-quarter camera. Reapply each asset to a clean duplicate before trusting it. |
| Bake operation | `bpy.ops.nla.bake` can bake final transforms with constraints applied using `visual_keying=True`; clearing constraints is optional and should be combined with visual keying. [Bake Action API][b-bake] | Duplicate the armature and meshes for export. Select deform bones. For a static pilot use frame 1 to 1, Step 1, Only Selected on, Visual Keying on, Pose bake. On the disposable export duplicate, Clear Constraints may be on; on the authoring rig keep it off. API equivalent: `bpy.ops.nla.bake(frame_start=1, frame_end=1, step=1, only_selected=True, visual_keying=True, clear_constraints=False, bake_types={'POSE'})`. |
| Shape-key bake | glTF animation supports pose-bone transforms and shape-key values; exporter sampling/bake options determine evaluated channels. [glTF exporter][b-gltf] | Key required shape-key Values on the same export frame/action context. For steering poses, use explicit frames/Actions (`Idle`, `TurnLeft`, `TurnRight`, `Accelerate`) and reset unkeyed bones/keys between actions. |
| Export fields | Blender's glTF exporter includes Animation settings, sampling, armature Actions, and shape-key animation. | Change the pilot path corresponding to current `export_animations=False` to an isolated test export with animations enabled; do not alter production until GLB reimport and Three.js validation pass. Export only deform skeleton/meshes and the baked Actions, not helper empties unless runtime metadata needs them. |
| Visible effect | Baking records evaluated visual transforms; exporting loads them as glTF animation channels. | The Three.js rider should reproduce the Blender frame before custom runtime lean/steer offsets. This produces calibrated local quaternions instead of guessed symmetric Eulers. |
| Common failure and recovery | Clearing constraints is destructive; incomplete bone/key selection omits channels; unreset actions can leak values. | Always bake on a duplicate or saved copy. If export differs, reimport GLB into a clean Blender file, compare frame 1, inspect omitted bone/shape tracks, and rebake with selected deform bones plus Visual Keying. Preserve the control-rig `.blend` as source of truth. |
| Fixed-view acceptance | — | Render the reimported GLB and the Three.js page in the identical rear/front/profiles/high/gameplay cameras. Reject if any contact landmark moves beyond tolerance, any pole plane flips, or any corrective value is missing. |

## Bounded solve passes

This decomposition is a proposed production protocol, not a sequence mandated
by Blender. It is intentionally strict so it can later become a reusable skill.

### Pass 1 — pelvis/root and visible seat contact

**May read:** scooter/root transform, cushion surface and normal,
`seat_contact`, rest pose, pelvis/shorts contact landmarks, rider scale.

**May write:** rider master/root placement, `HipsCtrl` or pelvis control,
pelvis tilt, and only the pelvis-contact control relationship.

**Must preserve:** bind skeleton, rider scale, scooter anchors, limb lengths,
and left/right character naming.

**Gate:** approve only when the visible underside of the body/shorts rests on
the intended cushion region without daylight or obvious penetration in both
side profiles and the elevated three-quarter view. A zero `Hips`-origin error is
not sufficient.

**Rollback:** restore this pass if any later solve moves the rider root, changes
the cushion anchor, or changes visible seat clearance beyond tolerance. Limb IK
must never include `Hips` or an ancestor of `Hips`.

### Pass 2 — independent legs, knee poles, and footboard contact

**May read:** approved pelvis/root, thigh/shin lengths and local axes, left/right
board frames, shoe sole landmarks, scooter leg-shield clearance.

**May write:** the left thigh/shin/foot and left knee pole, or the equivalent
right-side set. Solve and approve the sides independently before judging them
together.

**Must preserve:** pass-1 rider root and visible seat contact; the opposite leg;
bone lengths; the footboard and seat controls.

**Gate:** each sole reads as planted on the board; knees remain forward/outboard,
do not invert through the body, clear the leg shield, and do not force thigh or
shorts penetration. Reject a solution that reaches the ankle target by twisting
the knee out of its authored plane.

**Downstream invalidation:** torso and arm passes must not change leg bones.
Corrective clothing can alter visible thigh/seat clearance, so pass 6 must rerun
the visual (not skeletal) leg and seat gates.

### Pass 3 — spine, chest, and head posture

**May read:** approved seat and leg pose, grip reach envelope, gameplay camera,
head/hoodie silhouette, shoulder positions.

**May write:** `Spine`, `Chest`, `UpperChest`, `Neck`, `Head`, and FK
shoulder/clavicle controls.

**Must preserve:** pelvis transform, both leg solves, all scooter anchors, and
head scale. The torso should not compensate for unreachable grips by moving the
approved pelvis.

**Gate:** rider looks supported rather than hovering or collapsing; torso has a
slight deliberate forward pitch, the neck remains readable, and the head does
not counter-rotate into an anatomically broken line.

**Downstream invalidation:** this pass deliberately changes shoulder origins, so
it invalidates any arm solve performed earlier. It must therefore precede arms.

### Pass 4 — independent arms and elbow poles

**May read:** approved chest/shoulders, current left/right grip positions,
upper-arm/forearm lengths and axes, handlebar steering range.

**May write:** one upper arm, forearm, wrist target, and elbow pole at a time.
Shoulders remain owned by pass 3.

**Must preserve:** pelvis, legs, spine/chest/head, opposite arm, scooter and grip
controls, and bone lengths.

**Gate:** wrist origin reaches the grip while the elbow remains relaxed,
unlocked-looking, and on the intended side of the torso. Check neutral and both
steering extremes. Reject elbow inversion, upper-arm torso clipping, or a solve
that needs shoulder movement outside pass 3's approved envelope.

**Downstream invalidation:** hand orientation may change the visible wrist/palm
silhouette but must not move the wrist origin or arm chain.

### Pass 5 — terminal hand/wrist orientation

**May read:** approved arm solve, grip position/orientation, hand local axes,
palm/finger mesh, handlebar diameter.

**May write:** `LeftHand` or `RightHand` rotation and finger pose/corrective
controls. Do not write the upper arm or forearm.

**Must preserve:** wrist origin-to-grip contact and every upstream joint plane.

**Gate:** palm wraps the grip rather than hanging beneath it; wrist remains near
neutral, left/right hands use their actual local axes, and steering does not
cause roll flips or detach the visible palm.

**Rollback:** reject the hand orientation if it changes wrist-origin error,
forces forearm compensation, or penetrates the bar. Return to the last approved
hand transform, not the whole body pose.

### Pass 6 — corrective clothing and shape-key deformation

**May read:** final skeleton pose, body/hoodie/shorts/shoe weights, seat and
scooter surfaces, all fixed views.

**May write:** weight painting, Preserve Volume choice, localized Corrective
Smooth settings, and relative shape keys for butt/shorts compression, hip and
knee folds, elbows, sleeves, and wrists.

**Must preserve:** all bone transforms, target controls, bone names, bind
hierarchy, mesh topology if existing shape keys must remain valid, and runtime
triangle budget.

**Gate:** no joint collapse, candy-wrapper twisting, seat/shorts gap, or new
scooter clipping. A corrective may change visible surface contact but must never
be used to disguise a materially wrong skeleton pose.

**Rollback:** disable the newest modifier/shape key and compare. Reject it if it
fixes one view by creating a worse silhouette or penetration in another.

### Pass 7 — fixed-view validation

**May read:** everything. **May write:** evidence captures and measurements only.

Validate idle, left steer, right steer, acceleration tuck, and brake/preload in
rear, front, left profile, right profile, elevated three-quarter, and the actual
gameplay camera. This pass never edits bones. A failure returns to the smallest
owning pass: seat to 1, knee/sole to 2, posture to 3, elbow/reach to 4, palm to
5, deformation to 6.

## Proposed acceptance gates

These thresholds are project recommendations and should be calibrated against
the model scale after the Blender pilot. They are not Blender defaults.

| Gate | Proposed check |
| --- | --- |
| Seat | Two visible pelvis/shorts samples lie within 15 mm of the cushion, with no clearly visible air gap and no more than 10 mm penetration. |
| Feet | Each sole plane is within 10 mm of the floorboard and roughly parallel to it; ankle target error is at most 20 mm. |
| Hands | Wrist target error is at most 20 mm; palm/grip angular mismatch is at most 15 degrees; palm visibly overlaps the grip without bar penetration through the wrist. |
| Bend plane | Knee and elbow remain on the same intended side of the pole plane across all tested states; no frame-to-frame flip. |
| Joint limits | No hyperextension, inward knee collapse, elbow inversion, or visible limb stretch. |
| Upstream stability | Solving a downstream pass changes approved upstream contact positions by at most 2 mm. |
| Silhouette | Left/right profiles show seated weight, front/rear show deliberate limb spacing, elevated view shows cushion and board contact, gameplay view remains the final taste authority. |

Quantitative gates should be sampled from mesh contact landmarks as well as bone
origins. The current telemetry can remain, but `seatErrorMeters` should not be
the only seat acceptance signal.

## Export and Three.js strategy

### Recommended first delivery: Blender-authored base pose plus bounded runtime motion

1. Keep the complete control rig and scooter controls in the authoring `.blend`.
2. Save `ScooterIdle` as a pose asset, plus optional partial assets such as
   `ScooterLegs`, `ScooterTorso`, `Grip.L`, and `Grip.R`.
3. Bake the evaluated deform-bone transforms with Visual Keying to a one-frame
   or short Action. Export that Action and any required shape-key values to a
   pilot GLB.
4. In Three.js, treat those baked local bone transforms as the calibrated base,
   then add small steering, lean, tuck, and suspension variations. Avoid
   reconstructing the base pose from assumed symmetric Euler offsets.
5. Keep runtime contact solves only where anchors actually move: grips under
   steering and possibly feet if suspension/body presentation changes their
   relative frame.

Blender constraints, pole controls, and `Child Of` relationships are not a
portable runtime control rig merely because the mesh is exported. Bake their
evaluated pose or implement equivalent logic explicitly.

### If runtime IK remains necessary

Three.js provides `CCDIKSolver` for a `SkinnedMesh`. Its link schema exposes a
single-axis limitation, Euler rotation minima/maxima, iteration count, per-step
angle bounds, and blend factor, but no documented Blender-style pole target.
[Three.js CCDIKSolver][t-ccd] The absence of a pole field is also visible in the
official solver source. [Three.js CCD source][t-ccd-source]

Therefore:

- Seed CCD from the approved, pre-bent Blender pose every update rather than an
  arbitrary or previous-frame twisted pose.
- Apply calibrated per-link limits in each bone's real local frame.
- Keep each leg at two links and each arm at two links; do not let a reach solve
  consume pelvis or spine ownership.
- For deterministic knee/elbow direction, implement an explicit two-bone
  pole-plane solve or a pole correction pass. CCD limits alone can reduce bad
  solutions but are not the same semantic control as Blender's pole target.
- Solve position before terminal orientation, and recheck positional contact
  after orientation.

Three.js `SkinnedMesh` represents the loaded skeleton and skin weights, and
`GLTFLoader` returns exported animation clips. Those are the appropriate runtime
carriers for baked pose-bone and morph-target animation. [Three.js SkinnedMesh][t-skin]
[Three.js GLTFLoader][t-gltf]

## Lowest-risk next experiment

Build only the neutral-pose Blender pilot first. Do not start with live steering.
Place the visible seat contact, solve two legs with poles, pose the torso, solve
two arms with poles, orient the hands, and render the same fixed views already
used by `CharacterPrototypeRuntime`. Export one baked frame and compare it with
the current runtime pose. Proceed to live grip targets only if that pilot passes
the multi-angle gates and preserves the existing 45-bone hierarchy.

This experiment answers the central question cheaply: whether the visual
problem is the solver, the authored base pose, or deformation. Current evidence
suggests it is all three, in that order.

## Primary sources

- [Blender Manual: Inverse Kinematics constraint][b-ik]
- [Blender Python API: KinematicConstraint fields][b-ik-api]
- [Blender Python API: PoseBone IK fields][b-posebone]
- [Blender Manual: Inverse Kinematics posing and Bone IK panel][b-ik-pose]
- [Blender Manual: Limit Rotation constraint][b-limit]
- [Blender Manual: Child Of constraint][b-child-of]
- [Blender Manual: Copy Transforms constraint][b-copy]
- [Blender Manual: Copy Rotation constraint][b-copy-rotation]
- [Blender Manual: common constraint spaces and influence][b-space]
- [Blender Manual: Clear Pose Transforms][b-clear]
- [Blender Manual: Pose Library][b-pose]
- [Blender Manual: Shape Keys introduction][b-shape]
- [Blender Manual: Shape Keys panel][b-shape-panel]
- [Blender Manual: Drivers][b-drivers]
- [Blender Manual: Armature modifier][b-armature]
- [Blender Manual: Corrective Smooth modifier][b-smooth]
- [Blender Python API: Bake Action (`bpy.ops.nla.bake`)][b-bake]
- [Official glTF-Blender-IO exporter documentation][b-gltf]
- [Aristidou and Lasenby: original FABRIK paper][p-fabrik]
- [Ubisoft GDC 2015: *In Your Hands*][g-ubisoft]
- [Epic documentation: Control Rig Full-Body IK][u-fbik]
- [Epic documentation: IK Rig solvers][u-solvers]
- [Unity Animation Rigging API: Two Bone IK data][y-two-bone]
- [Unity Animation Rigging Manual: Multi-Parent Constraint][y-parent]
- [Three.js documentation: CCDIKSolver][t-ccd]
- [Three.js source: CCDIKSolver][t-ccd-source]
- [Three.js documentation: SkinnedMesh][t-skin]
- [Three.js documentation: GLTFLoader][t-gltf]

[b-ik]: https://docs.blender.org/manual/en/latest/animation/constraints/tracking/ik_solver.html
[b-ik-api]: https://docs.blender.org/api/5.2/bpy.types.KinematicConstraint.html
[b-posebone]: https://docs.blender.org/api/5.2/bpy.types.PoseBone.html
[b-ik-pose]: https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html
[b-limit]: https://docs.blender.org/manual/en/latest/animation/constraints/transform/limit_rotation.html
[b-child-of]: https://docs.blender.org/manual/en/latest/animation/constraints/relationship/child_of.html
[b-copy]: https://docs.blender.org/manual/en/latest/animation/constraints/transform/copy_transforms.html
[b-copy-rotation]: https://docs.blender.org/manual/en/latest/animation/constraints/transform/copy_rotation.html
[b-space]: https://docs.blender.org/manual/en/latest/animation/constraints/interface/common.html
[b-clear]: https://docs.blender.org/manual/en/latest/animation/armatures/posing/editing/clear.html
[b-pose]: https://docs.blender.org/manual/en/latest/animation/armatures/posing/editing/pose_library.html
[b-shape]: https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html
[b-shape-panel]: https://docs.blender.org/manual/en/latest/animation/shape_keys/shape_keys_panel.html
[b-drivers]: https://docs.blender.org/manual/en/latest/animation/drivers/index.html
[b-armature]: https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html
[b-smooth]: https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html
[b-bake]: https://docs.blender.org/api/5.2/bpy.ops.nla.html#bpy.ops.nla.bake
[b-gltf]: https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/docs/blender_docs/scene_gltf2.rst
[p-fabrik]: https://www.andreasaristidou.com/publications/papers/FABRIK.pdf
[g-ubisoft]: https://media.gdcvault.com/gdc2015/presentations/Therriault_David_InYourHands.pdf
[u-fbik]: https://dev.epicgames.com/documentation/unreal-engine/control-rig-full-body-ik-in-unreal-engine?lang=en-US
[u-solvers]: https://dev.epicgames.com/documentation/unreal-engine/ik-rig-solvers-in-unreal-engine?lang=en-US
[y-two-bone]: https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/api/UnityEngine.Animations.Rigging.TwoBoneIKConstraintData.html
[y-parent]: https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/manual/constraints/MultiParentConstraint.html
[t-ccd]: https://threejs.org/docs/pages/CCDIKSolver.html
[t-ccd-source]: https://github.com/mrdoob/three.js/blob/dev/examples/jsm/animation/CCDIKSolver.js
[t-skin]: https://threejs.org/docs/pages/SkinnedMesh.html
[t-gltf]: https://threejs.org/docs/pages/GLTFLoader.html
