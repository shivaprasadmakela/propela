import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { getStringColorClass } from '@/shared/utils/colorUtils';

const TABS = ['Overview', 'Notes', 'Tasks', 'Sales', 'Whatsapp', 'Call logs'];

export function DealProfilePage() {
  const { code } = useParams<{ code: string }>();
  const [deal, setDeal] = useState<DealEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const toast = useToast();

  useEffect(() => {
    async function fetchDeal() {
      if (!code) return;
      setIsLoading(true);
      try {
        const data = await dealsApi.fetchDealByCode(code);
        setDeal(data);
      } catch (error) {
        console.error('Failed to fetch deal:', error);
        toast('Failed to load deal details', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeal();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-foreground/40">Loading deal profile...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-xl font-semibold">Deal not found</h2>
        <p className="text-foreground/40 mt-2">The deal you're looking for doesn't exist or you don't have access.</p>
        <Link to="/deals" className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
          Back to Deals
        </Link>
      </div>
    );
  }

  const dealIdDisplay = `D${String(deal.id).padStart(10, '0')}`;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/deals" className="text-foreground/40 hover:text-primary transition-colors">Deals</Link>
        <span className="text-foreground/20">›</span>
        <span className="text-foreground/80 font-medium">{deal.name || 'Unnamed Deal'}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">{deal.name}</h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {deal.status?.name || 'Open'}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-foreground/60">
                <span className="text-xs font-medium opacity-50 uppercase tracking-wider">Product:</span>
                <span className="font-semibold text-foreground/80">{deal.productId?.name || 'Not assigned'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-foreground/60">
                <span className="text-xs font-medium opacity-50 uppercase tracking-wider">ID:</span>
                <span className="font-mono text-xs">{dealIdDisplay}</span>
              </div>
              <div className="flex items-center gap-2 text-foreground/40">
                <span className="text-xs font-medium uppercase tracking-wider">DNC:</span>
                <div className="w-8 h-4 rounded-full bg-muted border border-border relative">
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-foreground/20" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium">
                <span className="text-lg leading-none">💬</span> Message
              </button>
              <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium border-l border-border pl-4">
                <span className="text-lg leading-none">+</span> Add bio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Section: Details & Tabs */}
        <div className="flex-[3] flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          {/* Tabs bar */}
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
                <DetailField label="Full name" value={deal.name} />
                <DetailField label="Email ID" value={deal.email} isLink />
                <DetailField label="Phone number" value={deal.phoneNumber} isPhone />
                <DetailField label="Source" value={deal.source} isBadge />
                <DetailField label="Sub source" value={deal.subSource} isBadge />
                <DetailField label="Stage" value={deal.stage?.name} />
                <DetailField label="Status" value={deal.status?.name} />
                <DetailField label="Assigned user" value={deal.assignedUserId ? `${deal.assignedUserId.firstName} ${deal.assignedUserId.lastName || ''}` : '--'} />
                <DetailField label="Date of creation" value={deal.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(deal.createdAt * 1000)) : '--'} />
                <DetailField label="Tag" value={deal.tag} isBadge placeholder="Select Tag" />
                <DetailField label="Keyword" value="--" />
              </div>
            )}

            {activeTab !== 'Overview' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/10 rounded-2xl border border-dashed border-border">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-4 grayscale opacity-50">
                  📁
                </div>
                <h3 className="text-lg font-medium text-foreground/80">{activeTab} Section</h3>
                <p className="text-sm text-foreground/40 mt-2">This module is currently being integrated and will be available soon.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Activity Logs */}
        <div className="flex-[1.2] flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
            <h3 className="text-sm font-bold text-foreground font-display">Activity logs</h3>
            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">🛡 Add call logs</button>
          </div>

          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
            <div className="relative pl-8 space-y-8">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-0 w-px bg-border/50" />

              {/* Activity items */}
              <ActivityItem
                icon="+"
                content={<span>Deal from <strong>subSource: {deal.subSource || 'Web'}</strong>, <strong>source: {deal.source || 'Social Media'}</strong> created for <strong>Anonymous</strong>.</span>}
                time="April 13, 2026 11:02 AM"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, isLink, isPhone, isBadge, placeholder = '--' }: { label: string; value?: string; isLink?: boolean; isPhone?: boolean; isBadge?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest block">{label}</label>
      <div className="flex items-center gap-2">
        {isBadge && value ? (
          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold border ${getStringColorClass(value)}`}>
            {value}
          </span>
        ) : isPhone && value ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/80 font-medium">+91 {value}</span>
            <button className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              📞
            </button>
          </div>
        ) : (
          <span className={`text-sm font-medium ${value ? 'text-foreground/90' : 'text-foreground/20'}`}>
            {value || placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ icon, content, time }: { icon: string; content: React.ReactNode; time: string }) {
  return (
    <div className="relative group">
      <div className="absolute -left-8 top-0 w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[13px] text-foreground/60 leading-relaxed group-hover:text-foreground/90 transition-colors">
          {content}
        </p>
        <p className="text-[10px] text-foreground/30 font-medium">{time}</p>
      </div>
    </div>
  );
}
