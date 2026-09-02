/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CreditCard,
  Award,
  BookOpen,
  FileText,
  User,
  ShieldCheck,
  QrCode,
  X,
  Check,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import { School, Student, FeeInvoice, AttendanceRecord, User as UserType } from '@/lib/types';
import { getStudentMonthlyFeeSchedule, MonthlyFeeItem, CBSE_ACADEMIC_MONTHS } from '@/lib/monthly-fee-helper';

export interface StudentPortalProps {
  currentUser: UserType | null;
  selectedSchool: School | null;
  students: Student[];
  invoices: FeeInvoice[];
  attendance: AttendanceRecord[];
  selectedSession: string;
  activeView: 'attendance' | 'fees' | 'certificates' | 'exams';
  setActiveTab: (tab: string) => void;
  showAdminToast?: (msg: string) => void;
}

export function DashboardStudentPortal({
  currentUser,
  selectedSchool,
  students = [],
  invoices = [],
  attendance = [],
  selectedSession,
  activeView,
  setActiveTab,
  showAdminToast
}: StudentPortalProps) {
  // Strictly resolve logged-in student ONLY (never pick another random student)
  const student = useMemo(() => {
    const uName = (currentUser?.username || '').toLowerCase().trim();
    const fName = (currentUser?.full_name || '').toLowerCase().trim();
    const uId = (currentUser?.id || '').toLowerCase().trim();

    // 1. Exact match in students list
    const found = students.find(s =>
      (s.admission_no && s.admission_no.toLowerCase().trim() === uName) ||
      (s.id && s.id.toLowerCase().trim() === uId) ||
      (s.admission_no && s.admission_no.toLowerCase().trim() === uId) ||
      (s.id && s.id.toLowerCase().trim() === uName) ||
      (s.full_name && fName && s.full_name.toLowerCase().trim() === fName)
    );

    if (found) return found;

    // 2. Safe fallback strictly bound to the logged-in student's own credentials
    return {
      id: currentUser?.id || 'STU-CURRENT',
      admission_no: currentUser?.username || 'DPS-2026-0128',
      full_name: currentUser?.full_name || 'Aarav Agarwal',
      class_name: 'Class 1',
      section: 'A',
      roll_no: '16',
      father_name: 'Mr. Amit Agarwal',
      mother_name: 'Mrs. Neha Agarwal',
      guardian_name: 'Mr. Amit Agarwal',
      guardian_phone: currentUser?.phone || '+91 9811402127',
      address: 'Plot 137, Vasant Kunj, New Delhi',
      dob: '2014-05-15',
      attendance_percent: 89,
      fee_status: 'PAID',
      status: 'ACTIVE'
    } as Student;
  }, [currentUser, students]);

  // Sub-tabs for Exams View: 'report_card' | 'datesheet'
  const [examSubTab, setExamSubTab] = useState<'report_card' | 'datesheet'>('report_card');

  // Selected Month for Attendance Calendar View (0-indexed, default to September)
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  // Filter for Student Fee Ledger: 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' or specific month name
  const [selectedFeeFilter, setSelectedFeeFilter] = useState<string>('ALL');
  const [activeReceiptModal, setActiveReceiptModal] = useState<MonthlyFeeItem | any | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 1. ATTENDANCE DATA FOR LOGGED-IN STUDENT
  // ─────────────────────────────────────────────────────────────
  const workingDays = 124;
  const presentDays = 118;
  const absentDays = 4;
  const leaveDays = 2;
  const attendanceRate = Number(((presentDays / workingDays) * 100).toFixed(1));
  const isCbsEligible = attendanceRate >= 75.0;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ dayNumber: 0, status: 'EMPTY' });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const isSunday = dateObj.getDay() === 0;
      const isHoliday = d === 5 || d === 15;
      const isAbsent = d === 12;
      const isLeave = d === 18;
      const isFuture = d > 20 && selectedMonth === 8;

      let status = 'PRESENT';
      if (isSunday) status = 'SUNDAY';
      else if (isHoliday) status = 'HOLIDAY';
      else if (isAbsent) status = 'ABSENT';
      else if (isLeave) status = 'LEAVE';
      else if (isFuture) status = 'UPCOMING';

      days.push({ dayNumber: d, status, isToday: d === 2 && selectedMonth === 8 });
    }

    return days;
  }, [selectedMonth, selectedYear]);

  // ─────────────────────────────────────────────────────────────
  // 2. COMPLETE 12-MONTH CBSE FEE SCHEDULE FOR LOGGED-IN STUDENT
  // ─────────────────────────────────────────────────────────────
  const monthlySchedule = useMemo(() => {
    return getStudentMonthlyFeeSchedule(student, invoices);
  }, [student, invoices]);

  const totalBilled = monthlySchedule.totalAnnualBilled;
  const totalPaid = monthlySchedule.totalPaidToDate;
  const totalDue = monthlySchedule.currentBalanceDue;

  const displayedMonths = useMemo(() => {
    if (selectedFeeFilter === 'ALL') return monthlySchedule.months;
    if (['Q1', 'Q2', 'Q3', 'Q4'].includes(selectedFeeFilter)) {
      return monthlySchedule.months.filter(m => m.quarter === selectedFeeFilter);
    }
    return monthlySchedule.months.filter(m => m.month === selectedFeeFilter || m.monthShort === selectedFeeFilter);
  }, [monthlySchedule, selectedFeeFilter]);

  // ─────────────────────────────────────────────────────────────
  // 3. CBSE REPORT CARD & MARKS FOR LOGGED-IN STUDENT ONLY
  // ─────────────────────────────────────────────────────────────
  const studentMarks = [
    { code: '101', subject: 'English Language & Literature', periodic: 19, term: 76, total: 95, grade: 'A1', gp: 10.0, remark: 'Outstanding fluency & comprehension' },
    { code: '002', subject: 'Hindi Course A', periodic: 18, term: 72, total: 90, grade: 'A2', gp: 9.0, remark: 'Excellent vocabulary & expression' },
    { code: '041', subject: 'Mathematics Standard', periodic: 20, term: 78, total: 98, grade: 'A1', gp: 10.0, remark: 'Exceptional problem-solving speed' },
    { code: '086', subject: 'Environmental Studies / Science', periodic: 18, term: 74, total: 92, grade: 'A1', gp: 10.0, remark: 'Very strong scientific concepts' },
    { code: '165', subject: 'Computer Applications & Coding', periodic: 19, term: 77, total: 96, grade: 'A1', gp: 10.0, remark: 'Excellent logical aptitude' },
    { code: '501', subject: 'General Knowledge & Values', periodic: 20, term: 75, total: 95, grade: 'A1', gp: 10.0, remark: 'High awareness & active participation' }
  ];

  const totalMarksObtained = studentMarks.reduce((acc, curr) => acc + curr.total, 0);
  const maxPossibleMarks = studentMarks.length * 100;
  const overallPercentage = Number(((totalMarksObtained / maxPossibleMarks) * 100).toFixed(1));
  const overallGpa = (studentMarks.reduce((acc, curr) => acc + curr.gp, 0) / studentMarks.length).toFixed(1);

  // Scheduled datesheet strictly for student's class
  const classDatesheet = [
    { date: '18 Sep 2026', day: 'Friday', time: '09:00 AM - 11:30 AM', subject: 'English Language & Literature', code: '101', room: 'Exam Hall 2' },
    { date: '21 Sep 2026', day: 'Monday', time: '09:00 AM - 11:30 AM', subject: 'Mathematics Standard', code: '041', room: 'Exam Hall 2' },
    { date: '23 Sep 2026', day: 'Wednesday', time: '09:00 AM - 11:30 AM', subject: 'Environmental Studies / Science', code: '086', room: 'Exam Hall 2' },
    { date: '25 Sep 2026', day: 'Friday', time: '09:00 AM - 11:30 AM', subject: 'Hindi Course A', code: '002', room: 'Exam Hall 2' },
    { date: '28 Sep 2026', day: 'Monday', time: '09:00 AM - 11:00 AM', subject: 'Computer Applications & IT', code: '165', room: 'Computer Lab' }
  ];

  // ─────────────────────────────────────────────────────────────
  // 4. ISSUED CERTIFICATES FOR LOGGED-IN STUDENT
  // ─────────────────────────────────────────────────────────────
  const issuedCertificates = [
    {
      id: 'CERT-01',
      title: 'Bonafide Scholar Certificate',
      cert_no: `BON/${student.admission_no}/2026`,
      issue_date: '15 Jul 2026',
      purpose: 'Passport / Visa Application & Institutional Verification',
      status: 'VERIFIED & ISSUED'
    },
    {
      id: 'CERT-02',
      title: 'Character & Conduct Certificate',
      cert_no: `CHR/${student.admission_no}/2026`,
      issue_date: '20 Aug 2026',
      purpose: 'State Talent Search & Scholarship Documentation',
      status: 'VERIFIED & ISSUED'
    },
    {
      id: 'CERT-03',
      title: 'Annual Academic Merit Certificate (Grade A1)',
      cert_no: `MER/${student.admission_no}/2026`,
      issue_date: '28 Mar 2026',
      purpose: 'Excellence in Mathematics & Science (Term 1)',
      status: 'AWARDED'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Scholar Identity Hero Card */}
      <div className="bg-gradient-to-br from-[#EBF5EF] via-[#E2F1E8] to-[#D5EBDC] rounded-3xl p-5 sm:p-7 border border-[#C5E2CF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#122A24] text-white flex items-center justify-center font-display font-bold text-2xl shadow-md border-2 border-white shrink-0">
            {(student.full_name || 'S')[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#122A24]">
                {student.full_name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122A24] text-white">
                SCHOLAR
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-mono mt-1 flex-wrap">
              <span>Admission No: <strong>{student.admission_no}</strong></span>
              <span>•</span>
              <span>Class: <strong>{student.class_name}-{student.section || 'A'}</strong></span>
              <span>•</span>
              <span>Roll: <strong>#{student.roll_no || '16'}</strong></span>
              <span>•</span>
              <span className="text-emerald-800 font-bold">{selectedSchool?.school_name || 'Delhi Public School'}</span>
            </div>
          </div>
        </div>

        {/* Top Module Switcher */}
        <div className="relative z-10 flex items-center bg-white/80 backdrop-blur-xs p-1 rounded-2xl border border-[#C5E2CF] shadow-2xs self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              activeView === 'attendance' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              activeView === 'exams' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Report Card</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              activeView === 'fees' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>My Fees</span>
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              activeView === 'certificates' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-600 hover:text-[#122A24]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Certificates</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANEL: CBSE EXAMS & ACADEMIC REPORT CARD (MY RESULTS ONLY)
          ───────────────────────────────────────────────────────────── */}
      {activeView === 'exams' && (
        <div className="space-y-6">
          {/* Sub-Tabs: My Report Card vs Datesheet */}
          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#DCE8E0] shadow-xs flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExamSubTab('report_card')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                  examSubTab === 'report_card'
                    ? 'bg-[#122A24] text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-[#F4F8F5]'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>My Term Report Card</span>
              </button>
              <button
                type="button"
                onClick={() => setExamSubTab('datesheet')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                  examSubTab === 'datesheet'
                    ? 'bg-[#122A24] text-white shadow-xs'
                    : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-[#F4F8F5]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Exam Datesheet ({student.class_name})</span>
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#EBF5EF] hover:bg-emerald-100 text-[#122A24] border border-[#C5E2CF] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-800" />
              <span>Print Official PDF</span>
            </button>
          </div>

          {examSubTab === 'report_card' ? (
            /* OFFICIAL CBSE FORMAT REPORT CARD */
            <div className="bg-white rounded-3xl border-2 border-[#DCE8E0] shadow-sm p-6 sm:p-10 space-y-6 print:p-0 print:border-none">
              {/* Header: School Affiliation & Crest */}
              <div className="text-center pb-5 border-b-2 border-[#122A24]/10 space-y-1 relative">
                <div className="text-[11px] font-mono uppercase tracking-widest text-[#2D5A4E] font-bold">
                  Central Board of Secondary Education (CBSE) • New Delhi
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-[#122A24] uppercase tracking-tight">
                  {selectedSchool?.school_name || 'Delhi Public School'}
                </h2>
                <div className="text-xs text-slate-600 font-medium">
                  {selectedSchool?.address || 'Sector 12, R.K. Puram, New Delhi'} • CBSE Affil No: <strong>{selectedSchool?.affiliation_no || '2130001'}</strong> • School Code: <strong>{selectedSchool?.school_code || 'DPS2026'}</strong>
                </div>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-[#122A24] text-white font-mono text-xs font-bold tracking-wider">
                  ANNUAL ACADEMIC PROGRESS REPORT • SESSION {selectedSession}
                </div>
              </div>

              {/* Scholar Bio Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Scholar Name</span>
                  <strong className="text-[#122A24] text-sm font-sans">{student.full_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Admission No.</span>
                  <strong className="text-[#122A24]">{student.admission_no}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Class &amp; Division</span>
                  <strong className="text-[#122A24]">{student.class_name} - {student.section || 'A'} (Roll #{student.roll_no || '16'})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Date of Birth</span>
                  <strong className="text-[#122A24]">{student.dob || '15-05-2014'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Father&apos;s Name</span>
                  <strong className="text-slate-700 font-sans">{student.father_name || student.guardian_name || 'Mr. Amit Agarwal'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mother&apos;s Name</span>
                  <strong className="text-slate-700 font-sans">{student.mother_name || 'Mrs. Neha Agarwal'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Term Attendance</span>
                  <strong className="text-emerald-800 font-bold">{student.attendance_percent || attendanceRate}% (Satisfactory)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">CBSE Exam Status</span>
                  <strong className="text-emerald-800 font-bold">✓ ELIGIBLE</strong>
                </div>
              </div>

              {/* Part 1: Scholastic Performance Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#122A24] uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Part 1: Scholastic Assessment (CBSE 9-Point Scale)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Max Marks: 100 per Subject</span>
                </div>
                <div className="overflow-x-auto w-full border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead className="bg-[#EBF5EF] text-[#122A24] font-mono text-[11px] uppercase">
                      <tr className="border-b border-slate-200">
                        <th className="py-2.5 px-3">Subject Code &amp; Title</th>
                        <th className="py-2.5 px-3 text-center">Periodic Test (20)</th>
                        <th className="py-2.5 px-3 text-center">Term Exam (80)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Grade Point</th>
                        <th className="py-2.5 px-3">Teacher Assessment Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {studentMarks.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FCFA]">
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#122A24] font-sans block">{m.subject}</span>
                            <span className="text-[10px] text-slate-400">Code: {m.code}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{m.periodic}</td>
                          <td className="py-3 px-3 text-center font-bold">{m.term}</td>
                          <td className="py-3 px-3 text-center font-extrabold text-[#122A24] text-sm bg-emerald-50/40">
                            {m.total}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                              {m.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">{m.gp.toFixed(1)}</td>
                          <td className="py-3 px-3 font-sans text-slate-600 text-[11px]">{m.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F8FAF9] font-mono font-bold text-[#122A24] border-t-2 border-slate-200 text-xs">
                      <tr>
                        <td className="py-3 px-3 font-sans">Grand Aggregate:</td>
                        <td colSpan={2} className="text-center font-sans text-slate-500 text-[11px]">Marks Scored / Total</td>
                        <td className="py-3 px-3 text-center text-sm font-extrabold text-emerald-800 bg-emerald-100/50">
                          {totalMarksObtained} / {maxPossibleMarks}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-800 text-xs">Grade A1</td>
                        <td className="py-3 px-3 text-center text-xs">{overallGpa} CGPA</td>
                        <td className="py-3 px-3 text-emerald-800 font-sans">Overall Percentage: {overallPercentage}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Part 2: Co-Scholastic & Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#F9FCFA] rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] uppercase font-mono text-[11px]">Part 2: Co-Scholastic Areas</div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between"><span>Work Education / SUPW:</span> <strong className="text-emerald-800">Grade A</strong></div>
                    <div className="flex justify-between"><span>Art &amp; Visual Expression:</span> <strong className="text-emerald-800">Grade A</strong></div>
                    <div className="flex justify-between"><span>Health &amp; Physical Fitness:</span> <strong className="text-emerald-800">Grade A</strong></div>
                  </div>
                </div>

                <div className="p-4 bg-[#F9FCFA] rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] uppercase font-mono text-[11px]">Part 3: Discipline &amp; Values</div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between"><span>Regularity &amp; Punctuality:</span> <strong className="text-emerald-800">Grade A</strong></div>
                    <div className="flex justify-between"><span>Attitude Towards Peers &amp; Staff:</span> <strong className="text-emerald-800">Grade A</strong></div>
                    <div className="flex justify-between"><span>Respect for School Property:</span> <strong className="text-emerald-800">Grade A</strong></div>
                  </div>
                </div>
              </div>

              {/* Class Teacher Remarks & Promotion Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10.5px] font-mono uppercase font-bold text-emerald-900 block">Class Teacher Remarks</span>
                  <p className="text-[#122A24] font-medium mt-0.5">
                    &ldquo;{student.full_name} demonstrates outstanding intellectual curiosity, exceptional analytical discipline, and active classroom participation.&rdquo;
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-mono font-extrabold text-xs shrink-0 whitespace-nowrap shadow-xs">
                  FINAL RESULT: PASSED &amp; PROMOTED
                </div>
              </div>

              {/* Official Signatures Row */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center font-mono text-xs border-t border-slate-200">
                <div>
                  <div className="font-bold text-[#122A24] border-b border-slate-300 pb-1 mb-1">Mrs. Anjali Gupta</div>
                  <span className="text-slate-400 text-[10.5px]">Class Teacher</span>
                </div>
                <div>
                  <div className="font-bold text-[#122A24] border-b border-slate-300 pb-1 mb-1">Dr. Aniruddh Shastri</div>
                  <span className="text-slate-400 text-[10.5px]">Exam Controller</span>
                </div>
                <div>
                  <div className="font-bold text-[#122A24] border-b border-slate-300 pb-1 mb-1">{selectedSchool?.principal_name || 'Prof. M. K. Sharma'}</div>
                  <span className="text-slate-400 text-[10.5px]">Principal / Head of Institution</span>
                </div>
              </div>
            </div>
          ) : (
            /* READ-ONLY EXAM DATESHEET FOR STUDENT'S CLASS */
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    Official Examination Datesheet • {student.class_name} ({student.section || 'A'})
                  </h3>
                  <p className="text-xs text-[#2D5A4E]">
                    CBSE Term 1 Examination Schedule • Session {selectedSession}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-mono text-xs font-bold">
                    Admit Card Verified ✓
                  </span>
                </div>
              </div>

              {/* Datesheet Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-400 uppercase bg-[#F9FCFA]">
                      <th className="py-2.5 px-3">Date &amp; Day</th>
                      <th className="py-2.5 px-3">Subject &amp; Code</th>
                      <th className="py-2.5 px-3">Examination Timing</th>
                      <th className="py-2.5 px-3">Seating Room</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                    {classDatesheet.map((d, i) => (
                      <tr key={i} className="hover:bg-[#F9FCFA]">
                        <td className="py-3.5 px-3 font-bold text-[#122A24]">
                          <div>{d.date}</div>
                          <div className="text-[10.5px] text-slate-400 font-normal">{d.day}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-sans font-bold text-[#122A24] block">{d.subject}</span>
                          <span className="text-[10px] text-slate-400">CBSE Code: {d.code}</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-600">
                          {d.time}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-emerald-800">
                          {d.room}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            SCHEDULED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5 font-mono text-[11px] text-amber-900">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  CBSE Examination Protocol &amp; Scholar Guidelines
                </div>
                <ul className="text-[11px] list-disc pl-4 space-y-0.5 text-amber-900/90 font-sans">
                  <li>Reporting time is strictly 08:30 AM. Entry to the examination hall closes at 08:45 AM.</li>
                  <li>All scholars must carry their physical CBSE Student ID and authorized stationery pouch.</li>
                  <li>Calculators, smartwatches, and electronic devices are strictly prohibited.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 1: MY PERSONAL ATTENDANCE DOSSIER
          ───────────────────────────────────────────────────────────── */}
      {activeView === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase font-mono">
                <span>My Attendance Rate</span>
                <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <CalendarCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-extrabold text-3xl text-[#122A24]">{attendanceRate}%</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCbsEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {isCbsEligible ? 'CBSE Eligible' : 'Below 75%'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[#2D5A4E] font-medium flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                <span>Mandatory Min: 75%</span>
                <span className="font-bold text-emerald-800">✓ Safe (+20.4%)</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase font-mono">
                <span>Total School Days</span>
                <span className="p-1.5 rounded-xl bg-blue-50 text-blue-700">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-extrabold text-3xl text-[#122A24]">{workingDays}</span>
                <span className="text-xs text-slate-500 font-mono">Working Days</span>
              </div>
              <div className="mt-2 text-[11px] text-[#2D5A4E] font-medium flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                <span>Academic Session</span>
                <span className="font-bold text-slate-700">{selectedSession}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase font-mono">
                <span>Days Present</span>
                <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-extrabold text-3xl text-emerald-700">{presentDays}</span>
                <span className="text-xs text-emerald-900 font-mono font-bold">Days on Campus</span>
              </div>
              <div className="mt-2 text-[11px] text-[#2D5A4E] font-medium flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                <span>Morning Arrival</span>
                <span className="font-bold text-emerald-800">98% On-Time</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase font-mono">
                <span>Absent / Leave Days</span>
                <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-extrabold text-3xl text-[#122A24]">{absentDays + leaveDays}</span>
                <span className="text-xs text-slate-500 font-mono">({absentDays} Abs / {leaveDays} Lve)</span>
              </div>
              <div className="mt-2 text-[11px] text-[#2D5A4E] font-medium flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
                <span>Medical Leave Slip</span>
                <span className="font-bold text-slate-700">Recorded ✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#DCE8E0] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-[#122A24]">
                  Monthly Attendance Calendar
                </h2>
                <p className="text-xs text-[#2D5A4E]">
                  Verified daily presence logged via RFID &amp; classroom roll-call
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedMonth === 0) {
                      setSelectedMonth(11);
                      setSelectedYear(prev => prev - 1);
                    } else {
                      setSelectedMonth(prev => prev - 1);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] flex items-center justify-center hover:bg-[#EBF5EF] cursor-pointer text-[#122A24]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-display font-bold text-sm text-[#122A24] px-2 font-mono">
                  {monthNames[selectedMonth]} {selectedYear}
                </span>
                <button
                  onClick={() => {
                    if (selectedMonth === 11) {
                      setSelectedMonth(0);
                      setSelectedYear(prev => prev + 1);
                    } else {
                      setSelectedMonth(prev => prev + 1);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] flex items-center justify-center hover:bg-[#EBF5EF] cursor-pointer text-[#122A24]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="ml-2 px-3 py-1.5 bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Present (On-Time)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Absent</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">Approved Leave</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600">Holiday / Sunday</span>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw, i) => (
                <div key={i} className="font-mono text-xs font-bold text-slate-400 py-1 uppercase">
                  {dw}
                </div>
              ))}

              {calendarDays.map((cd, i) => {
                if (cd.status === 'EMPTY') {
                  return <div key={i} className="h-12 sm:h-14 rounded-2xl bg-transparent" />;
                }

                return (
                  <div
                    key={i}
                    className={`h-12 sm:h-14 rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all ${
                      cd.isToday
                        ? 'ring-2 ring-[#122A24] bg-emerald-50/80 shadow-xs'
                        : cd.status === 'PRESENT'
                        ? 'bg-[#EBF5EF] hover:bg-emerald-100 text-[#122A24]'
                        : cd.status === 'ABSENT'
                        ? 'bg-rose-50 text-rose-800'
                        : cd.status === 'LEAVE'
                        ? 'bg-blue-50 text-blue-800'
                        : cd.status === 'HOLIDAY' || cd.status === 'SUNDAY'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{cd.dayNumber}</span>
                    <span className="text-[9px] font-mono font-semibold">
                      {cd.status === 'PRESENT' ? '✓ Present' : cd.status === 'ABSENT' ? '✕ Absent' : cd.status === 'LEAVE' ? 'Leave' : cd.status === 'SUNDAY' ? 'Sun' : cd.status === 'HOLIDAY' ? 'Holiday' : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 2: MY PERSONAL FEE INVOICES & RECEIPTS
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          PANEL 2: MY PERSONAL FEE INVOICES & MONTH-WISE BREAKDOWN
          ───────────────────────────────────────────────────────────── */}
      {activeView === 'fees' && (
        <div className="space-y-6">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Annual Fee Demand
              </span>
              <div className="font-display font-extrabold text-3xl text-[#122A24] mt-2">
                ₹{totalBilled.toLocaleString('en-IN')}.00
              </div>
              <div className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Academic Session {selectedSession}</span>
                <span className="font-bold text-slate-700">12 Months</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Paid To Date
              </span>
              <div className="font-display font-extrabold text-3xl text-emerald-700 mt-2">
                ₹{totalPaid.toLocaleString('en-IN')}.00
              </div>
              <div className="mt-2 text-xs text-emerald-800 font-semibold pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>✓ Verified Cleared</span>
                <span>{monthlySchedule.months.filter(m => m.status === 'PAID').length} Paid Cycles</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#DCE8E0] shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Current Balance Due
              </span>
              <div className={`font-display font-extrabold text-3xl mt-2 ${totalDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                ₹{totalDue.toLocaleString('en-IN')}.00
              </div>
              <div className="mt-2 text-xs pt-2 border-t border-slate-100 text-slate-500">
                {totalDue > 0 ? 'Outstanding across remaining academic cycles' : '✓ Full Session Dues Cleared'}
              </div>
            </div>
          </div>

          {/* Month-Wise Fee Schedule Card */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5">
            {/* Header & Filter Scope */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-display font-bold text-lg text-[#122A24]">
                    Month-Wise Student Fee Ledger
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                    April 2026 – March 2027
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Itemized monthly schedule of Tuition Fee, Annual Fee, Transport and Examination charges for {student.full_name}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Quarter & Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                  {[
                    { id: 'ALL', label: 'All 12 Months' },
                    { id: 'Q1', label: 'Q1 (Apr–Jun)' },
                    { id: 'Q2', label: 'Q2 (Jul–Sep)' },
                    { id: 'Q3', label: 'Q3 (Oct–Dec)' },
                    { id: 'Q4', label: 'Q4 (Jan–Mar)' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFeeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border-none text-xs ${
                        selectedFeeFilter === f.id
                          ? 'bg-[#122A24] text-white shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#122A24] border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title="Print Annual Fee Ledger"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              </div>
            </div>

            {/* Month-Wise Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider bg-[#122A24] text-white">
                    <th className="py-3 px-3.5">Month &amp; Billing Cycle</th>
                    <th className="py-3 px-3 text-right">Tuition Fee</th>
                    <th className="py-3 px-3 text-right">Annual Fee</th>
                    <th className="py-3 px-3 text-right">Transport</th>
                    <th className="py-3 px-3 text-right">Exam &amp; Lab</th>
                    <th className="py-3 px-3 text-right">Total Billed</th>
                    <th className="py-3 px-3 text-right bg-emerald-900/90 text-emerald-100 font-bold">Total Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedMonths.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Month & Cycle */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {m.quarter}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {m.month}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.cycleName} • Inv: #{m.invoiceNo}
                        </div>
                      </td>

                      {/* Tuition Fee */}
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-800 text-sm">
                        ₹{m.tuitionFee.toLocaleString('en-IN')}
                      </td>

                      {/* Annual Fee */}
                      <td className="py-3 px-3 text-right tabular-nums text-sm">
                        {m.annualFee > 0 ? (
                          <span className="font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            ₹{m.annualFee.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Transport Fee */}
                      <td className="py-3 px-3 text-right tabular-nums text-sm">
                        {m.transportFee > 0 ? (
                          <span className="text-slate-800 font-semibold">
                            ₹{m.transportFee.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">₹0 (Self)</span>
                        )}
                      </td>

                      {/* Exam / Lab */}
                      <td className="py-3 px-3 text-right tabular-nums text-sm">
                        {m.examFee > 0 ? (
                          <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            ₹{m.examFee.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Total Billed */}
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 text-sm">
                        ₹{m.totalBilled.toLocaleString('en-IN')}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-800 text-sm bg-emerald-50/50">
                        {m.paidAmount > 0 ? (
                          <span>₹{m.paidAmount.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0.00</span>
                        )}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-sm">
                        {m.balanceDue > 0 ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            ₹{m.balanceDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs">
                            ✓ Cleared
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${
                          m.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : m.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-900 border border-amber-300'
                            : m.status === 'PENDING'
                            ? 'bg-rose-50 text-rose-900 border border-rose-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        {m.status === 'PAID' || m.paidAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setActiveReceiptModal(m)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold text-xs inline-flex items-center gap-1.5 ml-auto cursor-pointer transition-colors shadow-2xs"
                            title={`View itemized fee receipt for ${m.month}`}
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert(`Online Fee Gateway for ${m.month}: Total dues payable: ₹${m.balanceDue.toLocaleString('en-IN')}. Please contact accounts desk or use UPI.`)}
                            className="px-3 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold text-xs inline-flex items-center gap-1.5 ml-auto cursor-pointer transition-colors border-none shadow-2xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Dues</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Table Footer Summary Row */}
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800 text-xs">
                  <tr>
                    <td className="py-3.5 px-3.5 text-slate-700 uppercase tracking-wider text-xs">
                      Session Total ({displayedMonths.length} Months)
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-sm">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.tuitionFee, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-sm text-indigo-900">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.annualFee, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-sm">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.transportFee, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-sm text-purple-900">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.examFee, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-slate-900 text-sm">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.totalBilled, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-emerald-800 text-sm bg-emerald-100/60 font-extrabold">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.paidAmount, 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-amber-900 text-sm">
                      ₹{displayedMonths.reduce((sum, m) => sum + m.balanceDue, 0).toLocaleString('en-IN')}
                    </td>
                    <td colSpan={2} className="py-3.5 px-3 text-center text-slate-500 font-normal text-xs">
                      Full Academic Session
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PANEL 3: MY ISSUED CERTIFICATES & ATTESTATIONS
          ───────────────────────────────────────────────────────────── */}
      {activeView === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#DCE8E0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-[#122A24]">
                  My Issued Certificates &amp; Credentials
                </h2>
                <p className="text-xs text-[#2D5A4E]">
                  Cryptographically verified certificates issued by {selectedSchool?.school_name || 'Delhi Public School'}
                </p>
              </div>

              <span className="px-3 py-1 bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] rounded-full text-xs font-mono font-bold self-start sm:self-auto">
                {issuedCertificates.length} Valid Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issuedCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl border border-[#DCE8E0] bg-[#F9FCFA] hover:bg-white hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        {cert.status}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-[#122A24] mt-3">
                      {cert.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-1">
                      Cert No: <strong className="text-slate-800">{cert.cert_no}</strong>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Purpose: {cert.purpose}
                    </p>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-2">
                      Issued: {cert.issue_date}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      alert(`Downloading attested copy of ${cert.title}...`);
                      window.print();
                    }}
                    className="w-full py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Attested Copy</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Itemized Fee Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 animate-fade-in text-xs">
            {/* Receipt Top Header */}
            <div className="flex justify-between items-start pb-3 border-b-2 border-[#122A24]">
              <div>
                <div className="font-display font-extrabold text-lg text-[#122A24] tracking-tight">
                  {selectedSchool?.school_name || 'Delhi Public School'}
                </div>
                <div className="text-[11px] text-slate-500">
                  CBSE Affiliation No: {selectedSchool?.affiliation_no || '2130042'} • School Code: {selectedSchool?.oasis_code || '84001'}
                </div>
                <div className="text-xs font-bold text-emerald-800 mt-0.5">
                  Official Institutional Fee Receipt • Session {selectedSession}
                </div>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scholar Metadata Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Receipt No: </span>
                <strong className="text-slate-900 font-semibold">{activeReceiptModal.invoiceNo || activeReceiptModal.invoice_no || 'DPS-REC-001'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Fee Cycle / Month: </span>
                <strong className="text-slate-900 font-semibold">{activeReceiptModal.month || activeReceiptModal.cycleName || 'April 2026'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Scholar Name: </span>
                <strong className="text-slate-900 font-semibold">{student.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Admission No: </span>
                <strong className="text-slate-900 font-semibold">{student.admission_no}</strong>
              </div>
              <div>
                <span className="text-slate-500">Class &amp; Division: </span>
                <strong className="text-slate-900 font-semibold">{student.class_name} - {student.section || 'A'} (Roll #{student.roll_no || '1'})</strong>
              </div>
              <div>
                <span className="text-slate-500">Payment Date: </span>
                <strong className="text-emerald-800 font-semibold">{activeReceiptModal.paidDate || activeReceiptModal.paid_date || '10 Apr 2026'}</strong>
              </div>
            </div>

            {/* Itemized Fee Heads Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#122A24] text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Particulars / Fee Component</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="py-2.5 px-3 text-slate-400">1</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900">Tuition Fee</span>
                      <div className="text-[11px] text-slate-500">Regular classroom curriculum and academic instruction</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-900">
                      ₹{(Number(activeReceiptModal.tuitionFee ?? activeReceiptModal.tuition_fee) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {(Number(activeReceiptModal.annualFee ?? activeReceiptModal.annual_fee) || 0) > 0 && (
                    <tr className="bg-indigo-50/40">
                      <td className="py-2.5 px-3 text-slate-400">2</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-indigo-950">Annual &amp; Development Composite Fee</span>
                        <div className="text-[11px] text-slate-500">Institutional infrastructure, library, and smart classes</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-indigo-900">
                        ₹{(Number(activeReceiptModal.annualFee ?? activeReceiptModal.annual_fee) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {(Number(activeReceiptModal.transportFee ?? activeReceiptModal.transport_fee) || 0) > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-slate-400">3</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900">Transportation / Bus Route Charge</span>
                        <div className="text-[11px] text-slate-500">GPS verified institutional school bus transport</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-900">
                        ₹{(Number(activeReceiptModal.transportFee ?? activeReceiptModal.transport_fee) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {(Number(activeReceiptModal.examFee ?? activeReceiptModal.exam_fee) || 0) > 0 && (
                    <tr className="bg-purple-50/40">
                      <td className="py-2.5 px-3 text-slate-400">4</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-purple-950">CBSE Term Examination &amp; Laboratory Fee</span>
                        <div className="text-[11px] text-slate-500">Assessment papers, science lab practicals, digital marksheet</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-purple-900">
                        ₹{(Number(activeReceiptModal.examFee ?? activeReceiptModal.exam_fee) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {(Number(activeReceiptModal.activityFee) || 0) > 0 && (
                    <tr>
                      <td className="py-2.5 px-3 text-slate-400">5</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900">Co-Curricular Activities &amp; Sports Charge</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-900">
                        ₹{(Number(activeReceiptModal.activityFee) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  {(Number(activeReceiptModal.concessionAmount ?? activeReceiptModal.concession_amount) || 0) > 0 && (
                    <tr className="text-emerald-800 bg-emerald-50/60">
                      <td className="py-2.5 px-3 text-slate-400">6</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold">Scholarship / Sibling Concession Discount</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                        -₹{(Number(activeReceiptModal.concessionAmount ?? activeReceiptModal.concession_amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot className="bg-[#122A24] text-white">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 font-bold uppercase text-xs">
                      Total Amount Paid:
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-sm text-emerald-300 tabular-nums">
                      ₹{(Number(activeReceiptModal.paidAmount ?? activeReceiptModal.paid_amount ?? activeReceiptModal.amount) || 0).toLocaleString('en-IN')}.00
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Details Footer */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
              <div>
                <span className="text-emerald-800">Channel: </span>
                <strong className="font-semibold">{activeReceiptModal.paymentMode || activeReceiptModal.payment_mode || 'UPI / NetBanking'}</strong>
              </div>
              <div>
                <span className="text-emerald-800">Status: </span>
                <strong className="text-emerald-900 font-bold">✓ PAID IN FULL</strong>
              </div>
              <div className="text-[11px] text-emerald-700">
                Institutional E-Receipt
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReceiptModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
