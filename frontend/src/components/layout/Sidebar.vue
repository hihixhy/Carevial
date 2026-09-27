<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoMark from '../LogoMark.vue'
import ConfirmModal from '../ConfirmModal.vue'
import RenameConversationModal from '../RenameConversationModal.vue'
import UserAvatar from '../UserAvatar.vue'
import { useUserStore } from '../../stores/user'
import { useAiStore } from '../../stores/ai'

const userStore = useUserStore()
const aiStore = useAiStore()

defineProps({
  mobileOpen: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false }
})

const emit = defineEmits(['close-mobile', 'toggle-collapse'])

const route = useRoute()
const router = useRouter()

// 标题最大长度
const TITLE_MAX = 20

const navItems = [
  { path: '/dashboard', label: '首页', icon: 'ri-pulse-line', exact: true },
  { path: '/dashboard/family', label: '家庭成员', icon: 'ri-group-line' },
  { path: '/dashboard/family-health', label: '健康档案', icon: 'ri-heart-pulse-line' },
  { path: '/dashboard/medicines', label: '药品', icon: 'ri-capsule-line' },
  { path: '/dashboard/reminders', label: '提醒', icon: 'ri-timer-line' },
  { path: '/dashboard/checkin', label: '用药打卡', icon: 'ri-check-double-line' },
  { path: '/dashboard/ai', label: 'AI 助手', icon: 'ri-bubble-chart-line' }
]

const sortedConversations = computed(() => aiStore.sortedConversations)
// 选中的对话ID
const activeId = computed(() => aiStore.activeId)

const showLogoutConfirm = ref(false)
const deleteId = ref(null)
const renameId = ref(null)

const isAiPage = computed(() => route.path.startsWith('/dashboard/ai'))
const isSettingsPage = computed(() => route.path.startsWith('/dashboard/settings'))

watch(
  isAiPage,
  async (onAi) => {
    if (!onAi) return
    try {
      await aiStore.loadConversations()
    } catch (err) {
      ElMessage.error(err.message || '加载对话列表失败')
    }
  },
  { immediate: true }
)

const renameTarget = computed(
  () => sortedConversations.value.find((c) => c.id === renameId.value) || null
)

const isActive = (item) => {
  if (item.exact) return route.path === item.path
  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

const handleNavClick = () => {
  emit('close-mobile')
}

const goAiAssistant = async () => {
  emit('close-mobile')
  try {
    const loc = await aiStore.resolveAiEntry()
    await router.push(loc)
  } catch (err) {
    ElMessage.error(err.message || '加载对话列表失败')
    router.push({ name: 'ai' })
  }
}

// 新对话，进入草稿状态
const goNewConversation = () => {
  aiStore.enterDraft()
  if (route.name !== 'ai' || route.params.conversationId) {
    router.push({ name: 'ai' })
  }
  emit('close-mobile')
}

// 进入选中的对话详情页
const goSelectConversation = (id) => {
  if (!aiStore.selectConversation(id)) return
  router.push({ name: 'ai-conversation', params: { conversationId: id } })
  emit('close-mobile')
}

// 删除对话
const confirmDeleteConversation = async () => {
  if (!deleteId.value) return
  const id = deleteId.value
  try {
    const { switchedToDraft } = await aiStore.deleteConversation(id)
    deleteId.value = null
    if (switchedToDraft) {
      router.push({ name: 'ai' })
    }
    ElMessage.success('对话删除成功')
  } catch (err) {
    ElMessage.error(err.message || '删除对话失败')
  }
}

// 编辑对话名称
const onRenameConfirm = async (title) => {
  if (!renameId.value) return
  try {
    await aiStore.renameConversation(renameId.value, title)
    renameId.value = null
    ElMessage.success('对话名称修改成功')
  } catch (err) {
    ElMessage.error(err.message || '编辑对话名称失败')
  }
}

// 退出登录
const handleLogout = async () => {
  showLogoutConfirm.value = false
  await userStore.logout()
  emit('close-mobile')
  router.replace('/')
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-background-200 z-40 transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-[220px]'"
  >
    <div class="flex items-center px-5 h-[68px]">
      <router-link to="/dashboard" class="flex-shrink-0">
        <logo-mark size="md" :show-text="!collapsed" />
      </router-link>
    </div>

    <nav class="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      <div v-for="item in navItems" :key="item.path">
        <!-- AI自定义跳转 -->
        <button
          v-if="item.path === '/dashboard/ai'"
          type="button"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap relative cursor-pointer"
          :class="
            isActive(item)
              ? 'text-primary-700 bg-primary-50/60'
              : 'text-foreground-400 hover:text-foreground-700 hover:bg-background-100'
          "
          @click="goAiAssistant"
        >
          <div
            v-if="isActive(item)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full"
          />
          <i
            :class="[
              item.icon,
              'text-[16px] flex-shrink-0',
              isActive(item) ? 'text-primary-500' : ''
            ]"
          />
          <span v-if="!collapsed">{{ item.label }}</span>
        </button>

        <!-- 其他项 -->
        <router-link
          v-else
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap relative"
          :class="
            isActive(item)
              ? 'text-primary-700 bg-primary-50/60'
              : 'text-foreground-400 hover:text-foreground-700 hover:bg-background-100'
          "
        >
          <div
            v-if="isActive(item)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full"
          />
          <i
            :class="[
              item.icon,
              'text-[16px] flex-shrink-0',
              isActive(item) ? 'text-primary-500' : ''
            ]"
          />
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <div
          v-if="item.path === '/dashboard/ai' && isAiPage && !collapsed"
          class="mt-1 mb-1 space-y-0.5"
        >
          <button
            type="button"
            class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap font-medium"
            @click="goNewConversation"
          >
            <i class="ri-add-line text-[14px]" />
            <span class="text-[12px]">新对话</span>
          </button>

          <div
            v-for="conv in sortedConversations"
            :key="conv.id"
            class="group flex items-center rounded-lg transition-colors"
            :class="conv.id === activeId ? 'bg-primary-50/70' : 'hover:bg-background-100'"
          >
            <button
              type="button"
              class="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-left cursor-pointer"
              @click="goSelectConversation(conv.id)"
            >
              <span
                class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="conv.id === activeId ? 'bg-primary-500' : 'bg-background-300'"
              />
              <span
                class="flex-1 min-w-0 truncate whitespace-nowrap text-[12px]"
                :class="
                  conv.id === activeId
                    ? 'font-semibold text-primary-700'
                    : 'font-medium text-foreground-500'
                "
              >
                {{ conv.title }}
              </span>
            </button>
            <button
              type="button"
              title="重命名对话"
              class="w-6 h-6 flex items-center justify-center rounded-md text-foreground-300 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
              @click="renameId = conv.id"
            >
              <i class="ri-edit-line text-[13px]" />
            </button>
            <button
              type="button"
              title="删除对话"
              class="w-6 h-6 mr-1 flex items-center justify-center rounded-md text-foreground-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
              @click="deleteId = conv.id"
            >
              <i class="ri-delete-bin-line text-[13px]" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="px-3 py-3 space-y-0.5 border-t border-background-100">
      <router-link
        v-if="userStore.user && !collapsed"
        to="/dashboard/settings"
        class="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl hover:bg-background-100 transition-colors cursor-pointer"
        :class="isSettingsPage ? 'bg-background-100' : ''"
      >
        <user-avatar
          :username="userStore.user?.username"
          :avatar-url="userStore.user?.avatarUrl"
          size-class="w-8 h-8"
          text-class="text-[14px]"
        />
        <div class="min-w-0">
          <p class="text-[13px] font-medium text-foreground-800 truncate">
            {{ userStore.user?.username }}
          </p>
          <p class="text-[11px] text-foreground-400 truncate">{{ userStore.user?.email }}</p>
        </div>
      </router-link>
      <router-link
        v-else-if="userStore.user && collapsed"
        to="/dashboard/settings"
        title="设置"
        class="flex justify-center py-2 mb-1 rounded-xl hover:bg-background-100 transition-colors cursor-pointer"
      >
        <user-avatar
          :username="userStore.user?.username"
          :avatar-url="userStore.user?.avatarUrl"
          size-class="w-8 h-8"
          text-class="text-[14px]"
        />
      </router-link>

      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full whitespace-nowrap cursor-pointer"
        @click="showLogoutConfirm = true"
      >
        <i class="ri-logout-box-line text-[16px] flex-shrink-0" />
        <span v-if="!collapsed">退出登录</span>
      </button>

      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-foreground-300 hover:text-foreground-500 hover:bg-background-100 transition-colors w-full whitespace-nowrap cursor-pointer"
        @click="emit('toggle-collapse')"
      >
        <i
          class="text-[16px] flex-shrink-0"
          :class="collapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'"
        />
        <span v-if="!collapsed">收起</span>
      </button>
    </div>
  </aside>

  <confirm-modal
    :open="showLogoutConfirm"
    title="确认退出"
    description="退出后需要重新登录才能访问数据"
    confirm-text="退出"
    icon="ri-logout-box-line"
    @close="showLogoutConfirm = false"
    @confirm="handleLogout"
  />

  <confirm-modal
    :open="deleteId !== null"
    title="删除对话"
    description="删除后该对话的历史记录将无法恢复"
    confirm-text="删除"
    icon="ri-delete-bin-line"
    @close="deleteId = null"
    @confirm="confirmDeleteConversation"
  />

  <rename-conversation-modal
    :open="renameTarget !== null"
    :initial-title="renameTarget?.title || ''"
    :max-length="TITLE_MAX"
    @close="renameId = null"
    @confirm="onRenameConfirm"
  />

  <!-- Mobile overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-[998] bg-foreground-900/40 lg:hidden"
    @click="emit('close-mobile')"
  />

  <!-- Mobile drawer -->
  <aside
    class="lg:hidden fixed left-0 top-0 h-full bg-white border-r border-background-200 z-[999] transition-transform duration-300 flex flex-col w-[260px]"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center px-5 h-[68px] border-b border-background-100">
      <router-link to="/dashboard" class="flex-shrink-0" @click="handleNavClick">
        <logo-mark size="md" show-text />
      </router-link>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <div v-for="item in navItems" :key="item.path">
        <!-- AI自定义跳转 -->
        <button
          v-if="item.path === '/dashboard/ai'"
          type="button"
          class="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 whitespace-nowrap relative cursor-pointer"
          :class="
            isActive(item)
              ? 'text-primary-700 bg-primary-50/60'
              : 'text-foreground-400 hover:text-foreground-700 hover:bg-background-100'
          "
          @click="goAiAssistant"
        >
          <div
            v-if="isActive(item)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full"
          />
          <i
            :class="[
              item.icon,
              'text-[18px] flex-shrink-0',
              isActive(item) ? 'text-primary-500' : ''
            ]"
          />
          <span>{{ item.label }}</span>
        </button>
        <!-- 其他项 -->
        <router-link
          v-else
          :to="item.path"
          class="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 whitespace-nowrap relative"
          :class="
            isActive(item)
              ? 'text-primary-700 bg-primary-50/60'
              : 'text-foreground-400 hover:text-foreground-700 hover:bg-background-100'
          "
          @click="handleNavClick"
        >
          <div
            v-if="isActive(item)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full"
          />
          <i
            :class="[
              item.icon,
              'text-[18px] flex-shrink-0',
              isActive(item) ? 'text-primary-500' : ''
            ]"
          />
          <span>{{ item.label }}</span>
        </router-link>

        <div v-if="item.path === '/dashboard/ai' && isAiPage" class="mt-1 mb-1 space-y-0.5">
          <button
            type="button"
            class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer whitespace-nowrap font-medium"
            @click="goNewConversation"
          >
            <i class="ri-add-line text-[14px]" />
            <span class="text-[13px]">新对话</span>
          </button>

          <div
            v-for="conv in sortedConversations"
            :key="conv.id"
            class="group flex items-center rounded-lg transition-colors"
            :class="conv.id === activeId ? 'bg-primary-50/70' : 'hover:bg-background-100'"
          >
            <button
              type="button"
              class="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer"
              @click="goSelectConversation(conv.id)"
            >
              <span
                class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                :class="conv.id === activeId ? 'bg-primary-500' : 'bg-background-300'"
              />
              <span
                class="flex-1 min-w-0 truncate whitespace-nowrap text-[13px]"
                :class="
                  conv.id === activeId
                    ? 'font-semibold text-primary-700'
                    : 'font-medium text-foreground-500'
                "
              >
                {{ conv.title }}
              </span>
            </button>
            <button
              type="button"
              title="重命名对话"
              class="w-6 h-6 flex items-center justify-center rounded-md text-foreground-300 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
              @click="renameId = conv.id"
            >
              <i class="ri-edit-line text-[13px]" />
            </button>
            <button
              type="button"
              title="删除对话"
              class="w-6 h-6 mr-1 flex items-center justify-center rounded-md text-foreground-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
              @click="deleteId = conv.id"
            >
              <i class="ri-delete-bin-line text-[13px]" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="px-3 py-3 space-y-0.5 border-t border-background-100">
      <router-link
        v-if="userStore.user"
        to="/dashboard/settings"
        class="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl hover:bg-background-100 transition-colors cursor-pointer"
        :class="isSettingsPage ? 'bg-background-100' : ''"
        @click="handleNavClick"
      >
        <user-avatar
          :username="userStore.user?.username"
          :avatar-url="userStore.user?.avatarUrl"
          size-class="w-8 h-8"
          text-class="text-[14px]"
        />
        <div class="min-w-0">
          <p class="text-[13px] font-medium text-foreground-800 truncate">
            {{ userStore.user?.username }}
          </p>
          <p class="text-[11px] text-foreground-400 truncate">{{ userStore.user?.email }}</p>
        </div>
      </router-link>

      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full whitespace-nowrap cursor-pointer"
        @click="showLogoutConfirm = true"
      >
        <i class="ri-logout-box-line text-[18px] flex-shrink-0" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
