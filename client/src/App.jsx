import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import FileExtractor from './components/FileExtractor';
import PoolManager from './components/PoolManager';
import ClinicalEditor from './components/ClinicalEditor';
import DocumentViewer from './components/DocumentViewer';
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
    (drivePatients && drivePatients.length > 0) ? drivePatients[0] : blankPatientTemplate
  );
  const [isBlankMode, setIsBlankMode] = useState(false);

  // Rol activo del usuario: 'MEDICO' | 'CLUB' | 'FPF'
  const [userRole, setUserRole] = useState('MEDICO');

  // Estados globales para la configuración masiva (Fecha, Club y Formato)
  const [globalDate, setGlobalDate] = useState('22-01-2026');
  const [globalClub, setGlobalClub] = useState('Club FPF / Liga Formativa');
  const [nameOrder, setNameOrder] = useState('LAST_FIRST'); // 'LAST_FIRST' | 'FIRST_LAST'

  // Sincronizar automáticamente con Supabase en el inicio
  useEffect(() => {
    loadPatientsFromSupabase().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        const mapped = res.data.map(mapDbToPatient);
        setPatientsList(mapped);
        setCurrentPatient(mapped[0]);
        setIsBlankMode(false);
      } else {
        // En ausencia de registros remotos, inicializar con los 75 expedientes del Drive
        setPatientsList(drivePatients || []);
        if (drivePatients && drivePatients.length > 0) {
          setCurrentPatient(drivePatients[0]);
          setIsBlankMode(false);
        }
      }
    }).catch(err => {
      console.warn("Supabase load fallback:", err);
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
    const found = patientsList.find(p => p.id === patientId || p.fileName === patientId);
    if (found) {
      setCurrentPatient(found);
      setIsBlankMode(false);
    } else {
      setCurrentPatient(blankPatientTemplate);
      setIsBlankMode(true);
    }
  };

  const handleResetBlank = () => {
    setCurrentPatient(blankPatientTemplate);
    setIsBlankMode(true);
  };

  const handlePrint = async () => {
    // Precarga síncrona de las 21 páginas oficiales para evitar hojas en blanco al imprimir
    const loadPromises = Array.from({ length: 21 }, (_, i) => {
      const num = (i + 1).toString().padStart(2, '0');
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `/assets/pages_blank/page_${num}.png`;
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-[#0369A1] selection:text-white">
      
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
          
          {/* Barra Maestra de Configuración en Lote (Solo visible en Pool y Expediente 21P) */}
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
                  patient={currentPatient}
                  setPatient={setCurrentPatient}
                  onNavigateTab={setCurrentTab}
                  onResetBlank={handleResetBlank}
                />
              )}

              {currentTab === 'documento' && (
                <DocumentViewer
                  patient={currentPatient}
                  isBlankMode={isBlankMode}
                  setIsBlankMode={setIsBlankMode}
                  onPrint={handlePrint}
                />
              )}

              {currentTab === 'medicos' && (
                <MedicalStaff />
              )}

              {currentTab === 'database' && (
                <DatabaseView />
              )}
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
              <span>Conexión Segura TLS 256-bit • Cumplimiento Ley N° 29733 (Datos de Salud) • v1.2.6</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
