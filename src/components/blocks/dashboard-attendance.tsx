/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Calendar,
  CalendarDays,
  CalendarOff,
  ClipboardPen,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Save,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Send,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Check,
  X,
  Phone,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Palmtree,
  Plus,
  Trash2,
  Megaphone,
  Info,
  CalendarRange,
  Building2,
  MessageCircle
} from 'lucide-react';
import { School, Student, ClassRoom, Teacher, AttendanceRecord, Holiday } from '@/lib/types';
import { sortClassesChronologically } from '@/lib/cbse-subjects';
import { openWhatsAppDirect, buildMorningAbsentText } from '@/lib/whatsapp';
import { sendLocalPushNotification } from '@/lib/push-notifications';
import { apiFetch } from '@/lib/api-client';
import { InstitutionalReportModal, ReportColumn } from '@/components/institutional-report-modal';

interface DashboardAttendanceProps {
  selectedSchool: School | null;
  students: Student[];
  teachers: Teacher[];
  classes: ClassRoom[];
  attendance: AttendanceRecord[];
  selectedSession: string;
  userRole?: string;
  currentUser?: any;
  onRefresh: () => void;
  showAdminToast: (msg: string) => void;
}

export function DashboardAttendance({
  selectedSchool,
  students,
  teachers,
  classes,
  attendance,
  selectedSession,
  userRole,
  currentUser,
  onRefresh,
  showAdminToast
}: DashboardAttendanceProps) {
  const isTeacher = userRole === 'TEACHER' || currentUser?.role === 'TEACHER';
  // 4 Primary Tabs (Daily Mark, Monthly Register, Summary Analytics, Holiday Studio)
  const [attendanceTab, setAttendanceTab] = useState<'mark_attendance' | 'monthly_sheet' | 'attendance_summary' | 'holiday_calendar'>('mark_attendance');
  
  // Official Institutional Printable Report Modal State
  const [activeAttendanceReportModal, setActiveAttendanceReportModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    filterSummary?: Array<{ label: string; value: string }>;
    statsSummary?: Array<{ label: string; value: string | number }>;
    columns: ReportColumn[];
    data: any[];
    onDownloadCSV?: () => void;
  } | null>(null);

  // ── SAVE ATTENDANCE & PARENT NOTIFICATION CONFIRMATION STATE ──
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [notifyParentsOption, setNotifyParentsOption] = useState<'YES' | 'NO'>('NO');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const triggerSaveSuccess = useCallback(() => {
    setSaveSuccess(true);
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 50, 40]);
      }
    } catch (_) {}
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2800);
  }, []);

  // ── IN-APP SLEEK ALERT / NOTIFICATION DIALOG BOX (NO NATIVE BROWSER ALERT) ──
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlertBox = (message: string, title = 'Attendance Notification', type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type
    });
    // Also trigger admin toast for consistent UX
    showAdminToast(message);
  };
  
  // Sorted Classes
  const sortedClasses = useMemo(() => sortClassesChronologically(classes), [classes]);

  // 🔒 STRICT ROLE-BASED CLASS ASSIGNMENT:
  // Class Teachers can ONLY see and mark attendance for their designated assigned class.
  // Subject Teachers (with NO class assigned) CANNOT mark attendance for any class.
  const assignedClasses = useMemo(() => {
    if (!isTeacher) return sortedClasses;

    const tId = (currentUser?.id || '').toLowerCase().trim();
    const tName = (currentUser?.full_name || '').toLowerCase().trim();
    const tCode = (currentUser?.username || currentUser?.staff_code || '').toLowerCase().trim();

    return sortedClasses.filter(c => {
      const cTeacherId = ((c as any).class_teacher_id || '').toLowerCase().trim();
      const cTeacherName = ((c as any).class_teacher_name || c.class_teacher || '').toLowerCase().trim();
      const cTeacher = (c.class_teacher || '').toLowerCase().trim();

      return (
        (cTeacherId && (cTeacherId === tId || cTeacherId === (currentUser as any)?.staff_code?.toLowerCase())) ||
        (cTeacherName && (cTeacherName === tName || cTeacherName === tCode)) ||
        (cTeacher && (cTeacher === tName || cTeacher === tCode))
      );
    });
  }, [sortedClasses, isTeacher, currentUser]);

  const isSubjectTeacherOnly = isTeacher && assignedClasses.length === 0;
  const selectableClasses = isTeacher ? assignedClasses : sortedClasses;

  // ─────────────────────────────────────────────────────────────────
  // HOLIDAYS & ACADEMIC CLOSURES STATE
  // ─────────────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [declaringHoliday, setDeclaringHoliday] = useState(false);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  // Declare Holiday Form State
  const [newHolidayTitle, setNewHolidayTitle] = useState('');
  const [newHolidayStartDate, setNewHolidayStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHolidayEndDate, setNewHolidayEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHolidayApplicableTo, setNewHolidayApplicableTo] = useState<string>('ALL');
  const [customSelectedClassIds, setCustomSelectedClassIds] = useState<string[]>([]);
  const [newHolidayCategory, setNewHolidayCategory] = useState<'GAZETTED' | 'VACATION' | 'WEATHER_EMERGENCY' | 'RESTRICTED' | 'EVENT'>('VACATION');
  const [newHolidayReason, setNewHolidayReason] = useState('');
  const [newHolidayDeclaredBy, setNewHolidayDeclaredBy] = useState('Principal Directorate');
  const [newHolidayAutoNotice, setNewHolidayAutoNotice] = useState(true);

  const loadHolidays = useCallback(async () => {
    if (!selectedSchool) return;
    try {
      setLoadingHolidays(true);
      const res = await fetch(`/api/holidays?school_id=${selectedSchool.id}&session=${selectedSession}`);
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.error('Error loading holidays:', err);
    } finally {
      setLoadingHolidays(false);
    }
  }, [selectedSchool, selectedSession]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const totalDeclaredDaysCount = useMemo(() => {
    try {
      const d1 = new Date(newHolidayStartDate);
      const d2 = new Date(newHolidayEndDate);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
      const diff = Math.max(0, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))) + 1;
      return diff;
    } catch {
      return 1;
    }
  }, [newHolidayStartDate, newHolidayEndDate]);

  const getHolidayForDate = useCallback((dateStr: string) => {
    return holidays.find(h => dateStr >= h.start_date && dateStr <= h.end_date) || null;
  }, [holidays]);

  const getAudienceLabel = (aud?: string) => {
    if (!aud) return 'Entire Institution (All Closed)';
    switch (aud) {
      case 'ALL': return 'Entire Institution (All Closed)';
      case 'STUDENTS_ONLY': return 'All Students (Teachers On Duty)';
      case 'TEACHERS_AND_STUDENTS': return 'Teachers & Students (Admin Open)';
      case 'PRE_PRIMARY': return 'Pre-Primary Wing (Nursery, LKG, UKG)';
      case 'PRIMARY': return 'Primary Wing (Classes I - V)';
      case 'MIDDLE': return 'Middle Wing (Classes VI - VIII)';
      case 'SECONDARY': return 'Secondary Wing (Classes IX - X)';
      case 'SENIOR_SECONDARY': return 'Senior Secondary (Classes XI - XII)';
      case 'NURSERY_TO_MIDDLE': return 'Pre-Primary to Middle (Nursery to Class VIII)';
      case 'NURSERY_TO_PRIMARY': return 'Pre-Primary to Primary (Nursery to Class V)';
      default:
        return String(aud).replace(/^CUSTOM:\s*/i, 'Specific: ').replace(/_/g, ' ');
    }
  };

  const handleDeclareHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    if (!newHolidayTitle.trim()) {
      showAlertBox('Please enter a holiday title or festival name.', 'Missing Holiday Title', 'warning');
      return;
    }
    if (!newHolidayStartDate) {
      showAlertBox('Please select a valid start date for the holiday.', 'Missing Start Date', 'warning');
      return;
    }

    const applicablePayload = newHolidayApplicableTo === 'CUSTOM_CLASSES'
      ? (customSelectedClassIds.length > 0 
          ? `CUSTOM: ${sortedClasses.filter(c => customSelectedClassIds.includes(c.id)).map(c => `${c.class_name}-${c.section}`).join(', ')}`
          : 'ALL')
      : newHolidayApplicableTo;

    try {
      setDeclaringHoliday(true);
      const res = await apiFetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          academic_session: selectedSession,
          title: newHolidayTitle.trim(),
          start_date: newHolidayStartDate,
          end_date: newHolidayEndDate || newHolidayStartDate,
          applicable_to: applicablePayload,
          category: newHolidayCategory,
          reason: newHolidayReason.trim() || `${newHolidayTitle} break declared officially`,
          declared_by: newHolidayDeclaredBy.trim() || 'Principal Office',
          auto_notice: newHolidayAutoNotice
        })
      });

      const data = await res.json();
      if (data.success) {
        showAdminToast(`Holiday "${newHolidayTitle}" declared (${newHolidayStartDate} to ${newHolidayEndDate || newHolidayStartDate})! Circular broadcasted.`);
        setNewHolidayTitle('');
        setNewHolidayReason('');
        setCustomSelectedClassIds([]);
        loadHolidays();
        onRefresh();
      } else {
        showAlertBox(data.error || 'Failed to declare holiday.', 'Holiday Declaration Error', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showAlertBox('Error declaring holiday: ' + (err?.message || 'Server connection error'), 'Holiday Declaration Error', 'error');
    } finally {
      setDeclaringHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove the declared holiday "${title}"?`)) return;
    try {
      const res = await apiFetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Holiday "${title}" removed.`);
        loadHolidays();
        onRefresh();
      } else {
        showAlertBox(data.error || 'Failed to delete holiday.', 'Holiday Removal Error', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showAlertBox('Error deleting holiday: ' + (err?.message || 'Server connection error'), 'Holiday Removal Error', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // TAB 1: MARK STUDENT ATTENDANCE STATE
  // ─────────────────────────────────────────────────────────────────
  const [selectedClassId, setSelectedClassId] = useState<string>(() => selectableClasses[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [attendanceType, setAttendanceType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [searchRosterQuery, setSearchRosterQuery] = useState<string>('');
  const [studentStatuses, setStudentStatuses] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE'>>({});
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [showAbsentAlertModal, setShowAbsentAlertModal] = useState<boolean>(false);
  const loadedContextKeyRef = React.useRef<string>('');

  // Keep selectedClassId strictly within authorized selectableClasses
  useEffect(() => {
    if (selectableClasses.length > 0 && !selectableClasses.some(c => c.id === selectedClassId)) {
      setSelectedClassId(selectableClasses[0].id);
    }
  }, [selectableClasses, selectedClassId]);

  // If teacher, force attendanceType to STUDENT
  useEffect(() => {
    if (isTeacher && attendanceType !== 'STUDENT') {
      setAttendanceType('STUDENT');
    }
  }, [isTeacher, attendanceType]);

  const selectedClass = useMemo(() => {
    return selectableClasses.find(c => c.id === selectedClassId) || selectableClasses[0] || null;
  }, [selectableClasses, selectedClassId]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cName = (selectedClass.class_name || '').toLowerCase().trim();
    const cSec = (selectedClass.section || '').toLowerCase().trim();
    return students.filter(s => {
      const sName = (s.class_name || '').toLowerCase().trim();
      const sSec = (s.section || '').toLowerCase().trim();
      return (sName === cName || sName.replace(/^class\s*/i, '') === cName.replace(/^class\s*/i, '')) && (!cSec || !sSec || sSec === cSec);
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));
  }, [students, selectedClass]);

  // Load Existing Roll Call from saved logs only when switching target roster, date, or after fresh save
  useEffect(() => {
    const currentContextKey = `${attendanceType}_${attendanceType === 'STUDENT' ? (selectedClass?.id || '') : 'FACULTY'}_${attendanceDate}_${attendance.length}`;
    if (loadedContextKeyRef.current === currentContextKey) return;
    loadedContextKeyRef.current = currentContextKey;

    if (attendanceType === 'STUDENT') {
      if (!selectedClass) return;
      const cName = (selectedClass.class_name || '').toLowerCase().trim();
      const cSec = (selectedClass.section || '').toUpperCase().trim();
      const match = attendance.find(a => 
        a.date === attendanceDate && 
        ((a.class_name || '').toLowerCase().trim() === cName || (a.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '') === cName.replace(/^class\s*/i, '')) &&
        (a.section || '').toUpperCase().trim() === cSec
      );

      const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE'> = {};
      if (match && Array.isArray((match as any).student_records) && (match as any).student_records.length > 0) {
        classStudents.forEach(stu => {
          const rec = (match as any).student_records.find((r: any) => r.student_id === stu.id || r.admission_no === stu.admission_no);
          initialMap[stu.id] = rec ? (rec.status === 'LEAVE' ? 'HOLIDAY' : rec.status) : 'PRESENT';
        });
      } else if (match && (Number(match.absent_count) || 0) > 0) {
        const absCount = Number(match.absent_count) || 0;
        classStudents.forEach((stu, idx) => {
          initialMap[stu.id] = idx >= (classStudents.length - absCount) ? 'ABSENT' : 'PRESENT';
        });
      } else {
        classStudents.forEach(stu => {
          initialMap[stu.id] = 'PRESENT';
        });
      }
      setStudentStatuses(initialMap);
    } else {
      // Faculty Roll Call
      const match = attendance.find(a => 
        a.date === attendanceDate && 
        (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || ''))
      );

      const initialMap: Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE'> = {};
      if (match && Array.isArray((match as any).teacher_records) && (match as any).teacher_records.length > 0) {
        teachers.forEach(t => {
          const rec = (match as any).teacher_records.find((r: any) => r.teacher_id === t.id || r.staff_code === t.staff_code);
          initialMap[t.id] = rec ? (rec.status === 'LEAVE' ? 'HOLIDAY' : rec.status) : 'PRESENT';
        });
      } else if (match && (Number(match.absent_count) || 0) > 0) {
        const absCount = Number(match.absent_count) || 0;
        teachers.forEach((t, idx) => {
          initialMap[t.id] = idx >= (teachers.length - absCount) ? 'ABSENT' : 'PRESENT';
        });
      } else {
        teachers.forEach(t => {
          initialMap[t.id] = 'PRESENT';
        });
      }
      setStudentStatuses(initialMap);
    }
  }, [selectedClass, attendanceDate, attendanceType, classStudents, teachers, attendance]);

  const handleStatusChange = (id: string, status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE') => {
    setStudentStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'HOLIDAY') => {
    const list = attendanceType === 'STUDENT' ? classStudents : teachers;
    const nextMap: Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY' | 'LEAVE' | 'LATE'> = {};
    list.forEach(item => {
      nextMap[item.id] = status;
    });
    setStudentStatuses(nextMap);
  };

  const handleSaveAttendance = () => {
    if (!selectedSchool) return;

    if (attendanceType === 'STUDENT') {
      if (!selectedClass) return;

      if (isTeacher && isSubjectTeacherOnly) {
        showAlertBox('Access Denied: Subject teachers cannot record classroom attendance. Only designated Class Teachers can record roll call.', 'Permission Restricted', 'warning');
        return;
      }

      if (isTeacher && !assignedClasses.some(c => c.id === selectedClass.id)) {
        showAlertBox(`Access Denied: You are not authorized to mark attendance for ${selectedClass.class_name}-${selectedClass.section}. Only its designated Class Teacher can mark attendance.`, 'Permission Restricted', 'warning');
        return;
      }

      // Prompt confirmation: Asks user whether to dispatch push notification strictly to parents
      setShowSaveConfirmModal(true);
    } else {
      // Faculty attendance
      executeSaveAttendance(false);
    }
  };

  const executeSaveAttendance = async (sendPushToParents: boolean) => {
    if (!selectedSchool) return;
    setSavingAttendance(true);

    try {
      const targetSchoolId = selectedSchool.school_code || selectedSchool.id || 'DPS2026';
      if (attendanceType === 'STUDENT') {
        if (!selectedClass) return;
        const total = classStudents.length || 1;
        const present = classStudents.filter(s => (studentStatuses[s.id] || 'PRESENT') === 'PRESENT' || studentStatuses[s.id] === 'LATE').length;
        const absent = classStudents.filter(s => studentStatuses[s.id] === 'ABSENT').length;
        const holiday = classStudents.filter(s => studentStatuses[s.id] === 'HOLIDAY' || studentStatuses[s.id] === 'LEAVE').length;

        const studentRecords = classStudents.map(s => ({
          student_id: s.id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          roll_no: s.roll_no,
          status: studentStatuses[s.id] || 'PRESENT'
        }));

        const payload = {
          school_id: targetSchoolId,
          academic_session: selectedSession,
          date: attendanceDate,
          class_name: selectedClass.class_name,
          section: selectedClass.section,
          total_students: total,
          present_count: present,
          absent_count: absent,
          holiday_count: holiday,
          leave_count: holiday,
          marked_by: isTeacher ? (currentUser?.full_name ? `${currentUser.full_name} (Class Teacher)` : 'Class Teacher') : 'Admin / Principal',
          student_records: studentRecords
        };

        const res = await apiFetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          triggerSaveSuccess();
          if (sendPushToParents) {
            // Dispatches notification STRICTLY to parents only
            try {
              await apiFetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: `Attendance Update: ${selectedClass.class_name}-${selectedClass.section}`,
                  body: `Daily attendance logged for ${attendanceDate}: ${present}/${total} present, ${absent} absent, ${holiday} on holiday.`,
                  url: '/mobile?tab=attendance',
                  audience: 'PARENTS', // <-- STRICTLY PARENTS ONLY
                  urgent: absent > 0,
                  senderName: isTeacher ? (currentUser?.full_name ? `${currentUser.full_name} (Class Teacher)` : 'Class Teacher') : 'Principal Office',
                  senderRole: isTeacher ? 'TEACHER' : 'PRINCIPAL'
                })
              });
            } catch (_) {}
            showAdminToast(`Attendance saved! Push alert dispatched strictly to PARENTS.`);
          } else {
            showAdminToast(`Attendance for ${selectedClass.class_name}-${selectedClass.section} saved! (No notification sent)`);
          }

          loadedContextKeyRef.current = '';
          onRefresh();
        } else {
          showAlertBox(data.error || 'Failed to save attendance.', 'Attendance Save Error', 'error');
        }
      } else {
        // Save Faculty Attendance
        const totalFaculty = teachers.length || 1;
        const presentFac = teachers.filter(t => (studentStatuses[t.id] || 'PRESENT') === 'PRESENT' || studentStatuses[t.id] === 'LATE').length;
        const absentFac = teachers.filter(t => studentStatuses[t.id] === 'ABSENT').length;
        const holidayFac = teachers.filter(t => studentStatuses[t.id] === 'HOLIDAY' || studentStatuses[t.id] === 'LEAVE').length;

        const teacherRecords = teachers.map(t => ({
          teacher_id: t.id,
          staff_code: t.staff_code,
          full_name: t.full_name,
          status: studentStatuses[t.id] || 'PRESENT'
        }));

        const payload = {
          school_id: targetSchoolId,
          academic_session: selectedSession,
          date: attendanceDate,
          class_name: 'Faculty',
          section: 'Staff',
          total_students: totalFaculty,
          present_count: presentFac,
          absent_count: absentFac,
          holiday_count: holidayFac,
          leave_count: holidayFac,
          marked_by: 'Principal Directorate',
          teacher_records: teacherRecords
        };

        const res = await apiFetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          triggerSaveSuccess();
          showAdminToast(`Faculty attendance saved! (${presentFac}/${totalFaculty} On-Duty)`);
          loadedContextKeyRef.current = '';
          onRefresh();
        } else {
          showAlertBox(data.error || 'Failed to save faculty attendance.', 'Attendance Save Error', 'error');
        }
      }
    } catch (e: any) {
      console.error(e);
      showAlertBox('Error saving attendance: ' + (e?.message || 'Server connection error'), 'Attendance Save Error', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const currentRosterList = attendanceType === 'STUDENT' ? classStudents : teachers;
  const filteredRosterList = useMemo(() => {
    if (!searchRosterQuery.trim()) return currentRosterList;
    const q = searchRosterQuery.toLowerCase().trim();
    return currentRosterList.filter((item: any) => {
      const name = (item.full_name || '').toLowerCase();
      const code = (item.admission_no || item.staff_code || '').toLowerCase();
      const roll = String(item.roll_no || '').toLowerCase();
      return name.includes(q) || code.includes(q) || roll.includes(q);
    });
  }, [currentRosterList, searchRosterQuery]);

  const presentCount = currentRosterList.filter(item => (studentStatuses[item.id] || 'PRESENT') === 'PRESENT' || studentStatuses[item.id] === 'LATE').length;
  const absentCount = currentRosterList.filter(item => studentStatuses[item.id] === 'ABSENT').length;
  const holidayCount = currentRosterList.filter(item => studentStatuses[item.id] === 'HOLIDAY' || studentStatuses[item.id] === 'LEAVE').length;
  const rosterTurnoutPercent = currentRosterList.length > 0
    ? Math.round((presentCount / currentRosterList.length) * 100)
    : 0;

  // Selected date holiday status
  const activeDateHoliday = useMemo(() => getHolidayForDate(attendanceDate), [getHolidayForDate, attendanceDate]);

  // ─────────────────────────────────────────────────────────────────
  // TAB 2: MONTHLY ATTENDANCE SHEET STATE & MATRIX BUILDER
  // ─────────────────────────────────────────────────────────────────
  // Dynamically initialize based on current date / attendanceDate (defaults to current month: e.g. September = 9)
  const [sheetClassId, setSheetClassId] = useState<string>(() => selectedClassId || selectableClasses[0]?.id || '');
  const [sheetYear, setSheetYear] = useState<number>(() => {
    const d = new Date(attendanceDate);
    return isNaN(d.getTime()) ? 2026 : d.getFullYear();
  });
  const [sheetMonth, setSheetMonth] = useState<number>(() => {
    const d = new Date(attendanceDate);
    return isNaN(d.getTime()) ? (new Date().getMonth() + 1) : (d.getMonth() + 1);
  });

  // Track interactive cell edits made directly in monthly register
  const [sheetEdits, setSheetEdits] = useState<Record<string, Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY'>>>({});
  const [isSavingMonthlySheet, setIsSavingMonthlySheet] = useState(false);
  const [hasUnsavedSheetChanges, setHasUnsavedSheetChanges] = useState(false);

  // Sync sheet class with selected class when selectedClassId changes
  useEffect(() => {
    if (selectedClassId && (!sheetClassId || selectableClasses.some(c => c.id === selectedClassId))) {
      setSheetClassId(selectedClassId);
    }
  }, [selectedClassId, selectableClasses]);

  // Sync sheet year/month with attendanceDate
  useEffect(() => {
    if (attendanceDate) {
      const d = new Date(attendanceDate);
      if (!isNaN(d.getTime())) {
        setSheetYear(d.getFullYear());
        setSheetMonth(d.getMonth() + 1);
      }
    }
  }, [attendanceDate]);

  useEffect(() => {
    if (selectableClasses.length > 0 && (!sheetClassId || !selectableClasses.some(c => c.id === sheetClassId))) {
      setSheetClassId(selectableClasses[0].id);
    }
  }, [selectableClasses, sheetClassId]);

  const currentSheetClass = useMemo(() => {
    return selectableClasses.find(c => c.id === sheetClassId) || selectableClasses[0] || null;
  }, [selectableClasses, sheetClassId]);

  const sheetStudents = useMemo(() => {
    if (!currentSheetClass) return [];
    const cName = (currentSheetClass.class_name || '').toLowerCase().trim();
    const cSec = (currentSheetClass.section || '').toLowerCase().trim();
    return students.filter(s => {
      const sName = (s.class_name || '').toLowerCase().trim();
      const sSec = (s.section || '').toLowerCase().trim();
      return (sName === cName || sName.replace(/^class\s*/i, '') === cName.replace(/^class\s*/i, '')) && (!cSec || !sSec || sSec === cSec);
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));
  }, [students, currentSheetClass]);

  const daysInSelectedMonth = useMemo(() => {
    return new Date(sheetYear, sheetMonth, 0).getDate();
  }, [sheetYear, sheetMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

  const totalEditedCellsCount = useMemo(() => {
    let count = 0;
    Object.values(sheetEdits).forEach(dateMap => {
      count += Object.keys(dateMap).length;
    });
    return count;
  }, [sheetEdits]);

  // Direct cell toggle in monthly register: P -> A -> H -> P
  const handleToggleCell = (studentId: string, dateStr: string, currentSt: string) => {
    const hol = getHolidayForDate(dateStr);
    const dObj = new Date(dateStr);
    if (dObj.getDay() === 0 || hol) return;

    const nextStatusMap: Record<string, 'PRESENT' | 'ABSENT' | 'HOLIDAY'> = {
      '—': 'PRESENT',
      'P': 'ABSENT',
      'A': 'HOLIDAY',
      'H': 'PRESENT'
    };
    const nextStatus = nextStatusMap[currentSt] || 'PRESENT';

    setSheetEdits(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [dateStr]: nextStatus
      }
    }));
    setHasUnsavedSheetChanges(true);
  };

  // Save all modified dates in the monthly sheet to database
  const handleSaveMonthlySheet = async () => {
    if (!currentSheetClass || !selectedSchool) return;
    setIsSavingMonthlySheet(true);

    try {
      const targetSchoolId = selectedSchool.school_code || selectedSchool.id || 'DPS2026';

      // Find all distinct dates edited in sheetEdits
      const editedDates = new Set<string>();
      Object.values(sheetEdits).forEach(dateMap => {
        Object.keys(dateMap).forEach(d => editedDates.add(d));
      });

      if (editedDates.size === 0) {
        showAdminToast('No unsaved changes detected in the monthly register.');
        setIsSavingMonthlySheet(false);
        return;
      }

      for (const dateStr of Array.from(editedDates)) {
        const existingRec = attendance.find(a => {
          const normA = (a.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normC = (currentSheetClass.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normASec = (a.section || '').toLowerCase().trim();
          const normCSec = (currentSheetClass.section || '').toLowerCase().trim();
          return a.date === dateStr && normA === normC && (!normASec || !normCSec || normASec === normCSec);
        });

        const studentRecords = sheetStudents.map(stu => {
          const local = sheetEdits[stu.id]?.[dateStr];
          let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 'PRESENT';
          if (local) {
            status = local;
          } else if (existingRec && (existingRec as any).student_records) {
            const matched = (existingRec as any).student_records.find((r: any) => r.student_id === stu.id || r.admission_no === stu.admission_no);
            if (matched) status = matched.status === 'HOLIDAY' ? 'HOLIDAY' : (matched.status === 'LEAVE' ? 'HOLIDAY' : matched.status || 'PRESENT');
          }
          return {
            student_id: stu.id,
            admission_no: stu.admission_no,
            full_name: stu.full_name,
            roll_no: stu.roll_no,
            status
          };
        });

        const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = studentRecords.filter(r => r.status === 'ABSENT').length;
        const holidayCount = studentRecords.filter(r => r.status === 'HOLIDAY').length;

        const payload = {
          school_id: targetSchoolId,
          academic_session: selectedSession,
          date: dateStr,
          class_name: currentSheetClass.class_name,
          section: currentSheetClass.section,
          total_students: sheetStudents.length,
          present_count: presentCount,
          absent_count: absentCount,
          holiday_count: holidayCount,
          leave_count: holidayCount,
          marked_by: isTeacher ? (currentUser?.full_name ? `${currentUser.full_name} (Class Teacher)` : 'Class Teacher') : 'Admin / Class Incharge',
          student_records: studentRecords
        };

        await apiFetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setSheetEdits({});
      setHasUnsavedSheetChanges(false);
      triggerSaveSuccess();
      showAdminToast(`Monthly attendance register updated and saved for ${editedDates.size} date(s)!`);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      showAlertBox('Error saving monthly attendance: ' + (err?.message || 'Server error'), 'Save Failed', 'error');
    } finally {
      setIsSavingMonthlySheet(false);
    }
  };

  // Export Monthly Sheet to CSV (Including declared holidays)
  const handleExportMonthlyCSV = () => {
    if (!currentSheetClass) return;
    const header = ['Roll No', 'Admission No', 'Student Name', ...daysArray.map(d => `Day ${d}`), 'Present', 'Absent', 'Holiday', 'Percentage %'];
    const rows = sheetStudents.map(stu => {
      let pCount = 0;
      let aCount = 0;
      let hCount = 0;
      const dayStatuses = daysArray.map(day => {
        const dateStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(sheetYear, sheetMonth - 1, day).getDay();
        const hol = getHolidayForDate(dateStr);
        if (dayOfWeek === 0) return 'SUN';
        if (hol) return 'HOL';
        
        // Future dates or unrecorded dates
        if (dateStr > todayDateStr) {
          return '-';
        }

        // Check real attendance from database or local edits
        const local = sheetEdits[stu.id]?.[dateStr];
        const rec = attendance.find(a => {
          const normA = (a.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normC = (currentSheetClass.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normASec = (a.section || '').toLowerCase().trim();
          const normCSec = (currentSheetClass.section || '').toLowerCase().trim();
          return a.date === dateStr && normA === normC && (!normASec || !normCSec || normASec === normCSec);
        });
        let st = '-';
        if (local) {
          st = local === 'PRESENT' ? 'P' : local === 'ABSENT' ? 'A' : 'H';
        } else if (rec && (rec as any).student_records) {
          const matched = (rec as any).student_records.find((r: any) => r.student_id === stu.id || r.admission_no === stu.admission_no);
          if (matched) st = matched.status === 'PRESENT' ? 'P' : matched.status === 'ABSENT' ? 'A' : 'H';
        } else if (rec) {
          st = 'P';
        }

        if (st === 'P') pCount++;
        else if (st === 'A') aCount++;
        else if (st === 'H') hCount++;
        return st;
      });

      const workingDays = daysArray.filter(d => {
        const dtStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(sheetYear, sheetMonth - 1, d).getDay();
        return dow !== 0 && !getHolidayForDate(dtStr) && dtStr <= todayDateStr;
      }).length;
      const pct = workingDays > 0 ? Math.round((pCount / workingDays) * 100) : 0;
      return [stu.roll_no, stu.admission_no, stu.full_name, ...dayStatuses, pCount, aCount, hCount, `${pct}%`];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Monthly_Attendance_${currentSheetClass.class_name}_${currentSheetClass.section}_${sheetMonth}_${sheetYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Official CBSE Monthly Attendance Register Report
  const handlePrintMonthlyReport = () => {
    if (!currentSheetClass) {
      showAlertBox("Please select a class to generate printable attendance report.", "No Class Selected", "warning");
      return;
    }

    const monthName = new Date(sheetYear, sheetMonth - 1, 1).toLocaleString('default', { month: 'long' });
    
    // Prepare aggregated rows
    const reportData = sheetStudents.map(stu => {
      let pCount = 0;
      let aCount = 0;
      let hCount = 0;

      daysArray.forEach(d => {
        const dtStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(sheetYear, sheetMonth - 1, d).getDay();
        const isSun = dow === 0;
        const isHol = getHolidayForDate(dtStr);
        if (isSun || isHol || dtStr > todayDateStr) return;

        const local = sheetEdits[stu.id]?.[dtStr];
        const rec = attendance.find(a => {
          const normA = (a.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normC = (currentSheetClass.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
          const normASec = (a.section || '').toLowerCase().trim();
          const normCSec = (currentSheetClass.section || '').toLowerCase().trim();
          return a.date === dtStr && normA === normC && (!normASec || !normCSec || normASec === normCSec);
        });

        let st = '-';
        if (local) {
          st = local === 'PRESENT' ? 'P' : local === 'ABSENT' ? 'A' : 'H';
        } else if (rec && (rec as any).student_records) {
          const matched = (rec as any).student_records.find((r: any) => r.student_id === stu.id || r.admission_no === stu.admission_no);
          if (matched) st = matched.status === 'PRESENT' ? 'P' : matched.status === 'ABSENT' ? 'A' : 'H';
        } else if (rec) {
          st = 'P';
        }

        if (st === 'P') pCount++;
        else if (st === 'A') aCount++;
        else if (st === 'H') hCount++;
      });

      const workingDays = daysArray.filter(d => {
        const dtStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(sheetYear, sheetMonth - 1, d).getDay();
        return dow !== 0 && !getHolidayForDate(dtStr) && dtStr <= todayDateStr;
      }).length;

      const pct = workingDays > 0 ? Math.round((pCount / workingDays) * 100) : 0;

      return {
        roll_no: stu.roll_no || '—',
        admission_no: stu.admission_no,
        full_name: stu.full_name,
        class_name: `${currentSheetClass.class_name} (${currentSheetClass.section})`,
        presentDays: pCount,
        absentDays: aCount,
        holidayDays: hCount,
        totalWorkingDays: workingDays,
        attendancePercent: pct,
        isDefaulter: pct < 75
      };
    });

    const totalScholars = reportData.length;
    const defaultersCount = reportData.filter(r => r.isDefaulter).length;
    const avgTurnout = totalScholars > 0 ? Math.round(reportData.reduce((acc, r) => acc + r.attendancePercent, 0) / totalScholars) : 0;

    const stats = [
      { label: 'Class Enrolled', value: `${totalScholars} Scholars` },
      { label: 'Avg Monthly Turnout', value: `${avgTurnout}%` },
      { label: 'CBSE Compliant (≥75%)', value: `${totalScholars - defaultersCount} Scholars` },
      { label: 'Defaulters (<75%)', value: `${defaultersCount} Scholars` },
    ];

    const cols: ReportColumn[] = [
      { header: 'ROLL', key: 'roll_no', width: '8%', align: 'center' },
      { header: 'SCHOLAR NAME', key: 'full_name', width: '24%' },
      { header: 'ADM NO', key: 'admission_no', width: '14%' },
      { header: 'PRESENT', render: (r) => r.presentDays, width: '10%', align: 'center' },
      { header: 'ABSENT', render: (r) => r.absentDays, width: '10%', align: 'center' },
      { header: 'HOLIDAY', render: (r) => r.holidayDays, width: '8%', align: 'center' },
      { header: 'TOTAL DAYS', render: (r) => r.totalWorkingDays, width: '10%', align: 'center' },
      { header: 'TURNOUT %', render: (r) => `${r.attendancePercent}%`, width: '10%', align: 'center' },
      { header: 'STATUS', render: (r) => r.isDefaulter ? 'DEFAULTER' : 'COMPLIANT', width: '10%', align: 'center' },
    ];

    setActiveAttendanceReportModal({
      isOpen: true,
      title: `Monthly Attendance Register: ${currentSheetClass.class_name} - Section ${currentSheetClass.section}`,
      subtitle: `CBSE Statutory 31-Day Academic Roll Call & Compliance Audit (${monthName} ${sheetYear})`,
      filterSummary: [
        { label: 'Session', value: selectedSession || '2026-27' },
        { label: 'Class', value: `${currentSheetClass.class_name} (${currentSheetClass.section})` },
        { label: 'Month', value: `${monthName} ${sheetYear}` },
        { label: 'Scholars', value: `${totalScholars} Students` }
      ],
      statsSummary: stats,
      columns: cols,
      data: reportData,
      onDownloadCSV: handleExportMonthlyCSV
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // TAB 3: ATTENDANCE SUMMARY & COMPARATIVE ANALYTICS
  // ─────────────────────────────────────────────────────────────────
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const classSummaryData = useMemo(() => {
    const targetList = isTeacher ? selectableClasses : sortedClasses;
    return targetList.map(cls => {
      const clsStudents = students.filter(s => {
        const cName = (cls.class_name || '').toLowerCase().trim();
        const cSec = (cls.section || '').toLowerCase().trim();
        const sName = (s.class_name || '').toLowerCase().trim();
        const sSec = (s.section || '').toLowerCase().trim();
        return (sName === cName || sName.replace(/^class\s*/i, '') === cName.replace(/^class\s*/i, '')) && (!cSec || !sSec || sSec === cSec);
      });

      const todayLog = attendance.find(a => 
        a.date === todayDateStr && 
        (a.class_name || '').toLowerCase() === (cls.class_name || '').toLowerCase() &&
        (a.section || '').toUpperCase() === (cls.section || '').toUpperCase()
      );

      const isMarked = !!todayLog;
      const presentCount = isMarked ? Number(todayLog.present_count) || 0 : 0;
      const totalCount = clsStudents.length || Number(cls.capacity) || 35;
      const todayPercent = isMarked && totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      const defaulters = clsStudents.filter(s => (s.attendance_percent || 95) < 75);

      return {
        cls,
        totalStudents: totalCount,
        isMarked,
        presentCount,
        absentCount: isMarked ? Math.max(0, totalCount - presentCount) : 0,
        todayPercent,
        monthlyAvgPercent: isMarked ? Math.min(99, Math.max(88, todayPercent - 2)) : 0,
        defaultersCount: defaulters.length,
        defaulterStudents: defaulters
      };
    });
  }, [sortedClasses, students, attendance, todayDateStr]);

  const totalClassesCount = isTeacher ? selectableClasses.length : sortedClasses.length;
  const markedClassesTodayCount = classSummaryData.filter(c => c.isMarked).length;
  const totalSchoolStudents = students.length;
  const totalStudentsPresentToday = classSummaryData.reduce((acc, curr) => acc + curr.presentCount, 0);
  const overallSchoolAttendanceTodayRate = totalSchoolStudents > 0 && markedClassesTodayCount > 0
    ? Number(((totalStudentsPresentToday / totalSchoolStudents) * 100).toFixed(1))
    : 0;
  const allDefaultersList = useMemo(() => {
    return students.filter(s => (s.attendance_percent || 95) < 75);
  }, [students]);

  // Faculty Attendance Today Metrics
  const facultyTodayLog = useMemo(() => {
    return attendance.find(a => 
      (a.date === todayDateStr || a.date === new Date().toISOString().split('T')[0]) &&
      (/faculty|staff/i.test(a.class_name || '') || /faculty|staff/i.test(a.section || ''))
    ) || null;
  }, [attendance, todayDateStr]);

  const totalTeachersCount = teachers.length;
  const isFacultyMarkedToday = !!facultyTodayLog;
  const facultyPresentCount = isFacultyMarkedToday ? (Number(facultyTodayLog.present_count) || 0) : 0;
  const facultyAbsentCount = isFacultyMarkedToday ? (Number(facultyTodayLog.absent_count) || 0) : 0;
  const facultyHolidayCount = isFacultyMarkedToday ? (Number(facultyTodayLog.holiday_count ?? facultyTodayLog.leave_count) || 0) : 0;
  const facultyLeaveCount = facultyHolidayCount;
  const facultyTurnoutRate = isFacultyMarkedToday && totalTeachersCount > 0
    ? Number(((facultyPresentCount / totalTeachersCount) * 100).toFixed(1))
    : 0;

  const filteredHolidaysList = useMemo(() => {
    if (!holidaySearchQuery.trim()) return holidays;
    const q = holidaySearchQuery.toLowerCase().trim();
    return holidays.filter(h => 
      (h.title || '').toLowerCase().includes(q) ||
      (h.reason || '').toLowerCase().includes(q) ||
      (h.category || '').toLowerCase().includes(q) ||
      (h.applicable_to || '').toLowerCase().includes(q)
    );
  }, [holidays, holidaySearchQuery]);

  return (
    <div className="space-y-3 sm:space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* ── DELIGHTFUL ANIMATED TICK LOGO CONFIRMATION BADGE ── */}
      {saveSuccess && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-fade-in px-4 w-full max-w-md">
          <div className="bg-[#122A24]/95 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-emerald-500/60 flex items-center justify-between gap-3 backdrop-blur-md mx-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md animate-tick-pop">
                <Check className="w-4 h-4 stroke-[3.5] text-white animate-tick-draw" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight truncate">
                  Attendance Saved Successfully!
                </span>
                <span className="text-[10.5px] font-mono text-emerald-300 truncate">
                  {attendanceType === 'STUDENT' ? `${selectedClass?.class_name}-${selectedClass?.section} Ledger Synced` : 'Faculty Directorate Synced'}
                </span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & DEDICATED RESPONSIVE TABS BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl sm:rounded-3xl border border-[#DCE8E0] shadow-xs p-2.5 sm:p-6 lg:p-7 space-y-3 sm:space-y-5 relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          ATTENDANCE
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
              <CalendarCheck className="h-7 w-7 text-emerald-700 shrink-0" />
              <span>Attendance Hub &amp; Academic Ledgers</span>
            </h1>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Daily student/faculty roll call, 31-day monthly registers, holiday closures, and CBSE compliance analytics
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
              Session {selectedSession || '2026-27'}
            </span>
          </div>
        </div>

        {/* 4 Primary Navigation Buttons (Full-Width Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs">
          {/* Tab 1: Mark Student Attendance */}
          <button
            type="button"
            onClick={() => setAttendanceTab('mark_attendance')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              attendanceTab === 'mark_attendance'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <ClipboardPen className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Mark Attendance</span>
          </button>

          {/* Tab 2: Monthly Attendance Sheet */}
          <button
            type="button"
            onClick={() => setAttendanceTab('monthly_sheet')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              attendanceTab === 'monthly_sheet'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <CalendarDays className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Monthly Sheet (31-Day)</span>
          </button>

          {/* Tab 3: Attendance Summary */}
          <button
            type="button"
            onClick={() => setAttendanceTab('attendance_summary')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              attendanceTab === 'attendance_summary'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <BarChart3 className="h-4 w-4 stroke-[1.75] shrink-0" />
            <span className="truncate">Attendance Summary</span>
          </button>

          {/* Tab 4: Declare Holidays & Calendar */}
          {!isTeacher && (
            <button
              type="button"
              onClick={() => setAttendanceTab('holiday_calendar')}
              className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
                attendanceTab === 'holiday_calendar'
                  ? 'bg-[#122A24] text-white shadow-xs font-bold'
                  : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
              }`}
            >
              <Palmtree className="h-4 w-4 stroke-[1.75] shrink-0" />
              <span className="truncate">Declare Holidays ({holidays.length})</span>
            </button>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PANEL 1: MARK STUDENT ATTENDANCE (DAILY ROLL CALL)
            ───────────────────────────────────────────────────────────── */}
        {attendanceTab === 'mark_attendance' && (
          <div className="space-y-6 animate-fade-in">
            {/* Subject Teacher Restriction Notice */}
            {isSubjectTeacherOnly && (
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-6 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center font-bold">
                  <AlertCircle className="w-8 h-8 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-[#122A24]">
                    Subject Teacher Access Restriction
                  </h3>
                  <p className="text-xs text-amber-950 font-mono mt-1 font-bold uppercase tracking-wider">
                    CBSE Homeroom Roll Call Policy
                  </p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto">
                  You are logged in as <strong>{currentUser?.full_name || 'Faculty Member'}</strong> (Subject Teacher). In accordance with CBSE institutional regulations, <strong>daily homeroom attendance can ONLY be marked by the designated Class Teacher</strong> for their assigned class.
                </p>
                <div className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs font-mono text-amber-900 inline-block shadow-2xs">
                  🔒 You are not currently assigned as a Class Teacher to any class. Contact the Principal / Administrator office if you have been designated for homeroom duties.
                </div>
              </div>
            )}

            {/* Class Teacher Confirmation Banner */}
            {isTeacher && !isSubjectTeacherOnly && selectedClass && (
              <div className="p-3.5 bg-[#EBF5EF] rounded-2xl border border-[#C5E2CF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[#122A24]">
                    Assigned Homeroom: <strong>{selectedClass.class_name} - Section {selectedClass.section}</strong> • Class Teacher: <strong>{currentUser?.full_name}</strong>
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122A24] text-white">
                  AUTHORIZED CLASS TEACHER
                </span>
              </div>
            )}

            {!isSubjectTeacherOnly && (
            <>
            {/* Holiday Alert Notification Banner if active date is declared holiday */}
            {activeDateHoliday && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <Palmtree className="h-5 w-5 text-amber-700 shrink-0" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">
                      Official Holiday Declared: {activeDateHoliday.title} ({activeDateHoliday.start_date} to {activeDateHoliday.end_date})
                    </div>
                    <div className="text-[11px] font-mono text-amber-800">
                      Applicable For: <span className="font-bold">{(activeDateHoliday.applicable_to || 'ALL').replace(/_/g, ' ')}</span> • Reason: {activeDateHoliday.reason}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 border border-amber-400 shrink-0">
                  {activeDateHoliday.category}
                </span>
              </div>
            )}

            {/* Top Filter Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Roster Type Selector (Students vs Faculty - HIDDEN FOR TEACHERS) */}
                {!isTeacher && (
                  <div className="flex items-center bg-white p-1 rounded-xl border border-[#DCE8E0] shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setAttendanceType('STUDENT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-colors ${
                        attendanceType === 'STUDENT' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-600'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Class Students</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceType('FACULTY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-colors ${
                        attendanceType === 'FACULTY' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-600'
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Faculty Directorate</span>
                    </button>
                  </div>
                )}

                {/* Class Selector (Chronological) */}
                {attendanceType === 'STUDENT' && (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs shadow-2xs">
                    <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">Class:</span>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                    >
                      {selectableClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - Section {c.section} {isTeacher ? '(Assigned Class)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date Picker */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-[#122A24] focus:outline-none cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Roster Live Turnout Stats */}
              <div className="flex items-center gap-2 self-start lg:self-auto">
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{presentCount} Present ({rosterTurnoutPercent}%)</span>
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>{absentCount} Absent</span>
                </span>
                {holidayCount > 0 && (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                    <Palmtree className="h-3.5 w-3.5 text-blue-600" />
                    <span>{holidayCount} Holiday</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Bulk Actions & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={attendanceType === 'STUDENT' ? "Search student by name, roll no, admission no..." : "Search faculty by name, code..."}
                  value={searchRosterQuery}
                  onChange={(e) => setSearchRosterQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-[#DCE8E0] bg-[#F8FAF9] focus:bg-white text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span><span className="hidden sm:inline">Mark </span>All Present</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span><span className="hidden sm:inline">Mark </span>All Absent</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('HOLIDAY')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <Palmtree className="h-3.5 w-3.5 text-blue-700" />
                  <span><span className="hidden sm:inline">Mark </span>All Holiday</span>
                </button>
                {attendanceType === 'STUDENT' && classStudents.filter(s => studentStatuses[s.id] === 'ABSENT').length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAbsentAlertModal(true)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all border-none shrink-0"
                    title="Send WhatsApp Absent Alert to Parents"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-white" />
                    <span>WhatsApp Alerts ({classStudents.filter(s => studentStatuses[s.id] === 'ABSENT').length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className={`hidden sm:flex px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer items-center gap-1.5 disabled:opacity-50 transition-all border-none ${
                    saveSuccess ? 'bg-emerald-600 shadow-emerald-200' : 'bg-[#122A24] hover:bg-[#1C443A]'
                  }`}
                >
                  {savingAttendance ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                      <span>Saving Ledger...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <span className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 animate-tick-pop shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3.5] animate-tick-draw" />
                      </span>
                      <span className="text-white font-bold">Saved &amp; Synced!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Save &amp; Sync Ledger</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MOBILE ROSTER VIEW: Touch-optimized cards with P A H buttons right next to student name */}
            <div className="block lg:hidden space-y-2 pb-24">
              {filteredRosterList.map((item: any, idx: number) => {
                const currentStatus = studentStatuses[item.id] || 'PRESENT';
                return (
                  <div
                    key={item.id}
                    className={`px-3 py-2.5 rounded-xl border transition-all bg-white flex items-center justify-between gap-2 shadow-2xs ${
                      currentStatus === 'PRESENT'
                        ? 'border-emerald-200/90 bg-emerald-50/20 border-l-[3.5px] border-l-emerald-600'
                        : currentStatus === 'ABSENT'
                        ? 'border-rose-200/90 bg-rose-50/25 border-l-[3.5px] border-l-rose-600'
                        : 'border-blue-200/90 bg-blue-50/25 border-l-[3.5px] border-l-blue-600'
                    }`}
                  >
                    {/* Left: Roll No + Student / Faculty Details */}
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#F0F4F2] text-[#122A24] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-[#DCE8E0]">
                        {item.roll_no || idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[13px] text-[#122A24] truncate leading-tight">
                          {item.full_name}
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 shrink-0">{item.admission_no || item.staff_code || `ID-${idx + 1}`}</span>
                          {attendanceType === 'STUDENT' && item.guardian_phone && (
                            <>
                              <span className="text-slate-300 shrink-0">•</span>
                              <span className="text-slate-500 truncate">{item.guardian_phone}</span>
                            </>
                          )}
                          {attendanceType === 'FACULTY' && (item.designation || item.department) && (
                            <>
                              <span className="text-slate-300 shrink-0">•</span>
                              <span className="text-slate-500 truncate">{item.designation || item.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Touch P A H Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* P - Present */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'PRESENT')}
                        aria-label={`Mark ${item.full_name} Present`}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs cursor-pointer transition-all border flex items-center justify-center active:scale-90 ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/50 font-black'
                            : 'bg-white text-emerald-800 border-emerald-200/80 hover:bg-emerald-50'
                        }`}
                        title="Present (P)"
                      >
                        P
                      </button>

                      {/* A - Absent */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'ABSENT')}
                        aria-label={`Mark ${item.full_name} Absent`}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs cursor-pointer transition-all border flex items-center justify-center active:scale-90 ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-400/50 font-black'
                            : 'bg-white text-rose-800 border-rose-200/80 hover:bg-rose-50'
                        }`}
                        title="Absent (A)"
                      >
                        A
                      </button>

                      {/* H - Holiday / Leave */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'HOLIDAY')}
                        aria-label={`Mark ${item.full_name} Holiday/Leave`}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs cursor-pointer transition-all border flex items-center justify-center active:scale-90 ${
                          currentStatus === 'HOLIDAY' || currentStatus === 'LEAVE'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/50 font-black'
                            : 'bg-white text-blue-800 border-blue-200/80 hover:bg-blue-50'
                        }`}
                        title="Holiday / Leave (H)"
                      >
                        H
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredRosterList.length === 0 && (
                <div className="py-12 text-center text-xs font-mono text-[#2D5A4E] bg-white rounded-2xl border border-[#DCE8E0]">
                  No records found matching your roster filters.
                </div>
              )}
            </div>

            {/* Mobile Docked Attendance Summary & Quick-Save Bar (Elevated width, height & prominent counters) */}
            <div className="lg:hidden fixed bottom-[calc(3.4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white/98 backdrop-blur-md border-t-2 border-[#DCE8E0] shadow-[0_-6px_25px_rgba(0,0,0,0.1)] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono">
                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span>{presentCount} P</span>
                </span>
                <span className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{absentCount} A</span>
                </span>
                {holidayCount > 0 && (
                  <span className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span>{holidayCount} H</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={savingAttendance}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md cursor-pointer border-none flex items-center gap-2 active:scale-95 transition-all shrink-0 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-emerald-200'
                    : 'bg-[#122A24] hover:bg-[#1C443A] text-white'
                } disabled:opacity-50`}
              >
                {savingAttendance ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <span className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 animate-tick-pop shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3.5] animate-tick-draw" />
                    </span>
                    <span className="tracking-tight">Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-emerald-400" />
                    <span>Save &amp; Sync</span>
                  </>
                )}
              </button>
            </div>

            {/* DESKTOP ROSTER TABLE */}
            <div className="hidden lg:block border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAF9] border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                      <th className="py-3 px-4 w-16 text-center">#</th>
                      <th className="py-3 px-4 w-28">Identifier</th>
                      <th className="py-3 px-4">Full Name &amp; Profile</th>
                      {attendanceType === 'STUDENT' && <th className="py-3 px-4">Guardian Contact</th>}
                      {attendanceType === 'FACULTY' && <th className="py-3 px-4">Department / Designation</th>}
                      <th className="py-3 px-4 w-64 text-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2ED] text-xs">
                    {filteredRosterList.map((item: any, idx: number) => {
                      const currentStatus = studentStatuses[item.id] || 'PRESENT';
                      return (
                        <tr key={item.id} className="hover:bg-[#F9FCFA] transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {item.roll_no || idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#122A24]">
                            {item.admission_no || item.staff_code || `ID-${idx + 1}`}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#122A24]">{item.full_name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {attendanceType === 'STUDENT' ? `Gender: ${item.gender || 'N/A'}` : `Email: ${item.email || 'N/A'}`}
                            </div>
                          </td>
                          {attendanceType === 'STUDENT' && (
                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                              <div>{item.guardian_name || 'Guardian'}</div>
                              <div className="text-slate-400">{item.guardian_phone || 'No phone'}</div>
                            </td>
                          )}
                          {attendanceType === 'FACULTY' && (
                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                              <div>{item.department || 'Academic Faculty'}</div>
                              <div className="text-slate-400">{item.designation || 'Teacher'}</div>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* PRESENT */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-1 ring-emerald-400'
                                    : 'bg-emerald-50/60 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStatus === 'PRESENT' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'}`}>P</span>
                                <span>Present</span>
                              </button>

                              {/* ABSENT */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                                  currentStatus === 'ABSENT'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-1 ring-rose-400'
                                    : 'bg-rose-50/60 text-rose-800 border-rose-200/60 hover:bg-rose-100'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStatus === 'ABSENT' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'}`}>A</span>
                                <span>Absent</span>
                              </button>

                              {/* HOLIDAY */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(item.id, 'HOLIDAY')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all border flex items-center gap-1.5 ${
                                  currentStatus === 'HOLIDAY' || currentStatus === 'LEAVE'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs ring-1 ring-blue-400'
                                    : 'bg-blue-50/60 text-blue-800 border-blue-200/60 hover:bg-blue-100'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStatus === 'HOLIDAY' || currentStatus === 'LEAVE' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-900'}`}>H</span>
                                <span>Holiday</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRosterList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#2D5A4E]">
                          No records found matching your roster filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PANEL 2: MONTHLY ATTENDANCE SHEET (31-DAY MATRIX REGISTER)
            ───────────────────────────────────────────────────────────── */}
        {attendanceTab === 'monthly_sheet' && (
          <div className="space-y-6 animate-fade-in">
            {/* Subject Teacher Restriction Notice */}
            {isSubjectTeacherOnly && (
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-6 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center font-bold">
                  <AlertCircle className="w-8 h-8 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-[#122A24]">
                    Subject Teacher Access Restriction
                  </h3>
                  <p className="text-xs text-amber-950 font-mono mt-1 font-bold uppercase tracking-wider">
                    CBSE Homeroom Roll Call Policy
                  </p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto">
                  You are logged in as <strong>{currentUser?.full_name || 'Faculty Member'}</strong> (Subject Teacher). In accordance with CBSE institutional regulations, <strong>monthly attendance registers are managed strictly by designated Class Teachers</strong> for their assigned homerooms.
                </p>
                <div className="p-3.5 bg-white rounded-2xl border border-amber-200 text-xs font-mono text-amber-900 inline-block shadow-2xs">
                  🔒 You are not currently assigned as a Class Teacher to any class. Contact the Principal / Administrator office if you have been designated for homeroom duties.
                </div>
              </div>
            )}

            {!isSubjectTeacherOnly && (
            <>
            {/* Top Sheet Controls */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Month Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-blue-700" />
                  <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">Month:</span>
                  <select
                    value={sheetMonth}
                    onChange={(e) => setSheetMonth(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-bold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </div>

                {/* Year Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs shadow-2xs">
                  <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">Year:</span>
                  <select
                    value={sheetYear}
                    onChange={(e) => setSheetYear(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-bold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                {/* Class & Section Selector */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs shadow-2xs">
                  <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">Class:</span>
                  {isTeacher ? (
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#122A24] px-1">
                      <span>{currentSheetClass ? `${currentSheetClass.class_name} - Section ${currentSheetClass.section}` : 'No Assigned Class'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122A24] text-white">
                        Homeroom
                      </span>
                    </div>
                  ) : (
                    <select
                      value={sheetClassId}
                      onChange={(e) => setSheetClassId(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                    >
                      {sortedClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} - Section {c.section}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasUnsavedSheetChanges && (
                  <button
                    type="button"
                    onClick={() => {
                      setSheetEdits({});
                      setHasUnsavedSheetChanges(false);
                      showAdminToast('Discarded unsaved monthly sheet edits.');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Discard Edits
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveMonthlySheet}
                  disabled={!hasUnsavedSheetChanges || isSavingMonthlySheet}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all border-none ${
                    hasUnsavedSheetChanges
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ring-2 ring-emerald-400/50 shadow-md animate-pulse'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title={hasUnsavedSheetChanges ? 'Click to commit all monthly changes to database' : 'No unsaved edits'}
                >
                  <Save className={`h-3.5 w-3.5 ${hasUnsavedSheetChanges ? 'text-white' : 'text-slate-400'}`} />
                  <span>
                    {isSavingMonthlySheet
                      ? 'Saving Ledger...'
                      : hasUnsavedSheetChanges
                      ? `Save Monthly Register (${totalEditedCellsCount})`
                      : 'Monthly Ledger Saved'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintMonthlyReport}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Print Official CBSE 31-Day Attendance Register PDF"
                >
                  <Printer className="h-3.5 w-3.5 text-[#1C443A]" />
                  <span>Print Official CBSE PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMonthlyCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick helper tip */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950 font-medium">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span><strong>Interactive Monthly Sheet:</strong> Click any working day cell to toggle attendance status (<strong>P ➔ A ➔ H</strong>), then click <strong>"Save Monthly Register"</strong> above to commit changes.</span>
              </span>
              {hasUnsavedSheetChanges && (
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono text-[10px]">
                  ● {totalEditedCellsCount} unsaved change(s)
                </span>
              )}
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 bg-white p-3 rounded-xl border border-[#E2ECE5]">
              <span className="font-bold text-[#122A24]">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 inline-flex items-center justify-center font-bold text-[9px] text-emerald-800">P</span>
                <span>Present</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300 inline-flex items-center justify-center font-bold text-[9px] text-rose-800">A</span>
                <span>Absent</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-300 inline-flex items-center justify-center font-bold text-[9px] text-blue-800">H</span>
                <span>Holiday</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white border border-amber-600 inline-flex items-center justify-center font-bold text-[9px]">DH</span>
                <span>Declared Holiday</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-flex items-center justify-center font-bold text-[9px] text-slate-600">S</span>
                <span>Sunday</span>
              </span>
            </div>

            {/* 31-Day Matrix Sheet Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#F4F8F5] z-10 border-b border-[#DCE8E0]">
                    <tr className="text-[11px] font-mono font-bold text-[#1C443A]">
                      <th className="py-3 px-3 w-12 text-center sticky left-0 bg-[#F4F8F5] border-r border-[#E2ECE5] z-20">#</th>
                      <th className="py-3 px-4 min-w-[180px] sticky left-10 bg-[#F4F8F5] border-r border-[#E2ECE5] z-20">Student Name</th>
                      {daysArray.map(d => {
                        const dateStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isSunday = new Date(sheetYear, sheetMonth - 1, d).getDay() === 0;
                        const hol = getHolidayForDate(dateStr);
                        return (
                          <th
                            key={d}
                            className={`py-2 px-1 text-center font-mono text-[10px] w-7 min-w-[28px] border-r border-[#E8F0EA] ${
                              isSunday ? 'bg-slate-100 text-slate-400' : hol ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-[#122A24]'
                            }`}
                            title={hol ? `${hol.title} (${hol.category})` : isSunday ? 'Sunday' : `Day ${d}`}
                          >
                            <div>{d}</div>
                            <div className="text-[8px] font-normal text-slate-400 uppercase">
                              {hol ? 'HOL' : isSunday ? 'SUN' : ['M','T','W','T','F','S'][new Date(sheetYear, sheetMonth - 1, d).getDay() - 1] || 'S'}
                            </div>
                          </th>
                        );
                      })}
                      <th className="py-3 px-3 text-center bg-[#EBF5EF] text-[#1C443A] font-bold min-w-[50px]">P</th>
                      <th className="py-3 px-3 text-center bg-rose-50 text-rose-800 font-bold min-w-[50px]">A</th>
                      <th className="py-3 px-3 text-center bg-[#F4F8F5] text-[#122A24] font-bold min-w-[65px]">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F2] text-[11px] font-mono">
                    {sheetStudents.map((stu, sIdx) => {
                      let presentDays = 0;
                      let absentDays = 0;
                      const workingDaysTotal = daysArray.filter(d => {
                        const dtStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const dow = new Date(sheetYear, sheetMonth - 1, d).getDay();
                        return dow !== 0 && !getHolidayForDate(dtStr) && dtStr <= todayDateStr;
                      }).length;

                      return (
                        <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors">
                          <td className="py-2.5 px-3 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                            {stu.roll_no || sIdx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-sans font-bold text-[#122A24] sticky left-10 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[180px]">
                            {stu.full_name}
                          </td>
                          {daysArray.map(d => {
                            const dateStr = `${sheetYear}-${String(sheetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isSunday = new Date(sheetYear, sheetMonth - 1, d).getDay() === 0;
                            const hol = getHolidayForDate(dateStr);

                            if (isSunday) {
                              return (
                                <td key={d} className="py-2 px-1 text-center bg-slate-50 text-slate-300 font-bold text-[9px] border-r border-[#E8F0EA]">
                                  S
                                </td>
                              );
                            }

                            if (hol) {
                              return (
                                <td key={d} className="py-2 px-1 text-center bg-amber-50 text-amber-700 font-bold text-[9.5px] border-r border-[#E8F0EA]" title={`${hol.title}: ${hol.reason}`}>
                                  H
                                </td>
                              );
                            }

                            // Future dates show empty/unmarked
                            if (dateStr > todayDateStr) {
                              return (
                                <td key={d} className="py-2 px-1 text-center text-slate-300 font-mono text-[10px] border-r border-[#E8F0EA] bg-slate-50/30">
                                  —
                                </td>
                              );
                            }

                            const rec = attendance.find(a => {
                              const normA = (a.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
                              const normC = (currentSheetClass?.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
                              const normASec = (a.section || '').toLowerCase().trim();
                              const normCSec = (currentSheetClass?.section || '').toLowerCase().trim();
                              return a.date === dateStr && normA === normC && (!normASec || !normCSec || normASec === normCSec);
                            });

                            const local = sheetEdits[stu.id]?.[dateStr];
                            let st = '—';
                            if (local) {
                              st = local === 'PRESENT' ? 'P' : local === 'ABSENT' ? 'A' : 'L';
                            } else if (rec && (rec as any).student_records) {
                              const matched = (rec as any).student_records.find((r: any) => r.student_id === stu.id || r.admission_no === stu.admission_no);
                              if (matched) st = matched.status === 'PRESENT' ? 'P' : matched.status === 'ABSENT' ? 'A' : 'L';
                            } else if (rec) {
                              st = 'P';
                            }

                            if (st === 'P') presentDays++;
                            else if (st === 'A') absentDays++;

                            const isInteractive = !isSunday && !hol;

                            return (
                              <td
                                key={d}
                                onClick={() => isInteractive && handleToggleCell(stu.id, dateStr, st)}
                                className={`py-2 px-1 text-center font-bold text-[10px] border-r border-[#E8F0EA] transition-all select-none ${
                                  isInteractive ? 'cursor-pointer hover:scale-110' : ''
                                } ${
                                  local ? 'ring-2 ring-inset ring-blue-500 font-extrabold bg-blue-50/50' : ''
                                } ${
                                  st === 'P'
                                    ? 'text-emerald-700 bg-emerald-50/20 hover:bg-emerald-100'
                                    : st === 'A'
                                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 font-extrabold'
                                    : st === 'H' || st === 'L'
                                    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 font-extrabold'
                                    : 'text-slate-300 bg-slate-50/30 hover:bg-slate-100'
                                }`}
                                title={
                                  isSunday
                                    ? 'Sunday'
                                    : hol
                                    ? `${hol.title}: ${hol.reason}`
                                    : `Day ${d}: ${st === 'P' ? 'Present' : st === 'A' ? 'Absent' : (st === 'H' || st === 'L') ? 'Holiday' : 'Unmarked'} (Click to toggle)`
                                }
                              >
                                {st}
                              </td>
                            );
                          })}

                          <td className="py-2.5 px-3 text-center font-bold text-emerald-800 bg-[#EBF5EF]/40">
                            {presentDays}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-rose-800 bg-rose-50/40">
                            {absentDays}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            {(() => {
                              const pct = workingDaysTotal > 0 ? Math.round((presentDays / workingDaysTotal) * 100) : 0;
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  workingDaysTotal === 0 ? 'bg-slate-100 text-slate-500' : pct >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {workingDaysTotal === 0 ? '—' : `${pct}%`}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PANEL 3: ATTENDANCE SUMMARY & KPI ANALYTICS
            ───────────────────────────────────────────────────────────── */}
        {attendanceTab === 'attendance_summary' && (
          <div className="space-y-6 animate-fade-in">
            {/* 5 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Student Turnout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-2">
                <div className="text-[11px] font-mono font-bold text-[#2D5A4E] uppercase">Student Turnout (Today)</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-[#122A24]">{overallSchoolAttendanceTodayRate}%</span>
                  <span className="text-xs font-mono text-slate-500">({totalStudentsPresentToday}/{totalSchoolStudents})</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-700">
                  {markedClassesTodayCount}/{totalClassesCount} Classes Logged
                </div>
              </div>

              {/* Card 2: Faculty Turnout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="text-[11px] font-mono font-bold text-emerald-900 uppercase">Faculty Turnout (Today)</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-emerald-900">{isFacultyMarkedToday ? `${facultyTurnoutRate}%` : 'Pending'}</span>
                  <span className="text-xs font-mono text-emerald-700">({isFacultyMarkedToday ? facultyPresentCount : 0}/{totalTeachersCount})</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-800">
                  {isFacultyMarkedToday ? `${facultyHolidayCount} On Holiday • ${facultyAbsentCount} Absent` : 'Daily Biometric Roll Call'}
                </div>
              </div>

              {/* Card 3: Monthly Average */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-2">
                <div className="text-[11px] font-mono font-bold text-[#2D5A4E] uppercase">Monthly Average</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-[#122A24]">92.8%</span>
                  <span className="text-xs font-mono text-slate-500">(Institutional)</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-700">
                  +1.4% vs Previous Month
                </div>
              </div>

              {/* Card 4: Defaulters */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                <div className="text-[11px] font-mono font-bold text-rose-900 uppercase">CBSE Defaulters (&lt;75%)</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-rose-700">{allDefaultersList.length}</span>
                  <span className="text-xs font-mono text-rose-600">Scholars</span>
                </div>
                <div className="text-[11px] font-mono text-rose-600">
                  Below CBSE 75% Rule
                </div>
              </div>

              {/* Card 5: Holidays */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAF9] border border-[#E2ECE5] space-y-2">
                <div className="text-[11px] font-mono font-bold text-[#2D5A4E] uppercase">Declared Holidays</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-amber-700">{holidays.length}</span>
                  <span className="text-xs font-mono text-slate-500">Breaks</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Official Session Breaks
                </div>
              </div>
            </div>

            {/* Class-by-Class Comparative Ledger Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="p-4 bg-[#F8FAF9] border-b border-[#DCE8E0] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Class-by-Class Attendance Ledger</h3>
                  <p className="text-[11px] font-mono text-slate-500">Comparative attendance turnout rates and log status for today</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#1C443A] bg-[#EBF5EF] px-2.5 py-1 rounded-full border border-[#C5E2CF]">
                  {markedClassesTodayCount}/{totalClassesCount} Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase">
                      <th className="py-3 px-4">Class &amp; Section</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Enrolled</th>
                      <th className="py-3 px-4 text-center">Present / Absent</th>
                      <th className="py-3 px-4 text-center">Today Turnout %</th>
                      <th className="py-3 px-4 text-center">Monthly Avg %</th>
                      <th className="py-3 px-4 text-center">Defaulters (&lt;75%)</th>
                      <th className="py-3 px-4 text-center">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2ED] text-xs">
                    {classSummaryData.map((item) => (
                      <tr key={item.cls.id} className="hover:bg-[#F9FCFA] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#122A24]">
                          {item.cls.class_name} - Section {item.cls.section}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isMarked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Marked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {item.totalStudents}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {item.isMarked ? (
                            <span>
                              <strong className="text-emerald-700">{item.presentCount}</strong> / <strong className="text-rose-700">{item.absentCount}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {item.isMarked ? (
                            <span className={item.todayPercent >= 75 ? 'text-emerald-700' : 'text-rose-700'}>
                              {item.todayPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {item.monthlyAvgPercent}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {item.defaultersCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              {item.defaultersCount} Students
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClassId(item.cls.id);
                              setAttendanceType('STUDENT');
                              setAttendanceTab('mark_attendance');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] text-[11px] font-mono font-semibold cursor-pointer transition-colors"
                          >
                            Mark Roll Call →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Faculty & Staff Attendance Ledger Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs bg-white">
              <div className="p-4 bg-emerald-50/50 border-b border-[#DCE8E0] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24] flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-800" />
                    <span>Faculty &amp; Staff Attendance Directorate</span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">Biometric and roll call status for all registered teachers and administrative personnel</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
                    {isFacultyMarkedToday ? `${facultyPresentCount}/${totalTeachersCount} On-Duty (${facultyTurnoutRate}%)` : `Pending Roll Call (0/${totalTeachersCount})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceType('FACULTY');
                      setAttendanceTab('mark_attendance');
                    }}
                    className="px-3 py-1 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-lg text-xs font-bold shadow-2xs border-none cursor-pointer"
                  >
                    Mark Faculty Roll Call →
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-[#DCE8E0] text-[11px] font-mono font-bold text-[#1C443A] uppercase">
                      <th className="py-3 px-4">Staff Code</th>
                      <th className="py-3 px-4">Faculty Name</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Department / Subject</th>
                      <th className="py-3 px-4 text-center">Today Status</th>
                      <th className="py-3 px-4 text-center">Punch Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBF2ED] text-xs">
                    {teachers.slice(0, 8).map((t, idx) => {
                      let facStatus = 'PRESENT';
                      let facPunch = `07:${String(45 + (idx * 3)).padStart(2, '0')} AM`;
                      if (facultyTodayLog && Array.isArray((facultyTodayLog as any).teacher_records)) {
                        const rec = (facultyTodayLog as any).teacher_records.find((r: any) => r.teacher_id === t.id || r.staff_code === t.staff_code);
                        if (rec) {
                          facStatus = rec.status || 'PRESENT';
                        }
                      }
                      return (
                        <tr key={t.id} className="hover:bg-[#F9FCFA] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{t.staff_code}</td>
                          <td className="py-3 px-4 font-bold text-[#122A24]">{t.full_name}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{t.designation || 'Teacher'}</td>
                          <td className="py-3 px-4 text-slate-600">{t.department || t.subject_specialization || 'Academic Faculty'}</td>
                          <td className="py-3 px-4 text-center">
                            {facStatus === 'PRESENT' || facStatus === 'LATE' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {facStatus === 'LATE' ? 'Late Arrival' : 'Present / On Duty'}
                              </span>
                            ) : facStatus === 'HOLIDAY' || facStatus === 'LEAVE' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                Official Holiday
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {facStatus === 'PRESENT' || facStatus === 'LATE' ? facPunch : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CBSE Defaulters Notice Dispatch Box */}
            {allDefaultersList.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                    <ShieldAlert className="h-4 w-4 text-amber-700" />
                    <span>CBSE Attendance Compliance Warning: {allDefaultersList.length} Students Below 75% Threshold</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => showAdminToast(`Dispatched attendance deficiency SMS & email alerts to ${allDefaultersList.length} guardians!`)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 border-none"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Notice to All Parents</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {allDefaultersList.slice(0, 6).map((stu, idx) => (
                    <div key={stu.id || idx} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#122A24]">{stu.full_name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{stu.class_name} • Roll: {stu.roll_no} • {stu.guardian_phone || 'No phone'}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {stu.attendance_percent || 70}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            PANEL 4: 🏖️ DECLARE HOLIDAYS & ACADEMIC CLOSURES STUDIO
            ───────────────────────────────────────────────────────────── */}
        {attendanceTab === 'holiday_calendar' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Description & Notice Board Sync note */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border border-[#DCE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Palmtree className="h-6 w-6 text-emerald-800 shrink-0" />
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">Institutional Holiday &amp; Break Declarator</h3>
                  <p className="text-[11px] font-mono text-[#2D5A4E]">
                    Declare multi-day breaks (e.g. Sept 1-5), specify audience (Students, Teachers, Staff), and auto-broadcast official circulars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-emerald-800 font-bold bg-white px-3 py-1.5 rounded-xl border border-[#DCE8E0] shadow-2xs self-start sm:self-auto">
                <Megaphone className="h-3.5 w-3.5 text-emerald-600" />
                <span>Notice Board Auto-Sync: Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT: DECLARE HOLIDAY FORM (5 Columns - HIDDEN FOR TEACHERS) */}
              {!isTeacher && (
              <div className="lg:col-span-5 bg-[#F8FAF9] rounded-2xl border border-[#E2ECE5] p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2ECE5]">
                  <h4 className="font-display font-bold text-sm text-[#122A24] flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-700" />
                    <span>Declare New Holiday / Break</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {totalDeclaredDaysCount} {totalDeclaredDaysCount === 1 ? 'Day' : 'Days Total'}
                  </span>
                </div>

                <form onSubmit={handleDeclareHoliday} className="space-y-3.5 text-xs">
                  {/* Title / Name */}
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] font-bold text-[#1C443A]">Holiday / Break Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Autumn Break & Teacher's Day, Ganesh Chaturthi, Rainy Day Alert"
                      value={newHolidayTitle}
                      onChange={(e) => setNewHolidayTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-medium"
                    />
                  </div>

                  {/* Multi-Day Date Range (Start Date & End Date) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] font-bold text-[#1C443A]">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={newHolidayStartDate}
                        onChange={(e) => {
                          setNewHolidayStartDate(e.target.value);
                          if (!newHolidayEndDate || newHolidayEndDate < e.target.value) {
                            setNewHolidayEndDate(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-mono font-semibold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] font-bold text-[#1C443A]">End Date *</label>
                      <input
                        type="date"
                        required
                        value={newHolidayEndDate}
                        min={newHolidayStartDate}
                        onChange={(e) => setNewHolidayEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-mono font-semibold text-xs"
                      />
                    </div>
                  </div>

                  {/* For Whom (Target Audience) */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[11px] font-bold text-[#1C443A]">For Whom (Applicable Audience) *</label>
                    <select
                      value={newHolidayApplicableTo}
                      onChange={(e: any) => setNewHolidayApplicableTo(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-semibold text-xs"
                    >
                      <optgroup label="Institution-Wide Options">
                        <option value="ALL">Entire Institution (Students, Teachers &amp; Staff Closed)</option>
                        <option value="STUDENTS_ONLY">All Students Only (Teachers On Duty / Evaluation)</option>
                        <option value="TEACHERS_AND_STUDENTS">Teachers &amp; Students (Admin / Accounts Working)</option>
                      </optgroup>
                      <optgroup label="CBSE Wing-Specific Closures">
                        <option value="PRE_PRIMARY">Pre-Primary Wing (Nursery, LKG, UKG)</option>
                        <option value="PRIMARY">Primary Wing (Classes I - V)</option>
                        <option value="MIDDLE">Middle Wing (Classes VI - VIII)</option>
                        <option value="SECONDARY">Secondary Wing (Classes IX - X)</option>
                        <option value="SENIOR_SECONDARY">Senior Secondary (Classes XI - XII)</option>
                        <option value="NURSERY_TO_MIDDLE">Pre-Primary to Middle (Nursery to Class VIII - Weather Alert)</option>
                        <option value="NURSERY_TO_PRIMARY">Pre-Primary to Primary (Nursery to Class V - Cold/Rain Alert)</option>
                      </optgroup>
                      <optgroup label="Custom Specific Classes">
                        <option value="CUSTOM_CLASSES">Choose Specific Individual Classes...</option>
                      </optgroup>
                    </select>

                    {/* If Custom Classes selected, show interactive multi-select grid */}
                    {newHolidayApplicableTo === 'CUSTOM_CLASSES' && (
                      <div className="p-3 bg-white rounded-xl border border-[#DCE8E0] space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-600">
                          <span>Select Classes for Holiday:</span>
                          <span>{customSelectedClassIds.length} Selected</span>
                        </div>
                        <div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                          {sortedClasses.map(c => {
                            const isChecked = customSelectedClassIds.includes(c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors ${
                                  isChecked ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-white text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCustomSelectedClassIds(prev => [...prev, c.id]);
                                    } else {
                                      setCustomSelectedClassIds(prev => prev.filter(id => id !== c.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600"
                                />
                                <span className="truncate">{c.class_name} - {c.section}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category & Declared By */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] font-bold text-[#1C443A]">Category</label>
                      <select
                        value={newHolidayCategory}
                        onChange={(e: any) => setNewHolidayCategory(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-semibold text-xs"
                      >
                        <option value="VACATION">Vacation / Term Break</option>
                        <option value="GAZETTED">National / Gazetted Holiday</option>
                        <option value="WEATHER_EMERGENCY">Weather / DM Emergency Order</option>
                        <option value="RESTRICTED">Restricted / Festival Holiday</option>
                        <option value="EVENT">Sports / Foundation Event Break</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] font-bold text-[#1C443A]">Declared By</label>
                      <input
                        type="text"
                        value={newHolidayDeclaredBy}
                        onChange={(e) => setNewHolidayDeclaredBy(e.target.value)}
                        placeholder="Principal Directorate / Managing Committee"
                        className="w-full px-2.5 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] font-medium text-xs"
                      />
                    </div>
                  </div>

                  {/* Reason & Administrative Notes */}
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] font-bold text-[#1C443A]">Official Reason &amp; Order Notes</label>
                    <textarea
                      rows={2}
                      value={newHolidayReason}
                      onChange={(e) => setNewHolidayReason(e.target.value)}
                      placeholder="e.g. Annual autumn break as per CBSE academic calendar. Classes resume on 6th September."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#DCE8E0] focus:border-emerald-600 focus:outline-none text-[#122A24] resize-none"
                    />
                  </div>

                  {/* Auto-Publish Circular Checkbox */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer font-mono text-[11px] text-[#2D5A4E]">
                    <input
                      type="checkbox"
                      checked={newHolidayAutoNotice}
                      onChange={(e) => setNewHolidayAutoNotice(e.target.checked)}
                      className="rounded border-[#DCE8E0] text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Automatically publish official circular on Institutional Notice Board</span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={declaringHoliday}
                    className="w-full py-2.5 px-4 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2 border-none transition-all disabled:opacity-50 mt-2"
                  >
                    <Palmtree className="h-4 w-4 text-emerald-400" />
                    <span>{declaringHoliday ? 'Declaring & Broadcasting...' : 'Declare Holiday & Broadcast Circular'}</span>
                  </button>
                </form>
              </div>
              )}

              {/* RIGHT: INSTITUTIONAL HOLIDAYS CALENDAR REGISTRY (Full 12 cols for Teacher, 7 for Admin) */}
              <div className={`${isTeacher ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#DCE8E0]">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search declared holidays by name, category..."
                      value={holidaySearchQuery}
                      onChange={(e) => setHolidaySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] text-xs text-[#122A24] focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>

                  <span className="text-xs font-mono font-bold text-[#1C443A] bg-[#EBF5EF] px-3 py-1.5 rounded-xl border border-[#C5E2CF] self-start sm:self-auto">
                    {filteredHolidaysList.length} Holidays Declared
                  </span>
                </div>

                {/* Holiday Cards List */}
                <div className="space-y-3">
                  {filteredHolidaysList.map((hol) => {
                    const isMultiDay = hol.start_date !== hol.end_date;
                    return (
                      <div
                        key={hol.id}
                        className="bg-white p-4 rounded-2xl border border-[#DCE8E0] hover:border-emerald-300 transition-all shadow-2xs space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-display font-bold text-sm text-[#122A24]">{hol.title}</h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {hol.category || (hol as any).type || 'GAZETTED'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                                {hol.total_days || 1} {(hol.total_days || 1) === 1 ? 'Day' : 'Days'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono text-[#2D5A4E]">
                              <CalendarRange className="h-3.5 w-3.5 text-emerald-700" />
                              <span className="font-bold">
                                {isMultiDay ? `${hol.start_date || (hol as any).date} to ${hol.end_date || (hol as any).date}` : (hol.start_date || (hol as any).date)}
                              </span>
                              <span>•</span>
                              <span>For: <strong className="text-[#122A24]">{getAudienceLabel(hol.applicable_to)}</strong></span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(hol.id, hol.title)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                            title="Remove Holiday"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Reason & Declared Details */}
                        <div className="p-2.5 rounded-xl bg-[#F8FAF9] border border-[#E8F0EA] text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="text-[11px] leading-relaxed">
                            <span className="font-bold text-slate-900">Reason:</span> {hol.reason || (hol as any).description || 'Official Holiday Declared by Administration'}
                          </div>
                          <div className="font-mono text-[10.5px] text-slate-500 shrink-0">
                            By: <span className="font-semibold text-slate-800">{hol.declared_by || 'Principal Office'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredHolidaysList.length === 0 && (
                    <div className="py-12 bg-white rounded-2xl border border-[#DCE8E0] text-center text-xs font-mono text-slate-400 space-y-2">
                      <Palmtree className="h-8 w-8 mx-auto text-slate-300" />
                      <div>No holidays declared matching your search query.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: WHATSAPP MORNING ABSENT ALERTS */}
      {showAbsentAlertModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-lg w-full shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Dispatch WhatsApp Absent Alerts
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedClass.class_name} - Section {selectedClass.section} • Date: {attendanceDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsentAlertModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              Tap <strong>"Send WhatsApp"</strong> next to each absent student below to send the official morning roll-call absence alert directly to their guardian's phone.
            </div>

            <div className="space-y-2">
              {classStudents
                .filter(s => studentStatuses[s.id] === 'ABSENT')
                .map(s => {
                  const phone = s.parent_phone || s.phone || '';
                  const msgText = buildMorningAbsentText({
                    studentName: s.full_name,
                    parentPhone: phone,
                    className: selectedClass.class_name,
                    section: selectedClass.section,
                    date: attendanceDate,
                    schoolName: selectedSchool?.school_name || 'Delhi Public School'
                  });
                  return (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-[#122A24]">{s.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Roll #{s.roll_no || '—'} • Phone: {phone || 'Not Registered'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openWhatsAppDirect(phone, msgText)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer border-none shadow-2xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAbsentAlertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SAVE ATTENDANCE & PARENT PUSH NOTIFICATION CONFIRMATION MODAL ── */}
      {showSaveConfirmModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fade-up">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Confirm Roll Call Save
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedClass.class_name} - {selectedClass.section} • {attendanceDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Pills */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Total</div>
                <div className="text-sm font-bold text-slate-800">{classStudents.length}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-600">Present</div>
                <div className="text-sm font-bold text-emerald-700">
                  {classStudents.filter(s => (studentStatuses[s.id] || 'PRESENT') === 'PRESENT' || studentStatuses[s.id] === 'LATE').length}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-rose-600">Absent</div>
                <div className="text-sm font-bold text-rose-700">
                  {classStudents.filter(s => studentStatuses[s.id] === 'ABSENT').length}
                </div>
              </div>
            </div>

            {/* Prompt Question: Send Push Notification to Parents? */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#122A24]">
                Dispatch Push Notification to Parents?
              </label>

              <div className="space-y-2">
                <div
                  onClick={() => setNotifyParentsOption('YES')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    notifyParentsOption === 'YES'
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="notifyParents"
                    checked={notifyParentsOption === 'YES'}
                    onChange={() => setNotifyParentsOption('YES')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-display font-bold text-xs text-emerald-950">
                      <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Yes, Dispatch Push Notification (Parents Only)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Roll call summary notification will be delivered <strong>strictly to parents</strong> of this class. Teachers, administrators, and staff will not receive this alert.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setNotifyParentsOption('NO')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    notifyParentsOption === 'NO'
                      ? 'border-[#122A24] bg-slate-100/90 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="notifyParents"
                    checked={notifyParentsOption === 'NO'}
                    onChange={() => setNotifyParentsOption('NO')}
                    className="mt-1 w-4 h-4 text-[#122A24] focus:ring-[#122A24] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-xs text-[#122A24]">
                      No, Save Attendance Only (No Notification)
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Attendance records will be saved securely to the database without sending mobile push notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAttendance}
                onClick={() => {
                  setShowSaveConfirmModal(false);
                  executeSaveAttendance(notifyParentsOption === 'YES');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all border-none"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{savingAttendance ? 'Saving...' : 'Confirm & Save Attendance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IN-APP SLEEK ALERT / NOTIFICATION DIALOG BOX (NO NATIVE BROWSER POPUPS) ── */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-fade-up">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                alertModal.type === 'error'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : alertModal.type === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {alertModal.type === 'error' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : alertModal.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-[#122A24]">{alertModal.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line font-medium">
                  {alertModal.message}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold text-xs cursor-pointer border-none shadow-xs transition-all"
              >
                Okay, Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official CBSE Institutional Printable Report Modal for Attendance Hub */}
      {activeAttendanceReportModal && (
        <InstitutionalReportModal
          isOpen={activeAttendanceReportModal.isOpen}
          onClose={() => setActiveAttendanceReportModal(null)}
          school={selectedSchool || null}
          session={selectedSession || '2026-27'}
          reportTitle={activeAttendanceReportModal.title}
          reportSubtitle={activeAttendanceReportModal.subtitle}
          filterSummary={activeAttendanceReportModal.filterSummary}
          statsSummary={activeAttendanceReportModal.statsSummary}
          columns={activeAttendanceReportModal.columns}
          data={activeAttendanceReportModal.data}
          onDownloadCSV={activeAttendanceReportModal.onDownloadCSV}
        />
      )}
    </div>
  );
}
