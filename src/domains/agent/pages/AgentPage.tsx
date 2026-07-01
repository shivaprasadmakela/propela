import { useState } from 'react';
import { useAgentStore } from '@/features/agent/store/agentStore';
import { ChatMessages } from '@/features/agent/components/chat/ChatMessages';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faPaperPlane, 
  faTrash, 
  faKey, 
  faCheck,
  faGear,
  faLightbulb,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const SUGGESTED_PROMPTS = [
  { label: "Show today's deals", text: "Give me today's deals" },
  { label: "List deals under follow-up", text: "Show deals under follow up" },
  { label: "Check deal tasks", text: "What tasks are pending on my deals?" },
  { label: "Summarize active leads", text: "Show a summary of my active deals" },
  { label: "Ask a general question", text: "What are some best practices for sales follow-ups?" }
];

export function AgentPage() {
  const { 
    messages, 
    isLoading, 
    apiKey, 
    sendMessage, 
    clearChat, 
    setApiKey 
  } = useAgentStore();

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const handlePromptClick = async (text: string) => {
    if (isLoading) return;
    await sendMessage(text);
  };

  const handleSaveKey = () => {
    setApiKey(keyInput);
    setShowSettings(false);
  };

  return (
    <div className="flex-1 flex gap-4 overflow-hidden h-[calc(100vh-100px)]">
      
      {/* Left Sidebar: Controls & Suggestions */}
      <div className="w-80 bg-card border border-border rounded-2xl flex flex-col p-4 shrink-0 overflow-y-auto space-y-4">
        
        {/* Title */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center text-base shadow-sm">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Propela Copilot</h2>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online & Ready
            </span>
          </div>
        </div>

        {/* API Settings */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all
              ${showSettings 
                ? 'bg-primary/5 text-primary border-primary/20 shadow-sm' 
                : 'bg-muted/40 border-border/80 text-foreground/75 hover:bg-muted'
              }`}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faGear} />
              Settings & API Key
            </span>
            <span className="text-[10px] bg-card px-1.5 py-0.5 rounded border border-border/60">Toggle</span>
          </button>

          {showSettings && (
            <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2.5 animate-fadeIn">
              <div>
                <label className="text-[10px] text-foreground/45 font-semibold block mb-1">Gemini API Key</label>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder="Enter key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full bg-card border border-border px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-primary/50 text-foreground pr-7"
                  />
                  <FontAwesomeIcon icon={faKey} className="absolute right-2 top-2.5 text-[10px] text-foreground/35" />
                </div>
              </div>
              <button 
                onClick={handleSaveKey}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                Save API Key
              </button>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="flex-1 space-y-2">
          <h4 className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLightbulb} className="text-amber-500/80 text-[11px]" />
            <span>Suggested Workflows</span>
          </h4>
          <div className="space-y-2">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt.text)}
                disabled={isLoading}
                className="w-full text-left p-3 bg-muted/20 border border-border/60 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all text-xs leading-normal disabled:opacity-50 text-foreground/80"
              >
                <span className="font-semibold block text-[11px] mb-0.5 text-foreground">{prompt.label}</span>
                <span className="text-[10px] text-foreground/40 italic block truncate">"{prompt.text}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Conversation */}
        <button
          onClick={clearChat}
          className="w-full bg-red-500/5 border border-red-500/10 text-red-500/85 hover:bg-red-500/15 hover:text-red-500 text-xs py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
          Clear Conversation
        </button>
      </div>

      {/* Right Area: Conversation Box */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden relative">
        
        {/* Banner if API key missing */}
        {!apiKey && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 text-amber-600 text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
              <span className="font-medium">AI features are disabled because the Gemini API key is missing.</span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-xs text-amber-600 hover:underline font-bold"
            >
              Configure in Settings
            </button>
          </div>
        )}

        {/* Chat Stream */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Chat Input Footer */}
        <footer className="p-4 border-t border-border bg-card shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <input 
              type="text"
              placeholder="Ask Copilot a question, query deals, or perform actions..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-muted/65 border border-border/80 rounded-2xl px-5 py-4 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-card transition-all disabled:opacity-50 pr-14"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2.5 top-2.5 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/95 transition-all disabled:opacity-30 disabled:hover:bg-primary text-xs"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
export default AgentPage;
