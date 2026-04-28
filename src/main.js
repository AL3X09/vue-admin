/**
 * PUNTO DE ENTRADA DE LA APLICACIÓN VUE
 *
 * Este archivo inicializa la aplicación Vue y configura:
 * - Pinia (gestión de estado)
 * - Router (navegación)
 * - Stores (autenticación, datos, etc.)
 * - Estilos globales
 *
 * ORDEN DE INICIALIZACIÓN:
 * 1. Crear instancia de Pinia
 * 2. Inicializar auth store ANTES de crear la app
 * 3. Crear aplicación Vue
 * 4. Montar plugins (router, pinia)
 * 5. Montar la aplicación
 * 6. Inicializar otros stores
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useMainStore } from '@/stores/main.js'
import { useAuthStore } from '@/stores/auth.store.js'

import './css/main.css'

// ============================================
// INICIALIZACIÓN DE PINIA
// ============================================
const pinia = createPinia()

// ============================================
// INICIALIZACIÓN DE AUTENTICACIÓN (ANTES DE LA APP)
// ============================================

/**
 * Restaurar sesión de autenticación ANTES de crear la app
 *
 * Esto es importante para que el router guard pueda verificar
 * correctamente el estado de autenticación desde el inicio.
 */
const authStore = useAuthStore(pinia)
authStore.initialize()

console.log('🚀 Inicializando aplicación...')
console.log('🔐 Estado de autenticación:', authStore.isAuthenticated ? 'Autenticado' : 'No autenticado')

// ============================================
// CREACIÓN DE LA APLICACIÓN VUE
// ============================================
const app = createApp(App)

// Usar plugins
app.use(pinia)
app.use(router)

// Montar la aplicación
app.mount('#app')

// ============================================
// INICIALIZACIÓN DE OTROS STORES
// ============================================

// Store principal
const mainStore = useMainStore(pinia)

// Cargar datos de ejemplo (si es necesario)
mainStore.fetchSampleClients()
mainStore.fetchSampleHistory()

// ============================================
// CONFIGURACIÓN DE DARK MODE (OPCIONAL)
// ============================================

// Descomenta si quieres restaurar el modo oscuro guardado
// import { useDarkModeStore } from '@/stores/darkMode'
// const darkModeStore = useDarkModeStore(pinia)
// darkModeStore.init()

// ============================================
// CONFIGURACIÓN DE TÍTULO DE PÁGINA
// ============================================

const defaultDocumentTitle = 'Fontibón Reservado'

// Actualizar título según la ruta
router.afterEach((to) => {
  document.title = to.meta?.title
    ? `${to.meta.title} — ${defaultDocumentTitle}`
    : defaultDocumentTitle
})
