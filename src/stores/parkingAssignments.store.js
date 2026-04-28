/**
 * Store de Asignaciones de Parqueadero Mensual
 * 
 * Este store maneja las operaciones de asignación de parqueaderos mensuales.
 * Permite crear, listar, obtener, y cancelar asignaciones de parqueadero.
 * 
 * FUNCIONALIDADES:
 * - Listar todas las asignaciones de parqueadero
 * - Obtener una asignación por ID
 * - Crear nuevas asignaciones mensuales
 * - Cancelar asignaciones existentes
 * 
 * ESTRUCTURA DE UNA ASIGNACIÓN (MonthlyAssignmentRead):
 * - id: Identificador único
     * - spot_id: ID del espacio de parqueadero
   * - persona_id: ID de la persona asignataria
 * - start_date: Fecha de inicio
 * - months: Cantidad de meses (1-6)
 * - end_date: Fecha de fin
 * - vehicle_type: Tipo de vehículo (CARRO, MOTO, CICLA, etc.)
 * - vehicle_code: Placa o identificador del vehículo
 * - status: Estado (ACTIVE, CANCELLED, EXPIRED)
 * - monthly_price: Precio mensual
 * - total_price: Precio total
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /parking/assignments - Listar asignaciones
 * - GET /parking/assignments/:id - Obtener asignación por ID
 * - POST /parking/assignments - Crear nueva asignación
 * - POST /parking/assignments/:id/cancel - Cancelar asignación
 * 
 * PERMISOS REQUERIDOS:
 * - parking:read - Para listar y ver asignaciones
 * - parking:write - Para crear y cancelar asignaciones
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useParkingAssignmentsStore = defineStore('parking-assignments', {
  state: () => ({
    // Lista de todas las asignaciones
    assignments: [],
    
    // Asignación actual (para edición/detalle)
    currentAssignment: null,
    
    // Estado de carga
    loading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Paginación
    pagination: {
      limit: 10,
      offset: 0,
      total: 0,
    },
    
    // Filtros
    filters: {
      status: null,
      search: '',
    }
  }),

  getters: {
    /**
     * Verifica si el usuario actual es administrador
     * @returns {boolean} true si es admin
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
     * Obtiene la lista de asignaciones formateada para mostrar
     * @returns {Array} Lista de asignaciones con información formateada
     */
    assignmentsList: (state) => {
      return state.assignments.map(assignment => ({
        ...assignment,
        statusText: assignment.status === 'ACTIVE' ? 'Activa' : 
                    assignment.status === 'CANCELLED' ? 'Cancelada' : 'Expirada',
        statusClass: assignment.status === 'ACTIVE' ? 'text-emerald-500' : 
                     assignment.status === 'CANCELLED' ? 'text-red-500' : 'text-gray-500',
        statusBadgeClass: assignment.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 
                          assignment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800',
        vehicleTypeLabel: assignment.vehicle_type === 'CARRO' ? 'Carro' :
                         assignment.vehicle_type === 'MOTO' ? 'Motocicleta' :
                         assignment.vehicle_type === 'CICLA' ? 'Bicicleta' :
                         assignment.vehicle_type === 'CICLA_ELECTRICA' ? 'Bicicleta Eléctrica' :
                         assignment.vehicle_type === 'PATINETA_ELECTRICA' ? 'Patineta Eléctrica' :
                         assignment.vehicle_type || 'N/A',
      }))
    },

    /**
     * Obtiene asignaciones filtradas según criterios de búsqueda
     * @returns {Array} Lista de asignaciones filtradas
     */
    filteredAssignments: (state) => {
      let filtered = [...state.assignments]
      
      // Filtrar por búsqueda (persona_id, vehicle_code)
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(assignment => 
          assignment.persona_id?.toString().toLowerCase().includes(searchLower) ||
          assignment.vehicle_code?.toLowerCase().includes(searchLower) ||
          assignment.spot_id?.toString().includes(searchLower)
        )
      }
      
      // Filtrar por estado
      if (state.filters.status) {
        filtered = filtered.filter(assignment => assignment.status === state.filters.status)
      }
      
      return filtered
    },

    /**
     * Obtiene asignaciones paginadas
     * @returns {Array} Lista de asignaciones para la página actual
     */
    paginatedAssignments: (state) => {
      const filtered = state.filteredAssignments
      const start = state.pagination.offset
      const end = start + state.pagination.limit
      return filtered.slice(start, end)
    },

    /**
     * Obtiene estadísticas de asignaciones
     * @returns {Object} Estadísticas de asignaciones
     */
    assignmentStats: (state) => {
      const total = state.assignments.length
      const active = state.assignments.filter(a => a.status === 'ACTIVE').length
      const cancelled = state.assignments.filter(a => a.status === 'CANCELLED').length
      const expired = state.assignments.filter(a => a.status === 'EXPIRED').length
      
      const totalRevenue = state.assignments
        .filter(a => a.status === 'ACTIVE')
        .reduce((sum, a) => sum + Number(a.total_price || 0), 0)
      
      return {
        total,
        active,
        cancelled,
        expired,
        totalRevenue,
      }
    },
  },

  actions: {
    /**
     * FETCH ASSIGNMENTS - Obtiene la lista de todas las asignaciones
     * @returns {Promise<void>}
     */
    async fetchAssignments() {
      this.loading = true
      this.error = null

      try {
        const params = {
          limit: 100,
          offset: 0,
        }
        
        const response = await api.get('/parking/assignments', { params })
        this.assignments = response.data
        this.pagination.total = this.assignments.length
        console.log('✅ Asignaciones cargadas:', this.assignments.length)
      } catch (error) {
        console.error('❌ Error al cargar asignaciones:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las asignaciones de parqueadero'
      } finally {
        this.loading = false
      }
    },

    /**
     * FETCH ASSIGNMENT BY ID - Obtiene una asignación por su ID
     * @param {number} assignmentId - ID de la asignación
     * @returns {Promise<Object>} Asignación encontrada
     */
    async fetchAssignmentById(assignmentId) {
      this.loading = true
      this.error = null

      try {
        const response = await api.get(`/parking/assignments/${assignmentId}`)
        const assignment = response.data
        
        // Actualizar en la lista si existe
        const index = this.assignments.findIndex(a => a.id === assignmentId)
        if (index !== -1) {
          this.assignments[index] = assignment
        }
        
        this.currentAssignment = assignment
        return assignment
      } catch (error) {
        console.error('❌ Error al obtener asignación:', error)
        this.error = error.response?.data?.detail || 'Error al obtener la asignación de parqueadero'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * CREATE ASSIGNMENT - Crea una nueva asignación mensual
     * @param {Object} assignmentData - Datos de la asignación
     * @param {number} assignmentData.spot_id - ID del espacio de parqueadero
     * @param {number} assignmentData.persona_id - ID de la persona
     * @param {string} assignmentData.start_date - Fecha de inicio (YYYY-MM-DD)
     * @param {number} assignmentData.months - Cantidad de meses (1-6)
     * @param {string} assignmentData.vehicle_type - Tipo de vehículo
     * @param {string} assignmentData.vehicle_code - Placa o identificador
     * @returns {Promise<Object>} Asignación creada
     */
    async createAssignment(assignmentData) {
      this.loading = true
      this.error = null
      this.successMessage = null

      try {
        // Preparar payload según MonthlyAssignmentCreate del backend
        const payload = {
          spot_id: assignmentData.spot_id,
          persona_id: assignmentData.persona_id,
          start_date: assignmentData.start_date,
          months: assignmentData.months,
          vehicle_type: assignmentData.vehicle_type,
          vehicle_code: assignmentData.vehicle_code,
        }
        
        const response = await api.post('/parking/assignments', payload)
        const newAssignment = response.data
        
        this.assignments.unshift(newAssignment)
        this.pagination.total = this.assignments.length
        this.successMessage = 'Asignación de parqueadero creada exitosamente'
        
        console.log('✅ Asignación creada:', newAssignment)
        return newAssignment
      } catch (error) {
        console.error('❌ Error al crear asignación:', error)
        const detail = error.response?.data?.detail
        this.error = typeof detail === 'string' ? detail : 'Error al crear la asignación de parqueadero'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * CANCEL ASSIGNMENT - Cancela una asignación existente
     * @param {number} assignmentId - ID de la asignación a cancelar
     * @returns {Promise<boolean>} true si se canceló correctamente
     */
    async cancelAssignment(assignmentId) {
      this.loading = true
      this.error = null
      this.successMessage = null

      try {
        await api.post(`/parking/assignments/${assignmentId}/cancel`)
        
        const index = this.assignments.findIndex(a => a.id === assignmentId)
        if (index !== -1) {
          this.assignments[index].status = 'CANCELLED'
        }
        
        this.successMessage = 'Asignación de parqueadero cancelada exitosamente'
        
        console.log('✅ Asignación cancelada:', assignmentId)
        return true
      } catch (error) {
        console.error('❌ Error al cancelar asignación:', error)
        this.error = error.response?.data?.detail || 'Error al cancelar la asignación de parqueadero'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * SET PAGINATION - Establece la paginación
     * @param {Object} pagination - Configuración de paginación
     */
    setPagination(pagination) {
      if (pagination.limit !== undefined) this.pagination.limit = pagination.limit
      if (pagination.offset !== undefined) this.pagination.offset = pagination.offset
    },

    /**
     * SET FILTERS - Establece los filtros de búsqueda
     * @param {Object} filters - Filtros a aplicar
     */
    setFilters(filters) {
      if (filters.status !== undefined) this.filters.status = filters.status
      if (filters.search !== undefined) this.filters.search = filters.search
      
      // Resetear offset cuando se aplican filtros
      this.pagination.offset = 0
    },

    /**
     * CLEAR FILTERS - Limpia todos los filtros
     */
    clearFilters() {
      this.filters = {
        status: null,
        search: '',
      }
      this.pagination.offset = 0
    },

    /**
     * CLEAR MESSAGES - Limpia los mensajes de error y éxito
     */
    clearMessages() {
      this.error = null
      this.successMessage = null
    },
  }
})