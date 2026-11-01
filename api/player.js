import {db} from '../server/db.mjs';
import {requireUser} from '../server/auth.mjs';
import {body,fail,requireOrigin,noStore,json,handleError} from '../server/http.mjs';
import {nickname,validateSave,validateClears} from '../server/player-policy.mjs';
export default async function handler(req,res){
  noStore(res);
  try{
    if(!['GET','PUT','PATCH'].includes(req.method))throw fail(405,'คำสั่งไม่ถูกต้อง');
    if(req.method!=='GET')requireOrigin(req);
    const user=await requireUser(req,res),sql=db();
    const data=req.method==='GET'?null:await body(req);
    if(data&&data.accountId!==user.id)throw fail(403,'บัญชีเปลี่ยนจากอีกหน้าต่าง กรุณาเข้าสู่ระบบใหม่');
    await sql`INSERT INTO dungeon_players(user_id) VALUES(${user.id}) ON CONFLICT DO NOTHING`;
    if(req.method==='PATCH'){
      const name=nickname(data.nickname);
      await sql`UPDATE dungeon_players SET nickname=${name} WHERE user_id=${user.id}`;
      await sql`INSERT INTO dungeon_rankings(user_id,campaign,nickname,class_id,stars)
        SELECT p.user_id,2,p.nickname,
          (SELECT class_id FROM dungeon_clears WHERE user_id=p.user_id AND campaign=2 ORDER BY completed_at DESC,floor DESC LIMIT 1),sum(c.stars)::int
        FROM dungeon_players p JOIN dungeon_clears c ON c.user_id=p.user_id AND c.campaign=2
        WHERE p.user_id=${user.id} GROUP BY p.user_id,p.nickname HAVING count(*)=12
        ON CONFLICT(user_id,campaign) DO UPDATE SET nickname=EXCLUDED.nickname,stars=GREATEST(dungeon_rankings.stars,EXCLUDED.stars)`;
      return json(res,200,{nickname:name});
    }
    if(req.method==='PUT'){
      const save=validateSave(data.save),clears=validateClears(data.clears||[],save);
      if(!Number.isSafeInteger(data.revision)||data.revision<0)throw fail(400,'รุ่นเซฟไม่ถูกต้อง');
      if(!/^[-a-f0-9]{36}$/i.test(data.mutationId||''))throw fail(400,'หมายเลขการบันทึกไม่ถูกต้อง');
      const [row]=await sql`SELECT dungeon_save_player(${user.id},${data.revision},${JSON.stringify(save)}::jsonb,${JSON.stringify(clears)}::jsonb,${data.mutationId}) AS result`;
      if(row.result.conflict)return json(res,409,{error:'เซฟบนบัญชีเปลี่ยนจากอีกหน้าต่างหรืออีกเครื่อง กรุณาโหลดเซฟล่าสุดก่อนเล่นต่อ',revision:row.result.revision});
      return json(res,200,row.result);
    }
    const [player]=await sql`SELECT nickname,save,revision,updated_at FROM dungeon_players WHERE user_id=${user.id}`;
    const clears=await sql`SELECT floor,stars FROM dungeon_clears WHERE user_id=${user.id} AND campaign=2 ORDER BY floor`;
    const [best]=await sql`SELECT stars,completed_at,class_id FROM dungeon_rankings WHERE user_id=${user.id} AND campaign=2`;
    json(res,200,{accountId:user.id,...player,revision:Number(player.revision),rankedFloors:clears,best:best||null});
  }catch(error){handleError(res,error);}
}
