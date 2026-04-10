// ── Free Map Tile Providers ──────────────────────────────────────────────────
// All providers are free for non-commercial / limited commercial use.

export type TileLayerType = "satellite" | "streets" | "terrain";

export interface TileLayerOption {
  id: TileLayerType;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const TILE_LAYERS: Record<TileLayerType, TileLayerOption> = {
  satellite: {
    id: "satellite",
    label: "Satélite",
    // Esri World Imagery — high-quality satellite imagery, free for limited use
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  streets: {
    id: "streets",
    label: "Calles",
    // OpenStreetMap standard tiles
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  terrain: {
    id: "terrain",
    label: "Terreno",
    // OpenTopoMap — topographic/terrain view with elevation contours
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>)',
    maxZoom: 17,
  },
};

export const DEFAULT_TILE_LAYER: TileLayerType = "satellite";
