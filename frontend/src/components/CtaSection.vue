<script setup>
defineEmits(['start'])
</script>

<template>
  <section class="py-24 md:py-32 px-6 bg-background-100/40">
    <div class="max-w-2xl mx-auto text-center">
      <h2
        class="font-heading text-[32px] md:text-[44px] font-medium leading-[1.1] tracking-tight mb-5"
      >
        准备好开始了吗？
      </h2>
      <p class="text-[15px] text-foreground-500 mb-8">立即登录，体验智能用药管理的全新方式。</p>
      <button
        class="px-8 py-3.5 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[14px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-2"
        @click="$emit('start')"
      >
        开始使用
        <i class="ri-arrow-right-line text-[16px]" />
      </button>
    </div>
  </section>
</template>
