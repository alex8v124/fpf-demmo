import React, { useState } from 'react';
import { 
  Menu, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  Building2, 
  Stethoscope, 
  FileText,
  Search,
  Check,
  Lock,
  LogOut
} from 'lucide-react';

export default function Topbar({ 
  currentTab, 
  currentPatient, 
  patientsList = [], 
  onSelectPatient,
  onSelectPatientId,
  userRole = 'MEDICO', 
  setUserRole, 
  setMobileOpen 
}) {
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [playerFilter, setPlayerFilter] = useState('');

  // Breadcrumb dinámico
  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'dashboard':
        return [
          { label: 'Portal Clínico' },
          { label: 'Bandeja Principal' }
        ];
      case 'extractor':
        return [
          { label: 'Portal Clínico' },
          { label: 'Subir Archivos' }
        ];
      case 'pool':
        return [
          { label: 'Portal Clínico' },
          { label: 'Pool de Rotación', extra: `${patientsList.length} futbolistas` }
        ];
      case 'documento':
        return [
          { label: 'Expediente 21P' },
          { label: currentPatient?.nombreCompleto || 'Expediente Oficial' }
        ];
      case 'editor':
        return [
          { label: 'Ficha Clínica' },
          { label: currentPatient?.nombreCompleto || 'Edición' }
        ];
      case 'medicos':
        return [
          { label: 'Portal Clínico' },
          { label: 'Directorio Médico Evaluador' }
        ];
      case 'database':
        return [
          { label: 'Configuración' },
          { label: 'Base de Datos PostgreSQL' }
        ];
      default:
        return [
          { label: 'Portal Clínico' }
        ];
    }
  };

  const breadcrumbs = getBreadcrumbs();

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
    <header className="no-print h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
      
      {/* 1. Lado Izquierdo: Botón móvil + Breadcrumbs de Contexto + Badge de Entidad */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 truncate">
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500 truncate" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span className={`truncate ${idx === breadcrumbs.length - 1 ? 'font-bold text-[#1E293B]' : 'hover:text-slate-700'}`}>
                  {crumb.label}
                </span>
                {crumb.extra && (
                  <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                    {crumb.extra}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Badge de Entidad Institucional */}
          <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            Temporada Oficial FPF & CONMEBOL 2026
          </span>
        </div>
      </div>

      {/* 2. Lado Derecho: Estado de Sellos + Selector de Paciente Activo + Perfil del Médico Unificado */}
      <div className="flex items-center space-x-3 shrink-0">
        
        {/* Indicador de Estado: 29 Sellos Médicos Verificados (No botón, solo indicador compacto) */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] text-xs font-semibold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#15803D]" />
          <span>29 Sellos Verificados</span>
        </div>

        {/* Selector de Contexto de Paciente Activo con Etiqueta Explícita */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline shrink-0">
            Paciente activo:
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPatientDropdownOpen(!patientDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 hover:border-slate-400 text-xs text-[#1E293B] font-semibold transition cursor-pointer max-w-[170px] sm:max-w-[220px] shadow-2xs"
              title="Cambiar futbolista activo"
            >
              <User className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
              <span className="truncate text-left">
                {currentPatient?.nombreCompleto || 'Seleccionar Jugador'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
            </button>

            {patientDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setPatientDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-2 text-xs">
                  <div className="px-3 pb-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o DNI..."
                        value={playerFilter}
                        onChange={(e) => setPlayerFilter(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0284C7]"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {filteredPatients.slice(0, 30).map((p) => {
                      const isSelected = currentPatient?.id === p.id || currentPatient?.fileName === p.fileName;
                      return (
                        <button
                          key={p.id || p.fileName}
                          type="button"
                          onClick={() => {
                            if (onSelectPatient) onSelectPatient(p);
                            setPatientDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                            isSelected ? 'bg-sky-50 text-[#0284C7] font-semibold' : 'text-[#1E293B]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate text-xs">{p.nombreCompleto}</div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {p.club} • DNI {p.dni || 'S/D'}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />}
                        </button>
                      );
                    })}
                    {filteredPatients.length === 0 && (
                      <div className="px-3 py-4 text-center text-slate-400 text-xs">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Perfil del Médico Unificado con Avatar DH y Menú Directo */}
        <div className="relative border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setPatientDropdownOpen(false);
            }}
            className="flex items-center space-x-2.5 p-1 rounded-md hover:bg-slate-50 transition cursor-pointer"
            title="Perfil de Médico Evaluador"
          >
            <div className="w-8 h-8 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              DH
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#1E293B]">Dr. Darío Hernández</span>
              <span className="text-[10px] text-slate-500 font-mono">CMP 27503 • RNE 15620</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-xs">
                
                {/* Cabecera del perfil */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-[#1E293B]">Dr. Darío Hernández Alarcón</div>
                  <div className="text-[11px] text-[#64748B]">Médico Especialista en Cardiología Deportiva</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    Habilitado FPF • CMP 27503
                  </div>
                </div>

                {/* Selector de Rol Institucional */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cambiar Perfil de Acceso
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (setUserRole) setUserRole('MEDICO');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center justify-between text-xs cursor-pointer ${
                      userRole === 'MEDICO' ? 'bg-sky-50 text-[#0284C7] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>Médico Evaluador</span>
                    </div>
                    {userRole === 'MEDICO' && <Check className="w-3.5 h-3.5 text-[#0284C7]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (setUserRole) setUserRole('CLUB');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center justify-between text-xs cursor-pointer ${
                      userRole === 'CLUB' ? 'bg-amber-50 text-[#B45309] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>Delegado de Club</span>
                    </div>
                    {userRole === 'CLUB' && <Check className="w-3.5 h-3.5 text-[#B45309]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (setUserRole) setUserRole('FPF');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center justify-between text-xs cursor-pointer ${
                      userRole === 'FPF' ? 'bg-green-50 text-[#15803D] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Auditor FPF / CONMEBOL</span>
                    </div>
                    {userRole === 'FPF' && <Check className="w-3.5 h-3.5 text-[#15803D]" />}
                  </button>
                </div>

                {/* Pie de Seguridad */}
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <div className="px-3 py-1.5 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Sesión Segura (TLS 256-bit)</span>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

    </header>
  );
}
