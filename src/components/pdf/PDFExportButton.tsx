"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateValuationPDF, type ValuationReport } from "@/lib/pdf-generator";

interface PDFExportButtonProps {
  report: ValuationReport;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function PDFExportButton({
  report,
  variant = "default",
  size = "default",
  className,
  children,
}: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Small delay so user sees the loading state
      await new Promise((r) => setTimeout(r, 300));
      generateValuationPDF(report);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {children || "Exportar PDF"}
    </Button>
  );
}
