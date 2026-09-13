<script setup>
import { computed } from 'vue'

const props = defineProps({
  username: { type: String, default: '' },
  avatarUrl: { type: String, default: null },
  sizeClass: { type: String, default: 'w-8 h-8' },
  textClass: { type: String, default: 'text-[14px]' }
})

const initial = computed(() => {
  const name = (props.username || '').trim()
  return name ? name.charAt(0).toUpperCase() : 'U'
})
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-primary-100"
    :class="sizeClass"
  >
    <img v-if="avatarUrl" :src="avatarUrl" alt="" class="w-full h-full object-cover" />
    <span v-else class="font-bold text-primary-600" :class="textClass">
      {{ initial }}
    </span>
  </div>
</template>
