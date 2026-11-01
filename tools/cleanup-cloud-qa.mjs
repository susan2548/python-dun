import {readFile,writeFile} from 'node:fs/promises';
import {db} from '../server/db.mjs';
const sql=db(),report=JSON.parse(await readFile(new URL('../../asset-sources/cloud-qa-fixtures.json',import.meta.url),'utf8'));
const browserUsers=await sql`SELECT id::text AS id FROM neon_auth."user" WHERE email LIKE 'dungeon-qa-%@example.com' AND name='ทดสอบนักโค้ด A'`;
const ids=[...new Set([...report.ids,...browserUsers.map(r=>r.id)])];
if(!ids.length||ids.some(id=>!/^[-a-f0-9]{36}$/i.test(id)))throw Error('Unexpected QA fixture identity; cleanup aborted');
await sql.transaction([
 sql`DELETE FROM dungeon_rankings WHERE user_id=ANY(${ids}::text[])`,
 sql`DELETE FROM dungeon_clears WHERE user_id=ANY(${ids}::text[])`,
 sql`DELETE FROM dungeon_players WHERE user_id=ANY(${ids}::text[])`,
 sql`DELETE FROM neon_auth."user" WHERE id::text=ANY(${ids}::text[])`,
]);
const [{remaining}]=await sql`SELECT count(*)::int AS remaining FROM dungeon_rankings`;
const result={removedExplicitQaIdentities:ids.length,remainingRankings:remaining};
await writeFile(new URL('../../asset-sources/cloud-qa-cleanup.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
