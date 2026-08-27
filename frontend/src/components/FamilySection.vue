<script setup>
import { useInView } from '../composables/useInView'

const { target, inView } = useInView()

const members = [
  { name: '爸爸', age: '62 岁', meds: '3 种', color: 'bg-foreground-100 text-foreground-700' },
  { name: '妈妈', age: '58 岁', meds: '2 种', color: 'bg-primary-50 text-primary-700' },
  { name: '小宝', age: '6 岁', meds: '1 种', color: 'bg-background-100 text-foreground-600' }
]
</script>

<template>
  <section id="how" class="py-24 md:py-32 px-6 bg-background-100/40">
    <div
      ref="target"
      class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center transition-all duration-700"
      :class="inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
    >
      <div class="relative">
        <div
          class="rounded-2xl border border-background-200 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] p-6"
        >
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <i class="ri-group-line text-primary-600 text-[15px]" />
            </div>
            <span class="text-[14px] font-semibold">家庭成员</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="member in members"
              :key="member.name"
              class="flex items-center justify-between px-4 py-3 rounded-xl border border-background-100 bg-background-50/60"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  :class="member.color"
                >
                  {{ member.name[0] }}
                </div>
                <div>
                  <p class="text-[13px] font-medium">{{ member.name }}</p>
                  <p class="text-[11px] text-foreground-400">{{ member.age }}</p>
                </div>
              </div>
              <span class="text-[11px] text-foreground-400 font-medium">{{ member.meds }}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          class="inline-block px-3 py-1 rounded-md bg-primary-50 text-[11px] font-semibold text-primary-700 mb-5"
        >
          家庭档案
        </div>
        <h2
          class="font-heading text-[28px] md:text-[38px] font-medium leading-[1.15] tracking-tight mb-5"
        >
          一人管理<br />
          <span class="italic">全家安心</span>
        </h2>
        <p class="text-[15px] text-foreground-500 leading-relaxed max-w-[420px] mb-6">
          为每位家庭成员独立建立用药档案。老人的降压药、孩子的维生素、全家的常备药，全部井井有条。
        </p>
        <a
          href="#"
          class="text-[13px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          了解家庭档案
          <i class="ri-arrow-right-line text-[12px]" />
        </a>
      </div>
    </div>
  </section>
</template>
