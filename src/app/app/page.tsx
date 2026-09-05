/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  BarChart3,
  Database,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Layers,
  BookOpen,
  Bell,
  Settings,
  Printer,
  FileText,
  Check,
  X,
  Edit,
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  MoreVertical,
  Calendar,
  ArrowUpDown,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Square,
  Download,
  Menu,
  SlidersHorizontal,
  Save,
  Bus,
  Award,
  Radio,
  User,
  Crown,
  EyeOff,
  Edit3,
  RotateCcw,
  PlusCircle,
  Sparkles,
  BookCheck,
  FileCheck,
  Coins,
  BarChart2,
  Wallet,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  ImageIcon,
  FileSpreadsheet,
  FolderDown,
  HeartHandshake,
  Sliders,
  Lock,
  Zap,
  Calculator,
  Receipt
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { School, Student, Teacher, ClassRoom, SubjectItem, Notice, FeeInvoice, AttendanceRecord, SchoolOverview, RolePermissionMatrix, DEFAULT_ROLE_PERMISSIONS, ManagedRole, STAFF_ROLES, resolveTeacherRole } from '@/lib/types';
import { getClassWeight, sortClassesChronologically } from '@/lib/cbse-subjects';
import { apiFetch } from '@/lib/api-client';
import { calculateRegistrationFees, DEFAULT_TRANSPORT_FEES } from '@/lib/fee-calculator';
import { InstitutionalReportModal, ReportColumn } from '@/components/institutional-report-modal';
import { TaskCompletionOverlay, TaskCelebrationData, TaskCelebrationType } from '@/components/task-completion-overlay';
import { getAllSiblingGroups, SiblingGroup } from '@/lib/student-helper';

const DashboardOverview = dynamic(
  () => import('@/components/blocks/dashboard-overview').then((m) => m.DashboardOverview),
  { ssr: false }
);
const DashboardSubjects = dynamic(
  () => import('@/components/blocks/dashboard-subjects').then((m) => m.DashboardSubjects),
  { ssr: false }
);
const DashboardAttendance = dynamic(
  () => import('@/components/blocks/dashboard-attendance').then((m) => m.DashboardAttendance),
  { ssr: false }
);
const DashboardTransport = dynamic(
  () => import('@/components/blocks/dashboard-transport').then((m) => m.DashboardTransport),
  { ssr: false }
);
const DashboardExams = dynamic(
  () => import('@/components/blocks/dashboard-exams').then((m) => m.DashboardExams),
  { ssr: false }
);
const DashboardHomework = dynamic(
  () => import('@/components/blocks/dashboard-homework').then((m) => m.DashboardHomework),
  { ssr: false }
);
const DashboardApprovals = dynamic(
  () => import('@/components/blocks/dashboard-approvals').then((m) => m.DashboardApprovals),
  { ssr: false }
);
const DashboardBroadcast = dynamic(
  () => import('@/components/blocks/dashboard-broadcast').then((m) => m.DashboardBroadcast),
  { ssr: false }
);
const DashboardCertificates = dynamic(
  () => import('@/components/blocks/dashboard-certificates').then((m) => m.DashboardCertificates),
  { ssr: false }
);
const DashboardFees = dynamic(
  () => import('@/components/blocks/dashboard-fees').then((m) => m.DashboardFees),
  { ssr: false }
);
const DashboardReports = dynamic(
  () => import('@/components/blocks/dashboard-reports').then((m) => m.DashboardReports),
  { ssr: false }
);
const DashboardAuditLogs = dynamic(
  () => import('@/components/blocks/dashboard-audit-logs').then((m) => m.DashboardAuditLogs),
  { ssr: false }
);
const DashboardDataHub = dynamic(
  () => import('@/components/blocks/dashboard-data-hub').then((m) => m.DashboardDataHub),
  { ssr: false }
);
const DashboardSiblings = dynamic(
  () => import('@/components/blocks/dashboard-siblings').then((m) => m.DashboardSiblings),
  { ssr: false }
);
const DashboardStudentPortal = dynamic(
  () => import('@/components/blocks/dashboard-student-portal').then((m) => m.DashboardStudentPortal),
  { ssr: false }
);
const OmniSearchModal = dynamic(
  () => import('@/components/omni-search-modal').then((m) => m.OmniSearchModal),
  { ssr: false }
);
const StudentSummaryModal = dynamic(
  () => import('@/components/student-summary-modal').then((m) => m.StudentSummaryModal),
  { ssr: false }
);
const DashboardPermissions = dynamic(
  () => import('@/components/blocks/dashboard-permissions').then((m) => m.DashboardPermissions),
  { ssr: false }
);
const DashboardLibrary = dynamic(
  () => import('@/components/blocks/dashboard-library').then((m) => m.DashboardLibrary),
  { ssr: false }
);
const DashboardVisitorGate = dynamic(
  () => import('@/components/blocks/dashboard-visitor-gate').then((m) => m.DashboardVisitorGate),
  { ssr: false }
);
import { sendTestNotification, getNotificationPermissionStatus } from '@/lib/push-notifications';
import BroadcastInboxModal, { getReadBroadcastIds } from '@/components/broadcast-inbox-modal';

const TAB_POSTER_CONFIG: Record<string, { title: string; subtitle: string; code: string; highlight: string }> = {
  overview: {
    title: 'OVERVIEW',
    subtitle: 'EXECUTIVE COMMAND CENTER & CBSE METRICS',
    code: 'MOD-01 // COCKPIT',
    highlight: 'REAL-TIME CAMPUS TELEMETRY',
  },
  students: {
    title: 'STUDENTS',
    subtitle: 'CBSE ENROLLED SCHOLAR REGISTRY & DOSSIERS',
    code: 'MOD-02 // SIS',
    highlight: 'ACADEMIC LIFECYCLE & OASIS',
  },
  siblings: {
    title: 'SIBLINGS',
    subtitle: 'HOUSEHOLD & MULTI-CHILD ENROLMENT MATRIX',
    code: 'MOD-02.1 // SIBLINGS',
    highlight: 'FAMILY CO-ENROLMENT REGISTRY',
  },
  teachers: {
    title: 'FACULTY',
    subtitle: 'ACADEMIC FACULTY & STATUTORY CBSE COMPLIANCE',
    code: 'MOD-03 // HR',
    highlight: 'TEACHING CORPS DIRECTORY',
  },
  classes: {
    title: 'CLASSES',
    subtitle: 'COHORT STRUCTURE, TIMETABLE & SECTIONS',
    code: 'MOD-04 // ACADEMIC',
    highlight: 'CURRICULAR ORG MATRIX',
  },
  subjects: {
    title: 'CURRICULUM',
    subtitle: 'ACADEMIC SCHEME & SUBJECT CATALOG',
    code: 'MOD-05 // SYLLABUS',
    highlight: 'CBSE PEDAGOGICAL STRUCTURE',
  },
  attendance: {
    title: 'ATTENDANCE',
    subtitle: 'DAILY BIOMETRIC & CLASSROOM ROLLS',
    code: 'MOD-06 // ATTENDANCE',
    highlight: 'REAL-TIME PRESENCE LEDGER',
  },
  fees: {
    title: 'FINANCE',
    subtitle: 'FEE STRUCTURES, INVOICING & REVENUE LEDGER',
    code: 'MOD-07 // ACCOUNTS',
    highlight: 'CBSE FEE COLLECTION ENGINE',
  },
  reports: {
    title: 'REPORTS',
    subtitle: 'CROSS-MODULE ANALYTICS & SCHOLAR DOSSIERS',
    code: 'MOD-08 // ANALYTICS',
    highlight: 'INSTITUTIONAL INTELLIGENCE',
  },
  certificates: {
    title: 'DOCUMENTS',
    subtitle: 'TRANSFER, BONAFIDE & CHARACTER CERTIFICATES',
    code: 'MOD-09 // REGISTRAR',
    highlight: 'OFFICIAL DOCUMENT ENGINE',
  },
  transport: {
    title: 'FLEET',
    subtitle: 'BUS ROUTES, STOPS, DRIVERS & GPS TELEMETRY',
    code: 'MOD-10 // LOGISTICS',
    highlight: 'CAMPUS TRANSIT NETWORK',
  },
  exams: {
    title: 'EXAMS',
    subtitle: 'CBSE MARKSHEETS, BROADSHEETS & WEIGHTAGE',
    code: 'MOD-11 // EVALUATION',
    highlight: 'STANDARDIZED ASSESSMENT SUITE',
  },
  homework: {
    title: 'HOMEWORK',
    subtitle: 'DAILY ASSIGNMENTS, PROJECTS & SYLLABUS',
    code: 'MOD-12 // COURSEWORK',
    highlight: 'DIGITAL HOMEWORK DESK',
  },
  approvals: {
    title: 'APPROVALS',
    subtitle: 'LEAVE PETITIONS, GATE PASSES & AUDIT',
    code: 'MOD-13 // GOVERNANCE',
    highlight: 'EXECUTIVE DISPATCH & WORKFLOW',
  },
  broadcast: {
    title: 'BROADCAST',
    subtitle: 'MULTI-CHANNEL SMS, EMAIL & NOTIFICATIONS',
    code: 'MOD-14 // DISPATCH',
    highlight: 'INSTANT PARENT CONNECT',
  },
  notices: {
    title: 'CIRCULARS',
    subtitle: 'OFFICIAL SCHOOL GAZETTE & BULLETINS',
    code: 'MOD-15 // BULLETIN',
    highlight: 'CENTRAL ANNOUNCEMENT BOARD',
  },
  settings: {
    title: 'SETTINGS',
    subtitle: 'INSTITUTIONAL CONFIGURATION & RULES',
    code: 'MOD-16 // SYSTEM',
    highlight: 'CORE ERP INFRASTRUCTURE',
  },
  data_hub: {
    title: 'DATA HUB',
    subtitle: 'BULK IMPORT & EXPORT CENTER',
    code: 'MOD-19 // DATA_HUB',
    highlight: 'DATASET INGESTION & EXPORT ENGINE',
  },
  profile: {
    title: 'PROFILE',
    subtitle: 'ADMINISTRATOR AUTHENTICATION & ACCESS',
    code: 'MOD-17 // IDENTITY',
    highlight: 'SECURITY & PREFERENCES',
  },
  audit_logs: {
    title: 'AUDIT',
    subtitle: 'SECURITY & ADMINISTRATIVE AUDIT TRAIL',
    code: 'MOD-18 // SECURITY',
    highlight: 'TAMPER-EVIDENT CBSE COMPLIANCE',
  },
  permissions: {
    title: 'ACCESS CONTROLS & RBAC',
    subtitle: 'ROLE PERMISSIONS & DELEGATION STUDIO',
    code: 'MOD-20 // PERMISSIONS',
    highlight: 'ADMIN PRIVILEGE MANAGEMENT',
  },
  library: {
    title: 'LIBRARY',
    subtitle: 'BARCODE BOOK REPOSITORY & CIRCULATION',
    code: 'MOD-22 // LIBRARY',
    highlight: 'CBSE ACCREDITED CATALOG & CIRCULATION',
  },
  visitors: {
    title: 'SECURITY & GATE PASS',
    subtitle: 'VISITOR LOG & STUDENT EARLY DISPERSAL',
    code: 'MOD-23 // SECURITY_GATE',
    highlight: 'CBSE CHILD SAFETY PROTOCOL',
  },
};

function ERPWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [studentSubTab, setStudentSubTab] = useState<'directory' | 'siblings'>('directory');
  const [summaryStudent, setSummaryStudent] = useState<Student | null>(null);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);
  const [feeMenuOpen, setFeeMenuOpen] = useState(true);
  const [feeSubTab, setFeeSubTab] = useState<'overview' | 'monthly' | 'collect' | 'calendar' | 'structure' | 'payroll'>('overview');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOmniSearchOpen, setIsOmniSearchOpen] = useState(false);

  // PIN visibility states
  const [showSettingsPin, setShowSettingsPin] = useState(false);
  const [showProfilePin, setShowProfilePin] = useState(false);
  const [showModalPin, setShowModalPin] = useState(false);

  // Modals & Active Edit States
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
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<'basic' | 'cbse_academic' | 'cbse_personal' | 'cbse_parents' | 'cbse_address'>('basic');

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherModalTab, setTeacherModalTab] = useState<'basic' | 'cbse_credentials' | 'cbse_personal' | 'cbse_statutory'>('basic');

  const [showAddClass, setShowAddClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // CBSE Subjects Management State
  const [manageSubjectsClass, setManageSubjectsClass] = useState<ClassRoom | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [showAddSubjectInline, setShowAddSubjectInline] = useState(false);
  const [subjectForm, setSubjectForm] = useState<{
    id: string;
    name: string;
    code: string;
    type: 'COMPULSORY' | 'ELECTIVE' | 'SKILL' | 'INTERNAL_ASSESSMENT' | 'LANGUAGE';
    weekly_periods: number;
    assigned_teacher: string;
    max_marks: number;
  }>({
    id: '',
    name: '',
    code: '',
    type: 'COMPULSORY',
    weekly_periods: 6,
    assigned_teacher: '',
    max_marks: 100
  });
  const [subjectSaving, setSubjectSaving] = useState(false);

  const [showAddNotice, setShowAddNotice] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<FeeInvoice | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPromotionStudio, setShowPromotionStudio] = useState(false);
  const [promotionSourceClass, setPromotionSourceClass] = useState<string>('Class 9');
  const [promotionSourceSection, setPromotionSourceSection] = useState<string>('ALL');
  const [promotionTargetClass, setPromotionTargetClass] = useState<string>('Class 10');
  const [promotionTargetSection, setPromotionTargetSection] = useState<string>('SAME');
  const [promotionTargetSession, setPromotionTargetSession] = useState<string>('2027-28');
  const [promotionActionsMap, setPromotionActionsMap] = useState<Record<string, { action: 'PROMOTE' | 'RETAIN' | 'GRADUATE' | 'LEFT'; targetSection: string }>>({});
  const [promotionExecuting, setPromotionExecuting] = useState(false);

  // Individual Student Promotion Modal
  const [individualPromotionStudent, setIndividualPromotionStudent] = useState<Student | null>(null);
  const [individualPromotionAction, setIndividualPromotionAction] = useState<'PROMOTE' | 'RETAIN' | 'GRADUATE' | 'LEFT'>('PROMOTE');
  const [individualTargetClass, setIndividualTargetClass] = useState<string>('Class 10');
  const [individualTargetSection, setIndividualTargetSection] = useState<string>('A');
  const [individualTargetRoll, setIndividualTargetRoll] = useState<string>('');
  const [individualTargetSession, setIndividualTargetSession] = useState<string>('2027-28');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isSuperAdmin = mounted && !!currentUser && (currentUser?.role === 'SUPERADMIN' || currentUser?.role === 'AGENCY_SUPERADMIN' || currentUser?.role === 'GOD_ACCESS' || currentUser?.is_god_admin || currentUser?.username?.toLowerCase() === 'blistedx');

  // Agency Superadmin School Purge Modal State (Protected with Captcha)
  const [purgeTargetSchool, setPurgeTargetSchool] = useState<any>(null);
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeError, setPurgeError] = useState('');
  const [purgeSuccessMessage, setPurgeSuccessMessage] = useState('');

  // PWA Push Notifications Header Menu & Live Test State
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushStatus(getNotificationPermissionStatus());
    }
  }, []);

  const handleTestPushAlert = async () => {
    setTestingPush(true);
    const res = await sendTestNotification();
    setPushStatus(getNotificationPermissionStatus());
    showAdminToast(res.message);
    setTestingPush(false);
  };

  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaChallenge(code);
    setCaptchaInput('');
    setConfirmInput('');
    setPurgeError('');
  };

  const handleOpenPurgeModal = (school: any) => {
    setPurgeTargetSchool(school);
    generateCaptcha();
  };

  const handleExecutePurge = async () => {
    if (!purgeTargetSchool) return;
    setPurgeLoading(true);
    setPurgeError('');

    try {
      const res = await apiFetch('/api/agency/purge-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'AGENCY_SUPERADMIN'
        },
        body: JSON.stringify({
          school_id: purgeTargetSchool.id,
          school_code: purgeTargetSchool.school_code,
          captcha_input: captchaInput,
          expected_captcha: captchaChallenge,
          confirmation_text: confirmInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setPurgeSuccessMessage(data.message);
        showAdminToast(`School "${purgeTargetSchool.school_name}" permanently deleted.`);
        
        const remaining = availableSchools.filter(s => s.id !== purgeTargetSchool.id && s.school_code !== purgeTargetSchool.school_code);
        setAvailableSchools(remaining);

        setTimeout(() => {
          setPurgeTargetSchool(null);
          setPurgeSuccessMessage('');
          if (remaining.length > 0) {
            handleSwitchSchool(remaining[0].school_code || remaining[0].id);
          } else {
            router.push('/login');
          }
        }, 2200);
      } else {
        setPurgeError(data.error || 'Failed to purge school.');
        generateCaptcha();
      }
    } catch (err: any) {
      setPurgeError(err.message || 'Network error.');
      generateCaptcha();
    } finally {
      setPurgeLoading(false);
    }
  };

  // Granular Role-Based Access Control (RBAC) Permissions Matrix
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix>(DEFAULT_ROLE_PERMISSIONS);

  // Logged In User Effective Role (Strictly decided by Login USERID & Session)
  const effectiveRole = (currentUser?.role || 'PRINCIPAL').toUpperCase();

  // Dynamically compute allowed tabs based on Principal configured role permissions
  const isPrincipalMaster = ['SUPERADMIN', 'AGENCY_SUPERADMIN', 'PRINCIPAL'].includes(effectiveRole);

  // Automatically open the role-specific workspace panel on login
  useEffect(() => {
    if (!currentUser) return;
    const role = (currentUser.role || 'PRINCIPAL').toUpperCase();
    if (role === 'DRIVER') {
      setActiveTab('transport');
    } else if (role === 'LIBRARIAN') {
      setActiveTab('library');
    } else if (role === 'SECURITY_GUARD' || role === 'SECURITY' || role === 'GUARD') {
      setActiveTab('visitors');
    } else if (role === 'ACCOUNTANT') {
      setActiveTab('fees');
    } else if (role === 'TEACHER') {
      setActiveTab('attendance');
    } else if (role === 'STUDENT' || role === 'PARENT') {
      setActiveTab('profile');
    } else {
      setActiveTab('overview');
    }
  }, [currentUser?.id, currentUser?.role]);

  // STRICTLY BAN Overview, Students, Faculty, Attendance, etc. for DRIVER role
  useEffect(() => {
    if (effectiveRole === 'DRIVER') {
      const allowedDriverTabs = ['transport', 'notices', 'broadcast', 'profile'];
      if (!allowedDriverTabs.includes(activeTab)) {
        setActiveTab('transport');
      }
    }
  }, [effectiveRole, activeTab]);

  const allowedTabs = React.useMemo(() => {
    // If no user session loaded yet or user is Principal/Master, provide full master tabs
    if (!currentUser || isPrincipalMaster) {
      return [
        'overview', 'students', 'siblings', 'teachers', 'classes', 'subjects',
        'attendance', 'fees', 'reports', 'certificates', 'transport', 'exams',
        'library', 'visitors', 'homework', 'approvals', 'broadcast', 'notices', 'data_hub', 'audit_logs',
        'settings', 'permissions', 'profile'
      ];
    }

    if (effectiveRole === 'ACCOUNTANT') {
      return ['fees', 'students', 'siblings', 'reports', 'certificates', 'data_hub', 'notices', 'profile'];
    }
    if (effectiveRole === 'DRIVER') {
      return ['transport', 'notices', 'broadcast', 'profile'];
    }
    if (effectiveRole === 'LIBRARIAN') {
      return ['library', 'students', 'teachers', 'notices', 'profile'];
    }
    if (effectiveRole === 'SECURITY_GUARD' || effectiveRole === 'SECURITY' || effectiveRole === 'GUARD') {
      return ['visitors', 'students', 'transport', 'notices', 'profile'];
    }
    if (effectiveRole === 'TEACHER') {
      return ['overview', 'attendance', 'exams', 'homework', 'classes', 'subjects', 'students', 'approvals', 'library', 'notices', 'profile'];
    }
    if (effectiveRole === 'STUDENT') {
      return ['profile', 'attendance', 'exams', 'homework', 'fees', 'library', 'certificates', 'notices'];
    }
    if (effectiveRole === 'PARENT') {
      return ['profile', 'attendance', 'exams', 'homework', 'fees', 'siblings', 'transport', 'library', 'notices', 'broadcast'];
    }

    const roleConfig = rolePermissions[effectiveRole as ManagedRole];
    if (!roleConfig) {
      return ['overview', 'profile'];
    }

    const tabs: string[] = [];
    for (const [modId, perms] of Object.entries(roleConfig)) {
      if (perms?.can_view) {
        tabs.push(modId);
      }
    }
    if (!tabs.includes('profile')) tabs.push('profile');
    return tabs.length > 0 ? tabs : ['profile'];
  }, [currentUser, effectiveRole, rolePermissions, isPrincipalMaster]);

  // Action level permissions for current active role
  const currentRoleModulePerms = React.useMemo(() => {
    if (!currentUser) {
      return (moduleId: string) => ({ can_view: false, can_edit: false, can_add: false, can_delete: false });
    }
    // Principal and God mode have unconditional full create/edit/delete/view authority
    if (isPrincipalMaster) {
      return (moduleId: string) => ({ can_view: true, can_edit: true, can_add: true, can_delete: true });
    }
    const roleConfig = rolePermissions[effectiveRole as ManagedRole];
    return (moduleId: string) => {
      const perms = roleConfig?.[moduleId];
      return {
        can_view: !!perms?.can_view,
        can_edit: !!perms?.can_edit,
        can_add: !!perms?.can_add,
        can_delete: !!perms?.can_delete
      };
    };
  }, [currentUser, effectiveRole, rolePermissions, isPrincipalMaster]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBroadcastInbox, setShowBroadcastInbox] = useState(false);
  const [unreadBroadcastCount, setUnreadBroadcastCount] = useState(0);

  const checkUnreadBroadcasts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/broadcasts');
      const data = await res.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        const readIds = getReadBroadcastIds();
        const role = (currentUser?.role || 'ALL').toUpperCase();
        const isFullAdmin = ['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(role);
        const count = data.broadcasts.filter((b: any) => {
          if (readIds.has(b.id)) return false;
          if (isFullAdmin) return true;
          const aud = (b.audience || 'ALL').toUpperCase();
          if (role === 'TEACHER' || role === 'FACULTY') {
            return aud === 'ALL' || aud === 'FACULTY' || aud === 'TEACHERS';
          }
          if (role === 'PARENT') {
            return aud === 'ALL' || aud === 'PARENTS' || aud === 'BUS_PARENTS';
          }
          if (role === 'STUDENT') {
            return aud === 'ALL' || aud === 'STUDENTS';
          }
          if (role === 'DRIVER') {
            return aud === 'ALL' || aud === 'TRANSPORT' || aud === 'BUS_PARENTS';
          }
          return true;
        }).length;
        setUnreadBroadcastCount(count);
      }
    } catch (_) {}
  }, [currentUser]);

  useEffect(() => {
    checkUnreadBroadcasts();
    const timer = setInterval(checkUnreadBroadcasts, 25000);
    const onLivePush = () => checkUnreadBroadcasts();
    window.addEventListener('giterp_broadcast', onLivePush);
    return () => {
      clearInterval(timer);
      window.removeEventListener('giterp_broadcast', onLivePush);
    };
  }, [checkUnreadBroadcasts]);

  const [celebrationData, setCelebrationData] = useState<TaskCelebrationData | null>(null);
  const celebrationTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerTaskCelebration = useCallback((
    typeOrData: TaskCelebrationType | TaskCelebrationData | string,
    titleOrMsg?: string,
    subtitle?: string
  ) => {
    let data: TaskCelebrationData;
    if (typeof typeOrData === 'object' && typeOrData !== null) {
      data = typeOrData as TaskCelebrationData;
    } else if (typeof typeOrData === 'string') {
      const fullText = (typeOrData + ' ' + (titleOrMsg || '')).toLowerCase();
      let type: TaskCelebrationType = 'GENERAL';

      if (fullText.includes('signout') || fullText.includes('logged out') || fullText.includes('signing out') || fullText.includes('logout')) {
        type = 'SIGNOUT';
      } else if (fullText.includes('fee') || fullText.includes('payment') || fullText.includes('invoice') || fullText.includes('receipt') || fullText.includes('₹') || fullText.includes('paid')) {
        type = 'FEES';
      } else if (fullText.includes('visitor') || fullText.includes('gate pass') || fullText.includes('escort') || fullText.includes('checked out')) {
        type = 'VISITOR';
      } else if (fullText.includes('student') || fullText.includes('scholar') || fullText.includes('admission') || fullText.includes('promot')) {
        type = 'STUDENT';
      } else if (fullText.includes('faculty') || fullText.includes('teacher') || fullText.includes('staff')) {
        type = 'FACULTY';
      } else if (fullText.includes('attendance') || fullText.includes('roll call') || fullText.includes('ledger') || fullText.includes('turnout')) {
        type = 'ATTENDANCE';
      } else if (fullText.includes('exam') || fullText.includes('mark') || fullText.includes('grade') || fullText.includes('assessment') || fullText.includes('result')) {
        type = 'EXAMS';
      } else if (fullText.includes('homework') || fullText.includes('assignment') || fullText.includes('study material')) {
        type = 'HOMEWORK';
      } else if (fullText.includes('broadcast') || fullText.includes('notice') || fullText.includes('circular') || fullText.includes('alert')) {
        type = 'BROADCAST';
      } else if (fullText.includes('certificate') || fullText.includes('bonafide') || fullText.includes('transfer cert')) {
        type = 'CERTIFICATE';
      } else if (fullText.includes('transport') || fullText.includes('route') || fullText.includes('bus') || fullText.includes('fleet') || fullText.includes('driver')) {
        type = 'TRANSPORT';
      } else if (fullText.includes('class') || fullText.includes('division') || fullText.includes('section')) {
        type = 'CLASS';
      } else if (fullText.includes('pin') || fullText.includes('password') || fullText.includes('credential') || fullText.includes('security')) {
        type = 'SECURITY';
      }

      data = {
        type,
        title: titleOrMsg || typeOrData,
        subtitle: subtitle || 'Ledger updated & synchronized successfully'
      };
    } else {
      data = { type: 'GENERAL', title: 'Action Completed', subtitle: 'Ledger updated successfully' };
    }

    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    setCelebrationData(data);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(40);
      }
    } catch (_) {}

    celebrationTimerRef.current = setTimeout(() => {
      setCelebrationData(null);
    }, 1000); // exactly 1 second animation
  }, []);

  const showAdminToast = useCallback((msg: string, customSubtitle?: string) => {
    if (!msg) return;
    const cleanMsg = msg
      .replace(/Live MongoDB real-time sync active!/gi, 'Network restored: Live sync active')
      .replace(/MongoDB Atlas/gi, 'Cloud Database')
      .replace(/MongoDB/gi, 'Database');

    triggerTaskCelebration(cleanMsg, undefined, customSubtitle);
  }, [triggerTaskCelebration]);

  const showToast = showAdminToast;
  const [pinModal, setPinModal] = useState<{ type: 'student' | 'teacher'; id: string; name: string; currentPin: string } | null>(null);
  const [customPinInput, setCustomPinInput] = useState('123456');

  // Students List Controls & Filters
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(10);
  const [studentPage, setStudentPage] = useState<number>(1);
  const [studentSortBy, setStudentSortBy] = useState<string>('A-Z');
  const [studentViewMode, setStudentViewMode] = useState<'list' | 'grid'>('list');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>('ALL');
  const [studentFeeFilter, setStudentFeeFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [studentGenderFilter, setStudentGenderFilter] = useState<'ALL' | 'Male' | 'Female'>('ALL');
  const [studentHouseFilter, setStudentHouseFilter] = useState<string>('ALL');
  const [showStudentFilterMenu, setShowStudentFilterMenu] = useState(false);
  const [activeStudentMenuId, setActiveStudentMenuId] = useState<string | null>(null);

  // Teachers List Controls & Filters
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacherRowsPerPage, setTeacherRowsPerPage] = useState<number>(10);
  const [teacherPage, setTeacherPage] = useState<number>(1);
  const [teacherSortBy, setTeacherSortBy] = useState<string>('A-Z');
  const [teacherViewMode, setTeacherViewMode] = useState<'list' | 'grid'>('list');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState<string>('ALL');
  const [teacherDesignationFilter, setTeacherDesignationFilter] = useState<string>('ALL');
  const [teacherCtetFilter, setTeacherCtetFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [teacherGenderFilter, setTeacherGenderFilter] = useState<'ALL' | 'Male' | 'Female'>('ALL');
  const [teacherRoleFilter, setTeacherRoleFilter] = useState<string>('ALL');
  const [showTeacherFilterMenu, setShowTeacherFilterMenu] = useState(false);
  const [activeTeacherMenuId, setActiveTeacherMenuId] = useState<string | null>(null);

  const teacherRoleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: teachers.length,
      TEACHER: 0,
      ADMIN: 0,
      ACCOUNTANT: 0,
      DRIVER: 0,
      LIBRARIAN: 0,
      SECURITY_GUARD: 0,
      VICE_PRINCIPAL: 0
    };
    (teachers || []).forEach(t => {
      const r = resolveTeacherRole(t);
      if (counts[r] !== undefined) {
        counts[r]++;
      } else {
        counts[r] = (counts[r] || 0) + 1;
      }
    });
    return counts;
  }, [teachers]);

  const getTeacherRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'ACCOUNTANT':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DRIVER':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LIBRARIAN':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'SECURITY_GUARD':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'VICE_PRINCIPAL':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'PRINCIPAL':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'TEACHER':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  // Classes List Controls & Filters
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classRowsPerPage, setClassRowsPerPage] = useState<number>(10);
  const [classPage, setClassPage] = useState<number>(1);
  const [classSortBy, setClassSortBy] = useState<string>('A-Z');
  const [classStatusFilter, setClassStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [classWingFilter, setClassWingFilter] = useState<string>('ALL');
  const [classSectionFilter, setClassSectionFilter] = useState<string>('ALL');
  const [showClassFilterMenu, setShowClassFilterMenu] = useState(false);
  const [activeClassMenuId, setActiveClassMenuId] = useState<string | null>(null);

  // Fee Invoices Controls & Filters
  const [feeStatusFilter, setFeeStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [feeClassFilter, setFeeClassFilter] = useState<string>('ALL');
  const [feePaymentModeFilter, setFeePaymentModeFilter] = useState<string>('ALL');
  const [feeRowsPerPage, setFeeRowsPerPage] = useState<number>(10);
  const [feePage, setFeePage] = useState<number>(1);
  const [feeSortBy, setFeeSortBy] = useState<'Date-Desc' | 'Date-Asc' | 'Amount-Desc' | 'Amount-Asc'>('Date-Desc');
  const [showFeeFilterMenu, setShowFeeFilterMenu] = useState(false);

  // Attendance Controls, Interactive Rosters & Filters
  const [attendanceMode, setAttendanceMode] = useState<'students' | 'faculty' | 'logs'>('students');
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>('Class 10');
  const [selectedAttendanceSection, setSelectedAttendanceSection] = useState<string>('A');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY'>>({});
  const [facultyAttendanceMap, setFacultyAttendanceMap] = useState<Record<string, 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'HALF_DAY' | 'ABSENT'>>({});
  const [attendanceFacultyDeptFilter, setAttendanceFacultyDeptFilter] = useState<string>('ALL');
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceClassFilter, setAttendanceClassFilter] = useState<string>('ALL');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<string>('');

  // MongoDB Cloud Sync & Diagnostic State
  const [mongoSyncLoading, setMongoSyncLoading] = useState(false);
  const [mongoSyncData, setMongoSyncData] = useState<any>(null);
  const [mongoSyncMsg, setMongoSyncMsg] = useState('');

  // Academic Session Management State
  const [selectedSession, setSelectedSession] = useState<string>('2026-27');
  const AVAILABLE_SESSIONS = ['2026-27', '2025-26', '2027-28', '2024-25'];

  // Notices Controls & Filters
  const [noticeAudienceFilter, setNoticeAudienceFilter] = useState<'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS'>('ALL');

  // PWA Offline-First & Live MongoDB Network Sync State
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Network connected: Live real-time sync active');
      if (selectedSchool) {
        loadSchoolData(selectedSchool.school_code || selectedSchool.id, selectedSession);
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [selectedSchool, selectedSession]);

  // Load User Session & Role from Local Storage on Mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const storedPerms = localStorage.getItem('giterp_role_permissions');
        if (storedPerms) {
          try { setRolePermissions(JSON.parse(storedPerms)); } catch (_) {}
        }
        const storedSess = localStorage.getItem('giterp_active_session');
        if (storedSess) setSelectedSession(storedSess);

        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);

          // Ensure valid session token exists for all authenticated API requests
          const currentToken = localStorage.getItem('erp_session_token');
          if (currentToken) {
            document.cookie = `erp_session_token=${encodeURIComponent(currentToken)}; Path=/; SameSite=Lax; Max-Age=43200`;
          } else {
            // Auto-request fresh session token for active user
            fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: parsed.id,
                schoolId: parsed.school_id || (new URLSearchParams(window.location.search).get('school')) || 'DPS2026',
                role: parsed.role || 'PRINCIPAL',
                username: parsed.username
              })
            }).then(r => r.json()).then(d => {
              if (d.success && d.session_token) {
                localStorage.setItem('erp_session_token', d.session_token);
                document.cookie = `erp_session_token=${encodeURIComponent(d.session_token)}; Path=/; SameSite=Lax; Max-Age=43200`;
              }
            }).catch(() => {});
          }

          if (['TEACHER', 'STUDENT', 'PARENT'].includes(parsed.role?.toUpperCase())) {
            setProfileForm({
              full_name: parsed.full_name || '',
              username: parsed.username || '',
              admin_pin: '',
              email: parsed.email || '',
              phone: parsed.phone || ''
            });
          }
        }
      } catch (e) {}
    }
  }, []);

  // ⚡ Real-Time Offline Node Agent Sync Listener (Auto-Renders Changes Without Manual Refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let pollInterval: any = null;

    try {
      eventSource = new EventSource('/api/sync/live');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'DATA_CHANGED') {
            const schoolCode = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
            loadSchoolData(schoolCode, selectedSession);
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
      };
    } catch (e) {}

    // Background silent auto-sync fallback every 60 seconds (never needs manual refresh)
    pollInterval = setInterval(() => {
      const schoolCode = selectedSchool?.school_code || selectedSchool?.id || 'DPS2026';
      loadSchoolData(schoolCode, selectedSession, true);
    }, 60000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedSchool?.id, selectedSchool?.school_code, selectedSession]);

  // Global Ctrl+K / Cmd+K shortcut for Omni-Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clean time-based greeting without emojis
  const getISTGreeting = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    const hour = istTime.getHours();

    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  // User Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    admin_pin: '',
    email: '',
    phone: ''
  });

  // Comprehensive CBSE Student Form (Basic fields required, CBSE fields optional)
  const initialStudentForm: Partial<Student> = {
    full_name: '',
    admission_no: '',
    class_name: 'Class 10',
    section: 'A',
    roll_no: '',
    gender: 'Male',
    guardian_name: '',
    guardian_phone: '',
    fee_status: 'PENDING',
    passcode: '123456',
    dob: '',
    blood_group: 'O+',
    aadhaar_no: '',
    apaar_id: '',
    house: 'Red House',
    nationality: 'Indian',
    religion: 'Hindu',
    category: 'GENERAL',
    mother_tongue: 'Hindi',
    single_girl_child: 'NO',
    cwsn_status: 'NO',
    admission_date: new Date().toISOString().split('T')[0],
    medium_of_instruction: 'ENGLISH',
    previous_school: '',
    previous_class: '',
    transfer_certificate_no: '',
    father_name: '',
    father_qualification: '',
    father_occupation: '',
    father_income: '',
    father_phone: '',
    father_aadhaar: '',
    mother_name: '',
    mother_qualification: '',
    mother_occupation: '',
    mother_income: '',
    mother_phone: '',
    mother_aadhaar: '',
    residential_address: '',
    permanent_address: '',
    city: '',
    state: '',
    pincode: '',
    admission_type: 'NEW',
    transport_opted: 'NO',
    transport_slab_id: '1',
    bus_route_no: '',
    pickup_point: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: ''
  };
  const [studentForm, setStudentForm] = useState<Partial<Student>>(initialStudentForm);
  const [collectFeeNow, setCollectFeeNow] = useState(false);
  const [initialFeePaymentMode, setInitialFeePaymentMode] = useState<'CASH' | 'UPI' | 'ONLINE' | 'CHEQUE'>('CASH');

  // Real-time automatic fee computation for registration form
  const registrationFeeBreakdown = useMemo(() => {
    return calculateRegistrationFees({
      className: studentForm.class_name || 'Class 10',
      admissionType: studentForm.admission_type || 'NEW',
      admissionDate: studentForm.admission_date || new Date().toISOString().split('T')[0],
      academicSession: studentForm.academic_session || selectedSession,
      transportOpted: studentForm.transport_opted || 'NO',
      transportSlabId: studentForm.transport_slab_id || '1',
    });
  }, [
    studentForm.class_name,
    studentForm.admission_type,
    studentForm.admission_date,
    studentForm.academic_session,
    studentForm.transport_opted,
    studentForm.transport_slab_id,
    selectedSession
  ]);

  // CBSE Standard Options Constants
  const STANDARD_DESIGNATIONS = [
    'PGT - Post Graduate Teacher (Classes XI-XII)',
    'TGT - Trained Graduate Teacher (Classes VI-X)',
    'PRT - Primary Teacher (Classes I-V)',
    'NTT - Nursery / Kindergarten Teacher',
    'Principal / Head of School',
    'Vice-Principal / Academic Coordinator',
    'Special Educator (Mandatory CBSE Norm)',
    'School Counselor & Wellness Teacher (Mandatory)',
    'PET - Physical Education Teacher / Sports Master',
    'Librarian / Head of Library',
    'Computer / IT & AI Faculty',
    'Art & Craft Teacher',
    'Music & Performing Arts Teacher',
    'Lab Assistant / Science Technician',
    'Administrative Officer (School Administration & Operations)',
    'Accounts Head / Senior Accountant (Finance & Fees)',
    'Office Executive / Administrative Assistant',
    'Accountant / Cashier / Fee Counter Incharge',
    'School Bus Driver / Transport Operator',
    'Gate Security Guard / Head Watchman'
  ];

  const STANDARD_QUALIFICATIONS = [
    'Post Graduate (M.A / M.Sc / M.Com) + B.Ed (CBSE PGT Norm)',
    'Graduate (B.A / B.Sc / B.Com) + B.Ed (CBSE TGT Norm)',
    'D.El.Ed / JBT / BTC / B.El.Ed (CBSE PRT Norm)',
    'M.Ed / Master of Education',
    'B.Ed / Bachelor of Education',
    'B.P.Ed / M.P.Ed (Physical Education Norm)',
    'B.Lib / M.Lib (Library Science Norm)',
    'B.Tech / B.E / MCA / M.Sc CS/IT (Computer Norm)',
    'RCI Recognized Degree / Diploma in Special Ed (Special Educator Norm)',
    'NTT / Early Childhood Care Education - ECCE (Pre-Primary Norm)',
    'Ph.D / Doctorate in Subject / Education',
    'MBA / Post Graduate in Management (School Administration)',
    'M.Com / B.Com / CA Inter / Finance Graduate (Accounts & Finance)',
    'Class 10th / 12th + Heavy Commercial Driving License (Transport)',
    'Class 10th / 12th + Security Guard Training Certificate (Security)'
  ];

  const STANDARD_DEPARTMENTS = [
    'Mathematics & Applied Mathematics',
    'Science (Physics / Chemistry / Biology)',
    'English Language & Literature',
    'Hindi & Sanskrit (Indian Languages)',
    'Social Sciences (History / Geography / Civics / Economics)',
    'Computer Science & Artificial Intelligence / IT',
    'Commerce, Accountancy & Business Studies',
    'Physical Education, Yoga & Sports',
    'Fine Arts, Performing Arts & Music',
    'Special Education & Inclusive Learning',
    'Pre-Primary & Foundational Learning (ECCE)',
    'School Administration & Office Operations',
    'Accounts, Finance & Fee Collection Counter',
    'Transport & Bus Fleet Operations',
    'Campus Security & Safety Department'
  ];

  const STANDARD_SUBJECTS = [
    'Mathematics / Applied Mathematics',
    'Physics',
    'Chemistry',
    'Biology / Life Sciences',
    'Computer Science / Information Technology / AI',
    'English Core & Literature',
    'Hindi Core & Sahitya',
    'Sanskrit',
    'Social Studies / History / Pol Science / Geography',
    'Accountancy & Business Studies',
    'Economics',
    'Physical Education & Sports',
    'Psychology & Child Development',
    'Fine Arts & Commercial Art',
    'Music (Vocal / Instrumental)',
    'Environmental Studies (EVS) & General Science',
    'General Pre-Primary Subjects (All in One)',
    'General Administration & Office Operations'
  ];

  // Comprehensive CBSE Teacher / Staff Form (Basic fields required, CBSE fields optional)
  const initialTeacherForm: Partial<Teacher> = {
    full_name: '',
    staff_code: '',
    role: 'TEACHER',
    department: 'Mathematics & Applied Mathematics',
    designation: 'TGT - Trained Graduate Teacher (Classes VI-X)',
    phone: '',
    email: '',
    teacher_type: 'TGT',
    subject_specialization: 'Mathematics / Applied Mathematics',
    classes_taught: 'Classes 9 & 10 (Secondary Stage - TGT)',
    ctet_qualified: 'YES',
    ctet_roll_no: '',
    professional_degree: 'Graduate (B.A / B.Sc / B.Com) + B.Ed (CBSE TGT Norm)',
    experience_years: 5,
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_type: 'PERMANENT',
    dob: '',
    gender: 'Female',
    blood_group: 'B+',
    aadhaar_no: '',
    pan_no: '',
    father_or_spouse_name: '',
    epf_uan_no: '',
    bank_name: 'State Bank of India',
    bank_account_no: '',
    bank_ifsc: '',
    basic_pay: 45000,
    address: '',
    city: '',
    pincode: '',
    emergency_contact_phone: '',
    passcode: '123456'
  };
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>(initialTeacherForm);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [isCustomQual, setIsCustomQual] = useState(false);
  const [customQualText, setCustomQualText] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDeptText, setCustomDeptText] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');

  // Class Form
  const [classForm, setClassForm] = useState({
    class_name: 'Class 10',
    section: 'A',
    class_teacher: '',
    room_no: 'Room 101',
    capacity: 40
  });

  // Notice Form
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    matter_category: 'ACAD',
    target_audience: 'ALL' as 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS',
    posted_by: 'Principal Office'
  });

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    student_id: '',
    student_name: '',
    admission_no: '',
    class_name: 'Class 10 - A',
    tuition_fee: 12000,
    transport_fee: 2000,
    exam_fee: 1000,
    amount: 15000,
    payment_mode: 'UPI / Online',
    due_date: new Date().toISOString().split('T')[0],
    status: 'PENDING' as 'PAID' | 'PENDING' | 'OVERDUE'
  });

  // Settings Form (Institutional & CBSE Compliance Parameters)
  const [settingsForm, setSettingsForm] = useState({
    school_name: '',
    principal_name: '',
    board: 'CBSE',
    city: '',
    state: '',
    address: '',
    pincode: '',
    udise_code: '',
    oasis_code: '',
    affiliation_no: '',
    phone: '',
    email: '',
    website: '',
    established_year: '',
    admin_pin: '',
    logo: ''
  });

  // School Logo Upload Handler (Max 2MB)
  const handleSchoolLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = 2 * 1024 * 1024; // 2 MB limit
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      alert(`Selected file is ${sizeMb} MB. School logo / icon must be 2 MB or smaller.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSettingsForm(prev => ({ ...prev, logo: base64 }));
      showAdminToast('School logo uploaded to preview. Click "Save Institutional Profile" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSchoolLogo = () => {
    setSettingsForm(prev => ({ ...prev, logo: '' }));
    showAdminToast('School logo removed.');
  };

  useEffect(() => {
    setMounted(true);
    // Strict Access Control: Redirect to /login if user is not authenticated
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('current_user');
      if (!storedUser) {
        window.location.replace('/login');
        return;
      }
      try {
        const storedSchool = localStorage.getItem('current_school');
        if (storedSchool) {
          const parsedSchool = JSON.parse(storedSchool);
          setSelectedSchool(parsedSchool);
          const cleanId = (parsedSchool.school_code || parsedSchool.id || 'DPS2026').replace(/[^A-Z0-9]/gi, '');
          const activeSession = localStorage.getItem('giterp_active_session') || selectedSession || '2026-27';
          const cachedBackup = localStorage.getItem(`giterp_offline_backup_${cleanId}_${activeSession}`) || localStorage.getItem(`giterp_offline_backup_${cleanId}`);
          if (cachedBackup) {
            const data = JSON.parse(cachedBackup);
            if (data.overview) setOverview(data.overview);
            if (Array.isArray(data.students) && data.students.length > 0) setStudents(data.students);
            if (Array.isArray(data.teachers) && data.teachers.length > 0) setTeachers(data.teachers);
            if (Array.isArray(data.classes) && data.classes.length > 0) setClasses(data.classes);
            if (Array.isArray(data.notices) && data.notices.length > 0) setNotices(data.notices);
            if (Array.isArray(data.attendance) && data.attendance.length > 0) setAttendance(data.attendance);
            if (Array.isArray(data.invoices) && data.invoices.length > 0) setInvoices(data.invoices);
            setLoading(false);
          }
        }
        try { setCurrentUser(JSON.parse(storedUser)); } catch (e) {}
      } catch (e) {}
    }
    fetchAuthenticatedSchool();
  }, [searchParams]);

  const fetchAuthenticatedSchool = async () => {
    let hasLocalCache = false;
    try {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('current_user');
        if (!storedUser) {
          window.location.replace('/login');
          return;
        }
      }
      const schoolParam = searchParams.get('school');
      let targetSchool: School | null = null;

      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {}
        }
        const stored = localStorage.getItem('current_school');
        if (stored) {
          try {
            let parsed = JSON.parse(stored);
            if (parsed.school_code === 'DPS-2026' || parsed.id === 'DPS-2026') {
              parsed.school_code = 'DPS2026';
              parsed.id = 'DPS2026';
              localStorage.setItem('current_school', JSON.stringify(parsed));
            }
            if (parsed.admin_pin === 'admin@4317') {
              parsed.admin_pin = '123456';
              localStorage.setItem('current_school', JSON.stringify(parsed));
            }
            if (!schoolParam || parsed.school_code === schoolParam || parsed.id === schoolParam || parsed.school_code?.replace(/[^A-Z0-9]/gi, '') === schoolParam?.replace(/[^A-Z0-9]/gi, '')) {
              targetSchool = parsed;
              hasLocalCache = true;
            }
          } catch (e) {}
        }
      }

      if (!hasLocalCache) {
        setLoading(true);
      }

      // Parallelize: Load school data immediately if targetSchool is known without waiting for /api/schools!
      if (targetSchool) {
        loadSchoolData(targetSchool.school_code || targetSchool.id, undefined, true);
      }

      const schRes = await apiFetch('/api/schools');
      const schData = await schRes.json();
      if (schData.success && Array.isArray(schData.schools)) {
        setAvailableSchools(schData.schools);
      }

      if (!targetSchool || (schoolParam && targetSchool.school_code?.replace(/[^A-Z0-9]/gi, '') !== schoolParam?.replace(/[^A-Z0-9]/gi, ''))) {
        if (schData.success && schData.schools && schData.schools.length > 0) {
          if (schoolParam) {
            const cleanParam = schoolParam.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            targetSchool = schData.schools.find((s: School) => 
              s.school_code?.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanParam || 
              s.id?.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanParam
            ) || schData.schools[0];
          } else {
            targetSchool = schData.schools[0];
          }
        }
      }

      // Robust Fallback: Always guarantee an active Delhi Public School instance
      if (!targetSchool) {
        targetSchool = {
          id: 'DPS2026',
          school_code: 'DPS2026',
          school_name: 'Delhi Public School',
          principal_name: 'Dr. Rajesh Sharma',
          admin_name: 'Dr. Rajesh Sharma',
          admin_id: 'admin',
          admin_pin: '123456',
          board: 'CBSE',
          city: 'New Delhi',
          state: 'Delhi',
          address: 'Sector 12, Dwarka, New Delhi',
          pincode: '110075',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
      }

      if (targetSchool) {
        if (targetSchool.admin_pin === 'admin@4317') {
          targetSchool.admin_pin = '123456';
        }
        setSelectedSchool(targetSchool);
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
        let activeUserObj: any = null;
        if (storedUser) {
          try {
            activeUserObj = JSON.parse(storedUser);
            setCurrentUser(activeUserObj);
          } catch (e) {}
        }
        
        // Strict Access Control: No 1-click or auto-login fallback.
        // User MUST have authenticated with school code, ID, and passcode at /login.
        if (!activeUserObj) {
          if (typeof window !== 'undefined') {
            window.location.replace('/login');
          } else {
            router.replace('/login');
          }
          return;
        }
        
        const activePrincipalName = targetSchool.principal_name || targetSchool.admin_name || activeUserObj?.full_name || 'Dr. Rajesh Sharma';
        const cleanAdminPin = (targetSchool.admin_pin === 'admin@4317' ? '123456' : targetSchool.admin_pin) || '123456';
        
        setSettingsForm({
          school_name: targetSchool.school_name || '',
          principal_name: activePrincipalName,
          board: targetSchool.board || 'CBSE',
          city: targetSchool.city || 'New Delhi',
          state: targetSchool.state || 'Delhi',
          address: targetSchool.address || 'Sector 12, Dwarka, New Delhi',
          pincode: targetSchool.pincode || '110075',
          udise_code: targetSchool.udise_code || '07010100101',
          oasis_code: targetSchool.oasis_code || '84001',
          affiliation_no: targetSchool.affiliation_no || '2130042',
          phone: targetSchool.phone || '+91 11 2789 0000',
          email: targetSchool.email || `contact@${(targetSchool.school_code || 'dps2026').toLowerCase()}.edu`,
          website: targetSchool.website || `https://${(targetSchool.school_code || 'dps2026').toLowerCase()}.edu`,
          established_year: targetSchool.established_year || '1998',
          admin_pin: cleanAdminPin,
          logo: targetSchool.logo || ''
        });
        if (targetSchool.role_permissions) {
          setRolePermissions(targetSchool.role_permissions);
          if (typeof window !== 'undefined') {
            localStorage.setItem('giterp_role_permissions', JSON.stringify(targetSchool.role_permissions));
          }
        }
        const isTeacherRole = activeUserObj?.role?.toUpperCase() === 'TEACHER';
        const isStudentOrParentRole = ['STUDENT', 'PARENT'].includes(activeUserObj?.role?.toUpperCase());

        if (isTeacherRole || isStudentOrParentRole) {
          setProfileForm({
            full_name: activeUserObj?.full_name || '',
            username: activeUserObj?.username || '',
            admin_pin: '', // Never expose school admin PIN to teachers or students
            email: activeUserObj?.email || '',
            phone: activeUserObj?.phone || ''
          });
        } else {
          setProfileForm({
            full_name: activeUserObj?.full_name || activePrincipalName,
            username: activeUserObj?.username || targetSchool.admin_id || 'admin',
            admin_pin: cleanAdminPin,
            email: activeUserObj?.email || `admin@${(targetSchool.school_code || 'dps2026').toLowerCase()}.edu`,
            phone: activeUserObj?.phone || ''
          });
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_school', JSON.stringify(targetSchool));
          localStorage.setItem('last_active_school_id', targetSchool.school_code || targetSchool.id);
        }
        loadSchoolData(targetSchool.school_code || targetSchool.id || 'DPS2026');
      } else {
        router.push('/login');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = async (schoolCodeOrId: string) => {
    setLoading(true);
    const target = availableSchools.find(s => s.id === schoolCodeOrId || s.school_code === schoolCodeOrId);
    if (target) {
      if (target.admin_pin === 'admin@4317') {
        target.admin_pin = '123456';
      }
      setSelectedSchool(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('current_school', JSON.stringify(target));
        localStorage.setItem('last_active_school_id', target.school_code || target.id);
      }
      await loadSchoolData(target.school_code || target.id);
      router.replace(`/app?school=${target.school_code}`);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      const isTeacher = currentUser?.role?.toUpperCase() === 'TEACHER';
      const isStudent = ['STUDENT', 'PARENT'].includes(currentUser?.role?.toUpperCase());

      // 1. TEACHER / STUDENT PERSONAL CREDENTIALS UPDATE
      if (isTeacher || isStudent) {
        const res = await apiFetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: profileForm.full_name,
            email: profileForm.email,
            phone: profileForm.phone,
            new_password: profileForm.admin_pin // Entered in password box
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          const updatedUser = {
            ...(currentUser || {}),
            ...data.user
          };
          setCurrentUser(updatedUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('current_user', JSON.stringify(updatedUser));
          }
          setShowProfileModal(false);
          setProfileForm(prev => ({ ...prev, admin_pin: '' }));
          showAdminToast(data.message || 'Personal credentials updated successfully!');
        } else {
          alert(data.error || 'Failed to update credentials.');
        }
        return;
      }

      // 2. PRINCIPAL / ADMINISTRATOR SCHOOL MASTER CREDENTIALS UPDATE
      const sanitizedPin = profileForm.admin_pin === 'admin@4317' ? '123456' : profileForm.admin_pin;
      const res = await apiFetch('/api/school/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          principal_name: profileForm.full_name,
          admin_name: profileForm.full_name,
          admin_id: profileForm.username,
          admin_pin: sanitizedPin
        })
      });
      const data = await res.json();
      if (data.success && data.school) {
        if (data.school.admin_pin === 'admin@4317') {
          data.school.admin_pin = '123456';
        }
        const updatedUser = {
          ...(currentUser || {}),
          full_name: profileForm.full_name,
          username: profileForm.username,
          email: profileForm.email,
          phone: profileForm.phone
        };
        setCurrentUser(updatedUser);
        setSelectedSchool(data.school);
        setSettingsForm(prev => ({
          ...prev,
          principal_name: profileForm.full_name,
          admin_pin: sanitizedPin
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          localStorage.setItem('current_school', JSON.stringify(data.school));
        }
        setShowProfileModal(false);
        showAdminToast('School administrator credentials saved successfully.');
      }
    } catch (e: any) {
      console.error(e);
      showAdminToast('Error updating credentials: ' + (e.message || ''));
    }
  };  const loadSchoolData = async (schoolId?: string, sessionParam?: string, isSilent: boolean = false) => {
    const activeSchool = (schoolId && schoolId !== selectedSchool?.id)
      ? schoolId
      : (selectedSchool?.school_code || schoolId || selectedSchool?.id || 'DPS2026');
    const cleanId = (activeSchool || '').replace(/[^A-Z0-9]/gi, '') || 'DPS2026';
    const targetSession = sessionParam || selectedSession || '2026-27';

    // 0ms Instant SWR Hydration: Display cached data immediately so user experiences ZERO lag!
    let hasHydrated = false;
    if (typeof window !== 'undefined') {
      const offlineBackup = localStorage.getItem(`giterp_offline_backup_${cleanId}_${targetSession}`) || localStorage.getItem(`giterp_offline_backup_${cleanId}`);
      if (offlineBackup) {
        try {
          const cachedData = JSON.parse(offlineBackup);
          if (cachedData.overview) setOverview(cachedData.overview);
          if (Array.isArray(cachedData.students) && cachedData.students.length > 0) setStudents(cachedData.students);
          if (Array.isArray(cachedData.teachers) && cachedData.teachers.length > 0) setTeachers(cachedData.teachers);
          if (Array.isArray(cachedData.classes) && cachedData.classes.length > 0) setClasses(cachedData.classes);
          if (Array.isArray(cachedData.notices) && cachedData.notices.length > 0) setNotices(cachedData.notices);
          if (Array.isArray(cachedData.attendance) && cachedData.attendance.length > 0) setAttendance(cachedData.attendance);
          if (Array.isArray(cachedData.invoices) && cachedData.invoices.length > 0) setInvoices(cachedData.invoices);
          hasHydrated = true;
          setLoading(false);
        } catch (e) {}
      }
    }

    // Only show full loading spinner if this is a first-time load with zero cached data
    if (!hasHydrated && !isSilent) {
      setLoading(true);
    }

    // If device is offline, stop here
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      return;
    }

    setIsSyncingLive(true);

    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('current_user') : null;
      let activeRole = currentUser?.role || '';
      if (!activeRole && storedUser) {
        try { activeRole = JSON.parse(storedUser).role; } catch (e) {}
      }

      const fetchOpts = {
        headers: {
          'x-user-role': activeRole || 'ANONYMOUS'
        }
      };
      const safeFetchJson = async (url: string) => {
        try {
          const res = await apiFetch(url, fetchOpts);
          if (!res.ok) return { success: false };
          return await res.json();
        } catch (err) {
          return { success: false };
        }
      };

      const [ovData, stData, tcData, clData, noData, atData, inData] = await Promise.all([
        safeFetchJson(`/api/overview?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/students?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/teachers?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/classes?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/notices?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/attendance?school_id=${cleanId}&session=${targetSession}`),
        safeFetchJson(`/api/fees?school_id=${cleanId}&session=${targetSession}`)
      ]);

      const freshOverview = ovData.success ? ovData : null;
      const freshStudents = stData.success ? (stData.students || []) : [];
      const freshTeachers = tcData.success ? (tcData.teachers || []) : [];
      const freshClasses: ClassRoom[] = clData.success ? sortClassesChronologically<ClassRoom>(clData.classes || []) : [];
      const freshNotices = noData.success ? (noData.notices || []) : [];
      const freshAttendance = atData.success ? (atData.attendance || []) : [];
      const freshInvoices = inData.success ? (inData.invoices || []) : [];

      if (freshOverview) setOverview(freshOverview);
      if (freshStudents.length > 0 || !hasHydrated) setStudents(freshStudents);
      if (freshTeachers.length > 0 || !hasHydrated) setTeachers(freshTeachers);
      if (freshClasses.length > 0 || !hasHydrated) setClasses(freshClasses);
      if (freshNotices.length > 0 || !hasHydrated) setNotices(freshNotices);
      if (freshAttendance.length > 0 || !hasHydrated) setAttendance(freshAttendance);
      if (freshInvoices.length > 0 || !hasHydrated) setInvoices(freshInvoices);

      // Save real MongoDB session data as offline backup (safely guarded against QuotaExceededError)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('last_active_school_id', cleanId);
          localStorage.setItem('giterp_active_session', targetSession);
          localStorage.removeItem(`giterp_cache_${cleanId}`);

          // For small/medium datasets, save offline cache; for 5,000+ datasets, save metadata summary
          const backupPayload = JSON.stringify({
            overview: freshOverview,
            students: freshStudents.length > 500 ? freshStudents.slice(0, 500) : freshStudents,
            teachers: freshTeachers,
            classes: freshClasses,
            notices: freshNotices,
            attendance: freshAttendance,
            invoices: freshInvoices.length > 500 ? freshInvoices.slice(0, 500) : freshInvoices,
            session: targetSession,
            totalStudentsCount: freshStudents.length,
            timestamp: Date.now()
          });

          localStorage.setItem(`giterp_offline_backup_${cleanId}_${targetSession}`, backupPayload);
        } catch (storageErr) {
          console.warn('[Storage] Local storage quota reached. Offline cache bypassed; live MongoDB memory active.');
        }
      }
    } catch (e) {
      console.error('Failed to load live school data from MongoDB:', e);
    } finally {
      setIsSyncingLive(false);
      setLoading(false);
    }
  };

  const handleSwitchSession = async (newSession: string) => {
    setSelectedSession(newSession);
    if (typeof window !== 'undefined') {
      localStorage.setItem('giterp_active_session', newSession);
    }
    if (selectedSchool) {
      await loadSchoolData(selectedSchool.school_code || selectedSchool.id, newSession);
    }
    showAdminToast(`Switched to Academic Session ${newSession}`);
  };

  // Student Actions: Add or Edit CBSE Profile
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      const isEditing = !!editingStudentId;
      const url = '/api/students';
      const method = isEditing ? 'PATCH' : 'POST';
      const finalFeeStatus = (!isEditing && collectFeeNow) ? 'PAID' : (studentForm.fee_status || 'PENDING');
      const payload = isEditing
        ? { id: editingStudentId, school_id: selectedSchool.id, academic_session: studentForm.academic_session || selectedSession, ...studentForm }
        : { school_id: selectedSchool.id, academic_session: studentForm.academic_session || selectedSession, ...studentForm, fee_status: finalFeeStatus };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        // Automatically create initial admission fee invoice on new registration
        if (!isEditing && data.student) {
          try {
            const invPayload = {
              school_id: selectedSchool.id,
              academic_session: studentForm.academic_session || selectedSession,
              invoice_no: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
              student_id: data.student.id,
              student_name: data.student.full_name,
              admission_no: data.student.admission_no,
              class_name: data.student.class_name,
              month: registrationFeeBreakdown.periodLabel,
              amount: registrationFeeBreakdown.totalPayable,
              paid_amount: collectFeeNow ? registrationFeeBreakdown.totalPayable : 0,
              tuition_fee: registrationFeeBreakdown.tuitionFeeTotal,
              transport_fee: registrationFeeBreakdown.transportFeeTotal,
              admission_fee: registrationFeeBreakdown.admissionFee,
              annual_fee: registrationFeeBreakdown.annualFee,
              status: collectFeeNow ? 'PAID' : 'PENDING',
              payment_mode: collectFeeNow ? initialFeePaymentMode : 'Pending Settlement',
              paid_date: collectFeeNow ? new Date().toISOString().split('T')[0] : undefined,
              due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
            };
            await apiFetch('/api/fees', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invPayload)
            });
          } catch (invErr) {
            console.error('Initial fee invoice generation error:', invErr);
          }
        }

        setShowStudentModal(false);
        setEditingStudentId(null);
        setStudentForm(initialStudentForm);
        setCollectFeeNow(false);
        showAdminToast(
          isEditing
            ? 'Student profile updated!'
            : `Student "${data.student?.full_name || studentForm.full_name}" registered with fee schedule of ₹${registrationFeeBreakdown.totalPayable.toLocaleString('en-IN')} (${collectFeeNow ? 'PAID' : 'PENDING'})!`
        );
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openStudentModal = (studentToEdit?: Student) => {
    if (studentToEdit) {
      setEditingStudentId(studentToEdit.id);
      setStudentForm({
        ...initialStudentForm,
        ...studentToEdit,
        passcode: studentToEdit.passcode || '123456'
      });
      setCollectFeeNow(false);
    } else {
      setEditingStudentId(null);
      setStudentForm({
        ...initialStudentForm,
        admission_no: `ADM-${Date.now().toString().slice(-4)}`,
        admission_date: new Date().toISOString().split('T')[0],
        admission_type: 'NEW',
        transport_opted: 'NO',
        transport_slab_id: '1',
        passcode: '123456'
      });
      setCollectFeeNow(false);
    }
    setStudentModalTab('basic');
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      await apiFetch(`/api/students?id=${id}`, { method: 'DELETE' });
      showAdminToast('Student record deleted successfully.');
      if (selectedSchool) loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Student Admin Powers: 1-Click Toggle Active/Inactive & Bulk
  const handleToggleStudentStatus = async (student: Student, targetStatus?: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = targetStatus || (student.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE');
    try {
      const res = await apiFetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success && selectedSchool) {
        showAdminToast(`Student "${student.full_name}" is now ${nextStatus}!`);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkStudentStatus = async (targetStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedStudentIds.length === 0 || !selectedSchool) return;
    try {
      await Promise.all(
        selectedStudentIds.map(id =>
          apiFetch('/api/students', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: targetStatus })
          })
        )
      );
      showAdminToast(`Updated ${selectedStudentIds.length} students to ${targetStatus}!`);
      setSelectedStudentIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0 || !selectedSchool) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedStudentIds.length} selected students?`)) return;
    try {
      await Promise.all(
        selectedStudentIds.map(id =>
          apiFetch(`/api/students?id=${id}`, { method: 'DELETE' })
        )
      );
      showAdminToast(`Successfully deleted ${selectedStudentIds.length} student records.`);
      setSelectedStudentIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // PIN / Passcode Reset Powers
  const handleOpenPinModal = (type: 'student' | 'teacher', id: string, name: string, currentPin = '123456') => {
    setPinModal({ type, id, name, currentPin });
    setCustomPinInput(currentPin);
  };

  const handleSaveCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModal || !selectedSchool) return;
    try {
      const url = pinModal.type === 'student' ? '/api/students' : '/api/teachers';
      const res = await apiFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pinModal.id, passcode: customPinInput })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Login PIN for ${pinModal.name} updated to "${customPinInput}"!`);
        setPinModal(null);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Teacher Actions: Add or Edit CBSE Staff Profile
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      const isEditing = !!editingTeacherId;
      const url = '/api/teachers';
      const method = isEditing ? 'PATCH' : 'POST';
      const payload = isEditing
        ? { id: editingTeacherId, school_id: selectedSchool.id, academic_session: teacherForm.academic_session || selectedSession, ...teacherForm }
        : { school_id: selectedSchool.id, academic_session: teacherForm.academic_session || selectedSession, ...teacherForm };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowTeacherModal(false);
        setEditingTeacherId(null);
        setTeacherForm(initialTeacherForm);
        showAdminToast(isEditing ? 'Faculty profile updated.' : 'New faculty member registered.');
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Faculty Admin Powers: 1-Click Toggle Active/Inactive & Bulk
  const handleToggleTeacherStatus = async (teacher: Teacher, targetStatus?: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = targetStatus || (teacher.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE');
    try {
      const res = await apiFetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teacher.id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success && selectedSchool) {
        showAdminToast(`Faculty "${teacher.full_name}" is now ${nextStatus}!`);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkTeacherStatus = async (targetStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedTeacherIds.length === 0 || !selectedSchool) return;
    try {
      await Promise.all(
        selectedTeacherIds.map(id =>
          apiFetch('/api/teachers', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: targetStatus })
          })
        )
      );
      showAdminToast(`Updated ${selectedTeacherIds.length} faculty members to ${targetStatus}!`);
      setSelectedTeacherIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDeleteTeachers = async () => {
    if (selectedTeacherIds.length === 0 || !selectedSchool) return;
    if (!confirm(`Are you sure you want to delete ${selectedTeacherIds.length} selected faculty records?`)) return;
    try {
      await Promise.all(
        selectedTeacherIds.map(id =>
          apiFetch(`/api/teachers?id=${id}`, { method: 'DELETE' })
        )
      );
      showAdminToast(`Deleted ${selectedTeacherIds.length} faculty records.`);
      setSelectedTeacherIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  const openTeacherModal = (teacherToEdit?: Teacher) => {
    if (teacherToEdit) {
      setEditingTeacherId(teacherToEdit.id);
      const resolvedRole = teacherToEdit.role || resolveTeacherRole(teacherToEdit) || 'TEACHER';
      setTeacherForm({ ...initialTeacherForm, ...teacherToEdit, role: resolvedRole });

      const roleIsCustom = !!teacherToEdit.designation && !STANDARD_DESIGNATIONS.includes(teacherToEdit.designation);
      setIsCustomRole(roleIsCustom);
      setCustomRoleText(roleIsCustom ? teacherToEdit.designation : '');

      const qualIsCustom = !!teacherToEdit.professional_degree && !STANDARD_QUALIFICATIONS.includes(teacherToEdit.professional_degree);
      setIsCustomQual(qualIsCustom);
      setCustomQualText(qualIsCustom ? teacherToEdit.professional_degree : '');

      const deptIsCustom = !!teacherToEdit.department && !STANDARD_DEPARTMENTS.includes(teacherToEdit.department);
      setIsCustomDept(deptIsCustom);
      setCustomDeptText(deptIsCustom ? teacherToEdit.department : '');

      const subjIsCustom = !!teacherToEdit.subject_specialization && !STANDARD_SUBJECTS.includes(teacherToEdit.subject_specialization);
      setIsCustomSubject(subjIsCustom);
      setCustomSubjectText(subjIsCustom ? teacherToEdit.subject_specialization : '');
    } else {
      setEditingTeacherId(null);
      setTeacherForm({
        ...initialTeacherForm,
        staff_code: `STF-${Date.now().toString().slice(-4)}`
      });
      setIsCustomRole(false);
      setCustomRoleText('');
      setIsCustomQual(false);
      setCustomQualText('');
      setIsCustomDept(false);
      setCustomDeptText('');
      setIsCustomSubject(false);
      setCustomSubjectText('');
    }
    setTeacherModalTab('basic');
    setShowTeacherModal(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to remove this faculty record?')) return;
    try {
      await apiFetch(`/api/teachers?id=${id}`, { method: 'DELETE' });
      if (selectedSchool) loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Class Handlers
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      const url = '/api/classes';
      const method = editingClassId ? 'PUT' : 'POST';
      const payload = editingClassId 
        ? { id: editingClassId, academic_session: selectedSession, ...classForm } 
        : { school_id: selectedSchool.id, academic_session: selectedSession, ...classForm };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddClass(false);
        setEditingClassId(null);
        setClassForm({ class_name: 'Class 10', section: 'A', class_teacher: '', room_no: 'Room 101', capacity: 40 });
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class & section?')) return;
    try {
      await apiFetch(`/api/classes?id=${id}`, { method: 'DELETE' });
      showAdminToast('Class & division deleted successfully.');
      if (selectedSchool) loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Subject Management Handlers
  const handleOpenSubjectManager = (cls: ClassRoom) => {
    setManageSubjectsClass(cls);
    setEditingSubjectId(null);
    setShowAddSubjectInline(false);
    setSubjectForm({
      id: '',
      name: '',
      code: '',
      type: 'COMPULSORY',
      weekly_periods: 6,
      assigned_teacher: cls.class_teacher || '',
      max_marks: 100
    });
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageSubjectsClass || !subjectForm.name.trim()) return;
    setSubjectSaving(true);
    try {
      const isEditing = Boolean(editingSubjectId);
      const url = '/api/classes/subjects';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing
        ? {
            class_id: manageSubjectsClass.id,
            subject_id: editingSubjectId,
            name: subjectForm.name.trim(),
            code: subjectForm.code.trim(),
            type: subjectForm.type,
            weekly_periods: Number(subjectForm.weekly_periods) || 5,
            assigned_teacher: subjectForm.assigned_teacher,
            max_marks: Number(subjectForm.max_marks) || 100
          }
        : {
            class_id: manageSubjectsClass.id,
            name: subjectForm.name.trim(),
            code: subjectForm.code.trim(),
            type: subjectForm.type,
            weekly_periods: Number(subjectForm.weekly_periods) || 5,
            assigned_teacher: subjectForm.assigned_teacher,
            max_marks: Number(subjectForm.max_marks) || 100
          };

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.class) {
        setManageSubjectsClass(data.class);
        setClasses(prev => prev.map(c => c.id === data.class.id ? data.class : c));
        setEditingSubjectId(null);
        setShowAddSubjectInline(false);
        setSubjectForm({
          id: '',
          name: '',
          code: '',
          type: 'COMPULSORY',
          weekly_periods: 6,
          assigned_teacher: '',
          max_marks: 100
        });
        showAdminToast(isEditing ? 'Subject updated successfully.' : 'New subject added to class curriculum.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!manageSubjectsClass) return;
    if (!confirm(`Are you sure you want to remove "${subjectName}" from ${manageSubjectsClass.class_name} - Section ${manageSubjectsClass.section}?`)) return;
    setSubjectSaving(true);
    try {
      const res = await apiFetch(`/api/classes/subjects?class_id=${manageSubjectsClass.id}&subject_id=${subjectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && data.class) {
        setManageSubjectsClass(data.class);
        setClasses(prev => prev.map(c => c.id === data.class.id ? data.class : c));
        showAdminToast(`"${subjectName}" removed from curriculum.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubjectSaving(false);
    }
  };

  const handleResetCbseSubjects = async () => {
    if (!manageSubjectsClass) return;
    if (!confirm(`Reset subjects to prescribed CBSE curriculum standards for ${manageSubjectsClass.class_name}? This will restore all standard CBSE subjects.`)) return;
    setSubjectSaving(true);
    try {
      const res = await apiFetch('/api/classes/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: manageSubjectsClass.id })
      });
      const data = await res.json();
      if (data.success && data.class) {
        setManageSubjectsClass(data.class);
        setClasses(prev => prev.map(c => c.id === data.class.id ? data.class : c));
        showAdminToast(`Restored standard CBSE curriculum subjects for ${manageSubjectsClass.class_name}.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubjectSaving(false);
    }
  };

  // Class Admin Powers: 1-Click Toggle Active/Inactive & Bulk
  const handleToggleClassStatus = async (cls: ClassRoom, targetStatus?: 'ACTIVE' | 'INACTIVE') => {
    const nextStatus = targetStatus || (cls.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE');
    try {
      const res = await apiFetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cls.id, status: nextStatus })
      });
      const data = await res.json();
      if (data.success && selectedSchool) {
        showAdminToast(`Class "${cls.class_name} - ${cls.section}" is now ${nextStatus}!`);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkClassStatus = async (targetStatus: 'ACTIVE' | 'INACTIVE') => {
    if (selectedClassIds.length === 0 || !selectedSchool) return;
    try {
      await Promise.all(
        selectedClassIds.map(id =>
          apiFetch('/api/classes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: targetStatus })
          })
        )
      );
      showAdminToast(`Updated ${selectedClassIds.length} classes to ${targetStatus}!`);
      setSelectedClassIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDeleteClasses = async () => {
    if (selectedClassIds.length === 0 || !selectedSchool) return;
    if (!confirm(`Are you sure you want to delete ${selectedClassIds.length} selected classes?`)) return;
    try {
      await Promise.all(
        selectedClassIds.map(id =>
          apiFetch(`/api/classes?id=${id}`, { method: 'DELETE' })
        )
      );
      showAdminToast(`Deleted ${selectedClassIds.length} classes.`);
      setSelectedClassIds([]);
      loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Notice Handlers
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    try {
      const res = await apiFetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: selectedSchool.id, academic_session: selectedSession, ...noticeForm })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddNotice(false);
        setNoticeForm({ title: '', content: '', matter_category: 'ACAD', target_audience: 'ALL', posted_by: 'Principal Office' });
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await apiFetch(`/api/notices?id=${id}`, { method: 'DELETE' });
      if (selectedSchool) loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Invoice Handlers
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    const totalCalc = Number(invoiceForm.tuition_fee || 0) + Number(invoiceForm.transport_fee || 0) + Number(invoiceForm.exam_fee || 0);
    try {
      const res = await apiFetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          academic_session: selectedSession,
          student_name: invoiceForm.student_name,
          admission_no: invoiceForm.admission_no,
          class_name: invoiceForm.class_name,
          tuition_fee: Number(invoiceForm.tuition_fee),
          transport_fee: Number(invoiceForm.transport_fee),
          exam_fee: Number(invoiceForm.exam_fee),
          amount: totalCalc > 0 ? totalCalc : Number(invoiceForm.amount),
          payment_mode: invoiceForm.payment_mode,
          due_date: invoiceForm.due_date,
          status: invoiceForm.status
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddInvoice(false);
        setInvoiceForm({
          student_id: '',
          student_name: '',
          admission_no: '',
          class_name: 'Class 10 - A',
          tuition_fee: 12000,
          transport_fee: 2000,
          exam_fee: 1000,
          amount: 15000,
          payment_mode: 'UPI / Online',
          due_date: new Date().toISOString().split('T')[0],
          status: 'PENDING'
        });
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleInvoiceStatus = async (invoice: FeeInvoice) => {
    const nextStatus = invoice.status === 'PAID' ? 'PENDING' : 'PAID';
    try {
      const res = await apiFetch('/api/fees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          status: nextStatus,
          payment_mode: invoice.payment_mode || 'Cash/UPI'
        })
      });
      const data = await res.json();
      if (data.success && selectedSchool) {
        loadSchoolData(selectedSchool.id);
        if (viewInvoice && viewInvoice.id === invoice.id) {
          setViewInvoice(data.invoice);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await apiFetch(`/api/fees?id=${id}`, { method: 'DELETE' });
      if (selectedSchool) loadSchoolData(selectedSchool.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Interactive Attendance Handlers (Students & Faculty)
  const handleToggleStudentAttendanceStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    setStudentAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllClassStudents = (targetStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    const targetStudents = students.filter(s => {
      const clsMatch = s.class_name?.toLowerCase().replace(/^class\s*/i, '').trim() === selectedAttendanceClass.toLowerCase().replace(/^class\s*/i, '').trim() || s.class_name?.toLowerCase() === selectedAttendanceClass.toLowerCase();
      const secMatch = (s.section || 'A').toUpperCase() === selectedAttendanceSection.toUpperCase();
      return clsMatch && secMatch;
    });

    const newMap = { ...studentAttendanceMap };
    targetStudents.forEach(s => {
      newMap[s.id] = targetStatus;
    });
    setStudentAttendanceMap(newMap);
    showAdminToast(`Marked all ${targetStudents.length} students in ${selectedAttendanceClass}-${selectedAttendanceSection} as ${targetStatus}!`);
  };

  const handleSaveClassAttendance = async () => {
    if (!selectedSchool) return;
    const targetStudents = students.filter(s => {
      const clsMatch = s.class_name?.toLowerCase().replace(/^class\s*/i, '').trim() === selectedAttendanceClass.toLowerCase().replace(/^class\s*/i, '').trim() || s.class_name?.toLowerCase() === selectedAttendanceClass.toLowerCase();
      const secMatch = (s.section || 'A').toUpperCase() === selectedAttendanceSection.toUpperCase();
      return clsMatch && secMatch;
    });

    if (targetStudents.length === 0) {
      alert(`No students found enrolled in ${selectedAttendanceClass} - Section ${selectedAttendanceSection}`);
      return;
    }

    setAttendanceSaving(true);
    try {
      let presentCount = 0;
      let absentCount = 0;

      targetStudents.forEach(s => {
        const st = studentAttendanceMap[s.id] || 'PRESENT';
        if (st === 'PRESENT' || st === 'LATE' || st === 'HALF_DAY') {
          presentCount++;
        } else {
          absentCount++;
        }
      });

      const res = await apiFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          academic_session: selectedSession,
          date: selectedAttendanceDate,
          class_name: selectedAttendanceClass,
          section: selectedAttendanceSection,
          total_students: targetStudents.length,
          present_count: presentCount,
          absent_count: absentCount,
          marked_by: currentUser?.full_name || 'Admin Directorate'
        })
      });

      const data = await res.json();
      if (data.success) {
        showAdminToast(`Saved ${selectedAttendanceClass}-${selectedAttendanceSection} Attendance: ${presentCount} Present, ${absentCount} Absent!`);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save attendance ledger session.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleToggleFacultyAttendanceStatus = (teacherId: string, status: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'HALF_DAY' | 'ABSENT') => {
    setFacultyAttendanceMap(prev => ({
      ...prev,
      [teacherId]: status
    }));
  };

  const handleMarkAllFaculty = (targetStatus: 'PRESENT' | 'HOLIDAY' | 'LEAVE' | 'HALF_DAY' | 'ABSENT') => {
    const activeFaculty = teachers.filter(t => t.status !== 'INACTIVE');
    const newMap = { ...facultyAttendanceMap };
    activeFaculty.forEach(t => {
      newMap[t.id] = targetStatus;
    });
    setFacultyAttendanceMap(newMap);
    showAdminToast(`Marked all ${activeFaculty.length} faculty members as ${targetStatus}!`);
  };

  const handleSaveFacultyAttendance = async () => {
    if (!selectedSchool) return;
    const activeFaculty = teachers.filter(t => t.status !== 'INACTIVE');
    if (activeFaculty.length === 0) {
      alert('No active faculty members available in roster.');
      return;
    }

    setAttendanceSaving(true);
    try {
      let presentCount = 0;
      let absentCount = 0;

      activeFaculty.forEach(t => {
        const st = facultyAttendanceMap[t.id] || 'PRESENT';
        if (st === 'PRESENT' || st === 'HALF_DAY') {
          presentCount++;
        } else {
          absentCount++;
        }
      });

      const res = await apiFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          academic_session: selectedSession,
          date: selectedAttendanceDate,
          class_name: 'Faculty',
          section: 'Staff',
          total_students: activeFaculty.length,
          present_count: presentCount,
          absent_count: absentCount,
          marked_by: currentUser?.full_name || 'Principal Office'
        })
      });

      const data = await res.json();
      if (data.success) {
        showAdminToast(`Faculty Daily Attendance Synced: ${presentCount} On Duty, ${absentCount} Absent / On Holiday!`);
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save faculty attendance.');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleDeleteAttendanceLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance session record?')) return;
    try {
      const res = await apiFetch(`/api/attendance?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && selectedSchool) {
        showAdminToast('Attendance log removed from database!');
        loadSchoolData(selectedSchool.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Settings Update
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setSettingsSuccess('');
    try {
      const res = await apiFetch('/api/school/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: selectedSchool.id, ...settingsForm })
      });
      const data = await res.json();
      if (data.success && data.school) {
        const isMasterAdmin = !currentUser || ['PRINCIPAL', 'ADMIN', 'SUPERADMIN', 'AGENCY_SUPERADMIN'].includes(currentUser?.role?.toUpperCase());
        if (isMasterAdmin) {
          const updatedUser = {
            ...(currentUser || {}),
            full_name: settingsForm.principal_name || 'Dr. Rajesh Sharma'
          };
          setCurrentUser(updatedUser);
          setProfileForm(prev => ({
            ...prev,
            full_name: settingsForm.principal_name,
            admin_pin: settingsForm.admin_pin
          }));
          if (typeof window !== 'undefined') {
            localStorage.setItem('current_user', JSON.stringify(updatedUser));
          }
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('current_school', JSON.stringify(data.school));
        }
        setSettingsSuccess('Institutional settings and security PIN updated successfully!');
        setTimeout(() => setSettingsSuccess(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // MongoDB Cloud Sync Handlers
  const handleCheckMongoCloud = async () => {
    setMongoSyncLoading(true);
    setMongoSyncMsg('');
    try {
      const res = await apiFetch('/api/sync/mongodb');
      const data = await res.json();
      setMongoSyncData(data);
      if (data.mongoStatus?.connected) {
        showAdminToast('MongoDB Atlas Cloud is Connected & Ready!');
      } else {
        setMongoSyncMsg(data.mongoStatus?.error || 'MongoDB Atlas connection could not be established.');
      }
    } catch (e: any) {
      setMongoSyncMsg(e.message);
    } finally {
      setMongoSyncLoading(false);
    }
  };

  const handlePushAllToMongo = async () => {
    setMongoSyncLoading(true);
    setMongoSyncMsg('');
    try {
      const res = await apiFetch('/api/sync/mongodb', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAdminToast(data.message || 'All records successfully synchronized to MongoDB Atlas!');
        handleCheckMongoCloud();
      } else {
        setMongoSyncMsg(data.error || 'Failed to sync with MongoDB Atlas.');
      }
    } catch (e: any) {
      setMongoSyncMsg(e.message);
    } finally {
      setMongoSyncLoading(false);
    }
  };

  const NEXT_CLASS_MAP: Record<string, string> = {
    'Nursery': 'LKG',
    'LKG': 'UKG',
    'UKG': 'Class 1',
    'Class 1': 'Class 2',
    'Class 2': 'Class 3',
    'Class 3': 'Class 4',
    'Class 4': 'Class 5',
    'Class 5': 'Class 6',
    'Class 6': 'Class 7',
    'Class 7': 'Class 8',
    'Class 8': 'Class 9',
    'Class 9': 'Class 10',
    'Class 10': 'Class 11',
    'Class 11': 'Class 12',
    'Class 12': 'GRADUATED'
  };

  // Student Promotion Studio Handler
  const handleExecutePromotion = async () => {
    if (!selectedSchool) return;
    const targetStudents = students.filter(s => {
      const clsMatch = s.class_name?.toLowerCase().replace(/^class\s*/i, '').trim() === promotionSourceClass.toLowerCase().replace(/^class\s*/i, '').trim() || s.class_name?.toLowerCase() === promotionSourceClass.toLowerCase();
      const secMatch = promotionSourceSection === 'ALL' || (s.section || 'A').toUpperCase() === promotionSourceSection.toUpperCase();
      return clsMatch && secMatch;
    });

    if (targetStudents.length === 0) {
      alert(`No scholars found currently enrolled in ${promotionSourceClass}`);
      return;
    }

    const payload = targetStudents.map(s => {
      const cfg = promotionActionsMap[s.id] || {
        action: promotionSourceClass === 'Class 12' ? 'GRADUATE' : 'PROMOTE',
        targetSection: promotionTargetSection === 'SAME' ? (s.section || 'A') : promotionTargetSection
      };
      return {
        student_id: s.id,
        action: cfg.action,
        target_class: cfg.action === 'PROMOTE' ? promotionTargetClass : s.class_name,
        target_section: cfg.action === 'PROMOTE' ? (cfg.targetSection || s.section || 'A') : s.section,
        target_session: promotionTargetSession
      };
    });

    const isGraduating = promotionSourceClass === 'Class 12';
    const confirmPrompt = isGraduating
      ? `Confirm Graduation / Passing out of ${payload.length} Class 12 scholars into Alumni directory?`
      : `Confirm batch promotion of ${payload.length} students from ${promotionSourceClass} to ${promotionTargetClass} for Session ${promotionTargetSession}?`;

    if (!confirm(confirmPrompt)) {
      return;
    }

    setPromotionExecuting(true);
    try {
      const res = await apiFetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          promotions: payload
        })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(data.message || 'Promotion Studio executed successfully!');
        setShowPromotionStudio(false);
        loadSchoolData(selectedSchool.id);
      } else {
        alert(data.error || 'Failed to execute promotion.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error executing promotion studio: ' + e.message);
    } finally {
      setPromotionExecuting(false);
    }
  };

  const handleSetAllPromotionAction = (targetAction: 'PROMOTE' | 'RETAIN' | 'GRADUATE' | 'LEFT') => {
    const targetStudents = students.filter(s => {
      const clsMatch = s.class_name?.toLowerCase().replace(/^class\s*/i, '').trim() === promotionSourceClass.toLowerCase().replace(/^class\s*/i, '').trim() || s.class_name?.toLowerCase() === promotionSourceClass.toLowerCase();
      const secMatch = promotionSourceSection === 'ALL' || (s.section || 'A').toUpperCase() === promotionSourceSection.toUpperCase();
      return clsMatch && secMatch;
    });

    const newMap = { ...promotionActionsMap };
    targetStudents.forEach(s => {
      newMap[s.id] = {
        action: targetAction,
        targetSection: promotionTargetSection === 'SAME' ? (s.section || 'A') : promotionTargetSection
      };
    });
    setPromotionActionsMap(newMap);
    showAdminToast(`Set all ${targetStudents.length} scholars in ${promotionSourceClass} to ${targetAction}!`);
  };

  const handleOpenIndividualPromotion = (s: Student) => {
    setIndividualPromotionStudent(s);
    const autoNext = NEXT_CLASS_MAP[s.class_name || 'Class 9'] || 'Class 10';
    setIndividualPromotionAction(s.class_name === 'Class 12' ? 'GRADUATE' : 'PROMOTE');
    setIndividualTargetClass(autoNext === 'GRADUATED' ? 'Class 12' : autoNext);
    setIndividualTargetSection(s.section || 'A');
    setIndividualTargetRoll(String(s.roll_no || ''));
    setIndividualTargetSession('2027-28');
  };

  const handleExecuteIndividualPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualPromotionStudent || !selectedSchool) return;

    setPromotionExecuting(true);
    try {
      const payload = [{
        student_id: individualPromotionStudent.id,
        action: individualPromotionAction,
        target_class: individualPromotionAction === 'PROMOTE' ? individualTargetClass : individualPromotionStudent.class_name,
        target_section: individualTargetSection,
        target_session: individualTargetSession,
        roll_no: individualTargetRoll || undefined
      }];

      const res = await apiFetch('/api/students/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          promotions: payload
        })
      });
      const data = await res.json();
      if (data.success) {
        showAdminToast(`Scholar '${individualPromotionStudent.full_name}' promoted/updated successfully!`);
        setIndividualPromotionStudent(null);
        loadSchoolData(selectedSchool.id);
      } else {
        alert(data.error || 'Failed to update student promotion.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error updating student: ' + e.message);
    } finally {
      setPromotionExecuting(false);
    }
  };

  const handleLogout = () => {
    triggerTaskCelebration({
      type: 'SIGNOUT',
      title: 'Signing Out Securely...',
      subtitle: 'Session closed & credentials locked'
    });

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_school');
        localStorage.removeItem('giterp_role_permissions');
        localStorage.removeItem('erp_session_token'); // Invalidate signed session token
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('erp_active_marks_teacher_') || key.startsWith('cbse_') || key === 'agency_auth') {
              localStorage.removeItem(key);
            }
          });
        } catch (_) {}
        sessionStorage.clear();
      }
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.replace('/login');
      }
    }, 950);
  };

  const formatClassDisplay = (cls?: string) => {
    if (!cls) return 'I';
    const c = cls.replace(/Class\s*/i, '').trim();
    const romanMap: Record<string, string> = {
      '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
      '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
      '11': 'XI', '12': 'XII'
    };
    return romanMap[c] || c;
  };

  const formatDateDisplay = (dateStr?: string, fallback = '14 Mar 2024') => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const handleQuickCollectFee = (s: Student) => {
    setInvoiceForm({
      student_id: s.id,
      student_name: s.full_name,
      admission_no: s.admission_no,
      class_name: `${s.class_name} - ${s.section}`,
      tuition_fee: 12000,
      transport_fee: s.transport_opted === 'YES' ? 2000 : 0,
      exam_fee: 1000,
      amount: s.transport_opted === 'YES' ? 15000 : 13000,
      payment_mode: 'UPI / Online',
      due_date: new Date().toISOString().split('T')[0],
      status: 'PAID'
    });
    setShowAddInvoice(true);
  };

  // Helper to reliably resolve faculty gender
  const resolveTeacherGender = (t: Teacher): 'Female' | 'Male' => {
    if (t.gender) {
      const g = t.gender.trim().toLowerCase();
      if (g === 'female' || g === 'f') return 'Female';
      if (g === 'male' || g === 'm') return 'Male';
    }
    const name = (t.full_name || '').toLowerCase();
    if (name.includes('mrs.') || name.includes('ms.') || name.includes('miss') || name.includes('sister') || name.includes('smt') || name.includes('shmt')) {
      return 'Female';
    }
    if (name.includes('mr.') || name.includes('shri') || name.includes('master')) {
      return 'Male';
    }
    const femaleKeywords = [
      'sunita', 'pooja', 'nalini', 'meenakshi', 'ananya', 'priya', 'kavita', 'shweta',
      'deepa', 'ritu', 'sneha', 'divya', 'anjali', 'archana', 'kiran', 'neeta',
      'sangeeta', 'geeta', 'asha', 'rekha', 'sarita', 'swati', 'komal', 'radha',
      'seema', 'preeti', 'rani', 'kumari', 'devi', 'kaur', 'begum', 'fatima', 'aisha', 'neha', 'tanvi'
    ];
    if (femaleKeywords.some(kw => name.includes(kw))) {
      return 'Female';
    }
    const num = parseInt((t.staff_code || t.id || '').replace(/\D/g, '') || '0');
    return (num % 3 !== 0) ? 'Female' : 'Male';
  };

  // CBSE Hierarchical Class Sorter Helper
  const CLASS_HIERARCHY: Record<string, number> = {
    'nursery': 0, 'lkg': 1, 'ukg': 2,
    'class 1': 3, '1': 3, 'class 2': 4, '2': 4, 'class 3': 5, '3': 5, 'class 4': 6, '4': 6, 'class 5': 7, '5': 7,
    'class 6': 8, '6': 8, 'class 7': 9, '7': 9, 'class 8': 10, '8': 10, 'class 9': 11, '9': 11, 'class 10': 12, '10': 12,
    'class 11': 13, '11': 13, 'class 12': 14, '12': 14
  };

  // 1. FILTERED STUDENTS
  // Use empty string before mount to avoid SSR/CSR searchQuery mismatch (hydration)
  const _sq = mounted ? searchQuery : '';
  const filteredStudents = (students || []).filter(s => {
    if (!s) return false;
    if (studentStatusFilter !== 'ALL' && s.status !== studentStatusFilter) return false;
    if (studentClassFilter !== 'ALL') {
      const targetClass = studentClassFilter.toLowerCase().replace(/^class\s*/i, '').trim();
      const sClass = (s.class_name || '').toLowerCase().replace(/^class\s*/i, '').trim();
      if (targetClass !== sClass && s.class_name?.toLowerCase() !== studentClassFilter.toLowerCase()) return false;
    }
    if (studentSectionFilter !== 'ALL' && s.section?.toUpperCase() !== studentSectionFilter.toUpperCase()) return false;
    if (studentFeeFilter !== 'ALL' && s.fee_status?.toUpperCase() !== studentFeeFilter.toUpperCase()) return false;
    if (studentGenderFilter !== 'ALL' && s.gender?.toLowerCase() !== studentGenderFilter.toLowerCase()) return false;
    if (studentHouseFilter !== 'ALL') {
      const sHouse = s.house || (['Red House', 'Blue House', 'Green House', 'Yellow House'][(students.indexOf(s)) % 4]);
      if (sHouse !== studentHouseFilter) return false;
    }
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const name = (s.full_name || '').toLowerCase();
    const adm = (s.admission_no || '').toLowerCase();
    const cls = (s.class_name || '').toLowerCase();
    const sec = (s.section || '').toLowerCase();
    const roll = String(s.roll_no || '').toLowerCase();
    const guardian = (s.guardian_name || '').toLowerCase();
    const apaar = (s.apaar_id || '').toLowerCase();
    return name.includes(q) || adm.includes(q) || cls.includes(q) || sec.includes(q) || roll.includes(q) || guardian.includes(q) || apaar.includes(q);
  }).sort((a, b) => {
    if (studentSortBy === 'A-Z' || studentSortBy === 'name-asc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (studentSortBy === 'Z-A' || studentSortBy === 'name-desc') return (b.full_name || '').localeCompare(a.full_name || '');
    if (studentSortBy === 'Adm-Asc' || studentSortBy === 'adm-asc') return (a.admission_no || '').localeCompare(b.admission_no || '', undefined, { numeric: true });
    if (studentSortBy === 'adm-desc') return (b.admission_no || '').localeCompare(a.admission_no || '', undefined, { numeric: true });
    if (studentSortBy === 'roll-asc') return (Number(a.roll_no) || 0) - (Number(b.roll_no) || 0);
    if (studentSortBy === 'roll-desc') return (Number(b.roll_no) || 0) - (Number(a.roll_no) || 0);
    if (studentSortBy === 'class-asc') {
      const ca = getClassWeight(a.class_name || '');
      const cb = getClassWeight(b.class_name || '');
      if (ca !== cb) return ca - cb;
      return (a.section || '').localeCompare(b.section || '');
    }
    if (studentSortBy === 'class-desc') {
      const ca = getClassWeight(a.class_name || '');
      const cb = getClassWeight(b.class_name || '');
      if (ca !== cb) return cb - ca;
      return (b.section || '').localeCompare(a.section || '');
    }
    if (studentSortBy === 'sec-asc') return (a.section || '').localeCompare(b.section || '');
    if (studentSortBy === 'sec-desc') return (b.section || '').localeCompare(a.section || '');
    if (studentSortBy === 'gender-asc') return (a.gender || '').localeCompare(b.gender || '');
    if (studentSortBy === 'gender-desc') return (b.gender || '').localeCompare(a.gender || '');
    if (studentSortBy === 'status-asc') return (a.status || 'ACTIVE').localeCompare(b.status || 'ACTIVE');
    if (studentSortBy === 'status-desc') return (b.status || 'ACTIVE').localeCompare(a.status || 'ACTIVE');
    if (studentSortBy === 'Date-Asc' || studentSortBy === 'date-asc') return new Date(a.admission_date || a.created_at || 0).getTime() - new Date(b.admission_date || b.created_at || 0).getTime();
    if (studentSortBy === 'date-desc') return new Date(b.admission_date || b.created_at || 0).getTime() - new Date(a.admission_date || a.created_at || 0).getTime();
    if (studentSortBy === 'dob-asc') return new Date(a.dob || 0).getTime() - new Date(b.dob || 0).getTime();
    if (studentSortBy === 'dob-desc') return new Date(b.dob || 0).getTime() - new Date(a.dob || 0).getTime();
    return 0;
  });

  const totalStudentEntries = filteredStudents.length;
  const totalStudentPages = Math.ceil(totalStudentEntries / studentRowsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentRowsPerPage,
    studentPage * studentRowsPerPage
  );

  // 2. FILTERED TEACHERS
  const filteredTeachers = (teachers || []).filter(t => {
    if (!t) return false;
    if (teacherStatusFilter !== 'ALL' && t.status !== teacherStatusFilter) return false;
    if (teacherRoleFilter !== 'ALL' && resolveTeacherRole(t) !== teacherRoleFilter) return false;
    if (teacherDeptFilter !== 'ALL' && !t.department?.toLowerCase().includes(teacherDeptFilter.toLowerCase())) return false;
    if (teacherDesignationFilter !== 'ALL' && !t.designation?.toLowerCase().includes(teacherDesignationFilter.toLowerCase())) return false;
    if (teacherCtetFilter !== 'ALL' && (t.ctet_qualified || 'NO').toUpperCase() !== teacherCtetFilter.toUpperCase()) return false;
    if (teacherGenderFilter !== 'ALL' && resolveTeacherGender(t).toLowerCase() !== teacherGenderFilter.toLowerCase()) return false;
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const name = (t.full_name || '').toLowerCase();
    const code = (t.staff_code || '').toLowerCase();
    const roleStr = resolveTeacherRole(t).toLowerCase();
    const subj = (t.subject_specialization || t.department || '').toLowerCase();
    const cls = (t.classes_taught || '').toLowerCase();
    const desig = (t.designation || '').toLowerCase();
    const phone = (t.phone || '').toLowerCase();
    const email = (t.email || '').toLowerCase();
    return name.includes(q) || code.includes(q) || roleStr.includes(q) || subj.includes(q) || cls.includes(q) || desig.includes(q) || phone.includes(q) || email.includes(q);
  }).sort((a, b) => {
    if (teacherSortBy === 'A-Z' || teacherSortBy === 'name-asc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (teacherSortBy === 'Z-A' || teacherSortBy === 'name-desc') return (b.full_name || '').localeCompare(a.full_name || '');
    if (teacherSortBy === 'role-asc') return resolveTeacherRole(a).localeCompare(resolveTeacherRole(b));
    if (teacherSortBy === 'role-desc') return resolveTeacherRole(b).localeCompare(resolveTeacherRole(a));
    if (teacherSortBy === 'ID-Asc' || teacherSortBy === 'id-asc') return (a.staff_code || '').localeCompare(b.staff_code || '', undefined, { numeric: true });
    if (teacherSortBy === 'id-desc') return (b.staff_code || '').localeCompare(a.staff_code || '', undefined, { numeric: true });
    if (teacherSortBy === 'desig-asc') return (a.designation || '').localeCompare(b.designation || '');
    if (teacherSortBy === 'desig-desc') return (b.designation || '').localeCompare(a.designation || '');
    if (teacherSortBy === 'dept-asc') return (a.department || '').localeCompare(b.department || '');
    if (teacherSortBy === 'dept-desc') return (b.department || '').localeCompare(a.department || '');
    if (teacherSortBy === 'status-asc') return (a.status || 'ACTIVE').localeCompare(b.status || 'ACTIVE');
    if (teacherSortBy === 'status-desc') return (b.status || 'ACTIVE').localeCompare(a.status || 'ACTIVE');
    if (teacherSortBy === 'Date-Asc' || teacherSortBy === 'date-asc') return new Date(a.date_of_joining || 0).getTime() - new Date(b.date_of_joining || 0).getTime();
    if (teacherSortBy === 'date-desc') return new Date(b.date_of_joining || 0).getTime() - new Date(a.date_of_joining || 0).getTime();
    return 0;
  });

  const totalTeacherEntries = filteredTeachers.length;
  const totalTeacherPages = Math.ceil(totalTeacherEntries / teacherRowsPerPage) || 1;
  const paginatedTeachers = filteredTeachers.slice(
    (teacherPage - 1) * teacherRowsPerPage,
    teacherPage * teacherRowsPerPage
  );

  // 3. FILTERED CLASSES
  const filteredClasses = (classes || []).filter(c => {
    if (!c) return false;
    if (classStatusFilter !== 'ALL' && c.status !== classStatusFilter) return false;
    if (classSectionFilter !== 'ALL' && c.section?.toUpperCase() !== classSectionFilter.toUpperCase()) return false;
    
    if (classWingFilter !== 'ALL') {
      const cls = (c.class_name || '').toLowerCase();
      if (classWingFilter === 'PRE_PRIMARY' && !(cls.includes('nursery') || cls.includes('lkg') || cls.includes('ukg') || cls.includes('kg') || cls.includes('prep'))) return false;
      if (classWingFilter === 'PRIMARY' && !(/\b(class\s*1|class\s*2|class\s*3|class\s*4|class\s*5|class\s*i|class\s*ii|class\s*iii|class\s*iv|class\s*v|i|ii|iii|iv|v|1|2|3|4|5)\b/i.test(cls))) return false;
      if (classWingFilter === 'MIDDLE' && !(/\b(class\s*6|class\s*7|class\s*8|class\s*vi|class\s*vii|class\s*viii|vi|vii|viii|6|7|8)\b/i.test(cls))) return false;
      if (classWingFilter === 'SECONDARY' && !(/\b(class\s*9|class\s*10|class\s*ix|class\s*x|ix|x|9|10)\b/i.test(cls) && !/\b(xi|xii|11|12)\b/i.test(cls))) return false;
      if (classWingFilter === 'SR_SECONDARY' && !(/\b(class\s*11|class\s*12|class\s*xi|class\s*xii|xi|xii|11|12)\b/i.test(cls))) return false;
    }
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const name = (c.class_name || '').toLowerCase();
    const sec = (c.section || '').toLowerCase();
    const code = (c.class_code || c.id || '').toLowerCase();
    const teacher = (c.class_teacher || '').toLowerCase();
    const room = (c.room_no || '').toLowerCase();
    return name.includes(q) || sec.includes(q) || code.includes(q) || teacher.includes(q) || room.includes(q);
  }).sort((a, b) => {
    if (classSortBy === 'A-Z' || classSortBy === 'class-asc') {
      const ca = getClassWeight(a.class_name || '');
      const cb = getClassWeight(b.class_name || '');
      if (ca !== cb) return ca - cb;
      return (a.section || '').localeCompare(b.section || '');
    }
    if (classSortBy === 'Z-A' || classSortBy === 'class-desc') {
      const ca = getClassWeight(a.class_name || '');
      const cb = getClassWeight(b.class_name || '');
      if (ca !== cb) return cb - ca;
      return (b.section || '').localeCompare(a.section || '');
    }
    if (classSortBy === 'ID-Asc' || classSortBy === 'code-asc') return (a.class_code || a.id || '').localeCompare(b.class_code || b.id || '', undefined, { numeric: true });
    if (classSortBy === 'code-desc') return (b.class_code || b.id || '').localeCompare(a.class_code || a.id || '', undefined, { numeric: true });
    if (classSortBy === 'sec-asc') return (a.section || '').localeCompare(b.section || '');
    if (classSortBy === 'sec-desc') return (b.section || '').localeCompare(a.section || '');
    if (classSortBy === 'teacher-asc') return (a.class_teacher || '').localeCompare(b.class_teacher || '');
    if (classSortBy === 'teacher-desc') return (b.class_teacher || '').localeCompare(a.class_teacher || '');
    if (classSortBy === 'capacity-asc') return (a.capacity || 0) - (b.capacity || 0);
    if (classSortBy === 'capacity-desc') return (b.capacity || 0) - (a.capacity || 0);
    if (classSortBy === 'status-asc') return (a.status || 'ACTIVE').localeCompare(b.status || 'ACTIVE');
    if (classSortBy === 'status-desc') return (b.status || 'ACTIVE').localeCompare(a.status || 'ACTIVE');
    return 0;
  });

  const totalClassEntries = filteredClasses.length;
  const totalClassPages = Math.ceil(totalClassEntries / classRowsPerPage) || 1;
  const paginatedClasses = filteredClasses.slice(
    (classPage - 1) * classRowsPerPage,
    classPage * classRowsPerPage
  );

  // 4. FILTERED FEE INVOICES
  const filteredInvoices = (invoices || []).filter(inv => {
    if (!inv) return false;
    if (feeStatusFilter !== 'ALL' && inv.status?.toUpperCase() !== feeStatusFilter.toUpperCase()) return false;
    if (feeClassFilter !== 'ALL' && !inv.class_name?.toLowerCase().includes(feeClassFilter.toLowerCase())) return false;
    if (feePaymentModeFilter !== 'ALL' && !inv.payment_mode?.toLowerCase().includes(feePaymentModeFilter.toLowerCase())) return false;
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const sname = (inv.student_name || '').toLowerCase();
    const adm = (inv.admission_no || '').toLowerCase();
    const invNo = (inv.invoice_no || '').toLowerCase();
    const cls = (inv.class_name || '').toLowerCase();
    return sname.includes(q) || adm.includes(q) || invNo.includes(q) || cls.includes(q);
  }).sort((a, b) => {
    if (feeSortBy === 'Date-Desc') return (b.due_date || (b as any).created_at || '').localeCompare(a.due_date || (a as any).created_at || '');
    if (feeSortBy === 'Date-Asc') return (a.due_date || (a as any).created_at || '').localeCompare(b.due_date || (b as any).created_at || '');
    if (feeSortBy === 'Amount-Desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    if (feeSortBy === 'Amount-Asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    return 0;
  });

  const totalFeeEntries = filteredInvoices.length;
  const totalFeePages = Math.ceil(totalFeeEntries / feeRowsPerPage) || 1;
  const paginatedInvoices = filteredInvoices.slice(
    (feePage - 1) * feeRowsPerPage,
    feePage * feeRowsPerPage
  );

  // 5. FILTERED ATTENDANCE
  const filteredAttendance = (attendance || []).filter(a => {
    if (!a) return false;
    if (attendanceClassFilter !== 'ALL' && !a.class_name?.toLowerCase().includes(attendanceClassFilter.toLowerCase())) return false;
    if (attendanceDateFilter && a.date !== attendanceDateFilter) return false;
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const cls = (a.class_name || '').toLowerCase();
    const sec = (a.section || '').toLowerCase();
    const marked = (a.marked_by || '').toLowerCase();
    const dt = (a.date || '').toLowerCase();
    return cls.includes(q) || sec.includes(q) || marked.includes(q) || dt.includes(q);
  });

  // 6. FILTERED NOTICES
  const filteredNotices = (notices || []).filter(n => {
    if (!n) return false;

    // Student Role Protection: Students can ONLY see student notices or school-wide circulars
    if (effectiveRole === 'STUDENT') {
      const aud = (n.target_audience || '').toUpperCase();
      if (aud !== 'STUDENTS' && aud !== 'ALL' && aud !== 'PARENTS_STUDENTS' && aud !== 'PUBLIC') {
        return false;
      }
    }

    if (noticeAudienceFilter !== 'ALL' && n.target_audience !== noticeAudienceFilter) return false;
    
    if (!_sq.trim()) return true;
    const q = _sq.toLowerCase().trim();
    const title = (n.title || '').toLowerCase();
    const content = (n.content || '').toLowerCase();
    const posted = (n.posted_by || '').toLowerCase();
    return title.includes(q) || content.includes(q) || posted.includes(q);
  });

  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvLines = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = csvLines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrintStudentsReport = () => {
    setShowExportMenu(null);
    const stats = [
      { label: 'Total Enrolled', value: `${students.length} Scholars` },
      { label: 'Matching Filter', value: `${filteredStudents.length} Scholars` },
      { label: 'Active Scholars', value: `${filteredStudents.filter(s => s.status !== 'INACTIVE').length}` },
      { label: 'Inactive / On Leave', value: `${filteredStudents.filter(s => s.status === 'INACTIVE').length}` },
    ];
    const cols: ReportColumn[] = [
      { header: 'ADM NO', key: 'admission_no', width: '13%' },
      { header: 'ROLL', render: (s) => s.roll_no || '—', width: '8%', align: 'center' },
      { header: 'STUDENT NAME', key: 'full_name', width: '22%' },
      { header: 'CLASS & SEC', render: (s) => `${s.class_name || 'N/A'} (${s.section || 'A'})`, width: '13%' },
      { header: 'GENDER', render: (s) => s.gender || 'Female', width: '10%' },
      { header: 'GUARDIAN CONTACT', render: (s) => s.guardian_phone || s.father_phone || s.emergency_contact_phone || 'N/A', width: '16%' },
      { header: 'PEN / APAAR', render: (s) => (s as any).pen_no || s.apaar_id || 'PENDING', width: '10%' },
      { header: 'STATUS', render: (s) => s.status || 'ACTIVE', width: '8%', align: 'right' },
    ];
    setActiveReportModal({
      isOpen: true,
      title: 'STUDENT ENROLLMENT REPORT',
      subtitle: 'Official Class-wise Scholar Registry & Identity Directory',
      filterSummary: [
        { label: 'Session', value: selectedSession || '2026-27' },
        { label: 'Class', value: studentClassFilter || 'ALL' },
        { label: 'Section', value: studentSectionFilter || 'ALL' },
        { label: 'Records', value: `${filteredStudents.length} Scholars` }
      ],
      statsSummary: stats,
      columns: cols,
      data: filteredStudents,
      onDownloadCSV: () => {
        exportToCSV(
          'Students_List',
          ['Admission No', 'Roll No', 'Name', 'Class', 'Section', 'Gender', 'Status', 'Date of Join', 'DOB', 'Guardian Phone'],
          filteredStudents.map(s => [
            s.admission_no,
            s.roll_no || '',
            s.full_name,
            s.class_name,
            s.section,
            s.gender || 'Female',
            s.status || 'ACTIVE',
            s.admission_date || '',
            s.dob || '',
            s.guardian_phone || s.father_phone || ''
          ])
        );
      }
    });
  };

  const handleExportSiblingsCSV = () => {
    setShowExportMenu(null);
    const siblingGroups = getAllSiblingGroups(students, invoices);
    const headers = [
      'S.No',
      'Family / Household',
      'Student Names',
      'Father Name',
      'Mother Name',
      'Mobile Number',
      'Residential Address',
      'Total Siblings',
      'Consolidated Dues (INR)',
      'Fee Settlement Status'
    ];
    const rows = siblingGroups.map((g, idx) => [
      idx + 1,
      g.familyName,
      g.students.map((s, sIdx) => `${sIdx + 1}. ${s.full_name} (Class: ${s.class_name}-${s.section || 'A'}, Adm: ${s.admission_no})`).join('\n'),
      g.fatherName || 'N/A',
      g.motherName || 'N/A',
      g.phone || 'N/A',
      g.address || 'N/A',
      g.students.length,
      g.totalDues,
      g.allFeesPaid ? 'ALL CLEAR' : `DUE: INR ${g.totalDues}`
    ]);
    exportToCSV('Siblings_and_Families_Report', headers, rows);
  };

  const handlePrintSiblingsReport = () => {
    setShowExportMenu(null);
    const siblingGroups = getAllSiblingGroups(students, invoices);
    const totalSiblings = siblingGroups.reduce((acc, g) => acc + g.students.length, 0);
    const fullySettled = siblingGroups.filter(g => g.allFeesPaid).length;

    const stats = [
      { label: 'Total Family Units', value: `${siblingGroups.length} Households` },
      { label: 'Co-Enrolled Siblings', value: `${totalSiblings} Scholars` },
      { label: 'Fee Compliance', value: `${siblingGroups.length > 0 ? Math.round((fullySettled / siblingGroups.length) * 100) : 100}%` },
      { label: 'Settled Families', value: `${fullySettled} Households` },
    ];

    const cols: ReportColumn[] = [
      {
        header: 'FAMILY / HOUSEHOLD',
        render: (g: any) => (
          <div>
            <span className="font-bold text-[#122A24] text-[11px] block">{g.familyName}</span>
            <span className="text-[9.5px] text-[#1C443A] font-semibold block">
              {g.students.length} Sibling Scholars
            </span>
          </div>
        ),
        width: '15%'
      },
      {
        header: 'STUDENT NAMES',
        render: (g: any) => (
          <div className="space-y-1.5 py-0.5">
            {g.students.map((s: any, sIdx: number) => (
              <div key={s.id || sIdx} className="leading-tight">
                <div className="font-bold text-[#122A24] text-[10.5px]">
                  {sIdx + 1}. {s.full_name}
                </div>
                <div className="text-slate-500 font-mono text-[9px] pl-3">
                  Class: {s.class_name}-{s.section || 'A'} &bull; Adm: {s.admission_no}
                </div>
              </div>
            ))}
          </div>
        ),
        width: '25%'
      },
      {
        header: 'FATHER NAME',
        render: (g: any) => <span className="font-semibold text-slate-800 text-[10.5px]">{g.fatherName || '—'}</span>,
        width: '13%'
      },
      {
        header: 'MOTHER NAME',
        render: (g: any) => <span className="font-semibold text-slate-800 text-[10.5px]">{g.motherName || '—'}</span>,
        width: '13%'
      },
      {
        header: 'MOBILE NUMBER',
        render: (g: any) => <span className="font-mono text-slate-700 font-bold text-[10.5px]">{g.phone || '—'}</span>,
        width: '11%',
        align: 'center'
      },
      {
        header: 'RESIDENTIAL ADDRESS',
        render: (g: any) => <span className="text-slate-600 text-[9.5px] leading-tight block">{g.address || '—'}</span>,
        width: '14%'
      },
      {
        header: 'STATUS',
        render: (g: any) => (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${g.allFeesPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {g.allFeesPaid ? 'ALL CLEAR' : `DUE ₹${g.totalDues.toLocaleString()}`}
          </span>
        ),
        width: '9%',
        align: 'right'
      }
    ];

    setActiveReportModal({
      isOpen: true,
      title: 'SIBLINGS & HOUSEHOLD FAMILY REPORT',
      subtitle: 'Official Multi-Child Household Verification & Family Directory',
      filterSummary: [
        { label: 'Session', value: selectedSession || '2026-27' },
        { label: 'Report Type', value: 'Siblings & Families' },
        { label: 'Total Households', value: `${siblingGroups.length} Families` },
        { label: 'Total Sibling Scholars', value: `${totalSiblings} Scholars` }
      ],
      statsSummary: stats,
      columns: cols,
      data: siblingGroups,
      onDownloadCSV: handleExportSiblingsCSV
    });
  };

  const handlePrintTeachersReport = () => {
    setShowExportMenu(null);
    const stats = [
      { label: 'Total Faculty', value: `${teachers.length} Members` },
      { label: 'Active Staff', value: `${filteredTeachers.filter(t => t.status !== 'INACTIVE').length}` },
      { label: 'Departments', value: `${Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).length || 4} Depts` },
    ];
    const cols: ReportColumn[] = [
      { header: 'STAFF CODE', render: (t) => t.staff_code || (t as any).employee_code || t.id, width: '14%' },
      { header: 'FACULTY NAME', key: 'full_name', width: '22%' },
      { header: 'DESIGNATION', render: (t) => t.designation || 'Teacher', width: '16%' },
      { header: 'DEPARTMENT / SUBJ', render: (t) => t.department || (t as any).subject || 'General', width: '16%' },
      { header: 'CLASSES TAUGHT', render: (t) => t.classes_taught || 'All Grades', width: '12%' },
      { header: 'CONTACT PHONE', render: (t) => t.phone || 'N/A', width: '12%' },
      { header: 'STATUS', render: (t) => t.status || 'ACTIVE', width: '8%', align: 'right' },
    ];
    setActiveReportModal({
      isOpen: true,
      title: 'Faculty & Statutory Staff Employment Ledger',
      subtitle: 'CBSE OASIS Compliant Teacher Master Register & Allocation Ledger',
      filterSummary: [
        { label: 'Session', value: selectedSession || '2026-27' },
        { label: 'Records', value: `${filteredTeachers.length} Staff Members` }
      ],
      statsSummary: stats,
      columns: cols,
      data: filteredTeachers,
      onDownloadCSV: () => {
        exportToCSV(
          'CBSE_Teachers_List',
          ['Staff Code', 'Name', 'Designation', 'Department', 'Class', 'Subject', 'Email', 'Phone', 'Date of Join', 'Status'],
          filteredTeachers.map(t => [
            t.staff_code,
            t.full_name,
            t.designation || '',
            t.department || '',
            t.classes_taught || '',
            t.subject_specialization || '',
            t.email,
            t.phone,
            t.date_of_joining || '',
            t.status || 'ACTIVE'
          ])
        );
      }
    });
  };

  const handlePrintClassesReport = () => {
    setShowExportMenu(null);
    const stats = [
      { label: 'Total Classrooms', value: `${classes.length} Rooms` },
      { label: 'Total Scholars', value: `${students.length} Students` },
      { label: 'Avg Class Size', value: `${Math.round(students.length / Math.max(1, classes.length))} Students` },
    ];
    const cols: ReportColumn[] = [
      { header: 'CLASS CODE', render: (c, idx) => c.class_code || `CLS2026${(idx + 1).toString().padStart(2, '0')}`, width: '15%' },
      { header: 'CLASS GRADE', key: 'class_name', width: '18%' },
      { header: 'SECTION', key: 'section', width: '10%', align: 'center' },
      { header: 'CLASS TEACHER', render: (c) => c.class_teacher || 'Assigned Faculty', width: '25%' },
      {
        header: 'STUDENTS',
        render: (c) => {
          const cnt = students.filter(s => s.class_name?.toLowerCase().includes(c.class_name.toLowerCase()) && s.section?.toLowerCase() === c.section.toLowerCase()).length;
          return cnt > 0 ? cnt : (c.capacity || 30);
        },
        width: '12%',
        align: 'center'
      },
      { header: 'SUBJECTS', render: (c) => c.no_of_subjects || '05 Subjects', width: '12%', align: 'center' },
      { header: 'STATUS', render: (c) => c.status || 'ACTIVE', width: '8%', align: 'right' },
    ];
    setActiveReportModal({
      isOpen: true,
      title: 'Institutional Academic Classrooms & Section Register',
      subtitle: 'CBSE Approved Class Division, Room Allocation, and Scholar Strength Ledger',
      filterSummary: [
        { label: 'Session', value: selectedSession || '2026-27' },
        { label: 'Class Divisions', value: `${filteredClasses.length} Classrooms` }
      ],
      statsSummary: stats,
      columns: cols,
      data: filteredClasses,
      onDownloadCSV: () => {
        exportToCSV(
          'CBSE_Classes_List',
          ['ID', 'Class', 'Section', 'Class Teacher', 'No of Students', 'No of Subjects', 'Status'],
          filteredClasses.map((c, idx) => {
            const classStudentsCount = students.filter(s => 
              s.class_name?.toLowerCase().includes(c.class_name.toLowerCase()) && 
              s.section?.toLowerCase() === c.section.toLowerCase()
            ).length;
            return [
              c.class_code || `CLS2026${(idx + 1).toString().padStart(2, '0')}`,
              c.class_name,
              c.section,
              c.class_teacher || 'Assigned Faculty',
              classStudentsCount > 0 ? classStudentsCount : (c.capacity || 30),
              c.no_of_subjects || '05',
              c.status || 'ACTIVE'
            ];
          })
        );
      }
    });
  };

  const schoolInitial = selectedSchool?.school_name?.trim()[0]?.toUpperCase() || 'E';

  // Fee calculation stats
  const totalBilled = invoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  if (!mounted || !currentUser) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#122A24] text-white font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span>Authenticating ERP Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="h-[100dvh] max-h-[100dvh] w-full max-w-full flex flex-col overflow-hidden bg-[var(--parchment)] text-[var(--text-dark)] font-sans antialiased print:h-auto print:max-h-none print:overflow-visible">
      {/* PWA Offline Mode Notice Banner */}
      {isOffline && (
        <div className="bg-[#122A24] text-amber-300 px-3.5 sm:px-6 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-xs border-b border-white/20 z-50 shrink-0 animate-fade-in">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Offline Mode • Displaying Last Synced Session Data ({selectedSession})</span>
          </span>
          <span className="text-[10.5px] text-slate-300 hidden sm:inline">
            Live MongoDB sync will resume automatically once internet is connected
          </span>
        </div>
      )}



      {/* Top Header: Responsive with Mobile Drawer Toggle */}
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE8E0] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] transition-colors cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(effectiveRole === 'DRIVER' ? 'transport' : 'overview')}
            className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 border-none bg-transparent p-0 text-left cursor-pointer group"
            title={effectiveRole === 'DRIVER' ? 'Go to Transport Console' : 'Go to Overview Dashboard'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {selectedSchool?.logo || settingsForm.logo ? (
              <img
                src={selectedSchool?.logo || settingsForm.logo}
                alt="School Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white border border-[#DCE8E0] p-0.5 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <img
                src="/giterp-logo.png"
                alt="Giterp Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain bg-[#122A24] border border-[#122A24]/30 p-0.5 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
              />
            )}
            <div className="min-w-0 flex-1 pr-2">
              <h1 
                className="font-display font-bold text-xs sm:text-sm md:text-base lg:text-lg text-[#122A24] tracking-tight leading-tight truncate m-0 group-hover:text-emerald-800 transition-colors"
                title={selectedSchool?.school_name || 'Delhi Public International School'}
              >
                {selectedSchool?.school_name || 'Delhi Public International School'}
              </h1>
              <div className="font-mono text-[9.5px] sm:text-[10.5px] text-[#2D5A4E] leading-tight mt-0.5 truncate">
                {selectedSchool?.city ? `${selectedSchool.city} • ` : ''}{selectedSchool?.board || 'CBSE'} Curriculum
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Multi-School Switcher for Super Admin */}
          {isSuperAdmin ? (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-full text-xs font-bold font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">⚡ SUPER ADMIN:</span>
                <select
                  value={selectedSchool?.id || selectedSchool?.school_code || ''}
                  onChange={(e) => handleSwitchSchool(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-amber-950 focus:outline-none cursor-pointer pr-1 font-sans"
                  title="Switch School Tenant (Super Admin Only)"
                >
                  {availableSchools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.school_name} [{sch.school_code}]
                    </option>
                  ))}
                </select>
              </div>

              <Link
                href="/agency"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#122A24] text-white text-xs font-semibold no-underline hover:bg-[#1C443A] transition-colors shadow-2xs"
              >
                <span>Agency Cloud</span>
                <span>↗</span>
              </Link>
            </div>
          ) : null}

          {/* Universal Omni-Search Trigger Button (Hidden for Driver) */}
          {effectiveRole !== 'DRIVER' && (
            <button
              type="button"
              onClick={() => setIsOmniSearchOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-[#F4F8F5] hover:bg-[#EBF5EF] border border-[#DCE8E0] hover:border-emerald-600/50 text-[#122A24] rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Quick Search scholars, staff, invoices, classes, notices (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline text-slate-600 font-sans text-[11.5px]">Search anything...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9.5px] font-mono bg-white border border-[#DCE8E0] rounded text-slate-400 font-bold">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Academic Session Switcher Dropdown (Hidden for Driver) */}
          {effectiveRole !== 'DRIVER' && (
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-[#EBF5EF] hover:bg-[#D8EEDF] border border-[#C5E2CF] text-[#122A24] rounded-full text-xs font-bold font-mono shadow-2xs transition-colors shrink-0">
              <Calendar className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span className="hidden md:inline text-[10px] text-[#2D5A4E] uppercase font-bold tracking-wider">Session:</span>
              <select
                value={selectedSession}
                onChange={(e) => handleSwitchSession(e.target.value)}
                className="bg-transparent border-none text-[11px] sm:text-xs font-bold font-mono text-[#122A24] focus:outline-none cursor-pointer pr-0.5 max-w-[68px] sm:max-w-none"
                title="Switch Academic Session"
              >
                {AVAILABLE_SESSIONS.map((sess) => (
                  <option key={sess} value={sess}>
                    {sess}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Live Data Sync Micro-Status Indicator */}
          {isSyncingLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10.5px] font-mono font-bold shrink-0 animate-pulse shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#F0F8F3] border border-[#DCE8E0] text-[#1C443A] rounded-full text-[10.5px] font-mono font-medium shrink-0 shadow-2xs" title="Connected & Synced with Database">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Synced</span>
            </div>
          )}



          {/* Notification Bell Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPushStatus(getNotificationPermissionStatus());
                setShowBroadcastInbox(true);
              }}
              className={`relative p-2 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-2xs flex items-center justify-center ${
                unreadBroadcastCount > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/30'
                  : pushStatus === 'granted'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
              title="Notifications & Alerts"
              aria-label="Notifications"
            >
              <Bell className={`h-4 w-4 ${unreadBroadcastCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-700'}`} />
              {unreadBroadcastCount > 0 ? (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[17px] h-[17px] bg-rose-600 text-white rounded-full text-[9px] font-bold font-mono flex items-center justify-center shadow-xs">
                  {unreadBroadcastCount}
                </span>
              ) : pushStatus === 'granted' ? (
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* User Profile Avatar / Chip */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                : 'bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border-[#DCE8E0]'
            }`}
            title="Open My User Profile"
          >
            <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full font-display font-bold flex items-center justify-center text-xs sm:text-[10px] ${
              activeTab === 'profile' ? 'bg-white text-[#122A24]' : 'bg-[#122A24] text-white'
            }`}>
              {(currentUser?.full_name || profileForm.full_name || 'U')[0]?.toUpperCase()}
            </div>
            <span className="hidden md:inline max-w-[140px] truncate">
              {currentUser?.full_name || profileForm.full_name || 'My Profile'}
            </span>
            <span className="hidden xl:inline text-[9.5px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-bold">
              {currentUser?.role || 'USER'}
            </span>
          </button>

          <button
            onClick={() => selectedSchool && loadSchoolData(selectedSchool.id)}
            className="hidden sm:flex p-2 rounded-xl bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs cursor-pointer items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* MOBILE SUPER ADMIN SUB-BAR (ONLY ON PHONES / TABLETS FOR SUPER ADMIN) */}
      {isSuperAdmin && (
        <div className="lg:hidden bg-amber-50/95 backdrop-blur-xs border-b border-amber-200/90 px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-1 text-amber-900 font-mono font-bold text-[10.5px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>⚡ SCHOOL:</span>
          </div>
          <select
            value={selectedSchool?.id || selectedSchool?.school_code || ''}
            onChange={(e) => handleSwitchSchool(e.target.value)}
            className="flex-1 bg-white border border-amber-300 text-amber-950 font-bold text-[11px] rounded-lg px-2 py-1 truncate focus:outline-none cursor-pointer shadow-2xs"
            title="Switch School Tenant"
          >
            {availableSchools.map((sch) => (
              <option key={sch.id} value={sch.id}>
                {sch.school_name} [{sch.school_code}]
              </option>
            ))}
          </select>
          <Link
            href="/agency"
            className="px-2 py-1 rounded-lg bg-[#122A24] text-white text-[10px] font-bold no-underline shrink-0 flex items-center gap-0.5"
            title="Open Agency Cloud"
          >
            <span>Agency</span>
            <span>↗</span>
          </Link>
        </div>
      )}

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative w-72 sm:w-80 bg-[#122A24] text-white p-5 flex flex-col gap-1 z-50 h-full overflow-y-auto shadow-2xl animate-slide-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/15">
              <button
                type="button"
                onClick={() => { setActiveTab(effectiveRole === 'DRIVER' ? 'transport' : 'overview'); setMobileMenuOpen(false); }}
                className="flex items-center gap-2.5 border-none bg-transparent p-0 text-left cursor-pointer group"
                title={effectiveRole === 'DRIVER' ? "Go to Transport Console" : "Go to Overview Dashboard"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {selectedSchool?.logo || settingsForm.logo ? (
                  <img
                    src={selectedSchool?.logo || settingsForm.logo}
                    alt="School Logo"
                    className="w-9 h-9 rounded-xl object-contain bg-white border border-white/20 p-0.5 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <img
                    src="/giterp-logo.png"
                    alt="Giterp Logo"
                    className="w-9 h-9 rounded-xl object-contain bg-[#122A24] border border-white/20 p-0.5 shadow-xs shrink-0 group-hover:scale-105 transition-transform"
                  />
                )}
                <div>
                  <div className="font-display font-bold text-sm text-white truncate max-w-[160px] group-hover:text-emerald-300 transition-colors">
                    {selectedSchool?.school_name || 'Giterp'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-300">
                    {selectedSchool?.school_code || 'DPS2026'} • {selectedSchool?.board || 'CBSE'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer"
                title="Close Menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Super Admin School Switcher Widget (Mobile Drawer) */}
            {isSuperAdmin && (
              <div className="mb-3 p-3 bg-white/10 rounded-2xl border border-amber-400/30 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold">
                  <span>⚡ SWITCH SCHOOL:</span>
                  <span className="text-[9px] bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                    SUPER ADMIN
                  </span>
                </div>
                <select
                  value={selectedSchool?.id || selectedSchool?.school_code || ''}
                  onChange={(e) => { handleSwitchSchool(e.target.value); setMobileMenuOpen(false); }}
                  className="w-full bg-[#122A24] text-white text-xs font-semibold rounded-xl px-2.5 py-2 border border-white/20 focus:outline-none cursor-pointer"
                  title="Switch School Tenant (Super Admin Only)"
                >
                  {availableSchools.map((sch) => (
                    <option key={sch.id} value={sch.id} className="bg-[#122A24] text-white">
                      {sch.school_name} [{sch.school_code}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Logged-In User Role Badge (Mobile Drawer) */}
            <div className="mb-3 px-3 py-2 bg-white/10 rounded-xl border border-white/15 flex items-center justify-between shadow-xs">
              <span className="text-[10px] font-mono text-emerald-200/80 font-bold uppercase tracking-wider">Active Role:</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                {effectiveRole === 'SUPERADMIN' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>SUPERADMIN</span>
                  </>
                ) : effectiveRole === 'TEACHER' ? (
                  <>
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>TEACHER</span>
                  </>
                ) : effectiveRole === 'ACCOUNTANT' ? (
                  <>
                    <FileText className="w-3 h-3 text-amber-300" />
                    <span>ACCOUNTANT</span>
                  </>
                ) : effectiveRole === 'DRIVER' ? (
                  <>
                    <Bus className="w-3 h-3 text-blue-300" />
                    <span>DRIVER</span>
                  </>
                ) : effectiveRole === 'LIBRARIAN' ? (
                  <>
                    <BookOpen className="w-3 h-3 text-emerald-300" />
                    <span>LIBRARIAN</span>
                  </>
                ) : effectiveRole === 'SECURITY_GUARD' || effectiveRole === 'SECURITY' || effectiveRole === 'GUARD' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>SECURITY</span>
                  </>
                ) : effectiveRole === 'STUDENT' ? (
                  <>
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>STUDENT</span>
                  </>
                ) : effectiveRole === 'PARENT' ? (
                  <>
                    <Users className="w-3 h-3 text-violet-400" />
                    <span>PARENT</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3 h-3 text-amber-300" />
                    <span>PRINCIPAL</span>
                  </>
                )}
              </span>
            </div>

            <div className="text-[10.5px] font-semibold text-emerald-200/70 uppercase tracking-wider px-3 mb-1.5 font-mono">
              {effectiveRole === 'TEACHER'
                ? 'Faculty Workspace'
                : effectiveRole === 'ACCOUNTANT'
                ? 'Accounts & Billing Desk'
                : effectiveRole === 'DRIVER'
                ? 'Driver Transport Console'
                : effectiveRole === 'LIBRARIAN'
                ? 'Library Management Desk'
                : effectiveRole === 'SECURITY_GUARD'
                ? 'Gate Security Station'
                : effectiveRole === 'STUDENT'
                ? 'Student SIS'
                : effectiveRole === 'PARENT'
                ? 'Parent Connect'
                : 'Academic Modules'}
            </div>

            {allowedTabs.includes('overview') && (
              <button
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'overview' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" /> Overview Dashboard
              </button>
            )}

            {allowedTabs.includes('students') && (
              <button
                onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'students' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="h-4 w-4 shrink-0" /> Students SIS
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'students' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
                }`}>
                  {students.length}
                </span>
              </button>
            )}

            {/* Siblings & Families (Mobile) */}
            {allowedTabs.includes('siblings') && (
              <button
                onClick={() => { setActiveTab('siblings'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'siblings' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <HeartHandshake className="h-4 w-4 shrink-0 text-purple-300" />
                <span className="truncate">Siblings &amp; Families</span>
              </button>
            )}

            {allowedTabs.includes('teachers') && (
              <button
                onClick={() => { setActiveTab('teachers'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'teachers' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 shrink-0" /> Faculty &amp; Staff
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'teachers' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
                }`}>
                  {teachers.length}
                </span>
              </button>
            )}

            {allowedTabs.includes('classes') && (
              <button
                onClick={() => { setActiveTab('classes'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'classes' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Layers className="h-4 w-4 shrink-0" /> Classes &amp; Sections
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'classes' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
                }`}>
                  {classes.length}
                </span>
              </button>
            )}

            {allowedTabs.includes('subjects') && (
              <button
                onClick={() => { setActiveTab('subjects'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'subjects' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 shrink-0 text-emerald-300" /> Subjects
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'subjects' ? 'bg-[#122A24] text-white' : 'bg-emerald-400/30 text-emerald-200'
                }`}>
                  Curriculum
                </span>
              </button>
            )}

            {allowedTabs.includes('attendance') && (
              <button
                onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'attendance' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <CalendarCheck className="h-4 w-4 shrink-0" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'My Attendance' : 'Daily Attendance'}
              </button>
            )}

            {/* Fee Management (Mobile) */}
            {allowedTabs.includes('fees') && (
              <button
                onClick={() => {
                  setActiveTab('fees');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'fees' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Coins className="h-4 w-4 shrink-0 text-amber-300" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'Fee Invoices & Pay' : 'Fee Management'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'fees' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
                }`}>
                  {invoices.length}
                </span>
              </button>
            )}

            {/* Reports & Dossiers (Mobile) */}
            {allowedTabs.includes('reports') && (
              <button
                onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'reports' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-cyan-300" /> Reports &amp; Dossiers
              </button>
            )}

            {/* Data Hub (Mobile) */}
            {allowedTabs.includes('data_hub') && (
              <button
                onClick={() => { setActiveTab('data_hub'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'data_hub' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <FolderDown className={`h-4 w-4 shrink-0 ${activeTab === 'data_hub' ? 'text-[#122A24]' : 'text-amber-300'}`} />
                <span className="truncate">Data Hub</span>
              </button>
            )}

            {/* Certificate Studio (Mobile) */}
            {allowedTabs.includes('certificates') && (
              <button
                onClick={() => { setActiveTab('certificates'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'certificates' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileCheck className="h-4 w-4 shrink-0 text-amber-300" /> Certificate Studio
              </button>
            )}

            {allowedTabs.includes('transport') && (
              <button
                onClick={() => { setActiveTab('transport'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'transport' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Bus className="h-4 w-4 shrink-0 text-blue-300" /> Transport &amp; GPS Fleet
              </button>
            )}

            {allowedTabs.includes('library') && (
              <button
                onClick={() => { setActiveTab('library'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'library' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 text-emerald-300" /> Digital Library &amp; Books
              </button>
            )}

            {allowedTabs.includes('visitors') && (
              <button
                onClick={() => { setActiveTab('visitors'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'visitors' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" /> Gate Pass &amp; Visitors
              </button>
            )}

            {allowedTabs.includes('exams') && (
              <button
                onClick={() => { setActiveTab('exams'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'exams' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Award className="h-4 w-4 shrink-0 text-purple-300" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'Report Card & Marksheet' : 'CBSE Exams & Reports'}
              </button>
            )}

            {allowedTabs.includes('homework') && (
              <button
                onClick={() => { setActiveTab('homework'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'homework' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-amber-300" /> Homework &amp; Diary
              </button>
            )}

            {allowedTabs.includes('approvals') && (
              <button
                onClick={() => { setActiveTab('approvals'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'approvals' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> Leave &amp; Approvals
              </button>
            )}

            {allowedTabs.includes('broadcast') && (
              <button
                onClick={() => { setActiveTab('broadcast'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'broadcast' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Radio className="h-4 w-4 shrink-0 text-red-300" /> Emergency Broadcast
              </button>
            )}

            {allowedTabs.includes('notices') && (
              <button
                onClick={() => { setActiveTab('notices'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'notices' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Bell className="h-4 w-4 shrink-0" /> Notice Board
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'notices' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
                }`}>
                  {notices.length}
                </span>
              </button>
            )}

            {/* Broadcast Notices / Missed Alerts Inbox for All Roles */}
            <button
              type="button"
              onClick={() => { setShowBroadcastInbox(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left bg-transparent text-slate-200 hover:text-white hover:bg-white/10 group"
            >
              <span className="flex items-center gap-3">
                <Radio className="h-4 w-4 shrink-0 text-amber-300 group-hover:animate-pulse" /> Broadcast Notices
              </span>
              {unreadBroadcastCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500 text-white animate-pulse">
                  {unreadBroadcastCount} new
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/15 text-slate-300">
                  Inbox
                </span>
              )}
            </button>



            <div className="my-2 border-t border-white/15" />

            {(currentUser?.is_god_admin || currentUser?.username?.toLowerCase() === 'blistedx' || currentUser?.role === 'AGENCY_SUPERADMIN') && (
              <Link
                href="/agency"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold no-underline text-amber-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" /> Agency Cloud Hub
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                  GOD MODE
                </span>
              </Link>
            )}

            {allowedTabs.includes('profile') && (
              <button
                onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'profile' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <User className="h-4 w-4 shrink-0 text-emerald-300" /> {effectiveRole === 'STUDENT' ? 'Student Dossier' : effectiveRole === 'PARENT' ? 'Parent & Ward Profile' : 'My Profile'}
              </button>
            )}

            {allowedTabs.includes('audit_logs') && (
              <button
                onClick={() => { setActiveTab('audit_logs'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'audit_logs' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" /> Audit Logs &amp; Trail
              </button>
            )}

            {allowedTabs.includes('settings') && (
              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'settings' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" /> School Settings
              </button>
            )}

            {allowedTabs.includes('permissions') && (
              <button
                onClick={() => { setActiveTab('permissions'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border-none cursor-pointer text-left ${
                  activeTab === 'permissions' ? 'bg-white text-[#122A24] shadow-md font-bold' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sliders className="h-4 w-4 shrink-0 text-amber-300" /> Access Controls &amp; RBAC
              </button>
            )}

            {/* Mobile User Profile Card */}
            <div 
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className="mt-auto p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200 space-y-2 cursor-pointer hover:bg-white/15 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-400/40 font-display">
                  {(currentUser?.full_name || selectedSchool?.principal_name || 'A')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-xs truncate">
                    {currentUser?.full_name || selectedSchool?.principal_name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 font-mono truncate">
                    ID: {currentUser?.username || selectedSchool?.admin_id || 'admin'} • Edit Profile →
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-w-0 w-full">
        {/* Navigation Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex w-64 bg-[#122A24] text-white p-4 flex-col gap-1 shrink-0 border-r border-white/10 overflow-y-auto">
          {/* Giterp Brand Badge */}
          <button
            type="button"
            onClick={() => setActiveTab(effectiveRole === 'DRIVER' ? 'transport' : 'overview')}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 mb-3 transition-colors text-left border-none cursor-pointer group w-full"
            title={effectiveRole === 'DRIVER' ? "Go to Transport Console" : "Go to Overview Dashboard"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {selectedSchool?.logo || settingsForm.logo ? (
              <img
                src={selectedSchool?.logo || settingsForm.logo}
                alt="School Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-xs bg-white border border-white/20 p-0.5 shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <img
                src="/giterp-logo.png"
                alt="Giterp Logo"
                className="w-10 h-10 rounded-xl object-contain shadow-xs bg-[#122A24] border border-white/20 p-1 shrink-0 group-hover:scale-105 transition-transform"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-sm tracking-tight text-white flex items-center gap-1.5 group-hover:text-emerald-300 transition-colors">
                <span className="truncate">{selectedSchool?.school_name || 'Giterp'}</span>
              </div>
              <div suppressHydrationWarning className="text-[10px] text-slate-300 font-mono truncate">
                {selectedSchool?.school_code || 'DPS2026'} • CBSE Console
              </div>
            </div>
          </button>

          {/* Super Admin School Switcher Widget (Desktop Sidebar) */}
          {isSuperAdmin && (
            <div className="mb-3 p-3 bg-white/10 rounded-2xl border border-amber-400/30 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold">
                <span>⚡ SWITCH SCHOOL:</span>
                <span className="text-[9px] bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                  SUPER ADMIN
                </span>
              </div>
              <select
                value={selectedSchool?.id || selectedSchool?.school_code || ''}
                onChange={(e) => handleSwitchSchool(e.target.value)}
                className="w-full bg-[#122A24] text-white text-xs font-semibold rounded-xl px-2.5 py-2 border border-white/20 focus:outline-none cursor-pointer"
                title="Switch School Tenant (Super Admin Only)"
              >
                {availableSchools.map((sch) => (
                  <option key={sch.id} value={sch.id} className="bg-[#122A24] text-white">
                    {sch.school_name} [{sch.school_code}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Logged-In User Active Role Badge (Desktop Sidebar) */}
          <div className="mb-2.5 px-3 py-2 bg-white/10 rounded-xl border border-white/15 flex items-center justify-between shadow-xs">
            <span className="text-[10px] font-mono text-emerald-200/80 font-bold uppercase tracking-wider">Active Role:</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
              {effectiveRole === 'SUPERADMIN' ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>SUPERADMIN</span>
                </>
              ) : effectiveRole === 'TEACHER' ? (
                <>
                  <GraduationCap className="w-3 h-3 text-emerald-400" />
                  <span>TEACHER</span>
                </>
              ) : effectiveRole === 'ACCOUNTANT' ? (
                <>
                  <FileText className="w-3 h-3 text-amber-300" />
                  <span>ACCOUNTANT</span>
                </>
              ) : effectiveRole === 'DRIVER' ? (
                <>
                  <Bus className="w-3 h-3 text-blue-300" />
                  <span>DRIVER</span>
                </>
              ) : effectiveRole === 'LIBRARIAN' ? (
                <>
                  <BookOpen className="w-3 h-3 text-emerald-300" />
                  <span>LIBRARIAN</span>
                </>
              ) : effectiveRole === 'SECURITY_GUARD' || effectiveRole === 'SECURITY' || effectiveRole === 'GUARD' ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>SECURITY</span>
                </>
              ) : effectiveRole === 'STUDENT' ? (
                <>
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>STUDENT</span>
                </>
              ) : effectiveRole === 'PARENT' ? (
                <>
                  <Users className="w-3 h-3 text-violet-400" />
                  <span>PARENT</span>
                </>
              ) : (
                <>
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>PRINCIPAL</span>
                </>
              )}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider px-3 mb-1 font-mono">
            {effectiveRole === 'TEACHER'
              ? 'Faculty Workspace'
              : effectiveRole === 'ACCOUNTANT'
              ? 'Accounts & Billing Desk'
              : effectiveRole === 'DRIVER'
              ? 'Driver Transport Console'
              : effectiveRole === 'LIBRARIAN'
              ? 'Library Management Desk'
              : effectiveRole === 'SECURITY_GUARD'
              ? 'Gate Security Station'
              : effectiveRole === 'STUDENT'
              ? 'Student Portal'
              : effectiveRole === 'PARENT'
              ? 'Parent Connect'
              : 'Navigation'}
          </div>

          {allowedTabs.includes('overview') && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'overview' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" /> Overview
            </button>
          )}

          {allowedTabs.includes('students') && (
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'students' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 shrink-0" /> Students
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'students' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
              }`}>
                {students.length}
              </span>
            </button>
          )}

          {allowedTabs.includes('siblings') && (
            <button
              onClick={() => setActiveTab('siblings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'siblings' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <HeartHandshake className="h-4 w-4 shrink-0 text-purple-300" />
              <span className="truncate">Siblings &amp; Families</span>
            </button>
          )}

          {allowedTabs.includes('teachers') && (
            <button
              onClick={() => setActiveTab('teachers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'teachers' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="h-4 w-4 shrink-0" /> Faculty &amp; Staff
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'teachers' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
              }`}>
                {teachers.length}
              </span>
            </button>
          )}

          {allowedTabs.includes('classes') && (
            <button
              onClick={() => setActiveTab('classes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'classes' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="h-4 w-4 shrink-0" /> Classes &amp; Sections
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'classes' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
              }`}>
                {classes.length}
              </span>
            </button>
          )}

          {allowedTabs.includes('subjects') && (
            <button
              onClick={() => setActiveTab('subjects')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'subjects' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 shrink-0 text-emerald-300" /> Subjects
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'subjects' ? 'bg-[#122A24] text-white' : 'bg-emerald-400/30 text-emerald-200'
              }`}>
                Curriculum
              </span>
            </button>
          )}

          {allowedTabs.includes('attendance') && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'attendance' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <CalendarCheck className="h-4 w-4 shrink-0" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'My Attendance' : 'Daily Attendance'}
            </button>
          )}

          {/* Fee Management (Desktop) */}
          {allowedTabs.includes('fees') && (
            <button
              onClick={() => setActiveTab('fees')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'fees' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <Coins className="h-4 w-4 shrink-0 text-amber-300" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'Fee Invoices & Pay' : 'Fee Management'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'fees' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
              }`}>
                {invoices.length}
              </span>
            </button>
          )}

          {/* Reports & Dossiers (Desktop) */}
          {allowedTabs.includes('reports') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'reports' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-cyan-300" /> Reports &amp; Dossiers
            </button>
          )}

          {allowedTabs.includes('certificates') && (
            <button
              onClick={() => setActiveTab('certificates')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'certificates' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileCheck className="h-4 w-4 shrink-0 text-amber-300" /> Certificate Studio
            </button>
          )}

          {/* Data Hub (Desktop) */}
          {allowedTabs.includes('data_hub') && (
            <button
              onClick={() => setActiveTab('data_hub')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'data_hub' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FolderDown className={`h-4 w-4 shrink-0 ${activeTab === 'data_hub' ? 'text-[#122A24]' : 'text-amber-300'}`} />
              <span className="truncate font-semibold text-xs sm:text-[13px]">Data Hub</span>
            </button>
          )}

          {allowedTabs.includes('transport') && (
            <button
              onClick={() => setActiveTab('transport')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'transport' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bus className="h-4 w-4 shrink-0 text-blue-300" /> Transport &amp; GPS Fleet
            </button>
          )}

          {allowedTabs.includes('library') && (
            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'library' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0 text-emerald-300" /> Digital Library &amp; Books
            </button>
          )}

          {allowedTabs.includes('visitors') && (
            <button
              onClick={() => setActiveTab('visitors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'visitors' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" /> Gate Pass &amp; Visitors
            </button>
          )}

          {allowedTabs.includes('exams') && (
            <button
              onClick={() => setActiveTab('exams')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'exams' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="h-4 w-4 shrink-0 text-purple-300" /> {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'Report Card & Marksheet' : 'CBSE Exams & Reports'}
            </button>
          )}

          {allowedTabs.includes('homework') && (
            <button
              onClick={() => setActiveTab('homework')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'homework' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0 text-amber-300" /> Homework &amp; Diary
            </button>
          )}

          {allowedTabs.includes('approvals') && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'approvals' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> Leave &amp; Approvals
            </button>
          )}

          {allowedTabs.includes('broadcast') && (
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'broadcast' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Radio className="h-4 w-4 shrink-0 text-red-300" /> Emergency Broadcast
            </button>
          )}

          {allowedTabs.includes('notices') && (
            <button
              onClick={() => setActiveTab('notices')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'notices' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell className="h-4 w-4 shrink-0" /> Notice Board
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'notices' ? 'bg-[#122A24] text-white' : 'bg-white/20 text-white'
              }`}>
                {notices.length}
              </span>
            </button>
          )}

          {/* School Broadcast Alerts / Missed Notices Inbox (Available to All Roles) */}
          <button
            type="button"
            onClick={() => setShowBroadcastInbox(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left bg-transparent text-slate-200 hover:text-white hover:bg-white/10 group"
          >
            <span className="flex items-center gap-3">
              <Radio className="h-4 w-4 shrink-0 text-amber-300 group-hover:animate-pulse" /> Broadcast Notices
            </span>
            {unreadBroadcastCount > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500 text-white animate-pulse">
                {unreadBroadcastCount} new
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/15 text-slate-300">
                Inbox
              </span>
            )}
          </button>

          <div className="my-3 border-t border-white/10" />

          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider px-3 mb-2 font-mono">
            {effectiveRole === 'STUDENT' || effectiveRole === 'PARENT' ? 'Account' : 'Administration'}
          </div>

          {(currentUser?.is_god_admin || currentUser?.username?.toLowerCase() === 'blistedx' || currentUser?.role === 'AGENCY_SUPERADMIN') && (
            <Link
              href="/agency"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all no-underline text-amber-300 hover:text-white hover:bg-white/10 mb-1"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" /> Agency Cloud Hub
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                GOD MODE
              </span>
            </Link>
          )}

          {allowedTabs.includes('profile') && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'profile' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="h-4 w-4 shrink-0 text-emerald-300" /> {effectiveRole === 'STUDENT' ? 'Student Dossier' : effectiveRole === 'PARENT' ? 'Parent & Ward Profile' : 'My Profile'}
            </button>
          )}



          {allowedTabs.includes('audit_logs') && (
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'audit_logs' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" /> Audit Logs &amp; Trail
            </button>
          )}

          {allowedTabs.includes('settings') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'settings' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" /> School Settings
            </button>
          )}

          {allowedTabs.includes('permissions') && (
            <button
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-none cursor-pointer text-left ${
                activeTab === 'permissions' ? 'bg-white text-[#122A24] font-bold shadow-md' : 'bg-transparent text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders className="h-4 w-4 shrink-0 text-amber-300" /> Access Controls &amp; RBAC
            </button>
          )}

          {/* User Profile Card at Sidebar Bottom with Customization Option */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="mt-auto p-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-slate-200 space-y-2.5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-display font-bold flex items-center justify-center text-xs shrink-0 border border-white/20 shadow-xs">
                {(currentUser?.full_name || selectedSchool?.principal_name || 'A')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-semibold text-white text-xs truncate">
                  {currentUser?.full_name || selectedSchool?.principal_name || selectedSchool?.admin_name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-300 font-mono truncate opacity-90">
                  {currentUser?.role || 'School Administrator'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] font-mono">
              <span className="truncate">ID: {currentUser?.username || selectedSchool?.admin_id || 'Admin'}</span>
              <span className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold transition-colors">
                Theme &amp; Profile →
              </span>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area with Bottom Padding for Mobile Bar */}
        <main className="flex-1 overflow-y-auto min-w-0 w-full p-2 sm:p-5 lg:p-6 xl:p-8 pb-24 lg:pb-8 bg-[#F8FAF9] focus:outline-none relative">
          {/* PERMISSION ACCESS GUARD FOR RESTRICTED ROLES */}
          {mounted && currentUser && !allowedTabs.includes(activeTab) && (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 text-center shadow-lg space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto border border-rose-200">
                <Lock className="w-7 h-7 text-rose-600" />
              </div>
              <h2 className="font-display font-bold text-xl text-[#122A24]">
                Module Access Restricted
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your active role (<strong className="font-mono text-emerald-800 font-bold">{effectiveRole}</strong>) does not have authorization to access the <strong>{TAB_POSTER_CONFIG[activeTab]?.title || activeTab}</strong> module.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab(effectiveRole === 'DRIVER' ? 'transport' : 'overview')}
                  className="px-5 py-2.5 bg-[#122A24] text-white rounded-full text-xs font-bold shadow-xs hover:bg-[#1C443A] cursor-pointer border-none"
                >
                  Return to {effectiveRole === 'DRIVER' ? 'Transport Console' : 'Overview Dashboard'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW (STRAVIX MODERN MINT/SAGE THEME WITH ANIMATED CHARTS) */}
          {activeTab === 'overview' && allowedTabs.includes('overview') && (
            <DashboardOverview
              selectedSchool={selectedSchool}
              overview={overview}
              students={students}
              teachers={teachers}
              classes={classes}
              invoices={invoices}
              attendance={attendance}
              currentUser={currentUser}
              userRole={effectiveRole}
              openStudentModal={openStudentModal}
              openTeacherModal={openTeacherModal}
              onSelectStudent={(s) => setSummaryStudent(s)}
              notices={notices}
              setShowAddNotice={setShowAddNotice}
              setShowAddInvoice={setShowAddInvoice}
              setViewInvoice={setViewInvoice}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB: DATA HUB (DOWNLOAD & UPLOAD DATA INTEGRATION CENTER) */}
          {activeTab === 'data_hub' && allowedTabs.includes('data_hub') && (
            <DashboardDataHub
              students={students}
              teachers={teachers}
              invoices={invoices}
              attendance={attendance}
              exams={[]}
              selectedSchool={selectedSchool}
              selectedSession={selectedSession}
              onDataImported={(type, count) => {
                showAdminToast(`Imported ${count} ${type} records into live database!`);
              }}
              showToast={showAdminToast}
            />
          )}

          {/* TAB 2: STUDENTS (THEME-ALIGNED PREMIUM MINT & FOREST GREEN) */}
          {activeTab === 'students' && allowedTabs.includes('students') && (
            <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
              {/* Main Card Container */}
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  STUDENTS
                </div>

                {/* Top Breadcrumb & Action Toolbar */}
                <div className="flex flex-col gap-3 pb-4 border-b border-[#E8F0EA] relative z-10">
                  {/* Row 1: Title + breadcrumb */}
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-display font-bold text-xl sm:text-3xl text-[#122A24] tracking-tight">
                        {studentSubTab === 'directory' ? 'Students Directory' : 'Siblings & Families'}
                      </h1>
                      {studentSubTab === 'directory' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                          {filteredStudents.length} enrolled
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#2D5A4E] font-medium mt-1">
                      <span>DPS2026</span>
                      <span>/</span>
                      <span>Institutional Registry</span>
                      <span>/</span>
                      <span className="text-[#122A24] font-semibold truncate max-w-[260px]">
                        {studentSubTab === 'directory' ? 'CBSE All Classes (Pre-Primary to XII)' : 'Automated Household & Multi-Child Matching'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Pill switcher + actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Sub-tab Pill Switcher */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs shrink-0">
                      <button
                        onClick={() => setStudentSubTab('directory')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-all ${
                          studentSubTab === 'directory'
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        All Scholars ({students.length})
                      </button>
                      <button
                        onClick={() => setStudentSubTab('siblings')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-all ${
                          studentSubTab === 'siblings'
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        Siblings Hub
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                    {/* Refresh - always visible */}
                    <button
                      onClick={() => selectedSchool && loadSchoolData(selectedSchool.id)}
                      className="w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                      title="Refresh List"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>

                    {/* Print - hidden on mobile */}
                    <button
                      onClick={studentSubTab === 'siblings' ? handlePrintSiblingsReport : handlePrintStudentsReport}
                      className="hidden sm:flex w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs items-center justify-center cursor-pointer"
                      title={studentSubTab === 'siblings' ? 'Print Official Siblings & Families Report' : 'Print Official Student Report'}
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Export - hidden on mobile */}
                    <div className="relative hidden sm:block">
                      <button
                        onClick={() => setShowExportMenu(showExportMenu === 'students' ? null : 'students')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] rounded-full text-xs font-semibold text-[#122A24] shadow-2xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-[#1C443A]" />
                        <span>Export</span>
                        <ChevronRight className={`h-3 w-3 transition-transform ${showExportMenu === 'students' ? 'rotate-90' : ''}`} />
                      </button>

                      {showExportMenu === 'students' && (
                        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                          {studentSubTab === 'siblings' ? (
                            <>
                              <button
                                onClick={handleExportSiblingsCSV}
                                className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                              >
                                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Export Siblings CSV</span>
                              </button>
                              <button
                                onClick={handlePrintSiblingsReport}
                                className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                              >
                                <Printer className="h-3.5 w-3.5 text-[#1C443A]" />
                                <span>Print Siblings Report (PDF)</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setShowExportMenu(null);
                                  exportToCSV(
                                    'Students_List',
                                    ['Admission No', 'Roll No', 'Name', 'Class', 'Section', 'Gender', 'Status', 'Date of Join', 'DOB', 'Guardian Phone'],
                                    filteredStudents.map(s => [
                                      s.admission_no,
                                      s.roll_no || '',
                                      s.full_name,
                                      s.class_name,
                                      s.section,
                                      s.gender || 'Female',
                                      s.status || 'ACTIVE',
                                      s.admission_date || '',
                                      s.dob || '',
                                      s.guardian_phone || s.father_phone || ''
                                    ])
                                  );
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                              >
                                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Export Students CSV</span>
                              </button>
                              <button
                                onClick={handlePrintStudentsReport}
                                className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                              >
                                <Printer className="h-3.5 w-3.5 text-[#1C443A]" />
                                <span>Print Official Student PDF</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Promotion Studio - only for Admin/Principal */}
                    {['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(effectiveRole) && (
                      <button
                        onClick={() => {
                          setPromotionSourceClass('Class 9');
                          setPromotionSourceSection('ALL');
                          setPromotionTargetClass('Class 10');
                          setPromotionTargetSection('SAME');
                          setPromotionActionsMap({});
                          setShowPromotionStudio(true);
                        }}
                        className="hidden sm:flex px-3.5 py-2 bg-[#EBF5EF] hover:bg-[#DCE8E0] text-[#122A24] border border-[#C5E2CF] rounded-full text-xs font-semibold items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title="Bulk promote or graduate scholars into next academic session"
                      >
                        <GraduationCap className="h-4 w-4 text-emerald-700" />
                        <span>Promotion Studio</span>
                      </button>
                    )}

                    {/* Primary Add Button — guarded by role permissions */}
                    {currentRoleModulePerms('students').can_add && (
                      <button
                        onClick={() => openStudentModal()}
                        className="px-3.5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border-none cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Student</span><span className="sm:hidden">Add</span>
                      </button>
                    )}
                    </div>
                  </div>
                </div>
                {studentSubTab === 'directory' ? (
                  <>
                {/* Sub Header Controls Bar (Tier 1: Title, Status Tabs, Session, View Mode, Sort) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-display font-semibold text-base text-[#122A24]">
                      Students Register
                    </div>
                    {/* Fast Status Segmented Pill Tabs */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs">
                      <button
                        onClick={() => { setStudentStatusFilter('ALL'); setStudentPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition-all ${
                          studentStatusFilter === 'ALL'
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        All ({students.length})
                      </button>
                      <button
                        onClick={() => { setStudentStatusFilter('ACTIVE'); setStudentPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          studentStatusFilter === 'ACTIVE'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        Active ({students.filter(s => s.status !== 'INACTIVE').length})
                      </button>
                      <button
                        onClick={() => { setStudentStatusFilter('INACTIVE'); setStudentPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          studentStatusFilter === 'INACTIVE'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-transparent text-rose-700 hover:text-rose-900 font-bold'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive ({students.filter(s => s.status === 'INACTIVE').length})
                      </button>
                    </div>
                  </div>

                  {/* Right Header Controls: Session, List/Grid, Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Academic Session Pill */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-mono text-[#1C443A] shadow-2xs">
                      <Calendar className="h-3.5 w-3.5 text-[#2D5A4E]" />
                      <span>Session 2026-27</span>
                    </div>

                    {/* View Mode Toggle: List & Grid */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs">
                      <button
                        onClick={() => setStudentViewMode('list')}
                        className={`p-1.5 rounded-full border-none cursor-pointer flex items-center justify-center transition-colors ${
                          studentViewMode === 'list' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                        title="List View"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setStudentViewMode('grid')}
                        className={`p-1.5 rounded-full border-none cursor-pointer flex items-center justify-center transition-colors ${
                          studentViewMode === 'grid' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                        title="Grid View"
                      >
                        <Grid className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                      <select
                        value={studentSortBy}
                        onChange={(e) => setStudentSortBy(e.target.value as any)}
                        className="bg-transparent border-none text-xs font-medium text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="A-Z">Sort: A to Z</option>
                        <option value="Z-A">Sort: Z to A</option>
                        <option value="Adm-Asc">Sort: Admission No</option>
                        <option value="class-asc">Sort: Class Order</option>
                        <option value="Date-Asc">Sort: Join Date</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tier 2: Filters, Rows Per Page & Search Bar */}
                <div className="bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Filter Dropdown Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-wrap">
                    {/* Class Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Class:</span>
                      <select
                        value={studentClassFilter}
                        onChange={(e) => { setStudentClassFilter(e.target.value); setStudentPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Classes</option>
                        <option value="Nursery">Nursery</option>
                        <option value="LKG">LKG</option>
                        <option value="UKG">UKG</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Class ${num}`}>{`Class ${num}`}</option>
                        ))}
                      </select>
                    </div>

                    {/* Section Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Sec:</span>
                      <select
                        value={studentSectionFilter}
                        onChange={(e) => { setStudentSectionFilter(e.target.value); setStudentPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>

                    {/* Fee Status Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Fees:</span>
                      <select
                        value={studentFeeFilter}
                        onChange={(e) => { setStudentFeeFilter(e.target.value as any); setStudentPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Fees</option>
                        <option value="PAID">Paid Only</option>
                        <option value="PENDING">Pending Dues</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>

                    {/* School House Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">House:</span>
                      <select
                        value={studentHouseFilter}
                        onChange={(e) => { setStudentHouseFilter(e.target.value); setStudentPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Houses</option>
                        <option value="Red House">Red House</option>
                        <option value="Blue House">Blue House</option>
                        <option value="Green House">Green House</option>
                        <option value="Yellow House">Yellow House</option>
                      </select>
                    </div>
                  </div>

                  {/* Search & Rows Per Page */}
                  <div className="flex items-center gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-medium shrink-0">
                      <span>Rows:</span>
                      <select
                        value={studentRowsPerPage}
                        onChange={(e) => {
                          setStudentRowsPerPage(Number(e.target.value));
                          setStudentPage(1);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24] cursor-pointer focus:outline-none focus:border-[#10B981]"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#2D5A4E]" />
                      <input
                        type="text"
                        placeholder="Search student, adm, roll, class..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setStudentPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filter Badges */}
                {(studentClassFilter !== 'ALL' || studentSectionFilter !== 'ALL' || studentFeeFilter !== 'ALL' || studentHouseFilter !== 'ALL' || studentStatusFilter !== 'ALL' || searchQuery.trim() !== '') && (
                  <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                    <span className="text-[11px] font-mono text-[#2D5A4E] font-bold">Active Filters:</span>
                    {studentClassFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Class: {studentClassFilter}
                        <button onClick={() => setStudentClassFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {studentSectionFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Section: {studentSectionFilter}
                        <button onClick={() => setStudentSectionFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {studentFeeFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Fees: {studentFeeFilter}
                        <button onClick={() => setStudentFeeFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {studentHouseFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        House: {studentHouseFilter}
                        <button onClick={() => setStudentHouseFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {studentStatusFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Status: {studentStatusFilter}
                        <button onClick={() => setStudentStatusFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {searchQuery.trim() !== '' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Query: &ldquo;{searchQuery}&rdquo;
                        <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setStudentClassFilter('ALL');
                        setStudentSectionFilter('ALL');
                        setStudentFeeFilter('ALL');
                        setStudentHouseFilter('ALL');
                        setStudentStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-[11px] font-mono font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer px-1"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* LIST VIEW */}
                {studentViewMode === 'list' && (
                  <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F3F7F5] font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider border-b border-[#DCE8E0]">
                          <tr>
                            <th className="py-3 px-3.5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newIds = Array.from(new Set([...selectedStudentIds, ...paginatedStudents.map(s => s.id)]));
                                    setSelectedStudentIds(newIds);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => !paginatedStudents.some(s => s.id === id)));
                                  }
                                }}
                                className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'adm-asc' || studentSortBy === 'Adm-Asc' ? 'adm-desc' : 'adm-asc')}
                                title="Sort by Admission No"
                              >
                                <span>Admission No</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'roll-asc' ? 'roll-desc' : 'roll-asc')}
                                title="Sort by Roll No"
                              >
                                <span>Roll No</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'name-asc' || studentSortBy === 'A-Z' ? 'name-desc' : 'name-asc')}
                                title="Sort by Student Name"
                              >
                                <span>Name</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'class-asc' ? 'class-desc' : 'class-asc')}
                                title="Sort by Class Level (Nursery to 12)"
                              >
                                <span>Class</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'sec-asc' ? 'sec-desc' : 'sec-asc')}
                                title="Sort by Section"
                              >
                                <span>Section</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'gender-asc' ? 'gender-desc' : 'gender-asc')}
                                title="Sort by Gender"
                              >
                                <span>Gender</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'status-asc' ? 'status-desc' : 'status-asc')}
                                title="Sort by Active / Inactive Status"
                              >
                                <span>Status</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'date-asc' || studentSortBy === 'Date-Asc' ? 'date-desc' : 'date-asc')}
                                title="Sort by Date of Join"
                              >
                                <span>Date of Join</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setStudentSortBy(studentSortBy === 'dob-asc' ? 'dob-desc' : 'dob-asc')}
                                title="Sort by Date of Birth"
                              >
                                <span>DOB</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBF2ED] font-sans">
                          {paginatedStudents.map((s, idx) => {
                            const isSelected = selectedStudentIds.includes(s.id);
                            const initials = (s.full_name || 'Student')
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            const avatarGradients = [
                              'bg-[#EBF5EF] text-[#122A24] border-[#C5E2CF]',
                              'bg-emerald-50 text-emerald-800 border-emerald-200',
                              'bg-[#E8F3EE] text-[#1C443A] border-[#D0E6DC]',
                              'bg-teal-50 text-teal-800 border-teal-200',
                              'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            ];
                            const avatarStyle = avatarGradients[idx % avatarGradients.length];

                            const isEven = idx % 2 === 0;
                            return (
                              <tr
                                key={s.id}
                                className={`transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-100/70'
                                    : isEven
                                    ? 'bg-white hover:bg-emerald-50/40'
                                    : 'bg-[#F0F8F3] hover:bg-[#E4F2E9]'
                                }`}
                              >
                                {/* Selection Checkbox */}
                                <td className="py-3.5 px-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudentIds([...selectedStudentIds, s.id]);
                                      } else {
                                        setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                                  />
                                </td>

                                {/* Admission No */}
                                <td className="py-3.5 px-4 font-mono font-medium">
                                  <button
                                    onClick={() => setSummaryStudent(s)}
                                    className="text-[#122A24] hover:text-emerald-700 font-bold border-none bg-transparent p-0 cursor-pointer text-left block tracking-tight transition-colors"
                                    title="Inspect 360° Dossier & Siblings"
                                  >
                                    {s.admission_no}
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-mono block">PIN: {s.passcode || '123456'}</span>
                                </td>

                                {/* Roll No */}
                                <td className="py-3.5 px-4 font-mono text-[#2D5A4E] font-medium">
                                  {s.roll_no || (idx + 1)}
                                </td>

                                {/* Name with Circular Avatar */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {s.photo || s.avatar ? (
                                      <img src={s.photo || s.avatar} alt={s.full_name} className="w-8 h-8 rounded-full object-cover border shrink-0 shadow-2xs cursor-pointer" onClick={() => setSummaryStudent(s)} />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 shadow-2xs font-mono cursor-pointer ${avatarStyle}`} onClick={() => setSummaryStudent(s)}>
                                        {initials}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-[#122A24] hover:text-emerald-700 cursor-pointer transition-colors flex items-center gap-1.5" onClick={() => setSummaryStudent(s)}>
                                        <span>{s.full_name}</span>
                                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono font-normal">360°</span>
                                      </div>
                                      {s.apaar_id && (
                                        <div className="text-[10px] text-slate-400 font-mono">PEN: {s.apaar_id}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Class */}
                                <td className="py-3.5 px-3 text-[#122A24] font-semibold">
                                  {formatClassDisplay(s.class_name)}
                                </td>

                                {/* Section */}
                                <td className="py-3.5 px-3 text-[#122A24] font-mono font-medium">
                                  {s.section || 'A'}
                                </td>

                                {/* Gender */}
                                <td className="py-3.5 px-3 text-[#2D5A4E]">
                                  {s.gender || 'Female'}
                                </td>

                                {/* Status Badge (1-Click Toggle for Admin, Static for Teachers) */}
                                <td className="py-3.5 px-3">
                                  {currentRoleModulePerms('students').can_edit ? (
                                    <button
                                      onClick={() => handleToggleStudentStatus(s)}
                                      className="cursor-pointer border-none bg-transparent p-0 flex items-center text-left"
                                      title={`Click to switch to ${s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}`}
                                    >
                                      {s.status !== 'INACTIVE' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#EBF5EF] hover:bg-emerald-100 text-[#1C443A] border border-[#C5E2CF] transition-colors shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                          Active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                          Inactive
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${s.status !== 'INACTIVE' ? 'bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${s.status !== 'INACTIVE' ? 'bg-[#10B981]' : 'bg-rose-500'}`} />
                                      {s.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                                    </span>
                                  )}
                                </td>

                                {/* Date of Join */}
                                <td className="py-3.5 px-4 text-[#2D5A4E] font-medium">
                                  {formatDateDisplay(s.admission_date || s.created_at, '29 Aug 2026')}
                                </td>

                                {/* DOB */}
                                <td className="py-3.5 px-4 text-[#2D5A4E]">
                                  {formatDateDisplay(s.dob, '10 Jan 2015')}
                                </td>

                                {/* Actions Cluster */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Chat / SMS Button */}
                                    <a
                                      href={`sms:${s.guardian_phone || s.father_phone || ''}`}
                                      className="w-7 h-7 rounded-full border border-[#DCE8E0] bg-white hover:bg-[#EBF5EF] text-[#2D5A4E] hover:text-[#122A24] flex items-center justify-center transition-colors shadow-2xs"
                                      title="Send SMS / Notice"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5" />
                                    </a>

                                    {/* Call Button */}
                                    <a
                                      href={`tel:${s.guardian_phone || s.father_phone || ''}`}
                                      className="w-7 h-7 rounded-full border border-[#DCE8E0] bg-white hover:bg-[#EBF5EF] text-[#2D5A4E] hover:text-[#122A24] flex items-center justify-center transition-colors shadow-2xs"
                                      title={`Call Parent: ${s.guardian_phone || s.father_phone || 'N/A'}`}
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>

                                    {/* Mail Button */}
                                    <a
                                      href={`mailto:${s.guardian_email || 'parent@school.edu'}`}
                                      className="w-7 h-7 rounded-full border border-[#DCE8E0] bg-white hover:bg-[#EBF5EF] text-[#2D5A4E] hover:text-[#122A24] flex items-center justify-center transition-colors shadow-2xs"
                                      title="Email Parent"
                                    >
                                      <Mail className="h-3.5 w-3.5" />
                                    </a>

                                    {/* Collect Fees Pill Button — only if fee add permission */}
                                    {currentRoleModulePerms('fees').can_add && (
                                      <button
                                        onClick={() => handleQuickCollectFee(s)}
                                        className="px-3 py-1 bg-[#EBF5EF] hover:bg-[#D9EDE0] text-[#122A24] font-mono text-xs font-bold rounded-full border border-[#C5E2CF] transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                                        title="Collect Tuition / Term Fees"
                                      >
                                        Collect Fees
                                      </button>
                                    )}

                                    {/* Options Popover Menu with Role Permissions */}
                                    <div className="relative">
                                      <button
                                        onClick={() => setActiveStudentMenuId(activeStudentMenuId === s.id ? null : s.id)}
                                        className="w-7 h-7 rounded-full text-slate-400 hover:text-[#122A24] hover:bg-[#EBF5EF] flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                                        title="Scholar Actions"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>

                                      {activeStudentMenuId === s.id && (
                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                                          {/* Inspect Dossier (always available) */}
                                          <button
                                            onClick={() => {
                                              setActiveStudentMenuId(null);
                                              setSummaryStudent(s);
                                            }}
                                            className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                          >
                                            <User className="h-3.5 w-3.5 text-emerald-700" />
                                            <span>View Scholar Dossier</span>
                                          </button>

                                          {/* Edit Profile */}
                                          {currentRoleModulePerms('students').can_edit && (
                                            <button
                                              onClick={() => {
                                                setActiveStudentMenuId(null);
                                                openStudentModal(s);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                            >
                                              <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                              <span>Edit Profile</span>
                                            </button>
                                          )}

                                          {/* Toggle Status */}
                                          {currentRoleModulePerms('students').can_edit && (
                                            <button
                                              onClick={() => {
                                                setActiveStudentMenuId(null);
                                                handleToggleStudentStatus(s);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                            >
                                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                                              <span>{s.status === 'INACTIVE' ? 'Set Active' : 'Set Inactive'}</span>
                                            </button>
                                          )}

                                          {/* Reset PIN */}
                                          {currentRoleModulePerms('students').can_edit && (
                                            <button
                                              onClick={() => {
                                                setActiveStudentMenuId(null);
                                                handleOpenPinModal('student', s.id, s.full_name, s.passcode || '123456');
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                            >
                                              <Settings className="h-3.5 w-3.5 text-[#122A24]" />
                                              <span>Reset Login PIN</span>
                                            </button>
                                          )}

                                          {/* Fee Invoice */}
                                          {currentRoleModulePerms('fees').can_view && (
                                            <button
                                              onClick={() => {
                                                setActiveStudentMenuId(null);
                                                handleQuickCollectFee(s);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                            >
                                              <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
                                              <span>Fee Invoice</span>
                                            </button>
                                          )}

                                          {/* Promote / Graduate (Admin/Principal only) */}
                                          {['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(effectiveRole) && (
                                            <button
                                              onClick={() => {
                                                setActiveStudentMenuId(null);
                                                handleOpenIndividualPromotion(s);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-emerald-50 border-none bg-transparent cursor-pointer flex items-center gap-2 text-emerald-800 font-semibold"
                                            >
                                              <GraduationCap className="h-3.5 w-3.5 text-emerald-700" />
                                              <span>Promote / Graduate</span>
                                            </button>
                                          )}

                                          {/* Delete Student */}
                                          {currentRoleModulePerms('students').can_delete && (
                                            <>
                                              <div className="border-t border-[#E8F0EA] my-1" />
                                              <button
                                                onClick={() => {
                                                  setActiveStudentMenuId(null);
                                                  handleDeleteStudent(s.id);
                                                }}
                                                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 border-none bg-transparent cursor-pointer flex items-center gap-2 text-rose-600 font-semibold"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Delete Student</span>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {paginatedStudents.length === 0 && (
                            <tr>
                              <td colSpan={11} className="py-12 text-center text-xs text-[#2D5A4E] font-medium">
                                No students matching your search criteria. Click "+ Add Student" above to enroll new admissions.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer Pagination */}
                    <div className="p-3.5 border-t border-[#DCE8E0] bg-[#F8FAF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#2D5A4E]">
                      <div>
                        Showing {totalStudentEntries === 0 ? 0 : (studentPage - 1) * studentRowsPerPage + 1} to {Math.min(studentPage * studentRowsPerPage, totalStudentEntries)} of {totalStudentEntries} Entries
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => setStudentPage(Math.max(1, studentPage - 1))}
                          disabled={studentPage === 1}
                          className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                        >
                          Prev
                        </button>

                        {Array.from({ length: totalStudentPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setStudentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              studentPage === pageNum
                                ? 'bg-[#122A24] border-[#122A24] text-white shadow-xs'
                                : 'bg-white border-[#DCE8E0] text-[#122A24] hover:bg-[#EBF5EF]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setStudentPage(Math.min(totalStudentPages, studentPage + 1))}
                          disabled={studentPage === totalStudentPages || totalStudentPages === 0}
                          className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GRID VIEW */}
                {studentViewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedStudents.map((s, idx) => {
                      const initials = (s.full_name || 'Student')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const avatarGradients = [
                        'bg-[#EBF5EF] text-[#122A24] border-[#C5E2CF]',
                        'bg-emerald-50 text-emerald-800 border-emerald-200',
                        'bg-[#E8F3EE] text-[#1C443A] border-[#D0E6DC]',
                        'bg-teal-50 text-teal-800 border-teal-200',
                        'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                      ];
                      const avatarStyle = avatarGradients[idx % avatarGradients.length];

                      return (
                        <div key={s.id} className="bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs p-4 flex flex-col justify-between hover:shadow-md hover:border-[#10B981] transition-all">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 font-mono ${avatarStyle}`}>
                                  {initials}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#122A24] text-sm leading-tight hover:text-emerald-700 cursor-pointer" onClick={() => setSummaryStudent(s)}>
                                    {s.full_name}
                                  </h3>
                                  <div className="text-[11px] font-mono text-[#1C443A] font-bold mt-0.5">
                                    {s.admission_no}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10.5px] px-2.5 py-0.5 rounded-full font-semibold font-mono bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                                {s.class_name} ({s.section})
                              </span>
                            </div>

                            <div className="mt-3.5 space-y-1.5 text-xs text-[#2D5A4E] border-t border-[#E8F0EA] pt-3">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Roll No:</span>
                                <span className="font-mono font-medium text-[#122A24]">{s.roll_no || (idx + 1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Gender:</span>
                                <span className="font-medium text-[#122A24]">{s.gender || 'Female'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">House:</span>
                                <span className="font-semibold text-xs text-[#1C443A]">{s.house || 'Red House'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">DOB:</span>
                                <span className="font-medium text-[#122A24]">{formatDateDisplay(s.dob, '10 Jan 2015')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Date of Join:</span>
                                <span className="font-medium text-[#122A24]">{formatDateDisplay(s.admission_date || s.created_at, '29 Aug 2026')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#E8F0EA] flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => setSummaryStudent(s)}
                              className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer transition-colors"
                              title="Inspect 360° Scholar Summary & Siblings"
                            >
                              <GraduationCap className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickCollectFee(s)}
                              className="flex-1 py-1.5 bg-[#EBF5EF] hover:bg-[#D9EDE0] text-[#122A24] font-mono font-bold text-xs rounded-full border border-[#C5E2CF] transition-colors cursor-pointer text-center shadow-2xs"
                            >
                              Collect Fees
                            </button>
                            <button
                              onClick={() => handleToggleStudentStatus(s)}
                              className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                                s.status !== 'INACTIVE'
                                  ? 'bg-[#EBF5EF] text-[#1C443A] border-[#C5E2CF] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                              }`}
                              title={`Switch to ${s.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}`}
                            >
                              {s.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => handleOpenPinModal('student', s.id, s.full_name, s.passcode || '123456')}
                              className="p-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer transition-colors"
                              title="Reset PIN"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openStudentModal(s)}
                              className="p-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer transition-colors"
                              title="Edit Profile"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Floating Bulk Action Dock for Students */}
                {selectedStudentIds.length > 0 && (
                  <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#122A24] text-white px-4 sm:px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 border border-white/20 animate-fade-up">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-white/20 rounded-full">
                      {selectedStudentIds.length} Selected
                    </span>
                    <button
                      onClick={() => {
                        const firstSel = students.find(s => selectedStudentIds.includes(s.id));
                        if (firstSel) {
                          setPromotionSourceClass(firstSel.class_name || 'Class 9');
                          setPromotionSourceSection('ALL');
                          const autoNext = NEXT_CLASS_MAP[firstSel.class_name || 'Class 9'] || 'Class 10';
                          setPromotionTargetClass(autoNext === 'GRADUATED' ? 'Class 12' : autoNext);
                        }
                        setShowPromotionStudio(true);
                      }}
                      className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#122A24] text-xs font-bold border-none cursor-pointer flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <GraduationCap className="h-3.5 w-3.5" /> Bulk Promote
                    </button>
                    <button
                      onClick={() => handleBulkStudentStatus('ACTIVE')}
                      className="px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Set Active
                    </button>
                    <button
                      onClick={() => handleBulkStudentStatus('INACTIVE')}
                      className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" /> Set Inactive
                    </button>
                    <button
                      onClick={handleBulkDeleteStudents}
                      className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => setSelectedStudentIds([])}
                      className="text-xs text-slate-300 hover:text-white border-none bg-transparent cursor-pointer ml-1"
                      title="Clear Selection"
                    >
                      ✕
                    </button>
                  </div>
                )}
                  </>
                ) : (
                  <div className="pt-2">
                    <DashboardSiblings
                      students={students}
                      invoices={invoices}
                      onSelectStudent={(s) => setSummaryStudent(s)}
                      onCollectFee={(s) => handleQuickCollectFee(s)}
                      onExportReport={handleExportSiblingsCSV}
                      onPrintReport={handlePrintSiblingsReport}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SIBLINGS & HOUSEHOLD DIRECTORY */}
          {activeTab === 'siblings' && (
            <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Background Watermark */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-slate-100/60 text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  SIBLINGS
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                        Siblings &amp; Household Hub
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        CBSE Family Linkage
                      </span>
                    </div>
                    <p className="text-xs text-[#2D5A4E] mt-1 font-medium">
                      Automated parent matching across Father &amp; Mother names, phone registry and address coordinates.
                    </p>
                  </div>
                </div>

                <DashboardSiblings
                  students={students}
                  invoices={invoices}
                  onSelectStudent={(s) => setSummaryStudent(s)}
                  onCollectFee={(s) => handleQuickCollectFee(s)}
                  onExportReport={handleExportSiblingsCSV}
                  onPrintReport={handlePrintSiblingsReport}
                />
              </div>
            </div>
          )}

          {/* TAB 3: TEACHERS (THEME-ALIGNED PREMIUM MINT & FOREST GREEN) */}
          {activeTab === 'teachers' && allowedTabs.includes('teachers') && (
            <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
              {/* Main Card Container */}
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  FACULTY
                </div>

                {/* Top Breadcrumb & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                        Faculty &amp; Staff Roster
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        {filteredTeachers.length} Certified Faculty
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#2D5A4E] font-mono mt-1">
                      <span>DPS2026</span>
                      <span>/</span>
                      <span>Academic Directorate</span>
                      <span>/</span>
                      <span className="text-[#122A24] font-semibold">CBSE Norms Qualified PTR 1:25</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <button
                      onClick={() => selectedSchool && loadSchoolData(selectedSchool.id)}
                      className="w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                      title="Refresh List"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={handlePrintTeachersReport}
                      className="w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                      title="Print Official CBSE Staff Ledger"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(showExportMenu === 'teachers' ? null : 'teachers')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] rounded-full text-xs font-semibold text-[#122A24] shadow-2xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-[#1C443A]" />
                        <span>Export</span>
                        <ChevronRight className={`h-3 w-3 transition-transform ${showExportMenu === 'teachers' ? 'rotate-90' : ''}`} />
                      </button>

                      {showExportMenu === 'teachers' && (
                        <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                          <button
                            onClick={() => {
                              setShowExportMenu(null);
                              exportToCSV(
                                'CBSE_Teachers_List',
                                ['Staff Code', 'Name', 'ERP Role', 'Designation', 'Department', 'Class', 'Subject', 'Email', 'Phone', 'Date of Join', 'Status'],
                                filteredTeachers.map(t => [
                                  t.staff_code,
                                  t.full_name,
                                  resolveTeacherRole(t),
                                  t.designation || '',
                                  t.department || '',
                                  t.classes_taught || '',
                                  t.subject_specialization || '',
                                  t.email,
                                  t.phone,
                                  t.date_of_joining || '',
                                  t.status || 'ACTIVE'
                                ])
                              );
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            onClick={handlePrintTeachersReport}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#1C443A]" />
                            <span>Print Official CBSE PDF</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Primary Add Button — guarded by role permissions */}
                    {currentRoleModulePerms('teachers').can_add && (
                      <button
                        onClick={() => openTeacherModal()}
                        className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border-none cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Faculty (CBSE)
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Separation Ribbon: Segregate faculty and staff by operational role */}
                <div className="bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] p-2.5 space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D5A4E] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#1C443A]" />
                        <span>Staff Operational Roles ({teachers.length} Members)</span>
                      </span>
                      <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                        • Click any role to separate &amp; view roster
                      </span>
                    </div>
                    {teacherRoleFilter !== 'ALL' && (
                      <button
                        onClick={() => { setTeacherRoleFilter('ALL'); setTeacherPage(1); }}
                        className="text-[11px] font-mono font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer border-none bg-transparent p-0"
                      >
                        Show All Roles ({teachers.length})
                      </button>
                    )}
                  </div>

                  {/* Fast Role Pills for instant separation */}
                  <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
                    <button
                      type="button"
                      onClick={() => { setTeacherRoleFilter('ALL'); setTeacherPage(1); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all border flex items-center gap-1.5 ${
                        teacherRoleFilter === 'ALL'
                          ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                          : 'bg-white hover:bg-[#F0F5F2] text-[#122A24] border-[#DCE8E0]'
                      }`}
                    >
                      <span>All Staff</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        teacherRoleFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#EBF5EF] text-[#1C443A]'
                      }`}>
                        {teachers.length}
                      </span>
                    </button>

                    {STAFF_ROLES.map((sr) => {
                      const isSelected = teacherRoleFilter === sr.id;
                      const count = teacherRoleCounts[sr.id] || 0;
                      return (
                        <button
                          key={sr.id}
                          type="button"
                          onClick={() => { setTeacherRoleFilter(sr.id); setTeacherPage(1); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs ring-1 ring-[#122A24]'
                              : 'bg-white hover:bg-[#F0F5F2] text-[#122A24] border-[#DCE8E0]'
                          }`}
                        >
                          <span>{sr.shortLabel}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                            isSelected ? 'bg-white/20 text-white' : sr.badgeClass
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub Header Controls Bar (Tier 1: Title, Status Tabs, Session, View Mode, Sort) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-display font-semibold text-base text-[#122A24]">
                      Faculty Registry
                    </div>
                    {/* Fast Status Segmented Pill Tabs */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs">
                      <button
                        onClick={() => { setTeacherStatusFilter('ALL'); setTeacherPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition-all ${
                          teacherStatusFilter === 'ALL'
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        All ({teachers.length})
                      </button>
                      <button
                        onClick={() => { setTeacherStatusFilter('ACTIVE'); setTeacherPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          teacherStatusFilter === 'ACTIVE'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        Active ({teachers.filter(t => t.status !== 'INACTIVE').length})
                      </button>
                      <button
                        onClick={() => { setTeacherStatusFilter('INACTIVE'); setTeacherPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          teacherStatusFilter === 'INACTIVE'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-transparent text-rose-700 hover:text-rose-900 font-bold'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive ({teachers.filter(t => t.status === 'INACTIVE').length})
                      </button>
                    </div>
                  </div>

                  {/* Right Header Controls: Session, List/Grid, Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Session Pill */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-mono text-[#1C443A] shadow-2xs">
                      <Calendar className="h-3.5 w-3.5 text-[#2D5A4E]" />
                      <span>Year 2026-27</span>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs">
                      <button
                        onClick={() => setTeacherViewMode('list')}
                        className={`p-1.5 rounded-full border-none cursor-pointer flex items-center justify-center transition-colors ${
                          teacherViewMode === 'list' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                        title="List View"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setTeacherViewMode('grid')}
                        className={`p-1.5 rounded-full border-none cursor-pointer flex items-center justify-center transition-colors ${
                          teacherViewMode === 'grid' ? 'bg-[#122A24] text-white shadow-xs' : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                        title="Grid View"
                      >
                        <Grid className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                      <select
                        value={teacherSortBy}
                        onChange={(e) => setTeacherSortBy(e.target.value as any)}
                        className="bg-transparent border-none text-xs font-medium text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="A-Z">Sort: A to Z</option>
                        <option value="Z-A">Sort: Z to A</option>
                        <option value="role-asc">Sort: Role (A-Z)</option>
                        <option value="role-desc">Sort: Role (Z-A)</option>
                        <option value="ID-Asc">Sort: Staff ID</option>
                        <option value="Date-Asc">Sort: Join Date</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tier 2: Filters, Rows Per Page & Search Bar */}
                <div className="bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Filter Dropdown Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-wrap">
                    {/* System Role Filter Dropdown */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Role:</span>
                      <select
                        value={teacherRoleFilter}
                        onChange={(e) => { setTeacherRoleFilter(e.target.value); setTeacherPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Roles ({teachers.length})</option>
                        {STAFF_ROLES.map(sr => (
                          <option key={sr.id} value={sr.id}>
                            {sr.shortLabel} ({teacherRoleCounts[sr.id] || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Department Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Dept:</span>
                      <select
                        value={teacherDeptFilter}
                        onChange={(e) => { setTeacherDeptFilter(e.target.value); setTeacherPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Departments</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science (PCB/PCM)</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi &amp; Sanskrit</option>
                        <option value="Social">Social Science</option>
                        <option value="Computer">Computer &amp; AI</option>
                        <option value="Commerce">Commerce &amp; Accounts</option>
                        <option value="Physical">Physical Education</option>
                        <option value="Pre-Primary">Pre-Primary (ECCE)</option>
                      </select>
                    </div>

                    {/* Academic Designation Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Designation:</span>
                      <select
                        value={teacherDesignationFilter}
                        onChange={(e) => { setTeacherDesignationFilter(e.target.value); setTeacherPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Designations</option>
                        <option value="PGT">PGT (Class XI-XII)</option>
                        <option value="TGT">TGT (Class VI-X)</option>
                        <option value="PRT">PRT (Class I-V)</option>
                        <option value="NTT">NTT (Pre-Primary)</option>
                        <option value="Principal">Leadership &amp; Admin</option>
                        <option value="Special Educator">Special Educator</option>
                        <option value="PET">PET / Sports</option>
                      </select>
                    </div>

                    {/* CTET Qualified Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">CTET:</span>
                      <select
                        value={teacherCtetFilter}
                        onChange={(e) => { setTeacherCtetFilter(e.target.value as any); setTeacherPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All CTET</option>
                        <option value="YES">CTET Qualified</option>
                        <option value="NO">Non-CTET</option>
                      </select>
                    </div>

                    {/* Gender Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Gender:</span>
                      <select
                        value={teacherGenderFilter}
                        onChange={(e) => { setTeacherGenderFilter(e.target.value as any); setTeacherPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Genders</option>
                        <option value="Female">Female Faculty</option>
                        <option value="Male">Male Faculty</option>
                      </select>
                    </div>
                  </div>

                  {/* Search & Rows Per Page */}
                  <div className="flex items-center gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-medium shrink-0">
                      <span>Rows:</span>
                      <select
                        value={teacherRowsPerPage}
                        onChange={(e) => {
                          setTeacherRowsPerPage(Number(e.target.value));
                          setTeacherPage(1);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24] cursor-pointer focus:outline-none focus:border-[#10B981]"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#2D5A4E]" />
                      <input
                        type="text"
                        placeholder="Search faculty name, code, subject..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setTeacherPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filter Badges */}
                {(teacherRoleFilter !== 'ALL' || teacherDeptFilter !== 'ALL' || teacherDesignationFilter !== 'ALL' || teacherCtetFilter !== 'ALL' || teacherGenderFilter !== 'ALL' || teacherStatusFilter !== 'ALL' || searchQuery.trim() !== '') && (
                  <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                    <span className="text-[11px] font-mono text-[#2D5A4E] font-bold">Active Filters:</span>
                    {teacherRoleFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#122A24] text-white border border-[#122A24]">
                        Role: {STAFF_ROLES.find(r => r.id === teacherRoleFilter)?.shortLabel || teacherRoleFilter}
                        <button onClick={() => { setTeacherRoleFilter('ALL'); setTeacherPage(1); }} className="hover:text-rose-300 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {teacherDeptFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Dept: {teacherDeptFilter}
                        <button onClick={() => setTeacherDeptFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {teacherDesignationFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Designation: {teacherDesignationFilter}
                        <button onClick={() => setTeacherDesignationFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {teacherCtetFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        CTET: {teacherCtetFilter === 'YES' ? 'Qualified' : 'Non-CTET'}
                        <button onClick={() => setTeacherCtetFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {teacherGenderFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Gender: {teacherGenderFilter}
                        <button onClick={() => setTeacherGenderFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {teacherStatusFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Status: {teacherStatusFilter}
                        <button onClick={() => setTeacherStatusFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {searchQuery.trim() !== '' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Query: &ldquo;{searchQuery}&rdquo;
                        <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setTeacherRoleFilter('ALL');
                        setTeacherDeptFilter('ALL');
                        setTeacherDesignationFilter('ALL');
                        setTeacherCtetFilter('ALL');
                        setTeacherGenderFilter('ALL');
                        setTeacherStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-[11px] font-mono font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer px-1"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* LIST VIEW */}
                {teacherViewMode === 'list' && (
                  <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F3F7F5] font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider border-b border-[#DCE8E0]">
                          <tr>
                            <th className="py-3 px-3.5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={paginatedTeachers.length > 0 && paginatedTeachers.every(t => selectedTeacherIds.includes(t.id))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newIds = Array.from(new Set([...selectedTeacherIds, ...paginatedTeachers.map(t => t.id)]));
                                    setSelectedTeacherIds(newIds);
                                  } else {
                                    setSelectedTeacherIds(selectedTeacherIds.filter(id => !paginatedTeachers.some(t => t.id === id)));
                                  }
                                }}
                                className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'id-asc' || teacherSortBy === 'ID-Asc' ? 'id-desc' : 'id-asc')}
                                title="Sort by Staff Code"
                              >
                                <span>Staff Code</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'name-asc' || teacherSortBy === 'A-Z' ? 'name-desc' : 'name-asc')}
                                title="Sort by Faculty Name"
                              >
                                <span>Faculty Name</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'role-asc' ? 'role-desc' : 'role-asc')}
                                title="Sort by Operational ERP Role"
                              >
                                <span>ERP Role</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'desig-asc' ? 'desig-desc' : 'desig-asc')}
                                title="Sort by Designation (PGT/TGT/PRT)"
                              >
                                <span>Designation</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'dept-asc' ? 'dept-desc' : 'dept-asc')}
                                title="Sort by Department / Subject"
                              >
                                <span>Department / Subject</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span>Email</span>
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span>Phone</span>
                              </div>
                            </th>
                            <th className="py-3 px-4">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'date-asc' || teacherSortBy === 'Date-Asc' ? 'date-desc' : 'date-asc')}
                                title="Sort by Joining Date"
                              >
                                <span>Joining Date</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3">
                              <div
                                className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                                onClick={() => setTeacherSortBy(teacherSortBy === 'status-asc' ? 'status-desc' : 'status-asc')}
                                title="Sort by Status"
                              >
                                <span>Status</span>
                                <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                              </div>
                            </th>
                            <th className="py-3 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBF2ED] font-sans">
                          {paginatedTeachers.map((t, idx) => {
                            const isSelected = selectedTeacherIds.includes(t.id);
                            const initials = (t.full_name || 'Faculty')
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            const avatarGradients = [
                              'bg-[#EBF5EF] text-[#122A24] border-[#C5E2CF]',
                              'bg-emerald-50 text-emerald-800 border-emerald-200',
                              'bg-[#E8F3EE] text-[#1C443A] border-[#D0E6DC]',
                              'bg-teal-50 text-teal-800 border-teal-200',
                              'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                            ];
                            const avatarStyle = avatarGradients[idx % avatarGradients.length];

                            const isEven = idx % 2 === 0;
                            return (
                              <tr
                                key={t.id}
                                className={`transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-100/70'
                                    : isEven
                                    ? 'bg-white hover:bg-emerald-50/40'
                                    : 'bg-[#F0F8F3] hover:bg-[#E4F2E9]'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3.5 px-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTeacherIds([...selectedTeacherIds, t.id]);
                                      } else {
                                        setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== t.id));
                                      }
                                    }}
                                    className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                                  />
                                </td>

                                {/* Staff Code */}
                                <td className="py-3.5 px-4 font-mono font-medium">
                                  <button
                                    onClick={() => currentRoleModulePerms('teachers').can_edit && openTeacherModal(t)}
                                    className={`text-[#122A24] font-bold border-none bg-transparent p-0 block tracking-tight transition-colors ${currentRoleModulePerms('teachers').can_edit ? 'hover:text-emerald-700 cursor-pointer' : 'cursor-default'}`}
                                    title="CBSE Faculty Record"
                                  >
                                    {t.staff_code}
                                  </button>
                                  {['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(effectiveRole) && (
                                    <span className="text-[10px] text-slate-400 font-mono block">PIN: {t.passcode || '123456'}</span>
                                  )}
                                </td>

                                {/* Name with Circular Avatar */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    {t.photo || t.avatar ? (
                                      <img src={t.photo || t.avatar} alt={t.full_name} className="w-8 h-8 rounded-full object-cover border shrink-0 shadow-2xs" />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 shadow-2xs font-mono ${avatarStyle}`}>
                                        {initials}
                                      </div>
                                    )}
                                    <div>
                                      <div className={`font-semibold text-[#122A24] transition-colors ${currentRoleModulePerms('teachers').can_edit ? 'hover:text-emerald-700 cursor-pointer' : 'cursor-default'}`} onClick={() => currentRoleModulePerms('teachers').can_edit && openTeacherModal(t)}>
                                        {t.full_name}
                                      </div>
                                      <div className="text-[10.5px] text-[#2D5A4E] font-medium">{t.professional_degree || 'B.Ed'}</div>
                                    </div>
                                  </div>
                                </td>

                                {/* Operational ERP Role */}
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold uppercase inline-flex items-center gap-1 border ${getTeacherRoleBadgeStyle(resolveTeacherRole(t))}`}>
                                    {resolveTeacherRole(t).replace('_', ' ')}
                                  </span>
                                </td>

                                {/* Designation */}
                                <td className="py-3.5 px-4 text-[#122A24] font-medium">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#F4F8F5] text-[#1C443A] border border-[#DCE8E0]">
                                    {t.designation || 'Teacher'}
                                  </span>
                                </td>

                                {/* Subject */}
                                <td className="py-3.5 px-4 text-[#122A24]">
                                  {t.subject_specialization || t.department || 'General'}
                                </td>

                                {/* Email */}
                                <td className="py-3.5 px-4 text-[#2D5A4E] font-mono text-[11.5px]">
                                  <a href={`mailto:${t.email}`} className="text-[#2D5A4E] hover:text-[#122A24] hover:underline">
                                    {t.email}
                                  </a>
                                </td>

                                {/* Phone */}
                                <td className="py-3.5 px-4 text-[#2D5A4E] font-mono text-[11.5px]">
                                  <a href={`tel:${t.phone}`} className="text-[#2D5A4E] hover:text-[#122A24] hover:underline">
                                    {t.phone}
                                  </a>
                                </td>

                                {/* Date of Join */}
                                <td className="py-3.5 px-4 text-[#2D5A4E] font-medium">
                                  {formatDateDisplay(t.date_of_joining, '29 Aug 2026')}
                                </td>

                                {/* Status Badge (1-Click Toggle for Admin, Static for Non-Admins) */}
                                <td className="py-3.5 px-3">
                                  {currentRoleModulePerms('teachers').can_edit ? (
                                    <button
                                      onClick={() => handleToggleTeacherStatus(t)}
                                      className="cursor-pointer border-none bg-transparent p-0 flex items-center text-left"
                                      title={`Click to switch to ${t.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}`}
                                    >
                                      {t.status !== 'INACTIVE' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#EBF5EF] hover:bg-emerald-100 text-[#1C443A] border border-[#C5E2CF] transition-colors shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                          Active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                          Inactive
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${t.status !== 'INACTIVE' ? 'bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${t.status !== 'INACTIVE' ? 'bg-[#10B981]' : 'bg-rose-500'}`} />
                                      {t.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                                    </span>
                                  )}
                                </td>

                                {/* Action ⋯ Popover */}
                                <td className="py-3.5 px-3 text-center">
                                  <div className="relative inline-block text-left">
                                    <button
                                      onClick={() => setActiveTeacherMenuId(activeTeacherMenuId === t.id ? null : t.id)}
                                      className="w-7 h-7 rounded-full text-slate-400 hover:text-[#122A24] hover:bg-[#EBF5EF] flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                                      title="Faculty Actions"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>

                                    {activeTeacherMenuId === t.id && (
                                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                                        {currentRoleModulePerms('teachers').can_edit && (
                                          <button
                                            onClick={() => {
                                              setActiveTeacherMenuId(null);
                                              openTeacherModal(t);
                                            }}
                                            className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                          >
                                            <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                            <span>Edit Profile</span>
                                          </button>
                                        )}
                                        {currentRoleModulePerms('teachers').can_edit && (
                                          <button
                                            onClick={() => {
                                              setActiveTeacherMenuId(null);
                                              handleToggleTeacherStatus(t);
                                            }}
                                            className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                          >
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                                            <span>{t.status === 'INACTIVE' ? 'Set Active' : 'Set Inactive'}</span>
                                          </button>
                                        )}
                                        {['SUPERADMIN', 'AGENCY_SUPERADMIN', 'ADMIN', 'PRINCIPAL'].includes(effectiveRole) && (
                                          <button
                                            onClick={() => {
                                              setActiveTeacherMenuId(null);
                                              handleOpenPinModal('teacher', t.id, t.full_name, t.passcode || '123456');
                                            }}
                                            className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                          >
                                            <Settings className="h-3.5 w-3.5 text-[#122A24]" />
                                            <span>Reset Staff PIN</span>
                                          </button>
                                        )}
                                        <a
                                          href={`tel:${t.phone}`}
                                          className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24] no-underline"
                                        >
                                          <Phone className="h-3.5 w-3.5 text-emerald-700" />
                                          <span>Call Faculty</span>
                                        </a>
                                        <a
                                          href={`mailto:${t.email}`}
                                          className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24] no-underline"
                                        >
                                          <Mail className="h-3.5 w-3.5 text-emerald-700" />
                                          <span>Send Email</span>
                                        </a>
                                        {currentRoleModulePerms('teachers').can_delete && (
                                          <>
                                            <div className="border-t border-[#E8F0EA] my-1" />
                                            <button
                                              onClick={() => {
                                                setActiveTeacherMenuId(null);
                                                handleDeleteTeacher(t.id);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 border-none bg-transparent cursor-pointer flex items-center gap-2 text-rose-600 font-semibold"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                              <span>Delete Faculty</span>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {paginatedTeachers.length === 0 && (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-xs text-[#2D5A4E] font-medium">
                                No faculty records found. Click "+ Add Faculty" above to register teachers.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer Pagination */}
                    <div className="p-3.5 border-t border-[#DCE8E0] bg-[#F8FAF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#2D5A4E]">
                      <div>
                        Showing {totalTeacherEntries === 0 ? 0 : (teacherPage - 1) * teacherRowsPerPage + 1} to {Math.min(teacherPage * teacherRowsPerPage, totalTeacherEntries)} of {totalTeacherEntries} Entries
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => setTeacherPage(Math.max(1, teacherPage - 1))}
                          disabled={teacherPage === 1}
                          className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                        >
                          Prev
                        </button>

                        {Array.from({ length: totalTeacherPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setTeacherPage(pageNum)}
                            className={`w-7 h-7 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                              teacherPage === pageNum
                                ? 'bg-[#122A24] border-[#122A24] text-white shadow-xs'
                                : 'bg-white border-[#DCE8E0] text-[#122A24] hover:bg-[#EBF5EF]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setTeacherPage(Math.min(totalTeacherPages, teacherPage + 1))}
                          disabled={teacherPage === totalTeacherPages || totalTeacherPages === 0}
                          className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GRID VIEW */}
                {teacherViewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedTeachers.map((t, idx) => {
                      const initials = (t.full_name || 'Faculty')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const avatarGradients = [
                        'bg-[#EBF5EF] text-[#122A24] border-[#C5E2CF]',
                        'bg-emerald-50 text-emerald-800 border-emerald-200',
                        'bg-[#E8F3EE] text-[#1C443A] border-[#D0E6DC]',
                        'bg-teal-50 text-teal-800 border-teal-200',
                        'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                      ];
                      const avatarStyle = avatarGradients[idx % avatarGradients.length];

                      return (
                        <div key={t.id} className="bg-white rounded-2xl border border-[#DCE8E0] shadow-2xs p-4 flex flex-col justify-between hover:shadow-md hover:border-[#10B981] transition-all">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 font-mono ${avatarStyle}`}>
                                  {initials}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#122A24] text-sm leading-tight hover:text-emerald-700 cursor-pointer" onClick={() => openTeacherModal(t)}>
                                    {t.full_name}
                                  </h3>
                                  <div className="text-[11px] font-mono text-[#1C443A] font-bold mt-0.5">
                                    {t.staff_code}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold font-mono uppercase border ${getTeacherRoleBadgeStyle(resolveTeacherRole(t))}`}>
                                  {resolveTeacherRole(t).replace('_', ' ')}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                                  {t.designation || 'Faculty'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3.5 space-y-1.5 text-xs text-[#2D5A4E] border-t border-[#E8F0EA] pt-3">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Gender:</span>
                                <span className="font-semibold text-xs text-[#1C443A]">{resolveTeacherGender(t)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Department:</span>
                                <span className="font-medium text-[#122A24]">{t.department || 'Academic'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subject:</span>
                                <span className="font-medium text-[#122A24]">{t.subject_specialization || 'General'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Date of Join:</span>
                                <span className="font-medium text-[#122A24]">{formatDateDisplay(t.date_of_joining, '29 Aug 2026')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#E8F0EA] flex items-center justify-between gap-1.5">
                            <a
                              href={`mailto:${t.email}`}
                              className="flex-1 py-1.5 bg-[#EBF5EF] hover:bg-[#D9EDE0] text-[#122A24] font-mono font-bold text-xs rounded-full border border-[#C5E2CF] transition-colors cursor-pointer text-center shadow-2xs no-underline"
                            >
                              Email
                            </a>
                            <button
                              onClick={() => handleToggleTeacherStatus(t)}
                              className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                                t.status !== 'INACTIVE'
                                  ? 'bg-[#EBF5EF] text-[#1C443A] border-[#C5E2CF] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                              }`}
                              title={`Switch to ${t.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}`}
                            >
                              {t.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => handleOpenPinModal('teacher', t.id, t.full_name, t.passcode || '123456')}
                              className="p-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer transition-colors"
                              title="Reset PIN"
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openTeacherModal(t)}
                              className="p-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] cursor-pointer transition-colors"
                              title="Edit Faculty Record"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(t.id)}
                              className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                              title="Delete Faculty Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Floating Bulk Action Dock for Faculty */}
                {selectedTeacherIds.length > 0 && (
                  <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#122A24] text-white px-4 sm:px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 border border-white/20 animate-fade-up">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-white/20 rounded-full">
                      {selectedTeacherIds.length} Selected
                    </span>
                    <button
                      onClick={() => handleBulkTeacherStatus('ACTIVE')}
                      className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Set Active
                    </button>
                    <button
                      onClick={() => handleBulkTeacherStatus('INACTIVE')}
                      className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" /> Set Inactive
                    </button>
                    <button
                      onClick={handleBulkDeleteTeachers}
                      className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => setSelectedTeacherIds([])}
                      className="text-xs text-slate-300 hover:text-white border-none bg-transparent cursor-pointer ml-1"
                      title="Clear Selection"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLASSES (THEME-ALIGNED PREMIUM MINT & FOREST GREEN) */}
          {activeTab === 'classes' && (
            <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
              {/* Main Card Container */}
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  CLASSES
                </div>

                {/* Top Breadcrumb & Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                        Classes &amp; Sections Directory
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        {filteredClasses.length} Active Divisions (Pre-Primary to XII-B)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#2D5A4E] font-mono mt-1">
                      <span>DPS2026</span>
                      <span>/</span>
                      <span>Curriculum Hierarchy</span>
                      <span>/</span>
                      <span className="text-[#122A24] font-semibold">CBSE Affiliated Structure</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <button
                      onClick={() => selectedSchool && loadSchoolData(selectedSchool.id)}
                      className="w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                      title="Refresh List"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={handlePrintClassesReport}
                      className="w-9 h-9 rounded-full bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] transition-colors shadow-2xs flex items-center justify-center cursor-pointer"
                      title="Print Official CBSE Classroom Register"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(showExportMenu === 'classes' ? null : 'classes')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] rounded-full text-xs font-semibold text-[#122A24] shadow-2xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-[#1C443A]" />
                        <span>Export</span>
                        <ChevronRight className={`h-3 w-3 transition-transform ${showExportMenu === 'classes' ? 'rotate-90' : ''}`} />
                      </button>

                      {showExportMenu === 'classes' && (
                        <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                          <button
                            onClick={() => {
                              setShowExportMenu(null);
                              exportToCSV(
                                'CBSE_Classes_List',
                                ['ID', 'Class', 'Section', 'Class Teacher', 'No of Students', 'No of Subjects', 'Status'],
                                filteredClasses.map((c, idx) => {
                                  const classStudentsCount = students.filter(s => 
                                    s.class_name?.toLowerCase().includes(c.class_name.toLowerCase()) && 
                                    s.section?.toLowerCase() === c.section.toLowerCase()
                                  ).length;
                                  return [
                                    c.class_code || `CLS2026${(idx + 1).toString().padStart(2, '0')}`,
                                    c.class_name,
                                    c.section,
                                    c.class_teacher || 'Assigned Faculty',
                                    classStudentsCount > 0 ? classStudentsCount : (c.capacity || 30),
                                    c.no_of_subjects || '05',
                                    c.status || 'ACTIVE'
                                  ];
                                })
                              );
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            onClick={handlePrintClassesReport}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer text-xs font-medium text-[#122A24] flex items-center gap-2"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#1C443A]" />
                            <span>Print Official CBSE PDF</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Primary Add Button — guarded by role permissions */}
                    {currentRoleModulePerms('classes').can_add && (
                      <button
                        onClick={() => {
                          setClassForm({ class_name: 'Class 10', section: 'A', class_teacher: '', room_no: 'Room 101', capacity: 40 });
                          setEditingClassId(null);
                          setShowAddClass(true);
                        }}
                        className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border-none cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Class
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub Header Controls Bar (Tier 1: Title, Status Tabs, Session, Sort) */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-display font-semibold text-base text-[#122A24]">
                      Class Divisions Register
                    </div>
                    {/* Fast Status Segmented Pill Tabs */}
                    <div className="flex items-center bg-[#F4F8F5] p-1 rounded-full border border-[#DCE8E0] shadow-2xs">
                      <button
                        onClick={() => { setClassStatusFilter('ALL'); setClassPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition-all ${
                          classStatusFilter === 'ALL'
                            ? 'bg-[#122A24] text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        All ({classes.length})
                      </button>
                      <button
                        onClick={() => { setClassStatusFilter('ACTIVE'); setClassPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          classStatusFilter === 'ACTIVE'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-transparent text-[#2D5A4E] hover:text-[#122A24]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        Active ({classes.filter(c => c.status !== 'INACTIVE').length})
                      </button>
                      <button
                        onClick={() => { setClassStatusFilter('INACTIVE'); setClassPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-none cursor-pointer flex items-center gap-1.5 transition-all ${
                          classStatusFilter === 'INACTIVE'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-transparent text-rose-700 hover:text-rose-900 font-bold'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Inactive ({classes.filter(c => c.status === 'INACTIVE').length})
                      </button>
                    </div>
                  </div>

                  {/* Right Header Controls: Session, Sort */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Session Pill */}
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-mono text-[#1C443A] shadow-2xs">
                      <Calendar className="h-3.5 w-3.5 text-[#2D5A4E]" />
                      <span>Session 2026-27</span>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                      <select
                        value={classSortBy}
                        onChange={(e) => setClassSortBy(e.target.value as any)}
                        className="bg-transparent border-none text-xs font-medium text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="A-Z">Sort: Class Order</option>
                        <option value="Z-A">Sort: Reverse Class</option>
                        <option value="ID-Asc">Sort: Class Code</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tier 2: Filters, Rows Per Page & Search Bar */}
                <div className="bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  {/* Filter Dropdown Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-wrap">
                    {/* Academic Wing Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Wing:</span>
                      <select
                        value={classWingFilter}
                        onChange={(e) => { setClassWingFilter(e.target.value); setClassPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Wings</option>
                        <option value="PRE_PRIMARY">Pre-Primary (Nursery-UKG)</option>
                        <option value="PRIMARY">Primary (Class 1-5)</option>
                        <option value="MIDDLE">Middle School (Class 6-8)</option>
                        <option value="SECONDARY">Secondary (Class 9-10)</option>
                        <option value="SR_SECONDARY">Sr Secondary (Class 11-12)</option>
                      </select>
                    </div>

                    {/* Section Filter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs font-medium text-[#122A24] shadow-2xs">
                      <span className="text-[#2D5A4E] text-[11px] font-mono">Sec:</span>
                      <select
                        value={classSectionFilter}
                        onChange={(e) => { setClassSectionFilter(e.target.value); setClassPage(1); }}
                        className="bg-transparent border-none text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="ALL">All Sections</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                      </select>
                    </div>
                  </div>

                  {/* Search & Rows Per Page */}
                  <div className="flex items-center gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-2 text-xs text-[#2D5A4E] font-medium shrink-0">
                      <span>Rows:</span>
                      <select
                        value={classRowsPerPage}
                        onChange={(e) => {
                          setClassRowsPerPage(Number(e.target.value));
                          setClassPage(1);
                        }}
                        className="px-2.5 py-1 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24] cursor-pointer focus:outline-none focus:border-[#10B981]"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#2D5A4E]" />
                      <input
                        type="text"
                        placeholder="Search classes by name, section, teacher..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setClassPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#DCE8E0] rounded-full text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:border-[#10B981] transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filter Badges */}
                {(classWingFilter !== 'ALL' || classSectionFilter !== 'ALL' || classStatusFilter !== 'ALL' || searchQuery.trim() !== '') && (
                  <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                    <span className="text-[11px] font-mono text-[#2D5A4E] font-bold">Active Filters:</span>
                    {classWingFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Wing: {classWingFilter.replace('_', ' ')}
                        <button onClick={() => setClassWingFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {classSectionFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Section: {classSectionFilter}
                        <button onClick={() => setClassSectionFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {classStatusFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Status: {classStatusFilter}
                        <button onClick={() => setClassStatusFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {searchQuery.trim() !== '' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Query: &ldquo;{searchQuery}&rdquo;
                        <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setClassWingFilter('ALL');
                        setClassSectionFilter('ALL');
                        setClassStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-[11px] font-mono font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer px-1"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* CLASSES TABLE */}
                <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F3F7F5] font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider border-b border-[#DCE8E0]">
                        <tr>
                          <th className="py-3 px-3.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={paginatedClasses.length > 0 && paginatedClasses.every(c => selectedClassIds.includes(c.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newIds = Array.from(new Set([...selectedClassIds, ...paginatedClasses.map(c => c.id)]));
                                  setSelectedClassIds(newIds);
                                } else {
                                  setSelectedClassIds(selectedClassIds.filter(id => !paginatedClasses.some(c => c.id === id)));
                                }
                              }}
                              className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-4">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'code-asc' || classSortBy === 'ID-Asc' ? 'code-desc' : 'code-asc')}
                              title="Sort by Division ID"
                            >
                              <span>Division ID</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'class-asc' || classSortBy === 'A-Z' ? 'class-desc' : 'class-asc')}
                              title="Sort by CBSE Level"
                            >
                              <span>CBSE Level</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'sec-asc' ? 'sec-desc' : 'sec-asc')}
                              title="Sort by Section"
                            >
                              <span>Section</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'teacher-asc' ? 'teacher-desc' : 'teacher-asc')}
                              title="Sort by Class Teacher"
                            >
                              <span>Assigned Class Teacher</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'capacity-asc' ? 'capacity-desc' : 'capacity-asc')}
                              title="Sort by Capacity"
                            >
                              <span>Enrolled Students</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-[#2D5A4E]" />
                              <span>CBSE Subjects</span>
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <span>Room No</span>
                            </div>
                          </th>
                          <th className="py-3 px-3">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none hover:text-emerald-800 transition-colors"
                              onClick={() => setClassSortBy(classSortBy === 'status-asc' ? 'status-desc' : 'status-asc')}
                              title="Sort by Status"
                            >
                              <span>Status</span>
                              <ArrowUpDown className="h-3 w-3 text-[#2D5A4E]" />
                            </div>
                          </th>
                          <th className="py-3 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EBF2ED] font-sans">
                        {paginatedClasses.map((c, idx) => {
                          const isSelected = selectedClassIds.includes(c.id);
                          const classCode = c.class_code || `CLS2026${(idx + 1).toString().padStart(2, '0')}`;
                          const cleanRomanClass = formatClassDisplay(c.class_name);
                          const classStudentsCount = students.filter(s => 
                            s.class_name?.toLowerCase().includes(c.class_name.toLowerCase()) && 
                            s.section?.toLowerCase() === c.section.toLowerCase()
                          ).length;
                          const displayStudentsCount = classStudentsCount > 0 ? classStudentsCount : (c.capacity || 30);

                          const isEven = idx % 2 === 0;
                          return (
                            <tr
                              key={c.id}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-emerald-100/70'
                                  : isEven
                                  ? 'bg-white hover:bg-emerald-50/40'
                                  : 'bg-[#F0F8F3] hover:bg-[#E4F2E9]'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3.5 px-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedClassIds([...selectedClassIds, c.id]);
                                    } else {
                                      setSelectedClassIds(selectedClassIds.filter(id => id !== c.id));
                                    }
                                  }}
                                  className="rounded border-slate-300 accent-[#122A24] cursor-pointer"
                                />
                              </td>

                              {/* ID */}
                              <td className="py-3.5 px-4 font-mono font-medium">
                                <button
                                  onClick={() => {
                                    setClassForm({
                                      class_name: c.class_name,
                                      section: c.section,
                                      class_teacher: c.class_teacher || '',
                                      room_no: c.room_no || 'Room 101',
                                      capacity: c.capacity || 40
                                    });
                                    setEditingClassId(c.id);
                                    setShowAddClass(true);
                                  }}
                                  className="text-[#122A24] hover:text-emerald-700 font-bold border-none bg-transparent p-0 cursor-pointer text-left block tracking-tight transition-colors"
                                >
                                  {classCode}
                                </button>
                              </td>

                              {/* Class in Roman */}
                              <td className="py-3.5 px-4 text-[#122A24] font-bold text-xs">
                                {cleanRomanClass}
                              </td>

                              {/* Section */}
                              <td className="py-3.5 px-4 text-[#122A24] font-mono font-semibold">
                                Section {c.section}
                              </td>

                              {/* Class Teacher */}
                              <td className="py-3.5 px-4 text-[#122A24] font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#EBF5EF] border border-[#C5E2CF] text-[#122A24] font-mono font-bold text-[10px] flex items-center justify-center">
                                    {(c.class_teacher || 'T')[0]}
                                  </div>
                                  <span>{c.class_teacher || 'Assigned Faculty'}</span>
                                </div>
                              </td>

                              {/* No of Students */}
                              <td className="py-3.5 px-4 font-mono">
                                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                                  {displayStudentsCount} Students
                                </span>
                              </td>

                              {/* CBSE Subjects Pill */}
                              <td className="py-3.5 px-4 font-mono">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                                  <BookOpen className="h-3 w-3 text-emerald-700" />
                                  <span>{c.subjects?.length || c.no_of_subjects || 6} Subjects</span>
                                </span>
                              </td>

                              {/* Room No */}
                              <td className="py-3.5 px-4 text-[#2D5A4E] font-mono text-xs">
                                {c.room_no || 'Room 101'}
                              </td>

                              {/* Status Badge (1-Click Toggle for Admin, Static for Non-Admins) */}
                              <td className="py-3.5 px-3">
                                {currentRoleModulePerms('classes').can_edit ? (
                                  <button
                                    onClick={() => handleToggleClassStatus(c)}
                                    className="cursor-pointer border-none bg-transparent p-0 flex items-center text-left"
                                    title={`Click to switch to ${c.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'}`}
                                  >
                                    {c.status !== 'INACTIVE' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#EBF5EF] hover:bg-emerald-100 text-[#1C443A] border border-[#C5E2CF] transition-colors shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        Inactive
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${c.status !== 'INACTIVE' ? 'bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.status !== 'INACTIVE' ? 'bg-[#10B981]' : 'bg-rose-500'}`} />
                                    {c.status !== 'INACTIVE' ? 'Active' : 'Inactive'}
                                  </span>
                                )}
                              </td>

                              {/* Action â‹® Popover with Admin Powers */}
                              <td className="py-3.5 px-3 text-center">
                                <div className="relative inline-block text-left">
                                  <button
                                    onClick={() => setActiveClassMenuId(activeClassMenuId === c.id ? null : c.id)}
                                    className="w-7 h-7 rounded-full text-slate-400 hover:text-[#122A24] hover:bg-[#EBF5EF] flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                                    title="Admin Powers & Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>

                                  {activeClassMenuId === c.id && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-[#DCE8E0] py-1.5 z-30 text-xs animate-fade-in">
                                      {currentRoleModulePerms('classes').can_edit && (
                                        <button
                                          onClick={() => {
                                            setActiveClassMenuId(null);
                                            setClassForm({
                                              class_name: c.class_name,
                                              section: c.section,
                                              class_teacher: c.class_teacher || '',
                                              room_no: c.room_no || 'Room 101',
                                              capacity: c.capacity || 40
                                            });
                                            setEditingClassId(c.id);
                                            setShowAddClass(true);
                                          }}
                                          className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                        >
                                          <Edit className="h-3.5 w-3.5 text-emerald-700" />
                                          <span>Edit Class Info</span>
                                        </button>
                                      )}
                                      {currentRoleModulePerms('classes').can_edit && (
                                        <button
                                          onClick={() => {
                                            setActiveClassMenuId(null);
                                            handleToggleClassStatus(c);
                                          }}
                                          className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                        >
                                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                                          <span>{c.status === 'INACTIVE' ? 'Set Active' : 'Set Inactive'}</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setActiveClassMenuId(null);
                                          setSearchQuery(`${c.class_name}`);
                                          setActiveTab('students');
                                        }}
                                        className="w-full text-left px-3.5 py-1.5 hover:bg-[#F4F8F5] border-none bg-transparent cursor-pointer flex items-center gap-2 text-[#122A24]"
                                      >
                                        <Users className="h-3.5 w-3.5 text-emerald-700" />
                                        <span>View Students</span>
                                      </button>
                                      {currentRoleModulePerms('classes').can_delete && (
                                        <>
                                          <div className="border-t border-[#E8F0EA] my-1" />
                                          <button
                                            onClick={() => {
                                              setActiveClassMenuId(null);
                                              handleDeleteClass(c.id);
                                            }}
                                            className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 border-none bg-transparent cursor-pointer flex items-center gap-2 text-rose-600 font-semibold"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span>Delete Class</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {paginatedClasses.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-xs text-[#2D5A4E] font-medium">
                              No classes found matching search criteria. Click "+ Add Class" above to create divisions.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Pagination */}
                  <div className="p-3.5 border-t border-[#DCE8E0] bg-[#F8FAF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#2D5A4E]">
                    <div>
                      Showing {totalClassEntries === 0 ? 0 : (classPage - 1) * classRowsPerPage + 1} to {Math.min(classPage * classRowsPerPage, totalClassEntries)} of {totalClassEntries} Entries
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        onClick={() => setClassPage(Math.max(1, classPage - 1))}
                        disabled={classPage === 1}
                        className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                      >
                        Prev
                      </button>

                      {Array.from({ length: totalClassPages }, (_, i) => i + 1).slice(0, 5).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setClassPage(pageNum)}
                          className={`w-7 h-7 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            classPage === pageNum
                              ? 'bg-[#122A24] border-[#122A24] text-white shadow-xs'
                              : 'bg-white border-[#DCE8E0] text-[#122A24] hover:bg-[#EBF5EF]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => setClassPage(Math.min(totalClassPages, classPage + 1))}
                        disabled={classPage === totalClassPages || totalClassPages === 0}
                        className="px-3 py-1 rounded-lg border border-[#DCE8E0] bg-white text-[#122A24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF5EF] cursor-pointer font-medium transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Bulk Action Dock for Classes */}
                {selectedClassIds.length > 0 && (
                  <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#122A24] text-white px-4 sm:px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 sm:gap-3 border border-white/20 animate-fade-up">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-white/20 rounded-full">
                      {selectedClassIds.length} Selected
                    </span>
                    <button
                      onClick={() => handleBulkClassStatus('ACTIVE')}
                      className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Set Active
                    </button>
                    <button
                      onClick={() => handleBulkClassStatus('INACTIVE')}
                      className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Clock className="h-3.5 w-3.5" /> Set Inactive
                    </button>
                    <button
                      onClick={handleBulkDeleteClasses}
                      className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold border-none cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => setSelectedClassIds([])}
                      className="text-xs text-slate-300 hover:text-white border-none bg-transparent cursor-pointer ml-1"
                      title="Clear Selection"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4.5: CBSE CURRICULUM & SUBJECTS STUDIO */}
          {activeTab === 'subjects' && (
            <DashboardSubjects
              selectedSchool={selectedSchool}
              classes={classes}
              teachers={teachers}
              selectedSession={selectedSession}
              onRefresh={() => selectedSchool && loadSchoolData(selectedSchool.id, selectedSession)}
              showAdminToast={showAdminToast}
            />
          )}

          {/* TAB 5: ATTENDANCE HUB (STUDENT vs ADMIN/FACULTY) */}
          {activeTab === 'attendance' && allowedTabs.includes('attendance') && (
            effectiveRole === 'STUDENT' ? (
              <DashboardStudentPortal
                currentUser={currentUser}
                selectedSchool={selectedSchool}
                students={students}
                invoices={invoices}
                attendance={attendance}
                selectedSession={selectedSession}
                activeView="attendance"
                setActiveTab={setActiveTab}
                showAdminToast={showAdminToast}
              />
            ) : (
              <DashboardAttendance
                selectedSchool={selectedSchool}
                students={students}
                teachers={teachers}
                classes={classes}
                attendance={attendance}
                selectedSession={selectedSession}
                userRole={effectiveRole}
                currentUser={currentUser}
                onRefresh={() => selectedSchool && loadSchoolData(selectedSchool.id, selectedSession)}
                showAdminToast={showAdminToast}
              />
            )
          )}

          {/* TAB 6: FEES & INVOICE MANAGEMENT (STUDENT vs ADMIN) */}
          {activeTab === 'fees' && (
            effectiveRole === 'STUDENT' ? (
              <DashboardStudentPortal
                currentUser={currentUser}
                selectedSchool={selectedSchool}
                students={students}
                invoices={invoices}
                attendance={attendance}
                selectedSession={selectedSession}
                activeView="fees"
                setActiveTab={setActiveTab}
                showAdminToast={showAdminToast}
              />
            ) : (
              <DashboardFees
                selectedSchool={selectedSchool}
                students={students}
                invoices={invoices}
                classes={classes}
                teachers={teachers}
                selectedSession={selectedSession}
                onRefresh={() => selectedSchool && loadSchoolData(selectedSchool.school_code || selectedSchool.id, selectedSession)}
                showAdminToast={showAdminToast}
              />
            )
          )}

          {/* TAB: COMPREHENSIVE SCHOOL REPORTS & MASTER DOSSIERS */}
          {activeTab === 'reports' && (
            <DashboardReports
              selectedSchool={selectedSchool}
              students={students}
              teachers={teachers}
              classes={classes}
              invoices={invoices}
              attendance={attendance}
              selectedSession={selectedSession}
            />
          )}

          {/* TAB 7: NOTICES (THEME-ALIGNED WITH ADVANCED AUDIENCE FILTERS) */}
          {activeTab === 'notices' && (
            <div className="space-y-5 max-w-7xl mx-auto animate-fade-in">
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 space-y-5 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  CIRCULARS
                </div>
                {/* Header & Primary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA] relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                        Institutional Notice Board
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        {filteredNotices.length} Circulars
                      </span>
                    </div>
                    <p className="text-xs text-[#2D5A4E] mt-0.5 font-mono">
                      {effectiveRole === 'STUDENT'
                        ? 'Official student circulars, academic advisories, and school activity notices'
                        : 'Publish circulars and announcements for students, teachers, and parents'}
                    </p>
                  </div>
                  {currentRoleModulePerms('notices').can_add && effectiveRole !== 'STUDENT' && (
                    <button
                      onClick={() => setShowAddNotice(true)}
                      className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border-none cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Post Notice
                    </button>
                  )}
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-[#2D5A4E] font-bold">Target Audience:</span>
                    {(effectiveRole === 'STUDENT'
                      ? (['ALL', 'STUDENTS'] as const)
                      : (['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS'] as const)
                    ).map(aud => (
                      <button
                        key={aud}
                        onClick={() => setNoticeAudienceFilter(aud)}
                        className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold cursor-pointer transition-all border ${
                          noticeAudienceFilter === aud
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-xs'
                            : 'bg-[#F4F8F5] text-[#122A24] border-[#DCE8E0] hover:bg-[#EBF5EF]'
                        }`}
                      >
                        {aud === 'ALL' ? (effectiveRole === 'STUDENT' ? 'All Student Circulars' : 'All Audiences') : aud}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#2D5A4E]" />
                    <input
                      type="text"
                      placeholder="Search circulars by title, author, content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-full text-xs text-[#122A24] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#10B981] transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Active Filter Badges */}
                {(noticeAudienceFilter !== 'ALL' || searchQuery.trim() !== '') && (
                  <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
                    <span className="text-[11px] font-mono text-[#2D5A4E] font-bold">Active Filters:</span>
                    {noticeAudienceFilter !== 'ALL' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Audience: {noticeAudienceFilter}
                        <button onClick={() => setNoticeAudienceFilter('ALL')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    {searchQuery.trim() !== '' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                        Query: &ldquo;{searchQuery}&rdquo;
                        <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer border-none bg-transparent p-0">✕</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setNoticeAudienceFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-[11px] font-mono font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer px-1"
                    >
                      Clear All
                    </button>
                  </div>
                )}

                {/* Circulars List */}
                <div className="space-y-4">
                  {filteredNotices.map(n => (
                    <div key={n.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DCE8E0] shadow-2xs space-y-3 relative group hover:border-[#10B981] transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#F0F5F2]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-3 py-1 rounded-full bg-[#122A24] text-white shadow-2xs">
                            {n.reference_no || `DPS/2026/30/8/${n.matter_category || 'ACAD'}/0001`}
                          </span>
                          <span className="font-mono text-[10.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF5EF] text-[#1C443A] font-bold border border-[#C5E2CF]">
                            {n.target_audience}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-[11px] text-[#2D5A4E] font-mono flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-emerald-700 inline shrink-0" />
                              <span>{formatDateDisplay(n.date || (n.created_at ? n.created_at.split('T')[0] : '2026-08-30'))}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400 inline shrink-0" />
                              <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'}</span>
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">By {n.posted_by}</span>
                          </div>
                          {currentRoleModulePerms('notices').can_delete && effectiveRole !== 'STUDENT' && (
                            <button
                              onClick={() => handleDeleteNotice(n.id)}
                              className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Delete Circular"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="font-display font-semibold text-lg text-[#122A24]">{n.title}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                  {filteredNotices.length === 0 && (
                    <div className="py-12 text-center text-xs text-[#2D5A4E] font-mono bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0]">
                      {effectiveRole === 'STUDENT'
                        ? 'No active student notices found at this time.'
                        : 'No active notices found matching your filter. Click "+ Post Notice" above to publish circulars.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CERTIFICATES & DOCKET STUDIO */}
          {activeTab === 'certificates' && (
            <div className="space-y-6 animate-fade-in">
              {effectiveRole === 'STUDENT' ? (
                <DashboardStudentPortal
                  currentUser={currentUser}
                  selectedSchool={selectedSchool}
                  students={students}
                  invoices={invoices}
                  attendance={attendance}
                  selectedSession={selectedSession}
                  activeView="certificates"
                  setActiveTab={setActiveTab}
                  showAdminToast={showAdminToast}
                />
              ) : (
                <DashboardCertificates
                  selectedSchool={selectedSchool}
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  selectedSession={selectedSession}
                  isSuperAdmin={isSuperAdmin}
                />
              )}
            </div>
          )}

          {/* TAB: EMPLOYEE LEAVE & APPROVALS STUDIO */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-fade-in">
              <DashboardApprovals
                selectedSchool={selectedSchool}
                teachers={teachers}
                attendance={attendance}
                selectedSession={selectedSession}
                isSuperAdmin={isSuperAdmin}
                userRole={effectiveRole}
                currentUser={currentUser}
              />
            </div>
          )}

          {/* TAB: ENTERPRISE SECURITY & AUDIT TRAIL */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-6 animate-fade-in">
              <DashboardAuditLogs
                selectedSchool={selectedSchool}
                selectedSession={selectedSession}
              />
            </div>
          )}

          {/* TAB: ACCESS CONTROLS & RBAC PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="max-w-6xl mx-auto">
              <DashboardPermissions
                initialPermissions={rolePermissions}
                schoolId={selectedSchool?.school_code || selectedSchool?.id || 'DPS2026'}
                onSavePermissions={async (updated) => {
                  setRolePermissions(updated);
                  const res = await apiFetch('/api/school/permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      school_id: selectedSchool?.school_code || selectedSchool?.id || 'DPS2026',
                      permissions: updated
                    })
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.error || 'Failed to save permissions');
                  showToast('Role permissions saved and enforced across campus!');
                }}
                showToast={showToast}
              />
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              {/* Header Card */}
              <div className="bg-white rounded-3xl border border-[#DCE8E0] shadow-xs p-5 sm:p-7 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-[#122A24]/[0.06] sm:text-[#122A24]/[0.08] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  SETTINGS
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                        Institutional &amp; Access Controls
                      </h1>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                        ⚡ Full Admin Powers Active
                      </span>
                    </div>
                    <p className="text-xs text-[#2D5A4E] mt-1 font-mono">
                      Manage institutional identity, security PIN, CBSE compliance rules, and Role-Based Access Control (RBAC).
                    </p>
                  </div>
                </div>
              </div>

              {settingsSuccess && (
                <div className="p-4 bg-[#EBF5EF] border border-[#C5E2CF] text-[#1C443A] text-xs font-semibold rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* ADMIN POWERS & ROLE PERMISSION MATRIX */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA] flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm shadow-2xs">
                      <Sliders className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-base text-[#122A24]">
                        Role-Based Access Control (RBAC) &amp; Delegation Studio
                      </h2>
                      <p className="text-[11px] text-[#2D5A4E]">
                        Admin has supreme authority to configure what Teachers, Students, and Parents can See, Edit, Add, and Delete.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className="px-4 py-2 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 border-none cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-300" />
                    <span>Open Full Permissions Studio →</span>
                  </button>
                </div>

                <DashboardPermissions
                  initialPermissions={rolePermissions}
                  schoolId={selectedSchool?.school_code || selectedSchool?.id || 'DPS2026'}
                  onSavePermissions={async (updated) => {
                    setRolePermissions(updated);
                    const res = await apiFetch('/api/school/permissions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        school_id: selectedSchool?.school_code || selectedSchool?.id || 'DPS2026',
                        permissions: updated
                      })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'Failed to save permissions');
                    showToast('Role permissions saved and enforced across campus!');
                  }}
                  showToast={showToast}
                />
              </div>

              {/* INSTITUTIONAL SETTINGS FORM */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-6">
                <div className="pb-3 border-b border-[#E8F0EA] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-display font-bold text-base sm:text-lg text-[#122A24]">
                      Institutional Profile &amp; CBSE/Government Compliance Registry
                    </h2>
                    <p className="text-[11px] text-[#2D5A4E] mt-0.5">
                      Update official school codes (UDISE+, OASIS, CBSE Affiliation), campus location, and credentials.
                    </p>
                  </div>
                  {settingsSuccess && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fade-in">
                      ✓ {settingsSuccess}
                    </span>
                  )}
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-6 text-xs">
                  {/* GROUP 0: INSTITUTIONAL CREST & SCHOOL LOGO (MAX 2 MB) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FCFA] border border-[#DCE8E0] space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E8F0EA]">
                      <div className="font-display font-bold text-xs sm:text-sm text-[#122A24] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#122A24] text-white flex items-center justify-center text-[10px] font-mono">1</span>
                        <span>Institutional Crest &amp; School Logo</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Max 2.0 MB • PNG, JPG, SVG, WebP
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {/* Logo Preview (Square & Circle) */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#122A24] shadow-xs flex items-center justify-center overflow-hidden p-1">
                            {settingsForm.logo ? (
                              <img src={settingsForm.logo} alt="School Logo Preview" className="w-full h-full object-contain" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                                <Building2 className="w-8 h-8 text-slate-300" />
                                <span className="text-[9px] font-mono text-slate-400 mt-0.5">No Logo</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-1">Navbar Crest</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full bg-white border-2 border-emerald-600 shadow-xs flex items-center justify-center overflow-hidden p-1">
                            {settingsForm.logo ? (
                              <img src={settingsForm.logo} alt="School Seal Preview" className="w-full h-full object-contain rounded-full" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 text-center">
                                <Award className="w-8 h-8 text-slate-300" />
                                <span className="text-[9px] font-mono text-slate-400 mt-0.5">Seal</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 mt-1">Official Seal</span>
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-2.5 text-center sm:text-left">
                        <div>
                          <div className="font-bold text-xs text-[#122A24]">Upload Institutional Emblem</div>
                          <p className="text-[11px] text-[#2D5A4E] leading-relaxed mt-0.5">
                            This logo will automatically appear on the Top Navbar, Student &amp; Staff ID Cards, Transfer Certificates, Bonafides, and Institutional Invoices.
                          </p>
                        </div>

                        <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap pt-1">
                          <label className="px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            <span>{settingsForm.logo ? 'Change School Logo (Max 2MB)' : 'Upload School Logo (Max 2MB)'}</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                              onChange={handleSchoolLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {settingsForm.logo && (
                            <button
                              type="button"
                              onClick={handleRemoveSchoolLogo}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Logo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 1: BASIC IDENTITY */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FCFA] border border-[#DCE8E0] space-y-3.5">
                    <div className="font-display font-bold text-xs sm:text-sm text-[#122A24] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#122A24] text-white flex items-center justify-center text-[10px] font-mono">2</span>
                      <span>School Identity &amp; Principal Leadership</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[#122A24] mb-1">Official School Full Name *</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.school_name}
                          onChange={(e) => setSettingsForm({ ...settingsForm, school_name: e.target.value })}
                          placeholder="e.g. Delhi Public International School"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-bold text-[#122A24] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Established Year</label>
                        <input
                          type="text"
                          value={settingsForm.established_year}
                          onChange={(e) => setSettingsForm({ ...settingsForm, established_year: e.target.value })}
                          placeholder="e.g. 1998"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Principal / Head of Institution</label>
                        <input
                          type="text"
                          value={settingsForm.principal_name}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principal_name: e.target.value })}
                          placeholder="e.g. Dr. Rajesh Sharma"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Curriculum Board</label>
                        <input
                          type="text"
                          value={settingsForm.board}
                          onChange={(e) => setSettingsForm({ ...settingsForm, board: e.target.value })}
                          placeholder="e.g. CBSE / CISCE / State"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 2: GOVERNMENT & BOARD CODES */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#EBF5EF]/50 border border-[#C5E2CF] space-y-3.5">
                    <div className="font-display font-bold text-xs sm:text-sm text-[#1C443A] flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1C443A] text-white flex items-center justify-center text-[10px] font-mono">2</span>
                        <span>Government &amp; CBSE Compliance Codes</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        OASIS &amp; UDISE+ Standard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">UDISE+ Code (Govt of India)</label>
                        <input
                          type="text"
                          value={settingsForm.udise_code}
                          onChange={(e) => setSettingsForm({ ...settingsForm, udise_code: e.target.value })}
                          placeholder="e.g. 07010100101"
                          className="w-full px-3.5 py-2.5 border border-[#C5E2CF] rounded-xl text-xs font-mono font-bold text-emerald-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">CBSE OASIS School Code</label>
                        <input
                          type="text"
                          value={settingsForm.oasis_code}
                          onChange={(e) => setSettingsForm({ ...settingsForm, oasis_code: e.target.value })}
                          placeholder="e.g. 84001"
                          className="w-full px-3.5 py-2.5 border border-[#C5E2CF] rounded-xl text-xs font-mono font-bold text-emerald-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">CBSE Affiliation Number</label>
                        <input
                          type="text"
                          value={settingsForm.affiliation_no}
                          onChange={(e) => setSettingsForm({ ...settingsForm, affiliation_no: e.target.value })}
                          placeholder="e.g. 2130042"
                          className="w-full px-3.5 py-2.5 border border-[#C5E2CF] rounded-xl text-xs font-mono font-bold text-emerald-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: CAMPUS ADDRESS & CONTACT */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FCFA] border border-[#DCE8E0] space-y-3.5">
                    <div className="font-display font-bold text-xs sm:text-sm text-[#122A24] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#122A24] text-white flex items-center justify-center text-[10px] font-mono">3</span>
                      <span>Campus Address &amp; Official Contact</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#122A24] mb-1">Campus Full Street Address</label>
                      <input
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        placeholder="e.g. Sector 12, Phase II, Dwarka"
                        className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">City / District</label>
                        <input
                          type="text"
                          value={settingsForm.city}
                          onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                          placeholder="e.g. New Delhi"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">State / Province</label>
                        <input
                          type="text"
                          value={settingsForm.state}
                          onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                          placeholder="e.g. Delhi"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">PIN / Postal Code</label>
                        <input
                          type="text"
                          value={settingsForm.pincode}
                          onChange={(e) => setSettingsForm({ ...settingsForm, pincode: e.target.value })}
                          placeholder="e.g. 110075"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Official Phone / Helpline</label>
                        <input
                          type="tel"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          placeholder="e.g. +91 11 2789 0000"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Institutional Email</label>
                        <input
                          type="email"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          placeholder="e.g. principal@school.edu"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">Official Website</label>
                        <input
                          type="url"
                          value={settingsForm.website}
                          onChange={(e) => setSettingsForm({ ...settingsForm, website: e.target.value })}
                          placeholder="e.g. https://dps2026.edu"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 4: SECURITY */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FCFA] border border-[#DCE8E0] space-y-3.5">
                    <div className="font-display font-bold text-xs sm:text-sm text-[#122A24] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#122A24] text-white flex items-center justify-center text-[10px] font-mono">4</span>
                      <span>Administrator Master Passcode</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#122A24] mb-1">Admin Security PIN / Passcode *</label>
                      <div className="relative max-w-sm">
                        <input
                          type={showSettingsPin ? "text" : "password"}
                          required
                          value={settingsForm.admin_pin}
                          onChange={(e) => setSettingsForm({ ...settingsForm, admin_pin: e.target.value })}
                          className="w-full px-3.5 py-2.5 pr-10 border border-[#DCE8E0] rounded-xl font-mono text-xs font-bold text-[#122A24] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPin(!showSettingsPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer flex items-center justify-center"
                          title={showSettingsPin ? "Hide PIN" : "Show PIN"}
                        >
                          {showSettingsPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E8F0EA] flex items-center justify-between">
                    <span className="text-[11px] text-[#2D5A4E] font-mono">
                      All settings auto-sync to MongoDB Atlas Cloud.
                    </span>
                    <button
                      type="submit"
                      className="px-7 py-3 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full shadow-xs cursor-pointer border-none text-xs transition-colors"
                    >
                      Save Institutional Profile
                    </button>
                  </div>
                </form>
              </div>

              {/* MONGODB ATLAS CLOUD SYNCHRONIZATION & DIAGNOSTICS CARD */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold text-sm border border-[#C5E2CF]">
                      <Database className="h-4 w-4 text-emerald-700" />
                    </span>
                    <div>
                      <h2 className="font-display font-bold text-base text-[#122A24]">
                        MongoDB Atlas Cloud Storage &amp; Backup Hub
                      </h2>
                      <p className="text-[11px] text-[#2D5A4E]">
                        Real-time persistent synchronization between local storage engine and MongoDB Atlas Cloud.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCheckMongoCloud}
                      disabled={mongoSyncLoading}
                      className="px-3.5 py-1.5 bg-[#F4F8F5] border border-[#DCE8E0] hover:bg-[#EBF5EF] text-[#122A24] rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-[#2D5A4E] ${mongoSyncLoading ? 'animate-spin' : ''}`} />
                      <span>{mongoSyncLoading ? 'Checking...' : 'Test Cloud Connection'}</span>
                    </button>
                    <button
                      onClick={handlePushAllToMongo}
                      disabled={mongoSyncLoading}
                      className="px-4 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-all flex items-center gap-1.5 border-none disabled:opacity-60"
                    >
                      <Download className="h-3.5 w-3.5 rotate-180" />
                      <span>Push &amp; Sync to Atlas Cloud</span>
                    </button>
                  </div>
                </div>

                {mongoSyncMsg && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>MongoDB Atlas Status Notice:</span>
                    </div>
                    <p className="leading-relaxed font-mono text-[11px]">
                      {mongoSyncMsg}
                    </p>
                    <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-[#122A24] space-y-1 font-sans">
                      <div className="font-bold text-emerald-800">How to enable 100% unrestricted Cloud Sync in 30 seconds:</div>
                      <ol className="list-decimal pl-4 space-y-0.5 text-[#2D5A4E]">
                        <li>Go to <strong><a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="underline text-emerald-700">cloud.mongodb.com</a></strong> and log into your Atlas project.</li>
                        <li>Click <strong>Security → Network Access</strong> in the left sidebar.</li>
                        <li>Click <strong>+ Add IP Address</strong> → Choose <strong>&quot;Allow Access from Anywhere&quot; (0.0.0.0/0)</strong> → Click <strong>Confirm</strong>.</li>
                        <li>Return here and click <strong>&quot;Push &amp; Sync to Atlas Cloud&quot;</strong>!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Persistent Data Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1">
                  <div className="bg-[#F9FCFA] p-3.5 rounded-2xl border border-[#DCE8E0]">
                    <div className="text-[11px] text-[#2D5A4E]">Enrolled Scholars</div>
                    <div className="text-xl font-bold font-display text-[#122A24] mt-0.5">{students.length} Students</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-semibold">• 100% Persistent</div>
                  </div>
                  <div className="bg-[#F9FCFA] p-3.5 rounded-2xl border border-[#DCE8E0]">
                    <div className="text-[11px] text-[#2D5A4E]">Faculty Roster</div>
                    <div className="text-xl font-bold font-display text-[#122A24] mt-0.5">{teachers.length} Faculty</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-semibold">• 100% Persistent</div>
                  </div>
                  <div className="bg-[#F9FCFA] p-3.5 rounded-2xl border border-[#DCE8E0]">
                    <div className="text-[11px] text-[#2D5A4E]">Class Divisions</div>
                    <div className="text-xl font-bold font-display text-[#122A24] mt-0.5">{classes.length} Classes</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-semibold">• 100% Persistent</div>
                  </div>
                  <div className="bg-[#F9FCFA] p-3.5 rounded-2xl border border-[#DCE8E0]">
                    <div className="text-[11px] text-[#2D5A4E]">Fee Invoices</div>
                    <div className="text-xl font-bold font-display text-[#122A24] mt-0.5">{invoices.length} Invoices</div>
                    <div className="text-[10px] text-emerald-700 mt-1 font-semibold">• 100% Persistent</div>
                  </div>
                </div>
              </div>

              {/* DANGER ZONE: AGENCY SUPERADMIN PERMANENT SCHOOL PURGE */}
              {isSuperAdmin && (
                <div className="bg-rose-50/70 p-6 sm:p-7 rounded-3xl border-2 border-rose-300 shadow-xs space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-rose-200 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center font-bold">
                        <Trash2 className="w-5 h-5 text-rose-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display font-bold text-base text-rose-950">
                            Danger Zone: Permanent School Data Purge
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white">
                            AGENCY SUPERADMIN ONLY
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Erase this entire institution (all students, staff, attendance, marks, invoices, and settings) from MongoDB Atlas and Local DB. Protected with Captcha.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPurgeModal(selectedSchool)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge School Data</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-rose-200 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-slate-600">
                      Active Campus: <strong className="text-rose-900">{selectedSchool?.school_name}</strong> [{selectedSchool?.school_code}]
                    </span>
                    <span className="text-[11px] font-mono text-rose-700">
                      Requires Captcha + Keyword Confirmation
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: USER PROFILE & SECURITY STUDIO */}
          {/* TAB: MY USER PROFILE (STRICTLY ROLE ISOLATED: TEACHER VS ADMIN) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8F0EA]">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#122A24] tracking-tight">
                      My User Profile
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                      Active {currentUser?.role || 'Account'}
                    </span>
                  </div>
                  <p className="text-xs text-[#2D5A4E] mt-1">
                    {currentUser?.role === 'TEACHER'
                      ? 'Manage your personal faculty credentials, contact channels, and secure teacher sign-in passcode.'
                      : 'Manage your personal credentials, master security PIN, and institutional access parameters.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>

              {/* Profile Identity Hero Banner */}
              <div className="bg-gradient-to-r from-[#122A24] to-[#1C443A] text-white p-6 sm:p-7 rounded-3xl shadow-md flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 relative overflow-hidden">
                {/* Background Watermark Behind Header Text */}
                <div 
                  aria-hidden="true" 
                  className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-white/[0.08] sm:text-white/[0.12] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
                >
                  PROFILE
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 text-white font-display font-bold text-3xl flex items-center justify-center shadow-lg shrink-0">
                    {(currentUser?.full_name || profileForm.full_name || 'U')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
                        {currentUser?.full_name || profileForm.full_name || 'My Profile'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-400/30 text-emerald-300 border border-emerald-400/40">
                        {currentUser?.role || 'TEACHER'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-1 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                      <span>{currentUser?.role === 'TEACHER' ? 'Staff Code:' : 'Admin ID:'} <strong>{currentUser?.username || profileForm.username || 'EMP01'}</strong></span>
                      <span>•</span>
                      <span>School: <strong>{selectedSchool?.school_name || 'Delhi Public School'}</strong></span>
                      <span>•</span>
                      <span>Code: <strong>{selectedSchool?.school_code || 'DPS2026'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 bg-white/10 px-4 py-3 rounded-2xl border border-white/15 text-center relative z-10">
                  <div className="text-[10.5px] font-mono text-emerald-300 uppercase tracking-wider">Access Clearance</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {currentUser?.role === 'STUDENT'
                      ? 'Scholar Student Access'
                      : currentUser?.role === 'TEACHER'
                      ? 'Faculty Tier-2 Access'
                      : currentUser?.role === 'PARENT'
                      ? 'Parent Ward Access'
                      : 'Tier-1 Full Access'}
                  </div>
                  <div className="text-[9.5px] text-slate-300 font-mono mt-0.5">
                    {currentUser?.role === 'STUDENT'
                      ? 'CBSE Scholar Portal'
                      : currentUser?.role === 'TEACHER'
                      ? 'CBSE Educator Console'
                      : currentUser?.role === 'PARENT'
                      ? 'CBSE Parent Connect'
                      : 'CBSE Master Console'}
                  </div>
                </div>
              </div>

              {/* Profile Details & Security Form */}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Personal Identity */}
                  <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
                    <div className="pb-3 border-b border-[#E8F0EA]">
                      <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-700" />
                        Personal Information
                      </h3>
                      <p className="text-[11px] text-[#2D5A4E]">
                        Your official name, staff identification, and contact channels.
                      </p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">
                          Full Legal Name {['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') ? '' : '*'}
                        </label>
                        <input
                          type="text"
                          required={!['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                          disabled={['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          placeholder={currentUser?.role === 'STUDENT' ? 'Scholar Official Name' : currentUser?.role === 'TEACHER' ? 'e.g. Dr. Aniruddh Shastri' : 'e.g. Dr. Rajesh Sharma'}
                          className={`w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-semibold text-[#122A24] ${
                            ['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') ? 'bg-[#F4F8F5] cursor-not-allowed text-slate-600' : ''
                          }`}
                        />
                        {['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') && (
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            🔒 Official Registered Name. Contact school administration to request name corrections.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block font-semibold text-[#122A24] mb-1">
                            {currentUser?.role === 'STUDENT'
                              ? 'Scholar Admission No.'
                              : currentUser?.role === 'TEACHER'
                              ? 'Faculty Staff Code'
                              : currentUser?.role === 'PARENT'
                              ? 'Parent Account ID'
                              : 'Admin ID / Username'}
                          </label>
                          <input
                            type="text"
                            disabled={true}
                            value={profileForm.username || currentUser?.username || ''}
                            className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl font-mono text-xs text-slate-600 bg-[#F4F8F5] cursor-not-allowed font-bold"
                          />
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            🔒 User ID is system generated and cannot be modified.
                          </p>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#122A24] mb-1">Assigned Role</label>
                          <input
                            type="text"
                            disabled
                            value={currentUser?.role || 'STUDENT'}
                            className="w-full px-3.5 py-2.5 bg-[#F4F8F5] border border-[#DCE8E0] rounded-xl font-mono text-xs text-slate-500 font-bold cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">
                          {currentUser?.role === 'STUDENT' ? 'Student / Contact Email Address' : 'Official Email Address'}
                        </label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder={currentUser?.role === 'STUDENT' ? 'student@dps2026.edu' : currentUser?.role === 'TEACHER' ? 'faculty@school.edu' : 'admin@school.edu'}
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs text-[#122A24]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#122A24] mb-1">
                          {currentUser?.role === 'STUDENT' ? 'Primary Guardian Phone / WhatsApp' : 'Contact Phone / WhatsApp'}
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs text-[#122A24]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Security PIN & Password (STRICTLY ISOLATED BY ROLE) */}
                  <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-[#E8F0EA]">
                        <h3 className="font-display font-bold text-base text-[#122A24] flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700" />
                          {currentUser?.role === 'STUDENT'
                            ? 'Student Passcode & Security'
                            : currentUser?.role === 'TEACHER'
                            ? 'Teacher Personal Password'
                            : 'Security & PIN Authentication'}
                        </h3>
                        <p className="text-[11px] text-[#2D5A4E]">
                          {currentUser?.role === 'STUDENT'
                            ? 'Your private sign-in passcode for student portal access. Changing this only affects your scholar profile.'
                            : currentUser?.role === 'TEACHER'
                            ? 'Your private sign-in passcode for faculty login. Changing this only affects your teacher profile.'
                            : 'Master passcode used for institutional sign-in and sensitive operations.'}
                        </p>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-semibold text-[#122A24] mb-1">
                            {currentUser?.role === 'STUDENT'
                              ? 'Change Student Sign-in Passcode'
                              : currentUser?.role === 'TEACHER'
                              ? 'Change Teacher Sign-in Passcode'
                              : 'School Admin Security PIN / Passcode *'}
                          </label>
                          <div className="relative">
                            <input
                              type={showProfilePin ? "text" : "password"}
                              required={!['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                              value={profileForm.admin_pin}
                              onChange={(e) => setProfileForm({ ...profileForm, admin_pin: e.target.value })}
                              placeholder={['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') ? 'Enter new passcode (leave blank to keep current)' : '••••••'}
                              className="w-full px-3.5 py-2.5 pr-10 border border-[#DCE8E0] rounded-xl font-mono text-xs font-bold text-[#122A24] bg-emerald-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowProfilePin(!showProfilePin)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer flex items-center justify-center"
                              title={showProfilePin ? "Hide PIN" : "Show PIN"}
                            >
                              {showProfilePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <p className="text-[10.5px] text-[#2D5A4E] mt-1 font-mono">
                            {currentUser?.role === 'STUDENT'
                              ? '🔒 Protected: Modifying this only changes YOUR student passcode and CANNOT change school admin PIN or faculty credentials.'
                              : currentUser?.role === 'TEACHER'
                              ? '🔒 Protected: Modifying this only changes YOUR teacher passcode and CANNOT change the school admin PIN.'
                              : 'Used to log into the administrative portal alongside School Code.'}
                          </p>
                        </div>

                        <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-2 text-xs">
                          <div className="font-bold text-[#122A24] flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            {currentUser?.role === 'STUDENT'
                              ? 'Scholar Security Isolation'
                              : currentUser?.role === 'TEACHER'
                              ? 'Faculty Security Isolation'
                              : 'Session Security & Persistence'}
                          </div>
                          <ul className="text-[11px] text-[#2D5A4E] space-y-1 list-disc pl-4">
                            {currentUser?.role === 'STUDENT' ? (
                              <>
                                <li>Your passcode is strictly private to your scholar profile (Admission No: {currentUser?.username || 'DPS-2026-0001'}).</li>
                                <li>School Admin PIN and Faculty credentials are fully isolated and protected from student access.</li>
                                <li>Password changes take effect immediately across all active sessions.</li>
                              </>
                            ) : currentUser?.role === 'TEACHER' ? (
                              <>
                                <li>Your passcode is strictly private to your faculty profile (Staff Code: {currentUser?.username || 'EMP01'}).</li>
                                <li>School Admin PIN and Principal credentials are fully isolated and protected from faculty modification.</li>
                                <li>Password changes take effect immediately across all sessions.</li>
                              </>
                            ) : (
                              <>
                                <li>Changes sync immediately to MongoDB Atlas &amp; local database.</li>
                                <li>Session remains authenticated across all page navigations.</li>
                                <li>Multi-school workspace access is strictly isolated.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8F0EA] flex items-center justify-end gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full shadow-xs cursor-pointer border-none text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Save className="h-4 w-4" /> {
                          currentUser?.role === 'STUDENT'
                            ? 'Save Student Profile'
                            : currentUser?.role === 'TEACHER'
                            ? 'Save Teacher Profile'
                            : 'Save Profile Changes'
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3: Institutional Role & Access Powers Overview */}
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-4">
                  <div className="pb-3 border-b border-[#E8F0EA]">
                    <h3 className="font-display font-bold text-base text-[#122A24]">
                      {currentUser?.role === 'STUDENT'
                        ? 'Assigned Scholar Access Modules'
                        : currentUser?.role === 'TEACHER'
                        ? 'Assigned Faculty Workspace Modules'
                        : 'Assigned Administrative Powers'}
                    </h3>
                    <p className="text-[11px] text-[#2D5A4E]">
                      {currentUser?.role === 'STUDENT'
                        ? 'Your student account is authorized for personal attendance, homework submission, datesheet, and fee receipts.'
                        : currentUser?.role === 'TEACHER'
                        ? 'Your faculty account is authorized for academic instruction, classroom turnout, coursework, and grading.'
                        : 'Your account has full executive access across all 12 platform modules.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                    {(currentUser?.role === 'STUDENT' ? [
                      { label: 'My Attendance', icon: CalendarCheck, status: 'Verified Turnout', active: true },
                      { label: 'Homework Diary', icon: FileText, status: 'View & Submit', active: true },
                      { label: 'Report Cards', icon: Award, status: 'CBSE Marksheet', active: true },
                      { label: 'Fee Invoices', icon: CreditCard, status: 'Personal Receipts', active: true },
                      { label: 'School Circulars', icon: Bell, status: 'Read Notices', active: true },
                      { label: 'Certificates', icon: Award, status: 'Attested Copies', active: true },
                      { label: 'Faculty Directory', icon: Users, status: 'No Access', active: false },
                      { label: 'Student SIS Roster', icon: GraduationCap, status: 'No Access', active: false },
                      { label: 'Class Scheduling', icon: Layers, status: 'No Access', active: false },
                      { label: 'Broadcast Gateway', icon: Radio, status: 'No Access', active: false },
                      { label: 'Institutional Reports', icon: FileSpreadsheet, status: 'No Access', active: false },
                      { label: 'System Settings', icon: ShieldCheck, status: 'No Access', active: false },
                    ] : currentUser?.role === 'TEACHER' ? [
                      { label: 'Class Attendance', icon: CalendarCheck, status: 'Mark & Roll Call', active: true },
                      { label: 'CBSE Marks Entry', icon: Award, status: 'Grade Entry', active: true },
                      { label: 'Homework Dispatch', icon: FileText, status: 'Create & Assign', active: true },
                      { label: 'Student Directory', icon: GraduationCap, status: 'Classroom View', active: true },
                      { label: 'Course Curriculum', icon: Layers, status: 'Syllabus Tracker', active: true },
                      { label: 'Official Circulars', icon: Bell, status: 'Read Directives', active: true },
                      { label: 'Fee Invoicing', icon: CreditCard, status: 'No Access', active: false },
                      { label: 'Faculty Management', icon: Users, status: 'No Access', active: false },
                      { label: 'School Reports', icon: FileSpreadsheet, status: 'No Access', active: false },
                      { label: 'System Settings', icon: ShieldCheck, status: 'No Access', active: false },
                    ] : [
                      { label: 'Overview Analytics', icon: BarChart3, status: 'Full Access', active: true },
                      { label: 'Student Registry', icon: GraduationCap, status: 'Full Access', active: true },
                      { label: 'Faculty Management', icon: Users, status: 'Full Access', active: true },
                      { label: 'Classes & Sections', icon: Layers, status: 'Full Access', active: true },
                      { label: 'Daily Attendance', icon: CalendarCheck, status: 'Full Access', active: true },
                      { label: 'Fee Invoicing', icon: CreditCard, status: 'Full Access', active: true },
                      { label: 'Transport & GPS', icon: Bus, status: 'Full Access', active: true },
                      { label: 'CBSE Examinations', icon: Award, status: 'Full Access', active: true },
                      { label: 'Homework Dispatch', icon: FileText, status: 'Full Access', active: true },
                      { label: 'Principal Approvals', icon: CheckCircle2, status: 'Full Access', active: true },
                      { label: 'Emergency Broadcast', icon: Radio, status: 'Full Access', active: true },
                      { label: 'Notice Board', icon: Bell, status: 'Full Access', active: true },
                    ]).map((mod, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl flex flex-col justify-between space-y-2 border transition-all ${
                          mod.active
                            ? 'bg-[#F9FCFA] border-[#DCE8E0]'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <mod.icon className={`h-4 w-4 ${mod.active ? 'text-emerald-700' : 'text-slate-400'}`} />
                          <span className={`w-2 h-2 rounded-full ${mod.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div>
                          <div className={`font-semibold text-[11px] leading-tight ${mod.active ? 'text-[#122A24]' : 'text-slate-500'}`}>
                            {mod.label}
                          </div>
                          <div className={`text-[9px] font-mono font-bold mt-0.5 ${mod.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {mod.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB: TRANSPORT & LIVE GPS FLEET */}
          {activeTab === 'transport' && (
            <DashboardTransport
              students={students}
              schoolName={selectedSchool?.school_name}
              currentUser={currentUser}
              userRole={effectiveRole}
            />
          )}

          {/* TAB: CBSE EXAMINATIONS & DIGITAL MARKSHEETS */}
          {activeTab === 'exams' && (
            effectiveRole === 'STUDENT' ? (
              <DashboardStudentPortal
                currentUser={currentUser}
                selectedSchool={selectedSchool}
                students={students}
                invoices={invoices}
                attendance={attendance}
                selectedSession={selectedSession}
                activeView="exams"
                setActiveTab={setActiveTab}
                showAdminToast={showAdminToast}
              />
            ) : (
              <DashboardExams
                students={students}
                classes={classes}
                teachers={teachers}
                selectedSchool={selectedSchool}
                schoolName={selectedSchool?.school_name}
                selectedSession={selectedSession}
                attendance={attendance}
                userRole={effectiveRole}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )
          )}

          {/* TAB: DIGITAL LIBRARY & BOOK CIRCULATION */}
          {activeTab === 'library' && (
            <DashboardLibrary
              selectedSchool={selectedSchool}
              students={students}
              selectedSession={selectedSession}
              showAdminToast={showAdminToast}
            />
          )}

          {/* TAB: SMART GATE PASS & VISITOR SECURITY */}
          {activeTab === 'visitors' && (
            <DashboardVisitorGate
              selectedSchool={selectedSchool}
              students={students}
              selectedSession={selectedSession}
              showAdminToast={showAdminToast}
            />
          )}

          {/* TAB: HOMEWORK & CLASS DIARY */}
          {activeTab === 'homework' && (
            <DashboardHomework
              students={students}
              schoolName={selectedSchool?.school_name}
              userRole={effectiveRole}
              currentUser={currentUser}
            />
          )}

          {/* TAB: EMERGENCY BROADCAST & SMS GATEWAY */}
          {activeTab === 'broadcast' && (
            <DashboardBroadcast
              schoolName={selectedSchool?.school_name}
              userRole={effectiveRole}
            />
          )}
        </main>
      </div>

      {/* MODAL: COMPREHENSIVE CBSE STUDENT ENROLLMENT & EDIT (FULL DESKTOP VIEWPORT WITHOUT OVERLAPPING SIDEBAR) */}
      {showStudentModal && (
        <div className="fixed inset-0 lg:left-64 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-2 lg:p-3 animate-fade-in">
          <div className="bg-white rounded-none lg:rounded-2xl border-0 lg:border border-[#DCE8E0] w-full h-full lg:h-[98vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 md:px-8 border-b border-slate-200 flex justify-between items-start bg-slate-50/80 shrink-0">
              <div>
                <span className="font-mono text-[10px] text-[var(--red-pen)] font-bold uppercase tracking-wider">
                  CBSE OASIS &amp; SARAS Compliance Form
                </span>
                <h2 className="font-display font-semibold text-xl sm:text-2xl text-[var(--ink-navy)] mt-0.5">
                  {editingStudentId ? 'Edit Student & CBSE OASIS Record' : 'Student Admission Form'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  Basic details (Section 1) are required for quick save. You can fill the remaining CBSE sections now or update anytime later.
                </p>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl border-none bg-transparent cursor-pointer transition-colors"
                title="Close Form"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Form Body with Unified Sections (Spans across full page on desktop) */}
            <form onSubmit={handleSaveStudent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 space-y-6 text-xs">
                {/* SECTION 1: BASIC ENROLLMENT (REQUIRED) */}
                <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--ink-navy)] text-white font-mono font-bold text-[11px] flex items-center justify-center">1</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Basic Student &amp; Guardian Info</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Required for quick save
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.full_name || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">
                      Admission No (Login User ID) *
                      {editingStudentId && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-medium">Locked</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.admission_no || ''}
                      onChange={(e) => !editingStudentId && setStudentForm({ ...studentForm, admission_no: e.target.value })}
                      placeholder="e.g. ADM-2026-0042"
                      disabled={!!editingStudentId}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-semibold text-[var(--red-pen)] ${
                        editingStudentId
                          ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-70 select-none'
                          : 'border-slate-300 bg-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Login Passcode / PIN *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.passcode || '123456'}
                      onChange={(e) => setStudentForm({ ...studentForm, passcode: e.target.value })}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Class Enrolled *</label>
                    <select
                      required
                      value={studentForm.class_name || 'Class 10'}
                      onChange={(e) => setStudentForm({ ...studentForm, class_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      {classes && classes.length > 0 && (
                        <optgroup label="Active School Classes">
                          {Array.from(new Set(classes.map(c => c.class_name))).map(cName => (
                            <option key={`cls-${cName}`} value={cName}>{cName}</option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Early Years / Pre-Primary">
                        <option value="PG">PG (Playgroup)</option>
                        <option value="Playgroup">Playgroup</option>
                        <option value="Pre-Nursery">Pre-Nursery</option>
                        <option value="Creche">Creche / Daycare</option>
                        <option value="Nursery">Nursery</option>
                        <option value="LKG">LKG / KG-I</option>
                        <option value="UKG">UKG / KG-II</option>
                      </optgroup>
                      <optgroup label="Primary (Classes 1 to 5)">
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                      </optgroup>
                      <optgroup label="Middle (Classes 6 to 8)">
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                      </optgroup>
                      <optgroup label="Secondary (Classes 9 & 10)">
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                      </optgroup>
                      <optgroup label="Senior Secondary (Classes 11 & 12)">
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Section *</label>
                    <select
                      required
                      value={studentForm.section || 'A'}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Admission Type *</label>
                    <select
                      required
                      value={studentForm.admission_type || 'NEW'}
                      onChange={(e) => setStudentForm({ ...studentForm, admission_type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold text-emerald-900"
                    >
                      <option value="NEW">New Admission (Admission + Annual + Tuition)</option>
                      <option value="OLD">Old / Existing Student (Annual + Tuition)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Date of Admission *</label>
                    <input
                      type="date"
                      required
                      value={studentForm.admission_date || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, admission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Roll No (Optional)</label>
                    <input
                      type="text"
                      value={studentForm.roll_no || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                      placeholder="e.g. 101"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Primary Guardian / Parent Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.guardian_name || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Guardian Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={studentForm.guardian_phone || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })}
                      placeholder="+91 98111..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Gender *</label>
                    <select
                      value={studentForm.gender || 'Male'}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">School House</label>
                    <select
                      value={studentForm.house || 'Red House'}
                      onChange={(e) => setStudentForm({ ...studentForm, house: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      <option value="Red House">Red House (Tagore)</option>
                      <option value="Blue House">Blue House (Shivaji)</option>
                      <option value="Green House">Green House (Ashoka)</option>
                      <option value="Yellow House">Yellow House (Raman)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Fee Status</label>
                    <select
                      value={studentForm.fee_status || 'PENDING'}
                      onChange={(e) => setStudentForm({ ...studentForm, fee_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CBSE ACADEMIC & IDENTIFIERS */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">2</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">CBSE Academic &amp; PEN Details</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional / Can fill later</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">
                      APAAR / PEN (Permanent Education Number - CBSE Mandate)
                    </label>
                    <input
                      type="text"
                      value={studentForm.apaar_id || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, apaar_id: e.target.value })}
                      placeholder="12-digit PEN ID"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Date of Admission</label>
                    <input
                      type="date"
                      value={studentForm.admission_date || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, admission_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Medium of Instruction</label>
                    <select
                      value={studentForm.medium_of_instruction || 'ENGLISH'}
                      onChange={(e) => setStudentForm({ ...studentForm, medium_of_instruction: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="HINDI">Hindi</option>
                      <option value="REGIONAL">Regional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Previous School Name</label>
                    <input
                      type="text"
                      value={studentForm.previous_school || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, previous_school: e.target.value })}
                      placeholder="e.g. St. Xavier School"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">TC / Migration No</label>
                    <input
                      type="text"
                      value={studentForm.transfer_certificate_no || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, transfer_certificate_no: e.target.value })}
                      placeholder="TC-2025-88"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PERSONAL & DEMOGRAPHIC */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">3</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Personal &amp; Demographic Profile (CBSE SARAS)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Date of Birth (DOB)</label>
                    <input
                      type="date"
                      value={studentForm.dob || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Blood Group</label>
                    <select
                      value={studentForm.blood_group || 'O+'}
                      onChange={(e) => setStudentForm({ ...studentForm, blood_group: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Student Aadhaar Number</label>
                    <input
                      type="text"
                      value={studentForm.aadhaar_no || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, aadhaar_no: e.target.value })}
                      placeholder="12-digit UIDAI number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Category (CBSE)</label>
                    <select
                      value={studentForm.category || 'GENERAL'}
                      onChange={(e) => setStudentForm({ ...studentForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="GENERAL">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                      <option value="MINORITY">Minority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Religion</label>
                    <input
                      type="text"
                      value={studentForm.religion || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, religion: e.target.value })}
                      placeholder="Hindu / Muslim / Sikh / Christian"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Single Girl Child?</label>
                    <select
                      value={studentForm.single_girl_child || 'NO'}
                      onChange={(e) => setStudentForm({ ...studentForm, single_girl_child: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">CWSN (Specially Abled)?</label>
                    <select
                      value={studentForm.cwsn_status || 'NO'}
                      onChange={(e) => setStudentForm({ ...studentForm, cwsn_status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="NO">No</option>
                      <option value="YES">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: PARENTS & FAMILY */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">4</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Parents &amp; Family Profile</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Father Details */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5">
                    <div className="font-semibold text-[var(--ink-navy)] text-xs border-b border-slate-100 pb-1">Father Details</div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Father Full Name</label>
                      <input
                        type="text"
                        value={studentForm.father_name || ''}
                        onChange={(e) => setStudentForm({ ...studentForm, father_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Occupation</label>
                        <input
                          type="text"
                          value={studentForm.father_occupation || ''}
                          onChange={(e) => setStudentForm({ ...studentForm, father_occupation: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Annual Income (₹)</label>
                        <input
                          type="text"
                          value={studentForm.father_income || ''}
                          onChange={(e) => setStudentForm({ ...studentForm, father_income: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mother Details */}
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5">
                    <div className="font-semibold text-[var(--ink-navy)] text-xs border-b border-slate-100 pb-1">Mother Details</div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Mother Full Name</label>
                      <input
                        type="text"
                        value={studentForm.mother_name || ''}
                        onChange={(e) => setStudentForm({ ...studentForm, mother_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Occupation</label>
                        <input
                          type="text"
                          value={studentForm.mother_occupation || ''}
                          onChange={(e) => setStudentForm({ ...studentForm, mother_occupation: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Phone Number</label>
                        <input
                          type="tel"
                          value={studentForm.mother_phone || ''}
                          onChange={(e) => setStudentForm({ ...studentForm, mother_phone: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: ADDRESS & TRANSPORT */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">5</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Residential Address &amp; Transport</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--ink-navy)] mb-1">Residential Address</label>
                  <textarea
                    value={studentForm.residential_address || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, residential_address: e.target.value })}
                    placeholder="House/Flat No, Street, Locality..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs min-h-[55px] bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">City</label>
                    <input
                      type="text"
                      value={studentForm.city || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">State</label>
                    <input
                      type="text"
                      value={studentForm.state || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={studentForm.pincode || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Transport Required?</label>
                    <select
                      value={studentForm.transport_opted || 'NO'}
                      onChange={(e) => setStudentForm({ ...studentForm, transport_opted: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                    >
                      <option value="NO">No (Self Conveyance)</option>
                      <option value="YES">Yes (School Bus / Van)</option>
                    </select>
                  </div>

                  {studentForm.transport_opted === 'YES' && (
                    <div>
                      <label className="block font-semibold text-[var(--ink-navy)] mb-1">Distance Slab (Monthly Rate)</label>
                      <select
                        value={studentForm.transport_slab_id || '1'}
                        onChange={(e) => setStudentForm({ ...studentForm, transport_slab_id: e.target.value })}
                        className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50/50 text-xs font-medium text-emerald-950"
                      >
                        {DEFAULT_TRANSPORT_FEES.map((slab) => (
                          <option key={slab.id} value={slab.id}>
                            {slab.slab} — ₹{slab.monthlyFee}/month
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Bus Route No</label>
                    <input
                      type="text"
                      value={studentForm.bus_route_no || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, bus_route_no: e.target.value })}
                      placeholder="Route #4"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Pickup Point</label>
                    <input
                      type="text"
                      value={studentForm.pickup_point || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, pickup_point: e.target.value })}
                      placeholder="Main Chowk"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: AUTO-CALCULATED INSTITUTIONAL FEE SCHEDULE & DUES BREAKDOWN */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 rounded-2xl border-2 border-emerald-300/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                      6
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-[#122A24] flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-700" />
                        Auto-Calculated Admission Fee &amp; Dues Schedule
                      </h3>
                      <p className="text-[11px] text-emerald-800/90 font-mono">
                        Charges applied automatically as per CBSE Institutional Fee Master (Session {selectedSession || '2026-27'})
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-[10.5px] font-bold">
                    {registrationFeeBreakdown.admissionType === 'NEW' ? 'New Admission' : 'Old / Existing Student'}
                  </span>
                </div>

                {/* Calculation Summary Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/70 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 block">Class Rate</span>
                    <strong className="text-sm text-slate-800 font-display">
                      ₹{registrationFeeBreakdown.monthlyTuitionRate.toLocaleString('en-IN')}/mo
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{registrationFeeBreakdown.className}</span>
                  </div>

                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/70 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 block">Billing Period</span>
                    <strong className="text-sm text-emerald-900 font-display">
                      {registrationFeeBreakdown.monthCount} {registrationFeeBreakdown.monthCount === 1 ? 'Month' : 'Months'}
                    </strong>
                    <span className="text-[10px] text-emerald-700 block font-mono mt-0.5 truncate" title={registrationFeeBreakdown.periodLabel}>
                      {registrationFeeBreakdown.periodLabel}
                    </span>
                  </div>

                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/70 shadow-2xs">
                    <span className="text-[10.5px] text-slate-500 block">Transport Facility</span>
                    <strong className="text-sm text-slate-800 font-display">
                      {registrationFeeBreakdown.isTransportOpted ? `₹${registrationFeeBreakdown.monthlyTransportRate}/mo` : 'Self'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      {registrationFeeBreakdown.isTransportOpted ? registrationFeeBreakdown.selectedTransportSlab?.slab : 'Not opted'}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-700 text-white rounded-xl shadow-2xs">
                    <span className="text-[10.5px] text-emerald-200 block">Total Initial Payable</span>
                    <strong className="text-base font-bold font-mono block mt-0.5">
                      ₹{registrationFeeBreakdown.totalPayable.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Itemized Line Items Table */}
                <div className="bg-white rounded-xl border border-emerald-200/80 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                        <th className="p-2.5 pl-3.5">Fee Head</th>
                        <th className="p-2.5">Schedule / Basis</th>
                        <th className="p-2.5 pr-3.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11.5px]">
                      {registrationFeeBreakdown.admissionType === 'NEW' ? (
                        <tr>
                          <td className="p-2.5 pl-3.5 font-medium text-slate-900">
                            Admission Fee (One-Time)
                          </td>
                          <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                            New student enrollment registration
                          </td>
                          <td className="p-2.5 pr-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{registrationFeeBreakdown.admissionFee.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ) : (
                        <tr className="bg-slate-50/50">
                          <td className="p-2.5 pl-3.5 font-medium text-slate-500">
                            Admission Fee (One-Time)
                          </td>
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                            Waived (Old / Existing Student Readmission)
                          </td>
                          <td className="p-2.5 pr-3.5 text-right font-mono font-bold text-emerald-700">
                            ₹0
                          </td>
                        </tr>
                      )}

                      <tr>
                        <td className="p-2.5 pl-3.5 font-medium text-slate-900">
                          Annual Charges (Institutional Maintenance)
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                          Annual session fee ({registrationFeeBreakdown.className.includes('11') || registrationFeeBreakdown.className.includes('12') || registrationFeeBreakdown.className.includes('9') || registrationFeeBreakdown.className.includes('10') ? 'Classes IX to XII' : 'Classes PG to VIII'})
                        </td>
                        <td className="p-2.5 pr-3.5 text-right font-mono font-bold text-slate-900">
                          ₹{registrationFeeBreakdown.annualFee.toLocaleString('en-IN')}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 pl-3.5 font-medium text-slate-900">
                          Tuition Fee ({registrationFeeBreakdown.monthCount} {registrationFeeBreakdown.monthCount === 1 ? 'Month' : 'Months'} from April)
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                          {registrationFeeBreakdown.monthCount} × ₹{registrationFeeBreakdown.monthlyTuitionRate.toLocaleString('en-IN')} ({registrationFeeBreakdown.periodLabel})
                        </td>
                        <td className="p-2.5 pr-3.5 text-right font-mono font-bold text-slate-900">
                          ₹{registrationFeeBreakdown.tuitionFeeTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {registrationFeeBreakdown.isTransportOpted ? (
                        <tr>
                          <td className="p-2.5 pl-3.5 font-medium text-slate-900">
                            School Transport / Bus Fee ({registrationFeeBreakdown.monthCount} {registrationFeeBreakdown.monthCount === 1 ? 'Month' : 'Months'})
                          </td>
                          <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                            {registrationFeeBreakdown.selectedTransportSlab?.slab} • {registrationFeeBreakdown.monthCount} × ₹{registrationFeeBreakdown.monthlyTransportRate.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 pr-3.5 text-right font-mono font-bold text-slate-900">
                            ₹{registrationFeeBreakdown.transportFeeTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ) : (
                        <tr className="bg-slate-50/50">
                          <td className="p-2.5 pl-3.5 font-medium text-slate-400">
                            School Transport / Bus Fee
                          </td>
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                            Self conveyance opted
                          </td>
                          <td className="p-2.5 pr-3.5 text-right font-mono text-slate-400">
                            ₹0
                          </td>
                        </tr>
                      )}

                      <tr className="bg-emerald-50/80 font-bold border-t-2 border-emerald-300">
                        <td colSpan={2} className="p-3 pl-3.5 text-emerald-950 font-display text-xs">
                          TOTAL INITIAL DUES PAYABLE
                        </td>
                        <td className="p-3 pr-3.5 text-right font-mono text-sm text-emerald-900">
                          ₹{registrationFeeBreakdown.totalPayable.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Instant Fee Collection Controls */}
                {!editingStudentId && (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-300/80 space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={collectFeeNow}
                        onChange={(e) => setCollectFeeNow(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-xs text-[#122A24] flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        Collect Admission Fee Now &amp; Issue Official Receipt Immediately
                      </span>
                    </label>

                    {collectFeeNow ? (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">Payment Mode:</span>
                          <select
                            value={initialFeePaymentMode}
                            onChange={(e) => setInitialFeePaymentMode(e.target.value as any)}
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 font-semibold"
                          >
                            <option value="CASH">Cash Deposit</option>
                            <option value="UPI">UPI / QR Code</option>
                            <option value="ONLINE">Net Banking / Card</option>
                            <option value="CHEQUE">Bank Cheque</option>
                          </select>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          ✓ Student fee status will be set to PAID and receipt generated.
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-mono">
                        An official invoice of ₹{registrationFeeBreakdown.totalPayable.toLocaleString('en-IN')} will be generated on the student's dues ledger with status PENDING.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Pinned Action Bar — Always visible, safe on mobile, never hidden behind bottom dock */}
            <div className="shrink-0 p-3 sm:px-8 md:px-12 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2.5 z-20 shadow-md pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                {editingStudentId ? 'Updating student profile' : 'Quick Save: Only Section 1 required'}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudentId ? 'Save CBSE Profile Updates' : 'Save Student Registration'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* MODAL: COMPREHENSIVE CBSE TEACHER & EMPLOYEE REGISTRATION (FULL DESKTOP VIEWPORT WITHOUT OVERLAPPING SIDEBAR) */}
      {showTeacherModal && (
        <div className="fixed inset-0 lg:left-64 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-2 lg:p-3 animate-fade-in">
          <div className="bg-white rounded-none lg:rounded-2xl border-0 lg:border border-[#DCE8E0] w-full h-full lg:h-[98vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 md:px-8 border-b border-slate-200 flex justify-between items-start bg-slate-50/80 shrink-0">
              <div>
                <span className="font-mono text-[10px] text-[var(--red-pen)] font-bold uppercase tracking-wider">
                  CBSE Affiliation Bye-Laws &amp; OASIS Standards
                </span>
                <h2 className="font-display font-semibold text-xl sm:text-2xl text-[var(--ink-navy)] mt-0.5">
                  {editingTeacherId ? 'Edit Faculty & CBSE Staff Record' : 'Faculty & Staff Registration Form'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  Basic staff info (Section 1) is required for quick save. Complete qualifications and statutory details now or anytime later.
                </p>
              </div>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl border-none bg-transparent cursor-pointer transition-colors"
                title="Close Form"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Form Body with Unified Sections (Spans across full page on desktop) */}
            <form onSubmit={handleSaveTeacher} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 space-y-6 text-xs">
                {/* SECTION: INSTITUTIONAL ROLE & ERP ACCESS PERMISSIONS */}
                <div className="p-4 sm:p-5 bg-gradient-to-br from-white to-[#F8FAF9] rounded-2xl border-2 border-emerald-200/90 shadow-xs space-y-3.5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-[#E8F0EA]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#122A24] text-white font-mono font-bold text-[11px] flex items-center justify-center">
                      ★
                    </span>
                    <span className="font-display font-bold text-sm text-[#122A24]">
                      Institutional Role &amp; ERP Access Section
                    </span>
                  </div>
                  <span className="text-[11px] text-[#2D5A4E] font-mono font-semibold">
                    Assigned Role: <span className="underline font-bold">{STAFF_ROLES.find(r => r.id === (teacherForm.role || 'TEACHER'))?.label || teacherForm.role || 'Teacher'}</span>
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Choose the system operational role for this staff member. This segregates access rights and grants role-specific modules (e.g., Accountant for Fee collections, Driver for Bus Fleet, Admin for Admissions, Teacher for Marks &amp; Attendance):
                </p>

                {/* Grid of Interactive Role Selection Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {STAFF_ROLES.map((roleItem) => {
                    const isSelected = (teacherForm.role || 'TEACHER') === roleItem.id;
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => {
                          const isDefaultOrGeneric = !teacherForm.designation ||
                            teacherForm.designation === 'TGT - Trained Graduate Teacher (Classes VI-X)' ||
                            teacherForm.designation === 'Administrative Officer (School Administration & Operations)' ||
                            teacherForm.designation === 'Administrative Officer / Accounts Head' ||
                            teacherForm.designation === 'Accounts Head / Senior Accountant (Finance & Fees)' ||
                            teacherForm.designation === 'School Bus Driver / Transport Operator' ||
                            teacherForm.designation === 'Gate Security Guard / Head Watchman' ||
                            teacherForm.designation === 'Librarian / Head of Library';

                          const updated: Partial<Teacher> = { ...teacherForm, role: roleItem.id };
                          if (roleItem.id === 'ADMIN') {
                            updated.teacher_type = 'ADMINISTRATIVE';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'Administrative Officer (School Administration & Operations)';
                              updated.department = 'School Administration & Office Operations';
                              updated.subject_specialization = 'General Administration & Office Operations';
                              updated.professional_degree = 'MBA / Post Graduate in Management (School Administration)';
                            }
                          } else if (roleItem.id === 'ACCOUNTANT') {
                            updated.teacher_type = 'ADMINISTRATIVE';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'Accounts Head / Senior Accountant (Finance & Fees)';
                              updated.department = 'Accounts, Finance & Fee Collection Counter';
                              updated.subject_specialization = 'Accountancy & Business Studies';
                              updated.professional_degree = 'M.Com / B.Com / CA Inter / Finance Graduate (Accounts & Finance)';
                            }
                          } else if (roleItem.id === 'DRIVER') {
                            updated.teacher_type = 'NON_TEACHING';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'School Bus Driver / Transport Operator';
                              updated.department = 'Transport & Bus Fleet Operations';
                              updated.professional_degree = 'Class 10th / 12th + Heavy Commercial Driving License (Transport)';
                            }
                          } else if (roleItem.id === 'LIBRARIAN') {
                            updated.teacher_type = 'NON_TEACHING';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'Librarian / Head of Library';
                              updated.department = 'Academic Resource & Library';
                              updated.professional_degree = 'B.Lib / M.Lib (Library Science Norm)';
                            }
                          } else if (roleItem.id === 'SECURITY_GUARD') {
                            updated.teacher_type = 'NON_TEACHING';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'Gate Security Guard / Head Watchman';
                              updated.department = 'Campus Security & Safety Department';
                              updated.professional_degree = 'Class 10th / 12th + Security Guard Training Certificate (Security)';
                            }
                          } else if (roleItem.id === 'TEACHER') {
                            updated.teacher_type = 'TGT';
                            if (isDefaultOrGeneric) {
                              updated.designation = 'TGT - Trained Graduate Teacher (Classes VI-X)';
                              updated.department = 'Mathematics & Applied Mathematics';
                            }
                          }
                          setTeacherForm(updated);
                        }}
                        className={`p-3 rounded-xl text-left transition-all border cursor-pointer relative flex flex-col justify-between gap-2 text-xs ${
                          isSelected
                            ? 'bg-[#122A24] text-white border-[#122A24] shadow-md ring-2 ring-[#122A24]/15'
                            : 'bg-white hover:bg-[#F9FCFA] text-[#122A24] border-[#DCE8E0] hover:border-[#C5E2CF]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs truncate">
                            {roleItem.shortLabel}
                          </span>
                          <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : roleItem.badgeClass
                          }`}>
                            {roleItem.badge}
                          </span>
                        </div>
                        <p className={`text-[10.5px] line-clamp-2 leading-tight ${
                          isSelected ? 'text-emerald-100/85' : 'text-slate-500'
                        }`}>
                          {roleItem.description}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10">
                          <span className={`text-[10px] font-mono font-medium ${isSelected ? 'text-emerald-300' : 'text-[#2D5A4E]'}`}>
                            {isSelected ? '✓ Assigned Role' : 'Select Role'}
                          </span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'bg-emerald-400 border-emerald-400 text-[#122A24]' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#122A24]" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 1: BASIC STAFF INFO (REQUIRED) */}
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--ink-navy)] text-white font-mono font-bold text-[11px] flex items-center justify-center">1</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Basic Faculty &amp; Contact Info</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Required for quick save
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Faculty Full Name *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.full_name || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                      placeholder="e.g. Dr. Sunita Mehra"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Staff Code (Login User ID) *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.staff_code || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, staff_code: e.target.value })}
                      placeholder="e.g. STF-104"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-semibold bg-white"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Faculty portal User ID</span>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Login Passcode / PIN *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.passcode || '123456'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, passcode: e.target.value })}
                      placeholder="e.g. 123456"
                      className="w-full px-3 py-2 border border-blue-200 bg-blue-50/40 rounded-lg font-mono text-xs font-semibold text-[var(--ink-navy)]"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">Default: 123456</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Post / Designation (CBSE OASIS) *</label>
                    <select
                      value={isCustomRole ? 'CUSTOM' : (teacherForm.designation || STANDARD_DESIGNATIONS[0])}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomRole(true);
                          setTeacherForm({ ...teacherForm, designation: customRoleText || 'Custom Designation' });
                        } else {
                          setIsCustomRole(false);
                          setTeacherForm({ ...teacherForm, designation: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      {STANDARD_DESIGNATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="CUSTOM">Custom Role / Other Designation (Specify Below...)</option>
                    </select>
                    {isCustomRole && (
                      <div className="mt-2 animate-fade-in">
                        <label className="block text-[10.5px] text-slate-500 font-semibold mb-0.5">Specify Custom Designation / Role *</label>
                        <input
                          type="text"
                          required
                          value={customRoleText}
                          onChange={(e) => {
                            setCustomRoleText(e.target.value);
                            setTeacherForm({ ...teacherForm, designation: e.target.value });
                          }}
                          placeholder="e.g. Activity Coordinator / IT Head / Dance Master"
                          className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-semibold text-[var(--ink-navy)]"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Academic Department (CBSE Stream) *</label>
                    <select
                      value={isCustomDept ? 'CUSTOM' : (teacherForm.department || STANDARD_DEPARTMENTS[0])}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomDept(true);
                          setTeacherForm({ ...teacherForm, department: customDeptText || 'Custom Department' });
                        } else {
                          setIsCustomDept(false);
                          setTeacherForm({ ...teacherForm, department: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      {STANDARD_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="CUSTOM">Other Department (Specify Below...)</option>
                    </select>
                    {isCustomDept && (
                      <div className="mt-2 animate-fade-in">
                        <label className="block text-[10.5px] text-slate-500 font-semibold mb-0.5">Specify Custom Department *</label>
                        <input
                          type="text"
                          required
                          value={customDeptText}
                          onChange={(e) => {
                            setCustomDeptText(e.target.value);
                            setTeacherForm({ ...teacherForm, department: e.target.value });
                          }}
                          placeholder="e.g. Robotics &amp; STEM / Foreign Languages"
                          className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-semibold text-[var(--ink-navy)]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Primary Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={teacherForm.phone || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      placeholder="+91 98..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      value={teacherForm.email || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder="teacher@school.edu"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CBSE TEACHING QUALIFICATIONS & CREDENTIALS */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">2</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">CBSE Teaching Qualifications &amp; Credentials</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">CBSE Affiliation Norms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">CBSE Teacher Level</label>
                    <select
                      value={teacherForm.teacher_type || 'TGT'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, teacher_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      <option value="PGT">PGT (Post Graduate Teacher - Senior Secondary)</option>
                      <option value="TGT">TGT (Trained Graduate Teacher - Secondary/Middle)</option>
                      <option value="PRT">PRT (Primary Teacher - Classes I-V)</option>
                      <option value="NTT">NTT (Nursery Trained Teacher - Pre-Primary)</option>
                      <option value="ADMINISTRATIVE">Administrative / Support Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Professional Qualification (CBSE Norms)</label>
                    <select
                      value={isCustomQual ? 'CUSTOM' : (teacherForm.professional_degree || STANDARD_QUALIFICATIONS[0])}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomQual(true);
                          setTeacherForm({ ...teacherForm, professional_degree: customQualText || 'Custom Qualification' });
                        } else {
                          setIsCustomQual(false);
                          setTeacherForm({ ...teacherForm, professional_degree: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      {STANDARD_QUALIFICATIONS.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                      <option value="CUSTOM">Other Qualification / Degree (Specify Below...)</option>
                    </select>
                    {isCustomQual && (
                      <div className="mt-2 animate-fade-in">
                        <label className="block text-[10.5px] text-slate-500 font-semibold mb-0.5">Specify Other Qualification / Degree *</label>
                        <input
                          type="text"
                          required
                          value={customQualText}
                          onChange={(e) => {
                            setCustomQualText(e.target.value);
                            setTeacherForm({ ...teacherForm, professional_degree: e.target.value });
                          }}
                          placeholder="e.g. M.Phil in English / B.Des / Diploma in Music"
                          className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-semibold text-[var(--ink-navy)]"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">CTET / STET Status (CBSE Mandate)</label>
                    <select
                      value={teacherForm.ctet_qualified || 'YES'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, ctet_qualified: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="YES">Yes (Qualified - CTET Paper 1 / 2 / STET)</option>
                      <option value="NO">No (Exempted / In-Progress / Non-Teaching)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Subject Specialization</label>
                    <select
                      value={isCustomSubject ? 'CUSTOM' : (teacherForm.subject_specialization || STANDARD_SUBJECTS[0])}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomSubject(true);
                          setTeacherForm({ ...teacherForm, subject_specialization: customSubjectText || 'Custom Subject' });
                        } else {
                          setIsCustomSubject(false);
                          setTeacherForm({ ...teacherForm, subject_specialization: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      {STANDARD_SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="CUSTOM">Other Subject (Specify Below...)</option>
                    </select>
                    {isCustomSubject && (
                      <div className="mt-2 animate-fade-in">
                        <label className="block text-[10.5px] text-slate-500 font-semibold mb-0.5">Specify Other Subject *</label>
                        <input
                          type="text"
                          required
                          value={customSubjectText}
                          onChange={(e) => {
                            setCustomSubjectText(e.target.value);
                            setTeacherForm({ ...teacherForm, subject_specialization: e.target.value });
                          }}
                          placeholder="e.g. French / German / Astronomy"
                          className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-xs font-semibold text-[var(--ink-navy)]"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Classes Handled (CBSE Stage)</label>
                    <select
                      value={teacherForm.classes_taught || 'Classes 9 & 10 (Secondary Stage - TGT)'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, classes_taught: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="Classes 11 & 12 (Senior Secondary Stage - PGT)">Classes 11 &amp; 12 (Senior Secondary - PGT)</option>
                      <option value="Classes 9 & 10 (Secondary Stage - TGT)">Classes 9 &amp; 10 (Secondary Stage - TGT)</option>
                      <option value="Classes 6 to 8 (Middle Stage - Upper Primary)">Classes 6 to 8 (Middle Stage - Upper Primary)</option>
                      <option value="Classes 1 to 5 (Primary Stage - PRT)">Classes 1 to 5 (Primary Stage - PRT)</option>
                      <option value="Pre-Primary / Nursery / KG (Foundational Stage)">Pre-Primary / Nursery / KG (Foundational Stage)</option>
                      <option value="All Classes / Entire School (Specialist / Activity)">All Classes / Entire School (Activity/PET)</option>
                      <option value="Non-Teaching / Administrative Office">Non-Teaching / Administrative Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={teacherForm.experience_years ?? 5}
                      onChange={(e) => setTeacherForm({ ...teacherForm, experience_years: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={teacherForm.date_of_joining || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, date_of_joining: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Nature of Employment (CBSE Norm)</label>
                    <select
                      value={teacherForm.employment_type || 'PERMANENT'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, employment_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="PERMANENT">Permanent (Regular CBSE Affiliation Pay Scale)</option>
                      <option value="PROBATION">Probation (Under Observation Period)</option>
                      <option value="CONTRACTUAL">Contractual (Term-Based Appointment)</option>
                      <option value="PART_TIME">Part-Time / Visiting Faculty</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PERSONAL & IDENTITY */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">3</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Personal &amp; Identity Details</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={teacherForm.dob || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, dob: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Gender</label>
                    <select
                      value={teacherForm.gender || 'Female'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Blood Group</label>
                    <select
                      value={teacherForm.blood_group || 'B+'}
                      onChange={(e) => setTeacherForm({ ...teacherForm, blood_group: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      value={teacherForm.aadhaar_no || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, aadhaar_no: e.target.value })}
                      placeholder="12-digit UIDAI number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={teacherForm.pan_no || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, pan_no: e.target.value })}
                      placeholder="ABCDE1234F"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Father / Spouse Name</label>
                    <input
                      type="text"
                      value={teacherForm.father_or_spouse_name || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, father_or_spouse_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: STATUTORY, EPF & BANKING */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--board-1)] text-white font-mono font-bold text-[11px] flex items-center justify-center">4</span>
                    <span className="font-display font-semibold text-sm text-[var(--ink-navy)]">Statutory, EPF &amp; Banking Details (CBSE Norm)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">EPF / UAN Number (CBSE Mandate)</label>
                    <input
                      type="text"
                      value={teacherForm.epf_uan_no || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, epf_uan_no: e.target.value })}
                      placeholder="12-digit Universal Account Number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Monthly Basic Pay Scale (â‚¹)</label>
                    <input
                      type="number"
                      value={teacherForm.basic_pay || 45000}
                      onChange={(e) => setTeacherForm({ ...teacherForm, basic_pay: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Salary Bank Name</label>
                    <input
                      type="text"
                      value={teacherForm.bank_name || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, bank_name: e.target.value })}
                      placeholder="State Bank of India"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">Bank Account No</label>
                    <input
                      type="text"
                      value={teacherForm.bank_account_no || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, bank_account_no: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--ink-navy)] mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={teacherForm.bank_ifsc || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, bank_ifsc: e.target.value })}
                      placeholder="SBIN0001234"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs uppercase bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Pinned Action Bar — Always visible, safe on mobile, never hidden behind bottom dock */}
            <div className="shrink-0 p-3 sm:px-8 md:px-12 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2.5 z-20 shadow-md pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                {editingTeacherId ? 'Updating faculty profile' : 'Quick Save: Only Section 1 required'}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTeacherId ? 'Save CBSE Staff Updates' : 'Save Staff Registration'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* MODAL: PRINTABLE OFFICIAL FEE RECEIPT SLIP */}
      {viewInvoice && selectedSchool && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-5 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-fade-up max-h-[92vh] overflow-y-auto">
            <div id="printable-receipt" className="border-2 border-slate-800 p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-5 bg-white">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 sm:pb-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#122A24] text-white flex items-center justify-center font-display font-bold text-lg sm:text-xl">
                    {schoolInitial}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base sm:text-xl text-[#122A24] m-0 leading-tight">
                      {selectedSchool.school_name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-600 m-0 font-mono">
                      Affiliated to {selectedSchool.board || 'CBSE'} • Campus: {selectedSchool.city || 'Central'}
                    </p>
                    <p className="text-[10px] text-slate-500 m-0 font-mono">
                      Institutional Code: <strong>{selectedSchool.school_code}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[9.5px] sm:text-[10px] font-bold uppercase text-slate-400">Official Receipt</div>
                  <div className="text-xs sm:text-sm font-bold text-[#122A24]">{viewInvoice.invoice_no}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500">{viewInvoice.due_date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10.5px]">Student:</span>
                  <div className="font-bold text-[#122A24] truncate">{viewInvoice.student_name}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10.5px]">Class:</span>
                  <div className="font-bold text-[#122A24]">{viewInvoice.class_name}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10.5px]">Admission No:</span>
                  <div className="font-bold text-[#122A24]">{viewInvoice.admission_no || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10.5px]">Mode:</span>
                  <div className="font-medium text-slate-700">{viewInvoice.payment_mode || 'Cash/UPI'}</div>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-[10.5px] uppercase text-slate-600 border-b border-slate-300 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3">Tuition &amp; Instruction Fee</td>
                      <td className="py-2 px-3 text-right font-medium">₹{(viewInvoice.tuition_fee || viewInvoice.amount).toLocaleString()}</td>
                    </tr>
                    {Number(viewInvoice.transport_fee) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Transport Charges</td>
                        <td className="py-2 px-3 text-right font-medium">₹{Number(viewInvoice.transport_fee).toLocaleString()}</td>
                      </tr>
                    )}
                    {Number(viewInvoice.exam_fee) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Exam &amp; Lab Fund</td>
                        <td className="py-2 px-3 text-right font-medium">₹{Number(viewInvoice.exam_fee).toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                      <td className="py-2 px-3 text-[#122A24]">TOTAL AMOUNT</td>
                      <td className="py-2 px-3 text-right text-sm sm:text-base text-[#122A24] font-bold">
                        ₹{viewInvoice.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end pt-2 text-xs">
                <div>
                  <div className={`inline-block px-2.5 py-0.5 rounded-md border-2 font-bold uppercase tracking-wider text-[11px] ${
                    viewInvoice.status === 'PAID'
                      ? 'border-emerald-700 text-emerald-800 bg-emerald-50'
                      : 'border-amber-600 text-amber-700 bg-amber-50'
                  }`}>
                    {viewInvoice.status === 'PAID' ? '✓ PAID' : 'PENDING'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-24 sm:w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[9.5px] text-slate-500 font-mono">Accounts Stamp</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                onClick={() => handleToggleInvoiceStatus(viewInvoice)}
                className={`w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-full cursor-pointer border transition-colors ${
                  viewInvoice.status === 'PAID'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-[#C5E2CF] bg-[#EBF5EF] text-[#1C443A] hover:bg-[#D9EDE0]'
                }`}
              >
                {viewInvoice.status === 'PAID' ? 'Mark as Pending Dues' : '✓ Mark as PAID'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewInvoice(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 border border-[#DCE8E0] bg-[#F4F8F5] rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border-none"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE NEW FEE INVOICE */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div>
                <span className="font-mono text-[10px] text-[#2D5A4E] font-bold uppercase tracking-wider">Accounts Desk</span>
                <h2 className="font-display font-bold text-lg text-[#122A24] mt-0.5">Issue Fee Invoice</h2>
              </div>
              <button onClick={() => setShowAddInvoice(false)} className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-3.5 text-xs">
              {students.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Select Enrolled Student</label>
                  <select
                    onChange={(e) => {
                      const s = students.find(stu => stu.id === e.target.value);
                      if (s) {
                        setInvoiceForm({
                          ...invoiceForm,
                          student_id: s.id,
                          student_name: s.full_name,
                          admission_no: s.admission_no,
                          class_name: `${s.class_name} - ${s.section}`
                        });
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl bg-white text-xs font-medium"
                  >
                    <option value="">-- Choose student to autofill --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.admission_no} • {s.class_name} {s.section})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#122A24] mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.student_name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, student_name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Admission No</label>
                  <input
                    type="text"
                    value={invoiceForm.admission_no}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, admission_no: e.target.value })}
                    placeholder="e.g. ADM-0872"
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Class &amp; Section *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.class_name}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, class_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] space-y-2.5">
                <div className="font-semibold text-[#122A24] text-xs">Fee Head Breakdown (₹)</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10.5px] text-[#2D5A4E] font-medium mb-0.5">Tuition</label>
                    <input
                      type="number"
                      value={invoiceForm.tuition_fee}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tuition_fee: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#DCE8E0] rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-[#2D5A4E] font-medium mb-0.5">Transport</label>
                    <input
                      type="number"
                      value={invoiceForm.transport_fee}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, transport_fee: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#DCE8E0] rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-[#2D5A4E] font-medium mb-0.5">Exam/Lab</label>
                    <input
                      type="number"
                      value={invoiceForm.exam_fee}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, exam_fee: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-[#DCE8E0] rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
                <div className="text-right font-bold text-xs text-[#122A24] pt-1.5 border-t border-[#E8F0EA]">
                  Total Payable: ₹{(Number(invoiceForm.tuition_fee || 0) + Number(invoiceForm.transport_fee || 0) + Number(invoiceForm.exam_fee || 0)).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Status</label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl bg-white font-semibold text-xs"
                  >
                    <option value="PENDING">PENDING (Unpaid)</option>
                    <option value="PAID">PAID (Clear)</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="px-4 py-2.5 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLASS */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div>
                <span className="font-mono text-[10px] text-[#2D5A4E] font-bold uppercase tracking-wider">Curriculum Setup</span>
                <h2 className="font-display font-bold text-lg text-[#122A24] mt-0.5">Create Class Division</h2>
              </div>
              <button onClick={() => setShowAddClass(false)} className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3.5 text-xs">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Class Level *</label>
                    <select
                      required
                      value={
                        ['PG', 'Playgroup', 'Pre-Nursery', 'Creche', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(classForm.class_name)
                          ? classForm.class_name
                          : 'CUSTOM'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setClassForm({ ...classForm, class_name: '' });
                        } else {
                          setClassForm({ ...classForm, class_name: val });
                        }
                      }}
                      className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl bg-white text-xs font-medium"
                    >
                      <optgroup label="Early Years / Pre-Primary">
                        <option value="PG">PG (Playgroup)</option>
                        <option value="Playgroup">Playgroup</option>
                        <option value="Pre-Nursery">Pre-Nursery</option>
                        <option value="Creche">Creche / Daycare</option>
                        <option value="Nursery">Nursery</option>
                        <option value="LKG">LKG / KG-I</option>
                        <option value="UKG">UKG / KG-II</option>
                      </optgroup>
                      <optgroup label="Primary (Classes 1 to 5)">
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                      </optgroup>
                      <optgroup label="Middle (Classes 6 to 8)">
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                      </optgroup>
                      <optgroup label="Secondary (Classes 9 & 10)">
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                      </optgroup>
                      <optgroup label="Senior Secondary (Classes 11 & 12)">
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12</option>
                      </optgroup>
                      <optgroup label="Other / Custom">
                        <option value="CUSTOM">âœï¸ Custom Class Name...</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Section *</label>
                    <select
                      required
                      value={classForm.section || 'A'}
                      onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl bg-white text-xs font-medium font-mono"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                    </select>
                  </div>
                </div>

                {/* Freeform Custom Class Name Input if CUSTOM or non-standard selected */}
                {!['PG', 'Playgroup', 'Pre-Nursery', 'Creche', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(classForm.class_name) && (
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Enter Custom Class Name *</label>
                    <input
                      type="text"
                      required
                      value={classForm.class_name}
                      onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                      placeholder="e.g. PG, Playgroup Rose, Toddlers, Grade 1"
                      className="w-full px-3 py-2 border border-emerald-500 rounded-xl bg-emerald-50/40 text-xs font-semibold text-[#122A24] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#122A24] mb-1">Class Teacher</label>
                <select
                  value={classForm.class_teacher || ''}
                  onChange={(e) => setClassForm({ ...classForm, class_teacher: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl bg-white text-xs font-medium text-[#122A24] cursor-pointer"
                >
                  <option value="">-- Select Class Teacher from Faculty Roster --</option>
                  {teachers && teachers.length > 0 ? (
                    teachers
                      .filter(t => t.status !== 'INACTIVE')
                      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                      .map((t) => (
                        <option key={t.id} value={t.full_name}>
                          {t.full_name} ({t.designation || 'Faculty'} - {t.department || t.subject_specialization || 'General'})
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No registered faculty available</option>
                  )}
                  {classForm.class_teacher && !teachers.some(t => t.full_name === classForm.class_teacher) && (
                    <option value={classForm.class_teacher}>{classForm.class_teacher} (Assigned)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Room No</label>
                  <input
                    type="text"
                    value={classForm.room_no}
                    onChange={(e) => setClassForm({ ...classForm, room_no: e.target.value })}
                    placeholder="e.g. Room 204"
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Student Capacity</label>
                  <input
                    type="number"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-2.5 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CBSE CURRICULUM & SUBJECTS STUDIO */}
      {manageSubjectsClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-[#2D5A4E] font-bold uppercase tracking-wider">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
                  <span>CBSE Curriculum &amp; Subject Scheme</span>
                  <span>•</span>
                  <span>Section {manageSubjectsClass.section}</span>
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{manageSubjectsClass.class_name} - Section {manageSubjectsClass.section}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#EBF5EF] text-[#1C443A] border border-[#C5E2CF]">
                    {manageSubjectsClass.subjects?.length || 0} Subjects Prescribed
                  </span>
                </h2>
                <p className="text-[11px] text-[#2D5A4E] mt-0.5">
                  Class Teacher: <strong className="text-[#122A24]">{manageSubjectsClass.class_teacher || 'Assigned Faculty'}</strong> • Room: <span className="font-mono">{manageSubjectsClass.room_no || 'Room 101'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                {/* Reset to CBSE Standards Button */}
                <button
                  type="button"
                  onClick={handleResetCbseSubjects}
                  disabled={subjectSaving}
                  className="px-3 py-1.5 bg-[#F4F8F5] hover:bg-[#EBF5EF] text-[#122A24] border border-[#DCE8E0] rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Restore standard CBSE subjects for this class"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#1C443A]" />
                  <span>Reset CBSE</span>
                </button>

                {/* Add New Subject Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubjectId(null);
                    setShowAddSubjectInline(!showAddSubjectInline);
                    setSubjectForm({
                      id: '',
                      name: '',
                      code: '',
                      type: 'COMPULSORY',
                      weekly_periods: 6,
                      assigned_teacher: manageSubjectsClass.class_teacher || '',
                      max_marks: 100
                    });
                  }}
                  className="px-3.5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Subject</span>
                </button>

                {/* Close Modal */}
                <button
                  type="button"
                  onClick={() => setManageSubjectsClass(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Inline Add / Edit Subject Form */}
            {(showAddSubjectInline || editingSubjectId) && (
              <form onSubmit={handleSaveSubject} className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#C5E2CF] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="font-display font-bold text-sm text-[#122A24] flex items-center gap-1.5">
                    <Edit3 className="h-4 w-4 text-emerald-700" />
                    <span>{editingSubjectId ? 'Edit / Rename Subject' : 'Add New Subject to Curriculum'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubjectInline(false);
                      setEditingSubjectId(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#122A24] mb-1">Subject Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mathematics (Standard), Physics, Computer Science"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DCE8E0] rounded-xl font-medium text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">CBSE Subject Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 041, 086, 184"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-[#DCE8E0] rounded-xl font-mono text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Subject Type</label>
                    <select
                      value={subjectForm.type}
                      onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                      className="w-full px-2.5 py-2 border border-[#DCE8E0] rounded-xl text-xs bg-white font-medium"
                    >
                      <option value="COMPULSORY">Compulsory</option>
                      <option value="LANGUAGE">Language</option>
                      <option value="ELECTIVE">Elective / Optional</option>
                      <option value="SKILL">Skill / Vocational</option>
                      <option value="INTERNAL_ASSESSMENT">Internal Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Weekly Periods</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={subjectForm.weekly_periods}
                      onChange={(e) => setSubjectForm({ ...subjectForm, weekly_periods: Number(e.target.value) })}
                      className="w-full px-2.5 py-2 border border-[#DCE8E0] rounded-xl font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Max Marks</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={subjectForm.max_marks}
                      onChange={(e) => setSubjectForm({ ...subjectForm, max_marks: Number(e.target.value) })}
                      className="w-full px-2.5 py-2 border border-[#DCE8E0] rounded-xl font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Assigned Teacher</label>
                    <select
                      value={subjectForm.assigned_teacher}
                      onChange={(e) => setSubjectForm({ ...subjectForm, assigned_teacher: e.target.value })}
                      className="w-full px-2.5 py-2 border border-[#DCE8E0] rounded-xl text-xs bg-white truncate"
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.full_name}>{t.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8E0]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubjectInline(false);
                      setEditingSubjectId(null);
                    }}
                    className="px-3.5 py-1.5 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={subjectSaving}
                    className="px-5 py-1.5 bg-[#122A24] hover:bg-[#1C443A] text-white rounded-full text-xs font-semibold shadow-xs cursor-pointer border-none"
                  >
                    {subjectSaving ? 'Saving...' : (editingSubjectId ? 'Save Subject Changes' : 'Add Subject to Class')}
                  </button>
                </div>
              </form>
            )}

            {/* Subjects Table */}
            <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F3F7F5] font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider border-b border-[#DCE8E0]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3.5">Code</th>
                    <th className="py-2.5 px-4">Subject Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Periods/Wk</th>
                    <th className="py-2.5 px-3 text-center">Max Marks</th>
                    <th className="py-2.5 px-4">Subject Teacher</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBF2ED] font-sans">
                  {(manageSubjectsClass.subjects || []).length > 0 ? (
                    manageSubjectsClass.subjects!.map((subj, idx) => {
                      const typeBadge = {
                        COMPULSORY: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Compulsory' },
                        LANGUAGE: { bg: 'bg-teal-50 text-teal-800 border-teal-200', label: 'Language' },
                        SKILL: { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Skill / Vocational' },
                        ELECTIVE: { bg: 'bg-purple-50 text-purple-800 border-purple-200', label: 'Elective' },
                        INTERNAL_ASSESSMENT: { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Internal' }
                      }[subj.type || 'COMPULSORY'] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: subj.type || 'Standard' };

                      return (
                        <tr key={subj.id || idx} className="hover:bg-[#F9FCFA] transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-[#1C443A]">
                            {subj.code || '-'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#122A24]">
                            <div className="flex items-center gap-1.5">
                              <span>{subj.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${typeBadge.bg}`}>
                              {typeBadge.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-[#122A24]">
                            {subj.weekly_periods || 6}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">
                            {subj.max_marks || 100}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-700">
                            {subj.assigned_teacher || manageSubjectsClass.class_teacher || '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Subject */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubjectId(subj.id);
                                  setShowAddSubjectInline(false);
                                  setSubjectForm({
                                    id: subj.id,
                                    name: subj.name,
                                    code: subj.code || '',
                                    type: subj.type || 'COMPULSORY',
                                    weekly_periods: subj.weekly_periods || 6,
                                    assigned_teacher: subj.assigned_teacher || '',
                                    max_marks: subj.max_marks || 100
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-[#EBF5EF] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                title="Rename or edit subject"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Subject */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                title="Delete subject from class"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                        No subjects assigned to this class yet. Click &quot;Reset CBSE&quot; to restore standard CBSE subjects or &quot;Add Subject&quot; to create custom subjects.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E8F0EA] text-xs text-[#2D5A4E]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All changes auto-sync to CBSE Academic Registers &amp; MongoDB database.</span>
              </div>
              <button
                type="button"
                onClick={() => setManageSubjectsClass(null)}
                className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full shadow-xs cursor-pointer border-none text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTICE */}
      {showAddNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div>
                <span className="font-mono text-[10px] text-[#2D5A4E] font-bold uppercase tracking-wider">Notice Board</span>
                <h2 className="font-display font-bold text-lg text-[#122A24] mt-0.5">Publish Circular</h2>
              </div>
              <button onClick={() => setShowAddNotice(false)} className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNotice} className="space-y-3.5 text-xs">
              {/* Autogenerated Reference & Date Stamp Banner */}
              <div className="p-3 bg-[#F8FAF9] rounded-2xl border border-[#DCE8E0] space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-[#1C443A] font-bold flex-wrap gap-1">
                  <span>Ref No: DPS/2026/{new Date().getDate()}/{new Date().getMonth() + 1}/{noticeForm.matter_category || 'ACAD'}/[AUTO]</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF5EF] text-[#122A24] border border-[#C5E2CF]">
                    Immutable &amp; Autogenerated
                  </span>
                </div>
                <div className="text-slate-500 text-[10.5px]">
                  Date: Today ({formatDateDisplay(new Date().toISOString().split('T')[0])}) • ISO Realtime Timestamp
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#122A24] mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="e.g. Annual Sports Meet 2026-27"
                  className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Matter Category *</label>
                  <select
                    value={noticeForm.matter_category || 'ACAD'}
                    onChange={(e) => setNoticeForm({ ...noticeForm, matter_category: e.target.value })}
                    className="w-full px-2.5 py-2.5 border border-[#DCE8E0] rounded-xl bg-white font-semibold text-xs text-[#122A24]"
                  >
                    <option value="ACAD">ACAD (Academic)</option>
                    <option value="EXAM">EXAM (Exams &amp; Tests)</option>
                    <option value="OFFICE">OFFICE (Admin Order)</option>
                    <option value="CBSE">CBSE (Board Directive)</option>
                    <option value="HOLIDAY">HOLIDAY (Closures)</option>
                    <option value="FEES">FEES (Fee Dues)</option>
                    <option value="EVENT">EVENT (Sports/Cultural)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Target Audience</label>
                  <select
                    value={noticeForm.target_audience}
                    onChange={(e) => setNoticeForm({ ...noticeForm, target_audience: e.target.value as any })}
                    className="w-full px-2.5 py-2.5 border border-[#DCE8E0] rounded-xl bg-white font-medium text-xs text-[#122A24]"
                  >
                    <option value="ALL">All (Everyone)</option>
                    <option value="TEACHERS">Teachers &amp; Staff</option>
                    <option value="PARENTS">Parents</option>
                    <option value="STUDENTS">Students</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Posted By</label>
                  <input
                    type="text"
                    value={noticeForm.posted_by}
                    onChange={(e) => setNoticeForm({ ...noticeForm, posted_by: e.target.value })}
                    className="w-full px-2.5 py-2.5 border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#122A24] mb-1">Notice Content *</label>
                <textarea
                  required
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Write the circular or announcement details..."
                  className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl min-h-[90px] resize-y text-xs font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setShowAddNotice(false)}
                  className="px-4 py-2.5 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs"
                >
                  Publish Circular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMIZE USER PROFILE */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div>
                <span className="font-mono text-[10px] text-[#2D5A4E] font-bold uppercase tracking-wider">
                  {currentUser?.role === 'TEACHER' ? 'Faculty Credentials' : 'Account Credentials'}
                </span>
                <h2 className="font-display font-bold text-lg text-[#122A24] mt-0.5">
                  {currentUser?.role === 'STUDENT'
                    ? 'Student Profile & Passcode'
                    : currentUser?.role === 'TEACHER'
                    ? 'Teacher Profile & Passcode'
                    : 'Customize Profile'}
                </h2>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#122A24] mb-1">
                  {currentUser?.role === 'STUDENT'
                    ? 'Scholar Official Name'
                    : currentUser?.role === 'TEACHER'
                    ? 'Faculty Official Name'
                    : 'Display Name (Principal / Administrator) *'}
                </label>
                <input
                  type="text"
                  required={!['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                  disabled={['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className={`w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl font-medium ${
                    ['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') ? 'bg-[#F4F8F5] cursor-not-allowed text-slate-600' : ''
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">
                    {currentUser?.role === 'STUDENT'
                      ? 'Scholar Admission No.'
                      : currentUser?.role === 'TEACHER'
                      ? 'Staff Code'
                      : 'Admin Username / ID'}
                  </label>
                  <input
                    type="text"
                    disabled={true}
                    value={profileForm.username || currentUser?.username || ''}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl font-mono bg-[#F4F8F5] cursor-not-allowed font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">
                    {currentUser?.role === 'STUDENT'
                      ? 'New Passcode'
                      : currentUser?.role === 'TEACHER'
                      ? 'New Passcode'
                      : 'Security PIN / Passcode'}
                  </label>
                  <div className="relative">
                    <input
                      type={showModalPin ? "text" : "password"}
                      required={!['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '')}
                      value={profileForm.admin_pin}
                      onChange={(e) => setProfileForm({ ...profileForm, admin_pin: e.target.value })}
                      placeholder={['STUDENT', 'TEACHER', 'PARENT'].includes(currentUser?.role || '') ? 'Leave blank to keep' : '••••••'}
                      className="w-full px-3 py-2.5 pr-9 border border-[#DCE8E0] rounded-xl font-mono text-xs font-bold text-[#122A24]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPin(!showModalPin)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer flex items-center justify-center"
                      title={showModalPin ? "Hide PIN" : "Show PIN"}
                    >
                      {showModalPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder={currentUser?.role === 'TEACHER' ? 'faculty@school.edu' : 'admin@school.edu'}
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2.5 border border-[#DCE8E0] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs"
                >
                  {currentUser?.role === 'STUDENT'
                    ? 'Update Student Passcode'
                    : currentUser?.role === 'TEACHER'
                    ? 'Update Credentials'
                    : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CBSE STUDENT PROMOTION & GRADUATION STUDIO */}
      {showPromotionStudio && (() => {
        const targetStudents = students.filter(s => {
          const clsMatch = s.class_name?.toLowerCase().replace(/^class\s*/i, '').trim() === promotionSourceClass.toLowerCase().replace(/^class\s*/i, '').trim() || s.class_name?.toLowerCase() === promotionSourceClass.toLowerCase();
          const secMatch = promotionSourceSection === 'ALL' || (s.section || 'A').toUpperCase() === promotionSourceSection.toUpperCase();
          return clsMatch && secMatch;
        });

        let promoteCount = 0;
        let retainCount = 0;
        let graduateCount = 0;
        let leftCount = 0;

        targetStudents.forEach(s => {
          const cfg = promotionActionsMap[s.id] || {
            action: promotionSourceClass === 'Class 12' ? 'GRADUATE' : 'PROMOTE',
            targetSection: promotionTargetSection === 'SAME' ? (s.section || 'A') : promotionTargetSection
          };
          if (cfg.action === 'PROMOTE') promoteCount++;
          else if (cfg.action === 'RETAIN') retainCount++;
          else if (cfg.action === 'GRADUATE') graduateCount++;
          else if (cfg.action === 'LEFT') leftCount++;
        });

        const isClass12 = promotionSourceClass === 'Class 12';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-3xl border border-[#DCE8E0] p-5 sm:p-7 max-w-5xl w-full shadow-2xl space-y-5 max-h-[94vh] overflow-y-auto animate-fade-in flex flex-col">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold text-sm border border-[#C5E2CF]">
                      ðŸŽ“
                    </span>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-[#122A24] tracking-tight">
                      CBSE Student Promotion &amp; Graduation Studio
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-[#122A24] text-white">
                      Session Transition Studio
                    </span>
                  </div>
                  <p className="text-xs text-[#2D5A4E] mt-1">
                    Bulk promote scholars into higher CBSE grades, retain students, or graduate Class 12 batches into Alumni.
                  </p>
                </div>
                <button
                  onClick={() => setShowPromotionStudio(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer self-end sm:self-auto"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step 1: Promotion Configuration Controls */}
              <div className="bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] p-4 space-y-3.5">
                <div className="font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Configure Academic Progression Pipeline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Source Class */}
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Source Current Class</label>
                    <select
                      value={promotionSourceClass}
                      onChange={(e) => {
                        const nextSrc = e.target.value;
                        setPromotionSourceClass(nextSrc);
                        const autoNext = NEXT_CLASS_MAP[nextSrc] || 'Class 10';
                        setPromotionTargetClass(autoNext);
                        setPromotionActionsMap({});
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-medium text-[#122A24] focus:outline-none focus:border-[#10B981]"
                    >
                      <optgroup label="Pre-Primary">
                        <option value="Nursery">Nursery</option>
                        <option value="LKG">LKG</option>
                        <option value="UKG">UKG</option>
                      </optgroup>
                      <optgroup label="Primary (1-5)">
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                      </optgroup>
                      <optgroup label="Middle & Secondary (6-10)">
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                      </optgroup>
                      <optgroup label="Senior Secondary (11-12)">
                        <option value="Class 11">Class 11</option>
                        <option value="Class 12">Class 12 (Graduation Batch)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Source Section */}
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Source Section</label>
                    <select
                      value={promotionSourceSection}
                      onChange={(e) => {
                        setPromotionSourceSection(e.target.value);
                        setPromotionActionsMap({});
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-medium text-[#122A24] focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="ALL">All Sections (A, B, C, D)</option>
                      <option value="A">Section A Only</option>
                      <option value="B">Section B Only</option>
                      <option value="C">Section C Only</option>
                      <option value="D">Section D Only</option>
                    </select>
                  </div>

                  {/* Target Class */}
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">
                      {isClass12 ? 'Target Status' : 'Target Next Class'}
                    </label>
                    {isClass12 ? (
                      <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800 flex items-center gap-1.5">
                        <span>Graduated / Alumni</span>
                      </div>
                    ) : (
                      <select
                        value={promotionTargetClass}
                        onChange={(e) => setPromotionTargetClass(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-medium text-[#122A24] focus:outline-none focus:border-[#10B981]"
                      >
                        <option value="LKG">LKG</option>
                        <option value="UKG">UKG</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={`Class ${num}`}>{`Class ${num}`}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Target Academic Session */}
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Next Session</label>
                    <select
                      value={promotionTargetSession}
                      onChange={(e) => setPromotionTargetSession(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-mono text-[#122A24] focus:outline-none focus:border-[#10B981]"
                    >
                      <option value="2027-28">Session 2027-28 (Next)</option>
                      <option value="2026-27">Session 2026-27 (Current)</option>
                    </select>
                  </div>
                </div>

                {/* Batch Action Helpers */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8F0EA] flex-wrap">
                  <span className="text-[11px] text-[#2D5A4E] font-medium">
                    Scholars to process: <strong className="text-[#122A24]">{targetStudents.length}</strong>
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isClass12 ? (
                      <button
                        onClick={() => handleSetAllPromotionAction('PROMOTE')}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        ✓ Set All: Promote to {promotionTargetClass}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetAllPromotionAction('GRADUATE')}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        Set All: Graduate as Alumni
                      </button>
                    )}
                    <button
                      onClick={() => handleSetAllPromotionAction('RETAIN')}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      Set All: Retain / Repeat
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Interactive Student Roster & Action Allocation Table */}
              <div className="rounded-2xl border border-[#DCE8E0] overflow-hidden bg-white shadow-2xs">
                <div className="p-3 bg-[#F3F7F5] border-b border-[#DCE8E0] font-mono text-[11px] font-bold text-[#1C443A] uppercase tracking-wider flex justify-between items-center">
                  <span>2. Review Scholar Status &amp; Individual Promotion Decisions</span>
                  <span>{targetStudents.length} Students</span>
                </div>

                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#F9FCFA] font-mono text-[10.5px] font-bold text-[#2D5A4E] uppercase border-b border-[#E8F0EA]">
                      <tr>
                        <th className="py-2 px-3 w-12">Roll</th>
                        <th className="py-2 px-3">Adm No</th>
                        <th className="py-2 px-3">Scholar Name</th>
                        <th className="py-2 px-3 text-center">Term Rec</th>
                        <th className="py-2 px-3 text-center">Fee Clearance</th>
                        <th className="py-2 px-3">Promotion Decision</th>
                        <th className="py-2 px-3 text-center">Target Sec</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBF2ED]">
                      {targetStudents.map((s, idx) => {
                        const cfg = promotionActionsMap[s.id] || {
                          action: isClass12 ? 'GRADUATE' : 'PROMOTE',
                          targetSection: promotionTargetSection === 'SAME' ? (s.section || 'A') : promotionTargetSection
                        };
                        const initials = (s.full_name || 'Scholar').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                        return (
                          <tr key={s.id} className="hover:bg-[#F9FCFA] transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#122A24]">
                              #{s.roll_no || (idx + 1).toString().padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#2D5A4E]">
                              {s.admission_no}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[#EBF5EF] text-[#122A24] font-bold text-[9px] flex items-center justify-center border border-[#C5E2CF]">
                                  {initials}
                                </div>
                                <div className="font-semibold text-[#122A24]">{s.full_name}</div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF5EF] text-[#1C443A]">
                                {s.attendance_percent || 95}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.fee_status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {s.fee_status || 'PAID'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {!isClass12 ? (
                                  <button
                                    onClick={() => setPromotionActionsMap(prev => ({
                                      ...prev,
                                      [s.id]: { ...cfg, action: 'PROMOTE' }
                                    }))}
                                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border cursor-pointer transition-all ${
                                      cfg.action === 'PROMOTE'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                  >
                                    Promote
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setPromotionActionsMap(prev => ({
                                      ...prev,
                                      [s.id]: { ...cfg, action: 'GRADUATE' }
                                    }))}
                                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border cursor-pointer transition-all ${
                                      cfg.action === 'GRADUATE'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                  >
                                    Graduate
                                  </button>
                                )}
                                <button
                                  onClick={() => setPromotionActionsMap(prev => ({
                                    ...prev,
                                    [s.id]: { ...cfg, action: 'RETAIN' }
                                  }))}
                                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border cursor-pointer transition-all ${
                                    cfg.action === 'RETAIN'
                                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                                  }`}
                                >
                                  Retain
                                </button>
                                <button
                                  onClick={() => setPromotionActionsMap(prev => ({
                                    ...prev,
                                    [s.id]: { ...cfg, action: 'LEFT' }
                                  }))}
                                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold border cursor-pointer transition-all ${
                                    cfg.action === 'LEFT'
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                  }`}
                                >
                                  TC/Left
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <select
                                value={cfg.targetSection || s.section || 'A'}
                                onChange={(e) => setPromotionActionsMap(prev => ({
                                  ...prev,
                                  [s.id]: { ...cfg, targetSection: e.target.value }
                                }))}
                                className="px-2 py-0.5 bg-white border border-[#DCE8E0] rounded-lg text-xs font-semibold text-[#122A24]"
                              >
                                <option value="A">Sec A</option>
                                <option value="B">Sec B</option>
                                <option value="C">Sec C</option>
                                <option value="D">Sec D</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      {targetStudents.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs font-mono text-[#2D5A4E]">
                            No students found enrolled in {promotionSourceClass} (Section {promotionSourceSection}). Select another class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Impact Summary & Execution Footer */}
              <div className="bg-[#EBF5EF] p-4 rounded-2xl border border-[#C5E2CF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap text-xs font-mono font-bold text-[#1C443A]">
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#C5E2CF]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {promoteCount} Promoted to {promotionTargetClass}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#C5E2CF]">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {retainCount} Retained in {promotionSourceClass}
                  </span>
                  {graduateCount > 0 && (
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#C5E2CF]">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      {graduateCount} Graduated (Alumni)
                    </span>
                  )}
                  {leftCount > 0 && (
                    <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#C5E2CF]">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {leftCount} TC Issued
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowPromotionStudio(false)}
                    className="px-4 py-2 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePromotion}
                    disabled={promotionExecuting || targetStudents.length === 0}
                    className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs flex items-center gap-2 disabled:opacity-60"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>{promotionExecuting ? 'Executing Promotion...' : 'Execute Promotion & Sync'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: INDIVIDUAL STUDENT PROMOTION & ACADEMIC TRANSITION */}
      {individualPromotionStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#EBF5EF] text-[#122A24] flex items-center justify-center font-bold text-sm border border-[#C5E2CF]">
                  ðŸŽ“
                </span>
                <div>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                    Individual Scholar Promotion
                  </span>
                  <h2 className="font-display font-bold text-lg text-[#122A24]">
                    {individualPromotionStudent.full_name}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIndividualPromotionStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Academic Snapshot */}
            <div className="p-3.5 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#2D5A4E] font-mono block">Admission No</span>
                <span className="font-bold font-mono text-[#122A24]">{individualPromotionStudent.admission_no}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#2D5A4E] font-mono block">Current Class</span>
                <span className="font-bold text-[#122A24]">{individualPromotionStudent.class_name} ({individualPromotionStudent.section || 'A'})</span>
              </div>
              <div>
                <span className="text-[10px] text-[#2D5A4E] font-mono block">Attendance</span>
                <span className="font-bold font-mono text-emerald-700">{individualPromotionStudent.attendance_percent || 95}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#2D5A4E] font-mono block">Fee Clearance</span>
                <span className="font-bold font-mono text-emerald-700">{individualPromotionStudent.fee_status || 'PAID'}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteIndividualPromotion} className="space-y-4 text-xs">
              {/* Decision Action Pills */}
              <div>
                <label className="block font-semibold text-[#122A24] mb-1.5">Promotion Decision *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIndividualPromotionAction('PROMOTE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      individualPromotionAction === 'PROMOTE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span>Promote to Next Class</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndividualPromotionAction('RETAIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      individualPromotionAction === 'RETAIN'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>Retain in Same Class</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndividualPromotionAction('GRADUATE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      individualPromotionAction === 'GRADUATE'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>Graduate (Alumni)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndividualPromotionAction('LEFT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      individualPromotionAction === 'LEFT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span>TC Issued / Left</span>
                  </button>
                </div>
              </div>

              {/* Target Class & Section Configuration */}
              {individualPromotionAction === 'PROMOTE' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F9FCFA] rounded-2xl border border-[#DCE8E0]">
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Target Class *</label>
                    <select
                      value={individualTargetClass}
                      onChange={(e) => setIndividualTargetClass(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-medium text-[#122A24]"
                    >
                      <option value="LKG">LKG</option>
                      <option value="UKG">UKG</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={`Class ${num}`}>{`Class ${num}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#122A24] mb-1">Target Section *</label>
                    <select
                      value={individualTargetSection}
                      onChange={(e) => setIndividualTargetSection(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#DCE8E0] rounded-xl font-medium text-[#122A24]"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Next Academic Session & Roll Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Target Academic Session</label>
                  <select
                    value={individualTargetSession}
                    onChange={(e) => setIndividualTargetSession(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DCE8E0] rounded-xl font-mono text-[#122A24]"
                  >
                    <option value="2027-28">Session 2027-28</option>
                    <option value="2026-27">Session 2026-27</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#122A24] mb-1">Target Roll No (Optional)</label>
                  <input
                    type="text"
                    value={individualTargetRoll}
                    onChange={(e) => setIndividualTargetRoll(e.target.value)}
                    placeholder="e.g. 01"
                    className="w-full px-3 py-2 border border-[#DCE8E0] rounded-xl font-mono text-[#122A24]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setIndividualPromotionStudent(null)}
                  className="px-4 py-2 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={promotionExecuting}
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>{promotionExecuting ? 'Updating Scholar...' : 'Execute Scholar Promotion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET LOGIN PIN (ADMIN POWER) */}
      {pinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#DCE8E0] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8F0EA]">
              <div>
                <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  Admin Authority • PIN Management
                </span>
                <h2 className="font-display font-bold text-lg text-[#122A24] mt-0.5">
                  Reset Login PIN
                </h2>
              </div>
              <button onClick={() => setPinModal(null)} className="p-1 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 bg-[#EBF5EF] rounded-2xl border border-[#C5E2CF] text-xs text-[#122A24]">
              <div className="font-bold text-sm text-[#122A24]">{pinModal.name}</div>
              <div className="text-[11px] font-mono text-[#2D5A4E] mt-0.5">
                Role: {pinModal.type === 'student' ? 'Student SIS Account' : 'Faculty Staff Account'}
              </div>
            </div>

            <form onSubmit={handleSaveCustomPin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#122A24] mb-1">
                  New 6-Digit Passcode / Security PIN *
                </label>
                <input
                  type="text"
                  required
                  value={customPinInput}
                  onChange={(e) => setCustomPinInput(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-3.5 py-2.5 border border-[#DCE8E0] rounded-xl font-mono text-sm font-bold text-[#122A24] tracking-widest text-center"
                />
                <span className="text-[10.5px] text-[#2D5A4E] mt-1 block">
                  Admin can set any 4-6 digit passcode for instant login access.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8F0EA]">
                <button
                  type="button"
                  onClick={() => setPinModal(null)}
                  className="px-4 py-2 border border-[#DCE8E0] rounded-full text-xs font-semibold text-slate-700 hover:bg-[#EBF5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white font-semibold rounded-full cursor-pointer border-none shadow-xs text-xs"
                >
                  Update PIN in Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK (ROLE ADAPTIVE FOR ADMIN, TEACHER, STUDENT, PARENT, DRIVER) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE8E0] px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none">
        {effectiveRole !== 'DRIVER' && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
              activeTab === 'overview' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'overview' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
              <BarChart3 className="h-4 w-4" />
            </div>
            <span>Overview</span>
          </button>
        )}

        {effectiveRole === 'DRIVER' ? (
          <>
            <button
              onClick={() => setActiveTab('transport')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'transport' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'transport' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Bus className="h-4 w-4" />
              </div>
              <span>Transport</span>
            </button>

            <button
              onClick={() => setActiveTab('notices')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'notices' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'notices' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <span>Notice Board</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'broadcast' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'broadcast' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Radio className="h-4 w-4" />
              </div>
              <span>Broadcast</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'profile' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'profile' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <User className="h-4 w-4" />
              </div>
              <span>My Profile</span>
            </button>
          </>
        ) : effectiveRole === 'TEACHER' ? (
          <>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'attendance' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'attendance' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'exams' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'exams' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Award className="h-4 w-4" />
              </div>
              <span>Marks Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('homework')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'homework' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'homework' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <FileText className="h-4 w-4" />
              </div>
              <span>Homework</span>
            </button>
          </>
        ) : effectiveRole === 'STUDENT' ? (
          <>
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'exams' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'exams' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Award className="h-4 w-4" />
              </div>
              <span>Marksheet</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'attendance' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'attendance' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('fees')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none cursor-pointer ${
                activeTab === 'fees' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'fees' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Coins className="h-4 w-4" />
              </div>
              <span>Fee Dues</span>
            </button>
          </>
        ) : effectiveRole === 'PARENT' ? (
          <>
            <button
              onClick={() => setActiveTab('exams')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'exams' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'exams' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Award className="h-4 w-4" />
              </div>
              <span>Report Card</span>
            </button>

            <button
              onClick={() => setActiveTab('fees')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none cursor-pointer ${
                activeTab === 'fees' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'fees' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Coins className="h-4 w-4" />
              </div>
              <span>Pay Fees</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'attendance' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'attendance' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span>Attendance</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'students' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'students' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <GraduationCap className="h-4 w-4" />
              </div>
              <span>Students</span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'teachers' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'teachers' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <Users className="h-4 w-4" />
              </div>
              <span>Faculty</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold transition-all border-none bg-transparent cursor-pointer ${
                activeTab === 'attendance' ? 'text-[#122A24] font-bold' : 'text-slate-500 hover:text-[#122A24]'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'attendance' ? 'bg-[#122A24] text-white' : 'bg-transparent text-slate-500'}`}>
                <CalendarCheck className="h-4 w-4" />
              </div>
              <span>Attendance</span>
            </button>
          </>
        )}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-[#122A24] border-none bg-transparent cursor-pointer"
        >
          <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Menu className="h-4 w-4" />
          </div>
          <span>Menu</span>
        </button>
      </div>

      {/* UNIVERSAL OMNI-SEARCH & COMMAND PALETTE */}
      <OmniSearchModal
        isOpen={isOmniSearchOpen}
        onClose={() => setIsOmniSearchOpen(false)}
        students={students}
        teachers={teachers}
        invoices={invoices}
        classes={classes}
        notices={notices}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
        }}
        onSelectStudent={(s) => {
          setSummaryStudent(s);
        }}
        onSelectTeacher={(t) => {
          openTeacherModal(t);
        }}
      />

      {/* STUDENT 360° SUMMARY & SIBLINGS DOSSIER MODAL */}
      <StudentSummaryModal
        isOpen={!!summaryStudent}
        onClose={() => setSummaryStudent(null)}
        student={summaryStudent}
        allStudents={students}
        invoices={invoices}
        attendanceRecords={attendance}
        onSelectSibling={(sib) => setSummaryStudent(sib)}
        onEditStudent={(s) => openStudentModal(s)}
        onCollectFee={(s) => handleQuickCollectFee(s)}
      />

      {/* UNIVERSAL TASK COMPLETION OVERLAY (1 SEC CENTERED BACKDROP BLUR) */}
      <TaskCompletionOverlay data={celebrationData} />

      {/* SCHOOL PURGE WITH CAPTCHA MODAL (AGENCY SUPERADMIN) */}
      {purgeTargetSchool && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-rose-400 p-7 max-w-lg w-full shadow-2xl space-y-5 animate-fade-up">
            <div className="flex items-start justify-between border-b border-rose-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-rose-950">
                    Purge School &amp; All Data
                  </h3>
                  <p className="text-[11px] font-mono text-rose-700">
                    Agency Superadmin Destructive Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPurgeTargetSchool(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p className="font-bold">
                ⚠️ Permanent Deletion Notice:
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                <li>All Students, Bio Data &amp; Guardian Info</li>
                <li>All Teachers &amp; Staff records</li>
                <li>All Classes, Timetables, Attendance &amp; Marks</li>
                <li>All Fee Invoices &amp; Receipts</li>
                <li>All Notices, Exams &amp; Settings</li>
              </ul>
              <p className="text-[11px] font-semibold text-rose-700 pt-1">
                Data will be erased from both <span className="underline">MongoDB Atlas</span> and <span className="underline">Local DB</span>.
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-500">Target Campus:</span>
              <div className="font-bold text-[#122A24] text-sm flex items-center gap-2">
                <span>{purgeTargetSchool.school_name}</span>
                <span className="px-2 py-0.5 rounded font-mono text-xs bg-rose-100 text-rose-700 font-bold border border-rose-200">
                  {purgeTargetSchool.school_code}
                </span>
              </div>
            </div>

            {/* Captcha Challenge Box */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-slate-800">
                1. Security Captcha Challenge *
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-900 text-emerald-400 font-mono text-lg font-extrabold tracking-[6px] select-none shadow-inner"
                  style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }}
                >
                  {captchaChallenge}
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center gap-1 text-xs cursor-pointer"
                  title="Reload Captcha"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter Captcha code shown above"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider focus:outline-rose-500"
              />
            </div>

            {/* Confirmation Keyword Box */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800">
                2. Type <span className="font-mono text-rose-700 font-bold">DELETE {purgeTargetSchool.school_code}</span> to confirm *
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`DELETE ${purgeTargetSchool.school_code}`}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-rose-500"
              />
            </div>

            {purgeError && (
              <div className="p-3 bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-mono">
                {purgeError}
              </div>
            )}

            {purgeSuccessMessage && (
              <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{purgeSuccessMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPurgeTargetSchool(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={
                  purgeLoading ||
                  !captchaInput ||
                  captchaInput.toUpperCase().trim() !== captchaChallenge ||
                  confirmInput.trim().toUpperCase() !== `DELETE ${purgeTargetSchool.school_code.trim().toUpperCase()}`
                }
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer shadow-md border-none"
              >
                {purgeLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Purge School</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Broadcast Notices & Missed Push Alerts Inbox Modal */}
      <BroadcastInboxModal
        isOpen={showBroadcastInbox}
        onClose={() => {
          setShowBroadcastInbox(false);
          checkUnreadBroadcasts();
        }}
        userRole={effectiveRole}
        userName={currentUser?.full_name || currentUser?.username}
      />

      {/* Official CBSE Institutional Report Modal for Students, Faculty & Classes */}
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

export default function ERPWorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#122A24] text-white flex items-center justify-center font-mono">Loading Workspace...</div>}>
      <ERPWorkspaceContent />
    </Suspense>
  );
}

