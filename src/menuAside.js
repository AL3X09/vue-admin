import {
  mdiAccountCircle,
  mdiMonitor,
  mdiGithub,
  mdiLock,
  mdiAlertCircle,
  mdiSquareEditOutline,
  mdiTable,
  mdiViewList,
  mdiTelevisionGuide,
  mdiResponsive,
  mdiPalette,
  mdiLogout,
  mdiShieldKey,
  mdiAccountGroup,
  mdiOfficeBuilding,
  mdiHome,
  mdiLinkVariant,
  mdiParking,
} from '@mdi/js'

export const menuAsideMain = [
  {
    to: '/',
    icon: mdiMonitor,
    label: 'Dashboard',
  },
  {
    label: 'Parqueadero',
    icon: mdiParking,
    menu: [
      {
        to: '/parking/spots',
        label: 'Gestión Spots',
      },
      {
        to: '/parking/reservations',
        label: 'Reservas Visitante',
      },
      {
        to: '/parking/vehicle-types',
        label: 'Tipos de Vehículos',
      },
      {
        to: '/ParkingLottery',
        label: 'Sorteo',
      },
    ],
  },
  {
    to: '/permissions',
    icon: mdiShieldKey,
    label: 'Permisos',
  },
  {
    to: '/users',
    icon: mdiAccountGroup,
    label: 'Usuarios',
  },
  {
    to: '/persons',
    icon: mdiAccountGroup,
    label: 'Personas y Usuarios',
  },
  {
    to: '/torres-interiores',
    icon: mdiOfficeBuilding,
    label: 'Torres/Interiores',
  },
  {
    to: '/casas-apartamentos',
    icon: mdiHome,
    label: 'Casas/Apartamentos',
  },
  {
    to: '/casa-interior-links',
    icon: mdiLinkVariant,
    label: 'Vínculos Casa-Interior',
  },
  {
    to: '/forms',
    label: 'Forms',
    icon: mdiSquareEditOutline,
  },
  {
    to: '/ui',
    label: 'UI',
    icon: mdiTelevisionGuide,
  },
  {
    to: '/responsive',
    label: 'Responsive',
    icon: mdiResponsive,
  },
  {
    to: '/',
    label: 'Styles',
    icon: mdiPalette,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: mdiAccountCircle,
  },
  {
    to: '/login',
    label: 'Login',
    icon: mdiLock,
  },
  {
    to: '/error',
    label: 'Error',
    icon: mdiAlertCircle,
  },
  {
    label: 'Dropdown',
    icon: mdiViewList,
    menu: [
      {
        label: 'Item One',
      },
      {
        label: 'Item Two',
      },
    ],
  },
  {
    href: 'https://github.com/justboil/admin-one-vue-tailwind',
    label: 'Pagina',
    icon: mdiGithub,
    target: '_blank',
  },
]

export const menuAsideBottom = [
  {
    label: 'Cerrar Sesión',
    icon: mdiLogout,
    color: 'info',
    isLogout: true,
  },
]
