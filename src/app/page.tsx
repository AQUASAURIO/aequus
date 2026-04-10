"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-[70px]")}>
        <AppHeader />
        <main className="p-6">
          <div className="animate-fade-in">
            <ViewRenderer />
          </div>
        </main>
      </div>
      <AIChatPanel />
    </div>
  );
}
