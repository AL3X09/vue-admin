/**
 * Store de Usuarios - Gestión de Usuarios del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con los usuarios
 * del sistema. Permite crear, leer, actualizar y eliminar usuarios,
 * así como gestionar sus roles y permisos.
 * 
 * FUNCIONALIDADES:
 * - Listar todos los usuarios
 * - Crear nuevos usuarios
 * - Actualizar usuarios existentes
 * - Eliminar usuarios
 * - Cambiar roles de usuarios
 * - Gestionar permisos de usuarios
 * - Activar/Desactivar usuarios
 * 
  * ROLES DISPONIBLES (según UserRole enum del backend):
  * - superadmin: Super Administrador del sistema
  * - propietario: Propietario de una unidad
 * - arrendatario: Arrendatario de una unidad
 * - celador: Personal de seguridad
 * - aseador: Personal de limpieza
 * - todero: Personal de mantenimiento
 * - consejero: Miembro del consejo
 * - administrador: Administrador del conjunto
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /users - Listar todos los usuarios
 * - POST /users - Crear nuevo usuario
 * - PUT /users/:id - Actualizar usuario
 * - DELETE /users/:id - Eliminar usuario
 * - PATCH /users/:id/role - Cambiar rol de usuario
 * - PATCH /users/:id/status - Activar/Desactivar usuario
 * - GET /users/:id/permissions - Obtener permisos de usuario
 * - POST /users/:id/permissions - Asignar permisos a usuario
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useUsersStore = defineStore('users', {
  state: () => ({
    // Lista de todos los usuarios del sistema
    users: [],
    
    // Roles disponibles en el sistema
    availableRoles: [
      { id: 'superadmin', name: 'Super Administrador', description: 'Super Administrador del sistema con acceso total' },
      { id: 'propietario', name: 'Propietario', description: 'Propietario de una unidad residencial' },
      { id: 'arrendatario', name: 'Arrendatario', description: 'Arrendatario de una unidad residencial' },
      { id: 'celador', name: 'Celador', description: 'Personal de seguridad del conjunto' },
      { id: 'aseador', name: 'Aseador', description: 'Personal de limpieza del conjunto' },
      { id: 'todero', name: 'Todero', description: 'Personal de mantenimiento del conjunto' },
      { id: 'consejero', name: 'Consejero', description: 'Miembro del consejo de administración' },
      { id: 'administrador', name: 'Administrador Conjunto', description: 'Administrador del conjunto residencial' },
    ],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      search: '',
      role: null,
      status: null,
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
      // Obtener el usuario actual del auth store
      const authStore = useAuthStore()
      const currentUser = authStore.user
      
      // Si no hay usuario autenticado, no es superadmin
      if (!currentUser) return false
      
      // El rol puede venir como string (legacy) o como objeto (nuevo formato)
      //Nuevo formato: user.role es un objeto { id, name, description, permissions }
      //Legacy formato: user.role es un string 'superadmin', 'propietario', etc.
      const userRole = currentUser.role
      
      if (typeof userRole === 'object' && userRole !== null) {
        // Nuevo formato: el rol es un objeto RoleRead
        // Verificar por id numérico o nombre
        return userRole.id === 1 || userRole.name?.toLowerCase() === 'superadmin'
      } else if (typeof userRole === 'string') {
        // Legacy formato: el rol es un string
        return userRole.toLowerCase() === 'superadmin'
      }
      
      return false
    },

    /**
     * Obtiene la lista de usuarios formateada para mostrar en tabla
     * @returns {Array} Lista de usuarios con información formateada
     * 
     * NOTA: El rol puede venir como objeto (nuevo) o string (legacy)
     */
    usersList: (state) => {
      return state.users.map(user => {
        // Extraer el nombre del rol - puede ser objeto o string
        let roleName = 'Sin rol'
        if (user.role) {
          if (typeof user.role === 'object' && user.role.name) {
            roleName = user.role.name
          } else if (typeof user.role === 'string') {
            roleName = state.availableRoles.find(r => r.id === user.role)?.name || user.role
          }
        }
        
        return {
          ...user,
          roleName,
          statusText: user.is_active ? 'Activo' : 'Inactivo',
          statusClass: user.is_active ? 'text-emerald-500' : 'text-red-500',
          createdAtFormatted: new Date(user.created_at).toLocaleDateString('es-CO'),
          updatedAtFormatted: new Date(user.updated_at).toLocaleDateString('es-CO'),
        }
      })
    },

    /**
     * Filtra usuarios según los criterios actuales
     * @returns {Array} Lista de usuarios filtrados
     */
    filteredUsers: (state) => {
      let filtered = [...state.users]
      
      // Filtrar por búsqueda
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.first_name?.toLowerCase().includes(searchLower) ||
          user.last_name?.toLowerCase().includes(searchLower)
        )
      }
      
      // Filtrar por rol
      if (state.filters.role) {
        filtered = filtered.filter(user => user.role === state.filters.role)
      }
      
      // Filtrar por estado
      if (state.filters.status !== null) {
        filtered = filtered.filter(user => user.is_active === state.filters.status)
      }
      
      return filtered
    },

    /**
     * Obtiene usuarios paginados
     * @returns {Array} Lista de usuarios para la página actual
     */
    paginatedUsers: (state) => {
      const filtered = state.filteredUsers
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredUsers.length / state.pagination.pageSize)
    },

    /**
     * Obtiene un usuario por su ID
     * @param {number} userId - ID del usuario
     * @returns {Object|null} Usuario encontrado o null
     */
    getUserById: (state) => (userId) => {
      return state.users.find(user => user.id === userId) || null
    },

    /**
     * Obtiene estadísticas de usuarios
     * @returns {Object} Estadísticas de usuarios
     */
    userStats: (state) => {
      const total = state.users.length
      const active = state.users.filter(u => u.is_active).length
      const inactive = total - active
      
      const byRole = {}
      state.availableRoles.forEach(role => {
        byRole[role.id] = state.users.filter(u => u.role === role.id).length
      })
      
      return {
        total,
        active,
        inactive,
        byRole
      }
    }
  },

  actions: {
    /**
     * FETCH USERS - Obtiene la lista de todos los usuarios
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * await usersStore.fetchUsers()
     * console.log(usersStore.users)
     * ```
     */
    async fetchUsers() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/users')
        this.users = response.data
        this.pagination.total = this.users.length
        console.log('✅ Usuarios cargados:', this.users.length)
      } catch (error) {
        console.error('❌ Error al cargar usuarios:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los usuarios'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE USER - Crea un nuevo usuario
     * 
     * @param {Object} userData - Datos del usuario a crear
     * @param {string} userData.username - Nombre de usuario
     * @param {string} userData.email - Correo electrónico
     * @param {string} userData.password - Contraseña
     * @param {string} userData.first_name - Nombre
     * @param {string} userData.last_name - Apellido
     * @param {string} userData.role_id - ID del rol del usuario
     * @param {string} userData.phone - Teléfono
     * @param {string} userData.document_type - Tipo de documento
     * @param {string} userData.document_number - Número de documento
     * @returns {Promise<Object>} Usuario creado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * const newUser = await usersStore.createUser({
     *   username: 'nuevousuario',
     *   email: 'nuevo@email.com',
     *   password: 'password123',
     *   first_name: 'Nuevo',
     *   last_name: 'Usuario',
     *   role: 'propietario',
     *   phone: '3001234567',
     *   document_type: 'CC',
     *   document_number: '1234567890'
     * })
     * ```
     */
    async createUser(userData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        console.log('🚀 ENVIANDO a /users:', JSON.stringify(userData))

        const response = await api.post('/users', userData)
        const newUser = response.data
        
        this.users.push(newUser)
        this.pagination.total = this.users.length
        this.successMessage = 'Usuario creado exitosamente'
        
        console.log('✅ Usuario creado:', newUser)
        return newUser
      } catch (error) {
        console.error('❌ Error al crear usuario:', error)
        this.error = error.response?.data?.detail || 'Error al crear el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE USER - Actualiza un usuario existente
     * 
     * @param {number} userId - ID del usuario a actualizar
     * @param {Object} userData - Datos actualizados del usuario
     * @returns {Promise<Object>} Usuario actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * const updated = await usersStore.updateUser(1, {
     *   first_name: 'Nombre Actualizado',
     *   phone: '3009876543'
     * })
     * ```
     */
    async updateUser(userId, userData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/users/${userId}`, userData)
        const updatedUser = response.data
        
        const index = this.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        
        this.successMessage = 'Usuario actualizado exitosamente'
        
        console.log('✅ Usuario actualizado:', updatedUser)
        return updatedUser
      } catch (error) {
        console.error('❌ Error al actualizar usuario:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DELETE USER - Elimina un usuario
     * 
     * @param {number} userId - ID del usuario a eliminar
     * @returns {Promise<boolean>} true si se eliminó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * const success = await usersStore.deleteUser(1)
     * if (success) {
     *   console.log('Usuario eliminado')
     * }
     * ```
     */
    async deleteUser(userId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/users/${userId}`)
        
        const index = this.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          this.users.splice(index, 1)
          this.pagination.total = this.users.length
        }
        
        this.successMessage = 'Usuario eliminado exitosamente'
        
        console.log('✅ Usuario eliminado:', userId)
        return true
      } catch (error) {
        console.error('❌ Error al eliminar usuario:', error)
        this.error = error.response?.data?.detail || 'Error al eliminar el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CHANGE USER ROLE - Cambia el rol de un usuario
     * 
     * @param {number} userId - ID del usuario
     * @param {string} newRole - Nuevo rol del usuario
     * @returns {Promise<Object>} Usuario actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * await usersStore.changeUserRole(1, 'propietario')
     * ```
     */
    async changeUserRole(userId, newRole) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/users/${userId}/role`, { role: newRole })
        const updatedUser = response.data
        
        const index = this.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          this.users[index] = updatedUser
        }
        
        this.successMessage = 'Rol de usuario actualizado exitosamente'
        
        console.log('✅ Rol de usuario actualizado:', updatedUser)
        return updatedUser
      } catch (error) {
        console.error('❌ Error al cambiar rol de usuario:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar el rol del usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE USER STATUS - Activa/Desactiva un usuario
     * 
     * @param {number} userId - ID del usuario
     * @returns {Promise<Object>} Usuario actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const usersStore = useUsersStore()
     * await usersStore.toggleUserStatus(1)
     * ```
     */
    async toggleUserStatus(userId) {
      const user = this.users.find(u => u.id === userId)
      if (!user) {
        throw new Error('Usuario no encontrado')
      }
      
      return await this.updateUser(userId, {
        is_active: !user.is_active
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
     * const usersStore = useUsersStore()
     * const userPerms = await usersStore.fetchUserPermissions(1)
     * console.log(userPerms)
     * ```
     */
    async fetchUserById(userId) {
      this.isLoading = true
      this.error = null
      try {
        const response = await api.get(`/users/${userId}`)
        const user = response.data

        // Actualizar el usuario en la lista si existe
        const index = this.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          this.users[index] = user
        }

        return user
      } catch (error) {
        console.error('❌ Error al obtener usuario por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchUserPermissions(userId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/users/${userId}/permissions`)
        return response.data
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
     * const usersStore = useUsersStore()
     * const success = await usersStore.assignPermissionsToUser(1, ['view_dashboard', 'manage_parking'])
     * ```
     */
    async assignPermissionsToUser(userId, permissionCodes) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.post(`/users/${userId}/permissions`, {
          permissions: permissionCodes
        })
        
        this.successMessage = 'Permisos asignados exitosamente'
        console.log('✅ Permisos asignados al usuario:', userId, permissionCodes)
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
     * SET FILTERS - Establece los filtros de búsqueda
     * 
     * @param {Object} filters - Filtros a aplicar
     * @param {string} filters.search - Texto de búsqueda
     * @param {string} filters.role - Filtrar por rol
     * @param {boolean} filters.status - Filtrar por estado
     */
    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      if (filters.role !== undefined) this.filters.role = filters.role
      if (filters.status !== undefined) this.filters.status = filters.status
      
      // Resetear a la primera página al cambiar filtros
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
      this.users = []
      this.filters = {
        search: '',
        role: null,
        status: null,
      }
      this.pagination = {
        currentPage: 1,
        pageSize: 10,
        total: 0,
      }
      this.error = null
      this.successMessage = null
      this.isLoading = false
    }
  }
})
