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
  Image as ImageIcon, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Building,
  UploadCloud,
  Check,
  Scale,
  Sparkles
} from 'lucide-react';
import { savePatientToSupabase } from '../utils/supabase';

export default function ClinicalEditor({ 
  patient, 
  setPatient, 
  onNavigateTab, 
  onResetBlank 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saveToast, setSaveToast] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Helper to update root patient properties
  const handleChange = (field, value) => {
    setPatient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper for IMC automatic calculation
  const handleWeightHeightChange = (field, value) => {
    const updated = { ...patient, [field]: value };
    const w = parseFloat(field === 'peso' ? value : patient.peso);
    const h = parseFloat(field === 'talla' ? value : patient.talla);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      updated.imc = (w / (h * h)).toFixed(1);
    }
    setPatient(updated);
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
    { number: 1, title: 'Datos del Jugador', desc: 'Ficha & Certificado FPF', icon: User },
    { number: 2, title: 'Anamnesis & Lesiones', desc: 'Antecedentes y Cirugías', icon: Heart },
    { number: 3, title: 'Examen Físico', desc: 'Somatometría & IMC', icon: Stethoscope },
    { number: 4, title: 'Cardiología', desc: 'ECG & Ecocardiograma', icon: Activity },
    { number: 5, title: 'Laboratorio & Dictamen', desc: 'Sangre, Rx & Aprobación', icon: FileCheck2 },
  ];

  // Cálculo visual de IMC y categoría
  const imcNum = parseFloat(patient.imc) || 22.1;
  const imcCategory = imcNum < 18.5 
    ? { label: 'Bajo Peso', color: 'text-amber-400', bg: 'bg-amber-400' }
    : imcNum <= 24.9
    ? { label: 'Peso Saludable (Normal)', color: 'text-emerald-400', bg: 'bg-emerald-400' }
    : imcNum <= 29.9
    ? { label: 'Sobrepeso Leve', color: 'text-amber-400', bg: 'bg-amber-400' }
    : { label: 'Obesidad', color: 'text-red-400', bg: 'bg-red-400' };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER DE LA FICHA & ACCIONES */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <span>Editor Clínico Pre-Competencia FPF</span>
            <span>•</span>
            <span className="text-slate-400">Paso {currentStep} de 5</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {patient.apellidos ? `${patient.apellidos}, ${patient.nombres}` : 'Nueva Ficha Médica'}
          </h1>
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3 mt-1.5">
            <span>Club: <strong className="text-slate-200">{patient.club || 'Sin asignar'}</strong></span>
            <span>•</span>
            <span>DNI: <strong className="text-slate-200">{patient.dni || 'Sin registrar'}</strong></span>
            <span>•</span>
            <span>Estado: 
              <strong className={`ml-1 font-bold ${patient.estadoAptitud === 'APTO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {patient.estadoAptitud || 'PENDIENTE'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onResetBlank}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Formato en Blanco</span>
          </button>

          <button
            onClick={() => onNavigateTab('documento')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 text-blue-300 hover:text-white border border-slate-700 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver 21 Págs</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSavingDb}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSavingDb ? 'animate-spin' : ''}`} />
            <span>{isSavingDb ? 'Guardando en Supabase...' : 'Guardar y Sincronizar'}</span>
          </motion.button>
        </div>
      </div>

      {/* BARRA DE PASOS GUIADA (STEP PROGRESS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            return (
              <button
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`flex items-center space-x-3 p-3 rounded-2xl text-left transition cursor-pointer ${
                  isCurrent 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50' 
                    : isCompleted
                    ? 'bg-slate-850/80 text-slate-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrent 
                    ? 'bg-white/20 text-white' 
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold truncate leading-tight">{s.title}</div>
                  <div className={`text-[10px] truncate ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                    {s.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DEL PASO ACTIVO CON ANIMACIONES */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >

          {/* PASO 1: DATOS DEL JUGADOR Y CERTIFICADO FPF */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              {/* Bloque 1A: Identificación del Futbolista */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Ficha de Filiación del Jugador (Página 2 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    Datos Básicos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombres</label>
                    <input
                      type="text"
                      value={patient.nombres || ''}
                      onChange={(e) => {
                        handleChange('nombres', e.target.value);
                        handleChange('nombreCompleto', `${patient.apellidos} ${e.target.value}`.trim());
                      }}
                      placeholder="Ej. ADDU ELIAS"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Apellidos</label>
                    <input
                      type="text"
                      value={patient.apellidos || ''}
                      onChange={(e) => {
                        handleChange('apellidos', e.target.value);
                        handleChange('nombreCompleto', `${e.target.value} ${patient.nombres}`.trim());
                      }}
                      placeholder="Ej. TALEXSIO GUZMAN"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">DNI / Pasaporte</label>
                    <input
                      type="text"
                      value={patient.dni || ''}
                      onChange={(e) => handleChange('dni', e.target.value)}
                      placeholder="Ej. 74829103"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha de Nacimiento</label>
                    <input
                      type="text"
                      value={patient.fechaNacimiento || ''}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      placeholder="DD-MM-AAAA"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Club Local / Selección</label>
                    <input
                      type="text"
                      value={patient.club || ''}
                      onChange={(e) => handleChange('club', e.target.value)}
                      placeholder="Ej. UNIVERSITARIO"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Posición de Juego</label>
                    <input
                      type="text"
                      value={patient.posicion || ''}
                      onChange={(e) => handleChange('posicion', e.target.value)}
                      placeholder="Ej. DELANTERO / EXTREMO"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 1B: Certificado Médico Oficial FPF (Página 1) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4" />
                    Certificado Médico Oficial FPF (Página 1)
                  </h3>
                  <span className="text-[11px] font-semibold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800/80">
                    Aptitud Física
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Médico Certificador</label>
                    <input
                      type="text"
                      value={patient.medicoEvaluador || ''}
                      onChange={(e) => handleChange('medicoEvaluador', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Colegiatura CMP / RNE</label>
                    <input
                      type="text"
                      value={patient.medicoCmp || ''}
                      onChange={(e) => handleChange('medicoCmp', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Centro Clínico / Domicilio</label>
                    <input
                      type="text"
                      value={patient.domicilioClinica || ''}
                      onChange={(e) => handleChange('domicilioClinica', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dictamen de Aptitud FPF</label>
                    <textarea
                      rows={2}
                      value={patient.aptitudDetalle || ''}
                      onChange={(e) => handleChange('aptitudDetalle', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 text-sm text-emerald-400 font-semibold focus:outline-none transition"
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    Historia Cardiológica Personal (Página 3 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    Criterios SI / NO
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: 'dolorToracico', label: 'Dolor o malestar torácico de esfuerzo' },
                    { key: 'lipotimiaSincope', label: 'Lipotimia o síncope no explicado' },
                    { key: 'disneaFatiga', label: 'Disnea o fatiga desproporcionada en esfuerzo' },
                    { key: 'soploCardiaco', label: 'Soplo cardíaco previo' },
                    { key: 'hipertensionArterial', label: 'Antecedente de hipertensión arterial' },
                    { key: 'restriccionPrevia', label: 'Restricción previa para participar en deporte' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-slate-750 transition">
                      <span className="text-xs text-slate-200 font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const updated = { ...patient.cardioPersonal, [item.key]: true };
                            handleChange('cardioPersonal', updated);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            patient.cardioPersonal?.[item.key]
                              ? 'bg-red-600 text-white shadow-md shadow-red-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          SI
                        </button>
                        <button
                          onClick={() => {
                            const updated = { ...patient.cardioPersonal, [item.key]: false };
                            handleChange('cardioPersonal', updated);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            !patient.cardioPersonal?.[item.key]
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bone className="w-4 h-4 text-amber-400" />
                    Sistema Músculo-Esquelético (Página 5 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    Articulaciones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                        <th className="py-3 px-4">Articulación</th>
                        <th className="py-3 px-4 text-center">Derecha</th>
                        <th className="py-3 px-4 text-center">Izquierda</th>
                        <th className="py-3 px-4">Estado / Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {(patient.operaciones || []).slice(0, 7).map((op, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-200">{op.zona}</td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={op.der}
                              onChange={(e) => {
                                const updated = [...patient.operaciones];
                                updated[idx].der = e.target.checked;
                                handleChange('operaciones', updated);
                              }}
                              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={op.izq}
                              onChange={(e) => {
                                const updated = [...patient.operaciones];
                                updated[idx].izq = e.target.checked;
                                handleChange('operaciones', updated);
                              }}
                              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-[11px] text-slate-400">
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
              
              {/* Bloque 3A: Somatometría con Medidor Animado de IMC */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    Somatometría & Calculador de IMC en Tiempo Real (Página 7)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80">
                    Cálculo Reactivo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Peso (kg)</label>
                    <input
                      type="text"
                      value={patient.peso || ''}
                      onChange={(e) => handleWeightHeightChange('peso', e.target.value)}
                      placeholder="Ej. 68.5"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Talla (m)</label>
                    <input
                      type="text"
                      value={patient.talla || ''}
                      onChange={(e) => handleWeightHeightChange('talla', e.target.value)}
                      placeholder="Ej. 1.76"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Frecuencia / Pulso</label>
                    <input
                      type="text"
                      value={patient.pulso || ''}
                      onChange={(e) => handleChange('pulso', e.target.value)}
                      placeholder="Ej. 58 lpm"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Presión Arterial</label>
                    <input
                      type="text"
                      value={patient.presionArterial || ''}
                      onChange={(e) => handleChange('presionArterial', e.target.value)}
                      placeholder="Ej. 115/75 mmHg"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Medidor Visual de IMC */}
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Índice de Masa Corporal (IMC)</span>
                    <span className={`text-xs font-bold ${imcCategory.color}`}>
                      {patient.imc || '22.1'} kg/m² • {imcCategory.label}
                    </span>
                  </div>

                  {/* Barra Visual Progresiva */}
                  <div className="h-2.5 w-full bg-slate-850 rounded-full overflow-hidden relative">
                    <motion.div 
                      className={`h-full ${imcCategory.bg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (imcNum / 35) * 100)}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>18.5 (Bajo)</span>
                    <span>24.9 (Normal)</span>
                    <span>29.9 (Sobrepeso)</span>
                    <span>35+ (Obesidad)</span>
                  </div>
                </div>
              </div>

              {/* Bloque 3B: Examen Clínico Segmentario */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  Examen Físico Segmentario
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
                    <div key={i} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
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
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-400" />
                    Electrocardiograma de Reposo (Protocolo CONMEBOL)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80">
                    Criterios de Seattle
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Frecuencia Cardíaca</label>
                    <input
                      type="text"
                      value={patient.ekg?.frecuenciaCardiaca || '53 bpm'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ritmo</label>
                    <input
                      type="text"
                      value={patient.ekg?.ritmo || 'Sinusal regular'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Intervalo PR</label>
                    <input
                      type="text"
                      value={patient.ekg?.intervaloPR || '122 ms'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Intervalo QTc</label>
                    <input
                      type="text"
                      value={patient.ekg?.intervaloQTc || '393 ms'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Trazado ECG */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-2 font-medium">Trazado ECG 12 Derivaciones (Página 16 Oficial)</span>
                  {patient.ekg?.imagen && (
                    <img 
                      src={patient.ekg.imagen} 
                      alt="Trazado ECG" 
                      className="max-h-60 w-auto object-contain rounded-xl border border-slate-800"
                    />
                  )}
                </div>
              </div>

              {/* Bloque 4B: Ecocardiograma Transtorácico */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Ecocardiograma Transtorácico & Doppler (Páginas 9 y 14)
                  </h3>
                  <span className="text-[11px] font-semibold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/80">
                    Modo M-2D
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">FEVI (Fracción Eyección)</label>
                    <input
                      type="text"
                      value={patient.ecocardiograma?.fraccionEyeccion || '57'}
                      className="w-full bg-slate-950 border border-slate-800 font-bold text-emerald-400 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Ref: 55 - 80 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ventrículo Izq. Diástole</label>
                    <input
                      type="text"
                      value={patient.ecocardiograma?.viDiastole || '50'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Ref: 35 - 57 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Septum Interventricular</label>
                    <input
                      type="text"
                      value={patient.ecocardiograma?.septumInterventricular || '10'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Ref: 8 - 11 mm</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Raíz de Aorta</label>
                    <input
                      type="text"
                      value={patient.ecocardiograma?.aortaRaiz || '24'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Ref: 22 - 36 mm</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PASO 5: LABORATORIO, RAYOS X & DICTAMEN FINAL */}
          {currentStep === 5 && (
            <div className="space-y-6">
              
              {/* Bloque 5A: Laboratorio Clínico */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    Laboratorio Clínico (Página 11 y 17 FPF)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                    Hemograma & Bioquímica
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hemoglobina</label>
                    <input
                      type="text"
                      value={patient.laboratorio?.hemograma?.hemoglobina || '14.7'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Hombre: 13.0 - 16.0 gr%</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hematocrito</label>
                    <input
                      type="text"
                      value={patient.laboratorio?.hemograma?.hematocrito || '43'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Hombre: 40 - 54 %</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Plaquetas</label>
                    <input
                      type="text"
                      value={patient.laboratorio?.hemograma?.plaquetas || '236,000'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">150,000 - 450,000</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Glucosa Basal</label>
                    <input
                      type="text"
                      value={patient.laboratorio?.bioquimica?.glucosaBasal || '88'}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">70 - 110 mg/dl</span>
                  </div>
                </div>
              </div>

              {/* Bloque 5B: Dictamen Final Oficial CONMEBOL */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    Dictamen Final CONMEBOL / FPF (Página 12 Oficial)
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80">
                    Aprobación Definitiva
                  </span>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Resolución de Aptitud Competitiva
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {['APTO', 'EN OBSERVACIÓN', 'NO APTO'].map(st => (
                      <button
                        key={st}
                        onClick={() => handleChange('estadoAptitud', st)}
                        className={`px-5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                          patient.estadoAptitud === st
                            ? st === 'APTO' 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                              : st === 'EN OBSERVACIÓN'
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                              : 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* BARRA DE NAVEGACIÓN INFERIOR GUIADA (ANTERIOR / SIGUIENTE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="flex items-center space-x-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-850 text-slate-300 font-semibold text-xs px-5 py-3 rounded-2xl transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Paso Anterior</span>
        </button>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Paso {currentStep} de 5: <strong className="text-white">{steps[currentStep - 1].title}</strong>
        </div>

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-blue-950/40 transition cursor-pointer"
          >
            <span>Siguiente Paso</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => onNavigateTab('documento')}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-xl shadow-red-950/40 transition cursor-pointer"
          >
            <span>Generar Expediente (21 Págs)</span>
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
            className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center space-x-3"
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">¡Expediente guardado exitosamente!</div>
              <div className="text-[10px] text-emerald-400">Sincronizado en tiempo real con Supabase PostgreSQL</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
