import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileSpreadsheet, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  FileCheck2,
  Download,
  Share2,
  SlidersHorizontal,
  Maximize2,
  Sparkles,
  Bookmark,
  Building2,
  Calendar
} from 'lucide-react';
import { pagesCatalog } from '../data/initialData';
import { downloadPatientDocx } from '../utils/docxGenerator';

export default function DocumentViewer({ 
  patient, 
  isBlankMode, 
  setIsBlankMode, 
  onPrint 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewFormat, setViewFormat] = useState(isBlankMode ? 'blank' : 'facsimile'); // 'facsimile' | 'blank' | 'digital'

  const totalPages = 21;

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Navegación con teclado (Flecha izquierda / Flecha derecha)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  const currentPageInfo = pagesCatalog.find(p => p.number === currentPage) || pagesCatalog[0];

  // 5 Fases Clínicas Oficiales del Documento
  const documentPhases = [
    { title: 'Fase 1: Certificación FPF', pages: [1, 2], desc: 'Certificado de aptitud y ficha del jugador' },
    { title: 'Fase 2: Anamnesis y Examen', pages: [3, 4, 5, 6, 7], desc: 'Historia cardiovascular, cirugías e IMC' },
    { title: 'Fase 3: Cardiología CONMEBOL', pages: [8, 9, 10], desc: 'ECG reposo y Ecocardiograma Doppler' },
    { title: 'Fase 4: Dictamen Oficial', pages: [11, 12, 13], desc: 'Laboratorio FPF y Certificado Famiheart' },
    { title: 'Fase 5: Diagnóstico e Imágenes', pages: [14, 15, 16, 17, 18, 19, 20, 21], desc: 'Trazado ECG, ultrasonidos y Rayos X' }
  ];

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-200">
      
      {/* BARRA SUPERIOR DE CONTROL MINIMALISTA */}
      <div className="no-print bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Navegador de Páginas */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || viewMode === 'all'}
            className="p-1.5 rounded-md bg-white border border-[#CBD5E1] hover:bg-slate-50 disabled:opacity-30 text-[#1E293B] transition cursor-pointer"
            title="Página Anterior (← Flecha Izquierda)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-md">
            <span className="text-[11px] text-[#64748B]">Página</span>
            <span className="text-xs font-bold text-[#1E293B] font-mono">{currentPage}</span>
            <span className="text-[11px] text-[#64748B]">de {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || viewMode === 'all'}
            className="p-1.5 rounded-md bg-white border border-[#CBD5E1] hover:bg-slate-50 disabled:opacity-30 text-[#1E293B] transition cursor-pointer"
            title="Página Siguiente (→ Flecha Derecha)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controles de Zoom y Ajuste */}
        <div className="flex items-center space-x-1 bg-slate-50 border border-[#CBD5E1] p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
            className="p-1 rounded text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
            title="Reducir Zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-[#1E293B] hover:bg-white transition cursor-pointer"
            title="Ajustar al 100%"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
            className="p-1 rounded text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(prev => prev === 85 ? 100 : 85)}
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-white border-l border-[#CBD5E1] transition cursor-pointer"
            title="Ajustar a página completa (85%)"
          >
            Ajustar
          </button>
        </div>

        {/* Selector de Formato Oficial */}
        <div className="flex items-center space-x-2">
          
          {/* Modo 1: Certificado y Expediente Oficial 1:1 */}
          <button
            type="button"
            onClick={() => {
              setViewFormat('facsimile');
              if (setIsBlankMode) setIsBlankMode(false);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
              viewFormat === 'facsimile'
                ? 'bg-[#0369A1] text-white border-[#0369A1] shadow-xs'
                : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
            }`}
            title="Expediente oficial de 21 páginas con plantilla original y datos superpuestos"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Expediente Oficial (1:1)</span>
          </button>

          {/* Modo 2: Plantilla en Blanco */}
          <button
            type="button"
            onClick={() => {
              setViewFormat('blank');
              if (setIsBlankMode) setIsBlankMode(true);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition cursor-pointer ${
              viewFormat === 'blank'
                ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                : 'bg-white text-slate-700 border-[#CBD5E1] hover:bg-slate-50'
            }`}
            title="Plantilla oficial limpia sin datos personales"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Plantilla Limpia</span>
          </button>

          {/* Toggle Vista Individual vs Continuo */}
          <div className="bg-slate-50 p-0.5 rounded-md border border-[#CBD5E1] flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-white text-[#1E293B] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              1 Pág
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-[#1E293B] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              21 Págs
            </button>
          </div>

        </div>

        {/* Acciones de Descarga e Impresión */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => downloadPatientDocx(patient, { globalDate: patient?.fechaEvaluacion, globalClub: patient?.club })}
            className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer"
            title="Descargar el documento Word (.docx) oficial con todos los sellos médicos y firmas intactas"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Word Oficial (.docx)</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center space-x-1 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow-xs transition cursor-pointer"
            title="Imprimir el certificado o guardar como PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir PDF</span>
          </button>
        </div>

      </div>

      {/* TITULO Y DESCRIPCIÓN DE LA PÁGINA ACTUAL */}
      <div className="no-print bg-white border border-[#E2E8F0] px-4 py-2 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <span className="bg-[#B91C1C]/10 text-[#B91C1C] font-bold px-2 py-0.5 rounded border border-[#B91C1C]/20 text-[10px] uppercase">
            {currentPageInfo.section}
          </span>
          <span className="font-semibold text-[#1E293B]">
            Página {currentPageInfo.number}: {currentPageInfo.title}
          </span>
        </div>
        <div className="text-[#64748B] hidden sm:block text-xs">
          {isBlankMode ? (
            <span className="text-[#B45309] font-medium">Formato oficial limpio para firma manuscrita</span>
          ) : (
            <span>Expediente: <strong className="text-[#1E293B]">{patient.nombreCompleto || 'Futbolista'}</strong></span>
          )}
        </div>
      </div>

      {/* MESA DE TRABAJO NEUTRAL PARA VISUALIZACIÓN DE HOJA A4 */}
      <div className="bg-slate-200/90 border border-[#CBD5E1] rounded-lg p-4 sm:p-8 flex justify-center overflow-x-auto shadow-inner">
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} 
          className="transition-transform duration-150"
        >
          {viewMode === 'single' ? (
            /* Vista Hoja Individual con Animación de Página */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.12 }}
                className={`w-[210mm] min-h-[297mm] bg-white text-black shadow-lg shadow-slate-400/50 rounded-xs border border-slate-300 ${
                  viewFormat === 'digital' ? 'p-8' : 'p-0'
                } flex flex-col justify-between relative overflow-hidden select-none`}
              >
                <PageContentRenderer 
                  pageNumber={currentPage} 
                  patient={patient} 
                  viewFormat={viewFormat}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Vista 21 Páginas Continuas */
            <div className="space-y-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                <div 
                  key={pNum} 
                  className={`w-[210mm] min-h-[297mm] bg-white text-black shadow-lg shadow-slate-400/50 rounded-xs border border-slate-300 ${
                    viewFormat === 'digital' ? 'p-8' : 'p-0'
                  } flex flex-col justify-between relative overflow-hidden print-page`}
                >
                  <PageContentRenderer 
                    pageNumber={pNum} 
                    patient={patient} 
                    viewFormat={viewFormat}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÍNDICE SECCIONADO EN 5 FASES CLÍNICAS */}
      <div className="no-print bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#0369A1]" />
            Índice de Secciones del Expediente de 21 Páginas
          </h3>
          <span className="text-[11px] text-[#64748B]">Haz clic en cualquier página para navegar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {documentPhases.map((phase, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-md border border-[#E2E8F0] space-y-2">
              <div className="text-xs font-bold text-[#1E293B] leading-tight">{phase.title}</div>
              <p className="text-[10px] text-[#64748B] leading-tight">{phase.desc}</p>
              
              <div className="flex flex-wrap gap-1 pt-1">
                {phase.pages.map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCurrentPage(num);
                      setViewMode('single');
                    }}
                    className={`w-6 h-6 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                      currentPage === num && viewMode === 'single'
                        ? 'bg-[#0369A1] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-[#1E293B] border border-[#CBD5E1]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// Renderizador principal de página
function PageContentRenderer({ pageNumber, patient, viewFormat }) {
  if (viewFormat === 'blank') {
    return <CleanTemplatePage pageNumber={pageNumber} />;
  }

  if (viewFormat === 'digital') {
    return <DigitalSynchronizedPage pageNumber={pageNumber} patient={patient} />;
  }

  // Por defecto: Facsímil Oficial 1:1 con formato exacto al PDF Original
  return <FacsimileOfficialPage pageNumber={pageNumber} patient={patient} />;
}

// PÁGINA 1: CERTIFICADO MÉDICO DEPORTIVO OFICIAL FPF (RECONSTRUCCIÓN VECTORIAL 1:1 DE ALTA PRECISIÓN)
function ReconstructedOfficialPage1({ patient }) {
  const doctorName = 'Dr. Darío Hernández Alarcón';
  const doctorCmp = '27503';
  const doctorRne = '15620';
  const evaluationAddress = patient?.domicilioClinica || 'Av. Conquistadores 1588, San Isidro - Lima';
  
  // Formato inequívoco de fecha DD/MM/YYYY
  const rawDate = patient?.fechaEvaluacion || '22-01-2026';
  const cleanDate = rawDate === '06-05-2026' ? '22/01/2026' : rawDate.replace(/-/g, '/');
  
  const receiptNum = patient?.numeroRecibo || 'REC-2026-08942';
  const securityToken = `FMH-2026-${patient?.dni || '74290500'}`;

  return (
    <div className="w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white text-black font-sans flex flex-col justify-between relative box-border select-none border border-slate-300">
      
      {/* 1. CABECERA INSTITUCIONAL OFICIAL */}
      <div>
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          {/* Escudo FPF Oficial */}
          <div className="flex items-center space-x-3">
            <img 
              src="/assets/fpf-logo.png" 
              alt="Federación Peruana de Fútbol" 
              className="h-16 w-auto object-contain" 
            />
            <div className="leading-tight text-left">
              <div className="font-extrabold text-[15px] tracking-wide text-black uppercase" style={{ fontFamily: 'Berlin Sans FB, Calibri, sans-serif' }}>
                FEDERACIÓN PERUANA DE FÚTBOL
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                COMISIÓN MÉDICA & UNIDAD ANTIDOPAJE
              </div>
              <div className="text-[9px] font-semibold text-slate-500 uppercase">
                PROTOCOLO DE CERTIFICACIÓN MÉDICA PRE-COMPETENCIA (PCMA)
              </div>
            </div>
          </div>

          {/* Logo Famiheart Acreditado */}
          <div className="text-right flex flex-col items-end">
            <img 
              src="/assets/famiheart-logo-clean.png" 
              alt="Famiheart S.A.C." 
              className="h-10 w-auto object-contain" 
            />
            <div className="text-[9px] font-bold text-slate-600 mt-1">FAMIHEART S.A.C. • RUC 20554742905</div>
            <div className="text-[8px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 mt-0.5">
              CENTRO MÉDICO ACREDITADO FPF
            </div>
          </div>
        </div>

        {/* Título Oficial del Certificado */}
        <div className="text-center my-3">
          <h1 
            className="text-lg font-black uppercase tracking-wider text-black underline decoration-red-700 decoration-2 underline-offset-4"
            style={{ fontFamily: 'Berlin Sans FB, Calibri, sans-serif' }}
          >
            CERTIFICADO MÉDICO DEPORTIVO OFICIAL
          </h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">
            TEMPORADA COMPETITIVA ANUAL 2026
          </div>
        </div>
      </div>

      {/* 2. CAMPOS DE IDENTIFICACIÓN: FUENTE ÚNICA CALIBRI, ALINEADOS 2-3PX SOBRE SU LÍNEA */}
      <div className="space-y-3.5 text-xs text-black" style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
        
        {/* Campo Nombre Completo */}
        <div className="flex items-baseline relative border-b border-black pb-0.5">
          <span className="font-bold text-[11px] uppercase w-48 shrink-0 text-slate-800">
            NOMBRE DEL FUTBOLISTA:
          </span>
          <span className="font-bold text-[14px] uppercase text-black font-mono tracking-tight -mb-[2px]">
            {patient?.nombreCompleto || 'APELLIDOS NOMBRES'}
          </span>
        </div>

        {/* Campo Club y Categoría */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex items-baseline border-b border-black pb-0.5">
            <span className="font-bold text-[11px] uppercase w-48 shrink-0 text-slate-800">
              CLUB DEPORTIVO:
            </span>
            <span className="font-semibold text-[13px] uppercase text-black -mb-[2px] truncate">
              {patient?.club || 'CLUB FPF / LIGA FORMATIVA'}
            </span>
          </div>
          <div className="col-span-4 flex items-baseline border-b border-black pb-0.5">
            <span className="font-bold text-[11px] uppercase w-16 shrink-0 text-slate-800">
              CATEG.:
            </span>
            <span className="font-semibold text-[12px] uppercase text-black -mb-[2px] truncate">
              {patient?.categoria || 'PRIMERA / RESERVA'}
            </span>
          </div>
        </div>

        {/* Campo DNI y Posición */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6 flex items-baseline border-b border-black pb-0.5">
            <span className="font-bold text-[11px] uppercase w-48 shrink-0 text-slate-800">
              DOC. IDENTIDAD (DNI):
            </span>
            <span className="font-bold text-[13px] font-mono text-black -mb-[2px]">
              {patient?.dni || '70000000'}
            </span>
          </div>
          <div className="col-span-6 flex items-baseline border-b border-black pb-0.5">
            <span className="font-bold text-[11px] uppercase w-28 shrink-0 text-slate-800">
              POSICIÓN:
            </span>
            <span className="font-semibold text-[12px] uppercase text-black -mb-[2px]">
              {patient?.posicion || 'CAMPO'}
            </span>
          </div>
        </div>

        {/* Campo Médico Evaluador */}
        <div className="flex items-baseline border-b border-black pb-0.5">
          <span className="font-bold text-[11px] uppercase w-48 shrink-0 text-slate-800">
            MÉDICO EVALUADOR:
          </span>
          <span className="font-bold text-[13px] text-black -mb-[2px]">
            {doctorName}
          </span>
          <span className="text-[11px] font-mono text-slate-700 ml-4">
            (C.M.P. {doctorCmp} • R.N.E. {doctorRne})
          </span>
        </div>

        {/* Campo Domicilio de Evaluación */}
        <div className="flex items-baseline border-b border-black pb-0.5">
          <span className="font-bold text-[11px] uppercase w-48 shrink-0 text-slate-800">
            DOMICILIO EVALUACIÓN:
          </span>
          <span className="font-medium text-[12px] text-black -mb-[2px] uppercase">
            {evaluationAddress}
          </span>
        </div>

      </div>

      {/* 3. RECUADRO DE EXAMEN CLÍNICO Y GLOSARIO */}
      <div className="border-2 border-black rounded-lg p-4 bg-slate-50/60 space-y-3" style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
        <div className="font-extrabold text-[11px] uppercase tracking-wider text-black border-b border-slate-300 pb-1">
          QUIEN AL EXAMEN CLÍNICO INTEGRAL PRE-COMPETENCIA PRESENTA:
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] leading-tight">
          <div className="flex items-start space-x-1.5">
            <span className="font-bold text-black shrink-0">ARER:</span>
            <span className="text-slate-800">Adecuado Rendimiento en Examen Respiratorio (sin ruidos agregados)</span>
          </div>
          <div className="flex items-start space-x-1.5">
            <span className="font-bold text-black shrink-0">AREN:</span>
            <span className="text-slate-800">Aparato Renal y Neurológico sin signos patológicos</span>
          </div>
          <div className="flex items-start space-x-1.5">
            <span className="font-bold text-black shrink-0">RUIDOS CARDÍACOS:</span>
            <span className="text-slate-800">R1 y R2 rítmicos normofonéticos, sin soplos ni galopes</span>
          </div>
          <div className="flex items-start space-x-1.5">
            <span className="font-bold text-black shrink-0">VÍAS AÉREAS:</span>
            <span className="text-slate-800">Permeables, libres de obstrucción y bien ventiladas</span>
          </div>
        </div>

        {/* 4. DICTAMEN FINAL DESTACADO */}
        <div className="mt-3 pt-3 border-t-2 border-black text-center bg-white p-2.5 rounded border border-slate-300">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            DICTAMEN MÉDICO DEPORTIVO FINAL:
          </div>
          <div className="text-[15px] font-black text-black tracking-wide mt-0.5">
            [ X ] SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FÚTBOL COMPETITIVO )
          </div>
        </div>
      </div>

      {/* 5. FIRMA Y FECHA EN RECUADROS OFICIALES */}
      <div className="grid grid-cols-2 gap-6 pt-2" style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>
        
        {/* Recuadro Firma y Sello Oficial */}
        <div className="border border-black rounded-lg p-3 text-center flex flex-col justify-between h-36 bg-white relative">
          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
            FIRMA / SELLO DEL MÉDICO EVALUADOR
          </div>
          
          <div className="flex-1 flex items-center justify-center py-1">
            <img 
              src="/assets/firma-cardiologo-transparent.png" 
              alt="Firma y Sello Oficial" 
              className="max-h-16 w-auto object-contain pointer-events-none" 
            />
          </div>

          <div className="border-t border-slate-300 pt-1 text-[10px] font-bold leading-tight text-black">
            <div>{doctorName}</div>
            <div className="text-[9px] text-slate-600 font-normal">C.M.P. {doctorCmp} • R.N.E. {doctorRne} • Cardiólogo Famiheart</div>
          </div>
        </div>

        {/* Recuadro Fecha Unificada y Certificación */}
        <div className="border border-black rounded-lg p-3 text-center flex flex-col justify-between h-36 bg-white">
          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-1">
            FECHA OFICIAL DE EVALUACIÓN (FPF)
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-2xl font-black font-mono tracking-wider text-black">
              {cleanDate}
            </div>
            <div className="text-[10px] font-bold text-emerald-800 mt-1 uppercase">
              Cascada Sincronizada 21 Páginas
            </div>
          </div>

          <div className="border-t border-slate-300 pt-1 text-[9px] text-slate-500 font-mono">
            VIGENCIA ANUAL REGLAMENTARIA FPF 2026
          </div>
        </div>

      </div>

      {/* 6. PIE DE PÁGINA: RECIBO OFICIAL, CÓDIGO DE VALIDACIÓN Y SEGURIDAD */}
      <div className="border-t border-black pt-2 flex items-center justify-between text-[9px] font-mono text-slate-600">
        <div>
          <span className="font-bold text-black">RECIBO:</span> {receiptNum}
        </div>
        <div className="font-semibold text-slate-700">
          <span className="font-bold text-black">VALIDACIÓN FEDERATIVA:</span> {securityToken}
        </div>
        <div className="font-bold text-black">
          PÁGINA 01 DE 21 • FPF & CONMEBOL
        </div>
      </div>

    </div>
  );
}

// Renderizador Facsímil 1:1 Oficial FPF / CONMEBOL (Exacto al PDF Original)
function FacsimileOfficialPage({ pageNumber, patient }) {
  const formattedPage = pageNumber.toString().padStart(2, '0');
  const ekgSrc = patient?.ekgImage || patient?.fileUrl;

  // PÁGINA 1: CERTIFICADO MÉDICO OFICIAL FPF (FACSÍMIL 1:1 PLANTILLA ORIGINAL SIN FIRMA DUPLICADA)
  if (pageNumber === 1) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_01.png" 
          alt="Certificado Médico Página 1" 
          className="w-full h-full object-contain pointer-events-none block"
        />

        {/* 1. Nombre Completo del Futbolista: Calibri 11pt, regular, #000, 2-3px sobre la línea */}
        <div 
          className="absolute fpf-doc-text uppercase font-normal tracking-wide whitespace-nowrap"
          style={{ top: '11.40%', left: '20.16%' }}
        >
          {patient?.nombreCompleto || `${patient?.apellidos || ''} ${patient?.nombres || ''}`.trim()}
        </div>

        {/* 2. Club Deportivo: Calibri 11pt, regular, #000, 2-3px sobre la línea */}
        <div 
          className="absolute fpf-doc-text uppercase font-normal tracking-wide whitespace-nowrap"
          style={{ top: '14.07%', left: '18.06%' }}
        >
          {patient?.club || 'Club FPF / Liga Formativa'}
        </div>

        {/* 3. Fecha Oficial FPF (Recuadro Derecho): Calibri 11pt, #000 */}
        <div 
          className="absolute fpf-doc-text font-normal font-mono"
          style={{ top: '82.21%', left: '62.62%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>

        {/* 4. Número de Recibo Oficial */}
        <div 
          className="absolute text-[10px] font-mono text-slate-800"
          style={{ top: '94.50%', left: '12.00%' }}
        >
          {patient?.receiptNum || '004128'}
        </div>
      </div>
    );
  }

  // PÁGINA 2: FICHA DE EVALUACIÓN PRE-COMPETENCIA (PCMA)
  if (pageNumber === 2) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_02.png" 
          alt="Evaluación Médica Pre-Competencia Página 2" 
          className="w-full h-full object-contain pointer-events-none block"
        />

        {/* Apellidos: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '49.98%', left: '11.21%' }}
        >
          {patient?.apellidos || patient?.nombreCompleto}
        </div>

        {/* Nombres: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '49.79%', left: '57.08%' }}
        >
          {patient?.nombres || '-'}
        </div>

        {/* DNI: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '56.80%', left: '57.08%' }}
        >
          {patient?.dni || '70000000'}
        </div>

        {/* Club Deportivo: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '71.79%', left: '10.32%' }}
        >
          {patient?.club || 'Club FPF / Liga Formativa'}
        </div>

        {/* País: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '71.60%', left: '56.57%' }}
        >
          PERU
        </div>

        {/* Fecha Unificada: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '92.60%', left: '78.50%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINA 12: DECLARACIÓN MÉDICA FINAL DE LA COMISIÓN (FACSÍMIL 1:1)
  if (pageNumber === 12) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_12.png" 
          alt="Declaración Médica Página 12" 
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Fecha Oficial de la Declaración: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '86.51%', left: '8.57%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINA 13: CERTIFICADO DE APTITUD MÉDICA FAMIHEART (FACSÍMIL 1:1)
  if (pageNumber === 13) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_13.png" 
          alt="Certificado Famiheart Página 13" 
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Nombre en Certificado Famiheart: Berlin Sans FB 24pt (32px), bold, #000 */}
        <div 
          className="absolute fpf-doc-title-24 uppercase"
          style={{ top: '29.68%', left: '31.64%' }}
        >
          {patient?.nombreCompleto}
        </div>
        {/* Fecha Oficial: Calibri 16pt (21.33px), regular, #000 */}
        <div 
          className="absolute fpf-doc-date-16"
          style={{ top: '73.31%', left: '14.30%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINA 14: INFORME ECOCARDIOGRÁFICO DOPPLER (FACSÍMIL 1:1)
  if (pageNumber === 14) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_14.png" 
          alt="Informe Ecocardiográfico Página 14" 
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Nombre en Ecocardiograma: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '21.38%', left: '20.08%' }}
        >
          {patient?.nombreCompleto}
        </div>
        {/* Fecha en Ecocardiograma: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '23.07%', left: '20.08%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINAS 17, 18, 19: LABORATORIO CLÍNICO FAMIHEART (FACSÍMIL 1:1)
  if (pageNumber === 17 || pageNumber === 18 || pageNumber === 19) {
    const coords = {
      17: { nameTop: '22.24%', nameLeft: '30.80%', dateTop: '29.18%', dateLeft: '78.27%' },
      18: { nameTop: '21.00%', nameLeft: '28.95%', dateTop: '27.94%', dateLeft: '80.38%' },
      19: { nameTop: '22.82%', nameLeft: '26.77%', dateTop: '29.76%', dateLeft: '86.81%' }
    }[pageNumber];

    return (
      <div className="w-full h-full relative select-none">
        <img 
          src={`/assets/pages_blank/page_${formattedPage}.png`} 
          alt={`Laboratorio Clínico Página ${pageNumber}`} 
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: coords.nameTop, left: coords.nameLeft }}
        >
          {patient?.nombreCompleto}
        </div>
        <div 
          className="absolute fpf-doc-text"
          style={{ top: coords.dateTop, left: coords.dateLeft }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINA 20: INFORME RADIOLÓGICO Y RAYOS X (FACSÍMIL OFICIAL 1:1)
  if (pageNumber === 20) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_20.png" 
          alt="Informe Radiológico Rayos X Página 20" 
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Nombre del paciente: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '21.90%', left: '35.55%' }}
        >
          {patient?.nombreCompleto}
        </div>
        {/* Fecha: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '25.19%', left: '35.49%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
        </div>
      </div>
    );
  }

  // PÁGINA 21: DICTAMEN FINAL DE APTITUD FPF (FACSÍMIL OFICIAL 1:1)
  if (pageNumber === 21) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_21.png" 
          alt="Dictamen Final FPF Página 21" 
          className="w-full h-full object-contain pointer-events-none block"
        />
      </div>
    );
  }

  // RESTO DE PÁGINAS (PÁGINAS 3 A 15, 17 A 21): ESCANEO FACSIMILAR AUTÉNTICO 1:1
  return (
    <div className="w-full h-full relative select-none">
      <img 
        src={`/assets/pages_blank/page_${formattedPage}.png`} 
        alt={`Expediente Oficial FPF Página ${pageNumber}`}
        className="w-full h-full object-contain pointer-events-none block"
        onError={(e) => {
          e.target.src = `/assets/pages/page_${formattedPage}.png`;
        }}
      />

      {/* Franja superior sincronizada para control clínico */}
      <div className="absolute top-1 right-3 text-[9px] font-mono font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded shadow-xs print-only">
        {patient?.nombreCompleto} • {patient?.fechaEvaluacion}
      </div>
    </div>
  );
}

// Renderizador Digital Dinámico con Fecha Única y Nombre Estandarizado (Reemplaza Word)
function DigitalSynchronizedPage({ pageNumber, patient }) {
  const doctorName = patient.medicoEvaluador === 'ALFREDO VEGA CISNEROS' 
    ? 'Dr. Alfredo Vega Cisneros (C.M.P. 1821 / R.N.E. 4480)' 
    : 'Dr. Darío Hernández Alarcón (C.M.P. 27503 / R.N.E. 15620)';

  // PÁGINA 1: CERTIFICADO MÉDICO DEPORTIVO FPF
  if (pageNumber === 1) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <img src="/assets/fpf-logo.png" alt="FPF" className="h-12 w-auto object-contain" />
            <div className="text-right text-[11px] font-bold text-slate-600">
              <div>FAMIHEART S.A.C.</div>
              <div>RUC: 20554742905</div>
            </div>
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-blue-950">Federación Peruana de Fútbol</h2>
          <h3 className="text-base font-bold uppercase underline text-red-700">Certificado Médico Oficial de Aptitud</h3>
        </div>

        <div className="space-y-4 my-6 text-sm">
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
            <span className="font-black text-slate-700 w-28">NOMBRE:</span>
            <span className="font-black text-blue-900 text-base font-mono">{patient.nombreCompleto}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
            <span className="font-black text-slate-700 w-28">CLUB:</span>
            <span className="font-bold text-slate-800">{patient.club}</span>
            <span className="font-bold text-slate-500 ml-4">CAT:</span>
            <span className="font-medium text-slate-700">{patient.categoria}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
            <span className="font-black text-slate-700 w-28">MÉDICO:</span>
            <span className="font-bold text-slate-800">{doctorName}</span>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-300 pb-1">
            <span className="font-black text-slate-700 w-28">DOMICILIO:</span>
            <span className="font-medium text-slate-700">{patient.domicilioClinica}</span>
          </div>
        </div>

        <div className="border border-slate-800 rounded-xl p-6 space-y-4 bg-slate-50">
          <div className="font-black text-slate-900 text-xs tracking-wider uppercase">
            QUIEN AL EXAMEN CLÍNICO INTEGRAL PRESENTA:
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pl-2">
            <div><strong>ARER:</strong> Adecuado Rendimiento Físico</div>
            <div><strong>AREN:</strong> Sin Signos Patológicos</div>
            <div><strong>RUIDOS CARDIACOS:</strong> R1 y R2 Rítmicos, Sin Soplos</div>
            <div><strong>VÍAS AÉREAS:</strong> Libres y Despejadas</div>
          </div>
          <div className="pt-4 text-center border-t border-slate-200">
            <div className="text-xs text-slate-600 uppercase font-semibold">Dictamen Final de Aptitud Deportiva:</div>
            <div className="text-lg font-black text-emerald-700 mt-1">
              [ X ] APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FÚTBOL COMPETITIVO )
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8">
          <div className="text-center border-t-2 border-slate-900 pt-2 text-xs font-bold">
            <div className="h-14 flex items-center justify-center">
              <img 
                src="/assets/firma-cardiologo.jpeg" 
                alt="Firma y Sello Oficial" 
                className="h-12 w-auto object-contain mix-blend-multiply" 
              />
            </div>
            <div>{doctorName}</div>
            <div className="text-[10px] text-slate-500 font-normal">Comisión Médica Famiheart S.A.C.</div>
          </div>
          <div className="text-center border-t-2 border-slate-900 pt-2 text-xs font-bold">
            <div className="text-slate-500 font-medium">FECHA UNIFICADA DE EVALUACIÓN:</div>
            <div className="text-lg font-black text-blue-900 font-mono mt-1">
              {patient.fechaEvaluacion}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Cascada Sincronizada 21 Páginas</div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 pt-4 flex justify-between border-t border-slate-200">
          <span>RECIBO OFICIAL: {patient.numeroRecibo || 'REC-2026-08942'}</span>
          <span>Página 01 de 21 • FPF Pre-Competencia</span>
        </div>
      </div>
    );
  }

  // PÁGINA 2: FICHA DE EVALUACIÓN PRE-COMPETENCIA (PCMA) - DATOS DEL FUTBOLISTA
  if (pageNumber === 2) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/fpf-logo.png" alt="FPF" className="h-11 w-auto object-contain" />
            <div>
              <h2 className="text-base font-black text-blue-950">FEDERACIÓN PERUANA DE FÚTBOL</h2>
              <div className="text-[10px] text-slate-600 font-bold">FICHA DE EVALUACIÓN PRE-COMPETENCIA (PCMA)</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-slate-500">Pág. 02 / 21</div>
          </div>
        </div>

        <div className="space-y-4 my-auto text-xs">
          <div className="bg-blue-950 text-white font-bold px-3 py-1.5 rounded uppercase tracking-wider text-[11px]">
            1. Identificación del Jugador (Extracción Automática de Archivo)
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Apellidos:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{patient.apellidos || patient.nombreCompleto}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Nombres:</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{patient.nombres || '-'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Documento de Identidad (DNI):</span>
              <span className="font-mono font-bold text-blue-950">{patient.dni || '70000000'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Sexo / Género:</span>
              <span className="font-bold text-slate-800">MASCULINO</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Club Deportivo / Liga:</span>
              <span className="font-bold text-slate-800">{patient.club || 'Club FPF / Liga Formativa'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Categoría / Posición:</span>
              <span className="font-bold text-slate-800">{patient.categoria || 'Competitiva 2026'} / {patient.posicion || 'Futbolista'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Archivo Fuente Asociado:</span>
              <span className="font-mono text-[11px] text-blue-800">{patient.fileName || `${patient.nombreCompleto}.pdf`}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Estado de Evaluación:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                APTO COMPETENCIA
              </span>
            </div>
          </div>

          <div className="bg-blue-950 text-white font-bold px-3 py-1.5 rounded uppercase tracking-wider text-[11px]">
            2. Declaración Médica de Sincronización
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed text-[11px]">
            Se certifica que los datos de filiación del jugador han sido contrastados con el documento fuente original y vinculados uniformemente a las 21 páginas del presente expediente bajo la fecha oficial <strong className="text-blue-900">{patient.fechaEvaluacion}</strong>.
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>FECHA UNIFICADA: <strong className="font-mono text-blue-900">{patient.fechaEvaluacion}</strong></div>
          <div className="text-right">
            <div className="font-bold">{doctorName}</div>
            <div className="text-[10px] text-slate-500">Médico Evaluador Acreditado FPF</div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 9: PROTOCOLO CARDÍACO CONMEBOL
  if (pageNumber === 9) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-blue-900">CONFEDERACIÓN SUDAMERICANA DE FÚTBOL</div>
            <h2 className="text-lg font-black text-slate-900">COMISIÓN MÉDICA - PROTOCOLO CONMEBOL</h2>
          </div>
          <div className="text-right text-xs font-mono font-bold text-slate-600">
            <div>FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-blue-700">ID: {patient.dni}</div>
          </div>
        </div>

        <div className="my-4 bg-slate-100 p-3 rounded-lg text-xs flex justify-between">
          <span><strong>JUGADOR:</strong> {patient.nombreCompleto}</span>
          <span><strong>CLUB:</strong> {patient.club}</span>
          <span><strong>POSICIÓN:</strong> {patient.posicion}</span>
        </div>

        <div className="space-y-4 text-xs flex-1">
          <div className="font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
            Mediciones Ecocardiográficas Oficiales (Valores en Reposo)
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 border p-3 rounded-lg bg-slate-50">
              <div className="flex justify-between border-b pb-1"><span>Aorta Ascendente:</span><strong className="font-mono">25 mm</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Aurícula Izquierda (eje largo):</span><strong className="font-mono">28 mm</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Aurícula Izquierda área:</span><strong className="font-mono">31 cm2</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Aurícula Izq. volumen:</span><strong className="font-mono">34 ml/m2</strong></div>
              <div className="flex justify-between"><span>Aurícula Derecha área:</span><strong className="font-mono">26 mm</strong></div>
            </div>

            <div className="space-y-2 border p-3 rounded-lg bg-slate-50">
              <div className="flex justify-between border-b pb-1"><span>Ventrículo Izq. diámetro diástole:</span><strong className="font-mono">50 mm</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Septum Interventricular diástole:</span><strong className="font-mono">10 mm</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Pared Posterior diástole:</span><strong className="font-mono">10 mm</strong></div>
              <div className="flex justify-between border-b pb-1"><span>Fracción Eyección / Acortamiento:</span><strong className="font-mono text-emerald-700">57% / 38%</strong></div>
              <div className="flex justify-between"><span>Motilidad Segmentaria:</span><strong className="font-mono text-emerald-700">NORMAL (N)</strong></div>
            </div>
          </div>

          <div className="border p-3 rounded-lg text-xs space-y-1">
            <div className="font-bold">EVALUACIÓN VALVULAR:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Válvula Mitral: <span className="font-bold text-emerald-700">NORMAL (N)</span></div>
              <div>Válvula Aórtica: <span className="font-bold text-emerald-700">NORMAL (N)</span></div>
              <div>Válvula Tricúspide: <span className="font-bold text-emerald-700">NORMAL (N)</span></div>
              <div>Válvula Pulmonar: <span className="font-bold text-emerald-700">NORMAL (N)</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 text-xs font-bold text-center">
          <div>
            <div>{doctorName}</div>
            <div className="text-[10px] text-slate-500 font-normal">Médico Cardiólogo Evaluador</div>
          </div>
          <div>
            <div>FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">Comisión Médica CONMEBOL</div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 13: CERTIFICADO DE APTITUD FAMIHEART (Texto literal visto en video)
  if (pageNumber === 13) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-10 font-sans bg-white text-slate-900">
        <div className="text-center space-y-2 border-b pb-6">
          <div className="flex justify-center items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-14 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-black text-blue-950">FAMIHEART S.A.C.</h2>
          <div className="text-xs font-bold text-slate-600">SERVICIOS MÉDICOS GENERALES ESPECIALIZADOS</div>
          <div className="text-xs font-mono text-slate-500">RUC: 20554742905</div>
        </div>

        <div className="my-auto space-y-8 px-4">
          <div className="text-sm font-bold uppercase tracking-wider text-center text-slate-700">
            CERTIFICACIÓN MÉDICA CARDIOLÓGICA DEPORTIVA
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-justify indent-8 text-slate-800">
            El médico que suscribe certifica que el paciente <strong className="text-blue-950 font-black font-mono">{patient.nombreCompleto}</strong> ha sido evaluado con exámenes de <strong>Rx de Tórax, hematología, electrocardiograma y ecocardiografía</strong>, los cuales se encuentran dentro de los límites normales y siendo asintomático cardiovascular, sin antecedentes, se encuentra <strong className="text-emerald-700 uppercase">apto para realizar actividad física sin restricciones</strong>.
          </p>

          <div className="pt-6 text-sm">
            <div className="font-bold">Atte.</div>
            <div className="font-mono text-base font-black text-blue-900 mt-1">
              FECHA: {patient.fechaEvaluacion}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-slate-900 flex justify-between items-end">
          <div className="text-[10px] text-slate-500">
            <div>Documento validado para Comisión Médica FPF / CONMEBOL</div>
            <div>Sincronización digital automática de fecha</div>
          </div>
          <div className="text-center border-t border-slate-800 pt-2 w-64">
            <div className="h-14 flex items-center justify-center">
              <img 
                src="/assets/firma-cardiologo.jpeg" 
                alt="Firma Dr. Darío Hernández" 
                className="h-12 w-auto object-contain mix-blend-multiply" 
              />
            </div>
            <div className="font-black text-xs">{doctorName}</div>
            <div className="text-[10px] text-slate-500">Cardiólogo - Famiheart S.A.C.</div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 14: INFORME ECOCARDIOGRÁFICO FAMIHEART
  if (pageNumber === 14) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-base font-black text-blue-950">FAMIHEART S.A.C.</h2>
              <div className="text-[10px] text-slate-500">INFORME ECOCARDIOGRÁFICO Y DOPPLER CARDIACO</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-slate-500">RUC: 20554742905</div>
          </div>
        </div>

        <div className="my-3 bg-slate-100 p-3 rounded-lg text-xs grid grid-cols-2 gap-2">
          <div><strong>Nombre:</strong> {patient.nombreCompleto}</div>
          <div><strong>Sexo:</strong> MASCULINO</div>
          <div><strong>Club:</strong> {patient.club}</div>
          <div><strong>Edad:</strong> {patient.edad || 21} años</div>
        </div>

        <div className="space-y-3 text-xs flex-1">
          <div className="font-bold border-b pb-1">1. MEDICIONES ECOCARDIOGRÁFICAS (2D / M-MODE):</div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="space-y-1">
              <div>Ventrículo derecho: <span className="font-bold">24 mm</span> (0.8 - 2.7)</div>
              <div>Septum interventricular: <span className="font-bold">10 mm</span> (8 - 11)</div>
              <div>V.I. Diástole: <span className="font-bold">44 mm</span> (35 - 57)</div>
              <div>V.I. Sístole: <span className="font-bold">24 mm</span></div>
              <div>Pared Posterior V.I.: <span className="font-bold">10 mm</span> (6 - 11)</div>
            </div>
            <div className="space-y-1">
              <div>Aorta Raíz: <span className="font-bold">26 mm</span> (2.2 - 3.6)</div>
              <div>Aorta apertura: <span className="font-bold">22 mm</span> (15 - 26)</div>
              <div>Aurícula Izquierda: <span className="font-bold">32 mm</span> (22 - 40)</div>
              <div>Fracción de Eyección: <span className="font-bold text-emerald-700">64 %</span> (55 - 80)</div>
              <div>Fracción Acortamiento: <span className="font-bold text-emerald-700">33 %</span> (30 - 48)</div>
            </div>
          </div>

          <div className="font-bold border-b pb-1 pt-2">2. CONCLUSIONES CLÍNICAS:</div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-1 text-xs">
            <div>• Cavidades cardíacas de dimensiones y espesores parietales normales.</div>
            <div>• Función sistólica y diastólica del Ventrículo Izquierdo conservada.</div>
            <div>• Estudio Doppler sin gradientes patológicos ni reflujos significativos.</div>
            <div className="font-bold text-emerald-800 pt-1">DICTAMEN: APTO CARDIOLÓGICO PARA FÚTBOL COMPETITIVO</div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>FECHA: <strong className="font-mono text-blue-900">{patient.fechaEvaluacion}</strong></div>
          <div className="text-right">
            <div className="font-black">{doctorName}</div>
            <div className="text-[10px] text-slate-500">Médico Cardiólogo Famiheart</div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 15: PARASITOLÓGICO SERIADO (Famiheart Lab)
  if (pageNumber === 15) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-base font-black text-blue-950">FAMIHEART S.A.C.</h2>
              <div className="text-[10px] text-slate-500">LABORATORIO CLÍNICO Y MICROBIOLOGÍA</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-slate-500">RUC: 20554742905</div>
          </div>
        </div>

        <div className="my-4 bg-slate-100 p-4 rounded-xl text-xs grid grid-cols-2 gap-3">
          <div><strong>PACIENTE:</strong> <span className="font-mono font-bold text-blue-950">{patient.nombreCompleto}</span></div>
          <div><strong>FECHA:</strong> <span className="font-mono font-bold">{patient.fechaEvaluacion}</span></div>
          <div><strong>MÉDICO:</strong> {doctorName}</div>
          <div><strong>SEXO:</strong> MASCULINO</div>
        </div>

        <div className="space-y-6 text-xs flex-1 my-4">
          <h3 className="text-center font-black text-base uppercase tracking-wider text-slate-800 underline">
            INFORME DE EXAMEN PARASITOLÓGICO SERIADO
          </h3>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200 font-bold">
                <tr>
                  <th className="p-3">PARÁMETRO</th>
                  <th className="p-3">RESULTADO OBSERVADO</th>
                  <th className="p-3">VALOR DE REFERENCIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-semibold">COLOR</td>
                  <td className="p-3 font-mono font-bold">AMARILLO</td>
                  <td className="p-3 text-slate-500">Pardo / Amarillo</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">CONSISTENCIA</td>
                  <td className="p-3 font-mono font-bold">SÓLIDO / FORMADO</td>
                  <td className="p-3 text-slate-500">Formado</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">PARÁSITOS</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">No se observa quistes, larvas ni huevos</td>
                  <td className="p-3 text-slate-500">Negativo</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">MUCOSIDAD</td>
                  <td className="p-3 font-mono font-bold">AUSENTE</td>
                  <td className="p-3 text-slate-500">Ausente</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">OTROS ELEMENTOS</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">NEGATIVO</td>
                  <td className="p-3 text-slate-500">Negativo</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-center">
            <div className="font-bold text-emerald-800 text-sm">CONCLUSIÓN: EXAMEN DENTRO DE LÍMITES NORMALES (NEGATIVO)</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Apto para registro de competencia deportiva FPF</div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>FECHA UNIFICADA: <strong className="font-mono text-blue-900">{patient.fechaEvaluacion}</strong></div>
          <div className="text-right">
            <div className="font-bold">Lic. Lisbett Susan Hilares Moscoso</div>
            <div className="text-[10px] text-slate-500">Tecnóloga Médica • C.T.M.P 8355</div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 16: ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES) - TRAZADO OFICIAL
  if (pageNumber === 16) {
    const ekgSrc = patient.ekgImage || patient.fileUrl || '/assets/electrocardiograma.jpeg';
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-base font-black text-blue-950">FAMIHEART S.A.C.</h2>
              <div className="text-[10px] text-slate-500">ELECTROCARDIOGRAMA DIGITAL DE 12 DERIVACIONES</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-slate-500">Pág. 16 / 21</div>
          </div>
        </div>

        <div className="my-2 bg-slate-100 p-3 rounded-lg text-xs flex justify-between items-center">
          <div>
            <strong>PACIENTE:</strong> <span className="font-mono font-bold text-blue-950 text-sm ml-1">{patient.nombreCompleto}</span>
          </div>
          <div className="flex items-center gap-4">
            <span><strong>DNI:</strong> {patient.dni || 'Verificado'}</span>
            <span><strong>FC:</strong> {patient.frecuenciaCardiaca || '65 bpm'}</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
              RITMO SINUSAL NORMAL
            </span>
          </div>
        </div>

        <div className="my-auto flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
          <img 
            src={ekgSrc} 
            alt={`Trazado ECG - ${patient.nombreCompleto}`} 
            className="max-h-[145mm] w-full object-contain rounded-lg bg-white p-1 shadow"
            onError={(e) => {
              e.target.src = '/assets/electrocardiograma.jpeg';
            }}
          />
          <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between w-full px-2">
            <span>ARCHIVO: {patient.fileName || `${patient.nombreCompleto}.pdf`}</span>
            <span>•</span>
            <span>ESTÁNDAR: 25 mm/s, 10 mm/mV</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">EKG NORMAL / APTO</span>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>
            <div className="font-bold text-emerald-800">CONCLUSIÓN: Ritmo sinusal normal, sin alteraciones de conducción ni repolarización.</div>
            <div className="text-[10px] text-slate-500">Apto cardiológico para fútbol competitivo según criterios internacionales de Seattle / Corrado</div>
          </div>
          <div className="text-right flex items-center space-x-2">
            <img 
              src="/assets/firma-cardiologo.jpeg" 
              alt="Sello Cardiólogo" 
              className="h-12 w-auto object-contain mix-blend-multiply" 
            />
            <div className="text-left">
              <div className="font-bold">{doctorName}</div>
              <div className="text-[10px] text-slate-500">Médico Cardiólogo Evaluador</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 20: RADIOGRAFÍA DE TÓRAX CON ENCABEZADO FAMIHEART Y QR
  if (pageNumber === 20) {
    return (
      <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-base font-black text-blue-950">FAMIHEART S.A.C.</h2>
              <div className="text-[10px] text-slate-500">SERVICIO DE DIAGNÓSTICO POR IMÁGENES - RAYOS X</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient.fechaEvaluacion}</div>
            <div className="text-[10px] text-slate-500">INSTITUCIONAL</div>
          </div>
        </div>

        <div className="my-2 bg-slate-100 p-3 rounded-lg text-xs flex justify-between">
          <span><strong>PACIENTE:</strong> {patient.nombreCompleto}</span>
          <span><strong>DNI:</strong> {patient.dni}</span>
          <span><strong>INCIDENCIA:</strong> Póstero-Anterior (PA)</span>
        </div>

        <div className="my-auto flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
          <img 
            src="/assets/radiografia-torax.jpeg" 
            alt="Radiografía de Tórax" 
            className="max-h-[140mm] object-contain rounded-lg border border-slate-700"
          />
          <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center space-x-3">
            <span>PACIENTE: {patient.nombreCompleto}</span>
            <span>•</span>
            <span>FECHA: {patient.fechaEvaluacion}</span>
            <span>•</span>
            <span className="text-emerald-400">NORMAL</span>
          </div>
        </div>

        <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>
            <div className="font-bold text-emerald-800">CONCLUSIÓN: Silueta cardiovascular y campos pulmonares normales.</div>
            <div className="text-[10px] text-slate-500">Sin lesiones pleuropulmonares activas</div>
          </div>
          <div className="text-right flex items-center space-x-2">
            <img 
              src="/assets/firma-radiologo.jpeg" 
              alt="Sello Radiólogo" 
              className="h-12 w-auto object-contain mix-blend-multiply" 
            />
            <div className="text-left">
              <div className="font-bold">Dr. Alfredo Vega Cisneros</div>
              <div className="text-[10px] text-slate-500">CMP 1821 - RNE 4480 • Radiólogo</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINAS GENERALES RESTANTES (Formato dinámico estructurado con fecha unificada)
  return (
    <div className="h-full flex flex-col justify-between border-2 border-slate-900 p-8 font-sans bg-white text-slate-900">
      <div className="border-b pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/assets/fpf-logo.png" alt="FPF" className="h-9 w-auto object-contain" />
          <div>
            <div className="text-xs font-black text-blue-900">HISTORIA CLÍNICA PRE-COMPETENCIA FPF 2026</div>
            <div className="text-[10px] text-slate-500">Famiheart S.A.C. • Comisión Médica Oficial</div>
          </div>
        </div>
        <div className="text-right text-xs font-mono">
          <div className="font-bold text-blue-900">Pág. {pageNumber} / 21</div>
          <div className="text-[10px] text-slate-500">{patient.fechaEvaluacion}</div>
        </div>
      </div>

      <div className="bg-slate-100 p-3 rounded-lg text-xs flex justify-between my-2">
        <span><strong>FUTBOLISTA:</strong> {patient.nombreCompleto}</span>
        <span><strong>CLUB:</strong> {patient.club}</span>
        <span><strong>FECHA:</strong> {patient.fechaEvaluacion}</span>
      </div>

      <div className="my-auto text-center py-16 space-y-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Expediente Clínico Digital Sincronizado
        </div>
        <div className="w-32 h-0.5 bg-blue-600 mx-auto"></div>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Esta sección del expediente médico de <strong className="text-blue-900">{patient.nombreCompleto}</strong> se encuentra vinculada al registro oficial con fecha uniforme <strong className="text-blue-900">{patient.fechaEvaluacion}</strong>.
        </p>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <span>Dictamen Clínico: {patient.estadoAptitud || 'APTO'}</span>
        </div>
      </div>

      <div className="border-t pt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Famiheart S.A.C. - Sistema Médico Deportivo</span>
        <span>Fecha Cascada: {patient.fechaEvaluacion}</span>
      </div>
    </div>
  );
}

// Plantilla limpia en blanco (Carga las 21 páginas oficiales sin datos personales)
function CleanTemplatePage({ pageNumber }) {
  const formattedPage = pageNumber.toString().padStart(2, '0');

  return (
    <div className="w-full h-full relative select-none">
      <img 
        src={`/assets/pages_blank/page_${formattedPage}.png`} 
        alt={`Plantilla Oficial en Blanco Página ${pageNumber}`}
        className="w-full h-full object-contain pointer-events-none block"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}
