<script setup>
/**
 * VISTA ADMINISTRATIVA DE GESTION DE PARQUEADEROS
 * 
 * Esta vista permite gestionar los spots de parqueadero del conjunto residencial.
 * Incluye funcionalidades de:
 * - Listar spots con filtros y paginacion
 * - Crear nuevos spots de parqueadero
 * - Editar spots existentes
 * - Desactivar/Activar spots
 * - Filtrar por tipo de vehiculo
 * - Busqueda por codigo
 * 
 * REQUISITOS DE ACCESO:
 * - Solo usuarios con rol ADMIN pueden acceder a esta vista
 * - El rol puede venir como objeto (nuevo formato) o string (legacy)
 * - Estructura del objeto rol: { id, name, description, permissions }
 * 
 * PERMISOS REQUERIDOS (del backend):
 * - parking:read - Para listar y ver parqueaderos
 * - parking:write - Para crear, actualizar y desactivar parqueaderos
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
  mdiLock,
  mdiLockOpen
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
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useNotification } from '@/composables/useNotification'
import { useParkingSpotsStore } from '@/stores/parkingSpots.store'
import { useAuthStore } from '@/stores/auth.store'

const parkingSpotsStore = useParkingSpotsStore()
const authStore = useAuthStore()

// ============================================
// COMPOSABLES
// ============================================
const { notifySuccess, notifyError } = useNotification()

// ============================================
// ESTADO LOCAL - STATE
// ============================================

// Modal de desactivacion
const showDeactivateModal = ref(false)
const spotToDeactivate = ref(null)

// Estado de procesamiento para evitar doble envio
const isProcessing = ref(false)

// Modal de formulario (crear/editar)
const showFormModal = ref(false)
const isEditing = ref(false)
const editingSpotId = ref(null)

// Formulario de spot
const spotForm = ref({
  code: '',
  vehicle_type_id: null,
  parking_status: 'disponible',
  monthly_price: null,
  minute_price: null,
  is_active: true,
  is_public: true,
})

// Filtros locales
const searchQuery = ref('')
const selectedVehicleType = ref(null)
const showActiveOnly = ref(true)

// ============================================
// OPCIONES PARA SELECTS
// ============================================

// Computed para filtro de tipo de vehiculo (incluye "Todos")
const selectVehicleTypeOptions = computed(() => [
  { id: null, label: 'Todos' },
  ...parkingSpotsStore.vehicleTypes.map(vt => ({ id: vt.id, label: vt.name }))
])

// Computed para opciones de tipo de vehiculo en formulario
const vehicleTypeOptions = computed(() => 
  parkingSpotsStore.vehicleTypes.map(vt => ({ id: vt.id, label: vt.name }))
)

// Opciones para estado de parqueadero
const parkingStatusOptions = [
  { id: 'disponible', label: 'Disponible' },
  { id: 'ocupado', label: 'Ocupado' },
]

// ============================================
// COMPUTED - PROPIEDADES CALCULADAS
// ============================================

/**
 * Filtra los spots segun los filtros locales (busqueda y tipo de vehiculo)
 * @returns {Array} Lista de spots filtrados
 */
const filteredSpots = computed(() => {
  let spots = [...parkingSpotsStore.spots]
  
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    spots = spots.filter(spot => 
      spot.code?.toLowerCase().includes(searchLower) ||
      spot.location?.toLowerCase().includes(searchLower)
    )
  }
  
  if (selectedVehicleType.value) {
    spots = spots.filter(spot => spot.vehicle_type_id === selectedVehicleType.value)
  }
  
  return spots
})

/**
 * Obtiene los spots paginados segun el offset y limit del store
 * @returns {Array} Lista de spots para la pagina actual
 */
const paginatedSpots = computed(() => {
  const start = (parkingSpotsStore.pagination.offset)
  const end = start + parkingSpotsStore.pagination.limit
  return filteredSpots.value.slice(start, end)
})

/**
 * Calcula estadisticas de los spots (total, activos, inactivos, por tipo)
 * @returns {Object} Objeto con las estadisticas
 */
const spotStats = computed(() => {
  const spots = parkingSpotsStore.spots
  const stats = {
    total: spots.length,
    active: spots.filter(s => s.is_active).length,
    inactive: spots.filter(s => !s.is_active).length,
  }
  
  // Contar por tipo de vehículo dinámicamente
  parkingSpotsStore.vehicleTypes.forEach(vt => {
    const key = vt.name.toLowerCase().replace(/\s+/g, '_')
    stats[key] = spots.filter(s => s.vehicle_type_id === vt.id).length
  })
  
  return stats
})

/**
 * Verifica si el usuario actual es administrador
 * Usa el getter del store que tiene la logica correcta
 */
const isAdmin = computed(() => {
  const result = parkingSpotsStore.isAdmin
  console.log('🔍 [ParkingSpotsView] isAdmin computed:', result)
  return result
})

/**
 * CICLO DE VIDA - onMounted
 * Carga los tipos de vehiculos y spots de parqueadero al montar el componente
 */
onMounted(async () => {
  await parkingSpotsStore.fetchVehicleTypes()
  await parkingSpotsStore.fetchSpots()
})

/**
 * WATCHERS
 * Sincroniza los filtros locales con el store cuando cambian
 */
watch([searchQuery, selectedVehicleType, showActiveOnly], () => {
  parkingSpotsStore.setFilters({
    vehicle_type_id: selectedVehicleType.value,
    active_only: showActiveOnly.value,
  })
})

/**
 * Abre el modal para crear un nuevo spot
 * Resetea el formulario y abre el modal
 */
const openCreateModal = () => {
  isEditing.value = false
  editingSpotId.value = null
  resetForm()
  showFormModal.value = true
}

/**
 * Abre el modal para editar un spot existente
 * @param {Object} spot - Spot a editar
 */
const openEditModal = (spot) => {
  isEditing.value = true
  editingSpotId.value = spot.id
  
  spotForm.value = {
    code: spot.code,
    vehicle_type_id: spot.vehicle_type_id || spot.id,
    parking_status: spot.parking_status || 'disponible',
    monthly_price: spot.monthly_price ?? null,
    minute_price: spot.minute_price ?? null,
    is_active: spot.is_active,
  }
  
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingSpotId.value = null
  resetForm()
}

/**
 * Resetea el formulario a sus valores por defecto
 */
const resetForm = () => {
  spotForm.value = {
    code: '',
    vehicle_type_id: null,
    parking_status: 'disponible',
    monthly_price: null,
    minute_price: null,
    is_active: true,
  }
}

/**
 * GUARDAR SPOT - Crea o actualiza un spot de parqueadero
 * 
 * Proceso:
 * 1. Prepara el payload con los datos del formulario
 * 2. Si es edicion, incluye parking_status e is_active
 * 3. Llama al store para crear o actualizar
 * 4. Muestra mensaje de exito/error
 * 5. Cierra el modal
 */
const saveSpot = async () => {
  isProcessing.value = true
  try {
    const parsePrice = (value) => {
  if (value === null || value === '' || value === undefined) return null;
  
  // Limpiamos todo lo que no sea número
  let strValue = String(value).replace(/[^0-9]/g, '');
  
  if (!strValue) return null;
  
  // IMPORTANTE: Retornamos el string directamente. 
  // NO uses parseInt() si no es estrictamente necesario, 
  // porque el tipo Number es el que dispara la notación científica.
  return strValue; 
}

    const monthlyParsed = parsePrice(spotForm.value.monthly_price)
    const minuteParsed = parsePrice(spotForm.value.minute_price)
    
    console.log('📝 [saveSpot] Valores parseados:', {
      monthly_price: monthlyParsed,
      minute_price: minuteParsed,
      types: {
        monthly_price_type: typeof monthlyParsed,
        minute_price_type: typeof minuteParsed,
      }
    })

    const payload = {
      code: spotForm.value.code,
      vehicle_type_id: spotForm.value.vehicle_type_id,
    }
    
    // Solo agregar precios si no son null
    if (monthlyParsed !== null) {
      payload.monthly_price = monthlyParsed
    }
    if (minuteParsed !== null) {
      payload.minute_price = minuteParsed
    }

    // Serializar con replacer personalizado para evitar notación científica
    const customStringify = (obj) => {
      return JSON.stringify(obj, (key, value) => {
        // Mantener números como números, sin notación científica
        if (typeof value === 'number' && !Number.isInteger(value)) {
          return value
        }
        return value
      })
    }

    console.log('📝 [saveSpot] Payload final:', payload)
    console.log('📝 [saveSpot] Payload JSON stringify:', customStringify(payload))

    if (isEditing.value) {
      payload.parking_status = spotForm.value.parking_status
      payload.is_active = spotForm.value.is_active
      await parkingSpotsStore.updateSpot(editingSpotId.value, payload)
      notifySuccess('Spot actualizado correctamente')
    } else {
      await parkingSpotsStore.createSpot(payload)
      notifySuccess('Spot creado correctamente')
    }

    closeFormModal()
  } catch (error) {
    const msg = error?.response?.data?.detail || error?.message || 'Error al guardar spot'
    notifyError(msg)
  } finally {
    isProcessing.value = false
  }
}

/**
 * Abre el modal de confirmacion para desactivar un spot
 * @param {Object} spot - Spot a desactivar
 */
const openDeactivateModal = (spot) => {
  spotToDeactivate.value = spot
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivacion
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  spotToDeactivate.value = null
}

/**
 * CONFIRMAR DESACTIVACION - Desactiva un spot de parqueadero
 * 
 * Proceso:
 * 1. Llama al store para desactivar el spot
 * 2. Muestra mensaje de exito/error
 * 3. Cierra el modal
 */
const confirmDeactivate = async () => {
  isProcessing.value = true
  try {
    await parkingSpotsStore.deactivateSpot(spotToDeactivate.value.id)
    notifySuccess('Spot desactivado correctamente')
    closeDeactivateModal()
  } catch (error) {
    const msg = error?.response?.data?.detail || error?.message || 'Error al desactivar spot'
    notifyError(msg)
  } finally {
    isProcessing.value = false
  }
}

/**
 * CAMBIAR ESTADO - Activa o desactiva un spot
 * @param {Object} spot - Spot a modificar
 */
const toggleSpotStatus = async (spot) => {
  isProcessing.value = true
  const newState = !spot.is_active
  try {
    await parkingSpotsStore.updateSpot(spot.id, { is_active: newState })
    notifySuccess(newState ? 'Spot activado correctamente' : 'Spot desactivado correctamente')
  } catch (error) {
    const msg = error?.response?.data?.detail || error?.message || 'Error al cambiar estado'
    notifyError(msg)
  } finally {
    isProcessing.value = false
  }
}

/**
 * LIMPIAR FILTROS - Reinicia todos los filtros a su valor por defecto
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedVehicleType.value = null
  showActiveOnly.value = true
  parkingSpotsStore.setFilters({
    vehicle_type_id: null,
    active_only: true,
  })
}

/**
 * REFRESCAR - Recarga los spots desde el backend
 */
const refreshSpots = async () => {
  await parkingSpotsStore.fetchSpots()
}

/**
 * Obtiene el icono segun el tipo de vehiculo
 * @param {number} typeId - ID del tipo de vehiculo
 * @returns {string} Icono de Material Design
 */
const getVehicleTypeIcon = (typeId) => {
  const vehicleType = parkingSpotsStore.vehicleTypes.find(vt => vt.id === typeId)
  if (!vehicleType) return mdiCar
  
  const name = vehicleType.name.toLowerCase()
  if (name.includes('carro') || name.includes('auto')) return mdiCarSports
  if (name.includes('moto')) return mdiMotorbike
  if (name.includes('cicla') || name.includes('bici')) return mdiBike
  
  return mdiCar
}

/**
 * Obtiene el label legible segun el ID del tipo de vehiculo
 * @param {number} typeId - ID del tipo de vehiculo
 * @returns {string} Label formateado
 */
const getVehicleTypeLabel = (typeId) => {
  const vehicleType = parkingSpotsStore.vehicleTypes.find(vt => vt.id === typeId)
  return vehicleType?.name || 'Desconocido'
}

</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- Mensaje de acceso denegado si no es admin -->
      <div v-if="!isAdmin" class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h2 class="text-lg font-semibold text-yellow-800">Acceso denegado</h2>
        <p class="text-sm text-yellow-700">Esta vista solo esta disponible para administradores. Por favor, inicia sesion con una cuenta admin.</p>
        <p v-if="authStore?.user" class="text-xs text-yellow-600 mt-2">Debug: Tu rol es {{ authStore.roleName }}</p>
      </div>
      
      <!-- Contenido solo para admins -->
      <div v-else>
        <!-- ========================================
             ENCABEZADO DE LA PAGINA
             ======================================== -->
        <SectionTitleLineWithButton :icon="mdiParking" title="Gestion de Parqueaderos" main>
          <BaseButton
            v-if="isAdmin"
            :icon="mdiPlus"
            label="Nuevo Parqueadero"
            color="contrast"
            rounded-full
            small
            @click="openCreateModal"
          />
        </SectionTitleLineWithButton>

        <!-- ========================================
             ESTADISTICAS DE SPOTS
             ======================================== -->
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">{{ spotStats.total }}</div>
              <div class="text-sm text-gray-500">Total Spots</div>
            </div>
          </CardBox>
          
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-emerald-600">{{ spotStats.active }}</div>
              <div class="text-sm text-gray-500">Activos</div>
            </div>
          </CardBox>
          
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-red-600">{{ spotStats.inactive }}</div>
              <div class="text-sm text-gray-500">Inactivos</div>
            </div>
          </CardBox>
          
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600">{{ spotStats.cars }}</div>
              <div class="text-sm text-gray-500">Carros</div>
            </div>
          </CardBox>
          
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-600">{{ spotStats.motorcycles }}</div>
              <div class="text-sm text-gray-500">Motocicletas</div>
            </div>
          </CardBox>
          
          <CardBox class="p-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-teal-600">{{ spotStats.bicycles }}</div>
              <div class="text-sm text-gray-500">Bicicletas</div>
            </div>
          </CardBox>
        </div>

        <!-- ========================================
             FILTROS Y BUSQUEDA
             ======================================== -->
        <CardBox class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <!-- Busqueda -->
            <FormField label="Buscar">
              <FormControl
                v-model="searchQuery"
                :icon="mdiMagnify"
                placeholder="Buscar por numero o ubicacion..."
              />
            </FormField>
            
            <!-- Filtro por tipo de vehiculo -->
            <FormField label="Tipo de Vehiculo">
              <FormControl
                v-model="selectedVehicleType"
                :options="selectVehicleTypeOptions"
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
                <span class="ml-2 text-sm text-gray-700">Solo spots activos</span>
              </div>
            </FormField>
            
            <!-- Botones de accion -->
            <div class="flex items-end gap-2">
              <BaseButton
                :icon="mdiRefresh"
                color="info"
                small
                @click="refreshSpots"
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
             TABLA DE SPOTS
             ======================================== -->
        <CardBox class="mb-6" has-table>
          <!-- Tabla de spots -->
          <div v-if="paginatedSpots.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spot
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Vehiculo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precios
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
                <tr v-for="spot in paginatedSpots" :key="spot.id" class="hover:bg-gray-50">
                  <!-- Spot -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span :icon="getVehicleTypeIcon(spot.vehicle_type_id)" class="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          Codigo: {{ spot.code }}
                        </div>
                        <div class="text-sm text-gray-500">
                          ID: {{ spot.id }}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Tipo de Vehiculo -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {{ getVehicleTypeLabel(spot.vehicle_type_id) }}
                    </span>
                  </td>
                  
                  <!-- Precios -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      Mensual: {{ spot.monthly_price }}
                    </div>
                    <div class="text-sm text-gray-500">
                      Minuto: {{ spot.minute_price }}
                    </div>
                  </td>
                  
                  <!-- Estado -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium flex items-center gap-1">
                      <span :icon="spot.is_active ? mdiLockOpen : mdiLock" class="w-4 h-4" />
                      {{ spot.is_active ? 'Activo' : 'Inactivo' }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ spot.parking_status === 'disponible' ? 'Disponible' : 'Ocupado' }}
                    </div>
                  </td>
                  
                  <!-- Acciones -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <BaseButton
                        :icon="mdiPencil"
                        color="info"
                        small
                        @click="openEditModal(spot)"
                        title="Editar spot"
                      />
                      <BaseButton
                        v-if="spot.is_active"
                        :icon="mdiLock"
                        color="warning"
                        small
                        @click="openDeactivateModal(spot)"
                        title="Desactivar spot"
                      />
                      <BaseButton
                        v-else
                        :icon="mdiLockOpen"
                        color="success"
                        small
                        @click="toggleSpotStatus(spot)"
                        title="Activar spot"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Paginacion -->
            <div class="px-6 py-4 border-t border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-sm text-gray-700">
                  Mostrando {{ parkingSpotsStore.pagination.offset + 1 }} 
                  a {{ Math.min(parkingSpotsStore.pagination.offset + parkingSpotsStore.pagination.limit, filteredSpots.length) }} 
                  de {{ filteredSpots.length }} spots
                </div>
                <div class="flex gap-2">
                  <BaseButton
                    label="Anterior"
                    color="info"
                    outline
                    small
                    :disabled="parkingSpotsStore.pagination.offset === 0"
                    @click="parkingSpotsStore.setPagination({ offset: parkingSpotsStore.pagination.offset - parkingSpotsStore.pagination.limit })"
                  />
                  <BaseButton
                    label="Siguiente"
                    color="info"
                    outline
                    small
                    :disabled="parkingSpotsStore.pagination.offset + parkingSpotsStore.pagination.limit >= filteredSpots.length"
                    @click="parkingSpotsStore.setPagination({ offset: parkingSpotsStore.pagination.offset + parkingSpotsStore.pagination.limit })"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Mensaje de lista vacia -->
          <CardBoxComponentEmpty v-else />
        </CardBox>

        <!-- ========================================
             MODAL DE FORMULARIO (CREAR/EDITAR)
             ======================================== -->
        <CardBoxModal
          v-model="showFormModal"
          :title="isEditing ? 'Editar Parqueadero' : 'Nuevo Parqueadero'"
          :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
          :isForm="true"
          :isProcessing="isProcessing"
          :hasCancel="true"
          @confirm="saveSpot"
          @cancel="closeFormModal"
        >
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Codigo" help="Codigo unico del parqueadero, ej. A-01">
                <FormControl
                  v-model="spotForm.code"
                  placeholder="Ej: A-01"
                />
              </FormField>

              <FormField label="Tipo de Vehiculo" help="Tipo de vehiculo permitido">
                <FormControl
                  v-model="spotForm.vehicle_type_id"
                  :options="vehicleTypeOptions"
                />
              </FormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Precio Mensual" help="Tarifa mensual para el spot">
                <FormControl
                  v-model="spotForm.monthly_price"
                  type="text"
                  placeholder="Ej: 150000"
                />
              </FormField>

              <FormField label="Precio por Minuto" help="Tarifa por minuto para visitantes">
                <FormControl
                  v-model="spotForm.minute_price"
                  type="text"
                  placeholder="Ej: 200"
                />
              </FormField>
            </div>

            <FormField label="Estado de Parqueadero" help="Indica si esta disponible u ocupado">
              <FormControl
                v-model="spotForm.parking_status"
                :options="parkingStatusOptions"
              />
            </FormField>

            <FormField label="Activo">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="spotForm.is_active"
                  id="is_active"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="is_active" class="ml-2 text-sm text-gray-700">Parqueadero activo</label>
              </div>
            </FormField>

            <FormField label="Es para uso público?" help="Si el spot es para visitantes o publico en general">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="spotForm.is_public"
                  id="is_public"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="is_public" class="ml-2 text-sm text-gray-700">Parqueadero para uso público</label>
              </div>
            </FormField>
          </div>
        </CardBoxModal>

        <!-- ========================================
             MODAL DE CONFIRMACION DE DESACTIVACION
             ======================================== -->
        <CardBoxModal
          v-model="showDeactivateModal"
          title="Desactivar Spot"
          button="danger"
          buttonLabel="Desactivar"
          :hasCancel="true"
          :isProcessing="isProcessing"
          @confirm="confirmDeactivate"
          @cancel="closeDeactivateModal"
        >
          <div class="py-2">
            <p class="text-sm text-gray-500">
              Estas seguro de que deseas desactivar el spot
              <strong>{{ spotToDeactivate?.code ? ` ${spotToDeactivate.code}` : ` #${spotToDeactivate?.id}` }}</strong>?
              Esta accion no se puede deshacer.
            </p>
          </div>
        </CardBoxModal>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>