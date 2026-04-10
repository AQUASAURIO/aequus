import { create } from "zustand";
import type { AppView } from "./types";

// ── AI Chat Types ────────────────────────────────────────────────────────────

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  currentView: AppView;
  selectedPropertyId: string | null;
  setCurrentView: (view: AppView) => void;
  setSelectedProperty: (id: string) => void;
  navigateToProperty: (id: string) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // AI Chat
  aiChatOpen: boolean;
  aiChatMessages: AiChatMessage[];
  aiChatSessionId: string | null;
  aiChatLoading: boolean;
  toggleAiChat: () => void;
  setAiChatOpen: (open: boolean) => void;
  addAiChatMessage: (msg: AiChatMessage) => void;
  setAiChatLoading: (loading: boolean) => void;
  clearAiChat: () => void;
  setAiChatSessionId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: "dashboard",
  selectedPropertyId: null,
  setCurrentView: (view) =>
    set({ currentView: view, selectedPropertyId: view === "property-detail" ? undefined : null }),
  setSelectedProperty: (id) => set({ selectedPropertyId: id, currentView: "property-detail" }),
  navigateToProperty: (id) => set({ selectedPropertyId: id, currentView: "property-detail" }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // AI Chat
  aiChatOpen: false,
  aiChatMessages: [],
  aiChatSessionId: null,
  aiChatLoading: false,
  toggleAiChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),
  setAiChatOpen: (open) => set({ aiChatOpen: open }),
  addAiChatMessage: (msg) =>
    set((state) => ({ aiChatMessages: [...state.aiChatMessages, msg] })),
  setAiChatLoading: (loading) => set({ aiChatLoading: loading }),
  clearAiChat: () =>
    set({
      aiChatMessages: [],
      aiChatSessionId: null,
      aiChatLoading: false,
    }),
  setAiChatSessionId: (id) => set({ aiChatSessionId: id }),
}));
