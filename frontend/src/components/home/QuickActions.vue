<script setup>
const actions = [
  {
    path: '/dashboard/medicines/add',
    label: '添加药品',
    icon: 'ri-add-line',
    desc: '录入新药',
    bg: 'bg-emerald-50',
    fg: 'text-emerald-600',
    ring: 'ring-emerald-100'
  },
  {
    path: '/dashboard/reminders',
    label: '用药提醒',
    icon: 'ri-timer-line',
    desc: '设置时间',
    bg: 'bg-amber-50',
    fg: 'text-amber-600',
    ring: 'ring-amber-100'
  },
  {
    path: '/dashboard/family',
    label: '管理家人',
    icon: 'ri-group-line',
    desc: '家庭成员',
    bg: 'bg-teal-50',
    fg: 'text-teal-600',
    ring: 'ring-teal-100'
  }
]
</script>

<template>
  <div class="bg-white border border-background-200 rounded-2xl p-5">
    <p class="text-[11px] text-foreground-400 mb-4 uppercase tracking-wider font-bold">快速操作</p>
    <div class="space-y-1">
      <RouterLink
        v-for="action in actions"
        :key="action.path"
        :to="action.path"
        class="group flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-background-100 transition-all duration-200 cursor-pointer"
      >
        <div
          :class="`w-9 h-9 rounded-full ${action.bg} ring-1 ${action.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`"
        >
          <i :class="`${action.icon} text-[15px] ${action.fg}`" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-semibold text-foreground-800 whitespace-nowrap">
            {{ action.label }}
          </p>
          <p class="text-[12px] text-foreground-400">{{ action.desc }}</p>
        </div>
        <i
          class="ri-arrow-right-s-line text-foreground-200 group-hover:text-foreground-400 transition-colors"
        />
      </RouterLink>
    </div>
  </div>
</template>
