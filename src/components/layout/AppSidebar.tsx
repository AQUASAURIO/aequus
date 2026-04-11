"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { isSupabaseConnected } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "new-valuation" as const, label: "Nueva Valuación", icon: PlusCircle },
  { id: "properties" as const, label: "Propiedades", icon: Building2 },
  { id: "market-analysis" as const, label: "Análisis de Mercado", icon: BarChart3 },
  { id: "settings" as const, label: "Configuración", icon: Settings },
];

export function AppSidebar() {
  const { currentView, sidebarOpen, toggleSidebar, setCurrentView, toggleAiChat, user } = useAppStore();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const filteredNavItems = navItems.filter(item => {
    if (item.id === "settings" && user?.role !== "ADMIN") return false;
    return true;
  });

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await isSupabaseConnected();
      setIsConnected(connected);
    };
    checkConnection();
    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-[70px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-border/50">
            <img src="/aequo_logo.png" alt="Æquo" className="h-8 w-8 object-contain" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground truncate">
              {user?.company || "ÆQUO"}
            </h1>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
              {user?.company ? "Corporate Workspace" : "Commercial Valuation"}
            </p>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            const button = (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {sidebarOpen && <span>{item.label}</span>}
                {!sidebarOpen && isActive && (
                  <span className="absolute left-[62px] h-8 w-0.5 rounded-r bg-sidebar-primary" />
                )}
              </button>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* AI Assistant Button */}
        <div className="px-3 pb-2">
          <button
            onClick={toggleAiChat}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
            )}
          >
            <div className="relative">
              <Sparkles className="h-5 w-5 shrink-0" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-aequo-gold" />
            </div>
            {sidebarOpen && (
              <div className="flex items-center justify-between w-full">
                <span>Asistente IA</span>
                <span className="text-[9px] uppercase tracking-wider text-sidebar-primary/60 font-medium">GPT-4o</span>
              </div>
            )}
          </button>
        </div>

        {/* Connection Status */}
        <div className="px-3 pb-4 mt-auto">
          <div className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
            sidebarOpen ? "bg-sidebar-accent/30" : "justify-center"
          )}>
            <div className="relative flex h-2 w-2">
              {isConnected === true ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : isConnected === false ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/30"></span>
              )}
            </div>
            {sidebarOpen && (
              <span className="text-sidebar-foreground/50 transition-colors">
                {isConnected === true ? "Supabase Conectado" : isConnected === false ? "Error de Conexión" : "Verificando..."}
              </span>
            )}
            {!sidebarOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isConnected === true ? "Conectado" : isConnected === false ? "Desconectado" : "Verificando..."}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
