import React, { useState, useMemo } from 'react';
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
  Sparkles, 
  Check, 
  FileCheck2,
  ChevronRight,
  Database,
  Building,
  SlidersHorizontal,
  FolderSync
} from 'lucide-react';
import drivePatients from '../data/drivePatients.json';
import { downloadPatientDocx, downloadBatchDocxZip } from '../utils/docxGenerator';
import { getPlayerCertificationStatus } from '../utils/statusClassifier';

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

// Generador de muestra representativa para el pool masivo (clubes peruanos)
const initialPoolData = [];
const oldSamplePool = [
  {
    id: 'carlos-ponce',
    nombres: 'CARLOS',
    apellidos: 'PONCE ECHEVARRIA',
    nombreCompleto: 'PONCE ECHEVARRIA CARLOS',
    dni: '72194850',
    club: 'C.D. Zúñiga',
    categoria: 'Primera División',
    posicion: 'Volante Mixto',
    mes: 'ENE',
    fechaEvaluacion: '22-01-2026',
    estado: 'APTO',
    docType: 'Expediente DOCX / PDF',
    synced21Pages: true
  },
  {
    id: 'talexsio-guzman',
    nombres: 'ADDU ELIAS',
    apellidos: 'TALEXSIO GUZMAN',
    nombreCompleto: 'TALEXSIO GUZMAN ADDU ELIAS',
    dni: '74829103',
    club: 'Universitario de Deportes',
    categoria: 'Reserva / Primera',
    posicion: 'Delantero Extremo',
    mes: 'OCT',
    fechaEvaluacion: '07-10-2026',
    estado: 'APTO',
    docType: 'PDF Oficial FPF (21 Págs)',
    synced21Pages: true
  },
  {
    id: 'rodrigo-ceballos',
    nombres: 'RODRIGO ALONSO',
    apellidos: 'CEBALLOS HUAYTA',
    nombreCompleto: 'CEBALLOS HUAYTA RODRIGO ALONSO',
    dni: '70891234',
    club: 'Alianza Lima',
    categoria: 'Sub-20',
    posicion: 'Defensa Central',
    mes: 'ENE',
    fechaEvaluacion: '22-01-2026',
    estado: 'APTO',
    docType: 'Expediente FPF',
    synced21Pages: true
  },
  {
    id: 'mateo-quispe',
    nombres: 'MATEO SEBASTIAN',
    apellidos: 'QUISPE RAMOS',
    dni: '73948512',
    nombreCompleto: 'QUISPE RAMOS MATEO SEBASTIAN',
    club: 'Sporting Cristal',
    categoria: 'Sub-18',
    posicion: 'Lateral Izquierdo',
    mes: 'FEB',
    fechaEvaluacion: '14-02-2026',
    estado: 'APTO',
    docType: 'Expediente FPF',
    synced21Pages: true
  },
  {
    id: 'diego-valdivia',
    nombres: 'DIEGO ARMANDO',
    apellidos: 'VALDIVIA FLORES',
    dni: '71549832',
    nombreCompleto: 'VALDIVIA FLORES DIEGO ARMANDO',
    club: 'FBC Melgar',
    categoria: 'Primera División',
    posicion: 'Arquero',
    mes: 'FEB',
    fechaEvaluacion: '14-02-2026',
    estado: 'EN OBSERVACIÓN',
    docType: 'Pendiente Ecocardiograma',
    synced21Pages: true
  },
  {
    id: 'bryan-paredes',
    nombres: 'BRYAN JESUS',
    apellidos: 'PAREDES SALAS',
    dni: '75209384',
    nombreCompleto: 'PAREDES SALAS BRYAN JESUS',
    club: 'Cienciano del Cusco',
    categoria: 'Reserva',
    posicion: 'Delantero Centro',
    mes: 'MAR',
    fechaEvaluacion: '05-03-2026',
    estado: 'APTO',
    docType: 'Expediente FPF',
    synced21Pages: true
  },
  {
    id: 'joaquin-alvarez',
    nombres: 'JOAQUIN DANIEL',
    apellidos: 'ALVAREZ MONTIEL',
    dni: '76894012',
    nombreCompleto: 'ALVAREZ MONTIEL JOAQUIN DANIEL',
    club: 'Cusco F.C.',
    categoria: 'Primera División',
    posicion: 'Lateral Derecho',
    mes: 'ENE',
    fechaEvaluacion: '22-01-2026',
    estado: 'APTO',
    docType: 'Expediente FPF',
    synced21Pages: true
  },
  {
    id: 'alexander-pantoja',
    nombres: 'ALEXANDER',
    apellidos: 'PANTOJA CASTILLO',
    dni: '78291045',
    nombreCompleto: 'PANTOJA CASTILLO ALEXANDER',
    club: 'Carlos A. Mannucci',
    categoria: 'Sub-20',
    posicion: 'Mediocentro Defensivo',
    mes: 'ABR',
    fechaEvaluacion: '18-04-2026',
    estado: 'APTO',
    docType: 'Expediente FPF',
    synced21Pages: true
  }
];

export default function PoolManager({ 
  patientsList = [],
  setPatientsList,
  onSelectPatient,
  onSelectPatientId, 
  onNavigateTab, 
  currentPatient, 
  setCurrentPatient 
}) {
  const [pool, setPool] = useState(patientsList || []);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [nameFormatOrder, setNameFormatOrder] = useState('LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'
  const [globalDate, setGlobalDate] = useState('22-01-2026');
  const [isApplyingCascade, setIsApplyingCascade] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Normalizador automático de nombres
  const formatPlayerName = (apellidos, nombres, order) => {
    if (order === 'LAST_FIRST') {
      return `${apellidos.trim()} ${nombres.trim()}`.toUpperCase();
    }
    return `${nombres.trim()} ${apellidos.trim()}`.toUpperCase();
  };

  // Filtrado reactivo por Mes y Búsqueda
  const filteredList = useMemo(() => {
    return pool.filter(p => {
      const matchMonth = selectedMonth === 'ALL' || p.mes === selectedMonth;
      const q = searchQuery.toLowerCase();
      const matchQuery = 
        p.nombreCompleto.toLowerCase().includes(q) ||
        p.dni.toLowerCase().includes(q) ||
        p.club.toLowerCase().includes(q) ||
        p.posicion.toLowerCase().includes(q);
      return matchMonth && matchQuery;
    });
  }, [pool, selectedMonth, searchQuery]);

  // Aplicar fecha unificada en cascada a todos los jugadores seleccionados ("Sincronizar Lote")
  const handleApplyGlobalDate = () => {
    setIsApplyingCascade(true);
    setTimeout(() => {
      const updated = pool.map(player => {
        if (selectedMonth === 'ALL' || player.mes === selectedMonth) {
          return {
            ...player,
            fechaEvaluacion: globalDate,
            synced21Pages: true
          };
        }
        return player;
      });
      setPool(updated);
      if (setPatientsList) {
        setPatientsList(updated);
      }
      if (setCurrentPatient) {
        setCurrentPatient(prev => ({
          ...prev,
          fechaEvaluacion: globalDate
        }));
      }
      setIsApplyingCascade(false);
      setToastMessage({
        type: 'success',
        text: `¡Fecha unificada "${globalDate}" aplicada a todos los expedientes del lote! Las 21 páginas quedaron sincronizadas.`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 400);
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

  // Generar lote masivo de prueba para simular el pool de miles de jugadores
  const handleGenerateBatch = (count = 25) => {
    const clubs = ['Universitario', 'Alianza Lima', 'Sporting Cristal', 'FBC Melgar', 'Cienciano', 'Sport Boys', 'C.D. Zúñiga', 'Cusco FC'];
    const firstNames = ['RODRIGO', 'ALEXIS', 'SEBASTIAN', 'MATEO', 'DIEGO', 'JUAN', 'CHRISTIAN', 'LEONARDO', 'GONZALO', 'FABRICIO'];
    const lastNames = ['ZEVALLOS', 'PONCE', 'GUZMAN', 'MENDOZA', 'FLORES', 'QUISPE', 'RODRIGUEZ', 'PAREDES', 'CASTILLO', 'VARGAS'];
    const positions = ['Delantero', 'Volante', 'Defensa Central', 'Lateral', 'Arquero'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

    const newPlayers = [];
    for (let i = 0; i < count; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln1 = lastNames[Math.floor(Math.random() * lastNames.length)];
      const ln2 = lastNames[Math.floor(Math.random() * lastNames.length)];
      const ap = `${ln1} ${ln2}`;
      const club = clubs[Math.floor(Math.random() * clubs.length)];
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const mes = months[Math.floor(Math.random() * months.length)];
      const dni = (70000000 + Math.floor(Math.random() * 9999999)).toString();

      newPlayers.push({
        id: `gen-${Date.now()}-${i}`,
        nombres: fn,
        apellidos: ap,
        nombreCompleto: formatPlayerName(ap, fn, nameFormatOrder),
        dni: dni,
        club: club,
        categoria: 'Primera División / Reserva',
        posicion: pos,
        mes: mes,
        fechaEvaluacion: globalDate,
        estado: Math.random() > 0.15 ? 'APTO' : 'EN OBSERVACIÓN',
        docType: 'Expediente FPF (21 Págs)',
        synced21Pages: true
      });
    }

    setPool(prev => [...prev, ...newPlayers]);
    setToastMessage({
      type: 'success',
      text: `Se agregaron ${count} nuevos futbolistas al Pool. Total actual en memoria: ${pool.length + count}.`
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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* NOTIFICACIÓN FLOTANTE TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 max-w-md ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200' 
                : 'bg-blue-950/95 border-blue-500/80 text-blue-200'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-xs font-semibold leading-relaxed">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA PRINCIPAL: POOL 3,000 - 5,000 JUGADORES */}
      <section className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Database className="w-3 h-3" /> POOL DE 3,000 A 5,000 JUGADORES
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Formato Estandarizado FPF / CONMEBOL
              </span>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                Temporada Anual 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gestor de Pool Masivo & Rotación por Meses
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Resuelve el reemplazo manual en Word: estandariza el orden de nombres y apellidos, y sincroniza la fecha única en cascada en las 21 páginas para <strong className="text-white">"Sincronización unificada de fecha en lote"</strong> sin errores.
            </p>
          </div>

          {/* Métricas del Pool */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center space-x-6 shrink-0 shadow-inner">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Capacidad Pool</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {pool.length} <span className="text-xs text-slate-500 font-normal">/ 5,000</span>
              </div>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (pool.length / 5000) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rotación Activa</div>
              <div className="text-sm font-black text-emerald-400 mt-1">12 Meses</div>
              <div className="text-[10px] text-slate-500">Temporada 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLES DE ESTANDARIZACIÓN: NOMBRES Y FECHA EN CASCADA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL 1: ESTANDARIZADOR DE NOMBRES (Resuelve el audio del cliente) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Estandarizador de Nombres</h3>
                <p className="text-[11px] text-slate-400">Evita inversiones como "Rodrigo Ceballos" vs "Ceballos Rodrigo"</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
              Activo
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-slate-300">
              Selecciona la regla de nomenclatura obligatoria para todo el lote:
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleToggleNameFormat('LAST_FIRST')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  nameFormatOrder === 'LAST_FIRST'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase text-blue-400">Formato Oficial FPF</div>
                <div className="text-xs font-black mt-0.5">[APELLIDOS NOMBRES]</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">PONCE ECHEVARRIA CARLOS</div>
              </button>

              <button
                onClick={() => handleToggleNameFormat('FIRST_LAST')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  nameFormatOrder === 'FIRST_LAST'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase text-slate-400">Formato Directo</div>
                <div className="text-xs font-black mt-0.5">[NOMBRES APELLIDOS]</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">CARLOS PONCE ECHEVARRIA</div>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Garantiza que la búsqueda siempre encuentre al jugador tanto en la carátula como en los 21 reportes médicos.</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: FECHA ÚNICA EN CASCADA ("JALAR DE UNO SOLO") */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sincronizador de Fecha Única</h3>
                <p className="text-[11px] text-slate-400">Reemplaza el "Buscar y reemplazar" manual de Word</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded-full">
              21 Págs Sincronizadas
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={globalDate}
                  onChange={(e) => setGlobalDate(e.target.value)}
                  placeholder="DD-MM-YYYY (ej. 22-01-2026)"
                  className="bg-transparent text-sm font-mono font-bold text-white focus:outline-none w-full"
                />
              </div>

              <button
                onClick={handleApplyGlobalDate}
                disabled={isApplyingCascade}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isApplyingCascade ? 'animate-spin' : ''}`} />
                <span>Jalar Fecha a Lote</span>
              </button>
            </div>

            {/* Check de Cascada a los 21 Documentos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
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
                <div key={i} className="bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center space-x-1.5 text-[10px] text-slate-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{docName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROTACIÓN MENSUAL (ENERO A DICIEMBRE 2026) */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Rotación del Calendario Anual (12 Meses)
            </h2>
            <p className="text-xs text-slate-400">
              Distribuye los 3,000 a 5,000 jugadores en los meses que exige la Federación
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleGenerateBatch(20)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Cargar Lote (+20)</span>
            </button>
            <button
              onClick={() => handleGenerateBatch(100)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular Pool (+100)</span>
            </button>
          </div>
        </div>

        {/* Barra Deslizable de Meses */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
          {MONTHS.map(m => {
            const isSelected = selectedMonth === m.id;
            const countForMonth = m.id === 'ALL' 
              ? pool.length 
              : pool.filter(p => p.mes === m.id).length;

            return (
              <button
                key={m.id}
                onClick={() => setSelectedMonth(m.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center space-x-2 shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <span>{m.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-400'
                }`}>
                  {countForMonth}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* LISTADO DE FUTBOLISTAS DEL POOL CON PAGINACIÓN Y SELECCIÓN MÚLTIPLE */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
        
        {/* Barra de Filtros, Búsqueda y Selección en Lote */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Nombre, DNI, Club o Posición..."
              className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400">
              Total: <strong className="text-white">{filteredList.length}</strong> futbolistas
            </span>

            {/* Selector de Tamaño de Página */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>

            {/* Acción en Lote para Seleccionados */}
            {selectedIds.size > 0 && (
              <button
                onClick={async () => {
                  const selectedPatients = pool.filter(p => selectedIds.has(p.id || p.fileName));
                  try {
                    setToastMessage({
                      type: 'info',
                      text: `Compilando lote ZIP de ${selectedPatients.length} futbolistas seleccionados...`
                    });
                    await downloadBatchDocxZip(selectedPatients, { globalDate, globalClub: 'FPF' });
                    setToastMessage({
                      type: 'success',
                      text: `¡ZIP con ${selectedPatients.length} Words oficiales descargado exitosamente!`
                    });
                  } catch (e) {
                    setToastMessage({ type: 'error', text: e.message });
                  }
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Seleccionados ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabla Responsiva con Selección */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedList.length > 0 && selectedIds.size >= paginatedList.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 cursor-pointer"
                    title="Seleccionar todos los de esta página"
                  />
                </th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Futbolista</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Club / Categoría</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">DNI</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider">Fecha Evaluación</th>
                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-center">Estado FPF</th>
                <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="font-bold text-white text-sm">No hay futbolistas con los criterios actuales</span>
                      <span className="text-xs text-slate-500">Prueba ajustando la búsqueda o seleccionando otro mes de la temporada.</span>
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
                      className={`hover:bg-slate-900/60 transition group cursor-pointer ${
                        isSelected ? 'bg-blue-950/30' : ''
                      }`}
                      onClick={() => handleToggleSelectOne(pId)}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(pId)}
                          className="rounded border-slate-700 bg-slate-900 text-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.dotColor}`} />
                          <div className="font-bold text-white text-sm">
                            {player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-5">
                          Posición: {player.posicion || 'Campo'}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-200">{player.club || 'Club FPF'}</div>
                        <div className="text-[11px] text-slate-400">{player.categoria || 'Primera / Reserva'}</div>
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-300">
                        {player.dni || '70000000'}
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-blue-300">
                        {player.fechaEvaluacion || globalDate}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeBg} ${status.badgeBorder} ${status.badgeText}`}>
                          {status.shortLabel}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              if (onSelectPatient) onSelectPatient(player);
                              if (onNavigateTab) onNavigateTab('documento');
                            }}
                            className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[38px]"
                            title="Ver las 21 páginas del expediente"
                          >
                            <span>Ver 21P</span>
                          </button>

                          <button
                            onClick={() => downloadPatientDocx(player, { globalDate: player.fechaEvaluacion || globalDate, globalClub: player.club })}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2 rounded-xl transition cursor-pointer min-h-[38px]"
                            title="Descargar Word oficial con sellos médicos intactos"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-300" />
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
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong> ({filteredList.length} registros)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition cursor-pointer"
              >
                Anterior
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg font-bold transition cursor-pointer ${
                        currentPage === pNum ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
