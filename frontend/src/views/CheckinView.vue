<script setup>
import { computed, ref } from 'vue'
import { reminders } from '../mocks/dashboard.js'

function getDateForDayOffset(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${day}`
  const isToday = offset === 0
  const display = isToday ? '今天' : `${m}月${day}日`
  return { dateStr, display, isToday }
}

function loadCheckinsForDate(dateStr) {
  try {
    const raw = localStorage.getItem(`checkin_${dateStr}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCheckinsForDate(dateStr, record) {
  localStorage.setItem(`checkin_${dateStr}`, JSON.stringify(record))
}

const daysInWeek = Array.from({ length: 7 }, (_, i) => getDateForDayOffset(i - 3))
const todayDateStr = daysInWeek.find((d) => d.isToday)?.dateStr || daysInWeek[3].dateStr

const selectedDate = ref(todayDateStr)
const checkinsForSelected = ref(loadCheckinsForDate(todayDateStr))

const weekCheckinMap = ref(
  (() => {
    const map = {}
    daysInWeek.forEach(({ dateStr }) => {
      const dayIndex = new Date(dateStr).getDay()
      const dayRems = reminders.filter((r) => r.dayOfWeek === dayIndex && r.enabled)
      const chks = loadCheckinsForDate(dateStr)
      const checked = dayRems.filter((r) => chks[r.id]).length
      map[dateStr] = { total: dayRems.length, checked }
    })
    return map
  })()
)

const selectedDayIndex = computed(() => new Date(selectedDate.value).getDay())

const dayReminders = computed(() =>
  reminders
    .filter((r) => r.dayOfWeek === selectedDayIndex.value && r.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))
)

const checkedCount = computed(
  () => dayReminders.value.filter((r) => checkinsForSelected.value[r.id]).length
)

const isToday = computed(() => selectedDate.value === todayDateStr)

function handleSelectDate(dateStr) {
  selectedDate.value = dateStr
  checkinsForSelected.value = loadCheckinsForDate(dateStr)
}

function handleToggleCheckin(reminderId) {
  const next = { ...checkinsForSelected.value }
  if (next[reminderId]) {
    delete next[reminderId]
  } else {
    next[reminderId] = true
  }
  saveCheckinsForDate(selectedDate.value, next)
  checkinsForSelected.value = next

  const dayIndex = new Date(selectedDate.value).getDay()
  const dayRems = reminders.filter((r) => r.dayOfWeek === dayIndex && r.enabled)
  const checked = dayRems.filter((r) => next[r.id]).length
  weekCheckinMap.value = {
    ...weekCheckinMap.value,
    [selectedDate.value]: { total: dayRems.length, checked }
  }
}
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
            {{ weekCheckinMap[dateStr].checked }}/{{ weekCheckinMap[dateStr].total }}
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
            v-if="dayReminders.length > 0 && checkedCount >= dayReminders.length"
            class="text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <i class="ri-check-double-line text-[13px]"></i>
            全部完成
          </span>
          <span
            class="text-[12px] font-semibold text-foreground-400 bg-background-100 px-3 py-1 rounded-full"
          >
            <span class="text-primary-600 font-semibold">{{ checkedCount }}</span>
            <span class="text-foreground-300">/{{ dayReminders.length }}</span>
            {{ ' ' }}已打卡
          </span>
        </div>
      </div>

      <div v-if="dayReminders.length === 0" class="px-6 pb-12 text-center">
        <p class="text-[32px] md:text-[40px] mb-3 text-foreground-200">☕</p>
        <p class="text-[14px] md:text-[15px] text-foreground-400 font-medium">当天没有用药安排</p>
        <p class="text-[12px] text-foreground-300 mt-1">试试在"用药提醒"中为这天添加提醒</p>
      </div>

      <div v-else class="px-4 md:px-6 pb-4 md:pb-6">
        <div class="relative">
          <div
            class="absolute left-[52px] md:left-[60px] top-3 bottom-3 w-[2px] bg-background-200 rounded-full"
          />
          <div class="space-y-3">
            <div
              v-for="reminder in dayReminders"
              :key="reminder.id"
              class="flex items-center gap-3 md:gap-5 py-3 group"
            >
              <div
                class="w-[44px] md:w-[48px] text-right flex-shrink-0 flex items-center justify-end h-10"
              >
                <span
                  :class="[
                    'text-[13px] md:text-[14px] font-semibold tabular-nums transition-colors leading-none',
                    checkinsForSelected[reminder.id] ? 'text-foreground-300' : 'text-foreground-600'
                  ]"
                >
                  {{ reminder.time }}
                </span>
              </div>
              <div
                class="relative flex-shrink-0 z-10 flex items-center justify-center w-3 h-10"
              >
                <div
                  :class="[
                    'w-3 h-3 rounded-full ring-[3px] transition-all duration-300',
                    checkinsForSelected[reminder.id]
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
                      checkinsForSelected[reminder.id]
                        ? 'bg-emerald-50/60 border-emerald-100'
                        : 'bg-background-50 border-transparent hover:bg-background-100/80 hover:border-background-200'
                    ]"
                    @click="handleToggleCheckin(reminder.id)"
                  >
                    <p
                      :class="[
                        'text-[14px] md:text-[15px] font-semibold transition-all leading-none',
                        checkinsForSelected[reminder.id]
                          ? 'text-foreground-400 line-through'
                          : 'text-foreground-900'
                      ]"
                    >
                      {{ reminder.medicineName }}
                    </p>
                  </button>
                  <button
                    :class="[
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all cursor-pointer',
                      checkinsForSelected[reminder.id]
                        ? 'bg-emerald-500 text-white'
                        : 'text-foreground-300 hover:text-primary-600 hover:bg-primary-50'
                    ]"
                    :title="checkinsForSelected[reminder.id] ? '取消打卡' : '打卡'"
                    @click="handleToggleCheckin(reminder.id)"
                  >
                    <i
                      :class="[
                        'text-[16px]',
                        checkinsForSelected[reminder.id] ? 'ri-check-fill' : 'ri-check-line'
                      ]"
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
