import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { propertyTypeLabels } from "@/lib/types";

// Demo fallback properties for export when DB is empty
const DEMO_PROPERTIES = [
  {
    id: "1",
    name: "Centro Corporativo Piantini",
    address: "Av. Winston Churchill 45",
    city: "Santo Domingo",
    state: "DN",
    zipCode: "10101",
    propertyType: "OFICINA",
    totalArea: 4500,
    constructedArea: 4200,
    floors: 12,
    yearBuilt: 2018,
    parkingSpaces: 80,
    bathrooms: 24,
    buildingCondition: "EXCELENTE",
    status: "VALUADO",
    marketValue: 52000000,
    pricePerSqm: 11556,
    createdAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "2",
    name: "Plaza Comercial Acropolis",
    address: "Av. Winston Churchill 103",
    city: "Santo Domingo",
    state: "DN",
    zipCode: "10102",
    propertyType: "RETAIL",
    totalArea: 1200,
    constructedArea: 1100,
    floors: 2,
    yearBuilt: 2020,
    parkingSpaces: 150,
    bathrooms: 6,
    buildingCondition: "BUENO",
    status: "VALUADO",
    marketValue: 25000000,
    pricePerSqm: 20833,
    createdAt: "2025-01-08T14:30:00Z",
  },
  {
    id: "3",
    name: "Zona Franca Industrial Santiago",
    address: "Autopista Duarte Km 5",
    city: "Santiago",
    state: "STI",
    zipCode: "51000",
    propertyType: "INDUSTRIAL",
    totalArea: 8000,
    constructedArea: 6500,
    floors: 1,
    yearBuilt: 2022,
    parkingSpaces: 40,
    bathrooms: 8,
    buildingCondition: "EXCELENTE",
    status: "VALUADO",
    marketValue: 28000000,
    pricePerSqm: 3500,
    createdAt: "2025-01-05T09:15:00Z",
  },
  {
    id: "4",
    name: "Torre Naco Business Center",
    address: "Av. Gustavo Mejía Ricart 91",
    city: "Santo Domingo",
    state: "DN",
    zipCode: "10104",
    propertyType: "OFICINA",
    totalArea: 2800,
    constructedArea: 2600,
    floors: 8,
    yearBuilt: 2015,
    parkingSpaces: 35,
    bathrooms: 12,
    buildingCondition: "BUENO",
    status: "EN_REVISION",
    marketValue: null,
    pricePerSqm: null,
    createdAt: "2025-01-03T16:45:00Z",
  },
  {
    id: "5",
    name: "Bodega Industrial San Pedro",
    address: "Carretera Sánchez Ramírez",
    city: "San Pedro de Macorís",
    state: "SM",
    zipCode: "31000",
    propertyType: "BODEGA",
    totalArea: 12000,
    constructedArea: 10000,
    floors: 1,
    yearBuilt: 2021,
    parkingSpaces: 25,
    bathrooms: 4,
    buildingCondition: "EXCELENTE",
    status: "VALUADO",
    marketValue: 18000000,
    pricePerSqm: 1500,
    createdAt: "2024-12-28T11:00:00Z",
  },
];

export async function GET() {
  try {
    // Fetch properties with their latest valuation
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, valuations(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Use demo data if DB is empty
    const data =
      properties && properties.length > 0 ? properties : DEMO_PROPERTIES;

    // Map to export format
    const exportRows = data.map((p: Record<string, unknown>) => {
      const valuations = p.valuations as Array<Record<string, unknown>> | undefined;
      const latestValuation =
        valuations && valuations.length > 0
          ? [...valuations].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )[0]
          : null;

      const marketValue =
        (p.marketValue as number | null) ??
        (latestValuation?.market_value as number | null) ??
        null;
      const pricePerSqm =
        (p.pricePerSqm as number | null) ??
        (latestValuation?.price_per_sqm as number | null) ??
        null;

      return {
        ID: p.id,
        Nombre: p.name,
        "Dirección": p.address,
        Ciudad: p.city,
        Estado: p.state,
        CP: p.zip_code || p.zipCode,
        Tipo:
          propertyTypeLabels[
            (p.property_type || p.propertyType) as keyof typeof propertyTypeLabels
          ] || p.property_type || p.propertyType,
        "Área Total (m²)": p.total_area || p.totalArea,
        "Área Construida (m²)": p.constructed_area ?? p.constructedArea ?? "",
        Niveles: p.floors,
        "Año Construcción": p.year_built ?? p.yearBuilt ?? "",
        Cajones: p.parking_spaces ?? p.parkingSpaces,
        Baños: p.bathrooms,
        "Estado Conservación":
          p.building_condition || p.buildingCondition,
        Estatus: p.status,
        "Valor Mercado ($)": marketValue ?? "",
        "Precio/m² ($)": pricePerSqm ?? "",
        "Fecha Registro":
          p.created_at instanceof Date
            ? p.created_at.toISOString()
            : String(p.createdAt || p.created_at),
      };
    });

    // Build CSV content
    const Papa = await import("papaparse");
    const csv = Papa.default.unparse(exportRows);

    const BOM = "\uFEFF";
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(BOM + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="aequo-propiedades-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting properties:", error);
    return NextResponse.json(
      { error: "Error al exportar propiedades" },
      { status: 500 },
    );
  }
}
