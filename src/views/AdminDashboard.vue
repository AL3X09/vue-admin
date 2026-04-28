<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth.store'
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


const userName = computed(() => authStore.user?.first_name || authStore.user?.username || 'Usuario')

/**
 * Elementos del menú completos (sin filtrar)
 * Los superadmin tienen acceso a todos los módulos.
 */
const adminMenuItems = [
  { 
    title: 'Usuarios', 
    description: 'Gestión de usuarios del sistema',
    icon: mdiAccountGroup,
    route: '/users',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  { 
    title: 'Personas', 
    description: 'Gestión de personas y residentes',
    icon: mdiAccountGroup,
    route: '/persons',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  { 
    title: 'Parqueaderos', 
    description: 'Gestión de zonas de parqueadero',
    icon: mdiCar,
    route: '/parking/spots',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    title: 'Reservas', 
    description: 'Reservas de parqueadero visitantes',
    icon: mdiTicket,
    route: '/parking/reservations',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    title: 'Asignaciones', 
    description: 'Asignaciones mensuales de parqueadero',
    icon: mdiCar,
    route: '/parking/assignments',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10'
  },
  { 
    title: 'Tipos de Vehículos', 
    description: 'Gestión de tipos de vehículos',
    icon: mdiCar,
    route: '/parking/vehicle-types',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  { 
    title: 'Vehículos', 
    description: 'Gestión de vehículos de residentes',
    icon: mdiCar,
    route: '/vehicles',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  { 
    title: 'Sorteo', 
    description: 'Administración de sorteos de parqueadero',
    icon: mdiStar,
    route: '/ParkingLottery',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  },
  { 
    title: 'Permisos', 
    description: 'Gestión de permisos del sistema',
    icon: mdiShieldKey,
    route: '/permissions',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10'
  },
  { 
    title: 'Roles', 
    description: 'Gestión de roles y permisos',
    icon: mdiShieldAccount,
    route: '/roles',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10'
  },
  { 
    title: 'Torres/Interiores', 
    description: 'Gestión de torres e interiores',
    icon: mdiDoor,
    route: '/torres-interiores',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10'
  },
  { 
    title: 'Casas/Apartamentos', 
    description: 'Gestión de unidades residenciales',
    icon: mdiHomeCity,
    route: '/casas-apartamentos',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10'
  },
  { 
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
      <SectionTitleLineWithButton :icon="mdiChartBar" title="Panel de Administración" main>
      </SectionTitleLineWithButton>

      <div class="mb-6">
        <p class="text-gray-600 dark:text-gray-400">
          Bienvenido, <strong>{{ userName }}</strong>. Como superadministrador, tienes acceso completo a todos los módulos.
        </p>
      </div>

      <!-- Grid de botones completo (sin restricciones) -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="item in adminMenuItems"
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

    </SectionMain>
  </LayoutAuthenticated>
</template>
