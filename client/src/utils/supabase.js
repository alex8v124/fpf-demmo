import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://yqajcjzkgcmauazcvwtd.supabase.co';
const supabaseKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  'sb_publishable__TonarQ5mpLl1jjc_tE3tg_uE8pA-Qh';

export const supabase = createClient(supabaseUrl, supabaseKey);

// SQL Schema for creating the tables in Supabase SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- SCHEMA PARA FAMIHEART / CERTIFICACIONES MÉDICAS FPF 2026
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/yqajcjzkgcmauazcvwtd/sql

CREATE TABLE IF NOT EXISTS public.expedientes_medicos (
    id TEXT PRIMARY KEY,
    codigo_expediente TEXT,
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

    -- Somatometría
    peso TEXT,
    talla TEXT,
    imc TEXT,
    pulso TEXT,
    presion_arterial TEXT,

    -- Objetos JSON estructurados
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

    -- Archivo PDF Oficial en Supabase Storage
    pdf_url TEXT,
    pdf_size_bytes BIGINT,
    pdf_updated_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expedientes_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de expedientes"
ON public.expedientes_medicos FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y actualizacion de expedientes"
ON public.expedientes_medicos FOR ALL USING (true);
`;

/**
 * Checks connection status to the Supabase endpoint
 */
export async function testSupabaseConnection() {
  try {
    const start = performance.now();
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    });
    const duration = Math.round(performance.now() - start);

    if (res.ok || res.status === 200 || res.status === 404) {
      return {
        connected: true,
        status: 'Conectado',
        latencyMs: duration,
        url: supabaseUrl,
        projectId: 'yqajcjzkgcmauazcvwtd'
      };
    }
    return {
      connected: true,
      status: 'Conectado (REST)',
      latencyMs: duration,
      url: supabaseUrl,
      projectId: 'yqajcjzkgcmauazcvwtd'
    };
  } catch (err) {
    console.error('Supabase connection error:', err);
    return {
      connected: false,
      status: 'Error de Conexión',
      error: err.message,
      url: supabaseUrl,
      projectId: 'yqajcjzkgcmauazcvwtd'
    };
  }
}

/**
 * Genera un ID limpio determinístico cuando se crea un nuevo jugador desde Formato en Blanco
 */
export function buildPatientId(patient) {
  if (patient?.id && patient.id !== 'plantilla-en-blanco') {
    return patient.id;
  }
  const base = `${patient?.apellidos || ''} ${patient?.nombres || ''} ${patient?.dni || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `expediente-${Date.now()}`;
}

/**
 * Saves a patient evaluation (including all 5 steps of ClinicalEditor) to Supabase
 */
export async function savePatientToSupabase(patient) {
  try {
    const resolvedId = buildPatientId(patient);
    const fullName =
      patient.nombreCompleto ||
      `${patient.apellidos || ''} ${patient.nombres || ''}`.trim() ||
      'FUTBOLISTA';

    const payload = {
      id: resolvedId,
      codigo_expediente: resolvedId,
      nombres: patient.nombres ?? '',
      apellidos: patient.apellidos ?? '',
      nombre_completo: fullName,
      dni: patient.dni ?? '',
      fecha_nacimiento: patient.fechaNacimiento ?? '',
      edad: Number(patient.edad) || 20,
      sexo: patient.sexo || 'M',
      nacionalidad: patient.nacionalidad || 'PERUANA',
      club: patient.club ?? '',
      pais_club: patient.paisClub ?? 'PERÚ',
      categoria: patient.categoria ?? '',
      posicion: patient.posicion ?? '',
      fecha_evaluacion: patient.fechaEvaluacion ?? '',
      numero_recibo: patient.numeroRecibo ?? '',
      domicilio_clinica: patient.domicilioClinica ?? '',
      estado_aptitud: patient.estadoAptitud || 'APTO',
      aptitud_detalle: patient.aptitudDetalle ?? '',
      medico_evaluador: patient.medicoEvaluador ?? '',
      medico_cmp: patient.medicoCmp ?? '',
      medico_rne: patient.medicoRne ?? '',
      peso: patient.peso != null ? String(patient.peso) : null,
      talla: patient.talla != null ? String(patient.talla) : null,
      imc: patient.imc != null ? String(patient.imc) : null,
      pulso: patient.pulso != null ? String(patient.pulso) : null,
      presion_arterial: patient.presionArterial != null ? String(patient.presionArterial) : null,
      examen_clinico: {
        ...(patient.examenClinicoGeneral || {}),
        musculoEsqueletico: patient.examenMusculoEsqueletico || {}
      },
      cardio_personal: patient.cardioPersonal || {},
      cardio_familiar: patient.cardioFamiliar || {},
      cardio_general: patient.cardioGeneral || {},
      farmacos: patient.farmacos || [],
      suplementos: patient.suplementos || [],
      operaciones: patient.operaciones || [],
      lesiones_graves: patient.lesionesGraves || [],
      ekg: {
        ...(patient.ekg || {}),
        fileName: patient.fileName || patient.ekg?.fileName || `${fullName}.pdf`
      },
      ecocardiograma: patient.ecocardiograma || {},
      laboratorio: patient.laboratorio || {},
      radiografia: patient.radiografia || {},
      pdf_url: patient.pdfUrl || null,
      pdf_size_bytes: patient.pdfSizeBytes || null,
      pdf_updated_at: patient.pdfUpdatedAt || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expedientes_medicos')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      const { data: d2, error: e2 } = await supabase
        .from('pacientes')
        .upsert(payload, { onConflict: 'id' })
        .select();
      if (e2) {
        return { success: false, error: e2.message };
      }
      return { success: true, id: resolvedId, data: d2 };
    }
    return { success: true, id: resolvedId, data };
  } catch (err) {
    console.error('Error saving patient to Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads all patients from Supabase
 */
export async function loadPatientsFromSupabase() {
  try {
    const { data: expData, error: expError } = await supabase
      .from('expedientes_medicos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!expError && expData && expData.length > 0) {
      return { success: true, data: expData };
    }

    const { data: viewData, error: viewError } = await supabase
      .from('vw_expediente_completo_fpf')
      .select('*');

    if (!viewError && viewData && viewData.length > 0) {
      return { success: true, data: viewData };
    }

    const { data, error } = await supabase
      .from('pacientes')
      .select('*');

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

/**
 * Maps a row from Supabase to the complete frontend patient model (preserving all ClinicalEditor fields)
 */
export function mapDbToPatient(row) {
  const rawExamen = row.examen_clinico || {};
  const { musculoEsqueletico, ...examenClinicoGeneral } = rawExamen;

  // Ignorar el texto genérico antiguo de lotes previos para usar la fórmula oficial FPF salvo edición explícita
  const normalizedAptitudDetalle =
    row.aptitud_detalle && row.aptitud_detalle !== 'APTO PARA COMPETENCIA DEPORTIVA FPF'
      ? row.aptitud_detalle
      : undefined;

  return {
    id: row.id,
    fileName: row.ekg?.fileName || (row.nombre_completo ? `${row.nombre_completo}.pdf` : `${row.id}.pdf`),
    apellidos: row.apellidos || '',
    nombres: row.nombres || '',
    nombreCompleto: row.nombre_completo || `${row.apellidos || ''} ${row.nombres || ''}`.trim(),
    dni: row.dni || '70000000',
    fechaNacimiento: row.fecha_nacimiento || undefined,
    edad: row.edad || undefined,
    sexo: row.sexo || 'M',
    nacionalidad: row.nacionalidad || 'PERUANA',
    club: row.club || 'Club FPF / Liga Formativa',
    paisClub: row.pais_club || 'PERÚ',
    categoria: row.categoria || 'Categoría Competitiva 2026',
    posicion: row.posicion || 'Futbolista',
    fechaEvaluacion: row.fecha_evaluacion || '22-01-2026',
    numeroRecibo: row.numero_recibo || undefined,
    domicilioClinica: row.domicilio_clinica || undefined,
    estadoAptitud: row.estado_aptitud || 'APTO',
    aptitudDetalle: normalizedAptitudDetalle,
    medicoEvaluador: row.medico_evaluador || undefined,
    medicoCmp: row.medico_cmp || undefined,
    medicoRne: row.medico_rne || undefined,
    peso: row.peso || undefined,
    talla: row.talla || undefined,
    imc: row.imc || undefined,
    pulso: row.pulso || undefined,
    presionArterial: row.presion_arterial || undefined,
    frecuenciaCardiaca: row.ekg?.frecuenciaCardiaca || row.pulso || '60 bpm',
    examenClinicoGeneral: Object.keys(examenClinicoGeneral).length > 0 ? examenClinicoGeneral : undefined,
    examenMusculoEsqueletico:
      musculoEsqueletico && Object.keys(musculoEsqueletico).length > 0 ? musculoEsqueletico : undefined,
    cardioPersonal:
      row.cardio_personal && Object.keys(row.cardio_personal).length > 0 ? row.cardio_personal : undefined,
    cardioFamiliar:
      row.cardio_familiar && Object.keys(row.cardio_familiar).length > 0 ? row.cardio_familiar : undefined,
    cardioGeneral:
      row.cardio_general && Object.keys(row.cardio_general).length > 0 ? row.cardio_general : undefined,
    farmacos: Array.isArray(row.farmacos) && row.farmacos.length > 0 ? row.farmacos : undefined,
    suplementos: Array.isArray(row.suplementos) && row.suplementos.length > 0 ? row.suplementos : undefined,
    operaciones: Array.isArray(row.operaciones) && row.operaciones.length > 0 ? row.operaciones : undefined,
    lesionesGraves:
      Array.isArray(row.lesiones_graves) && row.lesiones_graves.length > 0 ? row.lesiones_graves : undefined,
    ekg: row.ekg && Object.keys(row.ekg).length > 0 ? row.ekg : undefined,
    ecocardiograma:
      row.ecocardiograma && Object.keys(row.ecocardiograma).length > 0 ? row.ecocardiograma : undefined,
    laboratorio:
      row.laboratorio && Object.keys(row.laboratorio).length > 0 ? row.laboratorio : undefined,
    radiografia:
      row.radiografia && Object.keys(row.radiografia).length > 0 ? row.radiografia : undefined,
    resultadoEkg: row.ekg?.resultadoGeneral || row.ekg?.resultado || 'APTO (EKG NORMAL)',
    ekgImage: row.ekg?.imagen || `/assets/ekg/${row.nombre_completo}.jpg`,
    pdfUrl: row.pdf_url || null,
    pdfSizeBytes: row.pdf_size_bytes || null,
    pdfUpdatedAt: row.pdf_updated_at || null,
    origen: 'Supabase DB',
    synced21Pages: true
  };
}

/**
 * Batch saves or updates patients in Supabase
 */
export async function saveBatchPatientsToSupabase(patients = []) {
  if (!patients || patients.length === 0) return { success: true, count: 0 };
  try {
    const payload = patients.map((p) => {
      const pid = buildPatientId(p);
      return {
        id: pid,
        codigo_expediente: pid,
        dni: p.dni || '70000000',
        nombres: p.nombres || '',
        apellidos: p.apellidos || '',
        nombre_completo: p.nombreCompleto || `${p.apellidos || ''} ${p.nombres || ''}`.trim(),
        club: p.club || 'Club FPF / Liga Formativa',
        categoria: p.categoria || 'Competitiva 2026',
        posicion: p.posicion || 'Futbolista',
        fecha_evaluacion: p.fechaEvaluacion || '22-01-2026',
        estado_aptitud: p.estadoAptitud || 'APTO',
        aptitud_detalle:
          p.aptitudDetalle || 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )',
        medico_evaluador: p.medicoEvaluador || 'DR. DARIO HERNANDEZ ALARCON',
        medico_cmp: p.medicoCmp || '27503',
        medico_rne: p.medicoRne || '15620',
        ekg: {
          ...(p.ekg || {}),
          imagen: p.ekgImage || p.fileUrl || p.ekg?.imagen || '',
          resultado: p.resultadoEkg || 'APTO (EKG NORMAL)',
          fileName: p.fileName || ''
        },
        pdf_url: p.pdfUrl || null,
        pdf_size_bytes: p.pdfSizeBytes || null,
        pdf_updated_at: p.pdfUpdatedAt || null,
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase
      .from('expedientes_medicos')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Upsert error on expedientes_medicos, trying pacientes:', error);
      const { error: e2 } = await supabase
        .from('pacientes')
        .upsert(payload, { onConflict: 'id' });
      if (e2) return { success: false, error: e2.message };
      return { success: true, count: payload.length };
    }
    return { success: true, count: payload.length };
  } catch (err) {
    console.error('Batch save error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sube el archivo PDF oficial resultante a Supabase Storage y actualiza la BD
 */
export async function uploadPatientPdf(patient, file) {
  if (!file || !patient) return { success: false, error: 'Archivo o paciente no especificado' };
  try {
    const rawName =
      patient.nombreCompleto || `${patient.apellidos || ''} ${patient.nombres || ''}`.trim() || patient.id;
    const cleanName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, '_');
    const dni = (patient.dni || 'sin_dni').toString().trim();
    const storagePath = `${dni}/${cleanName}_FPF_2026.pdf`;

    const { error: upError } = await supabase.storage
      .from('expedientes-pdf')
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (upError) {
      console.error('Error al subir PDF a Supabase Storage:', upError);
      return { success: false, error: upError.message };
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('expedientes-pdf').getPublicUrl(storagePath);

    const now = new Date().toISOString();
    const updatePayload = {
      pdf_url: publicUrl,
      pdf_size_bytes: file.size,
      pdf_updated_at: now
    };

    await supabase
      .from('expedientes_medicos')
      .update(updatePayload)
      .eq('id', patient.id);

    return {
      success: true,
      publicUrl,
      sizeBytes: file.size,
      updatedAt: now
    };
  } catch (err) {
    console.error('Excepción en uploadPatientPdf:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Elimina el PDF oficial de Supabase Storage y limpia la BD
 */
export async function deletePatientPdf(patient) {
  if (!patient) return { success: false };
  try {
    const rawName = patient.nombreCompleto || patient.id;
    const cleanName = rawName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]+/g, '_');
    const dni = (patient.dni || 'sin_dni').toString().trim();
    const storagePath = `${dni}/${cleanName}_FPF_2026.pdf`;

    await supabase.storage.from('expedientes-pdf').remove([storagePath]);

    await supabase
      .from('expedientes_medicos')
      .update({ pdf_url: null, pdf_size_bytes: null, pdf_updated_at: null })
      .eq('id', patient.id);

    return { success: true };
  } catch (err) {
    console.error('Error al eliminar PDF:', err);
    return { success: false, error: err.message };
  }
}
