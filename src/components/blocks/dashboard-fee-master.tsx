'use client';
/*! EduSuite Fee Master — Single Fees Engine 4-Tab UI v3.0.0 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, Layers, Plus, Sparkles, CheckCircle2,
  FileSpreadsheet, ArrowRight, ShieldCheck,
  Receipt, Landmark, Users, Sliders, Calendar,
  CreditCard, TrendingUp, AlertCircle, Search,
  Printer, Download, Trash2, Edit3, RefreshCw,
  IndianRupee, Check, X, Send, Eye, Percent,
  Building, BookOpen, AlertTriangle, ChevronRight,
  Filter, FileText, ArrowUpRight, ArrowDownLeft,
  ChevronDown, Phone, MessageSquare, Info,
  CheckCircle, Clock, XCircle, RotateCcw, Bus
} from 'lucide-react';
import { School, Student } from '@/lib/types';
import type {
  FeeConfig,
  FeeDepositSlot,
  StudentLedgerViewItem,
  ReceiptRecord,
} from '@/lib/fees-engine/types';
import {
  type ReportQueryResult,
  type ReportConfig,
  REPORT_CONFIGS,
} from '@/lib/fees-engine/report-configs';
import {
  ACADEMIC_MONTHS,
  MONTH_FULL_NAMES,
  formatPaise,
  formatRupees,
  paiseToRupees,
  rupeesToPaise,
} from '@/lib/fees-engine/constants';
import {
  generateCsvExport,
  generatePdfExport,
} from '@/lib/fees-engine/export';
import { apiFetch } from '@/lib/api-client';

export interface DashboardFeeMasterProps {
  selectedSchool?: School | null;
  students?: Student[];
  invoices?: any[];
  classes?: any[];
  teachers?: any[];
  selectedSession?: string;
  userRole?: string;
  currentUser?: any;
  preselectedStudentId?: string;
  preselectedTimestamp?: number;
  onRefresh?: () => void;
  showAdminToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function DashboardFeeMaster({
  selectedSchool,
  students = [],
  classes = [],
  teachers = [],
  selectedSession = '2026-27',
  userRole = 'ADMIN',
  currentUser,
  preselectedStudentId,
  showAdminToast,
}: DashboardFeeMasterProps) {
  // ─── 4 MAIN TABS ONLY ───
  const [activeTab, setActiveTab] = useState<'overview' | 'collect' | 'reports' | 'setup'>('overview');
  const [session, setSession] = useState<string>(selectedSession || '2026-27');
  const [loading, setLoading] = useState<boolean>(false);

  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (showAdminToast) showAdminToast(msg, type);
    else alert(msg);
  }, [showAdminToast]);

  // ─── TAB 1: OVERVIEW STATE ───
  const [overviewLoading, setOverviewLoading] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<{
    totalBilledPaise: number;
    totalCollectedPaise: number;
    totalPendingPaise: number;
    totalDiscountPaise: number;
    collectionPercentage: number;
    studentsWithNothingPaid: number;
    thisMonthBreakdown: any[];
    topPending: any[];
  }>({
    totalBilledPaise: 0,
    totalCollectedPaise: 0,
    totalPendingPaise: 0,
    totalDiscountPaise: 0,
    collectionPercentage: 0,
    studentsWithNothingPaid: 0,
    thisMonthBreakdown: [],
    topPending: [],
  });

  // ─── TAB 2: COLLECT FEES STATE ───
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLedger, setStudentLedger] = useState<StudentLedgerViewItem[]>([]);
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [studentReceipts, setStudentReceipts] = useState<ReceiptRecord[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Payment form state
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CHEQUE' | 'ONLINE'>('UPI');
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<number>(0);
  const [txnRef, setTxnRef] = useState<string>('');
  const [chequeNo, setChequeNo] = useState<string>('');
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');
  const [isAdvanceYearly, setIsAdvanceYearly] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [collectingPayment, setCollectingPayment] = useState<boolean>(false);

  // Receipt Modal state
  const [activeReceipt, setActiveReceipt] = useState<ReceiptRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Cancel receipt modal
  const [receiptToCancel, setReceiptToCancel] = useState<ReceiptRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancellingReceipt, setCancellingReceipt] = useState<boolean>(false);

  // ─── TAB 3: REPORTS STATE ───
  const [selectedReportId, setSelectedReportId] = useState<string>('month_class_collection');
  const [reportFilters, setReportFilters] = useState<{
    month: string;
    class: string;
    section: string;
    transport: string;
    sibling: string;
    search: string;
  }>({
    month: 'SEP',
    class: 'ALL',
    section: 'ALL',
    transport: 'ALL',
    sibling: 'ALL',
    search: '',
  });
  const [reportResult, setReportResult] = useState<ReportQueryResult | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportPage, setReportPage] = useState<number>(1);
  const [reportPageSize, setReportPageSize] = useState<number>(25);

  // Month class drawer
  const [drawerClass, setDrawerClass] = useState<string | null>(null);
  const [drawerDefaulters, setDrawerDefaulters] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [drawerFilter, setDrawerFilter] = useState<'pending' | 'all'>('pending');
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  // ─── TAB 4: SETUP STATE ───
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [accordionOpen, setAccordionOpen] = useState<{ [key: string]: boolean }>({
    heads: true,
    structure: false,
    transport: false,
    discounts: false,
    lateFee: false,
    bulk: true,
  });
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [previewAction, setPreviewAction] = useState<string | null>(null);

  // ─── LOAD DRAWER DEFAULTERS ON CLASS SELECT ───
  useEffect(() => {
    if (!drawerClass) {
      setDrawerDefaulters([]);
      setDrawerSearch('');
      return;
    }
    const fetchClassDefaulters = async () => {
      setDrawerLoading(true);
      try {
        const schoolId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
        const res = await apiFetch(`/api/fee-master?action=report&report_id=pending_fees_list&session=${session}&school_id=${encodeURIComponent(schoolId)}&classes=${encodeURIComponent(drawerClass)}`);
        const data = await res.json();
        if (data.success && data.report) {
          setDrawerDefaulters(data.report.rows || []);
        }
      } catch (e) {
        console.error('[fetchClassDefaulters error]', e);
      } finally {
        setDrawerLoading(false);
      }
    };
    fetchClassDefaulters();
  }, [drawerClass, session, selectedSchool]);

  // ─── LOAD OVERVIEW DATA ───
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const schoolId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await apiFetch(`/api/fee-master?action=overview&session=${session}&school_id=${encodeURIComponent(schoolId)}`);
      const data = await res.json();
      if (data.success && data.overview) {
        setOverviewData(data.overview);
      } else {
        setOverviewError(data?.error || 'Failed to load fee overview metrics.');
      }
    } catch (e: any) {
      console.error('[loadOverview error]', e);
      setOverviewError(e?.message || 'Network error loading overview metrics.');
    } finally {
      setOverviewLoading(false);
    }
  }, [session, selectedSchool]);

  // ─── LOAD CONFIG DATA ───
  const loadConfig = useCallback(async () => {
    try {
      const schoolId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await apiFetch(`/api/fee-master?action=config&session=${session}&school_id=${encodeURIComponent(schoolId)}`);
      const data = await res.json();
      if (data.success && data.config) {
        setFeeConfig(data.config);
      }
    } catch (e) {
      console.error('[loadConfig error]', e);
    }
  }, [session, selectedSchool]);

  // ─── LOAD REPORT DATA ───
  const loadReport = useCallback(async (reportId: string, currentFilters = reportFilters) => {
    setReportLoading(true);
    try {
      const schoolId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const params = new URLSearchParams({
        action: 'report',
        report_id: reportId,
        session: session,
        school_id: schoolId,
      });
      if (currentFilters.month && currentFilters.month !== 'ALL') params.append('month', currentFilters.month);
      if (currentFilters.class && currentFilters.class !== 'ALL') params.append('classes', currentFilters.class);
      if (currentFilters.section && currentFilters.section !== 'ALL') params.append('sections', currentFilters.section);
      if (currentFilters.transport !== 'ALL') params.append('transport', currentFilters.transport === 'YES' ? 'true' : 'false');
      if (currentFilters.sibling !== 'ALL') params.append('sibling', currentFilters.sibling === 'YES' ? 'true' : 'false');
      if (currentFilters.search) params.append('search', currentFilters.search);

      const res = await apiFetch(`/api/fee-master?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReportResult(data.report);
        setReportPage(1);
      }
    } catch (e) {
      console.error('[loadReport error]', e);
      toast('Failed to load report', 'error');
    } finally {
      setReportLoading(false);
    }
  }, [session, selectedSchool, reportFilters, toast]);

  // ─── LOAD STUDENT LEDGER ───
  const loadStudentLedger = useCallback(async (studentId: string) => {
    setLedgerLoading(true);
    try {
      const schoolId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await apiFetch(`/api/fee-master?action=student_ledger_view&student_id=${studentId}&session=${session}&school_id=${encodeURIComponent(schoolId)}`);
      const data = await res.json();
      if (data.success) {
        setStudentLedger(data.ledgerView || []);
        setStudentSummary(data.summary || null);
        setStudentReceipts(data.receipts || []);

        // Default payment amount to total pending balance
        if (data.summary) {
          setPaymentAmountRupees(paiseToRupees(data.summary.balance));
        }
      }
    } catch (e) {
      console.error('[loadStudentLedger error]', e);
      toast('Failed to load student fee ledger', 'error');
    } finally {
      setLedgerLoading(false);
    }
  }, [session, selectedSchool, toast]);

  // Initial Load
  useEffect(() => {
    loadOverview();
    loadConfig();
    loadReport(selectedReportId);
  }, [loadOverview, loadConfig, loadReport, selectedReportId]);

  // Handle preselected student if passed
  useEffect(() => {
    if (preselectedStudentId && students.length > 0) {
      const found = students.find(s => s.id === preselectedStudentId);
      if (found) {
        setSelectedStudent(found);
        setActiveTab('collect');
        loadStudentLedger(found.id);
      }
    }
  }, [preselectedStudentId, students, loadStudentLedger]);

  // Filter students for search in Tab 2
  const searchResults = useMemo(() => {
    if (!studentSearch || studentSearch.trim().length < 1) return [];
    const q = studentSearch.toLowerCase().trim();
    return students
      .filter(s => s.status === 'ACTIVE')
      .filter(s =>
        `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(q) ||
        (s.admission_no || '').toLowerCase().includes(q) ||
        (s.father_name || '').toLowerCase().includes(q) ||
        (s.mobile || s.emergency_contact || '').includes(q)
      )
      .slice(0, 10);
  }, [studentSearch, students]);

  // ─── HANDLERS ───

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    loadStudentLedger(student.id);
  };

  const handleCollectPayment = async () => {
    if (!selectedStudent) return;
    if (paymentAmountRupees <= 0) {
      toast('Please enter a valid payment amount', 'warning');
      return;
    }

    setCollectingPayment(true);
    try {
      const res = await apiFetch('/api/fee-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collect_payment',
          student_id: selectedStudent.id,
          session,
          amount_paise: rupeesToPaise(paymentAmountRupees),
          payment_mode: paymentMode,
          txn_ref: txnRef,
          cheque_no: chequeNo,
          remarks: paymentRemarks,
          selected_keys: selectedItemIds.length > 0 ? selectedItemIds : undefined,
          is_advance_yearly: isAdvanceYearly,
        }),
      });

      const data = await res.json();
      if (data.success && data.receipt) {
        toast(`Payment collected! Receipt #${data.receipt.receipt_no}`, 'success');
        setActiveReceipt(data.receipt);
        setShowReceiptModal(true);

        // Reset form & reload ledger
        setPaymentRemarks('');
        setTxnRef('');
        setChequeNo('');
        setSelectedItemIds([]);
        setIsAdvanceYearly(false);
        loadStudentLedger(selectedStudent.id);
        loadOverview();
      } else {
        toast(data.error || 'Failed to collect payment', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Error processing payment', 'error');
    } finally {
      setCollectingPayment(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!receiptToCancel || !cancelReason.trim()) {
      toast('Please provide a reason for cancelling this receipt', 'warning');
      return;
    }

    setCancellingReceipt(true);
    try {
      const res = await apiFetch('/api/fee-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_receipt',
          receipt_no: receiptToCancel.receipt_no,
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast(data.message || 'Receipt cancelled successfully', 'success');
        setReceiptToCancel(null);
        setCancelReason('');
        if (selectedStudent) loadStudentLedger(selectedStudent.id);
        loadOverview();
      } else {
        toast(data.error || 'Failed to cancel receipt', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Error cancelling receipt', 'error');
    } finally {
      setCancellingReceipt(false);
    }
  };

  const handleBulkMapFees = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/fee-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_map', session }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, 'success');
        setPreviewAction(null);
        loadOverview();
      } else {
        toast(data.error || 'Failed to map fees', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Error mapping fees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/fee-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_demo_data', session }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message, 'success');
        setPreviewAction(null);
        loadOverview();
        if (selectedStudent) loadStudentLedger(selectedStudent.id);
        loadReport(selectedReportId);
      } else {
        toast(data.error || 'Failed to seed demo data', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Error seeding demo data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportResult) return;
    const csvContent = generateCsvExport(selectedSchool?.school_name || 'Delhi Public School', reportResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportResult.reportId}_${session}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = async () => {
    if (!reportResult) return;
    try {
      const blob = await generatePdfExport(selectedSchool?.school_name || 'Delhi Public School', reportResult);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportResult.reportId}_${session}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('[handleExportPdf error]', e);
      toast('Failed to generate PDF', 'error');
    }
  };

  const currentReportConfig = useMemo(() => {
    return REPORT_CONFIGS.find(r => r.id === selectedReportId) || REPORT_CONFIGS[0];
  }, [selectedReportId]);

  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-900">
      {/* ─── HEADER BAR WITH SESSION SELECTOR & 4 TABS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white flex items-center justify-center shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#122A24] flex items-center gap-2">
              Fee Master
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                One Fees Engine
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Single Source of Truth for Institutional Finances & CBSE Fee Ledgers</p>
          </div>
        </div>

        {/* Academic Session Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600">Session:</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
          >
            <option value="2026-27">2026-27 (Current)</option>
            <option value="2025-26">2025-26</option>
            <option value="2027-28">2027-28</option>
          </select>
        </div>
      </div>

      {/* ─── EXACTLY 4 TOP-LEVEL TABS (NO SUB-TABS) ─── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#122A24] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          1. Overview
        </button>

        <button
          onClick={() => setActiveTab('collect')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'collect'
              ? 'bg-[#122A24] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          2. Collect Fees
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#122A24] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          3. Reports Engine
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-[#122A24] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          4. Setup Structure
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Error loading overview metrics</p>
                  <p className="text-[11px] text-rose-600">{overviewError}</p>
                </div>
              </div>
              <button
                onClick={loadOverview}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* 6 Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Billed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-slate-900">
                {overviewLoading ? (
                  <span className="inline-block w-20 h-6 bg-slate-200 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalBilledPaise)
                )}
              </div>
              <span className="mt-1 text-[10px] text-slate-400 font-medium">Session {session}</span>
            </div>

            {/* 2. Collected */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Collected</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-emerald-700">
                {overviewLoading ? (
                  <span className="inline-block w-20 h-6 bg-emerald-100 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalCollectedPaise)
                )}
              </div>
              <span className="mt-1 text-[10px] text-emerald-600 font-bold">Realized Inflow</span>
            </div>

            {/* 3. Pending */}
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-rose-50/20">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Pending Dues</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-rose-700">
                {overviewLoading ? (
                  <span className="inline-block w-20 h-6 bg-rose-100 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalPendingPaise)
                )}
              </div>
              <span className="mt-1 text-[10px] text-rose-600 font-bold">Outstanding Balance</span>
            </div>

            {/* 4. Discount Given */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-indigo-50/20">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Discounts Given</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-indigo-700">
                {overviewLoading ? (
                  <span className="inline-block w-20 h-6 bg-indigo-100 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalDiscountPaise)
                )}
              </div>
              <span className="mt-1 text-[10px] text-indigo-600 font-medium">Sibling + Waivers</span>
            </div>

            {/* 5. Collection % */}
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-blue-50/20">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Collection %</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-blue-700">
                {overviewLoading ? (
                  <span className="inline-block w-12 h-6 bg-blue-100 rounded animate-pulse" />
                ) : (
                  `${overviewData.collectionPercentage}%`
                )}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, overviewData.collectionPercentage)}%` }}
                />
              </div>
            </div>

            {/* 6. Students with Nothing Paid */}
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between bg-gradient-to-b from-white to-amber-50/20">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Nothing Paid</span>
              <div className="mt-2 text-lg lg:text-xl font-black text-amber-700">
                {overviewLoading ? (
                  <span className="inline-block w-12 h-6 bg-amber-100 rounded animate-pulse" />
                ) : (
                  overviewData.studentsWithNothingPaid
                )}
              </div>
              <span className="mt-1 text-[10px] text-amber-600 font-bold">Defaulter Scholars</span>
            </div>
          </div>

          {/* Below 6 Cards: "This Month" Mini Table & "Top Pending" List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: "This Month" Mini Table (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    This Month Collection (September)
                  </h3>
                  <p className="text-[11px] text-slate-500">Class-wise submitted vs pending breakdown</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReportId('month_class_collection');
                    setReportFilters(prev => ({ ...prev, month: 'SEP' }));
                    setActiveTab('reports');
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Full Report <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3">Class</th>
                      <th className="p-3 text-right">Scholars</th>
                      <th className="p-3 text-right text-emerald-700">Submitted</th>
                      <th className="p-3 text-right text-rose-700">Pending</th>
                      <th className="p-3 text-right">Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {overviewData.thisMonthBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                          No class collection logs found for September.
                        </td>
                      </tr>
                    ) : (
                      overviewData.thisMonthBreakdown.slice(0, 8).map((row, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setDrawerClass(row.className)}
                          className="hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                          title={`Click to view ${row.className} student fee breakdown`}
                        >
                          <td className="p-3 font-bold text-[#122A24] group-hover:text-emerald-800 flex items-center gap-1.5">
                            {row.className}
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 inline" />
                          </td>
                          <td className="p-3 text-right">{row.totalStudents}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">{row.submittedCount}</td>
                          <td className="p-3 text-right font-bold text-rose-700">{row.notSubmittedCount}</td>
                          <td className="p-3 text-right font-bold">{formatPaise(row.collectedPaise)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: "Top Pending" List (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Top Pending Defaulters (10 Rows)
                  </h3>
                  <p className="text-[11px] text-slate-500">Highest outstanding fee balances</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReportId('pending_fees_list');
                    setActiveTab('reports');
                  }}
                  className="text-xs text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {overviewData.topPending.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No active pending dues found. All student accounts are clear!
                  </div>
                ) : (
                  overviewData.topPending.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between hover:bg-rose-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-[#122A24]">{p.studentName}</p>
                          <p className="text-[10px] text-slate-500">{p.classSection} • {p.fatherName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs text-rose-700 block">
                          {formatPaise(p.pendingPaise)}
                        </span>
                        <button
                          onClick={() => {
                            const found = students.find(s => s.id === p.studentId);
                            if (found) handleSelectStudent(found);
                            setActiveTab('collect');
                          }}
                          className="text-[10px] text-emerald-800 font-bold hover:underline cursor-pointer"
                        >
                          Collect →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: COLLECT FEES (POS & LEDGER)
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'collect' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="relative bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student by Name, Admission No, Father Name, or Mobile number..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {searchResults.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className="p-3.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#122A24] text-white flex items-center justify-center font-bold text-xs">
                        {st.first_name?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#122A24]">{st.first_name} {st.last_name}</p>
                        <p className="text-[10px] text-slate-500">Adm: {st.admission_no} • {st.class_name}-{st.section || 'A'} • Father: {st.father_name || 'N/A'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      Select <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!selectedStudent ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-bold">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-[#122A24]">Search and Select a Student</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use the search box above to lookup any student by name, scholar admission number, or father mobile number to view their official fee ledger and collect payments.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Left & Right Grid: Left = Student Card + Ledger, Right = Payment Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT PANEL: Student Profile + Ledger (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Student Card */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                        {selectedStudent.first_name?.[0] || 'S'}
                      </div>
                      <div>
                        <h2 className="text-base font-black text-[#122A24]">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Adm #{selectedStudent.admission_no} • {selectedStudent.class_name} - {selectedStudent.section || 'A'} • Father: {selectedStudent.father_name || 'N/A'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {selectedStudent.transport_opted === 'YES' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Bus className="w-3 h-3" /> Bus Opted (Slab #{selectedStudent.transport_slab_id || '1'})
                            </span>
                          )}
                          {selectedStudent.is_rte === 'YES' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                              RTE 100% Waiver
                            </span>
                          )}
                          {studentSummary && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              studentSummary.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : studentSummary.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              Status: {studentSummary.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Net Balance Due</span>
                      <span className="text-2xl font-black text-rose-700 block">
                        {studentSummary ? formatPaise(studentSummary.balance) : '₹0'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Session {session}</span>
                    </div>
                  </div>

                  {/* Student Fee Ledger Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-700" />
                          Student Fee Ledger
                        </h3>
                        <p className="text-[11px] text-slate-500">Scheduled head-wise periods, discounts & payments</p>
                      </div>
                      <button
                        onClick={() => loadStudentLedger(selectedStudent.id)}
                        className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
                        title="Refresh Ledger"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {ledgerLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading ledger data...</div>
                    ) : studentLedger.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 italic">No fee ledger items found. Click 'Map Fees' in Setup tab.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <th className="p-2.5">Head</th>
                              <th className="p-2.5">Period</th>
                              <th className="p-2.5 text-right">Gross</th>
                              <th className="p-2.5 text-right text-indigo-700">Disc</th>
                              <th className="p-2.5 text-right">Net</th>
                              <th className="p-2.5 text-right text-emerald-700">Paid</th>
                              <th className="p-2.5 text-right text-rose-700">Due</th>
                              <th className="p-2.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                            {studentLedger.map((item) => (
                              <tr
                                key={item.id}
                                className={`hover:bg-slate-50/50 ${
                                  selectedItemIds.includes(item.id) ? 'bg-emerald-50/30' : ''
                                }`}
                              >
                                <td className="p-2.5 font-bold text-[#122A24]">{item.fee_head}</td>
                                <td className="p-2.5 text-slate-600">{item.period}</td>
                                <td className="p-2.5 text-right">{formatPaise(item.gross_paise)}</td>
                                <td className="p-2.5 text-right text-indigo-700 font-bold">
                                  {item.discount_paise > 0 ? formatPaise(item.discount_paise) : '-'}
                                </td>
                                <td className="p-2.5 text-right font-bold">{formatPaise(item.net_paise)}</td>
                                <td className="p-2.5 text-right font-bold text-emerald-700">
                                  {item.paid_paise > 0 ? formatPaise(item.paid_paise) : '-'}
                                </td>
                                <td className="p-2.5 text-right font-black text-rose-700">
                                  {item.due_paise > 0 ? formatPaise(item.due_paise) : '₹0'}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : item.status === 'PARTIAL'
                                      ? 'bg-amber-100 text-amber-800'
                                      : item.status === 'OVERDUE'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: POS Collection Form (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 sticky top-6">
                  <div>
                    <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-emerald-700" />
                      Collect Fee Payment (POS)
                    </h3>
                    <p className="text-[11px] text-slate-500">Process offline counter receipt & allocate dues FIFO</p>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Payment Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['UPI', 'CASH', 'CHEQUE', 'ONLINE'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMode(m)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            paymentMode === m
                              ? 'bg-[#122A24] text-white border-[#122A24] shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount to Collect */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Payment Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={paymentAmountRupees || ''}
                        onChange={(e) => setPaymentAmountRupees(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    {studentSummary && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPaymentAmountRupees(paiseToRupees(studentSummary.balance))}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          Full Due: {formatPaise(studentSummary.balance)}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentAmountRupees(Math.round(paiseToRupees(studentSummary.balance) / 2))}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        >
                          50% Partial
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reference / Cheque No if needed */}
                  {(paymentMode === 'UPI' || paymentMode === 'ONLINE' || paymentMode === 'CHEQUE') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {paymentMode === 'CHEQUE' ? 'Cheque / Draft Number' : 'Transaction UTR / Ref Number'}
                      </label>
                      <input
                        type="text"
                        value={paymentMode === 'CHEQUE' ? chequeNo : txnRef}
                        onChange={(e) => paymentMode === 'CHEQUE' ? setChequeNo(e.target.value) : setTxnRef(e.target.value)}
                        placeholder={paymentMode === 'CHEQUE' ? 'e.g. CHQ-981245' : 'e.g. UPI-1294819284'}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                  )}

                  {/* Advance Full Year Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isAdvanceYearly}
                      onChange={(e) => setIsAdvanceYearly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="text-xs text-slate-700 font-semibold">
                      Full Academic Year Advance (Applies 1-Month Tuition Discount)
                    </span>
                  </label>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Remarks / Note (Optional)</label>
                    <input
                      type="text"
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      placeholder="e.g. Counter deposit, fee receipt copy issued"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {/* Submit Collection Button */}
                  <button
                    onClick={handleCollectPayment}
                    disabled={collectingPayment || paymentAmountRupees <= 0}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-[#122A24] text-white font-black text-xs hover:from-emerald-900 hover:to-[#0C1D19] shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {collectingPayment ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Collect Payment (₹{paymentAmountRupees.toLocaleString('en-IN')})
                  </button>
                </div>
              </div>

              {/* Collapsible Past Receipts & Cancellation Section */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-700" />
                      Student Payment Receipts History
                    </h3>
                    <p className="text-[11px] text-slate-500">View, reprint, or cancel issued counter vouchers</p>
                  </div>
                </div>

                {studentReceipts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    No payment receipts issued for this student yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-2.5">Receipt #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Mode</th>
                          <th className="p-2.5 text-right">Amount (₹)</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {studentReceipts.map((rec) => (
                          <tr key={rec.receipt_no} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-[#122A24]">{rec.receipt_no}</td>
                            <td className="p-2.5 text-slate-600">{rec.payment_date}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                                {rec.payment_mode}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-700">
                              {formatPaise(rec.amount_paise)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.is_cancelled
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {rec.is_cancelled ? 'CANCELLED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setActiveReceipt(rec);
                                  setShowReceiptModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-[11px] cursor-pointer"
                              >
                                View / Print
                              </button>
                              {!rec.is_cancelled && (
                                <button
                                  onClick={() => setReceiptToCancel(rec)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-[11px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 3: REPORTS (SINGLE REPORT ENGINE)
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header Controls: [Grouped Dropdown] [Filters Bar] [Download Split-Button] */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Grouped Report Dropdown */}
              <div className="flex-1 max-w-md">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Select Financial Report
                </label>
                <select
                  value={selectedReportId}
                  onChange={(e) => {
                    setSelectedReportId(e.target.value);
                    loadReport(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  <optgroup label="── 1. Collection Registers ──">
                    <option value="month_class_collection">Month-wise Class-wise Collection</option>
                    <option value="daily_collection">Daily Collection (Day Book)</option>
                    <option value="receipt_register">Receipt Register (with Cancelled)</option>
                    <option value="payment_mode_summary">Payment Mode Summary</option>
                  </optgroup>
                  <optgroup label="── 2. Pending & Defaulters ──">
                    <option value="pending_fees_list">Pending Fees List (with WhatsApp)</option>
                    <option value="never_paid_defaulters">Never Paid Students (Defaulters)</option>
                    <option value="annual_fee_pending">Annual Fee Pending Report</option>
                    <option value="advance_payers">Advance Payment Students</option>
                  </optgroup>
                  <optgroup label="── 3. Head-wise Registers ──">
                    <option value="exam_fee_report">Exam Fee Collection & Dues</option>
                    <option value="transport_fee_report">Transport Fee Collection & Dues</option>
                    <option value="hostel_fee_report">Hostel Fee Collection & Dues</option>
                    <option value="annual_fee_head_report">Annual Fee Master Register</option>
                  </optgroup>
                  <optgroup label="── 4. Discounts & Concessions ──">
                    <option value="sibling_discount_report">Sibling Discount Report</option>
                    <option value="month_wise_discount">Month-wise Discount & Waiver Summary</option>
                    <option value="manual_concessions">Manual Concessions & Waivers</option>
                  </optgroup>
                  <optgroup label="── 5. Master Summaries ──">
                    <option value="class_wise_summary">Class-wise Fee Summary (DCB)</option>
                    <option value="student_statement">Student-wise Ledger Statement</option>
                  </optgroup>
                </select>
              </div>

              {/* Download Split-Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2.5 bg-[#122A24] text-white rounded-xl text-xs font-bold hover:bg-[#1C443A] shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Download Excel / CSV
                </button>
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  PDF (Landscape)
                </button>
              </div>
            </div>

            {/* Dynamic Filter Bar */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-wrap items-center gap-3">
              {/* Month filter if supported */}
              {currentReportConfig.supportedFilters.includes('month') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Month:</span>
                  <select
                    value={reportFilters.month}
                    onChange={(e) => setReportFilters(p => ({ ...p, month: e.target.value }))}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    {ACADEMIC_MONTHS.map(m => (
                      <option key={m} value={m}>{MONTH_FULL_NAMES[m]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class filter if supported */}
              {currentReportConfig.supportedFilters.includes('class') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Class:</span>
                  <select
                    value={reportFilters.class}
                    onChange={(e) => setReportFilters(p => ({ ...p, class: e.target.value }))}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">All Classes</option>
                    {Array.from(new Set(students.map(s => s.class_name))).filter(Boolean).sort().map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transport filter */}
              {currentReportConfig.supportedFilters.includes('transport') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Transport:</span>
                  <select
                    value={reportFilters.transport}
                    onChange={(e) => setReportFilters(p => ({ ...p, transport: e.target.value }))}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">All</option>
                    <option value="YES">Transport Opted</option>
                    <option value="NO">Non-Transport</option>
                  </select>
                </div>
              )}

              {/* Sibling filter */}
              {currentReportConfig.supportedFilters.includes('sibling') && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Sibling:</span>
                  <select
                    value={reportFilters.sibling}
                    onChange={(e) => setReportFilters(p => ({ ...p, sibling: e.target.value }))}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">All</option>
                    <option value="YES">Sibling Discount Eligible</option>
                    <option value="NO">Single Child</option>
                  </select>
                </div>
              )}

              {/* Search text filter */}
              {currentReportConfig.supportedFilters.includes('search') && (
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={reportFilters.search}
                    onChange={(e) => setReportFilters(p => ({ ...p, search: e.target.value }))}
                    placeholder="Search in table..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => loadReport(selectedReportId, reportFilters)}
                  className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    const reset = { month: 'SEP', class: 'ALL', section: 'ALL', transport: 'ALL', sibling: 'ALL', search: '' };
                    setReportFilters(reset);
                    loadReport(selectedReportId, reset);
                  }}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Summary Strip (3-5 key totals) */}
          {reportResult && reportResult.summaryKpis && reportResult.summaryKpis.length > 0 && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 divide-x divide-slate-700/60">
                {reportResult.summaryKpis.map((kpi, idx) => (
                  <div key={idx} className={idx > 0 ? 'pl-6' : ''}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {kpi.label}
                    </span>
                    <span className="text-base font-black text-white block mt-0.5">
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {reportResult.totalRowCount} Records Loaded
              </span>
            </div>
          )}

          {/* Unified Report Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
            {reportLoading ? (
              <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                <span>Computing financial report aggregate...</span>
              </div>
            ) : !reportResult || reportResult.rows.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-400 italic">
                No matching records found for the applied report filters.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    {/* Sticky Table Header */}
                    <thead className="sticky top-0 z-20 bg-slate-800 text-white shadow-sm">
                      <tr>
                        {reportResult.columns.map((col, idx) => (
                          <th
                            key={col.key}
                            className={`p-3 font-bold ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            } ${col.pinned ? 'sticky left-0 bg-slate-800 z-30' : ''}`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Table Body (Zebra Rows) */}
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {reportResult.rows
                        .slice((reportPage - 1) * reportPageSize, reportPage * reportPageSize)
                        .map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            onClick={() => {
                              if (selectedReportId === 'month_class_collection' && row.className && row.className !== 'Grand Total') {
                                setDrawerClass(row.className);
                              }
                            }}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              rIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                            } ${selectedReportId === 'month_class_collection' ? 'cursor-pointer' : ''}`}
                          >
                            {reportResult.columns.map((col) => {
                              const val = row[col.key];

                              if (col.format === 'phone' && val && val !== 'N/A') {
                                const cleanPhone = String(val).replace(/[^0-9]/g, '');
                                return (
                                  <td key={col.key} className="p-3 text-slate-800">
                                    <div className="flex items-center gap-2">
                                      <span>{val}</span>
                                      <a
                                        href={`https://wa.me/91${cleanPhone}?text=Dear%20Parent,%20Greetings%20from%20${encodeURIComponent(selectedSchool?.school_name || 'School')}.%20Kindly%20clear%20the%20pending%20fee%20dues%20for%20your%20ward.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-700 hover:text-emerald-900 font-bold p-1 rounded hover:bg-emerald-50"
                                        title="Send WhatsApp Reminder"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={col.key}
                                  className={`p-3 ${
                                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                  } ${col.pinned ? 'sticky left-0 bg-white z-10 font-bold text-[#122A24]' : ''}`}
                                >
                                  {col.format === 'currency' ? (
                                    <span className="font-bold">{formatPaise(Number(val) || 0)}</span>
                                  ) : col.format === 'number' ? (
                                    <span>{Number(val || 0).toLocaleString('en-IN')}</span>
                                  ) : col.format === 'chip' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                      {val}
                                    </span>
                                  ) : (
                                    <span>{val}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>

                    {/* Grand Total Row at Bottom */}
                    {reportResult.grandTotalRow && (
                      <tfoot className="sticky bottom-0 bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          {reportResult.columns.map((col) => {
                            const val = reportResult.grandTotalRow![col.key];
                            return (
                              <td
                                key={col.key}
                                className={`p-3 ${
                                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                } ${col.pinned ? 'sticky left-0 bg-slate-100 z-10' : ''}`}
                              >
                                {col.format === 'currency' ? formatPaise(Number(val) || 0) : val}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <select
                      value={reportPageSize}
                      onChange={(e) => {
                        setReportPageSize(Number(e.target.value));
                        setReportPage(1);
                      }}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md font-semibold text-slate-800"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span>
                      Page {reportPage} of {Math.ceil(reportResult.rows.length / reportPageSize) || 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setReportPage(p => Math.max(1, p - 1))}
                        disabled={reportPage === 1}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setReportPage(p => p + 1)}
                        disabled={reportPage >= Math.ceil(reportResult.rows.length / reportPageSize)}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 4: SETUP (FEE STRUCTURE ACCORDION)
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#122A24]">Fee Master Structure & Configuration</h2>
              <p className="text-xs text-slate-500">Configure fee heads, class rate slabs, deposit schedule, discounts & fines</p>
            </div>

            <button
              onClick={async () => {
                if (!feeConfig) return;
                setSavingConfig(true);
                try {
                  const res = await apiFetch('/api/fee-master', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'save_config', config: feeConfig, session }),
                  });
                  const data = await res.json();
                  if (data.success) toast('Fee configuration updated successfully!', 'success');
                  else toast(data.error || 'Failed to save', 'error');
                } catch (e: any) {
                  toast(e.message || 'Save error', 'error');
                } finally {
                  setSavingConfig(false);
                }
              }}
              disabled={savingConfig}
              className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-black hover:bg-emerald-900 shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save All Configuration
            </button>
          </div>

          {/* Accordion 1: Fee Heads */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, heads: !p.heads }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Fee Heads Master Catalog</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.heads ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.heads && feeConfig && (
              <div className="p-5 border-t border-slate-100 space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Head Name</th>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Frequency</th>
                        <th className="p-2.5 text-center">Refundable</th>
                        <th className="p-2.5 text-right">Default Amount (₹)</th>
                        <th className="p-2.5 text-center">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {feeConfig.fee_heads.map((head, idx) => (
                        <tr key={head.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-[#122A24]">{head.name}</td>
                          <td className="p-2.5 font-mono text-slate-500 text-[11px]">{head.code}</td>
                          <td className="p-2.5">{head.type}</td>
                          <td className="p-2.5">{head.frequency}</td>
                          <td className="p-2.5 text-center">
                            {head.is_refundable ? (
                              <span className="text-emerald-700 font-bold text-[10px]">YES</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">NO</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            {formatPaise(head.default_amount_paise)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Class-wise Fee Structure + Installment Schedule */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, structure: !p.structure }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>Class-wise Tuition Structure & 8 Deposit Slots (Session 2026-27)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.structure ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.structure && feeConfig && (
              <div className="p-5 border-t border-slate-100 space-y-5">
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-2.5">Class Group</th>
                        <th className="p-2.5">Classes Included</th>
                        <th className="p-2.5 text-right">Monthly Tuition (₹)</th>
                        <th className="p-2.5 text-right">Quarterly Tuition (₹)</th>
                        <th className="p-2.5 text-right">Annual Composite Fee (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {feeConfig.tuition_structure.map((ts, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-[#122A24]">{ts.class_group}</td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{ts.classes.slice(0, 4).join(', ')}</td>
                          <td className="p-2.5 text-right font-black text-emerald-700">{formatPaise(ts.monthly_fee_paise)}</td>
                          <td className="p-2.5 text-right font-bold">{formatPaise(ts.quarterly_fee_paise)}</td>
                          <td className="p-2.5 text-right font-bold">{formatPaise(ts.annual_fee_paise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 8 Installment Slots */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Deposit Scheme Slots (Installment Schedule):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {feeConfig.deposit_schedule.map((slot) => (
                      <div key={slot.slot_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <p className="font-bold text-[#122A24]">{slot.slot_name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Months: {slot.months.join(', ')}</p>
                        <p className="text-[10px] text-emerald-700 font-bold">Due: {slot.due_day}th {slot.due_month}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Transport Slabs */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, transport: !p.transport }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">3</span>
                <span>Transport Distance Slabs & Monthly Rates</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.transport ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.transport && feeConfig && (
              <div className="p-5 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {feeConfig.transport_slabs.map((slab) => (
                    <div key={slab.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <Bus className="w-5 h-5 mx-auto text-amber-700 mb-1" />
                      <p className="font-bold text-xs text-[#122A24]">{slab.slab_name}</p>
                      <p className="text-sm font-black text-emerald-800 mt-1">{formatPaise(slab.monthly_fee_paise)}/mo</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accordion 4: Discount Rules */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, discounts: !p.discounts }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">4</span>
                <span>Discount Rules (Sibling, Full-Year Advance & Waivers)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.discounts ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.discounts && feeConfig && (
              <div className="p-5 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-[#122A24] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-700" /> Sibling Concession Tiers
                    </h5>
                    <ul className="text-xs space-y-1 text-slate-700">
                      <li>• 1st Child: 0% Concession (Full Fee)</li>
                      <li>• 2nd Child: 20% Tuition Concession</li>
                      <li>• 3rd Child: 30% Tuition Concession</li>
                      <li>• 4th Child: 30% Tuition Concession + Free Transport Service</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-xs text-[#122A24] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" /> Advance & Statutory Exemptions
                    </h5>
                    <ul className="text-xs space-y-1 text-slate-700">
                      <li>• Full-Year Advance Payment: 1 Month Tuition Fee Discount (~8.33%)</li>
                      <li>• RTE Mandate: 100% Full Waiver on Tuition, Admission & Annual Fee</li>
                      <li>• Staff Ward: 100% Tuition Fee Exemption</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 5: Late Fee / Fine Settings */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, lateFee: !p.lateFee }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">5</span>
                <span>Late Fee / Fine Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.lateFee ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.lateFee && feeConfig && (
              <div className="p-5 border-t border-slate-100 text-xs text-slate-600">
                <p>Late fee is currently configured as optional (off by default) with a 15-day grace window after due date.</p>
              </div>
            )}
          </div>

          {/* Accordion 6: Bulk Actions */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button
              onClick={() => setAccordionOpen(p => ({ ...p, bulk: !p.bulk }))}
              className="w-full p-5 text-left font-bold text-sm text-[#122A24] flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#122A24] text-white flex items-center justify-center text-xs font-bold">6</span>
                <span>Bulk Engine Actions (Idempotent Mapping & Demo Seeding)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${accordionOpen.bulk ? 'rotate-180' : ''}`} />
            </button>

            {accordionOpen.bulk && (
              <div className="p-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setPreviewAction('map_fees')}
                  className="px-4 py-2.5 rounded-xl bg-[#122A24] text-white font-bold text-xs hover:bg-[#1C443A] shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Map / Re-map Fees to All Students
                </button>

                <button
                  onClick={() => setPreviewAction('seed_demo')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Load Demo Data (As of Sept 10)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ACTION CONFIRMATION PREVIEW MODAL ─── */}
      {previewAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#122A24]">
                {previewAction === 'map_fees' ? 'Map Fees to Scholars' : 'Seed Realistic Demo Data'}
              </h3>
              <p className="text-xs text-slate-500">
                This action will affect <strong>{students.filter(s => s.status === 'ACTIVE').length} active scholars</strong> in session {session}.
                All existing ledger rows and already-paid entries will be safely preserved.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPreviewAction(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={previewAction === 'map_fees' ? handleBulkMapFees : handleSeedDemoData}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-800 font-bold text-xs text-white hover:bg-emerald-900 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RECEIPT PREVIEW MODAL ─── */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Printable Receipt Paper Container */}
            <div id="receipt-print-container" className="border-2 border-dashed border-slate-200 p-5 rounded-2xl space-y-4 bg-slate-50/50">
              <div className="text-center border-b border-slate-200 pb-3 space-y-0.5">
                <h2 className="text-base font-black text-[#122A24] tracking-tight uppercase">
                  {selectedSchool?.school_name || 'Delhi Public School'}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">CBSE Affiliated Senior Secondary School</p>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#122A24] text-white text-[10px] font-bold mt-1">
                  Official Fee Receipt
                </div>
              </div>

              <div className="grid grid-cols-2 text-xs gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-800">{activeReceipt.receipt_no}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Payment Date:</span>
                  <span className="font-bold text-slate-800">{activeReceipt.payment_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Student Name:</span>
                  <span className="font-bold text-[#122A24]">{activeReceipt.student_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Class & Section:</span>
                  <span className="font-bold text-slate-800">{activeReceipt.class_name} - {activeReceipt.section}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Scholar Adm No:</span>
                  <span className="font-bold text-slate-800">{activeReceipt.admission_no}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">Payment Mode:</span>
                  <span className="font-bold text-emerald-800">{activeReceipt.payment_mode}</span>
                </div>
              </div>

              {/* Allocated Particulars */}
              <div className="border-t border-b border-slate-200 py-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-500 text-[10px] uppercase">
                  <span>Particulars / Period</span>
                  <span>Amount (₹)</span>
                </div>
                {activeReceipt.allocated_heads.map((h, i) => (
                  <div key={i} className="flex justify-between font-medium text-slate-800">
                    <span>{h.fee_head} ({h.period})</span>
                    <span className="font-bold">{formatPaise(h.amount_paise)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black text-[#122A24] pt-1">
                <span>Total Amount Paid:</span>
                <span className="text-lg text-emerald-800">{formatPaise(activeReceipt.amount_paise)}</span>
              </div>

              <div className="pt-4 flex justify-between items-end text-[10px] text-slate-400 border-t border-slate-100">
                <span>Collected by: {activeReceipt.collected_by}</span>
                <span className="border-t border-slate-300 pt-1 px-4 font-bold text-slate-600">Authorized Signature</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-[#122A24] font-bold text-xs text-white hover:bg-[#1C443A] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CANCEL RECEIPT CONFIRMATION MODAL ─── */}
      {receiptToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto text-xl font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#122A24]">Cancel Receipt #{receiptToCancel.receipt_no}</h3>
              <p className="text-xs text-slate-500">
                Cancelling this voucher will restore student fee dues in the immutable ledger.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Reason for Cancellation (Audit Logged):</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Cheque bounce, wrong amount entered, cashier error"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600 h-20"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReceiptToCancel(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelReceipt}
                disabled={cancellingReceipt || cancelReason.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 font-bold text-xs text-white hover:bg-rose-800 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {cancellingReceipt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLASS STUDENT FEE STATUS BREAKDOWN DRAWER / MODAL ─── */}
      {drawerClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white flex items-center justify-center shadow-sm font-black text-base">
                  {drawerClass.replace(/[^0-9A-Za-z]/g, '').slice(0, 3)}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#122A24] flex items-center gap-2">
                    {drawerClass} — Student Fee Status Breakdown
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Session {session}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Check which students have submitted fees vs pending dues, send WhatsApp reminders, or collect instantly.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerClass(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                title="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setDrawerFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerFilter === 'pending'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Fees Pending / Not Submitted ({drawerDefaulters.length})
                </button>

                <button
                  onClick={() => setDrawerFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    drawerFilter === 'all'
                      ? 'bg-[#122A24] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Scholars ({students.filter(s => s.class_name === drawerClass && s.status === 'ACTIVE').length})
                </button>
              </div>

              {/* Search Inside Drawer */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Filter by scholar name / adm..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Students List Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[300px]">
              {drawerLoading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2.5">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                  <span>Loading class scholar status...</span>
                </div>
              ) : (() => {
                const classActiveStudents = students.filter(s => s.class_name === drawerClass && s.status === 'ACTIVE');
                const defaulterMap = new Map(drawerDefaulters.map(d => [d.studentId || d.admissionNo, d]));

                let displayList = drawerFilter === 'pending'
                  ? drawerDefaulters
                  : classActiveStudents.map(st => {
                      const def = defaulterMap.get(st.id) || defaulterMap.get(st.admission_no);
                      return {
                        studentId: st.id,
                        studentName: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
                        admissionNo: st.admission_no,
                        classSection: `${st.class_name} - ${st.section || 'A'}`,
                        fatherName: st.father_name || 'N/A',
                        mobile: st.mobile || st.emergency_contact || 'N/A',
                        monthsPending: def ? def.monthsPending : 'All Clear',
                        pendingPaise: def ? def.pendingPaise : 0,
                        lastPaidOn: def ? def.lastPaidOn : 'Cleared',
                        isPaid: !def,
                      };
                    });

                if (drawerSearch.trim()) {
                  const q = drawerSearch.toLowerCase().trim();
                  displayList = displayList.filter((item: any) =>
                    (item.studentName || '').toLowerCase().includes(q) ||
                    (item.admissionNo || '').toLowerCase().includes(q) ||
                    (item.fatherName || '').toLowerCase().includes(q) ||
                    (item.mobile || '').includes(q)
                  );
                }

                if (displayList.length === 0) {
                  return (
                    <div className="p-12 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-slate-100">
                      {drawerFilter === 'pending'
                        ? `🎉 No fee defaulters found in ${drawerClass}! All students have paid up to date.`
                        : `No matching scholars found for "${drawerSearch}".`}
                    </div>
                  );
                }

                return displayList.map((st: any, idx: number) => {
                  const isPending = (st.pendingPaise || 0) > 0;
                  const cleanPhone = String(st.mobile || '').replace(/[^0-9]/g, '');
                  const waMessage = `Dear Parent, Greetings from ${encodeURIComponent(selectedSchool?.school_name || 'Delhi Public School')}. Kindly note that fee dues of ${formatPaise(st.pendingPaise || 0)} are pending for your ward ${encodeURIComponent(st.studentName)} (${encodeURIComponent(drawerClass)}). Kindly clear at the earliest.`;

                  return (
                    <div
                      key={st.studentId || st.admissionNo || idx}
                      className={`p-3.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                        isPending
                          ? 'bg-white border-rose-100 hover:border-rose-300 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {/* Left: Scholar details */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isPending
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {st.studentName?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[#122A24]">{st.studentName}</h4>
                            <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Adm: {st.admissionNo || 'N/A'}
                            </span>
                            {st.classSection && (
                              <span className="text-[10px] font-medium text-slate-500">
                                ({st.classSection})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Father: <strong className="text-slate-700">{st.fatherName}</strong> • Phone: <strong className="text-slate-700">{st.mobile}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Middle: Pending Amount status */}
                      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        {isPending ? (
                          <div className="text-left md:text-right">
                            <span className="font-black text-sm text-rose-700 block">
                              {formatPaise(st.pendingPaise)} Pending
                            </span>
                            <span className="text-[10px] text-rose-600 font-medium">
                              {st.monthsPending || 'Dues Unpaid'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-left md:text-right">
                            <span className="font-bold text-xs text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Fees Submitted
                            </span>
                            <span className="text-[10px] text-slate-400">All Clear</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions (WhatsApp & Collect) */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {isPending && cleanPhone.length >= 10 && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${waMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Send WhatsApp Reminder to Parent"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            WhatsApp
                          </a>
                        )}

                        <button
                          onClick={() => {
                            const found = students.find(s => s.id === st.studentId || s.admission_no === st.admissionNo);
                            if (found) {
                              handleSelectStudent(found);
                              setActiveTab('collect');
                              setDrawerClass(null);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          Collect Fee
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer summary */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Class: <strong className="text-slate-800">{drawerClass}</strong></span>
              <button
                onClick={() => setDrawerClass(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardFeeMaster;
