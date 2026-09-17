<script setup>
import { computed } from 'vue'
import { diffDaysFromToday } from '../../utils/date'

const props = defineProps({
  medicines: { type: Array, required: true }
})

const expiringMedicines = computed(() => {
  return props.medicines.filter((m) => m.expiryStatus === 'expiring')
})
// 浅拷贝，避免修改原数组 按剩余天数排序
const sorted = computed(() =>
  [...expiringMedicines.value].sort(
    (a, b) => diffDaysFromToday(a.expiryDate) - diffDaysFromToday(b.expiryDate)
  )
)
// 7天内过期为紧急状态
const hasUrgent = computed(() => sorted.value.some((m) => diffDaysFromToday(m.expiryDate) <= 7))
const urgentCount = computed(
  () => sorted.value.filter((m) => diffDaysFromToday(m.expiryDate) <= 7).length
)
</script>

<template>
  <div
    v-if="sorted.length > 0"
    :class="[
      'rounded-2xl p-5 border transition-colors',
      hasUrgent ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-background-200'
    ]"
  >
    <div class="flex items-center gap-2 mb-3">
      <span v-if="hasUrgent" class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      <p class="text-[11px] font-bold text-foreground-400 tracking-wider uppercase">
        {{ hasUrgent ? '⚠ 即将过期提醒' : '即将过期提醒' }}
      </p>
      <span
        v-if="hasUrgent"
        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white"
      >
        {{ urgentCount }} 项紧急
      </span>
      <span
        class="text-[10px] font-semibold text-foreground-300 ml-auto bg-background-100 px-2 py-0.5 rounded-full"
      >
        {{ sorted.length }} 项
      </span>
    </div>

    <div class="space-y-1.5">
      <router-link
        v-for="med in sorted"
        :key="med.id"
        :to="`/dashboard/medicines`"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer',
          diffDaysFromToday(med.expiryDate) <= 7
            ? 'hover:bg-rose-100/60'
            : 'hover:bg-background-100'
        ]"
      >
        <div
          :class="[
            'w-2 h-2 rounded-full flex-shrink-0',
            diffDaysFromToday(med.expiryDate) <= 7 ? 'bg-rose-400' : 'bg-amber-400'
          ]"
        />

        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-foreground-800 truncate">
            {{ med.name }}
          </p>
          <p class="text-[11px] text-foreground-400 truncate">
            {{ med.memberName || '家庭公用' }}
          </p>
        </div>

        <div
          :class="[
            'flex-shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full',
            diffDaysFromToday(med.expiryDate) <= 7
              ? 'bg-rose-100 text-rose-700'
              : 'bg-amber-50 text-amber-700'
          ]"
        >
          {{
            diffDaysFromToday(med.expiryDate) === 0
              ? '今天'
              : `${diffDaysFromToday(med.expiryDate)} 天`
          }}
        </div>
      </router-link>
    </div>

    <p class="text-[11px] text-foreground-300 mt-3 text-center">点击查看药品详情</p>
  </div>
</template>
