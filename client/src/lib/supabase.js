export {
  supabase,
  SUPABASE_SCHEMA_SQL,
  testSupabaseConnection,
  buildPatientId,
  savePatientToSupabase,
  saveBatchPatientsToSupabase,
  loadPatientsFromSupabase,
  mapDbToPatient,
  uploadPatientPdf,
  deletePatientPdf,
  getCachedAttachments,
  setCachedAttachments,
  mapDbToStaff,
  loadStaffFromSupabase,
  saveStaffToSupabase,
  deleteStaffFromSupabase
} from '../utils/supabase';
