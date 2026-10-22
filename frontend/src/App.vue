<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { onAuthLogout } from './utils/authSync'

const router = useRouter()
const userStore = useUserStore()

let unsubscribe = null

onMounted(() => {
  unsubscribe = onAuthLogout(() => {
    userStore.clearSession()
    if (router.currentRoute.value.matched.some((r) => r.meta.requiresAuth)) {
      router.replace('/')
    }
  })
})

onBeforeUnmount(() => {
  unsubscribe?.()
})
</script>

<template>
  <RouterView />
</template>
