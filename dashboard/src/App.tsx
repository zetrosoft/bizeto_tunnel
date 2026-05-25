import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PlanDetailPage = lazy(() => import('./pages/PlanDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

type Role = 'OWNER' | 'USER';

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 dark:text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-zinc-500 animate-pulse">Memuat halaman...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: Role }) => {
  const { role, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const DashboardRouter = () => {
  const { role, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === 'OWNER') return <Navigate to="/owner" replace />;
  if (normalizedRole === 'USER') return <Navigate to="/user" replace />;
  
  return <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/plan/:planId" element={<PlanDetailPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/dashboard" 
          element={<DashboardRouter />} 
        />

        <Route 
          path="/user/*" 
          element={
            <ProtectedRoute allowedRole="USER">
              <UserDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/owner/*" 
          element={
            <ProtectedRoute allowedRole="OWNER">
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen transition-colors duration-300">
          <AppRoutes />
        </div>
        {/* Global SVG Filter to make white backgrounds transparent */}
        <svg style={{ visibility: 'hidden', position: 'absolute' }} width="0" height="0">
          <filter id="remove-white">
            <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -1 -1 -1 1 1" />
          </filter>
        </svg>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
