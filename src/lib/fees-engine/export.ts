import type { ReportQueryResult, ReportColumnDef } from './report-configs';
import { formatPaise, paiseToRupees } from './constants';

export function formatCellValue(val: any, col: ReportColumnDef): string {
  if (val === null || val === undefined) return '';
  if (col.format === 'currency') {
    return formatPaise(Number(val) || 0);
  }
  if (col.format === 'number') {
    return Number(val).toLocaleString('en-IN');
  }
  return String(val);
}

export function generateCsvExport(
  schoolName: string,
  result: ReportQueryResult
): string {
  const lines: string[] = [];

  // Header block
  lines.push(`"${schoolName}"`);
  lines.push(`"Report: ${result.reportName}"`);
  lines.push(`"Academic Session: ${result.session}"`);
  lines.push(`"Generated At: ${result.generatedAt}"`);
  lines.push('');

  // Summary strip
  if (result.summaryKpis && result.summaryKpis.length > 0) {
    const kpiSummary = result.summaryKpis.map(k => `${k.label}: ${k.value}`).join(' | ');
    lines.push(`"Summary: ${kpiSummary}"`);
    lines.push('');
  }

  // Column Headers
  const headerRow = result.columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
  lines.push(headerRow);

  // Rows
  for (const row of result.rows) {
    const rowValues = result.columns.map(col => {
      const v = formatCellValue(row[col.key], col);
      return `"${v.replace(/"/g, '""')}"`;
    });
    lines.push(rowValues.join(','));
  }

  // Grand total row
  if (result.grandTotalRow) {
    const totalValues = result.columns.map(col => {
      const v = formatCellValue(result.grandTotalRow![col.key], col);
      return `"${v.replace(/"/g, '""')}"`;
    });
    lines.push(totalValues.join(','));
  }

  return lines.join('\r\n');
}

export async function generatePdfExport(
  schoolName: string,
  result: ReportQueryResult
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName.toUpperCase(), 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(result.reportName, 14, 22);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Academic Session: ${result.session} | Generated: ${result.generatedAt}`, 14, 27);

  // KPI Summary Bar
  if (result.summaryKpis && result.summaryKpis.length > 0) {
    const kpiText = result.summaryKpis.map(k => `${k.label}: ${k.value}`).join('   |   ');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 30, pageWidth - 28, 7, 'F');
    doc.text(kpiText, 16, 35);
  }

  // Table Body
  const head = [result.columns.map(c => c.header)];
  const body = result.rows.map(row =>
    result.columns.map(col => formatCellValue(row[col.key], col))
  );

  if (result.grandTotalRow) {
    const footRow = result.columns.map(col => formatCellValue(result.grandTotalRow![col.key], col));
    body.push(footRow);
  }

  const columnStyles: Record<number, any> = {};
  result.columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || (col.format === 'currency' || col.format === 'number' ? 'right' : 'left'),
    };
  });

  autoTable(doc, {
    head,
    body,
    startY: result.summaryKpis && result.summaryKpis.length > 0 ? 40 : 32,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didDrawPage: (data: any) => {
      // Footer page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} — EduSuite Single Fees Engine`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  return doc.output('blob');
}
