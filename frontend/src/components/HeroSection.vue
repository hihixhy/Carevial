<script setup>
import { onMounted, ref } from 'vue'
import HeroIllustration from './HeroIllustration.vue'

defineEmits(['start'])

const mounted = ref(false)

onMounted(() => {
  setTimeout(() => (mounted.value = true), 80)
})
</script>

<template>
  <section class="relative min-h-screen flex items-center pt-14 px-6 overflow-hidden">
    <div class="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-8 items-center">
      <div
        class="transition-all duration-700 ease-out"
        :class="mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <div
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary-300/50 bg-primary-50/40 mb-8"
        >
          <span class="text-[12px] font-medium text-primary-700">智能用药新方式</span>
          <i class="ri-arrow-right-line text-[11px] text-primary-600" />
        </div>

        <h1
          class="font-heading text-[44px] sm:text-[56px] md:text-[68px] font-medium leading-[1.06] tracking-tight mb-6"
        >
          家庭用药<br />
          <span class="italic">从未如此简单</span>
        </h1>

        <p
          class="text-[15px] md:text-[17px] text-foreground-500 leading-relaxed max-w-[460px] mb-10"
        >
          智能提醒、过期预警、家庭档案、AI 顾问 — 为每一位家庭成员的健康保驾护航。
        </p>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            class="px-6 py-3 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[14px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-2"
            @click="$emit('start')"
          >
            免费体验
            <i class="ri-arrow-right-line text-[15px]" />
          </button>
          <a
            href="#features"
            class="px-6 py-3 text-[14px] font-medium text-foreground-700 hover:text-foreground-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
          >
            了解更多
            <i class="ri-arrow-down-line text-[13px]" />
          </a>
        </div>
      </div>

      <div
        class="hidden md:flex items-center justify-center transition-all duration-700 delay-200 ease-out"
        :class="mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
      >
        <HeroIllustration />
      </div>
    </div>
  </section>
</template>
