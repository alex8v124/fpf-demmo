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
  ExternalLink,
  FileText
} from 'lucide-react';
import { pagesCatalog } from '../data/initialData';
import { downloadPatientDocx } from '../utils/docxGenerator';
import { uploadPatientPdf } from '../lib/supabase';
import AttachmentSlots from './AttachmentSlots';
import { downloadAndOpenPatientPdf } from '../utils/pdfGenerator';

export const TOTAL_EXPEDIENTE_PAGES = 19;

/**
 * Contenedor dedicado de impresión A4 montado en la raíz de App.jsx (fuera de .no-print y transforms)
 * para garantizar que el botón "Imprimir PDF" funcione desde CUALQUIER pestaña de la plataforma
 * generando exactamente las 19 páginas limpias sin hojas grises ni desplazamientos verticales.
 */
export function PrintExpedienteDocument({ patient, isBlankMode }) {
  return (
    <div className="print-only m-0 p-0">
      {Array.from({ length: TOTAL_EXPEDIENTE_PAGES }, (_, i) => i + 1).map((pNum) => (
        <div
          key={pNum}
          className="print-page w-[210mm] h-[297mm] max-h-[297mm] bg-white text-black relative overflow-hidden"
        >
          <PageContentRenderer
            pageNumber={pNum}
            patient={patient}
            viewFormat={isBlankMode ? 'blank' : 'facsimile'}
          />
        </div>
      ))}
    </div>
  );
}

export default function DocumentViewer({
  patient,
  isBlankMode,
  setIsBlankMode,
  onUpdatePatient,
  onNavigateTab,
  onPrint
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' | 'all'
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewFormat, setViewFormat] = useState(isBlankMode ? 'blank' : 'facsimile'); // 'facsimile' | 'blank'
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);
  const pdfFileInputRef = React.useRef(null);

  const totalPages = TOTAL_EXPEDIENTE_PAGES;

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

  // 5 Fases Clínicas Oficiales del Expediente Limpio de 19 Páginas
  const documentPhases = [
    { title: 'Fase 1: Certificado y PCMA', pages: [1, 2], desc: 'Certificado Médico FPF y ficha pre-competencia' },
    { title: 'Fase 2: Anamnesis y Examen', pages: [3, 4, 5, 6, 7], desc: 'Historia cardiovascular, lesiones, somatometría y signos' },
    { title: 'Fase 3: Cardiología CONMEBOL', pages: [8, 9, 10], desc: 'ECG reposo y Ecocardiograma M-2D / Doppler' },
    { title: 'Fase 4: Dictamen y Aptitud', pages: [11, 12, 13], desc: 'Bioquímica FPF, resumen comisión y Certificado Famiheart' },
    { title: 'Fase 5: Informes e Imágenes', pages: [14, 15, 16, 17, 18, 19], desc: 'Informe Eco, ultrasonidos, ECG, Hemograma y Rayos X' }
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
            title="Expediente oficial de 19 páginas con plantilla limpia original y datos superpuestos"
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
            title="Plantilla oficial limpia de 19 páginas sin datos personales"
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
              19 Págs
            </button>
          </div>
        </div>

        {/* Acciones de Descarga e Impresión */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('editor')}
              className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-[#0369A1] font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer"
              title="Editar datos clínicos del jugador en el Editor Pre-Competencia FPF"
            >
              <FileText className="w-3.5 h-3.5 text-[#0369A1]" />
              <span>Editar Ficha</span>
            </button>
          )}

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

          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={async () => {
              setIsGeneratingPdf(true);
              try {
                await downloadAndOpenPatientPdf(patient);
              } catch (e) {
                window.alert('Error generando PDF: ' + e.message);
              } finally {
                setIsGeneratingPdf(false);
              }
            }}
            className="flex items-center space-x-1.5 bg-[#0369A1] hover:bg-[#075985] text-white font-semibold text-xs px-3 py-1.5 rounded-md transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Genera el expediente de 19 páginas con los 5 estudios médicos, lo abre automáticamente y lo descarga"
          >
            {isGeneratingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF (19P)'}</span>
          </button>

          {viewFormat === 'blank' ? (
            <a
              href="/PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx"
              download="PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.docx"
              className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-md transition border border-[#CBD5E1] cursor-pointer"
              title="Descargar la plantilla Word (.docx) oficial de 19 páginas 100% limpia con sellos intactos"
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
              title="Descargar el documento Word (.docx) oficial de 19 páginas con la plantilla limpia y todos los sellos médicos intactos"
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
            title="Imprimir el expediente de 19 páginas o guardar como PDF"
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
            <span className="text-[#B45309] font-medium">Plantilla oficial limpia (19 páginas, cero datos previos)</span>
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
            /* Vista 19 Páginas Continuas */
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

      {/* ÍNDICE SECCIONADO EN 5 FASES CLÍNICAS */}
      <div className="no-print bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#0369A1]" />
            Índice de Secciones del Expediente de 19 Páginas
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

// Renderizador Facsímil 1:1 Oficial sobre la Plantilla Limpia de 19 Páginas
// (Página 1: Certificado Médico FPF + Páginas 2..19: Protocolo PONCE limpio con sellos originales)
function FacsimileOfficialPage({ pageNumber, patient }) {
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

  const medicoCert = (patient?.medicoEvaluador || 'DARIO HERNANDEZ')
    .replace(/^DR\.?\s*/i, '')
    .trim()
    .toUpperCase();
  const cmpCert = String(patient?.medicoCmp || '27503').trim();
  const domicilioClinica = (patient?.domicilioClinica || 'AV CONQUISTADORES 1588 SAN ISIDRO')
    .trim()
    .toUpperCase();
  const numeroRecibo = String(patient?.numeroRecibo || patient?.receiptNum || '').trim();
  const aptitudText = patient?.aptitudDetalle
    ? patient.aptitudDetalle.trim().toUpperCase()
    : patient?.estadoAptitud === 'NO APTO'
      ? 'NO APTO PARA REALIZAR ACTIVIDAD DEPORTIVA COMPETITIVA ( FUTBOL )'
      : patient?.estadoAptitud === 'EN OBSERVACIÓN'
        ? 'EN OBSERVACION MEDICA PRE-COMPETENCIA ( FUTBOL )'
        : 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )';

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

  const pesoNum = parseFloat(rawPeso.replace(/[^\d.]/g, ''));
  const tallaNum = parseFloat(rawTalla.replace(/[^\d.]/g, ''));
  const computedImc =
    patient?.imc ||
    (!isNaN(pesoNum) && !isNaN(tallaNum) && tallaNum > 0
      ? (pesoNum / (tallaNum > 3 ? (tallaNum / 100) ** 2 : tallaNum ** 2)).toFixed(1)
      : '23.2');

  const eco = patient?.ecocardiograma || {};
  const hemo = patient?.laboratorio?.hemograma || {};
  const bioq = patient?.laboratorio?.bioquimica || {};

  // PÁGINA 1: CARA INICIAL OFICIAL — CERTIFICADO MÉDICO FEDERACIÓN PERUANA DE FÚTBOL
  if (pageNumber === 1) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_01_base.png"
          alt="Certificado Médico Federación Peruana de Fútbol Página 1"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {/* NOMBRE : */}
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[64%]"
          style={{ top: '14.65%', left: '23.20%' }}
        >
          {cleanName}
        </div>
        {/* CLUB : */}
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[64%]"
          style={{ top: '17.80%', left: '23.20%' }}
        >
          {cleanClub}
        </div>
        {/* MEDICO : */}
        <div
          className="absolute uppercase text-black truncate max-w-[42.5%]"
          style={{
            top: '20.85%',
            left: '23.20%',
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: '15.3px',
            lineHeight: 1.15
          }}
        >
          {medicoCert}
        </div>
        {/* CMP: */}
        <div
          className="absolute uppercase text-black"
          style={{
            top: '20.85%',
            left: '74.20%',
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: '15.3px',
            lineHeight: 1.15
          }}
        >
          {cmpCert}
        </div>
        {/* DOMICILIO: */}
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[64%]"
          style={{ top: '24.22%', left: '23.20%' }}
        >
          {domicilioClinica}
        </div>

        {/* Bloque Clínico RTP */}
        <div
          className="absolute text-black uppercase"
          style={{
            top: '35.50%',
            left: '15.50%',
            width: '69.00%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '14.67px',
            lineHeight: 1.72
          }}
        >
          <div>QUIEN AL EXAMEN CLINICO PRESENTA:</div>
          <div>ARER</div>
          <div>AREN</div>
          <div>NO SOPLOS</div>
          <div>VIAS AEREAS LIBRES</div>
          <div style={{ marginTop: '14px' }}>{aptitudText}</div>
        </div>

        {/* FECHA */}
        <div
          className="absolute fpf-doc-text text-center"
          style={{ top: '83.20%', left: '53.68%', width: '31.00%' }}
        >
          {cleanDate}
        </div>

        {/* NUMERO DE RECIBO : */}
        {numeroRecibo && (
          <div
            className="absolute uppercase text-black"
            style={{
              top: '91.15%',
              left: '30.80%',
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '13px',
              lineHeight: 1.15
            }}
          >
            {numeroRecibo}
          </div>
        )}
      </div>
    );
  }

  // PÁGINA 2: FICHA DE EVALUACIÓN MÉDICA PRE-COMPETENCIA (PCMA)
  if (pageNumber === 2) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_02.png"
          alt="Evaluación Médica Pre-Competencia Página 2"
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

  // PÁGINA 3: HISTORIA CLÍNICA PRE-PARTICIPATIVA I (14 CRITERIOS REACTIVOS SI / NO)
  if (pageNumber === 3) {
    const p3Rows = [
      { top: '32.55%', yes: Boolean(patient?.cardioPersonal?.dolorToracico) },
      { top: '35.30%', yes: Boolean(patient?.cardioPersonal?.lipotimiaSincope) },
      { top: '38.15%', yes: Boolean(patient?.cardioPersonal?.disneaFatiga) },
      { top: '41.10%', yes: Boolean(patient?.cardioPersonal?.soploCardiaco) },
      { top: '44.12%', yes: Boolean(patient?.cardioPersonal?.hipertensionArterial) },
      { top: '46.97%', yes: Boolean(patient?.cardioPersonal?.restriccionPrevia) },
      { top: '59.36%', yes: Boolean(patient?.cardioFamiliar?.muerteSubita50) },
      { top: '62.02%', yes: Boolean(patient?.cardioFamiliar?.enfermedadCoronaria50) },
      { top: '65.06%', yes: Boolean(patient?.cardioFamiliar?.cardiopatiaRiesgo) },
      { top: '76.99%', yes: Boolean(patient?.cardioGeneral?.cirugiasNoTrauma) },
      { top: '80.03%', yes: Boolean(patient?.cardioGeneral?.hospitalizacionesNoQuirurgicas) },
      { top: '82.97%', yes: Boolean(patient?.cardioGeneral?.tec) },
      { top: '86.00%', yes: Boolean(patient?.cardioGeneral?.asmaBronquial) },
      { top: '88.85%', yes: Boolean(patient?.cardioGeneral?.otraPatologia) }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_03.png"
          alt="Historia Pre-Participativa I Página 3"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p3Rows.map((row, idx) => (
          <div
            key={idx}
            className="absolute fpf-doc-text"
            style={{ top: row.top, left: row.yes ? '81.85%' : '93.55%' }}
          >
            X
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 4: HISTORIA CLÍNICA PRE-PARTICIPATIVA II (FÁRMACOS Y SUPLEMENTOS REACTIVOS)
  if (pageNumber === 4) {
    const farmacoTxt = (patient?.farmacos?.[0]?.nombre || '').trim() || 'NINGUNO';
    const suplementoTxt = (patient?.suplementos?.[0]?.nombre || '').trim() || 'NINGUNO';
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_04.png"
          alt="Fármacos y Suplementos Página 4"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[75%]"
          style={{ top: '31.02%', left: '12.84%' }}
        >
          {farmacoTxt}
        </div>
        <div
          className="absolute fpf-doc-text uppercase truncate max-w-[75%]"
          style={{ top: '71.10%', left: '12.84%' }}
        >
          {suplementoTxt}
        </div>
      </div>
    );
  }

  // PÁGINA 5: SISTEMA MÚSCULO-ESQUELÉTICO I (13 OPERACIONES + 7 LESIONES GRAVES REACTIVAS)
  if (pageNumber === 5) {
    const opZonas = [
      { zona: 'Hombro', top: '29.15%' },
      { zona: 'Codo', top: '32.09%' },
      { zona: 'Mano', top: '35.11%' },
      { zona: 'Columna', top: '37.96%' },
      { zona: 'Cadera', top: '40.91%' },
      { zona: 'Pubis', top: '43.85%' },
      { zona: 'Rodilla - Ligamento', top: '46.40%' },
      { zona: 'Rodilla - Meniscos', top: '49.36%' },
      { zona: 'Muslo', top: '52.32%' },
      { zona: 'Tobillo', top: '55.07%' },
      { zona: 'Pie', top: '57.80%' },
      { zona: 'Tendón Aquiles', top: '60.68%' },
      { zona: 'Otra', top: '63.45%' }
    ];
    const lesZonas = [
      { zona: 'Hombro', top: '78.23%' },
      { zona: 'Codo', top: '81.27%' },
      { zona: 'Mano', top: '83.85%' },
      { zona: 'Columna', top: '86.78%' },
      { zona: 'Cadera', top: '89.55%' },
      { zona: 'Pubis', top: '92.23%' },
      { zona: 'Rodilla - Ligamento', top: '95.31%' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_05.png"
          alt="Sistema Músculo-Esquelético I Página 5"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {opZonas.map((row, idx) => {
          const op =
            patient?.operaciones?.find((o) => o.zona === row.zona) || patient?.operaciones?.[idx];
          const fechaVal = (op?.fecha || '').trim() || 'NIEGA';
          return (
            <React.Fragment key={`op-${idx}`}>
              {op?.der && (
                <div className="absolute fpf-doc-text" style={{ top: row.top, left: '57.80%' }}>
                  X
                </div>
              )}
              {op?.izq && (
                <div className="absolute fpf-doc-text" style={{ top: row.top, left: '73.90%' }}>
                  X
                </div>
              )}
              <div
                className="absolute fpf-doc-text uppercase truncate max-w-[14%]"
                style={{ top: row.top, left: '83.50%' }}
              >
                {fechaVal}
              </div>
            </React.Fragment>
          );
        })}
        {lesZonas.map((row, idx) => {
          const les =
            patient?.lesionesGraves?.find((l) => l.zona === row.zona) ||
            patient?.lesionesGraves?.[idx];
          const fechaVal = (les?.fecha || '').trim() || 'NIEGA';
          return (
            <React.Fragment key={`les-${idx}`}>
              {les?.der && (
                <div className="absolute fpf-doc-text" style={{ top: row.top, left: '57.80%' }}>
                  X
                </div>
              )}
              {les?.izq && (
                <div className="absolute fpf-doc-text" style={{ top: row.top, left: '73.90%' }}>
                  X
                </div>
              )}
              <div
                className="absolute fpf-doc-text uppercase truncate max-w-[14%]"
                style={{ top: row.top, left: '83.50%' }}
              >
                {fechaVal}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // PÁGINA 6: SISTEMA MÚSCULO-ESQUELÉTICO II (6 "NIEGA" + 7 "NORMAL")
  if (pageNumber === 6) {
    const p6Niega = ['17.29%', '20.24%', '23.09%', '25.67%', '28.44%', '31.46%'];
    const p6Normal = ['79.49%', '82.25%', '85.27%', '88.08%', '90.80%', '93.66%', '96.76%'];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_06.png"
          alt="Sistema Músculo-Esquelético II Página 6"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p6Niega.map((top, idx) => (
          <div key={`n-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '84.05%' }}>
            NIEGA
          </div>
        ))}
        {p6Normal.map((top, idx) => (
          <div key={`ok-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '84.05%' }}>
            NORMAL
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 7: EXAMEN FÍSICO PRE-PARTICIPATIVO (PESO, TALLA, IMC, PULSO, PA Y EXAMEN SEGMENTARIO)
  if (pageNumber === 7) {
    const p7Normal = ['17.29%', '20.14%', '23.18%', '26.20%', '29.02%', '31.73%'];
    const gen = patient?.examenClinicoGeneral || {};
    const msk = patient?.examenMusculoEsqueletico || {};
    const p7Segmental = [
      { top: '53.39%', abnormal: gen.pulsoEstado === 'ANORMAL', desc: (patient?.pulso || '').trim() },
      { top: '56.32%', abnormal: gen.paEstado === 'ANORMAL', desc: (patient?.presionArterial || '').trim() },
      { top: '58.99%', abnormal: gen.cabeza === 'ANORMAL', desc: gen.cabeza === 'ANORMAL' ? 'OBS.' : '' },
      { top: '61.84%', abnormal: gen.cuello === 'ANORMAL', desc: gen.cuello === 'ANORMAL' ? 'OBS.' : '' },
      { top: '64.79%', abnormal: gen.toraxCorazon === 'ANORMAL', desc: gen.toraxCorazon === 'ANORMAL' ? 'OBS.' : '' },
      { top: '67.45%', abnormal: gen.toraxPulmonar === 'ANORMAL', desc: gen.toraxPulmonar === 'ANORMAL' ? 'OBS.' : '' },
      { top: '70.30%', abnormal: gen.abdomen === 'ANORMAL', desc: gen.abdomen === 'ANORMAL' ? 'OBS.' : '' },
      { top: '78.50%', abnormal: msk.columna === 'ANORMAL', desc: msk.columna === 'ANORMAL' ? 'OBS.' : '' },
      { top: '81.44%', abnormal: msk.codoMano === 'ANORMAL', desc: msk.codoMano === 'ANORMAL' ? 'OBS.' : '' },
      { top: '84.21%', abnormal: msk.columna === 'ANORMAL', desc: msk.columna === 'ANORMAL' ? 'OBS.' : '' },
      { top: '87.33%', abnormal: msk.caderaIngle === 'ANORMAL', desc: msk.caderaIngle === 'ANORMAL' ? 'OBS.' : '' },
      { top: '90.09%', abnormal: (msk.muslo || msk.rodilla) === 'ANORMAL', desc: '' },
      { top: '92.67%', abnormal: msk.rodilla === 'ANORMAL', desc: msk.rodilla === 'ANORMAL' ? 'OBS.' : '' },
      { top: '95.44%', abnormal: (msk.pierna || msk.rodilla) === 'ANORMAL', desc: '' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_07.png"
          alt="Examen Físico Pre-Participativo Página 7"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p7Normal.map((top, idx) => (
          <div key={`norm-${idx}`} className="absolute fpf-doc-text uppercase" style={{ top, left: '83.73%' }}>
            NORMAL
          </div>
        ))}
        <div className="absolute fpf-doc-text" style={{ top: '41.75%', left: '13.20%' }}>
          {formattedPeso}
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '41.85%', left: '45.14%' }}>
          {formattedTalla}
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '41.85%', left: '71.40%' }}>
          {computedImc}
        </div>
        {p7Segmental.map((row, idx) => (
          <React.Fragment key={`chk-${idx}`}>
            <div
              className="absolute fpf-doc-text"
              style={{ top: row.top, left: row.abnormal ? '64.35%' : '48.45%' }}
            >
              X
            </div>
            {row.desc && (
              <div
                className="absolute fpf-doc-text uppercase truncate max-w-[20%]"
                style={{ top: row.top, left: '74.50%', fontSize: '10.5px' }}
              >
                {row.desc}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // PÁGINA 8: ECG REPOSO - PROTOCOLO CONMEBOL (RESULTADO REACTIVO NORMAL / ANORMAL + 19 CRITERIOS)
  if (pageNumber === 8) {
    const isEcgAbnormal = (patient?.ekg?.resultadoGeneral || 'NORMAL').toUpperCase() === 'ANORMAL';
    const p8NoTops = [
      '34.23%', '37.25%', '40.29%', '43.05%', '45.90%', '48.85%', '51.60%', '54.46%', '57.39%',
      '65.86%', '68.79%', '71.56%', '74.50%', '77.16%',
      '86.07%', '89.11%', '91.87%', '94.73%', '97.58%'
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_08.png"
          alt="ECG Reposo CONMEBOL Página 8"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute fpf-doc-text"
          style={{ top: '24.77%', left: isEcgAbnormal ? '50.40%' : '33.77%' }}
        >
          X
        </div>
        {p8NoTops.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top, left: '93.55%' }}>
            X
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 9: ECOCARDIOGRAMA M-2D Y DOPPLER CONMEBOL (SELLO EN PLANTILLA BASE)
  if (pageNumber === 9) {
    const p9Checks = [
      '20.24%', '23.18%', '26.03%', '28.88%', '31.82%',
      '34.67%', '37.43%', '40.29%', '43.22%', '46.07%'
    ];
    const feviAcort = eco.fraccionEyeccion
      ? `${eco.fraccionEyeccion}/${eco.fraccionAcortamiento || '33'}`
      : '64/32';
    const p9Values = [
      { top: '59.80%', val: eco.aortaRaiz || '26' },
      { top: '62.38%', val: eco.aortaAscendente || '31' },
      { top: '65.50%', val: eco.auriculaIzquierda || '32' },
      { top: '68.35%', val: eco.auriculaIzquierdaArea || '29' },
      { top: '71.10%', val: eco.auriculaIzquierdaVol || '32' },
      { top: '73.87%', val: eco.auriculaDerechaArea || '27' },
      { top: '76.72%', val: eco.viDiastole || '44' },
      { top: '79.49%', val: eco.septumInterventricular || '10' },
      { top: '82.34%', val: eco.paredPosteriorVI || '10' },
      { top: '85.27%', val: feviAcort },
      { top: '88.04%', val: 'N' },
      { top: '90.89%', val: eco.ventriculoDerecho || '25' },
      { top: '93.66%', val: 'N' },
      { top: '96.24%', val: 'N' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_09.png"
          alt="Ecocardiograma M-2D y Doppler Página 9"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p9Checks.map((top, idx) => (
          <div key={`c-${idx}`} className="absolute fpf-doc-text" style={{ top, left: '93.45%' }}>
            X
          </div>
        ))}
        {p9Values.map((item, idx) => (
          <div key={`v-${idx}`} className="absolute fpf-doc-text" style={{ top: item.top, left: '60.10%' }}>
            {item.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 10: ECOCARDIOGRAMA CONCLUSIONES CONMEBOL (SELLO EN PLANTILLA BASE)
  if (pageNumber === 10) {
    const p10Findings = [
      { top: '17.29%', val: 'N' },
      { top: '20.33%', val: 'N' },
      { top: '23.26%', val: 'N' },
      { top: '25.86%', val: eco.eeMedial || '5/9' },
      { top: '28.61%', val: eco.eeLateral || '4/8' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_10.png"
          alt="Ecocardiograma Conclusiones Página 10"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p10Findings.map((item, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: item.top, left: '59.20%' }}>
            {item.val}
          </div>
        ))}
        <div className="absolute fpf-doc-text" style={{ top: '48.57%', left: '13.23%' }}>
          ECOCARDIOGRAMA DENTRO DE LIMITES NORMALES.
        </div>
      </div>
    );
  }

  // PÁGINA 11: RESULTADOS ANÁLISIS DE SANGRE FPF
  if (pageNumber === 11) {
    const p11Values = [
      { top: '29.15%', val: hemo.hemoglobina || '13.8' },
      { top: '32.09%', val: hemo.hematocrito || '42' },
      { top: '34.50%', val: hemo.globulosRojos || '4.620' },
      { top: '37.61%', val: hemo.plaquetas || '364' },
      { top: '40.56%', val: hemo.leucocitos || '6.241' },
      { top: '43.49%', val: bioq.sodio || '135' },
      { top: '46.26%', val: bioq.potasio || '4.4' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_11.png"
          alt="Resultados Análisis de Sangre Página 11"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p11Values.map((item, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: item.top, left: '28.10%' }}>
            {item.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 12: RESUMEN DE LA EVALUACIÓN PRE-PARTICIPATIVA (MÉDICO, FAMIHEART Y SELLO EN PLANTILLA BASE)
  if (pageNumber === 12) {
    const p12Checks = ['27.27%', '30.22%', '32.90%', '38.32%', '54.17%'];
    const aptStatus = (patient?.estadoAptitud || 'APTO').toUpperCase();
    const conclusionTop =
      aptStatus === 'NO APTO'
        ? '72.45%'
        : aptStatus === 'EN OBSERVACIÓN' || aptStatus === 'OBSERVADO'
          ? '69.90%'
          : '67.51%';
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_12.png"
          alt="Resumen Evaluación Pre-Participativa Página 12"
          className="w-full h-full object-contain pointer-events-none block"
        />
        {p12Checks.map((top, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top, left: '73.10%' }}>
            X
          </div>
        ))}
        <div
          className="absolute uppercase font-bold text-black"
          style={{
            top: conclusionTop,
            left: '49.85%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '15px'
          }}
        >
          SI
        </div>
        <div className="absolute fpf-doc-text" style={{ top: '89.73%', left: '9.19%' }}>
          {cleanDate}
        </div>
      </div>
    );
  }

  // PÁGINA 13: CERTIFICADO MÉDICO FAMIHEART (SOBRE MEMBRETE + SELLO PURO page_13_base.png)
  if (pageNumber === 13) {
    const aptStatus = (patient?.estadoAptitud || 'APTO').toUpperCase();
    const closingText =
      aptStatus === 'NO APTO'
        ? 'observándose hallazgos que ameritan evaluación complementaria, encontrándose temporalmente no apto para actividad física competitiva hasta el levantamiento de observaciones.'
        : aptStatus === 'EN OBSERVACIÓN' || aptStatus === 'OBSERVADO'
          ? 'encontrándose actualmente en observación médica preventiva con controles programados previo al alta deportiva sin restricciones.'
          : 'los cuales se encuentran dentro de los límites normales y siendo asintomático cardiovascular, sin antecedentes, se encuentra apto para realizar actividad física sin restricciones.';
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_13_base.png"
          alt="Certificado Médico Famiheart Página 13"
          className="w-full h-full object-contain pointer-events-none block"
        />
        <div
          className="absolute text-justify text-black"
          style={{
            top: '28.28%',
            left: '14.30%',
            width: '71.40%',
            fontFamily: "'Berlin Sans FB', Calibri, 'Segoe UI', Arial, sans-serif",
            fontSize: '23px',
            lineHeight: 1.35
          }}
        >
          El médico que suscribe certifica que el paciente{' '}
          <strong className="uppercase font-bold">{cleanName}</strong> ha sido evaluado con exámenes de Rx de Tórax,
          hematología, electrocardiograma y ecocardiografía, {closingText}
        </div>
        <div
          className="absolute font-bold text-black"
          style={{
            top: '65.50%',
            left: '14.30%',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '18px'
          }}
        >
          Atte.
        </div>
        <div className="absolute fpf-doc-date-16" style={{ top: '73.50%', left: '14.30%' }}>
          {cleanDate}
        </div>
      </div>
    );
  }

  // PÁGINA 14: INFORME ECOCARDIOGRÁFICO FAMIHEART (SOBRE LÍNEAS LIMPIAS DE page_14.png)
  if (pageNumber === 14) {
    const p14Measurements = [
      { top: '35.55%', left: '32.50%', val: eco.ventriculoDerecho || '24' },
      { top: '35.55%', left: '66.50%', val: eco.aortaRaiz || '26' },
      { top: '36.86%', left: '33.80%', val: eco.septumInterventricular || '10' },
      { top: '36.86%', left: '68.30%', val: eco.aortaApertura || '22' },
      { top: '38.16%', left: '29.50%', val: eco.viDiastole || '44' },
      { top: '39.47%', left: '29.50%', val: eco.viSistole || '24' },
      { top: '40.76%', left: '31.50%', val: eco.paredPosteriorVI || '10' },
      { top: '42.08%', left: '31.50%', val: eco.auriculaIzquierda || '32' },
      { top: '46.19%', left: '31.50%', val: eco.fraccionEyeccion || '64' },
      { top: '46.19%', left: '67.50%', val: eco.ondaEMitral || '99' },
      { top: '47.49%', left: '33.00%', val: eco.fraccionAcortamiento || '33' },
      { top: '47.49%', left: '67.50%', val: eco.ondaAMitral || '76' },
      { top: '55.53%', left: '35.50%', val: eco.mitralGradienteMax || '1.2' },
      { top: '56.84%', left: '35.50%', val: eco.aorticaGradienteMax || '2.4' },
      { top: '56.84%', left: '73.30%', val: eco.areaAortica || '0.7' }
    ];
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_14.png"
          alt="Informe Ecocardiográfico Página 14"
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
        {p14Measurements.map((m, idx) => (
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

  // PÁGINA 15: ANEXO DE IMÁGENES ECOCARDIOGRAMA DOPPLER 2D Y MODO M
  if (pageNumber === 15) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_15.png"
          alt="Anexo Imágenes Ecocardiograma Página 15"
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

  // PÁGINA 16: ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES) CON SELLO CARDIÓLOGO
  if (pageNumber === 16) {
    const hasCustomEcg = Boolean(patient?.attachments?.ecg?.url);
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_16.png"
          alt="Electrocardiograma 12 Derivaciones Página 16"
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
            <div className="absolute fpf-doc-text uppercase" style={{ top: '84.29%', left: '44.09%' }}>
              {(patient?.ekg?.resultadoGeneral || 'NORMAL').toUpperCase()}
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

  // PÁGINA 17: HEMOGRAMA COMPLETO (LABORATORIO CLÍNICO FAMIHEART)
  if (pageNumber === 17) {
    if (patient?.attachments?.laboratorio?.url) {
      return (
        <div className="w-full h-full relative select-none">
          <img
            src="/assets/pages_blank/page_17.png"
            alt="Membrete Laboratorio Página 17"
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

    const p17Hemograma = [
      { top: '38.80%', left: '54.32%', val: hemo.globulosRojos || '4.620,000.00' },
      { top: '40.58%', left: '60.85%', val: hemo.hemoglobina || '13.8' },
      { top: '44.15%', left: '62.26%', val: hemo.hematocrito || '42' },
      { top: '47.71%', left: '57.58%', val: hemo.leucocitos || '6,241.00' },
      { top: '52.69%', left: '58.04%', val: hemo.plaquetas || '199.000' },
      { top: '56.25%', left: '62.26%', val: hemo.vcm || '97' },
      { top: '58.03%', left: '62.26%', val: hemo.hcm || '30' },
      { top: '59.81%', left: '62.26%', val: hemo.chcm || '31' },
      { top: '65.16%', left: '62.26%', val: hemo.linfocitos || '35' },
      { top: '66.94%', left: '63.20%', val: hemo.monocitos || '1' },
      { top: '68.72%', left: '63.20%', val: hemo.eosinofilos || '3' },
      { top: '70.50%', left: '63.20%', val: hemo.basofilos || '0' },
      { top: '72.29%', left: '62.26%', val: hemo.segmentados || '61' },
      { top: '74.07%', left: '63.20%', val: hemo.abastonados || '0' }
    ];

    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_17.png"
          alt="Hemograma Completo Página 17"
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
        {p17Hemograma.map((row, idx) => (
          <div key={idx} className="absolute fpf-doc-text" style={{ top: row.top, left: row.left }}>
            {row.val}
          </div>
        ))}
      </div>
    );
  }

  // PÁGINA 18: INFORME RADIOGRAFÍA DE TÓRAX
  if (pageNumber === 18) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_18.png"
          alt="Informe Radiografía de Tórax Página 18"
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

  // PÁGINA 19: ANEXO PLACA DIGITAL DE RAYOS X DE TÓRAX
  if (pageNumber === 19) {
    return (
      <div className="w-full h-full relative select-none">
        <img
          src="/assets/pages_blank/page_19.png"
          alt="Radiografía de Tórax Placa Página 19"
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

// Plantilla limpia en blanco (Carga las 19 páginas oficiales limpias sin datos personales)
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
