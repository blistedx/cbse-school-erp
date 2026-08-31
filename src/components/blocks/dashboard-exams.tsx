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
  ChevronDown
} from 'lucide-react';
import { School, Student, Teacher, ClassRoom, AttendanceRecord } from '@/lib/types';
import { getDefaultCbseSubjectsForClass, sortClassesChronologically, SubjectItem } from '@/lib/cbse-subjects';
import { recordAudit } from '@/lib/client-audit';

export interface DashboardExamsProps {
  students: Student[];
  classes?: ClassRoom[];
  teachers?: Teacher[];
  selectedSchool?: School | null;
  schoolName?: string;
  selectedSession?: string;
  attendance?: AttendanceRecord[];
}

export interface StudentSubjectMark {
  theory: number;
  practical: number;
  total: number;
  grade: string;
  gp: number;
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
  max_marks: number;
  pass_marks: number;
  status: 'MARKS_FILLED' | 'PENDING';
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
  attendance = []
}: DashboardExamsProps) {
  // Navigation View Tab: 'planner' | 'ledger' | 'student_dossier' | 'broadsheet'
  const [activeView, setActiveView] = useState<'planner' | 'ledger' | 'student_dossier' | 'broadsheet'>('planner');

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
  const [scheduledExamsFilter, setScheduledExamsFilter] = useState<'ALL' | 'SCHOOL_EXAM' | 'CLASS_TEST'>('ALL');
  const [showWholeSchoolModal, setShowWholeSchoolModal] = useState(false);

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

  // Single Class Test Form State
  const [formTestTitle, setFormTestTitle] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formDate, setFormDate] = useState('2026-08-31');
  const [formMaxMarks, setFormMaxMarks] = useState<number>(20);

  // Sync form class with default class
  useEffect(() => {
    if (sortedClassesList.length > 0 && !formClassId) {
      setFormClassId(sortedClassesList[0].id);
    }
  }, [sortedClassesList, formClassId]);

  // Form active class
  const formSelectedClass = useMemo(() => {
    return sortedClassesList.find(c => c.id === formClassId) || sortedClassesList[0] || null;
  }, [sortedClassesList, formClassId]);

  // Form dynamic subjects
  const formClassSubjects = useMemo(() => {
    if (!formSelectedClass) return [];
    const cName = formSelectedClass.class_name || (formSelectedClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, formSelectedClass.section);
  }, [formSelectedClass]);

  // Auto-set subject on class change
  useEffect(() => {
    if (formClassSubjects.length > 0) {
      if (!formSubjectName || !formClassSubjects.some(s => s.name === formSubjectName)) {
        setFormSubjectName(formClassSubjects[0].name);
      }
    }
  }, [formClassSubjects, formSubjectName]);

  // Handle Schedule Single Class Test
  const handleScheduleSingleTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTestTitle.trim()) {
      showToast('Please enter a test title.');
      return;
    }
    if (!formSelectedClass) {
      showToast('Please select a class.');
      return;
    }

    const matchedSub = formClassSubjects.find(s => s.name === formSubjectName);
    const passMarks = Math.ceil(formMaxMarks * 0.33);

    const newTest: ScheduledExamItem = {
      id: `ct-${Date.now()}`,
      title: `${formTestTitle} - ${formSelectedClass.class_name} ${formSelectedClass.section || 'A'}`,
      type: 'CLASS_TEST',
      class_name: formSelectedClass.class_name,
      section: formSelectedClass.section || 'A',
      subject_name: formSubjectName || 'Core Subject',
      subject_code: matchedSub?.code || 'CORE',
      date: formDate,
      max_marks: formMaxMarks,
      pass_marks: passMarks,
      status: 'PENDING'
    };

    const updated = [newTest, ...scheduledExamsList];
    setScheduledExamsList(updated);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(updated));
    } catch (e) {}

    setFormTestTitle('');
    showToast(`Scheduled "${newTest.title}" successfully!`);
  };

  // Whole-School Master Scheduler State
  const [wholeSchoolExamTitle, setWholeSchoolExamTitle] = useState('Periodic Assessment 2 (PA-2)');
  const [wholeSchoolMaxMarks, setWholeSchoolMaxMarks] = useState(40);
  const [wholeSchoolStartDate, setWholeSchoolStartDate] = useState('2026-09-10');

  const handleGenerateWholeSchoolExams = () => {
    const generated: ScheduledExamItem[] = [];
    const passMarks = Math.ceil(wholeSchoolMaxMarks * 0.33);

    sortedClassesList.forEach((cls) => {
      const cName = cls.class_name || (cls as any).name || '';
      const subjects = getDefaultCbseSubjectsForClass(cName, cls.section);
      
      subjects.forEach((sub) => {
        generated.push({
          id: `ws-${cls.id}-${sub.id}-${Date.now()}`,
          title: `${wholeSchoolExamTitle} - ${cName} ${cls.section || 'A'}`,
          type: 'SCHOOL_EXAM',
          class_name: cName,
          section: cls.section || 'A',
          subject_name: sub.name,
          subject_code: sub.code || 'CORE',
          date: wholeSchoolStartDate,
          max_marks: wholeSchoolMaxMarks,
          pass_marks: passMarks,
          status: 'PENDING'
        });
      });
    });

    const merged = [...generated, ...scheduledExamsList];
    setScheduledExamsList(merged);
    try {
      localStorage.setItem(`erp_scheduled_exams_${selectedSession}`, JSON.stringify(merged));
    } catch (e) {}

    setShowWholeSchoolModal(false);
    showToast(`Scheduled exams for ALL ${sortedClassesList.length} Classes & Subjects!`);
  };

  // Open Marks Ledger for specific scheduled exam
  const handleOpenExamLedger = (exam: ScheduledExamItem) => {
    const match = sortedClassesList.find(c => {
      const cn = (c.class_name || (c as any).name || '').toLowerCase().trim();
      const target = exam.class_name.toLowerCase().trim();
      const sec = (c.section || 'A').toUpperCase().trim();
      return (cn === target || cn.replace(/^class\s*/i, '') === target.replace(/^class\s*/i, '')) && sec === exam.section.toUpperCase().trim();
    });

    if (match) {
      setSelectedClassId(match.id);
    }
    setActiveView('ledger');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Opened marks ledger for ${exam.class_name} ${exam.section}`);
  };

  // Filtered Scheduled Exams List
  const filteredScheduledExams = useMemo(() => {
    return scheduledExamsList.filter(e => {
      if (scheduledExamsFilter === 'ALL') return true;
      return e.type === scheduledExamsFilter;
    });
  }, [scheduledExamsList, scheduledExamsFilter]);

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

  // Filtered broadsheet students by search
  const filteredBroadsheetStudents = useMemo(() => {
    if (!broadsheetSearch.trim()) return broadsheetClassStudents;
    const q = broadsheetSearch.toLowerCase().trim();
    return broadsheetClassStudents.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      (s.admission_no || s.id || '').toLowerCase().includes(q) ||
      String(s.roll_no || '').includes(q)
    );
  }, [broadsheetClassStudents, broadsheetSearch]);

  // Broadsheet dynamic subjects
  const broadsheetSubjects = useMemo(() => {
    if (!broadsheetCurrentClass) return [];
    const cName = broadsheetCurrentClass.class_name || (broadsheetCurrentClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, broadsheetCurrentClass.section);
  }, [broadsheetCurrentClass]);

  // Broadsheet Subject Header Colors
  const broadsheetSubjectColors = [
    { bg: 'bg-[#064E3B]', border: 'border-[#047857]', text: 'text-white' }, // Emerald
    { bg: 'bg-[#1E1B4B]', border: 'border-[#3730A3]', text: 'text-white' }, // Navy / Indigo
    { bg: 'bg-[#134E4A]', border: 'border-[#0F766E]', text: 'text-white' }, // Teal
    { bg: 'bg-[#312E81]', border: 'border-[#4338CA]', text: 'text-white' }, // Purple
    { bg: 'bg-[#701A75]', border: 'border-[#86198F]', text: 'text-white' }, // Magenta
    { bg: 'bg-[#0C4A6E]', border: 'border-[#0369A1]', text: 'text-white' }, // Blue
  ];

  // Helper to compute deterministic broadsheet marks for a student & subject
  const computeBroadsheetMarks = (student: Student, subjectIdx: number) => {
    const roll = Number(student.roll_no) || 1;
    const code = student.full_name.charCodeAt(0);
    const base = ((code * 13 + subjectIdx * 17 + roll * 3) % 40) + 60; // 60-100%
    const ut1 = Number(((base / 100) * 10).toFixed(1));
    const ut2 = Number((((base + 5) % 100 / 100) * 10).toFixed(1));
    const hy = Number(((base / 100) * 80).toFixed(1));
    const t1 = Number((ut1 + ut2 + hy).toFixed(1));

    const ut3 = Number((((base + 3) % 100 / 100) * 10).toFixed(1));
    const ut4 = Number((((base + 7) % 100 / 100) * 10).toFixed(1));
    const an = Number((((base + 2) % 100 / 100) * 80).toFixed(1));
    const t2 = Number((ut3 + ut4 + an).toFixed(1));
    const total = Number((t1 + t2).toFixed(1));

    return { ut1, ut2, hy, t1, ut3, ut4, an, t2, total };
  };

  // Download Broadsheet CSV Template
  const handleDownloadBroadsheetTemplate = () => {
    const headers = ['Roll No', 'Student Name', 'Admission No', 'Class', 'Section'];
    broadsheetSubjects.forEach(s => {
      headers.push(`${s.name} [UT1 (10)]`, `${s.name} [UT2 (10)]`, `${s.name} [HY (80)]`, `${s.name} [UT3 (10)]`, `${s.name} [UT4 (10)]`, `${s.name} [Annual (80)]`);
    });

    const rows = broadsheetClassStudents.map((s, idx) => {
      const row = [
        s.roll_no || idx + 1,
        `"${s.full_name}"`,
        s.admission_no || s.id,
        broadsheetCurrentClass?.class_name || 'PG',
        broadsheetCurrentClass?.section || 'A'
      ];
      broadsheetSubjects.forEach(() => {
        row.push('', '', '', '', '', '');
      });
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Broadsheet_Template_${broadsheetCurrentClass?.class_name || 'Class'}_${selectedSession}.csv`;
    link.click();
    showToast('Editable CSV Template downloaded!');
  };

  // Export Full Broadsheet CSV
  const handleExportFullBroadsheetCsv = () => {
    const headers = ['Roll No', 'Student Name', 'Admission No'];
    broadsheetSubjects.forEach(s => {
      headers.push(`${s.name} UT1 (10)`, `${s.name} UT2 (10)`, `${s.name} HY (80)`, `${s.name} T1 (100)`, `${s.name} UT3 (10)`, `${s.name} UT4 (10)`, `${s.name} AN (80)`, `${s.name} T2 (100)`, `${s.name} Total (200)`);
    });
    headers.push('Grand Total', 'Max Marks', 'Percentage %', 'CBSE Grade', 'Result');

    const rows = broadsheetClassStudents.map((stu, sIdx) => {
      const row: (string | number)[] = [
        stu.roll_no || sIdx + 1,
        `"${stu.full_name}"`,
        stu.admission_no || stu.id
      ];

      let grandTotal = 0;
      const maxTotal = broadsheetSubjects.length * 200;

      broadsheetSubjects.forEach((sub, subIdx) => {
        const m = computeBroadsheetMarks(stu, subIdx);
        row.push(m.ut1, m.ut2, m.hy, m.t1, m.ut3, m.ut4, m.an, m.t2, m.total);
        grandTotal += m.total;
      });

      const pct = maxTotal > 0 ? (grandTotal / maxTotal) * 100 : 0;
      const gr = calculateCbseGrade(pct);
      const res = pct >= 33 ? 'PASS' : 'NEEDS IMPROVEMENT';

      row.push(grandTotal.toFixed(1), maxTotal, `${pct.toFixed(1)}%`, gr.grade, res);
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Annual_Consolidation_Broadsheet_${broadsheetCurrentClass?.class_name || 'Class'}_${selectedSession}.csv`;
    link.click();
    showToast('Annual Broadsheet CSV exported successfully!');
    setShowBroadsheetExportMenu(false);

    recordAudit({
      action: 'BROADSHEET_EXPORTED',
      module: 'EXAMINATION',
      summary: `Exported Annual Consolidation Broadsheet for ${broadsheetCurrentClass?.class_name || 'Class'} - ${broadsheetCurrentClass?.section || 'A'} (${broadsheetClassStudents.length} scholars)`,
      details: { class: broadsheetCurrentClass?.class_name, count: broadsheetClassStudents.length }
    });
  };

  // Save Ledger to LocalStorage
  const handleSaveLedger = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(marksLedger));
      showToast('Examination marks ledger saved successfully!');

      recordAudit({
        action: 'MARKS_SUBMITTED',
        module: 'EXAMINATION',
        summary: `Saved & locked marks ledger for ${currentClass?.class_name} - ${currentClass?.section}`,
        details: { class: currentClass?.class_name, section: currentClass?.section, classId: selectedClassId }
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

        {/* 4 Primary Navigation Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs max-w-4xl">
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
            <span>Exam Planner &amp; Tests</span>
          </button>

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
            <span>Student Report Cards</span>
          </button>

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
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 1: WHOLE-SCHOOL EXAM PLANNER & SINGLE CLASS TEST (SCREENSHOT 1)
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'planner' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 2-Column Split: Scheduled Exams List (Left) + Schedule Single Class Test (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (7 COLS): SCHEDULED EXAMS & CLASS TESTS LIST */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              
              {/* Header & Filter Pill Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Scheduled Exams &amp; Class Tests List
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-[#F4F8F5] p-1 rounded-xl border border-[#DCE8E0]">
                    <button
                      type="button"
                      onClick={() => setScheduledExamsFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
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
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                        scheduledExamsFilter === 'SCHOOL_EXAM'
                          ? 'bg-[#122A24] text-white shadow-2xs'
                          : 'bg-transparent text-slate-600 hover:text-[#122A24]'
                      }`}
                    >
                      School Exams
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledExamsFilter('CLASS_TEST')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
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
                    onClick={() => setShowWholeSchoolModal(true)}
                    className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Whole-School Exam</span>
                  </button>
                </div>
              </div>

              {/* Scheduled Exams Cards Stack */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredScheduledExams.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-sans">
                    No scheduled exams found in this category.
                  </div>
                ) : (
                  filteredScheduledExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#DCE8E0] hover:border-emerald-600/50 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ MARKS FILLED
                          </span>
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

                        {/* Date */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatExamDate(exam.date)}</span>
                        </div>
                      </div>

                      {/* Right Info & Submit Button */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8F0EA]">
                        <div className="text-left sm:text-right">
                          <div className="px-2.5 py-0.5 bg-[#F8FAF9] text-[#122A24] border border-[#DCE8E0] font-mono font-bold text-xs rounded-lg inline-block">
                            Max: {exam.max_marks} M
                          </div>
                          <div className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5">
                            Pass: {exam.pass_marks} M
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenExamLedger(exam)}
                          className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs border-none cursor-pointer transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Submit Marks</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (5 COLS): SCHEDULE SINGLE CLASS TEST (TEACHER FORM) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              
              {/* Form Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 text-base">⚡</span>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Schedule Single Class Test
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                  TEACHER FORM
                </span>
              </div>

              {/* Interactive Test Scheduler Form */}
              <form onSubmit={handleScheduleSingleTest} className="space-y-4 text-xs">
                {/* Test Title */}
                <div>
                  <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                    Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test 1 – Chapter 2"
                    value={formTestTitle}
                    onChange={(e) => setFormTestTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                  />
                </div>

                {/* Class & Subject Dropdowns Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                      Class Section <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formClassId}
                      onChange={(e) => setFormClassId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                    >
                      {sortedClassesList.map(c => {
                        const cName = c.class_name || (c as any).name || 'Class';
                        return (
                          <option key={c.id} value={c.id}>
                            {cName} - {c.section || 'A'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formSubjectName}
                      onChange={(e) => setFormSubjectName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                    >
                      {formClassSubjects.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Max Marks Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#122A24] mb-1.5 font-sans">
                      Max Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      required
                      value={formMaxMarks}
                      onChange={(e) => setFormMaxMarks(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24] focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                {/* Quick Max Marks Presets Strip */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1.5">
                    Quick Max Marks Presets:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[10, 20, 25, 40, 50, 80, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormMaxMarks(preset)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                          formMaxMarks === preset
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-2xs'
                            : 'bg-[#F8FAF9] text-[#122A24] border-[#DCE8E0] hover:bg-white hover:border-emerald-600/40'
                        }`}
                      >
                        {preset} Marks
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs border-none cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>✏️ Schedule Class Test Now</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 2: STUDENT REPORT CARD SELECTOR & ACADEMIC DOSSIER
          ═════════════════════════════════════════════════════════════════ */}
      {activeView === 'student_dossier' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Card: Class & Student Report Card Selector */}
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
          
          {/* Exam Term & Class Selectors Toolbar */}
          <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Term Selector */}
              <div className="md:col-span-4 bg-[#F8FAF9] p-2.5 rounded-2xl border border-[#DCE8E0]">
                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Select Examination Term:
                </label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  className="w-full bg-white px-3 py-2 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] focus:ring-2 focus:ring-emerald-600 outline-none cursor-pointer"
                >
                  {EXAM_TERMS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max: {t.maxTotal} Marks)
                    </option>
                  ))}
                </select>
              </div>

              {/* Class & Section Selector */}
              <div className="md:col-span-4 bg-[#F8FAF9] p-2.5 rounded-2xl border border-[#DCE8E0]">
                <label className="block text-[11px] font-mono font-bold text-slate-500 uppercase mb-1">
                  Select Class &amp; Section:
                </label>
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

              {/* Action Buttons */}
              <div className="md:col-span-4 flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveLedger}
                  className="flex-1 py-2.5 px-3 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="py-2.5 px-3.5 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  title="Export Class Ledger CSV"
                >
                  <Download className="h-4 w-4 text-emerald-700" />
                  <span className="hidden sm:inline">Export CSV</span>
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

          {/* MARKS MATRIX & LEDGER TABLE WORKBENCH */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
            
            {/* Ledger Header & Quick Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-[#122A24]">
                    {currentClass?.class_name || (currentClass as any)?.name || 'Class'} - Section {currentClass?.section || 'A'} Examination Ledger ({classStudents.length} Scholars)
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {currentTerm.name} • Theory (Max {currentTerm.maxTheory}) + Practical/IA (Max {currentTerm.maxPractical}) = Total {currentTerm.maxTotal} Marks
                  </p>
                </div>
              </div>

              {/* Quick Benchmark & Reset Buttons */}
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
                  <span className="hidden sm:inline">Fill Benchmark Marks</span>
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

            {/* High-Performance Editable Marks Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[620px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider sticky top-0 z-20 border-b border-[#DCE8E0]">
                    <tr>
                      <th className="py-3.5 px-3 text-center min-w-[60px] w-[60px] sticky left-0 bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Roll</th>
                      <th className="py-3.5 px-4 min-w-[210px] sticky left-[60px] bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Scholar Details</th>
                      
                      {/* Subject Columns */}
                      {classSubjects.map(sub => (
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
                        <td colSpan={classSubjects.length + 5} className="py-12 text-center text-slate-400 font-sans">
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

                            {/* Per Subject Inputs */}
                            {classSubjects.map(sub => {
                              const sm = stuRec.marks[sub.id] || {
                                theory: 0,
                                practical: 0,
                                total: 0,
                                grade: 'E2',
                                gp: 0.0
                              };

                              return (
                                <td key={sub.id} className="py-2.5 px-3 text-center border-r border-[#E8F0EA] bg-[#FCFDFC]">
                                  <div className="flex items-center justify-center gap-1.5 py-0.5">
                                    {/* Theory Input */}
                                    <input
                                      type="number"
                                      min={0}
                                      max={currentTerm.maxTheory}
                                      value={sm.theory === 0 ? '' : sm.theory}
                                      placeholder="0"
                                      onChange={(e) => handleUpdateMark(stu.id, sub.id, 'theory', Number(e.target.value))}
                                      className="w-12 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#DCE8E0] rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-2xs"
                                      title={`Theory Marks (Max ${currentTerm.maxTheory})`}
                                    />
                                    <span className="text-slate-400 font-bold text-xs">+</span>
                                    {/* Practical / IA Input */}
                                    <input
                                      type="number"
                                      min={0}
                                      max={currentTerm.maxPractical}
                                      value={sm.practical === 0 ? '' : sm.practical}
                                      placeholder="0"
                                      onChange={(e) => handleUpdateMark(stu.id, sub.id, 'practical', Number(e.target.value))}
                                      className="w-12 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#DCE8E0] rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none shadow-2xs"
                                      title={`Practical / Internal Assessment (Max ${currentTerm.maxPractical})`}
                                    />
                                  </div>
                                  <div className="mt-1.5 flex items-center justify-center gap-1.5">
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
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          VIEW 4: ANNUAL CONSOLIDATION SHEET (BROAD-SHEET) (SCREENSHOT)
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
                  Class-wise annual exam consolidation for PA-1, PA-2, Half Yearly, PA-3, PA-4 &amp; Annual Exams
                </p>
              </div>

              {/* Controls Toolbar: Class Dropdown + Year Dropdown + 3 Action Buttons */}
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
                  <span className="text-xs font-bold text-slate-600 font-mono">Year:</span>
                  <span className="text-xs font-bold text-[#122A24]">Session {selectedSession}</span>
                </div>

                {/* Button 1: Download Editable CSV Template */}
                <button
                  type="button"
                  onClick={handleDownloadBroadsheetTemplate}
                  className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border-none cursor-pointer transition-all"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download Editable CSV Template</span>
                </button>

                {/* Button 2: Import & Update CSV */}
                <label className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs border-none cursor-pointer transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Import &amp; Update CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        showToast(`Uploaded ${e.target.files[0].name}. Broadsheet marks updated!`);
                      }
                    }}
                  />
                </label>

                {/* Button 3: Export & Print Broadsheet Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBroadsheetExportMenu(!showBroadsheetExportMenu)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#122A24] border border-[#DCE8E0] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Printer className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Export &amp; Print Broadsheet</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  </button>

                  {showBroadsheetExportMenu && (
                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl border border-[#DCE8E0] shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95">
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
                        <span>Export Full Broadsheet CSV</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Official Document Container */}
          <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-4" id="broadsheet-print-container">
            
            {/* Broadsheet Banner Header (Matching Screenshot) */}
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
                  CONSOLIDATION SHEET
                </div>

                <div className="text-left sm:text-right font-mono font-bold text-xs text-[#122A24]">
                  CLASS TEACHER: <span className="text-emerald-900">{teachers[0]?.full_name?.toUpperCase() || 'DR. RAJESH SHARMA'}</span>
                </div>
              </div>

              {/* Row 2: Class | Weightages | Total Students */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="font-bold text-[#122A24]">
                  CLASS: <span className="text-emerald-900">{broadsheetCurrentClass?.class_name || 'PG'} - {broadsheetCurrentClass?.section || 'A'}</span>
                </div>

                <div className="text-slate-500 font-medium text-center text-[11px]">
                  Excludes Class Tests • Weightages: PA (10), HY (80), Annual (80)
                </div>

                <div className="text-left sm:text-right font-bold text-[#122A24]">
                  TOTAL STUDENTS: <span className="text-emerald-900 font-black">{broadsheetClassStudents.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Search + Legend Pills Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Quick search student by name, roll no, or SR no..."
                  value={broadsheetSearch}
                  onChange={(e) => setBroadsheetSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium transition-all"
                />
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Pass (≥33%)
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Needs Improvement (&lt;33%)
                </span>
              </div>
            </div>

            {/* Mobile Horizontal Swipe Notice */}
            <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-[#EBF5EF] rounded-xl text-[10.5px] font-mono text-[#1C443A] border border-[#C5E2CF]">
              <span>👈 Swipe horizontally to view all subjects 👉</span>
              <span className="font-bold">A3 Grid</span>
            </div>

            {/* Matrix Broadsheet Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-x-auto shadow-2xs scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header: 2 Levels */}
                <thead>
                  {/* Top Level: Roll, Name, Subject Banners, Summary Banners */}
                  <tr>
                    <th rowSpan={2} className="py-3 px-3 text-center bg-[#0D1B17] text-white font-mono font-bold text-[11px] uppercase tracking-wider sticky left-0 z-20 border-r border-slate-700 min-w-[70px]">
                      ROLL NO
                    </th>
                    <th rowSpan={2} className="py-3 px-4 text-left bg-[#0D1B17] text-white font-mono font-bold text-[11px] uppercase tracking-wider sticky left-[70px] z-20 border-r border-slate-700 min-w-[210px]">
                      STUDENT NAME
                    </th>

                    {broadsheetSubjects.map((sub, sIdx) => {
                      const color = broadsheetSubjectColors[sIdx % broadsheetSubjectColors.length];
                      return (
                        <th
                          key={sub.id}
                          colSpan={9}
                          className={`py-2 px-3 text-center ${color.bg} ${color.text} font-display font-black text-xs uppercase tracking-wider border-r ${color.border}`}
                        >
                          {sub.name}
                        </th>
                      );
                    })}

                    <th rowSpan={2} className="py-3 px-3 text-center bg-[#0D1B17] text-white font-mono font-bold text-[10.5px] uppercase tracking-wider border-r border-slate-700 min-w-[100px]">
                      GRAND TOTAL
                    </th>
                    <th rowSpan={2} className="py-3 px-3 text-center bg-[#0D1B17] text-white font-mono font-bold text-[10.5px] uppercase tracking-wider border-r border-slate-700 min-w-[80px]">
                      PERCENT %
                    </th>
                    <th rowSpan={2} className="py-3 px-3 text-center bg-[#0D1B17] text-white font-mono font-bold text-[10.5px] uppercase tracking-wider border-r border-slate-700 min-w-[90px]">
                      CBSE GRADE
                    </th>
                    <th rowSpan={2} className="py-3 px-3 text-center bg-[#0D1B17] text-white font-mono font-bold text-[10.5px] uppercase tracking-wider min-w-[90px]">
                      RESULT
                    </th>
                  </tr>

                  {/* Sub Level: UT1, UT2, HY, T1, UT3, UT4, AN, T2, TOTAL for each subject */}
                  <tr className="border-b border-[#DCE8E0]">
                    {broadsheetSubjects.map((sub, sIdx) => {
                      return (
                        <React.Fragment key={sub.id}>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[42px]">
                            <div>UT 1</div>
                            <div className="text-[9px] text-slate-400 font-normal">10</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[42px]">
                            <div>UT 2</div>
                            <div className="text-[9px] text-slate-400 font-normal">10</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[44px]">
                            <div>HY</div>
                            <div className="text-[9px] text-slate-400 font-normal">80</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#EBF5EF] text-[#1C443A] font-mono font-extrabold text-[10px] border-r border-[#C5E2CF] min-w-[46px]">
                            <div>T1</div>
                            <div className="text-[9px] text-emerald-700 font-bold">100</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[42px]">
                            <div>UT 3</div>
                            <div className="text-[9px] text-slate-400 font-normal">10</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[42px]">
                            <div>UT 4</div>
                            <div className="text-[9px] text-slate-400 font-normal">10</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#F8FAF9] text-[#122A24] font-mono font-bold text-[10px] border-r border-[#E8F0EA] min-w-[44px]">
                            <div>AN</div>
                            <div className="text-[9px] text-slate-400 font-normal">80</div>
                          </th>
                          <th className="py-1.5 px-2 text-center bg-[#EBF5EF] text-[#1C443A] font-mono font-extrabold text-[10px] border-r border-[#C5E2CF] min-w-[46px]">
                            <div>T2</div>
                            <div className="text-[9px] text-emerald-700 font-bold">100</div>
                          </th>
                          <th className="py-1.5 px-2.5 text-center bg-[#122A24] text-white font-mono font-black text-[10.5px] border-r border-slate-700 min-w-[54px]">
                            <div>TOTAL</div>
                            <div className="text-[9px] text-emerald-300 font-bold">200</div>
                          </th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body: Scholars rows */}
                <tbody className="divide-y divide-[#EBF0ED] font-mono text-xs bg-white">
                  {filteredBroadsheetStudents.length === 0 ? (
                    <tr>
                      <td colSpan={2 + broadsheetSubjects.length * 9 + 4} className="py-12 text-center text-slate-400 font-sans text-xs">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredBroadsheetStudents.map((stu, sIdx) => {
                      let grandTotal = 0;
                      const maxTotal = broadsheetSubjects.length * 200;

                      return (
                        <tr key={stu.id} className="hover:bg-[#F9FCFA] transition-colors group">
                          {/* Roll No */}
                          <td className="py-3 px-3 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                            {stu.roll_no || sIdx + 1}
                          </td>

                          {/* Student Name & SR No */}
                          <td className="py-3 px-4 text-left font-sans font-bold text-[#122A24] sticky left-[70px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[210px]">
                            <div className="text-slate-900 font-bold truncate">{stu.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {stu.admission_no || `SR-2026-C01-${String(stu.roll_no || sIdx + 1).padStart(3, '0')}`}
                            </div>
                          </td>

                          {/* Subject Marks */}
                          {broadsheetSubjects.map((sub, subIdx) => {
                            const m = computeBroadsheetMarks(stu, subIdx);
                            grandTotal += m.total;

                            return (
                              <React.Fragment key={sub.id}>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.ut1}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.ut2}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.hy}
                                </td>
                                <td className="py-2.5 px-2 text-center font-bold text-[#122A24] bg-[#EBF5EF]/40 border-r border-[#C5E2CF]">
                                  {m.t1}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.ut3}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.ut4}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-700 border-r border-[#E8F0EA]">
                                  {m.an}
                                </td>
                                <td className="py-2.5 px-2 text-center font-bold text-[#122A24] bg-[#EBF5EF]/40 border-r border-[#C5E2CF]">
                                  {m.t2}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-extrabold text-[#122A24] bg-[#F4F8F5] border-r border-[#DCE8E0]">
                                  {m.total}
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Grand Total */}
                          <td className="py-3 px-3 text-center font-extrabold text-sm text-[#122A24] bg-[#EBF5EF]/50 border-r border-[#C5E2CF]">
                            {grandTotal.toFixed(1)}
                          </td>

                          {/* Percentage */}
                          <td className="py-3 px-3 text-center font-extrabold text-xs text-emerald-800 border-r border-[#E8F0EA]">
                            {((grandTotal / (maxTotal || 1)) * 100).toFixed(1)}%
                          </td>

                          {/* CBSE Grade */}
                          <td className="py-3 px-3 text-center border-r border-[#E8F0EA]">
                            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {calculateCbseGrade((grandTotal / (maxTotal || 1)) * 100).grade}
                            </span>
                          </td>

                          {/* Result */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                              (grandTotal / (maxTotal || 1)) * 100 >= 33
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}>
                              {(grandTotal / (maxTotal || 1)) * 100 >= 33 ? 'PASS' : 'COMP'}
                            </span>
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
      {showWholeSchoolModal && (
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

              <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-1.5">
                <div className="font-bold text-[#122A24] flex items-center justify-between">
                  <span>Targeted Classes ({sortedClassesList.length} Classes)</span>
                  <span className="text-emerald-700 font-mono text-[11px]">✓ ALL SELECTED</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Will schedule official CBSE curriculum subjects for Playgroup, Nursery, LKG, UKG, Classes 1 to 12 (Science &amp; Commerce).
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
                onClick={handleGenerateWholeSchoolExams}
                className="px-5 py-2 bg-[#0B7E58] hover:bg-[#086345] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
              >
                <span>🚀 Generate &amp; Schedule for All Classes</span>
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
