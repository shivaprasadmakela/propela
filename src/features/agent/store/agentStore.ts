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
  sendMessage: (text: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setApiKey: (key: string) => void;
  clearChat: () => void;
}

const STORAGE_KEY_API_KEY = 'propela_gemini_api_key';

export const useAgentStore = create<AgentState>((set, get) => ({
  messages: [],
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
    set((state) => ({
      messages: [...state.messages, newMsg],
    }));
    return newMsg;
  },

  sendMessage: async (text) => {
    if (!text.trim() || get().isLoading) return;

    // Add user message
    const userMsg = get().addMessage({ role: 'user', content: text });
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

  clearChat: () => set({ messages: [] }),
}));
