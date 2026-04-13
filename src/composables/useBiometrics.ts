import { ref } from 'vue';
import * as faceapi from 'face-api.js';
import { createWorker, type Worker } from 'tesseract.js';

export function useBiometrics() {
  const faceModelsLoaded = ref(false);
  const ocrReady = ref(false);
  const capturing = ref(false);
  const faceVerified = ref(false);
  const cedulaVerified = ref(false);
  const error = ref('');

  let ocrWorker: Worker | null = null;

  async function loadFaceModels() {
    if (faceModelsLoaded.value) return;
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    faceModelsLoaded.value = true;
  }

  async function loadOcrWorker() {
    if (ocrReady.value) return;
    ocrWorker = await createWorker('spa');
    ocrReady.value = true;
  }

  function videoToCanvas(videoEl: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0);
    return canvas;
  }

  // Paso 1: verificar rostro
  async function captureFace(videoEl: HTMLVideoElement): Promise<boolean> {
    capturing.value = true;
    error.value = '';
    try {
      await loadFaceModels();
      const canvas = videoToCanvas(videoEl);
      const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        error.value = 'No se detectó un rostro. Asegúrese de estar frente a la cámara con buena iluminación.';
        return false;
      }
      faceVerified.value = true;
      return true;
    } catch (e: any) {
      error.value = e.message || 'Error al capturar el rostro.';
      return false;
    } finally {
      capturing.value = false;
    }
  }

  function preprocessCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
    const dst = document.createElement('canvas');
    dst.width = src.width;
    dst.height = src.height;
    const ctx = dst.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    const imageData = ctx.getImageData(0, 0, dst.width, dst.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Escala de grises
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Aumento de contraste
      const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
      data[i] = data[i + 1] = data[i + 2] = contrast;
    }
    ctx.putImageData(imageData, 0, 0);
    return dst;
  }

  // Paso 2: verificar cédula por OCR
  async function captureCedula(videoEl: HTMLVideoElement, expectedCedula: string): Promise<boolean> {
    capturing.value = true;
    error.value = '';
    try {
      await loadOcrWorker();
      const raw = videoToCanvas(videoEl);
      const canvas = preprocessCanvas(raw);
      const { data: { text } } = await ocrWorker!.recognize(canvas);

      // Normalizar: quitar espacios y saltos, quedarse con el texto plano
      const normalized = text.replace(/\s+/g, '');

      // Buscar el número de cédula esperado con posibles errores de OCR en dígitos adyacentes
      // 1) Coincidencia exacta dentro del texto normalizado
      if (normalized.includes(expectedCedula)) {
        cedulaVerified.value = true;
        return true;
      }

      // 2) Extraer todas las secuencias de 10 dígitos del texto completo (tolerando espacios entre dígitos)
      const looseText = text.replace(/[^0-9\s]/g, ' ');
      const tokens = looseText.split(/\s+/).filter(Boolean).join('');
      const tenDigitMatches = tokens.match(/\d{10}/g) ?? [];
      const found = tenDigitMatches.some((m) => m === expectedCedula);
      if (found) {
        cedulaVerified.value = true;
        return true;
      }

      if (tenDigitMatches.length === 0) {
        error.value = 'No se detectó ningún número de 10 dígitos. Acerque la cédula y asegúrese de que el número sea visible.';
      } else {
        error.value = `Número detectado (${tenDigitMatches[0]}) no coincide con la cédula ingresada. Intente de nuevo.`;
      }
      return false;
    } catch (e: any) {
      error.value = e.message || 'Error al leer la cédula.';
      return false;
    } finally {
      capturing.value = false;
    }
  }

  async function terminate() {
    if (ocrWorker) {
      await ocrWorker.terminate();
      ocrWorker = null;
    }
  }

  return {
    faceModelsLoaded,
    ocrReady,
    capturing,
    faceVerified,
    cedulaVerified,
    error,
    captureFace,
    captureCedula,
    terminate,
  };
}
