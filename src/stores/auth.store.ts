import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth.service';
import { getAuthToken, getAuthUserJson, setAuthSession, clearAuthSession } from '../utils/authStorage';

export interface AuthUser { id: string; name: string; email: string; role: 'superadmin' | 'admin'; institutionId: string | null }

function parseStoredUser(): AuthUser | null {
  const raw = getAuthUserJson();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getAuthToken());
  const user = ref<AuthUser | null>(parseStoredUser());

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin');

  async function login(email: string, password: string) {
    const { data } = await authService.login({ email, password });
    token.value = data.access_token;
    user.value = data.user;
    setAuthSession(data.access_token, JSON.stringify(data.user));
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await authService.register({ name, email, password });
    token.value = data.access_token;
    user.value = data.user;
    setAuthSession(data.access_token, JSON.stringify(data.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearAuthSession();
  }

  return { token, user, isAuthenticated, isAdmin, isSuperAdmin, login, register, logout };
});
