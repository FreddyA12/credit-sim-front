import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth.service';

export interface AuthUser { id: string; name: string; email: string; role: 'superadmin' | 'admin'; institutionId: string | null }

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<AuthUser | null>(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin');

  async function login(email: string, password: string) {
    const { data } = await authService.login({ email, password });
    token.value = data.access_token;
    user.value = data.user;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await authService.register({ name, email, password });
    token.value = data.access_token;
    user.value = data.user;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, isAuthenticated, isAdmin, isSuperAdmin, login, register, logout };
});
