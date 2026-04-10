import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, valuations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Sort valuations per property
    const sorted = (properties || []).map((p) => ({
      ...p,
      valuations: (p.valuations || [])
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        ),
    }));

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Error al obtener propiedades" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      country = "DO",
      city,
      state,
      zipCode,
      propertyType,
      totalArea,
      constructedArea,
      lotArea,
      floors,
      yearBuilt,
      parkingSpaces,
      bathrooms,
      currentUse,
      buildingCondition,
      features,
      notes,
      status = "BORRADOR",
      coordinates,
    } = body;

    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !propertyType ||
      !totalArea
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        name,
        address,
        country,
        city,
        state,
        zip_code: zipCode,
        property_type: propertyType,
        total_area: parseFloat(totalArea),
        constructed_area: constructedArea
          ? parseFloat(constructedArea)
          : null,
        lot_area: lotArea ? parseFloat(lotArea) : null,
        floors: parseInt(floors) || 1,
        year_built: yearBuilt ? parseInt(yearBuilt) : null,
        parking_spaces: parseInt(parkingSpaces) || 0,
        bathrooms: parseInt(bathrooms) || 1,
        current_use: currentUse,
        building_condition: buildingCondition,
        features: features || [],
        notes,
        status,
        coordinates,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        ...property,
        // Map snake_case back to camelCase for frontend compatibility
        zipCode: property.zip_code,
        propertyType: property.property_type,
        totalArea: property.total_area,
        constructedArea: property.constructed_area,
        lotArea: property.lot_area,
        parkingSpaces: property.parking_spaces,
        yearBuilt: property.year_built,
        currentUse: property.current_use,
        buildingCondition: property.building_condition,
        imageUrl: property.image_url,
        imageUrls: property.image_urls,
        createdAt: property.created_at,
        updatedAt: property.updated_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Error al crear la propiedad" },
      { status: 500 },
    );
  }
}
