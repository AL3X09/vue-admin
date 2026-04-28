<script setup>
/**
 * VISTA DE GESTIÓN DE VÍNCULOS CASA-INTERIOR (ADMIN)
 * 
 * Esta vista permite a los administradores gestionar todos los vínculos
 * entre casas/apartamentos y torres/interiores del conjunto residencial.
 * Incluye funcionalidades de:
 * - Listar vínculos con filtros y paginación
 * - Crear nuevos vínculos
 * - Editar vínculos existentes
 * - Desactivar vínculos
 * - Filtrar por casa/apartamento, torre/interior y estado
 * 
 * NOTA: Esta vista requiere autenticación activa y permisos de administrador
 * para realizar operaciones de escritura (crear, editar, desactivar).
 * 
 * PERMISOS REQUERIDOS:
 * - house_interior_link:read - Para ver la lista de vínculos
 * - house_interior_link:write - Para crear/editar/desactivar vínculos
 * 
 * ENDPOINTS UTILIZADOS:
 * - GET /casa-interior-links - Listar vínculos
 * - POST /casa-interior-links - Crear vínculo
 * - PATCH /casa-interior-links/:id - Actualizar vínculo
 * - POST /casa-interior-links/:id/deactivate - Desactivar vínculo
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiLinkVariant, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiHome,
  mdiOfficeBuilding,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiClose,
  mdiEye,
  mdiEyeOff
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
import { useCasaInteriorLinksStore } from '@/stores/casaInteriorLinks.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCasasApartamentosStore } from '@/stores/casasApartamentos.store'
import { useTorreInteriorStore } from '@/stores/torreInterior.store'

// ============================================
// STORES
// ============================================
const linksStore = useCasaInteriorLinksStore()
const authStore = useAuthStore()
const casasApartamentosStore = useCasasApartamentosStore()
const torresInterioresStore = useTorreInteriorStore()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de creación/edición
const showModal = ref(false)
const isEditing = ref(false)
const currentLink = ref({
  id: null,
  casa_apartamento_id: null,
  torre_interior_id: null,
  status: 'deshabitado',
  num_habitaciones: null
})

// Errores de validación del formulario
const formErrors = ref({
  casa_apartamento_id: '',
  torre_interior_id: '',
  status: '',
  num_habitaciones: ''
})

// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const linkToDeactivate = ref(null)

// Filtros
const searchQuery = ref('')
const selectedCasaApartamento = ref(null)
const selectedTorreInterior = ref(null)
const selectedStatus = ref(null)
const activeOnly = ref(true)

// ============================================
// COMPUTED
// ============================================

// Verificar si el usuario tiene permisos de escritura
const canWrite = computed(() => {
  return linksStore.canWrite
})

// Opciones de estado para el filtro
const selectStatusOptions = computed(() => {
  return linksStore.statusOptions
})

// Vínculos filtrados y paginados
const filteredLinks = computed(() => {
  return linksStore.filteredLinks
})

const paginatedLinks = computed(() => {
  return linksStore.paginatedLinks
})

// Estadísticas de vínculos
const linkStats = computed(() => {
  return linksStore.linkStats
})

// Verificar si hay vínculos
const hasLinks = computed(() => {
  return paginatedLinks.value.length > 0
})

// Opciones de casas/apartamentos para select
const casasApartamentosOptions = computed(() => {
  const casas = casasApartamentosStore.casasApartamentos ?? []
  return [
    { id: null, label: 'Seleccionar Casa/Apto', value: null },
    ...casas.map(item => ({
      id: item.id,
      label: `${item.c_numero_letra}`,
      value: item.id
    }))
  ]
})

// Opciones de torres/interiores para select
const torresInterioresOptions = computed(() => {
  const torres = torresInterioresStore.items ?? []
  return [
    { id: null, label: 'Seleccionar Torre/Interior', value: null },
    ...torres.map(item => ({
      id: item.id,
      label: `${item.t_numero_letra}`,
      value: item.id
    }))
  ]
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar vínculos al montar el componente
  await linksStore.fetchLinks({ active_only: activeOnly.value })
  // Cargar casas/apartamentos y torres/interiores para los selectores
  await casasApartamentosStore.fetchCasasApartamentos({ active_only: true })
  await torresInterioresStore.fetchTorresInteriores({ active_only: true })
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([selectedCasaApartamento, selectedTorreInterior, selectedStatus, activeOnly], () => {
  linksStore.setFilters({
    casa_apartamento_id: selectedCasaApartamento.value,
    torre_interior_id: selectedTorreInterior.value,
    status: selectedStatus.value,
    active_only: activeOnly.value,
  })
})

// ============================================
// FUNCIONES - MODAL DE CREACIÓN/EDICIÓN
// ============================================

/**
 * Valida los datos del formulario
 * @returns {boolean}
 */
const validateLinkForm = () => {
  formErrors.value = {
    casa_apartamento_id: '',
    torre_interior_id: '',
    status: '',
    num_habitaciones: ''
  }

  let isValid = true

  if (!currentLink.value.casa_apartamento_id) {
    formErrors.value.casa_apartamento_id = 'Debe seleccionar una casa/apartamento'
    isValid = false
  }

  if (!currentLink.value.torre_interior_id) {
    formErrors.value.torre_interior_id = 'Debe seleccionar una torre/interior'
    isValid = false
  }

  if (!currentLink.value.status) {
    formErrors.value.status = 'Debe seleccionar un estado'
    isValid = false
  }

  if (currentLink.value.num_habitaciones !== null) {
    const num = Number(currentLink.value.num_habitaciones)
    if (!Number.isInteger(num) || num < 0) {
      formErrors.value.num_habitaciones = 'Número de habitaciones debe ser entero positivo o vacío'
      isValid = false
    }
  }

  return isValid
}

/**
 * Abre el modal para crear un nuevo vínculo
 */
const openCreateModal = () => {
  currentLink.value = {
    id: null,
    casa_apartamento_id: null,
    torre_interior_id: null,
    status: 'deshabitado',
    num_habitaciones: null
  }
  formErrors.value = {
    casa_apartamento_id: '',
    torre_interior_id: '',
    status: '',
    num_habitaciones: ''
  }
  linksStore.clearMessages()
  isEditing.value = false
  showModal.value = true
}

/**
 * Abre el modal para editar un vínculo existente
 * @param {Object} link - Vínculo a editar
 */
const openEditModal = (link) => {
  currentLink.value = { ...link }
  formErrors.value = {
    casa_apartamento_id: '',
    torre_interior_id: '',
    status: '',
    num_habitaciones: ''
  }
  linksStore.clearMessages()
  isEditing.value = true
  showModal.value = true
}

/**
 * Cierra el modal de creación/edición
 */
const closeModal = () => {
  showModal.value = false
  currentLink.value = {
    id: null,
    casa_apartamento_id: null,
    torre_interior_id: null,
    status: 'deshabitado',
    num_habitaciones: null
  }
  formErrors.value = {
    casa_apartamento_id: '',
    torre_interior_id: '',
    status: '',
    num_habitaciones: ''
  }
  isEditing.value = false
  linksStore.clearMessages()
}

/**
 * Guarda el vínculo (crea o actualiza)
 */
const saveLink = async () => {
  if (!validateLinkForm()) {
    console.warn('Formulario inválido:', formErrors.value)
    return
  }

  try {
    if (isEditing.value) {
      const updateData = {
        status: currentLink.value.status,
        num_habitaciones: currentLink.value.num_habitaciones
      }
      if (currentLink.value.is_active !== undefined) {
        updateData.is_active = currentLink.value.is_active
      }
      await linksStore.updateLink(currentLink.value.id, updateData)
    } else {
      await linksStore.createLink({
        casa_apartamento_id: currentLink.value.casa_apartamento_id,
        torre_interior_id: currentLink.value.torre_interior_id,
        status: currentLink.value.status,
        num_habitaciones: currentLink.value.num_habitaciones
      })
    }

    closeModal()
    await linksStore.fetchLinks({ active_only: activeOnly.value })
  } catch (error) {
    console.error('Error al guardar vínculo:', error)
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} link - Vínculo a desactivar
 */
const openDeactivateModal = (link) => {
  linkToDeactivate.value = link
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  linkToDeactivate.value = null
}

/**
 * Confirma la desactivación del vínculo
 */
const confirmDeactivate = async () => {
  try {
    await linksStore.deactivateLink(linkToDeactivate.value.id)
    closeDeactivateModal()
    await linksStore.fetchLinks({ active_only: activeOnly.value })
  } catch (error) {
    console.error('Error al desactivar vínculo:', error)
  }
}

// ============================================
// FUNCIONES - FILTROS Y ACCIONES
// ============================================

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedCasaApartamento.value = null
  selectedTorreInterior.value = null
  selectedStatus.value = null
  activeOnly.value = true
  linksStore.clearFilters()
  linksStore.clearMessages()
}

/**
 * Refresca la lista de vínculos
 */
const refreshLinks = async () => {
  linksStore.clearMessages()
  await linksStore.fetchLinks({ active_only: activeOnly.value })
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  linksStore.setPage(page)
}

/**
 * Limpia los mensajes de error y éxito
 */
const clearMessages = () => {
  linksStore.clearMessages()
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiLinkVariant" title="Gestión de Vínculos Casa-Interior" main>
        <BaseButton
          v-if="canWrite"
          :icon="mdiPlus"
          label="Nuevo Vínculo"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE VÍNCULOS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ linkStats.total }}</div>
            <div class="text-sm text-gray-500">Total Vínculos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ linkStats.active }}</div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ linkStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ linkStats.enPropiedad }}</div>
            <div class="text-sm text-gray-500">En Propiedad</div>
          </div>
        </CardBox>
      </div>

      <!-- ========================================
           FILTROS Y BÚSQUEDA
           ======================================== -->
      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Filtro por casa/apartamento -->
          <FormField label="Casa/Apartamento">
            <FormControl
              v-model="selectedCasaApartamento"
              :options="casasApartamentosOptions"
              :icon="mdiHome"
              placeholder="Seleccionar Casa/Apto"
            />
          </FormField>
          
          <!-- Filtro por torre/interior -->
          <FormField label="Torre/Interior">
            <FormControl
              v-model="selectedTorreInterior"
              :options="torresInterioresOptions"
              :icon="mdiOfficeBuilding"
              placeholder="Seleccionar Torre/Interior"
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
          
          <!-- Filtro solo activos -->
          <FormField label="Solo Activos">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="activeOnly"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Mostrar solo activos</span>
            </div>
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshLinks"
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
           MENSAJES DE NOTIFICACIÓN
           ======================================== -->
      <NotificationBar 
        v-if="linksStore.error" 
        color="danger" 
        :icon="mdiAlertCircle"
        @dismiss="clearMessages"
      >
        {{ linksStore.error }}
      </NotificationBar>
      
      <NotificationBar 
        v-if="linksStore.successMessage" 
        color="success" 
        :icon="mdiCheckCircle"
        @dismiss="clearMessages"
      >
        {{ linksStore.successMessage }}
      </NotificationBar>

      <!-- ========================================
           TABLA DE VÍNCULOS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="linksStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando vínculos...</div>
        </div>
        
        <!-- Mensaje de error -->
        <NotificationBar v-else-if="linksStore.error" color="danger" :icon="mdiAlertCircle">
          {{ linksStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-else-if="linksStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ linksStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de vínculos -->
        <div v-else-if="hasLinks" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Casa/Apartamento
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torre/Interior
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Habitaciones
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="link in paginatedLinks" :key="link.id" class="hover:bg-gray-50">
                <!-- ID -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ link.id }}
                  </div>
                </td>
                
                <!-- Casa/Apartamento -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-sm">
                          {{ link.casa_apartamento_id }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        #{{ link.casa_apartamento_id }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Torre/Interior -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span class="text-purple-600 font-semibold text-sm">
                          {{ link.torre_interior_id }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        #{{ link.torre_interior_id }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="link.statusClass" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ link.statusText }}
                  </span>
                </td>
                
                <!-- Estado Activo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="link.isActiveClass" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ link.isActiveText }}
                  </span>
                </td>
                
                <!-- Número de Habitaciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ link.num_habitaciones ?? '-' }}
                </td>                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <!-- Botón Editar -->
                    <BaseButton
                      v-if="canWrite"
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(link)"
                    />
                    
                    <!-- Botón Desactivar -->
                    <BaseButton
                      v-if="canWrite && link.is_active"
                      :icon="mdiEyeOff"
                      color="warning"
                      small
                      @click="openDeactivateModal(link)"
                    />
                    
                    <!-- Botón Activar -->
                    <BaseButton
                      v-if="canWrite && !link.is_active"
                      :icon="mdiEye"
                      color="success"
                      small
                      @click="openEditModal({ ...link, is_active: true })"
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
                Mostrando {{ (linksStore.pagination.currentPage - 1) * linksStore.pagination.pageSize + 1 }} 
                a {{ Math.min(linksStore.pagination.currentPage * linksStore.pagination.pageSize, filteredLinks.length) }} 
                de {{ filteredLinks.length }} resultados
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="linksStore.pagination.currentPage === 1"
                  @click="changePage(linksStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="linksStore.pagination.currentPage >= linksStore.totalPages"
                  @click="changePage(linksStore.pagination.currentPage + 1)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje cuando no hay vínculos -->
        <CardBoxComponentEmpty v-else />
      </CardBox>

      <!-- ========================================
           MODAL DE CREACIÓN/EDICIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showModal"
        :title="isEditing ? 'Editar Vínculo' : 'Crear Nuevo Vínculo'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="linksStore.isLoading"
        :hasCancel="true"
        @confirm="saveLink"
        @cancel="closeModal"
      >
        <div class="space-y-4">
          <FormField label="Casa/Apartamento">
            <FormControl
              v-model="currentLink.casa_apartamento_id"
              :options="casasApartamentosOptions"
              :icon="mdiHome"
              placeholder="Seleccionar Casa/Apto"
            />
          </FormField>
          
          <!-- Campo Torre/Interior -->
          <FormField label="Torre/Interior">
            <FormControl
              v-model="currentLink.torre_interior_id"
              :options="torresInterioresOptions"
              :icon="mdiOfficeBuilding"
              placeholder="Seleccionar Torre/Interior"
            />
          </FormField>
          
          <!-- Campo Estado -->
          <FormField label="Estado">
            <FormControl
              v-model="currentLink.status"
              :options="selectStatusOptions"
            />
          </FormField>
          
          <!-- Campo Estado Activo (solo en edición) -->
          <FormField v-if="isEditing" label="Activo">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="currentLink.is_active"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">{{ currentLink.is_active ? 'Activo' : 'Inactivo' }}</span>
            </div>
          </FormField>
          
          <!-- Campo Número de Habitaciones -->
          <FormField label="Número de Habitaciones">
            <FormControl
              v-model="currentLink.num_habitaciones"
              type="number"
              placeholder="Ej: 3"
              min="0"
            />
          </FormField>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Vínculo"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="linksStore.isLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas desactivar el vínculo
            <strong> Casa/Apto #{{ linkToDeactivate?.casa_apartamento_id }}</strong>
            con <strong>Torre/Interior #{{ linkToDeactivate?.torre_interior_id }}</strong>?
            Esta acción cambiará el estado del vínculo a "Inactivo".
          </p>
        </div>
      </CardBoxModal>
    </SectionMain>
  </LayoutAuthenticated>
</template>
