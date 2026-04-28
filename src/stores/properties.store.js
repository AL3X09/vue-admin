/**
 * Store de Propiedades - Gestión de Torres/Interiores y Casas/Apartamentos
 * 
 * Este store maneja las operaciones relacionadas con las propiedades
 * del conjunto residencial (torres/interiores y casas/apartamentos).
 * 
 * FUNCIONALIDADES:
 * - Listar torres/interiores
 * - Listar casas/apartamentos
 * - Filtrar casas/apartamentos por torre/interior
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /torres-interiores - Listar todas las torres/interiores
 * - GET /casas-apartamentos - Listar todas las casas/apartamentos
 * 
 * ESTRUCTURA DE TORRE/INTERIOR:
 * - id: Identificador único
 * - t_numero_letra: Número o letra de la torre/interior (ej: "A", "B", "1", "2")
 * - is_active: Si la torre/interior está activa
 * 
 * ESTRUCTURA DE CASA/APARTAMENTO:
 * - id: Identificador único
 * - c_numero_letra: Número o letra de la casa/apartamento (ej: "101", "202", "A")
 * - is_active: Si la casa/apartamento está activa
 */

import { defineStore } from 'pinia'
import api from './conf'

export const usePropertiesStore = defineStore('properties', {
  state: () => ({
    // Lista de torres/interiores
    torresInteriores: [],
    
    // Lista de casas/apartamentos
    casasApartamentos: [],
    
    // Estado de carga
    isLoading: false,
    
    // Mensajes de error
    error: null,
  }),

  getters: {
    /**
     * Obtiene la lista de torres/interiores formateada para selects
     * @returns {Array} Lista de torres/interiores con id y label
     */
    torresInterioresOptions: (state) => {
      return state.torresInteriores
        .filter(ti => ti.is_active)
        .map(ti => ({
          id: ti.id,
          label: `${ti.t_numero_letra}`,
        }))
    },

    /**
     * Obtiene la lista de casas/apartamentos formateada para selects
     * @returns {Array} Lista de casas/apartamentos con id y label
     */
    casasApartamentosOptions: (state) => {
      return state.casasApartamentos
        .filter(ca => ca.is_active)
        .map(ca => ({
          id: ca.id,
          label: `${ca.c_numero_letra}`,
        }))
    },

    /**
     * Obtiene casas/apartamentos filtrados por torre/interior
     * @param {number} torreInteriorId - ID de la torre/interior
     * @returns {Function} Función que retorna las opciones filtradas
     */
    getCasasApartamentosByTorre: (state) => (torreInteriorId) => {
      // Nota: Este filtro depende de la relación en el backend
      // Por ahora retorna todas las casas/apartamentos activas
      // Si el backend implementa filtrado por torre, se puede ajustar
      return state.casasApartamentos
        .filter(ca => ca.is_active)
        .map(ca => ({
          id: ca.id,
          label: `${ca.c_numero_letra}`,
        }))
    },
  },

  actions: {
    /**
     * FETCH TORRES INTERIORES - Obtiene la lista de todas las torres/interiores
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const propertiesStore = usePropertiesStore()
     * await propertiesStore.fetchTorresInteriores()
     * console.log(propertiesStore.torresInteriores)
     * ```
     */
    async fetchTorresInteriores() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/torres-interiores', {
          params: {
            active_only: true,
            limit: 500,
          }
        })
        this.torresInteriores = response.data
        console.log('✅ Torres/Interiores cargadas:', this.torresInteriores.length)
      } catch (error) {
        console.error('❌ Error al cargar torres/interiores:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las torres/interiores'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH CASAS APARTAMENTOS - Obtiene la lista de todas las casas/apartamentos
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const propertiesStore = usePropertiesStore()
     * await propertiesStore.fetchCasasApartamentos()
     * console.log(propertiesStore.casasApartamentos)
     * ```
     */
    async fetchCasasApartamentos() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/casas-apartamentos', {
          params: {
            active_only: true,
            limit: 500,
          }
        })
        this.casasApartamentos = response.data
        console.log('✅ Casas/Apartamentos cargadas:', this.casasApartamentos.length)
      } catch (error) {
        console.error('❌ Error al cargar casas/apartamentos:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las casas/apartamentos'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * FETCH ALL PROPERTIES - Carga todas las propiedades (torres y casas)
     * 
     * @returns {Promise<void>}
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const propertiesStore = usePropertiesStore()
     * await propertiesStore.fetchAllProperties()
     * ```
     */
    async fetchAllProperties() {
      await Promise.all([
        this.fetchTorresInteriores(),
        this.fetchCasasApartamentos(),
      ])
    },
  },
})
