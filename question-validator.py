"""Shared structured exercise checks, executed by Pyodide and CPython QA."""
import ast
import io
import tokenize


def validate_question(spec, code, scope, output, power, action_count, rune='', executed_lines=None):
    def need(ok, message):
        if not ok:
            raise ValueError(message)

    tree = ast.parse(code)
    nodes = list(ast.walk(tree))
    actions = [n for n in nodes if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in ('attack', 'skill')]
    need(len(actions) == 1 and action_count == 1, 'เรียกคำสั่งต่อสู้เพียงหนึ่งจุด และให้ทำงานหนึ่งครั้งจริง ๆ')
    action = actions[0]
    expr = action.args[-1]
    lines = [line for entry in output for line in str(entry).splitlines()]
    if rune:
        need(rune in lines, 'แสดงตราผนึกใหม่ด้วย print() ตามภารกิจ')
        lines.remove(rune)
    need(power == spec['power'], 'พลังโจมตียังไม่ตรงกับผลลัพธ์ที่โจทย์กำหนด ลองตรวจการคำนวณ')

    def has(root, typ):
        return any(isinstance(n, typ) for n in ast.walk(root))

    def names(root):
        return {n.id for n in ast.walk(root) if isinstance(n, ast.Name)}

    def active(node):
        return executed_lines is None or getattr(node, 'lineno', -1) in executed_lines

    def value(node):
        if isinstance(node, ast.Name):
            return scope.get(node.id)
        try:
            return ast.literal_eval(node)
        except (ValueError, TypeError):
            return None

    def is_name(node, name):
        return isinstance(node, ast.Name) and node.id == name

    def is_call(node, name):
        return isinstance(node, ast.Call) and is_name(node.func, name)

    def direct_var(name):
        need(is_name(expr, name), 'ส่งตัวแปร ' + name + ' เข้า attack()/skill() โดยตรง แทนการใส่คำตอบคงที่')

    def literal_assignment(name, expected):
        return any(isinstance(n, ast.Assign) and any(is_name(t, name) for t in n.targets) and value(n.value) == expected and active(n) for n in nodes)

    def writes(root, name):
        return any(active(n) and ((isinstance(n, ast.AugAssign) and is_name(n.target, name)) or (isinstance(n, ast.Assign) and any(is_name(t, name) for t in n.targets))) for n in ast.walk(root))

    def attr(node, obj, field):
        return isinstance(node, ast.Attribute) and is_name(node.value, obj) and node.attr == field

    def instance(obj, classname):
        cls = scope.get(classname)
        return isinstance(cls, type) and isinstance(scope.get(obj), cls)

    for name, expected in spec.get('bindings', {}).items():
        actual = scope.get(name)
        need(type(actual) is type(expected) and actual == expected, 'ตรวจค่าหรือชนิดข้อมูลของตัวแปร ' + name)
    prints = [n for n in nodes if isinstance(n, ast.Call) and is_name(n.func, 'print') and active(n)]
    # The post-lesson seal is an extra UI requirement, not one of the exercise's
    # print statements. Count its separate print independently of the task.
    if rune:
        seal_print = next((p for p in prints if ' '.join(str(value(a)) for a in p.args) == rune), None)
        if seal_print is not None:
            prints.remove(seal_print)
    if 'output' in spec:
        need(lines == spec['output'], 'ผล print() หรือลำดับบรรทัดยังไม่ตรงกับภารกิจ')
    if 'prints' in spec:
        need(len(prints) == spec['prints'], 'จำนวนคำสั่ง print() ที่ทำงานยังไม่ตรงกับโจทย์')
    if spec.get('minPrintArgs'):
        need(any(len(n.args) >= spec['minPrintArgs'] for n in prints), 'ส่งข้อมูลให้ print() คนละอาร์กิวเมนต์ด้วยจุลภาค')
    if spec.get('comments'):
        comments = [t for t in tokenize.generate_tokens(io.StringIO(code).readline) if t.type == tokenize.COMMENT]
        need(len(comments) >= spec['comments'], 'เพิ่มคอมเมนต์ # ตามจำนวนที่โจทย์กำหนด โดยเขียนนอกสตริง')
    if spec.get('newline'):
        need(any(isinstance(n, ast.Constant) and isinstance(n.value, str) and '\n' in n.value for p in prints for n in ast.walk(p)), 'ใช้ \\n ภายในสตริงสำหรับขึ้นบรรทัดใหม่')
    if spec.get('printMath'):
        op = getattr(ast, spec['printMath'])
        need(any(isinstance(n, ast.BinOp) and isinstance(n.op, op) for p in prints for n in ast.walk(p)), 'ใช้ตัวดำเนินการใน print() ตามโจทย์ แทนพิมพ์ผลลัพธ์สำเร็จ')
        if spec.get('printOperands'):
            need(any(isinstance(n, ast.BinOp) and isinstance(n.op, op) and [value(n.left), value(n.right)] in [spec['printOperands'], list(reversed(spec['printOperands']))] for p in prints for n in ast.walk(p)), 'คำนวณจากตัวเลขในภารกิจ ไม่ใช่พิมพ์ผลลัพธ์ที่คำนวณไว้แล้ว')
    if spec.get('printNames'):
        need(set(spec['printNames']) <= set().union(*(names(p) for p in prints)), 'อ่านค่าจากตัวแปรที่โจทย์ระบุใน print()')

    kind = spec['kind']
    if kind in ('output', 'string'):
        return
    if kind == 'variable':
        direct_var(spec['name'])
        if spec.get('assignSource'):
            need(any(isinstance(n, ast.Assign) and any(is_name(t, spec['name']) for t in n.targets) and is_name(n.value, spec['assignSource']) and active(n) for n in nodes), 'กำหนดค่าจากตัวแปรต้นทางตามภารกิจ')
        if spec.get('assignMath') or spec.get('assignCall'):
            assignments = [n.value for n in nodes if isinstance(n, ast.Assign) and any(is_name(t, spec['name']) for t in n.targets) and active(n)]
            if spec.get('assignMath'):
                need(any(isinstance(v, ast.BinOp) and isinstance(v.op, getattr(ast, spec['assignMath'])) and spec['source'] in names(v) for v in assignments), 'สร้างค่าตัวแปรจากการคำนวณที่กำหนด')
            else:
                need(any(is_call(v, spec['assignCall']) and spec['source'] in names(v) for v in assignments), 'แปลงข้อมูลด้วย ' + spec['assignCall'] + '() แล้วเก็บผลในตัวแปร')
        if spec.get('aug'):
            need(any(isinstance(n, ast.AugAssign) and is_name(n.target, spec['name']) and isinstance(n.op, getattr(ast, spec['aug'])) and active(n) for n in nodes), 'ใช้ += หรือ -= ตามที่โจทย์กำหนด')
        return
    if kind == 'expression':
        need(isinstance(expr, ast.BinOp) and isinstance(expr.op, getattr(ast, spec['op'])) and set(spec['names']) <= names(expr), 'ใช้นิพจน์จากตัวแปรและตัวดำเนินการที่กำหนดในคำสั่งต่อสู้')
        return
    if kind == 'collection':
        name, expected = spec['name'], spec['values']
        typ = {'list': list, 'tuple': tuple, 'set': set}[spec['collection']]
        need(type(scope.get(name)) is typ and scope[name] == typ(expected), 'ชนิดหรือสมาชิกของ ' + name + ' ยังไม่ตรงภารกิจ')
        if spec['access'] == 'len':
            need(is_call(expr, 'len') and len(expr.args) == 1 and is_name(expr.args[0], name), 'ใช้ len(' + name + ') เป็นพลัง แทนจำนวนที่นับไว้เอง')
        else:
            need(isinstance(expr, ast.Subscript) and is_name(expr.value, name) and value(expr.slice) == spec['index'], 'อ่านสมาชิกด้วยดัชนีตามภารกิจในคำสั่งต่อสู้')
        if spec.get('initial') is not None:
            need(literal_assignment(name, typ(spec['initial'])), 'สร้าง ' + name + ' ด้วยสมาชิกเริ่มต้นก่อนเปลี่ยนค่า')
        if spec.get('method'):
            need(any(isinstance(n, ast.Call) and attr(n.func, name, spec['method']) and ([value(a) for a in n.args] == [spec['argument']] if 'argument' in spec else not n.args) and active(n) for n in nodes), 'เรียก ' + name + '.' + spec['method'] + '() ตามโจทย์')
        if 'mutateIndex' in spec:
            need(any(isinstance(n, ast.Assign) and any(isinstance(t, ast.Subscript) and is_name(t.value, name) and value(t.slice) == spec['mutateIndex'] for t in n.targets) and active(n) for n in nodes), 'เปลี่ยนสมาชิกด้วยการกำหนดค่าให้ดัชนีที่ระบุ')
        return
    if kind == 'tuple-unpack':
        need(type(scope.get(spec['name'])) is tuple and scope[spec['name']] == tuple(spec['values']), 'สร้าง tuple ตามภารกิจ')
        need(any(isinstance(n, ast.Assign) and is_name(n.value, spec['name']) and any(isinstance(t, ast.Tuple) and [x.id if isinstance(x, ast.Name) else None for x in t.elts] == spec['names'] for t in n.targets) and active(n) for n in nodes), 'แยกค่าจาก tuple ลงตัวแปรตามที่กำหนด')
        need(isinstance(expr, ast.BinOp) and isinstance(expr.op, ast.Add) and set(spec['names']) <= names(expr), 'บวกตัวแปรที่ได้จาก unpack ในคำสั่งต่อสู้')
        return
    if kind == 'set-union':
        for name, values in spec['sets'].items():
            need(type(scope.get(name)) is set and scope[name] == set(values), 'ตรวจสมาชิก set ' + name)
        need(is_call(expr, 'len') and expr.args and isinstance(expr.args[0], ast.BinOp) and isinstance(expr.args[0].op, ast.BitOr) and set(spec['names']) <= names(expr.args[0]), 'ใช้ len() กับ union ด้วย | ของสอง set')
        return
    if kind in ('condition', 'branch-variable'):
        conditions = [n for n in nodes if isinstance(n, ast.If) and active(n) and set(spec['testNames']) <= names(n.test)]
        need(conditions, 'ใช้ if ตรวจตัวแปรตามที่โจทย์ระบุ')
        if kind == 'condition':
            need(any(action in ast.walk(n) for n in conditions), 'วางคำสั่งต่อสู้ภายใน if ตามภารกิจ')
            if spec.get('boolOp'):
                need(any(isinstance(n.test, ast.BoolOp) and isinstance(n.test.op, getattr(ast, spec['boolOp'])) for n in conditions), 'ใช้ตัวเชื่อมเงื่อนไขตามภารกิจ')
        else:
            direct_var(spec['name'])
            need(any(n.orelse and writes(n, spec['name']) for n in conditions), 'ใช้ if/else กำหนดค่าตัวแปรก่อนเรียกคำสั่งต่อสู้')
            if spec.get('elif'):
                need(any(n.orelse and isinstance(n.orelse[0], ast.If) for n in conditions), 'เพิ่ม elif ระหว่าง if กับ else')
        return
    if kind == 'loop':
        counter = spec['counter']
        direct_var(counter)
        need(type(scope.get(counter)) is int and scope[counter] == spec['power'], 'ค่าตัวแปรหลังลูปยังไม่ตรงกับโจทย์')
        loops = [n for n in nodes if isinstance(n, getattr(ast, spec['loop'])) and active(n) and writes(n, counter)]
        need(loops and literal_assignment(counter, spec['initial']), 'กำหนดค่าเริ่มต้นและเปลี่ยนตัวแปรภายในลูปที่ทำงานจริง')
        need(all(action not in ast.walk(n) for n in loops), 'เรียกคำสั่งต่อสู้หลังจบลูป ไม่ใช่ภายในลูป')
        if 'range' in spec:
            need(any(is_call(n.iter, 'range') and [value(a) for a in n.iter.args] == [spec['range']] for n in loops), 'ใช้ range() ด้วยจำนวนรอบตามภารกิจ')
        if 'iterValues' in spec:
            need(any(value(n.iter) == spec['iterValues'] for n in loops), 'วนสมาชิกจากรายการที่โจทย์กำหนด')
        if spec.get('nestedIf'):
            need(any(has(n, ast.If) for n in loops), 'ใช้ if เลือกค่าภายใน for ก่อนสะสมผล')
        if spec.get('needBreak'):
            need(any(any(isinstance(x, ast.Break) and active(x) for x in ast.walk(n)) for n in loops), 'ใช้ break เพื่อออกจาก while เมื่อถึงเงื่อนไข')
        if spec.get('needContinue'):
            need(any(any(isinstance(x, ast.Continue) and active(x) for x in ast.walk(n)) for n in loops), 'ใช้ continue ข้ามรอบตามเงื่อนไข')
        if spec.get('whileElse'):
            need(any(n.orelse and any(active(x) for statement in n.orelse for x in ast.walk(statement)) for n in loops), 'เขียน else ของ while และให้ทำงานหลังจบลูป')
        if spec.get('popList'):
            need(any(is_name(n.test, 'moves') and any(isinstance(x, ast.Call) and attr(x.func, 'moves', 'pop') and active(x) for x in ast.walk(n)) for n in loops), 'ใช้ while moves และนำสมาชิกออกด้วย pop() ภายในลูป')
        if spec.get('aug'):
            need(any(any(isinstance(x, ast.AugAssign) and is_name(x.target, counter) and isinstance(x.op, getattr(ast, spec['aug'])) and active(x) for x in ast.walk(n)) for n in loops), 'ปรับค่าตัวแปรในลูปด้วยตัวดำเนินการที่กำหนด')
        return
    if kind == 'function':
        name = spec['name']
        defs = [n for n in nodes if isinstance(n, ast.FunctionDef) and n.name == name]
        need(defs and is_call(expr, name) and [value(a) for a in expr.args] == spec['args'], 'เรียกฟังก์ชันที่สร้างพร้อมอาร์กิวเมนต์ตามภารกิจ')
        fn = defs[0]
        need([a.arg for a in fn.args.args] == spec['params'] and any(isinstance(n, ast.Return) and active(n) for n in ast.walk(fn)), 'กำหนดพารามิเตอร์และ return ค่าจากฟังก์ชันจริง')
        if spec.get('builtin'):
            need(any(is_call(n, spec['builtin']) and set(spec['params']) <= names(n) and active(n) for n in ast.walk(fn)), 'ใช้ ' + spec['builtin'] + '() กับพารามิเตอร์ในฟังก์ชัน')
        if 'index' in spec:
            need(any(isinstance(n, ast.Subscript) and is_name(n.value, spec['params'][0]) and value(n.slice) == spec['index'] and active(n) for n in ast.walk(fn)), 'อ่านดัชนีจากรายการพารามิเตอร์ในฟังก์ชัน')
        if spec.get('operation'):
            need(any(isinstance(n, ast.BinOp) and isinstance(n.op, getattr(ast, spec['operation'])) and set(spec['params']) <= names(n) and active(n) for n in ast.walk(fn)), 'คำนวณผลลัพธ์จากพารามิเตอร์ภายในฟังก์ชันก่อน return')
        if spec.get('branch'):
            need(any(isinstance(n, ast.If) and set(spec['params']) <= names(n.test) for n in ast.walk(fn)), 'เลือกค่า return ด้วย if ที่ตรวจพารามิเตอร์ภายในฟังก์ชัน')
        if spec.get('helper'):
            need(any(is_call(n, spec['helper']) and active(n) for n in ast.walk(fn)), 'เรียกฟังก์ชัน ' + spec['helper'] + '() ภายในฟังก์ชันหลัก')
        return
    if kind == 'module':
        need(any(isinstance(n, ast.Import) and any(a.name == spec['module'] for a in n.names) for n in nodes), 'นำเข้าโมดูลที่โจทย์กำหนดด้วย import')
        need(isinstance(expr, ast.Call) and attr(expr.func, spec['module'], spec['method']) and [value(a) for a in expr.args] == spec['args'], 'ใช้ ' + spec['module'] + '.' + spec['method'] + '() ในคำสั่งต่อสู้')
        return
    if kind in ('class', 'class-difference', 'method'):
        cls = next((n for n in nodes if isinstance(n, ast.ClassDef) and n.name == spec['name']), None)
        need(cls is not None and instance(spec['object'], spec['name']), 'สร้าง class และ object ตามชื่อในภารกิจ')
        if kind == 'class':
            need(attr(expr, spec['object'], spec['attribute']) and getattr(scope[spec['object']], spec['attribute'], None) == spec['power'], 'อ่านคุณสมบัติจาก object ในคำสั่งต่อสู้')
            if spec.get('constructor'):
                init = next((n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == '__init__'), None)
                need(init is not None and [a.arg for a in init.args.args] == ['self', 'power'] and any(isinstance(n, ast.Assign) and any(attr(t, 'self', 'power') for t in n.targets) and is_name(n.value, 'power') and active(n) for n in ast.walk(init)), 'กำหนด self.power จากพารามิเตอร์ใน __init__(self, power)')
            if spec.get('update'):
                need(any(isinstance(n, ast.Assign) and any(attr(t, spec['object'], spec['attribute']) for t in n.targets) and active(n) for n in nodes), 'เปลี่ยนคุณสมบัติผ่าน object ก่อนอ่านค่า')
        elif kind == 'class-difference':
            need(instance(spec['other'], spec['name']) and scope[spec['object']] is not scope[spec['other']], 'สร้าง object แยกกันสองตัว')
            need(isinstance(expr, ast.BinOp) and isinstance(expr.op, ast.Sub) and attr(expr.left, spec['object'], spec['attribute']) and attr(expr.right, spec['other'], spec['attribute']), 'ลบคุณสมบัติของสอง object ในคำสั่งต่อสู้')
        else:
            method = next((n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == spec['method']), None)
            need(method is not None and isinstance(expr, ast.Call) and attr(expr.func, spec['object'], spec['method']) and [value(a) for a in expr.args] == spec.get('args', []), 'สร้างและเรียกเมธอดผ่าน object ตามภารกิจ')
            need(method.args.args and method.args.args[0].arg == 'self' and any(isinstance(n, ast.Return) and active(n) for n in ast.walk(method)), 'เมธอดต้องรับ self และ return ค่าจริง')
            if spec.get('usesSelf'):
                need(any(isinstance(n, ast.Return) and n.value is not None and any(attr(x, 'self', 'power') for x in ast.walk(n.value)) and active(n) for n in ast.walk(method)), 'return ค่าที่ได้จาก self.power ภายในเมธอด')
            if spec.get('param'):
                need(spec['param'] in [a.arg for a in method.args.args] and spec['param'] in names(method), 'รับและใช้พารามิเตอร์ของเมธอด')
            if spec.get('mutates'):
                need(any(isinstance(n, ast.AugAssign) and attr(n.target, 'self', 'power') and active(n) for n in ast.walk(method)), 'เพิ่ม self.power ภายในเมธอดด้วย +=')
        return
    if kind == 'exception':
        tries = [n for n in nodes if isinstance(n, ast.Try) and any(isinstance(h.type, ast.Name) and h.type.id == spec['exception'] and action in ast.walk(h) for h in n.handlers)]
        need(tries, 'วางคำสั่งต่อสู้ใน except ' + spec['exception'] + ' ตามภารกิจ')
        body = [node for t in tries for statement in t.body for node in ast.walk(statement)]
        if spec.get('operation'):
            need(any(isinstance(n, ast.BinOp) and isinstance(n.op, getattr(ast, spec['operation'])) and active(n) for n in body), 'สร้างข้อผิดพลาดจากการคำนวณใน try ตามโจทย์')
        if spec.get('access'):
            need(any(isinstance(n, ast.Subscript) and is_name(n.value, spec['access']) and active(n) for n in body), 'ลองอ่านข้อมูลที่กำหนดภายใน try แล้วรับมือข้อผิดพลาด')
        if spec.get('badCall'):
            need(any(is_call(n, spec['badCall']) and active(n) for n in body), 'ลองแปลงข้อมูลตามโจทย์ภายใน try')
        if spec.get('badName'):
            need(any(is_name(n, spec['badName']) and active(n) for n in body), 'ลองอ่านชื่อที่ยังไม่ได้ประกาศภายใน try')
        if spec.get('badAttribute'):
            need(any(isinstance(n, ast.Attribute) and n.attr == spec['badAttribute'] and active(n) for n in body), 'ลองอ่านเมธอดที่ไม่มีตามภารกิจภายใน try')
        return
    raise ValueError('ไม่พบรูปแบบการตรวจโจทย์ กรุณาโหลดเกมใหม่')
