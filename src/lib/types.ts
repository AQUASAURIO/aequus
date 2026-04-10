// Property Types
export type PropertyType =
  | "OFICINA"
  | "RETAIL"
  | "INDUSTRIAL"
  | "BODEGA"
  | "TERRENO"
  | "MIXTO"
  | "HOTEL"
  | "RESTAURANTE";

export type BuildingCondition =
  | "EXCELENTE"
  | "BUENO"
  | "REGULAR"
  | "MALO"
  | "EN_REMODELACION";

export type PropertyStatus = "BORRADOR" | "VALUADO" | "EN_REVISION";

export type ValuationMethod = "COMPARABLE" | "INGRESO" | "COSTO" | "HIBRIDO";

export interface PropertyFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: PropertyType;
  totalArea: number;
  constructedArea?: number;
  lotArea?: number;
  floors: number;
  yearBuilt?: number;
  parkingSpaces: number;
  bathrooms: number;
  currentUse?: string;
  buildingCondition: BuildingCondition;
  features: string[];
  notes?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyType: PropertyType;
  totalArea: number;
  constructedArea: number | null;
  lotArea: number | null;
  floors: number;
  yearBuilt: number | null;
  parkingSpaces: number;
  bathrooms: number;
  currentUse: string | null;
  buildingCondition: BuildingCondition;
  features: string[];
  coordinates: string | null;
  imageUrl: string | null;
  notes: string | null;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  valuations: Valuation[];
}

export interface Valuation {
  id: string;
  propertyId: string;
  marketValue: number;
  pricePerSqm: number | null;
  rentalValue: number | null;
  capRate: number | null;
  confidence: number;
  valuationMethod: ValuationMethod;
  comparablesData: ComparableProperty[] | null;
  aiAnalysis: string | null;
  aiRecommendations: string | null;
  riskFactors: RiskFactor[] | null;
  marketTrends: MarketTrend[] | null;
  valuatedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComparableProperty {
  name: string;
  address: string;
  type: PropertyType;
  area: number;
  price: number;
  pricePerSqm: number;
  similarity: number; // 0-1
}

export interface RiskFactor {
  factor: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

export interface MarketTrend {
  period: string;
  avgPrice: number;
  volume: number;
  change: number;
}

// User & Plan types
export type UserRole = "ADMIN" | "MANAGER" | "USER";

export interface Plan {
  id: string;
  name: string;
  badge: string;
  description: string;
  customerType: string;
  periodicity: "free" | "onetime" | "monthly" | "annual" | "multiyear";
  priceMonthly: number | null;
  priceAnnual: number | null;
  priceOneTime: string | null;
  maxValuations: number;
  maxProperties: number;
  valuationPeriod: "month" | "year";
  extraValuationPrice: number | null;
  maxUsers: number | null;
  supportLevel: string;
  features: string[];
  isActive: boolean;
  highlighted?: boolean;
  priceTiers?: { label: string; price: string; features: string[] }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company: string | null;
  role: UserRole;
  plan: Plan | null;
  valuationCount: number;
  isActive: boolean;
}

// Navigation types
export type AppView =
  | "dashboard"
  | "new-valuation"
  | "properties"
  | "property-detail"
  | "market-analysis"
  | "settings";

// Dashboard types
export interface DashboardStats {
  totalProperties: number;
  totalValue: number;
  avgPricePerSqm: number;
  pendingValuations: number;
  recentValuations: (Property & { latestValuation: Valuation })[];
  valuationsByType: { type: string; count: number; totalValue: number }[];
  monthlyValuations: { month: string; count: number; totalValue: number }[];
}

// Label mappings
export const propertyTypeLabels: Record<PropertyType, string> = {
  OFICINA: "Oficina",
  RETAIL: "Retail / Comercial",
  INDUSTRIAL: "Industrial",
  BODEGA: "Bodega / Almacén",
  TERRENO: "Terreno",
  MIXTO: "Mixto",
  HOTEL: "Hotel",
  RESTAURANTE: "Restaurante",
};

export const buildingConditionLabels: Record<BuildingCondition, string> = {
  EXCELENTE: "Excelente",
  BUENO: "Bueno",
  REGULAR: "Regular",
  MALO: "Malo",
  EN_REMODELACION: "En Remodelación",
};

export const propertyStatusLabels: Record<PropertyStatus, string> = {
  BORRADOR: "Borrador",
  VALUADO: "Valuado",
  EN_REVISION: "En Revisión",
};

export const valuationMethodLabels: Record<ValuationMethod, string> = {
  COMPARABLE: "Método de Comparables",
  INGRESO: "Método de Ingresos",
  COSTO: "Método de Costo",
  HIBRIDO: "Método Híbrido",
};

export const propertyTypeColors: Record<PropertyType, string> = {
  OFICINA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  RETAIL: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  INDUSTRIAL: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  BODEGA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  TERRENO: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  MIXTO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  HOTEL: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  RESTAURANTE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export const availableFeatures = [
  "Ascensor",
  "Aire Acondicionado",
  "Vigilancia 24/7",
  "Estacionamiento Subterráneo",
  "Sistema Contra Incendios",
  "Cableado Estructural",
  "Planta de Emergencia",
  "Cuarto de Máquinas",
  "Terraza",
  "Recepción",
  "Bodega Privada",
  "Muelles de Carga",
  "Oficinas Administrativas",
  "Comedor",
  "Área de Carga/Descarga",
  "Cuarto Eléctrico",
  "Sistema de Ventilación",
  "Alarma",
  "Cercado Perimetral",
  "Acceso Controlado",
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-DO").format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  USER: "Usuario",
};

// ── Country & Region Data ─────────────────────────────────────────────────

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  defaultCenter: [number, number];
}

export const countries: CountryOption[] = [
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", defaultCenter: [18.7357, -70.1627] },
  { code: "MX", name: "México", flag: "🇲🇽", defaultCenter: [19.4326, -99.1332] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", defaultCenter: [4.7110, -74.0721] },
  { code: "PA", name: "Panamá", flag: "🇵🇦", defaultCenter: [8.9824, -79.5199] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", defaultCenter: [14.6349, -90.5069] },
  { code: "PE", name: "Perú", flag: "🇵🇪", defaultCenter: [-12.0464, -77.0428] },
  { code: "AR", name: "Argentina", flag: "🇦🇷", defaultCenter: [-34.6037, -58.3816] },
  { code: "ES", name: "España", flag: "🇪🇸", defaultCenter: [40.4168, -3.7038] },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", defaultCenter: [38.9072, -77.0369] },
];

export const drProvinces: { code: string; name: string }[] = [
  { code: "DN", name: "Distrito Nacional" },
  { code: "AZU", name: "Azua" },
  { code: "BAH", name: "Bahoruco" },
  { code: "BAR", name: "Barahona" },
  { code: "DAJ", name: "Dajabón" },
  { code: "DUA", name: "Duarte" },
  { code: "EPI", name: "Elías Piña" },
  { code: "ES", name: "El Seibo" },
  { code: "ESP", name: "Espaillat" },
  { code: "HMA", name: "Hato Mayor" },
  { code: "HMI", name: "Hermanas Mirabal" },
  { code: "INP", name: "Independencia" },
  { code: "LAR", name: "La Altagracia" },
  { code: "LR", name: "La Romana" },
  { code: "LVE", name: "La Vega" },
  { code: "MTS", name: "María Trinidad Sánchez" },
  { code: "MNO", name: "Monseñor Nouel" },
  { code: "MTC", name: "Monte Cristi" },
  { code: "MPL", name: "Monte Plata" },
  { code: "PED", name: "Pedernales" },
  { code: "PER", name: "Peravia" },
  { code: "PPT", name: "Puerto Plata" },
  { code: "SAM", name: "Samaná" },
  { code: "SC", name: "San Cristóbal" },
  { code: "SJO", name: "San José de Ocoa" },
  { code: "SJ", name: "San Juan" },
  { code: "SPM", name: "San Pedro de Macorís" },
  { code: "SRA", name: "Sánchez Ramírez" },
  { code: "STI", name: "Santiago" },
  { code: "SRO", name: "Santiago Rodríguez" },
  { code: "SD", name: "Santo Domingo" },
  { code: "VAL", name: "Valverde" },
];

export const mxStates: { code: string; name: string }[] = [
  { code: "AGU", name: "Aguascalientes" },
  { code: "BCN", name: "Baja California" },
  { code: "BCS", name: "Baja California Sur" },
  { code: "CAM", name: "Campeche" },
  { code: "CHP", name: "Chiapas" },
  { code: "CHH", name: "Chihuahua" },
  { code: "COA", name: "Coahuila" },
  { code: "COL", name: "Colima" },
  { code: "CMX", name: "Ciudad de México" },
  { code: "DUR", name: "Durango" },
  { code: "GUA", name: "Guanajuato" },
  { code: "GRO", name: "Guerrero" },
  { code: "HID", name: "Hidalgo" },
  { code: "JAL", name: "Jalisco" },
  { code: "MEX", name: "Estado de México" },
  { code: "MIC", name: "Michoacán" },
  { code: "MOR", name: "Morelos" },
  { code: "NAY", name: "Nayarit" },
  { code: "NLE", name: "Nuevo León" },
  { code: "OAX", name: "Oaxaca" },
  { code: "PUE", name: "Puebla" },
  { code: "QUE", name: "Querétaro" },
  { code: "ROO", name: "Quintana Roo" },
  { code: "SLP", name: "San Luis Potosí" },
  { code: "SIN", name: "Sinaloa" },
  { code: "SON", name: "Sonora" },
  { code: "TAB", name: "Tabasco" },
  { code: "TAM", name: "Tamaulipas" },
  { code: "TLA", name: "Tlaxcala" },
  { code: "VER", name: "Veracruz" },
  { code: "YUC", name: "Yucatán" },
  { code: "ZAC", name: "Zacatecas" },
];

export function getRegionsForCountry(countryCode: string): { code: string; name: string }[] {
  switch (countryCode) {
    case "DO": return drProvinces;
    case "MX": return mxStates;
    default: return [];
  }
}
