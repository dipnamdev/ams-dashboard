import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  const { token, user } = response.data;
  
  if (window.electronAPI) {
    await window.electronAPI.setStoreValue('jwt_token', token);
    await window.electronAPI.setStoreValue('user', user);
    window.electronAPI.loginSuccess();
  } else {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  return { token, user };
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  if (window.electronAPI) {
    await window.electronAPI.setStoreValue('jwt_token', null);
    await window.electronAPI.setStoreValue('user', null);
    window.electronAPI.stopTracking();
  } else {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  }
};

export const getCurrentUser = async () => {
  if (window.electronAPI) {
    return await window.electronAPI.getStoreValue('user');
  }
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};
