import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentPatient={currentPatient}
        patientsList={patientsList}
        onSelectPatientId={handleSelectPatientId}
        onSelectPatient={handleSelectPatient}
        onResetBlank={handleResetBlank}
        onPrint={handlePrint}
        userRole={userRole}
        setUserRole={setUserRole}
      />

      {/* Main Content Area with Smooth Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {currentTab === 'dashboard' && (
              <Dashboard
                patientsList={patientsList}
                setPatientsList={setPatientsList}
                onSelectPatient={handleSelectPatient}
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

      {/* Footer Institucional con Aviso de Privacidad y Protección de Datos en Salud */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-900/80 pb-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-slate-300">
              <span className="font-extrabold text-white text-sm">Famiheart S.A.C.</span>
              <span className="text-slate-600">•</span>
              <span>RUC 20554742905</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-200 font-semibold">Comisión Médica FPF & CONMEBOL 2026</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Sesión Médica Segura (TLS 256-bit)
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-400 font-semibold bg-blue-950/70 border border-blue-800/80 px-3 py-1 rounded-full text-[11px]">
                Ley N° 29733 (Datos Personales de Salud)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p className="max-w-3xl leading-relaxed text-center sm:text-left">
              <strong className="text-slate-400">Aviso de Confidencialidad Médica:</strong> La información clínica, trazados electrocardiográficos, ecocardiogramas Doppler y radiografías de tórax son datos sensibles de salud protegidos por la Ley N° 29733 y el reglamento médico de la FPF. Acceso exclusivo para profesionales médicos acreditados y delegados autorizados.
            </p>
            <div className="shrink-0 text-slate-400 font-mono text-[10px] text-center sm:text-right">
              V1.2.5-FPF • Supabase PostgreSQL Activo
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
