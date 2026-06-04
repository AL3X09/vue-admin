<script setup>
/**
 * VISTA DE GESTIÓN DE USUARIOS (ADMIN)
 * 
 * Esta vista permite a los administradores gestionar todos los usuarios
 * del sistema. Incluye funcionalidades de:
 * - Listar usuarios con filtros y paginación
 * - Crear nuevos usuarios
 * - Editar usuarios existentes
 * - Eliminar usuarios
 * - Cambiar roles de usuarios
 * - Activar/Desactivar usuarios
 * - Gestionar permisos de usuarios
 * 
 * NOTA: El proceso de sesión no está completamente listo, por lo que
 * la obtención del perfil del usuario se simula mientras se completa
 * la implementación de autenticación.
 * 
 * ROLES DISPONIBLES:
 * - admin: Administrador del sistema
 * - propietario: Propietario de una unidad
 * - arrendatario: Arrendatario de una unidad
 * - celador: Personal de seguridad
 * - aseador: Personal de limpieza
 * - todero: Personal de mantenimiento
 * - consejero: Miembro del consejo
 * - administrador: Administrador del conjunto
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiAccountGroup, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiAccountCheck, 
  mdiAccountOff,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiAccountKey,
  mdiShieldAccount,
  mdiEmail,
  mdiPhone,
  mdiCardAccountDetails,
  mdiCalendar,
  mdiClockOutline,
  mdiAccount,
  mdiLock,
  mdiCheckCircle,
  mdiAlertCircle
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import { useUsersStore } from '@/stores/users.store'
import { usePermissionsStore } from '@/stores/permissions.store'
import { useNotification } from '@/composables/useNotification'

// ============================================
// STORES
// ============================================
const usersStore = useUsersStore()
const permissionsStore = usePermissionsStore()

// ============================================
// COMPOSABLES
// ============================================
const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de confirmación de eliminación
//const showDeleteModal = ref(false)
// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const userToDeactivate = ref(null)

// Modal de permisos
const showPermissionsModal = ref(false)
const selectedUserForPermissions = ref(null)
const selectedPermissions = ref([])

const showPasswordModal = ref(false)
const passwordUser = ref(null)
const newPassword = ref('')
const confirmPassword = ref('')
const passwordModalError = ref('')

// Filtros
const searchQuery = ref('')
const selectedRole = ref(null)
const selectedStatus = ref(null)

// ============================================
// COMPUTED
// ============================================

// Opciones de roles para el select
const selectRoleOptions = computed(() => {
  return usersStore.availableRoles.map(role => ({
    id: role.id,
    label: role.name,
  }))
})

// Opciones de estado para el filtro
const selectStatusOptions = [
  { id: true, label: 'Activo' },
  { id: false, label: 'Inactivo' },
]

// Usuarios filtrados y paginados
const filteredUsers = computed(() => {
  return usersStore.filteredUsers
})

const paginatedUsers = computed(() => {
  return usersStore.paginatedUsers
})

// Estadísticas de usuarios
const userStats = computed(() => {
  return usersStore.userStats
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return usersStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar usuarios al montar el componente
  await usersStore.fetchUsers()
  
  // Cargar permisos disponibles
  await permissionsStore.fetchPermissions()
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, selectedRole, selectedStatus], () => {
  usersStore.setFilters({
    search: searchQuery.value,
    role: selectedRole.value,
    status: selectedStatus.value,
  })
})

// ============================================
// FUNCIONES - ACCIONES DE USUARIO / FILTROS
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} person - Persona a desactivar
 */
const openDeactivateModal = (user) => {
  userToDeactivate.value = user
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  userToDeactivate.value = null
}

/**
 * Abre el modal de confirmación de eliminación
 * @param {Object} user - Usuario a eliminar
 *
const openDeleteModal = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}
*/

/**
 * Cierra el modal de eliminación
 *
const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}
*/

/**
 * Confirma la desactivación del usuario
 */
const confirmDelete = async () => {
  try {
    console.log('Desactivando usuario:', userToDeactivate.value.id)
    await usersStore.updateUser(userToDeactivate.value.id, {
      is_active: false
    })
    closeDeactivateModal()
  } catch (error) {
    console.error('Error al desactivar usuario:', error)
    alert('Error al desactivar el usuario. Por favor, intenta nuevamente.')
  }
}

// ============================================
// FUNCIONES - MODAL DE PERMISOS
// ============================================

/**
 * Abre el modal de gestión de permisos
 * @param {Object} user - Usuario para gestionar permisos
 */
const openPermissionsModal = async (user) => {
  selectedUserForPermissions.value = user
  
  // Obtener permisos actuales del usuario
  try {
    const userPerms = await usersStore.fetchUserPermissions(user.id)
    selectedPermissions.value = [...userPerms]
  } catch (error) {
    console.error('Error al obtener permisos:', error)
    selectedPermissions.value = []
  }
  
  showPermissionsModal.value = true
}

/**
 * Cierra el modal de permisos
 */
const closePermissionsModal = () => {
  showPermissionsModal.value = false
  selectedUserForPermissions.value = null
  selectedPermissions.value = []
}

/**
 * Guarda los permisos del usuario
 */
const savePermissions = async () => {
  try {
    await usersStore.assignPermissionsToUser(
      selectedUserForPermissions.value.id,
      selectedPermissions.value
    )
    closePermissionsModal()
  } catch (error) {
    console.error('Error al guardar permisos:', error)
    alert('Error al guardar los permisos. Por favor, intenta nuevamente.')
  }
}

/**
 * Verifica si un permiso está seleccionado
 * @param {string} permissionId - ID del permiso
 * @returns {boolean} true si está seleccionado
 */
const isPermissionSelected = (permissionId) => {
  return selectedPermissions.value.includes(permissionId)
}

/**
 * Alterna la selección de un permiso
 * @param {string} permissionId - ID del permiso
 */
const togglePermission = (permissionId) => {
  const index = selectedPermissions.value.indexOf(permissionId)
  if (index === -1) {
    selectedPermissions.value.push(permissionId)
  } else {
    selectedPermissions.value.splice(index, 1)
  }
}

// ============================================
// FUNCIONES - ACCIONES DE USUARIO
// ============================================

/**
 * Cambia el rol de un usuario
 * @param {Object} user - Usuario
 * @param {string} newRole - Nuevo rol
 */
const changeUserRole = async (user, newRole) => {
  try {
    await usersStore.changeUserRole(user.id, newRole)
  } catch (error) {
    console.error('Error al cambiar rol:', error)
    alert('Error al cambiar el rol del usuario. Por favor, intenta nuevamente.')
  }
}

/**
 * Activa/Desactiva un usuario
 * @param {Object} user - Usuario
 */
const toggleUserStatus = async (user) => {
  try {
    await usersStore.toggleUserStatus(user.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    alert('Error al cambiar el estado del usuario. Por favor, intenta nuevamente.')
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedRole.value = null
  selectedStatus.value = null
  usersStore.setFilters({
    search: '',
    role: null,
    status: null,
  })
}

/**
 * Refresca la lista de usuarios
 */
const refreshUsers = async () => {
  await usersStore.fetchUsers()
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  usersStore.setPage(page)
}

const openPasswordModal = (user) => {
  passwordUser.value = user
  newPassword.value = ''
  confirmPassword.value = ''
  passwordModalError.value = ''
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordUser.value = null
  newPassword.value = ''
  confirmPassword.value = ''
  passwordModalError.value = ''
}

const savePassword = async () => {
  passwordModalError.value = ''

  if (!newPassword.value) {
    passwordModalError.value = 'Ingrese la nueva contraseña.'
    return
  }

  if (newPassword.value.length < 5) {
    passwordModalError.value = 'La contraseña debe tener al menos 5 caracteres.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordModalError.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    await usersStore.updateUser(passwordUser.value.id, {
      password: newPassword.value,
    })
    notifySuccess('Contraseña actualizada exitosamente.')
    closePasswordModal()
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    passwordModalError.value = error.response?.data?.detail || 'Error al cambiar la contraseña.'
  }
}

const notify = () => {
 notifyInfo("Oprima aquí si esta Seguro de desactivar el usuario?", 5000)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiAccountGroup" title="Gestión de Usuarios" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nuevo Usuario"
          color="contrast"
          rounded-full
          small
          @click="$router.push({ name: 'user-create' })"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE USUARIOS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ userStats.total }}</div>
            <div class="text-sm text-gray-500">Total Usuarios</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ userStats.active }}</div>
            <div class="text-sm text-gray-500">Activos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ userStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivos</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ Object.keys(userStats.byRole).length }}</div>
            <div class="text-sm text-gray-500">Roles Diferentes</div>
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
              placeholder="Buscar por nombre, email..."
            />
          </FormField>
          
          <!-- Filtro por rol -->
          <FormField label="Filtrar por Rol">
            <FormControl
              v-model="selectedRole"
              :options="selectRoleOptions"
              :icon="mdiFilter"
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
              @click="refreshUsers"
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
           TABLA DE USUARIOS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="usersStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando usuarios...</div>
        </div>

        <!-- Mensaje de error -->
        <NotificationBar v-if="usersStore.error" color="danger" :icon="mdiAlertCircle">
          {{ usersStore.error }}
        </NotificationBar>

        <!-- Mensaje de éxito -->
        <NotificationBar v-if="usersStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ usersStore.successMessage }}
        </NotificationBar>

        <!-- Tabla de usuarios -->
        <div v-if="!usersStore.isLoading && paginatedUsers.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cambiar contraseña
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in paginatedUsers" :key="user.id" class="hover:bg-gray-50">
                <!-- Usuario -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-sm">
                          {{ user.first_name?.charAt(0) || user.username.charAt(0) }}{{ user.last_name?.charAt(0) || '' }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.first_name }} {{ user.last_name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        @{{ user.username }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Rol -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">
                    {{ user.role.name }}
                  </span>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="user.statusClass" class="text-sm font-medium">
                    {{ user.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                
                <!-- Cambio de contraseña -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-700">
                      {{ user.must_change_password ? 'Nunca' : 'Cambiada' }}
                    </span>
                    <BaseButton
                      v-if="isAdmin"
                      :icon="mdiAccountKey"
                      label="Cambiar"
                      color="info"
                      small
                      @click="openPasswordModal(user)"
                    />
                  </div>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <!-- Botón Editar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="$router.push({ name: 'user-edit', params: { id: user.id } })"
                    />
                    
                    <!-- Botón Activar/Desactivar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="user.is_active ? mdiAccountOff : mdiAccountCheck"
                      :color="user.is_active ? 'danger' : 'success'"
                      small
                      @click="openDeactivateModal(user)"
                    />
                    
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!usersStore.isLoading && !usersStore.error">
          <CardBoxComponentEmpty v-if="paginatedUsers.length === 0" />
        </div>

        <!-- Paginación -->
        <div v-if="paginatedUsers.length > 0" class="px-6 py-4 border-t border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="text-sm text-gray-500">
              Mostrando {{ (usersStore.pagination.currentPage - 1) * usersStore.pagination.pageSize + 1 }} 
              a {{ Math.min(usersStore.pagination.currentPage * usersStore.pagination.pageSize, filteredUsers.length) }} 
              de {{ filteredUsers.length }} usuarios
            </div>
            
            <div class="flex items-center gap-2">
              <BaseButton
                label="Anterior"
                color="info"
                outline
                small
                :disabled="usersStore.pagination.currentPage === 1"
                @click="changePage(usersStore.pagination.currentPage - 1)"
              />
              
              <span class="text-sm text-gray-500">
                Página {{ usersStore.pagination.currentPage }} de {{ usersStore.totalPages }}
              </span>
              
              <BaseButton
                label="Siguiente"
                color="info"
                outline
                small
                :disabled="usersStore.pagination.currentPage === usersStore.totalPages"
                @click="changePage(usersStore.pagination.currentPage + 1)"
              />
            </div>
          </div>
        </div>
      </CardBox>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
           ======================================== -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto bg-black/40">
        <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-left sm:block sm:p-0">
          <!-- Overlay -->
          <div class="fixed inset-0 transition-opacity" @click="closeDeleteModal">
            <div class="absolute inset-0 bg-gray-500 opacity-50"></div>
          </div>
          
          <!-- Modal -->
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <CardBox isModal>
              <SectionTitleLineWithButton :icon="mdiDelete" title="Eliminar Usuario" main />
              
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <span class="text-red-600">⚠️</span>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas eliminar al usuario 
                    <strong>{{ userToDelete?.username }}</strong>? 
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              
              <template #footer>
                <BaseButtons>
                  <BaseButton
                    label="Eliminar"
                    color="danger"
                    @click="confirmDelete"
                  />
                  <BaseButton
                    label="Cancelar"
                    color="info"
                    outline
                    @click="closeDeleteModal"
                  />
                </BaseButtons>
              </template>
            </CardBox>
          </div>
        </div>
      </div>


       <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <CardBoxModal
        v-model="showPasswordModal"
        title="Cambiar contraseña"
        button="success"
        buttonLabel="Guardar"
        :hasCancel="true"
        :isProcessing="usersStore.isLoading"
        :isForm="true"
        @confirm="savePassword"
        @cancel="closePasswordModal"
      >
        <div class="space-y-4">
          <FormField label="Nueva contraseña" help="Mínimo 8 caracteres">
            <FormControl
              v-model="newPassword"
              type="password"
              :icon="mdiLock"
              placeholder="Escribe la nueva contraseña"
              required
            />
          </FormField>
          <FormField label="Confirmar contraseña" help="Repite la nueva contraseña">
            <FormControl
              v-model="confirmPassword"
              type="password"
              :icon="mdiLock"
              placeholder="Confirma la contraseña"
              required
            />
          </FormField>
          <div v-if="passwordModalError" class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ passwordModalError }}
          </div>
        </div>
      </CardBoxModal>

      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Usuario"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="usersStore.isLoading"
        @confirm="confirmDelete"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Está seguro de que desea desactivar el usuario
            <strong>{{ userToDeactivate?.username }}</strong>?
            Esta acción no se puede deshacer fácilmente.
          </p>
        </div>
      </CardBoxModal>
    </SectionMain>
  </LayoutAuthenticated>
</template>
