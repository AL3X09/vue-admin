<script setup>
import { useRouter } from 'vue-router'
import menuNavBar from '@/menuNavBar.js'
import { useDarkModeStore } from '@/stores/darkMode.js'
import { useAuthStore } from '@/stores/auth.store.js'
import NavBar from '@/components/NavBar.vue'
import NavBarItemPlain from '@/components/NavBarItemPlain.vue'
import FormControl from '@/components/FormControl.vue'
import FooterBar from '@/components/FooterBar.vue'

/**
 * LayoutAuthenticated.vue
 * 
 * Layout principal para páginas autenticadas.
 * 
 * CAMBIOS REALIZADOS:
 * - Se eliminó el AsideMenu (sidebar lateral) de todas las vistas.
 * - Se eliminaron los controles de expansión del menú (burger menu) para mobile y desktop.
 * - Se mantiene el item de búsqueda en el NavBar.
 * - Se ajustaron estilos para ocupar el ancho completo (sin padding lateral).
 * 
 * Esto cumple el requerimiento: "deseo que el front ya no tenga el menu sidebar, en ninguna vista".
 * 
 * NOTA: El NavBar se mantiene sin cambios en su componente, solo se ajusta su uso en este layout.
 */

const darkModeStore = useDarkModeStore()
const authStore = useAuthStore()

const router = useRouter()

/**
 * MENU CLICK - Maneja los clicks en el menú del navbar
 * 
 * @param {Event} event - Evento del click
 * @param {Object} item - Elemento del menú
 */
const menuClick = (event, item) => {
  console.log('menuClick recibido:', item)
  
  // Toggle dark mode
  if (item.isToggleLightDark) {
    darkModeStore.set(null, true)
  }

  // Cerrar sesión
  if (item.isLogout) {
    console.log('Cerrando sesión...')
    authStore.logout()
    console.log('🚪 Sesión cerrada')
    router.push('/login')
  }
}
</script>

<template>
  <div>
    <div class="min-h-screen w-screen bg-gray-50 pt-14 transition-(--transition-position) dark:bg-slate-800 dark:text-slate-100">
      <!-- NavBar sin botones de menú lateral (sidebar eliminado) -->
      <NavBar
        :menu="menuNavBar"
        @menu-click="menuClick"
      >
      <!-- Botón para volver -->
      <NavBarItemPlain use-margin>
        <button @click="router.go(-1)" class="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">Volver</button>
      </NavBarItemPlain>
      </NavBar>
      
      <!-- Contenido principal de la vista -->
      <slot />
      
      <!-- Pie de página -->
      <FooterBar>
        <div class="flex items-center justify-center lg:justify-start">
          <!-- PremiumVersionBadge comentado temporalmente -->
        </div>
      </FooterBar>
    </div>
  </div>
</template>
