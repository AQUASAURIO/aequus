import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const {
            propertyId,
            marketValue,
            pricePerSqm,
            rentalValue,
            capRate,
            confidence,
            valuationMethod,
            comparablesData,
            aiAnalysis,
            aiRecommendations,
            riskFactors,
            marketTrends,
        } = body;

        if (!propertyId || !marketValue || !valuationMethod) {
            return NextResponse.json(
                { error: "Faltan campos requeridos (propertyId, marketValue, valuationMethod)" },
                { status: 400 }
            );
        }

        const { data: valuation, error } = await supabase
            .from("valuations")
            .insert({
                property_id: propertyId,
                market_value: marketValue,
                price_per_sqm: pricePerSqm,
                rental_value: rentalValue,
                cap_rate: capRate,
                confidence: confidence || 0.8,
                valuation_method: valuationMethod,
                comparables_data: comparablesData || [],
                ai_analysis: aiAnalysis,
                ai_recommendations: aiRecommendations,
                risk_factors: riskFactors || [],
                market_trends: marketTrends || {},
                user_id: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        // Update property status to VALUADO
        await supabase
            .from("properties")
            .update({ status: "VALUADO" })
            .eq("id", propertyId);

        return NextResponse.json(valuation, { status: 201 });
    } catch (error) {
        console.error("Error saving valuation:", error);
        return NextResponse.json(
            { error: "Error al guardar la valuación" },
            { status: 500 }
        );
    }
}
