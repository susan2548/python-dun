import {readFile} from 'node:fs/promises';
import {db} from '../server/db.mjs';
const steps=(await readFile(new URL('../server/schema.sql',import.meta.url),'utf8')).split('-- migrate-step');
for(const step of steps)await db().query(step.trim());
console.log('Learner schema ready:',steps.length,'additive migration steps.');
