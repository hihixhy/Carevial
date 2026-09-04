<script setup>
import { computed, ref } from 'vue'
import { medicines as mockMedicines, familyMembers } from '../mocks/dashboard.js'
import ConfirmModal from '../components/ConfirmModal.vue'

const categoryStyles = {
  处方药: 'bg-background-100 text-foreground-600 border-background-200',
  非处方药: 'bg-primary-50 text-primary-700 border-primary-100',
  保健品: 'bg-background-100 text-foreground-600 border-background-200'
}

function getDaysUntilExpiry(dateStr) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const localMedicines = ref([...mockMedicines])
const search = ref('')
const activeCategory = ref('全部')
const familyFilter = ref('全部')
const showEditModal = ref(false)
const editingId = ref(null)
const deletingId = ref(null)

const editingMedicine = computed(() =>
  editingId.value ? localMedicines.value.find((m) => m.id === editingId.value) : null
)

const editPhotoFile = ref(null)
const editPhotoPreview = ref(null)

const editForm = ref({
  name: '',
  category: '',
  familyMemberId: '',
  indication: '',
  specification: '',
  dosage: '',
  expirationDate: '',
  notes: ''
})

const categories = ['全部', '处方药', '非处方药', '保健品', '即将过期']

const filtered = computed(() =>
  localMedicines.value.filter((m) => {
    if (activeCategory.value === '即将过期') {
      if (!m.expirationDate) return false
      const days = getDaysUntilExpiry(m.expirationDate)
      if (days > 30) return false
    } else if (activeCategory.value !== '全部' && m.category !== activeCategory.value) {
      return false
    }
    if (familyFilter.value === 'shared') {
      if (m.familyMemberId) return false
    } else if (familyFilter.value !== '全部' && m.familyMemberId !== familyFilter.value) {
      return false
    }
    if (search.value && !m.name.includes(search.value)) {
      return false
    }
    return true
  })
)

function openEditModal(med) {
  editingId.value = med.id
  editForm.value = {
    name: med.name,
    category: med.category,
    familyMemberId: med.familyMemberId || '',
    indication: med.indication || '',
    specification: med.specification || '',
    dosage: med.dosage,
    expirationDate: med.expirationDate || '',
    notes: med.notes
  }
  editPhotoFile.value = null
  editPhotoPreview.value = med.imageUrl || null
  showEditModal.value = true
}

function handlePhotoSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  editPhotoFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    editPhotoPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleRemovePhoto() {
  editPhotoFile.value = null
  editPhotoPreview.value = null
}

function handleSaveEdit(e) {
  e.preventDefault()
  if (!editingId.value) return
  const fm = familyMembers.find((f) => f.id === editForm.value.familyMemberId)
  localMedicines.value = localMedicines.value.map((m) =>
    m.id === editingId.value
      ? {
          ...m,
          name: editForm.value.name,
          category: editForm.value.category,
          familyMemberId: editForm.value.familyMemberId || null,
          familyMemberName: fm?.name || '家庭公用',
          indication: editForm.value.indication,
          specification: editForm.value.specification,
          dosage: editForm.value.dosage,
          expirationDate: editForm.value.expirationDate || null,
          notes: editForm.value.notes,
          imageUrl: editPhotoPreview.value
        }
      : m
  )
  showEditModal.value = false
  editingId.value = null
}

function handleDelete() {
  if (!deletingId.value) return
  localMedicines.value = localMedicines.value.filter((m) => m.id !== deletingId.value)
  deletingId.value = null
}

function closeEditModal() {
  showEditModal.value = false
}

function triggerEditPhotoInput() {
  document.getElementById('edit-photo-input')?.click()
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          药品管理
        </h1>
      </div>
      <RouterLink
        to="/dashboard/medicines/add"
        class="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap self-start"
      >
        <i class="ri-add-line text-sm" />
        添加药品
      </RouterLink>
    </div>

    <div class="flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-md">
          <i
            class="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-300 text-[15px]"
          />
          <input
            v-model="search"
            type="text"
            placeholder="搜索药品名称..."
            class="w-full pl-11 pr-4 py-3 text-[14px] text-foreground-900 bg-white border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
        <div class="relative">
          <select
            v-model="familyFilter"
            class="appearance-none w-full sm:w-auto pl-10 pr-10 py-3 text-[14px] text-foreground-900 bg-white border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
          >
            <option value="全部">全部成员</option>
            <option value="shared">不指定（家庭公用）</option>
            <option v-for="fm in familyMembers" :key="fm.id" :value="fm.id">
              {{ fm.name }} ({{ fm.relationship }})
            </option>
          </select>
          <i
            class="ri-user-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-300 text-[15px] pointer-events-none"
          />
          <i
            class="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-foreground-300 text-[14px] pointer-events-none"
          />
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="px-4 py-2.5 text-[13px] font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer border"
          :class="
            activeCategory === cat
              ? cat === '即将过期'
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-primary-500 text-white border-primary-500'
              : cat === '即将过期'
                ? 'bg-white text-rose-500 border-rose-200 hover:border-rose-300'
                : 'bg-white text-foreground-500 border-background-200 hover:border-background-300'
          "
          @click="activeCategory = cat"
        >
          <i v-if="cat === '即将过期'" class="ri-alert-line text-[12px] mr-1" />
          {{ cat }}
        </button>
      </div>
    </div>

    <div
      v-if="filtered.length === 0"
      class="bg-white border border-background-200 rounded-2xl p-12 md:p-20 text-center"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
      >
        <i class="ri-capsule-line text-2xl text-foreground-300" />
      </div>
      <p class="text-[15px] text-foreground-400 font-medium">没有找到匹配的药品</p>
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="med in filtered"
        :key="med.id"
        class="bg-white border border-background-200 rounded-2xl p-4 md:p-5 hover:border-background-300 transition-colors duration-200 group"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-20 h-20 rounded-2xl bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden"
          >
            <img
              v-if="med.imageUrl"
              :src="med.imageUrl"
              :alt="med.name"
              class="w-full h-full object-cover"
            />
            <i v-else class="ri-capsule-line text-[28px] text-foreground-300" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <RouterLink
                :to="`/dashboard/medicines/${med.id}`"
                class="text-[15px] md:text-[16px] font-semibold text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer"
              >
                {{ med.name }}
              </RouterLink>
              <span
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                :class="categoryStyles[med.category]"
              >
                {{ med.category }}
              </span>
              <span
                v-if="med.expirationDate && getDaysUntilExpiry(med.expirationDate) <= 30"
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                :class="
                  getDaysUntilExpiry(med.expirationDate) <= 7
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                "
              >
                {{
                  getDaysUntilExpiry(med.expirationDate) <= 0
                    ? '已过期'
                    : `${getDaysUntilExpiry(med.expirationDate)}天后过期`
                }}
              </span>
            </div>
            <p class="text-[13px] text-foreground-400 mt-1.5">
              {{ med.dosage }}
              <span v-if="med.specification" class="text-foreground-300 ml-2">{{
                med.specification
              }}</span>
            </p>
            <p
              v-if="med.indication"
              class="text-[13px] text-foreground-500 mt-1 flex items-center gap-1.5"
            >
              <i class="ri-stethoscope-line text-[13px] text-foreground-300" />
              {{ med.indication }}
            </p>
            <div class="flex items-center gap-4 mt-3 flex-wrap">
              <span class="text-[13px] text-foreground-500 flex items-center gap-1.5">
                <i
                  class="text-[13px]"
                  :class="med.familyMemberId ? 'ri-user-line' : 'ri-group-line'"
                />
                {{ med.familyMemberName }}
              </span>
              <span
                v-if="med.expirationDate"
                class="text-[13px] text-foreground-500 flex items-center gap-1.5"
              >
                <i class="ri-calendar-line text-[13px]" />
                有效期 {{ med.expirationDate }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0 hidden md:flex">
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-600 hover:bg-background-100 cursor-pointer transition-colors"
              @click="openEditModal(med)"
            >
              <i class="ri-pencil-line text-[14px]" />
            </button>
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
              @click="deletingId = med.id"
            >
              <i class="ri-delete-bin-line text-[14px]" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-1 mt-3 pt-3 border-t border-background-100 md:hidden">
          <button
            type="button"
            class="flex-1 py-2 text-[13px] text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            @click="openEditModal(med)"
          >
            <i class="ri-pencil-line text-[14px]" />
            编辑
          </button>
          <button
            type="button"
            class="flex-1 py-2 text-[13px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            @click="deletingId = med.id"
          >
            <i class="ri-delete-bin-line text-[14px]" />
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal && editingMedicine"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="closeEditModal"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑药品</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="closeEditModal"
          >
            <i class="ri-close-line text-lg" />
          </button>
        </div>
        <form class="space-y-4" @submit="handleSaveEdit">
          <!-- Photo Upload -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品照片</label>
            <div
              v-if="editPhotoPreview"
              class="relative w-full h-52 rounded-xl overflow-hidden bg-background-100 border border-background-200 group/photo"
            >
              <img :src="editPhotoPreview" alt="药品照片" class="w-full h-full object-cover" />
              <div
                class="absolute inset-0 bg-foreground-900/0 group-hover/photo:bg-foreground-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-foreground-700 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover/photo:opacity-100"
                  @click="triggerEditPhotoInput"
                >
                  <i class="ri-refresh-line text-[16px]" />
                </button>
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-rose-500 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover/photo:opacity-100"
                  @click="handleRemovePhoto"
                >
                  <i class="ri-delete-bin-line text-[16px]" />
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="w-full h-52 rounded-xl border-2 border-dashed border-background-200 hover:border-primary-300 hover:bg-background-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
              @click="triggerEditPhotoInput"
            >
              <div
                class="w-10 h-10 rounded-full bg-background-100 flex items-center justify-center"
              >
                <i class="ri-camera-line text-[18px] text-foreground-400" />
              </div>
              <span class="text-[13px] text-foreground-400">点击上传药品照片</span>
              <span class="text-[11px] text-foreground-300">支持 JPG、PNG 格式</span>
            </button>
            <input
              id="edit-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handlePhotoSelect"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品名称</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品规格</label>
            <input
              v-model="editForm.specification"
              type="text"
              placeholder="例如：0.25g×24粒/盒"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">适应症</label>
            <input
              v-model="editForm.indication"
              type="text"
              placeholder="例如：高血压、头痛发热"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2">分类</label>
              <select
                v-model="editForm.category"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                <option value="处方药">处方药</option>
                <option value="非处方药">非处方药</option>
                <option value="保健品">保健品</option>
              </select>
            </div>
            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2"
                >服用人员</label
              >
              <select
                v-model="editForm.familyMemberId"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                <option value="">不指定（家庭公用）</option>
                <option v-for="m in familyMembers" :key="m.id" :value="m.id">
                  {{ m.name }} ({{ m.relationship }})
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2"
              >用法用量</label
            >
            <input
              v-model="editForm.dosage"
              type="text"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">有效期至</label>
            <input
              v-model="editForm.expirationDate"
              type="date"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">备注</label>
            <textarea
              v-model="editForm.notes"
              rows="3"
              maxlength="500"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
            <p class="text-[12px] text-foreground-300 mt-1.5 text-right">
              {{ editForm.notes.length }}/500
            </p>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              @click="closeEditModal"
            >
              取消
            </button>
            <button
              type="submit"
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
      description="删除后该药品的信息将无法恢复"
      confirm-text="删除"
      @close="deletingId = null"
      @confirm="handleDelete"
    />
  </div>
</template>
