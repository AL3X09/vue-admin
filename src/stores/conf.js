/**
 * CONFIGURACIÓN DE AXIOS CON JWT
 * 
 * Este archivo configura la instancia de Axios para comunicarse con el backend.
 * Incluye interceptores para manejar automáticamente los tokens JWT.
 * 
 * CARACTERÍSTICAS:
 * - Configuración base de la API
 * - Interceptor de peticiones: Agrega el token JWT automáticamente
 * - Interceptor de respuestas: Maneja errores de autenticación
 * - Redirección automática al login si el token expira
 * 
 * FLUJO DE MANEJO DE TOKEN EXPIRADO:
 * 1. Axios recibe respuesta 401 (No autorizado)
 * 2. Interceptor limpia localStorage y llama a authStore.logout()
 * 3. authStore.cleanAuthState() limpia el state de Pinia
 * 4. Router guard detecta isAuthenticated = false
 * 5. Redirige al login
 * 
 * ENDPOINTS DEL BACKEND:
 * Base URL: http://127.0.0.1:8000
 * 
 * MANEJO DE TOKENS:
 * - El token se guarda en localStorage con la clave 'token'
 * - Se agrega automáticamente en el header Authorization como 'Bearer {token}'
 * - Si el token expira (401), se limpia y redirige al login
 */

import axios from 'axios'
import { useAuthStore } from './auth.store'

// ============================================
// CONFIGURACIÓN BASE DE AXIOS
// ============================================

/**
 * Instancia de Axios configurada para la API
 * 
 * CONFIGURACIÓN:
 * - baseURL: URL base del backend FastAPI
 * - timeout: Tiempo máximo de espera (10 segundos)
 * - headers: Headers por defecto (Content-Type: application/json)
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [(data, headers) => {
    if (data === null || data === undefined) return data
    
    let serialized = JSON.stringify(data)
    console.log('🔍 [transformRequest] JSON original:', serialized)
    
    // Regex CORRECTO para valores entre comillas: "1E+5" -> "100000"
    // Coincide con números entre comillas que usan notación científica
    serialized = serialized.replace(/"(\d+\.?\d*)E\+(\d+)"/g, (match, mantissa, exponent) => {
      const result = Number(mantissa) * Math.pow(10, parseInt(exponent))
      console.log('🔍 [transformRequest] Notación científica detectada:', match, '->', result)
      return `"${result}"`
    })
    
    console.log('🔍 [transformRequest] JSON procesado:', serialized)
    
    return serialized
  }],
})

// ============================================
// INTERCEPTOR DE PETICIONES (REQUEST)
// ============================================

/**
 * Interceptor que se ejecuta ANTES de cada petición
 * 
 * FUNCIONALIDAD:
 * 1. Obtiene el token JWT del localStorage
 * 2. Si existe, lo agrega al header Authorization
 * 3. Formato: Authorization: Bearer {token}
 * 
 * EJEMPLO DE HEADER GENERADO:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
api.interceptors.request.use(
  (config) => {
    // Log de la data que se va a enviar
    if (config.data) {
      console.log('🔍 [interceptor request] config.data:', config.data)
      console.log('🔍 [interceptor request] config.data type:', typeof config.data)
      if (typeof config.data === 'string') {
        console.log('🔍 [interceptor request] String data:', config.data)
      }
    }
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token')
    
    if (token) {
      // Agregar token al header Authorization
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 Token agregado a la petición:', config.url)
    } else {
      console.log('⚠️ No hay token disponible para:', config.url)
    }
    
    return config
  },
  (error) => {
    // Manejo de errores en la configuración de la petición
    console.error('❌ Error en interceptor de petición:', error)
    return Promise.reject(error)
  }
)

// ============================================
// INTERCEPTOR DE RESPUESTAS (RESPONSE)
// ============================================

/**
 * Interceptor que se ejecuta DESPUÉS de cada respuesta
 * 
 * FUNCIONALIDAD:
 * 1. Si la respuesta es exitosa (2xx), la devuelve sin cambios
 * 2. Si hay error 401 (No autorizado):
 *    - Limpia el token del localStorage
 *    - Limpia los datos del usuario
 *    - Redirige al login
 * 3. Si hay error 403 (Prohibido):
 *    - Muestra mensaje de permisos insuficientes
 * 4. Otros errores se propagan normalmente
 * 
 * CÓDIGOS DE ERROR MANEJADOS:
 * - 401: Token inválido o expirado
 * - 403: Sin permisos para acceder al recurso
 * - 404: Recurso no encontrado
 * - 500: Error del servidor
 */
api.interceptors.response.use(
  (response) => {
    // Respuesta exitosa, devolver sin cambios
    return response
  },
  (error) => {
    // Obtener información del error
    const status = error.response?.status
    const url = error.config?.url
    
    console.error(`❌ Error en respuesta [${status}]:`, url, error.response?.data)

    // ========================================
    // MANEJO DE ERROR 401 - NO AUTORIZADO (TOKEN EXPIRADO)
    // ========================================
    if (status === 401) {
      console.warn('🚫 Token inválido o expirado. Cerrando sesión...')
      
      // Obtener el authStore para limpiar el estado
      // NOTA: Usamos una función factory para evitar problemas de inicialización circular
      try {
        // Intentar obtener el authStore desde Pinia
        const authStore = useAuthStore()
        
        // Limpiar estado de autenticación SIN redirigir
        // El router guard detectará isAuthenticated = false y redirigirá
        if (authStore && typeof authStore.cleanAuthState === 'function') {
          authStore.cleanAuthState()
        } else {
          // Fallback: limpiar manualmente si el store no está disponible
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('mustChangePassword')
          delete api.defaults.headers.common['Authorization']
        }
      } catch (e) {
        // Si falla el store, limpiar manualmente
        console.warn('⚠️ No se pudo acceder al authStore, limpiando manualmente')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('mustChangePassword')
        delete api.defaults.headers.common['Authorization']
      }
      
      // Redirigir al login solo si no estamos ya en login o registro
      // Usamos window.location.hash para mantener compatibilidad con vue-router en modo hash
      const currentHash = window.location.hash
      if (!currentHash.includes('/login') && !currentHash.includes('/registro')) {
        console.log('🔄 Redirigiendo al login...')
        window.location.hash = '#/login'
      }
    }

    // ========================================
    // MANEJO DE ERROR 403 - PROHIBIDO
    // ========================================
    if (status === 403) {
      console.warn('🚫 Acceso prohibido. Permisos insuficientes.')
      // Aquí podrías mostrar un mensaje al usuario
      // Por ejemplo, usando un store de notificaciones
    }

    // ========================================
    // MANEJO DE ERROR 404 - NO ENCONTRADO
    // ========================================
    if (status === 404) {
      console.warn('🔍 Recurso no encontrado:', url)
    }

    // ========================================
    // MANEJO DE ERROR 500 - ERROR DEL SERVIDOR
    // ========================================
    if (status === 500) {
      console.error('💥 Error del servidor:', error.response?.data)
    }

    // ========================================
    // MANEJO DE ERROR DE RED
    // ========================================
    if (!error.response) {
      console.error('🌐 Error de red o servidor no disponible')
      // Aquí podrías mostrar un mensaje al usuario
    }

    // Propagar el error para que pueda ser manejado en el componente
    return Promise.reject(error)
  }
)

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Configura el token en los headers de Axios
 * 
 * @param {string} token - Token JWT a configurar
 * 
 * EJEMPLO DE USO:
 * ```javascript
 * import api, { setAuthToken } from '@/stores/conf'
 * setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
 * ```
 */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    console.log('✅ Token configurado en Axios')
  } else {
    delete api.defaults.headers.common['Authorization']
    console.log('✅ Token eliminado de Axios')
  }
}

/**
 * Limpia el token de los headers de Axios
 * 
 * EJEMPLO DE USO:
 * ```javascript
 * import { clearAuthToken } from '@/stores/conf'
 * clearAuthToken()
 * ```
 */
export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization']
  console.log('✅ Token limpiado de Axios')
}

// Exportar la instancia configurada de Axios
export default api
