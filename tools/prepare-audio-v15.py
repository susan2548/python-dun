"""Add six monster identities from new, unused licensed source takes."""
from pathlib import Path
import json,concurrent.futures
root=Path(__file__).resolve().parents[1]
source=(root/'tools'/'prepare-audio-v14.py').read_text(encoding='utf-8')
env={'__file__':str(root/'tools'/'prepare-audio-v14.py')}
exec(compile(source[:source.index('clips=dict(')],'audio-v14-preparer','exec'),env)
jobs=[]
voices={
 'slime':('burble_01.ogg','spit_03.ogg'),
 'mimic':('monster_04.ogg','monster_07.ogg'),
 'scarab':('misc_07.ogg','weird_03.ogg'),
 'bat':('scream_01.ogg','scream_02.ogg'),
 'icewolf':('barking_01.ogg','howl.ogg'),
 'sentinel':('alien_04.ogg','alien_06.ogg'),
}
for kind,files in voices.items():
 for n,file in enumerate(files):jobs.append((f'v15-vo-{kind}-{n}','creature',file,1.65 if n else .9,'voice',''))
effects={
 'slime':[('rpg','creature_slime_01.ogg'),('rpg','creature_slime_04.ogg')],
 'mimic':[('rpg','item_wood_03.ogg'),('rpg','item_coins_03.ogg')],
 'scarab':[('rpg','metal_03.ogg'),('rpg','stones_04.ogg')],
 'bat':[('rpg','blade_02.ogg'),('rpg','misc_03.ogg')],
 'icewolf':[('creature','breath.ogg'),('rpg','spell_fire_07.ogg')],
 'sentinel':[('kenney','impactMetal_heavy_002.ogg'),('rpg','spell_fire_06.ogg')],
}
for kind,pairs in effects.items():
 for n,(pack,file) in enumerate(pairs):jobs.append((f'v15-fx-{kind}-{n}',pack,file,1.3,'fx',''))
path=root/'assets'/'audio-v14'/'manifest.json';manifest=json.loads(path.read_text(encoding='utf-8'))
old_hashes={c['sourceSha256'] for k,c in manifest['clips'].items() if not k.startswith('v15-')}
clips=dict(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(env['prepare'],jobs))
for ident,c in clips.items():
 if c['sourceSha256'] in old_hashes:raise ValueError('Source already used by old monster: '+ident)
manifest['clips'].update(clips);manifest['version']=15
path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(clips),'distinct unused source takes; maximum peak',max(c['peak'] for c in clips.values()))
