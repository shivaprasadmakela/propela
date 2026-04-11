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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
          flex flex-col border-r border-border bg-card
          transition-all duration-300 ease-in-out shrink-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            P
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
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
                    ? 'bg-primary/20 text-primary shadow-[inset_0_0_0_1px_var(--color-primary)]'
                    : 'text-foreground/50 hover:text-foreground/80 hover:bg-muted'
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
        <div className="px-3 py-3 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-foreground/40 hover:text-foreground/70 hover:bg-muted transition-all text-sm"
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
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-foreground/70">
              Welcome back, <span className="text-foreground">{user?.firstName || 'User'}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/50 flex items-center justify-center text-foreground/50 hover:text-foreground/80 transition-all relative">
              <span className="text-sm">🔔</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-muted transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {initials}
                </div>
                {!sidebarCollapsed && (
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground/90 leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-foreground/40 leading-tight">{user?.emailId}</p>
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 py-2 bg-card border border-border rounded-xl shadow-2xl z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-muted transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto w-full flex flex-col">
          <div className="max-w-[1400px] px-6 py-4 mx-auto w-full flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
