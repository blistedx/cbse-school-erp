'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  Filter,
  Search,
  Upload,
  X
} from 'lucide-react';

export interface RoleTeacherViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface StudentAttendanceItem {
  id: string;
  rollNo: string;
  name: string;
  status: 'P' | 'A' | 'L'; // Present, Absent, Late
  avatar: string;
}

export default function RoleTeacherView({ activeTab, setActiveTab }: RoleTeacherViewProps) {
  // Class & Subject Context
  const [selectedClass, setSelectedClass] = useState('VI-A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  // Attendance State
  const [studentsAttendance, setStudentsAttendance] = useState<StudentAttendanceItem[]>([
    { id: 's1', rollNo: '01', name: 'Aadi Deshmukh', status: 'P', avatar: '👦' },
    { id: 's2', rollNo: '02', name: 'Aaradhya Kapoor', status: 'P', avatar: '👧' },
    { id: 's3', rollNo: '03', name: 'Aarav Sharma', status: 'P', avatar: '👦' },
    { id: 's4', rollNo: '04', name: 'Ananya Singhania', status: 'A', avatar: '👧' },
    { id: 's5', rollNo: '05', name: 'Ayush Mehra', status: 'P', avatar: '👦' },
    { id: 's6', rollNo: '06', name: 'Bhavya Joshi', status: 'P', avatar: '👧' },
    { id: 's7', rollNo: '07', name: 'Dhruv Rastogi', status: 'L', avatar: '👦' },
    { id: 's8', rollNo: '08', name: 'Divya Iyer', status: 'P', avatar: '👧' },
    { id: 's9', rollNo: '09', name: 'Hardik Chauhan', status: 'A', avatar: '👦' },
    { id: 's10', rollNo: '10', name: 'Ishita Roy', status: 'P', avatar: '👧' },
    { id: 's11', rollNo: '11', name: 'Kabir Bakshi', status: 'P', avatar: '👦' },
    { id: 's12', rollNo: '12', name: 'Meera Nambiar', status: 'P', avatar: '👧' },
  ]);

  const [sendSmsToAbsentees, setSendSmsToAbsentees] = useState(true);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [filterAttendance, setFilterAttendance] = useState<'ALL' | 'P' | 'A' | 'L'>('ALL');

  // Marks Entry State
  const [examMarks, setExamMarks] = useState<Record<string, number>>({
    s1: 18,
    s2: 19,
    s3: 20,
    s4: 14,
    s5: 17,
    s6: 19,
    s7: 16,
    s8: 18,
    s9: 12,
    s10: 20,
    s11: 15,
    s12: 19
  });
  const [marksSubmitted, setMarksSubmitted] = useState(false);

  // New Homework Form State
  const [hwTitle, setHwTitle] = useState('Chapter 8: Introduction to Algebra & Equations');
  const [hwDesc, setHwDesc] = useState('Solve questions 1 through 10 from Exercise 8.2. Bring draft graph sheet.');
  const [hwDueDate, setHwDueDate] = useState('Tomorrow, 08:00 AM');
  const [hwPublished, setHwPublished] = useState(false);

  // Teacher Leave Form State
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('Casual Leave - Personal Work');
  const [substituteTeacher, setSubstituteTeacher] = useState('Mr. Vikram Singh (Social Science)');
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  const presentCount = studentsAttendance.filter((s) => s.status === 'P').length;
  const absentCount = studentsAttendance.filter((s) => s.status === 'A').length;
  const lateCount = studentsAttendance.filter((s) => s.status === 'L').length;

  const toggleStudentStatus = (id: string) => {
    setStudentsAttendance((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus: 'P' | 'A' | 'L' = s.status === 'P' ? 'A' : s.status === 'A' ? 'L' : 'P';
        return { ...s, status: nextStatus };
      })
    );
  };

  const markAll = (status: 'P' | 'A') => {
    setStudentsAttendance((prev) => prev.map((s) => ({ ...s, status })));
  };

  const calculateGrade = (mark: number) => {
    if (mark >= 18) return { grade: 'A1', color: 'text-emerald-700 bg-emerald-50' };
    if (mark >= 16) return { grade: 'A2', color: 'text-emerald-600 bg-emerald-50' };
    if (mark >= 14) return { grade: 'B1', color: 'text-blue-600 bg-blue-50' };
    if (mark >= 11) return { grade: 'B2', color: 'text-amber-600 bg-amber-50' };
    return { grade: 'C', color: 'text-red-600 bg-red-50' };
  };

  const filteredStudents = studentsAttendance.filter((s) => {
    if (filterAttendance === 'ALL') return true;
    return s.status === filterAttendance;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Teacher Profile & Active Class Pill */}
      <div className="p-4 bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white rounded-3xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-neutral-950 font-bold flex items-center justify-center text-xl shadow-inner">
            👩‍🏫
          </div>
          <div>
            <div className="font-extrabold text-base text-white">Mrs. Anjali Gupta</div>
            <div className="text-xs text-emerald-200">Senior Faculty • Mathematics</div>
            <div className="text-[11px] text-emerald-300 font-mono mt-0.5">Assigned Class: Class VI-A (34 Students)</div>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2 py-1 bg-amber-400/20 border border-amber-300/40 text-amber-300 rounded-xl text-xs font-bold">
            Period 2 Active
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: TEACHER HOME / DASHBOARD
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Roll Call Call-to-Action Banner */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">Daily Attendance</span>
              <h3 className="font-bold text-sm text-neutral-900 mt-0.5">Class VI-A Roll Call</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {presentCount} Present • {absentCount} Absent • {lateCount} Late
              </p>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark Roll Call</span>
            </button>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('homework')}
              className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-sm text-left hover:border-emerald-500 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-neutral-900">Assign Homework</div>
              <div className="text-[10px] text-neutral-500">Dispatch PDF / diary note</div>
            </button>

            <button
              onClick={() => setActiveTab('marks')}
              className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-sm text-left hover:border-emerald-500 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-neutral-900">Enter Exam Marks</div>
              <div className="text-[10px] text-neutral-500">PT-1 & Term 1 Gradebook</div>
            </button>
          </div>

          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                My Teaching Periods Today
              </h3>
              <span className="text-[11px] font-bold text-neutral-400">5 Periods Today</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    P2
                  </span>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      Class VI-A • Mathematics
                      <span className="px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[8px] font-bold animate-pulse">
                        CURRENT
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500">Room 204 • Topic: Decimals</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-600">08:45 AM</span>
              </div>

              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold">
                    P4
                  </span>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">Class VII-B • Mathematics</div>
                    <div className="text-[10px] text-neutral-500">Room 302 • Linear Equations</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-neutral-500">10:45 AM</span>
              </div>

              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center text-xs font-bold">
                    P6
                  </span>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">Class VIII-A • Vedic Maths</div>
                    <div className="text-[10px] text-neutral-500">Room 401 • Speed calculations</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-neutral-500">12:15 PM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ROLL CALL / 1-TAP ATTENDANCE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Controls & Filter Pills */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">Class VI-A Attendance</h3>
                <p className="text-xs text-neutral-500">Tap avatar/badge to cycle Present → Absent → Late</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => markAll('P')}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                >
                  All Present
                </button>
              </div>
            </div>

            {/* Attendance Status Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1">
              <button
                onClick={() => setFilterAttendance('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterAttendance === 'ALL' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                All ({studentsAttendance.length})
              </button>
              <button
                onClick={() => setFilterAttendance('P')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterAttendance === 'P' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setFilterAttendance('A')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterAttendance === 'A' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800'
                }`}
              >
                Absent ({absentCount})
              </button>
              <button
                onClick={() => setFilterAttendance('L')}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterAttendance === 'L' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'
                }`}
              >
                Late ({lateCount})
              </button>
            </div>
          </div>

          {/* Student Swipe / Tap List */}
          <div className="space-y-2">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => toggleStudentStatus(s.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.99] ${
                  s.status === 'P'
                    ? 'bg-white border-neutral-200 hover:border-emerald-400'
                    : s.status === 'A'
                    ? 'bg-red-50/80 border-red-300 ring-1 ring-red-400/20'
                    : 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg border border-neutral-200 shadow-sm">
                    {s.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                      <span className="font-mono text-neutral-400 text-[10px]">#{s.rollNo}</span>
                      {s.name}
                    </div>
                    <div className="text-[10px] text-neutral-500">Class VI-A • Adm: DPS-2022-0{s.rollNo}</div>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <div
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                    s.status === 'P'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : s.status === 'A'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-amber-500 text-white shadow-sm'
                  }`}
                >
                  {s.status === 'P' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  {s.status === 'A' && <X className="w-3.5 h-3.5 stroke-[3]" />}
                  {s.status === 'L' && <Clock className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{s.status === 'P' ? 'PRESENT' : s.status === 'A' ? 'ABSENT' : 'LATE'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Attendance Bar with Instant SMS Toggle */}
          <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-lg space-y-3 sticky bottom-20">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-semibold text-neutral-800">Auto-SMS Alert to {absentCount} Absent Parents</span>
              </div>
              <input
                type="checkbox"
                checked={sendSmsToAbsentees}
                onChange={(e) => setSendSmsToAbsentees(e.target.checked)}
                className="w-4 h-4 accent-emerald-700 rounded"
              />
            </label>

            <button
              onClick={() => {
                setAttendanceSubmitted(true);
                setTimeout(() => setAttendanceSubmitted(false), 4000);
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {attendanceSubmitted ? 'Attendance Submitted & SMS Dispatched! ✓' : `Submit Attendance (${presentCount}/${studentsAttendance.length} Present)`}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: HOMEWORK & CLASSWORK DISPATCHER
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'homework' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-neutral-900">Dispatch New Homework</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Class VI-A
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option>Mathematics</option>
                  <option>Science</option>
                  <option>English Literature</option>
                  <option>Social Science</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  placeholder="e.g. Chapter 8: Fractions & Decimals"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Detailed Instructions</label>
                <textarea
                  rows={3}
                  value={hwDesc}
                  onChange={(e) => setHwDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
                  placeholder="Mention page numbers, exercise questions, or guidelines..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Submission Due Date</label>
                  <input
                    type="text"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Attach Worksheet / Photo</label>
                  <button
                    onClick={() => alert('Opening file picker for PDF/image attachments...')}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold border border-neutral-300 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach File
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setHwPublished(true);
                  setTimeout(() => setHwPublished(false), 4000);
                }}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                {hwPublished ? 'Homework Dispatched to Parents! ✓' : 'Publish to Class Diary & Notify Parents'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: MARKS ENTRY MATRIX
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'marks' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">Periodic Test 1 Marks</h3>
                <p className="text-xs text-neutral-500">Subject: Mathematics (Max Marks: 20)</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                Class VI-A
              </span>
            </div>

            {/* Marks Entry Rows */}
            <div className="divide-y divide-neutral-100">
              {studentsAttendance.map((s) => {
                const mark = examMarks[s.id] ?? 18;
                const gradeInfo = calculateGrade(mark);
                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-neutral-400 font-bold w-5">#{s.rollNo}</span>
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{s.name}</div>
                        <div className="text-[10px] text-neutral-400">Adm: DPS-2022-0{s.rollNo}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          max={20}
                          min={0}
                          value={mark}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setExamMarks((prev) => ({ ...prev, [s.id]: val }));
                          }}
                          className="w-14 p-1.5 rounded-lg border border-neutral-300 text-center font-mono font-bold text-xs bg-neutral-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                        />
                        <span className="text-xs font-mono text-neutral-400">/20</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${gradeInfo.color}`}>
                        {gradeInfo.grade}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setMarksSubmitted(true);
                setTimeout(() => setMarksSubmitted(false), 4000);
              }}
              className="w-full mt-3 py-3 bg-neutral-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {marksSubmitted ? 'Marks Saved to CBSE Central Ledger! ✓' : 'Save Marks & Lock Ledger'}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: TIMETABLE SCHEDULE & STAFF LEAVE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'timetable' && (
        <div className="space-y-4 animate-fade-in">
          {/* Apply Faculty Leave Form */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Faculty Leave Application
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Leave Type</label>
                <select
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option>Casual Leave (CL) - Personal Work</option>
                  <option>Medical Leave (ML)</option>
                  <option>Earned Leave (EL)</option>
                  <option>On-Duty (OD) - CBSE Exam Evaluation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Days</label>
                  <input
                    type="number"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Substituted Faculty</label>
                  <select
                    value={substituteTeacher}
                    onChange={(e) => setSubstituteTeacher(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option>Mr. Vikram Singh</option>
                    <option>Dr. Sunita Pant</option>
                    <option>Ms. Sarah Joseph</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  setLeaveSubmitted(true);
                  setTimeout(() => setLeaveSubmitted(false), 4000);
                }}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                {leaveSubmitted ? 'Submitted to Principal for Approval! ✓' : 'Submit Leave Request to Principal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
