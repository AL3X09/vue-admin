/**
 * Store de Casas/Apartamentos - Gestión de Casas y Apartamentos del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con las casas y apartamentos
 * del conjunto residencial. Permite crear, leer, actualizar y desactivar
 * casas/apartamentos.
 * 
 * FUNCIONALIDADES:
 * - Listar todas las casas/apartamentos
 * - Crear nuevas casas/apartamentos
 * - Actualizar casas/apartamentos existentes
 * - Desactivar casas/apartamentos
 * - Filtrar por estado (activos/inactivos)
 * - Búsqueda por número/letra
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /casas-apartamentos - Listar todas las casas/apartamentos
 * - POST /casas-apartamentos - Crear nueva casa/apartamento
 * - PATCH /casas-apartamentos/:id - Actualizar casa/apartamento
 * - POST /casas-apartamentos/:id/deactivate - Desactivar casa/apartamento
 * - GET /casas-apartamentos/:id - Obtener casa/apartamento por ID
 * - GET /casas-apartamentos/:c_numero_letra/id - Obtener ID por número/letra
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

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useCasasApartamentosStore = defineStore('casasApartamentos', {
  state: () => ({
    // Lista de todas las casas/apartamentos del sistema
    casasApartamentos: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      search: '',
      status: null, // null = todos, true = activos, false = inactivos
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
     * Obtiene la lista de casas/apartamentos formateada para mostrar en tabla
     * @returns {Array} Lista de casas/apartamentos con información formateada
     */
    casasApartamentosList: (state) => {
      return state.casasApartamentos.map(item => ({
        ...item,
        statusText: item.is_active ? 'Activo' : 'Inactivo',
        statusClass: item.is_active ? 'text-emerald-500' : 'text-red-500',
      }))
    },

    /**
     * Filtra casas/apartamentos según los criterios actuales
     * @returns {Array} Lista de casas/apartamentos filtrados
     */
    filteredCasasApartamentos: (state) => {
      let filtered = [...state.casasApartamentos]
      
      // Filtrar por búsqueda
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(item => 
          item.c_numero_letra.toLowerCase().includes(searchLower)
        )
      }
      
      // Filtrar por estado
      if (state.filters.status !== null) {
        filtered = filtered.filter(item => item.is_active === state.filters.status)
      }
      
      return filtered
    },

    /**
     * Obtiene casas/apartamentos paginados
     * @returns {Array} Lista de casas/apartamentos para la página actual
     */
    paginatedCasasApartamentos: (state) => {
      const filtered = state.filteredCasasApartamentos
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredCasasApartamentos.length / state.pagination.pageSize)
    },

    /**
     * Obtiene una casa/apartamento por su ID
     * @param {number} id - ID de la casa/apartamento
     * @returns {Object|null} Casa/apartamento encontrada o null
     */
    getById: (state) => (id) => {
      return state.casasApartamentos.find(item => item.id === id) || null
    },

    /**
     * Obtiene estadísticas de casas/apartamentos
     * @returns {Object} Estadísticas de casas/apartamentos
     */
    stats: (state) => {
      const total = state.casasApartamentos.length
      const active = state.casasApartamentos.filter(item => item.is_active).length
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
     * FETCH CASAS APARTAMENTOS - Obtiene la lista de todas las casas/apartamentos
     * 
     * @param {Object} options - Opciones de filtrado
     * @param {string} options.q - Texto de búsqueda
     * @param {boolean} options.active_only - Filtrar solo activos
     * @param {number} options.limit - Límite de resultados
     * @param {number} options.offset - Offset para paginación
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * await store.fetchCasasApartamentos({ active_only: true })
     * console.log(store.casasApartamentos)
     * ```
     */
    async fetchCasasApartamentos(options = {}) {
      this.isLoading = true
      this.error = null

      try {
        const params = {
          active_only: options.active_only ?? true,
          limit: options.limit ?? 100,
          offset: options.offset ?? 0,
        }
        
        if (options.q) {
          params.q = options.q
        }

        const response = await api.get('/casas-apartamentos', { params })
        this.casasApartamentos = response.data
        this.pagination.total = this.casasApartamentos.length
        console.log('✅ Casas/Apartamentos cargados:', this.casasApartamentos.length)
      } catch (error) {
        console.error('❌ Error al cargar casas/apartamentos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las casas/apartamentos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE CASA APARTAMENTO - Crea una nueva casa/apartamento
     * 
     * @param {Object} data - Datos de la casa/apartamento a crear
     * @param {string} data.c_numero_letra - Número o letra de la casa/apartamento
     * @returns {Promise<Object>} Casa/apartamento creada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * const newItem = await store.createCasaApartamento({
     *   c_numero_letra: '101'
     * })
     * ```
     */
    async createCasaApartamento(data) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/casas-apartamentos', data)
        const newItem = response.data
        
        this.casasApartamentos.push(newItem)
        this.pagination.total = this.casasApartamentos.length
        this.successMessage = 'Casa/Apartamento creada exitosamente'
        
        console.log('✅ Casa/Apartamento creada:', newItem)
        return newItem
      } catch (error) {
        console.error('❌ Error al crear casa/apartamento:', error)
        this.error = error.response?.data?.detail || 'Error al crear la casa/apartamento'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE CASA APARTAMENTO - Actualiza una casa/apartamento existente
     * 
     * @param {number} id - ID de la casa/apartamento a actualizar
     * @param {Object} data - Datos actualizados
     * @param {string} data.c_numero_letra - Número o letra de la casa/apartamento
     * @param {boolean} data.is_active - Estado activo/inactivo
     * @returns {Promise<Object>} Casa/apartamento actualizada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * const updated = await store.updateCasaApartamento(1, {
     *   c_numero_letra: '102'
     * })
     * ```
     */
    async updateCasaApartamento(id, data) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/casas-apartamentos/${id}`, data)
        const updatedItem = response.data
        
        const index = this.casasApartamentos.findIndex(item => item.id === id)
        if (index !== -1) {
          this.casasApartamentos[index] = updatedItem
        }
        
        this.successMessage = 'Casa/Apartamento actualizada exitosamente'
        
        console.log('✅ Casa/Apartamento actualizada:', updatedItem)
        return updatedItem
      } catch (error) {
        console.error('❌ Error al actualizar casa/apartamento:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar la casa/apartamento'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DEACTIVATE CASA APARTAMENTO - Desactiva una casa/apartamento
     * 
     * @param {number} id - ID de la casa/apartamento a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * const success = await store.deactivateCasaApartamento(1)
     * if (success) {
     *   console.log('Casa/Apartamento desactivada')
     * }
     * ```
     */
    async deactivateCasaApartamento(id) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.post(`/casas-apartamentos/${id}/deactivate`)
        
        const index = this.casasApartamentos.findIndex(item => item.id === id)
        if (index !== -1) {
          this.casasApartamentos[index].is_active = false
        }
        
        this.successMessage = 'Casa/Apartamento desactivada exitosamente'
        
        console.log('✅ Casa/Apartamento desactivada:', id)
        return true
      } catch (error) {
        console.error('❌ Error al desactivar casa/apartamento:', error)
        this.error = error.response?.data?.detail || 'Error al desactivar la casa/apartamento'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE STATUS - Activa/Desactiva una casa/apartamento
     * 
     * @param {number} id - ID de la casa/apartamento
     * @returns {Promise<Object>} Casa/apartamento actualizada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * await store.toggleStatus(1)
     * ```
     */
    async toggleStatus(id) {
      const item = this.casasApartamentos.find(i => i.id === id)
      if (!item) {
        throw new Error('Casa/Apartamento no encontrada')
      }
      
      if (item.is_active) {
        // Si está activa, desactivar
        await this.deactivateCasaApartamento(id)
      } else {
        // Si está inactiva, activar
        return await this.updateCasaApartamento(id, { is_active: true })
      }
    },

    /**
     * FETCH BY ID - Obtiene una casa/apartamento por su ID
     * 
     * @param {number} id - ID de la casa/apartamento
     * @returns {Promise<Object>} Casa/apartamento encontrada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * const item = await store.fetchById(1)
     * console.log(item)
     * ```
     */
    async fetchById(id) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/casas-apartamentos/${id}`)
        const item = response.data

        // Actualizar el item en la lista si existe
        const index = this.casasApartamentos.findIndex(i => i.id === id)
        if (index !== -1) {
          this.casasApartamentos[index] = item
        }

        return item
      } catch (error) {
        console.error('❌ Error al obtener casa/apartamento por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener casa/apartamento'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH ID BY NUMERO LETRA - Obtiene el ID de una casa/apartamento por su número/letra
     * 
     * @param {string} cNumeroLetra - Número o letra de la casa/apartamento
     * @returns {Promise<number>} ID de la casa/apartamento
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * const id = await store.fetchIdByNumeroLetra('101')
     * console.log(id)
     * ```
     */
    async fetchIdByNumeroLetra(cNumeroLetra) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/casas-apartamentos/${cNumeroLetra}/id`)
        return response.data
      } catch (error) {
        console.error('❌ Error al obtener ID de casa/apartamento:', error)
        this.error = error.response?.data?.detail || 'Error al obtener ID de casa/apartamento'
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
     * @param {boolean|null} filters.status - Estado (null = todos, true = activos, false = inactivos)
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * store.setFilters({ search: '101', status: true })
     * ```
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.currentPage = 1 // Resetear a la primera página
    },

    /**
     * SET PAGE - Establece la página actual
     * 
     * @param {number} page - Número de página
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * store.setPage(2)
     * ```
     */
    setPage(page) {
      this.pagination.currentPage = page
    },

    /**
     * CLEAR FILTERS - Limpia todos los filtros
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useCasasApartamentosStore()
     * store.clearFilters()
     * ```
     */
    clearFilters() {
      this.filters = {
        search: '',
        status: null,
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
