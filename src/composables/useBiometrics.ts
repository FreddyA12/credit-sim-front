import { ref } from 'vue';
import * as faceapi from 'face-api.js';

export function useBiometrics() {
  const modelsLoaded = ref(false);
  const capturing = ref(false);
  const capturedDescriptor = ref<Float32Array | null>(null);
  const score = ref<number | null>(null);
  const verified = ref(false);
  const error = ref('');

  async function loadModels() {
    if (modelsLoaded.value) return;
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    modelsLoaded.value = true;
  }

  async function captureFromVideo(videoEl: HTMLVideoElement): Promise<Float32Array | null> {
    capturing.value = true;
    error.value = '';
    try {
      await loadModels();
      const detection = await faceapi.detectSingleFace(videoEl).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        error.value = 'No se detectó un rostro. Asegúrese de estar frente a la cámara.';
        return null;
      }
      capturedDescriptor.value = detection.descriptor;
      return detection.descriptor;
    } catch (e: any) {
      error.value = e.message || 'Error al capturar biométrico.';
      return null;
    } finally {
      capturing.value = false;
    }
  }

  function compareFaces(d1: Float32Array, d2: Float32Array): number {
    const distance = faceapi.euclideanDistance(d1, d2);
    return 1 - distance;
  }

  function verifyLiveness(d1: Float32Array, d2: Float32Array): boolean {
    const s = compareFaces(d1, d2);
    score.value = s;
    verified.value = s >= 0.55;
    return verified.value;
  }

  return { modelsLoaded, capturing, capturedDescriptor, score, verified, error, loadModels, captureFromVideo, compareFaces, verifyLiveness };
}
