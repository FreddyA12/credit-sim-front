<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- ── IZQUIERDA: panel oscuro ── -->
      <div class="dark-panel">
        <!-- Patrón de puntos fondo -->
        <div class="dot-grid"></div>

        <!-- Logo -->
        <div class="dp-brand">
          <div class="dp-brand-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L1 6.5v7L10 19l9-5.5v-7L10 1z" fill="#c9a84c"/>
              <path d="M10 1L1 6.5L10 12l9-5.5L10 1z" fill="#e8c96a" opacity="0.7"/>
            </svg>
          </div>
          <span class="dp-brand-name">{{ institution?.name || 'FinSim' }}</span>
        </div>

        <!-- Tagline -->
        <div class="dp-tagline">
          <p class="dp-sup">Plataforma financiera institucional</p>
          <h2 class="dp-heading">Gestiona créditos<br/>e inversiones<br/><span class="gold">con precisión.</span></h2>
        </div>

        <!-- Info cartera -->
        <div class="dp-widget">
          <div class="widget-top">
            <div>
              <p class="widget-label">Cartera activa</p>
              <p class="widget-amount">$2,400,000</p>
            </div>
            <span class="widget-badge">↑ 12.4%</span>
          </div>
        </div>

        <!-- Gráfica libre — ocupa todo el ancho/alto restante del panel -->
        <div class="chart-full">
          <svg viewBox="0 0 500 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stop-color="#c9a84c" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#c9a84c" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            <polygon
              points="0,88 30,80 55,85 80,70 105,76 130,62 155,68 180,54 205,60 230,46 255,53 280,40 305,47 330,33 355,40 380,26 405,33 430,22 460,27 490,16 500,14 500,100 0,100"
              fill="url(#chartFill)"
            />
            <polyline
              points="0,88 30,80 55,85 80,70 105,76 130,62 155,68 180,54 205,60 230,46 255,53 280,40 305,47 330,33 355,40 380,26 405,33 430,22 460,27 490,16 500,14"
              fill="none"
              stroke="#c9a84c"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <circle cx="500" cy="14" r="8" fill="#c9a84c" opacity="0.2"/>
            <circle cx="500" cy="14" r="4" fill="#c9a84c"/>
          </svg>

          <div class="chart-stats">
            <span class="chart-stat-item"><span class="dot dot--green"></span> 1,280 créditos activos</span>
            <span class="chart-stat-item"><span class="dot dot--gold"></span> 340 inversiones</span>
          </div>
        </div>

      </div>

      <!-- ── DERECHA: formulario ── -->
      <div class="light-panel">
        <div class="lp-inner">
          <p class="lp-welcome">Bienvenido de nuevo</p>
          <h1 class="lp-title">Iniciar sesión</h1>
          <RouterView />
          <p class="lp-footer">
            ¿Sin acceso? Contacta al
            <a href="mailto:soporte@finsim.ec">administrador</a>
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useInstitutionStore } from '../stores/institution.store';
import { storeToRefs } from 'pinia';

const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);

onMounted(() => institutionStore.fetch().catch(() => {}));
</script>

<style scoped>
/* ─────────────────────────────────────────
   Página — full screen, sin card
───────────────────────────────────────── */
.auth-page {
  font-family: 'Poppins', sans-serif;
}

.auth-card {
  width: 100%;
  height: 100vh;
  display: flex;
}

/* ─────────────────────────────────────────
   Panel oscuro (izquierda)
───────────────────────────────────────── */
.dark-panel {
  width: 45%;
  flex-shrink: 0;
  background: #0a1628;
  display: flex;
  flex-direction: column;
  padding: 3.5rem 4rem;
  position: relative;
  overflow: hidden;
}

/* Patrón puntitos */
.dot-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(201,168,76,0.18) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

/* Logo */
.dp-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  position: relative;
  z-index: 1;
}
.dp-brand-icon {
  width: 2.2rem;
  height: 2.2rem;
  background: rgba(201,168,76,0.12);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dp-brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: #f8f9fc;
  letter-spacing: -0.01em;
}

/* Tagline */
.dp-tagline {
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}
.dp-sup {
  font-size: 0.7rem;
  font-weight: 500;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.6rem;
}
.dp-heading {
  font-size: 1.5rem;
  font-weight: 800;
  color: #e2e8f0;
  line-height: 1.3;
  margin: 0;
  letter-spacing: -0.03em;
}
.gold { color: #c9a84c; }

/* Info cartera */
.dp-widget {
  margin-top: 1.75rem;
  position: relative;
  z-index: 2;
}
.widget-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.widget-label {
  font-size: 0.68rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.2rem;
}
.widget-amount {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f1f5f9;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  margin: 0;
}
.widget-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: #10b981;
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 9999px;
  padding: 0.15rem 0.55rem;
}

/* Gráfica libre — sale del padding y llena todo el espacio restante */
.chart-full {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: auto;
  height: 52%;
  z-index: 1;
}
.chart-full svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Stats sobre la gráfica */
.chart-stats {
  position: absolute;
  bottom: 1.5rem;
  left: 4rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  z-index: 2;
}
.chart-stat-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot--green { background: #10b981; }
.dot--gold  { background: #c9a84c; }

/* Línea decorativa gold */
.dp-line {
  margin-top: 1.25rem;
  height: 2px;
  background: linear-gradient(to right, #c9a84c, transparent);
  border-radius: 9999px;
  position: relative;
  z-index: 1;
  width: 60%;
}

/* ─────────────────────────────────────────
   Panel claro (derecha)
───────────────────────────────────────── */
.light-panel {
  flex: 1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 5rem;
}

.lp-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
}

.lp-welcome {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.4rem;
}
.lp-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0a1628;
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 0 0 2.25rem;
}

.lp-footer {
  margin-top: 1.5rem;
  font-size: 0.72rem;
  color: #94a3b8;
  text-align: center;
}
.lp-footer a {
  color: #c9a84c;
  font-weight: 600;
  text-decoration: none;
}
.lp-footer a:hover { text-decoration: underline; }

/* ─────────────────────────────────────────
   Responsive
───────────────────────────────────────── */
@media (max-width: 768px) {
  .dark-panel { display: none; }
  .light-panel { padding: 2.5rem 2rem; }
}

@media (min-width: 1400px) {
  .dark-panel { padding: 4rem 5rem; }
  .light-panel { padding: 3rem 7rem; }
  .dp-heading { font-size: 1.875rem; }
}
</style>
