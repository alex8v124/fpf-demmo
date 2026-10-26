import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Award, 
  FileCheck, 
  Stethoscope, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { initialStaff } from '../data/initialData';

export default function MedicalStaff() {
  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Header Banner */}
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
            Personal médico acreditado para la suscripción de certificados de aptitud física FPF y reportes diagnósticos oficiales de Famiheart S.A.C.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            4 Profesionales Habilitados
          </span>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialStaff.map(staff => (
          <div 
            key={staff.id} 
            className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-lg p-5 shadow-xs transition space-y-3.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-sky-50 text-[#0369A1] border border-sky-200 flex items-center justify-center font-bold text-sm shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">{staff.name}</h3>
                  <div className="text-xs font-medium text-[#0369A1]">{staff.role}</div>
                  <div className="text-[11px] text-[#64748B]">{staff.specialty}</div>
                </div>
              </div>

              <span className="bg-[#DCFCE7] text-[#166534] text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Habilitado
              </span>
            </div>

            {/* Registration Codes */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded-md border border-[#E2E8F0] text-xs">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Colegiatura Médica</span>
                <span className="text-[#1E293B] font-mono font-bold">CMP {staff.cmp}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Especialidad</span>
                <span className="text-[#1E293B] font-mono font-bold">
                  {staff.rne ? `RNE ${staff.rne}` : `CTMP ${staff.ctmp}`}
                </span>
              </div>
            </div>

            {/* Digital Signature & Stamp Preview */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1.5">
                Firma y Sello Oficial Registrado
              </span>
              <div className="bg-slate-50/70 p-3 rounded-md border border-[#E2E8F0] flex items-center justify-between">
                <img 
                  src={staff.signatureImg} 
                  alt={`Firma ${staff.name}`} 
                  className="h-12 w-auto object-contain max-w-[160px]"
                />
                <div className="text-right text-[10px] font-mono text-slate-700 whitespace-pre-line leading-tight">
                  {staff.stampText}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
