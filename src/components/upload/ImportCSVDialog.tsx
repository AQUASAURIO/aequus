"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseImportCSV, downloadCSVTemplate } from "@/lib/csv-utils";
import type { ImportedProperty } from "@/lib/csv-utils";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportedProperty[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreviewRows([]);
    setImportedCount(0);
    setWarnings([]);
    setError(null);
  }, []);

  const handleClose = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (!selected) return;

    setFile(selected);
    setError(null);

    try {
      const properties = await parseImportCSV(selected);
      if (properties.length === 0) {
        setError("No se encontraron propiedades válidas en el archivo.");
        return;
      }
      setPreviewRows(properties.slice(0, 5));
      setStep("preview");
    } catch {
      setError("Error al leer el archivo CSV. Verifica el formato.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleImport = async () => {
    setStep("importing");
    try {
      const allRows = file ? await parseImportCSV(file) : previewRows;
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: allRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al importar");
      setImportedCount(data.success || 0);
      setWarnings(data.errors || []);
      setStep("done");
    } catch (err) {
      setImportedCount(0);
      setWarnings([(err as Error).message]);
      setStep("done");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Importar Propiedades</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con tus propiedades para importarlas masivamente.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                isDragActive && !isDragReject
                  ? "border-primary bg-primary/5"
                  : isDragReject
                  ? "border-destructive bg-destructive/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Arrastra tu archivo CSV aquí
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                o haz clic para seleccionar · Máximo 10MB
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                downloadCSVTemplate();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla CSV
            </Button>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && file && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} · {previewRows.length} propiedades encontradas
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nombre</th>
                    <th className="px-3 py-2 text-left font-medium">Dirección</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 truncate max-w-[140px]">{row.name}</td>
                      <td className="px-3 py-1.5 truncate max-w-[160px]">{row.address}</td>
                      <td className="px-3 py-1.5">{row.propertyType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetState}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleImport}>
                Importar {previewRows.length} propiedades
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Importando propiedades...</p>
            <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos</p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            {importedCount > 0 ? (
              <>
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{importedCount} propiedades importadas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se han guardado correctamente en tu portafolio
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm font-semibold text-destructive">Error en la importación</p>
              </>
            )}

            {warnings.length > 0 && (
              <div className="w-full max-h-32 overflow-y-auto custom-scrollbar rounded-lg border p-2">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                    {w}
                  </p>
                ))}
              </div>
            )}

            <Button onClick={() => handleClose(false)} className="w-full max-w-[200px]">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
