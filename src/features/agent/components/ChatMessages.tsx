import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faUser, 
  faHandshake, 
  faCalendarAlt, 
  faTasks, 
  faNoteSticky, 
  faPhone,
  faEnvelope,
  faPaperclip
} from '@fortawesome/free-solid-svg-icons';
import { type Message } from '../store/agentStore';
import { type DealEntity, type TaskEntity, type NoteEntity } from '@/domains/deals/api/dealsApi';
import { getStringColorClass } from '@/shared/utils/colorUtils';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleOpenDeal = (code: string) => {
    navigate(`/dealProfile/${code}`);
  };

  // Helper to format timestamps to readable times
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  // Helper to render basic markdown-like structures (bold, lists, paragraphs)
  const formatContent = (text: any) => {
    if (text === null || text === undefined) return null;
    const textStr = typeof text === 'string' ? text : String(text);
    if (!textStr.trim()) return null;
    
    // Split by double newline for paragraphs
    const paragraphs = textStr.split('\n\n');
    
    return paragraphs.map((p, pIndex) => {
      // Split paragraph by newline to handle line-by-line formatting (like lists)
      const lines = p.split('\n');
      
      const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim()));
      
      if (isList) {
        return (
          <ul key={pIndex} className="list-disc pl-5 my-2 space-y-1">
            {lines.map((line, lIndex) => {
              const cleaned = line.replace(/^[-*]\s+|\d+\.\s+/, '');
              return (
                <li key={lIndex} className="text-sm">
                  {parseInlineFormatting(cleaned)}
                </li>
              );
            })}
          </ul>
        );
      }
      
      return (
        <p key={pIndex} className="text-sm leading-relaxed mb-2">
          {lines.map((line, lIndex) => (
            <span key={lIndex} className="block">
              {parseInlineFormatting(line)}
            </span>
          ))}
        </p>
      );
    });
  };

  // Helper to render bold strings
  const parseInlineFormatting = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Render Deal list item cards
  const renderDealsList = (deals: DealEntity[]) => {
    if (!deals || deals.length === 0) {
      return <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">No deals found matching the search.</div>;
    }

    return (
      <div className="space-y-3 mt-3">
        <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1">Found {deals.length} deals:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deals.map((deal) => (
            <div 
              key={deal.id}
              onClick={() => handleOpenDeal(deal.code)}
              className="bg-card border border-border p-3 rounded-xl shadow-sm hover:border-primary/40 hover:shadow transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors pr-2">
                  {deal.name}
                </h4>
                <span className="text-[10px] text-foreground/45 shrink-0 bg-muted px-1.5 py-0.5 rounded font-mono">
                  {deal.code}
                </span>
              </div>
              <div className="text-[11px] text-foreground/50 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  <span className="truncate">{deal.productId?.name || 'No Product'}</span>
                </div>
                {deal.nextFollowUp && (
                  <div className="flex items-center gap-1.5 text-amber-500/80">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-[9px]" />
                    <span>
                      Followup: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(deal.nextFollowUp * 1000))}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-medium border ${getStringColorClass(deal.stage?.name || deal.status?.name)}`}>
                  {deal.stage?.name || deal.status?.name || 'Open'}
                </span>
                <span className="text-[9px] text-foreground/40 font-mono">
                  {deal.assignedUserId?.name || `${deal.assignedUserId?.firstName || ''} ${deal.assignedUserId?.lastName || ''}`.trim() || 'Unassigned'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Deal Details Full Card
  const renderDealDetails = (deal: DealEntity | null) => {
    if (!deal) {
      return <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">Deal not found.</div>;
    }

    return (
      <div className="mt-3 bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
        <div className="flex justify-between items-start border-b border-border pb-2.5">
          <div>
            <h4 className="text-sm font-bold text-foreground">{deal.name}</h4>
            <span className="text-xs text-foreground/50">{deal.productId?.name || 'No Product'}</span>
          </div>
          <span className="text-xs font-mono bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded">
            {deal.code}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
          <div>
            <span className="text-[10px] text-foreground/40 block">Phone</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-foreground/70">
              <FontAwesomeIcon icon={faPhone} className="text-[10px] text-foreground/40" />
              <span>{deal.phoneNumber || 'N/A'}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-foreground/40 block">Email</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-foreground/70">
              <FontAwesomeIcon icon={faEnvelope} className="text-[10px] text-foreground/40" />
              <span className="truncate">{deal.email || 'N/A'}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-foreground/40 block">Stage / Status</span>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1 ${getStringColorClass(deal.stage?.name || deal.status?.name)}`}>
              {deal.stage?.name || deal.status?.name || 'Open'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-foreground/40 block">Source</span>
            <span className="text-foreground/70 mt-0.5 block">{deal.source || 'Direct'} {deal.subSource ? `(${deal.subSource})` : ''}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex gap-2">
          <button 
            onClick={() => handleOpenDeal(deal.code)}
            className="flex-1 bg-primary text-primary-foreground text-xs py-1.5 px-3 rounded-lg font-medium hover:bg-primary/95 transition-all text-center"
          >
            Open Deal Profile
          </button>
        </div>
      </div>
    );
  };

  // Render Deal Tasks
  const renderTasksList = (tasks: TaskEntity[]) => {
    if (!tasks || tasks.length === 0) {
      return <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">No tasks associated with this deal.</div>;
    }

    return (
      <div className="space-y-2 mt-3 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faTasks} className="text-[11px]" />
          <span>Tasks ({tasks.length})</span>
        </div>
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-2 p-2 hover:bg-muted/40 rounded-lg transition-colors text-xs border border-border/40">
              <div className="flex gap-2">
                <input 
                  type="checkbox" 
                  checked={task.isCompleted} 
                  readOnly 
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5" 
                />
                <div>
                  <p className={`font-medium ${task.isCompleted ? 'line-through text-foreground/40' : 'text-foreground/80'}`}>{task.name}</p>
                  <p className="text-[10px] text-foreground/40">Priority: {task.taskPriority || 'Medium'}</p>
                </div>
              </div>
              {task.dueDate && (
                <span className="text-[10px] text-foreground/45 bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.dueDate))}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Deal Notes
  const renderNotesList = (notes: NoteEntity[]) => {
    if (!notes || notes.length === 0) {
      return <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">No notes associated with this deal.</div>;
    }

    return (
      <div className="space-y-2.5 mt-3">
        <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faNoteSticky} className="text-[11px]" />
          <span>Notes Timeline ({notes.length})</span>
        </div>
        <div className="relative pl-3 border-l-2 border-border/80 ml-2 space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="relative text-xs">
              <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-card" />
              <div className="bg-card border border-border p-2.5 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-1 text-[10px] text-foreground/40">
                  <span className="font-semibold text-foreground/50">{note.createdBy?.name || 'User'}</span>
                  <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(note.createdAt))}</span>
                </div>
                <p className="text-foreground/75 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Map tool executes to custom renderer
  const renderToolsOutput = (toolsData: Message['toolsData']) => {
    if (!toolsData || toolsData.status === 'error') return null;

    const { toolName, data } = toolsData;

    switch (toolName) {
      case 'list_deals':
        return renderDealsList(data);
      case 'get_deal_details':
        return renderDealDetails(data);
      case 'list_deal_tasks':
        return renderTasksList(data);
      case 'list_deal_notes':
        return renderNotesList(data);
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 scroll-smooth"
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-foreground/35 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/60 text-lg">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/60">Propela AI Assistant</h3>
            <p className="text-xs max-w-xs mt-1 leading-normal">
              Ask me details about your deals, tasks, timeline, or notes. You can type queries like:
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-xs text-primary/75">
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">"Give me today's deals"</span>
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">"Show deals under follow up"</span>
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">"What tasks are linked to ticket TKT-43?"</span>
            </div>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isModel = msg.role === 'model';
        const isSystem = msg.role === 'system';
        if (isSystem) return null;

        return (
          <div 
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm
              ${isModel 
                ? 'bg-primary/10 text-primary border border-primary/15' 
                : 'bg-muted text-foreground/60 border border-border'
              }`}
            >
              <FontAwesomeIcon icon={isModel ? faRobot : faUser} />
            </div>

            {/* Chat Bubble */}
            <div className="space-y-1">
              <div 
                className={`p-3 rounded-2xl border text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                  ${isModel 
                    ? 'bg-card border-border text-foreground/80 rounded-tl-none' 
                    : 'bg-primary border-primary/80 text-primary-foreground rounded-tr-none'
                  }
                  ${msg.isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
                `}
              >
                {/* Text Response */}
                <div className="prose prose-sm max-w-none">
                  {formatContent(msg.content)}
                </div>
              </div>

              {/* Sub-rendered Tool Data Panels */}
              {isModel && msg.toolsData && renderToolsOutput(msg.toolsData)}

              {/* Timestamp */}
              <span className={`text-[10px] text-foreground/30 block px-1 ${isModel ? 'text-left' : 'text-right'}`}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex gap-3 max-w-[85%] mr-auto items-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shrink-0 text-xs animate-pulse">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div className="bg-card border border-border p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
