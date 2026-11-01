"""Prepare three licensed run-button recordings, keeping source provenance."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
# Reuse the measured trim/headroom pipeline without rebuilding the existing bank.
namespace = {'__file__': str(root/'tools/prepare-audio-v14.py')}
source = (root/'tools/prepare-audio-v14.py').read_text(encoding='utf-8')
exec(source.split('clips=dict(concurrent.futures.')[0], namespace)
namespace['SOURCES']['tim'] = {
    'folder': '../audio-v16', 'author': 'Tim Rockk',
    'url': 'https://opengameart.org/content/game-voice', 'license': 'CC0-1.0',
}
jobs = [
    ('vo-run-adventurer', 'warrior', 'here1.wav', 1.8, 'voice', ''),
    ('vo-run-knight', 'tim', 'tim-get-ready.wav', 1.8, 'voice', ''),
    ('vo-run-wizard', 'mage', 'here2.wav', 1.8, 'voice', ''),
]
path = root/'assets/audio-v14/manifest.json'
manifest = json.loads(path.read_text(encoding='utf-8'))
manifest['sources']['tim'] = {k:v for k,v in namespace['SOURCES']['tim'].items() if k!='folder'}
for job in jobs:
    ident, clip = namespace['prepare'](job)
    manifest['clips'][ident] = clip
    print(ident, clip['seconds'], clip['peak'])
manifest['version'] = 16
path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
