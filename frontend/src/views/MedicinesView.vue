<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '../components/ConfirmModal.vue'
import { getMedicines, updateMedicine, deleteMedicine } from '../api/medicine'
import { getFamilyMembers } from '../api/family'
import { medicineTypeLabel } from '../utils/medicine.js'
import { diffDaysFromToday } from '../utils/date.js'
import {
  isNotEmpty,
  isMedicineTypeValid,
  isExpiryDateValid,
  isOptionalStringMax
} from '../utils/validate.js'

const route = useRoute()
const router = useRouter()

const medicines = ref([])
const familyMembers = ref([])
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const error = ref('')

const search = ref('')
const activeCategory = ref('全部')
const familyFilter = ref('全部')

const showEditModal = ref(false)
const editingId = ref(null)
const deletingId = ref(null)

const editPhotoFile = ref(null)
const editPhotoPreview = ref(null)
const fileInputRef = ref(null)
const photoRemoved = ref(false)

const editForm = ref({
  memberId: '',
  name: '',
  specification: '',
  expiryDate: '',
  dosage: '',
  indications: '',
  medicineType: 'otc',
  remark: ''
})

const remarkLength = computed(() => {
  return (editForm.value?.remark || '').length
})

const categories = ['全部', '处方药', '非处方药', '保健品', '即将过期', '已过期']

watch(
  editForm,
  () => {
    error.value = ''
  },
  { deep: true }
)

// 修改标签样式
const getTabClass = (cat) => {
  if (activeCategory.value === cat) {
    if (cat === '即将过期') return 'bg-amber-500 text-white border-amber-500'
    if (cat === '已过期') return 'bg-rose-600 text-white border-rose-600'
    return 'bg-primary-500 text-white border-primary-500'
  }
  if (cat === '即将过期') return 'bg-white text-amber-500 border-amber-200 hover:border-amber-300'
  if (cat === '已过期') return 'bg-white text-rose-500 border-rose-200 hover:border-rose-300'
  return 'bg-white text-foreground-500 border-background-200 hover:border-background-300'
}

// opts = { showLoading: boolean } 是否显示骨架屏
const loadMedicines = async (opts = {}) => {
  // 默认需要骨架屏
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getMedicines()
    medicines.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载药品列表失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

const loadFamilyMembers = async () => {
  try {
    const res = await getFamilyMembers()
    familyMembers.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载家庭成员失败')
  }
}

// 筛选药品列表
const filtered = computed(() =>
  medicines.value.filter((m) => {
    if (activeCategory.value === '即将过期') {
      if (m.expiryStatus !== 'expiring') return false
    } else if (activeCategory.value === '已过期') {
      if (m.expiryStatus !== 'expired') return false
    } else if (activeCategory.value !== '全部') {
      if (medicineTypeLabel(m.medicineType) !== activeCategory.value) {
        return false
      }
    }

    if (familyFilter.value === 'public') {
      if (m.memberId) return false
    } else if (familyFilter.value !== '全部') {
      if (String(m.memberId) !== String(familyFilter.value)) {
        return false
      }
    }

    if (search.value && !m.name.includes(search.value.trim())) {
      return false
    }
    return true
  })
)

const openEditModal = (med) => {
  editingId.value = med.id
  error.value = ''
  editForm.value = {
    memberId: med.memberId != null ? med.memberId : '',
    name: med.name,
    specification: med.specification || '',
    expiryDate: med.expiryDate || '',
    dosage: med.dosage || '',
    indications: med.indications || '',
    medicineType: med.medicineType || 'otc',
    remark: med.remark || ''
  }
  editPhotoFile.value = null
  editPhotoPreview.value = med.photoUrl || null
  photoRemoved.value = false
  showEditModal.value = true
}

const handlePhotoSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowed.includes(file.type)) {
    ElMessage.error('请上传JPG、PNG、WEBP格式图片')
    e.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    e.target.value = ''
    return
  }

  editPhotoFile.value = file
  photoRemoved.value = false
  const reader = new FileReader()
  reader.onload = () => {
    editPhotoPreview.value = reader.result
  }
  reader.readAsDataURL(file) // 异步读完才进入onload回调
}

const handleRemovePhoto = () => {
  editPhotoFile.value = null
  editPhotoPreview.value = null
  photoRemoved.value = true
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const validateForm = () => {
  error.value = ''
  const name = editForm.value.name.trim()
  if (!isNotEmpty(name) || name.length > 100) {
    error.value = '药品名称不能为空且不超过100个字符'
    return false
  }
  if (!isOptionalStringMax(editForm.value.specification, 100)) {
    error.value = '药品规格不能超过100个字符'
    return false
  }
  if (!isOptionalStringMax(editForm.value.indications, 255)) {
    error.value = '适应症不能超过255个字符'
    return false
  }
  if (!isMedicineTypeValid(editForm.value.medicineType)) {
    error.value = '请选择药品类型'
    return false
  }
  if (!isOptionalStringMax(editForm.value.dosage, 200)) {
    error.value = '用法用量不能超过200个字符'
    return false
  }
  if (!isExpiryDateValid(editForm.value.expiryDate)) {
    error.value = '有效期不能为空，且格式为YYYY-MM-DD'
    return false
  }
  if (!isOptionalStringMax(editForm.value.remark, 500)) {
    error.value = '备注不能超过500个字符'
    return false
  }
  return true
}

const buildFormData = (form) => {
  const fd = new FormData()
  if (form.memberId !== '' && form.memberId != null) {
    fd.append('memberId', String(form.memberId))
  }
  fd.append('name', form.name.trim())
  fd.append('specification', form.specification || '')
  fd.append('expiryDate', form.expiryDate)
  fd.append('dosage', form.dosage || '')
  fd.append('indications', form.indications || '')
  fd.append('medicineType', form.medicineType)
  fd.append('remark', form.remark || '')

  if (editPhotoFile.value) {
    fd.append('file', editPhotoFile.value)
  } else if (photoRemoved.value) {
    fd.append('clearPhoto', '1')
  }
  return fd
}

const handleSaveEdit = async () => {
  if (!editingId.value || submitting.value) return
  if (!validateForm()) return
  submitting.value = true
  try {
    const fd = buildFormData(editForm.value)
    await updateMedicine(editingId.value, fd)
    ElMessage.success('保存成功')
    closeEditModal()
    await loadMedicines({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '编辑药品失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!deletingId.value || deleting.value) return
  deleting.value = true
  try {
    await deleteMedicine(deletingId.value)
    ElMessage.success('删除成功')
    deletingId.value = null
    await loadMedicines({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

const closeEditModal = () => {
  error.value = ''
  showEditModal.value = false
  editingId.value = null
  editPhotoFile.value = null
  editPhotoPreview.value = null
  photoRemoved.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const triggerEditPhotoInput = () => {
  fileInputRef.value?.click()
}

const openEditFromQuery = () => {
  const editId = route.query.edit
  if (!editId) return
  const med = medicines.value.find((m) => String(m.id) === String(editId))
  if (med) openEditModal(med)
  router.replace({ path: '/dashboard/medicines', query: {} })
}

onMounted(async () => {
  await Promise.all([loadMedicines(), loadFamilyMembers()])
  openEditFromQuery()
})
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
      <router-link
        to="/dashboard/medicines/add"
        class="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap self-start"
      >
        <i class="ri-add-line text-sm" />
        添加药品
      </router-link>
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
            <option value="public">家庭公用</option>
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
          :class="getTabClass(cat)"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white border border-background-200 rounded-2xl p-4 md:p-5"
      >
        <el-skeleton animated>
          <template #template>
            <div class="flex items-start gap-4">
              <el-skeleton-item
                variant="rect"
                style="width: 80px; height: 80px; border-radius: 16px; flex-shrink: 0"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <el-skeleton-item variant="text" style="width: 120px; height: 18px" />
                  <el-skeleton-item
                    variant="text"
                    style="width: 56px; height: 22px; border-radius: 9999px"
                  />
                </div>
                <el-skeleton-item
                  variant="text"
                  style="width: 70%; height: 14px; margin-top: 10px"
                />
                <el-skeleton-item
                  variant="text"
                  style="width: 45%; height: 14px; margin-top: 8px"
                />
                <div class="flex items-center gap-4 mt-3">
                  <el-skeleton-item variant="text" style="width: 72px; height: 14px" />
                  <el-skeleton-item variant="text" style="width: 110px; height: 14px" />
                </div>
              </div>
              <div class="hidden md:flex items-center gap-1 flex-shrink-0">
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
          </template>
        </el-skeleton>
      </div>
    </div>

    <div
      v-else-if="medicines.length === 0"
      class="bg-white border border-background-200 rounded-2xl px-6 py-14 text-center"
    >
      <div
        class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
      >
        <i class="ri-capsule-line text-2xl text-foreground-300" />
      </div>
      <p class="text-[15px] text-foreground-400 font-medium">还没有药品</p>
      <router-link
        to="/dashboard/medicines/add"
        class="inline-block text-[13px] text-primary-600 hover:text-primary-700 mt-3 font-medium cursor-pointer"
      >
        添加药品
      </router-link>
    </div>

    <div
      v-else-if="filtered.length === 0"
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
              v-if="med.photoUrl"
              :src="med.photoUrl"
              :alt="med.name"
              class="w-full h-full object-cover"
            />
            <i v-else class="ri-capsule-line text-[28px] text-foreground-300" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <router-link
                :to="`/dashboard/medicines/${med.id}`"
                class="text-[15px] md:text-[16px] font-semibold text-foreground-900 hover:text-primary-500 transition-colors cursor-pointer"
              >
                {{ med.name }}
              </router-link>
              <span
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-primary-50 text-primary-700 border-primary-100"
              >
                {{ medicineTypeLabel(med.medicineType) }}
              </span>
              <span
                v-if="
                  med.expiryDate &&
                  (med.expiryStatus === 'expiring' || med.expiryStatus === 'expired')
                "
                class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                :class="
                  med.expiryStatus === 'expired'
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                "
              >
                {{
                  med.expiryStatus === 'expired'
                    ? '已过期'
                    : `${diffDaysFromToday(med.expiryDate)}天后过期`
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
              v-if="med.indications"
              class="text-[13px] text-foreground-500 mt-1 flex items-center gap-1.5"
            >
              <i class="ri-stethoscope-line text-[13px] text-foreground-300" />
              {{ med.indications }}
            </p>
            <div class="flex items-center gap-4 mt-3 flex-wrap">
              <span class="text-[13px] text-foreground-500 flex items-center gap-1.5">
                <i class="text-[13px]" :class="med.memberId ? 'ri-user-line' : 'ri-group-line'" />
                {{ med.memberName ? med.memberName : '家庭公用' }}
              </span>
              <span
                v-if="med.expiryDate"
                class="text-[13px] text-foreground-500 flex items-center gap-1.5"
              >
                <i class="ri-calendar-line text-[13px]" />
                有效期 {{ med.expiryDate }}
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
      v-if="showEditModal && editingId"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[480px] max-h-[90vh] border border-background-200 flex flex-col overflow-hidden"
      >
        <div class="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 bg-white">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑药品</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="closeEditModal"
          >
            <i class="ri-close-line text-lg" />
          </button>
        </div>
        <form
          class="space-y-4 px-6 pb-6 overflow-y-auto flex-1 min-h-0"
          @submit.prevent="handleSaveEdit"
        >
          <!-- Photo Upload -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品照片</label>
            <div
              v-if="editPhotoPreview"
              class="relative w-full h-52 rounded-xl overflow-hidden bg-background-100 border border-background-200 group/photo"
            >
              <img :src="editPhotoPreview" alt="药品照片" class="w-full h-full object-contain" />
              <div
                class="absolute inset-0 bg-foreground-900/0 group-hover/photo:bg-foreground-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-foreground-700 flex items-center justify-center cursor-pointer transition-all opacity-100 md:opacity-0 md:group-hover/photo:opacity-100"
                  @click="triggerEditPhotoInput"
                >
                  <i class="ri-refresh-line text-[16px]" />
                </button>
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-rose-500 flex items-center justify-center cursor-pointer transition-all opacity-100 md:opacity-0 md:group-hover/photo:opacity-100"
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
              <span class="text-[11px] text-foreground-300"
                >支持 JPG、PNG、WEBP 格式，大小不超过5MB</span
              >
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handlePhotoSelect"
            />
          </div>

          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
              药品名称 <span class="text-red-500 ml-0.5">*</span>
            </label>
            <input
              v-model="editForm.name"
              type="text"
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
              v-model="editForm.indications"
              type="text"
              placeholder="例如：高血压、头痛发热"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
                分类 <span class="text-red-500 ml-0.5">*</span>
              </label>
              <select
                v-model="editForm.medicineType"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                <option value="prescription">处方药</option>
                <option value="otc">非处方药</option>
                <option value="healthcare">保健品</option>
              </select>
            </div>

            <div>
              <label class="block text-[13px] font-semibold text-foreground-700 mb-2"
                >服用人员</label
              >
              <select
                v-model="editForm.memberId"
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
              >
                <option value="">家庭公用</option>
                <option v-for="m in familyMembers" :key="m.id" :value="m.id">
                  {{ m.name }} ({{ m.relationship }})
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">用法用量</label>
            <input
              v-model="editForm.dosage"
              type="text"
              placeholder="例如：一次1片，一日3次"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
              有效期至 <span class="text-red-500 ml-0.5">*</span>
            </label>
            <input
              v-model="editForm.expiryDate"
              type="date"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            />
          </div>

          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">备注</label>
            <div class="relative">
              <textarea
                v-model="editForm.remark"
                rows="3"
                placeholder="特殊说明、注意事项等..."
                class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
              />
              <span
                class="pointer-events-none absolute right-3 bottom-2.5 text-[12px] tabular-nums"
                :class="remarkLength > 500 ? 'text-red-500' : 'text-foreground-300'"
              >
                {{ remarkLength }}/500
              </span>
            </div>
          </div>

          <p v-if="error" class="text-[12px] text-red-500 leading-snug">
            <i class="ri-error-warning-line"></i> {{ error }}
          </p>

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
      description="删除后该药品的信息将无法恢复，其关联的提醒也将被删除"
      confirm-text="删除"
      @close="deletingId = null"
      @confirm="handleDelete"
    />
  </div>
</template>
