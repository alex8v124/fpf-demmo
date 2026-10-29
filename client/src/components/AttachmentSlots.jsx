import React, { useRef } from 'react';
import { UploadCloud, RefreshCw, Trash2, ImageIcon } from 'lucide-react';

// Los 5 espacios de adjuntos por jugador. Todos los archivos suelen llevar el mismo nombre,
// por eso se elige explícitamente el espacio de destino dentro del expediente.
export const ATTACHMENT_SLOTS = [
  { id: 'eco2d', label: 'Eco 2D / Doppler', page: 'Pág. 15 (superior)' },
  { id: 'ecoMmode', label: 'Eco M-Mode / Flujos', page: 'Pág. 15 (inferior)' },
  { id: 'ecg', label: 'Electrocardiograma', page: 'Pág. 16' },
  { id: 'rayosX', label: 'Rayos X de Tórax', page: 'Pág. 20' },
  { id: 'laboratorio', label: 'Laboratorio', page: 'Pág. 17' }
];

// Reduce la imagen para no saturar la memoria del navegador.
function fileToDataUrl(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Slot({ slot, value, onChange, onRemove }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      onChange(slot.id, { url, name: file.name });
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <div className="border border-[#E2E8F0] rounded-lg bg-white p-2.5 flex flex-col gap-2">
      <div>
        <div className="text-xs font-semibold text-[#1E293B] leading-tight">{slot.label}</div>
        <div className="text-[10px] text-[#64748B]">{slot.page}</div>
      </div>

      <div className="h-24 rounded-md bg-slate-50 border border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden">
        {value ? (
          <img src={value.url} alt={slot.label} className="w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] mt-1">Sin archivo</span>
          </div>
        )}
      </div>

      {value && (
        <div className="text-[10px] text-[#64748B] truncate" title={value.name}>{value.name}</div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="flex-1 flex items-center justify-center gap-1 bg-[#0369A1] hover:bg-[#075985] text-white text-[11px] font-semibold px-2 py-1.5 rounded-md transition cursor-pointer"
        >
          {value ? <RefreshCw className="w-3 h-3" /> : <UploadCloud className="w-3 h-3" />}
          <span>{value ? 'Reemplazar' : 'Subir'}</span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onRemove(slot.id)}
            className="px-2 py-1.5 rounded-md border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-500 transition cursor-pointer"
            title="Quitar archivo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AttachmentSlots({ patient, onUpdatePatient, compact = false }) {
  const attachments = (patient && patient.attachments) || {};

  const handleChange = (slotId, value) => {
    onUpdatePatient(patient, { attachments: { ...attachments, [slotId]: value } });
  };

  const handleRemove = (slotId) => {
    const next = { ...attachments };
    delete next[slotId];
    onUpdatePatient(patient, { attachments: next });
  };

  const count = ATTACHMENT_SLOTS.filter((s) => attachments[s.id]).length;

  return (
    <div className={compact ? '' : 'no-print bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs'}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
          Archivos del expediente ({count}/5)
        </h3>
        <span className="text-[11px] text-[#64748B]">
          Elige el espacio de destino; usa “Reemplazar” si subiste uno por error.
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ATTACHMENT_SLOTS.map((slot) => (
          <Slot
            key={slot.id}
            slot={slot}
            value={attachments[slot.id]}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
