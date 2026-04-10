"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapProperty } from "./PropertyMap";

// Dynamic import with SSR disabled for Leaflet
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg overflow-hidden bg-muted">
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-4 w-32" />
          <p className="text-xs text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    </div>
  ),
});

interface MapSectionProps {
  title?: string;
  subtitle?: string;
  properties?: MapProperty[];
  height?: string;
  className?: string;
  onPropertyClick?: (property: MapProperty) => void;
}

export function MapSection({
  title = "Mapa de Propiedades",
  subtitle = "Visualiza la ubicación de todas las propiedades del portafolio",
  properties,
  height = "h-[400px]",
  className,
  onPropertyClick,
}: MapSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <PropertyMap
          properties={properties}
          height={height}
          onPropertyClick={onPropertyClick}
        />
      </CardContent>
    </Card>
  );
}
