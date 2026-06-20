/**
 * Store de Configuración de Dominios - Gestión de Dominios del Sistema
 * 
 * Este store maneja todas las operaciones relacionadas con las configuraciones
 * de dominios del sistema. Permite crear, leer, actualizar y eliminar configuraciones.
 * 
 * FUNCIONALIDADES:
 * - Listar todas las configuraciones de dominios
 * - Crear nuevas configuraciones
 * - Actualizar configuraciones existentes
 * - Obtener una configuración por ID
 * - Activar/Desactivar configuraciones
 * 
 * ESTRUCTURA DE CONFIGURACIÓN:
 * - id: Identificador único
 * - domain: Nombre del dominio (ej: "example.com")
 * - is_active: Estado activo/inactivo del dominio
 * 
 * ENDPOINTS DEL BACKEND:
 * - GET /domain-configs - Listar todas las configuraciones
 * - GET /domain-configs/:id - Obtener una configuración por ID
 * - POST /domain-configs - Crear nueva configuración
 * - PUT /domain-configs/:id - Actualizar configuración
 * - DELETE /domain-configs/:id - Eliminar configuración
 * - PATCH /domain-configs/:id/toggle-active - Activar/Desactivar configuración
 * 
 * PERMISOS REQUERIDOS:
 * - domain-configs:read - Para listar y ver configuraciones
 * - domain-configs:write - Para crear y actualizar configuraciones
 */

import { defineStore } from 'pinia'
import api from './conf'

export const useDomainConfigStore = defineStore('domainConfig', {
  state: () => ({
    configs: [],
    isLoading: false,
    error: null,
    successMessage: null,
    filters: {
      search: '',
      isActive: null,
    },
    pagination: {
      currentPage: 1,
      pageSize: 10,
      total: 0,
    }
  }),

  getters: {
    configsList: (state) => {
      return state.configs.map(config => ({
        ...config,
        statusText: config.is_active ? 'Activo' : 'Inactivo',
        statusClass: config.is_active ? 'text-emerald-500' : 'text-red-500',
      }))
    },

    filteredConfigs: (state) => {
      let filtered = [...state.configs]
      
      if (state.filters.search) {
        const searchLower = state.filters.search.toLowerCase()
        filtered = filtered.filter(config => 
          config.domain.toLowerCase().includes(searchLower)
        )
      }
      
      if (state.filters.isActive !== null) {
        filtered = filtered.filter(config => config.is_active === state.filters.isActive)
      }
      
      return filtered
    },

    paginatedConfigs: (state) => {
      const filtered = state.filteredConfigs
      const start = (state.pagination.currentPage - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return filtered.slice(start, end)
    },

    totalPages: (state) => {
      return Math.ceil(state.filteredConfigs.length / state.pagination.pageSize)
    },

    getConfigById: (state) => (configId) => {
      return state.configs.find(config => config.id === configId) || null
    },

    domainStats: (state) => {
      const total = state.configs.length
      const active = state.configs.filter(c => c.is_active).length
      const inactive = total - active
      
      return {
        total,
        active,
        inactive
      }
    }
  },

  actions: {
    async fetchConfigs() {
      this.isLoading = true
      this.error = null

      try {
        const params = {}
        
        if (this.filters.search) {
          params.q = this.filters.search
        }
        
        if (this.filters.isActive !== null) {
          params.is_active = this.filters.isActive
        }
        
        const response = await api.get('/domain-config', { params })
        this.configs = response.data
        this.pagination.total = this.configs.length
        console.log('✅ Configuraciones cargadas:', this.configs.length)
      } catch (error) {
        console.error('❌ Error al cargar configuraciones:', error)
        this.error = error.response?.data?.detail || 'Error al cargar las configuraciones'
      } finally {
        this.isLoading = false
      }
    },

    async fetchConfigById(configId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get(`/domain-config/${configId}`)
        const config = response.data
        
        const index = this.configs.findIndex(c => c.id === configId)
        if (index !== -1) {
          this.configs[index] = config
        }
        
        return config
      } catch (error) {
        console.error('❌ Error al obtener configuración por ID:', error)
        this.error = error.response?.data?.detail || 'Error al obtener configuración'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createConfig(configData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.post('/domain-config', configData)
        const newConfig = response.data
        
        this.configs.push(newConfig)
        this.pagination.total = this.configs.length
        this.successMessage = 'Configuración creada exitosamente'
        
        console.log('✅ Configuración creada:', newConfig)
        return newConfig
      } catch (error) {
        console.error('❌ Error al crear configuración:', error)
        this.error = error.response?.data?.detail || 'Error al crear la configuración'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateConfig(configId, configData) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/domain-config/${configId}`, configData)
        const updatedConfig = response.data
        
        const index = this.configs.findIndex(c => c.id === configId)
        if (index !== -1) {
          this.configs[index] = updatedConfig
        }
        
        this.successMessage = 'Configuración actualizada exitosamente'
        
        console.log('✅ Configuración actualizada:', updatedConfig)
        return updatedConfig
      } catch (error) {
        console.error('❌ Error al actualizar configuración:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar la configuración'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteConfig(configId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        await api.delete(`/domain-config/${configId}`)
        
        const index = this.configs.findIndex(c => c.id === configId)
        if (index !== -1) {
          this.configs.splice(index, 1)
          this.pagination.total = this.configs.length
        }
        
        this.successMessage = 'Configuración eliminada exitosamente'
        
        console.log('✅ Configuración eliminada:', configId)
        return true
      } catch (error) {
        console.error('❌ Error al eliminar configuración:', error)
        this.error = error.response?.data?.detail || 'Error al eliminar la configuración'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async toggleConfigActive(configId) {
      this.isLoading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await api.patch(`/domain-config/${configId}/toggle-active`)
        const updatedConfig = response.data
        
        const index = this.configs.findIndex(c => c.id === configId)
        if (index !== -1) {
          this.configs[index] = updatedConfig
        }
        
        const action = updatedConfig.is_active ? 'activada' : 'desactivada'
        this.successMessage = `Configuración ${action} exitosamente`
        
        console.log('✅ Configuración activada/desactivada:', updatedConfig)
        return updatedConfig
      } catch (error) {
        console.error('❌ Error al cambiar estado de configuración:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar el estado de la configuración'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    setFilters(filters) {
      if (filters.search !== undefined) this.filters.search = filters.search
      if (filters.isActive !== undefined) this.filters.isActive = filters.isActive
      this.pagination.currentPage = 1
    },

    setPage(page) {
      this.pagination.currentPage = page
    },

    clearFilters() {
      this.filters = {
        search: '',
        isActive: null,
      }
      this.pagination.currentPage = 1
    },

    clearMessages() {
      this.error = null
      this.successMessage = null
    }
  }
})