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
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Eye,
  Check,
  Scale
} from 'lucide-react';
import { savePatientToSupabase } from '../utils/supabase';
import AttachmentSlots from './AttachmentSlots';

export default function ClinicalEditor({
  patient,
  setPatient,
  onUpdatePatient,
  onNavigateTab,
  onResetBlank
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saveToast, setSaveToast] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Helper to update root patient properties
  const handleChange = (field, value) => {
    setPatient((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper to update nested object (e.g. ekg, ecocardiograma)
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
      const rawW = String(field === 'peso' ? value : prev?.peso || '').replace(/[^\d.]/g, '');
      const rawH = String(field === 'talla' ? value : prev?.talla || '').replace(/[^\d.]/g, '');
      const w = parseFloat(rawW);
      const h = parseFloat(rawH);
      if (!isNaN(w) && !isNaN(h) && h > 0) {
        const hMeters = h > 3 ? h / 100 : h;
        updated.imc = (w / (hMeters * hMeters)).toFixed(1);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSavingDb(true);
    try {
      await savePatientToSupabase(patient);
    } catch (e) {
      console.warn('Error saving to Supabase:', e);
    } finally {
      setIsSavingDb(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  // 5 Pasos Claros y Seccionados
  const steps = [
    { number: 1, title: 'Datos del Jugador', desc: 'Certificado FPF & PCMA', icon: User },
    { number: 2, title: 'Anamnesis & Lesiones', desc: 'Antecedentes y Cirugías', icon: Heart },
    { number: 3, title: 'Examen Físico', desc: 'Somatometría & IMC', icon: Stethoscope },
    { number: 4, title: 'Cardiología', desc: 'ECG & Ecocardiograma', icon: Activity },
    { number: 5, title: 'Laboratorio & Dictamen', desc: 'Sangre, Anexos & Aptitud', icon: FileCheck2 }
  ];

  // Cálculo visual de IMC y categoría
  const imcNum = parseFloat(patient?.imc) || 22.1;
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
              : patient?.nombreCompleto || 'Nueva Ficha Médica'}
          </h1>
          <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3 mt-1.5">
            <span>
              Club: <strong className="text-[#1E293B]">{patient?.club || 'Sin asignar'}</strong>
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
                    : patient?.estadoAptitud === 'EN OBSERVACIÓN' || patient?.estadoAptitud === 'OBSERVADO'
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
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Formato en Blanco</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('documento')}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-[#0369A1] border border-[#CBD5E1] px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver 19 Págs</span>
          </button>

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
                      value={patient?.apellidos || ''}
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
                      value={patient?.nombres || ''}
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
                      value={patient?.dni || ''}
                      onChange={(e) => handleChange('dni', e.target.value)}
                      placeholder="Ej. 74829103"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fecha de Nacimiento</label>
                    <input
                      type="text"
                      value={patient?.fechaNacimiento || ''}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      placeholder="DD-MM-AAAA"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Club / Institución</label>
                    <input
                      type="text"
                      value={patient?.club || ''}
                      onChange={(e) => handleChange('club', e.target.value)}
                      placeholder="Ej. UNIVERSITARIO"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">País del Club</label>
                    <input
                      type="text"
                      value={patient?.paisClub || 'PERÚ'}
                      onChange={(e) => handleChange('paisClub', e.target.value)}
                      placeholder="Ej. PERÚ"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Posición de Juego</label>
                    <input
                      type="text"
                      value={patient?.posicion || ''}
                      onChange={(e) => handleChange('posicion', e.target.value)}
                      placeholder="Ej. VOLANTE"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fecha de Evaluación</label>
                    <input
                      type="text"
                      value={patient?.fechaEvaluacion || ''}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Médico Certificador</label>
                    <input
                      type="text"
                      value={patient?.medicoEvaluador || 'DARIO HERNANDEZ'}
                      onChange={(e) => handleChange('medicoEvaluador', e.target.value)}
                      placeholder="Ej. DARIO HERNANDEZ"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Colegiatura CMP</label>
                    <input
                      type="text"
                      value={patient?.medicoCmp || '27503'}
                      onChange={(e) => handleChange('medicoCmp', e.target.value)}
                      placeholder="Ej. 27503"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Número de Recibo (Opcional)</label>
                    <input
                      type="text"
                      value={patient?.numeroRecibo || ''}
                      onChange={(e) => handleChange('numeroRecibo', e.target.value)}
                      placeholder="Dejar vacío o ingresar N° recibo"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Centro Clínico / Domicilio</label>
                    <input
                      type="text"
                      value={patient?.domicilioClinica || 'AV CONQUISTADORES 1588 SAN ISIDRO'}
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
                        patient?.aptitudDetalle ||
                        'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )'
                      }
                      onChange={(e) => handleChange('aptitudDetalle', e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#166534] rounded-lg p-3.5 text-sm text-[#166534] font-semibold focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: ANAMNESIS & MÚSCULO-ESQUELÉTICO */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Bloque 2A: Historia Cardiológica Personal */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#B91C1C]" />
                    Historia Cardiológica Personal (Página 3 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Criterios SI / NO
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'dolorToracico', label: 'Dolor o malestar torácico de esfuerzo' },
                    { key: 'lipotimiaSincope', label: 'Lipotimia o síncope no explicado' },
                    { key: 'disneaFatiga', label: 'Disnea o fatiga desproporcionada en esfuerzo' },
                    { key: 'soploCardiaco', label: 'Soplo cardíaco previo' },
                    { key: 'hipertensionArterial', label: 'Antecedente de hipertensión arterial' },
                    { key: 'restriccionPrevia', label: 'Restricción previa para participar en deporte' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#E2E8F0]"
                    >
                      <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...(patient?.cardioPersonal || {}), [item.key]: true };
                            handleChange('cardioPersonal', updated);
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            patient?.cardioPersonal?.[item.key]
                              ? 'bg-[#B91C1C] text-white'
                              : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100 hover:text-[#1E293B]'
                          }`}
                        >
                          SI
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...(patient?.cardioPersonal || {}), [item.key]: false };
                            handleChange('cardioPersonal', updated);
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                            !patient?.cardioPersonal?.[item.key]
                              ? 'bg-[#0369A1] text-white'
                              : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-slate-100 hover:text-[#1E293B]'
                          }`}
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 2B: Operaciones y Lesiones */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                  <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                    <Bone className="w-4 h-4 text-[#B45309]" />
                    Sistema Músculo-Esquelético (Páginas 5 y 6 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Articulaciones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[#64748B] uppercase font-bold border-b border-[#E2E8F0]">
                        <th className="py-2.5 px-4">Articulación</th>
                        <th className="py-2.5 px-4 text-center">Derecha</th>
                        <th className="py-2.5 px-4 text-center">Izquierda</th>
                        <th className="py-2.5 px-4">Estado / Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {(
                        patient?.operaciones || [
                          { zona: 'Hombro', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Codo', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Mano', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Columna', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Cadera', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Pubis', der: false, izq: false, fecha: 'NIEGA' },
                          { zona: 'Rodilla - Ligamento', der: false, izq: false, fecha: 'NIEGA' }
                        ]
                      )
                        .slice(0, 7)
                        .map((op, idx, arr) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-semibold text-[#1E293B]">{op.zona}</td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(op.der)}
                                onChange={(e) => {
                                  const base = patient?.operaciones ? [...patient.operaciones] : [...arr];
                                  base[idx] = { ...base[idx], der: e.target.checked };
                                  handleChange('operaciones', base);
                                }}
                                className="rounded bg-white border-[#CBD5E1] text-[#0369A1] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={Boolean(op.izq)}
                                onChange={(e) => {
                                  const base = patient?.operaciones ? [...patient.operaciones] : [...arr];
                                  base[idx] = { ...base[idx], izq: e.target.checked };
                                  handleChange('operaciones', base);
                                }}
                                className="rounded bg-white border-[#CBD5E1] text-[#0369A1] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="bg-slate-100 px-2.5 py-0.5 rounded text-[11px] font-medium text-[#475569]">
                                {op.fecha || 'NIEGA'}
                              </span>
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
                      value={patient?.peso || '71'}
                      onChange={(e) => handleWeightHeightChange('peso', e.target.value)}
                      placeholder="Ej. 71"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Talla (m)</label>
                    <input
                      type="text"
                      value={patient?.talla || '1.75'}
                      onChange={(e) => handleWeightHeightChange('talla', e.target.value)}
                      placeholder="Ej. 1.75"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frecuencia / Pulso</label>
                    <input
                      type="text"
                      value={patient?.pulso || '60 lpm'}
                      onChange={(e) => handleChange('pulso', e.target.value)}
                      placeholder="Ej. 60 lpm"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Presión Arterial</label>
                    <input
                      type="text"
                      value={patient?.presionArterial || '120/80 mmHg'}
                      onChange={(e) => handleChange('presionArterial', e.target.value)}
                      placeholder="Ej. 120/80 mmHg"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Medidor Visual de IMC */}
                <div className="p-4 bg-slate-50 rounded-lg border border-[#E2E8F0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Índice de Masa Corporal (IMC — Pág. 7)</span>
                    <span className={`text-xs font-bold ${imcCategory.color}`}>
                      {patient?.imc || '23.2'} kg/m² • {imcCategory.label}
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

              {/* Bloque 3B: Examen Clínico Segmentario */}
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-[#1E293B] flex items-center gap-2 border-b border-[#E2E8F0] pb-3.5">
                  <Stethoscope className="w-4 h-4 text-[#166534]" />
                  Examen Físico Segmentario (Página 7)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Cabeza & Cuello', val: 'NORMAL' },
                    { label: 'Tórax: Corazón', val: 'NORMAL' },
                    { label: 'Tórax: Pulmonar', val: 'NORMAL' },
                    { label: 'Abdomen', val: 'NORMAL' },
                    { label: 'Columna Vertebral', val: 'NORMAL' },
                    { label: 'Extremidades', val: 'NORMAL' }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-lg border border-[#E2E8F0] flex items-center justify-between"
                    >
                      <span className="text-xs text-[#1E293B] font-medium">{item.label}</span>
                      <span className="text-[10px] font-bold badge-apto px-2 py-0.5 rounded-full">
                        {item.val}
                      </span>
                    </div>
                  ))}
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
                  <span className="text-[11px] font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    Protocolo CONMEBOL
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frecuencia Cardíaca</label>
                    <input
                      type="text"
                      value={patient?.ekg?.frecuenciaCardiaca ?? '58 bpm'}
                      onChange={(e) => handleNestedChange('ekg', 'frecuenciaCardiaca', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ritmo</label>
                    <input
                      type="text"
                      value={patient?.ekg?.ritmo ?? 'Sinusal regular'}
                      onChange={(e) => handleNestedChange('ekg', 'ritmo', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Intervalo PR</label>
                    <input
                      type="text"
                      value={patient?.ekg?.intervaloPR ?? '122 ms'}
                      onChange={(e) => handleNestedChange('ekg', 'intervaloPR', e.target.value)}
                      className={compactInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Intervalo QTc</label>
                    <input
                      type="text"
                      value={patient?.ekg?.intervaloQTc ?? '393 ms'}
                      onChange={(e) => handleNestedChange('ekg', 'intervaloQTc', e.target.value)}
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
                    Modo M-2D / Doppler
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">FEVI (% Eyección)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.fraccionEyeccion ?? '64'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'fraccionEyeccion', e.target.value)}
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
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Modo M</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Septum Intervent. (mm)</label>
                    <input
                      type="text"
                      value={patient?.ecocardiograma?.septumInterventricular ?? '10'}
                      onChange={(e) => handleNestedChange('ecocardiograma', 'septumInterventricular', e.target.value)}
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
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 8 - 27 mm</span>
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
                      value={patient?.laboratorio?.hemograma?.hemoglobina ?? '13.8'}
                      onChange={(e) => handleLabChange('hemograma', 'hemoglobina', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 13.0 - 16.0 gr%</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Hematocrito (%)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.hematocrito ?? '42'}
                      onChange={(e) => handleLabChange('hemograma', 'hematocrito', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">Ref: 40 - 54 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Eritrocitos / Glób. Rojos</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.globulosRojos ?? '4.620,000.00'}
                      onChange={(e) => handleLabChange('hemograma', 'globulosRojos', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">4,500,000 - 5,500,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leucocitos (/mm³)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.leucocitos ?? '6,241.00'}
                      onChange={(e) => handleLabChange('hemograma', 'leucocitos', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">5,000 - 10,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Plaquetas / Trombocitos</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.hemograma?.plaquetas ?? '199.000'}
                      onChange={(e) => handleLabChange('hemograma', 'plaquetas', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">150,000 - 450,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sodio (mmol/L)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.sodio ?? '135'}
                      onChange={(e) => handleLabChange('bioquimica', 'sodio', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">135 - 145 mmol/L</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Potasio (mmol/L)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.potasio ?? '4.4'}
                      onChange={(e) => handleLabChange('bioquimica', 'potasio', e.target.value)}
                      className={compactInputClass}
                    />
                    <span className="text-[10px] text-[#64748B]">3.5 - 5.1 mmol/L</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Glucosa Basal (mg/dl)</label>
                    <input
                      type="text"
                      value={patient?.laboratorio?.bioquimica?.glucosaBasal ?? '88'}
                      onChange={(e) => handleLabChange('bioquimica', 'glucosaBasal', e.target.value)}
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
                      const active = (patient?.estadoAptitud || 'APTO') === st;
                      return (
                        <button
                          type="button"
                          key={st}
                          onClick={() => handleChange('estadoAptitud', st)}
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
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white border border-emerald-300 text-[#1E293B] px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3"
          >
            <div className="p-1.5 bg-[#DCFCE7] text-[#166534] rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1E293B]">¡Expediente guardado exitosamente!</div>
              <div className="text-[11px] text-[#166534]">Sincronizado con el visor de 19 páginas y Supabase</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
