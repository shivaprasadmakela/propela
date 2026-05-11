import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dealsApi, type DealEntity, type NoteEntity, type TaskEntity } from '../api/dealsApi';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { getStringColorClass } from '@/shared/utils/colorUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAngleRight, 
  faPlus, 
  faPhone, 
  faStar, 
  faFolderOpen,
  faShieldHalved,
  faCalendar,
  faClock,
  faCheckCircle,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

const TABS = ['Overview', 'Notes', 'Tasks', 'Sales', 'Whatsapp', 'Call logs'];

export function DealProfilePage() {
  const { code } = useParams<{ code: string }>();
  const [deal, setDeal] = useState<DealEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  
  const [notes, setNotes] = useState<NoteEntity[]>([]);
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

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

  const handleSaveBio = async () => {
    if (!deal?.id) return;
    setIsSavingBio(true);
    try {
      const payload = {
        ...dealsApi.flattenDealPayload(deal),
        description: bioText,
      };

      if (code) {
        await dealsApi.saveDealByCode(code, payload);
      }
      setDeal({ ...deal, description: bioText });
      setIsEditingBio(false);
      toast('Bio updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update bio:', error);
      toast('Failed to update bio', 'error');
    } finally {
      setIsSavingBio(false);
    }
  };

  useEffect(() => {
    async function fetchTabData() {
      if (!deal?.id) return;
      
      const shouldFetch = ['Notes', 'Tasks', 'Call logs'].includes(activeTab);
      if (!shouldFetch) return;

      setIsTabLoading(true);
      try {
        if (activeTab === 'Notes') {
          const response = await dealsApi.fetchNotes(deal.id);
          setNotes(response.content || []);
        } else if (activeTab === 'Tasks') {
          const response = await dealsApi.fetchTasks(deal.id);
          setTasks(response.content || []);
        } else if (activeTab === 'Call logs' && deal.phoneNumber) {
          const dialCode = deal.dialCode || 91;
          const fullPhone = deal.phoneNumber.startsWith('+') ? deal.phoneNumber : `+${dialCode}${deal.phoneNumber}`;
          const response = await dealsApi.fetchCallLogs(fullPhone);
          setCallLogs(response.content || []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab}:`, error);
        toast(`Failed to load ${activeTab}`, 'error');
      } finally {
        setIsTabLoading(false);
      }
    }
    fetchTabData();
  }, [activeTab, deal?.id]);

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

  const renderTabContent = () => {
    if (isTabLoading) {
      return (
        <div className="h-full flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'Overview':
        return <OverviewTab deal={deal} />;
      case 'Notes':
        return <NotesTab notes={notes} />;
      case 'Tasks':
        return <TasksTab tasks={tasks} />;
      case 'Call logs':
        return <CallLogsTab logs={callLogs} />;
      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/10 rounded-2xl border border-dashed border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-4 grayscale opacity-50">
              <FontAwesomeIcon icon={faFolderOpen} />
            </div>
            <h3 className="text-lg font-medium text-foreground/80">{activeTab} Section</h3>
            <p className="text-sm text-foreground/40 mt-2">This module is currently being integrated and will be available soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/deals" className="text-foreground/40 hover:text-primary transition-colors">Deals</Link>
        <FontAwesomeIcon icon={faAngleRight} className="text-foreground/20 text-[10px]" />
        <span className="text-foreground/80 font-medium">{deal.name || 'Unnamed Deal'}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-x-6 gap-y-4">
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 text-foreground/60">
                  <span className="text-xs font-medium opacity-50 uppercase tracking-wider">DNC:</span>
                  <span className="font-semibold text-foreground/80">Off</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              {isEditingBio ? (
                <div className="flex-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full max-w-2xl px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm text-foreground/80 placeholder-foreground/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all min-h-[100px] resize-none"
                    placeholder="Enter bio details..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                      className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {isSavingBio ? 'Saving...' : 'Save bio'}
                    </button>
                    <button
                      onClick={() => setIsEditingBio(false)}
                      disabled={isSavingBio}
                      className="px-4 py-1.5 rounded-xl bg-muted text-foreground/60 text-xs font-bold transition-all hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  {deal.description && (
                    <p className="text-sm text-foreground/60 max-w-2xl italic">"{deal.description}"</p>
                  )}
                  <button 
                    onClick={() => {
                      setBioText(deal.description || '');
                      setIsEditingBio(true);
                    }}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium border-l border-border pl-4"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" /> 
                    {deal.description ? 'Edit bio' : 'Add bio'}
                  </button>
                </div>
              )}
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
            {renderTabContent()}
          </div>
        </div>

        {/* Right Section: Activity Logs */}
        <div className="flex-[1.2] flex flex-col bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
            <h3 className="text-sm font-bold text-foreground font-display">Activity logs</h3>
            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center gap-1">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" /> Add call logs
            </button>
          </div>

          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
            <div className="relative pl-8 space-y-8">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-0 w-px bg-border/50" />

              {/* Activity items */}
                <ActivityItem 
                  icon={faPlus}
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

function OverviewTab({ deal }: { deal: DealEntity }) {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <DetailField label="Full name" value={deal.name} />
      <DetailField label="Email ID" value={deal.email} isLink />
      <DetailField label="Phone number" value={deal.phoneNumber} isPhone />
      <DetailField label="Source" value={deal.source} isBadge />
      <DetailField label="Sub source" value={deal.subSource} isBadge />
      <DetailField label="Stage" value={deal.stage?.name} />
      <DetailField label="Status" value={deal.status?.name} />
      <DetailField label="Assigned user" value={deal.assignedUserId ? `${(deal.assignedUserId as any).firstName} ${(deal.assignedUserId as any).lastName || ''}` : '--'} />
      <DetailField label="Date of creation" value={deal.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(deal.createdAt * 1000)) : '--'} />
      <DetailField label="DNC" value="Off" isBadge />
      <DetailField label="Tag" value={deal.tag} isBadge placeholder="Select Tag" />
      <DetailField label="Keyword" value="--" />
    </div>
  );
}

function NotesTab({ notes }: { notes: NoteEntity[] }) {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {notes.length > 0 ? (
        notes.map((note) => (
          <div key={note.id} className="bg-muted/30 border border-border/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {note.createdBy?.firstName?.[0]}{note.createdBy?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground/80">{note.createdBy?.firstName} {note.createdBy?.lastName}</p>
                  <p className="text-[10px] text-foreground/40 font-medium">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(note.createdAt * 1000))}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">{note.content}</p>
          </div>
        ))
      ) : <EmptyState tab="Notes" />}
    </div>
  );
}

function TasksTab({ tasks }: { tasks: TaskEntity[] }) {
  return (
    <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/20 transition-colors group">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task.isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                <FontAwesomeIcon icon={task.isCompleted ? faCheckCircle : faCalendar} />
              </div>
              <div>
                <h4 className={`text-sm font-bold ${task.isCompleted ? 'text-foreground/40 line-through' : 'text-foreground/80'}`}>{task.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{task.taskTypeId?.name || 'Task'}</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/40 font-medium">
                    <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(task.dueDate * 1000))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                task.taskPriority === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                task.taskPriority === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                'bg-blue-500/10 border-blue-500/20 text-blue-500'
              }`}>
                {task.taskPriority}
              </span>
            </div>
          </div>
        ))
      ) : <EmptyState tab="Tasks" />}
    </div>
  );
}

function CallLogsTab({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {logs.length > 0 ? (
        <div className="border border-border/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Type</th>
                <th className="px-6 py-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">User</th>
                <th className="px-6 py-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-3 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className={`text-xs ${log.callType === 'INCOMING' ? 'text-emerald-500' : 'text-primary'}`} />
                      <span className="text-xs font-bold text-foreground/70 capitalize">{log.callType?.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-foreground/60">{log.userId?.firstName} {log.userId?.lastName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      log.status === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-foreground/40">{log.duration}s</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-foreground/40 font-medium">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(log.startTime * 1000))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState tab="Call logs" />}
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/5 rounded-2xl border border-dashed border-border/50 animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl mb-4 grayscale opacity-50">
        <FontAwesomeIcon icon={faFolderOpen} />
      </div>
      <h3 className="text-lg font-medium text-foreground/80">No {tab.toLowerCase()} found</h3>
      <p className="text-sm text-foreground/40 mt-2">There are currently no {tab.toLowerCase()} recorded for this deal.</p>
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
              <FontAwesomeIcon icon={faPhone} className="text-xs" />
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

function ActivityItem({ icon, content, time }: { icon: any; content: React.ReactNode; time: string }) {
  return (
    <div className="relative group">
      <div className="absolute -left-8 top-0 w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center text-xs text-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        <FontAwesomeIcon icon={icon} className="text-[10px]" />
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
