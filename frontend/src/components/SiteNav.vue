<script setup>
import { RouterLink } from 'vue-router'
import LogoMark from './LogoMark.vue'

defineEmits(['start'])
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 z-40 bg-background-50/80 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <LogoMark size="sm" show-text />
      <div class="hidden md:flex items-center gap-8">
        <a
          href="#features"
          class="text-[13px] text-foreground-500 hover:text-foreground-900 transition-colors cursor-pointer"
        >
          功能
        </a>
        <RouterLink
          to="/feedback"
          class="text-[13px] text-foreground-500 hover:text-foreground-900 transition-colors cursor-pointer"
        >
          问题反馈
        </RouterLink>
      </div>
      <button
        class="px-4 py-2 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[13px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        @click="$emit('start')"
      >
        开始使用
      </button>
    </div>
  </nav>
</template>
