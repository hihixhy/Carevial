<script setup>
import { ref } from 'vue'
import { familyHealthProfiles } from '../mocks/family-health.js'

const profiles = ref(
  familyHealthProfiles.map((p) => ({
    ...p,
    allergies: [...p.allergies],
    chronicConditions: [...p.chronicConditions],
    contraindications: [...p.contraindications]
  }))
)
const expandedId = ref(null)
const showEditModal = ref(false)
const editingProfile = ref(null)
const editForm = ref(null)

const newAllergy = ref('')
const newCondition = ref('')
const newContraindication = ref('')

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function openEditModal(profile) {
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

function handleSaveEdit(e) {
  e.preventDefault()
  if (!editForm.value || !editingProfile.value) return
  profiles.value = profiles.value.map((p) =>
    p.id === editingProfile.value.id ? { ...editForm.value } : p
  )
  showEditModal.value = false
  editingProfile.value = null
  editForm.value = null
}

function addItemToEditForm(field, value) {
  if (!editForm.value || !value.trim()) return
  editForm.value = {
    ...editForm.value,
    [field]: [...editForm.value[field], value.trim()]
  }
  if (field === 'allergies') newAllergy.value = ''
  else if (field === 'chronicConditions') newCondition.value = ''
  else newContraindication.value = ''
}

function removeItemFromEditForm(field, index) {
  if (!editForm.value) return
  editForm.value = {
    ...editForm.value,
    [field]: editForm.value[field].filter((_, i) => i !== index)
  }
}

function profileSummary(profile) {
  return (
    [
      profile.allergies.length > 0 ? `过敏: ${profile.allergies.join('、')}` : '',
      profile.chronicConditions.length > 0 ? profile.chronicConditions.join('、') : ''
    ]
      .filter(Boolean)
      .join(' · ') || '暂无健康记录'
  )
}

function onEditPencilClick(e, profile) {
  e.stopPropagation()
  openEditModal(profile)
}

function onTagKeydown(e, field, value) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addItemToEditForm(field, value)
  }
}
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

    <!-- Member Cards -->
    <div class="space-y-3">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="bg-white border border-background-200 rounded-2xl overflow-hidden"
      >
        <button
          @click="toggleExpand(profile.id)"
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
              @click="onEditPencilClick($event, profile)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-500 hover:bg-background-100 cursor-pointer transition-colors"
            >
              <i class="ri-pencil-line text-[14px]"></i>
            </button>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200"
              :class="{ 'rotate-180': expandedId === profile.id }"
            >
              <i class="ri-arrow-down-s-line text-foreground-300 text-[18px]"></i>
            </div>
          </div>
        </button>

        <div
          v-if="expandedId === profile.id"
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
      @click="showEditModal = false"
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
            @click="showEditModal = false"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form @submit="handleSaveEdit" class="space-y-5">
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
            <textarea
              rows="3"
              maxlength="500"
              v-model="editForm.medicalNotes"
              placeholder="补充其他医疗信息..."
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
            />
            <p class="text-[12px] text-foreground-300 mt-1.5 text-right">最多 500 字</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showEditModal = false"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
