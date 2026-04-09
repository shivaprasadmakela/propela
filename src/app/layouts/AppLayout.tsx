import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '◫' },
  { label: 'Deals', path: '/deals', icon: '◈' },
  { label: 'Leads', path: '/leads', icon: '◉' },
  { label: 'Products', path: '/products', icon: '▣' },
  { label: 'Campaigns', path: '/campaigns', icon: '◆' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
          flex flex-col border-r border-white/[0.06] bg-[#0d0d14]
          transition-all duration-300 ease-in-out shrink-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/[0.06] gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            P
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Propela
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }`
              }
            >
              <div className="w-5 flex items-center justify-center shrink-0">
                <span className="text-base">{item.icon}</span>
              </div>
              {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all text-sm"
          >
            <span className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}>
              ‹‹
            </span>
            {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0d0d14]/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-white/70">
              Welcome back, <span className="text-white">{user?.firstName || 'User'}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 hover:text-white/80 transition-all relative">
              <span className="text-sm">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                {!sidebarCollapsed && (
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-white/90 leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-white/40 leading-tight">{user?.emailId}</p>
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 py-2 bg-[#1a1a28] border border-white/[0.08] rounded-xl shadow-2xl z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.04] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
