import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faFileLines, 
  faComments, 
  faHandshake, 
  faShieldHalved,
  faUsers,
  faIdCard,
  faGear
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { UsersTable } from '@/domains/users/components/UsersTable';

interface SettingsCategory {
  id: string;
  label: string;
  description?: string;
  icon: IconDefinition;
}

const CATEGORIES: SettingsCategory[] = [
  { 
    id: 'user', 
    label: 'User Setting', 
    description: 'Manage user access and permissions within the CRM',
    icon: faUser
  },
  { 
    id: 'template', 
    label: 'Template Setting', 
    description: 'Enhance deal tracking and customization',
    icon: faFileLines
  },
  { 
    id: 'communication', 
    label: 'Communication & Integration', 
    description: 'Enable seamless communication and integrate essential tools',
    icon: faComments
  },
  { 
    id: 'partner', 
    label: 'Channel Partner', 
    description: 'Enable channel partner module for our leadzump',
    icon: faHandshake
  },
  { 
    id: 'security', 
    label: 'Data and Security', 
    description: 'Secure and organize your digital assets',
    icon: faShieldHalved
  },
];

export function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('user');
  const [view, setView] = useState<'grid' | 'users-list'>('grid');

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setView('grid');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        <aside className="w-80 flex flex-col gap-2 shrink-0">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`
                flex items-start gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-300
                ${activeCategory === category.id 
                  ? 'bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5' 
                  : 'hover:bg-muted/50 border border-transparent'}
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300
                ${activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/40'}
              `}>
                <FontAwesomeIcon icon={category.icon} className="text-sm" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-semibold ${activeCategory === category.id ? 'text-primary' : 'text-foreground/80'}`}>
                  {category.label}
                </span>
                {category.description && (
                  <span className="text-xs text-foreground/40 leading-tight">
                    {category.description}
                  </span>
                )}
              </div>
            </button>
          ))}
        </aside>

        <main className="flex-1 bg-card/30 rounded-3xl border border-border/50 p-8 overflow-y-auto">
          {activeCategory === 'user' && view === 'grid' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">User Setting</h2>
                <p className="text-sm text-foreground/50">Invite user and manage profile efficiently</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setView('users-list')}
                  className="group relative flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <FontAwesomeIcon icon={faUsers} className="text-lg" />
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Users</h3>
                    <p className="text-sm text-foreground/40 mt-1">Add new users with role-based permissions</p>
                  </div>
                </button>

                <button className="group relative flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <FontAwesomeIcon icon={faIdCard} className="text-lg" />
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Profile</h3>
                    <p className="text-sm text-foreground/40 mt-1">Define role-specific access with tailored profiles</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeCategory === 'user' && view === 'users-list' && (
            <UsersTable onBack={() => setView('grid')} />
          )}

          {activeCategory !== 'user' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl mb-4 text-foreground/20">
                <FontAwesomeIcon icon={faGear} />
              </div>
              <h3 className="text-lg font-medium text-foreground">Coming Soon</h3>
              <p className="text-sm text-foreground/40 mt-2 max-w-xs mx-auto">
                The {CATEGORIES.find(c => c.id === activeCategory)?.label} module is currently under development.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


