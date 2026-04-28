<script setup>
/**
 * VISTA ADMINISTRATIVA DE GESTIÓN DE ROLES
 * 
 * Esta vista permite gestionar los roles del sistema.
 * Solo es accesible para usuarios con rol ADMIN.
 * 
 * Funcionalidades:
 * - Listar roles con búsqueda
 * - Crear nuevos roles
 * - Editar roles existentes
 * 
 * PERMISOS REQUERIDOS:
 * - roles:read - Para listar y ver roles
 * - roles:write - Para crear y actualizar roles
 * 
 * NOTA: Esta vista es solo para administradores.
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiShieldAccount, 
  mdiPlus, 
  mdiPencil, 
  mdiMagnify,
  mdiRefresh,
  mdiShieldCheck,
  mdiShieldAlert,
  mdiAccountGroup,
  mdiCheckCircle,
  mdiAlertCircle
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
import { useRolesStore } from '@/stores/roles.store'
import { usePermissionsStore } from '@/stores/permissions.store'

// ============================================
// STORES
// ============================================
const rolesStore = useRolesStore()
const permissionsStore = usePermissionsStore()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de creación/edición
const showFormModal = ref(false)
const isEditing = ref(false)
const editingRoleId = ref(null)

// Formulario de rol
const roleForm = ref({
  name: '',
  description: '',
  permissions: []
})

// Filtros
const searchQuery = ref('')

// ============================================
// COMPUTED
// ============================================

// Roles filtrados y paginados
const filteredRoles = computed(() => {
  return rolesStore.filteredRoles
})

const paginatedRoles = computed(() => {
  return rolesStore.paginatedRoles
})

// Estadísticas de roles
const roleStats = computed(() => {
  return rolesStore.roleStats
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return rolesStore.isAdmin
})

// Opciones de permisos para el select
const selectPermissionsOptions = computed(() => {
  return permissionsStore.permissionsList.map(perm => ({
    id: perm.code,
    label: `${perm.code} - ${perm.description || 'Sin descripción'}`,
  }))
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar roles y permisos al montar el componente
  await rolesStore.fetchRoles()
  await permissionsStore.fetchPermissions()
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch(searchQuery, () => {
  rolesStore.setFilters({
    search: searchQuery.value,
  })
})

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Abre el modal para crear un nuevo rol
 */
const openCreateModal = () => {
  isEditing.value = false
  editingRoleId.value = null
  resetForm()
  showFormModal.value = true
}

/**
 * Abre el modal para editar un rol existente
 * @param {Object} role - Rol a editar
 */
const openEditModal = (role) => {
  isEditing.value = true
  editingRoleId.value = role.id
  
  // Llenar el formulario con los datos del rol
  roleForm.value = {
    name: role.name,
    description: role.description || '',
    permissions: role.permissions ? role.permissions.map(p => p.code) : []
  }
  
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingRoleId.value = null
  resetForm()
}

/**
 * Resetea el formulario
 */
const resetForm = () => {
  roleForm.value = {
    name: '',
    description: '',
    permissions: []
  }
}

/**
 * Guarda el rol (crea o actualiza)
 */
const saveRole = async () => {
  try {
    // Preparar payload del rol
    const payload = {
      name: roleForm.value.name,
      description: roleForm.value.description || null,
      permissions: roleForm.value.permissions
    }
    
    if (isEditing.value) {
      // Actualizar rol existente
      await rolesStore.updateRole(editingRoleId.value, payload)
    } else {
      // Crear nuevo rol
      await rolesStore.createRole(payload)
    }
    
    // Recargar lista de roles
    await rolesStore.fetchRoles()
    
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar rol:', error)
    // El mensaje de error ya se maneja en store
  }
}

// ============================================
// FUNCIONES - ACCIONES DE ROL
// ============================================

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  rolesStore.clearFilters()
}

/**
 * Refresca la lista de roles
 */
const refreshRoles = async () => {
  await rolesStore.fetchRoles()
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  rolesStore.setPage(page)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <div v-if="!isAdmin" class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h2 class="text-lg font-semibold text-yellow-800">Acceso denegado</h2>
        <p class="text-sm text-yellow-700">Esta vista solo está disponible para administradores. Por favor, inicia sesión con una cuenta admin.</p>
      </div>
      <div v-else>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiShieldAccount" title="Gestión de Roles" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nuevo Rol"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE ROLES
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ roleStats.total }}</div>
            <div class="text-sm text-gray-500">Total Roles</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ roleStats.withPermissions }}</div>
            <div class="text-sm text-gray-500">Con Permisos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ roleStats.withoutPermissions }}</div>
            <div class="text-sm text-gray-500">Sin Permisos</div>
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
              placeholder="Buscar por nombre o descripción..."
            />
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2 md:col-span-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshRoles"
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
           TABLA DE ROLES
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="rolesStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando roles...</div>
        </div>
        
        <template v-else>
        <!-- Mensaje de error -->
        <NotificationBar v-if="rolesStore.error" color="danger" :icon="mdiAlertCircle">
          {{ rolesStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-if="rolesStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ rolesStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de roles -->
        <div v-if="paginatedRoles.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permisos
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="role in paginatedRoles" :key="role.id" class="hover:bg-gray-50">
                <!-- ID -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 font-medium">
                    {{ role.id }}
                  </div>
                </td>
                
                <!-- Nombre -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-sm">
                          {{ role.name?.charAt(0).toUpperCase() || 'R' }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ role.name }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Descripción -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="role.description" class="text-sm text-gray-500">
                    {{ role.description }}
                  </div>
                  <div v-else class="text-sm text-gray-400 italic">
                    Sin descripción
                  </div>
                </td>
                
                <!-- Permisos -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="role.permissions && role.permissions.length > 0" class="flex flex-wrap gap-1">
                    <span 
                      v-for="perm in role.permissions.slice(0, 3)" 
                      :key="perm.id"
                      class="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800"
                    >
                      {{ perm.code }}
                    </span>
                    <span v-if="role.permissions.length > 3" class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                      +{{ role.permissions.length - 3 }}
                    </span>
                  </div>
                  <div v-else class="text-sm text-gray-400 italic">
                    Sin permisos
                  </div>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(role)"
                      title="Editar rol"
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
                Mostrando {{ (rolesStore.pagination.currentPage - 1) * rolesStore.pagination.pageSize + 1 }} 
                a {{ Math.min(rolesStore.pagination.currentPage * rolesStore.pagination.pageSize, filteredRoles.length) }} 
                de {{ filteredRoles.length }} roles
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="rolesStore.pagination.currentPage === 1"
                  @click="changePage(rolesStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="rolesStore.pagination.currentPage >= rolesStore.totalPages"
                  @click="changePage(rolesStore.pagination.currentPage + 1)"
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
           MODAL DE FORMULARIO DE ROL
           ======================================== -->
      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Rol' : 'Nuevo Rol'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="rolesStore.isLoading"
        :hasCancel="true"
        @confirm="saveRole"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <!-- Nombre -->
          <FormField label="Nombre" help="Nombre del rol (3-50 caracteres)">
            <FormControl 
              v-model="roleForm.name" 
              :icon="mdiShieldAccount" 
              placeholder="Ej: editor, administrador, usuario"
              :disabled="isEditing && roleForm.name === 'superadmin'"
            />
          </FormField>

          <!-- Descripción -->
          <FormField label="Descripción" help="Descripción opcional del rol">
            <FormControl 
              v-model="roleForm.description" 
              :icon="mdiAccountGroup" 
              placeholder="Ej: Rol con permisos de edición"
            />
          </FormField>

          <!-- Permisos -->
          <FormField label="Permisos" help="Seleccione los permisos asociados al rol">
            <div class="space-y-2">
              <div v-if="selectPermissionsOptions.length === 0" class="text-sm text-gray-500">
                No hay permisos disponibles. Cargue permisos primero en la gestión de permisos.
              </div>
              <div v-else class="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                <div 
                  v-for="perm in selectPermissionsOptions" 
                  :key="perm.id"
                  class="flex items-center"
                >
                  <input
                    type="checkbox"
                    :id="`perm-${perm.id}`"
                    :value="perm.id"
                    v-model="roleForm.permissions"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label :for="`perm-${perm.id}`" class="ml-2 text-sm text-gray-700">
                    {{ perm.label }}
                  </label>
                </div>
              </div>
            </div>
          </FormField>

          <!-- Resumen de permisos seleccionados -->
          <div v-if="roleForm.permissions.length > 0" class="bg-gray-50 p-3 rounded-lg">
            <div class="text-sm font-medium text-gray-700 mb-2">
              Permisos seleccionados ({{ roleForm.permissions.length }}):
            </div>
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="permCode in roleForm.permissions" 
                :key="permCode"
                class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
              >
                {{ permCode }}
              </span>
            </div>
          </div>
        </div>
      </CardBoxModal>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>