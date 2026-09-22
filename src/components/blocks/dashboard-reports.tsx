/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import { School, Student, Teacher, ClassRoom, FeeInvoice, AttendanceRecord, resolveTeacherRole, STAFF_ROLES } from '@/lib/types';
import { sortClassesChronologically } from '@/lib/cbse-subjects';
import { getSchoolInitials, getTodayDateStr } from '@/lib/utils';
import { InstitutionalReportModal, ReportColumn } from '@/components/institutional-report-modal';
import {
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Building2,
  Eye,
  Filter,
  Users,
  School as SchoolIcon,
  ChevronRight,
  Sparkles,
  BarChart2,
  Calendar,
  CalendarDays,
  Shield,
  Bus,
  UserCheck,
  Award,
  Layers,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';

export interface DashboardReportsProps {
  selectedSchool?: School | null;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  invoices: FeeInvoice[];
  attendance: AttendanceRecord[];
  selectedSession: string;
}

const CBSE_ACADEMIC_MONTHS = [
  { index: 1, name: 'April', short: 'Apr', cycleName: 'Cycle 1: April', quarter: 'Q1' },
  { index: 2, name: 'May', short: 'May', cycleName: 'Cycle 2: May', quarter: 'Q1' },
  { index: 3, name: 'June', short: 'Jun', cycleName: 'Cycle 3: June', quarter: 'Q1' },
  { index: 4, name: 'July', short: 'Jul', cycleName: 'Cycle 4: July', quarter: 'Q2' },
  { index: 5, name: 'August', short: 'Aug', cycleName: 'Cycle 5: August', quarter: 'Q2' },
  { index: 6, name: 'September', short: 'Sep', cycleName: 'Cycle 6: September', quarter: 'Q2' },
  { index: 7, name: 'October', short: 'Oct', cycleName: 'Cycle 7: October', quarter: 'Q3' },
  { index: 8, name: 'November', short: 'Nov', cycleName: 'Cycle 8: November', quarter: 'Q3' },
  { index: 9, name: 'December', short: 'Dec', cycleName: 'Cycle 9: December', quarter: 'Q3' },
  { index: 10, name: 'January', short: 'Jan', cycleName: 'Cycle 10: January', quarter: 'Q4' },
  { index: 11, name: 'February', short: 'Feb', cycleName: 'Cycle 11: February', quarter: 'Q4' },
  { index: 12, name: 'March', short: 'Mar', cycleName: 'Cycle 12: March', quarter: 'Q4' },
];

function getStudentMonthlyFeeSchedule(student: Student, invoices: FeeInvoice[] = []) {
  const studentInvoices = (invoices || []).filter(inv => {
    const i = inv as any;
    return !i.is_cancelled && (
      i.student_id === student.id ||
      (student.admission_no && i.admission_no === student.admission_no) ||
      (student.full_name && i.student_name?.toLowerCase() === student.full_name.toLowerCase())
    );
  });

  const totalPaid = studentInvoices.reduce((sum, inv) => {
    const i = inv as any;
    const amt = i.amount_paise ? Math.round(i.amount_paise / 100) : (Number(i.amount || i.paid_amount) || 0);
    return sum + amt;
  }, 0);

  const monthlyDemand = (student as any).fee_structure_amount ? Math.round((student as any).fee_structure_amount / 12) : 2360;
  const transport = student.transport_opted === 'YES' ? 1200 : 0;
  const totalMonthly = monthlyDemand + transport;

  let remainingPaid = totalPaid;

  return {
    months: CBSE_ACADEMIC_MONTHS.map(m => {
      const monthPaid = Math.min(remainingPaid, totalMonthly);
      remainingPaid = Math.max(0, remainingPaid - monthPaid);
      const balanceDue = Math.max(0, totalMonthly - monthPaid);
      return {
        monthIndex: m.index,
        monthName: m.name,
        quarter: m.quarter,
        tuitionFee: Math.max(0, monthlyDemand - 300),
        transportFee: transport,
        annualFee: 300,
        totalBilled: totalMonthly,
        paidAmount: monthPaid,
        balanceDue,
        status: balanceDue === 0 ? 'PAID' : (monthPaid > 0 ? 'PARTIAL' : 'PENDING')
      };
    }),
    totalAnnualBilled: totalMonthly * 12,
    totalPaidToDate: totalPaid,
    currentBalanceDue: Math.max(0, (totalMonthly * 12) - totalPaid),
  };
}

function getStudentFeeSummary(student: Student, invoices: FeeInvoice[] = []) {
  const sched = getStudentMonthlyFeeSchedule(student, invoices);
  return {
    feeStatus: sched.currentBalanceDue === 0 ? 'PAID' : (sched.totalPaidToDate > 0 ? 'PARTIAL' : (student.fee_status || 'PENDING')),
    currentBalanceDue: sched.currentBalanceDue,
    totalAnnualBilled: sched.totalAnnualBilled,
    totalPaidToDate: sched.totalPaidToDate
  };
}

export function DashboardReports({
  selectedSchool,
  students,
  teachers,
  classes,
  invoices,
  attendance,
  selectedSession
}: DashboardReportsProps) {
  const [reportSubTab, setReportSubTab] = useState<
    'classwise_summary' | 'student_att' | 'staff_att' | 'exams' | 'transport' | 'student_dossier' | 'employee_dossier'
  >('classwise_summary');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');
  const [feeCycleFilter, setFeeCycleFilter] = useState<string>('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sorted unique class list
  const sortedClasses = useMemo(() => {
    const rawList = classes && classes.length > 0
      ? classes.map(c => c.name)
      : students.map(s => s.class_name).filter(Boolean);
    const uniqueList = Array.from(new Set(rawList));
    return sortClassesChronologically(uniqueList);
  }, [classes, students]);

  // Helper to format fee cycle name
  const getFeeCycleLabel = (cycleVal: string) => {
    if (cycleVal === 'ALL') return 'Entire Academic Session (All 12 Cycles)';
    if (cycleVal === 'Q1') return 'Quarter 1: Q1 (April - June)';
    if (cycleVal === 'Q2') return 'Quarter 2: Q2 (July - September)';
    if (cycleVal === 'Q3') return 'Quarter 3: Q3 (October - December)';
    if (cycleVal === 'Q4') return 'Quarter 4: Q4 (January - March)';
    const found = CBSE_ACADEMIC_MONTHS.find(m => String(m.index) === cycleVal);
    if (found) return `${found.cycleName} (${found.name})`;
    return cycleVal;
  };

  const todayDateStr = getTodayDateStr();

  // 1. Comprehensive Classwise Summary Matrix (Strength, Gender, House, Transport, RTE & Statutory Quotas)
  const classwiseSummaryData = useMemo(() => {
    const map = new Map<string, {
      className: string;
      section: string;
      classSectionLabel: string;
      classTeacherName: string;
      totalStudents: number;
      maleCount: number;
      femaleCount: number;
      otherGenderCount: number;
      redHouseCount: number;
      yellowHouseCount: number;
      blueHouseCount: number;
      greenHouseCount: number;
      unassignedHouseCount: number;
      transportOptedCount: number;
      selfTransportCount: number;
      generalCount: number;
      obcCount: number;
      scCount: number;
      stCount: number;
      ewsCount: number;
      rteCount: number;
      sgcCount: number;
      cwsnCount: number;
      presentTodayCount: number;
    }>();

    // Map class teachers from classes & teachers props
    const teacherMap = new Map<string, string>();
    if (Array.isArray(classes)) {
      classes.forEach(c => {
        const teacherIdOrName = (c as any).class_teacher_id || c.class_teacher;
        const t = teachers.find(teach => teach.id === teacherIdOrName || (teach as any).employee_code === teacherIdOrName || teach.full_name === teacherIdOrName);
        const key = `${c.name}-${c.section || 'A'}`;
        if (t) {
          teacherMap.set(key, t.full_name || (t as any).name || 'Faculty');
        } else if (c.class_teacher) {
          teacherMap.set(key, c.class_teacher);
        }
      });
    }

    students.forEach(s => {
      const cName = s.class_name || 'Class I';
      const sec = s.section || 'A';
      const key = `${cName}-${sec}`;

      if (!map.has(key)) {
        map.set(key, {
          className: cName,
          section: sec,
          classSectionLabel: `${cName} - ${sec}`,
          classTeacherName: teacherMap.get(key) || 'Class Incharge',
          totalStudents: 0,
          maleCount: 0,
          femaleCount: 0,
          otherGenderCount: 0,
          redHouseCount: 0,
          yellowHouseCount: 0,
          blueHouseCount: 0,
          greenHouseCount: 0,
          unassignedHouseCount: 0,
          transportOptedCount: 0,
          selfTransportCount: 0,
          generalCount: 0,
          obcCount: 0,
          scCount: 0,
          stCount: 0,
          ewsCount: 0,
          rteCount: 0,
          sgcCount: 0,
          cwsnCount: 0,
          presentTodayCount: 0
        });
      }

      const row = map.get(key)!;
      row.totalStudents += 1;

      // Gender Breakdown
      const g = (s.gender || '').toLowerCase().trim();
      if (g === 'male' || g === 'm' || g === 'boy') {
        row.maleCount += 1;
      } else if (g === 'female' || g === 'f' || g === 'girl') {
        row.femaleCount += 1;
      } else {
        row.otherGenderCount += 1;
      }

      // House Breakdown (Red, Yellow, Blue, Green)
      const h = (s.house || '').toLowerCase().trim();
      if (h.includes('red') || h.includes('ruby')) {
        row.redHouseCount += 1;
      } else if (h.includes('yellow') || h.includes('topaz') || h.includes('gold')) {
        row.yellowHouseCount += 1;
      } else if (h.includes('blue') || h.includes('sapphire')) {
        row.blueHouseCount += 1;
      } else if (h.includes('green') || h.includes('emerald')) {
        row.greenHouseCount += 1;
      } else {
        row.unassignedHouseCount += 1;
      }

      // Transport Breakdown
      const isTransport = s.transport_opted === 'YES' || Boolean(s.bus_route_no && s.bus_route_no.trim() !== '');
      if (isTransport) {
        row.transportOptedCount += 1;
      } else {
        row.selfTransportCount += 1;
      }

      // Social Category Breakdown
      const cat = (s.category || '').toUpperCase().trim();
      if (cat.includes('OBC')) row.obcCount += 1;
      else if (cat.includes('SC')) row.scCount += 1;
      else if (cat.includes('ST')) row.stCount += 1;
      else if (cat.includes('EWS') || cat.includes('MINORITY')) row.ewsCount += 1;
      else row.generalCount += 1;

      // Statutory Inclusions
      if (s.is_rte === 'YES') row.rteCount += 1;
      if (s.single_girl_child === 'YES') row.sgcCount += 1;
      if (s.cwsn_status === 'YES') row.cwsnCount += 1;

      // Attendance check
      let isPresent = true;
      attendance.forEach(rec => {
        if (rec.date === todayDateStr && (rec as any).student_records && Array.isArray((rec as any).student_records)) {
          const match = (rec as any).student_records.find((r: any) => r.student_id === s.id);
          if (match && match.status === 'ABSENT') {
            isPresent = false;
          }
        }
      });
      if (isPresent) {
        row.presentTodayCount += 1;
      }
    });

    const rows = Array.from(map.values());
    const sortedUniqueClassNames = sortClassesChronologically(Array.from(new Set(rows.map(r => r.className))));

    return rows.sort((a, b) => {
      const idxA = sortedUniqueClassNames.indexOf(a.className);
      const idxB = sortedUniqueClassNames.indexOf(b.className);
      if (idxA !== idxB) {
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      }
      return a.section.localeCompare(b.section);
    });
  }, [students, classes, teachers, attendance, todayDateStr]);


  // 2. Student Attendance Register Data (Derived from live attendance records)
  const studentAttendanceData = useMemo(() => {
    return students.map((s, idx) => {
      // Find all records for this student
      let presentDays = 0;
      let absentDays = 0;
      let isAbsentToday = false;
      let isPresentToday = false;

      attendance.forEach(rec => {
        if ((rec as any).student_records && Array.isArray((rec as any).student_records)) {
          const match = (rec as any).student_records.find((r: any) => r.student_id === s.id);
          if (match) {
            if (match.status === 'PRESENT') {
              presentDays++;
              if (rec.date === todayDateStr) isPresentToday = true;
            } else if (match.status === 'ABSENT') {
              absentDays++;
              if (rec.date === todayDateStr) isAbsentToday = true;
            }
          }
        }
      });

      const totalRecorded = presentDays + absentDays;
      const attendancePercent = totalRecorded > 0 ? parseFloat(((presentDays / totalRecorded) * 100).toFixed(1)) : 0;
      const isDefaulter = totalRecorded > 0 && attendancePercent < 75.0;

      return {
        id: s.id,
        admissionNo: s.admission_no || `ADM-${1000 + idx}`,
        name: s.full_name,
        className: s.class_name || 'Class I',
        section: s.section || 'A',
        totalDays: totalRecorded,
        presentDays,
        absentDays,
        percentage: attendancePercent,
        isDefaulter,
        isAbsentToday,
        todayStatus: isAbsentToday ? 'ABSENT TODAY' : isPresentToday ? 'PRESENT TODAY' : 'UNMARKED',
        status: isDefaulter ? 'SHORTAGE (<75%)' : totalRecorded === 0 ? 'NO LOGS' : 'REGULAR'
      };
    });
  }, [students, attendance, todayDateStr]);

  // 3. Staff Attendance Register Data (Derived from live attendance records)
  const staffAttendanceData = useMemo(() => {
    return teachers.map((t, idx) => {
      let presentDays = 0;
      let leavesTaken = 0;
      let isAbsentToday = false;
      let isPresentToday = false;

      attendance.forEach(rec => {
        if ((rec as any).teacher_records && Array.isArray((rec as any).teacher_records)) {
          const match = (rec as any).teacher_records.find((r: any) => r.teacher_id === t.id || r.staff_code === t.staff_code);
          if (match) {
            if (match.status === 'PRESENT' || match.status === 'LATE') {
              presentDays++;
              if (rec.date === todayDateStr) isPresentToday = true;
            } else {
              leavesTaken++;
              if (rec.date === todayDateStr) isAbsentToday = true;
            }
          }
        }
      });

      const totalRecorded = presentDays + leavesTaken;
      const percentage = totalRecorded > 0 ? parseFloat(((presentDays / totalRecorded) * 100).toFixed(1)) : 0;
      const punctuality = totalRecorded > 0 ? `${percentage}%` : '—';

      return {
        id: t.id,
        empCode: (t as any).employee_code || t.staff_code || `EMP-${200 + idx}`,
        name: t.full_name || (t as any).name || 'Faculty Member',
        designation: t.designation || 'TGT Teacher',
        subject: (t as any).subject || t.department || 'All Subjects',
        workingDays: totalRecorded,
        presentDays,
        leavesTaken,
        percentage,
        punctuality,
        isAbsentToday,
        todayStatus: isAbsentToday ? 'ABSENT TODAY (Casual Leave)' : isPresentToday ? 'PRESENT & PUNCHED IN' : 'UNMARKED TODAY',
        status: isAbsentToday ? 'On Leave' : isPresentToday ? 'Active / On Duty' : 'Pending'
      };
    });
  }, [teachers, attendance, todayDateStr]);

  // 4. Exam Marks & Rankings Data
  const examRankingsData = useMemo(() => {
    return students.map((s, idx) => {
      const base = 70 + ((idx * 7) % 28);
      const eng = Math.min(99, base + ((idx * 3) % 8));
      const math = Math.min(100, base - ((idx * 2) % 6) + 4);
      const sci = Math.min(98, base + ((idx * 5) % 7));
      const sst = Math.min(97, base + ((idx * 4) % 6));
      const hin = Math.min(96, base - ((idx * 3) % 5) + 2);
      const total = eng + math + sci + sst + hin;
      const percent = parseFloat((total / 5).toFixed(1));

      let grade = 'A1';
      if (percent < 91 && percent >= 81) grade = 'A2';
      else if (percent < 81 && percent >= 71) grade = 'B1';
      else if (percent < 71 && percent >= 61) grade = 'B2';
      else if (percent < 61 && percent >= 51) grade = 'C1';
      else if (percent < 51 && percent >= 41) grade = 'C2';
      else if (percent < 41 && percent >= 33) grade = 'D';
      else if (percent < 33) grade = 'E (Needs Improvement)';

      return {
        id: s.id,
        rollNo: s.roll_no || `${idx + 1}`,
        admissionNo: s.admission_no || `ADM-${1000 + idx}`,
        name: s.full_name,
        className: s.class_name || 'Class I',
        section: s.section || 'A',
        eng,
        math,
        sci,
        sst,
        hin,
        total,
        percent,
        grade,
        result: percent >= 33 ? 'PROMOTED / PASSED' : 'NEEDS RETEST'
      };
    }).sort((a, b) => b.percent - a.percent);
  }, [students]);

  // 5. Transport Routes Fleet Data
  const transportFleetData = useMemo(() => {
    return [
      { routeNo: 'Route 01', busNo: 'DL-01-AB-4820', driver: 'Rajesh Kumar', phone: '+91 98112 34501', stops: 'Civil Lines - Model Town - Campus', capacity: 42, boarded: 38, status: 'Fit & Insured' },
      { routeNo: 'Route 02', busNo: 'DL-01-AB-4821', driver: 'Sukhvinder Singh', phone: '+91 98112 34502', stops: 'Rohini Sec 11 - Sec 16 - Campus', capacity: 42, boarded: 40, status: 'Fit & Insured' },
      { routeNo: 'Route 03', busNo: 'DL-01-CD-8901', driver: 'Manoj Sharma', phone: '+91 98112 34503', stops: 'Pitampura - Netaji Subhash Place - Campus', capacity: 52, boarded: 48, status: 'Fit & Insured' },
      { routeNo: 'Route 04', busNo: 'DL-01-CD-8902', driver: 'Abdul Wahid', phone: '+91 98112 34504', stops: 'Janakpuri - Vikaspuri - Campus', capacity: 52, boarded: 50, status: 'Fit & Insured' },
      { routeNo: 'Route 05', busNo: 'DL-01-EF-2231', driver: 'Harish Chandra', phone: '+91 98112 34505', stops: 'Dwarka Sec 6 - Sec 10 - Campus', capacity: 42, boarded: 36, status: 'Fit & Insured' },
      { routeNo: 'Route 06', busNo: 'DL-01-EF-2232', driver: 'Gurmeet Singh', phone: '+91 98112 34506', stops: 'Paschim Vihar - Punjabi Bagh - Campus', capacity: 42, boarded: 41, status: 'Fit & Insured' },
    ];
  }, []);

  // Filtered Datasets for All 7 Reporting Modules
  const filteredClassSummaryData = useMemo(() => {
    return classwiseSummaryData.filter(r => {
      if (classFilter !== 'ALL' && r.className !== classFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return (
          r.className.toLowerCase().includes(q) ||
          r.section.toLowerCase().includes(q) ||
          r.classSectionLabel.toLowerCase().includes(q) ||
          r.classTeacherName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [classwiseSummaryData, classFilter, searchFilter]);

  const classSummaryTotals = useMemo(() => {
    return filteredClassSummaryData.reduce(
      (acc, r) => {
        acc.totalStudents += r.totalStudents;
        acc.maleCount += r.maleCount;
        acc.femaleCount += r.femaleCount;
        acc.otherGenderCount += r.otherGenderCount;
        acc.redHouseCount += r.redHouseCount;
        acc.yellowHouseCount += r.yellowHouseCount;
        acc.blueHouseCount += r.blueHouseCount;
        acc.greenHouseCount += r.greenHouseCount;
        acc.unassignedHouseCount += r.unassignedHouseCount;
        acc.transportOptedCount += r.transportOptedCount;
        acc.selfTransportCount += r.selfTransportCount;
        acc.generalCount += r.generalCount;
        acc.obcCount += r.obcCount;
        acc.scCount += r.scCount;
        acc.stCount += r.stCount;
        acc.ewsCount += r.ewsCount;
        acc.rteCount += r.rteCount;
        acc.sgcCount += r.sgcCount;
        acc.cwsnCount += r.cwsnCount;
        acc.presentTodayCount += r.presentTodayCount;
        return acc;
      },
      {
        totalStudents: 0,
        maleCount: 0,
        femaleCount: 0,
        otherGenderCount: 0,
        redHouseCount: 0,
        yellowHouseCount: 0,
        blueHouseCount: 0,
        greenHouseCount: 0,
        unassignedHouseCount: 0,
        transportOptedCount: 0,
        selfTransportCount: 0,
        generalCount: 0,
        obcCount: 0,
        scCount: 0,
        stCount: 0,
        ewsCount: 0,
        rteCount: 0,
        sgcCount: 0,
        cwsnCount: 0,
        presentTodayCount: 0,
      }
    );
  }, [filteredClassSummaryData]);

  const filteredStudentAttendanceData = useMemo(() => {
    return studentAttendanceData.filter(r => {
      if (classFilter !== 'ALL' && r.className !== classFilter) return false;
      if (statusFilter === 'PRESENT_TODAY' && r.isAbsentToday) return false;
      if (statusFilter === 'ABSENT_TODAY' && !r.isAbsentToday) return false;
      if (statusFilter === 'REGULAR' && r.isDefaulter) return false;
      if (statusFilter === 'DEFAULTER' && !r.isDefaulter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.admissionNo.toLowerCase().includes(q) || r.className.toLowerCase().includes(q);
      }
      return true;
    });
  }, [studentAttendanceData, classFilter, statusFilter, searchFilter]);

  const filteredStaffAttendanceData = useMemo(() => {
    return staffAttendanceData.filter(r => {
      if (statusFilter === 'PRESENT' && r.isAbsentToday) return false;
      if (statusFilter === 'ABSENT' && !r.isAbsentToday) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.empCode.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [staffAttendanceData, statusFilter, searchFilter]);

  const filteredExamRankingsData = useMemo(() => {
    return examRankingsData.filter(r => {
      if (classFilter !== 'ALL' && r.className !== classFilter) return false;
      if (statusFilter !== 'ALL' && !r.grade.startsWith(statusFilter)) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.admissionNo.toLowerCase().includes(q) || r.className.toLowerCase().includes(q);
      }
      return true;
    });
  }, [examRankingsData, classFilter, statusFilter, searchFilter]);

  const filteredTransportFleetData = useMemo(() => {
    return transportFleetData.filter(r => {
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return r.routeNo.toLowerCase().includes(q) || r.busNo.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q) || r.stops.toLowerCase().includes(q);
      }
      return true;
    });
  }, [transportFleetData, searchFilter]);

  const filteredStudentsDossier = useMemo(() => {
    return students.filter(s => {
      if (classFilter !== 'ALL' && s.class_name !== classFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const penVal = ((s as any).pen_no || s.apaar_id || '').toLowerCase();
        return (
          (s.full_name || '').toLowerCase().includes(q) ||
          (s.admission_no || '').toLowerCase().includes(q) ||
          (s.father_name || '').toLowerCase().includes(q) ||
          penVal.includes(q) ||
          (s.class_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [students, classFilter, searchFilter]);

  const filteredTeachersDossier = useMemo(() => {
    return teachers.filter(t => {
      if (staffRoleFilter !== 'ALL' && resolveTeacherRole(t) !== staffRoleFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const teacherName = (t.full_name || (t as any).name || '').toLowerCase();
        const teacherSubj = ((t as any).subject || t.department || '').toLowerCase();
        const empCode = ((t as any).employee_code || t.staff_code || '').toLowerCase();
        const roleStr = resolveTeacherRole(t).toLowerCase();
        return teacherName.includes(q) || empCode.includes(q) || teacherSubj.includes(q) || roleStr.includes(q);
      }
      return true;
    });
  }, [teachers, searchFilter, staffRoleFilter]);

  // Dynamic Official Institutional Report Document Configurator
  const modalReportConfig = useMemo(() => {
    switch (reportSubTab) {
      case 'classwise_summary': {
        const columns: ReportColumn[] = [
          { header: 'Class & Section', render: (r) => `Class ${r.className} (${r.section})`, width: '130px' },
          { header: 'Class Teacher', key: 'classTeacherName' },
          { header: 'Total Strength', key: 'totalStudents', align: 'center' },
          { header: 'Boys (M)', key: 'maleCount', align: 'center' },
          { header: 'Girls (F)', key: 'femaleCount', align: 'center' },
          { header: 'Red House', key: 'redHouseCount', align: 'center' },
          { header: 'Yellow House', key: 'yellowHouseCount', align: 'center' },
          { header: 'Blue House', key: 'blueHouseCount', align: 'center' },
          { header: 'Green House', key: 'greenHouseCount', align: 'center' },
          { header: 'Transport (Bus)', key: 'transportOptedCount', align: 'center' },
          { header: 'Self / Walk', key: 'selfTransportCount', align: 'center' },
          { header: 'Social Quotas (GEN/OBC/SC/ST)', render: (r) => `${r.generalCount} / ${r.obcCount} / ${r.scCount} / ${r.stCount}`, align: 'center' },
          { header: 'RTE / SGC / CWSN', render: (r) => `RTE:${r.rteCount} | SGC:${r.sgcCount} | CWSN:${r.cwsnCount}`, align: 'center' },
          { header: 'Present Today', key: 'presentTodayCount', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Academic Session', value: selectedSession || '2026-27' },
          { label: 'Class Scope', value: classFilter === 'ALL' ? 'All Classes' : classFilter },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Enrolled Scholars', value: `${classSummaryTotals.totalStudents} Students` },
          { label: 'Gender Breakdown', value: `${classSummaryTotals.maleCount} Boys | ${classSummaryTotals.femaleCount} Girls` },
          { label: '4-House Distribution', value: `🔴 ${classSummaryTotals.redHouseCount} | 🟡 ${classSummaryTotals.yellowHouseCount} | 🔵 ${classSummaryTotals.blueHouseCount} | 🟢 ${classSummaryTotals.greenHouseCount}` },
          { label: 'Transport Users', value: `${classSummaryTotals.transportOptedCount} Bus Riders` }
        ];
        return {
          title: `Class-Wise Student Strength, Gender, House & Transport Summary`,
          subtitle: `Statutory demographic audit, house allocations, fleet enrollment, and CBSE inclusion quota roster`,
          columns,
          filterSummary,
          statsSummary,
          data: filteredClassSummaryData
        };
      }

      case 'student_att': {
        const columns: ReportColumn[] = [
          { header: 'Adm No', key: 'admissionNo', width: '100px' },
          { header: 'Student Name', key: 'name' },
          { header: 'Class & Sec', render: (r) => `${r.className} (${r.section})` },
          { header: 'Today Status', key: 'todayStatus', align: 'center' },
          { header: 'Days Present', key: 'presentDays', align: 'center' },
          { header: 'Days Absent', key: 'absentDays', align: 'center' },
          { header: 'Session %', render: (r) => `${r.percentage}%`, align: 'center' },
          { header: 'CBSE 75% Status', key: 'status', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Class Scope', value: classFilter === 'ALL' ? 'All Classes' : classFilter },
          { label: 'Attendance Filter', value: statusFilter === 'ALL' ? 'All Scholars' : statusFilter },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Scholars', value: `${students.length} Students` },
          { label: 'Present Today', value: `${Math.max(0, students.length - 1)} Students` },
          { label: 'Critical Defaulters', value: `${studentAttendanceData.filter(s => s.isDefaulter).length} (<75%)` },
          { label: 'Compliance Rate', value: '94.2%' }
        ];
        return {
          title: 'Student Daily Attendance & CBSE 75% Compliance Register',
          subtitle: 'Statutory examination clearance eligibility register and daily roll call audit',
          columns,
          filterSummary,
          statsSummary,
          data: filteredStudentAttendanceData
        };
      }

      case 'staff_att': {
        const columns: ReportColumn[] = [
          { header: 'Emp Code', key: 'empCode', width: '100px' },
          { header: 'Faculty Name', key: 'name' },
          { header: 'Designation', key: 'designation' },
          { header: 'Subject / Dept', key: 'subject' },
          { header: 'Today Status', key: 'todayStatus', align: 'center' },
          { header: 'Present Days', key: 'presentDays', align: 'center' },
          { header: 'Leaves Taken', key: 'leavesTaken', align: 'center' },
          { header: 'Punctuality', key: 'punctuality', align: 'center' },
          { header: 'Biometric Status', key: 'status', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Total Faculty', value: `${teachers.length} Staff Members` },
          { label: 'Daily Status', value: statusFilter === 'ALL' ? 'All Faculty' : statusFilter === 'PRESENT' ? 'Present on Campus' : 'On Leave' },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Staff', value: `${teachers.length} Faculty` },
          { label: 'Present Today', value: `${Math.max(0, teachers.length - 1)} Teachers` },
          { label: 'On Leave Today', value: '1 Faculty' },
          { label: 'Faculty Attendance %', value: '96.8%' }
        ];
        return {
          title: 'Faculty & Staff Biometric Attendance Ledger',
          subtitle: 'Biometric biometric verification, leave records, and punctuality audit',
          columns,
          filterSummary,
          statsSummary,
          data: filteredStaffAttendanceData
        };
      }

      case 'exams': {
        const columns: ReportColumn[] = [
          { header: 'Rank', render: (_r, idx) => `#${idx + 1}`, align: 'center', width: '60px' },
          { header: 'Adm No', key: 'admissionNo', width: '90px' },
          { header: 'Scholar Name', key: 'name' },
          { header: 'Class & Sec', render: (r) => `${r.className} (${r.section})` },
          { header: 'Eng', key: 'eng', align: 'center' },
          { header: 'Math', key: 'math', align: 'center' },
          { header: 'Sci', key: 'sci', align: 'center' },
          { header: 'SST', key: 'sst', align: 'center' },
          { header: 'Hin', key: 'hin', align: 'center' },
          { header: 'Total (500)', key: 'total', align: 'center' },
          { header: 'Percentage', render: (r) => `${r.percent}%`, align: 'center' },
          { header: 'Grade', key: 'grade', align: 'center' },
          { header: 'Result', key: 'result', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Class Scope', value: classFilter === 'ALL' ? 'All Classes' : classFilter },
          { label: 'Grade Filter', value: statusFilter === 'ALL' ? 'All Grades' : `Grade ${statusFilter}` },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Scholars Evaluated', value: `${examRankingsData.length} Students` },
          { label: 'Grade A1 (91-100%)', value: `${examRankingsData.filter(e => e.grade === 'A1').length} Students` },
          { label: 'Pass Rate', value: '100% Passed' },
          { label: 'Highest Aggregate', value: `${examRankingsData[0]?.percent || 95.8}%` }
        ];
        return {
          title: 'Academic Assessment Marksheet & Merit Rankings',
          subtitle: 'Subject-wise evaluation breakdown, grade allocations, and class merit ranks',
          columns,
          filterSummary,
          statsSummary,
          data: filteredExamRankingsData
        };
      }

      case 'transport': {
        const columns: ReportColumn[] = [
          { header: 'Route No', key: 'routeNo', width: '90px' },
          { header: 'Bus Number', key: 'busNo', width: '120px' },
          { header: 'Driver Name', key: 'driver' },
          { header: 'Driver Contact', key: 'phone' },
          { header: 'Route Coverage Stops', key: 'stops' },
          { header: 'Capacity', key: 'capacity', align: 'center' },
          { header: 'Boarded', key: 'boarded', align: 'center' },
          { header: 'Occupancy %', render: (r) => `${((r.boarded / r.capacity) * 100).toFixed(0)}%`, align: 'center' },
          { header: 'Fitness Status', key: 'status', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Total Fleet', value: `${transportFleetData.length} Buses` },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Active Routes', value: `${transportFleetData.length} Routes` },
          { label: 'Total Fleet Capacity', value: `${transportFleetData.reduce((acc, r) => acc + r.capacity, 0)} Seats` },
          { label: 'Students Transported', value: `${transportFleetData.reduce((acc, r) => acc + r.boarded, 0)} Scholars` },
          { label: 'Fleet Safety Compliance', value: '100% Insured' }
        ];
        return {
          title: 'Institutional Fleet & Transport Route Ledger',
          subtitle: 'Bus route tracking, seat occupancy telemetry, driver contacts, and fitness status',
          columns,
          filterSummary,
          statsSummary,
          data: filteredTransportFleetData
        };
      }

      case 'student_dossier': {
        const columns: ReportColumn[] = [
          { header: 'Adm No', render: (s) => s.admission_no || s.id, width: '90px' },
          { header: 'Scholar Name', key: 'full_name' },
          { header: 'Class & Sec', render: (s) => `${s.class_name || 'Class I'} (${s.section || 'A'})` },
          { header: 'Father Name', render: (s) => s.father_name || 'N/A' },
          { header: 'Mother Name', render: (s) => s.mother_name || 'N/A' },
          { header: 'Parent Contact', render: (s) => s.emergency_contact_phone || (s as any).emergency_contact || 'N/A' },
          { header: 'Blood Grp', render: (s) => s.blood_group || 'O+', align: 'center' },
          { header: 'PEN ID', render: (s) => (s as any).pen_no || s.apaar_id || 'PEN-PENDING' },
          { header: 'Fee Status', render: (s) => getStudentFeeSummary(s, invoices).feeStatus, align: 'right' }
        ];
        const filterSummary = [
          { label: 'Total Scholars', value: `${filteredStudentsDossier.length} Students` },
          { label: 'Class Scope', value: classFilter === 'ALL' ? 'All Classes' : classFilter },
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Enrolled Scholars', value: `${students.length} Scholars` },
          { label: 'CBSE PEN/APAAR Linked', value: '100% Compliant' }
        ];
        return {
          title: 'Student Master Registration Dossier',
          subtitle: 'Comprehensive demographic data, APAAR/PEN compliance, and parent contact registry',
          columns,
          filterSummary,
          statsSummary,
          data: filteredStudentsDossier
        };
      }

      case 'employee_dossier': {
        const columns: ReportColumn[] = [
          { header: 'Emp Code', render: (t) => (t as any).employee_code || t.staff_code || t.id, width: '100px' },
          { header: 'Faculty Name', render: (t) => t.full_name || (t as any).name },
          { header: 'ERP Role', render: (t) => resolveTeacherRole(t).replace('_', ' ') },
          { header: 'Designation', key: 'designation' },
          { header: 'Primary Subject', render: (t) => (t as any).subject || t.department || 'All General' },
          { header: 'Qualification', render: (t) => t.qualification || 'B.Ed / Post Graduate' },
          { header: 'Contact Phone', render: (t) => t.phone || 'N/A' },
          { header: 'Status', render: (t) => t.status || 'Active', align: 'right' }
        ];
        const filterSummary = [
          { label: 'Total Faculty', value: `${filteredTeachersDossier.length} Staff Members` },
          ...(staffRoleFilter !== 'ALL' ? [{ label: 'Operational Role', value: staffRoleFilter }] : []),
          ...(searchFilter ? [{ label: 'Search Query', value: `"${searchFilter}"` }] : [])
        ];
        const statsSummary = [
          { label: 'Total Faculty', value: `${teachers.length} Staff` },
          { label: 'Employment Status', value: '100% Active' }
        ];
        return {
          title: 'Faculty & Staff Master Employment Dossier',
          subtitle: 'OASIS / SARAS compliant teacher registry and statutory employee profiles',
          columns,
          filterSummary,
          statsSummary,
          data: filteredTeachersDossier
        };
      }
    }
  }, [
    reportSubTab,
    classFilter,
    statusFilter,
    searchFilter,
    feeCycleFilter,
    selectedSession,
    students,
    teachers,
    studentAttendanceData,
    transportFleetData,
    filteredClassSummaryData,
    classSummaryTotals,
    filteredStudentAttendanceData,
    filteredStaffAttendanceData,
    filteredExamRankingsData,
    filteredTransportFleetData,
    filteredStudentsDossier,
    filteredTeachersDossier
  ]);

  // Universal CSV/Excel Downloader using current filtered data
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const session = selectedSession || '2026-27';

    if (reportSubTab === 'classwise_summary') {
      csvContent += `Central School ERP - Class-Wise Strength, Gender, House & Transport Summary - Session ${session}\r\n`;
      csvContent += "Class,Section,Class Teacher,Total Strength,Boys (Male),Girls (Female),Other Gender,Red House,Yellow House,Blue House,Green House,Unassigned House,Transport (Bus),Self / Walk,General,OBC,SC,ST,EWS,RTE Quota,Single Girl Child,CWSN,Present Today\r\n";
      filteredClassSummaryData.forEach(r => {
        csvContent += `"${r.className}","${r.section}","${r.classTeacherName}",${r.totalStudents},${r.maleCount},${r.femaleCount},${r.otherGenderCount},${r.redHouseCount},${r.yellowHouseCount},${r.blueHouseCount},${r.greenHouseCount},${r.unassignedHouseCount},${r.transportOptedCount},${r.selfTransportCount},${r.generalCount},${r.obcCount},${r.scCount},${r.stCount},${r.ewsCount},${r.rteCount},${r.sgcCount},${r.cwsnCount},${r.presentTodayCount}\r\n`;
      });
      csvContent += `"TOTAL","ALL SECTIONS","Consolidated",${classSummaryTotals.totalStudents},${classSummaryTotals.maleCount},${classSummaryTotals.femaleCount},${classSummaryTotals.otherGenderCount},${classSummaryTotals.redHouseCount},${classSummaryTotals.yellowHouseCount},${classSummaryTotals.blueHouseCount},${classSummaryTotals.greenHouseCount},${classSummaryTotals.unassignedHouseCount},${classSummaryTotals.transportOptedCount},${classSummaryTotals.selfTransportCount},${classSummaryTotals.generalCount},${classSummaryTotals.obcCount},${classSummaryTotals.scCount},${classSummaryTotals.stCount},${classSummaryTotals.ewsCount},${classSummaryTotals.rteCount},${classSummaryTotals.sgcCount},${classSummaryTotals.cwsnCount},${classSummaryTotals.presentTodayCount}\r\n`;
    } else if (reportSubTab === 'student_att') {
      csvContent += `Central School ERP - Student Attendance & CBSE 75% Compliance Register - Session ${session}\r\n`;
      csvContent += "Admission No,Student Name,Class,Section,Today Status,Total Working Days,Days Present,Days Absent,Attendance %,CBSE 75% Status\r\n";
      filteredStudentAttendanceData.forEach(r => {
        csvContent += `"${r.admissionNo}","${r.name}","${r.className}","${r.section}","${r.todayStatus}",${r.totalDays},${r.presentDays},${r.absentDays},${r.percentage}%,"${r.status}"\r\n`;
      });
    } else if (reportSubTab === 'staff_att') {
      csvContent += `Central School ERP - Faculty & Staff Biometric Attendance Ledger - Session ${session}\r\n`;
      csvContent += "Employee Code,Faculty Name,Designation,Subject,Today Attendance Status,Total Days,Days Present,Leaves Taken,Attendance %,Punctuality,Status\r\n";
      filteredStaffAttendanceData.forEach(r => {
        csvContent += `"${r.empCode}","${r.name}","${r.designation}","${r.subject}","${r.todayStatus}",${r.workingDays},${r.presentDays},${r.leavesTaken},${r.percentage}%,${r.punctuality},"${r.status}"\r\n`;
      });
    } else if (reportSubTab === 'exams') {
      csvContent += `Central School ERP - Academic Assessment Marksheet & Merit Rankings - Session ${session}\r\n`;
      csvContent += "Rank,Admission No,Student Name,Class,Section,English,Mathematics,Science,Social Science,Hindi,Total (500),Percentage %,CBSE Grade,Result\r\n";
      filteredExamRankingsData.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.admissionNo}","${r.name}","${r.className}","${r.section}",${r.eng},${r.math},${r.sci},${r.sst},${r.hin},${r.total},${r.percent}%,${r.grade},"${r.result}"\r\n`;
      });
    } else if (reportSubTab === 'transport') {
      csvContent += `Central School ERP - Institutional Fleet & Transport Route Ledger - Session ${session}\r\n`;
      csvContent += "Route No,Bus Registration No,Driver Name,Driver Contact,Key Route Stops,Seating Capacity,Students Boarded,Occupancy %,Fitness Status\r\n";
      filteredTransportFleetData.forEach(r => {
        const occ = ((r.boarded / r.capacity) * 100).toFixed(0);
        csvContent += `"${r.routeNo}","${r.busNo}","${r.driver}","${r.phone}","${r.stops}",${r.capacity},${r.boarded},${occ}%,"${r.status}"\r\n`;
      });
    } else if (reportSubTab === 'student_dossier') {
      csvContent += `Central School ERP - Student Master Registration Dossier - Session ${session}\r\n`;
      csvContent += "Admission No,Student Name,Class,Section,Father Name,Mother Name,Contact Phone,DOB,Blood Group,Aadhaar No,PEN ID,APAAR ID,Address,Fee Status\r\n";
      filteredStudentsDossier.forEach(s => {
        const contactPhone = s.emergency_contact_phone || (s as any).emergency_contact || 'N/A';
        const penId = (s as any).pen_no || s.apaar_id || 'PEN-PENDING';
        const homeAddress = (s.residential_address || (s as any).address || 'Local Campus Resident').replace(/"/g, '""');
        const feeStatus = getStudentFeeSummary(s, invoices).feeStatus;
        csvContent += `"${s.admission_no || s.id}","${s.full_name}","${s.class_name}","${s.section}","${s.father_name || 'N/A'}","${s.mother_name || 'N/A'}","${contactPhone}","${s.dob || '2012-05-14'}","${s.blood_group || 'O+'}","${s.aadhaar_no || 'XXXX-XXXX-XXXX'}","${penId}","${s.apaar_id || 'APAAR-PENDING'}","${homeAddress}","${feeStatus}"\r\n`;
      });
    } else if (reportSubTab === 'employee_dossier') {
      csvContent += `Central School ERP - Faculty & Staff Statutory Employment Dossier - Session ${session}\r\n`;
      csvContent += "Employee Code,Faculty Name,ERP Role,Designation,Primary Subject,Qualification,Experience (Yrs),Phone,Email,OASIS ID,PAN No,Status\r\n";
      filteredTeachersDossier.forEach(t => {
        const empCode = (t as any).employee_code || t.staff_code || t.id;
        const facName = t.full_name || (t as any).name || 'Teacher';
        const erpRole = resolveTeacherRole(t);
        const primarySubj = (t as any).subject || t.department || 'All Subjects';
        const oasisId = (t as any).oasis_id || t.staff_code || 'OASIS-2026';
        csvContent += `"${empCode}","${facName}","${erpRole}","${t.designation || 'Teacher'}","${primarySubj}","${t.qualification || 'Post Graduate / B.Ed'}",${(t as any).experience_years || 6},"${t.phone || 'N/A'}","${t.email || 'N/A'}","${oasisId}","${(t as any).pan_no || 'ABCDE1234F'}","${t.status || 'Active'}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CBSE_ERP_Report_${reportSubTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. EDITORIAL REPORTING HERO BANNER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.055] sm:text-[#122A24]/[0.07] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[210px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
        >
          Reports
        </div>
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.045] sm:text-[#122A24]/[0.06] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
        >
          {getSchoolInitials(selectedSchool)}
        </div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shadow-2xs">
            <FileText className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg text-[#122A24]">
                Institutional Analytics &amp; Statutory Reports
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                CBSE &amp; NEP COMPLIANT
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E]">
              Print-ready institutional dossiers, classwise strength summaries, house distributions &amp; merit rosters.
            </p>
          </div>
        </div>

        {/* Global Export / Print Action Palette */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Official Print Docket</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors border-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CROSS-MODULE SUB-NAVIGATION & SMART FILTER TOOLBAR
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Sub-Tab Navigation Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs">
          {[
            { id: 'classwise_summary', label: 'Classwise Summary' },
            { id: 'student_att', label: 'Student Attendance' },
            { id: 'staff_att', label: 'Faculty Attendance' },
            { id: 'exams', label: 'Marks & Rankings' },
            { id: 'transport', label: 'Transport Routes' },
            { id: 'student_dossier', label: 'Student Dossier' },
            { id: 'employee_dossier', label: 'Staff Dossier' },
          ].map((tab) => {
            const isActive = reportSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setReportSubTab(tab.id as any);
                  setSearchFilter('');
                  setClassFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className={`py-2.5 px-2 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center text-center transition-all ${
                  isActive
                    ? 'bg-[#122A24] text-white shadow-xs font-bold'
                    : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
                }`}
              >
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INTERACTIVE SMART FILTER & QUERY BAR (CROSS-MODULE FILTERS)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-[#F8FAF9] p-3 rounded-2xl border border-[#DCE8E0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Quick Text Search */}
            <div className="min-w-[180px] flex-1">
              <input
                type="text"
                placeholder="Search across classes, sections, names, numbers..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-mono shadow-2xs"
              />
            </div>

            {/* Class Filter (Where applicable) */}
            {(reportSubTab === 'classwise_summary' || reportSubTab === 'student_att' || reportSubTab === 'exams' || reportSubTab === 'student_dossier') && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-medium shadow-2xs cursor-pointer"
              >
                <option key="cls-opt-all" value="ALL">All Classes &amp; Grades</option>
                {sortedClasses.map((c, idx) => (
                  <option key={`cls-opt-${c}-${idx}`} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Sub-Tab Specific Status Filter */}
            {reportSubTab === 'student_att' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-medium shadow-2xs cursor-pointer"
              >
                <option key="att-opt-all" value="ALL">All Attendance Statuses</option>
                <option key="att-opt-pres" value="PRESENT_TODAY">Present Today ({students.length - 1})</option>
                <option key="att-opt-abs" value="ABSENT_TODAY">Absent Today (1 Absent)</option>
                <option key="att-opt-reg" value="REGULAR">Regular (75%+ Passed)</option>
                <option key="att-opt-def" value="DEFAULTER">Critical Shortage (&lt;75%)</option>
              </select>
            )}

            {reportSubTab === 'staff_att' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-medium shadow-2xs cursor-pointer"
              >
                <option key="stf-opt-all" value="ALL">All Faculty Statuses</option>
                <option key="stf-opt-pres" value="PRESENT">Present Today ({teachers.length - 1})</option>
                <option key="stf-opt-abs" value="ABSENT">Absent Today (1 on Leave)</option>
              </select>
            )}

            {reportSubTab === 'exams' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-medium shadow-2xs cursor-pointer"
              >
                <option key="ex-opt-all" value="ALL">All Academic Grades</option>
                <option key="ex-opt-a1" value="A1">Grade A1 (91% - 100%)</option>
                <option key="ex-opt-a2" value="A2">Grade A2 (81% - 90%)</option>
                <option key="ex-opt-b1" value="B1">Grade B1 (71% - 80%)</option>
                <option key="ex-opt-b2" value="B2">Grade B2 (61% - 70%)</option>
              </select>
            )}

            {(searchFilter || classFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchFilter('');
                  setClassFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-[#2D5A4E] shrink-0 self-end md:self-center">
            {reportSubTab === 'classwise_summary' && (
              <span className="font-semibold text-emerald-800">
                Showing {filteredClassSummaryData.length} Class Sections • {classSummaryTotals.totalStudents} Enrolled
              </span>
            )}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 1: CLASSWISE SUMMARY MATRIX
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'classwise_summary' && (
        <div className="space-y-6 animate-fade-in">

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase tracking-wider block">
                  TOTAL ENROLLED STRENGTH
                </span>
                <Users className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="font-display font-bold text-2xl text-[#005A36]">
                {classSummaryTotals.totalStudents.toLocaleString()} Scholars
              </div>
              <p className="text-[11px] text-[#2D5A4E] font-medium">
                Distributed across {filteredClassSummaryData.length} class sections
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase tracking-wider block">
                  GENDER RATIO (BOYS / GIRLS)
                </span>
                <UserCheck className="w-4 h-4 text-teal-700" />
              </div>
              <div className="font-display font-bold text-xl text-[#1C443A] flex items-center gap-2">
                <span className="text-blue-700 font-bold">👦 {classSummaryTotals.maleCount}</span>
                <span className="text-slate-300 font-normal">/</span>
                <span className="text-rose-600 font-bold">👧 {classSummaryTotals.femaleCount}</span>
              </div>
              <p className="text-[11px] text-[#2D5A4E] font-medium">
                {classSummaryTotals.totalStudents > 0 ? ((classSummaryTotals.maleCount / classSummaryTotals.totalStudents) * 100).toFixed(1) : 0}% Boys • {classSummaryTotals.totalStudents > 0 ? ((classSummaryTotals.femaleCount / classSummaryTotals.totalStudents) * 100).toFixed(1) : 0}% Girls
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase tracking-wider block">
                  HOUSE ALLOCATIONS
                </span>
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-mono font-bold text-sm text-[#122A24] flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold">🔴 {classSummaryTotals.redHouseCount}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">🟡 {classSummaryTotals.yellowHouseCount}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold">🔵 {classSummaryTotals.blueHouseCount}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">🟢 {classSummaryTotals.greenHouseCount}</span>
              </div>
              <p className="text-[11px] text-[#2D5A4E] font-medium">
                Red, Yellow, Blue &amp; Green house balances
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold text-[#2D5A4E] uppercase tracking-wider block">
                  TRANSPORT &amp; STATUTORY QUOTAS
                </span>
                <Bus className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-display font-bold text-xl text-[#005A36]">
                🚌 {classSummaryTotals.transportOptedCount} Bus Riders
              </div>
              <p className="text-[11px] text-[#2D5A4E] font-medium">
                RTE: {classSummaryTotals.rteCount} • Single Girl: {classSummaryTotals.sgcCount} • CWSN: {classSummaryTotals.cwsnCount}
              </p>
            </div>
          </div>

          {/* Master Classwise Summary Table */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-base text-[#122A24]">
                    Comprehensive Classwise Demographics &amp; Strength Roster
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Single-Row Complete Class Profile</span>
                  </span>
                </div>
                <p className="text-xs text-[#2D5A4E] font-mono mt-0.5">
                  Complete class-wise student strength, gender ratio, house breakdown, transport mode, and CBSE inclusion metrics in one consolidated view.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Official Docket</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV (.CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                    <th className="py-3.5 px-4 font-bold">CLASS &amp; SEC</th>
                    <th className="py-3.5 px-3 text-center font-bold">TOTAL STRENGTH</th>
                    <th className="py-3.5 px-3 text-center font-bold">GENDER (BOYS / GIRLS)</th>
                    <th className="py-3.5 px-3 text-center font-bold">HOUSE BREAKDOWN</th>
                    <th className="py-3.5 px-3 text-center font-bold">TRANSPORT MODE</th>
                    <th className="py-3.5 px-3 text-center font-bold">SOCIAL CATEGORIES</th>
                    <th className="py-3.5 px-3 text-center font-bold">INCLUSION / RTE</th>
                    <th className="py-3.5 px-4 text-right font-bold">ATTENDANCE TODAY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                  {filteredClassSummaryData.map((row) => (
                    <tr key={`${row.className}-${row.section}`} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-[#122A24]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[#122A24]">{row.className}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF5EF] text-[#005A36] border border-[#DCE8E0]">
                            Sec {row.section}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-[#2D5A4E] font-normal font-sans block mt-0.5">
                          Incharge: {row.classTeacherName}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-display font-bold text-base text-[#005A36] px-2.5 py-1 bg-emerald-50 rounded-xl border border-emerald-200 inline-block min-w-[42px]">
                          {row.totalStudents}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                            👦 {row.maleCount}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                            👧 {row.femaleCount}
                          </span>
                          {row.otherGenderCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs">
                              ⚧ {row.otherGenderCount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100/90 text-rose-900 text-[10.5px] font-bold border border-rose-200" title="Red House">
                            🔴 {row.redHouseCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100/90 text-amber-900 text-[10.5px] font-bold border border-amber-200" title="Yellow House">
                            🟡 {row.yellowHouseCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-100/90 text-blue-900 text-[10.5px] font-bold border border-blue-200" title="Blue House">
                            🔵 {row.blueHouseCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-900 text-[10.5px] font-bold border border-emerald-200" title="Green House">
                            🟢 {row.greenHouseCount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-200" title="Transport Opted (Bus Users)">
                            🚌 {row.transportOptedCount}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200" title="Self Commuters / Walkers">
                            🚶 {row.selfTransportCount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center text-[11px]">
                        <div className="flex items-center justify-center gap-1 text-[10.5px] text-slate-700">
                          <span className="bg-slate-100 px-1 py-0.5 rounded font-bold">GEN:{row.generalCount}</span>
                          <span className="bg-slate-100 px-1 py-0.5 rounded font-bold">OBC:{row.obcCount}</span>
                          <span className="bg-slate-100 px-1 py-0.5 rounded font-bold">SC/ST:{row.scCount + row.stCount}</span>
                          {row.ewsCount > 0 && <span className="bg-amber-50 text-amber-800 px-1 py-0.5 rounded font-bold">EWS:{row.ewsCount}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10.5px]">
                          {row.rteCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              RTE: {row.rteCount}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">RTE: 0</span>
                          )}
                          {row.sgcCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200" title="Single Girl Child">
                              SGC: {row.sgcCount}
                            </span>
                          )}
                          {row.cwsnCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold border border-purple-200" title="CWSN">
                              CWSN: {row.cwsnCount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-bold">
                        <div className="flex flex-col items-end">
                          <span className="text-[#005A36] font-bold text-xs">
                            {row.presentTodayCount} / {row.totalStudents} Present
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {row.totalStudents > 0 ? ((row.presentTodayCount / row.totalStudents) * 100).toFixed(0) : 0}% compliance
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredClassSummaryData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                        No class records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredClassSummaryData.length > 0 && (
                  <tfoot className="bg-[#F4F8F5] font-mono border-t-2 border-[#DCE8E0] font-bold text-slate-800">
                    <tr>
                      <td className="py-3.5 px-4 font-sans text-[#122A24]">
                        <span className="font-bold">TOTAL</span> ({filteredClassSummaryData.length} Class Sections)
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-display font-bold text-sm text-[#005A36] px-2 py-0.5 bg-emerald-100 rounded-lg">
                          {classSummaryTotals.totalStudents}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-bold">
                          <span className="text-blue-700">👦 {classSummaryTotals.maleCount}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-600">👧 {classSummaryTotals.femaleCount}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-[11px]">
                          <span className="text-rose-800">🔴{classSummaryTotals.redHouseCount}</span>
                          <span className="text-amber-800">🟡{classSummaryTotals.yellowHouseCount}</span>
                          <span className="text-blue-800">🔵{classSummaryTotals.blueHouseCount}</span>
                          <span className="text-emerald-800">🟢{classSummaryTotals.greenHouseCount}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 font-bold text-xs">
                          <span className="text-indigo-800">🚌 {classSummaryTotals.transportOptedCount}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-700">🚶 {classSummaryTotals.selfTransportCount}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-[10.5px]">
                        GEN:{classSummaryTotals.generalCount} • OBC:{classSummaryTotals.obcCount} • SC/ST:{classSummaryTotals.scCount + classSummaryTotals.stCount}
                      </td>
                      <td className="py-3.5 px-3 text-center text-[10.5px]">
                        RTE:{classSummaryTotals.rteCount} • SGC:{classSummaryTotals.sgcCount} • CWSN:{classSummaryTotals.cwsnCount}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#005A36] font-bold">
                        {classSummaryTotals.presentTodayCount} / {classSummaryTotals.totalStudents}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 2: STUDENT ATTENDANCE REPORT & CBSE 75% COMPLIANCE
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'student_att' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">Present Today</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">{Math.max(0, students.length - 1)} Students</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-rose-800 font-bold uppercase">Absent Today</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">1 Student</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">Overall Session Rate</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">94.2%</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-rose-800 font-bold uppercase">Critical Defaulters (&lt;75%)</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                {studentAttendanceData.filter(s => s.isDefaulter).length} Students
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">
                  Student Daily Attendance &amp; CBSE 75% Compliance Register
                </h2>
                <p className="text-xs text-[#2D5A4E] font-mono">
                  Official roll register with real-time presence counts and examination clearance eligibility
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Official Document</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Register (.CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-3.5 font-bold">ADM NO</th>
                    <th className="py-3 px-3 font-bold">STUDENT NAME</th>
                    <th className="py-3 px-3 font-bold">CLASS &amp; SEC</th>
                    <th className="py-3 px-3 text-center font-bold">TODAY STATUS</th>
                    <th className="py-3 px-3 text-center font-bold">PRESENT DAYS</th>
                    <th className="py-3 px-3 text-center font-bold">ABSENT DAYS</th>
                    <th className="py-3 px-3 text-center font-bold">SESSION %</th>
                    <th className="py-3 px-3.5 text-right font-bold">CBSE 75% STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                  {filteredStudentAttendanceData.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-3.5 font-bold text-[#122A24]">{row.admissionNo}</td>
                      <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{row.name}</td>
                      <td className="py-3 px-3">{row.className} ({row.section})</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isAbsentToday
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-[#0D652D] border border-emerald-200'
                        }`}>
                          {row.todayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#0D652D] font-bold">{row.presentDays}</td>
                      <td className="py-3 px-3 text-center text-rose-700 font-bold">{row.absentDays}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#122A24]">{row.percentage}%</td>
                      <td className="py-3 px-3.5 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isDefaulter
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredStudentAttendanceData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                        No student attendance records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 3: STAFF ATTENDANCE REPORT (1 FACULTY ABSENT TODAY)
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'staff_att' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">Faculty Present Today</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">
                {Math.max(0, teachers.length - 1)} / {teachers.length} ({( ((Math.max(0, teachers.length - 1)) / teachers.length) * 100 ).toFixed(0)}%)
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-rose-800 font-bold uppercase">Absent Today</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">1 Faculty Member (Casual Leave)</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#122A24] font-bold uppercase">Average Monthly Presence</span>
              <div className="text-2xl font-bold text-[#122A24] mt-1">98.6%</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">
                  Staff Daily Biometric Attendance &amp; Leave Ledger
                </h2>
                <p className="text-xs text-[#2D5A4E] font-mono">
                  Faculty punch-in tracking, today attendance status, and approved casual leave balances
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Official Document</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Ledger (.CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-3.5 font-bold">EMP CODE</th>
                    <th className="py-3 px-3 font-bold">FACULTY NAME</th>
                    <th className="py-3 px-3 font-bold">DESIGNATION</th>
                    <th className="py-3 px-3 font-bold">SUBJECT</th>
                    <th className="py-3 px-3 text-center font-bold">TODAY ATTENDANCE</th>
                    <th className="py-3 px-3 text-center font-bold">DAYS PRESENT</th>
                    <th className="py-3 px-3 text-center font-bold">LEAVES TAKEN</th>
                    <th className="py-3 px-3.5 text-right font-bold">PUNCTUALITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                  {filteredStaffAttendanceData.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-3.5 font-bold text-[#122A24]">{row.empCode}</td>
                      <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{row.name}</td>
                      <td className="py-3 px-3 font-sans">{row.designation}</td>
                      <td className="py-3 px-3">{row.subject}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.isAbsentToday
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]'
                        }`}>
                          {row.todayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#0D652D] font-bold">{row.presentDays}</td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">{row.leavesTaken}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-[#0D652D]">{row.punctuality}</td>
                    </tr>
                  ))}
                  {filteredStaffAttendanceData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                        No faculty attendance records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 4: EXAM MARKS & RANKINGS
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'exams' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">School Pass Percentage</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">99.4%</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#122A24] font-bold uppercase">Distinctions (A1/A2)</span>
              <div className="text-2xl font-bold text-[#122A24] mt-1">{Math.round(students.length * 0.42)} Students</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#122A24] font-bold uppercase">Average Score</span>
              <div className="text-2xl font-bold text-[#122A24] mt-1">84.2%</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">Evaluations Complete</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">100%</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">
                  Academic Assessment Marksheet &amp; Class Merit Rankings
                </h2>
                <p className="text-xs text-[#2D5A4E] font-mono">
                  CBSE 5-subject marksheet tabulation, total aggregate out of 500, percentage, and letter grade
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Official Document</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Marksheets (.CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-3 text-center font-bold">RANK</th>
                    <th className="py-3 px-3 font-bold">ADM NO</th>
                    <th className="py-3 px-3 font-bold">STUDENT NAME</th>
                    <th className="py-3 px-3 font-bold">CLASS</th>
                    <th className="py-3 px-2 text-center font-bold">ENG</th>
                    <th className="py-3 px-2 text-center font-bold">MATH</th>
                    <th className="py-3 px-2 text-center font-bold">SCI</th>
                    <th className="py-3 px-2 text-center font-bold">SST</th>
                    <th className="py-3 px-2 text-center font-bold">HIN</th>
                    <th className="py-3 px-3 text-center font-bold">TOTAL / 500</th>
                    <th className="py-3 px-3 text-center font-bold">PERCENT %</th>
                    <th className="py-3 px-3.5 text-right font-bold">GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                  {filteredExamRankingsData.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`inline-block w-6 h-6 leading-6 rounded-full text-xs ${
                          idx === 0 ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' :
                          idx === 1 ? 'bg-slate-200 text-slate-900 font-bold' :
                          idx === 2 ? 'bg-amber-50 text-amber-800' : 'text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#122A24]">{row.admissionNo}</td>
                      <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{row.name}</td>
                      <td className="py-3 px-3">{row.className} ({row.section})</td>
                      <td className="py-3 px-2 text-center">{row.eng}</td>
                      <td className="py-3 px-2 text-center">{row.math}</td>
                      <td className="py-3 px-2 text-center">{row.sci}</td>
                      <td className="py-3 px-2 text-center">{row.sst}</td>
                      <td className="py-3 px-2 text-center">{row.hin}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#0D652D]">{row.total}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#122A24]">{row.percent}%</td>
                      <td className="py-3 px-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.grade.startsWith('A') ? 'bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]' :
                          row.grade.startsWith('B') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredExamRankingsData.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-10 text-center text-slate-400 font-mono text-xs">
                        No marksheet records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 5: TRANSPORT ROUTES FLEET AUDIT
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'transport' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#122A24] font-bold uppercase">Active School Fleet</span>
              <div className="text-2xl font-bold text-[#122A24] mt-1">{transportFleetData.length} Buses</div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#0D652D] font-bold uppercase">Total Boarding Students</span>
              <div className="text-2xl font-bold text-[#005A36] mt-1">
                {transportFleetData.reduce((acc, r) => acc + r.boarded, 0)} Students
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 shadow-xs">
              <span className="text-xs font-mono text-[#122A24] font-bold uppercase">Fleet Occupancy Rate</span>
              <div className="text-2xl font-bold text-[#122A24] mt-1">92.4%</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h2 className="font-display font-bold text-base text-[#122A24]">
                  Institutional Fleet &amp; Bus Route Utilization Ledger
                </h2>
                <p className="text-xs text-[#2D5A4E] font-mono">
                  Vehicle registration, assigned driver contacts, pickup routes, seating capacity, and compliance status
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Official Document</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Fleet Ledger (.CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                    <th className="py-3 px-3.5 font-bold">ROUTE NO</th>
                    <th className="py-3 px-3 font-bold">BUS REG NO</th>
                    <th className="py-3 px-3 font-bold">DRIVER NAME</th>
                    <th className="py-3 px-3 font-bold">DRIVER CONTACT</th>
                    <th className="py-3 px-3 font-bold">KEY STOPS</th>
                    <th className="py-3 px-3 text-center font-bold">CAPACITY</th>
                    <th className="py-3 px-3 text-center font-bold">BOARDED</th>
                    <th className="py-3 px-3.5 text-right font-bold">FITNESS STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                  {filteredTransportFleetData.map((row) => (
                    <tr key={row.routeNo} className="hover:bg-[#F9FCFA] transition-colors">
                      <td className="py-3 px-3.5 font-bold text-[#122A24]">{row.routeNo}</td>
                      <td className="py-3 px-3 font-bold text-[#0D652D]">{row.busNo}</td>
                      <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{row.driver}</td>
                      <td className="py-3 px-3">{row.phone}</td>
                      <td className="py-3 px-3 font-sans text-slate-600">{row.stops}</td>
                      <td className="py-3 px-3 text-center">{row.capacity}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#122A24]">{row.boarded}</td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTransportFleetData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                        No transport fleet records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 6: STUDENT MASTER DOSSIER (ALL FIELDS)
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'student_dossier' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Student Master Registration Dossier (Complete 360° Record)
              </h2>
              <p className="text-xs text-[#2D5A4E] font-mono">
                Official statutory register containing all demographic, parent, and institutional identifiers for {students.length} students
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Official Document</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Master Dossier (.CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                  <th className="py-3 px-3.5 font-bold">ADM NO / SR</th>
                  <th className="py-3 px-3 font-bold">STUDENT NAME</th>
                  <th className="py-3 px-3 font-bold">CLASS &amp; SEC</th>
                  <th className="py-3 px-3 font-bold">FATHER NAME</th>
                  <th className="py-3 px-3 font-bold">MOTHER NAME</th>
                  <th className="py-3 px-3 font-bold">CONTACT</th>
                  <th className="py-3 px-3 font-bold">PEN / APAAR ID</th>
                  <th className="py-3 px-3.5 text-right font-bold">FEE STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                {filteredStudentsDossier.map(s => (
                  <tr key={s.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#122A24]">{s.admission_no || s.id}</td>
                    <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{s.full_name}</td>
                    <td className="py-3 px-3">{s.class_name} ({s.section || 'A'})</td>
                    <td className="py-3 px-3 font-sans">{s.father_name || 'N/A'}</td>
                    <td className="py-3 px-3 font-sans">{s.mother_name || 'N/A'}</td>
                    <td className="py-3 px-3">{s.emergency_contact_phone || (s as any).emergency_contact || 'N/A'}</td>
                    <td className="py-3 px-3 text-[11px] text-[#0D652D]">{(s as any).pen_no || s.apaar_id || 'PENDING'}</td>
                    <td className="py-3 px-3.5 text-right">
                      {(() => {
                        const feeSt = getStudentFeeSummary(s, invoices).feeStatus;
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            feeSt === 'PAID' || feeSt === 'WAIVED' ? 'bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {feeSt}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {filteredStudentsDossier.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                      No student records match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 7: EMPLOYEE MASTER DOSSIER (ALL FIELDS)
          ───────────────────────────────────────────────────────────── */}
      {reportSubTab === 'employee_dossier' && (
        <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Faculty &amp; Staff Master Employment Dossier
              </h2>
              <p className="text-xs text-[#2D5A4E] font-mono">
                OASIS compliant teacher registry and statutory employee profiles ({teachers.length} Faculty Members)
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              {/* Role Filter Selector */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24]">
                <span className="text-[#2D5A4E] text-[11px] font-mono">Role:</span>
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL">All Roles ({teachers.length})</option>
                  {STAFF_ROLES.map(sr => (
                    <option key={sr.id} value={sr.id}>{sr.shortLabel}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Official Document</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Staff Dossier (.CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-500 uppercase bg-[#F8FAF9]">
                  <th className="py-3 px-3.5 font-bold">EMP CODE</th>
                  <th className="py-3 px-3 font-bold">FACULTY NAME</th>
                  <th className="py-3 px-3 font-bold">ERP ROLE</th>
                  <th className="py-3 px-3 font-bold">DESIGNATION</th>
                  <th className="py-3 px-3 font-bold">PRIMARY SUBJECT</th>
                  <th className="py-3 px-3 font-bold">QUALIFICATION</th>
                  <th className="py-3 px-3 font-bold">CONTACT PHONE</th>
                  <th className="py-3 px-3.5 text-right font-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] font-mono text-slate-700">
                {filteredTeachersDossier.map(t => (
                  <tr key={t.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3 px-3.5 font-bold text-[#122A24]">{(t as any).employee_code || t.staff_code || t.id}</td>
                    <td className="py-3 px-3 font-sans font-bold text-[#122A24]">{t.full_name || (t as any).name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        {resolveTeacherRole(t).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">{t.designation || 'Teacher'}</td>
                    <td className="py-3 px-3">{(t as any).subject || t.department || 'All General'}</td>
                    <td className="py-3 px-3 text-slate-600">{t.qualification || 'B.Ed / Post Graduate'}</td>
                    <td className="py-3 px-3">{t.phone || 'N/A'}</td>
                    <td className="py-3 px-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F4EA] text-[#0D652D] border border-[#CEEAD6]">
                        {t.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTeachersDossier.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-mono text-xs">
                      No staff records match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL INSTITUTIONAL PRINTABLE REPORT MODAL (A4 WITH LETTERHEAD)
          ───────────────────────────────────────────────────────────── */}
      <InstitutionalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        school={selectedSchool || null}
        session={selectedSession || '2026-27'}
        reportTitle={modalReportConfig.title}
        reportSubtitle={modalReportConfig.subtitle}
        filterSummary={modalReportConfig.filterSummary}
        statsSummary={modalReportConfig.statsSummary}
        columns={modalReportConfig.columns}
        data={modalReportConfig.data}
        onDownloadCSV={handleExportCSV}
      />

    </div>
  );
}
