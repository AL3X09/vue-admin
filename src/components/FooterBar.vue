<script setup>
import { containerMaxW } from '@/config.js'
import BaseLevel from '@/components/BaseLevel.vue'
import JustboilLogo from '@/components/JustboilLogo.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="px-6 py-2" :class="containerMaxW">
    <BaseLevel>
      <div class="flex flex-col items-center justify-center gap-6 lg:flex-row lg:justify-start">
        <p>&copy;{{ year }}</p>
        <p><b>Desarrollado Por:</b> Alex Cifuentes Sanchez</p>
        <p><b>Diseñado por:</b><b> <a href="https://justboil.me/" target="_blank">JustBoil.me</a></b></p>
        <slot />
      </div>
      <div class="md:py-2">
        <div class="flex justify-center">
          <a href="https://fontibonreservado.com.co/" target="_blank">
          <img src="/logo_fontireservado.png" alt="Logo" class="w-60 h-auto" />
        </a>
        </div>
      </div>
    </BaseLevel>
  </footer>
</template>
