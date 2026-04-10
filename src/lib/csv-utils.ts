import Papa from 'papaparse';

// ==================== Types ====================

export interface ExportProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  totalArea: number;
  constructedArea: number | null;
  floors: number;
  yearBuilt: number | null;
  parkingSpaces: number;
  bathrooms: number;
  buildingCondition: string;
  status: string;
  marketValue: number | null;
  pricePerSqm: number | null;
  createdAt: string;
}

export interface ImportedProperty {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  totalArea: number;
  constructedArea?: number;
  floors?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  bathrooms?: number;
  buildingCondition?: string;
  currentUse?: string;
  features?: string;
  notes?: string;
}

// ==================== Column Definitions ====================

// Spanish headers for export
const EXPORT_HEADERS = [
  'ID',
  'Nombre',
  'Dirección',
  'Ciudad',
  'Estado',
  'CP',
  'Tipo',
  'Área Total (m²)',
  'Área Construida (m²)',
  'Niveles',
  'Año Construcción',
  'Cajones',
  'Baños',
  'Estado Conservación',
  'Estatus',
  'Valor Mercado ($)',
  'Precio/m² ($)',
  'Fecha Registro',
] as const;

// Template headers for import (Spanish)
const TEMPLATE_HEADERS = [
  'Nombre',
  'Dirección',
  'Ciudad',
  'Estado',
  'CP',
  'Tipo',
  'Área Total (m²)',
  'Área Construida (m²)',
  'Niveles',
  'Año Construcción',
  'Cajones',
  'Baños',
  'Estado Conservación',
  'Uso Actual',
  'Características',
  'Notas',
] as const;

// Column name mapping: accepts both English and Spanish headers
const COLUMN_MAP: Record<string, keyof ImportedProperty> = {
  // Spanish headers
  'nombre': 'name',
  'dirección': 'address',
  'direccion': 'address',
  'ciudad': 'city',
  'estado': 'state',
  'cp': 'zipCode',
  'código postal': 'zipCode',
  'codigo postal': 'zipCode',
  'tipo': 'propertyType',
  'tipo de propiedad': 'propertyType',
  'área total (m²)': 'totalArea',
  'area total (m2)': 'totalArea',
  'area total (m²)': 'totalArea',
  'área total': 'totalArea',
  'area total': 'totalArea',
  'área construida (m²)': 'constructedArea',
  'area construida (m2)': 'constructedArea',
  'area construida (m²)': 'constructedArea',
  'área construida': 'constructedArea',
  'area construida': 'constructedArea',
  'niveles': 'floors',
  'pisos': 'floors',
  'año construcción': 'yearBuilt',
  'ano construccion': 'yearBuilt',
  'año': 'yearBuilt',
  'cajones': 'parkingSpaces',
  'estacionamiento': 'parkingSpaces',
  'baños': 'bathrooms',
  'banos': 'bathrooms',
  'estado conservación': 'buildingCondition',
  'estado conservacion': 'buildingCondition',
  'condición': 'buildingCondition',
  'condicion': 'buildingCondition',
  'uso actual': 'currentUse',
  'características': 'features',
  'caracteristicas': 'features',
  'notas': 'notes',
  // English headers
  'name': 'name',
  'address': 'address',
  'city': 'city',
  'state': 'state',
  'zip': 'zipCode',
  'zip_code': 'zipCode',
  'zip code': 'zipCode',
  'zipcode': 'zipCode',
  'property_type': 'propertyType',
  'property type': 'propertyType',
  'type': 'propertyType',
  'total_area': 'totalArea',
  'total area': 'totalArea',
  'constructed_area': 'constructedArea',
  'constructed area': 'constructedArea',
  'floors': 'floors',
  'year_built': 'yearBuilt',
  'year built': 'yearBuilt',
  'parking_spaces': 'parkingSpaces',
  'parking spaces': 'parkingSpaces',
  'parking': 'parkingSpaces',
  'bathrooms': 'bathrooms',
  'building_condition': 'buildingCondition',
  'building condition': 'buildingCondition',
  'condition': 'buildingCondition',
  'current_use': 'currentUse',
  'current use': 'currentUse',
  'features': 'features',
  'notes': 'notes',
};

// ==================== Export ====================

export function exportPropertiesToCSV(properties: ExportProperty[]): void {
  const rows = properties.map((p) => [
    p.id,
    p.name,
    p.address,
    p.city,
    p.state,
    p.zipCode,
    p.propertyType,
    p.totalArea,
    p.constructedArea ?? '',
    p.floors,
    p.yearBuilt ?? '',
    p.parkingSpaces,
    p.bathrooms,
    p.buildingCondition,
    p.status,
    p.marketValue ?? '',
    p.pricePerSqm ?? '',
    p.createdAt,
  ]);

  const csv = Papa.unparse({
    fields: [...EXPORT_HEADERS],
    data: rows,
  });

  triggerDownload(csv, `aequo-propiedades-${getDateString()}.csv`);
}

// ==================== Import ====================

export function parseImportCSV(file: File): Promise<ImportedProperty[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete(results) {
        try {
          const parsed = results.data as Record<string, string>[];
          const properties: ImportedProperty[] = [];

          for (let i = 0; i < parsed.length; i++) {
            const row = parsed[i];
            const mapped = mapRowToProperty(row, i + 2); // +2 for 1-index + header row
            if (mapped) {
              properties.push(mapped);
            }
          }

          resolve(properties);
        } catch (err) {
          reject(err);
        }
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

function mapRowToProperty(
  row: Record<string, string>,
  rowNum: number
): ImportedProperty | null {
  const mapped: Record<string, string | number | undefined> = {};

  for (const [header, value] of Object.entries(row)) {
    const normalizedHeader = header.trim().toLowerCase();
    const field = COLUMN_MAP[normalizedHeader];
    if (field && value !== undefined && value !== null && String(value).trim() !== '') {
      mapped[field] = String(value).trim();
    }
  }

  // Validate required fields
  if (!mapped.name || !mapped.address || !mapped.city || !mapped.state || !mapped.zipCode || !mapped.propertyType) {
    console.warn(`Fila ${rowNum}: Campos requeridos faltantes (Nombre, Dirección, Ciudad, Estado, CP, Tipo). Fila omitida.`);
    return null;
  }

  const totalArea = parseNumeric(mapped.totalArea);
  if (totalArea === null || totalArea <= 0) {
    console.warn(`Fila ${rowNum}: Área Total inválida. Fila omitida.`);
    return null;
  }

  return {
    name: String(mapped.name),
    address: String(mapped.address),
    city: String(mapped.city),
    state: String(mapped.state),
    zipCode: String(mapped.zipCode),
    propertyType: normalizePropertyType(String(mapped.propertyType)),
    totalArea,
    constructedArea: parseNumeric(mapped.constructedArea) ?? undefined,
    floors: parseNumeric(mapped.floors) ?? undefined,
    yearBuilt: parseNumeric(mapped.yearBuilt) ?? undefined,
    parkingSpaces: parseNumeric(mapped.parkingSpaces) ?? undefined,
    bathrooms: parseNumeric(mapped.bathrooms) ?? undefined,
    buildingCondition: mapped.buildingCondition ? normalizeCondition(String(mapped.buildingCondition)) : undefined,
    currentUse: mapped.currentUse ? String(mapped.currentUse) : undefined,
    features: mapped.features ? String(mapped.features) : undefined,
    notes: mapped.notes ? String(mapped.notes) : undefined,
  };
}

// ==================== Template Download ====================

export function downloadCSVTemplate(): void {
  const exampleRow = [
    'Oficina Corporativa Ejemplo',
    'Av. Reforma 500, Col. Juárez',
    'Ciudad de México',
    'CDMX',
    '06600',
    'OFICINA',
    '2500',
    '2000',
    '3',
    '2020',
    '15',
    '4',
    'EXCELENTE',
    'Oficinas Corporativas',
    'Aire Acondicionado, Ascensor, Vigilancia 24/7',
    'Propiedad en excelente ubicación.',
  ];

  const csv = Papa.unparse({
    fields: [...TEMPLATE_HEADERS],
    data: [exampleRow],
  });

  triggerDownload(csv, `aequo-plantilla-importacion-${getDateString()}.csv`);
}

// ==================== Helpers ====================

function triggerDownload(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function parseNumeric(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  oficina: 'OFICINA',
  retail: 'RETAIL',
  comercial: 'RETAIL',
  industrial: 'INDUSTRIAL',
  bodega: 'BODEGA',
  almacen: 'BODEGA',
  terreno: 'TERRENO',
  mixto: 'MIXTO',
  hotel: 'HOTEL',
  restaurante: 'RESTAURANTE',
};

function normalizePropertyType(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  // Check if it's already a valid enum value
  const validTypes = ['OFICINA', 'RETAIL', 'INDUSTRIAL', 'BODEGA', 'TERRENO', 'MIXTO', 'HOTEL', 'RESTAURANTE'];
  if (validTypes.includes(cleaned)) return cleaned;
  // Try alias
  const lower = raw.trim().toLowerCase();
  return PROPERTY_TYPE_ALIASES[lower] || 'OFICINA';
}

const CONDITION_ALIASES: Record<string, string> = {
  excelente: 'EXCELENTE',
  bueno: 'BUENO',
  regular: 'REGULAR',
  malo: 'MALO',
  remodelacion: 'EN_REMODELACION',
  remodelación: 'EN_REMODELACION',
  'en remodelacion': 'EN_REMODELACION',
  'en remodelación': 'EN_REMODELACION',
};

function normalizeCondition(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  const validConditions = ['EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'EN_REMODELACION'];
  if (validConditions.includes(cleaned)) return cleaned;
  const lower = raw.trim().toLowerCase();
  return CONDITION_ALIASES[lower] || 'BUENO';
}
