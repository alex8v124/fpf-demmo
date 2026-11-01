import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck,
  Stethoscope,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { saveStaffToSupabase, deleteStaffFromSupabase } from '../utils/supabase';
import { fileToDataUrl } from './AttachmentSlots';

const EMPTY_STAFF_FORM = {
  id: '',
  nombres: '',
  apellidos: '',
  role: 'Médico Cardiólogo Evaluador',
  specialty: 'Cardiología Clínica y Deportiva',
  cmp: '',
  rne: '',
  ctmp: '',
  signatureImg: '/assets/sello-dario-hernandez-transparent.png',
  stampText: '',
  active: true
};

export default function MedicalStaff({
  staffList = [],
  setStaffList,
  activeDoctor,
  onSelectActiveDoctor
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_STAFF_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const signatureInputRef = useRef(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const enabledCount = (staffList || []).filter((s) => s.active !== false).length;

  const handleOpenCreate = () => {
    setFormData({ ...EMPTY_STAFF_FORM });
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    let nombres = staff.nombres || '';
    let apellidos = staff.apellidos || '';
    if (!nombres && !apellidos && staff.name) {
      const parts = staff.name.trim().split(/\s+/);
      nombres = parts.slice(0, 2).join(' ');
      apellidos = parts.slice(2).join(' ');
    }
    setFormData({
      id: staff.id || '',
      nombres,
      apellidos,
      role: staff.role || '',
      specialty: staff.specialty || '',
      cmp: staff.cmp || '',
      rne: staff.rne || '',
      ctmp: staff.ctmp || '',
      signatureImg: staff.signatureImg || '/assets/firma-cardiologo.jpeg',
      stampText: staff.stampText || '',
      active: staff.active !== false
    });
    setModalOpen(true);
  };

  const handleUploadSignature = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 900);
      setFormData((prev) => ({ ...prev, signatureImg: dataUrl }));
    } catch {
      showToast('error', 'No se pudo procesar la imagen de firma o sello.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombres.trim() && !formData.apellidos.trim()) {
      showToast('error', 'Ingresa al menos el nombre y apellido del profesional.');
      return;
    }

    setIsSaving(true);
    try {
      const fullName = `${formData.nombres.trim()} ${formData.apellidos.trim()}`.trim();
      const draft = {
        ...formData,
        name: fullName
      };

      const res = await saveStaffToSupabase(draft);
      if (res.success && res.data) {
        const saved = res.data;
        if (setStaffList) {
          setStaffList((prev) => {
            const list = prev || [];
            const exists = list.some((item) => item.id === saved.id);
            return exists
              ? list.map((item) => (item.id === saved.id ? saved : item))
              : [...list, saved];
          });
        }
        if (activeDoctor?.id === saved.id && onSelectActiveDoctor) {
          onSelectActiveDoctor(saved, false);
        }
        setModalOpen(false);
        showToast('success', `Datos de ${saved.name} guardados en producción.`);
      } else {
        showToast('error', res.error || 'Error al guardar en Supabase.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`¿Eliminar a ${staff.name} del directorio médico?`)) return;
    setDeletingId(staff.id);
    try {
      const res = await deleteStaffFromSupabase(staff.id);
      if (res.success) {
        if (setStaffList) {
          setStaffList((prev) => {
            const next = (prev || []).filter((item) => item.id !== staff.id);
            if (activeDoctor?.id === staff.id && onSelectActiveDoctor && next.length > 0) {
              onSelectActiveDoctor(next[0], false);
            }
            return next;
          });
        }
        showToast('success', `${staff.name} eliminado del directorio.`);
      } else {
        showToast('error', res.error || 'No se pudo eliminar el registro.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    'w-full bg-slate-50 focus:bg-white border border-[#CBD5E1] focus:border-[#0369A1] rounded-lg px-3 py-2 text-xs text-[#1E293B] placeholder:text-slate-400 focus:outline-none transition';

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Toast flotante */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center space-x-2 bg-white ${
              toast.type === 'error'
                ? 'border-rose-300 text-[#991B1B]'
                : 'border-emerald-300 text-[#166534]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera Institucional */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0369A1] uppercase tracking-wider">
            <span>Directorio Médico Oficial</span>
            <span>•</span>
            <span className="text-[#166534]">Colegiaturas Acreditadas FPF</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] mt-0.5">
            Profesionales de Salud y Firmas Digitalizadas
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl leading-relaxed">
            Administra los médicos certificadores, colegiaturas CMP/RNE y sellos registrados para la suscripción oficial de expedientes FPF y Famiheart S.A.C.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <span className="bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{enabledCount} Profesionales Habilitados</span>
          </span>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 bg-[#0369A1] hover:bg-[#075985] text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Profesional</span>
          </button>
        </div>
      </div>

      {/* Grilla de Profesionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(staffList || []).map((staff) => {
          const isCertifier = activeDoctor?.id === staff.id;
          const isEnabled = staff.active !== false;
          return (
            <div
              key={staff.id}
              className={`bg-white border rounded-lg p-5 shadow-xs transition space-y-3.5 flex flex-col justify-between ${
                isCertifier
                  ? 'border-[#0369A1] ring-1 ring-[#0369A1]/20'
                  : 'border-[#E2E8F0] hover:border-slate-300'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-sky-50 text-[#0369A1] border border-sky-200 flex items-center justify-center font-bold text-sm shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1E293B] truncate">{staff.name}</h3>
                      <div className="text-xs font-medium text-[#0369A1] truncate">{staff.role}</div>
                      <div className="text-[11px] text-[#64748B] truncate">{staff.specialty}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                        isEnabled
                          ? 'bg-[#DCFCE7] text-[#166534]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>{isEnabled ? 'Habilitado' : 'Inactivo'}</span>
                    </span>
                    {isCertifier && (
                      <span className="bg-sky-50 text-[#0369A1] text-[10px] font-bold px-2 py-0.5 rounded">
                        Certificador Activo
                      </span>
                    )}
                  </div>
                </div>

                {/* Registros Oficiales */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-md border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                      Colegiatura
                    </span>
                    <span className="text-[#1E293B] font-mono font-bold">
                      {staff.cmp ? `CMP ${staff.cmp}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                      Registro Especialidad
                    </span>
                    <span className="text-[#1E293B] font-mono font-bold">
                      {staff.rne
                        ? `RNE ${staff.rne}`
                        : staff.ctmp
                          ? `CTMP ${staff.ctmp}`
                          : '—'}
                    </span>
                  </div>
                </div>

                {/* Firma y Sello */}
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                    Firma y Sello Oficial Registrado
                  </span>
                  <div className="bg-slate-50/70 p-3 rounded-md border border-[#E2E8F0] flex items-center justify-between gap-3 min-h-[68px]">
                    {staff.signatureImg ? (
                      <img
                        src={staff.signatureImg}
                        alt={`Firma ${staff.name}`}
                        className="h-12 w-auto object-contain max-w-[150px]"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400">Sin imagen</span>
                    )}
                    <div className="text-right text-[10px] font-mono text-slate-700 whitespace-pre-line leading-tight">
                      {staff.stampText}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Acciones del Médico */}
              <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                {onSelectActiveDoctor && (
                  <button
                    type="button"
                    disabled={!isEnabled}
                    onClick={() => {
                      onSelectActiveDoctor(staff, true);
                      showToast(
                        'success',
                        `${staff.name} asignado como médico certificador del expediente actual.`
                      );
                    }}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                      isCertifier
                        ? 'bg-sky-50 text-[#0369A1] border border-sky-200'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-[#CBD5E1]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-[#0369A1]" />
                    <span>{isCertifier ? 'Aplicar al Paciente Actual' : 'Usar como Certificador'}</span>
                  </button>
                )}

                <div className="flex items-center space-x-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(staff)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-[#0369A1] border border-[#CBD5E1] text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === staff.id}
                    onClick={() => handleDelete(staff)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer disabled:opacity-40"
                    title="Eliminar profesional"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Creación / Edición de Médico */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setModalOpen(false)}
            />
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              className="relative z-10 w-full max-w-xl bg-white border border-[#CBD5E1] rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#1E293B]">
                    {formData.id ? 'Editar Profesional de Salud' : 'Registrar Nuevo Profesional'}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Los cambios se guardan directamente en la tabla personal_salud de Supabase
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título y Nombres
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData((p) => ({ ...p, nombres: e.target.value }))}
                    placeholder="Ej. Dr. Darío"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData((p) => ({ ...p, apellidos: e.target.value }))}
                    placeholder="Ej. Hernández Alarcón"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Rol Institucional
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Médico Cardiólogo Certificador"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData((p) => ({ ...p, specialty: e.target.value }))}
                    placeholder="Cardiología Clínica e Imagen Cardíaca"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Colegiatura CMP
                  </label>
                  <input
                    type="text"
                    value={formData.cmp}
                    onChange={(e) => setFormData((p) => ({ ...p, cmp: e.target.value }))}
                    placeholder="Ej. 27503"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      RNE (Médicos)
                    </label>
                    <input
                      type="text"
                      value={formData.rne}
                      onChange={(e) => setFormData((p) => ({ ...p, rne: e.target.value }))}
                      placeholder="Ej. 15620"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CTMP (Lab.)
                    </label>
                    <input
                      type="text"
                      value={formData.ctmp}
                      onChange={(e) => setFormData((p) => ({ ...p, ctmp: e.target.value }))}
                      placeholder="Opcional"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto del Sello Oficial
                </label>
                <textarea
                  rows={3}
                  value={formData.stampText}
                  onChange={(e) => setFormData((p) => ({ ...p, stampText: e.target.value }))}
                  placeholder={'DARIO HERNANDEZ ALARCON\nC.M.P 27503 RNE 15620\nCARDIOLOGIA'}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center bg-slate-50 p-3.5 rounded-lg border border-[#E2E8F0]">
                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700">
                    Firma / Sello Digitalizado
                  </span>
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSignature}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-[#0369A1] border border-[#CBD5E1] px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Imagen de Firma/Sello</span>
                  </button>
                </div>

                <div className="flex items-center justify-center bg-white border border-[#E2E8F0] rounded-md p-2 h-16">
                  {formData.signatureImg ? (
                    <img
                      src={formData.signatureImg}
                      alt="Vista previa de firma"
                      className="max-h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400">Sin imagen</span>
                  )}
                </div>
              </div>

              <label className="flex items-center space-x-2.5 text-xs font-semibold text-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                  className="rounded border-[#CBD5E1] text-[#0369A1] cursor-pointer"
                />
                <span>Profesional habilitado para suscribir certificados FPF</span>
              </label>

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#CBD5E1] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#0369A1] hover:bg-[#075985] shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Profesional'}</span>
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
