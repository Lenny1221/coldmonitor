import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

/** Safely extract a displayable string from API error (avoids React error #31) */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const ax = err as { response?: { data?: unknown; status?: number }; message?: string; code?: string };
  const data = ax.response?.data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const errVal = d.error;
    const msgVal = d.message;
    if (typeof errVal === 'string') return errVal;
    if (typeof msgVal === 'string') return msgVal;
    if (errVal && typeof errVal === 'object' && typeof (errVal as { message?: string }).message === 'string') return (errVal as { message: string }).message;
    if (msgVal && typeof msgVal === 'object' && typeof (msgVal as { message?: string }).message === 'string') return (msgVal as { message: string }).message;
  }
  // Geen response = netwerk- of CORS-fout (bv. VITE_API_URL niet goed geconfigureerd)
  const msg = ax.message;
  if (!ax.response && (ax.code === 'ERR_NETWORK' || (typeof msg === 'string' && msg.includes('Network')))) {
    return 'Kan geen verbinding maken met de server. Controleer of de backend bereikbaar is (VITE_API_URL bij Vercel).';
  }
  if (typeof msg === 'string') return msg;
  if (ax.response?.status === 405) return 'Verkeerde API-URL of serverconfiguratie. Controleer VITE_API_URL.';
  if (ax.response?.status === 404) return 'API niet gevonden. Controleer of VITE_API_URL correct is (Railway URL + /api).';
  return fallback;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  // Always check cookie for token (in case of page refresh)
  const cookieToken = Cookies.get('token');
  const tokenToUse = authToken || cookieToken;
  
  if (tokenToUse) {
    config.headers.Authorization = `Bearer ${tokenToUse}`;
    // Update authToken in memory if we got it from cookie
    if (!authToken && cookieToken) {
      authToken = cookieToken;
    }
  }
  return config;
});

// Token refresh queue to prevent multiple simultaneous refresh requests
let refreshTokenPromise: Promise<string> | null = null;

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          // Use existing refresh promise if one is in progress
          if (!refreshTokenPromise) {
            refreshTokenPromise = (async () => {
              try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                  refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                Cookies.set('token', accessToken, { expires: 7 });
                if (newRefreshToken) {
                  Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
                }
                
                authToken = accessToken;
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                return accessToken;
              } finally {
                // Clear promise after completion
                refreshTokenPromise = null;
              }
            })();
          }

          const accessToken = await refreshTokenPromise;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          refreshTokenPromise = null;
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          authToken = null;
          api.defaults.headers.common['Authorization'] = '';
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    // Altijd een veilige string voor UI (voorkomt React error #31 in cloud)
    (error as { safeMessage?: string }).safeMessage = getErrorMessage(error, 'Er is iets misgegaan');

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  setToken: setAuthToken,
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  registerCustomer: async (data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
    technicianId?: string;
  }) => {
    const payload = {
      ...data,
      phone: data.phone ?? '',
      address: data.address ?? '',
    };
    const response = await api.post('/auth/register', payload);
    return response.data;
  },
  registerTechnician: async (data: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    password: string;
  }) => {
    const payload = {
      ...data,
      phone: data.phone ?? '',
      companyName: data.companyName ?? '',
    };
    const response = await api.post('/auth/register/technician', payload);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Technicians API
export const techniciansApi = {
  search: async (query: string) => {
    const response = await api.get('/technicians/search', {
      params: { q: query },
    });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/technicians');
    return response.data;
  },
  getCustomers: async (technicianId: string) => {
    const response = await api.get(`/technicians/${technicianId}/customers`);
    return response.data;
  },
  unlinkCustomer: async (technicianId: string, customerId: string) => {
    const response = await api.delete(`/technicians/${technicianId}/customers/${customerId}`);
    return response.data;
  },
};

// Invitations API
export const invitationsApi = {
  send: async (data: { customerId: string; message?: string }) => {
    const response = await api.post('/invitations', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/invitations');
    return response.data;
  },
  accept: async (invitationId: string) => {
    const response = await api.patch(`/invitations/${invitationId}/accept`);
    return response.data;
  },
  reject: async (invitationId: string) => {
    const response = await api.patch(`/invitations/${invitationId}/reject`);
    return response.data;
  },
  cancel: async (invitationId: string) => {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};

// Customers API
export const customersApi = {
  getMe: async () => {
    const response = await api.get('/customers/me');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  search: async (query: string) => {
    const response = await api.get('/customers/search', {
      params: { q: query },
    });
    return response.data;
  },
  unlinkTechnician: async () => {
    const response = await api.delete('/customers/me/unlink-technician');
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
  create: async (data: { locationName: string; address: string }) => {
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
    try {
      // Get all through locations
      const locations = await locationsApi.getAll();
      const allColdCells = locations.flatMap((loc: any) => {
        if (loc.coldCells && Array.isArray(loc.coldCells)) {
          return loc.coldCells.map((cell: any) => ({
            ...cell,
            location: {
              id: loc.id,
              locationName: loc.locationName,
              address: loc.address,
            },
          }));
        }
        return [];
      });
      return allColdCells;
    } catch (error) {
      console.error('Failed to get all cold cells:', error);
      return [];
    }
  },
  getByLocation: async (locationId: string) => {
    const response = await api.get(`/coldcells/location/${locationId}`);
    return response.data;
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
};

// Devices API
export const devicesApi = {
  getById: async (id: string) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },
  getByColdCell: async (coldCellId: string) => {
    const response = await api.get(`/devices/coldcell/${coldCellId}`);
    return response.data;
  },
  getBySerial: async (serialNumber: string) => {
    const response = await api.get(`/devices/serial/${serialNumber}`);
    return response.data;
  },
  getAll: async () => {
    try {
      const locations = await locationsApi.getAll();
      const devices: any[] = [];
      for (const loc of locations) {
        if (loc.coldCells) {
          for (const cell of loc.coldCells) {
            const list = await api.get(`/devices/coldcell/${cell.id}`);
            devices.push(...(list.data || []));
          }
        }
      }
      return devices;
    } catch {
      return [];
    }
  },
  create: async (data: { serialNumber: string; coldCellId: string }) => {
    const response = await api.post('/devices', data);
    return response.data;
  },
  updateStatus: async (id: string, status: 'ONLINE' | 'OFFLINE') => {
    const response = await api.patch(`/devices/${id}/status`, { status });
    return response.data;
  },
};

// Measurements API (readings per device)
export const measurementsApi = {
  getByDevice: async (
    deviceId: string,
    params?: { startDate?: string; endDate?: string; limit?: number }
  ) => {
    const response = await api.get(`/readings/devices/${deviceId}/readings`, { params });
    return response.data;
  },
  getStats: async (
    deviceId: string,
    params: { startDate: string; endDate: string }
  ) => {
    const response = await api.get(`/readings/devices/${deviceId}/readings`, { params });
    const arr = Array.isArray(response.data) ? response.data : (response.data as any)?.data ?? [];
    const temps = arr
      .map((r: any) => r.temperature ?? r.temp)
      .filter((t: any) => typeof t === 'number');
    return {
      count: temps.length,
      min: temps.length ? Math.min(...temps) : null,
      max: temps.length ? Math.max(...temps) : null,
      avg: temps.length ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : null,
    };
  },
};

// Alarms API (legacy - use alertsApi for cold cell alerts)
export const alarmsApi = {
  getByDevice: async (_deviceId: string) => {
    const response = await api.get('/alerts', { params: { status: 'ACTIVE' } });
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getSummary: async (
    _deviceId: string,
    params: { startDate: string; endDate: string }
  ) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },
  getCSV: async (
    _deviceId: string,
    params: { startDate: string; endDate: string }
  ) => {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Readings API
export const readingsApi = {
  submitReading: async (serialNumber: string, data: {
    temperature: number;
    humidity?: number;
    powerStatus?: boolean;
    doorStatus?: boolean;
  }) => {
    const response = await api.post(`/readings/devices/${serialNumber}/readings`, data);
    return response.data;
  },
  getByColdCell: async (coldCellId: string, params?: {
    range?: '24h' | '7d' | '30d';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const response = await api.get(`/readings/coldcells/${coldCellId}/readings`, {
      params: params?.range ? { range: params.range } : params,
    });
    return response.data;
  },
  getByDevice: async (deviceId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const response = await api.get(`/readings/devices/${deviceId}/readings`, { params });
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
  getById: async (id: string) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },
  resolve: async (id: string) => {
    const response = await api.patch(`/alerts/${id}/resolve`);
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

export default api;
