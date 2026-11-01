// Server-only parallel forms. No answer key or explanation is published as a static asset.
export const FORM_VERSION=2;
export const UNITS=['ภาษาและเครื่องมือ','ตัวแปร ตัวเลข และสตริง','ตัวดำเนินการและโครงสร้างข้อมูล','เงื่อนไขและการวนรอบ','ฟังก์ชัน อาเรย์ และโมดูล','คลาสและการจัดการข้อผิดพลาด'];
const mc=(id,unit,prompt,code,choices,answer,explanation)=>({id,unit,type:'choice',prompt,code,choices:choices.map((text,i)=>({id:String(i),text})),answer:String(answer),explanation});
const fill=(id,unit,prompt,code,answer,explanation,kind='token')=>({id,unit,type:'fill',prompt,code,answer,explanation,kind});
const LEGACY_FORMS={
 pre:[
 mc('pre01',0,'ข้อใดอธิบายภาษาและเครื่องมือ Python ได้ถูกต้อง','',['Python เป็นภาษาระดับสูง และ IDLE ใช้เขียนและรันโปรแกรม Python ได้','Python เป็นภาษาเครื่อง และใช้โปรแกรมวาดภาพรันโค้ด','VS Code เป็นตัวแปลภาษา Python โดยไม่ต้องมี Python','Python ต้องสร้างไฟล์ .exe ก่อนรันทุกครั้ง'],0,'Python เป็นภาษาระดับสูง ส่วน IDLE เป็นเครื่องมือพัฒนาโปรแกรม'),
 fill('pre02',0,'เติมชื่อพารามิเตอร์ให้แสดง A และ B ในบรรทัดเดียวกัน','print("A", ____=" ")\nprint("B")','end','end กำหนดข้อความท้าย print() แทนการขึ้นบรรทัดใหม่'),
 mc('pre03',1,'โปรแกรมนี้แสดงผลอะไร','x = "4"\nprint(int(x) + 3)',['43','7','"7"','เกิด TypeError'],1,'int("4") ให้จำนวนเต็ม 4 แล้วบวก 3 ได้ 7'),
 fill('pre04',1,'เติมตัวดำเนินการเพื่อคำนวณราคารวม','price = 7\namount = 3\ntotal = price ____ amount','*','ใช้ * คูณราคาต่อชิ้นกับจำนวน'),
 mc('pre05',1,'โปรแกรมนี้แสดงผลอะไร','word = "PYTHON"\nprint(word[1:4])',['PYT','YTH','YTHO','THO'],1,'ดัชนีเริ่มที่ 0 และ slice ไม่รวมตำแหน่งสิ้นสุด'),
 fill('pre06',1,'เติมชื่อฟังก์ชันเพื่อหาจำนวนอักขระ','word = "code"\nsize = ____(word)','len','len() คืนจำนวนสมาชิกหรืออักขระ'),
 mc('pre07',2,'ค่าของ result เท่ากับเท่าใด','result = 2 + 3 * 2',['10','12','8','7'],2,'การคูณทำก่อนการบวก'),
 fill('pre08',2,'เติมชื่อเมธอดเพื่อนำ 3 ไปต่อท้าย list','items = [1, 2]\nitems.____(3)','append','append() เพิ่มสมาชิกหนึ่งตัวที่ท้าย list'),
 mc('pre09',2,'โครงสร้างใดเหมาะกับเก็บรหัสสินค้าที่ไม่ต้องการค่าซ้ำ','',['list เพราะตัดค่าซ้ำอัตโนมัติ','tuple เพราะเปลี่ยนค่าได้ตลอด','set เพราะสมาชิกไม่ซ้ำกัน','str เพราะใช้เก็บได้ทุกชนิด'],2,'set เก็บสมาชิกที่ไม่ซ้ำกัน'),
 fill('pre10',2,'เติมดัชนีเพื่ออ่านค่า 7','nums = [4, 7, 9]\nprint(nums[____])','1','list เริ่มนับดัชนีจาก 0','integer'),
 mc('pre11',3,'โปรแกรมนี้แสดงผลอะไร','score = 65\nif score >= 80:\n    print("A")\nelif score >= 60:\n    print("B")\nelse:\n    print("C")',['A','B','C','A และ B'],1,'เงื่อนไขแรกเท็จ แต่ score >= 60 เป็นจริง'),
 fill('pre12',3,'เติมคำสั่งสำหรับกรณีที่เงื่อนไข if เป็นเท็จ','n = 2\nif n > 5:\n    print("มาก")\n____:\n    print("น้อยหรือเท่ากับ")','else','else ทำงานเมื่อเงื่อนไขก่อนหน้าไม่เป็นจริง'),
 mc('pre13',3,'ค่าที่พิมพ์ออกมาคือเท่าใด','total = 0\nfor n in range(1, 4):\n    total += n\nprint(total)',['4','6','10','3'],1,'range(1,4) ให้ 1,2,3 รวมเป็น 6'),
 fill('pre14',3,'เติมฟังก์ชันเพื่อวนรอบ 3 ครั้ง','for i in ____(3):\n    print(i)','range','range(3) ให้ 0,1,2'),
 mc('pre15',3,'หลังจบลูป n มีค่าเท่าใด','n = 0\nwhile n < 3:\n    n += 1\nprint(n)',['2','4','ลูปไม่จบ','3'],3,'ลูปหยุดเมื่อ n เท่ากับ 3'),
 fill('pre16',3,'เติมตัวดำเนินการเพิ่มค่า n เพื่อให้ลูปหยุดได้','n = 0\nwhile n < 4:\n    n ____ 1','+=','+= 1 เพิ่มตัวแปรทีละหนึ่ง'),
 mc('pre17',4,'โปรแกรมนี้แสดงผลอะไร','def add(a, b):\n    return a + b\nprint(add(2, 5))',['25','7','None','เกิดข้อผิดพลาด'],1,'return คืนผลรวมให้ผู้เรียกฟังก์ชัน'),
 fill('pre18',4,'เติมคำสำคัญสำหรับประกาศฟังก์ชัน','____ double(x):\n    return x * 2','def','def ใช้ประกาศฟังก์ชัน'),
 mc('pre19',4,'คำสั่งใดสร้างอาเรย์จำนวนเต็มจากโมดูล array ได้ถูกต้อง','from array import array',['array("i", [1, 2, 3])','array["i", 1, 2, 3]','array("i", ["a", "b"])','array = {1: 2}'],0,'array("i", ...) สร้างอาเรย์สมาชิกจำนวนเต็ม'),
 fill('pre20',4,'เติมชื่อฟังก์ชันใน math เพื่อหารากที่สอง','import math\nroot = math.____(16)','sqrt','math.sqrt() ใช้หารากที่สอง'),
 mc('pre21',5,'โปรแกรมนี้แสดงผลอะไร','class Counter:\n    def __init__(self):\n        self.value = 1\n    def add(self):\n        self.value += 2\nc = Counter()\nc.add()\nprint(c.value)',['1','2','3','None'],2,'object เริ่ม value=1 แล้วเมธอดเพิ่มอีก 2'),
 fill('pre22',5,'เติมพารามิเตอร์ให้สอดคล้องกับตัวอ้างอิงในเมธอด','class Hero:\n    def __init__(____, name):\n        self.name = name','self','self อ้างถึง object ที่เรียกเมธอดนี้'),
 mc('pre23',5,'โปรแกรมนี้แสดงผลอะไร','try:\n    x = 10 / 0\nexcept ZeroDivisionError:\n    print("หารศูนย์")',['10','0','หารศูนย์','ไม่มีข้อความ'],2,'การหารด้วยศูนย์เกิด ZeroDivisionError และเข้า except'),
 fill('pre24',5,'เติมชื่อข้อผิดพลาดที่เกิดจากการแปลงข้อความนี้','try:\n    n = int("abc")\nexcept ____:\n    print("แปลงค่าไม่ได้")','ValueError','int("abc") ทำให้เกิด ValueError'),
 ],
 post:[
 mc('post01',0,'ข้อใดอธิบายการเตรียมเครื่องมือ Python ได้ถูกต้อง','',['ติดตั้งโปรแกรมนำเสนออย่างเดียวก็รัน .py ได้','Editor ใช้แก้โค้ด และตัวแปลภาษา Python ใช้ประมวลผลโค้ด','คอมเมนต์ทำหน้าที่เป็นตัวแปลภาษา','ต้องลบ Terminal ก่อนติดตั้ง Python'],1,'Editor กับตัวแปลภาษาทำหน้าที่ต่างกัน'),
 fill('post02',0,'เติมชื่อพารามิเตอร์ให้แสดง X และ Y ในบรรทัดเดียวกัน','print("X", ____="-")\nprint("Y")','end','end เปลี่ยนข้อความต่อท้าย print() จึงแสดง X-Y'),
 mc('post03',1,'โปรแกรมนี้แสดงผลอะไร','value = "6"\nprint(int(value) + 2)',['62','"8"','8','เกิด TypeError'],2,'แปลง "6" เป็นจำนวนเต็มก่อนบวก 2'),
 fill('post04',1,'เติมตัวดำเนินการเพื่อคำนวณจำนวนขนมทั้งหมด','boxes = 4\neach = 5\ntotal = boxes ____ each','*','จำนวนทั้งหมดเท่ากับจำนวนกล่องคูณขนมต่อกล่อง'),
 mc('post05',1,'โปรแกรมนี้แสดงผลอะไร','word = "DUNGEON"\nprint(word[1:4])',['DUN','UNGE','NGE','UNG'],3,'ดัชนี 1,2,3 คือ U,N,G'),
 fill('post06',1,'เติมชื่อฟังก์ชันเพื่อหาจำนวนอักขระ','message = "quest"\nsize = ____(message)','len','len() คืนจำนวนอักขระของสตริง'),
 mc('post07',2,'ค่าของ result เท่ากับเท่าใด','result = 3 + 2 * 4',['20','11','14','24'],1,'คำนวณ 2*4 ก่อน แล้วบวก 3'),
 fill('post08',2,'เติมชื่อเมธอดเพื่อนำ 8 ไปต่อท้าย list','scores = [5, 6]\nscores.____(8)','append','append() เพิ่มสมาชิกหนึ่งตัวที่ท้าย list'),
 mc('post09',2,'โครงสร้างใดเหมาะกับเก็บชื่อผู้เข้าร่วมที่ไม่ต้องการชื่อซ้ำ','',['str เพราะลบชื่อซ้ำเอง','tuple เพราะเพิ่มสมาชิกเองได้','list เพราะทุกค่าไม่ซ้ำ','set เพราะเก็บสมาชิกไม่ซ้ำ'],3,'set เหมาะกับชุดสมาชิกที่ต้องการตัดค่าซ้ำ'),
 fill('post10',2,'เติมดัชนีเพื่ออ่านค่า 8','nums = [2, 5, 8]\nprint(nums[____])','2','สมาชิกตัวที่สามมีดัชนี 2','integer'),
 mc('post11',3,'โปรแกรมนี้แสดงผลอะไร','score = 55\nif score >= 80:\n    print("สูง")\nelif score >= 50:\n    print("กลาง")\nelse:\n    print("ต่ำ")',['สูง','กลาง','ต่ำ','ทุกข้อความ'],1,'55 ไม่ถึง 80 แต่ถึง 50 จึงเข้า elif'),
 fill('post12',3,'เติมคำสั่งสำหรับกรณีที่เงื่อนไข if เป็นเท็จ','hp = 0\nif hp > 0:\n    print("พร้อม")\n____:\n    print("พัก")','else','else รับกรณีที่เงื่อนไขก่อนหน้าไม่เป็นจริง'),
 mc('post13',3,'ค่าที่พิมพ์ออกมาคือเท่าใด','total = 0\nfor n in range(2, 5):\n    total += n\nprint(total)',['5','14','9','7'],2,'range(2,5) ให้ 2,3,4 รวมเป็น 9'),
 fill('post14',3,'เติมฟังก์ชันเพื่อวนรอบ 4 ครั้ง','for i in ____(4):\n    print(i)','range','range(4) ให้ 0,1,2,3'),
 mc('post15',3,'หลังจบลูป n มีค่าเท่าใด','n = 1\nwhile n < 4:\n    n += 1\nprint(n)',['3','4','5','ลูปไม่จบ'],1,'n เพิ่มจนเท่ากับ 4 แล้วเงื่อนไขเป็นเท็จ'),
 fill('post16',3,'เติมตัวดำเนินการเพิ่มค่า n เพื่อให้ลูปหยุดได้','n = 2\nwhile n < 6:\n    n ____ 1','+=','+= 1 เพิ่มตัวแปรทีละหนึ่ง'),
 mc('post17',4,'โปรแกรมนี้แสดงผลอะไร','def add(a, b):\n    return a + b\nprint(add(3, 6))',['36','None','9','เกิดข้อผิดพลาด'],2,'ฟังก์ชันคืน 3+6 ซึ่งเท่ากับ 9'),
 fill('post18',4,'เติมคำสำคัญสำหรับประกาศฟังก์ชัน','____ triple(x):\n    return x * 3','def','def ใช้ประกาศฟังก์ชัน'),
 mc('post19',4,'คำสั่งใดสร้างอาเรย์จำนวนเต็มจากโมดูล array ได้ถูกต้อง','from array import array',['array["i", 4, 5]','array("i", [4, 5])','array("i", ["x"])','array = "4,5"'],1,'array("i", [4,5]) กำหนดชนิดสมาชิกและค่าเริ่มต้นได้ถูกต้อง'),
 fill('post20',4,'เติมชื่อฟังก์ชันใน math เพื่อหารากที่สอง','import math\nroot = math.____(25)','sqrt','math.sqrt(25) ให้ 5.0'),
 mc('post21',5,'โปรแกรมนี้แสดงผลอะไร','class Counter:\n    def __init__(self):\n        self.value = 2\n    def add(self):\n        self.value += 3\nc = Counter()\nc.add()\nprint(c.value)',['2','3','5','None'],2,'สถานะ value ของ object เพิ่มจาก 2 เป็น 5'),
 fill('post22',5,'เติมพารามิเตอร์ให้สอดคล้องกับตัวอ้างอิงในเมธอด','class Player:\n    def __init__(____, level):\n        self.level = level','self','self คือ object ที่ได้รับเมธอด'),
 mc('post23',5,'โปรแกรมนี้แสดงผลอะไร','try:\n    x = 8 / 0\nexcept ZeroDivisionError:\n    print("คำนวณไม่ได้")',['8','0','ไม่มีข้อความ','คำนวณไม่ได้'],3,'ZeroDivisionError ถูกจัดการด้วย except ที่ตรงชนิด'),
 fill('post24',5,'เติมชื่อข้อผิดพลาดที่เกิดจากการแปลงข้อความนี้','try:\n    n = int("xyz")\nexcept ____:\n    print("ข้อมูลไม่ใช่จำนวนเต็ม")','ValueError','ข้อความ xyz แปลงเป็นจำนวนเต็มไม่ได้จึงเกิด ValueError'),
 ]
};
const tokenOptions={
 end:['end','sep','file','flush'], '*':['*','+','/','**'], len:['len','str','int','type'],
 append:['append','remove','pop','sort'], '1':['0','1','2','3'], '2':['0','1','2','3'],
 else:['else','elif','break','continue'], range:['range','len','input','print'],
 '+=':['+=','-=','*=','/='], def:['def','class','return','import'],
 sqrt:['sqrt','pow','floor','ceil'], self:['self','name','level','cls'],
 ValueError:['ValueError','TypeError','IndexError','ZeroDivisionError']
};
export const FORMS=Object.fromEntries(Object.entries(LEGACY_FORMS).map(([phase,bank])=>[phase,bank.map(q=>q.type==='fill'?{...q,type:'code-choice',choices:tokenOptions[q.answer].map(text=>({id:text,text}))}:q)]));
export function formFor(phase,version=FORM_VERSION){
 if(![1,2].includes(version)||!LEGACY_FORMS[phase])throw Error('form version');
 return (version===1?LEGACY_FORMS:FORMS)[phase];
}
export function publicQuestions(phase,order,choiceOrder={},version=FORM_VERSION){
 const bank=new Map(formFor(phase,version).map(q=>[q.id,q]));
 return order.map(id=>{const {answer,explanation,kind,...q}=bank.get(id);if(q.choices){const choices=new Map(q.choices.map(c=>[c.id,c]));q.choices=(choiceOrder[id]||q.choices.map(c=>c.id)).map(key=>choices.get(key));}return q;});
}
export function cleanAnswers(phase,values,version=FORM_VERSION){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('answers');
 const bank=new Map(formFor(phase,version).map(q=>[q.id,q])),result={};
 for(const [id,value] of Object.entries(values)){
  if(!bank.has(id)||typeof value!=='string'||value.length>160)throw Error('answers');
  const q=bank.get(id);if(q.choices&&value.trim()!==''&&!q.choices.some(c=>c.id===value.normalize('NFC').trim()))throw Error('answers');
  result[id]=value.normalize('NFC').trim();
 }return result;
}
export function gradeAnswers(phase,answers,version=FORM_VERSION){
 const bank=formFor(phase,version),byUnit=UNITS.map((name,unit)=>({unit,name,score:0,maximum:bank.filter(q=>q.unit===unit).length}));
 let score=0;for(const q of bank){
  const raw=(answers[q.id]||'').normalize('NFC').trim();
  const correct=q.kind==='integer'?/^(0|[1-9]\d*)$/.test(raw)&&Number(raw)===Number(q.answer):raw===q.answer;
  if(correct){score++;byUnit[q.unit].score++;}
 }return {score,maximum:bank.length,byUnit};
}
