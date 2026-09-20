'use client';

import React, { useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Building2,
  GraduationCap,
  Receipt,
  Download,
  Scissors
} from 'lucide-react';
import { ReceiptRecord } from '@/lib/fees-engine/types';
import { FeeInvoice, School, Student } from '@/lib/types';

interface DualCopyFeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptRecord | FeeInvoice | any | null;
  selectedSchool?: School | any;
  student?: Student | null;
}

// Convert numbers to Indian Currency Words (e.g. 4500 -> Rupees Four Thousand Five Hundred Only)
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return `${b[Math.floor(n / 10)]}${digit ? ' ' + a[digit] : ''}`;
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  let str = '';
  if (crore > 0) str += `${inWords(crore)} Crore `;
  if (lakh > 0) str += `${inWords(lakh)} Lakh `;
  if (thousand > 0) str += `${inWords(thousand)} Thousand `;
  if (hundred > 0) str += `${inWords(hundred)} Hundred `;
  if (rem > 0) {
    if (str !== '') str += 'and ';
    str += inWords(rem);
  }
  return `Rupees ${str.trim()} Only`;
}

export function DualCopyFeeReceiptModal({
  isOpen,
  onClose,
  receipt,
  selectedSchool,
  student,
}: DualCopyFeeReceiptModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  // Adapterize receipt fields across ReceiptRecord and FeeInvoice formats
  const isReceiptRecord = 'allocated_heads' in receipt || 'amount_paise' in receipt;
  
  const receiptNo = receipt.receipt_no || receipt.invoice_no || receipt.id || 'DPS2-REC-2026-0001';
  const rawDate = receipt.payment_date || receipt.created_at || receipt.due_date || new Date().toISOString().split('T')[0];
  const paymentDate = typeof rawDate === 'string' ? rawDate.split('T')[0] : '2026-09-20';
  const session = receipt.academic_session || receipt.session || '2026-27';
  const paymentMode = (receipt.payment_mode || receipt.mode || 'CASH').toUpperCase();
  const txnRef = receipt.txn_ref || receipt.reference_no || receipt.cheque_no || receipt.transaction_id || null;
  
  const studentName = receipt.student_name || student?.full_name || 'Scholar';
  const admissionNo = receipt.admission_no || student?.admission_no || receipt.student_id || 'N/A';
  const className = receipt.class_name || student?.class_name || 'Class 9';
  const section = receipt.section || student?.section || 'A';
  const rollNo = receipt.roll_no || student?.roll_no || '—';
  const fatherName = receipt.father_name || student?.father_name || student?.guardian_name || 'N/A';
  const mobile = receipt.mobile || student?.guardian_phone || student?.father_phone || 'N/A';
  const studentHouse = student?.house || receipt.house || 'Red House';

  const collectedBy = receipt.collected_by || 'Accounts Desk';
  const remarks = receipt.remarks || 'Payment received with thanks against academic fee schedule.';

  // Parse Particulars
  let particulars: Array<{ head: string; period: string; amountRupees: number }> = [];
  let totalAmountRupees = 0;

  if (isReceiptRecord && Array.isArray(receipt.allocated_heads) && receipt.allocated_heads.length > 0) {
    particulars = receipt.allocated_heads.map((h: any) => ({
      head: h.fee_head || 'Academic Fee',
      period: h.period || h.month || 'Current Period',
      amountRupees: (h.amount_paise || 0) / 100,
    }));
    totalAmountRupees = (receipt.amount_paise || 0) / 100;
  } else if (Array.isArray(receipt.items) && receipt.items.length > 0) {
    particulars = receipt.items.map((it: any) => ({
      head: it.head_name || it.fee_head || 'Fee Head',
      period: it.description || it.month || 'Term Fee',
      amountRupees: Number(it.amount || 0),
    }));
    totalAmountRupees = Number(receipt.amount || receipt.total_amount || 0);
  } else {
    // Single line fallback
    const amt = isReceiptRecord ? (receipt.amount_paise || 0) / 100 : Number(receipt.amount || 0);
    particulars = [
      {
        head: 'Consolidated Academic Fee',
        period: receipt.month || 'Session 2026-27',
        amountRupees: amt,
      },
    ];
    totalAmountRupees = amt;
  }

  const schoolName = selectedSchool?.school_name || 'Delhi Public School, R.K. Puram';
  const affiliationNo = selectedSchool?.affiliation_no || '2130042';
  const oasisCode = selectedSchool?.oasis_code || '70231';
  const udiseCode = selectedSchool?.udise_code || '07010100101';
  const schoolAddress = selectedSchool?.address || 'Sector XII, R.K. Puram, New Delhi - 110022';
  const schoolPhone = selectedSchool?.phone || '+91 11 4911 5555';
  const schoolEmail = selectedSchool?.email || 'principal@dpsrkp.net';

  const amountInWords = numberToIndianWords(Math.round(totalAmountRupees));

  const handleTriggerPrint = () => {
    window.print();
  };

  // Helper to render one single copy (Parent or School)
  const renderReceiptCopy = (copyType: 'PARENT_COPY' | 'SCHOOL_COPY') => {
    const isParentCopy = copyType === 'PARENT_COPY';
    const copyLabel = isParentCopy ? 'PARENT / STUDENT COPY' : 'OFFICE / SCHOOL COUNTERFOIL';
    const badgeColor = isParentCopy 
      ? 'bg-emerald-800 text-white border-emerald-900' 
      : 'bg-slate-800 text-white border-slate-900';

    return (
      <div className="receipt-single-copy bg-white p-3.5 sm:p-4 rounded-xl border border-slate-300 relative flex flex-col justify-between text-[11px] leading-tight font-sans text-slate-900">
        {/* Top Header */}
        <div>
          <div className="flex items-start justify-between border-b border-slate-300 pb-2 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-lg border border-slate-400 p-0.5 flex items-center justify-center shrink-0 bg-slate-50">
                {selectedSchool?.logo ? (
                  <img src={selectedSchool.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-emerald-800" />
                )}
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                  {schoolName}
                </h2>
                <p className="text-[9.5px] font-semibold text-slate-600">
                  CBSE Affiliated Senior Secondary School • Affiliation No: <span className="font-mono font-bold text-slate-800">{affiliationNo}</span> • OASIS: <span className="font-mono font-bold text-slate-800">{oasisCode}</span>
                </p>
                <p className="text-[9px] text-slate-500 truncate max-w-md">
                  {schoolAddress} • Tel: {schoolPhone} • Email: {schoolEmail}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider border shadow-2xs ${badgeColor}`}>
                {copyLabel}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                UDISE+: {udiseCode}
              </span>
            </div>
          </div>

          {/* Receipt Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 py-1.5 border-b border-slate-200 bg-slate-50/80 px-2 rounded-md my-1.5 text-[10px]">
            <div>
              <span className="text-slate-500 block text-[8.5px] font-bold uppercase">Receipt Number</span>
              <span className="font-mono font-extrabold text-emerald-900 text-[11px]">{receiptNo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8.5px] font-bold uppercase">Payment Date</span>
              <span className="font-mono font-bold text-slate-900">{paymentDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8.5px] font-bold uppercase">Academic Session</span>
              <span className="font-mono font-bold text-slate-900">{session}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[8.5px] font-bold uppercase">Payment Mode</span>
              <span className="font-mono font-bold text-emerald-800">{paymentMode} {txnRef ? `(${txnRef})` : ''}</span>
            </div>
          </div>

          {/* Student Profile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 py-1 text-[10.5px]">
            <div>
              <span className="text-slate-500 text-[9px]">Scholar Name: </span>
              <span className="font-bold text-slate-900">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px]">Admission / Adm No: </span>
              <span className="font-mono font-bold text-slate-900">{admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px]">Class & Section: </span>
              <span className="font-bold text-slate-900">{className} - {section} (Roll: {rollNo})</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px]">Father / Guardian: </span>
              <span className="font-semibold text-slate-900">{fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px]">Contact No: </span>
              <span className="font-mono font-semibold text-slate-900">{mobile}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[9px]">House: </span>
              <span className="font-bold text-slate-900">{studentHouse}</span>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="mt-1.5 border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead className="bg-slate-100 font-mono font-bold text-slate-700 uppercase border-b border-slate-300 text-[9px]">
                <tr>
                  <th className="py-1 px-2 w-8 text-center border-r border-slate-300">#</th>
                  <th className="py-1 px-2 border-r border-slate-300">Fee Head / Description</th>
                  <th className="py-1 px-2 border-r border-slate-300">Period / Month</th>
                  <th className="py-1 px-2 text-right w-24">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {particulars.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-0.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-0.5 px-2 font-semibold text-slate-800 border-r border-slate-200">
                      {item.head}
                    </td>
                    <td className="py-0.5 px-2 font-mono text-slate-600 border-r border-slate-200">
                      {item.period}
                    </td>
                    <td className="py-0.5 px-2 text-right font-mono font-bold text-slate-900">
                      ₹{item.amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="py-1 px-2 text-right uppercase text-[9.5px] text-slate-700 border-r border-slate-300">
                    Total Amount Paid:
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[11px] font-black text-emerald-900">
                    ₹{totalAmountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Notes */}
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9.5px]">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[8.5px]">Amount in Words: </span>
              <span className="font-bold text-slate-800 italic">{amountInWords}</span>
            </div>
            {receipt.is_cancelled && (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono font-bold text-[9px] rounded border border-rose-300 uppercase">
                ⚠️ RECEIPT CANCELLED ({receipt.cancelled_reason || 'Void'})
              </span>
            )}
          </div>
        </div>

        {/* Footer & Signatures */}
        <div className="mt-2 pt-2 border-t border-slate-300 flex items-end justify-between text-[9px] text-slate-500">
          <div>
            <p>• {remarks}</p>
            <p>• Computer Generated Valid Fee Receipt • Cashier: <strong className="text-slate-700">{collectedBy}</strong></p>
          </div>
          <div className="flex items-end gap-6 text-center">
            <div className="border-t border-slate-400 pt-0.5 px-3">
              <span className="text-[8.5px] font-mono text-slate-400 block mb-3">School Stamp</span>
              <span className="font-bold text-slate-700 text-[9px]">Official Seal</span>
            </div>
            <div className="border-t border-slate-400 pt-0.5 px-3">
              <span className="text-[8.5px] font-mono text-slate-400 block mb-3">Verified By</span>
              <span className="font-bold text-slate-700 text-[9px]">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Container Dialog */}
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-fade-in">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-3 sm:p-4 bg-[#122A24] text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/60 flex items-center justify-center text-white">
              <Receipt className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                Official CBSE Fee Receipt (Dual A4 Sheet Format)
              </h3>
              <p className="text-[11px] text-emerald-200/80 font-mono">
                Receipt #{receiptNo} • 2 Copies per A4 Sheet (Parent Copy + School Counterfoil)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all border-none"
            >
              <Printer className="w-4 h-4" />
              <span>Print 2-Copy A4 Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border-none transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/70">
          
          {/* A4 Sheet Container */}
          <div 
            ref={printContainerRef}
            id="dual-a4-receipt-printable"
            className="dual-receipt-page max-w-[210mm] mx-auto bg-white shadow-xl rounded-xl p-3 sm:p-4 space-y-2 border border-slate-300"
          >
            {/* 1. TOP COPY: STUDENT / PARENT COPY */}
            {renderReceiptCopy('PARENT_COPY')}

            {/* 2. PERFORATED CUT LINE DIVIDER */}
            <div className="relative py-1 flex items-center justify-center my-0.5">
              <div className="border-t-2 border-dashed border-slate-400 w-full" />
              <div className="absolute bg-white px-3 py-0.5 rounded-full border border-slate-300 text-[8.5px] font-mono font-bold text-slate-500 flex items-center gap-1.5 uppercase shadow-2xs">
                <Scissors className="w-3 h-3 text-slate-600" />
                <span>✂ Cut Here — School / Office Counterfoil Copy ✂</span>
              </div>
            </div>

            {/* 3. BOTTOM COPY: OFFICE / SCHOOL COUNTERFOIL */}
            {renderReceiptCopy('SCHOOL_COPY')}
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500 font-mono print:hidden">
          <span>Standard A4 Portrait Layout • Auto Fits on 1 Page (No Spillover)</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 6mm !important;
          }
          body * {
            visibility: hidden;
          }
          #dual-a4-receipt-printable, #dual-a4-receipt-printable * {
            visibility: visible;
          }
          #dual-a4-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .receipt-single-copy {
            border: 1.5px solid #334155 !important;
            padding: 8px 10px !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
