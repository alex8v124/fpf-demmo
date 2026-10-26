import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  FileCheck2, 
  Stethoscope, 
  Database, 
  X,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  mobileOpen = false, 
  setMobileOpen
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
      
      {/* 1. Cabecera Institucional Blanca Edge-to-Edge (Full-Bleed 64px, alineado con Topbar) */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <img 
            src="/assets/famiheart-logo-clean.png" 
            alt="Famiheart" 
            className="h-7 sm:h-8 w-auto object-contain max-w-[130px]" 
          />
          <span className="h-6 w-px bg-slate-200 shrink-0"></span>
          <img 
            src="/assets/fpf-logo.png" 
            alt="FPF" 
            className="h-7 sm:h-8 w-auto object-contain shrink-0" 
          />
        </div>

        {/* Botón de cierre para móvil */}
        {setMobileOpen && (
          <button 
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-800 p-1.5 rounded-md cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Subtítulo institucional sobre fondo oscuro */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 tracking-wider uppercase">
            Sistema Oficial
          </span>
          <span className="text-[10px] bg-[#B91C1C] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            FPF 2026
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          Certificación Médica Pre-Competencia
        </div>
      </div>

      {/* 2. Menú de Navegación Vertical Limpio */}
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
                  ? 'bg-[#0369A1]/25 text-[#38BDF8] border-l-4 border-[#0369A1] font-semibold shadow-xs'
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

      {/* 3. Cierre Inferior Discreto del Sidebar (Sin duplicidad técnica ni perfil repetido) */}
      <div className="p-3 border-t border-slate-800/80 text-center">
        <div className="text-[10px] text-slate-400 font-medium">
          Sistema Oficial FPF • CONMEBOL 2026
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
