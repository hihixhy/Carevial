<script setup>
import { computed } from 'vue'
import { useUserStore } from '../stores'

const userStore = useUserStore()

const homeTo = computed(() => (userStore.isAuthenticated ? '/dashboard' : '/'))
</script>

<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
    <div class="w-20 h-20 rounded-3xl bg-background-100 flex items-center justify-center mb-6">
      <i class="ri-compass-discover-line text-3xl text-foreground-300" />
    </div>
    <h1 class="text-[48px] font-bold text-foreground-900 tracking-tighter leading-none">404</h1>
    <p class="text-[16px] text-foreground-400 mt-4 font-medium">这个页面不存在</p>
    <router-link
      :to="homeTo"
      class="mt-8 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white text-[14px] font-semibold rounded-xl transition-colors cursor-pointer"
    >
      返回首页
    </router-link>
  </div>
</template>
