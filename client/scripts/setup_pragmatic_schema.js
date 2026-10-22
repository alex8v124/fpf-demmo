import pg from 'pg';
import { patientTalexsio, patientCarlos } from '../src/data/initialData.js';

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
CREATE TABLE IF NOT EXISTS public.expedientes_medicos (
    id TEXT PRIMARY KEY,
    codigo_expediente TEXT,
    dni TEXT,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    fecha_nacimiento TEXT,
    edad INT,
    sexo TEXT DEFAULT 'M',
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
    salud_femenina JSONB DEFAULT '{}'::jsonb,
    ekg JSONB DEFAULT '{}'::jsonb,
    ecocardiograma JSONB DEFAULT '{}'::jsonb,
    laboratorio JSONB DEFAULT '{}'::jsonb,
    radiografia JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expedientes_medicos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'expedientes_medicos' AND policyname = 'Permitir todo expedientes'
    ) THEN
        CREATE POLICY "Permitir todo expedientes" ON public.expedientes_medicos FOR ALL USING (true);
    END IF;
END $$;
`;

async function main() {
  await client.connect();
  console.log('Creating expedientes_medicos table...');
  await client.query(sql);

  // Seed Talexsio
  const t = patientTalexsio;
  await client.query(`
    INSERT INTO public.expedientes_medicos (
      id, codigo_expediente, dni, nombres, apellidos, nombre_completo, fecha_nacimiento, edad, sexo, nacionalidad,
      club, pais_club, categoria, posicion, fecha_evaluacion, numero_recibo, domicilio_clinica,
      estado_aptitud, aptitud_detalle, medico_evaluador, medico_cmp, medico_rne,
      peso, talla, imc, pulso, presion_arterial,
      examen_clinico, cardio_personal, cardio_familiar, cardio_general,
      farmacos, suplementos, operaciones, lesiones_graves,
      ekg, ecocardiograma, laboratorio, radiografia
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22,
      $23, $24, $25, $26, $27,
      $28, $29, $30, $31,
      $32, $33, $34, $35,
      $36, $37, $38, $39
    )
    ON CONFLICT (id) DO UPDATE SET
      nombre_completo = EXCLUDED.nombre_completo,
      club = EXCLUDED.club,
      estado_aptitud = EXCLUDED.estado_aptitud,
      updated_at = NOW();
  `, [
    t.id, 'FPF-2026-08942', t.dni, t.nombres, t.apellidos, t.nombreCompleto, t.fechaNacimiento, t.edad, t.sexo, t.nacionalidad,
    t.club, t.paisClub, t.categoria, t.posicion, t.fechaEvaluacion, t.numeroRecibo, t.domicilioClinica,
    t.estadoAptitud, t.aptitudDetalle, t.medicoEvaluador, t.medicoCmp, t.medicoRne,
    t.peso, t.talla, t.imc, t.pulso, t.presionArterial,
    JSON.stringify(t.examenClinicoGeneral || {}),
    JSON.stringify(t.cardioPersonal || {}),
    JSON.stringify(t.cardioFamiliar || {}),
    JSON.stringify(t.cardioGeneral || {}),
    JSON.stringify(t.farmacos || []),
    JSON.stringify(t.suplementos || []),
    JSON.stringify(t.operaciones || []),
    JSON.stringify(t.lesionesGraves || []),
    JSON.stringify(t.ekg || {}),
    JSON.stringify(t.ecocardiograma || {}),
    JSON.stringify(t.laboratorio || {}),
    JSON.stringify(t.radiografia || {})
  ]);

  // Seed Carlos
  const c = patientCarlos;
  await client.query(`
    INSERT INTO public.expedientes_medicos (
      id, codigo_expediente, dni, nombres, apellidos, nombre_completo, fecha_nacimiento, edad, sexo, nacionalidad,
      club, pais_club, categoria, posicion, fecha_evaluacion, numero_recibo, domicilio_clinica,
      estado_aptitud, aptitud_detalle, medico_evaluador, medico_cmp, medico_rne,
      peso, talla, imc, pulso, presion_arterial,
      examen_clinico, cardio_personal, cardio_familiar, cardio_general,
      farmacos, suplementos, operaciones, lesiones_graves,
      ekg, ecocardiograma, laboratorio, radiografia
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22,
      $23, $24, $25, $26, $27,
      $28, $29, $30, $31,
      $32, $33, $34, $35,
      $36, $37, $38, $39
    )
    ON CONFLICT (id) DO UPDATE SET
      nombre_completo = EXCLUDED.nombre_completo,
      club = EXCLUDED.club,
      estado_aptitud = EXCLUDED.estado_aptitud,
      updated_at = NOW();
  `, [
    c.id, 'FPF-2026-07412', c.dni, c.nombres, c.apellidos, c.nombreCompleto, c.fechaNacimiento, c.edad, c.sexo, c.nacionalidad,
    c.club, c.paisClub, c.categoria, c.posicion, c.fechaEvaluacion, c.numeroRecibo, c.domicilioClinica,
    c.estadoAptitud, c.aptitudDetalle, c.medicoEvaluador, c.medicoCmp, c.medicoRne,
    c.peso, c.talla, c.imc, c.pulso, c.presionArterial,
    JSON.stringify(c.examenClinicoGeneral || {}),
    JSON.stringify(c.cardioPersonal || {}),
    JSON.stringify(c.cardioFamiliar || {}),
    JSON.stringify(c.cardioGeneral || {}),
    JSON.stringify(c.farmacos || []),
    JSON.stringify(c.suplementos || []),
    JSON.stringify(c.operaciones || []),
    JSON.stringify(c.lesionesGraves || []),
    JSON.stringify(c.ekg || {}),
    JSON.stringify(c.ecocardiograma || {}),
    JSON.stringify(c.laboratorio || {}),
    JSON.stringify(c.radiografia || {})
  ]);

  console.log('expedientes_medicos populated successfully with Talexsio and Carlos!');
  await client.end();
}

main();
