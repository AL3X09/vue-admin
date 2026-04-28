/**
 * Store de Permisos - Gestión de Permisos del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con los permisos
 * de usuario en el sistema. Permite crear, leer, actualizar y eliminar
 * permisos, así como asignar permisos a usuarios.
 * 
 * NOTA: El proceso de sesión no está completamente listo, por lo que
 * la obtención del perfil del usuario se simula mientras se completa
 * la implementación de autenticación.
 * 
 * FUNCIONALIDADES:
 * - Listar todos los permisos
 * - Crear nuevos permisos
 * - Actualizar permisos existentes
 * - Eliminar permisos
 * - Asignar permisos a usuarios
 * - Obtener permisos de un usuario específico
 * 
 * ENDPOINTS DEL BACKEND (simulados por ahora):
 * - GET /permissions - Listar todos los permisos
 * - POST /permissions - Crear nuevo permiso
 * - PUT /permissions/:id - Actualizar permiso
 * - DELETE /permissions/:id - Eliminar permiso
 * - GET /permissions/user/:userId - Obtener permisos de un usuario
 * - POST /permissions/assign - Asignar permisos a usuario
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const usePermissionsStore = defineStore('permissions', {
  state: () => ({
    // Lista de todos los permisos del sistema
    permissions: [],
    
    // Lista de usuarios del sistema (para asignar permisos)
    users: [],
    
    // Lista de roles del sistema (para asignar permisos a rol)
    roles: [],
    
    // Lista de usuarios con sus permisos asignados
    userPermissions: [],
    
    // Permisos disponibles en el sistema (tipos de permisos)
    availablePermissions: [
      { id: 'view_dashboard', name: 'Ver Dashboard', description: 'Permite ver el panel principal' },
      { id: 'manage_parking', name: 'Gestionar Parqueaderos', description: 'Permite crear, editar y eliminar parqueaderos' },
      { id: 'manage_reservations', name: 'Gestionar Reservas', description: 'Permite ver y gestionar reservas' },
      { id: 'manage_users', name: 'Gestionar Usuarios', description: 'Permite crear, editar y eliminar usuarios' },
      { id: 'manage_permissions', name: 'Gestionar Permisos', description: 'Permite asignar y revocar permisos' },
      { id: 'view_reports', name: 'Ver Reportes', description: 'Permite acceder a reportes del sistema' },
      { id: 'manage_lottery', name: 'Gestionar Sorteo', description: 'Permite gestionar el sorteo de parqueaderos' },
      { id: 'manage_visitors', name: 'Gestionar Visitantes', description: 'Permite gestionar parqueaderos de visitantes' },
    ],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
  }),

  getters: {
    /**
     * Obtiene la lista de permisos formateada para mostrar en tabla
     * @returns {Array} Lista de permisos con información formateada
     */
    permissionsList: (state) => {
      return state.permissions.map(permission => ({
        ...permission,
      }))
    },

    /**
     * Verifica si el usuario actual tiene un permiso específico
     * @param {string} permissionId - ID del permiso a verificar (ej: 'usuarios:read', 'parking:lottery:write')
     * @returns {boolean} true si el usuario tiene el permiso
     *
     * COMPORTAMIENTO:
     * - Superadmin (role.id=1 o name='superadmin') → SIEMPRE tiene todos los permisos
     * - Usuarios normales → Verifica en authStore.user.permissions o authStore.user.role.permissions
     * - Si no hay usuario autenticado → retorna false
     */
    hasPermission: (state, getters) => (permissionId) => {
      const authStore = useAuthStore()

      const user = authStore.user
      if (!user) return false

      // Obtener permisos: primero de user.permissions, luego de user.role.permissions
      let userPermissions = user.permissions

      if (!Array.isArray(userPermissions) && user.role && Array.isArray(user.role.permissions)) {
        userPermissions = user.role.permissions
      }

      if (!Array.isArray(userPermissions)) {
        console.warn('[permissions.store] No se encontró lista de permisos en el usuario')
        return false
      }

      return userPermissions.includes(permissionId)
    },

    /**
     * Obtiene los permisos del usuario actual
     * @returns {Array} Lista de permisos del usuario actual
     */
    currentUserPermissions: (state) => {
      return state.availablePermissions
    },

    /**
     * Verifica si el usuario actual es superadministrador
     * @returns {boolean} true si el usuario es superadmin
     */
    isAdmin: (state) => {
      const authStore = useAuthStore()
      const currentUser = authStore.user
      
      if (!currentUser) return false
      
      const userRole = currentUser.role
      
      if (typeof userRole === 'object' && userRole !== null) {
        return userRole.id === 1 || userRole.name?.toLowerCase() === 'superadmin'
      } else if (typeof userRole === 'string') {
        return userRole.toLowerCase() === 'superadmin'
      }
      
      return false
    }
  },

  actions: {
    /**
     * FETCH PERMISSIONS - Obtiene la lista de todos los permisos
     * 
     * NOTA: Esta función simula la obtención de permisos del backend.
     * Cuando el backend esté listo, se conectará al endpoint real.
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * await permissionsStore.fetchPermissions()
     * console.log(permissionsStore.permissions)
     * ```
     */
    async fetchPermissions() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/permissions')
        this.permissions = response.data

        console.log('✅ Permisos cargados desde el backend:', this.permissions.length)
      } catch (error) {
        console.error('❌ Error al cargar permisos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los permisos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE PERMISSION - Crea un nuevo permiso
     * 
     * @param {Object} permissionData - Datos del permiso a crear
     * @param {string} permissionData.name - Nombre del permiso
     * @param {string} permissionData.code - Código único del permiso
     * @param {string} permissionData.description - Descripción del permiso
     * @returns {Promise<Object>} Permiso creado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * const newPermission = await permissionsStore.createPermission({
     *   name: 'Nuevo Permiso',
     *   code: 'new_permission',
     *   description: 'Descripción del nuevo permiso'
     * })
     * ```
     */
    async createPermission(permissionData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        // La API espera: code, description (no name ni is_active)
        const payload = {
          code: permissionData.code,
          description: permissionData.description
        }
        const response = await api.post('/permissions', payload)
        const newPermission = response.data
        
        this.permissions.push(newPermission)
        this.successMessage = 'Permiso creado exitosamente'
        
        console.log('✅ Permiso creado:', newPermission)
        return newPermission
      } catch (error) {
        console.error('❌ Error al crear permiso:', error)
        this.error = error.response?.data?.detail || 'Error al crear el permiso'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE PERMISSION - Actualiza un permiso existente
     * 
     * @param {number} permissionId - ID del permiso a actualizar
     * @param {Object} permissionData - Datos actualizados del permiso
     * @returns {Promise<Object>} Permiso actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * const updated = await permissionsStore.updatePermission(1, {
     *   name: 'Nombre Actualizado',
     *   description: 'Nueva descripción'
     * })
     * ```
     */
    async updatePermission(permissionId, permissionData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        // La API espera: code, description (no name ni is_active)
        const payload = {
          code: permissionData.code,
          description: permissionData.description
        }
        const response = await api.patch(`/permissions/${permissionId}`, payload)
        const updatedPermission = response.data
        
        const index = this.permissions.findIndex(p => p.id === permissionId)
        if (index !== -1) {
          this.permissions[index] = updatedPermission
        }
        
        this.successMessage = 'Permiso actualizado exitosamente'
        
        console.log('✅ Permiso actualizado:', updatedPermission)
        return updatedPermission
      } catch (error) {
        console.error('❌ Error al actualizar permiso:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el permiso'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DELETE PERMISSION - Elimina un permiso
     * 
     * @param {number} permissionId - ID del permiso a eliminar
     * @returns {Promise<boolean>} true si se eliminó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * const success = await permissionsStore.deletePermission(1)
     * if (success) {
     *   console.log('Permiso eliminado')
     * }
     * ```
     */
    async deletePermission(permissionId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/permissions/${permissionId}`)
        
        const index = this.permissions.findIndex(p => p.id === permissionId)
        if (index !== -1) {
          this.permissions.splice(index, 1)
        }
        
        this.successMessage = 'Permiso eliminado exitosamente'
        
        console.log('✅ Permiso eliminado:', permissionId)
        return true
      } catch (error) {
        console.error('❌ Error al eliminar permiso:', error)
        this.error = error.response?.data?.detail || 'Error al eliminar el permiso'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE PERMISSION STATUS - Activa/Desactiva un permiso
     * 
     * @param {number} permissionId - ID del permiso
     * @returns {Promise<Object>} Permiso actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * await permissionsStore.togglePermissionStatus(1)
     * ```
     */
    async togglePermissionStatus(permissionId) {
      const permission = this.permissions.find(p => p.id === permissionId)
      if (!permission) {
        throw new Error('Permiso no encontrado')
      }
      
      return await this.updatePermission(permissionId, {
        is_active: !permission.is_active
      })
    },

    /**
     * FETCH USER PERMISSIONS - Obtiene los permisos de un usuario específico
     * 
     * @param {number} userId - ID del usuario
     * @returns {Promise<Array>} Lista de permisos del usuario
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * const userPerms = await permissionsStore.fetchUserPermissions(1)
     * console.log(userPerms)
     * ```
     */
    async fetchUserPermissions(userId) {
      this.isLoading = true
      this.error = null

      try {
        // TODO: Conectar con el backend real cuando esté listo
        // const response = await api.get(`/permissions/user/${userId}`)
        // return response.data
        
        // SIMULACIÓN: Retornar permisos del usuario actual
        await new Promise(resolve => setTimeout(resolve, 500))
        
        return this.currentUser.permissions
      } catch (error) {
        console.error('❌ Error al obtener permisos del usuario:', error)
        this.error = error.response?.data?.detail || 'Error al obtener permisos del usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * ASSIGN PERMISSIONS TO USER - Asigna permisos a un usuario
     * 
     * @param {number} userId - ID del usuario
     * @param {Array<string>} permissionCodes - Códigos de permisos a asignar
     * @returns {Promise<boolean>} true si se asignaron correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const permissionsStore = usePermissionsStore()
     * const success = await permissionsStore.assignPermissionsToUser(1, ['view_dashboard', 'manage_parking'])
     * ```
     */
    async assignPermissionsToUser(userId, permissionCodes) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const user = this.users.find(u => u.id === userId)
        if (!user) {
          throw new Error('Usuario no encontrado')
        }
        
        await api.post(`/users/${user.username}/permissions`, {
          permissions: permissionCodes
        })
        
        this.successMessage = 'Permisos asignados exitosamente'
        console.log('✅ Permisos asignados al usuario:', user.username, permissionCodes)
        return true
      } catch (error) {
        console.error('❌ Error al asignar permisos:', error)
        this.error = error.response?.data?.detail || 'Error al asignar permisos'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CLEAR MESSAGES - Limpia los mensajes de error y éxito
     */
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    /**
     * RESET STORE - Reinicia el store a su estado inicial
     */
    reset() {
      this.permissions = []
      this.users = []
      this.userPermissions = []
      this.error = null
      this.successMessage = null
      this.isLoading = false
    },

    /**
     * FETCH USERS - Obtiene la lista de usuarios del sistema
     * 
     * @returns {Promise<void>}
     */
    async fetchUsers() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/users')
        this.users = response.data
        console.log('✅ Usuarios cargados:', this.users.length)
      } catch (error) {
        console.error('❌ Error al cargar usuarios:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los usuarios'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH ROLES - Obtiene la lista de roles del sistema
     * 
     * @returns {Promise<void>}
     */
    async fetchRoles() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/roles')
        this.roles = response.data
        console.log('✅ Roles cargados:', this.roles.length)
      } catch (error) {
        console.error('❌ Error al cargar roles:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los roles'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * ASSIGN PERMISSIONS TO ROLE - Asigna permisos a un rol
     * 
     * @param {number} roleId - ID del rol
     * @param {Array<string>} permissionCodes - Códigos de permisos a asignar
     * @returns {Promise<boolean>} true si se asignaron correctamente
     */
    async assignPermissionsToRole(roleId, permissionCodes) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const role = this.roles.find(r => r.id === roleId)
        if (!role) {
          throw new Error('Rol no encontrado')
        }
        
        await api.patch(`/roles/${roleId}`, {
          permissions: permissionCodes
        })
        
        this.successMessage = 'Permisos asignados exitosamente al rol'
        console.log('✅ Permisos asignados al rol:', role.name, permissionCodes)
        return true
      } catch (error) {
        console.error('❌ Error al asignar permisos al rol:', error)
        this.error = error.response?.data?.detail || 'Error al asignar permisos al rol'
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
