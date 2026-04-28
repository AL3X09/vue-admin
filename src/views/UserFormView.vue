<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  mdiPlus,
  mdiPencil,
  mdiAccount,
  mdiEmail,
  mdiPhone,
  mdiCardAccountDetails,
  mdiShieldAccount,
  mdiLock,
  mdiCheckCircle,
  mdiAlertCircle,
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import { useUsersStore } from '@/stores/users.store'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()

const notification = ref({
  message: '',
  color: 'success',
  icon: mdiCheckCircle,
  visible: false,
})

const showNotification = (type, message) => {
  notification.value.message = message
  if (type === 'success') {
    notification.value.color = 'success'
    notification.value.icon = mdiCheckCircle
  } else {
    notification.value.color = 'danger'
    notification.value.icon = mdiAlertCircle
  }
  notification.value.visible = true
}

const hideNotification = () => {
  notification.value.visible = false
}

const userForm = ref({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: null,
  phone: '',
  document_type: null,
  document_number: '',
})

const selectDocumentType = [
  { id: 'CC', label: 'Cédula de Ciudadanía' },
  { id: 'TI', label: 'Tarjeta de Identidad' },
  { id: 'CE', label: 'Cédula de Extranjería' },
  { id: 'NIT', label: 'NIT' },
  { id: 'PP', label: 'Pasaporte' },
]

const selectRoleOptions = computed(() => {
  return usersStore.availableRoles.map(role => ({ id: role.id, label: role.name }))
})

const isEditing = computed(() => !!route.params.id)

const resetUserForm = () => {
  userForm.value = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: null,
    phone: '',
    document_type: null,
    document_number: '',
  }
}

const loadUser = async () => {
  if (!isEditing.value) {
    resetUserForm()
    return
  }

  const id = Number(route.params.id)
  if (!id) {
    await router.replace({ name: 'users' })
    return
  }

  try {
    const user = await usersStore.fetchUserById(id)

    userForm.value = {
      username: user.username || '',
      email: user.email || '',
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || null,
      phone: user.phone || '',
      document_type: user.document_type || null,
      document_number: user.document_number || '',
    }
  } catch (error) {
    console.error('Error cargando usuario:', error)
    alert('Error al cargar los datos del usuario. Regresando a la lista.')
    await router.replace({ name: 'users' })
  }
}

const saveUser = async () => {
  try {
    if (!userForm.value.username || !userForm.value.email || !userForm.value.role) {
      showNotification('danger', 'Por favor, completa todos los campos requeridos.')
      return
    }

    if (!isEditing.value && !userForm.value.password) {
      showNotification('danger', 'Por favor, ingresa una contraseña para el nuevo usuario.')
      return
    }

    const payload = {
      username: userForm.value.username,
      email: userForm.value.email,
      first_name: userForm.value.first_name,
      last_name: userForm.value.last_name,
      role: userForm.value.role,
      phone: userForm.value.phone,
      document_type: userForm.value.document_type,
      document_number: userForm.value.document_number,
    }

    if (userForm.value.password) {
      payload.password = userForm.value.password
    }

    if (isEditing.value) {
      const id = Number(route.params.id)
      await usersStore.updateUser(id, payload)
      showNotification('success', 'Usuario actualizado correctamente.')
    } else {
      await usersStore.createUser(payload)
      showNotification('success', 'Usuario creado correctamente.')
    }

    setTimeout(() => {
      router.push({ name: 'users' })
    }, 900)
  } catch (error) {
    console.error('Error al guardar usuario:', error)
    showNotification('danger', 'Error al guardar el usuario. Por favor, intenta nuevamente.')
  }
}

const cancel = () => {
  router.push({ name: 'users' })
}

onMounted(async () => {
  if (!usersStore.users.length) {
    await usersStore.fetchUsers()
  }
  await loadUser()
})

watch(() => route.params.id, loadUser)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton
        :icon="isEditing ? mdiPencil : mdiPlus"
        :title="isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'"
        main
      />

      <NotificationBar
        v-if="notification.visible"
        :icon="notification.icon"
        :color="notification.color"
      >
        {{ notification.message }}
      </NotificationBar>

      <CardBox isForm @submit.prevent="saveUser">
        <FormField label="Nombre de Usuario" help="Nombre único para identificar al usuario">
          <FormControl v-model="userForm.username" :icon="mdiAccount" required />
        </FormField>

        <FormField label="Correo Electrónico">
          <FormControl v-model="userForm.email" type="email" :icon="mdiEmail" required />
        </FormField>

        <FormField v-if="!isEditing" label="Contraseña" help="Mínimo 8 caracteres">
          <FormControl v-model="userForm.password" type="password" :icon="mdiLock" required />
        </FormField>

        <FormField label="Nombre">
          <FormControl v-model="userForm.first_name" :icon="mdiAccount" />
        </FormField>

        <FormField label="Apellido">
          <FormControl v-model="userForm.last_name" :icon="mdiAccount" />
        </FormField>

        <FormField label="Rol del Usuario">
          <FormControl v-model="userForm.role" :options="selectRoleOptions" :icon="mdiShieldAccount" required />
        </FormField>

        <FormField label="Teléfono">
          <FormControl v-model="userForm.phone" type="tel" :icon="mdiPhone" />
        </FormField>

        <FormField label="Tipo de Documento">
          <FormControl v-model="userForm.document_type" :options="selectDocumentType" :icon="mdiCardAccountDetails" />
        </FormField>

        <FormField label="Número de Documento">
          <FormControl v-model="userForm.document_number" :icon="mdiCardAccountDetails" />
        </FormField>

        <template #footer>
          <BaseButtons>
            <BaseButton type="submit" :label="isEditing ? 'Actualizar' : 'Crear'" color="info" />
            <BaseButton type="button" label="Cancelar" color="info" outline @click="cancel" />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
