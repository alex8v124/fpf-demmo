import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  Search, 
  Printer, 
  ArrowRight, 
  PlusCircle, 
  Download, 
  Cloud, 
  Activity, 
  FileCheck2, 
  FileSpreadsheet,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  FlaskConical,
  ImageIcon,
  Sparkles,
  UploadCloud,
  FolderSync
} from 'lucide-react';
import { samplePlayersList } from '../data/initialData';
import { parsePatientFromFileName, formatPlayerDisplayName } from '../utils/filenameParser';
import { saveBatchPatientsToSupabase } from '../lib/supabase';

export default function Dashboard({ 
  patientsList = samplePlayersList,
  setPatientsList,
  onSelectPatient,
  onSelectPatientId, 
  onNavigateTab, 
  onResetBlank, 
  onPrint,
  globalDate = '22-01-2026',
  globalClub = 'Club FPF / Liga Formativa',
  nameOrder = 'LAST_FIRST'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APTO' | 'OBSERVACION'
  const [isDragging, setIsDragging] = useState(false);
  const [uploadToast, setUploadToast] = useState(null);
  const dashboardFileInputRef = useRef(null);

  // Procesamiento directo de archivos subidos desde el Dashboard
  const handleProcessFiles = (files) => {
    if (!files || files.length === 0) return;
    const newPatients = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parsed = parsePatientFromFileName(file.name, file);
      if (parsed) {
        parsed.fechaEvaluacion = globalDate;
        parsed.club = globalClub;
        parsed.nombreCompleto = formatPlayerDisplayName(parsed.apellidos, parsed.nombres, nameOrder);
        newPatients.push(parsed);
      }
    }

    if (newPatients.length > 0) {
      if (setPatientsList) {
        setPatientsList(prev => {
          const existing = new Set((prev || []).map(p => p.fileName));
          const filtered = newPatients.filter(p => !existing.has(p.fileName));
          return [...filtered, ...(prev || [])];
        });
      }

      saveBatchPatientsToSupabase(newPatients).then(res => {
        if (res.success) {
          console.log(`[Supabase] Auto-guardados ${res.count} expedientes desde Dashboard.`);
        }
      });

      if (onSelectPatient) {
        onSelectPatient(newPatients[0]);
      }

      setUploadToast(`¡${newPatients.length} expedientes cargados exitosamente! Nombres extraídos y vinculados.`);
      setTimeout(() => setUploadToast(null), 4000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const filteredPlayers = patientsList.filter(player => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      player.nombreCompleto?.toLowerCase().includes(q) ||
      player.nombres?.toLowerCase().includes(q) ||
      player.apellidos?.toLowerCase().includes(q) ||
      player.fileName?.toLowerCase().includes(q) ||
      player.club?.toLowerCase().includes(q);
    
    if (statusFilter === 'APTO') return matchesSearch && (player.estadoAptitud === 'APTO' || player.estado === 'APTO');
    if (statusFilter === 'OBSERVACION') return matchesSearch && (player.estadoAptitud !== 'APTO' && player.estado !== 'APTO');
    return matchesSearch;
  });

  const handleChoosePlayer = (player) => {
    if (onSelectPatient) {
      onSelectPatient(player);
    } else if (onSelectPatientId) {
      onSelectPatientId(player.id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Toast Alert flotante para subida */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center space-x-2 transition bg-emerald-950 text-emerald-200 border-emerald-500/50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadToast}</span>
        </div>
      )}
      
      {/* SECCIÓN 1: BIENVENIDA Y ACCIONES CLAVE */}
      <section className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-800/80 px-2.5 py-0.5 rounded-full">
                FPF • CONMEBOL 2026
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Famiheart S.A.C.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Portal de Certificaciones Médicas Deportivas
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Gestión clínica y emisión oficial del <strong className="text-white">Expediente de 21 Páginas</strong> para futbolistas profesionales y formativos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {/* Input nativo oculto para subida rápida */}
            <input 
              type="file"
              ref={dashboardFileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFiles(e.target.files);
                }
                e.target.value = '';
              }}
              multiple
              accept=".pdf,image/*"
              className="hidden"
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dashboardFileInputRef.current?.click()}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-500/40 transition cursor-pointer"
              title="Selecciona archivos PDF o imágenes directamente desde tu equipo"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Archivos (PDF/Fotos)</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('documento')}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-red-950/40 border border-red-500/40 transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Ver Expediente (21 Págs)</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('pool')}
              className="flex items-center justify-center space-x-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm px-4 py-3 rounded-2xl transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Pool Rotación</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: MÉTRICAS EN TARJETAS LIMPIAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumen General de Temporada
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => onNavigateTab('extractor')}
            className="bg-slate-900 border border-slate-800/90 hover:border-blue-500/50 p-5 rounded-2xl shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase group-hover:text-blue-400 transition">Archivos Procesados</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{patientsList.length}</span>
              <span className="text-[11px] font-semibold text-emerald-400">Archivos Reales</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Directorio Drive & Subidos</p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Nombres Auto-Extraídos</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400">{patientsList.length}</span>
              <span className="text-[11px] font-semibold text-slate-400">100% Automático</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cero tipeo manual de campos</p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ y: -3 }}
            className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Aptitud EKG / FPF</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400">
                {patientsList.filter(p => p.estadoAptitud === 'APTO' || p.estado === 'APTO').length}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Aprobados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Electrocardiograma normal</p>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => onNavigateTab('pool')}
            className="bg-slate-900 border border-slate-800/90 hover:border-purple-500/50 p-5 rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Fecha en Cascada</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <FolderSync className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">21</span>
              <span className="text-[11px] font-semibold text-purple-300">Páginas</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sincronizadas con fecha unificada</p>
          </motion.div>

        </div>
      </section>

      {/* SECCIÓN 3: EXPEDIENTES DEPORTIVOS (FILTRADOS Y SECCIONADOS) */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Cabecera de la sección */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Expedientes de Futbolistas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecciona cualquier jugador para abrir su visor de 21 páginas o editar sus resultados
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar futbolista o club..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-full sm:w-56 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Pestañas de Filtro */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('APTO')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'APTO' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aptos
              </button>
              <button
                onClick={() => setStatusFilter('OBSERVACION')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'OBSERVACION' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                En Observación
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Jugadores */}
        <div className="divide-y divide-slate-800/80">
          {filteredPlayers.length === 0 ? (
            <div 
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => dashboardFileInputRef.current?.click()}
              className={`p-10 sm:p-14 text-center space-y-4 border-2 border-dashed rounded-3xl m-4 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-blue-400 bg-blue-950/60 scale-[1.01] shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/30'
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-blue-500/50'
              }`}
            >
              <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-inner transition-transform ${
                isDragging ? 'bg-blue-600 text-white scale-110 animate-bounce' : 'bg-slate-800/80 text-blue-400'
              }`}>
                <UploadCloud className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isDragging ? '¡Suelta aquí los archivos para cargarlos!' : 'Bandeja Lista para Recibir Nuevos Expedientes'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Arrastra aquí tus archivos <strong className="text-slate-200">PDFs o imágenes de exámenes</strong> (ej. <span className="font-mono text-blue-300">APELLIDOS NOMBRES.pdf</span>) o haz clic para explorar tu equipo. El sistema extraerá los nombres automáticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dashboardFileInputRef.current?.click();
                }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition transform hover:scale-105 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Seleccionar Archivos desde mi Computadora</span>
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredPlayers.map((player) => (
                <motion.div
                  key={player.id || player.fileName}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/60 transition group cursor-pointer"
                  onClick={() => handleChoosePlayer(player)}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-white text-sm shadow-inner group-hover:border-blue-500/50 transition">
                      {player.apellidos?.charAt(0) || player.nombres?.charAt(0) || player.nombreCompleto?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm group-hover:text-blue-400 transition">
                          {player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`.trim()}
                        </span>
                        {(player.estadoAptitud === 'APTO' || player.estado === 'APTO') ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.2 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> APTO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2 py-0.2 rounded-full text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> OBSERVACIÓN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-300">{player.fileName ? `📁 ${player.fileName}` : (player.club || 'Expediente FPF')}</span>
                        <span>•</span>
                        <span>DNI: {player.dni || 'Verificado'}</span>
                        <span>•</span>
                        <span>{player.fechaEvaluacion || '2026-03-01'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        handleChoosePlayer(player);
                        onNavigateTab('documento');
                      }}
                      className="flex items-center space-x-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Ver 21 Págs</span>
                    </button>

                    <button
                      onClick={() => {
                        handleChoosePlayer(player);
                        onNavigateTab('editor');
                      }}
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

      </section>

      {/* SECCIÓN 4: SERVICIOS DIAGNÓSTICOS EN 3 BLOQUES CLAROS */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Servicios de Apoyo al Diagnóstico (Protocolo FPF)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Bloque Cardiología */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => {
              onNavigateTab('editor');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition">
                Cardiología Deportiva
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Electrocardiograma de 12 derivaciones (CONMEBOL) y Ecocardiograma Doppler transtorácico.
              </p>
            </div>
            <div className="text-[11px] font-bold text-red-400 flex items-center gap-1 pt-1">
              <span>Abrir protocolo cardiológico</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Bloque Laboratorio */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => {
              onNavigateTab('editor');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                Laboratorio Clínico
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Hemograma completo automatizado, bioquímica sérica (glucosa) y parasitológico seriado.
              </p>
            </div>
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 pt-1">
              <span>Abrir módulo de laboratorio</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Bloque Radiología */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => {
              onNavigateTab('editor');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition">
                Radiología de Tórax
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Informe radiológico en incidencia PA, campos pulmonares e índice cardiotorácico.
              </p>
            </div>
            <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1 pt-1">
              <span>Abrir reporte e imagen Rx</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

        </div>
      </section>

    </div>
  );
}
