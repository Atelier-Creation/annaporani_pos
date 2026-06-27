import axios from 'axios';
import { BASE_API } from './api.js';

const empApi = axios.create({
  baseURL: BASE_API,
  headers: { 'Content-Type': 'application/json' },
});

empApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('emp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

empApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('emp_token');
      localStorage.removeItem('emp_user');
      window.location.href = '/employee-login';
    }
    return Promise.reject(err);
  }
);

export default empApi;
