<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmText: { type: String, default: '删除' },
  /** Remix Icon class，如 ri-delete-bin-line / ri-logout-box-line */
  icon: { type: String, default: 'ri-delete-bin-line' }
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-foreground-900/40"
      @click="emit('close')"
    >
      <div class="bg-white rounded-2xl w-full max-w-[360px] p-6" @click.stop>
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <i :class="[icon, 'text-xl text-red-500']" />
        </div>
        <h3 class="text-center text-[15px] font-semibold text-foreground-900 mb-2">{{ title }}</h3>
        <p v-if="description" class="text-center text-[13px] text-foreground-500 mb-6">
          {{ description }}
        </p>
        <div class="flex gap-3" :class="description ? '' : 'mt-6'">
          <button
            type="button"
            class="flex-1 py-2.5 text-[13px] font-medium text-foreground-600 bg-background-100 hover:bg-background-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            @click="emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 text-[13px] font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
