import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs';

let runtime;
const ready = () => runtime ??= loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'});

self.onmessage = async ({data}) => {
  const {id, code, challenge, skillName} = data;
  const actions = [], logs = [];
  try {
    const py = await ready();
    py.globals.set('user_code', code);
    py.globals.set('challenge_number', challenge);
    py.globals.set('allowed_skill', skillName);
    py.globals.set('emit_action', (name, value, power) => actions.push({name:String(name), value:String(value), power:Number(power)}));
    py.globals.set('emit_log', line => {if(logs.length < 8) logs.push(String(line));});
    await py.runPythonAsync(`
import ast
tree = ast.parse(user_code)
nodes = list(ast.walk(tree))
if len(nodes) > 240: raise ValueError('โค้ดยาวเกินไปสำหรับโจทย์นี้')
if any(isinstance(n, (ast.ImportFrom, ast.Global, ast.Nonlocal, ast.Delete)) for n in nodes):
    raise ValueError('โจทย์นี้ไม่ต้องใช้ import from, global หรือ del')
for n in nodes:
    if isinstance(n, ast.Import) and any(alias.name != 'math' for alias in n.names):
        raise ValueError('โจทย์นี้อนุญาตให้นำเข้าเฉพาะ math')
calls = [n for n in nodes if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)]
action_nodes = [n for n in calls if n.func.id in ('attack','skill')]
if len(action_nodes) != 1: raise ValueError('เขียน attack() หรือ skill() เพียงหนึ่งจุดต่อโจทย์')
action_node = action_nodes[0]
if action_node.keywords or len(action_node.args) != (1 if action_node.func.id == 'attack' else 2):
    raise ValueError('ใช้ attack(พลัง) หรือ skill("ชื่อสกิล", พลัง)')
power_node = action_node.args[-1]
def need(ok, message):
    if not ok: raise ValueError(message)
def has(root, kind): return any(isinstance(n, kind) for n in ast.walk(root))
def names(root): return {n.id for n in ast.walk(root) if isinstance(n, ast.Name)}
def call(root, name): return any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == name for n in ast.walk(root))
def assigned(name, kind): return any(isinstance(n, ast.Assign) and isinstance(n.value, kind) and any(isinstance(t, ast.Name) and t.id == name for t in n.targets) for n in nodes)
def print(*items, sep=' ', end='\\n'): emit_log(sep.join(map(str, items)))
def power(value):
    if type(value) is not int or not 1 <= value <= 3: raise ValueError('พลังต้องเป็นจำนวนเต็ม 1 ถึง 3')
    return value
def attack(value): emit_action('attack', '', power(value))
def skill(name, value):
    if name != allowed_skill: raise ValueError('ชื่อสกิลไม่ถูกต้อง ดูชื่อในกล่องสกิลอาชีพ')
    emit_action('skill', name, power(value))
scope = {'__builtins__':__builtins__, 'print':print, 'attack':attack, 'skill':skill}
exec(compile(tree, '<player>', 'exec'), scope)
`);
    py.globals.set('action_count', actions.length);
    py.globals.set('action_power', actions[0]?.power ?? 0);
    py.globals.set('output_json', JSON.stringify(logs));
    await py.runPythonAsync(`
import json
output_lines = json.loads(output_json)
need(action_count == 1, 'ต้องเรียกคำสั่งต่อสู้หนึ่งครั้งจริง ๆ')
cid = challenge_number
if cid == 1:
    need(output_lines[:1] == ['ลุย'] and action_power == 1, 'แสดง ลุย แล้วโจมตีพลัง 1')
elif cid == 2:
    need(any(s.strip().startswith('#') for s in user_code.splitlines()) and output_lines[:1] == ['พร้อม'] and action_power == 2, 'ต้องมีคอมเมนต์ # แสดง พร้อม และโจมตีพลัง 2')
elif cid == 3:
    need(output_lines[:2] == ['Python','Dungeon'] and action_power == 1 and sum(c.func.id == 'print' for c in calls if isinstance(c.func, ast.Name)) >= 2, 'แสดง Python และ Dungeon คนละบรรทัด แล้วโจมตีพลัง 1')
elif cid == 4:
    need(assigned('power',ast.Constant) and scope.get('power') == 2 and 'power' in names(power_node) and action_power == 2, 'กำหนด power = 2 และใช้ power ในคำสั่งต่อสู้')
elif cid == 5:
    need(scope.get('hero') == 'Python' and output_lines[:1] == ['Python'] and any(c.func.id == 'print' and 'hero' in names(c) for c in calls if isinstance(c.func,ast.Name)) and action_power == 2, 'สร้าง hero = "Python" แล้ว print(hero) ก่อนโจมตีพลัง 2')
elif cid == 6:
    need(scope.get('base') == 1 and scope.get('bonus') == 2 and {'base','bonus'} <= names(power_node) and has(power_node,ast.BinOp) and action_power == 3, 'ใช้ base + bonus ในคำสั่งต่อสู้')
elif cid == 7:
    need(assigned('moves',ast.List) and scope.get('moves') == [1,2,3] and 'moves' in names(power_node) and call(power_node,'len') and action_power == 3, 'สร้าง list moves = [1, 2, 3] แล้วใช้ len(moves)')
elif cid == 8:
    need(assigned('pair',ast.Tuple) and scope.get('pair') == (1,2) and 'pair' in names(power_node) and has(power_node,ast.Subscript) and action_power == 3, 'สร้าง tuple pair = (1, 2) แล้วบวก pair[0] กับ pair[1]')
elif cid == 9:
    need(assigned('keys',ast.Set) and scope.get('keys') == {1,2,3} and 'keys' in names(power_node) and call(power_node,'len') and action_power == 3, 'สร้าง set keys ที่มี 1, 2, 2, 3 แล้วใช้ len(keys)')
elif cid == 10:
    need(scope.get('hp') == 10 and any(isinstance(n,ast.If) and action_node in ast.walk(n) for n in nodes) and action_power == 2, 'กำหนด hp = 10 แล้ววางคำสั่งต่อสู้ภายใน if')
elif cid == 11:
    need(scope.get('total') == 3 and any(isinstance(n,ast.For) and call(n.iter,'range') for n in nodes) and 'total' in names(power_node) and action_power == 3, 'ใช้ for range(3) สะสม total = 3 แล้วใช้ total ต่อสู้')
elif cid == 12:
    need(scope.get('charge') == 2 and has(tree,ast.While) and any(isinstance(n,ast.If) and action_node in ast.walk(n) for n in nodes) and action_power == 3, 'ใช้ while เพิ่ม charge เป็น 2 แล้วตรวจด้วย if ก่อนโจมตี')
elif cid == 13:
    need(any(isinstance(n,ast.FunctionDef) and n.name == 'power' and has(n,ast.Return) for n in nodes) and call(power_node,'power') and action_power == 2, 'สร้างฟังก์ชัน power() ให้ return 2 และเรียกใช้')
elif cid == 14:
    need(any(isinstance(n,ast.FunctionDef) and n.name == 'total' and len(n.args.args) == 1 and call(n,'sum') for n in nodes) and has(tree,ast.List) and call(power_node,'total') and action_power == 3, 'สร้างฟังก์ชัน total(items) ที่ใช้ sum และเรียกกับ list')
elif cid == 15:
    need(has(tree,ast.Import) and any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and isinstance(n.func.value,ast.Name) and n.func.value.id == 'math' and n.func.attr == 'ceil' for n in ast.walk(power_node)) and action_power == 3, 'import math แล้วใช้ math.ceil(2.1)')
elif cid == 16:
    need(any(isinstance(n,ast.ClassDef) and n.name == 'Hero' for n in nodes) and any(isinstance(n,ast.Attribute) and n.attr == 'power' for n in ast.walk(power_node)) and action_power == 2, 'สร้าง class Hero, object และอ่าน .power')
elif cid == 17:
    need(any(isinstance(n,ast.ClassDef) and n.name == 'Hero' and any(isinstance(x,ast.FunctionDef) and x.name == 'strike' for x in n.body) for n in nodes) and any(isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr == 'strike' for n in ast.walk(power_node)) and action_power == 3, 'สร้างเมธอด strike(self) แล้วเรียกผ่าน object')
elif cid == 18:
    need(any(isinstance(n,ast.Try) and any(isinstance(h.type,ast.Name) and h.type.id == 'ValueError' and action_node in ast.walk(h) for h in n.handlers) for n in nodes) and 'int("rune")' in user_code.replace("'",'"') and action_power == 3, 'ใช้ try แปลง int("rune") และโจมตีภายใน except ValueError')
else: raise ValueError('ไม่พบโจทย์')
`);
    self.postMessage({id, ok:true, actions, logs});
  } catch(error) {
    const raw = String(error?.message || error);
    const marker = ['ValueError:', 'SyntaxError:', 'IndentationError:', 'NameError:', 'TypeError:'].find(x => raw.includes(x));
    const detail = marker ? `${marker === 'ValueError:' ? '' : marker+' '}${raw.split(marker).at(-1).split('\n')[0].trim()}` : raw.split('\n').filter(Boolean).at(-1);
    self.postMessage({id, ok:false, error:detail || 'ตรวจโค้ดไม่สำเร็จ'});
  }
};
