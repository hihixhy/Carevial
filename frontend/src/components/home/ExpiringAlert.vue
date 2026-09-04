<script setup>
import { expiringMedicines } from '../../mocks/dashboard.js'

function getDaysUntilExpiry(dateStr) {
  const expiry = new Date(dateStr)
  const now = new Date()
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const sorted =
  expiringMedicines.length === 0
    ? []
    : [...expiringMedicines].sort((a, b) => {
        return getDaysUntilExpiry(a.expirationDate) - getDaysUntilExpiry(b.expirationDate)
      })

const hasUrgent = sorted.some((m) => getDaysUntilExpiry(m.expirationDate) <= 7)
const urgentCount = sorted.filter((m) => getDaysUntilExpiry(m.expirationDate) <= 7).length
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
        {{ hasUrgent ? '⚠ 过期提醒' : '过期提醒' }}
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
      <RouterLink
        v-for="med in sorted"
        :key="med.id"
        :to="`/dashboard/medicines`"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer',
          getDaysUntilExpiry(med.expirationDate) <= 7
            ? 'hover:bg-rose-100/60'
            : 'hover:bg-background-100'
        ]"
      >
        <div
          :class="[
            'w-2 h-2 rounded-full flex-shrink-0',
            getDaysUntilExpiry(med.expirationDate) <= 0
              ? 'bg-rose-500'
              : getDaysUntilExpiry(med.expirationDate) <= 7
                ? 'bg-rose-400'
                : 'bg-amber-400'
          ]"
        />

        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-foreground-800 truncate">
            {{ med.name }}
          </p>
          <p class="text-[11px] text-foreground-400 truncate">
            {{ med.familyMemberName }}
          </p>
        </div>

        <div
          :class="[
            'flex-shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full',
            getDaysUntilExpiry(med.expirationDate) <= 0
              ? 'bg-rose-500 text-white'
              : getDaysUntilExpiry(med.expirationDate) <= 7
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-50 text-amber-700'
          ]"
        >
          {{
            getDaysUntilExpiry(med.expirationDate) <= 0
              ? '已过期'
              : `${getDaysUntilExpiry(med.expirationDate)} 天`
          }}
        </div>
      </RouterLink>
    </div>

    <p class="text-[11px] text-foreground-300 mt-3 text-center">点击查看药品详情</p>
  </div>
</template>
