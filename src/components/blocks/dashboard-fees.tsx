'use client';

import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  BarChart2,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Download,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  QrCode,
  X,
  Check,
  Trash2,
  Layers,
  Building2,
  UserCheck,
  Receipt,
  FileSpreadsheet,
  Coins,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  Landmark,
  Calculator,
  User,
  GraduationCap
} from 'lucide-react';
import { FeeInvoice, Student, School, ClassRoom, Teacher } from '@/lib/types';
import { sortClassesChronologically } from '@/lib/cbse-subjects';

export interface DashboardFeesProps {
  selectedSchool?: School | null;
  students: Student[];
  invoices: FeeInvoice[];
  classes: ClassRoom[];
  teachers: Teacher[];
  selectedSession: string;
  subTab?: 'collect' | 'overview' | 'monthly' | 'structure' | 'payroll';
  onRefresh?: () => void;
  showAdminToast?: (msg: string) => void;
}

// Convert Number to Indian Rupees Words
function numberToWordsINR(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (n > 0) res += inWords(n);

  return 'Rupees ' + res.trim() + ' Only';
}

export function DashboardFees({
  selectedSchool,
  students,
  invoices: initialInvoices,
  classes,
  teachers,
  selectedSession,
  subTab = 'collect',
  onRefresh,
  showAdminToast
}: DashboardFeesProps) {
  // 5 Primary Navigation Tabs (Identical layout to Attendance Hub)
  const [feeTab, setFeeTab] = useState<'collect' | 'overview' | 'monthly' | 'structure' | 'payroll'>(subTab);
  const [invoices, setInvoices] = useState<FeeInvoice[]>(initialInvoices || []);

  // Unique Chronologically Sorted Class Names
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(c => {
      const name = c.class_name || c.name;
      if (name) set.add(name);
    });
    students.forEach(s => {
      if (s.class_name) set.add(s.class_name);
    });
    const list = Array.from(set).map(name => ({ class_name: name }));
    return sortClassesChronologically(list).map(item => item.class_name || '').filter(Boolean);
  }, [classes, students]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modals
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<FeeInvoice | null>(null);
  const [selectedPayslipTeacher, setSelectedPayslipTeacher] = useState<Teacher | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueMode, setIssueMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Quick Collect Form State
  const [collectStudentId, setCollectStudentId] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState('UPI');
  const [collectRemarks, setCollectRemarks] = useState('');
  const [collectChequeNo, setCollectChequeNo] = useState('');
  const [collectBankName, setCollectBankName] = useState('');
  const [collectQuarter, setCollectQuarter] = useState('Quarter 1 (Apr - Jun)');
  const [isProcessingCollect, setIsProcessingCollect] = useState(false);
  const [collectSuccess, setCollectSuccess] = useState('');

  // Single Invoice Creation State & Filters
  const [singleStudentId, setSingleStudentId] = useState('');
  const [singleFilterClass, setSingleFilterClass] = useState('ALL');
  const [singleFilterSection, setSingleFilterSection] = useState('ALL');
  const [singleSearchQuery, setSingleSearchQuery] = useState('');
  const [singleTuition, setSingleTuition] = useState('14500');
  const [singleTransport, setSingleTransport] = useState('3500');
  const [singleLabExam, setSingleLabExam] = useState('2000');
  const [singleAnnual, setSingleAnnual] = useState('4000');
  const [singleConcession, setSingleConcession] = useState('0');
  const [singleDueDate, setSingleDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [singleMonth, setSingleMonth] = useState('April 2026');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Quick Collect Filters & Search
  const [collectFilterClass, setCollectFilterClass] = useState('ALL');
  const [collectFilterSection, setCollectFilterSection] = useState('ALL');
  const [collectSearchQuery, setCollectSearchQuery] = useState('');

  // Batch Invoice Creation State
  const [batchClass, setBatchClass] = useState(() => uniqueClasses[0] || 'Class 10');
  const [batchSection, setBatchSection] = useState('ALL');
  const [batchTuition, setBatchTuition] = useState('14500');
  const [batchTransport, setBatchTransport] = useState('3500');
  const [batchLabExam, setBatchLabExam] = useState('2000');
  const [batchDueDate, setBatchDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [batchMonth, setBatchMonth] = useState('April 2026');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // Update batchClass when uniqueClasses loads
  React.useEffect(() => {
    if (uniqueClasses.length > 0 && (!batchClass || !uniqueClasses.includes(batchClass))) {
      setBatchClass(uniqueClasses[0]);
    }
  }, [uniqueClasses]);

  // Sync initialInvoices prop
  React.useEffect(() => {
    setInvoices(initialInvoices || []);
  }, [initialInvoices]);

  const notify = (msg: string) => {
    if (showAdminToast) {
      showAdminToast(msg);
    } else {
      alert(msg);
    }
  };

  // Filtered Students for Single Invoice Issuance
  const filteredIssueStudents = useMemo(() => {
    return students.filter(s => {
      if (singleFilterClass !== 'ALL') {
        const target = singleFilterClass.toLowerCase().replace(/^class\s*/i, '').trim();
        const sc = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
        if (target !== sc && s.class_name?.toLowerCase() !== singleFilterClass.toLowerCase()) return false;
      }
      if (singleFilterSection !== 'ALL' && (s.section || 'A').toUpperCase() !== singleFilterSection.toUpperCase()) return false;
      if (singleSearchQuery.trim()) {
        const q = singleSearchQuery.toLowerCase();
        const nameMatch = (s.full_name || '').toLowerCase().includes(q);
        const admMatch = (s.admission_no || s.id || '').toLowerCase().includes(q);
        const rollMatch = String(s.roll_no || '').toLowerCase().includes(q);
        const phoneMatch = (s.guardian_phone || s.phone || '').toLowerCase().includes(q);
        const guardianMatch = (s.guardian_name || '').toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !rollMatch && !phoneMatch && !guardianMatch) return false;
      }
      return true;
    });
  }, [students, singleFilterClass, singleFilterSection, singleSearchQuery]);

  // Selected student in Issue Modal
  const selectedSingleStudent = useMemo(() => {
    return students.find(s => s.id === singleStudentId) || (filteredIssueStudents.length > 0 ? filteredIssueStudents[0] : null);
  }, [students, singleStudentId, filteredIssueStudents]);

  // Auto-sync singleStudentId when issue filters change
  React.useEffect(() => {
    if (filteredIssueStudents.length > 0) {
      if (!singleStudentId || !filteredIssueStudents.some(s => s.id === singleStudentId)) {
        setSingleStudentId(filteredIssueStudents[0].id);
      }
    } else {
      setSingleStudentId('');
    }
  }, [filteredIssueStudents, singleStudentId]);

  // Filtered Students for Quick Collect Counter
  const filteredCollectStudents = useMemo(() => {
    return students.filter(s => {
      if (collectFilterClass !== 'ALL') {
        const target = collectFilterClass.toLowerCase().replace(/^class\s*/i, '').trim();
        const sc = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
        if (target !== sc && s.class_name?.toLowerCase() !== collectFilterClass.toLowerCase()) return false;
      }
      if (collectFilterSection !== 'ALL' && (s.section || 'A').toUpperCase() !== collectFilterSection.toUpperCase()) return false;
      if (collectSearchQuery.trim()) {
        const q = collectSearchQuery.toLowerCase();
        const nameMatch = (s.full_name || '').toLowerCase().includes(q);
        const admMatch = (s.admission_no || s.id || '').toLowerCase().includes(q);
        const rollMatch = String(s.roll_no || '').toLowerCase().includes(q);
        const phoneMatch = (s.guardian_phone || s.phone || '').toLowerCase().includes(q);
        const guardianMatch = (s.guardian_name || '').toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !rollMatch && !phoneMatch && !guardianMatch) return false;
      }
      return true;
    });
  }, [students, collectFilterClass, collectFilterSection, collectSearchQuery]);

  // Batch matching students
  const batchMatchingStudents = useMemo(() => {
    return students.filter(s => {
      const target = batchClass.toLowerCase().replace(/^class\s*/i, '').trim();
      const sc = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
      if (target !== sc && s.class_name?.toLowerCase() !== batchClass.toLowerCase()) return false;
      if (batchSection !== 'ALL' && (s.section || 'A').toUpperCase() !== batchSection.toUpperCase()) return false;
      return true;
    });
  }, [students, batchClass, batchSection]);

  // Selected student for quick collect
  const selectedCollectStudent = useMemo(() => {
    return students.find(s => s.id === collectStudentId) || (filteredCollectStudents.length > 0 ? filteredCollectStudents[0] : null);
  }, [students, collectStudentId, filteredCollectStudents]);

  // Auto-sync collectStudentId when collect filters change
  React.useEffect(() => {
    if (filteredCollectStudents.length > 0) {
      if (!collectStudentId || !filteredCollectStudents.some(s => s.id === collectStudentId)) {
        setCollectStudentId(filteredCollectStudents[0].id);
      }
    } else {
      setCollectStudentId('');
    }
  }, [filteredCollectStudents, collectStudentId]);

  // Selected student pending invoices
  const studentPendingInvoices = useMemo(() => {
    if (!collectStudentId) return [];
    return invoices.filter(inv => inv.student_id === collectStudentId && inv.status !== 'PAID');
  }, [invoices, collectStudentId]);

  // Auto-fill amount when student is selected
  React.useEffect(() => {
    if (selectedCollectStudent) {
      const pending = studentPendingInvoices.reduce((acc, inv) => acc + ((inv.amount || 0) - (inv.paid_amount || 0)), 0);
      if (pending > 0) {
        setCollectAmount(pending.toString());
      } else {
        setCollectAmount('15000');
      }
    }
  }, [selectedCollectStudent, studentPendingInvoices]);

  // Financial KPIs
  const totalBilled = useMemo(() => invoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0), [invoices]);
  const totalPaid = useMemo(() => invoices.reduce((acc, inv) => acc + (inv.paid_amount ?? (inv.status === 'PAID' ? (Number(inv.amount) || 0) : 0)), 0), [invoices]);
  const totalDue = useMemo(() => Math.max(0, totalBilled - totalPaid), [totalBilled, totalPaid]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (classFilter !== 'ALL' && inv.class_name !== classFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = (inv.student_name || '').toLowerCase();
        const iNo = (inv.invoice_no || '').toLowerCase();
        const cName = (inv.class_name || '').toLowerCase();
        const admNo = (inv.student_id || '').toLowerCase();
        if (!sName.includes(q) && !iNo.includes(q) && !cName.includes(q) && !admNo.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, classFilter, searchQuery]);

  // Quick Collect Handler
  const handleQuickCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectStudentId || !selectedCollectStudent) {
      notify('Please choose a valid student for fee collection.');
      return;
    }
    const amt = parseFloat(collectAmount) || 0;
    if (amt <= 0) {
      notify('Please enter a valid fee amount.');
      return;
    }

    setIsProcessingCollect(true);
    const receiptNo = `REC-${selectedSession.replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const payload: Partial<FeeInvoice> = {
        school_id: selectedSchool?.id || 'DPS2026',
        student_id: selectedCollectStudent.id,
        student_name: selectedCollectStudent.full_name,
        class_name: `${selectedCollectStudent.class_name} - ${selectedCollectStudent.section || 'A'}`,
        academic_session: selectedSession,
        invoice_no: receiptNo,
        month: collectQuarter,
        amount: amt,
        paid_amount: amt,
        status: 'PAID',
        payment_mode: collectMode,
        due_date: new Date().toISOString().split('T')[0],
        tuition_fee: Math.round(amt * 0.7),
        transport_fee: Math.round(amt * 0.2),
        exam_fee: Math.round(amt * 0.1)
      };

      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        const savedInvoice: FeeInvoice = data.invoice || {
          ...payload,
          id: `inv-${Date.now()}`,
          created_at: new Date().toISOString()
        } as FeeInvoice;

        setInvoices(prev => [savedInvoice, ...prev]);
        setSelectedReceiptInvoice(savedInvoice);
        setCollectSuccess(`Payment of ₹${amt.toLocaleString()} recorded successfully for ${selectedCollectStudent.full_name}! Receipt #${receiptNo} created.`);
        notify(`Fee Payment Recorded: Receipt #${receiptNo}`);

        if (onRefresh) onRefresh();
        setCollectAmount('');
        setCollectRemarks('');
        setCollectChequeNo('');
      } else {
        notify(`Payment record failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error(err);
      notify(`Connection error: ${err.message}`);
    } finally {
      setIsProcessingCollect(false);
    }
  };

  // Create Single Invoice
  const handleCreateSingleInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === singleStudentId);
    if (!student) {
      notify('Please select a student');
      return;
    }

    const t = parseFloat(singleTuition) || 0;
    const tr = parseFloat(singleTransport) || 0;
    const le = parseFloat(singleLabExam) || 0;
    const ann = parseFloat(singleAnnual) || 0;
    const disc = parseFloat(singleConcession) || 0;
    const total = Math.max(0, t + tr + le + ann - disc);

    if (total <= 0) {
      notify('Total invoice amount must be greater than 0');
      return;
    }

    setIsCreatingInvoice(true);
    const invoiceNo = `INV-${selectedSession.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload: Partial<FeeInvoice> = {
        school_id: selectedSchool?.id || 'DPS2026',
        student_id: student.id,
        student_name: student.full_name,
        class_name: `${student.class_name} - ${student.section || 'A'}`,
        academic_session: selectedSession,
        invoice_no: invoiceNo,
        month: singleMonth,
        amount: total,
        paid_amount: 0,
        status: 'PENDING',
        due_date: singleDueDate,
        tuition_fee: t,
        transport_fee: tr,
        exam_fee: le
      };

      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setInvoices(prev => [data.invoice || (payload as FeeInvoice), ...prev]);
        setShowIssueModal(false);
        notify(`Invoice #${invoiceNo} issued for ${student.full_name}`);
        if (onRefresh) onRefresh();
      } else {
        notify(`Error: ${data.error}`);
      }
    } catch (err: any) {
      notify(`Failed to issue invoice: ${err.message}`);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Create Batch Invoices for a whole class
  const handleCreateBatchInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudents = students.filter(s => {
      if (s.class_name !== batchClass) return false;
      if (batchSection !== 'ALL' && (s.section || 'A') !== batchSection) return false;
      return true;
    });

    if (targetStudents.length === 0) {
      notify(`No active students found in ${batchClass} ${batchSection !== 'ALL' ? `Sec ${batchSection}` : ''}`);
      return;
    }

    const t = parseFloat(batchTuition) || 0;
    const tr = parseFloat(batchTransport) || 0;
    const le = parseFloat(batchLabExam) || 0;
    const total = t + tr + le;

    if (total <= 0) {
      notify('Please enter valid fee components');
      return;
    }

    setIsCreatingBatch(true);
    let createdCount = 0;

    for (const student of targetStudents) {
      const invoiceNo = `INV-${selectedSession.replace('-', '')}-${Math.floor(10000 + Math.random() * 90000)}`;
      try {
        const payload: Partial<FeeInvoice> = {
          school_id: selectedSchool?.id || 'DPS2026',
          student_id: student.id,
          student_name: student.full_name,
          class_name: `${student.class_name} - ${student.section || 'A'}`,
          academic_session: selectedSession,
          invoice_no: invoiceNo,
          month: batchMonth,
          amount: total,
          paid_amount: 0,
          status: 'PENDING',
          due_date: batchDueDate,
          tuition_fee: t,
          transport_fee: tr,
          exam_fee: le
        };

        const res = await fetch('/api/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          createdCount++;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setIsCreatingBatch(false);
    setShowIssueModal(false);
    notify(`Batch Invoicing Complete: ${createdCount} invoices issued for ${batchClass}!`);
    if (onRefresh) onRefresh();
  };

  // Mark invoice as Paid
  const handleMarkAsPaid = async (inv: FeeInvoice) => {
    if (!window.confirm(`Mark invoice #${inv.invoice_no} (${inv.student_name} - ₹${inv.amount.toLocaleString()}) as PAID?`)) return;

    try {
      const res = await fetch('/api/fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: inv.id,
          status: 'PAID',
          payment_mode: 'UPI'
        })
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: 'PAID', paid_amount: item.amount, payment_mode: 'UPI' } : item));
        notify(`Invoice #${inv.invoice_no} marked as PAID.`);
        if (onRefresh) onRefresh();
      } else {
        notify(`Failed to update: ${data.error}`);
      }
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (inv: FeeInvoice) => {
    if (!window.confirm(`Are you sure you want to void / delete invoice #${inv.invoice_no} for ${inv.student_name}?`)) return;

    try {
      const res = await fetch(`/api/fees?id=${inv.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInvoices(prev => prev.filter(item => item.id !== inv.id));
        notify(`Invoice #${inv.invoice_no} deleted successfully.`);
        if (onRefresh) onRefresh();
      } else {
        notify(`Failed to delete invoice: ${data.error}`);
      }
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      notify('No fee records to export.');
      return;
    }

    const headers = ['Invoice No', 'Student ID', 'Student Name', 'Class', 'Session', 'Month / Quarter', 'Amount (INR)', 'Paid (INR)', 'Status', 'Payment Mode', 'Due Date'];
    const rows = invoices.map(i => [
      `"${i.invoice_no || ''}"`,
      `"${i.student_id || ''}"`,
      `"${i.student_name || ''}"`,
      `"${i.class_name || ''}"`,
      `"${i.academic_session || selectedSession}"`,
      `"${i.month || ''}"`,
      i.amount || 0,
      i.paid_amount ?? (i.status === 'PAID' ? i.amount : 0),
      `"${i.status}"`,
      `"${i.payment_mode || 'N/A'}"`,
      `"${i.due_date || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Ledger_${(selectedSchool?.school_code || 'DPS2026')}_${selectedSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Fee ledger CSV downloaded.');
  };

  // Months for report
  const MONTHS = ['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026', 'January 2027', 'February 2027', 'March 2027'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & DEDICATED RESPONSIVE TABS BAR (MATCHING ATTENDANCE HUB)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8F0EA]">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
              <Coins className="h-7 w-7 text-emerald-700 shrink-0" />
              <span>Fee Hub &amp; Institutional Accounts</span>
            </h1>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Daily student fee counter, month-wise collections, CBSE approved fee structure, and faculty payroll registers
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
              Session {selectedSession || '2026-27'}
            </span>
          </div>
        </div>

        {/* 5 Primary Navigation Buttons (Full-Width Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs">
          
          {/* Tab 1: Quick Collect Counter */}
          <button
            type="button"
            onClick={() => setFeeTab('collect')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              feeTab === 'collect'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <CreditCard className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Collect Fees (Counter)</span>
          </button>

          {/* Tab 2: Fee Overview & Ledger */}
          <button
            type="button"
            onClick={() => setFeeTab('overview')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              feeTab === 'overview'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <BarChart2 className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Fee Ledger ({invoices.length})</span>
          </button>

          {/* Tab 3: Monthly Sheet */}
          <button
            type="button"
            onClick={() => setFeeTab('monthly')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              feeTab === 'monthly'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <CalendarDays className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Month-Wise Sheet</span>
          </button>

          {/* Tab 4: Fee Structure & Calendar */}
          <button
            type="button"
            onClick={() => setFeeTab('structure')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              feeTab === 'structure'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <FileText className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Fee Structure</span>
          </button>

          {/* Tab 5: Staff Payroll */}
          <button
            type="button"
            onClick={() => setFeeTab('payroll')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              feeTab === 'payroll'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Wallet className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Faculty Payroll</span>
          </button>

        </div>

        {/* Sub-Header Key Metrics Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-[#F0FDF4] text-emerald-800 border border-[#BBF7D0] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Collected: ₹{totalPaid.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Pending: ₹{totalDue.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              Total Billed: ₹{totalBilled.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIssueModal(true)}
              className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Issue Fee Invoice
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: QUICK FEE COLLECT COUNTER
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'collect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Counter Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
            <div className="pb-3 border-b border-[#E8F0EA] flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">Instant Student Fee Collection</h2>
                <p className="text-xs text-[#2D5A4E]">Accept payments via UPI, Cash, Cheque, or Net Banking with real-time CBSE receipt generation</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold rounded-lg border border-emerald-200">
                0% Surcharge
              </span>
            </div>

            {collectSuccess && (
              <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{collectSuccess}</span>
                </div>
                {selectedReceiptInvoice && (
                  <button
                    onClick={() => setSelectedReceiptInvoice(selectedReceiptInvoice)}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold text-xs border-none cursor-pointer hover:bg-emerald-800 flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> View Slip
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleQuickCollect} className="space-y-4">
              {/* Quick Search & Filters Bar */}
              <div className="p-3 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#122A24] uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-emerald-700" /> Filter &amp; Search Student
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#C5E2CF] text-[#1C443A]">
                    {filteredCollectStudents.length} Matching
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <select
                      value={collectFilterClass}
                      onChange={(e) => setCollectFilterClass(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#C5E2CF] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Classes</option>
                      {uniqueClasses.map(clsName => (
                        <option key={clsName} value={clsName}>{clsName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={collectFilterSection}
                      onChange={(e) => setCollectFilterSection(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#C5E2CF] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  <div className="sm:col-span-5 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, adm no, roll, phone..."
                      value={collectSearchQuery}
                      onChange={(e) => setCollectSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-white border border-[#C5E2CF] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    {collectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCollectSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Select Student Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1">Select Student *</label>
                {filteredCollectStudents.length > 0 ? (
                  <select
                    value={collectStudentId}
                    onChange={(e) => setCollectStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#C5E2CF] rounded-xl text-xs font-bold text-[#122A24] focus:outline-none focus:bg-white cursor-pointer"
                    required
                  >
                    {filteredCollectStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_no || s.id}) — {s.class_name} {s.section ? `Sec ${s.section}` : ''} • Status: {s.fee_status || 'PENDING'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>No students match the current filter &amp; search.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectFilterClass('ALL');
                        setCollectFilterSection('ALL');
                        setCollectSearchQuery('');
                      }}
                      className="text-xs font-bold text-amber-900 underline border-none bg-transparent cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Student Banner */}
              {selectedCollectStudent && (
                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{selectedCollectStudent.full_name}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                      Adm No: {selectedCollectStudent.admission_no || selectedCollectStudent.id} • Class: {selectedCollectStudent.class_name} {selectedCollectStudent.section || 'A'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Guardian Contact</span>
                    <div className="font-mono font-bold text-[#122A24]">{selectedCollectStudent.guardian_phone || selectedCollectStudent.phone || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Quarter & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#122A24] mb-1">Billing Period / Installment</label>
                  <select
                    value={collectQuarter}
                    onChange={(e) => setCollectQuarter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                  >
                    <option value="Quarter 1 (Apr - Jun)">Quarter 1 (Apr - Jun)</option>
                    <option value="Quarter 2 (Jul - Sep)">Quarter 2 (Jul - Sep)</option>
                    <option value="Quarter 3 (Oct - Dec)">Quarter 3 (Oct - Dec)</option>
                    <option value="Quarter 4 (Jan - Mar)">Quarter 4 (Jan - Mar)</option>
                    <option value="Monthly Installment">Monthly Installment</option>
                    <option value="Annual Full Payment">Annual Full Payment (5% Concession)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#122A24] mb-1">Amount to Collect (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:outline-none focus:bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Mode Pills */}
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: '📱' },
                    { id: 'CASH', label: 'Cash Counter', icon: '💵' },
                    { id: 'NET_BANKING', label: 'NetBanking', icon: '🏦' },
                    { id: 'CHEQUE', label: 'Bank Cheque', icon: '📝' },
                    { id: 'CARD', label: 'POS Card', icon: '💳' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCollectMode(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        collectMode === m.id
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                          : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Cheque Details */}
              {collectMode === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Cheque Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 004819"
                      value={collectChequeNo}
                      onChange={(e) => setCollectChequeNo(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">Drawn On Bank *</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={collectBankName}
                      onChange={(e) => setCollectBankName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">Remarks / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Tuition & Transport paid at Accounts Desk #1"
                  value={collectRemarks}
                  onChange={(e) => setCollectRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:bg-white"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessingCollect}
                className="w-full py-3.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] disabled:opacity-50 text-white font-display font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
              >
                {isProcessingCollect ? (
                  <span>Recording Payment...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Record Payment &amp; Issue Official CBSE Slip (₹{(parseFloat(collectAmount) || 0).toLocaleString()})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Dynamic UPI QR & Recent Collections */}
          <div className="lg:col-span-5 space-y-6">
            {/* Dynamic UPI QR Card */}
            <div className="bg-[#122A24] text-white rounded-3xl border border-[#1C443A] p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-display font-bold text-sm text-white">Instant UPI School QR</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  NPCI / BHIM
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-32 bg-white p-2.5 rounded-2xl shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full border-2 border-dashed border-[#122A24] rounded-lg flex flex-col items-center justify-center text-center p-1">
                    <QrCode className="w-12 h-12 text-[#122A24]" />
                    <span className="text-[9px] font-mono font-bold text-[#122A24] mt-0.5">SCAN &amp; PAY</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-slate-300 text-[11px]">Payee VPA:</div>
                  <div className="font-mono font-bold text-emerald-300 text-xs bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 select-all">
                    {(selectedSchool?.school_code || 'dps2026').toLowerCase()}@sbi
                  </div>
                  <div className="text-[11px] text-slate-300 mt-2">
                    Amount: <strong className="text-white">₹{(parseFloat(collectAmount) || 0).toLocaleString()}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Supports Google Pay, PhonePe, Paytm, BHIM &amp; all Indian UPI apps.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Completed Receipts */}
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
              <div className="pb-3 border-b border-[#E8F0EA] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Recent Receipts Issued</h3>
                  <p className="text-[11px] text-[#2D5A4E]">Latest completed fee counter transactions</p>
                </div>
                <button
                  onClick={() => setFeeTab('overview')}
                  className="text-[11px] font-bold text-emerald-800 hover:underline bg-transparent border-none cursor-pointer"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-2.5">
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="p-3 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] flex items-center justify-between text-xs hover:bg-[#F0FDF4] transition-colors">
                    <div>
                      <div className="font-bold text-[#122A24]">{inv.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.invoice_no} • {inv.class_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700 font-mono text-xs">
                        ₹{(inv.paid_amount ?? (inv.status === 'PAID' ? inv.amount : 0)).toLocaleString()}
                      </div>
                      <button
                        onClick={() => setSelectedReceiptInvoice(inv)}
                        className="text-[10px] font-bold text-emerald-800 hover:underline bg-transparent border-none cursor-pointer mt-0.5 inline-flex items-center gap-0.5"
                      >
                        <Printer className="w-2.5 h-2.5" /> Print Slip
                      </button>
                    </div>
                  </div>
                ))}

                {invoices.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 font-mono">
                    No recent transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: FEE OVERVIEW & LEDGER
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">Institutional Invoices &amp; Receipts Ledger</h2>
              <p className="text-xs text-[#2D5A4E]">Real-time student fee collection register and official CBSE slip generation</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIssueModal(true)}
                className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Invoice
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, admission no, receipt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
              >
                <option value="ALL">All Classes</option>
                {uniqueClasses.map(clsName => (
                  <option key={clsName} value={clsName}>{clsName}</option>
                ))}
              </select>

              {/* Status Filter */}
              {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold cursor-pointer border transition-all ${
                    statusFilter === st
                      ? 'bg-[#122A24] text-white border-[#122A24]'
                      : 'bg-[#F8FAF9] text-slate-600 border-[#DCE8E0] hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#F8FAF9]">
                  <th className="py-3 px-3.5">INVOICE / RECEIPT</th>
                  <th className="py-3 px-3">STUDENT DETAILS</th>
                  <th className="py-3 px-3">CLASS</th>
                  <th className="py-3 px-3">DUE DATE</th>
                  <th className="py-3 px-3">AMOUNT</th>
                  <th className="py-3 px-3">PAID</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#122A24]">
                      {inv.invoice_no}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{inv.month || 'Tuition Fee'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{inv.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Adm: {inv.student_id || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">{inv.class_name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{inv.due_date || 'N/A'}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#122A24]">₹{(inv.amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                      ₹{(inv.paid_amount ?? (inv.status === 'PAID' ? inv.amount : 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inv.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10.5px] border border-emerald-200 cursor-pointer flex items-center gap-1"
                          title="Print Official CBSE Receipt"
                        >
                          <Printer className="w-3 h-3" /> Slip
                        </button>

                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkAsPaid(inv)}
                            className="px-2.5 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-[10.5px] border-none cursor-pointer flex items-center gap-1"
                            title="Mark as Paid"
                          >
                            <Check className="w-3 h-3" /> Pay
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-none cursor-pointer"
                          title="Delete / Void"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-mono">
                      No fee records found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: MONTH-WISE REPORT
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'monthly' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
          <div className="pb-3 border-b border-[#E8F0EA]">
            <h2 className="font-display font-bold text-base text-[#122A24]">Month-Wise Fee Collection Breakdown ({selectedSession})</h2>
            <p className="text-xs text-[#2D5A4E]">Monthly cash flow, target billings, and realization performance across all grade levels</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS.map((m, idx) => {
              const estimatedBilled = Math.round((totalBilled || 1200000) / 12);
              const estimatedCollected = idx < 5 ? Math.round(estimatedBilled * (0.88 + (idx % 3) * 0.04)) : 0;
              const rate = Math.round((estimatedCollected / (estimatedBilled || 1)) * 100);
              return (
                <div key={m} className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#122A24]">{m}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      idx < 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx < 5 ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-slate-500">Target: ₹{estimatedBilled.toLocaleString()}</span>
                    <span className="font-bold text-emerald-800">Collected: ₹{estimatedCollected.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${Math.min(100, rate)}%` }} />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 text-right">{rate}% realized</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: FEE STRUCTURE & CALENDAR
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'structure' && (
        <div className="space-y-6">
          {/* Approved Structure Table */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">Institutional Fee Structure ({selectedSession})</h2>
                <p className="text-xs text-[#2D5A4E]">Class-wise approved fee breakdown by CBSE school managing committee</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" /> Print Circular
              </button>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-3.5">GRADE GROUP</th>
                    <th className="py-3 px-3">ADMISSION FEE (ONE TIME)</th>
                    <th className="py-3 px-3">TUITION FEE (QUARTERLY)</th>
                    <th className="py-3 px-3">ANNUAL CHARGES</th>
                    <th className="py-3 px-3">EXAM &amp; LAB</th>
                    <th className="py-3 px-3 text-right">TOTAL ANNUAL (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] text-slate-700 font-mono">
                  {[
                    { grp: 'Pre-Primary (Nursery - UKG)', adm: 15000, tui: 12000, ann: 8000, lab: 2000, tot: 73000 },
                    { grp: 'Primary (Class 1 - 5)', adm: 18000, tui: 14500, ann: 9500, lab: 3500, tot: 89000 },
                    { grp: 'Middle (Class 6 - 8)', adm: 20000, tui: 16500, ann: 11000, lab: 5000, tot: 102000 },
                    { grp: 'Secondary (Class 9 - 10)', adm: 22000, tui: 18500, ann: 12500, lab: 7500, tot: 116000 },
                    { grp: 'Sr. Secondary (Class 11 - 12)', adm: 25000, tui: 21000, ann: 15000, lab: 12000, tot: 136000 },
                  ].map(r => (
                    <tr key={r.grp} className="hover:bg-[#F9FCFA]">
                      <td className="py-3 px-3.5 font-sans font-bold text-[#122A24]">{r.grp}</td>
                      <td className="py-3 px-3">₹{r.adm.toLocaleString()}</td>
                      <td className="py-3 px-3">₹{r.tui.toLocaleString()}</td>
                      <td className="py-3 px-3">₹{r.ann.toLocaleString()}</td>
                      <td className="py-3 px-3">₹{r.lab.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800">₹{r.tot.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Installment Calendar */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="pb-3 border-b border-[#E8F0EA]">
              <h2 className="font-display font-bold text-base text-[#122A24]">Quarterly Installment Schedule &amp; Penalties</h2>
              <p className="text-xs text-[#2D5A4E]">Grace periods and fine policies for academic fee payments</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { q: 'Quarter 1 (Apr - Jun)', due: '15 April 2026', grace: '30 April 2026', status: 'Completed', notes: 'Composite tuition + annual development' },
                { q: 'Quarter 2 (Jul - Sep)', due: '15 July 2026', grace: '31 July 2026', status: 'Active', notes: 'Tuition fee + science/computer lab charges' },
                { q: 'Quarter 3 (Oct - Dec)', due: '15 October 2026', grace: '31 October 2026', status: 'Upcoming', notes: 'Tuition fee + mid-term examination fee' },
                { q: 'Quarter 4 (Jan - Mar)', due: '15 January 2027', grace: '31 January 2027', status: 'Upcoming', notes: 'Tuition fee + board examination clearance' },
              ].map((term) => (
                <div key={term.q} className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#122A24]">{term.q}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      term.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : term.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {term.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{term.notes}</p>
                  <div className="space-y-1 text-xs font-mono text-slate-600 pt-2 border-t border-slate-200">
                    <div>Due Date: <strong className="text-[#122A24]">{term.due}</strong></div>
                    <div>Grace Date: <strong className="text-emerald-700">{term.grace}</strong></div>
                    <div>Late Fine: <span className="text-rose-600 font-semibold">₹50/day post grace</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: STAFF PAYROLL & HR
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'payroll' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">Faculty &amp; Staff Monthly Payroll Ledger</h2>
              <p className="text-xs text-[#2D5A4E]">7th Pay Commission compliant salary disbursement, allowances, and official monthly payslips</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold rounded-full">
              {teachers.length} Active Faculty Members
            </span>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#F8FAF9]">
                  <th className="py-3 px-3.5">FACULTY MEMBER</th>
                  <th className="py-3 px-3">DESIGNATION</th>
                  <th className="py-3 px-3">BASIC PAY</th>
                  <th className="py-3 px-3">ALLOWANCES (DA+HRA)</th>
                  <th className="py-3 px-3">DEDUCTIONS (PF/LOP)</th>
                  <th className="py-3 px-3">NET PAYABLE</th>
                  <th className="py-3 px-3 text-right">OFFICIAL SLIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] text-slate-700 font-mono">
                {teachers.map(t => {
                  const isPgt = (t.designation || '').includes('PGT');
                  const isTgt = (t.designation || '').includes('TGT');
                  const basic = isPgt ? 55000 : isTgt ? 48000 : 38000;
                  const daHra = Math.round(basic * 0.35);
                  const pf = Math.round(basic * 0.12);
                  const net = basic + daHra - pf;

                  return (
                    <tr key={t.id} className="hover:bg-[#F9FCFA]">
                      <td className="py-3 px-3.5 font-sans font-bold text-[#122A24]">
                        {t.full_name}
                        <div className="text-[10px] text-slate-400 font-mono">Emp: {t.staff_code || t.id}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-sans">{t.designation}</td>
                      <td className="py-3 px-3">₹{basic.toLocaleString()}</td>
                      <td className="py-3 px-3 text-emerald-700">+₹{daHra.toLocaleString()}</td>
                      <td className="py-3 px-3 text-rose-600">-₹{pf.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-[#122A24]">₹{net.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedPayslipTeacher(t)}
                          className="px-3 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-[10.5px] border-none cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <FileText className="w-3 h-3" /> Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: OFFICIAL CBSE PRINTABLE FEE RECEIPT
          ───────────────────────────────────────────────────────────── */}
      {selectedReceiptInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-display font-bold text-base text-[#122A24]">Official CBSE Fee Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button
                  onClick={() => setSelectedReceiptInvoice(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 border-2 border-[#122A24] rounded-2xl space-y-4 bg-white text-slate-800">
              {/* Institutional Header */}
              <div className="text-center border-b-2 border-[#122A24] pb-3">
                <div className="font-display font-black text-xl text-[#122A24] tracking-tight uppercase">
                  {selectedSchool?.school_name || 'Delhi Public School, R.K. Puram'}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  {selectedSchool?.address || 'Sector 12, Dwarka, New Delhi'} • Phone: {selectedSchool?.phone || '+91 11 2789 0000'}
                </div>
                <div className="text-[11px] font-mono font-bold text-[#1C443A] mt-1">
                  CBSE Affiliation No: {selectedSchool?.affiliation_no || '2130042'} | School Code: {selectedSchool?.oasis_code || '84001'}
                </div>
                <div className="inline-block mt-2 px-3 py-0.5 bg-[#122A24] text-white text-[11px] font-bold uppercase rounded-md tracking-wider">
                  Official Student Fee Receipt
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-y-2 text-xs font-mono border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-500">Receipt No: </span>
                  <strong className="text-[#122A24]">{selectedReceiptInvoice.invoice_no}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date: </span>
                  <strong className="text-[#122A24]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Student Name: </span>
                  <strong className="text-[#122A24] font-sans font-bold">{selectedReceiptInvoice.student_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Adm No: </span>
                  <strong className="text-[#122A24]">{selectedReceiptInvoice.student_id || 'DPS-2026-99'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class &amp; Sec: </span>
                  <strong className="text-[#122A24]">{selectedReceiptInvoice.class_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Academic Session: </span>
                  <strong className="text-[#122A24]">{selectedReceiptInvoice.academic_session || selectedSession}</strong>
                </div>
              </div>

              {/* Fee Particulars Table */}
              <table className="w-full text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b-2 border-[#122A24] bg-slate-50">
                    <th className="py-2 px-2 text-left font-bold">SL</th>
                    <th className="py-2 px-2 text-left font-bold">FEE PARTICULARS</th>
                    <th className="py-2 px-2 text-right font-bold">AMOUNT (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-1.5 px-2">1</td>
                    <td className="py-1.5 px-2">Tuition &amp; Composite Academic Fee</td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{(selectedReceiptInvoice.tuition_fee || Math.round((selectedReceiptInvoice.amount || 0) * 0.75)).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2">2</td>
                    <td className="py-1.5 px-2">Transport / Bus Facilitation Fee</td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{(selectedReceiptInvoice.transport_fee || Math.round((selectedReceiptInvoice.amount || 0) * 0.15)).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2">3</td>
                    <td className="py-1.5 px-2">Science Lab &amp; Computer Facility Charges</td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{(selectedReceiptInvoice.exam_fee || Math.round((selectedReceiptInvoice.amount || 0) * 0.10)).toLocaleString()}</td>
                  </tr>
                  <tr className="border-t-2 border-[#122A24] bg-emerald-50/50">
                    <td className="py-2 px-2 font-bold" colSpan={2}>TOTAL AMOUNT PAID</td>
                    <td className="py-2 px-2 text-right font-bold text-sm text-emerald-900">
                      ₹{(selectedReceiptInvoice.paid_amount ?? (selectedReceiptInvoice.status === 'PAID' ? selectedReceiptInvoice.amount : 0)).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in Words */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-mono">Amount in Words: </span>
                <strong className="text-[#122A24] italic">
                  {numberToWordsINR(selectedReceiptInvoice.paid_amount ?? (selectedReceiptInvoice.status === 'PAID' ? selectedReceiptInvoice.amount : 0))}
                </strong>
              </div>

              {/* Payment Mode & Stamp Area */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <div className="font-mono text-[11px] text-slate-500">Payment Mode:</div>
                  <strong className="text-[#122A24]">{selectedReceiptInvoice.payment_mode || 'UPI / Online'}</strong>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">Status: COMPLETED (CBSE Cleared)</div>
                </div>

                <div className="text-right space-y-6">
                  <div className="font-mono text-[11px] text-slate-500">Authorized Accounts Signatory</div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[11px] font-bold text-[#122A24] inline-block">
                    Accounts Officer / Cashier
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ISSUE NEW INVOICE (SINGLE / BATCH)
          ───────────────────────────────────────────────────────────── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24]">Issue Institutional Fee Invoice</h3>
                <p className="text-xs text-[#2D5A4E]">Generate single student bill or bulk-issue class-wide invoices</p>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0]">
              <button
                onClick={() => setIssueMode('SINGLE')}
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer border-none transition-all ${
                  issueMode === 'SINGLE' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600'
                }`}
              >
                Individual Student
              </button>
              <button
                onClick={() => setIssueMode('BATCH')}
                className={`py-2 rounded-xl text-xs font-bold cursor-pointer border-none transition-all ${
                  issueMode === 'BATCH' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600'
                }`}
              >
                ⚡ Bulk Class Invoicing
              </button>
            </div>

            {/* Single Student Form */}
            {issueMode === 'SINGLE' ? (
              <form onSubmit={handleCreateSingleInvoice} className="space-y-4">
                
                {/* Class, Section & Search Filter Bar */}
                <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#122A24] uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-emerald-700" /> Filter &amp; Search Student
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#C5E2CF] text-[#1C443A]">
                      {filteredIssueStudents.length} Students
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Class Filter */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Class</label>
                      <select
                        value={singleFilterClass}
                        onChange={(e) => setSingleFilterClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#C5E2CF] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                      >
                        <option value="ALL">All Classes</option>
                        {uniqueClasses.map(clsName => (
                          <option key={clsName} value={clsName}>{clsName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Section Filter */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Section</label>
                      <select
                        value={singleFilterSection}
                        onChange={(e) => setSingleFilterSection(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#C5E2CF] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                      >
                        <option value="ALL">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>

                    {/* Live Search Bar */}
                    <div className="sm:col-span-5 relative">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Search Student</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                          type="text"
                          placeholder="Name, adm no, roll, phone..."
                          value={singleSearchQuery}
                          onChange={(e) => setSingleSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-6 py-1.5 bg-white border border-[#C5E2CF] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                        />
                        {singleSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSingleSearchQuery('')}
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Choose Student Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1">Select Student *</label>
                  {filteredIssueStudents.length > 0 ? (
                    <select
                      value={singleStudentId}
                      onChange={(e) => setSingleStudentId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#C5E2CF] rounded-xl text-xs font-bold text-[#122A24] cursor-pointer focus:outline-none focus:bg-white"
                      required
                    >
                      {filteredIssueStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.admission_no || s.id}) — {s.class_name} {s.section ? `Sec ${s.section}` : ''} • Current: {s.fee_status || 'PENDING'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                      <span>No students found matching class/section filters or search.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSingleFilterClass('ALL');
                          setSingleFilterSection('ALL');
                          setSingleSearchQuery('');
                        }}
                        className="text-xs font-bold text-amber-900 underline border-none bg-transparent cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Student Information Card */}
                {selectedSingleStudent && (
                  <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs animate-fade-in">
                    <div>
                      <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-700" />
                        <span>{selectedSingleStudent.full_name}</span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                        Adm No: {selectedSingleStudent.admission_no || selectedSingleStudent.id} • Class: {selectedSingleStudent.class_name} {selectedSingleStudent.section || 'A'}
                        {selectedSingleStudent.guardian_name ? ` • Guardian: ${selectedSingleStudent.guardian_name}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Fee Status</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase ${
                        selectedSingleStudent.fee_status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedSingleStudent.fee_status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedSingleStudent.fee_status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Billing Month & Due Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Billing Month / Period</label>
                    <select
                      value={singleMonth}
                      onChange={(e) => setSingleMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="Quarter 1 (Apr - Jun)">Quarter 1 (Apr - Jun)</option>
                      <option value="Quarter 2 (Jul - Sep)">Quarter 2 (Jul - Sep)</option>
                      <option value="Quarter 3 (Oct - Dec)">Quarter 3 (Oct - Dec)</option>
                      <option value="Quarter 4 (Jan - Mar)">Quarter 4 (Jan - Mar)</option>
                      <option value="Annual Session 2026-27">Annual Session 2026-27</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Due Date *</label>
                    <input
                      type="date"
                      value={singleDueDate}
                      onChange={(e) => setSingleDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-medium text-[#122A24]"
                      required
                    />
                  </div>
                </div>

                {/* Fee Particulars Breakdown */}
                <div className="space-y-2.5 pt-1 border-t border-[#E8F0EA]">
                  <label className="block text-xs font-bold text-[#122A24]">Institutional Fee Components (₹)</label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-slate-600 mb-0.5">Tuition Fee</span>
                      <input
                        type="number"
                        value={singleTuition}
                        onChange={(e) => setSingleTuition(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-600 mb-0.5">Transport Fee</span>
                      <input
                        type="number"
                        value={singleTransport}
                        onChange={(e) => setSingleTransport(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-600 mb-0.5">Lab / Exam Fee</span>
                      <input
                        type="number"
                        value={singleLabExam}
                        onChange={(e) => setSingleLabExam(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-600 mb-0.5">Annual / Dev Fee</span>
                      <input
                        type="number"
                        value={singleAnnual}
                        onChange={(e) => setSingleAnnual(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-[11px] text-slate-600 mb-0.5">Scholarship / Concession (-)</span>
                      <input
                        type="number"
                        value={singleConcession}
                        onChange={(e) => setSingleConcession(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-rose-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Total Calculated Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-emerald-900 block">Total Net Invoice Amount:</span>
                    <span className="text-[10px] text-emerald-700 font-sans italic">
                      {numberToWordsINR(
                        Math.max(
                          0,
                          (parseFloat(singleTuition) || 0) +
                          (parseFloat(singleTransport) || 0) +
                          (parseFloat(singleLabExam) || 0) +
                          (parseFloat(singleAnnual) || 0) -
                          (parseFloat(singleConcession) || 0)
                        )
                      )}
                    </span>
                  </div>
                  <span className="font-black text-base text-emerald-800">
                    ₹{Math.max(
                      0,
                      (parseFloat(singleTuition) || 0) +
                      (parseFloat(singleTransport) || 0) +
                      (parseFloat(singleLabExam) || 0) +
                      (parseFloat(singleAnnual) || 0) -
                      (parseFloat(singleConcession) || 0)
                    ).toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingInvoice || !singleStudentId}
                  className="w-full py-3 rounded-xl bg-[#122A24] hover:bg-[#1C443A] disabled:opacity-50 text-white font-display font-bold text-xs tracking-wide shadow-xs cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{isCreatingInvoice ? 'Issuing Institutional Invoice...' : 'Generate & Issue Institutional Invoice →'}</span>
                </button>
              </form>
            ) : (
              /* Batch Class Form */
              <form onSubmit={handleCreateBatchInvoices} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1">Target Class *</label>
                    <select
                      value={batchClass}
                      onChange={(e) => setBatchClass(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      {uniqueClasses.map(clsName => (
                        <option key={clsName} value={clsName}>{clsName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1">Section</label>
                    <select
                      value={batchSection}
                      onChange={(e) => setBatchSection(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      <option value="ALL">All Sections (A, B, C...)</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                {/* Batch Students Preview Banner */}
                <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#122A24]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>{batchMatchingStudents.length} Active Students in {batchClass} {batchSection !== 'ALL' ? `(Sec ${batchSection})` : ''}</span>
                    </div>
                    <span className="font-mono text-emerald-800 text-[11px]">
                      Session {selectedSession}
                    </span>
                  </div>

                  {batchMatchingStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-1">
                      {batchMatchingStudents.slice(0, 12).map(s => (
                        <span key={s.id} className="px-2 py-0.5 bg-white border border-[#C5E2CF] rounded-md text-[10px] font-mono text-[#122A24]">
                          {s.full_name} ({s.admission_no || s.section || 'A'})
                        </span>
                      ))}
                      {batchMatchingStudents.length > 12 && (
                        <span className="px-2 py-0.5 bg-emerald-100 rounded-md text-[10px] font-mono font-bold text-emerald-900">
                          +{batchMatchingStudents.length - 12} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800">
                      No active students found in this class &amp; section combination.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Billing Month</label>
                    <select
                      value={batchMonth}
                      onChange={(e) => setBatchMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer"
                    >
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#122A24] mb-1">Due Date</label>
                    <input
                      type="date"
                      value={batchDueDate}
                      onChange={(e) => setBatchDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#122A24] mb-1">Tuition Fee (₹)</label>
                    <input
                      type="number"
                      value={batchTuition}
                      onChange={(e) => setBatchTuition(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#122A24] mb-1">Transport Fee (₹)</label>
                    <input
                      type="number"
                      value={batchTransport}
                      onChange={(e) => setBatchTransport(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#122A24] mb-1">Lab / Activity (₹)</label>
                    <input
                      type="number"
                      value={batchLabExam}
                      onChange={(e) => setBatchLabExam(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-bold text-emerald-900 block">Total Batch Estimate:</span>
                    <span className="text-[10px] text-emerald-700 font-sans">
                      ₹{((parseFloat(batchTuition) || 0) + (parseFloat(batchTransport) || 0) + (parseFloat(batchLabExam) || 0)).toLocaleString()} × {batchMatchingStudents.length} Students
                    </span>
                  </div>
                  <span className="font-black text-sm text-emerald-800">
                    ₹{(
                      ((parseFloat(batchTuition) || 0) + (parseFloat(batchTransport) || 0) + (parseFloat(batchLabExam) || 0)) *
                      batchMatchingStudents.length
                    ).toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingBatch || batchMatchingStudents.length === 0}
                  className="w-full py-3 rounded-xl bg-[#122A24] hover:bg-[#1C443A] disabled:opacity-50 text-white font-display font-bold text-xs tracking-wide shadow-xs cursor-pointer border-none transition-all flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>{isCreatingBatch ? 'Processing Bulk Invoices...' : `Issue Invoices for All ${batchMatchingStudents.length} Students in ${batchClass} →`}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: FACULTY MONTHLY PAYSLIP
          ───────────────────────────────────────────────────────────── */}
      {selectedPayslipTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-display font-bold text-base text-[#122A24]">Faculty Monthly Salary Payslip</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedPayslipTeacher(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Content */}
            <div className="p-5 border-2 border-[#122A24] rounded-2xl space-y-4 bg-white text-slate-800 font-mono text-xs">
              <div className="text-center border-b-2 border-[#122A24] pb-2 font-sans">
                <div className="font-black text-lg text-[#122A24] uppercase">{selectedSchool?.school_name || 'Delhi Public School'}</div>
                <div className="text-xs text-slate-600">{selectedSchool?.address || 'Sector 12, Dwarka, New Delhi'}</div>
                <div className="text-[11px] font-bold text-emerald-800 mt-1 uppercase">Monthly Salary Disbursement Slip</div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>Faculty: <strong className="font-sans text-[#122A24]">{selectedPayslipTeacher.full_name}</strong></div>
                <div className="text-right">Staff ID: <strong>{selectedPayslipTeacher.staff_code || selectedPayslipTeacher.id}</strong></div>
                <div>Designation: <span className="font-sans">{selectedPayslipTeacher.designation}</span></div>
                <div className="text-right">Bank: <span>{selectedPayslipTeacher.bank_name || 'SBI'}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <div className="font-bold text-emerald-900 border-b border-emerald-200 pb-1 font-sans">EARNINGS (INR)</div>
                  <div className="flex justify-between"><span>Basic Pay:</span><strong>₹48,000</strong></div>
                  <div className="flex justify-between"><span>DA (30%):</span><strong>₹14,400</strong></div>
                  <div className="flex justify-between"><span>HRA (15%):</span><strong>₹7,200</strong></div>
                  <div className="flex justify-between"><span>Special Allow:</span><strong>₹2,400</strong></div>
                  <div className="flex justify-between border-t border-emerald-200 pt-1 font-bold text-emerald-900">
                    <span>Gross Earnings:</span><span>₹72,000</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                  <div className="font-bold text-rose-900 border-b border-rose-200 pb-1 font-sans">DEDUCTIONS (INR)</div>
                  <div className="flex justify-between"><span>EPF (12%):</span><strong>₹5,760</strong></div>
                  <div className="flex justify-between"><span>Prof. Tax:</span><strong>₹200</strong></div>
                  <div className="flex justify-between"><span>TDS / Income Tax:</span><strong>₹1,500</strong></div>
                  <div className="flex justify-between"><span>LOP (0 Days):</span><strong>₹0</strong></div>
                  <div className="flex justify-between border-t border-rose-200 pt-1 font-bold text-rose-900">
                    <span>Total Deduct:</span><span>₹7,460</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#122A24] text-white rounded-xl flex items-center justify-between font-sans">
                <span className="font-bold text-xs">NET TAKE-HOME SALARY:</span>
                <span className="font-mono font-black text-base text-emerald-300">₹64,540</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
