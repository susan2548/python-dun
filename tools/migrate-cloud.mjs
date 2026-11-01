import {readFile} from 'node:fs/promises';
import {db} from '../server/db.mjs';
import {sqlStatements} from './sql-statements.mjs';
const steps=sqlStatements((await Promise.all(['schema.sql','ranking-migration.sql'].map(f=>readFile(new URL('../server/'+f,import.meta.url),'utf8')))).join('\n'));
const sql=db();await sql.transaction(steps.map(step=>sql.query(step.trim())));
console.log('Learner schema ready:',steps.length,'additive migration steps.');
