<script setup>
import { computed } from 'vue'
import { LEGAL_DOCS } from '../data/legalDocs'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 'agreement' | 'privacy' */
  type: { type: String, default: 'agreement' }
})

const emit = defineEmits(['close'])

const doc = computed(() => LEGAL_DOCS[props.type] || LEGAL_DOCS.agreement)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-foreground-900/40"
      @click="emit('close')"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-[560px] max-h-[82vh] flex flex-col overflow-hidden"
        @click.stop
      >
        <div
          class="px-6 pt-6 pb-4 border-b border-background-100 flex items-start justify-between flex-shrink-0"
        >
          <div class="min-w-0 pr-3">
            <h3 class="text-[16px] font-semibold text-foreground-900">{{ doc.title }}</h3>
            <p class="text-[12px] text-foreground-400 mt-1">{{ doc.subtitle }}</p>
            <p class="text-[11px] text-foreground-300 mt-1">更新于 {{ doc.updatedAt }}</p>
          </div>
          <button
            type="button"
            class="w-7 h-7 rounded-md flex items-center justify-center text-foreground-400 hover:text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="关闭"
            @click="emit('close')"
          >
            <i class="ri-close-line text-lg" />
          </button>
        </div>

        <div class="px-6 py-5 overflow-y-auto space-y-5 min-h-0">
          <section v-for="(section, idx) in doc.sections" :key="idx">
            <h4 class="text-[14px] font-semibold text-foreground-900 mb-2">{{ section.heading }}</h4>
            <div class="space-y-2">
              <p
                v-for="(p, pIdx) in section.paragraphs"
                :key="pIdx"
                class="text-[13px] text-foreground-600 leading-relaxed"
              >
                {{ p }}
              </p>
            </div>
          </section>
        </div>

        <div class="px-6 py-4 border-t border-background-100 flex-shrink-0">
          <button
            type="button"
            class="w-full py-2.5 bg-foreground-900 hover:bg-foreground-800 text-background-50 text-[13px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            @click="emit('close')"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
