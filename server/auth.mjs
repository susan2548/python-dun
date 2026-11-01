import {handleAuthProxyRequest} from '@neondatabase/auth/server';
import {fail,originFor} from './http.mjs';
export async function proxyAuth(req,path,rawBody){
  if(!process.env.NEON_AUTH_BASE_URL?.startsWith('https://')||!process.env.NEON_AUTH_COOKIE_SECRET)throw fail(503,'ระบบบัญชียังไม่พร้อม');
  const headers=new Headers();
  for(const name of ['cookie','origin','content-type','user-agent','referer'])if(req.headers[name])headers.set(name,req.headers[name]);
  const method=path==='get-session'?'GET':req.method;
  const request=new Request(originFor(req)+'/api/auth/'+path,{method,headers,...(!['GET','HEAD'].includes(method)?{body:JSON.stringify(rawBody||{})}:{})});
  return handleAuthProxyRequest({request,path,baseUrl:process.env.NEON_AUTH_BASE_URL,cookieSecret:process.env.NEON_AUTH_COOKIE_SECRET,sessionDataTtl:30,sameSite:'lax'});
}
export function forwardCookies(response,res){const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);}
export async function requireUser(req,res){
  const response=await proxyAuth(req,'get-session');forwardCookies(response,res);
  if(!response.ok)throw fail(response.status>=500?503:401,'กรุณาเข้าสู่ระบบอีกครั้ง');
  const result=await response.json();
  if(!result?.user?.id||!result?.session)throw fail(401,'กรุณาเข้าสู่ระบบเพื่อบันทึกข้อมูลผู้เรียน');
  return result.user;
}
