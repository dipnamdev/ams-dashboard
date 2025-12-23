import axios from 'axios';
import toast from 'react-hot-toast';
// import dotenv from 'dotenv'


const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const emitAuthChange = (user) => {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
  }
};

const getApiUrl = () => Promise.resolve(BASE_URL);

const getToken = () => Promise.resolve(localStorage.getItem('jwt_token'));

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      emitAuthChange(null);
      toast.error('Session expired. Please login again.');
      // Use window.location to ensure a full redirection if needed, or rely on state
      // window.location.hash = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;


// api.interceptors.request.use(async (config) => {
//   const baseURL = await getApiUrl();
//   config.baseURL = baseURL;

//   const token = await getToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });