<script setup>
/**
 * VISTA DE GESTIÓN DE TORRES/INTERIORES (ADMIN)
 * 
 * Esta vista permite a los administradores gestionar todas las torres e interiores
 * del conjunto residencial. Incluye funcionalidades de:
 * - Listar torres/interiores con filtros y paginación
 * - Crear nuevas torres/interiores
 * - Editar torres/interiores existentes
 * - Desactivar torres/interiores
 * - Activar/Desactivar torres/interiores
 * 
 * NOTA: Esta vista es solo para administradores. El proceso de sesión
 * debe estar activo para acceder a esta funcionalidad.
 * 
 * ENDPOINTS UTILIZADOS:
 * - GET /torres-interiores - Listar todas las torres/interiores
 * - POST /torres-interiores - Crear nueva torre/interior
 * - PATCH /torres-interiores/:id - Actualizar torre/interior
 * - POST /torres-interiores/:id/deactivate - Desactivar torre/interior
 * 
 * ESTRUCTURA DE DATOS:
 * - id: number - ID único de la torre/interior
 * - t_numero_letra: string - Número o letra de la torre/interior
 * - is_active: boolean - Estado activo/inactivo
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiOfficeBuilding, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiAccountCheck, 
  mdiAccountOff,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiClose,
  mdiDomain
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
import { useTorreInteriorStore } from '@/stores/torreInterior.store'

// ============================================
// STORES
// ============================================
const torresInterioresStore = useTorreInteriorStore()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const itemToDeactivate = ref(null)

// Modal de creación/edición
const showFormModal = ref(false)
const isEditing = ref(false)
const editingItem = ref(null)

// Formulario
const formData = ref({
  t_numero_letra: '',
  is_active: true,
})

// Filtros
const searchQuery = ref('')
const selectedStatus = ref(null)

// ============================================
// COMPUTED
// ============================================

// Opciones de estado para el filtro
const selectStatusOptions = [
  { id: true, label: 'Activo' },
  { id: false, label: 'Inactivo' },
]

// Torres/interiores filtrados y paginados
const filteredTorresInteriores = computed(() => {
  return torresInterioresStore.filteredTorreInteriors
})

const paginatedTorresInteriores = computed(() => {
  return torresInterioresStore.paginatedTorreInteriors
})

// Estadísticas
const stats = computed(() => {
  return torresInterioresStore.stats
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return torresInterioresStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar torres/interiores al montar el componente
  await torresInterioresStore.fetchTorresInteriores({ active_only: false })
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, selectedStatus], () => {
  torresInterioresStore.setFilters({
    search: searchQuery.value,
    status: selectedStatus.value,
  })
})

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Abre el modal para crear una nueva torre/interior
 */
const openCreateModal = () => {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    t_numero_letra: '',
    is_active: true,
  }
  showFormModal.value = true
}

/**
 * Abre el modal para editar una torre/interior existente
 * @param {Object} item - Torre/interior a editar
 */
const openEditModal = (item) => {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    t_numero_letra: item.t_numero_letra,
    is_active: item.is_active,
  }
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    t_numero_letra: '',
    is_active: true,
  }
}

/**
 * Guarda la torre/interior (crea o actualiza)
 */
const saveItem = async () => {
  try {
    if (isEditing.value) {
      // Actualizar
      await torresInterioresStore.updateTorreInterior(editingItem.value.id, formData.value)
    } else {
      // Crear
      await torresInterioresStore.createTorreInterior(formData.value)
    }
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar torre/interior:', error)
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} item - Torre/interior a desactivar
 */
const openDeactivateModal = (item) => {
  itemToDeactivate.value = item
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  itemToDeactivate.value = null
}

/**
 * Confirma la desactivación de la torre/interior
 */
const confirmDeactivate = async () => {
  try {
    await torresInterioresStore.deactivateTorreInterior(itemToDeactivate.value.id)
    closeDeactivateModal()
  } catch (error) {
    console.error('Error al desactivar torre/interior:', error)
  }
}

// ============================================
// FUNCIONES - ACCIONES
// ============================================

/**
 * Activa/Desactiva una torre/interior
 * @param {Object} item - Torre/interior
 */
const toggleStatus = async (item) => {
  try {
    await torresInterioresStore.toggleStatus(item.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  torresInterioresStore.clearFilters()
}

/**
 * Refresca la lista de torres/interiores
 */
const refreshList = async () => {
  await torresInterioresStore.fetchTorresInteriores({ active_only: false })
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  torresInterioresStore.setPage(page)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiOfficeBuilding" title="Gestión de Torres/Interiores" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nueva Torre/Interior"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats.total }}</div>
            <div class="text-sm text-gray-500">Total Torres/Interiores</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ stats.active }}</div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ stats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivos</div>
          </div>
        </CardBox>
      </div>

      <!-- ========================================
           FILTROS Y BÚSQUEDA
           ======================================== -->
      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Búsqueda -->
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por número o letra..."
            />
          </FormField>
          
          <!-- Filtro por estado -->
          <FormField label="Filtrar por Estado">
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
              @click="refreshList"
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
            TABLA DE TORRES/INTERIORES
            ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de éxito -->
        <NotificationBar v-if="torresInterioresStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ torresInterioresStore.successMessage }}
        </NotificationBar>
        
        <!-- Mensaje de error -->
        <NotificationBar v-if="torresInterioresStore.error" color="danger" :icon="mdiAlertCircle">
          {{ torresInterioresStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de carga -->
        <div v-if="torresInterioresStore.isLoading && !torresInterioresStore.isFormLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando torres/interiores...</div>
        </div>
        
        <!-- Tabla de torres/interiores -->
        <div v-else-if="paginatedTorresInteriores.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número/Letra
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
              <tr v-for="item in paginatedTorresInteriores" :key="item.id" class="hover:bg-gray-50">
                <!-- ID -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ item.id }}
                  </div>
                </td>
                
                <!-- Número/Letra -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-sm">
                          {{ item.t_numero_letra.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ item.t_numero_letra }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="item.statusClass" class="text-sm font-medium">
                    {{ item.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <!-- Botón Editar -->
                    <BaseButton
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(item)"
                    />
                    
                    <!-- Botón Activar/Desactivar -->
                    <BaseButton
                      v-if="item.is_active"
                      :icon="mdiAccountOff"
                      color="warning"
                      small
                      @click="openDeactivateModal(item)"
                    />
                    <BaseButton
                      v-else
                      :icon="mdiAccountCheck"
                      color="success"
                      small
                      @click="toggleStatus(item)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Paginación -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                Mostrando {{ ((torresInterioresStore.pagination.currentPage - 1) * torresInterioresStore.pagination.pageSize) + 1 }} 
                a {{ Math.min(torresInterioresStore.pagination.currentPage * torresInterioresStore.pagination.pageSize, filteredTorresInteriores.length) }} 
                de {{ filteredTorresInteriores.length }} resultados
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="torresInterioresStore.pagination.currentPage === 1"
                  @click="changePage(torresInterioresStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="torresInterioresStore.pagination.currentPage >= torresInterioresStore.totalPages"
                  @click="changePage(torresInterioresStore.pagination.currentPage + 1)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje de lista vacía -->
        <CardBoxComponentEmpty v-else />
      </CardBox>

      <!-- ========================================
           MODAL DE FORMULARIO (CREAR/EDITAR)
           ======================================== -->
      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Torre/Interior' : 'Nueva Torre/Interior'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :button="isEditing ? 'success' : 'info'"
        :hasCancel="true"
        :isForm="true"
        :isProcessing="torresInterioresStore.isFormLoading"
        @confirm="saveItem"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <FormField label="Número/Letra" help="Ingrese el número o letra de la torre/interior">
            <FormControl
              v-model="formData.t_numero_letra"
              :icon="mdiDomain"
              placeholder="Ej: A, B, 1, 2..."
              required
            />
          </FormField>

          <FormField v-if="isEditing" label="Estado">
            <FormControl
              v-model="formData.is_active"
              :options="[
                { id: true, label: 'Activo' },
                { id: false, label: 'Inactivo' }
              ]"
            />
          </FormField>

          <div class="text-xs text-gray-500">
            El registro se guardará automáticamente al hacer clic en "{{ isEditing ? 'Actualizar' : 'Crear' }}".
          </div>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Torre/Interior"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="torresInterioresStore.isFormLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Está seguro de que desea desactivar la torre/interior
            <strong>{{ itemToDeactivate?.t_numero_letra }}</strong>?
            Esta acción no se puede deshacer fácilmente.
          </p>
        </div>
      </CardBoxModal>
    </SectionMain>
  </LayoutAuthenticated>
</template>
