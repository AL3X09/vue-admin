/**
 * GUÍA DE IMPLEMENTACIÓN - SISTEMA DE NOTIFICACIONES CON TOAST
 * 
 * ============================================================
 * DESCRIPCIÓN GENERAL
 * ============================================================
 * 
 * Sistema centralizado de notificaciones flotantes automáticas
 * usando el composable useNotification y vue3-toastify.
 * 
 * VENTAJAS:
 * ✅ Notificaciones profesionales y no intrusivas
 * ✅ Auto-dismiss automático (3-5 segundos)
 * ✅ Posición consistente (top-right)
 * ✅ Soporte para múltiples tipos (success, error, warning, info)
 * ✅ Reutilizable en todas las vistas
 * ✅ Código limpio y mantenible
 * 
 * ============================================================
 * IMPLEMENTACIÓN PASO A PASO
 * ============================================================
 * 
 * PASO 1: Importar el composable y los stores
 * -------------------------------------------
 * 
 * import { useNotification } from '@/composables/useNotification'
 * import { usePersonsStore } from '@/stores/persons.store'
 * import { useUsersStore } from '@/stores/users.store'
 * import { /* otros stores */ } from '@/stores/...'
 * 
 * 
 * PASO 2: Inicializar el composable en el setup
 * -----------------------------------------------
 * 
 * const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification()
 * 
 * 
 * PASO 3: Agregar watchers para cada store
 * ------------------------------------------
 * 
 * // Monitorear errores del store y mostrar toast automático
 * watch(
 *   () => personsStore.error,
 *   (newError) => {
 *     if (newError) {
 *       notifyError(newError, 5000) // 5 segundos
 *       personsStore.error = null
 *     }
 *   }
 * )
 * 
 * // Monitorear mensajes de éxito del store y mostrar toast automático
 * watch(
 *   () => personsStore.successMessage,
 *   (newMessage) => {
 *     if (newMessage) {
 *       notifySuccess(newMessage, 3000) // 3 segundos
 *       personsStore.successMessage = null
 *     }
 *   }
 * )
 * 
 * // Repetir para otros stores...
 * 
 * 
 * PASO 4: Usar notificaciones manuales en funciones
 * ---------------------------------------------------
 * 
 * // Después de una operación exitosa
 * const savePerson = async () => {
 *   try {
 *     await personsStore.createPerson(data)
 *     // El watch automáticamente mostrará la notificación
 *   } catch (error) {
 *     notifyError('Error al guardar')
 *   }
 * }
 * 
 * // Para validaciones
 * const validateForm = () => {
 *   if (!form.email) {
 *     notifyWarning('El email es obligatorio')
 *     return false
 *   }
 *   return true
 * }
 * 
 * 
 * PASO 5: Remover los NotificationBar del template
 * --------------------------------------------------
 * 
 * ❌ REMOVER ESTO:
 * <NotificationBar v-if="personsStore.error" color="danger">
 *   {{ personsStore.error }}
 * </NotificationBar>
 * 
 * ✅ Los toast aparecerán automáticamente sin necesidad de template
 * 
 * 
 * ============================================================
 * FUNCIONES DISPONIBLES DEL COMPOSABLE
 * ============================================================
 * 
 * notifySuccess(message, duration = 3000)
 *   - Muestra notificación verde de éxito
 *   - Ideal para operaciones completadas: "Guardado exitosamente"
 * 
 * notifyError(message, duration = 5000)
 *   - Muestra notificación roja de error
 *   - Más tiempo (5s) porque requiere atención
 *   - Ideal para: "Error al guardar" o respuestas del backend
 * 
 * notifyWarning(message, duration = 4000)
 *   - Muestra notificación amarilla de advertencia
 *   - Ideal para: "Cambios sin guardar", validaciones
 * 
 * notifyInfo(message, duration = 3000)
 *   - Muestra notificación azul informativa
 *   - Ideal para: "Cargando...", "Procesando..."
 * 
 * notifyFromResponse(response, successMessage, isError = false)
 *   - Helper para procesar respuestas automáticamente
 *   - Detecta si es error o éxito
 * 
 * notifyApiError(error)
 *   - Helper para procesar errores de API
 *   - Extrae el mensaje de error del response
 * 
 * 
 * ============================================================
 * EJEMPLOS COMPLETOS
 * ============================================================
 * 
 * EJEMPLO 1: Vista con múltiples stores
 * -----------------------------------------------
 * 
 * import { useNotification } from '@/composables/useNotification'
 * import { usePersonsStore } from '@/stores/persons.store'
 * import { useUsersStore } from '@/stores/users.store'
 * 
 * const { notifySuccess, notifyError } = useNotification()
 * const personsStore = usePersonsStore()
 * const usersStore = useUsersStore()
 * 
 * // Watchers para cada store
 * watch(
 *   () => personsStore.error,
 *   (err) => {
 *     if (err) {
 *       notifyError(err, 5000)
 *       personsStore.error = null
 *     }
 *   }
 * )
 * 
 * watch(
 *   () => personsStore.successMessage,
 *   (msg) => {
 *     if (msg) {
 *       notifySuccess(msg, 3000)
 *       personsStore.successMessage = null
 *     }
 *   }
 * )
 * 
 * // Repetir para usersStore...
 * 
 * 
 * EJEMPLO 2: Notificaciones manuales en validaciones
 * -----------------------------------------------
 * 
 * const handleSubmit = async () => {
 *   // Validaciones
 *   if (!form.name) {
 *     notifyWarning('El nombre es obligatorio')
 *     return
 *   }
 *   
 *   if (!form.email.includes('@')) {
 *     notifyError('Email inválido')
 *     return
 *   }
 *   
 *   try {
 *     await personsStore.createPerson(form)
 *     // El watch mostrará successMessage automáticamente
 *     form.reset()
 *   } catch (error) {
 *     // El watch mostrará error automáticamente
 *   }
 * }
 * 
 * 
 * EJEMPLO 3: Usando notifyFromResponse
 * -----------------------------------------------
 * 
 * const handleResponse = async (response, isError) => {
 *   notifyFromResponse(
 *     response,
 *     'Operación completada exitosamente',
 *     isError
 *   )
 * }
 * 
 * 
 * ============================================================
 * VISTAS A ACTUALIZAR
 * ============================================================
 * 
 * A continuación está la lista de vistas que podrían beneficiarse
 * de este sistema. Las marcadas con ✅ ya están actualizadas:
 * 
 * ✅ PersonsUsersView.vue
 * ✅ UsersView.vue
 * ⏳ AdminDashboard.vue
 * ⏳ CasasApartamentosView.vue
 * ⏳ ParkingReservationsView.vue
 * ⏳ ParkingSpotsView.vue
 * ⏳ VehiclesView.vue
 * ⏳ RolesView.vue
 * ⏳ PermissionsView.vue
 * ⏳ ProfileView.vue
 * ⏳ ChangePasswordView.vue
 * 
 * Para actualizar una vista:
 * 1. Seguir los pasos 1-5 de esta guía
 * 2. Reemplazar los NotificationBar con watchers
 * 3. Remover imports de toast si existen
 * 4. Usar el composable para notificaciones manuales
 * 
 * 
 * ============================================================
 * PATRONES RECOMENDADOS
 * ============================================================
 * 
 * PATRÓN 1: Notificación automática desde store
 * -------------------------------------------
 * // En el store:
 * this.successMessage = 'Usuario creado exitosamente'
 * 
 * // En la vista, el watch automáticamente:
 * notifySuccess('Usuario creado exitosamente')
 * 
 * PATRÓN 2: Validación con notificación manual
 * -------------------------------------------
 * if (!email) {
 *   notifyWarning('Email es obligatorio')
 *   return false
 * }
 * 
 * PATRÓN 3: Operación con confirmación
 * -------------------------------------------
 * const deleteItem = (item) => {
 *   if (!confirm('¿Está seguro?')) {
 *     notifyInfo('Operación cancelada')
 *     return
 *   }
 *   
 *   try {
 *     await store.deleteItem(item.id)
 *     // successMessage trigger el watch
 *   } catch (error) {
 *     // error trigger el watch
 *   }
 * }
 * 
 * 
 * ============================================================
 * PERSONALIZACIÓN AVANZADA
 * ============================================================
 * 
 * Puedes modificar el composable para:
 * - Cambiar duraciones por defecto
 * - Cambiar posición de los toast (bottom-right, etc)
 * - Agregar sonidos
 * - Agregar persistencia en localStorage
 * 
 * Ubicación: src/composables/useNotification.js
 * 
 * Ejemplo - Cambiar duración:
 * const notifySuccess = (message, duration = 5000) => {  // Antes 3000
 *   toast.success(message, { autoClose: duration, ... })
 * }
 * 
 * 
 * ============================================================
 * TROUBLESHOOTING
 * ============================================================
 * 
 * P: No veo las notificaciones
 * R: Verifica que:
 *    - vue3-toastify esté instalado (npm list vue3-toastify)
 *    - El composable esté importado
 *    - El store tenga error o successMessage configurado
 *    - Los watchers estén configurados correctamente
 * 
 * P: Las notificaciones aparecen pero desaparecen muy rápido
 * R: Aumenta la duración:
 *    notifyError(message, 7000) // 7 segundos
 * 
 * P: Múltiples notificaciones apiladas
 * R: Es normal y esperado. Cada operación genera una notificación
 *    Asegúrate de limpiar el error/successMessage del store:
 *    personsStore.error = null
 * 
 * 
 * ============================================================
 * REFERENCIAS
 * ============================================================
 * 
 * - Composable: src/composables/useNotification.js
 * - Componentes alternativos: src/components/NotificationAlert.vue
 * - Documentación de vue3-toastify:
 *   https://fkhadra.github.io/vue-toastify/introduction.html
 */

export {}
