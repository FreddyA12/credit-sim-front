<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Créditos</p>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Solicitud de Crédito</h1>
      <p class="mt-1 text-sm text-slate-500">Complete los pasos a continuación para enviar su solicitud.</p>
    </div>

    <!-- ── Éxito ────────────────────────────────────────────────────────────── -->
    <div v-if="submitted" class="flex flex-col items-center gap-4 py-16 text-center">
      <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <i class="pi pi-check text-4xl text-green-600" />
      </div>
      <h2 class="text-2xl font-bold text-slate-900">¡Solicitud enviada!</h2>
      <p class="max-w-sm text-slate-500">
        Su solicitud ha sido recibida. Puede consultar el estado con su número de identificación.
      </p>
      <Button label="Consultar estado" icon="pi pi-search" @click="$router.push(`/${slug}/estado`)" />
    </div>

    <!-- ── Formulario ───────────────────────────────────────────────────────── -->
    <div v-else>
      <Steps :model="steps" :activeStep="activeStep" class="mb-8" />

      <Card class="border-slate-200 shadow-sm">
        <template #content>

          <!-- ═══════════════════════════════════════════════════════════════ -->
          <!-- PASO 0 — Datos del solicitante                                 -->
          <!-- ═══════════════════════════════════════════════════════════════ -->
          <div v-if="activeStep === 0" class="flex flex-col gap-6">
            <h2 class="text-lg font-semibold text-slate-900">Datos del solicitante</h2>

            <!-- Selección de tipo de crédito (si no viene del simulador) -->
            <div v-if="!comesFromSimulator" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <label class="mb-2 block text-sm font-semibold text-amber-900">
                <i class="pi pi-info-circle mr-1" />
                Seleccione el tipo de crédito que desea solicitar *
              </label>
              <Select
                v-model="form.creditTypeId"
                :options="creditTypes"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione un tipo de crédito..."
                class="w-full"
              />
            </div>

            <!-- Confirmación (viene del simulador) -->
            <div v-else class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <i class="pi pi-check-circle text-blue-600" />
              <p class="text-sm text-blue-900">
                Tipo de crédito seleccionado: <strong>{{ selectedCreditType?.name }}</strong>
              </p>
            </div>

            <!-- Tarjeta de condiciones del crédito -->
            <div v-if="selectedCreditType" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Condiciones del crédito</p>
              <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <p class="text-slate-400">Tasa anual</p>
                  <p class="font-semibold text-slate-900">{{ selectedCreditType.annualRate }}%</p>
                </div>
                <div>
                  <p class="text-slate-400">Monto</p>
                  <p class="font-semibold text-slate-900">${{ selectedCreditType.minAmount }} – ${{ selectedCreditType.maxAmount }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Plazo</p>
                  <p class="font-semibold text-slate-900">{{ selectedCreditType.minTermMonths }} – {{ selectedCreditType.maxTermMonths }} meses</p>
                </div>
                <div>
                  <p class="text-slate-400">Sistema de pago</p>
                  <p class="font-semibold text-slate-900">{{ systemLabel(selectedCreditType.amortizationSystem) }}</p>
                </div>
              </div>
            </div>

            <!-- Datos personales -->
            <div v-if="form.creditTypeId" class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="col-span-2 flex flex-col gap-1">
                <label class="text-sm font-medium">Nombre completo *</label>
                <InputText v-model="form.clientName" placeholder="Ej: Juan Carlos Pérez Torres" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">{{ idLabel }} *</label>
                <InputText
                  v-model="form.idNumber"
                  @blur="validateIdNumber"
                  :class="{ 'p-invalid': idError }"
                  :maxlength="idMaxLength"
                  :placeholder="idPlaceholder"
                />
                <small v-if="idError" class="text-red-500">{{ idError }}</small>
                <small v-else class="text-slate-400">
                  {{ requiredIdType === 'ruc' ? 'RUC de 13 dígitos' : requiredIdType === 'both' ? 'Cédula (10 dígitos) o RUC (13 dígitos)' : 'Cédula de 10 dígitos' }}
                </small>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Teléfono</label>
                <InputText v-model="form.clientPhone" placeholder="Ej: 0991234567" />
              </div>
              <div class="col-span-2 flex flex-col gap-1">
                <label class="text-sm font-medium">Correo electrónico</label>
                <InputText v-model="form.clientEmail" type="email" placeholder="correo@ejemplo.com" />
              </div>
            </div>

            <!-- Estado vacío -->
            <div v-else class="flex flex-col items-center py-8 text-slate-400">
              <i class="pi pi-arrow-up text-3xl mb-2" />
              <p>Seleccione un tipo de crédito para continuar</p>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════════ -->
          <!-- PASO 1 — Crédito y sistema de amortización                     -->
          <!-- ═══════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeStep === 1" class="flex flex-col gap-6">
            <h2 class="text-lg font-semibold text-slate-900">Detalle del crédito</h2>

            <!-- Monto y plazo -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto solicitado (USD) *</label>
                <InputNumber
                  v-model="form.amount"
                  mode="currency" currency="USD" locale="es-EC"
                  :min="selectedCreditType?.minAmount ?? 0"
                  :max="selectedCreditType?.maxAmount ?? 9999999"
                  fluid
                  placeholder="Ej: 5000"
                />
                <small v-if="selectedCreditType" class="text-slate-400">
                  Entre ${{ selectedCreditType.minAmount }} y ${{ selectedCreditType.maxAmount }}
                </small>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (meses) *</label>
                <InputNumber
                  v-model="form.termMonths"
                  :min="selectedCreditType?.minTermMonths ?? 1"
                  :max="selectedCreditType?.maxTermMonths ?? 360"
                  fluid
                  placeholder="Ej: 24"
                />
                <small v-if="selectedCreditType" class="text-slate-400">
                  Entre {{ selectedCreditType.minTermMonths }} y {{ selectedCreditType.maxTermMonths }} meses
                </small>
              </div>
            </div>

            <!-- Capacidad de pago -->
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p class="mb-3 text-sm font-semibold text-slate-700">
                <i class="pi pi-chart-line mr-1 text-slate-400" />
                Capacidad de pago
              </p>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Ingresos netos mensuales *</label>
                  <InputNumber v-model="form.monthlyIncome" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Gastos fijos mensuales</label>
                  <InputNumber v-model="form.monthlyExpenses" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                  <small class="text-slate-400">Arriendo, servicios, alimentación...</small>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Otras deudas mensuales</label>
                  <InputNumber v-model="form.otherDebts" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                  <small class="text-slate-400">Cuotas de otros créditos, tarjetas</small>
                </div>
              </div>
              <div v-if="paymentCapacity !== null" class="mt-3 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3">
                <i class="pi pi-info-circle text-blue-500" />
                <span class="text-sm text-slate-600">Puede destinar hasta </span>
                <span class="text-sm font-bold text-blue-700">${{ paymentCapacity.toFixed(2) }}/mes</span>
                <span class="text-xs text-slate-400 ml-1">(ingreso disponible × 40%)</span>
              </div>
            </div>

            <!-- Sistema de amortización -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-slate-700">
                  <i class="pi pi-calculator mr-1 text-slate-400" />
                  Sistema de amortización
                </p>
                <Button
                  :label="comparing ? 'Calculando...' : (allowsBoth ? 'Calcular y comparar' : 'Calcular')"
                  icon="pi pi-refresh"
                  size="small"
                  severity="secondary"
                  :loading="comparing"
                  :disabled="!form.amount || !form.termMonths"
                  @click="runComparison"
                />
              </div>

              <!-- AMBOS sistemas: mostrar comparación -->
              <div v-if="allowsBoth" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Sistema Francés -->
                <div
                  :class="form.amortizationSystem === 'french'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'"
                  class="cursor-pointer rounded-xl border-2 p-4 transition-all select-none"
                  @click="form.amortizationSystem = 'french'"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        :class="form.amortizationSystem === 'french' ? 'bg-blue-500' : 'bg-slate-200'"
                        class="flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                      >
                        <i v-if="form.amortizationSystem === 'french'" class="pi pi-check text-white" style="font-size:0.6rem" />
                      </div>
                      <p class="font-semibold text-slate-900">Sistema Francés</p>
                    </div>
                    <Tag value="Cuotas iguales" severity="info" />
                  </div>
                  <p class="mb-3 text-xs text-slate-500">
                    Pagas la misma cuota todos los meses. Ideal para planificar tu presupuesto mensual.
                  </p>
                  <div v-if="frenchResult" class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
                    <div>
                      <p class="text-xs text-slate-400">Cuota mensual</p>
                      <p class="font-bold text-slate-900">${{ frenchResult.summary.firstInstallment?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total intereses</p>
                      <p class="font-semibold text-slate-700">${{ frenchResult.summary.totalInterest?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Tasa anual</p>
                      <p class="font-semibold text-slate-700">{{ frenchResult.summary.annualRatePct }}%</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total a pagar</p>
                      <p class="font-semibold text-slate-700">${{ frenchResult.summary.totalCreditCost?.toFixed(2) }}</p>
                    </div>
                  </div>
                  <p v-else class="py-4 text-center text-xs text-slate-400">Presiona "Calcular y comparar" para ver los valores</p>
                </div>

                <!-- Sistema Alemán -->
                <div
                  :class="form.amortizationSystem === 'german'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'"
                  class="cursor-pointer rounded-xl border-2 p-4 transition-all select-none"
                  @click="form.amortizationSystem = 'german'"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        :class="form.amortizationSystem === 'german' ? 'bg-blue-500' : 'bg-slate-200'"
                        class="flex h-4 w-4 items-center justify-center rounded-full transition-colors"
                      >
                        <i v-if="form.amortizationSystem === 'german'" class="pi pi-check text-white" style="font-size:0.6rem" />
                      </div>
                      <p class="font-semibold text-slate-900">Sistema Alemán</p>
                    </div>
                    <Tag value="Capital fijo" severity="secondary" />
                  </div>
                  <p class="mb-3 text-xs text-slate-500">
                    La cuota decrece cada mes. Pagas más al inicio pero menos interés total.
                  </p>
                  <div v-if="germanResult" class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
                    <div>
                      <p class="text-xs text-slate-400">Primera cuota</p>
                      <p class="font-bold text-slate-900">${{ germanResult.summary.firstInstallment?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Última cuota</p>
                      <p class="font-semibold text-slate-700">${{ germanResult.summary.lastInstallment?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total intereses</p>
                      <p class="font-semibold text-slate-700">${{ germanResult.summary.totalInterest?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total a pagar</p>
                      <p class="font-semibold text-slate-700">${{ germanResult.summary.totalCreditCost?.toFixed(2) }}</p>
                    </div>
                  </div>
                  <p v-else class="py-4 text-center text-xs text-slate-400">Presiona "Calcular y comparar" para ver los valores</p>
                </div>
              </div>

              <!-- SISTEMA ÚNICO (fijo por tipo de crédito) -->
              <div v-else>
                <div v-if="simResult" class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p class="mb-3 text-sm font-medium text-slate-600">
                    {{ form.amortizationSystem === 'french'
                      ? 'Sistema Francés — cuotas iguales cada mes'
                      : 'Sistema Alemán — capital fijo, cuota decreciente' }}
                  </p>
                  <div class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p class="text-xs text-slate-400">{{ form.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota' }}</p>
                      <p class="font-bold text-slate-900">${{ simResult.summary.firstInstallment?.toFixed(2) }}</p>
                    </div>
                    <div v-if="form.amortizationSystem === 'german'">
                      <p class="text-xs text-slate-400">Última cuota</p>
                      <p class="font-semibold text-slate-700">${{ simResult.summary.lastInstallment?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total intereses</p>
                      <p class="font-semibold text-slate-700">${{ simResult.summary.totalInterest?.toFixed(2) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-slate-400">Total a pagar</p>
                      <p class="font-semibold text-slate-700">${{ simResult.summary.totalCreditCost?.toFixed(2) }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="py-4 text-center text-sm text-slate-400">
                  Ingrese el monto y plazo, luego presione "Calcular"
                </p>
              </div>

              <!-- Alerta de capacidad excedida -->
              <div v-if="exceedsCapacity" class="flex gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                <i class="pi pi-exclamation-triangle mt-0.5 text-red-500" />
                <div class="text-sm text-red-800">
                  <p class="font-semibold">La cuota supera su capacidad de pago</p>
                  <p class="mt-0.5 text-xs">
                    Cuota: <strong>${{ currentInstallment.toFixed(2) }}</strong> —
                    Capacidad: <strong>${{ paymentCapacity?.toFixed(2) }}</strong>.
                    Reduzca el monto o aumente el plazo.
                  </p>
                </div>
              </div>
            </div>

            <!-- Cargos adicionales del crédito -->
            <div v-if="currentSimResult" class="flex flex-col gap-4">
              <!-- Cargos al desembolso (SOLCA, etc.) -->
              <div v-if="disbursementChargesEnriched.length" class="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p class="mb-4 text-sm font-semibold text-orange-900">
                  <i class="pi pi-wallet mr-1" />
                  Cargos al desembolso
                  <span class="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs font-normal text-orange-700">se deducen del monto</span>
                </p>
                <div class="flex flex-col gap-4">
                  <div
                    v-for="charge in disbursementChargesEnriched"
                    :key="charge.name"
                    class="flex items-start justify-between text-sm"
                    :class="charge.chargeType === 'solca' ? 'rounded-lg bg-white p-3' : ''"
                  >
                    <div>
                      <p class="font-medium text-slate-800">{{ charge.name }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{{ charge.legalNote }}</p>
                      <p v-if="charge.percentage !== null" class="text-xs text-slate-400 mt-1">{{ charge.percentage }}% del monto desembolsado</p>
                    </div>
                    <div class="ml-4 shrink-0 text-right">
                      <p class="font-semibold text-orange-800">${{ Number(charge.amount).toFixed(2) }}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-4 flex justify-between border-t border-orange-200 pt-3 text-sm">
                  <span class="font-semibold text-slate-700">Monto neto que recibirá</span>
                  <span class="font-bold text-slate-900 text-lg">${{ netDisbursement?.toFixed(2) }}</span>
                </div>
                <p class="mt-2 text-xs text-orange-700">
                  Estos valores se deducen automáticamente del monto desembolsado. El crédito se registra por el valor bruto solicitado.
                </p>
              </div>

              <!-- Cargos por cuota (seguros) -->
              <div v-if="perInstallmentChargesEnriched.length" class="rounded-lg border border-slate-200 bg-white p-4">
                <p class="mb-3 text-sm font-semibold text-slate-700">
                  <i class="pi pi-shield mr-1 text-slate-400" />
                  Seguros incluidos en cada cuota
                  <span class="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">independientes del interés</span>
                </p>
                <div class="flex flex-col gap-3">
                  <div
                    v-for="charge in perInstallmentChargesEnriched"
                    :key="charge.name"
                    class="flex items-start justify-between text-sm"
                  >
                    <div>
                      <p class="font-medium text-slate-800">{{ charge.name }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{{ charge.value }}% mensual sobre saldo{{ charge.legalNote ? ' — ' + charge.legalNote : '' }}</p>
                    </div>
                    <div class="ml-4 shrink-0 text-right">
                      <p v-if="charge.firstMonthAmount !== null" class="font-semibold text-slate-700">≈ ${{ charge.firstMonthAmount.toFixed(2) }}/mes</p>
                      <p class="text-xs text-slate-400">primera cuota</p>
                    </div>
                  </div>
                </div>
                <p class="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
                  El monto varía cada mes porque se calcula sobre el saldo pendiente. Ya incluidos en la cuota total.
                </p>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════════ -->
          <!-- PASO 2 — Documentos                                            -->
          <!-- ═══════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeStep === 2" class="flex flex-col gap-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Documentos requeridos</h2>
              <p class="mt-1 text-sm text-slate-500">Suba los archivos en formato PDF, JPG o PNG (máx. 5 MB cada uno).</p>
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="doc in docFields"
                :key="doc.key"
                class="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div class="flex items-center gap-4">
                  <div
                    :class="docFiles[doc.key] ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'"
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  >
                    <i :class="docFiles[doc.key] ? 'pi pi-check-circle text-xl' : 'pi pi-file text-xl'" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-900">{{ doc.label }}</p>
                    <p v-if="docFiles[doc.key]" class="mt-0.5 truncate text-xs text-green-600">
                      <i class="pi pi-paperclip mr-1" />{{ docFiles[doc.key].name }}
                    </p>
                    <p v-else class="mt-0.5 text-xs text-slate-400">Sin archivo seleccionado</p>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Button
                      v-if="docFiles[doc.key]"
                      icon="pi pi-times"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'Quitar archivo'"
                      @click="removeFile(doc.key)"
                    />
                    <label :for="`file-${doc.key}`" class="cursor-pointer">
                      <Button
                        :label="docFiles[doc.key] ? 'Cambiar' : 'Seleccionar'"
                        :icon="docFiles[doc.key] ? 'pi pi-refresh' : 'pi pi-upload'"
                        :severity="docFiles[doc.key] ? 'secondary' : 'primary'"
                        size="small"
                        as="span"
                      />
                    </label>
                    <input
                      :id="`file-${doc.key}`"
                      type="file"
                      :accept="doc.accept"
                      class="hidden"
                      @change="(e) => onFileSelect(doc.key, e)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <i class="pi pi-info-circle mr-1" />
              Los documentos son opcionales en este paso, pero su solicitud puede tardar más en procesarse si no los adjunta.
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════════ -->
          <!-- PASO 3 — Resumen                                               -->
          <!-- ═══════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeStep === 3" class="flex flex-col gap-5">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Resumen de la solicitud</h2>
              <p class="mt-1 text-sm text-slate-500">Revise todos los datos antes de continuar.</p>
            </div>

            <!-- Datos personales -->
            <section class="rounded-lg border border-slate-200 p-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Datos personales</p>
              <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p class="text-slate-400">Nombre</p>
                  <p class="font-medium text-slate-900">{{ form.clientName }}</p>
                </div>
                <div>
                  <p class="text-slate-400">{{ idLabel }}</p>
                  <p class="font-medium text-slate-900">{{ form.idNumber }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Teléfono</p>
                  <p class="font-medium text-slate-900">{{ form.clientPhone || '—' }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Correo</p>
                  <p class="font-medium text-slate-900">{{ form.clientEmail || '—' }}</p>
                </div>
              </div>
            </section>

            <!-- Datos del crédito -->
            <section class="rounded-lg border border-slate-200 p-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Datos del crédito</p>
              <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div>
                  <p class="text-slate-400">Tipo de crédito</p>
                  <p class="font-medium text-slate-900">{{ selectedCreditType?.name ?? '—' }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Monto solicitado</p>
                  <p class="font-semibold text-slate-900">${{ form.amount ? Number(form.amount).toFixed(2) : '—' }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Plazo</p>
                  <p class="font-medium text-slate-900">{{ form.termMonths ? `${form.termMonths} meses` : '—' }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Sistema de pago</p>
                  <p class="font-medium text-slate-900">
                    {{ form.amortizationSystem === 'french' ? 'Francés (cuotas iguales)' : 'Alemán (capital fijo)' }}
                  </p>
                </div>
                <div>
                  <p class="text-slate-400">Tasa anual</p>
                  <p class="font-medium text-slate-900">{{ currentSimResult ? `${currentSimResult.summary.annualRatePct}%` : '—' }}</p>
                </div>
                <div>
                  <p class="text-slate-400">{{ form.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota' }}</p>
                  <p class="font-bold text-slate-900">
                    {{ currentSimResult ? `$${Number(currentSimResult.summary.firstInstallment).toFixed(2)}` : '—' }}
                  </p>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-x-6 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <p class="text-slate-400">Total intereses</p>
                  <p class="font-semibold text-slate-700">
                    {{ currentSimResult ? `$${Number(currentSimResult.summary.totalInterest).toFixed(2)}` : '—' }}
                  </p>
                </div>
                <div>
                  <p class="text-slate-400">Total a pagar</p>
                  <p class="text-base font-bold text-blue-700">
                    {{ currentSimResult ? `$${Number(currentSimResult.summary.totalCreditCost).toFixed(2)}` : '—' }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Cargos al desembolso en resumen -->
            <section v-if="disbursementChargesEnriched.length" class="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  <i class="pi pi-wallet mr-2"></i>Cargos al desembolso
                </p>
                <span class="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Se deducen del monto
                </span>
              </div>
              <div class="flex flex-col gap-3 text-sm">
                <div
                  v-for="charge in disbursementChargesEnriched"
                  :key="charge.name"
                  class="flex items-start justify-between"
                  :class="charge.chargeType === 'solca' ? 'rounded-lg bg-white p-3' : ''"
                >
                  <div>
                    <p class="font-medium text-slate-800">{{ charge.name }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ charge.legalNote }}</p>
                    <p v-if="charge.percentage !== null" class="text-xs text-slate-400 mt-1">{{ charge.percentage }}% del monto</p>
                  </div>
                  <div class="ml-4 shrink-0 text-right">
                    <p class="font-semibold text-orange-800">${{ Number(charge.amount).toFixed(2) }}</p>
                  </div>
                </div>
                <div class="mt-2 flex justify-between border-t border-orange-200 pt-3 font-semibold">
                  <span class="text-slate-700">Monto neto a recibir</span>
                  <span class="text-slate-900 text-lg">{{ netDisbursement != null ? `$${Number(netDisbursement).toFixed(2)}` : '—' }}</span>
                </div>
              </div>
            </section>

            <!-- Seguros en resumen -->
            <section v-if="perInstallmentChargesEnriched.length" class="rounded-lg border border-slate-200 bg-white p-4">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <i class="pi pi-shield mr-2"></i>Seguros incluidos en cada cuota
                </p>
                <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  Independientes del interés
                </span>
              </div>
              <div class="flex flex-col gap-4 text-sm">
                <div v-for="charge in perInstallmentChargesEnriched" :key="charge.name" class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-slate-800">{{ charge.name }}</p>
                    <p class="text-xs text-slate-600 mt-1">{{ charge.value }}% mensual sobre saldo — {{ charge.legalNote }}</p>
                  </div>
                  <div class="ml-4 shrink-0 text-right">
                    <p v-if="charge.firstMonthAmount !== null" class="font-semibold text-slate-700">
                      ≈ ${{ charge.firstMonthAmount.toFixed(2) }}/mes
                    </p>
                    <p class="text-xs text-slate-400">primera cuota</p>
                  </div>
                </div>
              </div>
              <p class="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <i class="pi pi-info-circle mr-1"></i>El monto varía cada mes porque se calcula sobre el saldo pendiente. Ya incluidos en la cuota total.
              </p>
            </section>

            <!-- PDF amortización -->
            <section v-if="currentSimResult?.rows?.length" class="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-blue-900">Tabla de amortización completa</p>
                  <p class="mt-0.5 text-xs text-blue-700">
                    Vea el detalle mes a mes: capital, intereses, seguros y saldo pendiente.
                  </p>
                </div>
                <Button
                  label="Descargar PDF"
                  icon="pi pi-file-pdf"
                  size="small"
                  severity="info"
                  @click="downloadAmortizationPdf"
                />
              </div>
            </section>

            <!-- Capacidad financiera -->
            <section class="rounded-lg border border-slate-200 p-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Situación financiera declarada</p>
              <div class="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div>
                  <p class="text-slate-400">Ingresos mensuales</p>
                  <p class="font-medium text-slate-900">${{ (form.monthlyIncome || 0).toFixed(2) }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Gastos fijos</p>
                  <p class="font-medium text-slate-900">${{ (form.monthlyExpenses || 0).toFixed(2) }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Otras deudas</p>
                  <p class="font-medium text-slate-900">${{ (form.otherDebts || 0).toFixed(2) }}</p>
                </div>
              </div>
              <div v-if="paymentCapacity !== null" class="mt-2 text-sm">
                <span class="text-slate-400">Capacidad de pago: </span>
                <span class="font-bold" :class="exceedsCapacity ? 'text-red-600' : 'text-green-600'">
                  ${{ Number(paymentCapacity).toFixed(2) }}/mes
                </span>
              </div>
            </section>

            <!-- Documentos adjuntos -->
            <section class="rounded-lg border border-slate-200 p-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Documentos adjuntos</p>
              <div class="flex flex-col gap-2">
                <div v-for="doc in docFields" :key="doc.key" class="flex items-center gap-2 text-sm">
                  <i :class="docFiles[doc.key] ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-slate-300'" />
                  <span :class="docFiles[doc.key] ? 'text-slate-800' : 'text-slate-400'">{{ doc.label }}</span>
                  <span v-if="docFiles[doc.key]" class="ml-auto max-w-48 truncate text-xs text-slate-400">
                    {{ docFiles[doc.key].name }}
                  </span>
                </div>
              </div>
            </section>

            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <i class="pi pi-info-circle mr-1" />
              Al continuar se verificará su identidad y luego se enviará la solicitud a la institución financiera.
            </div>
          </div>

          <!-- ═══════════════════════════════════════════════════════════════ -->
          <!-- PASO 4 — Verificación biométrica                               -->
          <!-- ═══════════════════════════════════════════════════════════════ -->
          <div v-else-if="activeStep === 4" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold text-slate-900">Verificación de identidad</h2>
            <p class="text-sm text-slate-500">Para completar su solicitud, necesitamos verificar su identidad mediante reconocimiento facial.</p>
            <BiometricCapture @verified="onBiometricVerified" />
          </div>

          <!-- ── Navegación ────────────────────────────────────────────────── -->
          <div class="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            <Button
              v-if="activeStep > 0"
              label="Anterior"
              severity="secondary"
              icon="pi pi-arrow-left"
              @click="activeStep--"
            />
            <span v-else />
            <Button
              v-if="activeStep < 4"
              label="Siguiente"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="ml-auto"
              @click="nextStep"
            />
            <Button
              v-if="activeStep === 4"
              label="Enviar solicitud"
              icon="pi pi-send"
              :loading="submitting"
              :disabled="!biometricVerified"
              class="ml-auto"
              @click="submit"
            />
          </div>

        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import BiometricCapture from '../../components/BiometricCapture.vue';
import { useCreditStore } from '../../stores/credit.store';
import { useInstitutionStore } from '../../stores/institution.store';
import { useIdentityValidation } from '../../composables/useIdentityValidation';
import { usePdf } from '../../composables/usePdf';
import api from '../../services/api';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const toast = useToast();
const creditStore = useCreditStore();
const institutionStore = useInstitutionStore();
const { creditTypes } = storeToRefs(creditStore);
const { institution } = storeToRefs(institutionStore);
const { cedulaError, rucError, checkCedula, checkRuc } = useIdentityValidation();
const { generateCreditPdf } = usePdf();

const activeStep = ref(0);
const submitted = ref(false);
const submitting = ref(false);
const comparing = ref(false);
const biometricVerified = ref(false);

const simResult = ref<any>(null);
const frenchResult = ref<any>(null);
const germanResult = ref<any>(null);

const steps = [
  { label: 'Solicitante' },
  { label: 'Crédito' },
  { label: 'Documentos' },
  { label: 'Resumen' },
  { label: 'Verificación' },
];

const docFields = [
  { key: 'cedula', label: 'Cédula de identidad (ambos lados)', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'utility', label: 'Planilla de servicios básicos', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'income', label: 'Declaración de impuestos / Rol de pagos', accept: '.pdf,.jpg,.jpeg,.png' },
];
const docFiles = ref<Record<string, File>>({});

function onFileSelect(key: string, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) docFiles.value[key] = file;
}

function removeFile(key: string) {
  delete docFiles.value[key];
}

const state = history.state ?? {};
const form = ref({
  clientName: '',
  idNumber: '',
  clientPhone: '',
  clientEmail: '',
  creditTypeId: state.creditTypeId ?? null,
  amount: state.amount ?? null,
  termMonths: state.termMonths ?? null,
  monthlyIncome: state.monthlyIncome ?? null,
  monthlyExpenses: null as number | null,
  otherDebts: null as number | null,
  netWorth: null as number | null,
  amortizationSystem: state.amortizationSystem ?? 'french',
});

// ── Computed ──────────────────────────────────────────────────────────────────

const selectedCreditType = computed(() =>
  creditTypes.value.find((t) => t.id === form.value.creditTypeId),
);

const comesFromSimulator = computed(() => !!state.creditTypeId);

const allowsBoth = computed(() => selectedCreditType.value?.amortizationSystem === 'both');

const currentSimResult = computed(() => {
  if (allowsBoth.value) {
    return form.value.amortizationSystem === 'french' ? frenchResult.value : germanResult.value;
  }
  return simResult.value;
});

const paymentCapacity = computed(() => {
  const income = form.value.monthlyIncome || 0;
  const expenses = form.value.monthlyExpenses || 0;
  const debts = form.value.otherDebts || 0;
  if (income <= 0) return null;
  const available = income - expenses - debts;
  return available > 0 ? available * 0.4 : 0;
});

const currentInstallment = computed(() => currentSimResult.value?.summary.firstInstallment ?? 0);

const exceedsCapacity = computed(() => {
  if (!currentSimResult.value || paymentCapacity.value === null) return false;
  return currentInstallment.value > paymentCapacity.value;
});

const perInstallmentCharges = computed(() => {
  const charges = currentSimResult.value?.creditType?.charges ?? [];
  return charges.filter((c: any) => c.timing === 'per_installment' && c.active && c.chargeType !== 'solca');
});

const netDisbursement = computed(() => {
  if (!currentSimResult.value || !form.value.amount) return null;
  const total = currentSimResult.value.disbursementCharges?.reduce(
    (sum: number, c: any) => sum + Number(c.amount), 0,
  ) ?? 0;
  return form.value.amount - total;
});

// Disbursement charges enriched with the charge-entity percentage (e.g. SOLCA 0.5%)
const disbursementChargesEnriched = computed(() => {
  const disbCharges: any[] = currentSimResult.value?.disbursementCharges ?? [];
  const typeCharges: any[] = currentSimResult.value?.creditType?.charges ?? [];
  return disbCharges.map((dc: any) => {
    const tc = typeCharges.find((c: any) => c.chargeType === dc.chargeType);
    return { ...dc, percentage: tc?.value ?? null, valueType: tc?.valueType ?? 'percentage' };
  });
});

// Per-installment charges enriched with the first-installment dollar amount
const perInstallmentChargesEnriched = computed(() => {
  const firstRow = currentSimResult.value?.rows?.[0];
  return perInstallmentCharges.value.map((c: any) => {
    const rowCharge = firstRow?.additionalCharges?.find(
      (rc: any) => rc.chargeType === c.chargeType || rc.name === c.name,
    );
    return { ...c, firstMonthAmount: rowCharge ? Number(rowCharge.amount) : null };
  });
});

// ── Id type ───────────────────────────────────────────────────────────────────

const requiredIdType = computed(() => selectedCreditType.value?.idType || 'cedula');

const idLabel = computed(() => {
  const t = requiredIdType.value;
  if (t === 'ruc') return 'RUC (Registro Único de Contribuyentes)';
  if (t === 'both') return 'Cédula o RUC';
  return 'Cédula de identidad';
});

const idMaxLength = computed(() => (requiredIdType.value === 'cedula' ? 10 : 13));

const idPlaceholder = computed(() => {
  const t = requiredIdType.value;
  if (t === 'ruc') return '1234567890001';
  if (t === 'both') return '1234567890 o 1234567890001';
  return '1234567890';
});

const idError = computed(() =>
  requiredIdType.value === 'ruc' ? rucError.value : cedulaError.value,
);

function validateIdNumber(): boolean {
  const t = requiredIdType.value;
  const v = form.value.idNumber;
  if (t === 'ruc') return checkRuc(v);
  if (t === 'both') return v.length === 13 ? checkRuc(v) : checkCedula(v);
  return checkCedula(v);
}

function systemLabel(sys: string) {
  if (sys === 'french') return 'Francés';
  if (sys === 'german') return 'Alemán';
  return 'Francés o Alemán';
}

// ── Simulation ────────────────────────────────────────────────────────────────

async function runComparison() {
  if (!form.value.creditTypeId) {
    toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
    return;
  }
  if (!form.value.amount || form.value.amount < 1) {
    toast.add({ severity: 'warn', summary: 'Ingrese el monto solicitado', life: 3000 });
    return;
  }
  if (!form.value.termMonths || form.value.termMonths < 1) {
    toast.add({ severity: 'warn', summary: 'Ingrese el plazo en meses', life: 3000 });
    return;
  }
  comparing.value = true;
  try {
    const base = {
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      monthlyIncome: form.value.monthlyIncome || undefined,
    };
    if (allowsBoth.value) {
      const [fRes, gRes] = await Promise.all([
        creditStore.simulatePublic(slug.value, { ...base, system: 'french' }),
        creditStore.simulatePublic(slug.value, { ...base, system: 'german' }),
      ]);
      frenchResult.value = fRes;
      germanResult.value = gRes;
    } else {
      const sys = selectedCreditType.value?.amortizationSystem ?? 'french';
      form.value.amortizationSystem = sys;
      simResult.value = await creditStore.simulatePublic(slug.value, { ...base, system: sys });
    }
  } catch (e: any) {
    const raw = e.response?.data?.message;
    const detail = Array.isArray(raw)
      ? 'Verifique que el monto y el plazo sean valores válidos.'
      : (raw || 'Intente nuevamente');
    toast.add({ severity: 'error', summary: 'Error al simular', detail, life: 4000 });
  } finally {
    comparing.value = false;
  }
}

// ── PDF ───────────────────────────────────────────────────────────────────────

function downloadAmortizationPdf() {
  const result = currentSimResult.value;
  if (!result?.rows?.length) return;
  
  generateCreditPdf(
    result.summary,
    result.rows,
    institution.value,
    disbursementChargesEnriched.value.map((c: any) => ({
      name: c.name,
      amount: c.amount,
      legalNote: c.legalNote,
    }))
  );
}

onMounted(() => creditStore.fetchPublicTypes(slug.value));

// ── Navigation ────────────────────────────────────────────────────────────────

function nextStep() {
  if (activeStep.value === 0) {
    if (!form.value.creditTypeId)
      return toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
    if (!form.value.clientName?.trim())
      return toast.add({ severity: 'warn', summary: 'Ingrese su nombre completo', life: 3000 });
    if (!validateIdNumber()) return;
  }
  if (activeStep.value === 1) {
    if (!form.value.amount || form.value.amount <= 0)
      return toast.add({ severity: 'warn', summary: 'Ingrese el monto solicitado', life: 3000 });
    if (!form.value.termMonths || form.value.termMonths <= 0)
      return toast.add({ severity: 'warn', summary: 'Ingrese el plazo en meses', life: 3000 });
    if (!form.value.monthlyIncome || form.value.monthlyIncome <= 0)
      return toast.add({ severity: 'warn', summary: 'Ingrese sus ingresos mensuales', life: 3000 });
    if (!currentSimResult.value)
      return toast.add({ severity: 'warn', summary: 'Calcule la simulación antes de continuar', life: 3000 });
    if (exceedsCapacity.value)
      return toast.add({
        severity: 'error',
        summary: 'Capacidad de pago insuficiente',
        detail: `La cuota ($${currentInstallment.value.toFixed(2)}) supera su capacidad ($${paymentCapacity.value?.toFixed(2)}). Ajuste el monto o el plazo.`,
        life: 5000,
      });
  }
  activeStep.value++;
}

function onBiometricVerified(_descriptor: Float32Array) {
  biometricVerified.value = true;
  toast.add({ severity: 'success', summary: 'Identidad verificada', life: 3000 });
}

async function submit() {
  submitting.value = true;
  try {
    const result = currentSimResult.value;
    const payload = {
      clientName: form.value.clientName,
      idNumber: form.value.idNumber,
      clientEmail: form.value.clientEmail || undefined,
      clientPhone: form.value.clientPhone || undefined,
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      amortizationSystem: result.summary.amortizationSystem,
      appliedRate: result.summary.annualRatePct,
      scheduleJson: result.rows,
      monthlyIncome: form.value.monthlyIncome || undefined,
      monthlyExpenses: form.value.monthlyExpenses || undefined,
      otherDebts: form.value.otherDebts || undefined,
      netWorth: form.value.netWorth || undefined,
      maxPaymentCalc: paymentCapacity.value || undefined,
    };
    const { data: app } = await api.post(`/public/${slug.value}/credit-applications`, payload);
    const docTypeMap: Record<string, string> = {
      cedula: 'cedula',
      utility: 'utility_bill',
      income: 'income_proof',
    };
    for (const [key, file] of Object.entries(docFiles.value)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', docTypeMap[key] ?? key);
      await api.post(`/public/${slug.value}/credit-applications/${app.id}/documents`, fd).catch(() => {});
    }
    submitted.value = true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error al enviar', detail: e.response?.data?.message || 'Intente nuevamente', life: 4000 });
  } finally {
    submitting.value = false;
  }
}
</script>
