const { Client } = require('pg');
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });
async function check() {
  try {
    await client.connect();
    const res = await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;");
    console.log('ALTER DONE');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
