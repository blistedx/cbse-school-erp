/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  GraduationCap,
  CreditCard,
  CalendarCheck,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Check,
  X,
  RefreshCw,
  FileUp,
  Table,
  ArrowRight
} from 'lucide-react';
import { Student, Teacher, FeeInvoice, AttendanceRecord, School } from '@/lib/types';
import { InstitutionalReportModal, ReportColumn } from '@/components/institutional-report-modal';
import { apiFetch } from '@/lib/api-client';

interface DashboardDataHubProps {
  students: Student[];
  teachers: Teacher[];
  invoices: FeeInvoice[];
  attendance: AttendanceRecord[];
  exams?: any[];
  selectedSchool: School | null;
  selectedSession?: string;
  onRefresh?: () => void;
  onDataImported?: (type: string, count: number) => void;
  showToast?: (msg: string) => void;
}

type ActiveHubTab = 'download' | 'upload';
type ImportCategory = 'students' | 'teachers' | 'fees' | 'attendance';

export function DashboardDataHub({
  students = [],
  teachers = [],
  invoices = [],
  attendance = [],
  exams = [],
  selectedSchool,
  selectedSession = '2026-27',
  onRefresh,
  onDataImported,
  showToast
}: DashboardDataHubProps) {
  // Main Tab: Download vs Upload
  const [activeTab, setActiveTab] = useState<ActiveHubTab>('download');

  // Official CBSE Report Modal
  const [activeReportModal, setActiveReportModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    filterSummary?: Array<{ label: string; value: string }>;
    statsSummary?: Array<{ label: string; value: string | number }>;
    columns: ReportColumn[];
    data: any[];
    onDownloadCSV?: () => void;
  } | null>(null);

  // ─────────────────────────────────────────────────────────────────
  // 1. DOWNLOAD SECTION — FILTER STATE & LOGIC
  // ─────────────────────────────────────────────────────────────────
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterTransport, setFilterTransport] = useState<string>('ALL');
  const [filterHouse, setFilterHouse] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterFeeStatus, setFilterFeeStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique classes dynamically
  const uniqueClasses = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach(s => {
      const cls = (s.class_name || '').trim();
      if (cls) {
        map.set(cls, (map.get(cls) || 0) + 1);
      }
    });

    return Array.from(map.keys()).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [students]);

  // Extract unique sections
  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.section) set.add(s.section.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students computation
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const sAny = s as any;

      // 1. Class filter
      if (filterClass !== 'ALL') {
        const studentClass = (s.class_name || '').trim().toLowerCase();
        const targetClass = filterClass.trim().toLowerCase();
        if (studentClass !== targetClass && !studentClass.includes(targetClass)) return false;
      }

      // 2. Section filter
      if (filterSection !== 'ALL') {
        if ((s.section || '').trim().toUpperCase() !== filterSection.toUpperCase()) return false;
      }

      // 3. Gender filter
      if (filterGender !== 'ALL') {
        if ((s.gender || '').trim().toLowerCase() !== filterGender.toLowerCase()) return false;
      }

      // 4. Transport filter
      if (filterTransport !== 'ALL') {
        const hasTransport = Boolean(
          sAny.bus_route ||
          sAny.transport_opted === true ||
          sAny.transport_opted === 'YES' ||
          (sAny.transport && sAny.transport !== 'NO' && sAny.transport !== 'NONE') ||
          sAny.bus_stop
        );
        if (filterTransport === 'TRANSPORT' && !hasTransport) return false;
        if (filterTransport === 'NON_TRANSPORT' && hasTransport) return false;
      }

      // 5. House filter
      if (filterHouse !== 'ALL') {
        const studentHouse = (s.house || sAny.house_name || '').trim().toLowerCase();
        if (studentHouse !== filterHouse.toLowerCase()) return false;
      }

      // 6. Category / RTE filter
      if (filterCategory !== 'ALL') {
        const cat = (s.category || '').toUpperCase();
        const admType = (sAny.admission_type || sAny.rte_status || '').toUpperCase();
        if (filterCategory === 'RTE') {
          if (!admType.includes('RTE') && !cat.includes('RTE') && !sAny.is_rte) return false;
        } else if (filterCategory === 'EWS') {
          if (!cat.includes('EWS') && !admType.includes('EWS')) return false;
        } else {
          if (cat !== filterCategory) return false;
        }
      }

      // 7. Fee Status filter
      if (filterFeeStatus !== 'ALL') {
        if ((s.fee_status || '').toUpperCase() !== filterFeeStatus.toUpperCase()) return false;
      }

      // 8. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.full_name || '').toLowerCase().includes(q);
        const matchAdm = (s.admission_no || '').toLowerCase().includes(q);
        const matchPhone = (s.guardian_phone || s.phone || sAny.parent_phone || '').includes(q);
        const matchGuardian = (s.guardian_name || s.father_name || '').toLowerCase().includes(q);
        if (!matchName && !matchAdm && !matchPhone && !matchGuardian) return false;
      }

      return true;
    });
  }, [
    students,
    filterClass,
    filterSection,
    filterGender,
    filterTransport,
    filterHouse,
    filterCategory,
    filterFeeStatus,
    searchQuery
  ]);

  // Reset Filters
  const handleReset = () => {
    setFilterClass('ALL');
    setFilterSection('ALL');
    setFilterGender('ALL');
    setFilterTransport('ALL');
    setFilterHouse('ALL');
    setFilterCategory('ALL');
    setFilterFeeStatus('ALL');
    setSearchQuery('');
    if (showToast) showToast('Filters reset.');
  };

  // Direct CSV Export with UTF-8 BOM
  const downloadFilteredCSV = () => {
    if (filteredStudents.length === 0) {
      if (showToast) showToast('No records match the current filters.');
      return;
    }

    const headers = [
      'Admission No',
      'Roll No',
      'Student Name',
      'Class',
      'Section',
      'Gender',
      'DOB',
      'Blood Group',
      'House',
      'Category / Quota',
      'RTE Status',
      'Transport / Bus Route',
      'Fee Status',
      'Father / Guardian Name',
      'Guardian Phone',
      'Aadhaar No',
      'APAAR / PEN No',
      'Address',
      'Status'
    ];

    const rows = filteredStudents.map(s => {
      const sAny = s as any;
      const isRTE = sAny.admission_type === 'RTE' || sAny.rte_status === 'YES' || s.category === 'EWS' ? 'YES (RTE/EWS)' : 'NO (Regular)';
      const transportVal = sAny.bus_route ? sAny.bus_route : (sAny.transport_opted ? 'Transport Opted' : 'Private / Walker');

      return [
        `"${(s.admission_no || '').replace(/"/g, '""')}"`,
        `"${(s.roll_no || '').toString().replace(/"/g, '""')}"`,
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        `"${(s.class_name || '').replace(/"/g, '""')}"`,
        `"${(s.section || '').replace(/"/g, '""')}"`,
        `"${(s.gender || 'Female').replace(/"/g, '""')}"`,
        `"${(s.dob || '').replace(/"/g, '""')}"`,
        `"${(s.blood_group || '').replace(/"/g, '""')}"`,
        `"${(s.house || sAny.house_name || 'Unassigned').replace(/"/g, '""')}"`,
        `"${(s.category || 'GENERAL').replace(/"/g, '""')}"`,
        `"${isRTE}"`,
        `"${transportVal.replace(/"/g, '""')}"`,
        `"${(s.fee_status || 'PAID').replace(/"/g, '""')}"`,
        `"${(s.guardian_name || s.father_name || '').replace(/"/g, '""')}"`,
        `"${(s.guardian_phone || s.phone || sAny.parent_phone || '').replace(/"/g, '""')}"`,
        `"${(s.aadhaar_no || '').replace(/"/g, '""')}"`,
        `"${(s.apaar_id || '').replace(/"/g, '""')}"`,
        `"${(s.address || sAny.permanent_address || '').replace(/"/g, '""')}"`,
        `"${(s.status || 'ACTIVE').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const classTag = filterClass !== 'ALL' ? `_${filterClass.replace(/\s+/g, '')}` : '';
    const dateTag = new Date().toISOString().slice(0, 10);
    const fileName = `${selectedSchool?.school_code || 'DPS2026'}_Student_Report${classTag}_${dateTag}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) {
      showToast(`Downloaded ${fileName} (${filteredStudents.length} records)`);
    }
  };

  // Direct CSV downloads for other datasets
  const downloadDataset = (type: 'fees' | 'teachers' | 'attendance') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = '';

    if (type === 'fees') {
      headers = ['Invoice No', 'Student Name', 'Admission No', 'Class', 'Term', 'Amount', 'Paid Amount', 'Status', 'Due Date'];
      rows = invoices.map(i => [
        `"${i.invoice_no || i.id || ''}"`,
        `"${i.student_name || ''}"`,
        `"${i.admission_no || i.student_id || ''}"`,
        `"${i.class_name || ''}"`,
        `"${i.month || 'Term 1'}"`,
        (i.amount || 0).toString(),
        (i.paid_amount || 0).toString(),
        `"${i.status || 'PAID'}"`,
        `"${i.due_date || ''}"`
      ]);
      fileName = `${selectedSchool?.school_code || 'DPS2026'}_Fee_Ledger.csv`;
    } else if (type === 'teachers') {
      headers = ['Staff Code', 'Full Name', 'Designation', 'Department', 'Subject', 'Phone', 'Email', 'Status'];
      rows = teachers.map(t => [
        `"${t.staff_code || t.id}"`,
        `"${t.full_name}"`,
        `"${t.designation || 'Teacher'}"`,
        `"${t.department || 'Academics'}"`,
        `"${t.subject_specialization || 'General'}"`,
        `"${t.phone || ''}"`,
        `"${t.email || ''}"`,
        `"${t.status || 'ACTIVE'}"`
      ]);
      fileName = `${selectedSchool?.school_code || 'DPS2026'}_Staff_Directory.csv`;
    } else if (type === 'attendance') {
      headers = ['Date', 'Class', 'Section', 'Total Students', 'Present', 'Absent', 'Holiday', 'Marked By'];
      rows = attendance.map(a => [
        `"${a.date}"`,
        `"${a.class_name || ''}"`,
        `"${a.section || ''}"`,
        (a.total_students || 0).toString(),
        (a.present_count || 0).toString(),
        (a.absent_count || 0).toString(),
        (a.holiday_count !== undefined ? a.holiday_count : (a.leave_count || 0)).toString(),
        `"${a.marked_by || 'Class Teacher'}"`
      ]);
      fileName = `${selectedSchool?.school_code || 'DPS2026'}_Attendance_Ledger.csv`;
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Downloaded ${fileName}!`);
  };

  // Official CBSE Printable PDF Modal
  const handlePrintStudentsReport = () => {
    if (filteredStudents.length === 0) {
      if (showToast) showToast('No students match filter criteria to print.');
      return;
    }

    const cols: ReportColumn[] = [
      { header: 'ADM NO', key: 'admission_no', width: '12%', align: 'center' },
      { header: 'ROLL', key: 'roll_no', width: '8%', align: 'center' },
      { header: 'SCHOLAR NAME', key: 'full_name', width: '24%' },
      { header: 'CLASS & SEC', render: (s) => `${s.class_name || 'N/A'} (${s.section || 'A'})`, width: '14%' },
      { header: 'GENDER', key: 'gender', width: '8%', align: 'center' },
      { header: 'FEE STATUS', key: 'fee_status', width: '10%', align: 'center' },
      { header: 'CATEGORY', render: (s) => s.category || 'GENERAL', width: '10%', align: 'center' },
      { header: 'GUARDIAN PHONE', render: (s) => s.guardian_phone || s.phone || 'N/A', width: '14%' }
    ];

    const stats = [
      { label: 'Enrolled Total', value: `${students.length} Scholars` },
      { label: 'Filter Matched', value: `${filteredStudents.length} Scholars` },
      { label: 'Transport Users', value: `${filteredStudents.filter((s: any) => s.bus_route || s.transport_opted).length} Scholars` },
      { label: 'Fee Cleared', value: `${filteredStudents.filter((s: any) => s.fee_status === 'PAID').length} Scholars` }
    ];

    setActiveReportModal({
      isOpen: true,
      title: 'Official CBSE Student Master Enrollment Register',
      subtitle: `Statutory Academic Roll Call & Demographics (${selectedSchool?.school_name || 'Delhi Public School'})`,
      filterSummary: [
        { label: 'Class Scope', value: filterClass === 'ALL' ? 'All Classes' : filterClass },
        { label: 'Section', value: filterSection === 'ALL' ? 'All Sections' : `Sec ${filterSection}` },
        { label: 'Gender', value: filterGender === 'ALL' ? 'All Genders' : filterGender },
        { label: 'Category', value: filterCategory === 'ALL' ? 'All Quotas' : filterCategory }
      ],
      statsSummary: stats,
      columns: cols,
      data: filteredStudents,
      onDownloadCSV: downloadFilteredCSV
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // 2. UPLOAD SECTION — CSV / EXCEL PARSER & BATCH INGESTION STATE
  // ─────────────────────────────────────────────────────────────────
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<ImportCategory>('students');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ successCount: number; failCount: number; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template generators for CSV
  const downloadSampleTemplate = (cat: ImportCategory) => {
    let headers: string[] = [];
    let sampleRows: string[][] = [];
    let filename = '';

    if (cat === 'students') {
      headers = [
        'admission_no',
        'roll_no',
        'full_name',
        'class_name',
        'section',
        'gender',
        'dob',
        'father_name',
        'guardian_phone',
        'bus_route',
        'category',
        'fee_status',
        'address'
      ];
      sampleRows = [
        ['DPS-2026-001', '1', 'Aarav Sharma', 'Class 10', 'A', 'Male', '2010-04-12', 'Rajesh Sharma', '9876543210', 'Route 4 (Dwarka)', 'GENERAL', 'PAID', 'Sector 12, Dwarka, New Delhi'],
        ['DPS-2026-002', '2', 'Ananya Verma', 'Class 10', 'A', 'Female', '2010-08-25', 'Vikram Verma', '9876543211', 'Private / Walker', 'OBC', 'PAID', 'Sector 6, Dwarka, New Delhi'],
        ['DPS-2026-003', '3', 'Kabir Patel', 'Class 10', 'B', 'Male', '2010-11-03', 'Sanjay Patel', '9876543212', 'Route 1 (Janakpuri)', 'GENERAL', 'PENDING', 'A-Block, Janakpuri, New Delhi']
      ];
      filename = 'Sample_Students_Template.csv';
    } else if (cat === 'teachers') {
      headers = ['staff_code', 'full_name', 'designation', 'department', 'subject_specialization', 'phone', 'email'];
      sampleRows = [
        ['FAC-101', 'Dr. Sunita Kapoor', 'Senior PGT', 'Science', 'Physics', '9811223344', 'sunita.k@school.edu.in'],
        ['FAC-102', 'Amit Saxena', 'TGT', 'Mathematics', 'Mathematics', '9822334455', 'amit.s@school.edu.in']
      ];
      filename = 'Sample_Teachers_Template.csv';
    } else if (cat === 'fees') {
      headers = ['invoice_no', 'student_id', 'student_name', 'class_name', 'month', 'amount', 'paid_amount', 'status', 'due_date'];
      sampleRows = [
        ['INV-2026-001', 'DPS-2026-001', 'Aarav Sharma', 'Class 10 - A', 'April 2026', '6800', '6800', 'PAID', '2026-04-15'],
        ['INV-2026-002', 'DPS-2026-003', 'Kabir Patel', 'Class 10 - B', 'April 2026', '6800', '0', 'PENDING', '2026-04-15']
      ];
      filename = 'Sample_Fees_Template.csv';
    } else if (cat === 'attendance') {
      headers = ['date', 'class_name', 'section', 'total_students', 'present_count', 'absent_count', 'leave_count', 'marked_by'];
      sampleRows = [
        ['2026-09-01', 'Class 10', 'A', '35', '33', '2', '0', 'Sunita Kapoor'],
        ['2026-09-01', 'Class 10', 'B', '36', '34', '1', '1', 'Amit Saxena']
      ];
      filename = 'Sample_Attendance_Template.csv';
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Downloaded ${filename}`);
  };

  // Parse CSV Helper
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [] };

    // Simple robust CSV line splitter
    const splitCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    const rows = lines.slice(1).map(l => {
      const values = splitCSVLine(l).map(v => v.replace(/^["']|["']$/g, '').trim());
      const rowObj: Record<string, string> = {};
      headers.forEach((h, i) => {
        rowObj[h] = values[i] || '';
      });
      return rowObj;
    }).filter(r => Object.values(r).some(v => v.length > 0));

    return { headers, rows };
  };

  // Handle File Upload Event
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsParsing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error('File content is empty');

        const { headers, rows } = parseCSVText(content);
        if (rows.length === 0) {
          throw new Error('No valid data rows found in file.');
        }

        setParsedHeaders(headers);
        setParsedRows(rows);
        if (showToast) showToast(`Parsed ${rows.length} rows from ${file.name}`);
      } catch (err: any) {
        if (showToast) showToast(`Failed to parse file: ${err.message}`);
        setUploadedFile(null);
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Ingest & Commit Data into Database
  const handleCommitImport = async () => {
    if (parsedRows.length === 0 || !uploadedFile) return;

    setIsImporting(true);
    setImportProgress(0);
    let successCount = 0;
    let failCount = 0;

    const schoolId = selectedSchool?.id || 'DPS2026';

    try {
      if (selectedUploadCategory === 'students') {
        for (let i = 0; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          const payload = {
            school_id: schoolId,
            academic_session: selectedSession,
            admission_no: r.admission_no || r.adm_no || r.student_id || `DPS-${Date.now()}-${i}`,
            roll_no: r.roll_no ? Number(r.roll_no) : (i + 1),
            full_name: r.full_name || r.name || r.student_name || 'New Student',
            class_name: r.class_name || r.class || 'Class 1',
            section: r.section || 'A',
            gender: r.gender || 'Female',
            dob: r.dob || '2015-01-01',
            father_name: r.father_name || r.guardian_name || 'N/A',
            guardian_phone: r.guardian_phone || r.phone || '',
            bus_route: r.bus_route || r.transport || '',
            category: r.category || 'GENERAL',
            fee_status: (r.fee_status || 'PAID').toUpperCase()
          };

          try {
            const res = await apiFetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }

          setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
        }
      } else if (selectedUploadCategory === 'teachers') {
        for (let i = 0; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          const payload = {
            school_id: schoolId,
            staff_code: r.staff_code || r.code || `FAC-${100 + i}`,
            full_name: r.full_name || r.name || 'New Faculty',
            designation: r.designation || 'Teacher',
            department: r.department || 'Academics',
            subject_specialization: r.subject_specialization || r.subject || 'General',
            phone: r.phone || '',
            email: r.email || ''
          };

          try {
            const res = await apiFetch('/api/teachers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }

          setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
        }
      } else if (selectedUploadCategory === 'fees') {
        for (let i = 0; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          const amt = parseFloat(r.amount) || 5000;
          const paid = parseFloat(r.paid_amount) || (r.status === 'PAID' ? amt : 0);
          const payload = {
            school_id: schoolId,
            student_id: r.student_id || r.admission_no || `DPS-${i}`,
            student_name: r.student_name || r.full_name || 'Student',
            class_name: r.class_name || 'Class 1 - A',
            academic_session: selectedSession,
            invoice_no: r.invoice_no || `INV-${Date.now()}-${i}`,
            month: r.month || 'Term 1',
            amount: amt,
            paid_amount: paid,
            status: r.status || (paid >= amt ? 'PAID' : 'PENDING'),
            due_date: r.due_date || new Date().toISOString().split('T')[0]
          };

          try {
            const res = await apiFetch('/api/fees', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }

          setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
        }
      } else if (selectedUploadCategory === 'attendance') {
        for (let i = 0; i < parsedRows.length; i++) {
          const r = parsedRows[i];
          const payload = {
            school_id: schoolId,
            date: r.date || new Date().toISOString().split('T')[0],
            class_name: r.class_name || 'Class 1',
            section: r.section || 'A',
            total_students: Number(r.total_students) || 35,
            present_count: Number(r.present_count) || 30,
            absent_count: Number(r.absent_count) || 5,
            leave_count: Number(r.holiday_count !== undefined ? r.holiday_count : (r.holiday || r.leave_count || r.leave)) || 0,
            holiday_count: Number(r.holiday_count !== undefined ? r.holiday_count : (r.holiday || r.leave_count || r.leave)) || 0,
            marked_by: r.marked_by || 'Admin'
          };

          try {
            const res = await apiFetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }

          setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
        }
      }

      setImportResult({
        successCount,
        failCount,
        message: `Import complete! Successfully saved ${successCount} records (${failCount} errors).`
      });

      if (showToast) showToast(`Imported ${successCount} ${selectedUploadCategory} successfully!`);
      if (onDataImported) onDataImported(selectedUploadCategory, successCount);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      if (showToast) showToast(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-[#122A24]">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER & PRIMARY MODE SWITCHER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-7 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F4F8F5] text-[#1C443A] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#DCE8E0] mb-2">
              CENTRAL DATA HUB &amp; REPOSITORY
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
              Institutional Data Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#2D5A4E] mt-1 font-sans">
              Centralized gateway to download filtered CBSE demographic reports or bulk upload student/faculty rosters via CSV &amp; Excel
            </p>
          </div>

          {/* Primary Mode Switcher (Download Reports vs Upload Data) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] shadow-2xs self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                activeTab === 'download'
                  ? 'bg-[#122A24] text-white shadow-xs'
                  : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Reports</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-none ${
                activeTab === 'upload'
                  ? 'bg-[#122A24] text-white shadow-xs'
                  : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Upload Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DOWNLOAD & EXPORT REPORTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'download' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Action Toolbar Strip */}
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA] flex-wrap gap-2">
              <div>
                <span className="font-display font-bold text-base text-[#122A24] tracking-tight block">
                  Student Demographic Filter &amp; Export
                </span>
                <span className="text-xs text-[#2D5A4E]">
                  Showing {filteredStudents.length} of {students.length} Total Scholars
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={downloadFilteredCSV}
                  disabled={filteredStudents.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Download Excel CSV ({filteredStudents.length})</span>
                </button>
                <button
                  onClick={handlePrintStudentsReport}
                  disabled={filteredStudents.length === 0}
                  className="px-4 py-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] text-xs font-bold border border-[#DCE8E0] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Print Official CBSE Letterhead Register PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-[#1C443A]" />
                  <span>Print Official CBSE PDF</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-xs text-[#2D5A4E] hover:text-[#122A24] font-semibold flex items-center gap-1 border border-[#DCE8E0] rounded-xl bg-[#F4F8F5] hover:bg-slate-100 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 8 Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-sans">
              
              {/* 1. Class */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">1. Class</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Classes ({students.length})</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 2. Section */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">2. Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Sections</option>
                  {uniqueSections.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>

              {/* 3. Gender */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">3. Gender</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Genders</option>
                  <option value="Male">Boys</option>
                  <option value="Female">Girls</option>
                </select>
              </div>

              {/* 4. Transport */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">4. Transport</label>
                <select
                  value={filterTransport}
                  onChange={(e) => setFilterTransport(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Students</option>
                  <option value="TRANSPORT">Bus / Transport Users</option>
                  <option value="NON_TRANSPORT">Private / Walkers</option>
                </select>
              </div>

              {/* 5. House */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">5. House</label>
                <select
                  value={filterHouse}
                  onChange={(e) => setFilterHouse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Houses</option>
                  <option value="Red House">Red House</option>
                  <option value="Blue House">Blue House</option>
                  <option value="Green House">Green House</option>
                  <option value="Yellow House">Yellow House</option>
                </select>
              </div>

              {/* 6. RTE / Category */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">6. Quota / Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="RTE">RTE (25% Quota)</option>
                  <option value="EWS">EWS</option>
                  <option value="GENERAL">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              {/* 7. Fee Status */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">7. Fee Status</label>
                <select
                  value={filterFeeStatus}
                  onChange={(e) => setFilterFeeStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] font-medium outline-none focus:border-[#122A24] cursor-pointer"
                >
                  <option value="ALL">All Fee Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue / Defaulters</option>
                </select>
              </div>

              {/* 8. Search Keyword */}
              <div className="space-y-1">
                <label className="font-bold text-[#122A24] block text-[11px]">8. Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#2D5A4E]" />
                  <input
                    type="text"
                    placeholder="Name, Adm No, Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] text-[#122A24] text-xs font-medium outline-none focus:border-[#122A24]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Filtered Preview Table */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#F4F8F5] border-b border-[#DCE8E0] flex items-center justify-between flex-wrap gap-2">
              <span className="font-display font-bold text-xs text-[#122A24]">
                Filtered Scholar List ({filteredStudents.length} Records)
              </span>
              <span className="text-[11px] text-[#2D5A4E]">
                Showing first 50 rows • Complete dataset will be exported to CSV
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="font-display font-bold text-base text-[#122A24]">No Matching Students Found</div>
                <p className="text-xs text-[#2D5A4E] max-w-sm mx-auto">
                  No records match the chosen filters. Click reset to see all scholars.
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#122A24] text-white rounded-xl text-xs font-bold border-none cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[440px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F4F8F5] text-[#122A24] sticky top-0 z-10 border-b border-[#DCE8E0] font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">#</th>
                      <th className="py-2.5 px-3.5">ADM NO</th>
                      <th className="py-2.5 px-3.5">STUDENT NAME</th>
                      <th className="py-2.5 px-3.5">CLASS &amp; SEC</th>
                      <th className="py-2.5 px-3.5">GENDER</th>
                      <th className="py-2.5 px-3.5">CATEGORY</th>
                      <th className="py-2.5 px-3.5">TRANSPORT</th>
                      <th className="py-2.5 px-3.5">FEE STATUS</th>
                      <th className="py-2.5 px-3.5">GUARDIAN PHONE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA]">
                    {filteredStudents.slice(0, 50).map((s, idx) => {
                      const sAny = s as any;
                      const hasTransport = sAny.bus_route || sAny.transport_opted;
                      const isRTE = sAny.admission_type === 'RTE' || sAny.rte_status === 'YES' || s.category === 'EWS';

                      return (
                        <tr key={s.id || s.admission_no} className="hover:bg-[#F4F8F5]/60 transition-colors">
                          <td className="py-2 px-3.5 text-[#2D5A4E] font-bold">{idx + 1}</td>
                          <td className="py-2 px-3.5 font-bold text-[#122A24]">{s.admission_no}</td>
                          <td className="py-2 px-3.5 font-semibold text-[#122A24]">{s.full_name}</td>
                          <td className="py-2 px-3.5">{s.class_name} ({s.section || 'A'})</td>
                          <td className="py-2 px-3.5 text-[#2D5A4E]">{s.gender || 'Female'}</td>
                          <td className="py-2 px-3.5">
                            <span className="font-semibold text-[#1C443A]">
                              {isRTE ? 'RTE / EWS' : (s.category || 'GENERAL')}
                            </span>
                          </td>
                          <td className="py-2 px-3.5">
                            {hasTransport ? (
                              <span className="text-emerald-800 font-semibold">{sAny.bus_route || 'Bus Opted'}</span>
                            ) : (
                              <span className="text-slate-400">Private</span>
                            )}
                          </td>
                          <td className="py-2 px-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                              s.fee_status === 'PAID' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {s.fee_status || 'PAID'}
                            </span>
                          </td>
                          <td className="py-2 px-3.5 text-[#2D5A4E]">
                            {s.guardian_phone || s.phone || sAny.parent_phone || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Other Standard System Exports */}
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-xs space-y-4">
            <span className="font-display font-bold text-sm text-[#122A24] block">
              Direct Institutional Dataset Exports
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => downloadDataset('fees')}
                className="p-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-left border border-[#DCE8E0] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-[#122A24] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Fee Ledger Export</span>
                  </div>
                  <div className="text-[10px] text-[#2D5A4E] mt-0.5">{invoices.length} invoices</div>
                </div>
                <Download className="w-4 h-4 text-[#1C443A]" />
              </button>

              <button
                onClick={() => downloadDataset('teachers')}
                className="p-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-left border border-[#DCE8E0] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-[#122A24] flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Staff &amp; Faculty Directory</span>
                  </div>
                  <div className="text-[10px] text-[#2D5A4E] mt-0.5">{teachers.length} faculty records</div>
                </div>
                <Download className="w-4 h-4 text-[#1C443A]" />
              </button>

              <button
                onClick={() => downloadDataset('attendance')}
                className="p-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-left border border-[#DCE8E0] transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-[#122A24] flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Attendance Session Logs</span>
                  </div>
                  <div className="text-[10px] text-[#2D5A4E] mt-0.5">{attendance.length} session logs</div>
                </div>
                <Download className="w-4 h-4 text-[#1C443A]" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BULK DATA UPLOAD & INGESTION STUDIO
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Upload Category Selector */}
          <div className="bg-white rounded-3xl p-6 border border-[#DCE8E0] shadow-xs space-y-4">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Select Dataset Category to Import
              </h2>
              <p className="text-xs text-[#2D5A4E] mt-0.5">
                Choose the module for bulk CSV/Excel import and download verified CBSE sample template formats
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'students', label: 'Students Roster', icon: Users, count: `${students.length} Active` },
                { id: 'teachers', label: 'Faculty Directory', icon: GraduationCap, count: `${teachers.length} Teachers` },
                { id: 'fees', label: 'Fee Invoices', icon: CreditCard, count: `${invoices.length} Invoices` },
                { id: 'attendance', label: 'Attendance Logs', icon: CalendarCheck, count: `${attendance.length} Sessions` }
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedUploadCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedUploadCategory(cat.id as ImportCategory);
                      setUploadedFile(null);
                      setParsedRows([]);
                      setImportResult(null);
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                        : 'bg-[#F4F8F5] text-[#122A24] border-[#DCE8E0] hover:bg-[#EBF5EF]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-300' : 'text-[#1C443A]'}`} />
                    <div className="font-bold text-xs">{cat.label}</div>
                    <div className={`text-[10.5px] mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-[#2D5A4E]'}`}>
                      {cat.count}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload Drop Area & Template Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE8E0] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA]">
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24] uppercase tracking-tight flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-700" />
                  <span>Upload {selectedUploadCategory.toUpperCase()} CSV / EXCEL</span>
                </h3>
                <p className="text-xs text-[#2D5A4E] mt-0.5">
                  Select your `.csv` file. Our parser will validate column mappings and preview records before saving.
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadSampleTemplate(selectedUploadCategory)}
                className="px-4 py-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-[#1C443A]" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* Drag & Drop Input Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#C5E2CF] hover:border-emerald-700 bg-[#F9FCFA] hover:bg-[#F0FDF4] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <div className="font-display font-bold text-sm sm:text-base text-[#122A24]">
                  {uploadedFile ? uploadedFile.name : `Click to browse or drag and drop ${selectedUploadCategory} file`}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: Standard CSV with UTF-8 encoding
                </p>
              </div>

              {uploadedFile && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>{parsedRows.length} Rows Ready for Ingestion</span>
                </div>
              )}
            </div>

            {/* Ingestion Progress Bar */}
            {isImporting && (
              <div className="space-y-2 p-4 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0]">
                <div className="flex items-center justify-between text-xs font-bold text-[#122A24]">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    <span>Committing {parsedRows.length} records into database...</span>
                  </span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#122A24] h-full transition-all duration-200 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Feedback Banner */}
            {importResult && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                importResult.failCount === 0
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  : 'bg-amber-50 text-amber-950 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{importResult.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setParsedRows([]);
                    setImportResult(null);
                  }}
                  className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-100"
                >
                  Upload Another File
                </button>
              </div>
            )}

            {/* Staging Data Preview Table */}
            {parsedRows.length > 0 && !importResult && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-700" />
                    <span className="font-display font-bold text-xs text-[#122A24]">
                      Parsed Data Staging Preview ({parsedRows.length} Rows)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setParsedRows([]);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Clear / Discard
                    </button>

                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={handleCommitImport}
                      className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-none shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isImporting ? 'Importing...' : `Commit & Save ${parsedRows.length} Records to Database`}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[360px] rounded-2xl border border-[#DCE8E0]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead className="bg-[#F4F8F5] text-[#122A24] sticky top-0 z-10 border-b border-[#DCE8E0] font-bold text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        {parsedHeaders.slice(0, 7).map(h => (
                          <th key={h} className="py-2.5 px-3">{h.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8F0EA]">
                      {parsedRows.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FCFA]">
                          <td className="py-2 px-3 font-bold text-[#2D5A4E]">{idx + 1}</td>
                          {parsedHeaders.slice(0, 7).map(h => (
                            <td key={h} className="py-2 px-3 font-medium text-[#122A24]">
                              {row[h] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 20 && (
                  <div className="text-[11px] text-slate-500 font-mono text-center">
                    Showing first 20 rows of {parsedRows.length} parsed items. All rows will be imported on commit.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL CBSE INSTITUTIONAL PRINTABLE REPORT MODAL
          ───────────────────────────────────────────────────────────── */}
      {activeReportModal && (
        <InstitutionalReportModal
          isOpen={activeReportModal.isOpen}
          onClose={() => setActiveReportModal(null)}
          school={selectedSchool || null}
          session={selectedSession || '2026-27'}
          reportTitle={activeReportModal.title}
          reportSubtitle={activeReportModal.subtitle}
          filterSummary={activeReportModal.filterSummary}
          statsSummary={activeReportModal.statsSummary}
          columns={activeReportModal.columns}
          data={activeReportModal.data}
          onDownloadCSV={activeReportModal.onDownloadCSV}
        />
      )}

    </div>
  );
}
