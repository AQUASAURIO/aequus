"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAppStore } from "@/lib/store";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { NewValuationView } from "@/components/valuation/NewValuationView";
import { PropertiesDirectory } from "@/components/properties/PropertiesDirectory";
import { PropertyDetailView } from "@/components/valuation/PropertyDetailView";
import { MarketAnalysisView } from "@/components/market/MarketAnalysisView";
import { SettingsView } from "@/components/settings/SettingsView";
import { AIChatPanel } from "@/components/ai";
import { LoginView } from "@/components/auth/LoginView";
import { LandingPage } from "@/components/layout/LandingPage";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function ViewRenderer() {
  const { currentView } = useAppStore();

  switch (currentView) {
    case "dashboard":
      return <DashboardView />;
    case "new-valuation":
      return <NewValuationView />;
    case "properties":
      return <PropertiesDirectory />;
    case "property-detail":
      return <PropertyDetailView />;
    case "market-analysis":
      return <MarketAnalysisView />;
    case "settings":
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}

export default function Home() {
  const { sidebarOpen } = useAppStore();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // If not logged in and not explicitly showing login, show Landing Page
  if (!session && !showLogin) {
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  // If not logged in but showing login, show Login View
  if (!session && showLogin) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          onClick={() => setShowLogin(false)}
          className="absolute top-6 left-6 z-50 text-zinc-400 hover:text-white"
        >
          ← Volver
        </Button>
        <LoginView />
      </div>
    );
  }

  // If logged in, show the App
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col",
        "ml-0 md:ml-[70px]",
        sidebarOpen && "md:ml-64"
      )}>
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="animate-fade-in max-w-7xl mx-auto w-full">
            <ViewRenderer />
          </div>
        </main>
      </div>
      <AIChatPanel />
    </div>
  );
}
