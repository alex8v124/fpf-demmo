import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.yqajcjzkgcmauazcvwtd',
  password: 'VUGV5bTmVPzYJczF',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase Postgres.');

  // 1. Columnas para guardar el PDF oficial resultante
  await client.query(`
    ALTER TABLE public.expedientes_medicos ADD COLUMN IF NOT EXISTS pdf_url TEXT;
    ALTER TABLE public.expedientes_medicos ADD COLUMN IF NOT EXISTS pdf_size_bytes BIGINT;
    ALTER TABLE public.expedientes_medicos ADD COLUMN IF NOT EXISTS pdf_updated_at TIMESTAMPTZ;
    ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
  `);
  console.log('Added pdf_url columns.');

  // 2. Crear bucket expedientes-pdf
  await client.query(`
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('expedientes-pdf', 'expedientes-pdf', true, 52428800, ARRAY['application/pdf']::text[])
    ON CONFLICT (id) DO UPDATE SET public = true;
  `);
  console.log('Created/updated storage.buckets for expedientes-pdf.');

  // 3. RLS policies on storage.objects
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for expedientes-pdf'
      ) THEN
        CREATE POLICY "Public Access for expedientes-pdf"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'expedientes-pdf');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Upload for expedientes-pdf'
      ) THEN
        CREATE POLICY "Allow Upload for expedientes-pdf"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'expedientes-pdf');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Update for expedientes-pdf'
      ) THEN
        CREATE POLICY "Allow Update for expedientes-pdf"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'expedientes-pdf');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Delete for expedientes-pdf'
      ) THEN
        CREATE POLICY "Allow Delete for expedientes-pdf"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'expedientes-pdf');
      END IF;
    END
    $$;
  `);
  console.log('Storage policies applied successfully.');

  const buckets = await client.query('SELECT * FROM storage.buckets;');
  console.log('Current buckets:', buckets.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
