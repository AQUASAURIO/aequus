import { create } from "zustand";
import type { AppView, UserProfile } from "./types";

// ── AI Chat Types ────────────────────────────────────────────────────────────

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "valuation" | "property" | "system";
  timestamp: Date;
  read: boolean;
}

// ── Store Interface ──────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  currentView: AppView;
  selectedPropertyId: string | null;
  setCurrentView: (view: AppView) => void;
  setSelectedProperty: (id: string) => void;
  navigateToProperty: (id: string) => void;

  // User & Identity
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  isAdmin: () => boolean;

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

  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: "dashboard",
  selectedPropertyId: null,
  setCurrentView: (view) =>
    set({ currentView: view, selectedPropertyId: view === "property-detail" ? undefined : null }),
  setSelectedProperty: (id) => set({ selectedPropertyId: id, currentView: "property-detail" }),
  navigateToProperty: (id) => set({ selectedPropertyId: id, currentView: "property-detail" }),

  // User & Identity
  user: null,
  setUser: (user) => set({ user }),
  updateUserProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  isAdmin: () => {
    const state = useAppStore.getState();
    return state.user?.role === "ADMIN";
  },

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

  // Notifications
  notifications: [
    {
      id: "1",
      title: "Valuación completada",
      message: "La valuación para 'Torre Acrópolis' ha sido procesada exitosamente.",
      type: "valuation",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
      read: false,
    },
    {
      id: "2",
      title: "Nueva propiedad",
      message: "Se ha añadido una nueva propiedad a tu portafolio.",
      type: "property",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
    },
    {
      id: "3",
      title: "Bienvenido a Æquo",
      message: "Tu cuenta ha sido configurada correctamente.",
      type: "system",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
      read: true,
    },
  ],
  addNotification: (n) =>
    set((state) => ({
      notifications: [
        { ...n, id: Math.random().toString(36).substr(2, 9), timestamp: new Date(), read: false },
        ...state.notifications,
      ],
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
