import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../config';

type Role = 'OWNER' | 'USER' | null;

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: Role;
  plan_name: string;
}

interface UserFeatures {
  max_tunnels: number;
  custom_domain: boolean;
  tcp_support: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  features: UserFeatures | null;
  role: Role;
  loading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => void;
  hasAccess: (feature: string) => boolean;
  refreshFeatures: () => Promise<void>;
  theme: string;
  setTheme: (theme: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [features, setFeatures] = useState<UserFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'dark');

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Initial theme setup
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const fetchFeatures = async (userId: string, currentToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/features?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (e) {
      console.error("Failed to fetch features", e);
    }
  };

  const login = async (userData: User, authToken: string) => {
    setLoading(true);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('bizeto_user', JSON.stringify(userData));
    localStorage.setItem('bizeto_token', authToken);
    await fetchFeatures(userData.id, authToken);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setFeatures(null);
    localStorage.removeItem('bizeto_user');
    localStorage.removeItem('bizeto_token');
    localStorage.removeItem('onboarding_seen');
    // Redirect to landing page instead of login
    window.location.href = '/';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('bizeto_user');
    const savedToken = localStorage.getItem('bizeto_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        fetchFeatures(parsed.id, savedToken);
      } catch (e) {
        localStorage.removeItem('bizeto_user');
        localStorage.removeItem('bizeto_token');
      }
    }
    setLoading(false);
  }, []);

  const hasAccess = (feature: string) => {
    if (!user) return false;
    
    // Fitur Dasar: Selalu tersedia untuk semua role
    if (['stats', 'tunnels'].includes(feature)) return true;
    
    // Admin/Owner: Selalu memiliki akses ke semua fitur
    const userRole = user.role?.toUpperCase();
    if (userRole === 'OWNER') return true;
    
    // Fitur Lanjutan: Memerlukan data features dari backend
    if (!features) return false;

    switch (feature) {
      case 'custom_domain':
        return features.custom_domain;
      case 'tcp_support':
        return features.tcp_support;
      default:
        return false;
    }
  };

  const currentRole = user?.role ? (user.role.toUpperCase() as Role) : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      features, 
      role: currentRole, 
      loading, 
      login, 
      logout, 
      hasAccess,
      theme,
      setTheme,
      refreshFeatures: () => (user && token) ? fetchFeatures(user.id, token) : Promise.resolve()
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
