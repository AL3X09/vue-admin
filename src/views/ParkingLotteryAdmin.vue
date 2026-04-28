<script setup>
import { onMounted, computed, ref } from 'vue'
import { 
  mdiCogOutline, 
  mdiCalendarClock, 
  mdiPlayCircleOutline, 
  mdiAccountGroupOutline,
  mdiClipboardListOutline,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiPlus,
  mdiEye,
  mdiAccountAlert
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'

import { useParkingLotteryStore } from '@/stores/parkingLottery.store'

// Store
const lotteryStore = useParkingLotteryStore()

// Estado local
const activeTab = ref('configs')

// Modal para ver resultados
const showResultsModal = ref(false)
const selectedRoundResults = ref(null)

// Modal para crear/editar configuración
const showConfigModal = ref(false)
const isEditingConfig = ref(false)

// Formulario de configuración
const configForm = ref({
  weight_propietario: 2.0,
  weight_good_social_behavior: 1.5,
  weight_payment_compliance: 2.0,
  max_consecutive_months: 6,
  exclusion_draws: 2,
  assignment_duration_months: 1,
  propiedad_horizontal_id: null,
  is_active: true,
})

// Errores de validación del formulario de configuración
const configFormErrors = ref({
  weight_propietario: '',
  weight_good_social_behavior: '',
  weight_payment_compliance: '',
  max_consecutive_months: '',
  exclusion_draws: '',
  assignment_duration_months: '',
})

// Formulario de ejecución del lottery
const executeForm = ref({
  config_id: null,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  available_spots: 1,
  notes: '',
})

// Errores de validación del formulario de ejecución
const executeFormErrors = ref({
  config_id: '',
  available_spots: '',
})

// Formulario de búsqueda de residente
const residentSearchForm = ref({
  persona_id: null,
})

// Errores de validación del formulario de residente
const residentFormErrors = ref({
  persona_id: '',
})

// Opciones para selects
const monthOptions = [
  { id: 1, label: 'Enero' },
  { id: 2, label: 'Febrero' },
  { id: 3, label: 'Marzo' },
  { id: 4, label: 'Abril' },
  { id: 5, label: 'Mayo' },
  { id: 6, label: 'Junio' },
  { id: 7, label: 'Julio' },
  { id: 8, label: 'Agosto' },
  { id: 9, label: 'Septiembre' },
  { id: 10, label: 'Octubre' },
  { id: 11, label: 'Noviembre' },
  { id: 12, label: 'Diciembre' },
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [
    { id: currentYear - 1, label: String(currentYear - 1) },
    { id: currentYear, label: String(currentYear) },
    { id: currentYear + 1, label: String(currentYear + 1) },
  ]
})

const warningTypeOptions = [
  { id: 'leve', label: 'Leve' },
  { id: 'moderado', label: 'Moderado' },
  { id: 'grave', label: 'Grave' },
]

// Cargar datos iniciales
onMounted(async () => {
  await Promise.all([
    lotteryStore.fetchConfigs(),
    lotteryStore.fetchRounds(),
  ])
})

// ==================== VALIDACIÓN DE FORMULARIOS ====================

const validateConfigForm = () => {
  configFormErrors.value = {
    weight_propietario: '',
    weight_good_social_behavior: '',
    weight_payment_compliance: '',
    max_consecutive_months: '',
    exclusion_draws: '',
    assignment_duration_months: '',
  }

  let isValid = true

  if (configForm.value.weight_propietario < 0) {
    configFormErrors.value.weight_propietario = 'El peso debe ser mayor o igual a 0'
    isValid = false
  }

  if (configForm.value.weight_good_social_behavior < 0) {
    configFormErrors.value.weight_good_social_behavior = 'El peso debe ser mayor o igual a 0'
    isValid = false
  }

  if (configForm.value.weight_payment_compliance < 0) {
    configFormErrors.value.weight_payment_compliance = 'El peso debe ser mayor o igual a 0'
    isValid = false
  }

  if (configForm.value.max_consecutive_months < 1) {
    configFormErrors.value.max_consecutive_months = 'El valor debe ser mayor o igual a 1'
    isValid = false
  }

  if (configForm.value.exclusion_draws < 1) {
    configFormErrors.value.exclusion_draws = 'El valor debe ser mayor o igual a 1'
    isValid = false
  }

  if (configForm.value.assignment_duration_months < 1) {
    configFormErrors.value.assignment_duration_months = 'El valor debe ser mayor o igual a 1'
    isValid = false
  }

  return isValid
}

const validateExecuteForm = () => {
  executeFormErrors.value = {
    config_id: '',
    available_spots: '',
  }

  let isValid = true

  if (!executeForm.value.config_id) {
    executeFormErrors.value.config_id = 'La configuración es requerida'
    isValid = false
  }

  if (executeForm.value.available_spots < 1) {
    executeFormErrors.value.available_spots = 'Debe haber al menos 1 parqueadero disponible'
    isValid = false
  }

  return isValid
}

const validateResidentForm = () => {
  residentFormErrors.value = {
    persona_id: '',
  }

  let isValid = true

  if (!residentSearchForm.value.persona_id) {
    residentFormErrors.value.persona_id = 'El ID del residente es requerido'
    isValid = false
  }

  return isValid
}

// ==================== CONFIGURACIONES ====================

const closeConfigModal = () => {
  showConfigModal.value = false
  isEditingConfig.value = false
  lotteryStore.clearMessages()
}

const openNewConfigModal = () => {
  isEditingConfig.value = false
  configForm.value = {
    weight_propietario: 2.0,
    weight_good_social_behavior: 1.5,
    weight_payment_compliance: 2.0,
    max_consecutive_months: 6,
    exclusion_draws: 2,
    assignment_duration_months: 1,
    propiedad_horizontal_id: null,
    is_active: true,
  }
  configFormErrors.value = {
    weight_propietario: '',
    weight_good_social_behavior: '',
    weight_payment_compliance: '',
    max_consecutive_months: '',
    exclusion_draws: '',
    assignment_duration_months: '',
  }
  lotteryStore.clearMessages()
  showConfigModal.value = true
}

const openEditConfigModal = (config) => {
  isEditingConfig.value = true
  configForm.value = {
    weight_propietario: config.weight_propietario,
    weight_good_social_behavior: config.weight_good_social_behavior,
    weight_payment_compliance: config.weight_payment_compliance,
    max_consecutive_months: config.max_consecutive_months,
    exclusion_draws: config.exclusion_draws,
    assignment_duration_months: config.assignment_duration_months,
    propiedad_horizontal_id: config.propiedad_horizontal_id,
    is_active: config.is_active,
  }
  configFormErrors.value = {
    weight_propietario: '',
    weight_good_social_behavior: '',
    weight_payment_compliance: '',
    max_consecutive_months: '',
    exclusion_draws: '',
    assignment_duration_months: '',
  }
  lotteryStore.clearMessages()
  showConfigModal.value = true
}

const saveConfig = async () => {
  if (!validateConfigForm()) {
    console.warn('❌ Formulario de configuración inválido:', configFormErrors.value)
    return
  }

  try {
    if (isEditingConfig.value) {
      const configId = lotteryStore.configs.find(c => 
        c.weight_propietario === configForm.value.weight_propietario && 
        c.max_consecutive_months === configForm.value.max_consecutive_months
      )?.id
      if (configId) {
        await lotteryStore.updateConfig(configId, configForm.value)
      }
    } else {
      await lotteryStore.createConfig(configForm.value)
    }
    closeConfigModal()
  } catch (err) {
    console.error('❌ Error al guardar configuración:', err)
  }
}

// ==================== EJECUTAR SORTEO ====================

const executeLottery = async () => {
  if (!validateExecuteForm()) {
    console.warn('❌ Formulario de ejecución inválido:', executeFormErrors.value)
    return
  }

  try {
    const result = await lotteryStore.executeLottery({
      config_id: executeForm.value.config_id,
      month: executeForm.value.month,
      year: executeForm.value.year,
      available_spots: executeForm.value.available_spots,
      notes: executeForm.value.notes,
    })
    
    executeForm.value.notes = ''
    await lotteryStore.fetchRounds()
    activeTab.value = 'rounds'
  } catch (err) {
    console.error('❌ Error al ejecutar lottery:', err)
  }
}

// ==================== VER RESULTADOS ====================

const viewRoundResults = async (round) => {
  try {
    const results = await lotteryStore.getRoundResults(round.id)
    selectedRoundResults.value = {
      round: round,
      results: results,
    }
    showResultsModal.value = true
  } catch (err) {
    console.error('❌ Error al obtener resultados:', err)
  }
}

// ==================== GESTIÓN DE RESIDENTES ====================

const searchResident = async () => {
  if (!validateResidentForm()) {
    console.warn('❌ Formulario de residente inválido:', residentFormErrors.value)
    return
  }

  try {
    await lotteryStore.getResidentBehavior(residentSearchForm.value.persona_id)
  } catch (err) {
    console.error('❌ Error al buscar residente:', err)
  }
}

const updatePaymentStatus = async (isCompliant) => {
  if (!residentSearchForm.value.persona_id) return

  try {
    await lotteryStore.updatePaymentStatus(residentSearchForm.value.persona_id, isCompliant)
    await lotteryStore.getResidentBehavior(residentSearchForm.value.persona_id)
  } catch (err) {
    console.error('❌ Error al actualizar el estado de pago:', err)
  }
}

// ==================== HELPERS ====================

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
  }
  return colors[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completado',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const currentUser = computed(() => lotteryStore.currentUser)
const isLoading = computed(() => lotteryStore.loading)
const error = computed(() => lotteryStore.error)
const successMessage = computed(() => lotteryStore.successMessage)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Título Principal -->
      <SectionTitleLineWithButton 
        :icon="mdiCalendarClock" 
        title="Sorteo de Parqueaderos (Lottery)" 
        main
      >
        <template #subtitulo>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Administración del sistema de lottery - Usuario: {{ currentUser?.name }} ({{ currentUser?.role }})
          </span>
        </template>
      </SectionTitleLineWithButton>

      <!-- Mensajes de feedback -->
      <NotificationBar v-if="error" color="danger" :icon="mdiAlertCircle">
        {{ error }}
      </NotificationBar>
      <NotificationBar v-else-if="successMessage" color="success" :icon="mdiCheckCircle">
        {{ successMessage }}
      </NotificationBar>

      <!-- Tabs de navegación -->
      <div class="mb-6 flex flex-wrap gap-2">
        <BaseButton 
          :color="activeTab === 'configs' ? 'info' : 'whiteDark'" 
          :icon="mdiCogOutline"
          label="Configuraciones"
          @click="activeTab = 'configs'"
        />
        <BaseButton 
          :color="activeTab === 'rounds' ? 'info' : 'whiteDark'" 
          :icon="mdiClipboardListOutline"
          label="Rondas"
          @click="activeTab = 'rounds'"
        />
        <BaseButton 
          :color="activeTab === 'execute' ? 'info' : 'whiteDark'" 
          :icon="mdiPlayCircleOutline"
          label="Ejecutar Sorteo"
          @click="activeTab = 'execute'"
        />
        <BaseButton 
          :color="activeTab === 'residents' ? 'info' : 'whiteDark'" 
          :icon="mdiAccountGroupOutline"
          label="Residentes"
          @click="activeTab = 'residents'"
        />
      </div>

      <!-- ==================== PESTAÑA: CONFIGURACIONES ==================== -->
      <div v-if="activeTab === 'configs'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Configuraciones del Sistema</h2>
          <BaseButton 
            color="success" 
            :icon="mdiPlus"
            label="Nueva Configuración"
            @click="openNewConfigModal"
          />
        </div>

        <CardBox>
          <div v-if="isLoading" class="text-center py-4">Cargando...</div>
          
          <div v-else-if="lotteryStore.configs.length === 0" class="text-center py-8 text-gray-500">
            No hay configuraciones creadas. Crea una nueva para comenzar.
          </div>

          <table v-else class="w-full">
            <thead>
              <tr class="border-b">
                <th class="py-3 px-4 text-left">ID</th>
                <th class="py-3 px-4 text-left">Peso Propietario</th>
                <th class="py-3 px-4 text-left">Peso Buen Comportamiento</th>
                <th class="py-3 px-4 text-left">Peso Cumplimiento</th>
                <th class="py-3 px-4 text-left">Meses Máx</th>
                <th class="py-3 px-4 text-left">Exclusión</th>
                <th class="py-3 px-4 text-left">Estado</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="config in lotteryStore.configs" :key="config.id" class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">{{ config.id }}</td>
                <td class="py-3 px-4">{{ config.weight_propietario }}</td>
                <td class="py-3 px-4">{{ config.weight_good_social_behavior }}</td>
                <td class="py-3 px-4">{{ config.weight_payment_compliance }}</td>
                <td class="py-3 px-4">{{ config.max_consecutive_months }}</td>
                <td class="py-3 px-4">{{ config.exclusion_draws }} sorteos</td>
                <td class="py-3 px-4">
                  <span :class="config.is_active ? 'text-green-600' : 'text-gray-500'">
                    {{ config.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <BaseButton 
                    color="info" 
                    :icon="mdiEye"
                    small
                    @click="openEditConfigModal(config)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </CardBox>
      </div>

      <!-- ==================== PESTAÑA: RONDAS ==================== -->
      <div v-if="activeTab === 'rounds'">
        <h2 class="text-xl font-semibold mb-4">Rondas del Sorteo</h2>

        <CardBox>
          <div v-if="isLoading" class="text-center py-4">Cargando...</div>
          
          <div v-else-if="lotteryStore.rounds.length === 0" class="text-center py-8 text-gray-500">
            No hay rondas ejecutadas. Ejecuta un nuevo sorteo.
          </div>

          <table v-else class="w-full">
            <thead>
              <tr class="border-b">
                <th class="py-3 px-4 text-left">ID</th>
                <th class="py-3 px-4 text-left">Ronda</th>
                <th class="py-3 px-4 text-left">Fecha</th>
                <th class="py-3 px-4 text-left">Período</th>
                <th class="py-3 px-4 text-left">Parqueaderos</th>
                <th class="py-3 px-4 text-left">Estado</th>
                <th class="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="round in lotteryStore.rounds" :key="round.id" class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">{{ round.id }}</td>
                <td class="py-3 px-4">#{{ round.round_number }}</td>
                <td class="py-3 px-4">{{ formatDate(round.round_date) }}</td>
                <td class="py-3 px-4">
                  {{ formatDate(round.start_date) }} - {{ formatDate(round.end_date) }}
                </td>
                <td class="py-3 px-4">
                  {{ round.assigned_spots }} / {{ round.available_spots }}
                </td>
                <td class="py-3 px-4">
                  <span :class="`text-${getStatusColor(round.status)}-600`">
                    {{ getStatusLabel(round.status) }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <BaseButton 
                    color="info" 
                    :icon="mdiEye"
                    small
                    label="Ver Resultados"
                    @click="viewRoundResults(round)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </CardBox>
      </div>

      <!-- ==================== PESTAÑA: EJECUTAR SORTEO ==================== -->
      <div v-if="activeTab === 'execute'">
        <h2 class="text-xl font-semibold mb-4">Ejecutar Nuevo Sorteo</h2>

        <CardBox isForm @submit.prevent="executeLottery">
          <NotificationBar v-if="error" color="danger" :icon="mdiAlertCircle" class="mb-4">
            {{ error }}
          </NotificationBar>

          <FormField label="Configuración a usar" :error="executeFormErrors.config_id">
            <FormControl 
              v-model="executeForm.config_id" 
              :options="lotteryStore.configs.filter(c => c.is_active).map(c => ({ id: c.id, label: `Config #${c.id}` }))"
              placeholder="Selecciona una configuración"
              required
            />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Mes">
              <FormControl 
                v-model="executeForm.month" 
                :options="monthOptions"
                required
              />
            </FormField>

            <FormField label="Año">
              <FormControl 
                v-model="executeForm.year" 
                :options="yearOptions"
                required
              />
            </FormField>
          </div>

          <FormField label="Parqueaderos Disponibles" help="Número de parqueaderos a sortear en esta ronda" :error="executeFormErrors.available_spots">
            <FormControl 
              v-model="executeForm.available_spots" 
              type="number"
              min="1"
              required
            />
          </FormField>

          <FormField label="Notas" help="Notas opcionales sobre este sorteo">
            <FormControl 
              v-model="executeForm.notes" 
              type="textarea"
              placeholder="Notas adicionales..."
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton 
                type="submit" 
                color="success" 
                :disabled="isLoading"
                :icon="mdiPlayCircleOutline"
                :label="isLoading ? 'Ejecutando...' : 'Ejecutar Sorteo'"
              />
            </BaseButtons>
          </template>
        </CardBox>

        <!-- Información adicional -->
        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 class="font-semibold text-blue-800 mb-2">Información del Sistema</h3>
          <ul class="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>El sistema usa un modelo probabilístico basado en pesos configurables</li>
            <li>Los propietarios tienen peso adicional sobre los arrendatarios</li>
            <li>El buen comportamiento social incrementa la probabilidad de ganar</li>
            <li>Los residentes al día en pagos tienen prioridad</li>
            <li>Después de {{ lotteryStore.configs[0]?.max_consecutive_months || 6 }} meses consecutivos, el residente es excluido temporalmente</li>
          </ul>
        </div>
      </div>

      <!-- ==================== PESTAÑA: RESIDENTES ==================== -->
      <div v-if="activeTab === 'residents'">
        <h2 class="text-xl font-semibold mb-4">Gestión de Residentes</h2>

        <!-- Búsqueda de residente -->
        <CardBox isForm @submit.prevent="searchResident" class="mb-6">
          <NotificationBar v-if="error" color="danger" :icon="mdiAlertCircle" class="mb-4">
            {{ error }}
          </NotificationBar>

          <FormField label="ID del Residente" help="Ingresa el ID de la persona para buscar su comportamiento" :error="residentFormErrors.persona_id">
            <FormControl 
              v-model="residentSearchForm.persona_id" 
              type="number"
              placeholder="ID de la persona"
              required
            />
          </FormField>

          <template #footer>
            <BaseButtons>
              <BaseButton 
                type="submit" 
                color="info" 
                :disabled="isLoading"
                :icon="mdiAccountGroupOutline"
                :label="isLoading ? 'Buscando...' : 'Buscar'"
              />
            </BaseButtons>
          </template>
        </CardBox>

        <!-- Información del residente -->
        <div v-if="lotteryStore.residentBehavior" class="space-y-4">
          <CardBox>
            <h3 class="font-semibold text-lg mb-4">Información del Residente</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">ID Persona</div>
                <div class="font-semibold">{{ lotteryStore.residentBehavior.persona_id }}</div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">Meses Consecutivos</div>
                <div class="font-semibold">{{ lotteryStore.residentBehavior.consecutive_months }}</div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">Último Premio</div>
                <div class="font-semibold">{{ formatDate(lotteryStore.residentBehavior.last_won_date) }}</div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">Llamados de Atención</div>
                <div class="font-semibold">{{ lotteryStore.residentBehavior.warnings_count }}</div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">Excluido Hasta</div>
                <div class="font-semibold">
                  {{ lotteryStore.residentBehavior.excluded_until 
                    ? formatDate(lotteryStore.residentBehavior.excluded_until) 
                    : 'No excluido' }}
                </div>
              </div>
              
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-500">Cumplimiento de Pago</div>
                <div class="font-semibold" :class="lotteryStore.residentBehavior.is_payment_compliant ? 'text-green-600' : 'text-red-600'">
                  {{ lotteryStore.residentBehavior.is_payment_compliant ? 'Al día' : 'Moroso' }}
                </div>
              </div>
            </div>
          </CardBox>

          <!-- Acciones rápidas -->
          <CardBox>
            <h3 class="font-semibold text-lg mb-4">Acciones</h3>
            <div class="flex flex-wrap gap-2">
              <BaseButton 
                color="success" 
                :icon="mdiCheckCircle"
                label="Marcar al Día"
                @click="updatePaymentStatus(true)"
              />
              <BaseButton 
                color="danger" 
                :icon="mdiAccountAlert"
                label="Marcar Moroso"
                @click="updatePaymentStatus(false)"
              />
            </div>
          </CardBox>
        </div>

        <CardBoxComponentEmpty v-else />
      </div>

      <!-- ==================== MODAL: CONFIGURACIÓN ==================== -->
      <CardBoxModal 
        v-model="showConfigModal" 
        :title="isEditingConfig ? 'Editar Configuración' : 'Nueva Configuración'"
        :buttonLabel="isEditingConfig ? 'Actualizar' : 'Crear'"
        :button="isEditingConfig ? 'success' : 'info'"
        :hasCancel="true"
        :isForm="true"
        :isProcessing="isLoading"
        @confirm="saveConfig"
        @cancel="closeConfigModal"
      >
        <NotificationBar v-if="error" color="danger" :icon="mdiAlertCircle" class="mb-4">
          {{ error }}
        </NotificationBar>

        <FormField label="Peso Propietario" help="Peso adicional para propietarios (vs arrendatarios)" :error="configFormErrors.weight_propietario">
          <FormControl v-model="configForm.weight_propietario" type="number" step="0.1" min="0" />
        </FormField>

        <FormField label="Peso Buen Comportamiento" help="Peso adicional para residentes sin llamados de atención" :error="configFormErrors.weight_good_social_behavior">
          <FormControl v-model="configForm.weight_good_social_behavior" type="number" step="0.1" min="0" />
        </FormField>

        <FormField label="Peso Cumplimiento de Pago" help="Peso adicional para residentes al día en pagos" :error="configFormErrors.weight_payment_compliance">
          <FormControl v-model="configForm.weight_payment_compliance" type="number" step="0.1" min="0" />
        </FormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Meses Consecutivos Máximos" :error="configFormErrors.max_consecutive_months">
            <FormControl v-model="configForm.max_consecutive_months" type="number" min="1" />
          </FormField>

          <FormField label="Sorteos de Exclusión" :error="configFormErrors.exclusion_draws">
            <FormControl v-model="configForm.exclusion_draws" type="number" min="1" />
          </FormField>
        </div>

        <FormField label="Duración de Asignación (meses)" :error="configFormErrors.assignment_duration_months">
          <FormControl v-model="configForm.assignment_duration_months" type="number" min="1" />
        </FormField>

        <FormField label="Activo">
          <FormControl v-model="configForm.is_active" type="checkbox" />
        </FormField>

        <div class="text-xs text-gray-500 mt-2">
          La configuración se guardará al hacer clic en "{{ isEditingConfig ? 'Actualizar' : 'Crear' }}".
        </div>
      </CardBoxModal>

      <!-- ==================== MODAL: RESULTADOS ==================== -->
      <CardBoxModal 
        v-model="showResultsModal" 
        title="Resultados del Sorteo"
        large
        :buttonLabel="'Cerrar'"
        :button="'whiteDark'"
        :hasCancel="true"
        :isProcessing="isLoading"
        @cancel="showResultsModal = false"
      >
        <div v-if="selectedRoundResults">
          <div class="mb-4">
            <h3 class="font-semibold">Ronda #{{ selectedRoundResults.round.round_number }}</h3>
            <p class="text-sm text-gray-500">
              Fecha: {{ formatDate(selectedRoundResults.round.round_date) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="p-3 bg-blue-50 rounded">
              <div class="text-sm text-gray-500">Total Parqueaderos</div>
              <div class="text-xl font-bold">{{ selectedRoundResults.results?.available_spots || 0 }}</div>
            </div>
            <div class="p-3 bg-green-50 rounded">
              <div class="text-sm text-gray-500">Asignados</div>
              <div class="text-xl font-bold">{{ selectedRoundResults.results?.selected_count || 0 }}</div>
            </div>
          </div>

          <div v-if="selectedRoundResults.results?.selected_residents?.length > 0">
            <h4 class="font-semibold mb-2">Residentes Ganadores</h4>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="py-2 px-2 text-left">ID Persona</th>
                  <th class="py-2 px-2 text-left">Puntuación</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resident in selectedRoundResults.results.selected_residents" :key="resident.persona_id" class="border-b">
                  <td class="py-2 px-2">{{ resident.persona_id }}</td>
                  <td class="py-2 px-2">{{ resident.score?.toFixed(2) || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center py-4 text-gray-500">
            No hay residentes seleccionados en esta ronda.
          </div>
        </div>
      </CardBoxModal>

    </SectionMain>
  </LayoutAuthenticated>
</template>
