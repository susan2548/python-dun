export function fail(status,message){return Object.assign(new Error(message),{status});}
export function originFor(req){
  const host=req.headers.host;
  return `${host?.startsWith('localhost:')||host?.startsWith('127.0.0.1:')?'http':'https'}://${host}`;
}
export function requireOrigin(req){
  const allowed=new Set(['https://python-dungeon-live.vercel.app',process.env.VERCEL_URL&&'https://'+process.env.VERCEL_URL]);
  if(!process.env.VERCEL)allowed.add(originFor(req));
  if(!allowed.has(req.headers.origin))throw fail(403,'คำขอไม่ได้มาจากหน้าเกมนี้ กรุณาเปิดเกมแล้วลองอีกครั้ง');
}
export function noStore(res){res.setHeader('Cache-Control','private, no-store');res.setHeader('Vary','Cookie');}
export function json(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));}
export async function body(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'ส่งข้อมูลแบบ JSON เท่านั้น');
  let value=req.body;
  if(value===undefined){const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>200000)throw fail(413,'ข้อมูลเซฟใหญ่เกินไป');chunks.push(chunk);}value=Buffer.concat(chunks).toString();}
  if(typeof value==='string'){if(value.length>200000)throw fail(413,'ข้อมูลเซฟใหญ่เกินไป');try{value=JSON.parse(value);}catch{throw fail(400,'รูปแบบข้อมูลไม่ถูกต้อง');}}
  if(!value||typeof value!=='object'||Array.isArray(value))throw fail(400,'ข้อมูลไม่ถูกต้อง');return value;
}
export function handleError(res,error){
  const status=error.status||503;
  if(status>=500)console.error('Learner API unavailable',error.code||error.name);
  json(res,status,{error:status>=500?'เชื่อมต่อข้อมูลผู้เรียนไม่ได้ชั่วคราว เซฟบนเครื่องยังอยู่ กรุณาลองอีกครั้ง':error.message});
}
