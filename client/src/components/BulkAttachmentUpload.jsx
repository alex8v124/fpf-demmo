import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { ATTACHMENT_SLOTS, fileToDataUrl } from './AttachmentSlots';

const normalize = (s) =>
  (s || '')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Compara por conjunto de palabras para tolerar "APELLIDOS NOMBRES" o "NOMBRES APELLIDOS".
const tokenKey = (s) => normalize(s).split(' ').filter(Boolean).sort().join(' ');

function findPlayer(fileName, patientsList) {
  const key = tokenKey(fileName);
  if (!key) return null;
  return (
    patientsList.find(
      (p) => tokenKey(p.nombreCompleto || `${p.apellidos || ''} ${p.nombres || ''}`) === key
    ) || null
  );
}

export default function BulkAttachmentUpload({ patientsList = [], onUpdatePatient }) {
  const [busy, setBusy] = useState(null);
  const [report, setReport] = useState(null);
  const inputs = useRef({});

  const handleFiles = async (slot, fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
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
        matched.push(player.nombreCompleto);
      } catch {
        unmatched.push(file.name);
      }
    }
    setBusy(null);
    setReport({ slot: slot.label, matched, unmatched });
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
          Carga masiva de adjuntos
        </h3>
        <p className="text-[11px] text-[#64748B] mt-0.5">
          Elige el espacio y suelta todas las imágenes de ese tipo. Cada archivo se asigna al jugador cuyo
          nombre coincide con el nombre del archivo (ej. <span className="font-mono">BARAYBAR COLLANTES FABIANO.jpg</span>).
          Si vuelves a cargar un espacio, reemplaza la imagen anterior.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ATTACHMENT_SLOTS.map((slot) => {
          const done = patientsList.filter((p) => p.attachments && p.attachments[slot.id]).length;
          return (
            <div key={slot.id}>
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
                className="w-full border-2 border-dashed border-slate-300 hover:border-[#0369A1] hover:bg-slate-50 rounded-lg p-3 flex flex-col items-center text-center transition cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-5 h-5 text-[#0369A1] mb-1" />
                <span className="text-xs font-semibold text-[#1E293B] leading-tight">{slot.label}</span>
                <span className="text-[10px] text-[#64748B]">{slot.page}</span>
                <span className="text-[10px] font-semibold text-[#166534] mt-1">
                  {busy === slot.id ? 'Procesando...' : `${done}/${patientsList.length} jugadores`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {report && (
        <div className="mt-3 text-[11px] border border-[#E2E8F0] rounded-md p-2.5 bg-slate-50 space-y-1">
          <div className="flex items-center gap-1.5 text-[#166534] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {report.slot}: {report.matched.length} asignados
          </div>
          {report.unmatched.length > 0 && (
            <div className="text-[#991B1B]">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {report.unmatched.length} sin jugador coincidente:
              </div>
              <div className="font-mono break-words">{report.unmatched.join(', ')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
