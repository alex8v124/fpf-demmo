import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  LayoutDashboard, 
  Users, 
  Printer, 
  ChevronDown, 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  FileSpreadsheet, 
  Database, 
  Sparkles, 
  Check,
  UploadCloud
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentPatient,
  patientsList = [],
  onSelectPatient,
  onSelectPatientId, 
  onResetBlank,
  onPrint
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Bandeja de Expedientes', icon: LayoutDashboard },
    { id: 'extractor', label: 'Subir Archivos', icon: UploadCloud, badge: 'Auto-Nombre', highlight: true },
    { id: 'pool', label: 'Pool & Rotación', icon: Users, badge: '5K Lotes' },
    { id: 'documento', label: 'Expediente FPF', icon: Printer, badge: '21 Págs' },
    { id: 'medicos', label: 'Directorio Médico', icon: Users },
    { id: 'database', label: 'Base de Datos', icon: Database, live: true }
  ];

  return (
    <header className="no-print sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3.5">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 bg-gradient-to-r from-slate-900 to-slate-850 p-2 pl-3 pr-3.5 rounded-2xl border border-slate-800 shadow-inner"
            >
              <img 
                src="/assets/famiheart-logo.png" 
                alt="Famiheart" 
                className="h-9 w-auto object-contain"
              />
              <div className="h-6 w-px bg-slate-750"></div>
              <img 
                src="/assets/fpf-logo.png" 
                alt="FPF" 
                className="h-8 w-auto object-contain"
              />
            </motion.div>

            <div className="hidden xl:block">
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Famiheart S.A.C.</span>
                <span className="text-slate-500">•</span>
                <span className="text-red-400 font-extrabold uppercase text-[10px]">FPF 2026</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Certificación Médica Pre-Competencia
              </div>
            </div>
          </div>

          {/* Central Floating Navigation Bar with Animated Indicator */}
          <nav className="hidden md:flex items-center p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Animated Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className={`absolute inset-0 rounded-xl shadow-md ${
                        item.highlight 
                          ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-950/50' 
                          : item.live
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-950/50'
                          : 'bg-blue-600 shadow-blue-950/50'
                      }`}
                    />
                  )}

                  <span className="relative z-10 flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.live && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Active Patient & Print Quick Action */}
          <div className="flex items-center space-x-3">
            
            {/* Patient Switcher Menu */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-700 rounded-2xl px-3 py-1.5 transition cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                  {currentPatient.nombreCompleto ? currentPatient.nombreCompleto.charAt(0) : 'P'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Jugador Activo</span>
                    {currentPatient.id === 'plantilla-en-blanco' && (
                      <span className="text-amber-400 font-bold">(Blanco)</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white max-w-[140px] truncate leading-tight">
                    {currentPatient.nombreCompleto || 'Plantilla en Blanco'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Dropdown Menu with Animation */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                        <span>Expediente Activo ({patientsList.length})</span>
                        <span className="text-emerald-400 font-mono text-[9px]">Drive / Subidos</span>
                      </div>

                      <div className="p-1 space-y-1 mt-1 max-h-72 overflow-y-auto">
                        {patientsList.slice(0, 6).map((p) => {
                          const isSelected = currentPatient?.id === p.id || currentPatient?.fileName === p.fileName;
                          return (
                            <button
                              key={p.id || p.fileName}
                              onClick={() => {
                                if (onSelectPatient) onSelectPatient(p);
                                else if (onSelectPatientId) onSelectPatientId(p.id);
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600/20 border border-blue-500/40 text-white' 
                                  : 'hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-blue-650 text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                                  {p.apellidos?.charAt(0) || p.nombres?.charAt(0) || 'P'}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">
                                    {p.nombreCompleto || `${p.apellidos} ${p.nombres}`}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {p.fileName || p.club || 'Expediente FPF'}
                                  </div>
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-blue-400 shrink-0 ml-1" />
                              ) : (
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                                  21P
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {patientsList.length === 0 && (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            No hay expedientes cargados aún.
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setCurrentTab('extractor');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-center py-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-950/40 hover:bg-emerald-900/40 rounded-xl transition cursor-pointer"
                        >
                          + {patientsList.length === 0 ? 'Subir Nuevos Archivos' : `Subir más archivos (${patientsList.length} cargados)`}
                        </button>

                        <div className="h-px bg-slate-800 my-1"></div>

                        {/* Plantilla en Blanco */}
                        <button
                          onClick={() => {
                            onResetBlank();
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2.5 transition cursor-pointer ${
                            currentPatient?.id === 'plantilla-en-blanco'
                              ? 'bg-amber-600/15 border border-amber-500/30 text-amber-300'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-300">Plantilla Oficial Limpia</div>
                            <div className="text-[10px] text-slate-400">21 páginas sin datos personales</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Print Primary Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPrint}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-red-950/40 border border-red-500/40 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir PDF</span>
            </motion.button>

          </div>

        </div>

        {/* Mobile Navigation Pills */}
        <div className="flex md:hidden items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
