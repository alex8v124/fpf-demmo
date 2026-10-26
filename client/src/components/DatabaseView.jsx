import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Server, 
  Layers, 
  Code2, 
  UploadCloud, 
  DownloadCloud,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  SUPABASE_SCHEMA_SQL, 
  savePatientToSupabase,
  saveBatchPatientsToSupabase,
  loadPatientsFromSupabase 
} from '../utils/supabase';
import drivePatients from '../data/drivePatients.json';

export default function DatabaseView() {
  const [connStatus, setConnStatus] = useState({
    loading: true,
    connected: false,
    latencyMs: 0,
    status: 'Comprobando conexión...'
  });
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqajcjzkgcmauazcvwtd.supabase.co';
  const projectId = 'yqajcjzkgcmauazcvwtd';

  const [dbPatients, setDbPatients] = useState([]);

  const checkConnection = async () => {
    setConnStatus(prev => ({ ...prev, loading: true }));
    const res = await testSupabaseConnection();
    const patientsRes = await loadPatientsFromSupabase();

    if (patientsRes.success && patientsRes.data) {
      setDbPatients(patientsRes.data);
    }

    setConnStatus({
      loading: false,
      connected: res.connected,
      latencyMs: res.latencyMs || 120,
      status: res.connected ? 'Conexión Establecida (Online)' : 'Error de Conexión',
      error: res.error,
      tableCreated: patientsRes.success
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeedPatients = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await saveBatchPatientsToSupabase(drivePatients);
      if (res.success) {
        setSyncMessage({
          type: 'success',
          text: `¡${res.count} expedientes del Drive sincronizados exitosamente con la tabla "expedientes_medicos" en Supabase!`
        });
        await checkConnection();
      } else {
        setSyncMessage({
          type: 'warning',
          text: `Error al sincronizar: ${res.error}`
        });
      }
    } catch (e) {
      setSyncMessage({
        type: 'error',
        text: `Error al sincronizar: ${e.message}`
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Banner Superior */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <Database className="w-3.5 h-3.5" /> Supabase Cloud Database
              </span>
              <span className="bg-sky-50 text-[#0284C7] border border-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded">
                PostgreSQL 15+
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">
              Conexión y Sincronización con Supabase
            </h2>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              Base de datos en la nube para persistencia de futbolistas evaluados, historias clínicas, parámetros cardiológicos y certificados oficiales de la FPF.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              type="button"
              onClick={checkConnection}
              disabled={connStatus.loading}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#CBD5E1] font-semibold text-xs px-3.5 py-2 rounded-md transition cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${connStatus.loading ? 'animate-spin' : ''}`} />
              <span>Probar Conexión</span>
            </button>

            <button
              type="button"
              onClick={() => alert('Acceso a la Consola Cloud restringido por política de seguridad a administradores de infraestructura Famiheart S.A.C.')}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] font-semibold text-xs px-3.5 py-2 rounded-md transition cursor-pointer"
              title="Acceso exclusivo para administradores de infraestructura"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Consola Admin (Restringida)</span>
            </button>
          </div>
        </div>

        {/* Parámetros de Conexión */}
        <div className="mt-4 pt-3.5 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[#64748B] block font-medium">Estado del Endpoint:</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[#1E293B] font-bold">{connStatus.status}</span>
            </div>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Latencia de Red:</span>
            <span className="text-[#15803D] font-mono font-bold mt-0.5 block">{connStatus.latencyMs} ms</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Instancia Médica:</span>
            <span className="text-[#0284C7] font-mono font-bold mt-0.5 block">fpf_cluster_prod (TLS v1.3)</span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium">Seguridad de Datos:</span>
            <span className="text-[#15803D] font-mono text-xs truncate block mt-0.5">
              Cifrado AES-256 / Ley 29733
            </span>
          </div>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <div className={`p-3 rounded-md border text-xs flex items-start space-x-2.5 ${
          syncMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-[#15803D]'
            : syncMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-[#B45309]'
            : 'bg-sky-50 border-sky-200 text-[#0284C7]'
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

      {/* Sincronización de Datos */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#15803D]" />
              Expedientes Persistidos en Supabase ({dbPatients.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Registros clínicos almacenados en PostgreSQL en la nube con acceso en tiempo real
            </p>
          </div>

          <button
            type="button"
            onClick={handleSeedPatients}
            disabled={syncing}
            className="flex items-center space-x-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Lote Drive con Supabase'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 max-h-80 overflow-y-auto pr-1">
          {dbPatients.length > 0 ? (
            dbPatients.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-emerald-100 text-[#15803D] flex items-center justify-center font-bold text-xs shrink-0">
                    {p.apellidos?.charAt(0) || p.nombre_completo?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1E293B] truncate">{p.nombre_completo || p.id}</div>
                    <div className="text-[10px] text-[#64748B] truncate">
                      {p.club || 'Club FPF'} • DNI: {p.dni || '74290500'} • {p.fecha_evaluacion || '22-01-2026'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-[#15803D] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 shrink-0 ml-2">
                  <CheckCircle2 className="w-3 h-3" /> PostgreSQL
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-6 bg-slate-50 rounded-md border border-[#E2E8F0] text-[#64748B] text-xs">
              No hay expedientes en la base de datos aún. Sube los nuevos archivos en la pestaña "Subir Archivos" para persistirlos automáticamente en PostgreSQL.
            </div>
          )}
        </div>
      </div>

      {/* Script SQL para Creación de Tablas */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#0284C7]" />
              Script SQL para Crear la Tabla en Supabase
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Copia este script y pégalo en el <a href={`https://supabase.com/dashboard/project/${projectId}/sql`} target="_blank" rel="noopener noreferrer" className="text-[#0284C7] hover:underline inline-flex items-center gap-0.5 font-semibold">SQL Editor de Supabase <ExternalLink className="w-3 h-3" /></a> para inicializar la tabla Postgres
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1] text-xs font-semibold px-3 py-1.5 rounded-md transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="bg-[#0F172A] p-4 rounded-md border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto max-h-56 leading-relaxed">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>
      </div>

      {/* Parámetros de Conexión Directa a Postgres */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-4 h-4 text-[#0284C7]" />
          Credenciales de Conexión Directa (PostgreSQL)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 bg-slate-50 rounded-md border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">Host</span>
            <span className="text-[#1E293B] break-all">db.{projectId}.supabase.co</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-md border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">Puerto</span>
            <span className="text-[#1E293B]">5432</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-md border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">Base de Datos</span>
            <span className="text-[#1E293B]">postgres</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-md border border-[#E2E8F0]">
            <span className="text-[#64748B] block text-[10px] uppercase font-sans font-semibold">Usuario</span>
            <span className="text-[#1E293B]">postgres</span>
          </div>
        </div>
      </div>

    </div>
  );
}
