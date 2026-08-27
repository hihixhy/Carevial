<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogoMark from '../LogoMark.vue'
import LogoutConfirmModal from './LogoutConfirmModal.vue'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

defineProps({
  mobileOpen: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false }
})

const emit = defineEmits(['close-mobile', 'toggle-collapse'])

const route = useRoute()
const router = useRouter()

const showLogoutConfirm = ref(false)

const navItems = [
  { path: '/dashboard', label: '首页', icon: 'ri-pulse-line', exact: true },
  { path: '/dashboard/family', label: '家庭成员', icon: 'ri-group-line' },
  { path: '/dashboard/family-health', label: '健康档案', icon: 'ri-heart-pulse-line' },
  { path: '/dashboard/medicines', label: '药品', icon: 'ri-capsule-line' },
  { path: '/dashboard/reminders', label: '提醒', icon: 'ri-timer-line' },
  { path: '/dashboard/checkin', label: '用药打卡', icon: 'ri-check-double-line' },
  { path: '/dashboard/ai', label: 'AI 助手', icon: 'ri-bubble-chart-line' },
  { path: '/dashboard/settings', label: '设置', icon: 'ri-settings-3-line' }
]

function isActive(item) {
  if (item.exact) return route.path === item.path
  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

function handleNavClick() {
  emit('close-mobile')
}

async function handleLogout() {
  await userStore.logout()
  showLogoutConfirm.value = false
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
      <RouterLink to="/dashboard" class="flex-shrink-0">
        <LogoMark size="md" :show-text="!collapsed" />
      </RouterLink>
    </div>

    <nav class="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
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
      </RouterLink>
    </nav>

    <div class="px-3 py-3 space-y-0.5 border-t border-background-100">
      <div v-if="userStore.user && !collapsed" class="px-3 py-2.5 mb-1">
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-full bg-background-100 flex items-center justify-center flex-shrink-0"
          >
            <i class="ri-user-line text-foreground-400 text-[14px]" />
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-foreground-800 truncate">
              {{ userStore.user?.username }}
            </p>
            <p class="text-[11px] text-foreground-400 truncate">{{ userStore.user?.email }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="user && collapsed" class="flex justify-center py-2 mb-1">
        <div class="w-8 h-8 rounded-full bg-background-100 flex items-center justify-center">
          <i class="ri-user-line text-foreground-400 text-[14px]" />
        </div>
      </div>

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

  <!-- Logout confirm -->
  <LogoutConfirmModal
    :open="showLogoutConfirm"
    @close="showLogoutConfirm = false"
    @confirm="handleLogout"
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
      <RouterLink to="/dashboard" class="flex-shrink-0" @click="handleNavClick">
        <LogoMark size="md" show-text />
      </RouterLink>
    </div>

    <div v-if="user" class="px-5 py-3.5 border-b border-background-100">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-full bg-background-100 flex items-center justify-center flex-shrink-0"
        >
          <i class="ri-user-line text-foreground-400 text-[15px]" />
        </div>
        <div class="min-w-0">
          <p class="text-[14px] font-medium text-foreground-800 truncate">{{ user.name }}</p>
          <p class="text-[12px] text-foreground-400 truncate">{{ user.email }}</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
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
      </RouterLink>
    </nav>

    <div class="px-3 py-3 space-y-0.5 border-t border-background-100">
      <button
        class="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full whitespace-nowrap cursor-pointer"
        @click="showLogoutConfirm = true"
      >
        <i class="ri-logout-box-line text-[18px] flex-shrink-0" />
        <span>退出登录</span>
      </button>
    </div>
  </aside>
</template>
