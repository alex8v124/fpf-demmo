import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  FileCheck2, 
  Stethoscope, 
  Database, 
  ShieldCheck, 
  Lock,
  X,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  mobileOpen = false, 
  setMobileOpen,
  userRole = 'MEDICO'
}) {
  const navItems = [
    { id: 'dashboard', label: 'Bandeja Principal', icon: LayoutDashboard },
    { id: 'extractor', label: 'Subir Archivos', icon: UploadCloud },
    { id: 'pool', label: 'Pool de Rotación', icon: Users },
    { id: 'documento', label: 'Expediente (21 Págs)', icon: FileCheck2 },
    { id: 'medicos', label: 'Directorio Médico', icon: Stethoscope },
    { id: 'database', label: 'Base de Datos', icon: Database }
  ];

  const handleSelectNav = (tabId) => {
    setCurrentTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 border-r border-slate-800 select-none">
      
      {/* 1. Header con Logos Institucionales */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img 
              src="/assets/famiheart-logo-clean.png" 
              alt="Famiheart" 
              className="h-7 w-auto object-contain brightness-110" 
            />
            <span className="h-5 w-px bg-slate-700"></span>
            <img 
              src="/assets/fpf-logo.png" 
              alt="FPF" 
              className="h-7 w-auto object-contain" 
            />
          </div>

          {/* Botón de cierre para móvil */}
          {setMobileOpen && (
            <button 
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-wide">FAMIHEART</span>
            <span className="text-[10px] bg-[#B91C1C] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              FPF 2026
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Certificación Médica Pre-Competencia
          </div>
        </div>
      </div>

      {/* 2. Menú de Navegación Vertical */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Clínicos
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-[#0284C7]/20 text-[#38BDF8] border-l-4 border-[#0284C7] font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8]" />}
            </button>
          );
        })}
      </nav>

      {/* 3. Perfil de Médico Evaluador y Seguridad */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
        <div className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0284C7]/20 text-[#38BDF8] flex items-center justify-center font-bold text-xs shrink-0 border border-[#0284C7]/30">
              DH
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                Dr. Darío Hernández A.
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                CMP 27503 • RNE 15620
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Cardiología Deportiva</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              Acreditado
            </span>
          </div>
        </div>

        {/* Indicador discreto de seguridad */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>TLS 256-bit • Ley 29733</span>
          </div>
          <span className="font-mono text-[9px] text-slate-400">v1.2.6</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Sidebar fijo en escritorio */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        {sidebarContent}
      </aside>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F172A] z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
