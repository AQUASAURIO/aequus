"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, X, Loader2, MapPin, Navigation, Satellite, Map, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TILE_LAYERS, DEFAULT_TILE_LAYER, type TileLayerType } from "@/lib/map-tiles";

// ── Types ───────────────────────────────────────────────────────────────────

export interface MapPickerLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;
  fullAddress: string;
  neighborhood?: string;
  country?: string;
}

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface MapPickerProps {
  onLocationSelect: (data: MapPickerLocation) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  height?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const RD_CENTER: [number, number] = [18.7357, -70.1627];
const DEFAULT_ZOOM = 8;

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

// ── Custom emerald pin icon ─────────────────────────────────────────────────

function createPickerIcon(): L.DivIcon {
  return L.divIcon({
    className: "picker-marker",
    html: `
      <div class="picker-pulse"></div>
      <div class="picker-pin">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="picker-shadow"></div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  });
}

// ── Map click handler component ─────────────────────────────────────────────

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Map fly-to controller ──────────────────────────────────────────────────

function FlyToController({
  lat,
  lng,
  zoom,
  trigger,
}: {
  lat: number;
  lng: number;
  zoom: number;
  trigger: number;
}) {
  const map = useMapEvents({});
  useEffect(() => {
    if (trigger > 0) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }, [trigger, lat, lng, zoom, map]);
  return null;
}

// ── Search result item ─────────────────────────────────────────────────────

function SearchResultItem({
  result,
  onSelect,
}: {
  result: NominatimSearchResult;
  onSelect: (r: NominatimSearchResult) => void;
}) {
  const addr = result.address;
  const label = [
    addr?.road,
    addr?.house_number,
  ]
    .filter(Boolean)
    .join(" ") || result.display_name.split(",").slice(0, 2).join(",").trim();

  const detail = [
    addr?.suburb || addr?.neighbourhood,
    addr?.city || addr?.town,
    addr?.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      className="w-full text-left px-3 py-2.5 hover:bg-muted/80 transition-colors border-b border-border last:border-b-0 flex items-start gap-2"
      onClick={() => onSelect(result)}
    >
      <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {detail && (
          <p className="text-xs text-muted-foreground truncate">{detail}</p>
        )}
      </div>
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress,
  height = "h-[400px]",
}: MapPickerProps) {
  const [selectedPos, setSelectedPos] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      return { lat: initialLat, lng: initialLng };
    }
    return null;
  });

  const [locationData, setLocationData] = useState<MapPickerLocation | null>(
    () => {
      if (initialLat !== undefined && initialLng !== undefined && initialAddress) {
        return {
          address: initialAddress,
          city: "",
          state: "",
          zipCode: "",
          lat: initialLat,
          lng: initialLng,
          fullAddress: initialAddress,
        };
      }
      return null;
    },
  );

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>(RD_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [tileLayer, setTileLayer] = useState<TileLayerType>(DEFAULT_TILE_LAYER);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close search results on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Reverse geocode a position ──────────────────────────────────────────

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${lat}&lng=${lng}`,
        );
        if (!res.ok) throw new Error("Reverse geocode failed");
        const data: MapPickerLocation = await res.json();
        setLocationData(data);
        onLocationSelect(data);
      } catch {
        const fallback: MapPickerLocation = {
          address: "",
          city: "",
          state: "",
          zipCode: "",
          lat,
          lng,
          fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        };
        setLocationData(fallback);
        onLocationSelect(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [onLocationSelect],
  );

  // ── Handle map click ───────────────────────────────────────────────────

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setSelectedPos({ lat, lng });
      setShowResults(false);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  // ── Handle marker drag end ─────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const pos = e.target.getLatLng();
      setSelectedPos({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    },
    [reverseGeocode],
  );

  // ── Search addresses via Nominatim ──────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=do,mx,co,pa,gt,pe,ar,es,us&addressdetails=1&accept-language=es`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Æquo/1.0" },
      });
      if (!res.ok) throw new Error("Search failed");
      const data: NominatimSearchResult[] = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch {
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // ── Select a search result ─────────────────────────────────────────────

  const handleSelectResult = useCallback(
    (result: NominatimSearchResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      setSelectedPos({ lat, lng });
      setMapCenter([lat, lng]);
      setMapZoom(16);
      setFlyTrigger((prev) => prev + 1);
      setShowResults(false);
      setSearchQuery(result.display_name.split(",").slice(0, 2).join(",").trim());

      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  // ── Clear selection ────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setSelectedPos(null);
    setLocationData(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setMapCenter(RD_CENTER);
    setMapZoom(DEFAULT_ZOOM);
    setFlyTrigger((prev) => prev + 1);
  }, []);

  // ── Handle search input change (debounced search on Enter) ─────────────

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      if (e.key === "Escape") {
        setShowResults(false);
      }
    },
    [handleSearch],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setShowResults(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (e.target.value.trim().length >= 3) {
        searchTimeoutRef.current = setTimeout(() => {
          handleSearch();
        }, 800);
      }
    },
    [handleSearch],
  );

  const hasLocation = locationData && selectedPos;

  // Tile layer toggle buttons
  const tileButtons: { id: TileLayerType; label: string; icon: typeof Satellite }[] = [
    { id: "satellite", label: "Satélite", icon: Satellite },
    { id: "streets", label: "Calles", icon: Map },
    { id: "terrain", label: "Terreno", icon: Mountain },
  ];

  return (
    <div className="space-y-3">
      {/* Map Container */}
      <div className={`relative ${height} w-full rounded-lg overflow-hidden border border-border`}>
        {/* Custom marker CSS */}
        <style jsx global>{`
          .picker-marker {
            background: transparent !important;
            border: none !important;
          }
          .picker-pin {
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            background: #059669;
            box-shadow: 0 3px 14px rgba(5, 150, 105, 0.45);
            border: 2.5px solid white;
            position: relative;
            z-index: 2;
          }
          .picker-pin svg {
            transform: rotate(45deg);
          }
          .picker-shadow {
            width: 18px;
            height: 6px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 50%;
            margin: 2px auto 0;
            filter: blur(1px);
            position: relative;
            z-index: 1;
          }
          .picker-pulse {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(5, 150, 105, 0.2);
            top: -2px;
            left: -2px;
            z-index: 0;
            animation: picker-pulse-anim 2s ease-out infinite;
          }
          @keyframes picker-pulse-anim {
            0% { transform: scale(0.5); opacity: 0.7; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .picker-search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: hsl(var(--background));
            border: 1px solid hsl(var(--border));
            border-radius: 0.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
            max-height: 240px;
            overflow-y: auto;
            z-index: 20;
          }
        `}</style>

        {/* Search Bar */}
        <div ref={searchRef} className="absolute top-3 left-3 right-3 z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar dirección..."
              className="h-9 bg-background/95 backdrop-blur-sm pl-9 pr-9 shadow-md border-0 focus-visible:ring-1"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="picker-search-results">
                {searchResults.map((result) => (
                  <SearchResultItem
                    key={result.place_id}
                    result={result}
                    onSelect={handleSelectResult}
                  />
                ))}
                {searchResults.length === 0 && isLoading && (
                  <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="h-full w-full"
          zoomControl={false}
          scrollWheelZoom={true}
        >
          <ActiveTileLayer layerId={tileLayer} />

          <ClickHandler onClick={handleMapClick} />

          <FlyToController
            lat={mapCenter[0]}
            lng={mapCenter[1]}
            zoom={mapZoom}
            trigger={flyTrigger}
          />

          {/* Selected Pin */}
          {selectedPos && (
            <Marker
              position={[selectedPos.lat, selectedPos.lng]}
              icon={createPickerIcon()}
              draggable
              eventHandlers={{
                dragend: handleDragEnd,
              }}
            />
          )}
        </MapContainer>

        {/* Tile Layer Toggle */}
        <div className="absolute top-3 right-3 z-10">
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
        </div>

        {/* Instruction overlay when no selection */}
        {!selectedPos && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-md px-3 py-2">
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">
                Haz clic en el mapa o busca una dirección
              </span>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && selectedPos && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-background/20 pointer-events-none">
            <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm shadow-md border border-border rounded-lg px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Obteniendo dirección...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Card */}
      {hasLocation && !isLoading && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                {locationData.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="text-sm font-medium truncate">
                      {locationData.address}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {locationData.city && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {locationData.city}
                    </Badge>
                  )}
                  {locationData.state && (
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                    >
                      {locationData.state}
                    </Badge>
                  )}
                  {locationData.zipCode && (
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                    >
                      CP {locationData.zipCode}
                    </Badge>
                  )}
                  {locationData.neighborhood && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-emerald-100/60 text-emerald-700 hover:bg-emerald-100/60 dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      {locationData.neighborhood}
                    </Badge>
                  )}
                  {locationData.country && (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                    >
                      {locationData.country}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {locationData.lat.toFixed(5)}, {locationData.lng.toFixed(5)}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-foreground h-8 px-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpiar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
