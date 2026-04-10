<template>
  <div class="flex flex-col gap-3">
    <div class="relative rounded-xl overflow-hidden bg-black aspect-video max-w-sm mx-auto">
      <video ref="videoRef" autoplay muted playsinline class="w-full h-full object-cover" />
      <div v-if="capturing" class="absolute inset-0 flex items-center justify-center bg-black/40">
        <i class="pi pi-spin pi-spinner text-white text-3xl" />
      </div>
    </div>
    <div class="flex gap-2 justify-center">
      <Button label="Activar cámara" icon="pi pi-camera" severity="secondary" @click="startCamera" v-if="!streaming" />
      <Button label="Capturar biométrico" icon="pi pi-check" @click="capture" :loading="capturing" v-if="streaming" />
    </div>
    <Message v-if="verified" severity="success" :closable="false">
      Verificación biométrica exitosa (score: {{ score?.toFixed(3) }})
    </Message>
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useBiometrics } from '../composables/useBiometrics';

const emit = defineEmits<{ (e: 'verified', descriptor: Float32Array): void }>();
const videoRef = ref<HTMLVideoElement | null>(null);
const streaming = ref(false);
let stream: MediaStream | null = null;
const referenceDescriptor = ref<Float32Array | null>(null);

const { capturing, capturedDescriptor, score, verified, error, captureFromVideo, verifyLiveness } = useBiometrics();

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
  if (videoRef.value) {
    videoRef.value.srcObject = stream;
    streaming.value = true;
  }
}

async function capture() {
  if (!videoRef.value) return;
  const descriptor = await captureFromVideo(videoRef.value);
  if (!descriptor) return;
  if (!referenceDescriptor.value) {
    referenceDescriptor.value = descriptor;
    return;
  }
  const ok = verifyLiveness(referenceDescriptor.value, descriptor);
  if (ok) emit('verified', descriptor);
}

onUnmounted(() => { stream?.getTracks().forEach((t) => t.stop()); });
</script>
