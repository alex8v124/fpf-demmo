import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FileExtractor from './components/FileExtractor';
import PoolManager from './components/PoolManager';
import ClinicalEditor from './components/ClinicalEditor';
import DocumentViewer, { PrintExpedienteDocument, TOTAL_EXPEDIENTE_PAGES } from './components/DocumentViewer';
import MedicalStaff from './components/MedicalStaff';
import DatabaseView from './components/DatabaseView';
import BatchConfigBar from './components/BatchConfigBar';
import drivePatients from './data/drivePatients.json';
import { blankPatientTemplate } from './data/initialData';
import { loadPatientsFromSupabase, mapDbToPatient } from './lib/supabase';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [patientsList, setPatientsList] = useState(drivePatients || []);
  const [currentPatient, setCurrentPatient] = useState(
    drivePatients && drivePatients.length > 0 ? drivePatients[0] : blankPatientTemplate
  );
  const [isBlankMode, setIsBlankMode] = useState(false);
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
          // En ausencia de registros remotos, inicializar con los expedientes del Drive
          setPatientsList(drivePatients || []);
          if (drivePatients && drivePatients.length > 0) {
            setCurrentPatient(drivePatients[0]);
            setIsBlankMode(false);
          }
        }
      })
      .catch((err) => {
        console.warn('Supabase load fallback:', err);
        setPatientsList(drivePatients || []);
        if (drivePatients && drivePatients.length > 0) {
          setCurrentPatient(drivePatients[0]);
          setIsBlankMode(false);
        }
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

  const handlePrint = async () => {
    // Precarga síncrona de las 19 páginas oficiales y bases limpias para evitar hojas en blanco al imprimir
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
      ...Object.values(currentPatient?.attachments || {})
        .map((a) => a?.url)
        .filter(Boolean)
    ];
    const loadPromises = allUrls.map((url) => {
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
          userRole={userRole}
          setUserRole={setUserRole}
        />

        {/* 2. Contenedor Principal (Ancho Completo, Sin Barra Lateral) */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Barra Maestra de Configuración en Lote (Solo visible en Pool y Expediente 19P) */}
            {(currentTab === 'pool' || currentTab === 'documento') && (
              <BatchConfigBar
                globalDate={globalDate}
                setGlobalDate={setGlobalDate}
                globalClub={globalClub}
                setGlobalClub={setGlobalClub}
                nameOrder={nameOrder}
                setNameOrder={setNameOrder}
                patientsList={patientsList}
                setPatientsList={setPatientsList}
                currentPatient={currentPatient}
                setCurrentPatient={setCurrentPatient}
              />
            )}

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
                  />
                )}

                {currentTab === 'medicos' && <MedicalStaff />}

                {currentTab === 'database' && <DatabaseView />}
              </motion.div>
            </AnimatePresence>
          </main>

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
      <PrintExpedienteDocument patient={currentPatient} isBlankMode={isBlankMode} />
    </>
  );
}
