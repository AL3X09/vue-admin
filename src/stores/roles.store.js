/**
 * Store de Roles - Gestión de Roles del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con los roles
 * del sistema. Permite crear, leer, actualizar y listar roles.
 * 
 * FUNCIONALIDADES:
 * - Listar todos los roles
 * - Crear nuevos roles
 * - Actualizar roles existentes
 * - Obtener un rol específico por ID
 * 
 * ESTRUCTURA DE UN ROL:
 * - id: Identificador único
 * - name: Nombre del rol
 * - description: Descripción del rol (opcional)
 * - permissions: Lista de permisos asociados (con id, code, description)
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /roles - Listar todos los roles (soporta ?q= para búsqueda)
 * - GET /roles/:id - Obtener un rol por ID
 * - POST /roles - Crear nuevo rol
 * - PATCH /roles/:id - Actualizar rol
 * - DELETE /roles/:id - Eliminar rol
 * 
 * PERMISOS REQUERIDOS:
 * - roles:read - Para listar y ver roles
 * - roles:write - Para crear y actualizar roles
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useRolesStore = defineStore('roles', {
  state: () => ({
    // Lista de todos los roles del sistema
    roles: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      search: '',
    },
    
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0,
    }
  }),

  getters: {
/**
      * Verifica si el usuario actual es superadministrador
      * @returns {boolean} true si el usuario tiene rol de superadmin
      * 
      * NOTA: El rol ahora viene como objeto desde el backend (RoleRead)
      * con estructura: { id, name, description, permissions }
      * Se verifica tanto el id como el name para mayor compatibilidad
      */
    isAdmin: (state) => {
      const authStore = useAuthStore()
      const currentUser = authStore.user
      
      if (!currentUser) return false
      
      // El rol puede venir como string (legacy) o como objeto (nuevo formato)
      const userRole = currentUser.role
      
      if (typeof userRole === 'object' && userRole !== null) {
        // Nuevo formato: el rol es un objeto RoleRead
        return userRole.id === 1 || userRole.name?.toLowerCase() === 'superadmin'
      } else if (typeof userRole === 'string') {
        // Legacy formato: el rol es un string
        return userRole.toLowerCase() === 'superadmin'
      }
      
      return false
    },

    /**
     * Obtiene la lista de roles formateada para mostrar en tabla
     * @returns {Array} Lista de roles con información formateada
     */
    rolesList: (state) => {
      return state.roles.map(role => ({
        ...role,
        permissionCount: role.permissions?.length || 0,
        permissionsText: role.permissions?.map(p => p.code).join(', ') || 'Sin permisos',
      }))
    },

    /**
     * Filtra roles según los criterios actuales
     * @returns {Array} Lista de roles filtrados
     */
    filteredRoles: (state) => {
      let filtered = [...state.roles]
      
      // Filtrar por búsqueda
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(role => 
          role.name.toLowerCase().includes(searchLower) ||
          role.description?.toLowerCase().includes(searchLower)
        )
      }
      
      return filtered
    },

    /**
     * Obtiene roles paginados
     * @returns {Array} Lista de roles para la página actual
     */
    paginatedRoles: (state) => {
      const filtered = state.filteredRoles
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredRoles.length / state.pagination.pageSize)
    },

    /**
     * Obtiene un rol por su ID
     * @param {number} roleId - ID del rol
     * @returns {Object|null} Rol encontrado o null
     */
    getRoleById: (state) => (roleId) => {
      return state.roles.find(role => role.id === roleId) || null
    },

    /**
     * Obtiene estadísticas de roles
     * @returns {Object} Estadísticas de roles
     */
    roleStats: (state) => {
      const total = state.roles.length
      const withPermissions = state.roles.filter(r => r.permissions && r.permissions.length > 0).length
      const withoutPermissions = total - withPermissions
      
      return {
        total,
        withPermissions,
        withoutPermissions
      }
    },

    /**
     * Obtiene todos los permisos únicos de todos los roles para el selector
     * @returns {Array} Lista de permisos únicos con formato para select
     */
    allPermissionsOptions: (state) => {
      const permissionMap = new Map()
      
      state.roles.forEach(role => {
        if (role.permissions) {
          role.permissions.forEach(perm => {
            if (!permissionMap.has(perm.code)) {
              permissionMap.set(perm.code, {
                id: perm.code,
                code: perm.code,
                description: perm.description || `Permiso ${perm.code}`,
                label: `${perm.code}${perm.description ? ' - ' + perm.description : ''}`
              })
            }
          })
        }
      })
      
      return Array.from(permissionMap.values())
    }
  },

  actions: {
    /**
     * FETCH ROLES - Obtiene la lista de todos los roles
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const rolesStore = useRolesStore()
     * await rolesStore.fetchRoles()
     * console.log(rolesStore.roles)
     * ```
     */
    async fetchRoles() {
      this.isLoading = true
      this.error = null

      try {
        const params = {}
        
        if (this.filters.search) {
          params.q = this.filters.search
        }
        
        const response = await api.get('/roles', { params })
        this.roles = response.data
        this.pagination.total = this.roles.length
        console.log('✅ Roles cargados:', this.roles.length)
      } catch (error) {
        console.error('❌ Error al cargar roles:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los roles'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH ROLE BY ID - Obtiene un rol por su ID
     * 
     * @param {number} roleId - ID del rol
     * @returns {Promise<Object>} Rol encontrado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const rolesStore = useRolesStore()
     * const role = await rolesStore.fetchRoleById(1)
     * console.log(role)
     * ```
     */
    async fetchRoleById(roleId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/roles/${roleId}`)
        const role = response.data
        
        // Actualizar el rol en la lista si existe
        const index = this.roles.findIndex(r => r.id === roleId)
        if (index !== -1) {
          this.roles[index] = role
        }
        
        return role
      } catch (error) {
        console.error('❌ Error al obtener rol por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener rol'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE ROLE - Crea un nuevo rol
     * 
     * @param {Object} roleData - Datos del rol a crear
     * @param {string} roleData.name - Nombre del rol (requerido, 3-50 caracteres)
     * @param {string} [roleData.description] - Descripción del rol (opcional)
     * @param {Array<string>} [roleData.permissions] - Lista de códigos de permisos
     * @returns {Promise<Object>} Rol creado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const rolesStore = useRolesStore()
     * const newRole = await rolesStore.createRole({
     *   name: 'editor',
     *   description: 'Editor de contenido',
     *   permissions: ['content:read', 'content:write']
     * })
     * ```
     */
    async createRole(roleData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/roles', roleData)
        const newRole = response.data
        
        this.roles.push(newRole)
        this.pagination.total = this.roles.length
        this.successMessage = 'Rol creado exitosamente'
        
        console.log('✅ Rol creado:', newRole)
        return newRole
      } catch (error) {
        console.error('❌ Error al crear rol:', error)
        this.error = error.response?.data?.detail || 'Error al crear el rol'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE ROLE - Actualiza un rol existente
     * 
     * @param {number} roleId - ID del rol a actualizar
     * @param {Object} roleData - Datos actualizados del rol
     * @returns {Promise<Object>} Rol actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const rolesStore = useRolesStore()
     * const updated = await rolesStore.updateRole(1, {
     *   name: 'editorActualizado',
     *   description: 'Nueva descripción'
     * })
     * ```
     */
    async updateRole(roleId, roleData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/roles/${roleId}`, roleData)
        const updatedRole = response.data
        
        const index = this.roles.findIndex(r => r.id === roleId)
        if (index !== -1) {
          this.roles[index] = updatedRole
        }
        
        this.successMessage = 'Rol actualizado exitosamente'
        
        console.log('✅ Rol actualizado:', updatedRole)
        return updatedRole
      } catch (error) {
        console.error('❌ Error al actualizar rol:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el rol'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DELETE ROLE - Elimina un rol
     * 
     * @param {number} roleId - ID del rol a eliminar
     * @returns {Promise<boolean>} true si se eliminó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const rolesStore = useRolesStore()
     * const success = await rolesStore.deleteRole(1)
     * if (success) {
     *   console.log('Rol eliminado')
     * }
     * ```
     */
    async deleteRole(roleId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/roles/${roleId}`)
        
        const index = this.roles.findIndex(r => r.id === roleId)
        if (index !== -1) {
          this.roles.splice(index, 1)
          this.pagination.total = this.roles.length
        }
        
        this.successMessage = 'Rol eliminado exitosamente'
        
        console.log('✅ Rol eliminado:', roleId)
        return true
      } catch (error) {
        console.error('❌ Error al eliminar rol:', error)
        this.error = error.response?.data?.detail || 'Error al eliminar el rol'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * SET FILTERS - Establece los filtros de búsqueda
     * 
     * @param {Object} filters - Filtros a aplicar
     * @param {string} [filters.search] - Texto de búsqueda
     */
    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      
      // Resetear a la primera página cuando se aplican filtros
      this.pagination.currentPage = 1
    },

    /**
     * SET PAGE - Establece la página actual
     * 
     * @param {number} page - Número de página
     */
    setPage(page) {
      this.pagination.currentPage = page
    },

    /**
     * CLEAR FILTERS - Limpia todos los filtros
     */
    clearFilters() {
      this.filters = {
        search: '',
      }
      this.pagination.currentPage = 1
    },

    /**
     * CLEAR MESSAGES - Limpia los mensajes de error y éxito
     */
    clearMessages() {
      this.error = null
      this.successMessage = null
    }
  }
})