import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Dashboard from '@/views/Dashboard.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
}); 