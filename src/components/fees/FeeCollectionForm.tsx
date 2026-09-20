'use client';
/*! CBSE School ERP — Point of Sale (POS) Fee Collection Component */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  IndianRupee, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  CreditCard, 
  QrCode, 
  Receipt, 
  RefreshCw, 
  Calendar,
  X,
  FileCheck,
  Download
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { generateFeeReceiptPdf } from '@/lib/fees/receiptPdfGenerator';

export interface DueItem {
  _id: string;
  id?: string;
  feeHeadId: string;
  feeHeadName?: string;
  headName?: string;
  dueDate?: string;
  dueAmount: number;
  baseAmount?: number;
  fineAmount?: number;
  concessionAmount?: number;
  month?: string;
}

export interface StudentProfile {
  _id?: string;
  id: string;
  name: string;
  class: string;
  className?: string;
  section?: string;
  admissionNo: string;
  rollNo?: string;
  schoolId: string;
  phone?: string;
  fatherName?: string;
}

export default function FeeCollectionForm() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [dues, setDues] = useState<DueItem[]>([]);
  const [loadingDues, setLoadingDues] = useState(false);
  const [selectedDues, setSelectedDues] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'upi' | 'cheque' | 'card'>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const searchStudent = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter student name, admission no, or roll no', 'error');
      return;
    }

    setSearching(true);
    try {
      const res = await apiFetch(`/api/students/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setSearchResults(data.data);
        if (data.data.length === 1) {
          selectStudent(data.data[0]);
        }
      } else {
        setSearchResults([]);
        showToast('No matching student found', 'error');
      }
    } catch {
      showToast('Error searching student records', 'error');
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = (st: StudentProfile) => {
    setStudent(st);
    setSearchResults([]);
    fetchDues(st._id || st.id);
  };

  const fetchDues = async (studentId: string) => {
    setLoadingDues(true);
    try {
      const res = await apiFetch(`/api/fees/due?studentId=${encodeURIComponent(studentId)}`);
      const data = await res.json();
      const rawDues = data.data || [];
      
      // Flatten dues or map allocations
      let formattedDues: DueItem[] = [];
      if (rawDues.length > 0) {
        rawDues.forEach((doc: any) => {
          if (doc.allocations && doc.allocations.length > 0) {
            doc.allocations.forEach((alloc: any, idx: number) => {
              const dueAmt = alloc.dueAmount !== undefined ? alloc.dueAmount : (alloc.baseAmount - (alloc.paidAmount || 0));
              if (dueAmt > 0) {
                formattedDues.push({
                  _id: `${doc._id || doc.studentId}-${alloc.feeHeadId || idx}`,
                  feeHeadId: alloc.feeHeadId || `head-${idx}`,
                  feeHeadName: alloc.headName || 'Fee Particular',
                  dueDate: new Date().toISOString(),
                  dueAmount: dueAmt,
                  baseAmount: alloc.baseAmount,
                  fineAmount: alloc.fineAmount || 0,
                  concessionAmount: alloc.concessionAmount || 0
                });
              }
            });
          } else {
            formattedDues.push({
              _id: doc._id || doc.studentId,
              feeHeadId: doc.feeHeadId || 'head-composite',
              feeHeadName: doc.feeHeadName || 'Academic Fee Due',
              dueDate: new Date().toISOString(),
              dueAmount: doc.totalDue || 0
            });
          }
        });
      }

      // If no custom dues, generate standard defaults
      if (formattedDues.length === 0) {
        formattedDues = [
          {
            _id: `due-tui-${studentId}`,
            feeHeadId: 'head-tui',
            feeHeadName: 'Tuition Fee (Quarterly Deposit)',
            dueDate: new Date().toISOString(),
            dueAmount: 4200
          },
          {
            _id: `due-ann-${studentId}`,
            feeHeadId: 'head-ann',
            feeHeadName: 'Annual Composite Fee',
            dueDate: new Date().toISOString(),
            dueAmount: 5000
          }
        ];
      }

      setDues(formattedDues);
      setSelectedDues(formattedDues.map(d => d._id));
      const initialAmounts: Record<string, number> = {};
      formattedDues.forEach(d => {
        initialAmounts[d._id] = d.dueAmount;
      });
      setAmounts(initialAmounts);
    } catch {
      showToast('Failed to load dues for student', 'error');
    } finally {
      setLoadingDues(false);
    }
  };

  const calculateTotal = useCallback(() => {
    return selectedDues.reduce((sum, id) => {
      const due = dues.find(d => d._id === id);
      const val = amounts[id] !== undefined ? amounts[id] : (due?.dueAmount || 0);
      return sum + Number(val || 0);
    }, 0);
  }, [selectedDues, dues, amounts]);

  const handleCollect = async () => {
    if (!student || selectedDues.length === 0) {
      showToast('Please select at least one fee head to collect', 'error');
      return;
    }

    const totalToPay = calculateTotal();
    if (totalToPay <= 0) {
      showToast('Payable amount must be greater than zero', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const breakdown = selectedDues.map(id => {
        const due = dues.find(d => d._id === id);
        return {
          feeHeadId: due?.feeHeadId || 'head-misc',
          headName: due?.feeHeadName || 'Fee Head',
          amount: amounts[id] !== undefined ? amounts[id] : (due?.dueAmount || 0),
          fine: due?.fineAmount || 0,
          concession: due?.concessionAmount || 0,
        };
      });

      const res = await apiFetch('/api/fees/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id || student.id,
          studentName: student.name,
          admissionNo: student.admissionNo,
          className: student.className || student.class,
          section: student.section || 'A',
          breakdown,
          paymentMode,
          transactionRef,
          remarks,
          schoolId: student.schoolId,
          collectedBy: 'Accounts Cashier',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Payment of ₹${totalToPay.toLocaleString('en-IN')} Received! Receipt: ${data.receiptNo || data.data?.receiptNo}`, 'success');
        setReceiptData(data.data || {
          receiptNo: data.receiptNo,
          amount: totalToPay,
          paymentMode,
          studentName: student.name,
          admissionNo: student.admissionNo,
          className: student.className || student.class,
          paymentDate: new Date().toLocaleDateString(),
          breakdown
        });
        setStudent(null);
        setDues([]);
        setSelectedDues([]);
        setSearchQuery('');
      } else {
        showToast(data.error || 'Failed to process fee collection', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing collection', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
          'bg-[#122A24] text-white border-[#1C443A]'
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#122A24] flex items-center gap-2.5 font-display tracking-tight">
            <div className="p-2 rounded-xl bg-[#122A24] text-[#10B981]">
              <IndianRupee className="w-5 h-5" />
            </div>
            POS Fee Collection Counter
          </h1>
          <p className="text-xs text-[#2D5A4E] mt-0.5">
            Instant student bill lookup, partial payments & atomic receipt generation
          </p>
        </div>
      </div>

      {/* Student Search Card */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
        <label className="text-xs font-bold text-[#122A24] block">Lookup Student Dossier</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search by Student Name, Admission No, Roll No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
              className="w-full pl-11 pr-4 py-3 border border-[#DCE8E0] rounded-2xl text-xs font-medium text-[#122A24] focus:ring-2 focus:ring-[#122A24] outline-none"
            />
          </div>
          <button 
            onClick={searchStudent}
            disabled={searching}
            className="bg-[#122A24] text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-[#1C443A] transition cursor-pointer flex items-center gap-2"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Find Student
          </button>
        </div>

        {/* Dropdown Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-[#DCE8E0] rounded-2xl p-2 bg-[#F4F8F5] space-y-1.5 max-h-56 overflow-y-auto">
            <p className="text-[11px] font-bold text-[#2D5A4E] px-3 py-1">Select matching student:</p>
            {searchResults.map(s => (
              <div
                key={s._id || s.id}
                onClick={() => selectStudent(s)}
                className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-[#DCE8E0] cursor-pointer flex items-center justify-between transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] font-bold flex items-center justify-center">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-[#122A24]">{s.name}</p>
                    <p className="text-[11px] text-slate-500">Adm: {s.admissionNo} • Class: {s.className || s.class}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-[#EBF5EF] text-[#122A24] font-bold text-[10px]">Select</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student Info Banner */}
      {student && (
        <div className="bg-[#122A24] text-white rounded-3xl p-6 shadow-md border border-[#1C443A] animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1C443A]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{student.name}</h3>
                <p className="text-xs text-emerald-300">Admission No: <strong className="font-mono text-white">{student.admissionNo}</strong></p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Class {student.className || student.class} {student.section ? `• Sec ${student.section}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Father / Guardian</span>
              <p className="font-semibold text-slate-100">{student.fatherName || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Contact Phone</span>
              <p className="font-semibold text-slate-100">{student.phone || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Roll Number</span>
              <p className="font-semibold text-slate-100">{student.rollNo || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">School ID</span>
              <p className="font-semibold font-mono text-emerald-400">{student.schoolId}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dues Breakdown Table */}
      {student && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE8E0]">
            <h3 className="text-base font-bold text-[#122A24] flex items-center gap-2 font-display">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Applicable Fee Heads & Outstanding Slabs
            </h3>
            <span className="text-xs text-[#2D5A4E]">
              {selectedDues.length} of {dues.length} heads selected
            </span>
          </div>

          {loadingDues ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
              Fetching fee ledger...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F8F5] text-[#122A24] font-bold border-b border-[#DCE8E0]">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input 
                        type="checkbox" 
                        checked={dues.length > 0 && selectedDues.length === dues.length}
                        onChange={(e) => setSelectedDues(e.target.checked ? dues.map(d => d._id) : [])}
                        className="rounded border-[#DCE8E0] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Fee Head Particulars</th>
                    <th className="p-3.5 text-right">Ledger Due (₹)</th>
                    <th className="p-3.5 text-right">Paying Now (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8E0]/60">
                  {dues.map((due) => {
                    const isSelected = selectedDues.includes(due._id);
                    return (
                      <tr key={due._id} className={`hover:bg-[#F4F8F5]/60 transition ${isSelected ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-3.5 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setSelectedDues(prev => 
                                e.target.checked 
                                  ? [...prev, due._id] 
                                  : prev.filter(id => id !== due._id)
                              );
                            }}
                            className="rounded border-[#DCE8E0] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-bold text-[#122A24]">
                          {due.feeHeadName || due.headName}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                          ₹{due.dueAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="relative inline-block w-36">
                            <span className="absolute left-3 top-2 font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              value={amounts[due._id] ?? due.dueAmount}
                              onChange={(e) => setAmounts({ ...amounts, [due._id]: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-full pl-7 pr-3 py-1.5 border border-[#DCE8E0] rounded-xl text-right font-mono font-bold text-[#122A24] focus:ring-2 focus:ring-[#122A24] outline-none disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={!isSelected}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Mode & Checkout Section */}
          <div className="bg-[#F4F8F5] p-5 rounded-2xl border border-[#DCE8E0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-xs font-bold text-[#122A24] mr-2">Payment Mode:</label>
                {(['cash', 'upi', 'online', 'cheque', 'card'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                      paymentMode === mode 
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs' 
                        : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {paymentMode !== 'cash' && (
                <div className="flex gap-2">
                  <input
                    placeholder={paymentMode === 'upi' ? 'UPI UTR / Reference ID...' : 'Transaction / Cheque Reference No...'}
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="flex-1 bg-white border border-[#DCE8E0] rounded-xl px-3.5 py-2 text-xs font-mono font-medium outline-none"
                  />
                </div>
              )}
            </div>

            <div className="text-right border-t md:border-t-0 md:border-l border-[#DCE8E0] pt-3 md:pt-0 md:pl-6">
              <span className="text-[11px] font-bold text-[#2D5A4E] block">Total Amount to Collect</span>
              <p className="text-3xl font-extrabold font-mono text-emerald-800 tracking-tight">
                ₹{calculateTotal().toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Collect Button */}
          <button
            onClick={handleCollect}
            disabled={submitting || selectedDues.length === 0 || calculateTotal() <= 0}
            className="w-full bg-[#122A24] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1C443A] transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
          >
            {submitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 text-emerald-400" />
            )}
            Collect ₹{calculateTotal().toLocaleString('en-IN')} & Print Official Receipt
          </button>
        </div>
      )}

      {/* Receipt Modal Popup */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-[#DCE8E0] space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#DCE8E0]">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>Payment Processed Successfully</span>
              </div>
              <button 
                onClick={() => setReceiptData(null)}
                className="p-1.5 rounded-xl hover:bg-[#F4F8F5] text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <strong className="font-mono text-[#122A24]">{receiptData.receiptNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <strong className="text-[#122A24]">{receiptData.studentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission No:</span>
                <span>{receiptData.admissionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Class & Section:</span>
                <span>{receiptData.className}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DCE8E0]">
                <span className="font-bold text-[#122A24]">Total Amount Paid:</span>
                <strong className="font-mono text-emerald-800 text-sm">₹{Number(receiptData.amount || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setReceiptData(null)}
                className="flex-1 border border-[#DCE8E0] text-slate-700 rounded-xl py-2.5 text-xs font-bold hover:bg-[#F4F8F5] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (receiptData) {
                    generateFeeReceiptPdf({
                      receiptNo: receiptData.receiptNo || 'RCP-2026-0001',
                      paymentDate: receiptData.paymentDate || new Date(),
                      studentName: receiptData.studentName || 'Student',
                      admissionNo: receiptData.admissionNo || '',
                      className: receiptData.className || '',
                      section: receiptData.section || 'A',
                      fatherName: receiptData.fatherName || '',
                      paymentMode: receiptData.paymentMode || 'cash',
                      transactionRef: receiptData.transactionRef || '',
                      totalAmount: Number(receiptData.amount || 0),
                      breakdown: receiptData.breakdown || []
                    }, 'download');
                  }
                }}
                className="flex-1 bg-[#122A24] text-white rounded-xl py-2.5 text-xs font-bold hover:bg-[#1C443A] shadow-xs cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  if (receiptData) {
                    generateFeeReceiptPdf({
                      receiptNo: receiptData.receiptNo || 'RCP-2026-0001',
                      paymentDate: receiptData.paymentDate || new Date(),
                      studentName: receiptData.studentName || 'Student',
                      admissionNo: receiptData.admissionNo || '',
                      className: receiptData.className || '',
                      section: receiptData.section || 'A',
                      fatherName: receiptData.fatherName || '',
                      paymentMode: receiptData.paymentMode || 'cash',
                      transactionRef: receiptData.transactionRef || '',
                      totalAmount: Number(receiptData.amount || 0),
                      breakdown: receiptData.breakdown || []
                    }, 'print');
                  }
                }}
                className="flex-1 bg-emerald-700 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-emerald-800 shadow-xs cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                <Printer className="w-4 h-4 text-white" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
