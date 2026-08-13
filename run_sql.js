const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:OQv9e3sslyROthVw@db.xyuedhkqcfdmkxurqsgf.supabase.co:5432/postgres',
});

const sql = `
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  planned_minutes INTEGER DEFAULT 60,
  completed_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'bekliyor',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Olusturan gorevleri gorebilir" ON public.tasks FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Ogrenci kendine atanan gorevleri gorebilir" ON public.tasks FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Veli veya ogretmen gorev ekleyebilir" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Ogrenci gorevini guncelleyebilir" ON public.tasks FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase');
    await client.query(sql);
    console.log('SQL Executed Successfully');
  } catch (err) {
    console.error('Error executing SQL', err);
  } finally {
    await client.end();
  }
}

run();
