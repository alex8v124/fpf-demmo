import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex font-sans selection:bg-[#0284C7] selection:text-white">
      
      {/* 1. Menú Lateral Izquierdo (Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        userRole={userRole}
      />

      {/* 2. Contenedor Principal (Topbar + Contenido + Footer) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen bg-[#F8FAFC]">
        
        {/* Barra Superior Limpia y Contextual */}
        <Topbar
          currentTab={currentTab}
          currentPatient={currentPatient}
          patientsList={patientsList}
          onSelectPatient={handleSelectPatient}
          onSelectPatientId={handleSelectPatientId}
          userRole={userRole}
          setUserRole={setUserRole}
          setMobileOpen={setMobileOpen}
        />

        {/* Mesa de Trabajo de Contenido */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
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

        {/* Footer Institucional Clínico */}
        <footer className="no-print bg-white border-t border-[#E2E8F0] py-4 text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-[#1E293B]">Famiheart S.A.C.</span>
              <span>•</span>
              <span>RUC 20554742905</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">Comisión Médica FPF & CONMEBOL 2026</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-[#15803D] font-medium bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                TLS 256-bit Activo
              </span>
              <span className="text-[#64748B]">
                Ley N° 29733 (Datos Personales de Salud)
              </span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
