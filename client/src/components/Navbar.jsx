import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Printer, 
  ChevronDown, 
  ShieldCheck, 
  FileSpreadsheet, 
  Database, 
  Check,
  UploadCloud,
  FileCheck2,
  Stethoscope,
  Building2,
  Lock
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentPatient,
  patientsList = [],
  onSelectPatient,
  onSelectPatientId, 
  onResetBlank,
  onPrint,
  userRole = 'MEDICO',
  setUserRole
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Bandeja', icon: LayoutDashboard },
    { id: 'extractor', label: 'Subir Archivos', icon: UploadCloud },
    { id: 'pool', label: 'Pool Rotación', icon: Users },
    { id: 'documento', label: 'Expediente', icon: FileCheck2 },
    { id: 'medicos', label: 'Médicos', icon: Stethoscope },
    { id: 'database', label: 'Base de Datos', icon: Database }
  ];

  return (
    <header className="no-print sticky top-0 z-50 backdrop-blur-xl bg-[#0B1220]/95 border-b border-[#243350] shadow-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-[#111A2E] p-1.5 px-3 rounded-2xl border border-[#243350]">
              <img 
                src="/assets/famiheart-logo-clean.png" 
                alt="Famiheart" 
                className="h-8 sm:h-9 w-auto object-contain" 
              />
              <div className="h-5 w-px bg-[#243350]"></div>
              <img 
                src="/assets/fpf-logo.png" 
                alt="FPF" 
                className="h-7 sm:h-8 w-auto object-contain" 
              />
            </div>

            <div className="hidden md:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#E6EDF7] tracking-wide">FAMIHEART</span>
                <span className="text-[10px] bg-[#C8102E] text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-xs">
                  FPF 2026
                </span>
              </div>
              <div className="text-[11px] text-[#9FB0C8] font-normal mt-0.5">
                Certificación Médica Pre-Competencia
              </div>
            </div>
          </div>

          {/* Central Floating Navigation Bar - Single Line */}
          <nav className="hidden lg:flex items-center p-1 bg-[#111A2E] rounded-xl border border-[#243350] space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#9FB0C8] hover:text-[#E6EDF7] hover:bg-[#16213A]'
                  }`}
                >
                  {/* Animated Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-lg bg-[#3B82F6] shadow-md shadow-blue-950/40"
                    />
                  )}

                  <span className="relative z-10 flex items-center space-x-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Role Selector, Active Patient & Print Quick Action */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Selector de Rol Institucional */}
            <div className="relative hidden xl:block">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#111A2E] border border-[#243350] hover:border-[#3B82F6]/50 text-xs font-semibold text-[#E6EDF7] hover:bg-[#16213A] transition cursor-pointer min-h-[38px] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:outline-none"
                title="Cambiar perfil de acceso (Médico, Club o Auditor FPF)"
                aria-label="Selector de Rol de Usuario"
              >
                {userRole === 'MEDICO' && <Stethoscope className="w-3.5 h-3.5 text-[#3B82F6]" />}
                {userRole === 'CLUB' && <Building2 className="w-3.5 h-3.5 text-[#F59E0B]" />}
                {userRole === 'FPF' && <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />}
                <div className="text-left flex flex-col items-start leading-tight">
                  <span className="text-[9px] text-[#9FB0C8] font-bold uppercase">Perfil</span>
                  <span className="text-[11px] font-bold text-[#E6EDF7]">
                    {userRole === 'MEDICO' && 'Médico'}
                    {userRole === 'CLUB' && 'Club'}
                    {userRole === 'FPF' && 'Auditor'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-[#9FB0C8]" />
              </button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-64 bg-[#111A2E] border border-[#243350] rounded-2xl shadow-2xl p-2 z-50 text-xs"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold text-[#9FB0C8] uppercase tracking-wider border-b border-[#243350] mb-1">
                        Perfil de Usuario Activo
                      </div>
                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('MEDICO');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'MEDICO' ? 'bg-[#3B82F6]/20 text-[#3B82F6] font-bold' : 'hover:bg-[#16213A] text-[#E6EDF7]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-[#3B82F6] shrink-0" />
                          <div>
                            <div className="text-xs">Médico Evaluador</div>
                            <div className="text-[10px] text-[#9FB0C8]">Emisión y firma clínica</div>
                          </div>
                        </div>
                        {userRole === 'MEDICO' && <Check className="w-3.5 h-3.5 text-[#3B82F6]" />}
                      </button>

                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('CLUB');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'CLUB' ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold' : 'hover:bg-[#16213A] text-[#E6EDF7]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-[#F59E0B] shrink-0" />
                          <div>
                            <div className="text-xs">Delegado de Club</div>
                            <div className="text-[10px] text-[#9FB0C8]">Consulta y descargas</div>
                          </div>
                        </div>
                        {userRole === 'CLUB' && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                      </button>

                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('FPF');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'FPF' ? 'bg-[#22C55E]/20 text-[#22C55E] font-bold' : 'hover:bg-[#16213A] text-[#E6EDF7]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                          <div>
                            <div className="text-xs">Auditor FPF / CONMEBOL</div>
                            <div className="text-[10px] text-[#9FB0C8]">Validación reglamentaria</div>
                          </div>
                        </div>
                        {userRole === 'FPF' && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Patient Switcher Menu */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-[#111A2E] hover:bg-[#16213A] border border-[#243350] hover:border-[#3B82F6]/50 rounded-xl px-2.5 py-1.5 transition cursor-pointer shadow-sm min-h-[38px]"
              >
                <div className="w-7 h-7 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {currentPatient.nombreCompleto ? currentPatient.nombreCompleto.charAt(0) : 'P'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-[9px] font-bold text-[#9FB0C8] uppercase tracking-wider flex items-center gap-1 leading-none">
                    <span>Expediente</span>
                    {currentPatient.id === 'plantilla-en-blanco' && (
                      <span className="text-[#F59E0B] font-bold">(Blanco)</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#E6EDF7] max-w-[130px] truncate leading-tight mt-0.5">
                    {currentPatient.nombreCompleto || 'Plantilla en Blanco'}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#9FB0C8] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                      className="absolute right-0 mt-2 w-80 bg-[#111A2E] border border-[#243350] rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 text-[10px] font-bold text-[#9FB0C8] uppercase tracking-wider border-b border-[#243350] flex justify-between items-center">
                        <span>Expediente Activo ({patientsList.length})</span>
                        <span className="text-[#22C55E] font-mono text-[9px]">Oficial FPF</span>
                      </div>

                      <div className="p-1 space-y-1 mt-1 max-h-72 overflow-y-auto">
                        {patientsList.slice(0, 8).map((p) => {
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
                                  ? 'bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-white' 
                                  : 'hover:bg-[#16213A] text-[#E6EDF7]'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {p.apellidos?.charAt(0) || p.nombres?.charAt(0) || 'P'}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">
                                    {p.nombreCompleto || `${p.apellidos} ${p.nombres}`}
                                  </div>
                                  <div className="text-[10px] text-[#9FB0C8] truncate">
                                    {p.fileName || p.club || 'Expediente FPF'}
                                  </div>
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#3B82F6] shrink-0 ml-1" />
                              ) : (
                                <span className="text-[9px] bg-[#16213A] text-[#9FB0C8] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                                  21P
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {patientsList.length === 0 && (
                          <div className="p-3 text-center text-[#9FB0C8] text-xs">
                            No hay expedientes cargados aún.
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setCurrentTab('extractor');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-center py-2 text-xs text-[#3B82F6] hover:text-blue-400 font-semibold bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 rounded-xl transition cursor-pointer mt-1"
                        >
                          + {patientsList.length === 0 ? 'Subir Nuevos Archivos' : `Subir más archivos (${patientsList.length} cargados)`}
                        </button>

                        <div className="h-px bg-[#243350] my-1"></div>

                        {/* Plantilla en Blanco */}
                        <button
                          onClick={() => {
                            onResetBlank();
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2.5 transition cursor-pointer ${
                            currentPatient?.id === 'plantilla-en-blanco'
                              ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B]'
                              : 'hover:bg-[#16213A] text-[#E6EDF7]'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#F59E0B]">Plantilla Oficial Limpia</div>
                            <div className="text-[10px] text-[#9FB0C8]">21 páginas sin datos personales</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Print Primary Button - Único Primario en la barra */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPrint}
              className="flex items-center space-x-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md min-h-[38px] focus-visible:ring-2 focus-visible:ring-[#3B82F6] transition cursor-pointer shrink-0"
              title="Imprimir el expediente completo o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir PDF</span>
            </motion.button>

          </div>

        </div>

        {/* Responsive Mobile/Tablet Navigation Pills */}
        <div className="flex lg:hidden items-center space-x-1.5 py-2 overflow-x-auto border-t border-[#243350] no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'text-[#9FB0C8] hover:text-[#E6EDF7] hover:bg-[#16213A] bg-[#111A2E] border border-[#243350]'
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
