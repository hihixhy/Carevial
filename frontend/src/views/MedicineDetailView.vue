<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { medicines as mockMedicines, reminders as mockReminders } from '../mocks/dashboard.js'

const categoryStyles = {
  处方药: 'bg-background-100 text-foreground-600 border-background-200',
  非处方药: 'bg-primary-50 text-primary-700 border-primary-100',
  保健品: 'bg-background-100 text-foreground-600 border-background-200'
}

function getDaysUntilExpiry(dateStr) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const weekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const route = useRoute()

const medicine = computed(() => mockMedicines.find((m) => m.id === route.params.id) || null)

const relatedReminders = computed(() => {
  if (!medicine.value) return []
  return mockReminders.filter((r) => r.medicineId === medicine.value.id)
})

const daysUntilExpiry = computed(() =>
  medicine.value?.expirationDate ? getDaysUntilExpiry(medicine.value.expirationDate) : null
)
</script>

<template>
  <div v-if="!medicine" class="max-w-3xl mx-auto pt-20 text-center">
    <div
      class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
    >
      <i class="ri-error-warning-line text-2xl text-foreground-300" />
    </div>
    <p class="text-[15px] text-foreground-400 font-medium mb-4">药品不存在或已删除</p>
    <RouterLink
      to="/dashboard/medicines"
      class="inline-flex items-center gap-2 px-5 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-600 text-[13px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap"
    >
      <i class="ri-arrow-left-line text-sm" />
      返回药品列表
    </RouterLink>
  </div>

  <div v-else class="max-w-3xl mx-auto space-y-6 md:space-y-8">
    <div class="flex items-center justify-between">
      <RouterLink
        to="/dashboard/medicines"
        class="flex items-center gap-1.5 text-[13px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
      >
        <i class="ri-arrow-left-line text-sm" />
        返回
      </RouterLink>
    </div>

    <div class="bg-white border border-background-200 rounded-2xl p-5 md:p-6">
      <div class="flex items-start gap-5">
        <div
          class="w-24 h-24 rounded-2xl bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
        >
          <img
            v-if="medicine.imageUrl"
            :src="medicine.imageUrl"
            :alt="medicine.name"
            class="w-full h-full object-cover"
          />
          <i v-else class="ri-capsule-line text-[32px] text-foreground-300" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-[20px] md:text-[22px] font-bold text-foreground-900">
              {{ medicine.name }}
            </h1>
            <span
              class="text-[12px] font-semibold px-3 py-1 rounded-full border"
              :class="categoryStyles[medicine.category]"
            >
              {{ medicine.category }}
            </span>
            <span
              v-if="daysUntilExpiry !== null && daysUntilExpiry <= 30"
              class="text-[12px] font-semibold px-3 py-1 rounded-full"
              :class="
                daysUntilExpiry <= 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              "
            >
              {{ daysUntilExpiry <= 0 ? '已过期' : `${daysUntilExpiry}天后过期` }}
            </span>
          </div>
          <p class="text-[14px] text-foreground-500">
            {{ medicine.dosage }}
            <span v-if="medicine.specification" class="text-foreground-300 ml-2">{{
              medicine.specification
            }}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div class="divide-y divide-background-100">
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">药品规格</span>
          <span class="text-[14px] text-foreground-800">{{
            medicine.specification || '未设置'
          }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">适应症</span>
          <span class="text-[14px] text-foreground-800">{{ medicine.indication || '未设置' }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">服用人员</span>
          <span class="text-[14px] text-foreground-800">{{ medicine.familyMemberName }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">用法用量</span>
          <span class="text-[14px] text-foreground-800">{{ medicine.dosage }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">有效期至</span>
          <span class="text-[14px] text-foreground-800">
            {{ medicine.expirationDate || '未设置' }}
            <span
              v-if="daysUntilExpiry !== null && daysUntilExpiry > 0"
              class="text-foreground-400 ml-1.5"
            >
              （剩余 {{ daysUntilExpiry }} 天）
            </span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="medicine.notes" class="bg-white border border-background-200 rounded-2xl p-5 md:p-6">
      <h3 class="text-[13px] font-semibold text-foreground-600 mb-2">备注</h3>
      <p class="text-[14px] text-foreground-700 leading-relaxed">{{ medicine.notes }}</p>
    </div>

    <div
      v-if="relatedReminders.length > 0"
      class="bg-white border border-background-200 rounded-2xl p-5 md:p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[14px] font-semibold text-foreground-700">关联提醒</h3>
        <RouterLink
          to="/dashboard/reminders"
          class="text-[13px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          查看全部 <i class="ri-arrow-right-line text-[12px] ml-0.5" />
        </RouterLink>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="r in relatedReminders"
          :key="r.id"
          class="inline-flex items-center gap-2 text-[13px] text-foreground-600 bg-background-50 border border-background-200 px-3 py-2 rounded-lg"
        >
          <span class="text-foreground-400">{{ weekdayLabels[r.dayOfWeek] }}</span>
          <span class="font-medium text-foreground-800">{{ r.time }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
