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
  const [patientsList, setPatientsList] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(blankPatientTemplate);
  const [isBlankMode, setIsBlankMode] = useState(true);

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
        setPatientsList([]);
        setCurrentPatient(blankPatientTemplate);
        setIsBlankMode(true);
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
      />

      {/* Main Content Area with Smooth Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Barra Maestra de Configuración en Lote (Fecha, Club, Formato y Exportación Word con Sellos) */}
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

      {/* Footer Minimalista */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">Famiheart S.A.C.</span>
            <span>•</span>
            <span>Comisión Médica FPF / CONMEBOL 2026</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Cardiología, Laboratorio Clínico y Radiología</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Supabase PostgreSQL Activo
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
