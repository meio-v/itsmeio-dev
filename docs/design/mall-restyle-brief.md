# Mall restyle implementation brief

This document records the visual treatment applied to the `/mall` route. The implementation is a restyle, not a rewrite: keep the existing component boundaries, hooks, state machine, and Three.js runtime intact.

**Framework and styling system:** This is a Next.js App Router project using React, CSS Modules (`app/mall/mall.module.css`), and a dynamically loaded Three.js canvas. Continue using the existing CSS Module rather than introducing Tailwind, styled-components, or inline styling.

**Component ownership:** the route splits the experience across `MallPage`, `Header`, `SiteNavigation`, `HeroFrontDoor`, `HostCaption`, `RideFrame`, `MallRideCanvas`, `RideHUD`, `TokenConsole`, `CurrentlyPlayingKiosk`, and `CurrentlyPlayingDialog`. Map treatment to component; do not collapse the tree.

**Do not touch:** the WebGL runtime, physics, camera, input handling, attract-path logic, point-of-interest orchestration, capability detection, data-saver opt-in, or reduced-motion forwarding. The prototype's animated CSS "scene" is a stand-in for the real canvas — drop it and render `MallRideCanvas` in that slot.

**Palette** — ink `#14110f`, paper `#f0e9d8`, cobalt `#1f4fff`, tomato `#e63f2a`, mustard `#e0a41c`, pink `#e8a3b8`, acid lime `#c6ff2e`. Add these as design tokens in whatever system the repo already uses; don't hardcode hexes in components.

**Type** — Redaction 20 Italic for the giant wordmark only (never below display size); Anton for headings and compressed labels; Bricolage Grotesque 700/800 for the welcome prose; DotGothic16 for all system text, cabinet labels, and Japanese signage. Self-host these rather than using the CDN links in the prototype; Redaction 20 Italic in particular is loaded from an unreliable third-party host in the file — get the real font file. Add explicit fallbacks.

**Structure to carry over:** black-gutter section seams; character-select nav plates with 1P–4P badges, hand-cut clip-paths and hard black underplates; yellow welcome plate with screentone bottom-right; cobalt polygon with screentone behind the wordmark; acid-green outlined graffiti section numbers; the ride as a cabinet object — lit marquee, lime trim, striped side panels, coin slot with blinking INSERT COIN; Currently Playing as a poster wall with a vertical kana rail; GAME / CLEARED log table.

**Preserve behaviour and copy verbatim:** the welcome text, nav labels and hrefs, "Add token" (never rename), Pause/Resume at upper-right of the frame, the no-disc state and attention-span message, the full-log disclosure, and the dialog opening from the Playing link, the Open display link, and the ride entering the arcade.

**Accessibility and responsive** — keep the existing stacking below 760px, touch controls on coarse pointers, keyboard skip-the-ride and exit-driving, focus management in the dialog, and the HTML kiosk working with WebGL unavailable. The prototype's `aria-hidden` decorative layers and `role="img"` scene label should carry across. Respect `prefers-reduced-motion`: the ticker, blinking INSERT COIN, and marquee animations must stop.

**Placeholders in the prototype that need real data:** the completed-games log rows, and three `<image-slot>` sticker drop targets — replace those with real `<Image>` components pointing at my sticker PNGs, or omit them if the assets aren't in yet.

Work component by component. After each, tell me what changed and what you left alone.
