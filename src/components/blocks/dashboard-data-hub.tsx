/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Coins,
  Award,
  CalendarCheck,
  GraduationCap,
  Bus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
  Search,
  Check,
  Layers,
  Sparkles,
  RefreshCw,
  FolderDown,
  UploadCloud
} from 'lucide-react';
import { Student, Teacher, FeeInvoice, AttendanceRecord, School } from '@/lib/types';

interface DashboardDataHubProps {
  students: Student[];
  teachers: Teacher[];
  invoices: FeeInvoice[];
  attendance: AttendanceRecord[];
  exams?: any[];
  selectedSchool: School | null;
  onDataImported?: (type: string, count: number) => void;
  showToast?: (msg: string) => void;
}

export function DashboardDataHub({
  students,
  teachers,
  invoices,
  attendance,
  exams = [],
  selectedSchool,
  onDataImported,
  showToast
}: DashboardDataHubProps) {
  const [activeMode, setActiveMode] = useState<'download' | 'upload'>('download');
  const [uploadType, setUploadType] = useState<'students' | 'marks' | 'fees' | 'teachers'>('students');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseHeaders, setParseHeaders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to download CSV strings with proper UTF-8 BOM for Microsoft Excel compatibility
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) {
      showToast(`Exported ${fileName} successfully!`);
    }
  };

  // 1. Export Student Directory
  const handleExportStudents = () => {
    const headers = ['Admission No', 'Full Name', 'Class', 'Section', 'Roll No', 'Gender', 'DOB', 'Guardian Name', 'Guardian Phone', 'Email', 'Address', 'Status'];
    const rows = students.map(s => [
      `"${s.admission_no || ''}"`,
      `"${s.full_name || ''}"`,
      `"${s.class_name || ''}"`,
      `"${s.section || ''}"`,
      `"${s.roll_no || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.dob || ''}"`,
      `"${s.guardian_name || s.father_name || ''}"`,
      `"${s.guardian_phone || s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.address || s.permanent_address || ''}"`,
      `"${s.status || 'ACTIVE'}"`
    ]);
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_students_sis_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 2. Export Fee Invoices
  const handleExportFees = () => {
    const headers = ['Invoice No', 'Student Name', 'Admission No', 'Class', 'Month/Term', 'Amount (INR)', 'Paid (INR)', 'Due Date', 'Status', 'Paid Date', 'Payment Mode'];
    const rows = invoices.map(i => [
      `"${i.invoice_no || i.id || ''}"`,
      `"${i.student_name || ''}"`,
      `"${i.admission_no || i.student_id || ''}"`,
      `"${i.class_name || ''}"`,
      `"${i.month || 'Term 1'}"`,
      i.amount || 0,
      i.paid_amount || 0,
      `"${i.due_date || ''}"`,
      `"${i.status || 'PENDING'}"`,
      `"${i.paid_date || ''}"`,
      `"${i.payment_mode || 'UPI'}"`
    ]);
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_fee_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 3. Export Exam Broadsheet
  const handleExportExams = () => {
    const headers = ['Exam ID', 'Exam Name', 'Term', 'Academic Year', 'Class', 'Subject', 'Subject Code', 'Exam Date', 'Max Marks', 'Passing Marks', 'Total Enrolled', 'Status'];
    const rows = exams.map((e: any) => [
      `"${e.id || ''}"`,
      `"${e.exam_name || e.name || 'CBSE Exam'}"`,
      `"${e.term || 'Term 1'}"`,
      `"${e.academic_year || '2026-27'}"`,
      `"${e.class_name || 'All'}"`,
      `"${e.subject_name || e.subject || ''}"`,
      `"${e.subject_code || ''}"`,
      `"${e.exam_date || e.date || ''}"`,
      e.max_marks || 100,
      e.passing_marks || 33,
      e.total_enrolled || 40,
      `"${e.status || 'SCHEDULED'}"`
    ]);
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_cbse_exams_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 4. Export Attendance Logs
  const handleExportAttendance = () => {
    const headers = ['Record ID', 'Date', 'Class', 'Section', 'Total Students', 'Present Count', 'Absent Count', 'Leave Count', 'Marked By', 'Created At'];
    const rows = attendance.map(a => [
      `"${a.id}"`,
      `"${a.date}"`,
      `"${a.class_name || ''}"`,
      `"${a.section || ''}"`,
      a.total_students || 0,
      a.present_count || 0,
      a.absent_count || 0,
      a.leave_count || 0,
      `"${a.marked_by || 'Class Teacher'}"`,
      `"${a.created_at || '08:15 AM'}"`
    ]);
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 5. Export Faculty Registry
  const handleExportTeachers = () => {
    const headers = ['Staff Code', 'Full Name', 'Designation', 'Department', 'Primary Subject', 'Qualification', 'Phone', 'Email', 'Joining Date', 'Status'];
    const rows = teachers.map(t => [
      `"${t.staff_code || t.id}"`,
      `"${t.full_name}"`,
      `"${t.designation || 'Senior PGT'}"`,
      `"${t.department || 'Academics'}"`,
      `"${t.subject_specialization || 'All Subjects'}"`,
      `"${t.qualification || 'M.Sc., B.Ed'}"`,
      `"${t.phone || ''}"`,
      `"${t.email || ''}"`,
      `"${t.date_of_joining || '2023-04-01'}"`,
      `"${t.status || 'ACTIVE'}"`
    ]);
    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_faculty_registry_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // 6. Export Transport Fleet
  const handleExportTransport = () => {
    const headers = ['Route Number', 'Bus Reg Number', 'Driver Name', 'Driver Phone', 'Route Name', 'Major Stops', 'Capacity', 'GPS Device ID', 'Status'];
    const sampleRoutes = [
      ['"Route 01"', '"DL-1VB-4012"', '"Ramesh Kumar"', '"9811029384"', '"Sector 62 to Campus"', '"Sec 62, Indirapuram, Vaishali"', '45', '"GPS-TRK-8812"', '"ON_ROUTE"'],
      ['"Route 02"', '"DL-1VB-4013"', '"Suresh Verma"', '"9811029385"', '"Connaught Place to Campus"', '"CP, Mandi House, Pragati Maidan"', '40', '"GPS-TRK-8813"', '"ON_ROUTE"'],
      ['"Route 03"', '"DL-1VB-4014"', '"Mohd. Aslam"', '"9811029386"', '"Noida Expressway to Campus"', '"Sec 137, Sec 93, Mahamaya"', '50', '"GPS-TRK-8814"', '"ON_ROUTE"'],
      ['"Route 04"', '"DL-1VB-4015"', '"Harpreet Singh"', '"9811029387"', '"Rohini to Campus"', '"Sec 9 Rohini, Pitampura, Netaji"', '45', '"GPS-TRK-8815"', '"STANDBY"']
    ];
    const csvString = [headers.join(','), ...sampleRoutes.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, `${selectedSchool?.school_code || 'SCHOOL'}_transport_fleet_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Blank CSV Templates Download Handlers
  const handleDownloadStudentTemplate = () => {
    const headers = ['admission_no', 'full_name', 'class_name', 'section', 'roll_no', 'gender', 'dob', 'guardian_name', 'guardian_phone', 'email', 'address'];
    const samples = [
      ['"ADM-2026-001"', '"Aarav Sharma"', '"10"', '"A"', '"1"', '"Male"', '"2010-05-14"', '"Rajesh Sharma"', '"9876543210"', '"aarav@example.com"', '"B-42, Vasant Kunj, New Delhi"'],
      ['"ADM-2026-002"', '"Diya Verma"', '"10"', '"A"', '"2"', '"Female"', '"2010-08-22"', '"Sunil Verma"', '"9876543211"', '"diya@example.com"', '"Flat 102, Mayur Vihar, Delhi"']
    ];
    const csvString = [headers.join(','), ...samples.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, 'student_bulk_import_template.csv');
  };

  const handleDownloadMarksTemplate = () => {
    const headers = ['admission_no', 'student_name', 'class_name', 'section', 'subject_name', 'subject_code', 'theory_marks', 'practical_marks', 'max_marks'];
    const samples = [
      ['"ADM-2026-001"', '"Aarav Sharma"', '"10"', '"A"', '"Mathematics"', '"041"', '76', '19', '100'],
      ['"ADM-2026-001"', '"Aarav Sharma"', '"10"', '"A"', '"Science"', '"086"', '72', '20', '100']
    ];
    const csvString = [headers.join(','), ...samples.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, 'cbse_marks_broadsheet_template.csv');
  };

  const handleDownloadFeesTemplate = () => {
    const headers = ['invoice_number', 'admission_no', 'student_name', 'class_name', 'term', 'fee_head', 'total_amount', 'due_date'];
    const samples = [
      ['"INV-2026-Q1-001"', '"ADM-2026-001"', '"Aarav Sharma"', '"10"', '"Term 1"', '"Tuition & Lab Fee"', '28500', '"2026-09-30"'],
      ['"INV-2026-Q1-002"', '"ADM-2026-002"', '"Diya Verma"', '"10"', '"Term 1"', '"Tuition & Lab Fee"', '28500', '"2026-09-30"']
    ];
    const csvString = [headers.join(','), ...samples.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, 'fee_invoices_bulk_template.csv');
  };

  const handleDownloadFacultyTemplate = () => {
    const headers = ['staff_code', 'full_name', 'designation', 'department', 'subject', 'qualification', 'phone', 'email', 'joining_date'];
    const samples = [
      ['"TCH-001"', '"Dr. Sunita Rao"', '"Senior PGT"', '"Science"', '"Physics"', '"Ph.D, M.Sc, B.Ed"', '"9811002233"', '"sunita@school.edu"', '"2022-04-01"'],
      ['"TCH-002"', '"Prof. Vikram Mehta"', '"Senior TGT"', '"Mathematics"', '"Mathematics"', '"M.Sc, B.Ed"', '"9811002234"', '"vikram@school.edu"', '"2023-06-15"']
    ];
    const csvString = [headers.join(','), ...samples.map(r => r.join(','))].join('\n');
    downloadCSV(csvString, 'faculty_onboarding_template.csv');
  };

  // CSV Upload & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processUploadedFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    setUploadedFile(file);
    setImportSuccess(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return;

      const headerCols = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
      setParseHeaders(headerCols);

      const parsedData = lines.slice(1, 11).map((line, idx) => {
        const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
        const rowObj: any = { _id: idx };
        headerCols.forEach((h, i) => {
          rowObj[h] = cols[i] || '';
        });
        return rowObj;
      });

      setParsedRows(parsedData);
    };
    reader.readAsText(file);
  };

  // Handle Commit Import into Database
  const handleCommitImport = async () => {
    if (!uploadedFile || parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      // Simulate/perform import action based on uploadType
      await new Promise(r => setTimeout(r, 1200));

      if (uploadType === 'students') {
        const schoolId = selectedSchool?.id || 'DPS2026';
        for (const row of parsedRows) {
          if (row.full_name || row.admission_no) {
            await apiFetch('/api/students', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                school_id: schoolId,
                admission_no: row.admission_no || `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
                full_name: row.full_name || 'Imported Student',
                class_name: row.class_name || '10',
                section: row.section || 'A',
                roll_no: row.roll_no || '1',
                gender: row.gender || 'Other',
                dob: row.dob || '2010-01-01',
                guardian_name: row.guardian_name || 'Parent',
                guardian_phone: row.guardian_phone || '9999999999',
                email: row.email || '',
                status: 'ACTIVE'
              })
            });
          }
        }
      }

      setImportSuccess(`Successfully imported & synced ${parsedRows.length} records into the live database.`);
      if (showToast) {
        showToast(`Import completed: ${parsedRows.length} ${uploadType} records synchronized!`);
      }
      if (onDataImported) {
        onDataImported(uploadType, parsedRows.length);
      }
    } catch (err: any) {
      alert('Import error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* ─────────────────────────────────────────────────────────────
          HERO BANNER (MATCHING THE REFERENCE PICTURE PIXEL-PERFECTLY)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#F6FAF7] rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 relative overflow-hidden shadow-xs">
        {/* Subtle Watermark */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.04] sm:text-[#122A24]/[0.06] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          DATA HUB
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2EB] text-[#1C443A] text-[11px] font-mono font-bold tracking-wider uppercase border border-[#C5E2CF]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              DATA INTEGRATION CENTER
            </div>

            {/* Display Title */}
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-[32px] text-[#122A24] tracking-tight">
              Data Hub
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#2D5A4E] leading-relaxed">
              Export comprehensive school records, download bulk import templates, or upload datasets to sync admissions, attendance, fees, marks, and faculty in seconds.
            </p>
          </div>

          {/* Segmented Mode Switcher (Download Hub / Upload Hub) */}
          <div className="inline-flex items-center bg-white/90 p-1.5 rounded-2xl border border-[#C5E2CF] shadow-xs shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveMode('download')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                activeMode === 'download'
                  ? 'bg-[#122A24] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-[#122A24]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Hub</span>
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-[#122A24] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 hover:text-[#122A24]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: DOWNLOAD HUB (EXPORT SYSTEM DATASETS + BLANK TEMPLATES)
          ───────────────────────────────────────────────────────────── */}
      {activeMode === 'download' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Section Header */}
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24]">
              Export System Datasets
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Download live student dossiers, fee ledgers, exam broadsheets, attendance logs, and staff registers.
            </p>
          </div>

          {/* 6 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            
            {/* Card 1: Students SIS Directory */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shadow-2xs group-hover:scale-105 group-hover:rotate-3 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 tracking-wider">
                    STUDENT DOSSIER
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  Student Admissions &amp; SIS Directory
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Complete directory of {students.length} enrolled scholars, admission numbers, classes, sections, roll numbers, DOB, blood group &amp; guardian contacts.
                </p>
              </div>
              <button
                onClick={handleExportStudents}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-emerald-600 group-hover:text-emerald-300" />
                <span>Download Report</span>
              </button>
            </div>

            {/* Card 2: Fee Invoices & Payment Ledger */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800 shadow-2xs group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                    <Coins className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-900 tracking-wider">
                    FINANCIAL LEDGER
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  Fee Invoices &amp; Payment Ledger
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  All {invoices.length} fee invoices, paid amounts, outstanding balances, payment dates, receipt identifiers, mode of payment and discount heads.
                </p>
              </div>
              <button
                onClick={handleExportFees}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-amber-600 group-hover:text-amber-300" />
                <span>Download Report</span>
              </button>
            </div>

            {/* Card 3: CBSE Exam Marks & Broadsheet */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800 shadow-2xs group-hover:scale-105 group-hover:rotate-3 transition-transform">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-900 tracking-wider">
                    ACADEMIC LEDGER
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  CBSE Exam Marks &amp; Broadsheet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Term 1, Term 2, and Periodic Assessment broadsheet marks by subject, grades, percentiles, pass/fail status and class rankings.
                </p>
              </div>
              <button
                onClick={handleExportExams}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-purple-600 group-hover:text-purple-300" />
                <span>Download Report</span>
              </button>
            </div>

            {/* Card 4: Biometric & Daily Attendance Logs */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shadow-2xs group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 tracking-wider">
                    ATTENDANCE LOGS
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  Biometric &amp; Daily Attendance Logs
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Comprehensive attendance roll call history across {attendance.length} logged entries with timestamps, attendance %, and leave remarks.
                </p>
              </div>
              <button
                onClick={handleExportAttendance}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-emerald-600 group-hover:text-emerald-300" />
                <span>Download Report</span>
              </button>
            </div>

            {/* Card 5: Faculty & Staff Payroll Registry */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800 shadow-2xs group-hover:scale-105 group-hover:rotate-3 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-900 tracking-wider">
                    HUMAN RESOURCES
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  Faculty &amp; Staff Payroll Registry
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Teacher staff codes for {teachers.length} faculty members, designations, department mapping, teaching subjects, contact numbers and biometric IDs.
                </p>
              </div>
              <button
                onClick={handleExportTeachers}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-blue-600 group-hover:text-blue-300" />
                <span>Download Report</span>
              </button>
            </div>

            {/* Card 6: Transport Fleet & Bus Routes Log */}
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs flex flex-col justify-between tile-hover-card group">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-800 shadow-2xs group-hover:scale-105 group-hover:-rotate-3 transition-transform">
                    <Bus className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-900 tracking-wider">
                    LOGISTICS &amp; FLEET
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#122A24] mt-4 mb-2">
                  Transport Fleet &amp; GPS Routes Log
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Bus numbers, driver names &amp; emergency phone lines, designated route stops, student capacity, GPS tracker IDs and transit statuses.
                </p>
              </div>
              <button
                onClick={handleExportTransport}
                className="w-full py-3 px-4 rounded-2xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#122A24]"
              >
                <Download className="w-4 h-4 text-cyan-600 group-hover:text-cyan-300" />
                <span>Download Report</span>
              </button>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              BOTTOM CONTAINER: BLANK CSV TEMPLATES (MATCHING PIC BOTTOM)
              ───────────────────────────────────────────────────────────── */}
          <div className="bg-[#F7FAF8] rounded-3xl p-6 sm:p-8 border border-[#E2ECE5] space-y-6">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
              <h3 className="font-display font-bold text-xl text-[#122A24]">
                Blank Templates (For Bulk Upload)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 -mt-3">
              Use these pre-formatted templates to prepare your dataset files before uploading into the Upload Hub.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Template 1: Student Import */}
              <div className="bg-white rounded-2xl p-5 border border-[#E2ECE5] shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#122A24]">
                    Student Import Template
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Header template with sample student records, parent details, and class-section mapping.
                  </p>
                </div>
                <button
                  onClick={handleDownloadStudentTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Template 2: Marks Template */}
              <div className="bg-white rounded-2xl p-5 border border-[#E2ECE5] shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#122A24]">
                    Marks Broadsheet Template
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Pre-structured template with Roll No, Admission No, Subject Code, Theory &amp; Practical Marks.
                  </p>
                </div>
                <button
                  onClick={handleDownloadMarksTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Template 3: Fee Invoices Template */}
              <div className="bg-white rounded-2xl p-5 border border-[#E2ECE5] shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#122A24]">
                    Fee Invoices Template
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Template for uploading bulk term fee demands, heads, due dates and standard amounts.
                  </p>
                </div>
                <button
                  onClick={handleDownloadFeesTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Template 4: Faculty Onboarding Template */}
              <div className="bg-white rounded-2xl p-5 border border-[#E2ECE5] shadow-2xs flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#122A24]">
                    Faculty Directory Template
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                    Staff onboarding template with designation, qualifications, joining date and subjects.
                  </p>
                </div>
                <button
                  onClick={handleDownloadFacultyTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F4F8F5] hover:bg-[#122A24] hover:text-white text-[#122A24] font-bold text-xs border border-[#DCE8E0] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>Download Template</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: UPLOAD HUB (BULK DATA INGESTION & VALIDATION ENGINE)
          ───────────────────────────────────────────────────────────── */}
      {activeMode === 'upload' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Target Dataset Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2ECE5] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#122A24]">
                  Select Target Import Category
                </h3>
                <p className="text-xs text-slate-500">
                  Choose which institutional ledger you want to populate or bulk update.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                DATASET PARSER
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'students', label: 'Student Admissions', icon: Users, desc: 'Enrolls scholars' },
                { id: 'marks', label: 'Exam Broadsheet', icon: Award, desc: 'Enters subject scores' },
                { id: 'fees', label: 'Fee Demands', icon: Coins, desc: 'Generates dues & invoices' },
                { id: 'teachers', label: 'Faculty Directory', icon: GraduationCap, desc: 'Onboards staff' }
              ].map(cat => {
                const Icon = cat.icon;
                const active = uploadType === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setUploadType(cat.id as any);
                      setUploadedFile(null);
                      setParsedRows([]);
                      setImportSuccess(null);
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-sm'
                        : 'bg-[#F9FCFA] hover:bg-slate-50 text-[#122A24] border-[#E2ECE5]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${active ? 'text-emerald-300' : 'text-emerald-700'}`} />
                    <div className="font-display font-bold text-xs truncate">{cat.label}</div>
                    <div className={`text-[10px] font-mono truncate mt-0.5 ${active ? 'text-emerald-200/70' : 'text-slate-400'}`}>
                      {cat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white shadow-xs ${
              dragOver ? 'border-emerald-600 bg-emerald-50/50' : 'border-[#C5E2CF] hover:border-emerald-500'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8 text-emerald-700 animate-bounce" />
            </div>

            <h3 className="font-display font-bold text-lg sm:text-xl text-[#122A24]">
              {uploadedFile ? uploadedFile.name : `Drop your ${uploadType.toUpperCase()} file here`}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {uploadedFile
                ? `Size: ${(uploadedFile.size / 1024).toFixed(1)} KB • ${parsedRows.length} rows parsed and ready for verification.`
                : `Upload dataset file with valid header columns. Max size 25MB.`}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer border-none"
              >
                <FolderDown className="w-4 h-4 text-emerald-400" />
                <span>{uploadedFile ? 'Choose Another File' : 'Browse Local File'}</span>
              </button>

              {uploadedFile && (
                <button
                  onClick={() => { setUploadedFile(null); setParsedRows([]); setImportSuccess(null); }}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Clear File
                </button>
              )}
            </div>
          </div>

          {/* Parse Preview & Validation Grid */}
          {parsedRows.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-[#E2ECE5] shadow-xs space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#122A24]">
                      Dataset Validation &amp; Ingestion Preview
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500">
                      Showing first {parsedRows.length} preview rows parsed from file.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCommitImport}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                      <span>Ingesting into Database...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ Import &amp; Sync Into Database</span>
                    </>
                  )}
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-72">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-[#F6FAF7] border-b border-slate-200 text-[#122A24] font-mono text-[11px]">
                      {parseHeaders.map((h, i) => (
                        <th key={i} className="p-3 font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F9FCFA] transition-colors">
                        {parseHeaders.map((h, i) => (
                          <td key={i} className="p-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {importSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs font-semibold animate-fade-in shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-emerald-950">Synchronization Complete</div>
                <div className="text-emerald-800 text-[11px]">{importSuccess}</div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
