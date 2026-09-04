<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../components/SiteNav.vue'
import HeroSection from '../components/HeroSection.vue'
import ReminderSection from '../components/ReminderSection.vue'
import FamilySection from '../components/FamilySection.vue'
import AiAdvisorSection from '../components/AiAdvisorSection.vue'
import CtaSection from '../components/CtaSection.vue'
import SiteFooter from '../components/SiteFooter.vue'
import AuthModal from '../components/AuthModal.vue'

const route = useRoute()
const authOpen = ref(false)

function openAuthIfRedirect() {
  if (route.query.redirect) authOpen.value = true
}

onMounted(openAuthIfRedirect)
watch(() => route.query.redirect, openAuthIfRedirect)
</script>

<template>
  <div class="min-h-screen bg-background-50 text-foreground-900 antialiased">
    <SiteNav @start="authOpen = true" />
    <HeroSection @start="authOpen = true" />
    <ReminderSection />
    <FamilySection />
    <AiAdvisorSection />
    <CtaSection @start="authOpen = true" />
    <SiteFooter />
    <AuthModal :open="authOpen" @close="authOpen = false" />
  </div>
</template>
