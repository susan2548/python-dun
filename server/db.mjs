import {neon} from '@neondatabase/serverless';
let client;
export function db(){if(!process.env.DATABASE_URL)throw Error('Database configuration missing');return client??=neon(process.env.DATABASE_URL);}
