const { Client } = require('pg');

const poolerHost = 'aws-0-eu-west-2.pooler.supabase.com';
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@' + poolerHost + ':6543/postgres';

const client = new Client({
  connectionString: connectionString,
});

async function check() {
  try {
    await client.connect();
    const res = await client.query("SELECT to_regclass('public.tasks');");
    if (res.rows[0].to_regclass) {
      console.log('TABLE_EXISTS');
    } else {
      console.log('TABLE_DOES_NOT_EXIST');
    }
  } catch (err) {
    console.log('ERROR: ' + err.message);
  } finally {
    await client.end();
  }
}

check();
