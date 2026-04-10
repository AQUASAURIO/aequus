"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  MapPin,
  Ruler,
  Calendar,
  Car,
  Bath,
  Layers,
  ArrowLeft,
  Share2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Check,
  Shield,
  BarChart3,
  FileText,
  DollarSign,
  Percent,
  MapIcon,
  Pencil,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import {
  propertyTypeLabels,
  propertyTypeColors,
  buildingConditionLabels,
  formatCurrency,
  formatDate,
  countries,
} from "@/lib/types";
import { PDFExportButton } from "@/components/pdf/PDFExportButton";
import type { ValuationReport } from "@/lib/pdf-generator";
import type { MapPickerLocation } from "@/components/maps/MapPicker";

const MapPicker = dynamic(
  () => import("@/components/maps/MapPicker").then((m) => ({ default: m.default })),
  { ssr: false, loading: () => <div className="h-[300px] w-full rounded-lg border border-border bg-muted animate-pulse" /> }
);

const demoProperty = {
  id: "1",
  name: "Centro Corporativo Reforma",
  address: "Av. Paseo de la Reforma 505, Col. Juárez",
  city: "Ciudad de México",
  state: "CDMX",
  zipCode: "06600",
  country: "DO",
  lat: 19.426,
  lng: -99.1676,
  propertyType: "OFICINA" as const,
  totalArea: 4500,
  constructedArea: 4200,
  lotArea: null,
  floors: 12,
  yearBuilt: 2018,
  parkingSpaces: 80,
  bathrooms: 24,
  currentUse: "Oficinas Corporativas",
  buildingCondition: "EXCELENTE" as const,
  features: ["Ascensor", "Aire Acondicionado", "Vigilancia 24/7", "Estacionamiento Subterráneo", "Sistema Contra Incendios", "Cableado Estructural", "Planta de Emergencia", "Recepción"],
  notes: "Edificio de clase A con certificación LEED Gold. Ubicado en una de las avenidas más importantes de la ciudad.",
  status: "VALUADO" as const,
  createdAt: "2025-01-10T10:00:00Z",
};

const demoValuation = {
  marketValue: 85000000,
  pricePerSqm: 18889,
  rentalValue: 450000,
  capRate: 6.35,
  confidence: 0.92,
  method: "Método Híbrido",
  valuatedAt: "2025-01-10T10:00:00Z",
  expiresAt: "2025-04-10T10:00:00Z",
  aiAnalysis:
    "El Centro Corporativo Reforma se posiciona como uno de los activos inmobiliarios más premium del corridor Reforma. Su ubicación estratégica, combinada con la infraestructura de clase A y las certificaciones ambientales, le otorgan un valor competitivo significativo en el mercado.\n\nEl análisis comparativo con propiedades similares en un radio de 2km muestra que el valor por metro cuadrado se encuentra dentro del rango superior del mercado, justificado por la calidad de los acabados, la eficiencia energética y la accesibilidad.\n\nEl mercado de oficinas premium en la zona muestra una ocupación del 92%, con tendencia alcista en las tasas de renta, lo que sugiere una demanda sostenida que respalda la valoración realizada.",
  recommendations:
    "1. La propiedad mantiene un valor resiliente dado su ubicación y calidad. Se recomienda mantener la estrategia de posicionamiento premium.\n2. Considerar la implementación de tecnología smart building para mantener la competitividad frente a nuevos desarrollos.\n3. Evaluar oportunidades de reciclaje de espacios para incorporar amenities que incrementen el valor percibido.\n4. Monitorear las tendencias de trabajo híbrido que podrían afectar la demanda de espacios corporativos a mediano plazo.\n5. Se sugiere actualizar la valuación cada 6 meses considerando la dinámica del mercado.",
  riskFactors: [
    { factor: "Tendencia trabajo híbrido", level: "MEDIUM" as const, description: "El cambio hacia modelos de trabajo híbrido podría afectar la demanda de espacios corporativos en un horizonte de 2-3 años." },
    { factor: "Nuevos desarrollos", level: "LOW" as const, description: "Existen nuevos proyectos en el corridor que podrían incrementar la oferta en el segmento premium." },
    { factor: "Costos de mantenimiento", level: "LOW" as const, description: "Los costos de operación de un edificio LEED certificado tienden a ser competitivos vs. edificios convencionales." },
  ],
  comparables: [
    { name: "Torre Mayor", address: "Paseo de la Reforma 222", area: 3800, price: 72000000, pricePerSqm: 18947, similarity: 0.95 },
    { name: "Reforma 222", address: "Paseo de la Reforma 222", area: 5000, price: 95000000, pricePerSqm: 19000, similarity: 0.93 },
    { name: "Torre Chopo", address: "Eje Central Lázaro Cárdenas 100", area: 4200, price: 75600000, pricePerSqm: 18000, similarity: 0.82 },
    { name: "Centro Financiero", address: "Av. Paseo de la Reforma 250", area: 3600, price: 63000000, pricePerSqm: 17500, similarity: 0.78 },
  ],
};

const pdfReport: ValuationReport = {
  propertyName: demoProperty.name,
  address: demoProperty.address,
  city: demoProperty.city,
  state: demoProperty.state,
  zipCode: demoProperty.zipCode,
  propertyType: demoProperty.propertyType,
  totalArea: demoProperty.totalArea,
  constructedArea: demoProperty.constructedArea,
  floors: demoProperty.floors,
  yearBuilt: demoProperty.yearBuilt,
  parkingSpaces: demoProperty.parkingSpaces,
  bathrooms: demoProperty.bathrooms,
  buildingCondition: demoProperty.buildingCondition,
  features: demoProperty.features,
  currentUse: demoProperty.currentUse,
  marketValue: demoValuation.marketValue,
  pricePerSqm: demoValuation.pricePerSqm,
  rentalValue: demoValuation.rentalValue,
  capRate: demoValuation.capRate,
  confidence: demoValuation.confidence,
  valuationMethod: demoValuation.method,
  valuatedAt: demoValuation.valuatedAt,
  aiAnalysis: demoValuation.aiAnalysis,
  recommendations: demoValuation.recommendations,
  riskFactors: demoValuation.riskFactors,
  comparables: demoValuation.comparables,
};

export function PropertyDetailView() {
  const { setCurrentView } = useAppStore();
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editableProperty, setEditableProperty] = useState(demoProperty);

  const handleMapLocationUpdate = (data: MapPickerLocation) => {
    setEditableProperty((prev) => ({
      ...prev,
      address: data.address || prev.address,
      city: data.city || prev.city,
      state: data.state || prev.state,
      zipCode: data.zipCode || prev.zipCode,
      country: (data as any).country || prev.country || "DO",
      lat: data.lat,
      lng: data.lng,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => setCurrentView("properties")} className="w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al Directorio
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-1.5 h-4 w-4" />
            Compartir
          </Button>
          <PDFExportButton report={pdfReport} />
        </div>
      </div>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{demoProperty.name}</h1>
                  <Badge
                    variant="secondary"
                    className={propertyTypeColors[demoProperty.propertyType]}
                  >
                    {propertyTypeLabels[demoProperty.propertyType]}
                  </Badge>
                  <Badge variant="default" className="bg-emerald-600">
                    <Check className="mr-1 h-3 w-3" />
                    Valuado
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {editableProperty.address}
                  </span>
                  <span>{editableProperty.city}, {editableProperty.state} {editableProperty.zipCode}</span>
                  <span className="text-base">{countries.find(c => c.code === editableProperty.country)?.flag || "🇩🇴"}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => setIsEditingLocation(!isEditingLocation)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    {isEditingLocation ? "Cerrar mapa" : "Editar ubicación"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Valor de Mercado</p>
              <p className="text-2xl font-bold gradient-text">{formatCurrency(demoValuation.marketValue)}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(demoValuation.pricePerSqm)}/m² • Cap Rate: {demoValuation.capRate}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Map Picker for editing location */}
      {isEditingLocation && (
        <Card className="animate-fade-in border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapIcon className="h-4 w-4 text-primary" />
              Editar Ubicación en el Mapa
            </CardTitle>
            <CardDescription>
              Haz clic en el mapa, arrastra el pin o busca una dirección para actualizar la ubicación de la propiedad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MapPicker
              height="h-[350px]"
              initialLat={editableProperty.lat}
              initialLng={editableProperty.lng}
              initialAddress={editableProperty.address}
              onLocationSelect={handleMapLocationUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Renta Mensual</p>
              <p className="text-sm font-bold">{formatCurrency(demoValuation.rentalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rendimiento Anual</p>
              <p className="text-sm font-bold">
                {((demoValuation.rentalValue * 12 / demoValuation.marketValue) * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confianza</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{(demoValuation.confidence * 100).toFixed(0)}%</p>
                <Progress value={demoValuation.confidence * 100} className="h-2 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Método</p>
              <p className="text-sm font-bold">{demoValuation.method}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="info">
            <TabsList className="w-full rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="info"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Información
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Análisis IA
              </TabsTrigger>
              <TabsTrigger
                value="comparables"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Comparables
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="m-0 p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Property Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Características
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Ruler, label: "Área Total", value: `${demoProperty.totalArea.toLocaleString()} m²` },
                      { icon: Ruler, label: "Área Construida", value: `${demoProperty.constructedArea?.toLocaleString()} m²` },
                      { icon: Layers, label: "Niveles", value: `${demoProperty.floors}` },
                      { icon: Calendar, label: "Año Construcción", value: `${demoProperty.yearBuilt}` },
                      { icon: Car, label: "Cajones Estacionamiento", value: `${demoProperty.parkingSpaces}` },
                      { icon: Bath, label: "Baños", value: `${demoProperty.bathrooms}` },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-semibold">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Estado de Conservación</p>
                      <Badge variant="secondary" className="mt-0.5">{buildingConditionLabels[demoProperty.buildingCondition]}</Badge>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Amenidades y Características
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {demoProperty.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" />
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Información Adicional
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">Uso Actual:</span> {demoProperty.currentUse}</p>
                    <p><span className="font-medium text-foreground">Registrado:</span> {formatDate(demoProperty.createdAt)}</p>
                    <p><span className="font-medium text-foreground">Última Valuación:</span> {formatDate(demoValuation.valuatedAt)}</p>
                    <p><span className="font-medium text-foreground">Vence:</span> {formatDate(demoValuation.expiresAt)}</p>
                  </div>

                  {demoProperty.notes && (
                    <>
                      <Separator />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Notas
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{demoProperty.notes}</p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="m-0 p-6 space-y-4">
              <div className="rounded-lg bg-primary/5 p-5">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Análisis de Valuación — Generado por IA
                </h4>
                <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {demoValuation.aiAnalysis}
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border p-5">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Recomendaciones
                </h4>
                <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                  {demoValuation.recommendations}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Factores de Riesgo
                </h4>
                <div className="space-y-2">
                  {demoValuation.riskFactors.map((risk, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          risk.level === "LOW"
                            ? "bg-emerald-100 text-emerald-700"
                            : risk.level === "MEDIUM"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {risk.level === "LOW" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{risk.factor}</p>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              risk.level === "LOW"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {risk.level === "LOW" ? "Bajo" : "Medio"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Comparables Tab */}
            <TabsContent value="comparables" className="m-0 p-6">
              <div className="space-y-3">
                {demoValuation.comparables.map((comp, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">{comp.address}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{comp.area.toLocaleString()} m²</span>
                        <span>•</span>
                        <span>{formatCurrency(comp.pricePerSqm)}/m²</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{formatCurrency(comp.price)}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">Similitud</span>
                        <Progress value={comp.similarity * 100} className="h-1.5 w-14" />
                        <span className="text-[10px] font-medium">{(comp.similarity * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
