import { create } from 'zustand';
import { agentService } from '../services/agentService';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isError?: boolean;
  toolsData?: {
    toolName: string;
    data: any;
    status: 'success' | 'error';
  };
}

export interface AgentState {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  apiKey: string;
  
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  deleteMessage: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setApiKey: (key: string) => void;
  clearChat: () => void;
}

const STORAGE_KEY_API_KEY = 'propela_gemini_api_key';
const STORAGE_KEY_MESSAGES = 'propela_agent_messages';

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  isOpen: false,
  isLoading: false,
  apiKey: localStorage.getItem(STORAGE_KEY_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '',

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setDrawerOpen: (open) => set({ isOpen: open }),
  
  addMessage: (msg) => {
    const newMsg: Message = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((state) => {
      const updated = [...state.messages, newMsg];
      try {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save message to localStorage:', err);
      }
      return { messages: updated };
    });
    return newMsg;
  },

  deleteMessage: (id) => {
    set((state) => {
      const updated = state.messages.filter(msg => msg.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save messages to localStorage after deletion:', err);
      }
      return { messages: updated };
    });
  },

  sendMessage: async (text) => {
    if (!text.trim() || get().isLoading) return;

    // Add user message
    get().addMessage({ role: 'user', content: text });
    set({ isLoading: true });

    try {
      // Exclude system instructions or other roles from history if not needed
      const chatHistory = get().messages;
      const key = get().apiKey;

      const response = await agentService.chat(text, chatHistory, key);

      // Add assistant response
      get().addMessage({
        role: 'model',
        content: response.text,
        toolsData: response.toolsData
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      get().addMessage({
        role: 'model',
        content: `Error: ${error?.message || 'Failed to complete request.'}`,
        isError: true
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setApiKey: (key) => {
    localStorage.setItem(STORAGE_KEY_API_KEY, key);
    set({ apiKey: key });
  },

  clearChat: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    } catch (err) {
      console.error('Failed to clear messages from localStorage:', err);
    }
    set({ messages: [] });
  },
}));
