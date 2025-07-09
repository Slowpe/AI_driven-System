import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import LogUpload from '@/pages/LogUpload';
import ThreatAnalyzer from '@/pages/ThreatAnalyzer';
import VisualizationInsights from '@/pages/VisualizationInsights';
import UserManagement from '@/pages/UserManagement';
import Explainability from '@/pages/Explainability';
import SystemPerformance from '@/pages/SystemPerformance';
import LiveMonitor from '@/pages/LiveMonitor';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import { isAuthenticated, getAuthToken, authAPI } from '@/lib/api';
import { LiveMonitorProvider } from '@/contexts/LiveMonitorContext';

const PrivateRoutes = ({ user, onLogout }) => {
  if (!user || !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout user={user} onLogout={onLogout} />;
};

const AuthRoutes = ({ user }) => {
  if (user && isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const OnboardingRoute = ({ user }) => {
    if (!user || !isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <Onboarding />;
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      if (isAuthenticated()) {
        const userInfo = await authAPI.getCurrentUser();
        setUser(userInfo);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleAuthChange = async () => {
    await checkAuthStatus();
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <LiveMonitorProvider>
      <Routes>
        <Route element={<AuthRoutes user={user} />}>
          <Route path="/login" element={<Login onLogin={handleAuthChange} />} />
          <Route path="/signup" element={<SignUp onSignUp={handleAuthChange} />} />
        </Route>
        
        <Route path="/onboarding" element={<OnboardingRoute user={user} />} />

        <Route element={<PrivateRoutes user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-monitor" element={<LiveMonitor />} />
          <Route path="/log-upload" element={<LogUpload />} />
          <Route path="/threat-analyzer" element={<ThreatAnalyzer />} />
          <Route path="/visualization-insights" element={<VisualizationInsights />} />
          <Route path="/user-access" element={<UserManagement />} />
          <Route path="/explainability" element={<Explainability />} />
          <Route path="/system-performance" element={<SystemPerformance />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </LiveMonitorProvider>
  );
}

export default App;