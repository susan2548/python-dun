"""Exercise the actual worker prelude and validators with generated QA cases."""
import json
import sys
from pathlib import Path

payload = json.load(sys.stdin)
root = Path(__file__).resolve().parents[1]
validator = {}
exec((root / 'question-validator.py').read_text(encoding='utf-8'), validator)
passed = 0
failures = []
for case in payload['cases']:
    actions, logs = [], []
    g = dict(user_code=case['code'], skill_alias_json=payload['aliases'], allowed_skill='fireball', skill_display_name='ลูกไฟเวท',
             emit_action=lambda name, value, power: actions.append(dict(name=name, value=value, power=power)), emit_log=lambda line: logs.append(str(line)))
    error = None
    try:
        exec(payload['prelude'], g)
        g.update(action_count=len(actions), action_power=actions[0]['power'] if actions else 0, output_json=json.dumps(logs), required_rune=case.get('rune', ''), challenge_number=case['check'].get('legacyChallenge', 0))
        if 'kind' in case['check']:
            validator['validate_question'](case['check'], case['code'], g['scope'], logs, g['action_power'], len(actions), g['required_rune'], g['executed_lines'])
        else:
            exec(payload['legacy'], g)
    except Exception as exc:
        error = str(exc)
    if (error is None) == case['ok']:
        passed += 1
    else:
        failures.append(dict(id=case['id'], expected=case['ok'], error=error, code=case['code']))
print(json.dumps(dict(passed=passed, total=len(payload['cases']), failures=failures), ensure_ascii=False))
sys.exit(bool(failures))
