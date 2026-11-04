import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadPatientPdf } from './supabase';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

// Convierte un Data URL o URL a Uint8Array
async function urlToUint8Array(url) {
  if (!url) return null;
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

// Embebe una imagen de forma segura (PNG o JPEG)
async function safeEmbedImage(pdfDoc, bytes) {
  if (!bytes || bytes.length === 0) return null;
  try {
    // Intentar PNG
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      // Intentar JPEG
      return await pdfDoc.embedJpg(bytes);
    } catch (e) {
      console.warn('safeEmbedImage error:', e);
      return null;
    }
  }
}

/**
 * Genera el archivo PDF oficial completo de 19 páginas para el paciente
 * incorporando todas las imágenes adjuntas (Eco 2D, Eco M-Mode, ECG, Laboratorio, Rayos X),
 * sellos médicos oficiales y datos del jugador.
 */
export async function generatePatientPdf(patient, options = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const cleanName = (
    patient?.nombreCompleto ||
    `${patient?.apellidos || ''} ${patient?.nombres || ''}`.trim() ||
    'FUTBOLISTA'
  ).toUpperCase();
  const cleanClub = (patient?.club || 'CLUB FPF / LIGA FORMATIVA').toUpperCase();
  const cleanDate = patient?.fechaEvaluacion || options.globalDate || '22-01-2026';
  const cleanCmp = patient?.medicoCmp || '27503';
  const cleanMedico = (patient?.medicoEvaluador || 'DR. DARIO HERNANDEZ').toUpperCase();

  const attachments = patient?.attachments || {};

  // Pre-cargar imágenes dinámicas si existen
  const eco2dBytes = attachments.eco2d?.url ? await urlToUint8Array(attachments.eco2d.url) : null;
  const ecoMmodeBytes = attachments.ecoMmode?.url ? await urlToUint8Array(attachments.ecoMmode.url) : null;
  const ecgBytes = attachments.ecg?.url ? await urlToUint8Array(attachments.ecg.url) : null;
  const labBytes = attachments.laboratorio?.url ? await urlToUint8Array(attachments.laboratorio.url) : null;
  const rxBytes = attachments.rayosX?.url ? await urlToUint8Array(attachments.rayosX.url) : null;

  // Sellos oficiales
  const selloDarioBytes = await urlToUint8Array('/assets/sello-dario-hernandez-transparent.png').catch(() => null);
  const selloCardioBytes = await urlToUint8Array('/assets/sello-alfredo-vega-transparent.png').catch(() => null);

  for (let pageNum = 1; pageNum <= 19; pageNum++) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const numStr = pageNum.toString().padStart(2, '0');

    // 1. Cargar fondo oficial limpio de la página
    let bgUrl = `/assets/pages_blank/page_${numStr}.png`;
    if (pageNum === 1) bgUrl = '/assets/pages_blank/page_01_base.png';
    if (pageNum === 13) bgUrl = '/assets/pages_blank/page_13_base.png';

    const bgBytes = await urlToUint8Array(bgUrl).catch(() => null);
    if (bgBytes) {
      const bgImg = await safeEmbedImage(pdfDoc, bgBytes);
      if (bgImg) {
        page.drawImage(bgImg, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT });
      }
    }

    // 2. Sobreponer datos y adjuntos según la página correspondiente

    // PÁGINA 1: CERTIFICADO MÉDICO FPF
    if (pageNum === 1) {
      page.drawText(cleanName, {
        x: A4_WIDTH * 0.28,
        y: A4_HEIGHT * (1 - 0.27),
        size: 9.5,
        font: fontBold,
        color: rgb(0.05, 0.1, 0.2)
      });
      page.drawText(cleanClub, {
        x: A4_WIDTH * 0.28,
        y: A4_HEIGHT * (1 - 0.31),
        size: 9,
        font: fontNormal,
        color: rgb(0.1, 0.1, 0.1)
      });
      page.drawText(cleanDate, {
        x: A4_WIDTH * 0.28,
        y: A4_HEIGHT * (1 - 0.35),
        size: 9,
        font: fontNormal,
        color: rgb(0.1, 0.1, 0.1)
      });

      if (selloDarioBytes) {
        const selloImg = await safeEmbedImage(pdfDoc, selloDarioBytes);
        if (selloImg) {
          page.drawImage(selloImg, {
            x: A4_WIDTH * 0.65,
            y: A4_HEIGHT * (1 - 0.88),
            width: A4_WIDTH * 0.22,
            height: A4_HEIGHT * 0.08
          });
        }
      }
    }

    // PÁGINA 13: RESUMEN Y CERTIFICACIÓN FINAL FAMIHEART
    if (pageNum === 13) {
      page.drawText(cleanName, {
        x: A4_WIDTH * 0.25,
        y: A4_HEIGHT * (1 - 0.23),
        size: 9,
        font: fontBold,
        color: rgb(0.05, 0.1, 0.2)
      });
      page.drawText(cleanDate, {
        x: A4_WIDTH * 0.72,
        y: A4_HEIGHT * (1 - 0.23),
        size: 8.5,
        font: fontNormal,
        color: rgb(0.1, 0.1, 0.1)
      });
      if (selloDarioBytes) {
        const selloImg = await safeEmbedImage(pdfDoc, selloDarioBytes);
        if (selloImg) {
          page.drawImage(selloImg, {
            x: A4_WIDTH * 0.68,
            y: A4_HEIGHT * (1 - 0.87),
            width: A4_WIDTH * 0.22,
            height: A4_HEIGHT * 0.08
          });
        }
      }
    }

    // PÁGINA 15: ECOCARDIOGRAMA 2D Y M-MODE
    if (pageNum === 15) {
      if (eco2dBytes) {
        const img = await safeEmbedImage(pdfDoc, eco2dBytes);
        if (img) {
          page.drawImage(img, {
            x: A4_WIDTH * 0.1429,
            y: A4_HEIGHT * (1 - 0.2249 - 0.3083),
            width: A4_WIDTH * 0.7142,
            height: A4_HEIGHT * 0.3083
          });
        }
      }
      if (ecoMmodeBytes) {
        const img = await safeEmbedImage(pdfDoc, ecoMmodeBytes);
        if (img) {
          page.drawImage(img, {
            x: A4_WIDTH * 0.1494,
            y: A4_HEIGHT * (1 - 0.6244 - 0.3173),
            width: A4_WIDTH * 0.7142,
            height: A4_HEIGHT * 0.3173
          });
        }
      }
    }

    // PÁGINA 16: ELECTROCARDIOGRAMA DE REPOSO
    if (pageNum === 16) {
      if (ecgBytes) {
        const img = await safeEmbedImage(pdfDoc, ecgBytes);
        if (img) {
          page.drawImage(img, {
            x: A4_WIDTH * 0.1428,
            y: A4_HEIGHT * (1 - 0.2435 - 0.7210),
            width: A4_WIDTH * 0.7142,
            height: A4_HEIGHT * 0.7210
          });
        }
      }
      if (selloCardioBytes) {
        const selloImg = await safeEmbedImage(pdfDoc, selloCardioBytes);
        if (selloImg) {
          page.drawImage(selloImg, {
            x: A4_WIDTH * 0.7215,
            y: A4_HEIGHT * (1 - 0.8560 - 0.0793),
            width: A4_WIDTH * 0.18,
            height: A4_HEIGHT * 0.0793
          });
        }
      }
    }

    // PÁGINA 17: LABORATORIO CLÍNICO
    if (pageNum === 17) {
      if (labBytes) {
        const img = await safeEmbedImage(pdfDoc, labBytes);
        if (img) {
          page.drawImage(img, {
            x: A4_WIDTH * 0.10,
            y: A4_HEIGHT * (1 - 0.22 - 0.73),
            width: A4_WIDTH * 0.80,
            height: A4_HEIGHT * 0.73
          });
        }
      } else {
        page.drawText(cleanName, {
          x: A4_WIDTH * 0.308,
          y: A4_HEIGHT * (1 - 0.2473),
          size: 9,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1)
        });
        page.drawText(cleanDate, {
          x: A4_WIDTH * 0.797,
          y: A4_HEIGHT * (1 - 0.3168),
          size: 8.5,
          font: fontNormal,
          color: rgb(0.1, 0.1, 0.1)
        });
      }
    }

    // PÁGINA 18: INFORME RADIOLÓGICO
    if (pageNum === 18) {
      page.drawText(cleanName, {
        x: A4_WIDTH * 0.3555,
        y: A4_HEIGHT * (1 - 0.2908),
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1)
      });
      page.drawText(cleanDate, {
        x: A4_WIDTH * 0.3549,
        y: A4_HEIGHT * (1 - 0.3239),
        size: 8.5,
        font: fontNormal,
        color: rgb(0.1, 0.1, 0.1)
      });
    }

    // PÁGINA 19: PLACA DIGITAL DE RAYOS X
    if (pageNum === 19) {
      if (rxBytes) {
        const img = await safeEmbedImage(pdfDoc, rxBytes);
        if (img) {
          page.drawImage(img, {
            x: A4_WIDTH * 0.1429,
            y: A4_HEIGHT * (1 - 0.3017 - 0.3759),
            width: A4_WIDTH * 0.7142,
            height: A4_HEIGHT * 0.3759
          });
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const fileName = `${cleanName.replace(/[^A-Z0-9_-]+/g, '_')}_FPF_2026.pdf`;

  return {
    blob: pdfBlob,
    bytes: pdfBytes,
    fileName,
    sizeBytes: pdfBytes.length
  };
}

/**
 * Descarga el PDF generado directamente al navegador
 */
export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Genera el PDF con las imágenes adjuntas y lo archiva automáticamente en Supabase Storage
 */
export async function generateAndArchivePatientPdf(patient, options = {}) {
  try {
    const { blob, fileName, sizeBytes } = await generatePatientPdf(patient, options);
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const res = await uploadPatientPdf(patient, file);
    return {
      success: res.success,
      publicUrl: res.publicUrl,
      sizeBytes,
      fileName,
      blob,
      error: res.error
    };
  } catch (err) {
    console.error('Error al generar y archivar PDF:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
