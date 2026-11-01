import {body,requireOrigin,noStore,json,handleError} from '../server/http.mjs';
import {proxyAuth,forwardCookies} from '../server/auth.mjs';
const allowed=new Set(['get-session','sign-in/email','sign-up/email','sign-out','email-otp/send-verification-otp','email-otp/verify-email','email-otp/reset-password','sign-in/email-otp','request-password-reset','reset-password']);
export default async function handler(req,res){
  noStore(res);
  try{
    const url=new URL(req.url,'https://local');const path=url.searchParams.get('path')||url.pathname.replace(/^\/api\/auth\/?/,'');
    if(!allowed.has(path))return json(res,404,{error:'ไม่พบคำสั่งบัญชีนี้'});
    if(!['GET','POST'].includes(req.method)||((path==='get-session')!==(req.method==='GET')))return json(res,405,{error:'คำสั่งไม่ถูกต้อง'});
    if(req.method==='POST')requireOrigin(req);
    const payload=req.method==='POST'?await body(req):undefined;
    const response=await proxyAuth(req,path,payload);forwardCookies(response,res);
    res.statusCode=response.status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(await response.text());
  }catch(error){handleError(res,error);}
}
