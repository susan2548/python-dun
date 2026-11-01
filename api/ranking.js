import {db} from '../server/db.mjs';
import {json,handleError,fail} from '../server/http.mjs';
export default async function handler(req,res){
  try{
    if(req.method!=='GET')throw fail(405,'คำสั่งไม่ถูกต้อง');
    const page=Math.min(1000,Math.max(1,Number.parseInt(new URL(req.url,'https://local').searchParams.get('page'))||1)),sql=db();
    const [{total}]=await sql`SELECT count(*)::int AS total FROM dungeon_rankings WHERE campaign=2`;
    const actualPage=Math.min(page,Math.max(1,Math.ceil(total/20)));
    const rows=await sql`SELECT nickname,class_id,stars,floors_cleared,duration_ms,completed_at,
      row_number() OVER(ORDER BY stars DESC,(floors_cleared=12) DESC,duration_ms ASC NULLS LAST,floors_cleared DESC,completed_at ASC NULLS LAST,user_id ASC)::int AS rank
      FROM dungeon_rankings WHERE campaign=2
      ORDER BY stars DESC,(floors_cleared=12) DESC,duration_ms ASC NULLS LAST,floors_cleared DESC,completed_at ASC NULLS LAST,user_id ASC LIMIT 20 OFFSET ${(actualPage-1)*20}`;
    res.setHeader('Cache-Control','no-store');json(res,200,{page:actualPage,pageSize:20,total,rows,generatedAt:new Date().toISOString(),refreshAfterMs:5000});
  }catch(error){handleError(res,error);}
}
