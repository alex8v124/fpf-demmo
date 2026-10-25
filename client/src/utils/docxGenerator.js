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
    nameOrder = 'LAST_FIRST',
    templateUrl = '/PLANTILLA_OFICIAL_CON_SELLOS.docx'
  } = options;

  // Extraer apellidos y nombres limpios
  let apellidos = (patient?.apellidos || '').trim();
  let nombres = (patient?.nombres || '').trim();

  if (!apellidos && patient?.nombreCompleto) {
    const parts = patient.nombreCompleto.trim().split(/\s+/);
    if (parts.length >= 3) {
      apellidos = parts.slice(0, 2).join(' ');
      nombres = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      apellidos = parts[0];
      nombres = parts[1];
    } else {
      apellidos = patient.nombreCompleto;
      nombres = '';
    }
  }

  // Determinar orden según configuración en lote (Apellidos Nombres vs Nombres Apellidos)
  const isFirstLast = nameOrder === 'FIRST_LAST';
  const targetFullName = isFirstLast 
    ? `${nombres} ${apellidos}`.trim().toUpperCase() 
    : `${apellidos} ${nombres}`.trim().toUpperCase();

  const firstBox = isFirstLast ? (nombres || targetFullName).toUpperCase() : (apellidos || targetFullName).toUpperCase();
  const secondBox = isFirstLast ? apellidos.toUpperCase() : nombres.toUpperCase();

  const targetDate = patient?.fechaEvaluacion || globalDate || '22-01-2026';
  const targetClub = (patient?.club || globalClub || 'Club FPF / Liga Formativa').toUpperCase();
  const targetDni = patient?.dni || '70000000';

  try {
    // 1. Descargar la plantilla oficial que contiene los 29 sellos y formularios intactos
    const res = await fetch(templateUrl);
    if (!res.ok) {
      throw new Error(`No se pudo cargar la plantilla Word desde ${templateUrl}`);
    }
    const templateBlob = await res.arrayBuffer();

    // 2. Abrir el archivo .docx (contenedor ZIP)
    const zip = await JSZip.loadAsync(templateBlob);

    // 3. Modificar únicamente word/document.xml (sin tocar word/media/ donde viven los sellos)
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('El documento no contiene word/document.xml válido');
    }

    let xmlText = await docXmlFile.async('string');

    // 4. Reemplazos quirúrgicos en el XML
    // A) Nombre completo en todo el expediente (Certificado de Aptitud, Ecocardiograma, Rayos X, etc.)
    xmlText = xmlText.replace(/PONCE ECHEVARRIA CARLOS/g, targetFullName);

    // B) Ficha PCMA: Casillas separadas de APELLIDOS y NOMBRES
    xmlText = xmlText.replace(/PONCE ECHEVARRIA\s*/g, firstBox + ' ');
    xmlText = xmlText.replace(/CARLOS/g, secondBox || '-');

    // C) Ficha PCMA: Nombre del Club Deportivo en Hoja 1 y 2
    xmlText = xmlText.replace(/ZU[\u00D1\xc3\x91N]IGA/gi, targetClub);

    // D) Fechas en cascada en todas las hojas
    xmlText = xmlText.replace(/22-01-2026/g, targetDate);
    xmlText = xmlText.replace(/____-____-2026/g, targetDate);
    xmlText = xmlText.replace(/06-05-2026/g, targetDate);

    // E) DNI si aplica
    if (patient?.dni) {
      xmlText = xmlText.replace(/74290500/g, targetDni);
    }

    // Guardar el XML modificado de vuelta en el zip
    zip.file('word/document.xml', xmlText);

    // 5. Compilar el archivo .docx final manteniendo todos los sellos binarios intactos
    const outputBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });

    return {
      success: true,
      blob: outputBlob,
      fileName: `${targetFullName.replace(/[^A-Z0-9\s]/gi, '').trim()}.docx`
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
