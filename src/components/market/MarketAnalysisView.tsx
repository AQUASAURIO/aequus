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

const priceEvolution = [
  { month: "Ene", oficinas: 17500, retail: 22000, industrial: 8500, bodegas: 6200 },
  { month: "Feb", oficinas: 17800, retail: 22500, industrial: 8700, bodegas: 6400 },
  { month: "Mar", oficinas: 18200, retail: 22800, industrial: 8900, bodegas: 6500 },
  { month: "Abr", oficinas: 18000, retail: 22100, industrial: 8800, bodegas: 6300 },
  { month: "May", oficinas: 18500, retail: 23500, industrial: 9200, bodegas: 6800 },
  { month: "Jun", oficinas: 18800, retail: 24000, industrial: 9500, bodegas: 7000 },
  { month: "Jul", oficinas: 19100, retail: 23800, industrial: 9400, bodegas: 7100 },
  { month: "Ago", oficinas: 18900, retail: 24200, industrial: 9600, bodegas: 7200 },
  { month: "Sep", oficinas: 19400, retail: 25000, industrial: 9800, bodegas: 7500 },
  { month: "Oct", oficinas: 19200, retail: 24800, industrial: 9700, bodegas: 7400 },
  { month: "Nov", oficinas: 19600, retail: 25500, industrial: 10000, bodegas: 7800 },
  { month: "Dic", oficinas: 19800, retail: 25200, industrial: 10200, bodegas: 8000 },
];

const transactionVolume = [
  { month: "Ene", volumen: 45, valor: 1800 },
  { month: "Feb", volumen: 38, valor: 1500 },
  { month: "Mar", volumen: 52, valor: 2100 },
  { month: "Abr", volumen: 41, valor: 1650 },
  { month: "May", volumen: 58, valor: 2400 },
  { month: "Jun", volumen: 63, valor: 2700 },
  { month: "Jul", volumen: 55, valor: 2300 },
  { month: "Ago", volumen: 48, valor: 2000 },
  { month: "Sep", volumen: 67, valor: 2900 },
  { month: "Oct", volumen: 59, valor: 2500 },
  { month: "Nov", volumen: 72, valor: 3100 },
  { month: "Dic", volumen: 65, valor: 2800 },
];

const topZones = [
  { zona: "Piantini, SDQ", precio: 11500, cambio: 5.2, transacciones: 34 },
  { zona: "Naco, SDQ", precio: 10200, cambio: 3.8, transacciones: 28 },
  { zona: "Zona Franca, STI", precio: 3500, cambio: 8.2, transacciones: 31 },
  { zona: "Bávaro, Higüey", precio: 9800, cambio: 6.7, transacciones: 26 },
  { zona: "Gazcue, SDQ", precio: 8900, cambio: 4.1, transacciones: 42 },
  { zona: "Ens. Luperón, SDQ", precio: 7200, cambio: -1.5, transacciones: 22 },
  { zona: "Malecón, SDQ", precio: 6500, cambio: 2.4, transacciones: 19 },
  { zona: "Centro Santiago", precio: 5800, cambio: 7.1, transacciones: 15 },
];

const occupancyData = [
  { tipo: "Oficina Clase A", ocupacion: 94, tendencia: 2.1 },
  { tipo: "Oficina Clase B", ocupacion: 87, tendencia: -0.5 },
  { tipo: "Retail Premium", ocupacion: 96, tendencia: 1.8 },
  { tipo: "Retail Standard", ocupacion: 82, tendencia: -1.2 },
  { tipo: "Industrial", ocupacion: 91, tendencia: 3.4 },
  { tipo: "Bodegas", ocupacion: 88, tendencia: 2.8 },
];

const marketHighlights = [
  {
    metric: "Precio Promedio/m²",
    value: "$8,400",
    change: "+4.2%",
    trend: "up" as const,
    icon: BarChart3,
    description: "Oficina Clase A en Santo Domingo",
  },
  {
    metric: "Volumen Transacciones",
    value: "663",
    change: "+15.3%",
    trend: "up" as const,
    icon: Activity,
    description: "Total anual en el mercado",
  },
  {
    metric: "Tasa de Ocupación",
    value: "91%",
    change: "+2.1%",
    trend: "up" as const,
    icon: Building2,
    description: "Promedio general del mercado",
  },
  {
    metric: "Renta Promedio/m²",
    value: "$285",
    change: "-0.8%",
    trend: "down" as const,
    icon: TrendingUp,
    description: "Mensual por m² de oficina",
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
          </CardContent>
        </Card>

        {/* Occupancy by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tasa de Ocupación</CardTitle>
            <CardDescription>Por tipo de propiedad con tendencia trimestral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancyData.map((item) => (
                <div key={item.tipo} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.tipo}</span>
                    <div className="flex items-center gap-2">
                      {item.tendencia > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          item.tendencia > 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {item.tendencia > 0 ? "+" : ""}
                        {item.tendencia}%
                      </span>
                      <span className="text-xs font-bold w-10 text-right">
                        {item.ocupacion}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.ocupacion >= 90
                          ? "bg-emerald-500"
                          : item.ocupacion >= 85
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${item.ocupacion}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topZones.map((zone) => (
              <div
                key={zone.zona}
                className="rounded-lg border p-4 transition-all hover:border-primary/30 hover:bg-accent/30"
              >
                <p className="text-sm font-semibold truncate">{zone.zona}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-lg font-bold">{formatCurrency(zone.precio)}</span>
                  <span className="text-xs text-muted-foreground">/m²</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {zone.cambio > 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        zone.cambio > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {zone.cambio > 0 ? "+" : ""}
                      {zone.cambio}%
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {zone.transacciones} transacciones
                  </span>
                </div>
              </div>
            ))}
          </div>
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
