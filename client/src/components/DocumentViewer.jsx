import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck2,
  Download,
  Bookmark,
  UploadCloud,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { pagesCatalog } from '../data/initialData';
import { downloadPatientDocx } from '../utils/docxGenerator';
import { uploadPatientPdf } from '../lib/supabase';
import AttachmentSlots from './AttachmentSlots';

export default function DocumentViewer({
  patient,
  isBlankMode,
  setIsBlankMode,
  onUpdatePatient,
  onPrint
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewFormat, setViewFormat] = useState(isBlankMode ? 'blank' : 'facsimile'); // 'facsimile' | 'blank'
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);
  const pdfFileInputRef = React.useRef(null);

  const totalPages = 18;

  useEffect(() => {
    setViewFormat(isBlankMode ? 'blank' : 'facsimile');
  }, [isBlankMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleUploadOfficialPdf = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      window.alert('Solo se admiten archivos PDF (.pdf)');
      return;
    }

    setIsUploadingPdf(true);
    const res = await uploadPatientPdf(patient, file);
    setIsUploadingPdf(false);

    if (res.success) {
      if (onUpdatePatient) {
        onUpdatePatient(patient, {
          pdfUrl: res.publicUrl,
          pdfSizeBytes: res.sizeBytes,
          pdfUpdatedAt: res.updatedAt
        });
      }
      setPdfToast('¡PDF oficial archivado permanentemente en Supabase Storage!');
      setTimeout(() => setPdfToast(null), 4000);
    } else {
      window.alert('Error al archivar el PDF: ' + res.error);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Navegación con teclado (Flecha izquierda / Flecha derecha)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  const currentPageInfo = pagesCatalog.find((p) => p.number === currentPage) || pagesCatalog[0];

  // 5 Fases Clínicas Oficiales del Expediente Limpio de 18 Páginas
  const documentPhases = [
    { title: 'Fase 1: Filiación PCMA', pages: [1], desc: 'Ficha oficial de evaluación pre-competencia FPF' },
    { title: 'Fase 2: Anamnesis y Examen', pages: [2, 3, 4, 5, 6], desc: 'Historia cardiovascular, lesiones, somatometría y signos' },
    { title: 'Fase 3: Cardiología CONMEBOL', pages: [7, 8, 9], desc: 'ECG reposo y Ecocardiograma M-2D / Doppler' },
    { title: 'Fase 4: Dictamen y Aptitud', pages: [10, 11, 12], desc: 'Bioquímica FPF, resumen comisión y Certificado Famiheart' },
    { title: 'Fase 5: Informes e Imágenes', pages: [13, 14, 15, 16, 17, 18], desc: 'Informe Eco, ultrasonidos, ECG, Hemograma y Rayos X' }
  ];

  return (
    <div className="space-y-4 select-none animate-in fade-in duration-200">
      {/* Toast Alert Flotante para PDF */}
      <AnimatePresence>
        {pdfToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 p-3 rounded-md shadow-lg border bg-white border-emerald-300 text-emerald-800 flex items-center space-x-2.5 max-w-md text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{pdfToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
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
            onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
            className="p-1 rounded text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => (prev === 85 ? 100 : 85))}
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-white border-l border-[#CBD5E1] transition cursor-pointer"
            title="Ajustar a página completa (85%)"
          >
            Ajustar
          </button>
        </div>

        {/* Selector de Formato Oficial */}
        <div className="flex items-center space-x-2">
          {/* Modo 1: Expediente Oficial 1:1 */}
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
            title="Expediente oficial de 18 páginas con plantilla limpia original y datos superpuestos"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Expediente Oficial (1:1)</span>
          </button>

          {/* Modo 2: Plantilla Limpia */}
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
            title="Plantilla oficial limpia de 18 páginas sin datos personales"
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
              18 Págs
            </button>
          </div>
        </div>

        {/* Acciones de Descarga e Impresión */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {patient?.pdfUrl && (
            <a
              href={patient.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-[#166534] border border-emerald-300 font-semibold text-xs px-2.5 py-1.5 rounded-md transition cursor-pointer shadow-2xs"
              title="Abrir o descargar el PDF oficial guardado en Supabase Storage"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ver PDF Archivado</span>
              <span className="sm:hidden">PDF</span>
              <ExternalLink className="w-3 h-3 text-emerald-600 opacity-70" />
            </a>
          )}

          <input
            ref={pdfFileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleUploadOfficialPdf}
          />
          <button
            type="button"
            disabled={isUploadingPdf}
            onClick={() => pdfFileInputRef.current?.click()}
            className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer disabled:opacity-50"
            title="Archivar el archivo PDF oficial resultante en la nube de Supabase"
          >
            {isUploadingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0369A1]" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 text-[#0369A1]" />
            )}
            <span>{isUploadingPdf ? 'Archivando...' : patient?.pdfUrl ? 'Reemplazar PDF' : 'Archivar PDF en Nube'}</span>
          </button>

          {viewFormat === 'blank' ? (
            <a
              href="/PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx"
              download="PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx"
              className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer"
              title="Descargar la plantilla Word (.docx) oficial 100% limpia con sellos intactos"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Plantilla Word (.docx)</span>
              <span className="md:hidden">Word</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => downloadPatientDocx(patient, { globalDate: patient?.fechaEvaluacion, globalClub: patient?.club })}
              className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer"
              title="Descargar el documento Word (.docx) oficial con la plantilla limpia y todos los sellos médicos intactos"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Word Oficial (.docx)</span>
              <span className="md:hidden">Word</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center space-x-1 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs px-3 py-1.5 rounded-md shadow-xs transition cursor-pointer"
            title="Imprimir el expediente de 18 páginas o guardar como PDF"
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
          {viewFormat === 'blank' ? (
            <span className="text-[#B45309] font-medium">Plantilla oficial limpia (18 páginas, cero datos previos)</span>
          ) : (
            <span>
              Expediente: <strong className="text-[#1E293B]">{patient?.nombreCompleto || 'Futbolista'}</strong>
            </span>
          )}
        </div>
      </div>

      {/* MESA DE TRABAJO NEUTRAL PARA VISUALIZACIÓN DE HOJA A4 */}
      <div className="no-print bg-slate-200/90 border border-[#CBD5E1] rounded-lg p-4 sm:p-8 flex justify-center overflow-x-auto shadow-inner">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150"
        >
          {viewMode === 'single' ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewFormat}-${currentPage}`}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.12 }}
                className="w-[210mm] h-[297mm] min-h-[297mm] bg-white text-black shadow-lg shadow-slate-400/50 rounded-xs border border-slate-300 p-0 flex flex-col justify-between relative overflow-hidden select-none"
              >
                <PageContentRenderer
                  pageNumber={currentPage}
                  patient={patient}
                  viewFormat={viewFormat}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Vista 18 Páginas Continuas */
            <div className="space-y-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <div
                  key={pNum}
                  className="w-[210mm] h-[297mm] min-h-[297mm] bg-white text-black shadow-lg shadow-slate-400/50 rounded-xs border border-slate-300 p-0 flex flex-col justify-between relative overflow-hidden"
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

      {viewFormat !== 'blank' && onUpdatePatient && (
        <AttachmentSlots patient={patient} onUpdatePatient={onUpdatePatient} />
      )}

      {/* CONTENEDOR EXCLUSIVO DE IMPRESIÓN OFICIAL (18 PÁGINAS PURAS 1:1) */}
      <div className="print-only">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
          <div
            key={pNum}
            className="print-page w-[210mm] h-[297mm] max-h-[297mm] bg-white text-black relative overflow-hidden"
          >
            <PageContentRenderer
              pageNumber={pNum}
              patient={patient}
              viewFormat={isBlankMode || viewFormat === 'blank' ? 'blank' : 'facsimile'}
            />
          </div>
        ))}
      </div>

      {/* ÍNDICE SECCIONADO EN 5 FASES CLÍNICAS */}
      <div className="no-print bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#0369A1]" />
            Índice de Secciones del Expediente de 18 Páginas
          </h3>
          <span className="text-[11px] text-[#64748B]">Haz clic en cualquier página para navegar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {documentPhases.map((phase, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-md border border-[#E2E8F0] space-y-2">
              <div className="text-xs font-bold text-[#1E293B] leading-tight">{phase.title}</div>
              <p className="text-[10px] text-[#64748B] leading-tight">{phase.desc}</p>

              <div className="flex flex-wrap gap-1 pt-1">
                {phase.pages.map((num) => (
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

  return <FacsimileOfficialPage pageNumber={pageNumber} patient={patient} />;
}

// Renderizador Facsímil 1:1 Oficial sobre la Plantilla Limpia de 18 Páginas (derivada de PONCE ECHEVARRIA CARLOS.docx)
function FacsimileOfficialPage({ pageNumber, patient }) {
  const formattedPage = pageNumber.toString().padStart(2, '0');
  const rawFull =
    patient?.nombreCompleto ||
    `${patient?.apellidos || ''} ${patient?.nombres || ''}`.trim() ||
    'FUTBOLISTA';
  const cleanName = rawFull.toUpperCase();
  const cleanDate = patient?.fechaEvaluacion || '22-01-2026';
  const cleanClub = (patient?.club || 'Club FPF / Liga Formativa').toUpperCase();
  const cleanPaisClub = (patient?.paisClub || 'PERÚ').toUpperCase();
  const cleanBirthDate = patient?.fechaNacimiento || '18-09-2004';
  const cleanPosicion = (patient?.posicion || 'VOLANTE').toUpperCase();

  let apellidosBox = (patient?.apellidos || '').trim().toUpperCase();
  let nombresBox = (patient?.nombres || '').trim().toUpperCase();
  if (!apellidosBox && cleanName) {
    const tokens = cleanName.split(/\s+/);
    if (tokens.length >= 3) {
      apellidosBox = tokens.slice(0, 2).join(' ');
      nombresBox = tokens.slice(2).join(' ');
    } else if (tokens.length === 2) {
      apellidosBox = tokens[0];
      nombresBox = tokens[1];
    } else {
      apellidosBox = cleanName;
      nombresBox = '-';
    }
  }

  const rawPeso = String(patient?.peso || '71').trim();
  const formattedPeso = /kg/i.test(rawPeso) ? rawPeso : `${rawPeso} Kg`;
  const rawTalla = String(patient?.talla || '1.75').trim();
  const formattedTalla = /cm/i.test(rawTalla) ? rawTalla : `${rawTalla} Cm`;

  // PÁGINA 1: FICHA DE EVALUACIÓN MÉDICA PRE-COMPETENCIA (PCMA)
  if (pageNumber === 1) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_01.png"
          alt="Evaluación Médica Pre-Competencia Página 1"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[38%]"
          style={{ top: '55.32%', left: '11.21%' }}
        >
          {apellidosBox}
        </div>
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[34%]"
          style={{ top: '55.14%', left: '57.08%' }}
        >
          {nombresBox || '-'}
        </div>
        <div
          className="absolute fpf-doc-text uppercase"
          style={{ top: '65.40%', left: '10.32%' }}
        >
          {cleanBirthDate}
        </div>
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[34%]"
          style={{ top: '65.40%', left: '57.08%' }}
        >
          {cleanPosicion}
        </div>
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[38%]"
          style={{ top: '77.14%', left: '10.32%' }}
        >
          {cleanClub}
        </div>
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[34%]"
          style={{ top: '77.14%', left: '57.08%' }}
        >
          {cleanPaisClub}
        </div>
      </div>
    );
  }

  // PÁGINA 2: HISTORIA CLÍNICA PRE-PARTICIPATIVA I (14 CHECKS EN COLUMNA "NO")
  if (pageNumber === 2) {
    const p2Tops = [
      '32.55%', '35.30%', '38.15%', '41.10%', '44.12%', '46.97%',
      '59.36%', '62.02%', '65.06%',
      '76.99%', '80.03%', '82.97%', '86.00%', '88.85%'
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_02.png"
          alt="Historia Pre-Participativa I Página 2"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p2Tops.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top, left: '93.45%' }}>
            X
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 3: HISTORIA CLÍNICA PRE-PARTICIPATIVA II (FÁRMACOS Y SUPLEMENTOS)
  if (pageNumber === 3) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_03.png"
          alt="Fármacos y Suplementos Página 3"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div className="absolute fpf-doc-text uppercase" style={{ top: '31.02%', left: '12.84%' }}>
          NINGUNO
        </div>
        <div className="absolute fpf-doc-text uppercase" style={{ top: '71.10%', left: '12.84%' }}>
          NINGUNO
        </div>
      </div>
    );
  }

  // PÁGINA 4: SISTEMA MÚSCULO-ESQUELÉTICO I (20 "NIEGA")
  if (pageNumber === 4) {
    const p4Tops = [
      '29.15%', '32.09%', '35.11%', '37.96%', '40.91%', '43.85%', '46.40%', '49.36%', '52.32%', '55.07%', '57.80%', '60.68%', '63.45%',
      '78.23%', '81.27%', '83.85%', '86.78%', '89.55%', '92.23%', '95.31%'
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_04.png"
          alt="Sistema Músculo-Esquelético I Página 4"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p4Tops.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text uppercase" style={{ top, left: '83.50%' }}>
            NIEGA
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 5: SISTEMA MÚSCULO-ESQUELÉTICO II (6 "NIEGA" + 7 "NORMAL")
  if (pageNumber === 5) {
    const p5Niega = ['17.29%', '20.24%', '23.09%', '25.67%', '28.44%', '31.46%'];
    const p5Normal = ['79.49%', '82.25%', '85.27%', '88.08%', '90.80%', '93.66%', '96.76%'];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_05.png"
          alt="Sistema Músculo-Esquelético II Página 5"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p5Niega.map((top, idx) => (
          <div key={`n-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '84.05%' }}>
            NIEGA
          </div>
        ))}
        {p5Normal.map((top, idx) => (
          <div key={`ok-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '84.05%' }}>
            NORMAL
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 6: EXAMEN FÍSICO PRE-PARTICIPATIVO (PESO, TALLA Y PULSOS)
  if (pageNumber === 6) {
    const p6Normal = ['17.29%', '20.14%', '23.18%', '26.20%', '29.02%', '31.73%'];
    const p6Checks = [
      '53.39%', '56.32%', '58.99%', '61.84%', '64.79%', '67.45%', '70.30%',
      '78.50%', '81.44%', '84.21%', '87.33%', '90.09%', '92.67%', '95.44%'
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_06.png"
          alt="Examen Físico Pre-Participativo Página 6"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p6Normal.map((top, idx) => (
          <div key={`norm-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '83.73%' }}>
            NORMAL
          </div>
        ))}
        <div className="absolute fpf-doc-text" style={{ top: '41.71%', left: '12.72%' }}>
          {formattedPeso}
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '41.94%', left: '45.14%' }}>
          {formattedTalla}
        </div>
        {p6Checks.map((top, idx) => (
          <div key={`chk-${idx}`} className="absolute fpf-doc-text" style={{ top, left: '47.85%' }}>
            X
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 7: ECG REPOSO - PROTOCOLO CONMEBOL (1 "SI" EN NORMAL + 19 "NO")
  if (pageNumber === 7) {
    const p7NoTops = [
      '34.23%', '37.25%', '40.29%', '43.05%', '45.90%', '48.85%', '51.60%', '54.46%', '57.39%',
      '65.86%', '68.79%', '71.56%', '74.50%', '77.16%',
      '86.07%', '89.11%', '91.87%', '94.73%', '97.58%'
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_07.png"
          alt="ECG Reposo CONMEBOL Página 7"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div className="absolute fpf-doc-text" style={{ top: '24.77%', left: '33.77%' }}>
          X
        </div>
        {p7NoTops.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top, left: '93.00%' }}>
            X
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 8: ECOCARDIOGRAMA M-2D Y DOPPLER CONMEBOL (SELLO EN PLANTILLA BASE)
  if (pageNumber === 8) {
    const p8Checks = [
      '20.24%', '23.18%', '26.03%', '28.88%', '31.82%',
      '34.67%', '37.43%', '40.29%', '43.22%', '46.07%'
    ];
    const p8Values = [
      { top: '59.80%', val: '26' },
      { top: '62.38%', val: '31' },
      { top: '65.50%', val: '32' },
      { top: '68.35%', val: '29' },
      { top: '71.10%', val: '32' },
      { top: '73.87%', val: '27' },
      { top: '76.72%', val: '44' },
      { top: '79.49%', val: '10' },
      { top: '82.34%', val: '10' },
      { top: '85.27%', val: '64/32' },
      { top: '88.04%', val: 'N' },
      { top: '90.89%', val: '25' },
      { top: '93.66%', val: 'N' },
      { top: '96.24%', val: 'N' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_08.png"
          alt="Ecocardiograma M-2D y Doppler Página 8"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p8Checks.map((top, idx) => (
          <div key={`c-${idx}`} className="absolute fpf-doc-text" style={{ top, left: '92.90%' }}>
            X
          </div>
        ))}
        {p8Values.map((item, idx) => (
          <div key={`v-${idx}`} className="absolute fpf-doc-text" style={{ top: item.top, left: '59.40%' }}>
            {item.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 9: ECOCARDIOGRAMA CONCLUSIONES CONMEBOL (SELLO EN PLANTILLA BASE)
  if (pageNumber === 9) {
    const p9Findings = [
      { top: '17.29%', val: 'N' },
      { top: '20.33%', val: 'N' },
      { top: '23.26%', val: 'N' },
      { top: '25.86%', val: '5/9' },
      { top: '28.61%', val: '4/8' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_09.png"
          alt="Ecocardiograma Conclusiones Página 9"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p9Findings.map((item, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: item.top, left: '58.60%' }}>
            {item.val}
          </div>
        ))}
        <div className="absolute fpf-doc-text" style={{ top: '48.57%', left: '13.23%' }}>
          ECOCARDIOGRAMA DENTRO DE LIMITES NORMALES.
        </div>
      </div>
    );
  }

  // PÁGINA 10: RESULTADOS ANÁLISIS DE SANGRE FPF
  if (pageNumber === 10) {
    const p10Values = [
      { top: '29.15%', val: '13.8' },
      { top: '32.09%', val: '42' },
      { top: '34.50%', val: '4.620' },
      { top: '37.61%', val: '364' },
      { top: '40.56%', val: '6.241' },
      { top: '43.49%', val: '135' },
      { top: '46.26%', val: '4.4' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_10.png"
          alt="Resultados Análisis de Sangre Página 10"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p10Values.map((item, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: item.top, left: '27.55%' }}>
            {item.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 11: RESUMEN DE LA EVALUACIÓN PRE-PARTICIPATIVA (MÉDICO, FAMIHEART Y SELLO YA EN PLANTILLA BASE)
  if (pageNumber === 11) {
    const p11Checks = ['27.27%', '30.22%', '32.90%', '38.32%', '54.17%'];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_11.png"
          alt="Resumen Evaluación Pre-Participativa Página 11"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p11Checks.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top, left: '73.10%' }}>
            X
          </div>
        ))}
        <div
          className="absolute uppercase font-bold text-black"
          style={{ top: '67.51%', left: '49.85%', fontFamily: 'Calibri, Arial, sans-serif', fontSize: '15px' }}
        >
          SI
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '89.73%', left: '9.19%' }}>
          {cleanDate}
        </div>
      </div>
    );
  }

  // PÁGINA 12: CERTIFICADO MÉDICO FAMIHEART (SOBRE MEMBRETE + SELLO PURO page_12_base.png)
  if (pageNumber === 12) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_12_base.png"
          alt="Certificado Médico Famiheart Página 12"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute text-justify text-black"
          style={{
            top: '28.28%',
            left: '14.30%',
            width: '71.40%',
            fontFamily: "'Berlin Sans FB', Calibri, 'Segoe UI', Arial, sans-serif",
            fontSize: '26px',
            lineHeight: 1.32
          }}
        >
          El médico que suscribe certifica que el paciente{' '}
          <strong className="uppercase font-bold">{cleanName}</strong> ha sido evaluado con exámenes de Rx de Tórax,
          hematología, electrocardiograma y ecocardiografía, los cuales se encuentran dentro de los límites normales y
          siendo asintomático cardiovascular, sin antecedentes, se encuentra apto para realizar actividad física sin
          restricciones.
        </div>
        <div
          className="absolute font-bold text-black"
          style={{
            top: '68.24%',
            left: '14.30%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '18px'
          }}
        >
          Atte.
        </div>
        <div className="absolute fpf-doc-date-16" style={{ top: '75.63%', left: '14.30%' }}>
          {cleanDate}
        </div>
      </div>
    );
  }

  // PÁGINA 13: INFORME ECOCARDIOGRÁFICO FAMIHEART (SOBRE LÍNEAS LIMPIAS DE page_13.png)
  if (pageNumber === 13) {
    const p13Measurements = [
      { top: '35.55%', left: '32.50%', val: '24' },
      { top: '35.55%', left: '66.50%', val: '26' },
      { top: '36.86%', left: '33.80%', val: '10' },
      { top: '36.86%', left: '68.30%', val: '22' },
      { top: '38.16%', left: '29.50%', val: '44' },
      { top: '39.47%', left: '29.50%', val: '24' },
      { top: '40.76%', left: '31.50%', val: '10' },
      { top: '42.08%', left: '31.50%', val: '32' },
      { top: '46.19%', left: '31.50%', val: '64' },
      { top: '46.19%', left: '67.50%', val: '99' },
      { top: '47.49%', left: '33.00%', val: '33' },
      { top: '47.49%', left: '67.50%', val: '76' },
      { top: '55.53%', left: '35.50%', val: '1.2' },
      { top: '56.84%', left: '35.50%', val: '2.4' },
      { top: '56.84%', left: '73.30%', val: '0.7' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_13.png"
          alt="Informe Ecocardiográfico Página 13"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute uppercase text-black truncate"
          style={{
            top: '28.58%',
            left: '20.08%',
            maxWidth: '23.2%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: cleanName.length > 26 ? '11.5px' : '13px',
            lineHeight: 1.15
          }}
        >
          {cleanName}
        </div>
        <div
          className="absolute text-black"
          style={{
            top: '30.18%',
            left: '20.08%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '12px',
            lineHeight: 1.15
          }}
        >
          {cleanDate}
        </div>
        {p13Measurements.map((m, idx) => (
          <div
            key={idx}
            className="absolute text-black"
            style={{
              top: m.top,
              left: m.left,
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '12px',
              lineHeight: 1.1
            }}
          >
            {m.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 14: ANEXO DE IMÁGENES ECOCARDIOGRAMA DOPPLER 2D Y MODO M
  if (pageNumber === 14) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_14.png"
          alt="Anexo Imágenes Ecocardiograma Página 14"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Captura Superior: Eco 2D / Doppler */}
        <div
          className="absolute overflow-hidden"
          style={{ top: '22.49%', left: '14.29%', width: '71.42%', height: '30.83%' }}
        >
          <img
            src={patient?.attachments?.eco2d?.url || '/assets/echo_sample_2d.png'}
            alt="Ecocardiograma 2D Doppler"
            className="w-full h-full object-contain bg-black/95 rounded-2xs"
          />
        </div>
        {/* Captura Inferior: Eco M-Mode / Flujos */}
        <div
          className="absolute overflow-hidden"
          style={{ top: '62.44%', left: '14.94%', width: '71.42%', height: '31.73%' }}
        >
          <img
            src={patient?.attachments?.ecoMmode?.url || '/assets/echo_sample_mmode.png'}
            alt="Ecocardiograma M-Mode"
            className="w-full h-full object-contain bg-black/95 rounded-2xs"
          />
        </div>
      </div>
    );
  }

  // PÁGINA 15: ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES) CON SELLO CARDIÓLOGO
  if (pageNumber === 15) {
    const hasCustomEcg = Boolean(patient?.attachments?.ecg?.url);
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_15.png"
          alt="Electrocardiograma 12 Derivaciones Página 15"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* Trazado ECG */}
        <div
          className="absolute overflow-hidden"
          style={{ top: '24.35%', left: '14.28%', width: '71.42%', height: '72.10%' }}
        >
          <img
            src={patient?.attachments?.ecg?.url || '/assets/ecg_sample_strip.png'}
            alt="Trazado ECG 12 Derivaciones"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Cuando se usa la tira limpia base, superponer Nombre, Fecha y Dictamen NORMAL */}
        {!hasCustomEcg && (
          <>
            <div
              className="absolute uppercase text-black font-semibold truncate max-w-[46%]"
              style={{
                top: '25.58%',
                left: '18.14%',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9.5px',
                lineHeight: 1.1
              }}
            >
              NAME: {cleanName}
            </div>
            <div
              className="absolute text-black font-semibold"
              style={{
                top: '28.49%',
                left: '67.54%',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '9.5px',
                lineHeight: 1.1
              }}
            >
              DATE: {cleanDate}
            </div>
            <div className="absolute fpf-doc-text" style={{ top: '84.29%', left: '44.09%' }}>
              NORMAL
            </div>
          </>
        )}
        {/* Sello transparente del Cardiólogo sobre la esquina inferior derecha */}
        <img
          src="/assets/sello-alfredo-vega-transparent.png"
          alt="Sello Cardiólogo"
          className="absolute object-contain pointer-events-none"
          style={{ top: '85.60%', left: '72.15%', width: '8.82%', height: '7.93%' }}
        />
      </div>
    );
  }

  // PÁGINA 16: HEMOGRAMA COMPLETO (LABORATORIO CLÍNICO FAMIHEART)
  if (pageNumber === 16) {
    if (patient?.attachments?.laboratorio?.url) {
      return (
        <div className="w-full h-full relative select-none">
          <img
            src="/assets/pages_blank/page_16.png"
            alt="Membrete Laboratorio Página 16"
            className="w-full h-full object-contain pointer-events-none block"
          />
          <div
            className="absolute bg-white flex items-center justify-center overflow-hidden"
            style={{ top: '22.00%', left: '10.00%', width: '80.00%', height: '73.00%' }}
          >
            <img
              src={patient.attachments.laboratorio.url}
              alt="Laboratorio Clínico Adjunto"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      );
    }

    const p16Hemograma = [
      { top: '38.80%', left: '54.32%', val: '4.620,000.00' },
      { top: '40.58%', left: '60.85%', val: '13.8' },
      { top: '44.15%', left: '62.26%', val: '42' },
      { top: '47.71%', left: '57.58%', val: '6,241.00' },
      { top: '52.69%', left: '58.04%', val: '199.000' },
      { top: '56.25%', left: '62.26%', val: '97' },
      { top: '58.03%', left: '62.26%', val: '30' },
      { top: '59.81%', left: '62.26%', val: '31' },
      { top: '65.16%', left: '62.26%', val: '35' },
      { top: '66.94%', left: '63.20%', val: '1' },
      { top: '68.72%', left: '63.20%', val: '3' },
      { top: '70.50%', left: '63.20%', val: '0' },
      { top: '72.29%', left: '62.26%', val: '61' },
      { top: '74.07%', left: '63.20%', val: '0' }
    ];

    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_16.png"
          alt="Hemograma Completo Página 16"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[39%]"
          style={{ top: '24.73%', left: '30.80%' }}
        >
          {cleanName}
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '31.68%', left: '79.70%' }}>
          {cleanDate}
        </div>
        {p16Hemograma.map((row, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: row.top, left: row.left }}>
            {row.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 17: INFORME RADIOGRAFÍA DE TÓRAX
  if (pageNumber === 17) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_17.png"
          alt="Informe Radiografía de Tórax Página 17"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[50%]"
          style={{ top: '29.08%', left: '35.55%' }}
        >
          {cleanName}
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '32.39%', left: '35.49%' }}>
          {cleanDate}
        </div>
      </div>
    );
  }

  // PÁGINA 18: ANEXO PLACA DIGITAL DE RAYOS X DE TÓRAX
  if (pageNumber === 18) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_18.png"
          alt="Radiografía de Tórax Placa Página 18"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute overflow-hidden"
          style={{ top: '30.17%', left: '14.29%', width: '71.42%', height: '37.59%' }}
        >
          <img
            src={patient?.attachments?.rayosX?.url || '/assets/rx_sample_clean.jpeg'}
            alt="Placa Radiográfica de Tórax"
            className="w-full h-full object-contain bg-black rounded-2xs"
          />
        </div>
      </div>
    );
  }

  return <CleanTemplatePage pageNumber={pageNumber} />;
}

// Plantilla limpia en blanco (Carga las 18 páginas oficiales limpias sin datos personales)
function CleanTemplatePage({ pageNumber }) {
  const formattedPage = pageNumber.toString().padStart(2, '0');

  return (
    <div className="w-full h-full relative select-none">
      <img
        src={`/assets/pages_blank/page_${formattedPage}.png`}
        alt={`Plantilla Oficial Limpia Página ${pageNumber}`}
        className="w-full h-full object-contain pointer-events-none block"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}
