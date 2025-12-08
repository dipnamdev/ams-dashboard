import api from './api';

const emitAuthChange = (user) => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
  }
};

const persistAuthState = async (token, user) => {
  localStorage.setItem('jwt_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

const clearAuthState = async () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
};

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  const { token, user } = response.data.data;

  await persistAuthState(token, user);
  emitAuthChange(user);

  return { token, user };
};

export const logout = async () => {
  try {
    await api.post('/api/attendance/check-out');
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }

  await clearAuthState();
  emitAuthChange(null);
};

export const getCurrentUser = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data.data;
};
