<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { getMedicine, deleteMedicine } from '../api/medicine.js'
import { getRemindersByMedicine } from '../api/reminder.js'
import { medicineTypeLabel } from '../utils/medicine.js'
import { diffDaysFromToday } from '../utils/date.js'

const route = useRoute()
const router = useRouter()

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const medicine = ref(null)
const relatedReminders = ref([])

const loading = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const loadRelatedReminders = async (medicineId) => {
  try {
    const res = await getRemindersByMedicine(medicineId)
    const list = res.data || []
    // 按周一 ~ 周日排序，如果同一天，按时间排序
    relatedReminders.value = [...list].sort((a, b) => {
      const dayDiff = ((a.days + 6) % 7) - ((b.days + 6) % 7)
      if (dayDiff !== 0) return dayDiff
      return a.time.localeCompare(b.time)
    })
  } catch (err) {
    ElMessage.error(err.message || '加载关联提醒失败')
    relatedReminders.value = []
  }
}

const loadMedicine = async () => {
  loading.value = true
  try {
    const res = await getMedicine(route.params.id)
    medicine.value = res.data || null
    if (medicine.value) {
      await loadRelatedReminders(medicine.value.id)
    } else {
      relatedReminders.value = []
    }
  } catch (err) {
    ElMessage.error(err.message || '加载药品详情失败')
    medicine.value = null
  } finally {
    loading.value = false
  }
}

const goEdit = () => {
  if (!medicine.value) return
  router.push({
    path: '/dashboard/medicines',
    query: { edit: String(medicine.value.id) }
  })
}

const handleDelete = async () => {
  if (!medicine.value || deleting.value) return
  deleting.value = true
  try {
    await deleteMedicine(medicine.value.id)
    ElMessage.success('删除成功')
    showDeleteConfirm.value = false
    router.push('/dashboard/medicines')
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    loadMedicine()
  }
)

onMounted(() => {
  loadMedicine()
})
</script>

<template>
  <!-- 骨架屏 -->
  <div v-if="loading" class="max-w-3xl mx-auto space-y-6 md:space-y-8">
    <el-skeleton animated>
      <template #template>
        <el-skeleton-item variant="text" style="width: 48px; height: 16px" />

        <div
          class="bg-white border border-background-200 rounded-2xl p-5 md:p-6"
          style="margin-top: 24px"
        >
          <div class="flex items-start gap-5">
            <el-skeleton-item
              variant="rect"
              style="width: 96px; height: 96px; border-radius: 16px; flex-shrink: 0"
            />
            <div class="flex-1 min-w-0 pt-1">
              <div class="flex items-center gap-3 flex-wrap mb-2">
                <el-skeleton-item variant="text" style="width: 140px; height: 24px" />
                <el-skeleton-item
                  variant="text"
                  style="width: 64px; height: 24px; border-radius: 9999px"
                />
              </div>
              <el-skeleton-item variant="text" style="width: 70%; height: 16px; margin-top: 8px" />
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-background-200 rounded-2xl overflow-hidden"
          style="margin-top: 24px"
        >
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center px-5 py-4 md:px-6 md:py-4 gap-4"
            :class="i < 5 ? 'border-b border-background-100' : ''"
          >
            <el-skeleton-item variant="text" style="width: 88px; height: 14px; flex-shrink: 0" />
            <el-skeleton-item variant="text" style="width: 40%; height: 16px" />
          </div>
        </div>
      </template>
    </el-skeleton>
  </div>

  <div v-else-if="!medicine" class="max-w-3xl mx-auto pt-20 text-center">
    <div
      class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
    >
      <i class="ri-error-warning-line text-2xl text-foreground-300" />
    </div>
    <p class="text-[15px] text-foreground-400 font-medium mb-4">药品不存在或已删除</p>
    <router-link
      to="/dashboard/medicines"
      class="inline-flex items-center gap-2 px-5 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-600 text-[13px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap"
    >
      <i class="ri-arrow-left-line text-sm" />
      返回药品列表
    </router-link>
  </div>

  <div v-else class="max-w-3xl mx-auto space-y-6 md:space-y-8">
    <div class="flex items-center justify-between">
      <router-link
        to="/dashboard/medicines"
        class="flex items-center gap-1.5 text-[13px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
      >
        <i class="ri-arrow-left-line text-sm" />
        返回
      </router-link>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-600 hover:bg-background-100 cursor-pointer transition-colors"
          @click="goEdit"
        >
          <i class="ri-pencil-line text-[16px]" />
        </button>
        <button
          type="button"
          class="w-9 h-9 rounded-lg flex items-center justify-center text-foreground-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
          @click="showDeleteConfirm = true"
        >
          <i class="ri-delete-bin-line text-[16px]" />
        </button>
      </div>
    </div>

    <div class="bg-white border border-background-200 rounded-2xl p-5 md:p-6">
      <div class="flex items-start gap-5">
        <div
          class="w-24 h-24 rounded-2xl bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
        >
          <el-image
            v-if="medicine.photoUrl"
            :src="medicine.photoUrl"
            :preview-src-list="[medicine.photoUrl]"
            fit="cover"
            class="w-full h-full cursor-zoom-in"
            :alt="medicine.name"
          />
          <i v-else class="ri-capsule-line text-[32px] text-foreground-300" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-[20px] md:text-[22px] font-bold text-foreground-900">
              {{ medicine.name }}
            </h1>
            <span
              class="text-[12px] font-semibold px-3 py-1 rounded-full border bg-primary-50 text-primary-700 border-primary-100"
            >
              {{ medicineTypeLabel(medicine.medicineType) }}
            </span>
            <span
              v-if="
                medicine.expiryDate &&
                (medicine.expiryStatus === 'expiring' || medicine.expiryStatus === 'expired')
              "
              class="text-[12px] font-semibold px-3 py-1 rounded-full"
              :class="
                medicine.expiryStatus === 'expired'
                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              "
            >
              {{
                medicine.expiryStatus === 'expired'
                  ? '已过期'
                  : `${diffDaysFromToday(medicine.expiryDate)}天后过期`
              }}
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
          <span class="text-[14px] text-foreground-800">
            {{ medicine.specification || '暂无' }}
          </span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">适应症</span>
          <span class="text-[14px] text-foreground-800">{{ medicine.indications || '暂无' }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">服用人员</span>
          <span class="text-[14px] text-foreground-800">
            {{ medicine.memberName ? medicine.memberName : '家庭公用' }}
          </span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">用法用量</span>
          <span class="text-[14px] text-foreground-800">{{ medicine.dosage || '暂无' }}</span>
        </div>
        <div class="flex items-center px-5 py-4 md:px-6 md:py-4">
          <span class="text-[13px] text-foreground-400 w-[88px] flex-shrink-0">有效期至</span>
          <span class="text-[14px] text-foreground-800">
            {{ medicine.expiryDate }}
            <span v-if="medicine.expiryStatus === 'expiring'" class="text-foreground-400 ml-1.5">
              （剩余 {{ diffDaysFromToday(medicine.expiryDate) }} 天）
            </span>
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="medicine.remark"
      class="bg-white border border-background-200 rounded-2xl p-5 md:p-6"
    >
      <h3 class="text-[13px] font-semibold text-foreground-600 mb-2">备注</h3>
      <p class="text-[14px] text-foreground-700 leading-relaxed">{{ medicine.remark }}</p>
    </div>

    <div
      v-if="relatedReminders.length > 0"
      class="bg-white border border-background-200 rounded-2xl p-5 md:p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[14px] font-semibold text-foreground-700">关联提醒</h3>
        <router-link
          to="/dashboard/reminders"
          class="text-[13px] text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
        >
          查看全部 <i class="ri-arrow-right-line text-[12px] ml-0.5" />
        </router-link>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="r in relatedReminders"
          :key="r.id"
          class="inline-flex items-center gap-2 text-[13px] text-foreground-600 bg-background-50 border border-background-200 px-3 py-2 rounded-lg"
        >
          <span class="text-foreground-400">{{ weekdayLabels[r.days] }}</span>
          <span class="font-medium text-foreground-800">{{ r.time }}</span>
        </span>
      </div>
    </div>

    <ConfirmModal
      :open="showDeleteConfirm"
      title="确认删除"
      description="删除后该药品的信息将无法恢复"
      confirm-text="删除"
      @close="showDeleteConfirm = false"
      @confirm="handleDelete"
    />
  </div>
</template>
