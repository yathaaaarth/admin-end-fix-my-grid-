import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ci_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ci_token');
      localStorage.removeItem('ci_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
