/**
 * CONFIGURACIÓN DEL ROUTER CON GUARDS DE AUTENTICACIÓN
 * 
 * Este archivo configura las rutas de la aplicación y protege
 * las rutas privadas usando guards de navegación.
 * 
 * TIPOS DE RUTAS:
 * - Rutas públicas: Accesibles sin autenticación (login, registro)
 * - Rutas privadas: Requieren autenticación (dashboard, perfil, etc.)
 * 
 * GUARDS DE NAVEGACIÓN:
 * - beforeEach: Se ejecuta antes de cada navegación
 * - Verifica si el usuario está autenticado
 * - Redirige al login si intenta acceder a rutas privadas sin autenticación
 * - Redirige al dashboard si intenta acceder al login estando autenticado
 * 
 * METADATA DE RUTAS:
 * - title: Título de la página
 * - requiresAuth: Indica si la ruta requiere autenticación (default: true)
 * - isPublic: Indica si la ruta es pública (default: false)
 */

//import { createRouter, createWebHashHistory } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Style from '@/views/StyleView.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import UserDashboard from '@/views/UserDashboard.vue'

// ============================================
// DEFINICIÓN DE RUTAS
// ============================================

const routes = [
  // ========================================
  // RUTA PRINCIPAL - Dashboard Admin (default)
  // ========================================
  {
    meta: {
      title: 'Panel de Administración',
      requiresAuth: true,
    },
    path: '/',
    name: 'dashboard',
    component: AdminDashboard,
  },
  // ========================================
  // Dashboard para usuarios no-admin
  // ========================================
  {
    meta: {
      title: 'Dashboard Usuario',
      requiresAuth: true,
    },
    path: '/user-dashboard',
    name: 'user-dashboard',
    component: UserDashboard,
  },
  {
    meta: {
      title: 'Gestión de Parqueaderos',
      requiresAuth: true,
    },
    path: '/parking/spots',
    name: 'parking-spots',
    component: () => import('@/views/ParkingSpotsView.vue'),
  },
  {
    meta: {
      title: 'Reservas Parqueadero Visitante',
      requiresAuth: true,
    },
    path: '/parking/reservations',
    name: 'parking-reservations',
    component: () => import('@/views/ParkingReservationsView.vue'),
  },
  {
    meta: {
      title: 'Asignaciones Parqueadero Mensual',
      requiresAuth: true,
    },
    path: '/parking/assignments',
    name: 'parking-assignments',
    component: () => import('@/views/ParkingAssignmentsView.vue'),
  },
  {
    meta: {
      title: 'Tipos de Vehículos',
      requiresAuth: true,
    },
    path: '/parking/vehicle-types',
    name: 'parking-vehicle-types',
    component: () => import('@/views/VehicleTypesView.vue'),
  },
  {
    meta: {
      title: 'Sorteo Parqueaderos',
      requiresAuth: true,
    },
    path: '/ParkingLottery',
    name: 'parking lottery',
    component: () => import('@/views/ParkingLotteryAdmin.vue'),
  },
  {
    meta: {
      title: 'Gestión de Permisos',
      requiresAuth: true,
    },
    path: '/permissions',
    name: 'permissions',
    component: () => import('@/views/PermissionsView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Personas y Usuarios',
      requiresAuth: true,
    },
    path: '/persons',
    name: 'persons',
    component: () => import('@/views/PersonsUsersView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Vehículos',
      requiresAuth: true,
    },
    path: '/vehicles',
    name: 'vehicles',
    component: () => import('@/views/VehiclesView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Usuarios',
      requiresAuth: true,
    },
    path: '/users',
    name: 'users',
    component: () => import('@/views/UsersView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Roles',
      requiresAuth: true,
    },
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/RolesView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Configuraciones de Dominio',
      requiresAuth: true,
    },
    path: '/domain-configs',
    name: 'domain-configs',
    component: () => import('@/views/DomainConfigView.vue'),
  },
  {
    meta: {
      title: 'Crear Usuario',
      requiresAuth: true,
    },
    path: '/users/create',
    name: 'user-create',
    component: () => import('@/views/UserFormView.vue'),
  },
  {
    meta: {
      title: 'Editar Usuario',
      requiresAuth: true,
    },
    path: '/users/:id/edit',
    name: 'user-edit',
    component: () => import('@/views/UserFormView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Torres/Interiores',
      requiresAuth: true,
    },
    path: '/torres-interiores',
    name: 'torres-interiores',
    component: () => import('@/views/TorresInterioresView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Casas/Apartamentos',
      requiresAuth: true,
    },
    path: '/casas-apartamentos',
    name: 'casas-apartamentos',
    component: () => import('@/views/CasasApartamentosView.vue'),
  },
  {
    meta: {
      title: 'Gestión de Vínculos Casa-Interior',
      requiresAuth: true,
    },
    path: '/casa-interior-links',
    name: 'casa-interior-links',
    component: () => import('@/views/CasaInteriorLinksView.vue'),
  },
  {
    meta: {
      title: 'Perfil',
      requiresAuth: true,
    },
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    meta: {
      title: 'UI',
      requiresAuth: true,
    },
    path: '/ui',
    name: 'ui',
    component: () => import('@/views/UiView.vue'),
  },
  {
    meta: {
      title: 'Diseño Responsivo',
      requiresAuth: true,
    },
    path: '/responsive',
    name: 'responsive',
    component: () => import('@/views/ResponsiveView.vue'),
  },
  {
    meta: {
      title: 'Estilos',
      requiresAuth: true,
    },
    path: '/style',
    name: 'style',
    component: Style,
  },

  // ========================================
  // RUTAS PÚBLICAS (No requieren autenticación)
  // ========================================
  {
    meta: {
      title: 'Iniciar Sesión',
      isPublic: true, // Ruta pública
    },
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    meta: {
      title: 'Registro',
      isPublic: true, // Ruta pública
    },
    path: '/registro',
    name: 'registro',
    component: () => import('@/views/RegistroView.vue'),
  },
  {
    meta: {
      title: 'Cambiar Contraseña',
      isPublic: true, // Ruta pública - accesible sin auth para cambio forzado
    },
    path: '/change-password',
    name: 'change-password',
    component: () => import('@/views/ChangePasswordView.vue'),
  },
  {
    meta: {
      title: 'Error',
      isPublic: true, // Ruta pública
    },
    path: '/error',
    name: 'error',
    component: () => import('@/views/ErrorView.vue'),
  },

  // ========================================
  // RUTA 404 - NO ENCONTRADA
  // ========================================
  {
    meta: {
      title: 'Página no encontrada',
      isPublic: true,
    },
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/ErrorView.vue'),
  },
]

// ============================================
// CREACIÓN DEL ROUTER
// ============================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

// ============================================
// GUARD DE NAVEGACIÓN GLOBAL
// ============================================

/**
 * beforeEach - Guard que se ejecuta antes de cada navegación
 * 
 * LÓGICA:
 * 1. Obtiene el store de autenticación
 * 2. Verifica si la ruta requiere autenticación
 * 3. Si requiere auth y no está autenticado -> redirige a login
 * 4. Si es ruta pública y está autenticado -> redirige a dashboard
 * 5. Si todo está bien -> permite la navegación
 * 
 * PARÁMETROS:
 * - to: Ruta a la que se intenta navegar
 * - from: Ruta desde la que se navega
 * - next: Función para continuar la navegación
 */
router.beforeEach((to, from, next) => {
  // Obtener el store de autenticación
  const authStore = useAuthStore()
  
  // Verificar si la ruta requiere autenticación
  //const requiresAuth = to.meta.requiresAuth !== false // Por defecto true
  //const isPublic = to.meta.isPublic === true

  // ✅ DESPUÉS
const isPublic = to.meta.isPublic === true
const requiresAuth = !isPublic // Si no es pública, requiere auth
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = authStore.isAuthenticated

  console.log('🔍 Navegando a:', to.path)
  console.log('🔐 Requiere auth:', requiresAuth)
  console.log('👤 Está autenticado:', isAuthenticated)

  // ========================================
  // CASO 1: Ruta requiere autenticación pero no está autenticado
  // ========================================
  if (requiresAuth && !isAuthenticated) {
    console.log('🚫 Acceso denegado. Redirigiendo a login...')
    next({
      path: '/login',
      query: { redirect: to.fullPath }, // Guardar la ruta original para redirigir después del login
    })
    return
  }

  // ========================================
  // CASO 2: Intenta acceder a login/registro estando autenticado
  // ========================================
  if (isPublic && isAuthenticated && (to.path === '/login' || to.path === '/registro')) {
    console.log('✅ Ya está autenticado. Redirigiendo a dashboard...')
    next({ path: '/' })
    return
  }

  // ========================================
  // CASO 3: Redirección según rol
  // ========================================
  // Usar el getter isAdmin del authStore que maneja correctamente objeto vs string
  const isAdmin = authStore.isAdmin

  // Si va al dashboard principal (/) y no es admin -> ir a /user-dashboard
  if (to.path === '/' && !isAdmin) {
    console.log('🔄 Usuario no admin. Redirigiendo a /user-dashboard...')
    next({ path: '/user-dashboard' })
    return
  }

  // Si va a /user-dashboard y es admin -> ir a dashboard principal
  if (to.path === '/user-dashboard' && isAdmin) {
    console.log('🔄 Usuario admin. Redirigiendo a / ...')
    next({ path: '/' })
    return
  }

  // ========================================
  // CASO 4: Todo está bien, permitir navegación
  // ========================================
  console.log('✅ Navegación permitida')
  next()
})

// ============================================
// GUARD DESPUÉS DE CADA NAVEGACIÓN
// ============================================

/**
 * afterEach - Se ejecuta después de cada navegación
 * 
 * Actualiza el título de la página según la ruta
 */
router.afterEach((to) => {
  // Actualizar el título de la página
  const defaultTitle = 'Fontibón Reservado'
  document.title = to.meta?.title ? `${to.meta.title} - ${defaultTitle}` : defaultTitle
})

// ============================================
// EXPORTAR ROUTER
// ============================================

export default router
