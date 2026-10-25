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
  FolderSync,
  Clock,
  Lock,
  Filter,
  Info,
  Calendar
} from 'lucide-react';
import { getPlayerCertificationStatus } from '../utils/statusClassifier';
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
  nameOrder = 'LAST_FIRST',
  userRole = 'MEDICO',
  setUserRole
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APTO' | 'OBSERVACION'
  const [isDragging, setIsDragging] = useState(false);
    const [uploadToast, setUploadToast] = useState(null);
  const dashboardFileInputRef = useRef(null);

  // Conteos dinámicos del semáforo médico
  const totalCount = patientsList.length;
  const vigentesCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'VIGENTE').length;
  const porRenovarCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'POR_RENOVAR').length;
  const observadosCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'OBSERVADO').length;

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
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    const statusCode = getPlayerCertificationStatus(player).code;
    return statusCode === statusFilter;
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
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-blue-950/40 border border-blue-400/30 transition cursor-pointer"
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

      {/* BANNER INSTITUCIONAL DE CONFIDENCIALIDAD Y SESIÓN SEGURA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">Sesión Médica Segura • Ley N° 29733 (Datos de Salud)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.2 rounded-full font-bold">
                TLS 256-bit Activo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Acceso institucional acreditado: <strong className="text-slate-200">
                {userRole === 'MEDICO' && 'Médico Evaluador (Famiheart S.A.C.) - Emisión y Diagnóstico'}
                {userRole === 'CLUB' && 'Delegado de Club Oficial FPF - Consulta y Descargas'}
                {userRole === 'FPF' && 'Comisión Médica FPF / CONMEBOL - Auditoría Reglamentaria'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Sellos médicos protegidos:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>29 Sellos Intactos</span>
          </span>
        </div>
      </div>

      {/* SECCIÓN 2: MÉTRICAS EN TARJETAS LIMPIAS Y SEMÁFORO */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumen General de Temporada
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Expedientes */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => setStatusFilter('ALL')}
            className={`bg-slate-900 border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group ${
              statusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase group-hover:text-blue-400 transition">Total Expedientes</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{totalCount}</span>
              <span className="text-[11px] font-semibold text-slate-400">Cargados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Clic para ver todos</p>
          </motion.div>

          {/* Card 2: Vigentes / Aptos FPF */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => setStatusFilter('VIGENTE')}
            className={`bg-slate-900 border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group ${
              statusFilter === 'VIGENTE' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase group-hover:text-emerald-400 transition flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Vigentes (Aptos)</span>
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400">{vigentesCount}</span>
              <span className="text-[11px] font-semibold text-emerald-300">Aprobados FPF</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Listos para competencia</p>
          </motion.div>

          {/* Card 3: Por Renovar (< 30 días) */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => setStatusFilter('POR_RENOVAR')}
            className={`bg-slate-900 border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group ${
              statusFilter === 'POR_RENOVAR' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase group-hover:text-amber-400 transition flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Por Renovar (30d)</span>
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-400">{porRenovarCount}</span>
              <span className="text-[11px] font-semibold text-amber-300">Próximos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Programar re-evaluación</p>
          </motion.div>

          {/* Card 4: Observaciones Clínicas */}
          <motion.div 
            whileHover={{ y: -3 }}
            onClick={() => setStatusFilter('OBSERVADO')}
            className={`bg-slate-900 border p-5 rounded-2xl shadow-sm transition-all cursor-pointer group ${
              statusFilter === 'OBSERVADO' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase group-hover:text-rose-400 transition flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Observados</span>
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-rose-400">{observadosCount}</span>
              <span className="text-[11px] font-semibold text-rose-300">Pendientes</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Exámenes complementarios</p>
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

            {/* Pestañas de Filtro Semáforo */}
            <div className="flex flex-wrap items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[38px] ${
                  statusFilter === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({totalCount})
              </button>

              <button
                onClick={() => setStatusFilter('VIGENTE')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[38px] ${
                  statusFilter === 'VIGENTE' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Vigentes ({vigentesCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('POR_RENOVAR')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[38px] ${
                  statusFilter === 'POR_RENOVAR' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Por Renovar ({porRenovarCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('OBSERVADO')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer min-h-[38px] ${
                  statusFilter === 'OBSERVADO' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Observados ({observadosCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Jugadores con Semáforo Trifásico y Accesibilidad */}
        <div className="divide-y divide-slate-800/80">
          {filteredPlayers.length === 0 ? (
            patientsList.length === 0 ? (
              /* Caso 1: Bandeja completamente vacía (sin archivos cargados) */
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
                    Arrastra aquí tus archivos <strong className="text-slate-200">PDFs o fotos de exámenes</strong> (ej. <span className="font-mono text-blue-300">APELLIDOS NOMBRES.pdf</span>) o haz clic para explorar tu equipo. El sistema extraerá los nombres automáticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dashboardFileInputRef.current?.click();
                  }}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition transform hover:scale-105 cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Seleccionar Archivos desde mi Computadora</span>
                </button>
              </div>
            ) : (
              /* Caso 2: Búsqueda o filtro sin coincidencias */
              <div className="p-12 text-center space-y-4 m-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    No se encontraron futbolistas con el filtro actual
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {searchTerm ? `No hay resultados para "${searchTerm}".` : 'No hay futbolistas con este estado en la categoría seleccionada.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }}
                  className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer min-h-[44px]"
                >
                  <span>Limpiar filtros y ver todos ({totalCount})</span>
                </button>
              </div>
            )
          ) : (
            <AnimatePresence>
              {filteredPlayers.map((player) => {
                const status = getPlayerCertificationStatus(player);
                return (
                  <motion.div
                    key={player.id || player.fileName}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/60 transition group cursor-pointer"
                    onClick={() => handleChoosePlayer(player)}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-white text-sm shadow-inner group-hover:border-blue-500/50 transition">
                          {player.apellidos?.charAt(0) || player.nombres?.charAt(0) || player.nombreCompleto?.charAt(0) || 'P'}
                        </div>
                        {/* Indicador de semáforo en el avatar */}
                        <span 
                          className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${status.dotColor}`}
                          title={`Semáforo: ${status.label}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-blue-400 transition truncate">
                            {player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`.trim()}
                          </span>

                          {/* Badge Semáforo con texto e icono explicito */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${status.badgeBg} ${status.badgeBorder} ${status.badgeText}`}>
                            {status.code === 'VIGENTE' && <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
                            {status.code === 'POR_RENOVAR' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                            {status.code === 'OBSERVADO' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                            <span>{status.label}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-semibold text-slate-300 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>{player.club || 'Club FPF / Liga Formativa'}</span>
                          </span>
                          <span>•</span>
                          <span>DNI: {player.dni || '70000000'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{player.fechaEvaluacion || globalDate}</span>
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                          {status.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          handleChoosePlayer(player);
                          onNavigateTab('documento');
                        }}
                        className="flex items-center space-x-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                        title="Ver el expediente médico oficial de 21 páginas"
                        aria-label={`Ver 21 páginas de ${player.nombreCompleto}`}
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>Ver 21 Págs</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChoosePlayer(player);
                          onNavigateTab('editor');
                        }}
                        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                        title="Editar ficha médica deportiva"
                        aria-label={`Editar ficha de ${player.nombreCompleto}`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
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
