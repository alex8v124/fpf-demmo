import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
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
  patientsList, 
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
  const fileInputRef = useRef(null);

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

    setTimeout(async () => {
      // Agregar sin duplicar por nombre de archivo
      setPatientsList(prev => {
        const existingNames = new Set(prev.map(p => p.fileName));
        const filteredNew = newPatients.filter(p => !existingNames.has(p.fileName));
        return [...filteredNew, ...prev];
      });

      // Auto-guardado en Supabase PostgreSQL
      saveBatchPatientsToSupabase(newPatients).then(res => {
        if (res.success) {
          console.log(`[Supabase] Auto-guardados ${res.count} expedientes en la base de datos.`);
        }
      });

      setIsProcessing(false);
      setToastMessage({
        type: 'success',
        text: `¡${newPatients.length} archivos procesados y sincronizados con Supabase! Nombres extraídos automáticamente.`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 400);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Cargar de golpe los 75 archivos del Drive
  const handleLoadDriveFiles = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const formattedDrive = drivePatients.map(p => ({
        ...p,
        nombreCompleto: formatPlayerDisplayName(p.apellidos, p.nombres, nameOrder),
        fechaEvaluacion: globalDate,
        synced21Pages: true
      }));
      setPatientsList(formattedDrive);

      // Sincronizar lote completo con Supabase
      saveBatchPatientsToSupabase(formattedDrive).then(res => {
        if (res.success) {
          console.log(`[Supabase] Sincronizados ${res.count} expedientes del Drive en PostgreSQL.`);
        }
      });

      setIsProcessing(false);
      setToastMessage({
        type: 'success',
        text: `¡Se cargaron los 75 archivos del Drive y se sincronizaron con Supabase! Nombres extraídos y estandarizados.`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 500);
  };

  // Limpiar lista y base de datos
  const handleClearAll = async () => {
    if (window.confirm('¿Deseas vaciar la bandeja y limpiar toda la data en Supabase para empezar con nueva data?')) {
      setPatientsList([]);
      try {
        await supabase.from('expedientes_medicos').delete().neq('id', '___non_existent___');
        await supabase.from('pacientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.error('Error al limpiar Supabase:', err);
      }
      setToastMessage({
        type: 'info',
        text: 'Bandeja y base de datos limpiadas. Listo para recibir nueva data.'
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Cambiar regla de nombres
  const handleToggleNameOrder = (order) => {
    setNameOrder(order);
    setPatientsList(prev => prev.map(p => ({
      ...p,
      nombreCompleto: formatPlayerDisplayName(p.apellidos, p.nombres, order)
    })));
  };

  // Filtrado de búsqueda
  const filteredPatients = patientsList.filter(p => {
    const q = searchFilter.toLowerCase();
    return (
      p.nombreCompleto?.toLowerCase().includes(q) ||
      p.fileName?.toLowerCase().includes(q) ||
      p.dni?.includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Notificación */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 p-4 rounded-2xl shadow-2xl border bg-emerald-950/95 border-emerald-500/80 text-emerald-200 flex items-center space-x-3 max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-xs font-semibold leading-relaxed">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA EXPLICATIVA */}
      <section className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> EXTRACCIÓN AUTOMÁTICA DE NOMBRES
              </span>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-950/80 border border-blue-800/80 px-2.5 py-0.5 rounded-full">
                Cero Llenado Manual de Campos
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Carga de Archivos & Extracción de Nombres
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No necesitas tipear datos a mano. Sube las imágenes o PDFs de los futbolistas y el sistema <strong className="text-white">extrae automáticamente el nombre del paciente a partir del nombre del archivo</strong> (ej. <code className="text-blue-300 font-mono">AGURTO ROMERO FERNANDO.pdf</code>) vinculándolo al expediente de 21 páginas con fecha unificada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-500/40 transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Seleccionar Nuevos Archivos</span>
            </button>
            {patientsList.length > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-800 font-semibold text-xs px-4 py-3 rounded-2xl transition cursor-pointer flex items-center justify-center space-x-1.5"
                title="Limpiar toda la data cargada"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar Data</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ZONA DE ARRASTRE DRAG & DROP Y REGLAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ZONA DRAG & DROP (2 Columnas) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-2 border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
            isDragging
              ? 'border-blue-500 bg-blue-950/40 scale-[1.01]'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
          }`}
        >
          <input 
            type="file"
            ref={fileInputRef}
            onChange={(e) => processFiles(e.target.files)}
            multiple
            accept=".pdf,image/*"
            className="hidden"
          />

          <div className="p-4 rounded-3xl bg-blue-600/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all">
            <UploadCloud className="w-10 h-10" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mt-4">
            Arrastra aquí tus Imágenes o PDFs de Exámenes
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Archivos con formato <strong className="text-slate-200">[APELLIDOS] [NOMBRES].pdf</strong> (ej. <span className="text-blue-300 font-mono">BARAYBAR COLLANTES FABIANO.pdf</span>).
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              PDFs de Electrocardiograma (EKG)
            </span>
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
              Imágenes JPG / PNG de Estudios
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
              Detección de Nombres en Vivo
            </span>
          </div>

          <div className="mt-4 text-[10px] text-slate-500">
            Haz clic en cualquier parte de este recuadro para explorar tus carpetas locales
          </div>
        </div>

        {/* PANEL LATERAL DE CONFIGURACIÓN DE EXTRACCIÓN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Reglas de Extracción</h3>
            </div>

            {/* Regla de Nombres */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Formato Estandarizado de Nombre:</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleToggleNameOrder('LAST_FIRST')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    nameOrder === 'LAST_FIRST'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase text-blue-400 font-extrabold">Oficial FPF</div>
                  <div>[APELLIDOS NOMBRES]</div>
                  <div className="text-[10px] text-slate-500 font-mono">AGURTO ROMERO FERNANDO</div>
                </button>

                <button
                  onClick={() => handleToggleNameOrder('FIRST_LAST')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                    nameOrder === 'FIRST_LAST'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase text-slate-400 font-extrabold">Formato Directo</div>
                  <div>[NOMBRES APELLIDOS]</div>
                  <div className="text-[10px] text-slate-500 font-mono">FERNANDO AGURTO ROMERO</div>
                </button>
              </div>
            </div>

            {/* Fecha Única en Cascada */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold">Fecha Unificada en Cascada:</label>
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={globalDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setGlobalDate(newDate);
                    setPatientsList(prev => prev.map(p => ({ ...p, fechaEvaluacion: newDate })));
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none w-full"
                />
              </div>
              <div className="text-[10px] text-slate-500">
                Se propaga automáticamente a las 21 páginas del expediente oficial.
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClearAll}
              disabled={patientsList.length === 0}
              className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-400 border border-slate-700 text-xs font-semibold py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar Bandeja de Archivos</span>
            </button>
          </div>
        </div>

      </div>

      {/* BANDEJA DE EXPEDIENTES EXTRAÍDOS EN TIEMPO REAL */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Cabecera de la Bandeja */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Expedientes Extraídos desde Archivos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en cualquier jugador para abrir su expediente oficial de 21 páginas con su nombre y estudio montado
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por nombre o archivo..."
                className="bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
              />
            </div>

            <span className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <strong className="text-white">{filteredPatients.length}</strong> listos
            </span>
          </div>
        </div>

        {/* Tabla de Jugadores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider">Nombre Extraído (Oficial)</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Archivo Fuente</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Apellidos / Nombres</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Fecha Cascada</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-center">Estado</th>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPatients.map((player) => (
                <tr key={player.id} className="hover:bg-slate-850/60 transition group">
                  <td className="px-6 py-4">
                    <div className="font-black text-white text-sm tracking-tight font-mono">
                      {player.nombreCompleto}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>DNI: {player.dni}</span>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">{player.origen}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="font-mono text-xs truncate max-w-[200px]" title={player.fileName}>
                        {player.fileName}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-slate-200 font-semibold">{player.apellidos}</div>
                    <div className="text-[11px] text-slate-400">{player.nombres}</div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-mono text-emerald-400 text-xs font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                      {player.fechaEvaluacion}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{player.estadoAptitud}</span>
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        onSelectPatient(player);
                        onNavigateTab('documento');
                      }}
                      className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer inline-flex items-center space-x-1.5 shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver 21 Págs</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-400">
                    <UploadCloud className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-sm text-slate-300">No hay archivos en la bandeja</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Arrastra archivos arriba o haz clic en "Cargar 75 Archivos del Drive" para procesar de inmediato.
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
