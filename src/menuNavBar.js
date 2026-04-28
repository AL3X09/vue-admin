import {
  mdiAccount,
  mdiCogOutline,
  mdiEmail,
  mdiLogout,
  mdiThemeLightDark,
} from '@mdi/js'

export default [
  // Menú de usuario (perfil, configuración, logout)
  {
    isCurrentUser: true,
    menu: [
      {
        icon: mdiAccount,
        label: 'Mi Perfil',
        to: '/profile',
      },
      /*
      {
        icon: mdiCogOutline,
        label: 'Configuración',
      },
      {
        icon: mdiEmail,
        label: 'Mensajes',
      },
      */
      {
        isDivider: true,
      },
      {
        icon: mdiLogout,
        label: 'Cerrar Sesión',
        isLogout: true,
      },
    ],
  },
  // Toggle modo claro/oscuro
  {
    icon: mdiThemeLightDark,
    label: 'Claro/Oscuro',
    isDesktopNoLabel: true,
    isToggleLightDark: true,
  },
]
