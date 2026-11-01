"""Generate a server-only cookie secret and set it without displaying values."""
from pathlib import Path
import secrets, subprocess
root=Path(__file__).resolve().parents[1]
env=root/'.env.local'
existing=env.read_text(encoding='utf-8')
line=next((l for l in existing.splitlines() if l.startswith('NEON_AUTH_COOKIE_SECRET=')),None)
value=line.split('=',1)[1].strip('"') if line else secrets.token_urlsafe(48)
if not line:
    with env.open('a',encoding='utf-8') as f:f.write('\nNEON_AUTH_COOKIE_SECRET='+value+'\n')
cli='C:/Users/ThinkPad/AppData/Local/npm-cache/_npx/67eb4586ca667318/node_modules/.bin/vercel.cmd'
for target in ['production','preview','development']:
    result=subprocess.run([cli,'env','add','NEON_AUTH_COOKIE_SECRET',target,'--scope','major-s-projects4','--sensitive'],input=value,text=True,cwd=root,capture_output=True)
    if result.returncode:raise RuntimeError('Could not configure cookie secret for '+target+'; review Vercel env names (no values).')
    print('Configured server cookie secret:',target)
