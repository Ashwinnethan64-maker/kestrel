/**
 * KESTREL Export Utilities
 * Genuine PDF (jsPDF), CSV (RFC-4180 compliant with UTF-8 BOM), and JSON exports.
 * All exports produce real downloadable files, not renamed HTML blobs.
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export interface PDFExportOptions {
  title: string;
  id?: string;
  classification?: string;
  author?: string;
  date?: string;
  scope?: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
  kpiRows?: { label: string; value: string | number }[];
  summaryText?: string;
}

const KESTREL_DARK = [5, 11, 20] as [number, number, number];
const GOLD = [212, 175, 55] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT_GRAY = [240, 240, 240] as [number, number, number];
const MEDIUM_GRAY = [160, 160, 160] as [number, number, number];
const TEXT_DARK = [30, 30, 30] as [number, number, number];

/**
 * Export data as a genuine PDF file using jsPDF + autoTable.
 * The resulting file starts with %PDF- and opens in any PDF viewer.
 */
export function exportToPDF(options: PDFExportOptions): void {
  const {
    title,
    id,
    classification = 'OFFICIAL LAW ENFORCEMENT',
    author = 'Kestrel System',
    date = new Date().toISOString().slice(0, 10),
    scope,
    headers,
    rows,
    filename,
    kpiRows,
    summaryText,
  } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header Band ──────────────────────────────────────────────────────────
  doc.setFillColor(...KESTREL_DARK);
  doc.rect(0, 0, pageW, 24, 'F');

  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KESTREL // KARNATAKA STATE POLICE', 14, 10);

  doc.setFontSize(10);
  doc.setTextColor(...MEDIUM_GRAY);
  doc.text(classification, 14, 17);

  if (id) {
    doc.setTextColor(...GOLD);
    doc.setFontSize(9);
    doc.text(id, pageW - 14, 10, { align: 'right' });
  }

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 34);

  // ── Meta row ─────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MEDIUM_GRAY);
  const meta = [
    `Generated: ${date}`,
    author ? `Author: ${author}` : null,
    scope ? `Scope: ${scope}` : null,
  ]
    .filter(Boolean)
    .join('   |   ');
  doc.text(meta, 14, 40);

  // Separator
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(14, 43, pageW - 14, 43);

  let cursorY = 48;

  // ── Optional KPI Row ─────────────────────────────────────────────────────
  if (kpiRows && kpiRows.length > 0) {
    const boxW = Math.min(55, (pageW - 28) / kpiRows.length);
    kpiRows.forEach((kpi, i) => {
      const x = 14 + i * (boxW + 4);
      doc.setFillColor(...LIGHT_GRAY);
      doc.roundedRect(x, cursorY, boxW, 16, 2, 2, 'F');
      doc.setTextColor(...MEDIUM_GRAY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.label.toUpperCase(), x + 3, cursorY + 5);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(13);
      doc.text(String(kpi.value), x + 3, cursorY + 13);
    });
    cursorY += 22;
  }

  // ── Optional Summary paragraph ────────────────────────────────────────────
  if (summaryText) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    const lines = doc.splitTextToSize(summaryText, pageW - 28) as string[];
    doc.text(lines, 14, cursorY);
    cursorY += lines.length * 5 + 4;
  }

  // ── Data Table ────────────────────────────────────────────────────────────
  if (headers.length > 0 && rows.length > 0) {
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: cursorY,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: TEXT_DARK,
      },
      headStyles: {
        fillColor: KESTREL_DARK,
        textColor: GOLD,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: LIGHT_GRAY,
      },
      showHead: 'everyPage',
      didDrawPage: (data: { pageNumber: number }) => {
        // Footer on each page
        const pN = data.pageNumber;
        const totalPages = (doc.internal as any).getNumberOfPages
          ? (doc.internal as any).getNumberOfPages()
          : '?';
        doc.setFillColor(...KESTREL_DARK);
        doc.rect(0, doc.internal.pageSize.getHeight() - 10, pageW, 10, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...MEDIUM_GRAY);
        doc.text(
          `KESTREL // ${classification}   |   Page ${pN} of ${totalPages}   |   ${date}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 3,
          { align: 'center' }
        );
      },
    });
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Export data as a valid RFC-4180 CSV file with UTF-8 BOM for spreadsheet compatibility.
 */
export interface CSVExportOptions {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
}

export function exportToCSV(options: CSVExportOptions): void {
  const { headers, rows, filename } = options;

  const escapeCell = (val: string | number | null | undefined): string => {
    const str = val == null ? '' : String(val);
    // Wrap in quotes if the cell contains commas, quotes, or newlines
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines: string[] = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  // UTF-8 BOM + content
  const BOM = '\uFEFF';
  const csvContent = BOM + csvLines.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as a valid, parseable JSON file with metadata envelope.
 */
export interface JSONExportOptions {
  data: unknown;
  filename: string;
  meta?: Record<string, unknown>;
}

export function exportToJSON(options: JSONExportOptions): void {
  const { data, filename, meta } = options;

  const envelope = {
    exportSchema: 'kestrel-v1',
    generatedAt: new Date().toISOString(),
    classification: 'OFFICIAL LAW ENFORCEMENT',
    ...meta,
    records: data,
  };

  const jsonStr = JSON.stringify(envelope, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
