<script setup>
import { useRouter } from 'vue-router'
import { useDarkModeStore } from '@/stores/darkMode.js'
import { gradientBgPurplePink } from '@/colors.js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import LayoutGuest from '@/layouts/LayoutGuest.vue'
import { onMounted } from 'vue'

const styles = ['basic', 'white']

const darkModeStore = useDarkModeStore()

darkModeStore.set(false)

const router = useRouter()

const handleStyleChange = (slug) => {
  document.documentElement.classList.forEach((token) => {
    if (token.indexOf('style') === 0) {
      document.documentElement.classList.replace(token, `style-${slug}`)
    }
  })

  router.push('/dashboard')
}

// Al cargar la página, aplica automáticamente el estilo "basic" y redirige al dashboard
const applyDefaultStyle = () => {
  // Asegura que la clase del documento sea "style-basic"
  document.documentElement.classList.forEach((token) => {
    if (token.indexOf('style') === 0) {
      document.documentElement.classList.replace(token, 'style-basic')
    }
  })
  // Si no hay clase de estilo, agrégala
  if (!document.documentElement.classList.contains('style-basic')) {
    document.documentElement.classList.add('style-basic')
  }
  // Redirige al dashboard
  router.push('/dashboard')
}

// Ejecuta automáticamente al montar el componente
onMounted(() => {
  applyDefaultStyle()
})
</script>

<template>
  <!-- Página vacía o un loader simple mientras redirige -->
  <div class="flex min-h-screen items-center justify-center">
    <p>Cargando dashboard...</p>
  </div>
</template>
