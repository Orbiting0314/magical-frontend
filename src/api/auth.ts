import api from './client';

export async function login(password: string) {
  const { data } = await api.post<{ success: boolean }>('/auth/login', { password });
  return data;
}

export async function checkStatus() {
  const { data } = await api.get<{ authenticated: boolean }>('/auth/status');
  return data;
}

export async function logout() {
  const { data } = await api.post<{ success: boolean }>('/auth/logout');
  return data;
}
