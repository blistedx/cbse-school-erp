'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Phone,
  QrCode,
  Sparkles,
  ChevronRight,
  Bus,
  AlertCircle,
  Award,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  User,
  X
} from 'lucide-react';

export interface RoleParentViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function RoleParentView({ activeTab, setActiveTab }: RoleParentViewProps) {
  // Sibling Switcher State
  const [selectedStudent, setSelectedStudent] = useState<'aarav' | 'ananya'>('aarav');
  
  // Fee Payment Sheet Modal State
  const [showFeePaymentModal, setShowFeePaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Leave Application Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);
  const [leaveReason, setLeaveReason] = useState('Medical / Viral Fever');
  const [leaveDays, setLeaveDays] = useState('2');

  // Homework View Modal
  const [selectedHomework, setSelectedHomework] = useState<any | null>(null);

  // Fee Receipt Preview Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const studentData = {
    aarav: {
      name: 'Aarav Sharma',
      class: 'Class VI-A',
      rollNo: '24',
      admNo: 'DPS-2022-8491',
      attendance: 96.4,
      presentDays: 112,
      totalDays: 116,
      avatar: '👦',
      busNo: 'Bus #04 (Route South 2)',
      busEta: '4 mins away',
      pendingFee: '₹28,500',
      bloodGroup: 'B+ Positive',
      house: 'Tagore (Green)',
      classTeacher: 'Mrs. Anjali Gupta (M.Sc, B.Ed)'
    },
    ananya: {
      name: 'Ananya Sharma',
      class: 'Class III-B',
      rollNo: '11',
      admNo: 'DPS-2024-1102',
      attendance: 98.2,
      presentDays: 114,
      totalDays: 116,
      avatar: '👧',
      busNo: 'Bus #04 (Route South 2)',
      busEta: '4 mins away',
      pendingFee: '₹0 (Cleared)',
      bloodGroup: 'O+ Positive',
      house: 'Shivaji (Red)',
      classTeacher: 'Ms. Pooja Malhotra (B.El.Ed)'
    }
  };

  const currentStudent = studentData[selectedStudent];

  // Daily Timetable
  const timetableToday = [
    { period: '1', time: '08:00 - 08:45', subject: 'Mathematics', teacher: 'Mrs. Anjali Gupta', room: 'Room 204', active: false },
    { period: '2', time: '08:45 - 09:30', subject: 'Science (Physics)', teacher: 'Mr. R. K. Nair', room: 'Physics Lab', active: true },
    { period: '3', time: '09:30 - 10:15', subject: 'English Literature', teacher: 'Ms. Sarah Joseph', room: 'Room 204', active: false },
    { period: 'Break', time: '10:15 - 10:45', subject: 'Nutrition / Recess', teacher: 'Courtyard', room: 'Cafeteria', active: false, isBreak: true },
    { period: '4', time: '10:45 - 11:30', subject: 'Social Science', teacher: 'Mr. Vikram Singh', room: 'Room 204', active: false },
    { period: '5', time: '11:30 - 12:15', subject: 'Hindi Core', teacher: 'Dr. Sunita Pant', room: 'Room 204', active: false },
    { period: '6', time: '12:15 - 01:00', subject: 'Computer / AI Lab', teacher: 'Mr. Amit Verma', room: 'IT Lab 2', active: false },
    { period: '7', time: '01:00 - 01:45', subject: 'Physical Education', teacher: 'Coach Pradeep', room: 'Sports Complex', active: false }
  ];

  // Homework items
  const homeworkList = [
    {
      id: 'hw1',
      subject: 'Mathematics',
      title: 'NCERT Chapter 7: Fractions & Decimals',
      desc: 'Complete Exercise 7.4 (Questions 1 to 8) in the homework notebook. Show full step-by-step solutions with number line diagrams.',
      dueDate: 'Tomorrow, 08:00 AM',
      status: 'PENDING',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'hw2',
      subject: 'Science',
      title: 'Lab Worksheet: Separation of Substances',
      desc: 'Fill in the sedimentation and filtration flowchart given on page 42 of the lab manual.',
      dueDate: 'Friday, 30 Aug',
      status: 'SUBMITTED',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800'
    },
    {
      id: 'hw3',
      subject: 'Social Science',
      title: 'Map Work: Major Harappan Sites',
      desc: 'Locate and label Mohenjo-Daro, Harappa, Lothal, and Kalibangan on an outline map of India.',
      dueDate: 'Monday, 02 Sep',
      status: 'PENDING',
      color: 'bg-amber-50 border-amber-200 text-amber-800'
    }
  ];

  // CBSE Report Card Subject Grades
  const cbseMarks = [
    { subject: 'English Core', pt1: 19, halfYearly: 76, maxTotal: 100, totalObtained: 95, grade: 'A1', gp: 10 },
    { subject: 'Hindi Core', pt1: 18, halfYearly: 71, maxTotal: 100, totalObtained: 89, grade: 'A2', gp: 9 },
    { subject: 'Mathematics', pt1: 20, halfYearly: 78, maxTotal: 100, totalObtained: 98, grade: 'A1', gp: 10 },
    { subject: 'Science', pt1: 19, halfYearly: 74, maxTotal: 100, totalObtained: 93, grade: 'A1', gp: 10 },
    { subject: 'Social Science', pt1: 17, halfYearly: 70, maxTotal: 100, totalObtained: 87, grade: 'A2', gp: 9 },
    { subject: 'Information Tech', pt1: 20, halfYearly: 80, maxTotal: 100, totalObtained: 100, grade: 'A1', gp: 10 }
  ];

  // Bus Stop timeline
  const busStops = [
    { name: 'DPS School Campus (Start)', time: '02:00 PM', passed: true },
    { name: 'South Ext Ring Road Stop', time: '02:18 PM', passed: true },
    { name: 'Green Park Main Gate (Your Stop)', time: '02:26 PM', current: true, eta: '4 mins away' },
    { name: 'Hauz Khas Metro Junction', time: '02:35 PM', passed: false },
    { name: 'Saket City Terminal', time: '02:48 PM', passed: false }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Sibling Switcher Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xl shadow-inner">
            {currentStudent.avatar}
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              {currentStudent.name}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                {currentStudent.class}
              </span>
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Adm: {currentStudent.admNo} • Roll: {currentStudent.rollNo}
            </div>
          </div>
        </div>

        {/* Switch Student Pill */}
        <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setSelectedStudent('aarav')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStudent === 'aarav' ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Aarav
          </button>
          <button
            onClick={() => setSelectedStudent('ananya')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              selectedStudent === 'ananya' ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Ananya
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: HOME OVERVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div className="space-y-4 animate-fade-in">
          {/* Live Bus Alert Banner */}
          <div
            onClick={() => setActiveTab('bus')}
            className="p-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-2xl shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center relative">
                <Bus className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <div>
                <div className="text-xs text-blue-200 font-medium flex items-center gap-1.5">
                  <span>Live Bus #04</span>
                  <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 text-[10px] rounded font-bold">
                    On Route
                  </span>
                </div>
                <div className="text-sm font-bold tracking-tight">Approaching Green Park (4 mins)</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>

          {/* Key Metrics Grid (Attendance & Fees) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Attendance Card */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Attendance</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="my-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-800 tracking-tight">{currentStudent.attendance}%</span>
                <span className="text-xs text-neutral-400">Present</span>
              </div>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${currentStudent.attendance}%` }} />
              </div>
              <div className="text-[10px] text-neutral-500 mt-2 flex justify-between">
                <span>{currentStudent.presentDays} Days Attended</span>
                <span className="font-semibold text-emerald-700">Excellent</span>
              </div>
            </div>

            {/* Fee Due Card */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Fee Balance</span>
                <CreditCard className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-neutral-900 tracking-tight">{currentStudent.pendingFee}</div>
                <div className="text-[10px] text-amber-600 font-medium">Q2 Term (Due 15 Sep)</div>
              </div>
              {currentStudent.pendingFee !== '₹0 (Cleared)' ? (
                <button
                  onClick={() => {
                    setActiveTab('fees');
                    setShowFeePaymentModal(true);
                  }}
                  className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <span>Pay Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 py-1.5 px-2 rounded-xl text-center flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Paid in Full
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule / Timetable */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-neutral-900">Today's Class Timetable</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Thursday
              </span>
            </div>

            <div className="space-y-2">
              {timetableToday.slice(0, 4).map((t, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    t.active
                      ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/20'
                      : t.isBreak
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-neutral-50/60 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      t.active ? 'bg-emerald-700 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {t.period}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        {t.subject}
                        {t.active && (
                          <span className="px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[9px] font-bold animate-pulse">
                            NOW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500">{t.teacher} • {t.room}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-neutral-500">{t.time}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('academics')}
              className="w-full mt-3 py-2 text-center text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-100"
            >
              View Full 8-Period Timetable & Diary →
            </button>
          </div>

          {/* Quick Circulars & Notice Highlights */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                Latest CBSE Circulars
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Board Notices</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-neutral-900">CBSE Term-1 Date Sheet Announced</h4>
                  <span className="text-[10px] text-neutral-400 font-mono">28 Aug</span>
                </div>
                <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                  Mid-term examinations for Classes VI to XII will commence from 22nd September 2026. Practical schedules attached.
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-emerald-700">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">PDF Attached (2.1 MB)</span>
                  <span className="hover:underline cursor-pointer">Download Circular →</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-neutral-900">Annual Science Exhibition & Robotron</h4>
                  <span className="text-[10px] text-neutral-400 font-mono">25 Aug</span>
                </div>
                <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                  Students from classes VI upwards are invited to submit prototype project proposals before 5th September.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ACADEMICS & REPORT CARD & HOMEWORK
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'academics' && (
        <div className="space-y-4 animate-fade-in">
          {/* Sub Navigation Tabs inside Academics */}
          <div className="flex items-center gap-2 bg-neutral-200/70 p-1 rounded-xl">
            <button className="flex-1 py-1.5 bg-white text-emerald-950 font-bold text-xs rounded-lg shadow-sm">
              CBSE Report Card
            </button>
            <button className="flex-1 py-1.5 text-neutral-600 hover:text-neutral-900 font-semibold text-xs rounded-lg">
              Daily Homework
            </button>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              + Apply Leave
            </button>
          </div>

          {/* CBSE Digital Report Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-100">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">CBSE Affiliated Format</div>
                <h3 className="font-extrabold text-base text-neutral-900">Term 1 Assessment Report</h3>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-800">92.6%</div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Grade A1
                </div>
              </div>
            </div>

            {/* Subject Marks Table Matrix */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200 pb-1">
                    <th className="py-1 font-bold">Subject</th>
                    <th className="py-1 text-center font-bold">PT (20)</th>
                    <th className="py-1 text-center font-bold">Term (80)</th>
                    <th className="py-1 text-center font-bold">Total</th>
                    <th className="py-1 text-right font-bold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {cbseMarks.map((m, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-2.5 font-semibold text-neutral-800">{m.subject}</td>
                      <td className="py-2.5 text-center font-mono text-neutral-600">{m.pt1}</td>
                      <td className="py-2.5 text-center font-mono text-neutral-600">{m.halfYearly}</td>
                      <td className="py-2.5 text-center font-mono font-bold text-neutral-900">{m.totalObtained}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-700">{m.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Co-Scholastic & Teacher Remarks */}
            <div className="mt-4 pt-3 border-t border-neutral-100 bg-neutral-50 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">Co-Scholastic Activities:</span>
                <span className="font-bold text-neutral-900">Art: A | Discipline: A | Sports: A+</span>
              </div>
              <div className="text-xs text-neutral-600 italic">
                <span className="font-semibold not-italic text-neutral-800">Teacher's Remark: </span>
                "Aarav displays remarkable problem-solving abilities in Mathematics & Science. Active in class discussions."
              </div>
            </div>

            <button
              onClick={() => alert('Downloading official digital CBSE verified report card PDF...')}
              className="w-full mt-3 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Signed CBSE Digital Marksheet (PDF)
            </button>
          </div>

          {/* Active Homework & Class Diary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                Active Homework & Daily Diary
              </h3>
              <span className="text-xs text-neutral-500 font-medium">3 Assigned</span>
            </div>

            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                onClick={() => setSelectedHomework(hw)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm ${hw.color}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border">
                    {hw.subject}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hw.status === 'SUBMITTED' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {hw.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-neutral-900 mt-2">{hw.title}</h4>
                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{hw.desc}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1 font-mono font-medium">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" /> Due: {hw.dueDate}
                  </span>
                  <span className="font-bold text-emerald-700 hover:underline">View Attachment →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: FEES & INSTANT UPI PAYMENT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="space-y-4 animate-fade-in">
          {/* Outstanding Invoice Card */}
          <div className="p-5 bg-gradient-to-br from-[#122A24] to-[#1C443A] text-white rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 font-mono text-8xl font-black">₹</div>
            <div className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Academic Session 2026-27</div>
            <div className="text-3xl font-black text-white mt-1">₹28,500</div>
            <div className="text-xs text-emerald-200 mt-1">Quarter 2 Installment • Due 15 Sep 2026</div>

            <div className="mt-4 pt-3 border-t border-emerald-700/50 space-y-1.5 text-xs text-neutral-200">
              <div className="flex justify-between">
                <span>Tuition & Composite Fee:</span>
                <span className="font-mono font-bold">₹22,000</span>
              </div>
              <div className="flex justify-between">
                <span>Air-Conditioned Transport (Zone 2):</span>
                <span className="font-mono font-bold">₹4,500</span>
              </div>
              <div className="flex justify-between">
                <span>STEM & Robotics Lab Charge:</span>
                <span className="font-mono font-bold">₹2,000</span>
              </div>
            </div>

            <button
              onClick={() => setShowFeePaymentModal(true)}
              className="w-full mt-4 py-3 bg-emerald-400 hover:bg-emerald-300 text-[#122A24] rounded-2xl font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay ₹28,500 with UPI / Card / NetBanking
            </button>
          </div>

          {/* Past Payment Receipts Ledger */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-neutral-900 mb-3 flex items-center justify-between">
              <span>Payment History & Receipts</span>
              <span className="text-xs text-emerald-700 font-semibold">100% Tax Deductible (80C)</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-neutral-900">Quarter 1 (Apr - Jun 2026)</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Paid on 05 Apr 2026 • Ref: UPI-94810294</div>
                  <div className="text-xs font-black text-emerald-800 font-mono mt-0.5">₹28,500</div>
                </div>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3 h-3" /> Receipt
                </button>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-neutral-900">Annual Admission & Caution Deposit</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Paid on 10 Mar 2026 • Ref: HDFC-002931</div>
                  <div className="text-xs font-black text-emerald-800 font-mono mt-0.5">₹15,000</div>
                </div>
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3 h-3" /> Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: LIVE BUS TRACKING & GPS TELEMETRY
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bus' && (
        <div className="space-y-4 animate-fade-in">
          {/* Animated Bus Radar Map Simulated Canvas */}
          <div className="bg-[#122A24] text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-sm tracking-tight text-white">Live Transport GPS</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                Speed: 34 km/h
              </span>
            </div>

            {/* Interactive Visual Route Map Illustration */}
            <div className="my-5 p-4 bg-emerald-950/60 rounded-2xl border border-emerald-800/40 relative">
              <div className="h-1.5 bg-emerald-800 rounded-full w-full relative mb-6">
                <div className="h-full bg-emerald-400 rounded-full w-[60%]" />
                {/* Moving Bus Pin */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-lg animate-bounce"
                  style={{ left: '55%' }}
                >
                  <Bus className="w-4 h-4" />
                </div>
              </div>

              {/* Real-time Status Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-emerald-400 font-semibold block text-[10px] uppercase">Next Stop</span>
                  <span className="font-bold text-white text-sm">Green Park Main Gate</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-semibold block text-[10px] uppercase">Estimated ETA</span>
                  <span className="font-bold text-amber-300 text-sm">4 mins (0.8 km)</span>
                </div>
              </div>
            </div>

            {/* Driver Contact & Safety Card */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white text-neutral-900 font-bold flex items-center justify-center text-sm shadow-inner">
                  👨‍✈️
                </div>
                <div>
                  <div className="font-bold text-white">Ramesh Kumar (Driver)</div>
                  <div className="text-[10px] text-emerald-300">Verified • 12 Yrs Exp</div>
                </div>
              </div>
              <a
                href="tel:9876543210"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl flex items-center gap-1 shadow-sm transition-all"
              >
                <Phone className="w-3 h-3" /> Call Driver
              </a>
            </div>
          </div>

          {/* Route Stop Timeline */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
            <h3 className="font-bold text-sm text-neutral-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              Route #04 Stop Sequence
            </h3>

            <div className="space-y-4 relative pl-3 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {busStops.map((stop, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center z-10 text-[10px] font-bold ${
                      stop.passed
                        ? 'bg-emerald-600 text-white'
                        : stop.current
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {stop.passed ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${stop.current ? 'text-amber-800 font-extrabold' : 'text-neutral-800'}`}>
                        {stop.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">{stop.time}</span>
                    </div>
                    {stop.current && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                        Bus arriving in {stop.eta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: DIGITAL STUDENT ID CARD & PROFILE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-4 animate-fade-in">
          {/* Digital Smart Student ID Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-900 via-teal-900 to-neutral-900 text-white rounded-3xl shadow-xl border border-emerald-500/30 relative overflow-hidden">
            {/* Hologram Ribbon & Crest */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white text-[#122A24] flex items-center justify-center font-bold shadow">
                  🎓
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight text-white">DPS INTERNATIONAL SCHOOL</div>
                  <div className="text-[9px] text-emerald-300 uppercase tracking-widest font-mono">CBSE Affiliation #2130091</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-400 text-neutral-950 rounded-full uppercase">
                2026-27 Pass
              </span>
            </div>

            {/* Student Photo & Vital Details */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-24 rounded-2xl bg-neutral-100 border-2 border-white/40 flex flex-col items-center justify-center text-4xl shadow-inner">
                {currentStudent.avatar}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-white leading-tight">{currentStudent.name}</h3>
                <div className="text-xs text-emerald-300 font-bold">{currentStudent.class} • Roll #{currentStudent.rollNo}</div>
                <div className="text-[11px] text-neutral-300">Admission No: <span className="font-mono text-white font-bold">{currentStudent.admNo}</span></div>
                <div className="text-[11px] text-neutral-300">House: <span className="text-amber-300 font-bold">{currentStudent.house}</span></div>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Blood Group:</span>
                <span className="font-bold text-white">{currentStudent.bloodGroup}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Emergency Parent Phone:</span>
                <span className="font-bold font-mono text-white">+91 98102-38491</span>
              </div>
            </div>

            {/* Dynamic QR Code Gate Pass */}
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between bg-black/40 p-2.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <QrCode className="w-10 h-10 text-white" />
                <div>
                  <div className="text-xs font-bold text-white">Smart RFID Gate Pass</div>
                  <div className="text-[9px] text-neutral-400">Scan at School Bus & Main Gate Turnstile</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Support & Contact Class Teacher */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-neutral-900">Class Teacher & Guardian Contacts</h3>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-neutral-900">{currentStudent.classTeacher}</div>
                <div className="text-[10px] text-neutral-500">Class Teacher • Available: 02:00 PM - 04:00 PM</div>
              </div>
              <button
                onClick={() => alert('Opening WhatsApp / Message note to Class Teacher...')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: FEE PAYMENT CHECKOUT SHEET
          ───────────────────────────────────────────────────────────── */}
      {showFeePaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 max-h-[90%] overflow-y-auto animate-spring-up pb-8 hide-scrollbar">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            
            {!paymentSuccess ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base">CBSE Fee Payment Checkout</h3>
                    <p className="text-xs text-neutral-500">{currentStudent.name} • {currentStudent.class}</p>
                  </div>
                  <button
                    onClick={() => setShowFeePaymentModal(false)}
                    className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mb-4">
                  <div className="text-xs text-emerald-800 font-medium">Total Amount Payable</div>
                  <div className="text-2xl font-black text-emerald-950 font-mono">₹28,500.00</div>
                  <div className="text-[10px] text-emerald-700 mt-1">Includes 0% Convenience Fee on UPI transactions</div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Select Payment Method</div>
                  
                  {/* UPI */}
                  <label
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'upi' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold text-xs text-emerald-800 shadow-sm">
                        UPI
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Google Pay / PhonePe / Paytm / BHIM</div>
                        <div className="text-[10px] text-neutral-500">Fast 1-tap UPI Intent checkout</div>
                      </div>
                    </div>
                    <input type="radio" checked={selectedPaymentMethod === 'upi'} readOnly className="accent-emerald-700" />
                  </label>

                  {/* Debit / Credit Card */}
                  <label
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'card' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-neutral-700" />
                      <div>
                        <div className="text-xs font-bold text-neutral-900">Credit / Debit Card</div>
                        <div className="text-[10px] text-neutral-500">Visa, Mastercard, RuPay, Amex</div>
                      </div>
                    </div>
                    <input type="radio" checked={selectedPaymentMethod === 'card'} readOnly className="accent-emerald-700" />
                  </label>
                </div>

                <button
                  onClick={() => {
                    setPaymentSuccess(true);
                  }}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Pay ₹28,500 Securely
                </button>
              </>
            ) : (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-inner">
                  ✓
                </div>
                <h3 className="font-extrabold text-xl text-neutral-900">Fee Payment Successful!</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Payment of ₹28,500 acknowledged for {currentStudent.name}. Transaction Ref: <span className="font-mono font-bold text-neutral-900">TXN-DPS-2026-98124</span>.
                </p>
                <button
                  onClick={() => {
                    setShowFeePaymentModal(false);
                    setPaymentSuccess(false);
                    setShowReceiptModal(true);
                  }}
                  className="w-full mt-4 py-3 bg-neutral-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Official CBSE Fee Receipt (PDF)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: APPLY LEAVE NOTE
          ───────────────────────────────────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 animate-spring-up pb-8">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-neutral-900 text-base">Apply Student Leave</h3>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveSuccess(false);
                }}
                className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!leaveSuccess ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Reason for Absence</label>
                  <select
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option>Medical / Viral Fever</option>
                    <option>Family Emergency / Out of Station</option>
                    <option>Religious Ceremony</option>
                    <option>External Competition / Sports Meet</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">Number of Days</label>
                  <input
                    type="number"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <button
                  onClick={() => setLeaveSuccess(true)}
                  className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all"
                >
                  Submit Leave Application to Class Teacher
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="font-bold text-sm text-neutral-900">Leave Note Submitted</h4>
                <p className="text-xs text-neutral-500">Class Teacher Mrs. Anjali Gupta has been notified.</p>
                <button
                  onClick={() => {
                    setShowLeaveModal(false);
                    setLeaveSuccess(false);
                  }}
                  className="mt-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: OFFICIAL FEE RECEIPT PREVIEW
          ───────────────────────────────────────────────────────────── */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 max-h-[85%] overflow-y-auto animate-spring-up pb-8 hide-scrollbar">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-neutral-900 text-base">Official CBSE Fee Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Digital Printable Voucher */}
            <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-2xl font-mono text-xs space-y-2 text-neutral-800">
              <div className="text-center pb-2 border-b border-neutral-200">
                <div className="font-bold text-sm text-neutral-900">DPS INTERNATIONAL SCHOOL</div>
                <div className="text-[10px] text-neutral-500">Tax Invoice & Fee Receipt #DPS-2026-8812</div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div>Student: <span className="font-bold">{currentStudent.name}</span></div>
                <div>Adm No: <span className="font-bold">{currentStudent.admNo}</span></div>
                <div>Class: <span className="font-bold">{currentStudent.class}</span></div>
                <div>Date: <span className="font-bold">29 Aug 2026</span></div>
              </div>

              <div className="border-t border-b border-neutral-200 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Tuition & Smart Class:</span>
                  <span>₹22,000</span>
                </div>
                <div className="flex justify-between">
                  <span>School Transport Fee:</span>
                  <span>₹4,500</span>
                </div>
                <div className="flex justify-between">
                  <span>Robotics / STEM Lab:</span>
                  <span>₹2,000</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>Total Amount Paid:</span>
                  <span>₹28,500.00</span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 text-center pt-1">
                Digital System Generated Receipt • Stamp & Seal Verified
              </div>
            </div>

            <button
              onClick={() => {
                alert('Receipt PDF downloaded to device storage.');
                setShowReceiptModal(false);
              }}
              className="w-full mt-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" /> Save PDF to Phone
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: HOMEWORK ATTACHMENT DETAILS
          ───────────────────────────────────────────────────────────── */}
      {selectedHomework && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-neutral-200 animate-spring-up pb-8">
            <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {selectedHomework.subject}
              </span>
              <button
                onClick={() => setSelectedHomework(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-bold text-neutral-900 text-base">{selectedHomework.title}</h3>
            <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{selectedHomework.desc}</p>

            <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <div>
                  <div className="text-xs font-bold text-neutral-900">Worksheet_Chapter7_Ex.pdf</div>
                  <div className="text-[10px] text-neutral-400">1.4 MB • CBSE Curriculum</div>
                </div>
              </div>
              <button
                onClick={() => alert('Opening PDF Attachment...')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Open
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => {
                  alert('Opening camera to photograph completed notebook pages...');
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md"
              >
                Upload Photo Solution 📸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
