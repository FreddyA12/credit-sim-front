import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/AuthLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', redirect: '/login' },
        { path: 'login', name: 'login', component: () => import('../views/auth/LoginView.vue') },
        { path: 'register', name: 'register', component: () => import('../views/auth/RegisterView.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
        { path: 'institution', component: () => import('../views/admin/InstitutionConfig.vue') },
        { path: 'credit-types', component: () => import('../views/admin/CreditTypes.vue') },
        { path: 'credit-types/:id/charges', component: () => import('../views/admin/AdditionalCharges.vue') },
        { path: 'investment-products', component: () => import('../views/admin/InvestmentProducts.vue') },
        { path: 'credit-applications', component: () => import('../views/admin/CreditApplicationsManager.vue') },
        { path: 'investment-applications', component: () => import('../views/admin/InvestmentApplicationsManager.vue') },
      ],
    },
    {
      path: '/client',
      component: () => import('../layouts/ClientLayout.vue'),
      meta: { requiresAuth: true, role: 'client' },
      children: [
        { path: '', redirect: '/client/credit-simulator' },
        { path: 'credit-simulator', component: () => import('../views/client/CreditSimulator.vue') },
        { path: 'credit-application', component: () => import('../views/client/CreditApplication.vue') },
        { path: 'investment-simulator', component: () => import('../views/client/InvestmentSimulator.vue') },
        { path: 'investment-application', component: () => import('../views/client/InvestmentApplication.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();
  if (!auth.isAuthenticated) return next('/login');
  if (to.meta.role === 'admin' && !auth.isAdmin) return next('/client');
  if (to.meta.role === 'client' && auth.isAdmin) return next('/admin');
  next();
});

export default router;
