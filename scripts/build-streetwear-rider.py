r"""Build the Ride Lab streetwear rider from reviewed CC0 authoring inputs.

Run with Blender, not system Python:

blender --background --factory-startup --python scripts/build-streetwear-rider.py -- \
  --girush /path/to/baseMesh_A1_\(human_YW\)_by_Girush.blend \
  --kenney assets/authoring/ride-lab/kenney-runtime-rig.glb \
  --hoodie /path/to/Basic\ Hoodie.blend \
  --clothing-kit /path/to/clothing-kit.blend \
  --output /tmp/streetwear-rider.glb \
  --metrics /tmp/streetwear-rider-metrics.json

Girush is the visual donor. The Kenney armature remains the runtime contract.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from mathutils.kdtree import KDTree


GIRUSH_SCALE = 0.01982
# Imported Kenney bone coordinates live below a 100x armature object scale.
ARM_SPAN_ORIGIN = 0.0034
ARM_SPAN_SCALE = 0.55
HAND_LONGITUDINAL_SCALE = 0.59
RUNTIME_COLORS = {
    "body": (0.694, 0.274, 0.159, 1.0),
    "head": (0.694, 0.274, 0.159, 1.0),
    "hair": (0.019, 0.012, 0.036, 1.0),
    "brow": (0.019, 0.012, 0.036, 1.0),
    "eye": (0.006, 0.003, 0.010, 1.0),
    "sclera": (0.930, 0.720, 0.520, 1.0),
    "pupil": (0.006, 0.003, 0.010, 1.0),
    "mouth": (0.075, 0.022, 0.018, 1.0),
    "lace": (0.780, 0.700, 0.555, 1.0),
    "hoodie": (0.871, 0.159, 0.085, 1.0),
    "undershirt": (0.896, 0.815, 0.617, 1.0),
    "cargo": (0.008, 0.030, 0.075, 1.0),
    "calf": (0.694, 0.274, 0.159, 1.0),
    "sole": (0.060, 0.054, 0.078, 1.0),
    "shoe": (0.022, 0.019, 0.039, 1.0),
}
GIRUSH_OBJECTS = {
    "body.001": "streetwear-body",
    "baseMesh1_A1.001": "streetwear-head",
    "hair": "streetwear-hair",
}

BONE_MAP = {
    "Sacrum": "Hips",
    "Sacrum.001": "Hips",
    "genitalia": "Hips",
    "Spine1": "Spine",
    "Spine1.001": "Chest",
    "Spine2": "Chest",
    "Spine3": "UpperChest",
    "Spine3.002": "Neck",
    "head": "Head",
    "eye.L": "Head",
    "eye.R": "Head",
    "Clavicle.L": "LeftShoulder",
    "Humerus.L": "LeftArm",
    "HumerusRoll.L": "LeftArm",
    "LowerArm.L": "LeftForeArm",
    "LowerArm.L.001": "LeftForeArm",
    "Clavicle.R": "RightShoulder",
    "Humerus.R": "RightArm",
    "HumerusRoll.R": "RightArm",
    "LowerArm.R": "RightForeArm",
    "LowerArm.R.001": "RightForeArm",
    "Femur.L": "LeftUpLeg",
    "Tibia.L": "LeftLeg",
    "Tibia.L.001": "LeftLeg",
    "Foot.L": "LeftFoot",
    "Foot.L.001": "LeftFoot",
    "Femur.R": "RightUpLeg",
    "Tibia.R": "RightLeg",
    "Tibia.R.001": "RightLeg",
    "Foot.R": "RightFoot",
    "Foot.R.001": "RightFoot",
}

for side, target in (("L", "LeftHand"), ("R", "RightHand")):
    for prefix in ("hand001", "hand002", "hand003", "hand004", "hand005", "hand007", "hand008", "hand009", "hand010", "hand011", "hand012", "hand013", "hand014", "hand015", "hand016", "hand017"):
        BONE_MAP[f"{prefix}.{side}"] = target

RIG_PIVOT_MAP = {
    "Hips": "Sacrum",
    "Spine": "Spine1",
    "Chest": "Spine2",
    "UpperChest": "Spine3",
    "Neck": "Spine3.002",
    "Head": "head",
    "LeftShoulder": "Clavicle.L",
    "LeftArm": "Humerus.L",
    "LeftForeArm": "LowerArm.L",
    "LeftHand": "hand001.L",
    "RightShoulder": "Clavicle.R",
    "RightArm": "Humerus.R",
    "RightForeArm": "LowerArm.R",
    "RightHand": "hand001.R",
    "LeftUpLeg": "Femur.L",
    "LeftLeg": "Tibia.L",
    "LeftFoot": "Foot.L",
    "LeftToes": "Foot.L.001",
    "RightUpLeg": "Femur.R",
    "RightLeg": "Tibia.R",
    "RightFoot": "Foot.R",
    "RightToes": "Foot.R.001",
}


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--girush", required=True)
    parser.add_argument("--kenney", required=True)
    parser.add_argument("--hoodie", required=True)
    parser.add_argument("--clothing-kit", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--metrics", required=True)
    parser.add_argument("--authoring-blend")
    return parser.parse_args(argv)


def append_mesh(blend_path: Path, object_name: str) -> bpy.types.Object:
    with bpy.data.libraries.load(str(blend_path), link=False) as (available, requested):
        if object_name not in available.objects:
            raise RuntimeError(f"{object_name!r} not found in {blend_path}")
        requested.objects = [object_name]
    mesh = requested.objects[0]
    bpy.context.collection.objects.link(mesh)
    return mesh


def world_bounds(mesh: bpy.types.Object) -> tuple[Vector, Vector]:
    points = [mesh.matrix_world @ vertex.co for vertex in mesh.data.vertices]
    return (
        Vector(tuple(min(point[axis] for point in points) for axis in range(3))),
        Vector(tuple(max(point[axis] for point in points) for axis in range(3))),
    )


def fit_mesh_to_bounds(mesh: bpy.types.Object, target_matrix: Matrix, target_min: Vector, target_max: Vector) -> None:
    source_min, source_max = world_bounds(mesh)
    source_size = source_max - source_min
    target_inverse = target_matrix.inverted()
    source_matrix = mesh.matrix_world.copy()
    for vertex in mesh.data.vertices:
        source_world = source_matrix @ vertex.co
        normalized = Vector(
            tuple((source_world[axis] - source_min[axis]) / max(source_size[axis], 1e-6) for axis in range(3))
        )
        fitted = target_min + Vector(tuple(normalized[axis] * (target_max[axis] - target_min[axis]) for axis in range(3)))
        vertex.co = target_inverse @ fitted
    # The donor object's authored transform is no longer meaningful once its
    # vertices are expressed in the Kenney target space. Reset it before
    # nearest-surface weight transfer so both meshes are queried in one frame.
    mesh.matrix_world = target_matrix


def remove_bottom_fraction(mesh: bpy.types.Object, fraction: float) -> None:
    minimum, maximum = world_bounds(mesh)
    world_z = minimum.z + (maximum.z - minimum.z) * fraction
    source_matrix = mesh.matrix_world.copy()
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in mesh.data.vertices:
        vertex.select = (source_matrix @ vertex.co).z < world_z
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh.select_set(False)


def remove_raised_hood(mesh: bpy.types.Object) -> None:
    """Open the hoodie around the neck so hair/head remain a clean dominant shape."""
    source_matrix = mesh.matrix_world.copy()
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        # Keep the donor's collar around the base of the neck. Removing the
        # centre any lower exposes a long black gap between head and torso.
        vertex.select = point.z > 3.27 and abs(point.x) < 0.72
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh.select_set(False)


def refine_hoodie_silhouette(mesh: bpy.types.Object) -> None:
    """Narrow the torso/shoulders and crop the hoodie without losing cuff reach."""
    source_matrix = mesh.matrix_world.copy()
    target_inverse = source_matrix.inverted()
    shoulder_edge = 0.90
    shoulder_scale = 0.82
    cuff_edge = 1.76
    cuff_target = 1.52
    narrowed_edge = shoulder_edge * shoulder_scale
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        sign = 1.0 if point.x >= 0.0 else -1.0
        distance = abs(point.x)
        if distance <= shoulder_edge:
            point.x *= shoulder_scale
        else:
            # End the garment at the wrist instead of wrapping past the whole
            # hand. The source sleeve remains oversized through its volume,
            # while fingers project cleanly beyond the cuff.
            sleeve_t = min(1.0, (distance - shoulder_edge) / (cuff_edge - shoulder_edge))
            point.x = sign * (narrowed_edge + sleeve_t * (cuff_target - narrowed_edge))
        vertex.co = target_inverse @ point

    # The gameplay silhouette calls for a cropped hoodie. Delete only the
    # central torso hem; the outer sleeve/cuff geometry remains intact.
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    source_matrix = mesh.matrix_world.copy()
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        vertex.select = point.z < 1.76 and abs(point.x) < 0.78
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh.select_set(False)


def raise_sleeves_to_runtime_rest_pose(mesh: bpy.types.Object) -> None:
    """Conform the donor's low A-pose sleeves to the runtime T-pose.

    Weight transfer is only meaningful when garment and body describe the same
    rest pose. The donor cuffs otherwise sit near the hips and inherit torso
    weights before the game ever bends an elbow.
    """
    source_matrix = mesh.matrix_world.copy()
    target_inverse = source_matrix.inverted()
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        reach = max(0.0, min(1.0, (abs(point.x) - 0.42) / 1.18))
        blend = reach * reach * (3.0 - 2.0 * reach)
        # The former 0.48 m lift made the sleeve look aligned in silhouette but
        # left it far above the Kenney arm chain. Keep the garment centred on
        # the actual deformation skeleton instead.
        point.z += 0.18 * blend
        vertex.co = target_inverse @ point


def keep_center_x_fraction(mesh: bpy.types.Object, fraction: float) -> None:
    minimum, maximum = world_bounds(mesh)
    center = (minimum.x + maximum.x) * 0.5
    radius = (maximum.x - minimum.x) * 0.5 * fraction
    source_matrix = mesh.matrix_world.copy()
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in mesh.data.vertices:
        vertex.select = abs((source_matrix @ vertex.co).x - center) > radius
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh.select_set(False)


def decimate(mesh: bpy.types.Object, ratio: float) -> None:
    modifier = mesh.modifiers.new(name="Reviewed runtime decimation", type="DECIMATE")
    modifier.ratio = ratio
    modifier.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    mesh.select_set(False)


def smooth_geometry(mesh: bpy.types.Object, factor: float, iterations: int) -> None:
    """Reduce scan-like surface noise while retaining the donor silhouette."""
    modifier = mesh.modifiers.new(name="Reviewed garment smoothing", type="SMOOTH")
    modifier.factor = factor
    modifier.iterations = iterations
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    mesh.select_set(False)


def separate_short_legs(mesh: bpy.types.Object) -> None:
    """Open a readable crotch and keep the lower shorts as two volumes."""
    source_matrix = mesh.matrix_world.copy()
    target_inverse = source_matrix.inverted()

    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        vertex.select = point.z < 1.25 and abs(point.x) < 0.075
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")

    source_matrix = mesh.matrix_world.copy()
    target_inverse = source_matrix.inverted()
    for vertex in mesh.data.vertices:
        point = source_matrix @ vertex.co
        if point.z < 1.38 and abs(point.x) < 0.18:
            point.x = (1.0 if point.x >= 0.0 else -1.0) * (0.18 + abs(point.x) * 0.15)
            vertex.co = target_inverse @ point
    mesh.select_set(False)


def create_elliptical_band(
    name: str,
    target_matrix: Matrix,
    radius_x: float,
    radius_y: float,
    lower_z: float,
    upper_z: float,
    segments: int = 16,
) -> bpy.types.Object:
    """Create a quiet hem/waist band from a reviewed donor silhouette."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    target_inverse = target_matrix.inverted()
    for z in (lower_z, upper_z):
        for index in range(segments):
            angle = (index / segments) * math.tau
            point = target_inverse @ Vector((math.cos(angle) * radius_x, math.sin(angle) * radius_y, z))
            vertices.append(tuple(point))
    for index in range(segments):
        following = (index + 1) % segments
        faces.append((index, following, segments + following, segments + index))
    geometry = bpy.data.meshes.new(f"{name}-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(name, geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh


def create_reconstructed_cargo_shorts(target_matrix: Matrix) -> bpy.types.Object:
    """Reconstruct the noisy trousers donor into clear waistband and leg volumes."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float]) -> int:
        local = target_inverse @ Vector(world)
        vertices.append(tuple(local))
        return len(vertices) - 1

    def add_oval_volume(center_x: float) -> None:
        rings = (
            (1.46, 0.31, 0.28),
            (1.14, 0.36, 0.32),
            (0.84, 0.32, 0.27),
        )
        segments = 12
        starts: list[int] = []
        for z, radius_x, radius_y in rings:
            starts.append(len(vertices))
            for index in range(segments):
                angle = (index / segments) * math.tau
                point((center_x + math.cos(angle) * radius_x, math.sin(angle) * radius_y, z))
        for ring_index in range(len(rings) - 1):
            current = starts[ring_index]
            following_ring = starts[ring_index + 1]
            for index in range(segments):
                following = (index + 1) % segments
                faces.append((current + index, following_ring + index, following_ring + following, current + following))
        faces.append(tuple(starts[-1] + index for index in reversed(range(segments))))

    def add_box(center: tuple[float, float, float], size: tuple[float, float, float]) -> None:
        cx, cy, cz = center
        sx, sy, sz = (axis * 0.5 for axis in size)
        start = len(vertices)
        for x, y, z in (
            (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
            (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz),
        ):
            point((cx + x, cy + y, cz + z))
        faces.extend(
            tuple(start + index for index in face)
            for face in ((3, 2, 1, 0), (5, 6, 7, 4), (1, 5, 4, 0), (2, 6, 5, 1), (3, 7, 6, 2), (7, 3, 0, 4))
        )

    add_oval_volume(-0.29)
    add_oval_volume(0.29)

    # A stable hip-rigid waistband bridges the two independently deforming
    # short legs. One offset box supplies the asymmetric cargo-pocket read.
    waistband = create_elliptical_band("streetwear-cargo-waistband", target_matrix, 0.60, 0.31, 1.34, 1.54)
    waistband_vertices = [tuple(vertex.co) for vertex in waistband.data.vertices]
    waistband_offset = len(vertices)
    vertices.extend(waistband_vertices)
    faces.extend(tuple(waistband_offset + index for index in polygon.vertices) for polygon in waistband.data.polygons)
    bpy.data.objects.remove(waistband, do_unlink=True)
    add_box((0.60, -0.02, 1.13), (0.12, 0.36, 0.30))

    geometry = bpy.data.meshes.new("streetwear-cargo-shorts-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-cargo-shorts", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh


def create_authored_hoodie(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Build the hoodie as a short boxy body plus dropped oversized sleeves."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float], weight: dict[str, float]) -> int:
        vertices.append(tuple(target_inverse @ Vector(world)))
        weights.append(weight)
        return len(vertices) - 1

    def cloth_ring(
        z: float,
        radius_x: float,
        radius_y: float,
        weight_for_x,
        front_drop: float = 0.0,
    ) -> list[int]:
        ring: list[int] = []
        segments = 24
        for index in range(segments):
            angle = (index / segments) * math.tau
            cosine = math.cos(angle)
            sine = math.sin(angle)
            x = math.copysign(abs(cosine) ** 0.76, cosine) * radius_x
            y = math.copysign(abs(sine) ** 0.76, sine) * radius_y
            shaped_z = z - front_drop * max(0.0, -sine) * (0.55 + 0.45 * (1.0 - abs(cosine)))
            ring.append(point((x, y, shaped_z), weight_for_x(x)))
        return ring

    def bridge(first: list[int], second: list[int]) -> None:
        for index in range(len(first)):
            following = (index + 1) % len(first)
            faces.append((first[index], first[following], second[following], second[index]))

    lower = cloth_ring(1.87, 0.46, 0.23, lambda _x: {"Spine": 1.0}, front_drop=0.045)
    lower_drape = cloth_ring(2.03, 0.49, 0.25, lambda _x: {"Spine": 0.82, "Chest": 0.18})
    middle = cloth_ring(2.24, 0.50, 0.27, lambda _x: {"Spine": 0.30, "Chest": 0.70})
    underarm = cloth_ring(2.42, 0.52, 0.265, lambda _x: {"Chest": 0.35, "UpperChest": 0.65})
    shoulder = cloth_ring(
        2.53,
        0.47,
        0.235,
        lambda x: ({"LeftShoulder": 0.35, "UpperChest": 0.65} if x > 0.44 else {"RightShoulder": 0.35, "UpperChest": 0.65} if x < -0.44 else {"UpperChest": 1.0}),
    )
    neck = cloth_ring(2.60, 0.205, 0.145, lambda _x: {"UpperChest": 0.60, "Neck": 0.40}, front_drop=0.14)
    bridge(lower, lower_drape)
    bridge(lower_drape, middle)
    bridge(middle, underarm)
    bridge(underarm, shoulder)
    bridge(shoulder, neck)

    # A complete low collar wraps around the neck before opening into the hood.
    # The front dips below the chin while the rear rises into the hood bag.
    collar_segments = 24
    collar_outer_top: list[int] = []
    collar_inner_top: list[int] = []
    collar_outer_lower: list[int] = []
    collar_inner_lower: list[int] = []
    collar_weight = {"UpperChest": 0.42, "Neck": 0.58}
    for index in range(collar_segments):
        angle = (index / collar_segments) * math.tau
        cosine = math.cos(angle)
        sine = math.sin(angle)
        frontness = max(0.0, -sine)
        rim_z = 2.625 + 0.055 * max(0.0, sine) - 0.14 * frontness
        outer = (cosine * 0.255, sine * 0.195, rim_z)
        inner = (cosine * 0.170, sine * 0.115, rim_z + 0.008)
        collar_outer_top.append(point(outer, collar_weight))
        collar_inner_top.append(point(inner, collar_weight))
        collar_outer_lower.append(point((outer[0], outer[1], rim_z - (0.095 - 0.055 * frontness)), collar_weight))
        collar_inner_lower.append(point((inner[0], inner[1], rim_z - (0.075 - 0.040 * frontness)), collar_weight))
    for index in range(collar_segments):
        following = (index + 1) % collar_segments
        faces.extend((
            (collar_outer_top[index], collar_outer_top[following], collar_inner_top[following], collar_inner_top[index]),
            (collar_outer_lower[index], collar_outer_lower[following], collar_outer_top[following], collar_outer_top[index]),
            (collar_inner_lower[index], collar_inner_top[index], collar_inner_top[following], collar_inner_lower[following]),
            (collar_outer_lower[index], collar_inner_lower[index], collar_inner_lower[following], collar_outer_lower[following]),
        ))

    # The hood is a shallow cloth shell, not a round backpack. A thin outer
    # and inner panel hugs the upper back and arches around the neck opening.
    def hood_profile(half_width: float, center_z: float, edge_raise: float) -> tuple[tuple[float, float], ...]:
        profile: list[tuple[float, float]] = []
        for index in range(11):
            normalized = -1.0 + (2.0 * index / 10.0)
            profile.append((normalized * half_width, center_z + edge_raise * abs(normalized) ** 1.6))
        return tuple(profile)

    hood_rows = (
        (hood_profile(0.16, 2.37, 0.020), 0.25, 0.225, {"UpperChest": 0.94, "Neck": 0.06}),
        (hood_profile(0.22, 2.43, 0.012), 0.29, 0.235, {"UpperChest": 0.86, "Neck": 0.14}),
        (hood_profile(0.25, 2.50, -0.008), 0.32, 0.245, {"UpperChest": 0.76, "Neck": 0.24}),
        (hood_profile(0.24, 2.57, -0.006), 0.33, 0.245, {"UpperChest": 0.64, "Neck": 0.36}),
        (hood_profile(0.20, 2.63, 0.012), 0.31, 0.235, {"UpperChest": 0.50, "Neck": 0.50}),
        (hood_profile(0.15, 2.67, 0.030), 0.27, 0.220, {"UpperChest": 0.38, "Neck": 0.62}),
    )
    hood_outer: list[list[int]] = []
    hood_inner: list[list[int]] = []
    for profile, outer_y, inner_y, weight in hood_rows:
        half_width = max(abs(x) for x, _z in profile)
        hood_outer.append([
            point((x, outer_y - 0.065 * (abs(x) / half_width) ** 1.6, z), weight)
            for x, z in profile
        ])
        hood_inner.append([
            point((x, inner_y - 0.025 * (abs(x) / half_width) ** 1.6, z), weight)
            for x, z in profile
        ])
    hood_columns = len(hood_outer[0])
    for row_index in range(len(hood_rows) - 1):
        for index in range(hood_columns - 1):
            outer_face = (
                hood_outer[row_index][index],
                hood_outer[row_index + 1][index],
                hood_outer[row_index + 1][index + 1],
                hood_outer[row_index][index + 1],
            )
            inner_face = (
                hood_inner[row_index][index],
                hood_inner[row_index][index + 1],
                hood_inner[row_index + 1][index + 1],
                hood_inner[row_index + 1][index],
            )
            faces.extend((outer_face, inner_face))
    for row_index in range(len(hood_rows) - 1):
        faces.append((hood_outer[row_index][0], hood_inner[row_index][0], hood_inner[row_index + 1][0], hood_outer[row_index + 1][0]))
        faces.append((hood_outer[row_index][-1], hood_outer[row_index + 1][-1], hood_inner[row_index + 1][-1], hood_inner[row_index][-1]))
    for index in range(hood_columns - 1):
        faces.append((hood_outer[0][index], hood_outer[0][index + 1], hood_inner[0][index + 1], hood_inner[0][index]))
        faces.append((hood_outer[-1][index], hood_inner[-1][index], hood_inner[-1][index + 1], hood_outer[-1][index + 1]))

    def sleeve(side: str, sign: float) -> None:
        bone = lambda suffix: f"{side}{suffix}"
        specifications = (
            (0.44, 2.415, 0.180, 0.145, {bone("Shoulder"): 0.40, bone("Arm"): 0.60}),
            (0.53, 2.380, 0.205, 0.175, {bone("Arm"): 0.92, bone("ForeArm"): 0.08}),
            (0.62, 2.340, 0.205, 0.180, {bone("Arm"): 0.60, bone("ForeArm"): 0.40}),
            (0.70, 2.310, 0.190, 0.165, {bone("Arm"): 0.22, bone("ForeArm"): 0.78}),
            (0.77, 2.290, 0.170, 0.145, {bone("ForeArm"): 0.92, bone("Hand"): 0.08}),
            (0.83, 2.280, 0.135, 0.115, {bone("ForeArm"): 0.72, bone("Hand"): 0.28}),
            (0.88, 2.280, 0.155, 0.130, {bone("ForeArm"): 0.58, bone("Hand"): 0.42}),
        )
        rings: list[list[int]] = []
        sleeve_profile = (
            (-0.95, -0.32),
            (-0.80, -0.60),
            (-0.58, -0.84),
            (-0.15, -1.00),
            (0.12, -1.00),
            (0.38, -0.95),
            (0.62, -0.80),
            (0.78, -0.62),
            (1.00, -0.10),
            (0.98, 0.18),
            (0.90, 0.45),
            (0.58, 0.82),
            (0.36, 0.94),
            (0.12, 1.00),
            (-0.35, 0.94),
            (-0.72, 0.68),
            (-0.92, 0.25),
        )
        segments = len(sleeve_profile)
        for distance, z, radius_y, radius_z, weight in specifications:
            ring: list[int] = []
            for index, (profile_y, profile_z) in enumerate(sleeve_profile):
                shaped_y = profile_y * radius_y
                shaped_z = profile_z * radius_z
                axial_fold = 0.012 * (1.0 if index in {1, 5} else -0.45 if index in {3, 7} else 0.0)
                ring.append(point((sign * (distance + axial_fold), shaped_y, z + shaped_z), weight))
            rings.append(ring)
        for ring_index in range(len(rings) - 1):
            current = rings[ring_index]
            following_ring = rings[ring_index + 1]
            for index in range(segments):
                following = (index + 1) % segments
                face = (current[index], current[following], following_ring[following], following_ring[index])
                faces.append(face if sign > 0 else tuple(reversed(face)))
        inner_cuff: list[int] = []
        for profile_y, profile_z in sleeve_profile:
            inner_cuff.append(point((
                sign * 0.883,
                profile_y * 0.060,
                2.28 + profile_z * 0.050,
            ), {bone("ForeArm"): 0.48, bone("Hand"): 0.52}))
        outer_cuff = rings[-1]
        for index in range(segments):
            following = (index + 1) % segments
            face = (outer_cuff[index], outer_cuff[following], inner_cuff[following], inner_cuff[index])
            faces.append(face if sign > 0 else tuple(reversed(face)))

    sleeve("Left", 1.0)
    sleeve("Right", -1.0)

    geometry = bpy.data.meshes.new("streetwear-hoodie-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-hoodie", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_authored_undershirt(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Create open front/rear shirt-tail panels with small side slits."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float], weight: dict[str, float]) -> int:
        vertices.append(tuple(target_inverse @ Vector(world)))
        weights.append(weight)
        return len(vertices) - 1

    x_positions = tuple(-0.50 + index * 0.10 for index in range(11))
    front_lower_z = tuple(1.65 + 0.08 * (abs(x) / 0.50) ** 1.4 for x in x_positions)
    rear_lower_z = tuple(1.67 + 0.08 * (abs(x) / 0.50) ** 1.4 for x in x_positions)
    front_upper = [point((x, -0.26, 1.96), {"Spine": 0.75, "Chest": 0.25}) for x in x_positions]
    front_lower = [point((x, -0.28, z), {"Spine": 1.0}) for x, z in zip(x_positions, front_lower_z, strict=True)]
    rear_upper = [point((x, 0.22, 1.96), {"Spine": 0.75, "Chest": 0.25}) for x in x_positions]
    rear_lower = [point((x, 0.28, z), {"Spine": 1.0}) for x, z in zip(x_positions, rear_lower_z, strict=True)]
    for index in range(len(x_positions) - 1):
        faces.append((front_upper[index], front_lower[index], front_lower[index + 1], front_upper[index + 1]))
        faces.append((rear_upper[index], rear_upper[index + 1], rear_lower[index + 1], rear_lower[index]))

    # Close only the upper part of each side; the open lower 5 cm is a visible
    # slit that prevents the cream layer from becoming a continuous belt.
    for side_index in (0, len(x_positions) - 1):
        front_mid = point((x_positions[side_index], -0.28, front_lower_z[side_index] + 0.10), {"Spine": 1.0})
        rear_mid = point((x_positions[side_index], 0.28, rear_lower_z[side_index] + 0.10), {"Spine": 1.0})
        side_face = (front_upper[side_index], rear_upper[side_index], rear_mid, front_mid)
        faces.append(side_face if side_index == len(x_positions) - 1 else tuple(reversed(side_face)))
    geometry = bpy.data.meshes.new("streetwear-undershirt-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-undershirt", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_authored_cargo_shorts(
    target_matrix: Matrix,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Build one dropped-crotch upper shell with two boxy knee-length legs."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float], weight: dict[str, float]) -> int:
        vertices.append(tuple(target_inverse @ Vector(world)))
        weights.append(weight)
        return len(vertices) - 1

    def boxy_cross_section(
        center_x: float,
        z: float,
        radius_x: float,
        radius_y: float,
        weight: dict[str, float],
        segments: int = 16,
    ) -> list[int]:
        ring: list[int] = []
        for index in range(segments):
            angle = (index / segments) * math.tau
            cosine = math.cos(angle)
            sine = math.sin(angle)
            x = center_x + math.copysign(abs(cosine) ** 0.58, cosine) * radius_x
            y = math.copysign(abs(sine) ** 0.58, sine) * radius_y
            ring.append(point((x, y, z), weight))
        return ring

    def shared_cross_section(
        z_for_cosine,
        radius_x: float,
        radius_y: float,
        center_y: float,
        weight_for_x,
        segments: int = 18,
    ) -> list[int]:
        ring: list[int] = []
        for index in range(segments):
            angle = (index / segments) * math.tau
            cosine = math.cos(angle)
            sine = math.sin(angle)
            x = math.copysign(abs(cosine) ** 0.58, cosine) * radius_x
            y = center_y + math.copysign(abs(sine) ** 0.58, sine) * radius_y
            ring.append(point((x, y, z_for_cosine(cosine)), weight_for_x(x)))
        return ring

    shared_segments = 18
    waist = shared_cross_section(lambda _cosine: 1.72, 0.49, 0.25, 0.0, lambda _x: {"Hips": 1.0})
    seat = shared_cross_section(
        lambda _cosine: 1.39,
        0.64,
        0.32,
        0.03,
        lambda x: {"Hips": 1.0} if abs(x) < 0.18 else {"Hips": 0.90, "LeftUpLeg" if x > 0.0 else "RightUpLeg": 0.10},
    )
    dropped = shared_cross_section(
        lambda cosine: 1.07 + 0.13 * abs(cosine),
        0.67,
        0.31,
        0.02,
        lambda x: {"Hips": 1.0} if abs(x) < 0.15 else {"Hips": 0.70, "LeftUpLeg" if x > 0.0 else "RightUpLeg": 0.30},
    )
    for index in range(shared_segments):
        following = (index + 1) % shared_segments
        faces.append((waist[index], seat[index], seat[following], waist[following]))
        faces.append((seat[index], dropped[index], dropped[following], seat[following]))

    leg_segments = 16
    for center_x in (-0.32, 0.32):
        side = "LeftUpLeg" if center_x > 0.0 else "RightUpLeg"
        rings = (
            boxy_cross_section(center_x, 1.24, 0.36, 0.30, {"Hips": 0.80, side: 0.20}, leg_segments),
            boxy_cross_section(center_x, 1.01, 0.37, 0.29, {"Hips": 0.35, side: 0.65}, leg_segments),
            boxy_cross_section(center_x, 0.78, 0.30, 0.24, {"Hips": 0.08, side: 0.92}, leg_segments),
        )
        for ring_index in range(len(rings) - 1):
            for index in range(leg_segments):
                following = (index + 1) % leg_segments
                faces.append((rings[ring_index][index], rings[ring_index + 1][index], rings[ring_index + 1][following], rings[ring_index][following]))

    # Shallow outer-thigh cargo pockets make the side silhouette readable
    # without splitting the shorts into separate floating garment pieces.
    for sign, side in ((-1.0, "RightUpLeg"), (1.0, "LeftUpLeg")):
        inner_x = sign * 0.655
        outer_x = sign * 0.725
        y_front, y_back = -0.20, 0.18
        z_bottom, z_top = 0.91, 1.27
        pocket_weight = {"Hips": 0.15, side: 0.85}
        pocket = [
            point((inner_x, y_front, z_bottom), pocket_weight),
            point((inner_x, y_back, z_bottom), pocket_weight),
            point((inner_x, y_back, z_top), pocket_weight),
            point((inner_x, y_front, z_top), pocket_weight),
            point((outer_x, y_front, z_bottom), pocket_weight),
            point((outer_x, y_back, z_bottom), pocket_weight),
            point((outer_x, y_back, z_top), pocket_weight),
            point((outer_x, y_front, z_top), pocket_weight),
        ]
        pocket_faces = (
            (0, 1, 2, 3),
            (4, 7, 6, 5),
            (0, 4, 5, 1),
            (1, 5, 6, 2),
            (2, 6, 7, 3),
            (3, 7, 4, 0),
        )
        for face in pocket_faces:
            mapped = tuple(pocket[index] for index in face)
            faces.append(mapped if sign > 0.0 else tuple(reversed(mapped)))

    geometry = bpy.data.meshes.new("streetwear-cargo-shorts-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-cargo-shorts", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_authored_shoe(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]], bpy.types.Object, list[dict[str, float]]]:
    """Create a broad low-poly skate shoe with a distinct platform sole."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.31
    target_inverse = target_matrix.inverted()

    def volume(
        name: str,
        specifications: tuple[tuple[float, float, float, float], ...],
        close_bottom: bool,
        close_top: bool,
    ) -> tuple[bpy.types.Object, list[dict[str, float]]]:
        vertices: list[tuple[float, float, float]] = []
        faces: list[tuple[int, ...]] = []
        weights: list[dict[str, float]] = []
        rings: list[list[int]] = []
        segments = 18
        for z, radius_x, radius_y, center_y in specifications:
            ring: list[int] = []
            for index in range(segments):
                angle = (index / segments) * math.tau
                cosine = math.cos(angle)
                sine = math.sin(angle)
                x = center_x + math.copysign(abs(cosine) ** 0.40, cosine) * radius_x
                y = center_y + math.copysign(abs(sine) ** 0.40, sine) * radius_y
                ring.append(len(vertices))
                vertices.append(tuple(target_inverse @ Vector((x, y, z))))
                weights.append({f"{side}Foot": 1.0})
            rings.append(ring)
        for ring_index in range(len(rings) - 1):
            for index in range(segments):
                following = (index + 1) % segments
                faces.append((rings[ring_index][index], rings[ring_index][following], rings[ring_index + 1][following], rings[ring_index + 1][index]))
        if close_bottom:
            faces.append(tuple(reversed(rings[0])))
        if close_top:
            faces.append(tuple(rings[-1]))
        geometry = bpy.data.meshes.new(f"{name}-geometry")
        geometry.from_pydata(vertices, [], faces)
        geometry.update()
        mesh = bpy.data.objects.new(name, geometry)
        bpy.context.collection.objects.link(mesh)
        mesh.matrix_world = target_matrix
        return mesh, weights

    sole, sole_weights = volume(
        f"streetwear-{side.lower()}-sole",
        (
            (-0.02, 0.27, 0.34, 0.04),
            (0.045, 0.275, 0.345, 0.04),
            (0.11, 0.27, 0.34, 0.04),
        ),
        True,
        True,
    )
    upper, upper_weights = volume(
        f"streetwear-{side.lower()}-shoe-upper",
        (
            (0.09, 0.245, 0.31, 0.04),
            (0.17, 0.240, 0.30, 0.04),
            (0.25, 0.22, 0.27, 0.03),
            (0.32, 0.20, 0.23, -0.01),
            (0.38, 0.17, 0.17, -0.06),
        ),
        False,
        False,
    )
    return upper, upper_weights, sole, sole_weights


def create_refined_hoodie(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Build one continuous cropped hoodie silhouette with integrated sleeves."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float], weight: dict[str, float]) -> int:
        vertices.append(tuple(target_inverse @ Vector(world)))
        weights.append(weight)
        return len(vertices) - 1

    def bridge(first: list[int], second: list[int]) -> None:
        for index in range(len(first)):
            following = (index + 1) % len(first)
            faces.append((first[index], first[following], second[following], second[index]))

    def torso_ring(z: float, rx: float, ry: float, weight: dict[str, float]) -> list[int]:
        result: list[int] = []
        for index in range(24):
            angle = index / 24 * math.tau
            cosine, sine = math.cos(angle), math.sin(angle)
            result.append(point((
                math.copysign(abs(cosine) ** 0.78, cosine) * rx,
                math.copysign(abs(sine) ** 0.82, sine) * ry,
                z - 0.030 * max(0.0, -sine) if z < 2.05 else z,
            ), weight))
        return result

    torso = (
        torso_ring(1.90, 0.43, 0.175, {"Spine": 1.0}),
        torso_ring(2.13, 0.46, 0.195, {"Spine": 0.55, "Chest": 0.45}),
        torso_ring(2.38, 0.47, 0.205, {"Chest": 0.42, "UpperChest": 0.58}),
        torso_ring(2.57, 0.46, 0.225, {"UpperChest": 1.0}),
    )
    for first, second in zip(torso, torso[1:]):
        bridge(first, second)

    # Each sleeve is one tapered cloth tube whose oversized shoulder root is
    # buried deeply into the torso shell. The visible shoulder seam is added as
    # a shallow band, but there is no exposed armhole or separate pod joint.
    sleeve_profile = tuple((math.sin(i / 16 * math.tau), math.cos(i / 16 * math.tau)) for i in range(16))
    for sign, side in ((-1.0, "Right"), (1.0, "Left")):
        specs = (
            (0.34, 2.43, 0.225, 0.235, {"UpperChest": 0.40, f"{side}Shoulder": 0.40, f"{side}Arm": 0.20}),
            (0.49, 2.39, 0.230, 0.225, {f"{side}Shoulder": 0.25, f"{side}Arm": 0.75}),
            (0.67, 2.33, 0.205, 0.190, {f"{side}Arm": 0.52, f"{side}ForeArm": 0.48}),
            (0.83, 2.28, 0.170, 0.145, {f"{side}ForeArm": 0.82, f"{side}Hand": 0.18}),
            (0.91, 2.27, 0.125, 0.105, {f"{side}ForeArm": 0.58, f"{side}Hand": 0.42}),
        )
        sleeve_rings: list[list[int]] = []
        for distance, z, radius_y, radius_z, weight in specs:
            sleeve_rings.append([
                point((sign * distance, py * radius_y, z + pz * radius_z), weight)
                for py, pz in sleeve_profile
            ])
        for first, second in zip(sleeve_rings, sleeve_rings[1:]):
            bridge(first, second)
        faces.append(tuple(reversed(sleeve_rings[0])))
        faces.append(tuple(sleeve_rings[-1]))

        seam_outer = sleeve_rings[1]
        seam_inner = [
            point((sign * 0.505, py * 0.205, 2.385 + pz * 0.198), {f"{side}Shoulder": 0.25, f"{side}Arm": 0.75})
            for py, pz in sleeve_profile
        ]
        bridge(seam_outer, seam_inner)

    # A thick low collar wraps the neck and physically overlaps both the torso
    # and hood bag. The opening stays wider at the front for the target V read.
    collar_outer: list[int] = []
    collar_inner: list[int] = []
    collar_lower: list[int] = []
    collar_weight = {"UpperChest": 0.45, "Neck": 0.55}
    for index in range(24):
        angle = index / 24 * math.tau
        cosine, sine = math.cos(angle), math.sin(angle)
        front = max(0.0, -sine)
        z = 2.60 + 0.07 * max(0.0, sine) - 0.11 * front
        collar_outer.append(point((cosine * 0.275, sine * 0.205, z), collar_weight))
        collar_inner.append(point((cosine * 0.170, sine * 0.115, z + 0.008), collar_weight))
        collar_lower.append(point((cosine * 0.275, sine * 0.205, z - 0.115), collar_weight))
    bridge(collar_lower, collar_outer)
    for index in range(24):
        following = (index + 1) % 24
        faces.append((collar_outer[index], collar_outer[following], collar_inner[following], collar_inner[index]))

    # Two front lapels close the rectangular neck gap into the target's clean V.
    lapel_weight = {"UpperChest": 0.42, "Neck": 0.58}
    left_lapel = (
        point((-0.275, -0.225, 2.61), lapel_weight),
        point((-0.055, -0.232, 2.47), lapel_weight),
        point((-0.155, -0.232, 2.62), lapel_weight),
    )
    right_lapel = (
        point((0.155, -0.232, 2.62), lapel_weight),
        point((0.055, -0.232, 2.47), lapel_weight),
        point((0.275, -0.225, 2.61), lapel_weight),
    )
    faces.extend((left_lapel, right_lapel))

    # Broad double-sided hood shell wrapping the back and sides of the neck.
    hood_rows = (
        (2.42, 0.25, 0.29, 0.235, {"UpperChest": 0.92, "Neck": 0.08}),
        (2.50, 0.31, 0.35, 0.255, {"UpperChest": 0.78, "Neck": 0.22}),
        (2.59, 0.33, 0.38, 0.270, {"UpperChest": 0.58, "Neck": 0.42}),
        (2.67, 0.29, 0.36, 0.255, {"UpperChest": 0.40, "Neck": 0.60}),
        (2.72, 0.22, 0.32, 0.230, {"UpperChest": 0.28, "Neck": 0.72}),
    )
    outer_rows: list[list[int]] = []
    inner_rows: list[list[int]] = []
    for z, half_width, outer_y, inner_y, weight in hood_rows:
        outer_rows.append([
            point(((-1.0 + index / 6) * half_width, outer_y - 0.05 * abs(-1.0 + index / 6), z + 0.025 * abs(-1.0 + index / 6)), weight)
            for index in range(13)
        ])
        inner_rows.append([
            point(((-1.0 + index / 6) * half_width, inner_y, z + 0.020 * abs(-1.0 + index / 6)), weight)
            for index in range(13)
        ])
    for first, second in zip(outer_rows, outer_rows[1:]):
        for index in range(12):
            faces.append((first[index], second[index], second[index + 1], first[index + 1]))
    for first, second in zip(inner_rows, inner_rows[1:]):
        for index in range(12):
            faces.append((first[index], first[index + 1], second[index + 1], second[index]))
    for row_index in range(len(outer_rows) - 1):
        faces.append((outer_rows[row_index][0], inner_rows[row_index][0], inner_rows[row_index + 1][0], outer_rows[row_index + 1][0]))
        faces.append((outer_rows[row_index][-1], outer_rows[row_index + 1][-1], inner_rows[row_index + 1][-1], inner_rows[row_index][-1]))

    geometry = bpy.data.meshes.new("streetwear-hoodie-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-hoodie", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_sculpted_hoodie(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Create one watertight sculpt-style hoodie from overlapping cloth masses."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    segments = 24

    def add_loft(axis: str, specs: tuple[tuple[tuple[float, float, float], float, float], ...]) -> None:
        rings: list[list[int]] = []
        for center, radius_a, radius_b in specs:
            ring: list[int] = []
            for index in range(segments):
                angle = index / segments * math.tau
                cosine, sine = math.cos(angle), math.sin(angle)
                ring.append(len(vertices))
                if axis == "z":
                    vertices.append((center[0] + cosine * radius_a, center[1] + sine * radius_b, center[2]))
                elif axis == "x":
                    vertices.append((center[0], center[1] + cosine * radius_a, center[2] + sine * radius_b))
                else:
                    raise RuntimeError(axis)
            rings.append(ring)
        faces.append(tuple(reversed(rings[0])))
        for first, second in zip(rings, rings[1:]):
            for index in range(segments):
                following = (index + 1) % segments
                faces.append((first[index], first[following], second[following], second[index]))
        faces.append(tuple(rings[-1]))

    add_loft("z", (
        ((0.0, 0.0, 1.89), 0.43, 0.175),
        ((0.0, 0.0, 2.12), 0.46, 0.195),
        ((0.0, 0.0, 2.38), 0.48, 0.205),
        ((0.0, 0.0, 2.56), 0.43, 0.195),
    ))
    for sign in (-1.0, 1.0):
        add_loft("x", (
            ((sign * 0.34, 0.0, 2.43), 0.190, 0.195),
            ((sign * 0.50, 0.0, 2.39), 0.185, 0.180),
            ((sign * 0.68, 0.0, 2.33), 0.170, 0.155),
            ((sign * 0.84, 0.0, 2.29), 0.145, 0.125),
            ((sign * 0.91, 0.0, 2.28), 0.115, 0.095),
        ))
    # Thick neck roll: a closed elliptical torus that joins the front neckline
    # to the folded hood and prevents the torso from reading as an open slab.
    major_segments = 24
    minor_segments = 10
    torus_rings: list[list[int]] = []
    for major_index in range(major_segments):
        major_angle = major_index / major_segments * math.tau
        cosine, sine = math.cos(major_angle), math.sin(major_angle)
        center_z = 2.585 + 0.045 * max(0.0, sine) - 0.035 * max(0.0, -sine)
        ring: list[int] = []
        for minor_index in range(minor_segments):
            minor_angle = minor_index / minor_segments * math.tau
            radial = math.cos(minor_angle) * 0.055
            ring.append(len(vertices))
            vertices.append((
                cosine * (0.225 + radial),
                sine * (0.155 + radial),
                center_z + math.sin(minor_angle) * 0.055,
            ))
        torus_rings.append(ring)
    for first, second in zip(torus_rings, torus_rings[1:] + torus_rings[:1]):
        for index in range(minor_segments):
            following = (index + 1) % minor_segments
            faces.append((first[index], first[following], second[following], second[index]))
    # The hood is a folded bag around the back of the neck, not a detached ball.
    add_loft("z", (
        ((0.0, 0.18, 2.43), 0.255, 0.145),
        ((0.0, 0.25, 2.54), 0.335, 0.175),
        ((0.0, 0.29, 2.65), 0.315, 0.155),
        ((0.0, 0.255, 2.74), 0.215, 0.110),
    ))

    geometry = bpy.data.meshes.new("streetwear-hoodie-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-hoodie", geometry)
    bpy.context.collection.objects.link(mesh)
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    mesh.data.remesh_voxel_size = 0.022
    mesh.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.voxel_remesh()
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    for _ in range(2):
        bpy.ops.mesh.vertices_smooth(factor=0.28)
    bpy.ops.object.mode_set(mode="OBJECT")
    for polygon in mesh.data.polygons:
        polygon.use_smooth = True

    # Voxel remesh was performed in stable world coordinates. Convert the
    # approved surface into the target rig's local frame only afterwards.
    target_inverse = target_matrix.inverted()
    for vertex in mesh.data.vertices:
        vertex.co = target_inverse @ vertex.co
    mesh.matrix_world = target_matrix
    weights = spatial_weights(mesh, "upper")
    mesh.select_set(False)
    return mesh, weights


def create_refined_undershirt(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Create a thin conforming shirt-tail shell with a curved hem and open side slits."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def point(world: tuple[float, float, float], weight: dict[str, float]) -> int:
        vertices.append(tuple(target_inverse @ Vector(world)))
        weights.append(weight)
        return len(vertices) - 1

    outline = (
        (-0.41, 1.98), (-0.43, 1.82), (-0.37, 1.80), (-0.30, 1.77),
        (-0.16, 1.75), (0.00, 1.74), (0.16, 1.75), (0.30, 1.77),
        (0.37, 1.80), (0.43, 1.82), (0.41, 1.98),
    )

    def cloth_depth(z: float) -> float:
        # Keep the hidden upper layer behind the hoodie, then let only the
        # free shirt-tail flare forward. This removes the rigid cream belt and
        # the coplanar intersection that cut a false notch into the hoodie.
        return 0.145 + max(0.0, min(1.0, (1.88 - z) / 0.14)) * 0.032

    front = [point((x, -cloth_depth(z), z), {"Spine": 1.0}) for x, z in outline]
    rear = [point((x, cloth_depth(z), z + (0.025 if abs(x) < 0.30 and z < 1.80 else 0.0)), {"Spine": 1.0}) for x, z in outline]
    faces.append(tuple(front))
    faces.append(tuple(reversed(rear)))
    # Close the hidden top and upper side seams, while leaving both lower side
    # slits and the curved shirt-tail hem visibly thin and open.
    faces.append((front[0], front[-1], rear[-1], rear[0]))
    faces.append((front[0], rear[0], rear[1], front[1]))
    faces.append((front[-2], rear[-2], rear[-1], front[-1]))

    geometry = bpy.data.meshes.new("streetwear-undershirt-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-undershirt", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_refined_cargo_shorts(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Build rounded low-crotch cargo volumes with independent leg openings."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    target_inverse = target_matrix.inverted()

    def weight_for(x: float, z: float) -> dict[str, float]:
        if z > 1.42 or abs(x) < 0.12:
            return {"Hips": 1.0}
        side = "LeftUpLeg" if x > 0 else "RightUpLeg"
        blend = max(0.30, min(0.82, (1.46 - z) / 0.58))
        return {"Hips": 1.0 - blend, side: blend}

    def add_loft(specs: tuple[tuple[float, float, float, float], ...]) -> None:
        rings: list[list[int]] = []
        segments = 20
        for center_x, center_z, radius_x, radius_y in specs:
            ring: list[int] = []
            for index in range(segments):
                angle = index / segments * math.tau
                cosine, sine = math.cos(angle), math.sin(angle)
                x = center_x + math.copysign(abs(cosine) ** 0.74, cosine) * radius_x
                y = math.copysign(abs(sine) ** 0.78, sine) * radius_y
                ring.append(len(vertices))
                vertices.append(tuple(target_inverse @ Vector((x, y, center_z))))
                weights.append(weight_for(x, center_z))
            rings.append(ring)
        faces.append(tuple(reversed(rings[0])))
        for first, second in zip(rings, rings[1:]):
            for index in range(segments):
                following = (index + 1) % segments
                faces.append((first[index], first[following], second[following], second[index]))
        faces.append(tuple(rings[-1]))

    # A narrow waistband feeds into two rounded hanging cloth legs. The three
    # closed volumes overlap only near the hips, preserving a low crotch and
    # independent hem openings instead of one extruded front/back board.
    add_loft(((0.0, 1.72, 0.39, 0.175), (0.0, 1.53, 0.42, 0.205), (0.0, 1.35, 0.43, 0.215)))
    add_loft(((-0.23, 1.43, 0.235, 0.205), (-0.255, 1.22, 0.270, 0.215), (-0.270, 1.00, 0.255, 0.200), (-0.270, 0.86, 0.205, 0.175)))
    add_loft(((0.23, 1.43, 0.235, 0.205), (0.255, 1.22, 0.270, 0.215), (0.270, 1.00, 0.255, 0.200), (0.270, 0.86, 0.205, 0.175)))

    def add_pocket(sign: float) -> None:
        side = "LeftUpLeg" if sign > 0 else "RightUpLeg"
        weight = {"Hips": 0.12, side: 0.88}
        x_inner, x_outer = sign * 0.455, sign * 0.545
        if sign < 0:
            x_inner, x_outer = x_outer, x_inner
        start = len(vertices)
        for x, y, z in (
            (x_inner, -0.17, 0.94), (x_inner, 0.13, 0.94), (x_inner, 0.13, 1.25), (x_inner, -0.17, 1.25),
            (x_outer, -0.15, 0.98), (x_outer, 0.11, 0.98), (x_outer, 0.11, 1.21), (x_outer, -0.15, 1.21),
        ):
            vertices.append(tuple(target_inverse @ Vector((x, y, z))))
            weights.append(weight)
        for face in ((0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
            faces.append(tuple(start + item for item in face))

    add_pocket(-1.0)
    add_pocket(1.0)

    geometry = bpy.data.meshes.new("streetwear-cargo-shorts-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-cargo-shorts", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_refined_shoe(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]], bpy.types.Object, list[dict[str, float]]]:
    """Build a forward-facing enclosed skate shoe with sole, heel, vamp and toe hierarchy."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.31
    target_inverse = target_matrix.inverted()

    def build_volume(
        name: str,
        specs: tuple[tuple[float, float, float, float], ...],
        additions: bool = False,
    ) -> tuple[bpy.types.Object, list[dict[str, float]]]:
        vertices: list[tuple[float, float, float]] = []
        faces: list[tuple[int, ...]] = []
        weights: list[dict[str, float]] = []

        def add_rings(ring_specs: tuple[tuple[float, float, float, float], ...], segments: int = 16) -> None:
            rings: list[list[int]] = []
            for y, center_z, radius_x, radius_z in ring_specs:
                ring: list[int] = []
                for index in range(segments):
                    angle = index / segments * math.tau
                    cosine, sine = math.cos(angle), math.sin(angle)
                    x = center_x + math.copysign(abs(cosine) ** 0.58, cosine) * radius_x
                    z = center_z + math.copysign(abs(sine) ** 0.70, sine) * radius_z
                    ring.append(len(vertices))
                    vertices.append(tuple(target_inverse @ Vector((x, y, z))))
                    weights.append({f"{side}Foot": 1.0})
                rings.append(ring)
            faces.append(tuple(reversed(rings[0])))
            for first, second in zip(rings, rings[1:]):
                for index in range(segments):
                    following = (index + 1) % segments
                    faces.append((first[index], first[following], second[following], second[index]))
            faces.append(tuple(rings[-1]))

        add_rings(specs)
        if "sole" in name:
            # A second closed platform layer creates the heavy skate-shoe base
            # without exposing the foot or collapsing into one inflated tube.
            add_rings((
                (0.18, 0.155, 0.218, 0.090),
                (0.00, 0.150, 0.250, 0.092),
                (-0.24, 0.150, 0.282, 0.095),
                (-0.47, 0.155, 0.270, 0.088),
                (-0.56, 0.165, 0.215, 0.075),
            ))
        if additions:
            # Toe cap, heel counter, and tongue remain semantic overlapping
            # construction layers. Their hierarchy follows the shoe sheet and
            # keeps the silhouette chunky without returning to pizza wedges.
            add_rings(((-0.30, 0.298, 0.270, 0.070), (-0.46, 0.272, 0.255, 0.065), (-0.535, 0.245, 0.190, 0.052)), 18)
            add_rings(((0.17, 0.330, 0.210, 0.185), (0.095, 0.365, 0.220, 0.205), (0.015, 0.350, 0.215, 0.170)), 18)
            add_rings(((-0.24, 0.330, 0.150, 0.050), (-0.05, 0.430, 0.118, 0.090)), 12)

        geometry = bpy.data.meshes.new(f"{name}-geometry")
        geometry.from_pydata(vertices, [], faces)
        geometry.update()
        mesh = bpy.data.objects.new(name, geometry)
        bpy.context.collection.objects.link(mesh)
        mesh.matrix_world = target_matrix
        return mesh, weights

    sole, sole_weights = build_volume(
        f"streetwear-{side.lower()}-sole",
        (
            (0.20, 0.075, 0.225, 0.075),
            (0.03, 0.070, 0.255, 0.078),
            (-0.22, 0.070, 0.292, 0.080),
            (-0.47, 0.075, 0.285, 0.078),
            (-0.58, 0.085, 0.225, 0.068),
        ),
    )
    upper, upper_weights = build_volume(
        f"streetwear-{side.lower()}-shoe-upper",
        (
            (0.16, 0.335, 0.205, 0.205),
            (0.04, 0.345, 0.220, 0.180),
            (-0.10, 0.315, 0.238, 0.145),
            (-0.28, 0.285, 0.270, 0.120),
            (-0.45, 0.255, 0.260, 0.095),
            (-0.53, 0.235, 0.205, 0.072),
        ),
        additions=True,
    )
    return upper, upper_weights, sole, sole_weights


def create_authored_shoe_laces(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Add broad crossed lace straps that clarify vamp direction at a glance."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.31
    target_inverse = target_matrix.inverted()
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    weights: list[dict[str, float]] = []
    for row, y in enumerate((-0.08, -0.16, -0.24)):
        z = 0.445 - row * 0.050
        half_width = 0.158 + row * 0.008
        skew = 0.026 if row % 2 == 0 else -0.026
        start = len(vertices)
        for x, yy, zz in (
            (center_x - half_width, y + skew, z - 0.010),
            (center_x + half_width, y - skew, z - 0.010),
            (center_x + half_width, y - skew, z + 0.018),
            (center_x - half_width, y + skew, z + 0.018),
        ):
            vertices.append(tuple(target_inverse @ Vector((x, yy, zz))))
            weights.append({f"{side}Foot": 1.0})
        faces.append((start, start + 1, start + 2, start + 3))
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-shoe-laces-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-shoe-laces", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, weights


def create_authored_brow(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Add a strong asymmetrically sloped brow to restore target-like appeal."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.083
    target_inverse = target_matrix.inverted()
    inner_z = 2.940
    outer_z = 2.932
    inner_x = center_x - sign * 0.050
    outer_x = center_x + sign * 0.052
    vertices = [
        tuple(target_inverse @ Vector((inner_x, -0.217, inner_z))),
        tuple(target_inverse @ Vector((outer_x, -0.209, outer_z))),
        tuple(target_inverse @ Vector((outer_x, -0.214, outer_z - 0.022))),
        tuple(target_inverse @ Vector((inner_x, -0.218, inner_z - 0.019))),
    ]
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-brow-geometry")
    geometry.from_pydata(vertices, [], [(0, 1, 2, 3)])
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-brow", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_authored_mouth(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Replace the donor lip read with one restrained target-like mouth line."""
    target_inverse = target_matrix.inverted()
    vertices = [
        tuple(target_inverse @ Vector((-0.047, -0.218, 2.765))),
        tuple(target_inverse @ Vector((0.047, -0.218, 2.765))),
        tuple(target_inverse @ Vector((0.040, -0.219, 2.758))),
        tuple(target_inverse @ Vector((-0.040, -0.219, 2.758))),
    ]
    geometry = bpy.data.meshes.new("streetwear-mouth-geometry")
    geometry.from_pydata(vertices, [], [(0, 1, 2, 3)])
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-mouth", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_stylized_head(target_matrix: Matrix) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Build a clean anime-proportioned head instead of preserving the failed donor face."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    target_inverse = target_matrix.inverted()

    def add_ellipsoid(center: tuple[float, float, float], radii: tuple[float, float, float], taper_chin: bool = False) -> None:
        start = len(vertices)
        segments = 24
        latitude_rings = 12
        local_rings: list[list[int]] = []
        bottom = len(vertices)
        vertices.append(tuple(target_inverse @ Vector((center[0], center[1], center[2] - radii[2]))))
        for latitude_index in range(1, latitude_rings + 1):
            phi = -math.pi * 0.5 + latitude_index / (latitude_rings + 1) * math.pi
            radial = math.cos(phi)
            z = center[2] + math.sin(phi) * radii[2]
            if taper_chin and z < center[2]:
                normalized = max(0.0, min(1.0, (z - (center[2] - radii[2])) / radii[2]))
                x_taper = 0.72 + 0.28 * normalized
            else:
                x_taper = 1.0
            ring: list[int] = []
            for segment_index in range(segments):
                angle = segment_index / segments * math.tau
                ring.append(len(vertices))
                world = Vector((
                    center[0] + math.cos(angle) * radii[0] * radial * x_taper,
                    center[1] + math.sin(angle) * radii[1] * radial,
                    z,
                ))
                vertices.append(tuple(target_inverse @ world))
            local_rings.append(ring)
        top = len(vertices)
        vertices.append(tuple(target_inverse @ Vector((center[0], center[1], center[2] + radii[2]))))
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((bottom, local_rings[0][following], local_rings[0][index]))
        for first, second in zip(local_rings, local_rings[1:]):
            for index in range(segments):
                following = (index + 1) % segments
                faces.append((first[index], first[following], second[following], second[index]))
        for index in range(segments):
            following = (index + 1) % segments
            faces.append((local_rings[-1][index], local_rings[-1][following], top))

    add_ellipsoid((0.0, 0.0, 2.885), (0.255, 0.205, 0.285), taper_chin=True)
    add_ellipsoid((-0.250, 0.002, 2.890), (0.058, 0.038, 0.082))
    add_ellipsoid((0.250, 0.002, 2.890), (0.058, 0.038, 0.082))

    # One restrained low-poly nose wedge supplies the profile landmark without
    # reintroducing the donor's realistic facial volume.
    nose_start = len(vertices)
    for world in (
        (-0.026, -0.198, 2.915), (0.026, -0.198, 2.915),
        (0.022, -0.198, 2.835), (-0.022, -0.198, 2.835),
        (0.0, -0.246, 2.865),
    ):
        vertices.append(tuple(target_inverse @ Vector(world)))
    faces.extend(tuple(nose_start + item for item in face) for face in (
        (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4), (0, 3, 2, 1),
    ))

    geometry = bpy.data.meshes.new("streetwear-head-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new("streetwear-head", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    for polygon in mesh.data.polygons:
        polygon.use_smooth = True
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_authored_pupil(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Add a readable dark pupil over the warm donor eye surface."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.081
    # Sit the pupil just proud of the sclera while keeping the complete eye
    # assembly inside the donor's brow/cheek silhouette. The old -0.281 plane
    # was roughly seven centimetres in front of the face in profile.
    center_y = -0.212
    center_z = 2.902
    target_inverse = target_matrix.inverted()
    vertices = [tuple(target_inverse @ Vector((center_x, center_y, center_z)))]
    boundary = (
        (-1.0, 0.0),
        (-0.48, 0.70),
        (0.0, 1.0),
        (0.52, 0.68),
        (1.0, 0.0),
        (0.50, -0.58),
        (0.0, -0.72),
        (-0.52, -0.60),
    )
    for horizontal, vertical in boundary:
        recessed_y = center_y + 0.0005 + 0.0015 * sign * horizontal
        vertices.append(tuple(target_inverse @ Vector((
            center_x + horizontal * 0.030,
            recessed_y,
            center_z + vertical * 0.013,
        ))))
    faces = []
    for index in range(len(boundary)):
        following = 1 + ((index + 1) % len(boundary))
        faces.append((0, following, 1 + index))
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-pupil-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-pupil", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_authored_sclera(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Create a shallow sleepy almond eye plate that cannot read as an empty socket."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.081
    center_y = -0.208
    center_z = 2.902
    target_inverse = target_matrix.inverted()
    vertices = [tuple(target_inverse @ Vector((center_x, center_y, center_z)))]
    boundary = (
        (-1.0, 0.0),
        (-0.58, 0.72),
        (0.0, 1.0),
        (0.62, 0.68),
        (1.0, 0.0),
        (0.56, -0.58),
        (0.0, -0.78),
        (-0.60, -0.62),
    )
    for horizontal, vertical in boundary:
        recessed_y = center_y + 0.0010 + 0.002 * sign * horizontal
        vertices.append(tuple(target_inverse @ Vector((
            center_x + horizontal * 0.043,
            recessed_y,
            center_z + vertical * 0.015,
        ))))
    faces = []
    for index in range(len(boundary)):
        following = 1 + ((index + 1) % len(boundary))
        faces.append((0, following, 1 + index))
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-sclera-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-sclera", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_authored_socket_fill(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Fill the donor's empty eye cavity behind the authored almond."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.081
    target_inverse = target_matrix.inverted()
    vertices = [tuple(target_inverse @ Vector((center_x, -0.204, 2.902)))]
    boundary = (
        (-1.0, 0.0),
        (-0.72, 0.70),
        (0.0, 1.0),
        (0.72, 0.70),
        (1.0, 0.0),
        (0.72, -0.70),
        (0.0, -1.0),
        (-0.72, -0.70),
    )
    for horizontal, vertical in boundary:
        world = Vector((
            center_x + horizontal * 0.060,
            -0.204 + 0.002 * sign * horizontal,
            2.902 + vertical * 0.024,
        ))
        vertices.append(tuple(target_inverse @ world))
    faces = []
    for index in range(len(boundary)):
        following = 1 + ((index + 1) % len(boundary))
        faces.append((0, following, 1 + index))
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-socket-fill-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-socket-fill", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def create_authored_upper_lid(
    target_matrix: Matrix,
    side: str,
) -> tuple[bpy.types.Object, list[dict[str, float]]]:
    """Frame the almond with a thin upper contour and no lower wrap."""
    sign = 1.0 if side == "Left" else -1.0
    center_x = sign * 0.081
    target_inverse = target_matrix.inverted()
    contour = (
        (-1.0, 0.0, 0.0),
        (-0.58, 0.72, 0.0070),
        (0.0, 1.0, 0.0090),
        (0.62, 0.68, 0.0070),
        (1.0, 0.0, 0.0),
    )
    vertices: list[tuple[float, float, float]] = []
    for horizontal, vertical, _thickness in contour:
        world = Vector((
            center_x + horizontal * 0.046,
            -0.213 + 0.002 * sign * horizontal,
            2.902 + vertical * 0.015,
        ))
        vertices.append(tuple(target_inverse @ world))
    for horizontal, vertical, thickness in contour:
        world = Vector((
            center_x + horizontal * 0.046,
            -0.213 + 0.002 * sign * horizontal,
            2.902 + vertical * 0.015 - thickness,
        ))
        vertices.append(tuple(target_inverse @ world))
    faces = []
    span = len(contour)
    for index in range(span - 1):
        faces.append((index, index + 1, span + index + 1, span + index))
    geometry = bpy.data.meshes.new(f"streetwear-{side.lower()}-eye-upper-lid-geometry")
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    mesh = bpy.data.objects.new(f"streetwear-{side.lower()}-eye-upper-lid", geometry)
    bpy.context.collection.objects.link(mesh)
    mesh.matrix_world = target_matrix
    return mesh, [{"Head": 1.0} for _ in vertices]


def spatial_weights(mesh: bpy.types.Object, garment: str) -> list[dict[str, float]]:
    minimum, maximum = world_bounds(mesh)
    center_x = (minimum.x + maximum.x) * 0.5
    half_width = max((maximum.x - minimum.x) * 0.5, 1e-6)
    captured: list[dict[str, float]] = []
    for vertex in mesh.data.vertices:
        point = mesh.matrix_world @ vertex.co
        nx = (point.x - center_x) / half_width
        if garment == "upper":
            side = "Left" if point.x >= center_x else "Right"
            reach = abs(nx)
            if reach > 0.82:
                bone = f"{side}Hand"
            elif reach > 0.60:
                bone = f"{side}ForeArm"
            elif reach > 0.36:
                bone = f"{side}Arm"
            elif reach > 0.22:
                bone = f"{side}Shoulder"
            elif point.z > minimum.z + (maximum.z - minimum.z) * 0.64:
                bone = "UpperChest"
            elif point.z > minimum.z + (maximum.z - minimum.z) * 0.30:
                bone = "Chest"
            else:
                bone = "Spine"
        elif garment == "shorts":
            if abs(nx) < 0.18:
                bone = "Hips"
            else:
                bone = "LeftUpLeg" if point.x >= center_x else "RightUpLeg"
        else:
            raise RuntimeError(f"unknown garment weight mode {garment}")
        captured.append({bone: 1.0})
    return captured


def seated_shorts_weights(mesh: bpy.types.Object) -> list[dict[str, float]]:
    """Keep the crotch stable while allowing each short leg to follow its thigh.

    The former nearest-surface transfer gave single triangles competing Hips,
    LeftUpLeg, and RightUpLeg weights. Deep seated hip flexion then inverted
    those triangles into the visible fan-shaped wedges. This distribution keeps
    the centre/waist hip-rigid and introduces only a two-bone blend per leg.
    """
    minimum, maximum = world_bounds(mesh)
    center_x = (minimum.x + maximum.x) * 0.5
    half_width = max((maximum.x - minimum.x) * 0.5, 1e-6)
    height = max(maximum.z - minimum.z, 1e-6)
    captured: list[dict[str, float]] = []
    for vertex in mesh.data.vertices:
        point = mesh.matrix_world @ vertex.co
        nx = (point.x - center_x) / half_width
        nz = (point.z - minimum.z) / height
        lateral = max(0.0, min(1.0, (abs(nx) - 0.16) / 0.42))
        lower = max(0.0, min(1.0, (0.78 - nz) / 0.42))
        thigh_weight = (lateral * lateral * (3.0 - 2.0 * lateral)) * (lower * lower * (3.0 - 2.0 * lower))
        if thigh_weight < 0.02:
            captured.append({"Hips": 1.0})
            continue
        side = "LeftUpLeg" if nx >= 0 else "RightUpLeg"
        captured.append({"Hips": 1.0 - thigh_weight, side: thigh_weight})
    return captured


def remove_lower_body_influences(weights: list[dict[str, float]]) -> list[dict[str, float]]:
    lower_bones = {"Hips", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg", "LeftFoot", "RightFoot"}
    cleaned: list[dict[str, float]] = []
    for row in weights:
        upper = {name: value for name, value in row.items() if name not in lower_bones}
        removed = sum(value for name, value in row.items() if name in lower_bones)
        upper["Spine"] = upper.get("Spine", 0.0) + removed
        total = sum(upper.values())
        cleaned.append({name: value / total for name, value in upper.items()})
    return cleaned


def nearest_surface_weights(source: bpy.types.Object, target: bpy.types.Object) -> list[dict[str, float]]:
    source_group_names = {group.index: group.name for group in source.vertex_groups}
    source_matrix = source.matrix_world.copy()
    target_matrix = target.matrix_world.copy()
    tree = KDTree(len(source.data.vertices))
    rows: list[dict[str, float]] = []
    for vertex in source.data.vertices:
        tree.insert(source_matrix @ vertex.co, vertex.index)
        row = {
            source_group_names[item.group]: item.weight
            for item in vertex.groups
            if item.weight > 1e-5
        }
        rows.append(row or {"Hips": 1.0})
    tree.balance()
    captured: list[dict[str, float]] = []
    for vertex in target.data.vertices:
        blended: dict[str, float] = {}
        total_influence = 0.0
        for _co, source_index, distance in tree.find_n(target_matrix @ vertex.co, 6):
            influence = 1.0 / ((distance + 0.02) ** 2)
            total_influence += influence
            for group_name, group_weight in rows[source_index].items():
                blended[group_name] = blended.get(group_name, 0.0) + group_weight * influence
        normalized = {
            group_name: value / total_influence
            for group_name, value in blended.items()
            if value / total_influence > 0.01
        }
        strongest = sorted(normalized.items(), key=lambda item: item[1], reverse=True)[:4]
        strongest_total = sum(value for _name, value in strongest)
        captured.append({name: value / strongest_total for name, value in strongest})
    return captured


def bind_mesh(
    mesh: bpy.types.Object,
    name: str,
    weights: list[dict[str, float]],
    armature: bpy.types.Object,
) -> bpy.types.Object:
    mesh.name = name
    mesh.data.name = f"{name}-geometry"
    mesh.data.materials.clear()
    replace_weights(mesh, weights)

    # The authored garments start from deliberately sparse, readable control
    # cages.  Subdivide those cages once before skinning so curved cloth and
    # footwear silhouettes do not read as cylinders or boxes at gameplay
    # distance.  Keep anatomy, hair, and the reviewed eye assembly untouched.
    is_structured_authored_piece = (
        name in {"streetwear-hoodie", "streetwear-cargo-shorts"}
        or "shoe" in name
        or "sole" in name
    )
    if is_structured_authored_piece and len(mesh.data.vertices) < 3000:
        bevel = mesh.modifiers.new(name="Reviewed structured edge softness", type="BEVEL")
        bevel.width = 0.018 if name == "streetwear-hoodie" else (0.024 if "shoe" in name or "sole" in name else 0.050)
        bevel.segments = 2
        bevel.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = mesh
        mesh.select_set(True)
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
        mesh.select_set(False)
        for polygon in mesh.data.polygons:
            polygon.use_smooth = True

    mesh.parent = armature
    mesh.matrix_parent_inverse = Matrix.Identity(4)
    mesh.matrix_basis = Matrix.Identity(4)
    modifier = mesh.modifiers.new(name="Kenney runtime armature", type="ARMATURE")
    modifier.object = armature
    return mesh


def split_calf(
    body: bpy.types.Object,
    name: str,
    side: str,
    target_armature: bpy.types.Object,
) -> bpy.types.Object:
    calf = body.copy()
    calf.data = body.data.copy()
    bpy.context.collection.objects.link(calf)
    keep_groups = {f"{side}Leg", f"{side}Foot"}
    group_names = {group.index: group.name for group in calf.vertex_groups}
    bpy.context.view_layer.objects.active = calf
    calf.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    calf_matrix = calf.matrix_world.copy()
    for vertex in calf.data.vertices:
        keep_weight = any(group_names[item.group] in keep_groups and item.weight > 0.2 for item in vertex.groups)
        # End the visible calf inside the shoe collar. The Girush foot/toes are
        # articulation donors, not exposed footwear geometry.
        vertex.select = (not keep_weight) or (calf_matrix @ vertex.co).z < 0.205
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    calf.select_set(False)
    # The copied donor still carries every original group even though only one
    # lower leg remains. Prune and renormalize so the opposite side and torso
    # can never tug this calf during seated poses.
    rows: list[dict[str, float]] = []
    group_names = {group.index: group.name for group in calf.vertex_groups}
    for vertex in calf.data.vertices:
        row = {
            group_names[item.group]: item.weight
            for item in vertex.groups
            if group_names[item.group] in keep_groups and item.weight > 1e-5
        }
        total = sum(row.values())
        rows.append(
            {group_name: value / total for group_name, value in row.items()}
            if total > 1e-5
            else {f"{side}Leg": 1.0}
        )
    replace_weights(calf, rows)
    calf.name = name
    calf.data.name = f"{name}-geometry"
    calf.parent = target_armature
    calf.matrix_parent_inverse = Matrix.Identity(4)
    calf.matrix_basis = Matrix.Identity(4)
    return calf


def remove_body_lower_legs(body: bpy.types.Object) -> None:
    lower_groups = {"LeftLeg", "LeftFoot", "RightLeg", "RightFoot"}
    group_names = {group.index: group.name for group in body.vertex_groups}
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in body.data.vertices:
        vertex.select = any(group_names[item.group] in lower_groups and item.weight > 0.2 for item in vertex.groups)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    body.select_set(False)


def remove_body_under_clothes(body: bpy.types.Object) -> None:
    hidden_groups = {
        "Hips",
        "Spine",
        "Chest",
        "UpperChest",
        "LeftShoulder",
        "LeftArm",
        "LeftForeArm",
        "RightShoulder",
        "RightArm",
        "RightForeArm",
        "LeftUpLeg",
        "RightUpLeg",
    }
    group_names = {group.index: group.name for group in body.vertex_groups}
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in body.data.vertices:
        if not vertex.groups:
            continue
        dominant = max(vertex.groups, key=lambda item: item.weight)
        vertex.select = group_names[dominant.group] in hidden_groups
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    body.select_set(False)


def apply_supported_modifiers(mesh: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    for modifier in list(mesh.modifiers):
        if modifier.type in {"MIRROR", "TRIANGULATE"}:
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        else:
            mesh.modifiers.remove(modifier)
    mesh.select_set(False)


def capture_mapped_weights(mesh: bpy.types.Object, force_bone: str | None) -> list[dict[str, float]]:
    group_names = {group.index: group.name for group in mesh.vertex_groups}
    captured: list[dict[str, float]] = []
    for vertex in mesh.data.vertices:
        if force_bone:
            captured.append({force_bone: 1.0})
            continue
        weights: dict[str, float] = {}
        for membership in vertex.groups:
            target = BONE_MAP.get(group_names[membership.group])
            if target:
                weights[target] = weights.get(target, 0.0) + membership.weight
        if not weights:
            world_z = (mesh.matrix_world @ vertex.co).z * GIRUSH_SCALE
            if world_z > 2.65:
                weights = {"Head": 1.0}
            elif world_z > 2.0:
                weights = {"Chest": 1.0}
            elif world_z > 1.2:
                weights = {"Hips": 1.0}
            else:
                weights = {"LeftLeg" if (mesh.matrix_world @ vertex.co).x >= 0 else "RightLeg": 1.0}
        total = sum(weights.values())
        captured.append({name: value / total for name, value in weights.items()})
    return captured


def replace_weights(mesh: bpy.types.Object, weights: list[dict[str, float]]) -> None:
    mesh.vertex_groups.clear()
    groups = {name: mesh.vertex_groups.new(name=name) for name in sorted({name for row in weights for name in row})}
    for vertex_index, row in enumerate(weights):
        for name, weight in row.items():
            groups[name].add([vertex_index], weight, "REPLACE")


def compress_runtime_arm_span(armature: bpy.types.Object) -> None:
    """Shorten the stylized arm chain while preserving shoulder anchors."""
    for candidate in bpy.context.selected_objects:
        candidate.select_set(False)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.mode_set(mode="EDIT")

    def belongs_to_chain(bone: bpy.types.EditBone, root_name: str) -> bool:
        candidate: bpy.types.EditBone | None = bone
        while candidate is not None:
            if candidate.name == root_name:
                return True
            candidate = candidate.parent
        return False

    def compressed_x(value: float, sign: float) -> float:
        magnitude = abs(value)
        if magnitude <= ARM_SPAN_ORIGIN:
            return value
        return sign * (ARM_SPAN_ORIGIN + (magnitude - ARM_SPAN_ORIGIN) * ARM_SPAN_SCALE)

    for bone in armature.data.edit_bones:
        side = 1.0 if belongs_to_chain(bone, "LeftArm") else -1.0 if belongs_to_chain(bone, "RightArm") else 0.0
        if side == 0.0:
            continue
        bone.head.x = compressed_x(bone.head.x, side)
        bone.tail.x = compressed_x(bone.tail.x, side)
        bone.use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")


def mapped_pivot_deltas(
    source_armature: bpy.types.Object,
    target_armature: bpy.types.Object,
) -> tuple[dict[str, Vector], dict[str, Vector]]:
    """Map each visual-donor rest pivot onto the retained runtime pivot."""
    source_matrix = source_armature.matrix_world.copy()
    target_matrix = target_armature.matrix_world.copy()
    deltas: dict[str, Vector] = {}
    targets: dict[str, Vector] = {}
    for target_name, source_name in RIG_PIVOT_MAP.items():
        source_pivot = source_matrix @ source_armature.data.bones[source_name].head_local
        scaled_source = Vector(
            (
                source_pivot.x * GIRUSH_SCALE,
                source_pivot.y * GIRUSH_SCALE - 0.04,
                source_pivot.z * GIRUSH_SCALE,
            )
        )
        target_pivot = target_matrix @ target_armature.data.bones[target_name].head_local
        deltas[target_name] = target_pivot - scaled_source
        targets[target_name] = target_pivot
    return deltas, targets


def transform_girush_mesh(
    mesh: bpy.types.Object,
    target_matrix: Matrix,
    source_name: str,
    weights: list[dict[str, float]],
    pivot_deltas: dict[str, Vector],
    target_pivots: dict[str, Vector],
) -> None:
    source_matrix = mesh.matrix_world.copy()
    target_inverse = target_matrix.inverted()
    for vertex, row in zip(mesh.data.vertices, weights, strict=True):
        source_world = source_matrix @ vertex.co
        scaled_world = Vector((source_world.x * GIRUSH_SCALE, source_world.y * GIRUSH_SCALE - 0.04, source_world.z * GIRUSH_SCALE))
        correction = Vector((0.0, 0.0, 0.0))
        for bone_name, weight in row.items():
            correction += pivot_deltas.get(bone_name, Vector((0.0, 0.0, 0.0))) * weight
        scaled_world += correction
        if source_name == "body.001":
            for hand_name in ("LeftHand", "RightHand"):
                hand_weight = row.get(hand_name, 0.0)
                if hand_weight <= 0.0:
                    continue
                hand_pivot = target_pivots[hand_name]
                compressed_x = hand_pivot.x + (scaled_world.x - hand_pivot.x) * HAND_LONGITUDINAL_SCALE
                scaled_world.x = scaled_world.x * (1.0 - hand_weight) + compressed_x * hand_weight
        if source_name in {"baseMesh1_A1.001", "hair"}:
            head_pivot = target_pivots["Head"]
            relative = scaled_world - head_pivot
            if source_name == "hair":
                scaled_world = head_pivot + Vector((relative.x * 1.32, relative.y * 1.24, relative.z * 1.27))
            else:
                # The donor's narrow, long face read older and vacant beside
                # the target concept. Widen and shorten it independently while
                # retaining the useful nose/mouth topology.
                scaled_world = head_pivot + Vector((relative.x * 1.36, relative.y * 1.04, relative.z * 1.00))
                # Suppress the donor's realistic protruding lip volume so the
                # authored small mouth reads cleanly without a second smile.
                if 2.75 < scaled_world.z < 2.83 and scaled_world.y < -0.17 and abs(scaled_world.x) < 0.16:
                    scaled_world.y += 0.012
            if source_name == "hair":
                scaled_world.x += 0.018
                # Keep the frontal fringe above the authored eye aperture. The
                # donor's longest front points crossed the lower/temporal lid
                # in three-quarter view and read as a pasted-on black socket.
                if scaled_world.y < -0.15 and abs(scaled_world.x) < 0.18:
                    scaled_world.z = max(scaled_world.z, 2.93)
        vertex.co = target_inverse @ scaled_world


def fit_kenney_pivots_to_girush(target_armature: bpy.types.Object, source_armature: bpy.types.Object) -> None:
    target_matrix = target_armature.matrix_world.copy()
    target_inverse = target_matrix.inverted()
    source_matrix = source_armature.matrix_world.copy()
    placements: dict[str, tuple[Vector, Vector, float]] = {}
    for target_name, source_name in RIG_PIVOT_MAP.items():
        target_bone = target_armature.data.bones[target_name]
        source_bone = source_armature.data.bones[source_name]
        target_head = target_matrix @ target_bone.head_local
        target_tail = target_matrix @ target_bone.tail_local
        direction = (target_tail - target_head).normalized()
        source_head = source_matrix @ source_bone.head_local
        source_tail = source_matrix @ source_bone.tail_local
        placements[target_name] = (source_head, direction, (source_tail - source_head).length)

    for item in bpy.context.selected_objects:
        item.select_set(False)
    target_armature.select_set(True)
    bpy.context.view_layer.objects.active = target_armature
    bpy.ops.object.mode_set(mode="EDIT")
    for target_name, (source_head, direction, source_length) in placements.items():
        edit_bone = target_armature.data.edit_bones[target_name]
        edit_bone.use_connect = False
        edit_bone.head = target_inverse @ source_head
        edit_bone.tail = target_inverse @ (source_head + direction * max(source_length, 0.01))
    bpy.ops.object.mode_set(mode="OBJECT")


def mesh_metrics(mesh: bpy.types.Object) -> dict[str, object]:
    corners = [mesh.matrix_world @ Vector(corner) for corner in mesh.bound_box]
    minimum = [min(point[axis] for point in corners) for axis in range(3)]
    maximum = [max(point[axis] for point in corners) for axis in range(3)]
    return {
        "name": mesh.name,
        "vertices": len(mesh.data.vertices),
        "triangles": sum(len(polygon.vertices) - 2 for polygon in mesh.data.polygons),
        "boundsMin": [round(value, 5) for value in minimum],
        "boundsMax": [round(value, 5) for value in maximum],
        "vertexGroups": sorted(group.name for group in mesh.vertex_groups),
    }


def runtime_color_for(name: str) -> tuple[float, float, float, float]:
    normalized = name.lower()
    for token, color in RUNTIME_COLORS.items():
        if token in normalized:
            return color
    return RUNTIME_COLORS["body"]


def create_vertex_color_material() -> bpy.types.Material:
    material = bpy.data.materials.new("streetwear-runtime-vertex-colors")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    vertex_color = nodes.new("ShaderNodeVertexColor")
    vertex_color.layer_name = "Color"
    material.node_tree.links.new(vertex_color.outputs["Color"], shader.inputs["Base Color"])
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def merge_runtime_meshes(
    meshes: list[bpy.types.Object],
    target_armature: bpy.types.Object,
) -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    """Bake semantic colors and merge reviewed authoring pieces into one skin."""
    material = create_vertex_color_material()
    component_names = [mesh.name for mesh in meshes]
    for mesh in meshes:
        for existing_attribute in list(mesh.data.color_attributes):
            mesh.data.color_attributes.remove(existing_attribute)
        color_attribute = mesh.data.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
        color = runtime_color_for(mesh.name)
        for item in color_attribute.data:
            item.color = color
        mesh.data.color_attributes.active_color = color_attribute
        mesh.data.materials.clear()
        mesh.data.materials.append(material)
        for polygon in mesh.data.polygons:
            polygon.material_index = 0

    for candidate in bpy.context.selected_objects:
        candidate.select_set(False)
    for mesh in meshes:
        mesh.select_set(True)
    merged = next(mesh for mesh in meshes if mesh.name == "streetwear-body")
    bpy.context.view_layer.objects.active = merged
    bpy.ops.object.join()
    merged.name = "streetwear-runtime-rider"
    merged.data.name = "streetwear-runtime-rider-geometry"
    merged.data.materials.clear()
    merged.data.materials.append(material)
    for polygon in merged.data.polygons:
        polygon.material_index = 0
    if merged.data.validate(verbose=True, clean_customdata=False):
        print("streetwear runtime mesh validation repaired invalid topology")
    merged.data.update()

    markers: list[bpy.types.Object] = []
    for component_name in component_names:
        marker = bpy.data.objects.new(component_name, None)
        marker.empty_display_type = "PLAIN_AXES"
        marker["authoringComponent"] = True
        marker.parent = merged
        marker.matrix_parent_inverse = Matrix.Identity(4)
        marker.matrix_basis = Matrix.Identity(4)
        bpy.context.collection.objects.link(marker)
        markers.append(marker)

    merged.parent = target_armature
    merged.matrix_parent_inverse = Matrix.Identity(4)
    return merged, markers


def main() -> None:
    args = parse_args()
    girush_path = Path(args.girush).resolve()
    kenney_path = Path(args.kenney).resolve()
    hoodie_path = Path(args.hoodie).resolve()
    clothing_kit_path = Path(args.clothing_kit).resolve()
    output_path = Path(args.output).resolve()
    metrics_path = Path(args.metrics).resolve()
    authoring_blend_path = Path(args.authoring_blend).resolve() if args.authoring_blend else None

    bpy.ops.wm.open_mainfile(filepath=str(girush_path))
    source_meshes = {source_name: bpy.data.objects[source_name] for source_name in GIRUSH_OBJECTS}
    for mesh in source_meshes.values():
        apply_supported_modifiers(mesh)

    bpy.ops.import_scene.gltf(filepath=str(kenney_path))
    target_armature = bpy.data.objects["Root"]
    target_mesh = bpy.data.objects["characterMedium"]
    target_matrix = target_mesh.matrix_world.copy()
    compress_runtime_arm_span(target_armature)
    target_bones = {bone.name for bone in target_armature.data.bones}
    assert set(BONE_MAP.values()).issubset(target_bones)
    source_armature = bpy.data.objects["Armature"]
    pivot_deltas, target_pivots = mapped_pivot_deltas(source_armature, target_armature)
    # Keep the proven Kenney rest pose and inverse-bind matrices intact. Girush
    # geometry is authored at its own proportions; moving imported edit bones
    # here invalidates the glTF skin bind and explodes the mesh at runtime.

    output_meshes: list[bpy.types.Object] = []
    for source_name, output_name in GIRUSH_OBJECTS.items():
        if source_name == "baseMesh1_A1.001":
            continue
        mesh = source_meshes[source_name]
        force_bone = "Head" if source_name in {"baseMesh1_A1.001", "hair"} else None
        weights = capture_mapped_weights(mesh, force_bone)
        transform_girush_mesh(
            mesh,
            target_matrix,
            source_name,
            weights,
            pivot_deltas,
            target_pivots,
        )
        mesh.name = output_name
        mesh.data.name = f"{output_name}-geometry"
        replace_weights(mesh, weights)
        mesh.parent = target_armature
        mesh.matrix_parent_inverse = Matrix.Identity(4)
        mesh.matrix_basis = Matrix.Identity(4)
        armature_modifier = mesh.modifiers.new(name="Kenney runtime armature", type="ARMATURE")
        armature_modifier.object = target_armature
        output_meshes.append(mesh)

    stylized_head, stylized_head_weights = create_stylized_head(target_matrix)
    output_meshes.append(bind_mesh(stylized_head, stylized_head.name, stylized_head_weights, target_armature))
    body = next(mesh for mesh in output_meshes if mesh.name == "streetwear-body")
    for side in ("Left", "Right"):
        socket_fill, socket_fill_weights = create_authored_socket_fill(target_matrix, side)
        output_meshes.append(bind_mesh(socket_fill, socket_fill.name, socket_fill_weights, target_armature))
        sclera, sclera_weights = create_authored_sclera(target_matrix, side)
        output_meshes.append(bind_mesh(sclera, sclera.name, sclera_weights, target_armature))
        upper_lid, upper_lid_weights = create_authored_upper_lid(target_matrix, side)
        output_meshes.append(bind_mesh(upper_lid, upper_lid.name, upper_lid_weights, target_armature))
        pupil, pupil_weights = create_authored_pupil(target_matrix, side)
        output_meshes.append(bind_mesh(pupil, pupil.name, pupil_weights, target_armature))
        brow, brow_weights = create_authored_brow(target_matrix, side)
        output_meshes.append(bind_mesh(brow, brow.name, brow_weights, target_armature))
    mouth, mouth_weights = create_authored_mouth(target_matrix)
    output_meshes.append(bind_mesh(mouth, mouth.name, mouth_weights, target_armature))
    left_calf = split_calf(body, "streetwear-left-calf", "Left", target_armature)
    right_calf = split_calf(body, "streetwear-right-calf", "Right", target_armature)
    remove_body_lower_legs(body)
    output_meshes.extend([left_calf, right_calf])

    # The donor remains a licensed reconstruction reference, but fitting its
    # anatomical source silhouette produced broad shoulders, a long torso, and
    # cuffs that swallowed the hands. Author the primary cloth masses directly
    # around the proven Kenney deform chain instead.
    hoodie, hoodie_weights = create_sculpted_hoodie(target_matrix)
    output_meshes.append(
        bind_mesh(
            hoodie,
            "streetwear-hoodie",
            hoodie_weights,
            target_armature,
        )
    )

    undershirt, undershirt_weights = create_refined_undershirt(target_matrix)
    output_meshes.append(
        bind_mesh(
            undershirt,
            "streetwear-undershirt",
            undershirt_weights,
            target_armature,
        )
    )

    shorts, shorts_weights = create_refined_cargo_shorts(target_matrix)
    output_meshes.append(
        bind_mesh(shorts, "streetwear-cargo-shorts", shorts_weights, target_armature)
    )

    remove_body_under_clothes(body)
    for side in ("Left", "Right"):
        upper, upper_weights, sole, sole_weights = create_refined_shoe(target_matrix, side)
        laces, lace_weights = create_authored_shoe_laces(target_matrix, side)
        output_meshes.extend(
            (
                bind_mesh(upper, upper.name, upper_weights, target_armature),
                bind_mesh(sole, sole.name, sole_weights, target_armature),
                bind_mesh(laces, laces.name, lace_weights, target_armature),
            )
        )

    bpy.context.view_layer.update()
    authoring_metrics = [mesh_metrics(mesh) for mesh in sorted(output_meshes, key=lambda item: item.name)]
    if authoring_blend_path is not None:
        authoring_blend_path.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(authoring_blend_path))
    runtime_mesh, component_markers = merge_runtime_meshes(output_meshes, target_armature)
    output_meshes = [runtime_mesh]

    # The source armature and original Kenney mesh remain authoring inputs only.
    for candidate in list(bpy.data.objects):
        if candidate not in output_meshes and candidate not in component_markers and candidate != target_armature:
            candidate.select_set(False)
    bpy.data.objects.remove(target_mesh, do_unlink=True)

    bpy.context.view_layer.update()
    for item in bpy.context.selected_objects:
        item.select_set(False)
    target_armature.select_set(True)
    for mesh in output_meshes:
        mesh.select_set(True)
    for marker in component_markers:
        marker.select_set(True)
    bpy.context.view_layer.objects.active = target_armature

    output_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_yup=True,
    )

    metrics = {
        "builder": bpy.app.version_string,
        "girushScale": GIRUSH_SCALE,
        "rigProportionSource": "Girush anatomy on Kenney-compatible pivots",
        "proportionTargets": {
            "headScale": 1.23,
            "hairScale": 1.32,
            "hairAsymmetryOffsetMeters": 0.018,
        },
        "armature": target_armature.name,
        "bones": len(target_armature.data.bones),
        "authoringComponents": authoring_metrics,
        "runtimeMeshes": [mesh_metrics(mesh) for mesh in output_meshes],
    }
    metrics["vertices"] = sum(item["vertices"] for item in metrics["runtimeMeshes"])
    metrics["triangles"] = sum(item["triangles"] for item in metrics["runtimeMeshes"])
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n")
    print("streetwear rider build passed")


if __name__ == "__main__":
    main()
