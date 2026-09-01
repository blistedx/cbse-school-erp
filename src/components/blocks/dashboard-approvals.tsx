/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  Check,
  X,
  Filter,
  Users,
  AlertCircle,
  Upload,
  UserCheck,
  Layers,
  ArrowRight,
  Sparkles,
  Printer,
  RefreshCw,
  Send,
  Plus,
  Trash2,
  ArrowRightLeft,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { Teacher, School, SubstitutionItem, AttendanceRecord } from '@/lib/types';

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  designation: string;
  department: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  attachment_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_at: string;
}



export interface DashboardApprovalsProps {
  selectedSchool?: School | null;
  teachers?: Teacher[];
  attendance?: AttendanceRecord[];
  selectedSession?: string;
  isSuperAdmin?: boolean;
}

export function DashboardApprovals({
  selectedSchool,
  teachers = [],
  attendance = [],
  selectedSession = '2026-27'
}: DashboardApprovalsProps) {
  // Leave Applications State
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([
    {
      id: 'LV-2026-001',
      employee_id: teachers[0]?.id || 'EMP-01',
      employee_name: teachers[0]?.full_name || 'Dr. Rajesh Sharma',
      designation: teachers[0]?.designation || 'Senior Faculty',
      department: teachers[0]?.department || 'Mathematics',
      leave_type: 'Casual Leave (CL)',
      start_date: '2026-09-02',
      end_date: '2026-09-03',
      days: 2,
      reason: 'Attending National CBSE Pedagogy Conference in New Delhi.',
      status: 'PENDING',
      applied_at: '2026-08-30'
    }
  ]);

  // Form State
  const [applicantId, setApplicantId] = useState<string>(teachers[0]?.id || '');
  const [leaveType, setLeaveType] = useState<string>('Casual Leave (CL) — Paid');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // ─────────────────────────────────────────────────────────────
  // SMART TEACHER SUBSTITUTION AUTO-SCHEDULER ENGINE STATE
  // ─────────────────────────────────────────────────────────────
  const [substitutions, setSubstitutions] = useState<SubstitutionItem[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showQuickAbsentModal, setShowQuickAbsentModal] = useState(false);
  const [simulatedAbsentId, setSimulatedAbsentId] = useState('');
  const [simulatedAbsentReason, setSimulatedAbsentReason] = useState('Medical Leave (Emergency)');

  // Auto-set first teacher if empty
  React.useEffect(() => {
    if (teachers.length > 0 && !applicantId) {
      setApplicantId(teachers[0].id);
    }
  }, [teachers, applicantId]);

  // Derived Stats
  const pendingCount = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'PENDING').length;
  }, [leaveApplications]);

  const approvedLeaves = useMemo(() => {
    return leaveApplications.filter(l => l.status === 'APPROVED');
  }, [leaveApplications]);

  const casualDaysUsed = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Casual'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  const medicalDaysUsed = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Medical'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  const halfDaysCount = useMemo(() => {
    return approvedLeaves
      .filter(l => l.leave_type.includes('Half'))
      .reduce((acc, l) => acc + l.days, 0);
  }, [approvedLeaves]);

  // Today's On-Leave Faculty (Approved Leaves + Daily Faculty Attendance Roll Call)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOnLeaveFaculty = useMemo(() => {
    const list = [...approvedLeaves.filter(l => todayStr >= l.start_date && todayStr <= l.end_date)];

    // Also auto-detect teachers marked ABSENT or LEAVE in daily attendance
    if (Array.isArray(attendance)) {
      const todayFacAtt = attendance.find(a => 
        a.date === todayStr && 
        (a.class_name?.toLowerCase() === 'faculty' || a.class_name?.toLowerCase() === 'staff')
      );
      if (todayFacAtt?.student_records) {
        todayFacAtt.student_records.forEach((rec: any) => {
          if (rec.status === 'ABSENT' || rec.status === 'LEAVE') {
            const alreadyInList = list.some(l => l.employee_id === (rec.student_id || rec.teacher_id));
            if (!alreadyInList) {
              const tObj = teachers.find(t => t.id === (rec.student_id || rec.teacher_id) || t.full_name === rec.full_name);
              if (tObj) {
                list.push({
                  id: `LV-ATT-${tObj.id}`,
                  employee_id: tObj.id,
                  employee_name: tObj.full_name,
                  designation: tObj.designation || 'Faculty',
                  department: tObj.department || 'Academics',
                  leave_type: rec.status === 'LEAVE' ? 'Authorized Leave' : 'Marked Absent (Roll Call)',
                  start_date: todayStr,
                  end_date: todayStr,
                  days: 1,
                  reason: 'Marked Absent during morning staff attendance',
                  status: 'APPROVED',
                  applied_at: todayStr
                });
              }
            }
          }
        });
      }
    }

    return list;
  }, [approvedLeaves, todayStr, attendance, teachers]);

  // Standard CBSE 8-Period Timetable Matrix
  const STANDARD_PERIODS = useMemo(() => [
    { period_no: 1, time: '08:30 - 09:15 AM' },
    { period_no: 2, time: '09:15 - 10:00 AM' },
    { period_no: 3, time: '10:00 - 10:45 AM' },
    { period_no: 4, time: '11:00 - 11:45 AM' },
    { period_no: 5, time: '11:45 - 12:30 PM' },
    { period_no: 6, time: '12:30 - 01:15 PM' },
    { period_no: 7, time: '01:45 - 02:25 PM' },
    { period_no: 8, time: '02:25 - 03:05 PM' }
  ], []);

  // Helper to determine a teacher's schedule today (deterministic mapping from assigned classes)
  const getTeacherDailySlots = React.useCallback((teacher: Teacher) => {
    const slots: { period_no: number; class_name: string; section: string; subject: string }[] = [];
    const subjects = teacher.subjects || [teacher.department || 'General'];
    const assignedClass = teacher.assigned_class || 'Class 9-A';
    const parts = assignedClass.split(' ');
    const cls = parts[0] + (parts[1] ? ' ' + parts[1].charAt(0) : ' 9');
    const sec = parts[1]?.slice(-1) || 'A';

    // Spread 4-5 teaching periods per day for realistic CBSE schedule
    const periodsToTeach = [2, 4, 6, 7];
    periodsToTeach.forEach((p, idx) => {
      slots.push({
        period_no: p,
        class_name: idx % 2 === 0 ? assignedClass : 'Class 10-B',
        section: idx % 2 === 0 ? sec : 'B',
        subject: subjects[idx % subjects.length] || teacher.department || 'General'
      });
    });
    return slots;
  }, []);

  // Intelligent Auto-Assignment Solver Engine
  const handleAutoAssignSubstitutions = () => {
    setIsSolving(true);
    setTimeout(() => {
      const activeLeaves = todayOnLeaveFaculty;
      if (activeLeaves.length === 0) {
        setIsSolving(false);
        return;
      }

      const absentTeacherIds = new Set(activeLeaves.map(l => l.employee_id));
      const presentTeachers = teachers.filter(t => !absentTeacherIds.has(t.id));
      
      const newSubstitutions: SubstitutionItem[] = [];
      const teacherSubCount: { [teacherId: string]: number } = {};
      presentTeachers.forEach(t => { teacherSubCount[t.id] = 0; });

      activeLeaves.forEach(leave => {
        const absentTeacher = teachers.find(t => t.id === leave.employee_id);
        const absentName = leave.employee_name;
        const absentDept = absentTeacher?.department || 'Academics';
        const slots = absentTeacher ? getTeacherDailySlots(absentTeacher) : [
          { period_no: 2, class_name: 'Class 9-A', section: 'A', subject: 'Mathematics' },
          { period_no: 4, class_name: 'Class 10-B', section: 'B', subject: 'Mathematics' },
          { period_no: 6, class_name: 'Class 8-C', section: 'C', subject: 'Science' }
        ];

        slots.forEach(slot => {
          const pInfo = STANDARD_PERIODS.find(p => p.period_no === slot.period_no) || { time: 'Period ' + slot.period_no };
          
          // Find candidates who are free in this period
          const candidates = presentTeachers.filter(cand => {
            // Check if already assigned a substitution in this period
            const alreadyAssignedInPeriod = newSubstitutions.some(
              s => s.period_no === slot.period_no && s.substitute_teacher_id === cand.id
            );
            if (alreadyAssignedInPeriod) return false;

            // Check if cand has their own regular class in this period
            const candSlots = getTeacherDailySlots(cand);
            const isTeaching = candSlots.some(cs => cs.period_no === slot.period_no);
            return !isTeaching;
          });

          // Rank candidates: Subject match (+100), Department match (+60), Low load (+20)
          let bestCandidate: Teacher | null = null;
          let bestScore = -1;
          let reason: 'SUBJECT_SPECIALIST' | 'BALANCED_LOAD' | 'MANUAL_SWAP' = 'BALANCED_LOAD';

          candidates.forEach(cand => {
            let score = 50 - (teacherSubCount[cand.id] || 0) * 15;
            const candSubjects = cand.subjects || [cand.department || ''];
            const candDept = cand.department || '';

            if (candSubjects.some(s => s.toLowerCase().includes(slot.subject.toLowerCase()))) {
              score += 100;
            } else if (candDept.toLowerCase().includes(absentDept.toLowerCase())) {
              score += 60;
            }

            if (score > bestScore) {
              bestScore = score;
              bestCandidate = cand;
              reason = score >= 100 ? 'SUBJECT_SPECIALIST' : 'BALANCED_LOAD';
            }
          });

          const chosen = bestCandidate || candidates[0] || presentTeachers[0];
          if (chosen) {
            teacherSubCount[chosen.id] = (teacherSubCount[chosen.id] || 0) + 1;
            newSubstitutions.push({
              id: `SUB-${slot.period_no}-${slot.class_name.replace(/\s+/g, '')}-${Date.now()}`,
              period_no: slot.period_no,
              period_time: pInfo.time,
              class_name: slot.class_name,
              section: slot.section,
              subject: slot.subject,
              absent_teacher_id: leave.employee_id,
              absent_teacher_name: absentName,
              substitute_teacher_id: chosen.id,
              substitute_teacher_name: chosen.full_name,
              match_reason: reason,
              status: 'CONFIRMED',
              date: todayStr
            });
          }
        });
      });

      setSubstitutions(newSubstitutions);
      setIsSolving(false);
    }, 600);
  };

  // Manual Substitution Swap
  const handleSwapSubstitute = (subId: string, newTeacherId: string) => {
    const targetTeacher = teachers.find(t => t.id === newTeacherId);
    if (!targetTeacher) return;
    setSubstitutions(prev => prev.map(s => {
      if (s.id !== subId) return s;
      return {
        ...s,
        substitute_teacher_id: targetTeacher.id,
        substitute_teacher_name: targetTeacher.full_name,
        match_reason: 'MANUAL_SWAP'
      };
    }));
  };

  // Notify Substitute Teachers
  const handleNotifySubstitutes = () => {
    if (substitutions.length === 0) return;
    setSubstitutions(prev => prev.map(s => ({ ...s, status: 'NOTIFIED' })));
    setNotifySuccessMsg(`Broadcast sent! ${substitutions.length} faculty adjustments transmitted to teacher portals & WhatsApp.`);
    setTimeout(() => setNotifySuccessMsg(''), 4500);
  };

  // Quick Simulate Absent Teacher
  const handleQuickAddAbsent = () => {
    if (!simulatedAbsentId) return;
    const teacher = teachers.find(t => t.id === simulatedAbsentId);
    if (!teacher) return;

    const newApp: LeaveApplication = {
      id: `LV-${Date.now()}`,
      employee_id: teacher.id,
      employee_name: teacher.full_name,
      designation: teacher.designation || 'Faculty Member',
      department: teacher.department || 'Academics',
      leave_type: simulatedAbsentReason,
      start_date: todayStr,
      end_date: todayStr,
      days: 1,
      reason: simulatedAbsentReason,
      status: 'APPROVED',
      applied_at: todayStr
    };

    setLeaveApplications(prev => [newApp, ...prev]);
    setShowQuickAbsentModal(false);
  };

  // Auto-run smart solver when on-leave faculty changes and substitutions empty
  React.useEffect(() => {
    if (todayOnLeaveFaculty.length > 0 && substitutions.length === 0) {
      handleAutoAssignSubstitutions();
    }
  }, [todayOnLeaveFaculty]);

  // Form Submit Handler
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a brief reason for the leave application.');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === applicantId) || teachers[0];
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
    const computedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newApp: LeaveApplication = {
      id: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
      employee_id: selectedTeacher?.id || 'EMP-101',
      employee_name: selectedTeacher?.full_name || 'Staff Member',
      designation: selectedTeacher?.designation || 'Faculty',
      department: selectedTeacher?.department || 'Academics',
      leave_type: leaveType.split('—')[0].trim(),
      start_date: startDate,
      end_date: endDate,
      days: leaveType.includes('Half') ? 0.5 : computedDays,
      reason: reason.trim(),
      attachment_name: fileName || undefined,
      status: 'PENDING',
      applied_at: new Date().toISOString().split('T')[0]
    };

    setLeaveApplications(prev => [newApp, ...prev]);
    setReason('');
    setFileName('');
    setSuccessMsg('Leave application submitted successfully for management approval!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setLeaveApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          TOP BANNER: EMPLOYEE LEAVE & APPROVALS STUDIO
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 bg-[#122A24] text-white border border-[#1C443A] shadow-lg relative overflow-hidden">
        {/* Background Watermark Behind Header Text */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none select-none absolute right-2 sm:right-6 top-1 font-poster font-black uppercase text-white/[0.08] sm:text-white/[0.12] text-7xl sm:text-9xl lg:text-[130px] leading-none z-0 tracking-tight"
        >
          APPROVALS
        </div>
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-48 h-48 rounded-full bg-[#34D399]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-mono text-xs font-semibold border border-white/10">
              <span>Staff Self-Service Leave Portal • Auto-Attendance Sync</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
              Employee Leave &amp; Approvals Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Apply for Casual Leave (CL), Medical Leave (ML) or Half Days. Approved leaves automatically update employee attendance records and compute Loss of Pay (LOP) deductions for monthly payroll.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shrink-0">
            <span className="text-xs font-mono font-bold text-emerald-300">Session {selectedSession}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: 4 SUMMARY KPI STAT CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-0">
        
        {/* Card 1: Casual Leave */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            01
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              CASUAL LEAVE (CL)
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{casualDaysUsed} / 12</span>
              <span className="text-xs font-mono font-normal text-slate-400">Days Used</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-700">
            ✓ 100% Paid Leave Quota
          </div>
        </div>

        {/* Card 2: Medical Leave */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            02
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              MEDICAL LEAVE (ML)
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{medicalDaysUsed} / 10</span>
              <span className="text-xs font-mono font-normal text-slate-400">Days Used</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            Requires Medical Certificate
          </div>
        </div>

        {/* Card 3: Half Days */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            03
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HALF DAYS
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#122A24] mt-1.5 flex items-baseline gap-1.5">
              <span>{halfDaysCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">Taken</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
            0.5 Day deduction per application
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="rounded-3xl p-5 sm:p-6 bg-white border border-[#E2ECE5] shadow-xs tile-hover-card relative overflow-hidden flex flex-col justify-between group">
          <span className="absolute right-3 top-2 text-5xl font-display font-black text-slate-100/90 pointer-events-none select-none">
            04
          </span>
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              PENDING APPROVALS
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-amber-700 mt-1.5 flex items-baseline gap-1.5">
              <span>{pendingCount}</span>
              <span className="text-xs font-mono font-normal text-slate-400">Applications</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-700 font-semibold">
            Requires Management Review
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 3: FACULTY MEMBERS ON LEAVE TODAY & AUTOMATIC SUBSTITUTION ROSTER
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          ROW 3: SMART TEACHER SUBSTITUTION AUTO-SCHEDULER ENGINE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8F0EA]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </span>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Smart Faculty Timetable &amp; Auto-Substitution Scheduler
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                AI SMART SCHEDULER
              </span>
            </div>
            <p className="text-xs text-[#2D5A4E]">
              Detects faculty on leave, scans free periods, prioritizes subject specialists, balances faculty workload, and broadcasts adjustment slips.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowQuickAbsentModal(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-[#122A24] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mark Teacher Absent</span>
            </button>

            <button
              type="button"
              onClick={handleAutoAssignSubstitutions}
              disabled={isSolving || todayOnLeaveFaculty.length === 0}
              className="px-4 py-1.5 rounded-xl bg-[#122A24] hover:bg-[#1C443A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
              <span>{isSolving ? 'Solving Slots...' : '⚡ Auto-Assign Substitutions'}</span>
            </button>

            {substitutions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleNotifySubstitutes}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Send alerts to substitute teachers"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Notify Teachers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print official CBSE substitution chart"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Circular</span>
                </button>
              </>
            )}
          </div>
        </div>

        {notifySuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notifySuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Today's On-Leave Faculty (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                TODAY'S ON-LEAVE FACULTY ({todayOnLeaveFaculty.length})
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {todayOnLeaveFaculty.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold space-y-2 text-center shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm">100% Faculty Present Today!</div>
                <p className="text-[11px] text-emerald-800 font-normal">
                  All scheduled periods running on time. Use the button below to mark today's absent teachers and trigger smart substitutions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (teachers.length > 0 && !simulatedAbsentId) {
                      setSimulatedAbsentId(teachers[0].id);
                    }
                    setShowQuickAbsentModal(true);
                  }}
                  className="mt-2 px-4 py-2 bg-[#122A24] hover:bg-[#1C443A] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs border-none transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Teacher Absent Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayOnLeaveFaculty.map(l => {
                  const tObj = teachers.find(t => t.id === l.employee_id);
                  const affectedSlots = tObj ? getTeacherDailySlots(tObj) : [];
                  return (
                    <div key={l.id} className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-[#122A24] text-sm">{l.employee_name}</div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900">
                          {l.leave_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-900 flex items-center gap-2">
                        <span>{tObj?.designation || 'Faculty'}</span>
                        <span>•</span>
                        <span>{tObj?.department || 'Academics'}</span>
                      </div>
                      <div className="text-[10.5px] font-mono text-rose-700 font-semibold pt-1 border-t border-amber-200/60">
                        ⚡ {affectedSlots.length} Periods Affected Today
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Automatic Substitution Matrix (8 Cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                SMART ARRANGEMENT ROSTER ({substitutions.length} SLOTS)
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold">
                {substitutions.filter(s => s.status === 'NOTIFIED').length > 0 ? '✓ Broadcast Dispatched' : '• Ready to Confirm'}
              </span>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0] bg-[#F8FAF9] shadow-2xs">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-white">
                    <th className="py-2.5 px-3">PERIOD</th>
                    <th className="py-2.5 px-3">CLASS &amp; SUBJECT</th>
                    <th className="py-2.5 px-3">ABSENT TEACHER</th>
                    <th className="py-2.5 px-3">AUTO-ASSIGNED SUBSTITUTE</th>
                    <th className="py-2.5 px-3 text-right">MANUAL SWAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8F0EA] text-slate-700">
                  {substitutions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#122A24] font-mono">Period {sub.period_no}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{sub.period_time}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#122A24]">{sub.class_name}</div>
                        <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-700" />
                          <span>{sub.subject}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-rose-900">{sub.absent_teacher_name}</div>
                        <div className="text-[10px] text-rose-600 font-mono">On Leave</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{sub.substitute_teacher_name}</span>
                        </div>
                        <div className="mt-0.5">
                          {sub.match_reason === 'SUBJECT_SPECIALIST' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              🎯 Subject Specialist
                            </span>
                          ) : sub.match_reason === 'BALANCED_LOAD' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ⚖️ Balanced Workload
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              🔄 Manual Override
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={sub.substitute_teacher_id}
                          onChange={(e) => handleSwapSubstitute(sub.id, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 text-[11px] bg-white text-slate-700 font-semibold focus:outline-emerald-600 cursor-pointer shadow-2xs"
                        >
                          {teachers
                            .filter(t => t.id !== sub.absent_teacher_id)
                            .map(t => (
                              <option key={t.id} value={t.id}>
                                {t.full_name} ({t.department || 'Faculty'})
                              </option>
                            ))}
                        </select>
                      </td>
                    </tr>
                  ))}

                  {substitutions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-xs text-slate-400 font-mono">
                        {todayOnLeaveFaculty.length === 0
                          ? 'No substitutions required today. All scheduled classes are running smoothly.'
                          : 'Click "⚡ Auto-Assign Substitutions" above to generate intelligent period arrangements.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 4: APPLY FOR LEAVE (4 COLS) + LEAVE HISTORY TABLE (8 COLS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Apply For Leave Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5 relative">
          <span className="absolute right-6 top-5 text-4xl font-display font-black text-slate-100 select-none pointer-events-none">
            01
          </span>

          <div className="pb-3 border-b border-[#E8F0EA]">
            <h2 className="font-display font-bold text-base text-[#122A24]">
              Apply For Leave
            </h2>
            <p className="text-xs text-[#2D5A4E]">
              Submit request for management approval
            </p>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-[#EBF5EF] border border-[#C5E2CF] text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-4">
            {/* Applicant Employee */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Applicant Employee</label>
              <select
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#C5E2CF] rounded-xl text-xs font-semibold text-[#122A24] focus:outline-none cursor-pointer shadow-2xs"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.staff_code || t.id}) — {t.department || 'Faculty'}
                  </option>
                ))}
                {teachers.length === 0 && (
                  <option value="">No registered teachers found</option>
                )}
              </select>
            </div>

            {/* Leave Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE8E0] rounded-xl text-xs font-medium text-[#122A24] focus:outline-none cursor-pointer"
              >
                <option value="Casual Leave (CL) — Paid">Casual Leave (CL) — Paid</option>
                <option value="Medical Leave (ML) — Paid">Medical Leave (ML) — Paid</option>
                <option value="Half Day (HD) — 0.5 Day">Half Day (HD) — 0.5 Day</option>
                <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
                <option value="Loss of Pay (LOP) Leave">Loss of Pay (LOP) Leave</option>
              </select>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#122A24] mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs font-mono font-bold text-[#122A24]"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#122A24]">Reason for Leave</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the reason for leave..."
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#DCE8E0] rounded-xl text-xs text-[#122A24] focus:outline-none focus:bg-white resize-none"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#122A24]">Medical Certificate / Attachment (Optional)</label>
              <input
                type="file"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-[#DCE8E0] file:bg-white file:text-xs file:font-semibold file:text-[#122A24] hover:file:bg-slate-50 cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#122A24] hover:bg-[#1C443A] text-white font-display font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <span>Submit Leave Application →</span>
            </button>
          </form>
        </div>


        {/* Right Column: Leave Application History Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#DCE8E0] shadow-xs space-y-5 relative">
          <span className="absolute right-6 top-5 text-4xl font-display font-black text-slate-100 select-none pointer-events-none">
            02
          </span>

          <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
            <div>
              <h2 className="font-display font-bold text-base text-[#122A24]">
                Leave Application History
              </h2>
              <p className="text-xs text-[#2D5A4E]">
                All submitted faculty &amp; employee leave requests
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              Total {leaveApplications.length}
            </span>
          </div>

          <div className="overflow-x-auto w-full rounded-2xl border border-[#DCE8E0]">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-[#E8F0EA] text-[10.5px] font-mono text-slate-400 uppercase bg-[#F8FAF9]">
                  <th className="py-2.5 px-3.5">EMPLOYEE</th>
                  <th className="py-2.5 px-3">LEAVE TYPE</th>
                  <th className="py-2.5 px-3">DATE RANGE</th>
                  <th className="py-2.5 px-3">DAYS</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F0EA] text-slate-700">
                {leaveApplications.map(app => (
                  <tr key={app.id} className="hover:bg-[#F9FCFA] transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-[#122A24]">{app.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.designation} • {app.department}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {app.leave_type}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {app.start_date} → {app.end_date}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#122A24]">
                      {app.days}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] border-none cursor-pointer transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10.5px] border border-rose-200 cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-mono">
                      No leave applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: QUICK SIMULATE / MARK ABSENT TEACHER */}
      {showQuickAbsentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8F0EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#122A24]">
                    Mark Teacher Absent Today
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Triggers Automatic Period Substitution
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAbsentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Select Absent Faculty Member *</label>
                <select
                  value={simulatedAbsentId}
                  onChange={(e) => setSimulatedAbsentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} — {t.department || 'Faculty'} ({t.assigned_class || 'Class 9-A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Absence Reason / Leave Type *</label>
                <select
                  value={simulatedAbsentReason}
                  onChange={(e) => setSimulatedAbsentReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option>Medical Leave (Sudden Sickness)</option>
                  <option>Casual Leave (Personal Emergency)</option>
                  <option>CBSE Evaluation Duty</option>
                  <option>Official School Training</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowQuickAbsentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddAbsent}
                disabled={!simulatedAbsentId}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer shadow-sm transition-all"
              >
                Mark Absent &amp; Re-arrange Slots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL CBSE SUBSTITUTION CIRCULAR (PRINTABLE) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DCE8E0] p-7 max-w-2xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-700" />
                <h3 className="font-display font-bold text-base text-[#122A24]">
                  Official CBSE Daily Faculty Substitution Circular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Official Letterhead Printable Sheet */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4 font-mono">
              <div className="text-center pb-3 border-b border-slate-300 space-y-0.5">
                <div className="font-bold text-base text-[#122A24] font-serif uppercase tracking-wider">
                  {selectedSchool?.school_name || 'Delhi Public School'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Affiliated to Central Board of Secondary Education (CBSE)
                </div>
                <div className="text-xs font-bold text-emerald-900 pt-1">
                  DAILY CLASS ADJUSTMENT &amp; SUBSTITUTION ROSTER
                </div>
                <div className="text-[11px] text-slate-600 font-bold">
                  Date: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold">
                    <th className="p-1.5 border border-slate-300">Period</th>
                    <th className="p-1.5 border border-slate-300">Class</th>
                    <th className="p-1.5 border border-slate-300">Subject</th>
                    <th className="p-1.5 border border-slate-300">Absent Faculty</th>
                    <th className="p-1.5 border border-slate-300">Assigned Substitute</th>
                    <th className="p-1.5 border border-slate-300 text-center">Staff Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {substitutions.map((s, idx) => (
                    <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-100/60'}>
                      <td className="p-1.5 border border-slate-300 font-bold">P{s.period_no} ({s.period_time.split(' ')[0]})</td>
                      <td className="p-1.5 border border-slate-300 font-bold">{s.class_name}</td>
                      <td className="p-1.5 border border-slate-300">{s.subject}</td>
                      <td className="p-1.5 border border-slate-300 text-rose-800">{s.absent_teacher_name}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-emerald-900">{s.substitute_teacher_name}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-serif text-[10px] text-slate-400">______________</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between pt-6 text-[10.5px]">
                <div>
                  <div>Prepared By: <strong>Academic In-Charge</strong></div>
                  <div className="text-slate-400 mt-4">Signature: ______________</div>
                </div>
                <div className="text-right">
                  <div>Approved By: <strong>Principal / Head of School</strong></div>
                  <div className="text-slate-400 mt-4">Official Seal &amp; Signature: ______________</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#122A24] hover:bg-[#1C443A] flex items-center gap-1.5 border-none cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
