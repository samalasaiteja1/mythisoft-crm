import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/navbar/Header';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ panelLabel }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-myth-navy-dark">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        user={user} 
        panelLabel={panelLabel}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />
      <Header 
        sidebarCollapsed={collapsed} 
        setMobileSidebarOpen={setMobileSidebarOpen}
      />
      <main className={`pt-16 transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'} pl-0`}>
        <div className="p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
