/**
 * Store de Autenticación con JWT
 * 
 * Este store maneja todo el proceso de autenticación usando JSON Web Tokens (JWT).
 * 
 * FUNCIONALIDADES:
 * - Login: Autentica al usuario y guarda el token JWT
 * - Registro: Crea un nuevo usuario en el sistema
 * - Logout: Cierra sesión y limpia los datos almacenados
 * - Verificación de autenticación: Comprueba si el usuario está autenticado
 * - Manejo automático de tokens: Guarda y recupera tokens del localStorage
 * 
 * ENDPOINTS DEL BACKEND:
 * - POST /auth/login - Autenticación de usuario
 * - POST /auth/register - Registro de nuevo usuario
 * 
 * ESTRUCTURA DEL TOKEN:
 * El backend devuelve un objeto Token con:
 * - access_token: string (JWT token)
 * - must_change_password: boolean (indica si debe cambiar contraseña)
 */

import { defineStore } from 'pinia'
import api from './conf'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Token JWT del usuario autenticado
    token: localStorage.getItem('token') || null,
    
    // Información del usuario actual
    user: JSON.parse(localStorage.getItem('user')) || null,
    
    // Indica si el usuario debe cambiar su contraseña
    mustChangePassword: localStorage.getItem('mustChangePassword') === 'true' || false,
    
    // Estados de carga y errores
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} true si hay un token válido
     */
    isAuthenticated: (state) => !!state.token,

    /**
     * Obtiene el nombre de usuario actual
     * @returns {string|null} nombre de usuario o null
     */
    username: (state) => state.user?.username || null,

    /**
     * Verifica si hay un error activo
     * @returns {boolean} true si hay un error
     */
    hasError: (state) => !!state.error,

    /**
     * Obtiene solo el nombre del rol del usuario actual
     * @returns {string|null} nombre del rol o null
     * 
     * IMPORTANTE: El backend devuelve el rol como objeto RoleRead con:
     * - id: number
     * - name: string (este es el que necesitamos)
     * - description: string
     * - permissions: []
     * 
     * Este getter extrae SOLO el nombre (role.name) para simplificar su uso en vistas.
     * No retorna la descripción ni ningún otro campo del objeto.
     * 
     * Si el usuario ve la descripción en lugar del nombre, debe limpiar
     * el localStorage del navegador y hacer login nuevamente.
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const authStore = useAuthStore()
     * console.log(authStore.roleName) // "admin" en lugar de {id: 1, name: "admin", description: "..."}
     * ```
     */
    roleName: (state) => {
      const role = state.user?.role
      if (!role) return null
      if (typeof role === 'string') return role
      // Extraer SOLO el name del objeto RoleRead
      return role?.name || null
    },

    /**
     * Obtiene solo el ID del rol del usuario actual
     * @returns {number|null} ID del rol o null
     */
    roleId: (state) => {
      const role = state.user?.role
      if (!role) return null
      if (typeof role === 'number') return role
      return role?.id || null
    },

    /**
     * Obtiene solo el ID del usuario actual
     * @returns {number|null} ID del rol o null
     */
    userId: (state) => {
      const user_id = state.user?.id
      if (!user_id) return null
      if (typeof user_id === 'number') return user_id
      return user_id || null
    },

    /**
     * Verifica si el usuario tiene rol de superadministrador
     * @returns {boolean} true si es superadmin
     * 
     * COMPARACIÓN CON isAuthenticated:
     * - isAuthenticated: Verifica si hay sesión activa (token presente)
     * - isAdmin: Verifica si el usuario tiene rol de superadministrador
     */
    isAdmin: (state) => {
      const role = state.user?.role
      if (!role) return false
      if (typeof role === 'object' && role !== null) {
        return role.id === 1 || role.name?.toLowerCase() === 'superadmin'
      } else if (typeof role === 'string') {
        return role.toLowerCase() === 'superadmin'
      }
      return false
    },
  },

  actions: {
    /**
     * LOGIN - Autentica al usuario con el backend
     * 
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Promise<boolean>} true si el login fue exitoso
     * 
     * PROCESO:
     * 1. Envía credenciales al endpoint POST /auth/login
     * 2. Recibe el token JWT y el flag must_change_password
     * 3. Guarda el token en localStorage y en el state
     * 4. Configura el header Authorization para futuras peticiones
     * 5. Guarda la información del usuario
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const authStore = useAuthStore()
     * const success = await authStore.login('usuario123', 'miPassword')
     * if (success) {
     *   router.push('/dashboard')
     * }
     * ```
     */
    async login(username, password) {
      this.isLoading = true
      this.error = null

      try {
        // Llamada al endpoint de login
        const response = await api.post('/auth/login', {
          username,
          password,
        })

        // Extraer datos de la respuesta
        const { access_token, must_change_password } = response.data

          // Guardar token en el state y localStorage
          this.token = access_token
          localStorage.setItem('token', access_token)

          // Guardar flag de cambio de contraseña
          this.mustChangePassword = must_change_password
          localStorage.setItem('mustChangePassword', must_change_password)

          // Configurar el header Authorization para futuras peticiones
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

          // Obtener información completa del usuario (incluyendo rol)
          try {
            const userResponse = await api.get('/users/me')
            const userData = userResponse.data

            // Aseguramos que exista rol en el usuario
            if (!userData.role) {
              throw new Error('Rol de usuario no disponible')
            }

            this.user = userData
            localStorage.setItem('user', JSON.stringify(userData))
            
            // Extraer solo el nombre del rol para logging
            const roleName = typeof userData.role === 'object' ? userData.role?.name : userData.role
            console.log('✅ Login exitoso para:', username, 'con rol:', roleName || userData.role)
        } catch (userError) {
          // Si falla obtener el usuario, retroceder a estado limpio para evitar falsos isAdmin
          console.warn('⚠️ No se pudo obtener información completa del usuario:', userError?.message || userError)
          this.error = 'No se pudo obtener el perfil del usuario. Intenta de nuevo.'
          this.user = { username, role: null }
          localStorage.setItem('user', JSON.stringify({ username, role: null }))
        }

        return true
      } catch (error) {
        // Manejo de errores
        console.error('❌ Error en login:', error)
        this.error = error.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.'
        
        // Limpiar datos en caso de error
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * REGISTRO - Crea un nuevo usuario en el sistema
     * 
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Promise<boolean>} true si el registro fue exitoso
     * 
     * PROCESO:
     * 1. Envía datos al endpoint POST /auth/register
     * 2. Recibe la información del usuario creado
     * 3. Automáticamente hace login con las credenciales
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const authStore = useAuthStore()
     * const success = await authStore.register('nuevoUsuario', 'password123')
     * if (success) {
     *   router.push('/change-password') // Si debe cambiar contraseña
     * }
     * ```
     */
    async register(username, password) {
      this.isLoading = true
      this.error = null

      try {
        // Llamada al endpoint de registro
        const response = await api.post('/auth/register', {
          username,
          password,
        })

        console.log('✅ Usuario registrado exitosamente:', response.data)

        // Después del registro exitoso, hacer login automáticamente
        return await this.login(username, password)
      } catch (error) {
        // Manejo de errores
        console.error('❌ Error en registro:', error)
        
        if (error.response?.status === 409) {
          this.error = 'El usuario ya existe. Por favor elige otro nombre de usuario.'
        } else {
          this.error = error.response?.data?.detail || 'Error al registrar usuario. Intenta nuevamente.'
        }
        
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * LOGOUT - Cierra la sesión del usuario
     * 
     * PROCESO:
     * 1. Limpia el token del state
     * 2. Elimina todos los datos del localStorage
     * 3. Elimina el header Authorization
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const authStore = useAuthStore()
     * authStore.logout()
     * router.push('/login')
     * ```
     */
    logout() {
      // Limpiar state
      this.token = null
      this.user = null
      this.mustChangePassword = false
      this.error = null

      // Limpiar localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('mustChangePassword')

      // Eliminar header de autorización
      delete api.defaults.headers.common['Authorization']

      console.log('✅ Sesión cerrada exitosamente')
    },

    /**
     * CLEAN AUTH STATE - Limpia el estado de autenticación SIN redirigir
     * 
     * Este método es usado por el interceptor de Axios cuando el token expira.
     * Solo limpia los datos pero NO redirige, leaving that to the router guard.
     * 
     * PROCESO:
     * 1. Limpia el token del state
     * 2. Elimina los datos del localStorage
     * 3. Elimina el header Authorization
     * 4. NO hace ninguna redirección (el router guard lo manejará)
     * 
     * NOTA: Esta función es necesaria porque el interceptor de Axios
     * no tiene acceso directo al router, y el logout() actual usa
     * window.location.href que causa recargas completas.
     */
    cleanAuthState() {
      // Limpiar state de Pinia
      this.token = null
      this.user = null
      this.mustChangePassword = false
      this.error = null

      // Limpiar localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('mustChangePassword')

      // Eliminar header de autorización
      delete api.defaults.headers.common['Authorization']

      console.log('✅ Estado de autenticación limpiado (token expirado)')
    },

    /**
     * INICIALIZAR - Restaura la sesión desde localStorage
     * 
     * Se debe llamar al iniciar la aplicación para restaurar
     * la sesión si existe un token guardado.
     * 
     * NOTA: Además de restaurar el token, también se refrescan
     * los datos del usuario desde el backend para asegurar
     * que el rol esté en el formato correcto (objeto RoleRead)
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * // En main.js o App.vue
     * const authStore = useAuthStore()
     * authStore.initialize()
     * ```
     */
    async initialize() {
      if (this.token) {
        // Configurar el header Authorization si hay token
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
        // Refrescar datos del usuario desde el backend para obtener el rol correcto
        try {
          const userResponse = await api.get('/users/me')
          const userData = userResponse.data
          
          this.user = userData
          localStorage.setItem('user', JSON.stringify(userData))
          
          // Extraer solo el nombre del rol para logging
          const roleName = typeof userData.role === 'object' ? userData.role?.name : userData.role
          console.log('✅ Sesión restaurada desde localStorage - Usuario:', this.user.username, 'Rol:', roleName || userData.role)
        } catch (error) {
          console.warn('⚠️ No se pudieron obtener datos actualizados del usuario:', error?.message || error)
          // Mantener los datos existentes del localStorage
        }
      }
    },

    /**
     * LIMPIAR ERROR - Limpia el mensaje de error actual
     */
    clearError() {
      this.error = null
    },

    /**
     * CAMBIAR CONTRASEÑA - Cambia la contraseña del usuario autenticado
     * 
     * @param {string} newPassword - Nueva contraseña
     * @returns {Promise<boolean>} true si el cambio fue exitoso
     * 
     * ENDPOINT: POST /users/change-password
     * BODY: { new_password: string }
     * 
     * NOTA: Esta función se usa cuando el usuario debe cambiar su contraseña
     * obligatoriamente en su primer inicio de sesión.
     * 
     * EJEMPLO DE USO:
     * ```javascript
     * const authStore = useAuthStore()
     * const success = await authStore.forceChangePassword('nuevaPassword123')
     * if (success) {
     *   router.push('/')
     * }
     * ```
     */
    async forceChangePassword(newPassword) {
      this.isLoading = true
      this.error = null

      try {
        // Llamada al endpoint de cambio forzado de contraseña
        const response = await api.post('/users/force-change-password', {
          new_password: newPassword,
        })

        console.log('✅ Contraseña cambiada exitosamente:', response.data)

        // Actualizar el flag de cambio de contraseña
        this.mustChangePassword = false
        localStorage.setItem('mustChangePassword', 'false')

        return true
      } catch (error) {
        // Manejo de errores
        console.error('❌ Error al cambiar contraseña:', error)
        this.error = error.response?.data?.detail || 'Error al cambiar la contraseña. Intenta nuevamente.'
        return false
      } finally {
        this.isLoading = false
      }
    },
  },
})
