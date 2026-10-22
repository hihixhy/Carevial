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

    <!-- 备案号 -->
    <div class="max-w-6xl mx-auto mt-2 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-[12px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
      >
        ICP备案/许可证号：赣ICP备2026025836号-1
      </a>
      <p class="flex items-center gap-1.5">
        <img src="/assets/image/head-logo.png" alt="" width="20" class="w-5 shrink-0" />
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=36040302000433"
          target="_blank"
          rel="noreferrer"
          class="text-[12px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          赣公网安备36040302000433号
        </a>
      </p>
    </div>
  </footer>
</template>
