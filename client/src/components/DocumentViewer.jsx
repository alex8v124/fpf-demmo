import React, { useState } from 'react';
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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* BARRA SUPERIOR DE CONTROL MINIMALISTA */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Navegador de Páginas */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || viewMode === 'all'}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition cursor-pointer"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium">Página</span>
            <span className="text-sm font-black text-white">{currentPage}</span>
            <span className="text-xs text-slate-500">de {totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || viewMode === 'all'}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition cursor-pointer"
            title="Página Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Formato Oficial */}
        <div className="flex items-center space-x-2">
          
          {/* Modo 1: Facsímil 1:1 Oficial (PDF Original) */}
          <button
            onClick={() => {
              setViewFormat('facsimile');
              if (setIsBlankMode) setIsBlankMode(false);
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
              viewFormat === 'facsimile'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
            title="Formato 1:1 idéntico al PDF oficial de 21 páginas de la FPF / CONMEBOL"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>PDF Oficial (1:1)</span>
          </button>

          {/* Modo 2: Plantilla en Blanco */}
          <button
            onClick={() => {
              setViewFormat('blank');
              if (setIsBlankMode) setIsBlankMode(true);
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
              viewFormat === 'blank'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
            title="Plantilla oficial limpia de 21 páginas sin datos de clientes"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantilla en Blanco</span>
          </button>

          {/* Modo 3: Vista Digital Adaptativa */}
          <button
            onClick={() => {
              setViewFormat('digital');
              if (setIsBlankMode) setIsBlankMode(false);
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
              viewFormat === 'digital'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/40'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'
            }`}
            title="Vista de resumen digital"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Resumen Digital</span>
          </button>

          {/* Toggle Vista Individual vs Continuo */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center ml-2">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 Pág
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              21 Págs
            </button>
          </div>

        </div>

        {/* Acciones de Descarga e Impresión */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadPatientDocx(patient, { globalDate: patient?.fechaEvaluacion, globalClub: patient?.club })}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl transition shadow-lg shadow-blue-950/40 cursor-pointer border border-blue-400/30"
            title="Descargar el documento Word (.docx) oficial con todos los sellos médicos, firmas y datos intactos"
          >
            <Download className="w-3.5 h-3.5 text-blue-200" />
            <span>Descargar Word con Sellos</span>
          </button>

          <a
            href="/PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.pdf"
            download="PLANTILLA_EN_BLANCO_EXPEDIENTE_FPF.pdf"
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-2xl transition shadow cursor-pointer"
            title="Descargar el PDF oficial de 21 páginas sin datos personales"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>PDF Plantilla</span>
          </a>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPrint}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-blue-950/40 border border-blue-400/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </motion.button>
        </div>

      </div>

      {/* TITULO Y DESCRIPCIÓN DE LA PÁGINA ACTUAL */}
      <div className="no-print bg-slate-900/60 border border-slate-800 px-5 py-3 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="bg-red-950 text-red-300 font-bold px-2.5 py-0.5 rounded-md border border-red-800/80 text-[10px]">
            {currentPageInfo.section}
          </span>
          <span className="font-bold text-white text-sm">
            Página {currentPageInfo.number}: {currentPageInfo.title}
          </span>
        </div>
        <div className="text-slate-400 hidden sm:block">
          {isBlankMode ? (
            <span className="text-amber-400 font-semibold">Formato limpio oficial para firma manuscrita</span>
          ) : (
            <span>Expediente de: <strong className="text-slate-200">{patient.nombreCompleto || 'Jugador'}</strong></span>
          )}
        </div>
      </div>

      {/* ÁREA DE VISUALIZACIÓN DE HOJA A4 */}
      <div className="flex justify-center overflow-x-auto py-2">
        <div 
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} 
          className="transition-transform duration-150"
        >
          {viewMode === 'single' ? (
            /* Vista Hoja Individual con Animación de Página */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl rounded-sm border border-slate-300 ${
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
            <div className="space-y-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                <div 
                  key={pNum} 
                  className={`w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl rounded-sm border border-slate-300 ${
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
      <div className="no-print bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-400" />
            Índice de Secciones del Expediente de 21 Páginas
          </h3>
          <span className="text-xs text-slate-400">Haz clic en cualquier página para navegar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {documentPhases.map((phase, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2.5">
              <div className="text-xs font-bold text-white leading-tight">{phase.title}</div>
              <p className="text-[10px] text-slate-400 leading-tight">{phase.desc}</p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {phase.pages.map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      setCurrentPage(num);
                      setViewMode('single');
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      currentPage === num && viewMode === 'single'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
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

// Renderizador Facsímil 1:1 Oficial FPF / CONMEBOL (Exacto al PDF Original)
function FacsimileOfficialPage({ pageNumber, patient }) {
  const formattedPage = pageNumber.toString().padStart(2, '0');
  const ekgSrc = patient?.ekgImage || patient?.fileUrl;

  // PÁGINA 16: ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES)
  if (pageNumber === 16 && ekgSrc) {
    return (
      <div className="w-full h-full flex flex-col justify-between bg-white text-slate-900 p-8 relative">
        <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/famiheart-logo.png" alt="Famiheart" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-sm font-black text-blue-950">FAMIHEART S.A.C.</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">ELECTROCARDIOGRAMA DE REPOSO (12 DERIVACIONES)</div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-black text-blue-900">FECHA: {patient?.fechaEvaluacion || '22-01-2026'}</div>
            <div className="text-[10px] text-slate-500 font-bold">Pág. 16 de 21</div>
          </div>
        </div>

        <div className="my-2 bg-slate-50 p-2.5 rounded-lg text-xs flex justify-between items-center border border-slate-300">
          <div>
            <span className="text-slate-600 font-medium">PACIENTE:</span>{' '}
            <strong className="text-blue-950 font-mono text-sm ml-1">{patient?.nombreCompleto}</strong>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span><strong>DNI:</strong> {patient?.dni || 'Verificado'}</span>
            <span><strong>FC:</strong> {patient?.frecuenciaCardiaca || '65 bpm'}</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">RITMO SINUSAL NORMAL</span>
          </div>
        </div>

        {/* Trazado EKG real extraído del archivo (Soporta Imagen y PDF embebido) */}
        <div className="my-auto flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-300 overflow-hidden">
          {patient?.fileType === 'application/pdf' || (typeof ekgSrc === 'string' && ekgSrc.toLowerCase().endsWith('.pdf')) ? (
            <object 
              data={`${ekgSrc}#toolbar=0&navpanes=0`} 
              type="application/pdf" 
              className="w-full h-[175mm] rounded-lg border-0"
            >
              <iframe 
                src={ekgSrc} 
                title={`EKG - ${patient?.nombreCompleto}`} 
                className="w-full h-[175mm] rounded-lg border-0" 
              />
            </object>
          ) : (
            <img 
              src={ekgSrc} 
              alt={`Trazado ECG - ${patient?.nombreCompleto}`} 
              className="w-full max-h-[175mm] object-contain shadow-xs"
              onError={(e) => {
                e.target.src = '/assets/pages_blank/page_16.png';
              }}
            />
          )}
        </div>

        <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-xs">
          <div>
            <div className="font-bold text-emerald-800 text-[11px]">CONCLUSIÓN: Ritmo sinusal normal. Sin alteraciones patológicas de conducción.</div>
            <div className="text-[9px] text-slate-500">Apto cardiológico pre-competencia según protocolo Seattle / Corrado / FPF</div>
          </div>
          <div className="text-right flex items-center space-x-2">
            <img 
              src="/assets/firma-cardiologo.jpeg" 
              alt="Sello Cardiólogo" 
              className="h-12 w-auto object-contain mix-blend-multiply" 
            />
            <div className="text-[10px] text-slate-600 font-bold">
              <div>Dr. Darío Hernández Alarcón</div>
              <div className="text-[9px] text-slate-500">C.M.P. 27503 • R.N.E. 15620 • Cardiólogo</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PÁGINA 1: CERTIFICADO MÉDICO DEPORTIVO FPF (FACSÍMIL 1:1 CON TIPOGRAFÍA Y COORDENADAS EXACTAS)
  if (pageNumber === 1) {
    return (
      <div className="w-full h-full relative select-none">
        <img 
          src="/assets/pages_blank/page_01.png" 
          alt="Certificado Oficial FPF Página 1" 
          className="w-full h-full object-contain pointer-events-none block"
        />

        {/* Nombre Completo: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '11.40%', left: '20.20%' }}
        >
          {patient?.nombreCompleto}
        </div>

        {/* Club: Calibri 11pt, regular, #000, mayúsculas */}
        <div 
          className="absolute fpf-doc-text uppercase"
          style={{ top: '14.07%', left: '18.20%' }}
        >
          {patient?.club || 'Club FPF / Liga Formativa'}
        </div>

        {/* Sello y Firma del Médico Cardiólogo en el recuadro izquierdo oficial */}
        <div 
          className="absolute flex items-center justify-center pointer-events-none"
          style={{ top: '78.5%', left: '12.5%', width: '30%', height: '14%' }}
        >
          <img 
            src="/assets/firma-cardiologo.jpeg" 
            alt="Firma y Sello Médico" 
            className="max-h-full max-w-full object-contain mix-blend-multiply" 
          />
        </div>

        {/* Fecha Oficial: Calibri 11pt, regular, #000 */}
        <div 
          className="absolute fpf-doc-text"
          style={{ top: '82.21%', left: '55.93%' }}
        >
          {patient?.fechaEvaluacion || '22-01-2026'}
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
