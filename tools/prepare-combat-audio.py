"""Encode original Kokoro voice lines and copy the credited CC0 Foley subset."""
from pathlib import Path
import json,subprocess,shutil
import imageio_ffmpeg
root=Path(__file__).resolve().parents[1];sources=root.parent/'asset-sources'
voice=sources/'voice-work-v13';out=root/'assets'/'combat-audio';out.mkdir(parents=True,exist_ok=True)
ff=imageio_ffmpeg.get_ffmpeg_exe();catalog={}
for ident,text,preset,speed in json.loads((voice/'lines.json').read_text()):
    filters=['highpass=f=85','lowpass=f=7000','acompressor=threshold=0.18:ratio=2:attack=5:release=70']
    if ident.startswith('zombie'):filters+=['asetrate=19200','aresample=24000','atempo=1.12','aecho=0.7:0.4:35:0.12']
    elif ident.startswith('golem'):filters+=['asetrate=18000','aresample=24000','atempo=1.12','bass=g=5:f=100','aecho=0.7:0.4:45:0.13']
    elif ident.startswith(('wraith','necro')):filters+=['asetrate=21120','aresample=24000','atempo=1.08','aecho=0.7:0.4:38|70:0.16|0.08']
    elif ident.startswith('spider'):filters+=['asetrate=25920','aresample=24000','aecho=0.7:0.4:19:0.12']
    elif ident.startswith('skeleton'):filters+=['highpass=f=200','aecho=0.7:0.4:22:0.1']
    else:filters+=['aecho=0.7:0.4:24:0.08']
    filters+=['loudnorm=I=-17:TP=-1.5:LRA=6','afade=t=in:d=0.012','alimiter=limit=0.88']
    subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-i',str(voice/'raw'/f'{ident}.wav'),'-af',','.join(filters),'-ar','24000','-ac','1','-b:a','80k',str(out/f'{ident}.mp3')],check=True)
    catalog[ident]={'text':text,'file':f'{ident}.mp3','voicePreset':preset,'synthetic':True}
foley={
 'blade-whoosh':('rpg-audio-v13','knifeSlice.ogg'),
 'blade-return':('rpg-audio-v13','knifeSlice2.ogg'),
 'leather':('rpg-audio-v13','handleSmallLeather.ogg'),
 'metal-ready':('rpg-audio-v13','metalClick.ogg'),
 'metal-impact':('impact-sounds-v13','impactMetal_heavy_000.ogg'),
 'metal-light':('impact-sounds-v13','impactMetal_light_000.ogg'),
 'glass-impact':('impact-sounds-v13','impactGlass_light_000.ogg'),
 'body-impact':('impact-sounds-v13','impactPunch_heavy_000.ogg'),
 'stone-impact':('impact-sounds-v13','impactMining_000.ogg'),
}
for ident,(pack,file) in foley.items():
    source=sources/pack/'Audio'/file
    if not source.exists():raise FileNotFoundError(source)
    shutil.copy2(source,out/f'{ident}.ogg')
for pack in ['rpg-audio-v13','impact-sounds-v13']:
    license=next((sources/pack).glob('*[Ll]icense*'));shutil.copy2(license,out/f'{pack}-LICENSE.txt')
(out/'voices.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared',len(catalog),'voices and',len(foley),'Foley files;',sum(p.stat().st_size for p in out.iterdir()),'bytes')
