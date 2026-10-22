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

function formatPatientPayload(patient) {
  return [
    patient.id,
    patient.nombres,
    patient.apellidos,
    patient.nombreCompleto,
    patient.dni,
    patient.fechaNacimiento,
    Number(patient.edad) || 20,
    patient.sexo,
    patient.nacionalidad,
    patient.club,
    patient.paisClub,
    patient.categoria,
    patient.posicion,
    patient.fechaEvaluacion,
    patient.numeroRecibo,
    patient.domicilioClinica,
    patient.estadoAptitud,
    patient.aptitudDetalle,
    patient.medicoEvaluador,
    patient.medicoCmp,
    patient.medicoRne,
    String(patient.peso),
    String(patient.talla),
    String(patient.imc),
    String(patient.pulso),
    String(patient.presionArterial),
    JSON.stringify(patient.examenClinicoGeneral || {}),
    JSON.stringify(patient.cardioPersonal || {}),
    JSON.stringify(patient.cardioFamiliar || {}),
    JSON.stringify(patient.cardioGeneral || {}),
    JSON.stringify(patient.farmacos || []),
    JSON.stringify(patient.suplementos || []),
    JSON.stringify(patient.operaciones || []),
    JSON.stringify(patient.lesionesGraves || []),
    JSON.stringify(patient.ekg || {}),
    JSON.stringify(patient.ecocardiograma || {}),
    JSON.stringify(patient.laboratorio || {}),
    JSON.stringify(patient.radiografia || {})
  ];
}

const upsertSql = `
INSERT INTO public.pacientes (
    id, nombres, apellidos, nombre_completo, dni, fecha_nacimiento, edad, sexo, nacionalidad,
    club, pais_club, categoria, posicion, fecha_evaluacion, numero_recibo, domicilio_clinica,
    estado_aptitud, aptitud_detalle, medico_evaluador, medico_cmp, medico_rne,
    peso, talla, imc, pulso, presion_arterial,
    examen_clinico, cardio_personal, cardio_familiar, cardio_general,
    farmacos, suplementos, operaciones, lesiones_graves,
    ekg, ecocardiograma, laboratorio, radiografia
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21,
    $22, $23, $24, $25, $26,
    $27, $28, $29, $30,
    $31, $32, $33, $34,
    $35, $36, $37, $38
)
ON CONFLICT (id) DO UPDATE SET
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    nombre_completo = EXCLUDED.nombre_completo,
    dni = EXCLUDED.dni,
    club = EXCLUDED.club,
    estado_aptitud = EXCLUDED.estado_aptitud,
    aptitud_detalle = EXCLUDED.aptitud_detalle,
    updated_at = NOW();
`;

async function main() {
  try {
    await client.connect();
    console.log('Seeding patients into Supabase PostgreSQL...');

    await client.query(upsertSql, formatPatientPayload(patientTalexsio));
    console.log('Seeded Talexsio Guzman Addu Elias (Club Universitario)');

    await client.query(upsertSql, formatPatientPayload(patientCarlos));
    console.log('Seeded Carlos Ponce Echevarria (Club Zuniga)');

    const countRes = await client.query('SELECT COUNT(*) FROM public.pacientes;');
    console.log('Total pacientes in Supabase DB:', countRes.rows[0].count);

    await client.end();
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

main();
