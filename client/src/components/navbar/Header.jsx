import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';

export default function Header({ sidebarCollapsed, setMobileSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    dashboardAPI.getNotifications()
      .then(({ data }) => setUnreadCount(data.unreadCount))
      .catch(() => {});
  }, []);

  return (
    <header className={`fixed top-0 right-0 h-16 bg-myth-navy/80 backdrop-blur-md border-b border-myth-border z-30 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'} left-0`}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-myth-navy-light text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <p className="text-xs text-myth-accent tracking-widest uppercase hidden sm:block">Innovating Today, Empowering Tomorrow</p>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-myth-navy-light text-gray-400 hover:text-white transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-myth-accent text-myth-navy text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 lg:gap-3 p-2 rounded-lg hover:bg-myth-navy-light transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-myth-accent/20 flex items-center justify-center text-myth-accent font-semibold text-sm shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  `${user?.firstName?.[0]}${user?.lastName?.[0]}`
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-myth-card border border-myth-border rounded-lg shadow-xl z-50 py-1 animate-fade-in">
                  <button type="button" onClick={() => { navigate('/profile'); setShowMenu(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-myth-navy-light hover:text-white">
                    <User size={16} /> Profile
                  </button>
                  <hr className="border-myth-border my-1" />
                  <button type="button" onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
