import { toJpeg } from 'html-to-image';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

/**
 * Pre-carga recursos críticos de imagen para garantizar captura instantánea y sin parpadeos
 */
export async function preloadAllExpedienteImages() {
  if (typeof window === 'undefined') return;
  const urls = [
    ...Array.from({ length: 19 }, (_, i) => `/assets/pages_blank/page_${(i + 1).toString().padStart(2, '0')}.png`),
    '/assets/pages_blank/page_01_base.png',
    '/assets/pages_blank/page_13_base.png',
    '/assets/echo_sample_2d.png',
    '/assets/echo_sample_mmode.png',
    '/assets/ecg_sample_strip.png',
    '/assets/rx_sample_clean.jpeg',
    '/assets/sello-alfredo-vega-transparent.png',
    '/assets/sello-dario-hernandez-transparent.png'
  ];

  const promises = urls.map(url => {
    return new Promise(resolve => {
      const img = new Image();
      img.src = url;
      if (img.complete && img.naturalWidth > 0) resolve();
      else {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  });

  try {
    await Promise.all(promises);
  } catch {
    // Continuar si falla alguna precarga secundaria
  }
}

/**
 * Dispara la descarga directa de un Blob al almacenamiento local del usuario (sin diálogos de impresión)
 */
export function triggerDirectDownload(blob, fileName) {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 30000);
}

/**
 * Captura las 19 páginas renderizadas en el contenedor DOM y compila un PDFDocument oficial
 */
export async function capturePagesToPdfBlob(pagesElements, onPageProgress) {
  if (!pagesElements || pagesElements.length === 0) {
    throw new Error('No se encontraron páginas para capturar en el contenedor');
  }

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < pagesElements.length; i++) {
    if (onPageProgress) {
      onPageProgress(i + 1, pagesElements.length);
    }
    const pageNode = pagesElements[i];

    // Capturar a JPEG de alta fidelidad con resolución A4 optimizada (pixelRatio 1.5)
    const jpegDataUrl = await toJpeg(pageNode, {
      quality: 0.90,
      pixelRatio: 1.5,
      backgroundColor: '#ffffff',
      cacheBust: false
    });

    const response = await fetch(jpegDataUrl);
    const jpegBytes = await response.arrayBuffer();

    const embeddedImage = await pdfDoc.embedJpg(new Uint8Array(jpegBytes));
    const pdfPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    pdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT
    });
  }

  const pdfBytes = await pdfDoc.save();
  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    bytes: pdfBytes,
    sizeBytes: pdfBytes.length
  };
}
