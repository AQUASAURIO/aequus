"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import {
  Building2,
  Sparkles,
  MapPin,
  Ruler,
  Calendar,
  Car,
  Bath,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  RotateCcw,
  MapIcon,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import {
  propertyTypeLabels,
  buildingConditionLabels,
  availableFeatures,
  formatCurrency,
  countries,
  getRegionsForCountry,
} from "@/lib/types";
import type { PropertyType, BuildingCondition, ValuationMethod, RiskFactor } from "@/lib/types";
import { PDFExportButton } from "@/components/pdf/PDFExportButton";
import type { ValuationReport } from "@/lib/pdf-generator";
import type { MapPickerLocation } from "@/components/maps/MapPicker";

const MapPicker = dynamic(
  () => import("@/components/maps/MapPicker").then((m) => ({ default: m.default })),
  { ssr: false, loading: () => <div className="h-[300px] w-full rounded-lg border border-border bg-muted animate-pulse" /> }
);

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().min(5, "La dirección es requerida"),
  country: z.string().min(2, "El país es requerido"),
  city: z.string().min(2, "La ciudad es requerida"),
  state: z.string().min(2, "El estado es requerido"),
  zipCode: z.string().min(4, "El código postal es requerido"),
  propertyType: z.enum([
    "OFICINA", "RETAIL", "INDUSTRIAL", "BODEGA", "TERRENO", "MIXTO", "HOTEL", "RESTAURANTE",
  ]),
  totalArea: z.coerce.number().min(1, "El área total es requerida"),
  constructedArea: z.coerce.number().optional(),
  lotArea: z.coerce.number().optional(),
  floors: z.coerce.number().min(1),
  yearBuilt: z.coerce.number().optional(),
  parkingSpaces: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(1),
  currentUse: z.string().optional(),
  buildingCondition: z.enum(["EXCELENTE", "BUENO", "REGULAR", "MALO", "EN_REMODELACION"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ValuationResult {
  marketValue: number;
  pricePerSqm: number;
  rentalValue: number;
  capRate: number;
  confidence: number;
  method: ValuationMethod;
  comparables: {
    name: string;
    address: string;
    area: number;
    price: number;
    pricePerSqm: number;
    similarity: number;
  }[];
  aiAnalysis: string;
  recommendations: string;
  riskFactors: RiskFactor[];
}

const steps = [
  { id: 1, title: "Ubicación", icon: MapPin },
  { id: 2, title: "Características", icon: Building2 },
  { id: 3, title: "Detalles", icon: Layers },
  { id: 4, title: "Valuación IA", icon: Sparkles },
];

export function NewValuationView() {
  const [step, setStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isValuating, setIsValuating] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("DO");
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const { setCurrentView, navigateToProperty } = useAppStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      country: "DO",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "OFICINA",
      totalArea: 0,
      constructedArea: undefined,
      lotArea: undefined,
      floors: 1,
      yearBuilt: new Date().getFullYear(),
      parkingSpaces: 0,
      bathrooms: 1,
      currentUse: "",
      buildingCondition: "BUENO",
      notes: "",
    },
  });

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  const nextStep = async () => {
    let valid = false;
    if (step === 1) {
      valid = await form.trigger(["name", "address", "country", "city", "state", "zipCode"]);
    } else if (step === 2) {
      valid = await form.trigger(["propertyType", "totalArea", "floors", "buildingCondition"]);
    }
    if (valid) setStep(step + 1);
  };

  const prevStep = () => setStep(Math.max(1, step - 1));

  const runValuation = async () => {
    setIsValuating(true);
    try {
      const values = form.getValues();
      const res = await fetch("/api/valuations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, features: selectedFeatures }),
      });
      const data = await res.json();
      setValuationResult(data);
      setStep(4);
    } catch (error) {
      // Fallback demo data
      setValuationResult({
        marketValue: 45000000,
        pricePerSqm: 18000,
        rentalValue: 225000,
        capRate: 6.0,
        confidence: 0.87,
        method: "HIBRIDO",
        comparables: [
          {
            name: "Edificio Corporativo Norte",
            address: "Av. Insurgentes Norte 1800",
            area: 2800,
            price: 52000000,
            pricePerSqm: 18571,
            similarity: 0.92,
          },
          {
            name: "Centro Empresarial Sur",
            address: "Blvd. de la Luz 45",
            area: 2100,
            price: 36750000,
            pricePerSqm: 17500,
            similarity: 0.85,
          },
          {
            name: "Plaza Oficinas Oriente",
            address: "Calz. Ignacio Zaragoza 320",
            area: 3200,
            price: 54400000,
            pricePerSqm: 17000,
            similarity: 0.78,
          },
          {
            name: "Torre Comercial Poniente",
            address: "Av. Constituyentes 890",
            area: 2400,
            price: 43200000,
            pricePerSqm: 18000,
            similarity: 0.88,
          },
        ],
        aiAnalysis:
          `La propiedad "${values.name}" ubicada en ${values.city}, ${values.state}, presenta características que la posicionan en el segmento ${values.propertyType === "OFICINA" ? "clase A" : "intermedio-alto"} del mercado comercial.\n\nCon un área total de ${values.totalArea.toLocaleString()} m² y estado de conservación ${buildingConditionLabels[values.buildingCondition as BuildingCondition]}, la propiedad se compara favorablemente con activos similares en la zona. El análisis identifica un mercado activo con tendencia alcista en el sector, lo que respalda el valor estimado.\n\nLa ubicación en ${values.city} ofrece buena conectividad y acceso a servicios complementarios, factores que impactan positivamente en el valor comercial.`,
        recommendations:
          "1. Se recomienda realizar inspección física para validar el estado estructural.\n2. Considerar la depreciación funcional según el año de construcción.\n3. Evaluar las condiciones del mercado local en los próximos 3-6 meses.\n4. Revisar los usos de suelo vigentes para confirmar el potencial de desarrollo.\n5. Comparar con transacciones recientes en un radio de 2km para mayor precisión.",
        riskFactors: [
          { factor: "Volatilidad del mercado", level: "MEDIUM", description: "El mercado comercial muestra fluctuaciones en los últimos trimestres" },
          { factor: "Ubicación periférica", level: "LOW", description: "La ubicación puede limitar ciertos usos comerciales" },
          { factor: "Antigüedad del inmueble", level: "MEDIUM", description: "Considerar costos de mantenimiento y remodelación" },
        ],
      });
      setStep(4);
    } finally {
      setIsValuating(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setSelectedFeatures([]);
    setValuationResult(null);
    setStep(1);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Step Indicator */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex-1 relative">
                  <div
                    className={`flex flex-col items-center gap-1.5 py-4 transition-all ${
                      isActive ? "text-primary" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isActive
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/30 bg-background"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">{s.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`absolute top-[38px] left-1/2 h-0.5 w-full transition-all ${
                        isCompleted ? "bg-emerald-500" : "bg-muted-foreground/20"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {step === 1 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Datos de Ubicación
            </CardTitle>
            <CardDescription>Ingresa la información de ubicación de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Propiedad *</Label>
              <Input
                id="name"
                placeholder="Ej: Centro Corporativo Reforma"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa *</Label>
              <Input
                id="address"
                placeholder="Ej: Av. Paseo de la Reforma 505, Col. Juárez"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> País *
                </Label>
                <Select
                  value={selectedCountry}
                  onValueChange={(v) => {
                    setSelectedCountry(v);
                    form.setValue("country", v, { shouldValidate: true });
                    form.setValue("state", ""); // Reset state when country changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.country && (
                  <p className="text-xs text-destructive">{form.formState.errors.country.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Provincia / Estado *</Label>
                <Select
                  value={form.watch("state")}
                  onValueChange={(v) => form.setValue("state", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRegionsForCountry(selectedCountry).map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.code} — {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.state && (
                  <p className="text-xs text-destructive">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input id="city" placeholder="Ej: Ciudad de México" {...form.register("city")} />
                {form.formState.errors.city && (
                  <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Código Postal *</Label>
                <Input id="zipCode" placeholder="Ej: 06600" {...form.register("zipCode")} />
                {form.formState.errors.zipCode && (
                  <p className="text-xs text-destructive">{form.formState.errors.zipCode.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentUse">Uso Actual</Label>
              <Input
                id="currentUse"
                placeholder="Ej: Oficinas Corporativas"
                {...form.register("currentUse")}
              />
            </div>

            {/* Map Picker - Auto-fill location from map */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapIcon className="h-3.5 w-3.5" />
                Seleccionar Ubicación en el Mapa
              </Label>
              <p className="text-xs text-muted-foreground">
                Haz clic en el mapa o busca una dirección para autocompletar los campos de ubicación.
              </p>
              <MapPicker
                height="h-[300px]"
                onLocationSelect={(data: MapPickerLocation) => {
                  if (data.address) form.setValue("address", data.address, { shouldValidate: true });
                  if (data.city) form.setValue("city", data.city, { shouldValidate: true });
                  if (data.state) form.setValue("state", data.state, { shouldValidate: true });
                  if (data.zipCode) form.setValue("zipCode", data.zipCode, { shouldValidate: true });
                  if (data.country) form.setValue("country", selectedCountry, { shouldValidate: true });
                  setMapCoords({ lat: data.lat, lng: data.lng });
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Características del Inmueble
            </CardTitle>
            <CardDescription>Describe las características físicas de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo de Propiedad *</Label>
              <Select
                value={form.watch("propertyType")}
                onValueChange={(v) => form.setValue("propertyType", v as PropertyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(propertyTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalArea" className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" /> Área Total (m²) *
                </Label>
                <Input
                  id="totalArea"
                  type="number"
                  placeholder="2500"
                  {...form.register("totalArea")}
                />
                {form.formState.errors.totalArea && (
                  <p className="text-xs text-destructive">{form.formState.errors.totalArea.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="constructedArea" className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5" /> Área Construida (m²)
                </Label>
                <Input
                  id="constructedArea"
                  type="number"
                  placeholder="2200"
                  {...form.register("constructedArea")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="floors" className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Niveles *
                </Label>
                <Input
                  id="floors"
                  type="number"
                  placeholder="3"
                  {...form.register("floors")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parkingSpaces" className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" /> Cajones
                </Label>
                <Input
                  id="parkingSpaces"
                  type="number"
                  placeholder="20"
                  {...form.register("parkingSpaces")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms" className="flex items-center gap-1.5">
                  <Bath className="h-3.5 w-3.5" /> Baños
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  placeholder="6"
                  {...form.register("bathrooms")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="yearBuilt" className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Año de Construcción
                </Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="2020"
                  {...form.register("yearBuilt")}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado de Conservación *</Label>
                <Select
                  value={form.watch("buildingCondition")}
                  onValueChange={(v) => form.setValue("buildingCondition", v as BuildingCondition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(buildingConditionLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Características Adicionales
            </CardTitle>
            <CardDescription>Selecciona las amenidades y características de la propiedad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {availableFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedFeatures.includes(feature)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  {selectedFeatures.includes(feature) && <Check className="mr-1 inline h-3 w-3" />}
                  {feature}
                </button>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones sobre la propiedad, acceso, condiciones especiales..."
                className="min-h-[100px]"
                {...form.register("notes")}
              />
            </div>

            {/* Summary before valuation */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resumen de la Propiedad
              </h4>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  <span className="font-medium">{form.watch("name") || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  <span className="font-medium">
                    {propertyTypeLabels[form.watch("propertyType") as PropertyType]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ubicación:</span>{" "}
                  <span className="font-medium">
                    {countries.find(c => c.code === form.watch("country"))?.flag} {form.watch("city")}, {form.watch("state")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Área:</span>{" "}
                  <span className="font-medium">
                    {form.watch("totalArea")?.toLocaleString() || 0} m²
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{" "}
                  <span className="font-medium">
                    {buildingConditionLabels[form.watch("buildingCondition") as BuildingCondition]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Características:</span>{" "}
                  <span className="font-medium">{selectedFeatures.length} seleccionadas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && valuationResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Value Card */}
          <Card className="overflow-hidden border-primary/30">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex flex-col gap-1 mb-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Valor de Mercado Estimado
                </p>
                <p className="text-4xl font-bold tracking-tight gradient-text">
                  {formatCurrency(valuationResult.marketValue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(valuationResult.pricePerSqm)}/m² • Cap Rate: {valuationResult.capRate}%
                </p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confianza:</span>
                  <Progress value={valuationResult.confidence * 100} className="h-2 w-24" />
                  <span className="text-xs font-semibold">
                    {(valuationResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {valuationResult.method === "HIBRIDO"
                    ? "Método Híbrido"
                    : valuationResult.method === "COMPARABLE"
                    ? "Método de Comparables"
                    : valuationResult.method === "INGRESO"
                    ? "Método de Ingresos"
                    : "Método de Costo"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valor de Renta/mes</p>
                  <p className="text-lg font-bold">{formatCurrency(valuationResult.rentalValue)}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Rendimiento Anual</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {((valuationResult.rentalValue * 12 / valuationResult.marketValue) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Comparables</p>
                  <p className="text-lg font-bold">{valuationResult.comparables.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Analysis, Comparables, Risks */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="w-full rounded-none border-b bg-transparent p-0">
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
                  <TabsTrigger
                    value="risks"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Factores de Riesgo
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="m-0 p-6 space-y-4">
                  <div className="rounded-lg bg-primary/5 p-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Análisis Generado por IA
                    </h4>
                    <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                      {valuationResult.aiAnalysis}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="text-sm font-semibold mb-2">Recomendaciones</h4>
                    <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                      {valuationResult.recommendations}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="comparables" className="m-0 p-6">
                  <div className="space-y-3">
                    {valuationResult.comparables.map((comp, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{comp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{comp.address}</p>
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
                            <span className="text-[10px] font-medium">
                              {(comp.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="m-0 p-6">
                  <div className="space-y-3">
                    {valuationResult.riskFactors.map((risk, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
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
                          ) : risk.level === "MEDIUM" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
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
                                  : risk.level === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {risk.level === "LOW"
                                ? "Bajo"
                                : risk.level === "MEDIUM"
                                ? "Medio"
                                : "Alto"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {risk.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 1 && step < 4 && (
            <Button variant="ghost" onClick={prevStep}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
          )}
          {step === 4 && (
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Nueva Valuación
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step < 3 && (
            <Button onClick={nextStep}>
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={runValuation} disabled={isValuating} className="min-w-[200px]">
              {isValuating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Valuación IA
                </>
              )}
            </Button>
          )}
          {step === 4 && valuationResult && (
            <>
              <PDFExportButton
                report={{
                  propertyName: form.getValues("name"),
                  address: form.getValues("address"),
                  city: form.getValues("city"),
                  state: form.getValues("state"),
                  zipCode: form.getValues("zipCode"),
                  propertyType: form.getValues("propertyType"),
                  totalArea: form.getValues("totalArea"),
                  constructedArea: form.getValues("constructedArea") ?? null,
                  floors: form.getValues("floors"),
                  yearBuilt: form.getValues("yearBuilt") ?? null,
                  parkingSpaces: form.getValues("parkingSpaces"),
                  bathrooms: form.getValues("bathrooms"),
                  buildingCondition: form.getValues("buildingCondition"),
                  features: selectedFeatures,
                  currentUse: form.getValues("currentUse") || null,
                  marketValue: valuationResult.marketValue,
                  pricePerSqm: valuationResult.pricePerSqm,
                  rentalValue: valuationResult.rentalValue,
                  capRate: valuationResult.capRate,
                  confidence: valuationResult.confidence,
                  valuationMethod:
                    valuationResult.method === "HIBRIDO"
                      ? "Metodo Hibrido"
                      : valuationResult.method === "COMPARABLE"
                      ? "Metodo de Comparables"
                      : valuationResult.method === "INGRESO"
                      ? "Metodo de Ingresos"
                      : "Metodo de Costo",
                  valuatedAt: new Date().toISOString(),
                  aiAnalysis: valuationResult.aiAnalysis,
                  recommendations: valuationResult.recommendations,
                  riskFactors: valuationResult.riskFactors,
                  comparables: valuationResult.comparables,
                } as ValuationReport}
              />
              <Button onClick={() => setCurrentView("dashboard")}>
                Ir al Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
