/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
/**
 * WhatsApp & SMS Automated Communication Utility
 * Formats high-conversion institutional messages and provides instant WhatsApp direct links
 */

// Clean phone numbers into international format (defaulting to +91 for Indian CBSE schools)
export function sanitizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

export function openWhatsAppDirect(phone: string, text: string) {
  if (typeof window === 'undefined') return;
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export interface FeeReminderParams {
  studentName: string;
  parentPhone?: string;
  className: string;
  pendingAmount: number;
  dueDate: string;
  feeTitle: string;
  schoolName: string;
}

export function buildFeeReminderText(params: FeeReminderParams): string {
  return `📢 *FEES DUE NOTICE — ${params.schoolName.toUpperCase()}*\n\n` +
    `Dear Parent/Guardian,\n\n` +
    `This is a gentle reminder regarding school fee payment for your ward:\n` +
    `👤 *Student:* ${params.studentName} (${params.className})\n` +
    `📄 *Particulars:* ${params.feeTitle}\n` +
    `💰 *Outstanding Amount:* ₹${params.pendingAmount.toLocaleString('en-IN')}\n` +
    `📅 *Due Date:* ${params.dueDate}\n\n` +
    `Please clear the outstanding dues before the due date to ensure uninterrupted academic services and bus transport.\n\n` +
    `_Accounts Office, ${params.schoolName}_`;
}

export interface FeeReceiptParams {
  studentName: string;
  parentPhone?: string;
  className: string;
  paidAmount: number;
  receiptNo: string;
  paymentMode: string;
  date: string;
  schoolName: string;
}

export function buildFeeReceiptText(params: FeeReceiptParams): string {
  return `🧾 *FEE PAYMENT ACKNOWLEDGEMENT — ${params.schoolName.toUpperCase()}*\n\n` +
    `Dear Parent,\n\n` +
    `We gratefully acknowledge the receipt of school fees for your ward:\n` +
    `👤 *Student:* ${params.studentName} (${params.className})\n` +
    `🔢 *Receipt No:* ${params.receiptNo}\n` +
    `💵 *Amount Received:* ₹${params.paidAmount.toLocaleString('en-IN')}\n` +
    `💳 *Payment Mode:* ${params.paymentMode}\n` +
    `📅 *Date:* ${params.date}\n\n` +
    `Official digital receipt docket has been recorded in the central student ledger.\n\n` +
    `Thank you!\n` +
    `_Treasury Dept, ${params.schoolName}_`;
}

export interface MorningAbsentParams {
  studentName: string;
  parentPhone?: string;
  className: string;
  section: string;
  date: string;
  schoolName: string;
}

export function buildMorningAbsentText(params: MorningAbsentParams): string {
  return `⚠️ *MORNING ATTENDANCE ALERT — ${params.schoolName.toUpperCase()}*\n\n` +
    `Dear Parent/Guardian,\n\n` +
    `Your ward *${params.studentName}* of *${params.className} - Section ${params.section}* has been marked *ABSENT* during morning roll call today (${params.date}).\n\n` +
    `If this absence is unintentional or you have not submitted a prior leave application, please contact the School Reception immediately for child safety verification.\n\n` +
    `_Student Welfare Desk, ${params.schoolName}_`;
}

export interface ReportCardNoticeParams {
  studentName: string;
  parentPhone?: string;
  className: string;
  examName: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  schoolName: string;
}

export function buildReportCardNoticeText(params: ReportCardNoticeParams): string {
  return `🏆 *ACADEMIC ASSESSMENT RESULT — ${params.schoolName.toUpperCase()}*\n\n` +
    `Dear Parent,\n\n` +
    `The official assessment report for *${params.studentName}* (${params.className}) has been published:\n` +
    `📝 *Examination:* ${params.examName}\n` +
    `📊 *Score:* ${params.totalMarks} / ${params.maxMarks} (${params.percentage}%)\n` +
    `⭐ *CBSE Grade:* ${params.grade}\n` +
    (params.rank ? `🏅 *Class Rank:* ${params.rank}\n` : '') +
    `\nDetailed scholastic and co-scholastic docket is available on the Student & Parent ERP Portal.\n\n` +
    `_Examination Directorate, ${params.schoolName}_`;
}
