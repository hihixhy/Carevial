<script setup>
import { ref, onMounted, watch } from 'vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import {
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getMemberMedicineCount
} from '../api/family'
import { isAgeValidIfPresent } from '../utils/validate'

const members = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const deletingId = ref(null)
const submitting = ref(false)
const deleting = ref(false)
const error = ref('')
const deleteDescription = ref('')

const form = ref({ name: '', age: '', relationship: '' })

watch(
  form,
  () => {
    error.value = ''
  },
  { deep: true }
)

// opts = { showLoading: boolean } 是否显示骨架屏
const loadMembers = async (opts = {}) => {
  const showLoading = opts.showLoading !== false
  if (showLoading) loading.value = true
  try {
    const res = await getFamilyMembers()
    members.value = res.data || []
  } catch (err) {
    ElMessage.error(err.message || '加载家庭成员列表失败')
  } finally {
    if (showLoading) loading.value = false
  }
}

// 组装提交body数据
const buildPayload = (form) => {
  return {
    name: form.name.trim(),
    age: form.age === '' || form.age == null ? null : Number(form.age),
    relationship: form.relationship.trim()
  }
}

const openAddModal = () => {
  editingId.value = null
  error.value = ''
  form.value = { name: '', age: '', relationship: '' }
  showModal.value = true
}

const openEditModal = (member) => {
  error.value = ''
  editingId.value = member.id
  form.value = {
    name: member.name,
    age: member.age != null ? String(member.age) : '',
    relationship: member.relationship
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  error.value = ''
  form.value = { name: '', age: '', relationship: '' }
}

const validateForm = () => {
  error.value = ''
  const name = form.value.name.trim()
  const age = form.value.age
  const relationship = form.value.relationship.trim()

  if (!name) {
    error.value = '请输入姓名'
    return false
  }
  if (name.length > 50) {
    error.value = '姓名不能超过50个字符'
    return false
  }
  if (!relationship) {
    error.value = '请输入关系'
    return false
  }
  if (relationship.length > 50) {
    error.value = '关系不能超过50个字符'
    return false
  }
  if (!isAgeValidIfPresent(age)) {
    error.value = '年龄需为0-120之间的整数'
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (submitting.value) return
  submitting.value = true

  try {
    const payload = buildPayload(form.value)
    if (editingId.value) {
      await updateFamilyMember(editingId.value, payload)
      ElMessage.success('保存成功')
    } else {
      await addFamilyMember(payload)
      ElMessage.success('添加成员成功')
    }
    closeModal()
    await loadMembers({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || (editingId.value ? '编辑成员失败' : '添加成员失败'))
  } finally {
    submitting.value = false
  }
}

const openDeleteConfirm = async (member) => {
  try {
    const res = await getMemberMedicineCount(member.id)
    const count = res.data?.count ?? 0
    if (count > 0) {
      deleteDescription.value = `删除后该成员信息与健康档案将无法恢复。其关联的 ${count} 种药品将变为家庭公用药品。`
    } else {
      deleteDescription.value = '删除后该成员的信息将无法恢复，其对应的健康档案也将被删除'
    }
    deletingId.value = member.id
  } catch (err) {
    ElMessage.error(err.message || '无法确认关联药品，请稍后再试')
  }
}

const closeDeleteConfirm = () => {
  deletingId.value = null
  deleteDescription.value = ''
}

const handleDelete = async () => {
  if (!deletingId.value) return
  if (deleting.value) return
  deleting.value = true
  try {
    await deleteFamilyMember(deletingId.value)
    ElMessage.success('删除成功')
    closeDeleteConfirm()
    await loadMembers({ showLoading: false })
  } catch (err) {
    ElMessage.error(err.message || '删除家庭成员失败')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadMembers()
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 md:space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1
          class="text-[18px] md:text-[22px] font-bold text-foreground-900 tracking-tight leading-[1.1]"
        >
          家庭成员
        </h1>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <router-link
          to="/dashboard/family-health"
          class="flex items-center gap-2 px-4 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-600 text-[13px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <i class="ri-heart-pulse-line text-sm"></i>
          健康档案
        </router-link>
        <button
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          @click="openAddModal"
        >
          <i class="ri-add-line text-sm"></i>
          添加成员
        </button>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-white border border-background-200 rounded-2xl p-5">
        <el-skeleton :rows="1" animated />
      </div>
    </div>

    <div
      v-else-if="members.length === 0"
      class="bg-white border border-background-200 rounded-2xl px-6 py-14 text-center"
    >
      <div
        class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-background-100 flex items-center justify-center"
      >
        <i class="ri-group-line text-2xl text-foreground-300"></i>
      </div>
      <p class="text-[15px] text-foreground-400 font-medium">还没有添加家庭成员</p>
      <button
        type="button"
        class="text-[13px] text-primary-600 hover:text-primary-700 mt-3 font-medium cursor-pointer"
        @click="openAddModal"
      >
        添加成员
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white border border-background-200 rounded-2xl p-5 hover:border-background-300 transition-colors duration-200 group"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-background-100 flex items-center justify-center flex-shrink-0"
          >
            <i class="ri-user-line text-foreground-400 text-[20px]"></i>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-1.5 flex-wrap">
              <p class="text-[16px] font-semibold text-foreground-900">{{ member.name }}</p>
              <span v-if="member.age != null" class="text-[12px] text-foreground-400"
                >{{ member.age }}岁</span
              >
            </div>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span
                class="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-primary-50/60 text-primary-600 border-primary-100/60"
              >
                {{ member.relationship }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-600 hover:bg-background-100 cursor-pointer transition-colors"
              @click="openEditModal(member)"
            >
              <i class="ri-pencil-line text-[14px]"></i>
            </button>
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
              @click="openDeleteConfirm(member)"
            >
              <i class="ri-delete-bin-line text-[14px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[440px] p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">
            {{ editingId ? '编辑家庭成员' : '添加家庭成员' }}
          </h3>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="closeModal"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2"
              >姓名<span class="text-red-500 ml-0.5">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="输入姓名"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">年龄</label>
            <input
              v-model="form.age"
              type="number"
              placeholder="可选"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2"
              >关系<span class="text-red-500 ml-0.5">*</span>
            </label>
            <input
              v-model="form.relationship"
              type="text"
              placeholder="输入关系，如：父亲、配偶、孩子…"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <p v-if="error" class="text-[12px] text-red-500 leading-snug">
            <i class="ri-error-warning-line"></i> {{ error }}
          </p>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              @click="closeModal"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? '提交中...' : editingId ? '保存修改' : '添加成员' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmModal
      :open="deletingId !== null"
      title="确认删除"
      :description="deleteDescription"
      confirm-text="删除"
      @close="closeDeleteConfirm"
      @confirm="handleDelete"
    />
  </div>
</template>
