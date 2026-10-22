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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <span>Directorio Médico Oficial</span>
            <span>•</span>
            <span className="text-emerald-400">Colegiaturas Acreditadas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Profesionales de Salud y Firmas Digitales
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Personal médico autorizado para la suscripción de certificados de aptitud física FPF y reportes diagnósticos de Famiheart S.A.C.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold px-3.5 py-2 rounded-2xl flex items-center gap-1.5">
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
            whileHover={{ y: -3 }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-sm transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg shadow-inner">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{staff.name}</h3>
                  <div className="text-xs font-semibold text-blue-400">{staff.role}</div>
                  <div className="text-[11px] text-slate-400">{staff.specialty}</div>
                </div>
              </div>

              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Habilitado
              </span>
            </div>

            {/* Registration Codes */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Colegiatura Médica</span>
                <span className="text-slate-200 font-mono font-bold">CMP {staff.cmp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Especialidad</span>
                <span className="text-slate-200 font-mono font-bold">
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
