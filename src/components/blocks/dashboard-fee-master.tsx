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
import { DualCopyFeeReceiptModal } from '@/components/dual-copy-fee-receipt-modal';
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
import { getSchoolInitials } from '@/lib/utils';

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
  preselectedTimestamp,
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

  // ─── TAB 1: OVERVIEW STATE (SWR INSTANT CACHE) ───
  const [overviewData, setOverviewData] = useState<{
    totalBilledPaise: number;
    totalCollectedPaise: number;
    totalPendingPaise: number;
    totalDiscountPaise: number;
    collectionPercentage: number;
    studentsWithNothingPaid: number;
    thisMonthBreakdown: any[];
    topPending: any[];
  }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
        const cached = sessionStorage.getItem(`fee_overview_${sId}_${selectedSession || '2026-27'}`);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      totalBilledPaise: 0,
      totalCollectedPaise: 0,
      totalPendingPaise: 0,
      totalDiscountPaise: 0,
      collectionPercentage: 0,
      studentsWithNothingPaid: 0,
      thisMonthBreakdown: [],
      topPending: [],
    };
  });

  const [overviewLoading, setOverviewLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
        const cached = sessionStorage.getItem(`fee_overview_${sId}_${selectedSession || '2026-27'}`);
        if (cached) return false;
      } catch (e) {}
    }
    return true;
  });
  const [isSyncingOverview, setIsSyncingOverview] = useState<boolean>(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // ─── TAB 2: COLLECT FEES STATE ───
  const [collectClass, setCollectClass] = useState<string>('ALL');
  const [collectSection, setCollectSection] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentLedger, setStudentLedger] = useState<StudentLedgerViewItem[]>([]);
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [studentReceipts, setStudentReceipts] = useState<ReceiptRecord[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Fee Head Filter & Multi-Select
  const [selectedFeeHeads, setSelectedFeeHeads] = useState<string[]>([]);

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

  // ─── LOAD OVERVIEW DATA (SWR SILENT BACKGROUND SYNC) ───
  const loadOverview = useCallback(async (isSilent = false) => {
    if (!isSilent && overviewData.totalBilledPaise === 0) {
      setOverviewLoading(true);
    }
    setIsSyncingOverview(true);
    setOverviewError(null);
    try {
      const sId = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      const res = await apiFetch(`/api/fee-master?action=overview&session=${session}&school_id=${encodeURIComponent(sId)}`);
      const data = await res.json();
      if (data.success && data.overview) {
        setOverviewData(data.overview);
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`fee_overview_${sId}_${session}`, JSON.stringify(data.overview));
          }
        } catch (e) {}
      } else {
        if (overviewData.totalBilledPaise === 0) {
          setOverviewError(data?.error || 'Failed to load fee overview metrics.');
        }
      }
    } catch (e: any) {
      console.error('[loadOverview error]', e);
      if (overviewData.totalBilledPaise === 0) {
        setOverviewError(e?.message || 'Network error loading overview metrics.');
      }
    } finally {
      setOverviewLoading(false);
      setIsSyncingOverview(false);
    }
  }, [session, selectedSchool, overviewData.totalBilledPaise]);

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
        setSelectedFeeHeads([]);
        setSelectedItemIds([]);
        if (found.class_name) setCollectClass(found.class_name);
        if (found.section) setCollectSection(found.section);
        loadStudentLedger(found.id);
      }
    }
  }, [preselectedStudentId, preselectedTimestamp, students, loadStudentLedger]);

  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c: any) => {
      const name = c.class_name || c.name;
      if (name) set.add(name);
    });
    students.forEach((s: any) => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [classes, students]);

  const availableSections = useMemo(() => {
    if (collectClass === 'ALL') {
      return Array.from(new Set(students.map(s => s.section || 'A'))).filter(Boolean).sort();
    }
    return Array.from(
      new Set(
        students
          .filter(s => s.class_name === collectClass)
          .map(s => s.section || 'A')
      )
    ).filter(Boolean).sort();
  }, [students, collectClass]);

  // Filter students for Tab 2 (Class, Section, and Search term)
  const filteredStudents = useMemo(() => {
    let list = students.filter(s => s.status === 'ACTIVE');
    if (collectClass !== 'ALL') {
      list = list.filter(s => s.class_name === collectClass);
    }
    if (collectSection !== 'ALL') {
      list = list.filter(s => (s.section || 'A') === collectSection);
    }
    if (studentSearch && studentSearch.trim().length > 0) {
      const q = studentSearch.toLowerCase().trim();
      list = list.filter(s => {
        const name = (s.full_name || `${(s as any).first_name || ''} ${(s as any).last_name || ''}`).toLowerCase();
        const adm = (s.admission_no || '').toLowerCase();
        const guardian = ((s as any).father_name || s.guardian_name || '').toLowerCase();
        const phone = (s.guardian_phone || (s as any).mobile || (s as any).emergency_contact || '');
        return name.includes(q) || adm.includes(q) || guardian.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [students, collectClass, collectSection, studentSearch]);

  // Unique fee heads available in current student's ledger
  const availableLedgerFeeHeads = useMemo(() => {
    const map = new Map<string, { count: number; totalDuePaise: number }>();
    studentLedger.forEach((item) => {
      const head = item.fee_head || 'OTHER';
      const existing = map.get(head) || { count: 0, totalDuePaise: 0 };
      map.set(head, {
        count: existing.count + 1,
        totalDuePaise: existing.totalDuePaise + (item.due_paise || 0),
      });
    });
    return Array.from(map.entries()).map(([head, data]) => ({
      head,
      count: data.count,
      totalDuePaise: data.totalDuePaise,
    }));
  }, [studentLedger]);

  // Filtered ledger rows based on selectedFeeHeads filter
  const displayedLedgerItems = useMemo(() => {
    if (selectedFeeHeads.length === 0) return studentLedger;
    return studentLedger.filter(item => selectedFeeHeads.includes(item.fee_head));
  }, [studentLedger, selectedFeeHeads]);

  // Calculate sum of selected item dues
  const selectedDuesPaise = useMemo(() => {
    if (selectedItemIds.length === 0) return 0;
    return studentLedger
      .filter(item => selectedItemIds.includes(item.id))
      .reduce((sum, item) => sum + (item.due_paise || 0), 0);
  }, [studentLedger, selectedItemIds]);

  // ─── HANDLERS ───

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setSelectedFeeHeads([]);
    setSelectedItemIds([]);
    loadStudentLedger(student.id);
  };

  // Toggle Fee Head Multi-Select
  const handleToggleFeeHead = (head: string) => {
    let nextHeads: string[];
    if (selectedFeeHeads.includes(head)) {
      nextHeads = selectedFeeHeads.filter(h => h !== head);
    } else {
      nextHeads = [...selectedFeeHeads, head];
    }
    setSelectedFeeHeads(nextHeads);

    // If nextHeads has items, select all pending items in those heads
    if (nextHeads.length > 0) {
      const itemsToSelect = studentLedger
        .filter(item => nextHeads.includes(item.fee_head) && item.due_paise > 0)
        .map(item => item.id);
      setSelectedItemIds(itemsToSelect);
      const duesSum = studentLedger
        .filter(item => itemsToSelect.includes(item.id))
        .reduce((sum, item) => sum + item.due_paise, 0);
      setPaymentAmountRupees(paiseToRupees(duesSum));
    } else {
      setSelectedItemIds([]);
      if (studentSummary) {
        setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
      }
    }
  };

  // Toggle individual item checkbox
  const handleToggleItemCheckbox = (itemId: string) => {
    let nextItemIds: string[];
    if (selectedItemIds.includes(itemId)) {
      nextItemIds = selectedItemIds.filter(id => id !== itemId);
    } else {
      nextItemIds = [...selectedItemIds, itemId];
    }
    setSelectedItemIds(nextItemIds);
    if (nextItemIds.length > 0) {
      const sum = studentLedger
        .filter(i => nextItemIds.includes(i.id))
        .reduce((acc, i) => acc + (i.due_paise || 0), 0);
      setPaymentAmountRupees(paiseToRupees(sum));
    } else if (studentSummary) {
      setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
    }
  };

  // Select all / deselect all displayed pending items
  const handleSelectAllDisplayed = () => {
    const pendingDisplayed = displayedLedgerItems.filter(i => i.due_paise > 0).map(i => i.id);
    const allSelected = pendingDisplayed.length > 0 && pendingDisplayed.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !pendingDisplayed.includes(id)));
      if (studentSummary) setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
    } else {
      const next = Array.from(new Set([...selectedItemIds, ...pendingDisplayed]));
      setSelectedItemIds(next);
      const sum = studentLedger.filter(i => next.includes(i.id)).reduce((acc, i) => acc + (i.due_paise || 0), 0);
      setPaymentAmountRupees(paiseToRupees(sum));
    }
  };

  // Quick helper: Select All Unpaid
  const handleSelectAllUnpaid = () => {
    const allPending = studentLedger.filter(i => i.due_paise > 0).map(i => i.id);
    setSelectedItemIds(allPending);
    const sum = studentLedger.filter(i => allPending.includes(i.id)).reduce((acc, i) => acc + (i.due_paise || 0), 0);
    setPaymentAmountRupees(paiseToRupees(sum));
  };

  // Quick helper: Select Next N Months/Items
  const handleSelectNextNUnpaid = (count: number) => {
    const pendingItems = studentLedger.filter(i => i.due_paise > 0);
    const targetItems = pendingItems.slice(0, count).map(i => i.id);
    setSelectedItemIds(targetItems);
    const sum = studentLedger.filter(i => targetItems.includes(i.id)).reduce((acc, i) => acc + (i.due_paise || 0), 0);
    setPaymentAmountRupees(paiseToRupees(sum));
  };

  // Quick helper: Clear Selection
  const handleClearSelection = () => {
    setSelectedItemIds([]);
    setSelectedFeeHeads([]);
    if (studentSummary) {
      setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
    }
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

        // Dispatch instant event for Dashboard KPI Tiles and real-time telemetry
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fee_payment_recorded', { detail: data.receipt }));
          window.dispatchEvent(new CustomEvent('erp_data_updated'));
        }
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
      {/* ─────────────────────────────────────────────────────────────
          1. MAIN CARD CONTAINER WITH SIGNATURE WATERMARK & MERGED KPI BANNER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Editorial Watermark Typography */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
        >
          Finance
        </div>
        {/* School Initials Bottom-Right Watermark */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
        >
          {getSchoolInitials(selectedSchool)}
        </div>

        {/* Top Header & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
                <Landmark className="h-7 w-7 text-emerald-700 shrink-0" />
                <span>Fee Master &amp; Institutional Finance</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                Session {session} • One Fees Engine
              </span>
              {isSyncingOverview && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" /> Live Syncing
                </span>
              )}
            </div>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Single Source of Truth for Institutional Finances, Realtime Fee Ledgers &amp; CBSE Receipts
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-[#EBF5EF]/70 px-3 py-1.5 rounded-2xl border border-[#DCE8E0]">
              <label className="text-xs font-bold text-[#122A24]">Session:</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="bg-white border border-[#DCE8E0] rounded-xl px-2.5 py-1 text-xs font-bold text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="2026-27">2026-27 (Current)</option>
                <option value="2025-26">2025-26</option>
                <option value="2027-28">2027-28</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => loadOverview(false)}
              disabled={isSyncingOverview}
              className="px-3.5 py-2 rounded-full bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Sync Live Ledger Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-700 ${isSyncingOverview ? 'animate-spin' : ''}`} />
              <span>Sync Live Ledger</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. MERGED DASHBOARD KPI HERO BANNER (DEEP FOREST GREEN #122A24)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#122A24] rounded-2xl p-6 sm:p-7 border border-[#1C443A] shadow-md relative overflow-hidden z-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#1C443A]/70 relative z-10">
            {/* Tile 1: Total Demand Invoiced */}
            <div className="sm:pr-4 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90 uppercase tracking-wider">Total Billed</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {overviewLoading && !overviewData.totalBilledPaise ? (
                  <span className="inline-block w-24 h-7 bg-emerald-900/50 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalBilledPaise || 0)
                )}
              </div>
              <p className="text-[11px] text-emerald-300/70 font-mono mt-1">Session Invoiced Demand</p>
            </div>

            {/* Tile 2: Total Collected */}
            <div className="sm:px-4 pt-4 sm:pt-0 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90 uppercase tracking-wider">Total Realized</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-emerald-400 tracking-tight mt-2 font-sans">
                {overviewLoading && !overviewData.totalCollectedPaise ? (
                  <span className="inline-block w-24 h-7 bg-emerald-900/50 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalCollectedPaise || 0)
                )}
              </div>
              <p className="text-[11px] text-emerald-300/70 font-mono mt-1">Realized Bank Inflow</p>
            </div>

            {/* Tile 3: Pending Dues */}
            <div className="sm:px-4 pt-4 sm:pt-0 group select-none">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-xs sm:text-[13px] font-medium text-amber-200/90 uppercase tracking-wider">Pending Dues</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-amber-300 tracking-tight mt-2 font-sans">
                {overviewLoading && !overviewData.totalPendingPaise ? (
                  <span className="inline-block w-24 h-7 bg-amber-900/50 rounded animate-pulse" />
                ) : (
                  formatPaise(overviewData.totalPendingPaise || 0)
                )}
              </div>
              <p className="text-[11px] text-amber-300/70 font-mono mt-1">Outstanding Receivables</p>
            </div>

            {/* Tile 4: Realization Rate */}
            <div className="sm:px-4 pt-4 sm:pt-0 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <Percent className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90 uppercase tracking-wider">Collection Rate</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {overviewData.collectionPercentage || 0}%
              </div>
              <p className="text-[11px] text-emerald-300/70 font-mono mt-1">Billed vs Realized</p>
            </div>

            {/* Tile 5: Enrolled Scholars */}
            <div className="sm:pl-4 pt-4 sm:pt-0 group select-none">
              <div className="flex items-center gap-2 text-emerald-300">
                <Users className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="text-xs sm:text-[13px] font-medium text-emerald-200/90 uppercase tracking-wider">Enrolled Scholars</span>
              </div>
              <div className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mt-2 font-sans">
                {students?.length || 505} <span className="text-base font-normal text-emerald-300/70">Scholars</span>
              </div>
              <p className="text-[11px] text-emerald-300/70 font-mono mt-1">
                {overviewData.studentsWithNothingPaid || 0} Zero Paid Accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EXACTLY 4 TOP-LEVEL TABS (NO SUB-TABS) ─── */}
      <div className="flex items-center gap-2 p-1.5 bg-[#EBF5EF]/60 rounded-2xl border border-[#DCE8E0] overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/80'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          1. Overview
        </button>

        <button
          onClick={() => setActiveTab('collect')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'collect'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/80'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          2. Collect Fees
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          3. Reports Engine
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-[#122A24] text-white shadow-xs'
              : 'text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/80'
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
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold">Error loading overview metrics</p>
                  <p className="text-[11px] text-rose-600">{overviewError}</p>
                </div>
              </div>
              <button
                onClick={() => loadOverview(false)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* 3 Supplementary Analytical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Discounts & Concessions */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Discounts &amp; Waivers</span>
                <div className="text-lg font-black text-indigo-900 mt-0.5">
                  {formatPaise(overviewData.totalDiscountPaise)}
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Sibling + Merit Concessions</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Zero Paid Accounts */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Zero Paid Accounts</span>
                <div className="text-lg font-black text-amber-900 mt-0.5">
                  {overviewData.studentsWithNothingPaid} Scholars
                </div>
                <span className="text-[10px] text-amber-600 font-medium">Require First Term Follow-Up</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Session Status */}
            <div className="bg-white p-4 rounded-2xl border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Ledger Synchronization</span>
                <div className="text-lg font-black text-emerald-900 mt-0.5">
                  100% Live Sync
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Session {session} Fee Ledgers</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Below Cards: "This Month" Mini Table & "Top Pending" List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: "This Month" Mini Table (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2 font-display">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    This Month Collection (September)
                  </h3>
                  <p className="text-[11px] text-[#2D5A4E]">Class-wise submitted vs pending breakdown</p>
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

              <div className="overflow-x-auto rounded-2xl border border-[#DCE8E0]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#EBF5EF]/70 text-[#122A24] font-bold border-b border-[#DCE8E0]">
                      <th className="p-3">Class</th>
                      <th className="p-3 text-right">Scholars</th>
                      <th className="p-3 text-right text-emerald-700">Submitted</th>
                      <th className="p-3 text-right text-rose-700">Pending</th>
                      <th className="p-3 text-right">Collected (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF5EF] font-medium text-slate-800">
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
                          <td className="p-3 text-right font-bold text-[#122A24]">{formatPaise(row.collectedPaise)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: "Top Pending" List (5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2 font-display">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Top Pending Defaulters (10 Rows)
                  </h3>
                  <p className="text-[11px] text-[#2D5A4E]">Highest outstanding fee balances</p>
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
                      className="p-3 rounded-2xl bg-[#EBF5EF]/40 border border-[#DCE8E0] flex items-center justify-between hover:bg-rose-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#122A24] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-[#122A24] font-sans">
                            {p.studentName || 'Scholar'}
                          </p>
                          <p className="text-[10.5px] text-[#2D5A4E]">
                            <span className="font-mono text-slate-500 font-medium">Adm: {p.admissionNo || p.studentId}</span> • {p.classSection} • {p.fatherName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xs sm:text-sm text-rose-700 block font-sans">
                          {formatPaise(p.pendingPaise)}
                        </span>
                        <button
                          onClick={() => {
                            const found = students.find(s => s.id === p.studentId || s.admission_no === p.admissionNo);
                            if (found) handleSelectStudent(found);
                            setActiveTab('collect');
                          }}
                          className="text-[10.5px] text-emerald-800 font-bold hover:underline cursor-pointer"
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
          {/* ─── Class, Section & Search Filter Bar ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Class Filter */}
              <div className="w-full md:w-48">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-emerald-700" /> Class Filter
                </label>
                <select
                  value={collectClass}
                  onChange={(e) => {
                    setCollectClass(e.target.value);
                    setCollectSection('ALL');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DCE8E0] rounded-2xl text-xs font-bold text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  <option value="ALL">All Classes ({availableClasses.length})</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div className="w-full md:w-36">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Section
                </label>
                <select
                  value={collectSection}
                  onChange={(e) => setCollectSection(e.target.value)}
                  disabled={collectClass === 'ALL' && availableSections.length === 0}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#DCE8E0] rounded-2xl text-xs font-bold text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer disabled:opacity-50"
                >
                  <option value="ALL">All Sections</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="flex-1 relative">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Scholar Search (Name / Adm No / Mobile)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type student name, admission number, or father mobile..."
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-[#DCE8E0] rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reset Filters */}
              {(collectClass !== 'ALL' || collectSection !== 'ALL' || studentSearch) && (
                <div className="self-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCollectClass('ALL');
                      setCollectSection('ALL');
                      setStudentSearch('');
                    }}
                    className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title="Reset All Filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Quick Students Selection Strip when searching or filtering by Class */}
            {(!selectedStudent || studentSearch.trim().length > 0 || collectClass !== 'ALL') && (
              <div className="pt-3 border-t border-[#DCE8E0]/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-[#2D5A4E] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    {studentSearch
                      ? `Search Matches (${filteredStudents.length} scholars):`
                      : collectClass !== 'ALL'
                      ? `Scholars in ${collectClass}${collectSection !== 'ALL' ? ` - Section ${collectSection}` : ''} (${filteredStudents.length}):`
                      : `Scholars Directory (${Math.min(12, filteredStudents.length)} shown):`}
                  </span>
                  {selectedStudent && (
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Active: {selectedStudent.full_name || `${(selectedStudent as any).first_name || ''} ${(selectedStudent as any).last_name || ''}`.trim() || selectedStudent.admission_no} (#{selectedStudent.admission_no})
                    </span>
                  )}
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-slate-100">
                    No active scholars found matching the selected class and search criteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {filteredStudents.slice(0, 30).map((st) => {
                      const isCurrentlySelected = selectedStudent?.id === st.id;
                      const stName = st.full_name || `${(st as any).first_name || ''} ${(st as any).last_name || ''}`.trim() || `Scholar #${st.admission_no}`;
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStudent(st)}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                            isCurrentlySelected
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-600/20 shadow-xs'
                              : 'bg-[#EBF5EF]/30 border-[#DCE8E0] hover:bg-emerald-50/50 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {st.photo || st.avatar ? (
                              <img
                                src={st.photo || st.avatar}
                                alt={stName}
                                className="w-8 h-8 rounded-xl object-cover border border-[#DCE8E0] shrink-0"
                              />
                            ) : (
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCurrentlySelected ? 'bg-emerald-700 text-white' : 'bg-[#122A24] text-white'
                              }`}>
                                {stName[0]?.toUpperCase() || 'S'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[#122A24] truncate">
                                {stName}
                              </p>
                              <p className="text-[10px] text-[#2D5A4E] truncate">
                                Adm #{st.admission_no} • {st.class_name}-{st.section || 'A'}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                            isCurrentlySelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white text-[#122A24] border border-[#DCE8E0] group-hover:bg-emerald-100'
                          }`}>
                            {isCurrentlySelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {!selectedStudent ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#DCE8E0] shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF5EF] text-emerald-800 flex items-center justify-center mx-auto text-2xl font-bold shadow-2xs">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-[#122A24] font-display">Select a Student to Collect Fees</h3>
              <p className="text-xs text-[#2D5A4E] max-w-md mx-auto">
                Select a class and section from the filters above or use the search box to lookup any student by name, scholar admission number, or father mobile.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Left & Right Grid: Left = Student Card + Fee Heads + Ledger, Right = Payment Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT PANEL: Student Profile + Fee Head Filter + Ledger (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Student Card */}
                  <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedStudent.photo || selectedStudent.avatar ? (
                        <img
                          src={selectedStudent.photo || selectedStudent.avatar}
                          alt={selectedStudent.full_name || 'Student'}
                          className="w-14 h-14 rounded-2xl object-cover border border-[#DCE8E0] shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#122A24] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
                          {(selectedStudent.full_name || 'S')[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-black text-[#122A24] font-display">
                          {selectedStudent.full_name || `${(selectedStudent as any).first_name || ''} ${(selectedStudent as any).last_name || ''}`.trim() || `Scholar #${selectedStudent.admission_no}`}
                        </h2>
                        <p className="text-xs text-[#2D5A4E] font-medium">
                          Adm #{selectedStudent.admission_no} • {selectedStudent.class_name} - {selectedStudent.section || 'A'} • Guardian: {selectedStudent.guardian_name || (selectedStudent as any).father_name || 'N/A'}
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
                      <span className="text-[10px] text-[#2D5A4E] font-medium">Session {session}</span>
                    </div>
                  </div>

                  {/* ─── Fee Head Multi-Select Filter Bar ─── */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-[#122A24]">Filter &amp; Multi-Select Fee Heads:</span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline">(Click to toggle specific heads)</span>
                      </div>
                      {selectedFeeHeads.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFeeHeads([]);
                            setSelectedItemIds([]);
                            if (studentSummary) setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
                          }}
                          className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Clear Head Filters
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* All Heads Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFeeHeads([]);
                          setSelectedItemIds([]);
                          if (studentSummary) setPaymentAmountRupees(paiseToRupees(studentSummary.balance));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedFeeHeads.length === 0
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-[#EBF5EF]/60 text-[#2D5A4E] border border-[#DCE8E0] hover:bg-white'
                        }`}
                      >
                        <span>All Heads ({studentLedger.length})</span>
                      </button>

                      {/* Individual Dynamic Fee Head Chips */}
                      {availableLedgerFeeHeads.map(({ head, count, totalDuePaise }) => {
                        const isSelected = selectedFeeHeads.includes(head);
                        return (
                          <button
                            key={head}
                            type="button"
                            onClick={() => handleToggleFeeHead(head)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/30'
                                : totalDuePaise > 0
                                ? 'bg-white text-[#122A24] border-[#DCE8E0] hover:border-emerald-400'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-white text-emerald-800' : 'border border-slate-300'
                            }`}>
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{head}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isSelected
                                ? 'bg-emerald-800 text-emerald-100'
                                : totalDuePaise > 0
                                ? 'bg-rose-100 text-rose-800 font-bold'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {totalDuePaise > 0 ? formatPaise(totalDuePaise) : `${count}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── Selected Fee Items Highlight Banner ─── */}
                  {selectedItemIds.length > 0 && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">
                            {selectedItemIds.length} Fee Item{selectedItemIds.length > 1 ? 's' : ''} Selected
                            {selectedFeeHeads.length > 0 && ` (${selectedFeeHeads.join(', ')})`}
                          </p>
                          <p className="text-[11px] text-emerald-800 font-bold">
                            Total Due for Selected: <span className="font-black text-emerald-950">{formatPaise(selectedDuesPaise)}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentAmountRupees(paiseToRupees(selectedDuesPaise))}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer self-end sm:self-center"
                      >
                        Set Amount (₹{paiseToRupees(selectedDuesPaise).toLocaleString('en-IN')})
                      </button>
                    </div>
                  )}

                  {/* ─── Student Fee Ledger Table with Multi-Month Ticks ─── */}
                  <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2 font-display">
                          <BookOpen className="w-4 h-4 text-emerald-700" />
                          Student Fee Ledger
                          {selectedFeeHeads.length > 0 && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Filtered: {selectedFeeHeads.join(', ')}
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-[#2D5A4E]">Tick multiple months or fee heads below to collect in a single payment</p>
                      </div>
                      <button
                        onClick={() => loadStudentLedger(selectedStudent.id)}
                        className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 self-end sm:self-center flex items-center gap-1"
                        title="Refresh Ledger"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${ledgerLoading ? 'animate-spin' : ''}`} />
                        <span className="text-[11px] font-bold">Sync Ledger</span>
                      </button>
                    </div>

                    {/* ─── Quick Multi-Month Selection Shortcuts Bar ─── */}
                    <div className="p-3 bg-[#EBF5EF]/60 rounded-2xl border border-[#DCE8E0] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#122A24] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        Quick Multi-Month Ticks:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllUnpaid}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-[#DCE8E0] rounded-xl text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          ✓ Tick All Unpaid ({studentLedger.filter(i => i.due_paise > 0).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectNextNUnpaid(3)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-[#DCE8E0] rounded-xl text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          + Next 3 Months (Quarter)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectNextNUnpaid(6)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-[#DCE8E0] rounded-xl text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          + Next 6 Months
                        </button>
                        {selectedItemIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelection}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Untick All
                          </button>
                        )}
                      </div>
                    </div>

                    {ledgerLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading ledger data...</div>
                    ) : displayedLedgerItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        {selectedFeeHeads.length > 0
                          ? `No fee items matching heads (${selectedFeeHeads.join(', ')}).`
                          : "No fee ledger items found. Click 'Map Fees' in Setup tab."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-[#DCE8E0]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#EBF5EF]/80 text-[#122A24] font-bold border-b border-[#DCE8E0]">
                              <th className="p-3 w-12 text-center border-r border-[#DCE8E0]/70">
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <input
                                    type="checkbox"
                                    id="select-all-ledger-items"
                                    checked={
                                      displayedLedgerItems.filter(i => i.due_paise > 0).length > 0 &&
                                      displayedLedgerItems.filter(i => i.due_paise > 0).every(i => selectedItemIds.includes(i.id))
                                    }
                                    onChange={handleSelectAllDisplayed}
                                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                                    title="Tick all pending due rows"
                                  />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Tick</span>
                                </div>
                              </th>
                              <th className="p-3">Head</th>
                              <th className="p-3">Period</th>
                              <th className="p-3 text-right">Gross</th>
                              <th className="p-3 text-right text-indigo-700">Disc</th>
                              <th className="p-3 text-right">Net</th>
                              <th className="p-3 text-right text-emerald-700">Paid</th>
                              <th className="p-3 text-right text-rose-700">Due</th>
                              <th className="p-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EBF5EF] font-medium text-slate-800">
                            {displayedLedgerItems.map((item) => {
                              const isChecked = selectedItemIds.includes(item.id);
                              const isPayable = item.due_paise > 0;
                              return (
                                <tr
                                  key={item.id}
                                  onClick={() => isPayable && handleToggleItemCheckbox(item.id)}
                                  className={`transition-colors ${
                                    isChecked
                                      ? 'bg-emerald-50/90 font-semibold border-l-4 border-l-emerald-600'
                                      : isPayable
                                      ? 'hover:bg-emerald-50/40 cursor-pointer'
                                      : 'bg-slate-50/40 text-slate-500'
                                  }`}
                                >
                                  <td className="p-3 text-center border-r border-[#DCE8E0]/60" onClick={(e) => e.stopPropagation()}>
                                    {isPayable ? (
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleItemCheckbox(item.id)}
                                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                                        title={`Tick ${item.fee_head} (${item.period}) to pay`}
                                      />
                                    ) : (
                                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-bold mx-auto" title="Paid">
                                        ✓
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold text-[#122A24] flex items-center gap-1.5">
                                    <span>{item.fee_head}</span>
                                  </td>
                                  <td className="p-3 text-slate-600">{item.period}</td>
                                  <td className="p-3 text-right">{formatPaise(item.gross_paise)}</td>
                                  <td className="p-3 text-right text-indigo-700 font-bold">
                                    {item.discount_paise > 0 ? formatPaise(item.discount_paise) : '-'}
                                  </td>
                                  <td className="p-3 text-right font-bold">{formatPaise(item.net_paise)}</td>
                                  <td className="p-3 text-right font-bold text-emerald-700">
                                    {item.paid_paise > 0 ? formatPaise(item.paid_paise) : '-'}
                                  </td>
                                  <td className="p-3 text-right font-black text-rose-700">
                                    {item.due_paise > 0 ? formatPaise(item.due_paise) : '₹0'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.status === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : item.status === 'PARTIAL'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : item.status === 'OVERDUE'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ─── Bottom Action Bar When Items Are Ticked ─── */}
                    {selectedItemIds.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-[#122A24] to-[#1C443A] text-white rounded-2xl shadow-md border border-[#1C443A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-200">
                              {selectedItemIds.length} Fee Head/Month{selectedItemIds.length > 1 ? 's' : ''} Ticked for Payment
                            </p>
                            <p className="text-sm font-black text-white">
                              Total Selected Amount: <span className="text-emerald-300 text-base">{formatPaise(selectedDuesPaise)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentAmountRupees(paiseToRupees(selectedDuesPaise))}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#122A24] font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CreditCard className="w-4 h-4" />
                            Apply &amp; Collect (₹{paiseToRupees(selectedDuesPaise).toLocaleString('en-IN')})
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSelection}
                            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Clear Selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: POS Collection Form (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4 sticky top-6">
                  <div>
                    <h3 className="font-bold text-[#122A24] text-sm flex items-center gap-2 font-display">
                      <IndianRupee className="w-4 h-4 text-emerald-700" />
                      Collect Fee Payment (POS)
                    </h3>
                    <p className="text-[11px] text-[#2D5A4E]">Process counter receipt & allocate dues to selected heads</p>
                  </div>

                  {/* Selected Heads Scope Pill */}
                  <div className="p-2.5 rounded-xl bg-[#EBF5EF]/60 border border-[#DCE8E0] flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold">Allocation Target:</span>
                    <span className="font-bold text-[#122A24]">
                      {selectedItemIds.length > 0
                        ? `${selectedItemIds.length} Selected Items (${formatPaise(selectedDuesPaise)})`
                        : 'All Pending Heads (FIFO)'}
                    </span>
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
                              ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
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
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-[#DCE8E0] rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    {studentSummary && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {selectedItemIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentAmountRupees(paiseToRupees(selectedDuesPaise))}
                            className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer border border-emerald-300"
                          >
                            Selected: {formatPaise(selectedDuesPaise)}
                          </button>
                        )}
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
                        className="w-full px-3.5 py-2 bg-slate-50 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                      className="w-full px-3.5 py-2 bg-slate-50 border border-[#DCE8E0] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
              <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
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
                        <th className="p-2.5 text-center">Structure Status</th>
                        <th className="p-2.5 text-center">Refundable</th>
                        <th className="p-2.5 text-right">Default Amount (₹)</th>
                        <th className="p-2.5 text-center">Demand Gen</th>
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
                            {head.confirmed !== false ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                Confirmed Official
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                Unconfirmed (Placeholder)
                              </span>
                            )}
                          </td>
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
                            <button
                              type="button"
                              onClick={() => {
                                setFeeConfig(prev => {
                                  if (!prev) return prev;
                                  const updatedHeads = prev.fee_heads.map((h, i) =>
                                    (h.id === head.id || i === idx) ? { ...h, is_active: !h.is_active } : h
                                  );
                                  return { ...prev, fee_heads: updatedHeads };
                                });
                              }}
                              className={`w-8 h-4.5 rounded-full transition-colors relative inline-flex items-center px-0.5 cursor-pointer ${
                                head.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                              }`}
                              title={head.is_active ? 'Active for Demand Generation' : 'Disabled for Demand Generation'}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                head.is_active ? 'translate-x-3.5' : 'translate-x-0'
                              }`} />
                            </button>
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

      {/* ─── DUAL-COPY A4 PRINTABLE RECEIPT MODAL (PARENT COPY + SCHOOL COUNTERFOIL) ─── */}
      <DualCopyFeeReceiptModal
        isOpen={showReceiptModal && !!activeReceipt}
        onClose={() => setShowReceiptModal(false)}
        receipt={activeReceipt}
        selectedSchool={selectedSchool}
        student={selectedStudent}
      />

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
                      const stName = st.full_name || `${(st as any).first_name || ''} ${(st as any).last_name || ''}`.trim() || st.admission_no;
                      return {
                        studentId: st.id,
                        studentName: stName,
                        admissionNo: st.admission_no,
                        classSection: `${st.class_name} - ${st.section || 'A'}`,
                        fatherName: st.guardian_name || (st as any).father_name || 'N/A',
                        mobile: st.guardian_phone || (st as any).mobile || (st as any).emergency_contact || 'N/A',
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
