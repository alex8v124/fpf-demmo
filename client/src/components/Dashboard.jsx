import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  FileText, 
  Search, 
  PlusCircle, 
  Download, 
  Activity, 
  FileCheck2, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  FlaskConical, 
  ImageIcon, 
  UploadCloud, 
  Clock, 
  Filter, 
  Calendar,
  Eye,
  Check,
  X
} from 'lucide-react';
import { getPlayerCertificationStatus } from '../utils/statusClassifier';
import { parsePatientFromFileName, formatPlayerDisplayName } from '../utils/filenameParser';
import { saveBatchPatientsToSupabase } from '../lib/supabase';
import { downloadPatientDocx } from '../utils/docxGenerator';

export default function Dashboard({ 
  patientsList = [],
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
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VIGENTE' | 'POR_RENOVAR' | 'OBSERVADO'
  const [clubFilter, setClubFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadToast, setUploadToast] = useState(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState(null);
  const dashboardFileInputRef = useRef(null);

  // Conteos dinámicos del semáforo médico
  const totalCount = patientsList.length;
  const vigentesCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'VIGENTE').length;
  const porRenovarCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'POR_RENOVAR').length;
  const observadosCount = patientsList.filter(p => getPlayerCertificationStatus(p).code === 'OBSERVADO').length;

  // Lista única de clubes para el filtro real de la tabla
  const uniqueClubs = useMemo(() => {
    const clubsSet = new Set();
    patientsList.forEach(p => {
      if (p.club && p.club.trim()) clubsSet.add(p.club.trim());
    });
    return Array.from(clubsSet).sort();
  }, [patientsList]);

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

      setUploadToast(`¡${newPatients.length} expedientes cargados exitosamente!`);
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
      player.dni?.toLowerCase().includes(q) ||
      player.fileName?.toLowerCase().includes(q) ||
      player.club?.toLowerCase().includes(q);
    
    if (!matchesSearch) return false;

    // Filtro por Club
    if (clubFilter !== 'ALL' && player.club !== clubFilter) {
      return false;
    }

    // Filtro por Estado (desde las tarjetas superiores)
    if (statusFilter === 'ALL') return true;
    const statusCode = getPlayerCertificationStatus(player).code;
    return statusCode === statusFilter;
  });

  // Paginación
  const totalPages = Math.ceil(filteredPlayers.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + pageSize);

  const handleChoosePlayer = (player) => {
    if (onSelectPatient) {
      onSelectPatient(player);
    } else if (onSelectPatientId) {
      onSelectPatientId(player.id);
    }
  };

  const handleDownloadWord = async (e, player) => {
    e.stopPropagation();
    try {
      setDownloadingDocxId(player.id || player.fileName);
      await downloadPatientDocx(player);
    } catch (err) {
      console.error("Error al exportar Word:", err);
    } finally {
      setDownloadingDocxId(null);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setClubFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Toast Alert flotante */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-md shadow-lg border text-xs font-semibold flex items-center space-x-2 bg-emerald-50 text-emerald-800 border-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadToast}</span>
        </div>
      )}

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

      {/* 1. ENCABEZADO DE PÁGINA LIMPIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
            Bandeja de Certificaciones Médicas
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Temporada Oficial FPF & CONMEBOL 2026 — Certificación Médica Pre-Competencia
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('pool')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition cursor-pointer shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Pool de Rotación</span>
          </button>

          <button
            type="button"
            onClick={() => dashboardFileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-xs font-semibold text-white transition cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>+ Subir Archivos</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE RESUMEN QUE FUNCIONAN COMO FILTROS ACTIVOS (Left-Border Accent) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Expedientes */}
        <div 
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`bg-white border rounded-lg p-3.5 shadow-2xs transition cursor-pointer border-l-4 border-l-[#0284C7] relative ${
            statusFilter === 'ALL' 
              ? 'border-[#0284C7] ring-2 ring-[#0284C7]/20 bg-sky-50/25' 
              : 'border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Total Expedientes</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-[#1E293B]">{totalCount}</span>
            <span className="text-[11px] text-[#64748B]">cargados</span>
          </div>
          {statusFilter === 'ALL' && (
            <div className="mt-1.5 text-[10px] font-semibold text-[#0284C7] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] inline-block"></span>
              Filtro activo (Ver todos)
            </div>
          )}
        </div>

        {/* Card 2: Vigentes / Aptos FPF */}
        <div 
          onClick={() => { setStatusFilter('VIGENTE'); setCurrentPage(1); }}
          className={`bg-white border rounded-lg p-3.5 shadow-2xs transition cursor-pointer border-l-4 border-l-[#15803D] relative ${
            statusFilter === 'VIGENTE' 
              ? 'border-[#15803D] ring-2 ring-[#15803D]/20 bg-emerald-50/25' 
              : 'border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">Vigentes (Aptos)</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-[#15803D]">{vigentesCount}</span>
            <span className="text-[11px] text-[#64748B]">aptos FPF</span>
          </div>
          {statusFilter === 'VIGENTE' && (
            <div className="mt-1.5 text-[10px] font-semibold text-[#15803D] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D] inline-block"></span>
              Filtro activo (Solo Aptos)
            </div>
          )}
        </div>

        {/* Card 3: Por Renovar (< 30 días) */}
        <div 
          onClick={() => { setStatusFilter('POR_RENOVAR'); setCurrentPage(1); }}
          className={`bg-white border rounded-lg p-3.5 shadow-2xs transition cursor-pointer border-l-4 border-l-[#B45309] relative ${
            statusFilter === 'POR_RENOVAR' 
              ? 'border-[#B45309] ring-2 ring-[#B45309]/20 bg-amber-50/25' 
              : 'border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">Por Renovar (30d)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-[#B45309]">{porRenovarCount}</span>
            <span className="text-[11px] text-[#64748B]">próximos</span>
          </div>
          {statusFilter === 'POR_RENOVAR' && (
            <div className="mt-1.5 text-[10px] font-semibold text-[#B45309] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] inline-block"></span>
              Filtro activo (Próximos)
            </div>
          )}
        </div>

        {/* Card 4: Observaciones Clínicas */}
        <div 
          onClick={() => { setStatusFilter('OBSERVADO'); setCurrentPage(1); }}
          className={`bg-white border rounded-lg p-3.5 shadow-2xs transition cursor-pointer border-l-4 border-l-[#B91C1C] relative ${
            statusFilter === 'OBSERVADO' 
              ? 'border-[#B91C1C] ring-2 ring-[#B91C1C]/20 bg-rose-50/25' 
              : 'border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C]">Observados</span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono text-[#B91C1C]">{observadosCount}</span>
            <span className="text-[11px] text-[#64748B]">pendientes</span>
          </div>
          {statusFilter === 'OBSERVADO' && (
            <div className="mt-1.5 text-[10px] font-semibold text-[#B91C1C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] inline-block"></span>
              Filtro activo (Observados)
            </div>
          )}
        </div>

      </section>

      {/* 3. TABLA CLÍNICA DE FUTBOLISTAS (Data Grid Institucional) */}
      <section 
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white border border-[#E2E8F0] rounded-lg shadow-2xs overflow-hidden transition-all duration-150 ${
          isDragging ? 'ring-2 ring-[#0284C7] bg-sky-50/50' : ''
        }`}
      >
        
        {/* Barra de Filtros Real: Buscador + Filtro de Club + Estado Activo (Sin píldoras redundantes) */}
        <div className="p-3.5 sm:p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
          
          {/* Lado Izquierdo: Buscador y Filtro por Club */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            
            {/* Buscador de Jugadores */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por futbolista, DNI o archivo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-[#1E293B] focus:outline-none focus:border-[#0284C7] focus:bg-white transition"
              />
            </div>

            {/* Selector Útil de Club Deportivo */}
            <div className="relative w-full sm:w-56">
              <select
                value={clubFilter}
                onChange={(e) => {
                  setClubFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-[#1E293B] font-medium focus:outline-none focus:border-[#0284C7] focus:bg-white transition cursor-pointer"
              >
                <option value="ALL">Todos los Clubes ({patientsList.length})</option>
                {uniqueClubs.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Etiqueta de Filtro Activo con botón de reinicio rápido */}
            {(statusFilter !== 'ALL' || clubFilter !== 'ALL' || searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[#1E293B] text-[11px] font-semibold transition cursor-pointer shrink-0"
                title="Quitar todos los filtros aplicados"
              >
                <span>Limpiar filtros</span>
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}

          </div>

          {/* Lado Derecho: Conteo de Registros */}
          <div className="text-xs text-[#64748B] shrink-0 text-right">
            Mostrando <strong className="text-[#1E293B]">{filteredPlayers.length}</strong> de <strong className="text-[#1E293B]">{totalCount}</strong> expedientes
          </div>

        </div>

        {/* Tabla Clásica de EHR / Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[200px]">Futbolista / DNI</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[170px]">Club / Categoría</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[120px]">Fecha Evaluación</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[170px]">Estado FPF</th>
                <th className="py-2.5 px-4 font-semibold whitespace-nowrap min-w-[100px]">Expediente</th>
                <th className="py-2.5 px-4 font-semibold text-right whitespace-nowrap min-w-[210px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-sm text-[#1E293B]">
                        No se encontraron futbolistas con los filtros seleccionados
                      </p>
                      <p className="text-xs">
                        {searchTerm ? `No hay resultados para "${searchTerm}".` : 'No hay registros en el club o estado seleccionado.'}
                      </p>
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="mt-2 text-xs text-[#0284C7] font-semibold hover:underline"
                      >
                        Restablecer todos los filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((player) => {
                  const status = getPlayerCertificationStatus(player);
                  const isWordDownloading = downloadingDocxId === (player.id || player.fileName);
                  
                  return (
                    <tr 
                      key={player.id || player.fileName}
                      onClick={() => handleChoosePlayer(player)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* 1. Futbolista / DNI */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-[#0284C7]/10 group-hover:text-[#0284C7] group-hover:border-[#0284C7]/30 transition">
                            {player.apellidos?.charAt(0) || player.nombres?.charAt(0) || player.nombreCompleto?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1E293B] group-hover:text-[#0284C7] transition truncate">
                              {player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`.trim()}
                            </div>
                            <div className="text-[11px] text-[#64748B] font-mono">
                              DNI: {player.dni || '74290500'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Club / Categoría */}
                      <td className="py-3 px-4 min-w-[170px]">
                        <div className="font-medium text-[#1E293B] truncate max-w-[180px]">
                          {player.club || globalClub}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {player.categoria || 'Primera División'}
                        </div>
                      </td>

                      {/* 3. Fecha Evaluación */}
                      <td className="py-3 px-4 text-[#1E293B] font-mono text-[11px] whitespace-nowrap min-w-[120px]">
                        {player.fechaEvaluacion || globalDate}
                      </td>

                      {/* 4. Estado FPF (Sin división en múltiples líneas, formato limpio en 1 sola línea) */}
                      <td className="py-3 px-4 whitespace-nowrap min-w-[170px]">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${
                          status.code === 'VIGENTE'
                            ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                            : status.code === 'POR_RENOVAR'
                            ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                            : 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            status.code === 'VIGENTE' ? 'bg-emerald-600' : status.code === 'POR_RENOVAR' ? 'bg-amber-600' : 'bg-red-600'
                          }`}></span>
                          <span className="whitespace-nowrap">
                            {status.code === 'VIGENTE' ? '• Vigente / Apto FPF' : status.code === 'POR_RENOVAR' ? '• Por Renovar (30d)' : '• Observado'}
                          </span>
                        </span>
                      </td>

                      {/* 5. Expediente 21P */}
                      <td className="py-3 px-4 whitespace-nowrap min-w-[100px]">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium whitespace-nowrap">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>21 Págs</span>
                        </span>
                      </td>

                      {/* 6. Acciones (Botones compactos en 1 línea que nunca se cortan ni desbordan) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap min-w-[210px]" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              handleChoosePlayer(player);
                              onNavigateTab('documento');
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-semibold transition cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
                            title="Ver expediente completo de 21 páginas"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver 21P</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleChoosePlayer(player);
                              onNavigateTab('editor');
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition cursor-pointer shrink-0 whitespace-nowrap"
                            title="Editar ficha médica"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            disabled={isWordDownloading}
                            onClick={(e) => handleDownloadWord(e, player)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                            title="Descargar documento oficial Word (.docx) con los 29 sellos"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Word</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Inferior */}
        <div className="p-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] bg-slate-50/50">
          <div>
            Mostrando <span className="font-semibold text-[#1E293B]">{paginatedPlayers.length > 0 ? startIndex + 1 : 0}</span> a{' '}
            <span className="font-semibold text-[#1E293B]">{Math.min(startIndex + pageSize, filteredPlayers.length)}</span> de{' '}
            <span className="font-semibold text-[#1E293B]">{filteredPlayers.length}</span> expedientes
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E293B]"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium text-[#1E293B]">
              Página {validCurrentPage} de {totalPages}
            </span>

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#1E293B]"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

      {/* 4. MÓDULOS DE APOYO AL DIAGNÓSTICO (3 bloques clínicos limpios) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Servicios de Apoyo al Diagnóstico (Protocolo Oficial FPF)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* Bloque Cardiología Deportiva */}
          <div 
            onClick={() => onNavigateTab('editor')}
            className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-4 shadow-2xs transition cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#B91C1C]" />
                <h3 className="text-xs font-bold text-[#1E293B]">
                  Cardiología Deportiva
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-[#15803D] border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                Calibrado
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Electrocardiograma de 12 derivaciones (CONMEBOL) y Ecocardiograma Doppler transtorácico.
            </p>
            <div className="text-[11px] font-semibold text-[#0284C7] flex items-center gap-1 pt-0.5">
              <span>Abrir protocolo cardiológico</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bloque Laboratorio Clínico */}
          <div 
            onClick={() => onNavigateTab('editor')}
            className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-4 shadow-2xs transition cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-4 h-4 text-[#15803D]" />
                <h3 className="text-xs font-bold text-[#1E293B]">
                  Laboratorio Clínico
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-[#15803D] border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                Validado FPF
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Hemograma automatizado, bioquímica sérica (Glucosa) y examen parasitológico seriado.
            </p>
            <div className="text-[11px] font-semibold text-[#0284C7] flex items-center gap-1 pt-0.5">
              <span>Abrir módulo de laboratorio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Bloque Radiología de Tórax */}
          <div 
            onClick={() => onNavigateTab('editor')}
            className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-4 shadow-2xs transition cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-[#0284C7]" />
                <h3 className="text-xs font-bold text-[#1E293B]">
                  Radiología de Tórax
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-[#15803D] border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                Favorable
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Informe radiológico en incidencia PA, campos pulmonares e índice cardiotorácico.
            </p>
            <div className="text-[11px] font-semibold text-[#0284C7] flex items-center gap-1 pt-0.5">
              <span>Abrir reporte e imagen Rx</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
