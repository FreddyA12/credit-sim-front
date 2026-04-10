import api from './api';

export interface LoginPayload { email: string; password: string }

export const authService = {
  login: (payload: LoginPayload) => api.post('/auth/login', payload),
};
