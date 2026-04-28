<script setup>
/**
 * VISTA DE GESTIÓN DE CASAS/APARTAMENTOS (ADMIN)
 * 
 * Esta vista permite a los administradores gestionar todas las casas y apartamentos
 * del conjunto residencial. Incluye funcionalidades de:
 * - Listar casas/apartamentos con filtros y paginación
 * - Crear nuevas casas/apartamentos
 * - Editar casas/apartamentos existentes
 * - Desactivar casas/apartamentos
 * - Activar/Desactivar casas/apartamentos
 * 
 * NOTA: Esta vista es solo para administradores. El proceso de sesión
 * debe estar activo para acceder a esta funcionalidad.
 * 
 * ENDPOINTS UTILIZADOS:
 * - GET /casas-apartamentos - Listar todas las casas/apartamentos
 * - POST /casas-apartamentos - Crear nueva casa/apartamento
 * - PATCH /casas-apartamentos/:id - Actualizar casa/apartamento
 * - POST /casas-apartamentos/:id/deactivate - Desactivar casa/apartamento
 * 
 * ESTRUCTURA DE DATOS:
 * - id: number - ID único de la casa/apartamento
 * - c_numero_letra: string - Número o letra de la casa/apartamento
 * - is_active: boolean - Estado activo/inactivo
 * 
 * PERMISOS REQUERIDOS:
 * - house_apartment:read - Para leer casas/apartamentos
 * - house_apartment:write - Para crear/actualizar/desactivar casas/apartamentos
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiHome, 
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
import { useCasasApartamentosStore } from '@/stores/casasApartamentos.store'

// ============================================
// STORES
// ============================================
const casasApartamentosStore = useCasasApartamentosStore()

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
  c_numero_letra: '',
  is_active: true,
})

// Errores de validación
const formErrors = ref({
  c_numero_letra: '',
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

// Casas/apartamentos filtrados y paginados
const filteredCasasApartamentos = computed(() => {
  return casasApartamentosStore.filteredCasasApartamentos
})

const paginatedCasasApartamentos = computed(() => {
  return casasApartamentosStore.paginatedCasasApartamentos
})

// Estadísticas
const stats = computed(() => {
  return casasApartamentosStore.stats
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return casasApartamentosStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar casas/apartamentos al montar el componente
  await casasApartamentosStore.fetchCasasApartamentos({ active_only: false })
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, selectedStatus], () => {
  casasApartamentosStore.setFilters({
    search: searchQuery.value,
    status: selectedStatus.value,
  })
})

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Valida los datos del formulario
 * @returns {boolean} true si los datos son válidos
 */
const validateForm = () => {
  formErrors.value = {
    c_numero_letra: '',
  }

  let isValid = true

  // Validar c_numero_letra
  if (!formData.value.c_numero_letra || formData.value.c_numero_letra.trim() === '') {
    formErrors.value.c_numero_letra = 'El número/letra es requerido'
    isValid = false
  } else if (formData.value.c_numero_letra.trim().length < 1 || formData.value.c_numero_letra.trim().length > 20) {
    formErrors.value.c_numero_letra = 'El número/letra debe tener entre 1 y 20 caracteres'
    isValid = false
  }

  return isValid
}

/**
 * Abre el modal para crear una nueva casa/apartamento
 */
const openCreateModal = () => {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    c_numero_letra: '',
    is_active: true,
  }
  formErrors.value = {
    c_numero_letra: '',
  }
  casasApartamentosStore.clearMessages()
  showFormModal.value = true
}

/**
 * Abre el modal para editar una casa/apartamento existente
 * @param {Object} item - Casa/apartamento a editar
 */
const openEditModal = (item) => {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    c_numero_letra: item.c_numero_letra,
    is_active: item.is_active,
  }
  formErrors.value = {
    c_numero_letra: '',
  }
  casasApartamentosStore.clearMessages()
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
    c_numero_letra: '',
    is_active: true,
  }
  formErrors.value = {
    c_numero_letra: '',
  }
  casasApartamentosStore.clearMessages()
}

/**
 * Guarda la casa/apartamento (crea o actualiza)
 */
const saveItem = async () => {
  // Validar formulario
  if (!validateForm()) {
    console.warn('❌ Formulario inválido:', formErrors.value)
    return
  }

  try {
    if (isEditing.value) {
      // Actualizar
      await casasApartamentosStore.updateCasaApartamento(editingItem.value.id, formData.value)
    } else {
      // Crear
      await casasApartamentosStore.createCasaApartamento(formData.value)
    }
    
    // Cerrar modal después de guardar exitosamente
    closeFormModal()
    
    // Recargar lista
    await casasApartamentosStore.fetchCasasApartamentos({ active_only: false })
  } catch (error) {
    console.error('❌ Error al guardar casa/apartamento:', error)
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} item - Casa/apartamento a desactivar
 */
const openDeactivateModal = (item) => {
  itemToDeactivate.value = item
  casasApartamentosStore.clearMessages()
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  itemToDeactivate.value = null
  casasApartamentosStore.clearMessages()
}

/**
 * Confirma la desactivación de la casa/apartamento
 */
const confirmDeactivate = async () => {
  try {
    await casasApartamentosStore.deactivateCasaApartamento(itemToDeactivate.value.id)
    closeDeactivateModal()
    // Recargar lista
    await casasApartamentosStore.fetchCasasApartamentos({ active_only: false })
  } catch (error) {
    console.error('❌ Error al desactivar casa/apartamento:', error)
  }
}

// ============================================
// FUNCIONES - ACCIONES
// ============================================

/**
 * Activa/Desactiva una casa/apartamento
 * @param {Object} item - Casa/apartamento
 */
const toggleStatus = async (item) => {
  try {
    await casasApartamentosStore.toggleStatus(item.id)
    // Recargar lista
    await casasApartamentosStore.fetchCasasApartamentos({ active_only: false })
  } catch (error) {
    console.error('❌ Error al cambiar estado:', error)
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  casasApartamentosStore.clearFilters()
}

/**
 * Refresca la lista de casas/apartamentos
 */
const refreshList = async () => {
  casasApartamentosStore.clearMessages()
  await casasApartamentosStore.fetchCasasApartamentos({ active_only: false })
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  casasApartamentosStore.setPage(page)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiHome" title="Gestión de Casas/Apartamentos" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nueva Casa/Apartamento"
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
            <div class="text-sm text-gray-500">Total Casas/Apartamentos</div>
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
           TABLA DE CASAS/APARTAMENTOS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="casasApartamentosStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando casas/apartamentos...</div>
        </div>
        
        <!-- Mensaje de error -->
        <NotificationBar v-else-if="casasApartamentosStore.error" color="danger" :icon="mdiAlertCircle">
          {{ casasApartamentosStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-else-if="casasApartamentosStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ casasApartamentosStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de casas/apartamentos -->
        <div v-else-if="paginatedCasasApartamentos.length > 0" class="overflow-x-auto">
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
              <tr v-for="item in paginatedCasasApartamentos" :key="item.id" class="hover:bg-gray-50">
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
                          {{ item.c_numero_letra.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ item.c_numero_letra }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="item.statusClass" class="text-sm font-medium">
                    {{ item.is_active ? 'Activo' : 'Inactivo' }}s
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
                Mostrando {{ ((casasApartamentosStore.pagination.currentPage - 1) * casasApartamentosStore.pagination.pageSize) + 1 }} 
                a {{ Math.min(casasApartamentosStore.pagination.currentPage * casasApartamentosStore.pagination.pageSize, filteredCasasApartamentos.length) }} 
                de {{ filteredCasasApartamentos.length }} resultados
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="casasApartamentosStore.pagination.currentPage === 1"
                  @click="changePage(casasApartamentosStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="casasApartamentosStore.pagination.currentPage >= casasApartamentosStore.totalPages"
                  @click="changePage(casasApartamentosStore.pagination.currentPage + 1)"
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
        :title="isEditing ? 'Editar Casa/Apartamento' : 'Nueva Casa/Apartamento'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :button="isEditing ? 'success' : 'info'"
        :hasCancel="true"
        :isForm="true"
        :isProcessing="casasApartamentosStore.isLoading"
        @confirm="saveItem"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <!-- Mostrar mensaje de error global si existe -->
          <NotificationBar v-if="casasApartamentosStore.error" color="danger" :icon="mdiAlertCircle">
            {{ casasApartamentosStore.error }}
          </NotificationBar>

          <FormField label="Número/Letra" help="Ej: 101, A, 201B">
            <FormControl
              v-model="formData.c_numero_letra"
              placeholder="Ingrese número o letra"
              required
            />
            <!-- Mostrar error de validación -->
            <div v-if="formErrors.c_numero_letra" class="text-xs text-red-500 mt-1">
              {{ formErrors.c_numero_letra }}
            </div>
          </FormField>

          <FormField label="Estado" help="Selecciona si la casa/apartamento está activo o inactivo">
            <FormControl
              v-model="formData.is_active"
              :options="selectStatusOptions"
            />
          </FormField>

          <div class="text-xs text-gray-500">
            El registro se guardará al hacer clic en "{{ isEditing ? 'Actualizar' : 'Crear' }}".
          </div>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Casa/Apartamento"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="casasApartamentosStore.isLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <!-- Mostrar mensaje de error si existe -->
          <NotificationBar v-if="casasApartamentosStore.error" color="danger" :icon="mdiAlertCircle" class="mb-3">
            {{ casasApartamentosStore.error }}
          </NotificationBar>

          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas desactivar la casa/apartamento
            <strong>{{ itemToDeactivate?.c_numero_letra }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>
    </SectionMain>
  </LayoutAuthenticated>
</template>
