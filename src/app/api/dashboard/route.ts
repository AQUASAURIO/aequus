import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    // Get total properties
    const { count: totalProperties, error: countError } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // Get properties with their valuations
    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, valuations(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate stats
    let totalValue = 0;
    let priceSqmSum = 0;
    let priceSqmCount = 0;
    let pendingCount = 0;

    for (const prop of properties || []) {
      if (prop.status === "EN_REVISION" || prop.status === "BORRADOR") {
        pendingCount++;
      }
      const vals = prop.valuations || [];
      if (vals.length > 0) {
        const sorted = [...vals].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        const latest = sorted[0];
        totalValue += latest.market_value;
        if (latest.price_per_sqm) {
          priceSqmSum += latest.price_per_sqm;
          priceSqmCount++;
        }
      }
    }

    const avgPricePerSqm =
      priceSqmCount > 0 ? Math.round(priceSqmSum / priceSqmCount) : 0;

    return NextResponse.json({
      totalProperties: totalProperties || 0,
      totalValue,
      avgPricePerSqm,
      pendingValuations: pendingCount,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 },
    );
  }
}
