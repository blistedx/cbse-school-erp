import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptPdfLineItem {
  headName: string;
  amount: number;
  fine?: number;
  concession?: number;
  netAmount?: number;
}

export interface ReceiptPdfData {
  receiptNo: string;
  paymentDate: string | Date;
  academicSession?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolAffiliation?: string;
  schoolPhone?: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section?: string;
  rollNo?: string;
  fatherName?: string;
  paymentMode: string;
  transactionRef?: string;
  monthsCovered?: string[];
  breakdown: ReceiptPdfLineItem[];
  subtotal?: number;
  totalConcession?: number;
  lateFine?: number;
  totalAmount: number;
  collectedBy?: string;
  remarks?: string;
}

// Convert numbers to Indian Rupees in Words
function numberToIndianWords(num: number): string {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';
  return str.trim();
}

/**
 * Generate CBSE Official Institutional Fee Receipt PDF
 */
export function generateFeeReceiptPdf(data: ReceiptPdfData, action: 'download' | 'blob' | 'print' = 'download'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const schoolName = data.schoolName || 'DELHI PUBLIC SCHOOL (CBSE)';
  const schoolAddress = data.schoolAddress || 'Main Institutional Campus, Sector 12, EduGit Complex';
  const schoolAffiliation = data.schoolAffiliation || 'CBSE Affiliation No: 2130048 • School Code: 70124';

  // 1. Header Border & Background Accent
  doc.setDrawColor(18, 42, 36);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, 281); // Outer Page Border

  // Header Banner Box
  doc.setFillColor(18, 42, 36); // #122A24
  doc.rect(8, 8, pageWidth - 16, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 232, 224);
  doc.text(`${schoolAddress} | ${schoolAffiliation}`, pageWidth / 2, 24, { align: 'center' });

  // Receipt Title Badge
  doc.setFillColor(235, 245, 239); // #EBF5EF
  doc.setDrawColor(220, 232, 224);
  doc.roundedRect(pageWidth / 2 - 38, 38, 76, 8, 2, 2, 'FD');
  doc.setTextColor(18, 42, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', pageWidth / 2, 43.5, { align: 'center' });

  // 2. Receipt & Student Meta Info Section
  const dateStr = typeof data.paymentDate === 'string' 
    ? data.paymentDate 
    : new Date(data.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt No:', 14, 54);
  doc.setFont('courier', 'bold');
  doc.setTextColor(18, 42, 36);
  doc.text(data.receiptNo, 40, 54);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Student Name:', 14, 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 42, 36);
  doc.text(data.studentName.toUpperCase(), 40, 60);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Class & Sec:', 14, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.className}${data.section ? ` - ${data.section}` : ''}`, 40, 66);

  doc.setFont('helvetica', 'bold');
  doc.text('Father Name:', 14, 72);
  doc.setFont('helvetica', 'normal');
  doc.text(data.fatherName || '—', 40, 72);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Date of Payment:', 118, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, 150, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Admission No:', 118, 60);
  doc.setFont('courier', 'bold');
  doc.text(data.admissionNo, 150, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Mode:', 118, 66);
  doc.setFont('helvetica', 'normal');
  doc.text((data.paymentMode || 'CASH').toUpperCase(), 150, 66);

  if (data.transactionRef) {
    doc.setFont('helvetica', 'bold');
    doc.text('Txn / Ref ID:', 118, 72);
    doc.setFont('courier', 'normal');
    doc.text(data.transactionRef, 150, 72);
  }

  // 3. Fee Particulars Table
  const tableRows = data.breakdown.map((item, index) => {
    const net = item.netAmount !== undefined 
      ? item.netAmount 
      : Math.max(0, item.amount + (item.fine || 0) - (item.concession || 0));
    return [
      String(index + 1),
      item.headName,
      `₹ ${item.amount.toLocaleString('en-IN')}`,
      item.concession ? `₹ ${item.concession.toLocaleString('en-IN')}` : '—',
      item.fine ? `₹ ${item.fine.toLocaleString('en-IN')}` : '—',
      `₹ ${net.toLocaleString('en-IN')}`
    ];
  });

  autoTable(doc, {
    startY: 78,
    margin: { left: 14, right: 14 },
    head: [['#', 'Fee Particulars / Head', 'Base Fee', 'Discount', 'Fine', 'Net Amount (₹)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 42, 36],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 30, 30],
      lineColor: [220, 232, 224]
    },
    alternateRowStyles: {
      fillColor: [244, 248, 245]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // 4. Summary Calculation Box
  doc.setFillColor(244, 248, 245);
  doc.setDrawColor(220, 232, 224);
  doc.roundedRect(110, finalY, pageWidth - 124, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Gross Subtotal:', 114, finalY + 6);
  doc.text(`₹ ${(data.subtotal || data.totalAmount).toLocaleString('en-IN')}`, pageWidth - 18, finalY + 6, { align: 'right' });

  if (data.totalConcession) {
    doc.text('Total Concession:', 114, finalY + 11);
    doc.text(`- ₹ ${data.totalConcession.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 11, { align: 'right' });
  }

  doc.setDrawColor(220, 232, 224);
  doc.line(114, finalY + 14, pageWidth - 18, finalY + 14);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 42, 36);
  doc.text('Net Total Paid:', 114, finalY + 21);
  doc.text(`₹ ${data.totalAmount.toLocaleString('en-IN')}`, pageWidth - 18, finalY + 21, { align: 'right' });

  // In Words Section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 42, 36);
  doc.text('Amount in Words:', 14, finalY + 10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(60, 60, 60);
  const words = numberToIndianWords(data.totalAmount);
  doc.text(words, 14, finalY + 16, { maxWidth: 90 });

  // 5. Signatures & Footer
  const footerY = Math.max(finalY + 45, 245);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, 65, footerY);
  doc.line(pageWidth - 65, footerY, pageWidth - 14, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 42, 36);
  doc.text('Depositor / Parent Signature', 14, footerY + 5);
  doc.text('Authorized Cashier Signature', pageWidth - 14, footerY + 5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Collected by: ${data.collectedBy || 'Accounts Counter'} | Generated on: ${new Date().toLocaleString('en-IN')}`, 14, footerY + 15);
  doc.text('Note: This is an authentic computer generated receipt and does not require physical stamp.', pageWidth / 2, footerY + 22, { align: 'center' });

  if (action === 'download') {
    doc.save(`${data.receiptNo.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`);
  } else if (action === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  return doc;
}

export default generateFeeReceiptPdf;
