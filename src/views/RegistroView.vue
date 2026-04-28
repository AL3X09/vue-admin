<!--
  VISTA DE REGISTRO CON JWT
  
  Esta vista maneja el registro de nuevos usuarios en el sistema.
  
  FUNCIONALIDADES:
  - Formulario de registro con usuario y contraseña
  - Validación de campos requeridos
  - Confirmación de contraseña
  - Manejo de estados de carga
  - Mensajes de error y éxito claros
  - Login automático después del registro exitoso
  
  FLUJO DE REGISTRO:
  1. Usuario ingresa credenciales
  2. Se valida que las contraseñas coincidan
  3. Se envía petición al backend (/auth/register)
  4. Backend crea el usuario
  5. Se hace login automático
  6. Usuario es redirigido según corresponda
  
  INTEGRACIÓN CON BACKEND:
  - Endpoint: POST /auth/register
  - Body: { username: string, password: string }
  - Response: UserRead con información del usuario creado
  
  NOTA: Después del registro, el sistema hace login automático
  y puede requerir cambio de contraseña según la configuración.
-->

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { mdiAccount, mdiAsterisk } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'
import NotificationBar from '@/components/NotificationBar.vue'

// Router para navegación
const router = useRouter()

// Store de autenticación
const authStore = useAuthStore()

// Campos del formulario
const username = ref('')
const password = ref('')
const confirmPassword = ref('')

// Estados de UI
const isLoading = ref(false)
const successMessage = ref('')

/**
 * VALIDAR CONTRASEÑAS - Verifica que las contraseñas coincidan
 * @returns {boolean} true si las contraseñas son válidas
 */
const validatePasswords = () => {
  if (password.value !== confirmPassword.value) {
    authStore.error = 'Las contraseñas no coinciden'
    return false
  }

  if (password.value.length < 6) {
    authStore.error = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }

  return true
}

/**
 * SUBMIT - Maneja el envío del formulario de registro
 * 
 * PROCESO:
 * 1. Valida que los campos no estén vacíos
 * 2. Valida que las contraseñas coincidan
 * 3. Llama al método register del authStore
 * 4. Si es exitoso, muestra mensaje y redirige
 * 5. Si falla, muestra el error en pantalla
 */
const handleSubmit = async () => {
  // Limpiar mensajes previos
  authStore.clearError()
  successMessage.value = ''

  // Validación básica
  if (!username.value || !password.value || !confirmPassword.value) {
    authStore.error = 'Por favor completa todos los campos'
    return
  }

  // Validar contraseñas
  if (!validatePasswords()) {
    return
  }

  isLoading.value = true

  try {
    // Intentar registrar usuario
    const success = await authStore.register(username.value, password.value)

    if (success) {
      console.log('✅ Registro exitoso')
      successMessage.value = '¡Registro exitoso! Redirigiendo...'

      // Esperar un momento para que el usuario vea el mensaje
      setTimeout(() => {
        // Si debe cambiar contraseña, redirigir a esa vista
        if (authStore.mustChangePassword) {
          router.push('/change-password')
        } else {
          // Redirigir al dashboard
          router.push('/')
        }
      }, 1500)
    }
  } catch (error) {
    console.error('❌ Error inesperado en registro:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Navegar a la página de login
 */
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="greenSoft">
      <CardBox :class="cardClass" is-form @submit.prevent="handleSubmit">
        <!-- Título -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Crear Cuenta</h1>
          <p class="text-gray-500 mt-2">Regístrate para acceder al sistema</p>
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
          <b>Registrando usuario...</b> Por favor espera.
        </NotificationBar>

        <!-- Campo de Usuario -->
        <FormField 
          label="Usuario" 
          help="Ingresa tu nombre de usuario. Ejemplo: interior-torre + número de apartamento (19304)"
        >
          <FormControl
            v-model="username"
            :icon="mdiAccount"
            name="username"
            id="username"
            autocomplete="username"
            placeholder="Ej: 19304"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Campo de Contraseña -->
        <FormField 
          label="Contraseña" 
          help="Mínimo 6 caracteres. Usa una contraseña segura."
        >
          <FormControl
            v-model="password"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Campo de Confirmar Contraseña -->
        <FormField 
          label="Confirmar Contraseña" 
          help="Vuelve a ingresar tu contraseña"
        >
          <FormControl
            v-model="confirmPassword"
            :icon="mdiAsterisk"
            type="password"
            name="confirm-password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Información adicional -->
        <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p class="text-sm text-blue-800">
            <strong>Nota:</strong> Después del registro, deberás cambiar tu contraseña 
            en el primer inicio de sesión por seguridad.
          </p>
        </div>

        <!-- Botones de acción -->
        <template #footer>
          <BaseButtons>
            <BaseButton 
              type="submit" 
              color="info" 
              label="Registrar" 
              :disabled="isLoading"
            />
            <BaseButton 
              color="info" 
              outline 
              label="Ya tengo cuenta" 
              @click="goToLogin"
              :disabled="isLoading"
            />
          </BaseButtons>

          <!-- Información adicional -->
          <div class="text-center mt-4 text-gray-600 dark:text-gray-300">
            <p class="text-sm">
              ¿Ya tienes una cuenta? 
              <a 
                href="#" 
                @click.prevent="goToLogin" 
                class="font-bold underline hover:text-gray-800 dark:hover:text-gray-100"
              >
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </template>
      </CardBox>
    </SectionFullScreen>
  </LayoutGuest>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
