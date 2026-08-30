import type { Escrow } from '@/types';

// `jspdf` and `html2canvas` are large (~100kb+ combined) and only needed when a
// user actually triggers a PDF export, so they're dynamically imported inside
// each function below rather than imported statically at module scope. This
// keeps them out of the initial JS payload and lets bundlers split them into
// their own on-demand chunk. See #573.

export interface PDFExportOptions {
  filename?: string;
  title?: string;
}

/**
 * Renders an HTML element to a multi-page A4 PDF and triggers a browser download.
 *
 * Uses `html2canvas` to rasterise the element at 2× resolution, then tiles the
 * resulting image across as many jsPDF pages as necessary.
 *
 * @param element - The DOM node to render (must be present in the document).
 * @param options - Optional filename and title overrides.
 * @returns Promise that resolves when the PDF has been saved.
 * @throws {Error} When `html2canvas` or jsPDF cannot process the element.
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'export.pdf',
  } = options;

  try {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    let heightLeft = canvas.height * imgWidth / canvas.width;
    let position = 0;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, (heightLeft * imgWidth) / canvas.width);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Derives summary statistics and a normalised transaction list from an array of
 * escrow records, ready for inclusion in a PDF export.
 *
 * @param escrows - Full list of escrow records belonging to the vendor.
 * @returns Object containing total counts, cumulative amount, a status frequency
 *   map, and an array of simplified transaction rows.
 */
export function formatTransactionHistoryData(escrows: Escrow[]): {
  totalTransactions: number;
  totalAmount: number;
  statusBreakdown: Record<string, number>;
  transactions: Array<{
    id: string;
    item: string;
    amount: number;
    status: string;
    createdAt: string;
    buyerId: string;
  }>;
} {
  const transactions = escrows.map((escrow) => ({
    id: escrow.id,
    item: escrow.item,
    amount: escrow.amount,
    status: escrow.status,
    createdAt: new Date(escrow.createdAt).toLocaleString(),
    buyerId: escrow.buyerId ? `${escrow.buyerId.slice(0, 6)}...${escrow.buyerId.slice(-6)}` : 'N/A',
  }));

  const statusBreakdown: Record<string, number> = {};
  let totalAmount = 0;

  escrows.forEach((escrow) => {
    totalAmount += escrow.amount;
    statusBreakdown[escrow.status] = (statusBreakdown[escrow.status] || 0) + 1;
  });

  return {
    totalTransactions: escrows.length,
    totalAmount,
    statusBreakdown,
    transactions,
  };
}

/**
 * Generates and immediately downloads a transaction-history PDF using only
 * jsPDF (no `html2canvas`), making it suitable for server-compatible or
 * lightweight client-side use.
 *
 * Renders a header, summary section, status breakdown, and a tabular list of
 * transactions. Automatically adds new pages when content overflows.
 *
 * @param escrows - Full list of escrow records to summarise.
 * @param vendorId - The vendor's public identifier, printed in the report header.
 * @param filename - Output filename (defaults to `"transaction-history.pdf"`).
 */
export async function generateSummaryPDF(
  escrows: Escrow[],
  vendorId: string,
  filename = 'transaction-history.pdf'
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const data = formatTransactionHistoryData(escrows);
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Transaction History Report', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const generatedDate = new Date().toLocaleString();
  pdf.text(`Generated on: ${generatedDate}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Vendor ID: ${vendorId}`, margin, yPosition);
  yPosition += 12;

  // Summary Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Summary', margin, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Total Transactions: ${data.totalTransactions}`, margin + 5, yPosition);
  yPosition += 6;
  pdf.text(`Total Amount: $${data.totalAmount.toFixed(2)} USDC`, margin + 5, yPosition);
  yPosition += 12;

  // Status Breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Status Breakdown', margin, yPosition);
  yPosition += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  Object.entries(data.statusBreakdown).forEach(([status, count]) => {
    pdf.text(`${status}: ${count}`, margin + 5, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // Transactions Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Transaction Details', margin, yPosition);
  yPosition += 8;

  // Table header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setFillColor(240, 240, 240);
  const colWidths = [35, 45, 25, 25, 40, 30];
  const headers = ['Item', 'Buyer ID', 'Amount', 'Status', 'Date', 'Transaction ID'];

  let xPosition = margin;
  headers.forEach((header, i) => {
    pdf.text(header, xPosition, yPosition);
    xPosition += colWidths[i];
  });

  yPosition += 7;
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition - 1, pageWidth - margin, yPosition - 1);
  yPosition += 2;

  // Table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  data.transactions.forEach((transaction, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - margin - 10) {
      pdf.addPage();
      yPosition = margin;
    }

    const rowData = [
      transaction.item.substring(0, 20),
      transaction.buyerId,
      `$${transaction.amount.toFixed(2)}`,
      transaction.status,
      transaction.createdAt.substring(0, 10),
      transaction.id.substring(0, 8),
    ];

    xPosition = margin;
    rowData.forEach((cell, i) => {
      pdf.text(cell, xPosition, yPosition);
      xPosition += colWidths[i];
    });

    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPosition - 5, contentWidth, 5, 'F');
    }

    yPosition += 6;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    'This is an automatically generated report from TrustLink.',
    margin,
    pageHeight - 10
  );

  pdf.save(filename);
}
