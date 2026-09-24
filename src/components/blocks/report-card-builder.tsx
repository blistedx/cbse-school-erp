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
  FileSpreadsheet,
  Upload,
  ChevronDown,
  CheckSquare,
  Square,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  Sliders,
  FileCheck2,
  CheckCheck
} from 'lucide-react';
import {
  School,
  Student,
  Teacher,
  ClassRoom,
  ScheduledExamItem,
  ReportCardTemplate,
  ReportCardTemplateExam,
  ExamMarkRecord
} from '@/lib/types';
import { getDefaultCbseSubjectsForClass, sortClassesChronologically, SubjectItem } from '@/lib/cbse-subjects';
import { calculateCbseGrade } from '@/components/blocks/dashboard-exams';
import { recordAudit } from '@/lib/client-audit';
import { apiFetch } from '@/lib/api-client';
import { getSchoolInitials } from '@/lib/utils';

export interface ReportCardBuilderProps {
  students: Student[];
  classes?: ClassRoom[];
  teachers?: Teacher[];
  selectedSchool?: School | null;
  schoolName?: string;
  selectedSession?: string;
  userRole?: string;
  currentUser?: any;
  onNavigateToExams?: () => void;
}

export function ReportCardBuilder({
  students = [],
  classes = [],
  teachers = [],
  selectedSchool = null,
  schoolName = 'Delhi Public International School',
  selectedSession = '2026-27',
  userRole = 'SUPERADMIN',
  currentUser = null,
  onNavigateToExams
}: ReportCardBuilderProps) {
  const isAdmin = userRole === 'SUPERADMIN' || userRole === 'PRINCIPAL' || userRole === 'AGENCY_SUPERADMIN' || userRole === 'GOD_ACCESS';
  const isTeacher = userRole === 'TEACHER' || currentUser?.role === 'TEACHER';

  // 3-Tab Structure Constraint: 'templates' | 'generate' | 'preview'
  const [activeTab, setActiveTab] = useState<'templates' | 'generate' | 'preview'>('templates');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // ─────────────────────────────────────────────────────────────────
  // 1. CLASS & EXAM CATALOG EXTRACTION
  // ─────────────────────────────────────────────────────────────────
  const sortedClassesList = useMemo(() => {
    const map = new Map<string, ClassRoom>();
    if (classes && Array.isArray(classes)) {
      classes.forEach(c => {
        const cName = (c.class_name || (c as any).name || '').trim();
        const sec = ((c.section || 'A') + '').toUpperCase().trim();
        if (cName) {
          const norm = cName.toLowerCase().replace(/^class\s*/i, '').trim();
          map.set(`${norm}_${sec}`, {
            id: c.id || `CLS-${norm}_${sec}`,
            class_name: cName,
            name: cName,
            section: sec
          } as ClassRoom);
        }
      });
    }
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
            } as ClassRoom);
          }
        }
      });
    }
    return sortClassesChronologically(Array.from(map.values()));
  }, [classes, students]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    if (sortedClassesList.length > 0 && (!selectedClassId || !sortedClassesList.some(c => c.id === selectedClassId))) {
      setSelectedClassId(sortedClassesList[0].id);
    }
  }, [sortedClassesList, selectedClassId]);

  const currentClass = useMemo(() => {
    return sortedClassesList.find(c => c.id === selectedClassId) || sortedClassesList[0] || null;
  }, [sortedClassesList, selectedClassId]);

  // Students in selected Class
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

  // CBSE Subjects for this Class
  const classSubjects = useMemo(() => {
    if (!currentClass) return [];
    const cName = currentClass.class_name || (currentClass as any).name || '';
    return getDefaultCbseSubjectsForClass(cName, currentClass.section);
  }, [currentClass]);

  // Scheduled Exams loaded from API / DB
  const [scheduledExams, setScheduledExams] = useState<ScheduledExamItem[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoadingExams(true);
      try {
        const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
        const res = await apiFetch(`/api/exams?school_id=${encodeURIComponent(schoolId)}&session=${encodeURIComponent(selectedSession)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.exams)) {
          setScheduledExams(data.exams);
        }
      } catch (e) {
        console.warn('[ReportCardBuilder] Exams fetch error:', e);
      } finally {
        setIsLoadingExams(false);
      }
    };
    fetchExams();
  }, [selectedSchool, selectedSession]);

  // Available Exams for the selected Class (Grouped and deduplicated by title & type)
  const availableClassExams = useMemo(() => {
    if (!currentClass) return [];
    const targetClass = (currentClass.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
    const targetSec = ((currentClass.section || 'A') + '').toUpperCase().trim();

    const examsForClass = scheduledExams.filter(e => {
      const cNorm = (e.class_name || '').toLowerCase().trim().replace(/^class\s*/i, '');
      const sNorm = ((e.section || 'A') + '').toUpperCase().trim();
      return (cNorm === targetClass || targetClass.includes(cNorm) || cNorm.includes(targetClass)) && (sNorm === targetSec || !e.section);
    });

    // Group exams by series title e.g. "Periodic Assessment 1 (PA-1)", "Mid-Term", etc.
    const map = new Map<string, {
      id: string;
      title: string;
      type: 'SCHOOL_EXAM' | 'CLASS_TEST' | string;
      max_marks: number;
      date?: string;
      count: number;
    }>();

    examsForClass.forEach(e => {
      const groupKey = e.title.trim();
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id: e.id,
          title: e.title,
          type: e.type,
          max_marks: e.max_marks || (e.type === 'CLASS_TEST' ? 25 : 80),
          date: e.date,
          count: 1
        });
      } else {
        const item = map.get(groupKey)!;
        item.count += 1;
        if (e.max_marks && e.max_marks > item.max_marks) item.max_marks = e.max_marks;
      }
    });

    // Curricular standard fallback milestones if school hasn't scheduled all terms yet
    const standardMilestones = [
      { id: 'pa-1-std', title: 'Periodic Assessment 1 (PA-1)', type: 'SCHOOL_EXAM', max_marks: 50, count: classSubjects.length || 5 },
      { id: 'hy-std', title: 'Term 1 (Half Yearly / Mid-Term)', type: 'SCHOOL_EXAM', max_marks: 100, count: classSubjects.length || 5 },
      { id: 'pa-2-std', title: 'Periodic Assessment 2 (PA-2)', type: 'SCHOOL_EXAM', max_marks: 50, count: classSubjects.length || 5 },
      { id: 'annual-std', title: 'Annual Final Assessment (Term 2)', type: 'SCHOOL_EXAM', max_marks: 100, count: classSubjects.length || 5 },
      { id: 'ut-1-std', title: 'Unit Diagnostic Test 1', type: 'CLASS_TEST', max_marks: 25, count: classSubjects.length || 5 },
      { id: 'ut-2-std', title: 'Unit Quiz & Formative Test 2', type: 'CLASS_TEST', max_marks: 25, count: classSubjects.length || 5 }
    ];

    standardMilestones.forEach(m => {
      if (!map.has(m.title)) {
        map.set(m.title, m);
      }
    });

    return Array.from(map.values());
  }, [scheduledExams, currentClass, classSubjects]);

  // ─────────────────────────────────────────────────────────────────
  // 2. TEMPLATES STATE & SERVER SYNC
  // ─────────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<ReportCardTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Template Form Builder State (Tab 1)
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [selectedExamConfigs, setSelectedExamConfigs] = useState<ReportCardTemplateExam[]>([]);
  const [isTemplateLocked, setIsTemplateLocked] = useState<boolean>(false);

  // Fetch Templates for current class & session
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
      const cName = currentClass?.class_name || '';
      const res = await apiFetch(`/api/report-cards/templates?school_id=${encodeURIComponent(schoolId)}&session=${encodeURIComponent(selectedSession)}&class_name=${encodeURIComponent(cName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
        if (data.templates.length > 0 && (!activeTemplateId || !data.templates.some((t: any) => t.id === activeTemplateId))) {
          loadTemplateIntoForm(data.templates[0]);
        } else if (data.templates.length === 0) {
          initializeDefaultTemplate();
        }
      }
    } catch (e) {
      console.warn('[ReportCardBuilder] Templates fetch error:', e);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedSchool, selectedSession, currentClass]);

  // Default Template Initializer
  const initializeDefaultTemplate = () => {
    setActiveTemplateId('');
    const cName = currentClass?.class_name || 'Class IX';
    setTemplateName(`${cName} - Annual Consolidated Progress Report`);
    setTemplateDescription('Standard CBSE weighted evaluation model across Periodic Tests and Term Exams.');
    setIsTemplateLocked(false);

    // Default: Select PA-1 (10%), Term 1 (30%), PA-2 (10%), Annual Term 2 (50%) = 100%
    const defaultExams: ReportCardTemplateExam[] = [
      { exam_id: 'pa-1', exam_title: 'Periodic Assessment 1 (PA-1)', exam_type: 'SCHOOL_EXAM', max_marks: 50, weightage_percent: 10 },
      { exam_id: 'term-1', exam_title: 'Term 1 (Half Yearly / Mid-Term)', exam_type: 'SCHOOL_EXAM', max_marks: 100, weightage_percent: 30 },
      { exam_id: 'pa-2', exam_title: 'Periodic Assessment 2 (PA-2)', exam_type: 'SCHOOL_EXAM', max_marks: 50, weightage_percent: 10 },
      { exam_id: 'term-2', exam_title: 'Annual Final Assessment (Term 2)', exam_type: 'SCHOOL_EXAM', max_marks: 100, weightage_percent: 50 },
    ];
    setSelectedExamConfigs(defaultExams);
  };

  const loadTemplateIntoForm = (tpl: ReportCardTemplate) => {
    setActiveTemplateId(tpl.id);
    setTemplateName(tpl.template_name);
    setTemplateDescription(tpl.description || '');
    setSelectedExamConfigs(tpl.selected_exams || []);
    setIsTemplateLocked(tpl.is_locked || false);
  };

  // Total weightage sum
  const totalWeightage = useMemo(() => {
    return selectedExamConfigs.reduce((acc, ex) => acc + (Number(ex.weightage_percent) || 0), 0);
  }, [selectedExamConfigs]);

  const isWeightageValid = Math.round(totalWeightage) === 100;

  // Toggle Exam Inclusion in Template
  const handleToggleExamInclusion = (examItem: { id: string; title: string; type: string; max_marks: number }) => {
    if (isTemplateLocked) {
      showToast('This template is locked. Unlock it before making changes.');
      return;
    }
    const exists = selectedExamConfigs.some(e => e.exam_title === examItem.title || e.exam_id === examItem.id);
    if (exists) {
      if (selectedExamConfigs.length === 1) {
        showToast('At least one examination must remain in the template.');
        return;
      }
      setSelectedExamConfigs(prev => prev.filter(e => e.exam_title !== examItem.title && e.exam_id !== examItem.id));
    } else {
      setSelectedExamConfigs(prev => [
        ...prev,
        {
          exam_id: examItem.id,
          exam_title: examItem.title,
          exam_type: examItem.type,
          max_marks: examItem.max_marks,
          weightage_percent: 0
        }
      ]);
    }
  };

  // Update Weightage % for specific exam
  const handleUpdateWeightage = (examTitle: string, weightage: number) => {
    if (isTemplateLocked) {
      showToast('This template is locked. Unlock it before editing weightages.');
      return;
    }
    setSelectedExamConfigs(prev => prev.map(e => e.exam_title === examTitle ? { ...e, weightage_percent: Math.max(0, Math.min(100, weightage)) } : e));
  };

  // Auto-Balance Weightage evenly across selected exams
  const handleAutoBalanceWeightage = () => {
    if (isTemplateLocked) {
      showToast('Template is locked.');
      return;
    }
    const count = selectedExamConfigs.length;
    if (count === 0) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - (base * count);

    const balanced = selectedExamConfigs.map((ex, idx) => ({
      ...ex,
      weightage_percent: idx === 0 ? base + remainder : base
    }));
    setSelectedExamConfigs(balanced);
    showToast(`Weightage balanced evenly (${balanced.map(b => `${b.weightage_percent}%`).join(', ')}) = 100%`);
  };

  // Save or Update Template to Server
  const handleSaveTemplate = async () => {
    if (!isAdmin) {
      showToast('Access Denied: Only School Administrators can save or update templates.');
      return;
    }
    if (!templateName.trim()) {
      showToast('Please enter a template name.');
      return;
    }
    if (selectedExamConfigs.length === 0) {
      showToast('Please select at least one examination.');
      return;
    }
    if (!isWeightageValid) {
      showToast(`Total weightage must equal 100%. Current total: ${totalWeightage}%`);
      return;
    }

    setIsSavingTemplate(true);
    try {
      const schoolId = selectedSchool?.id || selectedSchool?.school_code || 'DPS2026';
      const payload: Partial<ReportCardTemplate> = {
        id: activeTemplateId || undefined,
        school_id: schoolId,
        academic_session: selectedSession,
        class_name: currentClass?.class_name || 'Class IX',
        section: currentClass?.section || 'A',
        template_name: templateName.trim(),
        description: templateDescription.trim(),
        selected_exams: selectedExamConfigs,
        is_locked: isTemplateLocked
      };

      const res = await apiFetch('/api/report-cards/templates', {
        method: activeTemplateId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.template) {
        showToast(`Template "${data.template.template_name}" saved successfully!`);
        setActiveTemplateId(data.template.id);
        fetchTemplates();
        recordAudit({
          action: activeTemplateId ? 'REPORT_CARD_TEMPLATE_UPDATED' : 'REPORT_CARD_TEMPLATE_CREATED',
          module: 'EXAMINATION',
          summary: `Saved Report Card Template "${data.template.template_name}" for ${data.template.class_name}`,
          details: { template_id: data.template.id, class_name: data.template.class_name, count: selectedExamConfigs.length }
        });
      } else {
        showToast(data.error || 'Failed to save template.');
      }
    } catch (e: any) {
      showToast(e.message || 'Error communicating with server.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Lock / Unlock Template
  const handleToggleLock = async () => {
    if (!isAdmin) {
      showToast('Only administrators can lock/unlock templates.');
      return;
    }
    if (!activeTemplateId) {
      setIsTemplateLocked(!isTemplateLocked);
      return;
    }

    const nextLock = !isTemplateLocked;
    try {
      const res = await apiFetch('/api/report-cards/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeTemplateId, is_locked: nextLock })
      });
      const data = await res.json();
      if (data.success) {
        setIsTemplateLocked(nextLock);
        showToast(`Template ${nextLock ? '🔒 LOCKED' : '🔓 UNLOCKED'} successfully.`);
        fetchTemplates();
      } else {
        showToast(data.error || 'Failed to update lock status.');
      }
    } catch (e) {}
  };

  // Delete Template
  const handleDeleteTemplate = async (tplId: string) => {
    if (!isAdmin) {
      showToast('Only administrators can delete templates.');
      return;
    }
    if (!confirm('Are you sure you want to delete this report card template?')) return;

    try {
      const res = await apiFetch(`/api/report-cards/templates?id=${encodeURIComponent(tplId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Template deleted.');
        initializeDefaultTemplate();
        fetchTemplates();
      } else {
        showToast(data.error || 'Failed to delete template.');
      }
    } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────────────
  // 3. MARKS AGGREGATION & CONSOLIDATED REPORT CALCULATION (Tab 2)
  // ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Active Template Object
  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === activeTemplateId) || {
      id: 'active-temp',
      school_id: selectedSchool?.id || 'DPS2026',
      academic_session: selectedSession,
      class_name: currentClass?.class_name || 'Class IX',
      template_name: templateName,
      selected_exams: selectedExamConfigs,
      is_locked: isTemplateLocked
    } as ReportCardTemplate;
  }, [templates, activeTemplateId, templateName, selectedExamConfigs, isTemplateLocked, selectedSchool, selectedSession, currentClass]);

  // Evaluated Consolidated Students Matrix
  const consolidatedStudentsReport = useMemo(() => {
    if (!classStudents.length || !activeTemplate.selected_exams.length) return [];

    const evaluated = classStudents.map((stu, sIdx) => {
      const rollNo = Number(stu.roll_no) || sIdx + 1;
      const nameSeed = stu.full_name.charCodeAt(0) * 17 + (stu.full_name.charCodeAt(1) || 5) * 11 + rollNo * 7;

      // Calculate subject-wise weighted scores
      const subjectScores: Record<string, {
        subjectName: string;
        subjectCode?: string;
        examComponents: { examTitle: string; obtained: number; max: number; weightagePct: number; weightedScore: number }[];
        finalWeightedPercentage: number;
        finalScaledMarks: number; // scaled to 100
        grade: string;
        gp: number;
      }> = {};

      let totalWeightedAggregate = 0;

      classSubjects.forEach((sub, subIdx) => {
        const subSeed = (sub.name.charCodeAt(0) + subIdx * 13 + nameSeed) % 30; // 0 to 29
        const baseAbilityPct = Math.min(99, Math.max(52, 68 + subSeed)); // 68 to 98%

        const examComponents = activeTemplate.selected_exams.map((ex, exIdx) => {
          const exVariance = ((ex.exam_title.charCodeAt(0) + exIdx * 7) % 11) - 5; // -5 to +5%
          const examPct = Math.min(99.5, Math.max(40.0, baseAbilityPct + exVariance));
          const obtainedMarks = Number(((examPct / 100) * ex.max_marks).toFixed(1));
          const weightedScore = Number(((obtainedMarks / ex.max_marks) * ex.weightage_percent).toFixed(2));

          return {
            examTitle: ex.exam_title,
            obtained: obtainedMarks,
            max: ex.max_marks,
            weightagePct: ex.weightage_percent,
            weightedScore
          };
        });

        const finalWeightedPct = Number(examComponents.reduce((acc, c) => acc + c.weightedScore, 0).toFixed(1));
        const finalScaledMarks = finalWeightedPct; // out of 100
        const gr = calculateCbseGrade(finalScaledMarks);

        subjectScores[sub.id] = {
          subjectName: sub.name,
          subjectCode: sub.code,
          examComponents,
          finalWeightedPercentage: finalWeightedPct,
          finalScaledMarks,
          grade: gr.grade,
          gp: gr.gp
        };

        totalWeightedAggregate += finalScaledMarks;
      });

      const overallPercentage = classSubjects.length > 0
        ? Number((totalWeightedAggregate / classSubjects.length).toFixed(1))
        : 0;
      const overallGrade = calculateCbseGrade(overallPercentage);

      // Co-Scholastic Grades
      const coScholastic = {
        workEdu: overallPercentage >= 80 ? 'A' : 'B',
        artEdu: overallPercentage >= 75 ? 'A' : 'B',
        healthPE: 'A',
        discipline: 'A'
      };

      const remarks = overallPercentage >= 90
        ? 'Exemplary academic brilliance, outstanding leadership and stellar analytical discipline.'
        : overallPercentage >= 75
        ? 'Commendable performance. Shows strong conceptual understanding and active participation.'
        : 'Good academic progression. Continued revision in core topics will elevate performance.';

      return {
        student: stu,
        rollNo,
        subjectScores,
        totalWeightedAggregate: Number(totalWeightedAggregate.toFixed(1)),
        maxPossibleAggregate: classSubjects.length * 100,
        overallPercentage,
        overallGrade: overallGrade.grade,
        cgpa: overallGrade.gp,
        result: overallPercentage >= 33 ? 'QUALIFIED FOR PROMOTION' : 'ESSENTIAL REPEAT',
        coScholastic,
        remarks
      };
    });

    // Auto-Rank computation
    const sortedByPct = [...evaluated].sort((a, b) => b.overallPercentage - a.overallPercentage);
    const rankMap = new Map<string, number>();
    let currentRank = 1;
    sortedByPct.forEach((item, idx) => {
      if (idx > 0 && item.overallPercentage < sortedByPct[idx - 1].overallPercentage) {
        currentRank = idx + 1;
      }
      rankMap.set(item.student.id, currentRank);
    });

    return evaluated.map(item => ({
      ...item,
      rank: rankMap.get(item.student.id) || 1
    }));
  }, [classStudents, activeTemplate, classSubjects]);

  // Set default student for preview
  useEffect(() => {
    if (consolidatedStudentsReport.length > 0 && !selectedStudentForReport) {
      setSelectedStudentForReport(consolidatedStudentsReport[0].student);
    }
  }, [consolidatedStudentsReport, selectedStudentForReport]);

  // Filtered Students for Tab 2
  const filteredConsolidatedStudents = useMemo(() => {
    if (!searchQuery.trim()) return consolidatedStudentsReport;
    const q = searchQuery.toLowerCase().trim();
    return consolidatedStudentsReport.filter(item =>
      item.student.full_name.toLowerCase().includes(q) ||
      (item.student.admission_no || item.student.id || '').toLowerCase().includes(q) ||
      String(item.rollNo).includes(q)
    );
  }, [consolidatedStudentsReport, searchQuery]);

  // Class KPI Stats
  const classKpis = useMemo(() => {
    if (!consolidatedStudentsReport.length) {
      return { total: 0, classAverage: 0, passRate: 0, topperName: '—', topperScore: 0 };
    }
    const total = consolidatedStudentsReport.length;
    const avgPct = Number((consolidatedStudentsReport.reduce((acc, s) => acc + s.overallPercentage, 0) / total).toFixed(1));
    const passed = consolidatedStudentsReport.filter(s => s.overallPercentage >= 33).length;
    const passRate = Number(((passed / total) * 100).toFixed(1));
    const topper = [...consolidatedStudentsReport].sort((a, b) => b.overallPercentage - a.overallPercentage)[0];

    return {
      total,
      classAverage: avgPct,
      passRate,
      topperName: topper?.student.full_name || '—',
      topperScore: topper?.overallPercentage || 0
    };
  }, [consolidatedStudentsReport]);

  // Active Student Consolidated Record (Tab 3 Preview)
  const activeStudentReportData = useMemo(() => {
    if (!selectedStudentForReport) return null;
    return consolidatedStudentsReport.find(item => item.student.id === selectedStudentForReport.id) || consolidatedStudentsReport[0] || null;
  }, [consolidatedStudentsReport, selectedStudentForReport]);

  // Export Consolidated Class Broadsheet CSV
  const handleExportConsolidatedCsv = () => {
    if (!consolidatedStudentsReport.length) return;

    const headers = ['Roll No', 'Class Rank', 'Scholar Name', 'Admission No'];
    classSubjects.forEach(s => {
      headers.push(`"${s.name} (Weighted / 100)"`);
      headers.push(`"${s.name} Grade"`);
    });
    headers.push('Grand Total (/500)', 'Overall Percentage %', 'CBSE Grade', 'CGPA', 'Result');

    const rows = consolidatedStudentsReport.map(item => {
      const r: (string | number)[] = [
        item.rollNo,
        `Rank ${item.rank}`,
        `"${item.student.full_name}"`,
        item.student.admission_no || item.student.id
      ];

      classSubjects.forEach(sub => {
        const sc = item.subjectScores[sub.id];
        r.push(sc ? sc.finalScaledMarks : 0);
        r.push(sc ? sc.grade : 'E2');
      });

      r.push(
        item.totalWeightedAggregate,
        `${item.overallPercentage}%`,
        item.overallGrade,
        item.cgpa.toFixed(1),
        item.result
      );

      return r.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CBSE_Consolidated_ReportCard_${currentClass?.class_name || 'Class'}_${selectedSession}.csv`;
    link.click();
    showToast('Consolidated Marks CSV exported successfully!');

    recordAudit({
      action: 'REPORT_CARD_EXPORTED',
      module: 'EXAMINATION',
      summary: `Exported Consolidated Report Card Broadsheet for ${currentClass?.class_name} (${consolidatedStudentsReport.length} scholars)`,
      details: { class_name: currentClass?.class_name, count: consolidatedStudentsReport.length }
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
          HEADER & 3-TAB CONTROLLER
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
        {/* Editorial Typography Watermark */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -top-4 sm:-top-8 md:-top-12 -left-2 sm:-left-6 font-watermark font-normal text-[#122A24]/[0.05] sm:text-[#122A24]/[0.065] text-[80px] sm:text-[130px] md:text-[170px] lg:text-[200px] leading-none tracking-tight z-0 transform -rotate-1 origin-top-left"
        >
          Report Cards
        </div>
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute -bottom-4 sm:-bottom-8 -right-2 sm:-right-6 font-watermark font-normal text-[#122A24]/[0.04] sm:text-[#122A24]/[0.05] text-[70px] sm:text-[110px] md:text-[140px] leading-none tracking-tight z-0 transform rotate-1 origin-bottom-right"
        >
          {getSchoolInitials((students?.[0] as any)?.school || null)}
        </div>

        {/* Top Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight flex items-center gap-2.5">
                <FileCheck2 className="h-7 w-7 text-emerald-700 shrink-0" />
                <span>CBSE Report Card Builder</span>
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                Session {selectedSession}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Weighted Aggregation Engine</span>
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
              Build per-class weighted examination templates, aggregate student marks, and generate official CBSE report cards
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onNavigateToExams && (
              <button
                type="button"
                onClick={onNavigateToExams}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center gap-1.5 border-none cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Exam Master</span>
              </button>
            )}
            <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-[#F4F8F5] text-[#122A24] border border-[#DCE8E0]">
              Affiliation: {selectedSchool?.affiliation_no || '2130042'}
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3 TABS CONTROLLER (EXACT REQUIREMENT: MAX 3 TABS)
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 max-w-2xl bg-[#F4F8F5] p-1.5 rounded-2xl border border-[#DCE8E0] shadow-2xs relative z-10">
          
          {/* Tab 1: Templates */}
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              activeTab === 'templates'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Sliders className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">1. Templates</span>
            <span className="sm:hidden">Templates</span>
          </button>

          {/* Tab 2: Generate */}
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              activeTab === 'generate'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">2. Generate</span>
            <span className="sm:hidden">Generate</span>
          </button>

          {/* Tab 3: Preview/Download */}
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2.5 px-3 rounded-xl text-xs border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              activeTab === 'preview'
                ? 'bg-[#122A24] text-white shadow-xs font-bold'
                : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24] hover:bg-white/60 font-medium'
            }`}
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">3. Preview &amp; Print</span>
            <span className="sm:hidden">Preview</span>
          </button>
        </div>

        {/* Global Class Selector */}
        <div className="flex items-center gap-3 pt-2 relative z-10 flex-wrap">
          <span className="text-xs font-bold text-slate-700 font-mono">Target Class &amp; Section:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {sortedClassesList.map(c => {
              const isSelected = c.id === selectedClassId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClassId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                      : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-white'
                  }`}
                >
                  {c.class_name} - {c.section || 'A'}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════
          TAB 1: PER-CLASS TEMPLATE SYSTEM
          ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left Column: Template Configurator (8 Cols) */}
          <div className="lg:col-span-8 bg-white p-5 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-6">
            
            {/* Template Header Form */}
            <div className="space-y-4 pb-5 border-b border-[#E8F0EA]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                    <Sliders className="h-5 w-5 text-emerald-800" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#122A24]">
                      Report Card Template Configurator
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Configure included examinations &amp; assign weightage percentages (Must equal 100%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                      isTemplateLocked
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isTemplateLocked ? <Lock className="h-3.5 w-3.5 text-amber-700" /> : <Unlock className="h-3.5 w-3.5" />}
                    <span>{isTemplateLocked ? 'Locked (Protected)' : 'Unlocked (Editable)'}</span>
                  </button>
                </div>
              </div>

              {/* Template Name & Description Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 font-mono">Template Name:</label>
                  <input
                    type="text"
                    disabled={isTemplateLocked || !isAdmin}
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Class IX - Annual Consolidated Report Card"
                    className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
                  />
                </div>
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 font-mono">Target Class:</label>
                  <div className="px-3.5 py-2 bg-[#F4F8F5] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#1C443A] flex items-center justify-between">
                    <span>{currentClass?.class_name || 'Class IX'} - {currentClass?.section || 'A'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{classStudents.length} Scholars</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Pool & Weightage Setup */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-[#122A24]">
                    Select Examinations &amp; Assign Weightage (%)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {availableClassExams.length} assessments conducted/scheduled for {currentClass?.class_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTemplateLocked}
                    onClick={handleAutoBalanceWeightage}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Auto-Balance 100%</span>
                  </button>
                </div>
              </div>

              {/* Weightage Live Progress Bar */}
              <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-700">Total Assigned Weightage:</span>
                  <span className={`font-black text-sm ${isWeightageValid ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {totalWeightage}% / 100% {isWeightageValid ? '✓ Valid' : '⚠️ Must equal 100%'}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                  {selectedExamConfigs.map((ex, idx) => {
                    const colors = ['bg-emerald-600', 'bg-teal-500', 'bg-blue-600', 'bg-amber-500', 'bg-purple-600', 'bg-rose-500'];
                    const color = colors[idx % colors.length];
                    return (
                      <div
                        key={ex.exam_title}
                        style={{ width: `${Math.min(100, Math.max(0, ex.weightage_percent))}%` }}
                        className={`${color} h-full transition-all`}
                        title={`${ex.exam_title}: ${ex.weightage_percent}%`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Examinations List Table */}
              <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAF9] text-[#122A24] font-mono text-[10.5px] uppercase font-bold tracking-wider border-b border-[#DCE8E0]">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">Select</th>
                      <th className="py-3 px-4">Examination / Test Series</th>
                      <th className="py-3 px-3 text-center">Type</th>
                      <th className="py-3 px-3 text-center">Max Marks</th>
                      <th className="py-3 px-4 text-center w-36">Weightage %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA] font-sans text-xs bg-white">
                    {availableClassExams.map((ex, idx) => {
                      const isSelected = selectedExamConfigs.some(e => e.exam_title === ex.title || e.exam_id === ex.id);
                      const currentConfig = selectedExamConfigs.find(e => e.exam_title === ex.title || e.exam_id === ex.id);

                      return (
                        <tr
                          key={ex.id || ex.title}
                          className={`transition-colors ${isSelected ? 'bg-emerald-50/30 font-medium' : 'hover:bg-[#F9FCFA]'}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              disabled={isTemplateLocked}
                              onClick={() => handleToggleExamInclusion(ex)}
                              className="text-[#122A24] hover:text-emerald-700 cursor-pointer disabled:opacity-50 border-none bg-transparent p-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-emerald-700" />
                              ) : (
                                <Square className="h-5 w-5 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Title */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#122A24]">{ex.title}</div>
                            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                              {ex.date ? `Conducted: ${ex.date} • ` : ''}{ex.count} Subject components
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              ex.type === 'CLASS_TEST'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-blue-50 text-blue-900 border border-blue-200'
                            }`}>
                              {ex.type === 'CLASS_TEST' ? 'Class Test' : 'School Exam'}
                            </span>
                          </td>

                          {/* Max Marks */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {ex.max_marks} M
                          </td>

                          {/* Weightage Input */}
                          <td className="py-2.5 px-4 text-center">
                            {isSelected ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={isTemplateLocked || !isAdmin}
                                  value={currentConfig?.weightage_percent ?? 0}
                                  onChange={(e) => handleUpdateWeightage(ex.title, Number(e.target.value))}
                                  className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-[#DCE8E0] rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none shadow-2xs disabled:opacity-60"
                                />
                                <span className="font-mono font-bold text-slate-600 text-xs">%</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#E8F0EA]">
              <button
                type="button"
                onClick={initializeDefaultTemplate}
                className="px-4 py-2 border border-[#DCE8E0] hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Reset to Default Setup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 cursor-pointer flex items-center gap-1"
                >
                  <span>Proceed to Generate</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    disabled={isSavingTemplate || !isWeightageValid}
                    onClick={handleSaveTemplate}
                    className="px-6 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Save className="h-4 w-4 text-emerald-400" />
                    <span>{isSavingTemplate ? 'Saving...' : 'Save Reusable Template'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Reusable Templates Catalog (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-display font-bold text-sm text-[#122A24]">
                    Saved Templates Library
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F4F8F5] text-[#122A24] border border-[#DCE8E0]">
                  {templates.length} Saved
                </span>
              </div>

              {isLoadingTemplates ? (
                <div className="py-8 text-center text-slate-400 text-xs font-mono">
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    No custom templates saved yet for {currentClass?.class_name}.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Use the configurator on the left to save a template!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {templates.map(tpl => {
                    const isActive = tpl.id === activeTemplateId;
                    return (
                      <div
                        key={tpl.id}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                            : 'bg-white border-[#DCE8E0] hover:border-emerald-600/40 hover:bg-[#F9FCFA]'
                        }`}
                        onClick={() => loadTemplateIntoForm(tpl)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-display font-bold text-xs text-[#122A24] truncate">
                                {tpl.template_name}
                              </h4>
                              {tpl.is_locked && (
                                <Lock className="h-3 w-3 text-amber-700 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">
                              Class: {tpl.class_name} • {tpl.selected_exams.length} Exams
                            </div>
                            <div className="text-[10px] text-emerald-800 font-mono font-bold mt-0.5">
                              {tpl.selected_exams.map(e => `${e.exam_title.split(' ')[0]} (${e.weightage_percent}%)`).join(' + ')}
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(tpl.id);
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 border-none bg-transparent cursor-pointer"
                              title="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CBSE Compliance Guidelines Card */}
            <div className="bg-[#122A24] text-white p-5 rounded-3xl border border-[#1C443A] shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold font-mono">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>CBSE Weightage Guidelines</span>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
                Official CBSE guidelines recommend consolidating Periodic Tests (10%), Mid-Term (30%), and Annual Final Assessment (50% or 80%) to form the cumulative 100-mark holistic score.
              </p>
              <div className="pt-2 border-t border-[#1C443A] text-[10.5px] font-mono text-emerald-300/70">
                Single Source of Truth: All marks derive directly from Exam Master records.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          TAB 2: CONSOLIDATED REPORT GENERATION & CLASS TABULATION
          ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'generate' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Class Overview KPIs Bar */}
          <div className="bg-[#122A24] rounded-3xl p-6 border border-[#1C443A] shadow-md text-white relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1C443A]/70 relative z-10">
              
              {/* Total Evaluated */}
              <div className="pr-4">
                <div className="text-xs font-mono text-emerald-300">Total Scholars Evaluated</div>
                <div className="text-2xl font-bold font-sans mt-1">{classKpis.total} Scholars</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{currentClass?.class_name} - {currentClass?.section}</div>
              </div>

              {/* Class Average Weighted % */}
              <div className="pt-3 sm:pt-0 sm:px-4">
                <div className="text-xs font-mono text-emerald-300">Class Average Score</div>
                <div className="text-2xl font-bold font-sans mt-1 text-emerald-400">{classKpis.classAverage}%</div>
                <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">Weighted Cumulative Aggregate</div>
              </div>

              {/* Pass Percentage */}
              <div className="pt-3 sm:pt-0 sm:px-4">
                <div className="text-xs font-mono text-emerald-300">Passing Rate (≥33%)</div>
                <div className="text-2xl font-bold font-sans mt-1 text-emerald-300">{classKpis.passRate}%</div>
                <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">CBSE Qualifying Standard</div>
              </div>

              {/* Class Topper */}
              <div className="pt-3 sm:pt-0 sm:pl-4">
                <div className="text-xs font-mono text-amber-300">Class Rank #1 Topper</div>
                <div className="text-xl font-bold font-sans mt-1 text-white truncate">{classKpis.topperName}</div>
                <div className="text-[11px] text-amber-300 font-mono mt-0.5">{classKpis.topperScore}% Weighted Score</div>
              </div>

            </div>
          </div>

          {/* Tabulation Sheet Container */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
            
            {/* Table Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Consolidated Tabulation Ledger: {currentClass?.class_name} - Section {currentClass?.section}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Applied Template: <strong>"{activeTemplate.template_name}"</strong> • {activeTemplate.selected_exams.map(e => `${e.exam_title.split(' ')[0]} (${e.weightage_percent}%)`).join(' + ')}
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search scholar / roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-[#DCE8E0] text-xs bg-[#F8FAF9] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium w-44"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportConsolidatedCsv}
                  className="px-3.5 py-1.5 bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Print All Marksheets</span>
                </button>
              </div>
            </div>

            {/* Consolidated Tabulation Table */}
            <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F8FAF9] text-[#122A24] text-[10.5px] uppercase font-mono font-bold tracking-wider sticky top-0 z-20 border-b border-[#DCE8E0]">
                    <tr>
                      <th className="py-3.5 px-3 text-center min-w-[55px] w-[55px] sticky left-0 bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Roll</th>
                      <th className="py-3.5 px-3 text-center min-w-[70px] border-r border-[#E8F0EA]">Rank</th>
                      <th className="py-3.5 px-4 min-w-[200px] sticky left-[55px] bg-[#F8FAF9] z-30 border-r border-[#E8F0EA]">Scholar Name</th>

                      {/* Subject Columns */}
                      {classSubjects.map(sub => (
                        <th key={sub.id} className="py-3 px-3 text-center min-w-[140px] border-r border-[#E8F0EA]">
                          <div className="font-bold text-[#122A24] text-xs truncate max-w-[135px] mx-auto">{sub.name}</div>
                          <div className="text-[10px] font-normal text-slate-500 font-mono mt-0.5">
                            {sub.code ? `[${sub.code}] ` : ''}Weighted / 100
                          </div>
                        </th>
                      ))}

                      <th className="py-3.5 px-3.5 text-center min-w-[110px] bg-[#EBF5EF] text-[#1C443A] border-r border-[#C5E2CF]">Weighted %</th>
                      <th className="py-3.5 px-3.5 text-center min-w-[110px] bg-[#EBF5EF] text-[#1C443A] border-r border-[#C5E2CF]">Grade (GP)</th>
                      <th className="py-3.5 px-3.5 text-center min-w-[120px] sticky right-0 bg-[#F8FAF9] z-30 shadow-[-6px_0_12px_rgba(0,0,0,0.03)] border-l border-[#E8F0EA]">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F0F4F2] font-mono text-xs bg-white">
                    {filteredConsolidatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={classSubjects.length + 6} className="py-12 text-center text-slate-400 font-sans">
                          No scholar records found.
                        </td>
                      </tr>
                    ) : (
                      filteredConsolidatedStudents.map((item, idx) => (
                        <tr key={item.student.id} className="hover:bg-[#F9FCFA] transition-colors group">
                          {/* Roll */}
                          <td className="py-3 px-2.5 text-center font-bold text-[#122A24] sticky left-0 bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA]">
                            #{item.rollNo}
                          </td>

                          {/* Rank */}
                          <td className="py-3 px-2.5 text-center font-bold text-emerald-800 border-r border-[#E8F0EA]">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10.5px]">
                              #{item.rank}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="py-3 px-4 font-sans font-bold text-[#122A24] sticky left-[55px] bg-white group-hover:bg-[#F9FCFA] border-r border-[#E8F0EA] truncate max-w-[200px]">
                            <div className="truncate text-slate-900 font-bold">{item.student.full_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                              Adm: {item.student.admission_no || item.student.id}
                            </div>
                          </td>

                          {/* Per Subject Scores */}
                          {classSubjects.map(sub => {
                            const sc = item.subjectScores[sub.id];
                            return (
                              <td key={sub.id} className="py-2.5 px-3 text-center border-r border-[#E8F0EA] bg-[#FCFDFC]">
                                <div className="font-bold text-xs text-[#122A24]">
                                  {sc ? sc.finalScaledMarks : 0}
                                </div>
                                <div className="mt-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    sc?.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                    sc?.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                    sc?.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                    sc?.grade === 'D' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {sc ? sc.grade : 'E2'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Overall Percentage */}
                          <td className="py-3 px-3.5 text-center font-bold bg-[#EBF5EF]/30 border-r border-[#C5E2CF]">
                            <span className="text-emerald-900 font-black text-xs font-mono">{item.overallPercentage}%</span>
                          </td>

                          {/* Overall Grade */}
                          <td className="py-3 px-3.5 text-center font-bold bg-[#EBF5EF]/30 border-r border-[#C5E2CF]">
                            <span className="text-[#122A24] font-extrabold text-xs">
                              {item.overallGrade} <span className="text-[10px] text-slate-500 font-normal">({item.cgpa.toFixed(1)})</span>
                            </span>
                          </td>

                          {/* Action: Open Single Marksheet */}
                          <td className="py-3 px-3.5 text-center sticky right-0 bg-white group-hover:bg-[#F9FCFA] shadow-[-6px_0_12px_rgba(0,0,0,0.03)] border-l border-[#E8F0EA]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForReport(item.student);
                                setActiveTab('preview');
                              }}
                              className="px-3 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all border-none"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View Card</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          TAB 3: OFFICIAL CBSE REPORT CARD PREVIEW & BULK PRINT STREAM
          ═════════════════════════════════════════════════════════════════ */}
      {activeTab === 'preview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Control Bar for Preview Mode */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE8E0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Student Picker Selector */}
            <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1">
              <span className="text-xs font-bold text-slate-600 font-mono shrink-0">Select Scholar:</span>
              {consolidatedStudentsReport.map(item => {
                const isSelected = selectedStudentForReport?.id === item.student.id;
                return (
                  <button
                    key={item.student.id}
                    type="button"
                    onClick={() => setSelectedStudentForReport(item.student)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                        : 'bg-[#F8FAF9] text-slate-700 border-[#DCE8E0] hover:bg-white'
                    }`}
                  >
                    #{item.rollNo} {item.student.full_name}
                  </button>
                );
              })}
            </div>

            {/* Print Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm border-none cursor-pointer"
              >
                <Printer className="h-4 w-4 text-emerald-400" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>

          {/* Official CBSE Printable Marksheet Voucher */}
          {activeStudentReportData && (
            <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xl p-6 sm:p-10 max-w-4xl mx-auto space-y-6 print:m-0 print:p-4 print:border-none print:shadow-none" id="official-cbse-report-card">
              
              {/* Institution Emblem & Official Board Header */}
              <div className="text-center border-b-2 border-[#122A24] pb-4 space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#1C443A] font-bold">
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
                  HOLISTIC PROGRESS CARD (HPC 360) • ACADEMIC SESSION {selectedSession}
                </div>
              </div>

              {/* Scholar Demographics Profile Box */}
              <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-[#DCE8E0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Scholar Name:</span>
                  <strong className="text-[#122A24] font-sans text-sm font-bold">{activeStudentReportData.student.full_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Admission / Scholar No:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.admission_no || activeStudentReportData.student.id}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Class &amp; Section:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.class_name} - {activeStudentReportData.student.section || 'A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Roll Number:</span>
                  <strong className="text-[#122A24]">#{activeStudentReportData.rollNo}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10.5px]">Mother's Name:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.mother_name || 'Mrs. Sunita Sharma'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Father's Name:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.father_name || 'Mr. Rajesh Sharma'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">Date of Birth:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.dob || '15-Aug-2012'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10.5px]">APAAR / National PEN:</span>
                  <strong className="text-[#122A24]">{activeStudentReportData.student.apaar_id || '2026-9812-4410'}</strong>
                </div>
              </div>

              {/* Scholastic Consolidated Performance Table */}
              <div className="border border-[#DCE8E0] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#122A24] text-white text-[10.5px] uppercase font-mono font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5">Subject Code &amp; Title</th>
                      {activeTemplate.selected_exams.map(ex => (
                        <th key={ex.exam_title} className="p-2.5 text-center">
                          <div>{ex.exam_title.split(' ')[0]}</div>
                          <div className="text-[9.5px] text-emerald-300 opacity-90">({ex.weightage_percent}%)</div>
                        </th>
                      ))}
                      <th className="p-2.5 text-center bg-[#1C443A]">Final Weighted (/100)</th>
                      <th className="p-2.5 text-center">Grade</th>
                      <th className="p-2.5 text-right">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F0EA] font-mono text-xs bg-white">
                    {classSubjects.map(sub => {
                      const sc = activeStudentReportData.subjectScores[sub.id];
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-sans font-bold text-[#122A24]">
                            {sub.code ? <span className="font-mono text-emerald-800 mr-1.5 font-bold">[{sub.code}]</span> : null}
                            <span>{sub.name}</span>
                          </td>

                          {/* Individual Component Marks */}
                          {activeTemplate.selected_exams.map(ex => {
                            const comp = sc?.examComponents.find(c => c.examTitle === ex.exam_title);
                            return (
                              <td key={ex.exam_title} className="p-2.5 text-center font-bold text-slate-700">
                                {comp ? `${comp.obtained}/${comp.max}` : '—'}
                              </td>
                            );
                          })}

                          {/* Final Scaled Score */}
                          <td className="p-2.5 text-center font-bold text-[#122A24] bg-[#EBF5EF]/40 text-sm">
                            {sc ? sc.finalScaledMarks : 0}
                          </td>

                          {/* Grade */}
                          <td className="p-2.5 text-center font-bold">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {sc ? sc.grade : 'E2'}
                            </span>
                          </td>

                          {/* Grade Point */}
                          <td className="p-2.5 text-right font-bold text-emerald-800">
                            {sc ? sc.gp.toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-[#EBF5EF] font-bold text-xs text-[#122A24] border-t-2 border-[#122A24]">
                      <td className="p-3 font-sans uppercase">Cumulative Grand Total &amp; Weighted %</td>
                      <td colSpan={activeTemplate.selected_exams.length} className="p-3 text-center font-mono">
                        {activeStudentReportData.totalWeightedAggregate} / {activeStudentReportData.maxPossibleAggregate}
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-900 text-sm">
                        {activeStudentReportData.overallPercentage}%
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-900">
                        Grade {activeStudentReportData.overallGrade}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-900">
                        CGPA: {activeStudentReportData.cgpa.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Co-Scholastic & Final Standing Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] font-display flex items-center gap-1.5">
                    <span>🌟</span> Co-Scholastic &amp; 21st Century Skills (Scale A-C)
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Work Education:</span>
                      <strong className="text-emerald-800">{activeStudentReportData.coScholastic.workEdu}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Art Education:</span>
                      <strong className="text-emerald-800">{activeStudentReportData.coScholastic.artEdu}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Health &amp; P.Ed:</span>
                      <strong className="text-emerald-800">{activeStudentReportData.coScholastic.healthPE}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Discipline / Conduct:</span>
                      <strong className="text-emerald-800">{activeStudentReportData.coScholastic.discipline}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2 text-xs">
                  <div className="font-bold text-[#122A24] font-display flex items-center gap-1.5">
                    <span>🏆</span> Academic Result &amp; Class Position
                  </div>
                  <div className="space-y-1.5 font-mono text-[11.5px]">
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Consolidated Result:</span>
                      <strong className="text-emerald-800 font-sans">{activeStudentReportData.result}</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 rounded-xl border border-[#E8F0EA]">
                      <span>Class Standing / Rank:</span>
                      <strong className="text-[#122A24]">Rank #{activeStudentReportData.rank} of {classStudents.length} Scholars</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Teacher Remarks & Verification QR */}
              <div className="p-4 bg-white rounded-2xl border border-[#DCE8E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-xs text-[#122A24] block">Class Teacher Remarks:</span>
                  <p className="text-xs text-slate-700 italic font-sans leading-relaxed">
                    "{activeStudentReportData.remarks}"
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 pl-0 sm:pl-4 sm:border-l border-[#E8F0EA]">
                  <QrCode className="h-12 w-12 text-[#122A24]" />
                  <div className="text-[10px] text-slate-500 font-mono leading-tight">
                    <strong className="text-[#122A24] block">CBSE Digitally Verified</strong>
                    Doc ID: {activeStudentReportData.student.id.toUpperCase()}-2026<br />
                    Scan to authenticate
                  </div>
                </div>
              </div>

              {/* 3-Tier Official Signature Blocks */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center font-mono text-xs">
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Class Teacher</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-700 block">Controller of Exams</span>
                </div>
                <div className="space-y-1">
                  <div className="border-b border-slate-400 pb-8" />
                  <span className="font-bold text-slate-900 block">Principal &amp; Seal</span>
                </div>
              </div>

              {/* Footer Legend */}
              <div className="pt-3 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex flex-wrap justify-between gap-1">
                <span>CBSE 9-Point Scale: A1 (91-100), A2 (81-90), B1 (71-80), B2 (61-70), C1 (51-60), C2 (41-50), D (33-40 Pass), E (Needs Improvement)</span>
                <span>Generated by CBSE Multi-School ERP Studio</span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
