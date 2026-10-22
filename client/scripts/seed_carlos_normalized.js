import pg from 'pg';
import { patientCarlos } from '../src/data/initialData.js';

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
  
  const clubRes = await client.query("SELECT id FROM public.clubes WHERE siglas = 'CDZ' LIMIT 1;");
  const clubZId = clubRes.rows[0].id;

  const staffRes = await client.query("SELECT id FROM public.personal_salud WHERE cmp = '27503' LIMIT 1;");
  const darioId = staffRes.rows[0].id;

  const radRes = await client.query("SELECT id FROM public.personal_salud WHERE cmp = '26465' LIMIT 1;");
  const aguilId = radRes.rows[0]?.id || darioId;

  // Insert Carlos Ponce
  const pCarlosRes = await client.query(`
    INSERT INTO public.pacientes (numero_documento, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad)
    VALUES ('72194850', 'CARLOS', 'PONCE ECHEVARRIA', '2004-09-18', 'M', 'PERUANA')
    ON CONFLICT (numero_documento) DO UPDATE SET nombres = EXCLUDED.nombres
    RETURNING id;
  `);
  const pCarlosId = pCarlosRes.rows[0].id;

  // Ficha
  await client.query(`
    INSERT INTO public.fichas_deportivas (paciente_id, club_id, categoria, posicion)
    VALUES ($1, $2, 'Copa Perú / Reserva', 'Volante Mixto');
  `, [pCarlosId, clubZId]);

  // Evaluacion
  const evCarlosRes = await client.query(`
    INSERT INTO public.evaluaciones_medicas (
      codigo_expediente, paciente_id, club_id, medico_responsable_id,
      fecha_evaluacion, numero_recibo, estado_aptitud, dictamen_oficial_texto
    ) VALUES (
      'FPF-2026-07412', $1, $2, $3,
      '2026-01-22', 'REC-2026-07412', 'APTO',
      'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )'
    )
    ON CONFLICT (codigo_expediente) DO UPDATE SET estado_aptitud = EXCLUDED.estado_aptitud
    RETURNING id;
  `, [pCarlosId, clubZId, darioId]);
  const evCarlosId = evCarlosRes.rows[0].id;

  // Examen Fisico
  await client.query(`
    INSERT INTO public.examen_fisico (
      evaluacion_id, peso_kg, talla_m, pulso_lpm, presion_sistolica_mmhg, presion_diastolica_mmhg
    ) VALUES ($1, 71.2, 1.78, 60, 120, 80)
    ON CONFLICT (evaluacion_id) DO NOTHING;
  `, [evCarlosId]);

  // EKG
  await client.query(`
    INSERT INTO public.electrocardiograma_reposo (
      evaluacion_id, medico_cardiologo_id, frecuencia_cardiaca_lpm, ritmo,
      intervalo_pr_ms, duracion_qrs_ms, intervalo_qt_ms, intervalo_qtc_ms,
      conclusion_diagnostica, imagen_trazado_url
    ) VALUES (
      $1, $2, 55, 'Sinusal regular', 130, 86, 410, 390,
      'EKG NORMAL', '/assets/electrocardiograma.jpeg'
    ) ON CONFLICT (evaluacion_id) DO NOTHING;
  `, [evCarlosId, darioId]);

  // Ecocardiograma
  await client.query(`
    INSERT INTO public.ecocardiograma_doppler (
      evaluacion_id, medico_cardiologo_id, ventriculo_derecho_mm, aorta_raiz_mm,
      aorta_apertura_mm, septum_interventricular_mm, vi_diastole_mm, vi_sistole_mm,
      pared_posterior_vi_mm, auricula_izquierda_diametro_mm, fraccion_eyeccion_porc,
      fraccion_acortamiento_porc
    ) VALUES (
      $1, $2, 24, 25, 17, 10, 44, 24, 10, 32, 64, 33
    ) ON CONFLICT (evaluacion_id) DO NOTHING;
  `, [evCarlosId, darioId]);

  // Radiografia
  await client.query(`
    INSERT INTO public.radiografia_torax (
      evaluacion_id, medico_radiologo_id, conclusion_radiologica, imagen_placa_url
    ) VALUES ($1, $2, 'Estudio radiográfico dentro de límites normales', '/assets/radiografia-torax.jpeg')
    ON CONFLICT (evaluacion_id) DO NOTHING;
  `, [evCarlosId, aguilId]);

  console.log('Carlos Ponce seeded in normalized schema!');
  await client.end();
}
main();
