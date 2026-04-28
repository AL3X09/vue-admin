<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth.store'
import { usePermissionsStore } from '@/stores/permissions.store'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import {
  mdiAccountGroup,
  mdiCar,
  mdiTicket,
  mdiStar,
  mdiShieldKey,
  mdiShieldAccount,
  mdiDoor,
  mdiHomeCity,
  mdiLinkVariant,
  mdiChartBar,
} from '@mdi/js'


const authStore = useAuthStore()
const permissionsStore = usePermissionsStore()


const userName = computed(() => authStore.user?.first_name || authStore.user?.username || 'Usuario')

/**
 * Genera un string de permiso a partir del título del menú
 * Ejemplo: "Usuarios" -> "usuarios:read"
 * @param {string} title - Título del menú
 * @returns {string} String de permiso en formato '<modulo>:read'
 */
const getPermissionFromTitle = (title) => {
  permissionsStore.getPermissionFromTitle
  // Convertir a minúsculas y eliminar acentos
  let permission = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Eliminar caracteres que no sean letras o números
  permission = permission.replace(/[^a-z0-9]/g, '')
  //console.log(`Permiso generado para "${title}": ${permission}:read`)
  return `${permission}:view`
}

/**
 * Elementos del menú filtrados según los permisos del usuario
 * Solo se muestran los módulos para los cuales el usuario tiene el permiso de lectura.
 * Los superadmin ven todos los módulos.
 */
const filteredMenuItems = computed(() => {
  const userPermissions = authStore.user?.permissions || []
  //const isSuperAdmin = authStore.user?.is_superadmin || false
  return MenuItems.filter(item => {
    
    const permission = getPermissionFromTitle(item.title) // Usar title en lugar de id para generar el permiso
    
    return userPermissions.includes(permission)
  })
})


const MenuItems = [
  { 
    id: 'usuarios',
    title: 'Usuarios', 
    description: 'Gestión de usuarios del sistema',
    icon: mdiAccountGroup,
    route: '/users',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  { 
    id: 'personas',
    title: 'Personas', 
    description: 'Gestión de personas y residentes',
    icon: mdiAccountGroup,
    route: '/persons',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  { 
    id: 'parqueaderos',
    title: 'Parqueaderos', 
    description: 'Gestión de zonas de parqueadero',
    icon: mdiCar,
    route: '/parking/spots',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'reservas',
    title: 'Reservas', 
    description: 'Reservas de parqueadero visitantes',
    icon: mdiTicket,
    route: '/parking/reservations',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'asignaciones',
    title: 'Asignaciones', 
    description: 'Asignaciones mensuales de parqueadero',
    icon: mdiCar,
    route: '/parking/assignments',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10'
  },
  { 
    id: 'tiposvehiculos',
    title: 'Tipos de Vehículos', 
    description: 'Gestión de tipos de vehículos',
    icon: mdiCar,
    route: '/parking/vehicle-types',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  { 
    id: 'vehiculos',
    title: 'Vehículos', 
    description: 'Gestión de vehículos de residentes',
    icon: mdiCar,
    route: '/vehicles',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  { 
    id: 'sorteo',
    title: 'Sorteo', 
    description: 'Administración de sorteos de parqueadero',
    icon: mdiStar,
    route: '/ParkingLottery',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  { 
    id: 'permisos',
    title: 'Permisos', 
    description: 'Gestión de permisos del sistema',
    icon: mdiShieldKey,
    route: '/permissions',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  { 
    id: 'roles',
    title: 'Roles', 
    description: 'Gestión de roles y permisos',
    icon: mdiShieldAccount,
    route: '/roles',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  },
  { 
    id: 'torresinteriores',
    title: 'Torres/Interiores', 
    description: 'Gestión de torres e interiores',
    icon: mdiDoor,
    route: '/torres-interiores',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10'
  },
  { 
    id: 'casasapartamentos',
    title: 'Casas/Apartamentos', 
    description: 'Gestión de unidades residenciales',
    icon: mdiHomeCity,
    route: '/casas-apartamentos',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  { 
    id: 'vinculosinteriorcasa',
    title: 'Vínculos', 
    description: 'Vínculos casa-interior',
    icon: mdiLinkVariant,
    route: '/casa-interior-links',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10'
  },
]
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiChartBar" title="Panel de Menú" main>
      </SectionTitleLineWithButton>

      <div class="mb-6">
        <p class="text-gray-600 dark:text-gray-400">
          Bienvenido, <strong>{{ userName }}</strong>. Selecciona una opción del menú para acceder.
        </p>
      </div>

      <!-- Grid de botones con permisos filtrados -->
      <div v-if="filteredMenuItems.length > 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="item in filteredMenuItems"
          :key="item.route"
          :to="item.route"
          class="block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-emerald-500 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 no-underline cursor-pointer"
        >
          <div class="flex items-start gap-4">
            <div :class="[item.bgColor, 'rounded-lg p-3']">
              <svg
                :class="item.color"
                class="h-8 w-8"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path :d="item.icon" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ item.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ item.description }}
              </p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Caso: usuario sin permisos para ningún módulo -->
      <div v-else class="flex items-center justify-center py-12">
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <div class="mb-4 text-4xl">🔒</div>
          <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Sin acceso
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a los módulos de administración.
          </p>
        </div>
      </div>

    </SectionMain>
  </LayoutAuthenticated>
</template>
