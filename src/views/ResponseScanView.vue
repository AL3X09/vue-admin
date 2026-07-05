<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NotificationAlert from '@/components/NotificationAlert.vue'

const route = useRoute()
const id = route.params.id
const token = route.query.token

const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin

const message = ref('Cargando...')
const type = ref('info')
const payload = ref(null)
const loading = ref(true)

function setError(err) {
  type.value = 'error'
  message.value = typeof err === 'string' ? err : (err?.message || JSON.stringify(err))
}

async function doScan() {
  try {
    const base = apiBase.replace(/\/$/, '')
    const url = `${base}/parking/reservations/${id}/scan?token=${encodeURIComponent(token)}`
    const resp = await fetch(url, { method: 'GET' })
    const data = await resp.json().catch(() => null)
    payload.value = data
    
    // Manejar la nueva estructura de respuesta ScanQRResponse
    if (resp.ok && data?.status_code === 200) {
      type.value = 'success'
      // Usar el detail del servidor si está disponible
      message.value = data.detail || 'Escaneo exitoso. Verifique los detalles abajo.'
    } else {
      type.value = 'error'
      // Intentar obtener el detail de la respuesta
      message.value = data?.detail || data?.message || `Error ${resp.status}`
    }
  } catch (e) {
    setError(e.message || e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!id || !token) {
    setError('ID o token ausente en la URL')
    loading.value = false
    return
  }
  doScan()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
    <div class="max-w-xl w-full">
      <NotificationAlert :type="type" :message="message" :autoClose="0" :dismissible="false" />

      <div v-if="loading" class="mt-4 text-center text-sm text-gray-600">Cargando respuesta...</div>

      <div v-else class="mt-4 bg-white p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Detalles de la respuesta</h3>
        <pre class="text-xs overflow-auto max-h-64 p-2 bg-gray-50 rounded">{{ payload ? JSON.stringify(payload, null, 2) : 'Sin detalles' }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Asegurar que el cuadro esté centrado en pantalla */
.centered-notification {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
