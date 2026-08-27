<script setup>
import { ref } from 'vue'
import { familyMembers as mockFamilyMembers } from '../mocks/dashboard.js'

const relationshipStyles = {
  本人: 'bg-primary-50 text-primary-700 border-primary-100',
  配偶: 'bg-background-100 text-foreground-600 border-background-200',
  父亲: 'bg-background-100 text-foreground-600 border-background-200',
  母亲: 'bg-background-100 text-foreground-600 border-background-200',
  孩子: 'bg-primary-50/60 text-primary-600 border-primary-100/60',
  其他: 'bg-background-100 text-foreground-500 border-background-200'
}

const RELATIONSHIP_OPTIONS = ['本人', '配偶', '父亲', '母亲', '孩子', '其他']

const members = ref([...mockFamilyMembers])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)

const addForm = ref({ name: '', relationship: '' })
const editForm = ref({ name: '', relationship: '' })

function openEditModal(member) {
  editingId.value = member.id
  editForm.value = { name: member.name, relationship: member.relationship }
  showEditModal.value = true
}

function handleSaveEdit(e) {
  e.preventDefault()
  if (!editingId.value || !editForm.value.name.trim() || !editForm.value.relationship) return
  members.value = members.value.map((m) =>
    m.id === editingId.value
      ? { ...m, name: editForm.value.name.trim(), relationship: editForm.value.relationship }
      : m
  )
  showEditModal.value = false
  editingId.value = null
}

function handleDelete(id) {
  if (!window.confirm('确定要删除这个家庭成员吗？')) return
  members.value = members.value.filter((m) => m.id !== id)
}

function handleAdd(e) {
  e.preventDefault()
  if (!addForm.value.name.trim() || !addForm.value.relationship) return
  const newMember = {
    id: `fm-${Date.now()}`,
    name: addForm.value.name.trim(),
    relationship: addForm.value.relationship,
    avatarUrl: null
  }
  members.value = [...members.value, newMember]
  addForm.value = { name: '', relationship: '' }
  showAddModal.value = false
}
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
        <RouterLink
          to="/dashboard/family-health"
          class="flex items-center gap-2 px-4 py-2.5 bg-background-100 hover:bg-background-200 text-foreground-600 text-[13px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <i class="ri-heart-pulse-line text-sm"></i>
          健康档案
        </RouterLink>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <i class="ri-add-line text-sm"></i>
          添加成员
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p class="text-[16px] font-semibold text-foreground-900">{{ member.name }}</p>
            <span
              class="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mt-2 border"
              :class="relationshipStyles[member.relationship] || relationshipStyles['其他']"
            >
              {{ member.relationship }}
            </span>
          </div>

          <div class="flex items-center gap-1">
            <button
              @click="openEditModal(member)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-foreground-600 hover:bg-background-100 cursor-pointer transition-colors"
            >
              <i class="ri-pencil-line text-[14px]"></i>
            </button>
            <button
              @click="handleDelete(member.id)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-300 hover:text-primary-500 hover:bg-primary-50 cursor-pointer transition-colors"
            >
              <i class="ri-delete-bin-line text-[14px]"></i>
            </button>
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
        class="bg-white rounded-2xl w-full max-w-[440px] p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">添加家庭成员</h3>
          <button
            @click="showAddModal = false"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form @submit="handleAdd" class="space-y-4">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">姓名</label>
            <input
              type="text"
              required
              v-model="addForm.name"
              placeholder="输入姓名"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">关系</label>
            <select
              required
              v-model="addForm.relationship"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            >
              <option value="">选择关系</option>
              <option v-for="r in RELATIONSHIP_OPTIONS" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
            >
              确认添加
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
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑家庭成员</h3>
          <button
            @click="showEditModal = false"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
          >
            <i class="ri-close-line text-lg"></i>
          </button>
        </div>
        <form @submit="handleSaveEdit" class="space-y-4">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">姓名</label>
            <input
              type="text"
              required
              v-model="editForm.name"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">关系</label>
            <select
              required
              v-model="editForm.relationship"
              class="w-full px-4 py-3 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer"
            >
              <option v-for="r in RELATIONSHIP_OPTIONS" :key="r" :value="r">{{ r }}</option>
            </select>
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
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
