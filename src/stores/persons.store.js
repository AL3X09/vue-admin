/**
 * Store de Personas - Gestión de Personas del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con las personas
 * del sistema. Permite crear, leer, actualizar y desactivar personas.
 * 
 * FUNCIONALIDADES:
 * - Listar todas las personas con filtros
 * - Crear nuevas personas
 * - Actualizar personas existentes
 * - Desactivar personas
 * - Filtrar por propietario/arrendatario
 * - Filtrar por casa/apartamento
 * - Búsqueda por nombre
 * 
 * ESTRUCTURA DE UNA PERSONA:
 * - id: Identificador único
 * - casa_apartamento_id: ID de la casa/apartamento asociado
 * - usuario_id: ID del usuario asociado (opcional)
 * - nombres: Nombres de la persona
 * - apellidos: Apellidos de la persona
 * - edad: Edad de la persona
 * - celular: Número de celular (opcional)
 * - email: Correo electrónico (opcional)
 * - is_propietario: Si es propietario
 * - is_arrendatario: Si es arrendatario
 * - acepta_terminosycondiciones: Si aceptó términos y condiciones
 * - is_active: Si la persona está activa
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /personas - Listar todas las personas
 * - GET /personas/:id - Obtener una persona por ID
 * - POST /personas - Crear nueva persona
 * - PATCH /personas/:id - Actualizar persona
 * - POST /personas/:id/deactivate - Desactivar persona
 * 
 * PERMISOS REQUERIDOS:
 * - person:read - Para listar y ver personas
 * - person:write - Para crear, actualizar y desactivar personas
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const usePersonsStore = defineStore('persons', {
  state: () => ({
    // Lista de todas las personas del sistema
    persons: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error y éxito
    error: null,
    successMessage: null,
    
    // Filtros y paginación
    filters: {
      search: '',
      isPropietario: null,
      isArrendatario: null,
      activeOnly: true,
      casaInteriorLinkId: null,
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
     * Obtiene la lista de personas formateada para mostrar en tabla
     * @returns {Array} Lista de personas con información formateada
     */
    personsList: (state) => {
      return state.persons.map(person => ({
        ...person,
        fullName: `${person.nombres} ${person.apellidos}`,
        statusText: person.is_active ? 'Activo' : 'Inactivo',
        statusClass: person.is_active ? 'text-emerald-500' : 'text-red-500',
        tipoPersona: person.is_propietario ? 'Propietario' : (person.is_arrendatario ? 'Arrendatario' : 'Sin definir'),
        tipoPersonaClass: person.is_propietario ? 'bg-blue-100 text-blue-800' : (person.is_arrendatario ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'),
      }))
    },

    /**
     * Filtra personas según los criterios actuales
     * @returns {Array} Lista de personas filtradas
     */
    filteredPersons: (state) => {
      let filtered = [...state.persons]
      
      // Filtrar por búsqueda
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(person => 
          person.nombres.toLowerCase().includes(searchLower) ||
          person.apellidos.toLowerCase().includes(searchLower) ||
          person.email?.toLowerCase().includes(searchLower) ||
          person.celular?.includes(searchLower)
        )
      }
      
      // Filtrar por propietario
      if (state.filters.isPropietario !== null) {
        filtered = filtered.filter(person => person.is_propietario === state.filters.isPropietario)
      }
      
      // Filtrar por arrendatario
      if (state.filters.isArrendatario !== null) {
        filtered = filtered.filter(person => person.is_arrendatario === state.filters.isArrendatario)
      }
      
      // Filtrar por estado activo
      if (state.filters.activeOnly) {
        filtered = filtered.filter(person => person.is_active === true)
      }
      
      // Filtrar por casa-interior-link
      if (state.filters.casaInteriorLinkId !== null) {
        filtered = filtered.filter(person => person.casa_interior_link_id === state.filters.casaInteriorLinkId)
      }
      
      return filtered
    },

    /**
     * Obtiene personas paginadas
     * @returns {Array} Lista de personas para la página actual
     */
    paginatedPersons: (state) => {
      const filtered = state.filteredPersons
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    /**
     * Calcula el total de páginas
     * @returns {number} Número total de páginas
     */
    totalPages: (state) => {
      return Math.ceil(state.filteredPersons.length / state.pagination.pageSize)
    },

    /**
     * Obtiene una persona por su ID
     * @param {number} personId - ID de la persona
     * @returns {Object|null} Persona encontrada o null
     */
    getPersonById: (state) => (personId) => {
      return state.persons.find(person => person.id === personId) || null
    },

    /**
     * Obtiene estadísticas de personas
     * @returns {Object} Estadísticas de personas
     */
    personStats: (state) => {
      const total = state.persons.length
      const active = state.persons.filter(p => p.is_active).length
      const inactive = total - active
      const propietarios = state.persons.filter(p => p.is_propietario).length
      const arrendatarios = state.persons.filter(p => p.is_arrendatario).length
      const conUsuario = state.persons.filter(p => p.usuario_id !== null).length
      
      return {
        total,
        active,
        inactive,
        propietarios,
        arrendatarios,
        conUsuario
      }
    }
  },

  actions: {
    /**
     * FETCH PERSONS - Obtiene la lista de todas las personas
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
     * await personsStore.fetchPersons()
     * console.log(personsStore.persons)
     * ```
     */
    async fetchPersons() {
      this.isLoading = true
      this.error = null

      try {
        const params = {
          active_only: this.filters.activeOnly,
        }
        
        if (this.filters.isPropietario !== null) {
          params.is_propietario = this.filters.isPropietario
        }
        
        if (this.filters.isArrendatario !== null) {
          params.is_arrendatario = this.filters.isArrendatario
        }
        
        if (this.filters.casaInteriorLinkId !== null) {
          params.casa_interior_link_id = this.filters.casaInteriorLinkId
        }
        
        if (this.filters.search) {
          params.nombre_like = this.filters.search
        }
        
        const response = await api.get('/personas', { params })
        this.persons = response.data
        this.pagination.total = this.persons.length
        console.log('✅ Personas cargadas:', this.persons.length)
      } catch (error) {
        console.error('❌ Error al cargar personas:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las personas'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH PERSON BY ID - Obtiene una persona por su ID
     * 
     * @param {number} personId - ID de la persona
     * @returns {Promise<Object>} Persona encontrada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
     * const person = await personsStore.fetchPersonById(1)
     * console.log(person)
     * ```
     */
    async fetchPersonById(personId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/personas/${personId}`)
        const person = response.data
        
        // Actualizar la persona en la lista si existe
        const index = this.persons.findIndex(p => p.id === personId)
        if (index !== -1) {
          this.persons[index] = person
        }
        
        return person
      } catch (error) {
        console.error('❌ Error al obtener persona por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener persona'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CREATE PERSON - Crea una nueva persona
     * 
     * @param {Object} personData - Datos de la persona a crear
     * @param {number} personData.casa_interior_link_id - ID del vínculo casa-interior
     * @param {number} [personData.usuario_id] - ID del usuario asociado (opcional)
     * @param {string} personData.nombres - Nombres de la persona
     * @param {string} personData.apellidos - Apellidos de la persona
     * @param {number} personData.edad - Edad de la persona
     * @param {string} [personData.celular] - Número de celular (opcional)
     * @param {string} [personData.email] - Correo electrónico (opcional)
     * @param {boolean} [personData.is_propietario] - Si es propietario
     * @param {boolean} [personData.is_arrendatario] - Si es arrendatario
     * @param {boolean} [personData.acepta_terminosycondiciones] - Si aceptó términos
     * @returns {Promise<Object>} Persona creada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
      * const newPerson = await personsStore.createPerson({
      *   casa_interior_link_id: 1,
      *   nombres: 'Juan',
     *   apellidos: 'Pérez',
     *   edad: 30,
     *   celular: '3001234567',
     *   email: 'juan@email.com',
     *   is_propietario: true,
     *   is_arrendatario: false,
     *   acepta_terminosycondiciones: true
     * })
     * ```
     */
    async createPerson(personData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      // usuario_id es OPCIONAL - una persona puede o no tener usuario
      // Si no se proporciona, se crea sin usuario asociado

      try {
        const response = await api.post('/personas', personData)
        const newPerson = response.data
        
        this.persons.push(newPerson)
        this.pagination.total = this.persons.length
        this.successMessage = 'Persona creada exitosamente'
        
        console.log('✅ Persona creada:', newPerson)
        return newPerson
      } catch (error) {
        console.error('❌ Error al crear persona:', error)
        this.error = error.response?.data?.detail || 'Error al crear la persona'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * UPDATE PERSON - Actualiza una persona existente
     * 
     * @param {number} personId - ID de la persona a actualizar
     * @param {Object} personData - Datos actualizados de la persona
     * @returns {Promise<Object>} Persona actualizada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
     * const updated = await personsStore.updatePerson(1, {
     *   nombres: 'Juan Carlos',
     *   celular: '3009876543'
     * })
     * ```
     */
    async updatePerson(personId, personData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      // usuario_id es OPCIONAL - una persona puede o no tener usuario
      // Si no se proporciona, se actualiza sin usuario asociado

      try {
        const response = await api.patch(`/personas/${personId}`, personData)
        const updatedPerson = response.data
        
        const index = this.persons.findIndex(p => p.id === personId)
        if (index !== -1) {
          this.persons[index] = updatedPerson
        }
        
        this.successMessage = 'Persona actualizada exitosamente'
        
        console.log('✅ Persona actualizada:', updatedPerson)
        return updatedPerson
      } catch (error) {
        console.error('❌ Error al actualizar persona:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar la persona'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * DEACTIVATE PERSON - Desactiva una persona
     * 
     * @param {number} personId - ID de la persona a desactivar
     * @returns {Promise<boolean>} true si se desactivó correctamente
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
     * const success = await personsStore.deactivatePerson(1)
     * if (success) {
     *   console.log('Persona desactivada')
     * }
     * ```
     */
    async deactivatePerson(personId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.post(`/personas/${personId}/deactivate`)
        
        const index = this.persons.findIndex(p => p.id === personId)
        if (index !== -1) {
          this.persons[index].is_active = false
        }
        
        this.successMessage = 'Persona desactivada exitosamente'
        
        console.log('✅ Persona desactivada:', personId)
        return true
      } catch (error) {
        console.error('❌ Error al desactivar persona:', error)
        this.error = error.response?.data?.detail || 'Error al desactivar la persona'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * TOGGLE PERSON STATUS - Activa/Desactiva una persona
     * 
     * @param {number} personId - ID de la persona
     * @returns {Promise<Object>} Persona actualizada
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const personsStore = usePersonsStore()
     * await personsStore.togglePersonStatus(1)
     * ```
     */
    async togglePersonStatus(personId) {
      const person = this.persons.find(p => p.id === personId)
      if (!person) {
        throw new Error('Persona no encontrada')
      }
      
      if (person.is_active) {
        // Desactivar
        return await this.deactivatePerson(personId)
      } else {
        // Activar (actualizar is_active a true)
        return await this.updatePerson(personId, { is_active: true })
      }
    },

    /**
     * SET FILTERS - Establece los filtros de búsqueda
     * 
     * @param {Object} filters - Filtros a aplicar
     * @param {string} [filters.search] - Texto de búsqueda
     * @param {boolean|null} [filters.isPropietario] - Filtrar por propietario
     * @param {boolean|null} [filters.isArrendatario] - Filtrar por arrendatario
     * @param {boolean} [filters.activeOnly] - Filtrar solo activos
     * @param {number|null} [filters.casaInteriorLinkId] - Filtrar por vínculo casa-interior
     */
    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      if (filters.isPropietario !== undefined) this.filters.isPropietario = filters.isPropietario
      if (filters.isArrendatario !== undefined) this.filters.isArrendatario = filters.isArrendatario
      if (filters.activeOnly !== undefined) this.filters.activeOnly = filters.activeOnly
      if (filters.casaInteriorLinkId !== undefined) this.filters.casaInteriorLinkId = filters.casaInteriorLinkId
      
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
        isPropietario: null,
        isArrendatario: null,
        activeOnly: true,
        casaInteriorLinkId: null,
      }
      this.pagination.currentPage = 1
    }
  }
})
