const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log(res.rows);
  await client.end();
}
check();
