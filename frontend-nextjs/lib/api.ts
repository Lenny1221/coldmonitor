import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          Cookies.set('accessToken', accessToken);
          if (newRefreshToken) {
            Cookies.set('refreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    Cookies.set('accessToken', accessToken);
    Cookies.set('refreshToken', refreshToken);
    return { user, accessToken, refreshToken };
  },

  register: async (data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
    technicianId?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;
    Cookies.set('accessToken', accessToken);
    Cookies.set('refreshToken', refreshToken);
    return { user, accessToken, refreshToken };
  },

  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getCustomerDashboard: async () => {
    const response = await api.get('/dashboard/customer');
    return response.data;
  },

  getTechnicianDashboard: async () => {
    const response = await api.get('/dashboard/technician');
    return response.data;
  },
};

// Locations API
export const locationsApi = {
  getAll: async () => {
    const response = await api.get('/locations');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },

  create: async (data: { locationName: string; address?: string }) => {
    const response = await api.post('/locations', data);
    return response.data;
  },

  update: async (id: string, data: { locationName?: string; address?: string }) => {
    const response = await api.patch(`/locations/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  },
};

// Cold Cells API
export const coldCellsApi = {
  getAll: async () => {
    // Get all through locations
    const locations = await locationsApi.getAll();
    return locations.flatMap((loc: any) => loc.coldCells || []);
  },

  getById: async (id: string) => {
    const response = await api.get(`/coldcells/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    type: 'fridge' | 'freezer';
    temperatureMinThreshold: number;
    temperatureMaxThreshold: number;
    locationId: string;
  }) => {
    const response = await api.post('/coldcells', data);
    return response.data;
  },

  update: async (id: string, data: {
    name?: string;
    type?: 'fridge' | 'freezer';
    temperatureMinThreshold?: number;
    temperatureMaxThreshold?: number;
  }) => {
    const response = await api.patch(`/coldcells/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/coldcells/${id}`);
    return response.data;
  },

  getReadings: async (id: string, range: '24h' | '7d' | '30d' = '24h') => {
    const response = await api.get(`/readings/coldcells/${id}/readings`, {
      params: { range },
    });
    return response.data;
  },
};

// Alerts API
export const alertsApi = {
  getAll: async (params?: { status?: string; type?: string }) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  getTechnicianAlerts: async (params?: { status?: string; type?: string }) => {
    const response = await api.get('/alerts/technician', { params });
    return response.data;
  },

  resolve: async (id: string, resolutionNote?: string) => {
    const response = await api.patch(`/alerts/${id}/resolve`, { resolutionNote });
    return response.data;
  },
};

export default api;
