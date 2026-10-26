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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#111A2E] border border-[#243350] rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
            <span>Directorio Médico Oficial</span>
            <span>•</span>
            <span className="text-[#22C55E]">Colegiaturas Acreditadas FPF</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF7] mt-1">
            Profesionales de Salud y Firmas Digitalizadas
          </h1>
          <p className="text-xs sm:text-sm text-[#9FB0C8] mt-1 max-w-2xl leading-relaxed">
            Personal médico acreditado para la suscripción de certificados de aptitud física FPF y reportes diagnósticos oficiales de Famiheart S.A.C.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            4 Profesionales Habilitados
          </span>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {initialStaff.map(staff => (
          <motion.div 
            key={staff.id} 
            whileHover={{ y: -2 }}
            className="bg-[#111A2E] border border-[#243350] hover:border-[#3B82F6]/50 rounded-2xl p-6 shadow-sm transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center font-bold text-lg">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#E6EDF7]">{staff.name}</h3>
                  <div className="text-xs font-semibold text-[#3B82F6]">{staff.role}</div>
                  <div className="text-xs text-[#9FB0C8]">{staff.specialty}</div>
                </div>
              </div>

              <span className="bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Habilitado
              </span>
            </div>

            {/* Registration Codes */}
            <div className="grid grid-cols-2 gap-3 bg-[#0B1220] p-3.5 rounded-xl border border-[#243350] text-xs">
              <div>
                <span className="text-[#9FB0C8] block text-[10px] uppercase font-bold">Colegiatura Médica</span>
                <span className="text-[#E6EDF7] font-mono font-bold">CMP {staff.cmp}</span>
              </div>
              <div>
                <span className="text-[#9FB0C8] block text-[10px] uppercase font-bold">Especialidad</span>
                <span className="text-[#E6EDF7] font-mono font-bold">
                  {staff.rne ? `RNE ${staff.rne}` : `CTMP ${staff.ctmp}`}
                </span>
              </div>
            </div>

            {/* Digital Signature & Stamp Preview */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Firma y Sello Oficial Registrado
              </span>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-300 flex items-center justify-between shadow-inner">
                <img 
                  src={staff.signatureImg} 
                  alt={`Firma ${staff.name}`} 
                  className="h-14 w-auto object-contain max-w-[180px]"
                />
                <div className="text-right text-[10px] font-mono text-slate-700 whitespace-pre-line leading-tight">
                  {staff.stampText}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
