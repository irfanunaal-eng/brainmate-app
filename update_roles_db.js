const { Client } = require('pg');
const poolerHost = 'aws-0-eu-west-2.pooler.supabase.com';
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@' + poolerHost + ':6543/postgres';

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    // First drop the old constraint
    await client.query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;');
    
    // Then add the new constraint
    await client.query(`
      ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('student', 'parent', 'teacher', 'class_teacher', 'private_tutor', 'student_coach'));
    `);
    
    console.log('Successfully updated profiles_role_check constraint!');
  } catch (err) {
    console.log('ERROR: ' + err.message);
  } finally {
    await client.end();
  }
}
run();
