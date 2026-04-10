import { NextResponse } from "next/server";

// In-memory settings (resets on server restart — sufficient for MVP)
const settings: Record<string, string | boolean> = {
  appVersion: "1.0.0-mvp",
  mapsProvider: "openstreetmap",
};

export async function GET() {
  return NextResponse.json({
    appVersion: settings.appVersion,
    mapsProvider: settings.mapsProvider,
    features: {
      satelliteImagery: true,
      terrainView: true,
      streetView: true,
      geocoding: true,
      reverseGeocoding: true,
      csvImport: true,
      csvExport: true,
      pdfExport: true,
      aiValuation: true,
    },
  });
}
