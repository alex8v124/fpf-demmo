import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileCheck, Layers, RefreshCw } from 'lucide-react';
import { ATTACHMENT_SLOTS, fileToDataUrl } from './AttachmentSlots';

const NOISE_WORDS = new Set([
  '2D', '3D', 'MM', 'ECO', 'ECOGRAFIA', 'ECG', 'EKG', 'ELECTRO', 'ELECTROCARDIOGRAMA',
  'RX', 'RAYOS', 'TORAX', 'LAB', 'LABORATORIO', 'HEMOGRAMA', 'SANGRE', 'ANALISIS',
  'FPF', 'COPIA', 'SCAN', 'IMG', 'FOTO', 'PACIENTE', 'DOPPLER', 'FLUJOS', 'MODO',
  'MMODE', 'PAG', 'FINAL', 'OFICIAL', 'INFORME', 'ESTUDIO', 'RESULTADO', 'CERTIFICADO'
]);

const cleanString = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function getPlayerName(p) {
  return cleanString(p?.nombreCompleto || `${p?.apellidos || ''} ${p?.nombres || ''}`);
}

export function findPlayer(fileName, patientsList = []) {
  if (!fileName || !patientsList || patientsList.length === 0) return null;
  const rawBase = fileName.replace(/\.[^.]+$/, '');
  const cleaned = cleanString(rawBase);

  // 1. Intento por DNI de 8 dígitos en el nombre del archivo
  const dniMatch = cleaned.match(/\b\d{8}\b/);
  if (dniMatch) {
    const foundByDni = patientsList.find((p) => p.dni && p.dni.trim() === dniMatch[0]);
    if (foundByDni) return foundByDni;
  }

  // 2. Coincidencia exacta de conjunto de palabras (ignorando palabras de ruido de estudios)
  const allTokens = cleaned.split(' ').filter(Boolean);
  const nameTokens = allTokens.filter((t) => !NOISE_WORDS.has(t) && !/^\d+$/.test(t));
  const fileKey = [...nameTokens].sort().join(' ');

  if (fileKey) {
    const exact = patientsList.find((p) => {
      const pTokens = getPlayerName(p).split(' ').filter(Boolean).sort().join(' ');
      return pTokens === fileKey;
    });
    if (exact) return exact;
  }

  // 3. Subconjunto o coincidencia parcial de nombres:
  // Si los tokens del archivo coinciden con al menos 2 palabras clave del jugador
  if (nameTokens.length >= 2) {
    let bestPlayer = null;
    let maxMatches = 0;

    for (const player of patientsList) {
      const pName = getPlayerName(player);
      const pTokens = new Set(pName.split(' ').filter(Boolean));
      let matches = 0;
      for (const t of nameTokens) {
        if (pTokens.has(t)) matches++;
      }
      if (matches >= 2 && matches > maxMatches) {
        maxMatches = matches;
        bestPlayer = player;
      }
    }

    if (bestPlayer && maxMatches >= Math.min(2, nameTokens.length)) {
      return bestPlayer;
    }
  }

  return null;
}

export default function BulkAttachmentUpload({ patientsList = [], onUpdatePatient }) {
  const [busy, setBusy] = useState(null);
  const [report, setReport] = useState(null);
  const inputs = useRef({});

  const handleFiles = async (slot, fileList) => {
    const isImage = (f) => (f.type && f.type.startsWith('image/')) || /\.(png|jpe?g|webp|bmp|gif)$/i.test(f.name);
    const files = Array.from(fileList || []).filter(isImage);
    if (files.length === 0) {
      window.alert('No se detectaron imágenes válidas (JPG, PNG, WebP) en la selección.');
      return;
    }

    setBusy(slot.id);
    const matched = [];
    const unmatched = [];

    for (const file of files) {
      const player = findPlayer(file.name, patientsList);
      if (!player) {
        unmatched.push(file.name);
        continue;
      }
      try {
        const url = await fileToDataUrl(file);
        onUpdatePatient(player, {
          attachments: { ...(player.attachments || {}), [slot.id]: { url, name: file.name } }
        });
        matched.push(player.nombreCompleto || `${player.apellidos || ''} ${player.nombres || ''}`);
      } catch {
        unmatched.push(file.name);
      }
    }

    setBusy(null);
    setReport({ slot: slot.label, matched, unmatched });
  };

  const totalPatients = patientsList.length;
  const fullyAttached = patientsList.filter(
    (p) => p.attachments && Object.keys(p.attachments).length === ATTACHMENT_SLOTS.length
  ).length;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
      
      {/* Encabezado del módulo de carga masiva */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0369A1] bg-sky-50 px-2 py-0.5 rounded">
              5 Estudios de Soporte Clínico
            </span>
            <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              {fullyAttached} de {totalPatients} expedientes completos
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#1E293B] mt-1">
            Carga Masiva de Archivos por Estudio (5 Espacios)
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-3xl">
            Haz clic o arrastra un lote de imágenes a cualquiera de los 5 espacios. El sistema asocia automáticamente cada imagen al jugador por coincidencia de nombre o DNI. Si vuelves a subir un archivo para el mismo espacio, reemplazará la imagen anterior.
          </p>
        </div>
      </div>

      {/* Grid de las 5 opciones de carga */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {ATTACHMENT_SLOTS.map((slot) => {
          const done = patientsList.filter((p) => p.attachments && p.attachments[slot.id]).length;
          const isFull = done > 0 && done === totalPatients;
          const isBusyThis = busy === slot.id;

          return (
            <div key={slot.id} className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={(el) => (inputs.current[slot.id] = el)}
                onChange={(e) => {
                  handleFiles(slot, e.target.files);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => inputs.current[slot.id]?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(slot, e.dataTransfer.files);
                }}
                className={`w-full border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center text-center transition cursor-pointer disabled:opacity-50 min-h-[135px] justify-between ${
                  isBusyThis
                    ? 'border-[#0369A1] bg-sky-50 ring-2 ring-[#0369A1]/30'
                    : isFull
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                    : done > 0
                    ? 'border-sky-300 bg-sky-50/30 hover:bg-sky-50'
                    : 'border-slate-300 hover:border-[#0369A1] hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                    isFull ? 'bg-emerald-100 text-[#166534]' : 'bg-sky-100 text-[#0369A1]'
                  }`}>
                    {isBusyThis ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0369A1]" />
                    ) : isFull ? (
                      <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#1E293B] leading-tight">{slot.label}</span>
                  <span className="text-[10px] text-[#64748B] mt-0.5">{slot.page}</span>
                </div>

                <div className="w-full mt-2 pt-2 border-t border-slate-200/60">
                  <span className={`text-[11px] font-semibold block ${
                    isFull ? 'text-[#166534]' : done > 0 ? 'text-[#0369A1]' : 'text-slate-500'
                  }`}>
                    {isBusyThis ? 'Procesando...' : `${done} / ${totalPatients} vinculados`}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Reporte de resultados de la última subida */}
      {report && (
        <div className="mt-3.5 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#166534] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{report.slot}: {report.matched.length} imágenes asignadas correctamente</span>
            </div>
            <button
              type="button"
              onClick={() => setReport(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {report.unmatched.length > 0 && (
            <div className="text-[#991B1B] bg-rose-50 border border-rose-200 rounded-lg p-2 mt-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{report.unmatched.length} archivos no coincidieron con ningún jugador en la lista:</span>
              </div>
              <div className="font-mono text-[10px] mt-1 break-words max-h-20 overflow-y-auto">
                {report.unmatched.join(', ')}
              </div>
              <p className="text-[10px] text-slate-600 mt-1">
                Tip: Asegúrate de que el nombre del archivo contenga los apellidos del jugador o su DNI de 8 dígitos.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
