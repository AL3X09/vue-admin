<!--
  VISTA DE CAMBIO DE CONTRASEÑA (FORZADO)
  
  Esta vista permite al usuario cambiar su contraseña cuando es requerido
  por el sistema (primer inicio de sesión después del registro).
  
  FUNCIONALIDADES:
  - Formulario para nueva contraseña y confirmación
  - Validación de que las contraseñas coincidan
  - Validación de longitud mínima (8 caracteres)
  - Estados de carga y error claros
  - Redirección al dashboard después del cambio exitoso
  
  FLUJO:
  1. Usuario ingresa nueva contraseña y confirmación
  2. Se valida que las contraseñas coincidan y tengan al menos 8 caracteres
  3. Se envía petición al backend (POST /users/force-change-password)
  4. Backend actualiza la contraseña y devuelve éxito
  5. Usuario es redirigido al dashboard
  
  ENDPOINT DEL BACKEND:
  - URL: POST /users/force-change-password
  - Body: { new_password: string }
  - Response: { message: string }
  
  IMPORTANTE: Esta ruta es accesible solo cuando el usuario tiene
  el flag must_change_password = true en su perfil.
-->

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { mdiLock, mdiAsterisk } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'
import NotificationBar from '@/components/NotificationBar.vue'

// ============================================
// PROPS Y EMITS
// ============================================

/**
 * No props adicionales necesarios.
 * El store de auth ya tiene el flag mustChangePassword.
 */

// ============================================
// STATE
// ============================================

// Router para navegación
const router = useRouter()

// Store de autenticación
const authStore = useAuthStore()

// Campos del formulario
const newPassword = ref('')
const confirmPassword = ref('')

// Estados de UI
const isLoading = ref(false)
const successMessage = ref('')

// ============================================
// MÉTODOS
// ============================================

/**
 * VALIDAR CONTRASEÑAS
 * Verifica que las contraseñas sean válidas
 * @returns {boolean} true si las contraseñas son válidas
 */
const validatePasswords = () => {
  // Validar que las contraseñas coincidan
  if (newPassword.value !== confirmPassword.value) {
    authStore.error = 'Las contraseñas no coinciden'
    return false
  }

  // Validar longitud mínima (8 caracteres según el backend)
  if (newPassword.value.length < 8) {
    authStore.error = 'La contraseña debe tener al menos 8 caracteres'
    return false
  }

  return true
}

/**
 * HANDLESUBMIT
 * Maneja el envío del formulario de cambio de contraseña
 * 
 * PROCESO:
 * 1. Limpia errores previos
 * 2. Valida que los campos no estén vacíos
 * 3. Valida que las contraseñas sean válidas
 * 4. Llama al método forceChangePassword del authStore
 * 5. Si es exitoso, muestra mensaje y redirige al dashboard
 * 6. Si falla, muestra el error en pantalla
 */
const handleSubmit = async () => {
  // Limpiar mensajes previos
  authStore.clearError()
  successMessage.value = ''

  // Validar que los campos no estén vacíos
  if (!newPassword.value || !confirmPassword.value) {
    authStore.error = 'Por favor completa todos los campos'
    return
  }

  // Validar contraseñas
  if (!validatePasswords()) {
    return
  }

  isLoading.value = true

  try {
    // Intentar cambiar la contraseña
    const success = await authStore.forceChangePassword(newPassword.value)

    if (success) {
      console.log('✅ Cambio de contraseña exitoso')
      successMessage.value = '¡Contraseña actualizada exitosamente! Redirigiendo...'

      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        // Redirigir al dashboard
        router.push('/')
      }, 1500)
    }
  } catch (error) {
    console.error('❌ Error inesperado en cambio de contraseña:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * CANCELAR
 * Permite al usuario cancelar y cerrar sesión
 * 
 * NOTA: Esta opción cierra la sesión y devuelve al login.
 * El usuario deberá iniciar sesión nuevamente pero seguirá
 * viendo el mensaje de cambio de contraseña.
 */
const handleCancel = () => {
  // Cerrar sesión
  authStore.logout()
  
  // Redirigir al login
  router.push('/login')
}
</script>

<template>
  <LayoutGuest>
    <!-- Usar el fondo verde suave para consistencia con login/registro -->
    <SectionFullScreen v-slot="{ cardClass }" bg="greenSoft">
      <CardBox :class="cardClass" is-form @submit.prevent="handleSubmit">
        <!-- Título e información -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Cambiar Contraseña</h1>
          <p class="text-gray-500 mt-2">
            Por seguridad, debes cambiar tu contraseña antes de continuar
          </p>
        </div>

        <!-- Mensaje de éxito -->
        <NotificationBar v-if="successMessage" color="success" class="mb-6">
          <b>¡Éxito!</b> {{ successMessage }}
        </NotificationBar>

        <!-- Mensaje de error -->
        <NotificationBar v-if="authStore.hasError" color="danger" class="mb-6">
          <b>Error:</b> {{ authStore.error }}
        </NotificationBar>

        <!-- Mensaje de carga -->
        <NotificationBar v-if="isLoading" color="info" class="mb-6">
          <b>Cambiando contraseña...</b> Por favor espera.
        </NotificationBar>

        <!-- Campo Nueva Contraseña -->
        <FormField 
          label="Nueva Contraseña" 
          help="Mínimo 8 caracteres. Usa una contraseña segura."
        >
          <FormControl
            v-model="newPassword"
            :icon="mdiLock"
            type="password"
            name="newPassword"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Campo Confirmar Contraseña -->
        <FormField 
          label="Confirmar Contraseña" 
          help="Vuelve a ingresar tu nueva contraseña"
        >
          <FormControl
            v-model="confirmPassword"
            :icon="mdiAsterisk"
            type="password"
            name="confirmPassword"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Información adicional -->
        <div class="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p class="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Después de cambiar tu contraseña,
            no podrás revertircela. Asegúrate de recordarla o guardarla en un lugar seguro.
          </p>
        </div>

        <!-- Botones de acción -->
        <template #footer>
          <BaseButtons>
            <BaseButton 
              type="submit" 
              color="info" 
              label="Cambiar Contraseña" 
              :disabled="isLoading"
            />
            <BaseButton 
              color="danger" 
              outline 
              label="Cancelar" 
              @click="handleCancel"
              :disabled="isLoading"
            />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>