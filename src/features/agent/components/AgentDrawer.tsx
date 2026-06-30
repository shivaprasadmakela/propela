import { useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import { ChatMessages } from './ChatMessages';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClose, 
  faPaperPlane, 
  faTrash, 
  faKey, 
  faCheck,
  faGear,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

export function AgentDrawer() {
  const { 
    messages, 
    isOpen, 
    isLoading, 
    apiKey, 
    setDrawerOpen, 
    sendMessage, 
    clearChat, 
    setApiKey 
  } = useAgentStore();

  const [inputText, setInputText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const textToSend = inputText;
    setInputText('');
    await sendMessage(textToSend);
  };

  const handleSaveKey = () => {
    setApiKey(keyInput);
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={() => setDrawerOpen(false)}
        className="absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[450px] h-full bg-card/95 border-l border-border backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
        
        {/* Header */}
        <header className="h-16 border-b border-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-foreground">AI Assistant</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {/* API Key Toggle Button */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              title="API Settings"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-xs
                ${showSettings 
                  ? 'bg-primary/10 text-primary border border-primary/10' 
                  : 'text-foreground/45 hover:text-foreground/80 hover:bg-muted'
                }`}
            >
              <FontAwesomeIcon icon={faGear} />
            </button>

            {/* Clear Chat Button */}
            <button 
              onClick={clearChat}
              title="Clear Conversation"
              className="w-8 h-8 rounded-lg text-foreground/45 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/10 flex items-center justify-center transition-all text-xs"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>

            {/* Close Button */}
            <button 
              onClick={() => setDrawerOpen(false)}
              className="w-8 h-8 rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-muted flex items-center justify-center transition-colors text-xs"
            >
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
        </header>

        {/* API Settings Section */}
        {showSettings && (
          <div className="bg-muted/50 border-b border-border p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground">Gemini API Configuration</h4>
              <span className="text-[10px] text-foreground/40">Required for LLM access</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="password"
                  placeholder="Enter Gemini API Key..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full bg-card border border-border px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-primary/50 text-foreground pr-8"
                />
                <FontAwesomeIcon icon={faKey} className="absolute right-2.5 top-2.5 text-[10px] text-foreground/35" />
              </div>
              <button 
                onClick={handleSaveKey}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                <span>Save</span>
              </button>
            </div>
            <p className="text-[10px] text-foreground/40 leading-normal">
              You can obtain a free API key from Google AI Studio. The key is securely saved locally in your browser storage.
            </p>
          </div>
        )}

        {/* API Key Missing Warning Banner */}
        {!apiKey && !showSettings && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-amber-500 text-xs">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
              <span className="font-medium">Missing Gemini API Key</span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-[10px] text-amber-500 hover:underline font-semibold"
            >
              Configure Now
            </button>
          </div>
        )}

        {/* Messages List Area */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Message Input Panel */}
        <footer className="p-4 border-t border-border bg-card shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input 
              type="text"
              placeholder="Ask the AI agent anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-muted/65 border border-border/80 rounded-xl px-4 py-3 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary/50 focus:bg-card transition-all disabled:opacity-50 pr-12"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 top-2 w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/95 transition-all disabled:opacity-30 disabled:hover:bg-primary text-xs"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
