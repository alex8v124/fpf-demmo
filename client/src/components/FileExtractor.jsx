import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles, 
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
  Search
} from 'lucide-react';
import { parsePatientFromFileName, formatPlayerDisplayName } from '../utils/filenameParser';
import drivePatients from '../data/drivePatients.json';
import { supabase, saveBatchPatientsToSupabase } from '../lib/supabase';

export default function FileExtractor({ 
  patientsList = [], 
  setPatientsList, 
  onSelectPatient, 
  onNavigateTab,
  globalDate: parentDate,
  globalClub: parentClub,
  nameOrder: parentOrder
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nameOrder, setNameOrder] = useState(parentOrder || 'LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'
  const [globalDate, setGlobalDate] = useState(parentDate || '22-01-2026');
  const [globalClub, setGlobalClub] = useState(parentClub || 'Club FPF / Liga Formativa');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const fileInputRef = useRef(null);

  const getExtractionConfidence = (player) => {
    const fn = (player.fileName || '').toUpperCase();
    const hasDniOrNums = /\d{6,}/.test(fn);
    const parts = (player.nombreCompleto || '').trim().split(/\s+/);
    if (parts.length >= 3 && !hasDniOrNums) {
      return { level: 'ALTA', text: 'Alta Certeza (99%)', badgeBg: 'bg-emerald-50 border-emerald-200 text-[#15803D]' };
    }
    return { level: 'REVISAR', text: 'Revisión Sugerida', badgeBg: 'bg-amber-50 border-amber-200 text-[#B45309]' };
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

  // Procesamiento automático de archivos seleccionados por el usuario
  const processFiles = (files) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

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
      setPatientsList(prev => {
        const existingNames = new Set((prev || []).map(p => p.fileName));
        const filteredNew = newPatients.filter(p => !existingNames.has(p.fileName));
        return [...filteredNew, ...(prev || [])];
      });

      saveBatchPatientsToSupabase(newPatients).then(res => {
        if (res.success) {
          console.log(`[Supabase] ${res.count} pacientes sincronizados en la nube.`);
        }
      });

      if (onSelectPatient) {
        onSelectPatient(newPatients[0]);
      }

      setToastMessage({
        type: 'success',
        text: `¡${newPatients.length} expedientes cargados y vinculados al protocolo FPF!`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }

    setIsProcessing(false);
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
      processFiles(e.dataTransfer.files);
    }
  };

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

  const filteredPatients = (patientsList || []).filter(player => {
    const q = searchFilter.toLowerCase();
    return (
      player.nombreCompleto?.toLowerCase().includes(q) ||
      player.fileName?.toLowerCase().includes(q) ||
      player.dni?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
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

      {/* ENCABEZADO DE SECCIÓN */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
              Extracción Automática FPF
            </span>
            <span className="text-[10px] font-bold text-[#15803D] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Cero Tipeo Manual
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B]">
            Carga de Archivos & Extracción de Nombres
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Sube las imágenes o PDFs de los futbolistas y el sistema extrae automáticamente el nombre del archivo asociándolo a las 21 páginas.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-xs font-semibold text-white transition cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Seleccionar Archivos</span>
          </button>

          {patientsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-md bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
              title="Limpiar la lista actual"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Limpiar Data</span>
            </button>
          )}
        </div>
      </div>

      {/* ZONA DE ARRASTRE DRAG & DROP Y REGLAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ZONA DRAG & DROP (2 Columnas) */}
        <div 
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-2 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 relative bg-white ${
            isDragging
              ? 'border-[#0284C7] bg-sky-50/60 ring-2 ring-[#0284C7]/20'
              : 'border-[#CBD5E1] hover:border-[#0284C7] hover:bg-slate-50/50'
          }`}
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
              }
              e.target.value = '';
            }}
            multiple
            accept=".pdf,image/*"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-lg bg-sky-50 text-[#0284C7] border border-sky-200 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
            {isDragging ? '¡Suelta aquí los archivos para procesarlos!' : 'Arrastra aquí tus Imágenes o PDFs de Exámenes'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-md mt-1">
            Archivos con formato <strong className="text-[#1E293B]">[APELLIDOS] [NOMBRES].pdf</strong> (ej. <span className="text-[#0284C7] font-mono">BARAYBAR COLLANTES FABIANO.pdf</span>).
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              PDFs de Electrocardiograma (EKG)
            </span>
            <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              Imágenes JPG / PNG de Estudios
            </span>
            <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-1 rounded">
              Extracción en Vivo
            </span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            Haz clic en cualquier lugar del recuadro para abrir el explorador de archivos
          </div>
        </div>

        {/* PANEL LATERAL DE CONFIGURACIÓN */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2.5">
              <SlidersHorizontal className="w-4 h-4 text-[#0284C7]" />
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                Reglas de Extracción
              </h3>
            </div>

            {/* Formato de Nombres */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#64748B] font-semibold">Formato de Nombre Extraído:</label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleNameOrder('LAST_FIRST')}
                  className={`w-full p-2.5 rounded-md border text-left text-xs transition cursor-pointer ${
                    nameOrder === 'LAST_FIRST'
                      ? 'bg-sky-50 border-[#0284C7] text-[#0284C7] font-semibold'
                      : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#0284C7]">Oficial FPF</div>
                  <div className="font-mono text-xs">[APELLIDOS NOMBRES]</div>
                  <div className="text-[10px] text-[#64748B]">AGURTO ROMERO FERNANDO</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleNameOrder('FIRST_LAST')}
                  className={`w-full p-2.5 rounded-md border text-left text-xs transition cursor-pointer ${
                    nameOrder === 'FIRST_LAST'
                      ? 'bg-sky-50 border-[#0284C7] text-[#0284C7] font-semibold'
                      : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#64748B]">Formato Directo</div>
                  <div className="font-mono text-xs">[NOMBRES APELLIDOS]</div>
                  <div className="text-[10px] text-[#64748B]">FERNANDO AGURTO ROMERO</div>
                </button>
              </div>
            </div>

            {/* Fecha Única en Cascada */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#64748B] font-semibold">Fecha Unificada en Cascada:</label>
              <div className="flex items-center space-x-2 bg-slate-50 border border-[#CBD5E1] rounded-md px-3 py-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={globalDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setGlobalDate(newDate);
                    setPatientsList(prev => (prev || []).map(p => ({ ...p, fechaEvaluacion: newDate })));
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-[#1E293B] focus:outline-none w-full"
                />
              </div>
              <div className="text-[10px] text-[#64748B]">
                Se propaga automáticamente a las 21 páginas del expediente.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={patientsList.length === 0}
            className="w-full bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold py-2 rounded-md transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Bandeja de Archivos</span>
          </button>
        </div>

      </div>

      {/* BANDEJA DE EXPEDIENTES EXTRAÍDOS EN TIEMPO REAL */}
      <section className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        
        {/* Cabecera de la Bandeja */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#15803D]" />
              Expedientes Extraídos desde Archivos
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Haz clic en cualquier jugador para abrir su expediente oficial de 21 páginas.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por nombre o archivo..."
                className="bg-slate-50 border border-[#CBD5E1] pl-8 pr-3 py-1.5 rounded-md text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:border-[#0284C7] w-48 sm:w-60"
              />
            </div>

            <span className="text-xs text-[#64748B] font-semibold bg-slate-100 px-2.5 py-1.5 rounded-md">
              <strong className="text-[#1E293B]">{filteredPatients.length}</strong> listos
            </span>
          </div>
        </div>

        {/* Tabla de Jugadores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Nombre Extraído (Oficial)</th>
                <th className="px-4 py-2.5 font-semibold">Archivo Fuente</th>
                <th className="px-4 py-2.5 font-semibold">Apellidos / Nombres</th>
                <th className="px-4 py-2.5 font-semibold">Fecha Evaluación</th>
                <th className="px-4 py-2.5 font-semibold text-center">Estado</th>
                <th className="px-4 py-2.5 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredPatients.map((player) => {
                const pId = player.id || player.fileName;
                const isEditing = editingId === pId;
                const confidence = getExtractionConfidence(player);

                return (
                  <tr key={pId} className="hover:bg-slate-50/80 transition-colors group">
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
                            className="bg-white border border-[#0284C7] rounded px-2 py-1 text-xs text-[#1E293B] font-mono font-bold focus:outline-none w-full"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(pId)}
                            className="p-1 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white transition cursor-pointer"
                            title="Guardar nombre corregido"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <div className="font-semibold text-[#1E293B] text-xs font-mono">
                            {player.nombreCompleto}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(player)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#0284C7] transition cursor-pointer"
                            title="Editar nombre manualmente si hay dudas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-[11px] text-[#64748B] flex items-center space-x-1.5 mt-0.5">
                        <span>DNI: {player.dni || '74290500'}</span>
                        <span>•</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${confidence.badgeBg}`}>
                          {confidence.text}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5 text-[#64748B]">
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-mono text-xs truncate max-w-[180px]" title={player.fileName}>
                          {player.fileName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-[#1E293B] font-medium">{player.apellidos}</div>
                      <div className="text-[11px] text-[#64748B]">{player.nombres}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-[#1E293B] text-xs">
                        {player.fechaEvaluacion}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{player.estadoAptitud || 'APTO'}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPatient(player);
                          onNavigateTab('documento');
                        }}
                        className="bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer inline-flex items-center space-x-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver 21 Págs</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#64748B]">
                    <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-xs text-[#1E293B]">No hay archivos en la bandeja</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Arrastra archivos arriba para procesar y vincularlos de inmediato.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}
