<script setup>
/**
 * VISTA DE GESTIÓN DE TIPOS DE VEHÍCULOS
 * 
 * Esta vista permite gestionar los tipos de vehículos del sistema de parqueadero.
 * Incluye funcionalidades de:
 * - Listar tipos de vehículos con filtros
 * - Crear nuevos tipos de vehículos
 * - Editar tipos de vehículos existentes
 * - Desactivar tipos de vehículos
 * - Filtrar por estado activo
 * - Búsqueda por nombre, código o descripción
 * 
 * FLUJO DE CREACIÓN:
 * 1. Se abre el modal de creación
 * 2. Se filled el formulario con los datos del tipo
 * 3. Se valida el código único (debe ser único)
 * 4. Se crea el tipo de vehículo
 * 
 * FLUJO DE EDICIÓN:
 * 1. Se abre el modal de edición
 * 2. Se carga el tipo existente en el formulario
 * 3. Se actualizan los datos
 * 4. Se guarda el tipo actualizado
 * 
 * FLUJO DE DESACTIVACIÓN:
 * 1. Se confirma la acción
 * 2. Se llama al endpoint de delete/toggle
 * 3. Se actualiza la lista local
 * 
 * NOTA: Los permisos requeridos son:
 * - parking:read - Para listar y ver tipos de vehículos
 * - parking:write - Para crear, actualizar y desactivar tipos de vehículos
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiCar, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiCheck, 
  mdiClose,
  mdiMagnify,
  mdiRefresh,
  mdiCarElectric,
  mdiAlertCircle,
  mdiCheckCircle,
}

from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useNotification } from '@/composables/useNotification'
import { useVehicleTypesStore } from '@/stores/vehicleTypes.store'

// ============================================
// STORES
// ============================================
const vehicleTypesStore = useVehicleTypesStore()

// ============================================
// COMPOSABLES
// ============================================
const { notifySuccess, notifyError } = useNotification()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const vehicleTypeToDeactivate = ref(null)

// Modal de creación/edición
const showFormModal = ref(false)
const isEditing = ref(false)
const editingVehicleTypeId = ref(null)

// Formulario de tipo de vehículo
const vehicleTypeForm = ref({
  code: '',
  name: '',
  emoji: '',
  description: '',
  display_order: 0,
})

// Filtros
const searchQuery = ref('')
const includeInactive = ref(false)

// Validación de errores
const validationErrors = ref({})

// ============================================
// COMPUTED
// ============================================

// Tipos de vehículos filtrados
const filteredVehicleTypes = computed(() => {
  return vehicleTypesStore.filteredVehicleTypes
})

// Página actual de tipos
const paginatedVehicleTypes = computed(() => {
  const filtered = filteredVehicleTypes.value
  const start = (vehicleTypesStore.pagination.currentPage - 1) * vehicleTypesStore.pagination.pageSize
  const end = start + vehicleTypesStore.pagination.pageSize
  return filtered.slice(start, end)
})

// Estadísticas de tipos
const vehicleTypeStats = computed(() => {
  return vehicleTypesStore.vehicleTypeStats
})

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(filteredVehicleTypes.value.length / vehicleTypesStore.pagination.pageSize)
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return vehicleTypesStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar tipos de vehículos al montar el componente
  await vehicleTypesStore.fetchVehicleTypes()
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, includeInactive], () => {
  vehicleTypesStore.setFilters({
    search: searchQuery.value,
    includeInactive: includeInactive.value,
  })
})

// Limpiar errores de validación cuando cambian los campos del formulario
watch(vehicleTypeForm, () => {
  if (Object.keys(validationErrors.value).length > 0) {
    validationErrors.value = {}
  }
}, { deep: true })

// ============================================
// WATCHERS - NOTIFICACIONES AUTOMÁTICAS
// ============================================

watch(
  () => vehicleTypesStore.error,
  (newError) => {
    if (newError) {
      notifyError(newError, 5000)
      vehicleTypesStore.error = null
    }
  }
)

watch(
  () => vehicleTypesStore.successMessage,
  (newMessage) => {
    if (newMessage) {
      notifySuccess(newMessage, 3000)
      vehicleTypesStore.successMessage = null
    }
  }
)

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Abre el modal para crear un nuevo tipo de vehículo
 */
const openCreateModal = () => {
  isEditing.value = false
  editingVehicleTypeId.value = null
  resetForm()
  showFormModal.value = true
}

/**
 * Abre el modal para editar un tipo existente
 * @param {Object} vehicleType - Tipo de vehículo a editar
 */
const openEditModal = (vehicleType) => {
  isEditing.value = true
  editingVehicleTypeId.value = vehicleType.id
  
  validationErrors.value = {}
  
  // Llenar el formulario con los datos del tipo
  vehicleTypeForm.value = {
    code: vehicleType.code,
    name: vehicleType.name,
    emoji: vehicleType.emoji || '',
    description: vehicleType.description || '',
    display_order: vehicleType.display_order || 0,
  }
  
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingVehicleTypeId.value = null
  resetForm()
}

/**
 * Resetea el formulario
 */
const resetForm = () => {
  vehicleTypeForm.value = {
    code: '',
    name: '',
    emoji: '',
    description: '',
    display_order: 0,
  }
  
  validationErrors.value = {}
}

/**
 * Valida el formulario de tipo de vehículo
 * @returns {boolean} - true si es válido, false si no
 */
const validateVehicleTypeForm = () => {
  const errors = {}
  
  // Código es obligatorio y único
  if (!vehicleTypeForm.value.code || vehicleTypeForm.value.code.trim() === '') {
    errors.code = 'El código es obligatorio'
  } else {
    // Verificar que el código sea válido (solo letras, números y guiones)
    const codeRegex = /^[a-zA-Z0-9-_]+$/
    if (!codeRegex.test(vehicleTypeForm.value.code)) {
      errors.code = 'El código solo puede contener letras, números y guiones'
    }
  }
  
  // Nombre es obligatorio
  if (!vehicleTypeForm.value.name || vehicleTypeForm.value.name.trim() === '') {
    errors.name = 'El nombre es obligatorio'
  }
  
  // Display order debe ser número positivo
  if (vehicleTypeForm.value.display_order !== null && vehicleTypeForm.value.display_order !== undefined) {
    if (isNaN(vehicleTypeForm.value.display_order) || vehicleTypeForm.value.display_order < 0) {
      errors.display_order = 'El orden debe ser un número positivo'
    }
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/**
 * Guarda el tipo de vehículo (crea o actualiza)
 * 
 * FLUJO DE NEGOCIO GARANTIZADO:
 * 
 * CASO 1: Crear nuevo tipo (isEditing = false)
 *   1. Se validan los datos
 *   2. Se verifica que el código sea único
 *   3. Se crea el tipo
 * 
 * CASO 2: Actualizar tipo existente (isEditing = true)
 *   1. Se validan los datos
 *   2. Se actualiza el tipo
 * 
 * IMPORTANTE: El tipo SIEMPRE se debe crear/actualizar, sin excepción
 */
const saveVehicleType = async () => {
  // Validar formulario antes de proceder
  if (!validateVehicleTypeForm()) {
    return
  }
  
  try {
    console.log('🔵 INICIO saveVehicleType - isEditing:', isEditing.value)
    console.log('🔵 vehicleTypeForm:', JSON.stringify(vehicleTypeForm.value))
    
    // Preparar payload
    const payload = {
      code: vehicleTypeForm.value.code.trim().toLowerCase(),
      name: vehicleTypeForm.value.name.trim(),
      emoji: vehicleTypeForm.value.emoji?.trim() || null,
      description: vehicleTypeForm.value.description?.trim() || null,
      display_order: vehicleTypeForm.value.display_order ? Number(vehicleTypeForm.value.display_order) : 0,
    }
    
    console.log('🔵 Payload:', JSON.stringify(payload))
    
    // ============================================================
    // EJECUTAR: Crear o Actualizar tipo (SIEMPRE obligatorio)
    // ============================================================
    if (isEditing.value) {
      // Actualizar tipo existente
      console.log('🔵 Actualizando tipo existente ID:', editingVehicleTypeId.value)
      await vehicleTypesStore.updateVehicleType(editingVehicleTypeId.value, payload)
    } else {
      // Crear nuevo tipo
      console.log('🔵 Creando nuevo tipo de vehículo...')
      await vehicleTypesStore.createVehicleType(payload)
    }
    
    // Recargar lista de tipos
    await vehicleTypesStore.fetchVehicleTypes()
    
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar tipo de vehículo:', error)
    // El mensaje de error ya se maneja en store
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} vehicleType - Tipo a desactivar
 */
const openDeactivateModal = (vehicleType) => {
  vehicleTypeToDeactivate.value = vehicleType
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  vehicleTypeToDeactivate.value = null
}

/**
 * Confirma la desactivación del tipo
 */
const confirmDeactivate = async () => {
  try {
    await vehicleTypesStore.toggleVehicleType(vehicleTypeToDeactivate.value.id)
    closeDeactivateModal()
  } catch (error) {
    console.error('Error al desactivar tipo:', error)
  }
}

// ============================================
// FUNCIONES - ACCIONES DE TIPO
// ============================================

/**
 * Activa/Desactiva un tipo
 * @param {Object} vehicleType - Tipo de vehículo
 */
const toggleVehicleTypeStatus = async (vehicleType) => {
  try {
    await vehicleTypesStore.toggleVehicleType(vehicleType.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  includeInactive.value = false
  vehicleTypesStore.clearFilters()
}

/**
 * Refresca la lista de tipos
 */
const refreshVehicleTypes = async () => {
  await vehicleTypesStore.fetchVehicleTypes()
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  vehicleTypesStore.setPage(page)
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
      <SectionTitleLineWithButton :icon="mdiCar" title="Gestión de Tipos de Vehículos" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nuevo Tipo"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE TIPOS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ vehicleTypeStats.total }}</div>
            <div class="text-sm text-gray-500">Total Tipos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ vehicleTypeStats.active }}</div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ vehicleTypeStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivos</div>
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
              placeholder="Buscar por nombre, código..."
            />
          </FormField>
          
          <!-- Filtro por estado activo -->
          <FormField label="Incluir Inactivos">
            <div class="flex items-center h-10">
              <input
                type="checkbox"
                v-model="includeInactive"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Mostrar inactivos</span>
            </div>
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshVehicleTypes"
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
           TABLA DE TIPOS DE VEHÍCULOS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="vehicleTypesStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando tipos de vehículos...</div>
        </div>
        
        <template v-else>

        <!-- Tabla de tipos -->
        <div v-if="paginatedVehicleTypes.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emoji
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
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
              <tr v-for="vehicleType in paginatedVehicleTypes" :key="vehicleType.id" class="hover:bg-gray-50">
                <!-- Código -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-mono font-medium text-gray-900">
                    {{ vehicleType.name }}
                  </div>
                </td>
                
                <!-- Nombre -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span v-if="vehicleType.emoji" class="text-lg">{{ vehicleType.emoji }}</span>
                  </div>
                </td>
                
                <!-- Descripción -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-500 max-w-xs truncate">
                    {{ vehicleType.description || 'Sin descripción' }}
                  </div>
                </td>
                                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="vehicleType.statusClass" class="text-sm font-medium">
                    {{ vehicleType.statusText }}
                  </span>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(vehicleType)"
                      title="Editar tipo"
                    />
                    <BaseButton
                      v-if="vehicleType.is_active"
                      :icon="mdiClose"
                      color="warning"
                      small
                      @click="openDeactivateModal(vehicleType)"
                      title="Desactivar tipo"
                    />
                    <BaseButton
                      v-else
                      :icon="mdiCheck"
                      color="success"
                      small
                      @click="toggleVehicleTypeStatus(vehicleType)"
                      title="Activar tipo"
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
                Mostrando {{ (vehicleTypesStore.pagination.currentPage - 1) * vehicleTypesStore.pagination.pageSize + 1 }} 
                a {{ Math.min(vehicleTypesStore.pagination.currentPage * vehicleTypesStore.pagination.pageSize, filteredVehicleTypes.length) }} 
                de {{ filteredVehicleTypes.length }} tipos
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="vehicleTypesStore.pagination.currentPage === 1"
                  @click="changePage(vehicleTypesStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="vehicleTypesStore.pagination.currentPage >= totalPages"
                  @click="changePage(vehicleTypesStore.pagination.currentPage + 1)"
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
           MODAL DE FORMULARIO DE TIPO (estilo unificado)
           ======================================== -->
      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Tipo de Vehículo' : 'Nuevo Tipo de Vehículo'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="vehicleTypesStore.isLoading"
        :hasCancel="true"
        @confirm="saveVehicleType"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Código -->
            <FormField label="Código *" help="Código único (ej: carro, moto)" :error="validationErrors.code">
              <FormControl 
                v-model="vehicleTypeForm.code" 
                placeholder="Ej: carro" 
                :disabled="isEditing"
              />
            </FormField>

            <!-- Nombre -->
            <FormField label="Nombre *" help="Nombre para mostrar" :error="validationErrors.name">
              <FormControl v-model="vehicleTypeForm.name" placeholder="Ej: Carro" />
            </FormField>

            <!-- Emoji -->
            <FormField label="Emoji" help="Emoji para UI (opcional)">
              <FormControl v-model="vehicleTypeForm.emoji" placeholder="Ej: 🚗" />
            </FormField>

            <!-- Orden -->
            <FormField label="Orden de Visualización" help="Número para ordenar" :error="validationErrors.display_order">
              <FormControl v-model="vehicleTypeForm.display_order" type="number" placeholder="0" />
            </FormField>
          </div>

          <!-- Descripción -->
          <FormField label="Descripción" help="Descripción opcional">
            <FormControl 
              v-model="vehicleTypeForm.description" 
              type="textarea" 
              placeholder="Descripción del tipo de vehículo..."
            />
          </FormField>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Tipo de Vehículo"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="vehicleTypesStore.isLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas desactivar el tipo de vehículo
            <strong> {{ vehicleTypeToDeactivate?.name }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>