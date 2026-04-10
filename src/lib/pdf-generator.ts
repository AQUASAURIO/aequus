import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { propertyTypeLabels, buildingConditionLabels } from './types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ValuationReportComparable {
  name: string;
  address: string;
  area: number;
  price: number;
  pricePerSqm: number;
  similarity: number;
}

export interface ValuationReportRiskFactor {
  factor: string;
  level: string;
  description: string;
}

export interface ValuationReport {
  // Property info
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  totalArea: number;
  constructedArea: number | null;
  floors: number;
  yearBuilt: number | null;
  parkingSpaces: number;
  bathrooms: number;
  buildingCondition: string;
  features: string[];
  currentUse: string | null;

  // Valuation data
  marketValue: number;
  pricePerSqm: number | null;
  rentalValue: number | null;
  capRate: number | null;
  confidence: number;
  valuationMethod: string;
  valuatedAt: string;

  // AI Analysis
  aiAnalysis: string;
  recommendations: string;
  riskFactors: ValuationReportRiskFactor[];

  // Comparables
  comparables: ValuationReportComparable[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyLocal(value: number): string {
  return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateLocal(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNumberLocal(value: number): string {
  return value.toLocaleString('es-MX');
}

/** Confidence level label from 0-1 */
function confidenceLabel(c: number): string {
  if (c >= 0.9) return 'Muy Alta';
  if (c >= 0.75) return 'Alta';
  if (c >= 0.6) return 'Media-Alta';
  if (c >= 0.45) return 'Media';
  if (c >= 0.3) return 'Media-Baja';
  return 'Baja';
}

/** Returns a confidence bar string like [██████████░░░░] 78% */
function confidenceBar(c: number): string {
  const pct = Math.round(c * 100);
  const filled = Math.round(c * 10);
  const empty = 10 - filled;
  return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}] ${pct}% — ${confidenceLabel(c)}`;
}

function riskLevelLabel(level: string): string {
  switch (level) {
    case 'LOW': return 'Bajo';
    case 'MEDIUM': return 'Medio';
    case 'HIGH': return 'Alto';
    default: return level;
  }
}

// ── Color constants (emerald/gold theme matching Æquo brand) ──────────────────

const C = {
  primary: [16, 122, 79] as [number, number, number],    // emerald-700
  primaryDark: [4, 78, 53] as [number, number, number],  // emerald-800
  gold: [161, 119, 19] as [number, number, number],      // amber-700
  goldLight: [253, 230, 138] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],        // gray-800
  textMuted: [107, 114, 128] as [number, number, number], // gray-500
  border: [209, 213, 219] as [number, number, number],   // gray-300
  white: [255, 255, 255] as [number, number, number],
  riskLow: [4, 120, 87] as [number, number, number],
  riskMedium: [217, 119, 6] as [number, number, number],
  riskHigh: [220, 38, 38] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ── Shared drawing helpers ───────────────────────────────────────────────────

function addFooter(doc: jsPDF, pageNum: number): void {
  const y = PAGE_H - 15;
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text('Generado por Æquo — Valuacion de Propiedades con IA', MARGIN, y);
  doc.text(
    `Pagina ${pageNum}`,
    PAGE_W - MARGIN,
    y,
    { align: 'right' },
  );
  doc.text(
    new Date().toLocaleDateString('es-MX'),
    PAGE_W / 2,
    y,
    { align: 'center' },
  );
}

function drawSectionTitle(doc: jsPDF, y: number, title: string): number {
  // Decorative bar
  doc.setFillColor(...C.primary);
  doc.rect(MARGIN, y, 3, 8, 'F');
  doc.setFontSize(13);
  doc.setTextColor(...C.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 7, y + 6.5);
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');

  // Underline
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 12, PAGE_W - MARGIN, y + 12);

  return y + 18;
}

function checkSpace(doc: jsPDF, needed: number): boolean {
  return doc.getCursor().y + needed < PAGE_H - 25;
}

// ── Page generators ──────────────────────────────────────────────────────────

function drawCoverPage(doc: jsPDF, report: ValuationReport): void {
  // Outer border
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(1);
  doc.rect(8, 8, PAGE_W - 16, PAGE_H - 16);

  // Inner border
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, PAGE_W - 20, PAGE_H - 20);

  // Top decorative bar
  doc.setFillColor(...C.primary);
  doc.rect(10, 10, PAGE_W - 20, 4, 'F');

  // ÆQUO logo text
  doc.setFontSize(52);
  doc.setTextColor(...C.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text('ÆQUO', PAGE_W / 2, 65, { align: 'center' });

  // Subtitle
  doc.setFontSize(16);
  doc.setTextColor(...C.gold);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe de Valuacion', PAGE_W / 2, 78, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.8);
  doc.line(55, 88, PAGE_W - 55, 88);

  // Property type badge
  const typeLabel = propertyTypeLabels[report.propertyType as keyof typeof propertyTypeLabels] || report.propertyType;
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text(typeLabel.toUpperCase(), PAGE_W / 2, 102, { align: 'center' });

  // Property name
  doc.setFontSize(24);
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'bold');
  doc.text(report.propertyName, PAGE_W / 2, 122, { align: 'center' });

  // Address
  doc.setFontSize(12);
  doc.setTextColor(...C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(report.address, PAGE_W / 2, 138, { align: 'center' });
  doc.text(`${report.city}, ${report.state} ${report.zipCode}`, PAGE_W / 2, 146, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.4);
  doc.line(65, 160, PAGE_W - 65, 160);

  // Valuation date
  doc.setFontSize(11);
  doc.setTextColor(...C.text);
  doc.text('Fecha de Valuacion:', PAGE_W / 2, 176, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formatDateLocal(report.valuatedAt), PAGE_W / 2, 186, { align: 'center' });

  // Market value preview
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Valor de Mercado Estimado', PAGE_W / 2, 210, { align: 'center' });
  doc.setFontSize(28);
  doc.setTextColor(...C.primaryDark);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyLocal(report.marketValue), PAGE_W / 2, 224, { align: 'center' });
  doc.setFontSize(10);
  if (report.pricePerSqm) {
    doc.setTextColor(...C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatCurrencyLocal(report.pricePerSqm)} / m\u00B2`, PAGE_W / 2, 234, { align: 'center' });
  }

  // Bottom decorative bar
  doc.setFillColor(...C.primary);
  doc.rect(10, PAGE_H - 14, PAGE_W - 20, 4, 'F');

  // CONFIDENCIAL watermark — rotated diagonally
  doc.saveGraphicsState();
  doc.setFontSize(50);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'bold');
  const cx = PAGE_W / 2;
  const cy = PAGE_H / 2;
  doc.text('CONFIDENCIAL', cx, cy, {
    align: 'center',
    angle: 45,
  });
  doc.restoreGraphicsState();
}

function drawPropertyDetailsPage(doc: jsPDF, report: ValuationReport): void {
  let y = 25;

  // Page header
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text('DATOS DE LA PROPIEDAD', MARGIN, y);
  y += 10;

  // Property details table
  const conditionLabel = buildingConditionLabels[report.buildingCondition as keyof typeof buildingConditionLabels] || report.buildingCondition;
  const typeLabel = propertyTypeLabels[report.propertyType as keyof typeof propertyTypeLabels] || report.propertyType;

  const details = [
    ['Nombre', report.propertyName],
    ['Tipo de Propiedad', typeLabel],
    ['Direccion', report.address],
    ['Ciudad', report.city],
    ['Estado', report.state],
    ['Codigo Postal', report.zipCode],
    ['Uso Actual', report.currentUse || 'No especificado'],
    ['Area Total', `${formatNumberLocal(report.totalArea)} m\u00B2`],
    ['Area Construida', report.constructedArea ? `${formatNumberLocal(report.constructedArea)} m\u00B2` : 'N/A'],
    ['Niveles', String(report.floors)],
    ['Ano de Construccion', report.yearBuilt ? String(report.yearBuilt) : 'N/A'],
    ['Estacionamiento', `${report.parkingSpaces} cajones`],
    ['Banos', String(report.bathrooms)],
    ['Estado de Conservacion', conditionLabel],
  ];

  (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
    startY: y,
    body: details,
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 55,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: C.textMuted,
        fontSize: 9,
      },
      1: {
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        fontSize: 9,
      },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawCell: (data: { section: string; row: { index: number }; column: { index: number }; cell: { x: number; y: number; width: number; height: number } }) => {
      if (data.section === 'body') {
        // Draw subtle borders
        const cell = data.cell;
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Features section
  y = drawSectionTitle(doc, y, 'Caracteristicas y Amenidades');

  if (report.features.length > 0) {
    const cols = 2;
    const colW = CONTENT_W / cols;
    const cellH = 6;
    const rows = Math.ceil(report.features.length / cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= report.features.length) break;
        const fx = MARGIN + c * colW;
        const fy = y + r * cellH;

        // Checkmark
        doc.setFontSize(9);
        doc.setTextColor(...C.primary);
        doc.text('\u2713', fx + 2, fy + 4);

        // Feature name
        doc.setTextColor(...C.text);
        doc.text(report.features[idx], fx + 7, fy + 4);
      }
    }

    y += rows * cellH + 6;
  }

  // Building condition indicator
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.text);
  doc.text('Estado de Conservacion:', MARGIN, y + 4);
  doc.setFont('helvetica', 'normal');

  // Condition badge
  const badgeX = MARGIN + 52;
  const badgeW = doc.getTextWidth(conditionLabel) + 12;
  const condColor = report.buildingCondition === 'EXCELENTE' ? C.riskLow
    : report.buildingCondition === 'BUENO' ? [22, 163, 74]
    : report.buildingCondition === 'REGULAR' ? C.riskMedium
    : C.riskHigh;

  doc.setFillColor(condColor[0], condColor[1], condColor[2]);
  doc.roundedRect(badgeX, y - 1, badgeW, 8, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(conditionLabel, badgeX + 6, y + 3.5);

  addFooter(doc, 2);
}

function drawValuationResultsPage(doc: jsPDF, report: ValuationReport): void {
  let y = 25;

  // Page header
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text('RESULTADOS DE VALUACION', MARGIN, y);
  y += 12;

  // Main market value card
  doc.setFillColor(16, 122, 79);
  doc.roundedRect(MARGIN, y, CONTENT_W, 32, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('VALOR DE MERCADO', MARGIN + 12, y + 12);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrencyLocal(report.marketValue), MARGIN + 12, y + 27);
  y += 42;

  // Metric cards in a row
  const cardW = (CONTENT_W - 12) / 3;
  const cardH = 30;
  const metrics = [
    {
      label: 'Precio por m\u00B2',
      value: report.pricePerSqm ? `${formatCurrencyLocal(report.pricePerSqm)}` : 'N/A',
      sub: report.pricePerSqm ? '/ m\u00B2' : '',
    },
    {
      label: 'Renta Mensual',
      value: report.rentalValue ? formatCurrencyLocal(report.rentalValue) : 'N/A',
      sub: report.rentalValue ? 'MXN/mes' : '',
    },
    {
      label: 'Cap Rate',
      value: report.capRate ? `${report.capRate}%` : 'N/A',
      sub: report.capRate ? 'Rendimiento anual' : '',
    },
  ];

  metrics.forEach((m, i) => {
    const cx = MARGIN + i * (cardW + 6);
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(...C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, cx + 8, y + 10);

    doc.setFontSize(16);
    doc.setTextColor(...C.text);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, cx + 8, y + 22);

    if (m.sub) {
      doc.setFontSize(7);
      doc.setTextColor(...C.textMuted);
      doc.setFont('helvetica', 'normal');
      doc.text(m.sub, cx + 8, y + 27);
    }
  });

  y += cardH + 16;

  // Confidence section
  y = drawSectionTitle(doc, y, 'Nivel de Confianza');

  const confPct = Math.round(report.confidence * 100);
  doc.setFontSize(10);
  doc.setTextColor(...C.text);
  doc.text(`La confiabilidad de esta valuacion se clasifica como:`, MARGIN, y + 4);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const confColor = report.confidence >= 0.8 ? C.riskLow
    : report.confidence >= 0.6 ? C.riskMedium
    : C.riskHigh;
  doc.setTextColor(...confColor);
  doc.text(confidenceBar(report.confidence), MARGIN, y + 4);
  y += 14;

  // Confidence visual bar
  const barX = MARGIN;
  const barY = y;
  const barW = CONTENT_W;
  const barH = 6;

  // Background
  doc.setFillColor(229, 231, 235);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');

  // Fill
  const fillW = (barW * report.confidence);
  if (fillW > 0) {
    doc.setFillColor(...confColor);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');
    // Re-draw left corners only if not full
    if (report.confidence < 1) {
      doc.setFillColor(229, 231, 235);
      doc.rect(barX + fillW - 2, barY, 2, barH, 'F');
    }
  }

  y += barH + 16;

  // Valuation method
  y = drawSectionTitle(doc, y, 'Metodo de Valuacion');

  doc.setFontSize(11);
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'bold');
  doc.text(report.valuationMethod, MARGIN, y + 4);
  y += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.textMuted);
  doc.text(
    'La valoracion se ha realizado utilizando un enfoque integral que combina el analisis de propiedades comparables en el mercado, la evaluacion del potencial de ingresos y los costos de reposicion. Los resultados estan respaldados por un modelo de inteligencia artificial entrenado con datos del mercado inmobiliario mexicano.',
    MARGIN,
    y + 4,
    { maxWidth: CONTENT_W },
  );

  addFooter(doc, 3);
}

function drawAIAnalysisPage(doc: jsPDF, report: ValuationReport): void {
  let y = 25;

  // Page header
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text('ANALISIS INTELIGENCIA ARTIFICIAL', MARGIN, y);
  y += 10;

  // AI Analysis section
  y = drawSectionTitle(doc, y, 'Analisis de Valuacion');

  // Analysis text box
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.5);
  const analysisLines = report.aiAnalysis.split('\n').filter(l => l.trim().length > 0);
  const lineH = 4.5;
  const boxH = Math.max(analysisLines.length * lineH + 16, 40);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, 'FD');

  let ty = y + 10;
  doc.setFontSize(9);
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');

  for (const line of analysisLines) {
    if (ty > PAGE_H - 30) {
      doc.addPage();
      ty = MARGIN + 5;
    }
    const lines = doc.splitTextToSize(line, CONTENT_W - 16);
    for (const splitLine of lines) {
      if (ty > PAGE_H - 30) {
        doc.addPage();
        ty = MARGIN + 5;
      }
      doc.text(splitLine, MARGIN + 8, ty);
      ty += lineH;
    }
    ty += 2; // paragraph spacing
  }

  y = ty + 14;

  // Recommendations section
  if (y > PAGE_H - 60) {
    doc.addPage();
    y = MARGIN;
  }

  y = drawSectionTitle(doc, y, 'Recomendaciones');

  const recLines = report.recommendations.split('\n').filter(l => l.trim().length > 0);
  doc.setFontSize(9);
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');

  for (const line of recLines) {
    if (y > PAGE_H - 30) {
      doc.addPage();
      y = MARGIN;
    }
    const lines = doc.splitTextToSize(line, CONTENT_W - 10);
    for (const splitLine of lines) {
      if (y > PAGE_H - 30) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(splitLine, MARGIN + 4, y);
      y += lineH;
    }
    y += 2;
  }

  y += 10;

  // Risk factors section
  if (y > PAGE_H - 80) {
    doc.addPage();
    y = MARGIN;
  }

  y = drawSectionTitle(doc, y, 'Factores de Riesgo');

  if (report.riskFactors.length > 0) {
    const riskRows = report.riskFactors.map(r => {
      const levelColor = r.level === 'LOW' ? C.riskLow
        : r.level === 'MEDIUM' ? C.riskMedium
        : C.riskHigh;
      return [
        { content: r.factor, styles: { fontStyle: 'bold', fontSize: 8.5 } },
        {
          content: riskLevelLabel(r.level),
          styles: {
            fontSize: 8,
            textColor: levelColor,
            fontStyle: 'bold',
            halign: 'center',
          },
        },
        { content: r.description, styles: { fontSize: 8 } },
      ];
    });

    (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
      startY: y,
      head: [[
        { content: 'Factor', styles: { fontStyle: 'bold', fontSize: 9, textColor: C.white, fillColor: C.primary } },
        { content: 'Nivel', styles: { fontStyle: 'bold', fontSize: 9, textColor: C.white, fillColor: C.primary, halign: 'center' } },
        { content: 'Descripcion', styles: { fontStyle: 'bold', fontSize: 9, textColor: C.white, fillColor: C.primary } },
      ]],
      body: riskRows,
      theme: 'plain',
      margin: { left: MARGIN, right: MARGIN },
      columnStyles: {
        0: { cellWidth: 38, cellPadding: { top: 3, bottom: 3, left: 3, right: 2 } },
        1: { cellWidth: 18, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 } },
        2: { cellPadding: { top: 3, bottom: 3, left: 2, right: 3 } },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252],
      },
    });
  }

  // Footer is handled per page
}

function drawComparablesPage(doc: jsPDF, report: ValuationReport): void {
  let y = 25;

  // Page header
  doc.setFontSize(10);
  doc.setTextColor(...C.textMuted);
  doc.text('PROPIEDADES COMPARABLES', MARGIN, y);
  y += 10;

  y = drawSectionTitle(doc, y, 'Analisis Comparativo de Mercado');

  if (report.comparables.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...C.textMuted);
    doc.text('No se encontraron propiedades comparables.', MARGIN, y + 5);
    addFooter(doc, 5);
    return;
  }

  // Comparables auto-table
  const compRows = report.comparables.map((c, i) => [
    {
      content: `#${i + 1}`,
      styles: { fontStyle: 'bold', fontSize: 8.5, halign: 'center' },
    },
    { content: c.name, styles: { fontStyle: 'bold', fontSize: 8.5 } },
    { content: c.address, styles: { fontSize: 7.5, textColor: C.textMuted } },
    {
      content: `${formatNumberLocal(c.area)} m\u00B2`,
      styles: { fontSize: 8, halign: 'right' },
    },
    {
      content: formatCurrencyLocal(c.price),
      styles: { fontSize: 8, halign: 'right' },
    },
    {
      content: formatCurrencyLocal(c.pricePerSqm),
      styles: { fontSize: 8, halign: 'right' },
    },
    {
      content: `${(c.similarity * 100).toFixed(0)}%`,
      styles: {
        fontSize: 8,
        halign: 'center',
        textColor: c.similarity >= 0.9 ? C.riskLow : c.similarity >= 0.75 ? C.riskMedium : C.riskHigh,
        fontStyle: 'bold',
      },
    },
  ]);

  (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
    startY: y,
    head: [[
      { content: '#', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, halign: 'center', cellWidth: 10 } },
      { content: 'Propiedad', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, cellWidth: 32 } },
      { content: 'Direccion', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, cellWidth: 38 } },
      { content: 'Area', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, halign: 'right', cellWidth: 22 } },
      { content: 'Precio', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, halign: 'right', cellWidth: 26 } },
      { content: 'Precio/m\u00B2', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, halign: 'right', cellWidth: 24 } },
      { content: 'Similitud', styles: { fontStyle: 'bold', fontSize: 8, textColor: C.white, fillColor: C.primary, halign: 'center', cellWidth: 18 } },
    ]],
    body: compRows,
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
    didDrawCell: (data: { section: string; cell: { x: number; y: number; width: number; height: number } }) => {
      if (data.section === 'body') {
        const cell = data.cell;
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.1);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // Summary statistics
  y = drawSectionTitle(doc, y, 'Estadisticas de Comparables');

  const avgPrice = report.comparables.reduce((s, c) => s + c.price, 0) / report.comparables.length;
  const avgPricePerSqm = report.comparables.reduce((s, c) => s + c.pricePerSqm, 0) / report.comparables.length;
  const avgArea = report.comparables.reduce((s, c) => s + c.area, 0) / report.comparables.length;
  const avgSimilarity = report.comparables.reduce((s, c) => s + c.similarity, 0) / report.comparables.length;
  const minPrice = Math.min(...report.comparables.map(c => c.price));
  const maxPrice = Math.max(...report.comparables.map(c => c.price));

  const summaryData = [
    ['Numero de Comparables', String(report.comparables.length)],
    ['Precio Promedio', formatCurrencyLocal(Math.round(avgPrice))],
    ['Precio por m\u00B2 Promedio', formatCurrencyLocal(Math.round(avgPricePerSqm))],
    ['Area Promedio', `${formatNumberLocal(Math.round(avgArea))} m\u00B2`],
    ['Similitud Promedio', `${(avgSimilarity * 100).toFixed(0)}%`],
    ['Rango de Precios', `${formatCurrencyLocal(minPrice)} — ${formatCurrencyLocal(maxPrice)}`],
    ['Diferencia vs. Promedio', formatCurrencyLocal(Math.round(report.marketValue - avgPrice))],
  ];

  (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
    startY: y,
    body: summaryData,
    theme: 'plain',
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 55,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: C.textMuted,
        fontSize: 9,
      },
      1: {
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        fontSize: 9,
      },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawCell: (data: { section: string; cell: { x: number; y: number; width: number; height: number } }) => {
      if (data.section === 'body') {
        const cell = data.cell;
        doc.setDrawColor(...C.border);
        doc.setLineWidth(0.15);
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    },
  });

  addFooter(doc, 5);
}

// ── Main export ──────────────────────────────────────────────────────────────

export function generateValuationPDF(report: ValuationReport): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Page 1: Cover
  drawCoverPage(doc, report);

  // Page 2: Property Details
  doc.addPage();
  drawPropertyDetailsPage(doc, report);

  // Page 3: Valuation Results
  doc.addPage();
  drawValuationResultsPage(doc, report);

  // Page 4: AI Analysis
  doc.addPage();
  drawAIAnalysisPage(doc, report);

  // Page 5: Comparables
  doc.addPage();
  drawComparablesPage(doc, report);

  // Add page numbers to cover page too
  doc.setPage(1);
  addFooter(doc, 1);

  // Save
  const safeName = report.propertyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  doc.save(`aequo-valuacion-${safeName}.pdf`);
}
