import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, RefreshCw } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FileExtractor from './components/FileExtractor';
import PoolManager from './components/PoolManager';
import ClinicalEditor from './components/ClinicalEditor';
import DocumentViewer, { PrintExpedienteDocument, TOTAL_EXPEDIENTE_PAGES } from './components/DocumentViewer';
import MedicalStaff from './components/MedicalStaff';
import DatabaseView from './components/DatabaseView';
import { capturePagesToPdfBlob, triggerDirectDownload, preloadAllExpedienteImages } from './utils/directPdfExporter';
import JSZip from 'jszip';
import drivePatients from './data/drivePatients.json';
import { blankPatientTemplate, initialStaff } from './data/initialData';
import { loadPatientsFromSupabase, mapDbToPatient, loadStaffFromSupabase, savePatientToSupabase } from './lib/supabase';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [patientsList, setPatientsList] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(blankPatientTemplate);
  const [isBlankMode, setIsBlankMode] = useState(true);
  const [staffList, setStaffList] = useState(initialStaff || []);
  const [activeDoctor, setActiveDoctor] = useState(
    initialStaff && initialStaff.length > 0 ? initialStaff[0] : null
  );
  const [printBatchPatients, setPrintBatchPatients] = useState(null);
  const [exportingPatient, setExportingPatient] = useState(null);
  const [pdfExportProgress, setPdfExportProgress] = useState(null);

  // Precargar imágenes al montar la aplicación
  useEffect(() => {
    preloadAllExpedienteImages();
  }, []);

  // Generación y descarga directa de PDF sin abrir la ventana de impresión
  const handleDownloadPdf = async (target, asZip = false) => {
    // 1. Descarga Masiva (Lote de varios futbolistas)
    if (Array.isArray(target) && target.length > 0) {
      const total = target.length;
      
      // Opción ZIP: empaquetar todos los PDFs individuales en un único archivo comprimido
      if (asZip) {
        setPdfExportProgress({
          current: 0,
          total,
          status: `Iniciando compresión de ${total} expedientes PDF en archivo ZIP...`
        });
        const zip = new JSZip();

        for (let idx = 0; idx < total; idx++) {
          const pat = target[idx];
          const cleanName = (pat.nombreCompleto || `${pat.apellidos || ''} ${pat.nombres || ''}`).trim() || `FUTBOLISTA_${idx + 1}`;
          setPdfExportProgress({
            current: idx + 1,
            total,
            patientName: cleanName,
            status: `Procesando expediente ${idx + 1} de ${total}: ${cleanName}...`
          });

          setExportingPatient(pat);
          await new Promise(r => setTimeout(r, 220));

          const container = document.getElementById('pdf-export-container');
          if (container) {
            const pages = container.querySelectorAll('.print-page');
            if (pages && pages.length === TOTAL_EXPEDIENTE_PAGES) {
              const { bytes } = await capturePagesToPdfBlob(pages, (currP, totP) => {
                setPdfExportProgress(prev => ({
                  ...prev,
                  status: `[${idx + 1}/${total}] Generando página ${currP}/${totP} de ${cleanName}...`
                }));
              });
              zip.file(`${cleanName}_FPF_19P.pdf`, bytes);
            }
          }
        }

        setPdfExportProgress({
          current: total,
          total,
          status: 'Empaquetando archivo ZIP final...'
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDirectDownload(zipBlob, `EXPEDIENTES_PDF_FPF_LOTE_${total}_FUTBOLISTAS.zip`);

        setExportingPatient(null);
        setPdfExportProgress({
          current: total,
          total,
          status: `¡Archivo ZIP descargado con éxito conteniendo los ${total} PDFs!`
        });
        setTimeout(() => setPdfExportProgress(null), 3500);
        return;
      }

      // Opción 1 a 1: Descargar automáticamente cada PDF como archivo independiente
      for (let idx = 0; idx < total; idx++) {
        const pat = target[idx];
        const cleanName = (pat.nombreCompleto || `${pat.apellidos || ''} ${pat.nombres || ''}`).trim() || `FUTBOLISTA_${idx + 1}`;
        setPdfExportProgress({
          current: idx + 1,
          total,
          patientName: cleanName,
          status: `Descargando 1 a 1 (${idx + 1} de ${total}): ${cleanName}...`
        });

        setExportingPatient(pat);
        await new Promise(r => setTimeout(r, 220));

        const container = document.getElementById('pdf-export-container');
        if (container) {
          const pages = container.querySelectorAll('.print-page');
          if (pages && pages.length === TOTAL_EXPEDIENTE_PAGES) {
            const { blob } = await capturePagesToPdfBlob(pages, (currP, totP) => {
              setPdfExportProgress(prev => ({
                ...prev,
                status: `[${idx + 1}/${total}] Procesando página ${currP}/${totP} de ${cleanName}...`
              }));
            });
            triggerDirectDownload(blob, `${cleanName}_FPF_19P.pdf`);
          }
        }

        // Intervalo de espera entre descargas consecutivas para permitir que el navegador guarde cada documento
        await new Promise(r => setTimeout(r, 450));
      }

      setExportingPatient(null);
      setPdfExportProgress({
        current: total,
        total,
        status: `¡Completado! Se descargaron los ${total} expedientes PDF 1 a 1 en tu equipo.`
      });
      setTimeout(() => setPdfExportProgress(null), 4000);
      return;
    }

    // 2. Descarga Individual (1 solo futbolista)
    const pat = target || currentPatient;
    if (!pat) return;
    const cleanName = (pat.nombreCompleto || `${pat.apellidos || ''} ${pat.nombres || ''}`).trim() || 'EXPEDIENTE';

    setPdfExportProgress({
      current: 1,
      total: 1,
      patientName: cleanName,
      status: `Preparando expediente oficial de ${cleanName}...`
    });

    setExportingPatient(pat);
    await new Promise(r => setTimeout(r, 220));

    try {
      const container = document.getElementById('pdf-export-container');
      if (container) {
        const pages = container.querySelectorAll('.print-page');
        if (pages && pages.length === TOTAL_EXPEDIENTE_PAGES) {
          const { blob } = await capturePagesToPdfBlob(pages, (currP, totP) => {
            setPdfExportProgress(prev => ({
              ...prev,
              status: `Generando página ${currP} de ${totP} para ${cleanName}...`
            }));
          });
          triggerDirectDownload(blob, `${cleanName}_FPF_19P.pdf`);
          setPdfExportProgress({
            current: 1,
            total: 1,
            status: `¡Expediente descargado automáticamente: ${cleanName}_FPF_19P.pdf!`
          });
        } else {
          window.alert('No se pudo encontrar las páginas del expediente para la descarga directa.');
        }
      }
    } catch (err) {
      console.error('Error generando PDF directo:', err);
      window.alert('Error generando PDF: ' + err.message);
    } finally {
      setExportingPatient(null);
      setTimeout(() => setPdfExportProgress(null), 3500);
    }
  };

  useEffect(() => {
    loadStaffFromSupabase().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setStaffList(res.data);
        const firstActive = res.data.find((d) => d.active) || res.data[0];
        setActiveDoctor(firstActive);
      }
    });
  }, []);

  const handleSelectActiveDoctor = (doctor, applyToCurrent = true) => {
    if (!doctor) return;
    setActiveDoctor(doctor);
    if (applyToCurrent && currentPatient) {
      setCurrentPatient((prev) => ({
        ...prev,
        medicoEvaluador: doctor.name || `${doctor.nombres || ''} ${doctor.apellidos || ''}`.trim(),
        medicoCmp: doctor.cmp || '',
        medicoRne: doctor.rne || ''
      }));
    }
  };

  const [editorInitialStep, setEditorInitialStep] = useState(1);

  const handleOpenEditor = (step = 1) => {
    setEditorInitialStep(step);
    setCurrentTab('editor');
  };

  // Rol activo del usuario: 'MEDICO' | 'CLUB' | 'FPF'
  const [userRole, setUserRole] = useState('MEDICO');

  // Estados globales para la configuración masiva (Fecha, Club y Formato)
  const [globalDate, setGlobalDate] = useState('22-01-2026');
  const [globalClub, setGlobalClub] = useState('Club FPF / Liga Formativa');
  const [nameOrder, setNameOrder] = useState('LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'

  // Sincronizar automáticamente con Supabase en el inicio
  useEffect(() => {
    loadPatientsFromSupabase()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map(mapDbToPatient);
          setPatientsList(mapped);
          setCurrentPatient(mapped[0]);
          setIsBlankMode(false);
        } else {
          setPatientsList([]);
          setCurrentPatient(blankPatientTemplate);
          setIsBlankMode(true);
        }
      })
      .catch((err) => {
        console.warn('Carga de expedientes locales:', err);
        setPatientsList([]);
        setCurrentPatient(blankPatientTemplate);
        setIsBlankMode(true);
      });
  }, []);

  const handleSelectPatient = (patient) => {
    if (patient) {
      setCurrentPatient(patient);
      setIsBlankMode(false);
    } else {
      setCurrentPatient(blankPatientTemplate);
      setIsBlankMode(true);
    }
  };

  const handleSelectPatientId = (patientId) => {
    if (!patientId || patientId === 'plantilla-en-blanco') {
      setCurrentPatient(blankPatientTemplate);
      setIsBlankMode(true);
      return;
    }
    const found = patientsList.find((p) => p.id === patientId || p.fileName === patientId);
    if (found) {
      setCurrentPatient(found);
      setIsBlankMode(false);
    } else {
      setCurrentPatient(blankPatientTemplate);
      setIsBlankMode(true);
    }
  };

  // Actualiza un jugador (lista + jugador activo) con cambios parciales, ej. adjuntos o PDF en nube
  const handleUpdatePatient = (target, changes) => {
    const same = (p) =>
      (target?.id && p?.id === target.id) ||
      (target?.fileName && p?.fileName === target.fileName);
    setPatientsList((prev) => (prev || []).map((p) => (same(p) ? { ...p, ...changes } : p)));
    setCurrentPatient((prev) => (prev && same(prev) ? { ...prev, ...changes } : prev));

    if (changes.attachments || changes.pdfUrl) {
      const merged = { ...target, ...changes };
      savePatientToSupabase(merged).catch((e) => console.warn('Sync to Supabase background error:', e));
    }
  };

  // Sincroniza cambios desde ClinicalEditor tanto al paciente activo como a la bandeja general
  const handleSetCurrentPatientAndSync = (updater) => {
    setCurrentPatient((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next && next.id && next.id !== 'plantilla-en-blanco') {
        setPatientsList((list) =>
          (list || []).map((p) => (p.id === next.id ? { ...p, ...next } : p))
        );
      }
      return next;
    });
    setIsBlankMode(false);
  };

  // Promueve un nuevo expediente creado desde Formato en Blanco a la bandeja principal al guardar
  const handlePromoteSavedPatient = (savedPatient) => {
    if (!savedPatient || !savedPatient.id) return;
    setCurrentPatient(savedPatient);
    setIsBlankMode(false);
    setPatientsList((prev) => {
      const list = prev || [];
      const exists = list.some((p) => p.id === savedPatient.id);
      if (exists) {
        return list.map((p) => (p.id === savedPatient.id ? { ...p, ...savedPatient } : p));
      }
      return [savedPatient, ...list];
    });
  };

  const handleResetBlank = () => {
    setCurrentPatient(blankPatientTemplate);
    setIsBlankMode(true);
  };

  const handlePrint = async (target = null) => {
    let patientsToPrint = [];
    if (Array.isArray(target) && target.length > 0) {
      patientsToPrint = target;
      setPrintBatchPatients(target);
      const originalTitle = document.title;
      document.title = `EXPEDIENTES_FPF_LOTE_${target.length}_FUTBOLISTAS`;
      setTimeout(() => { document.title = originalTitle; }, 6000);
    } else if (target && typeof target === 'object') {
      patientsToPrint = [target];
      setPrintBatchPatients([target]);
      setCurrentPatient(target);
      setIsBlankMode(false);
      const originalTitle = document.title;
      const cleanName = (target.nombreCompleto || `${target.apellidos || ''} ${target.nombres || ''}`).trim() || 'EXPEDIENTE';
      document.title = `${cleanName}_FPF_19P`;
      setTimeout(() => { document.title = originalTitle; }, 6000);
    } else {
      patientsToPrint = currentPatient ? [currentPatient] : [];
      setPrintBatchPatients(null);
      const originalTitle = document.title;
      const cleanName = (currentPatient?.nombreCompleto || `${currentPatient?.apellidos || ''} ${currentPatient?.nombres || ''}`).trim() || 'EXPEDIENTE';
      document.title = `${cleanName}_FPF_19P`;
      setTimeout(() => { document.title = originalTitle; }, 6000);
    }

    // Esperar a que React monte todas las páginas en el contenedor oculto de impresión
    await new Promise((r) => setTimeout(r, 120));

    // Precarga síncrona de recursos gráficos de todos los expedientes a imprimir
    const allUrls = [
      ...Array.from(
        { length: TOTAL_EXPEDIENTE_PAGES },
        (_, i) => '/assets/pages_blank/page_' + (i + 1).toString().padStart(2, '0') + '.png'
      ),
      '/assets/pages_blank/page_01_base.png',
      '/assets/pages_blank/page_13_base.png',
      '/assets/echo_sample_2d.png',
      '/assets/echo_sample_mmode.png',
      '/assets/ecg_sample_strip.png',
      '/assets/rx_sample_clean.jpeg',
      '/assets/sello-alfredo-vega-transparent.png',
      '/assets/sello-dario-hernandez-transparent.png',
      ...patientsToPrint.flatMap(p => 
        Object.values(p?.attachments || {}).map(a => a?.url).filter(Boolean)
      )
    ];

    const uniqueUrls = Array.from(new Set(allUrls));
    const loadPromises = uniqueUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    });

    try {
      await Promise.all(loadPromises);
    } catch {
      // Fallback
    }

    window.print();
  };

  return (
    <>
      <div className="no-print min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-[#0369A1] selection:text-white">
        {/* 1. Barra de Navegación Horizontal Superior Completa */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          currentPatient={currentPatient}
          patientsList={patientsList}
          onSelectPatient={handleSelectPatient}
          onSelectPatientId={handleSelectPatientId}
          onResetBlank={handleResetBlank}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
          userRole={userRole}
          setUserRole={setUserRole}
          activeDoctor={activeDoctor}
        />

        {/* 2. Contenedor Principal (Ancho Completo, Sin Barra Lateral) */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {currentTab === 'dashboard' && (
                  <Dashboard
                    patientsList={patientsList}
                    setPatientsList={setPatientsList}
                    onSelectPatient={handleSelectPatient}
                    onSelectPatientId={handleSelectPatientId}
                    onNavigateTab={setCurrentTab}
                    onOpenEditor={handleOpenEditor}
                    onResetBlank={handleResetBlank}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPdf}
                    globalDate={globalDate}
                    globalClub={globalClub}
                    nameOrder={nameOrder}
                    userRole={userRole}
                    setUserRole={setUserRole}
                  />
                )}

                {currentTab === 'extractor' && (
                  <FileExtractor
                    patientsList={patientsList}
                    setPatientsList={setPatientsList}
                    onSelectPatient={handleSelectPatient}
                    onNavigateTab={setCurrentTab}
                    onUpdatePatient={handleUpdatePatient}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPdf}
                    globalDate={globalDate}
                    globalClub={globalClub}
                    nameOrder={nameOrder}
                  />
                )}

                {currentTab === 'pool' && (
                  <PoolManager
                    patientsList={patientsList}
                    setPatientsList={setPatientsList}
                    onSelectPatient={handleSelectPatient}
                    onNavigateTab={setCurrentTab}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPdf}
                    currentPatient={currentPatient}
                    setCurrentPatient={setCurrentPatient}
                  />
                )}

                {currentTab === 'editor' && (
                  <ClinicalEditor
                    key={editorInitialStep}
                    patient={currentPatient}
                    setPatient={handleSetCurrentPatientAndSync}
                    onUpdatePatient={handleUpdatePatient}
                    onPromoteSavedPatient={handlePromoteSavedPatient}
                    onNavigateTab={setCurrentTab}
                    onResetBlank={handleResetBlank}
                    onPrint={handlePrint}
                    initialStep={editorInitialStep}
                    staffList={staffList}
                  />
                )}

                {currentTab === 'documento' && (
                  <DocumentViewer
                    patient={currentPatient}
                    isBlankMode={isBlankMode}
                    setIsBlankMode={setIsBlankMode}
                    onUpdatePatient={handleUpdatePatient}
                    onNavigateTab={(tab) => (tab === 'editor' ? handleOpenEditor(1) : setCurrentTab(tab))}
                    onPrint={handlePrint}
                    onDownloadPdf={handleDownloadPdf}
                  />
                )}

                {currentTab === 'medicos' && (
                  <MedicalStaff
                    staffList={staffList}
                    setStaffList={setStaffList}
                    activeDoctor={activeDoctor}
                    onSelectActiveDoctor={handleSelectActiveDoctor}
                  />
                )}

                {currentTab === 'database' && <DatabaseView />}
              </motion.div>
            </AnimatePresence>
          </main>

      {/* Banner flotante de progreso de descarga automática de PDF */}
      <AnimatePresence>
        {pdfExportProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border bg-slate-900 border-slate-700 text-white flex items-center space-x-3.5 max-w-md text-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0369A1] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>Descarga Automática de PDF</span>
                {pdfExportProgress.total > 1 && (
                  <span className="text-[10px] bg-sky-500/30 text-sky-300 px-1.5 py-0.2 rounded font-mono">
                    {pdfExportProgress.current} / {pdfExportProgress.total}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                {pdfExportProgress.status}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor off-screen de alta resolución para renderizar y capturar las 19 páginas a PDF */}
      <div
        id="pdf-export-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '794px',
          height: 'auto',
          zIndex: -99999,
          pointerEvents: 'none',
          background: '#ffffff'
        }}
      >
        {exportingPatient && (
          <PrintExpedienteDocument
            patient={exportingPatient}
            isBlankMode={false}
            forceVisible={true}
          />
        )}
      </div>

          {/* Footer Institucional Formal (Cierre Legal y Técnico) */}
          <footer className="no-print bg-[#F1F5F9] border-t border-[#E2E8F0] py-4 px-6 sm:px-8 text-xs text-[#64748B] shrink-0 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left text-[#334155] font-medium">
                © 2026 Famiheart S.A.C. (RUC 20554742905) — Comisión Médica FPF & CONMEBOL.
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#475569]">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Conexión Segura TLS 256-bit • Cumplimiento Ley N° 29733 (Datos de Salud) • v1.2.8
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Contenedor raíz de impresión: siempre montado fuera de flex/transform para imprimir 19 páginas desde cualquier pestaña */}
      <PrintExpedienteDocument patient={currentPatient} patients={printBatchPatients} isBlankMode={isBlankMode} />
    </>
  );
}
