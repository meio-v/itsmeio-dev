# Mall benchmark art direction

## Visual spine

The slice is a graphic after-hours mall wing that remains readable at moped
speed. Large silhouettes, floor rhythm, and value contrast do the work before
surface detail. It borrows only broad cel-animation energy from its references:
four-step lighting, decisive silhouettes, kinetic floor marks, and original DIY
signage. It does not copy game palettes, logos, graffiti, fonts, characters,
props, locations, or compositions.

The room should feel playful rather than dystopian. The light plaster shell and
warm floor keep it recognisably public and hospitable; indigo supplies depth;
coral and acid green are the only two attention accents. Cyan is reserved for
screens and does not become environmental neon.

## Initial review swatches

| Role | Hex | Use |
| --- | --- | --- |
| Ink | `#17152A` | Selective hero outlines and deepest separation |
| Deep indigo | `#292844` | Fascias, soffits, cabinet bodies |
| Floor slate | `#686D88` | Continuous ride surface |
| Tile light | `#DAD0B6` | Floor inlay and printed marks |
| Plaster | `#EEE3C9` | Architectural shell and planters |
| Coral | `#FF5F72` | Route emphasis and hero details |
| Acid | `#B9E45A` | Plants and the arcade interaction target |
| Screen cyan | `#75E6E5` | Unlit screens only |
| Contact shadow | `#242139` | Grounding and subtle floor seams |

These are first-slice swatches for human review, not a permanent brand system.

## Semantic material contract

The runtime owns one shared four-band nearest-filtered ramp and maps authored
surfaces through semantic roles:

- `toon.environment.dark`
- `toon.environment.floor`
- `toon.environment.light`
- `toon.hero.coral`
- `toon.interactive.acid`
- `unlit.screen`
- `decal.print`
- `shadow.contact`
- `outline.ink`

Ordinary architecture is outline-free. Only the arcade marquee/capture target
uses the art layer's inexpensive inverted-hull outline; the moving moped and
rider are owned by the vehicle visual and can receive the same hero treatment
without outlining the full mall.

## Route composition and collider alignment

The art scene and physics runtime use one metre-like world. The floor spans
35×18 m. Each physical box in `STATIC_BOXES` has a visible architectural
counterpart at the same centre and dimensions.

1. **Start promenade:** 14 m of inlay and braking seams from the spawn.
2. **Slalom:** alternating kiosks and faceted planters turn five collider boxes
   into mall furniture.
3. **Atrium hairpin:** the large planter anchors visible 2.5 m and 5 m judging
   bands.
4. **Surface threshold:** a shallow strip introduces a short indigo grip zone.
5. **Camera pinch:** two columns gain low, dark soffit caps that make the camera
   test legible without hiding the route.
6. **Impact corner:** the coral wall, bevelled columns, and offset storefront
   return distinguish the recovery station.
7. **Arcade capture:** a 1.8 m forgiving opening, outlined marquee, cabinets,
   and floor ring lead to the trigger at `(13.1, -4.8)`.
8. **Return lane:** repeated floor chevrons and the broad storefront rhythm make
   the path back to the start feel intentional rather than like a test grid.

## Lighting, outlines, and render envelope

One directional key and one hemisphere fill drive the toon ramp. Shadow maps,
bloom, SSAO, chromatic aberration, scanlines, glitch, SSR, film grain, and
global fog are deliberately absent. The procedural scene uses no textures and
no post-processing passes. Repeated geometry shares materials, and disposal
deduplicates shared geometry references.

The authored layer is designed to remain comfortably below the #18 peak limits
of 150 draw calls, 300k rendered triangles, 150 geometries, and 64 textures. A
browser benchmark remains the source of truth after integration; this document
does not substitute for measured renderer statistics.
