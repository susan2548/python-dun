import {readFile} from 'node:fs/promises';
import {db} from '../server/db.mjs';
import {sqlStatements} from './sql-statements.mjs';
const steps=sqlStatements(await readFile(new URL('../server/assessment-schema.sql',import.meta.url),'utf8')),sql=db();
await sql.transaction(steps.map(step=>sql.query(step.trim())));
console.log('Assessment schema ready:',steps.length,'additive steps. Existing game tables unchanged.');
