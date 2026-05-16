<!--
  VISTA DE LOGIN CON JWT
  
  Esta vista maneja el inicio de sesión de usuarios usando autenticación JWT.
  
  FUNCIONALIDADES:
  - Formulario de login con usuario y contraseña
  - Validación de campos requeridos
  - Manejo de estados de carga
  - Mensajes de error claros
  - Opción de "Recordarme" (mantiene sesión)
  - Redirección automática después del login exitoso
  
  FLUJO DE AUTENTICACIÓN:
  1. Usuario ingresa credenciales
  2. Se envía petición al backend (/auth/login)
  3. Backend valida y devuelve JWT token
  4. Token se guarda en localStorage
  5. Usuario es redirigido al dashboard
  
  INTEGRACIÓN CON BACKEND:
  - Endpoint: POST /auth/login
  - Body: { username: string, password: string }
  - Response: { access_token: string, must_change_password: boolean }
-->

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { mdiAccount, mdiAsterisk } from '@mdi/js'
import SectionFullScreen from '@/components/SectionFullScreen.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'
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
const remember = ref(false)

// Estados de UI
const isLoading = ref(false)

/**
 * SUBMIT - Maneja el envío del formulario de login
 * 
 * PROCESO:
 * 1. Previene el envío por defecto del formulario
 * 2. Valida que los campos no estén vacíos
 * 3. Llama al método login del authStore
 * 4. Si es exitoso, redirige al dashboard
 * 5. Si falla, muestra el error en pantalla
 */
const handleSubmit = async () => {
  // Limpiar errores previos
  authStore.clearError()

  // Validación básica
  if (!username.value || !password.value) {
    authStore.error = 'Por favor ingresa usuario y contraseña'
    return
  }

  isLoading.value = true

  try {
    // Intentar hacer login
    const success = await authStore.login(username.value, password.value)

    if (success) {
      console.log('✅ Login exitoso, redirigiendo...')
      
      // Si debe cambiar contraseña, redirigir a esa vista
      if (authStore.mustChangePassword) {
        router.push('/change-password')
      } else {
        // Redirigir al dashboard
        router.push('/')
      }
    }
  } catch (error) {
    console.error('❌ Error inesperado en login:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Navegar a la página de registro
 */
const goToRegister = () => {
  router.push('/registro')
}
</script>

<template>
  <LayoutGuest>
    <SectionFullScreen v-slot="{ cardClass }" bg="greenSoft">
      <CardBox :class="cardClass" is-form @submit.prevent="handleSubmit">

        <div class="flex justify-center">
          <img src="/logo_fontireservado.png" alt="Login Illustration" class="w-60 h-auto" />
        </div>
                
        <!-- Título -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Iniciar Sesión</h1>
          <p class="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Mensaje de error -->
        <NotificationBar v-if="authStore.hasError" color="danger" class="mb-6">
          <b>Error:</b> {{ authStore.error }}
        </NotificationBar>

        <!-- Mensaje de carga -->
        <NotificationBar v-if="isLoading" color="info" class="mb-6">
          <b>Iniciando sesión...</b> Por favor espera.
        </NotificationBar>

        <!-- Campo de Usuario -->
        <FormField label="Usuario" help="Ingresa tu nombre de usuario">
          <FormControl
            v-model="username"
            :icon="mdiAccount"
            name="username"
            autocomplete="username"
            placeholder="Ej: usuario123"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Campo de Contraseña -->
        <FormField label="Contraseña" help="Ingresa tu contraseña">
          <FormControl
            v-model="password"
            :icon="mdiAsterisk"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </FormField>

        <!-- Checkbox Recordarme -->
        <!--  <FormCheckRadio
          v-model="remember"
          name="remember"
          label="Recordarme en este dispositivo"
          :input-value="true"
          :disabled="isLoading"
        />
         -->

        <!-- Botones de acción -->
        <template #footer>
          <BaseButtons>
            <BaseButton 
              type="submit" 
              color="info" 
              label="Ingresar" 
              :disabled="isLoading"
            />
            
          </BaseButtons>

          <!-- Información adicional -->
          <div class="text-center mt-4 text-gray-600 dark:text-gray-300">
            <p class="text-sm">
              <span>Sistema Administración- V 1.0</span>
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
