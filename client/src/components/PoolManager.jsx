import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Upload, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  Layers, 
  Check, 
  FileCheck2,
  ChevronRight,
  Database,
  Building,
  Building2,
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';
import drivePatients from '../data/drivePatients.json';
import { downloadPatientDocx, downloadBatchDocxZip } from '../utils/docxGenerator';
import { getPlayerCertificationStatus } from '../utils/statusClassifier';
import { saveBatchPatientsToSupabase } from '../lib/supabase';

export const POPULAR_CLUBS = [
  'Club Alianza Lima',
  'Club Universitario de Deportes',
  'Sporting Cristal',
  'FBC Melgar',
  'Cienciano del Cusco',
  'Sport Boys Association',
  'Academia Deportiva Cantolao',
  'Asociación Deportiva Tarma (ADT)',
  'Club Deportivo Garcilaso',
  'Club Deportivo Zúñiga',
  'Cusco FC',
  'Los Chankas CYC',
  'Atlético Grau',
  'Universidad César Vallejo',
  'Comerciantes Unidos',
  'UTC de Cajamarca',
  'Club FPF / Liga Formativa'
];

// Meses de la temporada deportiva 2026
const MONTHS = [
  { id: 'ALL', name: 'Todo el Año', count: 3420 },
  { id: 'ENE', name: 'Enero', count: 320, activeMonth: true },
  { id: 'FEB', name: 'Febrero', count: 410 },
  { id: 'MAR', name: 'Marzo', count: 280 },
  { id: 'ABR', name: 'Abril', count: 350 },
  { id: 'MAY', name: 'Mayo', count: 310 },
  { id: 'JUN', name: 'Junio', count: 440 },
  { id: 'JUL', name: 'Julio', count: 290 },
  { id: 'AGO', name: 'Agosto', count: 310 },
  { id: 'SET', name: 'Setiembre', count: 260 },
  { id: 'OCT', name: 'Octubre', count: 240 },
  { id: 'NOV', name: 'Noviembre', count: 180 },
  { id: 'DIC', name: 'Diciembre', count: 140 },
];

export default function PoolManager({ 
  patientsList = [],
  setPatientsList,
  onSelectPatient,
  onSelectPatientId, 
  onNavigateTab, 
  onPrint,
  currentPatient, 
  setCurrentPatient 
}) {
  const [pool, setPool] = useState(() => {
    return (patientsList && patientsList.length > 0) ? patientsList : (drivePatients || []);
  });

  // Mantener sincronizado el pool si se actualiza la lista principal
  useEffect(() => {
    if (patientsList && patientsList.length > 0) {
      setPool(patientsList);
    } else if (drivePatients && drivePatients.length > 0) {
      setPool(drivePatients);
    }
  }, [patientsList]);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFormatOrder, setNameFormatOrder] = useState('LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'
  const [globalDate, setGlobalDate] = useState('22-01-2026');
  const [globalClub, setGlobalClub] = useState('Club FPF / Liga Formativa');
  const [isApplyingCascade, setIsApplyingCascade] = useState(false);
  const [isApplyingClub, setIsApplyingClub] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Ejecución segura de exportación tras ratificación médica
  const handleExecuteBatchExport = async () => {
    if (!authConfirmed) {
      setToastMessage({
        type: 'error',
        text: 'Debe marcar la casilla de ratificación médica oficial para continuar.'
      });
      return;
    }
    const selectedPatients = pool.filter(p => selectedIds.has(p.id || p.fileName));
    if (selectedPatients.length === 0) return;

    setIsExportingZip(true);
    setShowAuthModal(false);
    try {
      setToastMessage({
        type: 'info',
        text: `Compilando lote oficial de ${selectedPatients.length} expedientes Word (.docx) con sellos médicos...`
      });
      await downloadBatchDocxZip(selectedPatients, { 
        globalDate, 
        globalClub: globalClub || 'Club FPF / Liga Formativa', 
        nameOrder: nameFormatOrder 
      });
      setToastMessage({
        type: 'success',
        text: `¡Lote de ${selectedPatients.length} expedientes descargado con firma médica autorizada!`
      });
    } catch (e) {
      setToastMessage({ type: 'error', text: e.message });
    } finally {
      setIsExportingZip(false);
      setAuthConfirmed(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Normalizador defensivo de nombres
  const formatPlayerName = (apellidos = '', nombres = '', order) => {
    const cleanAp = (apellidos || '').trim();
    const cleanNom = (nombres || '').trim();
    if (order === 'LAST_FIRST') {
      return `${cleanAp} ${cleanNom}`.trim().toUpperCase();
    }
    return `${cleanNom} ${cleanAp}`.trim().toUpperCase();
  };

  // Filtrado reactivo defensivo por Mes y Búsqueda
  const filteredList = useMemo(() => {
    if (!pool || !Array.isArray(pool)) return [];
    return pool.filter(p => {
      if (!p) return false;
      const matchMonth = selectedMonth === 'ALL' || p.mes === selectedMonth;
      if (!searchQuery) return matchMonth;
      const q = searchQuery.toLowerCase().trim();
      const name = (p.nombreCompleto || `${p.apellidos || ''} ${p.nombres || ''}`).toLowerCase();
      const dni = (p.dni || '').toString().toLowerCase();
      const club = (p.club || '').toLowerCase();
      const pos = (p.posicion || '').toLowerCase();
      const matchQuery = 
        name.includes(q) ||
        dni.includes(q) ||
        club.includes(q) ||
        pos.includes(q);
      return matchMonth && matchQuery;
    });
  }, [pool, selectedMonth, searchQuery]);

  // Paginación y Selección Múltiple
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const handleToggleSelectAll = () => {
    if (paginatedList.length === 0) return;
    const allCurrentPageSelected = paginatedList.every(p => {
      const id = p.id || p.fileName;
      return selectedIds.has(id);
    });

    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      paginatedList.forEach(p => {
        const id = p.id || p.fileName;
        if (id) next.delete(id);
      });
    } else {
      paginatedList.forEach(p => {
        const id = p.id || p.fileName;
        if (id) next.add(id);
      });
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id) => {
    if (!id) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Aplicar fecha unificada EXCLUSIVAMENTE a los futbolistas marcados con checkbox
  const handleApplyGlobalDate = () => {
    if (selectedIds.size === 0) {
      setToastMessage({
        type: 'error',
        text: 'Debes marcar la casilla (checkbox) de al menos un futbolista para sincronizar la fecha.'
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (!globalDate.trim()) return;

    setIsApplyingCascade(true);
    setTimeout(() => {
      let count = 0;
      const updated = pool.map(player => {
        const pId = player.id || player.fileName;
        if (selectedIds.has(pId)) {
          count++;
          return {
            ...player,
            fechaEvaluacion: globalDate.trim(),
            synced21Pages: true
          };
        }
        return player;
      });
      setPool(updated);
      if (setPatientsList) {
        setPatientsList(updated);
      }
      if (setCurrentPatient && selectedIds.has(currentPatient?.id || currentPatient?.fileName)) {
        setCurrentPatient(prev => ({
          ...prev,
          fechaEvaluacion: globalDate.trim()
        }));
      }
      saveBatchPatientsToSupabase(updated);
      setIsApplyingCascade(false);
      setToastMessage({
        type: 'success',
        text: `¡Fecha "${globalDate.trim()}" sincronizada exclusivamente en los ${count} futbolistas marcados!`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 300);
  };

  // Aplicar nombre de club EXCLUSIVAMENTE a los futbolistas marcados con checkbox
  const handleApplyClub = () => {
    if (selectedIds.size === 0) {
      setToastMessage({
        type: 'error',
        text: 'Debes marcar la casilla (checkbox) de al menos un futbolista para sincronizar el club.'
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (!globalClub.trim()) return;

    setIsApplyingClub(true);
    setTimeout(() => {
      let count = 0;
      const updated = pool.map(player => {
        const pId = player.id || player.fileName;
        if (selectedIds.has(pId)) {
          count++;
          return {
            ...player,
            club: globalClub.trim()
          };
        }
        return player;
      });
      setPool(updated);
      if (setPatientsList) {
        setPatientsList(updated);
      }
      if (setCurrentPatient && selectedIds.has(currentPatient?.id || currentPatient?.fileName)) {
        setCurrentPatient(prev => ({
          ...prev,
          club: globalClub.trim()
        }));
      }
      saveBatchPatientsToSupabase(updated);
      setIsApplyingClub(false);
      setToastMessage({
        type: 'success',
        text: `¡Club "${globalClub.trim()}" sincronizado exclusivamente en los ${count} futbolistas marcados!`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 300);
  };

  // Cambiar formato estándar de nombres en todo el pool
  const handleToggleNameFormat = (newOrder) => {
    setNameFormatOrder(newOrder);
    const updated = pool.map(p => ({
      ...p,
      nombreCompleto: formatPlayerName(p.apellidos, p.nombres, newOrder)
    }));
    setPool(updated);
    if (setPatientsList) {
      setPatientsList(updated);
    }
    setToastMessage({
      type: 'info',
      text: `Formato de nombres estandarizado a: ${newOrder === 'LAST_FIRST' ? '[APELLIDOS NOMBRES]' : '[NOMBRES APELLIDOS]'}. Ningún nombre saldrá invertido.`
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

const handleSelectToView = (player) => {
    if (onSelectPatient) {
      onSelectPatient(player);
    } else if (setCurrentPatient) {
      setCurrentPatient(player);
    } else if (onSelectPatientId) {
      onSelectPatientId(player.id);
    }
    onNavigateTab('documento');
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* NOTIFICACIÓN FLOTANTE TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-16 right-6 z-50 p-3 rounded-md shadow-lg border flex items-center space-x-2.5 max-w-md text-xs font-semibold ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-sky-50 border-sky-300 text-sky-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="leading-relaxed">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA PRINCIPAL: POOL 3,000 - 5,000 JUGADORES */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0369A1] bg-sky-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Database className="w-3 h-3" /> POOL DE 3,000 A 5,000 JUGADORES
            </span>
            <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Estandarización FPF / CONMEBOL
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B]">
            Gestor de Pool Masivo & Rotación por Meses
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl">
            Estandariza el orden de nombres y apellidos, y sincroniza la fecha única en cascada en las 19 páginas para exportaciones masivas seguras.
          </p>
        </div>

        {/* Métrica compacta de capacidad */}
        <div className="bg-slate-50 border border-[#E2E8F0] p-3 rounded-md flex items-center space-x-5 shrink-0 shadow-xs">
          <div>
            <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Capacidad Pool</div>
            <div className="text-xl font-bold text-[#1E293B] font-mono mt-0.5">
              {pool.length} <span className="text-xs text-[#64748B] font-normal">/ 5,000</span>
            </div>
            <div className="w-28 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-[#0369A1] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (pool.length / 5000) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Rotación Activa</div>
            <div className="text-xs font-bold text-[#166534] mt-0.5">12 Meses</div>
            <div className="text-[10px] text-[#64748B]">Temporada 2026</div>
          </div>
        </div>
      </div>

      {/* CONTROLES DE ESTANDARIZACIÓN: NOMBRES, FECHA Y CLUB EN CASCADA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* PANEL 1: ESTANDARIZADOR DE NOMBRES */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0369A1]" />
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Estandarizador de Nombres</h3>
            </div>
            <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
              Activo
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-[#64748B]">
              Selecciona la regla de nomenclatura obligatoria para todo el lote:
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleToggleNameFormat('LAST_FIRST')}
                className={`p-2.5 rounded-md border text-left transition cursor-pointer ${
                  nameFormatOrder === 'LAST_FIRST'
                    ? 'bg-sky-50 border-[#0369A1] text-[#0369A1]'
                    : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#0369A1]">Formato Oficial FPF</div>
                <div className="text-xs font-bold font-mono mt-0.5">[APELLIDOS NOMBRES]</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">PONCE ECHEVARRIA CARLOS</div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleNameFormat('FIRST_LAST')}
                className={`p-2.5 rounded-md border text-left transition cursor-pointer ${
                  nameFormatOrder === 'FIRST_LAST'
                    ? 'bg-sky-50 border-[#0369A1] text-[#0369A1]'
                    : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-[#64748B]">Formato Directo</div>
                <div className="text-xs font-bold font-mono mt-0.5">[NOMBRES APELLIDOS]</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">CARLOS PONCE ECHEVARRIA</div>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL 2: FECHA ÚNICA EN CASCADA */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#0369A1]" />
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Sincronizador de Fecha Única</h3>
            </div>
            <span className="text-[10px] font-bold text-[#0369A1] bg-sky-50 px-2 py-0.5 rounded">
              19 Págs Sincronizadas
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-[#CBD5E1] rounded-md px-3 py-1.5 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  placeholder="DD-MM-YYYY (ej. 22-01-2026)"
                  className="bg-transparent text-xs font-mono font-bold text-[#1E293B] focus:outline-none w-full"
                />
              </div>

            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleApplyGlobalDate}
                disabled={isApplyingCascade || selectedIds.size === 0}
                className={`w-full text-xs font-bold py-2 px-3 rounded-md shadow-xs transition flex items-center justify-center space-x-1.5 ${
                  selectedIds.size > 0
                    ? 'bg-[#0369A1] hover:bg-[#075985] text-white cursor-pointer'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={selectedIds.size > 0 ? `Sincronizar fecha a los ${selectedIds.size} futbolistas marcados con checkbox` : 'Marca casillas de futbolistas abajo para sincronizar'}
              >
                {isApplyingCascade ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  {selectedIds.size > 0 
                    ? `Sincronizar Fecha a Marcados (${selectedIds.size})` 
                    : 'Marca casillas abajo para sincronizar fecha'}
                </span>
              </button>
            </div>

            {/* Check de Cascada a los 21 Documentos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {[
                'Carátula FPF',
                'Historia Clínica',
                'CONMEBOL',
                'Ecocardiograma',
                'Laboratorio Hemat.',
                'Bioquímica Sangre',
                'Parasitológico',
                'Dictamen Famiheart'
              ].map((docName, i) => (
                <div key={i} className="bg-slate-50 p-1.5 rounded border border-[#E2E8F0] flex items-center space-x-1.5 text-[10px] text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{docName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 3: ASIGNADOR MASIVO DE CLUB (SIMILAR A FECHAS) */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#0369A1]" />
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Asignador Masivo de Club</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedIds.size > 0 ? 'bg-emerald-50 text-[#15803D]' : 'bg-sky-50 text-[#0369A1]'}`}>
              {selectedIds.size > 0 ? `${selectedIds.size} seleccionados` : 'Oficial FPF'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-[#CBD5E1] rounded-md px-3 py-1.5 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  list="pool-clubs-list"
                  value={globalClub}
                  onChange={(e) => setGlobalClub(e.target.value)}
                  placeholder="Club oficial FPF..."
                  className="bg-transparent text-xs font-bold text-[#1E293B] focus:outline-none w-full truncate"
                />
                <datalist id="pool-clubs-list">
                  {POPULAR_CLUBS.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleApplyClub}
                disabled={isApplyingClub || selectedIds.size === 0}
                className={`w-full text-xs font-bold py-2 px-3 rounded-md shadow-xs transition flex items-center justify-center space-x-1.5 ${
                  selectedIds.size > 0
                    ? 'bg-[#0369A1] hover:bg-[#075985] text-white cursor-pointer'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={selectedIds.size > 0 ? `Sincronizar club a los ${selectedIds.size} futbolistas marcados con checkbox` : 'Marca casillas de futbolistas abajo para sincronizar'}
              >
                {isApplyingClub ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  {selectedIds.size > 0 
                    ? `Sincronizar Club a Marcados (${selectedIds.size})` 
                    : 'Marca casillas abajo para sincronizar club'}
                </span>
              </button>
            </div>

            {/* Check de Cascada a los Documentos Oficiales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {[
                'Carátula FPF',
                'Historia Clínica',
                'CONMEBOL',
                'Dictamen Médico'
              ].map((docName, i) => (
                <div key={i} className="bg-slate-50 p-1.5 rounded border border-[#E2E8F0] flex items-center space-x-1.5 text-[10px] text-slate-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{docName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROTACIÓN MENSUAL (12 Meses 2026) */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2.5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#15803D]" />
              Rotación del Calendario Anual (12 Meses)
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rotación Anual Acreditada</span>
            </span>
          </div>
        </div>

        {/* Barra Deslizable de Meses */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MONTHS.map(m => {
            const isSelected = selectedMonth === m.id;
            const countForMonth = m.id === 'ALL' 
              ? pool.length 
              : pool.filter(p => p.mes === m.id).length;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelectedMonth(m.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer border flex items-center space-x-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
                }`}
              >
                <span>{m.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded ${
                  isSelected ? 'bg-[#0369a1] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {countForMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTADO DE FUTBOLISTAS DEL POOL CON PAGINACIÓN Y SELECCIÓN MÚLTIPLE */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-xs">
        
        {/* Barra de Filtros, Búsqueda y Selección en Lote */}
        <div className="p-3.5 sm:p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Nombre, DNI, Club o Posición..."
              className="w-full bg-slate-50 border border-[#CBD5E1] pl-8 pr-3 py-1.5 rounded-md text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:border-[#0284C7] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs text-[#64748B]">
              Total: <strong className="text-[#1E293B]">{filteredList.length}</strong> futbolistas
            </span>

            {/* Selector de Tamaño de Página */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-[#CBD5E1] text-xs text-[#1E293B] font-semibold rounded-md px-2 py-1.5 focus:outline-none focus:border-[#0284C7]"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>

            {/* Acción en Lote para Seleccionados */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAuthConfirmed(false);
                  setShowAuthModal(true);
                }}
                disabled={isExportingZip}
                className="bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Seleccionados ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra Flotante de Acciones en Lote cuando hay selección */}
        {selectedIds.size > 0 && (
          <div className="mb-3 bg-sky-50 border border-sky-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <span className="bg-[#0369A1] text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                <Check className="w-3.5 h-3.5" />
                <span>{selectedIds.size} futbolistas seleccionados</span>
              </span>
              <span className="text-xs text-slate-700 font-semibold hidden md:inline">
                Edición masiva de registros:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Asignador directo de Club */}
              <div className="flex items-center bg-white border border-slate-300 rounded-md overflow-hidden shadow-2xs">
                <div className="px-2 text-slate-400">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  list="pool-clubs-list"
                  value={globalClub}
                  onChange={(e) => setGlobalClub(e.target.value)}
                  placeholder="Club para seleccionados..."
                  className="text-xs font-bold text-slate-800 px-2 py-1.5 focus:outline-none w-44 truncate"
                />
                <button
                  type="button"
                  onClick={handleApplyClub}
                  disabled={isApplyingClub}
                  className="bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold px-3 py-1.5 transition cursor-pointer flex items-center gap-1"
                  title="Asignar este club a todos los seleccionados con checkbox"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sincronizar Club</span>
                </button>
              </div>

              {/* Asignador directo de Fecha */}
              <div className="flex items-center bg-white border border-slate-300 rounded-md overflow-hidden shadow-2xs">
                <div className="px-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  placeholder="DD-MM-AAAA"
                  className="text-xs font-mono font-bold text-slate-800 px-2 py-1.5 focus:outline-none w-28 text-center"
                />
                <button
                  type="button"
                  onClick={handleApplyGlobalDate}
                  disabled={isApplyingCascade}
                  className="bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold px-3 py-1.5 transition cursor-pointer flex items-center gap-1"
                  title="Asignar esta fecha a todos los seleccionados con checkbox"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Sincronizar Fecha</span>
                </button>
              </div>

              {/* Descargar Lote PDF Oficial */}
              <button
                type="button"
                onClick={() => {
                  const selectedPatients = pool.filter(p => selectedIds.has(p.id || p.fileName));
                  if (selectedPatients.length === 0) return;
                  if (onPrint) {
                    onPrint(selectedPatients);
                  } else {
                    window.print();
                  }
                }}
                className="bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
                title={`Descargar o guardar lote de ${selectedIds.size} futbolistas en PDF oficial`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Descargar Lote PDF ({selectedIds.size})</span>
              </button>

              {/* Exportar Seleccionados Word */}
              <button
                type="button"
                onClick={() => {
                  setAuthConfirmed(false);
                  setShowAuthModal(true);
                }}
                disabled={isExportingZip}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-2xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Word ZIP ({selectedIds.size})</span>
              </button>

              {/* Limpiar selección */}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-1 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Tabla Responsiva con Selección */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedList.length > 0 && paginatedList.every(p => selectedIds.has(p.id || p.fileName))}
                    onChange={handleToggleSelectAll}
                    className="rounded border-[#CBD5E1] text-[#0369A1] cursor-pointer"
                    title="Seleccionar todos los de esta página"
                  />
                </th>
                <th className="px-4 py-2.5 font-semibold">Futbolista</th>
                <th className="px-4 py-2.5 font-semibold">Club / Categoría</th>
                <th className="px-4 py-2.5 font-semibold">DNI</th>
                <th className="px-4 py-2.5 font-semibold">Fecha Evaluación</th>
                <th className="px-4 py-2.5 font-semibold text-center">Estado FPF</th>
                <th className="px-4 py-2.5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <Users className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="font-semibold text-xs text-[#1E293B]">No hay futbolistas con los criterios actuales</span>
                      <span className="text-[11px] text-[#64748B]">Prueba ajustando la búsqueda o seleccionando otro mes de la temporada.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((player) => {
                  const pId = player.id || player.fileName;
                  const isSelected = selectedIds.has(pId);
                  const status = getPlayerCertificationStatus(player);

                  return (
                    <tr 
                      key={pId} 
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/60' : ''
                      }`}
                      onClick={() => handleToggleSelectOne(pId)}
                    >
                      <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(pId)}
                          className="rounded border-[#CBD5E1] text-[#0369A1] cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor}`} />
                          <div className="font-semibold text-[#1E293B] text-xs">
                            {player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`}
                          </div>
                        </div>
                        <div className="text-[11px] text-[#64748B] pl-4">
                          Posición: {player.posicion || 'Campo'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1E293B]">{player.club || 'Club FPF'}</div>
                        <div className="text-[11px] text-[#64748B]">{player.categoria || 'Primera / Reserva'}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[#64748B] text-xs">
                        {player.dni || '70000000'}
                      </td>

                      <td className="px-4 py-3 font-mono font-medium text-[#0369A1] text-xs">
                        {player.fechaEvaluacion || globalDate}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          status.code === 'VIGENTE'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : status.code === 'POR_RENOVAR'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}>
                          {status.shortLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectPatient) onSelectPatient(player);
                              if (onNavigateTab) onNavigateTab('documento');
                            }}
                            className="bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-semibold px-2.5 py-1 rounded-md transition cursor-pointer shadow-xs"
                            title="Ver las 19 páginas del expediente"
                          >
                            <span>Ver 19P</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadPatientDocx(player, { globalDate: player.fechaEvaluacion || globalDate, globalClub: player.club })}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] p-1.5 rounded-md transition cursor-pointer"
                            title="Descargar Word oficial con sellos médicos intactos"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
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

        {/* Barra de Paginación */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#64748B]">
              Página <strong className="text-[#1E293B]">{currentPage}</strong> de <strong className="text-[#1E293B]">{totalPages}</strong> ({filteredList.length} registros)
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] text-[#1E293B] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer text-xs"
              >
                Anterior
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-6 h-6 rounded font-semibold text-xs transition cursor-pointer ${
                        currentPage === pNum ? 'bg-[#0284C7] text-white' : 'text-[#64748B] hover:text-[#1E293B]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-md bg-white border border-[#CBD5E1] text-[#1E293B] hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer text-xs"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </section>

      {/* MODAL DE AUTORIZACIÓN MÉDICA PARA FIRMA DIGITAL MASIVA */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setShowAuthModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg bg-white border border-[#CBD5E1] rounded-lg shadow-2xl p-6 space-y-4 text-left z-10 text-[#1E293B]"
            >
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-md bg-emerald-50 text-[#15803D] border border-emerald-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E293B]">
                      Autorización de Firma y Certificación Médica
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Emisión de expedientes oficiales FPF & CONMEBOL
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido Clínico */}
              <div className="bg-slate-50 border border-[#E2E8F0] rounded-md p-3.5 space-y-2.5 text-xs leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Médico Evaluador:</span>
                  <span className="font-bold text-[#1E293B]">Dr. Darío Hernández Alarcón</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Colegiatura & Registro:</span>
                  <span className="font-mono text-[#1E293B]">C.M.P. 27503 • R.N.E. 15620</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Expedientes a Certificar:</span>
                  <span className="font-bold text-[#0369A1]">{selectedIds.size} futbolistas</span>
                </div>
                <p className="text-[11px] text-[#64748B] pt-0.5">
                  En cumplimiento del Art. 24 de la Ley General de Salud N° 26842 y el protocolo médico FPF 2026, la inserción de sellos y firmas digitales genera validez legal en cada una de las 19 páginas del expediente.
                </p>
              </div>

              {/* Casilla de Conformidad Obligatoria */}
              <label className="flex items-start space-x-2.5 p-3 bg-white border border-[#CBD5E1] rounded-md cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={authConfirmed}
                  onChange={(e) => setAuthConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#0369A1] focus:ring-[#0369A1] cursor-pointer"
                />
                <span className="text-xs text-[#1E293B] font-medium leading-snug">
                  Como profesional acreditado, ratifico la conformidad de los exámenes pre-competencia y autorizo la inserción de mi firma y sello médico oficial en este lote.
                </span>
              </label>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end space-x-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-3.5 py-2 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-[#CBD5E1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchExport}
                  disabled={!authConfirmed || isExportingZip}
                  className="px-4 py-2 rounded-md text-xs font-bold text-white bg-[#0369A1] hover:bg-[#075985] disabled:opacity-40 transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isExportingZip ? 'Generando ZIP...' : `Autorizar y Descargar (${selectedIds.size})`}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
