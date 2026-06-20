<script setup>
/**
 * VISTA DE GESTIÓN DE PERMISOS - ADMINISTRACIÓN
 * 
 * Esta vista permite a los administradores gestionar los permisos del sistema.
 * Incluye funcionalidades para:
 * - Ver lista de todos los permisos
 * - Crear nuevos permisos
 * - Editar permisos existentes
 * - Eliminar permisos
 * - Activar/desactivar permisos
 * - Asignar permisos a usuarios
 * 
 * NOTA: El proceso de sesión no está completamente listo, por lo que
 * la obtención del perfil del usuario se simula mientras se completa
 * la implementación de autenticación.
 * 
 * COMPONENTES UTILIZADOS:
 * - LayoutAuthenticated: Layout principal para usuarios autenticados
 * - SectionMain: Contenedor principal de la sección
 * - CardBox: Componente de tarjeta para contenido
 * - FormField: Campo de formulario con etiqueta
 * - FormControl: Control de formulario (input, select, etc.)
 * - BaseButton: Botón base con estilos
 * - BaseButtons: Contenedor de botones
 * - SectionTitleLineWithButton: Título de sección con botón
 * 
 * STORES UTILIZADOS:
 * - usePermissionsStore: Store para gestión de permisos
 * - useAuthStore: Store de autenticación (para obtener info del usuario)
 */

import { onMounted, computed, ref, reactive } from 'vue'
import { 
  mdiShieldKey, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiEye, 
  mdiEyeOff,
  mdiAccountKey,
  mdiClose,
  mdiCheck,
  mdiAlertCircle,
  mdiCheckCircle
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import TableCheckboxCell from '@/components/TableCheckboxCell.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'

import { usePermissionsStore } from '@/stores/permissions.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNotification } from '@/composables/useNotification'

// ============================================
// INICIALIZACIÓN DE STORES
// ============================================

const permissionsStore = usePermissionsStore()
const authStore = useAuthStore()

// ============================================
// COMPOSABLES
// ============================================
const { notifySuccess, notifyError } = useNotification()

// ============================================
// ESTADO LOCAL DEL COMPONENTE
// ============================================

// Control de modales
const isModalCreateActive = ref(false)
const isModalEditActive = ref(false)
const isModalDeleteActive = ref(false)
const isModalAssignActive = ref(false)

// Permiso seleccionado para editar/eliminar
const selectedPermission = ref(null)

// Formulario para crear/editar permiso (solo campos que usa la API)
const form = reactive({
  code: '',
  description: ''
})

// Formulario para asignar permisos a rol
const assignForm = reactive({
  roleId: null,
  permissions: []
})

// Estado de carga local
const loading = ref(false)

// ============================================
// CICLO DE VIDA
// ============================================

/**
 * onMounted - Se ejecuta cuando el componente se monta
 * 
 * Carga la lista de permisos y usuarios al inicializar la vista
 */
onMounted(async () => {
  console.log('🔐 Cargando vista de permisos...')
  await Promise.all([
    permissionsStore.fetchPermissions(),
    permissionsStore.fetchRoles()
  ])
  console.log('✅ Vista de permisos cargada')
})

// ============================================
// WATCHERS - NOTIFICACIONES AUTOMÁTICAS
// ============================================

import { watch } from 'vue'

// Monitorear errores del store
watch(
  () => permissionsStore.error,
  (newError) => {
    if (newError) {
      notifyError(newError, 5000)
      permissionsStore.error = null
    }
  }
)

// Monitorear mensajes de éxito del store
watch(
  () => permissionsStore.successMessage,
  (newMessage) => {
    if (newMessage) {
      notifySuccess(newMessage, 3000)
      permissionsStore.successMessage = null
    }
  }
)

// ============================================
// COMPUTED PROPERTIES
// ============================================

/**
 * Verifica si el usuario actual es superadministrador
 * Detecta el rol del usuario desde authStore
 */
const isAdmin = computed(() => {
  const currentUser = authStore.user
  
  if (!currentUser) return false
  
  const userRole = currentUser.role
  
  if (typeof userRole === 'object' && userRole !== null) {
    return userRole.id === 1 || userRole.name?.toLowerCase() === 'superadmin'
  } else if (typeof userRole === 'string') {
    return userRole.toLowerCase() === 'superadmin'
  }
  
  return false
})

/**
 * Obtiene el nombre del usuario actual
 * Obtiene el username desde authStore
 */
const currentUserName = computed(() => {
  return authStore.user?.username || 'Usuario'
})

/**
 * Lista de permisos formateada para mostrar en tabla
 */
const permissionsList = computed(() => {
  return permissionsStore.permissionsList
})

/**
 * Lista de permisos del sistema (cargados desde el backend)
 */
const availablePermissions = computed(() => {
  return permissionsStore.permissions
})

/**
 * Lista de roles del sistema para seleccionar
 */
const selectRoleOptions = computed(() => {
  return permissionsStore.roles.map(role => ({
    id: role.id,
    label: role.name
  }))
})

// ============================================
// FUNCIONES DE GESTIÓN DE PERMISOS
// ============================================

/**
 * openCreateModal - Abre el modal para crear un nuevo permiso
 * 
 * Resetea el formulario y abre el modal de creación
 */
const openCreateModal = () => {
  // Limpiar mensajes previos
  permissionsStore.clearMessages()
  
  // Resetear formulario (solo campos que usa la API: code, description)
  form.code = ''
  form.description = ''
  
  // Abrir modal
  isModalCreateActive.value = true
  console.log('📝 Abriendo modal de creación de permiso')
}

/**
 * openEditModal - Abre el modal para editar un permiso existente
 * 
 * @param {Object} permission - Permiso a editar
 */
const openEditModal = (permission) => {
  // Limpiar mensajes previos
  permissionsStore.clearMessages()
  
  // Cargar datos del permiso en el formulario (solo code y description)
  selectedPermission.value = permission
  form.code = permission.code || ''
  form.description = permission.description || ''
  
  // Abrir modal
  isModalEditActive.value = true
  console.log('✏️ Abriendo modal de edición de permiso:', permission.id)
}

/**
 * openDeleteModal - Abre el modal de confirmación para eliminar un permiso
 * 
 * @param {Object} permission - Permiso a eliminar
 */
const openDeleteModal = (permission) => {
  // Limpiar mensajes previos
  permissionsStore.clearMessages()
  
  selectedPermission.value = permission
  isModalDeleteActive.value = true
  console.log('🗑️ Abriendo modal de eliminación de permiso:', permission.id)
}

/**
 * openAssignModal - Abre el modal para asignar permisos a un rol
 */
const openAssignModal = () => {
  // Limpiar mensajes previos
  permissionsStore.clearMessages()
  
  // Resetear formulario de asignación
  assignForm.roleId = null
  assignForm.permissions = []
  
  // Abrir modal
  isModalAssignActive.value = true
  console.log('👥 Abriendo modal de asignación de permisos')
}

/**
 * createPermission - Crea un nuevo permiso
 * 
 * Valida el formulario y llama al store para crear el permiso
 */
const createPermission = async () => {
  // Validación básica (solo code y description son requeridos por la API)
  if (!form.code || !form.description) {
    alert('Por favor, completa todos los campos requeridos.')
    return
  }

  loading.value = true

  try {
    await permissionsStore.createPermission({
      code: form.code,
      description: form.description
    })
    
    // Cerrar modal
    isModalCreateActive.value = false
    
    // Mostrar mensaje de éxito
    alert('✅ Permiso creado exitosamente')
    
    console.log('✅ Permiso creado exitosamente')
  } catch (error) {
    console.error('❌ Error al crear permiso:', error)
    alert('Error al crear el permiso. Revisa la consola para más detalles.')
  } finally {
    loading.value = false
  }
}

/**
 * updatePermission - Actualiza un permiso existente
 * 
 * Valida el formulario y llama al store para actualizar el permiso
 */
const updatePermission = async () => {
  // Validación básica (solo code y description son requeridos por la API)
  if (!form.code || !form.description) {
    alert('Por favor, completa todos los campos requeridos.')
    return
  }

  if (!selectedPermission.value) {
    alert('No se ha seleccionado un permiso para editar.')
    return
  }

  loading.value = true

  try {
    await permissionsStore.updatePermission(selectedPermission.value.id, {
      code: form.code,
      description: form.description
    })
    
    // Cerrar modal
    isModalEditActive.value = false
    selectedPermission.value = null
    
    // Mostrar mensaje de éxito
    alert('✅ Permiso actualizado exitosamente')
    
    console.log('✅ Permiso actualizado exitosamente')
  } catch (error) {
    console.error('❌ Error al actualizar permiso:', error)
    alert('Error al actualizar el permiso. Revisa la consola para más detalles.')
  } finally {
    loading.value = false
  }
}

/**
 * deletePermission - Elimina un permiso
 * 
 * Llama al store para eliminar el permiso seleccionado
 */
const deletePermission = async () => {
  if (!selectedPermission.value) {
    alert('No se ha seleccionado un permiso para eliminar.')
    return
  }

  loading.value = true

  try {
    await permissionsStore.deletePermission(selectedPermission.value.id)
    
    // Cerrar modal
    isModalDeleteActive.value = false
    selectedPermission.value = null
    
    // Mostrar mensaje de éxito
    alert('✅ Permiso eliminado exitosamente')
    
    console.log('✅ Permiso eliminado exitosamente')
  } catch (error) {
    console.error('❌ Error al eliminar permiso:', error)
    alert('Error al eliminar el permiso. Revisa la consola para más detalles.')
  } finally {
    loading.value = false
  }
}

/**
 * togglePermissionStatus - Activa/Desactiva un permiso
 * 
 * @param {Object} permission - Permiso a cambiar estado
 */
const togglePermissionStatus = async (permission) => {
  try {
    await permissionsStore.togglePermissionStatus(permission.id)
    console.log('✅ Estado del permiso cambiado:', permission.id)
  } catch (error) {
    console.error('❌ Error al cambiar estado del permiso:', error)
    alert('Error al cambiar el estado del permiso.')
  }
}

/**
 * assignPermissions - Asigna permisos a un rol
 * 
 * Valida el formulario y llama al store para asignar los permisos
 */
const assignPermissions = async () => {
  // Validación básica
  if (!assignForm.roleId) {
    alert('Por favor, selecciona un rol.')
    return
  }

  if (assignForm.permissions.length === 0) {
    alert('Por favor, selecciona al menos un permiso.')
    return
  }

  loading.value = true

  try {
    await permissionsStore.assignPermissionsToRole(
      assignForm.roleId,
      assignForm.permissions
    )
    
    // Cerrar modal
    isModalAssignActive.value = false
    
    // Mostrar mensaje de éxito
    alert('✅ Permisos asignados exitosamente al rol')
    
    console.log('✅ Permisos asignados exitosamente al rol')
  } catch (error) {
    console.error('❌ Error al asignar permisos:', error)
    alert('Error al asignar permisos. Revisa la consola para más detalles.')
  } finally {
    loading.value = false
  }
}

/**
 * resetForm - Resetea el formulario a su estado inicial
 */
const resetForm = () => {
  form.code = ''
  form.description = ''
  selectedPermission.value = null
}

/**
 * resetAssignForm - Resetea el formulario de asignación
 */
const resetAssignForm = () => {
  assignForm.userId = null
  assignForm.permissions = []
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <!-- ============================================ -->
      <!-- MENSAJE DE ACCESO DENEGADO -->
      <!-- ============================================ -->
      <div v-if="!isAdmin" class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h2 class="text-lg font-semibold text-yellow-800">Acceso denegado</h2>
        <p class="text-sm text-yellow-700">Esta vista solo está disponible para administradores. Por favor, inicia sesión con una cuenta de administrador.</p>
      </div>
      <div v-else>
      <!-- ============================================ -->
      <!-- TÍTULO DE LA SECCIÓN -->
      <!-- ============================================ -->
      <SectionTitleLineWithButton 
        :icon="mdiShieldKey" 
        title="Gestión de Permisos" 
        main
      >
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nuevo Permiso"
          color="info"
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ============================================ -->
      <!-- INFORMACIÓN DEL USUARIO ACTUAL -->
      <!-- ============================================ -->
      <CardBox class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Usuario: {{ currentUserName }}</h3>
            <p class="text-sm text-gray-500">
              Rol: {{ isAdmin ? 'Administrador' : 'Usuario' }}
            </p>
          </div>
          <div v-if="!authStore.isAuthenticated" class="text-right">
            <span class="text-xs text-yellow-600">
              Sesión no iniciada
            </span>
          </div>
        </div>
      </CardBox>

      <!-- ============================================ -->
      <!-- TABLA DE PERMISOS -->
      <!-- ============================================ -->
      <CardBox>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">Lista de Permisos del Sistema</h3>
          <span class="text-sm text-gray-500">
            Total: {{ permissionsList.length }} permisos
          </span>
        </div>

        <!-- Estado de carga -->
        <div v-if="permissionsStore.isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-4 text-gray-500">Cargando permisos...</p>
        </div>

        <!-- Mensaje de error -->
        <div v-else-if="permissionsStore.error" class="text-center py-8">
          <div class="text-red-500 text-4xl mb-4">⚠️</div>
          <p class="text-red-500">{{ permissionsStore.error }}</p>
          <BaseButton
            label="Reintentar"
            color="info"
            class="mt-4"
            @click="permissionsStore.fetchPermissions"
          />
        </div>

        <!-- Tabla de permisos -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Código
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Descripción
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-700">
              <tr v-for="permission in permissionsList" :key="permission.id" class="hover:bg-gray-50 dark:hover:bg-slate-800">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                  {{ permission.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                  <code class="bg-gray-100 px-2 py-1 rounded dark:bg-slate-700">{{ permission.code }}</code>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                  {{ permission.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <!-- Botón Editar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(permission)"
                      title="Editar"
                    />
                    
                    <!-- Botón Eliminar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="mdiDelete"
                      color="danger"
                      small
                      @click="openDeleteModal(permission)"
                      title="Eliminar"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mensaje si no hay permisos -->
        <div v-if="!permissionsStore.isLoading && !permissionsStore.error && permissionsList.length === 0" class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-4">🔐</div>
          <p class="text-gray-500">No hay permisos registrados en el sistema.</p>
          <BaseButton
            v-if="isAdmin"
            label="Crear Primer Permiso"
            color="info"
            class="mt-4"
            @click="openCreateModal"
          />
        </div>
      </CardBox>

      <!-- ============================================ -->
      <!-- MODAL: CREAR PERMISO -->
      <!-- ============================================ -->
      <CardBoxModal
        v-model="isModalCreateActive"
        title="Crear Nuevo Permiso"
        buttonLabel="Crear"
        button="info"
        hasCancel
        isForm
        :isProcessing="loading"
        @confirm="createPermission"
      >

        <FormField label="Código del Permiso" help="Código único para identificar el permiso (sin espacios)">
          <FormControl
            v-model="form.code"
            type="text"
            placeholder="Ej: manage_users"
            required
          />
        </FormField>

        <FormField label="Descripción" help="Descripción detallada del permiso">
          <FormControl
            v-model="form.description"
            type="textarea"
            placeholder="Describe qué permite hacer este permiso..."
            required
          />
        </FormField>
      </CardBoxModal>

      <!-- ============================================ -->
      <!-- MODAL: EDITAR PERMISO -->
      <!-- ============================================ -->
      <CardBoxModal
        v-model="isModalEditActive"
        title="Editar Permiso"
        buttonLabel="Guardar"
        button="info"
        hasCancel
        isForm
        :isProcessing="loading"
        @confirm="updatePermission"
      >
        <FormField label="Código del Permiso">
          <FormControl
            v-model="form.code"
            type="text"
            placeholder="Ej: manage_users"
            required
          />
        </FormField>

        <FormField label="Descripción">
          <FormControl
            v-model="form.description"
            type="textarea"
            placeholder="Describe qué permite hacer este permiso..."
            required
          />
        </FormField>
      </CardBoxModal>

      <!-- ============================================ -->
      <!-- MODAL: ELIMINAR PERMISO -->
      <!-- ============================================ -->
      <CardBoxModal
        v-model="isModalDeleteActive"
        title="Eliminar Permiso"
        buttonLabel="Eliminar"
        button="danger"
        hasCancel
        isForm
        :isProcessing="loading"
        @confirm="deletePermission"
      >
        <div class="text-center py-4">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <p class="text-lg font-semibold mb-2">¿Estás seguro de eliminar este permiso?</p>
          <p class="text-gray-500 mb-4">
            Permiso: <strong>{{ selectedPermission?.name }}</strong>
          </p>
          <p class="text-sm text-gray-400">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>

      <!-- ============================================ -->
      <!-- MODAL: ASIGNAR PERMISOS A ROL -->
      <!-- ============================================ -->
      <CardBoxModal
        v-model="isModalAssignActive"
        title="Asignar Permisos a Rol"
        buttonLabel="Asignar"
        button="success"
        hasCancel
        isForm
        :isProcessing="loading"
        @confirm="assignPermissions"
      >
        <FormField label="Rol" help="Selecciona el rol al que deseas asignar permisos">
          <FormControl
            v-model="assignForm.roleId"
            :options="selectRoleOptions"
            placeholder="Selecciona un rol"
            required
          />
        </FormField>

        <FormField label="Seleccionar Permisos" help="Selecciona los permisos que deseas asignar">
          <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 dark:border-slate-700">
            <div
              v-for="permission in availablePermissions"
              :key="permission.id"
              class="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                :id="`perm-${permission.id}`"
                :value="permission.code"
                v-model="assignForm.permissions"
                class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <label :for="`perm-${permission.id}`" class="ml-3 block text-sm cursor-pointer flex-1">
                <span class="font-medium text-gray-900 dark:text-slate-100 block">{{ permission.code }}</span>
                <span class="text-gray-500 dark:text-slate-400 text-xs block mt-1">{{ permission.description }}</span>
              </label>
            </div>
          </div>
        </FormField>

        <div class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Permisos seleccionados
              </p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ assignForm.permissions.length }}
              </p>
            </div>
            <div class="text-blue-400 dark:text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </CardBoxModal>

      <!-- ============================================ -->
      <!-- INFORMACIÓN ADICIONAL -->
      <!-- ============================================ -->
      <CardBox class="mt-6">
        <h3 class="text-lg font-semibold mb-4">ℹ️ Información sobre Permisos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-slate-100 mb-2">¿Qué son los permisos?</h4>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              Los permisos son reglas que controlan qué acciones puede realizar un usuario en el sistema.
              Cada permiso tiene un código único que se usa para verificar los accesos.
            </p>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-slate-100 mb-2">Permisos Disponibles</h4>
            <ul class="text-sm text-gray-500 dark:text-slate-400 space-y-1">
              <li v-for="perm in availablePermissions" :key="perm.id">
                <code class="bg-gray-100 px-1 rounded dark:bg-slate-700">{{ perm.id }}</code> - {{ perm.name }}
              </li>
            </ul>
          </div>
        </div>
      </CardBox>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>

<style scoped>
/* Estilos adicionales para la vista de permisos */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
