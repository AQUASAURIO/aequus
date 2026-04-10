import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache (120-second TTL for search results)
const cache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL_MS = 120_000;

function getCached(key: string): Record<string, unknown> | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: Record<string, unknown>) {
  if (cache.size > 200) {
    for (const [k, v] of cache.entries()) {
      if (Date.now() - v.ts >= CACHE_TTL_MS) cache.delete(k);
    }
  }
  cache.set(key, { data, ts: Date.now() });
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "El parámetro 'q' es requerido (mínimo 2 caracteres)" },
      { status: 400 },
    );
  }

  const q = query.trim();

  // Check cache
  const cacheKey = `geocode:${q.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // ── Nominatim Search (OpenStreetMap) ──────────────────────────────────
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "es");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Æquo/1.0 (valiation-platform)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al conectar con el servicio de geocodificación" },
        { status: 502 },
      );
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      const emptyResult = {
        results: [],
        query: q,
        source: "nominatim",
        message: "No se encontraron resultados para esta búsqueda",
      };
      setCache(cacheKey, emptyResult);
      return NextResponse.json(emptyResult);
    }

    // Format results for the app
    const formatted = results.map((r) => ({
      placeId: r.place_id,
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      address: r.address?.road || "",
      city: r.address?.city || r.address?.town || "",
      state: r.address?.state || "",
      postcode: r.address?.postcode || "",
      country: r.address?.country || "",
      confidence: 0.85,
    }));

    const result = {
      results: formatted,
      query: q,
      source: "nominatim",
      total: formatted.length,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor de geocodificación" },
      { status: 500 },
    );
  }
}
