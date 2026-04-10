"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Bell, Search, Menu, Sparkles, LogOut, User } from "lucide-react";
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

const viewTitles: Record<string, string> = {
  dashboard: "Dashboard",
  "new-valuation": "Nueva Valuación",
  properties: "Directorio de Propiedades",
  "property-detail": "Detalle de Propiedad",
  "market-analysis": "Análisis de Mercado",
  settings: "Configuración",
};

export function AppHeader() {
  const { currentView, sidebarOpen, toggleSidebar, toggleAiChat, aiChatOpen, aiChatMessages } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md transition-all duration-300",
        sidebarOpen ? "ml-64" : "ml-[70px]"
      )}
    >
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {viewTitles[currentView] || "Æquo"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentView === "dashboard" && "Resumen general de tu portafolio"}
            {currentView === "new-valuation" && "Crea una nueva valuación con inteligencia artificial"}
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px]">
            3
          </Badge>
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.email?.[0].toUpperCase() || "Æ"}
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
            <DropdownMenuItem className="cursor-pointer">
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
