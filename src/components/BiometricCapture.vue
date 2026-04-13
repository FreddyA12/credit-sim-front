<template>
  <div class="flex flex-col gap-4 max-w-sm mx-auto w-full">

    <!-- Progress de los dos pasos -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5" :class="faceVerified ? 'text-green-600' : subStep === 'face' ? 'text-blue-600 font-semibold' : 'text-gray-400'">
        <i :class="faceVerified ? 'pi pi-check-circle' : 'pi pi-user'" />
        <span class="text-sm">Paso 1: Rostro</span>
      </div>
      <i class="pi pi-arrow-right text-gray-300 text-xs" />
      <div class="flex items-center gap-1.5" :class="cedulaVerified ? 'text-green-600' : subStep === 'cedula' ? 'text-blue-600 font-semibold' : 'text-gray-400'">
        <i :class="cedulaVerified ? 'pi pi-check-circle' : 'pi pi-id-card'" />
        <span class="text-sm">Paso 2: Cédula</span>
      </div>
    </div>

    <!-- Instrucción según el sub-paso -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
      <template v-if="subStep === 'face'">
        <p class="font-semibold mb-1"><i class="pi pi-user mr-1" />Verificación de rostro</p>
        <p>Colóquese frente a la cámara con buena iluminación y presione <strong>"Capturar rostro"</strong>.</p>
      </template>
      <template v-else-if="subStep === 'cedula'">
        <p class="font-semibold mb-1"><i class="pi pi-id-card mr-1" />Verificación de cédula</p>
        <p>Sostenga su <strong>cédula de identidad</strong> frente a la cámara con el número claramente visible y presione <strong>"Leer cédula"</strong>.</p>
      </template>
    </div>
    <Message v-if="verified" severity="success" :closable="false">
      Verificación biométrica exitosa (score: {{ formatNumber(score, 3) }})
    </Message>

    <!-- Éxito final -->
    <Message v-if="cedulaVerified" severity="success" :closable="false">
      <span class="font-semibold">Verificación completa.</span> Rostro y cédula confirmados correctamente.
    </Message>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useBiometrics } from '../composables/useBiometrics';
import { formatNumber } from '../utils/number-utils';

const props = defineProps<{ expectedCedula: string }>();
const emit = defineEmits<{ (e: 'verified'): void }>();

const videoRef = ref<HTMLVideoElement | null>(null);
const streaming = ref(false);
const subStep = ref<'face' | 'cedula'>('face');
let stream: MediaStream | null = null;

const { capturing, faceVerified, cedulaVerified, error, captureFace, captureCedula, terminate } = useBiometrics();

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
  if (videoRef.value) {
    videoRef.value.srcObject = stream;
    streaming.value = true;
  }
}

async function doCaptureFace() {
  if (!videoRef.value) return;
  const ok = await captureFace(videoRef.value);
  if (ok) subStep.value = 'cedula';
}

async function doCaptureCedula() {
  if (!videoRef.value) return;
  const ok = await captureCedula(videoRef.value, props.expectedCedula);
  if (ok) emit('verified');
}

onUnmounted(() => {
  stream?.getTracks().forEach((t) => t.stop());
  terminate();
});
</script>
