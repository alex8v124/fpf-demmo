import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  Activity,
  Stethoscope,
  Bone,
  FileCheck2,
  FlaskConical,
  Save,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  Scale,
  Pill,
  Printer
} from 'lucide-react';
import { savePatientToSupabase, buildPatientId } from '../utils/supabase';
import AttachmentSlots from './AttachmentSlots';

const DEFAULT_OPERACIONES = [
  { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Columna', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Cadera', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Pubis', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Rodilla - Meniscos', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Muslo', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Tobillo', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Pie', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Tendón Aquiles', der: false, izq: false, fecha: 'NIEGA' },
  { zona: 'Otra', der: false, izq: false, fecha: 'NIEGA' }
];

const APTITUD_DEFAULTS = {
  APTO: 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )',
  'EN OBSERVACIÓN': 'EN OBSERVACION MEDICA PRE-COMPETENCIA ( FUTBOL )',
  OBSERVADO: 'EN OBSERVACION MEDICA PRE-COMPETENCIA ( FUTBOL )',
  'NO APTO': 'NO APTO PARA REALIZAR ACTIVIDAD DEPORTIVA COMPETITIVA ( FUTBOL )'
};

export default function ClinicalEditor({
  patient,
  setPatient,
  onUpdatePatient,
  onPromoteSavedPatient,
  onNavigateTab,
  onResetBlank,
  onPrint,
  initialStep = 1,
  staffList = []
}) {
  const [currentStep, setCurrentStep] = useState(initialStep || 1);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', title, subtitle }
  const [isSavingDb, setIsSavingDb] = useState(false);

  const showEditorToast = (type, title, subtitle) => {
    setToast({ type, title, subtitle });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to update root patient properties
  const handleChange = (field, value) => {
    setPatient((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper to update nested object (e.g. ekg, ecocardiograma, examenClinicoGeneral, examenMusculoEsqueletico)
  const handleNestedChange = (section, field, value) => {
    setPatient((prev) => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [field]: value
      }
    }));
  };

  // Helper to update nested laboratorio sub-objects (hemograma, bioquimica)
  const handleLabChange = (subSection, field, value) => {
    setPatient((prev) => ({
      ...prev,
      laboratorio: {
        ...(prev?.laboratorio || {}),
        [subSection]: {
          ...(prev?.laboratorio?.[subSection] || {}),
          [field]: value
        }
      }
    }));
  };

  // Helper for IMC automatic calculation
  const handleWeightHeightChange = (field, value) => {
    setPatient((prev) => {
      const updated = { ...prev, [field]: value };
      const rawW = String(field === 'peso' ? value : prev?.peso ?? '71').replace(/[^\d.]/g, '');
      const rawH = String(field === 'talla' ? value : prev?.talla ?? '1.75').replace(/[^\d.]/g, '');
      const w = parseFloat(rawW);
      const h = parseFloat(rawH);
      if (!isNaN(w) && !isNaN(h) && h > 0) {
        const hMeters = h > 3 ? h / 100 : h;
        updated.imc = (w / (hMeters * hMeters)).toFixed(1);
      } else if (!value) {
        updated.imc = '';
      }
      return updated;
    });
  };

  // Helper to update estadoAptitud AND auto-sync aptitudDetalle if using standard text
  const handleAptitudChange = (newStatus) => {
    setPatient((prev) => {
      const currentDetail = (prev?.aptitudDetalle || '').trim().toUpperCase();
      const isStandardOrEmpty =
        !currentDetail || Object.values(APTITUD_DEFAULTS).includes(currentDetail);
      return {
        ...prev,
        estadoAptitud: newStatus,
        aptitudDetalle: isStandardOrEmpty ? APTITUD_DEFAULTS[newStatus] : prev.aptitudDetalle
      };
    });
  };

  const handleSave = async () => {
    setIsSavingDb(true);
    try {
      const finalId = buildPatientId(patient);
      const fullName =
        patient?.nombreCompleto ||
        `${patient?.apellidos || ''} ${patient?.nombres || ''}`.trim() ||
        'FUTBOLISTA';
      const preparedPatient = {
        ...patient,
        id: finalId,
        nombreCompleto: fullName,
        fileName: patient?.fileName || `${fullName}.pdf`
      };

      const res = await savePatientToSupabase(preparedPatient);
      if (onPromoteSavedPatient) {
        onPromoteSavedPatient(preparedPatient);
      } else {
        setPatient(preparedPatient);
      }

      if (res && res.success) {
        showEditorToast(
          'success',
          '¡Expediente guardado exitosamente!',
          'Persistido en la base de datos local (IndexedDB) y sincronizado con el visor de 19 páginas'
        );
      } else {
        showEditorToast(
          'error',
          'Aviso al guardar localmente',
          res?.error || 'No se pudo confirmar la escritura local'
        );
      }
    } catch (e) {
      console.warn('Error saving to Supabase:', e);
      showEditorToast('error', 'Error al guardar localmente', e.message);
    } finally {
      setIsSavingDb(false);
    }
  };

  // Normalizar lista de 13 articulaciones de Operaciones (Página 5)
  const normalizedOperaciones = DEFAULT_OPERACIONES.map((defItem, idx) => {
    const existing =
      patient?.operaciones?.find((o) => o.zona === defItem.zona) || patient?.operaciones?.[idx];
    return existing ? { ...defItem, ...existing, zona: defItem.zona } : defItem;
  });

  // 5 Pasos Claros y Seccionados
  const steps = [
    { number: 1, title: 'Datos del Jugador', desc: 'Certificado FPF & PCMA', icon: User },
    { number: 2, title: 'Anamnesis & Lesiones', desc: 'Cardio, Fármacos y Cirugías', icon: Heart },
    { number: 3, title: 'Examen Físico', desc: 'Somatometría, IMC & Signos', icon: Stethoscope },
    { number: 4, title: 'Cardiología', desc: 'ECG & Ecocardiograma', icon: Activity },
    { number: 5, title: 'Laboratorio & Dictamen', desc: 'Sangre, Anexos & Aptitud', icon: FileCheck2 }
  ];

  // Cálculo visual de IMC y categoría
  const rawPesoCalc = parseFloat(String(patient?.peso ?? '71').replace(/[^\d.]/g, ''));
  const rawTallaCalc = parseFloat(String(patient?.talla ?? '1.75').replace(/[^\d.]/g, ''));
  const fallbackImc =
    !isNaN(rawPesoCalc) && !isNaN(rawTallaCalc) && rawTallaCalc > 0
      ? (rawPesoCalc / ((rawTallaCalc > 3 ? rawTallaCalc / 100 : rawTallaCalc) ** 2)).toFixed(1)
      : '23.2';
  const displayImc = patient?.imc || fallbackImc;
  const imcNum = parseFloat(displayImc) || 23.2;

  const imcCategory =
    imcNum < 18.5
      ? { label: 'Bajo Peso', color: 'text-[#92400E]', bg: 'bg-amber-500' }
      : imcNum <= 24.9
        ? { label: 'Peso Saludable (Normal)', color: 'text-[#166534]', bg: 'bg-emerald-600' }
        : imcNum <= 29.9
          ? { label: 'Sobrepeso Leve', color: 'text-[#92400E]', bg: 'bg-amber-500' }
          : { label: 'Obesidad', color: 'text-[#991B1B]', bg: 'bg-red-600' };

  const inputClass =
    'w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#0369A1] rounded-lg px-3.5 py-2.5 text-sm text-[#1E293B] placeholder:text-slate-400 focus:outline-none transition';

  const compactInputClass =
    'w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#0369A1] rounded-lg px-3 py-2 text-xs text-[#1E293B] placeholder:text-slate-400 focus:outline-none transition';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER DE LA FICHA & ACCIONES */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0369A1] uppercase tracking-wider">
            <span>Editor Clínico Pre-Competencia FPF</span>
            <span>•</span>
            <span className="text-[#64748B]">Paso {currentStep} de 5</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-1">
            {patient?.apellidos
              ? `${patient.apellidos}${patient.nombres ? `, ${patient.nombres}` : ''}`
              : patient?.nombreCompleto || 'Nueva Ficha Médica (En Blanco)'}
          </h1>
          <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3 mt-1.5">
            <span>
              Club: <strong className="text-[#1E293B]">{patient?.club || 'Sin asignar'}</strong>
            </span>
            <span>•</span>
            <span>
              DNI: <strong className="text-[#1E293B]">{patient?.dni || 'Sin registrar'}</strong>
            </span>
            <span>•</span>
            <span>
              Fecha: <strong className="text-[#1E293B]">{patient?.fechaEvaluacion || '22-01-2026'}</strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              Estado:
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  patient?.estadoAptitud === 'NO APTO'
                    ? 'badge-observado'
                    : patient?.estadoAptitud === 'EN OBSERVACIÓN' ||
                        patient?.estadoAptitud === 'OBSERVADO' ||
                        patient?.estadoAptitud === 'PENDIENTE'
                      ? 'badge-renovar'
                      : 'badge-apto'
                }`}
              >
                {patient?.estadoAptitud || 'APTO'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetBlank}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Iniciar una nueva ficha limpia desde cero"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Nueva / En Blanco</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('documento')}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-[#0369A1] border border-[#CBD5E1] px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver 19 Págs</span>
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Imprimir o guardar como PDF las 19 páginas con los cambios actuales"
            >
              <Printer className="w-3.5 h-3.5 text-[#0369A1]" />
              <span>Imprimir PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingDb}
            className="flex items-center space-x-2 bg-[#0369A1] hover:bg-[#075985] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSavingDb ? 'animate-spin' : ''}`} />
            <span>{isSavingDb ? 'Guardando...' : 'Guardar y Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PASOS GUIADA (STEP PROGRESS) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {steps.map((s) => {
            const isCurrent = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            return (
              <button
                type="button"
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`flex items-center space-x-3 p-2.5 rounded-lg text-left transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0369A1] text-white shadow-xs'
                    : isCompleted
                      ? 'bg-slate-50 text-[#1E293B] hover:bg-slate-100'
                      : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold truncate leading-tight">{s.title}</div>
                  <div className={`text-[10px] truncate ${isCurrent ? 'text-sky-100' : 'text-[#64748B]'}`}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL PASO ACTIVO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
        >
          {/* PASO 1: DATOS DEL JUGADOR Y CERTIFICADO FPF */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Bloque 1A: Identificación del Futbolista */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0369A1]" />
                    Ficha de Filiación del Jugador (Páginas 1 y 2 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#0369A1] bg-sky-50 px-2.5 py-0.5 rounded-full">
                    Datos del Deportista
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Apellidos</label>
                    <input
                      type="text"
                      value={patient?.apellidos ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPatient((prev) => ({
                          ...prev,
                          apellidos: val,
                          nombreCompleto: `${val} ${prev?.nombres || ''}`.trim()
                        }));
                      }}
                      placeholder="Ej. PONCE ECHEVARRIA"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombres</label>
                    <input
                      type="text"
                      value={patient?.nombres ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPatient((prev) => ({
                          ...prev,
                          nombres: val,
                          nombreCompleto: `${prev?.apellidos || ''} ${val}`.trim()
                        }));
                      }}
                      placeholder="Ej. CARLOS"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">DNI / Pasaporte</label>
                    <input
                      type="text"
                      value={patient?.dni ?? ''}
                      onChange={(e) => handleChange('dni', e.target.value)}
                      placeholder="Ej. 74829103"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fecha de Nacimiento</label>
                    <input
                      type="text"
                      value={patient?.fechaNacimiento ?? ''}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      placeholder="18-09-2004"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Club / Institución</label>
                    <input
                      type="text"
                      value={patient?.club ?? ''}
                      onChange={(e) => handleChange('club', e.target.value)}
                      placeholder="Ej. UNIVERSITARIO"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">País del Club</label>
                    <input
                      type="text"
                      value={patient?.paisClub ?? 'PERÚ'}
                      onChange={(e) => handleChange('paisClub', e.target.value)}
                      placeholder="PERÚ"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Posición de Juego</label>
                    <input
                      type="text"
                      value={patient?.posicion ?? ''}
                      onChange={(e) => handleChange('posicion', e.target.value)}
                      placeholder="Ej. VOLANTE"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fecha de Evaluación</label>
                    <input
                      type="text"
                      value={patient?.fechaEvaluacion ?? ''}
                      onChange={(e) => handleChange('fechaEvaluacion', e.target.value)}
                      placeholder="22-01-2026"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 1B: Certificado Médico Oficial FPF (Página 1) */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#B91C1C]" />
                    Certificado Médico Oficial FPF (Cara Inicial — Página 1)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#991B1B] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full">
                    Carátula Oficial FPF
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Médico Certificador</label>
                      {staffList && staffList.length > 0 && (
                        <select
                          className="text-[10px] bg-sky-50 text-[#0369A1] font-semibold border border-sky-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                          onChange={(e) => {
                            const found = staffList.find((s) => s.id === e.target.value);
                            if (found) {
                              setPatient((prev) => ({
                                ...prev,
                                medicoEvaluador: found.name.replace(/^Dr\.?\s*|^Dra\.?\s*/i, '').toUpperCase(),
                                medicoCmp: found.cmp || prev?.medicoCmp || '',
                                medicoRne: found.rne || prev?.medicoRne || ''
                              }));
                            }
                          }}
                          value=""
                        >
                          <option value="" disabled>Seleccionar de staff acreditado...</option>
                          {staffList.filter(s => s.active !== false).map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} (CMP {doc.cmp})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input
                      type="text"
                      value={patient?.medicoEvaluador ?? 'DARIO HERNANDEZ'}
                      onChange={(e) => handleChange('medicoEvaluador', e.target.value)}
                      placeholder="DARIO HERNANDEZ"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Colegiatura CMP</label>
                    <input
                      type="text"
                      value={patient?.medicoCmp ?? '27503'}
                      onChange={(e) => handleChange('medicoCmp', e.target.value)}
                      placeholder="27503"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Número de Recibo (Opcional)</label>
                    <input
                      type="text"
                      value={patient?.numeroRecibo ?? ''}
                      onChange={(e) => handleChange('numeroRecibo', e.target.value)}
                      placeholder="Ej. 001-004821"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Centro Clínico / Domicilio</label>
                    <input
                      type="text"
                      value={patient?.domicilioClinica ?? 'AV CONQUISTADORES 1588 SAN ISIDRO'}
                      onChange={(e) => handleChange('domicilioClinica', e.target.value)}
                      placeholder="AV CONQUISTADORES 1588 SAN ISIDRO"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Texto de Aptitud en Certificado FPF (Página 1)
                    </label>
                    <textarea
                      rows={2}
                      value={
                        patient?.aptitudDetalle ??
                        APTITUD_DEFAULTS[patient?.estadoAptitud] ??
                        APTITUD_DEFAULTS.APTO
                      }
                      onChange={(e) => handleChange('aptitudDetalle', e.target.value)}
                      placeholder={APTITUD_DEFAULTS.APTO}
                      className="w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#166534] rounded-lg p-3.5 text-sm text-[#166534] font-semibold focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ANAMNESIS, FÁRMACOS & MÚSCULO-ESQUELÉTICO */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Bloque 2A: Historia Cardiológica Personal, Familiar y General (Página 3) */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#B91C1C]" />
                    Historia Clínica Cardiovascular & General (Página 3 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#0369A1] bg-sky-50 px-2.5 py-0.5 rounded-full">
                    14 Criterios Reactivos SI / NO
                  </span>
                </div>

                {/* Subsección Personal */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    1. Historia Cardiológica Personal
                  </div>
                  {[
                    { key: 'dolorToracico', label: 'Dolor o malestar torácico de esfuerzo' },
                    { key: 'lipotimiaSincope', label: 'Lipotimia o síncope no explicado' },
                    { key: 'disneaFatiga', label: 'Disnea o fatiga desproporcionada en esfuerzo' },
                    { key: 'soploCardiaco', label: 'Soplo cardíaco previo' },
                    { key: 'hipertensionArterial', label: 'Antecedente de hipertensión arterial' },
                    { key: 'restriccionPrevia', label: 'Restricción previa para participar en deporte' }
                  ].map((item) => {
                    const isYes = Boolean(patient?.cardioPersonal?.[item.key]);
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-[#E2E8F0]"
                      >
                        <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleNestedChange('cardioPersonal', item.key, true)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              isYes
                                ? 'bg-[#B91C1C] text-white'
                                : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100 hover:text-[#1E293B]'
                            }`}
                          >
                            SI
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNestedChange('cardioPersonal', item.key, false)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                              !isYes
                                ? 'bg-[#0369A1] text-white'
                                : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100 hover:text-[#1E293B]'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subsección Familiar + General */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      2. Historia Cardiológica Familiar
                    </div>
                    {[
                      { key: 'muerteSubita50', label: 'Muerte súbita cardíaca en familiar < 50 años' },
                      { key: 'enfermedadCoronaria50', label: 'Enfermedad coronaria en familiar < 50 años' },
                      { key: 'cardiopatiaRiesgo', label: 'Cardiopatía familiar con riesgo de muerte súbita' }
                    ].map((item) => {
                      const isYes = Boolean(patient?.cardioFamiliar?.[item.key]);
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-[#E2E8F0] gap-2"
                        >
                          <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleNestedChange('cardioFamiliar', item.key, true)}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                isYes
                                  ? 'bg-[#B91C1C] text-white'
                                  : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100'
                              }`}
                            >
                              SI
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNestedChange('cardioFamiliar', item.key, false)}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                !isYes
                                  ? 'bg-[#0369A1] text-white'
                                  : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100'
                              }`}
                            >
                              NO
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      3. Historia Médica General
                    </div>
                    {[
                      { key: 'cirugiasNoTrauma', label: 'Cirugías no traumatológicas' },
                      { key: 'hospitalizacionesNoQuirurgicas', label: 'Hospitalizaciones no quirúrgicas' },
                      { key: 'tec', label: 'Traumatismo Cráneo Encefálico (TEC)' },
                      { key: 'asmaBronquial', label: 'Asma bronquial' },
                      { key: 'otraPatologia', label: 'Otra patología relevante (epilepsia, diabetes, etc.)' }
                    ].map((item) => {
                      const isYes = Boolean(patient?.cardioGeneral?.[item.key]);
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-[#E2E8F0] gap-2"
                        >
                          <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleNestedChange('cardioGeneral', item.key, true)}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                isYes
                                  ? 'bg-[#B91C1C] text-white'
                                  : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100'
                              }`}
                            >
                              SI
                            </button>
                            <button
                              type="button"
                              onClick={() => handleNestedChange('cardioGeneral', item.key, false)}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                !isYes
                                  ? 'bg-[#0369A1] text-white'
                                  : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100'
                              }`}
                            >
                              NO
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bloque 2B: Fármacos y Suplementos (Página 4) */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[#0369A1]" />
                    Fármacos y Suplementos Nutricionales (Página 4 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Declaración Antidopaje
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Fármacos / Medicación Actual
                    </label>
                    <input
                      type="text"
                      value={patient?.farmacos?.[0]?.nombre ?? 'NINGUNO'}
                      onChange={(e) =>
                        handleChange('farmacos', [{ ...(patient?.farmacos?.[0] || {}), nombre: e.target.value }])
                      }
                      placeholder="NINGUNO"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Suplementos / Ergogénicos
                    </label>
                    <input
                      type="text"
                      value={patient?.suplementos?.[0]?.nombre ?? 'NINGUNO'}
                      onChange={(e) =>
                        handleChange('suplementos', [
                          { ...(patient?.suplementos?.[0] || {}), nombre: e.target.value }
                        ])
                      }
                      placeholder="NINGUNO"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2C: Operaciones y Lesiones (Página 5) */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Bone className="w-4 h-4 text-[#B45309]" />
                    Sistema Músculo-Esquelético — Operaciones (Página 5 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    13 Zonas Anatómicas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[#64748B] uppercase font-bold border-b border-[#E2E8F0]">
                        <th className="py-2.5 px-4">Articulación / Zona</th>
                        <th className="py-2.5 px-4 text-center">Derecha</th>
                        <th className="py-2.5 px-4 text-center">Izquierda</th>
                        <th className="py-2.5 px-4">Estado / Fecha en PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {normalizedOperaciones.map((op, idx) => (
                        <tr key={op.zona} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-semibold text-[#1E293B]">{op.zona}</td>
                          <td className="py-2 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(op.der)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const next = normalizedOperaciones.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        der: checked,
                                        fecha:
                                          checked && (!item.fecha || item.fecha === 'NIEGA')
                                            ? 'OPERADO'
                                            : !checked && !item.izq && item.fecha === 'OPERADO'
                                              ? 'NIEGA'
                                              : item.fecha
                                      }
                                    : item
                                );
                                handleChange('operaciones', next);
                              }}
                              className="rounded bg-white border-[#CBD5E1] text-[#0369A1] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(op.izq)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const next = normalizedOperaciones.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        izq: checked,
                                        fecha:
                                          checked && (!item.fecha || item.fecha === 'NIEGA')
                                            ? 'OPERADO'
                                            : !checked && !item.der && item.fecha === 'OPERADO'
                                              ? 'NIEGA'
                                              : item.fecha
                                      }
                                    : item
                                );
                                handleChange('operaciones', next);
                              }}
                              className="rounded bg-white border-[#CBD5E1] text-[#0369A1] focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-4 max-w-[200px]">
                            <input
                              type="text"
                              value={op.fecha ?? 'NIEGA'}
                              onChange={(e) => {
                                const next = normalizedOperaciones.map((item, i) =>
                                  i === idx ? { ...item, fecha: e.target.value } : item
                                );
                                handleChange('operaciones', next);
                              }}
                              placeholder="NIEGA o fecha (ej. 2024)"
                              className="w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#0369A1] rounded px-2.5 py-1 text-xs text-[#1E293B] focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: EXAMEN FÍSICO & MEDIDOR VISUAL DE IMC */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Bloque 3A: Somatometría con Medidor de IMC */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#0369A1]" />
                    Somatometría & Cálculo de IMC en Tiempo Real (Página 7)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    Cálculo Automático
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Peso (kg)</label>
                    <input
                      type="text"
                      value={patient?.peso ?? '71'}
                      onChange={(e) => handleWeightHeightChange('peso', e.target.value)}
                      placeholder="71"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Talla (m)</label>
                    <input
                      type="text"
                      value={patient?.talla ?? '1.75'}
                      onChange={(e) => handleWeightHeightChange('talla', e.target.value)}
                      placeholder="1.75"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frecuencia / Pulso</label>
                    <input
                      type="text"
                      value={patient?.pulso ?? ''}
                      onChange={(e) => handleChange('pulso', e.target.value)}
                      placeholder="Ej. 60 lpm (opcional en Pág. 7)"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Presión Arterial</label>
                    <input
                      type="text"
                      value={patient?.presionArterial ?? ''}
                      onChange={(e) => handleChange('presionArterial', e.target.value)}
                      placeholder="Ej. 120/80 mmHg (opcional en Pág. 7)"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Medidor Visual de IMC */}
                <div className="p-4 bg-slate-50 rounded-lg border border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Índice de Masa Corporal (IMC — Pág. 7)</span>
                    <span className={`text-xs font-bold ${imcCategory.color}`}>
                      {displayImc} kg/m² • {imcCategory.label}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
                    <motion.div
                      className={`h-full ${imcCategory.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (imcNum / 35) * 100)}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#64748B] font-mono">
                    <span>18.5 (Bajo)</span>
                    <span>24.9 (Normal)</span>
                    <span>29.9 (Sobrepeso)</span>
                    <span>35+ (Obesidad)</span>
                  </div>
                </div>
              </div>

              {/* Bloque 3B: Examen Clínico Segmentario Interactivo */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#166534]" />
                    Examen Físico Segmentario (Página 7 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Clic para alternar NORMAL / ANORMAL
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { section: 'examenClinicoGeneral', key: 'cabeza', label: 'Cabeza' },
                    { section: 'examenClinicoGeneral', key: 'cuello', label: 'Cuello' },
                    { section: 'examenClinicoGeneral', key: 'toraxCorazon', label: 'Tórax: Corazón' },
                    { section: 'examenClinicoGeneral', key: 'toraxPulmonar', label: 'Tórax: Pulmonar' },
                    { section: 'examenClinicoGeneral', key: 'abdomen', label: 'Abdomen' },
                    { section: 'examenMusculoEsqueletico', key: 'columna', label: 'Columna Vertebral' },
                    { section: 'examenMusculoEsqueletico', key: 'codoMano', label: 'Codo – Mano' },
                    { section: 'examenMusculoEsqueletico', key: 'caderaIngle', label: 'Cadera – Ingle' },
                    { section: 'examenMusculoEsqueletico', key: 'rodilla', label: 'Rodilla / Miembro Inf.' }
                  ].map((item) => {
                    const currentVal = patient?.[item.section]?.[item.key] || 'NORMAL';
                    const isAbnormal = currentVal === 'ANORMAL';
                    return (
                      <button
                        type="button"
                        key={`${item.section}-${item.key}`}
                        onClick={() =>
                          handleNestedChange(
                            item.section,
                            item.key,
                            isAbnormal ? 'NORMAL' : 'ANORMAL'
                          )
                        }
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-[#E2E8F0] flex items-center justify-between transition cursor-pointer text-left"
                      >
                        <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isAbnormal ? 'badge-observado' : 'badge-apto'
                          }`}
                        >
                          {isAbnormal ? 'ANORMAL' : 'NORMAL'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: CARDIOLOGÍA (ECG & ECOCARDIOGRAMA) */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Bloque 4A: Electrocardiograma CONMEBOL */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#B91C1C]" />
                    Electrocardiograma de Reposo (Páginas 8 y 16)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {['NORMAL', 'ANORMAL'].map((resOpt) => {
                      const active = (patient?.ekg?.resultadoGeneral || 'NORMAL') === resOpt;
                      return (
                        <button
                          type="button"
                          key={resOpt}
                          onClick={() => handleNestedChange('ekg', 'resultadoGeneral', resOpt)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                            active
                              ? resOpt === 'NORMAL'
                                ? 'bg-[#166534] text-white'
                                : 'bg-[#B91C1C] text-white'
                              : 'bg-slate-100 text-[#64748B] hover:bg-slate-200'
                          }`}
                        >
                          ECG {resOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frecuencia Cardíaca</label>
                    <input
                      type="text"
                      value={patient?.ekg?.frecuenciaCardiaca ?? '58 bpm'}
                      onChange={(e) => handleNestedChange('ekg', 'frecuenciaCardiaca', e.target.value)}
                      placeholder="58 bpm"
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ritmo</label>
                    <input
                      type="text"
                      value={patient?.ekg?.ritmo ?? 'Sinusal regular'}
                      onChange={(e) => handleNestedChange('ekg', 'ritmo', e.target.value)}
                      placeholder="Sinusal regular"
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Intervalo PR</label>
                    <input
                      type="text"
                      value={patient?.ekg?.intervaloPR ?? '122 ms'}
                      onChange={(e) => handleNestedChange('ekg', 'intervaloPR', e.target.value)}
                      placeholder="122 ms"
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Intervalo QTc</label>
                    <input
                      type="text"
                      value={patient?.ekg?.intervaloQTc ?? '393 ms'}
                      onChange={(e) => handleNestedChange('ekg', 'intervaloQTc', e.target.value)}
                      placeholder="393 ms"
                      className={compactInputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 4B: Ecocardiograma Transtorácico */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0369A1]" />
                    Ecocardiograma Transtorácico & Doppler (Páginas 9, 10 y 14)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#0369A1] bg-sky-50 px-2.5 py-0.5 rounded-full">
                    Sincronizado con Págs. 9 y 14
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">FEVI (% Eyección)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.fraccionEyeccion ?? '64'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'fraccionEyeccion', e.target.value)}
                      placeholder="64"
                      className={`${compactInputClass} font-bold text-[#166534]`}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 55 - 80 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fracc. Acortamiento (%)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.fraccionAcortamiento ?? '33'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'fraccionAcortamiento', e.target.value)}
                      placeholder="33"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 30 - 48 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">V.I. Diástole (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.viDiastole ?? '44'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'viDiastole', e.target.value)}
                      placeholder="44"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 35 - 57 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">V.I. Sístole (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.viSistole ?? '24'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'viSistole', e.target.value)}
                      placeholder="24"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Modo M (Pág. 14)</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Septum Intervent. (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.septumInterventricular ?? '10'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'septumInterventricular', e.target.value)}
                      placeholder="10"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 8 - 11 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pared Posterior VI (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.paredPosteriorVI ?? '10'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'paredPosteriorVI', e.target.value)}
                      placeholder="10"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 6 - 11 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Raíz de Aorta (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.aortaRaiz ?? '26'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'aortaRaiz', e.target.value)}
                      placeholder="26"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 22 - 36 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ventrículo Derecho (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.ventriculoDerecho ?? '24'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'ventriculoDerecho', e.target.value)}
                      placeholder="24"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 8 - 27 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Aurícula Izquierda (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.auriculaIzquierda ?? '32'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'auriculaIzquierda', e.target.value)}
                      placeholder="32"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 22 - 40 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Onda E Mitral (cm/s)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.ondaEMitral ?? '99'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'ondaEMitral', e.target.value)}
                      placeholder="99"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Doppler Pág. 14</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Onda A Mitral (cm/s)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.ondaAMitral ?? '76'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'ondaAMitral', e.target.value)}
                      placeholder="76"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Doppler Pág. 14</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Relación E/e&apos; Medial</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.eeMedial ?? '5/9'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'eeMedial', e.target.value)}
                      placeholder="5/9"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Pág. 10 CONMEBOL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 5: LABORATORIO, ADJUNTOS & DICTAMEN FINAL */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Bloque 5A: Laboratorio Clínico */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-[#0369A1]" />
                    Laboratorio Clínico (Páginas 11 y 17 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Hemograma & Electrolitos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hemoglobina (gr%)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.hemoglobina ?? ''}
                      onChange={(e) => handleLabChange('hemograma', 'hemoglobina', e.target.value)}
                      placeholder="Ej. 13.8"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 13.0 - 16.0 gr%</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hematocrito (%)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.hematocrito ?? ''}
                      onChange={(e) => handleLabChange('hemograma', 'hematocrito', e.target.value)}
                      placeholder="Ej. 42"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 40 - 54 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Eritrocitos / Glób. Rojos</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.globulosRojos ?? ''}
                      onChange={(e) => handleLabChange('hemograma', 'globulosRojos', e.target.value)}
                      placeholder="Ej. 4.620,000.00"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">3,800,000 - 5,800,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leucocitos (/mm³)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.leucocitos ?? ''}
                      onChange={(e) => handleLabChange('hemograma', 'leucocitos', e.target.value)}
                      placeholder="Ej. 6,241.00"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">4,500 - 10,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Plaquetas / Trombocitos</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.plaquetas ?? ''}
                      onChange={(e) => handleLabChange('hemograma', 'plaquetas', e.target.value)}
                      placeholder="Ej. 199.000"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">150,000 - 450,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sodio (mmol/L)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.sodio ?? ''}
                      onChange={(e) => handleLabChange('bioquimica', 'sodio', e.target.value)}
                      placeholder="Ej. 135"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">135 - 145 mmol/L</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Potasio (mmol/L)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.potasio ?? ''}
                      onChange={(e) => handleLabChange('bioquimica', 'potasio', e.target.value)}
                      placeholder="Ej. 4.4"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">3.5 - 5.1 mmol/L</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Glucosa Basal (mg/dl)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.glucosaBasal ?? ''}
                      onChange={(e) => handleLabChange('bioquimica', 'glucosaBasal', e.target.value)}
                      placeholder="Ej. 88"
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">70 - 110 mg/dl</span>
                  </div>
                </div>
              </div>

              {/* Bloque 5B: Carga de Imágenes Diagnósticas (Páginas 15, 16, 17 y 19) */}
              {onUpdatePatient && (
                <AttachmentSlots patient={patient} onUpdatePatient={onUpdatePatient} />
              )}

              {/* Bloque 5C: Dictamen Final Oficial CONMEBOL / FPF */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#166534]" />
                    Dictamen Final CONMEBOL / FPF (Páginas 1, 12 y 13)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    Aprobación Definitiva
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-[#E2E8F0] space-y-3">
                  <label className="block text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                    Resolución de Aptitud Competitiva
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {['APTO', 'EN OBSERVACIÓN', 'NO APTO'].map((st) => {
                      const normalizedCurrent =
                        patient?.estadoAptitud === 'OBSERVADO'
                          ? 'EN OBSERVACIÓN'
                          : patient?.estadoAptitud || 'APTO';
                      const active = normalizedCurrent === st;
                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => handleAptitudChange(st)}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            active
                              ? st === 'APTO'
                                ? 'bg-[#166534] text-white shadow-xs'
                                : st === 'EN OBSERVACIÓN'
                                  ? 'bg-[#B45309] text-white shadow-xs'
                                  : 'bg-[#991B1B] text-white shadow-xs'
                              : 'bg-white text-[#475569] hover:bg-slate-100 hover:text-[#1E293B] border border-[#CBD5E1]'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* BARRA DE NAVEGACIÓN INFERIOR GUIADA (ANTERIOR / SIGUIENTE) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-[#CBD5E1] disabled:opacity-35 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Paso Anterior</span>
        </button>

        <div className="text-xs text-[#64748B] font-medium hidden sm:block">
          Paso {currentStep} de 5: <strong className="text-[#1E293B]">{steps[currentStep - 1].title}</strong>
        </div>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            className="flex items-center space-x-2 bg-[#0369A1] hover:bg-[#075985] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <span>Siguiente Paso</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigateTab('documento')}
            className="flex items-center space-x-2 bg-[#0369A1] hover:bg-[#075985] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer"
          >
            <span>Ver Expediente Completo (19 Págs)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toast flotante de guardado */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 bg-white border px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 ${
              toast.type === 'error' ? 'border-amber-300' : 'border-emerald-300'
            }`}
          >
            <div
              className={`p-1.5 rounded-md ${
                toast.type === 'error'
                  ? 'bg-[#FEF3C7] text-[#92400E]'
                  : 'bg-[#DCFCE7] text-[#166534]'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E293B]">{toast.title}</div>
              <div
                className={`text-[11px] ${
                  toast.type === 'error' ? 'text-[#92400E]' : 'text-[#166534]'
                }`}
              >
                {toast.subtitle}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
