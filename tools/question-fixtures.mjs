// QA-only solutions. Never imported by the game or included in task descriptors.
const py=v=>JSON.stringify(v).replace(/\btrue\b/g,'True').replace(/\bfalse\b/g,'False');
const legacy=[
'print("ลุย")\nattack(1)', '# เตรียมตัว\nprint("พร้อม")\nattack(2)', 'print("Python")\nprint("Dungeon")\nattack(1)',
'power = 2\nattack(power)', 'hero = "Python"\nprint(hero)\nattack(2)', 'base = 1\nbonus = 2\nattack(base + bonus)',
'moves = [1, 2, 3]\nattack(len(moves))', 'pair = (1, 2)\nattack(pair[0] + pair[1])', 'keys = {1, 2, 2, 3}\nattack(len(keys))',
'hp = 10\nif hp > 0:\n    attack(2)', 'total = 0\nfor i in range(3):\n    total += 1\nattack(total)', 'charge = 0\nwhile charge < 2:\n    charge += 1\nif charge == 2:\n    attack(3)',
'def power():\n    return 2\nattack(power())', 'def total(items):\n    return sum(items)\nattack(total([1, 2]))', 'import math\nattack(math.ceil(2.1))',
'class Hero:\n    power = 2\nhero = Hero()\nattack(hero.power)', 'class Hero:\n    def strike(self):\n        return 3\nhero = Hero()\nattack(hero.strike())', 'try:\n    int("rune")\nexcept ValueError:\n    attack(3)'];
export function solutionFor(q,{skill=null,rune=''}={}){
 const s=q.check,p=s.power;let code='',expr=String(p);
 const binds=()=>Object.entries(s.bindings||{}).map(([k,v])=>`${k} = ${py(v)}`).join('\n');
 const tuple=v=>'('+v.map(py).join(', ')+(v.length===1?',':'')+')';
 const collection=v=>s.collection==='tuple'?tuple(v):s.collection==='set'?'{'+v.join(', ')+'}':py(v);
 if(s.legacyChallenge)code=legacy[s.legacyChallenge-1];
 else switch(s.kind){
 case 'output':{
  code=Array.from({length:s.comments||0},(_,i)=>'# คำอธิบาย '+i).join('\n');if(code)code+='\n';
  if(s.printMath)code+=`print(${s.printOperands.join(' + ')})`;
  else if(s.newline)code+=`print(${py(s.output.join('\n'))})`;
  else if(s.minPrintArgs){const words=s.output[0].split(' ');code+=`print(${words.map(py).join(', ')})`;}
  else code+=s.output.map(x=>`print(${py(x)})`).join('\n');break;
 }
 case 'string':code=binds()+'\nprint('+(s.printMath==='Add'?'hero + suffix':s.printMath==='Mult'?`chant * ${s.output[0].length/s.bindings.chant.length}`:'hero, item')+')';break;
 case 'variable':
  if(s.assignMath)code=`energy = ${s.bindings.energy}\npower = energy + 1`;
  else if(s.assignSource)code=`energy = 3\npower = energy`;
  else if(s.assignCall)code=`${s.source} = ${py(s.bindings[s.source])}\npower = ${s.assignCall}(${s.source})`;
  else code=`power = ${s.aug==='Sub'?p+1:p-1}\npower ${s.aug==='Sub'?'-=':'+='} 1`;
  expr=s.name;break;
 case 'expression':code=binds();expr=s.names.join({Sub:' - ',Mod:' % ',FloorDiv:' // '}[s.op]);break;
 case 'collection':
  code=`${s.name} = ${collection(s.initial||s.values)}`;
  if(s.method)code+=`\n${s.name}.${s.method}(${'argument' in s?py(s.argument):''})`;
  if('mutateIndex' in s)code+=`\n${s.name}[${s.mutateIndex}] = ${p}`;
  expr=s.access==='len'?`len(${s.name})`:`${s.name}[${s.index}]`;break;
 case 'tuple-unpack':code=`pair = ${tuple(s.values)}\nleft, right = pair`;expr='left + right';break;
 case 'set-union':code=Object.entries(s.sets).map(([k,v])=>`${k} = {${v.join(', ')}}`).join('\n');expr='len(keys | extra)';break;
 case 'branch-variable':
  code=s.elif?`mana = ${s.bindings.mana}\nif mana >= 6:\n    power = 3\nelif mana >= 3:\n    power = 2\nelse:\n    power = 1`:`hp = ${s.bindings.hp}\nif hp > 0:\n    power = 2\nelse:\n    power = 1`;expr='power';break;
 case 'condition':code=binds()+'\nif '+(s.boolOp?`hp > 0 ${s.boolOp.toLowerCase()} mana >= 2`:s.testNames[0]==='keys'?'keys == 2':s.testNames[0]==='door'?'door != "locked"':'ready')+`:\n    attack(${p})`;break;
 case 'loop':{
  const n=s.counter;code=`${n} = ${s.initial}\n`;
  if(s.loop==='For')code+=`for value in ${'range' in s?`range(${s.range})`:py(s.iterValues)}:\n`+(s.needBreak?`    if value == 9:\n        break\n    ${n} += value`:s.needContinue?`    if value == 0:\n        continue\n    ${n} += 1`:s.nestedIf?`    if value == 1:\n        ${n} += 1`:s.aug==='Sub'?`    ${n} -= 1`:s.aug==='Mult'?`    ${n} *= value`:`    ${n} += value`);
  else if(s.needBreak)code+=`while True:\n    ${n} += 1\n    if ${n} == 3:\n        break`;
  else if(s.popList)code='moves = [1, 1]\n'+code+'while moves:\n    charge += moves.pop()';
  else code+=`while ${n} ${s.aug==='Sub'?'>':'<'} ${p}:\n    ${n} ${{Sub:'-=',Add:'+=',Mult:'*='}[s.aug]} ${s.step|| (s.aug==='Mult'?2:1)}`;
  if(s.whileElse)code+='\nelse:\n    print("จบลูป")';
  expr=n;break;
 }
 case 'function':{
  const body=s.builtin?`${s.builtin}(items)`:'index' in s?`items[${s.index}]`:s.helper?'base() + 1':'base + bonus';
  code=(s.helper?'def base():\n    return 1\n':'')+`def ${s.name}(${s.params.join(', ')}):\n`+(s.branch?'    if ready:\n        return 2\n    return 1':`    return ${body}`);expr=`${s.name}(${s.args.map(py).join(', ')})`;break;
 }
 case 'module':code='import math';expr=`math.${s.method}(${s.args.map(py).join(', ')})`;break;
 case 'class':
  code=s.constructor===true?`class Hero:\n    def __init__(self, power):\n        self.power = power\nhero = Hero(${p})`:`class Hero:\n    power = 1\nhero = Hero()\nhero.power = ${p}`;expr='hero.power';break;
 case 'class-difference':code='class Hero:\n    power = 1\nhero = Hero()\nrival = Hero()\nhero.power = 3\nrival.power = 1';expr='hero.power - rival.power';break;
 case 'method':code=`class Hero:\n    power = ${s.param||s.mutates?1:p}\n    def strike(self${s.param?', bonus':''}):\n`+(s.mutates?'        self.power += 1\n':'')+`        return self.power${s.param?' + bonus':''}\nhero = Hero()`;expr=`hero.strike(${(s.args||[]).map(py).join(', ')})`;break;
 case 'exception':code=(s.access==='moves'||s.badAttribute?'moves = [1]\n':s.access==='runes'?'runes = {"fire": 2}\n':'')+'try:\n    '+(s.operation?(s.operation==='Div'?'5 / 0':'1 + "key"'):s.badCall?'float("torch")':s.badName?'missing_rune':s.badAttribute?'moves.fly()':s.access==='moves'?'moves[4]':'runes["ice"]')+`\nexcept ${s.exception}:\n    attack(${p})`;break;
 default:throw Error('No QA solution '+q.id);
 }
 if(!code.includes('attack('))code+=`\nattack(${expr})`;
 if(skill)code=code.replace(/attack\(/,`skill(${py(skill)}, `);
 if(rune)code+=`\nprint(${py(rune)})`;
 return code;
}
