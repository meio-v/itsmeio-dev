"""Run: blender -b --python validate.py -- [approved-baseline.blend]. Read-only verification."""
import bpy,bmesh,json,hashlib,math,sys
from pathlib import Path
R=Path(__file__).resolve().parent
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def signature(o):
 return hashlib.sha256(repr(([tuple(v.co) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons],[(k.name,k.value,[tuple(v.co) for v in k.data]) for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else [],[tuple(r) for r in o.matrix_world])).encode()).hexdigest()
prior={}
if args:
 bpy.ops.wm.open_mainfile(filepath=args[0]);prior={o.name:signature(o) for o in bpy.context.scene.objects if o.type=='MESH' and not o.hide_render and o.name!='SM_Jacket_TShirt'}
bpy.ops.wm.open_mainfile(filepath=str(R/'upper-body-v001.blend'))
assert all(n in bpy.data.objects and signature(bpy.data.objects[n])==v for n,v in prior.items()),'Approved geometry changed'
assert not [i.filepath for i in bpy.data.images if i.source=='FILE' and i.filepath and not i.packed_file]
stats={}
for n in ['SM_Jacket_SewnShell','SM_Jacket_Collar_NeckBand','SM_Jacket_Hood_Separate','SM_Jacket_TShirt','SM_Jacket_TShirt_NeckBand']:
 o=bpy.data.objects[n];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me);bad=sum(not e.is_manifold for e in bm.edges);bm.free();assert bad==0,(n,bad);assert all(math.isfinite(c) for v in me.vertices for c in v.co);stats[n]={'control_vertices':len(o.data.vertices),'evaluated_vertices':len(me.vertices),'nonmanifold_edges':bad};ev.to_mesh_clear()
result={'status':'PASS','sha256':hashlib.sha256((R/'upper-body-v001.blend').read_bytes()).hexdigest(),'approved_visible_meshes_unchanged':len(prior),'dependencies':'all file images packed','geometry':stats,'limits':'Modeling checkpoint only. No rig, UV completion, runtime export, or general self-intersection certification.'}
(R/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
