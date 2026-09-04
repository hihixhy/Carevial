<script setup>
import StatsCards from '../components/home/StatsCards.vue'
import TodayMedicineTimeline from '../components/home/TodayMedicineTimeline.vue'
import ExpiringAlert from '../components/home/ExpiringAlert.vue'
import QuickActions from '../components/home/QuickActions.vue'
import AiBanner from '../components/home/AiBanner.vue'

const dateLine = new Date().toLocaleDateString('zh-CN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <p class="text-[13px] text-foreground-400 font-medium mb-4 md:mb-6">
      {{ dateLine }}
    </p>

    <AiBanner />

    <div class="mt-5 md:mt-6">
      <StatsCards />
    </div>

    <div class="flex flex-col lg:flex-row gap-4 md:gap-6 mt-6 md:mt-8">
      <div class="flex-1 min-w-0">
        <TodayMedicineTimeline />
      </div>

      <div class="w-full lg:w-[300px] flex-shrink-0 space-y-4 md:space-y-5">
        <ExpiringAlert />
        <QuickActions />
      </div>
    </div>
  </div>
</template>
