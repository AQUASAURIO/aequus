"use client";

import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { RotateCcw, Info, Satellite, Map, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/types";
import { TILE_LAYERS, DEFAULT_TILE_LAYER, type TileLayerType } from "@/lib/map-tiles";

// ── Tile layer switcher ────────────────────────────────────────────────────

function ActiveTileLayer({ layerId }: { layerId: TileLayerType }) {
  const config = TILE_LAYERS[layerId];
  return (
    <TileLayer
      key={layerId}
      url={config.url}
      attribution={config.attribution}
      maxZoom={config.maxZoom}
    />
  );
}

// Heat color interpolation: green -> yellow -> red based on avg price
function getZoneColor(avgPrice: number): string {
  if (avgPrice <= 20000000) return "#22c55e";
  if (avgPrice <= 30000000) return "#84cc16";
  if (avgPrice <= 40000000) return "#eab308";
  if (avgPrice <= 50000000) return "#f97316";
  return "#ef4444";
}

function getZoneLabel(avgPrice: number): string {
  if (avgPrice <= 20000000) return "Bajo";
  if (avgPrice <= 30000000) return "Medio-Bajo";
  if (avgPrice <= 40000000) return "Medio";
  if (avgPrice <= 50000000) return "Medio-Alto";
  return "Alto";
}

function getZoneColorOpacity(avgPrice: number): number {
  if (avgPrice <= 20000000) return 0.25;
  if (avgPrice <= 30000000) return 0.30;
  if (avgPrice <= 40000000) return 0.35;
  if (avgPrice <= 50000000) return 0.40;
  return 0.45;
}

// Market zone data — aggregated by city (Dominican Republic)
interface MarketZone {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  properties: number;
  avgPrice: number;
  totalVolume: number;
  topType: string;
  priceChange: number;
}

const marketZones: MarketZone[] = [
  {
    id: "sdq",
    city: "Santo Domingo",
    state: "DN",
    lat: 18.47,
    lng: -69.91,
    properties: 14,
    avgPrice: 42000000,
    totalVolume: 588000000,
    topType: "OFICINA",
    priceChange: 7.8,
  },
  {
    id: "sti",
    city: "Santiago",
    state: "STI",
    lat: 19.45,
    lng: -70.69,
    properties: 8,
    avgPrice: 32000000,
    totalVolume: 256000000,
    topType: "INDUSTRIAL",
    priceChange: 9.2,
  },
  {
    id: "ppc",
    city: "Puerto Plata",
    state: "PPT",
    lat: 19.79,
    lng: -70.69,
    properties: 5,
    avgPrice: 25000000,
    totalVolume: 125000000,
    topType: "HOTEL",
    priceChange: 11.5,
  },
  {
    id: "hig",
    city: "La Altagracia",
    state: "LAR",
    lat: 18.60,
    lng: -68.55,
    properties: 10,
    avgPrice: 55000000,
    totalVolume: 550000000,
    topType: "HOTEL",
    priceChange: 14.3,
  },
  {
    id: "spn",
    city: "San Pedro de Macorís",
    state: "SPM",
    lat: 18.45,
    lng: -69.31,
    properties: 4,
    avgPrice: 20000000,
    totalVolume: 80000000,
    topType: "RETAIL",
    priceChange: 5.1,
  },
  {
    id: "lrm",
    city: "La Romana",
    state: "LR",
    lat: 18.43,
    lng: -68.96,
    properties: 6,
    avgPrice: 38000000,
    totalVolume: 228000000,
    topType: "HOTEL",
    priceChange: 8.6,
  },
  {
    id: "lvg",
    city: "La Vega",
    state: "LVE",
    lat: 19.22,
    lng: -70.53,
    properties: 5,
    avgPrice: 18000000,
    totalVolume: 90000000,
    topType: "TERRENO",
    priceChange: 6.4,
  },
  {
    id: "sc",
    city: "San Cristóbal",
    state: "SC",
    lat: 18.42,
    lng: -70.13,
    properties: 6,
    avgPrice: 22000000,
    totalVolume: 132000000,
    topType: "BODEGA",
    priceChange: 7.1,
  },
];

// Circle radius based on number of transactions
function getTransactionRadius(properties: number): number {
  return 15000 + properties * 8000; // Meters
}

function FitBoundsController({ trigger }: { trigger: number }) {
  const map = useMap();
  const [hasInitialFit, setHasInitialFit] = useState(false);

  useEffect(() => {
    // Only fit bounds if explicitly triggered or for the very first time
    if (trigger > 0 || !hasInitialFit) {
      const bounds = L.latLngBounds(
        marketZones.map((z) => L.latLng(z.lat, z.lng))
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      setHasInitialFit(true);
    }
  }, [trigger, map, hasInitialFit]);

  return null;
}

const RD_CENTER: [number, number] = [18.7357, -70.1627];

interface MarketHeatmapProps {
  height?: string;
  className?: string;
}

export default function MarketHeatmap({
  height = "h-[400px]",
  className,
}: MarketHeatmapProps) {
  const [fitTrigger, setFitTrigger] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const [tileLayer, setTileLayer] = useState<TileLayerType>(DEFAULT_TILE_LAYER);

  const handleResetView = useCallback(() => {
    setFitTrigger((prev) => prev + 1);
  }, []);

  const tileButtons: { id: TileLayerType; label: string; icon: typeof Satellite }[] = [
    { id: "satellite", label: "Satélite", icon: Satellite },
    { id: "streets", label: "Calles", icon: Map },
    { id: "terrain", label: "Terreno", icon: Mountain },
  ];

  return (
    <div className={`relative ${height} w-full rounded-lg overflow-hidden ${className || ""}`}>
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 240px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
        }
        .heat-popup-card {
          font-family: inherit;
        }
        .heat-popup-card .popup-header {
          padding: 10px 14px;
          border-radius: 12px 12px 0 0;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .heat-popup-card .popup-header h3 {
          font-size: 13px;
          font-weight: 700;
          margin: 0;
        }
        .heat-popup-card .popup-body {
          padding: 10px 14px 12px;
          background: white;
          border-radius: 0 0 12px 12px;
        }
        .heat-popup-card .popup-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          font-size: 12px;
        }
        .heat-popup-card .popup-metric .label {
          color: #64748b;
        }
        .heat-popup-card .popup-metric .value {
          font-weight: 600;
          color: #1e293b;
        }
        .heat-popup-card .popup-metric .value.change-positive {
          color: #16a34a;
        }
      `}</style>

      <MapContainer
        center={RD_CENTER}
        zoom={8}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
      >
        <ActiveTileLayer layerId={tileLayer} />

        <FitBoundsController trigger={fitTrigger} />

        {/* Market Zone Heat Circles */}
        {marketZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={getTransactionRadius(zone.properties)}
            pathOptions={{
              color: getZoneColor(zone.avgPrice),
              fillColor: getZoneColor(zone.avgPrice),
              fillOpacity: getZoneColorOpacity(zone.avgPrice),
              weight: 2,
            }}
          >
            <Popup>
              <div className="heat-popup-card">
                <div
                  className="popup-header"
                  style={{ background: getZoneColor(zone.avgPrice) }}
                >
                  <h3>{zone.city}</h3>
                  <span className="text-[10px] font-medium opacity-90">{zone.state}</span>
                </div>
                <div className="popup-body">
                  <div className="popup-metric">
                    <span className="label">Precio Promedio</span>
                    <span className="value">{formatCurrency(zone.avgPrice)}</span>
                  </div>
                  <div className="popup-metric">
                    <span className="label">Transacciones</span>
                    <span className="value">{zone.properties}</span>
                  </div>
                  <div className="popup-metric">
                    <span className="label">Volumen Total</span>
                    <span className="value">{formatCurrency(zone.totalVolume)}</span>
                  </div>
                  <div className="popup-metric">
                    <span className="label">Tipo Principal</span>
                    <span className="value">{zone.topType}</span>
                  </div>
                  <div className="popup-metric">
                    <span className="label">Variación</span>
                    <span className="value change-positive">
                      +{zone.priceChange}%
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      {/* Reset View Button */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer Toggle */}
        <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-lg p-1">
          {tileButtons.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={tileLayer === id ? "default" : "ghost"}
              className={`h-7 px-2 gap-1.5 text-[10px] ${tileLayer === id ? "shadow-sm" : ""}`}
              onClick={() => setTileLayer(id)}
              title={label}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="secondary"
          className="h-9 bg-background/95 backdrop-blur-sm shadow-md border border-border hover:bg-background/100 text-foreground gap-1.5"
          onClick={handleResetView}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Restablecer</span>
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-lg px-3.5 py-3">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Calor del Mercado
          </p>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Price Level Legend */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-[11px] text-muted-foreground">Bajo</span>
            </div>
            <span className="text-[10px] text-muted-foreground">≤$20M</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-lime-500" />
              <span className="text-[11px] text-muted-foreground">Medio-Bajo</span>
            </div>
            <span className="text-[10px] text-muted-foreground">$20-30M</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-[11px] text-muted-foreground">Medio</span>
            </div>
            <span className="text-[10px] text-muted-foreground">$30-40M</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-[11px] text-muted-foreground">Medio-Alto</span>
            </div>
            <span className="text-[10px] text-muted-foreground">$40-50M</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-[11px] text-muted-foreground">Alto</span>
            </div>
            <span className="text-[10px] text-muted-foreground">&gt;$50M</span>
          </div>
        </div>

        {/* Size Legend */}
        <div className="border-t pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Tamaño del Círculo
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground">Pocas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
              <span className="text-[10px] text-muted-foreground">Muchas</span>
            </div>
            <span className="text-[10px] text-muted-foreground">transacciones</span>
          </div>
        </div>
      </div>

      {/* Zone count */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-md px-2.5 py-1.5">
          <div className="h-3 w-3 rounded-full bg-primary/30" />
          <span className="text-xs font-medium">{marketZones.length}</span>
          <span className="text-xs text-muted-foreground">zonas de mercado</span>
        </div>
      </div>
    </div>
  );
}
