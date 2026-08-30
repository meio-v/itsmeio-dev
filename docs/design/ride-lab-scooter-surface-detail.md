# Ride Lab scooter surface-detail pass

## Diagnosis

The curated Styloo scooter remains the vehicle source of truth. Blender 5.2.1
inspection of the shipped GLB measured 24 meshes, 4,383 vertices, 5,944 source
triangles, 2,414 open boundary edges, 1,676 manifold edges at or above a 30°
face angle, custom normals on every mesh, and no UV layers. Runtime inspection
confirmed a shared four-band toon ramp plus selective inverted-hull silhouettes;
those hulls describe the outside silhouette but do not draw internal panel
boundaries.

The custom normals already preserve the source's intended broad low-poly planes,
so a weighted-normal pass would mostly duplicate existing data. A baked normal or
curvature map would first require a new UV unwrap and shader/texture payload, yet
would remain easy to lose in the hard toon bands. Automatically drawing all open
or hard edges was rejected because the source contains enough split topology to
produce noisy triangulation marks instead of designed panels.

## Temporary runtime prototype

`rideLabVehicleVisual.ts` defines a small set of project-authored guides for the
front apron, rear cowling shoulder, floorboard/body break, and front/rear
transverse breaks. At load time, rays project each guide onto the existing main
shell from its side or end. Three-sided tube strips turn the projected paths into
ink geometry. This is the useful meaning of “mesh wrap” for this prototype:
authored seam paths shrink-wrapped onto the current shell, not a replacement mesh
or texture wrapped around the scooter. Rejected service-cover and cooling-slash
marks were removed because they read as arbitrary surface noise.

The generated guides are mirrored, merged together, transformed into the local
space of the existing ink floor-mat mesh, and merged into that mesh. The result is
576 generated triangles, zero textures, and zero added draw calls. The thin ink
carrier no longer casts into the shadow map, so the detail triangles are paid
once and the measured scene uses one fewer draw call than the equivalent
unmerged carrier. The runtime rejects a generated result above 1,000 triangles.

The same reversible prototype adds an exaggerated booster assembly and rounded
two-piece seat to establish modeling intent before native Blender authoring. The
booster measures 1,244 triangles, three draw calls, and one project-authored
sticker texture. The seat measures 288 triangles and two draw calls. Both use
baked hard color regions on unlit runtime materials rather than diffuse-looking
lighting gradients.

No GLB, collision geometry, physics, steering ownership, rider geometry/pose,
arena, or semantic scooter material classification is changed. Removing the
guide definition and merge call completely removes the prototype.

## Blender source-of-truth handoff

The next modeling task replaces the temporary procedural additions with a
reviewed Blender asset. Its exit condition is the Blender-authored scooter GLB
visible in Ride Lab with the stable runtime contract passing. NPR and final
shader refinement are deliberately separate work.

The integration contract is:

`Blender MCP authoring -> reviewed .blend -> GLB export -> contract validation -> Three.js runtime`

Preserve the existing `Root` skeleton, bone names, bind pose, weights, scale,
orientation, animations, and named empties for seat, grips, footboard, wheels,
and other runtime contacts. Three.js continues to own gameplay pose and IK;
those adjustments must not be baked into the model. Blender materials are
preview-only and may be replaced at runtime by stable material or object name.
The validator checks required nodes, bones, anchors, bounds, and animations but
does no modeling.
