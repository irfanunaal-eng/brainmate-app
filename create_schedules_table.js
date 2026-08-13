const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:OQv9e3sslyROthVw@db.xyuedhkqcfdmkxurqsgf.supabase.co:5432/postgres',
});

const sql = `
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  schedule_type TEXT,
  materials_needed TEXT,
  is_reminder_active BOOLEAN DEFAULT false,
  reminder_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Creator can see schedules" ON public.schedules FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Student can see their schedules" ON public.schedules FOR SELECT USING (auth.uid() = student_id);

-- Insert policy
CREATE POLICY "Users can create schedules" ON public.schedules FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Update policies
CREATE POLICY "Creator can update schedules" ON public.schedules FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Student can update schedules" ON public.schedules FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Delete policies
CREATE POLICY "Creator can delete schedules" ON public.schedules FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "Student can delete schedules" ON public.schedules FOR DELETE USING (auth.uid() = student_id);
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase');
    await client.query(sql);
    console.log('Schedules table created successfully');
  } catch (err) {
    console.error('Error executing SQL', err);
  } finally {
    await client.end();
  }
}

run();
