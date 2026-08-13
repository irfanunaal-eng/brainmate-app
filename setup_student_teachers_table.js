const { Client } = require('pg');
const poolerHost = 'aws-0-eu-west-2.pooler.supabase.com';
const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@' + poolerHost + ':6543/postgres';

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    
    // Create the junction table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.student_teachers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        relation_type TEXT NOT NULL CHECK (relation_type IN ('class_teacher', 'private_tutor', 'student_coach', 'parent_link')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(student_id, teacher_id, relation_type)
      );
    `;
    await client.query(createTableQuery);

    // Optional: RLS (Row Level Security) - enable row level security on this table
    await client.query(`ALTER TABLE public.student_teachers ENABLE ROW LEVEL SECURITY;`);

    // Create a policy to allow users to see their own relations
    await client.query(`
      DROP POLICY IF EXISTS view_own_relations ON public.student_teachers;
      CREATE POLICY view_own_relations ON public.student_teachers
      FOR SELECT USING (
        auth.uid() = student_id OR auth.uid() = teacher_id
      );
    `);

    // Allow insert
    await client.query(`
      DROP POLICY IF EXISTS insert_own_relations ON public.student_teachers;
      CREATE POLICY insert_own_relations ON public.student_teachers
      FOR ALL USING (true);
    `);

    console.log('Successfully created student_teachers junction table and RLS policies!');
  } catch (err) {
    console.log('ERROR: ' + err.message);
  } finally {
    await client.end();
  }
}
run();
