<script setup>
import { todayReminders } from '../../mocks/dashboard.js'
import { useMedicineCheckin } from '../../composables/useMedicineCheckin.js'

const timeGroups = [
  {
    label: '上午',
    start: '00:00',
    end: '12:00',
    icon: 'ri-sun-line',
    bg: 'bg-amber-50',
    fg: 'text-amber-600'
  },
  {
    label: '下午',
    start: '12:00',
    end: '18:00',
    icon: 'ri-sun-foggy-line',
    bg: 'bg-teal-50',
    fg: 'text-teal-600'
  },
  {
    label: '晚上',
    start: '18:00',
    end: '24:00',
    icon: 'ri-moon-line',
    bg: 'bg-indigo-50',
    fg: 'text-indigo-400'
  }
]

const { isCheckedIn, toggleCheckin, checkedCount } = useMedicineCheckin()

const sorted = [...todayReminders].sort((a, b) => a.time.localeCompare(b.time))
const total = sorted.length

const grouped = timeGroups
  .map((group) => ({
    ...group,
    items: sorted.filter((r) => r.time >= group.start && r.time < group.end)
  }))
  .filter((g) => g.items.length > 0)

const weekdayLabel = new Date().toLocaleDateString('zh-CN', { weekday: 'long' })
</script>

<template>
  <div
    v-if="todayReminders.length === 0"
    class="bg-white border border-background-200 rounded-2xl p-8 md:p-12 text-center"
  >
    <p class="text-[36px] md:text-[48px] mb-3 text-foreground-200">☕</p>
    <p class="text-[14px] md:text-[16px] text-foreground-400 font-medium">今天没有用药安排</p>
    <RouterLink
      to="/dashboard/medicines/add"
      class="text-[13px] md:text-[14px] text-primary-600 hover:text-primary-700 mt-3 inline-block font-semibold cursor-pointer"
    >
      添加药品
    </RouterLink>
  </div>

  <div v-else class="bg-white border border-background-200 rounded-2xl overflow-hidden">
    <div class="px-4 md:px-6 py-4 md:py-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-[16px] md:text-[18px] font-semibold text-foreground-900 tracking-tight">
            今日安排
          </h2>
          <p class="text-[12px] md:text-[13px] text-foreground-400 mt-1">{{ total }} 项用药提醒</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[13px] font-medium text-foreground-500">
            <span class="text-primary-600 font-semibold">{{ checkedCount }}</span>
            <span class="text-foreground-300">/{{ total }}</span>
            已打卡
          </span>
          <span
            class="text-[11px] font-bold text-foreground-400 bg-background-100 px-3 py-1.5 rounded-full tracking-wide uppercase hidden sm:inline"
          >
            {{ weekdayLabel }}
          </span>
        </div>
      </div>
    </div>

    <div class="px-4 md:px-6 pb-4 md:pb-6">
      <div class="relative">
        <div
          class="absolute left-[15px] md:left-[19px] top-4 bottom-4 w-[2px] rounded-full bg-background-200"
        />

        <div class="space-y-5">
          <div v-for="group in grouped" :key="group.label">
            <div class="flex items-center gap-2 md:gap-3 mb-4 ml-[17px] md:ml-[21px]">
              <div
                :class="`w-8 h-8 md:w-9 md:h-9 rounded-xl ${group.bg} flex items-center justify-center z-10 relative`"
              >
                <i :class="`${group.icon} text-[14px] md:text-[15px] ${group.fg}`" />
              </div>
              <span
                class="text-[11px] md:text-[12px] font-bold text-foreground-400 tracking-wider uppercase"
              >
                {{ group.label }}
              </span>
              <span class="text-[11px] text-foreground-300"> {{ group.items.length }}项 </span>
              <div class="flex-1 h-[1px] bg-background-200" />
            </div>

            <div class="space-y-0">
              <div
                v-for="reminder in group.items"
                :key="reminder.id"
                class="flex items-center gap-3 md:gap-4 py-3 group"
              >
                <div
                  class="w-[36px] md:w-[40px] text-right flex-shrink-0 flex items-center justify-end h-10"
                >
                  <span
                    :class="[
                      'text-[13px] md:text-[14px] font-bold tabular-nums transition-colors leading-none',
                      isCheckedIn(reminder.id) ? 'text-foreground-300' : 'text-foreground-500'
                    ]"
                  >
                    {{ reminder.time }}
                  </span>
                </div>

                <div class="relative flex-shrink-0 z-10 flex items-center justify-center w-3 h-10">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full ring-[3px] transition-all duration-300',
                      isCheckedIn(reminder.id)
                        ? 'bg-emerald-400 ring-emerald-50'
                        : 'bg-primary-400 ring-white group-hover:ring-primary-50'
                    ]"
                  />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 md:gap-3">
                    <button
                      type="button"
                      :class="[
                        'rounded-xl px-3 md:px-4 h-10 flex-1 text-left transition-all duration-200 cursor-pointer border flex items-center',
                        isCheckedIn(reminder.id)
                          ? 'bg-emerald-50/60 border-emerald-100'
                          : 'bg-background-50 border-transparent hover:bg-background-100/80 hover:border-background-200'
                      ]"
                      @click="toggleCheckin(reminder.id)"
                    >
                      <p
                        :class="[
                          'text-[14px] md:text-[15px] font-semibold transition-all leading-none',
                          isCheckedIn(reminder.id)
                            ? 'text-foreground-400 line-through'
                            : 'text-foreground-900'
                        ]"
                      >
                        {{ reminder.medicineName }}
                      </p>
                    </button>
                    <button
                      type="button"
                      :class="[
                        'w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0',
                        isCheckedIn(reminder.id)
                          ? 'bg-emerald-500 text-white'
                          : 'text-foreground-300 hover:text-primary-600 hover:bg-primary-50'
                      ]"
                      :title="isCheckedIn(reminder.id) ? '取消打卡' : '打卡'"
                      @click="toggleCheckin(reminder.id)"
                    >
                      <i
                        :class="[
                          'text-[15px] md:text-[16px]',
                          isCheckedIn(reminder.id) ? 'ri-check-fill' : 'ri-check-line'
                        ]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
