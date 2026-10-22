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

const sql = `
CREATE TABLE IF NOT EXISTS public.pacientes (
    id TEXT PRIMARY KEY,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    dni TEXT,
    fecha_nacimiento TEXT,
    edad INTEGER,
    sexo TEXT,
    nacionalidad TEXT DEFAULT 'PERUANA',
    club TEXT,
    pais_club TEXT DEFAULT 'PERU',
    categoria TEXT,
    posicion TEXT,
    fecha_evaluacion TEXT,
    numero_recibo TEXT,
    domicilio_clinica TEXT,
    estado_aptitud TEXT DEFAULT 'APTO',
    aptitud_detalle TEXT,
    medico_evaluador TEXT,
    medico_cmp TEXT,
    medico_rne TEXT,
    peso TEXT,
    talla TEXT,
    imc TEXT,
    pulso TEXT,
    presion_arterial TEXT,
    examen_clinico JSONB DEFAULT '{}'::jsonb,
    cardio_personal JSONB DEFAULT '{}'::jsonb,
    cardio_familiar JSONB DEFAULT '{}'::jsonb,
    cardio_general JSONB DEFAULT '{}'::jsonb,
    farmacos JSONB DEFAULT '[]'::jsonb,
    suplementos JSONB DEFAULT '[]'::jsonb,
    operaciones JSONB DEFAULT '[]'::jsonb,
    lesiones_graves JSONB DEFAULT '[]'::jsonb,
    ekg JSONB DEFAULT '{}'::jsonb,
    ecocardiograma JSONB DEFAULT '{}'::jsonb,
    laboratorio JSONB DEFAULT '{}'::jsonb,
    radiografia JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'Permitir lectura publica de expedientes'
    ) THEN
        CREATE POLICY "Permitir lectura publica de expedientes" ON public.pacientes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'Permitir insercion y actualizacion de expedientes'
    ) THEN
        CREATE POLICY "Permitir insercion y actualizacion de expedientes" ON public.pacientes FOR ALL USING (true);
    END IF;
END $$;
`;

async function main() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected! Creating tables...');
    await client.query(sql);
    console.log('Table public.pacientes created/verified successfully!');

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
    console.log('Public tables in Postgres:', res.rows.map(r => r.table_name));

    await client.end();
    console.log('Migration finished successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

main();
