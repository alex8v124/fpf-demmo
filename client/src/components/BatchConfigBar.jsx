import React, { useState } from 'react';
import { 
  Calendar, 
  Building2, 
  ArrowLeftRight, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { downloadPatientDocx, downloadBatchDocxZip } from '../utils/docxGenerator';

const POPULAR_CLUBS = [
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
  'Los Chankas CYC'
];

export default function BatchConfigBar({
  globalDate,
  setGlobalDate,
  globalClub,
  setGlobalClub,
  nameOrder,
  setNameOrder,
  patientsList,
  setPatientsList,
  currentPatient,
  setCurrentPatient
}) {
  const [localDate, setLocalDate] = useState(globalDate || '22-01-2026');
  const [localClub, setLocalClub] = useState(globalClub || 'Club FPF / Liga Formativa');
  const [isApplyingDate, setIsApplyingDate] = useState(false);
  const [isApplyingClub, setIsApplyingClub] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Aplicar Fecha en cascada a todos los expedientes
  const handleApplyDateToAll = () => {
    if (!localDate.trim()) return;
    setIsApplyingDate(true);
    setGlobalDate(localDate);

    setTimeout(() => {
      const updatedList = (patientsList || []).map(p => ({
        ...p,
        fechaEvaluacion: localDate,
        synced21Pages: true
      }));

      setPatientsList(updatedList);
      if (currentPatient) {
        setCurrentPatient(prev => ({
          ...prev,
          fechaEvaluacion: localDate
        }));
      }

      setIsApplyingDate(false);
      showToast('success', `¡Fecha "${localDate}" aplicada a los ${updatedList.length} expedientes! Hojas 1, 2, 16, 20 y 21 actualizadas.`);
    }, 300);
  };

  // 2. Aplicar Nombre del Club en cascada a todos los expedientes
  const handleApplyClubToAll = () => {
    if (!localClub.trim()) return;
    setIsApplyingClub(true);
    setGlobalClub(localClub);

    setTimeout(() => {
      const updatedList = (patientsList || []).map(p => ({
        ...p,
        club: localClub
      }));

      setPatientsList(updatedList);
      if (currentPatient) {
        setCurrentPatient(prev => ({
          ...prev,
          club: localClub
        }));
      }

      setIsApplyingClub(false);
      showToast('success', `¡Club "${localClub}" asignado a todos los expedientes! Se imprimirá en las Hojas 1, 2 y anexos.`);
    }, 300);
  };

  // 3. Alternar orden de Nombres y Apellidos en todo el lote
  const handleToggleNameOrder = () => {
    const nextOrder = nameOrder === 'LAST_FIRST' ? 'FIRST_LAST' : 'LAST_FIRST';
    setNameOrder(nextOrder);

    const updatedList = (patientsList || []).map(p => {
      const ap = p.apellidos || '';
      const no = p.nombres || '';
      const formatted = nextOrder === 'LAST_FIRST'
        ? `${ap} ${no}`.trim().toUpperCase()
        : `${no} ${ap}`.trim().toUpperCase();

      return {
        ...p,
        nombreCompleto: formatted
      };
    });

    setPatientsList(updatedList);
    if (currentPatient) {
      const ap = currentPatient.apellidos || '';
      const no = currentPatient.nombres || '';
      setCurrentPatient(prev => ({
        ...prev,
        nombreCompleto: nextOrder === 'LAST_FIRST'
          ? `${ap} ${no}`.trim().toUpperCase()
          : `${no} ${ap}`.trim().toUpperCase()
      }));
    }

    showToast(
      'info', 
      `Orden de nombres cambiado a: ${nextOrder === 'LAST_FIRST' ? '[APELLIDOS NOMBRES]' : '[NOMBRES APELLIDOS]'} en todos los expedientes.`
    );
  };

  // 4. Descargar Word (.docx) individual conservando sellos
  const handleDownloadWordSingle = async () => {
    if (!currentPatient) return;
    setIsExportingWord(true);
    try {
      const fn = await downloadPatientDocx(currentPatient, {
        globalDate: localDate,
        globalClub: localClub
      });
      showToast('success', `Word generado exitosamente: "${fn}" (Sellos y firmas 100% intactos).`);
    } catch (e) {
      showToast('error', `Error al exportar Word: ${e.message}`);
    } finally {
      setIsExportingWord(false);
    }
  };

  // 5. Descargar Lote de Words en ZIP
  const handleDownloadBatchZip = async () => {
    if (!patientsList || patientsList.length === 0) {
      showToast('error', 'No hay expedientes en el listado para descargar el lote.');
      return;
    }
    setIsExportingWord(true);
    try {
      const res = await downloadBatchDocxZip(patientsList, {
        globalDate: localDate,
        globalClub: localClub
      });
      showToast('success', `¡ZIP generado con ${res.count} expedientes Word oficiales (.docx) con sellos médicos!`);
    } catch (e) {
      showToast('error', `Error al generar ZIP: ${e.message}`);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="relative mb-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center space-x-2 transition animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50' 
            : toast.type === 'error'
            ? 'bg-red-950 text-red-200 border-red-500/50'
            : 'bg-blue-950 text-blue-200 border-blue-500/50'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Bar Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                Configuración Masiva de Expedientes
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded-full font-bold">
                  En Lote FPF
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Aplica la fecha, el nombre del club y el formato de nombres a todos los Words y PDFs simultáneamente.
              </p>
            </div>
          </div>

          {/* Sellos Médicos Badge */}
          <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-700/60 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sellos Médicos Protegidos (Cardiólogo, Radiólogo, Tecnólogo)</span>
          </div>
        </div>

        {/* Form controls grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
          
          {/* 1. Control de Fecha Global */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Fecha Oficial Evaluación (Hoja 1, 2, 16, 20, 21)</span>
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={localDate}
                onChange={(e) => setLocalDate(e.target.value)}
                placeholder="DD-MM-AAAA (ej: 22-01-2026)"
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-400 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleApplyDateToAll}
                disabled={isApplyingDate}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                title="Aplicar esta fecha a todos los expedientes del lote"
              >
                {isApplyingDate ? '...' : 'Aplicar'}
              </button>
            </div>
          </div>

          {/* 2. Control de Nombre del Club */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Nombre del Club Deportivo (Hoja 1, 2 y Anexos)</span>
            </label>
            <div className="flex space-x-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  list="club-options-list"
                  value={localClub}
                  onChange={(e) => setLocalClub(e.target.value)}
                  placeholder="Escribe o elige el Club..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <datalist id="club-options-list">
                  {POPULAR_CLUBS.map((c, i) => (
                    <option key={i} value={c} />
                  ))}
                </datalist>
              </div>
              <button
                onClick={handleApplyClubToAll}
                disabled={isApplyingClub}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
                title="Inyectar este Club en la Hoja 1, 2 y demás hojas de todos los jugadores"
              >
                {isApplyingClub ? '...' : 'Aplicar'}
              </button>
            </div>
          </div>

          {/* 3. Toggle Orden de Nombres y Apellidos */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
              <span>Orden de Nombres</span>
            </label>
            <button
              onClick={handleToggleNameOrder}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5"
              title="Cambiar formato para todos los expedientes simultáneamente"
            >
              <span>{nameOrder === 'LAST_FIRST' ? '[APELLIDOS NOMBRES]' : '[NOMBRES APELLIDOS]'}</span>
              <RefreshCw className="w-3 h-3 text-purple-400" />
            </button>
          </div>

          {/* 4. Acciones de Descarga Word (.docx) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Word con Sellos</span>
            </label>
            <div className="flex space-x-1.5">
              <button
                onClick={handleDownloadWordSingle}
                disabled={isExportingWord || !currentPatient}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 shadow-md shadow-emerald-950/40 disabled:opacity-40"
                title="Descargar el Word .docx del jugador actual conservando sellos médicos y firmas"
              >
                <Download className="w-3 h-3" />
                <span>Word (.docx)</span>
              </button>

              <button
                onClick={handleDownloadBatchZip}
                disabled={isExportingWord || !patientsList || patientsList.length === 0}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-40"
                title="Generar y descargar un archivo ZIP con todos los Words oficiales del lote"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Lote ({patientsList?.length || 0})</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
