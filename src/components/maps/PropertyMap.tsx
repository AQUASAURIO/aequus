"use client";

import { useState, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Layers, RotateCcw, MapPin, Building2, Satellite, Map, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, propertyTypeLabels, propertyTypeColors } from "@/lib/types";
import type { PropertyType } from "@/lib/types";
import { TILE_LAYERS, DEFAULT_TILE_LAYER, type TileLayerType } from "@/lib/map-tiles";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

// Custom marker icon using a colored circle
function createCustomIcon(type: PropertyType): L.DivIcon {
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-pin" style="background: ${getMarkerColor(type)}">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div><div class="marker-shadow"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -45],
  });
}

function getMarkerColor(type: PropertyType): string {
  const colorMap: Record<PropertyType, string> = {
    OFICINA: "#10b981",
    RETAIL: "#f59e0b",
    INDUSTRIAL: "#64748b",
    BODEGA: "#f97316",
    TERRENO: "#84cc16",
    MIXTO: "#a855f7",
    HOTEL: "#f43f5e",
    RESTAURANTE: "#06b6d4",
  };
  return colorMap[type] || "#10b981";
}

// Heat color based on price (green -> yellow -> red)
function getHeatColor(price: number): string {
  const min = 15000000;
  const max = 65000000;
  const ratio = Math.min(Math.max((price - min) / (max - min), 0), 1);
  if (ratio < 0.33) return "#22c55e";
  if (ratio < 0.66) return "#eab308";
  return "#ef4444";
}

function getHeatRadius(price: number): number {
  const min = 15000000;
  const max = 65000000;
  const ratio = Math.min(Math.max((price - min) / (max - min), 0), 1);
  return 15000 + ratio * 35000; // Meters
}

// Component to programmatically control the map
function MapController({ center, zoom }: { center: L.LatLngExpression; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Component to reset view to fit all markers
function FitBoundsController({
  positions,
  trigger,
}: {
  positions: [number, number][];
  trigger: number;
}) {
  const map = useMap();
  if (positions.length > 0) {
    const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
  return null;
}

export interface MapProperty {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: PropertyType;
  city: string;
  address?: string;
  price?: number;
}

const defaultProperties: MapProperty[] = [
  { id: "1", name: "Torre Cisneros", lat: 18.4647, lng: -69.9131, type: "OFICINA", city: "Santo Domingo", address: "Av. Winston Churchill 45", price: 45000000 },
  { id: "2", name: "Plaza Lama Central", lat: 18.4555, lng: -69.9447, type: "RETAIL", city: "Santo Domingo", address: "Av. Independencia 302", price: 28000000 },
  { id: "3", name: "Zona Franca Santiago", lat: 19.4517, lng: -70.693, type: "INDUSTRIAL", city: "Santiago", address: "Autopista Duarte Km 5", price: 35000000 },
  { id: "4", name: "Bodega Haina", lat: 18.4156, lng: -70.0403, type: "BODEGA", city: "San Cristóbal", address: "Km 22 Carretera Sánchez", price: 22000000 },
  { id: "5", name: "Hotel Barceló Bávaro", lat: 18.5833, lng: -68.3667, type: "HOTEL", city: "Higüey", address: "Bávaro, Punta Cana", price: 65000000 },
  { id: "6", name: "Plaza Megacentro", lat: 18.5017, lng: -69.8647, type: "RETAIL", city: "Santo Domingo", address: "Av. Charles de Gaulle", price: 52000000 },
  { id: "7", name: "Centro de Los Héroes", lat: 18.4564, lng: -69.9373, type: "OFICINA", city: "Santo Domingo", address: "Av. George Washington 500", price: 38000000 },
  { id: "8", name: "Terreno Punta Cana", lat: 18.55, lng: -68.37, type: "TERRENO", city: "Higüey", address: "Verón, Punta Cana", price: 18000000 },
];

const RD_CENTER: [number, number] = [18.7357, -70.1627];
const DEFAULT_ZOOM = 8;

interface PropertyMapProps {
  properties?: MapProperty[];
  height?: string;
  showHeatToggle?: boolean;
  showSearch?: boolean;
  showResetView?: boolean;
  showLayerToggle?: boolean;
  onPropertyClick?: (property: MapProperty) => void;
}

export default function PropertyMap({
  properties = defaultProperties,
  height = "h-[400px]",
  showHeatToggle = true,
  showSearch = true,
  showResetView = true,
  showLayerToggle = true,
  onPropertyClick,
}: PropertyMapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showHeat, setShowHeat] = useState(false);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [tileLayer, setTileLayer] = useState<TileLayerType>(DEFAULT_TILE_LAYER);

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        p.type.toLowerCase().includes(q)
    );
  }, [properties, searchQuery]);

  const allPositions = useMemo(
    () => properties.map((p) => [p.lat, p.lng] as [number, number]),
    [properties]
  );

  const handleResetView = useCallback(() => {
    setFitTrigger((prev) => prev + 1);
  }, []);

  const tileButtons: { id: TileLayerType; label: string; icon: typeof Satellite }[] = [
    { id: "satellite", label: "Satélite", icon: Satellite },
    { id: "streets", label: "Calles", icon: Map },
    { id: "terrain", label: "Terreno", icon: Mountain },
  ];

  return (
    <div className={`relative ${height} w-full rounded-lg overflow-hidden`}>
      {/* Custom CSS for markers */}
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid white;
        }
        .marker-pin svg {
          transform: rotate(45deg);
        }
        .marker-shadow {
          width: 20px;
          height: 6px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          margin: 2px auto 0;
          filter: blur(1px);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 220px;
        }
        .leaflet-popup-tip {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
        }
        .map-popup-card {
          font-family: inherit;
        }
        .map-popup-card .popup-header {
          background: linear-gradient(135deg, oklch(0.408 0.12 163), oklch(0.55 0.14 163));
          color: white;
          padding: 12px 14px;
          border-radius: 12px 12px 0 0;
        }
        .map-popup-card .popup-header h3 {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.3;
          margin: 0;
        }
        .map-popup-card .popup-body {
          padding: 10px 14px;
          background: white;
          border-radius: 0 0 12px 12px;
        }
        .map-popup-card .popup-body .popup-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .map-popup-card .popup-body .popup-row:last-child {
          margin-bottom: 0;
        }
        .map-popup-card .popup-body .popup-price {
          font-size: 15px;
          font-weight: 800;
          color: oklch(0.408 0.12 163);
          margin-top: 6px;
          margin-bottom: 2px;
        }
        .map-popup-card .popup-body .popup-badge {
          display: inline-block;
          padding: 1px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 600;
          margin-top: 6px;
        }
      `}</style>

      {/* Map */}
      <MapContainer
        center={RD_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <ActiveTileLayer layerId={tileLayer} />

        <FitBoundsController positions={allPositions} trigger={fitTrigger} />

        {/* Property Markers */}
        {filteredProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            icon={createCustomIcon(property.type)}
            eventHandlers={{
              click: () => {
                if (onPropertyClick) onPropertyClick(property);
              },
            }}
          >
            <Popup>
              <div className="map-popup-card">
                <div className="popup-header">
                  <h3>{property.name}</h3>
                </div>
                <div className="popup-body">
                  <div className="popup-row">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {property.city}{property.address ? `, ${property.address}` : ""}
                  </div>
                  <div className="popup-row">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    {property.type}
                  </div>
                  {property.price !== undefined && (
                    <>
                      <div className="popup-price">{formatCurrency(property.price)}</div>
                      <span
                        className="popup-badge"
                        style={{
                          background: getMarkerColor(property.type) + "20",
                          color: getMarkerColor(property.type),
                        }}
                      >
                        {propertyTypeLabels[property.type]}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Heat Layer */}
        {showHeat &&
          filteredProperties
            .filter((p) => p.price !== undefined)
            .map((property) => (
              <CircleMarker
                key={`heat-${property.id}`}
                center={[property.lat, property.lng]}
                radius={getHeatRadius(property.price!)}
                pathOptions={{
                  color: getHeatColor(property.price!),
                  fillColor: getHeatColor(property.price!),
                  fillOpacity: 0.2,
                  weight: 1,
                }}
                interactive={false}
              />
            ))}
      </MapContainer>

      {/* Search Bar Overlay */}
      {showSearch && (
        <div className="absolute top-3 left-3 right-3 z-10 sm:right-auto sm:w-72">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar propiedades..."
              className="h-9 bg-background/95 backdrop-blur-sm pl-9 pr-3 shadow-md border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
        {/* Layer Toggle */}
        {showLayerToggle && (
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
        )}

        {showHeatToggle && (
          <Button
            size="sm"
            variant={showHeat ? "default" : "secondary"}
            className="h-9 bg-background/95 backdrop-blur-sm shadow-md border border-border hover:bg-background/100 text-foreground gap-1.5"
            onClick={() => setShowHeat(!showHeat)}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{showHeat ? "Ocultar Calor" : "Capa Calor"}</span>
          </Button>
        )}

        {showResetView && (
          <Button
            size="sm"
            variant="secondary"
            className="h-9 bg-background/95 backdrop-blur-sm shadow-md border border-border hover:bg-background/100 text-foreground gap-1.5"
            onClick={handleResetView}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Restablecer</span>
          </Button>
        )}
      </div>

      {/* Property Count Badge */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-md px-2.5 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">{filteredProperties.length}</span>
          <span className="text-xs text-muted-foreground">propiedades</span>
        </div>
      </div>

      {/* Heat Legend */}
      {showHeat && (
        <div className="absolute top-3 right-3 z-10 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-lg px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Nivel de Precio
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Bajo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-muted-foreground">Medio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Alto</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
