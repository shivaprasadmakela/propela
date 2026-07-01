import { useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUser, faTrash } from '@fortawesome/free-solid-svg-icons';
import { type Message, useAgentStore } from '../../store/agentStore';
import { FormattedContent } from './FormattedContent';
import { DealsList } from './DealsList';
import { DealDetailsCard } from './DealDetailsCard';
import { TasksList } from './TasksList';
import { NotesTimeline } from './NotesTimeline';
import { ActivitiesTimeline } from './ActivitiesTimeline';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const deleteMessage = useAgentStore((state) => state.deleteMessage);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Helper to format timestamps to readable times
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  // Map tool executes to custom renderer
  const renderToolsOutput = (toolsData: Message['toolsData']) => {
    if (!toolsData || toolsData.status === 'error') return null;

    const { toolName, data } = toolsData;

    switch (toolName) {
      case 'list_deals':
        return <DealsList deals={data} />;
      case 'get_deal_details':
        return <DealDetailsCard deal={data} />;
      case 'list_deal_tasks':
        return <TasksList tasks={data} />;
      case 'list_deal_notes':
        return <NotesTimeline notes={data} />;
      case 'list_deal_activities':
        return <ActivitiesTimeline activities={data} />;
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
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">
                "Give me today's deals"
              </span>
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">
                "Show deals under follow up"
              </span>
              <span className="bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10">
                "What tasks are linked to ticket TKT-43?"
              </span>
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
            className={`flex gap-3 max-w-[85%] ${
              isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm
              ${
                isModel
                  ? 'bg-primary/10 text-primary border border-primary/15'
                  : 'bg-muted text-foreground/60 border border-border'
              }`}
            >
              <FontAwesomeIcon icon={isModel ? faRobot : faUser} />
            </div>

            {/* Chat Bubble wrapper */}
            <div className="space-y-1 relative group/msg">
              {/* Delete button (shows on hover exactly beside the bubble) */}
              <button
                onClick={() => deleteMessage(msg.id)}
                title="Delete message"
                className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 w-6 h-6 rounded-md hover:bg-muted border border-border/45 text-foreground/35 hover:text-red-400 flex items-center justify-center text-[10px] bg-card/60 backdrop-blur-sm z-10 cursor-pointer
                  ${isModel ? 'left-full ml-2' : 'right-full mr-2'}`}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>

              <div
                className={`p-3 rounded-2xl border text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                  ${
                    isModel
                      ? 'bg-card border-border text-foreground/80 rounded-tl-none'
                      : 'bg-primary border-primary/80 text-primary-foreground rounded-tr-none'
                  }
                  ${msg.isError ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
                `}
              >
                {/* Text Response */}
                <div className="prose prose-sm max-w-none text-inherit">
                  <FormattedContent content={msg.content} />
                </div>
              </div>

              {/* Sub-rendered Tool Data Panels */}
              {isModel && msg.toolsData && renderToolsOutput(msg.toolsData)}

              {/* Timestamp */}
              <span
                className={`text-[10px] text-foreground/30 block px-1 ${
                  isModel ? 'text-left' : 'text-right'
                }`}
              >
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
            <span
              className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
