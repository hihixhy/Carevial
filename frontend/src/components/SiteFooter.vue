<script setup>
import { RouterLink } from 'vue-router'
import LogoMark from './LogoMark.vue'
</script>

<template>
  <footer class="py-10 px-6 border-t border-background-100">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <LogoMark size="sm" show-text />
      <div class="flex items-center gap-6">
        <a
          href="#features"
          class="text-[12px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          功能
        </a>
        <RouterLink
          to="/feedback"
          class="text-[12px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          问题反馈
        </RouterLink>
      </div>
      <p class="text-[11px] text-foreground-300">© 2026 Carevial</p>
    </div>
  </footer>
</template>
