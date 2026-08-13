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
