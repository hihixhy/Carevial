<template>
  <RouterLink
    to="/dashboard/ai"
    class="fixed bottom-6 right-6 z-40 group flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white pl-3 pr-4 py-2.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
  >
    <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      <i class="ri-bubble-chart-line text-[16px]" />
    </div>
    <span class="text-[13px] font-semibold whitespace-nowrap">AI 助手</span>

    <div
      class="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-30 pointer-events-none"
      style="animation-duration: 2s"
    />
  </RouterLink>
</template>
