"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Building2,
  Filter,
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  MapPin,
  Ruler,
  Calendar,
  SlidersHorizontal,
  X,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import {
  propertyTypeLabels,
  propertyTypeColors,
  propertyStatusLabels,
  formatCurrency,
  formatDate,
} from "@/lib/types";
import type { PropertyType, PropertyStatus } from "@/lib/types";
import { ExportButton } from "@/components/upload/ExportButton";
import { ImportCSVDialog } from "@/components/upload/ImportCSVDialog";
import type { ExportProperty } from "@/lib/csv-utils";

interface DemoProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  propertyType: PropertyType;
  totalArea: number;
  yearBuilt: number | null;
  buildingCondition: string;
  status: PropertyStatus;
  marketValue: number | null;
  pricePerSqm: number | null;
  createdAt: string;
  confidence: number | null;
}

const demoProperties: DemoProperty[] = [];

type SortField = "name" | "createdAt" | "totalArea" | "marketValue";
type SortDir = "asc" | "desc";

export function PropertiesDirectory() {
  const { navigateToProperty, setCurrentView } = useAppStore();
  const [properties, setProperties] = useState<DemoProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        // Map backend properties to directory format
        const mapped = data.map((p: any) => ({
          ...p,
          marketValue: p.valuations?.[0]?.market_value || null,
          pricePerSqm: p.valuations?.[0]?.price_per_sqm || null,
          confidence: p.valuations?.[0]?.confidence || null,
          createdAt: p.created_at || p.createdAt,
        }));
        setProperties(mapped);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filtered = useMemo(() => {
    let data = [...properties];

    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.address.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") data = data.filter((p) => p.propertyType === typeFilter);
    if (statusFilter !== "all") data = data.filter((p) => p.status === statusFilter);

    data.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === "totalArea") cmp = a.totalArea - b.totalArea;
      else if (sortField === "marketValue") cmp = (a.marketValue || 0) - (b.marketValue || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [properties, search, typeFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const activeFilters = (typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  // Map filtered properties to export format
  const exportProperties: ExportProperty[] = useMemo(
    () =>
      filtered.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: "",
        propertyType: p.propertyType,
        totalArea: p.totalArea,
        constructedArea: null,
        floors: 1,
        yearBuilt: p.yearBuilt,
        parkingSpaces: 0,
        bathrooms: 1,
        buildingCondition: p.buildingCondition,
        status: p.status,
        marketValue: p.marketValue,
        pricePerSqm: p.pricePerSqm,
        createdAt: p.createdAt,
      })),
    [filtered]
  );

  return (
    <div className="space-y-4">
      {/* Search + Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, dirección o ciudad..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                Filtros
                {activeFilters > 0 && (
                  <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">{activeFilters}</Badge>
                )}
              </Button>
              <Button size="sm" onClick={() => setCurrentView("new-valuation")}>
                <Building2 className="mr-1.5 h-4 w-4" />
                Nueva Propiedad
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                Importar CSV
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 border-t pt-3">
              <div className="w-full sm:w-48">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tipo de Propiedad
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(propertyTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Estado
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(propertyStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilters > 0 && (
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Limpiar
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count + Export */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} propiedades encontradas</span>
        <ExportButton properties={exportProperties} />
      </div>

      {/* Import Dialog */}
      <ImportCSVDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Propiedad</TableHead>
                  <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => toggleSort("totalArea")}
                  >
                    <div className="flex items-center gap-1">
                      Área <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("marketValue")}
                  >
                    <div className="flex items-center gap-1">
                      Valor <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Estado</TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => toggleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Fecha <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12 pr-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <Building2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      No se encontraron propiedades
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((property) => (
                    <TableRow
                      key={property.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => navigateToProperty(property.id)}
                    >
                      <TableCell className="pl-4">
                        <div>
                          <p className="text-sm font-semibold">{property.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {property.city}, {property.state}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{property.address}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${propertyTypeColors[property.propertyType]}`}
                        >
                          {propertyTypeLabels[property.propertyType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-sm">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          {property.totalArea.toLocaleString()} m²
                        </span>
                      </TableCell>
                      <TableCell>
                        {property.marketValue ? (
                          <div>
                            <p className="text-sm font-bold">{formatCurrency(property.marketValue)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {property.pricePerSqm?.toLocaleString()}/m²
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin valuación</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={
                            property.status === "VALUADO"
                              ? "default"
                              : property.status === "EN_REVISION"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-[10px]"
                        >
                          {propertyStatusLabels[property.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(property.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigateToProperty(property.id); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
