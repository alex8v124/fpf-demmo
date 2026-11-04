import * as pdfjsLib from 'pdfjs-dist';

// Configuración segura del Worker para Vite en producción y desarrollo
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
}

/**
 * Convierte la primera página de un PDF a una imagen Data URL en alta resolución (JPEG/PNG)
 */
export async function convertPdfPageToDataUrl(fileOrBlob, pageNum = 1, maxSize = 1800) {
  try {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Fondo blanco para documentos clínicos
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    if (maxSize && Math.max(canvas.width, canvas.height) > maxSize) {
      const scale = maxSize / Math.max(canvas.width, canvas.height);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.round(canvas.width * scale);
      scaledCanvas.height = Math.round(canvas.height * scale);
      const sCtx = scaledCanvas.getContext('2d');
      sCtx.fillStyle = '#FFFFFF';
      sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
      sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      return scaledCanvas.toDataURL('image/jpeg', 0.92);
    }
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (err) {
    console.error('Error convirtiendo PDF a imagen:', err);
    throw new Error('No se pudo procesar el archivo PDF: ' + (err.message || 'Error desconocido'));
  }
}

/**
 * Lee una imagen y la normaliza a Data URL
 */
export function convertImageToDataUrl(file, maxSize = 1800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo no es una imagen válida o compatible'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Función universal: admite PDF, PNG, JPG, JPEG, WebP, etc.
 */
export async function anyFileToDataUrl(file, maxSize = 1800) {
  if (!file) return null;
  const isPdf =
    file.type === 'application/pdf' ||
    (typeof file.name === 'string' && file.name.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    return await convertPdfPageToDataUrl(file, 1, maxSize);
  }
  return await convertImageToDataUrl(file, maxSize);
}
