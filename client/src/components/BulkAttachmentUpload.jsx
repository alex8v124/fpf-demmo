import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Layers, 
  RefreshCw, 
  FileText, 
  Download, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ATTACHMENT_SLOTS } from './AttachmentSlots';
import { anyFileToDataUrl } from '../utils/fileConverter';
import { extractLabDataFromFile } from '../utils/labExtractor';
import { parsePatientFromFileName, formatPlayerDisplayName } from '../utils/filenameParser';
import { savePatientToSupabase, setCachedAttachments } from '../utils/supabase';
import { downloadAndOpenPatientPdf } from '../utils/pdfGenerator';

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

  // 3. Subconjunto o coincidencia de nombres:
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

export default function BulkAttachmentUpload({ 
  patientsList = [], 
  setPatientsList,
  onUpdatePatient,
  onSelectPatient,
  globalDate = '22-01-2026',
  globalClub = 'Club FPF / Liga Formativa',
  nameOrder = 'LAST_FIRST'
}) {
  const [busySlot, setBusySlot] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [report, setReport] = useState(null);
  const inputs = useRef({});

  const handleFiles = async (slot, fileList) => {
    if (!fileList || fileList.length === 0) return;

    // Acepta cualquier formato: PDFs e imágenes (JPG, PNG, WebP, etc.)
    const isValidFile = (f) =>
      (f.type && (f.type.startsWith('image/') || f.type === 'application/pdf')) ||
      /\.(pdf|png|jpe?g|webp|bmp|gif)$/i.test(f.name);

    const files = Array.from(fileList).filter(isValidFile);
    if (files.length === 0) {
      window.alert('Por favor selecciona archivos válidos (PDFs o imágenes JPG, PNG, WebP).');
      return;
    }

    setBusySlot(slot.id);
    setProcessingStatus(`Procesando ${files.length} archivo(s) para ${slot.label}...`);

    const matched = [];
    const unmatched = [];
    let currentPatients = [...patientsList];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Procesando archivo (${i + 1}/${files.length}): ${file.name}...`);

      let player = findPlayer(file.name, currentPatients);
      let isNew = false;

      // Si no existe, autocrea el jugador desde el nombre del archivo igual que el extractor central
      if (!player) {
        const parsed = parsePatientFromFileName(file.name, file);
        if (parsed) {
          parsed.fechaEvaluacion = globalDate;
          parsed.club = globalClub;
          parsed.nombreCompleto = formatPlayerDisplayName(parsed.apellidos, parsed.nombres, nameOrder);
          player = parsed;
          isNew = true;
        }
      }

      if (!player) {
        unmatched.push(file.name);
        continue;
      }

      try {
        // 1. Convierte cualquier formato (PDF o Imagen) a Data URL de alta definición
        const url = await anyFileToDataUrl(file);
        let extractedLab = null;
        if (slot.id === 'laboratorio') {
          try {
            extractedLab = await extractLabDataFromFile(file);
          } catch (e) {
            console.warn('Extracción lab en lote:', e);
          }
        }

        const updatedAttachments = {
          ...(player.attachments || {}),
          [slot.id]: {
            url,
            name: file.name,
            type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
          }
        };

        const updatedPlayer = {
          ...player,
          attachments: updatedAttachments,
          ...(slot.id === 'ecg' ? { fileUrl: url, fileName: file.name } : {}),
          ...(extractedLab ? (() => {
            const { sodio, potasio, glucosaBasal, ...hemoRest } = extractedLab;
            const prevL = player.laboratorio || {};
            return {
              laboratorio: {
                ...prevL,
                hemograma: {
                  ...(prevL.hemograma || {}),
                  ...hemoRest
                },
                bioquimica: {
                  ...(prevL.bioquimica || {}),
                  ...(sodio ? { sodio } : {}),
                  ...(potasio ? { potasio } : {}),
                  ...(glucosaBasal ? { glucosaBasal } : {})
                }
              }
            };
          })() : {})
        };

        // 2. Registrar en estado local de React
        if (isNew) {
          currentPatients = [updatedPlayer, ...currentPatients];
          if (setPatientsList) {
            setPatientsList((prev) => [updatedPlayer, ...(prev || [])]);
          }
          if (onSelectPatient) {
            onSelectPatient(updatedPlayer);
          }
        } else {
          currentPatients = currentPatients.map((p) =>
            (p.id && p.id === player.id) || (p.fileName && p.fileName === player.fileName)
              ? updatedPlayer
              : p
          );
          if (onUpdatePatient) {
            onUpdatePatient(player, {
              attachments: updatedAttachments,
              ...(slot.id === 'ecg' ? { fileUrl: url, fileName: file.name } : {})
            });
          }
        }

        // 3. Persistir en almacenamiento local seguro
        setCachedAttachments(updatedPlayer.id || updatedPlayer.dni, updatedAttachments);

        // 4. Guardar inmediatamente en base de datos local (IndexedDB)
        await savePatientToSupabase(updatedPlayer);

        matched.push({
          player: updatedPlayer,
          fileName: file.name
        });
      } catch (err) {
        console.error('Error procesando archivo:', file.name, err);
        unmatched.push(file.name);
      }
    }

    setBusySlot(null);
    setProcessingStatus('');
    setReport({
      slot: slot.label,
      page: slot.page,
      matched,
      unmatched
    });
  };

  const handleDownloadSinglePdf = (player) => {
    if (onSelectPatient) onSelectPatient(player);
    if (onDownloadPdf) {
      onDownloadPdf(player);
    } else if (onPrint) {
      setTimeout(() => onPrint(player), 100);
    } else {
      window.print();
    }
  };

  const totalPatients = patientsList.length;
  const fullyAttached = patientsList.filter(
    (p) => p.attachments && Object.keys(p.attachments).length === ATTACHMENT_SLOTS.length
  ).length;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
      
      {/* Encabezado del módulo de los 5 espacios */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0369A1] bg-sky-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              5 Espacios de Estudios Médicos FPF
            </span>
            <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              {fullyAttached} de {totalPatients} expedientes con estudios completos
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Admite PDFs e Imágenes (JPG, PNG)
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#1E293B] mt-1">
            Carga de Archivos por Estudio Clínico
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-4xl">
            Haz clic o arrastra archivos (PDFs o imágenes) directamente a cualquiera de los 5 espacios. El sistema asocia automáticamente cada archivo al futbolista por nombre o DNI (creando al jugador si no existía), incrusta las imágenes en el expediente oficial y genera el PDF de 19 páginas de forma 100% local e instantánea.
          </p>
        </div>
      </div>

      {/* Indicador de proceso activo */}
      {processingStatus && (
        <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center space-x-2.5 text-xs text-[#0369A1] font-semibold animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#0369A1]" />
          <span>{processingStatus}</span>
        </div>
      )}

      {/* Grid interactivo de los 5 espacios de carga */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {ATTACHMENT_SLOTS.map((slot) => {
          const done = patientsList.filter((p) => p.attachments && p.attachments[slot.id]).length;
          const isFull = done > 0 && done === totalPatients;
          const isBusyThis = busySlot === slot.id;

          return (
            <div key={slot.id} className="relative">
              <input
                type="file"
                accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
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
                disabled={busySlot !== null}
                onClick={() => inputs.current[slot.id]?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFiles(slot, e.dataTransfer.files);
                }}
                className={`w-full border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center text-center transition cursor-pointer disabled:opacity-50 min-h-[145px] justify-between ${
                  isBusyThis
                    ? 'border-[#0369A1] bg-sky-50 ring-2 ring-[#0369A1]/30 shadow-md'
                    : isFull
                    ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                    : done > 0
                    ? 'border-sky-300 bg-sky-50/30 hover:bg-sky-50'
                    : 'border-slate-300 hover:border-[#0369A1] hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 ${
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
                  <span className="text-[10px] text-[#64748B] mt-0.5 font-medium">{slot.page}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">PDF • JPG • PNG</span>
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

      {/* Reporte de resultados de la última subida con descarga del PDF actualizado */}
      {report && (
        <div className="mt-4 text-xs border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#166534] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{report.slot} ({report.page}): {report.matched.length} archivo(s) procesados y asociados con éxito</span>
            </div>
            <button
              type="button"
              onClick={() => setReport(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {report.matched.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-semibold">
                  Futbolistas actualizados con este estudio:
                </span>
                {report.matched.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const players = report.matched.map(item => item.player);
                      if (onDownloadPdf) {
                        onDownloadPdf(players, false);
                      } else if (onPrint) {
                        onPrint(players);
                      } else {
                        window.print();
                      }
                    }}
                    className="text-[10px] font-bold text-[#0369A1] hover:underline cursor-pointer"
                    title="Descargar automáticamente cada PDF 1 a 1 de los futbolistas actualizados"
                  >
                    Descargar PDFs 1 a 1 ({report.matched.length})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {report.matched.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate" title={item.player.nombreCompleto}>
                        {item.player.nombreCompleto}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate" title={item.fileName}>
                        {item.fileName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadSinglePdf(item.player)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0369A1] hover:bg-[#075985] text-white text-[11px] font-bold shadow-2xs transition cursor-pointer shrink-0"
                      title="Descargar PDF y abrirlo automáticamente en nueva pestaña"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.unmatched.length > 0 && (
            <div className="text-[#991B1B] bg-rose-50 border border-rose-200 rounded-lg p-2 mt-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{report.unmatched.length} archivo(s) no se pudieron procesar:</span>
              </div>
              <div className="font-mono text-[10px] mt-1 break-words">
                {report.unmatched.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
