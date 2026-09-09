<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getFamilyMembers } from '../api/family.js'
import { addMedicine } from '../api/medicine.js'
import {
  isNotEmpty,
  isOptionalStringMax,
  isExpiryDateValid,
  isMedicineTypeValid
} from '../utils/validate'

const familyMembers = ref([])
const error = ref('')
const submitting = ref(false)

const showSuccess = ref(false)
const photoFile = ref(null)
const photoPreview = ref(null)
const fileInputRef = ref(null)

const addForm = ref({
  memberId: '',
  name: '',
  specification: '',
  expiryDate: '',
  dosage: '',
  indications: '',
  medicineType: '',
  remark: ''
})

const remarkLength = computed(() => {
  return (addForm.value?.remark || '').length
})

watch(
  addForm,
  () => {
    error.value = ''
  },
  { deep: true }
)

const loadFamilyMembers = async () => {
  try {
    const res = await getFamilyMembers()
    familyMembers.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载家庭成员失败')
  }
}

function handlePhotoSelect(e) {
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
  photoFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result
  }
  reader.readAsDataURL(file)
}

function handleRemovePhoto() {
  photoFile.value = null
  photoPreview.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const resetForm = () => {
  addForm.value = {
    memberId: '',
    name: '',
    specification: '',
    expiryDate: '',
    dosage: '',
    indications: '',
    medicineType: '',
    remark: ''
  }
  handleRemovePhoto()
  error.value = ''
}

const validateForm = () => {
  error.value = ''
  const name = addForm.value.name.trim()
  if (!isNotEmpty(name) || name.length > 100) {
    error.value = '药品名称不能为空且不超过100个字符'
    return false
  }
  if (!isOptionalStringMax(addForm.value.specification, 100)) {
    error.value = '药品规格不能超过100个字符'
    return false
  }
  if (!isOptionalStringMax(addForm.value.indications, 255)) {
    error.value = '适应症不能超过255个字符'
    return false
  }
  if (!isMedicineTypeValid(addForm.value.medicineType)) {
    error.value = '请选择药品类型'
    return false
  }
  if (!isOptionalStringMax(addForm.value.dosage, 200)) {
    error.value = '用法用量不能超过200个字符'
    return false
  }
  if (!isExpiryDateValid(addForm.value.expiryDate)) {
    error.value = '有效期不能为空，且格式为YYYY-MM-DD'
    return false
  }
  if (!isOptionalStringMax(addForm.value.remark, 500)) {
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
  if (photoFile.value) {
    fd.append('file', photoFile.value)
  }
  return fd
}

const handleSubmit = async () => {
  if (submitting.value) return
  if (!validateForm()) return
  submitting.value = true
  try {
    const fd = buildFormData(addForm.value)
    await addMedicine(fd)
    showSuccess.value = true
    resetForm()
  } catch (err) {
    ElMessage.error(err.message || '添加药品失败')
  } finally {
    submitting.value = false
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleCloseSuccessModal = () => {
  showSuccess.value = false
  resetForm()
}

onMounted(() => {
  loadFamilyMembers()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6 md:space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-3 md:gap-4">
      <RouterLink
        to="/dashboard/medicines"
        class="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-white border border-background-200 hover:border-background-300 transition-all cursor-pointer flex-shrink-0"
      >
        <i class="ri-arrow-left-line text-[15px] md:text-[16px]" />
      </RouterLink>
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          添加药品
        </h1>
      </div>
    </div>

    <form class="bg-white rounded-2xl p-5 md:p-8 space-y-6" @submit.prevent="handleSubmit">
      <!-- Photo Upload -->
      <div>
        <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品照片</label>
        <div
          v-if="photoPreview"
          class="relative w-full h-56 rounded-xl overflow-hidden bg-background-100 border border-background-200 group/photo"
        >
          <img :src="photoPreview" alt="药品照片" class="w-full h-full object-contain" />
          <div
            class="absolute inset-0 bg-foreground-900/0 group-hover/photo:bg-foreground-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <button
              type="button"
              class="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-foreground-700 flex items-center justify-center cursor-pointer transition-all opacity-100 md:opacity-0 md:group-hover/photo:opacity-100"
              @click="triggerFileInput"
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
          class="w-full h-56 rounded-xl border-2 border-dashed border-background-200 hover:border-primary-300 hover:bg-background-50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          @click="triggerFileInput"
        >
          <div class="w-14 h-14 rounded-full bg-background-100 flex items-center justify-center">
            <i class="ri-camera-line text-[22px] text-foreground-400" />
          </div>
          <div class="text-center">
            <span class="text-[13px] text-foreground-400 block">点击上传药品照片</span>
            <span class="text-[11px] text-foreground-300 mt-0.5 block"
              >支持 JPG、PNG、WEBP 格式，大小不超过5MB</span
            >
          </div>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handlePhotoSelect"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <div class="sm:col-span-2">
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
            药品名称 <span class="text-red-500 ml-0.5">*</span>
          </label>
          <input
            v-model="addForm.name"
            type="text"
            placeholder="例如：阿莫西林胶囊"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">药品规格</label>
          <input
            v-model="addForm.specification"
            type="text"
            placeholder="例如：0.25g×24粒/盒"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">适应症</label>
          <input
            v-model="addForm.indications"
            type="text"
            placeholder="例如：高血压、头痛发热"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div>
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
            分类 <span class="text-red-500 ml-0.5">*</span>
          </label>
          <select
            v-model="addForm.medicineType"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
          >
            <option value="">选择分类</option>
            <option value="prescription">处方药</option>
            <option value="otc">非处方药</option>
            <option value="healthcare">保健品</option>
          </select>
        </div>

        <div>
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">服用人员</label>
          <select
            v-model="addForm.memberId"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
          >
            <option value="">家庭公用</option>
            <option v-for="m in familyMembers" :key="m.id" :value="m.id">
              {{ m.name }} ({{ m.relationship }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">用法用量</label>
          <input
            v-model="addForm.dosage"
            type="text"
            placeholder="例如：一次1片，一日3次"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div>
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
            有效期至 <span class="text-red-500 ml-0.5">*</span>
          </label>
          <input
            v-model="addForm.expiryDate"
            type="date"
            class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="block text-[13px] font-semibold text-foreground-700 mb-2">备注</label>
          <div class="relative">
            <textarea
              v-model="addForm.remark"
              rows="3"
              placeholder="特殊说明、注意事项等..."
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
            <span
              class="pointer-events-none absolute right-3 bottom-2.5 text-[12px] tabular-nums"
              :class="remarkLength > 500 ? 'text-red-500' : 'text-foreground-300'"
            >
              {{ remarkLength }}/500
            </span>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-[12px] text-red-500 leading-snug">
        {{ error }}
      </p>

      <div class="flex gap-3 pt-2">
        <RouterLink
          to="/dashboard/medicines"
          class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors text-center cursor-pointer whitespace-nowrap font-medium"
        >
          取消
        </RouterLink>
        <button
          :disabled="submitting"
          type="submit"
          class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
        >
          保存药品
        </button>
      </div>
    </form>

    <!-- Success Modal -->
    <div
      v-if="showSuccess"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="handleCloseSuccessModal"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[340px] md:max-w-[380px] p-6 md:p-7 text-center shadow-xl"
        @click.stop
      >
        <div
          class="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center"
        >
          <i class="ri-check-line text-xl md:text-2xl text-primary-500" />
        </div>
        <p class="text-[16px] md:text-[18px] font-bold text-foreground-900">药品添加成功</p>
        <p class="text-[13px] md:text-[14px] text-foreground-400 mt-1">已添加到你的药箱</p>
        <div class="flex gap-3 mt-6">
          <button
            type="button"
            class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            @click="handleCloseSuccessModal"
          >
            继续添加
          </button>
          <router-link
            to="/dashboard/medicines"
            class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors text-center cursor-pointer whitespace-nowrap font-medium"
          >
            查看列表
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
