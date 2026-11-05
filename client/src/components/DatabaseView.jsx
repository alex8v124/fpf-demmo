import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  Trash2,
  FileCheck2,
  Users,
  Check,
  Cpu
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  loadPatientsFromSupabase,
  saveBatchPatientsToSupabase,
  loadStaffFromSupabase,
  exportLocalDatabaseBackup,
  importLocalDatabaseBackup,
  clearAllLocalPatients
} from '../utils/supabase';
import drivePatients from '../data/drivePatients.json';

export default function DatabaseView() {
  const [connStatus, setConnStatus] = useState({
    loading: true,
    connected: true,
    latencyMs: 0,
    status: 'Almacenamiento Local (IndexedDB Activo)'
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [localPatients, setLocalPatients] = useState([]);
  const [localStaff, setLocalStaff] = useState([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    setConnStatus(prev => ({ ...prev, loading: true }));
    const conn = await testSupabaseConnection();
    const patientsRes = await loadPatientsFromSupabase();
    const staffRes = await loadStaffFromSupabase();

    if (patientsRes.success && patientsRes.data) {
      setLocalPatients(patientsRes.data);
    }
    if (staffRes.success && staffRes.data) {
      setLocalStaff(staffRes.data);
    }

    setConnStatus({
      loading: false,
      connected: true,
      latencyMs: 0,
      status: 'Almacenamiento Local (IndexedDB Activo)'
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportBackup = async () => {
    try {
      await exportLocalDatabaseBackup();
      setSyncMessage({
        type: 'success',
        text: `Copia de seguridad exportada correctamente con ${localPatients.length} expedientes y ${localStaff.length} profesionales de salud.`
      });
    } catch (err) {
      setSyncMessage({
        type: 'warning',
        text: `Error al exportar copia de seguridad: ${err.message}`
      });
    }
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncing(true);
    setSyncMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const res = await importLocalDatabaseBackup(text);
        if (res.success) {
          setSyncMessage({
            type: 'success',
            text: `¡Restauración exitosa! Se importaron ${res.patientsCount} expedientes y ${res.staffCount} médicos.`
          });
          await loadData();
        } else {
          setSyncMessage({
            type: 'warning',
            text: `Error al importar: ${res.error}`
          });
        }
      } catch (err) {
        setSyncMessage({
          type: 'error',
          text: `Archivo de respaldo no válido: ${err.message}`
        });
      } finally {
        setSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDrive = async () => {
    if (!window.confirm('¿Deseas recargar la plantilla inicial de expedientes del Drive? Se conservarán los datos existentes.')) return;
    setSyncing(true);
    try {
      const res = await saveBatchPatientsToSupabase(drivePatients);
      if (res.success) {
        setSyncMessage({
          type: 'success',
          text: `¡Plantilla inicial de ${drivePatients.length} expedientes cargada en la base local!`
        });
        await loadData();
      }
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: `Error al cargar plantilla: ${err.message}`
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('¿Seguro que deseas vaciar la base de datos local de pacientes? Recuerda exportar una copia de seguridad primero si deseas conservarlos.')) return;
    await clearAllLocalPatients();
    setSyncMessage({
      type: 'warning',
      text: 'Se han eliminado los expedientes locales. Puedes importar un respaldo o recargar la plantilla en cualquier momento.'
    });
    await loadData();
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Input oculto para importación de backups */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".json" 
        className="hidden" 
      />

      {/* Banner Superior Institucional */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-[#DCFCE7] text-[#166534] text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> Base de Datos Local (IndexedDB)
              </span>
              <span className="bg-sky-50 text-[#0369A1] text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> 0 ms Latencia • 100% Offline
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">
              Gestión de Datos Local & Respaldos
            </h2>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              El sistema opera de forma 100% local en tu navegador. Tus expedientes médicos, imágenes de alta resolución (ECG, Doppler, Rayos X) y firmas no viajan a servidores externos, garantizando máxima velocidad, sin caídas de red y estricto cumplimiento de la Ley N° 29733 de Protección de Datos Personales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center space-x-1.5 bg-[#0369A1] hover:bg-[#075985] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-xs"
              title="Descargar una copia de seguridad en formato JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Copia (.json)</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerImport}
              disabled={syncing}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-xs"
              title="Restaurar una copia de seguridad previamente exportada"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Importar Copia</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={connStatus.loading}
              className="p-2 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] rounded-lg transition cursor-pointer"
              title="Actualizar estado local"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${connStatus.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Parámetros de Estado Local */}
        <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#64748B] block font-medium">Motor de Almacenamiento:</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[#1E293B] font-bold">IndexedDB del Navegador</span>
            </div>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Latencia de Operación:</span>
            <span className="text-[#166534] font-mono font-bold mt-0.5 block">0 ms (Instantáneo)</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Capacidad Disponible:</span>
            <span className="text-[#0369A1] font-mono font-bold mt-0.5 block">Ilimitada (&gt; 500 MB)</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Protección de Datos:</span>
            <span className="text-[#166534] font-bold text-xs truncate block mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" /> Ley N° 29733 (Local)
            </span>
          </div>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <div className={`p-3 rounded-lg border text-xs flex items-start space-x-2.5 ${
          syncMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-[#166534]'
            : syncMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-[#92400E]'
            : 'bg-red-50 border-red-200 text-[#B91C1C]'
        }`}>
          {syncMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed font-medium">
            {syncMessage.text}
          </div>
        </div>
      )}

      {/* Resumen de Expedientes y Personal en Memoria Local */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Tarjeta Expedientes */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0369A1]" />
              Expedientes en Local ({localPatients.length})
            </h3>
            <span className="text-[10px] bg-sky-50 text-[#0369A1] font-bold px-2 py-0.5 rounded">
              Persistencia Activa
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Expedientes de futbolistas guardados en la base local con sus 5 estudios clínicos e historial de evaluación.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {localPatients.length > 0 ? (
              localPatients.map(p => (
                <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-[#1E293B] truncate">{p.nombreCompleto || p.id}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {p.club || 'Club FPF'} • DNI: {p.dni || 'S/D'} • {p.fechaEvaluacion || '22-01-2026'}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {p.adjuntos ? `${Object.keys(p.adjuntos).length}/5 est.` : 'Listo'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No hay expedientes locales almacenados.
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetToDrive}
              disabled={syncing}
              className="text-xs font-bold text-[#0369A1] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Recargar Plantilla Inicial (Drive)
            </button>
            <button
              type="button"
              onClick={handleClearDatabase}
              className="text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vaciar Expedientes
            </button>
          </div>
        </div>

        {/* Tarjeta Personal Médico */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#15803D]" />
              Personal Médico ({localStaff.length})
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Firmas & Sellos
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Médicos evaluadores, cardiólogos y radiólogos configurados con sus sellos y credenciales CMP/RNE.
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {localStaff.map(s => (
              <div key={s.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-[#1E293B] truncate">{s.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {s.role} • CMP: {s.cmp} {s.rne ? `• RNE: ${s.rne}` : ''}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-[#0369A1]">
                  Acreditado
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Gestiona o añade más profesionales en la pestaña <strong>"Cuerpo Médico"</strong>.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
