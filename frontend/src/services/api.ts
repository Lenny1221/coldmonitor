import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const isNative = () => Capacitor.isNativePlatform();

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
  // Web: check cookie on refresh. Native: use authToken (set by AuthContext from Preferences)
  const storedToken = !isNative() ? tokenStorage.getTokenSync() : null;
  const tokenToUse = authToken || storedToken;

  if (tokenToUse) {
    config.headers.Authorization = `Bearer ${tokenToUse}`;
    if (!authToken && storedToken) authToken = storedToken;
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

      const refreshToken = isNative()
        ? await tokenStorage.getRefreshToken()
        : tokenStorage.getRefreshTokenSync();
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
                await tokenStorage.setToken(accessToken);
                if (newRefreshToken) await tokenStorage.setRefreshToken(newRefreshToken);

                authToken = accessToken;
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                return accessToken;
              } finally {
                refreshTokenPromise = null;
              }
            })();
          }

          const accessToken = await refreshTokenPromise;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          refreshTokenPromise = null;
          await tokenStorage.removeToken();
          await tokenStorage.removeRefreshToken();
          authToken = null;
          api.defaults.headers.common['Authorization'] = '';
          if (typeof window !== 'undefined') {
            const ax = refreshError as { response?: { data?: { code?: string } } };
            const code = ax.response?.data?.code;
            window.location.href = code === 'EMAIL_NOT_VERIFIED' ? '/verify-email-required' : '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Geen refresh token – redirect naar login
        await tokenStorage.removeToken();
        await tokenStorage.removeRefreshToken();
        authToken = null;
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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
  registerPushToken: async (pushToken: string | null) => {
    await api.patch('/auth/me/push-token', { pushToken });
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
  createCustomer: async (technicianId: string, data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    locationName?: string;
    locationAddress?: string;
  }) => {
    const response = await api.post(`/technicians/${technicianId}/customers`, data);
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
  updateSettings: async (data: {
    openingTime?: string;
    closingTime?: string;
    nightStart?: string;
    backupPhone?: string;
    backupContacts?: { name: string; phone: string; addedBy?: string }[];
  }) => {
    const response = await api.patch('/customers/me/settings', data);
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
    doorAlarmDelaySeconds?: number;
  }) => {
    const response = await api.patch(`/coldcells/${id}`, data);
    return response.data;
  },
  updateSettings: async (id: string, data: {
    min_temp: number;
    max_temp: number;
    door_alarm_delay_seconds: number;
    require_resolution_reason?: boolean;
  }) => {
    const response = await api.put(`/coldcells/${id}/settings`, data);
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
  getState: async (deviceId: string) => {
    const response = await api.get(`/devices/${deviceId}/state`);
    return response.data;
  },
  getDoorStats: async (deviceId: string, from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get(`/devices/${deviceId}/door-stats`, { params });
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
  sendCommand: async (deviceId: string, commandType: string, parameters?: any) => {
    const response = await api.post(`/devices/${deviceId}/commands`, {
      commandType,
      parameters,
    });
    return response.data;
  },
  getRS485Status: async (coldCellId: string) => {
    const response = await api.get(`/devices/coldcells/${coldCellId}/rs485-status`);
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

// HACCP Audit Report API
export const haccpReportsApi = {
  getAuditData: async (params: {
    customerId?: string;
    locationId?: string;
    coldCellIds?: string[];
    startDate: string;
    endDate: string;
  }) => {
    const { coldCellIds, ...rest } = params;
    const response = await api.get('/reports/haccp/audit-data', {
      params: {
        ...rest,
        coldCellIds: coldCellIds?.length ? JSON.stringify(coldCellIds) : undefined,
      },
    });
    return response.data;
  },
  downloadPdf: async (params: {
    customerId?: string;
    locationId?: string;
    coldCellIds?: string[];
    startDate: string;
    endDate: string;
  }) => {
    const { coldCellIds, ...rest } = params;
    const response = await api.get('/reports/haccp/pdf', {
      params: {
        ...rest,
        coldCellIds: coldCellIds?.length ? JSON.stringify(coldCellIds) : undefined,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  downloadExcel: async (params: {
    customerId?: string;
    locationId?: string;
    coldCellIds?: string[];
    startDate: string;
    endDate: string;
  }) => {
    const { coldCellIds, ...rest } = params;
    const response = await api.get('/reports/haccp/excel', {
      params: {
        ...rest,
        coldCellIds: coldCellIds?.length ? JSON.stringify(coldCellIds) : undefined,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Installations API (onderhoud)
export interface InstallationCreateData {
  name: string;
  type: string;
  refrigerantType: string;
  refrigerantKg: number;
  nominalCoolingKw?: number;
  hasLeakDetection?: boolean;
  firstUseDate?: string;
  locationId?: string;
  customerId: string;
  technicianIds?: string[];
}

export const installationsApi = {
  getAll: async (params?: { customerId?: string; status?: string }) => {
    const response = await api.get('/installations', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/installations/${id}`);
    return response.data;
  },
  create: async (data: InstallationCreateData) => {
    const response = await api.post('/installations', data);
    return response.data;
  },
  update: async (id: string, data: Partial<InstallationCreateData>) => {
    const response = await api.patch(`/installations/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    await api.delete(`/installations/${id}`);
  },
};

// Tickets API
export const ticketsApi = {
  getAll: async (params?: { status?: string }) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },
  create: async (data: {
    type: string;
    urgency?: string;
    description: string;
    installationId?: string;
    proposedSlots: { slotIndex: number; date: string; preference: string }[];
  }) => {
    const response = await api.post('/tickets', data);
    return response.data;
  },
  update: async (id: string, data: {
    type?: string;
    urgency?: string;
    description?: string;
    installationId?: string;
    proposedSlots?: { slotIndex: number; date: string; preference: string }[];
  }) => {
    const response = await api.patch(`/tickets/${id}`, data);
    return response.data;
  },
  cancel: async (id: string) => {
    const response = await api.patch(`/tickets/${id}`, { cancel: true });
    return response.data;
  },
  updateStatus: async (
    id: string,
    data: { status?: string; scheduledAt?: string; resolutionSummary?: string; confirmedSlotIndex?: number }
  ) => {
    const response = await api.patch(`/tickets/${id}/status`, data);
    return response.data;
  },
};

// Koudemiddelen Logboek API (EU 517/2014, NBN EN 378)
export const refrigerantLogbookApi = {
  getGwpTable: async () => {
    const response = await api.get('/refrigerant-logbook/gwp');
    return response.data;
  },
  getInstallations: async () => {
    const response = await api.get('/refrigerant-logbook/installations');
    return response.data;
  },
  getLogEntries: async (installationId: string) => {
    const response = await api.get(`/refrigerant-logbook/installations/${installationId}/entries`);
    return response.data;
  },
  addLogEntry: async (installationId: string, data: {
    category: string;
    performedAt: string;
    technicianName: string;
    technicianCertNr?: string;
    notes?: string;
    data: Record<string, any>;
  }) => {
    const response = await api.post(`/refrigerant-logbook/installations/${installationId}/entries`, data);
    return response.data;
  },
  downloadAttest: async (entryId: string) => {
    const response = await api.get(`/refrigerant-logbook/entries/${entryId}/attest`, {
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
  getDoorEvents: async (coldCellId: string, days: number = 1) => {
    const response = await api.get(`/readings/coldcells/${coldCellId}/door-events`, {
      params: { days },
    });
    return response.data;
  },
};

// Cold cell state API (door realtime + polling fallback)
export const coldCellStateApi = {
  getState: async (coldCellId: string) => {
    const response = await api.get(`/coldcells/${coldCellId}/state`);
    return response.data;
  },
  getSSEUrl: (coldCellId: string) => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
    return `${base}/coldcells/${coldCellId}/state/stream`;
  },
  pushDoor: async (coldCellId: string, state: 'OPEN' | 'CLOSED', deviceId?: string) => {
    const response = await api.post(`/coldcells/${coldCellId}/push-door`, { state, deviceId });
    return response.data;
  },
};

// Alerts API
export const alertsApi = {
  getAll: async (params?: { status?: 'active' | 'resolved' | string; type?: string }) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },
  getTechnicianAlerts: async (params?: { status?: 'active' | 'resolved' | string; type?: string }) => {
    const response = await api.get('/alerts/technician', { params });
    return response.data;
  },
  getActive: async () => {
    const response = await api.get('/alarms/active');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/alerts/${id}`);
    return response.data;
  },
  resolve: async (id: string, resolutionNote?: string) => {
    const response = await api.patch(`/alerts/${id}/resolve`, { resolutionNote });
    return response.data;
  },
  acknowledge: async (alarmId: string) => {
    const response = await api.post('/alarm/acknowledge', { alarmId });
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
