/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
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
  GraduationCap,
  Zap,
  Eye,
  ChevronLeft,
  RefreshCw,
  Info,
  Save,
  RotateCcw,
  Upload,
  MessageCircle
} from 'lucide-react';
import { FeeInvoice, Student, School, ClassRoom, Teacher } from '@/lib/types';
import { sortClassesChronologically } from '@/lib/cbse-subjects';
import { openWhatsAppDirect, buildFeeReminderText, buildFeeReceiptText } from '@/lib/whatsapp';

export interface DashboardFeesProps {
  selectedSchool?: School | null;
  students: Student[];
  invoices: FeeInvoice[];
  classes: ClassRoom[];
  teachers: Teacher[];
  selectedSession: string;
  subTab?: 'reports' | 'collect' | 'overview' | 'monthly' | 'structure' | 'slips' | 'payroll';
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
  subTab = 'reports',
  onRefresh,
  showAdminToast
}: DashboardFeesProps) {
  // Navigation Tabs (Fees Report Engine, Quick Collect, Month-Wise Sheet, Fee Master, Class Slips, Ledger, Payroll)
  const [feeTab, setFeeTab] = useState<'reports' | 'collect' | 'overview' | 'monthly' | 'structure' | 'slips' | 'payroll'>((subTab as any) || 'reports');
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

  // Quick Collect Form State (Redesigned Studio)
  const [collectFilterClass, setCollectFilterClass] = useState('ALL');
  const [collectSearchQuery, setCollectSearchQuery] = useState('');
  const [collectStudentId, setCollectStudentId] = useState('');

  // Step 2: Choose Fee Duration / Multi-Month Payment Plan
  const [collectSelectedMonths, setCollectSelectedMonths] = useState<string[]>(['April 2026']);
  const [collectIncludeAnnual, setCollectIncludeAnnual] = useState(true);
  const [collectAnnualFeeAmount, setCollectAnnualFeeAmount] = useState(5000);
  const [collectReceiptTitle, setCollectReceiptTitle] = useState('April 2026 + Annual Fee');

  // Step 3: Fee Amount, Concession Discount & Net Summary
  const [collectBaseAmount, setCollectBaseAmount] = useState('6800');
  const [collectDiscount, setCollectDiscount] = useState('0');
  const [collectDiscountReason, setCollectDiscountReason] = useState('');
  const [collectPaymentMode, setCollectPaymentMode] = useState('CASH');
  const [collectRefNumber, setCollectRefNumber] = useState('');
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

  // ─────────────────────────────────────────────────────────────
  // MONTH-WISE FEE MODULE STATE & HANDLERS
  // ─────────────────────────────────────────────────────────────
  const ACADEMIC_MONTHS = useMemo(() => [
    'April 2026', 'May 2026', 'June 2026', 'July 2026',
    'August 2026', 'September 2026', 'October 2026', 'November 2026',
    'December 2026', 'January 2027', 'February 2027', 'March 2027'
  ], []);

  // Standard CBSE Class Checklist
  const availableClassCheckboxes = useMemo(() => {
    const standard = [
      'Class I (A)', 'Class II (A)', 'Class III (A)', 'Class IV (A)', 'Class IX (A)',
      'Class V (A)', 'Class VI (A)', 'Class VII (A)', 'Class VIII (A)', 'Class X (A)',
      'Class XI (A)', 'Class XI (B)', 'Class XII (A)', 'Class XII (B)', 'LKG (A)', 'PG (A)', 'UKG (A)'
    ];
    if (!students || students.length === 0) return standard;
    
    const set = new Set<string>();
    students.forEach(s => {
      if (s.class_name) {
        set.add(`${s.class_name} (${s.section || 'A'})`);
      }
    });
    if (set.size === 0) return standard;
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students]);

  const [monthlyAllClasses, setMonthlyAllClasses] = useState(true);
  const [monthlySelectedClasses, setMonthlySelectedClasses] = useState<string[]>([]);
  const [monthlySelectedSection, setMonthlySelectedSection] = useState('ALL');
  const [monthlySearchStudent, setMonthlySearchStudent] = useState('');
  const [monthlySelectedMonths, setMonthlySelectedMonths] = useState<string[]>([
    'April 2026', 'May 2026', 'June 2026', 'July 2026'
  ]);
  const [monthlyFeeHeadTab, setMonthlyFeeHeadTab] = useState<'ALL' | 'REGISTRATION' | 'ANNUAL' | 'TRANSPORT' | 'TUITION'>('ALL');
  const [selectedDossierStudent, setSelectedDossierStudent] = useState<Student | null>(null);
  const [monthlyPage, setMonthlyPage] = useState(1);
  const [monthlyReportKey, setMonthlyReportKey] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const itemsPerPage = 20;

  // Overview Ledger Pagination State
  const [overviewPage, setOverviewPage] = useState(1);
  const [overviewPageSize, setOverviewPageSize] = useState(50);

  // Month range text helper
  const monthRangeText = useMemo(() => {
    if (monthlySelectedMonths.length === 0) return 'No Months Selected';
    if (monthlySelectedMonths.length === 1) return `${monthlySelectedMonths[0]} (1 Month)`;
    const first = monthlySelectedMonths[0];
    const last = monthlySelectedMonths[monthlySelectedMonths.length - 1];
    return `${first} – ${last} (${monthlySelectedMonths.length} Months)`;
  }, [monthlySelectedMonths]);

  // Handle Quick Presets
  const applyMonthPreset = (preset: 'APR_JUL' | 'Q1' | 'H1' | 'ALL_12') => {
    if (preset === 'APR_JUL') {
      setMonthlySelectedMonths(['April 2026', 'May 2026', 'June 2026', 'July 2026']);
    } else if (preset === 'Q1') {
      setMonthlySelectedMonths(['April 2026', 'May 2026', 'June 2026']);
    } else if (preset === 'H1') {
      setMonthlySelectedMonths(['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026']);
    } else if (preset === 'ALL_12') {
      setMonthlySelectedMonths([...ACADEMIC_MONTHS]);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // EDITABLE INSTITUTIONAL FEE STRUCTURE (ADMIN ENGINE)
  // ─────────────────────────────────────────────────────────────
  const DEFAULT_ONE_TIME_FEES = [
    { id: '1', particulars: 'Prospectus + Registration Fees', amount: 1000 },
    { id: '2', particulars: 'Admission Fee (Non-Refundable)', amount: 5000 },
    { id: '3', particulars: 'Annual Fee (PG to VIII)', amount: 5000 },
    { id: '4', particulars: 'Annual Fee (IX to XII)', amount: 6000 },
    { id: '5', particulars: 'Hostel Security Money (Refundable)', amount: 10000 },
    { id: '6', particulars: 'Transfer Certificate / Character Certificate', amount: 1000 },
  ];

  const DEFAULT_TUITION_FEES = [
    { id: '1', className: 'PG, LKG & UKG', monthlyFee: 1000, quarterlyFee: 3000 },
    { id: '2', className: 'Class I & II', monthlyFee: 1400, quarterlyFee: 4200 },
    { id: '3', className: 'Class III to V', monthlyFee: 1600, quarterlyFee: 4800 },
    { id: '4', className: 'Class VI to VIII', monthlyFee: 1800, quarterlyFee: 5400 },
    { id: '5', className: 'Class IX & X', monthlyFee: 2000, quarterlyFee: 6000 },
    { id: '6', className: 'Class XI & XII', monthlyFee: 2400, quarterlyFee: 7200 },
  ];

  const DEFAULT_TRANSPORT_FEES = [
    { id: '1', slab: '1 to 3 km', monthlyFee: 800 },
    { id: '2', slab: '4 to 6 km', monthlyFee: 900 },
    { id: '3', slab: '7 to 12 km', monthlyFee: 1100 },
    { id: '4', slab: '13 to 16 km', monthlyFee: 1300 },
    { id: '5', slab: '16 to 20 km', monthlyFee: 1800 },
  ];

  const DEFAULT_DEPOSIT_SCHEMES = [
    { id: '1', title: '1. April + Annual Fee', isSpecial: true },
    { id: '2', title: '2. May + June', isSpecial: false },
    { id: '3', title: '3. July', isSpecial: false },
    { id: '4', title: '4. August', isSpecial: false },
    { id: '5', title: '5. September + February', isSpecial: true },
    { id: '6', title: '6. October', isSpecial: false },
    { id: '7', title: '7. November', isSpecial: false },
    { id: '8', title: '8. December + March', isSpecial: true },
    { id: '9', title: '9. January (Final Session Fee Settlement)', isSpecial: false },
  ];

  const [oneTimeFees, setOneTimeFees] = useState<{ id: string; particulars: string; amount: number }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cbse_one_time_fees');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_ONE_TIME_FEES;
  });

  const [tuitionFees, setTuitionFees] = useState<{ id: string; className: string; monthlyFee: number; quarterlyFee: number }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cbse_tuition_fees');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_TUITION_FEES;
  });

  const [transportFees, setTransportFees] = useState<{ id: string; slab: string; monthlyFee: number }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cbse_transport_fees');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_TRANSPORT_FEES;
  });

  const [depositSchemes, setDepositSchemes] = useState<{ id: string; title: string; isSpecial?: boolean }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cbse_deposit_schemes');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return DEFAULT_DEPOSIT_SCHEMES;
  });

  const [isSavingStructure, setIsSavingStructure] = useState(false);
  const [structureSaveSuccess, setStructureSaveSuccess] = useState(false);

  // Save all fee structure changes
  const handleSaveFeeStructure = () => {
    setIsSavingStructure(true);
    try {
      localStorage.setItem('cbse_one_time_fees', JSON.stringify(oneTimeFees));
      localStorage.setItem('cbse_tuition_fees', JSON.stringify(tuitionFees));
      localStorage.setItem('cbse_transport_fees', JSON.stringify(transportFees));
      localStorage.setItem('cbse_deposit_schemes', JSON.stringify(depositSchemes));
      setStructureSaveSuccess(true);
      notify('Institutional Fee Structure saved successfully!');
      setTimeout(() => setStructureSaveSuccess(false), 3000);
    } catch (err: any) {
      notify(`Failed to save fee structure: ${err.message}`);
    } finally {
      setIsSavingStructure(false);
    }
  };

  // Reset to CBSE standard defaults
  const handleResetFeeStructure = () => {
    if (confirm('Are you sure you want to reset all fee structures and installment cycles to CBSE defaults?')) {
      setOneTimeFees(DEFAULT_ONE_TIME_FEES);
      setTuitionFees(DEFAULT_TUITION_FEES);
      setTransportFees(DEFAULT_TRANSPORT_FEES);
      setDepositSchemes(DEFAULT_DEPOSIT_SCHEMES);
      localStorage.removeItem('cbse_one_time_fees');
      localStorage.removeItem('cbse_tuition_fees');
      localStorage.removeItem('cbse_transport_fees');
      localStorage.removeItem('cbse_deposit_schemes');
      notify('Fee structures reset to defaults.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. FEE STRUCTURE UPLOAD & EXPORT HANDLERS ("main bhi fee structure upload kroonga uske hisab se")
  // ─────────────────────────────────────────────────────────────
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const handleUploadFeeStructure = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.tuitionFees) setTuitionFees(parsed.tuitionFees);
          if (parsed.oneTimeFees) setOneTimeFees(parsed.oneTimeFees);
          if (parsed.transportFees) setTransportFees(parsed.transportFees);
          if (parsed.depositSchemes) setDepositSchemes(parsed.depositSchemes);
          localStorage.setItem('cbse_tuition_fees', JSON.stringify(parsed.tuitionFees || tuitionFees));
          localStorage.setItem('cbse_one_time_fees', JSON.stringify(parsed.oneTimeFees || oneTimeFees));
          localStorage.setItem('cbse_transport_fees', JSON.stringify(parsed.transportFees || transportFees));
        } else {
          // CSV Parser
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const newTuition: typeof tuitionFees = [];
          const newOneTime: typeof oneTimeFees = [];
          const newTransport: typeof transportFees = [];

          lines.forEach((line, idx) => {
            if (idx === 0 && (line.toLowerCase().includes('class') || line.toLowerCase().includes('particulars'))) {
              return;
            }
            const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
            if (parts.length >= 2) {
              const typeOrName = parts[0];
              const p1 = parts[1];
              const p2 = parts[2];

              // Transport Slab check
              if (typeOrName.toLowerCase().includes('km') || p1?.toLowerCase().includes('km')) {
                const slab = typeOrName.toLowerCase().includes('km') ? typeOrName : p1;
                const fee = Number(typeOrName.toLowerCase().includes('km') ? p1 : p2) || 800;
                newTransport.push({ id: String(newTransport.length + 1), slab, monthlyFee: fee });
              }
              // Tuition Class check
              else if (/class|pg|lkg|ukg|nursery/i.test(typeOrName)) {
                const monthly = Number(p1) || 1000;
                const quarterly = Number(p2) || (monthly * 3);
                newTuition.push({ id: String(newTuition.length + 1), className: typeOrName, monthlyFee: monthly, quarterlyFee: quarterly });
              }
              // One-Time / Annual Fees
              else {
                const amt = Number(p1) || 1000;
                newOneTime.push({ id: String(newOneTime.length + 1), particulars: typeOrName, amount: amt });
              }
            }
          });

          if (newTuition.length > 0) {
            setTuitionFees(newTuition);
            localStorage.setItem('cbse_tuition_fees', JSON.stringify(newTuition));
          }
          if (newOneTime.length > 0) {
            setOneTimeFees(newOneTime);
            localStorage.setItem('cbse_one_time_fees', JSON.stringify(newOneTime));
          }
          if (newTransport.length > 0) {
            setTransportFees(newTransport);
            localStorage.setItem('cbse_transport_fees', JSON.stringify(newTransport));
          }
        }

        setUploadFeedback(`Fee structure successfully imported from ${file.name}!`);
        notify(`Fee structure imported & applied from ${file.name}`);
        setTimeout(() => setUploadFeedback(null), 4000);
      } catch (err: any) {
        notify(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadSampleStructureCsv = () => {
    const csvContent = [
      'Type,Category_Or_Class,Monthly_Fee_Or_Amount,Quarterly_Fee',
      'ONE_TIME,Prospectus + Registration Fees,1000,',
      'ONE_TIME,Admission Fee (Non-Refundable),5000,',
      'ONE_TIME,Annual Fee (PG to VIII),5000,',
      'ONE_TIME,Annual Fee (IX to XII),6000,',
      'ONE_TIME,Hostel Security Money (Refundable),10000,',
      'ONE_TIME,Transfer Certificate / Character Certificate,1000,',
      'TUITION,PG LKG & UKG,1000,3000',
      'TUITION,Class I & II,1400,4200',
      'TUITION,Class III to V,1600,4800',
      'TUITION,Class VI to VIII,1800,5400',
      'TUITION,Class IX & X,2000,6000',
      'TUITION,Class XI & XII,2400,7200',
      'TRANSPORT,1 to 3 km,800,',
      'TRANSPORT,4 to 6 km,900,',
      'TRANSPORT,7 to 12 km,1100,',
      'TRANSPORT,13 to 16 km,1300,',
      'TRANSPORT,16 to 20 km,1800,'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Fee_Structure_Template_${selectedSession || '2026-27'}.csv`;
    link.click();
    notify('Sample Fee Structure CSV template downloaded!');
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CBSE INSTITUTIONAL FEE RATES & SIBLING CONCESSION HELPERS
  // ─────────────────────────────────────────────────────────────
  const getTuitionFeeRate = (className: string) => {
    const raw = (className || '').trim().toLowerCase();
    const norm = raw.replace(/^class\s*/i, '').trim();

    // 1. Playgroup, PG, Nursery, LKG, UKG -> ₹1,000 / month, ₹3,000 / quarter
    if (/^(pg|play|playgroup|play-group|lkg|ukg|nursery|pre|kg|prep|infant)/i.test(norm) || raw.includes('playgroup')) {
      return { monthly: 1000, quarterly: 3000 };
    }
    // 2. Class I & II -> ₹1,400 / month, ₹4,200 / quarter
    if (/^(1|2|i|ii|1st|2nd)$/i.test(norm) || /^(i|ii)\b/i.test(norm)) {
      return { monthly: 1400, quarterly: 4200 };
    }
    // 3. Class III to V -> ₹1,600 / month, ₹4,800 / quarter
    if (/^(3|4|5|iii|iv|v|3rd|4th|5th)$/i.test(norm) || /^(iii|iv|v)\b/i.test(norm)) {
      return { monthly: 1600, quarterly: 4800 };
    }
    // 4. Class VI to VIII -> ₹1,800 / month, ₹5,400 / quarter
    if (/^(6|7|8|vi|vii|viii|6th|7th|8th)$/i.test(norm) || /^(vi|vii|viii)\b/i.test(norm)) {
      return { monthly: 1800, quarterly: 5400 };
    }
    // 5. Class IX & X -> ₹2,000 / month, ₹6,000 / quarter
    if (/^(9|10|ix|x|9th|10th)$/i.test(norm) || /^(ix|x)\b/i.test(norm)) {
      return { monthly: 2000, quarterly: 6000 };
    }
    // 6. Class XI & XII -> ₹2,400 / month, ₹7,200 / quarter
    if (/^(11|12|xi|xii|11th|12th)$/i.test(norm) || /^(xi|xii)\b/i.test(norm)) {
      return { monthly: 2400, quarterly: 7200 };
    }

    for (const t of tuitionFees) {
      const tNorm = t.className.toLowerCase().trim().replace(/^class\s*/i, '');
      if (tNorm === norm || tNorm.includes(norm) || norm.includes(tNorm)) {
        return { monthly: t.monthlyFee, quarterly: t.quarterlyFee };
      }
    }
    return { monthly: 1400, quarterly: 4200 };
  };

  const getAnnualFeeRate = (className: string) => {
    const raw = (className || '').trim().toLowerCase();
    const norm = raw.replace(/^class\s*/i, '').trim();
    const isSenior = /^(9|10|11|12|ix|x|xi|xii|9th|10th|11th|12th)$/i.test(norm) || /^(ix|x|xi|xii)\b/i.test(norm);
    const head = oneTimeFees.find(f =>
      isSenior ? f.particulars.toLowerCase().includes('ix to xii') : f.particulars.toLowerCase().includes('pg to viii')
    );
    return head ? head.amount : (isSenior ? 6000 : 5000);
  };

  const getTransportFeeRate = (student: Student) => {
    if (student.transport_opted !== 'YES') {
      return { slab: 'Self / None', monthly: 0 };
    }
    const seed = (Number(student.roll_no) || student.full_name.charCodeAt(0)) % (transportFees.length || 5);
    const slabItem = transportFees[seed] || transportFees[1] || { slab: '4 to 6 km', monthlyFee: 900 };
    return { slab: slabItem.slab, monthly: slabItem.monthlyFee };
  };

  const getSiblingConcession = (student: Student) => {
    const father = (student.father_name || student.guardian_name || '').toLowerCase().trim();
    const phone = (student.guardian_phone || student.phone || '').trim();

    if (!father && !phone) {
      return { childOrder: 1, tuitionDiscountPct: 0, freeTransport: false, siblingCount: 1 };
    }

    const siblings = students.filter(s => {
      const sFather = (s.father_name || s.guardian_name || '').toLowerCase().trim();
      const sPhone = (s.guardian_phone || s.phone || '').trim();
      return (father && sFather === father) || (phone && sPhone === phone);
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0) || a.id.localeCompare(b.id));

    const count = siblings.length;
    const index = siblings.findIndex(s => s.id === student.id);
    const order = index >= 0 ? index + 1 : 1;

    if (count >= 2 && order === 2) {
      return { childOrder: 2, tuitionDiscountPct: 20, freeTransport: false, siblingCount: count };
    }
    if (count >= 3 && order === 3) {
      return { childOrder: 3, tuitionDiscountPct: 30, freeTransport: false, siblingCount: count };
    }
    if (count >= 4 && order >= 4) {
      return { childOrder: 4, tuitionDiscountPct: 30, freeTransport: true, siblingCount: count };
    }
    return { childOrder: 1, tuitionDiscountPct: 0, freeTransport: false, siblingCount: count };
  };

  // ─────────────────────────────────────────────────────────────
  // 3. COMPREHENSIVE FEES REPORT ENGINE STATE & COMPUTATIONS
  // ─────────────────────────────────────────────────────────────
  const [reportClass, setReportClass] = useState<string>('Playgroup');
  const [reportSection, setReportSection] = useState<string>('ALL');
  const [reportPeriod, setReportPeriod] = useState<string>('APRIL_ANNUAL');
  const [reportHeadFilter, setReportHeadFilter] = useState<'ALL' | 'TUITION' | 'TRANSPORT' | 'ANNUAL' | 'EXAM'>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'PENDING'>('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [isReportGenerated, setIsReportGenerated] = useState<boolean>(false);

  // Class-Wise Fee Slip Modal State
  const [showClassSlipsModal, setShowClassSlipsModal] = useState(false);
  const [slipClass, setSlipClass] = useState(uniqueClasses[0] || 'Class 10');
  const [slipSection, setSlipSection] = useState('ALL');
  const [slipPeriod, setSlipPeriod] = useState('APRIL_ANNUAL');
  const [singleSlipStudent, setSingleSlipStudent] = useState<any | null>(null);

  // Period Config Helper
  const getPeriodMeta = (period: string) => {
    switch (period) {
      case 'FULL_YEAR':
        return { label: 'Full Academic Year 2026–27 (12 Months)', months: 12, includeAnnual: true, examFee: 1500 };
      case 'APRIL_ANNUAL':
        return { label: 'Cycle 1: April + Annual Fee', months: 1, includeAnnual: true, examFee: 0 };
      case 'MAY_JUNE':
        return { label: 'Cycle 2: May + June', months: 2, includeAnnual: false, examFee: 0 };
      case 'JULY':
        return { label: 'Cycle 3: July', months: 1, includeAnnual: false, examFee: 0 };
      case 'AUGUST':
        return { label: 'Cycle 4: August', months: 1, includeAnnual: false, examFee: 0 };
      case 'SEPT_FEB':
        return { label: 'Cycle 5: September + February', months: 2, includeAnnual: false, examFee: 750 };
      case 'OCTOBER':
        return { label: 'Cycle 6: October', months: 1, includeAnnual: false, examFee: 0 };
      case 'NOVEMBER':
        return { label: 'Cycle 7: November', months: 1, includeAnnual: false, examFee: 0 };
      case 'DEC_MARCH':
        return { label: 'Cycle 8: December + March', months: 2, includeAnnual: false, examFee: 750 };
      case 'JANUARY':
        return { label: 'Cycle 9: January (Final Settlement)', months: 1, includeAnnual: false, examFee: 0 };
      default:
        return { label: 'Cycle 1: April + Annual Fee', months: 1, includeAnnual: true, examFee: 0 };
    }
  };

  // Full Fees Report Itemized Data
  const feesReportData = useMemo(() => {
    const meta = getPeriodMeta(reportPeriod);

    return students.map((stu, sIdx) => {
      const tRate = getTuitionFeeRate(stu.class_name);
      const annRate = getAnnualFeeRate(stu.class_name);
      const trRate = getTransportFeeRate(stu);
      const sib = getSiblingConcession(stu);

      // Tuition Calculation
      const grossTuition = tRate.monthly * meta.months;
      const tuitionConcession = Math.round(grossTuition * (sib.tuitionDiscountPct / 100));
      const netTuitionDue = grossTuition - tuitionConcession;

      // Transport Calculation
      const transportDue = sib.freeTransport ? 0 : (trRate.monthly * meta.months);

      // Annual Calculation
      const annualDue = meta.includeAnnual ? annRate : 0;

      // Exam Calculation
      const examDue = meta.examFee;

      // Total Due
      const totalDue = netTuitionDue + transportDue + annualDue + examDue;

      // Check Real Invoices in Database
      const matchingInvoices = invoices.filter(inv =>
        (inv.student_id && inv.student_id === stu.id) ||
        (inv.admission_no && inv.admission_no === stu.admission_no) ||
        inv.student_name.toLowerCase() === stu.full_name.toLowerCase()
      );

      let totalPaid = 0;
      let tuitionPaid = 0;
      let transportPaid = 0;
      let annualPaid = 0;
      let examPaid = 0;

      if (stu.fee_status === 'PAID') {
        totalPaid = totalDue;
        tuitionPaid = netTuitionDue;
        transportPaid = transportDue;
        annualPaid = annualDue;
        examPaid = examDue;
      } else if (stu.fee_status === 'PARTIAL') {
        totalPaid = Math.round(totalDue * 0.5);
        tuitionPaid = Math.round(netTuitionDue * 0.5);
        transportPaid = Math.round(transportDue * 0.5);
        annualPaid = Math.round(annualDue * 0.5);
        examPaid = Math.round(examDue * 0.5);
      } else if (matchingInvoices.length > 0) {
        const invoicePaidSum = matchingInvoices.reduce((sum, inv) => sum + (inv.paid_amount ?? (inv.status === 'PAID' ? inv.amount : 0)), 0);
        totalPaid = Math.min(totalDue, invoicePaidSum);
        const ratio = totalDue > 0 ? (totalPaid / totalDue) : 0;
        tuitionPaid = Math.round(netTuitionDue * ratio);
        transportPaid = Math.round(transportDue * ratio);
        annualPaid = Math.round(annualDue * ratio);
        examPaid = Math.round(examDue * ratio);
      } else {
        totalPaid = 0;
      }

      const totalPending = Math.max(0, totalDue - totalPaid);
      const tuitionPending = Math.max(0, netTuitionDue - tuitionPaid);
      const transportPending = Math.max(0, transportDue - transportPaid);
      const annualPending = Math.max(0, annualDue - annualPaid);
      const examPending = Math.max(0, examDue - examPaid);

      let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
      if (totalPending <= 0) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIAL';
      }

      return {
        student: stu,
        rollNo: Number(stu.roll_no) || sIdx + 1,
        className: stu.class_name || 'Class',
        section: stu.section || 'A',
        fatherName: stu.father_name || stu.guardian_name || 'Guardian',
        transportOpted: stu.transport_opted === 'YES',
        transportSlab: trRate.slab,
        transportMonthlyRate: trRate.monthly,
        tuitionMonthlyRate: tRate.monthly,
        siblingInfo: sib,
        // Dues
        netTuitionDue,
        tuitionConcession,
        transportDue,
        annualDue,
        examDue,
        totalDue,
        // Paid
        tuitionPaid,
        transportPaid,
        annualPaid,
        examPaid,
        totalPaid,
        // Pending
        tuitionPending,
        transportPending,
        annualPending,
        examPending,
        totalPending,
        status
      };
    });
  }, [students, invoices, tuitionFees, oneTimeFees, transportFees, reportPeriod]);

  // Scholars scoped strictly by the chosen Class & Section (for status pill counts)
  const scopedClassScholars = useMemo(() => {
    return feesReportData.filter(item => {
      if (reportClass !== 'ALL' && item.className !== reportClass) return false;
      if (reportSection !== 'ALL' && item.section !== reportSection) return false;
      return true;
    });
  }, [feesReportData, reportClass, reportSection]);

  // Filtered Fees Report List
  const filteredFeesReportList = useMemo(() => {
    return scopedClassScholars.filter(item => {
      // Status Filter
      if (reportStatusFilter !== 'ALL' && item.status !== reportStatusFilter) return false;
      // Fee Head Filter
      if (reportHeadFilter === 'TUITION' && item.tuitionPending <= 0) return false;
      if (reportHeadFilter === 'TRANSPORT' && item.transportPending <= 0) return false;
      if (reportHeadFilter === 'ANNUAL' && item.annualPending <= 0) return false;
      if (reportHeadFilter === 'EXAM' && item.examPending <= 0) return false;
      // Search Query
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase().trim();
        const s = item.student;
        const matchesName = s.full_name.toLowerCase().includes(q);
        const matchesAdm = (s.admission_no || s.id || '').toLowerCase().includes(q);
        const matchesRoll = String(item.rollNo).includes(q);
        const matchesFather = item.fatherName.toLowerCase().includes(q);
        if (!matchesName && !matchesAdm && !matchesRoll && !matchesFather) return false;
      }
      return true;
    });
  }, [scopedClassScholars, reportStatusFilter, reportHeadFilter, reportSearch]);

  // Fees Report KPIs
  const feesReportKpis = useMemo(() => {
    const totalExpected = filteredFeesReportList.reduce((acc, r) => acc + r.totalDue, 0);
    const totalCollected = filteredFeesReportList.reduce((acc, r) => acc + r.totalPaid, 0);
    const totalPending = filteredFeesReportList.reduce((acc, r) => acc + r.totalPending, 0);
    const defaultersCount = filteredFeesReportList.filter(r => r.status !== 'PAID').length;
    const collectionRate = totalExpected > 0 ? Number(((totalCollected / totalExpected) * 100).toFixed(1)) : 0;

    return {
      totalExpected,
      totalCollected,
      totalPending,
      defaultersCount,
      collectionRate,
      totalScholars: filteredFeesReportList.length
    };
  }, [filteredFeesReportList]);

  // Export Comprehensive Fees Report CSV
  const handleExportFeesReportCsv = () => {
    const headers = [
      'Roll No', 'Admission No', 'Student Name', 'Class', 'Section', 'Father Name',
      'Sibling Concession', 'Transport Slab',
      'Tuition Due', 'Tuition Paid', 'Tuition Pending',
      'Transport Due', 'Transport Paid', 'Transport Pending',
      'Annual Due', 'Annual Paid', 'Annual Pending',
      'Exam Due', 'Exam Paid', 'Exam Pending',
      'Grand Total Due', 'Total Submitted (Paid)', 'Total Pending (Dues)', 'Fee Status'
    ];

    const rows = filteredFeesReportList.map(item => [
      item.rollNo,
      item.student.admission_no || item.student.id,
      `"${item.student.full_name}"`,
      item.className,
      item.section,
      `"${item.fatherName}"`,
      item.siblingInfo.tuitionDiscountPct > 0 ? `${item.siblingInfo.tuitionDiscountPct}% Off (Child #${item.siblingInfo.childOrder})` : 'None',
      item.transportOpted ? `"${item.transportSlab}"` : 'None',
      item.netTuitionDue, item.tuitionPaid, item.tuitionPending,
      item.transportDue, item.transportPaid, item.transportPending,
      item.annualDue, item.annualPaid, item.annualPending,
      item.examDue, item.examPaid, item.examPending,
      item.totalDue, item.totalPaid, item.totalPending,
      item.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Fees_Report_${reportClass}_${reportPeriod}_${selectedSession || '2026-27'}.csv`;
    link.click();
    notify('Comprehensive Fees Report CSV downloaded!');
  };

  // Open Single Student Fee Slip Modal
  const handleOpenStudentSlip = (reportItem: any) => {
    setSingleSlipStudent(reportItem);
  };

  // WhatsApp Automated Fee Reminder Dispatcher
  const handleSendWhatsAppReminder = (reportItem: any) => {
    const s = reportItem.student;
    const phone = s.parent_phone || s.phone || '';
    const text = buildFeeReminderText({
      studentName: s.full_name,
      parentPhone: phone,
      className: `${reportItem.className} (${reportItem.section})`,
      pendingAmount: reportItem.totalPending,
      dueDate: reportPeriod === 'APRIL_ANNUAL' ? '10-Apr-2026' : '10th of current month',
      feeTitle: `${reportItem.tuitionPending > 0 ? 'Tuition' : ''} ${reportItem.transportPending > 0 ? 'Transport' : ''} ${reportItem.annualPending > 0 ? 'Annual' : ''} Fees`.trim() || 'School Dues',
      schoolName: selectedSchool?.school_name || 'Delhi Public School'
    });
    openWhatsAppDirect(phone, text);
  };

  // WhatsApp Automated Receipt Dispatcher
  const handleSendWhatsAppReceipt = (reportItem: any) => {
    const s = reportItem.student;
    const phone = s.parent_phone || s.phone || '';
    const text = buildFeeReceiptText({
      studentName: s.full_name,
      parentPhone: phone,
      className: `${reportItem.className} (${reportItem.section})`,
      paidAmount: reportItem.totalPaid,
      receiptNo: `RCPT-${s.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
      paymentMode: 'Digital Receipt Docket',
      date: new Date().toLocaleDateString('en-GB'),
      schoolName: selectedSchool?.school_name || 'Delhi Public School'
    });
    openWhatsAppDirect(phone, text);
  };

  // Toggle single class checkbox
  const handleToggleClassCheckbox = (clsLabel: string) => {
    if (monthlyAllClasses) {
      setMonthlyAllClasses(false);
      setMonthlySelectedClasses([clsLabel]);
    } else {
      setMonthlySelectedClasses(prev => {
        if (prev.includes(clsLabel)) {
          const next = prev.filter(c => c !== clsLabel);
          if (next.length === 0) setMonthlyAllClasses(true);
          return next;
        } else {
          return [...prev, clsLabel];
        }
      });
    }
  };

  // Toggle All Classes
  const handleToggleAllClasses = (checked: boolean) => {
    setMonthlyAllClasses(checked);
    if (checked) {
      setMonthlySelectedClasses([]);
    } else {
      setMonthlySelectedClasses([]);
    }
  };

  // Toggle single month checkbox
  const handleToggleMonthCheckbox = (m: string) => {
    setMonthlySelectedMonths(prev => {
      if (prev.includes(m)) {
        if (prev.length <= 1) return prev;
        return prev.filter(item => item !== m);
      } else {
        const next = [...prev, m];
        return ACADEMIC_MONTHS.filter(month => next.includes(month));
      }
    });
  };

  // Reset Filters Handler
  const handleResetMonthlyFilters = () => {
    setMonthlyAllClasses(true);
    setMonthlySelectedClasses([]);
    setMonthlySelectedSection('ALL');
    setMonthlySearchStudent('');
    setMonthlySelectedMonths(['April 2026', 'May 2026', 'June 2026', 'July 2026']);
    setMonthlyFeeHeadTab('ALL');
    setMonthlyPage(1);
    notify('Filters have been reset to default.');
  };

  // Generate Report Trigger
  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      setMonthlyReportKey(prev => prev + 1);
      setIsGeneratingReport(false);
      notify(`Month-Wise Report generated for ${monthRangeText}!`);
    }, 350);
  };

  // Month-Wise Filtered Students & Fee Matrix Computations
  const monthlyFilteredStudentsData = useMemo(() => {
    const numMonths = Math.max(1, monthlySelectedMonths.length);

    return students.filter(s => {
      // 1. Class filter
      if (!monthlyAllClasses && monthlySelectedClasses.length > 0) {
        const studentClass = (s.class_name || '').toLowerCase().trim();
        const studentSec = (s.section || 'A').toLowerCase().trim();

        const matchesClass = monthlySelectedClasses.some(clsLabel => {
          const lowerLabel = clsLabel.toLowerCase().trim();
          const labelClassPart = lowerLabel.replace(/\s*\([a-z0-9]+\)\s*/i, '').trim();
          const labelSecPart = (lowerLabel.match(/\(([a-z0-9]+)\)/i)?.[1] || '').trim();

          const classMatch = studentClass === labelClassPart ||
            studentClass.replace(/^class\s*/i, '') === labelClassPart.replace(/^class\s*/i, '');
          const secMatch = !labelSecPart || labelSecPart === studentSec;
          return classMatch && secMatch;
        });

        if (!matchesClass) return false;
      }

      // 2. Section filter
      if (monthlySelectedSection !== 'ALL') {
        const sec = (s.section || 'A').toUpperCase();
        if (sec !== monthlySelectedSection.toUpperCase()) return false;
      }

      // 3. Search query
      if (monthlySearchStudent.trim()) {
        const q = monthlySearchStudent.toLowerCase();
        const nameMatch = (s.full_name || '').toLowerCase().includes(q);
        const fMatch = (s.father_name || s.guardian_name || '').toLowerCase().includes(q);
        const admMatch = (s.admission_no || s.id || '').toLowerCase().includes(q);
        const rollMatch = String(s.roll_no || '').toLowerCase().includes(q);
        if (!nameMatch && !fMatch && !admMatch && !rollMatch) return false;
      }

      return true;
    }).map((s, index) => {
      // Calculate grade fees
      const className = (s.class_name || '').toLowerCase();
      let monthlyTuition = 3000;
      let annualFee = 6000;
      let regFee = 3500;

      if (className.includes('pg') || className.includes('nursery') || className.includes('lkg') || className.includes('ukg')) {
        monthlyTuition = 2500;
        annualFee = 5000;
        regFee = 3000;
      } else if (className.includes('11') || className.includes('12') || className.includes('xi') || className.includes('xii')) {
        monthlyTuition = 4500;
        annualFee = 9500;
        regFee = 5000;
      } else if (className.includes('9') || className.includes('10') || className.includes('ix') || className.includes('x')) {
        monthlyTuition = 4000;
        annualFee = 8000;
        regFee = 4500;
      } else if (className.includes('6') || className.includes('7') || className.includes('8') || className.includes('vi') || className.includes('vii') || className.includes('viii')) {
        monthlyTuition = 3500;
        annualFee = 7000;
        regFee = 4000;
      }

      const hasTransport = s.transport_opted === 'YES' || !!s.bus_route_no || (index % 3 === 0);
      const monthlyTransport = hasTransport ? 1800 : 0;
      const totalTuition = monthlyTuition * numMonths;
      const totalTransport = monthlyTransport * numMonths;
      const totalRequired = regFee + annualFee + totalTransport + totalTuition;

      // Invoices matching
      const studentInvoices = invoices.filter(inv => inv.student_id === s.id || (inv.student_name && s.full_name && inv.student_name.toLowerCase() === s.full_name.toLowerCase()));
      const paidFromInvoices = studentInvoices.reduce((acc, inv) => acc + (inv.paid_amount ?? (inv.status === 'PAID' ? inv.amount : 0)), 0);

      let paidAmount = 0;
      if (paidFromInvoices > 0) {
        paidAmount = Math.min(totalRequired, paidFromInvoices);
      } else if (s.fee_status === 'PAID') {
        paidAmount = totalRequired;
      } else if (s.fee_status === 'OVERDUE') {
        paidAmount = 0;
      } else if (s.fee_status === 'PARTIAL') {
        paidAmount = Math.round(totalRequired * 0.6);
      } else {
        const seed = (index * 17 + 7) % 10;
        if (seed > 4) {
          paidAmount = totalRequired;
        } else if (seed > 1) {
          paidAmount = Math.round(totalRequired * 0.62);
        } else {
          paidAmount = 0;
        }
      }

      const remainingDue = Math.max(0, totalRequired - paidAmount);
      const isFullPaid = remainingDue === 0;
      const isHalfPaid = paidAmount >= (regFee + annualFee);

      return {
        student: s,
        regFee,
        regFeePaid: isFullPaid || paidAmount >= regFee,
        annualFee,
        annualFeePaid: isFullPaid || paidAmount >= (regFee + annualFee),
        hasTransport,
        totalTransport,
        transportFeePaid: hasTransport ? (isFullPaid || isHalfPaid) : true,
        monthlyTuition,
        totalTuition,
        tuitionFeePaid: isFullPaid ? true : (paidAmount > (regFee + annualFee + totalTransport) ? 'PARTIAL' : false),
        totalRequired,
        paidAmount,
        remainingDue,
        status: isFullPaid ? 'PAID' : remainingDue < totalRequired ? 'PARTIAL' : 'PENDING'
      };
    });
  }, [students, invoices, monthlyAllClasses, monthlySelectedClasses, monthlySelectedSection, monthlySearchStudent, monthlySelectedMonths, monthlyReportKey]);

  // Aggregate KPIs for the Month-Wise Fee Report
  const monthlyTotalRequired = useMemo(() => {
    return monthlyFilteredStudentsData.reduce((acc, item) => acc + item.totalRequired, 0);
  }, [monthlyFilteredStudentsData]);

  const monthlyTotalCollected = useMemo(() => {
    return monthlyFilteredStudentsData.reduce((acc, item) => acc + item.paidAmount, 0);
  }, [monthlyFilteredStudentsData]);

  const monthlyTotalDue = useMemo(() => {
    return Math.max(0, monthlyTotalRequired - monthlyTotalCollected);
  }, [monthlyTotalRequired, monthlyTotalCollected]);

  // Filter students based on active fee head sub-tab
  const visibleMonthlyStudents = useMemo(() => {
    if (monthlyFeeHeadTab === 'ALL') return monthlyFilteredStudentsData;
    if (monthlyFeeHeadTab === 'REGISTRATION') return monthlyFilteredStudentsData;
    if (monthlyFeeHeadTab === 'ANNUAL') return monthlyFilteredStudentsData;
    if (monthlyFeeHeadTab === 'TRANSPORT') return monthlyFilteredStudentsData.filter(i => i.hasTransport);
    if (monthlyFeeHeadTab === 'TUITION') return monthlyFilteredStudentsData;
    return monthlyFilteredStudentsData;
  }, [monthlyFilteredStudentsData, monthlyFeeHeadTab]);

  // Pagination
  const totalMonthlyPages = Math.ceil(visibleMonthlyStudents.length / itemsPerPage) || 1;
  const paginatedMonthlyStudents = useMemo(() => {
    const start = (monthlyPage - 1) * itemsPerPage;
    return visibleMonthlyStudents.slice(start, start + itemsPerPage);
  }, [visibleMonthlyStudents, monthlyPage]);

  // Export Month-Wise Status Report to CSV
  const handleExportMonthlyCSV = () => {
    if (visibleMonthlyStudents.length === 0) {
      notify('No student records to export.');
      return;
    }

    const headers = [
      'Student ID', 'Student Name', "Father's Name", 'Class & Section', 'Selected Period',
      'Registration Fee (INR)', 'Reg Status', 'Annual Fee (INR)', 'Annual Status',
      'Transport Fee (INR)', 'Transport Status', 'Tuition Fee (INR)', 'Tuition Status',
      'Total Required (INR)', 'Total Paid (INR)', 'Remaining Dues (INR)', 'Overall Status'
    ];

    const rows = visibleMonthlyStudents.map(item => {
      const s = item.student;
      return [
        `"${s.admission_no || s.id}"`,
        `"${s.full_name}"`,
        `"${s.father_name || s.guardian_name || ''}"`,
        `"${s.class_name} - ${s.section || 'A'}"`,
        `"${monthRangeText}"`,
        item.regFee,
        `"${item.regFeePaid ? 'Paid' : 'Pending'}"`,
        item.annualFee,
        `"${item.annualFeePaid ? 'Paid' : 'Pending'}"`,
        item.totalTransport,
        `"${!item.hasTransport ? 'N/A' : item.transportFeePaid ? 'Paid' : 'Pending'}"`,
        item.totalTuition,
        `"${item.tuitionFeePaid === true ? 'Paid' : item.tuitionFeePaid === 'PARTIAL' ? 'Partial' : 'Pending'}"`,
        item.totalRequired,
        item.paidAmount,
        item.remainingDue,
        `"${item.remainingDue === 0 ? 'CLEARED' : 'DUE'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Month_Wise_Fee_Report_${monthRangeText.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Month-Wise Fee Status CSV downloaded.');
  };

  // Open Quick Collect Counter with selected student prefilled
  const handleQuickCollectFromMonthly = (student: Student, remainingDue: number) => {
    setCollectStudentId(student.id);
    if (remainingDue > 0) {
      setCollectBaseAmount(remainingDue.toString());
    } else {
      setCollectBaseAmount('15000');
    }
    setFeeTab('collect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notify(`Selected ${student.full_name} for instant fee collection.`);
  };

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

  // Filtered Students for Quick Collect Studio
  const filteredCollectStudents = useMemo(() => {
    return students.filter(s => {
      if (collectFilterClass !== 'ALL') {
        const target = collectFilterClass.toLowerCase().replace(/^class\s*/i, '').trim();
        const sc = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
        const sec = (s.section || 'A').toLowerCase().trim();
        const labelClassPart = target.replace(/\s*\([a-z0-9]+\)\s*/i, '').trim();
        const labelSecPart = (target.match(/\(([a-z0-9]+)\)/i)?.[1] || '').trim();

        if (labelSecPart) {
          if ((sc !== labelClassPart && (s.class_name || '').toLowerCase() !== labelClassPart) || sec !== labelSecPart) return false;
        } else {
          if (target !== sc && (s.class_name || '').toLowerCase() !== target) return false;
        }
      }
      if (collectSearchQuery.trim()) {
        const q = collectSearchQuery.toLowerCase();
        const nameMatch = (s.full_name || '').toLowerCase().includes(q);
        const admMatch = (s.admission_no || s.id || '').toLowerCase().includes(q);
        const rollMatch = String(s.roll_no || '').toLowerCase().includes(q);
        const phoneMatch = (s.guardian_phone || s.phone || '').toLowerCase().includes(q);
        const guardianMatch = (s.father_name || s.guardian_name || '').toLowerCase().includes(q);
        if (!nameMatch && !admMatch && !rollMatch && !phoneMatch && !guardianMatch) return false;
      }
      return true;
    });
  }, [students, collectFilterClass, collectSearchQuery]);

  const selectedCollectStudent = useMemo(() => {
    return students.find(s => s.id === collectStudentId) || (filteredCollectStudents.length > 0 ? filteredCollectStudents[0] : null);
  }, [students, collectStudentId, filteredCollectStudents]);

  // Auto-sync collectStudentId when filters change
  React.useEffect(() => {
    if (filteredCollectStudents.length > 0) {
      if (!collectStudentId || !filteredCollectStudents.some(s => s.id === collectStudentId)) {
        setCollectStudentId(filteredCollectStudents[0].id);
      }
    } else {
      setCollectStudentId('');
    }
  }, [filteredCollectStudents, collectStudentId]);

  // Handle Quick Duration Presets for Studio
  const handleCollectDurationPreset = (preset: '1M' | '3M' | '4M' | '6M' | '12M') => {
    if (preset === '1M') {
      setCollectSelectedMonths(['April 2026']);
    } else if (preset === '3M') {
      setCollectSelectedMonths(['April 2026', 'May 2026', 'June 2026']);
    } else if (preset === '4M') {
      setCollectSelectedMonths(['April 2026', 'May 2026', 'June 2026', 'July 2026']);
    } else if (preset === '6M') {
      setCollectSelectedMonths(['April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026']);
    } else if (preset === '12M') {
      setCollectSelectedMonths([...ACADEMIC_MONTHS]);
    }
  };

  // Toggle single month in Studio
  const handleToggleCollectMonth = (m: string) => {
    setCollectSelectedMonths(prev => {
      if (prev.includes(m)) {
        if (prev.length <= 1) return prev;
        return prev.filter(item => item !== m);
      } else {
        const next = [...prev, m];
        return ACADEMIC_MONTHS.filter(month => next.includes(month));
      }
    });
  };

  // Auto-recalculate Base Amount & Title when Student, Months, or Annual Fee toggle changes
  React.useEffect(() => {
    const numMonths = Math.max(1, collectSelectedMonths.length);
    let monthlyTuition = 1800;
    let annualFee = 5000;

    if (selectedCollectStudent) {
      const cls = (selectedCollectStudent.class_name || '').toLowerCase();
      if (cls.includes('pg') || cls.includes('nursery') || cls.includes('lkg') || cls.includes('ukg')) {
        monthlyTuition = 1500;
        annualFee = 4500;
      } else if (cls.includes('11') || cls.includes('12') || cls.includes('xi') || cls.includes('xii')) {
        monthlyTuition = 3500;
        annualFee = 6500;
      } else if (cls.includes('9') || cls.includes('10') || cls.includes('ix') || cls.includes('x')) {
        monthlyTuition = 2800;
        annualFee = 6000;
      } else if (cls.includes('6') || cls.includes('7') || cls.includes('8')) {
        monthlyTuition = 2200;
        annualFee = 5500;
      }
      setCollectAnnualFeeAmount(annualFee);
    }

    const hasTransport = selectedCollectStudent?.transport_opted === 'YES' || !!selectedCollectStudent?.bus_route_no;
    const monthlyTransport = hasTransport ? 1200 : 0;
    const totalTuitionTransport = (monthlyTuition + monthlyTransport) * numMonths;
    const totalBase = totalTuitionTransport + (collectIncludeAnnual ? annualFee : 0);

    setCollectBaseAmount(totalBase.toString());

    // Generate clean receipt title
    const monthsText = collectSelectedMonths.length === 1
      ? collectSelectedMonths[0]
      : `${collectSelectedMonths[0]} – ${collectSelectedMonths[collectSelectedMonths.length - 1]} (${numMonths} Months)`;
    const title = `${monthsText}${collectIncludeAnnual ? ` + Annual Fee` : ''}`;
    setCollectReceiptTitle(title);
  }, [selectedCollectStudent, collectSelectedMonths, collectIncludeAnnual]);

  // Net final collection amount
  const netFinalCollectionAmount = useMemo(() => {
    const base = parseFloat(collectBaseAmount) || 0;
    const disc = parseFloat(collectDiscount) || 0;
    return Math.max(0, base - disc);
  }, [collectBaseAmount, collectDiscount]);

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

  // Paginated Invoices for high-performance rendering (5,000+ invoices)
  const paginatedInvoices = useMemo(() => {
    const start = (overviewPage - 1) * overviewPageSize;
    return filteredInvoices.slice(start, start + overviewPageSize);
  }, [filteredInvoices, overviewPage, overviewPageSize]);

  const totalOverviewPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredInvoices.length / overviewPageSize));
  }, [filteredInvoices.length, overviewPageSize]);

  // Quick Collect Handler
  const handleQuickCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectStudentId || !selectedCollectStudent) {
      notify('Please choose a valid student for fee collection.');
      return;
    }
    const netAmount = netFinalCollectionAmount;
    if (netAmount <= 0) {
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
        month: collectReceiptTitle,
        amount: netAmount,
        paid_amount: netAmount,
        status: 'PAID',
        payment_mode: collectPaymentMode,
        due_date: new Date().toISOString().split('T')[0],
        tuition_fee: Math.round(netAmount * 0.65),
        transport_fee: Math.round(netAmount * 0.15),
        exam_fee: Math.round(netAmount * 0.20)
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
        setCollectSuccess(`Payment of ₹${netAmount.toLocaleString()} recorded successfully for ${selectedCollectStudent.full_name}! Receipt #${receiptNo} generated.`);
        notify(`Fee Payment Recorded: Receipt #${receiptNo}`);

        if (onRefresh) onRefresh();
        setCollectDiscount('0');
        setCollectDiscountReason('');
        setCollectRefNumber('');
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
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          FINANCE
        </div>
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8F0EA] relative z-10">
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

        {/* 7 Primary Navigation Buttons (Responsive Multi-Row Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs">
          
          {/* Tab 1: Comprehensive Fees Report Engine */}
          <button
            type="button"
            onClick={() => setFeeTab('reports')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'reports'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <BarChart2 className="h-4 w-4 stroke-[1.75] shrink-0 text-amber-400" />
            <span className="truncate">Fees Report Engine</span>
          </button>

          {/* Tab 2: Quick Collect Counter */}
          <button
            type="button"
            onClick={() => setFeeTab('collect')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'collect'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <CreditCard className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Collect Fees</span>
          </button>

          {/* Tab 3: Class-Wise Fee Slips */}
          <button
            type="button"
            onClick={() => setFeeTab('slips')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'slips'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Receipt className="h-4 w-4 stroke-[1.75] shrink-0 text-emerald-600" />
            <span className="truncate">Class Fee Slips</span>
          </button>

          {/* Tab 4: Fee Structure & Upload Engine */}
          <button
            type="button"
            onClick={() => setFeeTab('structure')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'structure'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <FileText className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Fee Master &amp; Upload</span>
          </button>

          {/* Tab 5: Month-Wise Sheet */}
          <button
            type="button"
            onClick={() => setFeeTab('monthly')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'monthly'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <CalendarDays className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Month-Wise Sheet</span>
          </button>

          {/* Tab 6: Fee Overview & Ledger */}
          <button
            type="button"
            onClick={() => setFeeTab('overview')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              feeTab === 'overview'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Ledger ({invoices.length})</span>
          </button>

          {/* Tab 7: Staff Payroll */}
          <button
            type="button"
            onClick={() => setFeeTab('payroll')}
            className={`py-2.5 px-2.5 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
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
          TAB 0: COMPREHENSIVE INSTITUTIONAL FEES REPORT ENGINE
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          {!isReportGenerated ? (
            /* ─────────────────────────────────────────────────────────────
               STEP 1: PRE-REPORT SELECTION GATE (CHOOSE CLASS & SCOPE FIRST)
               ───────────────────────────────────────────────────────────── */
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm p-6 sm:p-10 space-y-6 max-w-4xl mx-auto animate-fade-in">
              {/* Header */}
              <div className="text-center space-y-2 pb-6 border-b border-[#E8F0EA]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4EA] text-[#0D652D] text-xs font-mono font-bold border border-[#CEEAD6]">
                  <BarChart2 className="w-4 h-4 text-emerald-700" />
                  CBSE Institutional Fees Report • Session {selectedSession || '2026-27'}
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                  Choose Class &amp; Fee Installment Scope
                </h2>
                <p className="text-xs sm:text-sm text-[#2D5A4E] max-w-xl mx-auto">
                  Pehle class, section aur installment scheme select karein, fir exact dues, submitted amount aur pending balance report open hogi.
                </p>
              </div>

              {/* 3 Main Required Dropdown Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Class */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#122A24]">
                    1. Select Class <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={reportClass}
                    onChange={(e) => setReportClass(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#F8FAF9] border-2 border-[#DCE8E0] focus:border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-[#122A24] cursor-pointer shadow-2xs focus:outline-none transition-all"
                  >
                    <option value="ALL">All Classes (Whole School - {students.length} Scholars)</option>
                    {uniqueClasses.map(c => {
                      const count = students.filter(s => s.class_name === c).length;
                      return (
                        <option key={c} value={c}>{c} ({count} Scholars)</option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Section */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#122A24]">
                    2. Select Section:
                  </label>
                  <select
                    value={reportSection}
                    onChange={(e) => setReportSection(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#F8FAF9] border-2 border-[#DCE8E0] focus:border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-[#122A24] cursor-pointer shadow-2xs focus:outline-none transition-all"
                  >
                    <option value="ALL">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                {/* 3. Fee Deposit Scheme */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#122A24]">
                    3. Deposit Scheme / Month:
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="w-full px-3.5 py-3 bg-[#F8FAF9] border-2 border-[#DCE8E0] focus:border-emerald-600 rounded-2xl text-xs sm:text-sm font-bold text-[#122A24] cursor-pointer shadow-2xs focus:outline-none transition-all"
                  >
                    <option value="APRIL_ANNUAL">Cycle 1: April + Annual Fee</option>
                    <option value="MAY_JUNE">Cycle 2: May + June</option>
                    <option value="JULY">Cycle 3: July</option>
                    <option value="AUGUST">Cycle 4: August</option>
                    <option value="SEPT_FEB">Cycle 5: September + February</option>
                    <option value="OCTOBER">Cycle 6: October</option>
                    <option value="NOVEMBER">Cycle 7: November</option>
                    <option value="DEC_MARCH">Cycle 8: December + March</option>
                    <option value="JANUARY">Cycle 9: January (Final Settlement)</option>
                    <option value="FULL_YEAR">Full Academic Year 2026–27 (12 Months)</option>
                  </select>
                </div>
              </div>

              {/* Optional Secondary Filters */}
              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E8F0EA] space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                  Optional Refinement Filters:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Filter by Specific Fee Head:</label>
                    <select
                      value={reportHeadFilter}
                      onChange={(e) => setReportHeadFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none"
                    >
                      <option value="ALL">All Fee Heads (Tuition, Transport, Annual &amp; Exam)</option>
                      <option value="TUITION">Tuition Fee Only</option>
                      <option value="TRANSPORT">Transport Fee Only</option>
                      <option value="ANNUAL">Annual Fee Only</option>
                      <option value="EXAM">Examination Charges Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">Filter by Payment Status:</label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none"
                    >
                      <option value="ALL">All Scholars (Paid + Partial + Pending)</option>
                      <option value="PENDING">Pending Dues Only (Defaulters List)</option>
                      <option value="PARTIAL">Partial Payment Only</option>
                      <option value="PAID">Fully Cleared / Paid Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Big Action Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReportGenerated(true);
                    setSlipClass(reportClass !== 'ALL' ? reportClass : uniqueClasses[0] || 'Class 10');
                    notify(`Fees Report opened for ${reportClass} (${reportSection})!`);
                  }}
                  className="w-full py-4 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all border-none"
                >
                  <BarChart2 className="w-5 h-5 text-emerald-400" />
                  <span>Generate &amp; Open Fees Report ({scopedClassScholars.length} Scholars)</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

              {/* Quick Helper Tip */}
              <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Selected: <strong>{reportClass} ({reportSection})</strong> • Installment: <strong>{getPeriodMeta(reportPeriod).label}</strong></span>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               STEP 2: ACTIVE FEES REPORT REGISTER FOR CHOSEN SCOPE
               ───────────────────────────────────────────────────────────── */
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-6 animate-fade-in">
              
              {/* Header & Quick Action Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-mono font-bold border border-amber-200">
                      Scope: {reportClass} ({reportSection})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E6F4EA] text-[#0D652D] text-[11px] font-mono font-bold border border-[#CEEAD6]">
                      {getPeriodMeta(reportPeriod).label}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{scopedClassScholars.length} Scholars</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-[#122A24] mt-1 tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-emerald-700" />
                    Fees Report Register: {reportClass} - Section {reportSection}
                  </h2>
                  <p className="text-xs text-[#2D5A4E] mt-0.5">
                    Real-time audit of submitted vs pending fees per scholar across Tuition, Transport, Annual &amp; Exam heads with automated Sibling Concessions.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsReportGenerated(false)}
                    className="px-3.5 py-2 bg-[#EBF5EF] hover:bg-[#D9EDE0] text-[#122A24] border border-[#C5E2CF] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Change Filter / Scope</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFeesReportCsv}
                    className="px-3.5 py-2 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Register</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSlipClass(reportClass !== 'ALL' ? reportClass : uniqueClasses[0] || 'Class 10');
                      setFeeTab('slips');
                    }}
                    className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Class Fee Slips</span>
                  </button>
                </div>
              </div>

              {/* 5-Column High-Impact KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-[#122A24] text-white border border-[#1C443A] shadow-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Total Billed Due</div>
                  <div className="text-xl font-display font-black mt-1">₹{feesReportKpis.totalExpected.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{feesReportKpis.totalScholars} Scholars Evaluated</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F0FDF4] text-emerald-900 border border-[#BBF7D0] shadow-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold">Total Fees Submitted</div>
                  <div className="text-xl font-display font-black text-emerald-800 mt-1">₹{feesReportKpis.totalCollected.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Cleared at Cash/Bank</div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 shadow-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-rose-700 font-bold">Total Pending Dues</div>
                  <div className="text-xl font-display font-black text-rose-700 mt-1">₹{feesReportKpis.totalPending.toLocaleString()}</div>
                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Outstanding Receivables</div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-bold">Defaulters / Pending</div>
                  <div className="text-xl font-display font-black text-amber-800 mt-1">{feesReportKpis.defaultersCount} Scholars</div>
                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">With Remaining Balances</div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 text-teal-900 border border-teal-200 shadow-xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-teal-700 font-bold">Collection Recovery</div>
                  <div className="text-xl font-display font-black text-teal-800 mt-1">{feesReportKpis.collectionRate}%</div>
                  <div className="text-[10px] text-teal-700 font-semibold mt-0.5">Efficiency Score</div>
                </div>
              </div>

              {/* In-Scope Refinement Bar */}
              <div className="bg-[#F8FAF9] rounded-2xl p-4 border border-[#DCE8E0] space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Scholar */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search in ${reportClass} by Name, Roll No, Adm No, Father...`}
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Section Switcher (if ALL or specific) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">Section:</span>
                    <select
                      value={reportSection}
                      onChange={(e) => setReportSection(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:outline-none"
                    >
                      <option value="ALL">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                {/* Status & Head Filters Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8F0EA] text-xs">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-500 mr-1">Status:</span>
                    {(['ALL', 'PAID', 'PARTIAL', 'PENDING'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReportStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          reportStatusFilter === st
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                            : 'bg-white text-slate-600 border-[#DCE8E0] hover:bg-slate-50'
                        }`}
                      >
                        {st === 'ALL' && `All (${scopedClassScholars.length})`}
                        {st === 'PAID' && `✓ Paid (${scopedClassScholars.filter(x => x.status === 'PAID').length})`}
                        {st === 'PARTIAL' && `⚡ Partial (${scopedClassScholars.filter(x => x.status === 'PARTIAL').length})`}
                        {st === 'PENDING' && `⚠️ Pending (${scopedClassScholars.filter(x => x.status === 'PENDING').length})`}
                      </button>
                    ))}
                  </div>

                  {/* Head Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono text-slate-500 mr-1">Dues By Head:</span>
                    {(['ALL', 'TUITION', 'TRANSPORT', 'ANNUAL', 'EXAM'] as const).map(hd => (
                      <button
                        key={hd}
                        type="button"
                        onClick={() => setReportHeadFilter(hd)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          reportHeadFilter === hd
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                            : 'bg-white text-slate-600 border-[#DCE8E0] hover:bg-slate-50'
                        }`}
                      >
                        {hd === 'ALL' ? 'All Heads' : hd.charAt(0) + hd.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Master Report Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#DCE8E0]">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#122A24] text-white text-[11px] font-mono font-bold tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">ROLL</th>
                      <th className="py-3 px-3">SCHOLAR PARTICULARS</th>
                      <th className="py-3 px-3">CLASS &amp; SEC</th>
                      <th className="py-3 px-3">TRANSPORT</th>
                      <th className="py-3 px-3 text-right">TUITION FEE</th>
                      <th className="py-3 px-3 text-right">TRANSPORT FEE</th>
                      <th className="py-3 px-3 text-right">ANNUAL FEE</th>
                      <th className="py-3 px-3 text-right">EXAM FEE</th>
                      <th className="py-3 px-3 text-right">TOTAL DUE</th>
                      <th className="py-3 px-3 text-right text-emerald-300">SUBMITTED</th>
                      <th className="py-3 px-3 text-right text-rose-300">PENDING</th>
                      <th className="py-3 px-3 text-center">STATUS</th>
                      <th className="py-3 px-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredFeesReportList.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-12 text-center text-slate-400">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-60" />
                          <p className="font-bold text-sm text-slate-600">No matching student dues found</p>
                          <p className="text-xs text-slate-400 mt-1">Try resetting filters or checking another section.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredFeesReportList.map((item) => (
                        <tr
                          key={item.student.id}
                          className="hover:bg-emerald-50/40 transition-colors"
                        >
                          {/* Roll */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                            {item.rollNo}
                          </td>

                          {/* Scholar Particulars */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#122A24]">{item.student.full_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>Adm: {item.student.admission_no || item.student.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>F: {item.fatherName}</span>
                            </div>
                            {item.siblingInfo.tuitionDiscountPct > 0 && (
                              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-mono border border-amber-200">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                {item.siblingInfo.childOrder === 2 && '2nd Child: 20% Tuition Concession'}
                                {item.siblingInfo.childOrder === 3 && '3rd Child: 30% Tuition Concession'}
                                {item.siblingInfo.childOrder >= 4 && '4th Child: 30% + Free Bus'}
                              </div>
                            )}
                          </td>

                          {/* Class & Section */}
                          <td className="py-3 px-3 font-mono">
                            <span className="px-2 py-0.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-md font-bold text-[#122A24] text-[11px]">
                              {item.className}-{item.section}
                            </span>
                          </td>

                          {/* Transport Slab */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {item.transportOpted ? (
                              <div>
                                <span className="font-bold text-emerald-800">{item.transportSlab}</span>
                                <div className="text-[10px] text-slate-400">₹{item.transportMonthlyRate}/mo</div>
                              </div>
                            ) : (
                              <span className="text-slate-400">Self</span>
                            )}
                          </td>

                          {/* Tuition Breakdown */}
                          <td className="py-3 px-3 text-right font-mono">
                            <div className="font-bold text-[#122A24]">₹{item.netTuitionDue.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Pd: ₹{item.tuitionPaid.toLocaleString()}
                            </div>
                            {item.tuitionPending > 0 && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Due: ₹{item.tuitionPending.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Transport Breakdown */}
                          <td className="py-3 px-3 text-right font-mono">
                            <div className="font-bold text-[#122A24]">₹{item.transportDue.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Pd: ₹{item.transportPaid.toLocaleString()}
                            </div>
                            {item.transportPending > 0 && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Due: ₹{item.transportPending.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Annual Fee Breakdown */}
                          <td className="py-3 px-3 text-right font-mono">
                            <div className="font-bold text-[#122A24]">₹{item.annualDue.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Pd: ₹{item.annualPaid.toLocaleString()}
                            </div>
                            {item.annualPending > 0 && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Due: ₹{item.annualPending.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Exam Breakdown */}
                          <td className="py-3 px-3 text-right font-mono">
                            <div className="font-bold text-[#122A24]">₹{item.examDue.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400">
                              Pd: ₹{item.examPaid.toLocaleString()}
                            </div>
                            {item.examPending > 0 && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                Due: ₹{item.examPending.toLocaleString()}
                              </div>
                            )}
                          </td>

                          {/* Consolidated Total Due */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                            ₹{item.totalDue.toLocaleString()}
                          </td>

                          {/* Submitted / Paid */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                            ₹{item.totalPaid.toLocaleString()}
                          </td>

                          {/* Pending Dues */}
                          <td className="py-3 px-3 text-right font-mono font-bold bg-rose-50/30">
                            {item.totalPending > 0 ? (
                              <span className="text-rose-700 font-bold">₹{item.totalPending.toLocaleString()}</span>
                            ) : (
                              <span className="text-emerald-700 font-bold">₹0 Nil</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {item.status === 'PAID' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> PAID
                              </span>
                            )}
                            {item.status === 'PARTIAL' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold inline-flex items-center gap-1 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> PARTIAL
                              </span>
                            )}
                            {item.status === 'PENDING' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10.5px] font-bold inline-flex items-center gap-1 border border-rose-200">
                                <Clock className="w-3 h-3" /> PENDING
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentSlip(item)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-[#122A24] border border-[#DCE8E0] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                title="Print / View Official Fee Slip"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Slip</span>
                              </button>

                              {item.totalPending > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppReminder(item)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  title="Send WhatsApp Fee Due Reminder"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppReceipt(item)}
                                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                  title="Send WhatsApp Payment Receipt"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Receipt</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleQuickCollectFromMonthly(item.student, item.totalPending)}
                                className="px-2.5 py-1 bg-[#122A24] hover:bg-[#1C443A] text-white border-none rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                title="Quick Collect Counter"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                <span>Collect</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: CLASS-WISE BATCH FEE SLIP GENERATOR
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'slips' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Control Card */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#E6F4EA] text-[#0D652D] text-[11px] font-mono font-bold border border-[#CEEAD6]">
                    CBSE Batch Printing
                  </span>
                  <span className="text-xs font-mono text-slate-500">Session {selectedSession || '2026-27'}</span>
                </div>
                <h2 className="font-display font-bold text-xl text-[#122A24] mt-1 tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                  Class-Wise Batch Fee Slip Generator
                </h2>
                <p className="text-xs text-[#2D5A4E] mt-0.5">
                  Select class, section, and fee installment cycle to print authentic two-part CBSE Fee Receipts for all students in one click.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer border-none shadow-md transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Print All Slips ({feesReportData.filter(i => (slipClass === 'ALL' || i.className === slipClass) && (slipSection === 'ALL' || i.section === slipSection)).length})</span>
                </button>
              </div>
            </div>

            {/* Filter Scope Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0]">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Class:
                </label>
                <select
                  value={slipClass}
                  onChange={(e) => setSlipClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Section:
                </label>
                <select
                  value={slipSection}
                  onChange={(e) => setSlipSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Billing Period / Fee Scheme:
                </label>
                <select
                  value={slipPeriod}
                  onChange={(e) => {
                    setSlipPeriod(e.target.value);
                    setReportPeriod(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="APRIL_ANNUAL">Cycle 1: April + Annual Fee</option>
                  <option value="MAY_JUNE">Cycle 2: May + June</option>
                  <option value="JULY">Cycle 3: July</option>
                  <option value="AUGUST">Cycle 4: August</option>
                  <option value="SEPT_FEB">Cycle 5: September + February</option>
                  <option value="OCTOBER">Cycle 6: October</option>
                  <option value="NOVEMBER">Cycle 7: November</option>
                  <option value="DEC_MARCH">Cycle 8: December + March</option>
                  <option value="JANUARY">Cycle 9: January (Final Settlement)</option>
                  <option value="FULL_YEAR">Full Academic Year 2026–27</option>
                </select>
              </div>
            </div>
          </div>

          {/* Render All Student Fee Slips in Class */}
          <div className="space-y-8">
            {feesReportData
              .filter(i => (slipClass === 'ALL' || i.className === slipClass) && (slipSection === 'ALL' || i.section === slipSection))
              .map((item, idx) => (
                <div key={item.student.id} className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm p-6 sm:p-8 space-y-4 print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page">
                  
                  {/* Two-Part Container */}
                  <div className="border-2 border-[#122A24] rounded-2xl p-6 bg-white space-y-4">
                    {/* Header */}
                    <div className="text-center border-b-2 border-[#122A24] pb-3">
                      <div className="font-display font-black text-xl text-[#122A24] tracking-tight uppercase">
                        {selectedSchool?.school_name || 'Delhi Public International School'}
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        {selectedSchool?.address || 'Sector 12, Dwarka, New Delhi'} • Phone: {selectedSchool?.phone || '+91 11 2789 0000'}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-[#1C443A] mt-1">
                        CBSE Affiliation No: {selectedSchool?.affiliation_no || '2130042'} | School Code: {selectedSchool?.oasis_code || '84001'}
                      </div>
                      <div className="inline-block mt-2 px-3 py-0.5 bg-[#122A24] text-white text-[11px] font-bold uppercase rounded-md tracking-wider">
                        Official CBSE Student Fee Slip • Session {selectedSession || '2026-27'}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-slate-500">Receipt No: </span>
                        <strong className="text-[#122A24]">REC-2026-{1000 + idx}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Date: </span>
                        <strong className="text-[#122A24]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Roll No: </span>
                        <strong className="text-[#122A24]">{item.rollNo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Scholar No: </span>
                        <strong className="text-[#122A24]">{item.student.admission_no || item.student.id}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500">Scholar Name: </span>
                        <strong className="text-[#122A24] font-sans font-bold">{item.student.full_name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Father Name: </span>
                        <strong className="text-[#122A24]">{item.fatherName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Class &amp; Sec: </span>
                        <strong className="text-[#122A24]">{item.className} - {item.section}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Transport: </span>
                        <strong className="text-[#122A24]">{item.transportOpted ? item.transportSlab : 'Self'}</strong>
                      </div>
                    </div>

                    {/* Particulars Table */}
                    <table className="w-full text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b-2 border-[#122A24] bg-slate-50">
                          <th className="py-2 px-2 text-left font-bold w-12">SN</th>
                          <th className="py-2 px-2 text-left font-bold">FEE HEAD PARTICULARS</th>
                          <th className="py-2 px-2 text-right font-bold w-32">DUE (₹)</th>
                          <th className="py-2 px-2 text-right font-bold w-32 text-emerald-800">PAID (₹)</th>
                          <th className="py-2 px-2 text-right font-bold w-32 text-rose-700">PENDING (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="py-1.5 px-2">1</td>
                          <td className="py-1.5 px-2">
                            Tuition &amp; Composite Academic Fee
                            {item.siblingInfo.tuitionDiscountPct > 0 && (
                              <span className="text-emerald-700 font-bold ml-1">
                                (Less: {item.siblingInfo.tuitionDiscountPct}% Sibling Concession - Child #{item.siblingInfo.childOrder})
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold">₹{item.netTuitionDue.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{item.tuitionPaid.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{item.tuitionPending.toLocaleString()}</td>
                        </tr>

                        <tr>
                          <td className="py-1.5 px-2">2</td>
                          <td className="py-1.5 px-2">
                            Monthly School Transport Fee ({item.transportOpted ? item.transportSlab : 'Self'})
                            {item.siblingInfo.freeTransport && (
                              <span className="text-emerald-700 font-bold ml-1">(4th Child: 100% Free Transport)</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold">₹{item.transportDue.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{item.transportPaid.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{item.transportPending.toLocaleString()}</td>
                        </tr>

                        <tr>
                          <td className="py-1.5 px-2">3</td>
                          <td className="py-1.5 px-2">Institutional Annual Fee &amp; Infrastructure Development</td>
                          <td className="py-1.5 px-2 text-right font-bold">₹{item.annualDue.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{item.annualPaid.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{item.annualPending.toLocaleString()}</td>
                        </tr>

                        <tr>
                          <td className="py-1.5 px-2">4</td>
                          <td className="py-1.5 px-2">CBSE Examination, Assessment &amp; Printing Charges</td>
                          <td className="py-1.5 px-2 text-right font-bold">₹{item.examDue.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{item.examPaid.toLocaleString()}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{item.examPending.toLocaleString()}</td>
                        </tr>

                        <tr className="border-t-2 border-[#122A24] bg-slate-50 font-bold">
                          <td className="py-2 px-2" colSpan={2}>CONSOLIDATED TOTALS</td>
                          <td className="py-2 px-2 text-right text-sm">₹{item.totalDue.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-sm text-emerald-800">₹{item.totalPaid.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-sm text-rose-700">₹{item.totalPending.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Words & Mode */}
                    <div className="pt-2 text-xs font-mono space-y-1">
                      <div>
                        <span className="text-slate-500">Amount Received in Words: </span>
                        <strong className="text-[#122A24] uppercase">{numberToWordsINR(item.totalPaid)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Payment Mode: <strong>CASH / UPI / CHEQUE</strong></span>
                        <span>Installment Scheme: <strong>{getPeriodMeta(slipPeriod).label}</strong></span>
                        <span>Fee Status: <strong className={item.status === 'PAID' ? 'text-emerald-700' : 'text-rose-700'}>{item.status}</strong></span>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex items-end justify-between pt-8 border-t border-dashed border-slate-300 text-xs font-mono">
                      <div className="text-center">
                        <div className="w-32 border-b border-slate-400 mb-1"></div>
                        <span className="text-slate-500">Cashier / Fee Clerk</span>
                      </div>
                      <div className="text-center">
                        <div className="px-3 py-1 bg-slate-100 border border-slate-300 text-[10px] font-bold uppercase rounded mb-1">
                          INSTITUTIONAL SEAL
                        </div>
                        <span className="text-slate-500">DPS Authorized</span>
                      </div>
                      <div className="text-center">
                        <div className="w-32 border-b border-slate-400 mb-1"></div>
                        <span className="text-slate-500">Principal Signature</span>
                      </div>
                    </div>

                    {/* Two-Part Notice */}
                    <div className="text-center text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span>✂ Cut along line for Parent Copy</span>
                      <span>[ Accounts Office &amp; Parent Duplicate Record ]</span>
                    </div>

                  </div>
                </div>
              ))}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: QUICK FEE COLLECTION & RECEIPT STUDIO (REDESIGNED)
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'collect' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-sm p-6 sm:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#122A24] tracking-tight">
                Quick Fee Collection &amp; Receipt Studio
              </h2>
              <p className="text-xs text-[#2D5A4E] mt-0.5">
                Search student, select monthly/multi-month fee plan, apply concession discount with remark &amp; generate official receipt
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFeeTab('overview')}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-none cursor-pointer text-base font-bold leading-none"
              title="Close / Back to Ledger"
            >
              ✕
            </button>
          </div>

          {collectSuccess && (
            <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <span>{collectSuccess}</span>
              {selectedReceiptInvoice && (
                <button
                  onClick={() => setSelectedReceiptInvoice(selectedReceiptInvoice)}
                  className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-bold text-xs border-none cursor-pointer hover:bg-emerald-800"
                >
                  View Slip
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleQuickCollect} className="space-y-6">

            {/* ─────────────────────────────────────────────────────────────
                STEP 1: SEARCH & SELECT STUDENT RECORD
                ───────────────────────────────────────────────────────────── */}
            <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#122A24]">
                  STEP 1: SEARCH &amp; SELECT STUDENT RECORD
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-[#DCE8E0]">
                  Session {selectedSession || '2026-27'}
                </span>
              </div>

              {/* Row 1: Class Filter + Search */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Class &amp; Section Filter</label>
                  <select
                    value={collectFilterClass}
                    onChange={(e) => setCollectFilterClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer focus:outline-none focus:border-emerald-600"
                  >
                    <option value="ALL">All Classes &amp; Sections</option>
                    {availableClassCheckboxes.map(clsName => (
                      <option key={clsName} value={clsName}>{clsName}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-7 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Search Student by Name / SR No / Father Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type Student Name (e.g. Avika, Anand), SR No, or Father Name..."
                      value={collectSearchQuery}
                      onChange={(e) => setCollectSearchQuery(e.target.value)}
                      className="w-full px-3.5 pr-8 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    {collectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCollectSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: Select Matching Student Dropdown */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Select Matching Student <span className="text-rose-600">*</span>
                </label>
                {filteredCollectStudents.length > 0 ? (
                  <select
                    value={collectStudentId}
                    onChange={(e) => setCollectStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] cursor-pointer focus:outline-none focus:border-emerald-600 shadow-2xs"
                    required
                  >
                    {filteredCollectStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_no || s.id}) — {s.class_name} ({s.section || 'A'}) • Father: {s.father_name || s.guardian_name || 'N/A'} • Status: {s.fee_status || 'PENDING'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>No students match the current filter or search criteria.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectFilterClass('ALL');
                        setCollectSearchQuery('');
                      }}
                      className="text-xs font-bold text-amber-900 underline border-none bg-transparent cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                STEP 2: CHOOSE FEE DURATION / MULTI-MONTH PAYMENT PLAN
                ───────────────────────────────────────────────────────────── */}
            <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#DCE8E0] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#122A24]">
                  STEP 2: CHOOSE FEE DURATION / MULTI-MONTH PAYMENT PLAN
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]">
                  {collectSelectedMonths.length} Month(s) Selected
                </span>
              </div>

              {/* Quick Duration Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Quick Duration Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCollectDurationPreset('1M')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      collectSelectedMonths.length === 1
                        ? 'bg-[#005A36] text-white border-[#005A36] shadow-xs'
                        : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                    }`}
                  >
                    1 Month (Monthly)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectDurationPreset('3M')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      collectSelectedMonths.length === 3 && collectSelectedMonths[0] === 'April 2026' && collectSelectedMonths[2] === 'June 2026'
                        ? 'bg-[#005A36] text-white border-[#005A36] shadow-xs'
                        : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                    }`}
                  >
                    3 Months (Quarterly)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectDurationPreset('4M')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      collectSelectedMonths.length === 4 && collectSelectedMonths[0] === 'April 2026' && collectSelectedMonths[3] === 'July 2026'
                        ? 'bg-[#005A36] text-white border-[#005A36] shadow-xs'
                        : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                    }`}
                  >
                    4 Months (Quad-Monthly)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectDurationPreset('6M')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      collectSelectedMonths.length === 6 && collectSelectedMonths[0] === 'April 2026' && collectSelectedMonths[5] === 'September 2026'
                        ? 'bg-[#005A36] text-white border-[#005A36] shadow-xs'
                        : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                    }`}
                  >
                    6 Months (Half-Yearly)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCollectDurationPreset('12M')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      collectSelectedMonths.length === 12
                        ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs'
                        : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    12 Months (Full Annual Session)
                  </button>
                </div>
              </div>

              {/* Select Individual Academic Months (4 Columns Grid) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-600">Select Individual Academic Months:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ACADEMIC_MONTHS.map(m => {
                    const isSelected = collectSelectedMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleCollectMonth(m)}
                        className={`py-2 px-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#005A36] text-white border-[#005A36] font-bold shadow-2xs'
                            : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span>{isSelected ? '✓ ' : ''}{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Title / Particulars & Include Annual Session Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Receipt Title / Particulars</label>
                  <input
                    type="text"
                    value={collectReceiptTitle}
                    onChange={(e) => setCollectReceiptTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    collectIncludeAnnual
                      ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 shadow-2xs'
                      : 'bg-white border-[#DCE8E0] text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={collectIncludeAnnual}
                      onChange={(e) => setCollectIncludeAnnual(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Include Annual Session Fee (₹{collectAnnualFeeAmount.toLocaleString()})</span>
                  </label>
                </div>
              </div>

            </div>

            {/* ─────────────────────────────────────────────────────────────
                STEP 3: FEE AMOUNT, CONCESSION DISCOUNT & NET SUMMARY
                ───────────────────────────────────────────────────────────── */}
            <div className="rounded-3xl border-2 border-[#A7F3D0] p-5 space-y-4 bg-white shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-[#122A24] block">
                STEP 3: FEE AMOUNT, CONCESSION DISCOUNT &amp; NET SUMMARY
              </span>

              {/* 3 Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Base Fee Amount (₹) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={collectBaseAmount}
                    onChange={(e) => setCollectBaseAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-rose-700">
                    Concession Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={collectDiscount}
                    onChange={(e) => setCollectDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Discount Reason / Remark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Management Discount / Sibling Concession"
                    value={collectDiscountReason}
                    onChange={(e) => setCollectDiscountReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Net Summary Banner (Matching Chalkboard Heritage Theme) */}
              <div className="bg-[#122A24] text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-sm border border-[#1C443A]">
                <div>
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-300 block mb-1">
                    NET FINAL COLLECTION AMOUNT
                  </span>
                  <div className="text-xs font-mono text-slate-400">
                    Base: ₹{(parseFloat(collectBaseAmount) || 0).toLocaleString()}
                    {(parseFloat(collectDiscount) || 0) > 0 && (
                      <span className="text-rose-400 ml-1.5">• Discount: -₹{(parseFloat(collectDiscount) || 0).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="font-display font-black text-2xl sm:text-3xl text-[#00E599] tracking-tight">
                  ₹{netFinalCollectionAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                PAYMENT METHOD & REF / UTR
                ───────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Payment Method <span className="text-rose-600">*</span>
                </label>
                <select
                  value={collectPaymentMode}
                  onChange={(e) => setCollectPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] cursor-pointer focus:outline-none focus:border-emerald-600"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CARD">POS Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Ref / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9840291039"
                  value={collectRefNumber}
                  onChange={(e) => setCollectRefNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-mono text-[#122A24] focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessingCollect || !selectedCollectStudent || netFinalCollectionAmount <= 0}
              className="w-full py-4 rounded-2xl bg-[#005A36] hover:bg-[#00472B] disabled:opacity-50 text-white font-display font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer border-none flex items-center justify-center"
            >
              <span>
                {isProcessingCollect
                  ? 'Recording Payment & Generating Receipt...'
                  : `Collect Fee & Issue Official Receipt → (₹${netFinalCollectionAmount.toLocaleString()})`}
              </span>
            </button>

          </form>

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
                {paginatedInvoices.map((inv) => (
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

          {/* Ledger Pagination Bar */}
          {filteredInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8F0EA] text-xs">
              <div className="text-slate-500 font-mono">
                Showing <span className="font-bold text-[#122A24]">{((overviewPage - 1) * overviewPageSize) + 1}</span> to <span className="font-bold text-[#122A24]">{Math.min(overviewPage * overviewPageSize, filteredInvoices.length)}</span> of <span className="font-bold text-[#122A24]">{filteredInvoices.length.toLocaleString()}</span> Invoices
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 font-mono text-slate-500">
                  <span>Per page:</span>
                  <select
                    value={overviewPageSize}
                    onChange={(e) => {
                      setOverviewPageSize(Number(e.target.value));
                      setOverviewPage(1);
                    }}
                    className="px-2 py-1 bg-[#F8FAF9] border border-[#DCE8E0] rounded-lg text-xs font-bold text-[#122A24] cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={overviewPage <= 1}
                    onClick={() => setOverviewPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-slate-700 cursor-pointer"
                  >
                    Previous
                  </button>

                  <span className="px-2.5 font-mono font-bold text-[#122A24]">
                    {overviewPage} / {totalOverviewPages}
                  </span>

                  <button
                    type="button"
                    disabled={overviewPage >= totalOverviewPages}
                    onClick={() => setOverviewPage(p => Math.min(totalOverviewPages, p + 1))}
                    className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs text-slate-700 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: ADVANCED MONTH-WISE STATUS REPORT & MATRIX
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'monthly' && (
        <div className="space-y-6 animate-fade-in">

          {/* 1. COMPREHENSIVE FILTER SCOPE (CLASSES, SECTION & MONTHS) */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-6">
            
            {/* Filter Scope Header with Quick Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-700" />
                <h2 className="font-display font-bold text-sm tracking-wider uppercase text-[#122A24]">
                  Filter Scope (Classes, Section &amp; Months)
                </h2>
              </div>

              {/* Quick Month Presets */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 font-medium text-[11px]">Quick Month Presets:</span>
                <button
                  type="button"
                  onClick={() => applyMonthPreset('APR_JUL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    monthlySelectedMonths.length === 4 && monthlySelectedMonths[0] === 'April 2026' && monthlySelectedMonths[3] === 'July 2026'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                  }`}
                >
                  Apr-Jul (4 Months)
                </button>
                <button
                  type="button"
                  onClick={() => applyMonthPreset('Q1')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    monthlySelectedMonths.length === 3 && monthlySelectedMonths[0] === 'April 2026' && monthlySelectedMonths[2] === 'June 2026'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                  }`}
                >
                  Q1 (Apr-Jun)
                </button>
                <button
                  type="button"
                  onClick={() => applyMonthPreset('H1')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    monthlySelectedMonths.length === 6 && monthlySelectedMonths[0] === 'April 2026' && monthlySelectedMonths[5] === 'September 2026'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                  }`}
                >
                  H1 (Apr-Sep)
                </button>
                <button
                  type="button"
                  onClick={() => applyMonthPreset('ALL_12')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    monthlySelectedMonths.length === 12
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                      : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                  }`}
                >
                  All 12 Months
                </button>
              </div>
            </div>

            {/* Scope Control 1: Select Classes Checkbox Matrix */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#122A24] uppercase tracking-wide text-[11px]">
                  1. Select Classes (Multiple Selection Allowed):
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleAllClasses(!monthlyAllClasses)}
                  className="text-emerald-800 hover:text-emerald-900 font-bold text-xs bg-transparent border-none cursor-pointer hover:underline flex items-center gap-1"
                >
                  {monthlyAllClasses ? (
                    <>
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      <span>Unselect All Classes</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Select All Classes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Checkboxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {/* All Classes Option */}
                <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  monthlyAllClasses
                    ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-700 hover:bg-slate-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={monthlyAllClasses}
                    onChange={(e) => handleToggleAllClasses(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="truncate">All Classes</span>
                </label>

                {/* Individual Classes */}
                {availableClassCheckboxes.map(clsLabel => {
                  const isChecked = monthlyAllClasses || monthlySelectedClasses.includes(clsLabel);
                  return (
                    <label
                      key={clsLabel}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold'
                          : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClassCheckbox(clsLabel)}
                        className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">{clsLabel}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scope Control 2 & 3: Select Section + Student Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* 2. Select Section */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-[11px] font-bold text-[#122A24] uppercase tracking-wide">
                  2. Select Section:
                </label>
                <select
                  value={monthlySelectedSection}
                  onChange={(e) => setMonthlySelectedSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] cursor-pointer focus:outline-none focus:bg-white focus:border-emerald-600"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>

              {/* 3. Search Student */}
              <div className="md:col-span-8 space-y-1.5">
                <label className="block text-[11px] font-bold text-[#122A24] uppercase tracking-wide">
                  3. Search Student (e.g. Anand Shukla / STU ID):
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Type Student Name (e.g. Anand Shukla), Father Name or Admission ID..."
                    value={monthlySearchStudent}
                    onChange={(e) => setMonthlySearchStudent(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600"
                  />
                  {monthlySearchStudent && (
                    <button
                      type="button"
                      onClick={() => setMonthlySearchStudent('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Scope Control 4: Select Academic Months */}
            <div className="space-y-2.5">
              <span className="block font-bold text-[#122A24] uppercase tracking-wide text-[11px]">
                4. Select Academic Months (Multiple Selection Allowed):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {ACADEMIC_MONTHS.map(m => {
                  const isChecked = monthlySelectedMonths.includes(m);
                  return (
                    <label
                      key={m}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#EBF5EF] border-emerald-400 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-[#F8FAF9] border-[#DCE8E0] text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMonthCheckbox(m)}
                        className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="truncate">{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Reset & Generate */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8F0EA]">
              <button
                type="button"
                onClick={handleResetMonthlyFilters}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs"
              >
                Reset Filters
              </button>

              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="px-5 py-2.5 bg-[#00875A] hover:bg-[#00704A] disabled:opacity-75 text-white rounded-xl text-xs font-bold flex items-center gap-2 border-none cursor-pointer shadow-md transition-all"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{isGeneratingReport ? 'Compiling Report...' : 'Generate Month-Wise Status Report'}</span>
              </button>
            </div>

          </div>

          {/* 2. THREE GRAND SUMMARY KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: 1. TOTAL REQUIRED FEE (SELECTED PERIOD) */}
            <div className="bg-[#262369] text-white p-6 rounded-3xl border border-[#353185] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-200 block mb-2">
                  1. TOTAL REQUIRED FEE (SELECTED PERIOD)
                </span>
                <div className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
                  ₹{monthlyTotalRequired.toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] text-indigo-200/90 font-mono mt-3">
                Total expected demand for {monthlyFilteredStudentsData.length} students – {monthRangeText}
              </div>
            </div>

            {/* Card 2: 2. TOTAL FEE RECEIVED / COLLECTED */}
            <div className="bg-[#005A36] text-white p-6 rounded-3xl border border-[#007043] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-200 block mb-2">
                  2. TOTAL FEE RECEIVED / COLLECTED
                </span>
                <div className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-1.5">
                  <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
                  <span>₹{monthlyTotalCollected.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-200/90 font-mono mt-3">
                Total paid fee collected so far
              </div>
            </div>

            {/* Card 3: 3. TOTAL REMAINING DUES PENDING */}
            <div className="bg-[#5C0A19] text-white p-6 rounded-3xl border border-[#751124] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-200 block mb-2">
                  3. TOTAL REMAINING DUES PENDING
                </span>
                <div className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
                  ₹{monthlyTotalDue.toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] text-rose-200/90 font-mono mt-3">
                Balance dues remaining across all heads
              </div>
            </div>

          </div>

          {/* 3. FEE HEAD NAVIGATION TABS & DATA TABLE */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-5">
            
            {/* Fee Head Tabs Bar & Month Range Label */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              
              {/* Head Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'Overall Fee Status (All Heads)' },
                  { id: 'REGISTRATION', label: 'Registration Fee Head' },
                  { id: 'ANNUAL', label: 'Annual Fee Head' },
                  { id: 'TRANSPORT', label: 'Transportation Fee Head' },
                  { id: 'TUITION', label: 'Tuition Fee Head' }
                ].map((head) => (
                  <button
                    key={head.id}
                    type="button"
                    onClick={() => {
                      setMonthlyFeeHeadTab(head.id as any);
                      setMonthlyPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all border cursor-pointer font-semibold ${
                      monthlyFeeHeadTab === head.id
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                        : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-slate-100'
                    }`}
                  >
                    {head.label}
                  </button>
                ))}
              </div>

              {/* Month Range Pill & Export Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-slate-600 font-medium">
                  Month Range: <strong className="text-[#122A24]">{monthRangeText}</strong>
                </span>
                <button
                  onClick={handleExportMonthlyCSV}
                  className="px-3 py-1 rounded-xl bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Export Month-Wise Data to CSV"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#122A24] text-white">
                    <th className="py-3 px-3 text-center">#</th>
                    <th className="py-3 px-3">STUDENT ID</th>
                    <th className="py-3 px-3.5">STUDENT NAME</th>
                    <th className="py-3 px-3">FATHER'S NAME</th>
                    <th className="py-3 px-3">CLASS &amp; SECTION</th>
                    <th className="py-3 px-3">SELECTED MONTHS</th>
                    <th className="py-3 px-3">REG FEE (₹)</th>
                    <th className="py-3 px-3">ANNUAL FEE (₹)</th>
                    <th className="py-3 px-3">TRANSPORT FEE (₹)</th>
                    <th className="py-3 px-3">TUITION FEE (₹)</th>
                    <th className="py-3 px-3">OVERALL REMAINING (₹)</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] text-slate-700 text-xs">
                  {paginatedMonthlyStudents.map((item, idx) => {
                    const s = item.student;
                    const rowIndex = (monthlyPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={s.id} className="hover:bg-[#F9FCFA] transition-colors">
                        {/* Index */}
                        <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {rowIndex}
                        </td>

                        {/* Student ID */}
                        <td className="py-3 px-3 font-mono font-bold text-[#122A24] text-[11.5px]">
                          {s.admission_no || s.id}
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-3.5 font-semibold text-slate-900">
                          {s.full_name}
                        </td>

                        {/* Father Name */}
                        <td className="py-3 px-3 text-slate-600">
                          {s.father_name || s.guardian_name || 'N/A'}
                        </td>

                        {/* Class & Section */}
                        <td className="py-3 px-3 font-mono text-[11px] font-medium text-[#122A24]">
                          {s.class_name} {s.section ? `(${s.section})` : '(A)'}
                        </td>

                        {/* Selected Months */}
                        <td className="py-3 px-3 font-mono text-[10.5px] text-slate-500">
                          {monthRangeText}
                        </td>

                        {/* Reg Fee */}
                        <td className="py-3 px-3 font-mono">
                          {item.regFeePaid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[11px]">
                              ₹{item.regFee.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Annual Fee */}
                        <td className="py-3 px-3 font-mono">
                          {item.annualFeePaid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[11px]">
                              ₹{item.annualFee.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Transport Fee */}
                        <td className="py-3 px-3 font-mono">
                          {!item.hasTransport ? (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          ) : item.transportFeePaid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[11px]">
                              ₹{item.totalTransport.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Tuition Fee */}
                        <td className="py-3 px-3 font-mono">
                          {item.tuitionFeePaid === true ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : item.tuitionFeePaid === 'PARTIAL' ? (
                            <span className="text-amber-700 font-bold text-[11px]">
                              ₹{item.remainingDue.toLocaleString()} (Part)
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[11px]">
                              ₹{item.totalTuition.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Overall Remaining Dues */}
                        <td className="py-3 px-3 font-mono">
                          {item.remainingDue === 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Cleared
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              ₹{item.remainingDue.toLocaleString()} Due
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDossierStudent(s)}
                              className="px-2.5 py-1 rounded-lg bg-[#F8FAF9] hover:bg-slate-100 text-emerald-900 border border-[#DCE8E0] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              title="View Student Full Fee Dossier"
                            >
                              <Eye className="w-3 h-3 text-emerald-700" /> View Dossier
                            </button>

                            {item.remainingDue > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuickCollectFromMonthly(s, item.remainingDue)}
                                className="px-2.5 py-1 rounded-lg bg-[#122A24] hover:bg-[#1C443A] text-white text-[11px] font-bold border-none cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Collect Fee at Counter"
                              >
                                <CreditCard className="w-3 h-3" /> Collect
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedMonthlyStudents.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-xs text-slate-400 font-mono">
                        No students match the selected classes, section, and search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalMonthlyPages > 1 && (
              <div className="flex items-center justify-between pt-3 text-xs font-mono">
                <span className="text-slate-500">
                  Showing {(monthlyPage - 1) * itemsPerPage + 1} to {Math.min(monthlyPage * itemsPerPage, visibleMonthlyStudents.length)} of {visibleMonthlyStudents.length} Students
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={monthlyPage === 1}
                    onClick={() => setMonthlyPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-[#DCE8E0] bg-[#F8FAF9] hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-[#122A24] bg-[#EBF5EF] rounded-lg border border-[#C5E2CF]">
                    Page {monthlyPage} of {totalMonthlyPages}
                  </span>

                  <button
                    type="button"
                    disabled={monthlyPage === totalMonthlyPages}
                    onClick={() => setMonthlyPage(prev => Math.min(totalMonthlyPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-[#DCE8E0] bg-[#F8FAF9] hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: INSTITUTIONAL FEE STRUCTURE (ADMIN ENGINE)
          ───────────────────────────────────────────────────────────── */}
      {feeTab === 'structure' && (
        <div className="space-y-6 animate-fade-in">

          {/* Top Admin Action Bar */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#E6F4EA] text-[#0D652D] text-[11px] font-mono font-bold border border-[#CEEAD6]">
                  CBSE Master Config
                </span>
                <span className="text-xs font-mono text-slate-500">Session {selectedSession || '2026-27'}</span>
              </div>
              <h2 className="font-display font-bold text-lg text-[#122A24] mt-1">
                Institutional Fee Master &amp; Structure Engine
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                Admins can modify tuition rates, one-time annual heads, transport distance slabs, and fee deposit cycles in real time
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Structure (CSV/JSON)</span>
                <input
                  type="file"
                  accept=".csv, .json"
                  onChange={handleUploadFeeStructure}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadSampleStructureCsv}
                className="px-3.5 py-2 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={handleResetFeeStructure}
                className="px-3.5 py-2 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Reset Defaults
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Print Circular
              </button>

              <button
                type="button"
                onClick={handleSaveFeeStructure}
                disabled={isSavingStructure}
                className="px-4 py-2 bg-[#005A36] hover:bg-[#00472B] text-white rounded-xl text-xs font-bold border-none cursor-pointer shadow-xs transition-all disabled:opacity-50"
              >
                {structureSaveSuccess ? 'Saved!' : 'Save All Structure Changes'}
              </button>
            </div>
          </div>

          {/* Upload Status Banner */}
          {uploadFeedback && (
            <div className="p-3.5 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{uploadFeedback}</span>
            </div>
          )}

          {/* Official Sibling Concession & Institutional Regulations Notice Card */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8F0EA]">
              <Info className="w-5 h-5 text-emerald-700" />
              <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24]">
                IMPORTANT NOTICE &amp; CONCESSION REGULATIONS (Session 2026–27)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
              <div className="space-y-2.5 p-4 rounded-2xl bg-[#F8FAF9] border border-[#E8F0EA]">
                <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Sibling Concession Policy (Same Father Enrolled):
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-[11.5px]">
                  <li>
                    <strong>Two children:</strong> Only the <strong>second child</strong> will receive a <strong>20% concession</strong> in monthly tuition fee.
                  </li>
                  <li>
                    <strong>Three children:</strong> Only the <strong>third child</strong> will receive a <strong>30% concession</strong> in monthly tuition fee.
                  </li>
                  <li>
                    <strong>Four children:</strong> The <strong>third child</strong> will receive a <strong>30% concession</strong> in tuition fee, and the <strong>fourth child</strong> will be granted a special facility—<strong>free transportation</strong>.
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-[#F8FAF9] border border-[#E8F0EA]">
                <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  Lump-Sum Payment &amp; Operational Regulations:
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-[11.5px]">
                  <li>
                    <strong>Annual Discount:</strong> A discount equal to <strong>one month&apos;s tuition fee</strong> will be given if the entire year&apos;s payment is made at once.
                  </li>
                  <li>
                    <strong>Exclusions:</strong> Books, stationery, uniform, examination charges, emergency health care, and other special events are not included in regular tuition.
                  </li>
                  <li>
                    <strong>Refundable Security Deposit:</strong> Refundable only if the child successfully completes the academic session. Mid-term withdrawal will not be refunded.
                  </li>
                  <li>
                    <strong>Transport Revisions:</strong> If a child&apos;s route is changed, the transportation fees will be revised according to the new distance slab.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2x2 Grid of the 4 Structure Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ─────────────────────────────────────────────────────────────
                CARD 1: One-Time & Annual Fees
                ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                  <h3 className="font-display font-bold text-sm text-[#122A24]">One-Time &amp; Annual Fees</h3>
                  <span className="text-[11px] font-mono text-slate-500">16 March 2026</span>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE8E0]">
                  {/* Table Header */}
                  <div className="bg-[#122A24] text-white text-[11px] font-mono font-bold tracking-wider px-3.5 py-2.5 grid grid-cols-12 gap-2">
                    <div className="col-span-2">SN</div>
                    <div className="col-span-7">PARTICULARS</div>
                    <div className="col-span-3 text-right pr-2">AMOUNT (₹)</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-[#E8F0EA] bg-[#F8FAF9]/50">
                    {oneTimeFees.map((row, idx) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-xs hover:bg-white transition-colors group">
                        <div className="col-span-2 font-mono font-bold text-slate-500 pl-1">{idx + 1}</div>
                        <div className="col-span-7">
                          <input
                            type="text"
                            value={row.particulars}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOneTimeFees(prev => prev.map(item => item.id === row.id ? { ...item, particulars: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-medium text-[#122A24] focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setOneTimeFees(prev => prev.map(item => item.id === row.id ? { ...item, amount: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-mono font-bold text-[#122A24] text-right focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                          {oneTimeFees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOneTimeFees(prev => prev.filter(item => item.id !== row.id))}
                              className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded border-none bg-transparent cursor-pointer transition-colors text-xs font-bold"
                              title="Delete Fee Head"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add New Fee Head */}
              <button
                type="button"
                onClick={() => setOneTimeFees(prev => [...prev, { id: String(Date.now()), particulars: 'New Fee Head', amount: 1000 }])}
                className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-dashed border-[#C5E2CF] rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-all mt-2"
              >
                + Add Fee Head
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                CARD 2: Tuition Fee Structure (Class-Wise)
                ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Tuition Fee Structure</h3>
                  <span className="text-[11px] font-mono text-slate-500">Class-Wise</span>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE8E0]">
                  {/* Table Header */}
                  <div className="bg-[#122A24] text-white text-[11px] font-mono font-bold tracking-wider px-3.5 py-2.5 grid grid-cols-12 gap-2">
                    <div className="col-span-5">CLASS</div>
                    <div className="col-span-3 text-right">MONTHLY FEE (₹)</div>
                    <div className="col-span-4 text-right pr-2">QUARTERLY FEE (₹)</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-[#E8F0EA] bg-[#F8FAF9]/50">
                    {tuitionFees.map((row) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-xs hover:bg-white transition-colors group">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={row.className}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTuitionFees(prev => prev.map(item => item.id === row.id ? { ...item, className: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={row.monthlyFee}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setTuitionFees(prev => prev.map(item => item.id === row.id ? { ...item, monthlyFee: val, quarterlyFee: val * 3 } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-mono font-bold text-[#122A24] text-right focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={row.quarterlyFee}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setTuitionFees(prev => prev.map(item => item.id === row.id ? { ...item, quarterlyFee: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-mono font-bold text-emerald-800 text-right focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                          {tuitionFees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTuitionFees(prev => prev.filter(item => item.id !== row.id))}
                              className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded border-none bg-transparent cursor-pointer transition-colors text-xs font-bold"
                              title="Delete Class Rate"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add New Class Grade */}
              <button
                type="button"
                onClick={() => setTuitionFees(prev => [...prev, { id: String(Date.now()), className: 'Class New', monthlyFee: 1500, quarterlyFee: 4500 }])}
                className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-dashed border-[#C5E2CF] rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-all mt-2"
              >
                + Add Class Grade
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                CARD 3: Monthly School Transport Fee (Kilometres Slab)
                ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Monthly School Transport Fee</h3>
                  <span className="text-[11px] font-mono text-slate-500">Kilometres Slab</span>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE8E0]">
                  {/* Table Header */}
                  <div className="bg-[#122A24] text-white text-[11px] font-mono font-bold tracking-wider px-3.5 py-2.5 grid grid-cols-12 gap-2">
                    <div className="col-span-7">KILOMETRES</div>
                    <div className="col-span-5 text-right pr-2">TRANSPORT FEE (₹ / MO)</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-[#E8F0EA] bg-[#F8FAF9]/50">
                    {transportFees.map((row) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-xs hover:bg-white transition-colors group">
                        <div className="col-span-7">
                          <input
                            type="text"
                            value={row.slab}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTransportFees(prev => prev.map(item => item.id === row.id ? { ...item, slab: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24] focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                        </div>
                        <div className="col-span-5 flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={row.monthlyFee}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setTransportFees(prev => prev.map(item => item.id === row.id ? { ...item, monthlyFee: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-mono font-bold text-[#122A24] text-right focus:outline-none focus:border-emerald-600 shadow-2xs"
                          />
                          {transportFees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setTransportFees(prev => prev.filter(item => item.id !== row.id))}
                              className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded border-none bg-transparent cursor-pointer transition-colors text-xs font-bold"
                              title="Delete Slab"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add New Transport Slab */}
              <button
                type="button"
                onClick={() => setTransportFees(prev => [...prev, { id: String(Date.now()), slab: '20 to 25 km', monthlyFee: 2000 }])}
                className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-dashed border-[#C5E2CF] rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-all mt-2"
              >
                + Add Distance Slab
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                CARD 4: Fee Deposit Scheme Schedule (Installment Cycle)
                ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Fee Deposit Scheme Schedule</h3>
                  <span className="text-[11px] font-mono text-slate-500">Installment Cycle</span>
                </div>

                {/* 2-Column Grid of Installment Cycles */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {depositSchemes.map((scheme, idx) => {
                    const isSpecial = scheme.isSpecial || idx === 0 || idx === 4 || idx === 7;
                    const bgTint = idx === 7
                      ? 'bg-[#FAF5FF] border-[#E9D5FF] text-[#581C87]'
                      : isSpecial
                      ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#312E81]'
                      : 'bg-[#F8FAF9] border-[#DCE8E0] text-[#122A24]';

                    const isFullWidth = idx === depositSchemes.length - 1 && depositSchemes.length % 2 !== 0;

                    return (
                      <div
                        key={scheme.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-semibold transition-all ${bgTint} ${
                          isFullWidth ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={scheme.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDepositSchemes(prev => prev.map(item => item.id === scheme.id ? { ...item, title: val } : item));
                          }}
                          className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none focus:bg-white/80 rounded px-1.5 py-0.5"
                        />
                        {depositSchemes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDepositSchemes(prev => prev.filter(item => item.id !== scheme.id))}
                            className="text-slate-400 hover:text-rose-600 px-1 py-0.5 rounded border-none bg-transparent cursor-pointer shrink-0 transition-colors text-xs font-bold"
                            title="Remove Cycle"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Installment Cycle */}
              <button
                type="button"
                onClick={() => setDepositSchemes(prev => [...prev, { id: String(Date.now()), title: `${prev.length + 1}. Special Installment`, isSpecial: false }])}
                className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#122A24] hover:text-emerald-900 border border-dashed border-[#C5E2CF] rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-all mt-2"
              >
                + Add Installment Cycle
              </button>
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
          MODAL 1B: OFFICIAL INDIVIDUAL SCHOLAR FEE SLIP (FROM REPORT)
          ───────────────────────────────────────────────────────────── */}
      {singleSlipStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
                <span className="font-display font-bold text-base text-[#122A24]">Official CBSE Student Fee Slip</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsAppReminder(singleSlipStudent)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                  title="Share Fee Slip via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Share WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button
                  onClick={() => setSingleSlipStudent(null)}
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
                  {selectedSchool?.school_name || 'Delhi Public International School'}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  {selectedSchool?.address || 'Sector 12, Dwarka, New Delhi'} • Phone: {selectedSchool?.phone || '+91 11 2789 0000'}
                </div>
                <div className="text-[11px] font-mono font-bold text-[#1C443A] mt-1">
                  CBSE Affiliation No: {selectedSchool?.affiliation_no || '2130042'} | School Code: {selectedSchool?.oasis_code || '84001'}
                </div>
                <div className="inline-block mt-2 px-3 py-0.5 bg-[#122A24] text-white text-[11px] font-bold uppercase rounded-md tracking-wider">
                  Official Student Fee Slip • Session {selectedSession || '2026-27'}
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono border-b border-slate-200 pb-3">
                <div>
                  <span className="text-slate-500">Receipt No: </span>
                  <strong className="text-[#122A24]">REC-2026-{singleSlipStudent.rollNo + 1000}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <strong className="text-[#122A24]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Roll No: </span>
                  <strong className="text-[#122A24]">{singleSlipStudent.rollNo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Scholar No: </span>
                  <strong className="text-[#122A24]">{singleSlipStudent.student.admission_no || singleSlipStudent.student.id}</strong>
                </div>

                <div>
                  <span className="text-slate-500">Student Name: </span>
                  <strong className="text-[#122A24] font-sans font-bold">{singleSlipStudent.student.full_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Father Name: </span>
                  <strong className="text-[#122A24]">{singleSlipStudent.fatherName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class &amp; Sec: </span>
                  <strong className="text-[#122A24]">{singleSlipStudent.className} - {singleSlipStudent.section}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Transport: </span>
                  <strong className="text-[#122A24]">{singleSlipStudent.transportOpted ? singleSlipStudent.transportSlab : 'Self'}</strong>
                </div>
              </div>

              {/* Fee Particulars Table */}
              <table className="w-full text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b-2 border-[#122A24] bg-slate-50">
                    <th className="py-2 px-2 text-left font-bold w-12">SN</th>
                    <th className="py-2 px-2 text-left font-bold">FEE PARTICULARS</th>
                    <th className="py-2 px-2 text-right font-bold w-24">DUE (₹)</th>
                    <th className="py-2 px-2 text-right font-bold w-24 text-emerald-800">PAID (₹)</th>
                    <th className="py-2 px-2 text-right font-bold w-24 text-rose-700">PENDING (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-1.5 px-2">1</td>
                    <td className="py-1.5 px-2">
                      Tuition &amp; Composite Academic Fee
                      {singleSlipStudent.siblingInfo.tuitionDiscountPct > 0 && (
                        <span className="text-emerald-700 font-bold ml-1">
                          (Less: {singleSlipStudent.siblingInfo.tuitionDiscountPct}% Sibling Concession)
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{singleSlipStudent.netTuitionDue.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{singleSlipStudent.tuitionPaid.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{singleSlipStudent.tuitionPending.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-1.5 px-2">2</td>
                    <td className="py-1.5 px-2">
                      Monthly School Transport Fee ({singleSlipStudent.transportOpted ? singleSlipStudent.transportSlab : 'Self'})
                      {singleSlipStudent.siblingInfo.freeTransport && (
                        <span className="text-emerald-700 font-bold ml-1">(4th Child: 100% Free)</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{singleSlipStudent.transportDue.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{singleSlipStudent.transportPaid.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{singleSlipStudent.transportPending.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-1.5 px-2">3</td>
                    <td className="py-1.5 px-2">Institutional Annual Fee &amp; Infrastructure Development</td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{singleSlipStudent.annualDue.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{singleSlipStudent.annualPaid.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{singleSlipStudent.annualPending.toLocaleString()}</td>
                  </tr>

                  <tr>
                    <td className="py-1.5 px-2">4</td>
                    <td className="py-1.5 px-2">CBSE Examination &amp; Assessment Charges</td>
                    <td className="py-1.5 px-2 text-right font-bold">₹{singleSlipStudent.examDue.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-emerald-800">₹{singleSlipStudent.examPaid.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-rose-700">₹{singleSlipStudent.examPending.toLocaleString()}</td>
                  </tr>

                  <tr className="border-t-2 border-[#122A24] bg-slate-50 font-bold">
                    <td className="py-2 px-2" colSpan={2}>CONSOLIDATED TOTALS</td>
                    <td className="py-2 px-2 text-right text-sm">₹{singleSlipStudent.totalDue.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-sm text-emerald-800">₹{singleSlipStudent.totalPaid.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-sm text-rose-700">₹{singleSlipStudent.totalPending.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in Words */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-mono">Amount Received in Words: </span>
                <strong className="text-[#122A24] italic uppercase">
                  {numberToWordsINR(singleSlipStudent.totalPaid)}
                </strong>
              </div>

              {/* Payment Mode & Stamp Area */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div>
                  <div className="font-mono text-[11px] text-slate-500">Billing Scheme:</div>
                  <strong className="text-[#122A24]">{getPeriodMeta(reportPeriod).label}</strong>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    Fee Status: <span className={singleSlipStudent.status === 'PAID' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{singleSlipStudent.status}</span>
                  </div>
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: STUDENT COMPREHENSIVE FEE DOSSIER & PAYMENT HISTORY
          ───────────────────────────────────────────────────────────── */}
      {selectedDossierStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 space-y-5">
            
            {/* Dossier Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
                  {selectedDossierStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    {selectedDossierStudent.full_name} — Student Fee Dossier
                  </h3>
                  <p className="text-xs text-[#2D5A4E] font-mono">
                    Adm No: {selectedDossierStudent.admission_no || selectedDossierStudent.id} • Class: {selectedDossierStudent.class_name} ({selectedDossierStudent.section || 'A'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F8FAF9] hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDossierStudent(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student Demographic Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#DCE8E0] text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Father / Guardian</span>
                <strong className="text-[#122A24]">{selectedDossierStudent.father_name || selectedDossierStudent.guardian_name || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Phone / Contact</span>
                <strong className="text-[#122A24] font-mono">{selectedDossierStudent.guardian_phone || selectedDossierStudent.phone || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Transport Status</span>
                <strong className="text-emerald-800 font-mono">
                  {selectedDossierStudent.transport_opted === 'YES' ? `Bus Route ${selectedDossierStudent.bus_route_no || '#4'}` : 'Self / No Bus'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Current Fee Status</span>
                <span className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[10.5px] uppercase ${
                  selectedDossierStudent.fee_status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedDossierStudent.fee_status === 'OVERDUE'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedDossierStudent.fee_status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Academic Session Month-by-Month Schedule */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#122A24] uppercase tracking-wide text-[11px]">
                  Academic Session Month-by-Month Fee Schedule ({selectedSession})
                </span>
                <span className="text-slate-500 font-mono text-[11px]">CBSE Regular Billing Schedule</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#DCE8E0]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF9] text-[10.5px] font-mono text-slate-500 uppercase border-b border-[#E8F0EA]">
                      <th className="py-2.5 px-3">MONTH</th>
                      <th className="py-2.5 px-3">TUITION (₹)</th>
                      <th className="py-2.5 px-3">TRANSPORT (₹)</th>
                      <th className="py-2.5 px-3">SPECIAL HEADS</th>
                      <th className="py-2.5 px-3">TOTAL (₹)</th>
                      <th className="py-2.5 px-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA] font-mono text-[11.5px]">
                    {ACADEMIC_MONTHS.map((m, mIdx) => {
                      const isApril = mIdx === 0;
                      const isPaid = selectedDossierStudent.fee_status === 'PAID' || mIdx < 4;
                      const tuition = 3500;
                      const transport = selectedDossierStudent.transport_opted === 'YES' ? 1800 : 0;
                      const special = isApril ? 8500 : 0;
                      const total = tuition + transport + special;

                      return (
                        <tr key={m} className="hover:bg-[#F9FCFA]">
                          <td className="py-2 px-3 font-sans font-bold text-[#122A24]">{m}</td>
                          <td className="py-2 px-3">₹{tuition.toLocaleString()}</td>
                          <td className="py-2 px-3">{transport > 0 ? `₹${transport.toLocaleString()}` : '—'}</td>
                          <td className="py-2 px-3 text-slate-600 font-sans">
                            {isApril ? 'Annual & Development' : '—'}
                          </td>
                          <td className="py-2 px-3 font-bold text-[#122A24]">₹{total.toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dossier Bottom Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8F0EA]">
              <button
                type="button"
                onClick={() => setSelectedDossierStudent(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = selectedDossierStudent;
                  setSelectedDossierStudent(null);
                  handleQuickCollectFromMonthly(s, 15000);
                }}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Collect Fees for {selectedDossierStudent.full_name} →</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
