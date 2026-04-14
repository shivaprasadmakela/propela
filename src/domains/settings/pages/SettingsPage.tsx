import { useState } from 'react';

interface SettingsCategory {
  id: string;
  label: string;
  description?: string;
}

const CATEGORIES: SettingsCategory[] = [
  { id: 'user', label: 'User Setting', description: 'Manage user access and permissions within the CRM' },
  { id: 'template', label: 'Template Setting', description: 'Enhance deal tracking and customization' },
  { id: 'communication', label: 'Communication & Integration', description: 'Enable seamless communication and integrate essential tools' },
  { id: 'partner', label: 'Channel Partner', description: 'Enable channel partner module for our leadzump' },
  { id: 'security', label: 'Data and Security', description: 'Secure and organize your digital assets' },
];

export function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('user');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Sub-navigation Sidebar */}
        <aside className="w-80 flex flex-col gap-2 shrink-0">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex flex-col gap-1 px-4 py-4 rounded-2xl text-left transition-all duration-200
                ${activeCategory === category.id 
                  ? 'bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5' 
                  : 'hover:bg-muted/50 border border-transparent'}
              `}
            >
              <span className={`text-sm font-semibold ${activeCategory === category.id ? 'text-primary' : 'text-foreground/80'}`}>
                {category.label}
              </span>
              {category.description && (
                <span className="text-xs text-foreground/40 leading-relaxed">
                  {category.description}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-card/30 rounded-3xl border border-border/50 p-8 overflow-y-auto">
          {activeCategory === 'user' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-display">User Setting</h2>
                <p className="text-sm text-foreground/50">Invite user and manage profile efficiently</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Users Card */}
                <button className="group relative flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Users</h3>
                    <p className="text-sm text-foreground/40 mt-1">Add new users with role-based permissions</p>
                  </div>
                </button>

                {/* Profile Card */}
                <button className="group relative flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <span className="text-xl">👥</span>
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Profile</h3>
                    <p className="text-sm text-foreground/40 mt-1">Define role-specific access with tailored profiles</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeCategory !== 'user' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl mb-4">
                ⚙️
              </div>
              <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
              <p className="text-sm text-foreground/40 mt-2">
                The {CATEGORIES.find(c => c.id === activeCategory)?.label} module is currently under development.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
