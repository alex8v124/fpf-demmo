import JSZip from 'jszip';

/**
 * Genera un archivo Word (.docx) oficial de 21 páginas para un paciente,
 * reemplazando el nombre, fecha y club pero CONSERVANDO AL 100% todos los
 * sellos médicos, firmas (Cardiólogo, Radiólogo, Tecnólogo) y formularios.
 */
export async function generatePatientDocx(patient, options = {}) {
  const {
    globalDate = patient?.fechaEvaluacion || '22-01-2026',
    globalClub = patient?.club || 'Club FPF / Liga Formativa',
    templateUrl = '/PLANTILLA_OFICIAL_CON_SELLOS.docx'
  } = options;

  const targetName = (patient?.nombreCompleto || 'PACIENTE SIN NOMBRE').toUpperCase();
  const targetDate = patient?.fechaEvaluacion || globalDate || '22-01-2026';
  const targetClub = patient?.club || globalClub || 'Club FPF / Liga Formativa';
  const targetDni = patient?.dni || '70000000';

  try {
    // 1. Descargar la plantilla oficial que contiene los 28 sellos y formularios intactos
    const res = await fetch(templateUrl);
    if (!res.ok) {
      throw new Error(`No se pudo cargar la plantilla Word desde ${templateUrl}`);
    }
    const templateBlob = await res.arrayBuffer();

    // 2. Abrir el archivo .docx (que es un contenedor ZIP)
    const zip = await JSZip.loadAsync(templateBlob);

    // 3. Modificar únicamente word/document.xml (sin tocar word/media/ donde viven los sellos)
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('El documento no contiene word/document.xml válido');
    }

    let xmlText = await docXmlFile.async('string');

    // 4. Reemplazos precisos en el XML
    // Nombre del paciente (reemplazar la referencia base sin romper etiquetas XML)
    xmlText = xmlText.replace(/PONCE ECHEVARRIA CARLOS/g, targetName);
    xmlText = xmlText.replace(/PONCE ECHEVARRIA\s*/g, targetName + ' ');
    
    // Fechas en cascada
    xmlText = xmlText.replace(/22-01-2026/g, targetDate);
    xmlText = xmlText.replace(/____-____-2026/g, targetDate);
    xmlText = xmlText.replace(/06-05-2026/g, targetDate);

    // DNI si aplica
    if (patient?.dni) {
      xmlText = xmlText.replace(/74290500/g, targetDni);
    }

    // Guardar el XML modificado de vuelta en el zip
    zip.file('word/document.xml', xmlText);

    // 5. Compilar el archivo .docx final manteniendo todos los sellos binarios
    const outputBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });

    return {
      success: true,
      blob: outputBlob,
      fileName: `${targetName.replace(/[^A-Z0-9\s]/gi, '').trim()}.docx`
    };
  } catch (error) {
    console.error('Error al generar el documento Word:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Descarga directamente en el navegador el Word oficial con sellos para un paciente
 */
export async function downloadPatientDocx(patient, options = {}) {
  const result = await generatePatientDocx(patient, options);
  if (!result.success) {
    throw new Error(result.error);
  }

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return result.fileName;
}

/**
 * Genera un archivo ZIP con todos los documentos Word (.docx) del lote,
 * cada uno con su nombre, fecha global, club y sellos intactos.
 */
export async function downloadBatchDocxZip(patientsList, options = {}, onProgress = null) {
  if (!patientsList || patientsList.length === 0) {
    throw new Error('No hay pacientes para generar el lote.');
  }

  const zip = new JSZip();
  const folder = zip.folder('Expedientes_FPF_Word_Oficiales');

  let completed = 0;
  for (const patient of patientsList) {
    const res = await generatePatientDocx(patient, options);
    if (res.success) {
      folder.file(res.fileName, res.blob);
    }
    completed++;
    if (onProgress) {
      onProgress(completed, patientsList.length);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const clubSlug = (options.globalClub || 'FPF').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Lote_Word_FPF_${clubSlug}_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { count: completed };
}
