"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bell, Search, Menu, Sparkles, LogOut, User, Activity, Building2, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  "new-valuation": "Nueva Valuación",
  properties: "Directorio de Propiedades",
  "property-detail": "Detalle de Propiedad",
  "market-analysis": "Análisis de Mercado",
  settings: "Configuración",
};

export function AppHeader() {
  const {
    currentView,
    sidebarOpen,
    toggleSidebar,
    toggleAiChat,
    aiChatOpen,
    aiChatMessages,
    notifications,
    markAsRead,
    clearNotifications,
    user,
    setCurrentView
  } = useAppStore();
  // No local user state needed anymore

  const handleLogout = async () => {
    // Use imported singleton
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 md:px-6 backdrop-blur-md transition-all duration-300 w-full"
    >
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-base md:text-lg font-semibold text-foreground leading-tight truncate max-w-[150px] sm:max-w-none">
            {viewTitles[currentView] || "Æquo"}
          </h2>
          <p className="hidden sm:block text-[10px] md:text-xs text-muted-foreground line-clamp-1">
            {currentView === "dashboard" && "Resumen general de tu portafolio"}
            {currentView === "new-valuation" && "Crea una nueva valuación con IA"}
            {currentView === "properties" && "Gestiona tus propiedades registradas"}
            {currentView === "property-detail" && "Reporte detallado de la propiedad"}
            {currentView === "market-analysis" && "Tendencias y métricas del mercado"}
            {currentView === "settings" && "Administra tu cuenta y suscripción"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar propiedades..."
            className="h-9 w-64 pl-9 text-sm"
          />
        </div>

        {/* AI Chat */}
        <Button
          variant={aiChatOpen ? "default" : "ghost"}
          size="icon"
          onClick={toggleAiChat}
          className={cn(
            "relative",
            aiChatOpen && "bg-primary text-primary-foreground"
          )}
          aria-label="Abrir asistente IA"
        >
          <Sparkles className="h-5 w-5" />
          {!aiChatOpen && aiChatMessages.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-aequo-gold border-2 border-background" />
          )}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative cursor-pointer">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] bg-destructive text-white border-0">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notificaciones</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[10px] uppercase tracking-wider font-bold"
                onClick={clearNotifications}
              >
                Limpiar todo
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">No tienes notificaciones pendientes</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "flex flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {n.type === "valuation" && <Activity className="h-3.5 w-3.5 text-primary" />}
                          {n.type === "property" && <Building2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {n.type === "system" && <Info className="h-3.5 w-3.5 text-blue-500" />}
                          <span className="text-[11px] font-bold uppercase tracking-tight">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {(user?.name?.[0] || user?.email?.[0] || "Æ").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setCurrentView("settings")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
