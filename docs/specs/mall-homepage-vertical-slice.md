# Mall homepage vertical slice

Status: build-ready after grilling and Taste review

## Spine

This is a personal homepage reached through a front door: a quiet, authored
masthead opens onto a loud playable mall. The site is not pretending to be a
game, and the game is not an obstacle visitors must clear.

The visitor gets three things in order:

1. Meio addresses them directly.
2. The mall offers optional play without demanding commitment.
3. The page leaves one personal trace below the ride: what Meio has been
   playing.

## Page hierarchy

### Masthead

- `It’s Meio. (The)Dev` is the dominant identity and uses Redaction 20 Italic
  large enough for its eroded pixel character to be visible.
- The persistent navigation stays ordinary HTML: home/work, currently playing,
  résumé, and GitHub. The `/mall` preview may temporarily link home to `/`.
- `Take the long way in` becomes a small route cue immediately above the ride,
  not the hero headline.
- The surrounding page uses paper, ink, warm caption yellow, and violet only
  for links, focus, and continuity with the kiosk screen. Cyan, hot pink, and
  acid green belong primarily to the 3D world and its actual controls.

### Welcome

The authored welcome is the only overt comic-caption treatment outside the
game:

> Hey! How are you? I hope you’re having a great day. Welcome to my website. It
> has things I like—mostly games, tech, passing hobbies, and personal stuff. If
> you like those things, I recommend looking around.

Treatment: warm newsprint yellow, black border, dense narration-box type, no
dither within the box, no rotation, and no colored offset shadow.

This is accepted draft copy for the slice, not a claim that the site's final
voice is solved.

### Ride frame

- The scene starts in attract mode like an unattended arcade cabinet.
- The physical coin slot is the primary invitation and exposes `Add token` as
  its accessible name. It belongs to the ride frame rather than appearing as a
  separate portfolio CTA or second caption box.
- Activating the coin slot rapidly flashes the aperture and centered
  `INSERT COIN` prompt, gives keyboard/touch control, and moves focus into the
  ride surface. The prompt disappears once driving begins.
- While driving, the token invitation is absent. Escape, Tab, clicking outside
  the ride, or browser visibility loss returns to attract mode.
- A small `Pause`/`Resume` control lives in the top-right of the frame for
  attract-mode motion. It is not a competing bottom action.
- There is no `Enter arcade`, `Take control`, `Resume ride`, or `Pause ride`
  control.
- Instruction plate:

  ```text
  ARROWS / WASD — STEER
  S / ↓ — BRAKE
  R — RESET
  TAB / ESC — EXIT
  ```

- Reaching the arcade in-world still opens the currently-playing dialog.
- With WebGL unavailable or data saver enabled, the semantic page and game log
  remain usable without leaving an inert, unexplained frame.
- Before token insertion, the scene does not capture keyboard, pointer, wheel,
  or touch input and cannot prevent the page from scrolling. Input listeners
  become active only while driving, and Tab always follows browser focus order.

### Ride state transitions

| From | Event | To | Focus / motion result |
| --- | --- | --- | --- |
| Attract running | Pause | Attract paused | Pause control retains focus; camera stops |
| Attract paused | Resume | Attract running | Resume control retains focus; camera resumes |
| Attract running or paused | Activate coin slot | Driving | Ride surface receives focus; driving input starts |
| Driving | Escape, Tab, outside click, or visibility loss | Attract running | Driving input stops; normal page interaction resumes |
| Driving | Reach arcade | Dialog open | Ride pauses; dialog receives focus |
| Any page state | Open `#currently-playing` | Dialog open | Invoking link is remembered; dialog receives focus |
| Dialog open | Close | Previous non-dialog state | Focus returns to the invoking element; an in-world arcade arrival returns to attract rather than silently driving behind the dialog |

Pausing attract motion does not survive a driving session: every driving exit
returns to attract running. Visibility loss exits driving but does not close an
already-open dialog.

## Mall art direction

- Operational but tired Filipino mall wing, after hours, circa 2008–2012.
- Glossy tile, tarp-like promotions, improvised notices, compact kiosks,
  scuffed kick zones, faded vinyl, and dirty grout.
- Mundane greenish fluorescent base with warm arcade spill. No generalized
  cyberpunk fog or abandoned-horror dressing.
- Architecture stays nicotine cream, dirty white, grey-green, and black.
  Saturated color identifies the rider, route, or arcade destination.
- Three abrupt toon bands include a near-black lowest band. Real hard-edged
  shadows and authored contact shapes ground the player and hero props.
- Selective outlines belong on the scooter, rider, arcade, and a few hero
  props—not every architectural edge.
- The rider is a loose Meio avatar: short, broad bear-like shoulders, short
  hair, oversized glasses, oversized shirt, shorts, and generic skate high-tops.
- Asset geometry is curated and rematerialized. Existing procedural benchmark
  geometry and Rapier colliders remain the gameplay source of truth.
- Mundane signage must be believable. Flags, tourist shorthand, meme brands,
  and walls of jokey generated store names are out.
- Donor assets must share coherent silhouette scale, toon bands, palette,
  shadow language, and prop density. An untouched asset-pack showroom fails.
- Suda51 and Jet Set Radio are references for graphic shadow, traversal energy,
  tonal collision, and authored specificity—not sources for copied characters,
  logos, UI layouts, iconography, or recognizable environments.

## Currently playing kiosk

The only substantial section below the ride is a full-width, battered demo
kiosk from a closed mall game shop.

- Physical frame: dirty off-white ABS bezel, scratched dark lower strip,
  recessed screen, and `CABINET 01` service label.
- Screen: near-black violet, acid-green status, one magenta divider, terminal
  or pixel face, and a hard asymmetric layout. Redaction is not used here.
- The current slot reads `NO DISC INSERTED` and displays the canonical empty
  message.
- The three newest completions are static save slots with their dates.
- Save slots do not pretend to be interactive.
- One real `View full log` disclosure opens the remaining canonical history.
- The same semantic kiosk content appears in the homepage section and the
  arcade dialog.
- CSS-disabled output remains a comprehensible heading, status, and ordered
  game list.

## Semantic homepage contract

Independently of WebGL, the document exposes Meio's identity, the authored
welcome, ordinary navigation to work/résumé/GitHub/currently-playing, the route
cue, a labelled playable region with instructions or a concise fallback, and
the complete currently-playing content. Keyboard-only and WebGL-disabled
visitors can traverse that whole document without entering the ride.

## Motion contract

- Motion communicates state: token insertion, hover/focus readiness, button
  press, dialog open, and full-log disclosure.
- Surrounding-page interactions should feel tactile but not elastic or
  toy-like: fast compression, small travel, decisive easing.
- At most one short vertical sync/wipe introduces the kiosk dialog.
- No scroll reveals, parallax, ambient glitch, chromatic aberration, constant
  scanlines, automatic sound, cursor simulation, or boot sequence.
- `prefers-reduced-motion: reduce` removes nonessential transitions and makes
  state changes immediate.

## Explicit removals

- Global halftone overlay and decorative dither
- Cyan/pink/acid offset shadows on ordinary page components
- `The website still works`, `The mall is optional`, and `Exit mall` framing
- Two-column card grid below the ride
- Fake game-menu chrome around site navigation
- NPCs, quests, collectibles, dialogue, lore, enterable stores, and more wings

## Behavioral acceptance

- The dominant first read is `It’s Meio. (The)Dev`, then the welcome, then the
  playable mall.
- Before control, exactly one primary ride action is presented: the coin slot,
  accessibly named `Add token`.
- Token insertion moves the state from attract to driving. Exit paths restore
  attract mode without losing semantic page access.
- The attract-motion pause is separately operable and never masquerades as the
  driving control.
- Reaching the arcade or opening the canonical hash presents the same game-log
  data and restores focus/state on close.
- Only true actions are focusable in the kiosk; save slots are static.
- Mobile layout keeps the ride controls operable and stacks kiosk slots.
- Reduced-motion mode has no decorative animation.
- The existing benchmark route remains passable, reset-safe, and camera-safe.
- The driving benchmark verifies smooth acceleration, predictable coasting,
  strong braking, intentional reverse, stable low-speed steering, restrained
  high-speed steering, collision recovery without snagging or explosive
  impulses, camera lag/occlusion recovery, reset from every hazard, and visible
  geometry aligned with colliders. Keyboard and touch are checked on the route.
- The shipped third-party 3D payload remains below 5 MB. Every third-party
  asset has a redistribution-compatible open license recorded with author,
  source URL, license, modifications, and source/shipped checksums. Unknown or
  merely "free" licensing fails the gate.

## Minimum verification

- Reducer tests cover token insertion, attract-motion pause/resume, exit to
  attract, and dialog state restoration.
- Canonical game-log tests continue to protect ordering and date formatting.
- Browser verification covers desktop and narrow viewport hierarchy, keyboard
  token/exit flow, ordinary scrolling and focus order before token insertion,
  dialog focus restoration, WebGL-disabled traversal, fallback size, reduced
  motion, and console errors.
- A human driving pass records the expected feel and result for every benchmark
  contract above on keyboard and touch.
- Source review covers asset disposal, listener cleanup, focus ownership, and
  the separation between render assets and physics colliders.
