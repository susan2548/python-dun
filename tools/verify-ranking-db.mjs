import {readFile} from 'node:fs/promises';
import {randomUUID,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {db} from '../server/db.mjs';
import {sqlStatements} from './sql-statements.mjs';
const sql=db(),schema='dungeon_qa_119_'+randomBytes(6).toString('hex');
if(!/^dungeon_qa_119_[a-f0-9]{12}$/.test(schema))throw Error('Unsafe QA schema');
const names=['dungeon_players','dungeon_clears','dungeon_rankings','dungeon_runs','dungeon_run_clears','dungeon_save_player','dungeon_refresh_ranking'];
const qualify=text=>text.replace(new RegExp('\\b('+names.join('|')+')\\b','g'),name=>schema+'.'+name);
const query=(text,params=[])=>sql.query(qualify(text),params);
let checks=0;
async function put(id,save,clears=[],revision){
 if(revision===undefined){const [p]=await query('SELECT revision FROM dungeon_players WHERE user_id=$1',[id]);revision=Number(p.revision);}
 const [row]=await query('SELECT dungeon_save_player($1,$2,$3::jsonb,$4::jsonb,$5) AS result',[id,revision,JSON.stringify(save),JSON.stringify(clears),randomUUID()]);return row.result;
}
const save=(run= randomUUID(),ms=100000)=>({classId:'wizard',runId:run,playTimeMs:ms,timingVersion:1});
const clears=(run,n,ms=100000,stars=3)=>Array.from({length:n},(_,floor)=>({id:randomUUID(),floor,classId:'wizard',stars,runId:run,elapsedMs:ms-Math.min(90000,(n-1-floor)*1000),timed:true}));
const ranking=async id=>(await query('SELECT * FROM dungeon_rankings WHERE user_id=$1',[id]))[0];
try{
 await sql.query('CREATE SCHEMA '+schema);
 const base=await readFile(new URL('../server/schema.sql',import.meta.url),'utf8');
 for(const step of sqlStatements(base))await query(step);
 // Legacy fixture exists before migration, just as an existing learner does.
 await query("INSERT INTO dungeon_players(user_id,nickname,save) VALUES('legacy','Old learner',$1::jsonb)",[JSON.stringify(save())]);
 for(let i=0;i<12;i++)await query("INSERT INTO dungeon_clears(user_id,campaign,floor,stars,class_id,event_id) VALUES('legacy',2,$1,3,'wizard',$2)",[i,randomUUID()]);
 const migration=await readFile(new URL('../server/ranking-migration.sql',import.meta.url),'utf8');
 for(const step of sqlStatements(migration))await query(step);
 let old=await ranking('legacy');assert.equal(old.stars,36);assert.equal(old.duration_ms,null);assert.equal(old.floors_cleared,12);checks++;
 for(const id of ['fast','slow','partial','reset','imported'])await query('INSERT INTO dungeon_players(user_id,nickname) VALUES($1,$1)',[id]);
 const fast=save(),slow=save(undefined,200000),partial=save();
 await put('fast',fast,clears(fast.runId,12));await put('slow',slow,clears(slow.runId,12,200000));
 await put('partial',partial,clears(partial.runId,3));
 assert.equal((await ranking('partial')).stars,9);assert.equal((await ranking('partial')).completed_at,null);checks++;
 const order=await query('SELECT nickname FROM dungeon_rankings ORDER BY stars DESC,(floors_cleared=12) DESC,duration_ms ASC NULLS LAST,floors_cleared DESC,user_id');
 assert.deepEqual(order.map(r=>r.nickname),['fast','slow','Old learner','partial']);checks++;
 // Duplicate receipt/mutation and lower revision cannot add stars or overwrite.
 const job=randomUUID();const result=await query('SELECT dungeon_save_player($1,1,$2::jsonb,$3::jsonb,$4) AS result',['fast',JSON.stringify(fast),'[]',job]);
 const duplicate=await query('SELECT dungeon_save_player($1,1,$2::jsonb,$3::jsonb,$4) AS result',['fast',JSON.stringify(fast),'[]',job]);
 assert.equal(duplicate[0].result.duplicate,true);assert.equal((await put('fast',fast,[],0)).conflict,true);assert.equal((await ranking('fast')).stars,36);checks++;
 // Reset with an old queued victory must not combine runs into an instant clear.
 const original=save(),restart=save(undefined,1);
 await put('reset',original,clears(original.runId,11));
 await put('reset',restart,[{...clears(original.runId,12)[11],elapsedMs:120000}]);
 assert.equal((await ranking('reset')).floors_cleared,12);assert.equal(Number((await ranking('reset')).duration_ms),120000);checks++;
 await put('reset',restart,clears(restart.runId,1,1000));assert.equal((await ranking('reset')).stars,36);checks++;
 // Imported snapshot stars without authenticated clear receipts never rank.
 const imported={...save(),stars:Array(12).fill(3)};await put('imported',imported);
 assert.equal((await ranking('imported')).stars,0);checks++;
 // A complete new run can beat an earlier time, never a lone replayed floor.
 const second=save(undefined,50000);await put('slow',second,clears(second.runId,1,1000));
 assert.equal(Number((await ranking('slow')).duration_ms),200000);
 await put('slow',second,clears(second.runId,12,50000));assert.equal(Number((await ranking('slow')).duration_ms),50000);checks++;
 // The server's saved run clock is monotonic across stale local snapshots.
 await put('fast',{...fast,playTimeMs:1});const [clock]=await query("SELECT save FROM dungeon_players WHERE user_id='fast'");assert.equal(clock.save.playTimeMs,100000);checks++;
 // Legacy and nickname changes are safe on rerunnable migration.
 for(const step of sqlStatements(migration))await query(step);
 await query("UPDATE dungeon_players SET nickname='Renamed' WHERE user_id='partial'");await query("SELECT dungeon_refresh_ranking('partial')");assert.equal((await ranking('partial')).nickname,'Renamed');checks++;
 console.log(JSON.stringify({passed:checks,isolatedSchema:true,checks:['legacy null timing','unfinished ranking','stars + duration order','duplicate/conflict','queued victory after reset','best preserved','imported stars excluded','faster complete run','monotonic clock','rerunnable migration/nickname']}));
}finally{
 await sql.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');
 console.log('Removed isolated QA schema; learner data untouched.');
}
