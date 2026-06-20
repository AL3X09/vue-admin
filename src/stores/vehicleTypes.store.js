/**
 * Store de Tipos de Vehículos - Gestión de Tipos de Vehículos del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con los tipos de vehículos
 * del sistema de parqueadero. Permite crear, leer, actualizar y desactivar tipos de vehículos.
 * 
 * FUNCIONALIDADES:
 * - Listar todos los tipos de vehículos con filtros
 * - Crear nuevos tipos de vehículos
 * - Actualizar tipos de vehículos existentes
 * - Desactivar tipos de vehículos
 * - Obtener solo tipos activos para selects
 * 
 * ESTRUCTURA DE UN TIPO DE VEHÍCULO:
 * - id: Identificador único
 * - code: Código único (ej: carro, moto)
 * - name: Nombre para mostrar
 * - emoji: Emoji para UI (opcional)
 * - description: Descripción opcional
 * - display_order: Orden de visualización
 * - is_active: Si el tipo está activo
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /vehicle-types - Listar todos los tipos
 * - GET /vehicle-types/active - Listar solo activos
 * - GET /vehicle-types/:id - Obtener un tipo por ID
 * - POST /vehicle-types - Crear nuevo tipo
 * - PATCH /vehicle-types/:id - Actualizar tipo
 * - POST /vehicle-types/:id/toggle - Activar/Desactivar tipo
 * - DELETE /vehicle-types/:id - Desactivar tipo (soft-delete)
 * 
 * PERMISOS REQUERIDOS:
 * - parking:read - Para listar y ver tipos de vehículos
 * - parking:write - Para crear, actualizar y desactivar tipos de vehículos
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useVehicleTypesStore = defineStore('vehicleTypes', {
  state: () => ({
    // Lista de todos los tipos de vehículos del sistema
    vehicleTypes: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      includeInactive: false,
      search: '',
    },
    
    pagination: {
      currentPage: 1,
      pageSize: 50,
      total: 0,
    }
  }),

  getters: {
    /**
     * Verifica si el usuario actual es superadministrador
     * @returns {boolean} true si el usuario tiene rol de superadmin
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
    },

    /**
     * Obtiene la lista de tipos de vehículos formateada para mostrar en tabla
     * @returns {Array} Lista de tipos con información formateada
     */
    vehicleTypesList: (state) => {
      return state.vehicleTypes.map(vt => ({
        ...vt,
        statusText: vt.is_active ? 'Activo' : 'Inactivo',
        statusClass: vt.is_active ? 'text-emerald-500' : 'text-red-500',
        //displayName: vt.emoji ? `${vt.name}` : vt.name,
      }))
    },

    /**
     * Filtra tipos de vehículos según los criterios actuales
     * @returns {Array} Lista de tipos filtrados
     */
    filteredVehicleTypes: (state) => {
      let filtered = [...state.vehicleTypes]
      
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(vt => 
          vt.name.toLowerCase().includes(searchLower) ||
          vt.code.toLowerCase().includes(searchLower) ||
          vt.description?.toLowerCase().includes(searchLower)
        )
      }
      
      if (!state.filters.includeInactive) {
        filtered = filtered.filter(vt => vt.is_active === true)
      }
      
      filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      
      return filtered.map(vt => ({
        ...vt,
        statusText: vt.is_active ? 'Activo' : 'Inactivo',
        statusClass: vt.is_active ? 'text-emerald-500' : 'text-red-500',
        displayName: vt.emoji ? `${vt.emoji} ${vt.name}` : vt.name,
      }))
    },

    /**
     * Obtiene solo los tipos activos (para selects)
     * @returns {Array} Lista de tipos activos
     */
    activeVehicleTypes: (state) => {
      return state.vehicleTypes
        .filter(vt => vt.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(vt => ({
          ...vt,
          statusText: vt.is_active ? 'Activo' : 'Inactivo',
          statusClass: vt.is_active ? 'text-emerald-500' : 'text-red-500',
          displayName: vt.emoji ? `${vt.emoji} ${vt.name}` : vt.name,
        }))
    },

    /**
     * Obtiene opciones formateadas para selects
     * @returns {Array} Lista de opciones para select
     */
    vehicleTypeOptions: (state) => {
      return state.activeVehicleTypes.map(vt => ({
        id: vt.id,
        label: vt.emoji ? `${vt.emoji} ${vt.name}` : vt.name,
      }))
    },

    /**
     * Obtiene un tipo de vehículo por su ID
     * @param {number} vehicleTypeId - ID del tipo de vehículo
     * @returns {Object|null} Tipo encontrado o null
     */
    getVehicleTypeById: (state) => (vehicleTypeId) => {
      return state.vehicleTypes.find(vt => vt.id === vehicleTypeId) || null
    },

    /**
     * Obtiene estadísticas de tipos de vehículos
     * @returns {Object} Estadísticas de tipos
     */
    vehicleTypeStats: (state) => {
      const total = state.vehicleTypes.length
      const active = state.vehicleTypes.filter(vt => vt.is_active).length
      const inactive = total - active
      
      return {
        total,
        active,
        inactive,
      }
    },

  },

  actions: {
    /**
     * FETCH VEHICLE TYPES - Obtiene la lista de todos los tipos de vehículos
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * await vehicleTypesStore.fetchVehicleTypes()
     * console.log(vehicleTypesStore.vehicleTypes)
     * ```
     */
    async fetchVehicleTypes() {
      this.isLoading = true
      this.error = null

      try {
        const params = {
          include_inactive: this.filters.includeInactive,
        }
        
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await api.get('/vehicle-types', { params })
        this.vehicleTypes = response.data
        this.pagination.total = this.vehicleTypes.length
        console.log('✅ Tipos de vehículos cargados:', this.vehicleTypes.length)
      } catch (error) {
        console.error('❌ Error al cargar tipos de vehículos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los tipos de vehículos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH ACTIVE VEHICLE TYPES - Obtiene solo los tipos activos
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * await vehicleTypesStore.fetchActiveVehicleTypes()
     * ```
     */
    async fetchActiveVehicleTypes() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/vehicle-types/active')
        // Combinar con los existentes o reemplazar
        const activeTypes = response.data
        // Actualizar el estado solo con activos
        this.vehicleTypes = activeTypes
        console.log('✅ Tipos de vehículos activos cargados:', activeTypes.length)
      } catch (error) {
        console.error('❌ Error al cargar tipos activos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los tipos activos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE VEHICLE TYPE - Crea un nuevo tipo de vehículo
     * 
     * @param {Object} vehicleTypeData - Datos del tipo de vehículo a crear
     * @param {string} vehicleTypeData.code - Código único (obligatorio)
     * @param {string} vehicleTypeData.name - Nombre para mostrar (obligatorio)
     * @param {string} [vehicleTypeData.emoji] - Emoji para UI (opcional)
     * @param {string} [vehicleTypeData.description] - Descripción (opcional)
     * @param {number} [vehicleTypeData.display_order] - Orden de visualización
     * @returns {Promise<Object>} Tipo de vehículo creado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * const newType = await vehicleTypesStore.createVehicleType({
     *   code: 'carro',
     *   name: 'Carro',
     *   emoji: '🚗',
     *   description: 'Vehículo tipo carro',
     *   display_order: 1
     * })
     * ```
     */
    async createVehicleType(vehicleTypeData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/vehicle-types', vehicleTypeData)
        const newVehicleType = response.data
        
        this.vehicleTypes.push(newVehicleType)
        this.pagination.total = this.vehicleTypes.length
        this.successMessage = 'Tipo de vehículo creado exitosamente'
        
        console.log('✅ Tipo de vehículo creado:', newVehicleType)
        return newVehicleType
      } catch (error) {
        console.error('❌ Error al crear tipo de vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al crear el tipo de vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE VEHICLE TYPE - Actualiza un tipo de vehículo existente
     * 
     * @param {number} vehicleTypeId - ID del tipo a actualizar
     * @param {Object} vehicleTypeData - Datos actualizados del tipo
     * @returns {Promise<Object>} Tipo de vehículo actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * const updated = await vehicleTypesStore.updateVehicleType(1, {
     *   name: 'Carro Sedán',
     *   display_order: 2
     * })
     * ```
     */
    async updateVehicleType(vehicleTypeId, vehicleTypeData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/vehicle-types/${vehicleTypeId}`, vehicleTypeData)
        const updatedVehicleType = response.data
        
        const index = this.vehicleTypes.findIndex(vt => vt.id === vehicleTypeId)
        if (index !== -1) {
          this.vehicleTypes[index] = updatedVehicleType
        }
        
        this.successMessage = 'Tipo de vehículo actualizado exitosamente'
        
        console.log('✅ Tipo de vehículo actualizado:', updatedVehicleType)
        return updatedVehicleType
      } catch (error) {
        console.error('❌ Error al actualizar tipo de vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el tipo de vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE VEHICLE TYPE - Activa/Desactiva un tipo de vehículo
     * 
     * @param {number} vehicleTypeId - ID del tipo de vehículo
     * @returns {Promise<Object>} Tipo de vehículo actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * await vehicleTypesStore.toggleVehicleType(1)
     * ```
     */
    async toggleVehicleType(vehicleTypeId) {
      const vehicleType = this.vehicleTypes.find(vt => vt.id === vehicleTypeId)
      if (!vehicleType) {
        throw new Error('Tipo de vehículo no encontrado')
      }
      
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        // Toggle: si está activo, Désactivar; si está inactivo, Activar
        const newStatus = !vehicleType.is_active
        
        const response = await api.post(`/vehicle-types/${vehicleTypeId}/toggle`, {
          is_active: newStatus
        })
        const updatedVehicleType = response.data
        
        const index = this.vehicleTypes.findIndex(vt => vt.id === vehicleTypeId)
        if (index !== -1) {
          this.vehicleTypes[index] = updatedVehicleType
        }
        
        this.successMessage = newStatus 
          ? 'Tipo de vehículo activado exitosamente'
          : 'Tipo de vehículo desactivado exitosamente'
        
        console.log('✅ Tipo de vehículo toggled:', updatedVehicleType)
        return updatedVehicleType
      } catch (error) {
        console.error('❌ Error al togglear tipo de vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar el estado del tipo de vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DELETE VEHICLE TYPE - Desactiva un tipo de vehículo (soft-delete)
     * 
     * @param {number} vehicleTypeId - ID del tipo a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehicleTypesStore = useVehicleTypesStore()
     * const success = await vehicleTypesStore.deleteVehicleType(1)
     * if (success) {
     *   console.log('Tipo desactivado')
     * }
     * ```
     */
    async deleteVehicleType(vehicleTypeId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/vehicle-types/${vehicleTypeId}`)
        
        // Actualizar el estado local
        const index = this.vehicleTypes.findIndex(vt => vt.id === vehicleTypeId)
        if (index !== -1) {
          this.vehicleTypes[index].is_active = false
        }
        
        this.successMessage = 'Tipo de vehículo desactivado exitosamente'
        
        console.log('✅ Tipo de vehículo desactivado:', vehicleTypeId)
        return true
      } catch (error) {
        console.error('❌ Error al desactivar tipo de vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al desactivar el tipo de vehículo'
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
     * @param {boolean} [filters.includeInactive] - Incluir inactivos
     */
    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      if (filters.includeInactive !== undefined) this.filters.includeInactive = filters.includeInactive
      
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
        includeInactive: false,
        search: '',
      }
      this.pagination.currentPage = 1
    }
  }
})