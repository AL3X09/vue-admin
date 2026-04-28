<script setup>
import { mdiGithub } from '@mdi/js'
import BaseButton from '@/components/BaseButton.vue'
import SectionBanner from '@/components/SectionBanner.vue'
import { gradientBgPinkRed } from '@/colors'

defineProps({
  text: {
    type: String,
    required: true
  },
  button: {
    type: Object,
    default: null,
    validator: (value) => {
      if (!value) return true
      return (
        typeof value === 'object' &&
        'label' in value &&
        'href' in value
      )
    }
  },
  gradientClass: {
    type: String,
    default: gradientBgPinkRed
  }
})
</script>

<template>
  <SectionBanner :class="gradientClass">
    <h1 class="mb-6 text-3xl text-white" v-html="text"></h1>
    <div v-if="button">
      <BaseButton
        :href="button.href"
        :icon="button.icon || mdiGithub"
        :label="button.label"
        :target="button.target || '_blank'"
        rounded-full
      />
    </div>
  </SectionBanner>
</template>