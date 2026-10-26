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
  const [isCollapsed, setIsCollapsed] = useState(true); // Colapsado por defecto según auditoría
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
        globalClub: localClub,
        nameOrder: nameOrder
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
        globalClub: localClub,
        nameOrder: nameOrder
      });
      showToast('success', `¡ZIP generado con ${res.count} expedientes Word oficiales (.docx) con sellos médicos!`);
    } catch (e) {
      showToast('error', `Error al generar ZIP: ${e.message}`);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="relative mb-5 select-none">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-md shadow-lg border text-xs font-semibold flex items-center space-x-2 transition ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-300'
            : 'bg-sky-50 text-sky-800 border-sky-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Bar Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 sm:p-4 shadow-xs space-y-3">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-sky-50 text-[#0284C7] border border-sky-200 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Configuración Masiva de Expedientes
                </h3>
                <span className="text-[10px] bg-sky-50 text-[#0284C7] border border-sky-200 px-1.5 py-0.2 rounded font-bold">
                  Lote FPF
                </span>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-[11px] text-[#0284C7] hover:underline font-semibold px-2 py-0.5 rounded bg-slate-50 border border-[#CBD5E1] transition cursor-pointer"
                >
                  {isCollapsed ? 'Mostrar Controles ▾' : 'Ocultar Controles ▴'}
                </button>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {isCollapsed 
                  ? `Fecha: ${globalDate} • Club: ${globalClub} • Formato: ${nameOrder === 'LAST_FIRST' ? '[APELLIDOS NOMBRES]' : '[NOMBRES APELLIDOS]'}`
                  : 'Aplica fecha unificada, club deportivo y formato a los Words y PDFs simultáneamente.'
                }
              </p>
            </div>
          </div>

          {/* Sellos Médicos Badge */}
          <div className="flex items-center space-x-1.5 bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#15803D]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>29 Sellos Médicos Protegidos</span>
          </div>
        </div>

        {/* Form controls grid (Condicional al colapso) */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
            
            {/* 1. Control de Fecha Global */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Fecha Oficial Evaluación</span>
              </label>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={localDate}
                  onChange={(e) => setLocalDate(e.target.value)}
                  placeholder="DD-MM-AAAA (ej: 22-01-2026)"
                  className="flex-1 bg-slate-50 border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-[#1E293B] placeholder-slate-400 focus:outline-none focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  onClick={handleApplyDateToAll}
                  disabled={isApplyingDate}
                  className="bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Aplicar fecha al lote de expedientes"
                >
                  {isApplyingDate ? '...' : 'Aplicar'}
                </button>
              </div>
            </div>

            {/* 2. Control de Nombre del Club */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Nombre del Club Deportivo</span>
              </label>
              <div className="flex space-x-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    list="club-options-list"
                    value={localClub}
                    onChange={(e) => setLocalClub(e.target.value)}
                    placeholder="Escribe o elige el Club..."
                    className="w-full bg-slate-50 border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#1E293B] placeholder-slate-400 focus:outline-none focus:border-[#0284C7]"
                  />
                  <datalist id="club-options-list">
                    {POPULAR_CLUBS.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  onClick={handleApplyClubToAll}
                  disabled={isApplyingClub}
                  className="bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer shrink-0 disabled:opacity-50"
                  title="Inyectar este Club en todos los jugadores"
                >
                  {isApplyingClub ? '...' : 'Aplicar'}
                </button>
              </div>
            </div>

            {/* 3. Toggle Orden de Nombres y Apellidos */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Orden de Nombres</span>
              </label>
              <button
                type="button"
                onClick={handleToggleNameOrder}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] text-[#1E293B] text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center justify-between"
                title="Cambiar formato para todos los expedientes simultáneamente"
              >
                <span className="text-[11px] truncate">{nameOrder === 'LAST_FIRST' ? '[APELLIDOS NOMBRES]' : '[NOMBRES APELLIDOS]'}</span>
                <RefreshCw className="w-3 h-3 text-[#0284C7] shrink-0" />
              </button>
            </div>

            {/* 4. Acciones de Descarga Word (.docx) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Exportar Word con Sellos</span>
              </label>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={handleDownloadWordSingle}
                  disabled={isExportingWord || !currentPatient}
                  className="flex-1 bg-white hover:bg-slate-50 border border-[#CBD5E1] text-slate-700 text-xs font-medium px-2 py-1.5 rounded-md transition cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-40"
                  title="Descargar el Word .docx del jugador actual conservando sellos médicos y firmas"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBatchZip}
                  disabled={isExportingWord || !patientsList || patientsList.length === 0}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs disabled:opacity-40"
                  title="Generar y descargar un archivo ZIP con todos los Words oficiales del lote"
                >
                  <Download className="w-3 h-3" />
                  <span>Lote ({patientsList?.length || 0})</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
