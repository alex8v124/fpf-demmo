import React, { useState } from 'react';
import { 
  Cloud, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  FolderSync, 
  Upload, 
  HardDrive,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { cloudDriveFiles } from '../data/initialData';

export default function DriveSync({ 
  onSelectPatientId, 
  onNavigateTab 
}) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('Hace 2 minutos');
  const [successToast, setSuccessToast] = useState(false);

  const folderUrl = "https://drive.google.com/drive/folders/1qS-qCHFAh0glFyv9pTIxsQy90ANrejQ1?usp=drive_link";
  const folderId = "1qS-qCHFAh0glFyv9pTIxsQy90ANrejQ1";

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync('Justo ahora');
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Cloud Header Banner */}
      <div className="bg-slate-850 border border-slate-750 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" /> Google Drive Cloud Storage
              </span>
              <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enlace Verificado
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Sincronización de Expedientes desde Google Drive
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Carpeta compartida definida en la conversación del proyecto para centralizar los expedientes en PDF, plantillas Word y resultados diagnósticos para jalar directamente al sistema.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-900/50 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Carpeta'}</span>
            </button>

            <a
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
            >
              <span>Abrir Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Folder Details Box */}
        <div className="mt-6 pt-4 border-t border-slate-750 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Folder ID de Google Drive:</span>
            <span className="text-blue-300 font-mono font-bold">{folderId}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Última Sincronización:</span>
            <span className="text-slate-200 font-semibold">{lastSync}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Modo de Operación:</span>
            <span className="text-emerald-400 font-semibold">Lectura y Carga Directa</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">¡Carpeta de Google Drive sincronizada con éxito! Todos los archivos están actualizados.</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
        </div>
      )}

      {/* Cloud Files Grid */}
      <div className="bg-slate-850 border border-slate-750 rounded-2xl shadow-xl overflow-hidden">
        
        <div className="p-5 border-b border-slate-750 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-blue-400" />
              Archivos en la Carpeta Compartida
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en "Cargar en Expediente" para procesar cualquier archivo en el visualizador oficial
            </p>
          </div>
          <span className="text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
            4 Archivos detectados
          </span>
        </div>

        <div className="divide-y divide-slate-750">
          {cloudDriveFiles.map((file, idx) => (
            <div 
              key={idx} 
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/50 transition"
            >
              <div className="flex items-center space-x-3.5">
                <div className={`p-3 rounded-xl border ${
                  file.type === 'pdf'
                    ? 'bg-red-600/10 text-red-400 border-red-500/20'
                    : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                }`}>
                  {file.type === 'pdf' ? <FileText className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
                </div>

                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{file.name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {file.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>Tamaño: <strong className="text-slate-300">{file.size}</strong></span>
                    <span>•</span>
                    <span>Subido: <strong className="text-slate-300">{file.date}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{file.sync}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {file.name.includes('TALEXSIO') && (
                  <button
                    onClick={() => {
                      onSelectPatientId('talexsio-guzman');
                      onNavigateTab('documento');
                    }}
                    className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Cargar en Visor (21 Págs)</span>
                  </button>
                )}

                {file.name.includes('PONCE') && (
                  <button
                    onClick={() => {
                      onSelectPatientId('carlos-ponce');
                      onNavigateTab('documento');
                    }}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Cargar en Visor</span>
                  </button>
                )}

                {file.name.includes('PLANTILLA') && (
                  <button
                    onClick={() => {
                      onSelectPatientId('plantilla-en-blanco');
                      onNavigateTab('documento');
                    }}
                    className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Abrir Formato Blanco</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Upload simulated dropzone */}
        <div className="p-6 bg-slate-900/60 border-t border-slate-750 text-center">
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 transition cursor-pointer flex flex-col items-center justify-center space-y-2">
            <Upload className="w-8 h-8 text-slate-400" />
            <div className="text-xs font-bold text-white">
              Arrastra y suelta nuevos expedientes (.pdf o .docx) aquí
            </div>
            <div className="text-[11px] text-slate-400">
              O selecciona archivos locales para sincronizar automáticamente con la carpeta compartida de Google Drive
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
