import { NextRequest, NextResponse } from "next/server";

// Dominican Republic province name → abbreviation
const stateAbbreviations: Record<string, string> = {
  "distrito nacional": "DN",
  "santo domingo": "SD",
  "santiago": "STI",
  "la vega": "LVE",
  "san pedro de macorís": "SPM",
  "puerto plata": "PPT",
  "la romana": "LR",
  "san cristóbal": "SC",
  "duarte": "DUA",
  "espaillat": "ESP",
  "monseñor nouel": "MNO",
  "maría trinidad sánchez": "MTS",
  "barahona": "BAR",
  "azua": "AZU",
  "monte cristi": "MTC",
  "peravia": "PER",
  "samaná": "SAM",
  "monte plata": "MPL",
  "hato mayor": "HMA",
  "el seibo": "ES",
  "hermanas mirabal": "HMI",
  "la altagracia": "LAR",
  "bahoruco": "BAH",
  "dajabón": "DAJ",
  "elías piña": "EPI",
  "independencia": "INP",
  "pedernales": "PED",
  "sánchez ramírez": "SRA",
  "san juan": "SJ",
  "san josé de ocoa": "SJO",
  "santiago rodríguez": "SRO",
  "valverde": "VAL",
};

// Simple in-memory cache (60-second TTL)
const cache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL_MS = 60_000;

function getCached(key: string): Record<string, unknown> | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: Record<string, unknown>) {
  // Evict expired entries
  if (cache.size > 200) {
    for (const [k, v] of cache.entries()) {
      if (Date.now() - v.ts >= CACHE_TTL_MS) cache.delete(k);
    }
  }
  cache.set(key, { data, ts: Date.now() });
}

function abbreviateState(raw: string): string {
  const key = raw.toLowerCase().trim();
  return stateAbbreviations[key] ?? raw.toUpperCase().slice(0, 3);
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  municipality?: string;
  county?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
  lat?: string;
  lon?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Parámetros 'lat' y 'lng' son requeridos" },
      { status: 400 },
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json(
      { error: "'lat' y 'lng' deben ser números válidos" },
      { status: 400 },
    );
  }

  // Check cache
  const cacheKey = `${latNum.toFixed(5)},${lngNum.toFixed(5)}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lngNum}&format=json&addressdetails=1&accept-language=es`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Æquo/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      // Return a minimal fallback
      const fallback = {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        fullAddress: `${latNum}, ${lngNum}`,
        neighborhood: "",
        country: "",
        lat: latNum,
        lng: lngNum,
      };
      return NextResponse.json(fallback);
    }

    const data: NominatimResponse = await response.json();

    if (!data.address) {
      const fallback = {
        address: "",
        city: "",
        state: "",
        zipCode: "",
        fullAddress: data.display_name ?? `${latNum}, ${lngNum}`,
        neighborhood: "",
        country: "",
        lat: latNum,
        lng: lngNum,
      };
      return NextResponse.json(fallback);
    }

    const addr = data.address;

    // Build the street address (road + house_number)
    const parts: string[] = [];
    if (addr.road) parts.push(addr.road);
    if (addr.house_number) {
      // In Dominican addresses the number often comes before the street
      if (addr.road && !addr.road.startsWith(addr.house_number)) {
        parts.push(addr.house_number);
      }
    }
    if (addr.suburb) parts.push(addr.suburb);

    const streetAddress = parts.join(", ");

    // City-level: city > town > village > municipality
    const city =
      addr.city || addr.town || addr.village || addr.municipality || "";

    // State abbreviation
    const rawState = addr.state || "";
    const state = rawState ? abbreviateState(rawState) : "";

    // Postal code
    const zipCode = addr.postcode || "";

    // Neighborhood (colonia)
    const neighborhood =
      addr.neighbourhood || addr.suburb || addr.county || "";

    // Full display name from Nominatim
    const fullAddress = data.display_name || "";

    // Country detection
    const country = addr.country || "";

    const result = {
      address: streetAddress,
      city,
      state,
      zipCode,
      fullAddress,
      neighborhood,
      country,
      lat: latNum,
      lng: lngNum,
    };

    // Cache the result
    setCache(cacheKey, result);

    return NextResponse.json(result);
  } catch {
    const fallback = {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      fullAddress: `${latNum}, ${lngNum}`,
      neighborhood: "",
      country: "",
      lat: latNum,
      lng: lngNum,
    };
    return NextResponse.json(fallback);
  }
}
