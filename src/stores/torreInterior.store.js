/**
 * Store de Torres/Interiores - Gestión de Torres e Interiores del Sistema
 *
 * Este store maneja todas las operaciones relacionadas con las torres e interiores
 * del conjunto residencial. Permite crear, leer, actualizar y desactivar
 * torres/interiores.
 *
 * FUNCIONALIDADES:
 * - Listar todas las torres/interiores
 * - Crear nuevas torres/interiores
 * - Actualizar torres/interiores existentes
 * - Desactivar torres/interiores
 * - Filtrar por estado (activos/inactivos)
 * - Búsqueda por número/letra
 *
 * ENDPOINTS DEL BACKEND:
 * - GET /torres-interiores - Listar todas las torres/interiores
 * - POST /torres-interiores - Crear nueva torre/interior
 * - PATCH /torres-interiores/:id - Actualizar torre/interior
 * - POST /torres-interiores/:id/deactivate - Desactivar torre/interior
 * - GET /torres-interiores/:id - Obtener torre/interior por ID
 * - GET /torres-interiores/:num_torre_interior/id - Obtener ID por número/letra
 *
 * ESTRUCTURA DE DATOS:
 * - id: number - ID único de la torre/interior
 * - t_numero_letra: string - Número o letra de la torre/interior
 * - is_active: boolean - Estado activo/inactivo
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useTorreInteriorStore = defineStore('torreInterior', {
  state: () => ({
    // Lista de todas las torres/interiores del sistema
    items: [],

    // Detalle actual
    current: null,

    // Cache para ID por número/letra
    idByNumCache: {},

    // Estado de carga
    loading: false,

    // Estado de carga para operaciones de formulario (crear/actualizar)
    isFormLoading: false,

    // Mensajes de error y éxito
    error: null,
    successMessage: null,

    // Tiempo para auto-limpiar mensajes (ms)
    messageTimeout: 5000,

    // Filtros y paginación
    filters: {
      search: '',
      status: null, // null = todos, true = activos, false = inactivos
      q: null,
      active_only: true,
      limit: 100,
      offset: 0,
    },

    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0,
    },

    // Opcional: para saber si ya cargaste al menos una vez
    loadedOnce: false,
  }),

  getters: {
    /**
     * Verifica si hay error
     * @returns {boolean} true si hay error
     */
    hasError: (state) => !!state.error,

    /**
     * Verifica si la lista está vacía después de cargar
     * @returns {boolean} true si está vacío
     */
    isEmpty: (state) => state.loadedOnce && state.items.length === 0,

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
     * Obtiene la lista de torres/interiores formateada para mostrar en tabla
     * @returns {Array} Lista de torres/interiores con información formateada
     */
    torreInteriorList: (state) => {
      return state.items.map(item => ({
        ...item,
        statusText: item.is_active ? 'Activo' : 'Inactivo',
        statusClass: item.is_active ? 'text-emerald-500' : 'text-red-500',
      }))
    },

    /**
     * Filtra torres/interiores según los criterios actuales
     * @returns {Array} Lista de torres/interiores filtrados
     */
    filteredTorreInteriors: (state) => {
      let filtered = [...state.items]

      // Filtrar por búsqueda
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(item =>
          item.t_numero_letra.toLowerCase().includes(searchLower)
        )
      }

      // Filtrar por estado
      if (state.filters.status !== null) {
        filtered = filtered.filter(item => item.is_active === state.filters.status)
      }

      return filtered
    },

    /**
     * Obtiene torres/interiores paginados
     * @returns {Array} Lista de torres/interiores para la página actual
     */
    paginatedTorreInteriors: (state) => {
      const filtered = state.filteredTorreInteriors
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredTorreInteriors.length / state.pagination.pageSize)
    },

    /**
     * Útil para mapear por id rápido
     * @returns {Map} Mapa de items por ID
     */
    byId: (state) => {
      const map = new Map()
      for (const it of state.items) map.set(it.id, it)
      return map
    },

    /**
     * Obtiene una torre/interior por su ID
     * @param {number} id - ID de la torre/interior
     * @returns {Object|null} Torre/interior encontrada o null
     */
    getById: (state) => (id) => {
      return state.items.find(item => item.id === id) || null
    },

    /**
     * Obtiene estadísticas de torres/interiores
     * @returns {Object} Estadísticas de torres/interiores
     */
    stats: (state) => {
      const total = state.items.length
      const active = state.items.filter(item => item.is_active).length
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
     * Normaliza errores de axios
     * @param {Error} err - Error de axios
     */
    _setError(err) {
      this.error =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Error desconocido'
    },

    /**
     * FETCH LIST - Obtiene la lista de todas las torres/interiores
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
     * const store = useTorreInteriorStore()
     * await store.fetchList({ active_only: true })
     * console.log(store.items)
     * ```
     */
    async fetchList(options = {}) {
      this.loading = true
      this.error = null

      try {
        const params = {
          active_only: options.active_only ?? this.filters.active_only,
          limit: options.limit ?? this.filters.limit,
          offset: options.offset ?? this.filters.offset,
        }

        if (options.q || this.filters.q) {
          params.q = options.q || this.filters.q
        }

        const response = await api.get('/torres-interiores', { params })
        this.items = response.data
        this.pagination.total = this.items.length
        this.loadedOnce = true
        console.log('✅ Torres/Interiores cargadas:', this.items.length)
        return response.data
      } catch (error) {
        console.error('❌ Error al cargar torres/interiores:', error)
        this._setError(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * FETCH TORRES/INTERIORES - Alias compatible para la vista y la documentación
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<void>}
     */
    async fetchTorresInteriores(options = {}) {
      return this.fetchList(options)
    },

    /**
     * CREATE TORRE INTERIOR - Alias compatible para la vista y la documentación
     * @param {Object} data - Datos de la torre/interior a crear
     * @returns {Promise<Object>} Torre/interior creada
     */
    async createTorreInterior(data) {
      return this.create(data)
    },

    /**
     * UPDATE TORRE INTERIOR - Alias compatible para la vista y la documentación
     * @param {number} id - ID de la torre/interior a actualizar
     * @param {Object} data - Datos actualizados
     * @returns {Promise<Object>} Torre/interior actualizada
     */
    async updateTorreInterior(id, data) {
      return this.update(id, data)
    },

    /**
     * DEACTIVATE TORRE INTERIOR - Alias compatible para la vista y la documentación
     * @param {number} id - ID de la torre/interior a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     */
    async deactivateTorreInterior(id) {
      return this.deactivate(id)
    },

    /**
     * CREATE TORRE INTERIOR - Crea una nueva torre/interior
     *
     * @param {Object} data - Datos de la torre/interior a crear
     * @param {string} data.t_numero_letra - Número o letra de la torre/interior
     * @returns {Promise<Object>} Torre/interior creada
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * const newItem = await store.create({
     *   t_numero_letra: 'A'
     * })
     * ```
     */
    async create(data) {
      this.isFormLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/torres-interiores', data)
        const newItem = response.data

        this.items.push(newItem)
        this.pagination.total = this.items.length
        this.successMessage = 'Torre/Interior creada exitosamente'
        this.autoClearMessages()

        console.log('✅ Torre/Interior creada:', newItem)
        return newItem
      } catch (error) {
        console.error('❌ Error al crear torre/interior:', error)
        this._setError(error)
        throw error
      } finally {
        this.isFormLoading = false
      }
    },

    /**
     * UPDATE TORRE INTERIOR - Actualiza una torre/interior existente
     *
     * @param {number} id - ID de la torre/interior a actualizar
     * @param {Object} data - Datos actualizados
     * @param {string} data.t_numero_letra - Número o letra de la torre/interior
     * @param {boolean} data.is_active - Estado activo/inactivo
     * @returns {Promise<Object>} Torre/interior actualizada
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * const updated = await store.update(1, {
     *   t_numero_letra: 'B'
     * })
     * ```
     */
    async update(id, data) {
      this.isFormLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/torres-interiores/${id}`, data)
        const updatedItem = response.data

        const index = this.items.findIndex(item => item.id === id)
        if (index !== -1) {
          this.items[index] = updatedItem
        }

        if (this.current?.id === id) {
          this.current = updatedItem
        }

        this.successMessage = 'Torre/Interior actualizada exitosamente'
        this.autoClearMessages()

        console.log('✅ Torre/Interior actualizada:', updatedItem)
        return updatedItem
      } catch (error) {
        console.error('❌ Error al actualizar torre/interior:', error)
        this._setError(error)
        throw error
      } finally {
        this.isFormLoading = false
      }
    },

    /**
     * DEACTIVATE TORRE INTERIOR - Desactiva una torre/interior
     *
     * @param {number} id - ID de la torre/interior a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * const success = await store.deactivate(1)
     * if (success) {
     *   console.log('Torre/Interior desactivada')
     * }
     * ```
     */
    async deactivate(id) {
      this.isFormLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.post(`/torres-interiores/${id}/deactivate`)

        const index = this.items.findIndex(item => item.id === Number(id))
        if (index !== -1) {
          this.items[index].is_active = false
        }

        if (this.current?.id === Number(id)) {
          this.current.is_active = false
        }

        this.successMessage = 'Torre/Interior desactivada exitosamente'
        this.autoClearMessages()

        console.log('✅ Torre/Interior desactivada:', id)
        return true
      } catch (error) {
        console.error('❌ Error al desactivar torre/interior:', error)
        this._setError(error)
        throw error
      } finally {
        this.isFormLoading = false
      }
    },

    /**
     * TOGGLE STATUS - Activa/Desactiva una torre/interior
     *
     * @param {number} id - ID de la torre/interior
     * @returns {Promise<Object>} Torre/interior actualizada
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * await store.toggleStatus(1)
     * ```
     */
    async toggleStatus(id) {
      const item = this.items.find(i => i.id === id)
      if (!item) {
        throw new Error('Torre/Interior no encontrada')
      }

      if (item.is_active) {
        // Si está activa, desactivar
        await this.deactivate(id)
      } else {
        // Si está inactiva, activar
        return await this.update(id, { is_active: true })
      }
    },

    /**
     * FETCH BY ID - Obtiene una torre/interior por su ID
     *
     * @param {number} id - ID de la torre/interior
     * @param {Object} options - Opciones
     * @param {boolean} options.useCache - Usar cache de la lista
     * @returns {Promise<Object>} Torre/interior encontrada
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * const item = await store.fetchById(1)
     * console.log(item)
     * ```
     */
    async fetchById(id, { useCache = true } = {}) {
      this.loading = true
      this.error = null

      try {
        // Cache simple desde items
        if (useCache) {
          const cached = this.items.find((x) => x.id === Number(id))
          if (cached) {
            this.current = cached
            return cached
          }
        }

        const response = await api.get(`/torres-interiores/${id}`)
        const item = response.data

        // Actualizar el item en la lista si existe
        const index = this.items.findIndex(i => i.id === item.id)
        if (index !== -1) {
          this.items[index] = item
        } else {
          this.items.unshift(item)
        }

        this.current = item

        return item
      } catch (error) {
        console.error('❌ Error al obtener torre/interior por ID:', error)
        this._setError(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * FETCH ID BY NUMERO LETRA - Obtiene el ID de una torre/interior por su número/letra
     *
     * @param {string} numTorreInterior - Número o letra de la torre/interior
     * @returns {Promise<number>} ID de la torre/interior
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const store = useTorreInteriorStore()
     * const id = await store.fetchIdByNum('A')
     * console.log(id)
     * ```
     */
    async fetchIdByNum(numTorreInterior) {
      this.loading = true
      this.error = null

      try {
        // Cache
        if (this.idByNumCache[numTorreInterior]) {
          return this.idByNumCache[numTorreInterior]
        }

        const response = await api.get(`/torres-interiores/${encodeURIComponent(numTorreInterior)}/id`)
        const data = response.data
        this.idByNumCache[numTorreInterior] = data
        return data
      } catch (error) {
        console.error('❌ Error al obtener ID de torre/interior:', error)
        this._setError(error)
        throw error
      } finally {
        this.loading = false
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
     * const store = useTorreInteriorStore()
     * store.setFilters({ search: 'A', status: true })
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
     * const store = useTorreInteriorStore()
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
     * const store = useTorreInteriorStore()
     * store.clearFilters()
     * ```
     */
    clearFilters() {
      this.filters = {
        search: '',
        status: null,
        q: null,
        active_only: true,
        limit: 100,
        offset: 0,
      }
      this.pagination.currentPage = 1
    },

    /**
     * CLEAR CURRENT - Limpia el detalle actual
     */
    clearCurrent() {
      this.current = null
    },

    /**
     * CLEAR ERROR - Limpia el error actual
     */
    clearError() {
      this.error = null
    },

    /**
     * AUTO CLEAR MESSAGES - Limpia los mensajes automáticamente después de un tiempo
     */
    autoClearMessages() {
      setTimeout(() => {
        this.clearMessages()
      }, this.messageTimeout)
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