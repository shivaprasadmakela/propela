import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { accountApi, type AccountEntity } from '../api/accountApi';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { getStringColorClass } from '@/shared/utils/colorUtils';

const TABS = ['Overview', 'Notes', 'Linked Deals', 'Communication', 'Activity'];

export function AccountProfilePage() {
  const { code } = useParams<{ code: string }>();
  const [account, setAccount] = useState<AccountEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const toast = useToast();

  useEffect(() => {
    async function fetchAccount() {
      if (!code) return;
      setIsLoading(true);
      try {
        const data = await accountApi.fetchAccountByCode(code);
        setAccount(data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
        toast('Failed to load account details', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccount();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-foreground/40">Loading account profile...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-xl font-semibold">Account not found</h2>
        <p className="text-foreground/40 mt-2">The account you're looking for doesn't exist.</p>
        <Link to="/accounts" className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
          Back to Accounts
        </Link>
      </div>
    );
  }

  const accountIdDisplay = `A${String(account.id).padStart(10, '0')}`;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/accounts" className="text-foreground/40 hover:text-primary transition-colors">Accounts</Link>
        <span className="text-foreground/20">›</span>
        <span className="text-foreground/80 font-medium">{account.name}</span>
      </nav>

      {}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {account.name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">{account.name}</h1>
                <p className="text-sm text-foreground/40">Client Code: {account.clientCode}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-foreground/60">
                <span className="text-xs font-medium opacity-50 uppercase tracking-wider">Account ID:</span>
                <span className="font-mono text-xs">{accountIdDisplay}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-foreground/60">
                <span className="text-xs font-medium opacity-50 uppercase tracking-wider">Source:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStringColorClass(account.source)}`}>
                  {account.source || 'Social Media'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-[3] flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center px-4 border-b border-border/50 bg-muted/20">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium transition-all relative
                  ${activeTab === tab ? 'text-primary' : 'text-foreground/40 hover:text-foreground/60'}
                `}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 max-w-4xl">
                <DetailField label="Account Name" value={account.name} />
                <DetailField label="Email ID" value={account.email} isLink />
                <DetailField label="Phone number" value={account.phoneNumber} isPhone />
                <DetailField label="Source" value={account.source} isBadge />
                <DetailField label="Sub source" value={account.subSource} isBadge />
                <DetailField label="Created By" value={account.createdBy ? `${account.createdBy.firstName} ${account.createdBy.lastName || ''}` : '--'} />
                <DetailField label="Date of creation" value={account.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(account.createdAt * 1000)) : '--'} />
                <DetailField label="Parent Owner" value={account.parentOwnerId?.name} />
              </div>
            )}
            
            {activeTab !== 'Overview' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/10 rounded-2xl border border-dashed border-border text-foreground/40">
                <p>No data available for {activeTab} yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-[1.2] flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
            <h3 className="text-sm font-bold text-foreground font-display">Recent Activity</h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="relative pl-8 space-y-8">
              <div className="absolute left-3 top-2 bottom-0 w-px bg-border/50" />
              <div className="relative">
                <div className="absolute -left-8 top-0 w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary">
                  ★
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] text-foreground/80">Account created via <strong>{account.source || 'Social Media'}</strong></p>
                  <p className="text-[10px] text-foreground/30">{account.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(account.createdAt * 1000)) : '--'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, isLink, isPhone, isBadge }: { label: string; value?: string; isLink?: boolean; isPhone?: boolean; isBadge?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest block">{label}</label>
      <div className="flex items-center gap-2">
        {isBadge && value ? (
          <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStringColorClass(value)}`}>
            {value}
          </span>
        ) : isPhone && value ? (
          <div className="flex items-center gap-3">
             <span className="text-sm text-foreground/80 font-medium">+91 {value}</span>
             <button className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">📞</button>
          </div>
        ) : (
          <span className={`text-sm font-medium ${value ? 'text-foreground/90' : 'text-foreground/20'}`}>
            {value || '--'}
          </span>
        )}
      </div>
    </div>
  );
}
