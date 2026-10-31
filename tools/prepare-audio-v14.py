"""Prepare licensed recordings; no speech synthesis or generated waveforms.

Input: ../asset-sources/audio-v14 (archives from the credited author pages).
Requires development-only numpy and imageio-ffmpeg. Browser ships MP3s only.
"""
from pathlib import Path
import subprocess,json,hashlib,concurrent.futures
import numpy as np
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1];SRC=ROOT.parent/'asset-sources'/'audio-v14';OUT=ROOT/'assets'/'audio-v14';OUT.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
SOURCES={
 'warrior':{'folder':'warrior/Warrior Pack','author':'John Carroll','url':'https://johncarroll.itch.io/warrior-voice-pack','license':'CC0-1.0'},
 'mage':{'folder':'mage/Mage Pack','author':'John Carroll','url':'https://johncarroll.itch.io/mage-voice-pack','license':'CC0-1.0'},
 'orc':{'folder':'orc/Orc Pack','author':'John Carroll','url':'https://johncarroll.itch.io/orc-voice-pack','license':'CC0-1.0'},
 'rpg':{'folder':'80-cc0-rpg-sfx','author':'rubberduck','url':'https://opengameart.org/content/80-cc0-rpg-sfx','license':'CC0-1.0'},
 'creature':{'folder':'80-cc0-creature-sfx','author':'rubberduck','url':'https://opengameart.org/content/80-cc0-creature-sfx','license':'CC0-1.0'},
 'sword':{'folder':'sword_-_starninjas_1/sword - StarNinjas','author':'StarNinjas','url':'https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes','license':'CC0-1.0'},
 'clash':{'folder':'sword_clash_-_starninjas_0','author':'StarNinjas','url':'https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes','license':'CC0-1.0'},
 'magic':{'folder':'Magic_SFX_Preview_Pack','author':'ViRiX Dreamcore (David Mckee)','url':'https://opengameart.org/content/magic-sfx-sample','license':'CC-BY-3.0'},
 'shade':{'folder':'rpg-sound-pack/RPG Sound Pack/NPC/shade','author':'artisticdude','url':'https://opengameart.org/content/rpg-sound-pack','license':'CC0-1.0'},
 'undead':{'folder':'zombie-skeleton-monster-voice-effects/Voice Effects Zombie-Skeleton-Monster Human Male','author':'ArcadeParty','url':'https://opengameart.org/content/zombie-skeleton-monster-voice-effects','license':'CC0-1.0'},
 'kenney':{'folder':'../impact-sounds-v13/Audio','author':'Kenney','url':'https://kenney.nl/assets/impact-sounds','license':'CC0-1.0'},
}
# id, source pack, source file, max seconds, treatment. Every variant remains a
# distinct original take; no pitch-shifted copy masquerades as another recording.
JOBS=[]
def add(ident,pack,file,limit=2.2,kind='fx',filter=''):
 JOBS.append((ident,pack,file,limit,kind,filter))
for ident,file in [('rogue-light-1','lightattack1'),('rogue-light-2','lightattack2'),('rogue-strike','attack1'),('rogue-ambush','here3'),('knight-heavy-1','heavyattack1'),('knight-heavy-2','heavyattack2'),('knight-bash','attack4'),('rogue-guard','defend1'),('knight-guard','defend2'),('rogue-focus','hut1'),('knight-focus','hup1')]:add('vo-'+ident,'warrior',file+'.wav',1.5,'voice')
for ident,file in [('fire-1','fire1'),('fire-2','fire2'),('frost-1','blizzard1'),('frost-2','blizzard2'),('oath','protect1'),('mage-light-1','lightattack1'),('mage-light-2','lightattack2'),('mage-guard','shield1'),('mage-focus','casting1'),('necro-summon','isummon1'),('necro-cast','summoning1')]:add('vo-'+ident,'mage',file+'.wav',1.8,'voice','highpass=f=100,lowpass=f=7200'if ident.startswith('necro')else'')
for n in [1,2,3]:add('vo-orc-'+str(n),'orc','heavyattack'+str(n)+'.wav',1.25,'voice')
for n in [1,2]:add('vo-zombie-'+str(n),'undead','zombieYell'+str(n)+'.wav',1.25,'voice')
for n in [1,2]:add('vo-shade-'+str(n),'shade','shade'+str(n)+'.wav',1.5,'voice')
for n in [1,2]:add('vo-bug-'+str(n),'creature','bug_0'+str(n)+'.ogg',.9,'voice')
for n in [1,2]:add('vo-bone-'+str(n),'undead','zombieYell'+str(n+4)+'.wav',.85,'voice','highpass=f=280,lowpass=f=6800')
for n in [1,3,5,7,9]:add('blade-'+str(n),'sword','sword.'+str(n)+'.ogg',.65)
for n in [1,3,7]:add('steel-'+str(n),'clash','sword_clash.'+str(n)+'.ogg',.85)
for n in [1,2]:add('thud-'+str(n),'kenney','impactPunch_heavy_00'+str(n-1)+'.ogg',.55)
for n in [1,2]:add('stone-'+str(n),'rpg','stones_0'+str(n)+'.ogg',1.0)
for n in [1,2]:add('bone-'+str(n),'rpg','chain_0'+str(n)+'.ogg',.7,'fx','highpass=f=170')
for n in [1,2]:add('venom-'+str(n),'creature','spit_0'+str(n)+'.ogg',.8)
for n in [1,2]:add('web-'+str(n),'creature','bug_0'+str(n+2)+'.ogg',.8)
add('charge','rpg','spell_02.ogg',.75,'fx','highpass=f=140,lowpass=f=5000')
add('arcane','rpg','spell_01.ogg',.8)
add('fire-charge','rpg','spell_fire_05.ogg',.65)
add('fire-flight','rpg','spell_fire_03.ogg',.65)
add('fire-impact','magic','Fire impact 1.wav',2.1)
add('frost-impact','magic','Ice attack 2.wav',1.65)
add('wind','magic','Wind effects 5.wav',1.0)
add('ward','magic','Misc 02.wav',1.25)
add('restore','magic','Healing Full.wav',1.35)
add('dark','shade','shade12.wav',1.0,'fx','highpass=f=100,lowpass=f=3000')
add('draw','sword','sword.10.ogg',.45)

def prepare(job):
 ident,pack,file,limit,kind,treatment=job;source=SOURCES[pack];path=(SRC/source['folder']/file).resolve()
 if not path.is_file():raise FileNotFoundError(path)
 data=subprocess.check_output([FF,'-v','error','-i',str(path),'-ac','1','-ar','32000','-f','f32le','-'])
 a=np.frombuffer(data,dtype='<f4');peak=float(np.max(np.abs(a)))
 # Keep breath attacks; trim the measured digital lead/tail, never hard-gate
 # the body of a shouted syllable. Retain 10ms pre-roll and 65ms of room tail.
 envelope=np.convolve(np.abs(a),np.ones(160)/160,mode='same');threshold=max(.001,peak*.008)
 active=np.flatnonzero(envelope>threshold)
 start=max(0,int(active[0])-320)/32000 if len(active)else 0
 end=min(len(a),int(active[-1])+2080)/32000 if len(active)else len(a)/32000
 duration=min(limit,max(.08,end-start));gain=min(3.5,(.75 if kind=='voice'else .82)/max(peak,.001))
 filters=[f'volume={gain:.5f}','highpass=f=65']
 if treatment:filters.append(treatment)
 # Short room tail for a coherent dungeon, no repeated artificial echo.
 filters+=['alimiter=limit=0.78:level=false',f'afade=t=in:d=0.004',f'afade=t=out:st={max(0,duration-.065):.5f}:d=0.065']
 target=OUT/(ident+'.mp3')
 subprocess.run([FF,'-v','error','-y','-ss',str(start),'-i',str(path),'-t',str(duration),'-af',','.join(filters),'-ac','1','-ar','32000','-b:a','112k',str(target)],check=True)
 b=subprocess.check_output([FF,'-v','error','-i',str(target),'-f','f32le','-ac','1','-ar','32000','-']);samples=np.frombuffer(b,dtype='<f4')
 decoded_peak=float(np.max(np.abs(samples)))
 if decoded_peak>=.98:raise ValueError(f'{ident}: decoded peak {decoded_peak}')
 return ident,{'file':target.name,'kind':kind,'pack':pack,'sourceFile':file,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'seconds':round(len(samples)/32000,4),'peak':round(decoded_peak,4),'sourceTrimStart':round(start,4),'processing':'trim silence, gain/headroom, high-pass, limiter without makeup gain, 4ms/65ms fades'+(', '+treatment if treatment else ''),'syntheticSpeech':False}
clips=dict(concurrent.futures.ThreadPoolExecutor(max_workers=4).map(prepare,JOBS))
manifest={'version':14,'sources':{k:{f:v for f,v in s.items()if f!='folder'}for k,s in SOURCES.items()},'clips':clips}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(clips),'recordings;',sum((OUT/v['file']).stat().st_size for v in clips.values()),'bytes')
print('Max decoded peak:',max(v['peak']for v in clips.values()))
