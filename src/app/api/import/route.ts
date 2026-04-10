import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

interface ImportProperty {
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

const VALID_PROPERTY_TYPES = [
  "OFICINA",
  "RETAIL",
  "INDUSTRIAL",
  "BODEGA",
  "TERRENO",
  "MIXTO",
  "HOTEL",
  "RESTAURANTE",
];

const VALID_CONDITIONS = [
  "EXCELENTE",
  "BUENO",
  "REGULAR",
  "MALO",
  "EN_REMODELACION",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { properties } = body as { properties: ImportProperty[] };

    if (!Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un arreglo de propiedades.", success: 0, errors: [] },
        { status: 400 },
      );
    }

    if (properties.length > 500) {
      return NextResponse.json(
        { error: "Máximo 500 propiedades por importación.", success: 0, errors: [] },
        { status: 400 },
      );
    }

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];

      if (!p.name || !p.address || !p.city || !p.state || !p.zipCode || !p.propertyType || !p.totalArea) {
        errors.push(`Fila ${i + 1}: Campos requeridos faltantes (Nombre, Dirección, Ciudad, Estado, CP, Tipo, Área Total).`);
        continue;
      }

      if (!VALID_PROPERTY_TYPES.includes(p.propertyType)) {
        errors.push(
          `Fila ${i + 1}: Tipo de propiedad "${p.propertyType}" no válido. Valores aceptados: ${VALID_PROPERTY_TYPES.join(", ")}.`,
        );
        continue;
      }

      if (typeof p.totalArea !== "number" || p.totalArea <= 0) {
        errors.push(`Fila ${i + 1}: Área Total debe ser un número positivo.`);
        continue;
      }

      if (p.buildingCondition && !VALID_CONDITIONS.includes(p.buildingCondition)) {
        errors.push(
          `Fila ${i + 1}: Estado de conservación "${p.buildingCondition}" no válido. Valores aceptados: ${VALID_CONDITIONS.join(", ")}.`,
        );
        continue;
      }

      if (p.yearBuilt !== undefined && p.yearBuilt !== null) {
        const year = typeof p.yearBuilt === "number" ? p.yearBuilt : parseInt(String(p.yearBuilt), 10);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
          errors.push(`Fila ${i + 1}: Año de construcción inválido.`);
          continue;
        }
      }

      try {
        const { error } = await supabase.from("properties").insert({
          name: String(p.name).trim(),
          address: String(p.address).trim(),
          city: String(p.city).trim(),
          state: String(p.state).trim(),
          zip_code: String(p.zipCode).trim(),
          property_type: p.propertyType,
          total_area: p.totalArea,
          constructed_area: p.constructedArea ?? null,
          floors: p.floors ?? 1,
          year_built: p.yearBuilt ?? null,
          parking_spaces: p.parkingSpaces ?? 0,
          bathrooms: p.bathrooms ?? 1,
          building_condition: p.buildingCondition ?? "BUENO",
          current_use: p.currentUse ?? null,
          features: p.features ? [p.features] : [],
          notes: p.notes ?? null,
          status: "BORRADOR",
        });

        if (error) throw error;
        success++;
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : "Error desconocido";
        errors.push(`Fila ${i + 1}: Error al guardar — ${msg}`);
      }
    }

    return NextResponse.json({ success, errors });
  } catch (error) {
    console.error("Error importing properties:", error);
    return NextResponse.json(
      { error: "Error interno del servidor.", success: 0, errors: [] },
      { status: 500 },
    );
  }
}
