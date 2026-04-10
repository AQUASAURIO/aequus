"use client";

import { useSyncExternalStore } from "react";
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

const MapSection = dynamic(
  () => import("@/components/maps/MapSection").then((m) => ({ default: m.MapSection })),
  { ssr: false, loading: () => <Card className="animate-pulse"><CardContent className="h-[420px]" /></Card> }
);

// Demo data for charts - Empty placeholders
const monthlyData: any[] = [];
const typeDistribution: any[] = [];
const recentProperties: any[] = [];

// Recent properties array is now empty

const stats = [
  {
    title: "Propiedades Valuadas",
    value: "24",
    change: "+12%",
    trend: "up" as const,
    icon: Building2,
    description: "este mes",
  },
  {
    title: "Valor Total Portafolio",
    value: "$425.8M",
    change: "+8.2%",
    trend: "up" as const,
    icon: DollarSign,
    description: "vs. mes anterior",
  },
  {
    title: "Precio Promedio/m²",
    value: "$18,450",
    change: "-2.1%",
    trend: "down" as const,
    icon: TrendingUp,
    description: "promedio general",
  },
  {
    title: "Valuaciones Pendientes",
    value: "7",
    change: "+3",
    trend: "up" as const,
    icon: FileCheck,
    description: "requieren atención",
  },
];

export function DashboardView() {
  const { navigateToProperty } = useAppStore();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4 animate-pulse">
            <CardContent className="p-6 h-80 rounded bg-muted" />
          </Card>
          <Card className="lg:col-span-3 animate-pulse">
            <CardContent className="p-6 h-80 rounded bg-muted" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={stat.trend === "up" ? "text-emerald-600" : "text-red-500"}>
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Valuation Trend */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tendencia de Valuaciones</CardTitle>
            <CardDescription>Volumen mensual de valuaciones y valor total</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                valuaciones: { label: "Valuaciones", color: "#10b981" },
                valor: { label: "Valor (M)", color: "#f59e0b" },
              }}
              className="h-[280px] w-full"
            >
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillValM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "oklch(0.50 0.02 155)" }} />
                <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.02 155)" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="valuaciones"
                  stroke="#10b981"
                  fill="url(#fillVal)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Distribución por Tipo</CardTitle>
            <CardDescription>Propiedades valuadas por categoría</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <ChartContainer
                config={{
                  Oficina: { label: "Oficina", color: "#10b981" },
                  Retail: { label: "Retail", color: "#f59e0b" },
                  Industrial: { label: "Industrial", color: "#64748b" },
                  Bodega: { label: "Bodega", color: "#f97316" },
                  Mixto: { label: "Mixto", color: "#a855f7" },
                }}
                className="h-[200px] w-[200px]"
              >
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-2.5">
                {typeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
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
              onClick={() => useAppStore.getState().setCurrentView("properties")}
            >
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProperties.length > 0 ? (
              recentProperties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => navigateToProperty(property.id)}
                  className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-all hover:bg-accent/50 hover:border-primary/20"
                >
                  {/* ... property layout ... */}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No hay valuaciones recientes</p>
                <p className="text-xs text-muted-foreground/60">Las nuevas valuaciones aparecerán aquí</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Value Bar Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Valor por Zona</CardTitle>
            <CardDescription>Precio promedio por m² según ubicación</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={{
                precio: { label: "Precio/m²", color: "#10b981" },
              }}
              className="h-[220px] w-full"
            >
              <BarChart
                data={[
                  { zona: "Piantini", precio: 11500 },
                  { zona: "Naco", precio: 10200 },
                  { zona: "Gazcue", precio: 8900 },
                  { zona: "Ens. Luperón", precio: 7200 },
                  { zona: "Z. Franca STI", precio: 3500 },
                ]}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="zona" className="text-xs" tick={{ fill: "oklch(0.50 0.02 155)", fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.02 155)" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="precio" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <MapSection />
    </div>
  );
}
