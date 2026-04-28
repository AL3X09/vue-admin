<script setup>
import { useAuthStore } from '@/stores/auth.store'
import UserAvatar from '@/components/UserAvatar.vue'

const authStore = useAuthStore()
</script>

<template>
  <UserAvatar :username="authStore.user?.username || 'No disponible'" :avatar="authStore.user?.avatar">
    <slot />
  </UserAvatar>
</template>
