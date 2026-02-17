import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authApi } from '../services/api';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER';
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  registerCustomer: (data: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    technicianId?: string;
  }) => Promise<void>;
  registerTechnician: (data: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Update ref when token changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = Cookies.get('token');
      if (storedToken) {
        setToken(storedToken);
        tokenRef.current = storedToken;
        authApi.setToken(storedToken);
        await fetchUser(storedToken);
      } else {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'refreshToken') {
        const newToken = Cookies.get('token');
        const currentToken = tokenRef.current;
        if (newToken && newToken !== currentToken) {
          setToken(newToken);
          tokenRef.current = newToken;
          authApi.setToken(newToken);
          fetchUser(newToken);
        } else if (!newToken && currentToken) {
          // Token was removed in another tab
          setUser(null);
          setToken(null);
          tokenRef.current = null;
          authApi.setToken(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update token in API client when it changes
  useEffect(() => {
    if (token) {
      authApi.setToken(token);
    }
  }, [token]);

  const fetchUser = async (authToken: string) => {
    try {
      authApi.setToken(authToken);
      const userData = await authApi.getCurrentUser();
      // Only update user if token hasn't changed during fetch
      const currentToken = Cookies.get('token');
      if (currentToken === authToken) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      const currentToken = Cookies.get('token');
      // Only clear if token hasn't changed (another tab might have logged in)
      if (currentToken === authToken) {
        Cookies.remove('token');
        setToken(null);
        authApi.setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const accessToken = response.accessToken || response.token;
    // Update in correct order: token first, then user
    Cookies.set('token', accessToken, { expires: 7 });
    if (response.refreshToken) {
      Cookies.set('refreshToken', response.refreshToken, { expires: 7 });
    }
    authApi.setToken(accessToken);
    setToken(accessToken);
    tokenRef.current = accessToken;
    setUser(response.user);
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
  };

  const loginWithToken = async (accessToken: string) => {
    Cookies.set('token', accessToken, { expires: 7 });
    authApi.setToken(accessToken);
    setToken(accessToken);
    tokenRef.current = accessToken;
    await fetchUser(accessToken);
    window.dispatchEvent(new Event('storage'));
  };

  const registerCustomer = async (data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    address?: string;
    password: string;
    technicianId?: string;
  }) => {
    await authApi.registerCustomer(data);
    // Geen tokens – gebruiker moet eerst e-mail bevestigen
  };

  const registerTechnician = async (data: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    password: string;
  }) => {
    await authApi.registerTechnician(data);
    // Geen tokens – gebruiker moet eerst e-mail bevestigen
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    authApi.setToken(null);
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginWithToken, registerCustomer, registerTechnician, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
