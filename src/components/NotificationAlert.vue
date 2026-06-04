<script setup>
import { ref, computed, watch } from 'vue'
import { mdiClose, mdiCheckCircle, mdiAlertCircle, mdiInformation } from '@mdi/js'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseButton from '@/components/BaseButton.vue'

/**
 * COMPONENTE DE NOTIFICACIÓN MEJORADO
 * 
 * Muestra notificaciones con:
 * - Tipo: success, error, warning, info
 * - Automático: se oculta después de N segundos
 * - Animaciones suaves
 * - Cierre manual con botón
 * 
 * PROPS:
 * - type: 'success' | 'error' | 'warning' | 'info' (default: 'info')
 * - message: Texto del mensaje
 * - autoClose: Tiempo en ms para auto-cerrar (0 = no cerrar, default: 3000)
 * - dismissible: Si se puede cerrar manualmente (default: true)
 * 
 * EJEMPLO:
 * <NotificationAlert 
 *   type="error" 
 *   message="Error al guardar"
 *   :auto-close="5000"
 * />
 */

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  message: {
    type: String,
    required: true
  },
  autoClose: {
    type: Number,
    default: 3000 // 0 = no auto-close
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const isVisible = ref(true)
let autoCloseTimer = null

// Determinar icono por tipo
const iconPath = computed(() => {
  switch (props.type) {
    case 'success':
      return mdiCheckCircle
    case 'error':
      return mdiAlertCircle
    case 'warning':
      return mdiAlertCircle
    case 'info':
    default:
      return mdiInformation
  }
})

// Determinar clase de color por tipo
const typeClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-800'
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800'
  }
})

// Determinar clase de icono por tipo
const iconColorClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-emerald-600'
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'info':
    default:
      return 'text-blue-600'
  }
})

// Cerrar notificación
const closeNotification = () => {
  isVisible.value = false
  clearTimeout(autoCloseTimer)
  emit('close')
}

// Auto-close después del delay especificado
watch(
  () => isVisible.value,
  (visible) => {
    if (visible && props.autoClose > 0) {
      autoCloseTimer = setTimeout(() => {
        closeNotification()
      }, props.autoClose)
    }
  },
  { immediate: true }
)

// Cleanup
if (autoCloseTimer) {
  clearTimeout(autoCloseTimer)
}
</script>

<template>
  <transition
    enter-active-class="transition-all duration-300"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-300"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="isVisible"
      :class="typeClass"
      class="mb-4 rounded-lg border p-4 flex items-start gap-3 shadow-md"
    >
      <!-- Icono -->
      <BaseIcon
        :path="iconPath"
        :class="iconColorClass"
        w="w-6"
        h="h-6"
        size="24"
        class="flex-shrink-0 mt-0.5"
      />

      <!-- Contenido -->
      <div class="flex-1">
        <p class="text-sm font-medium">{{ message }}</p>
      </div>

      <!-- Botón cerrar -->
      <BaseButton
        v-if="dismissible"
        :icon="mdiClose"
        small
        rounded-full
        color="white"
        @click="closeNotification"
        class="flex-shrink-0"
      />
    </div>
  </transition>
</template>
