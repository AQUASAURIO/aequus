"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/types";
import type { Plan, UserProfile, UserRole } from "@/lib/types";
import { userRoleLabels } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  CreditCard,
  Users,
  Key,
  Check,
  X,
  Crown,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  Headphones,
  Sparkles,
  MapPin,
  ExternalLink,
  Globe,
  Satellite,
  Map,
  Mountain,
  CheckCircle2,
} from "lucide-react";

// Demo data
const demoUser: UserProfile = {
  id: "usr_001",
  email: "carlos@grupoinmo.com",
  name: "Carlos Mendoza",
  company: "Grupo Inmobiliario Atlas",
  role: "ADMIN",
  plan: {
    id: "b2b-pro",
    name: "B2B Pro",
    badge: "B2B",
    description: "Para bancos regionales o fondos de inversión medianos",
    customerType: "Banco regional / fondo mediano",
    periodicity: "annual",
    priceMonthly: 1658,
    priceAnnual: 19900,
    priceOneTime: null,
    maxValuations: 200,
    maxProperties: 500,
    valuationPeriod: "year",
    extraValuationPrice: 90,
    maxUsers: 10,
    supportLevel: "Chat + Email 24h",
    features: [],
    isActive: true,
    highlighted: true,
  },
  valuationCount: 73,
  isActive: true,
};

const demoTeam = [
  {
    id: "tm_001",
    name: "Carlos Mendoza",
    email: "carlos@grupoinmo.com",
    role: "ADMIN" as UserRole,
    status: "Activo",
    lastActive: "Hace 5 min",
  },
  {
    id: "tm_002",
    name: "María López",
    email: "maria@grupoinmo.com",
    role: "MANAGER" as UserRole,
    status: "Activo",
    lastActive: "Hace 1 hora",
  },
  {
    id: "tm_003",
    name: "Roberto Sánchez",
    email: "roberto@grupoinmo.com",
    role: "USER" as UserRole,
    status: "Activo",
    lastActive: "Hace 3 horas",
  },
  {
    id: "tm_004",
    name: "Ana Torres",
    email: "ana@grupoinmo.com",
    role: "USER" as UserRole,
    status: "Inactivo",
    lastActive: "Hace 2 semanas",
  },
];

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  MANAGER:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  USER: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

const statusColors: Record<string, string> = {
  Activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Inactivo:
    "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-500",
};

// ── Helper components ──────────────────────────────────────────────────────────

function PlanPriceDisplay({ plan }: { plan: Plan }) {
  // Monthly B2C plan with price tiers
  if (plan.periodicity === "monthly" && plan.priceTiers) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          {plan.priceTiers.map((tier) => (
            <span key={tier.label} className="text-2xl font-bold">{tier.price}</span>
          ))}
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <span className="text-xs text-muted-foreground">Suscripción mensual</span>
      </div>
    );
  }
  if (plan.periodicity === "monthly") {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatCurrency(plan.priceMonthly!)}</span>
          <span className="text-sm text-muted-foreground">/mes</span>
        </div>
        <span className="text-xs text-muted-foreground">Suscripción mensual</span>
      </div>
    );
  }
  // Annual B2B plans
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1">
        <span className="text-sm text-muted-foreground line-through mr-1">
          {formatCurrency(plan.priceMonthly!)}
        </span>
        <span className="text-3xl font-bold">{formatCurrency(plan.priceAnnual!)}</span>
        <span className="text-sm text-muted-foreground">/año</span>
      </div>
      <span className="text-xs text-muted-foreground">
        ≈ {formatCurrency(plan.priceMonthly!)}/mes
      </span>
    </div>
  );
}

function PlanMetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium ml-auto text-right">{value}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SettingsView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [user] = useState<UserProfile>(demoUser);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));
  }, []);


  const handleCopyKey = () => {
    navigator.clipboard.writeText("aequo_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxVal = user.plan?.maxValuations ?? 0;
  const maxProp = user.plan?.maxProperties ?? 0;
  const valProgress =
    maxVal > 0 ? Math.min((user.valuationCount / maxVal) * 100, 100) : 0;
  const propProgress =
    maxProp > 0 ? Math.min((12 / maxProp) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="profile" className="gap-2 text-sm">
            <User className="h-4 w-4 hidden sm:block" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 text-sm">
            <CreditCard className="h-4 w-4 hidden sm:block" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 text-sm">
            <Users className="h-4 w-4 hidden sm:block" />
            Equipo
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2 text-sm">
            <Key className="h-4 w-4 hidden sm:block" />
            API
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Perfil ── */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    Æ
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge
                  className={
                    roleColors[user.role] +
                    " border-0 px-3 py-1 text-xs font-medium"
                  }
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {userRoleLabels[user.role]}
                </Badge>
                {user.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {user.company}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan & Usage */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Plan Actual — {user.plan?.name}
                </CardTitle>
                <CardDescription>
                  Detalle de tu suscripción y uso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan badge & price */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="gradient-text text-2xl font-bold">
                        {user.plan?.name ?? "Sin plan"}
                      </span>
                      {user.plan?.badge && (
                        <Badge variant="outline" className="text-xs">
                          {user.plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.plan?.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {user.plan?.priceAnnual ? (
                      <>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(user.plan.priceAnnual)}
                        </p>
                        <p className="text-xs text-muted-foreground">/año</p>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-sm">—</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Key plan details */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Soporte</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Headphones className="h-3.5 w-3.5 text-primary" />
                      {user.plan?.supportLevel ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Valuación extra</p>
                    <p className="text-sm font-medium">
                      {user.plan?.extraValuationPrice
                        ? formatCurrency(user.plan.extraValuationPrice) + "/c/u"
                        : "No disponible"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Usuarios</p>
                    <p className="text-sm font-medium">
                      {user.plan?.maxUsers === -1
                        ? "Ilimitados"
                        : user.plan?.maxUsers === 1
                        ? "1 + invitados"
                        : `Hasta ${user.plan?.maxUsers}`}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Usage */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Uso este año
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span>Valuaciones</span>
                      </div>
                      <span className="font-medium">
                        {user.valuationCount} /{" "}
                        {maxVal === -1 ? "∞" : maxVal}
                      </span>
                    </div>
                    <Progress value={valProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>Propiedades</span>
                      </div>
                      <span className="font-medium">
                        12 / {maxProp === -1 ? "∞" : maxProp}
                      </span>
                    </div>
                    <Progress value={propProgress} className="h-2" />
                  </div>
                </div>

                <Separator />

                {/* Account details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Miembro desde</p>
                      <p className="text-sm font-medium">Ene 2024</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editar Perfil</CardTitle>
              <CardDescription>
                Actualiza la información de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" defaultValue={user.company ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button className="bg-primary hover:bg-primary/90">
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Planes y Precios ── */}
        <TabsContent value="plans" className="mt-6 space-y-10">
          {/* ── B2C: Particulares ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Badge variant="outline" className="border-amber-400/40 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 text-xs font-semibold px-3 py-1">
                B2C
              </Badge>
              <div>
                <h3 className="text-lg font-bold text-foreground">Para Particulares</h3>
                <p className="text-xs text-muted-foreground">Propietarios que necesitan valuaciones profesionales recurrentes</p>
              </div>
            </div>

            {plans.filter(p => p.badge === "B2C").map((plan) => {
              const isCurrent = user.plan?.id === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    isCurrent ? "border-2 border-primary/60 shadow-md" : "hover:border-primary/20"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute right-3 top-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400">
                        Tu plan
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      {/* Left: Plan info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-lg font-bold">{plan.name}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {plan.description}
                          </p>
                        </div>

                        {/* Quick stats row */}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{plan.maxValuations}</span>
                            valuaciones/mes
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{plan.maxUsers}</span>
                            {plan.maxUsers === 1 ? "usuario" : "usuarios"}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Headphones className="h-3.5 w-3.5" />
                            {plan.supportLevel}
                          </span>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                          {plan.features.map((f) => (
                            <span key={f} className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                              <Check className="h-2.5 w-2.5 text-primary" />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Price tiers */}
                      <div className="shrink-0 space-y-4 lg:w-[360px]">
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Elige tu plan
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {plan.priceTiers?.map((tier) => (
                            <div
                              key={tier.label}
                              className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                                tier.label === "Premium"
                                  ? "border-primary/40 bg-primary/5 shadow-sm"
                                  : "border-border hover:border-primary/20"
                              }`}
                            >
                              {tier.label === "Premium" && (
                                <div className="absolute -top-2 left-3">
                                  <Badge className="bg-primary text-primary-foreground border-0 text-[9px] px-2 py-0.5 gap-1">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Popular
                                  </Badge>
                                </div>
                              )}
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{tier.label}</p>
                              <p className="text-2xl font-bold mt-1">{tier.price}</p>
                              <p className="text-[10px] text-muted-foreground">/mes</p>
                              <ul className="mt-3 space-y-1.5">
                                {tier.features.map((f) => (
                                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                    <Check className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              <Button
                                className={`w-full h-8 text-xs mt-3 ${
                                  tier.label === "Premium"
                                    ? "bg-primary hover:bg-primary/90"
                                    : "bg-muted hover:bg-muted/80 text-foreground"
                                }`}
                              >
                                Elegir {tier.label}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── B2B: Empresas ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs font-semibold px-3 py-1">
                B2B
              </Badge>
              <div>
                <h3 className="text-lg font-bold text-foreground">Para Empresas</h3>
                <p className="text-xs text-muted-foreground">Peritos, inmobiliarias, bancos y aseguradoras</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.filter(p => p.badge === "B2B").map((plan) => {
                const isCurrent = user.plan?.id === plan.id;
                const isHighlighted = plan.highlighted;

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden transition-all duration-200 ${
                      isHighlighted
                        ? "border-2 border-primary shadow-xl shadow-primary/10 lg:scale-105 lg:-my-1 z-10"
                        : isCurrent
                        ? "border-2 border-primary/50"
                        : "hover:border-primary/20"
                    }`}
                  >
                    {/* Top banner for highlighted */}
                    {isHighlighted && (
                      <div className="bg-gradient-to-r from-primary to-emerald-500 px-5 py-2 text-center">
                        <span className="text-xs font-semibold text-white tracking-wide">
                          RECOMENDADO
                        </span>
                      </div>
                    )}
                    {!isHighlighted && isCurrent && (
                      <div className="absolute right-3 top-3 z-20">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400">
                          Tu plan
                        </Badge>
                      </div>
                    )}

                    <CardHeader className={`${isHighlighted ? "pt-7" : "pt-5"} pb-3 px-5`}>
                      <CardTitle className={`font-bold leading-tight ${isHighlighted ? "text-xl" : "text-base"}`}>
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {plan.customerType}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-5 px-5 pb-5">
                      {/* Price */}
                      <PlanPriceDisplay plan={plan} />

                      {/* Key metrics */}
                      <div className="space-y-2">
                        <PlanMetaRow
                          icon={BarChart3}
                          label="Valuaciones"
                          value={
                            plan.maxValuations === -1
                              ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ilimitadas</span>
                              : `${plan.maxValuations}/${plan.valuationPeriod === "month" ? "mes" : "año"}`
                          }
                        />
                        <PlanMetaRow
                          icon={Zap}
                          label="Extra"
                          value={
                            plan.extraValuationPrice === null
                              ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Incluidas</span>
                              : `${formatCurrency(plan.extraValuationPrice)}/c/u`
                          }
                        />
                        <PlanMetaRow
                          icon={Users}
                          label="Equipo"
                          value={
                            plan.maxUsers === -1
                              ? "Ilimitados + SSO"
                              : plan.maxUsers === 1
                              ? "1 + invitados lectura"
                              : `Hasta ${plan.maxUsers} (roles)`
                          }
                        />
                        <PlanMetaRow
                          icon={Headphones}
                          label="Soporte"
                          value={
                            <span className={isHighlighted ? "font-semibold text-primary" : ""}>
                              {plan.supportLevel}
                            </span>
                          }
                        />
                      </div>

                      <Separator />

                      {/* Features */}
                      <ul className="flex-1 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-xs">
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-auto pt-2">
                        {isCurrent ? (
                          <Button
                            variant="outline"
                            className="w-full h-10 text-sm"
                            disabled
                          >
                            Plan Actual
                          </Button>
                        ) : (
                          <Button className="w-full h-10 text-sm bg-primary hover:bg-primary/90">
                            Contactar Ventas
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 3: Equipo ── */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Miembros del Equipo</CardTitle>
                <CardDescription>
                  Gestiona los accesos de tu equipo
                </CardDescription>
              </div>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Invitar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Estado
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Última actividad
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoTeam.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              roleColors[member.role] +
                              " border-0 text-xs"
                            }
                          >
                            {userRoleLabels[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            className={
                              statusColors[member.status] +
                              " border-0 text-xs"
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {member.lastActive}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: API Keys ── */}
        <TabsContent value="api" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-5 w-5" />
                Clave de API
              </CardTitle>
              <CardDescription>
                Usa esta clave para acceder a la API de Æquo desde tus
                aplicaciones. Manténla segura y no la compartas públicamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key Display */}
              <div className="space-y-2">
                <Label>Clave de producción</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      showApiKey
                        ? "aequo_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                        : "aequo_sk_••••••••••••••••••••••••••••••••••"
                    }
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="shrink-0"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyKey}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    ✓ Copiado al portapapeles
                  </p>
                )}
              </div>

              <Separator />

              {/* Key details */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Activa
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Creada</p>
                  <p className="text-sm font-medium">15 Feb 2024</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    Último uso
                  </p>
                  <p className="text-sm font-medium">Hace 2 horas</p>
                </div>
              </div>

              <Separator />

              {/* Usage */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Uso de API este mes
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Solicitudes realizadas</span>
                    <span className="font-medium">1,247 / 5,000</span>
                  </div>
                  <Progress value={24.9} className="h-2" />
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>
                    Necesitas más capacidad? Considera{" "}
                    <button className="font-medium text-primary hover:underline">
                      actualizar tu plan
                    </button>
                  </span>
                </div>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Generar Nueva Clave
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* ── Open Source Map Services ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-primary" />
                Servicios de Mapa
                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400">
                  100% Gratuito
                </Badge>
              </CardTitle>
              <CardDescription>
                Æquo utiliza servicios de mapa de código abierto. No requiere API keys ni pagos.
                Ideal para agrimensores, peritos y profesionales del sector inmobiliario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Services Grid */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Satellite className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold">Imágenes Satelitales</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Esri World Imagery — Alta resolución con vista de edificaciones</p>
                  <div className="mt-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Activo
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Map className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold">Mapa de Calles</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">OpenStreetMap — Datos viales actualizados por la comunidad</p>
                  <div className="mt-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Activo
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Mountain className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold">Terreno / Relieve</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">OpenTopoMap — Curvas de nivel y topografía</p>
                  <div className="mt-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Activo
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Geocoding Services */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold">Nominatim (OSM)</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Geocodificación y búsqueda de direcciones. Cubre República Dominicana y más de 200 países.</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold">Reverse Geocoding</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Conversión de coordenadas a direcciones completas. 31 provincias de RD mapeadas.</p>
                </div>
              </div>

              <Separator />

              {/* Benefits */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Ventajas para tu trabajo
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Vista satelital para identificar estructuras y lotes",
                    "Datos de relieve para análisis topográfico",
                    "Búsqueda precisa con cobertura global",
                    "Sin costos por uso ni API keys",
                    "Funciona offline con capa de caché",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsView;
