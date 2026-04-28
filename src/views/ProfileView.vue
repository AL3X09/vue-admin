<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/stores/conf'
import { mdiAccount, mdiMail, mdiAsterisk, mdiFormTextboxPassword, mdiCellphone, mdiAccountMultiple, mdiCheck, mdiClose, mdiLogout, mdiPencil } from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import UserCard from '@/components/UserCard.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoadingPersona = ref(false)
const isSavingPersona = ref(false)
const isChangingPassword = ref(false)
const personaMessage = ref({ type: '', text: '' })
const passwordMessage = ref({ type: '', text: '' })

const persona = ref(null)
const personaForm = reactive({
  nombres: '',
  apellidos: '',
  celular: '',
  email: '',
})

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')

onMounted(async () => {
  await fetchPersona()
})

const fetchPersona = async () => {
  isLoadingPersona.value = true
  try {
    const response = await api.get('/personas/me')
    persona.value = response.data
    personaForm.nombres = response.data.nombres || ''
    personaForm.apellidos = response.data.apellidos || ''
    personaForm.celular = response.data.celular || ''
    personaForm.email = response.data.email || ''
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Error al obtener persona:', error)
    }
    persona.value = null
  } finally {
    isLoadingPersona.value = false
  }
}

const savePersona = async () => {
  isSavingPersona.value = true
  personaMessage.value = { type: '', text: '' }

  try {
    await api.patch('/personas/me', {
      nombres: personaForm.nombres,
      apellidos: personaForm.apellidos,
      celular: personaForm.celular || null,
      email: personaForm.email || null,
    })

    persona.value = { ...persona.value, ...personaForm }
    personaMessage.value = { type: 'success', text: 'Datos guardados exitosamente' }
  } catch (error) {
    console.error('Error al guardar persona:', error)
    personaMessage.value = { 
      type: 'error', 
      text: error.response?.data?.detail || 'Error al guardar los datos' 
    }
  } finally {
    isSavingPersona.value = false
  }
}

const changePassword = async () => {
  if (!currentPassword.value) {
    passwordMessage.value = { type: 'error', text: 'Ingrese la contraseña actual' }
    return
  }

  if (!newPassword.value) {
    passwordMessage.value = { type: 'error', text: 'Ingrese la nueva contraseña' }
    return
  }

  if (newPassword.value.length < 8) {
    passwordMessage.value = { type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' }
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    passwordMessage.value = { type: 'error', text: 'Las contraseñas no coinciden' }
    return
  }

  isChangingPassword.value = true
  passwordMessage.value = { type: '', text: '' }

  try {
    await api.post('/users/change-password', {
      current_password: currentPassword.value,
      new_password: newPassword.value,
    })

    passwordMessage.value = { type: 'success', text: 'Contraseña cambiada exitosamente' }
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    passwordMessage.value = { 
      type: 'error', 
      text: error.response?.data?.detail || 'Error al cambiar la contraseña. Verifique la contraseña actual.' 
    }
  } finally {
    isChangingPassword.value = false
  }
}

/**
 * LOGOUT - Cierra la sesión del usuario
 * 
 * FLUJO:
 * 1. Llama a authStore.logout() para limpiar state y localStorage
 * 2. Usa el router para navegar al login (mantiene SPA)
 * 3. No usa window.location.href (causa recarga completa)
 */
const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <UserCard class="mb-6" />

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardBox v-if="persona" is-form @submit.prevent="savePersona">
          <FormField label="Datos de Persona" help="Actualiza tu información personal">
            <FormField label="Nombres" help="Tus nombres">
              <FormControl
                v-model="personaForm.nombres"
                :icon="mdiAccount"
                name="nombres"
                required
              />
            </FormField>

            <FormField label="Apellidos" help="Tus apellidos">
              <FormControl
                v-model="personaForm.apellidos"
                :icon="mdiAccount"
                name="apellidos"
                required
              />
            </FormField>

            <FormField label="Celular" help="Tu número de celular">
              <FormControl
                v-model="personaForm.celular"
                :icon="mdiCellphone"
                name="celular"
              />
            </FormField>

            <FormField label="Email" help="Tu correo electrónico">
              <FormControl
                v-model="personaForm.email"
                :icon="mdiMail"
                type="email"
                name="email"
              />
            </FormField>

            <div v-if="persona" class="flex gap-2 mt-2">
              <span v-if="persona.is_propietario" class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Propietario
              </span>
              <span v-if="persona.is_arrendatario" class="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Arrendatario
              </span>
            </div>
          </FormField>

          <div v-if="personaMessage.text" :class="[
            'p-3 rounded mb-4',
            personaMessage.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
            personaMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
          ]">
            {{ personaMessage.text }}
          </div>

          <template #footer>
            <BaseButtons>
              <BaseButton 
                type="submit" 
                color="info" 
                label="Guardar"
                :loading="isSavingPersona"
              />
            </BaseButtons>
          </template>
        </CardBox>

        <CardBox v-else-if="!isLoadingPersona">
          <div class="text-center py-4">
            <span :class="mdiAccountMultiple" class="w-12 h-12 text-gray-400 mx-auto mb-2"></span>
            <p class="text-gray-500 dark:text-gray-400">No tienes una persona asociada</p>
            <p class="text-sm text-gray-400 dark:text-gray-500">Contacta al administrador para que te registre</p>
          </div>
        </CardBox>
      </div>

      <BaseDivider />

      <CardBox is-form @submit.prevent="changePassword">
        <FormField label="Cambiar Contraseña" help="Actualiza tu contraseña de acceso">
          <FormField label="Contraseña actual" help="Tu contraseña actual">
            <FormControl
              v-model="currentPassword"
              :icon="mdiAsterisk"
              name="current_password"
              type="password"
              required
              autocomplete="current-password"
            />
          </FormField>

          <BaseDivider />

          <FormField label="Nueva contraseña" help="Mínimo 8 caracteres">
            <FormControl
              v-model="newPassword"
              :icon="mdiFormTextboxPassword"
              name="new_password"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar nueva contraseña" help="Repite la nueva contraseña">
            <FormControl
              v-model="newPasswordConfirm"
              :icon="mdiFormTextboxPassword"
              name="new_password_confirmation"
              type="password"
              required
              autocomplete="new-password"
            />
          </FormField>
        </FormField>

        <div v-if="passwordMessage.text" :class="[
          'p-3 rounded mb-4',
          passwordMessage.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
          passwordMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
        ]">
          {{ passwordMessage.text }}
        </div>

        <template #footer>
          <BaseButtons>
            <BaseButton 
              type="submit" 
              color="info" 
              label="Cambiar Contraseña"
              :loading="isChangingPassword"
            />
          </BaseButtons>
        </template>
      </CardBox>

      <div class="mt-6">
        <CardBox>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Cerrar Sesión
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                ¿Deseas cerrar tu sesión actual?
              </p>
            </div>
            <BaseButton
              color="danger"
              :icon="mdiLogout"
              label="Cerrar Sesión"
              outline
              @click="logout"
            />
          </div>
        </CardBox>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>