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
  Lock,
  User,
  Search
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
  const [playerFilter, setPlayerFilter] = useState('');

  const navItems = [
    { id: 'dashboard', label: 'Bandeja', icon: LayoutDashboard },
    { id: 'extractor', label: 'Subir Archivos', icon: UploadCloud },
    { id: 'pool', label: 'Pool Rotación', icon: Users },
    { id: 'documento', label: 'Expediente', icon: FileCheck2 },
    { id: 'medicos', label: 'Médicos', icon: Stethoscope }
  ];

  const filteredPatients = (patientsList || []).filter(p => {
    if (!playerFilter.trim()) return true;
    const q = playerFilter.toLowerCase();
    return (
      p.nombreCompleto?.toLowerCase().includes(q) ||
      p.dni?.includes(q) ||
      p.club?.toLowerCase().includes(q)
    );
  });

  return (
    <header className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs select-none">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* 1. Logo & Identidad Institucional */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-50 p-1 px-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <img 
                src="/assets/famiheart-logo-clean.png" 
                alt="Famiheart" 
                className="h-7 sm:h-8 w-auto object-contain" 
              />
              <div className="h-4 w-px bg-slate-300"></div>
              <img 
                src="/assets/fpf-logo.png" 
                alt="FPF" 
                className="h-6 sm:h-7 w-auto object-contain" 
              />
            </div>

            <div className="hidden 2xl:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1E293B] tracking-wide">FAMIHEART</span>
                <span className="text-[10px] bg-[#C8102E] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-2xs">
                  FPF 2026
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-normal">
                Certificación Médica Pre-Competencia
              </div>
            </div>
          </div>

          {/* 2. Barra de Navegación Horizontal Central */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 space-x-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-2 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {/* Píldora activa con animación suave */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-lg bg-[#0369A1]"
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

          {/* 3. Acciones Derecha: Sellos, Paciente Activo, Perfil Médico e Imprimir */}
          <div className="flex items-center space-x-1.5 xl:space-x-2.5 shrink-0">
            
            {/* Selector de Contexto de Paciente Activo */}
            <div className="relative">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-500 font-medium hidden 2xl:inline shrink-0">
                  Paciente activo:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(!dropdownOpen);
                    setRoleDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 transition cursor-pointer shadow-2xs min-h-[38px] max-w-[130px] sm:max-w-[170px] 2xl:max-w-[220px]"
                  title="Cambiar futbolista o expediente activo"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0369A1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {currentPatient?.apellidos ? currentPatient.apellidos.charAt(0) : (currentPatient?.nombreCompleto ? currentPatient.nombreCompleto.charAt(0) : 'P')}
                  </div>
                  <div className="text-left hidden sm:block min-w-0 max-w-[100px] sm:max-w-[140px] 2xl:max-w-[180px]">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 leading-none">
                      <span>Expediente</span>
                      {currentPatient?.id === 'plantilla-en-blanco' && (
                        <span className="text-amber-600 font-bold">(Blanco)</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate leading-tight mt-0.5">
                      {currentPatient?.nombreCompleto || 'Plantilla Oficial'}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-auto ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Menú Desplegable de Selección de Paciente con Buscador */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex justify-between items-center">
                        <span>Expedientes ({patientsList.length})</span>
                        <span className="text-emerald-700 font-mono text-[9px] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Oficial FPF</span>
                      </div>

                      {/* Buscador de Jugadores */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o club..."
                            value={playerFilter}
                            onChange={(e) => setPlayerFilter(e.target.value)}
                            className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0369A1] focus:ring-1 focus:ring-[#0369A1]"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5 max-h-64 overflow-y-auto">
                        {filteredPatients.slice(0, 30).map((p) => {
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
                                  ? 'bg-sky-50 text-[#0369A1] font-semibold' 
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {p.apellidos?.charAt(0) || p.nombres?.charAt(0) || 'P'}
                                </div>
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs truncate font-medium">
                                    {p.nombreCompleto || `${p.apellidos} ${p.nombres}`}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate">
                                    {p.club || 'Club FPF'} • DNI {p.dni || 'S/D'}
                                  </div>
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#0369A1] shrink-0 ml-1" />
                              ) : (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono shrink-0 ml-1">
                                  21P
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {filteredPatients.length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            No se encontraron futbolistas con ese criterio
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1 space-y-1">
                        <button
                          onClick={() => {
                            setCurrentTab('extractor');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-center py-1.5 text-xs text-[#0369A1] hover:text-[#075985] font-semibold bg-sky-50 hover:bg-sky-100 rounded-xl transition cursor-pointer"
                        >
                          + Subir más archivos ({patientsList.length} cargados)
                        </button>

                        {/* Plantilla en Blanco */}
                        <button
                          onClick={() => {
                            if (onResetBlank) onResetBlank();
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center space-x-2.5 transition cursor-pointer ${
                            currentPatient?.id === 'plantilla-en-blanco'
                              ? 'bg-amber-50 text-amber-800'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-900">Plantilla Oficial Limpia</div>
                            <div className="text-[10px] text-slate-500">21 páginas sin datos personales</div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Selector de Rol Institucional & Perfil Médico */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setRoleDropdownOpen(!roleDropdownOpen);
                  setDropdownOpen(false);
                }}
                className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer min-h-[38px] border border-transparent hover:border-slate-200"
                title="Perfil y permisos de usuario activo"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0369A1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  DH
                </div>
                <div className="hidden 2xl:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-slate-800">Dr. Darío Hernández</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {userRole === 'MEDICO' && 'CMP 27503 • Médico'}
                    {userRole === 'CLUB' && 'Delegado Club'}
                    {userRole === 'FPF' && 'Auditor FPF'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden 2xl:block" />
              </button>

              <AnimatePresence>
                {roleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                        Perfil de Usuario Activo
                      </div>
                      
                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('MEDICO');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'MEDICO' ? 'bg-sky-50 text-[#0369A1] font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="w-4 h-4 text-[#0369A1] shrink-0" />
                          <div>
                            <div className="text-xs">Médico Evaluador</div>
                            <div className="text-[10px] text-slate-500 font-normal">Dr. Darío Hernández • CMP 27503</div>
                          </div>
                        </div>
                        {userRole === 'MEDICO' && <Check className="w-3.5 h-3.5 text-[#0369A1]" />}
                      </button>

                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('CLUB');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'CLUB' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <div className="text-xs">Delegado de Club</div>
                            <div className="text-[10px] text-slate-500 font-normal">Consulta y descargas</div>
                          </div>
                        </div>
                        {userRole === 'CLUB' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>

                      <button
                        onClick={() => {
                          if (setUserRole) setUserRole('FPF');
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                          userRole === 'FPF' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs">Auditor FPF / CONMEBOL</div>
                            <div className="text-[10px] text-slate-500 font-normal">Validación reglamentaria</div>
                          </div>
                        </div>
                        {userRole === 'FPF' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Botón Principal de Acción: Imprimir PDF */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPrint}
              className="flex items-center space-x-1.5 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs px-3 sm:px-3.5 py-2 rounded-xl shadow-xs min-h-[38px] transition cursor-pointer shrink-0 whitespace-nowrap"
              title="Imprimir el expediente completo o guardar como PDF oficial"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="inline font-bold">Imprimir PDF</span>
            </motion.button>

          </div>

        </div>

        {/* Barra de Navegación Móvil / Tablet (Desplazable horizontalmente) */}
        <div className="flex lg:hidden items-center space-x-1.5 py-2 overflow-x-auto border-t border-slate-200 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0369A1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
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
