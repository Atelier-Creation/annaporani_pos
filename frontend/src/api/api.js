import axios from 'axios';

// Base API URL
export const BASE_API = import.meta.env.VITE_API_URL || "http://localhost:10000/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: BASE_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  window.location.href = '/';
};

const isExpiredTokenError = (error) => {
  const status = error.response?.status;
  const message = String(
    error.response?.data?.message || error.response?.data?.error || ''
  ).toLowerCase();

  return (
    status === 401 ||
    (status === 403 && (message.includes('token') || message.includes('expired')))
  );
};

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Refresh token missing');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_API}/user/refresh-token`, { refreshToken })
      .then((response) => {
        const { token, refreshToken: newRefreshToken } = response.data || {};

        if (!token) {
          throw new Error('Invalid refresh response');
        }

        localStorage.setItem('token', token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't show toast for login requests - let the login page handle it
    const isLoginRequest = error.config?.url?.includes('/login');
    const isRefreshRequest = error.config?.url?.includes('/refresh-token');

    if (isExpiredTokenError(error) && !isLoginRequest && !isRefreshRequest) {
      try {
        const token = await refreshAccessToken();
        const originalRequest = error.config;

        if (!originalRequest || originalRequest._retry) {
          clearSessionAndRedirect();
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    if (isRefreshRequest && isExpiredTokenError(error)) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    // Show error toast notification for all other errors
    if (!isLoginRequest) {
      // Import message dynamically to avoid circular dependencies
      import('antd').then(({ message }) => {
        let errorMessage = 'An error occurred';

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;

          // Try to get error message from response
          errorMessage = data?.message || data?.error || errorMessage;

          // Customize message based on status code
          switch (status) {
            case 400:
              errorMessage = data?.message || 'Invalid request';
              break;
            case 403:
              errorMessage = 'Access denied';
              break;
            case 404:
              errorMessage = data?.message || 'Resource not found';
              break;
            case 409:
              errorMessage = data?.message || 'Conflict - Resource already exists';
              break;
            case 422:
              errorMessage = data?.message || 'Validation error';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later';
              break;
            case 502:
              errorMessage = 'Server is unavailable';
              break;
            case 503:
              errorMessage = 'Service temporarily unavailable';
              break;
            default:
              errorMessage = data?.message || `Error: ${status}`;
          }
        } else if (error.request) {
          // Request made but no response received
          errorMessage = 'Network error. Please check your connection';
        } else {
          // Something else happened
          errorMessage = error.message || 'An unexpected error occurred';
        }

        // Display error toast
        message.error({
          content: errorMessage,
          duration: 4,
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
