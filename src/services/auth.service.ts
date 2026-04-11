import api from './api';

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; password: string }

export const authService = {
  login: (payload: LoginPayload) => api.post('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post('/auth/register', payload),
};
