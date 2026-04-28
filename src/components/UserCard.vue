<script setup>
import { computed, ref } from 'vue'
import { useMainStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth.store'
import { mdiCheckDecagram } from '@mdi/js'
import BaseLevel from '@/components/BaseLevel.vue'
import UserAvatarCurrentUser from '@/components/UserAvatarCurrentUser.vue'
import CardBox from '@/components/CardBox.vue'
import FormCheckRadio from '@/components/FormCheckRadio.vue'
import PillTag from '@/components/PillTag.vue'

const mainStore = useMainStore()
const authStore = useAuthStore()

const userName = computed(() => mainStore.userName)

const formattedPermissions = computed(() => {
  const permissions = authStore.user?.permissions || []
  return permissions.length > 0 ? permissions.join(', ') : 'Sin permisos asignados'
})

const userRoleDisplay = computed(() => {
  const roleMap = {
    admin: 'Administrador',
    propietario: 'Propietario',
    arrendatario: 'Arrendatario',
    celador: 'Celador',
    aseador: 'Aseador',
    todero: 'Todero',
    counsellor: 'Consejero',
    administrador: 'Administrador del Conjunto',
  }

  // Usar el getter roleName del authStore para obtener solo el nombre
  const roleName = authStore.roleName
  return roleMap[roleName] || roleName || 'Sin rol'
})

const userStatusText = computed(() => {
  if (authStore.user?.is_active === undefined || authStore.user?.is_active === null) {
    return 'Estado desconocido'
  }
  return authStore.user.is_active ? 'Activo' : 'Inactivo'
})

const userStatusClass = computed(() => {
  return authStore.user?.is_active ? 'text-green-600' : 'text-red-600'
})

const userSwitchVal = ref(false)
</script>

<template>
  <CardBox>
    <BaseLevel type="justify-around lg:justify-center">
      <UserAvatarCurrentUser class="lg:mx-12" />
      <div class="space-y-3 text-center md:text-left lg:mx-12">
        <div class="flex justify-center md:block">
        </div>
        <h1 class="text-2xl">
          Buen Día, <b>{{ authStore.user?.username || 'No disponible' }}</b
          >!
        </h1>
        <div class="space-y-3 text-left text-sm text-gray-600 dark:text-gray-300 mt-4">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Usuario:</span>
            <span>{{ authStore.user?.username || 'No disponible' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Rol:</span>
            <span>{{ userRoleDisplay }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Permisos:</span>
            <span>{{ formattedPermissions }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Estado:</span>
            <span :class="userStatusClass">{{ userStatusText }}</span>
          </div>
        </div>
      </div>
    </BaseLevel>
  </CardBox>
</template>
