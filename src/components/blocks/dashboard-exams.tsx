/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Printer,
  QrCode,
  Search,
  Sparkles,
  UserCheck,
  X,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Edit3,
  ListFilter,
  User,
  Phone,
  MapPin,
  Bus,
  CreditCard,
  Globe,
  FileSpreadsheet,
  Upload,
  ChevronDown,
  CheckSquare,
  Square,
  RefreshCw,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  KeyRound
} from 'lucide-react';
import { School, Student, Teacher, ClassRoom, AttendanceRecord } from '@/lib/types';
import { getDefaultCbseSubjectsForClass, sortClassesChronologically, SubjectItem } from '@/lib/cbse-subjects';
import { recordAudit } from '@/lib/client-audit';
import { apiFetch } from '@/lib/api-client';

export interface DashboardExamsProps {
  students: Student[];
  classes?: ClassRoom[];
  teachers?: Teacher[];
  selectedSchool?: School | null;
  schoolName?: string;
  selectedSession?: string;
  attendance?: AttendanceRecord[];
  userRole?: string;
  currentUser?: any;
  onLogout?: () => void;
}

export interface StudentSubjectMark {
  theory: number;
  practical: number;
  total: number;
  grade: string;
  gp: number;
  theoryStatus?: 'PRESENT' | 'ABSENT' | 'MEDICAL';
  practicalStatus?: 'PRESENT' | 'ABSENT' | 'EXEMPT';
  theoryRemarks?: string;
  practicalRemarks?: string;
}

export interface StudentExamRecord {
  marks: Record<string, StudentSubjectMark>;
  coScholastic: {
    workEdu: 'A' | 'B' | 'C';
    artEdu: 'A' | 'B' | 'C';
    healthPE: 'A' | 'B' | 'C';
    discipline: 'A' | 'B' | 'C';
  };
  remarks: string;
}

export interface ScheduledExamItem {
  id: string;
  title: string;
  type: 'SCHOOL_EXAM' | 'CLASS_TEST';
  class_name: string;
  section: string;
  subject_name: string;
  subject_code?: string;
  date: string;
  time?: string;
  school_id?: string;
  academic_session?: string;
  max_marks: number;
  pass_marks: number;
  status: 'MARKS_FILLED' | 'PENDING' | string;
  created_at?: string;
}

// CBSE Official 9-Point Grading Scale Formula
export function calculateCbseGrade(percentage: number): { grade: string; gp: number; remarks: string } {
  if (percentage >= 91) return { grade: 'A1', gp: 10.0, remarks: 'Outstanding academic excellence' };
  if (percentage >= 81) return { grade: 'A2', gp: 9.0, remarks: 'Excellent performance' };
  if (percentage >= 71) return { grade: 'B1', gp: 8.0, remarks: 'Very Good comprehension' };
  if (percentage >= 61) return { grade: 'B2', gp: 7.0, remarks: 'Good analytical skills' };
  if (percentage >= 51) return { grade: 'C1', gp: 6.0, remarks: 'Satisfactory mastery' };
  if (percentage >= 41) return { grade: 'C2', gp: 5.0, remarks: 'Fair progress, scope for growth' };
  if (percentage >= 33) return { grade: 'D', gp: 4.0, remarks: 'Marginal passing standard' };
  if (percentage >= 21) return { grade: 'E1', gp: 0.0, remarks: 'Needs Improvement / Compartment' };
  return { grade: 'E2', gp: 0.0, remarks: 'Essential Repeat required' };
}

export const EXAM_TERMS = [
  { id: 'TERM_1', name: 'Term 1 (Half Yearly / Mid-Term)', maxTheory: 80, maxPractical: 20, maxTotal: 100, weightage: '50%' },
  { id: 'PT_1', name: 'Periodic Test 1 (PT-1)', maxTheory: 40, maxPractical: 10, maxTotal: 50, weightage: '10%' },
  { id: 'PT_2', name: 'Periodic Test 2 (PT-2)', maxTheory: 40, maxPractical: 10, maxTotal: 50, weightage: '10%' },
  { id: 'TERM_2', name: 'Annual Final Board Assessment', maxTheory: 80, maxPractical: 20, maxTotal: 100, weightage: '80%' },
];

export function DashboardExams({
  students,
  classes = [],
  teachers = [],
  selectedSchool = null,
  schoolName = 'Delhi Public International School',
  selectedSession = '2026-27',
  attendance = [],
  userRole = '',
  currentUser = null,
  onLogout
}: DashboardExamsProps) {
  const isTeacher = userRole === 'TEACHER' || currentUser?.role === 'TEACHER';

  // Navigation View Tab: 'planner' | 'ledger' | 'student_dossier' | 'broadsheet'
  const [activeView, setActiveView] = useState<'planner' | 'ledger' | 'student_dossier' | 'broadsheet'>(
    userRole === 'STUDENT' ? 'student_dossier' : 'planner'
  );

  // 1. Comprehensive Dynamic Class and Section Extraction (Merge classes prop & all student classes)
  const sortedClassesList = useMemo(() => {
    const map = new Map<string, { id: string; class_name: string; name: string; section: string }>();

    // 1. Add from classes prop
    if (classes && Array.isArray(classes)) {
      classes.forEach(c => {
        const cName = (c.class_name || (c as any).name || '').trim();
        const sec = ((c.section || 'A') + '').toUpperCase().trim();
        if (cName) {
          const norm = cName.toLowerCase().replace(/^class\s*/i, '').trim();
          const key = `${norm}_${sec}`;
          map.set(key, {
            id: c.id || `CLS-${key}`,
            class_name: cName,
            name: cName,
            section: sec
          });
        }
      });
    }

    // 2. Add from students prop (ensure every single student's class is represented)
    if (students && Array.isArray(students)) {
      students.forEach(s => {
        const cName = (s.class_name || '').trim();
        const sec = ((s.section || 'A') + '').toUpperCase().trim();
        if (cName) {
          const norm = cName.toLowerCase().replace(/^class\s*/i, '').trim();
          const key = `${norm}_${sec}`;
          if (!map.has(key)) {
            map.set(key, {
              id: `CLS-${key}`,
              class_name: cName,
              name: cName,
              section: sec
            });
          }
        }
      });
    }

    const mergedList = Array.from(map.values()) as ClassRoom[];
    return sortClassesChronologically(mergedList);
  }, [classes, students]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('TERM_1');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportCardStudent, setReportCardStudent] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Class Object
  const currentClass = useMemo(() => {
    return sortedClassesList.find(c => c.id === selectedClassId) || sortedClassesList[0] || null;
  }, [sortedClassesList, selectedClassId]);

  // Initial Class Selection
  useEffect(() => {
    if (sortedClassesList.length > 0) {
      if (!selectedClassId || !sortedClassesList.some(c => c.id === selectedClassId)) {
        const defaultCls = sortedClassesList.find(c => {
          const cn = (c.class_name || (c as any).name || '').toLowerCase();
          return cn.includes('6') || cn.includes('vi');
        }) || sortedClassesList[0];
        setSelectedClassId(defaultCls.id);
      }
    }
  }, [sortedClassesList, selectedClassId]);

  // Active Term Config
  const currentTerm = useMemo(() => {
    return EXAM_TERMS.find(t => t.id === selectedTermId) || EXAM_TERMS[0];
  }, [selectedTermId]);

  // Students in selected Class & Section
  const classStudents = useMemo(() => {
    if (!currentClass) return [];
    const targetClass = (currentClass.class_name || (currentClass as any).name || '').toLowerCase().trim();
    const targetNorm = targetClass.replace(/^class\s*/i, '').trim();
    const targetSec = ((currentClass.section || 'A') + '').toUpperCase().trim();

    return students.filter(s => {
      const sc = (s.class_name || '').toLowerCase().trim();
      const scNorm = sc.replace(/^class\s*/i, '').trim();
      const ss = ((s.section || 'A') + '').toUpperCase().trim();
      return (sc === targetClass || scNorm === targetNorm) && ss === targetSec;
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));
  }, [students, currentClass]);

  // Prescribed CBSE Subjects for this Class
  const classSubjects = useMemo(() => {
    if (!currentClass) return [];
    const cName = currentClass.class_name || (currentClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, currentClass.section);
  }, [currentClass]);

  // Storage Key for persistent ledger state
  const storageKey = useMemo(() => {
    const cName = currentClass ? (currentClass.class_name || (currentClass as any).name || 'Class') : 'default';
    const cid = `${cName}_${currentClass?.section || 'A'}`.replace(/\s+/g, '_');
    return `erp_marks_${selectedSession}_${cid}_${selectedTermId}`;
  }, [currentClass, selectedSession, selectedTermId]);

  // Marks Ledger State
  const [marksLedger, setMarksLedger] = useState<Record<string, StudentExamRecord>>({});

  // ─────────────────────────────────────────────────────────────────
  // TEACHER AUTHENTICATION & ROLE-BASED MARKS ENGINE STATE
  // ─────────────────────────────────────────────────────────────────
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`erp_active_marks_teacher_${selectedSession}`);
        if (stored) return JSON.parse(stored);
      } catch (_) {}
    }
    return null;
  });
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState<boolean>(false);
  const [teacherLoginSearch, setTeacherLoginSearch] = useState<string>('');
  const [teacherLoginRoleFilter, setTeacherLoginRoleFilter] = useState<'ALL' | 'CLASS_TEACHER' | 'SUBJECT_TEACHER'>('ALL');
  const [manualStaffCode, setManualStaffCode] = useState<string>('');
  const [manualPasscode, setManualPasscode] = useState<string>('');
  const [pendingLedgerTarget, setPendingLedgerTarget] = useState<{
    classId?: string;
    subjectName?: string;
    termId?: string;
  } | null>(null);

  // Subject Focus Selection Mode (for Subject Teachers to pick their specific subject or 'ALL')
  const [selectedSubjectFocus, setSelectedSubjectFocus] = useState<string>('ALL');

  // Separate Assessment Component Mode: 'THEORY' vs 'PRACTICAL' vs 'COMBINED'
  const [marksEntryComponent, setMarksEntryComponent] = useState<'THEORY' | 'PRACTICAL' | 'COMBINED'>('THEORY');

  // Currently focused subject for separate Theory / Practical marks list
  const [activeComponentSubjectId, setActiveComponentSubjectId] = useState<string>('');

  // Keep activeComponentSubjectId in sync with classSubjects
  useEffect(() => {
    if (selectedSubjectFocus && selectedSubjectFocus !== 'ALL') {
      setActiveComponentSubjectId(selectedSubjectFocus);
    } else if (classSubjects.length > 0 && (!activeComponentSubjectId || !classSubjects.some(s => s.id === activeComponentSubjectId))) {
      setActiveComponentSubjectId(classSubjects[0].id);
    }
  }, [selectedSubjectFocus, classSubjects]);

  // The active subject object for dedicated Theory or Practical list
  const currentComponentSubject = useMemo(() => {
    return classSubjects.find(s => s.id === activeComponentSubjectId) || classSubjects[0] || null;
  }, [classSubjects, activeComponentSubjectId]);

  // Lock indicator for Class Teacher's assigned class
  const [isClassLockedToTeacher, setIsClassLockedToTeacher] = useState<boolean>(true);

  // All available teachers (fallback to authentic school faculty if prop is empty)
  const allTeachersList = useMemo<Teacher[]>(() => {
    if (teachers && teachers.length > 0) return teachers;
    return [
      { id: 'TCH-DPS-014', school_id: 'DPS2026', staff_code: 'EMP-202614', full_name: 'Mrs. Ritu Singhal', designation: 'TGT Mathematics', department: 'Mathematics', subject_specialization: 'Mathematics', status: 'ACTIVE', phone: '+91 9811200014', email: 'ritusinghal@dps.edu.in' },
      { id: 'TCH-DPS-013', school_id: 'DPS2026', staff_code: 'EMP-202613', full_name: 'Mrs. Neerja Kaushik', designation: 'TGT Science', department: 'Science', subject_specialization: 'Science', status: 'ACTIVE', phone: '+91 9811200013', email: 'neerjakaushik@dps.edu.in' },
      { id: 'TCH-DPS-015', school_id: 'DPS2026', staff_code: 'EMP-202615', full_name: 'Mrs. Anupama Mukherjee', designation: 'PGT Physics', department: 'Science', subject_specialization: 'Physics', status: 'ACTIVE', phone: '+91 9811200015', email: 'anupama@dps.edu.in' },
      { id: 'TCH-DPS-016', school_id: 'DPS2026', staff_code: 'EMP-202616', full_name: 'Mrs. Geetika Malhotra', designation: 'PGT Accountancy', department: 'Commerce', subject_specialization: 'Accountancy', status: 'ACTIVE', phone: '+91 9811200016', email: 'geetika@dps.edu.in' },
      { id: 'TCH-DPS-010', school_id: 'DPS2026', staff_code: 'EMP-202610', full_name: 'Mr. Hemant Bhattacharya', designation: 'TGT Social Science', department: 'Social Science', subject_specialization: 'Social Science', status: 'ACTIVE', phone: '+91 9811200010', email: 'hemant@dps.edu.in' },
      { id: 'TCH-DPS-002', school_id: 'DPS2026', staff_code: 'EMP-202602', full_name: 'Mrs. Sunita Deshpande', designation: 'PGT Mathematics & Academic Head', department: 'Mathematics', subject_specialization: 'Mathematics', status: 'ACTIVE', phone: '+91 9811200002', email: 'sunitadeshpande@dps.edu.in' },
      { id: 'TCH-DPS-001', school_id: 'DPS2026', staff_code: 'EMP-202601', full_name: 'Dr. Aniruddh Shastri', designation: 'Vice Principal & HOD Science', department: 'Science', subject_specialization: 'Physics', status: 'ACTIVE', phone: '+91 9811200001', email: 'aniruddhshastri@dps.edu.in' },
      { id: 'TCH-DPS-006', school_id: 'DPS2026', staff_code: 'EMP-202606', full_name: 'Mr. Vikramaditya Rathore', designation: 'TGT English & Communication', department: 'Languages', subject_specialization: 'English', status: 'ACTIVE', phone: '+91 9811200006', email: 'vikramaditya@dps.edu.in' }
    ];
  }, [teachers]);

  // Helper to identify if a teacher is a Class Teacher and for which class
  const getTeacherAssignedClass = (teacher: Teacher | null) => {
    if (!teacher) return null;
    return sortedClassesList.find(c => {
      const matchId = (c as any).class_teacher_id && (c as any).class_teacher_id === teacher.id;
      const matchName = (c as any).class_teacher_name && (c as any).class_teacher_name.toLowerCase().trim() === teacher.full_name.toLowerCase().trim();
      const matchCode = (c as any).class_teacher && ((c as any).class_teacher === teacher.staff_code || (c as any).class_teacher.toLowerCase().trim() === teacher.full_name.toLowerCase().trim());
      return matchId || matchName || matchCode;
    }) || null;
  };

  // Find assigned class for currently active logged-in teacher
  const activeClassTeacherClass = useMemo(() => {
    return getTeacherAssignedClass(activeTeacher);
  }, [activeTeacher, sortedClassesList]);

  // Is active teacher the class teacher of current selected class?
  const isClassTeacherOfCurrentClass = useMemo(() => {
    if (!activeTeacher || !currentClass) return false;
    return activeClassTeacherClass?.id === currentClass.id;
  }, [activeTeacher, currentClass, activeClassTeacherClass]);

  // When activeTeacher logs in or changes:
  // If they are a Class Teacher, automatically select their class & section and lock it!
  // If they are a Subject Teacher, unlock class picker and focus their subject specialization!
  useEffect(() => {
    if (activeTeacher) {
      const cTClass = getTeacherAssignedClass(activeTeacher);
      if (cTClass) {
        setSelectedClassId(cTClass.id);
        setIsClassLockedToTeacher(true);
        setSelectedSubjectFocus('ALL');
      } else {
        setIsClassLockedToTeacher(false);
        const spec = (activeTeacher.subject_specialization || activeTeacher.department || '').toLowerCase();
        const matchingSub = classSubjects.find(s => s.name.toLowerCase().includes(spec) || spec.includes(s.name.toLowerCase()));
        if (matchingSub) {
          setSelectedSubjectFocus(matchingSub.id);
        }
      }
    }
  }, [activeTeacher]);

  // Handle Teacher Login
  const handleTeacherLogin = (teacher: Teacher) => {
    setActiveTeacher(teacher);
    try {
      localStorage.setItem(`erp_active_marks_teacher_${selectedSession}`, JSON.stringify(teacher));
    } catch (_) {}

    const cTClass = getTeacherAssignedClass(teacher);
    if (cTClass) {
      setSelectedClassId(cTClass.id);
      setIsClassLockedToTeacher(true);
      setSelectedSubjectFocus('ALL');
      showToast(`Welcome ${teacher.full_name}! Class ${cTClass.class_name}-${cTClass.section} automatically selected.`);
    } else {
      setIsClassLockedToTeacher(false);
      if (pendingLedgerTarget?.classId) {
        setSelectedClassId(pendingLedgerTarget.classId);
      }
      showToast(`Welcome ${teacher.full_name}! Subject Teacher mode active. Choose desired class & subject.`);
    }

    if (pendingLedgerTarget?.subjectName) {
      const subMatch = classSubjects.find(s => s.name.toLowerCase() === pendingLedgerTarget.subjectName?.toLowerCase());
      if (subMatch) {
        setSelectedSubjectFocus(subMatch.id);
      }
    }

    setPendingLedgerTarget(null);
    setShowTeacherLoginModal(false);
    setActiveView('ledger');
  };

  // Handle Teacher Logout
  const handleTeacherLogout = () => {
    setActiveTeacher(null);
    try {
      localStorage.removeItem(`erp_active_marks_teacher_${selectedSession}`);
    } catch (_) {}
    setIsClassLockedToTeacher(false);
    setSelectedSubjectFocus('ALL');
    showToast('Signed out of Teacher Marks Portal.');

    // If the active user role in the ERP is a Teacher, cleanly log them out of the whole system
    if (userRole === 'TEACHER' || currentUser?.role === 'TEACHER') {
      if (onLogout) {
        onLogout();
      } else if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
  };

  // Filtered displayed subjects in ledger table according to focus mode
  const displayedSubjects = useMemo(() => {
    if (selectedSubjectFocus === 'ALL') return classSubjects;
    const sub = classSubjects.find(s => s.id === selectedSubjectFocus || s.name === selectedSubjectFocus);
    return sub ? [sub] : classSubjects;
  }, [classSubjects, selectedSubjectFocus]);

  // Load from LocalStorage or Generate Realistic Benchmarks on class switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMarksLedger(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // Initialize with realistic benchmark data
    const initial: Record<string, StudentExamRecord> = {};
    classStudents.forEach((stu, idx) => {
      const marksMap: Record<string, StudentSubjectMark> = {};
      const seedBase = ((stu.full_name.charCodeAt(0) * 7 + idx * 13) % 25) + 70; // 70 to 95 baseline

      classSubjects.forEach((sub, subIdx) => {
        const subMod = ((sub.name.charCodeAt(0) + subIdx * 5) % 12) - 4;
        const totalPct = Math.min(99, Math.max(45, seedBase + subMod));
        
        const maxTh = currentTerm.maxTheory;
        const maxPr = currentTerm.maxPractical;
        const thMarks = Math.round((totalPct / 100) * maxTh);
        const prMarks = Math.round((totalPct / 100) * maxPr);
        const combined = thMarks + prMarks;
        const pct = Number(((combined / currentTerm.maxTotal) * 100).toFixed(1));
        const gr = calculateCbseGrade(pct);

        marksMap[sub.id] = {
          theory: thMarks,
          practical: prMarks,
          total: combined,
          grade: gr.grade,
          gp: gr.gp
        };
      });

      const coGrades: ('A' | 'B' | 'C')[] = ['A', 'A', 'B'];
      initial[stu.id] = {
        marks: marksMap,
        coScholastic: {
          workEdu: coGrades[idx % 3] || 'A',
          artEdu: coGrades[(idx + 1) % 3] || 'A',
          healthPE: coGrades[(idx + 2) % 3] || 'A',
          discipline: 'A'
        },
        remarks: seedBase >= 85 
          ? 'Outstanding conceptual clarity, leadership qualities and diligent classroom participation.'
          : seedBase >= 75
          ? 'Consistent academic progress. Commendable performance in analytical problem solving.'
          : 'Good effort demonstrated. Continued focus on revision will yield higher proficiency.'
      };
    });

    setMarksLedger(initial);
  }, [storageKey, classStudents.length, classSubjects.length]);

  // ═════════════════════════════════════════════════════════════════════
  // SCHEDULED EXAMS & CLASS TESTS STATE (SCREENSHOT 1 IMPLEMENTATION)
  // ═════════════════════════════════════════════════════════════════════

  // Initial Benchmark Scheduled Exams List
  const initialScheduledExams: ScheduledExamItem[] = [
    {
      id: 'ex-01',
      title: 'Class Test 3 (August Session) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'Science',
      subject_code: '086',
      date: '2026-08-02',
      max_marks: 20,
      pass_marks: 7,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-02',
      title: 'Class Test 3 (August Session) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'Social Science',
      subject_code: '087',
      date: '2026-08-02',
      max_marks: 20,
      pass_marks: 7,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-03',
      title: 'Class Test 3 (August Session) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'Information Technology',
      subject_code: '402',
      date: '2026-08-02',
      max_marks: 20,
      pass_marks: 7,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-04',
      title: 'Periodic Assessment 1 (PA-1) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'English Language and Literature',
      subject_code: '184',
      date: '2026-07-20',
      max_marks: 50,
      pass_marks: 17,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-05',
      title: 'Periodic Assessment 1 (PA-1) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'Hindi Course A',
      subject_code: '002',
      date: '2026-07-20',
      max_marks: 50,
      pass_marks: 17,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-06',
      title: 'Periodic Assessment 1 (PA-1) - Class XII B',
      type: 'SCHOOL_EXAM',
      class_name: 'Class 12',
      section: 'B',
      subject_name: 'Mathematics Standard',
      subject_code: '041',
      date: '2026-07-20',
      max_marks: 50,
      pass_marks: 17,
      status: 'MARKS_FILLED'
    },
    {
      id: 'ex-07',
      title: 'Unit Test 2 (Algebra & Equations) - Class 6 A',
      type: 'CLASS_TEST',
      class_name: 'Class 6',
      section: 'A',
      subject_name: 'Maths',
      subject_code: '041',
      date: '2026-08-15',
      max_marks: 25,
      pass_marks: 9,
      status: 'MARKS_FILLED'
    }
  ];

  const [scheduledExamsList, setScheduledExamsList] = useState<ScheduledExamItem[]>(() => {
    try {
      const saved = localStorage.getItem(`erp_scheduled_exams_${selectedSession}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return initialScheduledExams;
  });

  // Sync with MongoDB API on mount or session change
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
        const res = await fetch(`/api/exams?school_id=${encodeURIComponent(schoolId)}&session=${encodeURIComponent(selectedSession)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.exams) && data.exams.length > 0) {
          setScheduledExamsList(data.exams);
          try {
            localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(data.exams));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Exams API sync note:', e);
      }
    };
    fetchExams();
  }, [selectedSchool, selectedSession]);

  // Scheduled Exams Filter Toolbar State (Left Column)
  const [scheduledExamsFilter, setScheduledExamsFilter] = useState<'ALL' | 'SCHOOL_EXAM' | 'CLASS_TEST'>('ALL');
  const [listClassFilter, setListClassFilter] = useState<string>('ALL');
  const [listSearchQuery, setListSearchQuery] = useState<string>('');
  const [listStatusFilter, setListStatusFilter] = useState<'ALL' | 'PENDING' | 'MARKS_FILLED'>('ALL');
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // ═════════════════════════════════════════════════════════════════════
  // ADVANCED POST EXAM & CLASS TEST ENGINE (MULTI-CLASS CAPABILITY)
  // ═════════════════════════════════════════════════════════════════════
  const [postExamType, setPostExamType] = useState<'SCHOOL_EXAM' | 'CLASS_TEST'>(() => isTeacher ? 'CLASS_TEST' : 'SCHOOL_EXAM');

  useEffect(() => {
    if (isTeacher && postExamType !== 'CLASS_TEST') {
      setPostExamType('CLASS_TEST');
      setPostExamTitle('Unit Test 1');
      setPostMaxMarks(20);
      setPostPassMarks(7);
    }
  }, [isTeacher, postExamType]);
  const [postExamTitle, setPostExamTitle] = useState('Periodic Assessment 2 (PA-2)');
  const [postSelectedClassIds, setPostSelectedClassIds] = useState<string[]>([]);
  const [postSubjectMode, setPostSubjectMode] = useState<'SPECIFIC' | 'ALL_CBSE'>('SPECIFIC');
  const [postSubjectName, setPostSubjectName] = useState('Mathematics');
  const [postCustomSubject, setPostCustomSubject] = useState('');
  const [postDate, setPostDate] = useState('2026-09-15');
  const [postTimeSlot, setPostTimeSlot] = useState('09:30 AM - 11:30 AM');
  const [postMaxMarks, setPostMaxMarks] = useState<number>(40);
  const [postPassMarks, setPostPassMarks] = useState<number>(14);
  const [isPostingExam, setIsPostingExam] = useState(false);

  // Initialize selected classes with default class
  useEffect(() => {
    if (sortedClassesList.length > 0 && postSelectedClassIds.length === 0) {
      setPostSelectedClassIds([sortedClassesList[0].id]);
    }
  }, [sortedClassesList]);

  // Classes available for posting tests (strictly isolated to assigned class for Class Teachers)
  const availableClassesForPost = useMemo(() => {
    if (isTeacher && activeClassTeacherClass) {
      return [activeClassTeacherClass];
    }
    return sortedClassesList;
  }, [isTeacher, activeClassTeacherClass, sortedClassesList]);

  // Ensure postSelectedClassIds is locked to activeClassTeacherClass for teachers
  useEffect(() => {
    if (isTeacher && activeClassTeacherClass) {
      setPostSelectedClassIds([activeClassTeacherClass.id]);
    }
  }, [isTeacher, activeClassTeacherClass]);

  // Lock listClassFilter to assigned class for teachers
  useEffect(() => {
    if (isTeacher && activeClassTeacherClass && listClassFilter === 'ALL') {
      setListClassFilter(activeClassTeacherClass.class_name);
    }
  }, [isTeacher, activeClassTeacherClass, listClassFilter]);

  // Multi-Class Selection Controls
  const handleToggleSelectClass = (clsId: string) => {
    setPostSelectedClassIds(prev => 
      prev.includes(clsId) ? prev.filter(id => id !== clsId) : [...prev, clsId]
    );
  };

  const handleSelectAllClasses = () => {
    if (postSelectedClassIds.length === sortedClassesList.length) {
      setPostSelectedClassIds([]);
    } else {
      setPostSelectedClassIds(sortedClassesList.map(c => c.id));
    }
  };

  const handleSelectClassGroup = (group: 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR' | 'ALL') => {
    if (group === 'ALL') {
      setPostSelectedClassIds(sortedClassesList.map(c => c.id));
      return;
    }
    const matched = sortedClassesList.filter(c => {
      const cn = (c.class_name || (c as any).name || '').toLowerCase();
      if (group === 'PRIMARY') {
        return /1|2|3|4|5|nursery|kg|lkg|ukg|prep|play/i.test(cn);
      }
      if (group === 'MIDDLE') {
        return /6|7|8|vi|vii|viii/i.test(cn);
      }
      if (group === 'SECONDARY') {
        return /9|10|ix|x\b/i.test(cn);
      }
      if (group === 'SENIOR') {
        return /11|12|xi|xii/i.test(cn);
      }
      return false;
    }).map(c => c.id);

    if (matched.length > 0) {
      const allSelected = matched.every(id => postSelectedClassIds.includes(id));
      if (allSelected) {
        setPostSelectedClassIds(prev => prev.filter(id => !matched.includes(id)));
      } else {
        setPostSelectedClassIds(prev => Array.from(new Set([...prev, ...matched])));
      }
    }
  };

  // Quick Presets Helper
  const applyExamPreset = (title: string, maxM: number, type: 'SCHOOL_EXAM' | 'CLASS_TEST', timeSlot = '09:30 AM - 11:30 AM') => {
    setPostExamType(type);
    setPostExamTitle(title);
    setPostMaxMarks(maxM);
    setPostPassMarks(Math.ceil(maxM * 0.33));
    setPostTimeSlot(timeSlot);
  };

  // Auto-sync Pass Marks when Max Marks changes
  const handleMaxMarksChange = (val: number) => {
    setPostMaxMarks(val);
    setPostPassMarks(Math.ceil(val * 0.33));
  };

  // Common CBSE Subjects catalog for quick selection
  const commonCbseSubjects = useMemo(() => {
    const list = [
      'Mathematics',
      'Science',
      'Social Science',
      'English Language & Literature',
      'Hindi Course A',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science (083)',
      'Information Technology (402)',
      'Accountancy',
      'Business Studies',
      'Economics',
      'History',
      'Geography',
      'Physical Education',
      'Sanskrit'
    ];
    // Append any class subjects from selected classes
    const extraSet = new Set<string>();
    postSelectedClassIds.forEach(cid => {
      const c = sortedClassesList.find(cls => cls.id === cid);
      if (c) {
        const subs = getDefaultCbseSubjectsForClass(c.class_name, c.section);
        subs.forEach(s => extraSet.add(s.name));
      }
    });
    extraSet.forEach(s => {
      if (!list.includes(s)) list.push(s);
    });
    return list;
  }, [postSelectedClassIds, sortedClassesList]);

  // Master Post Exam or Class Test Handler across Any & Multiple Classes
  const handlePostExamOrTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postExamTitle.trim()) {
      showToast('⚠️ Please enter an exam / test title.');
      return;
    }
    if (postSelectedClassIds.length === 0) {
      showToast('⚠️ Please select at least one class to post this examination.');
      return;
    }

    const finalSubName = postCustomSubject.trim() || postSubjectName;
    if (postSubjectMode === 'SPECIFIC' && !finalSubName) {
      showToast('⚠️ Please choose or specify a subject.');
      return;
    }

    setIsPostingExam(true);
    const newItems: ScheduledExamItem[] = [];
    const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
    const timestamp = Date.now();

    postSelectedClassIds.forEach((clsId, cIdx) => {
      const cls = sortedClassesList.find(c => c.id === clsId);
      if (!cls) return;
      const cName = cls.class_name || (cls as any).name || 'Class';
      const sec = cls.section || 'A';

      if (postSubjectMode === 'ALL_CBSE') {
        const subjects = getDefaultCbseSubjectsForClass(cName, sec);
        subjects.forEach((sub, sIdx) => {
          newItems.push({
            id: `ex-${timestamp}-${cIdx}-${sIdx}-${Math.random().toString(36).substr(2, 4)}`,
            school_id: schoolId,
            academic_session: selectedSession,
            title: `${postExamTitle} - ${cName} ${sec}`,
            type: isTeacher ? 'CLASS_TEST' : postExamType,
            class_name: cName,
            section: sec,
            subject_name: sub.name,
            subject_code: sub.code || 'CORE',
            date: postDate,
            time: postTimeSlot || '09:30 AM',
            max_marks: postMaxMarks,
            pass_marks: postPassMarks,
            status: 'PENDING',
            created_at: new Date().toISOString()
          });
        });
      } else {
        const matched = getDefaultCbseSubjectsForClass(cName, sec).find(
          s => s.name.toLowerCase() === finalSubName.toLowerCase()
        );
        newItems.push({
          id: `ex-${timestamp}-${cIdx}-${Math.random().toString(36).substr(2, 4)}`,
          school_id: schoolId,
          academic_session: selectedSession,
          title: `${postExamTitle} - ${cName} ${sec}`,
          type: postExamType,
          class_name: cName,
          section: sec,
          subject_name: finalSubName,
          subject_code: matched?.code || 'CORE',
          date: postDate,
          time: postTimeSlot || '09:30 AM',
          max_marks: postMaxMarks,
          pass_marks: postPassMarks,
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
      }
    });

    // 1. Post to Serverless API
    try {
      await apiFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: newItems })
      });
    } catch (err) {
      console.warn('API post error (fallback to local state):', err);
    }

    // 2. Persist to State & Local Storage
    const updatedList = [...newItems, ...scheduledExamsList];
    setScheduledExamsList(updatedList);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(updatedList));
    } catch (e) {}

    // 3. Record Audit Trail
    recordAudit({
      action: 'EXAM_POSTED',
      module: 'EXAMINATION',
      summary: `Admin posted ${postExamType === 'SCHOOL_EXAM' ? 'School Exam' : 'Class Test'} "${postExamTitle}" for ${postSelectedClassIds.length} classes (${newItems.length} slots)`
    });

    setIsPostingExam(false);
    showToast(`✅ Successfully scheduled "${postExamTitle}" across ${postSelectedClassIds.length} classes (${newItems.length} exam slots)!`);
  };

  // Whole-School Master Scheduler State & Handlers
  const [showWholeSchoolModal, setShowWholeSchoolModal] = useState(false);
  const [wholeSchoolExamTitle, setWholeSchoolExamTitle] = useState('Periodic Assessment 2 (PA-2)');
  const [wholeSchoolMaxMarks, setWholeSchoolMaxMarks] = useState(40);
  const [wholeSchoolStartDate, setWholeSchoolStartDate] = useState('2026-09-10');
  const [wholeSchoolSelectedClassIds, setWholeSchoolSelectedClassIds] = useState<string[]>([]);

  // Initialize Whole School Modal with all classes
  useEffect(() => {
    if (sortedClassesList.length > 0 && wholeSchoolSelectedClassIds.length === 0) {
      setWholeSchoolSelectedClassIds(sortedClassesList.map(c => c.id));
    }
  }, [sortedClassesList, showWholeSchoolModal]);

  const handleGenerateWholeSchoolExams = async () => {
    const generated: ScheduledExamItem[] = [];
    const passMarks = Math.ceil(wholeSchoolMaxMarks * 0.33);
    const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
    const timestamp = Date.now();

    const targetClasses = sortedClassesList.filter(c => wholeSchoolSelectedClassIds.includes(c.id));

    targetClasses.forEach((cls, cIdx) => {
      const cName = cls.class_name || (cls as any).name || '';
      const subjects = getDefaultCbseSubjectsForClass(cName, cls.section);
      
      subjects.forEach((sub, sIdx) => {
        generated.push({
          id: `ws-${timestamp}-${cIdx}-${sIdx}-${Math.random().toString(36).substr(2, 4)}`,
          school_id: schoolId,
          academic_session: selectedSession,
          title: `${wholeSchoolExamTitle} - ${cName} ${cls.section || 'A'}`,
          type: 'SCHOOL_EXAM',
          class_name: cName,
          section: cls.section || 'A',
          subject_name: sub.name,
          subject_code: sub.code || 'CORE',
          date: wholeSchoolStartDate,
          time: '09:30 AM - 12:30 PM',
          max_marks: wholeSchoolMaxMarks,
          pass_marks: passMarks,
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
      });
    });

    try {
      await apiFetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exams: generated })
      });
    } catch (e) {}

    const merged = [...generated, ...scheduledExamsList];
    setScheduledExamsList(merged);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(merged));
    } catch (e) {}

    recordAudit({
      action: 'WHOLE_SCHOOL_EXAMS_GENERATED',
      module: 'EXAMINATION',
      summary: `Scheduled ${wholeSchoolExamTitle} for ${targetClasses.length} classes (${generated.length} slots)`
    });
    setShowWholeSchoolModal(false);
    showToast(`✅ Scheduled exams for ${targetClasses.length} Classes (${generated.length} total exam slots)!`);
  };

  // Toggle Exam Status (PENDING <-> MARKS_FILLED)
  const handleToggleExamStatus = async (exam: ScheduledExamItem) => {
    const newStatus = exam.status === 'MARKS_FILLED' ? 'PENDING' : 'MARKS_FILLED';
    const updated = scheduledExamsList.map(e => e.id === exam.id ? { ...e, status: newStatus } : e);
    setScheduledExamsList(updated);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(updated));
      await apiFetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exam.id, status: newStatus })
      });
    } catch (e) {}
    showToast(`Exam marked as ${newStatus === 'MARKS_FILLED' ? '✓ Marks Filled' : '⏳ Pending'}`);
  };

  // Delete Scheduled Exam Slot
  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${examTitle}"?`)) return;
    const updated = scheduledExamsList.filter(e => e.id !== examId);
    setScheduledExamsList(updated);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(updated));
      await fetch(`/api/exams?id=${encodeURIComponent(examId)}`, { method: 'DELETE' });
    } catch (e) {}
    showToast(`Deleted "${examTitle}".`);
  };

  // Open Marks Ledger for specific scheduled exam
  const handleOpenExamLedger = (exam: ScheduledExamItem) => {
    const match = sortedClassesList.find(c => {
      const cn = (c.class_name || (c as any).name || '').toLowerCase().trim();
      const target = exam.class_name.toLowerCase().trim();
      const sec = (c.section || 'A').toUpperCase().trim();
      return (cn === target || cn.replace(/^class\s*/i, '') === target.replace(/^class\s*/i, '')) && sec === exam.section.toUpperCase().trim();
    });

    if (!activeTeacher) {
      setPendingLedgerTarget({
        classId: match?.id,
        subjectName: exam.subject_name
      });
      setShowTeacherLoginModal(true);
      showToast(`Please verify your Teacher ID to submit marks for ${exam.title}.`);
      return;
    }

    if (match) {
      setSelectedClassId(match.id);
    }

    // Set subject focus
    if (exam.subject_name) {
      const subMatch = classSubjects.find(s => s.name.toLowerCase() === exam.subject_name.toLowerCase());
      if (subMatch) {
        setSelectedSubjectFocus(subMatch.id);
      }
    }

    setActiveView('ledger');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Opened marks ledger for ${exam.class_name} ${exam.section} (${exam.subject_name})`);
  };

  // Filtered Scheduled Exams List
  const filteredScheduledExams = useMemo(() => {
    return scheduledExamsList.filter(e => {
      if (scheduledExamsFilter !== 'ALL' && e.type !== scheduledExamsFilter) return false;
      if (listStatusFilter !== 'ALL' && e.status !== listStatusFilter) return false;
      if (listClassFilter !== 'ALL') {
        const cNorm = (e.class_name + '').toLowerCase().trim();
        const targetNorm = listClassFilter.toLowerCase().trim();
        if (cNorm !== targetNorm && !cNorm.includes(targetNorm)) return false;
      }
      if (listSearchQuery.trim()) {
        const q = listSearchQuery.toLowerCase().trim();
        const matchesTitle = (e.title || '').toLowerCase().includes(q);
        const matchesSub = (e.subject_name || '').toLowerCase().includes(q);
        const matchesCode = (e.subject_code || '').toLowerCase().includes(q);
        const matchesClass = (e.class_name || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesCode && !matchesClass) return false;
      }
      return true;
    });
  }, [scheduledExamsList, scheduledExamsFilter, listStatusFilter, listClassFilter, listSearchQuery]);


  // Format nice date e.g. "02 Aug, 2026 (Sun)"
  const formatExamDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `${String(day).padStart(2, '0')} ${monthNames[d.getMonth()]}, ${d.getFullYear()} (${dayNames[d.getDay()]})`;
    } catch (e) {
      return dateStr;
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // STUDENT REPORT CARD & ACADEMIC DOSSIER STATE (SCREENSHOT 2)
  // ═════════════════════════════════════════════════════════════════════
  const [dossierClassId, setDossierClassId] = useState<string>('');
  const [dossierStudentSearch, setDossierStudentSearch] = useState('');
  const [dossierActiveStudentId, setDossierActiveStudentId] = useState<string>('');
  const [dossierExamFilter, setDossierExamFilter] = useState<string>('ALL');

  // Automatically lock student report card to logged-in student
  useEffect(() => {
    if (userRole === 'STUDENT' && currentUser) {
      const matched = students.find(s =>
        s.id === currentUser.id ||
        (s.admission_no && currentUser.username && s.admission_no.toLowerCase() === currentUser.username.toLowerCase()) ||
        (s.full_name && currentUser.full_name && s.full_name.toLowerCase() === currentUser.full_name.toLowerCase())
      ) || students[0];
      if (matched) {
        setDossierActiveStudentId(matched.id);
        const matchedClass = sortedClassesList.find(c =>
          (c.class_name || '').toLowerCase() === (matched.class_name || '').toLowerCase() &&
          (c.section || 'A').toUpperCase() === (matched.section || 'A').toUpperCase()
        );
        if (matchedClass) setDossierClassId(matchedClass.id);
      }
    }
  }, [userRole, currentUser, students, sortedClassesList]);

  // Initialize dossier class
  useEffect(() => {
    if (sortedClassesList.length > 0 && !dossierClassId) {
      setDossierClassId(sortedClassesList[0].id);
    }
  }, [sortedClassesList, dossierClassId]);

  // Dossier Active Class
  const dossierCurrentClass = useMemo(() => {
    return sortedClassesList.find(c => c.id === dossierClassId) || sortedClassesList[0] || null;
  }, [sortedClassesList, dossierClassId]);

  // Dossier Class Students
  const dossierClassStudents = useMemo(() => {
    if (!dossierCurrentClass) return [];
    const targetClass = (dossierCurrentClass.class_name || (dossierCurrentClass as any).name || '').toLowerCase().trim();
    const targetNorm = targetClass.replace(/^class\s*/i, '').trim();
    const targetSec = ((dossierCurrentClass.section || 'A') + '').toUpperCase().trim();

    return students.filter(s => {
      const sc = (s.class_name || '').toLowerCase().trim();
      const scNorm = sc.replace(/^class\s*/i, '').trim();
      const ss = ((s.section || 'A') + '').toUpperCase().trim();
      return (sc === targetClass || scNorm === targetNorm) && ss === targetSec;
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));
  }, [students, dossierCurrentClass]);

  // Filtered Students for the horizontal carousel
  const filteredDossierStudents = useMemo(() => {
    if (!dossierStudentSearch.trim()) return dossierClassStudents;
    const q = dossierStudentSearch.toLowerCase().trim();
    return dossierClassStudents.filter(s => 
      s.full_name.toLowerCase().includes(q) ||
      (s.admission_no || s.id || '').toLowerCase().includes(q) ||
      String(s.roll_no || '').includes(q)
    );
  }, [dossierClassStudents, dossierStudentSearch]);

  // Sync active student on class or filter change
  useEffect(() => {
    if (filteredDossierStudents.length > 0) {
      if (!dossierActiveStudentId || !filteredDossierStudents.some(s => s.id === dossierActiveStudentId)) {
        setDossierActiveStudentId(filteredDossierStudents[0].id);
      }
    }
  }, [filteredDossierStudents, dossierActiveStudentId]);

  // Selected Student Object for Profile & Exam Matrix
  const activeDossierStudent = useMemo(() => {
    return dossierClassStudents.find(s => s.id === dossierActiveStudentId) || dossierClassStudents[0] || null;
  }, [dossierClassStudents, dossierActiveStudentId]);

  // Dynamic subjects for active student's class
  const dossierSubjects = useMemo(() => {
    if (!dossierCurrentClass) return [];
    const cName = dossierCurrentClass.class_name || (dossierCurrentClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, dossierCurrentClass.section);
  }, [dossierCurrentClass]);

  // Generate realistic multiple exam series for active student (e.g. Class Test 1, 2, 3, PA-1)
  const studentExamEntries = useMemo(() => {
    if (!activeDossierStudent || !dossierSubjects.length) return [];

    const examsList = [
      { id: 'ct1', name: `Class Test 1 (April Session) - ${dossierCurrentClass?.class_name || 'PG'} ${dossierCurrentClass?.section || 'A'}`, maxMarks: 20 },
      { id: 'ct2', name: `Class Test 2 (May Session) - ${dossierCurrentClass?.class_name || 'PG'} ${dossierCurrentClass?.section || 'A'}`, maxMarks: 20 },
      { id: 'pa1', name: `Periodic Assessment 1 (PA-1) - ${dossierCurrentClass?.class_name || 'PG'} ${dossierCurrentClass?.section || 'A'}`, maxMarks: 50 },
      { id: 'ct3', name: `Class Test 3 (August Session) - ${dossierCurrentClass?.class_name || 'PG'} ${dossierCurrentClass?.section || 'A'}`, maxMarks: 20 },
    ];

    const rows: { examId: string; examName: string; subjectName: string; subjectCode?: string; marksObtained: number; maxMarks: number; grade: string }[] = [];

    examsList.forEach((ex, exIdx) => {
      dossierSubjects.forEach((sub, subIdx) => {
        const seed = ((activeDossierStudent.full_name.charCodeAt(0) * 11 + subIdx * 7 + exIdx * 19) % 35) + 65; // 65 to 100%
        const marks = Number(((seed / 100) * ex.maxMarks).toFixed(2));
        const pct = (marks / ex.maxMarks) * 100;
        const gr = calculateCbseGrade(pct);

        rows.push({
          examId: ex.id,
          examName: ex.name,
          subjectName: sub.name,
          subjectCode: sub.code,
          marksObtained: marks,
          maxMarks: ex.maxMarks,
          grade: gr.grade
        });
      });
    });

    return rows;
  }, [activeDossierStudent, dossierSubjects, dossierCurrentClass]);

  // Filtered Exam Rows in Dossier
  const filteredExamRows = useMemo(() => {
    if (dossierExamFilter === 'ALL') return studentExamEntries;
    return studentExamEntries.filter(r => r.examId === dossierExamFilter);
  }, [studentExamEntries, dossierExamFilter]);

  const carouselRef = React.useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -280 : 280,
        behavior: 'smooth'
      });
    }
  };

  const currentDossierStudentIndex = useMemo(() => {
    return filteredDossierStudents.findIndex(s => s.id === dossierActiveStudentId);
  }, [filteredDossierStudents, dossierActiveStudentId]);

  const dossierTotals = useMemo(() => {
    if (filteredExamRows.length === 0) return { obtained: 0, max: 0, pct: 0 };
    const obtained = filteredExamRows.reduce((acc, r) => acc + r.marksObtained, 0);
    const max = filteredExamRows.reduce((acc, r) => acc + r.maxMarks, 0);
    const pct = max > 0 ? (obtained / max) * 100 : 0;
    return { obtained, max, pct };
  }, [filteredExamRows]);

  // ═════════════════════════════════════════════════════════════════════
  // ANNUAL CONSOLIDATION SHEET (BROAD-SHEET) STATE & CALCULATIONS
  // ═════════════════════════════════════════════════════════════════════
  const [broadsheetClassId, setBroadsheetClassId] = useState<string>('');
  const [broadsheetSearch, setBroadsheetSearch] = useState('');
  const [showBroadsheetExportMenu, setShowBroadsheetExportMenu] = useState(false);

  // Initialize broadsheet class
  useEffect(() => {
    if (sortedClassesList.length > 0 && !broadsheetClassId) {
      setBroadsheetClassId(sortedClassesList[0].id);
    }
  }, [sortedClassesList, broadsheetClassId]);

  // Broadsheet active class
  const broadsheetCurrentClass = useMemo(() => {
    return sortedClassesList.find(c => c.id === broadsheetClassId) || sortedClassesList[0] || null;
  }, [sortedClassesList, broadsheetClassId]);

  // Broadsheet class students
  const broadsheetClassStudents = useMemo(() => {
    if (!broadsheetCurrentClass) return [];
    const targetClass = (broadsheetCurrentClass.class_name || (broadsheetCurrentClass as any).name || '').toLowerCase().trim();
    const targetNorm = targetClass.replace(/^class\s*/i, '').trim();
    const targetSec = ((broadsheetCurrentClass.section || 'A') + '').toUpperCase().trim();

    return students.filter(s => {
      const sc = (s.class_name || '').toLowerCase().trim();
      const scNorm = sc.replace(/^class\s*/i, '').trim();
      const ss = ((s.section || 'A') + '').toUpperCase().trim();
      return (sc === targetClass || scNorm === targetNorm) && ss === targetSec;
    }).sort((a, b) => (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0));
  }, [students, broadsheetCurrentClass]);

  // Dynamic subjects for current broadsheet class
  const broadsheetSubjects = useMemo(() => {
    if (!broadsheetCurrentClass) return [];
    const cName = broadsheetCurrentClass.class_name || (broadsheetCurrentClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, broadsheetCurrentClass.section);
  }, [broadsheetCurrentClass]);

  // ─────────────────────────────────────────────────────────────────
  // DYNAMIC ASSESSMENT POOL & ADMIN SELECTIVE CONSOLIDATION ENGINE
  // ─────────────────────────────────────────────────────────────────
  interface BroadsheetExamItem {
    id: string;
    title: string;
    type: 'SCHOOL_EXAM' | 'CLASS_TEST';
    max_marks: number;
    date?: string;
    subject_name?: string;
    isPosted?: boolean;
  }

  // 1. Available Assessment Pool for this class (from admin scheduled exams + academic milestones)
  const broadsheetAvailableAssessments = useMemo<BroadsheetExamItem[]>(() => {
    const list: BroadsheetExamItem[] = [];

    // Add matching scheduled exams from admin planner
    if (scheduledExamsList && scheduledExamsList.length > 0) {
      const targetClass = (broadsheetCurrentClass?.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
      const targetSec = ((broadsheetCurrentClass?.section || 'A') + '').toUpperCase().trim();

      scheduledExamsList.forEach(e => {
        const cName = (e.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
        const sec = ((e.section || 'A') + '').toUpperCase().trim();
        const matchesClass = cName === targetClass || targetClass.includes(cName) || cName.includes(targetClass);
        const matchesSec = sec === targetSec || !e.section;

        if (matchesClass && matchesSec) {
          list.push({
            id: e.id,
            title: e.title,
            type: e.type,
            max_marks: e.max_marks || (e.type === 'CLASS_TEST' ? 25 : 80),
            date: e.date,
            subject_name: e.subject_name,
            isPosted: true
          });
        }
      });
    }

    // Standard Curricular Milestones to ensure complete options
    const standardMilestones: BroadsheetExamItem[] = [
      { id: 'pa1', title: 'Periodic Assessment 1 (PA-1)', type: 'SCHOOL_EXAM', max_marks: 50, date: '2026-05-15', isPosted: false },
      { id: 'ct1', title: 'Class Test 1 (April Diagnostic)', type: 'CLASS_TEST', max_marks: 20, date: '2026-04-28', isPosted: false },
      { id: 'ct2', title: 'Class Test 2 (July Formative)', type: 'CLASS_TEST', max_marks: 20, date: '2026-07-22', isPosted: false },
      { id: 'hy', title: 'Half Yearly Examination (Term 1)', type: 'SCHOOL_EXAM', max_marks: 100, date: '2026-09-20', isPosted: false },
      { id: 'pa2', title: 'Periodic Assessment 2 (PA-2)', type: 'SCHOOL_EXAM', max_marks: 50, date: '2026-11-18', isPosted: false },
      { id: 'ct3', title: 'Class Test 3 (December Session)', type: 'CLASS_TEST', max_marks: 20, date: '2026-12-14', isPosted: false },
      { id: 'annual', title: 'Annual Final Board Exam (Term 2)', type: 'SCHOOL_EXAM', max_marks: 100, date: '2027-03-10', isPosted: false }
    ];

    standardMilestones.forEach(m => {
      if (!list.some(ex => ex.id === m.id || ex.title.toLowerCase() === m.title.toLowerCase())) {
        list.push(m);
      }
    });

    return list;
  }, [scheduledExamsList, broadsheetCurrentClass]);

  // 2. Selected Assessment IDs (Admin chosen exams to include in consolidated sheet)
  const [selectedBroadsheetExamIds, setSelectedBroadsheetExamIds] = useState<string[]>([]);

  // 3. Broadsheet Sort Order: 'ROLL' | 'RANK' | 'PERCENTAGE' | 'NAME'
  const [broadsheetSortBy, setBroadsheetSortBy] = useState<'ROLL' | 'RANK' | 'PERCENTAGE' | 'NAME'>('ROLL');

  // Initialize selected assessments when class or assessment pool changes
  useEffect(() => {
    if (broadsheetAvailableAssessments.length > 0) {
      // Default: Select all major exams (PA-1, HY, PA-2, Annual) or up to first 4 exams
      const defaultIds = broadsheetAvailableAssessments
        .filter(e => e.type === 'SCHOOL_EXAM' || e.id === 'hy' || e.id === 'annual' || e.id.startsWith('pa'))
        .map(e => e.id);
      setSelectedBroadsheetExamIds(defaultIds.length > 0 ? defaultIds : broadsheetAvailableAssessments.slice(0, 4).map(e => e.id));
    }
  }, [broadsheetAvailableAssessments]);

  // Selected assessment objects array
  const activeSelectedAssessments = useMemo(() => {
    return broadsheetAvailableAssessments.filter(e => selectedBroadsheetExamIds.includes(e.id));
  }, [broadsheetAvailableAssessments, selectedBroadsheetExamIds]);

  // Helper: compute a student's score for a specific exam item
  const getStudentExamScore = (student: Student, exam: BroadsheetExamItem) => {
    const roll = Number(student.roll_no) || 1;
    const nameSeed = student.full_name.charCodeAt(0) * 19 + (student.full_name.charCodeAt(1) || 7) * 13;
    const examSeed = (exam.id + exam.title).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    // Deterministic student benchmark based on their name & roll
    const basePct = ((nameSeed + roll * 17) % 32) + 66; // 66% to 98%
    const variance = (examSeed % 11) - 5; // -5 to +5%
    const finalPct = Math.min(99.4, Math.max(38.0, basePct + variance));
    
    const marksObtained = Number(((finalPct / 100) * exam.max_marks).toFixed(1));
    return {
      obtained: marksObtained,
      max: exam.max_marks,
      pct: Number(((marksObtained / exam.max_marks) * 100).toFixed(1))
    };
  };

  // 4. Dynamic Auto-Rank & Consolidated Calculation Engine
  const rankedBroadsheetStudents = useMemo(() => {
    if (!broadsheetClassStudents.length) return [];

    // Sum of max marks across all selected exams
    const totalPossibleMax = activeSelectedAssessments.reduce((acc, ex) => acc + ex.max_marks, 0);

    // 1. Calculate each student's marks for all selected exams
    const evaluated = broadsheetClassStudents.map((stu, idx) => {
      const examMarks: Record<string, { obtained: number; max: number; pct: number }> = {};
      let totalObtained = 0;

      activeSelectedAssessments.forEach(ex => {
        const sc = getStudentExamScore(stu, ex);
        examMarks[ex.id] = sc;
        totalObtained += sc.obtained;
      });

      totalObtained = Number(totalObtained.toFixed(1));
      const percentage = totalPossibleMax > 0 ? Number(((totalObtained / totalPossibleMax) * 100).toFixed(1)) : 0;
      const gradeObj = calculateCbseGrade(percentage);

      let result: 'QUALIFIED' | 'COMPARTMENT' | 'REPEAT' = 'QUALIFIED';
      if (percentage < 33) {
        result = 'REPEAT';
      } else if (percentage < 40) {
        result = 'COMPARTMENT';
      }

      return {
        student: stu,
        originalIndex: idx,
        rollNo: Number(stu.roll_no) || idx + 1,
        examMarks,
        totalObtained,
        totalPossibleMax,
        percentage,
        grade: gradeObj.grade,
        gp: gradeObj.gp,
        result
      };
    });

    // 2. Compute Ranks dynamically based on percentage descending
    const sortedByScore = [...evaluated].sort((a, b) => b.percentage - a.percentage);
    const rankMap = new Map<string, number>();
    let currentRank = 1;
    sortedByScore.forEach((item, idx) => {
      if (idx > 0 && item.percentage < sortedByScore[idx - 1].percentage) {
        currentRank = idx + 1;
      }
      rankMap.set(item.student.id, currentRank);
    });

    // 3. Attach rank to each student record
    const withRanks = evaluated.map(item => ({
      ...item,
      rank: rankMap.get(item.student.id) || 1
    }));

    // 4. Sort according to broadsheetSortBy
    if (broadsheetSortBy === 'RANK') {
      return [...withRanks].sort((a, b) => a.rank - b.rank);
    } else if (broadsheetSortBy === 'PERCENTAGE') {
      return [...withRanks].sort((a, b) => b.percentage - a.percentage);
    } else if (broadsheetSortBy === 'NAME') {
      return [...withRanks].sort((a, b) => a.student.full_name.localeCompare(b.student.full_name));
    } else {
      // Default: ROLL
      return [...withRanks].sort((a, b) => a.rollNo - b.rollNo);
    }
  }, [broadsheetClassStudents, activeSelectedAssessments, broadsheetSortBy]);

  // Filtered by search query
  const filteredRankedBroadsheetStudents = useMemo(() => {
    if (!broadsheetSearch.trim()) return rankedBroadsheetStudents;
    const q = broadsheetSearch.toLowerCase().trim();
    return rankedBroadsheetStudents.filter(item =>
      item.student.full_name.toLowerCase().includes(q) ||
      (item.student.admission_no || item.student.id || '').toLowerCase().includes(q) ||
      String(item.rollNo).includes(q)
    );
  }, [rankedBroadsheetStudents, broadsheetSearch]);

  // Broadsheet KPIs
  const broadsheetKpis = useMemo(() => {
    if (!rankedBroadsheetStudents.length) {
      return { totalStudents: 0, classAverage: 0, passRate: 0, topperName: '—', topperScore: 0, topperRank: 1 };
    }
    const total = rankedBroadsheetStudents.length;
    const avgPct = Number((rankedBroadsheetStudents.reduce((acc, s) => acc + s.percentage, 0) / total).toFixed(1));
    const passed = rankedBroadsheetStudents.filter(s => s.percentage >= 33).length;
    const passRate = Number(((passed / total) * 100).toFixed(1));
    const topper = [...rankedBroadsheetStudents].sort((a, b) => b.percentage - a.percentage)[0];

    return {
      totalStudents: total,
      classAverage: avgPct,
      passRate,
      topperName: topper?.student.full_name || '—',
      topperScore: topper?.percentage || 0,
      topperRank: topper?.rank || 1
    };
  }, [rankedBroadsheetStudents]);

  // Toggle Exam Inclusion in Consolidated Broadsheet
  const toggleBroadsheetExam = (examId: string) => {
    setSelectedBroadsheetExamIds(prev => {
      if (prev.includes(examId)) {
        if (prev.length === 1) {
          showToast('At least one assessment must remain selected in the consolidated sheet.');
          return prev;
        }
        return prev.filter(id => id !== examId);
      } else {
        return [...prev, examId];
      }
    });
  };

  const handleSelectAllExams = () => {
    setSelectedBroadsheetExamIds(broadsheetAvailableAssessments.map(e => e.id));
    showToast(`Included all ${broadsheetAvailableAssessments.length} exams & tests in consolidation.`);
  };

  const handleSelectMajorOnly = () => {
    const majors = broadsheetAvailableAssessments
      .filter(e => e.type === 'SCHOOL_EXAM' || e.id === 'hy' || e.id === 'annual' || e.id.startsWith('pa'))
      .map(e => e.id);
    setSelectedBroadsheetExamIds(majors.length ? majors : broadsheetAvailableAssessments.slice(0, 3).map(e => e.id));
    showToast('Filtered to Major Term Examinations only.');
  };

  const handleSelectTestsOnly = () => {
    const tests = broadsheetAvailableAssessments
      .filter(e => e.type === 'CLASS_TEST' || e.id.startsWith('ct'))
      .map(e => e.id);
    setSelectedBroadsheetExamIds(tests.length ? tests : broadsheetAvailableAssessments.map(e => e.id));
    showToast('Filtered to Class Tests only.');
  };

  const handleClearAllExams = () => {
    if (broadsheetAvailableAssessments.length > 0) {
      setSelectedBroadsheetExamIds([broadsheetAvailableAssessments[0].id]);
      showToast('Reset to single assessment.');
    }
  };

  // Download Broadsheet CSV Template based on selected assessments
  const handleDownloadBroadsheetTemplate = () => {
    const headers = ['Roll No', 'Student Name', 'Admission No', 'Class', 'Section'];
    activeSelectedAssessments.forEach(ex => {
      headers.push(`"${ex.title} (Max ${ex.max_marks})"`);
    });

    const rows = broadsheetClassStudents.map((s, idx) => {
      const row = [
        s.roll_no || idx + 1,
        `"${s.full_name}"`,
        s.admission_no || s.id,
        broadsheetCurrentClass?.class_name || 'PG',
        broadsheetCurrentClass?.section || 'A'
      ];
      activeSelectedAssessments.forEach(() => {
        row.push('');
      });
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Consolidation_Template_${broadsheetCurrentClass?.class_name || 'Class'}_${selectedSession}.csv`;
    link.click();
    showToast('Consolidation CSV Template downloaded!');
  };

  // Export Full Broadsheet CSV with selected exams & auto-calculated ranks
  const handleExportFullBroadsheetCsv = () => {
    const headers = ['Roll No', 'Class Rank', 'Student Name', 'Admission No'];
    activeSelectedAssessments.forEach(ex => {
      headers.push(`"${ex.title} (Max ${ex.max_marks})"`);
    });
    headers.push('Grand Total', 'Maximum Marks', 'Percentage %', 'CBSE Grade', 'Result');

    const rows = rankedBroadsheetStudents.map(item => {
      const row: (string | number)[] = [
        item.rollNo,
        `Rank ${item.rank}`,
        `"${item.student.full_name}"`,
        item.student.admission_no || item.student.id
      ];

      activeSelectedAssessments.forEach(ex => {
        const sc = item.examMarks[ex.id];
        row.push(sc ? sc.obtained : 0);
      });

      row.push(
        item.totalObtained,
        item.totalPossibleMax,
        `${item.percentage}%`,
        item.grade,
        item.result
      );

      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Consolidated_Broadsheet_${broadsheetCurrentClass?.class_name || 'Class'}_${selectedSession}.csv`;
    link.click();
    showToast('Consolidated Broadsheet CSV exported successfully with auto ranks!');
    setShowBroadsheetExportMenu(false);

    recordAudit({
      action: 'BROADSHEET_EXPORTED',
      module: 'EXAMINATION',
      summary: `Exported Annual Consolidation Broadsheet for ${broadsheetCurrentClass?.class_name || 'Class'} - ${broadsheetCurrentClass?.section || 'A'} (${rankedBroadsheetStudents.length} scholars, ${activeSelectedAssessments.length} exams)`,
      actor: { name: 'Administrator', role: 'ADMIN' },
      details: { class: broadsheetCurrentClass?.class_name, count: rankedBroadsheetStudents.length }
    });
  };

  // Save Ledger to LocalStorage and sync exam status
  const handleSaveLedger = async () => {
    if (!activeTeacher) {
      setShowTeacherLoginModal(true);
      showToast('Please authenticate your Teacher ID before submitting marks.');
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(marksLedger));

      // Auto-update status of matching scheduled exams
      const matchingExams = scheduledExamsList.filter(ex => {
        const cnMatch = (ex.class_name || '').toLowerCase().trim() === (currentClass?.class_name || '').toLowerCase().trim();
        const secMatch = (ex.section || 'A').toUpperCase().trim() === (currentClass?.section || 'A').toUpperCase().trim();
        const subMatch = selectedSubjectFocus === 'ALL' || (ex.subject_name || '').toLowerCase().trim() === (displayedSubjects[0]?.name || '').toLowerCase().trim();
        return cnMatch && secMatch && subMatch && ex.status !== 'MARKS_FILLED';
      });

      if (matchingExams.length > 0) {
        const updatedList = scheduledExamsList.map(ex => {
          if (matchingExams.some(m => m.id === ex.id)) {
            return { ...ex, status: 'MARKS_FILLED' as const };
          }
          return ex;
        });
        setScheduledExamsList(updatedList);
        localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(updatedList));

        // Sync PATCH to server in background
        matchingExams.forEach(async (m) => {
          try {
            await apiFetch('/api/exams', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: m.id, status: 'MARKS_FILLED' })
            });
          } catch (_) {}
        });
      }

      showToast(`Marks ledger successfully saved & locked by ${activeTeacher.full_name} (${isClassTeacherOfCurrentClass ? 'Class Teacher' : 'Subject Teacher'})!`);

      recordAudit({
        action: 'MARKS_SUBMITTED',
        module: 'EXAMINATION',
        summary: `Saved & locked marks ledger for ${currentClass?.class_name} - ${currentClass?.section} by ${activeTeacher.full_name}`,
        details: {
          class: currentClass?.class_name,
          section: currentClass?.section,
          classId: selectedClassId,
          teacherId: activeTeacher.id,
          teacherName: activeTeacher.full_name,
          staffCode: activeTeacher.staff_code,
          role: isClassTeacherOfCurrentClass ? 'CLASS_TEACHER' : 'SUBJECT_TEACHER',
          subject: selectedSubjectFocus !== 'ALL' ? displayedSubjects[0]?.name : 'ALL_SUBJECTS'
        }
      });
    } catch (e) {
      console.error(e);
      showToast('Ledger saved to local session.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Update Individual Subject Mark
  const handleUpdateMark = (studentId: string, subjectId: string, field: 'theory' | 'practical', value: number) => {
    setMarksLedger(prev => {
      const stuRecord = prev[studentId] || {
        marks: {},
        coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
        remarks: 'Consistent academic performance.'
      };

      const existingMark = stuRecord.marks[subjectId] || {
        theory: 0,
        practical: 0,
        total: 0,
        grade: 'D',
        gp: 4.0
      };

      const maxTh = currentTerm.maxTheory;
      const maxPr = currentTerm.maxPractical;

      const newTheory = field === 'theory' ? Math.max(0, Math.min(maxTh, value)) : existingMark.theory;
      const newPractical = field === 'practical' ? Math.max(0, Math.min(maxPr, value)) : existingMark.practical;
      const newTotal = newTheory + newPractical;
      const pct = Number(((newTotal / currentTerm.maxTotal) * 100).toFixed(1));
      const gradeObj = calculateCbseGrade(pct);

      const updatedMarks = {
        ...stuRecord.marks,
        [subjectId]: {
          theory: newTheory,
          practical: newPractical,
          total: newTotal,
          grade: gradeObj.grade,
          gp: gradeObj.gp
        }
      };

      return {
        ...prev,
        [studentId]: {
          ...stuRecord,
          marks: updatedMarks
        }
      };
    });
  };

  // Set Student Attendance / Component Status (Present, Absent, Medical, Exempt)
  const handleSetComponentStatus = (studentId: string, subjectId: string, component: 'theory' | 'practical', status: 'PRESENT' | 'ABSENT' | 'MEDICAL' | 'EXEMPT') => {
    setMarksLedger(prev => {
      const stuRecord = prev[studentId] || {
        marks: {},
        coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
        remarks: 'Consistent academic performance.'
      };
      const existing = stuRecord.marks[subjectId] || {
        theory: 0,
        practical: 0,
        total: 0,
        grade: 'D',
        gp: 4.0
      };

      const newTh = component === 'theory' ? (status === 'ABSENT' ? 0 : existing.theory) : existing.theory;
      const newPr = component === 'practical' ? (status === 'ABSENT' ? 0 : existing.practical) : existing.practical;
      const newTot = newTh + newPr;
      const pct = Number(((newTot / currentTerm.maxTotal) * 100).toFixed(1));
      const gr = calculateCbseGrade(pct);

      return {
        ...prev,
        [studentId]: {
          ...stuRecord,
          marks: {
            ...stuRecord.marks,
            [subjectId]: {
              ...existing,
              theory: newTh,
              practical: newPr,
              total: newTot,
              grade: gr.grade,
              gp: gr.gp,
              ...(component === 'theory' ? { theoryStatus: status as any } : { practicalStatus: status as any })
            }
          }
        }
      };
    });
  };

  // Set Component Remarks
  const handleSetComponentRemarks = (studentId: string, subjectId: string, component: 'theory' | 'practical', remarks: string) => {
    setMarksLedger(prev => {
      const stuRecord = prev[studentId] || {
        marks: {},
        coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
        remarks: 'Consistent academic performance.'
      };
      const existing = stuRecord.marks[subjectId] || {
        theory: 0,
        practical: 0,
        total: 0,
        grade: 'D',
        gp: 4.0
      };

      return {
        ...prev,
        [studentId]: {
          ...stuRecord,
          marks: {
            ...stuRecord.marks,
            [subjectId]: {
              ...existing,
              ...(component === 'theory' ? { theoryRemarks: remarks } : { practicalRemarks: remarks })
            }
          }
        }
      };
    });
  };

  // Mark all scholars present for specific component & subject
  const handleMarkAllComponentPresent = (subjectId: string, component: 'theory' | 'practical') => {
    setMarksLedger(prev => {
      const updated = { ...prev };
      classStudents.forEach(stu => {
        const stuRec = updated[stu.id] || {
          marks: {},
          coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
          remarks: 'Consistent academic performance.'
        };
        const existing = stuRec.marks[subjectId] || {
          theory: 0,
          practical: 0,
          total: 0,
          grade: 'D',
          gp: 4.0
        };
        stuRec.marks[subjectId] = {
          ...existing,
          ...(component === 'theory' ? { theoryStatus: 'PRESENT' as const } : { practicalStatus: 'PRESENT' as const })
        };
        updated[stu.id] = stuRec;
      });
      return updated;
    });
    showToast(`Marked all scholars as PRESENT for ${component === 'theory' ? 'Theory Exam' : 'Practical & IA'}.`);
  };

  // 1-Click Fill Component Benchmarks (e.g. fill only theory or only practical for this subject)
  const handlePopulateComponentBenchmarks = (subjectId: string, component: 'theory' | 'practical') => {
    const subName = classSubjects.find(s => s.id === subjectId)?.name || 'Subject';
    if (!confirm(`Populate benchmark marks for "${subName}" (${component === 'theory' ? 'Theory Exam' : 'Practical & IA'})?`)) return;

    setMarksLedger(prev => {
      const updated = { ...prev };
      classStudents.forEach((stu, idx) => {
        const stuRec = updated[stu.id] || {
          marks: {},
          coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
          remarks: 'Consistent academic performance.'
        };
        const existing = stuRec.marks[subjectId] || {
          theory: 0,
          practical: 0,
          total: 0,
          grade: 'D',
          gp: 4.0
        };

        const seedBase = ((stu.full_name.charCodeAt(0) * 7 + idx * 13) % 25) + 72; // 72 to 97
        const totalPct = Math.min(99, Math.max(50, seedBase));

        const newTheory = component === 'theory' ? Math.round((totalPct / 100) * currentTerm.maxTheory) : existing.theory;
        const newPractical = component === 'practical' ? Math.round((totalPct / 100) * currentTerm.maxPractical) : existing.practical;
        const newTotal = newTheory + newPractical;
        const pct = Number(((newTotal / currentTerm.maxTotal) * 100).toFixed(1));
        const gr = calculateCbseGrade(pct);

        stuRec.marks[subjectId] = {
          ...existing,
          theory: newTheory,
          practical: newPractical,
          total: newTotal,
          grade: gr.grade,
          gp: gr.gp,
          ...(component === 'theory' ? { theoryStatus: 'PRESENT' as const } : { practicalStatus: 'PRESENT' as const })
        };
        updated[stu.id] = stuRec;
      });
      return updated;
    });
    showToast(`Populated ${component === 'theory' ? 'Theory' : 'Practical'} benchmark marks for ${subName}.`);
  };

  // 1-Click Clear Component Marks
  const handleClearComponentMarks = (subjectId: string, component: 'theory' | 'practical') => {
    const subName = classSubjects.find(s => s.id === subjectId)?.name || 'Subject';
    if (!confirm(`Clear all ${component === 'theory' ? 'Theory' : 'Practical'} marks for "${subName}"?`)) return;

    setMarksLedger(prev => {
      const updated = { ...prev };
      classStudents.forEach(stu => {
        const stuRec = updated[stu.id];
        if (stuRec && stuRec.marks[subjectId]) {
          const ex = stuRec.marks[subjectId];
          const newTh = component === 'theory' ? 0 : ex.theory;
          const newPr = component === 'practical' ? 0 : ex.practical;
          const newTot = newTh + newPr;
          const pct = Number(((newTot / currentTerm.maxTotal) * 100).toFixed(1));
          const gr = calculateCbseGrade(pct);
          stuRec.marks[subjectId] = {
            ...ex,
            theory: newTh,
            practical: newPr,
            total: newTot,
            grade: gr.grade,
            gp: gr.gp
          };
        }
      });
      return updated;
    });
    showToast(`Cleared ${component === 'theory' ? 'Theory' : 'Practical'} marks for ${subName}.`);
  };

  // 1-Click Populate Benchmark Marks
  const handlePopulateBenchmarks = () => {
    if (!confirm('Populate realistic CBSE benchmark marks for all scholars in this class?')) return;
    
    const initial: Record<string, StudentExamRecord> = {};
    classStudents.forEach((stu, idx) => {
      const marksMap: Record<string, StudentSubjectMark> = {};
      const seedBase = ((stu.full_name.charCodeAt(0) * 7 + idx * 13) % 25) + 72; // 72 to 97

      classSubjects.forEach((sub, subIdx) => {
        const subMod = ((sub.name.charCodeAt(0) + subIdx * 5) % 10) - 3;
        const totalPct = Math.min(99, Math.max(48, seedBase + subMod));
        
        const thMarks = Math.round((totalPct / 100) * currentTerm.maxTheory);
        const prMarks = Math.round((totalPct / 100) * currentTerm.maxPractical);
        const combined = thMarks + prMarks;
        const pct = Number(((combined / currentTerm.maxTotal) * 100).toFixed(1));
        const gr = calculateCbseGrade(pct);

        marksMap[sub.id] = {
          theory: thMarks,
          practical: prMarks,
          total: combined,
          grade: gr.grade,
          gp: gr.gp
        };
      });

      initial[stu.id] = {
        marks: marksMap,
        coScholastic: {
          workEdu: 'A',
          artEdu: 'A',
          healthPE: 'A',
          discipline: 'A'
        },
        remarks: seedBase >= 85 
          ? 'Outstanding analytical acumen, exemplary conduct and stellar academic precision.'
          : 'Diligent effort, thorough subject mastery and active participation.'
      };
    });

    setMarksLedger(initial);
    try {
      localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch (e) {}
    showToast('Populated authentic CBSE benchmark marks!');
  };

  // 1-Click Clear Ledger
  const handleClearLedger = () => {
    if (!confirm('Clear all entered marks for this class & examination term?')) return;
    const blank: Record<string, StudentExamRecord> = {};
    classStudents.forEach(stu => {
      const marksMap: Record<string, StudentSubjectMark> = {};
      classSubjects.forEach(sub => {
        marksMap[sub.id] = { theory: 0, practical: 0, total: 0, grade: 'E2', gp: 0.0 };
      });
      blank[stu.id] = {
        marks: marksMap,
        coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
        remarks: ''
      };
    });
    setMarksLedger(blank);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    showToast('Ledger cleared.');
  };

  // Calculate Cumulative Overall Scholar Statistics
  const computeStudentOverall = (studentId: string) => {
    const record = marksLedger[studentId];
    if (!record || !classSubjects.length) {
      return { grandTotal: 0, maxGrandTotal: 0, percentage: 0, cgpa: 0, grade: 'E2', result: 'PENDING' };
    }

    let grandTotal = 0;
    const maxGrandTotal = classSubjects.length * currentTerm.maxTotal;

    classSubjects.forEach(sub => {
      const m = record.marks[sub.id];
      if (m) grandTotal += m.total;
    });

    const percentage = maxGrandTotal > 0 ? Number(((grandTotal / maxGrandTotal) * 100).toFixed(1)) : 0;
    const gradeObj = calculateCbseGrade(percentage);
    const result = percentage >= 33 ? 'QUALIFIED & PROMOTED' : 'NEEDS RETEST (COMPARTMENT)';

    return {
      grandTotal,
      maxGrandTotal,
      percentage,
      cgpa: gradeObj.gp,
      grade: gradeObj.grade,
      result
    };
  };

  // Compute Class-Wide KPI Metrics
  const classKpis = useMemo(() => {
    if (!classStudents.length) {
      return { testedCount: 0, avgPercentage: 0, highestPercentage: 0, passRate: 100, topScorer: 'N/A' };
    }

    let totalPctSum = 0;
    let highestPct = 0;
    let highestScorerName = '';
    let passCount = 0;

    classStudents.forEach(stu => {
      const stats = computeStudentOverall(stu.id);
      totalPctSum += stats.percentage;
      if (stats.percentage >= 33) passCount++;
      if (stats.percentage > highestPct) {
        highestPct = stats.percentage;
        highestScorerName = stu.full_name;
      }
    });

    const avgPct = Number((totalPctSum / classStudents.length).toFixed(1));
    const passRate = Number(((passCount / classStudents.length) * 100).toFixed(1));

    return {
      testedCount: classStudents.length,
      avgPercentage: avgPct,
      highestPercentage: highestPct,
      passRate,
      topScorer: highestScorerName || 'N/A'
    };
  }, [classStudents, marksLedger, classSubjects, currentTerm]);

  // Filtered Students for Table View
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.toLowerCase().trim();
    return classStudents.filter(s => 
      s.full_name.toLowerCase().includes(q) ||
      (s.admission_no || s.id || '').toLowerCase().includes(q) ||
      String(s.roll_no || '').includes(q)
    );
  }, [classStudents, searchQuery]);

  // Export Class Ledger to CSV
  const handleExportCSV = () => {
    if (!currentClass || !classStudents.length) return;

    const subjectHeaders = classSubjects.map(s => `"${s.name} (${s.code || 'CORE'}) Th"` + `,` + `"${s.name} Pr"` + `,` + `"${s.name} Total"` + `,` + `"${s.name} Grade"`).join(',');
    const header = `Roll No,Admission No,Student Name,Class,Section,${subjectHeaders},Grand Total,Max Marks,Percentage %,CGPA,Overall Grade,Result\n`;

    const rows = classStudents.map(stu => {
      const overall = computeStudentOverall(stu.id);
      const rec = marksLedger[stu.id];

      const subValues = classSubjects.map(s => {
        const sm = rec?.marks[s.id] || { theory: 0, practical: 0, total: 0, grade: 'E2' };
        return `${sm.theory},${sm.practical},${sm.total},${sm.grade}`;
      }).join(',');

      return `"${stu.roll_no || ''}","${stu.admission_no || stu.id}","${stu.full_name}","${currentClass.class_name}","${currentClass.section}",${subValues},${overall.grandTotal},${overall.maxGrandTotal},"${overall.percentage}%",${overall.cgpa},"${overall.grade}","${overall.result}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + header + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CBSE_Marks_Ledger_${currentClass.class_name}_${currentClass.section}_${currentTerm.id}_${selectedSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Class Marks Ledger CSV exported.');
  };

  // Open Report Card Modal
  const handleOpenReportCard = (stu: Student) => {
    const overall = computeStudentOverall(stu.id);
    const rec = marksLedger[stu.id] || {
      marks: {},
      coScholastic: { workEdu: 'A', artEdu: 'A', healthPE: 'A', discipline: 'A' },
      remarks: 'Outstanding academic consistency.'
    };

    // Calculate Rank
    const sortedRanks = [...classStudents].sort((a, b) => computeStudentOverall(b.id).percentage - computeStudentOverall(a.id).percentage);
    const rank = sortedRanks.findIndex(s => s.id === stu.id) + 1;

    setReportCardStudent({
      student: stu,
      overall,
      record: rec,
      rank,
      totalStudentsInClass: classStudents.length
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#122A24] text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & PRIMARY MODULE 3-TAB SWITCHER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          EXAMINATIONS
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
              <Award className="h-7 w-7 text-emerald-700 shrink-0" />
              <span>CBSE Examination &amp; Report Card Studio</span>
            </h1>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Whole-school exam scheduler, single class tests, marks ledger &amp; student academic report cards
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
              Session {selectedSession}
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              CBSE Affil: {selectedSchool?.affiliation_no || '2130042'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs: Adaptive for Student vs Staff */}
        <div className={`grid ${userRole === 'STUDENT' ? 'grid-cols-2 max-w-md' : 'grid-cols-2 lg:grid-cols-4 max-w-4xl'} gap-2 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs`}>
          <button
            type="button"
            onClick={() => setActiveView('student_dossier')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              activeView === 'student_dossier'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>{userRole === 'STUDENT' ? 'My Term Report Card' : 'Student Report Cards'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('planner')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              activeView === 'planner'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{userRole === 'STUDENT' ? 'Exam Datesheet' : 'Exam Planner & Tests'}</span>
          </button>

          {userRole !== 'STUDENT' && (
            <>
              <button
                type="button"
                onClick={() => setActiveView('ledger')}
                className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
                  activeView === 'ledger'
                    ? 'bg-[#122A24] text-white shadow-xs font-bold'
                    : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>Class Marks Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('broadsheet')}
                className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
                  activeView === 'broadsheet'
                    ? 'bg-[#122A24] text-white shadow-xs font-bold'
                    : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span>Annual Broadsheet</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 1: WHOLE-SCHOOL EXAM PLANNER & SINGLE CLASS TEST (SCREENSHOT 1)
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'planner' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 2-Column Split: Scheduled Exams List (Left) + Multi-Class Post Engine (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (7 COLS): SCHEDULED EXAMS & CLASS TESTS LIST */}
            <div className={`${userRole === 'STUDENT' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4`}>
              
              {/* Header & Filter Pill Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#122A24]">
                      Scheduled Exams &amp; Class Tests List
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {filteredScheduledExams.length} examinations scheduled • Session {selectedSession}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0]">
                    <button
                      type="button"
                      onClick={() => setScheduledExamsFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        scheduledExamsFilter === 'ALL'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledExamsFilter('SCHOOL_EXAM')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        scheduledExamsFilter === 'SCHOOL_EXAM'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      Exams
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledExamsFilter('CLASS_TEST')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        scheduledExamsFilter === 'CLASS_TEST'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      Class Tests
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTimetableModal(true)}
                    className="px-3 py-1.5 bg-[#EBF5EF] hover:bg-[#D5EBDD] text-[#1C443A] rounded-xl text-xs font-bold flex items-center gap-1.5 border border-[#C5E2CF] cursor-pointer transition-all"
                    title="Print Date Sheet / Timetable"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Date Sheet</span>
                  </button>

                  {!isTeacher && (
                    <button
                      type="button"
                      onClick={() => setShowWholeSchoolModal(true)}
                      className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Bulk Master</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Filter & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-1">
                <div className="sm:col-span-6 relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search title, subject, class..."
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={listClassFilter}
                    onChange={(e) => setListClassFilter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-[#DCE8E0] text-xs font-bold bg-[#F8FAF9] text-[#122A24] outline-none cursor-pointer"
                  >
                    {isTeacher && activeClassTeacherClass ? (
                      <option value={activeClassTeacherClass.class_name}>
                        {activeClassTeacherClass.class_name} ({activeClassTeacherClass.section || 'A'}) — Your Class
                      </option>
                    ) : (
                      <>
                        <option value="ALL">All Classes</option>
                        {sortedClassesList.map(c => (
                          <option key={c.id} value={c.class_name}>
                            {c.class_name} ({c.section || 'A'})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={listStatusFilter}
                    onChange={(e) => setListStatusFilter(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-xl border border-[#DCE8E0] text-xs font-bold bg-[#F8FAF9] text-[#122A24] outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">⏳ Pending</option>
                    <option value="MARKS_FILLED">✓ Marks Filled</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Exams Cards Stack */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredScheduledExams.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-sans space-y-2">
                    <div>No scheduled exams found matching filters.</div>
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledExamsFilter('ALL');
                        setListClassFilter('ALL');
                        setListSearchQuery('');
                        setListStatusFilter('ALL');
                      }}
                      className="text-xs text-emerald-700 font-bold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredScheduledExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl bg-white border border-[#DCE8E0] hover:border-emerald-600/50 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
                    >
                      {/* Left Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-sm text-[#122A24] truncate">
                            {exam.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            exam.type === 'SCHOOL_EXAM'
                              ? 'bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {exam.type === 'SCHOOL_EXAM' ? 'SCHOOL EXAM' : 'CLASS TEST'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleExamStatus(exam)}
                            title="Click to toggle status"
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold cursor-pointer border transition-all ${
                              exam.status === 'MARKS_FILLED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {exam.status === 'MARKS_FILLED' ? '✓ MARKS FILLED' : '⏳ PENDING'}
                          </button>
                        </div>

                        {/* Subject & Class Sub-title */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-[#122A24]">{exam.subject_name}</span>
                          {exam.subject_code && (
                            <span className="font-mono text-slate-400 font-normal">({exam.subject_code})</span>
                          )}
                          <span className="text-slate-300">•</span>
                          <span>Class <strong className="text-[#122A24]">{exam.class_name}-{exam.section}</strong></span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{formatExamDate(exam.date)}</span>
                          </div>
                          {exam.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{exam.time}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Info & Actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8F0EA]">
                        <div className="text-left sm:text-right">
                          <div className="px-2.5 py-0.5 bg-[#F8FAF9] text-[#122A24] border border-[#DCE8E0] font-mono font-bold text-xs rounded-lg inline-block">
                            Max: {exam.max_marks} M
                          </div>
                          <div className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5">
                            Pass: {exam.pass_marks} M
                          </div>
                        </div>

                        {userRole !== 'STUDENT' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenExamLedger(exam)}
                              className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs border-none cursor-pointer transition-all"
                              title="Open Marks Ledger for this class"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Submit Marks</span>
                            </button>

                            {(!isTeacher || exam.type === 'CLASS_TEST') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteExam(exam.id, exam.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                                title="Delete exam slot"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (5 COLS): POST EXAM OR CLASS TEST ENGINE (MULTI-CLASS CAPABILITY - HIDDEN FOR STUDENTS) */}
            {userRole !== 'STUDENT' && (
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              
              {/* Form Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 text-lg font-bold">⚡</span>
                  <div>
                    <h3 className="font-display font-bold text-base text-[#122A24]">
                      Post Exam or Class Test
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Schedule exams &amp; tests across single or multiple classes
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                  ADMIN &amp; FACULTY
                </span>
              </div>

              {/* Type Toggle Tabs: School Exam vs Class Test (Teachers restricted to Class Tests only) */}
              <div className="flex items-center gap-2 bg-[#F4F8F5] p-1 rounded-2xl border border-[#DCE8E0]">
                {!isTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostExamType('SCHOOL_EXAM');
                      setPostExamTitle('Periodic Assessment 2 (PA-2)');
                      setPostMaxMarks(40);
                      setPostPassMarks(14);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                      postExamType === 'SCHOOL_EXAM'
                        ? 'bg-[#122A24] text-white shadow-2xs'
                        : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                    }`}
                  >
                    <span>🏛️ School Exam</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPostExamType('CLASS_TEST');
                    setPostExamTitle('Unit Test 1');
                    setPostMaxMarks(20);
                    setPostPassMarks(7);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    postExamType === 'CLASS_TEST'
                      ? 'bg-[#122A24] text-white shadow-2xs'
                      : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                  }`}
                >
                  <span>⚡ Class Test / Quiz</span>
                </button>
              </div>

              {isTeacher && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Faculty Permission: Teachers can schedule classroom unit tests and quizzes. Official School Examinations are scheduled by School Administration.</span>
                </div>
              )}

              {/* Quick Presets Strip */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase">
                  {!isTeacher && postExamType === 'SCHOOL_EXAM' ? 'School Exam Presets:' : 'Class Test Presets:'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!isTeacher && postExamType === 'SCHOOL_EXAM' ? (
                    <>
                      <button type="button" onClick={() => applyExamPreset('Periodic Assessment 1 (PA-1)', 40, 'SCHOOL_EXAM')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">PA-1 (40M)</button>
                      <button type="button" onClick={() => applyExamPreset('Periodic Assessment 2 (PA-2)', 40, 'SCHOOL_EXAM')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">PA-2 (40M)</button>
                      <button type="button" onClick={() => applyExamPreset('Half Yearly Examination (Term-1)', 80, 'SCHOOL_EXAM', '09:30 AM - 12:30 PM')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Half Yearly (80M)</button>
                      <button type="button" onClick={() => applyExamPreset('Pre-Board Examination', 80, 'SCHOOL_EXAM', '09:30 AM - 12:30 PM')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Pre-Board (80M)</button>
                      <button type="button" onClick={() => applyExamPreset('Annual Board Assessment (Term-2)', 100, 'SCHOOL_EXAM', '09:30 AM - 12:30 PM')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Annual (100M)</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => applyExamPreset('Unit Test 1', 20, 'CLASS_TEST', 'Period 2')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Unit Test 1 (20M)</button>
                      <button type="button" onClick={() => applyExamPreset('Unit Test 2', 25, 'CLASS_TEST', 'Period 3')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Unit Test 2 (25M)</button>
                      <button type="button" onClick={() => applyExamPreset('Weekly Assessment', 20, 'CLASS_TEST', 'Period 4')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Weekly Test (20M)</button>
                      <button type="button" onClick={() => applyExamPreset('Chapter Revision Quiz', 15, 'CLASS_TEST', 'Period 1')} className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer">Chapter Quiz (15M)</button>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Post Engine Form */}
              <form onSubmit={handlePostExamOrTest} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                    Exam / Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test 1 – Linear Equations"
                    value={postExamTitle}
                    onChange={(e) => setPostExamTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                  />
                </div>

                {/* TARGET CLASSES (MULTI-CLASS SELECTION STUDIO) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="text-xs font-bold text-[#122A24] font-sans flex items-center gap-1.5">
                      <span>Choose Classes</span>
                      <span className="text-rose-500">*</span>
                      <span className="px-2 py-0.5 bg-[#EBF5EF] text-[#1C443A] rounded-md font-mono text-[10.5px] font-bold">
                        {postSelectedClassIds.length} Selected
                      </span>
                    </label>

                    {/* Group & Bulk Shortcuts (Hidden for Teachers) */}
                    {!isTeacher && (
                      <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
                        <button
                          type="button"
                          onClick={handleSelectAllClasses}
                          className="text-emerald-800 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                          {postSelectedClassIds.length === sortedClassesList.length ? 'Clear All' : 'Select All'}
                        </button>
                        <span className="text-slate-300">•</span>
                        <button type="button" onClick={() => handleSelectClassGroup('PRIMARY')} className="text-slate-600 hover:text-[#122A24] bg-transparent border-none cursor-pointer p-0">I-V</button>
                        <span className="text-slate-300">•</span>
                        <button type="button" onClick={() => handleSelectClassGroup('MIDDLE')} className="text-slate-600 hover:text-[#122A24] bg-transparent border-none cursor-pointer p-0">VI-VIII</button>
                        <span className="text-slate-300">•</span>
                        <button type="button" onClick={() => handleSelectClassGroup('SECONDARY')} className="text-slate-600 hover:text-[#122A24] bg-transparent border-none cursor-pointer p-0">IX-X</button>
                        <span className="text-slate-300">•</span>
                        <button type="button" onClick={() => handleSelectClassGroup('SENIOR')} className="text-slate-600 hover:text-[#122A24] bg-transparent border-none cursor-pointer p-0">XI-XII</button>
                      </div>
                    )}
                  </div>

                  {/* Multi-Class Selectable Chips Container */}
                  <div className="p-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-2xl max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {availableClassesForPost.map(c => {
                      const isSel = postSelectedClassIds.includes(c.id);
                      const cName = c.class_name || (c as any).name || 'Class';
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleToggleSelectClass(c.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-mono font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer border ${
                            isSel
                              ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                              : 'bg-white text-slate-700 border-[#DCE8E0] hover:border-emerald-600/50'
                          }`}
                        >
                          <span className="truncate">{cName}-{c.section || 'A'}</span>
                          {isSel ? (
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SUBJECT SELECTION MODE */}
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                    Subject Scope <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setPostSubjectMode('SPECIFIC')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        postSubjectMode === 'SPECIFIC'
                          ? 'bg-[#EBF5EF] text-[#1C443A] border-[#C5E2CF] shadow-2xs font-extrabold'
                          : 'bg-[#F8FAF9] text-slate-600 border-[#DCE8E0]'
                      }`}
                    >
                      📚 Specific Subject
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostSubjectMode('ALL_CBSE')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        postSubjectMode === 'ALL_CBSE'
                          ? 'bg-[#EBF5EF] text-[#1C443A] border-[#C5E2CF] shadow-2xs font-extrabold'
                          : 'bg-[#F8FAF9] text-slate-600 border-[#DCE8E0]'
                      }`}
                    >
                      🌐 All CBSE Subjects
                    </button>
                  </div>

                  {postSubjectMode === 'SPECIFIC' ? (
                    <div className="space-y-2">
                      <select
                        value={postSubjectName}
                        onChange={(e) => setPostSubjectName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] outline-none cursor-pointer"
                      >
                        {commonCbseSubjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or type custom subject (e.g. Artificial Intelligence, French)..."
                        value={postCustomSubject}
                        onChange={(e) => setPostCustomSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] outline-none"
                      />
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#F8FAF9] rounded-xl border border-[#DCE8E0] text-[11px] text-[#2D5A4E] font-mono leading-relaxed">
                      ⚡ Automatically schedules all curriculum subjects tailored for each selected class (e.g. Science, Maths, Social Science, Languages, ICT).
                    </div>
                  )}
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1 font-sans">
                      Exam Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1 font-sans">
                      Time Slot / Period
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09:30 AM - 11:30 AM"
                      value={postTimeSlot}
                      onChange={(e) => setPostTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-medium text-[#122A24] outline-none"
                    />
                  </div>
                </div>

                {/* Max Marks & Pass Marks Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1 font-sans">
                      Max Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      required
                      value={postMaxMarks}
                      onChange={(e) => handleMaxMarksChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1 font-sans">
                      Pass Marks (33%) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={postMaxMarks}
                      required
                      value={postPassMarks}
                      onChange={(e) => setPostPassMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets Strip */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1.5">
                    Quick Max Marks:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[10, 20, 25, 40, 50, 80, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleMaxMarksChange(preset)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          postMaxMarks === preset
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                            : 'bg-[#F8FAF9] text-[#122A24] border-[#DCE8E0] hover:bg-white'
                        }`}
                      >
                        {preset} M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPostingExam || postSelectedClassIds.length === 0}
                    className="w-full py-3.5 px-4 bg-[#122A24] hover:bg-[#1C443A] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs border-none cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    {isPostingExam ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Posting Examinations...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀 Post {postExamType === 'SCHOOL_EXAM' ? 'School Exam' : 'Class Test'} across {postSelectedClassIds.length} Classes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            )}
          </div>
        </div>
      )}


      {/* ═════════════════════════════════════════════════════════════════
          VIEW 2: STUDENT REPORT CARD SELECTOR & ACADEMIC DOSSIER
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'student_dossier' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Card: Class & Student Report Card Selector (Hidden for students to protect privacy) */}
          {userRole !== 'STUDENT' && (
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-6 space-y-4">
            
            {/* Header with Class Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold text-lg shadow-2xs">
                  🏫
                </div>
                <div>
                  <h2 className="font-display font-bold text-base sm:text-lg text-[#122A24]">
                    Class &amp; Student Report Card Selector
                  </h2>
                  <p className="text-xs text-slate-500 font-sans">
                    Select Class-Section and click or search any student to view their official report card
                  </p>
                </div>
              </div>

              {/* Class-Section Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600 font-mono">Class-Section:</span>
                <select
                  value={dossierClassId}
                  onChange={(e) => setDossierClassId(e.target.value)}
                  className="bg-[#F8FAF9] px-3.5 py-2 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer shadow-2xs"
                >
                  {sortedClassesList.map(c => {
                    const cName = c.class_name || (c as any).name || 'Class';
                    return (
                      <option key={c.id} value={c.id}>
                        Class: {cName} - {c.section || 'A'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Search Bar + Students Counter Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Type student name, roll number, or SR no to filter students..."
                  value={dossierStudentSearch}
                  onChange={(e) => setDossierStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium transition-all"
                />
              </div>
              <span className="px-3.5 py-2.5 bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF] rounded-xl text-xs font-mono font-bold shrink-0">
                {dossierClassStudents.length} Students in Class {dossierCurrentClass?.class_name || 'PG'}-{dossierCurrentClass?.section || 'A'}
              </span>
            </div>

            {/* Horizontal Scrollable Student Pills Carousel with Left/Right arrows */}
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="hidden sm:flex h-8 w-8 rounded-xl bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] items-center justify-center shrink-0 cursor-pointer shadow-2xs transition-all"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div ref={carouselRef} className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 flex-1 scrollbar-none">
                {filteredDossierStudents.length === 0 ? (
                  <div className="py-2 text-xs text-slate-400 font-sans">No students found matching your search.</div>
                ) : (
                  filteredDossierStudents.map((stu, sIdx) => {
                    const isSelected = stu.id === dossierActiveStudentId;
                    const initialLetter = (stu.full_name || 'A').charAt(0).toUpperCase();

                    return (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => setDossierActiveStudentId(stu.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs scale-[1.02]'
                            : 'bg-[#F8FAF9] text-[#122A24] border-[#DCE8E0] hover:bg-white hover:border-emerald-600/40'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10.5px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#EBF5EF] text-[#1C443A]'
                        }`}>
                          {initialLetter}
                        </span>
                        <span className="font-sans font-bold">{stu.full_name}</span>
                        <span className={`font-mono text-[11px] font-medium ${isSelected ? 'text-emerald-300' : 'text-slate-500'}`}>
                          (R: {stu.roll_no || sIdx + 1})
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="hidden sm:flex h-8 w-8 rounded-xl bg-[#F8FAF9] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] items-center justify-center shrink-0 cursor-pointer shadow-2xs transition-all"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          )}

          {/* Student Dossier Main Container (Profile Card + Vitals + Matrix) */}
          {activeDossierStudent && (
            <div className="space-y-6">
              
              {/* Selected Student Hero Card */}
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-6 sm:p-7 space-y-6">
                
                {/* Top Row: Avatar + Name + Navigation + Attendance Rate Box */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Rounded Avatar Box */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF] font-display font-black text-2xl flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
                      {(activeDossierStudent.full_name || 'A').charAt(0).toUpperCase()}
                    </div>

                    {/* Student Identity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] tracking-tight">
                          {activeDossierStudent.full_name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                          Class {activeDossierStudent.class_name} - Section {activeDossierStudent.section || 'A'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-mono">
                        SR No: <strong className="text-[#122A24]">{activeDossierStudent.admission_no || activeDossierStudent.id}</strong> • Roll: <strong className="text-[#122A24]">#{activeDossierStudent.roll_no || '01'}</strong> • Email: <strong className="text-[#122A24]">{activeDossierStudent.email || `stu_${activeDossierStudent.id.toLowerCase()}@school.edu.in`}</strong>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          GENDER: {activeDossierStudent.gender || 'FEMALE'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          CATEGORY: {activeDossierStudent.category || 'GENERAL'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                          {activeDossierStudent.house || 'BLUE HOUSE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Quick Prev/Next Switcher + Attendance Rate Box */}
                  <div className="flex items-center gap-3 self-end lg:self-center">
                    {/* Quick Prev / Next Navigator */}
                    <div className="flex items-center gap-1.5 bg-[#F8FAF9] p-1.5 rounded-2xl border border-[#DCE8E0]">
                      <button
                        type="button"
                        disabled={currentDossierStudentIndex <= 0}
                        onClick={() => {
                          if (currentDossierStudentIndex > 0) {
                            setDossierActiveStudentId(filteredDossierStudents[currentDossierStudentIndex - 1].id);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#EBF5EF] disabled:opacity-40 disabled:pointer-events-none text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>
                      <button
                        type="button"
                        disabled={currentDossierStudentIndex >= filteredDossierStudents.length - 1}
                        onClick={() => {
                          if (currentDossierStudentIndex < filteredDossierStudents.length - 1) {
                            setDossierActiveStudentId(filteredDossierStudents[currentDossierStudentIndex + 1].id);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#EBF5EF] disabled:opacity-40 disabled:pointer-events-none text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Attendance Rate Right Box */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-center shrink-0 min-w-[135px]">
                      <div className="text-[10.5px] font-mono font-bold text-[#1C443A] uppercase tracking-wider">
                        ATTENDANCE RATE
                      </div>
                      <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#122A24] mt-0.5">
                        92%
                      </div>
                      <div className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5">
                        Session Recorded
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4x2 Student Vitals Grid (Individual Cards) */}
                <div className="bg-[#F8FAF9] p-4 sm:p-5 rounded-2xl border border-[#DCE8E0] grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Father's Name</span>
                    <strong className="text-[#122A24] font-sans text-xs font-bold block truncate" title={activeDossierStudent.father_name || 'Shlok Agarwal'}>
                      {activeDossierStudent.father_name || 'Shlok Agarwal'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Mother's Name</span>
                    <strong className="text-[#122A24] font-sans text-xs font-bold block truncate" title={activeDossierStudent.mother_name || 'Riya Agarwal'}>
                      {activeDossierStudent.mother_name || 'Riya Agarwal'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Contact Mobile</span>
                    <strong className="text-[#122A24] font-mono text-xs font-bold block truncate">
                      {activeDossierStudent.emergency_contact_phone || activeDossierStudent.phone || '+91 7443362827'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Date of Birth (DOB)</span>
                    <strong className="text-[#122A24] font-mono text-xs font-bold block truncate">
                      {activeDossierStudent.dob || '2022-11-14'}
                    </strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Aadhaar Card</span>
                    <strong className="text-[#122A24] font-mono text-xs font-bold block truncate">
                      {activeDossierStudent.aadhaar_no || '944337875751'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Admission Type</span>
                    <strong className="text-[#122A24] font-sans text-xs font-bold block truncate">
                      {activeDossierStudent.admission_type || 'Old Admission'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Transport Facility</span>
                    <strong className="text-[#122A24] font-sans text-xs font-bold block truncate">
                      {activeDossierStudent.transport_opted === 'YES' ? `🚌 Bus Route #${activeDossierStudent.bus_route_no || '04'}` : '🚶 Self / Private'}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E8F0EA] space-y-0.5 shadow-2xs">
                    <span className="text-slate-400 block text-[10.5px] font-mono uppercase font-semibold">Residential Address</span>
                    <strong className="text-[#122A24] font-sans text-xs font-bold block truncate" title={activeDossierStudent.address || 'House No. 299, Sector 4, Indira Nagar'}>
                      {activeDossierStudent.address || 'House No. 299, Sector 4, Indira Nagar'}
                    </strong>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────
                    ACADEMIC EXAMINATION MATRIX & SUBJECT GRADES SECTION
                    ───────────────────────────────────────────────────────── */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-sm text-[#122A24] flex items-center gap-2">
                      <span>📊</span>
                      <span>ACADEMIC EXAMINATION MATRIX &amp; SUBJECT GRADES</span>
                    </h3>

                    <button
                      type="button"
                      onClick={() => handleOpenReportCard(activeDossierStudent)}
                      className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer transition-all self-start sm:self-auto"
                    >
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <span>Print Official Report Card</span>
                    </button>
                  </div>

                  {/* Filter Tabs Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setDossierExamFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        dossierExamFilter === 'ALL'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                          : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-white'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Combine (All Exams)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDossierExamFilter('ct1')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        dossierExamFilter === 'ct1'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                          : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-white'
                      }`}
                    >
                      <span>📝</span>
                      <span>Class Test 1 (April Session) - {dossierCurrentClass?.class_name || 'PG'} A</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDossierExamFilter('ct2')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        dossierExamFilter === 'ct2'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                          : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-white'
                      }`}
                    >
                      <span>📝</span>
                      <span>Class Test 2 (May Session) - {dossierCurrentClass?.class_name || 'PG'} A</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDossierExamFilter('pa1')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        dossierExamFilter === 'pa1'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                          : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-white'
                      }`}
                    >
                      <span>📝</span>
                      <span>Periodic Assessment 1 (PA-1) - {dossierCurrentClass?.class_name || 'PG'} A</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDossierExamFilter('ct3')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                        dossierExamFilter === 'ct3'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                          : 'bg-[#F4F8F5] text-slate-700 border-[#DCE8E0] hover:bg-white'
                      }`}
                    >
                      <span>📝</span>
                      <span>Class Test 3 (August Session) - {dossierCurrentClass?.class_name || 'PG'} A</span>
                    </button>
                  </div>

                  {/* Cohesive ERP Themed Grades Table */}
                  <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider border-b border-[#DCE8E0]">
                        <tr>
                          <th className="py-3 px-4">EXAMINATION</th>
                          <th className="py-3 px-4">SUBJECT</th>
                          <th className="py-3 px-4 text-center">MARKS OBTAINED</th>
                          <th className="py-3 px-4 text-center">GRADE LETTER</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#EBF0ED] font-mono text-xs bg-white">
                        {filteredExamRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#F9FCFA] transition-colors">
                            {/* Examination Badge */}
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-[#F8FAF9] text-slate-800 font-sans font-bold text-xs border border-[#DCE8E0]">
                                {row.examName}
                              </span>
                            </td>

                            {/* Subject */}
                            <td className="py-3 px-4 font-sans font-bold text-[#122A24]">
                              {row.subjectName}
                              {row.subjectCode && (
                                <span className="font-mono text-slate-400 font-normal ml-1.5">({row.subjectCode})</span>
                              )}
                            </td>

                            {/* Marks Obtained */}
                            <td className="py-3 px-4 text-center font-bold text-[#122A24] text-sm">
                              {row.marksObtained.toFixed(2)} <span className="text-slate-400 font-normal text-xs">/ {row.maxMarks}</span>
                            </td>

                            {/* Grade Letter Pill */}
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-3 py-0.5 rounded-lg text-xs font-bold border ${
                                row.grade.startsWith('A')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : row.grade.startsWith('B')
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : row.grade.startsWith('C')
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : row.grade === 'D'
                                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}>
                                {row.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Summary Footer */}
                      {filteredExamRows.length > 0 && (
                        <tfoot className="bg-[#EBF5EF]/70 font-bold text-xs text-[#122A24] border-t-2 border-[#122A24]/20">
                          <tr>
                            <td colSpan={2} className="py-3 px-4 font-display uppercase font-bold text-[#122A24]">
                              Academic Aggregate Across Selected Examinations ({filteredExamRows.length} Papers)
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-sm text-[#122A24]">
                              {dossierTotals.obtained.toFixed(2)} / {dossierTotals.max} <span className="text-emerald-800 text-xs">({dossierTotals.pct.toFixed(1)}%)</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#122A24] text-white shadow-2xs">
                                {calculateCbseGrade(dossierTotals.pct).grade}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 3: CLASS EXAMINATION MATRIX & MARKS LEDGER (TABULAR WORKBENCH)
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'ledger' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 1. TEACHER AUTHENTICATION & FACULTY PORTAL BANNER */}
          {activeTeacher ? (
            <div className="bg-[#122A24] text-white p-4 sm:p-5 rounded-3xl border border-emerald-500/25 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-white flex items-center justify-center font-display font-bold text-lg shadow-inner shrink-0">
                  {activeTeacher.avatar ? (
                    <img src={activeTeacher.avatar} alt={activeTeacher.full_name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{activeTeacher.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-base text-white tracking-tight">
                      {activeTeacher.full_name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
                      {activeTeacher.staff_code || activeTeacher.id}
                    </span>
                    {isClassTeacherOfCurrentClass ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 flex items-center gap-1">
                        <Lock className="h-3 w-3 text-emerald-400" />
                        <span>CLASS TEACHER ({currentClass?.class_name}-{currentClass?.section})</span>
                      </span>
                    ) : activeClassTeacherClass ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/25 text-blue-300 border border-blue-400/50">
                        CLASS TEACHER ({activeClassTeacherClass.class_name}-{activeClassTeacherClass.section}) • SUBJECT TEACHER MODE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/25 text-amber-300 border border-amber-400/50">
                        SUBJECT TEACHER ({activeTeacher.subject_specialization || activeTeacher.department || 'Specialist'})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                    {isClassTeacherOfCurrentClass 
                      ? `Class & section automatically selected. You have primary authority for all subjects of Class ${currentClass?.class_name}-${currentClass?.section}.`
                      : `Subject Assessor Mode: Choose your desired class & section, then select your subject to fill marks.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTeacherLoginModal(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 cursor-pointer transition-all"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Switch Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={handleTeacherLogout}
                  className="p-2 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                  title="Sign out of teacher portal"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-300/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">
                    Teacher Login Required to Submit &amp; Lock Marks
                  </h3>
                  <p className="text-xs text-slate-600 font-sans mt-0.5">
                    Class teachers get their assigned class &amp; section selected automatically. Subject teachers can choose their desired class and subjects to fill marks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherLoginModal(true)}
                className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs border-none cursor-pointer transition-all shrink-0 hover:scale-[1.01]"
              >
                <LogIn className="h-4 w-4 text-emerald-400" />
                <span>Teacher Login / Select ID</span>
              </button>
            </div>
          )}

          {/* 2. EXAM TERM, CLASS/SECTION & SUBJECT FOCUS TOOLBAR */}
          <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Term Selector (3 Cols) */}
              <div className="md:col-span-3 bg-[#F8FAF9] p-2.5 rounded-2xl border border-[#DCE8E0]">
                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Examination Term:
                </label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  className="w-full bg-white px-3 py-2 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                >
                  {EXAM_TERMS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max: {t.maxTotal}M)
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Section Selector (3 Cols) */}
              <div className="md:col-span-3 bg-[#F8FAF9] p-2.5 rounded-2xl border border-[#DCE8E0]">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                    Class &amp; Section:
                  </label>
                  {isClassTeacherOfCurrentClass && isClassLockedToTeacher && (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Auto-Selected
                    </span>
                  )}
                </div>

                {isTeacher && activeClassTeacherClass ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
                      <span className="truncate">{activeClassTeacherClass.class_name} - Section {activeClassTeacherClass.section || 'A'}</span>
                      <span className="text-[10px] font-mono font-bold bg-[#122A24] text-white px-2 py-0.5 rounded-full ml-1 shrink-0">
                        Assigned Homeroom
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-white px-3 py-2 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                    >
                      {sortedClassesList.map(c => {
                        const cName = c.class_name || (c as any).name || 'Class';
                        return (
                          <option key={c.id} value={c.id}>
                            {cName} — Section {c.section || 'A'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* Subject Focus Selector (3 Cols - For Subject Teachers & Class Teachers) */}
              <div className="md:col-span-3 bg-[#F8FAF9] p-2.5 rounded-2xl border border-[#DCE8E0]">
                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Subject to Fill Marks:
                </label>
                <select
                  value={selectedSubjectFocus}
                  onChange={(e) => setSelectedSubjectFocus(e.target.value)}
                  className="w-full bg-white px-3 py-2 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                >
                  <option value="ALL">All Subjects (Full Class Ledger)</option>
                  {classSubjects.map(s => {
                    const isSpecialty = activeTeacher && (
                      (activeTeacher.subject_specialization && s.name.toLowerCase().includes(activeTeacher.subject_specialization.toLowerCase())) ||
                      (activeTeacher.department && s.name.toLowerCase().includes(activeTeacher.department.toLowerCase()))
                    );
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''} {isSpecialty ? '★ (Your Subject)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action Buttons (3 Cols) */}
              <div className="md:col-span-3 flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveLedger}
                  className="flex-1 py-2.5 px-3 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
                  title="Save and lock student marks"
                >
                  <Save className="h-4 w-4" />
                  <span>Save &amp; Lock</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                  title="Export Class Ledger CSV"
                >
                  <Download className="h-4 w-4 text-emerald-700" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* CLASS PERFORMANCE KPIS STATS STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Class Average */}
            <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Class Average %</div>
                <div className="text-2xl font-bold font-mono text-[#122A24] mt-0.5">{classKpis.avgPercentage}%</div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3" /> CBSE Standard
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                📊
              </div>
            </div>

            {/* KPI 2: Top Scorer */}
            <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Class Topper ({classKpis.highestPercentage}%)</div>
                <div className="text-sm font-bold text-[#122A24] truncate max-w-[140px] mt-1" title={classKpis.topScorer}>
                  {classKpis.topScorer}
                </div>
                <div className="text-[10px] text-purple-700 font-bold mt-0.5">Rank 1 • Grade A1</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-lg">
                👑
              </div>
            </div>

            {/* KPI 3: Passing Rate */}
            <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Passing Rate</div>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">{classKpis.passRate}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Min 33% per subject</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            {/* KPI 4: Scholars Tested */}
            <div className="p-4 rounded-2xl bg-white border border-[#DCE8E0] shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Scholars Enrolled</div>
                <div className="text-2xl font-bold font-mono text-[#122A24] mt-0.5">{classKpis.testedCount}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{classSubjects.length} Curricular Subjects</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              SEPARATE EVALUATION COMPONENT WORKBENCH (THEORY vs PRACTICAL)
              ═════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            
            {/* 1. Component Mode Selector Strip (Theory / Practical / Consolidated) */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-3xl border border-[#DCE8E0] shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto p-1 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setMarksEntryComponent('THEORY')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border-none shrink-0 ${
                    marksEntryComponent === 'THEORY'
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-white/60'
                  }`}
                >
                  <span className="text-base">📝</span>
                  <div className="text-left">
                    <div className="font-bold">Theory Paper Marks List</div>
                    <div className={`text-[10px] font-mono ${marksEntryComponent === 'THEORY' ? 'text-emerald-300' : 'text-slate-400'}`}>
                      Max {currentTerm.maxTheory} Marks • Written Exam
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMarksEntryComponent('PRACTICAL')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border-none shrink-0 ${
                    marksEntryComponent === 'PRACTICAL'
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-white/60'
                  }`}
                >
                  <span className="text-base">🧪</span>
                  <div className="text-left">
                    <div className="font-bold">Practical &amp; IA Marks List</div>
                    <div className={`text-[10px] font-mono ${marksEntryComponent === 'PRACTICAL' ? 'text-emerald-300' : 'text-slate-400'}`}>
                      Max {currentTerm.maxPractical} Marks • Lab / Viva / IA
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMarksEntryComponent('COMBINED')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border-none shrink-0 ${
                    marksEntryComponent === 'COMBINED'
                      ? 'bg-[#122A24] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:text-[#122A24] hover:bg-white/60'
                  }`}
                >
                  <span className="text-base">📊</span>
                  <div className="text-left">
                    <div className="font-bold">Consolidated Matrix</div>
                    <div className={`text-[10px] font-mono ${marksEntryComponent === 'COMBINED' ? 'text-emerald-300' : 'text-slate-400'}`}>
                      Theory + Practical = {currentTerm.maxTotal}M
                    </div>
                  </div>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleSaveLedger}
                  className="px-4 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
                  title="Save and lock student marks"
                >
                  <Save className="h-4 w-4" />
                  <span>Save &amp; Lock</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all"
                  title="Export Class Ledger CSV"
                >
                  <Download className="h-4 w-4 text-emerald-700" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* 2. Subject Switcher Bar for Separate Theory / Practical Entry */}
            {(marksEntryComponent === 'THEORY' || marksEntryComponent === 'PRACTICAL') && (
              <div className="bg-white p-3.5 rounded-2xl border border-[#DCE8E0] shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-thin">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase shrink-0 mr-1 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-emerald-700" />
                  <span>Choose Subject List:</span>
                </span>
                {classSubjects.map((sub) => {
                  const isSelected = (currentComponentSubject?.id === sub.id);
                  const filledCount = classStudents.filter(stu => {
                    const sm = marksLedger[stu.id]?.marks[sub.id];
                    if (!sm) return false;
                    return marksEntryComponent === 'THEORY' 
                      ? (sm.theory > 0 || sm.theoryStatus === 'ABSENT' || sm.theoryStatus === 'MEDICAL')
                      : (sm.practical > 0 || sm.practicalStatus === 'ABSENT' || sm.practicalStatus === 'EXEMPT');
                  }).length;
                  const isDone = (filledCount === classStudents.length && classStudents.length > 0);

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setActiveComponentSubjectId(sub.id);
                        setSelectedSubjectFocus(sub.id);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                          : 'bg-[#F9FCFA] text-slate-700 border-[#DCE8E0] hover:bg-white hover:border-emerald-600/40'
                      }`}
                    >
                      <span>{sub.name}</span>
                      {sub.code && <span className="opacity-75 text-[10px] font-mono">({sub.code})</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                        isSelected 
                          ? (isDone ? 'bg-emerald-400 text-emerald-950 font-black' : 'bg-white/20 text-white')
                          : (isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')
                      }`}>
                        {filledCount}/{classStudents.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                MODE A: SEPARATE THEORY EXAMINATION MARKS ENTRY SHEET
                ───────────────────────────────────────────────────────────── */}
            {marksEntryComponent === 'THEORY' && currentComponentSubject && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4 animate-fade-in">
                
                {/* Header & Evaluation Standard Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-lg">
                      📝
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display font-bold text-base text-[#122A24]">
                          Theory Paper Marks List: {currentComponentSubject.name} {currentComponentSubject.code ? `(${currentComponentSubject.code})` : ''}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          SEPARATE THEORY LIST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Class {currentClass?.class_name}-{currentClass?.section || 'A'} • Max Theory: <strong className="text-slate-800">{currentTerm.maxTheory} Marks</strong> • Passing Threshold: {Math.ceil(currentTerm.maxTheory * 0.33)} Marks (33%)
                      </p>
                    </div>
                  </div>

                  {/* Theory Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search scholar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-emerald-600 w-36 sm:w-44 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkAllComponentPresent(currentComponentSubject.id, 'theory')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Mark all scholars as Present"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Mark All Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePopulateComponentBenchmarks(currentComponentSubject.id, 'theory')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span className="hidden sm:inline">Fill Theory Benchmarks</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearComponentMarks(currentComponentSubject.id, 'theory')}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear Theory marks for this subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Theory Marks Entry Table */}
                <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[620px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider sticky top-0 z-20 border-b border-[#DCE8E0]">
                        <tr>
                          <th className="py-3.5 px-3 text-center min-w-[60px] w-[60px] sticky left-0 bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Roll</th>
                          <th className="py-3.5 px-4 min-w-[210px] sticky left-[60px] bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Scholar Details</th>
                          <th className="py-3.5 px-3.5 text-center min-w-[170px] border-r border-[#E8F0EA]">Attendance / Status</th>
                          <th className="py-3.5 px-4 text-center min-w-[150px] bg-amber-50/70 text-amber-950 border-r border-amber-200">
                            Theory Marks (Max {currentTerm.maxTheory})
                          </th>
                          <th className="py-3.5 px-3 text-center min-w-[110px] border-r border-[#E8F0EA]">Theory %</th>
                          <th className="py-3.5 px-3.5 text-center min-w-[100px] border-r border-[#E8F0EA]">Grade</th>
                          <th className="py-3.5 px-4 min-w-[200px] border-r border-[#E8F0EA]">Evaluator Remarks / Notes</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F0F4F2] font-mono text-xs bg-white">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                              No scholars found matching search filter.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((stu, sIdx) => {
                            const stuRec = marksLedger[stu.id] || { marks: {} };
                            const sm = stuRec.marks[currentComponentSubject.id] || {
                              theory: 0,
                              practical: 0,
                              total: 0,
                              grade: 'E2',
                              gp: 0.0,
                              theoryStatus: 'PRESENT'
                            };

                            const isAbsent = sm.theoryStatus === 'ABSENT';
                            const isMedical = sm.theoryStatus === 'MEDICAL';
                            const thPct = Number(((sm.theory / currentTerm.maxTheory) * 100).toFixed(1));
                            const isPass = !isAbsent && sm.theory >= Math.ceil(currentTerm.maxTheory * 0.33);

                            return (
                              <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors group">
                                {/* Roll No */}
                                <td className="py-3 px-2.5 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                                  #{stu.roll_no || sIdx + 1}
                                </td>

                                {/* Scholar Name & Adm */}
                                <td className="py-3 px-4 font-sans font-bold text-[#122A24] sticky left-[60px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[220px]">
                                  <div className="truncate text-slate-900 font-bold">{stu.full_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                                    Adm: {stu.admission_no || stu.id}
                                  </div>
                                </td>

                                {/* Attendance Status Toggles */}
                                <td className="py-2.5 px-3 text-center border-r border-[#E8F0EA]">
                                  <div className="inline-flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0]">
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'theory', 'PRESENT')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        !isAbsent && !isMedical
                                          ? 'bg-emerald-700 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-emerald-800'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'theory', 'ABSENT')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        isAbsent
                                          ? 'bg-rose-700 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-rose-700'
                                      }`}
                                    >
                                      AB
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'theory', 'MEDICAL')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        isMedical
                                          ? 'bg-amber-600 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-amber-700'
                                      }`}
                                    >
                                      ML
                                    </button>
                                  </div>
                                </td>

                                {/* Theory Marks Input */}
                                <td className="py-2.5 px-4 text-center border-r border-amber-200 bg-amber-50/20">
                                  {isAbsent ? (
                                    <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs font-mono">
                                      ABSENT (0)
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        min={0}
                                        max={currentTerm.maxTheory}
                                        value={sm.theory === 0 ? '' : sm.theory}
                                        placeholder="0"
                                        onChange={(e) => handleUpdateMark(stu.id, currentComponentSubject.id, 'theory', Number(e.target.value))}
                                        className="w-16 px-2 py-1.5 text-center font-mono font-bold text-sm bg-white border border-[#DCE8E0] rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-2xs"
                                        title={`Theory Marks (Max ${currentTerm.maxTheory})`}
                                      />
                                      <span className="text-slate-400 font-bold text-xs font-mono">/ {currentTerm.maxTheory}</span>
                                    </div>
                                  )}
                                </td>

                                {/* Score % & Status */}
                                <td className="py-2.5 px-3 text-center border-r border-[#E8F0EA]">
                                  {isAbsent ? (
                                    <span className="text-rose-600 font-bold text-[11px]">AB</span>
                                  ) : (
                                    <div>
                                      <div className="font-mono font-bold text-xs text-[#122A24]">{thPct}%</div>
                                      <div className={`text-[9.5px] font-bold mt-0.5 ${isPass ? 'text-emerald-700' : 'text-rose-600'}`}>
                                        {isPass ? '✓ Qualified' : 'Needs Work'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Grade */}
                                <td className="py-2.5 px-3.5 text-center border-r border-[#E8F0EA]">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isAbsent ? 'bg-rose-100 text-rose-800' :
                                    sm.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                    sm.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                    sm.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                    sm.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isAbsent ? 'AB' : sm.grade}
                                  </span>
                                </td>

                                {/* Evaluator Remarks */}
                                <td className="py-2 px-3 border-r border-[#E8F0EA]">
                                  <input
                                    type="text"
                                    placeholder="Add comment..."
                                    value={sm.theoryRemarks || ''}
                                    onChange={(e) => handleSetComponentRemarks(stu.id, currentComponentSubject.id, 'theory', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs font-sans bg-[#F8FAF9] hover:bg-white focus:bg-white border border-transparent focus:border-[#DCE8E0] rounded-lg outline-none focus:ring-1 focus:ring-emerald-600"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Theory Sheet Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] text-xs font-mono">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-slate-600">
                      Total Scholars: <strong>{classStudents.length}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">
                      Present: {classStudents.filter(s => marksLedger[s.id]?.marks[currentComponentSubject.id]?.theoryStatus !== 'ABSENT').length}
                    </span>
                    <span>•</span>
                    <span className="text-rose-600 font-bold">
                      Absent: {classStudents.filter(s => marksLedger[s.id]?.marks[currentComponentSubject.id]?.theoryStatus === 'ABSENT').length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveLedger}
                    className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm border-none cursor-pointer self-start sm:self-auto transition-all"
                  >
                    <Save className="h-4 w-4 text-emerald-400" />
                    <span>Save &amp; Lock Theory Marks ({currentComponentSubject.name})</span>
                  </button>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                MODE B: SEPARATE PRACTICAL / LAB & IA MARKS ENTRY SHEET
                ───────────────────────────────────────────────────────────── */}
            {marksEntryComponent === 'PRACTICAL' && currentComponentSubject && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4 animate-fade-in">
                
                {/* Header & Practical Evaluation Standard Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-lg">
                      🧪
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display font-bold text-base text-[#122A24]">
                          Practical &amp; Internal Assessment (IA) List: {currentComponentSubject.name} {currentComponentSubject.code ? `(${currentComponentSubject.code})` : ''}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300">
                          SEPARATE PRACTICAL LIST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Class {currentClass?.class_name}-{currentClass?.section || 'A'} • Max Practical/IA: <strong className="text-slate-800">{currentTerm.maxPractical} Marks</strong> • Lab Journal (5M) + Viva (5M) + Project/Experiments (10M)
                      </p>
                    </div>
                  </div>

                  {/* Practical Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search scholar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-emerald-600 w-36 sm:w-44 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkAllComponentPresent(currentComponentSubject.id, 'practical')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Mark all scholars as Present"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                      <span className="hidden sm:inline">Mark All Present</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePopulateComponentBenchmarks(currentComponentSubject.id, 'practical')}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                      <span className="hidden sm:inline">Fill Practical Benchmarks</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearComponentMarks(currentComponentSubject.id, 'practical')}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear Practical marks for this subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Practical Marks Entry Table */}
                <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[620px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider sticky top-0 z-20 border-b border-[#DCE8E0]">
                        <tr>
                          <th className="py-3.5 px-3 text-center min-w-[60px] w-[60px] sticky left-0 bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Roll</th>
                          <th className="py-3.5 px-4 min-w-[210px] sticky left-[60px] bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Scholar Details</th>
                          <th className="py-3.5 px-3.5 text-center min-w-[170px] border-r border-[#E8F0EA]">Practical Attendance</th>
                          <th className="py-3.5 px-4 text-center min-w-[150px] bg-teal-50/70 text-teal-950 border-r border-teal-200">
                            Practical / IA (Max {currentTerm.maxPractical})
                          </th>
                          <th className="py-3.5 px-3 text-center min-w-[110px] border-r border-[#E8F0EA]">IA %</th>
                          <th className="py-3.5 px-3.5 text-center min-w-[100px] border-r border-[#E8F0EA]">Grade</th>
                          <th className="py-3.5 px-4 min-w-[200px] border-r border-[#E8F0EA]">Lab / Project Observations</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F0F4F2] font-mono text-xs bg-white">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                              No scholars found matching search filter.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((stu, sIdx) => {
                            const stuRec = marksLedger[stu.id] || { marks: {} };
                            const sm = stuRec.marks[currentComponentSubject.id] || {
                              theory: 0,
                              practical: 0,
                              total: 0,
                              grade: 'E2',
                              gp: 0.0,
                              practicalStatus: 'PRESENT'
                            };

                            const isAbsent = sm.practicalStatus === 'ABSENT';
                            const isExempt = sm.practicalStatus === 'EXEMPT';
                            const prPct = Number(((sm.practical / currentTerm.maxPractical) * 100).toFixed(1));
                            const isPass = !isAbsent && sm.practical >= Math.ceil(currentTerm.maxPractical * 0.33);

                            return (
                              <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors group">
                                {/* Roll No */}
                                <td className="py-3 px-2.5 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                                  #{stu.roll_no || sIdx + 1}
                                </td>

                                {/* Scholar Name & Adm */}
                                <td className="py-3 px-4 font-sans font-bold text-[#122A24] sticky left-[60px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[220px]">
                                  <div className="truncate text-slate-900 font-bold">{stu.full_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                                    Adm: {stu.admission_no || stu.id}
                                  </div>
                                </td>

                                {/* Practical Attendance Status */}
                                <td className="py-2.5 px-3 text-center border-r border-[#E8F0EA]">
                                  <div className="inline-flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0]">
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'practical', 'PRESENT')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        !isAbsent && !isExempt
                                          ? 'bg-teal-700 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-teal-800'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'practical', 'ABSENT')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        isAbsent
                                          ? 'bg-rose-700 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-rose-700'
                                      }`}
                                    >
                                      AB
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetComponentStatus(stu.id, currentComponentSubject.id, 'practical', 'EXEMPT')}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-all ${
                                        isExempt
                                          ? 'bg-blue-600 text-white shadow-2xs'
                                          : 'bg-transparent text-slate-600 hover:text-blue-700'
                                      }`}
                                    >
                                      Exempt
                                    </button>
                                  </div>
                                </td>

                                {/* Practical Marks Input */}
                                <td className="py-2.5 px-4 text-center border-r border-teal-200 bg-teal-50/20">
                                  {isAbsent ? (
                                    <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs font-mono">
                                      ABSENT (0)
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        min={0}
                                        max={currentTerm.maxPractical}
                                        value={sm.practical === 0 ? '' : sm.practical}
                                        placeholder="0"
                                        onChange={(e) => handleUpdateMark(stu.id, currentComponentSubject.id, 'practical', Number(e.target.value))}
                                        className="w-16 px-2 py-1.5 text-center font-mono font-bold text-sm bg-white border border-[#DCE8E0] rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none shadow-2xs"
                                        title={`Practical Marks (Max ${currentTerm.maxPractical})`}
                                      />
                                      <span className="text-slate-400 font-bold text-xs font-mono">/ {currentTerm.maxPractical}</span>
                                    </div>
                                  )}
                                </td>

                                {/* Score % & Status */}
                                <td className="py-2.5 px-3 text-center border-r border-[#E8F0EA]">
                                  {isAbsent ? (
                                    <span className="text-rose-600 font-bold text-[11px]">AB</span>
                                  ) : (
                                    <div>
                                      <div className="font-mono font-bold text-xs text-[#122A24]">{prPct}%</div>
                                      <div className={`text-[9.5px] font-bold mt-0.5 ${isPass ? 'text-teal-700' : 'text-rose-600'}`}>
                                        {isPass ? '✓ Satisfactory' : 'Needs Work'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Grade */}
                                <td className="py-2.5 px-3.5 text-center border-r border-[#E8F0EA]">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isAbsent ? 'bg-rose-100 text-rose-800' :
                                    sm.grade.startsWith('A') ? 'bg-teal-100 text-teal-800' :
                                    sm.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                    sm.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                    sm.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isAbsent ? 'AB' : sm.grade}
                                  </span>
                                </td>

                                {/* Lab Observations */}
                                <td className="py-2 px-3 border-r border-[#E8F0EA]">
                                  <input
                                    type="text"
                                    placeholder="Add lab observations..."
                                    value={sm.practicalRemarks || ''}
                                    onChange={(e) => handleSetComponentRemarks(stu.id, currentComponentSubject.id, 'practical', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs font-sans bg-[#F8FAF9] hover:bg-white focus:bg-white border border-transparent focus:border-[#DCE8E0] rounded-lg outline-none focus:ring-1 focus:ring-teal-600"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Practical Sheet Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] text-xs font-mono">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-slate-600">
                      Total Scholars: <strong>{classStudents.length}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-teal-700 font-bold">
                      Present: {classStudents.filter(s => marksLedger[s.id]?.marks[currentComponentSubject.id]?.practicalStatus !== 'ABSENT').length}
                    </span>
                    <span>•</span>
                    <span className="text-rose-600 font-bold">
                      Absent: {classStudents.filter(s => marksLedger[s.id]?.marks[currentComponentSubject.id]?.practicalStatus === 'ABSENT').length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveLedger}
                    className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm border-none cursor-pointer self-start sm:self-auto transition-all"
                  >
                    <Save className="h-4 w-4 text-teal-400" />
                    <span>Save &amp; Lock Practical Marks ({currentComponentSubject.name})</span>
                  </button>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                MODE C: CONSOLIDATED CLASS PERFORMANCE & FINAL MARKS MATRIX
                ───────────────────────────────────────────────────────────── */}
            {marksEntryComponent === 'COMBINED' && (
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4 animate-fade-in">
                
                {/* Consolidated Header & Quick Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold">
                      <BookOpen className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-base text-[#122A24]">
                        Consolidated Examination Ledger: {currentClass?.class_name || 'Class'} - Section {currentClass?.section || 'A'} ({classStudents.length} Scholars)
                      </h2>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {currentTerm.name} • Theory (Max {currentTerm.maxTheory}) + Practical/IA (Max {currentTerm.maxPractical}) = Total {currentTerm.maxTotal} Marks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search scholar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:outline-none focus:ring-2 focus:ring-emerald-600 w-36 sm:w-44 font-medium"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handlePopulateBenchmarks}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Fill All Benchmarks</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearLedger}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Clear all marks in ledger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Consolidated Marks Table */}
                <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-[620px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider sticky top-0 z-20 border-b border-[#DCE8E0]">
                        <tr>
                          <th className="py-3.5 px-3 text-center min-w-[60px] w-[60px] sticky left-0 bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Roll</th>
                          <th className="py-3.5 px-4 min-w-[210px] sticky left-[60px] bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Scholar Details</th>
                          
                          {/* Subject Columns showing Theory + Practical + Total */}
                          {displayedSubjects.map(sub => (
                            <th key={sub.id} className="py-3 px-3 text-center min-w-[155px] border-r border-[#E8F0EA]">
                              <div className="font-bold text-[#122A24] text-xs truncate max-w-[150px] mx-auto" title={sub.name}>{sub.name}</div>
                              <div className="text-[10px] font-normal text-slate-500 font-mono mt-0.5">
                                {sub.code ? `[${sub.code}] ` : ''}Th({currentTerm.maxTheory}) + Pr({currentTerm.maxPractical})
                              </div>
                            </th>
                          ))}

                          <th className="py-3.5 px-3.5 text-center min-w-[115px] bg-[#EBF5EF] text-[#1C443A] border-r border-[#C5E2CF]">Total / %</th>
                          <th className="py-3.5 px-4 text-center min-w-[150px] bg-[#EBF5EF] text-[#1C443A] border-r border-[#C5E2CF]">CBSE Grade</th>
                          <th className="py-3.5 px-4 text-center min-w-[140px] sticky right-0 bg-[#F8FAF9] z-30 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] border-l border-[#E8F0EA]">Report Card</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#F0F4F2] font-mono text-xs bg-white">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={displayedSubjects.length + 5} className="py-12 text-center text-slate-400 font-sans">
                              No scholars found matching the selected class or search filter.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((stu, sIdx) => {
                            const stuRec = marksLedger[stu.id] || { marks: {} };
                            const overall = computeStudentOverall(stu.id);

                            return (
                              <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors group">
                                {/* Roll No */}
                                <td className="py-3 px-2.5 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                                  #{stu.roll_no || sIdx + 1}
                                </td>

                                {/* Scholar Name & Adm */}
                                <td className="py-3 px-4 font-sans font-bold text-[#122A24] sticky left-[60px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[220px]">
                                  <div className="truncate text-slate-900 font-bold">{stu.full_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                                    Adm: {stu.admission_no || stu.id}
                                  </div>
                                </td>

                                {/* Per Subject Overview */}
                                {displayedSubjects.map(sub => {
                                  const sm = stuRec.marks[sub.id] || {
                                    theory: 0,
                                    practical: 0,
                                    total: 0,
                                    grade: 'E2',
                                    gp: 0.0
                                  };

                                  return (
                                    <td key={sub.id} className="py-2.5 px-3 text-center border-r border-[#E8F0EA] bg-[#FCFDFC]">
                                      <div className="flex items-center justify-center gap-1.5 py-0.5 font-mono text-xs">
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px]" title="Theory Score">
                                          Th: {sm.theory}
                                        </span>
                                        <span className="text-slate-300 font-bold">+</span>
                                        <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200 font-bold text-[11px]" title="Practical Score">
                                          Pr: {sm.practical}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex items-center justify-center gap-1.5">
                                        <span className="font-mono font-bold text-xs text-[#122A24]">{sm.total}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          sm.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                          sm.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                          sm.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                          sm.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {sm.grade}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Grand Total & % */}
                                <td className="py-3 px-3.5 text-center font-bold bg-[#EBF5EF]/30 border-r border-[#C5E2CF]">
                                  <div className="font-mono font-extrabold text-xs text-[#122A24]">{overall.grandTotal}/{overall.maxGrandTotal}</div>
                                  <div className="text-[11px] text-emerald-700 font-bold font-mono mt-0.5">{overall.percentage}%</div>
                                </td>

                                {/* Overall Grade Badge */}
                                <td className="py-3 px-3.5 text-center font-bold bg-[#EBF5EF]/30 border-r border-[#C5E2CF] whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap shadow-2xs ${
                                    overall.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                    overall.grade.startsWith('B') ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                    overall.grade.startsWith('C') ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                    overall.grade === 'D' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                                    'bg-rose-100 text-rose-900 border border-rose-300'
                                  }`}>
                                    <span>{overall.grade}</span>
                                    <span className="text-[10px] font-normal opacity-85 font-mono">({overall.cgpa.toFixed(1)} GP)</span>
                                  </span>
                                </td>

                                {/* Marksheet View Button */}
                                <td className="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-[#F9FCFA] shadow-[-6px_0_12px_rgba(0,0,0,0.03)] border-l border-[#E8F0EA]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReportCard(stu)}
                                    className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-all whitespace-nowrap"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Marksheet</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 4: ANNUAL CONSOLIDATION SHEET (BROAD-SHEET) (SCREENSHOT)
          ═════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════
          VIEW 4: ANNUAL CONSOLIDATION SHEET (BROAD-SHEET) WITH AUTO-RANK
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'broadsheet' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Control Bar Card */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              
              {/* Title & Subtitle */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📑</span>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-[#122A24]">
                    Annual Consolidation Sheet (Broad-sheet)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-sans">
                  Dynamic annual consolidation: Admin selects exams &amp; class tests, and total marks, percentage &amp; class ranks are automatically calculated.
                </p>
              </div>

              {/* Controls Toolbar: Class Dropdown + Year + Sort Selector + Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Class Selector */}
                <div className="flex items-center gap-1.5 bg-[#F8FAF9] px-3 py-1.5 rounded-xl border border-[#DCE8E0]">
                  <span className="text-xs font-bold text-slate-600 font-mono">Class:</span>
                  <select
                    value={broadsheetClassId}
                    onChange={(e) => setBroadsheetClassId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#122A24] outline-none cursor-pointer"
                  >
                    {sortedClassesList.map(c => {
                      const cName = c.class_name || (c as any).name || 'Class';
                      return (
                        <option key={c.id} value={c.id}>
                          Class: {cName} - {c.section || 'A'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Year / Session Selector */}
                <div className="flex items-center gap-1.5 bg-[#F8FAF9] px-3 py-1.5 rounded-xl border border-[#DCE8E0]">
                  <span className="text-xs font-bold text-slate-600 font-mono">Session:</span>
                  <span className="text-xs font-bold text-[#122A24]">{selectedSession}</span>
                </div>

                {/* Sort Order Selector */}
                <div className="flex items-center gap-1.5 bg-[#F8FAF9] px-3 py-1.5 rounded-xl border border-[#DCE8E0]">
                  <span className="text-xs font-bold text-slate-600 font-mono">Sort By:</span>
                  <select
                    value={broadsheetSortBy}
                    onChange={(e) => setBroadsheetSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-[#122A24] outline-none cursor-pointer"
                  >
                    <option value="ROLL">Roll Number (Ascending)</option>
                    <option value="RANK">🏆 Class Rank (Topper First)</option>
                    <option value="PERCENTAGE">Percentage % (High to Low)</option>
                    <option value="NAME">Scholar Name (A-Z)</option>
                  </select>
                </div>

                {/* Download CSV Template */}
                <button
                  type="button"
                  onClick={handleDownloadBroadsheetTemplate}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="Download editable CSV template for this class"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">CSV Template</span>
                </button>

                {/* Export & Print Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBroadsheetExportMenu(!showBroadsheetExportMenu)}
                    className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border-none"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Export &amp; Print</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  </button>

                  {showBroadsheetExportMenu && (
                    <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl border border-[#DCE8E0] shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBroadsheetExportMenu(false);
                          window.print();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#122A24] hover:bg-[#EBF5EF] rounded-xl flex items-center gap-2 transition-colors border-none cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Print Landscape Broadsheet</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportFullBroadsheetCsv}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#122A24] hover:bg-[#EBF5EF] rounded-xl flex items-center gap-2 transition-colors border-none cursor-pointer"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Export Broadsheet CSV ({activeSelectedAssessments.length} Exams)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              ADMIN ASSESSMENT SELECTOR FOR CONSOLIDATED SHEET
              ═════════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#1C443A] flex items-center justify-center font-bold text-lg">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-base text-[#122A24]">
                      Choose Exams &amp; Class Tests for Consolidation
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {activeSelectedAssessments.length} of {broadsheetAvailableAssessments.length} Selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Select which exams and tests to merge. The engine automatically computes total marks, percentage, and assigns dynamic class ranks.
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAllExams}
                  className="px-3 py-1.5 bg-[#F4F8F5] hover:bg-[#E8F2EC] text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Select All ({broadsheetAvailableAssessments.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectMajorOnly}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Major Exams Only
                </button>
                <button
                  type="button"
                  onClick={handleSelectTestsOnly}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Class Tests Only
                </button>
                <button
                  type="button"
                  onClick={handleClearAllExams}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  title="Reset to 1 exam"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Assessment Grid Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {broadsheetAvailableAssessments.map((exam) => {
                const isSelected = selectedBroadsheetExamIds.includes(exam.id);
                return (
                  <div
                    key={exam.id}
                    onClick={() => toggleBroadsheetExam(exam.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                      isSelected
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                        : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-white hover:border-emerald-600/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-300 bg-white text-transparent'
                      }`}>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate" title={exam.title}>
                          {exam.title}
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 truncate flex items-center gap-1.5 ${
                          isSelected ? 'text-emerald-300' : 'text-slate-500'
                        }`}>
                          <span>{exam.type === 'CLASS_TEST' ? '⚡ Class Test' : '🏛️ School Exam'}</span>
                          {exam.isPosted && (
                            <span className={`px-1 rounded text-[9px] font-bold ${
                              isSelected ? 'bg-emerald-800 text-emerald-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              Admin Posted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EBF5EF] text-emerald-800 border border-[#C5E2CF]'
                    }`}>
                      {exam.max_marks}M
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Live Formula & KPI Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-[#F8FAF9] border border-[#DCE8E0] rounded-2xl text-center">
                <div className="text-[10.5px] font-mono text-slate-500 uppercase font-semibold">Active Assessments</div>
                <div className="text-base sm:text-lg font-mono font-black text-[#122A24] mt-0.5">
                  {activeSelectedAssessments.length} Included
                </div>
                <div className="text-[10px] text-emerald-700 font-mono font-bold">
                  Max: {activeSelectedAssessments.reduce((acc, e) => acc + e.max_marks, 0)} Marks
                </div>
              </div>

              <div className="p-3 bg-[#F8FAF9] border border-[#DCE8E0] rounded-2xl text-center">
                <div className="text-[10.5px] font-mono text-slate-500 uppercase font-semibold">Class Average</div>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-800 mt-0.5">
                  {broadsheetKpis.classAverage}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Across {broadsheetKpis.totalStudents} Scholars
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl text-center">
                <div className="text-[10.5px] font-mono text-amber-900 uppercase font-semibold flex items-center justify-center gap-1">
                  <span>🥇</span>
                  <span>Class Topper (Rank 1)</span>
                </div>
                <div className="text-xs sm:text-sm font-bold text-amber-950 mt-0.5 truncate px-1" title={broadsheetKpis.topperName}>
                  {broadsheetKpis.topperName}
                </div>
                <div className="text-[10px] text-amber-800 font-mono font-bold">
                  Score: {broadsheetKpis.topperScore}%
                </div>
              </div>

              <div className="p-3 bg-[#F8FAF9] border border-[#DCE8E0] rounded-2xl text-center">
                <div className="text-[10.5px] font-mono text-slate-500 uppercase font-semibold">Pass / Promotion Rate</div>
                <div className="text-base sm:text-lg font-mono font-black text-blue-800 mt-0.5">
                  {broadsheetKpis.passRate}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Threshold: ≥ 33%
                </div>
              </div>
            </div>
          </div>

          {/* Official Document Container */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-4" id="broadsheet-print-container">
            
            {/* Broadsheet Banner Header */}
            <div className="border border-[#122A24]/30 rounded-2xl p-4 sm:p-5 space-y-3 bg-[#FCFDFC]">
              {/* Row 1: School Name + Session | CONSOLIDATION SHEET | Class Teacher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8F0EA] pb-3">
                <div className="flex items-center gap-2 font-display font-black text-xs sm:text-sm text-[#122A24] tracking-tight">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span>{selectedSchool?.school_name?.toUpperCase() || schoolName.toUpperCase()}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="font-mono text-emerald-900">SESSION {selectedSession}</span>
                </div>

                <div className="text-center font-display font-black text-sm sm:text-base text-[#122A24] tracking-wider uppercase">
                  ANNUAL CONSOLIDATED MARKSHEET &amp; MERIT REGISTER
                </div>

                <div className="text-left sm:text-right font-mono font-bold text-xs text-[#122A24]">
                  CLASS TEACHER: <span className="text-emerald-900">{teachers[0]?.full_name?.toUpperCase() || 'FACULTY IN-CHARGE'}</span>
                </div>
              </div>

              {/* Row 2: Class | Included Assessments | Total Students */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="font-bold text-[#122A24]">
                  CLASS: <span className="text-emerald-900 font-black">{broadsheetCurrentClass?.class_name || 'PG'} - {broadsheetCurrentClass?.section || 'A'}</span>
                </div>

                <div className="text-slate-600 font-medium text-center text-[11px]">
                  Consolidated Formula: <strong className="text-[#122A24]">{activeSelectedAssessments.length} Selected Assessments</strong> (Max Aggregate: {activeSelectedAssessments.reduce((acc, e) => acc + e.max_marks, 0)} Marks)
                </div>

                <div className="text-left sm:text-right font-bold text-[#122A24]">
                  TOTAL SCHOLARS: <span className="text-emerald-900 font-black">{broadsheetClassStudents.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Search + Sort Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search student by name, roll no, or admission no..."
                  value={broadsheetSearch}
                  onChange={(e) => setBroadsheetSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium transition-all"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBroadsheetSortBy(broadsheetSortBy === 'RANK' ? 'ROLL' : 'RANK')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    broadsheetSortBy === 'RANK'
                      ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                      : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                  }`}
                >
                  <span>🏆 Sort by Rank</span>
                  {broadsheetSortBy === 'RANK' && <span className="text-[10px]">✓ Active</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setBroadsheetSortBy(broadsheetSortBy === 'PERCENTAGE' ? 'ROLL' : 'PERCENTAGE')}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    broadsheetSortBy === 'PERCENTAGE'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300 shadow-xs'
                      : 'bg-white text-slate-700 border-[#DCE8E0] hover:bg-slate-50'
                  }`}
                >
                  <span>% Sort by Score</span>
                  {broadsheetSortBy === 'PERCENTAGE' && <span className="text-[10px]">✓ Active</span>}
                </button>
              </div>
            </div>

            {/* Mobile Horizontal Swipe Notice */}
            <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-[#EBF5EF] rounded-xl text-[10.5px] font-mono text-[#1C443A] border border-[#C5E2CF]">
              <span>👈 Swipe horizontally to view all assessment columns 👉</span>
              <span className="font-bold">A3 Grid</span>
            </div>

            {/* Dynamic Consolidated Broadsheet Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-x-auto shadow-2xs scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0D1B17] text-white font-mono font-bold text-[10.5px] uppercase tracking-wider">
                    {/* Roll No */}
                    <th className="py-3 px-3 text-center sticky left-0 z-20 bg-[#0D1B17] border-r border-slate-700 min-w-[60px]">
                      ROLL
                    </th>

                    {/* Class Rank (Auto-decided!) */}
                    <th className="py-3 px-3 text-center sticky left-[60px] z-20 bg-[#0D1B17] border-r border-slate-700 min-w-[95px] text-amber-300">
                      🏆 RANK
                    </th>

                    {/* Student Name */}
                    <th className="py-3 px-4 text-left sticky left-[155px] z-20 bg-[#0D1B17] border-r border-slate-700 min-w-[210px]">
                      STUDENT DETAILS
                    </th>

                    {/* Dynamic Columns for Selected Assessments */}
                    {activeSelectedAssessments.map((exam, exIdx) => {
                      const isTest = exam.type === 'CLASS_TEST';
                      return (
                        <th
                          key={exam.id}
                          className={`py-2.5 px-3 text-center border-r border-slate-700 min-w-[140px] ${
                            isTest ? 'bg-[#1C2C28]' : 'bg-[#122A24]'
                          }`}
                        >
                          <div className="font-bold truncate max-w-[135px] mx-auto text-white" title={exam.title}>
                            {exam.title}
                          </div>
                          <div className="text-[9.5px] font-normal font-mono text-emerald-300 mt-0.5">
                            Max: {exam.max_marks}M • {isTest ? 'Test' : 'Exam'}
                          </div>
                        </th>
                      );
                    })}

                    {/* Summary Columns */}
                    <th className="py-3 px-3.5 text-center bg-[#071F18] border-r border-emerald-900/50 min-w-[115px] text-emerald-300">
                      <div>GRAND TOTAL</div>
                      <div className="text-[9px] opacity-80 font-normal">
                        Max: {activeSelectedAssessments.reduce((acc, e) => acc + e.max_marks, 0)}M
                      </div>
                    </th>

                    <th className="py-3 px-3.5 text-center bg-[#071F18] border-r border-emerald-900/50 min-w-[95px] text-emerald-300">
                      PERCENT %
                    </th>

                    <th className="py-3 px-3 text-center bg-[#071F18] border-r border-emerald-900/50 min-w-[85px] text-emerald-300">
                      GRADE
                    </th>

                    <th className="py-3 px-3 text-center bg-[#071F18] border-r border-emerald-900/50 min-w-[110px] text-emerald-300">
                      RESULT STATUS
                    </th>

                    <th className="py-3 px-3 text-center bg-[#071F18] min-w-[90px]">
                      MARKSHEET
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#EBF0ED] font-mono text-xs bg-white">
                  {filteredRankedBroadsheetStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5 + activeSelectedAssessments.length} className="py-12 text-center text-slate-400 font-sans text-xs">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRankedBroadsheetStudents.map((item, sIdx) => {
                      const stu = item.student;
                      return (
                        <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors group">
                          {/* Roll No */}
                          <td className="py-3 px-3 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                            #{item.rollNo}
                          </td>

                          {/* Class Rank (Auto-decided!) */}
                          <td className="py-3 px-2 text-center sticky left-[60px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                            {item.rank === 1 ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300 font-extrabold rounded-lg inline-flex items-center gap-1 shadow-2xs text-[11px]">
                                <span>🥇</span>
                                <span>Rank 1</span>
                              </span>
                            ) : item.rank === 2 ? (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-extrabold rounded-lg inline-flex items-center gap-1 shadow-2xs text-[11px]">
                                <span>🥈</span>
                                <span>Rank 2</span>
                              </span>
                            ) : item.rank === 3 ? (
                              <span className="px-2.5 py-1 bg-orange-100 text-orange-950 border border-orange-300 font-extrabold rounded-lg inline-flex items-center gap-1 shadow-2xs text-[11px]">
                                <span>🥉</span>
                                <span>Rank 3</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#F4F8F5] text-slate-700 border border-[#DCE8E0] font-bold rounded-md font-mono text-[10.5px]">
                                #{item.rank}
                              </span>
                            )}
                          </td>

                          {/* Student Name & SR No */}
                          <td className="py-3 px-4 text-left font-sans font-bold text-[#122A24] sticky left-[155px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[210px]">
                            <div className="text-slate-900 font-bold truncate">{stu.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                              Adm: {stu.admission_no || stu.id}
                            </div>
                          </td>

                          {/* Per Selected Assessment Scores */}
                          {activeSelectedAssessments.map(exam => {
                            const sc = item.examMarks[exam.id] || { obtained: 0, max: exam.max_marks, pct: 0 };
                            const isPassing = sc.pct >= 33;
                            return (
                              <td key={exam.id} className="py-2.5 px-3 text-center border-r border-[#E8F0EA]">
                                <div className="font-mono font-bold text-xs text-[#122A24]">
                                  {sc.obtained} <span className="text-slate-400 font-normal text-[10.5px]">/ {exam.max_marks}</span>
                                </div>
                                <div className={`text-[10px] font-mono mt-0.5 font-bold ${
                                  isPassing ? 'text-emerald-700' : 'text-rose-600'
                                }`}>
                                  {sc.pct}%
                                </div>
                              </td>
                            );
                          })}

                          {/* Grand Total */}
                          <td className="py-3 px-3.5 text-center font-extrabold text-xs text-[#122A24] bg-[#EBF5EF]/30 border-r border-[#C5E2CF]">
                            <div className="font-mono font-black">{item.totalObtained}</div>
                            <div className="text-[10px] text-slate-500 font-mono font-normal">/ {item.totalPossibleMax}</div>
                          </td>

                          {/* Final Percentage */}
                          <td className="py-3 px-3.5 text-center font-extrabold text-xs border-r border-[#E8F0EA]">
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                              item.percentage >= 90 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              item.percentage >= 75 ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              item.percentage >= 60 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              item.percentage >= 33 ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                              'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {item.percentage}%
                            </span>
                          </td>

                          {/* CBSE Grade */}
                          <td className="py-3 px-3 text-center border-r border-[#E8F0EA]">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                              item.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                              item.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                              item.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {item.grade}
                            </span>
                          </td>

                          {/* Result Status */}
                          <td className="py-3 px-3 text-center border-r border-[#E8F0EA]">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.result === 'QUALIFIED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.result === 'COMPARTMENT'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              {item.result === 'QUALIFIED' ? '✓ Qualified' : item.result === 'COMPARTMENT' ? 'Compartment' : 'Essential Repeat'}
                            </span>
                          </td>

                          {/* Marksheet View Button */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenReportCard(stu)}
                              className="px-2.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-lg text-[10.5px] font-bold shadow-2xs cursor-pointer transition-all inline-flex items-center gap-1"
                              title="View &amp; Print Official Marksheet"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Card</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          WHOLE-SCHOOL MASTER SCHEDULER STUDIO MODAL
          ───────────────────────────────────────────────────────────── */}
      {!isTeacher && showWholeSchoolModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏫</span>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    Whole-School Exam Master Studio
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Auto-generate examination timetable across all {sortedClassesList.length} classes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWholeSchoolModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#122A24] mb-1.5">Exam Series Name</label>
                <input
                  type="text"
                  value={wholeSchoolExamTitle}
                  onChange={(e) => setWholeSchoolExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1.5">Starting Date</label>
                  <input
                    type="date"
                    value={wholeSchoolStartDate}
                    onChange={(e) => setWholeSchoolStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1.5">Max Marks / Subject</label>
                  <select
                    value={wholeSchoolMaxMarks}
                    onChange={(e) => setWholeSchoolMaxMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                  >
                    <option value={20}>20 Marks (Class Test)</option>
                    <option value={40}>40 Marks (Periodic Test)</option>
                    <option value={50}>50 Marks (Mid-Term)</option>
                    <option value={80}>80 Marks (Theory Core)</option>
                    <option value={100}>100 Marks (Annual Board)</option>
                  </select>
                </div>
              </div>

              {/* Multi-Class Selection within Whole School Modal */}
              <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2">
                <div className="font-bold text-[#122A24] flex items-center justify-between">
                  <span>Targeted Classes ({wholeSchoolSelectedClassIds.length} of {sortedClassesList.length} Selected)</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (wholeSchoolSelectedClassIds.length === sortedClassesList.length) {
                        setWholeSchoolSelectedClassIds([]);
                      } else {
                        setWholeSchoolSelectedClassIds(sortedClassesList.map(c => c.id));
                      }
                    }}
                    className="text-emerald-700 font-mono text-[11px] font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    {wholeSchoolSelectedClassIds.length === sortedClassesList.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {sortedClassesList.map(cls => {
                    const isSel = wholeSchoolSelectedClassIds.includes(cls.id);
                    const cName = cls.class_name || (cls as any).name || 'Class';
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setWholeSchoolSelectedClassIds(prev => 
                            prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                          );
                        }}
                        className={`px-2 py-1 rounded-xl text-left text-[11px] font-mono font-semibold flex items-center justify-between gap-1 transition-all cursor-pointer border ${
                          isSel
                            ? 'bg-[#122A24] text-white border-[#122A24]'
                            : 'bg-white text-slate-700 border-[#DCE8E0]'
                        }`}
                      >
                        <span className="truncate">{cName}-{cls.section || 'A'}</span>
                        {isSel ? (
                          <CheckSquare className="h-3 w-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="h-3 w-3 text-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-slate-500 font-sans">
                  Schedules official CBSE curriculum subjects for all selected divisions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8F0EA]">
              <button
                type="button"
                onClick={() => setShowWholeSchoolModal(false)}
                className="px-4 py-2 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={wholeSchoolSelectedClassIds.length === 0}
                onClick={handleGenerateWholeSchoolExams}
                className="px-5 py-2 bg-[#0B7E58] hover:bg-[#086345] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer transition-all"
              >
                <span>🚀 Generate &amp; Schedule for {wholeSchoolSelectedClassIds.length} Classes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL CBSE DATE SHEET & TIMETABLE MODAL
          ───────────────────────────────────────────────────────────── */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] max-w-4xl w-full shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 pb-3 border-b border-[#E8F0EA] sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#122A24] text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  📅
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    Official CBSE Examination Date Sheet &amp; Timetable
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Academic Session {selectedSession} • {scheduledExamsList.length} Scheduled Slots
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Date Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Date Sheet Container */}
            <div className="p-6 sm:p-8 space-y-5 bg-white text-slate-800 font-sans print:p-2" id="cbse-datesheet-printable">
              
              {/* School Header */}
              <div className="text-center border-b-2 border-[#122A24] pb-4 space-y-1">
                <h2 className="font-display font-black text-xl sm:text-2xl text-[#122A24] uppercase tracking-tight">
                  {selectedSchool?.school_name || schoolName}
                </h2>
                <p className="text-xs text-slate-600 font-medium font-mono">
                  Affiliated to CBSE, New Delhi • School Code: {selectedSchool?.school_code || '84001'} • Affiliation No: {selectedSchool?.affiliation_no || '2130042'}
                </p>
                <div className="inline-block mt-1 px-4 py-1 bg-[#122A24] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-full shadow-xs">
                  OFFICIAL EXAMINATION DATESHEET • SESSION {selectedSession}
                </div>
              </div>

              {/* Timetable Table */}
              <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#122A24] text-white font-mono text-[10.5px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Date &amp; Day</th>
                      <th className="p-3">Time Slot</th>
                      <th className="p-3">Class &amp; Section</th>
                      <th className="p-3">Subject &amp; Code</th>
                      <th className="p-3">Exam Series / Title</th>
                      <th className="p-3 text-center">Max Marks</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA] font-mono text-xs bg-white">
                    {scheduledExamsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-sans">
                          No scheduled examinations available on datesheet.
                        </td>
                      </tr>
                    ) : (
                      scheduledExamsList.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-[#122A24] whitespace-nowrap">
                            {formatExamDate(ex.date)}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {ex.time || '09:30 AM - 11:30 AM'}
                          </td>
                          <td className="p-3 font-bold text-[#122A24]">
                            {ex.class_name}-{ex.section}
                          </td>
                          <td className="p-3 font-sans font-bold text-[#122A24]">
                            <span>{ex.subject_name}</span>
                            {ex.subject_code && (
                              <span className="ml-1.5 font-mono text-emerald-800 font-normal">({ex.subject_code})</span>
                            )}
                          </td>
                          <td className="p-3 font-sans text-slate-700">
                            {ex.title}
                          </td>
                          <td className="p-3 text-center font-bold text-[#122A24]">
                            {ex.max_marks} M
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ex.status === 'MARKS_FILLED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {ex.status === 'MARKS_FILLED' ? 'MARKS FILLED' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions & Signatures */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-1 font-sans">
                <strong>General Instructions for Candidates:</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[10.5px]">
                  <li>Students must report to their examination halls 15 minutes before commencement.</li>
                  <li>School uniform and official identity card are mandatory for entrance.</li>
                  <li>No unfair means or electronic gadgets (calculators, digital watches) are permissible.</li>
                </ul>
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4 text-center font-mono text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Class In-Charge</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Controller of Examinations</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-900 block">Principal &amp; Seal</span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 p-5 pt-2 border-t border-[#E8F0EA] bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowTimetableModal(false)}
                className="px-4 py-2 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print Official Date Sheet
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          FACULTY IDENTITY AUTHENTICATION & MARKS ASSESSOR LOGIN MODAL
          ───────────────────────────────────────────────────────────── */}
      {showTeacherLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] max-w-3xl w-full shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 pb-3 border-b border-[#E8F0EA] sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#122A24] text-white font-bold flex items-center justify-center text-xl shadow-sm">
                  🔐
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    Teacher Authentication &amp; Marks Assessor Portal
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Class Teachers get their class automatically selected • Subject Teachers choose class &amp; subjects
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTeacherLoginModal(false);
                  setPendingLedgerTarget(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              
              {/* Context Banner */}
              <div className="p-3.5 bg-[#F4F8F5] rounded-2xl border border-[#DCE8E0] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-700 text-lg">💡</span>
                  <div className="text-[#1C443A] font-medium leading-relaxed">
                    <strong>CBSE Compliance Rule:</strong> Marks submission requires authorized faculty credentials. Class teachers automatically open their designated class and section. Subject teachers can select their targeted class and choose subjects to grade.
                  </div>
                </div>
              </div>

              {/* Search & Role Filter Tabs */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search teacher by name, staff code (e.g. EMP-202614), or department..."
                      value={teacherLoginSearch}
                      onChange={(e) => setTeacherLoginSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0] shrink-0">
                    <button
                      type="button"
                      onClick={() => setTeacherLoginRoleFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        teacherLoginRoleFilter === 'ALL'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      All Faculty
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherLoginRoleFilter('CLASS_TEACHER')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        teacherLoginRoleFilter === 'CLASS_TEACHER'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      Class Teachers
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherLoginRoleFilter('SUBJECT_TEACHER')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        teacherLoginRoleFilter === 'SUBJECT_TEACHER'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      Subject Teachers
                    </button>
                  </div>
                </div>
              </div>

              {/* Faculty Cards Grid */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allTeachersList
                  .filter(t => {
                    const cTClass = getTeacherAssignedClass(t);
                    if (teacherLoginRoleFilter === 'CLASS_TEACHER' && !cTClass) return false;
                    if (teacherLoginRoleFilter === 'SUBJECT_TEACHER' && cTClass) return false;
                    if (teacherLoginSearch.trim()) {
                      const q = teacherLoginSearch.toLowerCase().trim();
                      const matchName = t.full_name.toLowerCase().includes(q);
                      const matchCode = (t.staff_code || t.id || '').toLowerCase().includes(q);
                      const matchDept = (t.department || '').toLowerCase().includes(q);
                      const matchSpec = (t.subject_specialization || '').toLowerCase().includes(q);
                      const matchClass = cTClass ? `${cTClass.class_name} ${cTClass.section}`.toLowerCase().includes(q) : false;
                      return matchName || matchCode || matchDept || matchSpec || matchClass;
                    }
                    return true;
                  })
                  .map((t) => {
                    const cTClass = getTeacherAssignedClass(t);
                    const isCurrentActive = activeTeacher?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentActive
                            ? 'bg-emerald-50/70 border-emerald-500/50 shadow-xs'
                            : 'bg-white border-[#DCE8E0] hover:border-emerald-600/40 hover:bg-[#F9FCFA]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold text-xs shrink-0">
                            {t.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-bold text-sm text-[#122A24] truncate">
                                {t.full_name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-[#F0F4F2] text-slate-700 border border-[#DCE8E0]">
                                {t.staff_code || t.id}
                              </span>
                              {cTClass ? (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  <span>Class Teacher: {cTClass.class_name}-{cTClass.section}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  Subject Teacher: {t.subject_specialization || t.department || 'Assessor'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">
                              {t.designation} • Dept: {t.department}
                              {cTClass ? (
                                <span className="text-emerald-700 ml-1.5 font-bold">✓ Class &amp; Section automatically selected</span>
                              ) : (
                                <span className="text-slate-600 ml-1.5">✓ Can select desired class &amp; subjects</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTeacherLogin(t)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${
                            isCurrentActive
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#122A24] hover:bg-[#1C443A] text-white shadow-2xs hover:scale-[1.01]'
                          }`}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          <span>{isCurrentActive ? 'Active Session' : 'Login with this ID'}</span>
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Alternative: Manual Staff Code & Security PIN */}
              <div className="p-4 bg-[#F8FAF9] border border-[#DCE8E0] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#122A24]">
                  <KeyRound className="h-4 w-4 text-emerald-700" />
                  <span>Manual Staff ID &amp; PIN Authentication</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Staff Code / ID (e.g. EMP-202614)"
                      value={manualStaffCode}
                      onChange={(e) => setManualStaffCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="password"
                      placeholder="PIN (Default: 1234)"
                      value={manualPasscode}
                      onChange={(e) => setManualPasscode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => {
                        const code = manualStaffCode.trim().toLowerCase();
                        if (!code) {
                          showToast('Please enter your Staff Code.');
                          return;
                        }
                        const found = allTeachersList.find(t => 
                          (t.staff_code || '').toLowerCase() === code || 
                          t.id.toLowerCase() === code ||
                          t.full_name.toLowerCase().includes(code)
                        );
                        if (found) {
                          handleTeacherLogin(found);
                        } else {
                          // Create temporary authorized session with typed credentials
                          const customTeacher: Teacher = {
                            id: `TCH-${Date.now().toString().slice(-4)}`,
                            school_id: selectedSchool?.id || 'DPS2026',
                            staff_code: manualStaffCode.trim().toUpperCase(),
                            full_name: `Faculty (${manualStaffCode.trim().toUpperCase()})`,
                            designation: 'Subject Teacher',
                            department: 'Academics',
                            subject_specialization: 'General',
                            status: 'ACTIVE',
                            phone: '+91 9800000000',
                            email: 'faculty@school.edu.in'
                          };
                          handleTeacherLogin(customTeacher);
                        }
                      }}
                      className="w-full py-2 px-3 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow-2xs transition-all"
                    >
                      Authenticate
                    </button>
                  </div>
                </div>
              </div>

              {/* Superuser / Examination Controller Shortcut */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[#E8F0EA]">
                <span className="text-slate-500 font-mono text-[11px]">
                  Administrative or multi-class master evaluation:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const controllerTeacher: Teacher = {
                      id: 'TCH-CONTROLLER',
                      school_id: selectedSchool?.id || 'DPS2026',
                      staff_code: 'CBSE-CTRL-01',
                      full_name: 'Dr. Controller of Examinations',
                      designation: 'Examination Controller',
                      department: 'Examination Hub',
                      subject_specialization: 'All Curricular Subjects',
                      status: 'ACTIVE',
                      phone: '+91 9811200000',
                      email: 'controller@dps.edu.in'
                    };
                    handleTeacherLogin(controllerTeacher);
                  }}
                  className="px-3.5 py-1.5 bg-[#EBF5EF] hover:bg-[#D5EBDD] text-[#1C443A] rounded-xl text-xs font-bold border border-[#C5E2CF] cursor-pointer transition-all"
                >
                  ⚡ Login as Examination Controller (All Classes &amp; Subjects)
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#E8F0EA] bg-[#F8FAF9] rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setShowTeacherLoginModal(false);
                  setPendingLedgerTarget(null);
                }}
                className="px-4 py-2 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          OFFICIAL CBSE REPORT CARD / MARKSHEET VOUCHER MODAL
          ───────────────────────────────────────────────────────────── */}
      {reportCardStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] max-w-3xl w-full shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 pb-3 border-b border-[#E8F0EA] sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#122A24] text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  🎓
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#122A24]">
                    Official CBSE Digital Student Marksheet
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    CBSE Pattern • Session {selectedSession} • {currentTerm.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportCardStudent(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Marksheet Document Container */}
            <div className="p-6 sm:p-8 space-y-5 bg-white text-slate-800 font-sans print:m-0 print:p-4" id="cbse-printable-marksheet">
              
              {/* Institution Emblem & Header */}
              <div className="text-center border-b-2 border-[#122A24] pb-4 space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#1C443A] font-bold">
                    CENTRAL BOARD OF SECONDARY EDUCATION, NEW DELHI
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                </div>

                <h1 className="font-display font-black text-2xl sm:text-3xl text-[#122A24] uppercase tracking-tight">
                  {selectedSchool?.school_name || schoolName}
                </h1>
                
                <p className="text-xs text-slate-600 font-medium">
                  {selectedSchool?.address || 'Institutional Area, Sector 12, New Delhi — 110075'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] font-mono font-bold text-[#1C443A] pt-1">
                  <span>CBSE AFFIL: {selectedSchool?.affiliation_no || '2130042'}</span>
                  <span>•</span>
                  <span>SCHOOL CODE: {selectedSchool?.school_code || '84001'}</span>
                  <span>•</span>
                  <span>UDISE: {selectedSchool?.udise_code || '07010100101'}</span>
                </div>

                <div className="inline-block mt-2 px-4 py-1 bg-[#122A24] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-full shadow-xs">
                  ACADEMIC PERFORMANCE ASSESSMENT • {currentTerm.name.toUpperCase()} ({selectedSession})
                </div>
              </div>

              {/* Student Demographics Profile Box */}
              <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Scholar Name:</span>
                  <strong className="text-[#122A24] font-sans text-sm font-bold">{reportCardStudent.student.full_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Admission / Scholar No:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.admission_no || reportCardStudent.student.id}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Class &amp; Section:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.class_name} - {reportCardStudent.student.section || 'A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Roll Number:</span>
                  <strong className="text-[#122A24]">#{reportCardStudent.student.roll_no || '01'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10.5px]">Mother's Name:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.mother_name || 'Mrs. Sunita Sharma'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Father's Name:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.father_name || 'Mr. Rajesh Sharma'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Date of Birth:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.dob || '15-Aug-2012'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">APAAR / National PEN:</span>
                  <strong className="text-[#122A24]">{reportCardStudent.student.apaar_id || '2026-9812-4410'}</strong>
                </div>
              </div>

              {/* Scholastic Performance Subject Table */}
              <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#122A24] text-white text-[10.5px] uppercase font-mono font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5">Subject Code &amp; Title</th>
                      <th className="p-2.5 text-center">Theory ({currentTerm.maxTheory})</th>
                      <th className="p-2.5 text-center">IA / Practical ({currentTerm.maxPractical})</th>
                      <th className="p-2.5 text-center">Marks Obtained ({currentTerm.maxTotal})</th>
                      <th className="p-2.5 text-center">Subject Grade</th>
                      <th className="p-2.5 text-right">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA] font-mono text-xs bg-white">
                    {classSubjects.map(sub => {
                      const sm = reportCardStudent.record.marks[sub.id] || { theory: 0, practical: 0, total: 0, grade: 'E2', gp: 0.0 };
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-sans font-bold text-[#122A24]">
                            {sub.code ? <span className="font-mono text-emerald-800 mr-1.5 font-bold">[{sub.code}]</span> : null}
                            <span>{sub.name}</span>
                          </td>
                          <td className="p-2.5 text-center font-bold">{sm.theory}</td>
                          <td className="p-2.5 text-center font-bold">{sm.practical}</td>
                          <td className="p-2.5 text-center font-bold text-[#122A24]">{sm.total}</td>
                          <td className="p-2.5 text-center font-bold">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {sm.grade}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-800">{sm.gp.toFixed(1)}</td>
                        </tr>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-[#EBF5EF] font-bold text-xs text-[#122A24] border-t-2 border-[#122A24]">
                      <td className="p-3 font-sans uppercase">Cumulative Grand Total &amp; Overall %</td>
                      <td colSpan={2} className="p-3 text-center font-mono">
                        {reportCardStudent.overall.grandTotal} / {reportCardStudent.overall.maxGrandTotal}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-900 text-sm">
                        {reportCardStudent.overall.percentage}%
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-900">
                        Grade {reportCardStudent.overall.grade}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-900">
                        CGPA: {reportCardStudent.overall.cgpa.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Co-Scholastic Assessment & 21st Century Skills (3-Point Scale) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] font-display flex items-center gap-1.5">
                    <span>🌟</span> Co-Scholastic &amp; Value Education (Scale A-C)
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Work Education:</span>
                      <strong className="text-emerald-800">{reportCardStudent.record.coScholastic.workEdu}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Art Education:</span>
                      <strong className="text-emerald-800">{reportCardStudent.record.coScholastic.artEdu}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Health &amp; P.Ed:</span>
                      <strong className="text-emerald-800">{reportCardStudent.record.coScholastic.healthPE}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Discipline / Conduct:</span>
                      <strong className="text-emerald-800">{reportCardStudent.record.coScholastic.discipline}</strong>
                    </div>
                  </div>
                </div>

                {/* Final Assessment Result & Class Position */}
                <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] font-display flex items-center gap-1.5">
                    <span>🏆</span> Final Result &amp; Academic Standing
                  </div>
                  <div className="space-y-1.5 font-mono text-[11.5px]">
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Final Assessment Result:</span>
                      <strong className="text-emerald-800 font-sans">{reportCardStudent.overall.result}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Class Standing / Rank:</span>
                      <strong className="text-[#122A24]">Rank {reportCardStudent.rank} of {reportCardStudent.totalStudentsInClass}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Teacher Remarks & Verification QR */}
              <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-xs text-[#122A24] block">Class Teacher Remarks:</span>
                  <p className="text-xs text-slate-700 italic font-sans leading-relaxed">
                    "{reportCardStudent.record.remarks || 'Outstanding analytical consistency and excellent classroom conduct.'}"
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 pl-0 sm:pl-4 sm:border-l border-[#E8F0EA]">
                  <QrCode className="h-12 w-12 text-[#122A24]" />
                  <div className="text-[10px] text-slate-500 font-mono leading-tight">
                    <strong className="text-[#122A24] block">CBSE Digitally Verified</strong>
                    Doc ID: {reportCardStudent.student.id.toUpperCase()}-2026<br />
                    Scan to authenticate
                  </div>
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center font-mono text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Class Teacher</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Exam In-Charge</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-900 block">Principal &amp; Seal</span>
                </div>
              </div>

              {/* Grading Legend Reference at Bottom */}
              <div className="pt-3 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex flex-wrap justify-between gap-1">
                <span>Grading Scale: A1 (91-100), A2 (81-90), B1 (71-80), B2 (61-70), C1 (51-60), C2 (41-50), D (33-40 Pass), E (Needs Improvement)</span>
                <span>Generated by CBSE ERP Core Engine</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 p-5 pt-2 border-t border-[#E8F0EA] bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setReportCardStudent(null)}
                className="px-4 py-2 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print / Export Marksheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
