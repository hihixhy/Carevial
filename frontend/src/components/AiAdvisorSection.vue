<script setup>
import { useInView } from '../composables/useInView'

const { target, inView } = useInView()
</script>

<template>
  <section class="py-24 md:py-32 px-6">
    <div
      ref="target"
      class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center transition-all duration-700"
      :class="inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
    >
      <div class="order-2 md:order-1">
        <div
          class="inline-block px-3 py-1 rounded-md bg-primary-50 text-[11px] font-semibold text-primary-700 mb-5"
        >
          AI 顾问
        </div>
        <h2
          class="font-heading text-[28px] md:text-[38px] font-medium leading-[1.15] tracking-tight mb-5"
        >
          有疑问？<br />
          <span class="italic">随时问 AI</span>
        </h2>
        <p class="text-[15px] text-foreground-500 leading-relaxed max-w-[420px] mb-6">
          药品怎么吃、能不能一起吃、有什么副作用 —— AI 顾问基于你的用药记录，给出个性化的专业建议。
        </p>
        <a
          href="#"
          class="text-[13px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          了解 AI 顾问
          <i class="ri-arrow-right-line text-[12px]" />
        </a>
      </div>

      <div class="order-1 md:order-2 relative">
        <div
          class="rounded-2xl border border-background-200 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] p-6"
        >
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <i class="ri-brain-line text-primary-600 text-[15px]" />
            </div>
            <span class="text-[14px] font-semibold">AI 顾问</span>
          </div>

          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div
                class="w-7 h-7 rounded-full bg-foreground-100 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <span class="text-[10px] font-bold text-foreground-600">我</span>
              </div>
              <div
                class="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-background-50 border border-background-100"
              >
                <p class="text-[12px] text-foreground-600">维生素 D3 和钙片可以一起吃吗？</p>
              </div>
            </div>

            <div class="flex items-start gap-3 flex-row-reverse">
              <div
                class="w-7 h-7 rounded-full bg-foreground-900 flex items-center justify-center flex-shrink-0 mt-0.5"
              >
                <i class="ri-sparkling-line text-background-50 text-[10px]" />
              </div>
              <div
                class="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary-50 border border-primary-100"
              >
                <p class="text-[12px] text-foreground-700 leading-relaxed">
                  可以一起吃，两者还有协同作用。维生素 D3 能促进钙的吸收，建议早餐后服用效果更佳。
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <div
                class="flex-1 h-9 rounded-xl bg-background-50 border border-background-100 flex items-center px-3"
              >
                <span class="text-[12px] text-foreground-300">输入你的问题...</span>
              </div>
              <div class="w-8 h-8 rounded-lg bg-foreground-900 flex items-center justify-center">
                <i class="ri-send-plane-line text-background-50 text-[13px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
