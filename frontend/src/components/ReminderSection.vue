<script setup>
import { useInView } from '../composables/useInView'

const { target, inView } = useInView()

const reminders = [
  { time: '08:00', med: '维生素 D3', dose: '1 粒', status: 'done' },
  { time: '12:30', med: '降压药', dose: '半片', status: 'now' },
  { time: '14:00', med: '感冒药', dose: '1 袋', status: 'upcoming' },
  { time: '20:00', med: '钙片', dose: '2 粒', status: 'upcoming' }
]

function rowClass(status) {
  if (status === 'now') return 'bg-primary-50/50 border-primary-200/40'
  if (status === 'done') return 'bg-background-50/60 border-background-100 opacity-60'
  return 'bg-background-50/60 border-background-100'
}

function timeClass(status) {
  if (status === 'done') return 'text-foreground-300'
  if (status === 'now') return 'text-primary-600'
  return 'text-foreground-400'
}

function badgeClass(status) {
  if (status === 'done') return 'bg-primary-100 text-primary-600'
  if (status === 'now') return 'bg-foreground-800 text-white'
  return 'bg-background-200 text-foreground-300'
}

function badgeIcon(status) {
  if (status === 'done') return 'ri-check-line'
  if (status === 'now') return 'ri-time-line'
  return 'ri-circle-line'
}
</script>

<template>
  <section id="features" class="py-24 md:py-32 px-6">
    <div
      ref="target"
      class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center transition-all duration-700"
      :class="inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
    >
      <div class="order-2 md:order-1">
        <div
          class="inline-block px-3 py-1 rounded-md bg-primary-50 text-[11px] font-semibold text-primary-700 mb-5"
        >
          智能提醒
        </div>
        <h2
          class="font-heading text-[28px] md:text-[38px] font-medium leading-[1.15] tracking-tight mb-5"
        >
          不再错过<br />
          <span class="italic">每一次用药</span>
        </h2>
        <p class="text-[15px] text-foreground-500 leading-relaxed max-w-[420px] mb-6">
          自定义提醒时间、频率与方式。餐前、餐后、睡前 —— Carevial
          会在正确的时间，以温柔的方式提醒你。
        </p>
        <a
          href="#"
          class="text-[13px] font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          了解提醒功能
          <i class="ri-arrow-right-line text-[12px]" />
        </a>
      </div>

      <div class="order-1 md:order-2 relative">
        <div
          class="rounded-2xl border border-background-200 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)] p-6"
        >
          <div class="flex items-center gap-2 mb-5">
            <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <i class="ri-alarm-warning-line text-primary-600 text-[15px]" />
            </div>
            <span class="text-[14px] font-semibold">今日提醒</span>
          </div>
          <div class="space-y-2.5">
            <div
              v-for="item in reminders"
              :key="item.time"
              class="flex items-center gap-3 px-3.5 py-3 rounded-xl border"
              :class="rowClass(item.status)"
            >
              <div class="w-9 text-center text-[11px] font-mono" :class="timeClass(item.status)">
                {{ item.time }}
              </div>
              <div class="flex-1">
                <p
                  class="text-[13px]"
                  :class="
                    item.status === 'done'
                      ? 'text-foreground-400 line-through'
                      : 'text-foreground-700'
                  "
                >
                  {{ item.med }}
                </p>
                <p class="text-[10px] text-foreground-400">{{ item.dose }}</p>
              </div>
              <div
                class="w-5 h-5 rounded-full flex items-center justify-center"
                :class="badgeClass(item.status)"
              >
                <i class="text-[9px]" :class="badgeIcon(item.status)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
