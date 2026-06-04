import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

/**
 * COMPOSABLE DE NOTIFICACIONES REUTILIZABLE
 * 
 * Proporciona funciones helper para mostrar notificaciones tipo Toast
 * de forma consistente en toda la aplicación.
 * 
 * CARACTERÍSTICAS:
 * - Notificaciones flotantes automáticas
 * - Colores por tipo (success, error, warning, info)
 * - Auto-dismiss después de 3-5 segundos
 * - Posición configurable
 * - Iconos y animaciones
 * 
 * USO:
 * ```javascript
 * import { useNotification } from '@/composables/useNotification'
 * 
 * const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification()
 * 
 * notifySuccess('Guardado exitosamente')
 * notifyError('Error al guardar')
 * notifyWarning('Atención: cambios sin guardar')
 * notifyInfo('Cargando datos...')
 * ```
 */

export function useNotification() {
  /**
   * Muestra notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (default: 3000)
   */
  const notifySuccess = (message, duration = 3000) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  /**
   * Muestra notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (default: 5000)
   */
  const notifyError = (message, duration = 5000) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  /**
   * Muestra notificación de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (default: 4000)
   */
  const notifyWarning = (message, duration = 4000) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  /**
   * Muestra notificación de información
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (default: 3000)
   */
  const notifyInfo = (message, duration = 3000) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  /**
   * Procesa respuesta del backend y muestra notificación automática
   * Detecta si tiene detail (error) o es exitosa
   * @param {Object} response - Respuesta del servidor
   * @param {string} successMessage - Mensaje si es exitosa (default: 'Operación exitosa')
   * @param {boolean} isError - Si es error (default: false)
   */
  const notifyFromResponse = (response, successMessage = 'Operación exitosa', isError = false) => {
    if (isError) {
      // Es un error
      const errorMessage = response?.detail || response?.message || successMessage
      notifyError(errorMessage)
    } else {
      // Es éxito
      notifySuccess(successMessage)
    }
  }

  /**
   * Procesa error de API y muestra notificación
   * @param {Object} error - Error del axios/fetch
   */
  const notifyApiError = (error) => {
    const message = 
      error?.response?.data?.detail || 
      error?.response?.data?.message || 
      error?.message || 
      'Error en la operación'
    
    notifyError(message)
  }

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyFromResponse,
    notifyApiError,
  }
}
