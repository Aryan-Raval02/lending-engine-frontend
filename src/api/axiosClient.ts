import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject JWT
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Inject Tenant ID header if missing (for requests where tenant matters)
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId && config.headers && !config.headers['X-Tenant-ID']) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    // Inject User ID header if missing (required by backend for auditing/ownership)
    const userId = localStorage.getItem('userId');
    if (userId && config.headers && !config.headers['X-User-ID']) {
      config.headers['X-User-ID'] = userId;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s and Silent JWT Refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Make isolated request to refresh token
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            headers: {
              'X-Refresh-Token': refreshToken
            }
          });
          
          const newAccessToken = refreshResponse.data.accessToken;
          const newRefreshToken = refreshResponse.data.refreshToken;
          
          // Update storage
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Session expired, please login again.');
      }
      
      // If refresh failed or no refresh token exists, logout
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('userId');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
