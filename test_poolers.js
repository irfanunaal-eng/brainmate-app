const { Client } = require('pg');

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ca-central-1'
];

const sql = `
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 1: Pazartesi, 7: Pazar
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  schedule_type TEXT, -- 'okul', 'dersane', 'ozel_ders'
  materials_needed TEXT, -- Örn: "Eşofman, Pergel Takımı"
  is_reminder_active BOOLEAN DEFAULT false,
  reminder_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 1. Okuma İzinleri (Select)
CREATE POLICY "Schedules_select_creator" ON public.schedules 
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Schedules_select_student" ON public.schedules 
  FOR SELECT USING (auth.uid() = student_id);

-- 2. Ekleme İzni (Insert)
CREATE POLICY "Schedules_insert" ON public.schedules 
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 3. Güncelleme İzinleri (Update)
CREATE POLICY "Schedules_update_creator" ON public.schedules 
  FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Schedules_update_student" ON public.schedules 
  FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- 4. Silme İzinleri (Delete)
CREATE POLICY "Schedules_delete_creator" ON public.schedules 
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Schedules_delete_student" ON public.schedules 
  FOR DELETE USING (auth.uid() = student_id);
`;

async function testRegions() {
  for (const region of regions) {
    const poolerHost = 'aws-0-' + region + '.pooler.supabase.com';
    console.log('Trying region: ' + region + ' (' + poolerHost + ')');
    
    const connectionString = 'postgresql://postgres.xyuedhkqcfdmkxurqsgf:OQv9e3sslyROthVw@' + poolerHost + ':6543/postgres';
    
    const client = new Client({
      connectionString: connectionString,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log('[SUCCESS] Connected via ' + region + '! Executing SQL...');
      await client.query(sql);
      console.log('[SUCCESS] SQL Executed successfully!');
      await client.end();
      return; // Exit on success
    } catch (err) {
      console.log('[FAIL] Region ' + region + ' failed: ' + err.message);
      await client.end().catch(()=>{}).finally(()=>{});
    }
  }
  console.log('All regions failed.');
}

testRegions();
