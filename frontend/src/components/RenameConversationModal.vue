<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialTitle: { type: String, default: '' },
  maxLength: { type: Number, default: 20 }
})

const emit = defineEmits(['close', 'confirm'])

const title = ref(props.initialTitle)

watch(
  () => [props.open, props.initialTitle],
  ([open, initial]) => {
    if (open) title.value = initial || ''
  }
)

const canSubmit = () => title.value.trim().length > 0

function onSubmit() {
  const next = title.value.trim()
  if (!next) return
  emit('confirm', next)
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[998] flex items-center justify-center p-4 bg-foreground-900/30 backdrop-blur-sm"
      @click="emit('close')"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[440px] p-6 border border-background-200"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-[18px] font-bold text-foreground-900 tracking-tight">编辑对话名称</h3>
          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 cursor-pointer transition-colors"
            @click="emit('close')"
          >
            <i class="ri-close-line text-lg" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="block text-[13px] font-semibold text-foreground-700 mb-2">对话名称</label>
            <div class="relative">
              <input
                v-model="title"
                type="text"
                autofocus
                :maxlength="maxLength"
                placeholder="输入对话名称"
                class="w-full px-4 py-3 pr-16 text-[14px] text-foreground-900 bg-background-50 border border-background-200 rounded-xl placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                @keydown="onKeydown"
              />
              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-foreground-300"
              >
                {{ title.length }}/{{ maxLength }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-3 text-[14px] text-foreground-500 bg-background-100 hover:bg-background-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-medium"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!canSubmit()"
              class="flex-1 py-3 text-[14px] text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors cursor-pointer whitespace-nowrap font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
