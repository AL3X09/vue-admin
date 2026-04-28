import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import tailwindcss from '@tailwindcss/vite'
// https://vue-icons.kalimah-apps.com/getting-started.html
// https://vite.dev/config/
export default defineConfig({
  //base: "/admin-one-vue-tailwind/",
  base: process.env.VITE_BASE_URL || '/',
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
