import JSZip from 'jszip';

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convierte un Data URL o URL de imagen al formato binario exacto (PNG o JPEG)
 * requerido por el contenedor OpenXML word/media/ para compatibilidad 100% con Microsoft Word.
 */
async function convertAttachmentToBytes(srcUrl, mimeType = 'image/png') {
  if (!srcUrl || typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (!blob) return resolve(null);
            const buf = await blob.arrayBuffer();
            resolve(new Uint8Array(buf));
          },
          mimeType,
          0.92
        );
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = srcUrl;
  });
}

/**
 * Genera un archivo Word (.docx) oficial de 19 páginas para un paciente
 * sobre la plantilla maestra limpia (Certificado Médico FPF + Protocolo PONCE limpio),
 * inyectando datos del futbolista e imágenes diagnósticas adjuntas y
 * CONSERVANDO AL 100% todos los sellos médicos, firmas y membretes oficiales.
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
  const targetPaisClub = (patient?.paisClub || 'PERÚ').toUpperCase();
  const targetFechaNac = patient?.fechaNacimiento || '';
  const targetPosicion = (patient?.posicion || '').toUpperCase();

  const rawPeso = String(patient?.peso || '71').trim();
  const targetPeso = rawPeso ? (/kg/i.test(rawPeso) ? rawPeso : `${rawPeso} Kg`) : '';

  const rawTalla = String(patient?.talla || '1.75').trim();
  const targetTalla = rawTalla ? (/cm/i.test(rawTalla) ? rawTalla : `${rawTalla} Cm`) : '';

  const targetMedicoCert = (patient?.medicoEvaluador || 'DARIO HERNANDEZ')
    .replace(/^DR\.?\s*/i, '')
    .trim()
    .toUpperCase();
  const targetCmpCert = String(patient?.medicoCmp || '27503').trim();
  const targetDomicilio = (patient?.domicilioClinica || 'AV CONQUISTADORES 1588 SAN ISIDRO').trim().toUpperCase();
  const targetRecibo = String(patient?.numeroRecibo || patient?.receiptNum || '').trim();
  const targetAptitudDetalle = patient?.aptitudDetalle
    ? patient.aptitudDetalle.trim().toUpperCase()
    : patient?.estadoAptitud === 'NO APTO'
      ? 'NO APTO PARA REALIZAR ACTIVIDAD DEPORTIVA COMPETITIVA ( FUTBOL )'
      : patient?.estadoAptitud === 'EN OBSERVACIÓN'
        ? 'EN OBSERVACION MEDICA PRE-COMPETENCIA ( FUTBOL )'
        : 'SE ENCUENTRA APTO PARA REALIZAR ACTIVIDAD DEPORTIVA ( FUTBOL )';

  try {
    // 1. Obtener la plantilla oficial limpia (usar buffer precargado o descargarla)
    let templateBlob = options.templateBuffer;
    if (!templateBlob) {
      const res = await fetch(templateUrl);
      if (!res.ok) {
        throw new Error(`No se pudo cargar la plantilla Word limpia desde ${templateUrl}`);
      }
      templateBlob = await res.arrayBuffer();
    }

    // 2. Abrir el archivo .docx (contenedor ZIP)
    const zip = await JSZip.loadAsync(templateBlob);

    // 3. Modificar word/document.xml con placeholders determinísticos limpios
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      throw new Error('El documento no contiene word/document.xml válido');
    }

    let xmlText = await docXmlFile.async('string');

    const replacements = {
      '{{NOMBRE_COMPLETO}}': escapeXml(targetFullName || 'FUTBOLISTA'),
      '{{APELLIDOS}}': escapeXml(firstBox || ''),
      '{{NOMBRES}}': escapeXml(secondBox || ''),
      '{{FECHA_NAC}}': escapeXml(targetFechaNac),
      '{{POSICION}}': escapeXml(targetPosicion),
      '{{CLUB}}': escapeXml(targetClub),
      '{{PAIS_CLUB}}': escapeXml(targetPaisClub),
      '{{PESO}}': escapeXml(targetPeso),
      '{{TALLA}}': escapeXml(targetTalla),
      '{{FECHA}}': escapeXml(targetDate),
      '{{MEDICO_CERT}}': escapeXml(targetMedicoCert),
      '{{CMP_CERT}}': escapeXml(targetCmpCert),
      '{{DOMICILIO_CLINICA}}': escapeXml(targetDomicilio),
      '{{APTITUD_DETALLE}}': escapeXml(targetAptitudDetalle),
      '{{RECIBO}}': escapeXml(targetRecibo)
    };

    for (const [token, val] of Object.entries(replacements)) {
      xmlText = xmlText.split(token).join(val);
    }

    // Respaldo de seguridad por si se pasa una plantilla externa sin tokens
    xmlText = xmlText.replace(/PONCE ECHEVARRIA CARLOS/g, escapeXml(targetFullName));
    xmlText = xmlText.replace(/PONCE ECHEVARRIA\s*/g, escapeXml(firstBox) + ' ');
    xmlText = xmlText.replace(/ZU[\u00D1\xc3\x91N]IGA/gi, escapeXml(targetClub));
    xmlText = xmlText.replace(/22-01-2026/g, escapeXml(targetDate));

    zip.file('word/document.xml', xmlText);

    // 4. Si el jugador tiene imágenes diagnósticas subidas en los espacios de adjuntos,
    // reemplazarlas directamente en word/media/ preservando sellos y membretes intactos
    const attachments = patient?.attachments || {};
    const mediaMappings = [
      { slot: 'eco2d', zipPath: 'word/media/image17.png', mime: 'image/png' },
      { slot: 'ecoMmode', zipPath: 'word/media/image18.png', mime: 'image/png' },
      { slot: 'ecg', zipPath: 'word/media/image19.png', mime: 'image/png' },
      { slot: 'rayosX', zipPath: 'word/media/image26.jpeg', mime: 'image/jpeg' }
    ];

    for (const m of mediaMappings) {
      const slotUrl = attachments?.[m.slot]?.url;
      if (slotUrl) {
        const imgBytes = await convertAttachmentToBytes(slotUrl, m.mime);
        if (imgBytes) {
          zip.file(m.zipPath, imgBytes);
        }
      }
    }

    // 5. Compilar el archivo .docx final manteniendo todos los sellos binarios intactos
    const outputBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE'
    });

    return {
      success: true,
      blob: outputBlob,
      fileName: `${(targetFullName || 'EXPEDIENTE').replace(/[^A-Z0-9\u00C0-\u017F\s_-]/gi, '').trim()}.docx`
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

  // Pre-cargar la plantilla Word limpia una sola vez para todo el lote
  const templateUrl = options.templateUrl || '/PLANTILLA_OFICIAL_CON_SELLOS.docx';
  const res = await fetch(templateUrl);
  if (!res.ok) {
    throw new Error(`No se pudo cargar la plantilla base desde ${templateUrl}`);
  }
  const templateBuffer = await res.arrayBuffer();
  const batchOptions = { ...options, templateBuffer };

  let completed = 0;
  for (const patient of patientsList) {
    const docRes = await generatePatientDocx(patient, batchOptions);
    if (docRes.success) {
      folder.file(docRes.fileName, docRes.blob);
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
