<script setup>
/**
 * VISTA DE ASIGNACIONES DE PARQUEADERO MENSUAL
 * 
 * Esta vista permite a los administradores gestionar las asignaciones
 * mensuales de parqueadero. Incluye funcionalidades de:
 * - Listar asignaciones con filtros
 * - Crear nuevas asignaciones (1-6 meses)
 * - Cancelar asignaciones existentes
 * - Ver detalles de asignaciones
 * 
 * FLUJO DE DATOS CON EL BACKEND:
 * - MonthlyAssignmentCreate: { spot_id, persona_id, start_date, months, vehicle_type, vehicle_code }
 * - MonthlyAssignmentRead: { id, spot_id, persona_id, start_date, months, end_date, vehicle_type, vehicle_code, status, monthly_price, total_price }
 * 
 * PERMISOS REQUERIDOS:
 * - parking:read - Para listar y ver asignaciones
 * - parking:write - Para crear y cancelar asignaciones
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiCar, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiCheckCircle, 
  mdiAlertCircle,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiCarSports,
  mdiMotorbike,
  mdiBike,
  mdiParking,
  mdiCalendar,
  mdiCash,
  mdiAccount,
  mdiCancel
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useNotification } from '@/composables/useNotification'
import { useParkingAssignmentsStore } from '@/stores/parkingAssignments.store'
import { useParkingSpotsStore } from '@/stores/parkingSpots.store'
import { usePersonsStore } from '@/stores/persons.store'

// ============================================
// STORES
// ============================================
const parkingAssignmentsStore = useParkingAssignmentsStore()
const parkingSpotsStore = useParkingSpotsStore()
const personsStore = usePersonsStore()

// ============================================
// COMPOSABLES
// ============================================
const { notifySuccess, notifyError } = useNotification()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de creación
const showCreateModal = ref(false)
const createLoading = ref(false)
const createError = ref(null)
const createSuccess = ref(null)

// Modal de confirmación de cancelación
const showCancelModal = ref(false)
const assignmentToCancel = ref(null)

// Formulario de creación
// Campos según MonthlyAssignmentCreate del backend:
// - spot_id: ID del espacio de parqueadero
// - persona_id: ID de la persona asignataria
// - start_date: Fecha de inicio
// - months: Cantidad de meses (1-6)
// - vehicle_type: Tipo de vehículo
// - vehicle_code: Placa o identificador
const createForm = ref({
  spot_id: null,
  persona_id: null,
  start_date: null,
  months: 1,
  vehicle_type: null,
  vehicle_code: '',
})

// Filtros
const searchQuery = ref('')
const selectedStatus = ref(null)

// ============================================
// OPTIONS
// ============================================

const selectVehicleTypeOptions = [
  { id: 'CARRO', label: 'CARRO' },
  { id: 'MOTO', label: 'MOTO' },
  { id: 'CICLA', label: 'CICLA' },
  { id: 'CICLA_ELECTRICA', label: 'BICICLETA ELÉCTRICA' },
  { id: 'PATINETA_ELECTRICA', label: 'PATINETA ELÉCTRICA' },
]

const selectMonthsOptions = [
  { id: 1, label: '1 mes' },
  { id: 2, label: '2 meses' },
  { id: 3, label: '3 meses' },
  { id: 4, label: '4 meses' },
  { id: 5, label: '5 meses' },
  { id: 6, label: '6 meses' },
]

const selectStatusOptions = [
  { id: null, label: 'Todos' },
  { id: 'ACTIVE', label: 'Activas' },
  { id: 'CANCELLED', label: 'Canceladas' },
  { id: 'EXPIRED', label: 'Expiradas' },
]

// Opciones de espacios de parqueadero
const selectSpotOptions = computed(() => {
  return parkingSpotsStore.spots
    .filter(spot => spot.parking_status === 'AVAILABLE')
    .map(spot => ({
      id: spot.id,
      label: `Espacio #${spot.id} - ${spot.spot_number || spot.id}`,
    }))
})

// Opciones de personas (seleccionables para asignación de parqueadero)
// Las personas representan propietarios/arrendatarios que pueden recibir asignaciones
const selectPersonaOptions = computed(() => {
  return personsStore.persons
    .filter(person => person.is_active)
    .map(person => ({
      id: person.id,
      label: `${person.nombres} ${person.apellidos} (${person.tipoPersona || 'Sin tipo'})`,
    }))
})

// ============================================
// COMPUTED
// ============================================

const paginatedAssignments = computed(() => {
  return parkingAssignmentsStore.paginatedAssignments
})

const assignmentStats = computed(() => {
  return parkingAssignmentsStore.assignmentStats
})

const isAdmin = computed(() => {
  return parkingAssignmentsStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  await parkingAssignmentsStore.fetchAssignments()
  await parkingSpotsStore.fetchSpots()
  await personsStore.fetchPersons()
})

// Aplicar filtros cuando cambien
watch([searchQuery, selectedStatus], () => {
  parkingAssignmentsStore.setFilters({
    search: searchQuery.value,
    status: selectedStatus.value,
  })
})

// ============================================
// WATCHERS - NOTIFICACIONES AUTOMÁTICAS
// ============================================

// Monitorear errores del store
watch(
  () => parkingAssignmentsStore.error,
  (newError) => {
    if (newError) {
      notifyError(newError, 5000)
      parkingAssignmentsStore.error = null
    }
  }
)

// Monitorear mensajes de éxito del store
watch(
  () => parkingAssignmentsStore.successMessage,
  (newMessage) => {
    if (newMessage) {
      notifySuccess(newMessage, 3000)
      parkingAssignmentsStore.successMessage = null
    }
  }
)

// ============================================
// FUNCIONES - MODAL DE CREACIÓN
// ============================================

/**
 * Abre el modal para crear una nueva asignación
 */
const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

/**
 * Cierra el modal de creación
 */
const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
}

/**
 * Resetea el formulario de creación
 */
const resetCreateForm = () => {
  createForm.value = {
    spot_id: null,
    persona_id: null,
    start_date: null,
    months: 1,
    vehicle_type: null,
    vehicle_code: '',
  }
  createError.value = null
  createSuccess.value = null
}

/**
 * SUBMIT CREATE - Envía el formulario de creación al backend
 * 
 * FLUJO:
 * 1. Valida campos requeridos (spot_id, persona_id, start_date, vehicle_type, vehicle_code)
 * 2. Prepara el payload según MonthlyAssignmentCreate del backend
 * 3. Llama al store para crear la asignación
 * 4. Muestra mensaje de éxito y cierra el modal
 * 5. Recarga la lista de asignaciones
 * 
 * PAYLOAD ENVIADO:
 * {
 *   spot_id: number,
 *   persona_id: number,
 *   start_date: string (YYYY-MM-DD),
 *   months: number (1-6),
 *   vehicle_type: string,
 *   vehicle_code: string
 * }
 */
const submitCreate = async () => {
  // Validación de campos requeridos
  if (!createForm.value.spot_id || !createForm.value.persona_id || 
      !createForm.value.start_date || !createForm.value.vehicle_type || !createForm.value.vehicle_code) {
    createError.value = 'Por favor, complete todos los campos requeridos.'
    return
  }

  createLoading.value = true
  createError.value = null
  createSuccess.value = null

  try {
    const payload = {
      // Extraer ID del objeto seleccionado o usar directamente si es número
      spot_id: createForm.value.spot_id?.id || createForm.value.spot_id,
      persona_id: createForm.value.persona_id?.id || createForm.value.persona_id,
      start_date: createForm.value.start_date,
      months: createForm.value.months?.id || createForm.value.months,
      vehicle_type: createForm.value.vehicle_type?.id || createForm.value.vehicle_type,
      vehicle_code: createForm.value.vehicle_code.toUpperCase(),
    }

    const result = await parkingAssignmentsStore.createAssignment(payload)
    
    createSuccess.value = 'Asignación creada exitosamente. ID: ' + result.id
    closeCreateModal()
    await parkingAssignmentsStore.fetchAssignments()
  } catch (error) {
    console.error('Error al crear asignación:', error)
    const detail = error?.response?.data?.detail
    createError.value = typeof detail === 'string' ? detail : 'Error al crear la asignación'
  } finally {
    createLoading.value = false
  }
}

// ============================================
// FUNCIONES - MODAL DE CANCELACIÓN
// ============================================

/**
 * Abre el modal de confirmación de cancelación
 * @param {Object} assignment - Asignación a cancelar
 */
const openCancelModal = (assignment) => {
  assignmentToCancel.value = assignment
  showCancelModal.value = true
}

/**
 * Cierra el modal de cancelación
 */
const closeCancelModal = () => {
  showCancelModal.value = false
  assignmentToCancel.value = null
}

/**
 * Confirma la cancelación de la asignación
 */
const confirmCancel = async () => {
  try {
    await parkingAssignmentsStore.cancelAssignment(assignmentToCancel.value.id)
    closeCancelModal()
    await parkingAssignmentsStore.fetchAssignments()
  } catch (error) {
    console.error('Error al cancelar asignación:', error)
  }
}

// ============================================
// FUNCIONES - UTILIDADES
// ============================================

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  parkingAssignmentsStore.clearFilters()
}

/**
 * Refresca la lista de asignaciones
 */
const refreshAssignments = async () => {
  await parkingAssignmentsStore.fetchAssignments()
}

/**
 * Obtiene el icono según el tipo de vehículo
 * @param {string} type - Tipo de vehículo
 */
const getVehicleTypeIcon = (type) => {
  switch (type?.toUpperCase()) {
    case 'CARRO': return mdiCarSports
    case 'MOTO': return mdiMotorbike
    case 'CICLA':
    case 'CICLA_ELECTRICA': return mdiBike
    case 'PATINETA_ELECTRICA': return mdiBike
    default: return mdiCar
  }
}

/**
 * Formatea una fecha
 * @param {string} dateStr - Fecha en formato ISO
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formatea moneda
 * @param {number} value - Valor a formatear
 */
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(value)
}

/**
 * Obtiene la clase del estado
 * @param {string} status - Estado de la asignación
 */
const getStatusClass = (status) => {
  const classes = {
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Obtiene la etiqueta del estado
 * @param {string} status - Estado de la asignación
 */
const getStatusLabel = (status) => {
  const labels = {
    ACTIVE: 'Activa',
    CANCELLED: 'Cancelada',
    EXPIRED: 'Expirada',
  }
  return labels[status] || status
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiParking" title="Asignaciones Parqueadero Mensual" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nueva Asignación"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE ASIGNACIONES
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ assignmentStats.total }}</div>
            <div class="text-sm text-gray-500">Total Asignaciones</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ assignmentStats.active }}</div>
            <div class="text-sm text-gray-500">Activas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ assignmentStats.cancelled }}</div>
            <div class="text-sm text-gray-500">Canceladas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-600">{{ assignmentStats.expired }}</div>
            <div class="text-sm text-gray-500">Expiradas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(assignmentStats.totalRevenue) }}</div>
            <div class="text-sm text-gray-500">Ingresos Totales</div>
          </div>
        </CardBox>
      </div>

      <!-- ========================================
           FILTROS Y BÚSQUEDA
           ======================================== -->
      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Búsqueda -->
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por persona ID, placa o espacio..."
            />
          </FormField>
          
          <!-- Filtro por estado -->
          <FormField label="Estado">
            <FormControl
              v-model="selectedStatus"
              :options="selectStatusOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshAssignments"
            />
            <BaseButton
              label="Limpiar"
              color="info"
              outline
              small
              @click="clearFilters"
            />
          </div>
        </div>
      </CardBox>

      <!-- ========================================
           TABLA DE ASIGNACIONES
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="parkingAssignmentsStore.loading" class="p-8 text-center">
          <div class="text-gray-500">Cargando asignaciones...</div>
        </div>
        
        <!-- Tabla de asignaciones -->
        <div v-else-if="paginatedAssignments.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Espacio
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="assignment in paginatedAssignments" :key="assignment.id" class="hover:bg-gray-50">
                <!-- Persona -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span :icon="mdiAccount" class="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        Persona ID: {{ assignment.persona_id }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ID Asignación: {{ assignment.id }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Espacio -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <span :icon="mdiParking" class="w-4 h-4 text-gray-500" />
                    <div class="text-sm text-gray-900">
                      Espacio #{{ assignment.spot_id }}
                    </div>
                  </div>
                </td>
                
                <!-- Veh��culo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span :icon="getVehicleTypeIcon(assignment.vehicle_type)" class="w-5 h-5 text-gray-600" />
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ assignment.vehicle_code }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ assignment.vehicle_type }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Período -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <div class="flex items-center gap-1">
                      <span :icon="mdiCalendar" class="w-4 h-4 text-gray-500" />
                      {{ formatDate(assignment.start_date) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ assignment.months }} mes(es)
                    </div>
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(assignment.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ getStatusLabel(assignment.status) }}
                  </span>
                </td>
                
                <!-- Valor -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span :icon="mdiCash" class="w-4 h-4 text-gray-500" />
                    {{ formatCurrency(assignment.total_price) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ formatCurrency(assignment.monthly_price) }}/mes
                  </div>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      v-if="isAdmin && assignment.status === 'ACTIVE'"
                      :icon="mdiCancel"
                      color="danger"
                      small
                      @click="openCancelModal(assignment)"
                      title="Cancelar"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Paginación -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="text-sm text-gray-500">
                Mostrando {{ parkingAssignmentsStore.pagination.offset + 1 }} 
                a {{ Math.min(parkingAssignmentsStore.pagination.offset + parkingAssignmentsStore.pagination.limit, parkingAssignmentsStore.filteredAssignments.length) }} 
                de {{ parkingAssignmentsStore.filteredAssignments.length }} asignaciones
              </div>
              
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="parkingAssignmentsStore.pagination.offset === 0"
                  @click="parkingAssignmentsStore.setPagination({ offset: parkingAssignmentsStore.pagination.offset - parkingAssignmentsStore.pagination.limit })"
                />
                
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="parkingAssignmentsStore.pagination.offset + parkingAssignmentsStore.pagination.limit >= parkingAssignmentsStore.filteredAssignments.length"
                  @click="parkingAssignmentsStore.setPagination({ offset: parkingAssignmentsStore.pagination.offset + parkingAssignmentsStore.pagination.limit })"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay asignaciones -->
        <CardBoxComponentEmpty v-else />
      </CardBox>

      <!-- ========================================
           MODAL DE CREACIÓN DE ASIGNACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showCreateModal"
        title="Nueva Asignación Parqueadero Mensual"
        button="info"
        buttonLabel="Crear"
        :hasCancel="true"
        :isForm="true"
        :isProcessing="createLoading"
        @confirm="submitCreate"
        @cancel="closeCreateModal"
      >
        <div class="space-y-4">
          <FormField label="Espacio de Parqueadero" help="Seleccione el espacio a asignar">
            <FormControl
              v-model="createForm.spot_id"
              :options="selectSpotOptions"
              :icon="mdiParking"
              placeholder="Seleccione un espacio"
              required
            />
          </FormField>

          <FormField label="Persona" help="Persona a quien se asignará el parqueadero">
            <FormControl
              v-model="createForm.persona_id"
              :options="selectPersonaOptions"
              :icon="mdiAccount"
              placeholder="Seleccione una persona"
              required
            />
          </FormField>

          <FormField label="Fecha de Inicio" help="Fecha cuando inicia la asignación">
            <FormControl
              v-model="createForm.start_date"
              type="date"
              :icon="mdiCalendar"
              required
            />
          </FormField>

          <FormField label="Duración" help="Cantidad de meses (1-6)">
            <FormControl
              v-model="createForm.months"
              :options="selectMonthsOptions"
              :icon="mdiCalendar"
            />
          </FormField>

          <FormField label="Tipo de Vehículo">
            <FormControl
              v-model="createForm.vehicle_type"
              :options="selectVehicleTypeOptions"
              :icon="mdiCar"
              required
            />
          </FormField>

          <FormField label="Placa o Identificador" help="Placa del vehículo o identificador">
            <FormControl
              v-model="createForm.vehicle_code"
              type="text"
              :icon="mdiCar"
              placeholder="Ej: ABC-123"
              @input="createForm.vehicle_code = createForm.vehicle_code?.toUpperCase()"
              required
            />
          </FormField>

          <div v-if="createError" class="text-red-600 text-sm">{{ createError }}</div>
          <div v-if="createSuccess" class="text-green-600 text-sm">{{ createSuccess }}</div>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE CANCELACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showCancelModal"
        title="Cancelar Asignación"
        button="danger"
        buttonLabel="Cancelar"
        :hasCancel="true"
        :isProcessing="parkingAssignmentsStore.loading"
        @confirm="confirmCancel"
        @cancel="closeCancelModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas cancelar la asignación ID
            <strong>{{ assignmentToCancel?.id }}</strong> para la persona ID
            <strong>{{ assignmentToCancel?.persona_id }}</strong> del espacio
            <strong>#{{ assignmentToCancel?.spot_id }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>

    </SectionMain>
  </LayoutAuthenticated>
</template>