import axios from 'axios';

const getApiUrl = () => {
  if (window.electronAPI) {
    return window.electronAPI.getStoreValue('apiUrl').then(url => url || 'http://localhost:3000');
  }
  return Promise.resolve('http://localhost:3000');
};

const getToken = () => {
  if (window.electronAPI) {
    return window.electronAPI.getStoreValue('jwt_token');
  }
  return Promise.resolve(localStorage.getItem('jwt_token'));
};

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use(async (config) => {
  const baseURL = await getApiUrl();
  config.baseURL = baseURL;
  
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (window.electronAPI) {
        window.electronAPI.setStoreValue('jwt_token', null);
      } else {
        localStorage.removeItem('jwt_token');
      }
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
