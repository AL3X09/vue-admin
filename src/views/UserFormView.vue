<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  mdiPlus,
  mdiPencil,
  mdiAccount,
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
import { useRolesStore } from '@/stores/roles.store'

// ============================================
// STORES
// ============================================
const route = useRoute()
const usersStore = useUsersStore()
const rolesStore = useRolesStore()

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

const initialUserForm = {
  username: '',
  password: '',
  role_id: null,
}

const userForm = ref({ ...initialUserForm })
const originalUserForm = ref({ ...initialUserForm })

const selectRoleOptions = computed(() => {
  return rolesStore.roles.map(role => ({ id: role.id, label: role.name }))
})

const router = useRouter()
const isEditing = computed(() => !!route.params.id)

const resetUserForm = () => {
  userForm.value = {
    ...originalUserForm.value,
    password: '',
  }
}

const loadUser = async () => {
  if (!isEditing.value) {
    return
  }

  const id = Number(route.params.id)
  const user = await usersStore.fetchUserById(id)

  originalUserForm.value = {
    username: user.username || '',
    password: '',
    role_id: user.role?.id ?? user.role ?? null,
  }

  userForm.value = { ...originalUserForm.value }
}

const saveUser = async () => {
  try {
    if (!userForm.value.username || !userForm.value.role_id) {
      showNotification('danger', 'Por favor, completa todos los campos requeridos.')
      return
    }

    if (!isEditing.value && !userForm.value.password) {
      showNotification('danger', 'Por favor, ingresa una contraseña para el nuevo usuario.')
      return
    }

    const payload = {
      username: userForm.value.username,
      role_id: userForm.value.role_id,
      ...(userForm.value.password ? { password: userForm.value.password } : {}),
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
  await rolesStore.fetchRoles()
  await loadUser()
})

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

        <FormField v-if="!isEditing" label="Contraseña" help="Mínimo 8 caracteres">
          <FormControl v-model="userForm.password" type="password" :icon="mdiLock" required />
        </FormField>

        <FormField label="Rol del Usuario">
          <FormControl v-model="userForm.role_id" :options="selectRoleOptions" :icon="mdiShieldAccount" required />
        </FormField>

        <template #footer>
          <BaseButtons>
            <BaseButton type="submit" :label="isEditing ? 'Actualizar' : 'Crear'" color="info" />
            <BaseButton type="button" label="Limpiar" color="info" outline @click="resetUserForm" />
            <BaseButton type="button" label="Cancelar" color="info" outline @click="cancel" />
          </BaseButtons>
        </template>
      </CardBox>
    </SectionMain>
  </LayoutAuthenticated>
</template>
