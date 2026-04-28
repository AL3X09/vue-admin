<script setup>
/**
 * VISTA DE GESTIÓN DE VEHÍCULOS
 * 
 * Esta vista permite gestionar los vehículos de las personas. Incluye funcionalidades de:
 * - Listar vehículos con filtros y paginación
 * - Crear nuevos vehículos
 * - Editar vehículos existentes
 * - Desactivar vehículos
 * - Filtrar por persona o tipo de vehículo
 * - Búsqueda por placa
 * 
 * FLUJO DE CREACIÓN:
 * 1. Se selecciona la persona propietario del vehículo
 * 2. Se selecciona el tipo de vehículo (carro, moto, etc.)
 * 3. Se ingresa la placa del vehículo
 * 4. Se valida que la placa no esté registrada
 * 
 * FLUJO DE EDICIÓN:
 * 1. Se modifican los datos del vehículo
 * 2. Se actualiza en el backend
 * 
 * PROPIETARIOS (Personas):
 * - Los datos se cargan desde el backend mediante el store de personas
 * - Solo personas activas se muestran en el select
 * 
 * TIPOS DE VEHÍCULOS:
 * - Los datos se cargan desde el backend mediante el store de vehicle-types
 * - Solo tipos activos se muestran en el select
 * 
 * NOTA: Esta vista es solo para administradores. Requiere permisos:
 * - parking:read - Para listar y ver vehículos
 * - parking:write - Para crear, actualizar y desactivar vehículos
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiCar, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiCarOff,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiAccount,
  mdiFormatListBulleted,
  mdiCheckCircle,
  mdiAlertCircle,
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { usePersonsStore } from '@/stores/persons.store'
import { useVehicleTypesStore } from '@/stores/vehicleTypes.store'

// ============================================
// STORES
// ============================================
const vehiclesStore = useVehiclesStore()
const personsStore = usePersonsStore()
const vehicleTypesStore = useVehicleTypesStore()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const vehicleToDeactivate = ref(null)

// Modal de creación/edición
const showFormModal = ref(false)
const isEditing = ref(false)
const editingVehicleId = ref(null)

// Formulario de vehículo
const vehicleForm = ref({
  persona_id: null,
  vehicle_type_id: null,
  placa_code: '',
})

// Filtros
const searchQuery = ref('')
const selectedPersonFilter = ref(null)
const selectedTypeFilter = ref(null)
const showActiveOnly = ref(true)

// Validación de errores
const validationErrors = ref({})

// ============================================
// COMPUTED
// ============================================

// Opciones para filtro de estado
const selectActiveOptions = [
  { id: null, label: 'Todos' },
  { id: true, label: 'Activos' },
  { id: false, label: 'Inactivos' },
]

// Vehículos filtrados y paginados
const filteredVehicles = computed(() => {
  return vehiclesStore.filteredVehicles
})

const paginatedVehicles = computed(() => {
  return vehiclesStore.paginatedVehicles
})

// Estadísticas de vehículos
const vehicleStats = computed(() => {
  return vehiclesStore.vehicleStats
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return vehiclesStore.isAdmin
})

// Opciones de personas para select (para formulario)
const selectPersonOptions = computed(() => {
  // Filtrar solo personas activas
  const allPersons = personsStore.persons || []
  const activePersons = allPersons.filter(p => p.is_active)
  return activePersons.map(person => ({
    id: person.id,
    label: `${person.nombres} ${person.apellidos}`,
  }))
})

// Opciones de tipos de vehículos para select
const selectVehicleTypeOptions = computed(() => {
  const types = vehicleTypesStore.vehicleTypes || []
  return types.filter(vt => vt.is_active).map(vt => ({
    id: vt.id,
    label: vt.emoji ? `${vt.emoji} ${vt.name}` : vt.name,
  }))
})

// Opciones de personas para filtro (en dashboard)
const selectPersonFilterOptions = computed(() => {
  return [
    { id: null, label: 'Todas las personas' },
    ...selectPersonOptions.value.map(p => ({ id: p.id, label: p.label }))
  ]
})

// Opciones de tipos para filtro (en dashboard)
const selectTypeFilterOptions = computed(() => {
  const types = vehicleTypesStore.vehicleTypes || []
  const activeTypes = types.filter(vt => vt.is_active).map(vt => ({
    id: vt.id,
    label: vt.emoji ? `${vt.emoji} ${vt.name}` : vt.name,
  }))
  return [
    { id: null, label: 'Todos los tipos' },
    ...activeTypes
  ]
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar vehículos, personas y tipos de vehículos al montar el componente
  await Promise.all([
    vehiclesStore.fetchVehicles(),
    personsStore.fetchPersons(),
    vehicleTypesStore.fetchVehicleTypes(),
  ])
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, selectedPersonFilter, selectedTypeFilter, showActiveOnly], () => {
  vehiclesStore.setFilters({
    search: searchQuery.value,
    personaId: selectedPersonFilter.value,
    vehicleTypeId: selectedTypeFilter.value,
    includeInactive: !showActiveOnly.value,
  })
})

// Limpiar errores de validación cuando cambian los campos del formulario
watch([vehicleForm], () => {
  if (Object.keys(validationErrors.value).length > 0) {
    validationErrors.value = {}
  }
}, { deep: true })

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Abre el modal para crear un nuevo vehículo
 */
const openCreateModal = () => {
  isEditing.value = false
  editingVehicleId.value = null
  resetForm()
  showFormModal.value = true
}

/**
 * Abre el modal para editar un vehículo existente
 * @param {Object} vehicle - Vehículo a editar
 */
const openEditModal = (vehicle) => {
  isEditing.value = true
  editingVehicleId.value = vehicle.id
  
  validationErrors.value = {}
  
  // Llenar el formulario con los datos del vehículo
  vehicleForm.value = {
    persona_id: vehicle.persona_id,
    vehicle_type_id: vehicle.vehicle_type_id,
    placa_code: vehicle.placa_code || '',
  }
  
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingVehicleId.value = null
  resetForm()
}

/**
 * Resetea el formulario
 */
const resetForm = () => {
  vehicleForm.value = {
    persona_id: null,
    vehicle_type_id: null,
    placa_code: '',
  }
  
  validationErrors.value = {}
}

/**
 * Valida el formulario de vehículo
 * @returns {boolean} - true si es válido, false si no
 */
const validateVehicleForm = () => {
  const errors = {}
  
  if (!vehicleForm.value.persona_id) {
    errors.persona_id = 'La persona propietaria es obligatoria'
  }
  
  if (!vehicleForm.value.vehicle_type_id) {
    errors.vehicle_type_id = 'El tipo de vehiculo es obligatorio'
  }
  
  if (!vehicleForm.value.placa_code || vehicleForm.value.placa_code.trim() === '') {
    errors.placa_code = 'La placa es obligatoria'
  } else {
    // Validar formato de placa (alfanumérico, sin caracteres especiales)
    const placaRegex = /^[A-Za-z0-9]+$/
    if (!placaRegex.test(vehicleForm.value.placa_code.trim())) {
      errors.placa_code = 'La placa debe contener solo letras y números'
    }
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/**
 * Guarda el vehículo (crea o actualiza)
 * 
 * FLUJO DE NEGOCIO GARANTIZADO:
 * 
 * CASO 1: Crear nuevo vehículo (isEditing = false)
 *   1. Se valida el formulario
 *   2. Se crea el vehículo con los datos proporcionados
 *   3. Se muestra mensaje de éxito
 * 
 * CASO 2: Actualizar vehículo existente (isEditing = true)
 *   1. Se valida el formulario
 *   2. Se actualiza el vehículo con ID específico
 *   3. Se muestra mensaje de éxito
 * 
 * IMPORTANTE: El vehículo SIEMPRE se debe crear/actualizar, sin excepción
 */
const saveVehicle = async () => {
  // Validar formulario antes de proceder
  if (!validateVehicleForm()) {
    return
  }
  
  try {
    console.log('🔵 INICIO saveVehicle - isEditing:', isEditing.value)
    console.log('🔵 vehicleForm:', JSON.stringify(vehicleForm.value))
    
    // ============================================================
    // PREPARAR PAYLOAD
    // ============================================================
    const payload = {
      persona_id: Number(vehicleForm.value.persona_id),
      vehicle_type_id: Number(vehicleForm.value.vehicle_type_id),
      placa_code: vehicleForm.value.placa_code.trim().toUpperCase(),
    }
    
    console.log('🔵 Payload de vehículo:', JSON.stringify(payload))
    
    // ============================================================
    // EJECUTAR: Crear o Actualizar vehículo
    // ============================================================
    if (isEditing.value) {
      // Actualizar vehículo existente
      console.log('🔵 Actualizando vehículo existente ID:', editingVehicleId.value)
      await vehiclesStore.updateVehicle(editingVehicleId.value, payload)
    } else {
      // Crear nuevo vehículo
      console.log('🔵 Creando nuevo vehículo...')
      await vehiclesStore.createVehicle(payload)
    }
    
    // Recargar lista de vehículos
    await vehiclesStore.fetchVehicles()
    
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar vehículo:', error)
    // El mensaje de error ya se maneja en store
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} vehicle - Vehículo a desactivar
 */
const openDeactivateModal = (vehicle) => {
  vehicleToDeactivate.value = vehicle
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  vehicleToDeactivate.value = null
}

/**
 * Confirma la desactivación del vehículo
 */
const confirmDeactivate = async () => {
  try {
    await vehiclesStore.deleteVehicle(vehicleToDeactivate.value.id)
    closeDeactivateModal()
  } catch (error) {
    console.error('Error al desactivar vehículo:', error)
    // El mensaje se muestra en el NotificationBar (vehiclesStore.error)
  }
}

// ============================================
// FUNCIONES - ACCIONES DE VEHÍCULO
// ============================================

/**
 * Activa/Desactiva un vehículo
 * @param {Object} vehicle - Vehículo
 */
const toggleVehicleStatus = async (vehicle) => {
  try {
    await vehiclesStore.toggleVehicle(vehicle.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    // El mensaje se muestra en el NotificationBar (vehiclesStore.error)
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedPersonFilter.value = null
  selectedTypeFilter.value = null
  showActiveOnly.value = true
  vehiclesStore.clearFilters()
}

/**
 * Refresca la lista de vehículos
 */
const refreshVehicles = async () => {
  await vehiclesStore.fetchVehicles()
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  vehiclesStore.setPage(page)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <div v-if="!isAdmin" class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h2 class="text-lg font-semibold text-yellow-800">Acceso denegado</h2>
        <p class="text-sm text-yellow-700">Esta vista solo está disponible para administradores logueados. Por favor, inicia sesión con una cuenta admin.</p>
      </div>
      <div v-else>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiCar" title="Gestión de Vehículos" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nuevo Vehículo"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE VEHÍCULOS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ vehicleStats.total }}</div>
            <div class="text-sm text-gray-500">Total Vehículos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ vehicleStats.active }}</div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ vehicleStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivos</div>
          </div>
        </CardBox>
      </div>

      <!-- ========================================
           FILTROS Y BÚSQUEDA
           ======================================== -->
      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Búsqueda por placa -->
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por placa..."
            />
          </FormField>
          
          <!-- Filtro por persona -->
          <FormField label="Filtrar por Persona">
            <FormControl
              v-model="selectedPersonFilter"
              :options="selectPersonFilterOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <!-- Filtro por tipo -->
          <FormField label="Filtrar por Tipo">
            <FormControl
              v-model="selectedTypeFilter"
              :options="selectTypeFilterOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <!-- Filtro por estado activo -->
          <FormField label="Mostrar Solo Activos">
            <div class="flex items-center h-10">
              <input
                type="checkbox"
                v-model="showActiveOnly"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Solo vehículos activos</span>
            </div>
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshVehicles"
            />
            <BaseButton
              label="Limpiar Filtros"
              color="info"
              outline
              small
              @click="clearFilters"
            />
          </div>
        </div>
      </CardBox>

      <!-- ========================================
           TABLA DE VEHÍCULOS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="vehiclesStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando vehículos...</div>
        </div>
        
        <template v-else>
        <!-- Mensaje de error -->
        <NotificationBar v-if="vehiclesStore.error" color="danger" :icon="mdiAlertCircle">
          {{ vehiclesStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-if="vehiclesStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ vehiclesStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de vehículos -->
        <div v-if="paginatedVehicles.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propietario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="vehicle in paginatedVehicles" :key="vehicle.id" class="hover:bg-gray-50">
                <!-- Placa -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span :icon="mdiCar" class="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ vehicle.placa_code }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ID: {{ vehicle.id }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Propietario -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="selectPersonOptions.find(p => p.id === vehicle.persona_id)" class="text-sm text-gray-900">
                    {{ selectPersonOptions.find(p => p.id === vehicle.persona_id)?.label }}
                  </div>
                  <div v-else class="text-sm text-gray-400">
                    Persona #{{ vehicle.persona_id }}
                  </div>
                </td>
                
                <!-- Tipo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="selectVehicleTypeOptions.find(t => t.id === vehicle.vehicle_type_id)" 
                       class="text-sm text-gray-900">
                    {{ selectVehicleTypeOptions.find(t => t.id === vehicle.vehicle_type_id)?.label }}
                  </div>
                  <div v-else class="text-sm text-gray-400">
                    Tipo #{{ vehicle.vehicle_type_id }}
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="vehicle.statusClass" class="text-sm font-medium">
                    {{ vehicle.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(vehicle)"
                      title="Editar vehículo"
                    />
                    <BaseButton
                      v-if="vehicle.is_active"
                      :icon="mdiCarOff"
                      color="warning"
                      small
                      @click="openDeactivateModal(vehicle)"
                      title="Desactivar vehículo"
                    />
                    <BaseButton
                      v-else
                      :icon="mdiCheckCircle"
                      color="success"
                      small
                      @click="toggleVehicleStatus(vehicle)"
                      title="Activar vehículo"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Paginación -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando {{ (vehiclesStore.pagination.currentPage - 1) * vehiclesStore.pagination.pageSize + 1 }} 
                a {{ Math.min(vehiclesStore.pagination.currentPage * vehiclesStore.pagination.pageSize, filteredVehicles.length) }} 
                de {{ filteredVehicles.length }} vehículos
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="vehiclesStore.pagination.currentPage === 1"
                  @click="changePage(vehiclesStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="vehiclesStore.pagination.currentPage >= vehiclesStore.totalPages"
                  @click="changePage(vehiclesStore.pagination.currentPage + 1)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje de lista vacía -->
        <CardBoxComponentEmpty v-else />
        </template>
      </CardBox>

      <!-- ========================================
           MODAL DE FORMULARIO DE VEHÍCULO
           ======================================== -->
      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Vehículo' : 'Nuevo Vehículo'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="vehiclesStore.isLoading"
        :hasCancel="true"
        @confirm="saveVehicle"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Persona Propietaria -->
            <FormField label="Propietario *" help="Seleccione la persona propietaria del vehículo" :error="validationErrors.persona_id">
              <FormControl
                v-model="vehicleForm.persona_id"
                :options="selectPersonOptions"
                :icon="mdiAccount"
                placeholder="Seleccione propietario"
              />
            </FormField>

            <!-- Tipo de Vehículo -->
            <FormField label="Tipo de Vehículo *" help="Seleccione el tipo de vehículo" :error="validationErrors.vehicle_type_id">
              <FormControl
                v-model="vehicleForm.vehicle_type_id"
                :options="selectVehicleTypeOptions"
                :icon="mdiCar"
                placeholder="Seleccione tipo"
              />
            </FormField>
          </div>

          <!-- Placa -->
          <FormField label="Placa *" help="Ingrese la placa del vehículo (solo letras y números)" :error="validationErrors.placa_code">
            <FormControl 
              v-model="vehicleForm.placa_code" 
              placeholder="Ej: ABC123"
              @input="vehicleForm.placa_code = vehicleForm.placa_code?.toUpperCase()"
            />
          </FormField>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Vehículo"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="vehiclesStore.isLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas desactivar el vehículo con placa
            <strong> {{ vehicleToDeactivate?.placa_code }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>