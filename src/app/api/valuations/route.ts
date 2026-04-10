import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Price reference data per property type (simulated market data)
const marketData: Record<string, { avgPricePerSqm: number; rentalYield: number; capRate: number }> = {
  OFICINA: { avgPricePerSqm: 19000, rentalYield: 0.0635, capRate: 6.35 },
  RETAIL: { avgPricePerSqm: 25000, rentalYield: 0.0675, capRate: 6.75 },
  INDUSTRIAL: { avgPricePerSqm: 7000, rentalYield: 0.0587, capRate: 5.87 },
  BODEGA: { avgPricePerSqm: 5500, rentalYield: 0.055, capRate: 5.5 },
  TERRENO: { avgPricePerSqm: 4500, rentalYield: 0.04, capRate: 4.0 },
  MIXTO: { avgPricePerSqm: 15000, rentalYield: 0.06, capRate: 6.0 },
  HOTEL: { avgPricePerSqm: 18000, rentalYield: 0.07, capRate: 7.0 },
  RESTAURANTE: { avgPricePerSqm: 22000, rentalYield: 0.08, capRate: 8.0 },
};

const buildingConditionMultiplier: Record<string, number> = {
  EXCELENTE: 1.15,
  BUENO: 1.0,
  REGULAR: 0.85,
  MALO: 0.70,
  EN_REMODELACION: 0.80,
};

const featureBonus: Record<string, number> = {
  "Ascensor": 0.03,
  "Aire Acondicionado": 0.04,
  "Vigilancia 24/7": 0.02,
  "Estacionamiento Subterráneo": 0.03,
  "Sistema Contra Incendios": 0.01,
  "Cableado Estructural": 0.02,
  "Planta de Emergencia": 0.02,
  "Recepción": 0.01,
  "Muelles de Carga": 0.02,
  "Cercado Perimetral": 0.01,
  "Acceso Controlado": 0.01,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      propertyType,
      totalArea,
      constructedArea,
      floors,
      yearBuilt,
      parkingSpaces,
      bathrooms,
      buildingCondition,
      currentUse,
      features = [],
      notes,
    } = body;

    if (!name || !address || !city || !state || !propertyType || !totalArea) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // 1. Calculate base valuation
    const market = marketData[propertyType] || marketData.OFICINA;
    const conditionMult = buildingConditionMultiplier[buildingCondition] || 1.0;

    // Feature bonus
    let featureMult = 0;
    for (const f of features) {
      featureMult += featureBonus[f] || 0.005;
    }

    // Age depreciation
    const age = yearBuilt ? new Date().getFullYear() - yearBuilt : 0;
    const ageFactor = Math.max(0.7, 1 - age * 0.005);

    // Floors factor (taller = slightly more per sqm for some types)
    const floorFactor = floors > 5 ? 1.05 : floors > 1 ? 1.0 : 0.95;

    // Calculate final price per sqm
    const basePrice = market.avgPricePerSqm * conditionMult * ageFactor * floorFactor * (1 + featureMult);
    const marketValue = Math.round(basePrice * totalArea);
    const pricePerSqm = Math.round(marketValue / totalArea);
    const rentalValue = Math.round(marketValue * market.rentalYield / 12);
    const capRate = market.capRate;

    // Confidence based on data quality
    let confidence = 0.75;
    if (constructedArea) confidence += 0.05;
    if (yearBuilt) confidence += 0.05;
    if (features.length > 3) confidence += 0.05;
    confidence = Math.min(0.95, confidence);

    // 2. Generate AI analysis
    const zai = await ZAI.create();

    const aiPrompt = `Eres un valuador profesional de propiedades comerciales en México con más de 20 años de experiencia. Genera un análisis detallado de valuación para la siguiente propiedad:

**Nombre:** ${name}
**Dirección:** ${address}, ${city}, ${state}
**Tipo:** ${propertyType}
**Área Total:** ${totalArea} m²
**Área Construida:** ${constructedArea || "No especificada"} m²
**Niveles:** ${floors}
**Año de Construcción:** ${yearBuilt || "No especificado"}
**Cajones de Estacionamiento:** ${parkingSpaces || 0}
**Baños:** ${bathrooms || 1}
**Estado de Conservación:** ${buildingCondition}
**Uso Actual:** ${currentUse || "No especificado"}
**Características:** ${features.join(", ") || "Ninguna especificada"}
**Notas:** ${notes || "Sin notas adicionales"}

**Datos de Valuación Calculados:**
- Valor de Mercado: $${marketValue.toLocaleString("es-MX")} USD
- Precio por m²: $${pricePerSqm.toLocaleString("es-MX")} USD
- Renta Mensual Estimada: $${rentalValue.toLocaleString("es-MX")} USD
- Cap Rate: ${capRate}%
- Confianza: ${(confidence * 100).toFixed(0)}%

Genera tu respuesta EXACTAMENTE en el siguiente formato JSON (sin texto adicional, solo el JSON):

{
  "aiAnalysis": "... (análisis de 3-4 párrafos sobre la propiedad, ubicación, mercado, y valor)",
  "recommendations": "... (5 recomendaciones numeradas)",
  "riskFactors": [
    {"factor": "nombre del riesgo", "level": "LOW|MEDIUM|HIGH", "description": "descripción del riesgo"}
  ],
  "comparables": [
    {"name": "nombre", "address": "dirección", "area": número, "price": número, "pricePerSqm": número, "similarity": número entre 0.7 y 0.98}
  ],
  "valuationMethod": "HIBRIDO|COMPARABLE|INGRESO|COSTO"
}

Incluye 3-4 propiedades comparables realistas para la zona de ${city}, ${state}. El análisis debe ser en español, profesional y detallado.`;

    let aiResponse;
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content: "Eres un valuador profesional mexicano. Siempre respondes en formato JSON válido.",
          },
          {
            role: "user",
            content: aiPrompt,
          },
        ],
        thinking: { type: "disabled" },
      });

      const raw = completion.choices[0]?.message?.content || "";

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (aiError) {
      // Fallback if AI fails
      console.error("AI analysis failed, using fallback:", aiError);
      aiResponse = {
        aiAnalysis: `La propiedad "${name}" ubicada en ${city}, ${state}, presenta un valor de mercado estimado de $${marketValue.toLocaleString("es-MX")} USD, basado en un análisis de comparables de mercado y las características físicas del inmueble.

Con un área de ${totalArea.toLocaleString()} m² y un estado de conservación ${buildingCondition}, la propiedad se posiciona dentro del segmento ${propertyType === "OFICINA" ? "clase A" : "intermedio"} del mercado comercial de ${city}. El precio por metro cuadrado de $${pricePerSqm.toLocaleString("es-MX")} se encuentra ${pricePerSqm > market.avgPricePerSqm ? "por arriba" : "dentro"} del rango promedio para el tipo de propiedad.

La ubicación en ${city} ofrece acceso a infraestructura urbana y servicios complementarios que impactan positivamente en el valor comercial del activo.`,
        recommendations: `1. Se recomienda realizar una inspección física detallada para validar el estado estructural y de acabados.
2. Considerar la depreciación funcional del inmueble según su año de construcción.
3. Evaluar las condiciones del mercado local y comparar con transacciones recientes en un radio de 2km.
4. Revisar los usos de suelo vigentes y el potencial de desarrollo del predio.
5. Actualizar la valuación cada 6 meses para reflejar las condiciones dinámicas del mercado.`,
        riskFactors: [
          { factor: "Condiciones del mercado", level: "MEDIUM", description: "El mercado comercial presenta fluctuaciones que pueden afectar el valor a corto plazo" },
          { factor: "Obsolescencia", level: "LOW", description: "Considerar el impacto de la antigüedad en la funcionalidad del inmueble" },
          { factor: "Regulación", level: "LOW", description: "Cambios en normativas locales podrían impactar el uso o desarrollo de la propiedad" },
        ],
        comparables: [
          { name: "Centro Empresarial Norte", address: `Blvd. Principal 120, ${city}`, area: Math.round(totalArea * 0.9), price: Math.round(marketValue * 0.88), pricePerSqm: Math.round(pricePerSqm * 0.96), similarity: 0.88 },
          { name: "Plaza Comercial Sur", address: `Av. Central 340, ${city}`, area: Math.round(totalArea * 1.1), price: Math.round(marketValue * 1.05), pricePerSqm: Math.round(pricePerSqm * 1.02), similarity: 0.82 },
          { name: "Edificio Corporativo Centro", address: `Calle Principal 80, ${city}`, area: Math.round(totalArea * 0.8), price: Math.round(marketValue * 0.78), pricePerSqm: Math.round(pricePerSqm * 0.94), similarity: 0.76 },
        ],
        valuationMethod: "HIBRIDO",
      };
    }

    // 3. Build response
    const result = {
      marketValue,
      pricePerSqm,
      rentalValue,
      capRate,
      confidence: Math.round(confidence * 100) / 100,
      method: aiResponse.valuationMethod || "HIBRIDO",
      comparables: aiResponse.comparables || [],
      aiAnalysis: aiResponse.aiAnalysis || "",
      recommendations: aiResponse.recommendations || "",
      riskFactors: aiResponse.riskFactors || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Valuation error:", error);
    return NextResponse.json(
      { error: "Error al generar la valuación" },
      { status: 500 }
    );
  }
}
