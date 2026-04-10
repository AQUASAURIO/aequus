"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  DollarSign,
  TrendingUp,
  FileCheck,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { formatCurrency, propertyTypeLabels, propertyTypeColors, formatNumber, formatDate } from "@/lib/types";
import type { Property, Valuation } from "@/lib/types";
import { cn } from "@/lib/utils";

const MapSection = dynamic(
  () => import("@/components/maps/MapSection").then((m) => ({ default: m.MapSection })),
  { ssr: false, loading: () => <Card className="animate-pulse"><CardContent className="h-[420px]" /></Card> }
);

// Demo data for charts - Empty placeholders
const monthlyData: any[] = [];
const typeDistribution: any[] = [];
const recentProperties: any[] = [];

export function DashboardView() {
  const { navigateToProperty, setCurrentView } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  useEffect(() => {
    if (mounted) {
      const fetchDashboardData = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/dashboard");
          if (res.ok) {
            const result = await res.json();
            setData(result);
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-1" />
                <div className="h-3 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse h-[400px]" />
      </div>
    );
  }

  const stats = [
    {
      title: "Propiedades Valuadas",
      value: data?.totalProperties?.toString() || "0",
      change: "+0%",
      trend: "up" as const,
      icon: Building2,
      description: "total en base de datos",
    },
    {
      title: "Valor Total Portafolio",
      value: formatCurrency(data?.totalValue || 0),
      change: "+0%",
      trend: "up" as const,
      icon: DollarSign,
      description: "total estimado",
    },
    {
      title: "Precio Promedio/m²",
      value: formatCurrency(data?.avgPricePerSqm || 0),
      change: "+0%",
      trend: "up" as const,
      icon: TrendingUp,
      description: "promedio general",
    },
    {
      title: "Valuaciones Pendientes",
      value: data?.pendingValuations?.toString() || "0",
      change: "0",
      trend: "up" as const,
      icon: FileCheck,
      description: "requieren atención",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:border-primary/20 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-aequo-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-xs font-medium flex items-center",
                  stat.trend === "up" ? "text-emerald-500" : "text-rose-500"
                )}>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.change}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tendencia de Valuaciones</CardTitle>
            <CardDescription>Volumen mensual de valuaciones y valor total</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                valuaciones: { label: "Valuaciones", color: "#d4af37" },
              }}
              className="h-[280px] w-full"
            >
              <AreaChart data={[]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="valuaciones"
                  stroke="#d4af37"
                  fill="url(#fillVal)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribución por Tipo</CardTitle>
            <CardDescription>Propiedades valuadas por categoría</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin datos suficientes</p>
              <p className="text-xs text-muted-foreground/60">Agrega más propiedades para ver la distribución</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Valuaciones Recientes</CardTitle>
              <CardDescription>Últimas propiedades valuadas en el sistema</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView("properties")}
            >
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No hay valuaciones recientes</p>
            <p className="text-xs text-muted-foreground/60">Las nuevas valuaciones aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>

      <MapSection />
    </div>
  );
}
