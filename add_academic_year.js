const { Client } = require('pg');
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });
async function updateScheduleTable() {
  try {
    await client.connect();
    // Add academic_year column defaulting to 2024-2025
    await client.query("ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2024-2025';");
    console.log('ALTER DONE schedules table');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
updateScheduleTable();
