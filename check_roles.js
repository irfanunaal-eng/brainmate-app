const { Client } = require('pg');
const poolerHost = 'aws-0-eu-west-2.pooler.supabase.com';
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@' + poolerHost + ':6543/postgres';

const client = new Client({ connectionString });

async function check() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'public.profiles'::regclass;
    `);
    console.log(res.rows);
  } catch (err) {
    console.log('ERROR: ' + err.message);
  } finally {
    await client.end();
  }
}
check();
