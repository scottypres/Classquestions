import { create } from 'zustand';
import type { Chat, ProviderResponse, UploadedFile, ViewMode } from '../types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  responses: Record<string, ProviderResponse>;
  activeProvider: string;
  viewMode: ViewMode;
  classQuestionsMode: boolean;
  selectedModels: Record<string, string>;
  enabledProviders: Record<string, boolean>;
  uploadedFiles: UploadedFile[];
  isQuerying: boolean;
  currentPrompt: string;

  setChats: (chats: Chat[]) => void;
  setActiveChatId: (id: string | null) => void;
  setResponse: (provider: string, update: Partial<ProviderResponse>) => void;
  appendContent: (provider: string, token: string) => void;
  resetResponses: () => void;
  setActiveProvider: (provider: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setClassQuestionsMode: (on: boolean) => void;
  setSelectedModel: (provider: string, model: string) => void;
  toggleProvider: (provider: string) => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  setIsQuerying: (v: boolean) => void;
  setCurrentPrompt: (v: string) => void;
}

const PROVIDERS = ['gemini', 'claude', 'chatgpt'];

const initialResponses = (): Record<string, ProviderResponse> =>
  Object.fromEntries(
    PROVIDERS.map((p) => [p, { provider: p, content: '', status: 'idle' as const }])
  );

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  responses: initialResponses(),
  activeProvider: 'gemini',
  viewMode: 'tabs',
  classQuestionsMode: false,
  selectedModels: {},
  enabledProviders: { gemini: true, claude: true, chatgpt: true },
  uploadedFiles: [],
  isQuerying: false,
  currentPrompt: '',

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setResponse: (provider, update) =>
    set((state) => ({
      responses: {
        ...state.responses,
        [provider]: { ...state.responses[provider], ...update },
      },
    })),
  appendContent: (provider, token) =>
    set((state) => ({
      responses: {
        ...state.responses,
        [provider]: {
          ...state.responses[provider],
          content: state.responses[provider].content + token,
        },
      },
    })),
  resetResponses: () => set({ responses: initialResponses() }),
  setActiveProvider: (p) => set({ activeProvider: p }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setClassQuestionsMode: (on) => set({ classQuestionsMode: on }),
  setSelectedModel: (provider, model) =>
    set((state) => ({
      selectedModels: { ...state.selectedModels, [provider]: model },
    })),
  toggleProvider: (provider) =>
    set((state) => {
      const newEnabled = {
        ...state.enabledProviders,
        [provider]: !state.enabledProviders[provider],
      };
      // Ensure at least one provider stays enabled
      if (!Object.values(newEnabled).some(Boolean)) return state;
      // If active provider got disabled, switch to first enabled
      let newActive = state.activeProvider;
      if (!newEnabled[newActive]) {
        newActive = PROVIDERS.find((p) => newEnabled[p]) || 'gemini';
      }
      return { enabledProviders: newEnabled, activeProvider: newActive };
    }),
  setUploadedFiles: (files) => set({ uploadedFiles: files }),
  addUploadedFile: (file) =>
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),
  removeUploadedFile: (id) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    })),
  setIsQuerying: (v) => set({ isQuerying: v }),
  setCurrentPrompt: (v) => set({ currentPrompt: v }),
}));
