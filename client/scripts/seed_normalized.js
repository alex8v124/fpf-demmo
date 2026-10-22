import pg from 'pg';
import { initialStaff } from '../src/data/initialData.js';

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
  try {
    await client.connect();
    console.log('Seeding normalized data...');

    // 1. Sedes
    const sedeRes = await client.query(`
      INSERT INTO public.sedes_clinicas (codigo_sede, razon_social, nombre_comercial, ruc, direccion, distrito)
      VALUES ('SEDE-01', 'FAMIHEART S.A.C.', 'Famiheart Cardiología & Deporte', '20601234567', 'Av. Conquistadores 1588', 'San Isidro')
      ON CONFLICT (codigo_sede) DO UPDATE SET direccion = EXCLUDED.direccion
      RETURNING id;
    `);
    const sedeId = sedeRes.rows[0].id;

    // 2. Clubes
    const clubURes = await client.query(`
      INSERT INTO public.clubes (nombre, siglas, division)
      VALUES ('Club Universitario de Deportes', 'U', 'Primera División / Reserva')
      ON CONFLICT (nombre) DO UPDATE SET siglas = EXCLUDED.siglas
      RETURNING id;
    `);
    const clubUId = clubURes.rows[0].id;

    const clubZRes = await client.query(`
      INSERT INTO public.clubes (nombre, siglas, division)
      VALUES ('Club Deportivo Zúñiga', 'CDZ', 'Primera División')
      ON CONFLICT (nombre) DO UPDATE SET siglas = EXCLUDED.siglas
      RETURNING id;
    `);
    const clubZId = clubZRes.rows[0].id;

    // 3. Personal Médico
    const staffIds = {};
    for (const s of initialStaff) {
      const res = await client.query(`
        INSERT INTO public.personal_salud (nombres, apellidos, cmp, rne, ctmp, especialidad, rol_institucional, firma_url, sello_texto)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `, [
        s.name.replace(/^Dr\.\s*|^Lic\.\s*/, '').split(' ').slice(0, 2).join(' '),
        s.name.split(' ').slice(2).join(' ') || 'Médico',
        s.cmp || null,
        s.rne || null,
        s.ctmp || null,
        s.specialty,
        s.role,
        s.signatureImg,
        s.stampText
      ]);
      staffIds[s.id] = res.rows[0].id;
    }

    const darioId = staffIds['dario-hernandez'];
    const lisbettId = staffIds['lisbett-hilares'];
    const jorgeVeraId = staffIds['jorge-vera'];

    // 4. Paciente: Talexsio Guzmán Addu Elías
    const pTalexsioRes = await client.query(`
      INSERT INTO public.pacientes (numero_documento, nombres, apellidos, fecha_nacimiento, sexo, nacionalidad)
      VALUES ('74829103', 'ADDU ELIAS', 'TALEXSIO GUZMAN', '2005-04-14', 'M', 'PERUANA')
      ON CONFLICT (numero_documento) DO UPDATE SET nombres = EXCLUDED.nombres
      RETURNING id;
    `);
    const pTalexsioId = pTalexsioRes.rows[0].id;

    // Ficha Deportiva
    await client.query(`
      INSERT INTO public.fichas_deportivas (paciente_id, club_id, categoria, posicion)
      VALUES ($1, $2, 'Primera División / Reserva', 'Delantero / Extremo');
    `, [pTalexsioId, clubUId]);

    // Evaluación Médica
    const evTalexsioRes = await client.query(`
      INSERT INTO public.evaluaciones_medicas (
        codigo_expediente, paciente_id, club_id, sede_id, medico_responsable_id,
        fecha_evaluacion, numero_recibo, estado_aptitud, dictamen_oficial_texto
      ) VALUES (
        'FPF-2026-08942', $1, $2, $3, $4,
        '2026-10-07', 'REC-2026-08942', 'APTO',
        'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )'
      )
      ON CONFLICT (codigo_expediente) DO UPDATE SET estado_aptitud = EXCLUDED.estado_aptitud
      RETURNING id;
    `, [pTalexsioId, clubUId, sedeId, darioId]);
    const evTalexsioId = evTalexsioRes.rows[0].id;

    // Examen Físico
    await client.query(`
      INSERT INTO public.examen_fisico (
        evaluacion_id, peso_kg, talla_m, pulso_lpm, presion_sistolica_mmhg, presion_diastolica_mmhg,
        arer, aren, no_soplos, vias_aereas_libres
      ) VALUES (
        $1, 68.5, 1.76, 58, 115, 75, TRUE, TRUE, TRUE, TRUE
      ) ON CONFLICT (evaluacion_id) DO NOTHING;
    `, [evTalexsioId]);

    // EKG
    await client.query(`
      INSERT INTO public.electrocardiograma_reposo (
        evaluacion_id, medico_cardiologo_id, frecuencia_cardiaca_lpm, ritmo,
        intervalo_pr_ms, duracion_qrs_ms, intervalo_qt_ms, intervalo_qtc_ms,
        conclusion_diagnostica, imagen_trazado_url
      ) VALUES (
        $1, $2, 53, 'Sinusal regular', 122, 84, 419, 393,
        'EKG NORMAL', '/assets/talexsio/ecg.jpeg'
      ) ON CONFLICT (evaluacion_id) DO NOTHING;
    `, [evTalexsioId, darioId]);

    // Ecocardiograma
    await client.query(`
      INSERT INTO public.ecocardiograma_doppler (
        evaluacion_id, medico_cardiologo_id, ventriculo_derecho_mm, aorta_raiz_mm,
        aorta_apertura_mm, septum_interventricular_mm, vi_diastole_mm, vi_sistole_mm,
        pared_posterior_vi_mm, auricula_izquierda_diametro_mm, fraccion_eyeccion_porc,
        fraccion_acortamiento_porc, onda_e_mitral_cm_s, onda_a_mitral_cm_s
      ) VALUES (
        $1, $2, 22, 24, 16, 10, 50, 23, 10, 28, 57, 39, 74, 66
      ) ON CONFLICT (evaluacion_id) DO NOTHING;
    `, [evTalexsioId, darioId]);

    // Laboratorio Hemograma
    await client.query(`
      INSERT INTO public.laboratorio_hemograma (
        evaluacion_id, tecnologo_id, globulos_rojos_mm3, hemoglobina_gr_dl, hematocrito_porc,
        leucocitos_mm3, plaquetas_mm3, vcm_fl, hcm_pg, chcm_gr_dl,
        linfocitos_porc, monocitos_porc, eosinofilos_porc, basofilos_porc, segmentados_porc, abastonados_porc
      ) VALUES (
        $1, $2, 4630000.00, 14.7, 43.0, 5730.00, 236000.00, 89.0, 28.0, 32.0,
        26, 6, 2, 0, 66, 0
      ) ON CONFLICT (evaluacion_id) DO NOTHING;
    `, [evTalexsioId, lisbettId]);

    // Radiografía
    await client.query(`
      INSERT INTO public.radiografia_torax (
        evaluacion_id, medico_radiologo_id, conclusion_radiologica, imagen_placa_url
      ) VALUES (
        $1, $2, 'Estudio radiográfico dentro de límites normales', '/assets/talexsio/rayosx.jpeg'
      ) ON CONFLICT (evaluacion_id) DO NOTHING;
    `, [evTalexsioId, jorgeVeraId]);

    console.log('Normalized seeding finished successfully!');

    // Test View Query
    const viewRes = await client.query('SELECT * FROM public.vw_expediente_completo_fpf LIMIT 1;');
    console.log('View Query Success! Player:', viewRes.rows[0].nombre_completo, '| Club:', viewRes.rows[0].club_nombre, '| IMC:', viewRes.rows[0].imc);

    await client.end();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

main();
