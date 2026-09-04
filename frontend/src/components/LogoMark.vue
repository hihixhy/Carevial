<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: String, default: 'md' },
  showText: { type: Boolean, default: true }
})

const SIZES = {
  sm: { text: 'text-[17px]', gap: 'gap-2', mark: 'w-7 h-7' },
  md: { text: 'text-[18px]', gap: 'gap-2.5', mark: 'w-9 h-9' },
  lg: { text: 'text-[25px]', gap: 'gap-3', mark: 'w-11 h-11' }
}

const variant = computed(() => SIZES[props.size] ?? SIZES.md)
</script>

<template>
  <div class="flex items-center" :class="variant.gap">
    <div class="flex items-center justify-center flex-shrink-0" :class="variant.mark">
      <svg viewBox="0 0 48 48" fill="none" class="w-full h-full">
        <path
          d="M 23.8 7.5
             C 31 7, 36 12, 36 19.5
             C 36 24, 36 26, 36 30.5
             C 36 37, 31 40.5, 23.8 40
             C 17 39.5, 12 36, 12 30.5
             C 12 26, 12 24, 12 19.5
             C 12 12, 17 8, 23.8 7.5 Z"
          fill="#D4C4E8"
          stroke="#A088C0"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M 12.5 23.5
             C 18 24.5, 30 24.5, 35.5 23.5"
          stroke="#A088C0"
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
        />
        <ellipse cx="17" cy="27" rx="2.2" ry="1.4" fill="#C89DB8" opacity="0.4" />
        <ellipse cx="31" cy="27" rx="2.2" ry="1.4" fill="#C89DB8" opacity="0.4" />
        <path
          d="M 39 12 L 39 9.5 M 39 12 L 41.2 12 M 39 12 L 39 14.5 M 39 12 L 36.8 12"
          stroke="#B5A0CC"
          stroke-width="0.8"
          stroke-linecap="round"
          fill="none"
        />
        <path
          d="M 8 35 L 8 33 M 8 35 L 9.5 35 M 8 35 L 8 37 M 8 35 L 6.5 35"
          stroke="#B5A0CC"
          stroke-width="0.8"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
    </div>
    <span
      v-if="showText"
      class="font-semibold tracking-tight whitespace-nowrap"
      :class="variant.text"
      style="color: #1a1a1a"
    >
      Carevial
    </span>
  </div>
</template>
