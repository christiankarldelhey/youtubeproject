import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/pages/main-page/ui/MainPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'main',
      component: MainPage,
    },
    {
      path: '/research/:id',
      name: 'research-area',
      component: () => import('@/pages/research-area-page/ui/ResearchAreaPage.vue'),
    },
  ],
})

export default router
