"use client";

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

  return (
    <div className="min-h-screen bg-background">
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
