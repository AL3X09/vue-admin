/**
 * Store de Vehículos - Gestión de Vehículos del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con los vehículos
 * del sistema de parqueadero. Permite crear, leer, actualizar y desactivar vehículos.
 * 
 * FUNCIONALIDADES:
 * - Listar todos los vehículos con filtros
 * - Crear nuevos vehículos
 * - Actualizar vehículos existentes
 * - Desactivar vehículos
 * - Filtrar por persona o tipo de vehículo
 * - Búsqueda por placa
 * 
 * ESTRUCTURA DE UN VEHÍCULO:
 * - id: Identificador único
 * - persona_id: ID de la persona propietario
 * - vehicle_type_id: ID del tipo de vehículo
 * - placa_code: Placa única del vehículo
 * - is_active: Si el vehículo está activo
 * - created_at: Fecha de creación
 * - updated_at: Fecha de actualización
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /vehicles - Listar todos los vehículos
 * - GET /vehicles/active - Listar solo activos
 * - GET /vehicles/:id - Obtener un vehículo por ID
 * - POST /vehicles - Crear nuevo vehículo
 * - PATCH /vehicles/:id - Actualizar vehículo
 * - POST /vehicles/:id/toggle - Activar/Desactivar vehículo
 * - DELETE /vehicles/:id - Desactivar vehículo (soft-delete)
 * 
 * PERMISOS REQUERIDOS:
 * - parking:read - Para listar y ver vehículos
 * - parking:write - Para crear, actualizar y desactivar vehículos
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useVehiclesStore = defineStore('vehicles', {
  state: () => ({
    // Lista de todos los vehículos del sistema
    vehicles: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      search: '',
      personaId: null,
      vehicleTypeId: null,
      includeInactive: false,
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
     * Obtiene la lista de vehículos formateada para mostrar en tabla
     * @returns {Array} Lista de vehículos con información formateada
     */
    vehiclesList: (state) => {
      return (state.vehicles || []).map(vehicle => ({
        ...vehicle,
        statusText: vehicle.is_active ? 'Activo' : 'Inactivo',
        statusClass: vehicle.is_active ? 'text-emerald-500' : 'text-red-500',
      }))
    },

    /**
     * Filtra vehículos según los criterios actuales
     * @returns {Array} Lista de vehículos filtrados
     */
    filteredVehicles: (state) => {
      let filtered = [...(state.vehicles || [])]
      
      // Filtrar por búsqueda (placa)
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(vehicle => 
          vehicle.placa_code?.toLowerCase().includes(searchLower)
        )
      }
      
      // Filtrar por persona
      if (state.filters.personaId !== null) {
        filtered = filtered.filter(vehicle => vehicle.persona_id === state.filters.personaId)
      }
      
      // Filtrar por tipo de vehículo
      if (state.filters.vehicleTypeId !== null) {
        filtered = filtered.filter(vehicle => vehicle.vehicle_type_id === state.filters.vehicleTypeId)
      }
      
      // Filtrar por estado activo (si no se incluyen inactivos)
      if (!state.filters.includeInactive) {
        filtered = filtered.filter(vehicle => vehicle.is_active === true)
      }
      
      return filtered
    },

    /**
     * Obtiene vehículos paginadas
     * @returns {Array} Lista de vehículos para la página actual
     */
    paginatedVehicles: (state) => {
      const filtered = state.filteredVehicles
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredVehicles.length / state.pagination.pageSize)
    },

    /**
     * Obtiene un vehículo por su ID
     * @param {number} vehicleId - ID del vehículo
     * @returns {Object|null} Vehículo encontrado o null
     */
    getVehicleById: (state) => (vehicleId) => {
      return state.vehicles.find(vehicle => vehicle.id === vehicleId) || null
    },

    /**
     * Obtiene estadísticas de vehículos
     * @returns {Object} Estadísticas de vehículos
     */
    vehicleStats: (state) => {
      const total = state.vehicles.length
      const active = state.vehicles.filter(v => v.is_active).length
      const inactive = total - active
      
      return {
        total,
        active,
        inactive,
      }
    }
  },

  actions: {
    /**
     * FETCH VEHICLES - Obtiene la lista de todos los vehículos
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * await vehiclesStore.fetchVehicles()
     * console.log(vehiclesStore.vehicles)
     * ```
     */
    async fetchVehicles() {
      this.isLoading = true
      this.error = null

      try {
        const params = {
          include_inactive: this.filters.includeInactive,
        }
        
        if (this.filters.personaId !== null) {
          params.persona_id = this.filters.personaId
        }
        
        if (this.filters.vehicleTypeId !== null) {
          params.vehicle_type_id = this.filters.vehicleTypeId
        }
        
        if (this.filters.search) {
          // El backend usa placa_code, usamos search como filtro
          params.placa_like = this.filters.search
        }
        
        const response = await api.get('/vehicles', { params })
        this.vehicles = response.data
        this.pagination.total = this.vehicles.length
        console.log('✅ Vehículos cargados:', this.vehicles.length)
      } catch (error) {
        console.error('❌ Error al cargar vehículos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar los vehículos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH VEHICLE BY ID - Obtiene un vehículo por su ID
     * 
     * @param {number} vehicleId - ID del vehículo
     * @returns {Promise<Object>} Vehículo encontrado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * const vehicle = await vehiclesStore.fetchVehicleById(1)
     * console.log(vehicle)
     * ```
     */
    async fetchVehicleById(vehicleId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/vehicles/${vehicleId}`)
        const vehicle = response.data
        
        // Actualizar el vehículo en la lista si existe
        const index = this.vehicles.findIndex(v => v.id === vehicleId)
        if (index !== -1) {
          this.vehicles[index] = vehicle
        }
        
        return vehicle
      } catch (error) {
        console.error('❌ Error al obtener vehículo por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE VEHICLE - Crea un nuevo vehículo
     * 
     * @param {Object} vehicleData - Datos del vehículo a crear
     * @param {number} vehicleData.persona_id - ID de la persona propietario (obligatorio)
     * @param {number} vehicleData.vehicle_type_id - ID del tipo de vehículo (obligatorio)
     * @param {string} vehicleData.placa_code - Placa única del vehículo (obligatorio)
     * @returns {Promise<Object>} Vehículo creado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * const newVehicle = await vehiclesStore.createVehicle({
     *   persona_id: 1,
     *   vehicle_type_id: 1,
     *   placa_code: 'ABC123'
     * })
     * ```
     */
    async createVehicle(vehicleData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/vehicles', vehicleData)
        const newVehicle = response.data
        
        this.vehicles.push(newVehicle)
        this.pagination.total = this.vehicles.length
        this.successMessage = 'Vehículo creado exitosamente'
        
        console.log('✅ Vehículo creado:', newVehicle)
        return newVehicle
      } catch (error) {
        console.error('❌ Error al crear vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al crear el vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE VEHICLE - Actualiza un vehículo existente
     * 
     * @param {number} vehicleId - ID del vehículo a actualizar
     * @param {Object} vehicleData - Datos actualizados del vehículo
     * @returns {Promise<Object>} Vehículo actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * const updated = await vehiclesStore.updateVehicle(1, {
     *   placa_code: 'XYZ987'
     * })
     * ```
     */
    async updateVehicle(vehicleId, vehicleData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/vehicles/${vehicleId}`, vehicleData)
        const updatedVehicle = response.data
        
        const index = this.vehicles.findIndex(v => v.id === vehicleId)
        if (index !== -1) {
          this.vehicles[index] = updatedVehicle
        }
        
        this.successMessage = 'Vehículo actualizado exitosamente'
        
        console.log('✅ Vehículo actualizado:', updatedVehicle)
        return updatedVehicle
      } catch (error) {
        console.error('❌ Error al actualizar vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE VEHICLE - Activa/Desactiva un vehículo
     * 
     * @param {number} vehicleId - ID del vehículo
     * @returns {Promise<Object>} Vehículo actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * await vehiclesStore.toggleVehicle(1)
     * ```
     */
    async toggleVehicle(vehicleId) {
      const vehicle = this.vehicles.find(v => v.id === vehicleId)
      if (!vehicle) {
        throw new Error('Vehículo no encontrado')
      }
      
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        // Toggle: si está activo, Désactivar; si está inactivo, Activar
        const newStatus = !vehicle.is_active
        
        const response = await api.post(`/vehicles/${vehicleId}/toggle`, {
          is_active: newStatus
        })
        const updatedVehicle = response.data
        
        const index = this.vehicles.findIndex(v => v.id === vehicleId)
        if (index !== -1) {
          this.vehicles[index] = updatedVehicle
        }
        
        this.successMessage = newStatus 
          ? 'Vehículo activado exitosamente'
          : 'Vehículo desactivado exitosamente'
        
        console.log('✅ Vehículo toggled:', updatedVehicle)
        return updatedVehicle
      } catch (error) {
        console.error('❌ Error al togglear vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar el estado del vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DELETE VEHICLE - Desactiva un vehículo (soft-delete)
     * 
     * @param {number} vehicleId - ID del vehículo a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const vehiclesStore = useVehiclesStore()
     * const success = await vehiclesStore.deleteVehicle(1)
     * if (success) {
     *   console.log('Vehículo desactivado')
     * }
     * ```
     */
    async deleteVehicle(vehicleId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/vehicles/${vehicleId}`)
        
        // Actualizar el estado local
        const index = this.vehicles.findIndex(v => v.id === vehicleId)
        if (index !== -1) {
          this.vehicles[index].is_active = false
        }
        
        this.successMessage = 'Vehículo desactivado exitosamente'
        
        console.log('✅ Vehículo desactivado:', vehicleId)
        return true
      } catch (error) {
        console.error('❌ Error al desactivar vehículo:', error)
        this.error = error.response?.data?.detail || 'Error al desactivar el vehículo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * SET FILTERS - Establece los filtros de búsqueda
     * 
     * @param {Object} filters - Filtros a aplicar
     * @param {string} [filters.search] - Texto de búsqueda (placa)
     * @param {number|null} [filters.personaId] - Filtrar por persona
     * @param {number|null} [filters.vehicleTypeId] - Filtrar por tipo de vehículo
     * @param {boolean} [filters.includeInactive] - Incluir inactivos
     */
    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      if (filters.personaId !== undefined) this.filters.personaId = filters.personaId
      if (filters.vehicleTypeId !== undefined) this.filters.vehicleTypeId = filters.vehicleTypeId
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
        search: '',
        personaId: null,
        vehicleTypeId: null,
        includeInactive: false,
      }
      this.pagination.currentPage = 1
    }
  }
})