/**
 * Store de Usuario
 * 
 * Este store maneja las operaciones relacionadas con el usuario actual,
 * como cambio de contraseña y gestión de perfil.
 * 
 * NOTA: Para login y registro, usa el store de autenticación (auth.js)
 * 
 * FUNCIONALIDADES:
 * - Cambio de contraseña normal (requiere contraseña actual)
 * - Cambio de contraseña forzado (primer login)
 * - Obtención de información del usuario
 * 
 * INTEGRACIÓN CON AUTH STORE:
 * Este store trabaja en conjunto con el auth store.
 * El auth store maneja la autenticación (login/registro/logout)
 * mientras que este store maneja las operaciones del usuario autenticado.
 */

import { defineStore } from 'pinia'
import api from './conf'
import { useAuthStore } from './auth.store'

export const useUserStore = defineStore('user', {
  state: () => ({
    // Información adicional del usuario (más allá de lo que tiene auth)
    profile: null,
    
    // Estados de carga y errores
    isLoading: false,
    error: null,
  }),
  
  getters: {
    /**
     * Obtiene el usuario actual desde el auth store
     */
    currentUser: () => {
      const authStore = useAuthStore()
      return authStore.user
    },

    /**
     * Verifica si el usuario debe cambiar contraseña
     */
    mustChangePassword: () => {
      const authStore = useAuthStore()
      return authStore.mustChangePassword
    },

    /**
     * Verifica si el usuario está autenticado
     */
    isLoggedIn: () => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated
    },
  },
  
  actions: {
    /**
     * CAMBIO DE CONTRASEÑA NORMAL
     * 
     * Permite al usuario cambiar su contraseña proporcionando la actual.
     * 
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} true si el cambio fue exitoso
     * 
     * ENDPOINT: POST /users/change-password
     * Body: { current_password: string, new_password: string }
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const userStore = useUserStore()
     * const success = await userStore.changePassword('oldPass123', 'newPass456')
     * if (success) {
     *   console.log('Contraseña cambiada exitosamente')
     * }
     * ```
     */
    async changePassword(currentPassword, newPassword) {
      this.isLoading = true
      this.error = null

      try {
        await api.post('/users/change-password', {
          current_password: currentPassword,
          new_password: newPassword,
        })

        console.log('✅ Contraseña cambiada exitosamente')
        this.error = null
        return true
      } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar la contraseña'
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * CAMBIO DE CONTRASEÑA FORZADO
     * 
     * Usado cuando el usuario debe cambiar su contraseña en el primer login.
     * No requiere la contraseña actual.
     * 
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} true si el cambio fue exitoso
     * 
     * ENDPOINT: POST /users/force-change-password
     * Body: { new_password: string }
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const userStore = useUserStore()
     * const authStore = useAuthStore()
     * 
     * if (authStore.mustChangePassword) {
     *   const success = await userStore.forceChangePassword('newSecurePass123')
     *   if (success) {
     *     router.push('/dashboard')
     *   }
     * }
     * ```
     */
    async forceChangePassword(newPassword) {
      this.isLoading = true
      this.error = null

      try {
        await api.post('/users/force-change-password', {
          new_password: newPassword,
        })

        // Actualizar el flag en el auth store
        const authStore = useAuthStore()
        authStore.mustChangePassword = false
        localStorage.setItem('mustChangePassword', 'false')

        console.log('✅ Contraseña cambiada exitosamente (forzado)')
        return true
      } catch (error) {
        console.error('❌ Error al cambiar contraseña (forzado):', error)
        this.error = error.response?.data?.detail || 'Error al cambiar la contraseña'
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * OBTENER PERFIL DEL USUARIO
     * 
     * Obtiene información detallada del perfil del usuario actual.
     * 
     * @returns {Promise<Object|null>} Datos del perfil o null si falla
     * 
     * ENDPOINT: GET /users/me
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const userStore = useUserStore()
     * const profile = await userStore.fetchProfile()
     * console.log('Perfil:', profile)
     * ```
     */
    async fetchProfile() {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.get('/users/me')
        this.profile = response.data
        
        console.log('✅ Perfil obtenido:', this.profile)
        return this.profile
      } catch (error) {
        console.error('❌ Error al obtener perfil:', error)
        this.error = error.response?.data?.detail || 'Error al obtener el perfil'
        return null
      } finally {
        this.isLoading = false
      }
    },

    /**
     * ACTUALIZAR PERFIL
     * 
     * Actualiza la información del perfil del usuario.
     * 
     * @param {Object} profileData - Datos del perfil a actualizar
     * @returns {Promise<boolean>} true si la actualización fue exitosa
     * 
     * ENDPOINT: PUT /users/me
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const userStore = useUserStore()
     * const success = await userStore.updateProfile({
     *   email: 'nuevo@email.com',
     *   phone: '1234567890'
     * })
     * ```
     */
    async updateProfile(profileData) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.put('/users/me', profileData)
        this.profile = response.data
        
        console.log('✅ Perfil actualizado:', this.profile)
        return true
      } catch (error) {
        console.error('❌ Error al actualizar perfil:', error)
        this.error = error.response?.data?.detail || 'Error al actualizar el perfil'
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * LIMPIAR ERROR
     * 
     * Limpia el mensaje de error actual.
     */
    clearError() {
      this.error = null
    },

    /**
     * LIMPIAR DATOS
     * 
     * Limpia todos los datos del store (usado al hacer logout).
     */
    clear() {
      this.profile = null
      this.error = null
      this.isLoading = false
    },
  },
})
