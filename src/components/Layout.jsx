import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Shield,
  UploadCloud,
  Search,
  BarChart2,
  Users,
  FileText,
  Gauge,
  Menu,
  X,
  Eye,
  Terminal,
} from 'lucide-react';
import { authAPI, removeAuthToken } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const navItems = [
  { href: '/', icon: Shield, label: 'Dashboard' },
  { href: '/live-monitor', icon: Terminal, label: 'Live Monitor' },
  { href: '/log-upload', icon: UploadCloud, label: 'Log Upload' },
  { href: '/threat-analyzer', icon: Search, label: 'Threat Analyzer' },
  { href: '/visualization-insights', icon: BarChart2, label: 'Visualization' },
  { href: '/user-access', icon: Users, label: 'User Access' },
  { href: '/explainability', icon: FileText, label: 'Explainability' },
  { href: '/system-performance', icon: Gauge, label: 'Performance' },
];

const Sidebar = ({ isMobile, isOpen, setIsOpen, user, onLogout }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      removeAuthToken();
      onLogout();
      navigate('/login');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of VISTA.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token and redirect even if logout API fails
      removeAuthToken();
      onLogout();
      navigate('/login');
    }
  };

  return (
    <motion.aside
      className={cn(
        "fixed top-0 left-0 h-full bg-background/80 backdrop-blur-sm z-50 flex flex-col transition-all duration-300 ease-in-out",
        isMobile ? (isOpen ? "w-64" : "w-0 overflow-hidden") : "w-64 sticky"
      )}
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tighter text-white">VISTA</span>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end
              onClick={() => isMobile && setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-border">
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-sm text-foreground">Logged in as:</p>
            <p className="font-bold">{user?.full_name || 'Admin User'}</p>
            <p className="text-sm text-muted-foreground">{user?.company_name}</p>
            <Button variant="destructive" size="sm" className="w-full mt-4" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

const Layout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-16 px-6 bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
           {isMobile && (
            <div className="flex items-center gap-2">
              <Eye className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold tracking-tighter text-white">VISTA</span>
            </div>
          )}
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          )}
           {!isMobile && (
             <div className="text-lg font-semibold text-white">Visual-Intelligence System for Threat Analysis</div>
           )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;