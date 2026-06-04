/**
 * Store de Casa Interior Links - Gestión de Vínculos Casa-Interior
 *
 * Este store maneja todas las operaciones relacionadas con los vínculos
 * entre casas/apartamentos y torres/interiores del conjunto residencial.
 *
 * FUNCIONALIDADES:
 * - Listar todos los vínculos con filtros y paginación
 * - Crear nuevos vínculos
 * - Actualizar vínculos existentes
 * - Desactivar vínculos
 * - Obtener vínculos por ID
 * - Filtrar por casa/apartamento, torre/interior y estado
 * - Búsqueda de ID de relación por pareja con caché avanzado
 * - Cache inteligente con TTL para optimizar peticiones
 *
 * ENDPOINTS DEL BACKEND:
 * - GET /casa-interior-links - Listar vínculos (con filtros opcionales)
 * - GET /casa-interior-links/:id - Obtener vínculo por ID
 * - POST /casa-interior-links - Crear nuevo vínculo
 * - PATCH /casa-interior-links/:id - Actualizar vínculo
 * - POST /casa-interior-links/:id/deactivate - Desactivar vínculo
 * - GET /casa-interior-links/torrecasa/id - Obtener ID de relación
 *
 * PERMISOS REQUERIDOS:
 * - house_interior_link:read - Para leer vínculos
 * - house_interior_link:write - Para crear/editar/desactivar vínculos
 */

// Funciones auxiliares
/** Construye la clave de cache para la combinación apto|torre */
function buildPairKey(casaApartamentoId, torreInteriorId) {
  return `${Number(casaApartamentoId)}|${Number(torreInteriorId)}`
}

/** Normaliza un ID que puede venir como number, string o objeto */
function normalizeId(maybe) {
  if (maybe == null) return null
  if (typeof maybe === 'object') {
    const raw = (maybe.id != null) ? maybe.id : (maybe.value != null ? maybe.value : null)
    if (raw == null) return null
    const n = Number(raw)
    return Number.isNaN(n) ? null : n
  }
  const n = Number(maybe)
  return Number.isNaN(n) ? null : n
}

/** Extrae el ID de la relación desde distintos formatos de respuesta */
function parseRelacionId(data) {
  if (!data) return null
  if (Array.isArray(data)) return data[0]?.id ?? null
  if (data?.results && Array.isArray(data.results)) return data.results[0]?.id ?? null
  if (typeof data === 'object' && 'id' in data) return data.id ?? null
  if (typeof data === 'number') return data
  return null
}

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useCasaInteriorLinksStore = defineStore('casaInteriorLinks', {
  state: () => ({
    // Lista de todos los vínculos casa-interior
    links: [],

    // Detalle actual del vínculo
    current: null,

    // Estados de carga
    isLoading: false,
    loadedOnce: false,

    // Mensajes de error y éxito
    error: null,
    successMessage: null,

    // Filtros y paginación
    filters: {
      casa_apartamento_id: null,
      torre_interior_id: null,
      status: null,
      is_active: null,
      active_only: true,
      limit: 100,
      offset: 0,
    },

    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0,
    },

    // Cache de vínculos por ID
    byIdCache: {},

    // Cache de parejas (apto|torre): { id: number|null, ts: epochMs }
    pairCache: {},

    // Control de peticiones en vuelo por combinación
    controllers: {},

    // TTL de cache (ms) para pairCache. Default 5 minutos
    ttlMs: 5 * 60 * 1000,

    // Opciones de estado para filtros (basadas en enum ApartmentStatus)
    statusOptions: [
      { id: 'en_propiedad', label: 'En Propiedad', value: 'en_propiedad' },
      { id: 'en_arriendo', label: 'En Arriendo', value: 'en_arriendo' },
      { id: 'deshabitado', label: 'Deshabitado', value: 'deshabitado' },
    ],

    // Opciones de estado activo/inactivo
    activeStatusOptions: [
      { id: true, label: 'Activo', value: true },
      { id: false, label: 'Inactivo', value: false },
    ],
  }),

  getters: {
    /**
     * Verifica si hay error
     * @returns {boolean} true si hay error
     */
    hasError: (state) => !!state.error,

    /**
     * Verifica si la lista está vacía
     * @returns {boolean} true si está vacía y ya se cargó al menos una vez
     */
    isEmpty: (state) => state.loadedOnce && state.links.length === 0,

    /**
     * Verifica si el usuario actual tiene permisos de lectura
     * @returns {boolean} true si tiene permisos de lectura
     */
    canRead: () => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated
    },

    /**
     * Verifica si el usuario actual tiene permisos de escritura
     * @returns {boolean} true si tiene permisos de escritura
     */
    canWrite: () => {
      const authStore = useAuthStore()
      // Usar el getter isAdmin del authStore
      return authStore.isAdmin ||
             authStore.user?.permissions?.includes('house_interior_link:write')
    },

    /**
     * Construye un Map con prioridad al cache por id
     * @returns {Map} Mapa de vínculos por ID
     */
    byId: (state) => {
      const map = new Map()
      for (const it of state.links) map.set(it.id, it)
      for (const [id, obj] of Object.entries(state.byIdCache)) {
        map.set(Number(id), obj)
      }
      return map
    },

    /**
     * Obtiene la lista de vínculos formateada para mostrar en tabla
     * @returns {Array} Lista de vínculos con información formateada
     */
    linksList: (state) => {
      return state.links.map(link => ({
        ...link,
        statusText: link.status === 'en_propiedad' ? 'En Propiedad' :
                   link.status === 'en_arriendo' ? 'En Arriendo' : 'Deshabitado',
        statusClass: link.status === 'en_propiedad' ? 'text-emerald-500' :
                    link.status === 'en_arriendo' ? 'text-blue-500' : 'text-gray-500',
        isActiveText: link.is_active ? 'Activo' : 'Inactivo',
        isActiveClass: link.is_active ? 'text-emerald-500' : 'text-red-500',
        createdAtFormatted: link.created_at ? new Date(link.created_at).toLocaleDateString('es-CO') : 'N/A',
        updatedAtFormatted: link.updated_at ? new Date(link.updated_at).toLocaleDateString('es-CO') : 'N/A',
      }))
    },

    /**
     * Filtra vínculos según los criterios actuales
     * @returns {Array} Lista de vínculos filtrados
     */
    filteredLinks: (state) => {
      let filtered = [...state.links]

      // Filtrar por casa/apartamento
      if (state.filters.casa_apartamento_id) {
        filtered = filtered.filter(link =>
          link.casa_apartamento_id === state.filters.casa_apartamento_id
        )
      }

      // Filtrar por torre/interior
      if (state.filters.torre_interior_id) {
        filtered = filtered.filter(link =>
          link.torre_interior_id === state.filters.torre_interior_id
        )
      }

      // Filtrar por estado
      if (state.filters.status) {
        filtered = filtered.filter(link => link.status === state.filters.status)
      }

      // Filtrar por is_active
      if (state.filters.is_active !== null) {
        filtered = filtered.filter(link => link.is_active === state.filters.is_active)
      }

      // Filtrar solo activos (is_active = true)
      if (state.filters.active_only) {
        filtered = filtered.filter(link => link.is_active === true)
      }

      return filtered
    },

    /**
     * Obtiene vínculos paginados con campos formateados
     * @returns {Array} Lista de vínculos para la página actual con campos formateados
     */
    paginatedLinks: (state) => {
      const filtered = state.filteredLinks
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      const paginated = filtered.slice(start, end)

      // Aplicar formateo a los vínculos paginados
      return paginated.map(link => ({
        ...link,
        statusText: link.status === 'en_propiedad' ? 'En Propiedad' :
                   link.status === 'en_arriendo' ? 'En Arriendo' : 'Deshabitado',
        statusClass: link.status === 'en_propiedad' ? 'text-emerald-500' :
                    link.status === 'en_arriendo' ? 'text-blue-500' : 'text-gray-500',
        isActiveText: link.is_active ? 'Activo' : 'Inactivo',
        isActiveClass: link.is_active ? 'text-emerald-500' : 'text-red-500',
        createdAtFormatted: link.created_at ? new Date(link.created_at).toLocaleDateString('es-CO') : 'N/A',
        updatedAtFormatted: link.updated_at ? new Date(link.updated_at).toLocaleDateString('es-CO') : 'N/A',
      }))
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredLinks.length / state.pagination.pageSize)
    },

    /**
     * Obtiene un vínculo por su ID
     * @param {number} linkId - ID del vínculo
     * @returns {Object|null} Vínculo encontrado o null
     */
    getLinkById: (state) => (linkId) => {
      return state.links.find(link => link.id === linkId) || null
    },

    /**
     * Obtiene estadísticas de vínculos
     * @returns {Object} Estadísticas de vínculos
     */
    linkStats: (state) => {
      const total = state.links.length
      const active = state.links.filter(l => l.is_active === true).length
      const inactive = state.links.filter(l => l.is_active === false).length
      const enPropiedad = state.links.filter(l => l.status === 'en_propiedad').length
      const enArriendo = state.links.filter(l => l.status === 'en_arriendo').length
      const deshabitado = state.links.filter(l => l.status === 'deshabitado').length

      return {
        total,
        active,
        inactive,
        enPropiedad,
        enArriendo,
        deshabitado
      }
    }
  },

  actions: {
    /**
     * FETCH LINKS - Obtiene la lista de todos los vínculos
     *
     * @param {Object} customParams - Parámetros personalizados de filtrado
     * @returns {Promise<Array>} Lista de vínculos
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * await linksStore.fetchLinks({ active_only: true })
     * console.log(linksStore.links)
     * ```
     */
    async fetchLinks(customParams = {}) {
      this.isLoading = true
      this.error = null
      try {
        const params = { ...this.filters, ...customParams }
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== null && v !== undefined)
        )

        const { data } = await api.get('/casa-interior-links', { params: cleanParams })

        // Si tu backend responde paginado {results, count, next, previous}, ajusta:
        const list = Array.isArray(data) ? data : (data.results ?? [])
        this.links = list
        this.pagination.total = this.links.length

        // Sincroniza byIdCache
        for (const it of this.links) this.byIdCache[it.id] = it

        this.loadedOnce = true
        console.log('✅ Vínculos casa-interior cargados:', this.links.length)
        return this.links
      } catch (err) {
        console.error('❌ Error al cargar vínculos:', err)
        this._setError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH LINK BY ID - Obtiene un vínculo específico por su ID
     * 
     * @param {number} linkId - ID del vínculo a obtener
     * @returns {Promise<Object>} Vínculo obtenido
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * const link = await linksStore.fetchLinkById(1)
     * console.log(link)
     * ```
     */
    async fetchLinkById(linkId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/casa-interior-links/${linkId}`)
        const link = response.data

        // Actualizar el vínculo en la lista si existe
        const index = this.links.findIndex(l => l.id === linkId)
        if (index !== -1) {
          this.links[index] = link
        }

        console.log('✅ Vínculo obtenido:', link)
        return link
      } catch (error) {
        console.error('❌ Error al obtener vínculo:', error)
        this.error = error.response?.data?.detail || 'Error al obtener el vínculo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE LINK - Crea un nuevo vínculo casa-interior
     *
     * @param {Object} payload - Datos del vínculo a crear
     * @returns {Promise<Object>} Vínculo creado
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * const newLink = await linksStore.createLink({
     *   casa_apartamento_id: 1,
     *   torre_interior_id: 2,
     *   status: 'active'
     * })
     * ```
     */
    async createLink(payload) {
      this.isLoading = true
      this.error = null
      this.successMessage = null
      try {
        // Normaliza por si te llega el payload con objetos en lugar de IDs
        const body = {
          ...payload,
          casa_apartamento_id: normalizeId(payload?.casa_apartamento_id),
          torre_interior_id: normalizeId(payload?.torre_interior_id),
        }

        const { data } = await api.post('/casa-interior-links', body)

        // Actualiza caches y lista
        this.byIdCache[data.id] = data
        const idx = this.links.findIndex((x) => x.id === data.id)
        if (idx >= 0) this.links[idx] = data
        else this.links.unshift(data)

        // Pair cache
        if (data.casa_apartamento_id != null && data.torre_interior_id != null) {
          const key = buildPairKey(data.casa_apartamento_id, data.torre_interior_id)
          this.pairCache[key] = { id: data.id, ts: Date.now() }
        }

        this.current = data
        this.successMessage = 'Vínculo creado exitosamente'
        console.log('✅ Vínculo creado:', data)
        return data
      } catch (err) {
        console.error('❌ Error al crear vínculo:', err)
        this._setError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE LINK - Actualiza un vínculo existente
     * 
     * @param {number} linkId - ID del vínculo a actualizar
     * @param {Object} linkData - Datos actualizados del vínculo
     * @returns {Promise<Object>} Vínculo actualizado
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * const updated = await linksStore.updateLink(1, {
     *   status: 'inactive'
     * })
     * ```
     */
    async updateLink(linkId, linkData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/casa-interior-links/${linkId}`, linkData)
        const updatedLink = response.data
        
        const index = this.links.findIndex(l => l.id === linkId)
        if (index !== -1) {
          this.links[index] = updatedLink
        }
        
        this.successMessage = 'Vínculo actualizado exitosamente'
        
        console.log('✅ Vínculo actualizado:', updatedLink)
        return updatedLink
      } catch (error) {
        console.error('❌ Error al actualizar vínculo:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el vínculo'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DEACTIVATE LINK - Desactiva un vínculo
     *
     * @param {number} linkId - ID del vínculo a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     *
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * const success = await linksStore.deactivateLink(1)
     * if (success) {
     *   console.log('Vínculo desactivado')
     * }
     * ```
     */
    async deactivateLink(linkId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null
      try {
        const idNum = Number(linkId)

        await api.post(`/casa-interior-links/${idNum}/deactivate`)

        // Marca localmente como inactivo si tu esquema lo maneja
        const idx = this.links.findIndex((x) => x.id === idNum)
        if (idx >= 0) {
          this.links[idx] = { ...this.links[idx], active: false, is_active: false }
          this.byIdCache[idNum] = this.links[idx]
        }
        if (this.current?.id === idNum) {
          this.current = { ...this.current, active: false, is_active: false }
          this.byIdCache[idNum] = this.current
        }

        this.successMessage = 'Vínculo desactivado exitosamente'
        console.log('✅ Vínculo desactivado:', idNum)
        return true
      } catch (err) {
        console.error('❌ Error al desactivar vínculo:', err)
        // Si tu API usa DELETE en lugar de deactivate, usa:
        // await api.delete(`/casa-interior-links/${idNum}`)
        this._setError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * GET TORRECASA ID - Obtiene el ID de relación torre/interior casa/apto
     * 
     * @param {number} idCasaApto - ID de casa/apartamento
     * @param {number} idInteriorTorre - ID de torre/interior
     * @returns {Promise<number>} ID de la relación
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const linksStore = useCasaInteriorLinksStore()
     * const torrecasaId = await linksStore.getTorrecasaId(1, 2)
     * console.log(torrecasaId)
     * ```
     */
    async getTorrecasaId(idCasaApto, idInteriorTorre) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/casa-interior-links/torrecasa/id', {
          params: {
            id_casa_apto: idCasaApto,
            id_interior_torre: idInteriorTorre
          }
        })
        
        console.log('✅ ID de relación obtenido:', response.data)
        return response.data
      } catch (error) {
        console.error('❌ Error al obtener ID de relación:', error)
        this.error = error.response?.data?.detail || 'Error al obtener ID de relación'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * SET FILTERS - Establece los filtros de búsqueda
     * 
     * @param {Object} filters - Filtros a aplicar
     * @param {number} filters.casa_apartamento_id - Filtrar por casa/apartamento
     * @param {number} filters.torre_interior_id - Filtrar por torre/interior
     * @param {string} filters.status - Filtrar por estado
     * @param {boolean} filters.active_only - Solo vínculos activos
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.currentPage = 1 // Resetear a primera página al filtrar
    },

    /**
     * SET PAGE - Cambia la página actual
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
        casa_apartamento_id: null,
        torre_interior_id: null,
        status: null,
        is_active: null,
        active_only: true,
      }
      this.pagination.currentPage = 1
    },

    /**
     * CLEAR MESSAGES - Limpia los mensajes de error y éxito
     */
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    // ========== FUNCIONES ADICIONALES DEL CACHE AVANZADO ==========

    /**
     * _SET ERROR - Establece el mensaje de error
     * @param {Error} err - Error a procesar
     */
    _setError(err) {
      this.error =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Error desconocido'
    },

    /**
     * RESET FILTERS - Restablece filtros a valores por defecto
     */
    resetFilters() {
      this.filters = {
        casa_apartamento_id: null,
        torre_interior_id: null,
        status: null,
        is_active: null,
        active_only: true,
        limit: 100,
        offset: 0,
      }
    },

    /**
     * SET TTL - Establece el tiempo de vida del cache
     * @param {number} ms - Milisegundos de TTL
     */
    setTTL(ms) {
      this.ttlMs = Number(ms) || this.ttlMs
    },

    /**
     * CLEAR CACHE - Limpia todos los caches
     */
    clearCache() {
      this.byIdCache = {}
      this.pairCache = {}
    },

    /**
     * CLEAR CURRENT - Limpia el vínculo actual
     */
    clearCurrent() {
      this.current = null
    },

    /**
     * CLEAR ERROR - Limpia el mensaje de error
     */
    clearError() {
      this.error = null
    },

    /**
     * FETCH BY ID - Obtiene vínculo por ID con cache
     * @param {number} linkId - ID del vínculo
     * @param {Object} options - Opciones
     * @returns {Promise<Object>} Vínculo obtenido
     */
    async fetchById(linkId, { useCache = true } = {}) {
      this.isLoading = true
      this.error = null
      try {
        const idNum = Number(linkId)
        if (useCache && this.byIdCache[idNum]) {
          this.current = this.byIdCache[idNum]
          return this.current
        }

        const { data } = await api.get(`/casa-interior-links/${idNum}`)
        this.current = data
        this.byIdCache[idNum] = data

        // Sincronizar con lista si ya existe
        const idx = this.links.findIndex((x) => x.id === idNum)
        if (idx >= 0) this.links[idx] = data
        else this.links.unshift(data)

        return data
      } catch (err) {
        this._setError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE - Actualiza un vínculo existente
     * @param {number} linkId - ID del vínculo
     * @param {Object} payload - Datos a actualizar
     * @returns {Promise<Object>} Vínculo actualizado
     */
    async update(linkId, payload) {
      this.isLoading = true
      this.error = null
      this.successMessage = null
      try {
        // Normalizar por si vienen objetos
        const body = { ...payload }
        if ('casa_apartamento_id' in body) {
          body.casa_apartamento_id = normalizeId(body.casa_apartamento_id)
        }
        if ('torre_interior_id' in body) {
          body.torre_interior_id = normalizeId(body.torre_interior_id)
        }

        const idNum = Number(linkId)
        const { data } = await api.patch(`/casa-interior-links/${idNum}`, body)

        // Sincronizar caches y lista
        this.byIdCache[idNum] = data
        const idx = this.links.findIndex((x) => x.id === idNum)
        if (idx >= 0) this.links[idx] = data
        else this.links.unshift(data)

        if (this.current?.id === idNum) this.current = data

        // Refrescar pairCache por si cambió el par
        if (data.casa_apartamento_id != null && data.torre_interior_id != null) {
          const key = buildPairKey(data.casa_apartamento_id, data.torre_interior_id)
          this.pairCache[key] = { id: data.id, ts: Date.now() }
        }

        this.successMessage = 'Vínculo actualizado exitosamente'
        return data
      } catch (err) {
        this._setError(err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH RELACION ID - Busca ID por pareja con cache avanzado
     * @param {number} casaApartamentoId - ID de casa/apartamento
     * @param {number} torreInteriorId - ID de torre/interior
     * @param {Object} opts - Opciones
     * @returns {Promise<number|null>} ID de la relación o null
     */
    async fetchRelacionId(casaApartamentoId, torreInteriorId, opts = {}) {
      this.error = null

      // Normalizar para evitar que axios serialice objetos en params
      const aptoId = normalizeId(casaApartamentoId)
      const torreId = normalizeId(torreInteriorId)

      if (!aptoId || !torreId) return null

      const force = !!opts.force
      const key = buildPairKey(aptoId, torreId)
      const now = Date.now()

      // Cache válido
      const entry = this.pairCache[key]
      const valid = entry && now - entry.ts < this.ttlMs
      if (!force && valid) {
        return entry.id
      }

      // Abortar si había una petición previa en vuelo para esta combinación
      const prev = this.controllers[key]
      if (prev && typeof prev.abort === 'function') {
        try { prev.abort() } catch { /* ignore */ }
      }
      const controller = new AbortController()
      this.controllers[key] = controller

      this.isLoading = true
      try {
        const { data } = await api.get('/casa-interior-links/', {
          params: {
            casa_apartamento_id: aptoId,
            torre_interior_id: torreId,
          },
          signal: controller.signal,
        })

        const id = parseRelacionId(data)

        // Cachear resultado
        this.pairCache[key] = { id, ts: Date.now() }

        if (!id) {
          this.error = 'No existe relación para los IDs seleccionados.'
        }

        return id
      } catch (err) {
        // Cancelado por cambio rápido de selección
        const msg = String(err?.message || '')
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || msg.includes('canceled') || msg.includes('aborted')) {
          return null
        }
        // Cachear null para evitar hammering
        this.pairCache[key] = { id: null, ts: Date.now() }
        this._setError(err)
        return null
      } finally {
        this.loading = false
        delete this.controllers[key]
      }
    },
  },
})
