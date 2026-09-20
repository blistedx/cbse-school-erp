import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function numberToWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.round(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return `${num} Rupees Only`;

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees Only' : 'Rupees Only';

  return str.trim();
}

export function generateReceiptPDF(payment: any, student: any, school: any = {}) {
  const doc = new jsPDF();

  const schoolName = school?.name || 'DELHI PUBLIC SCHOOL (CBSE)';
  const schoolAddress = school?.address || 'Main Campus, Sector 12, EduGit Complex';
  const schoolPhone = school?.phone || '+91 98765 43210';

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolAddress, 105, 27, { align: 'center' });
  doc.text(`Phone: ${schoolPhone}`, 105, 32, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', 105, 48, { align: 'center' });

  // Receipt info
  const receiptNo = payment?.receiptNo || 'RCP-0001';
  const paymentDate = payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const studentName = student?.name || payment?.studentName || 'Student';
  const studentClass = student?.class || student?.className || payment?.className || '—';
  const admissionNo = student?.admissionNo || payment?.admissionNo || '—';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${receiptNo}`, 14, 60);
  doc.text(`Date: ${paymentDate}`, 150, 60);
  doc.text(`Student: ${studentName}`, 14, 68);
  doc.text(`Class: ${studentClass} | Adm No: ${admissionNo}`, 14, 76);

  // Breakdown table
  const breakdown = payment?.breakdown || [];
  const tableBody = breakdown.map((item: any, idx: number) => {
    const amt = Number(item.amount || item.netAmount || 0);
    return [
      idx + 1,
      item.feeHeadName || item.headName || item.name || 'Fee Head',
      amt.toFixed(2),
    ];
  });

  const totalAmount = Number(payment?.amount || payment?.totalAmount || 0);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Fee Head', 'Amount (₹)']],
    body: tableBody.length > 0 ? tableBody : [[1, 'Academic Composite Fee', totalAmount.toFixed(2)]],
    foot: [['', 'Total', totalAmount.toFixed(2)]],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [220, 252, 231], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 120 },
      2: { cellWidth: 45, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const paymentMode = (payment?.paymentMode || 'cash').toUpperCase();

  doc.text(`Payment Mode: ${paymentMode}`, 14, finalY);
  doc.text(`Amount in words: ${numberToWords(totalAmount)}`, 14, finalY + 8);

  doc.text('_____________________', 150, finalY + 25);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', 150, finalY + 30);

  doc.save(`Receipt-${receiptNo.replace(/\//g, '-')}.pdf`);
  return doc;
}

export default generateReceiptPDF;
