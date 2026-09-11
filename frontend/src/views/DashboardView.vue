<script setup>
import { onMounted, ref } from 'vue'
import StatsCards from '../components/home/StatsCards.vue'
import TodayMedicineTimeline from '../components/home/TodayMedicineTimeline.vue'
import ExpiringAlert from '../components/home/ExpiringAlert.vue'
import QuickActions from '../components/home/QuickActions.vue'
import AiBanner from '../components/home/AiBanner.vue'
import { getMedicines } from '../api/medicine'
import { getFamilyMembers } from '../api/family'
import { getDayLogs, addLog, deleteLog } from '../api/medicineLog'
import { getTodayDateStr, getDateLine } from '../utils/date'

const dateLine = getDateLine()
// 获取今日日期字符串
const todayDateStr = getTodayDateStr()
const medicines = ref([])
const members = ref([])
const todayItems = ref([])
const checkedCount = ref(0)
const total = ref(0)

const loading = ref(true)
const togglingId = ref(null)

const loadMedicines = async () => {
  try {
    const res = await getMedicines()
    medicines.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载药品列表失败')
  }
}

const loadMembers = async () => {
  try {
    const res = await getFamilyMembers()
    members.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载家庭成员列表失败')
  }
}

const loadTodayLogs = async (opts = {}) => {
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getDayLogs(todayDateStr)
    const data = res.data || {}
    todayItems.value = data.items || []
    checkedCount.value = data.checkedCount || 0
    total.value = data.total || 0
  } catch (err) {
    ElMessage.error(err.message || '加载打卡记录失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

const handleToggleCheckin = async (item) => {
  if (togglingId.value != null) return
  togglingId.value = item.reminderId
  try {
    if (item.checked) {
      if (!item.logId) return
      await deleteLog(item.logId)
    } else {
      await addLog({
        reminderId: item.reminderId,
        logDate: todayDateStr
      })
    }
    await loadTodayLogs({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    togglingId.value = null
  }
}

onMounted(async () => {
  await Promise.all([loadMedicines(), loadMembers(), loadTodayLogs()])
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <p class="text-[13px] text-foreground-400 font-medium mb-4 md:mb-6">
      {{ dateLine }}
    </p>

    <AiBanner />

    <div class="mt-5 md:mt-6">
      <StatsCards
        :medicines="medicines"
        :members="members"
        :checked-count="checkedCount"
        :total="total"
      />
    </div>

    <div class="flex flex-col lg:flex-row gap-4 md:gap-6 mt-6 md:mt-8">
      <div class="flex-1 min-w-0">
        <TodayMedicineTimeline
          :items="todayItems"
          :checked-count="checkedCount"
          :total="total"
          :loading="loading"
          :toggling-id="togglingId"
          @toggle="handleToggleCheckin"
        />
      </div>

      <div class="w-full lg:w-[300px] flex-shrink-0 space-y-4 md:space-y-5">
        <ExpiringAlert :medicines="medicines" />
        <QuickActions />
      </div>
    </div>
  </div>
</template>
