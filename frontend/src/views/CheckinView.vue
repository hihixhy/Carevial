<script setup>
import { computed, onMounted, ref } from 'vue'
import { getDayLogs, addLog, deleteLog } from '../api/medicineLog'

// 获取指定偏移量的日期对象
const getDateForDayOffset = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset) // 偏移offset天
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${day}`
  const isToday = offset === 0
  const display = isToday ? '今天' : `${m}月${day}日`
  return { dateStr, display, isToday }
}

// 生成7天数组 Array.from( 类数组, 映射回调 ) { dateStr, display, isToday }
const daysInWeek = Array.from({ length: 7 }, (_, i) => getDateForDayOffset(i - 3))
// 获取今天日期字符串
const todayDateStr = daysInWeek.find((d) => d.isToday)?.dateStr || daysInWeek[3].dateStr
// 默认选中今天
const selectedDate = ref(todayDateStr)

const loading = ref(false)
const togglingId = ref(null) // 防止连点

const dayItems = ref([])
const checkedCount = ref(0)
const total = ref(0)
const weekCheckinMap = ref({})

const isToday = computed(() => selectedDate.value === todayDateStr)

// 获取某一天的打卡记录 opts = { showLoading: boolean } 是否显示骨架屏
const loadDay = async (dateStr, opts = {}) => {
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getDayLogs(dateStr)
    const data = res.data || {}
    dayItems.value = data.items || []
    checkedCount.value = data.checkedCount || 0
    total.value = data.total || 0
    weekCheckinMap.value = {
      ...weekCheckinMap.value,
      [dateStr]: {
        checkedCount: data.checkedCount || 0,
        total: data.total || 0
      }
    }
  } catch (err) {
    ElMessage.error(err.message || '加载打卡记录失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

// 获取周进度
const loadWeekMap = async () => {
  try {
    // 并发获取7天打卡记录
    const results = await Promise.all(daysInWeek.map(({ dateStr }) => getDayLogs(dateStr)))
    const map = {}
    daysInWeek.forEach(({ dateStr }, i) => {
      const data = results[i].data || {}
      map[dateStr] = {
        checkedCount: data.checkedCount || 0,
        total: data.total || 0
      }
    })
    weekCheckinMap.value = map
  } catch (err) {
    ElMessage.error(err.message || '加载周进度失败')
  }
}

// 选择日期
const handleSelectDate = async (dateStr) => {
  selectedDate.value = dateStr
  await loadDay(dateStr)
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
        logDate: selectedDate.value
      })
    }
    await loadDay(selectedDate.value, { showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    togglingId.value = null
  }
}

onMounted(async () => {
  await loadDay(selectedDate.value)
  loadWeekMap()
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          用药打卡
        </h1>
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
      <button
        v-for="{ dateStr, display, isToday: dayIsToday } in daysInWeek"
        :key="dateStr"
        :class="[
          'flex-shrink-0 snap-start py-3 md:py-4 px-2 md:px-0 rounded-xl text-center transition-all duration-200 cursor-pointer whitespace-nowrap border min-w-[72px] md:min-w-0 md:flex-1',
          dateStr === selectedDate
            ? 'bg-primary-500 text-white border-primary-500'
            : dayIsToday
              ? 'bg-primary-50 text-primary-700 border-primary-100'
              : 'bg-white text-foreground-500 border-background-200 hover:border-background-300'
        ]"
        @click="handleSelectDate(dateStr)"
      >
        <p class="text-[13px] md:text-[14px] font-semibold">{{ display }}</p>
        <template v-if="weekCheckinMap[dateStr] && weekCheckinMap[dateStr].total > 0">
          <p
            :class="[
              'text-[11px] md:text-[12px] mt-1',
              dateStr === selectedDate ? 'text-white/70' : 'text-foreground-300'
            ]"
          >
            {{ weekCheckinMap[dateStr].checkedCount }}/{{ weekCheckinMap[dateStr].total }}
          </p>
        </template>
        <p
          v-else
          :class="[
            'text-[11px] md:text-[12px] mt-1',
            dateStr === selectedDate ? 'text-white/50' : 'text-foreground-200'
          ]"
        >
          无安排
        </p>
      </button>
    </div>

    <div class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div
        class="px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h2 class="text-[16px] md:text-[18px] font-semibold text-foreground-900 tracking-tight">
            {{ isToday ? '今天' : selectedDate }} 的用药记录
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="total > 0 && checkedCount >= total"
            class="text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <i class="ri-check-double-line text-[13px]"></i>
            全部完成
          </span>
          <span
            class="text-[12px] font-semibold text-foreground-400 bg-background-100 px-3 py-1 rounded-full"
          >
            <span class="text-primary-600 font-semibold">{{ checkedCount }}</span>
            <span class="text-foreground-300">/{{ total }}</span>
            {{ ' ' }}已打卡
          </span>
        </div>
      </div>

      <div v-if="loading" class="px-4 md:px-6 pb-4 md:pb-6">
        <el-skeleton animated>
          <template #template>
            <div class="relative">
              <div
                class="absolute left-[52px] md:left-[60px] top-3 bottom-3 w-[2px] bg-background-200 rounded-full"
              />
              <div class="space-y-3">
                <div v-for="i in 3" :key="i" class="flex items-center gap-3 md:gap-5 py-3">
                  <div
                    class="w-[44px] md:w-[48px] text-right flex-shrink-0 flex items-center justify-end h-10"
                  >
                    <el-skeleton-item variant="text" style="width: 36px; height: 14px" />
                  </div>
                  <div
                    class="relative flex-shrink-0 z-10 flex items-center justify-center w-3 h-10"
                  >
                    <el-skeleton-item
                      variant="circle"
                      style="width: 12px; height: 12px; flex-shrink: 0"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-3">
                      <el-skeleton-item
                        variant="rect"
                        class="flex-1"
                        style="height: 40px; border-radius: 12px"
                      />
                      <el-skeleton-item
                        variant="rect"
                        style="width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>

      <div v-else-if="dayItems.length === 0" class="px-6 pb-12 text-center">
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
        >
          <i class="ri-calendar-check-line text-2xl text-foreground-300"></i>
        </div>
        <p class="text-[15px] text-foreground-400 font-medium">当天没有用药安排</p>
      </div>

      <div v-else class="px-4 md:px-6 pb-4 md:pb-6">
        <div class="relative">
          <div
            class="absolute left-[52px] md:left-[60px] top-3 bottom-3 w-[2px] bg-background-200 rounded-full"
          />
          <div class="space-y-3">
            <div
              v-for="item in dayItems"
              :key="item.reminderId"
              class="flex items-center gap-3 md:gap-5 py-3 group"
            >
              <div
                class="w-[44px] md:w-[48px] text-right flex-shrink-0 flex items-center justify-end h-10"
              >
                <span
                  :class="[
                    'text-[13px] md:text-[14px] font-semibold tabular-nums transition-colors leading-none',
                    item.checked ? 'text-foreground-300' : 'text-foreground-600'
                  ]"
                >
                  {{ item.time }}
                </span>
              </div>
              <div class="relative flex-shrink-0 z-10 flex items-center justify-center w-3 h-10">
                <div
                  :class="[
                    'w-3 h-3 rounded-full ring-[3px] transition-all duration-300',
                    item.checked
                      ? 'bg-emerald-400 ring-emerald-50'
                      : 'bg-primary-400 ring-white group-hover:ring-primary-50'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3">
                  <button
                    :class="[
                      'flex-1 rounded-xl px-3 md:px-4 h-10 text-left transition-all duration-200 cursor-pointer border flex items-center',
                      item.checked
                        ? 'bg-emerald-50/60 border-emerald-100'
                        : 'bg-background-50 border-transparent hover:bg-background-100/80 hover:border-background-200'
                    ]"
                    @click="handleToggleCheckin(item)"
                  >
                    <p
                      :class="[
                        'text-[14px] md:text-[15px] font-semibold transition-all leading-none',
                        item.checked ? 'text-foreground-400 line-through' : 'text-foreground-900'
                      ]"
                    >
                      {{ item.medicineName }}
                    </p>
                  </button>
                  <button
                    :class="[
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer',
                      item.checked
                        ? 'bg-emerald-500 text-white'
                        : 'text-foreground-300 hover:text-primary-600 hover:bg-primary-50'
                    ]"
                    :title="item.checked ? '取消打卡' : '打卡'"
                    @click="handleToggleCheckin(item)"
                  >
                    <i
                      :class="['text-[16px]', item.checked ? 'ri-check-fill' : 'ri-check-line']"
                    ></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
