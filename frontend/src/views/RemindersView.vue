<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { getReminders, addReminder, updateReminder, deleteReminder } from '../api/reminder'
import { getMedicines } from '../api/medicine'
import { isIdValid, isDayValid, isDaysArrayValid, isTimeValid } from '../utils/validate'
import ConfirmModal from '../components/ConfirmModal.vue'

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
// 星期索引0-6
const todayDayIndex = new Date().getDay()

const DAY_PRESETS = [
  { label: '每天', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: '工作日', days: [1, 2, 3, 4, 5] },
  { label: '周末', days: [0, 6] },
  { label: '一三五', days: [1, 3, 5] },
  { label: '二四六', days: [2, 4, 6] }
]

const reminders = ref([])
const medicines = ref([])

const loading = ref(true)
const submitting = ref(false)
const deleting = ref(false)
const selectedDay = ref(todayDayIndex)
const showAddModal = ref(false)
const showEditModal = ref(false)

const editingId = ref(null)
const deletingId = ref(null)

const addForm = ref({ medicineId: '', days: [], time: '08:00', enabled: true })
const editForm = ref({ medicineId: '', days: 0, time: '08:00', enabled: true })
const addError = ref('')
const editError = ref('')

watch(
  addForm,
  () => {
    addError.value = ''
  },
  { deep: true }
)

watch(
  editForm,
  () => {
    editError.value = ''
  },
  { deep: true }
)

// 获取当天提醒列表并按时间从小到大排序
const dayReminders = computed(() =>
  reminders.value
    .filter((r) => r.days === selectedDay.value)
    .sort((a, b) => a.time.localeCompare(b.time))
)

// 计算每天的提醒数量
const reminderCountByDay = computed(() =>
  WEEKDAYS.map((_, idx) => reminders.value.filter((r) => r.days === idx).length)
)

// opts = { showLoading: boolean } 是否显示骨架屏
const loadReminders = async (opts = {}) => {
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getReminders()
    reminders.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载提醒列表失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

const loadMedicines = async () => {
  try {
    const res = await getMedicines()
    medicines.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载药品列表失败')
  }
}

const toggleDayInAddForm = (dayIndex) => {
  const days = addForm.value.days
  addForm.value = {
    ...addForm.value,
    days: days.includes(dayIndex)
      ? days.filter((d) => d !== dayIndex)
      : [...days, dayIndex].sort((a, b) => a - b)
  }
  addError.value = ''
}

const selectAllDays = () => {
  addForm.value = { ...addForm.value, days: [0, 1, 2, 3, 4, 5, 6] }
  addError.value = ''
}

const clearAllDays = () => {
  addForm.value = { ...addForm.value, days: [] }
}

// 应用预设日期
const applyDayPreset = (days) => {
  addForm.value = { ...addForm.value, days: [...days].sort((a, b) => a - b) }
  addError.value = ''
}

// 判断预设日期是否被选中
const isPresetActive = (days) => {
  return JSON.stringify([...addForm.value.days].sort()) === JSON.stringify([...days].sort())
}

const openAddModal = () => {
  addForm.value = { medicineId: '', days: [], time: '08:00', enabled: true }
  addError.value = ''
  showAddModal.value = true
}

const handleAdd = async () => {
  if (submitting.value) return
  addError.value = ''
  if (!isIdValid(addForm.value.medicineId)) {
    addError.value = '请选择药品'
    return
  }
  if (!isDaysArrayValid(addForm.value.days)) {
    addError.value = '请至少选择一个日期'
    return
  }
  if (!isTimeValid(addForm.value.time)) {
    addError.value = '请选择有效时间'
    return
  }

  submitting.value = true
  try {
    await addReminder({
      medicineId: Number(addForm.value.medicineId),
      time: addForm.value.time,
      days: addForm.value.days, // 数组
      enabled: addForm.value.enabled
    })
    ElMessage.success('添加提醒成功')
    showAddModal.value = false
    addForm.value = { medicineId: '', days: [], time: '08:00', enabled: true }
    addError.value = ''
    await loadReminders({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '添加提醒失败')
  } finally {
    submitting.value = false
  }
}

const openEditModal = (reminder) => {
  editingId.value = reminder.id
  editError.value = ''
  editForm.value = {
    medicineId: reminder.medicineId,
    days: reminder.days,
    time: reminder.time,
    enabled: reminder.enabled
  }
  showEditModal.value = true
}

const handleSaveEdit = async () => {
  if (!editingId.value || submitting.value) return
  editError.value = ''
  if (!isIdValid(editForm.value.medicineId)) {
    editError.value = '请选择药品'
    return
  }
  if (!isDayValid(editForm.value.days)) {
    editError.value = '请选择日期'
    return
  }
  if (!isTimeValid(editForm.value.time)) {
    editError.value = '请选择有效时间'
    return
  }

  submitting.value = true
  try {
    await updateReminder(editingId.value, {
      medicineId: Number(editForm.value.medicineId),
      time: editForm.value.time,
      days: Number(editForm.value.days), // 单个
      enabled: editForm.value.enabled
    })
    ElMessage.success('保存成功')
    showEditModal.value = false
    editingId.value = null
    editError.value = ''
    await loadReminders({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '编辑提醒失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!deletingId.value || deleting.value) return
  deleting.value = true
  try {
    await deleteReminder(deletingId.value)
    ElMessage.success('删除成功')
    deletingId.value = null
    await loadReminders({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 切换提醒状态
const toggleEnabled = async (reminder) => {
  try {
    await updateReminder(reminder.id, {
      medicineId: reminder.medicineId,
      time: reminder.time,
      days: reminder.days,
      enabled: !reminder.enabled
    })
    await loadReminders({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '切换提醒状态失败')
  }
}

// 计算选中药品的名称
const selectedMedicineName = computed(
  () => medicines.value.find((m) => m.id === Number(addForm.value.medicineId))?.name
)

onMounted(async () => {
  await Promise.all([loadReminders(), loadMedicines()])
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          用药提醒
        </h1>
      </div>
      <button
        class="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap self-start"
        @click="openAddModal"
      >
        <i class="ri-add-line text-sm"></i>
        添加提醒
      </button>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
      <button
        v-for="(day, idx) in WEEKDAYS"
        :key="idx"
        :class="[
          'flex-shrink-0 snap-start py-3 px-2 md:px-0 rounded-xl text-center transition-all duration-200 cursor-pointer whitespace-nowrap border min-w-[72px] md:min-w-0 md:flex-1',
          idx === selectedDay
            ? 'bg-primary-500 text-white border-primary-500'
            : idx === todayDayIndex
              ? 'bg-primary-50 text-primary-700 border-primary-100'
              : 'bg-white text-foreground-500 border-background-200 hover:border-background-300'
        ]"
        @click="selectedDay = idx"
      >
        <p class="text-[13px] md:text-[14px] font-semibold">{{ day }}</p>
        <p
          :class="[
            'text-[11px] md:text-[12px] mt-0.5',
            idx === selectedDay ? 'text-white/70' : 'text-foreground-300'
          ]"
        >
          {{ reminderCountByDay[idx] > 0 ? `${reminderCountByDay[idx]} 项` : '无' }}
        </p>
      </button>
    </div>

    <div class="bg-white border border-background-200 rounded-2xl overflow-hidden">
      <div
        class="px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <h2 class="text-[16px] md:text-[18px] font-semibold text-foreground-900 tracking-tight">
            {{ WEEKDAYS[selectedDay] }}的提醒
          </h2>
        </div>
        <span
          class="text-[12px] font-semibold text-foreground-400 bg-background-100 px-3 py-1 rounded-full self-start"
        >
          {{ dayReminders.length }} 项
        </span>
      </div>

      <div v-if="loading" class="px-4 md:px-6 pb-4 md:pb-6">
        <el-skeleton animated>
          <template #template>
            <div class="relative">
              <div
                class="absolute left-[52px] md:left-[60px] top-3 bottom-3 w-[2px] bg-background-200 rounded-full"
              />
              <div class="space-y-3">
                <div v-for="i in 3" :key="i" class="flex items-center gap-3 md:gap-5 py-4">
                  <div
                    class="w-[44px] md:w-[48px] flex-shrink-0 flex items-center justify-end h-10"
                  >
                    <el-skeleton-item variant="text" style="width: 36px; height: 14px" />
                  </div>
                  <div
                    class="relative z-10 flex items-center justify-center w-3 h-10 flex-shrink-0"
                  >
                    <el-skeleton-item
                      variant="circle"
                      style="width: 12px; height: 12px; flex-shrink: 0"
                    />
                  </div>
                  <div class="flex-1 min-w-0 flex items-center justify-between gap-3 h-10">
                    <el-skeleton-item variant="text" style="width: 112px; height: 16px" />
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <el-skeleton-item
                        variant="rect"
                        style="width: 44px; height: 24px; border-radius: 9999px"
                      />
                      <el-skeleton-item
                        variant="rect"
                        style="width: 32px; height: 32px; border-radius: 8px"
                      />
                      <el-skeleton-item
                        variant="rect"
                        style="width: 32px; height: 32px; border-radius: 8px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>

      <div v-else-if="dayReminders.length === 0" class="px-6 pb-12 text-center">
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
        >
          <i class="ri-alarm-line text-2xl text-foreground-300"></i>
        </div>
        <p class="text-[15px] text-foreground-400 font-medium">
          {{ WEEKDAYS[selectedDay] }}没有设置提醒
        </p>
        <button
          class="text-[13px] text-primary-600 hover:text-primary-700 mt-3 font-medium cursor-pointer"
          @click="openAddModal"
        >
          添加提醒
        </button>
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
              :class="[
                'flex items-center gap-3 md:gap-5 py-4 group',
                !reminder.enabled ? 'opacity-40' : ''
              ]"
            >
              <div
                class="w-[44px] md:w-[48px] text-right flex-shrink-0 flex items-center justify-end h-10"
              >
                <span
                  class="text-[13px] md:text-[14px] font-semibold text-foreground-600 tabular-nums leading-none"
                >
                  {{ reminder.time }}
                </span>
              </div>
              <div class="relative flex-shrink-0 z-10 flex items-center justify-center w-3 h-10">
                <div
                  :class="[
                    'w-3 h-3 rounded-full ring-4 group-hover:ring-primary-50 transition-all duration-200',
                    !reminder.enabled ? 'bg-background-300 ring-white' : 'bg-primary-400 ring-white'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center h-10">
                    <p
                      class="text-[14px] md:text-[15px] font-semibold text-foreground-900 leading-none"
                    >
                      {{ reminder.medicineName }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button
                      :class="[
                        'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                        reminder.enabled ? 'bg-primary-500' : 'bg-background-300'
                      ]"
                      :title="reminder.enabled ? '关闭提醒' : '开启提醒'"
                      @click="toggleEnabled(reminder)"
                    >
                      <span
                        :class="[
                          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                          reminder.enabled ? 'translate-x-[20px]' : 'translate-x-0'
                        ]"
                      />
                    </button>
                    <button
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-600 hover:bg-background-100 cursor-pointer transition-colors"
                      @click="openEditModal(reminder)"
                    >
                      <i class="ri-pencil-line text-[14px]"></i>
                    </button>
                    <button
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
                      @click="deletingId = reminder.id"
                    >
                      <i class="ri-delete-bin-line text-[14px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="showAddModal = false"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[480px] p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">添加用药提醒</h3>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="showAddModal = false"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form class="space-y-5" @submit.prevent="handleAdd">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品</label>
            <select
              v-model="addForm.medicineId"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            >
              <option value="">选择药品</option>
              <option v-for="m in medicines" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-[13px] font-semibold text-foreground-700">
                重复星期
                <span class="ml-1.5 text-[11px] font-normal text-foreground-400">（可多选）</span>
              </label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-[12px] text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                  @click="selectAllDays"
                >
                  全选
                </button>
                <span class="text-foreground-200 text-[12px]">|</span>
                <button
                  type="button"
                  class="text-[12px] text-foreground-400 hover:text-foreground-600 font-medium cursor-pointer"
                  @click="clearAllDays"
                >
                  清空
                </button>
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1.5">
              <button
                v-for="(day, idx) in WEEKDAYS"
                :key="idx"
                type="button"
                :class="[
                  'py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer border',
                  addForm.days.includes(idx)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-background-50 text-foreground-500 border-background-200 hover:border-primary-300 hover:text-primary-600'
                ]"
                @click="toggleDayInAddForm(idx)"
              >
                {{ day.replace('周', '') }}
              </button>
            </div>
            <div class="flex flex-wrap gap-2 mt-2.5">
              <button
                v-for="preset in DAY_PRESETS"
                :key="preset.label"
                type="button"
                :class="[
                  'px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-pointer border',
                  isPresetActive(preset.days)
                    ? 'bg-primary-100 text-primary-700 border-primary-200'
                    : 'bg-background-50 text-foreground-500 border-background-200 hover:border-primary-200 hover:text-primary-600'
                ]"
                @click="applyDayPreset(preset.days)"
              >
                {{ preset.label }}
              </button>
            </div>
            <p v-if="addForm.days.length > 0" class="text-[12px] text-primary-600 font-medium mt-2">
              已选：{{ addForm.days.map((d) => WEEKDAYS[d]).join('、') }}
            </p>
          </div>

          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">提醒时间</label>
            <input
              v-model="addForm.time"
              type="time"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            />
          </div>

          <p v-if="addError" class="text-[12px] text-red-500 leading-snug">
            <i class="ri-error-warning-line"></i> {{ addError }}
          </p>

          <div
            v-if="addForm.medicineId && addForm.days.length > 0"
            class="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3"
          >
            <p class="text-[12px] text-primary-700 font-medium">
              <i class="ri-information-line mr-1"></i>
              将为「{{ selectedMedicineName }}」在{{
                addForm.days.map((d) => WEEKDAYS[d]).join('、')
              }}
              {{ addForm.time }} 创建 {{ addForm.days.length }} 条提醒
            </p>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              @click="showAddModal = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              确认添加{{ addForm.days.length > 1 ? `（${addForm.days.length}天）` : '' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="showEditModal = false"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[440px] p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑用药提醒</h3>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="showEditModal = false"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form class="space-y-4" @submit.prevent="handleSaveEdit">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品</label>
            <select
              v-model="editForm.medicineId"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            >
              <option v-for="m in medicines" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2">星期</label>
              <select
                v-model.number="editForm.days"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                <option v-for="(d, i) in WEEKDAYS" :key="i" :value="i">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2">时间</label>
              <input
                v-model="editForm.time"
                type="time"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              />
            </div>
          </div>
          <div class="flex items-center justify-between py-2">
            <label class="text-[13px] font-semibold text-foreground-700">启用提醒</label>
            <button
              type="button"
              :class="[
                'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                editForm.enabled ? 'bg-primary-500' : 'bg-background-300'
              ]"
              @click="editForm.enabled = !editForm.enabled"
            >
              <span
                :class="[
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                  editForm.enabled ? 'translate-x-[20px]' : 'translate-x-0'
                ]"
              />
            </button>
          </div>

          <p v-if="editError" class="text-[12px] text-red-500 leading-snug">
            <i class="ri-error-warning-line"></i> {{ editError }}
          </p>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              @click="showEditModal = false"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmModal
      :open="deletingId !== null"
      title="确认删除"
      description="删除后该提醒将不再生效"
      confirm-text="删除"
      @close="deletingId = null"
      @confirm="handleDelete"
    />
  </div>
</template>
