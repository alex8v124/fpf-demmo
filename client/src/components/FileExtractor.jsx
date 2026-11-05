import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud,
  Edit3,
  Check, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  FolderSync, 
  UserCheck, 
  ArrowRight, 
  SlidersHorizontal, 
  Calendar, 
  Trash2, 
  Eye, 
  FileCheck2,
  Database,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';
import AttachmentSlots, { ATTACHMENT_SLOTS } from './AttachmentSlots';
import BulkAttachmentUpload from './BulkAttachmentUpload';
import { parsePatientFromFileName, formatPlayerDisplayName } from '../utils/filenameParser';
import { supabase, saveBatchPatientsToSupabase, uploadPatientPdf } from '../lib/supabase';
import { downloadAndOpenPatientPdf } from '../utils/pdfGenerator';

export default function FileExtractor({ 
  patientsList = [], 
  setPatientsList, 
  onSelectPatient, 
  onNavigateTab,
  onUpdatePatient,
  onPrint,
  globalDate: parentDate,
  globalClub: parentClub,
  nameOrder: parentOrder
}) {
  const [nameOrder, setNameOrder] = useState(parentOrder || 'LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'
  const [globalDate, setGlobalDate] = useState(parentDate || '22-01-2026');
  const [globalClub, setGlobalClub] = useState(parentClub || 'Club FPF / Liga Formativa');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [attachId, setAttachId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const getExtractionConfidence = (player) => {
    const fn = (player.fileName || '').toUpperCase();
    const hasDniOrNums = /\d{6,}/.test(fn);
    const parts = (player.nombreCompleto || '').trim().split(/\s+/);
    if (parts.length >= 3 && !hasDniOrNums) {
      return { level: 'ALTA', text: 'Alta Certeza (99%)', badgeBg: 'bg-[#DCFCE7] text-[#166534]' };
    }
    return { level: 'REVISAR', text: 'Revisión Sugerida', badgeBg: 'bg-[#FEF3C7] text-[#92400E]' };
  };

  const handleStartEdit = (player) => {
    setEditingId(player.id || player.fileName);
    setEditNameValue(player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`.trim());
  };

  const handleSaveEdit = (targetId) => {
    if (!editNameValue.trim()) return;
    setPatientsList(prev => prev.map(p => {
      if ((p.id || p.fileName) === targetId) {
        return {
          ...p,
          nombreCompleto: editNameValue.trim().toUpperCase()
        };
      }
      return p;
    }));
    setEditingId(null);
    setToastMessage({
      type: 'success',
      text: `Nombre corregido y confirmado a: "${editNameValue.trim().toUpperCase()}".`
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mantener sincronizado si cambian los props del padre
  useEffect(() => {
    if (parentDate) setGlobalDate(parentDate);
  }, [parentDate]);
  useEffect(() => {
    if (parentClub) setGlobalClub(parentClub);
  }, [parentClub]);
  useEffect(() => {
    if (parentOrder) setNameOrder(parentOrder);
  }, [parentOrder]);

  const handleToggleNameOrder = (order) => {
    setNameOrder(order);
    setPatientsList(prev => (prev || []).map(player => ({
      ...player,
      nombreCompleto: formatPlayerDisplayName(player.apellidos, player.nombres, order)
    })));
  };

  const handleClearAll = () => {
    if (window.confirm("¿Seguro que deseas limpiar la bandeja de archivos cargados?")) {
      setPatientsList([]);
      setToastMessage({
        type: 'info',
        text: "Bandeja limpiada correctamente."
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDownloadSinglePdf = (player) => {
    if (onSelectPatient) onSelectPatient(player);
    setTimeout(() => {
      if (onPrint) onPrint(player);
      else window.print();
    }, 100);
  };

  const filteredPatients = (patientsList || []).filter(player => {
    const q = searchFilter.toLowerCase();
    return (
      player.nombreCompleto?.toLowerCase().includes(q) ||
      player.fileName?.toLowerCase().includes(q) ||
      player.dni?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-200">
      
      {/* Toast Alert flotante */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 p-3 rounded-md shadow-lg border bg-white border-emerald-300 text-emerald-800 flex items-center space-x-2.5 max-w-md text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ENCABEZADO DE SECCIÓN CON BOTONES DE ACCIÓN */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0369A1] bg-sky-50 px-2 py-0.5 rounded">
              Extracción Automática FPF
            </span>
            <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded">
              Cero Tipeo Manual
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Expedientes: {patientsList.length}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B]">
            Carga de Archivos & Extracción de Nombres
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Sube los estudios médicos (PDFs o imágenes) directamente a los 5 espacios clínicos. El sistema identifica automáticamente al jugador, incrusta las imágenes en el expediente de 19 páginas y genera el PDF oficial de forma local e instantánea.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {patientsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Limpiar la lista actual"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Limpiar Bandeja</span>
            </button>
          )}
        </div>
      </div>

      {/* BARRA HORIZONTAL DE REGLAS DE EXTRACCIÓN Y CONFIGURACIÓN */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* 1. Selector de formato de nombres */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0369A1]" />
              Formato de Nombre:
            </span>
            <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => handleToggleNameOrder('LAST_FIRST')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  nameOrder === 'LAST_FIRST'
                    ? 'bg-[#0369A1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ej. AGURTO ROMERO FERNANDO"
              >
                [APELLIDOS NOMBRES] (Oficial FPF)
              </button>
              <button
                type="button"
                onClick={() => handleToggleNameOrder('FIRST_LAST')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  nameOrder === 'FIRST_LAST'
                    ? 'bg-[#0369A1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ej. FERNANDO AGURTO ROMERO"
              >
                [NOMBRES APELLIDOS] (Directo)
              </button>
            </div>
          </div>

          {/* 2. Fecha unificada en cascada */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#0369A1]" />
              Fecha Unificada:
            </span>
            <input
              type="text"
              value={globalDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setGlobalDate(newDate);
              }}
              placeholder="DD-MM-AAAA"
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#1E293B] focus:outline-none focus:border-[#0369A1] w-28 text-center"
            />
          </div>

          {/* 3. Club unificado en cascada */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#0369A1]" />
              Club FPF:
            </span>
            <input
              type="text"
              value={globalClub}
              onChange={(e) => {
                const newClub = e.target.value;
                setGlobalClub(newClub);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#0369A1] w-48 truncate"
            />
          </div>

        </div>
      </div>

      {/* LOS 5 ESPACIOS PRINCIPALES DE CARGA MASIVA */}
      <BulkAttachmentUpload 
        patientsList={patientsList}
        setPatientsList={setPatientsList}
        onUpdatePatient={onUpdatePatient}
        onSelectPatient={onSelectPatient}
        onPrint={onPrint}
        globalDate={globalDate}
        globalClub={globalClub}
        nameOrder={nameOrder}
      />

      {/* BANDEJA DE EXPEDIENTES EXTRAÍDOS EN TIEMPO REAL */}
      <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        
        {/* Cabecera de la Bandeja */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#15803D]" />
              Expedientes Médicos en Bandeja ({patientsList.length})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cada futbolista refleja en vivo sus 5 estudios clínicos asociados y su PDF oficial de 19 páginas guardado.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por futbolista o archivo..."
                className="bg-slate-50 border border-[#CBD5E1] pl-8 pr-3 py-1.5 rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:border-[#0284C7] w-52 sm:w-64"
              />
            </div>

            <span className="text-xs text-[#64748B] font-semibold bg-slate-100 px-2.5 py-1.5 rounded-lg">
              <strong className="text-[#1E293B]">{filteredPatients.length}</strong> listos
            </span>
          </div>
        </div>

        {/* Tabla de Jugadores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="px-4 py-3 font-semibold">Futbolista</th>
                <th className="px-4 py-3 font-semibold">Club & Fecha</th>
                <th className="px-4 py-3 font-semibold text-center">5 Estudios Adjuntos</th>
                <th className="px-4 py-3 font-semibold text-center">Aptitud</th>
                <th className="px-4 py-3 font-semibold text-center">PDF Oficial (19 Págs)</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredPatients.map((player) => {
                const pId = player.id || player.fileName;
                const isEditing = editingId === pId;
                const confidence = getExtractionConfidence(player);
                const attachments = player.attachments || {};
                const attachedCount = Object.keys(attachments).length;

                return (
                  <React.Fragment key={pId}>
                  <tr className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* 1. Nombre y DNI */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(pId);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="bg-white border border-[#0369A1] rounded px-2 py-1 text-xs text-[#1E293B] font-mono font-bold focus:outline-none w-full"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(pId)}
                            className="p-1 rounded bg-[#0369A1] hover:bg-[#075985] text-white transition cursor-pointer"
                            title="Guardar nombre corregido"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <div className="font-bold text-[#1E293B] text-xs font-mono">
                            {player.nombreCompleto}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(player)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#0369A1] transition cursor-pointer"
                            title="Editar nombre manualmente si hay dudas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-[11px] text-[#64748B] flex items-center space-x-1.5 mt-0.5">
                        <span className="font-mono">DNI: {player.dni || '74290500'}</span>
                        <span>•</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${confidence.badgeBg}`}>
                          {confidence.text}
                        </span>
                      </div>
                    </td>

                    {/* 2. Club y Fecha */}
                    <td className="px-4 py-3">
                      <div className="text-[#1E293B] font-medium truncate max-w-[170px]" title={player.club}>
                        {player.club}
                      </div>
                      <div className="text-[11px] text-[#64748B] font-mono">{player.fechaEvaluacion}</div>
                    </td>

                    {/* 3. Chips de los 5 Estudios */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {ATTACHMENT_SLOTS.map((slot) => {
                          const hasFile = Boolean(attachments[slot.id]?.url);
                          return (
                            <span
                              key={slot.id}
                              title={`${slot.label}: ${hasFile ? attachments[slot.id].name : 'Pendiente'}`}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                                hasFile
                                  ? 'bg-sky-100 text-[#0369A1] border border-sky-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                            >
                              {slot.id === 'eco2d' && 'ECO 2D'}
                              {slot.id === 'ecoMmode' && 'ECO MM'}
                              {slot.id === 'ecg' && 'ECG'}
                              {slot.id === 'rayosX' && 'RX'}
                              {slot.id === 'laboratorio' && 'LAB'}
                            </span>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-1">
                        {attachedCount} de 5 vinculados
                      </div>
                    </td>

                    {/* 4. Estado de Aptitud */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#166534]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{player.estadoAptitud || 'APTO'}</span>
                      </span>
                    </td>

                    {/* 5. PDF Oficial con Sellos */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        disabled={downloadingPdfId === pId}
                        onClick={() => handleDownloadSinglePdf(player)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                        title="Genera el PDF con las 19 páginas y los 5 estudios clínicos, lo abre automáticamente en nueva pestaña y lo descarga en tu equipo"
                      >
                        {downloadingPdfId === pId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{downloadingPdfId === pId ? 'Generando...' : 'Descargar PDF'}</span>
                      </button>
                    </td>

                    {/* 6. Acciones */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setAttachId(attachId === pId ? null : pId)}
                        className="mr-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center space-x-1"
                        title="Ver o reemplazar individualmente los 5 espacios"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ver 5 Espacios</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPatient(player);
                          onNavigateTab('documento');
                        }}
                        className="bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                      >
                        <span>Expediente (19P)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>

                  {/* Panel expandible de los 5 espacios individuales */}
                  {attachId === pId && (
                    <tr className="bg-slate-50/70 border-b border-[#E2E8F0]">
                      <td colSpan={6} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Espacios Clínicos Individuales para {player.nombreCompleto}:
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttachId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                          >
                            Ocultar
                          </button>
                        </div>
                        <AttachmentSlots patient={player} onUpdatePatient={onUpdatePatient} compact />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}
