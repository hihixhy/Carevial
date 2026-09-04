import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import AppLayout from '../components/layout/AppLayout.vue'
import { useUserStore } from '../stores'

const appChildren = [
  {
    path: '',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: 'family',
    name: 'family',
    component: () => import('../views/FamilyView.vue')
  },
  {
    path: 'family-health',
    name: 'family-health',
    component: () => import('../views/FamilyHealthView.vue')
  },
  {
    path: 'medicines',
    name: 'medicines',
    component: () => import('../views/MedicinesView.vue')
  },
  {
    path: 'medicines/add',
    name: 'medicines-add',
    component: () => import('../views/MedicineAddView.vue')
  },
  {
    path: 'medicines/:id',
    name: 'medicines-detail',
    component: () => import('../views/MedicineDetailView.vue')
  },
  {
    path: 'reminders',
    name: 'reminders',
    component: () => import('../views/RemindersView.vue')
  },
  {
    path: 'checkin',
    name: 'checkin',
    component: () => import('../views/CheckinView.vue')
  },
  {
    path: 'settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: 'ai',
    name: 'ai',
    component: () => import('../views/AiView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('../views/FeedbackView.vue')
    },
    {
      path: '/dashboard',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: appChildren
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
  // 路由切换时控制滚动位置（如果url带锚点#id，平滑滚动到对应dom，否则滚动到页面最顶部）
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  // 获取用户信息
  const userStore = useUserStore()
  if (!userStore.bootstrapped) {
    await userStore.getUser()
  }

  // 如果路由不需要登录，则直接放行
  if (!to.matched.some((r) => r.meta.requiresAuth)) return true

  if (!userStore.isAuthenticated) {
    return {
      path: '/',
      query: { redirect: to.fullPath }, // 记录跳转前的路径，登录后重定向到该路径
      replace: true // true:替换当前路由，false:添加新路由
    }
  }

  return true
})

export default router
