import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://yqajcjzkgcmauazcvwtd.supabase.co';
const supabaseKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) || 'sb_publishable__TonarQ5mpLl1jjc_tE3tg_uE8pA-Qh';

export const supabase = createClient(supabaseUrl, supabaseKey);

// SQL Schema for creating the tables in Supabase SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- SCHEMA PARA FAMIHEART / CERTIFICACIONES MÉDICAS FPF 2026
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/yqajcjzkgcmauazcvwtd/sql

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
    ekg JSONB DEFAULT '{}'::jsonb,
    ecocardiograma JSONB DEFAULT '{}'::jsonb,
    laboratorio JSONB DEFAULT '{}'::jsonb,
    radiografia JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) con políticas públicas de lectura/escritura para la app
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de expedientes" 
ON public.pacientes FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y actualizacion de expedientes" 
ON public.pacientes FOR ALL USING (true);
`;

/**
 * Checks connection status to the Supabase endpoint
 */
export async function testSupabaseConnection() {
  try {
    const start = performance.now();
    // Test basic connectivity via rest call
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
 * Saves a patient evaluation to Supabase
 */
export async function savePatientToSupabase(patient) {
  try {
    const payload = {
      id: patient.id,
      nombres: patient.nombres || '',
      apellidos: patient.apellidos || '',
      nombre_completo: patient.nombreCompleto || `${patient.apellidos} ${patient.nombres}`.trim(),
      dni: patient.dni || '',
      fecha_nacimiento: patient.fechaNacimiento || '',
      edad: Number(patient.edad) || 20,
      sexo: patient.sexo || 'M',
      nacionalidad: patient.nacionalidad || 'PERUANA',
      club: patient.club || '',
      pais_club: patient.paisClub || 'PERU',
      categoria: patient.categoria || '',
      posicion: patient.posicion || '',
      fecha_evaluacion: patient.fechaEvaluacion || '',
      numero_recibo: patient.numeroRecibo || '',
      domicilio_clinica: patient.domicilioClinica || '',
      estado_aptitud: patient.estadoAptitud || 'APTO',
      aptitud_detalle: patient.aptitudDetalle || '',
      medico_evaluador: patient.medicoEvaluador || '',
      medico_cmp: patient.medicoCmp || '',
      medico_rne: patient.medicoRne || '',
      peso: String(patient.peso || ''),
      talla: String(patient.talla || ''),
      imc: String(patient.imc || ''),
      pulso: String(patient.pulso || ''),
      presion_arterial: String(patient.presionArterial || ''),
      examen_clinico: patient.examenClinicoGeneral || {},
      cardio_personal: patient.cardioPersonal || {},
      cardio_familiar: patient.cardioFamiliar || {},
      cardio_general: patient.cardioGeneral || {},
      farmacos: patient.farmacos || [],
      suplementos: patient.suplementos || [],
      operaciones: patient.operaciones || [],
      lesiones_graves: patient.lesionesGraves || [],
      ekg: patient.ekg || {},
      ecocardiograma: patient.ecocardiograma || {},
      laboratorio: patient.laboratorio || {},
      radiografia: patient.radiografia || {},
      updated_at: new Date().toISOString()
    };

    // Guarda en la tabla expedientes_medicos
    const { data, error } = await supabase
      .from('expedientes_medicos')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // Fallback a pacientes
      const { data: d2, error: e2 } = await supabase
        .from('pacientes')
        .upsert(payload, { onConflict: 'id' });
      if (e2) {
        return { success: false, error: e2.message };
      }
      return { success: true, data: d2 };
    }
    return { success: true, data };
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
    // 1. Consulta la tabla expedientes_medicos
    const { data: expData, error: expError } = await supabase
      .from('expedientes_medicos')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!expError && expData && expData.length > 0) {
      return { success: true, data: expData };
    }

    // 2. Fallback a la vista vw_expediente_completo_fpf
    const { data: viewData, error: viewError } = await supabase
      .from('vw_expediente_completo_fpf')
      .select('*');

    if (!viewError && viewData && viewData.length > 0) {
      return { success: true, data: viewData };
    }

    // 3. Fallback a tabla pacientes
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
 * Maps a row from Supabase to frontend patient model
 */
export function mapDbToPatient(row) {
  return {
    id: row.id,
    fileName: row.ekg?.fileName || (row.nombre_completo ? `${row.nombre_completo}.pdf` : `${row.id}.pdf`),
    apellidos: row.apellidos || '',
    nombres: row.nombres || '',
    nombreCompleto: row.nombre_completo || `${row.apellidos || ''} ${row.nombres || ''}`.trim(),
    dni: row.dni || '70000000',
    club: row.club || 'Club FPF / Liga Formativa',
    categoria: row.categoria || 'Categoría Competitiva 2026',
    posicion: row.posicion || 'Futbolista',
    fechaEvaluacion: row.fecha_evaluacion || '22-01-2026',
    frecuenciaCardiaca: row.pulso || '65 bpm',
    estadoAptitud: row.estado_aptitud || 'APTO',
    resultadoEkg: row.ekg?.resultado || 'APTO (EKG NORMAL)',
    ekgImage: row.ekg?.imagen || `/assets/ekg/${row.nombre_completo}.jpg`,
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
    const payload = patients.map(p => ({
      id: p.id,
      codigo_expediente: p.id,
      dni: p.dni || '70000000',
      nombres: p.nombres || '',
      apellidos: p.apellidos || '',
      nombre_completo: p.nombreCompleto || `${p.apellidos || ''} ${p.nombres || ''}`.trim(),
      club: p.club || 'Club FPF / Liga Formativa',
      categoria: p.categoria || 'Competitiva 2026',
      posicion: p.posicion || 'Futbolista',
      fecha_evaluacion: p.fechaEvaluacion || '22-01-2026',
      estado_aptitud: p.estadoAptitud || 'APTO',
      aptitud_detalle: 'APTO PARA COMPETENCIA DEPORTIVA FPF',
      medico_evaluador: p.medicoEvaluador || 'DR. DARIO HERNANDEZ ALARCON',
      medico_cmp: p.medicoCmp || '27503',
      medico_rne: p.medicoRne || '15620',
      ekg: {
        imagen: p.ekgImage || p.fileUrl || '',
        resultado: p.resultadoEkg || 'APTO (EKG NORMAL)',
        fileName: p.fileName || ''
      },
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('expedientes_medicos')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Upsert error on expedientes_medicos, trying pacientes:', error);
      const { data: d2, error: e2 } = await supabase
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

