<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import LogoMark from '../LogoMark.vue'

const mobileMenuOpen = ref(false)
const collapsed = ref(false)
</script>

<template>
  <div class="min-h-screen bg-background-100">
    <header
      class="lg:hidden fixed top-0 left-0 right-0 h-[56px] bg-white border-b border-background-200 z-30 flex items-center px-4 gap-3"
    >
      <button
        class="w-9 h-9 rounded-lg flex items-center justify-center text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
        aria-label="打开菜单"
        @click="mobileMenuOpen = true"
      >
        <i class="ri-menu-line text-[20px]" />
      </button>
      <div class="flex items-center gap-2.5">
        <LogoMark size="sm" show-text />
      </div>
    </header>

    <Sidebar
      :mobile-open="mobileMenuOpen"
      :collapsed="collapsed"
      @close-mobile="mobileMenuOpen = false"
      @toggle-collapse="collapsed = !collapsed"
    />

    <div
      class="h-screen overflow-hidden flex flex-col pt-[56px] lg:pt-0 transition-[margin] duration-300"
      :class="collapsed ? 'lg:ml-16' : 'lg:ml-[220px]'"
    >
      <main class="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-10 bg-background-100">
        <RouterView />
      </main>
    </div>
  </div>
</template>
