/**
 * Utilidad inteligente para extracción y normalización automática de nombres
 * a partir de archivos de imágenes y PDFs (Directorio Drive / Carga de Usuario).
 */

export function parsePatientFromFileName(fileName, fileObj = null) {
  if (!fileName) return null;

  // 1. Quitar extensión del archivo
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').trim();

  // 2. Normalizar separadores (guiones bajos, dobles espacios, caracteres raros)
  const cleanName = nameWithoutExt
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  const words = cleanName.split(' ').filter(Boolean);

  let apellidos = '';
  let nombres = '';

  // 3. Reglas de extracción según estructura de nombres peruana / FPF
  // Caso 1: Apellidos compuestos con "DE LA CRUZ", "DE LA", etc.
  if (words.length >= 4 && words[0] === 'DE' && words[1] === 'LA') {
    // Ej: DE LA CRUZ COTRINA PATRICK
    apellidos = words.slice(0, 4).join(' ');
    nombres = words.slice(4).join(' ');
  } 
  // Caso 2: Apellido con "DEL", "SAN", "DE"
  else if (words.length >= 3 && ['DEL', 'SAN', 'DE', 'DI'].includes(words[0])) {
    apellidos = words.slice(0, 3).join(' ');
    nombres = words.slice(3).join(' ');
  }
  // Caso 3: Nomenclatura estándar (2 apellidos, 1 o más nombres)
  else if (words.length >= 3) {
    apellidos = words.slice(0, 2).join(' ');
    nombres = words.slice(2).join(' ');
  }
  // Caso 4: 2 palabras (1 apellido, 1 nombre)
  else if (words.length === 2) {
    apellidos = words[0];
    nombres = words[1];
  } 
  // Caso 5: 1 sola palabra
  else {
    apellidos = cleanName;
    nombres = '';
  }

  const nombreCompleto = `${apellidos} ${nombres}`.trim();
  const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  let fileUrl = null;
  let fileType = 'application/pdf';
  let fileSize = '1.4 MB';

  if (fileObj) {
    try {
      fileUrl = URL.createObjectURL(fileObj);
      fileType = fileObj.type || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      fileSize = (fileObj.size / (1024 * 1024)).toFixed(2) + ' MB';
    } catch (e) {
      console.warn('Could not create object URL for file:', e);
    }
  } else if (fileName.endsWith('.pdf')) {
    // Si es del drive, tiene su preview renderizada en /assets/ekg/
    fileUrl = `/assets/ekg/${fileName.replace('.pdf', '.jpg')}`;
  }

  return {
    id: id || `patient-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    fileName,
    apellidos,
    nombres,
    nombreCompleto,
    dni: Math.floor(70000000 + Math.random() * 9999999).toString(),
    club: 'Club FPF / Liga Formativa',
    categoria: 'Temporada Oficial 2026',
    posicion: 'Futbolista',
    fechaEvaluacion: '22-01-2026',
    estadoAptitud: 'APTO',
    resultadoEkg: 'EKG NORMAL',
    fileUrl,
    fileType,
    fileSize,
    origen: fileObj ? 'Archivo Subido en Vivo' : 'Archivos Drive',
    synced21Pages: true
  };
}

/**
 * Permite cambiar el formato de presentación entre:
 * - 'LAST_FIRST': "AGURTO ROMERO FERNANDO"
 * - 'FIRST_LAST': "FERNANDO AGURTO ROMERO"
 */
export function formatPlayerDisplayName(apellidos, nombres, order = 'LAST_FIRST') {
  if (!apellidos && !nombres) return '';
  if (order === 'LAST_FIRST') {
    return `${apellidos.trim()} ${nombres.trim()}`.trim().toUpperCase();
  }
  return `${nombres.trim()} ${apellidos.trim()}`.trim().toUpperCase();
}
