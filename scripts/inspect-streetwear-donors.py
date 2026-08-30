r"""Render an isolated inventory of a reviewed clothing donor Blend file.

blender --background /path/to/donor.blend --python scripts/inspect-streetwear-donors.py -- \
  --output /tmp/donor-inventory
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--include", default=".*", help="Regular expression selecting mesh names")
    parser.add_argument("--views", default="front", help="Comma-separated front and side views")
    return parser.parse_args(argv)


def safe_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def world_bounds(mesh: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]
    return (
        Vector(tuple(min(point[axis] for point in corners) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in corners) for axis in range(3))),
    )


args = parse_args()
output = Path(args.output).resolve()
output.mkdir(parents=True, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.render.resolution_x = 360
scene.render.resolution_y = 460
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "RANDOM"
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.display.shading.cavity_type = "BOTH"
scene.display.shading.curvature_ridge_factor = 1.5
scene.display.shading.curvature_valley_factor = 1.5
scene.render.film_transparent = False

camera_data = bpy.data.cameras.new("donor-inspection-camera")
camera_data.type = "ORTHO"
camera = bpy.data.objects.new("donor-inspection-camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera

name_pattern = re.compile(args.include, re.IGNORECASE)
views = [value.strip() for value in args.views.split(",") if value.strip()]
view_directions = {
    "front": Vector((0, -1, 0)),
    "side": Vector((1, 0, 0)),
}
if not views or any(view not in view_directions for view in views):
    raise ValueError("--views accepts front and side")

all_meshes = [item for item in bpy.data.objects if item.type == "MESH"]
meshes = sorted((item for item in all_meshes if name_pattern.search(item.name)), key=lambda item: item.name)
report = []
for index, mesh in enumerate(meshes):
    for candidate in all_meshes:
        candidate.hide_render = candidate != mesh
    minimum, maximum = world_bounds(mesh)
    center = (minimum + maximum) * 0.5
    extent = maximum - minimum
    renders = []
    for view in views:
        direction = view_directions[view]
        camera.location = center + direction * (max(extent.x, extent.y, extent.z) * 2.5 + 1)
        camera.rotation_euler = (math.pi / 2, 0, 0 if view == "front" else math.pi / 2)
        horizontal_extent = extent.x if view == "front" else extent.y
        camera_data.ortho_scale = max(extent.z * 1.12, horizontal_extent * (scene.render.resolution_y / scene.render.resolution_x) * 1.12, 0.1)
        file_name = f"{index:02d}-{safe_name(mesh.name)}-{view}.png"
        scene.render.filepath = str(output / file_name)
        bpy.ops.render.render(write_still=True)
        renders.append({"view": view, "file": file_name})
    report.append({
        "index": index,
        "name": mesh.name,
        "renders": renders,
        "vertices": len(mesh.data.vertices),
        "triangles": sum(len(polygon.vertices) - 2 for polygon in mesh.data.polygons),
        "boundsMin": [round(value, 4) for value in minimum],
        "boundsMax": [round(value, 4) for value in maximum],
        "dimensions": [round(value, 4) for value in extent],
        "materials": [material.name for material in mesh.data.materials if material],
        "modifiers": [modifier.type for modifier in mesh.modifiers],
    })

(output / "inventory.json").write_text(json.dumps({"objects": report}, indent=2) + "\n")
print(f"streetwear donor inspection passed: {len(report)} meshes")
