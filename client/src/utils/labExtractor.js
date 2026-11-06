/**
 * Extractor automático de Hemograma (Laboratorio) desde PDF o Imagen
 * Extrae Hemoglobina, Hematocrito, Leucocitos y otros valores analíticos
 * para vincularlos automáticamente a la Página 11 y Página 17 del expediente.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Parsea el texto sin procesar buscando los campos del Hemograma
 */
export function parseHemogramaText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.replace(/\r/g, '\n');
  const found = {};

  // 1. Hemoglobina (ej. "Hemoglobina 14.2", "Hemoglobina: 13.8 gr%", "Hb 15")
  const hbMatch = text.match(/(?:Hemoglobina|HGB|\bHb\b)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (hbMatch) {
    found.hemoglobina = hbMatch[1].replace(',', '.');
  }

  // 2. Hematocrito (ej. "Hematocrito 42 %", "Hematocrito 42%", "HCT 45")
  const htoMatch = text.match(/(?:Hematocrito|HCT|\bHto\b)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (htoMatch) {
    found.hematocrito = htoMatch[1].replace(',', '.');
  }

  // 3. Leucocitos (ej. "Leucocitos 6241", "Leucocitos 6,241", "WBC 7500")
  const leucoMatch = text.match(/(?:Leucocitos|Gl[oó]bulos\s*Blancos|\bWBC\b)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (leucoMatch) {
    found.leucocitos = leucoMatch[1];
  }

  // 4. Plaquetas (ej. "Plaquetas 199.000", "Recuento de Plaquetas 250000", "PLT 220")
  const plaqMatch = text.match(/(?:(?:Recuento\s*de\s*)?Plaquetas|\bPLT\b)\s*[:=\-]?\s*([0-9]+(?:[.,'][0-9]+)?)/i);
  if (plaqMatch) {
    found.plaquetas = plaqMatch[1].replace("'", '');
  }

  // 5. Glóbulos Rojos (ej. "Globulos Rojos 4.620", "Hematies 4.8", "RBC 4.5")
  const grMatch = text.match(/(?:(?:Recuento\s*de\s*)?(?:Gl[oó]bulos\s*Rojos|Hemat[ií]es|Eritrocitos)|\bRBC\b)\s*[:=\-]?\s*([0-9]+(?:[.,'][0-9]+)?)/i);
  if (grMatch) {
    found.globulosRojos = grMatch[1].replace("'", '');
  }

  // 6. Constantes Corpusculares
  const vcmMatch = text.match(/\bV[CeE]M\b\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (vcmMatch) found.vcm = vcmMatch[1];

  const hcmMatch = text.match(/\bHCM\b\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (hcmMatch) found.hcm = hcmMatch[1];

  const chcmMatch = text.match(/\bCHCM\b\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (chcmMatch) found.chcm = chcmMatch[1];

  // 7. Fórmula Diferencial
  const linfoMatch = text.match(/Linfocitos\s*[:=\-]?\s*([0-9]+)/i);
  if (linfoMatch) found.linfocitos = linfoMatch[1];

  const monoMatch = text.match(/Monocitos\s*[:=\-]?\s*([0-9]+)/i);
  if (monoMatch) found.monocitos = monoMatch[1];

  const eosMatch = text.match(/Eosin[oó]filos\s*[:=\-]?\s*([0-9]+)/i);
  if (eosMatch) found.eosinofilos = eosMatch[1];

  const basoMatch = text.match(/Bas[oó]filos\s*[:=\-]?\s*([0-9]+)/i);
  if (basoMatch) found.basofilos = basoMatch[1];

  const segMatch = text.match(/Segmentados\s*[:=\-]?\s*([0-9]+)/i);
  if (segMatch) found.segmentados = segMatch[1];

  const abastMatch = text.match(/Abastonados\s*[:=\-]?\s*([0-9]+)/i);
  if (abastMatch) found.abastonados = abastMatch[1];

  // 8. Electrolitos y Bioquímica (Sodio, Potasio, Glucosa) si están en el informe
  const sodioMatch = text.match(/(?:Sodio|Na\+?)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (sodioMatch) found.sodio = sodioMatch[1].replace(',', '.');

  const potasioMatch = text.match(/(?:Potasio|K\+?)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (potasioMatch) found.potasio = potasioMatch[1].replace(',', '.');

  const glucosaMatch = text.match(/(?:Glucosa|Glicemia)\s*[:=\-]?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (glucosaMatch) found.glucosaBasal = glucosaMatch[1].replace(',', '.');

  return Object.keys(found).length > 0 ? found : null;
}

/**
 * Extrae texto digital de un archivo PDF si contiene capa de texto
 */
async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map((item) => item.str).join(' ');
      fullText += `\n--- PÁGINA ${i} ---\n` + pageStr;
    }
    return fullText;
  } catch (err) {
    console.warn('Extracción directa de texto de PDF no disponible:', err);
    return '';
  }
}

/**
 * Ejecuta OCR sobre una imagen o DataURL usando Tesseract
 */
export async function performOcrOnImage(imageSource, onProgress) {
  let worker = null;
  try {
    worker = await createWorker('spa', 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text' && m.progress) {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });

    const ret = await worker.recognize(imageSource);
    return ret.data.text || '';
  } catch (err) {
    console.error('Error durante OCR:', err);
    return '';
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {});
    }
  }
}

/**
 * Función principal que analiza cualquier archivo (PDF o Imagen)
 * y devuelve los datos extraídos de laboratorio.
 */
export async function extractLabDataFromFile(file, onProgress) {
  if (!file) return null;

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // 1. Si es PDF, intentar extracción digital directa (rápida, 0ms)
  if (isPdf) {
    if (onProgress) onProgress('Leyendo texto digital del PDF...');
    const digitalText = await extractTextFromPdf(file);
    const parsed = parseHemogramaText(digitalText);
    if (parsed && (parsed.hemoglobina || parsed.hematocrito || parsed.leucocitos)) {
      console.log('[LabExtractor] Datos extraídos desde capa digital PDF:', parsed);
      return parsed;
    }
  }

  // 2. Si es imagen (o PDF escaneado sin capa de texto), procesar con OCR
  if (onProgress) onProgress('Analizando documento con OCR de alta precisión...');
  const ocrText = await performOcrOnImage(file, (pct) => {
    if (onProgress) onProgress(`Leyendo datos clínicos con OCR (${pct}%)...`);
  });

  const parsedFromOcr = parseHemogramaText(ocrText);
  if (parsedFromOcr) {
    console.log('[LabExtractor] Datos extraídos exitosamente mediante OCR:', parsedFromOcr);
    return parsedFromOcr;
  }

  console.warn('[LabExtractor] No se encontraron valores concluyentes en el documento.');
  return null;
}
