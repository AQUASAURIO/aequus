"use client";

import dynamic from "next/dynamic";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Line,
  LineChart,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/types";

const MarketHeatmap = dynamic(
  () => import("@/components/maps/MarketHeatmap"),
  { ssr: false, loading: () => <Card className="animate-pulse"><CardContent className="h-[420px]" /></Card> }
);

const priceEvolution: any[] = [];

const transactionVolume: any[] = [];

const topZones: any[] = [];

const occupancyData: any[] = [];

const marketHighlights = [
  {
    metric: "Precio Promedio/m²",
    value: "$0",
    change: "0%",
    trend: "up" as const,
    icon: BarChart3,
    description: "sin datos",
  },
  {
    metric: "Volumen Transacciones",
    value: "0",
    change: "0%",
    trend: "up" as const,
    icon: Activity,
    description: "sin datos",
  },
  {
    metric: "Tasa de Ocupación",
    value: "0%",
    change: "0%",
    trend: "up" as const,
    icon: Building2,
    description: "sin datos",
  },
  {
    metric: "Renta Promedio/m²",
    value: "$0",
    change: "0%",
    trend: "up" as const,
    icon: TrendingUp,
    description: "sin datos",
  },
];

export function MarketAnalysisView() {
  return (
    <div className="space-y-6">
      {/* Market Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {marketHighlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.metric}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.metric}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {item.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={item.trend === "up" ? "text-emerald-600" : "text-red-500"}>
                    {item.change}
                  </span>
                  <span className="text-muted-foreground">{item.description}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Price Evolution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Evolución de Precios por Tipo</CardTitle>
          <CardDescription>Precio promedio por m² mensual según tipo de propiedad</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {priceEvolution.length > 0 ? (
            <ChartContainer
              config={{
                oficinas: { label: "Oficinas", color: "#10b981" },
                retail: { label: "Retail", color: "#f59e0b" },
                industrial: { label: "Industrial", color: "#64748b" },
                bodegas: { label: "Bodegas", color: "#f97316" },
              }}
              className="h-[350px] w-full"
            >
              <LineChart data={priceEvolution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.50 0.02 155)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.50 0.02 155)", fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="oficinas" stroke="#10b981" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="retail" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="industrial" stroke="#64748b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bodegas" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[350px] items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/20 text-muted-foreground italic">
              Sin datos históricos suficientes para mostrar la evolución
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transaction Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Volumen de Transacciones</CardTitle>
            <CardDescription>Número y valor total de operaciones mensuales</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {transactionVolume.length > 0 ? (
              <ChartContainer
                config={{
                  volumen: { label: "Transacciones", color: "#10b981" },
                }}
                className="h-[280px] w-full"
              >
                <BarChart data={transactionVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: "oklch(0.50 0.02 155)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "oklch(0.50 0.02 155)", fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="volumen" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/20 text-muted-foreground italic">
                Sin datos de transacciones disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Occupancy by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tasa de Ocupación</CardTitle>
            <CardDescription>Por tipo de propiedad con tendencia trimestral</CardDescription>
          </CardHeader>
          <CardContent>
            {occupancyData.length > 0 ? (
              <div className="space-y-4">
                {occupancyData.map((item) => (
                  <div key={item.tipo} className="space-y-1.5">
                    {/* ... item layout ... */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground italic">Datos de ocupación no disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Heatmap */}
      <MarketHeatmap />

      {/* Top Zones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Zonas con Mayor Actividad
          </CardTitle>
          <CardDescription>Precio promedio, variación anual y número de transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          {topZones.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {topZones.map((zone) => (
                <div
                  key={zone.zona}
                  className="rounded-lg border p-4 transition-all hover:border-primary/30 hover:bg-accent/30"
                >
                  {/* ... zone content ... */}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-xl bg-muted/20">
              <MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground italic">Sin zonas destacadas registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Perspectivas del Mercado</CardTitle>
          <CardDescription>Análisis cualitativo del comportamiento actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold">Tendencia Alcista</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El mercado inmobiliario comercial muestra una tendencia positiva con incrementos
                sostenidos en precios, particularmente en el segmento de oficinas clase A y
                naves industriales. La demanda de espacios logísticos continúa impulsada por
                el crecimiento del comercio electrónico.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-semibold">Factores a Monitorear</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Las tasas de interés y las políticas de financiamiento son factores clave que
                podrían impactar el mercado en el corto plazo. Asimismo, la adopción de modelos
                de trabajo híbrido continúa siendo una variable importante en el segmento de
                oficinas, con mayor impacto en espacios clase B y C.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
