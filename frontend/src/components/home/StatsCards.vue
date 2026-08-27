<script setup>
import { computed } from 'vue'
import { medicines, familyMembers, reminders, expiringMedicines } from '../../mocks/dashboard.js'
import { useMedicineCheckin } from '../../composables/useMedicineCheckin.js'

const todayDayOfWeek = new Date().getDay()
const todayTotal = reminders.filter((r) => r.dayOfWeek === todayDayOfWeek && r.enabled).length
const { checkedCount } = useMedicineCheckin()

const stats = computed(() => [
  { label: '药品', value: medicines.length, icon: 'ri-capsule-line', color: 'text-emerald-600' },
  { label: '家人', value: familyMembers.length, icon: 'ri-group-line', color: 'text-amber-600' },
  {
    label: '今日打卡',
    value: todayTotal > 0 ? `${checkedCount.value}/${todayTotal}` : '-',
    icon: 'ri-check-double-line',
    color: 'text-teal-600'
  },
  {
    label: '即将过期',
    value: expiringMedicines.length,
    icon: 'ri-error-warning-line',
    color: 'text-rose-500'
  }
])
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="group bg-white border border-background-200 rounded-2xl px-4 md:px-5 py-4 md:py-5 hover:border-background-300 transition-colors duration-200 cursor-default"
    >
      <p
        class="text-[28px] md:text-[38px] font-bold text-foreground-900 tracking-tighter leading-none tabular-nums"
      >
        {{ stat.value }}
      </p>
      <div class="flex items-center gap-2 mt-2 md:mt-3">
        <i :class="`${stat.icon} text-[16px] md:text-[18px] ${stat.color}`" />
        <p class="text-[11px] md:text-[12px] font-semibold text-foreground-400 tracking-wide">
          {{ stat.label }}
        </p>
      </div>
    </div>
  </div>
</template>
