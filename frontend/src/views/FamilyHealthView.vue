<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getHealthProfiles, updateHealthProfile } from '../api/health'
import { isStringArrayValid, isMedicalNotesValidIfPresent } from '../utils/validate'

const profiles = ref([])
const error = ref('')

const loading = ref(true)
const submitting = ref(false)
const showEditModal = ref(false)

const expandedId = ref(null)
// 健康档案的信息，不参与表单输入
const editingProfile = ref(null)
// 可修改的健康档案信息
const editForm = ref(null)

const NOTES_MAX = 1000
const TAG_MAX_ITEMS = 20
const TAG_MAX_LEN = 50

const newAllergy = ref('')
const newCondition = ref('')
const newContraindication = ref('')

const notesLength = computed(() => {
  return (editForm.value?.medicalNotes || '').length
})

watch(
  [editForm, newAllergy, newCondition, newContraindication],
  () => {
    error.value = ''
  },
  { deep: true }
)

// 展开/折叠家庭成员健康档案
const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

// opts = { showLoading: boolean } 是否显示骨架屏
const loadProfiles = async (opts = {}) => {
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getHealthProfiles()
    profiles.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载健康档案列表失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

const openEditModal = (profile) => {
  error.value = ''
  editingProfile.value = profile
  editForm.value = {
    ...profile,
    allergies: [...profile.allergies],
    chronicConditions: [...profile.chronicConditions],
    contraindications: [...profile.contraindications]
  }
  newAllergy.value = ''
  newCondition.value = ''
  newContraindication.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingProfile.value = null
  editForm.value = null
  error.value = ''
  newAllergy.value = ''
  newCondition.value = ''
  newContraindication.value = ''
}

const handleSaveEdit = async () => {
  if (!editForm.value || !editingProfile.value) return

  error.value = ''
  if (!isMedicalNotesValidIfPresent(editForm.value.medicalNotes)) {
    error.value = '备注不能超过1000个字符'
    return
  }
  if (!isStringArrayValid(editForm.value.allergies)) {
    error.value = '过敏史格式无效'
    return
  }
  if (!isStringArrayValid(editForm.value.chronicConditions)) {
    error.value = '慢性病格式无效'
    return
  }
  if (!isStringArrayValid(editForm.value.contraindications)) {
    error.value = '用药禁忌格式无效'
    return
  }

  if (submitting.value) return
  submitting.value = true

  try {
    const memberId = editingProfile.value.memberId
    await updateHealthProfile(memberId, {
      bloodType: editForm.value.bloodType || '',
      allergies: editForm.value.allergies,
      chronicConditions: editForm.value.chronicConditions,
      contraindications: editForm.value.contraindications,
      medicalNotes: editForm.value.medicalNotes || ''
    })
    ElMessage.success('保存成功')
    closeEditModal()
    await loadProfiles({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '编辑健康档案失败失败')
  } finally {
    submitting.value = false
  }
}

const addItemToEditForm = (field, value) => {
  if (!editForm.value || !value.trim()) return

  error.value = ''

  if (value.trim().length > TAG_MAX_LEN) {
    error.value = `每条不能超过${TAG_MAX_LEN}个字符`
    return
  }
  if (editForm.value[field].length >= TAG_MAX_ITEMS) {
    error.value = `最多添加${TAG_MAX_ITEMS}条`
    return
  }

  // [变量名] 计算属性名，只能用在{}中
  editForm.value = {
    ...editForm.value,
    [field]: [...editForm.value[field], value.trim()]
  }
  if (field === 'allergies') newAllergy.value = ''
  else if (field === 'chronicConditions') newCondition.value = ''
  else newContraindication.value = ''
}

const removeItemFromEditForm = (field, index) => {
  if (!editForm.value) return
  editForm.value = {
    ...editForm.value,
    [field]: editForm.value[field].filter((_, i) => i !== index)
  }
}

const profileSummary = (profile) => {
  return (
    [
      profile.allergies.length > 0 ? `过敏: ${profile.allergies.join('、')}` : '',
      profile.chronicConditions.length > 0 ? profile.chronicConditions.join('、') : ''
    ]
      .filter(Boolean)
      .join(' · ') || '暂无健康记录'
  )
}

const onTagKeydown = (e, field, value) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    addItemToEditForm(field, value)
  }
}

onMounted(() => {
  loadProfiles()
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          家庭健康档案
        </h1>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white border border-background-200 rounded-2xl overflow-hidden"
      >
        <div class="px-5 py-4 md:px-6 md:py-5">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item
                variant="rect"
                style="width: 100%; height: 40px; border-radius: 12px"
              />
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <div
      v-else-if="profiles.length === 0"
      class="bg-white border border-background-200 rounded-2xl px-6 py-14 text-center"
    >
      <div
        class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
      >
        <i class="ri-group-line text-2xl text-foreground-300"></i>
      </div>
      <p class="text-[15px] text-foreground-400 font-medium">还没有家庭成员，请先添加家庭成员</p>
      <router-link
        to="/dashboard/family"
        class="inline-block text-[13px] text-primary-600 hover:text-primary-700 mt-3 font-medium cursor-pointer"
      >
        去添加
      </router-link>
    </div>

    <!-- Member Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="profile in profiles"
        :key="profile.memberId"
        class="bg-white border border-background-200 rounded-2xl overflow-hidden"
      >
        <button
          @click="toggleExpand(profile.memberId)"
          class="w-full px-5 py-4 md:px-6 md:py-5 flex items-center gap-4 text-left cursor-pointer hover:bg-background-50 transition-colors"
        >
          <div
            class="w-10 h-10 rounded-full bg-background-100 flex items-center justify-center flex-shrink-0"
          >
            <i class="ri-user-3-line text-foreground-400 text-[18px]"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <p class="text-[15px] font-semibold text-foreground-900">{{ profile.name }}</p>
              <span class="text-[12px] text-foreground-400">{{ profile.relationship }}</span>
              <span v-if="profile.bloodType" class="text-[12px] text-foreground-400">
                · {{ profile.bloodType }}
              </span>
            </div>
            <p class="text-[12px] text-foreground-400 mt-0.5 line-clamp-1">
              {{ profileSummary(profile) }}
            </p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click.stop="openEditModal(profile)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-500 hover:bg-background-100 cursor-pointer transition-colors"
            >
              <i class="ri-pencil-line text-[14px]"></i>
            </button>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200"
              :class="{ 'rotate-180': expandedId === profile.memberId }"
            >
              <i class="ri-arrow-down-s-line text-foreground-300 text-[18px]"></i>
            </div>
          </div>
        </button>

        <div
          v-if="expandedId === profile.memberId"
          class="px-5 pb-5 md:px-8 md:pb-6 border-t border-background-100"
        >
          <div class="pt-5 space-y-4">
            <!-- Allergies -->
            <div class="flex gap-4">
              <span class="text-[13px] text-foreground-400 w-[72px] flex-shrink-0 pt-0.5"
                >过敏史</span
              >
              <div class="flex-1 min-w-0">
                <span v-if="profile.allergies.length === 0" class="text-[13px] text-foreground-300">
                  暂无
                </span>
                <span v-else class="text-[13px] text-foreground-700">
                  {{ profile.allergies.join('、') }}
                </span>
              </div>
            </div>

            <!-- Chronic Conditions -->
            <div class="flex gap-4">
              <span class="text-[13px] text-foreground-400 w-[72px] flex-shrink-0 pt-0.5"
                >慢性病</span
              >
              <div class="flex-1 min-w-0">
                <span
                  v-if="profile.chronicConditions.length === 0"
                  class="text-[13px] text-foreground-300"
                >
                  暂无
                </span>
                <span v-else class="text-[13px] text-foreground-700">
                  {{ profile.chronicConditions.join('、') }}
                </span>
              </div>
            </div>

            <!-- Contraindications -->
            <div class="flex gap-4">
              <span class="text-[13px] text-foreground-400 w-[72px] flex-shrink-0 pt-0.5"
                >用药禁忌</span
              >
              <div class="flex-1 min-w-0">
                <span
                  v-if="profile.contraindications.length === 0"
                  class="text-[13px] text-foreground-300"
                >
                  暂无
                </span>
                <span v-else class="text-[13px] text-foreground-700">
                  {{ profile.contraindications.join('、') }}
                </span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="profile.medicalNotes" class="flex gap-4">
              <span class="text-[13px] text-foreground-400 w-[72px] flex-shrink-0 pt-0.5"
                >备注</span
              >
              <p class="text-[13px] text-foreground-600 leading-relaxed">
                {{ profile.medicalNotes }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal && editForm"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="closeEditModal"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑健康档案</h3>
            <p class="text-[13px] text-foreground-400 mt-0.5">
              {{ editForm.name }} · {{ editForm.relationship }}
            </p>
          </div>
          <button
            @click="closeEditModal"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form @submit.prevent="handleSaveEdit" class="space-y-5">
          <!-- Blood Type -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">血型</label>
            <select
              v-model="editForm.bloodType"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            >
              <option value="">未知</option>
              <option value="A型">A型</option>
              <option value="B型">B型</option>
              <option value="AB型">AB型</option>
              <option value="O型">O型</option>
            </select>
          </div>

          <!-- Allergies -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">过敏史</label>
            <div class="flex flex-wrap gap-1.5 mb-2.5">
              <span
                v-for="(item, i) in editForm.allergies"
                :key="i"
                class="inline-flex items-center gap-1.5 text-[13px] text-foreground-700 bg-background-100 border border-background-200 px-2.5 py-1 rounded-lg"
              >
                {{ item }}
                <button
                  type="button"
                  @click="removeItemFromEditForm('allergies', i)"
                  class="text-foreground-300 hover:text-foreground-500 cursor-pointer"
                >
                  <i class="ri-close-line text-[13px]"></i>
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="newAllergy"
                placeholder="输入过敏源"
                class="flex-1 px-3 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @keydown="onTagKeydown($event, 'allergies', newAllergy)"
              />
              <button
                type="button"
                @click="addItemToEditForm('allergies', newAllergy)"
                class="px-4 py-2.5 text-[13px] text-foreground-600 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              >
                添加
              </button>
            </div>
          </div>

          <!-- Chronic Conditions -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">
              慢性病 / 老毛病
            </label>
            <div class="flex flex-wrap gap-1.5 mb-2.5">
              <span
                v-for="(item, i) in editForm.chronicConditions"
                :key="i"
                class="inline-flex items-center gap-1.5 text-[13px] text-foreground-700 bg-background-100 border border-background-200 px-2.5 py-1 rounded-lg"
              >
                {{ item }}
                <button
                  type="button"
                  @click="removeItemFromEditForm('chronicConditions', i)"
                  class="text-foreground-300 hover:text-foreground-500 cursor-pointer"
                >
                  <i class="ri-close-line text-[13px]"></i>
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="newCondition"
                placeholder="输入病症"
                class="flex-1 px-3 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @keydown="onTagKeydown($event, 'chronicConditions', newCondition)"
              />
              <button
                type="button"
                @click="addItemToEditForm('chronicConditions', newCondition)"
                class="px-4 py-2.5 text-[13px] text-foreground-600 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              >
                添加
              </button>
            </div>
          </div>

          <!-- Contraindications -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">用药禁忌</label>
            <div class="flex flex-wrap gap-1.5 mb-2.5">
              <span
                v-for="(item, i) in editForm.contraindications"
                :key="i"
                class="inline-flex items-center gap-1.5 text-[13px] text-foreground-700 bg-background-100 border border-background-200 px-2.5 py-1 rounded-lg"
              >
                {{ item }}
                <button
                  type="button"
                  @click="removeItemFromEditForm('contraindications', i)"
                  class="text-foreground-300 hover:text-foreground-500 cursor-pointer"
                >
                  <i class="ri-close-line text-[13px]"></i>
                </button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="newContraindication"
                placeholder="输入禁忌药物"
                class="flex-1 px-3 py-2.5 text-[13px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @keydown="onTagKeydown($event, 'contraindications', newContraindication)"
              />
              <button
                type="button"
                @click="addItemToEditForm('contraindications', newContraindication)"
                class="px-4 py-2.5 text-[13px] text-foreground-600 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              >
                添加
              </button>
            </div>
          </div>

          <!-- Medical Notes -->
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">备注</label>
            <div class="relative">
              <textarea
                rows="3"
                v-model="editForm.medicalNotes"
                placeholder="补充其他医疗信息..."
                class="w-full px-4 py-3 pb-8 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
              />
              <span
                class="pointer-events-none absolute right-3 bottom-2.5 text-[12px] tabular-nums"
                :class="notesLength > NOTES_MAX ? 'text-red-500' : 'text-foreground-300'"
              >
                {{ notesLength }}/{{ NOTES_MAX }}
              </span>
            </div>
          </div>

          <p v-if="error" class="text-[12px] text-red-500 leading-snug">
            <i class="ri-error-warning-line"></i> {{ error }}
          </p>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeEditModal"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
