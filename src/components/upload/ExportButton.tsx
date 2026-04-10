"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportPropertiesToCSV, type ExportProperty } from "@/lib/csv-utils";

interface ExportButtonProps {
  properties: ExportProperty[];
  disabled?: boolean;
}

export function ExportButton({ properties, disabled }: ExportButtonProps) {
  const handleExport = () => {
    exportPropertiesToCSV(properties);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || properties.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
