import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('../layouts/AuthLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', name: 'login', component: () => import('../views/auth/LoginView.vue') },
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
      path: '/superadmin',
      component: () => import('../layouts/SuperAdminLayout.vue'),
      meta: { requiresAuth: true, role: 'superadmin' },
      children: [
        { path: '', redirect: '/superadmin/dashboard' },
        { path: 'dashboard', component: () => import('../views/superadmin/SuperAdminDashboard.vue') },
        { path: 'institutions', component: () => import('../views/superadmin/InstitutionsManager.vue') },
        { path: 'jprf-rates', component: () => import('../views/superadmin/JprfRatesManager.vue') },
        { path: 'bce-rate-limits', component: () => import('../views/superadmin/BceRateLimitsManager.vue') },
      ],
    },
    {
      path: '/:slug',
      component: () => import('../layouts/ClientLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', component: () => import('../views/client/SlugHome.vue') },
        { path: 'creditos', component: () => import('../views/client/CreditSimulator.vue') },
        { path: 'solicitar-credito', component: () => import('../views/client/CreditApplication.vue') },
        { path: 'inversiones', component: () => import('../views/client/InvestmentSimulator.vue') },
        { path: 'invertir', component: () => import('../views/client/InvestmentApplication.vue') },
        { path: 'estado', component: () => import('../views/client/StatusView.vue') },
      ],
    },
    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (to.meta.public) return next();
  if (!auth.isAuthenticated) return next('/login');
  if (to.meta.role === 'admin' && !auth.isAdmin) {
    return next(auth.isSuperAdmin ? '/superadmin' : '/login');
  }
  if (to.meta.role === 'superadmin' && !auth.isSuperAdmin) {
    return next(auth.isAdmin ? '/admin' : '/login');
  }
  next();
});

export default router;
